/**
 * 결함 fixture — **뒤 끝을 기억하지 않고 붙일 때마다 앞에서부터 훑는 사슬.**
 *
 * 이 구현은 계약의 **의미**를 완벽하게 지킨다. 붙인 순서대로 나오고, 두 방향이 서로의
 * 역순이고, 세는 수와 내놓는 수가 같다. 축1도 축2도 통과한다. 어긋나는 것은 비용 조건
 * 하나뿐이고, 그것이 필요충분조건의 두 번째 줄이 말하는 바다 — *"붙일 때마다 앞에서부터
 * 훑어 뒤 끝을 찾으면 그건 뒤 끝을 모르는 수열이다."*
 *
 * **이 계약에서 축3이 잡을 수 있는 것은 이것 하나다.** 순회 둘은 O(n) 이 상한이라 전부
 * 훑는 구현조차 계약을 지키고, `size` 는 세어 두기만 하면 상수다. 시간이 이 구조에 요구하는
 * 전부가 "뒤 끝을 기억하라" 한 줄이라는 사실이, 이 구조가 시간 때문에 존재하는 것이
 * 아니라는 진단의 다른 쪽 면이다.
 *
 * 적대적 입력은 두지 않았다. 이 결함은 **어떤 붙이기 순서에서도** 똑같이 걸린다 — 비용이
 * 값에도 순서에도 기대지 않기 때문이다.
 */

interface ScanNode {
  value: number;
  next: ScanNode | null;
}

export class TailScanList {
  #head: ScanNode | null = null;
  #count = 0;

  __cost = 0;

  append(value: number): void {
    const node: ScanNode = { value, next: null };
    this.__cost += 1;

    if (this.#head === null) {
      this.#head = node;
    } else {
      // 뒤 끝을 들고 있지 않으므로 매번 앞에서부터 찾아간다.
      let curr = this.#head;
      this.__cost += 1;
      while (curr.next !== null) {
        curr = curr.next;
        this.__cost += 1;
      }
      curr.next = node;
    }

    this.#count += 1;
  }

  toArray(): number[] {
    const values: number[] = [];
    for (let curr = this.#head; curr !== null; curr = curr.next) {
      this.__cost += 1;
      values.push(curr.value);
    }
    return values;
  }

  toArrayReverse(): number[] {
    return this.toArray().reverse();
  }

  size(): number {
    this.__cost += 1;
    return this.#count;
  }
}
