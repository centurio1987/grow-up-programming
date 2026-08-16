/**
 * knapsack01 가이드가 본문에 싣는 수치의 근거.
 *
 * 가이드는 경쟁 설계 셋(가치 큰 순 · 무게 작은 순 · 가성비 큰 순 그리디)의 반례와
 * 실패율, 트레이스 단계별 표 값, 순회 방향을 뒤집었을 때의 실제 반환값을 싣는다.
 * 그 값은 전부 여기서 나온다 — 지어낸 값이 하나도 없어야 한다는 것이
 * 요구(원칙 E3)이고, 이 파일이 그것을 재현 가능하게 만든다.
 *
 *   bun src/algorithms/dp/knapsack01/_scratch/verify-guide-claims.ts
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

type Item = { w: number; v: number };

// ── 설계들 ────────────────────────────────────────────────────────────────

/** 정본 — 2차원 표 DP. */
function dp2D(
  weights: readonly number[],
  values: readonly number[],
  W: number,
): number {
  const n = weights.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(W + 1).fill(0),
  );
  for (let i = 1; i <= n; i++) {
    const wi = at(weights, i - 1);
    const vi = at(values, i - 1);
    const row = at(dp, i);
    const prev = at(dp, i - 1);
    for (let w = 0; w <= W; w++) {
      row[w] =
        w >= wi ? Math.max(at(prev, w), at(prev, w - wi) + vi) : at(prev, w);
    }
  }
  return at(at(dp, n), W);
}

/** 정본의 1차원 롤링 판 — 가이드 최적화 코드와 같은 것. */
function dp1D(
  weights: readonly number[],
  values: readonly number[],
  W: number,
): number {
  const dp = new Array<number>(W + 1).fill(0);
  for (let i = 0; i < weights.length; i++) {
    const wi = at(weights, i);
    const vi = at(values, i);
    for (let w = W; w >= wi; w--)
      dp[w] = Math.max(at(dp, w), at(dp, w - wi) + vi);
  }
  return at(dp, W);
}

/** 완전탐색 — 작은 n 전용 기준선. */
function bruteForce(
  weights: readonly number[],
  values: readonly number[],
  W: number,
): number {
  const n = weights.length;
  let best = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    let sw = 0;
    let sv = 0;
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        sw += at(weights, i);
        sv += at(values, i);
      }
    }
    if (sw <= W && sv > best) best = sv;
  }
  return best;
}

/** 그리디 공통 — 주어진 순서대로 훑으며 들어가면 담는다. */
function greedy(
  weights: readonly number[],
  values: readonly number[],
  W: number,
  order: (a: Item, b: Item) => number,
): number {
  const items: Item[] = weights.map((w, i) => ({ w, v: at(values, i) }));
  items.sort(order);
  let left = W;
  let total = 0;
  for (const it of items) {
    if (it.w <= left) {
      left -= it.w;
      total += it.v;
    }
  }
  return total;
}

const byValueDesc = (a: Item, b: Item) => b.v - a.v;
const byWeightAsc = (a: Item, b: Item) => a.w - b.w;
const byRatioDesc = (a: Item, b: Item) => b.v / b.w - a.v / a.w;

// ── 1. 가장 짧은 반례 ─────────────────────────────────────────────────────

const GREEDIES = [
  ["가치 큰 순", byValueDesc],
  ["무게 작은 순", byWeightAsc],
  ["가성비 큰 순", byRatioDesc],
] as const;

console.log(
  "=== 그리디 셋의 가장 짧은 반례 (무게·가치 1~4, W 1~6 전수 탐색) ===\n",
);
{
  const found = new Map<string, { w: number[]; v: number[]; W: number }>();
  outer: for (let n = 1; n <= 3; n++) {
    for (let W = 1; W <= 6; W++) {
      const total = 4 ** (2 * n);
      for (let code = 0; code < total; code++) {
        let c = code;
        const w: number[] = [];
        const v: number[] = [];
        for (let k = 0; k < n; k++) {
          w.push((c % 4) + 1);
          c = Math.floor(c / 4);
          v.push((c % 4) + 1);
          c = Math.floor(c / 4);
        }
        const best = bruteForce(w, v, W);
        for (const [label, ord] of GREEDIES) {
          if (!found.has(label) && greedy(w, v, W, ord) < best)
            found.set(label, { w: [...w], v: [...v], W });
        }
        if (found.size === GREEDIES.length) break outer;
      }
    }
  }
  for (const [label, ord] of GREEDIES) {
    const f = found.get(label);
    if (!f) {
      console.log(`  ${label.padEnd(14)} 반례 없음(탐색 범위 안에서)`);
      continue;
    }
    console.log(
      `  ${label.padEnd(14)} weights=[${f.w.join(",")}] values=[${f.v.join(",")}] W=${f.W}   그 설계 ${greedy(f.w, f.v, f.W, ord)}   정답 ${bruteForce(f.w, f.v, f.W)}`,
    );
  }
}

console.log("\n=== 가이드가 싣는 반례를 직접 확인 ===\n");
console.log(
  `  ${"입력".padEnd(40)} ${"가치".padStart(6)} ${"무게".padStart(6)} ${"가성비".padStart(8)} ${"정답".padStart(6)}`,
);
const CASES: { w: number[]; v: number[]; W: number }[] = [
  { w: [1, 3, 4], v: [1, 4, 5], W: 5 },
  { w: [3, 2, 2], v: [5, 3, 3], W: 4 },
  { w: [1, 4, 5], v: [1, 5, 6], W: 5 },
  { w: [2, 3, 4], v: [3, 4, 5], W: 6 },
];
for (const { w, v, W } of CASES) {
  const tag = `w=[${w.join(",")}] v=[${v.join(",")}] W=${W}`;
  console.log(
    `  ${tag.padEnd(40)} ${String(greedy(w, v, W, byValueDesc)).padStart(6)} ${String(greedy(w, v, W, byWeightAsc)).padStart(6)} ${String(greedy(w, v, W, byRatioDesc)).padStart(8)} ${String(bruteForce(w, v, W)).padStart(6)}`,
  );
}

// ── 2. 실패율 ─────────────────────────────────────────────────────────────

console.log("\n=== 무작위 입력 100,000건에서 정답을 못 낸 비율 ===\n");
{
  const TRIALS = 100_000;
  const bad = new Map<string, number>();
  const loss = new Map<string, number>();
  let dpBad = 0;
  for (let seed = 1; seed <= TRIALS; seed++) {
    const rnd = makeRandom(seed);
    const n = 1 + Math.floor(rnd() * 8);
    const w = Array.from({ length: n }, () => 1 + Math.floor(rnd() * 10));
    const v = Array.from({ length: n }, () => 1 + Math.floor(rnd() * 20));
    const W = 1 + Math.floor(rnd() * 25);
    const best = bruteForce(w, v, W);
    if (dp1D(w, v, W) !== best || dp2D(w, v, W) !== best) dpBad++;
    for (const [label, ord] of GREEDIES) {
      const got = greedy(w, v, W, ord);
      if (got < best) {
        bad.set(label, (bad.get(label) ?? 0) + 1);
        loss.set(label, (loss.get(label) ?? 0) + (best - got) / best);
      }
    }
  }
  const pct = (x: number) => `${((x / TRIALS) * 100).toFixed(1)}%`;
  console.log(`  점화식 DP           틀린 횟수 ${dpBad}건 (${pct(dpBad)})`);
  for (const [label] of GREEDIES) {
    const b = bad.get(label) ?? 0;
    const l = loss.get(label) ?? 0;
    console.log(
      `  ${label.padEnd(14)} 그리디   틀린 횟수 ${String(b).padStart(6)}건 (${pct(b)})   틀렸을 때 평균 손실 ${((l / Math.max(1, b)) * 100).toFixed(1)}%`,
    );
  }
  console.log(
    "\n  그리디는 답을 부풀리지 못한다 — 실제로 담은 것의 가치이므로 항상 정답 이하다.",
  );
}

// ── 3. 분수 배낭이면 가성비 그리디가 최적이라는 대조 ─────────────────────

console.log(
  "\n=== 같은 입력, 쪼갤 수 있으면(분수 배낭) 가성비 그리디가 최적이다 ===\n",
);
{
  const fractional = (
    w: readonly number[],
    v: readonly number[],
    W: number,
  ): number => {
    const items: Item[] = w.map((ww, i) => ({ w: ww, v: at(v, i) }));
    items.sort(byRatioDesc);
    let left = W;
    let total = 0;
    for (const it of items) {
      if (left <= 0) break;
      const take = Math.min(it.w, left);
      total += (it.v / it.w) * take;
      left -= take;
    }
    return total;
  };
  for (const { w, v, W } of CASES) {
    console.log(
      `  w=[${w.join(",")}] v=[${v.join(",")}] W=${W}   0/1 그리디 ${greedy(w, v, W, byRatioDesc)}   0/1 정답 ${bruteForce(w, v, W)}   분수 배낭 ${fractional(w, v, W).toFixed(2)}`,
    );
  }
  console.log(
    "\n  분수 배낭 값이 0/1 정답보다 크거나 같다 — 쪼갤 자유가 상한을 올린다.",
  );
}

// ── 4. 트레이스 절·시뮬의 고정 입력 ──────────────────────────────────────

console.log(
  "\n=== 트레이스 고정 입력 weights=[1,3,4], values=[1,4,5], W=5 ===\n",
);
{
  const weights = [1, 3, 4] as const;
  const values = [1, 4, 5] as const;
  const W = 5;
  const n = weights.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(W + 1).fill(0),
  );
  console.log(`  T1  초기화  dp[0] = [${at(dp, 0).join(", ")}]`);
  for (let i = 1; i <= n; i++) {
    const wi = at(weights, i - 1);
    const vi = at(values, i - 1);
    const row = at(dp, i);
    const prev = at(dp, i - 1);
    const four: string[] = [];
    const three: string[] = [];
    for (let w = 0; w <= W; w++) {
      if (w >= wi) {
        const skip = at(prev, w);
        const take = at(prev, w - wi) + vi;
        row[w] = Math.max(skip, take);
        three.push(
          `w=${w}: ${w} >= ${wi} 참 → max(안 담음 ${skip}, 담음 dp[${i - 1}][${w - wi}]=${at(prev, w - wi)}+${vi}=${take}) = ${row[w]}${take > skip ? "  담는 쪽" : take < skip ? "  안 담는 쪽" : "  동률"}`,
        );
      } else {
        row[w] = at(prev, w);
        four.push(`w=${w}: ${w} >= ${wi} 거짓 → 위 행 복사 ${row[w]}`);
      }
    }
    console.log(`  ── i=${i} (무게 ${wi}, 가치 ${vi}) ──`);
    console.log(
      `     ④ ${four.length ? four.join("\n        ") : "해당 없음"}`,
    );
    console.log(`     ③ ${three.join("\n        ")}`);
    console.log(`     행 = [${row.join(", ")}]`);
  }
  console.log(
    `  반환 dp[${n}][${W}] = ${at(at(dp, n), W)}   완전탐색 ${bruteForce(weights, values, W)}`,
  );
}

// ── 5. 실수 시나리오의 실제 반환값 ────────────────────────────────────────

console.log("\n=== 실수  1D 순회 방향을 오름차순으로 ===\n");
{
  const ascending = (
    w: readonly number[],
    v: readonly number[],
    W: number,
  ): number => {
    const dp = new Array<number>(W + 1).fill(0);
    for (let i = 0; i < w.length; i++) {
      const wi = at(w, i);
      const vi = at(v, i);
      for (let ww = wi; ww <= W; ww++)
        dp[ww] = Math.max(at(dp, ww), at(dp, ww - wi) + vi);
    }
    return at(dp, W);
  };
  for (const [w, v, W] of [
    [[2, 3], [3, 4], 4],
    [[1, 3, 4], [1, 4, 5], 5],
  ] as const) {
    console.log(
      `  w=[${w.join(",")}] v=[${v.join(",")}] W=${W}   내림차순 ${dp1D(w, v, W)}   오름차순 ${ascending(w, v, W)}   정답 ${bruteForce(w, v, W)}`,
    );
  }
  console.log(
    "\n  오름차순은 같은 물건을 여러 번 담는다 — 그것이 무한 배낭의 동작이다.",
  );
}

console.log("\n=== 실수  weights[i-1] 대신 weights[i] ===\n");
{
  const offset = (
    w: readonly number[],
    v: readonly number[],
    W: number,
  ): number => {
    const n = w.length;
    const dp: number[][] = Array.from({ length: n + 1 }, () =>
      new Array<number>(W + 1).fill(0),
    );
    for (let i = 1; i <= n; i++) {
      const wi = w[i]; // 버그 — i-1 이어야 한다
      const vi = v[i];
      const row = at(dp, i);
      const prev = at(dp, i - 1);
      for (let ww = 0; ww <= W; ww++) {
        row[ww] =
          wi !== undefined && vi !== undefined && ww >= wi
            ? Math.max(at(prev, ww), at(prev, ww - wi) + vi)
            : at(prev, ww);
      }
    }
    return at(at(dp, n), W);
  };
  for (const [w, v, W] of [
    [[5], [42], 5],
    [[1, 3, 4], [1, 4, 5], 5],
  ] as const) {
    console.log(
      `  w=[${w.join(",")}] v=[${v.join(",")}] W=${W}   올바름 ${dp2D(w, v, W)}   오프셋 버그 ${offset(w, v, W)}`,
    );
  }
}

// ── 6. 본문 구현이 실제로 옳은지 (E5) ─────────────────────────────────────

console.log("\n=== 본문 구현 검증 ===\n");
{
  let ok = true;
  for (let seed = 1; seed <= 20000; seed++) {
    const rnd = makeRandom(seed);
    const n = Math.floor(rnd() * 10);
    const w = Array.from({ length: n }, () => 1 + Math.floor(rnd() * 8));
    const v = Array.from({ length: n }, () => 1 + Math.floor(rnd() * 15));
    const W = Math.floor(rnd() * 20);
    const want = bruteForce(w, v, W);
    if (dp2D(w, v, W) !== want || dp1D(w, v, W) !== want) {
      ok = false;
      console.log(`  불일치 seed=${seed} w=[${w}] v=[${v}] W=${W}`);
      break;
    }
  }
  console.log(
    `  2D·1D vs 완전탐색 무작위 20,000건: ${ok ? "전부 일치" : "불일치 발견"}`,
  );
  console.log(
    `  점검 1  weights=[1,3,4], values=[1,4,5], W=5 → ${dp2D([1, 3, 4], [1, 4, 5], 5)}   W=0 → ${dp2D([1, 3, 4], [1, 4, 5], 0)}   물건 0개 → ${dp2D([], [], 5)}`,
  );
}
