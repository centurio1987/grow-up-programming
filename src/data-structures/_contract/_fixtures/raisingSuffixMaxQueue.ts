/**
 * 결함 fixture — `linear/monotonicQueue` 계약을 **칸마다 「그 칸부터 뒤 끝까지의 최댓값」을 적어 두고, 넣을 때
 * 앞선 칸의 적어 둔 값을 새 원소로 올려 적는** 구현.
 *
 * 앞 끝에서 빼는 큐에서는 앞쪽 최댓값이 빼기에 낡으므로 뒤쪽 최댓값을 적는 것이 자연스러운 선택이다. 빼기와
 * `max`(맨 앞 칸의 적어 둔 값)는 상수가 되고 값도 옳다. 그런데 새 원소가 들어오면 적어 둔 값이 새 원소보다
 * 작은 칸을 뒤에서부터 전부 고쳐야 한다. **버리지 않고 값만 올려 적으므로** 같은 칸이 다음 넣기에서 또
 * 고쳐진다 — 앞선 것보다 큰 값이 이어 들어오면 넣기마다 담긴 칸 전부를 고쳐 상각으로도 담긴 수에 비례한다.
 * `enqueue` 행을 어긴다. 정본과 갈리는 자리가 「버리는가 올려 적는가」 하나다.
 *
 * 계측 단위는 §규약2 계측 단위를 따른다 — 칸 하나를 지나갈 때마다 1, 비교자 호출도 1.
 */
export class RaisingSuffixMaxQueue {
  readonly #compare: (a: number, b: number) => number;
  #items: number[] = [];
  /** `#suffixMax[i]` = `#items[i..]` 중 가장 큰 원소. 앞에서 뒤로 가며 늘지 않는다. */
  #suffixMax: number[] = [];
  #head = 0;

  __cost = 0;

  constructor(comparator: (a: number, b: number) => number) {
    this.#compare = comparator;
  }

  enqueue(item: number): void {
    // 적어 둔 값이 새 원소보다 작은 칸은 뒤쪽에 몰려 있다. 뒤에서부터 올려 적는다.
    for (let at = this.#items.length - 1; at >= this.#head; at--) {
      this.__cost += 2;
      if (this.#compare(this.#suffixMax[at] as number, item) >= 0) break;
      this.#suffixMax[at] = item;
    }
    this.__cost += 1;
    this.#items.push(item);
    this.#suffixMax.push(item);
  }

  dequeue(): number | null {
    if (this.#head >= this.#items.length) return null;
    this.__cost += 1;
    const item = this.#items[this.#head] as number;
    this.#head += 1;
    return item;
  }

  front(): number | null {
    this.__cost += 1;
    return this.#head >= this.#items.length
      ? null
      : (this.#items[this.#head] as number);
  }

  max(): number | null {
    this.__cost += 1;
    return this.#head >= this.#items.length
      ? null
      : (this.#suffixMax[this.#head] as number);
  }

  isEmpty(): boolean {
    return this.size() === 0;
  }

  size(): number {
    this.__cost += 1;
    return this.#items.length - this.#head;
  }
}
