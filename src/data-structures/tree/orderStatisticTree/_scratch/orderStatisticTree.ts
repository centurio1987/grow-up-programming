// E3 자기검증 스크래치 — 가이드 본문 코드를 그대로 추출해 실행한다.
// 실행: bun src/data-structures/tree/orderStatisticTree/_scratch/orderStatisticTree.ts

// ============================================================
// 최종 구현: Treap 기반 Order Statistic Tree
// ============================================================

class OSTNode {
  key: number;
  priority: number;
  size: number;
  left: OSTNode | null = null;
  right: OSTNode | null = null;
  constructor(key: number) {
    this.key = key;
    this.priority = Math.random();
    this.size = 1;
  }
}

function sz(node: OSTNode | null): number {
  return node ? node.size : 0;
}

function pullUp(node: OSTNode): void {
  node.size = sz(node.left) + sz(node.right) + 1;
}

// split(node, x): key <= x 인 것들(left)과 key > x 인 것들(right)로 분리
function split(node: OSTNode | null, x: number): [OSTNode | null, OSTNode | null] {
  if (node === null) return [null, null];
  if (node.key <= x) {
    const [l, r] = split(node.right, x);
    node.right = l;
    pullUp(node);
    return [node, r];
  } else {
    const [l, r] = split(node.left, x);
    node.left = r;
    pullUp(node);
    return [l, node];
  }
}

// merge(a, b): a의 모든 키 <= b의 모든 키라는 전제 하에 우선순위 힙 조건을 지키며 합친다
function merge(a: OSTNode | null, b: OSTNode | null): OSTNode | null {
  if (a === null) return b;
  if (b === null) return a;
  if (a.priority > b.priority) {
    a.right = merge(a.right, b);
    pullUp(a);
    return a;
  } else {
    b.left = merge(a, b.left);
    pullUp(b);
    return b;
  }
}

function insertNode(node: OSTNode | null, newNode: OSTNode): OSTNode {
  if (node === null) return newNode;
  if (newNode.priority > node.priority) {
    const [l, r] = split(node, newNode.key);
    newNode.left = l;
    newNode.right = r;
    pullUp(newNode);
    return newNode;
  }
  if (newNode.key <= node.key) {
    node.left = insertNode(node.left, newNode);
  } else {
    node.right = insertNode(node.right, newNode);
  }
  pullUp(node);
  return node;
}

function deleteNode(node: OSTNode | null, x: number): OSTNode | null {
  if (node === null) return null;
  if (x < node.key) {
    node.left = deleteNode(node.left, x);
    pullUp(node);
    return node;
  }
  if (x > node.key) {
    node.right = deleteNode(node.right, x);
    pullUp(node);
    return node;
  }
  return merge(node.left, node.right);
}

function kth(node: OSTNode | null, k: number): number {
  if (node === null) throw new Error("k out of range");
  const ls = sz(node.left);
  if (k <= ls) return kth(node.left, k);
  if (k === ls + 1) return node.key;
  return kth(node.right, k - ls - 1);
}

function rank(node: OSTNode | null, x: number): number {
  if (node === null) return 0;
  if (x <= node.key) return rank(node.left, x);
  return sz(node.left) + 1 + rank(node.right, x);
}

class OrderStatisticTree {
  private root: OSTNode | null = null;

  insert(x: number): void {
    this.root = insertNode(this.root, new OSTNode(x));
  }

  delete(x: number): void {
    this.root = deleteNode(this.root, x);
  }

  kth(k: number): number {
    return kth(this.root, k);
  }

  rank(x: number): number {
    return rank(this.root, x);
  }

  height(): number {
    const h = (n: OSTNode | null): number => (n ? 1 + Math.max(h(n.left), h(n.right)) : 0);
    return h(this.root);
  }
}

// ============================================================
// 원형(naive): 균형을 포기한 size-augmented BST (priority 없음)
// ============================================================

class NaiveNode {
  key: number;
  size = 1;
  left: NaiveNode | null = null;
  right: NaiveNode | null = null;
  constructor(key: number) {
    this.key = key;
  }
}
function naiveSz(n: NaiveNode | null): number {
  return n ? n.size : 0;
}
function naiveInsert(node: NaiveNode | null, x: number): NaiveNode {
  if (node === null) return new NaiveNode(x);
  if (x <= node.key) node.left = naiveInsert(node.left, x);
  else node.right = naiveInsert(node.right, x);
  node.size = naiveSz(node.left) + naiveSz(node.right) + 1;
  return node;
}
function naiveHeight(node: NaiveNode | null): number {
  return node ? 1 + Math.max(naiveHeight(node.left), naiveHeight(node.right)) : 0;
}

// ============================================================
// 검증 1: problem.md 예시 트레이스
// ============================================================
console.log("=== 검증 1: problem.md 예시 ===");
{
  const ost = new OrderStatisticTree();
  ost.insert(5);
  ost.insert(2);
  ost.insert(8);
  ost.insert(2); // S = {2, 2, 5, 8}

  console.log("kth(1) =", ost.kth(1), "(기대: 2)");
  console.log("kth(2) =", ost.kth(2), "(기대: 2)");
  console.log("kth(3) =", ost.kth(3), "(기대: 5)");
  console.log("kth(4) =", ost.kth(4), "(기대: 8)");

  console.log("rank(2) =", ost.rank(2), "(기대: 0)");
  console.log("rank(5) =", ost.rank(5), "(기대: 2)");
  console.log("rank(10) =", ost.rank(10), "(기대: 4)");

  ost.delete(2); // S = {2, 5, 8}
  console.log("delete(2) 후 kth(1) =", ost.kth(1), "(기대: 2)");
  console.log("delete(2) 후 rank(5) =", ost.rank(5), "(기대: 1)");

  ost.delete(999); // 없는 값, 무시
  console.log("delete(999) 후 kth(1) =", ost.kth(1), "(기대: 2, 변화 없음)");
}

// ============================================================
// 검증 2: 실행 시각화용 고정 트리 (old guide 재사용) — kth(5), rank(7)
// ============================================================
console.log("\n=== 검증 2: 시뮬레이션 고정 트리 ===");
{
  // 5(size=7) 루트, 좌: 3(size=3){1,4}, 우: 8(size=3){7,9}
  function mk(key: number, left: OSTNode | null = null, right: OSTNode | null = null): OSTNode {
    const n = new OSTNode(key);
    n.left = left;
    n.right = right;
    pullUp(n);
    return n;
  }
  const n1 = mk(1);
  const n4 = mk(4);
  const n3 = mk(3, n1, n4);
  const n7 = mk(7);
  const n9 = mk(9);
  const n8 = mk(8, n7, n9);
  const root = mk(5, n3, n8);

  console.log("size(root) =", root.size, "(기대: 7)");
  console.log("size(3) =", n3.size, "(기대: 3)");
  console.log("size(8) =", n8.size, "(기대: 3)");

  console.log("kth(root, 5) =", kth(root, 5), "(기대: 7)");
  console.log("rank(root, 7) =", rank(root, 7), "(기대: 4)");

  // 경로 추적 출력 (본문 steps와 대조용)
  console.log("-- kth(5) 경로 --");
  console.log("루트 5: ls=size(3)=" + sz(n3) + ", k=5 > ls+1=4 -> 오른쪽, k'=" + (5 - sz(n3) - 1));
  console.log("노드 8: ls=size(7)=" + sz(n7) + ", k=1 <= ls=1 -> 왼쪽");
  console.log("노드 7: ls=0, k=1==ls+1 -> return 7");

  console.log("-- rank(7) 경로 --");
  console.log("루트 5: x=7 > key=5 -> 누적 sz(3)+1=" + (sz(n3) + 1) + ", 오른쪽");
  console.log("노드 8: x=7 <= key=8 -> 누적 없이 왼쪽");
  console.log("노드 7: x=7 <= key=7 -> 누적 없이 왼쪽, 왼쪽=null -> 0");
  console.log("합계 =", sz(n3) + 1 + 0);
}

// ============================================================
// 검증 3: 엣지 케이스
// ============================================================
console.log("\n=== 검증 3: 엣지 케이스 ===");
{
  const empty = new OrderStatisticTree();
  console.log("빈 트리 rank(0) =", empty.rank(0), "(기대: 0)");

  const single = new OrderStatisticTree();
  single.insert(42);
  console.log("단일 원소 kth(1) =", single.kth(1), "(기대: 42)");
  console.log("단일 원소 rank(42) =", single.rank(42), "(기대: 0, 자기 자신은 포함 안됨)");
  console.log("단일 원소 rank(43) =", single.rank(43), "(기대: 1)");

  const s2 = new OrderStatisticTree();
  [1, 3, 5].forEach((v) => s2.insert(v));
  console.log("S={1,3,5} rank(4) =", s2.rank(4), "(기대: 2, x가 집합에 없어도 동작)");

  s2.delete(999); // 존재하지 않는 값 삭제 시도
  console.log("존재하지 않는 값 delete 후 kth(1) =", s2.kth(1), "(기대: 1, 변화 없음)");

  const neg = new OrderStatisticTree();
  [-5, -1, 0, 3].forEach((v) => neg.insert(v));
  console.log("음수 포함 S={-5,-1,0,3} kth(1) =", neg.kth(1), "(기대: -5)");
  console.log("음수 포함 S={-5,-1,0,3} rank(0) =", neg.rank(0), "(기대: 2)");
}

// ============================================================
// 검증 4: 무작위 교차검증 (Treap vs 정렬 배열 브루트포스)
// ============================================================
console.log("\n=== 검증 4: 무작위 교차검증 (500회 연산) ===");
{
  const ost = new OrderStatisticTree();
  const brute: number[] = [];
  let mismatches = 0;

  for (let i = 0; i < 500; i++) {
    const op = Math.random();
    const x = Math.floor(Math.random() * 50) - 25; // -25..24
    if (op < 0.45) {
      ost.insert(x);
      brute.push(x);
      brute.sort((a, b) => a - b);
    } else if (op < 0.6) {
      ost.delete(x);
      const idx = brute.indexOf(x);
      if (idx >= 0) brute.splice(idx, 1);
    } else if (op < 0.8) {
      if (brute.length > 0) {
        const k = 1 + Math.floor(Math.random() * brute.length);
        const got = ost.kth(k);
        const want = brute[k - 1];
        if (got !== want) {
          mismatches++;
          console.log(`kth 불일치: k=${k} got=${got} want=${want}`);
        }
      }
    } else {
      const got = ost.rank(x);
      const want = brute.filter((y) => y < x).length;
      if (got !== want) {
        mismatches++;
        console.log(`rank 불일치: x=${x} got=${got} want=${want}`);
      }
    }
  }
  console.log("불일치 개수 =", mismatches, "(기대: 0)");
  console.log("최종 원소 수 =", brute.length);
}

// ============================================================
// 검증 5: D6 함정 — 균형 없는 원형의 높이 폭발
// ============================================================
console.log("\n=== 검증 5: 원형(naive)의 높이 폭발 ===");
{
  const n = 1000;
  let naiveRoot: NaiveNode | null = null;
  for (let i = 1; i <= n; i++) naiveRoot = naiveInsert(naiveRoot, i); // 오름차순 삽입
  console.log(`원형(naive) 오름차순 ${n}개 삽입 후 높이 =`, naiveHeight(naiveRoot), "(기대: n과 동일, 즉 1000 — 완전한 사슬)");

  const treap = new OrderStatisticTree();
  for (let i = 1; i <= n; i++) treap.insert(i); // 동일한 오름차순 삽입
  const h = treap.height();
  console.log(`Treap 동일 입력(오름차순 ${n}개) 삽입 후 높이 =`, h, "(기대: log2(1000)≈10의 수 배 이내)");
  console.log("log2(n) =", Math.log2(n).toFixed(2));
}
