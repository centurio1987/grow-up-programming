/**
 * `deep.walk.final`(전체 코드)의 정본 — L9.
 *
 * 원본 `suffixAutomaton.ts` 는 학습자 스텁이라 `Not implemented` 를 던진다. 가이드가 싣는
 * 코드와 사이드카(`.proof.ts` · `.test.ts` · `.alt.ts`)가 함께 부르는 구현은 이 파일 하나다.
 *
 * 원문자 라벨 ①~⑨ 는 본문 전개가 그대로 인용한다(P4).
 *
 * **재귀를 쓰지 않는다.** 제약이 글자 100,000 개까지인데, 링크를 거슬러 올라가는 반복이
 * 재귀로 적히면 호출 깊이가 그대로 문자열 길이가 될 수 있다. 반복문으로 적으면 그 제한을
 * 받지 않는다.
 *
 * 변이는 이 파일 원문에서 기계로 만든다(`tools/check-proof.ts` 의 `loadMutant`) — 다섯이
 * 각각 정확히 한 줄이라 「한 곳만 바꿨다」가 검사된다. **여기에 그 줄을 그대로 옮겨 적지
 * 않는다** — 변이 정규식이 주석 줄에도 맞아 「두 줄에 맞았다」로 실패한다.
 *
 * - ③ 의 반복 조건에서 「전이가 비어 있는가」를 빼면 이미 있는 전이를 덮어쓴다.
 * - ⑤ 의 길이 검사를 빼면 복제 상태를 한 번도 만들지 않는다.
 * - ⑥ 이 전이 표를 복사하지 않고 같은 객체를 함께 쓰면 **짧은 입력에서는 답이 안 틀린다**.
 * - ⑥ 의 복제 상태 길이를 `q` 의 길이로 두면 길이 구간이 겹친다.
 * - ⑧ 에서 링크가 이미 담은 몫을 안 빼면 같은 문자열을 여러 번 센다.
 */

export class SuffixAutomaton {
  /** 상태 `v` 가 담는 문자열 중 가장 긴 것의 길이. */
  private readonly len: number[] = [0];

  /** 상태 `v` 의 접미사 링크. 뿌리 상태 0 만 `-1` 이다. */
  private readonly link: number[] = [-1];

  /** 상태 `v` 의 전이 표 — 글자 하나를 받으면 어느 상태로 가는가. */
  private readonly next: Map<string, number>[] = [new Map()];

  constructor(s: string) {
    let last = 0;

    for (const c of s) {
      // ② 글자 하나를 받는다. 새 상태 `cur` 는 여기까지 읽은 접두사 전체를 담는다.
      const cur = this.create((this.len[last] as number) + 1, -1, new Map());
      let p = last;

      // ③ 링크를 거슬러 올라가며 `c` 전이가 **비어 있는** 상태에만 `cur` 를 적는다. 이미
      // 있는 전이는 더 짧은 접미사가 이미 쓰고 있는 것이라 덮어쓰지 않는다.
      while (p !== -1 && !(this.next[p] as Map<string, number>).has(c)) {
        (this.next[p] as Map<string, number>).set(c, cur);
        p = this.link[p] as number;
      }

      if (p === -1) {
        // ④ 뿌리까지 올라가도록 `c` 전이가 없었다 — `cur` 의 링크는 뿌리다.
        this.link[cur] = 0;
      } else {
        const q = (this.next[p] as Map<string, number>).get(c) as number;
        if ((this.len[p] as number) + 1 === (this.len[q] as number)) {
          // ⑤ `p` 뒤에 `c` 를 붙인 길이가 `q` 의 가장 긴 문자열과 같다 — `q` 를 그대로
          // 링크로 쓴다.
          this.link[cur] = q;
        } else {
          // ⑥ 길이가 어긋난다. `q` 가 담고 있던 문자열 중 **짧은 쪽만** 갖는 복제 상태를
          // 만든다. 전이 표는 복사해서 넘긴다 — 같은 객체를 함께 쓰면 뒤에 적히는 전이가
          // 양쪽에 한꺼번에 보인다.
          const cloneLen = (this.len[p] as number) + 1;
          const cloneNext = new Map(this.next[q] as Map<string, number>);
          const clone = this.create(
            cloneLen,
            this.link[q] as number,
            cloneNext,
          );

          // ⑦ `q` 를 가리키던 `c` 전이 중 길이가 모자란 것을 복제 상태로 바꾼다.
          while (
            p !== -1 &&
            (this.next[p] as Map<string, number>).get(c) === q
          ) {
            (this.next[p] as Map<string, number>).set(c, clone);
            p = this.link[p] as number;
          }

          this.link[q] = clone;
          this.link[cur] = clone;
        }
      }

      last = cur;
    }
  }

  countDistinctSubstrings(): number {
    // ⑧ 상태 `v` 가 담는 문자열은 길이 `len[link[v]] + 1` 부터 `len[v]` 까지라 그 개수가
    // 두 길이의 차다. 뿌리를 뺀 전부를 더하면 서로 다른 부분 문자열의 총수가 된다.
    let total = 0;
    for (let v = 1; v < this.len.length; v++) {
      const parent = this.link[v] as number;
      total += (this.len[v] as number) - (this.len[parent] as number);
    }
    return total;
  }

  contains(t: string): boolean {
    // ⑨ 뿌리에서 글자마다 전이를 따라간다. 전이가 한 번이라도 없으면 부분 문자열이 아니고,
    // 끝까지 갔으면 부분 문자열이다. 빈 문자열은 반복이 한 번도 실행되지 않아 `true` 다.
    let v = 0;
    for (const c of t) {
      const to = (this.next[v] as Map<string, number>).get(c);
      if (to === undefined) return false;
      v = to;
    }
    return true;
  }

  /** ① 상태 하나를 새로 만든다. 세 배열의 같은 자리가 그 상태의 전부다. */
  private create(len: number, link: number, next: Map<string, number>): number {
    this.len.push(len);
    this.link.push(link);
    this.next.push(next);
    return this.len.length - 1;
  }
}
