import type { Frame } from "#guide-sim";

/** 정상 마운트 대상. */
export const demo = {
  view: "array" as const,
  steps: [
    { title: "시작", array: [3, 1, 2] },
    { title: "교환", array: [1, 3, 2], highlight: [0, 1] },
    { title: "완료", array: [1, 2, 3], marked: [0, 1, 2] },
  ] satisfies Frame[],
  title: "표본",
  result: "[1,2,3]",
};

/** 빈 `steps` — 빌더가 `createRoot` 를 **부르지 않아야** ascii 폴백이 산다. */
export const empty = {
  view: "array" as const,
  steps: [] satisfies Frame[],
  title: "빈 것",
  result: "없음",
};
