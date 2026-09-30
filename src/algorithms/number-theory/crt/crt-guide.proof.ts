/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 합치기마다의 상태는 그림 사이드카의 `trace`(정본 소스에서 기계로 만든 계측 사본)에서 받는다 — 그림과
 * 표가 같은 기록을 쓴다. 나눗셈 횟수는 같은 사이드카의 `divisions`(값만 세는 가벼운 사본)가 센다.
 *
 *   bun run tools/check-proof.ts src/algorithms/number-theory/crt/crt-guide.md
 *
 * **변이가 아무것도 안 바꾸는지 검사하는 자리는 중화 실행을 비켜 간다.** `check-proof` 가 이 파일을 한 번 더
 * 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서 「변이가 답을 안 바꿨다」로 던지면
 * 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 *
 * **세는 사본이 둘 더 있다**(`visits` · `asDouble`). 정본은 변이를 건 줄을 몇 번 지나갔는지도, 배정밀도로
 * 옮겼을 때의 값도 내보내지 않는다. **답이 맞는지는 사본이 아니라 정본이 진다** — 아래 표에서 옳은 쪽 칸은
 * 전부 정본이나 정본에서 기계로 만든 변이가 낸 값이다.
 *
 * 경쟁 설계 대조 표의 값은 `.alt.ts` 를 **불러서** 얻는다 — 같은 값을 두 파일에 적으면 한쪽만 고쳐질 때 표가
 * 조용히 거짓이 된다.
 */
import { readFileSync } from "node:fs";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  MODULI,
  prepare,
  QUERY_COUNTS,
  totals,
  뒤집히는_자리,
} from "./crt-guide.alt.ts";
import {
  type Answer,
  BIG_PAIR,
  byListing,
  divisions,
  duration,
  LIMIT,
  lcmAll,
  mod,
  num,
  primes,
  trace,
  WALK_M,
  WALK_R,
  walk,
  walkSteps,
} from "./crt-guide.fig.tsx";
import { crt } from "./crt-guide.ref.ts";

const REF = new URL("./crt-guide.ref.ts", import.meta.url).pathname;

type Ref = { crt: (r: bigint[], m: bigint[]) => Answer };

/* ────────────────────────── 표 그리기 ────────────────────────── */

const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** 칸을 맞춘 글자 표(펜스 안에 싣는다). `alignRight` 에 든 열만 오른쪽 정렬이다. */
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

/** 표 하나와 그 아래 문장 — 닫는 마커까지 대조하는 블록의 모양. */
const withNote = (tableText: string, note: string): string =>
  `${tableText}\n\n${note}`;

const show = (a: Answer): string =>
  a === null ? "null" : `x=${num(a.x)}, M=${num(a.M)}`;

/** 합동식 하나 — `x ≡ 2 (mod 3)`. */
const cong = (r: bigint, m: bigint): string => `x ≡ ${r} (mod ${m})`;

/** 입력 한 벌 — `[2,3,2] mod [3,5,7]`. */
const inputOf = (r: readonly bigint[], m: readonly bigint[]): string =>
  `[${r.join(",")}] mod [${m.join(",")}]`;

const same = (a: Answer, b: Answer): boolean =>
  a === null || b === null ? a === b : a.x === b.x && a.M === b.M;

const gcdBig = (a: bigint, b: bigint): bigint =>
  b === 0n ? a : gcdBig(b, a % b);

/** 정의대로 — 주기 안을 전부 확인해 두 합동식을 함께 만족하는 값을 모은다. 작은 값에만 쓴다. */
function bothIn(
  span: bigint,
  a: [bigint, bigint],
  b: [bigint, bigint],
): bigint[] {
  const out: bigint[] = [];
  for (let x = 0n; x < span; x++) {
    if (x % a[1] === mod(a[0], a[1]) && x % b[1] === mod(b[0], b[1])) {
      out.push(x);
    }
  }
  return out;
}

/* ────────────────────── 공통 입력 ────────────────────── */

/** 서로소가 아닌 법을 담은 입력. 합칠 수 있는 쪽과 모순인 쪽 둘. */
const SHARED_OK_R = [2n, 5n, 2n];
const SHARED_OK_M = [6n, 9n, 4n];
const SHARED_BAD_R = [2n, 5n, 3n];

/** 표에 나란히 놓는 네 입력. */
const FOUR: [string, bigint[], bigint[]][] = [
  [`전개 입력 ${inputOf(WALK_R, WALK_M)}`, WALK_R, WALK_M],
  [
    `서로소가 아니고 합쳐지는 ${inputOf(SHARED_OK_R, SHARED_OK_M)}`,
    SHARED_OK_R,
    SHARED_OK_M,
  ],
  [
    `서로소가 아니고 모순인 ${inputOf(SHARED_BAD_R, SHARED_OK_M)}`,
    SHARED_BAD_R,
    SHARED_OK_M,
  ],
  ["합동식이 하나인 [5] mod [7]", [5n], [7n]],
];

/* ────────────────────── 배정밀도로 옮긴 사본 ────────────────────── */

/** 정본과 글자 그대로 같은 절차를 배정밀도 `number` 로 옮긴 사본. */
function asDouble(
  remainders: number[],
  moduli: number[],
): { x: number; M: number } | null {
  const md2 = (a: number, m: number): number => {
    const r = a % m;
    return r < 0 ? r + m : r;
  };
  const gcdCoefficient = (a: number, b: number): { g: number; x: number } => {
    let r0 = a;
    let r1 = b;
    let s0 = 1;
    let s1 = 0;
    while (r1 !== 0) {
      const q = Math.floor(r0 / r1);
      [r0, r1] = [r1, r0 - q * r1];
      [s0, s1] = [s1, s0 - q * s1];
    }
    return { g: r0, x: s0 };
  };
  let curM = moduli[0] as number;
  let curR = md2(remainders[0] as number, curM);
  for (let i = 1; i < moduli.length; i++) {
    const m = moduli[i] as number;
    const r = md2(remainders[i] as number, m);
    const diff = r - curR;
    const { g, x: u } = gcdCoefficient(curM, m);
    if (diff % g !== 0) return null;
    const unit = m / g;
    const t = md2((diff / g) * u, unit);
    curR = curR + curM * t;
    curM = curM * unit;
  }
  return { x: curR, M: curM };
}

/** 배정밀도가 정확히 담는 정수의 상한. */
const SAFE = 9_007_199_254_740_992n;

/** 두 법을 `m`·`m+1` 로 두고 답이 `M − 1` 이 되게 만든 입력. */
function neighbourPair(m: number): { r: number[]; mods: number[]; M: bigint } {
  const M = BigInt(m) * BigInt(m + 1);
  return {
    r: [Number((M - 1n) % BigInt(m)), Number((M - 1n) % BigInt(m + 1))],
    mods: [m, m + 1],
    M,
  };
}

/** 그 입력에서 배정밀도 판이 정본과 갈리는가. */
function neighbourDiffers(m: number): boolean {
  const { r, mods } = neighbourPair(m);
  const big = crt(r.map(BigInt), mods.map(BigInt));
  const dbl = asDouble(r, mods);
  if (big === null || dbl === null) return true;
  return BigInt(dbl.x) !== big.x || BigInt(dbl.M) !== big.M;
}

/* ────────────────────────── 변이 ────────────────────────── */

/** `unit` 을 `m / g` 대신 `m` 으로 잡은 판. 법이 서로소면 `g = 1` 이라 같은 값이다. */
const fullUnit = await loadMutant<Ref>(REF, {
  swap: [/^ {4}const unit = m \/ g;$/, "    const unit = m;"],
});

/** 모순 판정 줄을 지운 판. 합칠 수 없는 합동식도 합친 것처럼 값을 낸다. */
const noGuard = await loadMutant<Ref>(REF, {
  drop: /^ {4}if \(diff % g !== 0n\) return null;$/,
});

/** `t` 를 `[0, unit)` 로 맞추지 않고 부호가 남는 나머지를 그대로 쓴 판. */
const rawRemainder = await loadMutant<Ref>(REF, {
  swap: [
    /^ {4}const t = mod\(\(diff \/ g\) \* u, unit\);$/,
    "    const t = ((diff / g) * u) % unit;",
  ],
});

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두 함수가 **같은
 * 객체**다. 중화 상태에서 아래 자기검사를 실행하면 언제나 던지게 되고, 그러면 `check-proof` 의 중화 대조가
 * 이 편에서는 한 번도 실행되지 않는다.
 */
const 중화됨 = fullUnit.crt === crt;

const 갈리는_변이: {
  label: string;
  impl: Ref;
  cases: [bigint[], bigint[]][];
}[] = [
  {
    label: "unit 을 m 으로 잡은 판",
    impl: fullUnit,
    cases: [[SHARED_OK_R, SHARED_OK_M]],
  },
  {
    label: "모순 판정을 지운 판",
    impl: noGuard,
    cases: [[SHARED_BAD_R, SHARED_OK_M]],
  },
  {
    label: "부호가 남는 나머지를 쓴 판",
    impl: rawRemainder,
    cases: [[WALK_R, WALK_M]],
  },
];

// 하나도 안 갈리면 그 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (!중화됨) {
  for (const { label, impl, cases } of 갈리는_변이) {
    if (cases.every(([r, m]) => same(crt(r, m), impl.crt(r, m)))) {
      throw new Error(`${label} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
    }
  }
}

/**
 * 변이를 건 **그 줄을 이 입력이 몇 번 지나가는가.** 정본의 계측 기록(`trace`)에서 센다 — 모순 판정 줄은 합치기
 * 마다 한 번, `unit` 줄과 `t` 줄은 모순이 아닌 합치기마다 한 번이다. 「같다」가 「변이가 무해하다」인지
 * 「그 줄을 한 번도 지나가지 않았다」인지를 가른다.
 */
function visits(
  remainders: bigint[],
  moduli: bigint[],
): { guard: number; unit: number; t: number } {
  const { merges } = trace(remainders, moduli);
  const passed = merges.filter((g) => g.ok).length;
  return { guard: merges.length, unit: passed, t: passed };
}

/** 변이 하나를 입력 여럿에 걸어 정본과 나란히 놓는다. */
function mutantTable(
  label: string,
  impl: Ref,
  site: "guard" | "unit" | "t",
): string {
  const rows: string[][] = [
    ["입력", "정본", label, "바꾼 줄을 지나간 횟수", "판정"],
  ];
  for (const [name, r, m] of FOUR) {
    const ok = crt(r, m);
    const bad = impl.crt(r, m);
    rows.push([
      name,
      show(ok),
      show(bad),
      num(visits(r, m)[site]),
      same(ok, bad) ? "같다" : "어긋난다",
    ]);
  }
  return table(rows, [3]).join("\n");
}

/* ────────────────────────── 블록 ────────────────────────── */

/** 전체 컨셉 — 전개 입력의 답과 그 확인. */
function conceptTask(): string {
  const got = crt([...WALK_R], [...WALK_M]);
  if (got === null) throw new Error("전개 입력에 답이 없다");
  const lines = [
    `crt([${WALK_R.map((v) => `${v}n`).join(", ")}], [${WALK_M.map((v) => `${v}n`).join(", ")}])   →   { x: ${got.x}n, M: ${got.M}n }`,
    "",
  ];
  const rows: string[][] = [];
  for (const [i, m] of WALK_M.entries()) {
    rows.push([
      `${got.x} = ${m} × ${got.x / m} + ${got.x % m}`,
      `${m}${으로(m)} 나눈 나머지 ${got.x % m} · 요구한 나머지 ${WALK_R[i]}`,
    ]);
  }
  const next = got.x + got.M;
  rows.push([
    `${got.x} + ${got.M} = ${next}`,
    `${next}${을를(next)} ${WALK_M.join(" · ")}${으로(WALK_M.at(-1) as bigint)} 나눈 나머지 ${WALK_M.map((m) => next % m).join(" · ")} — 세 합동식을 그대로 만족한다`,
  ]);
  return [...lines, ...table(rows)].join("\n");
}

/** 전체 컨셉 — 두 방법의 비용을 결과만. */
function conceptCost(): string {
  const naive = byListing([...WALK_R], [...WALK_M]);
  const merged = divisions([...WALK_R], [...WALK_M]).count;
  const [a, b] = BIG_PAIR;
  const bigM = lcmAll(BIG_PAIR);
  const bigMerged = divisions([a - 1n, b - 1n], [a, b]).count;
  const rows = [
    [`위 입력 ${inputOf(WALK_R, WALK_M)}`, num(naive.divisions), num(merged)],
    [`법 둘 ${num(a)} · ${num(b)}`, `${num(bigM / a)} 이상`, num(bigMerged)],
  ];
  return withNote(
    md(
      ["입력", "후보를 차례로 만들어 보기의 나눗셈", "합동식 합치기의 나눗셈"],
      rows,
      [1, 2],
    ),
    `둘째 줄은 나머지를 둘 다 법 − 1 로 두어 답이 M − 1 인 입력이고, 후보 만들기의 나눗셈은 끝까지 만들지 않고 후보 수 M / ${num(a)}${으로(num(a))} 센 하한입니다. 초당 1 억 번이면 ${duration(bigM / a)}입니다.`,
  );
}

/** 가장 단순한 방법을 전개 입력에 실제로 실행한 자취. */
function naiveWalk(): string {
  const want = WALK_R.map((r, i) => mod(r, WALK_M[i] as bigint));
  const M = lcmAll(WALK_M);
  const m0 = WALK_M[0] as bigint;
  const rows: string[][] = [];
  for (let x = want[0] as bigint; x < M; x += m0) {
    const cells: string[] = [num(x)];
    let ok = true;
    for (let i = 1; i < WALK_M.length; i++) {
      if (!ok) {
        cells.push("—");
        continue;
      }
      const got = x % (WALK_M[i] as bigint);
      ok = got === want[i];
      cells.push(`${got} ${ok ? "맞다" : "아니다"}`);
    }
    rows.push(cells);
    if (ok) break;
  }
  const run = byListing([...WALK_R], [...WALK_M]);
  if (run.tried !== rows.length)
    throw new Error("자취와 세는 판의 후보 수가 다르다");
  const head = [
    "후보 x",
    ...WALK_M.slice(1).map((m, i) => `x mod ${m} (요구 ${want[i + 1]})`),
  ];
  return withNote(
    md(head, rows, [0]),
    `후보 ${num(run.tried)} 개를 만들고 나머지를 ${num(run.checks)} 번 확인해 ${run.found} 에서 멈췄습니다. 주기와 나머지 맞춤까지 더한 나눗셈은 ${num(run.divisions)} 번입니다.`,
  );
}

/** 가장 단순한 방법의 규모 — 합동식이 늘 때와 법이 커질 때. */
function naiveScale(): string {
  const ps = primes(15);
  const rows: string[][] = [];
  // 작은 줄은 실제로 끝까지 만들어 센 값과 셈이 같은지 확인한다.
  for (const k of [2, 4, 6, 8, 10, 12, 15]) {
    const ms = ps.slice(0, k);
    const M = lcmAll(ms);
    const m0 = ms[0] as bigint;
    const count = M / m0;
    if (k <= 6) {
      const run = byListing(
        ms.map((m) => m - 1n),
        ms,
      );
      if (BigInt(run.tried) !== count) {
        throw new Error(
          `k = ${k} 에서 셈 ${count} 과 실제 후보 수 ${run.tried} 가 다르다`,
        );
      }
    }
    rows.push([
      k <= 3
        ? `소수 ${k} 개 ${ms.join(" · ")}`
        : `소수 ${k} 개 ${ms.slice(0, 2).join(" · ")} · … · ${ms[k - 1]}`,
      num(M),
      num(count),
      duration(count),
    ]);
  }
  const [a, b] = BIG_PAIR;
  const bigM = lcmAll(BIG_PAIR);
  rows.push([
    `법 둘 ${num(a)} · ${num(b)}`,
    num(bigM),
    num(bigM / a),
    duration(bigM / a),
  ]);
  return withNote(
    md(
      ["법 목록", "주기 M", "후보 수 M / m₁", "초당 1 억 번일 때"],
      rows,
      [1, 2, 3],
    ),
    "나머지는 모두 법 − 1 로 두었습니다. 답이 M − 1 이라 마지막 후보까지 가야 합니다. 소수 6 개까지는 끝까지 만들어 센 후보 수가 셈 M / m₁ 과 같았고, 그 위는 셈으로 냈습니다.",
  );
}

/** 첫 두 합동식을 함께 만족하는 값 — 주기 안에서 전부. */
function originPair(): string {
  const a: [bigint, bigint] = [WALK_R[0] as bigint, WALK_M[0] as bigint];
  const b: [bigint, bigint] = [WALK_R[1] as bigint, WALK_M[1] as bigint];
  const span = lcmAll(WALK_M);
  const xs = bothIn(span, a, b);
  const gaps = xs.slice(1).map((x, i) => x - (xs[i] as bigint));
  const got = crt([a[0], b[0]], [a[1], b[1]]);
  if (got === null) throw new Error("첫 두 합동식이 모순이다");
  return [
    `0 부터 ${span - 1n} 까지에서 ${cong(...a)} 과 ${cong(...b)} 를 함께 만족하는 x`,
    `  ${xs.join(" · ")}`,
    `이웃한 두 값의 차   ${gaps.join(" · ")}`,
    `lcm(${a[1]}, ${b[1]}) = ${lcmAll([a[1], b[1]])} · crt([${a[0]}n, ${b[0]}n], [${a[1]}n, ${b[1]}n]) = { x: ${got.x}n, M: ${got.M}n }`,
  ].join("\n");
}

/** 기준 합동식을 바꿔 본다 — 후보 수는 무엇에 달렸는가. */
function naiveBase(): string {
  const M = lcmAll(WALK_M);
  const rows: string[][] = [];
  for (let base = 0; base < WALK_M.length; base++) {
    const run = byListing([...WALK_R], [...WALK_M], base);
    const mb = WALK_M[base] as bigint;
    rows.push([
      cong(WALK_R[base] as bigint, mb),
      num(run.tried),
      num(run.divisions),
      num(M / mb),
      run.found === null ? "없다" : num(run.found),
    ]);
  }
  return withNote(
    md(
      [
        "기준으로 삼은 합동식",
        "만든 후보 수",
        "나눗셈",
        "M / 기준 법",
        "찾은 x",
      ],
      rows,
      [1, 2, 3, 4],
    ),
    `세 기준 모두 같은 ${num(crt([...WALK_R], [...WALK_M])?.x ?? 0n)}${을를(num(crt([...WALK_R], [...WALK_M])?.x ?? 0n))} 찾았고, 후보 수는 M / 기준 법을 넘지 않았습니다.`,
  );
}

/** t 를 0, 1, 2, … 로 만들어 보는 판 — 첫 합치기. */
function originTList(): string {
  const g = walk().merges[0];
  if (g === undefined) throw new Error("합치기가 없다");
  const rows: string[][] = [];
  for (let t = 0n; ; t++) {
    const x = g.curR + g.curM * t;
    const ok = x % g.m === g.r;
    rows.push([
      `t = ${t}`,
      `x = ${g.curR} + ${g.curM} × ${t} = ${x}`,
      `${x} mod ${g.m} = ${x % g.m}`,
      ok ? "맞다" : "아니다",
    ]);
    if (ok) {
      if (t !== g.t) throw new Error("만들어 본 t 가 정본의 t 와 다르다");
      break;
    }
  }
  const listed = byListing([WALK_R[0] as bigint, g.r], [g.curM, g.m]).tried;
  if (listed !== rows.length)
    throw new Error("t 를 만든 개수가 후보 x 를 만든 개수와 다르다");
  return [
    ...table(rows),
    `t 를 ${rows.length} 개 만들어 ${g.t} 에서 멈췄다 — 후보 x 를 만든 개수 ${listed}${과와(listed)} 같다`,
  ].join("\n");
}

/** 역원으로 t 를 곧바로 — 첫 합치기. */
function originInverse(): string {
  const g = walk().merges[0];
  if (g === undefined) throw new Error("합치기가 없다");
  const inv = mod(g.u, g.m);
  if (mod(g.curM * inv, g.m) !== 1n) throw new Error("u 가 역원이 아니다");
  return table([
    [`curM = ${g.curM} · m = ${g.m}`, `diff = ${g.r} − ${g.curR} = ${g.diff}`],
    [
      `${g.curM} × u ≡ 1 (mod ${g.m}) 인 u = ${inv}`,
      `${g.curM} × ${inv} = ${g.curM * inv} = ${g.m} × ${(g.curM * inv) / g.m} + 1`,
    ],
    [
      `t = ${g.diff} × ${inv} mod ${g.m} = ${mod(g.diff * inv, g.m)}`,
      "만들어 본 t 와 같다",
    ],
    [
      `x = ${g.curR} + ${g.curM} × ${g.t} = ${g.nextR}`,
      `합친 결과는 ${cong(g.nextR as bigint, g.nextM as bigint)}`,
    ],
  ]).join("\n");
}

/** 서로소가 아닌 두 합동식 — 역원이 없고, g 로 나누면 갈린다. */
function originShared(): string {
  const cases: [bigint, bigint, bigint, bigint][] = [
    [2n, 6n, 5n, 9n],
    [2n, 6n, 4n, 9n],
  ];
  const rows: string[][] = [];
  for (const [r1, m1, r2, m2] of cases) {
    const g = gcdBig(m1, m2);
    const diff = r2 - r1;
    const invs: bigint[] = [];
    for (let u = 0n; u < m2; u++) if (mod(m1 * u, m2) === 1n) invs.push(u);
    const span = lcmAll([m1, m2]);
    const xs = bothIn(span, [r1, m1], [r2, m2]);
    rows.push([
      `${cong(r1, m1)} · ${cong(r2, m2)}`,
      num(g),
      invs.length === 0 ? `없다 (u = 0 … ${m2 - 1n})` : invs.join(" · "),
      num(diff),
      num(mod(diff, g)),
      xs.length === 0 ? `없다 (0 … ${span - 1n})` : xs.join(" · "),
      show(crt([r1, r2], [m1, m2])),
    ]);
  }
  return withNote(
    md(
      [
        "합동식 둘",
        "g",
        `${cases[0]?.[1]} · u ≡ 1 (mod ${cases[0]?.[3]}) 인 u`,
        "diff",
        "diff mod g",
        "주기 안에서 둘 다 맞는 x",
        "정본",
      ],
      rows,
      [1, 3, 4],
    ),
    "두 줄 모두 역원이 없습니다. 둘을 가르는 것은 diff mod g 하나이고, 그 값이 0 인 줄에만 해가 있습니다.",
  );
}

/* ───────────── 아이디어 상세 — 누적 합동식 ───────────── */

/** 누적 합동식 셋 — 합동식 0 … i 를 모두 만족하는가. */
function buildRows(): string {
  const tr = walk();
  const curR = [tr.first.curR, ...tr.merges.map((g) => g.nextR as bigint)];
  const curM = [tr.first.curM, ...tr.merges.map((g) => g.nextM as bigint)];
  const rows: string[][] = [];
  let ok = 0;
  for (let i = 0; i < WALK_M.length; i++) {
    const R = curR[i] as bigint;
    const M = curM[i] as bigint;
    const checks = WALK_M.slice(0, i + 1).map(
      (m, j) => R % m === mod(WALK_R[j] as bigint, m),
    );
    const lcm = lcmAll(WALK_M.slice(0, i + 1));
    if (checks.every(Boolean) && lcm === M) ok++;
    rows.push([
      `칸 ${i}`,
      WALK_M.slice(0, i + 1)
        .map((m, j) => cong(WALK_R[j] as bigint, m))
        .join(" · "),
      cong(R, M),
      WALK_M.slice(0, i + 1)
        .map((m) => `${R} mod ${m} = ${R % m}`)
        .join(" · "),
      num(lcm),
    ]);
  }
  return withNote(
    md(
      [
        "칸",
        "합친 입력 합동식",
        "누적 합동식",
        "curR 을 각 법으로 나눈 나머지",
        "합친 법들의 최소공배수",
      ],
      rows,
      [4],
    ),
    `${WALK_M.length} 칸 가운데 curR 이 합친 합동식을 모두 만족하고 curM 이 합친 법들의 최소공배수인 칸이 ${ok} 개입니다.`,
  );
}

/** 누적 합동식 하나를 읽는 법 — 칸 1. */
function buildRead(): string {
  const g = walk().merges[0];
  if (g === undefined) throw new Error("합치기가 없다");
  const R = g.nextR as bigint;
  const M = g.nextM as bigint;
  const members = [0n, 1n, 2n, 3n].map((k) => R + M * k);
  return table([
    ["칸 1", cong(R, M)],
    ["값으로 펴면", `${members.join(" · ")} · … — ${M} 씩 떨어진 수 전부`],
    [
      "두 합동식",
      members
        .map((x) => `${x} mod ${WALK_M[0]} = ${x % (WALK_M[0] as bigint)}`)
        .join(" · "),
    ],
    [
      "",
      members
        .map((x) => `${x} mod ${WALK_M[1]} = ${x % (WALK_M[1] as bigint)}`)
        .join(" · "),
    ],
    [
      "정본 기록",
      `합치기 1 이 curR = ${g.curR}${을를(g.curR)} curM = ${g.curM} 씩 ${g.t} 번 옮겨 채운 칸`,
    ],
  ]).join("\n");
}

/** 이웃 칸끼리의 관계 — 옮긴 양은 옛 curM 의 배수, 새 curM 은 옛 curM 의 unit 배. */
function buildNeighbor(): string {
  const rows: string[][] = [];
  for (const [label, r, m] of [FOUR[0], FOUR[1]] as [
    string,
    bigint[],
    bigint[],
  ][]) {
    for (const g of trace(r, m).merges) {
      if (!g.ok) continue;
      const nextR = g.nextR as bigint;
      const nextM = g.nextM as bigint;
      rows.push([
        label,
        `${cong(g.curR, g.curM)} → ${cong(nextR, nextM)}`,
        `${nextR} − ${g.curR} = ${nextR - g.curR} = ${g.curM} × ${g.t}`,
        `${nextM} = ${g.curM} × ${g.unit}`,
        `${g.unit} = ${g.m} / ${g.g}`,
      ]);
    }
  }
  return md(
    [
      "입력",
      "이웃한 두 칸",
      "curR 이 옮긴 양",
      "curM 이 늘어난 배",
      "배 = m / g",
    ],
    rows,
  );
}

/** 헷갈리기 쉬운 모양 — 법의 곱으로 적은 합동식. */
function buildProduct(): string {
  const r: [bigint, bigint] = [
    SHARED_OK_R[0] as bigint,
    SHARED_OK_R[1] as bigint,
  ];
  const m: [bigint, bigint] = [
    SHARED_OK_M[0] as bigint,
    SHARED_OK_M[1] as bigint,
  ];
  const product = m[0] * m[1];
  const both = bothIn(product, [r[0], m[0]], [r[1], m[1]]);
  const got = crt([...r], [...m]);
  if (got === null) throw new Error("합쳐지는 입력이 모순이다");
  const byLcm: bigint[] = [];
  for (let x = got.x; x < product; x += got.M) byLcm.push(x);
  const byProduct: bigint[] = [];
  for (let x = got.x; x < product; x += product) byProduct.push(x);
  const missed = (xs: bigint[]) => both.filter((x) => !xs.includes(x));
  const rows = [
    [
      `최소공배수로 적기 ${cong(got.x, got.M)}`,
      num(got.M),
      byLcm.join(" · "),
      missed(byLcm).length === 0 ? "없다" : missed(byLcm).join(" · "),
    ],
    [
      `곱으로 적기 ${cong(got.x, product)}`,
      num(product),
      byProduct.join(" · "),
      missed(byProduct).length === 0 ? "없다" : missed(byProduct).join(" · "),
    ],
  ];
  return withNote(
    md(
      [
        "적는 법",
        "법",
        `0 … ${product - 1n} 에서 그 합동식이 내놓는 x`,
        "빠뜨린 해",
      ],
      rows,
      [1],
    ),
    `${cong(r[0], m[0])} 과 ${cong(r[1], m[1])} 를 함께 만족하는 x 는 0 … ${product - 1n} 에서 ${both.join(" · ")}${으로(both.at(-1) as bigint)} ${num(both.length)} 개입니다.`,
  );
}

/** 1단계 — 나머지를 [0, m) 로 맞춘다. */
function stage1Mod(): string {
  const cases: [bigint, bigint][] = [
    [2n, 3n],
    [-1n, 3n],
    [7n, 3n],
    [-6n, 7n],
    [4n, 1n],
  ];
  const rows = cases.map(([a, m]) => {
    const pct = a % m;
    const md2 = mod(a, m);
    const via = crt([a], [m]);
    if (via === null || via.x !== md2)
      throw new Error("정본의 첫 합동식 맞춤과 다르다");
    return [
      `${a}`,
      `${m}`,
      `${pct}`,
      pct >= 0n && pct < m ? "예" : "아니요",
      `${md2}`,
      show(via),
    ];
  });
  return md(
    ["r", "m", "r % m", "0 ≤ r % m < m", "mod(r, m)", "crt([r], [m])"],
    rows,
    [0, 1, 2, 4],
  );
}

/** 2단계 — g 가 diff 를 나누는가, 그리고 정의대로 찾은 해. */
function stage2Guard(): string {
  const pairs: [string, bigint, bigint, bigint, bigint][] = [];
  for (const g of walk().merges) {
    pairs.push(["전개 입력", g.curR, g.curM, g.r, g.m]);
  }
  pairs.push(["서로소가 아니다", 2n, 6n, 5n, 9n]);
  pairs.push(["서로소가 아니다", 2n, 6n, 4n, 9n]);
  pairs.push(["법이 같다", 1n, 2n, 0n, 2n]);
  const rows: string[][] = [];
  let agree = 0;
  for (const [label, R, M, r, m] of pairs) {
    const g = gcdBig(M, m);
    const diff = r - R;
    const ok = diff % g === 0n;
    const xs = bothIn(lcmAll([M, m]), [R, M], [r, m]);
    if (ok === xs.length > 0) agree++;
    rows.push([
      label,
      `${cong(R, M)} · ${cong(r, m)}`,
      num(g),
      num(diff),
      num(diff % g),
      ok ? "합친다" : "null",
      xs.length === 0 ? "없다" : xs.join(" · "),
    ]);
  }
  return withNote(
    md(
      [
        "입력",
        "누적 합동식 · 새 합동식",
        "g",
        "diff",
        "diff % g",
        "판정",
        "주기 안에서 둘 다 맞는 x",
      ],
      rows,
      [2, 3, 4],
    ),
    `${rows.length} 쌍 가운데 판정과 정의대로 찾은 해의 유무가 맞는 쌍이 ${agree} 개입니다.`,
  );
}

/** 3단계 — 합치기마다 t 를 푼다. */
function stage3T(): string {
  const rows: string[][] = [];
  for (const [label, r, m] of [FOUR[0], FOUR[1]] as [
    string,
    bigint[],
    bigint[],
  ][]) {
    for (const g of trace(r, m).merges) {
      if (!g.ok) continue;
      const t = g.t as bigint;
      rows.push([
        label.split(" ")[0] === "전개" ? "전개 입력" : "[6,9,4]",
        `${g.curM} · ${g.m}`,
        num(g.g),
        num(g.u),
        `${mod(g.curM * g.u, g.m)}`,
        num(g.diff / g.g),
        num(g.unit as bigint),
        num(t),
        `${mod(g.curM * t, g.m)} · ${mod(g.diff, g.m)}`,
      ]);
    }
  }
  return withNote(
    md(
      [
        "입력",
        "curM · m",
        "g",
        "u",
        "curM·u mod m",
        "diff / g",
        "unit",
        "t",
        "curM·t mod m · diff mod m",
      ],
      rows,
      [2, 3, 4, 5, 6, 7],
    ),
    "네 합치기 모두 curM·u mod m 이 g 와 같고, curM·t 와 diff 를 m 으로 나눈 나머지가 같습니다.",
  );
}

/** 4단계 — 누적 합동식을 늘린다. */
function stage4Grow(): string {
  const rows: string[][] = [];
  for (const [label, r, m] of [FOUR[0], FOUR[1]] as [
    string,
    bigint[],
    bigint[],
  ][]) {
    const tr = trace(r, m);
    for (const g of tr.merges) {
      if (!g.ok) continue;
      const R = g.nextR as bigint;
      const M = g.nextM as bigint;
      const upto = m.slice(0, g.i + 1);
      rows.push([
        label.split(" ")[0] === "전개" ? "전개 입력" : "[6,9,4]",
        cong(g.curR, g.curM),
        `${g.curR} + ${g.curM} × ${g.t} = ${R}`,
        `${g.curM} × ${g.unit} = ${M}`,
        num(lcmAll(upto)),
        R >= 0n && R < M ? "예" : "아니요",
      ]);
    }
  }
  return withNote(
    md(
      [
        "입력",
        "옛 누적 합동식",
        "새 curR",
        "새 curM",
        "합친 법들의 최소공배수",
        "0 ≤ curR < curM",
      ],
      rows,
      [4],
    ),
    "네 합치기 모두 새 curM 이 합친 법들의 최소공배수와 같고, 새 curR 이 [0, curM) 안에 있습니다.",
  );
}

/* ───────────── 수행으로 알아보는 알고리즘 ───────────── */

function walkT1(): string {
  const tr = walk();
  return table([
    ["T1", `moduli[0] = ${tr.moduli[0]}`, `curM = ${tr.first.curM}`],
    [
      "",
      `remainders[0] = ${tr.remainders[0]}`,
      `curR = mod(${tr.remainders[0]}, ${tr.moduli[0]}) = ${tr.first.curR}`,
    ],
    ["", "누적 합동식", `${cong(tr.first.curR, tr.first.curM)} · 나눗셈 1 번`],
  ]).join("\n");
}

function walkGuard(): string {
  const steps = walkSteps();
  const rows: string[][] = [];
  for (const g of walk().merges) {
    const id = steps.find((s) => s.title.startsWith(`diff = ${g.diff}`))?.id;
    rows.push(
      [
        `${id}`,
        `m = ${g.m}, r = ${g.r}`,
        `diff = ${g.r} − ${g.curR} = ${g.diff}`,
      ],
      [
        "",
        `gcd(${g.curM}, ${g.m}) = ${g.g} · u = ${g.u}`,
        `${g.curM} × ${g.u}${을를(g.u)} ${g.m}${으로(g.m)} 나눈 나머지 ${mod(g.curM * g.u, g.m)}`,
      ],
      ["", `${g.diff} % ${g.g} = ${g.diff % g.g}`, "모순이 아니다"],
    );
  }
  return table(rows).join("\n");
}

function walkT(): string {
  const steps = walkSteps();
  const rows: string[][] = [];
  for (const g of walk().merges) {
    const id = steps.find((s) => s.title === `t = ${g.t}`)?.id;
    const raw = (g.diff / g.g) * g.u;
    rows.push(
      [
        `${id}`,
        `unit = ${g.m} / ${g.g} = ${g.unit}`,
        `diff / g = ${g.diff / g.g}`,
      ],
      [
        "",
        `t = mod(${raw}, ${g.unit}) = ${g.t}`,
        raw < 0n
          ? `${raw} % ${g.unit} = ${raw % (g.unit as bigint)} 에 ${g.unit}${을를(g.unit as bigint)} 더했다`
          : "이미 [0, unit) 안이다",
      ],
    );
  }
  return table(rows).join("\n");
}

function walkGrow(): string {
  const steps = walkSteps();
  const rows: string[][] = [];
  for (const g of walk().merges) {
    const R = g.nextR as bigint;
    const M = g.nextM as bigint;
    const id = steps.find((s) => s.title === cong(R, M))?.id;
    const upto = WALK_M.slice(0, g.i + 1);
    rows.push(
      [
        `${id}`,
        `curR = ${g.curR} + ${g.curM} × ${g.t} = ${R}`,
        `curM = ${g.curM} × ${g.unit} = ${M}`,
      ],
      ["", "검산", upto.map((m) => `${R} mod ${m} = ${R % m}`).join(" · ")],
    );
  }
  return table(rows).join("\n");
}

/** 전개 입력과 기대하는 답 — 정본이 낸다. */
function walkInput(): string {
  const got = crt([...WALK_R], [...WALK_M]);
  if (got === null) throw new Error("전개 입력에 답이 없다");
  return [
    `const remainders = [${WALK_R.map((v) => `${v}n`).join(", ")}];`,
    `const moduli = [${WALK_M.map((v) => `${v}n`).join(", ")}];`,
    `// 이 절이 끝나면 { x: ${got.x}n, M: ${got.M}n } 이 나와야 한다`,
  ].join("\n");
}

/** 걸음 여덟 — 조건 판정을 실제 값으로. */
function walkTrace(): string {
  const tr = walk();
  const steps = walkSteps();
  const rows: string[][] = [];
  const t1 = steps[0];
  if (t1 === undefined) throw new Error("걸음이 없다");
  rows.push([
    t1.id,
    t1.title,
    "반복 바깥",
    "①",
    num(tr.first.curR),
    num(tr.first.curM),
  ]);
  let n = 1;
  for (const g of tr.merges) {
    const a = steps[n++];
    const b = steps[n++];
    const c = steps[n++];
    if (a === undefined || b === undefined || c === undefined) {
      throw new Error("걸음 수가 합치기와 맞지 않는다");
    }
    rows.push([
      a.id,
      a.title,
      `\`${g.diff} % ${g.g} !== 0\` 이 **거짓**`,
      "②",
      num(g.curR),
      num(g.curM),
    ]);
    rows.push([
      b.id,
      b.title,
      `\`mod(${(g.diff / g.g) * g.u}, ${g.unit})\` = ${g.t}`,
      "③",
      num(g.curR),
      num(g.curM),
    ]);
    rows.push([
      c.id,
      c.title,
      `curR ← ${g.curR} + ${g.curM} × ${g.t} = ${g.nextR}`,
      "③",
      num(g.nextR as bigint),
      num(g.nextM as bigint),
    ]);
  }
  const last = steps[n];
  if (last === undefined || tr.answer === null)
    throw new Error("마지막 걸음이 없다");
  rows.push([
    last.id,
    last.title,
    `\`${tr.moduli.length} < ${tr.moduli.length}\` 이 **거짓**`,
    "—",
    num(tr.answer.x),
    num(tr.answer.M),
  ]);
  const total = divisions([...WALK_R], [...WALK_M]).count;
  return withNote(
    md(["걸음", "하는 일", "조건 판정", "갈래", "curR", "curM"], rows, [4, 5]),
    `여덟 걸음에서 갈래 ①은 ${rows.filter((r) => r[3] === "①").length} 번, ②는 ${rows.filter((r) => r[3] === "②").length} 번, ③은 ${rows.filter((r) => r[3] === "③").length} 번 실행됐고, 나눗셈은 모두 ${num(total)} 번입니다.`,
  );
}

/** 전체 코드를 여러 입력에 실행한 결과. */
function walkResult(): string {
  const rows: string[][] = [];
  const cases: [string, bigint[], bigint[]][] = [
    ...FOUR,
    ["나머지가 음수인 [-1,-1] mod [3,5]", [-1n, -1n], [3n, 5n]],
    ["법에 1 이 든 [0,3] mod [1,5]", [0n, 3n], [1n, 5n]],
    [
      "큰 소수 둘 [12345,67890] mod [1000000007,998244353]",
      [12_345n, 67_890n],
      [1_000_000_007n, 998_244_353n],
    ],
  ];
  for (const [name, r, m] of cases) {
    const got = crt(r, m);
    rows.push([
      name,
      show(got),
      got === null ? "—" : got.x >= 0n && got.x < got.M ? "예" : "아니요",
      got === null ? "—" : got.M === lcmAll(m) ? "예" : "아니요",
    ]);
  }
  return md(["입력", "반환값", "0 ≤ x < M", "M 이 최소공배수"], rows);
}

/** 모순 판정을 지운 판이 낸 값이 실제로 합동식을 어기는가. */
function pauseGuardCheck(): string {
  const bad = noGuard.crt(SHARED_BAD_R, SHARED_OK_M);
  const rows: string[][] = [];
  let broken = 0;
  for (let i = 0; i < SHARED_OK_M.length; i++) {
    const m = SHARED_OK_M[i] as bigint;
    const want = SHARED_BAD_R[i] as bigint;
    const got = bad === null ? null : mod(bad.x, m);
    if (got !== want) broken++;
    rows.push([
      cong(want, m),
      num(want),
      got === null ? "—" : num(got),
      got === want ? "만족한다" : "만족하지 않는다",
    ]);
  }
  return withNote(
    md(
      ["합동식", "요구하는 나머지", "그 값의 나머지", "만족 여부"],
      rows,
      [1, 2],
    ),
    `지운 판이 낸 값은 ${show(bad)} 이고 정본은 ${show(crt(SHARED_BAD_R, SHARED_OK_M))} 입니다. 세 합동식 가운데 ${broken} 개를 어깁니다.`,
  );
}

/** 배정밀도로 옮기면 어디서 처음 갈리는가 — 작은 소수를 늘려 가는 계열. */
function pauseDouble(): string {
  const ps = primes(15);
  const rows: string[][] = [
    ["합동식 수 k", "주기 M", "M > 2^53", "정본 x", "배정밀도 x", "판정"],
  ];
  for (const k of [3, 12, 13, 14, 15]) {
    const ms = ps.slice(0, k);
    const rs = ms.map((p) => p - 1n);
    const big = crt(rs, ms);
    const dbl = asDouble(
      rs.map((v) => Number(v)),
      ms.map((v) => Number(v)),
    );
    const M = lcmAll(ms);
    rows.push([
      String(k),
      num(M),
      M > SAFE ? "넘는다" : "안 넘는다",
      big === null ? "null" : num(big.x),
      dbl === null ? "null" : num(dbl.x),
      big !== null && dbl !== null && BigInt(dbl.x) === big.x
        ? "같다"
        : "어긋난다",
    ]);
  }
  return table(rows, [0, 1, 3, 4]).join("\n");
}

/* ───────────── 알아 두면 좋은 개념 ───────────── */

function residueMap(): string {
  const ms = [3n, 5n];
  const span = Number(lcmAll(ms));
  const at = <T>(f: (i: number) => T): T[] =>
    Array.from({ length: span }, (_, i) => f(i));
  const back = at((i) => {
    const got = crt(
      ms.map((m) => BigInt(i) % m),
      ms,
    );
    return got === null ? "?" : String(got.x);
  });
  const seen = new Set(at((i) => ms.map((m) => BigInt(i) % m).join(",")));
  const wrong = back.filter((v, i) => v !== String(i)).length;
  const head = ["x", ...at((i) => String(i))];
  const rows = [
    ...ms.map((m) => [`x mod ${m}`, ...at((i) => String(BigInt(i) % m))]),
    ["되돌린 x", ...back],
  ];
  return withNote(
    md(
      head,
      rows,
      Array.from({ length: span }, (_, i) => i + 1),
    ),
    `서로 다른 나머지 쌍이 ${num(seen.size)} 개, 값이 ${num(span)} 개이고, 되돌린 값이 원래 값과 다른 자리는 ${num(wrong)} 개입니다.`,
  );
}

/* ───────────── 경쟁 설계와의 대조 ───────────── */

function altCounts(): string {
  const rows: string[][] = [];
  for (const q of QUERY_COUNTS) {
    const { merge, oneShot } = totals(q);
    rows.push([
      num(q),
      num(merge.divisions),
      num(oneShot.divisions),
      merge.divisions <= oneShot.divisions
        ? "합동식 합치기"
        : "한 번에 합치는 판",
    ]);
  }
  const first = totals(1);
  const last = totals(QUERY_COUNTS[QUERY_COUNTS.length - 1] as number);
  const lastQ = QUERY_COUNTS[QUERY_COUNTS.length - 1] as number;
  const times = (last.merge.divisions / last.oneShot.divisions).toFixed(1);
  return withNote(
    md(
      [
        "질의 수",
        "합동식 합치기의 나눗셈",
        "한 번에 합치는 판의 나눗셈",
        "나눗셈이 적은 쪽",
      ],
      rows,
      [0, 1, 2],
    ),
    `질의 사이에 남기는 추가 칸은 합동식 합치기 ${first.held.merge} 개 · 한 번에 합치는 판 ${first.held.oneShot} 개입니다. 순서는 질의 ${뒤집히는_자리()} 회에서 뒤집히고, 질의 ${num(lastQ)} 회에서는 합동식 합치기의 나눗셈이 한 번에 합치는 판의 ${times} 배입니다.`,
  );
}

function altRange(): string {
  const cases: [bigint[], bigint[]][] = [
    [WALK_R, WALK_M],
    [SHARED_OK_R, SHARED_OK_M],
    [
      [2n, 2n],
      [6n, 4n],
    ],
  ];
  const rows: string[][] = [];
  for (const [r, m] of cases) {
    let coprime = true;
    for (let i = 0; i < m.length; i++) {
      for (let j = i + 1; j < m.length; j++) {
        if (gcdBig(m[i] as bigint, m[j] as bigint) !== 1n) coprime = false;
      }
    }
    const pre = prepare(m, { divisions: 0 });
    rows.push([
      `[${m.join(", ")}]`,
      coprime ? "예" : "아니요",
      show(crt(r, m)),
      pre === null ? "역원이 없어 답을 못 낸다" : "답을 낸다",
    ]);
  }
  return md(
    ["법 목록", "쌍마다 서로소", "합동식 합치기", "한 번에 합치는 판"],
    rows,
  );
}

/* ───────────── 수식 정의와 유도 ───────────── */

function mathCheck(): string {
  const tr = walk();
  const rows: string[][] = [
    [
      "i",
      "m_i",
      "g_i",
      "m_i / g_i",
      "t_i",
      "C_(i-1) · t_i",
      "R_i",
      "C_i",
      "lcm(m_1..m_i)",
    ],
  ];
  rows.push([
    "1",
    num(tr.moduli[0] as bigint),
    "—",
    "—",
    "—",
    "—",
    num(tr.first.curR),
    num(tr.first.curM),
    num(lcmAll(tr.moduli.slice(0, 1))),
  ]);
  for (const g of tr.merges) {
    rows.push([
      String(g.i + 1),
      num(g.m),
      num(g.g),
      num(g.unit as bigint),
      num(g.t as bigint),
      num(g.curM * (g.t as bigint)),
      num(g.nextR as bigint),
      num(g.nextM as bigint),
      num(lcmAll(tr.moduli.slice(0, g.i + 1))),
    ]);
  }
  return table(rows, [0, 1, 2, 3, 4, 5, 6, 7, 8]).join("\n");
}

/** 걸음이 만드는 두 곱이 M 과 어떻게 비교되는가 — 작은 값 전수. */
function mathPeak(): string {
  const groups: [string, () => Iterable<[bigint[], bigint[]]>][] = [
    [
      "법 둘을 1..40 으로 전수 · 나머지도 전수",
      function* () {
        for (let a = 1n; a <= 40n; a++)
          for (let b = 1n; b <= 40n; b++)
            for (let x = 0n; x < a; x++)
              for (let y = 0n; y < b; y++)
                yield [
                  [x, y],
                  [a, b],
                ];
      },
    ],
    [
      "법 셋을 1..14 로 전수 · 나머지도 전수",
      function* () {
        for (let a = 1n; a <= 14n; a++)
          for (let b = 1n; b <= 14n; b++)
            for (let c = 1n; c <= 14n; c++)
              for (let x = 0n; x < a; x++)
                for (let y = 0n; y < b; y++)
                  for (let z = 0n; z < c; z++)
                    yield [
                      [x, y, z],
                      [a, b, c],
                    ];
      },
    ],
  ];
  const rows: string[][] = [];
  for (const [name, gen] of groups) {
    let solved = 0;
    let shiftOver = 0;
    let solveOver = 0;
    let worst = 0;
    for (const [r, m] of gen()) {
      // 기록 없이 값만 따라간다 — 입력이 백만 가까이라 걸음마다 무엇을 베끼지 않는다.
      let curM = m[0] as bigint;
      let curR = mod(r[0] as bigint, curM);
      let over = 0n;
      let shift = 0n;
      let bad = false;
      for (let i = 1; i < m.length; i++) {
        const mi = m[i] as bigint;
        const ri = mod(r[i] as bigint, mi);
        const diff = ri - curR;
        let r0 = curM;
        let r1 = mi;
        let s0 = 1n;
        let s1 = 0n;
        while (r1 !== 0n) {
          const q = r0 / r1;
          [r0, r1] = [r1, r0 - q * r1];
          [s0, s1] = [s1, s0 - q * s1];
        }
        const g = r0;
        if (diff % g !== 0n) {
          bad = true;
          break;
        }
        const unit = mi / g;
        const solvedProduct = (diff / g) * s0;
        const t = mod(solvedProduct, unit);
        const abs = solvedProduct < 0n ? -solvedProduct : solvedProduct;
        if (abs > over) over = abs;
        if (curM * t > shift) shift = curM * t;
        curR = curR + curM * t;
        curM = curM * unit;
      }
      const truth = crt(r, m);
      if (bad) {
        if (truth !== null) throw new Error("값만 따라간 사본이 정본과 다르다");
        continue;
      }
      if (truth === null || truth.x !== curR || truth.M !== curM) {
        throw new Error("값만 따라간 사본이 정본과 다르다");
      }
      solved++;
      if (shift >= curM) shiftOver++;
      if (over > curM) {
        solveOver++;
        worst = Math.max(worst, Number(over) / Number(curM));
      }
    }
    rows.push([
      name,
      num(solved),
      num(shiftOver),
      num(solveOver),
      worst === 0 ? "—" : `${worst.toFixed(2)} 배`,
    ]);
  }
  return md(
    [
      "입력 묶음",
      "해가 있는 입력",
      "curM × t 가 M 이상인 입력",
      "(diff / g) × u 의 절댓값이 M 을 넘은 입력",
      "그 최대 비",
    ],
    rows,
    [1, 2, 3, 4],
  );
}

/** 과제 규모에서 주기 M 이 얼마가 되는가. */
function mathScale(): string {
  const rows: string[][] = [];
  for (const k of [2, 3, 5, 10]) {
    const M = LIMIT ** BigInt(k);
    rows.push([
      String(k),
      `10^${18 * k}`,
      num(M.toString().length),
      num(M.toString().length - SAFE.toString().length),
    ]);
  }
  return withNote(
    md(
      ["합동식 수 k", "주기 M 의 상한", "그 자릿수", "2^53 보다 많은 자릿수"],
      rows,
      [0, 2, 3],
    ),
    `법 하나의 상한은 10^18 이고, 2^53 = ${num(SAFE)} 은 ${SAFE.toString().length} 자리입니다.`,
  );
}

/** 닫힌 형태에 S = 2^53 을 넣는다. */
function mathRoot(): string {
  const S = Number(SAFE);
  const inside = 1n + 4n * SAFE;
  const root = Math.sqrt(1 + 4 * S);
  const bound = (root - 1) / 2;
  let closed = 1n;
  while (closed * (closed + 1n) <= SAFE) closed++;
  if (BigInt(Math.ceil(bound)) !== closed) {
    throw new Error("닫힌 형태의 올림이 정수 셈과 다르다");
  }
  return table([
    ["1 + 4S", `= ${num(inside)}`, ""],
    ["그 제곱근", `= ${root.toFixed(4)}…`, "정수가 아니다"],
    ["(제곱근 − 1) / 2", `= ${bound.toFixed(4)}…`, ""],
    ["그 위 첫 정수", `= ${num(closed)}`, "m(m+1) > S 를 정수로 푼 값과 같다"],
  ]).join("\n");
}

/** 이웃한 두 법 계열 — 닫힌 형태가 낸 자리와 실측이 같은가. */
function mathFlip(): string {
  let closed = 1n;
  while (closed * (closed + 1n) <= SAFE) closed++;
  const rows: string[][] = [
    ["m", "M = m(m+1)", "M > 2^53", "정본 x", "배정밀도 x", "판정"],
  ];
  for (const m of [
    Number(closed) - 2,
    Number(closed) - 1,
    Number(closed),
    Number(closed) + 1,
  ]) {
    const { r, mods, M } = neighbourPair(m);
    const big = crt(r.map(BigInt), mods.map(BigInt));
    const dbl = asDouble(r, mods);
    rows.push([
      num(m),
      num(M),
      M > SAFE ? "넘는다" : "안 넘는다",
      big === null ? "null" : num(big.x),
      dbl === null ? "null" : num(dbl.x),
      big !== null && dbl !== null && BigInt(dbl.x) === big.x
        ? "같다"
        : "어긋난다",
    ]);
  }
  let earlier = 0;
  const SWEEP = 200_000;
  for (let m = Number(closed) - SWEEP; m < Number(closed); m++) {
    if (neighbourDiffers(m)) earlier++;
  }
  return [
    ...table(rows, [0, 1, 3, 4]),
    `닫힌 형태가 낸 첫 자리 ${num(closed)} · 그 아래 ${num(SWEEP)} 칸 중 갈리는 자리 ${num(earlier)} 개`,
  ].join("\n");
}

/* ───────────── 불변식 ───────────── */

function invariantSets(): string {
  const tr = walk();
  const steps = walkSteps();
  const states: [string, bigint, bigint, number][] = [
    [steps[0]?.id ?? "", tr.first.curR, tr.first.curM, 1],
    ...tr.merges.map(
      (g) =>
        [
          steps.find(
            (s) => s.title === cong(g.nextR as bigint, g.nextM as bigint),
          )?.id ?? "",
          g.nextR as bigint,
          g.nextM as bigint,
          g.i + 1,
        ] as [string, bigint, bigint, number],
    ),
  ];
  const SPAN = 45n;
  const rows: string[][] = [
    ["걸음", "누적 합동식", "읽은 합동식", `0 … ${SPAN} 에서 그 집합`],
  ];
  for (const [id, R, M, k] of states) {
    const members: bigint[] = [];
    for (let x = R; x <= SPAN; x += M) members.push(x);
    const all: bigint[] = [];
    for (let x = 0n; x <= SPAN; x++) {
      if (
        WALK_M.slice(0, k).every(
          (m, j) => x % m === mod(WALK_R[j] as bigint, m),
        )
      )
        all.push(x);
    }
    if (all.join(",") !== members.join(","))
      throw new Error("누적 합동식의 집합이 정의대로의 집합과 다르다");
    rows.push([
      id,
      cong(R, M),
      WALK_M.slice(0, k)
        .map((m, j) => cong(WALK_R[j] as bigint, m))
        .join(" · "),
      members.join(" · "),
    ]);
  }
  return [
    ...table(rows),
    "넷째 열은 읽은 합동식을 정의대로 모두 확인해 모은 값과 같다",
  ].join("\n");
}

function edgeValues(): string {
  const cases: [string, bigint[], bigint[], string][] = [
    [
      "[5] mod [7]",
      [5n],
      [7n],
      "합동식이 하나라 합치기가 한 번도 실행되지 않는다",
    ],
    [
      "[0,3] mod [1,5]",
      [0n, 3n],
      [1n, 5n],
      "법 1 은 모든 정수를 받아 조건이 되지 않는다",
    ],
    [
      "[-1,-1] mod [3,5]",
      [-1n, -1n],
      [3n, 5n],
      "나머지가 음수라 첫 줄의 맞춤이 실행된다",
    ],
    [
      "[0,0] mod [4,6]",
      [0n, 0n],
      [4n, 6n],
      "서로소가 아니고 나머지 차가 0 이다",
    ],
    [
      "[1,0] mod [2,2]",
      [1n, 0n],
      [2n, 2n],
      "같은 법에 다른 나머지라 반드시 모순이다",
    ],
    [
      "[3,3] mod [12,18]",
      [3n, 3n],
      [12n, 18n],
      "최대공약수가 6 이고 두 법 다 합성수다",
    ],
    [
      "[2,2,2] mod [4,4,4]",
      [2n, 2n, 2n],
      [4n, 4n, 4n],
      "법이 전부 같아 주기가 늘지 않는다",
    ],
  ];
  return md(
    ["입력", "반환값", "경계인 까닭"],
    cases.map(([name, r, m, why]) => [name, show(crt(r, m)), why]),
  );
}

function invariantSteps(): string {
  const groups: [string, () => Iterable<[bigint[], bigint[]]>][] = [
    [
      "전개 입력 하나",
      function* () {
        yield [WALK_R, WALK_M];
      },
    ],
    [
      "법 셋을 1..12 로 전수",
      function* () {
        for (let a = 1n; a <= 12n; a++)
          for (let b = 1n; b <= 12n; b++)
            for (let c = 1n; c <= 12n; c++)
              yield [
                [a - 1n, b - 1n, c - 1n],
                [a, b, c],
              ];
      },
    ],
    [
      "법 둘을 1..40 으로 전수 · 나머지도 전수",
      function* () {
        for (let a = 1n; a <= 40n; a++)
          for (let b = 1n; b <= 40n; b++)
            for (let x = 0n; x < a; x++)
              for (let y = 0n; y < b; y++)
                yield [
                  [x, y],
                  [a, b],
                ];
      },
    ],
  ];
  const rows: string[][] = [];
  for (const [name, gen] of groups) {
    let seen = 0;
    let outOfRange = 0;
    let notLcm = 0;
    let notAll = 0;
    for (const [r, m] of gen()) {
      const tr = trace(r, m);
      if (tr.answer === null) continue;
      const states: [bigint, bigint, number][] = [
        [tr.first.curR, tr.first.curM, 1],
        ...tr.merges.map(
          (g) =>
            [g.nextR as bigint, g.nextM as bigint, g.i + 1] as [
              bigint,
              bigint,
              number,
            ],
        ),
      ];
      for (const [R, M, k] of states) {
        seen++;
        if (!(R >= 0n && R < M)) outOfRange++;
        if (M !== lcmAll(m.slice(0, k))) notLcm++;
        if (!m.slice(0, k).every((mi, j) => R % mi === mod(r[j] as bigint, mi)))
          notAll++;
      }
    }
    rows.push([name, num(seen), num(notAll), num(outOfRange), num(notLcm)]);
  }
  return md(
    [
      "입력 묶음",
      "확인한 누적 합동식",
      "읽은 합동식을 어긴 것",
      "0 ≤ curR < curM 을 어긴 것",
      "curM 이 최소공배수가 아닌 것",
    ],
    rows,
    [1, 2, 3, 4],
  );
}

/** 부호가 남는 나머지를 쓴 판이 합치기마다 어떤 t 를 내는가. */
function mutantTSteps(): string {
  /** 두 판을 나란히 굴리며 합치기마다의 t 와 curR 을 낸다. */
  function pair(remainders: bigint[], moduli: bigint[]) {
    const ext = (a: bigint, b: bigint): { g: bigint; x: bigint } => {
      let r0 = a;
      let r1 = b;
      let s0 = 1n;
      let s1 = 0n;
      while (r1 !== 0n) {
        const q = r0 / r1;
        [r0, r1] = [r1, r0 - q * r1];
        [s0, s1] = [s1, s0 - q * s1];
      }
      return { g: r0, x: s0 };
    };
    let okM = moduli[0] as bigint;
    let okR = mod(remainders[0] as bigint, okM);
    let badM = okM;
    let badR = okR;
    const out: {
      i: number;
      diffOk: bigint;
      diffBad: bigint;
      tOk: bigint;
      tBad: bigint;
      okR: bigint;
      badR: bigint;
    }[] = [];
    for (let i = 1; i < moduli.length; i++) {
      const m = moduli[i] as bigint;
      const r = mod(remainders[i] as bigint, m);
      const a = ext(okM, m);
      const diffOk = r - okR;
      if (diffOk % a.g !== 0n) break;
      const unitOk = m / a.g;
      const tOk = mod((diffOk / a.g) * a.x, unitOk);
      const b = ext(badM, m);
      const diffBad = r - badR;
      const unitBad = m / b.g;
      const tBad = ((diffBad / b.g) * b.x) % unitBad;
      okR = okR + okM * tOk;
      okM = okM * unitOk;
      badR = badR + badM * tBad;
      badM = badM * unitBad;
      out.push({ i, diffOk, diffBad, tOk, tBad, okR, badR });
    }
    return out;
  }
  const rows: string[][] = [
    [
      "입력",
      "합치기",
      "정본 diff",
      "변이 diff",
      "정본 t",
      "변이 t",
      "정본 curR",
      "변이 curR",
    ],
  ];
  for (const [name, r, m] of [FOUR[0], FOUR[1]] as [
    string,
    bigint[],
    bigint[],
  ][]) {
    const steps = pair(r, m);
    const truth = trace(r, m);
    for (const [n, step] of steps.entries()) {
      if (truth.merges[n]?.t !== step.tOk)
        throw new Error("사본의 정본 쪽 t 가 정본 기록과 다르다");
    }
    if (!중화됨) {
      const last = steps[steps.length - 1];
      const real = rawRemainder.crt(r, m);
      if (last === undefined || real === null || real.x !== last.badR) {
        throw new Error(`${name} — 사본이 기계로 만든 변이와 다른 값을 냈다`);
      }
    }
    for (const step of steps) {
      rows.push([
        name,
        `${step.i} 번째`,
        num(step.diffOk),
        num(step.diffBad),
        num(step.tOk),
        num(step.tBad),
        num(step.okR),
        num(step.badR),
      ]);
    }
  }
  return table(rows, [2, 3, 4, 5, 6, 7]).join("\n");
}

/* ───────────── 비용 계산 ───────────── */

/** 전개 입력의 걸음마다 나눗셈. */
function perfDivisions(): string {
  const tr = walk();
  const steps = walkSteps();
  const rows: string[][] = [];
  rows.push([steps[0]?.id ?? "", "첫 나머지 맞춤 mod", "1", "—"]);
  let n = 1;
  let total = 1;
  for (const g of tr.merges) {
    const ext = divisions([g.curR, g.r], [g.curM, g.m]).gcdSteps[0] as number;
    const a = steps[n++];
    const b = steps[n++];
    const c = steps[n++];
    rows.push([
      a?.id ?? "",
      "나머지 맞춤 1 · 확장 유클리드 · diff % g 1",
      num(2 + ext),
      `gcd(${g.curM}, ${g.m}) 의 몫 ${ext} 번`,
    ]);
    rows.push([b?.id ?? "", "m / g · diff / g · mod", "3", "—"]);
    rows.push([c?.id ?? "", "곱셈과 덧셈만", "0", "—"]);
    total += 2 + ext + 3;
  }
  rows.push([steps[n]?.id ?? "", "반환", "0", "—"]);
  const counted = divisions([...WALK_R], [...WALK_M]).count;
  if (counted !== total) throw new Error("걸음별 합이 세는 사본과 다르다");
  return withNote(
    md(
      ["걸음", "나눗셈이 나오는 자리", "나눗셈", "확장 유클리드의 몫"],
      rows,
      [2],
    ),
    `합은 ${num(total)} 번이고, 세는 사본이 정본과 같은 절차로 센 값도 ${num(counted)} 번입니다.`,
  );
}

/** 합치기 한 번의 확장 유클리드가 상한 4.785·d + 2 를 넘는가 — 규모별로 잰다. */
function perfBound(): string {
  const cases: [string, bigint[], bigint[]][] = [];
  const ps = primes(12);
  cases.push(["전개 입력", WALK_R, WALK_M]);
  cases.push(["소수 12 개 2 … 37", ps.map((p) => p - 1n), ps]);
  cases.push(["10 자리 소수 8 개", MODULI.map((m) => m - 1n), MODULI]);
  const [a, b] = BIG_PAIR;
  cases.push([`법 둘 ${num(a)} · ${num(b)}`, [a - 1n, b - 1n], [a, b]]);
  const rows: string[][] = [];
  let over = 0;
  for (const [name, r, m] of cases) {
    const d = divisions(r, m);
    const D = Math.max(...m.map((v) => v.toString().length));
    const bound = 1 + (m.length - 1) * (4.785 * D + 7);
    if (d.count > bound) over++;
    rows.push([
      name,
      num(m.length),
      num(D),
      num(d.count),
      Math.floor(bound).toLocaleString("en-US"),
      num(Math.max(...d.gcdSteps)),
    ]);
  }
  return withNote(
    md(
      [
        "입력",
        "k",
        "D",
        "나눗셈",
        "1 + (k − 1)(4.785D + 7) 의 정수 부분",
        "가장 긴 확장 유클리드",
      ],
      rows,
      [1, 2, 3, 4, 5],
    ),
    `${rows.length} 입력 가운데 상한을 넘은 입력은 ${over} 개입니다.`,
  );
}

/** 저장 칸 — 정본 소스에서 선언한 값의 이름. */
function perfCells(): string {
  const text = readFileSync(REF, "utf8");
  const names: string[] = [];
  for (const m of text.matchAll(
    /\b(?:let|const)\s+(\{[^}]*\}|\[[^\]]*\]|\w+)/g,
  )) {
    const raw = m[1] as string;
    if (raw.startsWith("{")) {
      for (const part of raw.slice(1, -1).split(",")) {
        const nm = part.split(":").at(-1)?.trim();
        if (nm) names.push(nm);
      }
    } else if (!raw.startsWith("[")) {
      names.push(raw);
    }
  }
  const unique = [...new Set(names)].filter((nm) => nm !== "i");
  return [
    `정본이 선언한 값 ${unique.length} 개   ${unique.join(" · ")}`,
    "반복 번호 i 를 빼면 전부 bigint 이고, 합동식 수 k 와 상관없이 이 개수 그대로다",
  ].join("\n");
}

/** 최악을 만드는 입력 — 모양별로 실제로 재 본다. */
function worstShapes(): string {
  const fib = (n: number): bigint => {
    let x = 0n;
    let y = 1n;
    for (let i = 0; i < n; i++) [x, y] = [y, x + y];
    return x;
  };
  const cases: [string, bigint, bigint][] = [
    [
      "한쪽이 다른 쪽의 배수",
      999_999_999_999_999_999n,
      333_333_333_333_333_333n,
    ],
    ["두 값의 차가 1", LIMIT, LIMIT - 1n],
    ["10 자리 소수 둘", 1_000_000_007n, 998_244_353n],
    ["피보나치 이웃", fib(88), fib(87)],
  ];
  const rows: string[][] = [];
  for (const [name, a, b] of cases) {
    const d = divisions([0n, 0n], [a, b]);
    const other = divisions([1n, 2n], [a, b]);
    rows.push([
      name,
      `${num(a)} 과 ${num(b)}`,
      num(Math.min(a.toString().length, b.toString().length)),
      gcdBig(a, b) === 1n ? "예" : `아니요 (gcd = ${num(gcdBig(a, b))})`,
      num(d.gcdSteps[0] ?? 0),
      num(d.count),
      other.answer === null ? `${num(other.count)} (null)` : num(other.count),
    ]);
  }
  return withNote(
    md(
      [
        "입력 모양",
        "법 둘",
        "작은 쪽 자릿수",
        "서로소",
        "확장 유클리드의 몫",
        "나머지 0 · 0 의 나눗셈",
        "나머지 1 · 2 의 나눗셈",
      ],
      rows,
      [2, 4, 5, 6],
    ),
    "마지막 열에서 null 이 붙은 줄은 모순이라 합치기 중간에 멈춘 입력입니다.",
  );
}

/* ───────────── 스스로 점검하기 ───────────── */

function checkAnswer(): string {
  const cases: [bigint, bigint, bigint, bigint][] = [
    [1n, 4n, 3n, 6n],
    [2n, 4n, 3n, 6n],
    [3n, 4n, 3n, 6n],
    [0n, 4n, 2n, 6n],
  ];
  const rows = cases.map(([r1, m1, r2, m2]) => {
    const g = gcdBig(m1, m2);
    return [
      `${cong(r1, m1)} · ${cong(r2, m2)}`,
      num(g),
      num(r2 - r1),
      num(mod(r2 - r1, g)),
      show(crt([r1, r2], [m1, m2])),
    ];
  });
  const answers = cases.map(([r1, m1, r2, m2]) => crt([r1, r2], [m1, m2]));
  const none = answers.flatMap((a, i) => (a === null ? [i + 1] : []));
  const periods = [
    ...new Set(answers.flatMap((a) => (a === null ? [] : [a.M]))),
  ];
  const [, m1, , m2] = cases[0] as [bigint, bigint, bigint, bigint];
  return withNote(
    md(["합동식 둘", "g", "나머지 차", "차 mod g", "답"], rows, [1, 2, 3]),
    `null 인 줄은 ${none.join(" · ")} 번째 줄뿐이고, 그 줄만 차 mod g 가 0 이 아닙니다. 해가 있는 줄의 주기는 ${periods.join(" · ")}${이가(periods.join(" · "))} lcm(${m1}, ${m2}) = ${lcmAll([m1, m2])}${과와(lcmAll([m1, m2]))} 같고, 곱 ${m1 * m2}${이가(m1 * m2)} 아닙니다.`,
  );
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  "concept-task": conceptTask,
  "concept-cost": conceptCost,
  "naive-walk": naiveWalk,
  "naive-scale": naiveScale,
  "origin-pair": originPair,
  "naive-base": naiveBase,
  "origin-t-list": originTList,
  "origin-inverse": originInverse,
  "origin-shared": originShared,
  "build-rows": buildRows,
  "build-read": buildRead,
  "build-neighbor": buildNeighbor,
  "build-product": buildProduct,
  "stage1-mod": stage1Mod,
  "stage2-guard": stage2Guard,
  "stage3-t": stage3T,
  "stage4-grow": stage4Grow,
  "walk-input": walkInput,
  "walk-t1": walkT1,
  "walk-guard": walkGuard,
  "pause-guard": () => mutantTable("모순 판정을 지운 판", noGuard, "guard"),
  "pause-guard-check": pauseGuardCheck,
  "walk-t": walkT,
  "walk-grow": walkGrow,
  "pause-unit": () => mutantTable("unit 을 m 으로 잡은 판", fullUnit, "unit"),
  "pause-double": pauseDouble,
  "walk-trace": walkTrace,
  "walk-result": walkResult,
  "residue-map": residueMap,
  "alt-counts": altCounts,
  "alt-range": altRange,
  "math-check": mathCheck,
  "math-peak": mathPeak,
  "math-scale": mathScale,
  "math-root": mathRoot,
  "math-flip": mathFlip,
  "invariant-sets": invariantSets,
  "edge-values": edgeValues,
  "invariant-steps": invariantSteps,
  "mutant-t-raw": () =>
    mutantTable("부호가 남는 나머지를 쓴 판", rawRemainder, "t"),
  "mutant-t-steps": mutantTSteps,
  "perf-divisions": perfDivisions,
  "perf-bound": perfBound,
  "perf-cells": perfCells,
  "worst-shapes": worstShapes,
  "check-answer": checkAnswer,
};
