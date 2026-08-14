/**
 * 결함 fixture — 간선 목록만 들고 질의마다 숲을 훑는 숲.
 *
 * `tree/linkCutTree` 계약이 「자명한 구현으로 상한이 달성되지 않는다」의 반례로 든 둘 중
 * 첫째다. 언어가 내주는 것(배열·객체)만으로 지을 수 있고, **답은 전부 옳다** — 축1과
 * 축2를 통과한다. 갈리는 것은 비용뿐이다.
 *
 * 갱신은 상수다. `cut` 은 간선 하나를 지우는 일이고 그것으로 끝난다. 대신 **연결 판정이
 * 마디 수에 비례하고**, `link` 도 사이클을 막으려면 같은 판정을 해야 하므로 함께 끌려간다.
 * 이 fixture 가 걸리는 자리는 `connected`·`link` 이고 `cut` 은 통과한다.
 *
 * 계약의 필요충분조건이 「갱신을 상수로 두고 질의를 선형으로 두는 것도, 반대로 두는 것도
 * 이 계약을 못 지킨다」라고 적은 것의 앞쪽 반이다. 뒤쪽 반은 `relabelingForest` 다.
 */

export class ScanningForest {
  readonly #n: number;
  /** `adjacent[u]` 는 `u` 에 붙은 마디들. 간선 하나가 양쪽에 한 번씩 들어간다. */
  readonly #adjacent: number[][];

  __cost = 0;

  constructor(n: number) {
    this.#n = n;
    this.#adjacent = Array.from({ length: n }, () => [] as number[]);
  }

  link(u: number, v: number): boolean {
    this.#bounds(u);
    this.#bounds(v);
    if (this.#reaches(u, v)) return false;
    (this.#adjacent[u] as number[]).push(v);
    (this.#adjacent[v] as number[]).push(u);
    return true;
  }

  cut(u: number, v: number): boolean {
    this.#bounds(u);
    this.#bounds(v);
    if (u === v) return false;
    const near = this.#adjacent[u] as number[];
    const at = near.indexOf(v);
    this.__cost += 1;
    if (at < 0) return false;
    near.splice(at, 1);
    const back = this.#adjacent[v] as number[];
    back.splice(back.indexOf(u), 1);
    return true;
  }

  connected(u: number, v: number): boolean {
    this.#bounds(u);
    this.#bounds(v);
    if (u === v) return true;
    return this.#reaches(u, v);
  }

  #bounds(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.#n) {
      throw new RangeError(
        `마디 번호는 [0, ${this.#n}) 안이어야 한다 — 받은 값은 ${index} 다`,
      );
    }
  }

  /** `from` 에서 간선을 밟아 `to` 에 닿는가. 밟은 마디마다 1 을 센다. */
  #reaches(from: number, to: number): boolean {
    if (from === to) return true;
    const seen = new Set<number>([from]);
    const pending: number[] = [from];
    while (pending.length > 0) {
      const at = pending.pop() as number;
      this.__cost += 1;
      if (at === to) return true;
      for (const next of this.#adjacent[at] as number[]) {
        if (!seen.has(next)) {
          seen.add(next);
          pending.push(next);
        }
      }
    }
    return false;
  }
}
