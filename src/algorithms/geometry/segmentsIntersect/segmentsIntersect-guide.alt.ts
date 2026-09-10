/**
 * `purpose.alt`(경쟁 설계와의 대조) 의 수치를 내는 하네스 — L13.
 *
 *   bun run ../../../../tools/bench-alt.ts segmentsIntersect-guide.alt.ts
 *
 * **경쟁 설계는 「큰 정수 전용」이다.** 같은 목표(두 선분이 한 점이라도 공유하는지를 정확히
 * 답하는 것)를 노리되, 방향 판정을 배정밀도로 먼저 재 보지 않고 **처음부터 큰 정수로만**
 * 잰다. 답은 두 설계가 언제나 같다 — 갈리는 것은 연산의 수와 종류다.
 *
 * **계수 둘을 센다.**
 *
 *   기본 연산   배정밀도 곱 + 큰 정수 변환 + 큰 정수 곱 + 칸 비교를 각각 1 로 센 합
 *   큰 정수 곱  그중 큰 정수 곱만 따로 센 것

 * 「기본 연산」의 정의는 `perf`(비용 계산) 절이 쓰는 것과 같다 — 한 낱말이 두 절에서 다른
 * 것을 세면 표를 나란히 놓을 수 없다.
 *
 * 판정 하나에 걸러내기는 배정밀도 곱 2 를 쓰고, 그 값이 `SAFE` 를 못 넘으면 큰 정수 변환 4 와
 * 큰 정수 곱 2 를 더 쓴다(2 또는 8). 큰 정수 전용은 언제나 변환 4 와 곱 2 를 쓴다(6).
 * **벽시계는 재지 않는다** — 실행마다 값이 달라 「일치」를 정의할 수 없다(L13).
 *
 * **입력을 결과에 맞춰 고르지 않는다**(L20). 생성식 둘을 정하고 좌표 상한만 바꾼다.
 *
 *   흩어진 선분  네 점을 [0, C] 격자에서 뽑아 두 선분으로 묶는다
 *   같은 직선 위  y = 2x 위의 x 좌표 넷을 뽑아 정렬해 두 구간으로 묶는다
 *
 * 씨앗은 `SEED` 하나로 고정하고, 두 설계가 정본과 같은 답을 내는지 `measure()` 가 쌍마다
 * 확인한다. 답이 다른 구현으로 잰 계수는 저울질이 아니라 다른 문제의 값이다.
 */
import {
  type Point,
  type Segment,
  segmentsIntersect,
} from "./segmentsIntersect-guide.ref.ts";

/** 정본과 같은 값. 여기서 다시 정하는 것이 아니라 같은 하한을 쓴다는 뜻이다. */
const SAFE = 2048;

/** 생성 씨앗. 값을 바꾸면 입력이 바뀌므로 상수로 고정한다. */
const SEED = 20_260_904;

/** 규모 대조에 쓰는 선분 쌍의 수. */
const PAIRS = 4_096;

/** 제약의 좌표 절댓값 상한. */
const COORD = 1_000_000_000;

/** 기본 연산의 순서가 뒤집히는 좌표 상한. `flipPoint()` 가 실제로 그 자리인지 본다. */
const TIE = 6;
const FLIP = 7;

/** `deep.walk` 가 쓰는 전개 입력 — 선분 넷 가운데 세 쌍. */
const WALK_SEGMENTS: Segment[] = [
  [
    [0, 0],
    [6, 4],
  ],
  [
    [0, 4],
    [6, 0],
  ],
  [
    [2, 0],
    [2, 1],
  ],
  [
    [3, 2],
    [9, 6],
  ],
];
const WALK: [Segment, Segment][] = [
  [WALK_SEGMENTS[0] as Segment, WALK_SEGMENTS[1] as Segment],
  [WALK_SEGMENTS[0] as Segment, WALK_SEGMENTS[2] as Segment],
  [WALK_SEGMENTS[0] as Segment, WALK_SEGMENTS[3] as Segment],
];

/** xorshift32. 선형 합동 난수는 아래 자리가 짧게 되풀이돼 같은 좌표가 쏟아진다. */
function makeRnd(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s;
  };
}

/** 좌표 상한 `bound` 안에서 흩어진 선분 쌍. */
function scattered(total: number, bound: number): [Segment, Segment][] {
  const rnd = makeRnd(SEED);
  const pick = (): Point => [rnd() % (bound + 1), rnd() % (bound + 1)];
  const out: [Segment, Segment][] = [];
  for (let at = 0; at < total; at++) {
    out.push([
      [pick(), pick()],
      [pick(), pick()],
    ]);
  }
  return out;
}

/** `y = 2x` 위에서 구간을 공유하는 선분 쌍. 네 판정값이 전부 0 이 된다. */
function collinearOverlap(total: number, bound: number): [Segment, Segment][] {
  const rnd = makeRnd(SEED);
  const half = Math.floor(bound / 2);
  const out: [Segment, Segment][] = [];
  for (let at = 0; at < total; at++) {
    const xs = [rnd() % half, rnd() % half, rnd() % half, rnd() % half].sort(
      (p, q) => p - q,
    );
    const on = (k: number): Point => [xs[k] as number, 2 * (xs[k] as number)];
    out.push([
      [on(0), on(2)],
      [on(1), on(3)],
    ]);
  }
  return out;
}

interface Counted {
  /** 배정밀도 곱 + 큰 정수 변환 + 큰 정수 곱 + 칸 비교. */
  ops: number;
  /** 그중 큰 정수 곱만. */
  bigMul: number;
}

type Judge = (o: Point, a: Point, b: Point, c: Counted) => number;

/** 이 가이드가 가르치는 판정에 계수만 덧붙인 것. */
const filtered: Judge = (o, a, b, c) => {
  const ux = a[0] - o[0];
  const uy = a[1] - o[1];
  const vx = b[0] - o[0];
  const vy = b[1] - o[1];
  c.ops += 2;
  const approx = ux * vy - uy * vx;
  if (approx > SAFE || approx < -SAFE) return approx > 0 ? 1 : -1;
  c.ops += 6;
  c.bigMul += 2;
  const exact = BigInt(ux) * BigInt(vy) - BigInt(uy) * BigInt(vx);
  return exact > 0n ? 1 : exact < 0n ? -1 : 0;
};

/** 경쟁 설계 — 배정밀도를 거치지 않고 처음부터 큰 정수로만 잰다. */
const bigOnly: Judge = (o, a, b, c) => {
  c.ops += 6;
  c.bigMul += 2;
  const ux = BigInt(a[0] - o[0]);
  const uy = BigInt(a[1] - o[1]);
  const vx = BigInt(b[0] - o[0]);
  const vy = BigInt(b[1] - o[1]);
  const exact = ux * vy - uy * vx;
  return exact > 0n ? 1 : exact < 0n ? -1 : 0;
};

const straddles = (da: number, db: number): boolean =>
  da !== 0 && db !== 0 && da !== db;

const inBox = (a: Point, b: Point, p: Point): boolean =>
  Math.min(a[0], b[0]) <= p[0] &&
  p[0] <= Math.max(a[0], b[0]) &&
  Math.min(a[1], b[1]) <= p[1] &&
  p[1] <= Math.max(a[1], b[1]);

/** 판정만 갈아 끼운 같은 절차. 두 설계가 여기서 갈라진다. */
function decide(s1: Segment, s2: Segment, judge: Judge, c: Counted): boolean {
  const [p1, p2] = s1;
  const [p3, p4] = s2;
  const d1 = judge(p3, p4, p1, c);
  const d2 = judge(p3, p4, p2, c);
  const d3 = judge(p1, p2, p3, c);
  const d4 = judge(p1, p2, p4, c);
  if (straddles(d1, d2) && straddles(d3, d4)) return true;
  // 칸 검사 하나에 좌표 비교가 넷이다. 두 설계가 같은 검사를 쓰므로 계수도 같은 규칙으로 센다.
  const touches = (a: Point, b: Point, p: Point, d: number): boolean => {
    if (d !== 0) return false;
    c.ops += 4;
    return inBox(a, b, p);
  };
  return (
    touches(p3, p4, p1, d1) ||
    touches(p3, p4, p2, d2) ||
    touches(p1, p2, p3, d3) ||
    touches(p1, p2, p4, d4)
  );
}

/**
 * 두 설계가 **정본과 같은 답**을 내는지 쌍마다 확인한다. 답이 다른 구현으로 잰 계수는
 * 저울질이 아니라 다른 문제의 값이고, 그것으로 낸 판정은 근거가 없다.
 */
function measure(cases: [Segment, Segment][]): {
  mine: Counted;
  theirs: Counted;
} {
  const mine: Counted = { ops: 0, bigMul: 0 };
  const theirs: Counted = { ops: 0, bigMul: 0 };
  for (const [s1, s2] of cases) {
    const want = segmentsIntersect(s1, s2);
    if (decide(s1, s2, filtered, mine) !== want) {
      throw new Error(
        `걸러내기가 정본과 다른 답을 냈다 — ${JSON.stringify(s1)}`,
      );
    }
    if (decide(s1, s2, bigOnly, theirs) !== want) {
      throw new Error(
        `큰 정수 전용이 정본과 다른 답을 냈다 — ${JSON.stringify(s1)}`,
      );
    }
  }
  return { mine, theirs };
}

/** 기본 연산의 순서가 처음 뒤집히는 좌표 상한의 지수. */
function flipPoint(): number {
  for (let k = 1; k <= 30; k++) {
    const cases = scattered(PAIRS, 2 ** k);
    const { mine, theirs } = measure(cases);
    if (mine.ops < theirs.ops) return k;
  }
  throw new Error("재 본 구간 안에서 기본 연산이 뒤집히지 않았다");
}

if (flipPoint() !== FLIP) {
  throw new Error(
    `기본 연산이 뒤집히는 좌표 상한이 2^${flipPoint()} 이다 — 상수와 어긋난다`,
  );
}

const W = measure(WALK);
const A = measure(scattered(PAIRS, 2 ** TIE));
const B = measure(scattered(PAIRS, 2 ** FLIP));
const D = measure(scattered(PAIRS, COORD));
const E = measure(collinearOverlap(PAIRS, COORD));

export const cases = {
  걸러내기: () => ({
    "전개 입력 기본 연산": W.mine.ops,
    "좌표 상한 2^6 기본 연산": A.mine.ops,
    "좌표 상한 2^7 기본 연산": B.mine.ops,
    "좌표 상한 10^9 기본 연산": D.mine.ops,
    "같은 직선 위 기본 연산": E.mine.ops,
    "좌표 상한 10^9 큰 정수 곱": D.mine.bigMul,
    "같은 직선 위 큰 정수 곱": E.mine.bigMul,
  }),
  "큰 정수 전용": () => ({
    "전개 입력 기본 연산": W.theirs.ops,
    "좌표 상한 2^6 기본 연산": A.theirs.ops,
    "좌표 상한 2^7 기본 연산": B.theirs.ops,
    "좌표 상한 10^9 기본 연산": D.theirs.ops,
    "같은 직선 위 기본 연산": E.theirs.ops,
    "좌표 상한 10^9 큰 정수 곱": D.theirs.bigMul,
    "같은 직선 위 큰 정수 곱": E.theirs.bigMul,
  }),
};
