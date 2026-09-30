/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/dp/expectedValueDp/expectedValueDp-guide.md
 *
 * **이 편의 답은 부동소수라 「같다」를 글자 대조로 정할 수 없다.** 그래서 판정하는 값을 전부
 * 유리수나 정수로 내린다.
 *
 * - 정확한 답은 `BigInt` 로 시퀀스 수를 세어 `w / 6^N` 분수로 든다(`정확한_행`). 정수 위에서는
 *   창의 합을 이어 써도 뺄셈이 정확하므로 이 사본은 반올림이 아예 없다.
 * - 배정밀도 값도 비트에서 정확한 분수로 바꾼다(`.alt.ts` 의 `분수로`). 부동소수는 언제나
 *   `분자 / 2^k` 다.
 * - 상대 오차는 두 분수의 정수 나눗셈 한 번으로 낸다(`상대_오차`). 화면에 적을 때만 `10` 의
 *   거듭제곱 꼴로 줄인다.
 * - 표에 싣는 실수는 **자릿수를 고정해** 적는다(`유효`·`짧게`). 고정하지 않으면 행마다 폭이
 *   달라져 열이 어긋난다.
 *
 * **변이가 아무것도 안 바꾸는지 검사하는 자리는 중화 실행을 비켜 간다.** `check-proof` 가 이
 * 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 *
 * **세는 사본이 셋 있다**(`걸음마다`·`시퀀스로`·`행_합`). 정본은 걸음마다의 상태도, 시퀀스를
 * 전부 만들었을 때의 횟수도, 행마다의 확률 합도 내보내지 않는다. **답이 맞는지는 사본이 아니라
 * 정본이 진다** — 아래 표에서 옳은 쪽 칸은 전부 정본이나 정본에서 기계로 만든 변이가 낸 값이다.
 *
 * 칸 하나를 채운 자리의 기록과 칸 값을 분수로 되돌리는 일은 그림 사이드카(`.fig.tsx`)의 `trace`·
 * `frac` 을 부른다 — 정본 소스에서 기계로 만든 계측 사본이고, 그림과 표가 같은 기록을 쓴다.
 *
 * 경쟁 설계 대조 표의 값은 `.alt.ts` 를 **불러서** 얻는다 — 같은 값을 두 파일에 적으면
 * 한쪽만 고쳐질 때 표가 조용히 거짓이 된다.
 */

import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 을를 } from "../../../../tools/josa.ts";
import {
  cases,
  분수로,
  상대_오차,
  오차_눈금,
  정확한_행,
  채점_구간,
  한_자리,
} from "./expectedValueDp-guide.alt.ts";
import {
  count,
  frac,
  sumOnly,
  trace,
  WALK_K,
  WALK_N,
  walkSteps,
} from "./expectedValueDp-guide.fig.tsx";
import { expectedValueDp } from "./expectedValueDp-guide.ref.ts";

const REF = new URL("./expectedValueDp-guide.ref.ts", import.meta.url).pathname;

type Ref = { expectedValueDp: (N: number, K: number) => number };

const FACES = 6;

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

const comma = (n: number | bigint): string => n.toLocaleString("en-US");

function table(rows: string[][], alignRight: number[] = []): string[] {
  const cols = rows[0]?.length ?? 0;
  const widths: number[] = [];
  for (let c = 0; c < cols; c++) {
    widths.push(Math.max(...rows.map((r) => width(r[c] ?? ""))));
  }
  return rows.map((r) =>
    r
      .map((cell, c) =>
        alignRight.includes(c)
          ? padLeft(cell, widths[c] ?? 0)
          : pad(cell, widths[c] ?? 0),
      )
      .join("   ")
      .replace(/\s+$/, ""),
  );
}

/** 자릿수를 고정한 실수 표기. 표의 열 폭이 행마다 흔들리지 않게 한다. */
const 유효 = (v: number, digits = 6): string =>
  v === 0 ? "0" : v.toExponential(digits);

/** 배정밀도가 실제로 든 값 전부. 17 자리면 어떤 배정밀도도 되살릴 수 있다. */
const 짧게 = (v: number): string => (v === 0 ? "0" : v.toPrecision(17));

/**
 * 분수 `p/q` 를 `m.mmmmmme±e` 꼴로. **자릿수를 고정하고 반올림한다** — 잘라 쓰면 같은 값을
 * 배정밀도로 적은 것과 마지막 자리가 갈려 표가 어긋나 보인다.
 */
function 분수를_지수로(p: bigint, q: bigint, sig = 6): string {
  if (p === 0n) return "0";
  const shift = BigInt(q.toString().length - p.toString().length + sig + 4);
  const scaled = shift >= 0n ? (p * 10n ** shift) / q : p / (q * 10n ** -shift);
  const text = scaled.toString();
  const e = text.length - Number(shift) - 1;
  const keep = BigInt(text.slice(0, sig + 1));
  const next = Number(text[sig + 1] ?? "0");
  const rounded = (next >= 5 ? keep + 1n : keep).toString();
  const carried = rounded.length > sig + 1;
  const head = carried ? rounded.slice(0, 1) : (rounded[0] ?? "0");
  const rest = carried ? rounded.slice(1, sig + 1) : rounded.slice(1, sig + 1);
  const exp = carried ? e + 1 : e;
  return `${head}.${rest}e${exp >= 0 ? "+" : "-"}${Math.abs(exp)}`;
}

/**
 * 개수를 「초당 1억 개를 세면 얼마나 걸리는가」로. **정수 위에서 판정하고** 화면에 적을 때만
 * 자릿수를 고정한 지수 표기로 줄인다.
 */
const 초당 = 100_000_000n;
const 해마다 = 초당 * 86_400n * 365n;
function 걸리는_시간(count: bigint): string {
  if (count < 초당 / 1_000n) return `${분수를_지수로(count, 초당, 2)}초`;
  if (count < 60n * 초당) {
    return `${(Number((count * 1_000n) / 초당) / 1_000).toFixed(3)}초`;
  }
  if (count < 해마다) return `${분수를_지수로(count, 초당 * 86_400n, 2)}일`;
  if (count < 1_000n * 해마다) {
    return `${(Number((count * 100n) / 해마다) / 100).toFixed(2)}년`;
  }
  return `${분수를_지수로(count, 해마다, 2)}년`;
}

/* ────────────────────── 공통 입력과 도우미 ────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력. 던지는 횟수가 둘이라 행이 둘 만들어지고, 임계값이 10 이라
 * 마지막 행의 꼬리 세 칸을 더하는 자리가 값으로 확인된다.
 */

/** 변이 표에 나란히 놓는 네 입력. */
const FOUR: [string, number, number][] = [
  [`전개가 쓰는 N=${WALK_N}, K=${WALK_K}`, WALK_N, WALK_K],
  ["합이 반드시 K 이상인 N=4, K=4", 4, 4],
  ["꼬리가 긴 N=3, K=10", 3, 10],
  ["절대 K 이상이 안 되는 N=2, K=13", 2, 13],
];

const gcdBig = (a: bigint, b: bigint): bigint =>
  b === 0n ? a : gcdBig(b, a % b);

/** `w / 6^n` 을 기약 분수 문자열로. 작은 입력에만 쓴다. */
function 기약(w: bigint, n: number): string {
  const q = 6n ** BigInt(n);
  const g = gcdBig(w, q) === 0n ? 1n : gcdBig(w, q);
  return `${w / g}/${q / g}`;
}

/* ────────────────────────── 세는 사본 ────────────────────────── */

/** 정본과 같은 절차에 행마다의 확률 합과 칸 값을 덧붙인 사본. */
function 걸음마다(N: number): { 행: Float64Array[]; 합: number[] } {
  const maxSum = FACES * N;
  let prev = new Float64Array(maxSum + 1);
  prev[0] = 1;
  const 행: Float64Array[] = [prev];
  const 합: number[] = [1];
  for (let i = 1; i <= N; i++) {
    const curr = new Float64Array(maxSum + 1);
    for (let s = 1; s <= maxSum; s++) {
      let sum = 0;
      const from = s - FACES < 0 ? 0 : s - FACES;
      for (let u = from; u < s; u++) sum += prev[u] as number;
      curr[s] = sum / FACES;
    }
    prev = curr;
    행.push(prev);
    let total = 0;
    for (let s = maxSum; s >= 0; s--) total += prev[s] as number;
    합.push(total);
  }
  return { 행, 합 };
}

/** 시퀀스를 전부 만들어 세는 사본. 작은 `N` 에만 쓴다. */
function 시퀀스로(N: number, K: number): { 만든_개수: number; 답: number } {
  let made = 0;
  let hit = 0;
  const walk = (i: number, sum: number): void => {
    if (i === N) {
      made++;
      if (sum >= K) hit++;
      return;
    }
    for (let d = 1; d <= FACES; d++) walk(i + 1, sum + d);
  };
  walk(0, 0);
  return { 만든_개수: made, 답: hit / made };
}

/** 표를 채우는 동안의 실수 덧셈 횟수. 면 수를 바꿔 가며 잰다. */
function 덧셈_수(N: number, faces: number): number {
  let ops = 0;
  const maxSum = faces * N;
  for (let i = 1; i <= N; i++) {
    for (let s = 1; s <= maxSum; s++) ops += Math.min(faces, s);
  }
  return ops;
}

/**
 * 「던진 횟수」를 상태에서 지운 판 — 배열 한 장을 제자리에서 갱신한다. **변이 `제자리판` 이
 * 만드는 절차와 같다**(아래 자기검사가 답으로 그것을 확인한다). 정본은 행마다의 값도 확률
 * 합도 내보내지 않아 이 사본이 필요하다.
 */
function 합만_상태로_행(N: number): Float64Array {
  const maxSum = FACES * N;
  const p = new Float64Array(maxSum + 1);
  p[0] = 1;
  for (let i = 1; i <= N; i++) {
    for (let s = 1; s <= maxSum; s++) {
      let sum = 0;
      const from = s - FACES < 0 ? 0 : s - FACES;
      for (let u = from; u < s; u++) sum += p[u] as number;
      p[s] = sum / FACES;
    }
  }
  return p;
}

function 합만_상태로(N: number, K: number): { 답: number; 확률_합: number } {
  const maxSum = FACES * N;
  const p = 합만_상태로_행(N);
  let answer = 0;
  for (let s = maxSum; s >= K; s--) answer += p[s] as number;
  let total = 0;
  for (let s = 0; s <= maxSum; s++) total += p[s] as number;
  return { 답: answer, 확률_합: total };
}

/** 이 절차가 하는 기본 연산 수 — 표를 채우는 덧셈 · 나눗셈 · 꼬리 덧셈. */
function 연산_수(
  N: number,
  K: number,
): { 덧셈: number; 나눗셈: number; 꼬리: number; 합: number } {
  const maxSum = FACES * N;
  if (K <= N || K > maxSum) return { 덧셈: 0, 나눗셈: 0, 꼬리: 0, 합: 0 };
  let 덧셈 = 0;
  let 나눗셈 = 0;
  for (let i = 1; i <= N; i++) {
    for (let s = 1; s <= maxSum; s++) {
      덧셈 += Math.min(FACES, s);
      나눗셈++;
    }
  }
  const 꼬리 = maxSum - K + 1;
  return { 덧셈, 나눗셈, 꼬리, 합: 덧셈 + 나눗셈 + 꼬리 };
}

/* ────────────────────── 정확한 값 — 유리수 ────────────────────── */

const 큰_행 = 정확한_행(1000);
const 큰_분모 = 6n ** 1000n;
const 큰_꼬리: bigint[] = new Array<bigint>(6002).fill(0n);
for (let s = 6000; s >= 0; s--) {
  큰_꼬리[s] = (큰_꼬리[s + 1] as bigint) + (큰_행[s] as bigint);
}

/** 이항계수. 닫힌 형태 검산에만 쓴다. */
const 이항_기억 = new Map<string, bigint>();
function 이항(n: bigint, k: bigint): bigint {
  if (k < 0n || k > n) return 0n;
  const key = `${n}:${k}`;
  const hit = 이항_기억.get(key);
  if (hit !== undefined) return hit;
  let r = 1n;
  const kk = k > n - k ? n - k : k;
  for (let i = 0n; i < kk; i++) r = (r * (n - i)) / (i + 1n);
  이항_기억.set(key, r);
  return r;
}

/** 포함배제 닫힌 형태 — 합이 `s` 인 시퀀스 수. */
function 닫힌_형태(N: number, s: number): bigint {
  let total = 0n;
  const n = BigInt(N);
  for (let j = 0; j <= Math.floor((s - N) / FACES); j++) {
    const term = 이항(n, BigInt(j)) * 이항(BigInt(s - FACES * j - 1), n - 1n);
    total += j % 2 === 0 ? term : -term;
  }
  return total;
}

/* ────────────────────────── 변이 ────────────────────────── */

/** 행을 새로 잡지 않고 직전 행에 그대로 덮어쓰는 판. */
const 제자리판 = await loadMutant<Ref>(REF, {
  swap: [
    /^ {4}const curr = new Float64Array\(maxSum \+ 1\);$/,
    "    const curr = prev;",
  ],
});

/** 합이 반드시 임계값 이상인 자리를 걸러내는 줄을 지운 판. */
const 경계없는판 = await loadMutant<Ref>(REF, {
  drop: /^ {2}if \(K <= N\) return 1;$/,
});

/** 더하는 칸을 여섯에서 다섯으로 줄인 판. */
const 다섯칸판 = await loadMutant<Ref>(REF, {
  swap: [
    /^ {6}const from = s - FACES < 0 \? 0 : s - FACES;$/,
    "      const from = s - FACES + 1 < 0 ? 0 : s - FACES + 1;",
  ],
});

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두 함수가
 * **같은 객체**다. 중화 상태에서 아래 자기검사를 실행하면 언제나 던지게 되고, 그러면
 * `check-proof` 의 중화 대조가 이 편에서는 한 번도 실행되지 않는다.
 */
const 중화됨 = 제자리판.expectedValueDp === expectedValueDp;

const 갈리는_변이: {
  label: string;
  impl: Ref;
  cases: [number, number][];
}[] = [
  { label: "제자리로 덮어쓰는 판", impl: 제자리판, cases: [[2, 10]] },
  { label: "경계 판정을 지운 판", impl: 경계없는판, cases: [[4, 4]] },
  { label: "다섯 칸만 더하는 판", impl: 다섯칸판, cases: [[2, 10]] },
];

if (!중화됨) {
  for (const { label, impl, cases: 입력 } of 갈리는_변이) {
    if (
      입력.every(
        ([N, K]) => expectedValueDp(N, K) === impl.expectedValueDp(N, K),
      )
    ) {
      throw new Error(`${label} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
    }
  }
  // 손으로 쓴 사본이 변이와 같은 절차인지 답으로 확인한다. 어긋나면 아래 표가 거짓이 된다.
  for (const [N, K] of [
    [1, 4],
    [2, 10],
    [3, 10],
  ] as [number, number][]) {
    if (sumOnly(N, K) !== 합만_상태로(N, K).답) {
      throw new Error(
        `그림 사이드카의 「합만」 판이 이 사본과 다르다 — N=${N}, K=${K}`,
      );
    }
    if (합만_상태로(N, K).답 !== 제자리판.expectedValueDp(N, K)) {
      throw new Error(
        `제자리 사본이 변이와 다른 답을 냈다 — N=${N}, K=${K} 에서 갈린다`,
      );
    }
  }
}

/** 변이를 건 그 줄을 이 입력이 몇 번 지나가는가. 실행으로 센다. */
function 지나간_횟수(
  N: number,
  K: number,
): { 행_잡기: number; 경계_반환: number; 창_왼끝: number } {
  const maxSum = FACES * N;
  if (K <= N) return { 행_잡기: 0, 경계_반환: 1, 창_왼끝: 0 };
  if (K > maxSum) return { 행_잡기: 0, 경계_반환: 0, 창_왼끝: 0 };
  return { 행_잡기: N, 경계_반환: 0, 창_왼끝: N * maxSum };
}

type 자리 = "행_잡기" | "경계_반환" | "창_왼끝";

/** 변이 하나를 입력 여럿에 적용해 정본과 나란히 놓는다. */
function 변이표(
  label: string,
  impl: Ref,
  site: 자리,
  siteLabel: string,
  입력: [string, number, number][],
): string {
  const rows: string[][] = [["입력", "정본", label, siteLabel, "판정"]];
  for (const [name, N, K] of 입력) {
    const ok = expectedValueDp(N, K);
    const bad = impl.expectedValueDp(N, K);
    rows.push([
      name,
      짧게(ok),
      짧게(bad),
      comma(지나간_횟수(N, K)[site]),
      ok === bad ? "같다" : "어긋난다",
    ]);
  }
  return table(rows, [3]).join("\n");
}

/* ────────────────────── 새로 싣는 블록의 도우미 ────────────────────── */

/** 마크다운 표. `right` 에 든 열만 오른쪽 정렬이다. */
function md(
  head: string[],
  rows: string[][],
  right: readonly number[] = [],
): string {
  const rule = head.map((_, c) => (right.includes(c) ? "---:" : "---"));
  const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
  return [line(head), line(rule), ...rows.map(line)].join("\n");
}

/** 표 아래에 실행이 낸 문장을 붙인다 — 본문은 이 블록을 `<!--/proof-->` 로 닫는다. */
const withNote = (tbl: string, note: string): string =>
  [tbl, "", note].join("\n");

/** 두 눈의 나열을 전부 만든다. `allow(a, b)` 가 거짓인 짝은 나오지 않는 짝이다. */
function 두_눈(allow: (a: number, b: number) => boolean): [number, number][] {
  const out: [number, number][] = [];
  for (let a = 1; a <= FACES; a++) {
    for (let b = 1; b <= FACES; b++) if (allow(a, b)) out.push([a, b]);
  }
  return out;
}

/** 칸에 확률이 아니라 **개수**를 적는 판 — 6 으로 나누지 않고 더하기만 한다. 설계 선택의 대조군이다. */
function 개수로(N: number, K: number): number {
  const maxSum = FACES * N;
  let prev = new Float64Array(maxSum + 1);
  prev[0] = 1;
  for (let i = 1; i <= N; i++) {
    const curr = new Float64Array(maxSum + 1);
    for (let s = 1; s <= maxSum; s++) {
      let sum = 0;
      const from = s - FACES < 0 ? 0 : s - FACES;
      for (let u = from; u < s; u++) sum += prev[u] as number;
      curr[s] = sum;
    }
    prev = curr;
  }
  let ways = 0;
  for (let s = maxSum; s >= K; s--) ways += prev[s] as number;
  return ways / FACES ** N;
}

/** `|d − p/q|` 를 실수로. 화면에 세 자리만 적으므로 배정밀도로 충분하다. */
function 절대_오차(d: number, p: bigint, q: bigint): number {
  const [dn, dd] = 분수로(d);
  let diff = dn * q - p * dd;
  if (diff < 0n) diff = -diff;
  return Number((diff * 10n ** 60n) / (dd * q)) / 1e60;
}

/** 제약 상한 `N = 1000` 의 마지막 줄 — 정본과 같은 절차를 값만 들고 한 번 돈다. 기록을 안 남긴다. */
function 마지막_줄(N: number): Float64Array {
  const maxSum = FACES * N;
  let prev = new Float64Array(maxSum + 1);
  prev[0] = 1;
  for (let i = 1; i <= N; i++) {
    const curr = new Float64Array(maxSum + 1);
    for (let s = 1; s <= maxSum; s++) {
      let sum = 0;
      const from = s - FACES < 0 ? 0 : s - FACES;
      for (let u = from; u < s; u++) sum += prev[u] as number;
      curr[s] = sum / FACES;
    }
    prev = curr;
  }
  return prev;
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** 시퀀스를 전부 만드는 방법의 규모. */
  "naive-scale": () => {
    const rows: string[][] = [
      ["던진 횟수 N", "시퀀스 수 6^N", "자릿수", "초당 1억 개를 세면"],
    ];
    for (const N of [3, 10, 20, 30, 100, 1000]) {
      const total = 6n ** BigInt(N);
      const text = total.toString();
      rows.push([
        comma(N),
        text.length <= 20
          ? comma(total)
          : `${text.slice(0, 6)}… (${comma(text.length)}자리)`,
        comma(text.length),
        걸리는_시간(total),
      ]);
    }
    return table(rows, [0, 1, 2, 3]).join("\n");
  },

  /** 순서를 버리면 시퀀스가 합으로 접힌다 — N=3. */
  "fold-by-sum": () => {
    const N = 3;
    const 행 = 정확한_행(N);
    const 분모 = 6 ** N;
    const rows: string[][] = [
      ["합 s", "그 합이 되는 시퀀스 수", `확률 (분모 ${comma(분모)})`],
    ];
    let total = 0n;
    for (let s = N; s <= FACES * N; s++) {
      const w = 행[s] as bigint;
      total += w;
      rows.push([comma(s), comma(w), `${w}/${분모}`]);
    }
    const 줄 = FACES * N - N + 1;
    const lines = table(rows, [0, 1, 2]);
    lines.push(
      `시퀀스 ${comma(total)} 개가 ${comma(줄)} 줄로 접혔다. 둘째 열을 다 더하면 다시 ${comma(total)} 이다`,
    );
    return lines.join("\n");
  },

  /** 같은 답을 두 방식으로 — N=5, K=20. */
  "cost-two-ways": () => {
    const N = 5;
    const K = 20;
    const 시퀀스 = 시퀀스로(N, K);
    const 분포 = expectedValueDp(N, K);
    const 정확 = 정확한_행(N);
    let ways = 0n;
    for (let s = K; s <= FACES * N; s++) ways += 정확[s] as bigint;
    const rows: string[][] = [
      ["방식", "만드는 것", "만든 개수", "실수 덧셈", "답"],
    ];
    rows.push([
      "시퀀스를 전부 만든다",
      "눈의 나열",
      comma(시퀀스.만든_개수),
      comma(시퀀스.만든_개수),
      짧게(시퀀스.답),
    ]);
    rows.push([
      "합 분포를 갱신한다",
      "줄 하나씩",
      comma(N * (FACES * N + 1)),
      comma(덧셈_수(N, FACES)),
      짧게(분포),
    ]);
    const lines = table(rows, [2, 3]);
    lines.push(
      `정확한 답은 ${기약(ways, N)} 이고 두 방식이 다 그 값을 낸다. 만드는 개수가 ${(시퀀스.만든_개수 / (N * (FACES * N + 1))).toFixed(1)} 배 갈린다`,
    );
    return lines.join("\n");
  },

  /** 무엇을 상태로 잡을 것인가 — 후보 넷. */
  "state-candidates": () => {
    const rows: string[][] = [
      ["상태로 잡은 것", "N=5 의 상태 수", "N=1000 의 상태 수", "답이 맞는가"],
    ];
    rows.push([
      "눈의 나열 전체",
      comma(6 ** 5),
      `6^1000 (${(6n ** 1000n).toString().length}자리)`,
      "맞다",
    ]);
    rows.push([
      "던진 횟수와 합",
      comma(5 * (FACES * 5 + 1)),
      comma(1000 * (FACES * 1000 + 1)),
      "맞다",
    ]);
    rows.push([
      "합만",
      comma(FACES * 5 + 1),
      comma(FACES * 1000 + 1),
      "틀린다",
    ]);
    rows.push([
      "던진 횟수와 합과 마지막 눈",
      comma(5 * (FACES * 5 + 1) * FACES),
      comma(1000 * (FACES * 1000 + 1) * FACES),
      "맞다",
    ]);
    return table(rows, [1, 2]).join("\n");
  },

  /** 「합만」 을 상태로 잡으면 무슨 값이 나오는가. */
  "state-sum-only": () => {
    const rows: string[][] = [
      ["입력", "정본", "던진 횟수를 지운 판", "그 판의 확률 합"],
    ];
    for (const [N, K] of [
      [1, 4],
      [2, 10],
      [2, 7],
      [3, 10],
    ] as [number, number][]) {
      const 지운 = 합만_상태로(N, K);
      rows.push([
        `N=${N}, K=${K}`,
        짧게(expectedValueDp(N, K)),
        짧게(지운.답),
        짧게(지운.확률_합),
      ]);
    }
    const lines = table(rows);
    lines.push(
      "넷째 열이 1 이어야 할 자리다. 확률 합이 1 을 넘으면 그 줄은 확률 분포가 아니다",
    );
    return lines.join("\n");
  },

  /** 면 수를 바꿔 가며 두 방식의 비용을 잰다 — N=5. */
  "face-sweep": () => {
    const N = 5;
    const rows: string[][] = [
      [
        "면 수 f",
        `시퀀스 수 f^${N}`,
        "DP 테이블의 칸 수",
        "실수 덧셈",
        "시퀀스 대 덧셈",
      ],
    ];
    for (const f of [2, 4, 6, 10, 20]) {
      const seq = f ** N;
      const ops = 덧셈_수(N, f);
      rows.push([
        comma(f),
        comma(seq),
        comma(N * (f * N + 1)),
        comma(ops),
        `${(seq / ops).toFixed(2)} 배`,
      ]);
    }
    return table(rows, [0, 1, 2, 3, 4]).join("\n");
  },

  /** 전개 입력의 마지막 행이 배정밀도로 실제로 든 값. */
  "walk-doubles": () => {
    const { 행 } = 걸음마다(WALK_N);
    const 정확 = 정확한_행(WALK_N);
    const 분모 = 6 ** WALK_N;
    const rows: string[][] = [
      ["s", "w[2][s]", "코드가 든 값", "w/36 을 배정밀도로 적은 값", "같은가"],
    ];
    let 갈린 = 0;
    for (let s = WALK_N; s <= FACES * WALK_N; s++) {
      const w = Number(정확[s] as bigint);
      const code = (행[WALK_N] as Float64Array)[s] as number;
      const ideal = w / 분모;
      if (code !== ideal) 갈린++;
      rows.push([
        comma(s),
        comma(w),
        짧게(code),
        짧게(ideal),
        code === ideal ? "같다" : "어긋난다",
      ]);
    }
    const lines = table(rows, [0, 1]);
    lines.push(
      `열한 칸 중 ${comma(갈린)} 칸이 마지막 자리에서 갈린다. 어느 칸도 상대 오차가 2^-52 를 넘지 않는다`,
    );
    return lines.join("\n");
  },

  /** 멈춤 — 행을 새로 잡지 않고 제자리에서 덮어쓰면. */
  "pause-inplace": () =>
    변이표(
      "제자리로 덮어쓰는 판",
      제자리판,
      "행_잡기",
      "바꾼 줄이 줄을 새로 잡은 횟수",
      FOUR,
    ),

  /** 그 판이 만든 마지막 행을 칸마다 정본과 견준다. */
  "pause-inplace-rows": () => {
    const { 행 } = 걸음마다(WALK_N);
    const 덮어쓴 = 합만_상태로_행(WALK_N);
    const rows: string[][] = [
      ["s", "정본의 p[2][s]", "덮어쓴 판의 값", "몇 배인가"],
    ];
    for (let s = 0; s <= FACES * WALK_N; s++) {
      const a = (행[WALK_N] as Float64Array)[s] as number;
      const b = 덮어쓴[s] as number;
      rows.push([
        comma(s),
        유효(a, 4),
        유효(b, 4),
        a === 0
          ? b === 0
            ? "둘 다 0"
            : "정본만 0"
          : `${(b / a).toFixed(2)} 배`,
      ]);
    }
    let 정본_합 = 0;
    let 덮어쓴_합 = 0;
    for (let s = FACES * WALK_N; s >= 0; s--) {
      정본_합 += (행[WALK_N] as Float64Array)[s] as number;
      덮어쓴_합 += 덮어쓴[s] as number;
    }
    const lines = table(rows, [0, 1, 2, 3]);
    lines.push(
      `확률 합이 정본 ${짧게(정본_합)} 대 덮어쓴 판 ${짧게(덮어쓴_합)} 다. 1 을 넘는 것이 값이 섞여 들어왔다는 증거다`,
    );
    return lines.join("\n");
  },

  /** 멈춤 — 합이 반드시 임계값 이상인 자리를 걸러내는 줄을 지우면. */
  "pause-guard": () =>
    변이표(
      "경계 판정을 지운 판",
      경계없는판,
      "경계_반환",
      "지운 줄이 반환을 일으킨 횟수",
      [...FOUR, ["지나갔는데 답이 같은 N=100, K=100", 100, 100]],
    ),

  /** 지나갔는데 답이 같은 행 — 그 판이 실제로 더한 값. */
  "pause-guard-steps": () => {
    const rows: string[][] = [
      ["입력", "더한 칸 수", "지운 판이 더해 얻은 값", "1 과의 차", "정본"],
    ];
    for (const N of [4, 100, 300, 1000]) {
      const v = 경계없는판.expectedValueDp(N, N);
      rows.push([
        `N=${N}, K=${N}`,
        comma(FACES * N + 1 - N),
        짧게(v),
        유효(v - 1, 3),
        짧게(expectedValueDp(N, N)),
      ]);
    }
    const lines = table(rows, [1, 3]);
    lines.push(
      "차가 0 인 줄은 N=100 하나다. 나머지 셋은 더한 값이 1 에 못 미치고 그 차가 던지는 횟수에 따라 갈린다",
    );
    return lines.join("\n");
  },

  /** 전체 코드를 여러 입력에 실행한 결과. */
  "walk-result": () => {
    const 입력: [string, number, number][] = [
      [`전개가 쓰는 N=${WALK_N}, K=${WALK_K}`, WALK_N, WALK_K],
      ["한 번 던져 4 이상인 N=1, K=4", 1, 4],
      ["임계값이 최솟값 이하인 N=4, K=4", 4, 4],
      ["임계값이 최댓값인 N=3, K=18", 3, 18],
      ["임계값이 최댓값을 넘는 N=2, K=13", 2, 13],
      ["임계값이 0 인 N=5, K=0", 5, 0],
      ["제약 상한 N=1000, K=3500", 1000, 3500],
    ];
    const rows: string[][] = [
      ["입력", "반환값", "0 이상 1 이하", "정확한 답과의 상대 오차"],
    ];
    for (const [name, N, K] of 입력) {
      const v = expectedValueDp(N, K);
      const 행 = N === 1000 ? 큰_행 : 정확한_행(N);
      const 분모 = N === 1000 ? 큰_분모 : 6n ** BigInt(N);
      let ways = 0n;
      for (let s = Math.max(K, 0); s <= FACES * N; s++) ways += 행[s] as bigint;
      rows.push([
        name,
        짧게(v),
        v >= 0 && v <= 1 ? "그렇다" : "아니다",
        ways === 0n
          ? "답이 0 이다"
          : 분수를_지수로(상대_오차(v, ways, 분모), 오차_눈금, 3),
      ]);
    }
    return table(rows).join("\n");
  },

  /**
   * 합성곱 — 한 번 던진 분포와 두 번 던진 분포를 합성곱하면 세 번 던진 분포가 나온다.
   * 한 걸음씩 이어 계산하는 것이 아니라 **묶음끼리 합쳐도 같다**는 것이 이 이름이 주는 것이다.
   */
  "related-convolution": () => {
    const { 행 } = 걸음마다(3);
    const 한_번 = 행[1] as Float64Array;
    const 두_번 = 행[2] as Float64Array;
    const 세_번 = 행[3] as Float64Array;
    const 합성곱 = new Float64Array(FACES * 3 + 1);
    for (let a = 0; a <= FACES * 3; a++) {
      for (let b = 0; a + b <= FACES * 3; b++) {
        합성곱[a + b] =
          (합성곱[a + b] as number) +
          (한_번[a] as number) * (두_번[b] as number);
      }
    }
    const rows: string[][] = [
      [
        "s",
        "한 번 던진 분포",
        "두 번 던진 분포",
        "둘의 합성곱",
        "DP 테이블의 i=3 줄",
        "차",
      ],
    ];
    let 최대_차 = 0;
    for (let s = 0; s <= FACES * 3; s++) {
      const c = 합성곱[s] as number;
      const t = 세_번[s] as number;
      최대_차 = Math.max(최대_차, Math.abs(c - t));
      rows.push([
        comma(s),
        유효(한_번[s] as number, 4),
        유효(두_번[s] as number, 4),
        유효(c, 4),
        유효(t, 4),
        유효(Math.abs(c - t), 1),
      ]);
    }
    const lines = table(rows, [0, 1, 2, 3, 4, 5]);
    lines.push(
      `열아홉 칸에서 두 값의 차가 가장 큰 자리도 ${유효(최대_차, 3)} 다. 한 번씩 세 걸음을 이어 계산한 것과 한 번짜리와 두 번짜리를 합친 것이 같은 분포다`,
    );
    return lines.join("\n");
  },

  /** 경쟁 설계 — 계수. */
  "alt-counts": () => {
    const a: Record<string, number> = cases["여섯 칸을 더하는 판"]();
    const b: Record<string, number> = cases["창의 합을 이어 쓰는 판"]();
    const 키: [string, string][] = [
      ["DP 테이블을 채우는 덧셈과 뺄셈", "DP 테이블을 채우는 덧셈과 뺄셈"],
      ["나눗셈", "나눗셈"],
      ["저장 칸", "저장 칸"],
      [
        "상대 오차가 10^-9 를 넘는 K 의 수",
        "상대 오차가 10^-9 를 넘는 K 의 수",
      ],
      ["정확한 유효 자릿수의 최솟값", "정확한 유효 자릿수의 최솟값"],
    ];
    const rows: string[][] = [
      ["계수", "여섯 칸을 더하는 판", "창의 합을 이어 쓰는 판", "나은 쪽"],
    ];
    for (const [label, key] of 키) {
      const x = a[key] ?? 0;
      const y = b[key] ?? 0;
      // 「유효 자릿수」만 큰 쪽이 나은 계수다. 나머지는 작은 쪽이 낫다.
      const 큰_쪽이_낫다 = label === "정확한 유효 자릿수의 최솟값";
      const 나은 = x === y ? "같다" : x > y === 큰_쪽이_낫다 ? "여섯 칸" : "창";
      rows.push([label, comma(x), comma(y), 나은]);
    }
    const lines = table(rows, [1, 2]);
    const K = b["상대 오차가 처음 10^-9 를 넘는 K"] ?? 0;
    lines.push(
      `채점 구간은 K = ${comma(채점_구간[0] ?? 0)}…${comma(채점_구간.at(-1) ?? 0)}${josa(String(채점_구간.at(-1) ?? 0), "이고", "고")} 그 안에서 창의 합을 이어 쓰는 판이 처음 10^-9 를 넘는 자리는 K = ${comma(K)} 다`,
    );
    return lines.join("\n");
  },

  /** 경쟁 설계 — 임계값을 바꿔 가며 두 판의 답을 정확한 값과 견준다. */
  "alt-accuracy": () => {
    const rows: string[][] = [
      [
        "K",
        "정확한 답",
        "여섯 칸을 더하는 판",
        "창의 합을 이어 쓰는 판",
        "여섯 칸의 상대 오차",
        "창의 상대 오차",
      ],
    ];
    for (const K of [2000, 3500, 3676, 3677, 4000, 5000]) {
      const one = 한_자리(K);
      const 상대 = (v: number): string =>
        one.정확 === 0n
          ? "—"
          : 분수를_지수로(상대_오차(v, one.정확, one.분모), 오차_눈금, 3);
      rows.push([
        comma(K),
        분수를_지수로(one.정확, one.분모),
        유효(one.여섯),
        유효(one.창),
        상대(one.여섯),
        상대(one.창),
      ]);
    }
    return table(rows, [0]).join("\n");
  },

  /** 닫힌 형태 검산 — 작은 입력에서 표와 같은가. */
  "math-check": () => {
    const rows: string[][] = [
      [
        "N",
        "s",
        "DP 테이블이 센 w",
        "닫힌 형태가 낸 값",
        "항의 개수",
        "같은가",
      ],
    ];
    for (const [N, s] of [
      [2, 2],
      [2, 7],
      [2, 12],
      [3, 10],
      [5, 20],
      [1000, 5404],
      [1000, 6000],
    ] as [number, number][]) {
      const 표 = (N === 1000 ? 큰_행 : 정확한_행(N))[s] as bigint;
      const 식 = 닫힌_형태(N, s);
      const 줄이기 = (v: bigint): string => {
        const text = v.toString();
        return text.length <= 12
          ? comma(v)
          : `${text.slice(0, 6)}… (${comma(text.length)}자리)`;
      };
      rows.push([
        comma(N),
        comma(s),
        줄이기(표),
        줄이기(식),
        comma(Math.floor((s - N) / FACES) + 1),
        표 === 식 ? "같다" : "어긋난다",
      ]);
    }
    return table(rows, [0, 1, 4]).join("\n");
  },

  /** 닫힌 형태가 예측한 언더플로 범위와 실측. */
  "math-underflow": () => {
    const 반_최소 = 2n ** 1075n;
    let 이론_lo = -1;
    let 이론_hi = -1;
    for (let s = 0; s <= 6000; s++) {
      if ((큰_행[s] as bigint) * 반_최소 >= 큰_분모) {
        이론_lo = s;
        break;
      }
    }
    for (let s = 6000; s >= 0; s--) {
      if ((큰_행[s] as bigint) * 반_최소 >= 큰_분모) {
        이론_hi = s;
        break;
      }
    }
    const { 행 } = 걸음마다(1000);
    const 마지막 = 행[1000] as Float64Array;
    let 실측_lo = -1;
    let 실측_hi = -1;
    let 영 = 0;
    for (let s = 0; s <= 6000; s++) {
      if ((마지막[s] as number) !== 0) {
        if (실측_lo < 0) 실측_lo = s;
        실측_hi = s;
      } else 영++;
    }
    const rows: string[][] = [
      ["무엇", "왼쪽 끝 s", "오른쪽 끝 s", "0 인 칸 수"],
    ];
    rows.push([
      "닫힌 형태가 예측한 자리",
      comma(이론_lo),
      comma(이론_hi),
      comma(6001 - (이론_hi - 이론_lo + 1)),
    ]);
    rows.push([
      "배정밀도 DP 테이블의 실측",
      comma(실측_lo),
      comma(실측_hi),
      comma(영),
    ]);
    const lines = table(rows, [1, 2, 3]);
    lines.push(
      `N=1000 의 칸 6,001 개 가운데 값이 0 이 아닌 것은 ${comma(실측_hi - 실측_lo + 1)} 개다`,
    );
    lines.push(
      `그 바깥의 정확한 확률은 2^-1075 = ${분수를_지수로(1n, 반_최소, 3)} 아래라 배정밀도가 0 으로 반올림한다`,
    );
    return lines.join("\n");
  },

  /** 닫힌 형태로만 얻는 값 — 표가 0 으로 만든 자리의 정확한 확률. */
  "math-tail": () => {
    const rows: string[][] = [
      ["K", "정확한 꼬리 확률", "10 의 몇 제곱인가", "정본이 낸 값"],
    ];
    for (const K of [4000, 5000, 5404, 5405, 5500, 6000]) {
      const p = 큰_꼬리[K] as bigint;
      const 지수 = 분수를_지수로(p, 큰_분모);
      const v = expectedValueDp(1000, K);
      rows.push([
        comma(K),
        지수,
        comma(Number(지수.split("e")[1] ?? "0")),
        짧게(v),
      ]);
    }
    const lines = table(rows, [0, 2]);
    lines.push(
      "정본이 0 을 내는 K = 5,405 부터도 닫힌 형태는 값을 낸다. 배정밀도가 담을 수 있는 가장 작은 수보다 작아서 0 이 된 것이지 확률이 0 인 것이 아니다",
    );
    return lines.join("\n");
  },

  /** 불변식 — 경계에 있는 입력들. */
  "invariant-values": () => {
    const 입력: [string, number, number][] = [
      ["임계값이 최솟값과 같은 N=4, K=4", 4, 4],
      ["임계값이 0 인 N=5, K=0", 5, 0],
      ["임계값이 최솟값보다 하나 큰 N=4, K=5", 4, 5],
      ["임계값이 최댓값인 N=3, K=18", 3, 18],
      ["임계값이 최댓값을 넘는 N=2, K=13", 2, 13],
      ["던지는 횟수가 하나인 N=1, K=4", 1, 4],
    ];
    const rows: string[][] = [["입력", "반환값", "왜 경계인가"]];
    const 이유 = [
      "합의 최솟값이 N 이라 반드시 임계값 이상이다",
      "모든 합이 0 이상이라 확률이 1 이다",
      "DP 테이블을 채우고 꼬리를 거의 다 더한다",
      "여섯 눈이 전부 최대여야 해서 시퀀스가 하나다",
      "합의 최댓값보다 커서 확률이 0 이다",
      "줄이 하나뿐이라 반복이 한 바퀴다",
    ];
    for (const [i, [name, N, K]] of 입력.entries()) {
      rows.push([name, 짧게(expectedValueDp(N, K)), 이유[i] ?? ""]);
    }
    return table(rows).join("\n");
  },

  /** 불변식 — 걸음마다 실제로 참인가. 실행이 판정한다. */
  "invariant-steps": () => {
    const rows: string[][] = [
      [
        "입력 묶음",
        "확인한 걸음 수",
        "확률 합이 1 에서 10^-12 넘게 벗어난 걸음",
        "칸이 [0,1] 밖인 걸음",
        "1 과의 최대 차",
      ],
    ];
    for (const N of [2, 10, 100, 1000]) {
      const { 행, 합 } = 걸음마다(N);
      let 벗어남 = 0;
      let 밖 = 0;
      let 최대 = 0;
      for (let i = 1; i <= N; i++) {
        const d = Math.abs((합[i] as number) - 1);
        if (d > 최대) 최대 = d;
        if (d > 1e-12) 벗어남++;
        const row = 행[i] as Float64Array;
        let bad = false;
        for (let s = 0; s <= FACES * N; s++) {
          const v = row[s] as number;
          if (v < 0 || v > 1) bad = true;
        }
        if (bad) 밖++;
      }
      rows.push([
        `던지는 횟수 N=${comma(N)}`,
        comma(N),
        comma(벗어남),
        comma(밖),
        유효(최대, 3),
      ]);
    }
    return table(rows, [1, 2, 3]).join("\n");
  },

  /** 불변식을 지키던 줄을 바꾸면. */
  "mutant-five": () =>
    변이표(
      "다섯 칸만 더하는 판",
      다섯칸판,
      "창_왼끝",
      "바꾼 줄을 지나간 횟수",
      FOUR,
    ),

  /** 그 판의 행 확률 합이 무엇이 되는가. */
  "mutant-five-sums": () => {
    const rows: string[][] = [
      [
        "던진 횟수 i",
        "정본의 확률 합",
        "다섯 칸만 더한 판의 확률 합",
        "(5/6)^i",
        "둘의 차",
      ],
    ];
    const N = 4;
    const maxSum = FACES * N;
    let prev = new Float64Array(maxSum + 1);
    prev[0] = 1;
    const { 합 } = 걸음마다(N);
    for (let i = 1; i <= N; i++) {
      const curr = new Float64Array(maxSum + 1);
      for (let s = 1; s <= maxSum; s++) {
        let sum = 0;
        const from = s - FACES + 1 < 0 ? 0 : s - FACES + 1;
        for (let u = from; u < s; u++) sum += prev[u] as number;
        curr[s] = sum / FACES;
      }
      prev = curr;
      let total = 0;
      for (let s = 0; s <= maxSum; s++) total += prev[s] as number;
      rows.push([
        comma(i),
        짧게(합[i] as number),
        짧게(total),
        짧게((5 / 6) ** i),
        유효(Math.abs(total - (5 / 6) ** i), 1),
      ]);
    }
    const lines = table(rows, [0]);
    lines.push(
      "셋째 열과 넷째 열의 차가 어느 줄에서도 10^-15 아래다. 더하는 칸을 하나 줄이면 매 바퀴 확률의 6 분의 1 이 사라진다",
    );
    return lines.join("\n");
  },

  /** 비용을 세는 과정 — 전개 입력과 제약 상한. */
  "perf-ops": () => {
    const rows: string[][] = [
      [
        "입력",
        "DP 테이블을 채우는 덧셈",
        "나눗셈",
        "꼬리 덧셈",
        "합",
        "N(36N−15) + 6N² + (6N−K+1)",
      ],
    ];
    for (const [N, K] of [
      [2, 10],
      [5, 20],
      [1000, 1001],
      [1000, 3500],
      [1000, 6000],
    ] as [number, number][]) {
      const o = 연산_수(N, K);
      rows.push([
        `N=${N}, K=${K}`,
        comma(o.덧셈),
        comma(o.나눗셈),
        comma(o.꼬리),
        comma(o.합),
        comma(N * (36 * N - 15) + 6 * N * N + (6 * N - K + 1)),
      ]);
    }
    return table(rows, [1, 2, 3, 4, 5]).join("\n");
  },

  /** 최악을 만드는 입력 — 통념을 실행으로 확인한다. */
  "perf-worst": () => {
    const rows: string[][] = [
      [
        "입력",
        "DP 테이블을 채우는 덧셈",
        "꼬리 덧셈",
        "합",
        "가장 많은 것과의 비",
      ],
    ];
    const 후보: [string, number, number][] = [
      ["임계값이 최솟값 이하다 — N=1000, K=1000", 1000, 1000],
      ["임계값이 최댓값을 넘는다 — N=1000, K=6001", 1000, 6001],
      ["임계값이 최솟값 바로 위다 — N=1000, K=1001", 1000, 1001],
      ["임계값이 한가운데다 — N=1000, K=3500", 1000, 3500],
      ["임계값이 최댓값이다 — N=1000, K=6000", 1000, 6000],
      ["던지는 횟수가 절반이다 — N=500, K=501", 500, 501],
    ];
    const 최대 = Math.max(...후보.map(([, N, K]) => 연산_수(N, K).합));
    for (const [name, N, K] of 후보) {
      const o = 연산_수(N, K);
      rows.push([
        name,
        comma(o.덧셈),
        comma(o.꼬리),
        comma(o.합),
        `${(o.합 / 최대).toFixed(4)} 배`,
      ]);
    }
    const lines = table(rows, [1, 2, 3, 4]);
    lines.push(
      "임계값을 최솟값 바로 위에서 최댓값까지 옮겨도 합이 0.01 % 안에서 움직인다. 갈리는 것은 임계값이 아니라 던지는 횟수다",
    );
    return lines.join("\n");
  },

  /** 스스로 점검하기 — 답이 붙는 문제. */
  "check-answer": () => {
    const rows: string[][] = [
      ["면 수 f", "합이 10 이상일 확률", "기약 분수", "정본과 같은가"],
    ];
    for (const f of [4, 6, 8]) {
      const N = 2;
      const maxSum = f * N;
      let prev = new Float64Array(maxSum + 1);
      prev[0] = 1;
      for (let i = 1; i <= N; i++) {
        const curr = new Float64Array(maxSum + 1);
        for (let s = 1; s <= maxSum; s++) {
          let sum = 0;
          const from = s - f < 0 ? 0 : s - f;
          for (let u = from; u < s; u++) sum += prev[u] as number;
          curr[s] = sum / f;
        }
        prev = curr;
      }
      let v = 0;
      for (let s = maxSum; s >= 10; s--) v += prev[s] as number;
      let ways = 0n;
      for (let a = 1; a <= f; a++) {
        for (let b = 1; b <= f; b++) if (a + b >= 10) ways++;
      }
      const q = BigInt(f) ** 2n;
      const g = gcdBig(ways, q) === 0n ? 1n : gcdBig(ways, q);
      rows.push([
        comma(f),
        짧게(v),
        ways === 0n ? "0" : `${ways / g}/${q / g}`,
        f === 6 ? (v === expectedValueDp(2, 10) ? "같다" : "어긋난다") : "—",
      ]);
    }
    return table(rows, [0]).join("\n");
  },

  /** 전체 컨셉 — 과제가 내는 값 하나를 눈의 짝으로 확인한다. */
  "concept-example": () => {
    const hit = 두_눈((a, b) => a + b >= WALK_K);
    const all = 두_눈(() => true);
    const v = expectedValueDp(WALK_N, WALK_K);
    return [
      `expectedValueDp(${WALK_N}, ${WALK_K}) = ${짧게(v)}`,
      "",
      ...table([
        [
          `합이 ${WALK_K} 이상인 두 눈`,
          hit.map(([a, b]) => `(${a},${b})`).join(" "),
          `${comma(hit.length)} 가지`,
        ],
        ["두 눈의 모든 짝", `${FACES} × ${FACES}`, `${comma(all.length)} 가지`],
      ]),
      "",
      `${hit.length} / ${all.length} = ${짧게(hit.length / all.length)} 이고 정본의 값과 ${hit.length / all.length === v ? "같다" : "다르다"}`,
    ].join("\n");
  },

  /** 전체 컨셉 — DP 테이블의 크기. */
  "concept-scale": () => {
    const t = trace(WALK_N, WALK_K);
    const line = (N: number) =>
      `줄 ${comma(N + 1)} × 칸 ${comma(FACES * N + 1)} = ${comma((N + 1) * (FACES * N + 1))} 칸`;
    if (
      t.rows.length !== WALK_N + 1 ||
      t.rows[0]?.length !== FACES * WALK_N + 1
    ) {
      throw new Error("정본이 잡은 줄 수나 칸 수가 식과 다르다");
    }
    return [
      `전개 입력   N = ${WALK_N}       ${line(WALK_N)}`,
      `규모의 끝   N = ${comma(1000)}   ${line(1000)}`,
    ].join("\n");
  },

  /** 먼저 알아 둘 개념 — 칸 하나를 읽는 법. */
  "build-read-one": () => {
    const s = 7;
    const p = trace(WALK_N, WALK_K).rows[WALK_N]?.[s] as number;
    const pairs = 두_눈((a, b) => a + b === s);
    const tbl = md(
      ["첫 눈", "둘째 눈", "합"],
      pairs.map(([a, b]) => [String(a), String(b), `${a} + ${b} = ${a + b}`]),
      [0, 1],
    );
    return withNote(
      tbl,
      `합이 ${s} 인 두 눈의 짝은 ${pairs.length} 가지이고, DP 테이블의 p[${WALK_N}][${s}]${을를(s)} 분수로 되돌리면 ${frac(p, WALK_N)} 입니다.`,
    );
  },

  /** 먼저 알아 둘 개념 — 줄과 줄의 관계. 던지는 횟수 셋까지. */
  "build-rows": () => {
    const N = 3;
    const t = trace(N, FACES * N);
    const rows = t.rows.map((row, i) => {
      const lo = row.findIndex((p) => p !== 0);
      let hi = -1;
      row.forEach((p, s) => {
        if (p !== 0) hi = s;
      });
      let top = 0;
      row.forEach((p, s) => {
        if (p > (row[top] as number)) top = s;
      });
      const ties = row
        .map((p, s) => (p === row[top] ? s : -1))
        .filter((s) => s >= 0);
      const w = row.reduce((n, p) => n + count(p, i), 0);
      return [
        `i=${i}`,
        `[${lo}, ${hi}]`,
        comma(hi - lo + 1),
        `${ties.join(" · ")} (${frac(row[top] as number, i)})`,
        `${w}/${FACES ** i}`,
      ];
    });
    const 합이_1 = t.rows.every((row, i) => {
      const w = row.reduce((n, p) => n + count(p, i), 0);
      return w === FACES ** i;
    });
    return withNote(
      md(["줄", "값이 든 칸", "칸 수", "가장 큰 칸", "확률 합"], rows, [2]),
      `${comma(t.rows.length)} 줄 모두 확률 합이 ${합이_1 ? "1" : "1 이 아닌 값"} 입니다. 값이 든 칸은 한 줄 내려갈 때마다 왼쪽 끝이 1 칸, 오른쪽 끝이 ${FACES} 칸 옮겨 갑니다.`,
    );
  },

  /** 1단계 — DP 테이블의 크기와, 코드가 실제로 동시에 드는 칸. */
  "build-size": () => {
    const t = trace(WALK_N, WALK_K);
    const rows = [WALK_N, 1000].map((N) => [
      comma(N),
      comma(N + 1),
      comma(FACES * N + 1),
      comma((N + 1) * (FACES * N + 1)),
      comma(2 * (FACES * N + 1)),
    ]);
    return withNote(
      md(
        [
          "던지는 횟수 N",
          "줄 수 N+1",
          "줄마다 칸 수 6N+1",
          "DP 테이블 전체",
          "코드가 동시에 드는 칸",
        ],
        rows,
        [0, 1, 2, 3, 4],
      ),
      `전개 입력에서 정본은 줄을 ${comma(t.rows.length)} 번 잡았고 한 줄이 ${comma(t.rows[0]?.length ?? 0)} 칸입니다.`,
    );
  },

  /** 2단계 — 한 줄을 직전 줄의 여섯 칸에서 채운다. i=2 줄. */
  "build-fill-row": () => {
    const t = trace(WALK_N, WALK_K);
    const cells = t.cells.filter((c) => c.i === WALK_N);
    let 잘린 = 0;
    const rows = cells.map((c) => {
      if (c.reads.length < FACES) 잘린++;
      const nonzero = c.reads.filter((r) => r.value !== 0).map((r) => r.u);
      return [
        comma(c.s),
        `[${c.from}, ${c.s - 1}]`,
        comma(c.reads.length),
        nonzero.length === 0 ? "없음" : nonzero.join(" · "),
        frac(c.sum, WALK_N - 1),
        frac(c.value, WALK_N),
      ];
    });
    const 전부_직전 = cells.every((c) => c.reads.every((r) => r.u < c.s));
    return withNote(
      md(
        ["s", "더한 칸", "칸 수", "값이 든 칸", "합", `p[${WALK_N}][s]`],
        rows,
        [0, 2],
      ),
      `칸 ${comma(cells.length)} 개가 모두 직전 줄의 ${전부_직전 ? "s 보다 왼쪽 칸만" : "s 이상인 칸까지"} 읽었고, 더한 칸이 여섯보다 적은 칸은 ${comma(잘린)} 개입니다.`,
    );
  },

  /** 3단계 — 마지막 줄의 꼬리를 더한다. 여러 K 에서 눈의 짝을 센 값과 비교한다. */
  "build-tail": () => {
    const rows = [2, 7, 10, 12, 13].map((K) => {
      const v = expectedValueDp(WALK_N, K);
      const hit = 두_눈((a, b) => a + b >= K).length;
      const 정확 = `${hit}/${FACES ** WALK_N}`;
      const 값 = frac(v, WALK_N);
      const lo = Math.max(K, 0);
      return [
        comma(K),
        lo > FACES * WALK_N ? "없음" : `[${lo}, ${FACES * WALK_N}]`,
        값,
        정확,
        count(v, WALK_N) === hit ? "같다" : "다르다",
      ];
    });
    return withNote(
      md(["K", "더한 칸", "정본의 답", "짝을 센 값", "비교"], rows, [0]),
      `${comma(rows.length)} 개의 K 모두 정본의 답을 분수로 되돌린 값이 두 눈의 짝을 센 값과 같습니다.`,
    );
  },

  /** 전제 — 던짐마다 같은 분포이고 앞 결과와 무관해야 한다. */
  "build-premise": () => {
    const 공정 = 두_눈(() => true);
    const 다른 = 두_눈((a, b) => a !== b);
    const 셈 = (xs: [number, number][]) =>
      xs.filter(([a, b]) => a + b >= WALK_K).length;
    const v = expectedValueDp(WALK_N, WALK_K);
    const rows: string[][] = [
      [
        "공정한 주사위 둘",
        comma(공정.length),
        `${셈(공정)}/${공정.length}`,
        짧게(셈(공정) / 공정.length),
        짧게(v),
      ],
      [
        "둘째 눈이 첫 눈과 달라야 하는 주사위",
        comma(다른.length),
        `${셈(다른)}/${다른.length}`,
        짧게(셈(다른) / 다른.length),
        짧게(v),
      ],
    ];
    return withNote(
      md(
        [
          "던지는 방식",
          "나오는 짝",
          `합이 ${WALK_K} 이상`,
          "짝을 센 확률",
          "정본",
        ],
        rows,
        [1],
      ),
      `둘째 눈이 첫 눈에 매이면 짝을 센 확률은 ${짧게(셈(다른) / 다른.length)} 인데 정본은 여전히 ${짧게(v)}${을를(짧게(v))} 냅니다.`,
    );
  },

  /** 설계 선택 — 칸에 개수를 적으면 어디서 무너지는가. */
  "build-count-overflow": () => {
    let 처음 = 0;
    for (let N = 1; N <= 1000; N++) {
      if (!Number.isFinite(FACES ** N)) {
        처음 = N;
        break;
      }
    }
    const rows = [10, 100, 처음 - 1, 처음, 1000].map((N) => {
      const K = Math.ceil(3.5 * N);
      const a = 개수로(N, K);
      const b = expectedValueDp(N, K);
      return [
        `N=${comma(N)}, K=${comma(K)}`,
        짧게(a),
        짧게(b),
        Number.isFinite(FACES ** N) ? "유한하다" : "무한대다",
      ];
    });
    return withNote(
      md(
        ["입력", "개수를 적는 판", "확률을 적는 정본", "6^N 의 배정밀도 값"],
        rows,
      ),
      `개수를 적는 판은 N=${comma(처음)} 부터 NaN 을 냅니다. 6^${처음} 이 배정밀도의 가장 큰 수 ${Number.MAX_VALUE.toExponential(2)}${을를(Number.MAX_VALUE.toExponential(2))} 넘기 때문입니다.`,
    );
  },

  /** 설계 선택 — 꼬리를 큰 합 쪽부터 더하는 것과 작은 합 쪽부터 더하는 것. */
  "build-tail-order": () => {
    const row = 마지막_줄(1000);
    let 다른_답 = 0;
    let 큰쪽_최악 = 0n;
    let 작은쪽_최악 = 0n;
    let 큰쪽_넘음 = 0;
    let 작은쪽_넘음 = 0;
    const 문턱 = 오차_눈금 / 10n ** 9n;
    for (const K of 채점_구간) {
      let a = 0;
      for (let s = 6000; s >= K; s--) a += row[s] as number;
      let b = 0;
      for (let s = K; s <= 6000; s++) b += row[s] as number;
      if (a !== expectedValueDp(1000, K)) {
        throw new Error(`값만 드는 사본이 정본과 다르다 — K=${K}`);
      }
      if (a !== b) 다른_답++;
      const p = 큰_꼬리[K] as bigint;
      const ea = 상대_오차(a, p, 큰_분모);
      const eb = 상대_오차(b, p, 큰_분모);
      if (ea > 큰쪽_최악) 큰쪽_최악 = ea;
      if (eb > 작은쪽_최악) 작은쪽_최악 = eb;
      if (ea > 문턱) 큰쪽_넘음++;
      if (eb > 문턱) 작은쪽_넘음++;
    }
    const rows = [
      ["큰 합 쪽부터 (정본)", 큰쪽_최악, 큰쪽_넘음],
      ["작은 합 쪽부터", 작은쪽_최악, 작은쪽_넘음],
    ].map(([name, e, n]) => [
      name as string,
      분수를_지수로(e as bigint, 오차_눈금, 3),
      comma(n as number),
    ]);
    return withNote(
      md(["더하는 순서", "가장 큰 상대 오차", "10^-9 를 넘은 K"], rows, [2]),
      `N=1,000 · K = ${comma(채점_구간[0] ?? 0)}…${comma(채점_구간.at(-1) ?? 0)} 의 ${comma(채점_구간.length)} 자리에서 두 순서가 다른 답을 낸 K 는 ${comma(다른_답)} 개입니다.`,
    );
  },

  /** 전개 입력. */
  "walk-input": () =>
    [
      `const N = ${WALK_N};`,
      `const K = ${WALK_K};`,
      `// 이 절이 끝나면 ${짧게(expectedValueDp(WALK_N, WALK_K))} 이 나와야 한다`,
    ].join("\n"),

  /** 1. 확실한 자리를 걸러낸다 — 두 비교를 세 입력에. */
  "walk-guard": () => {
    const rows: string[][] = [["입력", "K <= N", "K > 6N", "하는 일"]];
    for (const [N, K] of [
      [WALK_N, WALK_K],
      [4, 4],
      [2, 13],
    ] as [number, number][]) {
      const t = trace(N, K);
      const low = K <= N;
      const high = K > FACES * N;
      rows.push([
        `N=${N}, K=${K}`,
        `${K} <= ${N} ${low ? "참" : "거짓"}`,
        low ? "— 비교 안 함" : `${K} > ${FACES * N} ${high ? "참" : "거짓"}`,
        t.filled ? "DP 테이블을 채운다" : `${짧게(t.result)} 반환`,
      ]);
    }
    return table(rows).join("\n");
  },

  /** 2. 0 번 던진 줄. */
  "walk-init": () => {
    const t = trace(WALK_N, WALK_K);
    const idx = t.init.map((_, s) => padLeft(String(s), 2));
    const val = t.init.map((p) => padLeft(frac(p, 0), 2));
    const total = t.init.reduce((a, b) => a + b, 0);
    return [
      `prev  s = ${idx.join(" ")}`,
      `          ${val.join(" ")}`,
      `이 줄의 확률 합 = ${짧게(total)}`,
    ].join("\n");
  },

  /** 3. i=1 줄의 칸 몇 개를 채운 기록. */
  "walk-fill": () => {
    const t = trace(WALK_N, WALK_K);
    const rows: string[][] = [
      ["칸", "s − 6 < 0", "더한 칸", "더한 값", "합", "curr[s]"],
    ];
    for (const s of [1, 2, 6, 7, 12]) {
      const c = t.cells.find((x) => x.i === 1 && x.s === s);
      if (!c) throw new Error(`p[1][${s}] 의 기록이 없다`);
      rows.push([
        `p[1][${s}]`,
        s - FACES < 0 ? "참" : "거짓",
        `[${c.from}, ${s - 1}]`,
        c.reads.map((r) => frac(r.value, 0)).join(" "),
        frac(c.sum, 0),
        frac(c.value, 1),
      ]);
    }
    return table(rows).join("\n");
  },

  /** 4. 꼬리를 큰 쪽부터 더한 기록. */
  "walk-tail": () => {
    const t = trace(WALK_N, WALK_K);
    const lines = t.tail.map(
      ({ s, answer }) =>
        `s = ${padLeft(String(s), 2)}   ${s} >= ${WALK_K} 참   answer += ${frac(t.rows[WALK_N]?.[s] as number, WALK_N)}   →   ${frac(answer, WALK_N)} = ${짧게(answer)}`,
    );
    const stop = (t.tail.at(-1)?.s ?? WALK_K) - 1;
    lines.push(
      `s = ${padLeft(String(stop), 2)}   ${stop} >= ${WALK_K} 거짓   반복이 끝나고 ${짧게(t.result)} 을 돌려준다`,
    );
    return lines.join("\n");
  },

  /** 5. 걸음 전부 — 분기 조건의 참/거짓까지. */
  "walk-trace": () => {
    const steps = walkSteps();
    const t = trace(WALK_N, WALK_K);
    const rows: string[][] = [];
    const branch = { guard: 0, init: 0, fill: 0, tail: 0 };
    for (const st of steps) {
      const title = st.title;
      if (title.endsWith("①")) {
        branch.guard++;
        rows.push([
          st.id,
          "—",
          `\`${WALK_K} <= ${WALK_N}\` **거짓** · \`${WALK_K} > ${FACES * WALK_N}\` **거짓**`,
          "DP 테이블을 채우러 간다",
        ]);
      } else if (title.endsWith("②")) {
        branch.init++;
        rows.push([st.id, "p[0][0]", "—", frac(t.init[0] as number, 0)]);
      } else if (title.endsWith("③")) {
        branch.fill++;
        const w = st.step.write?.[0] as readonly [number, number];
        const [i, s] = w;
        const c = t.cells.find((x) => x.i === i && x.s === s);
        if (!c) throw new Error("칸 기록이 없다");
        rows.push([
          st.id,
          `p[${i}][${s}]`,
          `\`${s} − 6 < 0\` **${s - FACES < 0 ? "참" : "거짓"}** → [${c.from}, ${s - 1}]`,
          frac(c.value, i),
        ]);
      } else if (title.endsWith("④")) {
        branch.tail++;
        const s = st.step.read?.[0]?.[1] as number;
        const a = t.tail.find((x) => x.s === s)?.answer as number;
        rows.push([
          st.id,
          `p[${WALK_N}][${s}]`,
          `\`${s} >= ${WALK_K}\` **참**`,
          `answer = ${frac(a, WALK_N)}`,
        ]);
      } else {
        const stop = (t.tail.at(-1)?.s ?? WALK_K) - 1;
        rows.push([
          st.id,
          "—",
          `\`${stop} >= ${WALK_K}\` **거짓**`,
          `${frac(t.result, WALK_N)} 반환`,
        ]);
      }
    }
    return withNote(
      md(["단계", "칸", "조건 판정", "정한 값"], rows),
      `① 이 ${branch.guard} 번, ② 가 ${branch.init} 번, ③ 이 ${branch.fill} 번, ④ 가 ${branch.tail} 번 실행됐고, 반환값은 ${frac(t.result, WALK_N)} = ${짧게(t.result)} 입니다.`,
    );
  },

  /** 경쟁 설계 — 왜 뒤집히는가. 창 판의 절대 오차와 정확한 답의 크기. */
  "alt-why": () => {
    let 최대 = 0;
    let 최소 = Number.POSITIVE_INFINITY;
    for (const K of 채점_구간) {
      const one = 한_자리(K);
      const e = 절대_오차(one.창, one.정확, one.분모);
      if (e > 최대) 최대 = e;
      if (e < 최소) 최소 = e;
    }
    const flip =
      cases["창의 합을 이어 쓰는 판"]()["상대 오차가 처음 10^-9 를 넘는 K"] ??
      0;
    const at = 한_자리(flip);
    return table([
      [
        "창 판의 절대 오차",
        `채점 구간 ${comma(채점_구간.length)} 자리에서 ${유효(최소, 2)} … ${유효(최대, 2)}`,
      ],
      ["정확한 답", "K 가 커지면 0 을 향해 작아진다"],
      [
        "상대 오차",
        "절대 오차 / 정확한 답 — 분모만 작아지므로 어느 자리에서 10^-9 를 넘는다",
      ],
      [
        "처음 넘는 자리",
        `K = ${comma(flip)}, 그때 정확한 답은 ${분수를_지수로(at.정확, at.분모, 2)}`,
      ],
    ]).join("\n");
  },

  /** 비용을 세는 과정 — 전개의 걸음을 일로 묶는다. */
  "perf-derive": () => {
    const t = trace(WALK_N, WALK_K);
    const adds = t.cells.reduce((n, c) => n + c.reads.length, 0);
    const steps = walkSteps();
    const first = steps.findIndex((s) => s.title.endsWith("③"));
    const last = steps.findLastIndex((s) => s.title.endsWith("③"));
    const tailFirst = steps.findIndex((s) => s.title.endsWith("④"));
    const tailLast = steps.findLastIndex((s) => s.title.endsWith("④"));
    return table([
      ["T1", "비교 둘 — 확실한 자리가 아님을 확인한다"],
      ["T2", `0 번 던진 줄 ${FACES * WALK_N + 1} 칸을 잡고 한 칸에 1 을 둔다`],
      [
        `T${first + 1}~T${last + 1}`,
        `칸 ${comma(t.cells.length)} 개를 채운다 — 덧셈 ${comma(adds)} 번, 나눗셈 ${comma(t.cells.length)} 번`,
      ],
      [
        `T${tailFirst + 1}~T${tailLast + 1}`,
        `꼬리 ${comma(t.tail.length)} 칸을 더한다 — 덧셈 ${comma(t.tail.length)} 번`,
      ],
      [`T${steps.length}`, "반복을 끝내고 답을 돌려준다"],
    ]).join("\n");
  },

  /** 수식 — 포함배제 닫힌 형태를 작은 자리에 넣어 검산한다. */
  "math-hand": () => {
    const N = WALK_N;
    const s = 7;
    const m = s - N;
    const lines: string[] = [];
    let total = 0n;
    for (let j = 0; ; j++) {
      if (FACES * j > m) {
        lines.push(
          `j = ${j} 이면 6j = ${FACES * j} 가 s − N = ${m} 보다 커서 항이 없다`,
        );
        break;
      }
      const a = 이항(BigInt(N), BigInt(j));
      const b = 이항(BigInt(s - FACES * j - 1), BigInt(N - 1));
      total += j % 2 === 0 ? a * b : -(a * b);
      lines.push(
        `j = ${j} 이면 ${j % 2 === 0 ? "+" : "−"} C(${N},${j}) × C(${s - FACES * j - 1},${N - 1}) = ${a} × ${b} = ${a * b}`,
      );
    }
    const w = count(trace(WALK_N, WALK_K).rows[WALK_N]?.[s] as number, WALK_N);
    lines.push(
      `합은 W_${N}(${s}) = ${total} 이고 DP 테이블의 w[${N}][${s}] = ${w} 과 ${BigInt(w) === total ? "같다" : "다르다"}`,
    );
    return lines.join("\n");
  },

  /** 수식 — 눈마다 1 을 뺀 꼴을 작은 자리에 넣는다. */
  "math-sub": () => {
    const N = WALK_N;
    const s = 7;
    const m = s - N;
    const 해: string[] = [];
    for (let a = 0; a <= m; a++) {
      if (a <= FACES - 1 && m - a <= FACES - 1) 해.push(`(${a},${m - a})`);
    }
    const 제한_없는 = m + 1;
    return [
      `s − N = ${s} − ${N} = ${m} 이라 e1 + e2 = ${m} 이고 0 <= e_i <= 5 다`,
      `해는 ${해.join(" ")} 로 ${해.length} 개이고, 제한 없이 세도 ${제한_없는} 개라 e_i <= 5 를 어기는 해가 없다`,
    ].join("\n");
  },

  /** 불변식 — 전개의 세 줄이 끝난 걸음에서 세 성질. */
  "invariant-walk": () => {
    const t = trace(WALK_N, WALK_K);
    const steps = walkSteps();
    // 줄 i 를 다 채운 걸음 — 0 번 줄은 그 줄을 놓은 걸음, 나머지는 그 줄의 마지막 칸을 채운 걸음.
    const doneAt = (i: number): string => {
      const k =
        i === 0
          ? steps.findIndex((st) => st.title.endsWith("②"))
          : steps.findIndex(
              (st) =>
                st.step.write?.[0]?.[0] === i &&
                st.step.write?.[0]?.[1] === FACES * WALK_N,
            );
      return steps[k]?.id ?? "?";
    };
    let 모두 = true;
    const rows = t.rows.map((row, i) => {
      const w = row.reduce((n, p) => n + count(p, i), 0);
      const lo = row.findIndex((p) => p !== 0);
      let hi = -1;
      row.forEach((p, s) => {
        if (p !== 0) hi = s;
      });
      const inRange = row.every((p) => p >= 0 && p <= 1);
      if (!inRange || w !== FACES ** i) 모두 = false;
      return [
        doneAt(i),
        `i=${i}`,
        `${w}/${FACES ** i}`,
        inRange ? "그렇다" : "아니다",
        `[${lo}, ${hi}]`,
      ];
    });
    return withNote(
      md(["걸음", "줄", "확률 합", "모든 칸이 [0, 1] 안", "값이 든 칸"], rows),
      `${comma(rows.length)} 걸음 ${모두 ? "모두" : "중 일부만"} 확률 합이 1 이고 모든 칸이 [0, 1] 안입니다. 값이 든 칸의 왼쪽 끝은 한 바퀴마다 1 칸, 오른쪽 끝은 ${FACES} 칸 오른쪽으로 옮겨 갑니다.`,
    );
  },
};
