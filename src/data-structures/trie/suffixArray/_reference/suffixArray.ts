/**
 * `trie/suffixArray` 정본(규약2).
 *
 * 계약은 `../suffixArray.ts` 헤더 한 곳이다. 이 파일은 그 계약을 실제로 지키는 구현 **하나**
 * 이고, 계약이 허용하는 유일한 구현이 아니다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"배열 한 칸을 읽거나 쓰거나, 문자 하나를 비교할 때마다
 * 1"* 이다. `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23) — 계약 헤더에 적지 않고
 * 학습자 스텁에 요구하지 않는다.
 *
 * 구성은 **순위 배가**다. 길이 1 의 접두사로 순위를 매긴 뒤, 이미 매긴 순위 둘을 쌍으로 묶어
 * 길이를 2배씩 늘려 간다. 쌍을 정렬하는 데 비교 정렬을 쓰면 회차마다 $O(n\log n)$ 이 되어
 * 전체가 $O(n\log^2 n)$ 이 되므로, 순위가 이미 $[0, n)$ 의 정수라는 점을 써서 **세어 담기**로
 * 정렬한다. 그래야 회차당 $O(n)$ 이고 전체가 계약이 적은 $O(n\log n)$ 이 된다.
 */

// #region guide:core
export class SuffixArray {
  #s: string;
  /** `#sa[rank]` = 사전순 `rank` 번째 접미사의 시작 위치. */
  #sa: number[] = [];
  /** `#rank[start]` = `start` 에서 시작하는 접미사의 사전순 순위. `#sa` 의 역이다. */
  #rank: number[] = [];

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
  __cost = 0;

  constructor(s: string) {
    this.#s = s;
    this.#build();
  }

  length(): number {
    this.__cost += 1;
    return this.#s.length;
  }

  at(rank: number): number | null {
    if (!Number.isInteger(rank) || rank < 0 || rank >= this.#sa.length)
      return null;
    this.__cost += 1;
    return this.#sa[rank] as number;
  }

  rankOf(start: number): number | null {
    if (!Number.isInteger(start) || start < 0 || start >= this.#rank.length)
      return null;
    this.__cost += 1;
    return this.#rank[start] as number;
  }

  /**
   * 패턴으로 시작하는 접미사들의 순위 구간.
   *
   * 순서가 사전순이므로 그 접미사들은 반드시 **붙어 있다.** 그래서 구간의 양 끝만 찾으면
   * 되고, 양 끝은 각각 이분 탐색 한 번이다.
   */
  range(pattern: string): [number, number] {
    // 왼끝: 패턴보다 작은 접미사가 끝나는 자리. 오른끝: 패턴으로 시작하는 접미사가 끝나는 자리.
    return [this.#seek(pattern, 0), this.#seek(pattern, 1)];
  }

  /** `#compare` 값이 `after` 이상이 되는 첫 순위. `after` 가 0 이면 왼끝, 1 이면 오른끝이다. */
  #seek(pattern: string, after: number): number {
    let lo = 0;
    let hi = this.#sa.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.#compare(this.#sa[mid] as number, pattern) < after) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  /**
   * 접미사의 앞부분을 패턴과 견준다. 패턴으로 시작하면 0 이다.
   *
   * 문자열 전체가 아니라 **패턴 길이만큼만** 본다. 그래서 비교 한 번이 $O(m)$ 이고,
   * 이분 탐색이 $\log n$ 번 비교하므로 질의가 $O(m \log n)$ 이 된다.
   */
  #compare(start: number, pattern: string): number {
    const s = this.#s;
    for (let j = 0; j < pattern.length; j++) {
      this.__cost += 1;
      if (start + j >= s.length) return -1;
      const a = s.charCodeAt(start + j);
      const b = pattern.charCodeAt(j);
      if (a !== b) return a < b ? -1 : 1;
    }
    return 0;
  }

  /**
   * 두 번 이상 나타나는 가장 긴 부분 문자열.
   *
   * 계약이 이 값을 구성과 묶어 적었으므로(§주석 「한 번 정해지고 마는 값」) 구성 때 미리
   * 계산해 두어도 되고 여기서 계산해도 된다. 정본은 여기서 계산한다 — 미리 계산해 두면
   * 이 값을 한 번도 안 쓰는 사용처가 그 비용을 내게 된다.
   */
  longestRepeatedSubstring(): string {
    const lcp = this.#neighborLcp();
    let best = 0;
    let at = 0;
    for (let k = 1; k < lcp.length; k++) {
      this.__cost += 1;
      if ((lcp[k] as number) > best) {
        best = lcp[k] as number;
        at = this.#sa[k] as number;
      }
    }
    this.__cost += best;
    return this.#s.slice(at, at + best);
  }

  /**
   * 순위 배가로 접미사 순서를 짓는다.
   *
   * 회차 하나가 하는 일은 *"길이 k 까지의 순위를 알 때 길이 2k 까지의 순위를 구하는 것"* 이고,
   * 그 재료는 접미사 i 의 앞 k 글자 순위와 접미사 i+k 의 앞 k 글자 순위 **둘뿐**이다.
   * 이미 매긴 순위를 다시 쓰기 때문에 문자열을 다시 읽지 않는다.
   */
  #build(): void {
    const n = this.#s.length;
    if (n === 0) return;

    let sa = this.#rankByFirstChar();
    let rank = this.#classify(sa, (i) => this.#s.charCodeAt(i));

    // 회차는 최대 $\lceil \log_2 n \rceil$ 이다 — 회차마다 구별하는 접두사 길이가 2배가 되고
    // 그 길이가 n 에 닿으면 접미사는 길이가 서로 달라 전부 갈린다.
    for (let k = 1; k < n; k *= 2) {
      if ((rank[sa[n - 1] as number] as number) === n - 1) break;

      // 둘째 열 기준으로 미리 늘어놓는다. 뒤 조각이 없는 접미사(i + k >= n)가 가장 작다.
      const bySecond: number[] = [];
      for (let i = n - k; i < n; i++) bySecond.push(i);
      for (const start of sa) {
        this.__cost += 1;
        if (start >= k) bySecond.push(start - k);
      }

      // 첫째 열 기준으로 **안정하게** 세어 담는다. 그래야 둘째 열 순서가 살아남는다.
      sa = this.#stableCountingSort(bySecond, (i) => rank[i] as number, n);
      rank = this.#classify(sa, (i) =>
        i + k < n
          ? (rank[i] as number) * (n + 1) + (rank[i + k] as number) + 1
          : (rank[i] as number) * (n + 1),
      );
    }

    this.#sa = sa;
    this.#rank = rank;
  }

  /**
   * 키가 정수 구간일 때의 안정 정렬. 비교를 하나도 하지 않으므로 회차당 $O(n + \text{키 수})$ 다.
   * 여기가 $O(n\log^2 n)$ 과 $O(n\log n)$ 을 가르는 자리다.
   */
  #stableCountingSort(
    items: readonly number[],
    keyOf: (item: number) => number,
    keys: number,
  ): number[] {
    const count = new Array<number>(keys).fill(0);
    for (const item of items) {
      this.__cost += 1;
      count[keyOf(item)] = (count[keyOf(item)] as number) + 1;
    }
    let sum = 0;
    for (let key = 0; key < keys; key++) {
      this.__cost += 1;
      const here = count[key] as number;
      count[key] = sum;
      sum += here;
    }
    const out = new Array<number>(items.length);
    for (const item of items) {
      this.__cost += 1;
      const key = keyOf(item);
      out[count[key] as number] = item;
      count[key] = (count[key] as number) + 1;
    }
    return out;
  }

  /**
   * 첫 문자로 매긴 초기 순서.
   *
   * 코드 단위를 키로 그대로 세어 담지 않는다 — 키 공간이 $2^{16}$ 이라 짧은 문자열에서는
   * 그 상수가 $n\log n$ 을 덮어 버린다. 실제로 쓰인 코드 단위만 모아 좁힌 뒤 담는다.
   */
  #rankByFirstChar(): number[] {
    const n = this.#s.length;
    const seen = new Set<number>();
    for (let i = 0; i < n; i++) {
      this.__cost += 1;
      seen.add(this.#s.charCodeAt(i));
    }
    const codes = [...seen].sort((a, b) => a - b);
    this.__cost += codes.length;
    const narrow = new Map<number, number>();
    codes.forEach((code, index) => {
      narrow.set(code, index);
    });

    const items: number[] = [];
    for (let i = 0; i < n; i++) items.push(i);
    return this.#stableCountingSort(
      items,
      (i) => narrow.get(this.#s.charCodeAt(i)) as number,
      codes.length,
    );
  }

  /** 늘어놓은 순서에서 이웃끼리 키를 견주어 순위를 매긴다. 키가 같으면 순위도 같다. */
  #classify(sa: readonly number[], keyOf: (i: number) => number): number[] {
    const rank = new Array<number>(this.#s.length).fill(0);
    let next = 0;
    let previous: number | null = null;
    for (const start of sa) {
      this.__cost += 1;
      const key = keyOf(start);
      if (previous !== null && key !== previous) next += 1;
      rank[start] = next;
      previous = key;
    }
    return rank;
  }

  /**
   * 순서에서 이웃한 두 접미사의 최장 공통 접두사 길이(Kasai).
   *
   * 시작 위치를 하나씩 옮겨 갈 때 공통 접두사가 한 칸보다 더 줄지 않는다는 성질을 써서,
   * 전체를 $O(n)$ 에 끝낸다.
   */
  #neighborLcp(): number[] {
    const s = this.#s;
    const n = s.length;
    const lcp = new Array<number>(n).fill(0);
    let h = 0;
    for (let i = 0; i < n; i++) {
      this.__cost += 1;
      const r = this.#rank[i] as number;
      if (r === 0) {
        h = 0;
        continue;
      }
      const j = this.#sa[r - 1] as number;
      while (
        i + h < n &&
        j + h < n &&
        s.charCodeAt(i + h) === s.charCodeAt(j + h)
      ) {
        this.__cost += 1;
        h += 1;
      }
      lcp[r] = h;
      if (h > 0) h -= 1;
    }
    return lcp;
  }
}
// #endregion
