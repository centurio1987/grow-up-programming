
class FibNode<T> {
  item: T;
  degree = 0;
  marked = false;
  parent: FibNode<T> | null = null;
  child: FibNode<T> | null = null;
  left: FibNode<T>;
  right: FibNode<T>;

  constructor(item: T) {
    this.item = item;
    this.left = this;
    this.right = this;
  }
}

class FibonacciHeap<T> {
  private min: FibNode<T> | null = null;
  private count = 0;
  private compare: (a: T, b: T) => number;

  constructor(compare: (a: T, b: T) => number) {
    this.compare = compare;
  }

  private insertToRootList(node: FibNode<T>): void {
    if (this.min === null) {
      node.left = node;
      node.right = node;
      this.min = node;
      return;
    }
    node.left = this.min;
    node.right = this.min.right;
    this.min.right.left = node;
    this.min.right = node;
  }

  insert(item: T): FibNode<T> {
    const node = new FibNode(item);
    this.insertToRootList(node);
    if (this.compare(item, this.min!.item) < 0) this.min = node;
    this.count++;
    return node;
  }

  peek(): T | undefined {
    return this.min === null ? undefined : this.min.item;
  }

  size(): number {
    return this.count;
  }

  isEmpty(): boolean {
    return this.count === 0;
  }

  private removeFromList(node: FibNode<T>): void {
    node.left.right = node.right;
    node.right.left = node.left;
  }

  private addChild(parent: FibNode<T>, node: FibNode<T>): void {
    node.parent = parent;
    if (parent.child === null) {
      node.left = node;
      node.right = node;
      parent.child = node;
    } else {
      node.left = parent.child;
      node.right = parent.child.right;
      parent.child.right.left = node;
      parent.child.right = node;
    }
    parent.degree++;
  }

  // 더 작은 쪽이 부모가 된다.
  private link(a: FibNode<T>, b: FibNode<T>): FibNode<T> {
    let parent = a;
    let child = b;
    if (this.compare(b.item, a.item) < 0) {
      parent = b;
      child = a;
    }
    this.removeFromList(child);
    child.left = child;
    child.right = child;
    this.addChild(parent, child);
    child.marked = false;
    return parent;
  }

  private consolidate(): void {
    if (this.min === null) return;
    const maxDegree = Math.floor(Math.log2(Math.max(this.count, 1))) + 2;
    const table: (FibNode<T> | undefined)[] = new Array(maxDegree + 1).fill(undefined);

    const roots: FibNode<T>[] = [];
    let node = this.min;
    do {
      roots.push(node);
      node = node.right;
    } while (node !== this.min);

    for (let r of roots) {
      let d = r.degree;
      while (table[d] !== undefined) {
        let other = table[d]!;
        r = this.link(r, other); // 같은 차수 충돌마다 d를 한 칸씩 올리며 흡수
        table[d] = undefined;
        d++;
      }
      table[d] = r;
    }

    this.min = null;
    for (const r of table) {
      if (r === undefined) continue;
      r.left = r;
      r.right = r;
      if (this.min === null) {
        this.min = r;
      } else {
        this.insertToRootList(r);
        if (this.compare(r.item, this.min.item) < 0) this.min = r;
      }
    }
  }

  extractMin(): T | undefined {
    const z = this.min;
    if (z === null) return undefined;

    if (z.child !== null) {
      const children: FibNode<T>[] = [];
      let c = z.child;
      do {
        children.push(c);
        c = c.right;
      } while (c !== z.child);
      for (const child of children) {
        this.removeFromList(child);
        child.parent = null;
        child.left = child;
        child.right = child;
        this.insertToRootList(child);
      }
    }

    this.removeFromList(z);
    if (z.right === z) {
      this.min = null;
    } else {
      this.min = z.right;
      this.consolidate();
    }

    this.count--;
    return z.item;
  }

  private cut(node: FibNode<T>, parent: FibNode<T>): void {
    if (node.right === node) {
      parent.child = null;
    } else {
      if (parent.child === node) parent.child = node.right;
      this.removeFromList(node);
    }
    parent.degree--;
    node.left = node;
    node.right = node;
    node.parent = null;
    node.marked = false;
    this.insertToRootList(node); // cut 먼저: node를 루트 리스트로 물리적으로 옮긴다
  }

  private cascadingCut(node: FibNode<T>): void {
    const parent = node.parent;
    if (parent === null) return;
    if (!node.marked) {
      node.marked = true; // 첫 손실 — 표시만
    } else {
      this.cut(node, parent); // 두 번째 손실 — 잘라서 위로 전파
      this.cascadingCut(parent);
    }
  }

  decreaseKey(node: FibNode<T>, newItem: T): void {
    if (this.compare(newItem, node.item) > 0) {
      throw new Error("newItem must be <= current item");
    }
    node.item = newItem;
    const parent = node.parent;
    if (parent !== null && this.compare(node.item, parent.item) < 0) {
      this.cut(node, parent);
      this.cascadingCut(parent);
    }
    if (this.min === null || this.compare(node.item, this.min.item) < 0) {
      this.min = node;
    }
  }

  merge(other: FibonacciHeap<T>): FibonacciHeap<T> {
    const result = new FibonacciHeap<T>(this.compare);
    if (this.min === null) {
      result.min = other.min;
    } else if (other.min === null) {
      result.min = this.min;
    } else {
      const aRight = this.min.right;
      const bLeft = other.min.left;
      this.min.right = other.min;
      other.min.left = this.min;
      aRight.left = bLeft;
      bLeft.right = aRight;
      result.min = this.compare(this.min.item, other.min.item) <= 0 ? this.min : other.min;
    }
    result.count = this.count + other.count;
    return result;
  }
}

export { FibNode, FibonacciHeap };

function assertEq(actual: unknown, expected: unknown, label: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.error(`FAIL ${label}: got ${a}, expected ${e}`);
    process.exitCode = 1;
  } else {
    console.log(`OK   ${label}: ${a}`);
  }
}

function dump<T>(node: FibNode<T> | null, depth = 0): void {
  if (node === null) return;
  let cur = node;
  do {
    console.log("  ".repeat(depth) + `${cur.item} (deg=${cur.degree}, marked=${cur.marked})`);
    dump(cur.child, depth + 1);
    cur = cur.right;
  } while (cur !== node);
}

console.log("=== 본문 실행 시각화 시나리오 (guide 코드 그대로) ===");
{
  const heap = new FibonacciHeap<number>((a, b) => a - b);
  const n10 = heap.insert(10);
  const n5 = heap.insert(5);
  const n15 = heap.insert(15);
  assertEq(heap.peek(), 5, "frame2: min=5");

  const removed = heap.extractMin();
  assertEq(removed, 5, "frame3: extractMin() 반환값=5");
  assertEq(heap.peek(), 10, "frame4: consolidate 후 min=10");

  const n20 = heap.insert(20);
  const n3 = heap.insert(3);
  assertEq(heap.peek(), 3, "frame5: insert(20,3) 후 min=3");

  heap.decreaseKey(n15, 1);
  assertEq(heap.peek(), 1, "frame6: decreaseKey(15->1) 후 min=1");
  assertEq(n10.degree, 0, "frame6: 10의 degree=0 (자식 없어짐)");
  assertEq(n10.marked, false, "frame6: 10.marked=false (cascadingCut 무효과)");

  // decreaseKey(20,1)이었다면 20은 애초에 루트라 parent===null -> cut 없음
  const heap2 = new FibonacciHeap<number>((a, b) => a - b);
  const m10 = heap2.insert(10);
  const m5 = heap2.insert(5);
  const m15 = heap2.insert(15);
  heap2.extractMin();
  const m20 = heap2.insert(20);
  heap2.insert(3);
  assertEq(m20.parent, null, "질문2 검증: 20은 root라 parent=null");
  heap2.decreaseKey(m20, 1);
  assertEq(m10.degree, 1, "질문2 검증: decreaseKey(20,1)은 10의 degree에 영향 없음(cut 안 일어남)");
}

console.log("\n=== merge 앨리어싱 예시 (본문 인용 수치) ===");
{
  const h1 = new FibonacciHeap<number>((a, b) => a - b);
  h1.insert(5);
  h1.insert(9);
  const h2 = new FibonacciHeap<number>((a, b) => a - b);
  h2.insert(3);
  h2.insert(7);
  const merged = h1.merge(h2);
  assertEq(merged.peek(), 3, "merge 직후 peek=3");
  assertEq(merged.size(), 4, "merge 직후 size=4");
  h1.insert(1);
  assertEq(merged.peek(), 3, "h1.insert(1) 후에도 merged.peek()은 여전히 3 (거짓)");
  assertEq(merged.size(), 4, "h1.insert(1) 후에도 merged.size()는 여전히 4 (불일치)");
  const r1 = merged.extractMin();
  const r2 = merged.extractMin();
  const r3 = merged.extractMin();
  assertEq([r1, r2, r3], [3, 1, 5], "extractMin 연속 호출 순서 3,1,5");
}

console.log("\n=== 16개 노드 예시 & cascading cut (본문 인용 수치) ===");
{
  const heap = new FibonacciHeap<number>((a, b) => a - b);
  const nodes: Record<number, FibNode<number>> = {};
  for (let v = 1; v <= 16; v++) nodes[v] = heap.insert(v);
  heap.extractMin();
  assertEq(heap.peek(), 2, "16노드 예시: extractMin(1) 후 min=2");
  console.log("루트 리스트 구조:");
  dump((heap as any).min as FibNode<number> | null);

  heap.decreaseKey(nodes[14], 0);
  assertEq(nodes[13].marked, true, "decreaseKey(14,0) 후 13.marked=true");
  // 9의 degree 확인 (private min 접근을 위해 any 캐스팅)
  const nineAfterFirst = findNode((heap as any).min, 9);
  assertEq(nineAfterFirst?.degree, 3, "decreaseKey(14,0) 후 9.degree=3 (변화 없음)");

  heap.decreaseKey(nodes[15], 0.5);
  const nineAfterSecond = findNode((heap as any).min, 9);
  assertEq(nineAfterSecond?.degree, 2, "decreaseKey(15,0.5) 후 9.degree=2 (cascading cut 발동)");
  assertEq(nodes[13].parent, null, "13은 잘려나가 parent=null (root)");
  assertEq(nodes[13].marked, false, "13은 cut되며 marked 리셋");

  function findNode(start: FibNode<number> | null, target: number): FibNode<number> | undefined {
    if (start === null) return undefined;
    let cur = start;
    do {
      if (cur.item === target) return cur;
      const inChild = findNode(cur.child, target);
      if (inChild) return inChild;
      cur = cur.right;
    } while (cur !== start);
    return undefined;
  }
}

console.log("\n=== 9의 서브트리 크기 & 피보나치 하한 (본문 인용 수치) ===");
{
  const heap = new FibonacciHeap<number>((a, b) => a - b);
  for (let v = 1; v <= 16; v++) heap.insert(v);
  heap.extractMin();
  function subtreeSize(node: FibNode<number>): number {
    let count = 1;
    if (node.child !== null) {
      let c = node.child;
      do {
        count += subtreeSize(c);
        c = c.right;
      } while (c !== node.child);
    }
    return count;
  }
  function findRoot(start: FibNode<number>, target: number): FibNode<number> | undefined {
    let cur = start;
    do {
      if (cur.item === target) return cur;
      cur = cur.right;
    } while (cur !== start);
    return undefined;
  }
  const root9 = findRoot((heap as any).min, 9)!;
  const root3 = findRoot((heap as any).min, 3)!;
  assertEq(subtreeSize(root9), 8, "9의 서브트리 크기=8 (하한 F5=5)");
  assertEq(subtreeSize(root3), 2, "3의 서브트리 크기=2 (하한 F3=2, 타이트)");
}

console.log("\n=== 랜덤 교차검증 (naive 배열 기반 min-heap과 비교, guide 코드) ===");
{
  function randSeeded(seed: number) {
    let s = seed;
    return () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  }
  const rand = randSeeded(999);
  let anyFail = false;
  for (let trial = 0; trial < 20; trial++) {
    const heap = new FibonacciHeap<number>((a, b) => a - b);
    const naive: number[] = [];
    for (let i = 0; i < 40; i++) {
      const r = rand();
      if (r < 0.6 || naive.length === 0) {
        const v = Math.floor(rand() * 1000);
        heap.insert(v);
        naive.push(v);
      } else {
        naive.sort((a, b) => a - b);
        const expected = naive.shift();
        const got = heap.extractMin();
        if (got !== expected) {
          console.error(`FAIL trial ${trial}: got ${got}, expected ${expected}`);
          anyFail = true;
        }
      }
    }
    naive.sort((a, b) => a - b);
    while (naive.length > 0) {
      const expected = naive.shift();
      const got = heap.extractMin();
      if (got !== expected) {
        console.error(`FAIL trial ${trial} drain: got ${got}, expected ${expected}`);
        anyFail = true;
      }
    }
  }
  if (anyFail) process.exitCode = 1;
  console.log("랜덤 교차검증 20 trial 완료");
}

console.log("\n=== ALL CHECKS DONE ===");
