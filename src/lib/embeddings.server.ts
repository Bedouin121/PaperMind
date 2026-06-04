// Server-only embedding utility using @xenova/transformers.
// Uses the lightweight all-MiniLM-L6-v2 model (~25MB, downloads once and caches).

let pipelineCache:
  | ((texts: string | string[]) => Promise<{ data: Float32Array; dims: number[] }>)
  | null = null;

async function getEmbeddingPipeline() {
  if (pipelineCache) return pipelineCache;

  // Dynamic import to keep this out of the client bundle
  const { pipeline, env } = await import("@xenova/transformers");

  // Cache models in node_modules/.cache/xenova to avoid re-downloading
  env.cacheDir = "./.xenova-cache";
  env.allowLocalModels = false;

  const pipe = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

  pipelineCache = async (texts: string | string[]) => {
    const output = await pipe(texts, { pooling: "mean", normalize: true });
    return output;
  };

  return pipelineCache;
}

/** Embed a single string, returns a plain number[] */
export async function embedText(text: string): Promise<number[]> {
  const embed = await getEmbeddingPipeline();
  const result = await embed(text);
  return Array.from(result.data as Float32Array);
}

/** Embed multiple strings in one batch */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const embed = await getEmbeddingPipeline();
  const results: number[][] = [];
  // Process in batches of 32 to avoid OOM
  const batchSize = 32;
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    for (const text of batch) {
      const result = await embed(text);
      results.push(Array.from(result.data as Float32Array));
    }
  }
  return results;
}
