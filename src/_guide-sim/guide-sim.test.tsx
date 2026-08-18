/**
 * 공용 시뮬레이션 컴포넌트의 마운트/상호작용 테스트.
 * happy-dom 으로 헤드리스 DOM을 띄워 React 19 로 렌더하고,
 * 다음/이전/슬라이더 조작 시 렌더 프레임이 바뀌는지 검증한다.
 * (114개 개별 guide가 아니라 공용 컴포넌트 1곳의 로직을 보장한다.)
 */
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();
// React act() 환경 플래그
(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

import { expect, test } from "bun:test";
import type { ReactNode } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import {
  AlgorithmSimulation,
  type Frame,
  resolveRegistry,
  type ViewComponent,
} from "#guide-sim";

const steps: Frame[] = [
  { title: "초기", array: [3, 1, 2] },
  { title: "교환", array: [1, 3, 2], highlight: [0, 1] },
  { title: "완료", array: [1, 2, 3], marked: [0, 1, 2] },
];

function counter(c: HTMLElement) {
  return c.querySelector('[data-testid="gs-counter"]')?.textContent;
}

test("마운트 시 첫 프레임과 카운터를 렌더한다", async () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(<AlgorithmSimulation view="array" steps={steps} title="t" />);
  });
  expect(counter(container)).toBe("1 / 3");
  expect(container.textContent).toContain("초기");
  await act(async () => root.unmount());
});

test("다음/이전 버튼이 프레임을 바꾼다", async () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(<AlgorithmSimulation view="array" steps={steps} />);
  });

  const next = container.querySelector(
    'button[aria-label="next"]',
  ) as HTMLButtonElement;
  const prev = container.querySelector(
    'button[aria-label="prev"]',
  ) as HTMLButtonElement;

  expect(prev.disabled).toBe(true); // 첫 프레임에서 이전 비활성

  await act(async () => next.click());
  expect(counter(container)).toBe("2 / 3");
  expect(container.textContent).toContain("교환");

  await act(async () => next.click());
  expect(counter(container)).toBe("3 / 3");
  expect(next.disabled).toBe(true); // 마지막 프레임에서 다음 비활성

  await act(async () => prev.click());
  expect(counter(container)).toBe("2 / 3");

  await act(async () => root.unmount());
});

test("슬라이더가 현재 스텝과 범위를 반영한다", async () => {
  // 참고: happy-dom + React 19 에서는 range 의 onChange 가 프로그램적 이벤트로
  // 발화하지 않으므로(click 은 정상), 슬라이더의 controlled 바인딩(value/max)이
  // 스텝 상태를 반영하는지로 검증한다.
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(<AlgorithmSimulation view="array" steps={steps} />);
  });

  const slider = container.querySelector(".gs-slider") as HTMLInputElement;
  expect(slider.max).toBe("2"); // steps.length - 1
  expect(slider.value).toBe("0");

  const next = container.querySelector(
    'button[aria-label="next"]',
  ) as HTMLButtonElement;
  await act(async () => next.click());
  await act(async () => next.click());
  expect(slider.value).toBe("2"); // 슬라이더가 인덱스를 따라간다
  expect(counter(container)).toBe("3 / 3");
  expect(container.textContent).toContain("완료");

  await act(async () => root.unmount());
});

test("리셋이 첫 프레임으로 되돌린다", async () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(<AlgorithmSimulation view="array" steps={steps} />);
  });
  const next = container.querySelector(
    'button[aria-label="next"]',
  ) as HTMLButtonElement;
  const reset = container.querySelector(
    'button[aria-label="reset"]',
  ) as HTMLButtonElement;
  await act(async () => next.click());
  expect(counter(container)).toBe("2 / 3");
  await act(async () => reset.click());
  expect(counter(container)).toBe("1 / 3");
  await act(async () => root.unmount());
});

test("tree 뷰가 빈 자식 자리(null)를 좌우 구분이 남게 그린다", async () => {
  // 자식이 하나뿐인 이진 트리는 그것이 왼쪽인지 오른쪽인지가 의미를 가진다.
  // 빈 자리를 빠뜨리면 다른 트리가 그려지고, 예전에는 그 자리에서 렌더가 죽었다.
  const treeSteps: Frame[] = [
    {
      title: "오른쪽 자식만 있는 노드",
      root: {
        id: "root",
        label: "[1,5]",
        children: [null, { id: "child", label: "[3,8]" }],
      },
    },
  ];
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(<AlgorithmSimulation view="tree" steps={treeSteps} />);
  });
  expect(container.textContent).toContain("[3,8]");
  expect(container.querySelectorAll(".gs-tree-gap").length).toBe(1);
  await act(async () => root.unmount());
});

/* ────────── 뷰 해석 회귀 (KAN-033 예외 5) ──────────
 *
 * 위 다섯은 전부 `view` 가 **단일 문자열**이라, 아래가 손대는 경로(배열 렌더 · 레지스트리
 * 병합 · 미지 이름 처리)를 하나도 덮지 않았다. `.mdx` 소비자 182편은 타입 검사 대상이
 * 아니므로 여기서 안 잡으면 파손이 편별 런타임에서만 드러난다.
 */

/** 렌더해서 컨테이너를 돌려준다. 언마운트는 호출부가 반환된 `root` 로 한다. */
async function mount(node: ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(node);
  });
  return { container, root };
}

/** 한 프레임의 `extra` 를 그대로 읽어 그리는 시험용 뷰. */
const ExtraProbe: ViewComponent = ({ frame }) => (
  <div className="probe">{String(frame.extra?.label ?? "없음")}</div>
);

test("view 를 배열로 주면 패널이 여러 개 렌더된다", async () => {
  const { container, root } = await mount(
    <AlgorithmSimulation view={["array", "keyValue"]} steps={steps} />,
  );
  expect(container.querySelectorAll(".gs-array").length).toBe(1);
  expect(container.querySelectorAll(".gs-kv").length).toBe(1);
  await act(async () => root.unmount());
});

test("같은 뷰를 두 번 주면 패널 둘이 나란히 뜬다", async () => {
  // 키를 뷰 이름으로만 잡으면 React 가 중복으로 보고 한 장만 남는다.
  // "배열 둘을 나란히" 는 정당한 요구라 슬롯 번호를 키에 섞는다.
  const { container, root } = await mount(
    <AlgorithmSimulation view={["array", "array"]} steps={steps} />,
  );
  expect(container.querySelectorAll(".gs-array").length).toBe(2);
  await act(async () => root.unmount());
});

test("extraViews 로 등록한 새 이름의 뷰가 렌더된다", async () => {
  const { container, root } = await mount(
    <AlgorithmSimulation
      view={["array", "probe"]}
      steps={steps}
      extraViews={{ probe: ExtraProbe }}
    />,
  );
  expect(container.querySelectorAll(".probe").length).toBe(1);
  expect(container.querySelectorAll(".gs-array").length).toBe(1);
  await act(async () => root.unmount());
});

test("extraViews 키가 프리셋 이름과 겹치면 던진다", () => {
  // 조용한 덮어쓰기는 어느 게이트도 못 잡는다. 프리셋을 고치려면 overrides 를 써야 한다.
  //
  // 컴포넌트로 감싸 시험하지 않는다 — React 는 렌더 중의 예외를 자기 큐에서 다시 던지므로
  // `act` 안의 try/catch 가 못 잡고, 잡히더라도 무엇이 던졌는지가 흐려진다.
  // 규칙 자체가 순수 함수에 있으므로 그 함수를 직접 부른다.
  expect(() => resolveRegistry({ array: ExtraProbe })).toThrow(
    /프리셋 이름과 겹칩니다/,
  );
  // 새 이름은 통과하고 프리셋과 나란히 살아 있어야 한다.
  const merged = resolveRegistry({ probe: ExtraProbe });
  expect(merged.probe).toBe(ExtraProbe);
  expect(merged.array).toBeDefined();
});

test("overrides 는 프리셋을 이기고 console.warn 을 남긴다", async () => {
  const original = console.warn;
  const messages: string[] = [];
  console.warn = (...args: unknown[]) => messages.push(args.join(" "));
  try {
    const { container, root } = await mount(
      <AlgorithmSimulation
        view="array"
        steps={steps}
        overrides={{ array: ExtraProbe }}
      />,
    );
    expect(container.querySelectorAll(".probe").length).toBe(1);
    expect(container.querySelectorAll(".gs-array").length).toBe(0);
    expect(messages.some((m) => m.includes("overrides"))).toBe(true);
    await act(async () => root.unmount());
  } finally {
    console.warn = original;
  }
});

test("알 수 없는 뷰 이름은 그 패널만 비우고 나머지는 그대로 그린다", async () => {
  // 던지지 않는다 — 한 패널의 오타가 나머지 패널과 산문까지 지우면 손해가 더 크다.
  // 대신 조용히 넘어가지도 않는다. 무증상 빈 패널이 가장 나쁜 결과다.
  const original = console.error;
  const messages: string[] = [];
  console.error = (...args: unknown[]) => messages.push(args.join(" "));
  try {
    const { container, root } = await mount(
      <AlgorithmSimulation
        view={["array", "typo"] as unknown as "array"[]}
        steps={steps}
      />,
    );
    expect(container.querySelectorAll(".gs-array").length).toBe(1);
    expect(counter(container)).toBe("1 / 3");
    expect(messages.some((m) => m.includes("알 수 없는 뷰 이름"))).toBe(true);
    await act(async () => root.unmount());
  } finally {
    console.error = original;
  }
});

test("steps 가 비면 아무것도 렌더하지 않는다", async () => {
  // 빌드 쪽 규약과 짝이다 — 마운트 지점의 ascii 폴백을 지우지 않으려면 빌더가
  // 이 경우 `createRoot` 자체를 부르지 않아야 한다.
  const { container, root } = await mount(
    <AlgorithmSimulation view="array" steps={[]} />,
  );
  expect(container.querySelector('[data-testid="guide-sim"]')).toBeNull();
  await act(async () => root.unmount());
});

test("새 뷰가 frame.extra 를 읽어 그린다", async () => {
  // 새 필드는 최상위가 아니라 `extra` 아래에 둔다. `Frame` 이 교집합이라 최상위에서
  // 이름이 겹치고 타입이 다르면 그 필드가 never 가 되고, 이미 나간 프레임이 함께 깨진다.
  const extraSteps: Frame[] = [
    { title: "한 걸음", extra: { label: "블록 3" } },
  ];
  const { container, root } = await mount(
    <AlgorithmSimulation
      view="probe"
      steps={extraSteps}
      extraViews={{ probe: ExtraProbe }}
    />,
  );
  expect(container.textContent).toContain("블록 3");
  await act(async () => root.unmount());
});

test("타입 픽스처 — 교집합 충돌과 뷰 이름 오타를 tsc 가 잡는다", () => {
  // 이 테스트의 본체는 런타임이 아니라 `bunx tsc --noEmit` 이다.
  // ① 같은 프레임이 여러 뷰의 필드를 함께 가질 수 있어야 한다(교집합이 성립).
  const both: Frame = { array: [1], highlight: [0], entries: [] };
  expect(both.array?.length).toBe(1);

  // ② extraViews 없이 등록되지 않은 이름을 주면 타입 에러여야 한다.
  //    이 유니온이 오타를 잡는 유일한 장치다 — `.mdx` 소비자는 tsc 대상이 아니다.
  // @ts-expect-error 등록하지 않은 뷰 이름
  const bad: ReactNode = <AlgorithmSimulation view="typo" steps={[]} />;
  expect(bad).toBeDefined();

  // ③ overrides 는 프리셋 이름만 받는다.
  const okOverride: ReactNode = (
    <AlgorithmSimulation
      view="array"
      steps={[]}
      // @ts-expect-error 프리셋이 아닌 이름은 overrides 대상이 아니다
      overrides={{ probe: ExtraProbe }}
    />
  );
  expect(okOverride).toBeDefined();
});
