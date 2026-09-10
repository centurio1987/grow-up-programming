/**
 * `purpose.alt`(경쟁 설계와의 대조)의 수치 — L13.
 *
 * 경쟁 설계는 **껍질 위 모든 쌍을 재는 판**이다. 볼록 껍질을 세우는 데까지는 정본과 똑같이
 * 하고, 그 뒤에 캘리퍼스를 두지 않고 껍질 꼭짓점 쌍을 전부 재서 가장 큰 것을 고른다. 같은
 * 문제를 풀고 같은 답을 내며, 껍질을 세우는 비용도 같다 — 갈리는 것은 **껍질을 세운 뒤에
 * 하는 일**뿐이라 그 구간만 센다.
 *
 * 재는 것은 넷이다.
 *
 * | 계수 | 무엇 |
 * | --- | --- |
 * | 거리 계산 | `squared` 호출 수. 한 번이 큰 정수 곱 두 번과 덧셈 한 번이다 |
 * | 방향 판정 | `crossSign` 호출 수. 배정밀도 곱 두 번과 뺄셈 한 번이고, 오차 한계 안이면 큰 정수로 다시 잰다 |
 * | 기본 연산 | 위 둘의 합. 두 설계가 껍질을 세운 뒤에 부르는 함수의 총수다 |
 * | 저장 칸 | 껍질 배열 칸 수에 걸음 안의 값 칸을 더한 것 |
 *
 * **두 설계의 답을 매 실행에서 정본과 대조한다**(`검산`). 계수만 세고 답을 안 맞추면 그
 * 수치는 아무것도 재지 않는다.
 *
 * **껍질 크기가 축이다.** 정본은 껍질 크기에 비례하는 일을 하고 경쟁 설계는 그 제곱에
 * 비례하는 일을 하므로, 껍질이 작으면 경쟁 설계가 적고 크면 정본이 적다. 뒤집히는 자리는
 * 상수로 적지 않고 `뒤집히는_껍질_크기()` 가 실행 시점에 스윕해서 낸다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/geometry/rotatingCalipersDiameter/rotatingCalipersDiameter-guide.alt.ts
 */
import {
  convexHull,
  diameterSquared,
  type Point,
} from "./rotatingCalipersDiameter-guide.ref.ts";

/* ────────────────────────── 공통 입력 ────────────────────────── */

/** 전개가 끝까지 쓰는 여덟 점. 껍질 꼭짓점이 여섯이다. */
export const WALK: Point[] = [
  [0, 0],
  [6, 0],
  [8, 3],
  [6, 6],
  [2, 7],
  [0, 4],
  [3, 3],
  [5, 2],
];

/**
 * 껍질 크기가 정확히 `k` 인 입력. 반지름 1,000,000 인 원 위에서 각을 `k` 등분해 반올림한다.
 *
 * 껍질 크기를 축으로 삼으려면 그 크기를 마음대로 정할 수 있어야 하는데, 전개 입력은 껍질이
 * 여섯으로 고정이라 축이 안 움직인다. 반지름이 크면 반올림해도 세 점이 한 직선에 놓이지
 * 않아 꼭짓점이 `k` 개 그대로 남는다 — 그 사실을 `원_위의_점` 이 실행으로 확인한다.
 */
export function 원_위의_점(k: number): Point[] {
  const R = 1_000_000;
  const out: Point[] = [];
  for (let i = 0; i < k; i++) {
    const th = (2 * Math.PI * i) / k;
    out.push([Math.round(R * Math.cos(th)), Math.round(R * Math.sin(th))]);
  }
  const hull = convexHull(out);
  if (hull.length !== k) {
    throw new Error(`껍질이 ${hull.length} 이라 ${k} 가 아니다`);
  }
  return out;
}

/* ────────────────────────── 계수 ────────────────────────── */

export interface Counter {
  거리: number;
  방향: number;
  칸: number;
}

const blank = (): Counter => ({ 거리: 0, 방향: 0, 칸: 0 });

/** 배정밀도 곱셈만으로 부호를 확정할 수 있는 하한. 정본과 같은 값이다. */
const SAFE = 2048;

function 방향판정(
  c: Counter,
  ux: number,
  uy: number,
  vx: number,
  vy: number,
): number {
  c.방향 += 1;
  const approx = ux * vy - uy * vx;
  if (approx > SAFE || approx < -SAFE) return approx > 0 ? 1 : -1;
  const exact = BigInt(ux) * BigInt(vy) - BigInt(uy) * BigInt(vx);
  return exact > 0n ? 1 : exact < 0n ? -1 : 0;
}

function 제곱거리(c: Counter, a: Point, b: Point): bigint {
  c.거리 += 1;
  const dx = BigInt(a[0] - b[0]);
  const dy = BigInt(a[1] - b[1]);
  return dx * dx + dy * dy;
}

/* ────────────── 이 글의 절차 — 세는 사본 ────────────── */

export function 캘리퍼스(hull: Point[], c: Counter): bigint {
  const k = hull.length;
  c.칸 = Math.max(c.칸, k + 3);
  if (k < 2) return 0n;
  let best = 0n;
  let far = 1;
  for (let i = 0; i < k; i++) {
    const a = hull[i] as Point;
    const b = hull[(i + 1) % k] as Point;
    for (;;) {
      const p = hull[far] as Point;
      const q = hull[(far + 1) % k] as Point;
      const 앞뒤 = 방향판정(
        c,
        b[0] - a[0],
        b[1] - a[1],
        q[0] - p[0],
        q[1] - p[1],
      );
      if (앞뒤 <= 0) break;
      far = (far + 1) % k;
    }
    const f = hull[far] as Point;
    const d1 = 제곱거리(c, a, f);
    if (d1 > best) best = d1;
    const d2 = 제곱거리(c, b, f);
    if (d2 > best) best = d2;
  }
  return best;
}

/* ────────────── 경쟁 설계 — 껍질 위 모든 쌍을 재는 판 ────────────── */

export function 모든_쌍(hull: Point[], c: Counter): bigint {
  const k = hull.length;
  c.칸 = Math.max(c.칸, k + 3);
  let best = 0n;
  for (let i = 0; i < k; i++) {
    for (let j = i + 1; j < k; j++) {
      const d = 제곱거리(c, hull[i] as Point, hull[j] as Point);
      if (d > best) best = d;
    }
  }
  return best;
}

/* ────────────────────────── 작업 ────────────────────────── */

export interface Totals {
  정본: Counter;
  모든쌍: Counter;
}

/** 입력 하나를 두 설계로 각각 처리한 계수. 답은 매번 정본과 대조한다. */
export function 계수(points: Point[]): Totals {
  const hull = convexHull(points);
  const 정본 = blank();
  const 모든쌍 = blank();
  const 참값 = diameterSquared(points);
  const a = 캘리퍼스(hull, 정본);
  const b = 모든_쌍(hull, 모든쌍);
  if (a !== 참값) throw new Error("세는 사본이 정본과 다른 답을 냈다");
  if (b !== 참값) throw new Error("경쟁 설계가 정본과 다른 답을 냈다");
  return { 정본, 모든쌍 };
}

const 합 = (c: Counter): number => c.거리 + c.방향;

/** 기본 연산 축에서 정본이 처음 앞서는 껍질 크기. 상수를 손으로 적지 않는다. */
export function 뒤집히는_껍질_크기(limit = 64): number {
  for (let k = 3; k <= limit; k++) {
    const { 정본, 모든쌍 } = 계수(원_위의_점(k));
    if (합(정본) < 합(모든쌍)) return k;
  }
  throw new Error(`껍질 ${limit} 까지 기본 연산 축이 안 뒤집혔다`);
}

/* ────────────────────────── 계수 표 ────────────────────────── */

const 전개 = 계수(WALK);
const 아홉 = 계수(원_위의_점(9));
const 열 = 계수(원_위의_점(10));
const 예순넷 = 계수(원_위의_점(64));
const 천스물넷 = 계수(원_위의_점(1024));

export const cases = {
  정본: () => ({
    "전개 입력 기본 연산": 합(전개.정본),
    "껍질 9 기본 연산": 합(아홉.정본),
    "껍질 10 기본 연산": 합(열.정본),
    "껍질 64 기본 연산": 합(예순넷.정본),
    "껍질 1024 기본 연산": 합(천스물넷.정본),
    "껍질 1024 거리 계산": 천스물넷.정본.거리,
    "껍질 1024 방향 판정": 천스물넷.정본.방향,
    "껍질 1024 저장 칸": 천스물넷.정본.칸,
  }),
  "껍질 위 모든 쌍을 재는 판": () => ({
    "전개 입력 기본 연산": 합(전개.모든쌍),
    "껍질 9 기본 연산": 합(아홉.모든쌍),
    "껍질 10 기본 연산": 합(열.모든쌍),
    "껍질 64 기본 연산": 합(예순넷.모든쌍),
    "껍질 1024 기본 연산": 합(천스물넷.모든쌍),
    "껍질 1024 거리 계산": 천스물넷.모든쌍.거리,
    "껍질 1024 방향 판정": 천스물넷.모든쌍.방향,
    "껍질 1024 저장 칸": 천스물넷.모든쌍.칸,
  }),
  "뒤집히는 자리": () => ({
    "기본 연산 축의 껍질 크기": 뒤집히는_껍질_크기(),
  }),
};
