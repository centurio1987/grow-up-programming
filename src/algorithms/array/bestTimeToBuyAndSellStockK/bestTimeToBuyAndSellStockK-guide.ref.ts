/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/array/bestTimeToBuyAndSellStockK/bestTimeToBuyAndSellStockK.ts` 는
 * 학습자가 채우는 자리라 가이드가 그대로 인용할 수 없다. 가이드 본문의 코드는 이 파일에서
 * 옮기고, 증명 사이드카(`*.proof.ts`)와 재실행 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 두 줄을
 * 각각 하나씩 바꾼다 — 보유 상태 배열의 시작값 줄과, 매수 갱신이 읽는 자리 줄이다. 맞는
 * 줄이 정확히 하나가 아니면 던지므로, 그 두 식을 주석에 다시 적지 않는다.
 */

/**
 * 날짜 순서로 놓인 가격 배열 `prices` 에서 **최대 `k` 번의 매수·매도**로 얻을 수 있는 최대
 * 이익을 돌려준다.
 *
 * 한 거래는 매수 하루와 매도 하루의 짝이고, 매도가 끝나야 다음 매수를 할 수 있다. 같은 날
 * 팔고 다시 사는 것은 허용된다. 거래를 한 번도 안 해도 되므로 답은 언제나 0 이상이다.
 *
 * `k = 0` 이거나 날짜가 하나뿐인 입력을 따로 걸러내지 않는다 — 배열 길이가 `k + 1` 이라
 * `k = 0` 이면 안쪽 반복이 한 번도 실행되지 않고 `free[0] = 0` 이 그대로 답이 되며, 날짜가
 * 하나뿐이면 그날 사서 그날 판 이익 0 만 후보에 들어온다.
 */
export function bestTimeToBuyAndSellStockK(
  k: number,
  prices: number[],
): number {
  // ① 두 상태 배열을 시작값으로 둔다. `hold[t]` 는 t 번째 매수를 마치고 아직 안 판 상태의
  //    최대 이익이고, `free[t]` 는 t 번째 매도까지 마친 상태의 최대 이익이다. 첫날 전에는
  //    매수를 마친 상태에 도달할 방법이 없고, 거래를 한 번도 안 한 이익은 0 이다.
  const hold = new Array<number>(k + 1).fill(Number.NEGATIVE_INFINITY);
  const free = new Array<number>(k + 1).fill(0);

  for (const price of prices) {
    // ② 아직 안 읽은 날이 남았는가 — 남아 있으면 그 날 하나에서 아래 두 줄을 k 번 실행한다.
    for (let t = 1; t <= k; t++) {
      // ③ 거래 번호가 k 를 넘지 않았는가 — 넘으면 오늘의 갱신을 끝내고 다음 날로 간다.
      // ④ t 번째 매수를 오늘 하는 쪽과 어제까지 이미 해 둔 쪽 중 큰 값을 남긴다. 오늘 사려면
      //    직전 거래까지 끝나 있어야 하므로 거래 번호가 하나 작은 매도 상태에서 출발한다.
      hold[t] = Math.max(hold[t] as number, (free[t - 1] as number) - price);
      // ⑤ t 번째 매도를 오늘 하는 쪽과 어제까지 이미 해 둔 쪽 중 큰 값을 남긴다.
      free[t] = Math.max(free[t] as number, (hold[t] as number) + price);
    }
  }

  return free[k] as number;
}
