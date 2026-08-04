/**
 * 결함 fixture — **구간을 배열에 담고 질의마다 전부 훑는 목록.**
 *
 * 이 구현은 계약의 **의미**를 완벽하게 지킨다. 겹치는 것을 빠짐없이, 겹치는 것만 돌려준다.
 * 축1도 축2도 통과한다. 어긋나는 것은 비용 조건 하나뿐이고, 그것이 필요충분조건의 두 번째
 * 줄이 말하는 바다 — *"질의가 답 수가 아니라 저장 수에 비례하면 구간 색인이 아니다."*
 *
 * 그리고 이 fixture 는 **삽입 시나리오를 통과한다.** 배열 뒤에 붙이는 것은 상수이기
 * 때문이다. 걸리는 자리는 질의와 삭제뿐이다 — 균형을 안 잡는 트리와 정확히 반대쪽에서
 * 걸린다. 두 결함이 서로의 통과 자리에서 걸리는 것이 시나리오를 여럿 두는 이유다.
 *
 * **k 를 상수로 누른 시나리오만 이것을 잡는다.** 답이 저장 수에 비례하는 질의로 재면
 * `O((k+1) log n)` 계약도 n 에 비례하므로, 전부 훑는 이 구현이 그 자리에서는 정당해 보인다.
 */

export class ScanIntervalList {
  #items: [number, number][] = [];

  __cost = 0;

  insert(low: number, high: number): void {
    this.__cost += 1;
    this.#items.push([low, high]);
  }

  delete(low: number, high: number): boolean {
    for (let at = 0; at < this.#items.length; at++) {
      this.__cost += 1;
      const stored = this.#items[at];
      if (stored === undefined) continue;
      if (stored[0] === low && stored[1] === high) {
        this.#items.splice(at, 1);
        return true;
      }
    }
    return false;
  }

  stabQuery(point: number): [number, number][] {
    return this.overlapQuery(point, point);
  }

  overlapQuery(low: number, high: number): [number, number][] {
    const found: [number, number][] = [];
    for (const stored of this.#items) {
      this.__cost += 1;
      if (stored[0] <= high && low <= stored[1]) found.push([...stored]);
    }
    return found;
  }

  size(): number {
    this.__cost += 1;
    return this.#items.length;
  }
}
