class BSTNode {
  key: number;
  left: BSTNode | null = null;
  right: BSTNode | null = null;
  constructor(key: number) {
    this.key = key;
  }
}

class BinarySearchTree {
  private root: BSTNode | null = null;

  insert(key: number): void {
    this.root = this.insertNode(this.root, key);
  }

  private insertNode(node: BSTNode | null, key: number): BSTNode {
    if (node === null) return new BSTNode(key);
    if (key < node.key) node.left = this.insertNode(node.left, key);
    else if (key > node.key) node.right = this.insertNode(node.right, key);
    return node; // key === node.key: 중복, 그대로 반환
  }

  search(key: number): boolean {
    let current = this.root;
    while (current !== null) {
      if (key === current.key) return true;
      current = key < current.key ? current.left : current.right;
    }
    return false;
  }

  delete(key: number): void {
    this.root = this.deleteNode(this.root, key);
  }

  private deleteNode(node: BSTNode | null, key: number): BSTNode | null {
    if (node === null) return null;
    if (key < node.key) {
      node.left = this.deleteNode(node.left, key);
    } else if (key > node.key) {
      node.right = this.deleteNode(node.right, key);
    } else {
      if (node.left === null) return node.right;
      if (node.right === null) return node.left;
      const successor = this.findMinNode(node.right);
      node.key = successor.key;
      node.right = this.deleteNode(node.right, successor.key);
    }
    return node;
  }

  private findMinNode(node: BSTNode): BSTNode {
    let current = node;
    while (current.left !== null) current = current.left;
    return current;
  }

  inorder(): number[] {
    const result: number[] = [];
    this.inorderTraverse(this.root, result);
    return result;
  }

  private inorderTraverse(node: BSTNode | null, result: number[]): void {
    if (node === null) return;
    this.inorderTraverse(node.left, result);
    result.push(node.key);
    this.inorderTraverse(node.right, result);
  }

  min(): number | undefined {
    if (this.root === null) return undefined;
    return this.findMinNode(this.root).key;
  }

  max(): number | undefined {
    if (this.root === null) return undefined;
    let current = this.root;
    while (current.right !== null) current = current.right;
    return current.key;
  }

  // 검증용: 레벨 순서 배열(index 0=루트, 왼쪽=2i+1, 오른쪽=2i+2)로 트리를 펼친다.
  toLevelArray(size: number): number[] {
    const arr = new Array(size).fill(0);
    const walk = (node: BSTNode | null, idx: number) => {
      if (node === null || idx >= size) return;
      arr[idx] = node.key;
      walk(node.left, 2 * idx + 1);
      walk(node.right, 2 * idx + 2);
    };
    walk(this.root, 0);
    return arr;
  }
}

// ---- 자기 검증 ----

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.error(`FAIL: ${label} — actual=${a} expected=${e}`);
    process.exitCode = 1;
  } else {
    console.log(`OK: ${label} = ${a}`);
  }
}

console.log("=== 대표 시나리오 (문제 예시) ===");
const bst = new BinarySearchTree();
bst.insert(5);
bst.insert(3);
bst.insert(7);
bst.insert(1);
bst.insert(4);
assertEqual(bst.toLevelArray(7), [5, 3, 7, 1, 4, 0, 0], "insert 5,3,7,1,4 후 레벨 배열");
assertEqual(bst.inorder(), [1, 3, 4, 5, 7], "inorder 후 정렬");
assertEqual(bst.search(4), true, "search(4)");
assertEqual(bst.search(6), false, "search(6)");
assertEqual(bst.min(), 1, "min()");
assertEqual(bst.max(), 7, "max()");

bst.delete(3);
assertEqual(bst.toLevelArray(7), [5, 4, 7, 1, 0, 0, 0], "delete(3) 후 레벨 배열 (successor=4로 대체)");
assertEqual(bst.inorder(), [1, 4, 5, 7], "delete(3) 후 inorder");

bst.insert(5); // 중복
assertEqual(bst.inorder(), [1, 4, 5, 7], "중복 insert(5) 무시 후 inorder 불변");

console.log("\n=== 엣지 케이스 ===");
const empty = new BinarySearchTree();
assertEqual(empty.search(10), false, "빈 트리 search");
assertEqual(empty.min(), undefined, "빈 트리 min");
assertEqual(empty.max(), undefined, "빈 트리 max");
assertEqual(empty.inorder(), [], "빈 트리 inorder");
empty.delete(10); // no-op, 예외 없어야 함
console.log("OK: 빈 트리 delete(10) — 예외 없이 통과");

const single = new BinarySearchTree();
single.insert(42);
assertEqual(single.min(), 42, "단일 노드 min");
assertEqual(single.max(), 42, "단일 노드 max");
single.delete(42);
assertEqual(single.inorder(), [], "단일 노드 삭제 후 빈 트리");

// 선형(오름차순 삽입) 최악 케이스: 높이 = n
const linear = new BinarySearchTree();
[1, 2, 3, 4, 5].forEach((k) => linear.insert(k));
assertEqual(linear.inorder(), [1, 2, 3, 4, 5], "오름차순 삽입 → 선형 트리 inorder");
// 레벨 배열로 보면 각 노드가 오른쪽 자식만 갖는 사슬이어야 함(index 0,2,6,14,...)
const linArr = linear.toLevelArray(31);
assertEqual([linArr[0], linArr[2], linArr[6], linArr[14], linArr[30]], [1, 2, 3, 4, 5], "선형 트리는 오른쪽 자식 사슬(0→2→6→14→30)");

// case 1(자식 없음), case 2(자식 하나) 삭제 확인
const cases = new BinarySearchTree();
[5, 3, 7, 1].forEach((k) => cases.insert(k));
// 트리:      5
//          /   \
//         3     7
//        /
//       1
cases.delete(1); // 자식 없음(단말)
assertEqual(cases.inorder(), [3, 5, 7], "자식 없는 노드(1) 삭제 후 inorder");
cases.delete(3); // 자식 하나(왼쪽에 없음, 대체할 자식 없음 -> 원래 3은 자식 없음 상태)
assertEqual(cases.inorder(), [5, 7], "그다음 3 삭제 후 inorder");

const oneChild = new BinarySearchTree();
[5, 3, 7, 6].forEach((k) => oneChild.insert(k));
// 트리:      5
//          /   \
//         3     7
//              /
//             6
oneChild.delete(7); // 자식 하나(왼쪽 6) → 6이 그 자리를 대체
assertEqual(oneChild.inorder(), [3, 5, 6], "자식 하나(7) 삭제 후 inorder");
assertEqual(oneChild.toLevelArray(7)[2], 6, "자식 하나 삭제 후 6이 인덱스2로 승격");

console.log("\n=== 무작위 교차검증 (Array.sort 대비) ===");
for (let trial = 0; trial < 20; trial++) {
  const n = 30;
  const keys = Array.from({ length: n }, () => Math.floor(Math.random() * 1000));
  const t = new BinarySearchTree();
  const seen = new Set<number>();
  for (const k of keys) {
    t.insert(k);
    seen.add(k);
  }
  const expected = Array.from(seen).sort((a, b) => a - b);
  const actual = t.inorder();
  assertEqual(actual, expected, `무작위 trial ${trial}: inorder == 정렬된 유니크 값`);
  // search 검증: 삽입한 키는 모두 true, 삽입 안 한 큰 키는 false
  for (const k of keys) {
    if (!t.search(k)) {
      console.error(`FAIL: search(${k}) should be true`);
      process.exitCode = 1;
    }
  }
  if (t.search(-9999)) {
    console.error("FAIL: search(-9999) should be false");
    process.exitCode = 1;
  }
  // 무작위 삭제 후 정렬 유지 확인
  const toDelete = keys[0];
  if (toDelete !== undefined) {
    t.delete(toDelete);
    const expected2 = expected.filter((x) => x !== toDelete);
    const actual2 = t.inorder();
    assertEqual(actual2, expected2, `무작위 trial ${trial}: delete(${toDelete}) 후 inorder`);
  }
}

console.log("\n모든 검증 완료");

console.log("\n=== D6 함정 시나리오 검증 (틀린 구현과 비교) ===");

class WrongBST {
  private root: BSTNode | null = null;
  insert(key: number): void {
    this.root = this.insertNode(this.root, key);
  }
  private insertNode(node: BSTNode | null, key: number): BSTNode {
    if (node === null) return new BSTNode(key);
    if (key < node.key) node.left = this.insertNode(node.left, key);
    else if (key > node.key) node.right = this.insertNode(node.right, key);
    return node;
  }
  private findMinNode(node: BSTNode): BSTNode {
    let current = node;
    while (current.left !== null) current = current.left;
    return current;
  }
  delete(key: number): void {
    this.root = this.deleteNode(this.root, key);
  }
  // 잘못된 구현: successor로 key만 바꾼 뒤, 재귀 삭제 대신
  // node.right = successor.right 로 "직접" 끊어버린다.
  private deleteNode(node: BSTNode | null, key: number): BSTNode | null {
    if (node === null) return null;
    if (key < node.key) {
      node.left = this.deleteNode(node.left, key);
    } else if (key > node.key) {
      node.right = this.deleteNode(node.right, key);
    } else {
      if (node.left === null) return node.right;
      if (node.right === null) return node.left;
      const successor = this.findMinNode(node.right);
      node.key = successor.key;
      node.right = successor.right; // 버그: 재귀 삭제 없이 직접 끊음
    }
    return node;
  }
  inorder(): number[] {
    const result: number[] = [];
    const walk = (n: BSTNode | null) => {
      if (n === null) return;
      walk(n.left);
      result.push(n.key);
      walk(n.right);
    };
    walk(this.root);
    return result;
  }
}

const correct = new BinarySearchTree();
[5, 3, 8, 1, 4, 7, 9].forEach((k) => correct.insert(k));
assertEqual(correct.toLevelArray(7), [5, 3, 8, 1, 4, 7, 9], "D6용 트리 초기 레벨 배열");
correct.delete(5);
assertEqual(correct.inorder(), [1, 3, 4, 7, 8, 9], "올바른 구현: delete(5) 후 inorder (successor=7)");
assertEqual(correct.toLevelArray(7), [7, 3, 8, 1, 4, 0, 9], "올바른 구현: delete(5) 후 레벨 배열");

const wrong = new WrongBST();
[5, 3, 8, 1, 4, 7, 9].forEach((k) => wrong.insert(k));
wrong.delete(5);
assertEqual(wrong.inorder(), [1, 3, 4, 7], "버그 구현: delete(5) 후 inorder — 8,9 유실 확인");

console.log("\n모든 D6 검증 완료");
