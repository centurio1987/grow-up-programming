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
 * 경쟁 설계 대조 표의 값은 `.alt.ts` 를 **불러서** 얻는다 — 같은 값을 두 파일에 적으면
 * 한쪽만 고쳐질 때 표가 조용히 거짓이 된다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import {
  cases,
  상대_오차,
  오차_눈금,
  정확한_행,
  채점_구간,
  한_자리,
} from "./expectedValueDp-guide.alt.ts";
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

/**
 * 받침이 있으면 앞엣것, 없으면 뒤엣것을 돌려준다. **조사만** 돌려주고 값은 부르는 쪽이 적는다.
 * 숫자는 우리말 읽기로 판정한다 — 0 영 · 1 일 · 3 삼 · 6 육 · 7 칠 · 8 팔이 받침을 갖는다.
 */
function 조사(value: string, 받침: string, 무받침: string): string {
  const last = [...value].at(-1) ?? "";
  const code = last.codePointAt(0) ?? 0;
  const digit = "0123456789".indexOf(last);
  if (digit >= 0) return [0, 1, 3, 6, 7, 8].includes(digit) ? 받침 : 무받침;
  if (code < 0xac00 || code > 0xd7a3) return 무받침;
  return (code - 0xac00) % 28 === 0 ? 무받침 : 받침;
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
const WALK_N = 2;
const WALK_K = 10;

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
      "행 하나씩",
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
      "넷째 열이 1 이어야 할 자리다. 확률 합이 1 을 넘으면 그 표는 확률 분포가 아니다",
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
        "분포 표의 칸 수",
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
      "바꾼 줄이 행을 잡은 횟수",
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
        "표가 채운 세 번째 행",
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
      ["표를 채우는 덧셈과 뺄셈", "표를 채우는 덧셈과 뺄셈"],
      ["나눗셈", "나눗셈"],
      ["저장 칸", "저장 칸"],
      [
        "상대 오차가 10^-9 를 넘는 K 의 수",
        "상대 오차가 10^-9 를 넘는 K 의 수",
      ],
      ["정확한 유효 자릿수의 최솟값", "정확한 유효 자릿수의 최솟값"],
      [
        "최악 상대 오차가 1 을 넘는 자릿수",
        "최악 상대 오차가 1 을 넘는 자릿수",
      ],
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
      `채점 구간은 K = ${comma(채점_구간[0] ?? 0)}…${comma(채점_구간.at(-1) ?? 0)} ${조사(String(채점_구간.at(-1) ?? 0), "이고", "고")} 그 안에서 창의 합을 이어 쓰는 판이 처음 10^-9 를 넘는 자리는 K = ${comma(K)} 다`,
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
      ["N", "s", "표가 센 w", "닫힌 형태가 낸 값", "항의 개수", "같은가"],
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
      "배정밀도 표의 실측",
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
      ["K", "정확한 꼬리 확률", "10 의 몇 제곱인가", "배정밀도 표가 낸 값"],
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
      "표가 0 을 내는 K = 5,405 부터도 닫힌 형태는 값을 낸다. 배정밀도가 담을 수 있는 가장 작은 수보다 작아서 0 이 된 것이지 확률이 0 인 것이 아니다",
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
      "표를 채우고 꼬리를 거의 다 더한다",
      "여섯 눈이 전부 최대여야 해서 시퀀스가 하나다",
      "합의 최댓값보다 커서 확률이 0 이다",
      "행이 하나뿐이라 반복이 한 바퀴다",
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
        "표를 채우는 덧셈",
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
      ["입력", "표를 채우는 덧셈", "꼬리 덧셈", "합", "가장 많은 것과의 비"],
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
};
