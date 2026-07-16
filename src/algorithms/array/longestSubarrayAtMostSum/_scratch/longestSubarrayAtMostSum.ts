// 가이드 본문 코드 자기 검증용 스크래치 — E3

// --- 섹션 2: 출발점 naive 구현 (원형 + break 최적화) ---
function longestSubarrayAtMostSumNaive(nums: number[], S: number): number {
  const n = nums.length;
  let best = 0;
  for (let l = 0; l < n; l++) {
    let s = 0;
    for (let r = l; r < n; r++) {
      s += nums[r];
      if (s <= S) {
        best = Math.max(best, r - l + 1);
      } else {
        break; // 비음의 정수이므로 더 늘어도 합이 증가만 함
      }
    }
  }
  return best;
}

// --- 섹션 4: 아이디어를 코드로 옮기기 (최종 구현, 투 포인터) ---
function longestSubarrayAtMostSum(nums: number[], S: number): number {
  let l = 0;
  let windowSum = 0;
  let best = 0;

  for (let r = 0; r < nums.length; r++) {
    windowSum += nums[r];

    while (windowSum > S) {
      windowSum -= nums[l];
      l++;
    }

    best = Math.max(best, r - l + 1);
  }

  return best;
}

// ---- 검증 ----
function assertEq(actual: number, expected: number, label: string) {
  const ok = actual === expected;
  console.log(`${ok ? "OK  " : "FAIL"} ${label}: actual=${actual} expected=${expected}`);
  if (!ok) process.exitCode = 1;
}

console.log("== 대표 예시 (시뮬레이션용) ==");
assertEq(longestSubarrayAtMostSum([1, 2, 3, 4], 6), 3, "sim nums=[1,2,3,4] S=6");
assertEq(longestSubarrayAtMostSumNaive([1, 2, 3, 4], 6), 3, "naive sim nums=[1,2,3,4] S=6");

console.log("== 출발점 절 naive 코드 수치 (N^2 근거) ==");
{
  const n = 5;
  let ops = 0;
  for (let l = 0; l < n; l++) {
    for (let r = l; r < n; r++) ops++;
  }
  console.log(`N=5 전체 쌍 개수(축약 전) = ${ops} (참고용, N(N+1)/2)`);
}

console.log("== problem.md 예시 ==");
assertEq(longestSubarrayAtMostSum([1, 2, 1, 0, 1, 1, 0], 4), 5, "ex1");
assertEq(longestSubarrayAtMostSum([1, 1, 1, 1, 1], 3), 3, "ex2");
assertEq(longestSubarrayAtMostSum([1, 2, 3], 10), 3, "ex3");
assertEq(longestSubarrayAtMostSum([5, 6, 7], 4), 0, "ex4");
assertEq(longestSubarrayAtMostSum([1, 2, 3], 0), 0, "ex5");
assertEq(longestSubarrayAtMostSum([0, 0, 0, 0], 0), 4, "ex6");
assertEq(longestSubarrayAtMostSum([5], 10), 1, "ex7");
assertEq(longestSubarrayAtMostSum([5], 1), 0, "ex8");

console.log("== 가이드 본문 엣지 케이스 (canvas 표) ==");
assertEq(longestSubarrayAtMostSum([1, 2, 3], 0), 0, "S=0, nums=[1,2,3]");
assertEq(longestSubarrayAtMostSum([0, 0, 0], 0), 3, "S=0, nums=[0,0,0]");
assertEq(longestSubarrayAtMostSum([1, 2, 3], 100), 3, "S=100, nums=[1,2,3]");
assertEq(longestSubarrayAtMostSum([4, 1, 2], 3), 2, "S=3, nums=[4,1,2]");

console.log("== 시뮬레이션 프레임별 windowSum/best 재현 (nums=[1,2,3,4], S=6) ==");
{
  const nums = [1, 2, 3, 4];
  const S = 6;
  let l = 0;
  let windowSum = 0;
  let best = 0;
  const frames: { r: number; windowSumAfterAdd: number; lAfter: number; windowSumFinal: number; best: number }[] = [];
  for (let r = 0; r < nums.length; r++) {
    windowSum += nums[r];
    const afterAdd = windowSum;
    while (windowSum > S) {
      windowSum -= nums[l];
      l++;
    }
    best = Math.max(best, r - l + 1);
    frames.push({ r, windowSumAfterAdd: afterAdd, lAfter: l, windowSumFinal: windowSum, best });
  }
  console.log(JSON.stringify(frames, null, 2));
}

console.log("== 무작위 교차검증 (naive vs 최적화) ==");
{
  let mismatches = 0;
  for (let t = 0; t < 500; t++) {
    const n = 1 + Math.floor(Math.random() * 12);
    const nums = Array.from({ length: n }, () => Math.floor(Math.random() * 8));
    const S = Math.floor(Math.random() * 20);
    const a = longestSubarrayAtMostSum(nums, S);
    const b = longestSubarrayAtMostSumNaive(nums, S);
    if (a !== b) {
      mismatches++;
      console.log(`MISMATCH nums=${JSON.stringify(nums)} S=${S} opt=${a} naive=${b}`);
    }
  }
  console.log(mismatches === 0 ? "OK  무작위 500케이스 전부 일치" : `FAIL 불일치 ${mismatches}건`);
  if (mismatches !== 0) process.exitCode = 1;
}

console.log("== 함정 시나리오: best를 while 축소 전에 기록하면 벌어지는 일 (본문 D6 트랩) ==");
{
  function buggyRecordBeforeShrink(nums: number[], S: number): number {
    let l = 0;
    let windowSum = 0;
    let best = 0;
    for (let r = 0; r < nums.length; r++) {
      windowSum += nums[r];
      best = Math.max(best, r - l + 1); // 함정: 축소 전에 기록
      while (windowSum > S) {
        windowSum -= nums[l];
        l++;
      }
    }
    return best;
  }
  const nums = [1, 1, 1, 1, 1];
  const S = 3;
  const correct = longestSubarrayAtMostSum(nums, S);
  const buggy = buggyRecordBeforeShrink(nums, S);
  assertEq(correct, 3, "정답(축소 먼저)");
  assertEq(buggy, 4, "오답(기록 먼저)");
  console.log(`nums=${JSON.stringify(nums)} S=${S} → 정답=${correct}, 오답(기록 순서 뒤바뀜)=${buggy}`);
}

console.log("== 헷갈리기 쉬운 포인트: 비음수 조건이 깨지면 (제약 밖 가상 예시) ==");
{
  function bruteForceAllowNegative(nums: number[], S: number): number {
    let best = 0;
    for (let l = 0; l < nums.length; l++) {
      let s = 0;
      for (let r = l; r < nums.length; r++) {
        s += nums[r];
        if (s <= S) best = Math.max(best, r - l + 1);
      }
    }
    return best;
  }
  const nums = [5, -10, 100];
  const S = 3;
  const twoPointerResult = longestSubarrayAtMostSum(nums, S);
  const trueAnswer = bruteForceAllowNegative(nums, S);
  assertEq(twoPointerResult, 1, "음수 포함 시 두 포인터 결과(잘못됨)");
  assertEq(trueAnswer, 2, "전수조사로 구한 실제 정답");
  console.log(`nums=${JSON.stringify(nums)} S=${S} → 두 포인터=${twoPointerResult}, 실제 정답=${trueAnswer}`);
}

console.log("== 스스로 점검하기 Q1 트레이스 ==");
{
  const nums = [2, 1, 5, 1, 1];
  const S = 8;
  let l = 0;
  let windowSum = 0;
  let best = 0;
  for (let r = 0; r < nums.length; r++) {
    windowSum += nums[r];
    while (windowSum > S) {
      windowSum -= nums[l];
      l++;
    }
    best = Math.max(best, r - l + 1);
    console.log(`r=${r} windowSum=${windowSum} l=${l} best=${best}`);
  }
  assertEq(best, 4, "Q1 최종 답");
}
