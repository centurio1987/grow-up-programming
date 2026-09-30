/**
 * `findAllOccurrences-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 대조 루프 한 걸음의 「들어올 때 j」와
 * 「줄인 차례」는 정본 소스에서 기계로 만든 계측 사본(`trace`)이 기록하고, 답은 정본이 낸다. 걸음 재생
 * 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는
 * `findAllOccurrences-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import type { CellState } from "../../../_viz/patterns/ArrayStrip";
import {
  CellStageFilm,
  type StageFrame,
} from "../../../_viz/patterns/CellStage";
import { RangeCover } from "../../../_viz/patterns/RangeCover";
import {
  type ArrayOptions,
  type ArrayPiece,
  type ArrayStep,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import {
  counted,
  failOf,
  scanSteps,
  skipByMatched,
  WALK_PATTERN,
  WALK_TEXT,
} from "./findAllOccurrences-guide.proof.ts";
import { findAllOccurrences } from "./findAllOccurrences-guide.ref.ts";

const REF = new URL("./findAllOccurrences-guide.ref.ts", import.meta.url)
  .pathname;

/* ───────────────────────── 정본 계측 ───────────────────────── */

interface Raw {
  readonly i: number;
  readonly enter: number;
  readonly chain: number[];
}

/**
 * 대조 루프의 줄이기 한 줄을 기록하는 줄로 바꾼 사본. **정본 소스에서 기계로 만든다** — 그 줄에 정확히
 * 맞지 않으면 `loadMutant` 가 던진다. 줄이는 일 자체는 그대로 두고 기록만 더한다.
 */
const probed = await loadMutant<{
  findAllOccurrences(text: string, pattern: string): number[];
}>(REF, {
  swap: [
    /^(\s*)while \(j > 0 && text\[i\] !== pattern\[j\]\) j = fail\[j - 1\] as number;$/,
    "$1const __s = { i, enter: j, chain: [] as number[] };\n$1while (j > 0 && text[i] !== pattern[j]) { j = fail[j - 1] as number; __s.chain.push(j); }\n$1(globalThis as any).__scan.push(__s);\n$1(globalThis as any).__fail = fail;",
  ],
});

/** 한 걸음 — 텍스트 자리 하나를 처리한 기록. */
export interface Step {
  readonly i: number;
  readonly ch: string;
  readonly enter: number;
  readonly chain: readonly number[];
  /** 마지막으로 비교한 패턴 자리. */
  readonly last: number;
  readonly matched: boolean;
  /** 같으면 늘린 뒤의 맞은 길이. */
  readonly after: number;
  readonly hit: number | null;
  readonly exit: number;
  readonly cmp: number;
}

export interface Trace {
  readonly fail: readonly number[];
  readonly steps: readonly Step[];
  readonly found: readonly number[];
}

/** 정본 한 번 호출의 걸음 기록. 답은 정본과, 걸음은 증명 사이드카의 계측기와 대조한다. */
export function trace(text: string, pattern: string): Trace {
  const g = globalThis as unknown as { __scan: Raw[]; __fail: number[] };
  g.__scan = [];
  g.__fail = [];
  const got = probed.findAllOccurrences(text, pattern);
  const want = findAllOccurrences(text, pattern);
  if (got.join(",") !== want.join(",")) {
    throw new Error(`계측 사본이 정본과 다른 답을 냈다 — ${got} ≠ ${want}`);
  }
  const fail = [...g.__fail];
  const m = pattern.length;
  const steps: Step[] = g.__scan.map((r) => {
    const last = r.chain.at(-1) ?? r.enter;
    const matched = text[r.i] === pattern[last];
    const after = matched ? last + 1 : last;
    const hit = after === m ? r.i - m + 1 : null;
    const exit = hit === null ? after : (fail[m - 1] as number);
    const cmp = [r.enter, ...r.chain].filter((v) => v > 0).length + 1;
    return {
      i: r.i,
      ch: String(text[r.i]),
      enter: r.enter,
      chain: r.chain,
      last,
      matched,
      after,
      hit,
      exit,
      cmp,
    };
  });
  const found = steps.flatMap((s) => (s.hit === null ? [] : [s.hit]));
  if (found.join(",") !== want.join(",")) {
    throw new Error("걸음 기록에서 다시 모은 답이 정본과 다르다");
  }
  const other = scanSteps(text, pattern);
  for (const [k, s] of steps.entries()) {
    const o = other[k];
    if (
      !o ||
      o.enter !== s.enter ||
      o.exit !== s.exit ||
      o.cmp !== s.cmp ||
      o.chain.join(",") !== s.chain.join(",")
    ) {
      throw new Error(`걸음 T${k + 1} 이 증명 사이드카의 계측기와 다르다`);
    }
  }
  return { fail, steps, found };
}

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "T",
  rangeLabel: "P 자리",
};

function stepTitle(s: Step): string {
  if (s.hit !== null) return `i = ${s.i} · 자리 ${s.hit} 적음`;
  return `i = ${s.i} · j ${s.enter} → ${s.exit}`;
}

function stepText(s: Step, t: Trace, m: number): string {
  const p = (k: number): string => String(WALK_PATTERN[k]);
  const parts: string[] = [];
  if (s.chain.length > 0) {
    const froms = [s.enter, ...s.chain.slice(0, -1)];
    const hops = s.chain
      .map((c, k) => {
        const from = froms[k] as number;
        const x = p(from);
        const head =
          k === 0
            ? `P[${from}] = ${x}${이가(x)} 달라 j 를`
            : `P[${from}] = ${x}${과와(x)}도 달라`;
        return `${head} fail[${from - 1}] = ${c}${으로(c)}`;
      })
      .join(", ");
    parts.push(`T[${s.i}] = ${s.ch}${과와(s.ch)} ${hops} 줄입니다.`);
  }
  if (s.matched) {
    parts.push(
      `T[${s.i}] = ${s.ch}${과와(s.ch)} P[${s.last}] = ${p(s.last)}${이가(p(s.last))} 같아 j 가 ${s.after}${이가(s.after)} 됩니다.`,
    );
  } else {
    parts.push(
      `P[${s.last}] = ${p(s.last)}${과와(p(s.last))}도 달라 j 는 ${s.exit} 입니다. i 는 ${s.i} 그대로입니다.`,
    );
  }
  if (s.hit !== null) {
    const f = t.fail[m - 1] as number;
    parts.push(
      `j = m 이라 시작 자리 ${s.i} − ${m} + 1 = ${s.hit}${을를(s.hit)} 적고 j 를 fail[${m - 1}] = ${f}${으로(f)} 줄입니다.`,
    );
  }
  return parts.join(" ");
}

/** 걸음 하나를 배열 무대의 걸음으로. 쥔 구간은 패턴이 놓인 자리, 조각은 맞은 부분과 이어 갈 부분이다. */
function arrayStep(
  s: Step,
  t: Trace,
  text: string,
  pattern: string,
): ArrayStep {
  const n = text.length;
  const m = pattern.length;
  const start = s.i - s.last;
  const pieces: ArrayPiece[] = [];
  if (s.matched) {
    pieces.push({
      label: "맞은 부분",
      from: start,
      to: s.i,
      tone: "left",
      text: `${s.after} 글자`,
    });
  }
  if (s.hit !== null && s.exit > 0) {
    pieces.push({
      label: "이어 갈 부분",
      from: s.i - s.exit + 1,
      to: s.i,
      tone: "right",
      text: `${s.exit} 글자`,
    });
  }
  const compared = [...new Set([s.enter, ...s.chain])];
  const failRead = [
    ...[s.enter, ...s.chain.slice(0, -1)]
      .slice(0, s.chain.length)
      .map((v) => v - 1),
    ...(s.hit !== null ? [m - 1] : []),
  ];
  const upto = t.found.filter((_, k) => {
    const at = t.steps.findIndex((x) => x.hit === t.found[k]);
    return at <= s.i;
  });
  const hitSlot = s.hit === null ? [] : [upto.length - 1];
  const calc =
    s.hit !== null
      ? { expr: `${s.i} − ${m} + 1`, result: String(s.hit) }
      : s.chain.length > 0
        ? {
            expr: s.chain
              .map(
                (c, k) =>
                  `fail[${((k === 0 ? s.enter : s.chain[k - 1]) as number) - 1}] = ${c}`,
              )
              .join(" → "),
            result: `j = ${s.exit}`,
          }
        : null;
  return {
    array: [...text],
    range: [start, Math.min(start + m - 1, n - 1)],
    read: [s.i],
    write: [],
    pointers: { i: s.i },
    pieces,
    calc,
    vars: `j = ${s.exit} · 비교 ${s.cmp} 번`,
    layers: [
      { name: "P", values: [...pattern], read: compared },
      { name: "fail", values: [...t.fail], read: failRead, side: "실패 함수" },
      {
        name: "답",
        values: t.found.map((v, k) => (k < upto.length ? v : null)),
        write: hitSlot,
      },
    ],
  };
}

export function walkSteps() {
  const t = trace(WALK_TEXT, WALK_PATTERN);
  return t.steps.map((s) => ({
    id: `T${s.i + 1}`,
    title: stepTitle(s),
    text: stepText(s, t, WALK_PATTERN.length),
    stage: arrayStep(s, t, WALK_TEXT, WALK_PATTERN),
  }));
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 `findAllOccurrences-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return walkSteps().map((s) => ({
    title: `${s.id} ${s.title}`,
    text: s.text,
    ...s.stage,
  }));
}

/* ───────────────── 실패 함수의 생김새 ───────────────── */

function failFrames(pattern: string): StageFrame[] {
  const fail = failOf(pattern);
  return [...pattern].map((_, i) => {
    const b = fail[i] as number;
    const pieces: ArrayPiece[] =
      b === 0
        ? []
        : [
            {
              label: "앞부분",
              from: 0,
              to: b - 1,
              tone: "left",
              text: pattern.slice(0, b),
            },
            {
              label: "뒷부분",
              from: i - b + 1,
              to: i,
              tone: "right",
              text: pattern.slice(i - b + 1, i + 1),
            },
          ];
    return {
      id: `i = ${i}`,
      text:
        b === 0
          ? `P[0..${i}] = ${pattern.slice(0, i + 1)} — 앞부분이자 뒷부분인 진 조각이 없어 fail[${i}] = 0`
          : `P[0..${i}] = ${pattern.slice(0, i + 1)} — 앞 ${b} 글자와 뒤 ${b} 글자가 ${pattern.slice(0, b)} 로 같아 fail[${i}] = ${b}`,
      rows: arrayStage(
        {
          array: [...pattern],
          range: [0, i],
          read: [],
          write: [],
          pieces,
          layers: [
            {
              name: "fail",
              values: fail.map((v, k) => (k <= i ? v : null)),
              write: [i],
            },
          ],
        },
        { arrayName: "P", rangeLabel: "P[0..i]" },
      ),
    };
  });
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 셋 ───────────────── */

const num = (x: number): string => x.toLocaleString("en-US");
const LIMIT = 100_000;
const show = (xs: readonly number[]): string => `[${xs.join(", ")}]`;

function approaches(): Approach[] {
  let bestM = 0;
  let bestCost = 0;
  for (let m = 1; m <= LIMIT; m++) {
    const cost = (LIMIT - m + 1) * m;
    if (cost > bestCost) {
      bestCost = cost;
      bestM = m;
    }
  }
  const skip = skipByMatched(WALK_TEXT, WALK_PATTERN);
  const right = findAllOccurrences(WALK_TEXT, WALK_PATTERN);
  const big = counted("a".repeat(LIMIT), "a".repeat(bestM));
  return [
    {
      name: "시작 자리를 하나씩 다 대조하기",
      idea: "시작 자리마다 패턴의 첫 글자부터 다시 비교한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "비용",
          value: `m = ${num(bestM)} 에서 비교 ${num(bestCost)} 번`,
          ok: false,
        },
      ],
      lesson:
        "어긋나기 전에 맞은 글자를 버리고 다시 읽는다 — 맞은 만큼 건너뛰면 어떨까",
    },
    {
      name: "맞은 길이만큼 시작 자리 옮기기",
      idea: "어긋나면 이미 맞은 글자 수만큼 시작 자리를 건너뛴다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `전개 입력에서 ${show(skip)} · 정답 ${show(right)}`,
          ok: false,
        },
        { label: "비용", value: "텍스트 자리를 되돌리지 않는다", ok: true },
      ],
      lesson:
        "건너뛴 구간 안에서 시작하는 등장을 놓친다 — 얼마를 남길지 따로 정해야 한다",
    },
    {
      name: "맞은 길이를 실패 함수 값으로 줄이기",
      idea: "텍스트 자리는 그대로 두고, 맞은 길이만 경계 길이로 줄인다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "비용",
          value: `같은 규모에서 비교 ${num(big.build + big.scan)} 번`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────────────── 그림 ───────────────────────── */

export const FIGS: Record<string, () => ReactElement> = {
  "concept-overlap": () => {
    const text = "ababcababab";
    const pattern = "abab";
    const found = findAllOccurrences(text, pattern);
    const tones = ["left", "right", "query"] as const;
    const shared: number[] = [];
    for (let k = 1; k < found.length; k++) {
      const a = found[k - 1] as number;
      const b = found[k] as number;
      for (let c = b; c < a + pattern.length; c++) shared.push(c);
    }
    return (
      <RangeCover
        title={`"${text}" 에서 "${pattern}" 가 시작하는 자리 ${found.length} 곳`}
        row={{ label: "T", values: [...text] }}
        indexLabel="자리"
        ranges={found.map((s, k) => ({
          from: s,
          to: s + pattern.length - 1,
          tone: tones[k % tones.length] as (typeof tones)[number],
          note: `자리 ${s} 에서 시작`,
        }))}
        annotation={{
          cells: shared,
          text: `자리 ${shared.join(" · ")} 는 두 등장이 함께 쓴다`,
        }}
      />
    );
  },
  "concept-fail": () => {
    const p = WALK_PATTERN;
    const i = p.length - 1;
    const b = failOf(p)[i] as number;
    return (
      <RangeCover
        title={`fail[${i}] = ${b} — ${p} 의 앞 ${b} 글자와 뒤 ${b} 글자가 같다`}
        row={{ label: "P", values: [...p] }}
        indexLabel="자리"
        ranges={[
          {
            from: 0,
            to: b - 1,
            tone: "left",
            note: `앞 ${b} 글자 ${p.slice(0, b)}`,
          },
          {
            from: i - b + 1,
            to: i,
            tone: "right",
            note: `뒤 ${b} 글자 ${p.slice(i - b + 1)}`,
          },
        ]}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`텍스트·패턴 길이 ${num(LIMIT)} 이하 · 흔한 채점 환경의 예산 1 초(단순 연산 1 초에 1 억 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-fail-film": () => (
    <CellStageFilm
      title={`패턴 ${WALK_PATTERN} 의 실패 함수 — 자리마다 앞부분이자 뒷부분인 가장 긴 진 조각`}
      columns={WALK_PATTERN.length}
      frames={failFrames(WALK_PATTERN)}
    />
  ),
  "walk-kmp": () => {
    const steps = walkSteps();
    return (
      <CellStageFilm
        title={`findAllOccurrences("${WALK_TEXT}", "${WALK_PATTERN}") — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={WALK_TEXT.length}
        frames={steps.map((s) => ({
          id: s.id,
          text: s.title,
          rows: arrayStage(s.stage, ARRAY_OPTIONS),
        }))}
      />
    );
  },
  "invariant-window": () => {
    const t = trace(WALK_TEXT, WALK_PATTERN);
    const s = t.steps.find((x) => x.hit !== null && t.steps[x.i + 1]);
    const next = t.steps[(s?.i ?? 0) + 1] as Step;
    const j = next.exit;
    const from = next.i - j + 1;
    const states: Partial<Record<number, CellState>> = {};
    for (let c = next.i + 1; c < WALK_TEXT.length; c++) states[c] = "out";
    return (
      <RangeCover
        title={`T${next.i + 1}${이가(next.i + 1)} 끝난 시점 — j = ${j} 는 자리 ${next.i} 에서 끝나며 P 의 앞부분과 같은 가장 긴 조각의 길이다`}
        row={{ label: "T", values: [...WALK_TEXT], states }}
        indexLabel="자리"
        ranges={[
          {
            from,
            to: next.i,
            tone: "query",
            note: `T[${from}..${next.i}] = ${WALK_TEXT.slice(from, next.i + 1)} = P[0..${j - 1}]`,
          },
        ]}
        annotation={{
          cells: Array.from(
            { length: WALK_TEXT.length - next.i - 1 },
            (_, k) => next.i + 1 + k,
          ),
          text: "대시 칸은 아직 읽지 않은 자리다",
        }}
      />
    );
  },
};
