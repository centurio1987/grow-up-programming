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
