export function dijkstra(
  n: number,
  edges: [number, number, number][],
  src: number,
): number[] {
  //초기화
  const distanceTable: number[] = Array.from({ length: n }, (v, k) => {
    if (k === src) {
      return 0;
    }
    return Number.POSITIVE_INFINITY;
  });

  const adjacentList: [number, number][][] = Array.from(
    { length: n },
    () => [],
  );

  edges.map((edge) => {
    adjacentList[edge[0]]!.push([edge[1], edge[2]]);
  });
  const priorityQ: PriorityQueue = new PriorityQueue();
  priorityQ.push([src, 0]);
  //메인 로직
  /**
   * 1. while(우선순위 큐가 빌 때 까지)
   * 1.1 큐에서 팝
   * 1.2 팝한 아이템이 이미 계산된 거리D 보다 크면 continue
   * 1.3 for(팝한 아이템의 모든 이웃에 대하여)
   * 1.4 D(v)보다 D(u) + W[v]가 작으면 D(v)를 갱신하고 우선순위 큐에 push
   */
  while (priorityQ.isEmpty() === false) {
    const u = priorityQ.pop();
    if (u instanceof Error) {
      break;
    }

    const distanceU = u[1]!;
    const uIdx = u[0]!;
    if (distanceU! > distanceTable[uIdx]!) {
      continue;
    }

    for (let edge of adjacentList[uIdx]!) {
      const vIdx = edge[0]!;
      const weight = edge[1]!;
      if (distanceTable[vIdx]! > distanceU! + weight) {
        distanceTable[vIdx] = distanceU! + weight;

        priorityQ.push([vIdx, distanceTable[vIdx]]);
      }
    }
  }

  //리턴
  return distanceTable;
}

class PriorityQueue {
  private values: number[][];
  constructor() {
    this.values = [];
  }

  push(item: number[]) {
    this.values.push(item);

    let childIdx = this.values.length - 1;

    while (childIdx > 0) {
      const parentIdx = this.searchParent(childIdx);

      if (this.values[childIdx]![1]! < this.values[parentIdx]![1]!) {
        const swap = this.values[childIdx]!;
        this.values[childIdx] = this.values[parentIdx]!;
        this.values[parentIdx] = swap;
      } else {
        break;
      }

      childIdx = parentIdx;
    }
  }

  private searchParent(childIdx: number) {
    /**
     * 0
     * 1 2
     * 3 4 5 6
     * 7 8 9 10 11 12 13 14
     * childL = parent * 2 + 1
     * parent = (childL - 1) / 2
     */
    return Math.floor((childIdx - 1) / 2);
  }

  pop(): number[] | Error {
    if (this.values.length === 0) {
      return new Error();
    }

    const swap = this.values[0]!;
    this.values[0] = this.values[this.values.length - 1]!;
    this.values[this.values.length - 1] = swap;

    const result = this.values.pop()!;

    let parentIdx = 0;
    let [childL, childR] = this.searchChildren(0);
    while (childL! < this.values.length) {
      let minChildIdx: number;

      if (childR! > this.values.length - 1) {
        minChildIdx = childL!;
      } else {
        minChildIdx =
          this.values[childL!]![1]! < this.values[childR!]![1]!
            ? childL!
            : childR!;
      }

      if (this.values[minChildIdx]![1]! < this.values[parentIdx]![1]!) {
        const swap = this.values[minChildIdx]!;
        this.values[minChildIdx] = this.values[parentIdx]!;
        this.values[parentIdx] = swap;

        parentIdx = minChildIdx;
      } else {
        break;
      }

      [childL, childR] = this.searchChildren(parentIdx);
    }

    return result!;
  }

  private searchChildren(parentIdx: number) {
    return [parentIdx * 2 + 1, parentIdx * 2 + 2];
  }

  isEmpty() {
    return this.values.length === 0 ? true : false;
  }
}
