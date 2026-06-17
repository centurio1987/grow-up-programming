/**
 * MDX 컴파일 체크 — 해설서 *.mdx 의 구문/JSX 유효성을 검증한다.
 * 수식($…$)은 remark-math 로 보호하고 rehype-katex 로 렌더 가능 여부까지 확인한다.
 *
 * 사용: bun run tools/guide-preview/compile-check.ts <file.mdx> [more.mdx ...]
 *       (인자 없으면 src 하위 모든 *-guide.mdx)
 */
import { compile } from "@mdx-js/mdx";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Glob } from "bun";

let targets = process.argv.slice(2);
if (targets.length === 0) {
  targets = await Array.fromAsync(
    new Glob("src/**/*-guide.mdx").scan({ cwd: process.cwd() }),
  );
}

let failed = 0;
for (const file of targets) {
  try {
    const src = await Bun.file(file).text();
    await compile(src, {
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    });
    console.log(`✓ ${file}`);
  } catch (err) {
    failed++;
    console.error(`✗ ${file}\n  ${(err as Error).message}`);
  }
}

if (failed) {
  console.error(`\n${failed} file(s) failed MDX compile.`);
  process.exit(1);
}
console.log(`\nAll ${targets.length} file(s) compiled.`);
