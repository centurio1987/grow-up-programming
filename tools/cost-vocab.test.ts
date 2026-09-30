/**
 * `cost-vocab.ts` 자기시험 — 이름 목록이 SPEC §14 표와 갈리지 않는가, 판정이 경계에서 맞는가.
 *
 * 목록과 SPEC 이 두 자리에 있으므로 한쪽만 고쳐지는 일을 여기서 막는다(`cost-vocab.ts` 머리 주석).
 */
import { expect, test } from "bun:test";
import { join } from "node:path";
import {
  RETIRED_COST_NAMES,
  RETIRED_TERMS,
  retiredCostName,
  SPACE_NAMES,
  TIME_NAMES,
} from "./cost-vocab.ts";

const spec = await Bun.file(
  join(import.meta.dir, "..", "sandbox/algo-guide-v2/SPEC.md"),
).text();
const section14 = spec.slice(spec.indexOf("## 14. 셈 기준과 용어"));

test("셈 이름 전부가 SPEC §14 에 적혀 있다", () => {
  for (const name of [...TIME_NAMES, ...SPACE_NAMES])
    expect(section14.includes(name)).toBe(true);
});

test("옛 셈 이름 전부가 SPEC §14 에 적혀 있다 — 목록에만 있는 옛 이름을 막는다", () => {
  for (const [name] of RETIRED_COST_NAMES)
    expect(section14.includes(`\`${name}\``)).toBe(true);
});

test("옛 이름과 맞는 이름이 겹치지 않는다", () => {
  const live = new Set<string>([...TIME_NAMES, ...SPACE_NAMES]);
  for (const [name] of RETIRED_COST_NAMES) expect(live.has(name)).toBe(false);
});

test("맞는 이름은 입력 라벨이 붙어도 지나간다", () => {
  for (const m of [
    "E=199 기본 연산",
    "질의 3 회 칸 접근",
    "k=45 추가 칸",
    "n=100,000 저장 칸",
    "10 만 칸 할당 칸",
    "뒤집히는 간선 수",
  ])
    expect(retiredCostName(m)).toBeNull();
});

test("옛 이름은 입력 라벨 뒤에서도 걸리고, 긴 이름으로 불린다", () => {
  expect(retiredCostName("질의 136 개 배열 접근")?.name).toBe("배열 접근");
  expect(retiredCostName("간선 0 개에서 배열 칸 접근")?.name).toBe(
    "배열 칸 접근",
  );
  expect(retiredCostName("균등 1024 추가로 잡는 칸")?.name).toBe(
    "추가로 잡는 칸",
  );
  expect(retiredCostName("칸")?.name).toBe("칸");
  expect(retiredCostName("합치기_비교")).not.toBeNull();
});

test("용어 — 전체 이름의 자동자는 지나가고 줄인 이름만 걸린다", () => {
  const re = RETIRED_TERMS.find(([, name]) => name.startsWith("자동자"))?.[0];
  expect(re?.test("아호–코라식 자동자를 만든다")).toBe(false);
  expect(re?.test("접미사 자동자의 상태")).toBe(false);
  expect(re?.test("자동자를 따라간다")).toBe(true);
});
