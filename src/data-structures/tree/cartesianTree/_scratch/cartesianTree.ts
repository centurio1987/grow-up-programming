// E3 자기검증용 스크래치 — 가이드 본문 코드를 그대로 추출해 실행한다.
// bun src/data-structures/tree/cartesianTree/_scratch/cartesianTree.ts

type Cmp<T> = (a: T, b: T) => number;

class CartesianNode<T> {
  value: T;
  left: CartesianNode<T> | undefined = undefined;
  right: CartesianNode<T> | undefined = undefined;
  size = 1;

  constructor(value: T) {
    this.value = value;
  }
}

function subtreeSize<T>(node: CartesianNode<T> | undefined): number {
  return node === undefined ? 0 : node.size;
}

function computeSizes<T>(node: CartesianNode<T> | undefined): number {
  if (node === undefined) return 0;
  node.size = computeSizes(node.left) + computeSizes(node.right) + 1;
  return node.size;
}

class CartesianTree<T> {
  private constructor(
    private readonly root: CartesianNode<T> | undefined,
    private readonly cmp: Cmp<T>,
  ) {}

  static fromArray<T>(
    arr: T[],
    cmp: Cmp<T> = (a, b) => (a < b ? -1 : a > b ? 1 : 0),
  ): CartesianTree<T> {
    const stack: CartesianNode<T>[] = [];

    for (const v of arr) {
      const node = new CartesianNode(v);
      let last: CartesianNode<T> | undefined;

      // 새 값보다 "크거나 같지 않은" 스택 탑을 팝 → 그 마지막 팝이 새 노드의 왼쪽 자식
      while (stack.length > 0 && cmp(v, stack[stack.length - 1]!.value) < 0) {
        last = stack.pop();
      }
      node.left = last;

      if (stack.length > 0) {
        stack[stack.length - 1]!.right = node;
      }

      stack.push(node);
    }

    const root = stack.length > 0 ? stack[0] : undefined;
    computeSizes(root); // 트리가 완성된 뒤 한 번의 후위 순회로 size를 채운다 — O(n)
    return new CartesianTree(root, cmp);
  }

  private static wrap<T>(
    node: CartesianNode<T> | undefined,
    cmp: Cmp<T>,
  ): CartesianTree<T> | undefined {
    return node === undefined ? undefined : new CartesianTree(node, cmp);
  }

  value(): T | undefined {
    return this.root?.value;
  }

  left(): CartesianTree<T> | undefined {
    return CartesianTree.wrap(this.root?.left, this.cmp);
  }

  right(): CartesianTree<T> | undefined {
    return CartesianTree.wrap(this.root?.right, this.cmp);
  }

  size(): number {
    return subtreeSize(this.root);
  }

  inOrder(): T[] {
    const out: T[] = [];
    const visit = (node: CartesianNode<T> | undefined): void => {
      if (node === undefined) return;
      visit(node.left);
      out.push(node.value);
      visit(node.right);
    };
    visit(this.root);
    return out;
  }
}

// ── naive 참조 구현 (O(n^2)) — 교차검증용 ─────────────────────────
function naiveBuild<T>(arr: T[], cmp: Cmp<T>): (T | null)[] {
  // 재귀적으로 [최솟값, 왼쪽 배열, 오른쪽 배열]을 반환해 트리를 배열로 직렬화(전위)
  function build(a: T[]): { value: T; left: unknown; right: unknown } | null {
    if (a.length === 0) return null;
    let minIdx = 0;
    for (let i = 1; i < a.length; i++) {
      if (cmp(a[i]!, a[minIdx]!) < 0) minIdx = i;
    }
    return {
      value: a[minIdx]!,
      left: build(a.slice(0, minIdx)),
      right: build(a.slice(minIdx + 1)),
    };
  }
  const tree = build(arr);
  const out: (T | null)[] = [];
  function preorder(n: any): void {
    if (n === null) {
      out.push(null);
      return;
    }
    out.push(n.value);
    preorder(n.left);
    preorder(n.right);
  }
  preorder(tree);
  return out;
}

function preorderOf<T>(t: CartesianTree<T> | undefined): (T | null)[] {
  const out: (T | null)[] = [];
  function visit(node: CartesianTree<T> | undefined): void {
    if (node === undefined) {
      out.push(null);
      return;
    }
    out.push(node.value() as T);
    visit(node.left());
    visit(node.right());
  }
  visit(t);
  return out;
}

// ── 대표 예시: 가이드 본문에서 그대로 인용하는 수치 ──────────────────
console.log("=== 대표 예시: [5, 10, 40, 10, 20] ===");
const t1 = CartesianTree.fromArray([5, 10, 40, 10, 20]);
console.log("value():", t1.value());
console.log("size():", t1.size());
console.log("inOrder():", t1.inOrder());
console.log("left():", t1.left()?.value());
console.log("right()?.value():", t1.right()?.value());
console.log("right()?.right()?.value():", t1.right()?.right()?.value());
console.log("right()?.right()?.left()?.value():", t1.right()?.right()?.left()?.value());
console.log("right()?.right()?.right()?.value():", t1.right()?.right()?.right()?.value());
console.log("right()?.right()?.size():", t1.right()?.right()?.size());

console.log("\n=== max-heap 비교자: [5, 10, 40, 10, 20], (a,b)=>b-a ===");
const t2 = CartesianTree.fromArray([5, 10, 40, 10, 20], (a, b) => b - a);
console.log("value():", t2.value());
console.log("inOrder():", t2.inOrder());

console.log("\n=== 엣지: 빈 배열 ===");
const t3 = CartesianTree.fromArray<number>([]);
console.log("value():", t3.value());
console.log("size():", t3.size());
console.log("inOrder():", t3.inOrder());
console.log("left():", t3.left());

console.log("\n=== 엣지: 원소 1개 ===");
const t4 = CartesianTree.fromArray([7]);
console.log("value():", t4.value(), "size():", t4.size(), "left():", t4.left(), "right():", t4.right());

console.log("\n=== 엣지: 이미 정렬됨(오름차순) [1,2,3,4,5] ===");
const t5 = CartesianTree.fromArray([1, 2, 3, 4, 5]);
console.log("inOrder():", t5.inOrder());
console.log("value():", t5.value(), "right()?.value():", t5.right()?.value());
console.log("right()?.right()?.right()?.right()?.value():", t5.right()?.right()?.right()?.right()?.value());
// 정렬된 배열이면 완전히 오른쪽으로 치우친 사슬 모양이 나와야 한다 (모든 left === undefined)
console.log(
  "모든 노드 left===undefined 체크:",
  [t5, t5.right(), t5.right()?.right(), t5.right()?.right()?.right(), t5.right()?.right()?.right()?.right()].every(
    (n) => n?.left() === undefined,
  ),
);

console.log("\n=== 엣지: 완전 동률 [3,3,3] ===");
const t6 = CartesianTree.fromArray([3, 3, 3]);
console.log("inOrder():", t6.inOrder());
console.log("value():", t6.value(), "size():", t6.size());
// 동률이면 먼저 들어온 원소가 더 위(왼쪽 경계에 안 밀림) — 사슬 오른쪽으로
console.log("right()?.value():", t6.right()?.value(), "right()?.right()?.value():", t6.right()?.right()?.value());

console.log("\n=== 교차검증: 무작위 20세트, n<=30, 값 범위 [0,9] (중복 잦음) ===");
let allMatch = true;
for (let trial = 0; trial < 20; trial++) {
  const n = 1 + Math.floor(Math.random() * 30); // n=0(빈 배열)은 위에서 별도 검증 완료
  const arr = Array.from({ length: n }, () => Math.floor(Math.random() * 10));
  const cmp: Cmp<number> = (a, b) => a - b;
  const fast = CartesianTree.fromArray(arr, cmp);
  const fastPre = preorderOf(fast);
  const naivePre = naiveBuild(arr, cmp);
  const inOrderOk = JSON.stringify(fast.inOrder()) === JSON.stringify(arr);
  const preorderOk = JSON.stringify(fastPre) === JSON.stringify(naivePre);
  const sizeOk = fast.size() === n;
  if (!inOrderOk || !preorderOk || !sizeOk) {
    allMatch = false;
    console.log("MISMATCH", { arr, fastPre, naivePre, inOrderOk, preorderOk, sizeOk });
  }
}
console.log("전체 일치:", allMatch);

console.log("\n=== D6 함정 검증: pop 조건을 `<`가 아니라 `<=`로 잘못 쓴 경우 ===");
function buggyFromArray(arr: number[]): { value: number | undefined; rightValue: number | undefined; rightRightValue: number | undefined; pre: (number | null)[] } {
  type N = { value: number; left?: N; right?: N };
  const stack: N[] = [];
  for (const v of arr) {
    const node: N = { value: v };
    let last: N | undefined;
    while (stack.length > 0 && v <= stack[stack.length - 1]!.value) {
      // 버그: 원래 조건은 `v < top`인데 `v <= top`으로 등호가 붙었다 — 같은 값도 팝해 버린다
      last = stack.pop();
    }
    node.left = last;
    if (stack.length > 0) stack[stack.length - 1]!.right = node;
    stack.push(node);
  }
  const root = stack[0];
  const pre: (number | null)[] = [];
  (function walk(n: N | undefined) {
    if (!n) { pre.push(null); return; }
    pre.push(n.value);
    walk(n.left);
    walk(n.right);
  })(root);
  return { value: root?.value, rightValue: root?.right?.value, rightRightValue: root?.right?.right?.value, pre };
}
console.log("입력 [10, 5, 5, 20] — 올바른 구현:");
{
  const correct = CartesianTree.fromArray([10, 5, 5, 20]);
  console.log("  value():", correct.value(), "right()?.value():", correct.right()?.value(), "right()?.right()?.value():", correct.right()?.right()?.value());
}
console.log("입력 [10, 5, 5, 20] — `<=` 버그 버전:");
{
  const buggy = buggyFromArray([10, 5, 5, 20]);
  console.log("  value:", buggy.value, "rightValue:", buggy.rightValue, "rightRightValue:", buggy.rightRightValue);
}

console.log("\n=== 엣지: 내림차순 [5,4,3,2,1] (완전 왼쪽 사슬 예상) ===");
const t7 = CartesianTree.fromArray([5, 4, 3, 2, 1]);
console.log("inOrder():", t7.inOrder());
console.log("value():", t7.value(), "size():", t7.size());
console.log(
  "모든 노드 right===undefined 체크:",
  [t7, t7.left(), t7.left()?.left(), t7.left()?.left()?.left(), t7.left()?.left()?.left()?.left()].every(
    (n) => n?.right() === undefined,
  ),
);
console.log("가장 깊은 left 체인 끝 값:", t7.left()?.left()?.left()?.left()?.value());

console.log("\n=== 코드 사다리 중간 단계(스파인 워크) 검증 ===");
function insertViaSpineWalk<T>(
  root: CartesianNode<T> | undefined,
  value: T,
  cmp: Cmp<T>,
): CartesianNode<T> {
  const node = new CartesianNode(value);
  if (root === undefined) return node;
  if (cmp(value, root.value) < 0) {
    node.left = root;
    return node;
  }
  let cur = root;
  while (cur.right !== undefined && cmp(value, cur.right.value) >= 0) {
    cur = cur.right;
  }
  node.left = cur.right;
  cur.right = node;
  return root;
}
function inOrderOfNode<T>(n: CartesianNode<T> | undefined, out: T[] = []): T[] {
  if (n === undefined) return out;
  inOrderOfNode(n.left, out);
  out.push(n.value);
  inOrderOfNode(n.right, out);
  return out;
}
let spineOk = true;
for (let trial = 0; trial < 30; trial++) {
  const n = 1 + Math.floor(Math.random() * 20);
  const arr = Array.from({ length: n }, () => Math.floor(Math.random() * 8));
  const cmp: Cmp<number> = (a, b) => a - b;
  let root: CartesianNode<number> | undefined;
  for (const v of arr) root = insertViaSpineWalk(root, v, cmp);
  const spineInOrder = inOrderOfNode(root);
  const fast = CartesianTree.fromArray(arr, cmp);
  const ok = JSON.stringify(spineInOrder) === JSON.stringify(arr) && JSON.stringify(preorderOf(fast)) === JSON.stringify((function () {
    const out: (number | null)[] = [];
    (function walk(n: CartesianNode<number> | undefined) {
      if (n === undefined) { out.push(null); return; }
      out.push(n.value);
      walk(n.left);
      walk(n.right);
    })(root);
    return out;
  })());
  if (!ok) { spineOk = false; console.log("SPINE MISMATCH", arr); }
}
console.log("스파인 워크 vs 스택 버전 전체 일치:", spineOk);
// 대표 예시로 직접 하나 확인
let repRoot: CartesianNode<number> | undefined;
for (const v of [5, 10, 40, 10, 20]) repRoot = insertViaSpineWalk(repRoot, v, (a, b) => a - b);
console.log("스파인 워크로 만든 대표 예시 inOrder:", inOrderOfNode(repRoot));
console.log("스파인 워크 루트 값:", repRoot?.value, "루트.right 값:", repRoot?.right?.value);

console.log("\n=== D6 버그 트리 전체 구조 ===");
{
  const buggy = buggyFromArray([10, 5, 5, 20]);
  console.log("preorder(값,null=빈자리):", buggy.pre);
}

console.log("\n=== 스스로 점검 3번 문항 사전 검증: right-link를 pop 루프 전에 실행하면? ===");
function reorderedBuggyFromArray(arr: number[]): string {
  type N = { value: number; left?: N; right?: N };
  const stack: N[] = [];
  for (const v of arr) {
    const node: N = { value: v };
    // 버그: pop 루프보다 먼저 top.right = node 를 실행
    if (stack.length > 0) stack[stack.length - 1]!.right = node;
    let last: N | undefined;
    while (stack.length > 0 && v < stack[stack.length - 1]!.value) {
      last = stack.pop();
    }
    node.left = last;
    stack.push(node);
  }
  // inOrder 시도 — 사이클이 있으면 재귀 깊이 초과로 예외가 나야 정상
  const root = stack[0];
  let visited = 0;
  try {
    (function walk(n: N | undefined, depth: number) {
      if (n === undefined || depth > 1000) throw new Error("cycle-or-too-deep");
      visited++;
      walk(n.left, depth + 1);
      walk(n.right, depth + 1);
    })(root, 0);
    return `완료, 방문 노드 수=${visited}`;
  } catch (e) {
    return `예외 발생: ${(e as Error).message}, 방문 시도 수=${visited}`;
  }
}
console.log(reorderedBuggyFromArray([5, 10, 40, 10, 20]));
