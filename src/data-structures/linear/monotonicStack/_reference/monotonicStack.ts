/**
 * `linear/monotonicStack` 정본(규약2).
 *
 * 계약은 `../monotonicStack.ts` 헤더 한 곳이다. 이 파일은 그 계약을 실제로 지키는 구현 **하나**이고,
 * 계약이 허용하는 유일한 구현이 아니다. 원소마다 「바닥부터 그 원소까지의 최댓값」을 짝으로 적는 배열도
 * 이 계약을 지킨다 — 헤더가 검증 등급 근거로 든 것이 그쪽이다.
 *
 * **담긴 원소를 쌓는 배열 곁에 최댓값 후보 무더기를 하나 더 든다.** 새 원소가 지금 최댓값보다 작지
 * 않을 때만 후보 무더기에 올리므로, 후보 무더기는 바닥에서 꼭대기로 가며 줄지 않는다 — 이름의 「단조」가
 * 이 무더기다. 최댓값은 후보 무더기의 꼭대기다. 뺀 원소가 후보 꼭대기와 크기가 같으면 후보도 함께
 * 내린다.
 *
 * **크기가 같으면 후보에 올리는 이유.** 「더 클 때만」 올리면 같은 크기 둘 중 나중 것이 후보에 없어,
 * 그것을 뺄 때 크기 비교로는 후보를 내릴지 가를 수 없다(계약 스위트의 경계 케이스 「같은 크기의 원소 둘
 * 중 하나를 빼도」가 그 자리다). 크기가 같은 원소가 후보에 없는 경우는 생기지 않는다 — 어떤 원소를 넣을 때
 * 후보에 안 올렸다면 그때 최댓값이 그 원소보다 **엄격히** 컸고, 그 원소를 뺄 시점의 후보 꼭대기는 그때와
 * 같은 원소다(그 위에 쌓인 것은 전부 먼저 빠졌다).
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"칸 하나를 지나갈 때마다 1"* 이고 비교자 호출은 그 자체로 1 이다 —
 * **읽기와 쓰기를 따로 세지 않고**, 언어 런타임이 배열을 다시 잡는 비용도 세지 않는다(§규약2 계측 단위).
 * 넣기는 원소 칸 1 · 비교 1(후보가 있을 때) · 후보 칸 1(올릴 때), 빼기는 원소 칸 1 · 비교 1 · 후보 칸
 * 1(내릴 때), 나머지는 들고 있는 값을 읽어 1 이다. 빈 스택의 `pop` 은 지나갈 칸이 없어 0 이다.
 * `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 */

// #region guide:core
export class MonotonicStack<T> {
  readonly #compare: (a: T, b: T) => number;
  #items: T[] = [];
  /** 최댓값 후보. 바닥에서 꼭대기로 가며 비교자 기준으로 줄지 않는다. 꼭대기가 지금 최댓값이다. */
  #maxima: T[] = [];

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
  __cost = 0;

  constructor(comparator: (a: T, b: T) => number) {
    if (typeof comparator !== "function") {
      throw new TypeError(
        "비교자를 주입해야 한다 — 무엇이 가장 큰지 정할 방법이 없다",
      );
    }
    this.#compare = comparator;
  }

  push(item: T): void {
    this.__cost += 1;
    this.#items.push(item);
    const maxima = this.#maxima;
    if (maxima.length > 0) {
      this.__cost += 1;
      if (this.#compare(item, maxima[maxima.length - 1] as T) < 0) return;
    }
    this.__cost += 1;
    maxima.push(item);
  }

  pop(): T | null {
    if (this.#items.length === 0) return null;
    this.__cost += 2;
    const item = this.#items.pop() as T;
    const maxima = this.#maxima;
    // 뺀 원소가 후보 꼭대기와 크기가 같으면 그 후보가 이 원소다(파일 헤더의 논증).
    if (this.#compare(item, maxima[maxima.length - 1] as T) === 0) {
      this.__cost += 1;
      maxima.pop();
    }
    return item;
  }

  peek(): T | null {
    this.__cost += 1;
    const items = this.#items;
    return items.length === 0 ? null : (items[items.length - 1] as T);
  }

  max(): T | null {
    this.__cost += 1;
    const maxima = this.#maxima;
    return maxima.length === 0 ? null : (maxima[maxima.length - 1] as T);
  }

  isEmpty(): boolean {
    this.__cost += 1;
    return this.#items.length === 0;
  }

  size(): number {
    this.__cost += 1;
    return this.#items.length;
  }
}
// #endregion
