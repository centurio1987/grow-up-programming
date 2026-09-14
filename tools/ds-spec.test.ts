/**
 * `sandbox/ds-guide-v2/SPEC.md` 자기시험 — **명세의 내적 정합**.
 *
 * 이 명세는 델타다(algo SPEC 이 base). 델타에서 가장 조용히 새는 자리가 둘이라 그 둘만 잰다.
 *
 * 1. **§1 항목 표와 §2 매핑 블록이 어긋나는 것.** §2 는 `tools/section.ts` 가 기계로 읽는
 *    유일한 예외 자리라 완전해야 하는데, 표에 항목을 하나 더하고 매핑을 안 더하면 그 절이
 *    **어느 판정에도 안 걸린다.** 반대로 매핑에만 있으면 없는 절을 찾다가 멈춘다.
 * 2. **계승 조항을 옮겨 적는 것.** 「갈리는 것만 적는다」가 판단이라, 쓰다 보면 algo SPEC 의
 *    문단이 통째로 복제된다. 복제된 순간 둘은 갈라지기 시작하고, 갈라지면 어느 쪽이 정본인지
 *    아무도 모른다 — 자료구조 트랙을 한 번 재설계하게 만든 결함이 그것이다.
 *
 * **`tools/section.ts` 와의 대조는 여기 없다.** 그 파일이 ds 매핑을 갖는 것은 `S3` 의 몫이고,
 * 대조 시험도 거기서 선다. 없는 것을 미리 시험하면 `S2` 가 자기 힘으로 못 닫는다.
 */

import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const DS_SPEC = resolve(ROOT, "sandbox/ds-guide-v2/SPEC.md");
const ALGO_SPEC = resolve(ROOT, "sandbox/algo-guide-v2/SPEC.md");

const dsSpec = readFileSync(DS_SPEC, "utf8");

/** §1 표의 `| order | id | …` 행에서 id 를 뽑는다. id 는 둘째 칸의 백틱 안이다. */
function idsFromTable(text: string): string[] {
  const start = text.indexOf("## 1. 항목");
  const end = text.indexOf("## 2. id ↔ 헤딩 매핑");
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  const out: string[] = [];
  for (const line of text.slice(start, end).split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim());
    // cells[0] 은 빈 칸(선행 `|`), cells[1] = order, cells[2] = id
    if (cells.length < 4) continue;
    if (!/^\d+$/.test(cells[1] ?? "")) continue; // 헤더·구분선 제외
    const m = /^`([^`]+)`$/.exec(cells[2] ?? "");
    if (m?.[1]) out.push(m[1]);
  }
  return out;
}

/**
 * §1 표의 `parent` 칸을 id 로 매핑한다.
 *
 * **부모를 id 의 점 구조로 계산하지 않는다.** `deep.*` 접두는 부모 관계를 뜻하지 않는다 —
 * algo SPEC 4차 개정이 `deep` 컨테이너를 해체하면서 id 만 옛 이름으로 남겼고, 그 문서가
 * *"부모의 정본은 §1 표의 parent 칸"* 이라고 못 박았다. 점으로 계산하면 없는 `deep` 을 찾는다.
 */
function parentsFromTable(text: string): Map<string, string> {
  const start = text.indexOf("## 1. 항목");
  const end = text.indexOf("## 2. id ↔ 헤딩 매핑");
  const out = new Map<string, string>();
  for (const line of text.slice(start, end).split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim());
    if (cells.length < 8) continue;
    if (!/^\d+$/.test(cells[1] ?? "")) continue;
    const id = /^`([^`]+)`$/.exec(cells[2] ?? "")?.[1];
    const parent = /^`([^`]+)`$/.exec(cells[6] ?? "")?.[1];
    if (id && parent) out.set(id, parent);
  }
  return out;
}

/** §2 의 펜스 블록에서 `id  정규식` 행의 id 를 뽑는다. */
function idsFromMapping(text: string): string[] {
  const start = text.indexOf("## 2. id ↔ 헤딩 매핑");
  const end = text.indexOf("## 3. 갈리는 절의 작성법");
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  const block = text.slice(start, end);
  const fence = /```\n([\s\S]*?)```/.exec(block);
  expect(fence?.[1]).toBeTruthy();
  const out: string[] = [];
  for (const line of (fence?.[1] ?? "").split("\n")) {
    const m = /^([a-z][a-z0-9.]*)\s{2,}\S/.exec(line);
    if (m?.[1]) out.push(m[1]);
  }
  return out;
}

test("§1 항목 표와 §2 매핑이 같은 id 집합을 쓴다", () => {
  const table = idsFromTable(dsSpec);
  const mapping = idsFromMapping(dsSpec);

  expect(table.length).toBeGreaterThan(20); // 표를 못 읽으면 0 이 되어 조용히 통과한다
  expect(mapping.length).toBe(table.length);

  const onlyTable = table.filter((id) => !mapping.includes(id));
  const onlyMapping = mapping.filter((id) => !table.includes(id));
  expect(onlyTable).toEqual([]); // 표에만 있으면 그 절이 어느 판정에도 안 걸린다
  expect(onlyMapping).toEqual([]); // 매핑에만 있으면 없는 절을 찾다가 멈춘다
});

test("매핑의 id 는 중복되지 않는다", () => {
  const mapping = idsFromMapping(dsSpec);
  expect(new Set(mapping).size).toBe(mapping.length);
});

test("표가 가리키는 부모는 전부 표 안에 있다", () => {
  const table = idsFromTable(dsSpec);
  const parents = parentsFromTable(dsSpec);

  expect(parents.size).toBeGreaterThan(15); // parent 칸을 못 읽으면 0 이 되어 조용히 통과한다
  for (const [id, parent] of parents) {
    expect({ id, parent, known: table.includes(parent) }).toEqual({
      id,
      parent,
      known: true,
    });
  }
});

test("계승 조항을 옮겨 적지 않았다 — algo SPEC 과 겹치는 긴 문단이 없다", () => {
  const algo = readFileSync(ALGO_SPEC, "utf8");

  /**
   * **인용을 줄째로 면제하지 않는다.** 처음에는 큰따옴표가 든 줄을 통째로 뺐는데, algo SPEC 의
   * 긴 문단 상당수가 유저 지시 인용을 품고 있어서 **그 문단을 그대로 복사해도 통과했다**
   * (변이 시험에서 실측). 지금은 인용 **부분만** 지우고 남은 산문으로 대조한다 — 인용은
   * 델타의 정당한 도구이지만, 인용을 달았다고 그 문단 전체가 새것이 되지는 않는다.
   */
  const strip = (s: string) =>
    s
      .replace(/\*?"[^"]*"\*?/g, " ") // *"유저 지시"* · "인용"
      .replace(/「[^」]*」/g, " ")
      .replace(/`[^`]*`/g, " ") // 코드 스팬 — 파일 경로·id 는 양쪽에 같이 나온다
      .replace(/\s+/g, " ")
      .trim();

  const algoProse = new Set(
    algo
      .split("\n")
      .map(strip)
      .filter((l) => l.length >= 40),
  );

  const dupes = dsSpec
    .split("\n")
    .filter((l) => !l.startsWith("|")) // 표는 양쪽이 같은 항목을 다루므로 칸 문구가 겹친다
    .map(strip)
    .filter((l) => l.length >= 40 && algoProse.has(l));

  expect(dupes).toEqual([]);
});
