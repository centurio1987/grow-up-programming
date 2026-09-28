/**
 * `sparseTableRangeMin-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 층 `k` 의 칸 `i` 는 정본에
 * 구간 `[i, i+2^k−1]` 을 물은 답이고, 두 조각도 정본이 답을 내는 자리에서 계산한다.
 */

import type { ReactElement } from "react";
import { LevelTable } from "../../../_viz/patterns/LevelTable";
import { type Range, RangeCover } from "../../../_viz/patterns/RangeCover";
import { sparseTableRangeMin } from "./sparseTableRangeMin-guide.ref.ts";

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
const A = [5, 2, 7, 4, 6, 3];

const minOf = (l: number, r: number): number =>
  sparseTableRangeMin(A, [[l, r]])[0] as number;

/** 층 k 의 칸 i = 구간 [i, i+2^k−1] 의 최솟값 — 정본에 물어서 채운다. */
function levels(): number[][] {
  const out: number[][] = [];
  for (let w = 1; w <= A.length; w *= 2) {
    out.push(
      Array.from({ length: A.length - w + 1 }, (_, i) => minOf(i, i + w - 1)),
    );
  }
  return out;
}

/** 질의 [l,r] 의 두 조각 — 2^k ≤ 칸 수 인 가장 큰 k. 조각 값도 정본에 묻는다. */
function pieces(l: number, r: number): Range[] {
  const len = r - l + 1;
  let k = 0;
  while (2 ** (k + 1) <= len) k++;
  const w = 2 ** k;
  const right = r - w + 1;
  return [
    {
      from: l,
      to: l + w - 1,
      tone: "left",
      note: `${k} 층의 칸 ${l}, 값 ${minOf(l, l + w - 1)}`,
    },
    {
      from: right,
      to: r,
      tone: "right",
      note: `${k} 층의 칸 ${right}, 값 ${minOf(right, r)}`,
    },
  ];
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-levels": () => (
    <LevelTable
      title="Sparse Table 세 층 — A = [5, 2, 7, 4, 6, 3]"
      levels={levels()}
      indexLabel="인덱스"
    />
  ),
  "concept-cover": () => (
    <RangeCover
      title="구간 [0,5] 를 4 칸짜리 조각 둘로 덮기"
      row={{ label: "A 의 값", values: A }}
      indexLabel="인덱스"
      ranges={pieces(0, 5)}
    />
  ),
};
