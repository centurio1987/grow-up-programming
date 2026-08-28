/**
 * B1 연기 시험 — 합격 기준 아홉을 기계로 못 박는다.
 *
 * **"HTML 이 뜬다" 를 합격으로 쓰지 않는다.** 페이지는 뜨고 수식만 조용히 깨지거나,
 * 마운트가 폴백을 지워 그림만 사라지는 것이 실제로 나는 사고다. 셋(정적 산출 · 마커 규약 ·
 * 마운트 규칙)을 각각 단언한다.
 */
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();

import { expect, test } from "bun:test";
import { join, resolve } from "node:path";
import { build, railFrom, railHtml } from "./build-html.ts";
import { mountAll, type SimSpec } from "./mount.ts";

const SMOKE = resolve(import.meta.dir, "../_smoke");
const MD = join(SMOKE, "sample-guide.md");
const SIM = join(SMOKE, "sample-guide.sim.ts");

const built = await build(MD, { simPath: SIM });

test("마커 규약 위반이 없다", () => {
  expect(built.problems).toEqual([]);
  expect(built.vizIds).toEqual(["demo", "empty"]);
  expect(built.mounted).toBe(true);
});

test("① KaTeX 폰트가 base64 로 들어가고 상대 경로가 안 남는다", () => {
  // CSS 만 인라인하고 폰트를 안 넣으면 60개가 404 나고 수식이 조용히 대체 글꼴로 뜬다.
  expect(built.html).toContain("data:font/woff2;base64,");
  expect(built.html).not.toMatch(/url\(fonts\//);
});

test("③ 산문·표·수식·ascii 가 정적으로 남는다 (JS-off)", () => {
  expect(built.html).toContain("<table>");
  expect(built.html).toContain('class="katex');
  expect(built.html.match(/class="gs-ascii"/g)?.length).toBe(2);
});

test("④⑤ check 가 details+summary 로 접힌다 (JS 불필요)", () => {
  expect(built.html).toContain('<details class="gs-check"');
  expect(built.html).toContain("<summary>답 보기</summary>");
});

test("⑥ 다크 모드 토큰이 있다", () => {
  expect(built.html).toContain("prefers-color-scheme: dark");
});

test("⑦ 코드가 하이라이트된다", () => {
  expect(built.html).toContain('class="shiki');
});

test("⑧ 산문의 </script> 는 엔티티로 나간다", () => {
  // 여기에 `<\/script>` 를 쓰면 독자에게 그 문자열이 그대로 보인다.
  expect(built.html).toContain("&#x3C;/script>");
});

test("⑨ 번들의 </script 가 이스케이프되어 페이지가 조기 종료되지 않는다", () => {
  // 레일 스크립트(L37)가 붙어 둘이다 — 레일 강조용 하나 + sim 번들 하나.
  expect(built.html.match(/<\/script>/g)?.length).toBe(2);
  expect(built.html).not.toMatch(/<\/script[^>]/);
});

test("⑩ 빈 steps 자리는 createRoot 를 부르지 않고 ascii 를 남긴다", () => {
  // 이 배치의 핵심 규칙이다. 부르는 순간 컨테이너의 기존 자식이 지워져
  // JS 를 켠 화면에서 그림이 0개가 된다 — JS-off 구멍과 정확히 대칭이다.
  const doc = new DOMParser().parseFromString(built.html, "text/html");
  const calls: string[] = [];
  const sims: Record<string, SimSpec> = {
    demo: { view: "array", steps: [{ a: 1 }, { a: 2 }] },
    empty: { view: "array", steps: [] },
  };

  const report = mountAll(doc, sims, {
    createRoot: (el) => {
      calls.push(el.getAttribute("data-viz") ?? "?");
      return { render: () => {} };
    },
    createElement: () => null,
    Component: null,
  });

  expect(report.mounted).toEqual(["demo"]);
  expect(report.keptFallback).toEqual(["empty"]);
  expect(calls).toEqual(["demo"]);

  // 빈 쪽의 ascii 는 손대지 않은 채 남아 있어야 한다.
  const emptyEl = doc.querySelector('[data-viz="empty"]');
  expect(emptyEl?.querySelector("pre.gs-ascii")).not.toBeNull();
  // 마운트한 쪽은 비워졌다(React 가 그 자리를 채운다).
  const demoEl = doc.querySelector('[data-viz="demo"]');
  expect(demoEl?.querySelector("pre.gs-ascii")).toBeNull();
});

test("export 가 없는 마커도 폴백을 남긴다", () => {
  const doc = new DOMParser().parseFromString(built.html, "text/html");
  const report = mountAll(
    doc,
    {},
    {
      createRoot: () => {
        throw new Error("불려서는 안 된다");
      },
      createElement: () => null,
      Component: null,
    },
  );
  expect(report.mounted).toEqual([]);
  expect(report.keptFallback).toEqual(["demo", "empty"]);
});

/* ────────────── 항목 레일 — L37 (2026-08-28 유저 지시) ────────────── */

/** 새 골격 표본. `railFrom` 은 md 원문만 받으므로 파일 없이 문자열로 시험한다. */
const RAIL_MD = `# 제목 — 부제

## 파트 1 — 아이디어에서 동작하는 코드까지

### 전체 컨셉

본문.

### 시작하기 전에 — 이미 알고 있어야 하는 것

본문.

### 아이디어 상세 — 무엇을 떠올리는 과정

본문.

### 수행으로 알아보는 알고리즘 — 부제

#### 1. 첫 걸음

본문.

#### 2. 둘째 걸음

본문.

#### 멈춤 — 무엇

본문.

#### 3. 전체 코드

본문.

### 알아 두면 좋은 개념 — 어떤 개념

본문.

## 파트 2 — 적용 조건 · 보장 · 비용

### 이 알고리즘이 최적의 솔루션인 경우

#### 최적인 문제의 모양

본문.

### 불변식 — 무엇이 항상 참인가

본문.
`;

test("레일 — 파트와 항목만 담고 하위 절은 뺀다", () => {
  const { rail } = railFrom(RAIL_MD);
  expect(rail.map((e) => e.anchor)).toEqual([
    "part1",
    "concept",
    "prereq",
    "deep-build",
    "deep-walk",
    "related",
    "part2",
    "purpose",
    "invariant",
  ]);
  // `#### 1. 첫 걸음`·`#### 2. 둘째 걸음`·`#### 멈춤`·`#### 3. 전체 코드`·`#### 최적인 문제의 모양` 은 빠진다.
  expect(rail.some((e) => e.anchor.startsWith("deep-walk-step"))).toBe(false);
  expect(rail.some((e) => e.anchor === "purpose-fit")).toBe(false);
});

test("레일 — 라벨은 헤딩의 `—` 앞부분이다", () => {
  const { rail } = railFrom(RAIL_MD);
  const byAnchor = Object.fromEntries(rail.map((e) => [e.anchor, e.label]));
  expect(byAnchor.part1).toBe("파트 1");
  expect(byAnchor.prereq).toBe("시작하기 전에");
  expect(byAnchor["deep-build"]).toBe("아이디어 상세");
  expect(byAnchor.concept).toBe("전체 컨셉"); // `—` 가 없으면 헤딩 전체
});

test("레일 — 앵커는 절 id 에서 딴다(헤딩 문구가 아니다)", () => {
  // 부제를 고쳐도 앵커가 그대로여야 한다. `fixed:false` 인 절이 그 대상이다.
  const changed = RAIL_MD.replace(
    "### 아이디어 상세 — 무엇을 떠올리는 과정",
    "### 아이디어 상세 — 완전히 다른 부제로 바꾼다",
  );
  expect(railFrom(changed).rail.map((e) => e.anchor)).toEqual(
    railFrom(RAIL_MD).rail.map((e) => e.anchor),
  );
});

test("레일 — 반복 절도 앵커가 겹치지 않는다", () => {
  const { anchors } = railFrom(RAIL_MD);
  const steps = anchors.filter((a) => a.startsWith("deep-walk-step"));
  expect(steps).toEqual(["deep-walk-step", "deep-walk-step-2"]);
  expect(new Set(anchors).size).toBe(anchors.length);
});

test("레일 — 모르는 헤딩에도 앵커를 줘서 순서가 안 밀린다", () => {
  // 골격 위반은 `check-v2`(SEC)의 일이다. 빌더가 여기서 멈추면 링크가 한 칸씩 밀려
  // **다른 절을 가리킨다** — 깨진 링크보다 나쁘다.
  const broken = RAIL_MD.replace("### 전체 컨셉", "### 정체 불명의 절");
  const { anchors, rail } = railFrom(broken);
  expect(anchors.length).toBe(railFrom(RAIL_MD).anchors.length);
  expect(rail[1]?.anchor).toBe("sec-3"); // 순번으로 앵커를 준다
  expect(rail[2]?.anchor).toBe("prereq"); // 뒤가 밀리지 않는다
});

test("레일 — JS 를 꺼도 목록과 링크가 정적으로 있다", () => {
  expect(built.html).toContain('<nav class="gs-rail" aria-label="항목">');
  expect(built.html).toContain('<a href="#');
  expect(built.rail.length).toBeGreaterThan(0);
});

test("레일 — 링크가 가리키는 id 가 문서에 실재한다", () => {
  const doc = new DOMParser().parseFromString(built.html, "text/html");
  const links = Array.from(
    doc.querySelectorAll<HTMLAnchorElement>(".gs-rail a[href^='#']"),
  );
  expect(links.length).toBe(built.rail.length);
  for (const a of links) {
    const id = (a.getAttribute("href") ?? "").slice(1);
    expect(doc.getElementById(id)).not.toBeNull();
  }
});

test("레일 — 좁은 화면에서는 숨긴다", () => {
  expect(built.html).toContain(".gs-rail { display: none; }");
  expect(built.html).toContain("@media (min-width: 78rem)");
});

test("레일 — 항목이 0개면 nav 를 아예 안 낸다", () => {
  expect(railHtml([])).toBe("");
});
