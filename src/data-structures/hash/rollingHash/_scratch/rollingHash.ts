// E3 자기검증 스크래치 — 가이드 본문 코드를 그대로 추출해 실행한다.

class RollingHash {
  private base: number;
  private mod: number;

  constructor(base: number = 31, mod: number = 1_000_000_007) {
    this.base = base;
    this.mod = mod;
  }

  hash(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (h * this.base + s.charCodeAt(i)) % this.mod;
    }
    return h;
  }

  search(text: string, pattern: string): number[] {
    const n = text.length;
    const m = pattern.length;
    if (m === 0 || m > n) return [];

    // base^(m-1) mod p — 창 왼쪽 끝 글자를 뺄 때 쓸 자릿값
    let highPow = 1;
    for (let i = 1; i < m; i++) highPow = (highPow * this.base) % this.mod;

    const patHash = this.hash(pattern);
    let winHash = this.hash(text.slice(0, m));

    const result: number[] = [];
    for (let i = 0; i <= n - m; i++) {
      if (winHash === patHash && text.slice(i, i + m) === pattern) {
        result.push(i);
      }
      if (i < n - m) {
        const leftCode = text.charCodeAt(i);
        const rightCode = text.charCodeAt(i + m);
        winHash = (winHash - leftCode * highPow) % this.mod;
        winHash = (winHash + this.mod) % this.mod; // 음수 방지
        winHash = (winHash * this.base + rightCode) % this.mod;
      }
    }
    return result;
  }
}

// ---- 원형(brute force): 모든 위치에서 직접 비교 ----
function bruteForceSearch(text: string, pattern: string): number[] {
  const n = text.length;
  const m = pattern.length;
  if (m === 0 || m > n) return [];
  const result: number[] = [];
  for (let i = 0; i <= n - m; i++) {
    if (text.slice(i, i + m) === pattern) result.push(i);
  }
  return result;
}

// ---- 개선(중간 단계): 매 윈도우마다 해시를 처음부터 재계산 (여전히 O(nm)) ----
function recomputeHashSearch(text: string, pattern: string): number[] {
  const rh = new RollingHash();
  const n = text.length;
  const m = pattern.length;
  if (m === 0 || m > n) return [];
  const patHash = rh.hash(pattern);
  const result: number[] = [];
  for (let i = 0; i <= n - m; i++) {
    const windowHash = rh.hash(text.slice(i, i + m)); // O(m) 매번!
    if (windowHash === patHash && text.slice(i, i + m) === pattern) {
      result.push(i);
    }
  }
  return result;
}

// ==== 실측 검증 ====

console.log("=== 1. 고정 입력(시뮬레이션과 동일): text='ababab', pattern='ab' ===");
const rh1 = new RollingHash(31, 1_000_000_007);
console.log("hash('ab') =", rh1.hash("ab"));
console.log("hash('ba') =", rh1.hash("ba"));
console.log("hash('ababab'.slice(0,2)) =", rh1.hash("ababab".slice(0, 2)));
console.log("search('ababab','ab') =", rh1.search("ababab", "ab"));

// highPow 및 각 스텝 winHash를 수동으로 트레이스
{
  const base = 31, mod = 1_000_000_007;
  const text = "ababab", pattern = "ab", m = 2, n = 6;
  let highPow = 1;
  for (let i = 1; i < m; i++) highPow = (highPow * base) % mod;
  console.log("highPow (base^(m-1)) =", highPow, "(base 자신과 같아야 함:", base, ")");

  const patHash = rh1.hash(pattern);
  let winHash = rh1.hash(text.slice(0, m));
  console.log(`i=0: winHash=${winHash} patHash=${patHash} 일치=${winHash === patHash}`);
  for (let i = 0; i <= n - m; i++) {
    if (i < n - m) {
      const leftCode = text.charCodeAt(i);
      const rightCode = text.charCodeAt(i + m);
      winHash = (winHash - leftCode * highPow) % mod;
      winHash = (winHash + mod) % mod;
      winHash = (winHash * base + rightCode) % mod;
      console.log(`i=${i}->${i + 1}: winHash=${winHash} (window='${text.slice(i + 1, i + 1 + m)}') 일치=${winHash === patHash}`);
    }
  }
}

console.log("\n=== 2. 문제 예시 검증 ===");
console.log("search('banana','ana') =", rh1.search("banana", "ana"), "expect [1,3]");
console.log("search('hello','xyz') =", rh1.search("hello", "xyz"), "expect []");
console.log("search('aaaa','aa') =", rh1.search("aaaa", "aa"), "expect [0,1,2]");
console.log("hash('hello') repeat:", rh1.hash("hello"), rh1.hash("hello"));

console.log("\n=== 3. 엣지 케이스 ===");
console.log("search('abc','') =", rh1.search("abc", ""), "expect [] (빈 패턴 허용)");
console.log("search('ab','abc') =", rh1.search("ab", "abc"), "expect [] (m > n)");
console.log("search('a','a') =", rh1.search("a", "a"), "expect [0]");
console.log("search('','') =", rh1.search("", ""), "expect []");

console.log("\n=== 4. D6 함정 트레이스: +mod 정규화 생략 시 실제로 뭐가 깨지는가 ===");
console.log("(m=2처럼 작은 패턴은 highPow가 작아 우연히 안 터진다 — m=20으로 재현)");
{
  const base = 31, mod = 1_000_000_007;
  const m = 20;
  const text = "a".repeat(25);
  const pattern = "a".repeat(20);
  let highPow = 1;
  for (let i = 1; i < m; i++) highPow = (highPow * base) % mod;
  console.log("highPow (base^19 mod p) =", highPow);

  const patHash = rh1.hash(pattern);
  let winHash = rh1.hash(text.slice(0, m));
  console.log(`i=0: winHash=${winHash} patHash=${patHash} 일치=${winHash === patHash}`);

  for (let i = 0; i <= text.length - m; i++) {
    if (i < text.length - m) {
      const leftCode = text.charCodeAt(i);
      const rightCode = text.charCodeAt(i + m);
      const buggyStep = (winHash - leftCode * highPow) % mod; // +mod 생략
      const buggyWin = (buggyStep * base + rightCode) % mod;
      const correctStep = ((winHash - leftCode * highPow) % mod + mod) % mod;
      const correctWin = (correctStep * base + rightCode) % mod;
      console.log(
        `i=${i}->${i + 1}: buggyWin=${buggyWin} correctWin=${correctWin} patHash=${patHash}  buggyEq=${buggyWin === patHash}  correctEq=${correctWin === patHash}`,
      );
      winHash = correctWin;
    }
  }
}

console.log("\n=== 5. 코드 진화 사다리 교차검증 (brute force vs recompute vs rolling) ===");
const testCases: [string, string][] = [
  ["ababab", "ab"],
  ["banana", "ana"],
  ["hello", "xyz"],
  ["aaaa", "aa"],
  ["mississippi", "issi"],
  ["a".repeat(50), "aaa"],
];
for (const [text, pattern] of testCases) {
  const a = bruteForceSearch(text, pattern);
  const b = recomputeHashSearch(text, pattern);
  const c = rh1.search(text, pattern);
  const ok = JSON.stringify(a) === JSON.stringify(b) && JSON.stringify(b) === JSON.stringify(c);
  console.log(`text='${text.length > 20 ? text.slice(0, 20) + "..." : text}' pattern='${pattern}' brute=${JSON.stringify(a)} recompute=${JSON.stringify(b)} rolling=${JSON.stringify(c)} 일치=${ok}`);
  if (!ok) throw new Error("교차검증 불일치!");
}

console.log("\n=== 6. 무작위 교차검증 (100회) ===");
function randStr(len: number, alphabet: string): string {
  let s = "";
  for (let i = 0; i < len; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}
let allOk = true;
for (let trial = 0; trial < 100; trial++) {
  const alphabet = "ab"; // 작은 알파벳 → 충돌/반복 패턴 유발
  const text = randStr(1 + Math.floor(Math.random() * 30), alphabet);
  const pattern = randStr(1 + Math.floor(Math.random() * 5), alphabet);
  const expected = bruteForceSearch(text, pattern);
  const actual = rh1.search(text, pattern);
  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    allOk = false;
    console.log(`불일치! text='${text}' pattern='${pattern}' expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`);
  }
}
console.log("무작위 100회 전부 일치:", allOk);
if (!allOk) throw new Error("무작위 교차검증 실패");

console.log("\n=== 검증 완료 ===");
