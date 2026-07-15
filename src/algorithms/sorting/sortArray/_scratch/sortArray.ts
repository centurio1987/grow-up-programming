// E3 자기검증: sortArray-guide.mdx 본문 merge sort 코드 추출본.
// naive (선택 정렬) — 원형
function sortArrayNaive(A: number[]): number[] {
  const B = A.slice();
  for (let i = 0; i < B.length; i++) {
    let min = i;
    for (let j = i + 1; j < B.length; j++) if (B[j]! < B[min]!) min = j;
    [B[i], B[min]] = [B[min]!, B[i]!];
  }
  return B;
}
// merge sort — 기본 구현 (새 배열 반환, 안정)
function merge(left: number[], right: number[]): number[] {
  const out: number[] = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    if (left[i]! <= right[j]!) out.push(left[i++]!); // <= 로 안정성 보장
    else out.push(right[j++]!);
  }
  while (i < left.length) out.push(left[i++]!);
  while (j < right.length) out.push(right[j++]!);
  return out;
}
function sortArrayBasic(A: number[]): number[] {
  if (A.length <= 1) return A.slice();
  const mid = A.length >> 1;
  return merge(sortArrayBasic(A.slice(0, mid)), sortArrayBasic(A.slice(mid)));
}
// 최적화: 작은 구간은 삽입정렬 컷오프 (bottom-up 대체)
function insertionRange(B: number[], lo: number, hi: number): void {
  for (let i = lo + 1; i <= hi; i++) {
    const key = B[i]!; let j = i - 1;
    while (j >= lo && B[j]! > key) { B[j + 1] = B[j]!; j--; }
    B[j + 1] = key;
  }
}
const CUTOFF = 16;
function msRange(A: number[], B: number[], lo: number, hi: number): void {
  if (hi - lo + 1 <= CUTOFF) { insertionRange(A, lo, hi); return; }
  const mid = lo + ((hi - lo) >> 1);
  msRange(A, B, lo, mid); msRange(A, B, mid + 1, hi);
  let i = lo, j = mid + 1, k = lo;
  while (i <= mid && j <= hi) B[k++] = A[i]! <= A[j]! ? A[i++]! : A[j++]!;
  while (i <= mid) B[k++] = A[i++]!;
  while (j <= hi) B[k++] = A[j++]!;
  for (let t = lo; t <= hi; t++) A[t] = B[t]!;
}
function sortArrayOpt(A: number[]): number[] {
  const R = A.slice(); msRange(R, new Array(A.length), 0, A.length - 1); return R;
}

// 시뮬 입력 검증
console.log("sim [3,1,3,2] →", JSON.stringify(sortArrayBasic([3,1,3,2])), "(기대 [1,2,3,3])");
// problem 예시 + 엣지
const cases = [[5,2,8,1],[1],[3,3,3],[-5,10,-9,0,10],[2,1]];
for (const c of cases) console.log(JSON.stringify(c),"→",JSON.stringify(sortArrayBasic(c)));
// D6: < 로 바꾸면 안정성 깨짐(동일 키 객체 순서) — 원시수는 값 동일해 티 안 나므로, 원본 불변 위반 함정 검증
const orig = [3,1,2]; const res = sortArrayBasic(orig);
console.log("원본 불변?", JSON.stringify(orig)==="[3,1,2]", "결과 새배열?", res!==orig);
// 무작위 200회 3-way 교차검증
let ok = 0;
for (let t = 0; t < 200; t++) {
  const n = 1 + Math.floor(Math.random()*60);
  const a = Array.from({length:n},()=>Math.floor(Math.random()*40)-20);
  const exp = a.slice().sort((x,y)=>x-y);
  const s1 = JSON.stringify(sortArrayNaive(a));
  const s2 = JSON.stringify(sortArrayBasic(a));
  const s3 = JSON.stringify(sortArrayOpt(a));
  const e = JSON.stringify(exp);
  if (s1===e && s2===e && s3===e) ok++;
}
console.log(`무작위 교차검증 200회: ${ok}/200 일치 (naive==basic==opt==Array.sort)`);
