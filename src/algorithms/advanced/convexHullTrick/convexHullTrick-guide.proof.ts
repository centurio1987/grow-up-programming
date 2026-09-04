/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/advanced/convexHullTrick/convexHullTrick-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { flipExponent } from "./convexHullTrick-guide.alt.ts";
import {
  ConvexHullTrick,
  evalAt,
  isCovered,
  type Line,
} from "./convexHullTrick-guide.ref.ts";

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 머리줄만 어긋난다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padL = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** `1961241` → `1,961,241`. `toLocaleString` 은 환경에 따라 갈려서 직접 적는다. */
const comma = (n: number | bigint): string =>
  String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** 열 폭을 내용에서 잰 뒤 표를 만든다. 첫 열은 왼쪽, 나머지는 오른쪽 정렬이다. */
function table(head: string[], rows: string[][]): string {
  const w = head.map((h, i) =>
    Math.max(width(h), ...rows.map((r) => width(r[i] ?? ""))),
  );
  const line = (cells: string[]): string =>
    cells
      .map((c, i) =>
        i === 0 ? pad(c, w[0] as number) : padL(c, w[i] as number),
      )
      .join("  ")
      .replace(/\s+$/, "");
  return [line(head), ...rows.map(line)].join("\n");
}

/* ────────────────────────── 입력 ────────────────────────── */

/** 전개가 쓰는 직선 목록. 본문의 다른 자리도 같은 값을 가리킨다. */
const WALK: [number, number][] = [
  [-2, 0],
  [-1, 5],
  [0, -1],
  [0, -3],
  [2, 0],
  [2, 7],
];
/** 전개가 쓰는 질의. */
const WALK_X = [0, -4, 4];

/** 「아이디어 상세」가 쓰는 작은 입력. 다섯 중 하나만 담당 구간이 비어 있다. */
const SMALL: [number, number][] = [
  [-2, 0],
  [-1, 5],
  [0, -1],
  [1, 2],
  [2, 8],
];

/** 한 번의 등록이 여러 개를 버리는 입력. */
const CHAIN: [number, number][] = [
  [-3, 9],
  [-2, 4],
  [-1, 1],
  [0, 0],
  [1, 1],
  [2, -1000],
];

/** 준무작위 직선 — `m_i = i` · `b_i = (i × 48,271) mod 65,537`. */
const quasi = (n: number): [number, number][] => {
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) out.push([i, (i * 48_271) % 65_537]);
  return out;
};

/** 모든 직선이 껍질에 남는 입력 — `b = m²` 은 아래로 볼록이다. */
const convex = (n: number): [number, number][] => {
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const m = i - Math.floor(n / 2);
    out.push([m, m * m]);
  }
  return out;
};

/** 직선 목록을 등록한 자료구조. */
const build = (lines: [number, number][]): ConvexHullTrick => {
  const cht = new ConvexHullTrick();
  for (const [m, b] of lines) cht.addLine(m, b);
  return cht;
};

/** 등록한 직선을 전부 계산하는 대조군. 계산 횟수를 함께 돌려준다. */
function scanAll(
  lines: [number, number][],
  xs: number[],
): { answers: number[]; evals: number } {
  let evals = 0;
  const answers = xs.map((x) => {
    let best = Number.POSITIVE_INFINITY;
    for (const [m, b] of lines) {
      evals++;
      const v = m * x + b;
      if (v < best) best = v;
    }
    return best;
  });
  return { answers, evals };
}

/** 이진 탐색이 도는 반복 수 — 길이 `s` 의 껍질에서 `⌈log₂ s⌉` 다. */
const rounds = (s: number): number => (s <= 1 ? 0 : Math.ceil(Math.log2(s)));

/** 배정밀도 정수가 하나씩 셀 수 있는 경계. 「멈춤 — 정밀도」가 이 값을 실행으로 확인한다. */
const EXACT_LIMIT = 2 ** 53;

/** `hull[k]` 와 `hull[k+1]` 이 만나는 x 좌표. 그림과 검산에만 쓴다. */
const crossX = (a: Line, c: Line): number => (c.b - a.b) / (a.m - c.m);

/* ────────────────────────── 계측판 ────────────────────────── */

/** 넣기와 버리기가 몇 번씩 일어나는가. */
function pushPop(lines: [number, number][]): {
  pushes: number;
  pops: number;
  worstOnce: number;
  size: number;
} {
  const cht = new ConvexHullTrick();
  let pushes = 0;
  let pops = 0;
  let worstOnce = 0;
  for (const [m, b] of lines) {
    const before = cht.hull.length;
    cht.addLine(m, b);
    const after = cht.hull.length;
    // 새 직선이 꼭대기에 있으면 넣은 것이다. 버린 수는 길이 차이에서 되짚어 센다.
    const top = cht.hull[cht.hull.length - 1];
    const pushed = top !== undefined && top.m === m && top.b === b ? 1 : 0;
    const dropped = before + pushed - after;
    pushes += pushed;
    pops += dropped;
    worstOnce = Math.max(worstOnce, dropped);
  }
  return { pushes, pops, worstOnce, size: cht.hull.length };
}

/** 점 (m, b) 들의 하한 볼록 껍질 — 모노톤 체인. 세 점의 방향으로 버린다. */
function lowerHull(points: [number, number][]): [number, number][] {
  const out: [number, number][] = [];
  for (const p of points) {
    while (out.length >= 2) {
      const a = out[out.length - 2] as [number, number];
      const c = out[out.length - 1] as [number, number];
      const turn =
        (c[0] - a[0]) * (p[1] - a[1]) - (c[1] - a[1]) * (p[0] - a[0]);
      if (turn > 0) break;
      out.pop();
    }
    out.push(p);
  }
  return out;
}

/* ────────────────────────── 변이 ────────────────────────── */

/**
 * 변이를 **정본 소스에서** 만든다. 손으로 베낀 사본을 쓰면 「한 곳만 바꿨다」가 검사되지
 * 않는다. 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const REF = new URL("./convexHullTrick-guide.ref.ts", import.meta.url).pathname;

type Impl = {
  addLine(m: number, b: number): void;
  query(x: number): number;
  hull: Line[];
};
type RefModule = { ConvexHullTrick: new () => Impl };

/** 담당 구간 판정의 부등호를 뒤집은 판. */
const 뒤집기 = await loadMutant<RefModule>(REF, {
  swap: [/\) >= \(/, ") <= ("],
});

/** 꼭대기를 한 번만 버리는 판 — 연쇄 제거를 끊는다. */
const 한번만 = await loadMutant<RefModule>(REF, {
  swap: [/while \(topCovered\(\)\)/, "if (topCovered())"],
});

/** 같은 기울기 처리를 건너뛰는 판. */
const 기울기가드없이 = await loadMutant<RefModule>(REF, {
  swap: [/top !== undefined && top\.m === m/, "false"],
});

/** 어떤 판이든 같은 방식으로 실행한다. */
function runWith(
  Ctor: new () => Impl,
  lines: [number, number][],
  xs: number[],
): { answers: number[]; size: number } {
  const it = new Ctor();
  for (const [m, b] of lines) it.addLine(m, b);
  return { answers: xs.map((x) => it.query(x)), size: it.hull.length };
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** 질의마다 등록된 직선을 전부 계산하면 제약 상한에서 몇 번이 되는가. */
  naiveScale: () => {
    const rows: string[][] = [];
    for (const n of [10, 100, 1_000, 3_000]) {
      const lines = quasi(n);
      const xs: number[] = [];
      for (let j = 0; j < n; j++) xs.push(j - Math.floor(n / 2));
      const { evals } = scanAll(lines, xs);
      rows.push([comma(n), comma(n), comma(evals), comma(n * n)]);
    }
    for (const n of [10_000, 100_000]) {
      rows.push([comma(n), comma(n), "세지 못했다", comma(n * n)]);
    }
    return table(
      ["직선 수 n", "질의 수 q", "실제로 센 직선 계산", "식으로 낸 직선 계산"],
      rows,
    );
  },

  /** 작은 입력에서 어느 직선이 어느 자리의 최솟값을 내는가. */
  whoWins: () => {
    const xs = [-8, -6, -4, -2, 0, 2, 4, 6];
    const head = ["직선", ...xs.map((x) => `x=${x}`)];
    const rows = SMALL.map(([m, b]) => [
      `y = ${m}x ${b >= 0 ? "+" : "−"} ${Math.abs(b)}`,
      ...xs.map((x) => comma(m * x + b)),
    ]);
    const mins = xs.map((x) => Math.min(...SMALL.map(([m, b]) => m * x + b)));
    rows.push(["최솟값", ...mins.map((v) => comma(v))]);
    rows.push([
      "그 값을 낸 직선의 기울기",
      ...xs.map((x, i) =>
        SMALL.filter(([m, b]) => m * x + b === mins[i])
          .map(([m]) => comma(m))
          .join("·"),
      ),
    ]);
    return table(head, rows);
  },

  /** 담당 구간이 빈 직선을 버리면 질의 하나에 계산하는 직선이 몇 개가 되는가. */
  keepDrop: () => {
    const rows: string[][] = [];
    for (const n of [16, 64, 256, 1_024, 4_096]) {
      const lines = quasi(n);
      const cht = build(lines);
      const s = cht.hull.length;
      rows.push([
        comma(n),
        comma(s),
        comma(n),
        comma(s),
        `${comma(Math.round(n / s))} 배`,
      ]);
    }
    return table(
      [
        "직선 수 n",
        "껍질에 남은 수 s",
        "전부 계산할 때",
        "껍질만 계산할 때",
        "줄어든 배수",
      ],
      rows,
    );
  },

  /** 「절편이 가장 작은 직선 하나만 남긴다」 후보를 값으로 반박한다. */
  interceptOnly: () => {
    const best = SMALL.reduce((acc, l) => (l[1] < acc[1] ? l : acc));
    const xs = [-8, -4, 0, 4, 8];
    const rows = xs.map((x) => {
      const only = best[0] * x + best[1];
      const real = Math.min(...SMALL.map(([m, b]) => m * x + b));
      return [
        `x = ${x}`,
        comma(only),
        comma(real),
        only === real ? "같다" : `${comma(only - real)} 만큼 크다`,
      ];
    });
    return table(
      [
        `y = ${best[0]}x − ${Math.abs(best[1])} 하나만 남기면`,
        "그 직선의 값",
        "실제 최솟값",
        "차이",
      ],
      rows,
    );
  },

  /** 껍질의 이웃 교점이 자리 순서로 감소한다. */
  crossOrder: () => {
    const rows: string[][] = [];
    for (const [name, lines] of [
      ["전개 입력", WALK],
      ["작은 입력", SMALL],
      ["b = m² · n=8", convex(8)],
    ] as [string, [number, number][]][]) {
      const cht = build(lines);
      const xs: string[] = [];
      for (let k = 0; k + 1 < cht.hull.length; k++) {
        xs.push(String(crossX(cht.hull[k] as Line, cht.hull[k + 1] as Line)));
      }
      let falling = true;
      for (let k = 0; k + 1 < xs.length; k++) {
        if (Number(xs[k]) <= Number(xs[k + 1])) falling = false;
      }
      rows.push([
        name,
        comma(lines.length),
        comma(cht.hull.length),
        xs.join(" > "),
        falling ? "감소한다" : "감소하지 않는다",
      ]);
    }
    return table(
      ["입력", "직선 수", "껍질 크기", "이웃 교점 X_k 를 자리 순서로", "판정"],
      rows,
    );
  },

  /** 껍질을 자리 순서로 전부 계산하는 것과 이진 탐색의 계산 횟수. */
  scanVsBinary: () => {
    const rows: string[][] = [];
    for (const n of [2, 4, 8, 16, 64, 256, 1_024]) {
      const cht = build(convex(n));
      const s = cht.hull.length;
      const r = rounds(s);
      rows.push([comma(n), comma(s), comma(s), comma(r), comma(2 * r + 1)]);
    }
    return table(
      [
        "직선 수 n",
        "껍질 크기 s",
        "전부 계산",
        "이진 탐색 반복",
        "이진 탐색이 계산한 직선",
      ],
      rows,
    );
  },

  /** 전개 열두 걸음. */
  walkTable: () => {
    const cht = new ConvexHullTrick();
    const shape = (): string =>
      cht.hull.map((l) => `(${l.m}, ${l.b})`).join(" ") || "(비었다)";
    const rows: string[][] = [];

    cht.addLine(-2, 0);
    rows.push(["T1", "addLine(-2, 0)", "길이가 2 미만이라 검사 없음", shape()]);
    cht.addLine(-1, 5);
    rows.push(["T2", "addLine(-1, 5)", "길이가 2 미만이라 검사 없음", shape()]);

    const c3 = isCovered({ m: -2, b: 0 }, { m: -1, b: 5 }, { m: 0, b: -1 });
    rows.push([
      "T3",
      "addLine(0, -1)",
      `isCovered 가 ${c3 ? "참" : "거짓"} — 꼭대기 (-1, 5) 를 버린다`,
      shape(),
    ]);
    cht.addLine(0, -1);
    rows.push(["T4", "addLine(0, -1)", "넣는다", shape()]);

    rows.push([
      "T5",
      "addLine(0, -3)",
      "기울기가 같고 -1 <= -3 이 거짓 — 꼭대기 (0, -1) 을 버린다",
      shape(),
    ]);
    cht.addLine(0, -3);
    rows.push(["T6", "addLine(0, -3)", "넣는다", shape()]);

    const c7 = isCovered({ m: -2, b: 0 }, { m: 0, b: -3 }, { m: 2, b: 0 });
    cht.addLine(2, 0);
    rows.push([
      "T7",
      "addLine(2, 0)",
      `isCovered 가 ${c7 ? "참" : "거짓"} — 아무것도 안 버리고 넣는다`,
      shape(),
    ]);
    cht.addLine(2, 7);
    rows.push([
      "T8",
      "addLine(2, 7)",
      "기울기가 같고 0 <= 7 이 참 — 새 직선을 버린다",
      shape(),
    ]);

    const trace = (x: number, label: string[]): void => {
      let lo = 0;
      let hi = cht.hull.length - 1;
      let step = 0;
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        const here = evalAt(cht.hull[mid] as Line, x);
        const next = evalAt(cht.hull[mid + 1] as Line, x);
        const go = here <= next;
        if (go) hi = mid;
        else lo = mid + 1;
        rows.push([
          label[step] as string,
          `query(${x})`,
          `mid=${mid} · ${comma(here)} <= ${comma(next)} → ${go ? "참" : "거짓"} → lo=${lo} hi=${hi}`,
          go ? "왼쪽 절반만 남긴다" : "오른쪽 절반만 남긴다",
        ]);
        step++;
      }
      rows.push([
        label[step] as string,
        `query(${x})`,
        `lo 와 hi 가 ${lo} 에서 만났다`,
        `답 ${comma(evalAt(cht.hull[lo] as Line, x))}`,
      ]);
    };
    trace(0, ["T9", "T10", "T10"]);
    trace(-4, ["T11", "T11"]);
    trace(4, ["T12", "T12", "T12"]);

    const shaped = table(
      ["단계", "동작", "무슨 일이 일어나는가", "결과"],
      rows,
    );
    const answers = WALK_X.map((x) => comma(build(WALK).query(x))).join(" · ");
    return `${shaped}\n\n껍질 = ${shape()}\n답 = ${answers}`;
  },

  /** 멈춤 1 — 꼭대기를 한 번만 버리면 어떻게 되는가. */
  pauseChain: () => {
    const xs = [0, -2, 3, 10, -10];
    const good = runWith(ConvexHullTrick, CHAIN, xs);
    const bad = runWith(한번만.ConvexHullTrick, CHAIN, xs);
    const rows = xs.map((x, i) => [
      `query(${x})`,
      comma(good.answers[i] as number),
      comma(bad.answers[i] as number),
      good.answers[i] === bad.answers[i] ? "같다" : "다르다",
    ]);
    const walkGood = runWith(ConvexHullTrick, WALK, WALK_X);
    const walkBad = runWith(한번만.ConvexHullTrick, WALK, WALK_X);
    return `${table(
      ["연쇄 입력의 질의", "바른 코드", "한 번만 버린 코드", "판정"],
      rows,
    )}

껍질 크기        ${good.size} 대 ${bad.size}
전개 입력의 답   ${walkGood.answers.join(" · ")} 대 ${walkBad.answers.join(" · ")}`;
  },

  /** 멈춤 2 — 같은 기울기 처리를 빼면 어떻게 되는가. */
  pauseSlope: () => {
    const xs: number[] = [];
    for (let x = -10; x <= 10; x++) xs.push(x);
    let cases = 0;
    let sameAnswer = 0;
    let biggerHull = 0;
    for (let a = -3; a <= 3; a++)
      for (let b of [-3, -2, -1, 0, 1, 2, 3])
        for (let c = -3; c <= 3; c++)
          for (let d = -3; d <= 3; d++) {
            const lines: [number, number][] = [
              [0, a],
              [0, b],
              [1, c],
              [1, d],
            ];
            const good = runWith(ConvexHullTrick, lines, xs);
            const off = runWith(기울기가드없이.ConvexHullTrick, lines, xs);
            cases++;
            if (good.answers.join() === off.answers.join()) sameAnswer++;
            if (off.size > good.size) biggerHull++;
          }
    const walkGood = runWith(ConvexHullTrick, WALK, WALK_X);
    const walkOff = runWith(기울기가드없이.ConvexHullTrick, WALK, WALK_X);
    return `기울기가 0 · 0 · 1 · 1 이고 절편이 -3…3 인 직선 넷을 전수로 만들어
질의 x = -10…10 을 두 판에 각각 실행한다

  만든 입력                  ${comma(cases)} 벌
  답이 21 자리 전부 같은 벌  ${comma(sameAnswer)} 벌
  껍질이 더 커진 벌          ${comma(biggerHull)} 벌

전개 입력에서
  바른 코드          답 ${walkGood.answers.join(" · ")} · 껍질 ${walkGood.size}
  같은 기울기 처리 없이  답 ${walkOff.answers.join(" · ")} · 껍질 ${walkOff.size}`;
  },

  /** 멈춤 3 — 제약이 허용하는 값에서 배정밀도가 어긋나는 자리. */
  pausePrecision: () => {
    const exact = (m: number, x: number, b: number): bigint =>
      BigInt(m) * BigInt(x) + BigInt(b);
    const trials: [number, number, number][] = [
      [1, 1, 1],
      [999_999, 999_999, 1],
      [999_999_999, 999_999_999, 1],
      [123_456_789, 987_654_321, 10 ** 18],
      [10 ** 9, 10 ** 9, 10 ** 18],
    ];
    const rows = trials.map(([m, x, b]) => {
      const cht = build([[m, b]]);
      const got = cht.query(x);
      const want = exact(m, x, b);
      return [
        `m=${comma(m)} · x=${comma(x)} · b=${comma(b)}`,
        comma(got),
        comma(want),
        comma(BigInt(got) - want),
      ];
    });
    return `${table(
      ["직선 하나와 질의 하나", "이 코드가 낸 값", "정확한 값", "차이"],
      rows,
    )}

배정밀도 정수가 정확한 범위 2^53   ${comma(EXACT_LIMIT)}
2^53 + 1 이 2^53 과 같은가          ${EXACT_LIMIT + 1 === EXACT_LIMIT ? "같다" : "다르다"}
제약이 허용하는 |m·x| 의 최댓값     ${comma(10n ** 18n)}
제약이 허용하는 두 곱의 최댓값      ${comma(4n * 10n ** 27n)}
그 최댓값이 2^53 의 몇 배인가       ${comma((4n * 10n ** 27n) / BigInt(EXACT_LIMIT))}`;
  },

  /** 전체 코드를 실행한 결과. */
  finalRun: () => {
    const rows: string[][] = [];
    const show = (
      name: string,
      lines: [number, number][],
      xs: number[],
    ): void => {
      const cht = build(lines);
      rows.push([
        name,
        comma(lines.length),
        comma(cht.hull.length),
        xs.map((x) => comma(cht.query(x))).join(" · "),
      ]);
    };
    show("전개 입력", WALK, WALK_X);
    show("작은 입력", SMALL, [-8, 0, 8]);
    show("연쇄 입력", CHAIN, [0, 3, 10]);
    show(
      "문제 예시 하나",
      [
        [1, 0],
        [2, -5],
      ],
      [0, 5, 10],
    );
    show(
      "문제 예시 둘",
      [
        [0, 10],
        [1, 0],
        [2, -10],
      ],
      [0, -100, 100],
    );
    show("직선 하나", [[3, 7]], [0, 10, -5]);
    show(
      "평행선만",
      [
        [2, 10],
        [2, 5],
      ],
      [0, 100],
    );
    show("b = m² · n=64", convex(64), [-100, 0, 100]);
    show("준무작위 n=1,024", quasi(1_024), [-1_000, 0, 1_000]);
    return table(["입력", "직선 수", "껍질 크기", "질의의 답"], rows);
  },

  /** 살아남은 직선의 (m, b) 가 그 점들의 하한 볼록 껍질과 같은가. */
  dualHull: () => {
    const rows: string[][] = [];
    for (const [name, lines] of [
      ["전개 입력에서 평행선을 뺀 것", SMALL],
      ["연쇄 입력", CHAIN],
      ["b = m² · n=8", convex(8)],
      ["준무작위 n=256", quasi(256)],
      ["준무작위 n=1,024", quasi(1_024)],
    ] as [string, [number, number][]][]) {
      const kept = build(lines).hull.map((l) => [l.m, l.b] as [number, number]);
      const hullOfPoints = lowerHull(lines);
      rows.push([
        name,
        comma(lines.length),
        comma(kept.length),
        comma(hullOfPoints.length),
        kept.map(String).join() === hullOfPoints.map(String).join()
          ? "같다"
          : "다르다",
      ]);
    }
    const a: Line = { m: -2, b: 0 };
    const c: Line = { m: -1, b: 5 };
    const e: Line = { m: 0, b: -1 };
    const turn = (c.m - a.m) * (e.b - a.b) - (c.b - a.b) * (e.m - a.m);
    return `${table(
      [
        "입력",
        "직선 수",
        "껍질에 남은 직선",
        "점들의 하한 볼록 껍질",
        "두 목록이",
      ],
      rows,
    )}

세 점 (-2, 0) · (-1, 5) · (0, -1) 에서
  방향 판정 (c−a)×(e−a)            ${comma(turn)}
  isCovered 가 낸 값               ${isCovered(a, c, e) ? "참" : "거짓"}
  방향 판정의 부호를 뒤집은 값 ≥ 0  ${-turn >= 0 ? "참" : "거짓"}`;
  },

  /** 수식 절의 검산 — 정의를 값에 넣어 본다. */
  mathCheck: () => {
    const cht = build(WALK);
    const rows: string[][] = [];
    for (let k = 0; k + 1 < cht.hull.length; k++) {
      const a = cht.hull[k] as Line;
      const c = cht.hull[k + 1] as Line;
      const X = crossX(a, c);
      rows.push([
        `X_${k}`,
        `(${c.b} − ${a.b}) / (${a.m} − ${c.m})`,
        String(X),
        comma(evalAt(a, X)),
        comma(evalAt(c, X)),
      ]);
    }
    const amort: string[][] = [];
    for (const n of [8, 64, 1_024, 8_192]) {
      const q = pushPop(convex(n));
      const r = pushPop(quasi(n));
      amort.push([
        comma(n),
        `${comma(q.pushes)} + ${comma(q.pops)} = ${comma(q.pushes + q.pops)}`,
        `${comma(r.pushes)} + ${comma(r.pops)} = ${comma(r.pushes + r.pops)}`,
        comma(2 * n),
      ]);
    }
    return `${table(
      [
        "교점",
        "정의에 값을 넣으면",
        "그 값",
        "왼쪽 직선의 값",
        "오른쪽 직선의 값",
      ],
      rows,
    )}

${table(
  [
    "직선 수 n",
    "b = m² 에서 넣기+버리기",
    "준무작위에서 넣기+버리기",
    "상한 2n",
  ],
  amort,
)}`;
  },

  /** 경쟁 설계와 순서가 뒤집히는 좌표 범위. */
  mathFlip: () => {
    const f = flipExponent();
    return table(
      [
        "좌표 범위 C",
        "이 가이드의 기본 연산",
        "리 차오 트리의 기본 연산",
        "더 적은 쪽",
      ],
      [
        [
          `2^${f.prevExp} = ${comma(2 ** f.prevExp)}`,
          comma(f.prevHull),
          comma(f.prevLiChao),
          "리 차오 트리",
        ],
        [
          `2^${f.exp} = ${comma(2 ** f.exp)}`,
          comma(f.hull),
          comma(f.liChao),
          "이 가이드",
        ],
      ],
    );
  },

  /** 불변식을 지키던 줄 하나를 바꾸면 어떤 값이 나오는가. */
  mutantCovered: () => {
    const xs = [0, -4, 4, -1, 1];
    const good = runWith(ConvexHullTrick, WALK, xs);
    const bad = runWith(뒤집기.ConvexHullTrick, WALK, xs);
    const rows = xs.map((x, i) => [
      `query(${x})`,
      comma(good.answers[i] as number),
      comma(bad.answers[i] as number),
      good.answers[i] === bad.answers[i] ? "같다" : "다르다",
    ]);
    const smallGood = runWith(ConvexHullTrick, SMALL, xs);
    const smallBad = runWith(뒤집기.ConvexHullTrick, SMALL, xs);
    return `${table(
      ["전개 입력의 질의", "바른 코드", "부등호를 뒤집은 코드", "판정"],
      rows,
    )}

껍질에 남은 직선
  바른 코드     ${build(WALK)
    .hull.map((l) => `(${l.m}, ${l.b})`)
    .join(" ")}
  뒤집은 코드   ${(() => {
    const it = new 뒤집기.ConvexHullTrick();
    for (const [m, b] of WALK) it.addLine(m, b);
    return it.hull.map((l) => `(${l.m}, ${l.b})`).join(" ");
  })()}

작은 입력의 답  ${smallGood.answers.join(" · ")} 대 ${smallBad.answers.join(" · ")}`;
  },

  /** 비용을 세는 과정이 쓰는 계수. */
  perfCount: () => {
    const rows: string[][] = [];
    for (const [name, lines] of [
      ["전개 입력", WALK],
      ["연쇄 입력", CHAIN],
      ["준무작위 n=1,024", quasi(1_024)],
      ["b = m² · n=1,024", convex(1_024)],
      ["b = m² · n=100,000", convex(100_000)],
    ] as [string, [number, number][]][]) {
      const p = pushPop(lines);
      rows.push([
        name,
        comma(lines.length),
        comma(p.pushes),
        comma(p.pops),
        comma(p.pushes + p.pops),
        comma(2 * lines.length),
        comma(rounds(p.size)),
      ]);
    }
    return table(
      [
        "입력",
        "직선 수 n",
        "넣기",
        "버리기",
        "둘의 합",
        "상한 2n",
        "질의 하나의 반복",
      ],
      rows,
    );
  },

  /** 최악을 만드는 입력. */
  worstInput: () => {
    const rows: string[][] = [];
    for (const [name, lines] of [
      ["b = m² · n=1,024", convex(1_024)],
      ["b = m² · n=100,000", convex(100_000)],
      ["준무작위 n=100,000", quasi(100_000)],
      [
        "b = −m² · n=100,000",
        (() => {
          const out: [number, number][] = [];
          for (let i = 0; i < 100_000; i++) {
            const m = i - 50_000;
            out.push([m, -(m * m)]);
          }
          return out;
        })(),
      ],
    ] as [string, [number, number][]][]) {
      const p = pushPop(lines);
      rows.push([
        name,
        comma(lines.length),
        comma(p.size),
        comma(p.worstOnce),
        comma(p.pushes + p.pops),
        comma(rounds(p.size)),
      ]);
    }
    const spike: string[][] = [];
    for (const n of [8, 64, 1_024, 100_000]) {
      const it = new ConvexHullTrick();
      const lines = convex(n);
      for (let i = 0; i + 1 < lines.length; i++) {
        const [m, b] = lines[i] as [number, number];
        it.addLine(m, b);
      }
      const before = it.hull.length;
      it.addLine(n, -(10 ** 15));
      const after = it.hull.length;
      spike.push([
        comma(n),
        comma(before),
        comma(after),
        comma(before + 1 - after),
      ]);
    }
    return `${table(
      [
        "입력",
        "직선 수 n",
        "껍질 크기 s",
        "한 번의 등록이 버린 최대 개수",
        "넣기+버리기 총합",
        "질의 하나의 반복",
      ],
      rows,
    )}

${table(
  [
    "b = m² 를 n−1 개 쌓고 마지막에 y = n·x − 10^15 을 넣으면",
    "그 직전 껍질 크기",
    "그 뒤 껍질 크기",
    "그 한 번이 버린 개수",
  ],
  spike,
)}`;
  },

  /** 스스로 점검하기의 답이 붙는 문제. */
  checkStep: () => {
    const rows: string[][] = [];
    for (const n of [4, 8, 16, 64, 256, 1_024]) {
      const lines: [number, number][] = [];
      for (let i = 0; i < n; i++) {
        const m = i - Math.floor(n / 2);
        lines.push([m, m * m]);
      }
      const cht = build(lines);
      rows.push([
        comma(n),
        comma(cht.hull.length),
        comma(rounds(cht.hull.length)),
        comma(2 * rounds(cht.hull.length) + 1),
        comma(n),
      ]);
    }
    return table(
      [
        "직선 수 n",
        "껍질 크기 s",
        "질의 하나의 반복",
        "질의 하나가 계산한 직선",
        "전부 계산했을 때",
      ],
      rows,
    );
  },
};
