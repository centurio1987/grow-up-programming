// B-Tree 가이드 ORD-005 재집필용 실측 검증 스크래치

class BTreeNode<T> {
  keys: T[] = [];
  children: BTreeNode<T>[] = [];
  isLeaf = true;
}

export class BTree<T> {
  root: BTreeNode<T> | undefined = undefined;
  private _size = 0;
  t: number;
  private compare: (a: T, b: T) => number;
  // 계측용
  splitCount = 0;
  mergeCount = 0;
  rotateCount = 0;
  buggyDescend = false; // insertNonFull에서 i++ 줄을 뺀 버그 재현 스위치

  constructor(t: number = 3, comparator?: (a: T, b: T) => number) {
    if (t < 2) throw new Error("t must be >= 2");
    this.t = t;
    this.compare = comparator ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  size(): number { return this._size; }

  has(value: T): boolean { return this.findNode(this.root, value) !== undefined; }

  private findNode(node: BTreeNode<T> | undefined, value: T): BTreeNode<T> | undefined {
    if (node === undefined) return undefined;
    let i = 0;
    while (i < node.keys.length && this.compare(value, node.keys[i]!) > 0) i++;
    if (i < node.keys.length && this.compare(value, node.keys[i]!) === 0) return node;
    if (node.isLeaf) return undefined;
    return this.findNode(node.children[i], value);
  }

  insert(value: T): void {
    if (this.has(value)) return;
    if (this.root === undefined) {
      const root = new BTreeNode<T>();
      root.keys = [value];
      this.root = root;
      this._size = 1;
      return;
    }
    if (this.root.keys.length === 2 * this.t - 1) {
      const oldRoot = this.root;
      const newRoot = new BTreeNode<T>();
      newRoot.isLeaf = false;
      newRoot.children = [oldRoot];
      this.splitChild(newRoot, 0);
      this.root = newRoot;
    }
    this.insertNonFull(this.root, value);
    this._size++;
  }

  private splitChild(parent: BTreeNode<T>, i: number): void {
    this.splitCount++;
    const t = this.t;
    const child = parent.children[i]!;
    const midKey = child.keys[t - 1]!;
    const right = new BTreeNode<T>();
    right.isLeaf = child.isLeaf;
    right.keys = child.keys.slice(t);
    if (!child.isLeaf) right.children = child.children.slice(t);
    child.keys = child.keys.slice(0, t - 1);
    if (!child.isLeaf) child.children = child.children.slice(0, t);
    parent.keys.splice(i, 0, midKey);
    parent.children.splice(i + 1, 0, right);
  }

  private insertNonFull(node: BTreeNode<T>, value: T): void {
    let i = node.keys.length - 1;
    if (node.isLeaf) {
      while (i >= 0 && this.compare(value, node.keys[i]!) < 0) i--;
      node.keys.splice(i + 1, 0, value);
      return;
    }
    while (i >= 0 && this.compare(value, node.keys[i]!) < 0) i--;
    i++;
    if (node.children[i]!.keys.length === 2 * this.t - 1) {
      this.splitChild(node, i);
      if (!this.buggyDescend && this.compare(value, node.keys[i]!) > 0) i++;
    }
    this.insertNonFull(node.children[i]!, value);
  }

  delete(value: T): boolean {
    if (this.root === undefined || !this.has(value)) return false;
    this.deleteHelper(this.root, value);
    if (this.root.keys.length === 0) {
      this.root = this.root.isLeaf ? undefined : this.root.children[0];
    }
    this._size--;
    return true;
  }

  private deleteHelper(node: BTreeNode<T>, value: T): void {
    const t = this.t;
    let i = 0;
    while (i < node.keys.length && this.compare(value, node.keys[i]!) > 0) i++;
    if (i < node.keys.length && this.compare(value, node.keys[i]!) === 0) {
      if (node.isLeaf) { node.keys.splice(i, 1); return; }
      const left = node.children[i]!;
      const right = node.children[i + 1]!;
      if (left.keys.length >= t) {
        const pred = this.maxKey(left);
        node.keys[i] = pred;
        this.deleteHelper(left, pred);
      } else if (right.keys.length >= t) {
        const succ = this.minKey(right);
        node.keys[i] = succ;
        this.deleteHelper(right, succ);
      } else {
        this.mergeChildren(node, i);
        this.deleteHelper(left, value);
      }
      return;
    }
    if (node.isLeaf) return;
    const child = node.children[i]!;
    if (child.keys.length === t - 1) {
      this.fixup(node, i);
      let j = 0;
      while (j < node.keys.length && this.compare(value, node.keys[j]!) > 0) j++;
      this.deleteHelper(node.children[j]!, value);
    } else {
      this.deleteHelper(child, value);
    }
  }

  private fixup(node: BTreeNode<T>, i: number): void {
    const t = this.t;
    if (i > 0 && node.children[i - 1]!.keys.length >= t) this.rotateRight(node, i);
    else if (i < node.children.length - 1 && node.children[i + 1]!.keys.length >= t) this.rotateLeft(node, i);
    else if (i < node.children.length - 1) this.mergeChildren(node, i);
    else this.mergeChildren(node, i - 1);
  }

  private rotateRight(node: BTreeNode<T>, i: number): void {
    this.rotateCount++;
    const child = node.children[i]!;
    const leftSibling = node.children[i - 1]!;
    child.keys.unshift(node.keys[i - 1]!);
    node.keys[i - 1] = leftSibling.keys.pop()!;
    if (!child.isLeaf) child.children.unshift(leftSibling.children.pop()!);
  }

  private rotateLeft(node: BTreeNode<T>, i: number): void {
    this.rotateCount++;
    const child = node.children[i]!;
    const rightSibling = node.children[i + 1]!;
    child.keys.push(node.keys[i]!);
    node.keys[i] = rightSibling.keys.shift()!;
    if (!child.isLeaf) child.children.push(rightSibling.children.shift()!);
  }

  private mergeChildren(node: BTreeNode<T>, i: number): void {
    this.mergeCount++;
    const left = node.children[i]!;
    const right = node.children[i + 1]!;
    left.keys.push(node.keys[i]!, ...right.keys);
    if (!left.isLeaf) left.children.push(...right.children);
    node.keys.splice(i, 1);
    node.children.splice(i + 1, 1);
  }

  private minKey(node: BTreeNode<T>): T {
    let cur = node;
    while (!cur.isLeaf) cur = cur.children[0]!;
    return cur.keys[0]!;
  }

  private maxKey(node: BTreeNode<T>): T {
    let cur = node;
    while (!cur.isLeaf) cur = cur.children[cur.children.length - 1]!;
    return cur.keys[cur.keys.length - 1]!;
  }

  inOrder(): T[] {
    const result: T[] = [];
    const walk = (node: BTreeNode<T> | undefined) => {
      if (node === undefined) return;
      for (let i = 0; i < node.keys.length; i++) {
        if (!node.isLeaf) walk(node.children[i]);
        result.push(node.keys[i]!);
      }
      if (!node.isLeaf) walk(node.children[node.keys.length]);
    };
    walk(this.root);
    return result;
  }
}

// ---------- 도구 ----------
function show<T>(node: BTreeNode<T> | undefined, depth = 0): string {
  if (!node) return "(empty)\n";
  let s = "  ".repeat(depth) + "[" + node.keys.join(", ") + "]" + (node.isLeaf ? "" : "") + "\n";
  for (const c of node.children) s += show(c, depth + 1);
  return s;
}

function checkInvariants<T>(tree: BTree<T>): string[] {
  const errs: string[] = [];
  const t = tree.t;
  const leafDepths = new Set<number>();
  const walk = (node: BTreeNode<T> | undefined, depth: number, isRoot: boolean, lo: T | undefined, hi: T | undefined) => {
    if (!node) return;
    const k = node.keys.length;
    if (isRoot) { if (k < 1 || k > 2 * t - 1) errs.push(`루트 키 수 위반: ${k}`); }
    else if (k < t - 1 || k > 2 * t - 1) errs.push(`비루트 키 수 위반: ${k} (depth ${depth})`);
    for (let i = 1; i < k; i++) if (!((node.keys[i - 1] as any) < (node.keys[i] as any))) errs.push("노드 내부 정렬 위반");
    if (lo !== undefined && !((lo as any) < (node.keys[0] as any))) errs.push("경계 위반(lo)");
    if (hi !== undefined && !((node.keys[k - 1] as any) < (hi as any))) errs.push("경계 위반(hi)");
    if (node.isLeaf) { if (node.children.length !== 0) errs.push("리프에 자식 존재"); leafDepths.add(depth); }
    else {
      if (node.children.length !== k + 1) errs.push(`자식 수 위반: ${node.children.length} vs 키 ${k}`);
      for (let i = 0; i <= k; i++) {
        walk(node.children[i], depth + 1, false, i === 0 ? lo : node.keys[i - 1], i === k ? hi : node.keys[i]);
      }
    }
  };
  walk(tree.root, 0, true, undefined, undefined);
  if (leafDepths.size > 1) errs.push(`리프 깊이 불일치: ${[...leafDepths].join(",")}`);
  return errs;
}

const line = (s: string) => console.log("\n===== " + s + " =====");

// ---------- 1. t=2, 1..7 삽입 단계별 ----------
line("1. t=2, 1..7 단계별");
{
  const tr = new BTree<number>(2);
  for (let i = 1; i <= 7; i++) {
    tr.insert(i);
    console.log(`insert(${i}) 후 (split 누적 ${tr.splitCount}):`);
    console.log(show(tr.root).trimEnd());
  }
  console.log("inOrder:", tr.inOrder(), "size:", tr.size());
  console.log("불변식:", checkInvariants(tr));
  console.log("--- delete(2) ---");
  tr.delete(2);
  console.log(show(tr.root).trimEnd());
  console.log("inOrder:", tr.inOrder(), "size:", tr.size(), "merge 누적:", tr.mergeCount);
  console.log("불변식:", checkInvariants(tr));
}

// ---------- 2. 버그 재현: insertNonFull의 i++ 제거 ----------
line("2. i++ 제거 버그");
{
  const tr = new BTree<number>(2);
  tr.buggyDescend = true;
  for (let i = 1; i <= 7; i++) tr.insert(i);
  console.log(show(tr.root).trimEnd());
  console.log("inOrder:", tr.inOrder());
  for (const v of [1, 2, 3, 4, 5, 6, 7]) console.log(`  has(${v}) = ${tr.has(v)}`);
  console.log("불변식 검사:", checkInvariants(tr));
}

// ---------- 3. 문제 예시 t=3 ----------
line("3. t=3 문제 예시");
{
  const tr = new BTree<number>(3);
  for (const v of [10, 20, 5, 6, 12, 30, 7, 17]) {
    tr.insert(v);
    console.log(`insert(${v}) → ${show(tr.root).trim().replace(/\n\s*/g, " | ")}`);
  }
  console.log("has(6)", tr.has(6), "has(99)", tr.has(99), "size", tr.size(), "inOrder", tr.inOrder());
  console.log("split 횟수:", tr.splitCount);
  tr.delete(6); tr.delete(12);
  console.log("delete(6),delete(12) →", tr.inOrder());
  console.log(show(tr.root).trimEnd());
  console.log("불변식:", checkInvariants(tr));
}

// ---------- 4. 루트 붕괴 시나리오 ----------
line("4. 루트 붕괴 (t=2)");
{
  const tr = new BTree<number>(2);
  for (const v of [1, 2, 3, 4, 5]) tr.insert(v);
  console.log("insert 1..5:"); console.log(show(tr.root).trimEnd());
  for (const v of [4, 5, 1]) {
    tr.delete(v);
    console.log(`delete(${v}):`); console.log(show(tr.root).trimEnd());
  }
  console.log("불변식:", checkInvariants(tr));
}

// ---------- 5. 무작위 스트레스 ----------
line("5. 무작위 스트레스");
{
  let seed = 987654321;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  for (const t of [2, 3, 5]) {
    const tr = new BTree<number>(t);
    const ref = new Set<number>();
    let bad = 0;
    for (let step = 0; step < 8000; step++) {
      const v = Math.floor(rnd() * 300);
      if (rnd() < 0.6) { tr.insert(v); ref.add(v); }
      else { const a = tr.delete(v); const b = ref.delete(v); if (a !== b) { console.log("delete 반환 불일치", step); bad++; break; } }
      const errs = checkInvariants(tr);
      if (errs.length) { console.log(`t=${t} step ${step} 불변식 위반:`, errs); bad++; break; }
    }
    const sorted = [...ref].sort((a, b) => a - b);
    console.log(`t=${t}: inOrder 일치 ${JSON.stringify(tr.inOrder()) === JSON.stringify(sorted)}, size 일치 ${tr.size() === ref.size}, 위반 ${bad}`);
  }
}

// ---------- 6. 높이·접근 횟수 수치 ----------
line("6. 높이 상한 수치");
{
  const worstHeight = (n: number, t: number) => Math.floor(Math.log((n + 1) / 2) / Math.log(t));
  for (const [n, label] of [[1e4, "10^4"], [1e8, "10^8"], [1e9, "10^9"]] as [number, string][]) {
    const parts = [2, 3, 10, 100, 1000].map((t) => `t=${t}: ${worstHeight(n, t)}`).join("  ");
    console.log(`n=${label}  ${parts}   (이진트리 log2 n = ${Math.log2(n).toFixed(1)})`);
  }
  console.log("\n실제 최대 높이(간선 수) 측정: 1..n 순차 삽입");
  for (const t of [2, 3, 10, 100]) {
    for (const n of [10000]) {
      const tr = new BTree<number>(t);
      for (let i = 1; i <= n; i++) tr.insert(i);
      let d = 0; let cur = tr.root!;
      while (!cur.isLeaf) { cur = cur.children[0]!; d++; }
      console.log(`  t=${t}, n=${n}: 실제 높이(간선) ${d}, 상한 ${worstHeight(n, t)}, 루트 키수 ${tr.root!.keys.length}, split ${tr.splitCount}`);
    }
  }
}

// ---------- 7. 정렬 배열/이진트리 대조 수치 ----------
line("7. 순진한 설계 대조 수치");
{
  const n = 1e8;
  console.log(`n=${n}:`);
  console.log(`  정렬 배열 이진 탐색 비교 횟수 = ${Math.ceil(Math.log2(n))}`);
  console.log(`  정렬 배열 삽입 시 평균 이동 원소 수 = ${n / 2}`);
  console.log(`  균형 이진 트리 높이 = ${Math.ceil(Math.log2(n))} → 노드 접근 ${Math.ceil(Math.log2(n))}회`);
  const worstHeight = (nn: number, t: number) => Math.floor(Math.log((nn + 1) / 2) / Math.log(t));
  console.log(`  B-트리 t=100 최악 높이 = ${worstHeight(n, 100)} → 노드 접근 ${worstHeight(n, 100) + 1}회`);
  console.log(`  4KB 페이지, 키 8B + 자식 포인터 8B: 노드당 키 수 ≈ ${Math.floor(4096 / 16)} → t ≈ ${Math.floor(4096 / 16 / 2)}`);
  console.log(`  16KB 페이지 → 키 수 ≈ ${Math.floor(16384 / 16)}`);
  console.log(`  이진 트리 노드(키8B+자식포인터16B=24B)를 4KB 페이지에 담을 때 사용률 = ${(24 / 4096 * 100).toFixed(2)}%`);
  console.log(`  디스크 I/O 10ms 가정: 27회 = ${27 * 10}ms, 5회 = ${5 * 10}ms`);
}
