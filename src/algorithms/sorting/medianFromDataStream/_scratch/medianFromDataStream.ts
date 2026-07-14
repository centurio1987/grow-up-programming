// E3 자기검증: medianFromDataStream-guide.new.mdx 본문에 실린 코드를 그대로 추출해
// 본문의 모든 수치·트레이스·시뮬 프레임을 실측으로 재확인한다.

// ---- 출발점: naive ----
class MedianFinderNaive {
  private arr: number[] = [];
  addNum(num: number): void {
    this.arr.push(num);          // O(1)
  }
  findMedian(): number {
    const sorted = [...this.arr].sort((a, b) => a - b); // O(N log N)
    const n = sorted.length;
    if (n % 2 === 1) return sorted[(n - 1) / 2]!;
    return (sorted[n / 2 - 1]! + sorted[n / 2]!) / 2;
  }
}

// ---- 아이디어를 코드로 옮기기: 기본 구현 ----
class MinHeap {
  private data: number[] = [];
  size(): number { return this.data.length; }
  top(): number { return this.data[0]!; }
  push(x: number): void {
    this.data.push(x);
    let i = this.data.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.data[parent]! <= this.data[i]!) break;
      [this.data[parent]!, this.data[i]!] = [this.data[i]!, this.data[parent]!];
      i = parent;
    }
  }
  pop(): number {
    const top = this.data[0]!;
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      let i = 0;
      const n = this.data.length;
      while (true) {
        const l = 2 * i + 1, r = 2 * i + 2;
        let smallest = i;
        if (l < n && this.data[l]! < this.data[smallest]!) smallest = l;
        if (r < n && this.data[r]! < this.data[smallest]!) smallest = r;
        if (smallest === i) break;
        [this.data[smallest]!, this.data[i]!] = [this.data[i]!, this.data[smallest]!];
        i = smallest;
      }
    }
    return top;
  }
}

class MaxHeap {
  private inner = new MinHeap();
  size(): number { return this.inner.size(); }
  top(): number { return -this.inner.top(); }
  push(x: number): void { this.inner.push(-x); }
  pop(): number { return -this.inner.pop(); }
}

class MedianFinderBase {
  private lo = new MaxHeap(); // 하위 절반
  private hi = new MinHeap(); // 상위 절반

  addNum(num: number): void {
    if (this.lo.size() === 0 || num <= this.lo.top()) {
      this.lo.push(num);
    } else {
      this.hi.push(num);
    }
    if (this.lo.size() > this.hi.size() + 1) {
      this.hi.push(this.lo.pop());
    } else if (this.hi.size() > this.lo.size()) {
      this.lo.push(this.hi.pop());
    }
  }

  findMedian(): number {
    if (this.lo.size() > this.hi.size()) return this.lo.top();
    return (this.lo.top() + this.hi.top()) / 2;
  }
}

// ---- 최적화 코드 ----
class MedianFinder {
  private lo = new MaxHeap();
  private hi = new MinHeap();

  addNum(num: number): void {
    this.lo.push(num);
    this.hi.push(this.lo.pop());       // lo의 현재 최댓값을 hi로 넘김 → 값 불변식 자동 성립
    if (this.hi.size() > this.lo.size()) {
      this.lo.push(this.hi.pop());     // hi가 넘치면 되돌림 → 크기 불변식 복원
    }
  }

  findMedian(): number {
    if (this.lo.size() > this.hi.size()) return this.lo.top();
    return (this.lo.top() + this.hi.top()) / 2;
  }
}

// ---- 본문 인용 수치 검증 ----
let failures = 0;
function check(label: string, actual: number, expected: number) {
  if (actual !== expected) {
    failures++;
    console.log(`FAIL  ${label}: actual=${actual} expected=${expected}`);
  } else {
    console.log(`ok    ${label}: ${actual}`);
  }
}

console.log("=== 출발점 절 ascii 수치 (naive, 1,2,3,4) ===");
{
  const mf = new MedianFinderNaive();
  mf.addNum(1); check("addNum(1)", mf.findMedian(), 1);
  mf.addNum(2); check("addNum(2)", mf.findMedian(), 1.5);
  mf.addNum(3); check("addNum(3)", mf.findMedian(), 2);
  mf.addNum(4); check("addNum(4)", mf.findMedian(), 2.5);
}

console.log("\n=== 엣지 케이스 표 ===");
{
  const a = new MedianFinder();
  a.addNum(5);
  check("원소 1개", a.findMedian(), 5);

  const b = new MedianFinder();
  b.addNum(1); b.addNum(3);
  check("원소 2개", b.findMedian(), 2.0);

  const c = new MedianFinder();
  c.addNum(-1); c.addNum(0);
  check("음수 포함", c.findMedian(), -0.5);

  const d = new MedianFinder();
  d.addNum(5); d.addNum(5);
  check("동일 값", d.findMedian(), 5);

  const e = new MedianFinder();
  e.addNum(-1_000_000_000); e.addNum(1_000_000_000);
  check("경계값", e.findMedian(), 0);
}

console.log("\n=== 헷갈리기 쉬운 포인트: 방향이 뒤집힌 버그 버전 재현 ===");
{
  class BuggyMedianFinder {
    private lo = new MaxHeap();
    private hi = new MinHeap();
    addNum(num: number): void {
      if (this.hi.size() === 0 || num >= this.hi.top()) {
        this.hi.push(num);
      } else {
        this.lo.push(num);
      }
      if (this.hi.size() > this.lo.size() + 1) {
        this.lo.push(this.hi.pop());
      } else if (this.lo.size() > this.hi.size()) {
        this.hi.push(this.lo.pop());
      }
    }
    findMedian(): number {
      if (this.lo.size() > this.hi.size()) return this.lo.top();
      return (this.lo.top() + this.hi.top()) / 2;
    }
  }
  const buggy = new BuggyMedianFinder();
  for (const x of [1, 2, 3]) buggy.addNum(x);
  check("버그 버전 1,2,3", buggy.findMedian(), 1.5);

  const correct = new MedianFinder();
  for (const x of [1, 2, 3]) correct.addNum(x);
  check("정상 버전 1,2,3", correct.findMedian(), 2);
}

console.log("\n=== 실행 시각화 steps 프레임 (기본 구현, 1..5) ===");
{
  const mf = new MedianFinderBase();
  const expected = [1, 1.5, 2, 2.5, 3];
  [1, 2, 3, 4, 5].forEach((x, idx) => {
    mf.addNum(x);
    check(`addNum(${x})`, mf.findMedian(), expected[idx]!);
  });
}

console.log("\n=== 최적화 버전도 동일 시퀀스에서 같은 median (기본 구현과 교차검증) ===");
{
  const mf = new MedianFinder();
  const expected = [1, 1.5, 2, 2.5, 3];
  [1, 2, 3, 4, 5].forEach((x, idx) => {
    mf.addNum(x);
    check(`optimized addNum(${x})`, mf.findMedian(), expected[idx]!);
  });
}

console.log("\n=== 스스로 점검하기 문제 1 (7,2,9,4) ===");
{
  const mf = new MedianFinder();
  const expected = [7, 4.5, 7, 5.5];
  [7, 2, 9, 4].forEach((x, idx) => {
    mf.addNum(x);
    check(`addNum(${x})`, mf.findMedian(), expected[idx]!);
  });
}

console.log("\n=== base/optimized/naive 랜덤 교차검증 (200 trial) ===");
{
  let allMatch = true;
  for (let trial = 0; trial < 200; trial++) {
    const base = new MedianFinderBase();
    const opt = new MedianFinder();
    const naive = new MedianFinderNaive();
    const n = 1 + Math.floor(Math.random() * 40);
    for (let i = 0; i < n; i++) {
      const x = Math.floor(Math.random() * 2001) - 1000;
      base.addNum(x); opt.addNum(x); naive.addNum(x);
      const mb = base.findMedian(), mo = opt.findMedian(), mn = naive.findMedian();
      if (mb !== mo || mb !== mn) {
        allMatch = false;
        failures++;
        console.log("MISMATCH", { trial, i, x, mb, mo, mn });
      }
    }
  }
  console.log("all trials matched:", allMatch);
}

console.log(failures === 0 ? "\n전체 통과: 본문 수치 실측 일치" : `\n실패 ${failures}건 발견`);
