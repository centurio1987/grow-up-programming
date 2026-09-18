/**
 * `linear/queue` 정본(규약2).
 *
 * 계약은 `../queue.ts` 헤더 한 곳이다. 이 파일은 그 계약을 실제로 지키는 구현 **하나**이고,
 * 계약이 허용하는 유일한 구현이 아니다. 넣는 자리와 빼는 자리를 스택 둘로 나눠 드는 구현도
 * 이 계약을 지키고, 자리를 돌려 쓰는 고리 버퍼도 지킨다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"칸 하나를 지나갈 때마다 1"* 이다 — **읽기와 쓰기를
 * 따로 세지 않고**, 언어 런타임이 배열을 다시 잡는 비용도 세지 않는다. 축3은 절대 카운트가
 * 아니라 성장률을 보므로 상수 배수가 판정에 들어오지 않기 때문이다(§규약2 계측 단위). `__cost` 는
 * 계약이 아니라 정본의 의무다(불변 사실 23).
 *
 * 이 계약의 등급은 `basic` 이다 — 자명한 구현으로 상한이 나온다. 그런데 그 자명한 구현
 * (배열 하나 + 읽을 자리 정수 하나)은 **꺼낸 자리를 되돌려 쓰지 않아 배열이 계속 자란다.**
 * 계약이 시간만 말하므로 그것도 계약을 지키지만, 정본은 거기서 한 걸음 더 간다. 읽은 자리가
 * 절반을 넘으면 남은 것만 앞으로 옮긴다 — 옮기는 호출 하나는 상수가 아니고, 옮긴 뒤 다시
 * 절반이 되려면 그만큼 꺼내야 하므로 **총비용이 꺼낸 횟수에 비례한다.**
 */

// #region guide:core
export class Queue<T> {
  #items: (T | undefined)[] = [];
  /** 다음에 꺼낼 자리. 이 앞은 이미 나갔고 되돌려 쓰지 않는다. */
  #head = 0;

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
  __cost = 0;

  enqueue(item: T): void {
    this.__cost += 1;
    this.#items.push(item);
  }

  dequeue(): T | null {
    if (this.#head >= this.#items.length) return null;
    this.__cost += 1;
    const item = this.#items[this.#head] as T;
    // 꺼낸 자리의 참조를 놓아 준다. 배열이 원소를 붙들고 있으면 큐에서 나간 값이 살아 있다.
    this.#items[this.#head] = undefined;
    this.#head += 1;
    this.#compact();
    return item;
  }

  front(): T | null {
    if (this.#head >= this.#items.length) return null;
    this.__cost += 1;
    return this.#items[this.#head] as T;
  }

  /**
   * 읽고 지나온 자리가 절반을 넘으면 남은 것만 앞으로 옮긴다.
   *
   * 옮기는 호출 하나는 남은 원소 수에 비례하므로 상수가 아니다. 그래도 상한을 지키는 이유는
   * **옮긴 직후 다시 절반이 되려면 남은 수의 절반만큼 꺼내야 하기 때문**이다. 옮긴 양이
   * 그 사이에 꺼낸 양을 넘지 않으므로, 꺼내기 n 회의 총비용이 O(n) 이다. 계약이 `dequeue` 를
   * `amortized` 로 적은 자리가 여기다.
   */
  #compact(): void {
    if (this.#head === 0) return;
    if (this.#head * 2 < this.#items.length) return;
    const kept: (T | undefined)[] = [];
    for (let at = this.#head; at < this.#items.length; at++) {
      this.__cost += 1;
      kept.push(this.#items[at]);
    }
    this.#items = kept;
    this.#head = 0;
  }
}
// #endregion
