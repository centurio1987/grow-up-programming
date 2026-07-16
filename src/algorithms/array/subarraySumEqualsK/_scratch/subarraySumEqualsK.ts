// === 본문 최종 구현 (아이디어를 코드로 옮기기) ===
function subarraySumEqualsK(nums: number[], k: number): number {
  const map = new Map<number, number>();
  map.set(0, 1); // P[0] = 0을 미리 기록해 둔다

  let prefix = 0;
  let count = 0;

  for (const x of nums) {
    prefix += x;
    count += map.get(prefix - k) ?? 0;              // 조회
    map.set(prefix, (map.get(prefix) ?? 0) + 1);     // 기록
  }

  return count;
}

// === 본문 naive (출발점) ===
function subarraySumEqualsKNaive(nums: number[], k: number): number {
  let count = 0;
  for (let i = 0; i < nums.length; i++) {
    let s = 0;
    for (let j = i; j < nums.length; j++) {
      s += nums[j]!;
      if (s === k) count++;
    }
  }
  return count;
}

// === pitfall: 순서 바꿈(기록 먼저) ===
function orderSwapped(nums: number[], k: number): number {
  const map = new Map<number, number>();
  map.set(0, 1);
  let prefix = 0;
  let count = 0;
  for (const x of nums) {
    prefix += x;
    map.set(prefix, (map.get(prefix) ?? 0) + 1);
    count += map.get(prefix - k) ?? 0;
  }
  return count;
}

// === pitfall: map[0]=1 초기화 누락 ===
function noInit(nums: number[], k: number): number {
  const map = new Map<number, number>();
  let prefix = 0;
  let count = 0;
  for (const x of nums) {
    prefix += x;
    count += map.get(prefix - k) ?? 0;
    map.set(prefix, (map.get(prefix) ?? 0) + 1);
  }
  return count;
}

console.log("=== 대표 케이스 ===");
const cases: [number[], number, number][] = [
  [[1, 2, 3], 3, 2],
  [[1], 0, 0],
  [[0, 0, 0], 0, 6],
  [[-1, 1], 0, 1],
  [[1, -1, 1], 1, 3],
  [[5], 5, 1],
  [[3, 4, 7, 2, -3, 1, 4, 2], 7, 4],
];
for (const [nums, k, expected] of cases) {
  const got = subarraySumEqualsK(nums, k);
  const gotNaive = subarraySumEqualsKNaive(nums, k);
  console.log(got === expected && gotNaive === expected ? "OK" : "MISMATCH", JSON.stringify(nums), "k=", k, "expected=", expected, "got=", got, "naive=", gotNaive);
}

console.log("\n=== 출발점 naive 손 검산: nums=[1,2,3], k=3 ===");
{
  const nums = [1, 2, 3], k = 3;
  for (let i = 0; i < nums.length; i++) {
    let s = 0;
    const parts: string[] = [];
    for (let j = i; j < nums.length; j++) {
      s += nums[j]!;
      parts.push(`j=${j} → ${s}${s === k ? " ✓" : ""}`);
    }
    console.log(`i=${i}:`, parts.join("  "));
  }
}

console.log("\n=== 슬라이딩 윈도우 반례 trace: nums=[1,-1,1], k=1 ===");
{
  const nums = [1, -1, 1];
  let sum = 0;
  for (let r = 0; r < nums.length; r++) {
    sum += nums[r]!;
    console.log(`r=${r}: sum = ${sum}`);
  }
}

console.log("\n=== 3.1 절 prefix 예시: nums=[1,2,3] ===");
{
  const nums = [1, 2, 3];
  const P = [0];
  for (const x of nums) P.push(P[P.length - 1]! + x);
  console.log("P =", P);
  console.log("구간[0,1] 합 =", nums[0]! + nums[1]!, " P[2]-P[0] =", P[2]! - P[0]!);
  console.log("구간[1,2] 합 =", nums[1]! + nums[2]!, " P[3]-P[1] =", P[3]! - P[1]!);
}

console.log("\n=== 확인 질문: P[2]-P[0]는 구간 [0,1] 합인가 ===");
{
  const nums = [1, 2, 3];
  const P = [0, 1, 3, 6];
  console.log("P[2]-P[0] =", P[2] - P[0], " nums[0]+nums[1] =", nums[0]! + nums[1]!);
}

console.log("\n=== 헷갈리기 쉬운 포인트 1: 순서 스왑, nums=[0,0,0], k=0 ===");
console.log("orderSwapped =", orderSwapped([0, 0, 0], 0), "(정답 6)");

console.log("\n=== 헷갈리기 쉬운 포인트 2: map[0]=1 누락, nums=[1,2,3], k=3 ===");
console.log("noInit =", noInit([1, 2, 3], 3), "(정답 2)");

console.log("\n=== 자기점검 1: nums=[3,4,7,2,-3,1,4,2], k=7 ===");
{
  const nums = [3, 4, 7, 2, -3, 1, 4, 2];
  const P = [0];
  for (const x of nums) P.push(P[P.length - 1]! + x);
  console.log("P =", P);
  const found: string[] = [];
  for (let i = 0; i <= nums.length; i++) {
    for (let j = i + 1; j <= nums.length; j++) {
      if (P[j]! - P[i]! === 7) found.push(`[${i},${j - 1}]`);
    }
  }
  console.log("구간:", found.join(", "), " 개수:", found.length);
}

console.log("\n=== 자기점검 2: 순서 스왑, nums=[0,0,0], k=0, 스텝별 count ===");
{
  const nums = [0, 0, 0], k = 0;
  const map = new Map<number, number>();
  map.set(0, 1);
  let prefix = 0, count = 0;
  for (let idx = 0; idx < nums.length; idx++) {
    const x = nums[idx]!;
    prefix += x;
    map.set(prefix, (map.get(prefix) ?? 0) + 1);
    const inc = map.get(prefix - k) ?? 0;
    count += inc;
    console.log(`idx=${idx} prefix=${prefix} 기록후map=${JSON.stringify([...map.entries()])} 조회증가=${inc} count=${count}`);
  }
}
