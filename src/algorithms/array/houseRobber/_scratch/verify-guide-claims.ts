/**
 * houseRobber 가이드가 본문에 싣는 수치의 근거.
 *
 * 가이드는 경쟁 설계 둘(값 큰 순 그리디 · 홀짝 인덱스 분할)의 반례와 실패율,
 * 트레이스 단계별 값, 슬라이딩 순서를 뒤집었을 때의 실제 반환값을 싣는다.
 * 그 값은 전부 여기서 나온다 — 지어낸 값이 하나도 없어야 한다는 것이
 * 요구(원칙 E3)이고, 이 파일이 그것을 재현 가능하게 만든다.
 *
 *   bun src/algorithms/array/houseRobber/_scratch/verify-guide-claims.ts
 */

function at<T>(xs: readonly T[], i: number): T {
  const v = xs[i];
  if (v === undefined)
    throw new RangeError(`index ${i} out of range (len ${xs.length})`);
  return v;
}

/** 결정적 난수 — 가이드의 표를 언제 다시 돌려도 같은 값이 나와야 한다. */
function makeRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── 설계 넷 ───────────────────────────────────────────────────────────────

/** 정본 — 점화식 DP. 나머지 셋을 이것과 대조한다. */
function dp(nums: readonly number[]): number {
  const n = nums.length;
  if (n === 0) return 0;
  if (n === 1) return at(nums, 0);
  let prev2 = at(nums, 0);
  let prev1 = Math.max(at(nums, 0), at(nums, 1));
  for (let i = 2; i < n; i++) {
    const curr = Math.max(prev1, prev2 + at(nums, i));
    prev2 = prev1;
    prev1 = curr;
  }
  return prev1;
}

/** 완전탐색 — 작은 n 전용. DP 가 옳은지 확인하는 기준선이다. */
function bruteForce(nums: readonly number[]): number {
  const n = nums.length;
  let best = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    let ok = true;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      if ((mask & (1 << i)) === 0) continue;
      if (i > 0 && mask & (1 << (i - 1))) {
        ok = false;
        break;
      }
      sum += at(nums, i);
    }
    if (ok) best = Math.max(best, sum);
  }
  return best;
}

/** 경쟁 설계 A — 값이 큰 집부터 담되, 이미 담은 집과 인접하면 건너뛴다. */
function greedyByValue(nums: readonly number[]): number {
  const order = nums.map((_, i) => i).sort((a, b) => at(nums, b) - at(nums, a));
  const taken = new Set<number>();
  let sum = 0;
  for (const i of order) {
    if (taken.has(i - 1) || taken.has(i + 1)) continue;
    taken.add(i);
    sum += at(nums, i);
  }
  return sum;
}

/** 경쟁 설계 B — 짝수 인덱스만 전부 담은 합과 홀수 인덱스만 전부 담은 합 중 큰 쪽. */
function evenOddSplit(nums: readonly number[]): number {
  let even = 0;
  let odd = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i % 2 === 0) even += at(nums, i);
    else odd += at(nums, i);
  }
  return Math.max(even, odd);
}

// ── 1. 경쟁 설계의 반례 ───────────────────────────────────────────────────

console.log("=== 경쟁 설계 반례 (가장 짧은 것부터 탐색) ===\n");
{
  const found = new Map<string, number[]>();
  outer: for (let n = 1; n <= 6; n++) {
    for (let code = 0; code < 6 ** n; code++) {
      const nums: number[] = [];
      let c = code;
      for (let k = 0; k < n; k++) {
        nums.push(c % 6);
        c = Math.floor(c / 6);
      }
      const best = dp(nums);
      if (!found.has("greedy") && greedyByValue(nums) < best)
        found.set("greedy", [...nums]);
      if (!found.has("evenOdd") && evenOddSplit(nums) < best)
        found.set("evenOdd", [...nums]);
      if (found.size === 2) break outer;
    }
  }
  for (const [key, nums] of found) {
    const label = key === "greedy" ? "값 큰 순 그리디" : "홀짝 인덱스 분할";
    const got = key === "greedy" ? greedyByValue(nums) : evenOddSplit(nums);
    console.log(
      `  ${label.padEnd(18)} nums = [${nums.join(", ")}]   그 설계 ${got}   정답(DP) ${dp(nums)}`,
    );
  }
}

console.log("\n=== 가이드가 싣는 반례 두 개를 직접 확인 ===\n");
for (const nums of [
  [3, 4, 3],
  [2, 1, 1, 2],
] as const) {
  console.log(
    `  nums = [${nums.join(", ")}]   그리디 ${greedyByValue(nums)}   홀짝 ${evenOddSplit(nums)}   DP ${dp(nums)}   완전탐색 ${bruteForce(nums)}`,
  );
}

// ── 2. 실패율 — 반례가 얼마나 흔한가 ─────────────────────────────────────

console.log("\n=== 무작위 입력 100,000건에서 정답을 못 낸 비율 ===\n");
{
  const TRIALS = 100_000;
  let greedyBad = 0;
  let evenOddBad = 0;
  let greedyLoss = 0;
  let evenOddLoss = 0;
  let dpBad = 0;
  for (let seed = 1; seed <= TRIALS; seed++) {
    const rnd = makeRandom(seed);
    const n = 1 + Math.floor(rnd() * 12);
    const nums = Array.from({ length: n }, () => Math.floor(rnd() * 20));
    const best = bruteForce(nums);
    if (dp(nums) !== best) dpBad++;
    const g = greedyByValue(nums);
    const e = evenOddSplit(nums);
    if (g < best) {
      greedyBad++;
      greedyLoss += (best - g) / best;
    }
    if (e < best) {
      evenOddBad++;
      evenOddLoss += (best - e) / best;
    }
  }
  const pct = (x: number) => `${((x / TRIALS) * 100).toFixed(1)}%`;
  console.log(`  점화식 DP          틀린 횟수 ${dpBad}건 (${pct(dpBad)})`);
  console.log(
    `  값 큰 순 그리디     틀린 횟수 ${greedyBad}건 (${pct(greedyBad)})   틀렸을 때 평균 손실 ${((greedyLoss / Math.max(1, greedyBad)) * 100).toFixed(1)}%`,
  );
  console.log(
    `  홀짝 인덱스 분할    틀린 횟수 ${evenOddBad}건 (${pct(evenOddBad)})   틀렸을 때 평균 손실 ${((evenOddLoss / Math.max(1, evenOddBad)) * 100).toFixed(1)}%`,
  );
  console.log(
    "\n  두 설계 다 대부분의 입력에서는 맞는다 — 그래서 몇 개 돌려 보고 채택하면 걸러지지 않는다.",
  );
}

// ── 3. 트레이스 절·시뮬의 고정 입력 ──────────────────────────────────────

console.log(
  "\n=== 트레이스 고정 입력 nums = [2, 7, 9, 3, 1] (기본 구현) ===\n",
);
{
  const nums = [2, 7, 9, 3, 1] as const;
  const n = nums.length;
  console.log(
    `  T1  ① n === 0 ? ${n} === 0 → ${n === 0}   ② n === 1 ? ${n} === 1 → ${n === 1}`,
  );
  const table = new Array<number>(n);
  table[0] = at(nums, 0);
  table[1] = Math.max(at(nums, 0), at(nums, 1));
  console.log(
    `  T2  기저  dp[0] = nums[0] = ${table[0]}   dp[1] = max(${at(nums, 0)}, ${at(nums, 1)}) = ${table[1]}`,
  );
  let step = 2;
  for (let i = 2; i < n; i++) {
    step++;
    const skip = at(table, i - 1);
    const take = at(table, i - 2) + at(nums, i);
    table[i] = Math.max(skip, take);
    console.log(
      `  T${step}  ③ ${i} < ${n} 참 → ④ max(안 턴다 ${skip}, 턴다 ${at(table, i - 2)}+${at(nums, i)}=${take}) = ${table[i]}   ${
        take > skip
          ? "턴다(오른쪽)가 이긴다"
          : take < skip
            ? "안 턴다(왼쪽)가 이긴다"
            : "동률 — max 는 왼쪽을 돌려준다"
      }`,
    );
  }
  step++;
  console.log(
    `  T${step}  ③ ${n} < ${n} 거짓 → 탈출. 반환 dp[${n - 1}] = ${at(table, n - 1)}`,
  );
  console.log(
    `      dp = [${table.join(", ")}]   완전탐색 대조 ${bruteForce(nums)}`,
  );

  console.log("\n  ①② 를 참으로 만드는 짧은 입력 둘:");
  console.log(`  T${step + 1}  nums = []   → n=0, ① 참 → 반환 ${dp([])}`);
  console.log(
    `  T${step + 2}  nums = [7]  → n=1, ① 거짓 · ② 참 → 반환 ${dp([7])}`,
  );
}

// ── 4. 슬라이딩 순서를 뒤집으면 (D6 실수 시나리오) ───────────────────────

console.log("\n=== 실수  prev1 = curr 을 prev2 = prev1 보다 먼저 쓰면 ===\n");
{
  const nums = [2, 7, 9, 3, 1] as const;
  const rightCurr: number[] = [];
  const wrongCurr: number[] = [];

  let p2 = at(nums, 0);
  let p1 = Math.max(at(nums, 0), at(nums, 1));
  for (let i = 2; i < nums.length; i++) {
    const curr = Math.max(p1, p2 + at(nums, i));
    rightCurr.push(curr);
    p2 = p1;
    p1 = curr;
  }

  let q2 = at(nums, 0);
  let q1 = Math.max(at(nums, 0), at(nums, 1));
  for (let i = 2; i < nums.length; i++) {
    const curr = Math.max(q1, q2 + at(nums, i));
    wrongCurr.push(curr);
    q1 = curr; // 먼저 덮어쓰고
    q2 = q1; // 덮어쓴 값을 옮긴다 — 뒤집힌 순서
  }

  console.log(`  올바른 순서  curr = [${rightCurr.join(", ")}]   반환 ${p1}`);
  console.log(`  뒤집은 순서  curr = [${wrongCurr.join(", ")}]   반환 ${q1}`);
  console.log(`  완전탐색 정답 ${bruteForce(nums)}`);
}

// ── 5. 본문 구현이 실제로 옳은지 (E5) ─────────────────────────────────────

console.log("\n=== 본문 구현 검증 ===\n");
{
  let ok = true;
  for (let seed = 1; seed <= 20000; seed++) {
    const rnd = makeRandom(seed);
    const n = Math.floor(rnd() * 15);
    const nums = Array.from({ length: n }, () => Math.floor(rnd() * 30));
    if (dp(nums) !== bruteForce(nums)) {
      ok = false;
      console.log(`  불일치 seed=${seed} nums=[${nums.join(",")}]`);
      break;
    }
  }
  console.log(
    `  무작위 20,000건 완전탐색 대조: ${ok ? "전부 일치" : "불일치 발견"}`,
  );
  console.log(
    `  nums = [] → ${dp([])}   [7] → ${dp([7])}   [2,7,9,3,1] → ${dp([2, 7, 9, 3, 1])}   [2,1,1,2] → ${dp([2, 1, 1, 2])}`,
  );
}

// ── 6. 가이드 반례 표 네 행 전수 확인 ─────────────────────────────────────

console.log("\n=== 가이드 반례 표 (네 행) ===\n");
console.log(
  `  ${"nums".padEnd(16)} ${"그리디".padStart(8)} ${"홀짝".padStart(8)} ${"DP".padStart(6)} ${"완전탐색".padStart(10)}`,
);
for (const nums of [
  [3, 4, 3],
  [2, 1, 1, 2],
  [1, 2, 2],
  [1, 0, 0, 1],
] as const) {
  console.log(
    `  ${`[${nums.join(", ")}]`.padEnd(16)} ${String(greedyByValue(nums)).padStart(8)} ${String(evenOddSplit(nums)).padStart(8)} ${String(dp(nums)).padStart(6)} ${String(bruteForce(nums)).padStart(10)}`,
  );
}

// ── 7. 자체 점검 문제 2 — nums[3] 을 얼마로 올리면 T4 에서 오른쪽이 이기는가 ──

console.log("\n=== 점검 문제 2 — nums[3] 을 올리면 ===\n");
for (const v of [3, 4, 5, 6] as const) {
  const nums = [2, 7, 9, v, 1];
  const left = 11; // dp[2]
  const right = 7 + v; // dp[1] + nums[3]
  console.log(
    `  nums[3] = ${v}   T4 왼쪽 ${left} vs 오른쪽 ${right} → dp[3] = ${Math.max(left, right)}   최종 반환 ${dp(nums)}`,
  );
}
