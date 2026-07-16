// E3 자기검증용 스크래치 — 가이드 본문 코드 그대로 추출해 실행 확인

class PairingNode<T> {
  item: T;
  leftChild: PairingNode<T> | null = null;
  nextSibling: PairingNode<T> | null = null;

  constructor(item: T) {
    this.item = item;
  }
}

class PairingHeap<T> {
  private root: PairingNode<T> | null = null;
  private count = 0;
  private compare: (a: T, b: T) => number;

  constructor(compare: (a: T, b: T) => number) {
    this.compare = compare;
  }

  private link(a: PairingNode<T> | null, b: PairingNode<T> | null): PairingNode<T> | null {
    if (a === null) return b;
    if (b === null) return a;
    if (this.compare(a.item, b.item) <= 0) {
      b.nextSibling = a.leftChild;
      a.leftChild = b;
      return a;
    } else {
      a.nextSibling = b.leftChild;
      b.leftChild = a;
      return b;
    }
  }

  private twoPassMerge(node: PairingNode<T> | null): PairingNode<T> | null {
    if (node === null || node.nextSibling === null) return node;
    const first = node;
    const second = node.nextSibling;
    const rest = second.nextSibling;
    first.nextSibling = null;
    second.nextSibling = null;
    const paired = this.link(first, second);
    return this.link(paired, this.twoPassMerge(rest));
  }

  insert(item: T): void {
    const node = new PairingNode(item);
    this.root = this.link(this.root, node);
    this.count++;
  }

  extractMin(): T | undefined {
    if (this.root === null) return undefined;
    const item = this.root.item;
    this.root = this.twoPassMerge(this.root.leftChild);
    this.count--;
    return item;
  }

  merge(other: PairingHeap<T>): PairingHeap<T> {
    const result = new PairingHeap<T>(this.compare);
    result.root = this.link(this.root, other.root);
    result.count = this.count + other.count;
    return result;
  }

  peek(): T | undefined {
    return this.root?.item;
  }

  size(): number {
    return this.count;
  }

  isEmpty(): boolean {
    return this.count === 0;
  }

  // 검증 편의를 위한 디버그 접근자
  debugChildrenOfRoot(): T[] {
    const out: T[] = [];
    let cur = this.root?.leftChild ?? null;
    while (cur !== null) {
      out.push(cur.item);
      cur = cur.nextSibling;
    }
    return out;
  }

  debugDepth(): number {
    const depth = (n: PairingNode<T> | null): number => (n === null ? 0 : 1 + depth(n.leftChild));
    return depth(this.root);
  }
}

function assertEq(actual: unknown, expected: unknown, label: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.error(`FAIL ${label}: actual=${a} expected=${e}`);
    process.exitCode = 1;
  } else {
    console.log(`OK   ${label}: ${a}`);
  }
}

// ---- 시나리오 1: 실행 시각화용 고정 입력 (insert 1,8,5,3) ----
{
  const h = new PairingHeap<number>((a, b) => a - b);
  h.insert(1);
  h.insert(8);
  h.insert(5);
  h.insert(3);
  assertEq(h.peek(), 1, "sim.peek 초기");
  assertEq(h.debugChildrenOfRoot(), [3, 5, 8], "sim.root(1)의 자식 체인(좌→우)");
  const m1 = h.extractMin();
  assertEq(m1, 1, "sim.extractMin #1");
  assertEq(h.peek(), 3, "sim.extractMin 후 새 root");
  assertEq(h.debugChildrenOfRoot(), [8, 5], "sim.forward+backward 이후 root(3)의 자식");
  const m2 = h.extractMin();
  assertEq(m2, 3, "sim.extractMin #2");
  const m3 = h.extractMin();
  assertEq(m3, 5, "sim.extractMin #3");
  const m4 = h.extractMin();
  assertEq(m4, 8, "sim.extractMin #4");
  assertEq(h.isEmpty(), true, "sim.전부 추출 후 empty");
}

// ---- 시나리오 2: naive single-pass merge 문제 사례 (원형 vs 최종) ----
function naiveMerge<T>(
  node: PairingNode<T> | null,
  link: (a: PairingNode<T> | null, b: PairingNode<T> | null) => PairingNode<T> | null,
): PairingNode<T> | null {
  if (node === null) return null;
  let result: PairingNode<T> | null = node;
  let cur = node.nextSibling;
  result.nextSibling = null;
  while (cur !== null) {
    const next = cur.nextSibling;
    cur.nextSibling = null;
    result = link(result, cur);
    cur = next;
  }
  return result;
}

{
  // link를 재사용하기 위해 PairingHeap 내부 link 로직을 동일하게 복제 검증
  const compare = (a: number, b: number) => a - b;
  const link = (a: PairingNode<number> | null, b: PairingNode<number> | null): PairingNode<number> | null => {
    if (a === null) return b;
    if (b === null) return a;
    if (compare(a.item, b.item) <= 0) {
      b.nextSibling = a.leftChild;
      a.leftChild = b;
      return a;
    } else {
      a.nextSibling = b.leftChild;
      b.leftChild = a;
      return b;
    }
  };

  const depthOf = (n: PairingNode<number> | null): number => (n === null ? 0 : 1 + depthOf(n.leftChild));

  // insert(1,2,3,4,5,6) 오름차순 → root=1, 자식 체인(좌→우) = [6,5,4,3,2]
  const h = new PairingHeap<number>(compare);
  for (const v of [1, 2, 3, 4, 5, 6]) h.insert(v);
  assertEq(h.debugChildrenOfRoot(), [6, 5, 4, 3, 2], "naive입력.root(1) 자식 체인");

  // 자식 체인을 복제해 naive/two-pass 각각 적용해 깊이 비교
  const buildChain = (values: number[]): PairingNode<number> => {
    const nodes = values.map((v) => new PairingNode(v));
    for (let i = 0; i < nodes.length - 1; i++) nodes[i]!.nextSibling = nodes[i + 1]!;
    return nodes[0]!;
  };

  const naiveRoot = naiveMerge(buildChain([6, 5, 4, 3, 2]), link);
  assertEq(naiveRoot?.item, 2, "naive.최종 루트 값");
  assertEq(depthOf(naiveRoot), 5, "naive.체인 깊이(퇴화 링크드리스트)");

  // two-pass는 PairingHeap의 private twoPassMerge와 동일 로직을 인라인 재현해 검증
  const twoPassMerge = (node: PairingNode<number> | null): PairingNode<number> | null => {
    if (node === null || node.nextSibling === null) return node;
    const first = node;
    const second = node.nextSibling;
    const rest = second.nextSibling;
    first.nextSibling = null;
    second.nextSibling = null;
    const paired = link(first, second);
    return link(paired, twoPassMerge(rest));
  };
  const twoPassRoot = twoPassMerge(buildChain([6, 5, 4, 3, 2]));
  assertEq(twoPassRoot?.item, 2, "twopass.최종 루트 값");
  assertEq(depthOf(twoPassRoot), 3, "twopass.체인 깊이(균형 결합)");
}

// ---- 시나리오 3: merge (병합) ----
{
  const h1 = new PairingHeap<number>((a, b) => a - b);
  h1.insert(10);
  h1.insert(5);
  h1.insert(15);
  h1.insert(3);

  const h2 = new PairingHeap<number>((a, b) => a - b);
  h2.insert(1);
  h2.insert(8);

  assertEq(h1.peek(), 3, "merge예제.h1.peek");
  const em = h1.extractMin();
  assertEq(em, 3, "merge예제.h1.extractMin1");
  assertEq(h1.extractMin(), 5, "merge예제.h1.extractMin2");

  const h3 = new PairingHeap<number>((a, b) => a - b);
  h3.insert(10);
  h3.insert(5);
  h3.insert(15);
  h3.insert(3);
  const merged = h3.merge(h2);
  assertEq(merged.size(), 6, "merge예제.merged.size");
  assertEq(merged.extractMin(), 1, "merge예제.merged.extractMin");
}

// ---- 시나리오 4: 엣지 케이스 ----
{
  const empty = new PairingHeap<number>((a, b) => a - b);
  assertEq(empty.peek(), undefined, "edge.빈힙.peek");
  assertEq(empty.extractMin(), undefined, "edge.빈힙.extractMin");
  assertEq(empty.isEmpty(), true, "edge.빈힙.isEmpty");
  assertEq(empty.size(), 0, "edge.빈힙.size");

  const single = new PairingHeap<number>((a, b) => a - b);
  single.insert(42);
  assertEq(single.peek(), 42, "edge.단일원소.peek");
  assertEq(single.extractMin(), 42, "edge.단일원소.extractMin");
  assertEq(single.isEmpty(), true, "edge.단일원소.추출후empty");

  const withDup = new PairingHeap<number>((a, b) => a - b);
  withDup.insert(5);
  withDup.insert(5);
  withDup.insert(1);
  assertEq(withDup.size(), 3, "edge.중복.size");
  assertEq(withDup.extractMin(), 1, "edge.중복.extractMin1");
  assertEq(withDup.extractMin(), 5, "edge.중복.extractMin2(중복값 정상)");
}

// ---- 시나리오 5: 무작위 교차검증 (정렬과 비교) ----
{
  function mulberry32(seed: number) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rand = mulberry32(12345);
  for (let trial = 0; trial < 20; trial++) {
    const n = 1 + Math.floor(rand() * 200);
    const values: number[] = [];
    for (let i = 0; i < n; i++) values.push(Math.floor(rand() * 1000) - 500);

    const heap = new PairingHeap<number>((a, b) => a - b);
    for (const v of values) heap.insert(v);
    assertEq(heap.size(), n, `random[${trial}].size`);

    const out: number[] = [];
    while (!heap.isEmpty()) out.push(heap.extractMin()!);

    const expected = [...values].sort((a, b) => a - b);
    assertEq(out, expected, `random[${trial}].정렬출력 일치(n=${n})`);
  }
  console.log("random cross-check: 20 trials passed");
}

// ---- 시나리오 6: merge와 빈 힙 엣지 ----
{
  const empty = new PairingHeap<number>((a, b) => a - b);
  const nonEmpty = new PairingHeap<number>((a, b) => a - b);
  nonEmpty.insert(7);
  nonEmpty.insert(2);

  const merged1 = nonEmpty.merge(empty);
  assertEq(merged1.size(), 2, "edge.merge(빈힙).size");
  assertEq(merged1.peek(), 2, "edge.merge(빈힙).peek");

  const merged2 = empty.merge(nonEmpty);
  assertEq(merged2.size(), 2, "edge.빈힙.merge(비어있지않은힙).size");
  assertEq(merged2.peek(), 2, "edge.빈힙.merge(비어있지않은힙).peek");

  const bothEmpty = empty.merge(new PairingHeap<number>((a, b) => a - b));
  assertEq(bothEmpty.isEmpty(), true, "edge.빈힙.merge(빈힙).isEmpty");
}

console.log("모든 검증 완료");

// ---- 시나리오 7: 코드 진화 사다리 "개선" 단계 검증 (forward pass만) ----
{
  const compare = (a: number, b: number) => a - b;
  const link = (a: PairingNode<number> | null, b: PairingNode<number> | null): PairingNode<number> | null => {
    if (a === null) return b;
    if (b === null) return a;
    if (compare(a.item, b.item) <= 0) {
      b.nextSibling = a.leftChild;
      a.leftChild = b;
      return a;
    } else {
      a.nextSibling = b.leftChild;
      b.leftChild = a;
      return b;
    }
  };

  function forwardPass(node: PairingNode<number> | null): PairingNode<number>[] {
    const pairedRoots: PairingNode<number>[] = [];
    let cur = node;
    while (cur !== null) {
      const first = cur;
      const second: PairingNode<number> | null = cur.nextSibling;
      if (second === null) {
        first.nextSibling = null;
        pairedRoots.push(first);
        cur = null;
      } else {
        const rest = second.nextSibling;
        first.nextSibling = null;
        second.nextSibling = null;
        pairedRoots.push(link(first, second)!);
        cur = rest;
      }
    }
    return pairedRoots;
  }

  const buildChain = (values: number[]): PairingNode<number> => {
    const nodes = values.map((v) => new PairingNode(v));
    for (let i = 0; i < nodes.length - 1; i++) nodes[i]!.nextSibling = nodes[i + 1]!;
    return nodes[0]!;
  };

  const pairedRoots = forwardPass(buildChain([6, 5, 4, 3, 2]));
  assertEq(
    pairedRoots.map((n) => n.item),
    [5, 3, 2],
    "개선단계.forwardPass([6,5,4,3,2]) 결과 루트값",
  );
  assertEq(pairedRoots.length, 3, "개선단계.forwardPass 개수(5개 → 3개)");
}
