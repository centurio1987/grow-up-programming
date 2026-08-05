/**
 * 결함 fixture — `linear/unrolledLinkedList` 가 **처방받았던 그 구현**.
 *
 * 삭제된 `unrolledLinkedList-problem.md` 가 적어 둔 것을 그대로 옮겼다. 크기를 상수로
 * 고정한 묶음을 한 방향으로 잇고, 뒤 끝 묶음이 비면 앞에서부터 그 앞 묶음을 찾는다
 * (*"단방향 연결 리스트이므로 O(p) 탐색 필요"*).
 *
 * **이 fixture 의 요지는 상수 묶음 크기 하나가 두 상한을 동시에 무너뜨린다는 것이다.**
 * 묶음 수가 $n/16$ 이라 n 에 비례하므로,
 *
 * - `pop` — 묶음이 빌 때마다 묶음 수만큼 밟는다. 전부 빼면 $\Theta(n^2/16^2)$ 이고
 *   연산당 $\Theta(n)$ 이다. 표는 `O(1) amortized` 라고 적었다(진단된 A급 결함).
 * - `get`·`insert`·`remove` — 위치를 찾느라 묶음 수만큼 밟으므로 $\Theta(n)$ 이다.
 *   문제 문서는 `get` 을 $O(\sqrt n)$ 이라 적었는데, 그 값은 묶음 크기가 $\sqrt n$ 을
 *   따라갈 때만 나온다. 생성자로 한 번 정하고 끝나는 값은 따라가지 못한다.
 *
 * `push`·`size`·`toArray` 는 통과한다 — 그 셋이 문제 문서의 표가 맞게 적은 셋이다.
 */

const CHUNK_SIZE = 16;

interface Chunk<T> {
  items: T[];
  next: Chunk<T> | null;
}

export class FixedChunkList<T> {
  #head: Chunk<T> | null = null;
  #tail: Chunk<T> | null = null;
  #count = 0;

  __cost = 0;

  push(item: T): void {
    this.__cost += 1;
    if (this.#tail === null || this.#tail.items.length >= CHUNK_SIZE) {
      const chunk: Chunk<T> = { items: [item], next: null };
      if (this.#tail === null) this.#head = chunk;
      else this.#tail.next = chunk;
      this.#tail = chunk;
    } else {
      this.#tail.items.push(item);
    }
    this.#count += 1;
  }

  pop(): T | null {
    this.__cost += 1;
    if (this.#tail === null) return null;
    const item = this.#tail.items.pop() as T;
    this.#count -= 1;
    if (this.#tail.items.length === 0) {
      // 앞 묶음을 가리키는 참조가 없으므로 head 부터 다시 밟는다. 여기가 결함이다.
      if (this.#head === this.#tail) {
        this.#head = null;
        this.#tail = null;
      } else {
        let walk = this.#head as Chunk<T>;
        while (walk.next !== this.#tail) {
          this.__cost += 1;
          walk = walk.next as Chunk<T>;
        }
        this.__cost += 1;
        walk.next = null;
        this.#tail = walk;
      }
    }
    return item;
  }

  get(index: number): T | null {
    const at = this.#locate(index);
    if (at === null) return null;
    this.__cost += 1;
    return at.chunk.items[at.offset] as T;
  }

  insert(index: number, item: T): void {
    if (index < 0 || index > this.#count) return;
    if (index === this.#count) {
      this.push(item);
      return;
    }
    const at = this.#locate(index);
    if (at === null) return;
    this.__cost += at.chunk.items.length - at.offset;
    at.chunk.items.splice(at.offset, 0, item);
    this.#count += 1;
  }

  remove(index: number): T | null {
    const at = this.#locate(index);
    if (at === null) return null;
    this.__cost += at.chunk.items.length - at.offset;
    const [item] = at.chunk.items.splice(at.offset, 1);
    this.#count -= 1;
    if (at.chunk.items.length === 0) this.#unlink(at.chunk);
    return item as T;
  }

  size(): number {
    this.__cost += 1;
    return this.#count;
  }

  toArray(): T[] {
    const out: T[] = [];
    for (let walk = this.#head; walk !== null; walk = walk.next) {
      for (const item of walk.items) {
        this.__cost += 1;
        out.push(item);
      }
    }
    return out;
  }

  #locate(index: number): { chunk: Chunk<T>; offset: number } | null {
    if (index < 0 || index >= this.#count) return null;
    let rest = index;
    for (let walk = this.#head; walk !== null; walk = walk.next) {
      this.__cost += 1;
      if (rest < walk.items.length) return { chunk: walk, offset: rest };
      rest -= walk.items.length;
    }
    return null;
  }

  #unlink(chunk: Chunk<T>): void {
    if (this.#head === chunk) {
      this.#head = chunk.next;
      if (this.#tail === chunk) this.#tail = null;
      return;
    }
    let walk = this.#head as Chunk<T>;
    while (walk.next !== chunk) {
      this.__cost += 1;
      walk = walk.next as Chunk<T>;
    }
    this.__cost += 1;
    walk.next = chunk.next;
    if (this.#tail === chunk) this.#tail = walk;
  }
}
