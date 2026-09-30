/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/advanced/countInversions/countInversions-guide.md
 *
 * **이 편의 값은 전부 정수다.** 답도 계수도 정수라 「같다」를 글자 대조로 정할 수 있다. 정수 표현의
 * 한계가 어디인지만 `math-limit` 이 따로 낸다.
 *
 * **걸음 기록은 그림 사이드카의 `trace`·`walkSteps` 에서 받는다** — 그림과 표가 같은 기록을 쓴다. 그
 * 기록은 정본과 같은 절차에 걸음 기록을 덧붙인 사본이 만들고, 사본이 낸 답은 매번 정본과 대조한다.
 * 큰 입력(칸 10 만)은 값만 세는 가벼운 판(`.alt.ts` 의 `합치며_세기`)으로 잰다 — 기록 사본은 합치기마다
 * 배열을 베껴서 그 규모에서는 메모리가 모자란다.
 *
 * **변이가 아무것도 안 바꾸는지 검사하는 자리는 중화 실행을 비켜 간다.** `check-proof` 가 이 파일을 한
 * 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서 「변이가 답을 안 바꿨다」로
 * 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이 모듈의 함수가 정본과 **같은 객체인가**로
 * 알아낸다.
 *
 * 경쟁 설계 대조 표의 값은 `.alt.ts` 를 **불러서** 얻는다 — 같은 값을 두 파일에 적으면 한쪽만 고쳐질 때
 * 표가 조용히 거짓이 된다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  measure,
  N_ALT,
  값범위,
  곱수,
  저장경계,
  합치며_세기,
} from "./countInversions-guide.alt.ts";
import {
  byDefinition,
  crossByDefinition,
  crossPairs,
  divideOnly,
  inversionPairs,
  levelsOf,
  type Merge,
  mergeCount,
  num,
  PER_SECOND,
  pairsOf,
  seconds,
  show,
  trace,
  WALK,
  walkSteps,
  번갈아_꺼내지는,
} from "./countInversions-guide.fig.tsx";
import { countInversions } from "./countInversions-guide.ref.ts";
import { invWalk } from "./countInversions-guide.sim.ts";

const REF = new URL("./countInversions-guide.ref.ts", import.meta.url).pathname;

type Ref = { countInversions: (arr: number[]) => number };

/* ───────────────────────── 표 그리기 ───────────────────────── */

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

/** 증명 블록의 여러 부분 — 표와 문장을 빈 줄로 잇는다. 원고는 그 뒤를 `<!--/proof-->` 로 닫는다(SPEC §12). */
const proofTable = (...parts: string[]): string => parts.join("\n\n");

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 글자 폭으로 칸을 맞춘다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);
const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/** 칸을 맞춘 줄들 — 펜스 안에 둔다. 열 사이는 세 칸이다. */
function columns(rows: string[][]): string {
  const cols = Math.max(...rows.map((r) => r.length));
  const w: number[] = [];
  for (let c = 0; c < cols; c++) {
    w.push(Math.max(...rows.map((r) => width(r[c] ?? ""))));
  }
  return rows
    .map((r) =>
      r
        .map((cell, c) => pad(cell, w[c] ?? 0))
        .join("   ")
        .replace(/\s+$/, ""),
    )
    .join("\n");
}

/**
 * 펜스 블록의 내용 — 대조는 펜스 안쪽 줄만 본다. 언어 태그(`lang`)는 원고의 여는 펜스에 적고, 여기서는
 * 어느 펜스에 들어갈 내용인지 읽는 사람에게 보이려고 받기만 한다.
 */
const fence = (_lang: string, body: string): string => body;

const code = (s: string): string => `\`${s}\``;

/* ───────────────────────── 공통 입력 ───────────────────────── */

/** `deep.build` 의 가르는 자리 비교가 쓰는 입력. 난수도 시드도 없다. */
const BUILD_N = 64;
const BUILD = Array.from({ length: BUILD_N }, (_, q) => (q * 37) % 101);

const 전개 = trace(WALK);
const 걸음 = walkSteps();
const 답 = countInversions(WALK);
const 마지막 = 전개.merges.at(-1) as Merge;

/* 걸음 재생 패널이 이 기록과 같은가 — 프레임마다 제목과 배열을 맞댄다. 어긋나면 아래 걸음 표가 패널과
 * 다른 것을 말한다. */
if (걸음.length !== invWalk.steps.length) {
  throw new Error(
    `실행 걸음 ${걸음.length} 과 시뮬 프레임 ${invWalk.steps.length} 이 다르다`,
  );
}
for (const [index, frame] of invWalk.steps.entries()) {
  const s = 걸음[index] as (typeof 걸음)[number];
  if (
    frame.title !== `${s.id} ${s.title}` ||
    frame.array.join(" ") !== s.stage.array.join(" ")
  ) {
    throw new Error(`프레임 ${index + 1} 이 실행 기록과 다르다`);
  }
}

/**
 * 합치기 `t` 번째가 걸음 몇 번인가 — 앞 합치기 넷은 합치기 하나가 한 걸음(T2~T5)이고, 마지막 합치기는
 * 비교마다 한 걸음과 끝 걸음 하나다. 걸음 기록의 제목에서 되짚지 않고 자리로 센다.
 */
const 앞합치기걸음 = 걸음.slice(1, 전개.merges.length);
const 마지막비교걸음 = 걸음.slice(
  전개.merges.length,
  전개.merges.length + 마지막.cmps.length,
);
const 끝걸음 = 걸음.at(-1) as (typeof 걸음)[number];
if (
  앞합치기걸음.length !== 전개.merges.length - 1 ||
  마지막비교걸음.length !== 마지막.cmps.length ||
  걸음.length !== 1 + 앞합치기걸음.length + 마지막비교걸음.length + 1
) {
  throw new Error("걸음과 합치기의 자리가 맞지 않는다");
}

/* ────────────────────────── 변이 ────────────────────────── */

/** 같은 값을 오른쪽으로 보내는 판 — `<=` 를 `<` 로 바꾼다. */
const 동률판 = await loadMutant<Ref>(REF, {
  swap: [
    /^ {6}if \(\(a\[i\] as number\) <= \(a\[j\] as number\)\) \{$/,
    "      if ((a[i] as number) < (a[j] as number)) {",
  ],
});

/** 오른쪽을 꺼낼 때마다 1 만 더하는 판. */
const 하나씩판 = await loadMutant<Ref>(REF, {
  swap: [/^ {8}count \+= mid - i \+ 1;$/, "        count += 1;"],
});

/** 합친 결과를 제자리에 옮겨 적는 줄을 지운 판. */
const 안적는판 = await loadMutant<Ref>(REF, {
  drop: /^ {4}for \(let x = lo; x <= hi; x\+\+\) a\[x\] = buffer\[x\] as number;$/,
});

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두 함수가 **같은
 * 객체**다. 중화 상태에서 아래 자기검사를 실행하면 언제나 던지게 되고, 그러면 `check-proof` 의 중화
 * 대조가 이 편에서는 한 번도 실행되지 않는다.
 */
const 중화됨 = 동률판.countInversions === countInversions;

if (!중화됨) {
  for (const [label, impl, 입력] of [
    ["같은 값을 오른쪽으로 보내는 판", 동률판, [2, 2]],
    ["오른쪽마다 1 을 더하는 판", 하나씩판, WALK],
    ["제자리에 안 적는 판", 안적는판, WALK],
  ] as [string, Ref, number[]][]) {
    if (countInversions(입력) === impl.countInversions(입력)) {
      throw new Error(`${label} 변이가 답을 바꾸지 못했다`);
    }
  }
}

/** 합치기에서 오른쪽 값을 꺼낸 횟수 — 더하는 줄을 지나간 횟수와 같다. 기록 사본이 센다. */
const 오른쪽_꺼낸_횟수 = (arr: number[]): number =>
  arr.length <= 1
    ? 0
    : trace(arr).merges.reduce(
        (s, m) => s + m.cmps.filter((c) => !c.left).length,
        0,
      );

type 자리 = "비교" | "더한자리" | "옮겨적기";

/** 변이를 건 그 줄을 이 입력이 몇 번 지나가는가. 실행으로 센다. */
function 지나간_횟수(arr: number[]): Record<자리, number> {
  const c = 합치며_세기(arr);
  return {
    비교: c.견주기,
    더한자리: 오른쪽_꺼낸_횟수(arr),
    옮겨적기: c.옮긴칸,
  };
}

/** 변이 하나를 입력 여럿에 적용해 정본과 나란히 놓는다. */
function 변이표(
  label: string,
  impl: Ref,
  site: 자리,
  siteLabel: string,
  입력: [string, number[]][],
): string {
  const rows = 입력.map(([name, arr]) => {
    const ok = countInversions(arr);
    const bad = impl.countInversions(arr);
    return [
      name,
      num(ok),
      num(bad),
      num(지나간_횟수(arr)[site]),
      ok === bad ? "같다" : "어긋난다",
    ];
  });
  return md(["입력", "정본", label, siteLabel, "판정"], rows, [1, 2, 3]);
}

/**
 * 같은 값을 오른쪽으로 보내는 판의 걸음별 누적 — `walkSteps` 와 같은 자리(준비 · 앞 합치기 하나 · 마지막
 * 합치기의 비교 하나 · 끝 걸음)마다 낸다. 사본이므로 끝값을 변이 모듈의 답과 대조한다.
 */
function 동률_걸음마다(arr: number[]): number[] {
  const N = arr.length;
  const a = arr.slice();
  const buffer = new Array<number>(N);
  const out: number[] = [0];
  let 누적 = 0;
  const merge = (lo: number, mid: number, hi: number): void => {
    const 마지막합치기 = lo === 0 && hi === N - 1;
    let i = lo;
    let j = mid + 1;
    let k = lo;
    while (i <= mid && j <= hi) {
      if ((a[i] as number) < (a[j] as number)) {
        buffer[k++] = a[i++] as number;
      } else {
        누적 += mid - i + 1;
        buffer[k++] = a[j++] as number;
      }
      if (마지막합치기) out.push(누적);
    }
    while (i <= mid) buffer[k++] = a[i++] as number;
    while (j <= hi) buffer[k++] = a[j++] as number;
    for (let x = lo; x <= hi; x++) a[x] = buffer[x] as number;
    out.push(누적);
  };
  const rec = (lo: number, hi: number): void => {
    if (lo >= hi) return;
    const mid = (lo + hi) >> 1;
    rec(lo, mid);
    rec(mid + 1, hi);
    merge(lo, mid, hi);
  };
  rec(0, N - 1);
  return out;
}

if (!중화됨) {
  for (const arr of [WALK, [2, 2, 2, 2], [3, 1, 2, 3, 1]]) {
    if (동률_걸음마다(arr).at(-1) !== 동률판.countInversions(arr)) {
      throw new Error(
        `같은 값을 오른쪽으로 보낸 사본이 변이와 다른 답을 냈다 — ${show(arr)}`,
      );
    }
  }
}

/* ─────────────── 불변식 판정 · 제자리에 안 적는 사본 ─────────────── */

/**
 * 합치기가 끝날 때마다 두 가지를 본다 — 그 조각이 오름차순인가, 그 부름이 낸 값이 원래 배열의 그 조각
 * 안 역순쌍 수와 같은가. `옮겨적기` 가 거짓이면 제자리에 안 적는 판과 같은 절차다 — 그 사본이 변이와
 * 같은 답을 내는지는 아래에서 확인한다. 표에 손으로 적지 않고 실행이 판정한다.
 */
function 불변식_판정(
  arr: number[],
  옮겨적기: boolean,
): { 합치기: number; 어긋난: number; 오름차순_아닌: number; 답: number } {
  const N = arr.length;
  if (N <= 1) return { 합치기: 0, 어긋난: 0, 오름차순_아닌: 0, 답: 0 };
  const a = arr.slice();
  const buffer = new Array<number>(N);
  let 합치기 = 0;
  let 어긋난 = 0;
  let 오름차순_아닌 = 0;
  const merge = (lo: number, mid: number, hi: number): number => {
    let i = lo;
    let j = mid + 1;
    let k = lo;
    let count = 0;
    while (i <= mid && j <= hi) {
      if ((a[i] as number) <= (a[j] as number)) {
        buffer[k++] = a[i++] as number;
      } else {
        count += mid - i + 1;
        buffer[k++] = a[j++] as number;
      }
    }
    while (i <= mid) buffer[k++] = a[i++] as number;
    while (j <= hi) buffer[k++] = a[j++] as number;
    if (옮겨적기) for (let x = lo; x <= hi; x++) a[x] = buffer[x] as number;
    return count;
  };
  const rec = (lo: number, hi: number): number => {
    if (lo >= hi) return 0;
    const mid = (lo + hi) >> 1;
    let c = rec(lo, mid);
    c += rec(mid + 1, hi);
    c += merge(lo, mid, hi);
    합치기++;
    const 조각 = a.slice(lo, hi + 1);
    const 오름 = 조각.every((v, x) => x === 0 || (조각[x - 1] as number) <= v);
    if (!오름) 오름차순_아닌++;
    if (!오름 || c !== byDefinition(arr.slice(lo, hi + 1)).답) 어긋난++;
    return c;
  };
  const 답 = rec(0, N - 1);
  return { 합치기, 어긋난, 오름차순_아닌, 답 };
}

for (const arr of [WALK, BUILD, [2, 2, 2], [-1, -3, 0, -2]]) {
  if (불변식_판정(arr, true).답 !== countInversions(arr)) {
    throw new Error(`불변식 판정 사본이 정본과 다른 답을 냈다 — ${show(arr)}`);
  }
}
if (!중화됨) {
  for (const arr of [WALK, [-1, -3, 0, -2], [2, 1], [4, 3, 2, 1]]) {
    if (불변식_판정(arr, false).답 !== 안적는판.countInversions(arr)) {
      throw new Error(
        `제자리에 안 적는 사본이 변이와 다른 답을 냈다 — ${show(arr)}`,
      );
    }
  }
}

/* ─────────────── 가르는 자리를 바꾸는 사본 ─────────────── */

/** 가르는 자리만 바꾼 사본의 계수. 칸 접근은 정본과 같은 규칙(읽기·쓰기 각 1)으로 센다. */
function 계수_스윕(
  arr: number[],
  split: (lo: number, hi: number) => number,
): { 답: number; 비교: number; 옮긴칸: number; 칸접근: number } {
  const N = arr.length;
  const a = arr.slice();
  let 칸접근 = 2 * N;
  const buffer = new Array<number>(N);
  let 비교 = 0;
  let 옮긴칸 = 0;
  const merge = (lo: number, mid: number, hi: number): number => {
    옮긴칸 += hi - lo + 1;
    let i = lo;
    let j = mid + 1;
    let k = lo;
    let count = 0;
    while (i <= mid && j <= hi) {
      비교++;
      칸접근 += 4;
      if ((a[i] as number) <= (a[j] as number)) {
        buffer[k++] = a[i++] as number;
      } else {
        count += mid - i + 1;
        buffer[k++] = a[j++] as number;
      }
    }
    while (i <= mid) {
      buffer[k++] = a[i++] as number;
      칸접근 += 2;
    }
    while (j <= hi) {
      buffer[k++] = a[j++] as number;
      칸접근 += 2;
    }
    for (let x = lo; x <= hi; x++) {
      a[x] = buffer[x] as number;
      칸접근 += 2;
    }
    return count;
  };
  const rec = (lo: number, hi: number): number => {
    if (lo >= hi) return 0;
    const mid = split(lo, hi);
    let c = rec(lo, mid);
    c += rec(mid + 1, hi);
    c += merge(lo, mid, hi);
    return c;
  };
  return { 답: rec(0, N - 1), 비교, 옮긴칸, 칸접근 };
}

{
  // 「반반」 규칙이 정본의 계수와 같은가 — 같은 절차를 재는지 확인한다.
  const 반반 = 계수_스윕(BUILD, (lo, hi) => (lo + hi) >> 1);
  const 정본 = 합치며_세기(BUILD);
  if (
    반반.답 !== countInversions(BUILD) ||
    반반.칸접근 !== 정본.칸접근 ||
    반반.비교 !== 정본.견주기
  ) {
    throw new Error("가르는 자리 사본의 반반 규칙이 정본의 계수와 다르다");
  }
}

/** 비교의 하한·상한과 세 입력의 실측. */
function 비용_경계(N: number): {
  하한: number;
  큰쪽: number;
  상한: number;
  오름: number;
  내림: number;
  최악: number;
} {
  let 하한 = 0;
  let 큰쪽 = 0;
  let 옮긴칸 = 0;
  const walk = (lo: number, hi: number): void => {
    if (lo >= hi) return;
    const mid = (lo + hi) >> 1;
    walk(lo, mid);
    walk(mid + 1, hi);
    하한 += Math.min(mid - lo + 1, hi - mid);
    큰쪽 += Math.max(mid - lo + 1, hi - mid);
    옮긴칸 += hi - lo + 1;
  };
  walk(0, N - 1);
  const 오름 = 합치며_세기(Array.from({ length: N }, (_, q) => q)).견주기;
  const 내림 = 합치며_세기(
    Array.from({ length: N }, (_, q) => N - 1 - q),
  ).견주기;
  const 최악 = 합치며_세기(번갈아_꺼내지는(N)).견주기;
  return { 하한, 큰쪽, 상한: 옮긴칸 - (N - 1), 오름, 내림, 최악 };
}

/** 값 범위 `V` 에서 적은 쪽이 몇 배 적은가 — 소수 첫째 자리까지. */
const 배 = (V: number, 적은쪽: "펜윅" | "정본"): string => {
  const { 정본, 펜윅 } = measure(V);
  const r =
    적은쪽 === "펜윅" ? 정본.칸접근 / 펜윅.칸접근 : 펜윅.칸접근 / 정본.칸접근;
  return r.toFixed(1);
};

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** 전체 컨셉 — 앞 자리마다 그보다 뒤에 있는 더 작은 값. */
  "concept-count": () => {
    const rows = WALK.map((v, p) => {
      const 뒤 = WALK.slice(p + 1).filter((w) => w < v);
      return [
        num(p),
        num(v),
        뒤.length === 0 ? "없음" : 뒤.join(" "),
        num(뒤.length),
      ];
    });
    const 합 = rows.reduce((s, r) => s + Number(r[3]), 0);
    if (합 !== 답) throw new Error("자리마다 센 합이 정본의 답과 다르다");
    return proofTable(
      md(
        [
          "앞 자리 p",
          "A[p]",
          "뒤에 있는 더 작은 값",
          "그 자리에서 시작하는 역순쌍",
        ],
        rows,
        [0, 1, 3],
      ),
      `더하면 I(A) = ${num(합)} 이고, 정본이 낸 답도 ${num(답)} 입니다.`,
    );
  },

  /** 정의를 그대로 옮긴 두 겹 반복의 규모. */
  "origin-naive": () => {
    const rows = [1_000, 10_000, 100_000].map((N) => {
      const pairs = pairsOf(N);
      return [num(N), num(pairs), num(2 * pairs), seconds(2 * pairs)];
    });
    const small = byDefinition(WALK);
    return proofTable(
      md(
        ["칸 수 N", "쌍의 개수 N(N−1)/2", "칸 접근", "어림 시간"],
        rows,
        [0, 1, 2, 3],
      ),
      `쌍 하나를 비교할 때 두 칸을 읽으므로 칸 접근은 쌍의 개수의 두 배이고, 칸 1 개부터 200 개까지 실제로 세어 이 식과 대조했습니다. 어림 시간은 칸 접근을 1 초에 ${num(PER_SECOND)} 번으로 나눈 값입니다. 전개 입력 ${show(WALK)} 에서는 비교 ${num(small.비교)} 번으로 답 ${num(small.답)}${을를(small.답)} 냅니다.`,
    );
  },

  /** 오름차순으로 놓아 버리면 셀 것이 없어진다. */
  "origin-sorted": () => {
    const 정렬 = WALK.slice().sort((x, y) => x - y);
    return md(
      ["배열", "값", "정의대로 센 역순쌍"],
      [
        ["입력 그대로", show(WALK), num(byDefinition(WALK).답)],
        ["오름차순으로 놓은 것", show(정렬), num(byDefinition(정렬).답)],
      ],
      [2],
    );
  },

  /** 반으로 가른 두 조각 — 조각 안을 정렬해도 두 조각 사이의 개수는 그대로다. */
  "origin-halves": () => {
    const mid = (WALK.length - 1) >> 1;
    const L = WALK.slice(0, mid + 1);
    const R = WALK.slice(mid + 1);
    const sL = L.slice().sort((x, y) => x - y);
    const sR = R.slice().sort((x, y) => x - y);
    const 세갈래 = (l: number[], r: number[]) => {
      const a = byDefinition(l).답;
      const b = byDefinition(r).답;
      const c = crossByDefinition(l, r);
      return { a, b, c, 합: a + b + c };
    };
    const 원래 = 세갈래(L, R);
    const 정렬 = 세갈래(sL, sR);
    if (원래.합 !== 답) throw new Error("세 갈래의 합이 정본의 답과 다르다");
    const row = (name: string, l: number[], r: number[], v: typeof 원래) => [
      name,
      `${show(l)} · ${show(r)}`,
      num(v.a),
      num(v.b),
      num(v.c),
      num(v.합),
    ];
    return proofTable(
      md(
        ["두 조각", "값", "왼쪽 안", "오른쪽 안", "두 조각 사이", "합"],
        [row("원래 순서", L, R, 원래), row("조각마다 정렬", sL, sR, 정렬)],
        [2, 3, 4, 5],
      ),
      `두 조각 사이의 역순쌍은 조각마다 정렬해도 ${num(원래.c)} 개에서 ${num(정렬.c)} 개로 그대로이고, 원래 순서의 합 ${num(원래.합)}${은는(원래.합)} 정본의 답과 같습니다.`,
    );
  },

  /** 반으로 가르기만 하고 두 조각 사이를 하나씩 비교하면. */
  "origin-divide": () => {
    const rows = [6, 64, 1_000].map((N) => {
      const arr = Array.from({ length: N }, (_, q) => (q * 37) % 101);
      const d = byDefinition(arr);
      const v = divideOnly(arr);
      if (d.답 !== countInversions(arr) || v.답 !== countInversions(arr)) {
        throw new Error("비교 방법이 정본과 다른 답을 냈다");
      }
      return [num(N), num(d.비교), num(v.비교), num(pairsOf(N))];
    });
    return proofTable(
      md(
        ["칸 수 N", "모든 쌍 비교하기", "반으로 갈라 하나씩 세기", "N(N−1)/2"],
        rows,
        [0, 1, 2, 3],
      ),
      "입력은 A[q] = (q × 37) mod 101 이고, 두 방법의 답은 세 칸 수 모두에서 정본과 같습니다. 칸 1 개부터 200 개까지 전부 세어도 두 방법의 비교 횟수는 N(N−1)/2 와 같았습니다.",
    );
  },

  /** 정렬해 둔 두 조각의 교차 역순쌍을 두 방식으로 센다. */
  "origin-cross": () => {
    const L = 마지막.L;
    const R = 마지막.R;
    const r = mergeCount(L, R);
    let 누적 = 0;
    const rows = r.cmps.map((c, t) => {
      누적 += c.add;
      return [
        num(t + 1),
        num(c.x),
        num(c.y),
        c.left ? "왼쪽을 꺼낸다" : "오른쪽을 꺼낸다",
        num(c.add),
        num(누적),
      ];
    });
    const 하나씩 = L.length * R.length;
    const 교차 = crossByDefinition(L, R);
    if (r.count !== 교차) throw new Error("합치며 센 값이 정의와 다르다");
    return proofTable(
      md(
        ["비교", "왼쪽 값", "오른쪽 값", "판정", "더한 개수", "누적"],
        rows,
        [0, 1, 2, 4, 5],
      ),
      "같은 두 조각을 두 방식으로 센 비용을 나란히 놓으면 이렇습니다. 비교 한 번에 두 칸을 읽습니다.",
      md(
        ["방식", "비교", "읽은 칸", "센 교차 역순쌍"],
        [
          ["하나씩 비교한다", num(하나씩), num(2 * 하나씩), num(교차)],
          [
            "합치며 센다",
            num(r.cmps.length),
            num(2 * r.cmps.length),
            num(r.count),
          ],
        ],
        [1, 2, 3],
      ),
      `왼쪽 ${show(L)}${과와(L.at(-1) as number)} 오른쪽 ${show(R)}${은는(R.at(-1) as number)} 둘 다 오름차순입니다. 센 개수는 ${num(교차)}${으로(교차)} 같고, 비교는 ${num(하나씩)} 번에서 ${num(r.cmps.length)} 번으로 줍니다.`,
    );
  },

  /** (c) 합치기 하나를 골라 그 합치기가 세는 쌍을 읽는다. */
  "build-cross-read": () => {
    const m = 마지막;
    const rows = inversionPairs(WALK).map(([p, q]) => {
      const 든다 = m.lo <= p && p <= m.mid && m.mid < q && q <= m.hi;
      return [
        `(${p}, ${q})`,
        `${WALK[p]} > ${WALK[q]}`,
        `${m.lo} ≤ ${p} ≤ ${m.mid} < ${q} ≤ ${m.hi}`,
        든다 ? "참 — 센다" : "거짓 — 안 센다",
      ];
    });
    const 개수 = crossPairs(WALK, m).length;
    if (개수 !== m.count) throw new Error("교차 역순쌍 수가 센 개수와 다르다");
    return proofTable(
      md(
        [
          "역순쌍 (p, q)",
          "값",
          "lo ≤ p ≤ mid < q ≤ hi",
          `[${m.lo},${m.hi}] 의 합치기`,
        ],
        rows,
      ),
      `합치기 [${m.lo},${m.hi}] 는 lo = ${m.lo}, mid = ${m.mid}, hi = ${m.hi} 이고, 이 합치기가 세는 교차 역순쌍은 ${num(개수)} 개입니다. 정본에서 그 합치기가 센 개수도 ${num(m.count)} 개입니다.`,
    );
  },

  /** (d) 합치기마다 교차 역순쌍 — 역순쌍마다 정확히 한 합치기에 든다. */
  "build-cross-once": () => {
    const 든횟수 = new Map<string, number>();
    for (const [p, q] of inversionPairs(WALK)) 든횟수.set(`${p},${q}`, 0);
    const rows = 전개.merges.map((m) => {
      const ps = crossPairs(WALK, m);
      for (const [p, q] of ps) {
        든횟수.set(`${p},${q}`, (든횟수.get(`${p},${q}`) ?? 0) + 1);
      }
      return [
        `[${m.lo},${m.hi}]`,
        ps.length === 0 ? "없음" : ps.map(([p, q]) => `(${p}, ${q})`).join(" "),
        num(ps.length),
      ];
    });
    const 합 = 전개.merges.reduce((s, m) => s + crossPairs(WALK, m).length, 0);
    const 두번 = [...든횟수.values()].filter((v) => v > 1).length;
    const 안든 = [...든횟수.values()].filter((v) => v === 0).length;
    return proofTable(
      md(["합치기", "교차 역순쌍", "개수"], rows, [2]),
      `다섯 합치기의 개수를 더하면 ${num(합)}${이가(합)} 되어 정본의 답 ${num(답)}${과와(답)} 같습니다. 역순쌍 ${num(든횟수.size)} 개 가운데 두 합치기 이상에 든 쌍은 ${num(두번)} 개, 어느 합치기에도 안 든 쌍은 ${num(안든)} 개입니다.`,
    );
  },

  /** (e) 헷갈리기 쉬운 모양 — 조각 안의 역순쌍 전부를 합치기마다 세면. */
  "build-cross-overcount": () => {
    const rows = 전개.merges.map((m) => [
      `[${m.lo},${m.hi}]`,
      num(byDefinition(WALK.slice(m.lo, m.hi + 1)).답),
      num(crossPairs(WALK, m).length),
    ]);
    const 전부합 = 전개.merges.reduce(
      (s, m) => s + byDefinition(WALK.slice(m.lo, m.hi + 1)).답,
      0,
    );
    const 교차합 = 전개.merges.reduce(
      (s, m) => s + crossPairs(WALK, m).length,
      0,
    );
    rows.push(["합", num(전부합), num(교차합)]);
    return proofTable(
      md(["합치기", "조각 안의 역순쌍 전부", "교차 역순쌍"], rows, [1, 2]),
      `조각 안의 역순쌍을 전부 세면 합이 ${num(전부합)}${으로(전부합)} 정답 ${num(답)} 보다 크고, 교차 역순쌍만 세면 ${num(교차합)} 입니다.`,
    );
  },

  /** 1단계 — 합치기의 세 모양. */
  "build-merge-cases": () => {
    const cases: [number[], number[]][] = [
      [마지막.L.slice(), 마지막.R.slice()],
      [
        [5, 6],
        [1, 2],
      ],
      [
        [1, 2],
        [5, 6],
      ],
    ];
    const rows = cases.map(([L, R]) => {
      const r = mergeCount(L, R);
      return [
        `${show(L)} + ${show(R)}`,
        r.cmps
          .map((c) =>
            c.left
              ? `${c.x} ≤ ${c.y} 왼쪽`
              : `${c.x} > ${c.y} 오른쪽 +${c.add}`,
          )
          .join(" · "),
        r.tail.side === "L" ? "오른쪽" : "왼쪽",
        r.tail.values.join(" "),
        num(r.count),
        num(crossByDefinition(L, R)),
      ];
    });
    return proofTable(
      md(
        [
          "두 조각",
          "비교와 판정",
          "먼저 빈 쪽",
          "비교 없이 옮긴 값",
          "센 개수",
          "정의대로 센 교차 역순쌍",
        ],
        rows,
        [4, 5],
      ),
      "세 모양 모두 합치며 센 개수가 정의대로 센 교차 역순쌍과 같습니다.",
    );
  },

  /** 2단계 — 부름마다 왼쪽 · 오른쪽 · 교차를 더해 돌려준다. */
  "build-split": () => {
    const rows = 전개.calls.map((c, t) => [
      num(t + 1),
      num(c.depth),
      `[${c.lo},${c.hi}] ${show(WALK.slice(c.lo, c.hi + 1))}`,
      c.lo >= c.hi
        ? "칸 하나 → 0"
        : `${num(c.left)} + ${num(c.right)} + ${num(c.cross)}`,
      num(c.total),
    ]);
    const 합치기 = 전개.calls.filter((c) => c.lo < c.hi).length;
    const 바깥 = (전개.calls[0] as { total: number }).total;
    return proofTable(
      md(
        ["부른 순서", "깊이", "조각", "왼쪽 + 오른쪽 + 교차", "돌려준 값"],
        rows,
        [0, 1, 4],
      ),
      `부름은 ${num(전개.calls.length)} 번이고 그중 칸 하나짜리가 ${num(전개.bases)} 번, 합치기가 있는 부름이 ${num(합치기)} 번입니다. 가장 바깥 부름이 돌려준 ${num(바깥)}${이가(바깥)} 정본의 답과 같습니다.`,
    );
  },

  /** 3단계 — 층마다 더한다. */
  "build-levels": () => {
    const lv = levelsOf(전개);
    const rows: string[][] = [];
    let 합 = 0;
    for (const [d, calls] of lv.entries()) {
      const ms = 전개.merges.filter((m) => m.depth === d);
      if (ms.length === 0) continue;
      const c = ms.reduce((s, m) => s + m.count, 0);
      합 += c;
      rows.push([
        `${d} 층`,
        ms.map((m) => `[${m.lo},${m.hi}]`).join(" · "),
        num(c),
        num(ms.reduce((s, m) => s + (m.hi - m.lo + 1), 0)),
        num(calls.reduce((s, x) => s + (x.hi - x.lo + 1), 0)),
      ]);
    }
    return proofTable(
      md(
        ["층", "그 층의 합치기", "센 교차 역순쌍", "옮긴 칸", "그 층의 칸 수"],
        rows,
        [2, 3, 4],
      ),
      `합치기가 있는 층은 ${num(rows.length)} 개이고, 센 개수를 층마다 더하면 ${num(합)}${이가(합)} 됩니다. 어느 층도 옮긴 칸이 그 층의 칸 수 ${num(WALK.length)}${을를(WALK.length)} 넘지 않습니다.`,
    );
  },

  /** 전제 — 두 조각이 오름차순이어야 한다. */
  "build-premise": () => {
    const cases: [number[], number[]][] = [
      [
        [2, 5],
        [1, 3],
      ],
      [
        [5, 2],
        [1, 3],
      ],
    ];
    const rows = cases.map(([l, r]) => {
      const 오름 = l.every((v, x) => x === 0 || (l[x - 1] as number) <= v);
      return [
        `${show(l)} + ${show(r)}`,
        오름 ? "오름차순" : "오름차순 아님",
        num(mergeCount(l, r).count),
        num(crossByDefinition(l, r)),
      ];
    });
    return md(
      ["두 조각", "왼쪽 조각", "합치며 센 개수", "정의대로 센 교차 역순쌍"],
      rows,
      [2, 3],
    );
  },

  /** 설계 선택 — 가르는 자리를 바꿔 가며 계수를 잰다. */
  "build-split-choice": () => {
    const 규칙: [string, (lo: number, hi: number) => number][] = [
      ["1 : 1 (반반)", (lo, hi) => (lo + hi) >> 1],
      ["1 : 3", (lo, hi) => lo + ((hi - lo) >> 2)],
      ["3 : 1", (lo, hi) => hi - 1 - ((hi - lo) >> 2)],
      ["1 : 7", (lo, hi) => lo + ((hi - lo) >> 3)],
      ["1 칸 : 나머지", (lo) => lo],
      ["나머지 : 1 칸", (_lo, hi) => hi - 1],
    ];
    const rows = 규칙.map(([name, split]) => {
      const c = 계수_스윕(BUILD, split);
      return [name, num(c.답), num(c.비교), num(c.옮긴칸), num(c.칸접근)];
    });
    const 답들 = new Set(rows.map((r) => r[1]));
    return proofTable(
      md(
        ["가르는 자리", "답", "비교", "옮긴 칸", "칸 접근"],
        rows,
        [1, 2, 3, 4],
      ),
      `입력은 칸 ${num(BUILD_N)} 개짜리 A[q] = (q × 37) mod 101 입니다. 여섯 규칙의 답은 ${답들.size === 1 ? "모두 같고" : "서로 갈리고"}, 비교와 옮긴 칸과 칸 접근은 규칙마다 다릅니다. 한 칸씩 떼는 규칙의 칸 접근은 반반의 ${(계수_스윕(BUILD, (lo) => lo).칸접근 / 계수_스윕(BUILD, (lo, hi) => (lo + hi) >> 1).칸접근).toFixed(1)} 배입니다.`,
    );
  },

  /** 전개 입력. */
  "walk-input": () =>
    fence(
      "ts",
      [
        `const A = [${WALK.join(", ")}];`,
        `// 이 절이 끝나면 ${답}${이가(답)} 나와야 한다`,
      ].join("\n"),
    ),

  /** 1 번 걸음 — 사본과 버퍼. */
  "walk-setup": () => {
    const N = WALK.length;
    return fence(
      "text",
      columns([
        [`N = ${N}`, `N <= 1 이 ${N <= 1 ? "참" : "거짓"}이라 아래로 간다`],
        [`a = ${show(WALK)}`, "입력의 사본이다. arr 는 끝까지 그대로다"],
        [
          `buffer = 칸 ${N} 개`,
          "아직 아무것도 안 적었다. 모든 합치기가 이것 하나를 쓴다",
        ],
      ]),
    );
  },

  /** 2 번 걸음 — 마지막 합치기의 반복. */
  "walk-merge-loop": () => {
    const m = 마지막;
    let 누적 = 0;
    const rows = m.cmps.map((c, t) => {
      누적 += c.add;
      return [
        num(t + 1),
        num(c.i),
        num(c.j),
        `${code(`${c.x} <= ${c.y}`)} ${c.left ? "**참**" : "**거짓**"}`,
        c.left ? "②" : "③",
        c.left ? "0" : `${m.mid} − ${c.i} + 1 = ${c.add}`,
        num(누적),
      ];
    });
    const 오른쪽 = m.cmps.filter((c) => !c.left).length;
    return proofTable(
      md(
        [
          "비교",
          "i",
          "j",
          "조건 판정",
          "갈래",
          "더한 개수",
          "이 합치기의 누적",
        ],
        rows,
        [0, 1, 2, 6],
      ),
      `비교 ${num(m.cmps.length)} 번 가운데 오른쪽을 꺼낸 것이 ${num(오른쪽)} 번이고, 이 합치기가 센 개수는 ${num(m.count)} 입니다. 반복이 끝난 시점에 ${m.tail.side === "L" ? "왼쪽" : "오른쪽"} 조각에 ${m.tail.values.join(" ")}${이가(m.tail.values.at(-1) as number)} 남아 있습니다.`,
    );
  },

  /** 같은 값을 어느 쪽으로 보낼 것인가 — 답이 안 틀리는 변이. */
  "pause-tie": () =>
    변이표(
      "같은 값을 오른쪽으로 보낸 판",
      동률판,
      "비교",
      "바꾼 줄을 지나간 횟수",
      [
        [`전개 입력 ${show(WALK)}`, WALK],
        ["칸 두 개가 같은 [2 2]", [2, 2]],
        ["전부 같은 [2 2 2 2]", [2, 2, 2, 2]],
        ["같은 값이 섞인 [3 1 2 3 1]", [3, 1, 2, 3, 1]],
      ],
    ),

  /** 답이 같은 전개 입력을 걸음마다 다시 본다. */
  "pause-tie-steps": () => {
    const 변이 = 동률_걸음마다(WALK);
    if (변이.length !== 걸음.length) {
      throw new Error("변이 사본의 걸음 수가 전개와 다르다");
    }
    const rows = 걸음.map((s, t) => {
      const 저쪽 = 변이[t] as number;
      return [
        s.id,
        num(s.total),
        num(저쪽),
        s.total === 저쪽 ? "같다" : "어긋난다",
      ];
    });
    const 같은 = rows.filter((r) => r[3] === "같다").length;
    return proofTable(
      md(
        ["걸음", "정본의 누적", "같은 값을 오른쪽으로 보낸 판의 누적", "판정"],
        rows,
        [1, 2],
      ),
      `바꾼 줄을 ${num(지나간_횟수(WALK).비교)} 번 지나갔고, ${num(rows.length)} 걸음 가운데 누적이 같은 걸음이 ${num(같은)} 개입니다.`,
    );
  },

  /** 오른쪽을 꺼낼 때마다 1 만 더하면. */
  "pause-plus-one": () =>
    변이표(
      "오른쪽마다 1 을 더하는 판",
      하나씩판,
      "더한자리",
      "바꾼 줄을 지나간 횟수",
      [
        [`전개 입력 ${show(WALK)}`, WALK],
        ["이미 오름차순 [1 2 3 4 5 6]", [1, 2, 3, 4, 5, 6]],
        ["칸 두 개 [2 1]", [2, 1]],
        ["내림차순 [6 5 4 3 2 1]", [6, 5, 4, 3, 2, 1]],
      ],
    ),

  /** 3 번 걸음 — 남은 쪽을 옮기고 제자리에 적는다. */
  "walk-tails": () => {
    const rows = 전개.merges.map((m) => [
      `[${m.lo},${m.hi}]`,
      m.tail.side === "L" ? "오른쪽" : "왼쪽",
      m.tail.values.join(" "),
      show(m.out),
      show(m.after),
    ]);
    return proofTable(
      md(
        [
          "합치기",
          "먼저 빈 쪽",
          "비교 없이 옮긴 값",
          "buffer 에 적은 조각",
          "제자리에 적은 뒤 a",
        ],
        rows,
      ),
      `${num(전개.merges.length)} 번의 합치기 모두 반복이 끝난 시점에 한쪽 조각에 값이 남았고, 남은 값을 옮기는 동안 더한 개수는 없습니다.`,
    );
  },

  /** 4 번 걸음 — 재귀가 만드는 합치기의 순서와 센 개수. */
  "walk-tree": () => {
    const rows = 전개.merges.map((m) => [
      `[${m.lo},${m.hi}]`,
      `[${m.lo},${m.mid}]`,
      `[${m.mid + 1},${m.hi}]`,
      num(m.count),
    ]);
    const 합 = 전개.merges.reduce((s, m) => s + m.count, 0);
    return proofTable(
      md(
        ["합치기", "왼쪽 조각", "오른쪽 조각", "이 합치기가 센 개수"],
        rows,
        [3],
      ),
      `합치기가 ${num(전개.merges.length)} 번이고 센 개수를 다 더하면 ${num(합)} 입니다. 정본의 답도 ${num(답)} 입니다.`,
    );
  },

  /** 5 번 걸음 — 걸음 전부. */
  "walk-trace": () => {
    const rows = 걸음.map((s) => [
      s.id,
      s.title,
      s.seg === null ? "—" : `[${s.seg[0]},${s.seg[1]}]`,
      num(s.compares),
      num(s.added),
      num(s.total),
      show(s.stage.array as number[]),
    ]);
    const 비교 = 걸음.reduce((s, x) => s + x.compares, 0);
    return proofTable(
      md(
        ["걸음", "하는 일", "조각", "비교", "더한 개수", "누적", "a"],
        rows,
        [3, 4, 5],
      ),
      `비교는 모두 ${num(비교)} 번이고 마지막 누적 ${num(답)}${이가(답)} 반환값입니다.`,
    );
  },

  /** 갈래 다섯이 어느 걸음에서 실행됐는가. */
  "walk-branches": () => {
    const 합치기걸음 = (t: number): string =>
      t < 앞합치기걸음.length
        ? (앞합치기걸음[t] as { id: string }).id
        : 끝걸음.id;
    const 기저: string[] = [];
    const 왼: string[] = [];
    const 오: string[] = [];
    const 끝: string[] = [];
    for (const [t, m] of 전개.merges.entries()) {
      const 칸하나 = (m.lo === m.mid ? 1 : 0) + (m.mid + 1 === m.hi ? 1 : 0);
      if (칸하나 > 0) 기저.push(`${합치기걸음(t)} 앞 ${칸하나} 번`);
      if (m === 마지막) {
        for (const [u, c] of m.cmps.entries()) {
          const id = (마지막비교걸음[u] as { id: string }).id;
          (c.left ? 왼 : 오).push(id);
        }
      } else {
        if (m.cmps.some((c) => c.left)) 왼.push(합치기걸음(t));
        if (m.cmps.some((c) => !c.left)) 오.push(합치기걸음(t));
      }
      끝.push(합치기걸음(t));
    }
    const 센다 = (f: (c: { left: boolean }) => boolean) =>
      전개.merges.reduce((s, m) => s + m.cmps.filter(f).length, 0);
    return md(
      ["갈래", "실행된 걸음", "횟수"],
      [
        ["① 칸 하나짜리 조각은 0", 기저.join(" · "), `${num(전개.bases)} 번`],
        ["② 왼쪽을 꺼낸다", 왼.join(" · "), `${num(센다((c) => c.left))} 번`],
        [
          "③ 오른쪽을 꺼내며 더한다",
          오.join(" · "),
          `${num(센다((c) => !c.left))} 번`,
        ],
        [
          "④ 남은 쪽을 그대로 옮긴다",
          끝.join(" · "),
          `${num(전개.merges.length)} 번`,
        ],
        [
          "⑤ 제자리에 옮겨 적는다",
          끝.join(" · "),
          `${num(전개.merges.length)} 번`,
        ],
      ],
      [2],
    );
  },

  /** 전체 코드 아래 — 몇 가지 입력의 반환값. */
  "final-calls": () => {
    const calls = [WALK, [2, 4, 1, 3, 5], [2, 2, 2], [-1, -3, 0, -2], [42], []];
    return fence(
      "text",
      columns(
        calls.map((arr) => [
          `countInversions([${arr.join(", ")}])`,
          "→",
          String(countInversions(arr)),
        ]),
      ),
    );
  },

  /** 인접한 두 칸만 맞바꿔 정렬할 때의 횟수. */
  "kendall-swaps": () => {
    const 인접교환 = (arr: number[]): number => {
      const a = arr.slice();
      let swaps = 0;
      for (let end = a.length - 1; end > 0; end--) {
        for (let x = 0; x < end; x++) {
          if ((a[x] as number) > (a[x + 1] as number)) {
            [a[x], a[x + 1]] = [a[x + 1] as number, a[x] as number];
            swaps++;
          }
        }
      }
      return swaps;
    };
    const inputs: [string, number[]][] = [
      [show(WALK), WALK],
      ["[1 2 3 4 5 6]", [1, 2, 3, 4, 5, 6]],
      ["[6 5 4 3 2 1]", [6, 5, 4, 3, 2, 1]],
      ["[2 2 2 2]", [2, 2, 2, 2]],
      ["[3 1 2 3 1]", [3, 1, 2, 3, 1]],
      [`칸 ${num(BUILD_N)} 개짜리 생성식`, BUILD],
    ];
    const rows = inputs.map(([name, arr]) => {
      const a = countInversions(arr);
      const b = 인접교환(arr);
      return [name, num(a), num(b), a === b ? "같다" : "어긋난다"];
    });
    return proofTable(
      md(
        ["배열", "역순쌍 개수", "인접 교환으로 정렬한 횟수", "판정"],
        rows,
        [1, 2],
      ),
      "생성식은 A[q] = (q × 37) mod 101 입니다.",
    );
  },

  /** 경쟁 설계와의 계수 대조. */
  "alt-counts": () => {
    const rows = [
      값범위.가장좁게,
      저장경계.같아지는,
      저장경계.갈리는,
      값범위.가장넓게,
    ].map((V) => {
      const { 정본, 펜윅 } = measure(V);
      return [
        num(V),
        num(정본.칸접근),
        num(펜윅.칸접근),
        펜윅.칸접근 < 정본.칸접근 ? "펜윅 트리" : "합치며 세기",
        num(정본.저장칸),
        num(펜윅.저장칸),
      ];
    });
    return proofTable(
      md(
        [
          "값 범위 V",
          "합치며 세는 판의 칸 접근",
          "펜윅 트리 판의 칸 접근",
          "칸 접근이 적은 쪽",
          "합치며 세는 판의 저장 칸",
          "펜윅 트리 판의 저장 칸",
        ],
        rows,
        [0, 1, 2, 4, 5],
      ),
      `칸 수는 ${num(N_ALT)}${으로(num(N_ALT))} 고정하고 값 범위만 바꿨습니다. 입력은 A[q] = (q × ${num(곱수)}) mod V 이고 난수도 시드도 없습니다. 값 범위 ${num(값범위.가장좁게)} 에서는 펜윅 트리 판의 칸 접근이 ${배(값범위.가장좁게, "펜윅")} 배 적고, 값 범위 ${num(값범위.가장넓게)} 에서는 합치며 세는 판의 칸 접근이 ${배(값범위.가장넓게, "정본")} 배 적습니다.`,
    );
  },

  /** 뒤집히는 자리를 양쪽에서 다시 잰다. */
  "alt-boundary": () => {
    const rows = [값범위.경계앞, 값범위.경계].map((V) => {
      const { 정본, 펜윅 } = measure(V);
      return [
        num(V),
        num(정본.칸접근),
        num(펜윅.칸접근),
        num(펜윅.칸접근 - 정본.칸접근),
        펜윅.칸접근 < 정본.칸접근 ? "펜윅 트리" : "합치며 세기",
      ];
    });
    return proofTable(
      md(
        [
          "값 범위 V",
          "합치며 세는 판",
          "펜윅 트리 판",
          "펜윅 − 합치며",
          "칸 접근이 적은 쪽",
        ],
        rows,
        [0, 1, 2, 3],
      ),
      `값 범위 ${num(값범위.경계)} 에서 칸 접근의 순서가 처음 뒤집힙니다. 이분으로 좁힌 뒤 두 끝을 다시 잰 값입니다.`,
    );
  },

  /** 수식 — 역순쌍마다 내려가기가 멈추는 합치기. */
  "math-pairs": () => {
    const rows = inversionPairs(WALK).map(([p, q]) => {
      let lo = 0;
      let hi = WALK.length - 1;
      const 지나간: string[] = [];
      for (;;) {
        const mid = (lo + hi) >> 1;
        if (q <= mid) {
          지나간.push(`[${lo},${hi}] 에서 왼쪽`);
          hi = mid;
        } else if (mid < p) {
          지나간.push(`[${lo},${hi}] 에서 오른쪽`);
          lo = mid + 1;
        } else break;
      }
      return [
        `(${p}, ${q})`,
        `${WALK[p]} > ${WALK[q]}`,
        지나간.length === 0 ? "바로 멈춤" : 지나간.join(" → "),
        `[${lo},${hi}]`,
      ];
    });
    return proofTable(
      md(["역순쌍", "값", "내려간 길", "멈춘 합치기 v"], rows),
      `역순쌍 ${num(rows.length)} 개가 모두 합치기 하나에서 멈췄고, 합치기 ${전개.merges.map((m) => `[${m.lo},${m.hi}]`).join(" · ")} 의 |cross(v)| 는 차례로 ${전개.merges.map((m) => num(m.count)).join(" · ")} 입니다.`,
    );
  },

  /** 수식 — 오른쪽 값마다 ℓ − u_w. */
  "math-uw": () => {
    const m = 마지막;
    const ℓ = m.L.length;
    const rows: string[][] = [];
    let 꺼낸왼쪽 = 0;
    let w = 0;
    let 합 = 0;
    for (const c of m.cmps) {
      if (c.left) {
        꺼낸왼쪽++;
        continue;
      }
      rows.push([
        num(w),
        num(c.y),
        num(꺼낸왼쪽),
        `${ℓ} − ${꺼낸왼쪽} = ${ℓ - 꺼낸왼쪽}`,
      ]);
      합 += ℓ - 꺼낸왼쪽;
      w++;
    }
    for (const y of m.tail.side === "R" ? m.tail.values : []) {
      rows.push([num(w), num(y), num(ℓ), `${ℓ} − ${ℓ} = 0`]);
      w++;
    }
    const 교차 = crossPairs(WALK, m).length;
    return proofTable(
      md(["w", "y_w", "u_w", "ℓ − u_w"], rows, [0, 1, 2]),
      `합치기 [${m.lo},${m.hi}] 에서 ℓ = ${ℓ} 이고, ℓ − u_w 를 다 더하면 ${num(합)}${이가(합)} 되어 |cross(v)| = ${num(교차)}${과와(교차)} 같습니다.`,
    );
  },

  /** 답이 배정밀도 정수로 표현되는 한계. */
  "math-limit": () => {
    const 한계 = 2n ** 53n;
    const rows = [100_000n, 134_217_727n, 134_217_728n, 134_217_729n].map(
      (N) => {
        const v = (N * (N - 1n)) / 2n;
        return [num(N), num(v), v <= 한계 ? "이하" : "초과"];
      },
    );
    const 상한 = (100_000n * 99_999n) / 2n;
    return proofTable(
      md(["칸 수 N", "N(N−1)/2", "2^53 과의 크기"], rows, [0, 1]),
      `2^53 = ${num(한계)} 이고 2^27 = ${num(2n ** 27n)} 입니다. 과제 규모의 상한 N = ${num(100_000)} 에서 답의 상한은 ${num(상한)} 이고, 이 값에 ${num(한계 / 상한)}${을를(num(한계 / 상한))} 곱해야 2^53 에 이릅니다.`,
    );
  },

  /** 불변식이 합치기마다 참인가 — 실행이 판정한다. */
  "inv-holds": () => {
    const inputs: [string, number[]][] = [
      ["빈 배열", []],
      ["칸 하나 [42]", [42]],
      ["칸 둘 오름 [1 2]", [1, 2]],
      ["칸 둘 내림 [2 1]", [2, 1]],
      ["전부 같은 [2 2 2]", [2, 2, 2]],
      [`전개 입력 ${show(WALK)}`, WALK],
      ["음수가 섞인 [-1 -3 0 -2]", [-1, -3, 0, -2]],
      [`칸 ${num(BUILD_N)} 개 생성식`, BUILD],
    ];
    const rows = inputs.map(([name, arr]) => {
      const r = 불변식_판정(arr, true);
      return [name, num(r.합치기), num(r.어긋난), num(countInversions(arr))];
    });
    return proofTable(
      md(["입력", "판정한 합치기", "어긋난 합치기", "답"], rows, [1, 2, 3]),
      "합치기가 끝날 때마다 그 조각이 오름차순인지와, 그 부름이 낸 값이 원래 배열의 그 조각 안 역순쌍 수와 같은지를 함께 보았습니다.",
    );
  },

  /** 옮겨 적는 줄을 지우면. */
  "inv-mutant": () =>
    변이표(
      "제자리에 안 적는 판",
      안적는판,
      "옮겨적기",
      "지운 줄을 지나간 횟수",
      [
        [`전개 입력 ${show(WALK)}`, WALK],
        ["음수가 섞인 [-1 -3 0 -2]", [-1, -3, 0, -2]],
        ["칸 두 개 [2 1]", [2, 1]],
        ["칸 네 개 [4 3 2 1]", [4, 3, 2, 1]],
      ],
    ),

  /** 답이 같은 두 입력을 합치기 자리마다 다시 본다. */
  "inv-mutant-steps": () => {
    const rows = (
      [
        ["칸 두 개 [2 1]", [2, 1]],
        ["칸 네 개 [4 3 2 1]", [4, 3, 2, 1]],
      ] as [string, number[]][]
    ).map(([name, arr]) => {
      const 원본 = 불변식_판정(arr, true);
      const 변이 = 불변식_판정(arr, false);
      return [
        name,
        num(원본.합치기),
        num(원본.오름차순_아닌),
        num(변이.오름차순_아닌),
        num(countInversions(arr)),
      ];
    });
    return proofTable(
      md(
        [
          "입력",
          "합치기 수",
          "정본에서 오름차순이 아닌 조각",
          "지운 판에서 오름차순이 아닌 조각",
          "답",
        ],
        rows,
        [1, 2, 3, 4],
      ),
      "두 입력 모두 지운 판에서는 합치기가 끝난 조각이 하나도 오름차순이 아닙니다.",
    );
  },

  /** 비용을 세는 과정 — 전개의 걸음으로. */
  "perf-derive": () => {
    const N = WALK.length;
    const rows: string[][] = [["T1", "사본", "—", "0", `2 × ${N} = ${2 * N}`]];
    let 합 = 2 * N;
    for (const [t, m] of 전개.merges.entries()) {
      const len = m.hi - m.lo + 1;
      const c = m.cmps.length;
      const v = 2 * c + 4 * len;
      합 += v;
      const id =
        m === 마지막
          ? `${(마지막비교걸음[0] as { id: string }).id}~${끝걸음.id}`
          : (앞합치기걸음[t] as { id: string }).id;
      rows.push([
        id,
        `[${m.lo},${m.hi}]`,
        num(len),
        num(c),
        `2 × ${c} + 4 × ${len} = ${v}`,
      ]);
    }
    const 실측 = 합치며_세기(WALK).칸접근;
    if (합 !== 실측)
      throw new Error("걸음마다 센 칸 접근의 합이 실측과 다르다");
    return proofTable(
      md(["걸음", "조각", "조각 길이", "비교", "칸 접근"], rows, [2, 3]),
      `걸음마다 더하면 칸 접근이 ${num(합)} 이고, 값만 세는 판으로 실제로 센 칸 접근도 ${num(실측)} 입니다.`,
    );
  },

  /** 칸 접근의 닫힌 형태. */
  "perf-closed": () => {
    const inputs: [string, number[]][] = [
      ["전개 입력", WALK],
      [`칸 ${num(BUILD_N)} 개 생성식`, BUILD],
      ["칸 1,024 개 오름차순", Array.from({ length: 1024 }, (_, q) => q)],
      [
        "칸 1,024 개 내림차순",
        Array.from({ length: 1024 }, (_, q) => 1023 - q),
      ],
      ["칸 1,024 개 번갈아 꺼내지는 입력", 번갈아_꺼내지는(1024)],
      [
        "칸 100,000 개 내림차순",
        Array.from({ length: 100_000 }, (_, q) => 99_999 - q),
      ],
      ["칸 100,000 개 번갈아 꺼내지는 입력", 번갈아_꺼내지는(100_000)],
    ];
    const rows = inputs.map(([name, arr]) => {
      const c = 합치며_세기(arr);
      if (c.답 !== countInversions(arr)) {
        throw new Error("세는 판이 정본과 다른 답을 냈다");
      }
      const 닫힌 = 2 * arr.length + 2 * c.견주기 + 4 * c.옮긴칸;
      return [
        name,
        num(arr.length),
        num(c.견주기),
        num(c.옮긴칸),
        num(c.칸접근),
        num(닫힌),
        닫힌 === c.칸접근 ? "같다" : "어긋난다",
      ];
    });
    return proofTable(
      md(
        [
          "입력",
          "칸 수 N",
          "비교 C",
          "옮긴 칸 M",
          "실측 칸 접근",
          "2N + 2C + 4M",
          "판정",
        ],
        rows,
        [1, 2, 3, 4, 5],
      ),
      "옮긴 칸 M 은 합치기마다의 조각 길이를 다 더한 값이고, 칸 수가 같으면 입력이 달라도 같습니다.",
    );
  },

  /** 비교의 하한과 상한. */
  "perf-bounds": () => {
    const rows = [8, 64, 1_024, 100_000].map((N) => {
      const b = 비용_경계(N);
      return [
        num(N),
        num(b.하한),
        num(b.큰쪽),
        num(b.오름),
        num(b.내림),
        num(b.최악),
        num(b.상한),
      ];
    });
    return proofTable(
      md(
        [
          "칸 수 N",
          "Σ 작은 쪽",
          "Σ 큰 쪽",
          "이미 오름차순",
          "완전한 내림차순",
          "번갈아 꺼내지는 입력",
          "상한 M − (N−1)",
        ],
        rows,
        [0, 1, 2, 3, 4, 5, 6],
      ),
      "네 칸 수 모두에서 이미 오름차순은 Σ 큰 쪽과, 완전한 내림차순은 Σ 작은 쪽과, 번갈아 꺼내지는 입력은 상한과 같습니다.",
    );
  },

  /** 최악을 만드는 입력을 칸 여덟로 만든다. */
  "perf-worst-build": () => {
    const N = 8;
    const 줄: string[][] = [
      ["만들고 싶은 결과", show(Array.from({ length: N }, (_, q) => q))],
    ];
    let 단: number[][] = [Array.from({ length: N }, (_, q) => q)];
    for (let 번 = 1; 단.some((g) => g.length > 1); 번++) {
      const 다음: number[][] = [];
      for (const g of 단) {
        if (g.length <= 1) {
          다음.push(g);
          continue;
        }
        다음.push(g.filter((_, t) => t % 2 === 0));
        다음.push(g.filter((_, t) => t % 2 === 1));
      }
      단 = 다음;
      줄.push([`${번} 번 가른 뒤`, 단.map((g) => show(g)).join(" ")]);
    }
    const 만든 = 번갈아_꺼내지는(N);
    if (단.map((g) => g[0]).join(" ") !== 만든.join(" ")) {
      throw new Error("손으로 가른 결과가 만든 입력과 다르다");
    }
    줄.push(["이어 붙인 입력", show(만든)]);
    return fence("text", columns(줄));
  },

  /** 최악을 만드는 입력. */
  "perf-worst": () => {
    const N = 64;
    const inputs: [string, number[]][] = [
      ["이미 오름차순", Array.from({ length: N }, (_, q) => q)],
      ["완전한 내림차순", Array.from({ length: N }, (_, q) => N - 1 - q)],
      ["번갈아 꺼내지게 만든 것", 번갈아_꺼내지는(N)],
    ];
    const rows = inputs.map(([name, arr]) => {
      const c = 합치며_세기(arr);
      return [
        name,
        `${arr.slice(0, 6).join(" ")} …`,
        num(c.답),
        num(c.견주기),
        num(c.칸접근),
      ];
    });
    const b = 비용_경계(N);
    return proofTable(
      md(["입력", "앞 여섯 칸", "답", "비교", "칸 접근"], rows, [2, 3, 4]),
      `칸 ${num(N)} 개에서 비교의 상한은 ${num(b.상한)} 이고 만든 입력이 그 값을 냅니다. 완전한 내림차순의 비교 ${num(b.내림)}${은는(num(b.내림))} 하한 ${num(b.하한)}${과와(num(b.하한))} 같고, 답의 최댓값 ${num(pairsOf(N))}${은는(num(pairsOf(N)))} 완전한 내림차순이 냅니다.`,
    );
  },

  /** 스스로 점검하기 — 두 눈금이 어떻게 움직였는가. */
  "selfcheck-ij": () => {
    const m = 마지막;
    const rows = m.cmps
      .slice(0, 3)
      .map((c, t) => [
        (마지막비교걸음[t] as { id: string }).id,
        num(c.i),
        num(c.j),
        `${c.x} <= ${c.y} ${c.left ? "참" : "거짓"}`,
        num(c.add),
      ]);
    return md(
      ["걸음", "비교 전 i", "비교 전 j", "판정", "더한 개수"],
      rows,
      [1, 2, 4],
    );
  },
};
