// ORD-003 nQueens 가이드 자기검증용 스크래치. 가이드 본문 코드와 동일해야 한다.

// 원형: 순열 생성 + 대각선 사후 검사
function nQueensNaive(n: number): number {
  const cols = Array.from({ length: n }, (_, i) => i); // [0,1,...,n-1] 열 배치 후보
  let count = 0;

  function isValid(p: number[]): boolean {
    for (let r1 = 0; r1 < n; r1++) {
      for (let r2 = r1 + 1; r2 < n; r2++) {
        if (Math.abs(p[r1] - p[r2]) === Math.abs(r1 - r2)) return false; // 대각선 충돌
      }
    }
    return true;
  }

  function permute(arr: number[], k: number) {
    if (k === arr.length) {
      if (isValid(arr)) count++;
      return;
    }
    for (let i = k; i < arr.length; i++) {
      [arr[k], arr[i]] = [arr[i], arr[k]];
      permute(arr, k + 1);
      [arr[k], arr[i]] = [arr[i], arr[k]];
    }
  }

  permute(cols, 0);
  return count;
}

// 기본 구현: 배열 3개로 상태를 관리하는 백트래킹(가지치기)
function nQueensBacktrack(n: number): number {
  const usedCol = new Array(n).fill(false);
  const usedDiag1 = new Array(2 * n - 1).fill(false); // 인덱스: row - c + (n - 1)
  const usedDiag2 = new Array(2 * n - 1).fill(false); // 인덱스: row + c
  let count = 0;

  function dfs(row: number) {
    if (row === n) {
      count++;
      return;
    }
    for (let c = 0; c < n; c++) {
      const d1 = row - c + (n - 1);
      const d2 = row + c;
      if (usedCol[c] || usedDiag1[d1] || usedDiag2[d2]) continue; // 충돌 → 이 열은 건너뛴다(가지치기)

      usedCol[c] = usedDiag1[d1] = usedDiag2[d2] = true; // 배치
      dfs(row + 1);
      usedCol[c] = usedDiag1[d1] = usedDiag2[d2] = false; // 되돌리기
    }
  }

  dfs(0);
  return count;
}

// 최적화 코드: 비트마스크 3개로 상태를 압축한 백트래킹
function nQueens(n: number): number {
  let count = 0;

  function dfs(row: number, cols: number, diag1: number, diag2: number) {
    if (row === n) {
      count++;
      return;
    }
    for (let c = 0; c < n; c++) {
      const d1 = row - c + (n - 1); // 대각선(\) 인덱스, 범위 [0, 2n-2]
      const d2 = row + c; // 반대각선(/) 인덱스, 범위 [0, 2n-2]

      if ((cols >> c) & 1) continue; // 열 충돌
      if ((diag1 >> d1) & 1) continue; // 대각선 충돌
      if ((diag2 >> d2) & 1) continue; // 반대각선 충돌

      cols |= 1 << c; // 배치: 비트 설정
      diag1 |= 1 << d1;
      diag2 |= 1 << d2;

      dfs(row + 1, cols, diag1, diag2); // 다음 행으로 재귀

      cols ^= 1 << c; // 되돌리기: XOR로 비트 복원 (A ⊕ B ⊕ B = A)
      diag1 ^= 1 << d1;
      diag2 ^= 1 << d2;
    }
  }

  dfs(0, 0, 0, 0);
  return count;
}

// ---- 자기검증 ----
const known: Record<number, number> = {
  1: 1,
  2: 0,
  3: 0,
  4: 2,
  5: 10,
  6: 4,
  7: 40,
  8: 92,
  9: 352,
  10: 724,
  11: 2680,
  12: 14200,
};

console.log("== naive (순열) : n=1..8 ==");
for (let n = 1; n <= 8; n++) {
  const got = nQueensNaive(n);
  const ok = got === known[n];
  console.log(`n=${n}: got=${got} expected=${known[n]} ${ok ? "OK" : "MISMATCH"}`);
  if (!ok) throw new Error(`naive mismatch at n=${n}`);
}

console.log("== backtrack (배열) : n=1..10 ==");
for (let n = 1; n <= 10; n++) {
  const got = nQueensBacktrack(n);
  const ok = got === known[n];
  console.log(`n=${n}: got=${got} expected=${known[n]} ${ok ? "OK" : "MISMATCH"}`);
  if (!ok) throw new Error(`backtrack mismatch at n=${n}`);
}

console.log("== bitmask (최종) : n=1..12 ==");
for (let n = 1; n <= 12; n++) {
  const got = nQueens(n);
  const ok = got === known[n];
  console.log(`n=${n}: got=${got} expected=${known[n]} ${ok ? "OK" : "MISMATCH"}`);
  if (!ok) throw new Error(`bitmask mismatch at n=${n}`);
}

// 무작위 교차검증: backtrack vs bitmask, n=1..10 범위에서 여러 번 비교
console.log("== cross-check backtrack vs bitmask (random n) ==");
for (let i = 0; i < 8; i++) {
  const n = 1 + Math.floor(Math.random() * 10); // 1..10
  const a = nQueensBacktrack(n);
  const b = nQueens(n);
  console.log(`n=${n}: backtrack=${a} bitmask=${b} ${a === b ? "OK" : "MISMATCH"}`);
  if (a !== b) throw new Error(`cross-check mismatch at n=${n}`);
}

// n=4 시뮬레이션 트레이스 재현 (가이드 실행 시각화 절 검증용)
console.log("== n=4 dfs 트레이스 ==");
{
  const n = 4;
  const trace: string[] = [];
  let count = 0;
  function dfs(row: number, cols: number, diag1: number, diag2: number) {
    if (row === n) {
      count++;
      trace.push(`row=${n} 도달 → count=${count}`);
      return;
    }
    for (let c = 0; c < n; c++) {
      const d1 = row - c + (n - 1);
      const d2 = row + c;
      if ((cols >> c) & 1) continue;
      if ((diag1 >> d1) & 1) continue;
      if ((diag2 >> d2) & 1) continue;
      trace.push(`시도: row=${row}, c=${c} → 배치`);
      dfs(row + 1, cols | (1 << c), diag1 | (1 << d1), diag2 | (1 << d2));
    }
  }
  dfs(0, 0, 0, 0);
  console.log(trace.join("\n"));
  console.log(`최종 count=${count}`);
}

console.log("ALL CHECKS PASSED");
