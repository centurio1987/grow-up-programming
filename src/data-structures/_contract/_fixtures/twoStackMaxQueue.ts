/**
 * 판정 도구 fixture — `linear/monotonicQueue` 계약을 **넣는 무더기와 빼는 무더기를 나눠 들고, 칸마다 「무더기
 * 바닥부터 그 칸까지의 최댓값」을 적어** 지키는 구현.
 *
 * **결함이 아니다.** 이 계약을 지키는 정당한 구현이고, 계약이 `dequeue` 를 `amortized` 로 적은 근거를 실물로
 * 재려고 둔다(불변 사실 196 의 「판정 도구」 쪽 — 흔한 실수가 아니다). 정본(후보를 버리는 계열)이 `enqueue`
 * 쪽 근거이고 이 구현이 `dequeue` 쪽 근거다.
 *
 * 넣기는 넣는 무더기 꼭대기에 원소와 「그때까지의 최댓값」을 함께 쌓아 상수다. 빼는데 빼는 무더기가 비었으면
 * 넣는 무더기를 통째로 뒤집어 옮기며 최댓값을 다시 적는다 — 그 호출 하나가 담긴 수에 비례한다. 옮긴 원소는
 * 되돌아가지 않으므로 원소마다 한 번만 옮겨지고 호출열의 총비용은 호출 수에 비례한다. `max` 는 두 무더기
 * 꼭대기의 적어 둔 값을 한 번 견주고, `front` 는 빼는 무더기 꼭대기이거나(비어 있지 않을 때) 넣는 무더기 바닥이다.
 *
 * 계측 단위는 §규약2 계측 단위를 따른다 — 무더기 칸 하나를 지나갈 때마다 1, 비교자 호출도 1.
 */
export class TwoStackMaxQueue {
  readonly #compare: (a: number, b: number) => number;
  /** 넣는 무더기. 끝 칸이 가장 늦게 넣은 원소다. */
  #inItems: number[] = [];
  #inMax: number[] = [];
  /** 빼는 무더기. 끝 칸이 앞 끝 원소다. */
  #outItems: number[] = [];
  #outMax: number[] = [];

  __cost = 0;

  constructor(comparator: (a: number, b: number) => number) {
    this.#compare = comparator;
  }

  enqueue(item: number): void {
    this.__cost += 2;
    this.#inItems.push(item);
    this.#inMax.push(this.#larger(item, this.#inMax));
  }

  dequeue(): number | null {
    if (this.#outItems.length === 0) {
      while (this.#inItems.length > 0) {
        this.__cost += 2;
        const item = this.#inItems.pop() as number;
        this.#inMax.pop();
        this.#outMax.push(this.#larger(item, this.#outMax));
        this.#outItems.push(item);
      }
    }
    if (this.#outItems.length === 0) return null;
    this.__cost += 1;
    this.#outMax.pop();
    return this.#outItems.pop() as number;
  }

  front(): number | null {
    this.__cost += 1;
    if (this.#outItems.length > 0) {
      return this.#outItems[this.#outItems.length - 1] as number;
    }
    return this.#inItems.length > 0 ? (this.#inItems[0] as number) : null;
  }

  max(): number | null {
    this.__cost += 2;
    const inTop = this.#inMax[this.#inMax.length - 1];
    const outTop = this.#outMax[this.#outMax.length - 1];
    if (inTop === undefined) return outTop ?? null;
    if (outTop === undefined) return inTop;
    return this.#compare(inTop, outTop) >= 0 ? inTop : outTop;
  }

  isEmpty(): boolean {
    return this.size() === 0;
  }

  size(): number {
    this.__cost += 1;
    return this.#inItems.length + this.#outItems.length;
  }

  /** 새 원소와 무더기 꼭대기의 적어 둔 최댓값 중 큰 쪽. 무더기가 비었으면 새 원소. */
  #larger(item: number, maxima: number[]): number {
    const top = maxima[maxima.length - 1];
    if (top === undefined) return item;
    return this.#compare(item, top) >= 0 ? item : top;
  }
}
