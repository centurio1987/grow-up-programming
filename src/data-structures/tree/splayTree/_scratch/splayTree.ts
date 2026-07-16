/**
 * SplayTree (스플레이 트리) — 가이드 본문 코드의 실행 가능 사본.
 * splayTree-guide.new.mdx의 "아이디어를 코드로 옮기기" 절 코드를 그대로 옮겨
 * 본문 수치·트레이스·시뮬 프레임을 실측 검증하기 위한 스크래치 파일이다.
 */

class SplayNode<T> {
  value: T;
  left: SplayNode<T> | undefined = undefined;
  right: SplayNode<T> | undefined = undefined;
  parent: SplayNode<T> | undefined = undefined;

  constructor(value: T) {
    this.value = value;
  }
}

export class SplayTree<T> {
  private root: SplayNode<T> | undefined = undefined;
  private _size = 0;
  private comparator: (a: T, b: T) => number;

  constructor(comparator?: (a: T, b: T) => number) {
    this.comparator = comparator ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  private isLeftChild(x: SplayNode<T>): boolean {
    return x.parent !== undefined && x.parent.left === x;
  }

  private rotate(x: SplayNode<T>): void {
    const p = x.parent!;
    const g = p.parent;

    if (this.isLeftChild(x)) {
      p.left = x.right;
      if (x.right !== undefined) x.right.parent = p;
      x.right = p;
    } else {
      p.right = x.left;
      if (x.left !== undefined) x.left.parent = p;
      x.left = p;
    }
    p.parent = x;
    x.parent = g;

    if (g !== undefined) {
      if (g.left === p) g.left = x;
      else g.right = x;
    }
  }

  private splay(x: SplayNode<T>): void {
    while (x.parent !== undefined) {
      const p = x.parent;
      const g = p.parent;

      if (g === undefined) {
        this.rotate(x); // Zig
      } else if (this.isLeftChild(x) === this.isLeftChild(p)) {
        this.rotate(p); // Zig-Zig: 부모 먼저
        this.rotate(x);
      } else {
        this.rotate(x); // Zig-Zag: x를 두 번
        this.rotate(x);
      }
    }
    this.root = x;
  }

  insert(value: T): void {
    if (this.root === undefined) {
      this.root = new SplayNode(value);
      this._size = 1;
      return;
    }
    let node: SplayNode<T> | undefined = this.root;
    let parent: SplayNode<T> = this.root;
    let cmp = 0;
    while (node !== undefined) {
      parent = node;
      cmp = this.comparator(value, node.value);
      if (cmp === 0) {
        this.splay(node); // 중복은 무시하되, set 의미론상 스플레이는 해 준다
        return;
      }
      node = cmp < 0 ? node.left : node.right;
    }
    const created = new SplayNode(value);
    created.parent = parent;
    if (cmp < 0) parent.left = created;
    else parent.right = created;
    this._size++;
    this.splay(created);
  }

  has(value: T): boolean {
    let node = this.root;
    let last: SplayNode<T> | undefined;
    while (node !== undefined) {
      last = node;
      const cmp = this.comparator(value, node.value);
      if (cmp === 0) {
        this.splay(node);
        return true;
      }
      node = cmp < 0 ? node.left : node.right;
    }
    if (last !== undefined) this.splay(last);
    return false;
  }

  delete(value: T): boolean {
    if (!this.has(value)) return false; // has()가 이미 대상(또는 마지막 노드)을 루트로 스플레이

    const root = this.root!;
    const L = root.left;
    const R = root.right;
    if (L !== undefined) L.parent = undefined;
    if (R !== undefined) R.parent = undefined;

    if (L === undefined) {
      this.root = R;
    } else {
      let maxNode = L;
      while (maxNode.right !== undefined) maxNode = maxNode.right;
      this.splay(maxNode); // L 내부에서만 스플레이 (L이 이미 독립 트리)
      maxNode.right = R;
      if (R !== undefined) R.parent = maxNode;
      this.root = maxNode;
    }
    this._size--;
    return true;
  }

  min(): T | undefined {
    if (this.root === undefined) return undefined;
    let node = this.root;
    while (node.left !== undefined) node = node.left;
    this.splay(node);
    return node.value;
  }

  max(): T | undefined {
    if (this.root === undefined) return undefined;
    let node = this.root;
    while (node.right !== undefined) node = node.right;
    this.splay(node);
    return node.value;
  }

  inOrder(): T[] {
    const result: T[] = [];
    const walk = (node: SplayNode<T> | undefined): void => {
      if (node === undefined) return;
      walk(node.left);
      result.push(node.value);
      walk(node.right);
    };
    walk(this.root);
    return result;
  }

  size(): number {
    return this._size;
  }

  // ── 아래는 실측/디버깅 전용 헬퍼 (가이드 본문 코드에는 포함하지 않음) ──
  debugShape(): string {
    const describe = (node: SplayNode<T> | undefined): string => {
      if (node === undefined) return "_";
      return `${node.value}(${describe(node.left)},${describe(node.right)})`;
    };
    return describe(this.root);
  }

  /** heap-index 배열(0 = 빈 슬롯)로 트리를 직렬화. 실측 검증용. */
  toHeapArray(): number[] {
    if (this.root === undefined) return [];
    const arr: (T | 0)[] = [];
    const fill = (node: SplayNode<T> | undefined, idx: number): void => {
      if (node === undefined) return;
      while (arr.length <= idx) arr.push(0);
      arr[idx] = node.value;
      fill(node.left, 2 * idx + 1);
      fill(node.right, 2 * idx + 2);
    };
    fill(this.root, 0);
    return arr as number[];
  }
}

// ─────────────────────────── 실측 스크립트 ───────────────────────────

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.error(`✗ ${label}: expected ${e}, got ${a}`);
    process.exitCode = 1;
  } else {
    console.log(`✓ ${label}: ${a}`);
  }
}

console.log("=== 대표 시나리오: insert(10,5,15,3,7) 순서대로 ===");
{
  const t = new SplayTree<number>();
  for (const v of [10, 5, 15, 3, 7]) {
    t.insert(v);
    console.log(`insert(${v}) 후 shape=${t.debugShape()} heap=${JSON.stringify(t.toHeapArray())}`);
  }
  assertEqual(t.inOrder(), [3, 5, 7, 10, 15], "5개 삽입 후 inOrder");
  assertEqual(t.size(), 5, "5개 삽입 후 size");
}

console.log("\n=== has(3) 트레이스 (5개 삽입 직후) ===");
{
  const t = new SplayTree<number>();
  for (const v of [10, 5, 15, 3, 7]) t.insert(v);
  console.log(`has(3) 전 shape=${t.debugShape()}`);
  const found = t.has(3);
  console.log(`has(3) 후 shape=${t.debugShape()} heap=${JSON.stringify(t.toHeapArray())}`);
  assertEqual(found, true, "has(3) 반환값");
}

console.log("\n=== Zig-Zig 전용 데모: insert(10,20,30,5,15,25,35), has(5) ===");
{
  const t = new SplayTree<number>();
  for (const v of [10, 20, 30, 5, 15, 25, 35]) {
    t.insert(v);
    console.log(`insert(${v}) 후 shape=${t.debugShape()}`);
  }
  assertEqual(t.inOrder(), [5, 10, 15, 20, 25, 30, 35], "7개 삽입 후 inOrder");
}

console.log("\n=== 의도적 Zig-Zig 데모 설계: 왼쪽으로 치우친 사슬 만들고 최솟값 접근 ===");
{
  const t = new SplayTree<number>();
  for (const v of [50, 40, 30, 20, 10]) {
    t.insert(v);
    console.log(`insert(${v}) 후 shape=${t.debugShape()}`);
  }
  console.log(`heap=${JSON.stringify(t.toHeapArray())}`);
}

console.log("\n=== delete 시나리오 ===");
{
  const t = new SplayTree<number>();
  for (const v of [10, 5, 15, 3, 7]) t.insert(v);
  console.log(`delete 전 shape=${t.debugShape()}`);
  const ok = t.delete(5);
  console.log(`delete(5) 후 shape=${t.debugShape()} inOrder=${JSON.stringify(t.inOrder())}`);
  assertEqual(ok, true, "delete(5) 반환값");
  assertEqual(t.size(), 4, "delete 후 size");
  assertEqual(t.inOrder(), [3, 7, 10, 15], "delete 후 inOrder");
}

console.log("\n=== 엣지: 빈 트리 ===");
{
  const t = new SplayTree<number>();
  assertEqual(t.has(1), false, "빈 트리 has");
  assertEqual(t.delete(1), false, "빈 트리 delete");
  assertEqual(t.min(), undefined, "빈 트리 min");
  assertEqual(t.max(), undefined, "빈 트리 max");
  assertEqual(t.inOrder(), [], "빈 트리 inOrder");
  assertEqual(t.size(), 0, "빈 트리 size");
}

console.log("\n=== 엣지: 크기 1 ===");
{
  const t = new SplayTree<number>();
  t.insert(42);
  assertEqual(t.has(42), true, "size1 has hit");
  assertEqual(t.debugShape(), "42(_,_)", "size1 shape");
  assertEqual(t.delete(42), true, "size1 delete");
  assertEqual(t.size(), 0, "size1 delete 후 size");
  assertEqual(t.root === undefined, true, "size1 delete 후 root undefined는 has로 간접 확인");
  assertEqual(t.has(42), false, "size1 delete 후 has");
}

console.log("\n=== 엣지: 중복 삽입 ===");
{
  const t = new SplayTree<number>();
  t.insert(1);
  t.insert(1);
  t.insert(1);
  assertEqual(t.size(), 1, "중복 삽입 후 size");
  assertEqual(t.inOrder(), [1], "중복 삽입 후 inOrder");
}

console.log("\n=== has() 실패 시 마지막 방문 노드 스플레이 확인 ===");
{
  const t = new SplayTree<number>();
  for (const v of [10, 5, 15, 3, 7]) t.insert(v);
  const before = t.debugShape();
  const found = t.has(4); // 존재하지 않음. 3까지 내려가다 멈춤
  console.log(`has(4) 전 shape=${before}`);
  console.log(`has(4) 후 shape=${t.debugShape()}`);
  assertEqual(found, false, "has(4) 반환값");
}

console.log("\n=== 무작위 교차검증 (100회, n=200) ===");
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
  let mismatches = 0;
  for (let trial = 0; trial < 100; trial++) {
    const t = new SplayTree<number>();
    const ref = new Set<number>();
    for (let i = 0; i < 200; i++) {
      const op = rand();
      const v = Math.floor(rand() * 50);
      if (op < 0.5) {
        t.insert(v);
        ref.add(v);
      } else if (op < 0.8) {
        const expected = ref.has(v);
        const actual = t.has(v);
        if (expected !== actual) {
          console.error(`mismatch trial=${trial} i=${i} has(${v}) expected=${expected} actual=${actual}`);
          mismatches++;
        }
      } else {
        const expected = ref.delete(v);
        const actual = t.delete(v);
        if (expected !== actual) {
          console.error(`mismatch trial=${trial} i=${i} delete(${v}) expected=${expected} actual=${actual}`);
          mismatches++;
        }
      }
    }
    const expectedSorted = [...ref].sort((a, b) => a - b);
    const actualSorted = t.inOrder();
    assertEqual(actualSorted, expectedSorted, `trial ${trial} 최종 inOrder`);
    assertEqual(t.size(), ref.size, `trial ${trial} 최종 size`);
  }
  assertEqual(mismatches, 0, "무작위 교차검증 불일치 수");
}

console.log("\n모든 실측 완료.");

// ─────────────────────── Zig-Zig 데모용 스텝 트레이스 ───────────────────────
console.log("\n=== 시뮬레이션용 스텝 트레이스: insert(10,20,30,5,15,25,35) 후 has(5) ===");
{
  // 위 SplayTree와 동일 로직이지만 rotate마다 상태를 출력하는 계측 버전.
  class DNode {
    value: number;
    left: DNode | undefined = undefined;
    right: DNode | undefined = undefined;
    parent: DNode | undefined = undefined;
    constructor(v: number) { this.value = v; }
  }
  let root: DNode | undefined;
  const isLeftChild = (x: DNode) => x.parent !== undefined && x.parent.left === x;
  const shapeOf = (n: DNode | undefined): string =>
    n === undefined ? "_" : `${n.value}(${shapeOf(n.left)},${shapeOf(n.right)})`;
  const heapOf = (): number[] => {
    if (root === undefined) return [];
    const arr: number[] = [];
    const fill = (n: DNode | undefined, idx: number) => {
      if (n === undefined) return;
      while (arr.length <= idx) arr.push(0);
      arr[idx] = n.value;
      fill(n.left, 2 * idx + 1);
      fill(n.right, 2 * idx + 2);
    };
    fill(root, 0);
    return arr;
  };
  let stepNo = 0;
  const rotate = (x: DNode) => {
    const p = x.parent!;
    const g = p.parent;
    if (isLeftChild(x)) {
      p.left = x.right;
      if (x.right) x.right.parent = p;
      x.right = p;
    } else {
      p.right = x.left;
      if (x.left) x.left.parent = p;
      x.left = p;
    }
    p.parent = x;
    x.parent = g;
    if (g) {
      if (g.left === p) g.left = x; else g.right = x;
    }
    if (root === p) root = x;
    stepNo++;
    console.log(`  rotate(${x.value}) 적용 → shape=${shapeOf(root)} heap=${JSON.stringify(heapOf())}`);
  };
  const splay = (x: DNode) => {
    while (x.parent !== undefined) {
      const p = x.parent;
      const g = p.parent;
      if (g === undefined) {
        console.log(` Zig: rotate(${x.value})`);
        rotate(x);
      } else if (isLeftChild(x) === isLeftChild(p)) {
        console.log(` Zig-Zig: rotate(${p.value}) 먼저, then rotate(${x.value})`);
        rotate(p);
        rotate(x);
      } else {
        console.log(` Zig-Zag: rotate(${x.value}) 두 번`);
        rotate(x);
        rotate(x);
      }
    }
    root = x;
  };
  const insert = (v: number) => {
    if (root === undefined) { root = new DNode(v); return; }
    let node: DNode | undefined = root;
    let parent = root;
    let cmp = 0;
    while (node !== undefined) {
      parent = node;
      cmp = v < node.value ? -1 : v > node.value ? 1 : 0;
      if (cmp === 0) { splay(node); return; }
      node = cmp < 0 ? node.left : node.right;
    }
    const created = new DNode(v);
    created.parent = parent;
    if (cmp < 0) parent.left = created; else parent.right = created;
    splay(created);
  };
  const has = (v: number): boolean => {
    let node = root;
    let last: DNode | undefined;
    while (node !== undefined) {
      last = node;
      const cmp = v < node.value ? -1 : v > node.value ? 1 : 0;
      if (cmp === 0) { splay(node); return true; }
      node = cmp < 0 ? node.left : node.right;
    }
    if (last !== undefined) splay(last);
    return false;
  };

  for (const v of [10, 20, 30, 5, 15, 25, 35]) insert(v);
  console.log(`빌드 완료: shape=${shapeOf(root)} heap=${JSON.stringify(heapOf())}`);
  console.log("has(5) 시작 →");
  const found = has(5);
  console.log(`has(5) 최종: found=${found} shape=${shapeOf(root)} heap=${JSON.stringify(heapOf())}`);
}

// ─────────────────────── delete(5) 세부 트레이스 (스펙 절 예시용) ───────────────────────
console.log("\n=== delete(5) 세부 트레이스: insert(10,5,15,3,7) 후 delete(5) ===");
{
  const t = new SplayTree<number>();
  for (const v of [10, 5, 15, 3, 7]) t.insert(v);
  console.log(`빌드 후: shape=${t.debugShape()}`);
  // has(5)만 먼저 호출해 "splay 후, 제거 전" 상태를 관찰
  const t2 = new SplayTree<number>();
  for (const v of [10, 5, 15, 3, 7]) t2.insert(v);
  t2.has(5);
  console.log(`splay(5) 직후(제거 전): shape=${t2.debugShape()}`);
  const ok = t.delete(5);
  console.log(`delete(5) 최종: ok=${ok} shape=${t.debugShape()} inOrder=${JSON.stringify(t.inOrder())}`);
}

// ─────────────────────── 코드 진화 사다리 검증: naive 단일 회전 vs zig-zig ───────────────────────
console.log("\n=== naive(단일 회전 반복) vs zig-zig 비교: 사슬(comb) 트리에서 반복 접근 ===");
{
  class N {
    value: number;
    left: N | undefined; right: N | undefined; parent: N | undefined;
    constructor(v: number) { this.value = v; }
  }
  const isLeftChild = (x: N) => x.parent !== undefined && x.parent.left === x;
  const height = (n: N | undefined): number => (n === undefined ? 0 : 1 + Math.max(height(n.left), height(n.right)));

  function rotate(x: N) {
    const p = x.parent!;
    const g = p.parent;
    if (isLeftChild(x)) {
      p.left = x.right; if (x.right) x.right.parent = p; x.right = p;
    } else {
      p.right = x.left; if (x.left) x.left.parent = p; x.left = p;
    }
    p.parent = x; x.parent = g;
    if (g) { if (g.left === p) g.left = x; else g.right = x; }
  }

  // 사슬(comb) 생성: 1 - 2 - 3 - ... - n, 모두 오른쪽 자식 (splay 없이 그냥 BST 삽입한 결과를 흉내)
  function buildChain(n: number): { root: N; nodes: N[] } {
    const nodes: N[] = [];
    let root: N | undefined;
    let cur: N | undefined;
    for (let v = 1; v <= n; v++) {
      const node = new N(v);
      nodes.push(node);
      if (root === undefined) { root = node; cur = node; }
      else { cur!.right = node; node.parent = cur; cur = node; }
    }
    return { root: root!, nodes };
  }

  function naiveSplay(x: N, setRoot: (n: N) => void, rotateCount: { n: number }) {
    while (x.parent !== undefined) {
      rotate(x); // zig-zig 구분 없이 무조건 단일 회전
      rotateCount.n++;
    }
    setRoot(x);
  }
  function properSplay(x: N, setRoot: (n: N) => void, rotateCount: { n: number }) {
    while (x.parent !== undefined) {
      const p = x.parent;
      const g = p.parent;
      if (g === undefined) { rotate(x); rotateCount.n++; }
      else if (isLeftChild(x) === isLeftChild(p)) { rotate(p); rotate(x); rotateCount.n += 2; }
      else { rotate(x); rotate(x); rotateCount.n += 2; }
    }
    setRoot(x);
  }

  const n = 8;
  console.log(`n=${n}, 사슬(comb) 트리 1-2-...-${n} 생성 후, 최솟값(1)과 최댓값(${n})을 번갈아 20회 접근`);

  for (const [label, splayFn] of [["naive(단일 회전)", naiveSplay], ["proper(zig-zig)", properSplay]] as const) {
    const { root: initRoot, nodes } = buildChain(n);
    let root: N = initRoot;
    const setRoot = (r: N) => { root = r; };
    const rc = { n: 0 };
    const heights: number[] = [height(root)];
    const perRoundRotations: number[] = [];
    for (let round = 0; round < 20; round++) {
      const target = round % 2 === 0 ? nodes[0] : nodes[n - 1]; // 1과 n을 번갈아
      const before = rc.n;
      splayFn(target, setRoot, rc);
      perRoundRotations.push(rc.n - before);
      heights.push(height(root));
    }
    console.log(`${label}: 총 회전수=${rc.n}, 라운드별 회전수=${JSON.stringify(perRoundRotations)}`);
    console.log(`${label}: 라운드별 높이=${JSON.stringify(heights)}`);
  }
}

// ─────────────────────── 작은 사슬(n=7)에서 naive vs zig-zig 최종 모양 비교 ───────────────────────
console.log("\n=== n=7 사슬에서 has(7)(최심 노드) 1회 접근 후 모양 비교 ===");
{
  class N {
    value: number;
    left: N | undefined; right: N | undefined; parent: N | undefined;
    constructor(v: number) { this.value = v; }
  }
  const isLeftChild = (x: N) => x.parent !== undefined && x.parent.left === x;
  const shapeOf = (n: N | undefined): string => (n === undefined ? "_" : `${n.value}(${shapeOf(n.left)},${shapeOf(n.right)})`);
  function rotate(x: N) {
    const p = x.parent!; const g = p.parent;
    if (isLeftChild(x)) { p.left = x.right; if (x.right) x.right.parent = p; x.right = p; }
    else { p.right = x.left; if (x.left) x.left.parent = p; x.left = p; }
    p.parent = x; x.parent = g;
    if (g) { if (g.left === p) g.left = x; else g.right = x; }
  }
  function buildChain(n: number): { root: N; nodes: N[] } {
    const nodes: N[] = []; let root: N | undefined; let cur: N | undefined;
    for (let v = 1; v <= n; v++) {
      const node = new N(v); nodes.push(node);
      if (root === undefined) { root = node; cur = node; }
      else { cur!.right = node; node.parent = cur; cur = node; }
    }
    return { root: root!, nodes };
  }
  const n = 7;
  {
    const { root: r0, nodes } = buildChain(n);
    console.log(`초기 사슬: ${shapeOf(r0)}`);
    let root = r0;
    let x = nodes[n - 1];
    while (x.parent !== undefined) rotate(x); // naive
    console.log(`naive(단일회전) has(${n}) 후: ${shapeOf(x)}`);
  }
  {
    const { root: r0, nodes } = buildChain(n);
    let x = nodes[n - 1];
    while (x.parent !== undefined) {
      const p = x.parent!; const g = p.parent;
      if (g === undefined) rotate(x);
      else if (isLeftChild(x) === isLeftChild(p)) { rotate(p); rotate(x); }
      else { rotate(x); rotate(x); }
    }
    console.log(`proper(zig-zig) has(${n}) 후: ${shapeOf(x)}`);
  }
}

console.log("\n=== delete(존재하지 않는 값) 도 마지막 방문 노드를 스플레이하는지 확인 ===");
{
  const t = new SplayTree<number>();
  for (const v of [10, 5, 15, 3, 7]) t.insert(v);
  console.log(`delete(999) 전 shape=${t.debugShape()}`);
  const ok = t.delete(999);
  console.log(`delete(999) 후 shape=${t.debugShape()} ok=${ok} size=${t.size()}`);
}

console.log("\n=== min()/max() 확인 ===");
{
  const t = new SplayTree<number>();
  for (const v of [10, 5, 15, 3, 7]) t.insert(v);
  console.log(`빌드 후 shape=${t.debugShape()}`);
  const mn = t.min();
  console.log(`min()=${mn} 후 shape=${t.debugShape()}`);
  const mx = t.max();
  console.log(`max()=${mx} 후 shape=${t.debugShape()}`);
}
