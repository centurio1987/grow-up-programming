// E3 자기검증용 스크래치 — 가이드 본문 코드를 그대로 옮겨 실행한다.

class BinomialNode<T> {
  item: T;
  degree: number;
  children: BinomialNode<T>[]; // 차수 내림차순 (맨 앞이 가장 최근에 결합된 자식)
  parent: BinomialNode<T> | null;

  constructor(item: T) {
    this.item = item;
    this.degree = 0;
    this.children = [];
    this.parent = null;
  }
}

class BinomialHeap<T> {
  private roots: BinomialNode<T>[]; // 차수 오름차순
  private _size: number;
  private compare: (a: T, b: T) => number;

  constructor(compare: (a: T, b: T) => number) {
    this.roots = [];
    this._size = 0;
    this.compare = compare;
  }

  private linkTrees(t1: BinomialNode<T>, t2: BinomialNode<T>): BinomialNode<T> {
    if (this.compare(t1.item, t2.item) <= 0) {
      t2.parent = t1;
      t1.children.unshift(t2);
      t1.degree += 1;
      return t1;
    } else {
      t1.parent = t2;
      t2.children.unshift(t1);
      t2.degree += 1;
      return t2;
    }
  }

  // 두 "차수 오름차순" 루트 리스트를 이진수 덧셈처럼 병합한다.
  private mergeRoots(
    a: BinomialNode<T>[],
    b: BinomialNode<T>[],
  ): BinomialNode<T>[] {
    const result: BinomialNode<T>[] = [];
    let i = 0;
    let j = 0;
    let carry: BinomialNode<T> | null = null;

    while (i < a.length || j < b.length || carry !== null) {
      const currentDegree =
        carry !== null
          ? carry.degree
          : Math.min(
              i < a.length ? a[i]!.degree : Infinity,
              j < b.length ? b[j]!.degree : Infinity,
            );

      const candidates: BinomialNode<T>[] = [];
      if (i < a.length && a[i]!.degree === currentDegree) candidates.push(a[i++]!);
      if (j < b.length && b[j]!.degree === currentDegree) candidates.push(b[j++]!);
      if (carry !== null && carry.degree === currentDegree) {
        candidates.push(carry);
        carry = null;
      }

      if (candidates.length === 1) {
        result.push(candidates[0]!);
      } else if (candidates.length === 2) {
        carry = this.linkTrees(candidates[0]!, candidates[1]!);
      } else if (candidates.length === 3) {
        result.push(candidates[0]!);
        carry = this.linkTrees(candidates[1]!, candidates[2]!);
      }
    }

    return result;
  }

  insert(item: T): void {
    const node = new BinomialNode(item);
    this.roots = this.mergeRoots(this.roots, [node]);
    this._size += 1;
  }

  peek(): T | undefined {
    if (this.roots.length === 0) return undefined;
    let min = this.roots[0]!;
    for (const r of this.roots) {
      if (this.compare(r.item, min.item) < 0) min = r;
    }
    return min.item;
  }

  extractMin(): T | undefined {
    if (this.roots.length === 0) return undefined;

    let minIndex = 0;
    for (let k = 1; k < this.roots.length; k++) {
      if (this.compare(this.roots[k]!.item, this.roots[minIndex]!.item) < 0) {
        minIndex = k;
      }
    }
    const minRoot = this.roots[minIndex]!;
    this.roots.splice(minIndex, 1);

    // 자식은 차수 내림차순 저장 → 역순으로 뒤집으면 오름차순(새 루트 리스트 조건)
    const childRoots = [...minRoot.children].reverse();
    for (const c of childRoots) c.parent = null;

    this.roots = this.mergeRoots(this.roots, childRoots);
    this._size -= 1;
    return minRoot.item;
  }

  merge(other: BinomialHeap<T>): BinomialHeap<T> {
    const merged = new BinomialHeap<T>(this.compare);
    merged.roots = this.mergeRoots(this.roots, other.roots);
    merged._size = this._size + other._size;
    return merged;
  }

  size(): number {
    return this._size;
  }

  isEmpty(): boolean {
    return this._size === 0;
  }

  // 검증 헬퍼: 루트 차수 목록 문자열
  debugDegrees(): number[] {
    return this.roots.map((r) => r.degree);
  }
}

// ---------------- 실측 트레이스 ----------------

function log(label: string, value: unknown) {
  console.log(label, JSON.stringify(value));
}

console.log("=== 대표 트레이스: insert(10), insert(20), insert(5) ===");
const heap = new BinomialHeap<number>((a, b) => a - b);
heap.insert(10);
log("insert(10) 후 degrees", heap.debugDegrees());
heap.insert(20);
log("insert(20) 후 degrees", heap.debugDegrees());
heap.insert(5);
log("insert(5) 후 degrees", heap.debugDegrees());
log("peek()", heap.peek());
log("extractMin()", heap.extractMin());
log("extractMin 후 degrees", heap.debugDegrees());
log("size()", heap.size());

console.log("\n=== merge 예시 (문제 예시와 동일) ===");
const h1 = new BinomialHeap<number>((a, b) => a - b);
h1.insert(10);
h1.insert(20);
h1.insert(5);
log("h1.extractMin() (5 소비 전)", h1.peek());
h1.extractMin(); // 5 제거, [10,20] 남음
log("h1 extractMin 후 degrees", h1.debugDegrees());

const h2 = new BinomialHeap<number>((a, b) => a - b);
h2.insert(3);
h2.insert(7);

const merged = h1.merge(h2);
log("merged degrees", merged.debugDegrees());
log("merged.extractMin() x4", [
  merged.extractMin(),
  merged.extractMin(),
  merged.extractMin(),
  merged.extractMin(),
]);
log("merged.extractMin() (빈 힙)", merged.extractMin());

console.log("\n=== 엣지 케이스 ===");
const empty = new BinomialHeap<number>((a, b) => a - b);
log("빈 힙 peek()", empty.peek());
log("빈 힙 extractMin()", empty.extractMin());
log("빈 힙 isEmpty()", empty.isEmpty());

const single = new BinomialHeap<number>((a, b) => a - b);
single.insert(42);
log("단일 원소 peek()", single.peek());
log("단일 원소 extractMin()", single.extractMin());
log("단일 원소 추출 후 isEmpty()", single.isEmpty());

console.log("\n=== n=13 이진수 분해 검증 (degrees는 3,2,0이어야 함) ===");
const thirteen = new BinomialHeap<number>((a, b) => a - b);
for (let i = 0; i < 13; i++) thirteen.insert(i);
log("n=13 삽입 후 degrees (오름차순)", thirteen.debugDegrees());
log("n=13 size()", thirteen.size());

console.log("\n=== B_k 구조 검증: n=8 삽입 후 단일 B3 트리, 각 깊이 노드 수 C(3,i) ===");
const eight = new BinomialHeap<number>((a, b) => a - b);
for (let i = 1; i <= 8; i++) eight.insert(i);
log("n=8 degrees", eight.debugDegrees());

console.log("\n=== 무작위 교차검증: extractMin 결과가 정렬 순서와 일치 ===");
function randomTest(seed: number) {
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s % 1000;
  };
  const values: number[] = [];
  const rh = new BinomialHeap<number>((a, b) => a - b);
  const n = 50;
  for (let i = 0; i < n; i++) {
    const v = rand();
    values.push(v);
    rh.insert(v);
  }
  const out: number[] = [];
  while (!rh.isEmpty()) {
    out.push(rh.extractMin()!);
  }
  const expected = [...values].sort((a, b) => a - b);
  const ok = JSON.stringify(out) === JSON.stringify(expected);
  console.log(`seed=${seed} n=${n} 정렬 일치:`, ok);
  if (!ok) {
    console.log("expected", expected);
    console.log("actual", out);
  }
}
randomTest(1);
randomTest(2);
randomTest(42);

console.log("\n=== merge 후 무작위 교차검증 ===");
function randomMergeTest(seed: number) {
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s % 1000;
  };
  const va: number[] = [];
  const vb: number[] = [];
  const ha = new BinomialHeap<number>((a, b) => a - b);
  const hb = new BinomialHeap<number>((a, b) => a - b);
  for (let i = 0; i < 30; i++) {
    const v = rand();
    va.push(v);
    ha.insert(v);
  }
  for (let i = 0; i < 25; i++) {
    const v = rand();
    vb.push(v);
    hb.insert(v);
  }
  const m = ha.merge(hb);
  const out: number[] = [];
  while (!m.isEmpty()) out.push(m.extractMin()!);
  const expected = [...va, ...vb].sort((a, b) => a - b);
  const ok = JSON.stringify(out) === JSON.stringify(expected);
  console.log(`merge seed=${seed} 정렬 일치:`, ok, "size:", out.length);
}
randomMergeTest(7);
randomMergeTest(99);

console.log("\n=== 함정 예시: 3-way carry (n=13 + n=13 병합) ===");
const t1 = new BinomialHeap<number>((a, b) => a - b);
for (let i = 0; i < 13; i++) t1.insert(i);
const t2 = new BinomialHeap<number>((a, b) => a - b);
for (let i = 100; i < 113; i++) t2.insert(i);
log("t1 degrees", t1.debugDegrees());
log("t2 degrees", t2.debugDegrees());
const t3 = t1.merge(t2);
log("병합 후 degrees (3-way carry 발생 지점 포함)", t3.debugDegrees());
log("병합 후 size", t3.size());
// 검증: 26개 전부 정렬 추출되는지
const outAll: number[] = [];
while (!t3.isEmpty()) outAll.push(t3.extractMin()!);
log("정렬 추출 결과 길이", outAll.length);
log("정렬 여부", JSON.stringify(outAll) === JSON.stringify([...outAll].sort((a,b)=>a-b)));

console.log("\n=== B3 트리 구조 상세 (n=8, 값 1..8) ===");
function describeTree(node: any, depth = 0): string {
  const indent = "  ".repeat(depth);
  let s = `${indent}item=${node.item} degree=${node.degree}\n`;
  for (const c of node.children) s += describeTree(c, depth + 1);
  return s;
}
// access private roots via any-cast for debug only
console.log(describeTree((eight as any).roots[0]));

console.log("\n=== 함정 데모: 3-way carry를 빼먹은 버그 버전 ===");
class BuggyHeap<T> {
  roots: BinomialNode<T>[] = [];
  _size = 0;
  compare: (a: T, b: T) => number;
  constructor(compare: (a: T, b: T) => number) { this.compare = compare; }

  private linkTrees(t1: BinomialNode<T>, t2: BinomialNode<T>): BinomialNode<T> {
    if (this.compare(t1.item, t2.item) <= 0) {
      t1.children.unshift(t2); t1.degree += 1; return t1;
    } else {
      t2.children.unshift(t1); t2.degree += 1; return t2;
    }
  }

  // 버그: candidates.length===3 분기를 빼먹었다 (2개짜리로만 처리)
  private mergeRootsBuggy(a: BinomialNode<T>[], b: BinomialNode<T>[]): BinomialNode<T>[] {
    const result: BinomialNode<T>[] = [];
    let i = 0, j = 0;
    let carry: BinomialNode<T> | null = null;
    while (i < a.length || j < b.length || carry !== null) {
      const currentDegree = carry !== null ? carry.degree : Math.min(
        i < a.length ? a[i]!.degree : Infinity,
        j < b.length ? b[j]!.degree : Infinity,
      );
      const candidates: BinomialNode<T>[] = [];
      if (i < a.length && a[i]!.degree === currentDegree) candidates.push(a[i++]!);
      if (j < b.length && b[j]!.degree === currentDegree) candidates.push(b[j++]!);
      if (carry !== null && carry.degree === currentDegree) { candidates.push(carry); carry = null; }

      if (candidates.length === 1) {
        result.push(candidates[0]!);
      } else if (candidates.length >= 2) {
        // 버그: 3개일 때도 그냥 처음 두 개만 합치고 세 번째를 버린다
        carry = this.linkTrees(candidates[0]!, candidates[1]!);
      }
    }
    return result;
  }

  insertMany(values: T[]) {
    for (const v of values) {
      const node = new BinomialNode(v);
      this.roots = this.mergeRootsBuggy(this.roots, [node]);
      this._size += 1;
    }
  }

  mergeBuggy(other: BuggyHeap<T>): BuggyHeap<T> {
    const m = new BuggyHeap<T>(this.compare);
    m.roots = this.mergeRootsBuggy(this.roots, other.roots);
    m._size = this._size + other._size;
    return m;
  }

  countNodes(node: BinomialNode<T>): number {
    return 1 + node.children.reduce((acc, c) => acc + this.countNodes(c), 0);
  }
  totalReachable(): number {
    return this.roots.reduce((acc, r) => acc + this.countNodes(r), 0);
  }
}

const bt1 = new BuggyHeap<number>((a, b) => a - b);
bt1.insertMany(Array.from({ length: 13 }, (_, i) => i));
const bt2 = new BuggyHeap<number>((a, b) => a - b);
bt2.insertMany(Array.from({ length: 13 }, (_, i) => i + 100));
const bt3 = bt1.mergeBuggy(bt2);
log("버그 버전 병합 후 _size (카운터)", bt3._size);
log("버그 버전 실제 루트에 남은 노드 수(트리 순회)", bt3.totalReachable());
log("버그 버전 degrees", bt3.roots.map((r) => r.degree));

console.log("\n=== n=13 트리 구조 상세 (참고용) ===");
for (const r of (thirteen as any).roots) {
  console.log(describeTree(r));
}
