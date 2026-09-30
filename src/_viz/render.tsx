/**
 * 도식 한 장을 **자립 SVG 문자열**로 뽑는다 — 브라우저 없이, 결정론적으로(KAN-057).
 *
 * 왜 `renderToStaticMarkup` 이 아닌가: 시각화 패키지의 칠(fill/stroke) 스타일시트가
 * `useInsertionEffect` 로 주입되고 그 상수가 export 되지 않는다. 서버 렌더는 effect 를 안 돌리므로
 * 칠이 없는 도식이 나온다(`~/resume/scripts/render-core.ts` 머리 주석). 그래서 happy-dom 위에서
 * **클라이언트 mount** 를 하고, 주입된 `<style>` 과 Provider 가 wrapper 에 단 CSS 변수를 SVG 안으로
 * 옮긴다. 이 경로는 KAN-057 S2 스파이크(`_scratch/viz-spike/spike.tsx`)에서 확인했다.
 *
 * 결정론: `useId` 가 렌더마다 늘리는 식별자를 그림 id 기준 고정 접두어로 바꾼다. 같은 입력이면
 * 같은 바이트가 나와야 커밋본 대조(신선도 게이트)가 성립한다.
 */

import { GlobalRegistrator } from "@happy-dom/global-registrator";
import type { ReactElement } from "react";
import { algoVizStyleGuide } from "../../design/viz/algo.viz";

export type VizPreset = "light" | "dark" | "mono";

/**
 * `adaptive`(기본) — 세 변형의 CSS 변수를 한 SVG 에 담는다. 밝은 쪽이 기본이고, 어두운 쪽은
 * `prefers-color-scheme: dark` 에서, 흑백은 인쇄에서 덮는다. 그래서 커밋하는 SVG 는 한 장이고
 * md(이미지)·HTML(인라인)·인쇄가 같은 파일을 쓴다. 변형 하나로 고정하려면 그 이름을 준다.
 */
export type VizMode = VizPreset | "adaptive";

/** 스타일 가이드의 변형 하나를 CSS 선언 묶음으로 — Provider 가 wrapper 에 다는 것과 같은 값이다. */
async function varsOf(preset: VizPreset): Promise<string> {
  const { resolveVizFoundationPreset, visualizationFoundationToStyleObject } =
    await import("@centurio1987/bbangto-ui-visualization");
  const { foundations, extendedFoundations } = resolveVizFoundationPreset(
    algoVizStyleGuide,
    preset,
  );
  const all = {
    ...visualizationFoundationToStyleObject(foundations),
    ...extendedFoundations,
  };
  return Object.entries(all)
    .map(([k, v]) => `${k}: ${v};`)
    .join(" ");
}

const SVG_NS = "http://www.w3.org/2000/svg";

function ensureDom(): void {
  if (!GlobalRegistrator.isRegistered) GlobalRegistrator.register();
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
}

/**
 * `element` 를 알고리즘 가이드 스타일 가이드 아래에서 mount 해 SVG 한 장으로 돌려준다.
 * `id` 는 그림 식별자(`fig:<id>`)이고 문서 안 id 충돌을 막는 접두어가 된다.
 */
export async function renderToSvg(
  element: ReactElement,
  id: string,
  mode: VizMode = "adaptive",
): Promise<string> {
  const preset: VizPreset = mode === "adaptive" ? "light" : mode;
  ensureDom();
  const { act } = await import("react");
  const { createRoot } = await import("react-dom/client");
  const { VisualizationStyleGuideProvider } = await import(
    "@centurio1987/bbangto-ui-visualization"
  );

  document.head.innerHTML = "";
  document.body.innerHTML = '<div id="viz-root"></div>';
  const host = document.getElementById("viz-root") as HTMLElement;
  const root = createRoot(host);
  await act(async () => {
    root.render(
      <VisualizationStyleGuideProvider
        styleGuide={algoVizStyleGuide}
        foundationKey={preset}
      >
        {element}
      </VisualizationStyleGuideProvider>,
    );
  });

  try {
    const svg = host.querySelector("svg");
    if (!svg) throw new Error(`도식 ${id}: svg 가 렌더되지 않았다`);
    const wrapper = host.querySelector("[data-bbangto-viz-style-guide]");
    if (!wrapper) throw new Error(`도식 ${id}: 스타일 가이드 wrapper 가 없다`);

    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", SVG_NS);
    // 칠 규칙은 `[data-bbangto-viz-style-guide] …` 로 걸리므로 wrapper 의 표지 속성을 루트로 옮긴다.
    for (const a of [...wrapper.attributes]) {
      if (a.name.startsWith("data-bbangto-viz"))
        clone.setAttribute(a.name, a.value);
    }
    clone.setAttribute("data-viz-fig", id);
    let varCss: string;
    if (mode === "adaptive") {
      const sel = `svg[data-viz-fig="${id}"]`;
      varCss = [
        `${sel} { ${await varsOf("light")} }`,
        `@media (prefers-color-scheme: dark) { ${sel} { ${await varsOf("dark")} } }`,
        `@media print { ${sel} { ${await varsOf("mono")} } }`,
      ].join("\n");
    } else {
      // 변형 하나로 고정 — Provider 가 wrapper 에 단 값을 그대로 루트에 싣는다.
      varCss = `svg[data-viz-fig="${id}"] { ${wrapper.getAttribute("style") ?? ""} }`;
    }

    const css = [...document.head.querySelectorAll("style")]
      .map((s) => s.textContent ?? "")
      .concat(varCss)
      .join("\n");
    const styleEl = document.createElementNS(SVG_NS, "style");
    styleEl.textContent = css;
    clone.insertBefore(styleEl, clone.firstChild);

    // happy-dom 의 outerHTML 은 속성 값 속 `<` 를 그대로 둔다. 자립 SVG 는 XML 이라 그대로면
    // 올바른 문서가 아니다 — 그림 이름·곁말에 「n < p」가 들면 뷰어가 열지 못한다.
    let out = clone.outerHTML.replace(
      /="([^"]*)"/g,
      (_, v: string) => `="${v.replaceAll("<", "&lt;")}"`,
    );
    const ids = [...new Set(out.match(/_r_[0-9a-z]+_/g) ?? [])];
    ids.forEach((raw, k) => {
      out = out.replaceAll(raw, `${id}-${k}`);
    });
    return `${out}\n`;
  } finally {
    await act(async () => root.unmount());
  }
}
