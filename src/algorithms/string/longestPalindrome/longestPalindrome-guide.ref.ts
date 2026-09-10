/**
 * `deep.walk.final`(전체 코드)의 정본 — L9.
 *
 * 원본 `longestPalindrome.ts` 는 학습자 스텁이라 `Not implemented` 를 던진다. 가이드가 싣는
 * 코드와 사이드카(`.proof.ts` · `.test.ts` · `.alt.ts`)가 함께 부르는 구현은 이 파일 하나다.
 *
 * 원문자 라벨 ①~⑥ 은 본문 전개가 그대로 인용한다(P4).
 *
 * **답이 여럿이면 어느 것을 돌려주는지가 정해져 있다.** 반지름이 같은 자리가 여러 곳이면
 * `>` 로 견주므로 **가장 왼쪽 자리**가 남는다. 문제는 아무 것이나 허용하지만, 값을 내미는
 * 블록이 실행마다 같아야 해서 이 함수는 그 하나로 고정한다.
 */

export function longestPalindrome(s: string): string {
  if (s.length === 0) return "";

  // ① 자리 넓히기 — 글자 사이와 양 끝에 구분자를 끼워 길이 `2n + 1` 로 만든다.
  const t = `#${[...s].join("#")}#`;
  const m = t.length;

  const p = new Array<number>(m).fill(0);
  let c = 0;
  let r = 0;
  let best = 0;

  for (let i = 0; i < m; i++) {
    // ② 확인해 둔 구간의 안쪽이면 대칭 자리의 반지름을 물려받되, 오른쪽 끝까지로 자른다.
    let k = i < r ? Math.min(r - i, p[2 * c - i] as number) : 0;

    // ③ 물려받은 값 바깥에서부터 한 칸씩 늘린다. 양 끝을 넘으면 거기서 멈춘다.
    while (i - k - 1 >= 0 && i + k + 1 < m && t[i - k - 1] === t[i + k + 1]) {
      k++;
    }
    p[i] = k;

    // ④ 이 자리의 구간이 더 오른쪽까지 가면 기준 자리와 오른쪽 끝을 바꾼다.
    if (i + k > r) {
      c = i;
      r = i + k;
    }

    // ⑤ 반지름이 가장 큰 자리를 기억한다.
    if (k > (p[best] as number)) best = i;
  }

  // ⑥ 넓힌 자리를 원래 자리로 되돌린다. 왼쪽 끝 `best − p[best]` 는 언제나 짝수다.
  const start = (best - (p[best] as number)) / 2;
  return s.slice(start, start + (p[best] as number));
}
