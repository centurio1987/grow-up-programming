// E3 자기검증용 스크래치 — 가이드 본문 코드를 그대로 추출해 실행한다.
// 가이드 자신의 코드가 oracle이며, sibling maxHeap.ts(학습자 실습 공간)는 채점 대상이 아니다.

export class MaxHeap<T> {
  private heap: T[] = [];
  private compare: (a: T, b: T) => number;

  constructor(compare: (a: T, b: T) => number) {
    this.compare = compare;
  }

  push(item: T): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const max = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0 && last !== undefined) {
      this.heap[0] = last;
      this.siftDown(0);
    }
    return max;
  }

  peek(): T | undefined {
    return this.heap[0];
  }

  size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  private bubbleUp(start: number): void {
    let i = start;
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      const child = this.heap[i];
      const parentVal = this.heap[parent];
      if (child === undefined || parentVal === undefined) break;
      if (this.compare(child, parentVal) > 0) {
        this.swap(i, parent);
        i = parent;
      } else {
        break;
      }
    }
  }

  private siftDown(start: number): void {
    let i = start;
    const n = this.heap.length;
    while (true) {
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      let biggest = i;

      const biggestVal = this.heap[biggest];
      if (biggestVal === undefined) break;

      if (left < n) {
        const leftVal = this.heap[left];
        const cur = this.heap[biggest];
        if (leftVal !== undefined && cur !== undefined && this.compare(leftVal, cur) > 0) {
          biggest = left;
        }
      }
      if (right < n) {
        const rightVal = this.heap[right];
        const cur = this.heap[biggest];
        if (rightVal !== undefined && cur !== undefined && this.compare(rightVal, cur) > 0) {
          biggest = right;
        }
      }

      if (biggest !== i) {
        this.swap(i, biggest);
        i = biggest;
      } else {
        break;
      }
    }
  }

  private swap(i: number, j: number): void {
    const tmp = this.heap[i];
    this.heap[i] = this.heap[j] as T;
    this.heap[j] = tmp as T;
  }

  // 검증 전용: 내부 배열 스냅샷 (프로덕션 API 아님)
  snapshot(): T[] {
    return [...this.heap];
  }
}

// ---- 검증 스크립트 ----

function assertEq(actual: unknown, expected: unknown, label: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.error(`FAIL ${label}: actual=${a} expected=${e}`);
    process.exitCode = 1;
  } else {
    console.log(`OK   ${label}: ${a}`);
  }
}

console.log("=== 트레이스: push(3,9,1,7) → pop → pop ===");
const h = new MaxHeap<number>((a, b) => a - b);

h.push(3);
assertEq(h.snapshot(), [3], "push(3) 후 heap");

h.push(9);
assertEq(h.snapshot(), [9, 3], "push(9) 후 heap");

h.push(1);
assertEq(h.snapshot(), [9, 3, 1], "push(1) 후 heap");

h.push(7);
assertEq(h.snapshot(), [9, 7, 1, 3], "push(7) 후 heap");

const p1 = h.pop();
assertEq(p1, 9, "pop() 반환값 #1");
assertEq(h.snapshot(), [7, 3, 1], "pop() #1 이후 heap");

const p2 = h.pop();
assertEq(p2, 7, "pop() 반환값 #2");
assertEq(h.snapshot(), [3, 1], "pop() #2 이후 heap");

assertEq(h.peek(), 3, "peek()");

console.log("\n=== 엣지 케이스 ===");
const empty = new MaxHeap<number>((a, b) => a - b);
assertEq(empty.pop(), undefined, "빈 힙 pop()");
assertEq(empty.peek(), undefined, "빈 힙 peek()");
assertEq(empty.isEmpty(), true, "빈 힙 isEmpty()");

const single = new MaxHeap<number>((a, b) => a - b);
single.push(42);
assertEq(single.peek(), 42, "단일 원소 peek()");
assertEq(single.pop(), 42, "단일 원소 pop()");
assertEq(single.isEmpty(), true, "단일 원소 pop 후 isEmpty()");

const dup = new MaxHeap<number>((a, b) => a - b);
[5, 5, 5].forEach((v) => dup.push(v));
assertEq(dup.pop(), 5, "동일값 pop() #1");
assertEq(dup.pop(), 5, "동일값 pop() #2");
assertEq(dup.pop(), 5, "동일값 pop() #3");

console.log("\n=== 함정 검증: '더 작은 자식'과 잘못 swap하면 힙 속성이 깨진다 ===");
// heap=[9,3,1]에서 pop() 실행 시 last=1이 루트로 이동 → [1,3]
// 올바른 siftDown: 자식 3과 비교, compare(3,1)>0 → swap → [3,1]. 힙 속성 유지(3>=1).
// 만약 실수로 "더 작은 자식"과 비교했다면(자식이 하나뿐이라 이 경우엔 결과가 같지만,
// 자식이 둘일 때는 값이 달라진다) 아래 3자식 케이스로 확인한다.
const trap = new MaxHeap<number>((a, b) => a - b);
[9, 3, 8].forEach((v) => trap.push(v));
// push 순서: [9] → [9,3] → [9,3,8]: bubbleUp(8): parent(idx0? idx1?) idx2의 parent=0(9). compare(8,9)<=0 → 중단
assertEq(trap.snapshot(), [9, 3, 8], "push(9,3,8) 후 heap (8은 buble 안 됨)");
const tp = trap.pop();
// pop: max=9 저장, last=8 → heap=[8,3], 길이>0 → heap[0]=8 → siftDown(0)
// left=3(idx1), right=없음(idx2 범위 밖, n=2). biggest 후보: 3 vs 8 → 8이 더 큼 → swap 없음
assertEq(tp, 9, "함정 케이스 pop() 반환값");
assertEq(trap.snapshot(), [8, 3], "함정 케이스: 올바른 siftDown 결과 (자식 없어 swap 불필요)");

// 더 명확한 3-자식 함정: heap을 [10,4,9] 상태로 강제 관찰 (자식 두 개, 오른쪽이 더 큼)
const trap2 = new MaxHeap<number>((a, b) => a - b);
[4, 10, 9].forEach((v) => trap2.push(v));
// push(4)->[4]; push(10)-> [4,10] bubbleUp: compare(10,4)>0 swap -> [10,4]
// push(9): heap=[10,4,9] idx2 parent=0(10) compare(9,10)<=0 중단
assertEq(trap2.snapshot(), [10, 4, 9], "push(4,10,9) 후 heap");
const tp2 = trap2.pop();
// pop: max=10, last=9 -> heap=[9,4] -> heap[0]=9? wait heap.pop() removed last(9) already before reassigning.
// 순서: heap=[10,4,9]; max=heap[0]=10; last=heap.pop()=9 -> heap=[10,4]; heap.length>0-> heap[0]=9 -> heap=[9,4]; siftDown(0)
// left=idx1=4, right=idx2 없음(n=2). biggest: 4 vs 9 -> 9 유지. 최종 [9,4]
assertEq(tp2, 10, "함정 케이스2 pop() 반환값");
assertEq(trap2.snapshot(), [9, 4], "함정 케이스2: 올바른 결과");
// 만약 실수로 "더 작은 자식"과 무조건 swap 했다면(왼쪽 자식만 있는 상황이라 이 케이스는 우연히 동일).
// 실제로 두 자식이 모두 있고 큰 자식이 오른쪽인 경우로 다시 확인:
const trap3 = new MaxHeap<number>((a, b) => a - b);
[1, 2, 3, 4, 5].forEach((v) => trap3.push(v));
console.log("push(1,2,3,4,5) 후:", trap3.snapshot());
const tp3 = trap3.pop();
console.log("pop() =", tp3, ", 이후:", trap3.snapshot());

console.log("\n=== 무작위 교차검증 (100회, n<=50) ===");
function randInt(n: number) {
  return Math.floor(Math.random() * n);
}
let allOk = true;
for (let trial = 0; trial < 100; trial++) {
  const n = randInt(50);
  const arr: number[] = [];
  for (let i = 0; i < n; i++) arr.push(randInt(1000) - 500);
  const heap = new MaxHeap<number>((a, b) => a - b);
  arr.forEach((v) => heap.push(v));
  const popped: number[] = [];
  while (!heap.isEmpty()) {
    popped.push(heap.pop() as number);
  }
  const expected = [...arr].sort((a, b) => b - a);
  const ok = JSON.stringify(popped) === JSON.stringify(expected);
  if (!ok) {
    allOk = false;
    console.error(`FAIL trial=${trial} arr=${JSON.stringify(arr)}`);
    console.error(`  popped=${JSON.stringify(popped)}`);
    console.error(`  expect=${JSON.stringify(expected)}`);
  }
}
console.log(allOk ? "OK   무작위 100회 전부 내림차순 일치" : "FAIL 무작위 검증 실패 있음");

console.log("\n=== 함정 검증(정식): 오른쪽 자식을 빠뜨리면 어떤 값이 나오는가 ===");
const trap4 = new MaxHeap<number>((a, b) => a - b);
[9, 7, 8, 3, 1].forEach((v) => trap4.push(v));
assertEq(trap4.snapshot(), [9, 7, 8, 3, 1], "push(9,7,8,3,1) 후 heap");
const tp4 = trap4.pop();
assertEq(tp4, 9, "정상 pop() 반환값");
assertEq(trap4.snapshot(), [8, 7, 1, 3], "정상 siftDown 결과 (오른쪽 자식 8을 올바르게 선택)");
// 아래는 "왼쪽 자식만 비교하고 오른쪽을 빠뜨리는" 버그를 그대로 재현한 siftDown이다.
function buggySiftDownLeftOnly(arr: number[]): void {
  let i = 0;
  const n = arr.length;
  while (true) {
    const left = 2 * i + 1;
    let biggest = i;
    if (left < n && (arr[left] as number) > (arr[biggest] as number)) biggest = left; // 오른쪽 자식 비교 누락!
    if (biggest !== i) {
      const tmp = arr[i] as number;
      arr[i] = arr[biggest] as number;
      arr[biggest] = tmp;
      i = biggest;
    } else break;
  }
}
const buggyArr = [1, 7, 8, 3]; // pop 직후 last(1)을 루트에 놓은 상태(위와 동일 시점)
buggySiftDownLeftOnly(buggyArr);
assertEq(buggyArr, [7, 3, 8, 1], "버그 재현: 왼쪽만 타고 내려가 부모(7, idx0) < 자식(8, idx2) 위반 상태로 종료");

console.log("\n=== 코드 진화 사다리: 원형/개선 vs 최종 비용 실측 ===");
function naivePush<T>(arr: T[], item: T) {
  arr.push(item);
}
function naivePopMax<T>(arr: T[], compare: (a: T, b: T) => number): T | undefined {
  if (arr.length === 0) return undefined;
  let maxIdx = 0;
  for (let i = 1; i < arr.length; i++) {
    const cur = arr[i];
    const best = arr[maxIdx];
    if (cur !== undefined && best !== undefined && compare(cur, best) > 0) maxIdx = i;
  }
  return arr.splice(maxIdx, 1)[0];
}
const naiveArr: number[] = [];
[3, 9, 1, 7].forEach((v) => naivePush(naiveArr, v));
assertEq(naiveArr, [3, 9, 1, 7], "원형: push는 그냥 끝에 추가");
assertEq(naivePopMax(naiveArr, (a, b) => a - b), 9, "원형: pop은 선형 탐색으로 9 찾음");
assertEq(naiveArr, [3, 1, 7], "원형: splice 후 배열");

console.log("\n모든 검증 완료.");
