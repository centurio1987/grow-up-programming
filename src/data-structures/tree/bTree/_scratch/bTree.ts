/**
 * bTree-guide.new.mdx E3 자기검증용 스크래치 구현.
 * 가이드 본문에 싣는 코드와 동일해야 한다 (sibling bTree.ts와 무관, 가이드 자체 oracle).
 */

class BTreeNode<T> {
  keys: T[] = [];
  children: BTreeNode<T>[] = [];
  isLeaf = true;
}

export class BTree<T> {
  private root: BTreeNode<T> | undefined = undefined;
  private _size = 0;
  private t: number;
  private compare: (a: T, b: T) => number;

  constructor(t: number = 3, comparator?: (a: T, b: T) => number) {
    if (t < 2) throw new Error("t must be >= 2");
    this.t = t;
    this.compare = comparator ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  size(): number {
    return this._size;
  }

  has(value: T): boolean {
    return this.findNode(this.root, value) !== undefined;
  }

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
      if (this.compare(value, node.keys[i]!) > 0) i++;
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
      if (node.isLeaf) {
        node.keys.splice(i, 1);
        return;
      }
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

    if (node.isLeaf) return; // has()로 걸러졌으므로 도달하지 않음

    const childHasKey = i < node.children.length - 1 || i === node.keys.length;
    const child = node.children[i]!;
    if (child.keys.length === t - 1) {
      this.fixup(node, i);
      // fixup 이후 인덱스가 바뀔 수 있으므로 값 기준으로 재탐색
      let j = 0;
      while (j < node.keys.length && this.compare(value, node.keys[j]!) > 0) j++;
      this.deleteHelper(node.children[j]!, value);
    } else {
      void childHasKey;
      this.deleteHelper(child, value);
    }
  }

  private fixup(node: BTreeNode<T>, i: number): void {
    const t = this.t;
    if (i > 0 && node.children[i - 1]!.keys.length >= t) {
      this.rotateRight(node, i);
    } else if (i < node.children.length - 1 && node.children[i + 1]!.keys.length >= t) {
      this.rotateLeft(node, i);
    } else if (i < node.children.length - 1) {
      this.mergeChildren(node, i);
    } else {
      this.mergeChildren(node, i - 1);
    }
  }

  private rotateRight(node: BTreeNode<T>, i: number): void {
    // 왼쪽 형제(children[i-1])에서 하나 빌려 children[i]로
    const child = node.children[i]!;
    const leftSibling = node.children[i - 1]!;
    child.keys.unshift(node.keys[i - 1]!);
    node.keys[i - 1] = leftSibling.keys.pop()!;
    if (!child.isLeaf) child.children.unshift(leftSibling.children.pop()!);
  }

  private rotateLeft(node: BTreeNode<T>, i: number): void {
    // 오른쪽 형제(children[i+1])에서 하나 빌려 children[i]로
    const child = node.children[i]!;
    const rightSibling = node.children[i + 1]!;
    child.keys.push(node.keys[i]!);
    node.keys[i] = rightSibling.keys.shift()!;
    if (!child.isLeaf) child.children.push(rightSibling.children.shift()!);
  }

  private mergeChildren(node: BTreeNode<T>, i: number): void {
    // children[i]와 children[i+1]을 node.keys[i]를 사이에 두고 병합
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

  // ---- 디버그 전용: 트리 구조를 문자열로 덤프 (가이드 집필 검증용) ----
  dump(): string {
    const lines: string[] = [];
    const walk = (node: BTreeNode<T> | undefined, depth: number) => {
      if (node === undefined) {
        lines.push("(empty)");
        return;
      }
      lines.push(`${"  ".repeat(depth)}[${node.keys.join(",")}]${node.isLeaf ? " leaf" : ""}`);
      if (!node.isLeaf) for (const c of node.children) walk(c, depth + 1);
    };
    walk(this.root, 0);
    return lines.join("\n");
  }
}

// ============ E3 자기검증 실행 ============
if (import.meta.main) {
  console.log("=== 시뮬레이션 트레이스: t=2, insert 1..7, delete(2) ===");
  const tree = new BTree<number>(2);
  for (const v of [1, 2, 3, 4, 5, 6, 7]) {
    tree.insert(v);
    console.log(`\ninsert(${v}) 후:`);
    console.log(tree.dump());
  }
  console.log(`\nsize() = ${tree.size()}, inOrder() = [${tree.inOrder().join(", ")}]`);

  console.log(`\ndelete(2) 결과: ${tree.delete(2)}`);
  console.log(tree.dump());
  console.log(`inOrder() = [${tree.inOrder().join(", ")}]`);

  console.log("\n=== 대표 예시: 문제 예시(t=3) ===");
  const t3 = new BTree<number>(3);
  for (const v of [10, 20, 5, 6, 12, 30, 7, 17]) t3.insert(v);
  console.log("has(6) =", t3.has(6));
  console.log("has(99) =", t3.has(99));
  console.log("size() =", t3.size());
  console.log("inOrder() =", t3.inOrder());
  t3.delete(6);
  t3.delete(12);
  console.log("delete(6), delete(12) 후 inOrder() =", t3.inOrder());
  console.log(t3.dump());

  console.log("\n=== 엣지 케이스 ===");
  const empty = new BTree<number>(2);
  console.log("빈 트리 has(1) =", empty.has(1));
  console.log("빈 트리 delete(1) =", empty.delete(1));
  console.log("빈 트리 inOrder() =", JSON.stringify(empty.inOrder()));
  console.log("빈 트리 size() =", empty.size());

  const single = new BTree<number>(2);
  single.insert(42);
  console.log("\n원소 1개: insert(42) 후 dump:");
  console.log(single.dump());
  console.log("delete(42) =", single.delete(42), " size() =", single.size());

  const dup = new BTree<number>(2);
  dup.insert(5);
  dup.insert(5);
  console.log("\n중복 삽입: insert(5) x2 후 size() =", dup.size(), "inOrder() =", dup.inOrder());

  console.log("\n=== 루트 병합으로 높이가 줄어드는 케이스 (t=2) ===");
  const shrink = new BTree<number>(2);
  for (const v of [1, 2, 3, 4, 5]) shrink.insert(v);
  console.log("insert 1..5 후:");
  console.log(shrink.dump());
  shrink.delete(4);
  console.log("\ndelete(4) 후:");
  console.log(shrink.dump());
  shrink.delete(5);
  console.log("\ndelete(5) 후:");
  console.log(shrink.dump());
  shrink.delete(1);
  console.log("\ndelete(1) 후 (루트 붕괴 가능성):");
  console.log(shrink.dump());
  console.log("inOrder() =", shrink.inOrder());

  console.log("\n=== 무작위 교차검증 (n=500, t=2..5) vs 정렬 배열 ===");
  for (const t of [2, 3, 4, 5]) {
    const seed = 12345 + t;
    let s = seed;
    const rand = () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s;
    };
    const bt = new BTree<number>(t);
    const set = new Set<number>();
    const ops: string[] = [];
    for (let k = 0; k < 500; k++) {
      const v = rand() % 200;
      if (rand() % 3 === 0 && set.size > 0) {
        const arr = [...set];
        const target = arr[rand() % arr.length]!;
        const ok = bt.delete(target);
        set.delete(target);
        ops.push(`delete(${target})=${ok}`);
      } else {
        bt.insert(v);
        set.add(v);
        ops.push(`insert(${v})`);
      }
    }
    const expected = [...set].sort((a, b) => a - b);
    const actual = bt.inOrder();
    const sizeOk = bt.size() === set.size;
    const orderOk = JSON.stringify(expected) === JSON.stringify(actual);
    let hasOk = true;
    for (const v of expected) if (!bt.has(v)) hasOk = false;
    for (let v = 0; v < 200; v++) if (!set.has(v) && bt.has(v)) hasOk = false;
    console.log(
      `t=${t}: size ${sizeOk ? "OK" : "FAIL"} (${bt.size()} vs ${set.size}), order ${orderOk ? "OK" : "FAIL"}, has ${hasOk ? "OK" : "FAIL"}`,
    );
    if (!sizeOk || !orderOk || !hasOk) {
      console.log("실패 시퀀스 마지막 20개:", ops.slice(-20));
    }
  }
}
