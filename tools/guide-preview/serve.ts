/**
 * 해설서 MDX 프리뷰 서버 (AOT).
 *
 * 매 요청마다 동적 컴파일하지 않고, 서버 기동 시 대상 MDX를 한 번 JS로 컴파일한 뒤
 * Bun.build 로 정적 번들을 만들어 Bun.serve 로 서빙한다.
 *
 * 사용: bun run tools/guide-preview/serve.ts <file.mdx> [port]
 */
import { compile } from "@mdx-js/mdx";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { join } from "node:path";
import { mkdir } from "node:fs/promises";

const mdxPath = process.argv[2];
const port = Number(process.argv[3] ?? 5173);
if (!mdxPath) {
  console.error("usage: bun run tools/guide-preview/serve.ts <file.mdx> [port]");
  process.exit(1);
}

const root = process.cwd();
const cacheDir = join(root, "tools/guide-preview/.cache");
await mkdir(cacheDir, { recursive: true });

// 1) MDX → JS (react/jsx-runtime 사용). 빌드 시 1회만 수행.
const source = await Bun.file(mdxPath).text();
const compiled = String(
  await compile(source, {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  }),
);
const contentPath = join(cacheDir, "content.jsx");
await Bun.write(contentPath, compiled);

// 2) 엔트리: 컴파일된 MDX를 React 로 렌더.
const entryPath = join(cacheDir, "entry.jsx");
await Bun.write(
  entryPath,
  `import "katex/dist/katex.min.css";
import { createRoot } from "react-dom/client";
import Content from "./content.jsx";
createRoot(document.getElementById("root")).render(<Content />);
`,
);

// 3) 정적 번들.
const out = await Bun.build({
  entrypoints: [entryPath],
  outdir: join(cacheDir, "dist"),
  target: "browser",
  minify: false,
});
if (!out.success) {
  for (const log of out.logs) console.error(log);
  process.exit(1);
}
const jsArtifact = out.outputs.find((o) => o.path.endsWith(".js"));
const cssArtifact = out.outputs.find((o) => o.path.endsWith(".css"));
const jsCode = jsArtifact ? await jsArtifact.text() : "";
const cssCode = cssArtifact ? await cssArtifact.text() : "";

// JS/CSS 는 별도 라우트로 서빙한다. (번들 내 `</script>` 문자열이 인라인 시
// 태그를 조기에 닫는 문제를 피한다.)
const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>guide preview — ${mdxPath}</title>
<link rel="stylesheet" href="/app.css"/>
<style>body{max-width:860px;margin:0 auto;padding:24px;font-family:system-ui,sans-serif;line-height:1.6}</style>
</head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>`;

const server = Bun.serve({
  port,
  fetch(req) {
    const { pathname } = new URL(req.url);
    if (pathname === "/app.js")
      return new Response(jsCode, {
        headers: { "content-type": "text/javascript; charset=utf-8" },
      });
    if (pathname === "/app.css")
      return new Response(cssCode, {
        headers: { "content-type": "text/css; charset=utf-8" },
      });
    return new Response(html, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  },
});
console.log(`preview: ${mdxPath}\n  → http://localhost:${server.port}`);
