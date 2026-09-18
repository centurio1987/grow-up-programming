/**
 * `linear/xorLinkedList` 정본 구현.
 *
 * **계약은 여기 적지 않는다.** 계약은 `../xorLinkedList.ts` 헤더 한 곳이다(규약1). 이 파일이
 * 지는 의무는 둘이다 — 그 계약을 실제로 지키는 것, 그리고 축3이 읽을 `__cost` 를 노출하는 것.
 *
 * `__cost` 가 세는 것: **노드를 표에서 찾아 들여다볼 때마다 1**, 그리고 **새 노드를 만들 때 1.**
 * 읽기와 쓰기를 따로 세지 않는다(§규약2 계측 단위).
 * 이 구조에는 주입점이 없어 밖에서 셀 수 있는 양이 없다 — 그래서 자기 보고이고, 무엇을
 * 세는지를 여기 적는 것이 §규약2가 요구하는 전부다.
 *
 * 표에서 찾는 것을 1로 세는 이유는 그것이 **포인터를 따라가던 자리를 대신한 연산**이기
 * 때문이다. C 라면 주소 하나를 역참조할 자리에서 여기서는 표를 한 번 뒤진다.
 *
 * 이 구현이 계약을 지킨다는 것과, 이 구현이 이 계약을 지키는 **가장 싼** 방법이라는 것은
 * 다른 이야기다. 뒤쪽은 참이 아니고 그 이유는 `../xorLinkedList-guide.md` 가 센다.
 * 계약이 공간을 약속하지 않으므로 그 사실이 여기서 계약 위반이 되지는 않는다.
 */

// #region guide:core/node
/** 표의 빈자리를 가리키는 값. 실제 id 는 1부터 나가므로 0 과 겹치지 않는다. */
const NIL = 0;

interface XorNode {
  id: number;
  value: number;
  /** 앞 이웃 id 와 뒤 이웃 id 의 XOR. 어느 한쪽도 이 값만으로는 복원되지 않는다. */
  xorId: number;
}
// #endregion

// #region guide:core/class
export class XorLinkedList {
  #nodes = new Map<number, XorNode>();
  #headId = NIL;
  #tailId = NIL;
  /** 다음에 나눠 줄 id. 한 번 쓴 값을 다시 쓰지 않는다. */
  #nextId = 1;

  /** 축3 계측(§규약2). 계약이 아니라 정본의 의무다. */
  __cost = 0;

  append(value: number): void {
    const id = this.#nextId++;
    // 새 노드의 뒤 이웃은 아직 없다 — 그래서 앞 이웃 id 하나가 그대로 XOR 값이 된다.
    this.#nodes.set(id, { id, value, xorId: this.#tailId });
    this.__cost += 1;

    if (this.#tailId === NIL) {
      this.#headId = id;
    } else {
      // 옛 꼬리의 뒤 이웃 자리는 NIL 이었다. NIL 을 지우고 새 id 를 넣는 것이 이 XOR 한 번이다.
      const tail = this.#at(this.#tailId);
      tail.xorId ^= id;
    }

    this.#tailId = id;
  }

  toArray(): number[] {
    return this.#walk(this.#headId);
  }

  toArrayReverse(): number[] {
    return this.#walk(this.#tailId);
  }

  /**
   * 한쪽 끝에서 반대쪽 끝까지 걷는다.
   *
   * **두 방향이 같은 코드다.** 시작점만 다르다. 양쪽 끝 어디서 출발하든 직전에 읽은 노드가
   * 곧 이웃 하나이므로, 저장된 XOR 값에서 나머지 하나가 나온다.
   */
  #walk(startId: number): number[] {
    const values: number[] = [];
    let prevId = NIL;
    let currId = startId;

    while (currId !== NIL) {
      const node = this.#at(currId);
      values.push(node.value);
      const nextId = node.xorId ^ prevId;
      prevId = currId;
      currId = nextId;
    }

    return values;
  }

  #at(id: number): XorNode {
    this.__cost += 1;
    const node = this.#nodes.get(id);
    if (node === undefined) {
      throw new Error(`표에 없는 id 를 따라갔다: ${id}`);
    }
    return node;
  }
}
// #endregion
