// B-트리 구현 함정의 "구체적 잘못된 값" 실측

type Mode = "ok" | "mergeOrder" | "noRootCollapse" | "postSplitOnly";

class N<T> { keys: T[] = []; children: N<T>[] = []; isLeaf = true; }

class BT<T> {
  root: N<T> | undefined;
  private _size = 0;
  constructor(public t: number, private mode: Mode = "ok", private cmp: (a: T, b: T) => number = (a, b) => (a < b ? -1 : a > b ? 1 : 0)) {}
  size() { return this._size; }
  has(v: T): boolean { return this.find(this.root, v); }
  private find(n: N<T> | undefined, v: T): boolean {
    if (!n) return false;
    let i = 0;
    while (i < n.keys.length && this.cmp(v, n.keys[i]!) > 0) i++;
    if (i < n.keys.length && this.cmp(v, n.keys[i]!) === 0) return true;
    return n.isLeaf ? false : this.find(n.children[i], v);
  }
  insert(v: T): void {
    if (this.has(v)) return;
    if (!this.root) { const r = new N<T>(); r.keys = [v]; this.root = r; this._size = 1; return; }
    if (this.root.keys.length === 2 * this.t - 1) {
      const old = this.root; const nr = new N<T>(); nr.isLeaf = false; nr.children = [old];
      this.split(nr, 0); this.root = nr;
    }
    this.insertNonFull(this.root, v);
    this._size++;
  }
  private split(p: N<T>, i: number): void {
    const t = this.t; const c = p.children[i]!; const mid = c.keys[t - 1]!;
    const r = new N<T>(); r.isLeaf = c.isLeaf; r.keys = c.keys.slice(t);
    if (!c.isLeaf) r.children = c.children.slice(t);
    c.keys = c.keys.slice(0, t - 1);
    if (!c.isLeaf) c.children = c.children.slice(0, t);
    p.keys.splice(i, 0, mid); p.children.splice(i + 1, 0, r);
  }
  private insertNonFull(n: N<T>, v: T): void {
    let i = n.keys.length - 1;
    if (n.isLeaf) { while (i >= 0 && this.cmp(v, n.keys[i]!) < 0) i--; n.keys.splice(i + 1, 0, v); return; }
    while (i >= 0 && this.cmp(v, n.keys[i]!) < 0) i--;
    i++;
    if (n.children[i]!.keys.length === 2 * this.t - 1) {
      this.split(n, i);
      if (this.cmp(v, n.keys[i]!) > 0) i++;
    }
    this.insertNonFull(n.children[i]!, v);
  }
  delete(v: T): boolean {
    if (!this.root || !this.has(v)) return false;
    this.del(this.root, v);
    if (this.mode !== "noRootCollapse" && this.root.keys.length === 0) {
      this.root = this.root.isLeaf ? undefined : this.root.children[0];
    }
    this._size--;
    return true;
  }
  private del(n: N<T>, v: T): void {
    const t = this.t;
    let i = 0;
    while (i < n.keys.length && this.cmp(v, n.keys[i]!) > 0) i++;
    if (i < n.keys.length && this.cmp(v, n.keys[i]!) === 0) {
      if (n.isLeaf) { n.keys.splice(i, 1); return; }
      const L = n.children[i]!, R = n.children[i + 1]!;
      if (L.keys.length >= t) { const p = this.maxK(L); n.keys[i] = p; this.del(L, p); }
      else if (R.keys.length >= t) { const s = this.minK(R); n.keys[i] = s; this.del(R, s); }
      else { this.merge(n, i); this.del(L, v); }
      return;
    }
    if (n.isLeaf) return;
    const c = n.children[i]!;
    if (c.keys.length === t - 1) {
      this.fix(n, i);
      let j = 0; while (j < n.keys.length && this.cmp(v, n.keys[j]!) > 0) j++;
      this.del(n.children[j]!, v);
    } else this.del(c, v);
  }
  private fix(n: N<T>, i: number): void {
    const t = this.t;
    if (i > 0 && n.children[i - 1]!.keys.length >= t) this.rotR(n, i);
    else if (i < n.children.length - 1 && n.children[i + 1]!.keys.length >= t) this.rotL(n, i);
    else if (i < n.children.length - 1) this.merge(n, i);
    else this.merge(n, i - 1);
  }
  private rotR(n: N<T>, i: number): void {
    const c = n.children[i]!, s = n.children[i - 1]!;
    c.keys.unshift(n.keys[i - 1]!); n.keys[i - 1] = s.keys.pop()!;
    if (!c.isLeaf) c.children.unshift(s.children.pop()!);
  }
  private rotL(n: N<T>, i: number): void {
    const c = n.children[i]!, s = n.children[i + 1]!;
    c.keys.push(n.keys[i]!); n.keys[i] = s.keys.shift()!;
    if (!c.isLeaf) c.children.push(s.children.shift()!);
  }
  private merge(n: N<T>, i: number): void {
    const L = n.children[i]!, R = n.children[i + 1]!;
    if (this.mode === "mergeOrder") L.keys.push(...R.keys, n.keys[i]!); // 버그: 오른쪽 먼저, 부모 키 나중
    else L.keys.push(n.keys[i]!, ...R.keys);
    if (!L.isLeaf) L.children.push(...R.children);
    n.keys.splice(i, 1); n.children.splice(i + 1, 1);
  }
  private minK(n: N<T>): T { let c = n; while (!c.isLeaf) c = c.children[0]!; return c.keys[0]!; }
  private maxK(n: N<T>): T { let c = n; while (!c.isLeaf) c = c.children[c.children.length - 1]!; return c.keys[c.keys.length - 1]!; }
  inOrder(): T[] {
    const out: T[] = [];
    const walk = (n: N<T> | undefined) => {
      if (!n) return;
      for (let i = 0; i < n.keys.length; i++) { if (!n.isLeaf) walk(n.children[i]); out.push(n.keys[i]!); }
      if (!n.isLeaf) walk(n.children[n.keys.length]);
    };
    walk(this.root);
    return out;
  }
}

function show<T>(n: N<T> | undefined, d = 0): string {
  if (!n) return "(empty)";
  let s = "  ".repeat(d) + "[" + n.keys.join(", ") + "]";
  for (const c of n.children) s += "\n" + show(c, d + 1);
  return s;
}

console.log("=== A. mergeChildren 순서 버그 (오른쪽 키 먼저, 부모 키 나중) ===");
{
  const ok = new BT<number>(2, "ok");
  const bug = new BT<number>(2, "mergeOrder");
  for (const v of [1, 2, 3, 4, 5, 6, 7]) { ok.insert(v); bug.insert(v); }
  ok.delete(2); bug.delete(2);
  console.log("정상 delete(2):"); console.log(show(ok.root));
  console.log("정상 inOrder:", ok.inOrder());
  console.log("버그 delete(2):"); console.log(show(bug.root));
  console.log("버그 inOrder:", bug.inOrder());
  console.log("버그 has(1):", bug.has(1), " has(3):", bug.has(3));
}

console.log("\n=== B. 루트 붕괴 처리를 빼면 ===");
{
  const bug = new BT<number>(2, "noRootCollapse");
  for (const v of [1, 2, 3, 4, 5]) bug.insert(v);
  for (const v of [4, 5, 1]) bug.delete(v);
  console.log("delete(4),delete(5),delete(1) 후 구조:");
  console.log(show(bug.root));
  console.log("inOrder:", bug.inOrder(), " has(2):", bug.has(2), " has(3):", bug.has(3));
  const ok = new BT<number>(2, "ok");
  for (const v of [1, 2, 3, 4, 5]) ok.insert(v);
  for (const v of [4, 5, 1]) ok.delete(v);
  console.log("정상:", show(ok.root), " has(3):", ok.has(3));
}

console.log("\n=== C. 사후 분할(원형)에서 상향 전파가 실제로 몇 단계나 올라가는가 ===");
{
  // t=2, 1..n 순차 삽입에서 "리프가 넘쳐 분할 → 부모도 넘쳐 분할 → ..." 연쇄 길이 측정
  // 선제 분할에서는 연쇄가 0이다(내려가면서 이미 다 쪼갰으므로).
  type P = { keys: number[]; children: P[]; isLeaf: boolean };
  const t = 2;
  let root: P = { keys: [], children: [], isLeaf: true };
  let maxChain = 0;
  const insertPost = (node: P, v: number): { key: number; right: P } | undefined => {
    if (node.isLeaf) {
      let i = node.keys.length - 1;
      while (i >= 0 && v < node.keys[i]!) i--;
      node.keys.splice(i + 1, 0, v);
    } else {
      let i = 0;
      while (i < node.keys.length && v > node.keys[i]!) i++;
      const promoted = insertPost(node.children[i]!, v);
      if (promoted) { node.keys.splice(i, 0, promoted.key); node.children.splice(i + 1, 0, promoted.right); }
    }
    if (node.keys.length > 2 * t - 1) {
      const mid = node.keys[t]!;
      const right: P = { keys: node.keys.slice(t + 1), children: node.isLeaf ? [] : node.children.slice(t + 1), isLeaf: node.isLeaf };
      node.keys = node.keys.slice(0, t);
      if (!node.isLeaf) node.children = node.children.slice(0, t + 1);
      return { key: mid, right };
    }
    return undefined;
  };
  let chainNow = 0;
  const insertTop = (v: number) => {
    chainNow = 0;
    const p = insertPost(root, v);
    if (p) { root = { keys: [p.key], children: [root, p.right], isLeaf: false }; }
  };
  // 연쇄 길이는 별도로 계측하기 번거로우니, 트리 높이가 늘어난 횟수로 대신 본다
  let prevH = 1;
  const height = (n: P): number => (n.isLeaf ? 1 : 1 + height(n.children[0]!));
  let grows = 0;
  for (let v = 1; v <= 1000; v++) {
    insertTop(v);
    const hh = height(root);
    if (hh > prevH) { grows++; prevH = hh; }
  }
  console.log(`사후 분할 방식으로 1..1000 삽입: 최종 높이 ${height(root)}, 루트 분할(높이 증가) ${grows}회`);
  console.log("→ 어느 방식이든 높이는 같다. 차이는 '분할 정보를 부모로 되돌려 주는 반환값 배관'의 유무다.");
}
