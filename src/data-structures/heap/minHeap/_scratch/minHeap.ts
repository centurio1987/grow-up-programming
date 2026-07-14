// E3 자기검증용 스크래치 — 가이드 본문 코드를 그대로 추출해 실행한다.

class MinHeap<T> {
  private data: T[] = [];
  private compare: (a: T, b: T) => number;

  constructor(compare: (a: T, b: T) => number) {
    this.compare = compare;
  }

  push(item: T): void {
    this.data.push(item);
    this.siftUp(this.data.length - 1);
  }

  pop(): T | undefined {
    if (this.data.length === 0) return undefined;
    const result = this.data[0];
    const last = this.data.pop() as T;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.siftDown(0);
    }
    return result;
  }

  peek(): T | undefined {
    return this.data[0];
  }

  size(): number {
    return this.data.length;
  }

  isEmpty(): boolean {
    return this.data.length === 0;
  }

  /** 검증용: 내부 배열 스냅샷 */
  snapshot(): T[] {
    return [...this.data];
  }

  private siftUp(i: number): void {
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (this.compare(this.data[i]!, this.data[p]!) < 0) {
        [this.data[i], this.data[p]] = [this.data[p]!, this.data[i]!];
        i = p;
      } else {
        break;
      }
    }
  }

  private siftDown(i: number): void {
    const n = this.data.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < n && this.compare(this.data[l]!, this.data[smallest]!) < 0) smallest = l;
      if (r < n && this.compare(this.data[r]!, this.data[smallest]!) < 0) smallest = r;
      if (smallest === i) break;
      [this.data[i], this.data[smallest]] = [this.data[smallest]!, this.data[i]!];
      i = smallest;
    }
  }
}

// ---- 실측 트레이스: 가이드 시뮬레이션과 동일한 시퀀스 ----
function log(label: string, value: unknown) {
  console.log(label, JSON.stringify(value));
}

console.log("=== 기본 push/pop 시퀀스 (숫자, 오름차순) ===");
const h = new MinHeap<number>((a, b) => a - b);
log("초기", h.snapshot());
h.push(5);
log("push(5)", h.snapshot());
h.push(1);
log("push(1)", h.snapshot());
h.push(3);
log("push(3)", h.snapshot());
h.push(2);
log("push(2)", h.snapshot());
const popped = h.pop();
log("pop() 반환값", popped);
log("pop() 후 배열", h.snapshot());

console.log("\n=== 엣지: 빈 힙 ===");
const empty = new MinHeap<number>((a, b) => a - b);
log("peek()", empty.peek());
log("pop()", empty.pop());
log("size()", empty.size());
log("isEmpty()", empty.isEmpty());

console.log("\n=== 엣지: 원소 1개 ===");
const one = new MinHeap<number>((a, b) => a - b);
one.push(42);
log("push(42) 후 배열", one.snapshot());
log("pop() 반환값", one.pop());
log("pop() 후 배열", one.snapshot());
log("isEmpty()", one.isEmpty());

console.log("\n=== 함정 검증: swap 순서를 잘못 짜면 (siftDown에서 자식 비교 없이 무조건 왼쪽과 swap) ===");
class BuggyHeap<T> {
  private data: T[] = [];
  constructor(private compare: (a: T, b: T) => number) {}
  push(item: T) {
    this.data.push(item);
    let i = this.data.length - 1;
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (this.compare(this.data[i]!, this.data[p]!) < 0) {
        [this.data[i], this.data[p]] = [this.data[p]!, this.data[i]!];
        i = p;
      } else break;
    }
  }
  pop(): T | undefined {
    if (this.data.length === 0) return undefined;
    const result = this.data[0];
    const last = this.data.pop() as T;
    if (this.data.length > 0) {
      this.data[0] = last;
      let i = 0;
      const n = this.data.length;
      // 버그: 오른쪽 자식과 비교하지 않고 항상 왼쪽 자식과 swap
      while (2 * i + 1 < n) {
        const l = 2 * i + 1;
        [this.data[i], this.data[l]] = [this.data[l]!, this.data[i]!];
        i = l;
      }
    }
    return result;
  }
  snapshot() {
    return [...this.data];
  }
}
// 오른쪽 자식이 왼쪽보다 작아야 버그가 드러난다 — 그런 입력을 직접 구성한다.
const buggySeq = [1, 10, 2, 9, 8, 3, 4];
const buggy = new BuggyHeap<number>((a, b) => a - b);
const correctForCompare = new MinHeap<number>((a, b) => a - b);
buggySeq.forEach((v) => {
  buggy.push(v);
  correctForCompare.push(v);
});
log("buggy push 완료", buggy.snapshot());
log("correct push 완료", correctForCompare.snapshot());
log("buggy pop() 반환값", buggy.pop());
log("correct pop() 반환값", correctForCompare.pop());
log("buggy pop() 후 배열", buggy.snapshot());
log("correct pop() 후 배열", correctForCompare.snapshot());
log("buggy pop() 두 번째 반환값 (틀린 순서 기대)", buggy.pop());
log("correct pop() 두 번째 반환값 (정답)", correctForCompare.pop());

console.log("\n=== 무작위 교차검증: MinHeap으로 100개 push 후 전부 pop → 정렬 순서와 일치해야 함 ===");
function randomCheck(seed: number): boolean {
  const nums: number[] = [];
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s % 1000;
  };
  for (let i = 0; i < 100; i++) nums.push(rand());
  const heap = new MinHeap<number>((a, b) => a - b);
  for (const v of nums) heap.push(v);
  const out: number[] = [];
  while (!heap.isEmpty()) {
    out.push(heap.pop() as number);
  }
  const expected = [...nums].sort((a, b) => a - b);
  const ok = JSON.stringify(out) === JSON.stringify(expected);
  console.log(`seed=${seed} 일치 여부:`, ok);
  return ok;
}
const allOk = [1, 42, 999, 7].every(randomCheck);
console.log("모든 무작위 교차검증 통과:", allOk);

console.log("\n=== 객체 우선순위 큐 (compare 커스텀) ===");
type Patient = { name: string; urgency: number };
const er = new MinHeap<Patient>((a, b) => a.urgency - b.urgency);
er.push({ name: "Kim", urgency: 3 });
er.push({ name: "Lee", urgency: 1 });
er.push({ name: "Park", urgency: 5 });
log("er.pop()", er.pop());
log("er.pop()", er.pop());
log("er.pop()", er.pop());
