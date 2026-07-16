type Compare<T> = (a: T, b: T) => number;

class TwoThreeNode<T> {
  keys: T[];
  children: TwoThreeNode<T>[];

  constructor(keys: T[] = [], children: TwoThreeNode<T>[] = []) {
    this.keys = keys;
    this.children = children;
  }

  get isLeaf(): boolean {
    return this.children.length === 0;
  }
}

type SplitResult<T> = { promoted: T; left: TwoThreeNode<T>; right: TwoThreeNode<T> };

class TwoThreeTree<T> {
  private root: TwoThreeNode<T> | undefined = undefined;
  private _size = 0;
  private compare: Compare<T>;

  constructor(comparator?: Compare<T>) {
    this.compare = comparator ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  has(value: T): boolean {
    let node = this.root;
    while (node !== undefined) {
      let i = 0;
      while (i < node.keys.length) {
        const cmp = this.compare(value, node.keys[i]!);
        if (cmp === 0) return true;
        if (cmp < 0) break;
        i++;
      }
      if (node.isLeaf) return false;
      node = node.children[i];
    }
    return false;
  }

  insert(value: T): void {
    if (this.has(value)) return; // 중복 무시

    if (this.root === undefined) {
      this.root = new TwoThreeNode<T>([value]);
      this._size = 1;
      return;
    }

    const split = this.insertInto(this.root, value);
    if (split !== undefined) {
      this.root = new TwoThreeNode<T>([split.promoted], [split.left, split.right]);
    }
    this._size++;
  }

  private insertInto(node: TwoThreeNode<T>, value: T): SplitResult<T> | undefined {
    if (node.isLeaf) {
      let i = 0;
      while (i < node.keys.length && this.compare(node.keys[i]!, value) < 0) i++;
      node.keys.splice(i, 0, value);
      if (node.keys.length <= 2) return undefined;
      return this.splitLeaf(node);
    }

    let i = 0;
    while (i < node.keys.length && this.compare(value, node.keys[i]!) > 0) i++;
    const split = this.insertInto(node.children[i]!, value);
    if (split === undefined) return undefined;

    node.keys.splice(i, 0, split.promoted);
    node.children.splice(i, 1, split.left, split.right);
    if (node.keys.length <= 2) return undefined;
    return this.splitInternal(node);
  }

  private splitLeaf(node: TwoThreeNode<T>): SplitResult<T> {
    const [k0, k1, k2] = node.keys as [T, T, T];
    return { promoted: k1, left: new TwoThreeNode<T>([k0]), right: new TwoThreeNode<T>([k2]) };
  }

  private splitInternal(node: TwoThreeNode<T>): SplitResult<T> {
    const [k0, k1, k2] = node.keys as [T, T, T];
    const [c0, c1, c2, c3] = node.children as [
      TwoThreeNode<T>, TwoThreeNode<T>, TwoThreeNode<T>, TwoThreeNode<T>,
    ];
    return {
      promoted: k1,
      left: new TwoThreeNode<T>([k0], [c0, c1]),
      right: new TwoThreeNode<T>([k2], [c2, c3]),
    };
  }

  delete(value: T): boolean {
    if (this.root === undefined || !this.has(value)) return false;

    this.deleteFrom(this.root, value);
    if (this.root.keys.length === 0) {
      this.root = this.root.isLeaf ? undefined : this.root.children[0];
    }
    this._size--;
    return true;
  }

  private deleteFrom(node: TwoThreeNode<T>, value: T): void {
    if (node.isLeaf) {
      const idx = node.keys.findIndex((k) => this.compare(k, value) === 0);
      node.keys.splice(idx, 1);
      return;
    }

    const idx = node.keys.findIndex((k) => this.compare(k, value) === 0);
    if (idx !== -1) {
      // 내부 노드에서 발견: 중위 후속자로 대체 후 후속자를 리프에서 삭제
      let succNode = node.children[idx + 1]!;
      while (!succNode.isLeaf) succNode = succNode.children[0]!;
      const succValue = succNode.keys[0]!;
      node.keys[idx] = succValue;
      this.deleteFrom(node.children[idx + 1]!, succValue);
      this.fixChild(node, idx + 1);
    } else {
      let i = 0;
      while (i < node.keys.length && this.compare(value, node.keys[i]!) > 0) i++;
      this.deleteFrom(node.children[i]!, value);
      this.fixChild(node, i);
    }
  }

  private fixChild(parent: TwoThreeNode<T>, i: number): void {
    const child = parent.children[i]!;
    if (child.keys.length > 0) return; // 언더플로우 아님

    const hasLeft = i > 0;
    const hasRight = i < parent.children.length - 1;

    if (hasLeft && parent.children[i - 1]!.keys.length === 2) {
      this.borrowFromLeft(parent, i);
    } else if (hasRight && parent.children[i + 1]!.keys.length === 2) {
      this.borrowFromRight(parent, i);
    } else if (hasLeft) {
      this.mergeWithLeft(parent, i);
    } else {
      this.mergeWithRight(parent, i);
    }
  }

  private borrowFromLeft(parent: TwoThreeNode<T>, i: number): void {
    const left = parent.children[i - 1]!;
    const child = parent.children[i]!;
    child.keys.unshift(parent.keys[i - 1]!);
    parent.keys[i - 1] = left.keys.pop()!;
    if (!left.isLeaf) child.children.unshift(left.children.pop()!);
  }

  private borrowFromRight(parent: TwoThreeNode<T>, i: number): void {
    const right = parent.children[i + 1]!;
    const child = parent.children[i]!;
    child.keys.push(parent.keys[i]!);
    parent.keys[i] = right.keys.shift()!;
    if (!right.isLeaf) child.children.push(right.children.shift()!);
  }

  private mergeWithLeft(parent: TwoThreeNode<T>, i: number): void {
    const left = parent.children[i - 1]!;
    const child = parent.children[i]!;
    left.keys.push(parent.keys[i - 1]!, ...child.keys);
    if (!left.isLeaf) left.children.push(...child.children);
    parent.keys.splice(i - 1, 1);
    parent.children.splice(i, 1);
  }

  private mergeWithRight(parent: TwoThreeNode<T>, i: number): void {
    const child = parent.children[i]!;
    const right = parent.children[i + 1]!;
    child.keys.push(parent.keys[i]!, ...right.keys);
    if (!child.isLeaf) child.children.push(...right.children);
    parent.keys.splice(i, 1);
    parent.children.splice(i + 1, 1);
  }

  size(): number {
    return this._size;
  }

  inOrder(): T[] {
    const result: T[] = [];
    const walk = (node: TwoThreeNode<T> | undefined) => {
      if (node === undefined) return;
      if (node.isLeaf) {
        result.push(...node.keys);
        return;
      }
      for (let i = 0; i < node.keys.length; i++) {
        walk(node.children[i]);
        result.push(node.keys[i]!);
      }
      walk(node.children[node.keys.length]);
    };
    walk(this.root);
    return result;
  }

  // ---- 검증 전용 디버그 유틸 (가이드 본문 코드가 아님, E3 실측용) ----
  debugShape(): string {
    const describe = (node: TwoThreeNode<T> | undefined): string => {
      if (node === undefined) return "∅";
      if (node.isLeaf) return `[${node.keys.join(",")}]`;
      return `[${node.keys.join(",")}]{${node.children.map(describe).join(" | ")}}`;
    };
    return describe(this.root);
  }

  checkInvariants(): string[] {
    const errors: string[] = [];
    const depths: number[] = [];
    const walk = (node: TwoThreeNode<T> | undefined, depth: number, isRoot: boolean) => {
      if (node === undefined) return;
      if (!isRoot && (node.keys.length < 1 || node.keys.length > 2)) {
        errors.push(`비루트 노드 키 개수 위반: ${node.keys.length}`);
      }
      if (!node.isLeaf && node.children.length !== node.keys.length + 1) {
        errors.push(`자식 수 불일치: keys=${node.keys.length}, children=${node.children.length}`);
      }
      for (let i = 0; i < node.keys.length - 1; i++) {
        if (this.compare(node.keys[i]!, node.keys[i + 1]!) >= 0) {
          errors.push(`키 정렬 위반: ${node.keys[i]} >= ${node.keys[i + 1]}`);
        }
      }
      if (node.isLeaf) {
        depths.push(depth);
      } else {
        for (const c of node.children) walk(c, depth + 1, false);
      }
    };
    walk(this.root, 0, true);
    if (new Set(depths).size > 1) errors.push(`리프 깊이 불일치: ${[...new Set(depths)].join(",")}`);
    return errors;
  }
}

// ============ E3 실측 검증: 가이드 본문에 쓴 모든 수치를 재확인한다 ============
function log(label: string, value: unknown) {
  console.log(`${label}:`, JSON.stringify(value));
}

console.log("=== 실행 시각화 steps 검증: insert(5,3,7,1) → delete(7) ===");
{
  const tree = new TwoThreeTree<number>();
  tree.insert(5);
  log("step2 insert(5) inOrder", tree.inOrder());
  tree.insert(3);
  log("step3 insert(3) inOrder", tree.inOrder());
  tree.insert(7);
  log("step4 insert(7) shape/inOrder", { shape: tree.debugShape(), inOrder: tree.inOrder() });
  tree.insert(1);
  log("step5 insert(1) shape/inOrder", { shape: tree.debugShape(), inOrder: tree.inOrder() });
  const delResult = tree.delete(7);
  log("step6 delete(7) result/shape/inOrder", {
    result: delResult,
    shape: tree.debugShape(),
    inOrder: tree.inOrder(),
  });
  log("checkInvariants final", tree.checkInvariants());
}

console.log("\n=== '왜 모순 없이' delete(3) 무재조정 예시 검증 ===");
{
  const tree = new TwoThreeTree<number>();
  for (const v of [5, 3, 7, 1]) tree.insert(v);
  log("before delete(3)", tree.debugShape());
  tree.delete(3);
  log("after delete(3)", { shape: tree.debugShape(), inOrder: tree.inOrder() });
}

console.log("\n=== 1..7 오름차순 삽입 (스펙 절 ascii art) 검증 ===");
{
  const tree = new TwoThreeTree<number>();
  for (let i = 1; i <= 7; i++) tree.insert(i);
  log("shape", tree.debugShape());
  log("inOrder", tree.inOrder());
  log("size", tree.size());
  log("checkInvariants", tree.checkInvariants());
}

console.log("\n=== 병합(merge) ascii art 예시: [4,2,6,1,3,5,7] → delete(1) 검증 ===");
{
  const tree = new TwoThreeTree<number>();
  for (const v of [4, 2, 6, 1, 3, 5, 7]) tree.insert(v);
  log("before delete(1)", tree.debugShape());
  tree.delete(1);
  log("after delete(1)", { shape: tree.debugShape(), inOrder: tree.inOrder() });
  log("checkInvariants", tree.checkInvariants());
}

console.log("\n=== 내부 노드 삭제(후속자 대체) 예시: delete(4) 검증 ===");
{
  const tree = new TwoThreeTree<number>();
  for (const v of [4, 2, 6, 1, 3, 5, 7]) tree.insert(v);
  const r = tree.delete(4);
  log("delete(4) result/shape/inOrder", { result: r, shape: tree.debugShape(), inOrder: tree.inOrder() });
  log("checkInvariants", tree.checkInvariants());
}

console.log("\n=== 엣지 케이스 검증 ===");
{
  const empty = new TwoThreeTree<number>();
  log("empty has(1)", empty.has(1));
  log("empty delete(1)", empty.delete(1));
  log("empty inOrder", empty.inOrder());

  const single = new TwoThreeTree<number>();
  single.insert(42);
  const r = single.delete(42);
  log("single insert+delete", { result: r, size: single.size(), inOrder: single.inOrder() });

  const dup = new TwoThreeTree<number>();
  dup.insert(3);
  dup.insert(3);
  dup.insert(1);
  log("dup insert size/inOrder", { size: dup.size(), inOrder: dup.inOrder() });
}

console.log("\n=== 무작위 교차검증 (naive 정렬 집합 대비 200회) ===");
{
  function naiveSet() {
    const arr: number[] = [];
    return {
      insert(v: number) {
        if (!arr.includes(v)) {
          arr.push(v);
          arr.sort((a, b) => a - b);
        }
      },
      delete(v: number) {
        const idx = arr.indexOf(v);
        if (idx === -1) return false;
        arr.splice(idx, 1);
        return true;
      },
      has: (v: number) => arr.includes(v),
      size: () => arr.length,
      inOrder: () => [...arr],
    };
  }

  let failures = 0;
  for (let trial = 0; trial < 200; trial++) {
    const tree = new TwoThreeTree<number>();
    const oracle = naiveSet();
    const n = 50 + Math.floor(Math.random() * 150);
    for (let step = 0; step < n; step++) {
      const v = Math.floor(Math.random() * 200);
      if (Math.random() < 0.7) {
        tree.insert(v);
        oracle.insert(v);
      } else {
        const a = tree.delete(v);
        const b = oracle.delete(v);
        if (a !== b) {
          console.log(`FAIL trial ${trial}: delete(${v}) tree=${a} oracle=${b}`);
          failures++;
        }
      }
      const errs = tree.checkInvariants();
      if (errs.length > 0) {
        console.log(`FAIL trial ${trial} step ${step}: invariant errors`, errs, tree.debugShape());
        failures++;
      }
    }
    if (JSON.stringify(tree.inOrder()) !== JSON.stringify(oracle.inOrder())) {
      console.log(`FAIL trial ${trial}: inOrder mismatch`);
      failures++;
    }
    if (tree.size() !== oracle.size()) {
      console.log(`FAIL trial ${trial}: size mismatch`);
      failures++;
    }
  }
  console.log(`무작위 검증(200회) 완료. 실패 횟수: ${failures}`);
}
