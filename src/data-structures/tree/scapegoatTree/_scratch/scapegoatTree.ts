class ScapegoatNode<T> {
  value: T;
  left: ScapegoatNode<T> | undefined = undefined;
  right: ScapegoatNode<T> | undefined = undefined;
  deleted = false;

  constructor(value: T) {
    this.value = value;
  }
}

class ScapegoatTree<T> {
  private root: ScapegoatNode<T> | undefined = undefined;
  private _size = 0;
  private _maxSize = 0;
  private alpha: number;
  private compare: (a: T, b: T) => number;

  constructor(alpha = 0.65, comparator?: (a: T, b: T) => number) {
    this.alpha = alpha;
    this.compare = comparator ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  size(): number {
    return this._size;
  }

  has(value: T): boolean {
    let node = this.root;
    while (node !== undefined) {
      const c = this.compare(value, node.value);
      if (c === 0) return !node.deleted;
      node = c < 0 ? node.left : node.right;
    }
    return false;
  }

  insert(value: T): void {
    if (this.root === undefined) {
      this.root = new ScapegoatNode(value);
      this._size = 1;
      this._maxSize = 1;
      return;
    }

    const path: ScapegoatNode<T>[] = [];
    let node = this.root;
    for (;;) {
      const c = this.compare(value, node.value);
      if (c === 0) {
        if (node.deleted) {
          node.deleted = false;
          this._size++;
          this._maxSize = Math.max(this._maxSize, this._size);
        }
        return;
      }
      path.push(node);
      if (c < 0) {
        if (node.left === undefined) {
          node.left = new ScapegoatNode(value);
          path.push(node.left);
          break;
        }
        node = node.left;
      } else {
        if (node.right === undefined) {
          node.right = new ScapegoatNode(value);
          path.push(node.right);
          break;
        }
        node = node.right;
      }
    }
    this._size++;
    this._maxSize = Math.max(this._maxSize, this._size);

    const depth = path.length - 1; // 루트 depth = 0
    const threshold = Math.log(this._size) / Math.log(1 / this.alpha);
    if (depth > threshold) {
      let scapegoatIndex = -1;
      for (let i = path.length - 2; i >= 0; i--) {
        const parent = path[i]!;
        const child = path[i + 1]!;
        const sizeParent = this.subtreeSize(parent);
        const sizeChild = this.subtreeSize(child);
        if (sizeChild > this.alpha * sizeParent) {
          scapegoatIndex = i;
          break;
        }
      }
      const scapegoat = path[scapegoatIndex]!;
      const parentOfScapegoat = scapegoatIndex > 0 ? path[scapegoatIndex - 1] : undefined;
      const nodes = this.collectInOrder(scapegoat);
      const rebuilt = this.rebuild(nodes);
      if (parentOfScapegoat === undefined) {
        this.root = rebuilt;
      } else if (parentOfScapegoat.left === scapegoat) {
        parentOfScapegoat.left = rebuilt;
      } else {
        parentOfScapegoat.right = rebuilt;
      }
    }
  }

  delete(value: T): boolean {
    let node = this.root;
    while (node !== undefined) {
      const c = this.compare(value, node.value);
      if (c === 0) {
        if (node.deleted) return false;
        node.deleted = true;
        this._size--;
        if (this._size < this.alpha * this._maxSize) {
          const nodes = this.collectInOrder(this.root);
          this.root = this.rebuild(nodes);
          this._maxSize = this._size;
        }
        return true;
      }
      node = c < 0 ? node.left : node.right;
    }
    return false;
  }

  inOrder(): T[] {
    return this.collectInOrder(this.root);
  }

  private subtreeSize(node: ScapegoatNode<T> | undefined): number {
    if (node === undefined) return 0;
    return (node.deleted ? 0 : 1) + this.subtreeSize(node.left) + this.subtreeSize(node.right);
  }

  private collectInOrder(node: ScapegoatNode<T> | undefined, out: T[] = []): T[] {
    if (node === undefined) return out;
    this.collectInOrder(node.left, out);
    if (!node.deleted) out.push(node.value);
    this.collectInOrder(node.right, out);
    return out;
  }

  private rebuild(nodes: T[]): ScapegoatNode<T> | undefined {
    if (nodes.length === 0) return undefined;
    const mid = Math.floor(nodes.length / 2);
    const node = new ScapegoatNode(nodes[mid]!);
    node.left = this.rebuild(nodes.slice(0, mid));
    node.right = this.rebuild(nodes.slice(mid + 1));
    return node;
  }

  // ---- 디버그 전용 ----
  dump(): string {
    const lines: string[] = [];
    const rec = (n: ScapegoatNode<T> | undefined, prefix: string, tag: string) => {
      if (n === undefined) return;
      lines.push(`${prefix}${tag}${n.value}${n.deleted ? "(deleted)" : ""}`);
      rec(n.left, prefix + "  ", "L:");
      rec(n.right, prefix + "  ", "R:");
    };
    rec(this.root, "", "root:");
    return lines.join("\n");
  }
}

function log(title: string, fn: () => void) {
  console.log(`\n=== ${title} ===`);
  fn();
}

// ---------------------------------------------------------------
// 1. 대표 시나리오: 1,2,3,4,5 순차 삽입 (alpha=0.65) — 시뮬레이션용
// ---------------------------------------------------------------
log("순차 삽입 1..5, alpha=0.65", () => {
  const t = new ScapegoatTree<number>(0.65);
  for (const v of [1, 2, 3, 4]) {
    t.insert(v);
    console.log(`insert(${v}) size=${t.size()}`);
    console.log(t.dump());
  }
  // 삽입 5 직전 상태 확인용 임계값 계산
  const sizeBefore = 4;
  const depthOfNewNode = 4; // 1-2-3-4-5 경로, 루트 depth 0 기준 5는 depth 4
  const sizeAfter = 5;
  const threshold = Math.log(sizeAfter) / Math.log(1 / 0.65);
  console.log(`threshold(size=5) = ${threshold}`);
  console.log(`depth(5) = ${depthOfNewNode}, depth > threshold ? ${depthOfNewNode > threshold}`);

  t.insert(5);
  console.log(`insert(5) size=${t.size()}`);
  console.log(t.dump());
  console.log(`inOrder = ${JSON.stringify(t.inOrder())}`);
});

// ---------------------------------------------------------------
// 2. 문제 예시 검증 (scapegoatTree-problem.md)
// ---------------------------------------------------------------
log("문제 예시 검증", () => {
  const tree = new ScapegoatTree<number>(0.65);
  [10, 5, 15, 3, 7, 12, 20].forEach((v) => tree.insert(v));
  console.log("inOrder:", tree.inOrder(), "expect [3,5,7,10,12,15,20]");
  console.log("has(7):", tree.has(7), "expect true");
  console.log("size():", tree.size(), "expect 7");
  tree.delete(5);
  tree.delete(15);
  console.log("inOrder:", tree.inOrder(), "expect [3,7,10,12,20]");
  console.log("size():", tree.size(), "expect 5");
});

// ---------------------------------------------------------------
// 3. 엣지 케이스
// ---------------------------------------------------------------
log("엣지 케이스", () => {
  const t = new ScapegoatTree<number>(0.65);
  console.log("빈 트리 has(1):", t.has(1));
  console.log("빈 트리 inOrder:", t.inOrder());
  console.log("빈 트리 delete(1):", t.delete(1));
  console.log("빈 트리 size():", t.size());

  t.insert(42);
  console.log("size1 has(42):", t.has(42), "size:", t.size());
  console.log("중복 삽입 42:");
  t.insert(42);
  console.log("size after dup insert:", t.size());

  console.log("delete(42):", t.delete(42));
  console.log("size after delete:", t.size());
  console.log("delete(42) again:", t.delete(42));
  console.log("has(42) after delete:", t.has(42));

  // 재삽입(되살림) 확인
  t.insert(42);
  console.log("재삽입 후 has(42):", t.has(42), "size:", t.size());
});

// ---------------------------------------------------------------
// 4. delete로 인한 전체 재구성 트리거 확인
// ---------------------------------------------------------------
log("delete 트리거 재구성", () => {
  const t = new ScapegoatTree<number>(0.65);
  for (const v of [1, 2, 3, 4, 5, 6, 7]) t.insert(v);
  console.log("초기 삽입 후:");
  console.log(t.dump());
  console.log("size:", t.size());

  // maxSize 추적
  // @ts-ignore private 접근(디버그 전용)
  console.log("_maxSize:", (t as any)._maxSize);

  console.log("delete(1):", t.delete(1));
  // @ts-ignore
  console.log("size:", t.size(), "alpha*maxSize:", 0.65 * (t as any)._maxSize);
  console.log(t.dump());

  console.log("delete(2):", t.delete(2));
  // @ts-ignore
  console.log("size:", t.size(), "alpha*maxSize:", 0.65 * (t as any)._maxSize);
  console.log(t.dump());

  console.log("delete(3):", t.delete(3));
  // @ts-ignore
  console.log("size:", t.size(), "alpha*maxSize before this delete was:", 0.65 * (t as any)._maxSize);
  console.log(t.dump());
  // @ts-ignore
  console.log("_maxSize after:", (t as any)._maxSize);
  console.log("inOrder:", t.inOrder());
});

// ---------------------------------------------------------------
// 5. 무작위 교차검증 — has/inOrder가 참조 구현(정렬 배열)과 일치하는가
// ---------------------------------------------------------------
log("무작위 교차검증", () => {
  for (let trial = 0; trial < 20; trial++) {
    const alpha = 0.55 + Math.random() * 0.35; // (0.55, 0.9)
    const t = new ScapegoatTree<number>(alpha);
    const ref = new Set<number>();
    const ops = 300;
    for (let i = 0; i < ops; i++) {
      const v = Math.floor(Math.random() * 100);
      const op = Math.random();
      if (op < 0.6) {
        t.insert(v);
        ref.add(v);
      } else {
        t.delete(v);
        ref.delete(v);
      }
    }
    const expected = [...ref].sort((a, b) => a - b);
    const actual = t.inOrder();
    const ok = JSON.stringify(expected) === JSON.stringify(actual) && t.size() === ref.size;
    if (!ok) {
      console.log(`FAIL trial=${trial} alpha=${alpha}`);
      console.log("expected:", expected);
      console.log("actual  :", actual);
    }
    // has 검증 샘플
    for (let q = 0; q < 50; q++) {
      const v = Math.floor(Math.random() * 100);
      if (t.has(v) !== ref.has(v)) {
        console.log(`HAS FAIL trial=${trial} value=${v} expected=${ref.has(v)} actual=${t.has(v)}`);
      }
    }
    if (trial === 19) console.log("무작위 교차검증 20회 완료 (실패 없으면 위에 FAIL 없음)");
  }
});
