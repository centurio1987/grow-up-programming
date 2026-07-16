// ORD-003 Treap 가이드 자기검증용 스크래치. 가이드 본문 코드를 그대로 추출한 것.
// 실행: bun src/data-structures/tree/treap/_scratch/treap.ts

interface TreapNode {
  key: number;
  priority: number;
  left: TreapNode | null;
  right: TreapNode | null;
  size: number;
}

function makeNode(key: number, priority: number): TreapNode {
  return { key, priority, left: null, right: null, size: 1 };
}

function sz(v: TreapNode | null): number {
  return v === null ? 0 : v.size;
}

function pullUp(v: TreapNode): void {
  v.size = sz(v.left) + sz(v.right) + 1;
}

function split(t: TreapNode | null, x: number): [TreapNode | null, TreapNode | null] {
  if (t === null) return [null, null];
  if (t.key < x) {
    const [l, r] = split(t.right, x);
    t.right = l;
    pullUp(t);
    return [t, r];
  } else {
    const [l, r] = split(t.left, x);
    t.left = r;
    pullUp(t);
    return [l, t];
  }
}

function merge(l: TreapNode | null, r: TreapNode | null): TreapNode | null {
  if (l === null) return r;
  if (r === null) return l;
  if (l.priority >= r.priority) {
    l.right = merge(l.right, r);
    pullUp(l);
    return l;
  } else {
    r.left = merge(l, r.left);
    pullUp(r);
    return r;
  }
}

class Treap {
  private root: TreapNode | null = null;
  private priorityFn: () => number;

  constructor(priorityFn: () => number = Math.random) {
    this.priorityFn = priorityFn;
  }

  insert(x: number): void {
    const node = makeNode(x, this.priorityFn());
    const [l, r] = split(this.root, x);
    this.root = merge(merge(l, node), r);
  }

  delete(x: number): void {
    const [l, r] = split(this.root, x);
    const [m, r2] = split(r, x + 1);
    const mReduced = m === null ? null : merge(m.left, m.right);
    this.root = merge(merge(l, mReduced), r2);
  }

  findKth(k: number): number {
    let v = this.root;
    while (v !== null) {
      const ls = sz(v.left);
      if (k <= ls) {
        v = v.left;
      } else if (k === ls + 1) {
        return v.key;
      } else {
        k -= ls + 1;
        v = v.right;
      }
    }
    throw new Error("k out of range");
  }

  // 검증 편의: 내부 구조를 라벨 트리로 dump
  dump(): unknown {
    const rec = (v: TreapNode | null): unknown =>
      v === null ? null : { key: v.key, priority: v.priority, size: v.size, left: rec(v.left), right: rec(v.right) };
    return rec(this.root);
  }
}

// ---------------------------------------------------------------------------
// 1) 가이드 시뮬레이션 시나리오 재현: {3,5,8} (p 3=20,5=30,8=25) 에 insert(1,p=40)
// ---------------------------------------------------------------------------
{
  const t = new Treap();
  // 우선순위를 고정된 순서로 공급: 5, 3, 8, 그다음 insert(1) 때 40
  const priorities = [30, 20, 25, 40];
  let i = 0;
  (t as any).priorityFn = () => priorities[i++];

  t.insert(5); // p30 root
  t.insert(3); // p20
  t.insert(8); // p25

  const before = t.dump();
  console.log("초기 {3,5,8} 구조:", JSON.stringify(before));

  t.insert(1); // p40 -> 새 루트

  const after = t.dump();
  console.log("insert(1) 이후 구조:", JSON.stringify(after));

  const k3 = t.findKth(3);
  console.log("findKth(3) =", k3);
  if (k3 !== 5) throw new Error(`기대값 5, 실제 ${k3}`);

  const k1 = t.findKth(1);
  const k2 = t.findKth(2);
  const k4 = t.findKth(4);
  console.log("findKth(1..4) =", k1, k2, k3, k4);
  if (k1 !== 1 || k2 !== 3 || k3 !== 5 || k4 !== 8) {
    throw new Error(`정렬 순서 불일치: ${k1},${k2},${k3},${k4}`);
  }
}

// ---------------------------------------------------------------------------
// 2) 문제 예시 재현 (treap-problem.md)
// ---------------------------------------------------------------------------
{
  const t = new Treap();
  t.insert(5);
  t.insert(2);
  t.insert(8);
  t.insert(2); // 중복 허용

  const r1 = t.findKth(1);
  const r2 = t.findKth(2);
  const r3 = t.findKth(3);
  const r4 = t.findKth(4);
  console.log("문제 예시 findKth(1..4):", r1, r2, r3, r4);
  if (r1 !== 2 || r2 !== 2 || r3 !== 5 || r4 !== 8) {
    throw new Error(`문제 예시 불일치: ${r1},${r2},${r3},${r4}`);
  }

  t.delete(2); // 하나만 제거 -> {2,5,8}
  const a1 = t.findKth(1);
  const a2 = t.findKth(2);
  console.log("delete(2) 이후 findKth(1,2):", a1, a2);
  if (a1 !== 2 || a2 !== 5) throw new Error(`delete 이후 불일치: ${a1},${a2}`);

  t.delete(999); // 없는 값
  const b1 = t.findKth(1);
  console.log("delete(999, 없음) 이후 findKth(1):", b1);
  if (b1 !== 2) throw new Error(`무시되어야 할 delete가 상태를 바꿈: ${b1}`);

  const t2 = new Treap();
  [-3, 0, -1, 2].forEach((v) => t2.insert(v));
  const n1 = t2.findKth(1);
  const n3 = t2.findKth(3);
  console.log("음수 포함 findKth(1)=", n1, "findKth(3)=", n3);
  if (n1 !== -3 || n3 !== 0) throw new Error(`음수 케이스 불일치: ${n1},${n3}`);
}

// ---------------------------------------------------------------------------
// 3) 엣지 케이스: 모든 키 동일
// ---------------------------------------------------------------------------
{
  const t = new Treap();
  t.insert(7);
  t.insert(7);
  t.insert(7);
  const r1 = t.findKth(1);
  const r2 = t.findKth(2);
  const r3 = t.findKth(3);
  console.log("동일 키 3개 findKth(1..3):", r1, r2, r3);
  if (r1 !== 7 || r2 !== 7 || r3 !== 7) throw new Error("동일 키 케이스 실패");
  t.delete(7);
  const s1 = t.findKth(1);
  const s2 = t.findKth(2);
  console.log("동일 키 delete 후 findKth(1,2):", s1, s2);
  if (s1 !== 7 || s2 !== 7) throw new Error("동일 키 delete 실패");
}

// ---------------------------------------------------------------------------
// 4) 무작위 교차검증: naive 정렬 배열(다중집합) vs Treap
// ---------------------------------------------------------------------------
{
  function seeded(seed: number) {
    let s = seed;
    return () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  }
  const rnd = seeded(42);

  for (let trial = 0; trial < 20; trial++) {
    const t = new Treap(rnd);
    const arr: number[] = [];
    const ops = 300;
    for (let i = 0; i < ops; i++) {
      const roll = rnd();
      if (roll < 0.55 || arr.length === 0) {
        const x = Math.floor(rnd() * 50) - 25;
        t.insert(x);
        arr.push(x);
        arr.sort((a, b) => a - b);
      } else if (roll < 0.8) {
        const idx = Math.floor(rnd() * arr.length);
        const x = arr[idx];
        t.delete(x);
        const pos = arr.indexOf(x);
        arr.splice(pos, 1);
      } else {
        if (arr.length > 0) {
          const k = 1 + Math.floor(rnd() * arr.length);
          const expected = arr[k - 1];
          const actual = t.findKth(k);
          if (actual !== expected) {
            throw new Error(
              `trial ${trial} op ${i}: findKth(${k}) 기대 ${expected}, 실제 ${actual}, arr=${JSON.stringify(arr)}`,
            );
          }
        }
      }
    }
    // 최종 전수 비교
    for (let k = 1; k <= arr.length; k++) {
      const expected = arr[k - 1];
      const actual = t.findKth(k);
      if (actual !== expected) {
        throw new Error(`trial ${trial} 최종 검증 실패: findKth(${k}) 기대 ${expected}, 실제 ${actual}`);
      }
    }
  }
  console.log("무작위 교차검증 20회 통과 (각 300 연산)");
}

console.log("모든 검증 통과");

// ---------------------------------------------------------------------------
// 5) naive BST(회전 없음) 퇴화 vs Treap 높이 비교 — 가이드 본문 수치 근거
// ---------------------------------------------------------------------------
{
  interface BstNode {
    key: number;
    left: BstNode | null;
    right: BstNode | null;
  }
  function bstInsert(root: BstNode | null, key: number): BstNode {
    if (root === null) return { key, left: null, right: null };
    if (key < root.key) root.left = bstInsert(root.left, key);
    else root.right = bstInsert(root.right, key);
    return root;
  }
  function height(v: BstNode | null): number {
    return v === null ? 0 : 1 + Math.max(height(v.left), height(v.right));
  }
  function treapHeight(v: TreapNode | null): number {
    return v === null ? 0 : 1 + Math.max(treapHeight(v.left), treapHeight(v.right));
  }

  const n = 1000;
  let bstRoot: BstNode | null = null;
  for (let i = 1; i <= n; i++) bstRoot = bstInsert(bstRoot, i); // 정렬된 입력
  const bstH = height(bstRoot);

  function seeded(seed: number) {
    let s = seed;
    return () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  }
  const t = new Treap(seeded(7));
  for (let i = 1; i <= n; i++) t.insert(i); // 같은 정렬된 입력
  const treapH = treapHeight((t as any).root);

  console.log(`n=${n} 정렬 입력: naive BST 높이=${bstH}, Treap 높이=${treapH}, log2(n)≈${Math.log2(n).toFixed(1)}`);
}

// ---------------------------------------------------------------------------
// 6) split 예시(가이드 본문 삽입용): {3,5,8}(p 3=20,5=30,8=25)를 x=5로 split
// ---------------------------------------------------------------------------
{
  const n3 = makeNode(3, 20);
  const n5 = makeNode(5, 30);
  const n8 = makeNode(8, 25);
  n5.left = n3;
  n5.right = n8;
  pullUp(n3);
  pullUp(n8);
  pullUp(n5);
  const [L, R] = split(n5, 5);
  const rec = (v: TreapNode | null): unknown =>
    v === null ? null : { key: v.key, p: v.priority, size: v.size, left: rec(v.left), right: rec(v.right) };
  console.log("split({3,5,8}, x=5) L=", JSON.stringify(rec(L)));
  console.log("split({3,5,8}, x=5) R=", JSON.stringify(rec(R)));
}

// ---------------------------------------------------------------------------
// 7) merge 예시(가이드 본문 삽입용): L={3}(p20), R={5,8}(p30,p25) 병합
// ---------------------------------------------------------------------------
{
  const n3 = makeNode(3, 20);
  const n5 = makeNode(5, 30);
  const n8 = makeNode(8, 25);
  n5.right = n8;
  pullUp(n8);
  pullUp(n5);
  const merged = merge(n3, n5);
  const rec = (v: TreapNode | null): unknown =>
    v === null ? null : { key: v.key, p: v.priority, size: v.size, left: rec(v.left), right: rec(v.right) };
  console.log("merge(L={3,p20}, R={5,8})=", JSON.stringify(rec(merged)));
}

// ---------------------------------------------------------------------------
// 8) delete 예시(가이드 본문 삽입용): {1,3,5,8}(p 1=40,5=30,3=20,8=25)에서 delete(5)
// ---------------------------------------------------------------------------
{
  const n3 = makeNode(3, 20);
  const n5 = makeNode(5, 30);
  const n8 = makeNode(8, 25);
  n5.left = n3;
  n5.right = n8;
  pullUp(n3); pullUp(n8); pullUp(n5);
  const n1 = makeNode(1, 40);
  n1.right = n5;
  pullUp(n1);

  const t = new Treap();
  (t as any).root = n1;
  console.log("delete 전:", JSON.stringify((t as any).dump()));
  t.delete(5);
  console.log("delete(5) 후:", JSON.stringify((t as any).dump()));
  const check = [t.findKth(1), t.findKth(2), t.findKth(3)];
  console.log("delete(5) 후 findKth(1..3) =", check);
  if (JSON.stringify(check) !== JSON.stringify([1, 3, 8])) throw new Error("delete(5) 결과 불일치");
}

// ---------------------------------------------------------------------------
// 9) 함정 재현: delete에서 두 번째 split 기준을 x+1 대신 x로 쓰면?
// ---------------------------------------------------------------------------
{
  function wrongDelete(root: TreapNode | null, x: number): TreapNode | null {
    const [l, r] = split(root, x);
    const [m, r2] = split(r, x); // 오답: x+1이어야 하는데 x를 씀
    const mReduced = m === null ? null : merge(m.left, m.right);
    return merge(merge(l, mReduced), r2);
  }
  let root: TreapNode | null = null;
  const priorities = [10, 11, 9, 8]; // 2,2,5,8 순서로 삽입
  let i = 0;
  const vals = [2, 2, 5, 8];
  for (const v of vals) {
    const node = makeNode(v, priorities[i++]);
    const [l, r] = split(root, v);
    root = merge(merge(l, node), r);
  }
  const before = (function dumpKeys(v: TreapNode | null, out: number[]): number[] {
    if (v === null) return out;
    dumpKeys(v.left, out);
    out.push(v.key);
    dumpKeys(v.right, out);
    return out;
  })(root, []);
  console.log("delete 전 정렬 키:", before);

  root = wrongDelete(root, 2);
  const after = (function dumpKeys(v: TreapNode | null, out: number[]): number[] {
    if (v === null) return out;
    dumpKeys(v.left, out);
    out.push(v.key);
    dumpKeys(v.right, out);
    return out;
  })(root, []);
  console.log("오답 delete(2, 두 번째 split 기준=x) 후 정렬 키:", after);
  if (JSON.stringify(after) !== JSON.stringify(before)) {
    throw new Error("예상: 오답 버전은 아무것도 지우지 못해 before와 동일해야 함");
  }
  console.log("함정 재현 확인: 오답 버전은 delete(2) 호출에도 원소가 전혀 줄지 않음 (기대대로)");
}

// ---------------------------------------------------------------------------
// 10) 함정 재현: pullUp을 생략하면 findKth가 틀린다
// ---------------------------------------------------------------------------
{
  function splitNoPullUp(t: TreapNode | null, x: number): [TreapNode | null, TreapNode | null] {
    if (t === null) return [null, null];
    if (t.key < x) {
      const [l, r] = splitNoPullUp(t.right, x);
      t.right = l;
      // pullUp(t) 생략!
      return [t, r];
    } else {
      const [l, r] = splitNoPullUp(t.left, x);
      t.left = r;
      // pullUp(t) 생략!
      return [l, t];
    }
  }
  // {1,3,5,8} (p 1=40,5=30,3=20,8=25) 구조에서 x=5로 split (pullUp 없이)
  const n3 = makeNode(3, 20);
  const n5 = makeNode(5, 30);
  const n8 = makeNode(8, 25);
  n5.left = n3; n5.right = n8; pullUp(n3); pullUp(n8); pullUp(n5);
  const n1 = makeNode(1, 40);
  n1.right = n5; pullUp(n1);

  const [L] = splitNoPullUp(n1, 5); // L = {1, 3} 이어야 함
  console.log("pullUp 생략 후 L(={1,3} 이어야 함).size =", L?.size, "(정상이면 2)");
  if (L?.size === 2) throw new Error("이 케이스는 실제로 size가 틀어져야 함 — 재현 실패");

  // size가 틀린 채로 findKth(2) 호출 -> 잘못된 경로로 감
  function findKthBroken(v: TreapNode | null, k: number): number {
    while (v !== null) {
      const ls = sz(v.left);
      if (k <= ls) v = v.left;
      else if (k === ls + 1) return v.key;
      else { k -= ls + 1; v = v.right; }
    }
    throw new Error("범위 밖");
  }
  const wrong = findKthBroken(L, 2); // 정상이면 3, size가 틀리면 엉뚱한 값/예외
  console.log("pullUp 생략 상태에서 findKth(L, 2) =", wrong, "(정상 코드라면 3이어야 함)");
}
