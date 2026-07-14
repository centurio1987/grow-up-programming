// E3 자기검증용 스크래치: 가이드 본문에 실을 코드를 그대로 옮겨 실행 검증한다.
// 이 파일은 가이드 자체의 oracle이다 (sibling radixSort.ts는 학습자 실습 공간, 채점 대상 아님).

// ---------------------------------------------------------------------------
// 0. 시뮬레이션 도입용 축소 데모 (BASE=10, 2자리) — 구 가이드 sim과 동일 입력 재검증
// ---------------------------------------------------------------------------
function digitOfDemo(x: number, pass: number, base: number): number {
  return Math.floor(x / base ** pass) % base;
}
function countingSortByDigitDemo(input: number[], pass: number, base: number): number[] {
  const n = input.length;
  const count = new Array(base).fill(0);
  for (const x of input) count[digitOfDemo(x, pass, base)]++;
  for (let i = 1; i < base; i++) count[i] += count[i - 1];
  const output = new Array(n);
  for (let i = n - 1; i >= 0; i--) {
    const d = digitOfDemo(input[i], pass, base);
    count[d]--;
    output[count[d]] = input[i];
  }
  return output;
}

const demoInput = [170, 45, 75, 90, 2, 24];
console.log("=== 데모 (BASE=10) ===");
console.log("입력:", demoInput);
const afterDigits0 = demoInput.map((x) => digitOfDemo(x, 0, 10));
console.log("각 원소의 1의 자리:", afterDigits0);
const afterPass0 = countingSortByDigitDemo(demoInput, 0, 10);
console.log("패스0 결과:", afterPass0);
const afterDigits1 = afterPass0.map((x) => digitOfDemo(x, 1, 10));
console.log("각 원소의 10의 자리:", afterDigits1);
const afterPass1 = countingSortByDigitDemo(afterPass0, 1, 10);
console.log("패스1 결과(최종):", afterPass1);

// ---------------------------------------------------------------------------
// 1. 기본 구현 (아이디어를 코드로 옮기기) — division 기반 자릿수 추출
// ---------------------------------------------------------------------------
const BASE = 256; // k = 2^8
const DIGITS = 4; // d = 4 패스 (32비트 / 8비트)

function digitOf(x: number, pass: number, base: number): number {
  return Math.floor(x / base ** pass) % base;
}

function countingSortByDigit(input: number[], pass: number, base: number): number[] {
  const n = input.length;
  const count = new Array(base).fill(0);

  for (const x of input) {
    count[digitOf(x, pass, base)]++;
  }
  for (let i = 1; i < base; i++) {
    count[i] += count[i - 1];
  }

  const output = new Array(n);
  for (let i = n - 1; i >= 0; i--) {
    const d = digitOf(input[i], pass, base);
    count[d]--;
    output[count[d]] = input[i];
  }
  return output;
}

function radixSortBasic(A: number[]): number[] {
  let B = A.slice();
  for (let pass = 0; pass < DIGITS; pass++) {
    B = countingSortByDigit(B, pass, BASE);
  }
  return B;
}

// ---------------------------------------------------------------------------
// 2. 최적화 구현 — 비트 연산 + 버퍼 재사용(ping-pong)
// ---------------------------------------------------------------------------
function radixSort(A: number[]): number[] {
  const n = A.length;
  if (n === 0) return [];

  const BASE = 256;
  const DIGITS = 4;
  const MASK = BASE - 1; // 0xFF

  let src = Uint32Array.from(A);
  let dst = new Uint32Array(n);
  const count = new Uint32Array(BASE);

  for (let pass = 0; pass < DIGITS; pass++) {
    const shift = pass * 8; // 패스마다 한 번만 계산
    count.fill(0); // 버퍼 재사용, 재할당 없음

    for (let i = 0; i < n; i++) {
      count[(src[i]! >>> shift) & MASK]++;
    }
    for (let v = 1; v < BASE; v++) {
      count[v] += count[v - 1]!;
    }
    for (let i = n - 1; i >= 0; i--) {
      const d = (src[i]! >>> shift) & MASK;
      count[d]--;
      dst[count[d]!] = src[i]!;
    }

    [src, dst] = [dst, src]; // ping-pong 버퍼 교체 (복사 없이 참조만 바꿈)
  }

  return Array.from(src);
}

// ---------------------------------------------------------------------------
// 3. 검증
// ---------------------------------------------------------------------------
console.log("\n=== 실제 구현 검증 ===");

function assertEqual(label: string, actual: number[], expected: number[]) {
  const ok = actual.length === expected.length && actual.every((v, i) => v === expected[i]);
  console.log(`${ok ? "OK  " : "FAIL"} ${label}: actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`);
  if (!ok) process.exitCode = 1;
}

// 대표 예시
assertEqual(
  "기본구현 대표",
  radixSortBasic([170, 45, 75, 90, 802, 24, 2, 66]),
  [2, 24, 45, 66, 75, 90, 170, 802],
);
assertEqual(
  "최적화 대표",
  radixSort([170, 45, 75, 90, 802, 24, 2, 66]),
  [2, 24, 45, 66, 75, 90, 170, 802],
);
assertEqual("역순", radixSort([5, 4, 3, 2, 1]), [1, 2, 3, 4, 5]);

// 엣지 케이스
assertEqual("빈 배열", radixSort([]), []);
assertEqual("단일 원소", radixSort([12345]), [12345]);
assertEqual("모두 0", radixSort([0, 0, 0]), [0, 0, 0]);
assertEqual("모두 동일", radixSort([7, 7, 7]), [7, 7, 7]);
assertEqual(
  "최댓값 포함",
  radixSort([1_000_000_000, 0, 999_999_999, 1]),
  [0, 1, 999_999_999, 1_000_000_000],
);
assertEqual("0 포함 다수", radixSort([0, 10, 0, 1]), [0, 0, 1, 10]);
assertEqual("이미 정렬", radixSort([1, 2, 3]), [1, 2, 3]);

// 원본 불변 확인
const original = [3, 1, 2];
const sortedCopy = radixSort(original);
console.log(
  `원본 불변: original=${JSON.stringify(original)} (기대 [3,1,2] 그대로), sorted=${JSON.stringify(sortedCopy)}`,
);
if (JSON.stringify(original) !== JSON.stringify([3, 1, 2])) process.exitCode = 1;

// 무작위 교차 검증 (기본구현 vs 최적화 vs Array.sort 기준)
console.log("\n=== 무작위 교차 검증 (50회) ===");
let randFail = 0;
for (let t = 0; t < 50; t++) {
  const len = Math.floor(Math.random() * 50);
  const arr = Array.from({ length: len }, () => Math.floor(Math.random() * 1_000_000_001));
  const expected = [...arr].sort((a, b) => a - b);
  const r1 = radixSortBasic(arr);
  const r2 = radixSort(arr);
  const ok1 = JSON.stringify(r1) === JSON.stringify(expected);
  const ok2 = JSON.stringify(r2) === JSON.stringify(expected);
  if (!ok1 || !ok2) {
    randFail++;
    console.log(`FAIL trial ${t}: arr=${JSON.stringify(arr)}`);
  }
}
console.log(`무작위 검증 실패 수: ${randFail} / 50`);
if (randFail > 0) process.exitCode = 1;

// ---------------------------------------------------------------------------
// 4. 3.1 절(수식과 그림)에 쓸 자릿수 추출 예시 수치 — x=1,000,000,000
// ---------------------------------------------------------------------------
console.log("\n=== 자릿수 추출 예시 (x=1,000,000,000) ===");
const xExample = 1_000_000_000;
for (let pass = 0; pass < 4; pass++) {
  const shift = pass * 8;
  const viaShift = (xExample >>> shift) & 0xff;
  const viaDiv = Math.floor(xExample / 256 ** pass) % 256;
  console.log(`pass=${pass} shift=${shift}: shift방식=${viaShift} div방식=${viaDiv} 일치=${viaShift === viaDiv}`);
}
console.log("2^30 =", 2 ** 30, " / 10^9 < 2^30 ?", xExample < 2 ** 30);

// 5. >> vs >>> 차이를 보여줄 값 (2^31 이상에서 부호 반전) — 헷갈리기 쉬운 포인트 근거
console.log("\n=== >> vs >>> 차이 시연 (경계값, 이 문제 제약 밖) ===");
const big = 2 ** 31; // 이 문제의 A[i] <= 10^9 범위 밖 값 — >> 위험성만 시연
console.log(`big=${big}, big>>0 = ${big >> 0} (부호있는 32비트로 해석되어 음수), big>>>0 = ${big >>> 0} (부호없는 그대로)`);
