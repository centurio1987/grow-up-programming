/**
 * `sieveOfEratosthenes-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)과 같은 절차를 실행해 받는다. 걸음 기록(`walk`)은
 * 정본과 같은 절차를 따라가며 걸음마다 무엇을 읽고 지웠는지 남기는 사본이고, 그 사본의 답은 정본의 답과
 * 대조한다. 계측을 정본 소스에서 `loadMutant` 로 만들지 않은 것은 `check-proof` 의 중화 실행이
 * `loadMutant` 를 정본 그대로 돌려주기 때문이다 — 그때 계측 기록이 비어 증명 블록이 거짓이 된다.
 *
 * 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과
 * 같은지는 `sieveOfEratosthenes-guide.test.ts` 가 잰다. 증명 사이드카도 이 파일의 계측을 쓴다.
 */

import type { ReactElement } from "react";
import { 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import {
  CellStageFilm,
  type StageFrame,
} from "../../../_viz/patterns/CellStage";
import {
  type ArrayOptions,
  type ArrayStep,
  arrayColumns,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { sieveOfEratosthenes } from "./sieveOfEratosthenes-guide.ref.ts";

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력 — `deep.origin` ③ · `deep.build` · `deep.walk` · `.sim.ts` 가 같은 것을 쓴다. */
export const WALK_N = 30;
/** 과제 규모의 상한. 근거는 본문 `deep.origin` ① 에 있다. */
export const LIMIT = 10_000_000;
/** 1 초 예산 — 기본 연산 1 초에 1 억 번(본문과 같다). */
export const OPS_PER_SECOND = 100_000_000;

export const num = (x: number): string => x.toLocaleString("en-US");
export const seconds = (ops: number): string =>
  `${(ops / OPS_PER_SECOND).toFixed(2)} 초`;
/** 수의 나열. 비면 「없음」 이다. */
export const list = (xs: readonly number[]): string =>
  xs.length === 0 ? "없음" : xs.join(" ");
/** 답 배열의 표기. */
export const show = (xs: readonly number[]): string =>
  xs.length === 0 ? "[]" : `[${xs.join(", ")}]`;

/** 사본의 답이 정본의 답과 같은지 확인한다. 다르면 다른 절차를 잰 것이다. */
export function assertSame(n: number, got: readonly number[]): void {
  const want = sieveOfEratosthenes(n);
  if (got.length !== want.length || got.some((x, at) => x !== want[at])) {
    throw new Error(`사본과 정본의 답이 다르다 — n = ${n}`);
  }
}

/** 수의 가장 작은 소인수. 소수면 자기 자신이다. */
export function leastPrimeFactor(x: number): number {
  for (let d = 2; d * d <= x; d++) if (x % d === 0) return d;
  return x;
}

/* ───────────────────────── 여러 판의 체 ───────────────────────── */

/**
 * 체의 세 손잡이 — 소수 `i` 가 어디부터 지우는가(`from`), 이미 지워진 `i` 를 건너뛰는가(`skip`),
 * 바깥 반복을 어디까지 하는가(`last`). 정본은 `i * i` · 건너뛴다 · `i * i <= n` 이다.
 */
export interface Knobs {
  readonly from: (i: number) => number;
  readonly skip: boolean;
  readonly last: (i: number, n: number) => boolean;
}

export const REF_KNOBS: Knobs = {
  from: (i) => i * i,
  skip: true,
  last: (i, n) => i * i <= n,
};

export interface Counted {
  readonly primes: number[];
  /** 안쪽 반복이 체 배열에 쓴 횟수 — 이미 지운 칸을 다시 지운 것도 센다. 본문의 `W(n)`. */
  readonly marks: number;
  /** 바깥 반복이 체 배열을 읽은 횟수. */
  readonly reads: number;
  /** 기본 연산 — 체 배열을 만드는 쓰기 + 바깥 읽기 + 지우기 + 수집 읽기. */
  readonly ops: number;
}

/** 손잡이 셋으로 정한 체를 실행해 기본 연산을 센다. 답은 부르는 쪽이 정본과 대조한다. */
export function sieveWith(n: number, k: Knobs): Counted {
  const primes: number[] = [];
  if (n < 2) return { primes, marks: 0, reads: 0, ops: 0 };
  let marks = 0;
  let reads = 0;
  const isComposite = new Array<boolean>(n + 1).fill(false);
  for (let i = 2; k.last(i, n); i++) {
    if (k.skip) {
      reads++;
      if (isComposite[i]) continue;
    }
    for (let j = k.from(i); j <= n; j += i) {
      marks++;
      isComposite[j] = true;
    }
  }
  for (let x = 2; x <= n; x++) if (!isComposite[x]) primes.push(x);
  return { primes, marks, reads, ops: n + 1 + reads + marks + (n - 1) };
}

/** 정본과 같은 판 — 답을 정본과 대조한다. */
export function counted(n: number): Counted {
  const c = sieveWith(n, REF_KNOBS);
  assertSame(n, c.primes);
  return c;
}

/** 모든 수 `i` 가 자기 배수를 `2i` 부터 지운다 — 건너뛰지 않는다. */
export const CROSS_ALL: Knobs = {
  from: (i) => 2 * i,
  skip: false,
  last: (i, n) => i <= n,
};

/** 지워지지 않은 수만 배수를 `2i` 부터 지운다 — 바깥 반복은 `n` 까지 간다. */
export const CROSS_PRIMES: Knobs = {
  from: (i) => 2 * i,
  skip: true,
  last: (i, n) => i <= n,
};

/**
 * 수마다 시행 나눗셈으로 판정하는 방법. 나눗셈을 **소수를 확인한 몫과 합성수를 확인한 몫으로
 * 갈라서** 센다. 반복 변수를 올리고 비교하는 일은 체와 같이 세지 않는다.
 */
export function byTrialDivision(n: number): {
  primes: number[];
  divisions: number;
  forPrimes: number;
  forComposites: number;
} {
  const primes: number[] = [];
  let forPrimes = 0;
  let forComposites = 0;
  for (let x = 2; x <= n; x++) {
    let prime = true;
    let used = 0;
    for (let d = 2; d * d <= x; d++) {
      used++;
      if (x % d === 0) {
        prime = false;
        break;
      }
    }
    if (prime) {
      primes.push(x);
      forPrimes += used;
    } else forComposites += used;
  }
  return {
    primes,
    divisions: forPrimes + forComposites,
    forPrimes,
    forComposites,
  };
}

const memo = new Map<string, unknown>();
/** 큰 상한의 계수는 한 번만 잰다 — 그림과 증명 블록이 같은 값을 여러 번 쓴다. */
export function once<T>(key: string, make: () => T): T {
  if (!memo.has(key)) memo.set(key, make());
  return memo.get(key) as T;
}

/* ───────────────────────── 걸음 기록 ───────────────────────── */

export type Event =
  | { readonly kind: "check"; readonly i: number; readonly crossed: boolean }
  | {
      readonly kind: "mark";
      readonly p: number;
      /** 이번에 지운 칸 전부(이미 지운 칸을 다시 지운 것 포함). */
      readonly cells: readonly number[];
      /** 그중 처음 지운 칸. */
      readonly fresh: readonly number[];
    }
  | { readonly kind: "stop"; readonly i: number }
  | { readonly kind: "collect"; readonly primes: readonly number[] };

export interface Walk {
  readonly events: readonly Event[];
  readonly primes: readonly number[];
  /** 수 `m` 을 처음 지운 소수. 한 번도 안 지워진 수는 `null`. 칸 번호가 곧 수다. */
  readonly firstBy: readonly (number | null)[];
  readonly marks: number;
}

/**
 * 정본과 같은 절차를 따라가며 걸음마다 무엇을 읽고 지웠는지 남긴다. 작은 상한에만 쓴다 — 걸음마다
 * 칸 목록을 남기므로 큰 상한에서는 `counted` 를 쓴다. 답은 정본과 대조한다.
 */
export function walk(n: number): Walk {
  const events: Event[] = [];
  const isComposite = new Array<boolean>(n + 1).fill(false);
  const firstBy: (number | null)[] = new Array(n + 1).fill(null);
  let marks = 0;
  let i = 2;
  for (; i * i <= n; i++) {
    const crossed = isComposite[i] === true;
    events.push({ kind: "check", i, crossed });
    if (crossed) continue;
    const cells: number[] = [];
    const fresh: number[] = [];
    for (let j = i * i; j <= n; j += i) {
      marks++;
      cells.push(j);
      if (!isComposite[j]) {
        fresh.push(j);
        firstBy[j] = i;
      }
      isComposite[j] = true;
    }
    events.push({ kind: "mark", p: i, cells, fresh });
  }
  events.push({ kind: "stop", i });
  const primes: number[] = [];
  for (let k = 2; k <= n; k++) if (!isComposite[k]) primes.push(k);
  events.push({ kind: "collect", primes });
  assertSame(n, primes);
  return { events, primes, firstBy, marks };
}

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

interface Step {
  readonly id: string;
  readonly title: string;
  readonly text: string;
  readonly stage: ArrayStep;
}

/** 무대의 칸 번호 — 수 `m` 은 칸 `m − 2` 에 선다(무대는 2 부터 `n` 까지의 수 줄이다). */
const at = (m: number): number => m - 2;

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. 칸의 값이 곧 수라 인덱스 줄을 뺀다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "수",
  rangeLabel: "수",
  valueAxis: true,
};

/**
 * 수 줄 아래에 쌓는 줄의 이름 — 정본의 체 배열 `isComposite` 를 칸마다 「참」·「거짓」으로 적는다. 수 줄의
 * 칸 `m − 2` 아래가 `isComposite[m]` 이다(칸 0 · 1 은 정본이 읽지 않아 줄에 두지 않는다). 처음부터 모든 칸에
 * 값이 있는 줄이라 곁말에 「참」인 칸 수를 적는다(SPEC §13 「처음부터 모든 칸에 값이 있는 줄」).
 */
export const SIEVE_LAYER = "isComposite";

/** 상한 `n` 의 걸음 전부. 번호는 T1 부터 붙인다. */
export function walkSteps(n: number = WALK_N): Step[] {
  const w = walk(n);
  const numbers = Array.from({ length: n - 1 }, (_, k) => k + 2);
  const crossed = new Set<number>();
  let marks = 0;
  const steps: Step[] = [];
  let t = 0;
  for (const e of w.events) {
    const before = [...crossed].sort((a, b) => a - b);
    const base = {
      array: numbers,
      range: [0, numbers.length - 1] as const,
      out: before.map(at),
    };
    let title: string;
    let text: string;
    let stage: ArrayStep;
    if (e.kind === "check") {
      title = `i = ${e.i} · ${e.crossed ? "지워졌다" : "지워지지 않았다"}`;
      text = e.crossed
        ? `칸 ${e.i}${이가(e.i)} 이미 지워져 있습니다. ${e.i} 의 배수는 더 작은 소수가 이미 지웠으므로 건너뜁니다.`
        : `칸 ${e.i}${이가(e.i)} 지워지지 않았습니다. 그래서 ${e.i}${은는(e.i)} 소수입니다.`;
      stage = {
        ...base,
        read: [at(e.i)],
        write: [],
        pointers: { i: e.i },
        calc: {
          expr: `isComposite[${e.i}]`,
          result: e.crossed ? "참" : "거짓",
        },
      };
    } else if (e.kind === "mark") {
      for (const c of e.cells) crossed.add(c);
      marks += e.cells.length;
      const again = e.cells.length - e.fresh.length;
      const sq = e.p * e.p;
      title = `p = ${e.p} · ${sq} 부터 ${e.cells.length} 칸`;
      text = `${sq} 부터 ${e.p} 씩 더해 ${e.cells.length} 칸을 지웁니다. 처음 지운 칸이 ${e.fresh.length} 개${again === 0 ? "입니다." : `, 이미 지운 칸을 다시 지운 것이 ${again} 개입니다.`}`;
      stage = {
        ...base,
        read: [],
        write: e.cells.map(at),
        pointers: { p: e.p, "p²": sq },
        calc: { expr: `${e.p} × ${e.p}`, result: `${sq}` },
        pieces: [
          {
            label: `p = ${e.p}`,
            from: at(sq),
            to: at(n),
            tone: "left",
            text: `${sq} 부터 ${e.p} 씩`,
          },
        ],
      };
    } else if (e.kind === "stop") {
      title = `i = ${e.i} · ${e.i * e.i} > ${n}`;
      text = `${e.i} 의 제곱 ${e.i * e.i}${이가(e.i * e.i)} 상한 ${n}${을를(n)} 넘어 바깥 반복이 끝납니다.`;
      stage = {
        ...base,
        read: [],
        write: [],
        pointers: { i: e.i },
        calc: { expr: `${e.i} × ${e.i}`, result: `${e.i * e.i} > ${n}` },
      };
    } else {
      title = `남은 칸 ${e.primes.length} 개를 모은다`;
      text = `2 부터 ${n} 까지 지워지지 않은 칸 ${e.primes.length} 개를 오름차순으로 답에 담습니다.`;
      stage = {
        ...base,
        read: [],
        write: e.primes.map(at),
        calc: null,
      };
    }
    steps.push({
      id: `T${++t}`,
      title,
      text,
      stage: {
        ...stage,
        rangeSide: `지운 칸 ${crossed.size} / ${numbers.length}`,
        vars: `지우기 ${marks} 번`,
        layers: [
          {
            name: SIEVE_LAYER,
            values: numbers.map((m) => (crossed.has(m) ? "참" : "거짓")),
            // 정본이 읽는 칸 — 바깥 반복의 `isComposite[i]` 와 마지막에 모으는 반복의 칸 전부.
            read:
              e.kind === "check"
                ? [at(e.i)]
                : e.kind === "collect"
                  ? numbers.map(at)
                  : [],
            // 정본이 쓰는 칸 — 이미 「참」인 칸을 다시 쓴 것도 쓴 칸이다.
            write: e.kind === "mark" ? e.cells.map(at) : [],
            side: `참 ${crossed.size} 칸`,
            caret: false,
          },
        ],
      },
    });
  }
  return steps;
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 걸음 기록에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `sieveOfEratosthenes-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return walkSteps().map((s) => ({
    title: `${s.id} ${s.title}`,
    text: s.text,
    ...s.stage,
  }));
}

const film = (steps: readonly Step[]): StageFrame[] =>
  steps.map((s) => ({
    id: s.id,
    text: s.title,
    rows: arrayStage(s.stage, ARRAY_OPTIONS),
  }));

const columnsOf = (steps: readonly Step[]): number =>
  Math.max(...steps.map((s) => arrayColumns(s.stage)));

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 셋 ───────────────── */

/** 과제 규모에서 세 시도의 계수 — 답은 셋 다 정본과 대조한다. */
export function approachCounts() {
  return once("approaches", () => {
    const trial = byTrialDivision(LIMIT);
    assertSame(LIMIT, trial.primes);
    const all = sieveWith(LIMIT, CROSS_ALL);
    assertSame(LIMIT, all.primes);
    const primesOnly = sieveWith(LIMIT, CROSS_PRIMES);
    assertSame(LIMIT, primesOnly.primes);
    return {
      trial: trial.divisions,
      trialForPrimes: trial.forPrimes,
      all: all.ops,
      allMarks: all.marks,
      primesOnly: primesOnly.ops,
      primesOnlyMarks: primesOnly.marks,
    };
  });
}

function approaches(): Approach[] {
  const c = approachCounts();
  const fits = (ops: number) => ops <= OPS_PER_SECOND;
  return [
    {
      name: "수마다 나눠 보기",
      idea: "2 부터 n 까지 수마다 제곱근까지의 수로 나눠 소수인지 묻는다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `나눗셈 ${num(c.trial)} 번 · ${seconds(c.trial)}`,
          ok: fits(c.trial),
        },
      ],
      lesson:
        "나눗셈 대부분이 소수를 소수라고 확인하는 데 든다 — 합성수 쪽만 덧셈으로 나열하면 어떨까",
    },
    {
      name: "모든 수의 배수 지우기",
      idea: "수 i 마다 2i · 3i · … 를 지우고, 남은 수를 답으로 모은다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `기본 연산 ${num(c.all)} 번 · ${seconds(c.all)}`,
          ok: fits(c.all),
        },
      ],
      lesson:
        "합성수 i 의 배수는 i 의 소인수가 이미 지웠다 — 지워지지 않은 수만 지우면 어떨까",
    },
    {
      name: "소수의 배수만 지우기",
      idea: "작은 수부터 보며, 아직 지워지지 않은 수의 배수만 지운다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `기본 연산 ${num(c.primesOnly)} 번 · ${seconds(c.primesOnly)}`,
          ok: fits(c.primesOnly),
        },
      ],
    },
  ];
}

/* ───────────────────────── 그림 ───────────────────────── */

export const FIGS: Record<string, () => ReactElement> = {
  "concept-sieve": () => {
    // 전개 입력의 걸음 가운데 지우는 걸음과 모으는 걸음만 — 체 배열이 어떻게 바뀌는지만 보인다.
    const steps = walkSteps().filter(
      (_, k, all) => all[k]?.stage.pieces !== undefined || k === all.length - 1,
    );
    return (
      <CellStageFilm
        title={`상한 ${WALK_N} — 소수마다 배수를 지우고, 남은 칸을 모은다`}
        columns={columnsOf(steps)}
        frames={film(steps)}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`상한 n = ${num(LIMIT)} · 1 초(기본 연산 1 초에 1 억 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "walk-sieve": () => {
    const steps = walkSteps();
    return (
      <CellStageFilm
        title={`sieveOfEratosthenes(${WALK_N}) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={columnsOf(steps)}
        frames={film(steps)}
      />
    );
  },
};
