// E3 자기검증용 스크래치 — 가이드 본문에 실을 코드를 그대로 옮겨 실행 검증한다.

// --- 원형: 순수 재귀 (naive) ---
function editDistanceNaive(s: string, t: string): number {
  function f(i: number, j: number): number {
    if (i === 0) return j;
    if (j === 0) return i;
    if (s[i - 1] === t[j - 1]) return f(i - 1, j - 1);
    return 1 + Math.min(f(i - 1, j), f(i, j - 1), f(i - 1, j - 1));
  }
  return f(s.length, t.length);
}

// --- 개선: 2D DP 테이블 ---
function editDistanceDP(s: string, t: string): number {
  const n = s.length;
  const m = t.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (s[i - 1] === t[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[n][m];
}

// --- 최종: 1D 롤링 DP ---
function editDistance(s: string, t: string): number {
  const n = s.length;
  const m = t.length;

  let prev = new Array<number>(m + 1);
  for (let j = 0; j <= m; j++) prev[j] = j;

  for (let i = 1; i <= n; i++) {
    const curr = new Array<number>(m + 1);
    curr[0] = i;
    for (let j = 1; j <= m; j++) {
      if (s[i - 1] === t[j - 1]) {
        curr[j] = prev[j - 1];
      } else {
        curr[j] = 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
      }
    }
    prev = curr;
  }

  return prev[m];
}

// --- 대표 예시 ---
const cases: [string, string, number][] = [
  ["horse", "ros", 3],
  ["kitten", "sitting", 3],
  ["flaw", "lawn", 2],
  ["same", "same", 0],
  ["", "abc", 3],
  ["abc", "", 3],
  ["", "", 0],
  ["a", "b", 1],
];

console.log("=== 대표 예시 ===");
for (const [s, t, expected] of cases) {
  const rNaive = editDistanceNaive(s, t);
  const rDP = editDistanceDP(s, t);
  const rFinal = editDistance(s, t);
  const ok = rNaive === expected && rDP === expected && rFinal === expected;
  console.log(
    `editDistance(${JSON.stringify(s)}, ${JSON.stringify(t)}) = ${rFinal} (naive=${rNaive}, dp=${rDP}, expected=${expected}) ${ok ? "OK" : "MISMATCH"}`,
  );
}

// --- horse/ros DP 테이블 전체 출력 (시뮬 프레임 대조용) ---
console.log("\n=== horse/ros DP 테이블 ===");
{
  const s = "horse";
  const t = "ros";
  const n = s.length;
  const m = t.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (s[i - 1] === t[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  for (const row of dp) console.log(row.join(" "));
}

// --- 함정 시나리오: 인덱스 오프셋 실수 (s[i] 대신 s[i-1] 안 쓰면?) ---
console.log("\n=== 함정: 오프셋 실수 시뮬레이션 ===");
function editDistanceBuggyOffset(s: string, t: string): number {
  const n = s.length;
  const m = t.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      // 버그: s[i-1] 대신 s[i]를 참조 (오프셋 실수)
      if (s[i] === t[j]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[n][m];
}
console.log(
  `버그 버전 editDistance("horse","ros") = ${editDistanceBuggyOffset("horse", "ros")} (정답 3과 다름)`,
);

// --- 무작위 교차검증: naive vs DP vs 1D (작은 길이) ---
console.log("\n=== 무작위 교차검증 ===");
function randomString(len: number, alphabet: string): string {
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

let mismatches = 0;
for (let trial = 0; trial < 200; trial++) {
  const s = randomString(Math.floor(Math.random() * 6), "ab");
  const t = randomString(Math.floor(Math.random() * 6), "ab");
  const rNaive = editDistanceNaive(s, t);
  const rDP = editDistanceDP(s, t);
  const rFinal = editDistance(s, t);
  if (rNaive !== rDP || rDP !== rFinal) {
    mismatches++;
    console.log(`MISMATCH: s=${JSON.stringify(s)} t=${JSON.stringify(t)} naive=${rNaive} dp=${rDP} final=${rFinal}`);
  }
}
console.log(`200회 무작위 시행(길이 0~5, 알파벳 {a,b}) 중 불일치: ${mismatches}건`);

// 더 큰 무작위 문자열로 DP vs 1D만 교차검증 (naive는 지수 시간이라 제외)
let mismatches2 = 0;
for (let trial = 0; trial < 50; trial++) {
  const s = randomString(Math.floor(Math.random() * 40), "abcde");
  const t = randomString(Math.floor(Math.random() * 40), "abcde");
  const rDP = editDistanceDP(s, t);
  const rFinal = editDistance(s, t);
  if (rDP !== rFinal) {
    mismatches2++;
    console.log(`MISMATCH(large): s=${JSON.stringify(s)} t=${JSON.stringify(t)} dp=${rDP} final=${rFinal}`);
  }
}
console.log(`50회 무작위 시행(길이 0~39, 알파벳 5종) 중 DP-vs-1D 불일치: ${mismatches2}건`);
