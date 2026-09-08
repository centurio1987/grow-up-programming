/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/dp/expectedValueDp/expectedValueDp.ts` 는 학습자 스텁이라 본문에 실을
 * 수 없다. 여기 있는 것이 가이드 본문의 전체 코드와 **글자 그대로** 같은 절차다 — 시퀀스를
 * 세지 않고 「던진 횟수마다의 합 분포」 한 행씩을 갱신하고, 마지막 행의 꼬리를 더한다.
 *
 * **배정밀도 실수로 확률을 들고 간다.** 계약이 실수 반환이고 허용 오차가 `10^-9` 이라 그
 * 범위 안이다. 표를 채우는 방식이 정확도를 어디까지 지키는지는 본문 「경쟁 설계와의 대조」가
 * 정확한 유리수 답과 견주어 값으로 내고, 확률 칸이 0 으로 내려앉는 자리는 「수식 정의와
 * 유도」가 닫힌 형태로 예측해 실측과 대조한다.
 *
 * 변이는 이 파일 원문에서 기계로 만든다(`tools/check-proof.ts` 의 `loadMutant`) — 아래 세
 * 자리가 각각 정확히 한 줄이라 「한 곳만 바꿨다」가 검사된다.
 *
 * - 새 행을 따로 잡지 않고 직전 행에 그대로 덮어쓰면 반쯤 갱신된 값을 다시 읽는다.
 * - 합이 반드시 임계값 이상인 자리를 걸러내는 줄을 지우면 답이 1 에서 조금 벗어난다.
 * - 더하는 칸 수를 하나 줄이면 한 행의 확률 합이 1 보다 작아진다.
 */

/** 주사위 한 개의 면 수. 눈 1 부터 이 값까지가 같은 확률로 나온다. */
const FACES = 6;

/**
 * 공정한 `FACES` 면 주사위를 `N` 번 던져 나온 눈의 합이 `K` 이상일 확률을 낸다.
 * 반환값은 `[0, 1]` 안의 실수다.
 */
export function expectedValueDp(N: number, K: number): number {
  const maxSum = FACES * N;

  // ① 합이 반드시 K 이상이거나 절대로 K 이상이 될 수 없는 자리는 표를 안 채우고 답한다.
  if (K <= N) return 1;
  if (K > maxSum) return 0;

  // ② 0 번 던진 분포 — 합 0 한 칸에 확률 1 이 몰려 있다.
  let prev = new Float64Array(maxSum + 1);
  prev[0] = 1;

  for (let i = 1; i <= N; i++) {
    const curr = new Float64Array(maxSum + 1);
    for (let s = 1; s <= maxSum; s++) {
      // ③ 직전 행의 여섯 칸 [s−FACES, s−1] 을 더해 FACES 로 나눈다. 0 보다 왼쪽은 확률 0 이다.
      let sum = 0;
      const from = s - FACES < 0 ? 0 : s - FACES;
      for (let u = from; u < s; u++) sum += prev[u] as number;
      curr[s] = sum / FACES;
    }
    prev = curr;
  }

  // ④ 합이 K 이상인 칸을 큰 쪽부터 더한다. 작은 값이 먼저 들어가 반올림이 덜 누적된다.
  let answer = 0;
  for (let s = maxSum; s >= K; s--) answer += prev[s] as number;
  return answer;
}
