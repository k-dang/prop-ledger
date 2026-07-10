import { originalEvidenceFileName } from "../src/lib/evidence-upload-policy";

export interface Env {
  R2_BUCKET: R2Bucket;
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
      `inline; filename="${originalEvidenceFileName(key)}"`,
    );
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("ETag", object.httpEtag);

    return new Response(object.body, { headers });
  },
} satisfies ExportedHandler<Env>;
