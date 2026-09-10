/**
 * `purpose.alt`(경쟁 설계와의 대조) 의 수치를 내는 하네스 — L13.
 *
 *   bun run ../../../../tools/bench-alt.ts findAllOccurrences-guide.alt.ts
 *
 * **경쟁 설계는 호스풀 방식(Boyer–Moore–Horspool)이다.** 같은 목표(텍스트에서 패턴이
 * 등장하는 모든 시작 자리를 찾는 것)를 노리되, 정렬 자리를 **오른쪽 끝부터** 대조하고
 * 어긋나면 「그 자리의 텍스트 글자가 패턴 안에서 마지막으로 나온 곳」만큼 정렬을 옮긴다.
 *
 * **입력을 결과에 맞춰 고르지 않는다**(L20). 텍스트와 패턴을 만드는 규칙을 하나로 고정하고
 * **알파벳 크기 `sigma` 하나만** 바꾼다 — 뒤집히는 자리를 그 축에서 찾는 것이 이 대조의
 * 전부다. 전개 입력(열두 글자)을 그대로 쓰지 않은 이유는 호스풀의 건너뛰기가 패턴 길이
 * 여덟을 넘지 못해 열두 글자에서는 두 설계의 계수가 상수에 묻히기 때문이다.
 */

/** 문제의 문자 집합. 호스풀의 건너뛰기 표가 이 칸 수만큼 잡힌다. */
const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

/** 텍스트 길이. 제약의 최댓값이다. */
const TEXT_LENGTH = 100_000;

/** 패턴 길이. */
const PATTERN_LENGTH = 8;

/** 패턴을 잘라 내는 자리. */
const PATTERN_AT = 30_000;

/** 텍스트를 만드는 생성식. `sigma` 는 실제로 쓰는 글자의 가짓수다. */
function makeText(sigma: number): string {
  let out = "";
  for (let i = 0; i < TEXT_LENGTH; i++) out += ALPHABET[(i * 7919) % sigma];
  return out;
}

/** 패턴은 같은 생성식에서 `PATTERN_AT` 자리부터 잘라 낸 여덟 글자다. */
function makePattern(sigma: number): string {
  let out = "";
  for (let j = 0; j < PATTERN_LENGTH; j++) {
    out += ALPHABET[((PATTERN_AT + j) * 7919) % sigma];
  }
  return out;
}

/**
 * 이 가이드가 가르치는 절차에 계수만 덧붙인 것. **실패 함수를 만들 때의 견주기도 센다** —
 * 호스풀은 표를 만들 때 글자를 견주지 않으므로, 전처리를 빼면 이쪽만 유리해진다.
 */
function byFailureFunction(
  text: string,
  pattern: string,
): {
  found: number[];
  comparisons: number;
  cells: number;
} {
  const n = text.length;
  const m = pattern.length;
  const found: number[] = [];
  let comparisons = 0;
  if (m === 0 || n < m) return { found, comparisons, cells: 0 };

  const fail = new Array<number>(m).fill(0);
  let k = 0;
  for (let i = 1; i < m; i++) {
    while (k > 0) {
      comparisons++;
      if (pattern[i] === pattern[k]) break;
      k = fail[k - 1] as number;
    }
    comparisons++;
    if (pattern[i] === pattern[k]) k++;
    fail[i] = k;
  }

  let j = 0;
  for (let i = 0; i < n; i++) {
    while (j > 0) {
      comparisons++;
      if (text[i] === pattern[j]) break;
      j = fail[j - 1] as number;
    }
    comparisons++;
    if (text[i] === pattern[j]) j++;
    if (j === m) {
      found.push(i - m + 1);
      j = fail[j - 1] as number;
    }
  }
  return { found, comparisons, cells: m };
}

/**
 * 호스풀 방식. 정렬 자리의 **오른쪽 끝부터** 왼쪽으로 대조하고, 어긋나면 정렬의 마지막
 * 글자를 표에서 찾아 그만큼 옮긴다. 표는 알파벳 칸 수만큼 잡는다.
 */
function byHorspool(
  text: string,
  pattern: string,
): {
  found: number[];
  comparisons: number;
  cells: number;
} {
  const n = text.length;
  const m = pattern.length;
  const found: number[] = [];
  let comparisons = 0;
  if (m === 0 || n < m) return { found, comparisons, cells: 0 };

  const shift = new Array<number>(ALPHABET.length).fill(m);
  for (let k = 0; k < m - 1; k++) {
    shift[pattern.charCodeAt(k) - 97] = m - 1 - k;
  }

  let i = 0;
  while (i + m <= n) {
    let k = m - 1;
    while (k >= 0) {
      comparisons++;
      if (text[i + k] !== pattern[k]) break;
      k--;
    }
    if (k < 0) found.push(i);
    i += shift[text.charCodeAt(i + m - 1) - 97] as number;
  }
  return { found, comparisons, cells: ALPHABET.length };
}

/** 두 설계가 같은 답을 내는지 확인한다. 다르면 대조가 아니라 다른 문제를 푼 것이다. */
function measure(sigma: number): {
  mine: ReturnType<typeof byFailureFunction>;
  theirs: ReturnType<typeof byHorspool>;
} {
  const text = makeText(sigma);
  const pattern = makePattern(sigma);
  const mine = byFailureFunction(text, pattern);
  const theirs = byHorspool(text, pattern);
  if (mine.found.join(",") !== theirs.found.join(",")) {
    throw new Error(`두 설계의 답이 다르다 — sigma=${sigma}`);
  }
  return { mine, theirs };
}

const S1 = measure(1);
const S3 = measure(3);
const S4 = measure(4);
const S26 = measure(26);

export const cases = {
  "실패 함수 방식": () => ({
    "알파벳 1 견주기": S1.mine.comparisons,
    "알파벳 3 견주기": S3.mine.comparisons,
    "알파벳 4 견주기": S4.mine.comparisons,
    "알파벳 26 견주기": S26.mine.comparisons,
    "저장 칸": S26.mine.cells,
  }),
  "호스풀 방식": () => ({
    "알파벳 1 견주기": S1.theirs.comparisons,
    "알파벳 3 견주기": S3.theirs.comparisons,
    "알파벳 4 견주기": S4.theirs.comparisons,
    "알파벳 26 견주기": S26.theirs.comparisons,
    "저장 칸": S26.theirs.cells,
  }),
};
