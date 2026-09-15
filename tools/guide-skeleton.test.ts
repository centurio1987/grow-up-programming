/**
 * `ds-guide` spec 의 골격이 실제로 성립하는지 붙잡는 회귀 시험(KAN-016).
 *
 * spec 의 `sections[]` 는 집필기가 읽는 **골격 정본**인데, 지금까지 그것이 맞는지는
 * 사람이 읽어서만 알 수 있었다. 캔버스가 spec 보다 앞서 있던 것을 B4 가 발견한 것도
 * 그래서다 — 둘을 대조하는 기계가 없었다.
 *
 * 여기서는 fixture(`_fixtures/ds-guide-skeleton.mdx`)를 spec 과 대조한다. spec 의 제목을
 * 고치면 이 시험이 그 자리에서 실패하므로, 골격 변경이 조용히 지나가지 않는다.
 */

import { expect, test } from "bun:test";
import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { extract } from "./guide-core.ts";

const root = resolve(import.meta.dir, "..");
const SPEC = ".claude/authoring/specs/ds-guide/spec.json";
const FIXTURE = "tools/_fixtures/ds-guide-skeleton.mdx";
const SCAN_ROOT = "src/data-structures";

/**
 * 8단계로 재집필이 끝난 가이드를 **파일 시스템에서 뽑는다.**
 *
 * 전에는 손으로 적는 목록이었고 *"재집필 카드가 여기 한 줄을 더한다"* 가 규약이었는데,
 * 카드 열둘이 그 줄을 안 더했다(T1-06 이 전수로 셌다). **산문으로 적은 규약은 강제 지점이
 * 없으면 샌다**(불변 사실 42) — 그래서 목록을 세는 일을 사람에게서 거둬들인다.
 *
 * 판별은 `<name>.contract.ts` 유무다. 옛 목록의 주석은 자동 생성을 막는 이유로 *"아직 안
 * 옮긴 것과 옮겼는데 골격이 틀린 것을 구분해야 한다"* 를 들었는데, 계약 스위트 파일이 바로
 * 그 구분이다 — 그 파일이 서면 규약1·규약2 를 거친 것이고, 규약3(가이드)이 남는다.
 *
 * `_reference/` 를 쓰지 않는 이유는 `probabilistic/concurrentSkipList` 다. 규약4 (가) 등급이라
 * 정본이 Rust 에 있어 그 디렉터리가 없는데, 가이드는 B21 에서 8단계로 재집필됐다.
 */
const SKELETON_EXEMPT = new Map([
  [
    "disjoint-set/disjointSetRollback",
    "KAN-027 재개(2026-09-14) 유닛은 계약 층만 낸다. 계약과 정본은 T3-05 에서 섰고 가이드는" +
      " KAN-036 이 다시 쓰기로 직렬 중재됐다(docs/ORD-006-wbs.md 머리 블록). 다시 쓰는 카드가 이 줄을 지운다",
  ],
  [
    "disjoint-set/unionFind",
    "KAN-027 재개(2026-09-14) 유닛은 계약 층만 낸다. 계약과 정본은 T3-04 에서 섰고 가이드는" +
      " KAN-036 이 다시 쓰기로 직렬 중재됐다(docs/ORD-006-wbs.md 머리 블록). 다시 쓰는 카드가 이 줄을 지운다",
  ],
  [
    "hash/lruCache",
    "KAN-027 재개(2026-09-14) 유닛은 계약 층만 낸다. 계약과 정본은 T3-03 에서 섰고 가이드는" +
      " KAN-036 이 다시 쓰기로 직렬 중재됐다(docs/ORD-006-wbs.md 머리 블록). 다시 쓰는 카드가 이 줄을 지운다",
  ],
  [
    "heap/fibonacciHeap",
    "KAN-027 재개(2026-09-14) 유닛은 계약 층만 낸다. 계약과 정본은 T2-04 에서 섰고 가이드는" +
      " KAN-036 이 다시 쓰기로 직렬 중재됐다(docs/ORD-006-wbs.md 머리 블록). 다시 쓰는 카드가 이 줄을 지운다",
  ],
  [
    "heap/pairingHeap",
    "KAN-027 재개(2026-09-14) 유닛은 계약 층만 낸다. 계약과 정본은 T2-03 에서 섰고 가이드는" +
      " KAN-036 이 다시 쓰기로 직렬 중재됐다(docs/ORD-006-wbs.md 머리 블록). 다시 쓰는 카드가 이 줄을 지운다",
  ],
  [
    "heap/vanEmdeBoasTree",
    "KAN-027 재개(2026-09-14) 유닛은 계약 층만 낸다. 계약과 정본은 T2-05 에서 섰고 가이드는" +
      " KAN-036 이 다시 쓰기로 직렬 중재됐다(docs/ORD-006-wbs.md 머리 블록). 다시 쓰는 카드가 이 줄을 지운다",
  ],
  [
    "linear/pieceTable",
    "KAN-027 재개(2026-09-14) 유닛은 계약 층만 낸다. 계약과 정본은 T5-03 에서 섰고 가이드는" +
      " KAN-036 이 다시 쓰기로 직렬 중재됐다(docs/ORD-006-wbs.md 머리 블록). 다시 쓰는 카드가 이 줄을 지운다",
  ],
  [
    "linear/stack",
    "규약1 시범 2종(B2). 계약과 정본은 그때 섰지만 가이드는 손대지 않기로 했고" +
      "(규약3 이 B4 에서야 섰다) 아직 옛 문형이다. 다시 쓰는 카드가 이 줄을 지운다",
  ],
  [
    "probabilistic/skipList",
    "KAN-027 재개(2026-09-14) 유닛은 계약 층만 낸다. 성격 전환과 정본은 T5-04 에서 섰고 가이드는" +
      " KAN-036 이 다시 쓰기로 직렬 중재됐다(docs/ORD-006-wbs.md 머리 블록). 다시 쓰는 카드가 이 줄을 지운다",
  ],
  [
    "range-query/persistentSegmentTree",
    "KAN-027 재개(2026-09-14) 유닛은 계약 층만 낸다. 계약과 정본은 T4-04 에서 섰고 가이드는" +
      " KAN-036 이 다시 쓰기로 직렬 중재됐다(docs/ORD-006-wbs.md 머리 블록). 다시 쓰는 카드가 이 줄을 지운다",
  ],
  [
    "range-query/segmentTreeLazy",
    "KAN-027 재개(2026-09-14) 유닛은 계약 층만 낸다. 계약과 정본은 T4-03 에서 섰고 가이드는" +
      " KAN-036 이 다시 쓰기로 직렬 중재됐다(docs/ORD-006-wbs.md 머리 블록). 다시 쓰는 카드가 이 줄을 지운다",
  ],
  [
    "range-query/sparseTable",
    "KAN-027 재개(2026-09-14) 유닛은 계약 층만 낸다. 계약과 정본은 T4-05 에서 섰고 가이드는" +
      " KAN-036 이 다시 쓰기로 직렬 중재됐다(docs/ORD-006-wbs.md 머리 블록). 다시 쓰는 카드가 이 줄을 지운다",
  ],
  [
    "spatial/kdTree",
    "KAN-027 재개(2026-09-14) 유닛은 계약 층만 낸다. 계약과 정본은 T4-06 에서 섰고 가이드는" +
      " KAN-036 이 다시 쓰기로 직렬 중재됐다(docs/ORD-006-wbs.md 머리 블록). 다시 쓰는 카드가 이 줄을 지운다",
  ],
  [
    "spatial/quadtree",
    "KAN-027 재개(2026-09-14) 유닛은 계약 층만 낸다. 계약과 정본은 T4-07 에서 섰고 가이드는" +
      " KAN-036 이 다시 쓰기로 직렬 중재됐다(docs/ORD-006-wbs.md 머리 블록). 다시 쓰는 카드가 이 줄을 지운다",
  ],
  [
    "tree/merkleTree",
    "KAN-027 재개(2026-09-14) 유닛은 계약 층만 낸다. 계약과 정본은 T5-07 에서 섰고 가이드는" +
      " KAN-036 이 다시 쓰기로 직렬 중재됐다(docs/ORD-006-wbs.md 머리 블록). 다시 쓰는 카드가 이 줄을 지운다",
  ],
  [
    "trie/ahoCorasick",
    "KAN-027 재개(2026-09-14) 유닛은 계약 층만 낸다. 계약과 정본은 T5-08 에서 섰고 가이드는" +
      " KAN-036 이 다시 쓰기로 직렬 중재됐다(docs/ORD-006-wbs.md 머리 블록). 다시 쓰는 카드가 이 줄을 지운다",
  ],
]);

async function rewrittenGuides(): Promise<string[]> {
  const found: string[] = [];
  const categories = await readdir(join(root, SCAN_ROOT), {
    withFileTypes: true,
  });
  for (const category of categories) {
    if (!category.isDirectory() || category.name.startsWith("_")) continue;
    const names = await readdir(join(root, SCAN_ROOT, category.name), {
      withFileTypes: true,
    });
    for (const name of names) {
      if (!name.isDirectory() || name.name.startsWith("_")) continue;
      const key = `${category.name}/${name.name}`;
      if (SKELETON_EXEMPT.has(key)) continue;
      const dir = join(SCAN_ROOT, category.name, name.name);
      const contract = join(dir, `${name.name}.contract.ts`);
      if (!(await Bun.file(join(root, contract)).exists())) continue;
      const guide = join(dir, `${name.name}-guide.mdx`);
      if (await Bun.file(join(root, guide)).exists()) found.push(guide);
    }
  }
  return found.sort();
}

const REWRITTEN = await rewrittenGuides();

test("재집필이 끝난 구조의 가이드를 빠짐없이 센다", () => {
  // 이 숫자가 아니라 **세는 방법**이 규약이다. 구조가 늘면 여기서 한 번 걸리고, 그때
  // 확인할 것은 「그 구조의 가이드가 정말 8단계인가」 하나다.
  expect(REWRITTEN.length).toBeGreaterThanOrEqual(20);
});

interface Section {
  id: string;
  required: boolean;
  order: number;
  heading: string;
  heading_fixed: boolean;
}

const spec = (await Bun.file(join(root, SPEC)).json()) as {
  sections: Section[];
};
const fixture = await Bun.file(join(root, FIXTURE)).text();

/** 코드 블록 안의 `#` 는 제목이 아니다. */
function headings(source: string): string[] {
  const out: string[] = [];
  let fenced = false;
  for (const line of source.split("\n")) {
    if (line.trimStart().startsWith("```")) {
      fenced = !fenced;
      continue;
    }
    if (!fenced && /^#{1,3}\s/.test(line)) out.push(line.trim());
  }
  return out;
}

/**
 * 코드 펜스 **안쪽**만 모은다. 펜스를 여는 줄과 닫는 줄은 뺀다.
 *
 * 계측이 새는지를 파일 전체 문자열 검색으로 물으면 **산문이 거짓 양성으로 걸린다** — 가이드
 * 아홉이 *"`__cost` 줄은 축3 계측이고 추출기가 떼고 가져온다"* 처럼 그 이름을 설명하고 있고,
 * 그것은 새는 것이 아니라 설명하는 것이다. `tools/check-contract.ts` 가 벽시계 게이트에서
 * 문자열 검색을 버린 것과 같은 이유이고, 거기 주석이 같은 함정을 이미 적고 있다.
 */
function fencedCode(source: string): string {
  const out: string[] = [];
  let fenced = false;
  for (const line of source.split("\n")) {
    if (line.trimStart().startsWith("```")) {
      fenced = !fenced;
      continue;
    }
    if (fenced) out.push(line);
  }
  return out.join("\n");
}

const fixtureHeadings = headings(fixture);
const ordered = [...spec.sections].sort((a, b) => a.order - b.order);

test("spec 이 제목을 고정한 절은 fixture 에 그대로 있다", () => {
  const fixed = ordered.filter((s) => s.heading_fixed && s.required);
  expect(fixed.length).toBeGreaterThan(0);
  for (const section of fixed) {
    expect(fixtureHeadings).toContain(section.heading);
  }
});

test("절의 순서가 spec 의 order 와 같다", () => {
  const positions = ordered
    .filter((s) => s.heading_fixed)
    .map((s) => ({ id: s.id, at: fixtureHeadings.indexOf(s.heading) }))
    .filter((entry) => entry.at >= 0);

  const sorted = [...positions].sort((a, b) => a.at - b.at);
  expect(sorted.map((p) => p.id)).toEqual(positions.map((p) => p.id));
});

test("조건부 절은 없어도 골격이 성립한다", () => {
  const optional = ordered.filter((s) => !s.required && s.heading_fixed);
  expect(optional.map((s) => s.id)).toContain("escalation");
  // 대상이 규약4 (-) 등급이므로 fixture 에 이 절이 없다. 그래도 위 두 시험이 통과한다.
  expect(fixtureHeadings).not.toContain("## TypeScript의 한계와 대체 언어");
});

test("fixture 에 spec 이 모르는 `##` 절이 없다", () => {
  const known = new Set(ordered.map((s) => s.heading));
  const strays = fixtureHeadings
    .filter((h) => h.startsWith("## "))
    .filter((h) => !known.has(h));
  expect(strays).toEqual([]);
});

const fence = /```ts guide-core=(\S+?)(?:#(\S+))?\n([\s\S]*?)```/.exec(fixture);
const fenceTarget = fence?.[1];
const referenceSource =
  fenceTarget === undefined
    ? ""
    : await Bun.file(join(root, fenceTarget)).text();

test("guide-core 펜스가 정본 추출본과 한 글자도 다르지 않다", () => {
  expect(fenceTarget).toBeDefined();
  const body = fence?.[3];
  expect(body).toBeDefined();
  if (fenceTarget === undefined || body === undefined) return;

  const expected = extract(referenceSource, fenceTarget, fence?.[2]);
  expect(body.trimEnd()).toBe(expected.trimEnd());
});

test("본문에 계측이 새어 나오지 않는다", () => {
  // 추출이 걷어 내므로, 보이면 손으로 옮겨 적었다는 뜻이다(§규약3 E5).
  expect(fixture).not.toContain("__cost");
});

// ─── 재집필이 끝난 실제 가이드 ──────────────────────────────────────────────

for (const path of REWRITTEN) {
  const source = await Bun.file(join(root, path)).text();
  const found = headings(source);

  test(`${path} — 필수 절이 spec 순서대로 있다`, () => {
    const required = ordered.filter((s) => s.required && s.heading_fixed);
    for (const section of required) {
      expect(found).toContain(section.heading);
    }
    const positions = required.map((s) => found.indexOf(s.heading));
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  test(`${path} — spec 이 모르는 \`##\` 절이 없다`, () => {
    const known = new Set(ordered.map((s) => s.heading));
    const strays = found
      .filter((h) => h.startsWith("## "))
      .filter((h) => !known.has(h));
    expect(strays).toEqual([]);
  });

  test(`${path} — 본문 코드에 계측이 새어 나오지 않는다`, () => {
    expect(fencedCode(source)).not.toContain("__cost");
  });
}
