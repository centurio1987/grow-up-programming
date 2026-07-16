// E3 자기 검증용 스크래치: 가이드 본문 코드(원형/기본/최적화)를 그대로 추출해 실행 확인한다.
// 가이드: mosAlgorithm-guide.new.mdx 의 B6(원형)/아이디어를 코드로 옮기기(기본)/최적화 코드(최적화) 절과 1:1 대응.

function mosAlgorithmNaive(arr: number[], queries: [number, number][]): number[] {
  return queries.map(([l, r]) => {
    const seen = new Set<number>();
    for (let i = l; i <= r; i++) seen.add(arr[i]);
    return seen.size;
  });
}

function mosAlgorithmBasic(arr: number[], queries: [number, number][]): number[] {
  const n = arr.length;
  const q = queries.length;
  const B = Math.max(1, Math.floor(Math.sqrt(n))); // n=0,1 보호

  const indexed = queries.map(([l, r], i) => ({ l, r, i }));
  indexed.sort((a, b) => {
    const blockA = Math.floor(a.l / B);
    const blockB = Math.floor(b.l / B);
    if (blockA !== blockB) return blockA - blockB; // 1차: l의 블록
    return a.r - b.r; // 2차: r 오름차순
  });

  const freq = new Map<number, number>();
  let distinctCount = 0;

  const add = (x: number) => {
    const f = (freq.get(x) ?? 0) + 1;
    freq.set(x, f);
    if (f === 1) distinctCount++;
  };
  const remove = (x: number) => {
    const f = (freq.get(x) ?? 0) - 1;
    freq.set(x, f);
    if (f === 0) distinctCount--;
  };

  const answers = new Array<number>(q);
  let curL = 0;
  let curR = -1; // 빈 구간에서 시작

  for (const { l, r, i } of indexed) {
    while (curR < r) { curR++; add(arr[curR]); } // ① 오른쪽 확장
    while (curL > l) { curL--; add(arr[curL]); } // ② 왼쪽 확장
    while (curR > r) { remove(arr[curR]); curR--; } // ③ 오른쪽 축소
    while (curL < l) { remove(arr[curL]); curL++; } // ④ 왼쪽 축소
    answers[i] = distinctCount;
  }

  return answers;
}

function mosAlgorithmOptimized(arr: number[], queries: [number, number][]): number[] {
  const n = arr.length;
  const q = queries.length;
  const B = Math.max(1, Math.floor(Math.sqrt(n)));

  const indexed = queries.map(([l, r], i) => ({ l, r, i }));
  indexed.sort((a, b) => {
    const blockA = Math.floor(a.l / B);
    const blockB = Math.floor(b.l / B);
    if (blockA !== blockB) return blockA - blockB;
    return blockA % 2 === 0
      ? a.r - b.r // 짝수 블록: r 오름차순
      : b.r - a.r; // 홀수 블록: r 내림차순
  });

  const freq = new Map<number, number>();
  let distinctCount = 0;

  const add = (x: number) => {
    const f = (freq.get(x) ?? 0) + 1;
    freq.set(x, f);
    if (f === 1) distinctCount++;
  };
  const remove = (x: number) => {
    const f = (freq.get(x) ?? 0) - 1;
    freq.set(x, f);
    if (f === 0) distinctCount--;
  };

  const answers = new Array<number>(q);
  let curL = 0;
  let curR = -1;

  for (const { l, r, i } of indexed) {
    while (curR < r) { curR++; add(arr[curR]); }
    while (curL > l) { curL--; add(arr[curL]); }
    while (curR > r) { remove(arr[curR]); curR--; }
    while (curL < l) { remove(arr[curL]); curL++; }
    answers[i] = distinctCount;
  }

  return answers;
}

// 1) 본문 고정 입력(실행 시각화 절) 검증
const arr = [1, 3, 2, 3, 1, 2];
const queries: [number, number][] = [[1, 4], [0, 2], [2, 5]];

console.log("fixed input arr:", arr, "queries:", queries);
console.log("naive     :", mosAlgorithmNaive(arr, queries));
console.log("basic     :", mosAlgorithmBasic(arr, queries));
console.log("optimized :", mosAlgorithmOptimized(arr, queries));

// 2) 스스로 점검하기 1번: arr=[5,5,5,5], queries=[[0,3],[1,2]]
const arr2 = [5, 5, 5, 5];
const queries2: [number, number][] = [[0, 3], [1, 2]];
console.log("check-arr2 result (naive/basic/optimized):",
  mosAlgorithmNaive(arr2, queries2),
  mosAlgorithmBasic(arr2, queries2),
  mosAlgorithmOptimized(arr2, queries2),
);

// 2b) 실제 포인터 이동 칸 수 계수 (basic 정렬 기준)
function countMoves(arr: number[], queries: [number, number][]) {
  const n = arr.length;
  const B = Math.max(1, Math.floor(Math.sqrt(n)));
  const indexed = queries.map(([l, r], i) => ({ l, r, i }));
  indexed.sort((a, b) => {
    const bA = Math.floor(a.l / B), bB = Math.floor(b.l / B);
    if (bA !== bB) return bA - bB;
    return a.r - b.r;
  });
  let curL = 0, curR = -1;
  const order: string[] = [];
  const moves: number[] = [];
  for (const { l, r } of indexed) {
    let m = 0;
    while (curR < r) { curR++; m++; }
    while (curL > l) { curL--; m++; }
    while (curR > r) { curR--; m++; }
    while (curL < l) { curL++; m++; }
    order.push(`[${l},${r}]`);
    moves.push(m);
  }
  return { order, moves };
}
console.log("check-arr2 processing order & moves:", countMoves(arr2, queries2));

// 3) 랜덤 브루트포스 교차검증: naive vs basic vs optimized
function randomTest(trials: number) {
  for (let t = 0; t < trials; t++) {
    const n = 1 + Math.floor(Math.random() * 20);
    const arrR = Array.from({ length: n }, () => Math.floor(Math.random() * 5));
    const q = 1 + Math.floor(Math.random() * 20);
    const queriesR: [number, number][] = Array.from({ length: q }, () => {
      const a = Math.floor(Math.random() * n);
      const b = Math.floor(Math.random() * n);
      return [Math.min(a, b), Math.max(a, b)];
    });

    const naive = mosAlgorithmNaive(arrR, queriesR);
    const basic = mosAlgorithmBasic(arrR, queriesR);
    const optimized = mosAlgorithmOptimized(arrR, queriesR);

    const okBasic = JSON.stringify(naive) === JSON.stringify(basic);
    const okOpt = JSON.stringify(naive) === JSON.stringify(optimized);

    if (!okBasic || !okOpt) {
      console.error("MISMATCH", { arrR, queriesR, naive, basic, optimized });
      process.exit(1);
    }
  }
  console.log(`randomTest passed: ${trials} trials (naive == basic == optimized)`);
}

randomTest(500);
