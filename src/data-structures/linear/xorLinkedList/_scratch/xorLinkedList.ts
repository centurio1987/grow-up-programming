// E3 자기검증 스크래치 — guide 본문 코드를 그대로 추출해 실행 검증한다.
// bun src/data-structures/linear/xorLinkedList/_scratch/xorLinkedList.ts

class XorNode {
  id: number;
  value: number;
  xorId: number; // prevId XOR nextId

  constructor(id: number, value: number) {
    this.id = id;
    this.value = value;
    this.xorId = 0;
  }
}

class XorLinkedList {
  private store = new Map<number, XorNode>();
  private headId = 0; // 0 = null
  private tailId = 0;
  private count = 0;
  private nextSeq = 1; // 다음에 발급할 id (1부터)

  append(value: number): void {
    const id = this.nextSeq++;
    const node = new XorNode(id, value);
    node.xorId = this.tailId ^ 0; // prev=tail, next=null(0)

    if (this.tailId !== 0) {
      const tail = this.store.get(this.tailId);
      if (tail === undefined) throw new Error("tail node missing");
      tail.xorId = tail.xorId ^ id; // tail의 next를 새 노드로 갱신
    } else {
      this.headId = id; // 빈 리스트였다면 head도 새 노드
    }

    this.store.set(id, node);
    this.tailId = id;
    this.count++;
  }

  toArray(): number[] {
    const result: number[] = [];
    let prevId = 0;
    let currId = this.headId;
    while (currId !== 0) {
      const node = this.store.get(currId);
      if (node === undefined) throw new Error("node missing");
      result.push(node.value);
      const nextId = node.xorId ^ prevId;
      prevId = currId;
      currId = nextId;
    }
    return result;
  }

  toArrayReverse(): number[] {
    const result: number[] = [];
    let nextId = 0;
    let currId = this.tailId;
    while (currId !== 0) {
      const node = this.store.get(currId);
      if (node === undefined) throw new Error("node missing");
      result.push(node.value);
      const prevId = node.xorId ^ nextId;
      nextId = currId;
      currId = prevId;
    }
    return result;
  }

  size(): number {
    return this.count;
  }
}

// ---- 함정 재현용: append에서 tail.xorId 갱신을 빼먹은 버전 ----
class BrokenAppendList {
  private store = new Map<number, XorNode>();
  private headId = 0;
  private tailId = 0;
  private nextSeq = 1;

  append(value: number): void {
    const id = this.nextSeq++;
    const node = new XorNode(id, value);
    node.xorId = this.tailId ^ 0;
    // (일부러 생략) tail.xorId ^= id
    if (this.tailId === 0) this.headId = id;
    this.store.set(id, node);
    this.tailId = id;
  }

  toArray(): number[] {
    const result: number[] = [];
    let prevId = 0;
    let currId = this.headId;
    while (currId !== 0) {
      const node = this.store.get(currId)!;
      result.push(node.value);
      const nextId = node.xorId ^ prevId;
      prevId = currId;
      currId = nextId;
    }
    return result;
  }
}

// ---- 함정 재현용: toArray에서 prevId 갱신 순서를 뒤바꾼 버전 ----
class BrokenTraverseList {
  private store = new Map<number, XorNode>();
  private headId = 0;
  private tailId = 0;
  private nextSeq = 1;

  append(value: number): void {
    const id = this.nextSeq++;
    const node = new XorNode(id, value);
    node.xorId = this.tailId ^ 0;
    if (this.tailId !== 0) {
      const tail = this.store.get(this.tailId)!;
      tail.xorId = tail.xorId ^ id;
    } else {
      this.headId = id;
    }
    this.store.set(id, node);
    this.tailId = id;
  }

  toArrayWrongOrder(limit: number): number[] {
    const result: number[] = [];
    let prevId = 0;
    let currId = this.headId;
    let guard = 0;
    while (currId !== 0 && guard < limit) {
      const node = this.store.get(currId)!;
      result.push(node.value);
      prevId = currId; // 순서를 먼저 갱신 (함정)
      const nextId = node.xorId ^ prevId; // 이미 바뀐 prevId를 써버림
      currId = nextId;
      guard++;
    }
    return result;
  }
}

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.error(`FAIL: ${label}\n  actual:   ${a}\n  expected: ${e}`);
    process.exitCode = 1;
  } else {
    console.log(`OK: ${label} => ${a}`);
  }
}

// ---- 대표 케이스: append(10), append(20), append(30) ----
const list = new XorLinkedList();
console.log("--- append 대표 케이스: node별 xorId 추적 ---");
list.append(10);
// @ts-expect-error 내부 상태 직접 조회(검증용)
const s1 = list["store"] as Map<number, XorNode>;
console.log("append(10) 후 node(1):", s1.get(1));
assertEqual(s1.get(1)?.xorId, 0, "node1.xorId after append(10)");

list.append(20);
console.log("append(20) 후 node(1):", s1.get(1), "node(2):", s1.get(2));
assertEqual(s1.get(1)?.xorId, 2, "node1.xorId after append(20) (0^2=2)");
assertEqual(s1.get(2)?.xorId, 1, "node2.xorId after append(20) (1^0=1)");

list.append(30);
console.log("append(30) 후 node(2):", s1.get(2), "node(3):", s1.get(3));
assertEqual(s1.get(2)?.xorId, 2, "node2.xorId after append(30) (1^3=2)");
assertEqual(s1.get(3)?.xorId, 2, "node3.xorId after append(30) (2^0=2)");

assertEqual(list.size(), 3, "size() after 3 appends");
assertEqual(list.toArray(), [10, 20, 30], "toArray() forward");
assertEqual(list.toArrayReverse(), [30, 20, 10], "toArrayReverse()");

// ---- 엣지 케이스: 빈 리스트 ----
const empty = new XorLinkedList();
assertEqual(empty.toArray(), [], "toArray() on empty list");
assertEqual(empty.toArrayReverse(), [], "toArrayReverse() on empty list");
assertEqual(empty.size(), 0, "size() on empty list");

// ---- 엣지 케이스: 단일 원소 ----
const single = new XorLinkedList();
single.append(42);
assertEqual(single.toArray(), [42], "toArray() single element");
assertEqual(single.toArrayReverse(), [42], "toArrayReverse() single element");
assertEqual(single.size(), 1, "size() single element");

// ---- 무작위 교차검증: 순수 배열 push와 비교 ----
console.log("--- 무작위 교차검증 (30회, 각 0~20 appends) ---");
let randomFails = 0;
for (let trial = 0; trial < 30; trial++) {
  const n = Math.floor(Math.random() * 20);
  const values: number[] = [];
  const xl = new XorLinkedList();
  for (let i = 0; i < n; i++) {
    const v = Math.floor(Math.random() * 200) - 100;
    values.push(v);
    xl.append(v);
  }
  const fwd = xl.toArray();
  const rev = xl.toArrayReverse();
  const expectedRev = [...values].reverse();
  const okFwd = JSON.stringify(fwd) === JSON.stringify(values);
  const okRev = JSON.stringify(rev) === JSON.stringify(expectedRev);
  const okSize = xl.size() === n;
  if (!okFwd || !okRev || !okSize) {
    randomFails++;
    console.error(`  trial ${trial} FAIL: n=${n} fwd=${okFwd} rev=${okRev} size=${okSize}`);
  }
}
assertEqual(randomFails, 0, "무작위 교차검증 30회 전부 통과");

// ---- 함정 재현: append에서 tail.xorId 갱신을 빼먹으면? ----
console.log("--- 함정 1: append에서 tail.xorId 갱신 생략 ---");
const broken = new BrokenAppendList();
broken.append(10);
broken.append(20);
broken.append(30);
assertEqual(broken.toArray(), [10], "BrokenAppendList.toArray() — 20,30이 유실됨(예상된 함정 결과)");

// ---- 함정 재현: toArray에서 prevId를 먼저 갱신하면? ----
console.log("--- 함정 2: toArray에서 prevId 갱신 순서를 앞당기면 ---");
const brokenTraverse = new BrokenTraverseList();
brokenTraverse.append(10);
brokenTraverse.append(20);
brokenTraverse.append(30);
const wrong = brokenTraverse.toArrayWrongOrder(6);
console.log("wrong order 결과(6프레임 강제 종료):", wrong);
assertEqual(wrong, [10, 30, 10, 30, 10, 30], "잘못된 순서 — 20을 건너뛰고 10/30 사이를 무한 반복");

console.log("\n모든 검증 완료. exitCode:", process.exitCode ?? 0);
