/**
 * longestCommonSubsequence 가이드가 본문에 싣는 수치의 근거.
 *
 * 가이드는 경쟁 설계 둘(문자 빈도 교집합 · 탐욕 좌측 매칭)의 반례와 실패율,
 * 트레이스 단계별 표 값, 대각선을 안 챙긴 버그 버전의 실제 반환값을 싣는다.
 * 그 값은 전부 여기서 나온다 — 지어낸 값이 하나도 없어야 한다는 것이
 * 요구(원칙 E3)이고, 이 파일이 그것을 재현 가능하게 만든다.
 *
 *   bun src/algorithms/array/longestCommonSubsequence/_scratch/verify-guide-claims.ts
 */

function at<T>(xs: readonly T[], i: number): T {
  const v = xs[i];
  if (v === undefined)
    throw new RangeError(`index ${i} out of range (len ${xs.length})`);
  return v;
}

function ch(s: string, i: number): string {
  const v = s[i];
  if (v === undefined) throw new RangeError(`index ${i} out of range`);
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

// ── 설계들 ────────────────────────────────────────────────────────────────

/** 정본 — 2차원 표 DP. 나머지를 이것과 대조한다. */
function lcs(s: string, t: string): number {
  const n = s.length;
  const m = t.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const row = at(dp, i);
      if (ch(s, i - 1) === ch(t, j - 1)) row[j] = at(at(dp, i - 1), j - 1) + 1;
      else row[j] = Math.max(at(at(dp, i - 1), j), at(row, j - 1));
    }
  }
  return at(at(dp, n), m);
}

/** 정본의 1차원 롤링 판 — 가이드 최적화 코드와 같은 것. */
function lcsRolling(s0: string, t0: string): number {
  let s = s0;
  let t = t0;
  if (s.length < t.length) [s, t] = [t, s];
  const n = s.length;
  const m = t.length;
  const dp = new Array<number>(m + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    let prevDiag = 0;
    for (let j = 1; j <= m; j++) {
      const temp = at(dp, j);
      if (ch(s, i - 1) === ch(t, j - 1)) dp[j] = prevDiag + 1;
      else dp[j] = Math.max(at(dp, j), at(dp, j - 1));
      prevDiag = temp;
    }
  }
  return at(dp, m);
}

/** 경쟁 설계 A — 순서를 버리고 문자 빈도의 교집합 크기만 센다. */
function multisetIntersect(s: string, t: string): number {
  const count = new Map<string, number>();
  for (const c of s) count.set(c, (count.get(c) ?? 0) + 1);
  let total = 0;
  for (const c of t) {
    const left = count.get(c) ?? 0;
    if (left > 0) {
      count.set(c, left - 1);
      total++;
    }
  }
  return total;
}

/**
 * 경쟁 설계 B — s 를 왼쪽부터 훑으며 t 의 아직 안 쓴 **가장 왼쪽** 같은 글자에 붙인다.
 * 못 찾으면 그 글자만 버리고 t 포인터는 그대로 둔다(포인터를 밀어 버리면 설계가
 * 부당하게 약해진다 — 공정한 형태로 재야 대조가 성립한다).
 */
function greedyLeftmost(s: string, t: string): number {
  let j = 0;
  let matched = 0;
  for (let i = 0; i < s.length; i++) {
    let k = j;
    while (k < t.length && ch(t, k) !== ch(s, i)) k++;
    if (k < t.length) {
      matched++;
      j = k + 1;
    }
  }
  return matched;
}

// ── 1. 가장 짧은 반례 ─────────────────────────────────────────────────────

console.log(
  "=== 경쟁 설계 반례 (가장 짧은 것부터 전수 탐색, 알파벳 {a,b,c}) ===\n",
);
{
  const ALPHA = "abc";
  const words = (len: number): string[] => {
    if (len === 0) return [""];
    const out: string[] = [];
    for (const w of words(len - 1)) for (const c of ALPHA) out.push(w + c);
    return out;
  };
  const found = new Map<string, [string, string]>();
  outer: for (let total = 2; total <= 7; total++) {
    for (let ls = 1; ls < total; ls++) {
      const lt = total - ls;
      for (const s of words(ls)) {
        for (const t of words(lt)) {
          const best = lcs(s, t);
          if (!found.has("multiset") && multisetIntersect(s, t) !== best)
            found.set("multiset", [s, t]);
          if (!found.has("greedy") && greedyLeftmost(s, t) !== best)
            found.set("greedy", [s, t]);
          if (found.size === 2) break outer;
        }
      }
    }
  }
  for (const [key, [s, t]] of found) {
    const label = key === "multiset" ? "문자 빈도 교집합" : "탐욕 좌측 매칭";
    const got =
      key === "multiset" ? multisetIntersect(s, t) : greedyLeftmost(s, t);
    console.log(
      `  ${label.padEnd(18)} s="${s}"  t="${t}"   그 설계 ${got}   정답(DP) ${lcs(s, t)}`,
    );
  }
}

console.log("\n=== 가이드가 싣는 반례를 직접 확인 ===\n");
console.log(
  `  ${"s".padEnd(8)} ${"t".padEnd(8)} ${"빈도 교집합".padStart(12)} ${"탐욕 좌측".padStart(10)} ${"정답".padStart(6)}`,
);
for (const [s, t] of [
  ["ab", "ba"],
  ["cab", "abc"],
  ["abcde", "ace"],
  ["bcab", "abcb"],
] as const) {
  console.log(
    `  ${s.padEnd(8)} ${t.padEnd(8)} ${String(multisetIntersect(s, t)).padStart(12)} ${String(greedyLeftmost(s, t)).padStart(10)} ${String(lcs(s, t)).padStart(6)}`,
  );
}

// ── 2. 실패율 ─────────────────────────────────────────────────────────────

console.log("\n=== 무작위 문자열 100,000쌍에서 정답을 못 낸 비율 ===\n");
{
  const TRIALS = 100_000;
  let msBad = 0;
  let grBad = 0;
  let msOver = 0;
  let grUnder = 0;
  let dpBad = 0;
  for (let seed = 1; seed <= TRIALS; seed++) {
    const rnd = makeRandom(seed);
    const alpha = "abc";
    const mk = (len: number) =>
      Array.from({ length: len }, () => ch(alpha, Math.floor(rnd() * 3))).join(
        "",
      );
    const s = mk(1 + Math.floor(rnd() * 8));
    const t = mk(1 + Math.floor(rnd() * 8));
    const best = lcs(s, t);
    if (lcsRolling(s, t) !== best) dpBad++;
    const ms = multisetIntersect(s, t);
    const gr = greedyLeftmost(s, t);
    if (ms !== best) {
      msBad++;
      if (ms > best) msOver++;
    }
    if (gr !== best) {
      grBad++;
      if (gr < best) grUnder++;
    }
  }
  const pct = (x: number) => `${((x / TRIALS) * 100).toFixed(1)}%`;
  console.log(`  점화식 DP(롤링)     틀린 횟수 ${dpBad}건 (${pct(dpBad)})`);
  console.log(
    `  문자 빈도 교집합     틀린 횟수 ${msBad}건 (${pct(msBad)})   그중 답을 부풀린 경우 ${msOver}건`,
  );
  console.log(
    `  탐욕 좌측 매칭       틀린 횟수 ${grBad}건 (${pct(grBad)})   그중 답을 깎은 경우 ${grUnder}건`,
  );
}

// ── 3. naive 재귀 호출 횟수 (기존 표 재확인) ──────────────────────────────

console.log(
  "\n=== 메모 없는 재귀의 호출 횟수 (공통 문자가 전혀 없는 두 문자열) ===\n",
);
for (const len of [2, 3, 4, 5, 6] as const) {
  const s = "a".repeat(len);
  const t = "b".repeat(len);
  let calls = 0;
  const f = (i: number, j: number): number => {
    calls++;
    if (i === 0 || j === 0) return 0;
    if (ch(s, i - 1) === ch(t, j - 1)) return f(i - 1, j - 1) + 1;
    return Math.max(f(i - 1, j), f(i, j - 1));
  };
  f(len, len);
  console.log(`  길이 ${len}   호출 ${calls.toLocaleString()}회`);
}

// ── 4. 트레이스 절·시뮬의 고정 입력 ──────────────────────────────────────

console.log(
  '\n=== 트레이스 고정 입력 s = "abcde", t = "ace" (기본 구현) ===\n',
);
{
  const s = "abcde";
  const t = "ace";
  const n = s.length;
  const m = t.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  console.log(`  T1  경계 초기화 — dp[0][*] = dp[*][0] = 0`);
  for (let i = 1; i <= n; i++) {
    const parts: string[] = [];
    for (let j = 1; j <= m; j++) {
      const row = at(dp, i);
      const same = ch(s, i - 1) === ch(t, j - 1);
      if (same) row[j] = at(at(dp, i - 1), j - 1) + 1;
      else row[j] = Math.max(at(at(dp, i - 1), j), at(row, j - 1));
      parts.push(
        same
          ? `j=${j} ③ '${ch(s, i - 1)}'='${ch(t, j - 1)}' 참 → 대각 ${at(at(dp, i - 1), j - 1)}+1=${at(row, j)}`
          : `j=${j} ④ '${ch(s, i - 1)}'≠'${ch(t, j - 1)}' → max(위 ${at(at(dp, i - 1), j)}, 왼 ${at(row, j - 1)})=${at(row, j)}`,
      );
    }
    console.log(
      `  T${i + 1}  ① ${i} <= ${n} 참 · s[${i - 1}]='${ch(s, i - 1)}'\n        ${parts.join("\n        ")}\n        행 = [${at(dp, i).join(", ")}]`,
    );
  }
  console.log(
    `  T${n + 2}  ① ${n + 1} <= ${n} 거짓 → 탈출. 반환 dp[${n}][${m}] = ${at(at(dp, n), m)}`,
  );
  console.log(
    `\n  ① 을 처음부터 거짓으로 만드는 짧은 입력: s="" → ${lcs("", "ace")}`,
  );
  console.log(
    `  ② 를 처음부터 거짓으로 만드는 짧은 입력: t="" → ${lcs("abcde", "")}`,
  );
}

// ── 5. 대각선을 안 챙긴 버그 버전 ────────────────────────────────────────

console.log("\n=== 실수  temp 없이 dp[j-1] 을 대각선 대용으로 쓰면 ===\n");
{
  const buggy = (s: string, t: string): { out: number; rows: string[] } => {
    const n = s.length;
    const m = t.length;
    const dp = new Array<number>(m + 1).fill(0);
    const rows: string[] = [];
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        if (ch(s, i - 1) === ch(t, j - 1))
          dp[j] = at(dp, j - 1) + 1; // 버그
        else dp[j] = Math.max(at(dp, j), at(dp, j - 1));
      }
      rows.push(
        `i=${i} (s[${i - 1}]='${ch(s, i - 1)}') → dp = [${dp.join(", ")}]`,
      );
    }
    return { out: at(dp, m), rows };
  };
  for (const [s, t] of [
    ["bab", "aaaa"],
    ["babb", "bbab"],
  ] as const) {
    const b = buggy(s, t);
    console.log(`  s="${s}", t="${t}"`);
    for (const r of b.rows) console.log(`    ${r}`);
    console.log(`    버그 결과 ${b.out}   정답 ${lcs(s, t)}\n`);
  }
}

// ── 6. 본문 구현이 실제로 옳은지 (E5) ─────────────────────────────────────

console.log("=== 본문 구현 검증 ===\n");
{
  let ok = true;
  for (let seed = 1; seed <= 20000; seed++) {
    const rnd = makeRandom(seed);
    const alpha = "abcd";
    const mk = (len: number) =>
      Array.from({ length: len }, () => ch(alpha, Math.floor(rnd() * 4))).join(
        "",
      );
    const s = mk(Math.floor(rnd() * 9));
    const t = mk(Math.floor(rnd() * 9));
    if (lcs(s, t) !== lcsRolling(s, t)) {
      ok = false;
      console.log(`  불일치 seed=${seed} s="${s}" t="${t}"`);
      break;
    }
  }
  console.log(
    `  2차원 판 vs 롤링 판 무작위 20,000쌍: ${ok ? "전부 일치" : "불일치 발견"}`,
  );
  console.log(
    `  s="abcde", t="ace" → ${lcs("abcde", "ace")}   s="", t="abc" → ${lcs("", "abc")}   s="abc", t="xyz" → ${lcs("abc", "xyz")}`,
  );
  console.log(`  점검 문제 1  s="abc", t="bca" → ${lcs("abc", "bca")}`);
}
