import { afterAll, beforeAll, expect, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { type PlayerSpec, StepPlayer, splitTitle } from "./StepPlayer";

// 가상 DOM 은 이 파일에서 켠 경우에만 끈다 — 켠 채로 두면 뒤에 오는 시험 파일(`guide-sim.test.tsx`)이
// 모듈 머리에서 다시 등록하다 실패한다(같은 프로세스에서 돈다).
let registeredHere = false;
beforeAll(() => {
  if (!GlobalRegistrator.isRegistered) {
    GlobalRegistrator.register();
    registeredHere = true;
  }
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});
afterAll(async () => {
  if (registeredHere) await GlobalRegistrator.unregister();
});

const load = async () =>
  (
    await import(
      "../../algorithms/array/sparseTableRangeMin/sparseTableRangeMin-guide.sim.ts"
    )
  ).build as unknown as PlayerSpec;

test("제목 머리의 걸음 번호와 나머지를 가른다", () => {
  expect(splitTitle("T8 2 층 칸 0 만들기")).toEqual({
    id: "T8",
    rest: "2 층 칸 0 만들기",
  });
});

test("다음 · 배지 · ← → 로 걸음을 넘기고, 무대 높이와 강조는 걸음을 따라 바뀌지 않거나 옮겨 간다", async () => {
  const spec = await load();
  document.body.innerHTML = '<div id="p"></div>';
  const host = document.getElementById("p") as HTMLElement;
  const root = createRoot(host);
  await act(async () => root.render(<StepPlayer {...spec} />));

  const stage = () =>
    host.querySelector(".gs-player-stage") as HTMLElement | null;
  const current = () =>
    host.querySelector('.gs-player-badge[data-state="current"]')?.textContent;
  const h0 = stage()?.style.height;
  expect(current()).toBe("T3");
  expect(host.querySelector(".gs-player-pill")?.textContent).toBe(
    "min(5, 2) =2",
  );

  const next = host.querySelector(
    'button[aria-label="다음 걸음"]',
  ) as HTMLButtonElement;
  await act(async () => next.click());
  expect(current()).toBe("T4");
  expect(stage()?.style.height).toBe(h0);

  const t8 = [...host.querySelectorAll(".gs-player-badge")].find(
    (b) => b.textContent === "T8",
  ) as HTMLButtonElement;
  await act(async () => t8.click());
  expect(current()).toBe("T8");
  expect(stage()?.style.height).toBe(h0);
  // 지난 걸음은 실선(done), 앞 걸음은 대시(todo)
  expect(
    host.querySelectorAll('.gs-player-badge[data-state="done"]').length,
  ).toBe(5);
  expect(
    host.querySelectorAll('.gs-player-badge[data-state="todo"]').length,
  ).toBe(2);
  // 강조는 이번 걸음의 것만 — 읽음 둘, 새로 씀 하나
  expect(host.querySelectorAll('[data-viz-state="read"]').length).toBe(2);
  expect(host.querySelectorAll('[data-viz-state="focus"]').length).toBe(1);

  const panel = host.querySelector(".gs-player") as HTMLElement;
  await act(async () => {
    panel.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
    );
  });
  expect(current()).toBe("T7");
  expect(host.querySelector(".gs-player-vars")?.textContent).toContain(
    "채운 칸 5 / 8",
  );

  await act(async () => root.unmount());
});

test("그래프 무대 — 정점 · 간선 · 두 스택을 그리고, 걸음을 넘겨도 무대 높이가 같다", async () => {
  const spec = (
    await import(
      "../../algorithms/graph/stronglyConnectedComponents/stronglyConnectedComponents-guide.sim.ts"
    )
  ).walkFirst as unknown as PlayerSpec;
  document.body.innerHTML = '<div id="g"></div>';
  const host = document.getElementById("g") as HTMLElement;
  const root = createRoot(host);
  await act(async () => root.render(<StepPlayer {...spec} />));

  const stage = () =>
    host.querySelector(".gs-player-stage") as HTMLElement | null;
  const h0 = stage()?.style.height;
  expect(host.querySelectorAll("[data-viz-node]").length).toBe(6);
  expect(host.querySelectorAll("[data-viz-edge]").length).toBe(7);
  expect(host.querySelectorAll("[data-viz-strip]").length).toBe(2);

  const t5 = [...host.querySelectorAll(".gs-player-badge")].find(
    (b) => b.textContent === "T5",
  ) as HTMLButtonElement;
  await act(async () => t5.click());
  expect(stage()?.style.height).toBe(h0);
  // T5 — 간선 2→0 이 low[2] 를 줄인다: 새로 쓴 정점 2 와 새로 쓴 간선 하나
  expect(
    host.querySelector('[data-viz-node="2"]')?.getAttribute("data-viz-state"),
  ).toBe("focus");
  expect(
    host.querySelector('[data-viz-edge="2->0"]')?.getAttribute("data-viz-kind"),
  ).toBe("back");
  expect(host.querySelector(".gs-player-pill")?.textContent).toBe(
    "low[2] = min(2, disc[0]) =0",
  );

  await act(async () => root.unmount());
});

test("배열 무대 — 배열 전체와 후보 괄호를 그리고, 구간 밖은 대시 · 찾은 칸은 새로 씀이다", async () => {
  const spec = (
    await import(
      "../../algorithms/binary-search/binarySearch/binarySearch-guide.sim.ts"
    )
  ).probe as unknown as PlayerSpec;
  document.body.innerHTML = '<div id="a"></div>';
  const host = document.getElementById("a") as HTMLElement;
  const root = createRoot(host);
  await act(async () => root.render(<StepPlayer {...spec} />));

  const stage = () =>
    host.querySelector(".gs-player-stage") as HTMLElement | null;
  const h0 = stage()?.style.height;
  // T1 — 후보가 배열 전체다: 괄호 [0,5], 대시 칸 없음
  const range = () => host.querySelector("[data-viz-range]");
  expect(range()?.getAttribute("data-viz-from")).toBe("0");
  expect(range()?.getAttribute("data-viz-to")).toBe("5");
  expect(host.querySelectorAll('[data-viz-state="out"]').length).toBe(0);

  // T3 — A[2] = 5 를 읽고 lo = 3: 괄호가 [3,5] 로 옮겨 간다. 앞 세 칸 중 이번에 읽은 칸 2 는
  // 「읽음」이 이기고(강조는 이번 걸음의 읽음과 새로 씀), 나머지 둘이 대시다
  const badge = (id: string) =>
    [...host.querySelectorAll(".gs-player-badge")].find(
      (b) => b.textContent === id,
    ) as HTMLButtonElement;
  await act(async () => badge("T3").click());
  expect(stage()?.style.height).toBe(h0);
  expect(range()?.getAttribute("data-viz-from")).toBe("3");
  expect(host.querySelectorAll('[data-viz-state="out"]').length).toBe(2);
  expect(host.querySelectorAll('[data-viz-state="read"]').length).toBe(1);

  // 마지막 걸음 — 찾은 칸 하나가 새로 씀이다
  await act(async () => badge("T7").click());
  expect(host.querySelectorAll('[data-viz-state="focus"]').length).toBe(1);

  await act(async () => root.unmount());
});

test("배열 무대 · 값이 좌표인 줄 — 인덱스 줄이 없고 괄호를 값으로 적는다", async () => {
  const spec = (
    await import(
      "../../algorithms/binary-search/parametricBinarySearch/parametricBinarySearch-guide.sim.ts"
    )
  ).probe as unknown as PlayerSpec;
  document.body.innerHTML = '<div id="v"></div>';
  const host = document.getElementById("v") as HTMLElement;
  const root = createRoot(host);
  await act(async () => root.render(<StepPlayer {...spec} />));

  // T1 — 후보값 줄 전체가 괄호 안이고, 인덱스 눈금 줄은 그리지 않는다
  expect(host.querySelectorAll('[data-viz-role="index"]').length).toBe(0);
  const range = () => host.querySelector("[data-viz-range]");
  expect(range()?.getAttribute("data-viz-from")).toBe("0");
  expect(range()?.textContent).toContain("[10,32]");

  // T3 — 21 이 참이라 hi = 20: 괄호 글자가 칸 자리 [0,10] 이 아니라 값 [10,20] 이다
  const badge = (id: string) =>
    [...host.querySelectorAll(".gs-player-badge")].find(
      (b) => b.textContent === id,
    ) as HTMLButtonElement;
  await act(async () => badge("T3").click());
  expect(range()?.getAttribute("data-viz-to")).toBe("10");
  expect(range()?.textContent).toContain("[10,20]");

  await act(async () => root.unmount());
});

test("배열 무대 · 배열에서 만드는 구조 — 누적합 배열과 답 목록을 첫 걸음부터 칸째로 쌓는다", async () => {
  const spec = (
    await import(
      "../../algorithms/array/prefixSumRangeQuery/prefixSumRangeQuery-guide.sim.ts"
    )
  ).walk as unknown as PlayerSpec;
  document.body.innerHTML = '<div id="p"></div>';
  const host = document.getElementById("p") as HTMLElement;
  const root = createRoot(host);
  await act(async () => root.render(<StepPlayer {...spec} />));

  const stage = () =>
    host.querySelector(".gs-player-stage") as HTMLElement | null;
  const count = (sel: string) => host.querySelectorAll(sel).length;
  const h0 = stage()?.style.height;
  // T1 — 입력 배열 · 누적합 배열 · 답 목록 세 줄이다. 격자는 누적합 배열의 n + 1 칸에 맞춘다.
  // 칸 0 만 새로 썼고, 나머지 여섯 칸과 답 다섯 칸은 아직 안 쓴 칸이다
  expect(count('[data-viz-role="stage-cells"]')).toBe(3);
  expect(count("[data-viz-index]")).toBe(7);
  expect(count('[data-viz-state="empty"]')).toBe(11);
  expect(count('[data-viz-state="focus"]')).toBe(1);

  // 마지막 걸음 — 빈 칸이 없고, 두 칸을 읽고 답 한 칸을 새로 쓴다. 무대 높이는 그대로다
  const badge = (id: string) =>
    [...host.querySelectorAll(".gs-player-badge")].find(
      (b) => b.textContent === id,
    ) as HTMLButtonElement;
  await act(async () => badge("T12").click());
  expect(stage()?.style.height).toBe(h0);
  expect(count('[data-viz-state="empty"]')).toBe(0);
  expect(count('[data-viz-state="focus"]')).toBe(1);
  expect(count('[data-viz-state="read"]')).toBe(2);

  await act(async () => root.unmount());
});

test("배열 무대 · 칸 수로 세지 않는 후보 — 값 줄 곁말이 구간 길이이고, 아직 재지 않은 자리는 빈 칸이다", async () => {
  const spec = (
    await import(
      "../../algorithms/binary-search/ternarySearch/ternarySearch-guide.sim.ts"
    )
  ).narrow as unknown as PlayerSpec;
  document.body.innerHTML = '<div id="t"></div>';
  const host = document.getElementById("t") as HTMLElement;
  const root = createRoot(host);
  await act(async () => root.render(<StepPlayer {...spec} />));

  const stage = () =>
    host.querySelector(".gs-player-stage") as HTMLElement | null;
  const count = (sel: string) => host.querySelectorAll(sel).length;
  const h0 = stage()?.style.height;
  // T1 — 두 끝만 잰 상태라 나머지 열두 자리는 빈 칸이고, 곁말은 칸 수가 아니라 길이다
  expect(count('[data-viz-state="empty"]')).toBe(12);
  expect(stage()?.textContent).toContain("길이 9");
  expect(stage()?.textContent).not.toContain("후보 14 칸");

  // 마지막 걸음 — 잰 자리가 모두 찼고, 무대 높이는 그대로다
  const badge = (id: string) =>
    [...host.querySelectorAll(".gs-player-badge")].find(
      (b) => b.textContent === id,
    ) as HTMLButtonElement;
  await act(async () => badge("T8").click());
  expect(stage()?.style.height).toBe(h0);
  expect(count('[data-viz-state="empty"]')).toBe(0);
  expect(stage()?.textContent).toContain("길이 0.790");

  await act(async () => root.unmount());
});

test("배열 무대 · 층 곁말 — 처음부터 가득 찬 줄은 채움 대신 걸음마다 적은 곁말을 싣는다", async () => {
  const spec = (
    await import("../../algorithms/etc/maxCounters/maxCounters-guide.sim.ts")
  ).counters as unknown as PlayerSpec;
  document.body.innerHTML = '<div id="m"></div>';
  const host = document.getElementById("m") as HTMLElement;
  const root = createRoot(host);
  await act(async () => root.render(<StepPlayer {...spec} />));

  const stage = () =>
    host.querySelector(".gs-player-stage") as HTMLElement | null;
  const h0 = stage()?.style.height;
  // T1 — 저장값 줄과 참값 줄이 모두 0 으로 차 있지만 곁말은 「채움 5 / 5」가 아니다
  expect(stage()?.textContent).toContain("옛 값 0 칸");
  expect(stage()?.textContent).toContain("base = 0");
  expect(stage()?.textContent).not.toContain("채움");

  // 최대 맞추기 걸음 — 저장값은 그대로이고 곁말만 바뀐다. 무대 높이는 그대로다
  const badge = (id: string) =>
    [...host.querySelectorAll(".gs-player-badge")].find(
      (b) => b.textContent === id,
    ) as HTMLButtonElement;
  await act(async () => badge("T5").click());
  expect(stage()?.style.height).toBe(h0);
  expect(stage()?.textContent).toContain("옛 값 4 칸");
  expect(stage()?.textContent).toContain("base = 2");

  await act(async () => root.unmount());
});
