/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/string/findAllOccurrences/findAllOccurrences.ts` 는 학습자 스텁이라
 * 가이드가 그대로 인용할 수 없다. 가이드 본문의 코드는 이 파일에서 옮기고, 증명
 * 사이드카(`*.proof.ts`)와 재실행 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 세 줄을
 * 각각 하나씩 바꾼다 — 매칭의 후퇴 줄 · 매칭 성공 뒤의 후퇴 줄 · 실패 함수의 후퇴 줄.
 * 맞는 줄이 정확히 하나가 아니면 던지므로, 그 식들을 주석에 다시 적지 않는다.
 */

/**
 * 텍스트 `text` 안에서 패턴 `pattern` 이 등장하는 **모든 시작 자리**를 오름차순으로 돌려준다.
 * 겹쳐서 등장하는 자리도 전부 담는다.
 *
 * 빈 패턴과 텍스트보다 긴 패턴은 빈 배열을 돌려준다(문제의 규약).
 */
export function findAllOccurrences(text: string, pattern: string): number[] {
  const n = text.length;
  const m = pattern.length;
  const found: number[] = [];
  // ① 답이 있을 수 없는 두 경우를 먼저 걸러 낸다 — 빈 패턴이거나 패턴이 텍스트보다 길다.
  if (m === 0 || n < m) return found;

  // fail[i] 는 pattern[0..i] 의 진 접두사이면서 진 접미사인 것 중 가장 긴 것의 길이다.
  const fail = new Array<number>(m).fill(0);
  let k = 0;
  for (let i = 1; i < m; i++) {
    // ② 글자가 다르면 이어 둔 길이를 fail 이 가리키는 값으로 줄인다.
    while (k > 0 && pattern[i] !== pattern[k]) k = fail[k - 1] as number;
    // ③ 글자가 같으면 이어 둔 길이를 하나 늘린다.
    if (pattern[i] === pattern[k]) k++;
    fail[i] = k;
  }

  let j = 0;
  for (let i = 0; i < n; i++) {
    // ④ 글자가 다르면 맞은 길이를 fail 이 가리키는 값으로 줄인다. i 는 그대로 둔다.
    while (j > 0 && text[i] !== pattern[j]) j = fail[j - 1] as number;
    // ⑤ 글자가 같으면 맞은 길이를 하나 늘린다.
    if (text[i] === pattern[j]) j++;
    if (j === m) {
      // ⑥ 패턴 전체가 맞았다. 시작 자리를 적고, 겹치는 등장을 놓치지 않도록 맞은 길이를
      //    통째로 버리지 않고 fail 이 가리키는 값으로 줄인다.
      found.push(i - m + 1);
      j = fail[j - 1] as number;
    }
  }
  return found;
}
