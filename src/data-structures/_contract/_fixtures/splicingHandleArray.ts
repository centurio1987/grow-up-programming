/**
 * 결함 fixture — `linear/doublyLinkedList` 계약을 **언어 배열 하나**에 원소 상자를 늘어놓아 지키려는 구현.
 *
 * 답은 전부 옳다. 핸들은 원소마다 만든 상자이고, 산 핸들인지는 상자가 기억한 수열로 가린다. 뒤에 넣기 ·
 * 늘어놓기 · 수 세기는 정본과 같은 계급이다. 무너지는 자리는 핸들을 받는 두 연산과 앞에 넣기다 — 상자가
 * 제 첨자를 모르므로 **앞에서부터 훑어 자리를 찾고**, 찾은 자리에서 끼우고 빼느라 **뒤를 한 칸씩 밀거나
 * 당긴다.** 앞에 넣기는 전부를 민다. 그래서 계약의 `prepend` · `insertAfter` · `remove` 행(`amortized
 * O(1)`)을 **어긴다.**
 *
 * **`linear/dynamicArray` 와 이 계약을 가르는 반례의 한쪽이다**(두 헤더의 반례 표). 같은 배열이 저쪽
 * 계약의 여섯 행은 지킨다.
 *
 * 계측 단위는 §규약2 계측 단위를 따른다 — 훑어 지나간 칸과 밀거나 당긴 칸마다 1. 언어 배열의
 * `indexOf` · `splice` · `unshift` 가 실제로 하는 일을 센 것이다.
 */

class Box {
  constructor(
    public value: number,
    public owner: SplicingHandleArray | null,
  ) {}
}

export class SplicingHandleArray {
  #boxes: Box[] = [];

  __cost = 0;

  prepend(value: number): object {
    // 담긴 칸을 전부 한 칸씩 민다.
    this.__cost += this.#boxes.length + 1;
    const box = new Box(value, this);
    this.#boxes.unshift(box);
    return box;
  }

  append(value: number): object {
    this.__cost += 1;
    const box = new Box(value, this);
    this.#boxes.push(box);
    return box;
  }

  insertAfter(handle: object, value: number): object | null {
    const at = this.#find(handle);
    if (at < 0) return null;
    // 끼울 자리 뒤의 칸을 전부 한 칸씩 민다.
    this.__cost += this.#boxes.length - at;
    const box = new Box(value, this);
    this.#boxes.splice(at + 1, 0, box);
    return box;
  }

  remove(handle: object): boolean {
    const at = this.#find(handle);
    if (at < 0) return false;
    // 뺀 자리 뒤의 칸을 전부 한 칸씩 당긴다.
    this.__cost += this.#boxes.length - at;
    const [box] = this.#boxes.splice(at, 1);
    if (box !== undefined) box.owner = null;
    return true;
  }

  toArray(): number[] {
    this.__cost += this.#boxes.length;
    return this.#boxes.map((box) => box.value);
  }

  size(): number {
    this.__cost += 1;
    return this.#boxes.length;
  }

  /** 산 핸들이면 그 상자의 첨자, 아니면 -1. 상자가 첨자를 모르므로 앞에서부터 훑는다. */
  #find(handle: object): number {
    if (!(handle instanceof Box) || handle.owner !== this) return -1;
    const at = this.#boxes.indexOf(handle);
    this.__cost += at + 1;
    return at;
  }
}
