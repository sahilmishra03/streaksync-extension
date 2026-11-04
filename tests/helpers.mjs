// Shared test helpers: a fake fetch router and an in-memory Cloudflare KV.

// Routes fetch calls by URL substring. Each handler gets (url, init) and returns
// { status, body } (body is JSON-encoded) or a Response. Unmatched calls fail the test.
export function mockFetch(routes) {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (input, init = {}) => {
    const url = String(input);
    calls.push({ url, init, body: init.body ? safeParse(init.body) : undefined });
    const match = Object.keys(routes).find((k) => url.includes(k));
    if (!match) throw new Error(`Unexpected fetch: ${url}`);
    const out = await routes[match](url, init);
    if (out instanceof Response) return out;
    return new Response(JSON.stringify(out.body ?? {}), {
      status: out.status ?? 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };
  return {
    calls,
    restore: () => {
      globalThis.fetch = original;
    }
  };
}

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

export function memoryKV() {
  const data = new Map();
  return {
    data,
    async get(key) {
      return data.get(key)?.value ?? null;
    },
    async getWithMetadata(key) {
      const e = data.get(key);
      return { value: e?.value ?? null, metadata: e?.metadata ?? null };
    },
    async put(key, value, opts = {}) {
      data.set(key, { value, metadata: opts.metadata ?? null });
    },
    async delete(key) {
      data.delete(key);
    },
    async list({ prefix = '' } = {}) {
      const keys = [...data.entries()]
        .filter(([k]) => k.startsWith(prefix))
        .map(([name, e]) => ({ name, metadata: e.metadata }));
      return { keys, list_complete: true };
    }
  };
}

export const TOKEN_KEY = Buffer.alloc(32, 7).toString('base64');
