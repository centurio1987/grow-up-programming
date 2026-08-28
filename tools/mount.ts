/**
 * `[data-viz]` 자리에 시뮬레이션을 붙인다.
 *
 * **생성된 entry 문자열 안에 두지 않는다.** 이 로직에는 시험해야 할 규칙이 하나 있는데,
 * 문자열 안에 있으면 그 규칙을 시험할 방법이 없다 — 빌더가 "HTML 이 나왔다" 까지만 말하고
 * 마운트가 무엇을 지웠는지는 아무도 안 본다.
 */

/** `.sim.ts` 가 내보내는 것. 빌더는 이 모양만 알면 된다. */
export interface SimSpec {
  view: unknown;
  steps: unknown[];
  title?: string;
  result?: string;
  [key: string]: unknown;
}

export interface MountDeps {
  createRoot: (el: Element) => { render: (node: unknown) => void };
  createElement: (type: unknown, props: unknown) => unknown;
  Component: unknown;
}

export interface MountReport {
  mounted: string[];
  /** 폴백(ascii)을 그대로 둔 자리. spec 이 없거나 `steps` 가 빈 경우다. */
  keptFallback: string[];
}

/**
 * **`steps` 가 비었으면 `createRoot` 를 부르지 않는다.**
 *
 * `createRoot().render()` 는 컨테이너의 기존 자식을 지운다. 그런데 그 자식이 바로
 * 빌더가 남겨 둔 ascii 폴백(`<pre class="gs-ascii">`)이다. 부르는 순간 JS 를 켠 화면에서
 * **그림이 0개**가 되고, 그건 JS 를 끈 화면에 대해 지적했던 구멍과 정확히 대칭이다.
 * `AlgorithmSimulation` 이 `steps.length === 0` 에서 `null` 을 반환하므로 화면에는
 * 아무것도 안 남는다 — 부르기 전에 걸러야 한다.
 */
export function mountAll(
  root: { querySelectorAll: (s: string) => Iterable<Element> },
  sims: Record<string, SimSpec | undefined>,
  deps: MountDeps,
): MountReport {
  const mounted: string[] = [];
  const keptFallback: string[] = [];

  for (const el of root.querySelectorAll("[data-viz]")) {
    const id = el.getAttribute("data-viz") ?? "";
    const spec = sims[id];
    if (!spec || !Array.isArray(spec.steps) || spec.steps.length === 0) {
      keptFallback.push(id);
      continue;
    }
    el.replaceChildren();
    deps.createRoot(el).render(deps.createElement(deps.Component, spec));
    mounted.push(id);
  }

  return { mounted, keptFallback };
}
