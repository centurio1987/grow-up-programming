// ── 1) naive 재귀 (메모이제이션 없음) — 비용 체감용 ────────────────
let callCount = 0;
function lcsNaive(s: string, t: string, i: number, j: number): number {
  callCount++;
  if (i === 0 || j === 0) return 0;
  if (s[i - 1] === t[j - 1]) return lcsNaive(s, t, i - 1, j - 1) + 1;
  return Math.max(lcsNaive(s, t, i - 1, j), lcsNaive(s, t, i, j - 1));
}

// ── 2) 기본 구현: 2D DP 테이블 ──────────────────────────────────
function longestCommonSubsequenceBasic(s: string, t: string): number {
  const n = s.length;
  const m = t.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(0),
  );

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (s[i - 1] === t[j - 1]) {
        dp[i]![j] = dp[i - 1]![j - 1]! + 1;
      } else {
        dp[i]![j] = Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
      }
    }
  }

  return dp[n]![m]!;
}

// 잘못된 구현(함정 시연용): 불일치 시에도 대각선을 쓰는 흔한 실수
function longestCommonSubsequenceWrong(s: string, t: string): number {
  const n = s.length;
  const m = t.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(0),
  );

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (s[i - 1] === t[j - 1]) {
        dp[i]![j] = dp[i - 1]![j - 1]! + 1;
      } else {
        dp[i]![j] = dp[i - 1]![j - 1]!; // 버그: max(위,왼쪽) 대신 대각선을 그대로 씀
      }
    }
  }

  return dp[n]![m]!;
}

// ── 3) 최적화: 행 롤링 1D DP (짧은 쪽을 열로 두어 O(min(n,m)) 공간) ──
function longestCommonSubsequence(s: string, t: string): number {
  if (s.length < t.length) {
    [s, t] = [t, s]; // 배열 크기를 항상 더 짧은 문자열 길이에 맞춘다
  }
  const n = s.length;
  const m = t.length;
  const dp: number[] = new Array(m + 1).fill(0);

  for (let i = 1; i <= n; i++) {
    let prevDiag = 0; // dp[i-1][0]
    for (let j = 1; j <= m; j++) {
      const temp = dp[j]!; // 덮어쓰기 전에 dp[i-1][j]를 보존 → 다음 열의 대각선이 됨
      if (s[i - 1] === t[j - 1]) {
        dp[j] = prevDiag + 1;
      } else {
        dp[j] = Math.max(dp[j]!, dp[j - 1]!);
      }
      prevDiag = temp;
    }
  }

  return dp[m]!;
}

// 잘못된 롤링 구현(함정 시연용): 대각선을 별도로 보존하지 않고 이미 갱신된 dp[j-1]을 그대로 씀
function longestCommonSubsequenceRolledWrong(s: string, t: string): number {
  const n = s.length;
  const m = t.length;
  const dp: number[] = new Array(m + 1).fill(0);

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (s[i - 1] === t[j - 1]) {
        dp[j] = dp[j - 1]! + 1; // 버그: dp[i-1][j-1] 대신 이미 갱신된 dp[i][j-1]을 사용
      } else {
        dp[j] = Math.max(dp[j]!, dp[j - 1]!);
      }
    }
  }

  return dp[m]!;
}

// ── 검증 ──────────────────────────────────────────────────────
function assertEq(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "OK  " : "FAIL"} ${label}: actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`);
  if (!ok) process.exitCode = 1;
}

console.log("=== naive 비용 체감 (완전 불일치, 길이 4×4) ===");
callCount = 0;
const naiveResult = lcsNaive("abcd", "wxyz", 4, 4);
console.log(`lcsNaive("abcd","wxyz") = ${naiveResult}, callCount = ${callCount}`);

console.log("\n=== naive 비용 체감 (완전 불일치, 길이 3×3 / 6×6 비교) ===");
for (const len of [2, 3, 4, 5, 6]) {
  callCount = 0;
  const sArg = "abcdef".slice(0, len);
  const tArg = "ghijkl".slice(0, len);
  lcsNaive(sArg, tArg, len, len);
  console.log(`len=${len}: callCount=${callCount}`);
}

console.log("\n=== 대표 예시: s='abcde', t='ace' ===");
assertEq("basic dp[5][3]", longestCommonSubsequenceBasic("abcde", "ace"), 3);
assertEq("rolled", longestCommonSubsequence("abcde", "ace"), 3);

// dp 테이블 전체를 찍어 시뮬레이션 steps와 대조
{
  const s = "abcde", t = "ace";
  const n = s.length, m = t.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i]![j] = s[i - 1] === t[j - 1] ? dp[i - 1]![j - 1]! + 1 : Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
    }
  }
  console.log("전체 dp 테이블:");
  for (const row of dp) console.log(row);
}

console.log("\n=== 엣지 케이스 ===");
assertEq('s="", t="abc"', longestCommonSubsequence("", "abc"), 0);
assertEq('s="abc", t=""', longestCommonSubsequence("abc", ""), 0);
assertEq('s="", t=""', longestCommonSubsequence("", ""), 0);
assertEq('s="abc", t="abc"', longestCommonSubsequence("abc", "abc"), 3);
assertEq('s="abc", t="xyz"', longestCommonSubsequence("abc", "xyz"), 0);
assertEq('s="a", t="a"', longestCommonSubsequence("a", "a"), 1);

console.log("\n=== 문제 예시 교차 검증 ===");
assertEq('AGGTAB/GXTXAYB', longestCommonSubsequence("AGGTAB", "GXTXAYB"), 4);
assertEq('abc/aabbcc', longestCommonSubsequence("abc", "aabbcc"), 3);

console.log("\n=== 점검 문제용: s='abc', t='bca' ===");
console.log(`longestCommonSubsequence("abc","bca") = ${longestCommonSubsequence("abc", "bca")}`);
{
  const s = "abc", t = "bca";
  const n = s.length, m = t.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i]![j] = s[i - 1] === t[j - 1] ? dp[i - 1]![j - 1]! + 1 : Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
    }
  }
  console.log("dp table for abc/bca:");
  for (const row of dp) console.log(row);
}

console.log("\n=== 함정 코드(대각선 오용) 비교 ===");
console.log(`정답 구현 결과: ${longestCommonSubsequenceBasic("abcde", "ace")}, 오답 구현 결과: ${longestCommonSubsequenceWrong("abcde", "ace")}`);
{
  // 오답 dp 테이블 전체 출력 (함정 시연용 수치 확보)
  const s = "abcde", t = "ace";
  const n = s.length, m = t.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i]![j] = s[i - 1] === t[j - 1] ? dp[i - 1]![j - 1]! + 1 : dp[i - 1]![j - 1]!;
    }
  }
  console.log("오답 dp 테이블 (대각선 오용):");
  for (const row of dp) console.log(row);
}

console.log("\n=== basic vs rolled 랜덤 교차검증 ===");
function randStr(len: number, alphabet: string) {
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}
let mismatches = 0;
for (let iter = 0; iter < 500; iter++) {
  const s = randStr(Math.floor(Math.random() * 12), "abc");
  const t = randStr(Math.floor(Math.random() * 12), "abc");
  const a = longestCommonSubsequenceBasic(s, t);
  const b = longestCommonSubsequence(s, t);
  if (a !== b) {
    mismatches++;
    console.log(`MISMATCH s=${s} t=${t} basic=${a} rolled=${b}`);
  }
}
console.log(`random cross-check done, mismatches=${mismatches}/500`);
if (mismatches > 0) process.exitCode = 1;

console.log("\n=== 롤링 함정(대각선 미보존) 비교: s='abcde', t='ace' ===");
console.log(`정답 롤링 결과: ${longestCommonSubsequence("abcde", "ace")}, 오답 롤링 결과: ${longestCommonSubsequenceRolledWrong("abcde", "ace")}`);
console.log(`정답 롤링(AGGTAB/GXTXAYB): ${longestCommonSubsequence("AGGTAB", "GXTXAYB")}, 오답 롤링(AGGTAB/GXTXAYB): ${longestCommonSubsequenceRolledWrong("AGGTAB", "GXTXAYB")}`);

console.log("\n=== 3.1절 손 계산용: s='ab', t='ba' ===");
assertEq('s="ab", t="ba"', longestCommonSubsequence("ab", "ba"), 1);
{
  const s = "ab", t = "ba";
  const n = s.length, m = t.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i]![j] = s[i - 1] === t[j - 1] ? dp[i - 1]![j - 1]! + 1 : Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
    }
  }
  console.log("dp table for ab/ba:");
  for (const row of dp) console.log(row);
}

console.log("\n모든 검증 완료");

console.log("\n=== 롤링 함정 랜덤 탐색 (차이 나는 사례 찾기) ===");
let foundDiff = 0;
for (let iter = 0; iter < 2000; iter++) {
  const s = randStr(Math.floor(Math.random() * 8) + 1, "ab");
  const t = randStr(Math.floor(Math.random() * 8) + 1, "ab");
  const correct = longestCommonSubsequence(s, t);
  const wrong = longestCommonSubsequenceRolledWrong(s, t);
  if (correct !== wrong) {
    foundDiff++;
    if (foundDiff <= 5) console.log(`DIFF s=${s} t=${t} correct=${correct} wrong=${wrong}`);
  }
}
console.log(`총 차이 발견: ${foundDiff}/2000`);

console.log("\n=== 롤링 함정 상세 트레이스: s='bab', t='aaaa' ===");
{
  const s = "bab", t = "aaaa";
  const n = s.length, m = t.length;
  console.log(`정답(basic 2D): ${longestCommonSubsequenceBasic(s, t)}`);
  console.log(`정답(rolled 1D): ${longestCommonSubsequence(s, t)}`);
  console.log(`오답(rolled wrong): ${longestCommonSubsequenceRolledWrong(s, t)}`);

  // 오답 롤링을 행 단위로 트레이스
  const dp: number[] = new Array(m + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (s[i - 1] === t[j - 1]) {
        dp[j] = dp[j - 1]! + 1;
      } else {
        dp[j] = Math.max(dp[j]!, dp[j - 1]!);
      }
    }
    console.log(`오답 i=${i} (s[${i-1}]='${s[i-1]}') 이후 dp = [${dp.join(", ")}]`);
  }
}

console.log("\n=== 점검 문제 2용: s='babb', t='bbab' ===");
console.log(`정답: ${longestCommonSubsequence("babb", "bbab")}, 오답(롤링 대각선 미보존): ${longestCommonSubsequenceRolledWrong("babb", "bbab")}`);
