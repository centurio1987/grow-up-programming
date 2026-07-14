// mdx/md 파일의 ```mermaid 블록을 추출해 mermaid 파서로 구문 검증한다 (G4 게이트).
// 사용: bun run tools/guide-preview/check-mermaid.ts <file.mdx> [file2 ...]
//       인자 없이 실행하면 src/**/*-guide.mdx + src/**/*-study-guide.mdx 전체를 검사한다.
//
// 렌더링까지 가지 않고 mermaid.parse()만 호출하므로 빠르다. 알려진 함정
// (stadium 노드 `([...])` 안의 대괄호, 마름모 `{...}` 안의 괄호 등)은
// 라벨을 큰따옴표로 감싸면 해소된다: `(["return nums[0]"])`, `{"질의 (l,r)?"}`.
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();

const mermaid = (await import("mermaid")).default;
mermaid.initialize({ startOnLoad: false });

let files = process.argv.slice(2);
if (files.length === 0) {
  const glob = new Bun.Glob("src/**/*{-guide,-study-guide}.mdx");
  files = (await Array.fromAsync(glob.scan("."))).sort();
}

let totalBlocks = 0;
let failures = 0;

for (const file of files) {
  const text = await Bun.file(file).text();
  const blocks = [...text.matchAll(/```mermaid\n([\s\S]*?)```/g)].map((m) => m[1]!);
  for (let i = 0; i < blocks.length; i++) {
    totalBlocks++;
    try {
      await mermaid.parse(blocks[i]!);
      console.log(`  ok  ${file} [블록 ${i + 1}]`);
    } catch (e) {
      failures++;
      const msg = (e as Error).message ?? String(e);
      console.log(`FAIL  ${file} [블록 ${i + 1}]: ${msg.split("\n").slice(0, 3).join(" | ")}`);
    }
  }
}

console.log(`\n${files.length}개 파일, ${totalBlocks}개 블록 중 ${failures}개 실패`);
process.exit(failures > 0 ? 1 : 0);
