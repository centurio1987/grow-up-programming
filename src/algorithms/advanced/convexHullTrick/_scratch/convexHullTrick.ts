// E3 self-verification scratch. Guide's own code, independent of sibling convexHullTrick.ts.

type Line = { m: number; b: number };

function evalLine(l: Line, x: number): number {
  return l.m * x + l.b;
}

// l2(stack top)가 l1, l3 사이에서 담당 구간이 없어 제거 가능한지 판정.
// 전제: m1 <= m2 <= m3 (기울기 비감소)로 addLine이 호출된다.
function bad(l1: Line, l2: Line, l3: Line): boolean {
  return (l3.b - l1.b) * (l1.m - l2.m) >= (l2.b - l1.b) * (l1.m - l3.m);
}

// ---------- 원형: naive 선형 스캔 ----------
class ConvexHullTrickNaive {
  private lines: Line[] = [];
  addLine(m: number, b: number): void {
    this.lines.push({ m, b });
  }
  query(x: number): number {
    let best = Infinity;
    for (const l of this.lines) best = Math.min(best, evalLine(l, x));
    return best;
  }
}

// ---------- 개선: 볼록 껍질 스택 + 선형 스캔 query ----------
class ConvexHullTrickScan {
  private stack: Line[] = [];
  addLine(m: number, b: number): void {
    const newLine: Line = { m, b };
    // 같은 기울기 처리: 위쪽(top)과 기울기가 같으면 절편 비교로 즉시 판정
    while (
      this.stack.length > 0 &&
      this.stack[this.stack.length - 1]!.m === m
    ) {
      if (this.stack[this.stack.length - 1]!.b <= b) return; // 새 직선이 더 나쁘면 폐기
      this.stack.pop(); // 새 직선이 더 좋으면 기존 것 제거
    }
    while (
      this.stack.length >= 2 &&
      bad(this.stack[this.stack.length - 2]!, this.stack[this.stack.length - 1]!, newLine)
    ) {
      this.stack.pop();
    }
    this.stack.push(newLine);
  }
  query(x: number): number {
    let best = Infinity;
    for (const l of this.stack) best = Math.min(best, evalLine(l, x));
    return best;
  }
  size(): number {
    return this.stack.length;
  }
  snapshot(): Line[] {
    return this.stack.map((l) => ({ ...l }));
  }
}

// ---------- 최종: 볼록 껍질 스택 + 이진 탐색 query ----------
export class ConvexHullTrick {
  private stack: Line[] = [];

  addLine(m: number, b: number): void {
    const newLine: Line = { m, b };
    while (
      this.stack.length > 0 &&
      this.stack[this.stack.length - 1]!.m === m
    ) {
      if (this.stack[this.stack.length - 1]!.b <= b) return;
      this.stack.pop();
    }
    while (
      this.stack.length >= 2 &&
      bad(this.stack[this.stack.length - 2]!, this.stack[this.stack.length - 1]!, newLine)
    ) {
      this.stack.pop();
    }
    this.stack.push(newLine);
  }

  query(x: number): number {
    let lo = 0;
    let hi = this.stack.length - 1;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (evalLine(this.stack[mid]!, x) <= evalLine(this.stack[mid + 1]!, x)) {
        hi = mid;
      } else {
        lo = mid + 1;
      }
    }
    return evalLine(this.stack[lo]!, x);
  }

  size(): number {
    return this.stack.length;
  }
  snapshot(): Line[] {
    return this.stack.map((l) => ({ ...l }));
  }
}

// ================= 검증 =================
function assertEq(actual: number, expected: number, label: string) {
  if (actual !== expected) {
    throw new Error(`FAIL ${label}: expected ${expected}, got ${actual}`);
  }
  console.log(`OK ${label}: ${actual}`);
}

// --- 1. 문제 예시 1 ---
{
  const cht = new ConvexHullTrick();
  cht.addLine(1, 0);
  cht.addLine(2, -5);
  assertEq(cht.query(0), -5, "예시1 query(0)");
  assertEq(cht.query(5), 5, "예시1 query(5)");
  assertEq(cht.query(10), 10, "예시1 query(10)");
}

// --- 2. 문제 예시 2 ---
{
  const cht2 = new ConvexHullTrick();
  cht2.addLine(0, 10);
  cht2.addLine(1, 0);
  cht2.addLine(2, -10);
  assertEq(cht2.query(0), -10, "예시2 query(0)");
  assertEq(cht2.query(-100), -210, "예시2 query(-100)");
  assertEq(cht2.query(100), 10, "예시2 query(100)");
}

// --- 3. 문제 예시 3: 단일 직선 ---
{
  const cht3 = new ConvexHullTrick();
  cht3.addLine(3, 7);
  assertEq(cht3.query(0), 7, "예시3 query(0)");
  assertEq(cht3.query(10), 37, "예시3 query(10)");
  assertEq(cht3.query(-5), -8, "예시3 query(-5)");
}

// --- 4. 시뮬레이션 트레이스: addLine(-2,0),(-1,5),(0,-1),(2,0) 후 query(0) ---
{
  const cht = new ConvexHullTrickScan();
  cht.addLine(-2, 0);
  console.log("step1 stack:", cht.snapshot()); // [(-2,0)]
  cht.addLine(-1, 5);
  console.log("step2 stack:", cht.snapshot()); // [(-2,0),(-1,5)]
  console.log(
    "bad(l0,l1,new(0,-1)) =",
    bad({ m: -2, b: 0 }, { m: -1, b: 5 }, { m: 0, b: -1 }),
  );
  cht.addLine(0, -1);
  console.log("step3 stack (after addLine(0,-1)):", cht.snapshot());
  console.log(
    "bad(l0,l1(top=0,-1),new(2,0)) =",
    bad({ m: -2, b: 0 }, { m: 0, b: -1 }, { m: 2, b: 0 }),
  );
  cht.addLine(2, 0);
  console.log("step4 stack (after addLine(2,0)):", cht.snapshot());
  assertEq(cht.query(0), -1, "시뮬 query(0)");
}

// --- 4b. 최종(이진 탐색) 버전으로도 같은 시퀀스 검증 + 이진탐색 mid 트레이스 ---
{
  const cht = new ConvexHullTrick();
  cht.addLine(-2, 0);
  cht.addLine(-1, 5);
  cht.addLine(0, -1);
  cht.addLine(2, 0);
  console.log("final stack:", cht.snapshot());
  // 수동 이진 탐색 트레이스 재현 (query 내부 로직과 동일)
  const st = cht.snapshot();
  let lo = 0;
  let hi = st.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const vMid = evalLine(st[mid]!, 0);
    const vMid1 = evalLine(st[mid + 1]!, 0);
    console.log(`lo=${lo} hi=${hi} mid=${mid} eval(mid)=${vMid} eval(mid+1)=${vMid1}`);
    if (vMid <= vMid1) hi = mid;
    else lo = mid + 1;
  }
  console.log(`converge lo=hi=${lo}`);
  assertEq(cht.query(0), -1, "최종 query(0)");
}

// --- 5. 동일 기울기 연속 추가: 더 작은 b만 생존 ---
{
  const cht = new ConvexHullTrick();
  cht.addLine(1, 5);
  cht.addLine(1, 2); // 더 작은 b → 이전 것 대체
  cht.addLine(1, 8); // 더 큰 b → 폐기
  console.log("동일 기울기 스택:", cht.snapshot());
  assertEq(cht.size(), 1, "동일 기울기 스택 크기");
  assertEq(cht.query(0), 2, "동일 기울기 query(0)");
  assertEq(cht.query(100), 102, "동일 기울기 query(100)");
}

// --- 6. 모든 직선이 평행 (m 전부 동일) ---
{
  const cht = new ConvexHullTrick();
  cht.addLine(3, 10);
  cht.addLine(3, 4);
  cht.addLine(3, 7);
  cht.addLine(3, -1);
  assertEq(cht.size(), 1, "평행선 스택 크기");
  assertEq(cht.query(-50), 3 * -50 - 1, "평행선 query(-50)");
  assertEq(cht.query(50), 3 * 50 - 1, "평행선 query(50)");
}

// --- 7. 극단값 쿼리 ---
{
  const cht = new ConvexHullTrick();
  cht.addLine(-1_000_000_000, -1_000_000_000_000_000_000);
  cht.addLine(1_000_000_000, 1_000_000_000_000_000_000);
  const r1 = cht.query(1_000_000_000);
  const r2 = cht.query(-1_000_000_000);
  console.log("극단값 query(1e9) =", r1, " query(-1e9) =", r2);
}

// --- 8. 무작위 교차검증: naive vs 최종 구현 ---
{
  let seed = 42;
  function rnd() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  }
  function randInt(lo: number, hi: number) {
    return Math.floor(lo + rnd() * (hi - lo + 1));
  }

  for (let trial = 0; trial < 200; trial++) {
    const n = randInt(1, 12);
    const naive = new ConvexHullTrickNaive();
    const fast = new ConvexHullTrick();
    let m = randInt(-20, -10);
    for (let i = 0; i < n; i++) {
      m += randInt(0, 4); // 비감소 순서 보장
      const b = randInt(-100, 100);
      naive.addLine(m, b);
      fast.addLine(m, b);
    }
    for (let q = 0; q < 20; q++) {
      const x = randInt(-50, 50);
      const expected = naive.query(x);
      const actual = fast.query(x);
      if (expected !== actual) {
        throw new Error(
          `무작위 불일치 trial=${trial} x=${x} expected=${expected} actual=${actual}`,
        );
      }
    }
  }
  console.log("OK 무작위 200회 교차검증 통과");
}

console.log("모든 검증 통과");
