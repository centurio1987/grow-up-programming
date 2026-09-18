/**
 * `linear/monotonicQueue` 정본(규약2).
 *
 * 계약은 `../monotonicQueue.ts` 헤더 한 곳이다. 이 파일은 그 계약을 실제로 지키는 구현 **하나**이고,
 * 계약이 허용하는 유일한 구현이 아니다. 넣는 무더기와 빼는 무더기를 나눠 들고 칸마다 최댓값을 적는 구현도
 * 이 계약을 지킨다(`src/data-structures/_contract/_fixtures/twoStackMaxQueue.ts` — 판정 도구로 둔 실물).
 *
 * **담긴 원소를 도착 순서대로 두는 줄 곁에 최댓값 후보 줄을 하나 더 든다.** 후보 줄에는 원소의 자리
 * 번호를 적는다. 새 원소가 들어오면 후보 줄 뒤쪽에서 새 원소보다 **엄격히** 작은 후보를 버리고 새 원소를
 * 붙이므로, 후보 줄은 앞에서 뒤로 가며 비교자 기준으로 늘지 않는다 — 이름의 「단조」가 이 줄이다. 최댓값은
 * 후보 줄의 맨 앞이다. 앞 끝 원소가 나갈 때 그 자리 번호가 후보 줄 맨 앞과 같으면 후보도 함께 내보낸다.
 *
 * **버린 원소는 다시 후보가 되지 않는다.** 버린 원소 뒤에 그보다 큰 원소가 있고, 그 큰 원소가 버린 원소보다
 * 늦게 나가므로 버린 원소가 담겨 있는 동안에는 최댓값이 될 수 없다. 그래서 원소마다 후보 줄에 한 번 들어가고
 * 한 번 나가며, 넣기 한 호출이 여럿을 버려도 호출열 전체의 버리기 총수가 넣은 수를 넘지 않는다 — 계약이
 * `enqueue` 를 `amortized` 로 적은 자리가 여기다.
 *
 * **후보에 원소가 아니라 자리 번호를 적는 이유.** 나가는 원소가 후보인지 가를 때 크기를 견주면, 크기가 같은
 * 원소 둘 중 무엇이 후보인지 모른다. 자리 번호는 원소마다 다르다. 자리로 가르므로 크기가 같은 앞 후보를
 * 버려도 옳고, 이 정본은 남긴다 — 어느 쪽이든 계급이 같고 계약은 둘을 가르지 않는다(헤더 「최댓값이 여럿일
 * 때」).
 *
 * **두 줄을 되돌려 쓴다.** 앞 끝에서 나간 자리를 그대로 두면 줄이 끝없이 자란다. 계약이 시간만 말하므로
 * 그것도 계약을 지키지만(헤더 「이 계약은 시간만 말한다」), 정본은 읽고 지나온 자리가 줄 길이의 절반을 넘으면
 * 남은 것만 앞으로 옮긴다(`linear/queue` 정본과 같은 처리). 옮기는 호출 하나는 상수가 아니고, 옮긴 뒤 다시
 * 절반이 되려면 그만큼 빼야 하므로 총비용이 뺀 횟수에 비례한다. 자리 번호는 옮겨도 바뀌지 않게 **지금까지
 * 나간 원소 수**를 더한 전역 번호로 적는다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"칸 하나를 지나갈 때마다 1"* 이고 비교자 호출은 그 자체로 1 이다 —
 * **읽기와 쓰기를 따로 세지 않고**, 언어 런타임이 배열을 다시 잡는 비용도 세지 않는다(§규약2 계측 단위).
 * 넣기는 원소 칸 1 · 비교마다 1 · 후보 칸 1, 빼기는 원소 칸 1 · 후보를 내보낼 때 1 · 옮기는 칸마다 1, 나머지는
 * 들고 있는 값을 읽어 1 이다. 빈 큐의 `dequeue` 는 지나갈 칸이 없어 0 이다. `__cost` 는 계약이 아니라 정본의
 * 의무다(불변 사실 23).
 */

// #region guide:core
export class MonotonicQueue<T> {
  readonly #compare: (a: T, b: T) => number;
  /** 담긴 원소. `#head` 앞은 이미 나갔다. */
  #items: (T | undefined)[] = [];
  #head = 0;
  /** `#items[0]` 의 전역 자리 번호 — 되돌려 쓰느라 앞으로 옮긴 원소 수. */
  #base = 0;
  /** 최댓값 후보의 전역 자리 번호. `#candHead` 부터 뒤로 가며 비교자 기준으로 늘지 않는다. */
  #cands: number[] = [];
  #candHead = 0;

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

  enqueue(item: T): void {
    const cands = this.#cands;
    // 새 원소보다 엄격히 작은 후보를 뒤에서부터 버린다. 새 원소가 그들보다 늦게 나가므로 다시 답이 될 일이 없다.
    while (cands.length > this.#candHead) {
      this.__cost += 1;
      const last = this.#at(cands[cands.length - 1] as number);
      if (this.#compare(last, item) >= 0) break;
      cands.pop();
    }
    this.__cost += 2;
    cands.push(this.#base + this.#items.length);
    this.#items.push(item);
  }

  dequeue(): T | null {
    if (this.#head >= this.#items.length) return null;
    this.__cost += 1;
    const position = this.#base + this.#head;
    const item = this.#items[this.#head] as T;
    // 나가는 원소가 맨 앞 후보면 후보도 함께 내보낸다. 자리 번호로 가르므로 크기가 같은 원소와 섞이지 않는다.
    if (this.#cands[this.#candHead] === position) {
      this.__cost += 1;
      this.#candHead += 1;
    }
    this.#items[this.#head] = undefined;
    this.#head += 1;
    this.#compact();
    return item;
  }

  front(): T | null {
    this.__cost += 1;
    return this.#head >= this.#items.length
      ? null
      : (this.#items[this.#head] as T);
  }

  max(): T | null {
    this.__cost += 1;
    return this.#candHead >= this.#cands.length
      ? null
      : this.#at(this.#cands[this.#candHead] as number);
  }

  /** 전역 자리 번호의 원소. */
  #at(position: number): T {
    return this.#items[position - this.#base] as T;
  }

  /**
   * 읽고 지나온 자리가 줄 길이의 절반을 넘으면 남은 것만 앞으로 옮긴다. 두 줄에 따로 건다.
   *
   * 옮긴 직후 다시 절반이 되려면 남은 수만큼 앞 끝이 지나가야 하므로, 옮긴 양이 그 사이에 뺀 양을 넘지 않는다.
   */
  #compact(): void {
    if (this.#head * 2 >= this.#items.length) {
      const kept: (T | undefined)[] = [];
      for (let at = this.#head; at < this.#items.length; at++) {
        this.__cost += 1;
        kept.push(this.#items[at]);
      }
      this.#base += this.#head;
      this.#items = kept;
      this.#head = 0;
    }
    if (this.#candHead * 2 >= this.#cands.length) {
      const kept: number[] = [];
      for (let at = this.#candHead; at < this.#cands.length; at++) {
        this.__cost += 1;
        kept.push(this.#cands[at] as number);
      }
      this.#cands = kept;
      this.#candHead = 0;
    }
  }
}
// #endregion
