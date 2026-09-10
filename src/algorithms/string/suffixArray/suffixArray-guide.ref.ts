/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/string/suffixArray/suffixArray.ts` 는 학습자 스텁이라 가이드가 그대로
 * 인용할 수 없다. 가이드 본문의 코드는 이 파일에서 옮기고, 증명 사이드카(`*.proof.ts`)와
 * 재실행 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 다섯 줄을
 * 각각 하나씩 바꾼다 — 범위 밖 표시값 · 두 계수 정렬의 순서 · 안정 정렬의 방향 · 순위
 * 재부여의 판정 · 새 순위를 담는 배열. 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가
 * 던지므로, 그 식들을 주석에 다시 적지 않는다.
 */

/**
 * 값이 `[0, span)` 안의 정수인 키로 `order` 를 **안정** 정렬한다.
 *
 * 안정이라는 것은 키가 같은 두 자리의 앞뒤가 들어올 때의 앞뒤와 같다는 뜻이다. 이 성질이
 * 없으면 뒤 조각으로 매겨 둔 순서가 앞 조각 정렬에서 지워진다.
 */
function countingSortBy(
  order: number[],
  key: (i: number) => number,
  span: number,
): number[] {
  const count = new Array<number>(span).fill(0);
  for (const i of order) count[key(i)] = (count[key(i)] as number) + 1;
  for (let v = 1; v < span; v++) {
    count[v] = (count[v] as number) + (count[v - 1] as number);
  }
  const out = new Array<number>(order.length).fill(0);
  for (let p = order.length - 1; p >= 0; p--) {
    const i = order[p] as number;
    const k = key(i);
    count[k] = (count[k] as number) - 1;
    out[count[k] as number] = i;
  }
  return out;
}

/**
 * 문자열 `s` 의 모든 접미사를 사전순으로 정렬했을 때, 각 접미사의 시작 자리를 순서대로 담은
 * 배열을 돌려준다.
 *
 * 길이 `gap` 조각의 순위를 알고 있으면 길이 `2·gap` 조각의 순서는 그 순위 두 개를 이어 붙인
 * 쌍을 견주는 것으로 정해진다. 그 쌍을 계수 정렬 두 번으로 세우기를 되풀이한다.
 */
export function suffixArray(s: string): number[] {
  const n = s.length;
  let sa = Array.from({ length: n }, (_, i) => i);
  // ① 길이 1 조각의 순위는 글자 코드를 그대로 쓴다. 대소 관계가 사전순과 같으면 충분하다.
  let rank = Array.from({ length: n }, (_, i) => s.charCodeAt(i));
  let span = 128;

  for (let gap = 1; gap < n; gap *= 2) {
    const front = (i: number): number => rank[i] as number;
    // ② 뒤 조각의 순위. 문자열 끝을 넘으면 0 을 두어 같은 앞 조각 안에서 맨 앞에 오게 한다.
    const back = (i: number): number =>
      i + gap < n ? (rank[i + gap] as number) + 1 : 0;

    // ③ 뒤 조각으로 먼저 안정 정렬하고, 그 결과를 앞 조각으로 다시 안정 정렬한다.
    for (const key of [back, front]) sa = countingSortBy(sa, key, span + 1);

    const next = new Array<number>(n).fill(0);
    let top = 0;
    for (let j = 1; j < n; j++) {
      const a = sa[j - 1] as number;
      const b = sa[j] as number;
      // ④ 이웃한 두 자리의 쌍이 다를 때만 순위를 하나 올린다. 같으면 아직 못 가른 것이다.
      if (front(a) !== front(b) || back(a) !== back(b)) top++;
      next[b] = top;
    }
    rank = next;
    span = top + 1;

    // ⑤ 순위가 전부 달라졌으면 조각을 더 늘려도 순서가 안 바뀐다.
    if (span === n) break;
  }
  return sa;
}
