/**
 * `purpose.alt`(경쟁 설계와의 대조)의 수치를 실측하는 하네스 — L13.
 *
 * ```bash
 * bun run ../../../../tools/bench-alt.ts bestTimeToBuyAndSellStockK-guide.alt.ts
 * bun run ../../../../tools/bench-alt.ts --check bestTimeToBuyAndSellStockK-guide.alt.ts
 * ```
 *
 * ## 입력을 왜 전개 입력으로 안 쓰는가
 *
 * 전개 입력은 날 여섯에 `k = 2` 라 두 설계가 갈리는 자리(`k` 의 크기)를 못 담는다. 벌금
 * 쪽은 벌금 후보를 이분 탐색하므로 `k` 와 무관하게 같은 일을 하고, 표 쪽은 `k` 에 그대로
 * 비례한다 — 갈리는 것은 `k` 이므로 **제약 상한인 날 1,000 을 고정하고 `k` 만 바꾼다.**
 * 가격은 생성식 `P[j] = (j × 617) mod 1,001` 로 만든다.
 *
 * ## 무엇을 세는가
 *
 * 덧셈·뺄셈 한 번과 비교 한 번을 각각 기본 연산 하나로 센다 — `perf` 절과 같은 정의다.
 * 저장 칸은 두 설계가 각각 들고 있는 수의 개수다.
 */

import { bestTimeToBuyAndSellStockK } from "./bestTimeToBuyAndSellStockK-guide.ref.ts";

/** 제약 상한인 날짜 수. */
const N = 1_000;

/** 제약이 정한 가격의 최댓값. 벌금 이분 탐색의 위쪽 끝이기도 하다. */
const MAX_PRICE = 10_000;

/** 결정론적 생성식. `0 ≤ P[j] ≤ 10,000` 을 지킨다. */
const PRICES: number[] = Array.from({ length: N }, (_, j) => (j * 617) % 1_001);

/** 본문 표가 싣는 거래 상한 넷. 셋째와 넷째 사이에서 순서가 뒤집힌다. */
const BUDGETS = [1, 17, 18, 100] as const;

interface Counted {
  answer: number;
  ops: number;
  cells: number;
}

/** 이 가이드가 가르치는 절차 — 거래 번호를 상태의 축으로 두고 날마다 한 줄씩 채운다. */
function byTable(k: number, prices: number[]): Counted {
  const hold = new Array<number>(k + 1).fill(Number.NEGATIVE_INFINITY);
  const free = new Array<number>(k + 1).fill(0);
  let ops = 0;
  for (const price of prices) {
    for (let t = 1; t <= k; t++) {
      ops += 2; // 뺄셈 하나와 비교 하나
      hold[t] = Math.max(hold[t] as number, (free[t - 1] as number) - price);
      ops += 2; // 덧셈 하나와 비교 하나
      free[t] = Math.max(free[t] as number, (hold[t] as number) + price);
    }
  }
  return { answer: free[k] as number, ops, cells: 2 * (k + 1) };
}

/**
 * 거래 하나마다 벌금 `lam` 을 물리고 횟수 제한 없이 한 바퀴 실행한다. 이익이 같으면 거래
 * 수가 적은 쪽을 남겨, 「이 벌금에서 최적이 되는 가장 적은 거래 수」를 함께 낸다.
 */
function withPenalty(
  prices: number[],
  lam: number,
): { profit: number; count: number; ops: number } {
  let holdValue = Number.NEGATIVE_INFINITY;
  let holdCount = 0;
  let freeValue = 0;
  let freeCount = 0;
  let ops = 0;
  for (const price of prices) {
    ops += 1; // 뺄셈
    const buy = freeValue - price;
    ops += 1; // 비교
    if (buy > holdValue || (buy === holdValue && freeCount < holdCount)) {
      holdValue = buy;
      holdCount = freeCount;
    }
    ops += 2; // 덧셈 하나와 벌금 뺄셈 하나
    const sell = holdValue + price - lam;
    ops += 1; // 비교
    if (sell > freeValue || (sell === freeValue && holdCount + 1 < freeCount)) {
      freeValue = sell;
      freeCount = holdCount + 1;
    }
  }
  return { profit: freeValue, count: freeCount, ops };
}

/**
 * 경쟁 설계 — **거래 하나마다 벌금을 매기고 그 벌금을 이분 탐색한다**(라그랑주 완화).
 *
 * 거래 상한이 `k` 일 때의 최대 이익은 상한을 올릴수록 늘어나되 늘어나는 폭이 줄어든다.
 * 그래서 「벌금 `lam` 에서 최적이 되는 거래 수」가 `lam` 에 대해 단조이고, 거래 수가 `k`
 * 이하가 되는 가장 작은 정수 벌금을 찾은 뒤 `이익 + lam × k` 를 내면 답이 나온다.
 */
function byPenaltySearch(k: number, prices: number[]): Counted {
  let lo = 0;
  let hi = MAX_PRICE;
  let ops = 0;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const round = withPenalty(prices, mid);
    ops += round.ops + 1; // 거래 수와 k 의 비교
    if (round.count <= k) hi = mid;
    else lo = mid + 1;
  }
  const last = withPenalty(prices, lo);
  ops += last.ops + 1; // 이익에 lam × k 를 더하는 덧셈
  return { answer: last.profit + lo * k, ops, cells: 4 };
}

/** 두 설계가 같은 답을 내는지 먼저 확인한다. 안 같으면 대조가 아니라 다른 문제를 잰 것이다. */
function measure(k: number): { table: Counted; penalty: Counted } {
  const table = byTable(k, PRICES);
  const penalty = byPenaltySearch(k, PRICES);
  const want = bestTimeToBuyAndSellStockK(k, [...PRICES]);
  if (table.answer !== want || penalty.answer !== want) {
    throw new Error(
      `두 설계의 답이 갈린다 — 표 ${table.answer} · 벌금 ${penalty.answer} · 정본 ${want}`,
    );
  }
  return { table, penalty };
}

export const cases = {
  "거래 번호 축을 갖는 표": () => {
    const out: Record<string, number> = {};
    for (const k of BUDGETS) out[`k=${k} 기본 연산`] = measure(k).table.ops;
    out["k=1 저장 칸"] = byTable(1, PRICES).cells;
    out["k=100 저장 칸"] = byTable(100, PRICES).cells;
    return out;
  },
  "거래마다 벌금을 매기고 벌금을 이분 탐색": () => {
    const out: Record<string, number> = {};
    for (const k of BUDGETS) out[`k=${k} 기본 연산`] = measure(k).penalty.ops;
    out["k=1 저장 칸"] = byPenaltySearch(1, PRICES).cells;
    out["k=100 저장 칸"] = byPenaltySearch(100, PRICES).cells;
    return out;
  },
};
