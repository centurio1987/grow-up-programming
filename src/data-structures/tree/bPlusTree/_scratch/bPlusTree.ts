// E3 자기검증용 스크래치: 가이드 본문의 코드를 그대로 추출 + delete(흐름 서술과 일치하는
// 표준 재분배/병합 구현)를 추가해 실제 실행 결과를 확인한다.
// 가이드는 .ts와 독립적으로 집필/검증되며, 이 파일은 검증 전용이다(oracle 아님).

class BPlusLeafNode<T> {
  keys: T[] = [];
  next: BPlusLeafNode<T> | undefined;
  readonly isLeaf = true;
}

class BPlusInternalNode<T> {
  keys: T[] = [];
  children: (BPlusInternalNode<T> | BPlusLeafNode<T>)[] = [];
  readonly isLeaf = false;
}

type BPlusNode<T> = BPlusInternalNode<T> | BPlusLeafNode<T>;

class BPlusTree<T> {
  private root: BPlusNode<T> | undefined = undefined;
  private firstLeaf: BPlusLeafNode<T> | undefined = undefined;
  private _size = 0;
  private t: number;
  private compare: (a: T, b: T) => number;

  constructor(t: number = 3, comparator?: (a: T, b: T) => number) {
    this.t = t;
    this.compare = comparator ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  private findLeaf(value: T): BPlusLeafNode<T> | undefined {
    let node = this.root;
    while (node !== undefined && !node.isLeaf) {
      let i = 0;
      while (i < node.keys.length && this.compare(value, node.keys[i]!) >= 0) i++;
      node = node.children[i];
    }
    return node as BPlusLeafNode<T> | undefined;
  }

  has(value: T): boolean {
    const leaf = this.findLeaf(value);
    return leaf !== undefined && leaf.keys.some((k) => this.compare(k, value) === 0);
  }

  insert(value: T): void {
    if (this.has(value)) return;
    if (this.root === undefined) {
      const leaf = new BPlusLeafNode<T>();
      leaf.keys.push(value);
      this.root = leaf;
      this.firstLeaf = leaf;
      this._size = 1;
      return;
    }
    const split = this.insertInto(this.root, value);
    if (split !== undefined) {
      const newRoot = new BPlusInternalNode<T>();
      newRoot.keys = [split.key];
      newRoot.children = [this.root, split.right];
      this.root = newRoot;
    }
    this._size++;
  }

  private insertInto(node: BPlusNode<T>, value: T): { key: T; right: BPlusNode<T> } | undefined {
    if (node.isLeaf) {
      let i = 0;
      while (i < node.keys.length && this.compare(node.keys[i]!, value) < 0) i++;
      node.keys.splice(i, 0, value);

      if (node.keys.length <= 2 * this.t - 1) return undefined;

      const mid = Math.ceil(node.keys.length / 2);
      const right = new BPlusLeafNode<T>();
      right.keys = node.keys.splice(mid);
      right.next = node.next;
      node.next = right;
      return { key: right.keys[0]!, right };
    }

    let i = 0;
    while (i < node.keys.length && this.compare(value, node.keys[i]!) >= 0) i++;
    const split = this.insertInto(node.children[i]!, value);
    if (split === undefined) return undefined;

    node.keys.splice(i, 0, split.key);
    node.children.splice(i + 1, 0, split.right);

    if (node.keys.length <= 2 * this.t - 1) return undefined;

    const mid = Math.floor(node.keys.length / 2);
    const promoted = node.keys[mid]!;
    const right = new BPlusInternalNode<T>();
    right.keys = node.keys.splice(mid + 1);
    right.children = node.children.splice(mid + 1);
    node.keys.pop();
    return { key: promoted, right };
  }

  range(low: T, high: T): T[] {
    const result: T[] = [];
    let leaf = this.findLeaf(low);
    while (leaf !== undefined) {
      for (const key of leaf.keys) {
        if (this.compare(key, high) > 0) return result;
        if (this.compare(key, low) >= 0) result.push(key);
      }
      leaf = leaf.next;
    }
    return result;
  }

  size(): number {
    return this._size;
  }

  inOrder(): T[] {
    const result: T[] = [];
    for (let leaf = this.firstLeaf; leaf !== undefined; leaf = leaf.next) {
      result.push(...leaf.keys);
    }
    return result;
  }

  // ---- delete: 본문 흐름 서술("리프에서 제거 → 모자라면 빌리기/병합, 부모 키 갱신,
  // 병합 시 체인 잇기")을 정확히 구현. 재귀적으로 내려가며 각 자식이 언더플로우인지
  // 반환해 부모가 빌리기/병합을 판단하는 표준 패턴.
  delete(value: T): boolean {
    if (this.root === undefined) return false;
    if (!this.has(value)) return false;

    this.deleteFrom(this.root, value);

    // 루트가 내부 노드인데 자식이 하나만 남으면 트리를 한 층 낮춘다.
    if (!this.root.isLeaf && this.root.keys.length === 0) {
      this.root = this.root.children[0];
    }
    // 루트가 리프이고 비었으면 빈 트리로.
    if (this.root && this.root.isLeaf && this.root.keys.length === 0) {
      this.root = undefined;
      this.firstLeaf = undefined;
    }

    this._size--;
    return true;
  }

  private minKeys(): number {
    return this.t - 1;
  }

  // node에서 value를 제거하고, node가 언더플로우면 부모(호출자)가 처리하도록 위임.
  // 자식 인덱스 childIdx의 서브트리에서 삭제가 일어났고 그 자식이 언더플로우가 되면
  // 여기서 빌리기/병합을 수행한다.
  private deleteFrom(node: BPlusNode<T>, value: T): void {
    if (node.isLeaf) {
      const i = node.keys.findIndex((k) => this.compare(k, value) === 0);
      if (i !== -1) node.keys.splice(i, 1);
      return;
    }

    let i = 0;
    while (i < node.keys.length && this.compare(value, node.keys[i]!) >= 0) i++;
    const child = node.children[i]!;
    this.deleteFrom(child, value);

    const isChildLeaf = child.isLeaf;
    const min = isChildLeaf ? this.minKeys() : this.minKeys();
    if (child.keys.length >= min) return; // 언더플로우 아님

    // 형제에게서 빌리거나 병합
    const leftSibling = i > 0 ? (node.children[i - 1] as typeof child) : undefined;
    const rightSibling = i < node.children.length - 1 ? (node.children[i + 1] as typeof child) : undefined;

    if (isChildLeaf) {
      const leaf = child as BPlusLeafNode<T>;
      if (leftSibling && (leftSibling as BPlusLeafNode<T>).keys.length > this.minKeys()) {
        const left = leftSibling as BPlusLeafNode<T>;
        const borrowed = left.keys.pop()!;
        leaf.keys.unshift(borrowed);
        node.keys[i - 1] = leaf.keys[0]!; // 부모 라우팅 키 갱신
      } else if (rightSibling && (rightSibling as BPlusLeafNode<T>).keys.length > this.minKeys()) {
        const right = rightSibling as BPlusLeafNode<T>;
        const borrowed = right.keys.shift()!;
        leaf.keys.push(borrowed);
        node.keys[i] = right.keys[0]!; // 부모 라우팅 키 갱신
      } else if (leftSibling) {
        // 왼쪽과 병합: left <- leaf
        const left = leftSibling as BPlusLeafNode<T>;
        left.keys.push(...leaf.keys);
        left.next = leaf.next;
        node.children.splice(i, 1);
        node.keys.splice(i - 1, 1);
      } else if (rightSibling) {
        // 오른쪽과 병합: leaf <- right
        const right = rightSibling as BPlusLeafNode<T>;
        leaf.keys.push(...right.keys);
        leaf.next = right.next;
        node.children.splice(i + 1, 1);
        node.keys.splice(i, 1);
      }
    } else {
      const internal = child as BPlusInternalNode<T>;
      if (leftSibling && (leftSibling as BPlusInternalNode<T>).keys.length > this.minKeys()) {
        const left = leftSibling as BPlusInternalNode<T>;
        internal.keys.unshift(node.keys[i - 1]!);
        node.keys[i - 1] = left.keys.pop()!;
        internal.children.unshift(left.children.pop()!);
      } else if (rightSibling && (rightSibling as BPlusInternalNode<T>).keys.length > this.minKeys()) {
        const right = rightSibling as BPlusInternalNode<T>;
        internal.keys.push(node.keys[i]!);
        node.keys[i] = right.keys.shift()!;
        internal.children.push(right.children.shift()!);
      } else if (leftSibling) {
        const left = leftSibling as BPlusInternalNode<T>;
        left.keys.push(node.keys[i - 1]!, ...internal.keys);
        left.children.push(...internal.children);
        node.children.splice(i, 1);
        node.keys.splice(i - 1, 1);
      } else if (rightSibling) {
        const right = rightSibling as BPlusInternalNode<T>;
        internal.keys.push(node.keys[i]!, ...right.keys);
        internal.children.push(...right.children);
        node.children.splice(i + 1, 1);
        node.keys.splice(i, 1);
      }
    }
  }

  // ---- 디버그용: 트리 구조를 문자열로 덤프
  dump(): string {
    const lines: string[] = [];
    const rec = (node: BPlusNode<T> | undefined, depth: number) => {
      if (node === undefined) {
        lines.push("  ".repeat(depth) + "(empty)");
        return;
      }
      if (node.isLeaf) {
        lines.push("  ".repeat(depth) + `LEAF ${JSON.stringify(node.keys)}`);
      } else {
        lines.push("  ".repeat(depth) + `INT  ${JSON.stringify(node.keys)}`);
        for (const c of node.children) rec(c, depth + 1);
      }
    };
    rec(this.root, 0);
    return lines.join("\n");
  }
}

// ============================================================
// 검증 1: 본문 "실행 시각화" 원안 — insert(1,2,3,4), range(2,3)
// ============================================================
console.log("=== 검증 1: insert(1,2,3,4) + range(2,3), t=2 ===");
{
  const tree = new BPlusTree<number>(2);
  tree.insert(1);
  tree.insert(2);
  tree.insert(3);
  console.log("insert(1,2,3) 직후:");
  console.log(tree.dump());
  tree.insert(4);
  console.log("insert(4) 직후 (분할 발생 예상):");
  console.log(tree.dump());
  console.log("range(2,3) =", tree.range(2, 3));
  console.log("inOrder() =", tree.inOrder());
}

// ============================================================
// 검증 2 (실행 시각화 delete 스텝의 근거): insert(1..4) 후 delete(3), delete(4)
//   - delete(3): 오른쪽 리프 [3,4]→[4]. 남은 키 1개 = 최소치(t-1=1) 만족 → 언더플로우
//     아님. 부모 라우팅 키는 3 그대로(낡았지만 라우팅은 여전히 옳음). inOrder=[1,2,4].
//   - delete(4): 오른쪽 리프 [4]→[] 완전히 빔 → 언더플로우. 왼쪽 형제 [1,2]에서 빌림
//     → 왼쪽 [1], 오른쪽 [2], 라우팅 키 3→2 갱신. inOrder=[1,2].
// ============================================================
console.log("\n=== 검증 2: insert(1..4) 후 delete(3) → delete(4), t=2 ===");
{
  const tree = new BPlusTree<number>(2);
  [1, 2, 3, 4].forEach((v) => tree.insert(v));
  console.log("초기:");
  console.log(tree.dump());

  tree.delete(3);
  console.log("\ndelete(3) 후 (라우팅 키 3 유지 예상, [4]는 언더플로우 아님):");
  console.log(tree.dump());
  console.log("inOrder() =", tree.inOrder(), " (기대: [1,2,4])");

  tree.delete(4);
  console.log("\ndelete(4) 후 (언더플로우 → 왼쪽에서 빌림, 라우팅 키 3→2 갱신 예상):");
  console.log(tree.dump());
  console.log("inOrder() =", tree.inOrder(), " (기대: [1,2])");
}

// ============================================================
// 검증 3: insert(1..7), t=2 — 자기 점검 문제 1번과 동일 시나리오.
// 이후 delete로 실제 병합/재분배가 일어나는 입력을 탐색한다.
// ============================================================
console.log("\n=== 검증 3: insert(1..7), t=2 ===");
{
  const tree = new BPlusTree<number>(2);
  for (let v = 1; v <= 7; v++) {
    tree.insert(v);
    console.log(`insert(${v}) 후:`);
    console.log(tree.dump());
  }
  console.log("range(2,3) =", tree.range(2, 3));
  console.log("inOrder() =", tree.inOrder());

  console.log("\n--- delete(6) 시도 ---");
  tree.delete(6);
  console.log(tree.dump());
  console.log("inOrder() =", tree.inOrder());
}

// ============================================================
// 검증 4: 위 시나리오를 처음부터 다시 만들어 delete(6) 전/후만 깔끔히 출력
// (실행 시각화 갱신용 최종 수치)
// ============================================================
console.log("\n=== 검증 4: 최종 delete 예시 후보 ===");
{
  const tree = new BPlusTree<number>(2);
  for (let v = 1; v <= 7; v++) tree.insert(v);
  console.log("insert(1..7) 후 구조:");
  console.log(tree.dump());
  console.log("size() =", tree.size());
  console.log("range(2,3) =", tree.range(2, 3));

  console.log("\ndelete(6) 후 구조:");
  tree.delete(6);
  console.log(tree.dump());
  console.log("inOrder() =", tree.inOrder());
  console.log("size() =", tree.size());
}
