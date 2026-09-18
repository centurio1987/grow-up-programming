/**
 * `linear/unrolledLinkedList` 정본 구현.
 *
 * **계약은 여기 적지 않는다.** 계약은 `../unrolledLinkedList.ts` 헤더 한 곳이다(규약1).
 * 이 파일이 지는 의무는 둘 — 그 계약을 실제로 지키는 것, 그리고 축3이 읽을 `__cost` 를
 * 노출하는 것.
 *
 * `__cost` 가 세는 것: **묶음이나 원소 하나를 지나갈 때마다 1** — **읽기와 쓰기를 따로 세지
 * 않는다**(§규약2 계측 단위).
 * 이 구조에는
 * 주입점이 없어 밖에서 셀 수 있는 양이 없다 — 그래서 자기 보고이고, 무엇을 세는지를 여기
 * 적는 것이 §규약2가 요구하는 전부다.
 *
 * 이 구현이 무엇인지는 계약의 일부가 아니다. 계약은 위치 연산 셋의 $O(\sqrt n)$ 만
 * 요구하므로 그것을 만족하는 아무 구현이나 여기 올 수 있다 — 부분 트리 크기를 들고 다니는
 * 균형 트리도 계약을 지킨다. 다만 **그 구현은 정본이 될 수 없다**: 축3은 상한을 넘는 쪽만이
 * 아니라 계약이 적은 성장 계급을 벗어나는 쪽 전부를 실패로 보므로, $O(\log n)$ 구현은
 * $r = 1.2$ 로 측정되어 $O(\sqrt n)$ 계약의 기대 2.0 을 아래로 벗어난다.
 */

// #region guide:core
export class UnrolledLinkedList<T> {
  /** 원소를 순서대로 나눠 담은 묶음들. 앞 묶음이 앞 위치를 가진다. */
  #blocks: T[][] = [];
  #count = 0;
  /** 묶음 하나가 담을 목표 원소 수. 재구성 때 $\lceil\sqrt n\rceil$ 로 다시 잡는다. */
  #target = 1;
  /** 마지막 재구성 시점의 원소 수. 여기서 두 배가 되거나 절반이 되면 다시 잡는다. */
  #rebuiltAt = 0;

  /** 축3 계측(§규약2). 계약이 아니라 정본의 의무다. */
  __cost = 0;

  push(item: T): void {
    const last = this.#blocks[this.#blocks.length - 1];
    if (last === undefined || last.length >= this.#target * 2) {
      this.#blocks.push([item]);
    } else {
      last.push(item);
    }
    this.__cost += 1;
    this.#count += 1;
    this.#rebalance();
  }

  pop(): T | null {
    this.__cost += 1;
    const last = this.#blocks[this.#blocks.length - 1];
    if (last === undefined) return null;
    const item = last.pop() as T;
    if (last.length === 0) this.#blocks.pop();
    this.#count -= 1;
    this.#rebalance();
    return item;
  }

  get(index: number): T | null {
    const at = this.#locate(index);
    if (at === null) return null;
    this.__cost += 1;
    return (this.#blocks[at.block] as T[])[at.offset] as T;
  }

  insert(index: number, item: T): void {
    if (index < 0 || index > this.#count) return;
    if (index === this.#count) {
      this.push(item);
      return;
    }
    const at = this.#locate(index);
    if (at === null) return;
    const block = this.#blocks[at.block] as T[];
    this.__cost += block.length - at.offset;
    // 끼워 넣은 자리 뒤가 한 칸씩 밀린다. 밀리는 것은 **그 묶음 안뿐이다** — 뒤 묶음들은
    // 손대지 않는다. 배열 하나였다면 여기서 뒤 원소 전부가 밀린다.
    block.splice(at.offset, 0, item);
    this.#count += 1;
    if (block.length > this.#target * 2) this.#split(at.block);
    this.#rebalance();
  }

  remove(index: number): T | null {
    const at = this.#locate(index);
    if (at === null) return null;
    const block = this.#blocks[at.block] as T[];
    this.__cost += block.length - at.offset;
    const [item] = block.splice(at.offset, 1);
    if (block.length === 0) {
      this.__cost += this.#blocks.length - at.block;
      this.#blocks.splice(at.block, 1);
    }
    this.#count -= 1;
    this.#rebalance();
    return item as T;
  }

  toArray(): T[] {
    const out: T[] = [];
    for (const block of this.#blocks) {
      for (const item of block) {
        this.__cost += 1;
        out.push(item);
      }
    }
    return out;
  }

  /**
   * 위치를 (묶음 번호, 묶음 안 자리)로 바꾼다. 범위 밖이면 `null`.
   *
   * 앞에서부터 묶음의 길이를 빼 가며 찾으므로 비용이 **묶음 수**에 비례한다. 묶음 수를
   * $\Theta(\sqrt n)$ 으로 붙들어 두는 것이 `#rebalance` 의 일이고, 그 둘이 맞물려야
   * 계약의 $O(\sqrt n)$ 이 성립한다.
   */
  #locate(index: number): { block: number; offset: number } | null {
    if (index < 0 || index >= this.#count) return null;
    let rest = index;
    for (let at = 0; at < this.#blocks.length; at++) {
      this.__cost += 1;
      const length = (this.#blocks[at] as T[]).length;
      if (rest < length) return { block: at, offset: rest };
      rest -= length;
    }
    return null;
  }

  /** 목표의 두 배를 넘긴 묶음을 반으로 가른다. 가르지 않으면 묶음 안 밀기가 자란다. */
  #split(at: number): void {
    const block = this.#blocks[at] as T[];
    const half = block.length >> 1;
    this.__cost += block.length - half;
    const tail = block.splice(half);
    this.__cost += this.#blocks.length - at;
    this.#blocks.splice(at + 1, 0, tail);
  }

  /**
   * 원소 수가 마지막 재구성 때의 두 배가 되거나 절반이 되면 묶음을 다시 잡는다.
   *
   * 재구성 사이에 원소 수가 최대 두 배까지만 움직이므로 목표 크기가 항상
   * $\Theta(\sqrt n)$ 안에 있고, 재구성 자체는 $n$ 이 두 배가 될 때만 일어나므로
   * 전체 비용이 등비급수로 $O(n)$ 이다 — 그래서 넣고 빼기의 상각 상수가 유지된다.
   */
  #rebalance(): void {
    const doubled = this.#count >= Math.max(4, this.#rebuiltAt * 2);
    const halved = this.#count * 2 <= this.#rebuiltAt;
    if (doubled || halved) this.#rebuild();
  }

  #rebuild(): void {
    const target = Math.max(1, Math.ceil(Math.sqrt(this.#count)));
    const grouped: T[][] = [];
    let current: T[] = [];
    for (const block of this.#blocks) {
      for (const item of block) {
        this.__cost += 1;
        current.push(item);
        if (current.length === target) {
          grouped.push(current);
          current = [];
        }
      }
    }
    if (current.length > 0) grouped.push(current);
    this.#blocks = grouped;
    this.#target = target;
    this.#rebuiltAt = this.#count;
  }
}
// #endregion
