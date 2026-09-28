// KAN-057 S2 렌더 스파이크 — happy-dom 에서 클라이언트 mount 한 뒤 주입 스타일과 CSS 변수를
// SVG 안에 굳혀 자립 SVG 를 뽑는다. 브라우저 없이 되는지, 결정론적인지를 본다.
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();
// React 에게 act 환경임을 알린다(경고 억제·동기 flush).
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { act } = await import("react");
const { createRoot } = await import("react-dom/client");
const viz = await import("@centurio1987/bbangto-ui-visualization");
const cat = await import("@centurio1987/bbangto-ui-visualization-style-guide-catalog");
const { Canvas, Node, NodeLabel, VisualizationStyleGuideProvider } = viz;

const A = [5, 2, 7, 4, 6, 3];
const CELL = 48;
const GAP = 4;
const W = A.length * (CELL + GAP) + 16;
const H = 96;

function Strip() {
  return (
    <Canvas viewBox={`0 0 ${W} ${H}`} width={W} height={H} title="배열 A">
      {A.map((v, i) => {
        const x = 8 + i * (CELL + GAP);
        return (
          <g key={i}>
            <NodeLabel x={x} y={8} width={CELL} title={String(i)} />
            <Node x={x} y={32} width={CELL} height={CELL} />
            <NodeLabel x={x} y={32} width={CELL} height={CELL} title={String(v)} />
          </g>
        );
      })}
    </Canvas>
  );
}

export async function renderSvg(): Promise<string> {
  document.head.innerHTML = "";
  document.body.innerHTML = '<div id="root"></div>';
  const host = document.getElementById("root") as HTMLElement;
  const root = createRoot(host);
  await act(async () => {
    root.render(
      <VisualizationStyleGuideProvider styleGuide={(cat as any)[process.env.SG ?? "minimalLine01VizStyleGuide"]}>
        <Strip />
      </VisualizationStyleGuideProvider>,
    );
  });
  const styles = [...document.head.querySelectorAll("style")].map((s) => s.textContent ?? "");
  const svg = host.querySelector("svg");
  if (!svg) throw new Error("svg 가 없다");
  // Provider 의 wrapper 가 CSS 변수(인라인 style)와 칠 규칙의 기준 속성을 함께 들고 있다.
  // 둘 다 SVG 루트로 옮겨야 규칙 `[data-bbangto-viz-style-guide] [data-viz-part=…]` 가 걸린다.
  const wrapper = host.querySelector("[data-bbangto-viz-style-guide]") as HTMLElement | null;
  if (!wrapper) throw new Error("style guide wrapper 가 없다");
  const vars = wrapper.getAttribute("style") ?? "";
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  for (const a of [...wrapper.attributes]) {
    if (a.name.startsWith("data-bbangto-viz")) clone.setAttribute(a.name, a.value);
  }
  clone.setAttribute("style", `${vars};${clone.getAttribute("style") ?? ""}`);
  const styleEl = document.createElementNS("http://www.w3.org/2000/svg", "style");
  styleEl.textContent = styles.join("\n");
  clone.insertBefore(styleEl, clone.firstChild);
  // useId 가 렌더마다 늘어나는 식별자를 고정 접두어로 바꾼다 — 결정론.
  const ids = [...new Set(clone.outerHTML.match(/_r_[0-9a-z]+_/g) ?? [])];
  let out = clone.outerHTML;
  ids.forEach((id, k) => {
    out = out.replaceAll(id, `fig-p1-${k}`);
  });
  await act(async () => root.unmount());
  return out;
}

if (import.meta.main) {
  const a = await renderSvg();
  const b = await renderSvg();
  const outDir = new URL(".", import.meta.url).pathname;
  await Bun.write(`${outDir}/p1.svg`, a);
  console.log(JSON.stringify({
    bytes: a.length,
    deterministic: a === b,
    styleBlocks: (a.match(/<style/g) ?? []).length,
    cssVars: (a.match(/--bbangto-viz-[\w-]+:/g) ?? []).length,
    externalRefs: (a.match(/(href|src)="https?:/g) ?? []).length,
    rects: (a.match(/<(rect|path)\b/g) ?? []).length,
    texts: (a.match(/<text\b/g) ?? []).length,
  }));
}
