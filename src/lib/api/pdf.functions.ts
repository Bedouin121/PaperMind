import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { parsePdf, chunkText } from "../pdfParser.server";
import { embedText, embedBatch } from "../embeddings.server";
import { setStore, getStore, retrieveTopK, clearStore } from "../vectorStore.server";
import {
  getLlmApiKey,
  getLlmChatCompletionsUrl,
  getLlmModelCandidates,
  getLlmRequestHeaders,
  isModelChannelUnavailable,
} from "../config.server";

function formatLlmApiError(
  status: number,
  errText: string,
  model: string,
  triedModels: string[],
): string {
  if (errText.includes("unauthorized_client")) {
    return (
      "AgentRouter blocked this request (unauthorized client). " +
      "Restart the dev server after pulling the latest code — client headers are required."
    );
  }
  if (errText.includes("无权访问模型") || errText.includes("no permission")) {
    return (
      `Your AgentRouter token cannot use model "${model}". ` +
      "Set LLM_MODEL in .env to a model enabled at https://agentrouter.org/console/token."
    );
  }
  if (isModelChannelUnavailable(status, errText)) {
    return (
      `No AgentRouter channel is available for "${model}" (tried: ${triedModels.join(", ")}). ` +
      "DeepSeek may be offline on your account — set LLM_MODEL=claude-haiku-4-5-20251001 in .env, or try again later."
    );
  }
  return `LLM API error ${status}: ${errText}`;
}

async function chatCompletion(
  key: string,
  model: string,
  systemPrompt: string,
  question: string,
): Promise<Response> {
  return fetch(getLlmChatCompletionsUrl(), {
    method: "POST",
    headers: {
      ...getLlmRequestHeaders(),
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      temperature: 0.2,
      max_tokens: 1024,
    }),
  });
}

// ─── Upload & Index ────────────────────────────────────────────────────────────

export const uploadAndIndexPdf = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      fileBase64: z.string().min(1),
      filename: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const { fileBase64, filename } = data;

    const buffer = Buffer.from(fileBase64, "base64");

    let text: string;
    try {
      text = await parsePdf(buffer);
    } catch (err) {
      throw new Error(`Failed to parse PDF: ${String(err)}`);
    }

    if (!text || text.trim().length === 0) {
      throw new Error("No readable text found in the PDF. It may be a scanned image-only PDF.");
    }

    const rawChunks = chunkText(text);
    if (rawChunks.length === 0) {
      throw new Error("Could not extract any text chunks from the PDF.");
    }

    const embeddings = await embedBatch(rawChunks);

    const chunks = rawChunks.map((text, index) => ({
      text,
      embedding: embeddings[index],
      index,
    }));

    setStore(filename, chunks);

    return {
      success: true,
      filename,
      chunkCount: chunks.length,
      charCount: text.length,
    };
  });

// ─── Ask a Question ────────────────────────────────────────────────────────────

export const askQuestion = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      question: z.string().min(1).max(2000),
    }),
  )
  .handler(async ({ data }) => {
    const { question } = data;

    const store = getStore();
    if (!store) {
      throw new Error("No PDF loaded. Please upload a PDF first.");
    }

    const questionEmbedding = await embedText(question);
    const topChunks = retrieveTopK(questionEmbedding, 5);

    if (topChunks.length === 0) {
      throw new Error("Could not find relevant context in the document.");
    }

    const contextBlocks = topChunks.map((chunk, i) => `[Source ${i + 1}]\n${chunk.text}`);
    const context = contextBlocks.join("\n\n---\n\n");

    const key = getLlmApiKey();

    if (!key) {
      return {
        answer:
          "⚠️ No LLM API key set (AGENTROUTER_API_KEY or OPENROUTER_API_KEY in .env). Here are the most relevant passages from your PDF:\n\n" +
          topChunks.map((c, i) => `**Source ${i + 1}:** ${c.text}`).join("\n\n"),
        sources: topChunks.map((c) => ({
          index: c.index,
          text: c.text.slice(0, 200) + (c.text.length > 200 ? "…" : ""),
        })),
        isStub: true,
      };
    }

    const systemPrompt = `You are a precise document assistant. Answer the user's question using ONLY the context below. 
If the answer isn't in the context, say "I couldn't find that in the document."
Always cite which source(s) you used using [Source N] notation.

Context:
${context}`;

    const models = getLlmModelCandidates();
    let response: Response | undefined;
    let lastStatus = 0;
    let lastErrText = "";
    let lastModel = models[0];

    for (const model of models) {
      lastModel = model;
      response = await chatCompletion(key, model, systemPrompt, question);
      if (response.ok) break;
      lastStatus = response.status;
      lastErrText = await response.text();
      if (!isModelChannelUnavailable(lastStatus, lastErrText)) break;
    }

    if (!response?.ok) {
      throw new Error(formatLlmApiError(lastStatus, lastErrText, lastModel, models));
    }

    const json = (await response.json()) as {
      choices: { message: { content: string } }[];
    };

    const answer = json.choices?.[0]?.message?.content ?? "No response from model.";

    return {
      answer,
      sources: topChunks.map((c) => ({
        index: c.index,
        text: c.text.slice(0, 200) + (c.text.length > 200 ? "…" : ""),
      })),
      isStub: false,
    };
  });

// ─── Status Check ──────────────────────────────────────────────────────────────

export const getPdfStatus = createServerFn({ method: "GET" }).handler(async () => {
  const store = getStore();
  if (!store) return { loaded: false, filename: null, chunkCount: 0 };
  return {
    loaded: true,
    filename: store.filename,
    chunkCount: store.chunks.length,
  };
});

// ─── Clear PDF ─────────────────────────────────────────────────────────────────

export const clearPdf = createServerFn({ method: "POST" }).handler(async () => {
  clearStore();
  return { success: true };
});
