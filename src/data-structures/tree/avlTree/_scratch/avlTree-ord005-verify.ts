// AVL 가이드 ORD-005 재집필용 실측 검증 스크래치
// 본문에 실을 코드를 그대로 두고, 본문에 쓸 모든 수치를 실행으로 확인한다.

class AVLNode<T> {
  value: T;
  left: AVLNode<T> | undefined = undefined;
  right: AVLNode<T> | undefined = undefined;
  height: number = 1;

  constructor(value: T) {
    this.value = value;
  }
}

function h<T>(node: AVLNode<T> | undefined): number {
  return node?.height ?? 0;
}

function bf<T>(node: AVLNode<T>): number {
  return h(node.left) - h(node.right);
}

function updateHeight<T>(node: AVLNode<T>): void {
  node.height = 1 + Math.max(h(node.left), h(node.right));
}

let rotationCount = 0;

function rotateRight<T>(z: AVLNode<T>): AVLNode<T> {
  rotationCount++;
  const y = z.left!;
  z.left = y.right;
  y.right = z;
  updateHeight(z);
  updateHeight(y);
  return y;
}

function rotateLeft<T>(z: AVLNode<T>): AVLNode<T> {
  rotationCount++;
  const y = z.right!;
  z.right = y.left;
  y.left = z;
  updateHeight(z);
  updateHeight(y);
  return y;
}

function rebalance<T>(node: AVLNode<T>): AVLNode<T> {
  updateHeight(node);
  const balance = bf(node);
  if (balance > 1) {
    if (bf(node.left!) < 0) node.left = rotateLeft(node.left!);
    return rotateRight(node);
  }
  if (balance < -1) {
    if (bf(node.right!) > 0) node.right = rotateRight(node.right!);
    return rotateLeft(node);
  }
  return node;
}

export class AVLTree<T> {
  root: AVLNode<T> | undefined = undefined;
  private _size = 0;
  private comparator: (a: T, b: T) => number;

  constructor(comparator?: (a: T, b: T) => number) {
    this.comparator = comparator ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  insert(value: T): void {
    if (this.has(value)) return;
    this.root = this.insertNode(this.root, value);
    this._size++;
  }

  private insertNode(node: AVLNode<T> | undefined, value: T): AVLNode<T> {
    if (node === undefined) return new AVLNode(value);
    const cmp = this.comparator(value, node.value);
    if (cmp < 0) node.left = this.insertNode(node.left, value);
    else node.right = this.insertNode(node.right, value);
    return rebalance(node);
  }

  delete(value: T): boolean {
    if (!this.has(value)) return false;
    this.root = this.deleteNode(this.root, value);
    this._size--;
    return true;
  }

  private deleteNode(node: AVLNode<T> | undefined, value: T): AVLNode<T> | undefined {
    if (node === undefined) return undefined;
    const cmp = this.comparator(value, node.value);
    if (cmp < 0) {
      node.left = this.deleteNode(node.left, value);
    } else if (cmp > 0) {
      node.right = this.deleteNode(node.right, value);
    } else {
      if (node.left === undefined) return node.right;
      if (node.right === undefined) return node.left;
      let successor = node.right;
      while (successor.left !== undefined) successor = successor.left;
      node.value = successor.value;
      node.right = this.deleteNode(node.right, successor.value);
    }
    return rebalance(node);
  }

  has(value: T): boolean {
    let node = this.root;
    while (node !== undefined) {
      const cmp = this.comparator(value, node.value);
      if (cmp === 0) return true;
      node = cmp < 0 ? node.left : node.right;
    }
    return false;
  }

  min(): T | undefined {
    let node = this.root;
    if (node === undefined) return undefined;
    while (node.left !== undefined) node = node.left;
    return node.value;
  }

  max(): T | undefined {
    let node = this.root;
    if (node === undefined) return undefined;
    while (node.right !== undefined) node = node.right;
    return node.value;
  }

  inOrder(): T[] {
    const result: T[] = [];
    const walk = (node: AVLNode<T> | undefined) => {
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

  height(): number {
    return h(this.root);
  }
}

// ---------- 도구 ----------
function draw<T>(node: AVLNode<T> | undefined, prefix = "", isLeft = true): string {
  if (node === undefined) return "";
  let out = "";
  if (node.right) out += draw(node.right, prefix + (isLeft ? "│   " : "    "), false);
  out += prefix + (isLeft ? "└── " : "┌── ") + `${node.value} (h=${node.height}, bf=${bf(node)})\n`;
  if (node.left) out += draw(node.left, prefix + (isLeft ? "    " : "│   "), true);
  return out;
}

function checkInvariant<T>(node: AVLNode<T> | undefined): boolean {
  if (node === undefined) return true;
  if (Math.abs(bf(node)) > 1) return false;
  if (node.height !== 1 + Math.max(h(node.left), h(node.right))) return false;
  return checkInvariant(node.left) && checkInvariant(node.right);
}

const line = (s: string) => console.log("\n===== " + s + " =====");

// ---------- 1. 문제 예시 검증 ----------
line("1. 5,3,7,1,4,6,8");
{
  const t = new AVLTree<number>();
  [5, 3, 7, 1, 4, 6, 8].forEach((v) => t.insert(v));
  console.log("inOrder", t.inOrder(), "height", t.height(), "size", t.size(), "min", t.min(), "max", t.max());
  console.log(draw(t.root));
  t.delete(5);
  console.log("delete(5) → inOrder", t.inOrder(), "has(5)", t.has(5), "height", t.height());
  console.log(draw(t.root));
}

// ---------- 2. 네 가지 회전 미시 예제 ----------
line("2. 네 가지 회전");
for (const seq of [[30, 20, 10], [10, 20, 30], [30, 10, 20], [10, 30, 20]]) {
  const t = new AVLTree<number>();
  rotationCount = 0;
  // 마지막 삽입 직전 상태
  const t2 = new AVLTree<number>();
  t2.insert(seq[0]!); t2.insert(seq[1]!);
  console.log(`--- ${seq.join(",")} : 마지막 삽입 직전`);
  console.log(draw(t2.root));
  seq.forEach((v) => t.insert(v));
  console.log(`--- ${seq.join(",")} : 삽입 완료 (회전 ${rotationCount}회)`);
  console.log(draw(t.root));
}

// ---------- 3. 정렬 입력: 일반 BST vs AVL ----------
line("3. 정렬 입력에서 일반 BST vs AVL");
{
  // 일반 BST (회전 없음)
  function plainInsert(node: any, v: number): any {
    if (node === undefined) return { value: v, left: undefined, right: undefined };
    if (v < node.value) node.left = plainInsert(node.left, v);
    else node.right = plainInsert(node.right, v);
    return node;
  }
  function plainSearchCost(node: any, v: number): number {
    let c = 0;
    while (node !== undefined) {
      c++;
      if (v === node.value) return c;
      node = v < node.value ? node.left : node.right;
    }
    return c;
  }
  function plainHeight(node: any): number {
    if (node === undefined) return 0;
    return 1 + Math.max(plainHeight(node.left), plainHeight(node.right));
  }
  for (const n of [1000, 10000]) {
    let root: any = undefined;
    for (let i = 1; i <= n; i++) root = plainInsert(root, i);
    const t = new AVLTree<number>();
    rotationCount = 0;
    for (let i = 1; i <= n; i++) t.insert(i);
    // 탐색 비교 횟수: 최악(가장 깊은 값) 과 평균
    let plainTotal = 0, avlTotal = 0, plainWorst = 0, avlWorst = 0;
    const avlSearchCost = (v: number) => {
      let c = 0; let node = t.root;
      while (node !== undefined) { c++; if (v === node.value) return c; node = v < node.value ? node.left : node.right; }
      return c;
    };
    for (let i = 1; i <= n; i++) {
      const a = plainSearchCost(root, i); plainTotal += a; plainWorst = Math.max(plainWorst, a);
      const b = avlSearchCost(i); avlTotal += b; avlWorst = Math.max(avlWorst, b);
    }
    console.log(`n=${n}: plain height=${plainHeight(root)} worst=${plainWorst} avg=${(plainTotal / n).toFixed(1)}`);
    console.log(`n=${n}: AVL   height=${t.height()} worst=${avlWorst} avg=${(avlTotal / n).toFixed(2)} 총회전=${rotationCount}`);
    console.log(`n=${n}: 1.4405*log2(n+2)-0.3277 = ${(1.4405 * Math.log2(n + 2) - 0.3277).toFixed(2)}, log2(n)=${Math.log2(n).toFixed(2)}`);
  }
}

// ---------- 4. 최소 노드 수 N(h) 와 피보나치 ----------
line("4. 최소 노드 수 N(h)");
{
  const N: number[] = [0, 1];
  const F: number[] = [0, 1]; // F(0)=0, F(1)=1
  for (let i = 2; i <= 20; i++) F[i] = F[i - 1]! + F[i - 2]!;
  for (let hh = 2; hh <= 20; hh++) N[hh] = N[hh - 1]! + N[hh - 2]! + 1;
  console.log("h   N(h)   F(h+2)-1   n=N(h)일때 1.4405log2(n+2)-0.3277");
  for (let hh = 0; hh <= 16; hh++) {
    const n = N[hh]!;
    const bound = n > 0 ? (1.4405 * Math.log2(n + 2) - 0.3277).toFixed(3) : "-";
    console.log(`${hh}\t${N[hh]}\t${F[hh + 2]! - 1}\t${bound}`);
  }
  const phi = (1 + Math.sqrt(5)) / 2;
  console.log("phi =", phi, "log_phi(2) =", Math.log(2) / Math.log(phi), "1/log2(phi) =", 1 / Math.log2(phi));
}

// ---------- 5. 실제로 최소 노드 트리(피보나치 트리) 만들어 보기 ----------
line("5. 피보나치 트리 (h=4, 최소 노드 7개?)");
{
  // 최소 노드 AVL 트리를 재귀로 구성하고 값 라벨을 중위 순서로 붙인다
  type Raw = { left?: Raw; right?: Raw };
  function build(hh: number): Raw | undefined {
    if (hh === 0) return undefined;
    if (hh === 1) return {};
    return { left: build(hh - 1), right: build(hh - 2) };
  }
  function label(node: Raw | undefined, counter: { v: number }, out: AVLTree<number>): void {
    // 중위 순회하며 1,2,3... 부여
    if (!node) return;
    label(node.left, counter, out);
    counter.v++;
    label(node.right, counter, out);
  }
  function toValues(node: Raw | undefined, counter: { v: number }): number[] {
    // 삽입 순서를 만들기 위해 그냥 노드 수만 센다
    if (!node) return [];
    return [...toValues(node.left, counter), ++counter.v, ...toValues(node.right, counter)];
  }
  for (let hh = 1; hh <= 6; hh++) {
    const c = { v: 0 };
    const vals = toValues(build(hh), c);
    console.log(`h=${hh} 최소노드수=${vals.length}`);
  }
}

// ---------- 6. LR을 단일 회전으로 고치려는 반례 ----------
line("6. LR 단일회전 반례");
{
  // 30-10-20 구성 후 30에서 rotateRight만 적용
  const a = new AVLNode(30);
  const b = new AVLNode(10);
  const c = new AVLNode(20);
  a.left = b; b.right = c;
  updateHeight(c); updateHeight(b); updateHeight(a);
  console.log("Before:"); console.log(draw(a));
  const r = rotateRight(a);
  console.log("rotateRight(30) 후:"); console.log(draw(r));
  console.log("루트 bf =", bf(r), "높이 =", r.height);
}

// ---------- 7. 삭제가 부르는 연쇄 회전 (피보나치 트리) ----------
line("7. 삭제 연쇄 회전");
{
  // 최소 노드 AVL 트리를 만들고 최솟값을 지우면 회전이 몇 번?
  function buildMinimalInsertOrder(hh: number): number[] {
    // 중위 라벨을 붙이고, 균형이 유지되도록 "레벨 순서"로 삽입하면 그 모양이 되진 않는다.
    // 대신 직접 구조를 만든다.
    type R = { v: number; left?: R; right?: R; height: number };
    let counter = 0;
    function build(hgt: number): R | undefined {
      if (hgt === 0) return undefined;
      const left = build(hgt - 1);
      const node: R = { v: ++counter, height: hgt };
      const right = build(hgt - 2);
      node.left = left; node.right = right;
      return node;
    }
    const root = build(hh);
    // 구조를 AVLNode로 옮긴다
    function conv(r: R | undefined): AVLNode<number> | undefined {
      if (!r) return undefined;
      const n = new AVLNode(r.v);
      n.left = conv(r.left); n.right = conv(r.right);
      updateHeight(n);
      return n;
    }
    const converted = conv(root);
    const t = new AVLTree<number>();
    (t as any).root = converted;
    (t as any)._size = counter;
    return [counter];
  }
  // 위 방식 대신: 직접 트리를 만들고 min 삭제
  type R = { v: number; left?: R; right?: R };
  let counter = 0;
  function build(hgt: number): R | undefined {
    if (hgt <= 0) return undefined;
    const left = build(hgt - 1);
    const node: R = { v: ++counter };
    const right = build(hgt - 2);
    node.left = left; node.right = right;
    return node;
  }
  function conv(r: R | undefined): AVLNode<number> | undefined {
    if (!r) return undefined;
    const n = new AVLNode(r.v);
    n.left = conv(r.left); n.right = conv(r.right);
    updateHeight(n);
    return n;
  }
  for (const hh of [4, 6, 8, 10, 12]) {
    counter = 0;
    const raw = build(hh);
    const root = conv(raw);
    const t = new AVLTree<number>();
    (t as any).root = root;
    (t as any)._size = counter;
    const before = t.height();
    console.log(`h=${hh} 노드수=${counter} 불변식 OK=${checkInvariant(root)}`);
    rotationCount = 0;
    t.delete(1); // 최솟값(가장 왼쪽 리프) 삭제
    console.log(`  delete(min) 회전 횟수 = ${rotationCount}, 높이 ${before} → ${t.height()}, 불변식 OK=${checkInvariant((t as any).root)}`);
  }
}

// ---------- 8. 삽입은 최대 1회전 확인 (무작위) ----------
line("8. 무작위 스트레스: 삽입 회전 수 / 불변식 / 높이 상한");
{
  let seed = 12345;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const t = new AVLTree<number>();
  const ref = new Set<number>();
  let maxInsertRot = 0, maxDeleteRot = 0, maxHeightSeen = 0, maxN = 0;
  let heightAtMax = 0;
  for (let step = 0; step < 20000; step++) {
    const v = Math.floor(rnd() * 500);
    if (rnd() < 0.6) {
      rotationCount = 0;
      const had = ref.has(v);
      t.insert(v); ref.add(v);
      if (!had) maxInsertRot = Math.max(maxInsertRot, rotationCount);
    } else {
      rotationCount = 0;
      const had = ref.has(v);
      t.delete(v); ref.delete(v);
      if (had) maxDeleteRot = Math.max(maxDeleteRot, rotationCount);
    }
    if (!checkInvariant((t as any).root)) { console.log("불변식 위반!", step); break; }
    const arr = t.inOrder();
    if (arr.length !== ref.size) { console.log("size 불일치", step); break; }
    if (t.height() > maxHeightSeen) { maxHeightSeen = t.height(); maxN = t.size(); }
  }
  const sorted = [...ref].sort((a, b) => a - b);
  console.log("최종 inOrder 일치:", JSON.stringify(t.inOrder()) === JSON.stringify(sorted));
  console.log("삽입 최대 회전(단일=1, 이중=2로 계수):", maxInsertRot, "삭제 최대 회전:", maxDeleteRot);
  console.log(`최대 높이 ${maxHeightSeen} (그때 n=${maxN}), 이론 상한 ${(1.4405 * Math.log2(maxN + 2) - 0.3277).toFixed(2)}`);
}

// ---------- 9. |bf| <= k 완화의 높이 상한 비교 ----------
line("9. 균형 기준 완화 비교");
{
  for (const k of [1, 2, 3]) {
    // N_k(h) = N_k(h-1) + N_k(h-1-k) + 1
    const N: number[] = [];
    N[0] = 0;
    for (let hh = 1; hh <= 60; hh++) {
      N[hh] = 1 + (N[hh - 1] ?? 0) + (hh - 1 - k >= 0 ? N[hh - 1 - k]! : 0);
    }
    // n=10^4 를 담을 수 있는 최대 높이 = N(h) <= 10^4 인 최대 h
    let maxH = 0;
    for (let hh = 1; hh <= 60; hh++) if (N[hh]! <= 10000) maxH = hh;
    console.log(`|bf|<=${k}: N(h) 수열 앞부분 ${N.slice(0, 8).join(",")} ... n=10^4일 때 최악 높이 ${maxH}`);
  }
}

// ---------- 10. 완벽 균형 재구성 비용 ----------
line("10. 완벽 균형 유지 비용");
{
  // 정렬된 배열로 완전균형 트리를 매번 재구성하는 방식의 비용: 삽입 1회당 O(n)
  // 1..n 순차 삽입 시 총 재구성 비용(노드 수 합)
  for (const n of [1000, 10000]) {
    let total = 0;
    for (let i = 1; i <= n; i++) total += i;
    console.log(`n=${n}: 매 삽입마다 전체 재구성 → 총 노드 방문 ${total} (≈ n^2/2)`);
  }
}
