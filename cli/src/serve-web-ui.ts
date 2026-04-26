import path from "path";

export default async function serveWebUi(basePath: string, port: number) {
  Bun.serve({
    port,
    async fetch(req) {
      const filePath = new URL(req.url).pathname;
      const file = Bun.file(path.join(basePath, filePath));
      return new Response(file);
    },
    error() {
      return new Response(null, { status: 404 });
    },
  });
}
