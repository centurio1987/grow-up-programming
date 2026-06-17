/**
 * 공용 시뮬레이션 컴포넌트의 마운트/상호작용 테스트.
 * happy-dom 으로 헤드리스 DOM을 띄워 React 19 로 렌더하고,
 * 다음/이전/슬라이더 조작 시 렌더 프레임이 바뀌는지 검증한다.
 * (114개 개별 guide가 아니라 공용 컴포넌트 1곳의 로직을 보장한다.)
 */
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();
// React act() 환경 플래그
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

import { test, expect } from "bun:test";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { AlgorithmSimulation, type Frame } from "#guide-sim";

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
