/**
 * `algo-guide` spec 의 골격이 실제로 성립하는지 붙잡는 회귀 시험.
 *
 * spec 의 `sections[]` 는 집필기가 읽는 **골격 정본**인데, 지금까지 그것이 맞는지는 사람이
 * 읽어서만 알 수 있었다. 실제로 캔버스·spec·모범 예시 셋이 서로 다른 골격을 들고 있던 것이
 * 뒤늦게 발견된 적이 있다(ds-guide 쪽 KAN-016). 같은 장치를 algo 쪽에도 둔다.
 *
 * fixture(`_fixtures/algo-guide-skeleton.mdx`)를 spec 과 대조하고, 캔버스와도 대조한다 —
 * 규칙(spec) · 템플릿(캔버스) · 표본(fixture) 셋이 갈라지면 여기서 걸린다.
 */

import { expect, test } from "bun:test";
import { dirname, join } from "node:path";

const root = dirname(import.meta.dir);
const SPEC = ".claude/authoring/specs/algo-guide/spec.json";
const FIXTURE = "tools/_fixtures/algo-guide-skeleton.mdx";
const CANVAS = ".claude/skills/guide-for-problem/algorithm-guide-canvas.md";

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
const canvas = await Bun.file(join(root, CANVAS)).text();

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
const canvasHeadings = headings(canvas);
const ordered = [...spec.sections].sort((a, b) => a.order - b.order);

test("spec 이 제목을 고정한 필수 절은 fixture 에 그대로 있다", () => {
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
  const optional = ordered.filter((s) => !s.required);
  expect(optional.map((s) => s.id)).toContain("idea.theory");
  expect(optional.map((s) => s.id)).toContain("idea.ds");
  // fixture 는 조건부 절을 일부러 뺐다. 그래도 위 두 시험이 통과한다.
  expect(fixture).not.toContain("### 단서를 설명해 주는 이론");
  expect(fixture).not.toContain("### 셈을 맡는 자료구조");
});

test("fixture 에 spec 이 모르는 `##` 절이 없다", () => {
  const known = new Set(ordered.map((s) => s.heading));
  const strays = fixtureHeadings.filter(
    (h) => h.startsWith("## ") && !known.has(h),
  );
  expect(strays).toEqual([]);
});

test("캔버스와 spec 이 같은 골격을 들고 있다", () => {
  // 규칙(spec)과 템플릿(캔버스)이 갈라지면 집필기는 캔버스를 따라간다.
  // 셋이 어긋난 채로 배치가 도는 것이 이 저장소가 이미 한 번 겪은 실패다.
  const fixed = ordered.filter((s) => s.heading_fixed && s.required);
  for (const section of fixed) {
    expect(canvasHeadings).toContain(section.heading);
  }
});

test("trace 절이 impl 과 clue 사이에 있다", () => {
  // 이 순서가 핵심이다 — clue 의 직무가 "실행을 관찰해 단서를 포착"인데,
  // 관찰 대상인 실행(trace)이 그 앞에 없으면 관찰 없는 관찰 결과가 된다.
  const at = (id: string) =>
    fixtureHeadings.indexOf(ordered.find((s) => s.id === id)?.heading ?? "");
  expect(at("impl")).toBeGreaterThanOrEqual(0);
  expect(at("trace")).toBeGreaterThan(at("impl"));
  expect(at("clue")).toBeGreaterThan(at("trace"));
});
