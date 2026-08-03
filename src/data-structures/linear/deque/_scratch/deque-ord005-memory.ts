// 메모리 실측 — 프로세스를 분리해 재는 편이 정확하다.
// 실행: bun deque-ord005-memory.ts array   /   bun deque-ord005-memory.ts linked
//
// 같은 원소 100만 개를 담았을 때 프로세스 RSS 증가분을 잰다.

const mode = Bun.argv[2] ?? "array";
const N = 1_000_000;

function rssMB(): number {
  return process.memoryUsage().rss / 1024 / 1024;
}

Bun.gc(true);
const before = rssMB();

let keep: unknown;

if (mode === "array") {
  class Deque<T> {
    private front: T[] = [];
    private back: T[] = [];
    pushBack(item: T): void {
      this.back.push(item);
    }
    size(): number {
      return this.front.length + this.back.length;
    }
  }
  const dq = new Deque<number>();
  for (let i = 0; i < N; i++) dq.pushBack(i);
  keep = dq;
  console.log(`array  size=${dq.size()}`);
} else {
  class Node<T> {
    value: T;
    prev: Node<T> | undefined = undefined;
    next: Node<T> | undefined = undefined;
    constructor(value: T) {
      this.value = value;
    }
  }
  class LinkedDeque<T> {
    private head: Node<T> | undefined = undefined;
    private tail: Node<T> | undefined = undefined;
    private count = 0;
    pushBack(item: T): void {
      const node = new Node(item);
      node.prev = this.tail;
      if (this.tail) this.tail.next = node;
      this.tail = node;
      if (!this.head) this.head = node;
      this.count++;
    }
    size(): number {
      return this.count;
    }
  }
  const dq = new LinkedDeque<number>();
  for (let i = 0; i < N; i++) dq.pushBack(i);
  keep = dq;
  console.log(`linked size=${dq.size()}`);
}

Bun.gc(true);
const after = rssMB();
console.log(`${mode}: RSS ${before.toFixed(1)} MB → ${after.toFixed(1)} MB  (증가 ${(after - before).toFixed(1)} MB, 원소당 ${(((after - before) * 1024 * 1024) / N).toFixed(1)} B)`);
if (!keep) throw new Error("unreachable");
