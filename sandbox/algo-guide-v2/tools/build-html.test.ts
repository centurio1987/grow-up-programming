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
import { build } from "./build-html.ts";
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
  expect(built.html.match(/<\/script>/g)?.length).toBe(1);
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
