// E3 자기검증용 스크래치. 가이드 본문에 실리는 코드를 그대로 옮겨 실행 검증한다.

// ---------- 1. naive: 선택 정렬 (O(N^2)) ----------
function selectionSortNaive(nums: number[]): number[] {
  const n = nums.length;
  for (let i = 0; i < n; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      if (nums[j]! < nums[minIdx]!) minIdx = j;
    }
    const tmp = nums[i]!;
    nums[i] = nums[minIdx]!;
    nums[minIdx] = tmp;
  }
  return nums;
}

// ---------- 2. 기본 구현: 마지막 원소를 피벗으로 (Lomuto) ----------
function swap(a: number[], i: number, j: number): void {
  const tmp = a[i]!;
  a[i] = a[j]!;
  a[j] = tmp;
}

let partitionCallsBasic = 0;
let maxDepthBasic = 0;

function partitionLast(a: number[], left: number, right: number): number {
  partitionCallsBasic++;
  const pivot = a[right]!;
  let i = left;
  for (let j = left; j < right; j++) {
    if (a[j]! < pivot) {
      swap(a, i, j);
      i++;
    }
  }
  swap(a, i, right);
  return i;
}

function sortLast(a: number[], left: number, right: number, depth = 0): void {
  if (left >= right) return;
  maxDepthBasic = Math.max(maxDepthBasic, depth);
  const p = partitionLast(a, left, right);
  sortLast(a, left, p - 1, depth + 1);
  sortLast(a, p + 1, right, depth + 1);
}

function quickSortBasic(nums: number[]): number[] {
  partitionCallsBasic = 0;
  maxDepthBasic = 0;
  sortLast(nums, 0, nums.length - 1);
  return nums;
}

// ---------- 3. 최적화: 중간 원소를 피벗으로 (Lomuto) ----------
let partitionCallsMid = 0;
let maxDepthMid = 0;

function partitionMid(a: number[], left: number, right: number): number {
  partitionCallsMid++;
  const mid = left + Math.floor((right - left) / 2);
  swap(a, mid, right); // 피벗을 안전하게 끝으로 이동
  const pivot = a[right]!;
  let i = left;
  for (let j = left; j < right; j++) {
    if (a[j]! < pivot) {
      swap(a, i, j);
      i++;
    }
  }
  swap(a, i, right);
  return i;
}

function sortMid(a: number[], left: number, right: number, depth = 0): void {
  if (left >= right) return;
  maxDepthMid = Math.max(maxDepthMid, depth);
  const p = partitionMid(a, left, right);
  sortMid(a, left, p - 1, depth + 1);
  sortMid(a, p + 1, right, depth + 1);
}

function quickSort(nums: number[]): number[] {
  partitionCallsMid = 0;
  maxDepthMid = 0;
  sortMid(nums, 0, nums.length - 1);
  return nums;
}

// ---------- 검증 ----------
function isSorted(a: number[]): boolean {
  for (let i = 1; i < a.length; i++) if (a[i - 1]! > a[i]!) return false;
  return true;
}
function multisetEq(a: number[], b: number[]): boolean {
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.length === sb.length && sa.every((v, i) => v === sb[i]);
}

console.log("=== naive selection sort ===");
console.log(selectionSortNaive([5, 2, 3, 1])); // [1,2,3,5]
console.log(selectionSortNaive([5, 1, 1, 2, 0, 0])); // [0,0,1,1,2,5]

console.log("\n=== 기본 구현 (마지막 원소 피벗) : 정렬된 배열에서 재귀 깊이 ===");
{
  const n = 2000;
  const sortedInput = Array.from({ length: n }, (_, i) => i);
  quickSortBasic(sortedInput);
  console.log("N =", n, "partition 호출 수 =", partitionCallsBasic, "최대 재귀 깊이 =", maxDepthBasic);
  console.log("정렬 여부:", isSorted(sortedInput));
}

console.log("\n=== 최적화 구현 (중간 원소 피벗) : 같은 정렬된 배열에서 재귀 깊이 ===");
{
  const n = 2000;
  const sortedInput = Array.from({ length: n }, (_, i) => i);
  quickSort(sortedInput);
  console.log("N =", n, "partition 호출 수 =", partitionCallsMid, "최대 재귀 깊이 =", maxDepthMid);
  console.log("정렬 여부:", isSorted(sortedInput));
}

console.log("\n=== 대표 예시: [5, 2, 4, 1] (시뮬레이션 고정 입력) ===");
{
  const arr = [5, 2, 4, 1];
  const mid = 0 + Math.floor((3 - 0) / 2); // mid=1
  console.log("mid index =", mid, "mid 값 =", arr[mid]);
  const pIdx = partitionMid(arr, 0, 3);
  console.log("partition(0,3) 이후 배열:", arr, "반환 인덱스:", pIdx);
}
{
  const arr = [5, 2, 4, 1];
  const sorted = quickSort(arr);
  console.log("quickSort([5,2,4,1]) =>", sorted);
}

console.log("\n=== 엣지 케이스 ===");
console.log("[] =>", quickSort([]));
console.log("[5] =>", quickSort([5]));
console.log("[1,2,3,4,5] =>", quickSort([1, 2, 3, 4, 5]));
console.log("[5,4,3,2,1] =>", quickSort([5, 4, 3, 2, 1]));
console.log("[2,2,2,2,2] =>", quickSort([2, 2, 2, 2, 2]));
console.log("[-3,1,-1,0] =>", quickSort([-3, 1, -1, 0]));

console.log("\n=== 무작위 교차검증 (100회, N<=200, 값 범위 -500..500) ===");
{
  let ok = true;
  for (let t = 0; t < 100; t++) {
    const n = Math.floor(Math.random() * 200) + 1;
    const original = Array.from({ length: n }, () => Math.floor(Math.random() * 1001) - 500);
    const expected = [...original].sort((a, b) => a - b);
    const got = quickSort([...original]);
    if (!isSorted(got) || !multisetEq(got, original) || JSON.stringify(got) !== JSON.stringify(expected)) {
      ok = false;
      console.log("MISMATCH", original, got, expected);
    }
  }
  console.log("무작위 100회 전부 일치:", ok);
}

console.log("\n=== 전부 동일 값에서 기본(마지막 피벗) vs 최적화(중간 피벗) 파티션 호출 수 비교 ===");
{
  const n = 500;
  const allSame = Array.from({ length: n }, () => 7);
  quickSortBasic([...allSame]);
  const basicCalls = partitionCallsBasic;
  const basicDepth = maxDepthBasic;
  quickSort([...allSame]);
  const midCalls = partitionCallsMid;
  const midDepth = maxDepthMid;
  console.log(
    "N =", n,
    "기본(마지막 피벗) partition 호출 =", basicCalls, "깊이 =", basicDepth,
    "| 최적화(중간 피벗) partition 호출 =", midCalls, "깊이 =", midDepth,
  );
}
