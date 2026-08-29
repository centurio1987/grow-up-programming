/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/array/bestTimeToBuyAndSellStock/bestTimeToBuyAndSellStock.ts` 는
 * 학습자가 채우는 자리라 가이드가 그대로 인용할 수 없다. 가이드 본문의 코드는 이 파일에서
 * 옮기고, 증명 사이드카(`*.proof.ts`)와 재실행 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 두 줄을
 * 각각 하나씩 바꾼다 — 최저가를 갱신하는 줄과 최대 이익의 초기값 줄. 맞는 줄이 정확히
 * 하나가 아니면 던지므로, 그 식들을 주석에 다시 적지 않는다.
 */

/**
 * 날짜 순서로 놓인 가격 배열 `prices` 에서 **한 번의 매수·매도**로 얻을 수 있는 최대 이익을
 * 돌려준다.
 *
 * 매수일 `i` 와 매도일 `j` 는 `i ≤ j` 를 만족해야 한다. `i = j` 가 허용되고 그때의 이익이
 * 0 이므로, 어떤 입력에서도 답은 0 이상이다. 배열의 길이는 1 이상이라고 본다.
 */
export function bestTimeToBuyAndSellStock(prices: number[]): number {
  // ① 두 상태를 첫날 값으로 시작한다 — minP 는 지금까지 본 최저가이고, best 는 지금까지의
  //    최대 이익이다. 거래를 안 하는 선택이 언제나 가능하므로 best 는 0 에서 출발한다.
  let minP = prices[0] as number;
  let best = 0;

  for (let i = 1; i < prices.length; i++) {
    // ② 순회할 날이 남았는가 — 남아 있으면 아래 두 줄을 한 번 실행한다.
    const price = prices[i] as number;
    // ③ 오늘 판다면 이익은 오늘 가격에서 지금까지의 최저가를 뺀 것이다. 그 값이 지금까지의
    //    최대 이익보다 크면 답이 바뀐다.
    best = Math.max(best, price - minP);
    // ④ 최저가를 갱신한다. 오늘 값이 지금까지의 최저가보다 작으면 내일부터의 매수 후보다.
    minP = Math.min(minP, price);
  }

  return best;
}
