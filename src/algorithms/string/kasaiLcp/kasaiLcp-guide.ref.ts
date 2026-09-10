/**
 * `deep.walk.final`(전체 코드)의 정본 — L9.
 *
 * 원본 `kasaiLcp.ts` 는 학습자 스텁이라 `Not implemented` 를 던진다. 가이드가 싣는 코드와
 * 사이드카(`.proof.ts` · `.test.ts`)가 함께 부르는 구현은 이 파일 하나다.
 *
 * 원문자 라벨 ①~⑥ 은 본문 전개가 그대로 인용한다(P4).
 *
 * **`sa` 가 `s` 의 올바른 접미사 배열이라는 것은 문제가 보장한다.** 이 함수는 그 전제를
 * 검사하지 않는다 — `sa` 에 중복이나 범위 밖 값이 있으면 `inv` 에 빈 칸이 생긴다.
 */

export function kasaiLcp(s: string, sa: number[]): number[] {
  const n = s.length;
  const lcp = new Array<number>(n).fill(0);

  // ① 역배열 — 자리 `i` 에서 시작하는 접미사가 `sa` 의 몇 번째 칸에 있는지 적어 둔다.
  const inv = new Array<number>(n).fill(0);
  for (let r = 0; r < n; r++) inv[sa[r] as number] = r;

  let k = 0;
  for (let i = 0; i < n; i++) {
    // ② 이웃이 없는 자리 — `sa` 의 마지막 칸이라 견줄 접미사가 없다. 값을 적지 않는다.
    if (inv[i] === n - 1) {
      k = 0;
      continue;
    }

    // ③ 이웃이 시작하는 자리. 역배열이 있어 배열 읽기 한 번으로 얻는다.
    const j = sa[(inv[i] as number) + 1] as number;

    // ④ 이어받은 `k` 에서 시작해 글자가 같은 동안 하나씩 늘린다. 둘 중 하나가 문자열 끝을
    // 넘으면 거기서 멈춘다.
    while (i + k < n && j + k < n && s[i + k] === s[j + k]) k++;

    // ⑤ 이 자리의 답은 `sa` 안에서의 순위 칸에 적는다.
    lcp[inv[i] as number] = k;

    // ⑥ 다음 자리에는 하나만 줄여서 넘긴다.
    if (k > 0) k--;
  }

  return lcp;
}
