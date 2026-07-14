// 가이드 본문 코드를 추출해 실행 검증하는 스크래치 파일.
// 3개 구현을 서로 대조한다: naive(브루트포스, 소규모만), basic(2D isPal 테이블),
// optimized(중심 확장, O(n) 공간).

// ---------- naive (지수 시간, n<=12 정도만) ----------
function isPalindromeNaive(s: string, l: number, r: number): boolean {
  while (l < r) {
    if (s[l] !== s[r]) return false;
    l++;
    r--;
  }
  return true;
}

function minPiecesNaive(s: string, start: number, n: number): number {
  if (start === n) return 0; // 빈 접미사는 조각 0개
  let best = Infinity;
  for (let end = start; end < n; end++) {
    if (isPalindromeNaive(s, start, end)) {
      best = Math.min(best, 1 + minPiecesNaive(s, end + 1, n));
    }
  }
  return best;
}

function palindromePartitioningMinCutNaive(s: string): number {
  const n = s.length;
  return minPiecesNaive(s, 0, n) - 1; // 조각 수 - 1 = 컷 횟수
}

// ---------- basic: 2D isPal 테이블 + 1D cuts DP (O(n^2) 시간, O(n^2) 공간) ----------
function palindromePartitioningMinCutBasic(s: string): number {
  const n = s.length;
  if (n === 0) return 0;

  const isPal: boolean[][] = Array.from({ length: n }, () => new Array(n).fill(false));

  for (let i = 0; i < n; i++) isPal[i]![i] = true;
  for (let i = 0; i < n - 1; i++) isPal[i]![i + 1] = s[i] === s[i + 1];

  for (let len = 3; len <= n; len++) {
    for (let i = 0; i <= n - len; i++) {
      const j = i + len - 1;
      isPal[i]![j] = s[i] === s[j] && isPal[i + 1]![j - 1]!;
    }
  }

  const cuts = new Array<number>(n).fill(Infinity);
  for (let i = 0; i < n; i++) {
    if (isPal[0]![i]) {
      cuts[i] = 0;
    } else {
      for (let j = 1; j <= i; j++) {
        if (isPal[j]![i]) {
          cuts[i] = Math.min(cuts[i]!, cuts[j - 1]! + 1);
        }
      }
    }
  }

  return cuts[n - 1]!;
}

// ---------- optimized: 중심 확장 (O(n^2) 시간, O(n) 공간) ----------
function palindromePartitioningMinCutOptimized(s: string): number {
  const n = s.length;
  if (n === 0) return 0;

  const cut = new Array<number>(n);
  for (let i = 0; i < n; i++) cut[i] = i; // 상한: 전부 낱개로 자르면 i번 컷

  const expand = (left: number, right: number) => {
    while (left >= 0 && right < n && s[left] === s[right]) {
      cut[right] = left === 0 ? 0 : Math.min(cut[right]!, cut[left - 1]! + 1);
      left--;
      right++;
    }
  };

  for (let center = 0; center < n; center++) {
    expand(center, center); // 홀수 길이
    expand(center, center + 1); // 짝수 길이
  }

  return cut[n - 1]!;
}

// ---------- 검증 ----------
function assertEq(name: string, actual: number, expected: number) {
  const ok = actual === expected;
  console.log(`${ok ? "OK  " : "FAIL"} ${name}: actual=${actual} expected=${expected}`);
  if (!ok) process.exitCode = 1;
}

console.log("=== 대표 예시 (문제 명세) ===");
assertEq('basic("a")', palindromePartitioningMinCutBasic("a"), 0);
assertEq('basic("aa")', palindromePartitioningMinCutBasic("aa"), 0);
assertEq('basic("ab")', palindromePartitioningMinCutBasic("ab"), 1);
assertEq('basic("aab")', palindromePartitioningMinCutBasic("aab"), 1);
assertEq('basic("abcde")', palindromePartitioningMinCutBasic("abcde"), 4);
assertEq('basic("abba")', palindromePartitioningMinCutBasic("abba"), 0);
assertEq('basic("noonracecar")', palindromePartitioningMinCutBasic("noonracecar"), 1);

assertEq('optimized("a")', palindromePartitioningMinCutOptimized("a"), 0);
assertEq('optimized("aa")', palindromePartitioningMinCutOptimized("aa"), 0);
assertEq('optimized("ab")', palindromePartitioningMinCutOptimized("ab"), 1);
assertEq('optimized("aab")', palindromePartitioningMinCutOptimized("aab"), 1);
assertEq('optimized("abcde")', palindromePartitioningMinCutOptimized("abcde"), 4);
assertEq('optimized("abba")', palindromePartitioningMinCutOptimized("abba"), 0);
assertEq('optimized("noonracecar")', palindromePartitioningMinCutOptimized("noonracecar"), 1);

console.log("=== naive와 교차검증 (소규모) ===");
const naiveTargets = ["a", "aa", "ab", "aab", "abba", "abcba", "aabaa", "abcde", "aaaa", "abac", "banana"];
for (const s of naiveTargets) {
  const naive = palindromePartitioningMinCutNaive(s);
  const basic = palindromePartitioningMinCutBasic(s);
  const opt = palindromePartitioningMinCutOptimized(s);
  const ok = naive === basic && basic === opt;
  console.log(`${ok ? "OK  " : "FAIL"} s="${s}" naive=${naive} basic=${basic} opt=${opt}`);
  if (!ok) process.exitCode = 1;
}

console.log("=== 무작위 교차검증 (basic vs optimized, n<=12, alphabet={a,b,c}) ===");
function randomString(n: number, alphabet: string): string {
  let out = "";
  for (let i = 0; i < n; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}
let randFail = false;
for (let trial = 0; trial < 300; trial++) {
  const n = 1 + Math.floor(Math.random() * 12);
  const s = randomString(n, "ab");
  const basic = palindromePartitioningMinCutBasic(s);
  const opt = palindromePartitioningMinCutOptimized(s);
  const naive = palindromePartitioningMinCutNaive(s);
  if (basic !== opt || basic !== naive) {
    console.log(`FAIL s="${s}" naive=${naive} basic=${basic} opt=${opt}`);
    randFail = true;
  }
}
console.log(randFail ? "무작위 검증 중 불일치 발견" : "무작위 300건 모두 일치 (naive/basic/optimized)");
if (randFail) process.exitCode = 1;

console.log("=== 시뮬레이션 본문용 트레이스: s='aab' (basic) ===");
{
  const s = "aab";
  const n = s.length;
  const isPal: boolean[][] = Array.from({ length: n }, () => new Array(n).fill(false));
  for (let i = 0; i < n; i++) isPal[i]![i] = true;
  console.log("길이1 완료 후 isPal:", isPal.map((row) => row.map((v) => (v ? "T" : "F"))));
  for (let i = 0; i < n - 1; i++) isPal[i]![i + 1] = s[i] === s[i + 1];
  console.log("길이2 완료 후 isPal:", isPal.map((row) => row.map((v) => (v ? "T" : "F"))));
  for (let len = 3; len <= n; len++) {
    for (let i = 0; i <= n - len; i++) {
      const j = i + len - 1;
      isPal[i]![j] = s[i] === s[j] && isPal[i + 1]![j - 1]!;
    }
  }
  console.log("길이3 완료 후 isPal:", isPal.map((row) => row.map((v) => (v ? "T" : "F"))));

  const cuts = new Array<number>(n).fill(Infinity);
  for (let i = 0; i < n; i++) {
    if (isPal[0]![i]) {
      cuts[i] = 0;
    } else {
      for (let j = 1; j <= i; j++) {
        if (isPal[j]![i]) cuts[i] = Math.min(cuts[i]!, cuts[j - 1]! + 1);
      }
    }
    console.log(`cuts 갱신 후 (i=${i}):`, cuts);
  }
  console.log("최종 반환값:", cuts[n - 1]);
}

console.log("=== 최적화 코드 트레이스: s='aab' (center expansion) ===");
{
  const s = "aab";
  const n = s.length;
  const cut = new Array<number>(n);
  for (let i = 0; i < n; i++) cut[i] = i;
  console.log("초기 cut (상한):", [...cut]);
  const expand = (left: number, right: number, label: string) => {
    while (left >= 0 && right < n && s[left] === s[right]) {
      const before = cut[right];
      cut[right] = left === 0 ? 0 : Math.min(cut[right]!, cut[left - 1]! + 1);
      console.log(`${label} expand(left=${left},right=${right}) s[${left}]=${s[left]} s[${right}]=${s[right]} cut[${right}]: ${before} -> ${cut[right]}`);
      left--;
      right++;
    }
  };
  for (let center = 0; center < n; center++) {
    expand(center, center, `center=${center} 홀수`);
    expand(center, center + 1, `center=${center} 짝수`);
  }
  console.log("최종 cut:", cut, "반환값:", cut[n - 1]);
}

console.log("=== 점검 문제용 후보 계산 ===");
for (const s of ["abab", "aabbaa", "abcbab", "racecar", "aabaa", "abcba", "aabb"]) {
  console.log(s, "->", palindromePartitioningMinCutBasic(s), palindromePartitioningMinCutOptimized(s));
}
