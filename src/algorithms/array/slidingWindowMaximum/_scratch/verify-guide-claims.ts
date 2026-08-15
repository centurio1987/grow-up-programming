/**
 * slidingWindowMaximum 가이드가 본문에 싣는 수치의 근거.
 *
 * 가이드는 경쟁 설계 둘(직전 최댓값 재사용 · 최대 힙 + 지연 삭제)과의 대조,
 * 트레이스 단계별 덱 상태, shift 기반 구현이 실제로 옮기는 칸 수를 싣는다.
 * 그 값은 전부 여기서 나온다 — 지어낸 값이 하나도 없어야 한다는 것이
 * 요구(원칙 E3)이고, 이 파일이 그것을 재현 가능하게 만든다.
 *
 * 재는 것은 시간이 아니라 **기본 연산 횟수**다. 벽시계는 그 기계의 상수를 잴 뿐이라
 * 근거가 되지 않는다.
 *
 *   bun src/algorithms/array/slidingWindowMaximum/_scratch/verify-guide-claims.ts
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

/** 세는 단위 — 원소를 들여다본 횟수(비교·이동·힙 접근을 한 칸으로 친다). */
class Counter {
  ops = 0;
  bump(n = 1): void {
    this.ops += n;
  }
}

// ── 설계 넷 ───────────────────────────────────────────────────────────────

/** ① 순진한 방법 — 윈도우마다 처음부터 훑는다. */
function naive(nums: readonly number[], k: number, c: Counter): number[] {
  const out: number[] = [];
  for (let i = 0; i + k <= nums.length; i++) {
    let best = at(nums, i);
    c.bump();
    for (let j = i + 1; j < i + k; j++) {
      c.bump();
      if (at(nums, j) > best) best = at(nums, j);
    }
    out.push(best);
  }
  return out;
}

/**
 * ② 직전 최댓값 재사용 — 최댓값이 윈도우 밖으로 안 나갔으면 새 원소와 비교만 하고,
 * 나갔으면 그때만 윈도우 전체를 다시 훑는다. **정답은 항상 맞는다.**
 */
function cachedMax(nums: readonly number[], k: number, c: Counter): number[] {
  const out: number[] = [];
  let bestIdx = -1;
  for (let i = 0; i + k <= nums.length; i++) {
    if (bestIdx < i) {
      // 최댓값이 윈도우 밖으로 나갔다 → 전체 재스캔
      bestIdx = i;
      c.bump();
      for (let j = i + 1; j < i + k; j++) {
        c.bump();
        if (at(nums, j) > at(nums, bestIdx)) bestIdx = j;
      }
    } else if (i > 0) {
      // 새로 들어온 원소 하나만 비교
      const fresh = i + k - 1;
      c.bump();
      if (at(nums, fresh) >= at(nums, bestIdx)) bestIdx = fresh;
    } else {
      bestIdx = i;
      c.bump();
      for (let j = i + 1; j < i + k; j++) {
        c.bump();
        if (at(nums, j) > at(nums, bestIdx)) bestIdx = j;
      }
    }
    out.push(at(nums, bestIdx));
  }
  return out;
}

/** ③ 최대 힙 + 지연 삭제 — 정확하고 O(N log N). 힙 접근 한 번을 한 칸으로 센다. */
function lazyHeap(nums: readonly number[], k: number, c: Counter): number[] {
  // [값, 인덱스] 최대 힙
  const heap: [number, number][] = [];
  const less = (a: [number, number], b: [number, number]) => a[0] < b[0];
  const push = (v: [number, number]) => {
    heap.push(v);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      c.bump();
      if (!less(at(heap, p), at(heap, i))) break;
      [heap[p], heap[i]] = [at(heap, i), at(heap, p)];
      i = p;
    }
  };
  const pop = () => {
    const last = heap.pop();
    if (heap.length === 0 || last === undefined) return;
    heap[0] = last;
    let i = 0;
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let big = i;
      if (l < heap.length) {
        c.bump();
        if (less(at(heap, big), at(heap, l))) big = l;
      }
      if (r < heap.length) {
        c.bump();
        if (less(at(heap, big), at(heap, r))) big = r;
      }
      if (big === i) break;
      [heap[big], heap[i]] = [at(heap, i), at(heap, big)];
      i = big;
    }
  };

  const out: number[] = [];
  for (let i = 0; i < nums.length; i++) {
    push([at(nums, i), i]);
    if (i >= k - 1) {
      while (at(heap, 0)[1] < i - k + 1) {
        c.bump();
        pop();
      }
      out.push(at(heap, 0)[0]);
    }
  }
  return out;
}

/** ④ 단조 덱 — 이 가이드의 해법. 덱 접근 한 번을 한 칸으로 센다. */
function monotonicDeque(
  nums: readonly number[],
  k: number,
  c: Counter,
): number[] {
  const out: number[] = [];
  const dq: number[] = [];
  for (let i = 0; i < nums.length; i++) {
    while (dq.length > 0 && at(dq, 0) < i - k + 1) {
      c.bump();
      dq.shift();
    }
    while (dq.length > 0 && at(nums, at(dq, dq.length - 1)) <= at(nums, i)) {
      c.bump();
      dq.pop();
    }
    c.bump();
    dq.push(i);
    if (i >= k - 1) out.push(at(nums, at(dq, 0)));
  }
  return out;
}

// ── 1. 작은 고정 예시 ─────────────────────────────────────────────────────

const FIXED = [1, 3, -1, -3, 5, 3, 6, 7] as const;
const FIXED_K = 3;

console.log("=== 작은 고정 예시 — nums=[1,3,-1,-3,5,3,6,7], k=3 ===\n");
for (const [label, fn] of [
  ["순진한 순회", naive],
  ["직전 최댓값 재사용", cachedMax],
  ["최대 힙 + 지연 삭제", lazyHeap],
  ["단조 덱", monotonicDeque],
] as const) {
  const c = new Counter();
  const out = fn(FIXED, FIXED_K, c);
  console.log(
    `  ${label.padEnd(20)} 결과 [${out.join(", ")}]   연산 ${String(c.ops).padStart(3)}회`,
  );
}

// ── 2. 규모별 대조 — 무작위 입력과 적대적 입력 ───────────────────────────

const DESIGNS = [
  ["순진한 순회", naive],
  ["직전 최댓값 재사용", cachedMax],
  ["최대 힙 + 지연 삭제", lazyHeap],
  ["단조 덱", monotonicDeque],
] as const;

function report(
  title: string,
  make: (n: number) => number[],
  kOf: (n: number) => number,
) {
  console.log(`\n=== ${title} ===\n`);
  const SIZES = [2000, 8000, 32000] as const;
  const costs = new Map<string, number[]>();
  console.log(
    `  ${"N".padStart(6)}  ${"k".padStart(6)}  ${DESIGNS.map(([l]) => l.padStart(20)).join("")}`,
  );
  for (const n of SIZES) {
    const nums = make(n);
    const k = kOf(n);
    const reference = monotonicDeque(nums, k, new Counter()).join();
    const row: string[] = [];
    for (const [label, fn] of DESIGNS) {
      const c = new Counter();
      const out = fn(nums, k, c);
      if (out.join() !== reference) throw new Error(`${label} 결과 불일치`);
      row.push(String(c.ops).padStart(20));
      const acc = costs.get(label) ?? [];
      acc.push(c.ops);
      costs.set(label, acc);
    }
    console.log(
      `  ${String(n).padStart(6)}  ${String(k).padStart(6)}  ${row.join("")}`,
    );
  }
  console.log("\n  성장률 r = C(4N)/C(N)");
  for (const [label] of DESIGNS) {
    const xs = costs.get(label) ?? [];
    const rs: string[] = [];
    for (let i = 1; i < xs.length; i++)
      rs.push((at(xs, i) / at(xs, i - 1)).toFixed(2));
    console.log(`    ${label.padEnd(20)} ${rs.join(", ")}`);
  }
}

report(
  "무작위 입력 (k = N/4)",
  (n) => {
    const rnd = makeRandom(42);
    return Array.from({ length: n }, () => Math.floor(rnd() * 20000) - 10000);
  },
  (n) => Math.max(1, Math.floor(n / 4)),
);

report(
  "적대적 입력 — 단조 감소 배열 (k = N/4)",
  (n) => Array.from({ length: n }, (_, i) => n - i),
  (n) => Math.max(1, Math.floor(n / 4)),
);

// ── 3. shift 가 실제로 옮기는 칸 수 ──────────────────────────────────────

console.log(
  "\n=== shift 기반 덱이 실제로 옮기는 칸 수 (단조 감소 입력, k = N/2) ===\n",
);
{
  console.log(
    `  ${"N".padStart(7)}  ${"popFront 횟수".padStart(14)}  ${"옮긴 칸 수".padStart(14)}  ${"원형 버퍼".padStart(10)}`,
  );
  for (const n of [2000, 8000, 32000] as const) {
    const nums = Array.from({ length: n }, (_, i) => n - i);
    const k = Math.max(1, Math.floor(n / 2));
    let popFront = 0;
    let moved = 0;
    const dq: number[] = [];
    for (let i = 0; i < n; i++) {
      while (dq.length > 0 && at(dq, 0) < i - k + 1) {
        popFront++;
        moved += dq.length - 1; // shift 는 남은 원소를 전부 한 칸씩 당긴다
        dq.shift();
      }
      while (dq.length > 0 && at(nums, at(dq, dq.length - 1)) <= at(nums, i))
        dq.pop();
      dq.push(i);
    }
    console.log(
      `  ${String(n).padStart(7)}  ${String(popFront).padStart(14)}  ${String(moved).padStart(14)}  ${"0".padStart(10)}`,
    );
  }
  console.log(
    "\n  popFront 횟수는 상환 분석이 보장하는 대로 N 이하다 — 늘어나는 것은 한 번의 비용이다.",
  );
}

// ── 4. 트레이스 절·시뮬의 고정 입력 ──────────────────────────────────────

console.log("\n=== 트레이스 고정 입력 nums=[1,3,-1,-3,5,3,6,7], k=3 ===\n");
{
  const nums = FIXED;
  const k = FIXED_K;
  const dq: number[] = [];
  const out: number[] = [];
  for (let i = 0; i < nums.length; i++) {
    const lines: string[] = [];
    const L = i - k + 1;
    const front0 = dq.length > 0 ? at(dq, 0) : null;
    lines.push(
      `② 앞쪽 만료: front=${front0 ?? "없음"} < L=${L} ? ${front0 !== null && front0 < L}`,
    );
    while (dq.length > 0 && at(dq, 0) < L) {
      lines.push(`   popFront ${at(dq, 0)}`);
      dq.shift();
    }
    const back0 = dq.length > 0 ? at(dq, dq.length - 1) : null;
    lines.push(
      `③ 뒤쪽 청소: nums[back=${back0 ?? "없음"}]=${back0 === null ? "-" : at(nums, back0)} <= nums[${i}]=${at(nums, i)} ? ${
        back0 !== null && at(nums, back0) <= at(nums, i)
      }`,
    );
    while (dq.length > 0 && at(nums, at(dq, dq.length - 1)) <= at(nums, i)) {
      lines.push(
        `   popBack ${at(dq, dq.length - 1)} (값 ${at(nums, at(dq, dq.length - 1))})`,
      );
      dq.pop();
    }
    dq.push(i);
    lines.push(
      `   pushBack ${i}   덱=[${dq.join(", ")}]  값=[${dq.map((d) => at(nums, d)).join(", ")}]`,
    );
    const record = i >= k - 1;
    lines.push(
      `④ 기록: ${i} >= ${k - 1} ? ${record}${record ? `  →  result.push(${at(nums, at(dq, 0))})` : "  →  건너뜀"}`,
    );
    if (record) out.push(at(nums, at(dq, 0)));
    console.log(
      `  T${i + 2}  ① ${i} < ${nums.length} 참 · nums[${i}]=${at(nums, i)}`,
    );
    for (const l of lines) console.log(`       ${l}`);
    console.log(`       결과=[${out.join(", ")}]`);
  }
  console.log(
    `  T${nums.length + 2}  ① ${nums.length} < ${nums.length} 거짓 → 탈출. 반환 [${out.join(", ")}]`,
  );
}

// ── 5. 실수 시나리오의 실제 반환값 ────────────────────────────────────────

console.log("\n=== 실수  가드와 부등호 ===\n");
{
  const nums = FIXED;
  const k = FIXED_K;

  const noGuard = () => {
    const dq: number[] = [];
    const out: number[] = [];
    for (let i = 0; i < nums.length; i++) {
      while (dq.length > 0 && at(dq, 0) < i - k + 1) dq.shift();
      while (dq.length > 0 && at(nums, at(dq, dq.length - 1)) <= at(nums, i))
        dq.pop();
      dq.push(i);
      out.push(at(nums, at(dq, 0))); // i >= k-1 가드 없음
    }
    return out;
  };

  const wrongLe = () => {
    const dq: number[] = [];
    const out: number[] = [];
    for (let i = 0; i < nums.length; i++) {
      while (dq.length > 0 && at(dq, 0) <= i - k + 1) dq.shift(); // < 가 아니라 <=
      while (dq.length > 0 && at(nums, at(dq, dq.length - 1)) <= at(nums, i))
        dq.pop();
      dq.push(i);
      if (i >= k - 1) out.push(at(nums, at(dq, 0)));
    }
    return out;
  };

  const strictBack = () => {
    const dq: number[] = [];
    const out: number[] = [];
    for (let i = 0; i < nums.length; i++) {
      while (dq.length > 0 && at(dq, 0) < i - k + 1) dq.shift();
      while (dq.length > 0 && at(nums, at(dq, dq.length - 1)) < at(nums, i))
        dq.pop(); // <= 가 아니라 <
      dq.push(i);
      if (i >= k - 1) out.push(at(nums, at(dq, 0)));
    }
    return out;
  };

  const right = monotonicDeque(nums, k, new Counter());
  console.log(
    `  올바른 구현             [${right.join(", ")}]   길이 ${right.length}`,
  );
  const ng = noGuard();
  console.log(
    `  i >= k-1 가드 누락      [${ng.join(", ")}]   길이 ${ng.length}`,
  );
  const wl = wrongLe();
  console.log(
    `  앞쪽 만료를 <= 로       [${wl.join(", ")}]   길이 ${wl.length}`,
  );
  const sb = strictBack();
  console.log(
    `  뒤쪽 청소를 < 로        [${sb.join(", ")}]   길이 ${sb.length}   값 동일 ${sb.join() === right.join()}`,
  );

  // 같은 값이 많은 입력에서 덱 최대 길이 비교
  const dup = Array.from({ length: 2000 }, () => 7);
  const maxLen = (strict: boolean) => {
    const dq: number[] = [];
    let best = 0;
    const kk = 100;
    for (let i = 0; i < dup.length; i++) {
      while (dq.length > 0 && at(dq, 0) < i - kk + 1) dq.shift();
      while (
        dq.length > 0 &&
        (strict
          ? at(dup, at(dq, dq.length - 1)) < at(dup, i)
          : at(dup, at(dq, dq.length - 1)) <= at(dup, i))
      )
        dq.pop();
      dq.push(i);
      if (dq.length > best) best = dq.length;
    }
    return best;
  };
  console.log(
    `\n  전부 같은 값 2,000개 · k=100 에서 덱 최대 길이:  <= 판정 ${maxLen(false)}   < 판정 ${maxLen(true)}`,
  );
}

// ── 6. 본문 구현이 실제로 옳은지 (E5) ─────────────────────────────────────

console.log("\n=== 본문 구현 검증 ===\n");
{
  let ok = true;
  for (let seed = 1; seed <= 5000; seed++) {
    const rnd = makeRandom(seed);
    const n = 1 + Math.floor(rnd() * 12);
    const nums = Array.from({ length: n }, () => Math.floor(rnd() * 20) - 10);
    const k = 1 + Math.floor(rnd() * n);
    const want = naive(nums, k, new Counter()).join();
    if (monotonicDeque(nums, k, new Counter()).join() !== want) ok = false;
    if (cachedMax(nums, k, new Counter()).join() !== want) ok = false;
    if (lazyHeap(nums, k, new Counter()).join() !== want) ok = false;
    if (!ok) {
      console.log(`  불일치 seed=${seed} nums=[${nums.join(",")}] k=${k}`);
      break;
    }
  }
  console.log(
    `  네 구현 무작위 5,000건 교차 대조: ${ok ? "전부 일치" : "불일치 발견"}`,
  );
  console.log(
    `  점검 문제 1  nums=[9,4,8,2,6], k=2 → [${monotonicDeque([9, 4, 8, 2, 6], 2, new Counter()).join(", ")}]`,
  );
}
