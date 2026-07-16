// E3 자기검증용 스크래치 — 가이드 본문 코드를 그대로 옮겨 실행/검증한다.

// ── 섹션 2: naive 비교 기반 정렬 (버블 정렬) ──────────────────────────────
function bubbleSortNaive(A: number[]): number[] {
  const B = [...A];
  let comparisons = 0;
  for (let i = 0; i < B.length; i++) {
    for (let j = 0; j < B.length - 1 - i; j++) {
      comparisons++;
      if (B[j]! > B[j + 1]!) {
        [B[j], B[j + 1]] = [B[j + 1]!, B[j]!];
      }
    }
  }
  return [B, comparisons] as unknown as number[]; // 편의상 comparisons도 같이 반환(테스트 전용)
}

function bubbleSortWithCount(A: number[]): { sorted: number[]; comparisons: number } {
  const B = [...A];
  let comparisons = 0;
  for (let i = 0; i < B.length; i++) {
    for (let j = 0; j < B.length - 1 - i; j++) {
      comparisons++;
      if (B[j]! > B[j + 1]!) {
        [B[j], B[j + 1]] = [B[j + 1]!, B[j]!];
      }
    }
  }
  return { sorted: B, comparisons };
}

// ── 섹션 4: 아이디어를 코드로 옮기기 — 단순 버전(비안정) ───────────────────
function countingSortSimple(A: number[], k = 1000): number[] {
  const C = new Array(k + 1).fill(0); // 인덱스 0..k, 크기 k+1
  for (const v of A) {
    C[v]++;
  }
  const B: number[] = [];
  for (let v = 0; v <= k; v++) {
    for (let c = 0; c < C[v]; c++) {
      B.push(v);
    }
  }
  return B;
}

// 집계 중간 상태를 스냅샷으로 남기는 계측판(가이드 시뮬레이션 검증용)
function countingSortSimpleTraced(A: number[], k = 3) {
  const C = new Array(k + 1).fill(0);
  const snapshots: number[][] = [C.slice()];
  for (const v of A) {
    C[v]++;
    snapshots.push(C.slice());
  }
  const B: number[] = [];
  const outputSnapshots: { v: number; B: number[] }[] = [];
  for (let v = 0; v <= k; v++) {
    for (let c = 0; c < C[v]; c++) {
      B.push(v);
    }
    outputSnapshots.push({ v, B: B.slice() });
  }
  return { finalC: C, snapshots, outputSnapshots, result: B };
}

// ── 섹션 4: 최종 — 안정 버전(누적합 + 역방향 배치) ─────────────────────────
function countingSortStable(A: number[]): number[] {
  if (A.length === 0) return [];
  const k = Math.max(...A);
  const C = new Array(k + 1).fill(0);

  for (const v of A) {
    C[v]++;
  }

  for (let i = 1; i <= k; i++) {
    C[i] += C[i - 1];
  }

  const B = new Array(A.length);
  for (let i = A.length - 1; i >= 0; i--) {
    const v = A[i]!;
    C[v]--;
    B[C[v]] = v;
  }
  return B;
}

// 함정 확인용: 누적합 방향을 반대로(오른쪽→왼쪽) 계산하면 어떻게 되는지
function countingSortStableWrongCumsumDirection(A: number[]): number[] {
  if (A.length === 0) return [];
  const k = Math.max(...A);
  const C = new Array(k + 1).fill(0);
  for (const v of A) C[v]++;

  // 함정: 오른쪽에서 왼쪽으로 누적합 (잘못된 방향)
  for (let i = k - 1; i >= 0; i--) {
    C[i] += C[i + 1];
  }

  const B = new Array(A.length);
  for (let i = A.length - 1; i >= 0; i--) {
    const v = A[i]!;
    C[v]--;
    B[C[v]] = v;
  }
  return B;
}

// 함정 확인용: 안정 배치를 앞→뒤로 수행하면 상대 순서가 어떻게 역전되는지
function countingSortStableWrongDirection(A: number[]): number[] {
  if (A.length === 0) return [];
  const k = Math.max(...A);
  const C = new Array(k + 1).fill(0);
  for (const v of A) C[v]++;
  for (let i = 1; i <= k; i++) C[i] += C[i - 1];

  const B = new Array(A.length);
  // 함정: 앞에서 뒤로(i=0..N-1) 배치
  for (let i = 0; i < A.length; i++) {
    const v = A[i]!;
    C[v]--;
    B[C[v]] = v;
  }
  return B;
}

// ── 검증 실행 ──────────────────────────────────────────────────────────
function eq(a: number[], b: number[]) {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

console.log("=== 섹션 2: naive 버블 정렬 ===");
{
  const A = [3, 0, 1, 3, 1, 0];
  const { sorted, comparisons } = bubbleSortWithCount(A);
  console.log("A =", A, "-> sorted:", sorted, "comparisons:", comparisons);
  // N=6 → N(N-1)/2 = 15
  console.log("기대 비교 횟수(N(N-1)/2):", (A.length * (A.length - 1)) / 2);
}
{
  const N = 100000;
  console.log(`N=${N}일 때 N(N-1)/2 =`, (N * (N - 1)) / 2);
}

console.log("\n=== 섹션 3.1 / 4: 단순 버전 트레이스 (A=[3,0,1,3,1,0], k=3) ===");
{
  const A = [3, 0, 1, 3, 1, 0];
  const traced = countingSortSimpleTraced(A, 3);
  console.log("집계 스냅샷 (초기 포함):");
  traced.snapshots.forEach((s, i) => console.log(`  step${i}:`, s));
  console.log("최종 C:", traced.finalC);
  console.log("출력 스냅샷:");
  traced.outputSnapshots.forEach((s) => console.log(`  v=${s.v} ->`, s.B));
  console.log("최종 결과:", traced.result);
}

console.log("\n=== 엣지 케이스 (단순 버전) ===");
{
  console.log("countingSortSimple([]) =", countingSortSimple([]));
  console.log("countingSortSimple([5]) =", countingSortSimple([5], 1000));
  console.log("countingSortSimple([3,3,3]) =", countingSortSimple([3, 3, 3], 1000));
  console.log(
    "countingSortSimple([0,1000,500]) =",
    countingSortSimple([0, 1000, 500], 1000),
  );
  console.log("countingSortSimple([1,2,3]) =", countingSortSimple([1, 2, 3], 1000));
}

console.log("\n=== 안정 버전 검증 ===");
{
  const cases: number[][] = [
    [3, 0, 1, 3, 1, 0],
    [],
    [5],
    [3, 3, 3],
    [0, 1000, 500],
    [1, 2, 3],
    [4, 2, 2, 8, 3, 3, 1],
  ];
  for (const A of cases) {
    const simple = countingSortSimple(A, 1000);
    const stable = countingSortStable(A);
    console.log(
      `A=${JSON.stringify(A)} -> simple=${JSON.stringify(simple)} stable=${JSON.stringify(stable)} 일치=${eq(simple, stable)}`,
    );
  }
}

console.log("\n=== 무작위 교차검증 (simple vs stable vs Array.sort) ===");
{
  let allMatch = true;
  for (let trial = 0; trial < 200; trial++) {
    const n = Math.floor(Math.random() * 30);
    const A = Array.from({ length: n }, () => Math.floor(Math.random() * 1001));
    const simple = countingSortSimple(A, 1000);
    const stable = countingSortStable(A);
    const ref = [...A].sort((a, b) => a - b);
    if (!eq(simple, ref) || !eq(stable, ref)) {
      allMatch = false;
      console.log("불일치 발견!", A, simple, stable, ref);
    }
  }
  console.log("모든 무작위 케이스 일치:", allMatch);
}

console.log("\n=== 함정: 누적합 방향을 반대로 하면? (A=[3,0,1,3,1,0]) ===");
{
  const A = [3, 0, 1, 3, 1, 0];
  const wrong = countingSortStableWrongCumsumDirection(A);
  const correct = countingSortStable(A);
  console.log("올바른 결과:", correct);
  console.log("잘못된 결과(누적합 반대 방향):", wrong);
}

console.log("\n=== 함정: 안정 배치를 앞→뒤로 하면 상대 순서가 어떻게 되는가? ===");
{
  // 값은 같지만 "어느 인스턴스인지" 구분하기 위해 (값, 원본 인덱스) 쌍으로 안정성을 확인.
  // countingSort는 숫자만 정렬하므로, 값이 같은 원소들의 상대 순서 자체는 최종 배열에서
  // 구분되지 않는다. 대신 누적합 배열 C의 최종 인덱스 배치를 직접 관찰해 방향 차이를 보인다.
  const A = [1, 1, 1];
  const k = 1;
  const C1 = new Array(k + 1).fill(0);
  for (const v of A) C1[v]++;
  for (let i = 1; i <= k; i++) C1[i] += C1[i - 1];
  console.log("누적합 C(안정 버전, A=[1,1,1], k=1):", C1); // [0, 3]

  // 뒤에서 앞으로(올바름): 마지막 인스턴스가 먼저 가장 뒤 위치(인덱스2)에 배치되고
  // 그다음 인스턴스가 인덱스1, 처음 인스턴스가 인덱스0에 배치되어 원본 순서 유지.
  const Cb = C1.slice();
  const posBackward: number[] = [];
  for (let i = A.length - 1; i >= 0; i--) {
    Cb[A[i]!]--;
    posBackward[i] = Cb[A[i]!];
  }
  console.log("뒤→앞 배치 결과 (원본 인덱스 -> 최종 위치):", posBackward); // [0,1,2] 순서 유지 기대

  // 앞에서 뒤로(잘못됨): 처음 인스턴스가 가장 뒤 위치에 먼저 배치되어 순서가 뒤집힌다.
  const Cf = C1.slice();
  const posForward: number[] = [];
  for (let i = 0; i < A.length; i++) {
    Cf[A[i]!]--;
    posForward[i] = Cf[A[i]!];
  }
  console.log("앞→뒤 배치 결과 (원본 인덱스 -> 최종 위치, 함정):", posForward); // 역전 기대: [2,1,0]
}
