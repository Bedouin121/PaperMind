// Server-only in-memory vector store.
// One PDF at a time — uploading a new PDF replaces the previous one.

export type Chunk = {
  text: string;
  embedding: number[];
  index: number;
};

type VectorStore = {
  filename: string;
  chunks: Chunk[];
};

// Module-level singleton — lives for the lifetime of the server process.
let store: VectorStore | null = null;

export function setStore(filename: string, chunks: Chunk[]) {
  store = { filename, chunks };
}

export function getStore(): VectorStore | null {
  return store;
}

export function clearStore() {
  store = null;
}

/** Cosine similarity between two vectors */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** Return the top-k most similar chunks to a query embedding */
export function retrieveTopK(queryEmbedding: number[], k = 5): Chunk[] {
  if (!store) return [];
  return store.chunks
    .map((chunk) => ({
      chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((r) => r.chunk);
}
