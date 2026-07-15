// E3 자기검증용 스크래치 — 가이드 본문 코드를 그대로 추출해 실행한다.
// 가이드 자신의 코드가 oracle이며, sibling unrolledLinkedList.ts(학습자 스텁)는 무관하다.

// ── 원형 (naive): 원소 하나당 노드 하나 ─────────────────────────────
interface NaiveNode<T> {
  value: T;
  next: NaiveNode<T> | null;
}

function naiveGet<T>(head: NaiveNode<T> | null, index: number): T | undefined {
  let cur = head;
  let i = 0;
  while (cur !== null) {
    if (i === index) return cur.value;
    cur = cur.next;
    i++;
  }
  return undefined;
}

// ── 최종: UnrolledLinkedList ────────────────────────────────────────
interface Chunk<T> {
  items: T[];
  next: Chunk<T> | null;
}

class UnrolledLinkedList<T> {
  private head: Chunk<T> | null = null;
  private tail: Chunk<T> | null = null;
  private _size = 0;
  private readonly chunkSize: number;

  constructor(chunkSize: number = 16) {
    if (chunkSize < 1) throw new Error("chunkSize must be >= 1");
    this.chunkSize = chunkSize;
  }

  push(item: T): void {
    if (this.tail === null || this.tail.items.length === this.chunkSize) {
      const chunk: Chunk<T> = { items: [], next: null };
      if (this.tail !== null) {
        this.tail.next = chunk; // ① 옛 tail이 새 청크를 가리키고
      } else {
        this.head = chunk;
      }
      this.tail = chunk; // ② 그 다음에 tail을 갈아 끼운다
    }
    this.tail.items.push(item);
    this._size++;
  }

  pop(): T | undefined {
    if (this._size === 0 || this.tail === null) return undefined;
    const val = this.tail.items.pop();
    this._size--;
    if (this.tail.items.length === 0) {
      if (this.head === this.tail) {
        this.head = null;
        this.tail = null;
      } else {
        let cur = this.head as Chunk<T>;
        while (cur.next !== this.tail) cur = cur.next as Chunk<T>;
        cur.next = null;
        this.tail = cur;
      }
    }
    return val;
  }

  get(index: number): T | undefined {
    if (index < 0 || index >= this._size) return undefined;
    let remaining = index;
    let cur = this.head;
    while (cur !== null) {
      if (remaining < cur.items.length) return cur.items[remaining];
      remaining -= cur.items.length;
      cur = cur.next;
    }
    return undefined;
  }

  size(): number {
    return this._size;
  }

  toArray(): T[] {
    const result: T[] = [];
    let cur = this.head;
    while (cur !== null) {
      result.push(...cur.items);
      cur = cur.next;
    }
    return result;
  }

  // 디버그 전용: 청크별 길이 배열 (가이드 ascii art 검증용)
  debugChunkLengths(): number[] {
    const lens: number[] = [];
    let cur = this.head;
    while (cur !== null) {
      lens.push(cur.items.length);
      cur = cur.next;
    }
    return lens;
  }
}

// ── 버그 변형 A: push에서 옛 tail.next 연결을 빼먹고 tail만 교체 ───
class BuggyLostLinkPush<T> {
  private head: Chunk<T> | null = null;
  private tail: Chunk<T> | null = null;
  private readonly chunkSize: number;
  constructor(chunkSize: number) {
    this.chunkSize = chunkSize;
  }
  push(item: T): void {
    if (this.tail === null || this.tail.items.length === this.chunkSize) {
      const chunk: Chunk<T> = { items: [], next: null };
      if (this.head === null) this.head = chunk;
      this.tail = chunk; // 버그: 옛 tail.next = chunk 를 빼먹음
    }
    this.tail!.items.push(item);
  }
  toArray(): T[] {
    const result: T[] = [];
    let cur = this.head;
    while (cur !== null) {
      result.push(...cur.items);
      cur = cur.next;
    }
    return result;
  }
}

// ── 버그 변형 B: get에서 `<` 대신 `<=`를 쓴 경우 (경계 오프바이원) ──
function buggyGetLTE<T>(head: Chunk<T> | null, size: number, index: number): T | undefined {
  if (index < 0 || index >= size) return undefined;
  let remaining = index;
  let cur = head;
  while (cur !== null) {
    if (remaining <= cur.items.length) return cur.items[remaining]; // 버그: <=
    remaining -= cur.items.length;
    cur = cur.next;
  }
  return undefined;
}

// ── 실행 & 검증 ──────────────────────────────────────────────────
function assertEq(actual: unknown, expected: unknown, label: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.log(`FAIL ${label}: actual=${a} expected=${e}`);
    process.exitCode = 1;
  } else {
    console.log(`OK   ${label}: ${a}`);
  }
}

console.log("=== 원형 naive get 검증 ===");
const n3: NaiveNode<number> = { value: 3, next: null };
const n2: NaiveNode<number> = { value: 2, next: n3 };
const n1: NaiveNode<number> = { value: 1, next: n2 };
assertEq(naiveGet(n1, 0), 1, "naiveGet(0)");
assertEq(naiveGet(n1, 2), 3, "naiveGet(2)");
assertEq(naiveGet(n1, 5), undefined, "naiveGet(범위밖)");

console.log("\n=== 본문 worked example: chunkSize=4, push 1..5 ===");
const list = new UnrolledLinkedList<number>(4);
assertEq(list.size(), 0, "초기 size");
list.push(1);
list.push(2);
list.push(3);
list.push(4);
assertEq(list.debugChunkLengths(), [4], "push(1,2,3,4) 후 청크 길이");
list.push(5);
assertEq(list.debugChunkLengths(), [4, 1], "push(5) 후 청크 길이(새 청크 생성)");
assertEq(list.toArray(), [1, 2, 3, 4, 5], "toArray()");
assertEq(list.get(4), 5, "get(4)");
assertEq(list.size(), 5, "push 5회 후 size");

console.log("\n=== pop() 및 tail 재탐색 ===");
const popped = list.pop();
assertEq(popped, 5, "pop() 반환값");
assertEq(list.size(), 4, "pop() 후 size");
assertEq(list.debugChunkLengths(), [4], "pop() 후 청크 길이(청크2 소멸, tail=청크1)");
assertEq(list.toArray(), [1, 2, 3, 4], "pop() 후 toArray()");

console.log("\n=== 엣지 케이스 ===");
const empty = new UnrolledLinkedList<number>(4);
assertEq(empty.pop(), undefined, "빈 리스트 pop()");
assertEq(empty.get(0), undefined, "빈 리스트 get(0)");
assertEq(list.get(-1), undefined, "get(음수)");
assertEq(list.get(999), undefined, "get(범위 초과)");

// 청크 1개뿐인 상태에서 pop으로 완전히 비우기 → head=tail=null
const single = new UnrolledLinkedList<number>(4);
single.push(10);
single.push(20);
assertEq(single.pop(), 20, "single: pop 1");
assertEq(single.pop(), 10, "single: pop 2 (head===tail 분기)");
assertEq(single.size(), 0, "single: 완전히 빈 후 size");
assertEq(single.get(0), undefined, "single: 완전히 빈 후 get(0)");
single.push(99); // 리셋된 head/tail이 정상 동작하는지
assertEq(single.toArray(), [99], "single: 리셋 후 재사용");

// chunkSize=1 극단값
const chunk1 = new UnrolledLinkedList<number>(1);
chunk1.push(7);
chunk1.push(8);
chunk1.push(9);
assertEq(chunk1.debugChunkLengths(), [1, 1, 1], "chunkSize=1: 청크마다 원소 1개");
assertEq(chunk1.toArray(), [7, 8, 9], "chunkSize=1: toArray()");

console.log("\n=== 확인 질문: chunkSize=4, push 8회 → 청크 몇 개? ===");
const eightPush = new UnrolledLinkedList<number>(4);
for (let i = 1; i <= 8; i++) eightPush.push(i);
assertEq(eightPush.debugChunkLengths().length, 2, "push 8회, chunkSize=4 → 청크 수");
assertEq(eightPush.debugChunkLengths(), [4, 4], "청크 길이 각각");

console.log("\n=== 버그 A: push 링크 순서/누락 → toArray 데이터 유실 ===");
const buggyLost = new BuggyLostLinkPush<number>(4);
buggyLost.push(1);
buggyLost.push(2);
buggyLost.push(3);
buggyLost.push(4);
buggyLost.push(5); // 새 청크 생성되지만 옛 tail.next 연결 누락
assertEq(buggyLost.toArray(), [1, 2, 3, 4], "버그: toArray()에서 5 유실");

console.log("\n=== 버그 B: get 경계 비교 `<=` → 오프바이원 ===");
// 본문 worked example과 동일한 구조: 청크[1,2,3,4], 청크[5]
const chunkA: Chunk<number> = { items: [1, 2, 3, 4], next: null };
const chunkB: Chunk<number> = { items: [5], next: null };
chunkA.next = chunkB;
assertEq(buggyGetLTE(chunkA, 5, 4), undefined, "버그: get(4)가 undefined (정상은 5)");

console.log("\n=== 무작위 교차검증 (n=200, chunkSize=5) ===");
{
  const ref: number[] = [];
  const ull = new UnrolledLinkedList<number>(5);
  let ok = true;
  for (let step = 0; step < 200; step++) {
    const doPush = Math.random() < 0.65 || ref.length === 0;
    if (doPush) {
      const v = Math.floor(Math.random() * 1000);
      ref.push(v);
      ull.push(v);
    } else {
      const expected = ref.pop();
      const actual = ull.pop();
      if (expected !== actual) {
        ok = false;
        console.log(`  MISMATCH pop: expected=${expected} actual=${actual} at step=${step}`);
      }
    }
    if (ull.size() !== ref.length) {
      ok = false;
      console.log(`  MISMATCH size at step=${step}: ull=${ull.size()} ref=${ref.length}`);
    }
    // 무작위 get 샘플
    if (ref.length > 0) {
      const idx = Math.floor(Math.random() * ref.length);
      const g = ull.get(idx);
      if (g !== ref[idx]) {
        ok = false;
        console.log(`  MISMATCH get(${idx}): expected=${ref[idx]} actual=${g}`);
      }
    }
  }
  const arrMatch = JSON.stringify(ull.toArray()) === JSON.stringify(ref);
  if (!arrMatch) {
    ok = false;
    console.log("  MISMATCH final toArray()");
  }
  console.log(ok ? "OK   무작위 교차검증 200 스텝 전부 일치" : "FAIL 무작위 교차검증 불일치 발견");
  if (!ok) process.exitCode = 1;
}

console.log("\n=== E3 실측: p=1000 청크에서 경계 thrashing 반복, 재탐색 스텝 수 ===");
{
  // 본문 pop()과 동일한 로직에 재탐색 스텝 카운터만 추가한 계측용 클래스.
  class InstrumentedULL<T> {
    head: Chunk<T> | null = null;
    tail: Chunk<T> | null = null;
    _size = 0;
    readonly chunkSize: number;
    constructor(chunkSize: number) {
      this.chunkSize = chunkSize;
    }
    push(item: T): void {
      if (this.tail === null || this.tail.items.length === this.chunkSize) {
        const chunk: Chunk<T> = { items: [], next: null };
        if (this.tail !== null) {
          this.tail.next = chunk;
        } else {
          this.head = chunk;
        }
        this.tail = chunk;
      }
      this.tail.items.push(item);
      this._size++;
    }
    // 본문 pop()과 동일하되, 재탐색 while문이 도는 횟수를 steps로 반환한다.
    popCounting(): { val: T | undefined; steps: number } {
      if (this._size === 0 || this.tail === null) return { val: undefined, steps: 0 };
      const val = this.tail.items.pop();
      this._size--;
      let steps = 0;
      if (this.tail.items.length === 0) {
        if (this.head === this.tail) {
          this.head = null;
          this.tail = null;
        } else {
          let cur = this.head as Chunk<T>;
          while (cur.next !== this.tail) {
            cur = cur.next as Chunk<T>;
            steps++;
          }
          cur.next = null;
          this.tail = cur;
        }
      }
      return { val, steps };
    }
    chunkCount(): number {
      let n = 0;
      let cur = this.head;
      while (cur !== null) {
        n++;
        cur = cur.next;
      }
      return n;
    }
  }

  const CHUNK_SIZE = 4;
  const P = 1000;
  const thrash = new InstrumentedULL<number>(CHUNK_SIZE);
  for (let c = 0; c < P; c++) {
    for (let k = 0; k < CHUNK_SIZE; k++) thrash.push(c * CHUNK_SIZE + k);
  }
  assertEq(thrash.chunkCount(), P, `p=${P} 꽉 찬 청크 준비 완료`);

  let allStepsCorrect = true;
  let allChunkCountStable = true;
  const observedSteps: number[] = [];
  for (let iter = 0; iter < 20; iter++) {
    thrash.push(999999); // 경계: tail(=1000번째 청크)이 꽉 차 있으므로 새 청크(1001번째) 생성
    const { steps } = thrash.popCounting(); // 방금 만든 청크가 다시 비어 재탐색 발생
    observedSteps.push(steps);
    const afterPopChunkCount = thrash.chunkCount();
    if (steps !== P - 1) {
      allStepsCorrect = false;
      console.log(`  MISMATCH iter=${iter}: steps=${steps}, expected=${P - 1}`);
    }
    if (afterPopChunkCount !== P) {
      allChunkCountStable = false;
      console.log(`  MISMATCH iter=${iter}: chunkCount after pop=${afterPopChunkCount}, expected=${P}`);
    }
  }
  console.log(`  관측된 재탐색 스텝(20회): [${observedSteps.join(", ")}]`);
  console.log(
    allStepsCorrect
      ? `OK   20회 반복 전부 재탐색 스텝 = ${P - 1} (= p - 1 = 999)`
      : "FAIL 재탐색 스텝 수 불일치 발견",
  );
  console.log(
    allChunkCountStable
      ? `OK   20회 반복 후에도 청크 수 = ${P} 그대로 (thrashing, 감소 없음)`
      : "FAIL 청크 수가 변함",
  );
  if (!allStepsCorrect || !allChunkCountStable) process.exitCode = 1;
}

console.log("\n모든 검증 완료.");
