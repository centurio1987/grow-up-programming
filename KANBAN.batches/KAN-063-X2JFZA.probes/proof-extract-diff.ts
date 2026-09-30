// KAN-063 탐침 — S1 이 check-proof 의 블록 추출을 바꾼 뒤에도 기존 가이드의 추출 결과가 한 글자도 안 바뀌었는가.
// 실행: git show ca0a4dc5:tools/check-proof.ts > tools/_old-check-proof.tmp.ts && \
//       bun KANBAN.batches/KAN-063-X2JFZA.probes/proof-extract-diff.ts; rm tools/_old-check-proof.tmp.ts
// ca0a4dc5 는 KAN-063 착수 직전 main 커밋이다.
import { Glob } from "bun";
import * as neo from "../../tools/check-proof.ts";

// 옛 판은 실행 직전에 git show 로 만드는 임시 파일이라, 경로를 변수로 두어 타입 검사가 찾지 않게 한다.
const oldPath = "../../tools/_old-check-proof.tmp.ts";
const old = (await import(oldPath)) as typeof neo;
let blocks = 0;
const differing: string[] = [];
for await (const path of new Glob("src/**/*-guide.md").scan(".")) {
  const text = await Bun.file(path).text();
  const a = JSON.stringify(old.extractBlocks(text));
  const b = JSON.stringify(neo.extractBlocks(text));
  blocks += neo.extractBlocks(text).length;
  if (a !== b) differing.push(path);
}
console.log(`blocks ${blocks} files differing ${differing.length}`);
for (const p of differing) console.log(`  ${p}`);
