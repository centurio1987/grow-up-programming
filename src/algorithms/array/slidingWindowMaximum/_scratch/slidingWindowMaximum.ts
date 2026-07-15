// ── 가이드 본문 코드를 그대로 추출해 실측 검증하는 스크래치 파일 ──
// bun src/algorithms/array/slidingWindowMaximum/_scratch/slidingWindowMaximum.ts

// 1) 출발점: naive O(Nk)
function slidingWindowMaximumNaive(nums: number[], k: number): number[] {
  const result: number[] = [];
  for (let i = 0; i <= nums.length - k; i++) {
    let maxVal = nums[i]!;
    for (let j = i + 1; j < i + k; j++) {
      if (nums[j]! > maxVal) maxVal = nums[j]!;
    }
    result.push(maxVal);
  }
  return result;
}

// 2) 아이디어를 코드로 옮기기: shift() 기반 덱
function slidingWindowMaximumShiftDeque(nums: number[], k: number): number[] {
  const result: number[] = [];
  const deque: number[] = []; // 인덱스 저장, 앞→뒤 값 단조 비증가

  for (let i = 0; i < nums.length; i++) {
    while (deque.length > 0 && deque[0]! < i - k + 1) {
      deque.shift(); // 앞에서 제거 — 내부적으로 남은 원소 전부를 한 칸씩 당김
    }
    while (deque.length > 0 && nums[deque[deque.length - 1]!]! <= nums[i]!) {
      deque.pop();
    }
    deque.push(i);
    if (i >= k - 1) {
      result.push(nums[deque[0]!]!);
    }
  }
  return result;
}

// 3) 최적화 코드: 원형 버퍼(circular buffer) 기반 덱 — 공간 O(k) 유지
function slidingWindowMaximum(nums: number[], k: number): number[] {
  const n = nums.length;
  const result: number[] = [];
  const buf = new Array<number>(k); // 덱은 어느 시점에도 최대 k개만 담으므로 크기 k로 충분
  let head = 0; // 논리적 포인터(계속 증가) — 실제 접근은 buf[포인터 % k]
  let tail = 0;

  for (let i = 0; i < n; i++) {
    while (tail > head && buf[head % k]! < i - k + 1) {
      head++; // popFront: 포인터만 전진, 원소 이동 없음
    }
    while (tail > head && nums[buf[(tail - 1) % k]!]! <= nums[i]!) {
      tail--; // popBack: 포인터만 후진
    }
    buf[tail % k] = i; // pushBack
    tail++;
    if (i >= k - 1) {
      result.push(nums[buf[head % k]!]!);
    }
  }
  return result;
}

// ── 검증 ──
function assertEqual(actual: number[], expected: number[], label: string) {
  const ok = actual.length === expected.length && actual.every((v, idx) => v === expected[idx]);
  console.log(`${ok ? "PASS" : "FAIL"} ${label} → actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`);
  if (!ok) process.exitCode = 1;
}

const sample = [1, 3, -1, -3, 5, 3, 6, 7];
const k = 3;

console.log("=== 대표 예시 nums=[1,3,-1,-3,5,3,6,7], k=3 ===");
assertEqual(slidingWindowMaximumNaive(sample, k), [3, 3, 5, 5, 6, 7], "naive");
assertEqual(slidingWindowMaximumShiftDeque(sample, k), [3, 3, 5, 5, 6, 7], "shiftDeque");
assertEqual(slidingWindowMaximum(sample, k), [3, 3, 5, 5, 6, 7], "pointerDeque(final)");

console.log("\n=== 엣지케이스 ===");
assertEqual(slidingWindowMaximum([3, 1, 5, 2], 1), [3, 1, 5, 2], "k=1");
assertEqual(slidingWindowMaximum([3, 1, 5, 2], 4), [5], "k=N");
assertEqual(slidingWindowMaximum([1, 1, 1, 1], 2), [1, 1, 1], "모두 동일값");
assertEqual(slidingWindowMaximum([5, 4, 3, 2, 1], 3), [5, 4, 3], "단조 감소");
assertEqual(slidingWindowMaximum([1, 2, 3, 4, 5], 3), [3, 4, 5], "단조 증가");
assertEqual(slidingWindowMaximum([7], 1), [7], "단일 원소");

console.log("\n=== 대표 예시 스텝별 트레이스 (3.1절 표용) ===");
{
  const nums = sample;
  const buf: number[] = [];
  for (let i = 0; i < nums.length; i++) {
    while (buf.length > 0 && buf[0]! < i - k + 1) buf.shift();
    while (buf.length > 0 && nums[buf[buf.length - 1]!]! <= nums[i]!) buf.pop();
    buf.push(i);
    const windowMax = i >= k - 1 ? nums[buf[0]!] : undefined;
    console.log(
      `i=${i} nums[i]=${nums[i]} deque(idx)=${JSON.stringify(buf)} deque(val)=${JSON.stringify(buf.map((x) => nums[x]))} windowMax=${windowMax ?? "-"}`,
    );
  }
}

console.log("\n=== 무작위 교차검증 (naive vs final, 200회) ===");
{
  let allOk = true;
  for (let t = 0; t < 200; t++) {
    const n = 1 + Math.floor(Math.random() * 30);
    const nums = Array.from({ length: n }, () => Math.floor(Math.random() * 21) - 10);
    const kk = 1 + Math.floor(Math.random() * n);
    const a = slidingWindowMaximumNaive(nums, kk);
    const b = slidingWindowMaximum(nums, kk);
    const c = slidingWindowMaximumShiftDeque(nums, kk);
    const okAB = a.length === b.length && a.every((v, i) => v === b[i]);
    const okAC = a.length === c.length && a.every((v, i) => v === c[i]);
    if (!okAB || !okAC) {
      allOk = false;
      console.log(`FAIL random n=${n} k=${kk} nums=${JSON.stringify(nums)}`);
      console.log(`  naive=${JSON.stringify(a)} final=${JSON.stringify(b)} shift=${JSON.stringify(c)}`);
    }
  }
  console.log(allOk ? "PASS random cross-check x200" : "FAIL random cross-check (see above)");
}

console.log("\n=== 성능 비교: shift() 기반 vs 포인터 기반 (단조 감소 입력, 후단 청소가 거의 없어 덱이 계속 큼) ===");
{
  const n = 200_000;
  const kBig = 100_000;
  const decreasing = Array.from({ length: n }, (_, i) => n - i); // 완전 단조 감소

  const t0 = performance.now();
  const r1 = slidingWindowMaximumShiftDeque(decreasing, kBig);
  const t1 = performance.now();
  const r2 = slidingWindowMaximum(decreasing, kBig);
  const t2 = performance.now();

  const same = r1.length === r2.length && r1.every((v, i) => v === r2[i]);
  console.log(`n=${n}, k=${kBig}`);
  console.log(`  shift() 기반   : ${(t1 - t0).toFixed(2)}ms`);
  console.log(`  포인터 기반    : ${(t2 - t1).toFixed(2)}ms`);
  console.log(`  결과 일치: ${same}`);
  console.log(`  배율: ${((t1 - t0) / (t2 - t1)).toFixed(1)}배`);
}
