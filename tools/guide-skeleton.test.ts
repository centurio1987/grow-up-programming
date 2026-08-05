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
import { join, resolve } from "node:path";
import { extract } from "./guide-core.ts";

const root = resolve(import.meta.dir, "..");
const SPEC = ".claude/authoring/specs/ds-guide/spec.json";
const FIXTURE = "tools/_fixtures/ds-guide-skeleton.mdx";

/**
 * 8단계로 **재집필이 끝난** 가이드. 재집필 카드가 여기 한 줄을 더한다.
 *
 * 나머지 68종은 아직 옛 5단계 문형이므로 대상이 아니다. 목록을 자동으로 만들지 않는 이유는
 * "아직 안 옮긴 것"과 "옮겼는데 골격이 틀린 것"을 구분해야 하기 때문이다.
 */
const REWRITTEN = [
  "src/data-structures/probabilistic/concurrentSkipList/concurrentSkipList-guide.mdx",
  "src/data-structures/linear/deque/deque-guide.mdx",
  "src/data-structures/linear/queue/queue-guide.mdx",
  "src/data-structures/linear/unrolledLinkedList/unrolledLinkedList-guide.mdx",
  "src/data-structures/linear/xorLinkedList/xorLinkedList-guide.mdx",
  "src/data-structures/range-query/intervalTree/intervalTree-guide.mdx",
  "src/data-structures/tree/multiset/multiset-guide.mdx",
  "src/data-structures/trie/suffixArray/suffixArray-guide.mdx",
  "src/data-structures/trie/suffixTree/suffixTree-guide.mdx",
  "src/data-structures/trie/ternarySearchTree/ternarySearchTree-guide.mdx",
];

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

  test(`${path} — 본문에 계측이 새어 나오지 않는다`, () => {
    expect(source).not.toContain("__cost");
  });
}
