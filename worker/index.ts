export interface Env {
  R2_BUCKET: R2Bucket;
}

// Object keys are UUID-prefixed sanitized filenames (see saveEvidenceFile's disk-era
// scheme in src/lib/evidence-file-storage.ts, carried over for R2 keys): strip that
// prefix to recover the name the file was uploaded under.
const UUID_KEY_PREFIX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i;

function originalFilename(key: string): string {
  const segment = key.split("/").pop() || key;
  return segment.replace(UUID_KEY_PREFIX, "");
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "GET") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const key = decodeURIComponent(new URL(request.url).pathname.slice(1));

    if (!key) {
      return new Response("Not Found", { status: 404 });
    }

    const object = await env.R2_BUCKET.get(key);

    if (!object) {
      return new Response("Not Found", { status: 404 });
    }

    const headers = new Headers();
    headers.set(
      "Content-Type",
      object.httpMetadata?.contentType || "application/octet-stream",
    );
    headers.set("Content-Length", object.size.toString());
    headers.set(
      "Content-Disposition",
      `inline; filename="${originalFilename(key)}"`,
    );
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("ETag", object.httpEtag);

    return new Response(object.body, { headers });
  },
} satisfies ExportedHandler<Env>;
