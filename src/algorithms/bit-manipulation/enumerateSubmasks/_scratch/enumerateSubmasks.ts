// E3 자기검증 스크래치 — 가이드 본문에 싣는 코드를 그대로 옮겨 실행 검증한다.
// `bun src/algorithms/bit-manipulation/enumerateSubmasks/_scratch/enumerateSubmasks.ts`

// ── naive (출발점 절) ────────────────────────────────────────────────
function enumerateSubmasksNaive(mask: number): number[] {
  const result: number[] = [];
  for (let s = mask; s >= 0; s--) {
    if ((s & mask) === s) result.push(s);
  }
  return result;
}

// ── 기본 구현 (아이디어를 코드로 옮기기 절) ─────────────────────────
function enumerateSubmasksBasic(mask: number): number[] {
  const result: number[] = [];
  let s = mask;
  while (s > 0) {
    result.push(s);
    s = (s - 1) & mask;
  }
  result.push(0);
  return result;
}

// ── popcount (Brian Kernighan 트릭 — x &= x-1 로 최하위 1비트 제거) ──
function popcount(x: number): number {
  let c = 0;
  while (x) {
    x &= x - 1;
    c++;
  }
  return c;
}

// ── 최적화 코드 (최적화 코드 절) ────────────────────────────────────
function enumerateSubmasksOptimized(mask: number): number[] {
  const size = 1 << popcount(mask);
  const result = new Array<number>(size);
  let idx = 0;
  let s = mask;
  for (;;) {
    result[idx++] = s;
    if (s === 0) break;
    s = (s - 1) & mask;
  }
  return result;
}

// ── 실측 1: 대표 예시 mask = 0b1011 = 11 ────────────────────────────
console.log("mask=11(0b1011):");
console.log(" naive     =", enumerateSubmasksNaive(0b1011));
console.log(" basic     =", enumerateSubmasksBasic(0b1011));
console.log(" optimized =", enumerateSubmasksOptimized(0b1011));

// ── 실측 2: 대표 예시 mask = 0b101 = 5 ──────────────────────────────
console.log("mask=5(0b101):", enumerateSubmasksOptimized(0b101));

// ── 실측 3: 엣지 mask = 0 ───────────────────────────────────────────
console.log("mask=0:", enumerateSubmasksOptimized(0));

// ── 실측 4: 엣지 mask = 1 (최하위 비트 1개) ─────────────────────────
console.log("mask=1:", enumerateSubmasksOptimized(1));

// ── 실측 5: 엣지 mask = 0b1000 = 8 (비트 1개, 최상위) ───────────────
console.log("mask=8(0b1000):", enumerateSubmasksOptimized(0b1000));

// ── 실측 6: 큰 입력 mask = 2^20 (비트 1개, 최대 규모) ───────────────
console.log("mask=2^20:", enumerateSubmasksOptimized(1 << 20));

// ── 실측 7: 큰 입력 mask = 2^20 - 1 (20비트 전부 세팅) ──────────────
const fullMask = (1 << 20) - 1;
const fullResult = enumerateSubmasksOptimized(fullMask);
console.log(
  "mask=2^20-1: length =",
  fullResult.length,
  "expected 2^20 =",
  1 << 20,
  "first5 =",
  fullResult.slice(0, 5),
  "last5 =",
  fullResult.slice(-5),
);

// ── 교차검증: naive vs basic vs optimized, 작은 mask 전수 + 랜덤 ───
function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

let mismatches = 0;
for (let m = 0; m <= 0xff; m++) {
  const n = enumerateSubmasksNaive(m);
  const b = enumerateSubmasksBasic(m);
  const o = enumerateSubmasksOptimized(m);
  if (!arraysEqual(n, b) || !arraysEqual(n, o)) {
    mismatches++;
    console.log("MISMATCH at mask=", m, { n, b, o });
  }
}
console.log(`전수 교차검증(mask=0..255): mismatches = ${mismatches}`);

let randomMismatches = 0;
for (let i = 0; i < 500; i++) {
  const m = Math.floor(Math.random() * (1 << 16));
  const n = enumerateSubmasksNaive(m);
  const o = enumerateSubmasksOptimized(m);
  if (!arraysEqual(n, o)) {
    randomMismatches++;
    console.log("RANDOM MISMATCH at mask=", m);
  }
}
console.log(`랜덤 교차검증(500회, 16비트 범위): mismatches = ${randomMismatches}`);

// ── popcount 검증 ───────────────────────────────────────────────────
console.log("popcount(0b1011) =", popcount(0b1011), "(expected 3)");
console.log("popcount(0) =", popcount(0), "(expected 0)");
console.log("popcount((1<<20)-1) =", popcount((1 << 20) - 1), "(expected 20)");

// ── 함정 시나리오 검증: s===0 브레이크를 빼먹으면 무한 재순회 ──────
// (0 - 1) & mask === mask 이므로 s가 다시 mask로 되돌아간다.
console.log("함정 확인: (0-1) & 11 =", (0 - 1) & 0b1011, "(=11, 원점으로 복귀 → 무한루프 근거)");
