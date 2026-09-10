/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/dp/palindromePartitioningMinCut/palindromePartitioningMinCut.ts` 가
 * 요구하는 것과 **같은 계약**이다 — 문자열을 받아, 모든 조각이 회문이 되도록 자를 때
 * 필요한 최소 컷 횟수를 돌려준다. 가이드 본문의 코드는 이 파일에서 옮긴다.
 *
 * **표가 둘이라 자리 이름을 넷으로 갈라 둔다.** 본문 기호표와 글자까지 같다.
 *
 * | 이름 | 무엇 | 어느 표 |
 * | --- | --- | --- |
 * | `i` | 구간의 시작 자리 | `pal` 의 행 |
 * | `j` | 구간의 끝 자리 | `pal` 의 열 |
 * | `e` | 지금 정하는 접두사의 끝 자리 | `cut` 의 자리 |
 * | `b` | 그 접두사의 마지막 조각이 시작하는 자리 | `pal[b][e]` 로 조회한다 |
 *
 * `pal` 은 언제나 `pal[시작][끝]` 로 읽는다 — 컷 표에서 조회하는 `pal[b][e]` 도 같은 규약이다.
 */

/**
 * 문자열 `s` 를 모든 조각이 회문이 되도록 자를 때 필요한 최소 컷 횟수.
 * 컷 한 번이 조각을 하나 늘리므로 조각 수는 언제나 컷 수 + 1 이다.
 *
 * 표를 둘 쓴다. 앞의 표는 구간 `[i,j]` 가 회문인지를 **길이 오름차순**으로 한 번씩 정하고,
 * 뒤의 표는 접두사 `s[0…e]` 의 최소 컷 수를 **끝 자리 오름차순**으로 정하면서 앞의 표를
 * 조회만 한다.
 */
export function palindromePartitioningMinCut(s: string): number {
  const n = s.length;
  // ① 글자가 하나뿐이다 — 자를 자리가 없다.
  if (n <= 1) return 0;

  // pal[i][j] = s[i…j] 가 회문인가. 길이가 짧은 구간부터 정한다.
  const pal = Array.from({ length: n }, () =>
    new Array<boolean>(n).fill(false),
  );
  // ② 길이 1 구간은 글자 하나라 언제나 회문이다.
  for (let i = 0; i < n; i++) (pal[i] as boolean[])[i] = true;

  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      // 길이 2 는 안쪽이 빈 구간이라 양 끝 비교만으로 정해진다.
      const inner = len === 2 || ((pal[i + 1] as boolean[])[j - 1] as boolean);
      (pal[i] as boolean[])[j] = s[i] === s[j] && inner;
    }
  }

  // cut[e] = s[0…e] 를 회문 조각으로만 자를 때의 최소 컷 수.
  // cut[0] 은 글자 하나라 0 이고, 그 값이 채워진 채로 시작한다.
  const cut = new Array<number>(n).fill(0);

  for (let e = 1; e < n; e++) {
    // ③ 접두사 전체가 회문이다 — 자르지 않는다.
    if ((pal[0] as boolean[])[e] as boolean) continue;

    let best = Number.POSITIVE_INFINITY;
    for (let b = 1; b <= e; b++) {
      // 마지막 조각 s[b…e] 가 회문이 아니면 후보가 아니다.
      if (!((pal[b] as boolean[])[e] as boolean)) continue;
      const candidate = (cut[b - 1] as number) + 1;
      // ④ 지금까지의 최소보다 적다 · ⑤ 적지 않다
      if (candidate < best) best = candidate;
    }
    cut[e] = best;
  }

  return cut[n - 1] as number;
}
