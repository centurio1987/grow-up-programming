// E3 자기검증용 스크래치 — 가이드 본문에 싣는 코드를 그대로 추출해 실행값을 실측한다.

// --- naive (O(N^2)) ---
function nextGreaterElementNaive(nums: number[]): number[] {
  const n = nums.length;
  const result = new Array<number>(n).fill(-1);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (nums[j]! > nums[i]!) {
        result[i] = nums[j]!;
        break;
      }
    }
  }
  return result;
}

// --- 최종 구현: 단조 감소 스택 (O(N)) ---
function nextGreaterElement(nums: number[]): number[] {
  const n = nums.length;
  const result = new Array<number>(n).fill(-1);
  const stack: number[] = []; // 인덱스 저장, nums[stack[k]]가 아래→위 단조 감소

  for (let i = 0; i < n; i++) {
    while (stack.length > 0 && nums[stack[stack.length - 1]!]! < nums[i]!) {
      const j = stack.pop()!;
      result[j] = nums[i]!;
    }
    stack.push(i);
  }
  return result;
}

// --- 함정 버전: pop 조건을 <= 로 바꾼 오답 (D6 검증용) ---
function nextGreaterElementBuggy(nums: number[]): number[] {
  const n = nums.length;
  const result = new Array<number>(n).fill(-1);
  const stack: number[] = [];
  for (let i = 0; i < n; i++) {
    while (stack.length > 0 && nums[stack[stack.length - 1]!]! <= nums[i]!) {
      const j = stack.pop()!;
      result[j] = nums[i]!;
    }
    stack.push(i);
  }
  return result;
}

function fmt(a: number[]): string {
  return "[" + a.join(", ") + "]";
}

console.log("=== 대표 예시 ===");
console.log("nums=[2,1,2,4,3] =>", fmt(nextGreaterElement([2, 1, 2, 4, 3])));

console.log("=== 엣지 케이스 ===");
console.log("[5] =>", fmt(nextGreaterElement([5])));
console.log("[] =>", fmt(nextGreaterElement([])));
console.log("[3,2,1] =>", fmt(nextGreaterElement([3, 2, 1])));
console.log("[1,2,3] =>", fmt(nextGreaterElement([1, 2, 3])));
console.log("[5,5,5] =>", fmt(nextGreaterElement([5, 5, 5])));
console.log("[1,2] =>", fmt(nextGreaterElement([1, 2])));
console.log("[2,7,3,5,1,6] =>", fmt(nextGreaterElement([2, 7, 3, 5, 1, 6])));

console.log("=== 단계별 트레이스 (nums=[2,1,2,4,3]) ===");
{
  const nums = [2, 1, 2, 4, 3];
  const n = nums.length;
  const result = new Array<number>(n).fill(-1);
  const stack: number[] = [];
  for (let i = 0; i < n; i++) {
    const poppedLog: string[] = [];
    while (stack.length > 0 && nums[stack[stack.length - 1]!]! < nums[i]!) {
      const j = stack.pop()!;
      result[j] = nums[i]!;
      poppedLog.push(`pop ${j} -> result[${j}]=${nums[i]}`);
    }
    stack.push(i);
    console.log(
      `i=${i} nums[i]=${nums[i]} | ${poppedLog.join("; ") || "(pop 없음)"} | stack=${fmt(stack)} | result=${fmt(result)}`,
    );
  }
}

console.log("=== D6 함정: <= 로 바꾼 버그 버전, [5,5,5] ===");
console.log("buggy([5,5,5]) =>", fmt(nextGreaterElementBuggy([5, 5, 5])));
console.log("correct([5,5,5]) =>", fmt(nextGreaterElement([5, 5, 5])));

console.log("=== naive vs 최종 구현 랜덤 교차검증 ===");
{
  let ok = true;
  for (let t = 0; t < 2000; t++) {
    const len = Math.floor(Math.random() * 12);
    const arr = Array.from({ length: len }, () => Math.floor(Math.random() * 10) - 5);
    const a = nextGreaterElementNaive(arr);
    const b = nextGreaterElement(arr);
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      ok = false;
      console.log("MISMATCH", fmt(arr), fmt(a), fmt(b));
    }
  }
  console.log(ok ? "2000회 랜덤 교차검증 전부 일치" : "불일치 발견!");
}
