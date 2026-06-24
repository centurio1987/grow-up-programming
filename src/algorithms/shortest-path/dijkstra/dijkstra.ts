export function dijkstra(
  n: number,
  edges: [number, number, number][],
  src: number,
): number[] {
    throw new Error("Not implemented");
}

class PriorityQueue {
  private values: number[][];
  constructor() {
    this.values = [];
  }

  push(item: number[]) {
      throw new Error("Not implemented");
  }

  private searchParent(childIdx: number) {
      throw new Error("Not implemented");
  }

  pop(): number[] | Error {
      throw new Error("Not implemented");
  }

  private searchChildren(parentIdx: number) {
      throw new Error("Not implemented");
  }

  isEmpty() {
      throw new Error("Not implemented");
  }
}
