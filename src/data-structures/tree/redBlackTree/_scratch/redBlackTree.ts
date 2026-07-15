// E3 자기검증용 스크래치 — 가이드 본문(redBlackTree-guide.new.mdx)의 코드 블록을
// 문자 그대로 옮겨 실행한다. bun src/data-structures/tree/redBlackTree/_scratch/redBlackTree.ts

// ===================== 원형: 케이스 2 생략 버그 (가이드 "아이디어를 코드로 옮기기" 절 인용) =====================

type RBColor = "RED" | "BLACK";

class RBNodeBuggy<T> {
  value: T;
  color: RBColor;
  left: RBNodeBuggy<T>;
  right: RBNodeBuggy<T>;
  parent: RBNodeBuggy<T>;
  constructor(value: T, color: RBColor, self?: RBNodeBuggy<T>) {
    this.value = value;
    this.color = color;
    this.left = self ?? (this as unknown as RBNodeBuggy<T>);
    this.right = self ?? (this as unknown as RBNodeBuggy<T>);
    this.parent = self ?? (this as unknown as RBNodeBuggy<T>);
  }
}

class BuggyTree<T> {
  NIL: RBNodeBuggy<T>;
  root: RBNodeBuggy<T>;
  compare: (a: T, b: T) => number;
  constructor(comparator?: (a: T, b: T) => number) {
    this.NIL = new RBNodeBuggy<T>(undefined as unknown as T, "BLACK");
    this.NIL.left = this.NIL;
    this.NIL.right = this.NIL;
    this.NIL.parent = this.NIL;
    this.root = this.NIL;
    this.compare = comparator ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }
  rotateRight(x: RBNodeBuggy<T>): void {
    const y = x.left;
    x.left = y.right;
    if (y.right !== this.NIL) y.right.parent = x;
    y.parent = x.parent;
    if (x.parent === this.NIL) this.root = y;
    else if (x === x.parent.right) x.parent.right = y;
    else x.parent.left = y;
    y.right = x;
    x.parent = y;
  }
  insert(value: T): void {
    const z = new RBNodeBuggy<T>(value, "RED", this.NIL);
    let y = this.NIL;
    let x = this.root;
    while (x !== this.NIL) {
      y = x;
      x = this.compare(z.value, x.value) < 0 ? x.left : x.right;
    }
    z.parent = y;
    if (y === this.NIL) this.root = z;
    else if (this.compare(z.value, y.value) < 0) y.left = z;
    else y.right = z;
    this.fixupInsertBuggy(z);
  }
  // 원형: 케이스 2(삼각형 감지 → 부모 기준 회전)를 빼먹고 항상 케이스 3만 수행
  fixupInsertBuggy(z: RBNodeBuggy<T>): void {
    while (z.parent.color === "RED") {
      const parent = z.parent;
      const grandparent = parent.parent;
      if (parent === grandparent.left) {
        const uncle = grandparent.right;
        if (uncle.color === "RED") {
          parent.color = "BLACK";
          uncle.color = "BLACK";
          grandparent.color = "RED";
          z = grandparent;
        } else {
          // ⚠ 케이스 2 분기(z === parent.right일 때 먼저 회전)가 빠져 있다
          parent.color = "BLACK";
          grandparent.color = "RED";
          this.rotateRight(grandparent);
        }
      }
      // (오른쪽 대칭 분기는 생략)
      break; // 원형 데모 목적: 무한루프 방지용 안전장치(가이드 본문에는 없음, 검증용)
    }
  }
  colorOf(value: T): RBColor | "MISSING" {
    let node = this.root;
    while (node !== this.NIL) {
      const cmp = this.compare(value, node.value);
      if (cmp === 0) return node.color;
      node = cmp < 0 ? node.left : node.right;
    }
    return "MISSING";
  }
  redRedViolations(): string[] {
    const bad: string[] = [];
    const walk = (node: RBNodeBuggy<T>) => {
      if (node === this.NIL) return;
      if (node.color === "RED") {
        if (node.left.color === "RED") bad.push(`${node.value}-${node.left.value}`);
        if (node.right.color === "RED") bad.push(`${node.value}-${node.right.value}`);
      }
      walk(node.left);
      walk(node.right);
    };
    walk(this.root);
    return bad;
  }
}

// ===================== 최종 구현 (가이드 본문 그대로) =====================

class RBNode<T> {
  value: T;
  color: RBColor;
  left: RBNode<T>;
  right: RBNode<T>;
  parent: RBNode<T>;

  constructor(value: T, color: RBColor, self?: RBNode<T>) {
    this.value = value;
    this.color = color;
    this.left = self ?? (this as unknown as RBNode<T>);
    this.right = self ?? (this as unknown as RBNode<T>);
    this.parent = self ?? (this as unknown as RBNode<T>);
  }
}

class RedBlackTree<T> {
  private NIL: RBNode<T>;
  private root: RBNode<T>;
  private _size = 0;
  private compare: (a: T, b: T) => number;

  constructor(comparator?: (a: T, b: T) => number) {
    this.NIL = new RBNode<T>(undefined as unknown as T, "BLACK");
    this.NIL.left = this.NIL;
    this.NIL.right = this.NIL;
    this.NIL.parent = this.NIL;
    this.root = this.NIL;
    this.compare = comparator ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  private rotateLeft(x: RBNode<T>): void {
    const y = x.right;
    x.right = y.left;
    if (y.left !== this.NIL) y.left.parent = x;
    y.parent = x.parent;
    if (x.parent === this.NIL) this.root = y;
    else if (x === x.parent.left) x.parent.left = y;
    else x.parent.right = y;
    y.left = x;
    x.parent = y;
  }

  private rotateRight(x: RBNode<T>): void {
    const y = x.left;
    x.left = y.right;
    if (y.right !== this.NIL) y.right.parent = x;
    y.parent = x.parent;
    if (x.parent === this.NIL) this.root = y;
    else if (x === x.parent.right) x.parent.right = y;
    else x.parent.left = y;
    y.right = x;
    x.parent = y;
  }

  private findNode(value: T): RBNode<T> {
    let node = this.root;
    while (node !== this.NIL) {
      const cmp = this.compare(value, node.value);
      if (cmp === 0) return node;
      node = cmp < 0 ? node.left : node.right;
    }
    return this.NIL;
  }

  has(value: T): boolean {
    return this.findNode(value) !== this.NIL;
  }

  insert(value: T): void {
    if (this.has(value)) return; // set 의미론: 중복 무시

    const z = new RBNode<T>(value, "RED", this.NIL);
    let y = this.NIL;
    let x = this.root;
    while (x !== this.NIL) {
      y = x;
      x = this.compare(z.value, x.value) < 0 ? x.left : x.right;
    }
    z.parent = y;
    if (y === this.NIL) this.root = z;
    else if (this.compare(z.value, y.value) < 0) y.left = z;
    else y.right = z;

    this._size++;
    this.fixupInsert(z);
  }

  private fixupInsert(z: RBNode<T>): void {
    while (z.parent.color === "RED") {
      if (z.parent === z.parent.parent.left) {
        const uncle = z.parent.parent.right;
        if (uncle.color === "RED") {
          // 케이스 1
          z.parent.color = "BLACK";
          uncle.color = "BLACK";
          z.parent.parent.color = "RED";
          z = z.parent.parent;
        } else {
          if (z === z.parent.right) {
            // 케이스 2: 삼각형 → 직선으로 변환
            z = z.parent;
            this.rotateLeft(z);
          }
          // 케이스 3: 직선 → 회전 + 색 교환
          z.parent.color = "BLACK";
          z.parent.parent.color = "RED";
          this.rotateRight(z.parent.parent);
        }
      } else {
        const uncle = z.parent.parent.left;
        if (uncle.color === "RED") {
          z.parent.color = "BLACK";
          uncle.color = "BLACK";
          z.parent.parent.color = "RED";
          z = z.parent.parent;
        } else {
          if (z === z.parent.left) {
            z = z.parent;
            this.rotateRight(z);
          }
          z.parent.color = "BLACK";
          z.parent.parent.color = "RED";
          this.rotateLeft(z.parent.parent);
        }
      }
    }
    this.root.color = "BLACK";
  }

  private minimumNode(node: RBNode<T>): RBNode<T> {
    while (node.left !== this.NIL) node = node.left;
    return node;
  }

  min(): T | undefined {
    if (this.root === this.NIL) return undefined;
    return this.minimumNode(this.root).value;
  }

  max(): T | undefined {
    if (this.root === this.NIL) return undefined;
    let node = this.root;
    while (node.right !== this.NIL) node = node.right;
    return node.value;
  }

  private transplant(u: RBNode<T>, v: RBNode<T>): void {
    if (u.parent === this.NIL) this.root = v;
    else if (u === u.parent.left) u.parent.left = v;
    else u.parent.right = v;
    v.parent = u.parent;
  }

  delete(value: T): boolean {
    const z = this.findNode(value);
    if (z === this.NIL) return false;

    let y = z;
    let yOriginalColor = y.color;
    let x: RBNode<T>;

    if (z.left === this.NIL) {
      x = z.right;
      this.transplant(z, z.right);
    } else if (z.right === this.NIL) {
      x = z.left;
      this.transplant(z, z.left);
    } else {
      y = this.minimumNode(z.right); // 중위 후속자
      yOriginalColor = y.color;
      x = y.right;
      if (y.parent === z) {
        x.parent = y; // NIL x라도 부모를 세팅해 둬야 fixup이 위치를 안다
      } else {
        this.transplant(y, y.right);
        y.right = z.right;
        y.right.parent = y;
      }
      this.transplant(z, y);
      y.left = z.left;
      y.left.parent = y;
      y.color = z.color;
    }

    this._size--;
    if (yOriginalColor === "BLACK") this.fixupDelete(x);
    return true;
  }

  private fixupDelete(x: RBNode<T>): void {
    while (x !== this.root && x.color === "BLACK") {
      if (x === x.parent.left) {
        let sibling = x.parent.right;
        if (sibling.color === "RED") {
          // 케이스 1
          sibling.color = "BLACK";
          x.parent.color = "RED";
          this.rotateLeft(x.parent);
          sibling = x.parent.right;
        }
        if (sibling.left.color === "BLACK" && sibling.right.color === "BLACK") {
          // 케이스 2: 이중 흑색을 부모로 전파
          sibling.color = "RED";
          x = x.parent;
        } else {
          if (sibling.right.color === "BLACK") {
            // 케이스 3: 케이스 4 형태로 변환
            sibling.left.color = "BLACK";
            sibling.color = "RED";
            this.rotateRight(sibling);
            sibling = x.parent.right;
          }
          // 케이스 4: 즉시 해소
          sibling.color = x.parent.color;
          x.parent.color = "BLACK";
          sibling.right.color = "BLACK";
          this.rotateLeft(x.parent);
          x = this.root;
        }
      } else {
        let sibling = x.parent.left;
        if (sibling.color === "RED") {
          sibling.color = "BLACK";
          x.parent.color = "RED";
          this.rotateRight(x.parent);
          sibling = x.parent.left;
        }
        if (sibling.right.color === "BLACK" && sibling.left.color === "BLACK") {
          sibling.color = "RED";
          x = x.parent;
        } else {
          if (sibling.left.color === "BLACK") {
            sibling.right.color = "BLACK";
            sibling.color = "RED";
            this.rotateLeft(sibling);
            sibling = x.parent.left;
          }
          sibling.color = x.parent.color;
          x.parent.color = "BLACK";
          sibling.left.color = "BLACK";
          this.rotateRight(x.parent);
          x = this.root;
        }
      }
    }
    x.color = "BLACK";
  }

  inOrder(): T[] {
    const result: T[] = [];
    const walk = (node: RBNode<T>) => {
      if (node === this.NIL) return;
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

  // ---- 검증 전용 유틸 (가이드 본문에는 없음) ----
  levelOrderArray(slots: number): number[] {
    const arr: number[] = new Array(slots).fill(0);
    const fill = (node: RBNode<T>, idx: number) => {
      if (node === this.NIL || idx >= slots) return;
      arr[idx] = node.value as unknown as number;
      fill(node.left, 2 * idx + 1);
      fill(node.right, 2 * idx + 2);
    };
    fill(this.root, 0);
    return arr;
  }

  colorOf(value: T): RBColor | "MISSING" {
    const n = this.findNode(value);
    return n === this.NIL ? "MISSING" : n.color;
  }

  checkInvariants(): { ok: boolean; reason?: string } {
    if (this.root !== this.NIL && this.root.color !== "BLACK") {
      return { ok: false, reason: "속성2 위반: 루트가 BLACK이 아님" };
    }
    let blackHeight = -1;
    const check = (node: RBNode<T>, depthBlack: number): boolean => {
      if (node === this.NIL) {
        if (blackHeight === -1) blackHeight = depthBlack;
        return depthBlack === blackHeight;
      }
      if (node.color === "RED") {
        if (node.left.color === "RED" || node.right.color === "RED") return false;
      }
      const nextBlack = depthBlack + (node.color === "BLACK" ? 1 : 0);
      return check(node.left, nextBlack) && check(node.right, nextBlack);
    };
    const ok = check(this.root, 0);
    return ok ? { ok: true } : { ok: false, reason: "속성4/5 위반" };
  }
}

// ===================== 실측 검증 =====================

function assertEq(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  const pass = a === e;
  console.log(`${pass ? "OK  " : "FAIL"} ${label}: actual=${a} expected=${e}`);
  if (!pass) process.exitCode = 1;
}

console.log("=== 원형(케이스2 생략) 버그 재현: insert(10,5,15,3,4) ===");
{
  const t = new BuggyTree<number>();
  [10, 5, 15, 3].forEach((v) => t.insert(v));
  // 여기까지는 케이스1 재채색 로직이 정상 동작(케이스2 분기가 필요 없었음).
  // 단, 이 원형 스니펫에는 "root.color = BLACK" 강제 줄이 없으므로(가이드 본문에서
  // 발췌한 그대로) 10은 케이스1 재채색 직후의 RED로 남는다 — 이 자체가 스니펫이
  // "부분 발췌"임을 보여주는 지점이다. 핵심 검증 대상은 아래의 5-4 위반이다.
  assertEq("버그 버전 — 케이스1까지는 정상 — 10(강제 BLACK 줄 없음 → RED로 남음)", t.colorOf(10), "RED");
  assertEq("버그 버전 — 케이스1까지는 정상 — 5", t.colorOf(5), "BLACK");
  assertEq("버그 버전 — 케이스1까지는 정상 — 15", t.colorOf(15), "BLACK");
  assertEq("버그 버전 — 케이스1까지는 정상 — 3", t.colorOf(3), "RED");

  t.insert(4);
  const violations = t.redRedViolations();
  console.log(
    "버그 버전 최종 colors:",
    [10, 5, 15, 3, 4].map((v) => `${v}=${t.colorOf(v)}`).join(" "),
  );
  console.log("연속 RED 위반:", violations);
  assertEq("버그 버전 — RED-RED 위반 잔존 (5-4)", violations, ["5-4"]);
}

console.log("\n=== 시뮬레이션 프레임 재현: insert(10,5,15,3,4) ===");
{
  const t = new RedBlackTree<number>();
  t.insert(10);
  assertEq("insert(10) — 10 BLACK", t.colorOf(10), "BLACK");

  t.insert(5);
  assertEq("insert(5) — 5 RED", t.colorOf(5), "RED");

  t.insert(15);
  assertEq("insert(15) — 15 RED", t.colorOf(15), "RED");

  t.insert(3);
  assertEq("케이스1 재채색 — 10", t.colorOf(10), "BLACK");
  assertEq("케이스1 재채색 — 5", t.colorOf(5), "BLACK");
  assertEq("케이스1 재채색 — 15", t.colorOf(15), "BLACK");
  assertEq("케이스1 재채색 — 3", t.colorOf(3), "RED");

  t.insert(4);
  assertEq("케이스2→3 — 4(새 서브트리 루트) BLACK", t.colorOf(4), "BLACK");
  assertEq("케이스2→3 — 3 RED", t.colorOf(3), "RED");
  assertEq("케이스2→3 — 5 RED", t.colorOf(5), "RED");
  assertEq("케이스2→3 — 10 BLACK(불변)", t.colorOf(10), "BLACK");
  assertEq("케이스2→3 — 15 BLACK(불변)", t.colorOf(15), "BLACK");

  const arr = t.levelOrderArray(7);
  assertEq("level-order array", arr, [10, 4, 15, 3, 5, 0, 0]);
  assertEq("invariants after 5 inserts", t.checkInvariants().ok, true);
}

console.log("\n=== 헷갈리는 포인트 검증: 삼촌이 NIL(=BLACK)일 때도 회전 발동 ===");
{
  const t = new RedBlackTree<number>();
  t.insert(10);
  t.insert(5);
  t.insert(3);
  assertEq("삼촌 없음(NIL) — 케이스3 발동 — 5 BLACK(새 루트)", t.colorOf(5), "BLACK");
  assertEq("삼촌 없음(NIL) — 3 RED", t.colorOf(3), "RED");
  assertEq("삼촌 없음(NIL) — 10 RED", t.colorOf(10), "RED");
  assertEq("삼촌 없음(NIL) — invariants 유지", t.checkInvariants().ok, true);
}

console.log("\n=== 문제 예시 재현: [7,3,18,10,22,8,11,26] ===");
{
  const tree = new RedBlackTree<number>();
  [7, 3, 18, 10, 22, 8, 11, 26].forEach((v) => tree.insert(v));

  assertEq("inOrder 초기", tree.inOrder(), [3, 7, 8, 10, 11, 18, 22, 26]);
  assertEq("min", tree.min(), 3);
  assertEq("max", tree.max(), 26);
  assertEq("has(11)", tree.has(11), true);
  assertEq("has(999)", tree.has(999), false);

  const delResult = tree.delete(18);
  assertEq("delete(18) 반환값", delResult, true);
  assertEq("inOrder 삭제 후", tree.inOrder(), [3, 7, 8, 10, 11, 22, 26]);
  assertEq("delete 후 invariants", tree.checkInvariants().ok, true);

  assertEq("delete(존재하지 않는 값)", tree.delete(999), false);
  assertEq("size", tree.size(), 7);
}

console.log("\n=== delete 케이스 4 트레이스: insert(10,5,15,3,7) 후 delete(15) ===");
{
  const t = new RedBlackTree<number>();
  [10, 5, 15, 3, 7].forEach((v) => t.insert(v));
  assertEq("삽입 후 — 3 RED", t.colorOf(3), "RED");
  assertEq("삽입 후 — 7 RED", t.colorOf(7), "RED");
  assertEq("삽입 후 — 5 BLACK", t.colorOf(5), "BLACK");

  t.delete(15);
  assertEq("delete(15) 후 — 새 부분루트 5 BLACK", t.colorOf(5), "BLACK");
  assertEq("delete(15) 후 — 3 BLACK(재채색됨)", t.colorOf(3), "BLACK");
  assertEq("delete(15) 후 — 10 BLACK", t.colorOf(10), "BLACK");
  assertEq("delete(15) 후 — 7 RED(불변)", t.colorOf(7), "RED");
  assertEq("delete(15) 후 level-order", t.levelOrderArray(7), [5, 3, 10, 0, 0, 7, 0]);
  assertEq("delete(15) 후 invariants", t.checkInvariants().ok, true);
}

console.log("\n=== 엣지 케이스 ===");
{
  const empty = new RedBlackTree<number>();
  assertEq("빈 트리 has", empty.has(1), false);
  assertEq("빈 트리 min", empty.min(), undefined);
  assertEq("빈 트리 max", empty.max(), undefined);
  assertEq("빈 트리 inOrder", empty.inOrder(), []);
  assertEq("빈 트리 delete", empty.delete(1), false);
  assertEq("빈 트리 size", empty.size(), 0);

  const single = new RedBlackTree<number>();
  single.insert(42);
  assertEq("단일 노드 root color", single.colorOf(42), "BLACK");
  assertEq("단일 노드 delete", single.delete(42), true);
  assertEq("단일 노드 delete 후 size", single.size(), 0);
  assertEq("단일 노드 delete 후 min", single.min(), undefined);

  const dup = new RedBlackTree<number>();
  dup.insert(1);
  dup.insert(1);
  dup.insert(1);
  assertEq("중복 삽입 무시 — size", dup.size(), 1);
  assertEq("중복 삽입 무시 — inOrder", dup.inOrder(), [1]);
}

console.log("\n=== 무작위 교차 검증 (RB tree vs 정렬 배열) ===");
{
  function runRandomCrossCheck(seedTag: string, ops: number) {
    const t = new RedBlackTree<number>();
    const ref = new Set<number>();
    let rngState = ops * 2654435761 + seedTag.length * 97;
    const rand = () => {
      rngState = (rngState * 1103515245 + 12345) & 0x7fffffff;
      return rngState;
    };
    for (let i = 0; i < ops; i++) {
      const v = rand() % 200;
      const op = rand() % 3;
      if (op === 0) {
        t.insert(v);
        ref.add(v);
      } else if (op === 1) {
        const removed = t.delete(v);
        const hadIt = ref.has(v);
        if (removed !== hadIt) {
          console.log(`FAIL ${seedTag} delete(${v}) mismatch: removed=${removed} hadIt=${hadIt}`);
          process.exitCode = 1;
        }
        ref.delete(v);
      } else {
        const has = t.has(v);
        const hadIt = ref.has(v);
        if (has !== hadIt) {
          console.log(`FAIL ${seedTag} has(${v}) mismatch: has=${has} hadIt=${hadIt}`);
          process.exitCode = 1;
        }
      }
      const invariants = t.checkInvariants();
      if (!invariants.ok) {
        console.log(`FAIL ${seedTag} step ${i}: invariants broken (${invariants.reason})`);
        process.exitCode = 1;
        return;
      }
    }
    const expected = [...ref].sort((a, b) => a - b);
    assertEq(`${seedTag} 최종 inOrder`, t.inOrder(), expected);
    assertEq(`${seedTag} 최종 size`, t.size(), ref.size);
    assertEq(`${seedTag} 최종 min`, t.min(), expected[0]);
    assertEq(`${seedTag} 최종 max`, t.max(), expected[expected.length - 1]);
  }

  runRandomCrossCheck("run1", 500);
  runRandomCrossCheck("run2", 500);
  runRandomCrossCheck("run3", 1000);
}

console.log("\n=== 완료 ===");
