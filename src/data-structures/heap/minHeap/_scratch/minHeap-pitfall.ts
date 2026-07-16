// ORD-003 게이트 FAIL(D6/E2) 정정용 스크래치.
// 가이드 228행이 서술하는 "오른쪽 자식 비교를 빼먹은 버그 버전"을 문구 그대로 재현해
// [1, 10, 2, 9, 8, 3, 4] push 후 pop()을 두 번 호출했을 때 실제 반환값을 확인한다.

function log(label: string, value: unknown) {
  console.log(label, JSON.stringify(value));
}

// 정상 버전 (가이드 본문 코드 그대로) — push 결과 배열이 [1, 8, 2, 10, 9, 3, 4]라는
// 서술을 함께 검증하기 위해 나란히 둔다.
class MinHeap<T> {
  private data: T[] = [];
  constructor(private compare: (a: T, b: T) => number) {}

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

// 버그 버전: siftUp은 동일, siftDown에서 "오른쪽 자식과 다시 비교"하는 두 번째 if만 뺐다.
// (왼쪽 자식과의 비교/swap 로직 자체는 정상 그대로 유지 — 가이드 228행 서술과 동일한 정의)
class SiftDownRightSkipHeap<T> {
  private data: T[] = [];
  constructor(private compare: (a: T, b: T) => number) {}

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
      // 버그: 오른쪽 자식(r = 2*i+2)과 다시 비교하는 두 번째 if가 없다.
      if (l < n && this.compare(this.data[l]!, this.data[smallest]!) < 0) smallest = l;
      if (smallest === i) break;
      [this.data[i], this.data[smallest]] = [this.data[smallest]!, this.data[i]!];
      i = smallest;
    }
  }
}

console.log("=== push 시퀀스: [1, 10, 2, 9, 8, 3, 4] ===");
const seq = [1, 10, 2, 9, 8, 3, 4];

const correct = new MinHeap<number>((a, b) => a - b);
seq.forEach((v) => correct.push(v));
log("정상 버전 push 완료 배열", correct.snapshot());

const buggy = new SiftDownRightSkipHeap<number>((a, b) => a - b);
seq.forEach((v) => buggy.push(v));
log("버그 버전 push 완료 배열 (siftUp은 동일하므로 정상과 같아야 함)", buggy.snapshot());

console.log("\n=== pop() 두 번 비교 ===");
const correctPop1 = correct.pop();
log("정상 버전 첫 pop() 반환값", correctPop1);
log("정상 버전 첫 pop() 후 배열", correct.snapshot());
const correctPop2 = correct.pop();
log("정상 버전 두 번째 pop() 반환값", correctPop2);

const buggyPop1 = buggy.pop();
log("버그 버전 첫 pop() 반환값", buggyPop1);
log("버그 버전 첫 pop() 후 배열", buggy.snapshot());
const buggyPop2 = buggy.pop();
log("버그 버전 두 번째 pop() 반환값 (가이드 228행이 주장하는 값과 실측 비교 대상)", buggyPop2);
