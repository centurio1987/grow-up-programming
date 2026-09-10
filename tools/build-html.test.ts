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

const SMOKE = resolve(import.meta.dir, "_fixtures/algo-guide-v2");
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

test("④⑤ 하이픈 id 도 접힌다 — 마커 문법이 check-proof 와 같아야 한다", async () => {
  // 2026-08-31 실측: 앞판 정규식이 JS 식별자만 받아 하이픈 id 를 쓴 9 편에서 여는 마커가
  // 안 잡혔고, 닫는 마커만 남아 접기가 통째로 안 일어났다. 답이 웹에서 그대로 보인 것이
  // 그 결과다. id 가 가는 자리는 `data-check` 속성값뿐이라 하이픈이 합법이다.
  const md = [
    "# 표본",
    "",
    "<!--check:hi-mid-->",
    "",
    "답이다.",
    "",
    "<!--/check-->",
    "",
  ].join("\n");
  const tmp = join(SMOKE, "hyphen-id-guide.md");
  await Bun.write(tmp, md);
  try {
    const r = await build(tmp, { simPath: join(SMOKE, "없는-sim.ts") });
    expect(r.problems).toEqual([]);
    expect(r.html).toContain('data-check="hi-mid"');
    expect(r.html).toContain("<summary>답 보기</summary>");
  } finally {
    await Bun.file(tmp).unlink();
  }
});

test("viz 와 proof 가 같은 펜스를 가리켜도 viz 가 붙는다", async () => {
  // `check-proof` 는 원고에서 그 펜스를 읽어 통과하는데 빌더만 거부하던 자리다
  // (subarraySumEqualsK · ternarySearch 실측). 사이에 낀 주석 마커는 건너뛴다.
  const md = [
    "# 표본",
    "",
    "<!--viz:demo-->",
    "<!--proof:walk-trace-->",
    "",
    "```text",
    "T1  값 1",
    "```",
    "",
  ].join("\n");
  const tmp = join(SMOKE, "shared-fence-guide.md");
  await Bun.write(tmp, md);
  try {
    const r = await build(tmp, { simPath: join(SMOKE, "없는-sim.ts") });
    expect(r.problems).toEqual([]);
    expect(r.vizIds).toEqual(["demo"]);
    expect(r.html).toContain('data-viz="demo"');
  } finally {
    await Bun.file(tmp).unlink();
  }
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

test("레일 — 숨김 기준점이 본문·레일 폭에서 유도된다", () => {
  expect(built.html).toContain(".gs-rail { display: none; }");

  // **기준점을 리터럴로 박아 두면 그 수가 틀렸을 때 시험이 오답을 지킨다.** 앞판이
  // 그랬다 — `78rem` 을 그대로 적어 두어서, 1440×900 화면에서 창을 최대로 켜도
  // (`innerWidth` 1232px) 레일이 한 번도 안 뜨는 상태가 초록으로 통과했다.
  // 그래서 세 폭에서 기준점을 **계산**한다.
  const rem = (re: RegExp): number => {
    const m = built.html.match(re);
    if (m?.[1] === undefined) throw new Error(`CSS 값을 못 찾았다: ${re}`);
    return Number.parseFloat(m[1]);
  };
  const mainW = rem(/main \{ max-width: ([\d.]+)rem/);
  const railW = rem(/width: ([\d.]+)rem; max-height: calc\(100vh/);
  const edge = rem(/right: max\(([\d.]+)rem, calc\(50vw/);
  const breakpoint = rem(/@media \(min-width: ([\d.]+)rem\) \{\n {2}\.gs-rail/);

  // 본문 오른쪽 끝 = W/2 + mainW/2 · 레일 왼쪽 끝 = W − edge − railW.
  // 둘 사이가 가장자리 여백(edge) 이상이려면 W ≥ 4·edge + 2·railW + mainW.
  expect(breakpoint).toBe(4 * edge + 2 * railW + mainW);

  // 기준점 바로 그 폭에서 실제로 안 겹치는지 값으로 확인한다.
  const railLeft = breakpoint - edge - railW;
  const mainRight = breakpoint / 2 + mainW / 2;
  expect(railLeft - mainRight).toBeGreaterThanOrEqual(edge);
});

test("레일 — 항목이 0개면 nav 를 아예 안 낸다", () => {
  expect(railHtml([])).toBe("");
});

/* ────────────── 표 칸 대조 — `B2` (`KAN-034.9` 배치2 `S7`) ────────────── */

/**
 * 임시 원고 한 장을 지어 빌드한다. 사이드카는 없는 경로를 준다 — 번들 단계를 안 탄다.
 *
 * `_fixtures/` 안에 짓는 이유는 `build` 가 `.sim.ts` 를 같은 디렉터리에서 찾기 때문이고,
 * 끝나면 지운다.
 */
async function buildMd(name: string, lines: string[]) {
  const tmp = join(SMOKE, `${name}-guide.md`);
  await Bun.write(tmp, `${lines.join("\n")}\n`);
  try {
    return await build(tmp, { simPath: join(SMOKE, "없는-sim.ts") });
  } finally {
    await Bun.file(tmp).unlink();
  }
}

test("표 칸 — 인라인 코드 안의 `|` 가 칸을 삼키면 잡는다", async () => {
  // 2026-09-10 `pollardRho-guide.md:141` 실측. 스캐너 넷이 전부 초록이었다.
  const r = await buildMd("pipe-in-cell", [
    "# 표본",
    "",
    "| 기호 | 무엇인가 | 이 문제에서 |",
    "| --- | --- | --- |",
    "| `d` | 그 걸음의 최대공약수 | `gcd(|x − y|, n)` |",
  ]);

  expect(r.problems).toEqual([
    "5줄 표 칸: 원고 5칸 vs 렌더 3칸 — 칸이 사라졌다. 칸 안의 `|` 는 `\\|` 로 쓴다(인라인 코드 안이어도 그렇다)",
  ]);

  // **결함이 실재한다는 것을 함께 잰다.** 판정만 보면 시험이 스스로를 지킨다 —
  // 마지막 칸의 내용이 산출에서 통째로 없어졌고 코드 스팬도 깨졌다.
  expect(r.html).not.toContain("gcd(|x − y|, n)");
  expect(r.html).toContain("<td>`gcd(</td>");
});

test("표 칸 — `articulationPoints` 기호표 모양이 걸린다", async () => {
  // `KAN-034.7` 배치6 이 손으로 찾은 자리다 — 기호표의 한 칸이 HTML 에서 통째로
  // 사라졌는데 스캐너 넷이 전부 초록이었다. 그때는 강제 지점이 없어 원고만 고쳤고,
  // 지금 원고에는 남아 있지 않다. 그 모양을 표본으로 세워 검사가 실제로 잡는지 잰다.
  const r = await buildMd("articulation-symbols", [
    "# 표본",
    "",
    "| 기호 | 무엇인가 | 이 문제에서 |",
    "| --- | --- | --- |",
    "| `V` | 정점의 개수 | `1 ≤ V ≤ 10^5` |",
    "| `low(v)` | `min(disc(v), min(low(w) | w 는 v 의 자식))` | `disc(v)` 이하 |",
    "| `A` | 단절점의 집합 | 원소 수가 `V − 2` 이하 |",
  ]);

  expect(r.problems).toEqual([
    "6줄 표 칸: 원고 4칸 vs 렌더 3칸 — 칸이 사라졌다. 칸 안의 `|` 는 `\\|` 로 쓴다(인라인 코드 안이어도 그렇다)",
  ]);
  // 사라진 것은 **마지막 칸**이다. 원고를 읽는 사람에게만 보인다.
  expect(r.html).not.toContain("<code>disc(v)</code> 이하");
});

test("표 칸 — `\\|` 로 이스케이프한 칸은 안 걸리고 세로줄이 산출에 남는다", async () => {
  // 오탐 시험. 처방은 렌더러가 삼켜 주는 것이 아니라 원고가 `\|` 로 쓰는 것이다.
  const r = await buildMd("escaped-pipe", [
    "# 표본",
    "",
    "| 기호 | 무엇인가 | 이 문제에서 |",
    "| --- | --- | --- |",
    "| `d` | 그 걸음의 최대공약수 | `gcd(\\|x − y\\|, n)` |",
  ]);

  expect(r.problems).toEqual([]);
  expect(r.html).toContain("<code>gcd(|x − y|, n)</code>");
});

test("표 칸 — 표 밖의 `|` 는 안 본다 (펜스 · 산문 · 수식)", async () => {
  // 오탐 시험. ascii 펜스는 세로줄로 그림을 그리고, 절댓값은 산문에도 수식에도 나온다.
  // 줄 단위로 `|` 를 세는 스캐너였다면 여기서 전부 빨개진다.
  const r = await buildMd("pipe-outside-table", [
    "# 표본",
    "",
    "| 무엇 | 왜 |",
    "| --- | --- |",
    "| 표 | 정상이다 |",
    "",
    "산문에서 `|x|` 를 이렇게 쓴다. 수식으로는 $|A| \\leq V - 2$ 다.",
    "",
    "<!--viz:demo-->",
    "```text",
    "  0 | 1 | 2",
    "  --+---+--",
    "  a | b | c",
    "```",
  ]);

  expect(r.problems).toEqual([]);
  expect(r.vizIds).toEqual(["demo"]);
});

test("표 칸 — 칸이 모자란 행도 잡는다 (렌더가 빈 칸으로 메운다)", async () => {
  const r = await buildMd("short-row", [
    "# 표본",
    "",
    "| 기호 | 무엇인가 | 이 문제에서 |",
    "| --- | --- | --- |",
    "| `V` | 정점의 개수 |",
  ]);

  expect(r.problems).toEqual([
    "5줄 표 칸: 원고 2칸 vs 렌더 3칸 — 칸이 늘어났다. 칸 안의 `|` 는 `\\|` 로 쓴다(인라인 코드 안이어도 그렇다)",
  ]);
  // 렌더는 빈 칸을 하나 만들어 낸다 — 원고에 없는 칸이 화면에 선다.
  expect(r.html).toContain("<td></td>");
});

test("표 칸 — `check` 블록 안에 접힌 표도 본다", async () => {
  // 마커를 접으면 표가 `<details>` 안으로 들어간다. 양쪽 걷기가 컨테이너 아래로
  // 안 내려가면 접힌 표는 대조에서 통째로 빠진다.
  const r = await buildMd("table-in-check", [
    "# 표본",
    "",
    "<!--check:c1-->",
    "",
    "| 기호 | 무엇인가 | 이 문제에서 |",
    "| --- | --- | --- |",
    "| `d` | 최대공약수 | `gcd(|x, y)` |",
    "",
    "<!--/check-->",
  ]);

  expect(r.html).toContain('<details class="gs-check"');
  expect(r.problems).toEqual([
    "7줄 표 칸: 원고 4칸 vs 렌더 3칸 — 칸이 사라졌다. 칸 안의 `|` 는 `\\|` 로 쓴다(인라인 코드 안이어도 그렇다)",
  ]);
});
