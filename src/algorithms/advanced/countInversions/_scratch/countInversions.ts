// E3 자기검증 스크립트 — 가이드 본문 코드를 그대로 옮겨 실측한다.

// ── naive (출발점 절) ──────────────────────────────
function countInversionsNaive(arr: number[]): number {
  let count = 0;
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i]! > arr[j]!) count++;
    }
  }
  return count;
}

// ── 기본 구현 (아이디어를 코드로 옮기기 절) : merge마다 slice로 새 배열 할당 ──
function countInversionsBasic(arr: number[]): number {
  const n = arr.length;
  if (n <= 1) return 0;
  const a = arr.slice();

  function merge(lo: number, mid: number, hi: number): number {
    const L = a.slice(lo, mid + 1);
    const R = a.slice(mid + 1, hi + 1);
    let i = 0;
    let j = 0;
    let k = lo;
    let count = 0;
    while (i < L.length && j < R.length) {
      if (L[i]! <= R[j]!) {
        a[k++] = L[i]!;
        i++;
      } else {
        count += L.length - i;
        a[k++] = R[j]!;
        j++;
      }
    }
    while (i < L.length) a[k++] = L[i++]!;
    while (j < R.length) a[k++] = R[j++]!;
    return count;
  }

  function mergeSort(lo: number, hi: number): number {
    if (lo >= hi) return 0;
    const mid = Math.floor((lo + hi) / 2);
    let count = mergeSort(lo, mid);
    count += mergeSort(mid + 1, hi);
    count += merge(lo, mid, hi);
    return count;
  }

  return mergeSort(0, n - 1);
}

// ── 버그 버전: L[i] <= R[j] 대신 L[i] < R[j]를 써서 동률을 R쪽으로 흘림 ──
function countInversionsBuggy(arr: number[]): number {
  const n = arr.length;
  if (n <= 1) return 0;
  const a = arr.slice();

  function merge(lo: number, mid: number, hi: number): number {
    const L = a.slice(lo, mid + 1);
    const R = a.slice(mid + 1, hi + 1);
    let i = 0;
    let j = 0;
    let k = lo;
    let count = 0;
    while (i < L.length && j < R.length) {
      if (L[i]! < R[j]!) {
        // 버그: 동률(L[i] === R[j])일 때도 else 분기로 빠짐
        a[k++] = L[i]!;
        i++;
      } else {
        count += L.length - i;
        a[k++] = R[j]!;
        j++;
      }
    }
    while (i < L.length) a[k++] = L[i++]!;
    while (j < R.length) a[k++] = R[j++]!;
    return count;
  }

  function mergeSort(lo: number, hi: number): number {
    if (lo >= hi) return 0;
    const mid = Math.floor((lo + hi) / 2);
    let count = mergeSort(lo, mid);
    count += mergeSort(mid + 1, hi);
    count += merge(lo, mid, hi);
    return count;
  }

  return mergeSort(0, n - 1);
}

// ── 최적화 구현 (최적화 코드 절) : 버퍼 배열 재사용, 인덱스로 직접 병합 ──
function countInversions(arr: number[]): number {
  const n = arr.length;
  if (n <= 1) return 0;
  const a = arr.slice();
  const buffer = new Array<number>(n);

  function merge(lo: number, mid: number, hi: number): number {
    let i = lo;
    let j = mid + 1;
    let k = lo;
    let count = 0;
    while (i <= mid && j <= hi) {
      if (a[i]! <= a[j]!) {
        buffer[k++] = a[i++]!;
      } else {
        count += mid - i + 1; // L에서 아직 안 옮긴 개수
        buffer[k++] = a[j++]!;
      }
    }
    while (i <= mid) buffer[k++] = a[i++]!;
    while (j <= hi) buffer[k++] = a[j++]!;
    for (let x = lo; x <= hi; x++) a[x] = buffer[x]!;
    return count;
  }

  function mergeSort(lo: number, hi: number): number {
    if (lo >= hi) return 0;
    const mid = (lo + hi) >> 1;
    let count = mergeSort(lo, mid);
    count += mergeSort(mid + 1, hi);
    count += merge(lo, mid, hi);
    return count;
  }

  return mergeSort(0, n - 1);
}

// ── 검증 ──────────────────────────────────────────
const cases: [number[], number][] = [
  [[1, 2, 3], 0],
  [[3, 2, 1], 3],
  [[2, 4, 1, 3, 5], 3],
  [[], 0],
  [[42], 0],
  [[2, 2, 2], 0],
  [[-1, -3, 0, -2], 3],
  [[3, 1, 2], 2],
];

let allPass = true;
for (const [arr, expected] of cases) {
  const rNaive = countInversionsNaive(arr);
  const rBasic = countInversionsBasic(arr);
  const rOpt = countInversions(arr);
  const ok = rNaive === expected && rBasic === expected && rOpt === expected;
  if (!ok) allPass = false;
  console.log(
    `arr=${JSON.stringify(arr)} expected=${expected} naive=${rNaive} basic=${rBasic} opt=${rOpt} ${ok ? "OK" : "FAIL"}`
  );
}

// 내림차순 n=5 → n(n-1)/2 = 10
const desc5 = [5, 4, 3, 2, 1];
console.log(
  `desc5=${JSON.stringify(desc5)} expected=10 naive=${countInversionsNaive(desc5)} basic=${countInversionsBasic(desc5)} opt=${countInversions(desc5)}`
);

// 버그 버전 시연: [2,2] → 정답 0, 버그판 1
const dup = [2, 2];
console.log(
  `dup=${JSON.stringify(dup)} correct(opt)=${countInversions(dup)} buggy=${countInversionsBuggy(dup)}`
);

// 무작위 교차검증: naive vs basic vs opt
let rngState = 12345;
function rand(): number {
  rngState = (rngState * 1103515245 + 12345) & 0x7fffffff;
  return rngState;
}
for (let t = 0; t < 200; t++) {
  const len = rand() % 20;
  const arr: number[] = [];
  for (let i = 0; i < len; i++) arr.push((rand() % 21) - 10);
  const rN = countInversionsNaive(arr);
  const rB = countInversionsBasic(arr);
  const rO = countInversions(arr);
  if (rN !== rB || rN !== rO) {
    allPass = false;
    console.log(`RANDOM MISMATCH arr=${JSON.stringify(arr)} naive=${rN} basic=${rB} opt=${rO}`);
  }
}

console.log(allPass ? "ALL PASS" : "SOME FAILED");

// 시뮬레이션 프레임 실측: arr=[3,1,2]에서 왼쪽 [3,1] 병합 단계 등 세부 확인
console.log("--- sim trace check for [3,1,2] ---");
{
  const a = [3, 1, 2];
  // 왼쪽 부분 [3,1] 병합: L=[3], R=[1]
  const L = [3];
  const R = [1];
  console.log(`L=${JSON.stringify(L)} R=${JSON.stringify(R)} : L[0]=3 > R[0]=1 → count += |L|-0 = ${L.length - 0}`);
  // 최종 병합 L=[1,3], R=[2]
  const L2 = [1, 3];
  const R2 = [2];
  console.log(`L2=${JSON.stringify(L2)} R2=${JSON.stringify(R2)} : L2[0]=1<=2 push L, i=1; L2[1]=3>2 → count += |L2|-1=${L2.length - 1}`);
}

console.log("--- extra check for self-check questions ---");
console.log("countInversions([4,1,3,2]) =", countInversions([4, 1, 3, 2]));
console.log("countInversionsNaive([4,1,3,2]) =", countInversionsNaive([4, 1, 3, 2]));
console.log("correct([2,2,2,2]) =", countInversions([2, 2, 2, 2]));
console.log("buggy([2,2,2,2]) =", countInversionsBuggy([2, 2, 2, 2]));
