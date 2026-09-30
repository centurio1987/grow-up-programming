/**
 * `practice-ref.ts` — 스텁 테스트를 정본에 물려 돌렸을 때 실패가 없는가.
 *
 * 도구 자기시험은 가짜 저장소 하나로 잰다 — 틀린 기대값을 실제로 잡는지, 별칭 shim 이 이름을
 * 옮기는지, 풀이가 든 스텁을 누수로 세는지. 저장소 전체를 도는 둘이 집행이다 — 정본에서 실패 0,
 * 스텁 누수 0 을 요구한다.
 */

import { afterAll, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { leakedStubs, rewrite, run } from "./practice-ref.ts";

const fake = mkdtempSync(join(tmpdir(), "practice-ref-fake-"));
afterAll(() => rmSync(fake, { recursive: true, force: true }));

function put(rel: string, body: string): void {
  const path = join(fake, rel);
  mkdirSync(path.slice(0, path.lastIndexOf("/")), { recursive: true });
  writeFileSync(path, body);
}

const dir = "src/algorithms/array/double";
put(
  `${dir}/double.ts`,
  'export function double(_n: number): number { throw new Error("Not implemented"); }\n',
);
put(
  `${dir}/double-guide.ref.ts`,
  "export function double(n: number): number { return 2 * n; }\n",
);
put(
  `${dir}/double.test.ts`,
  [
    'import { expect, test } from "bun:test";',
    'import { double } from "./double";',
    'test("맞는 기대값", () => { expect(double(2)).toBe(4); });',
    'test("틀린 기대값", () => { expect(double(3)).toBe(7); });',
    "",
  ].join("\n"),
);

test("틀린 기대값 하나를 잡고 맞는 것은 통과시킨다", async () => {
  const r = await run(fake);
  expect(r.files).toBe(1);
  expect(r.tests).toBe(2);
  expect(r.failures).toEqual([
    { file: `${dir}/double.test.ts`, test: "틀린 기대값" },
  ]);
  expect(r.loadErrors).toEqual([]);
});

test("import 는 정본으로 돌고 스텁은 안 부른다", () => {
  const r = rewrite(
    "/repo",
    `${dir}/double.test.ts`,
    'import { double } from "./double";',
  );
  expect(r).toEqual({
    src: `import { double } from "/repo/${dir}/double-guide.ref";`,
    shim: undefined,
  });
});

test("풀이가 든 스텁을 누수로 세고 미구현 스텁은 안 센다", async () => {
  const leak = "src/algorithms/array/triple";
  put(
    `${leak}/triple.ts`,
    "export function triple(n: number): number { return 3 * n; }\n",
  );
  put(`${leak}/triple.test.ts`, 'import { triple } from "./triple";\n');
  expect(await leakedStubs(fake)).toEqual([`${leak}/triple.ts`]);
  rmSync(join(fake, leak), { recursive: true, force: true });
});

test("저장소의 실습 스텁에 풀이가 새어 들지 않았다", async () => {
  expect(await leakedStubs(process.cwd())).toEqual([]);
});

test("저장소의 스텁 테스트가 정본에서 전부 통과한다", async () => {
  const r = await run(process.cwd());
  expect(r.loadErrors).toEqual([]);
  expect(r.failures).toEqual([]);
  expect(r.files).toBeGreaterThan(100);
}, 300_000);
