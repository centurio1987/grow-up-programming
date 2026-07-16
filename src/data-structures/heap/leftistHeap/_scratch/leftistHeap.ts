// E3 자기검증용 스크래치 — 가이드 본문 코드를 그대로 추출한 것.
// 실행: bun src/data-structures/heap/leftistHeap/_scratch/leftistHeap.ts

class LeftistNode<T> {
  item: T;
  rank: number;
  left: LeftistNode<T> | null;
  right: LeftistNode<T> | null;

  constructor(item: T) {
    this.item = item;
    this.rank = 1;
    this.left = null;
    this.right = null;
  }
}

function rank<T>(node: LeftistNode<T> | null): number {
  return node === null ? 0 : node.rank;
}

function mergeNodes<T>(
  a: LeftistNode<T> | null,
  b: LeftistNode<T> | null,
  compare: (a: T, b: T) => number,
): LeftistNode<T> | null {
  if (a === null) return b;
  if (b === null) return a;
  if (compare(a.item, b.item) > 0) {
    [a, b] = [b, a]; // a가 항상 더 작은(또는 같은) 루트
  }
  a.right = mergeNodes(a.right, b, compare);

  const leftRank = rank(a.left);
  const rightRank = rank(a.right);
  if (leftRank < rightRank) {
    [a.left, a.right] = [a.right, a.left];
  }
  a.rank = Math.min(leftRank, rightRank) + 1;
  return a;
}

class LeftistHeap<T> {
  private root: LeftistNode<T> | null;
  private _size: number;
  private compare: (a: T, b: T) => number;

  constructor(compare: (a: T, b: T) => number) {
    this.root = null;
    this._size = 0;
    this.compare = compare;
  }

  insert(item: T): void {
    const node = new LeftistNode(item);
    this.root = mergeNodes(this.root, node, this.compare);
    this._size++;
  }

  extractMin(): T | undefined {
    if (this.root === null) return undefined;
    const item = this.root.item;
    this.root = mergeNodes(this.root.left, this.root.right, this.compare);
    this._size--;
    return item;
  }

  merge(other: LeftistHeap<T>): LeftistHeap<T> {
    const result = new LeftistHeap<T>(this.compare);
    result.root = mergeNodes(this.root, other.root, this.compare);
    result._size = this._size + other._size;
    return result;
  }

  peek(): T | undefined {
    return this.root === null ? undefined : this.root.item;
  }

  size(): number {
    return this._size;
  }

  isEmpty(): boolean {
    return this._size === 0;
  }

  // 검증 전용 헬퍼 (가이드 본문에는 없음)
  __toArraySorted(): T[] {
    // 파괴적이지 않게 구조를 복제해서 전부 뽑아본다
    const clone = (n: LeftistNode<T> | null): LeftistNode<T> | null => {
      if (n === null) return null;
      const c = new LeftistNode(n.item);
      c.rank = n.rank;
      c.left = clone(n.left);
      c.right = clone(n.right);
      return c;
    };
    const tmp = new LeftistHeap<T>(this.compare);
    tmp.root = clone(this.root);
    tmp._size = this._size;
    const out: T[] = [];
    let v = tmp.extractMin();
    while (v !== undefined) {
      out.push(v);
      v = tmp.extractMin();
    }
    return out;
  }

  __rootStructure(): string {
    const describe = (n: LeftistNode<T> | null): string => {
      if (n === null) return "null";
      return `${n.item}(rank=${n.rank}, left=${n.left ? n.left.item : "null"}, right=${n.right ? n.right.item : "null"})`;
    };
    return describe(this.root);
  }
}

// ---------------------------------------------------------------------------
// 검증 하네스
// ---------------------------------------------------------------------------

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.error(`FAIL: ${label} — actual=${a} expected=${e}`);
    process.exitCode = 1;
  } else {
    console.log(`OK: ${label} — ${a}`);
  }
}

const cmp = (a: number, b: number) => a - b;

console.log("=== 시뮬레이션 대응 트레이스 (insert 5,3,7,1 → extractMin) ===");
const h = new LeftistHeap<number>(cmp);

h.insert(5);
console.log("insert(5) ->", h.__rootStructure(), "sorted:", h.__toArraySorted());
assertEqual(h.__toArraySorted(), [5], "insert(5) sorted view");

h.insert(3);
console.log("insert(3) ->", h.__rootStructure(), "sorted:", h.__toArraySorted());
assertEqual(h.__toArraySorted(), [3, 5], "insert(3) sorted view");

h.insert(7);
console.log("insert(7) ->", h.__rootStructure(), "sorted:", h.__toArraySorted());
assertEqual(h.__toArraySorted(), [3, 5, 7], "insert(7) sorted view");

h.insert(1);
console.log("insert(1) ->", h.__rootStructure(), "sorted:", h.__toArraySorted());
assertEqual(h.__toArraySorted(), [1, 3, 5, 7], "insert(1) sorted view");
assertEqual(h.peek(), 1, "peek() after inserts");

const popped = h.extractMin();
console.log("extractMin() ->", popped, "root now:", h.__rootStructure());
assertEqual(popped, 1, "extractMin() return value");
assertEqual(h.__toArraySorted(), [3, 5, 7], "post-extractMin sorted view");
assertEqual(h.size(), 3, "size() after extractMin");

console.log("\n=== '왜 모순 없이' 절 예시: insert(5) 후 insert(3) 구조 ===");
const h2 = new LeftistHeap<number>(cmp);
h2.insert(5);
h2.insert(3);
console.log("root:", h2.__rootStructure());
// 좌향 속성 위반 방지: rank(left) >= rank(right) 확인
assertEqual(h2.__rootStructure(), "3(rank=1, left=5, right=null)", "insert(3) after insert(5) — 스왑 결과");

console.log("\n=== insert(1) 스왑 예시 (기존 3(rank=2,left=5,right=7)에 1 삽입) ===");
const h3 = new LeftistHeap<number>(cmp);
h3.insert(5);
h3.insert(3);
h3.insert(7);
console.log("before insert(1), root:", h3.__rootStructure());
h3.insert(1);
console.log("after insert(1), root:", h3.__rootStructure());
assertEqual(h3.__rootStructure(), "1(rank=1, left=3, right=null)", "insert(1) 스왑 결과");

console.log("\n=== 엣지 케이스 ===");
const empty = new LeftistHeap<number>(cmp);
assertEqual(empty.peek(), undefined, "빈 힙 peek()");
assertEqual(empty.extractMin(), undefined, "빈 힙 extractMin()");
assertEqual(empty.isEmpty(), true, "빈 힙 isEmpty()");
assertEqual(empty.size(), 0, "빈 힙 size()");

const single = new LeftistHeap<number>(cmp);
single.insert(42);
assertEqual(single.peek(), 42, "크기 1 힙 peek()");
assertEqual(single.extractMin(), 42, "크기 1 힙 extractMin()");
assertEqual(single.isEmpty(), true, "extractMin 후 다시 빈 힙");

console.log("\n=== merge 예시 (문제 서술 예시 재검증) ===");
const heapA = new LeftistHeap<number>(cmp);
heapA.insert(10);
heapA.insert(5);
heapA.insert(15);
assertEqual(heapA.peek(), 5, "heapA.peek()");
assertEqual(heapA.extractMin(), 5, "heapA.extractMin() 첫 호출");
assertEqual(heapA.size(), 2, "heapA.size() after extractMin");

const heapB = new LeftistHeap<number>(cmp);
heapB.insert(3);
heapB.insert(8);

const merged = heapA.merge(heapB);
assertEqual(merged.size(), 4, "merged.size()");
assertEqual(
  [merged.extractMin(), merged.extractMin(), merged.extractMin(), merged.extractMin()],
  [3, 8, 10, 15],
  "merged 힙 순차 extractMin",
);

console.log("\n=== 빈 힙과의 merge ===");
const nonEmpty = new LeftistHeap<number>(cmp);
nonEmpty.insert(1);
nonEmpty.insert(2);
const emptyOther = new LeftistHeap<number>(cmp);
const mergedWithEmpty = nonEmpty.merge(emptyOther);
assertEqual(mergedWithEmpty.__toArraySorted(), [1, 2], "빈 힙과 merge 결과");

console.log("\n=== 중복 값 처리 ===");
const dup = new LeftistHeap<number>(cmp);
[4, 4, 2, 2, 4].forEach((v) => dup.insert(v));
assertEqual(dup.__toArraySorted(), [2, 2, 4, 4, 4], "중복 값 정렬 추출");

console.log("\n=== 무작위 교차검증 (100회) ===");
let allOk = true;
for (let trial = 0; trial < 100; trial++) {
  const n = Math.floor(Math.random() * 30);
  const values: number[] = [];
  for (let i = 0; i < n; i++) values.push(Math.floor(Math.random() * 100) - 50);

  const heap = new LeftistHeap<number>(cmp);
  for (const v of values) heap.insert(v);

  const extracted: number[] = [];
  let v = heap.extractMin();
  while (v !== undefined) {
    extracted.push(v);
    v = heap.extractMin();
  }

  const expected = [...values].sort((a, b) => a - b);
  const ok = JSON.stringify(extracted) === JSON.stringify(expected);
  if (!ok) {
    allOk = false;
    console.error(`FAIL trial ${trial}: values=${JSON.stringify(values)}`);
    console.error(`  extracted=${JSON.stringify(extracted)}`);
    console.error(`  expected =${JSON.stringify(expected)}`);
  }
}
console.log(allOk ? "OK: 무작위 100회 전부 정렬 순서와 일치" : "일부 실패 — 위 로그 확인");

console.log("\n=== 무작위 merge 교차검증 (50회) ===");
let mergeOk = true;
for (let trial = 0; trial < 50; trial++) {
  const n1 = Math.floor(Math.random() * 15);
  const n2 = Math.floor(Math.random() * 15);
  const v1: number[] = Array.from({ length: n1 }, () => Math.floor(Math.random() * 50));
  const v2: number[] = Array.from({ length: n2 }, () => Math.floor(Math.random() * 50));

  const ha = new LeftistHeap<number>(cmp);
  v1.forEach((v) => ha.insert(v));
  const hb = new LeftistHeap<number>(cmp);
  v2.forEach((v) => hb.insert(v));

  const hm = ha.merge(hb);
  const extracted: number[] = [];
  let v = hm.extractMin();
  while (v !== undefined) {
    extracted.push(v);
    v = hm.extractMin();
  }
  const expected = [...v1, ...v2].sort((a, b) => a - b);
  const ok = JSON.stringify(extracted) === JSON.stringify(expected) && hm.size() === n1 + n2 - extracted.length + hm.size();
  const sizeOk = extracted.length === n1 + n2;
  if (JSON.stringify(extracted) !== JSON.stringify(expected) || !sizeOk) {
    mergeOk = false;
    console.error(`FAIL merge trial ${trial}: v1=${JSON.stringify(v1)} v2=${JSON.stringify(v2)}`);
  }
}
console.log(mergeOk ? "OK: 무작위 merge 50회 전부 일치" : "일부 실패 — 위 로그 확인");

console.log("\n=== rank 상한 검증: n개 노드일 때 rank <= floor(log2(n+1)) ===");
let rankOk = true;
for (let trial = 0; trial < 30; trial++) {
  const n = 1 + Math.floor(Math.random() * 200);
  const heap = new LeftistHeap<number>(cmp);
  for (let i = 0; i < n; i++) heap.insert(Math.floor(Math.random() * 1000));
  // private 필드 접근을 위해 any 캐스팅
  const root = (heap as unknown as { root: LeftistNode<number> | null }).root;
  const r = rank(root);
  const bound = Math.floor(Math.log2(n + 1));
  if (r > bound) {
    rankOk = false;
    console.error(`FAIL rank bound: n=${n}, rank=${r}, bound=${bound}`);
  }
}
console.log(rankOk ? "OK: rank 상한 30회 전부 만족" : "일부 실패");

console.log("\n전체 결과:", process.exitCode === 1 ? "FAIL 있음" : "ALL PASS");
