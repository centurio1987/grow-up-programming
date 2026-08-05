/**
 * `tools/check-links.ts` 의 `refs` 자기시험.
 *
 * 이 시험이 있는 이유는 B11 이 스윕을 믿었다가 놓쳤기 때문이다. `refs` 는 저장소 기준
 * 경로 문자열만 봤고, `_contract/runContract.test.ts` 의 `../hash/multiset/…` import 둘이
 * 결과에 안 나왔다. 스윕이 "이게 전부"라고 보고한 뒤 `bunx tsc --noEmit` 이 잡았는데,
 * 그건 스윕이 제 일을 못 한 것이다 — 대상이 `.md` 였다면 타입 검사도 못 잡는다.
 *
 * fixture 는 `_fixtures/links/` 다. 참조 쪽은 대상을 **상대 경로로만** 가리킨다.
 */

import { expect, test } from "bun:test";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const TARGET = "tools/_fixtures/links/target/thing.md";
const REF = "tools/_fixtures/links/ref/relative.md";

async function refs(target: string): Promise<string> {
  const run = Bun.spawn(
    ["bun", "run", "tools/check-links.ts", "refs", target],
    {
      cwd: root,
      stdout: "pipe",
      stderr: "pipe",
    },
  );
  const [out, err] = await Promise.all([
    new Response(run.stdout).text(),
    new Response(run.stderr).text(),
  ]);
  expect(await run.exited).toBe(0);
  return out + err;
}

test("refs 가 상대 경로 참조를 찾는다", async () => {
  const output = await refs(TARGET);
  expect(output).toContain(REF);
});

test("fixture 의 참조는 저장소 기준 경로를 문자열로 담고 있지 않다", async () => {
  // 이 단정이 깨지면 위 시험이 상대 경로 해석이 아니라 문자열 포함으로 통과하게 된다.
  const source = await Bun.file(resolve(root, REF)).text();
  expect(source).not.toContain(`(${TARGET})`);
});

test("확장자를 뗀 참조도 같은 자리로 본다", async () => {
  // import 문이 이 꼴이다. 확장자를 요구하면 TS 참조를 통째로 놓친다.
  const output = await refs(TARGET);
  expect(output).toContain("tools/_fixtures/links/ref/extensionless.md");
});
