class CountMinSketch {
  private width: number;
  private depth: number;
  private counters: number[][];

  constructor(width: number, depth: number) {
    this.width = width;
    this.depth = depth;
    this.counters = Array.from({ length: depth }, () => new Array(width).fill(0));
  }

  private djb2(s: string): number {
    let h = 5381 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h = (Math.imul(h, 33) + s.charCodeAt(i)) >>> 0;
    }
    return h;
  }

  private mix(h: number): number {
    h = h >>> 0;
    h ^= h >>> 16;
    h = Math.imul(h, 0x85ebca6b) >>> 0;
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35) >>> 0;
    h ^= h >>> 16;
    return h >>> 0;
  }

  private position(row: number, item: string): number {
    return this.mix(this.djb2(`${row}:${item}`)) % this.width;
  }

  update(item: string, count: number): void {
    for (let j = 0; j < this.depth; j++) {
      const pos = this.position(j, item);
      this.counters[j][pos] += count;
    }
  }

  estimate(item: string): number {
    let result = Infinity;
    for (let j = 0; j < this.depth; j++) {
      const pos = this.position(j, item);
      result = Math.min(result, this.counters[j][pos]);
    }
    return result;
  }

  // 스크래치 전용: 시뮬레이션/검증을 위해 내부 상태와 위치를 노출
  debugMatrix(): number[][] {
    return this.counters.map((row) => [...row]);
  }
  debugPositions(item: string): number[] {
    return Array.from({ length: this.depth }, (_, j) => this.position(j, item));
  }
}

// ---- E3 자기검증: 대표 시나리오 ----
console.log("=== 대표 시나리오: w=4, d=3, item = ip_a, ip_b ===");
const cms = new CountMinSketch(4, 3);
console.log("pos(ip_a)=", cms.debugPositions("ip_a"), "pos(ip_b)=", cms.debugPositions("ip_b"));

cms.update("ip_a", 3);
console.log("update(ip_a,3) ->", cms.debugMatrix());

cms.update("ip_b", 2);
console.log("update(ip_b,2) ->", cms.debugMatrix());

cms.update("ip_a", 1);
console.log("update(ip_a,1) ->", cms.debugMatrix());

console.log("estimate(ip_a) =", cms.estimate("ip_a"), "(실제 빈도 4)");
console.log("estimate(ip_b) =", cms.estimate("ip_b"), "(실제 빈도 2)");

// ---- 엣지 케이스 ----
console.log("\n=== 엣지 케이스 ===");
const empty = new CountMinSketch(4, 3);
console.log("미등록 원소 estimate:", empty.estimate("never-seen")); // 기대: 0

const single = new CountMinSketch(1, 1);
single.update("x", 5);
single.update("y", 7);
console.log("w=1,d=1: estimate(x)=", single.estimate("x"), "estimate(y)=", single.estimate("y"), "(둘 다 총합 12과 같아야 함)");

// 과소추정 없음 대량 검증
const big = new CountMinSketch(2000, 6);
for (let i = 0; i < 100_000; i++) big.update("hot", 1);
console.log("100000회 update 후 estimate(hot) >= 100000 ?", big.estimate("hot") >= 100000, big.estimate("hot"));

// ---- 무작위 교차검증: CMS estimate >= 실제 빈도 (Map으로 정확값 계산) ----
console.log("\n=== 무작위 교차검증 ===");
function randomItem(n: number): string {
  return "item" + Math.floor(Math.random() * n);
}
let allOk = true;
for (let trial = 0; trial < 20; trial++) {
  const w = 8 + Math.floor(Math.random() * 20);
  const d = 2 + Math.floor(Math.random() * 5);
  const sketch = new CountMinSketch(w, d);
  const exact = new Map<string, number>();
  const events = 200;
  for (let i = 0; i < events; i++) {
    const item = randomItem(15);
    const count = 1 + Math.floor(Math.random() * 5);
    sketch.update(item, count);
    exact.set(item, (exact.get(item) ?? 0) + count);
  }
  for (const [item, freq] of exact) {
    const est = sketch.estimate(item);
    if (est < freq) {
      allOk = false;
      console.log("FAIL 과소추정 발견:", { w, d, item, freq, est });
    }
  }
}
console.log("모든 trial에서 과소추정 없음(estimate >= 실제 빈도):", allOk);

// ---- 충돌 관찰 로그 (본문 서술용) ----
console.log("\n=== 행1 충돌 관찰 ===");
console.log("row1 col3: ip_a 단독 기여 3+1=4, ip_b 충돌 기여 2 → 합계", cms.debugMatrix()[1]![3]);
