/**
 * `purpose.alt` 의 수치 — L13. 같은 질문(직선 무리의 `x` 에서의 최솟값)에 답하는 두 설계를
 * **같은 직선 목록 · 같은 질의 목록**에 실행하고 계수를 센다.
 *
 * 대조 상대는 **리 차오 트리(Li Chao tree)** 다. 좌표 축 `[-C, C]` 를 선분 트리로 반씩 가르고
 * 마디마다 직선 하나를 두었다가, 새 직선이 오면 마디의 가운데 값에서 더 작은 쪽을 그 마디에
 * 남기고 다른 쪽을 자식 하나로 내려보낸다. 질의는 뿌리에서 잎까지 내려가며 지나친 마디의
 * 직선을 전부 계산해 최솟값을 낸다.
 *
 * **채택이 갈리는 축은 좌표 범위 `C` 다.** 이 가이드의 절차는 비용이 **직선 수**에만 붙고
 * (`⌈log₂ n⌉` 번 반복) 좌표 범위와 무관한데, 리 차오 트리는 비용이 **좌표 범위**에만 붙는다
 * (`⌈log₂ 2C⌉` 마디). 두 값의 대소가 뒤집히는 자리가 실제로 있고, `--check` 로 재현된다.
 *
 * 계수 둘. **기본 연산**은 두 설계 모두 **산술 연산 하나와 자료 접근 하나를 각각 1** 로 센다 —
 * 직선 계산 `m·x + b` 는 곱셈 1 · 덧셈 1 로 2, 배열·맵의 읽기와 쓰기는 각각 1, 견주기는 1,
 * 가운데 자리 계산은 덧셈 1 · 나눗셈 1 로 2 다. `isCovered` 는 뺄셈 4 · 곱셈 2 · 견주기 1 로
 * 7 이다. **잡는 칸**은 두 설계가 실제로 들고 있어야 하는 칸 수다 — 껍질의 직선 수와 트리의
 * 마디 수이고, 리 차오 트리는 삽입 한 번에 마디를 많아야 하나 새로 잡으므로 **이 축은 두
 * 설계가 같고 좌표 범위를 바꿔도 안 갈린다.**
 *
 * **입력을 왜 전개 입력으로 안 쓰는가**(L20). 전개는 직선 여섯 · 질의 셋이라 껍질이 셋뿐이고,
 * 그 크기에서는 `⌈log₂ 3⌉ = 2` 와 리 차오의 마디 수가 둘 다 한 자리라 어느 쪽이 왜 적은지가
 * 값에서 나오지 않는다. 그래서 대조는 **제약 규모**에서 한다 — 직선 1,024 개와 질의
 * 16,384 개를 고정하고 **좌표 범위 `C` 만** 갈아 끼운다. 세 값 다 같은 생성식이고, `2^30` 이
 * 문제의 제약(`|x| ≤ 10^9`)에 가장 가까운 자리다.
 *
 * ```
 * s      = C / 1024                          좌표 범위에 맞춘 배율
 * 직선   m_i = i − 512,  b_i = m_i² · s      i = 0 … 1023 (기울기 비감소)
 * 질의   x_j = −C + ⌊2C · j / 16384⌋         j = 0 … 16383
 * ```
 *
 * 직선을 `b = m²·s` 로 둔 것은 **1,024 개가 전부 껍질에 남는 모양**이라서다 — 이 가이드의
 * 절차에 가장 비용이 큰 입력이고, 그 자리에서 져도 진 대로 적는 것이 이 절의 직무다.
 * 이웃한 두 직선의 교점이 `x = −(2m+1)·s` 라 교점들이 `[-C, C]` 를 채운다.
 */
import type { BenchCase } from "../../../../tools/bench-alt.ts";
import {
  ConvexHullTrick,
  isCovered,
  type Line,
} from "./convexHullTrick-guide.ref.ts";

/** 직선 수. 셋 다 같다. */
const N = 1024;
/** 질의 수. 셋 다 같다. */
const Q = 16_384;

/** 좌표 범위 셋. 2^30 이 문제의 제약(`|x| ≤ 10^9`)에 가장 가깝다. */
const RANGES = [2 ** 30, 2 ** 11, 2 ** 10] as const;

let ops = 0;
const bump = (k: number): void => {
  ops += k;
};

/** 좌표 범위 `C` 에서 쓰는 직선 목록. */
export function linesFor(C: number): [number, number][] {
  const s = C / N;
  const out: [number, number][] = [];
  for (let i = 0; i < N; i++) {
    const m = i - N / 2;
    out.push([m, m * m * s]);
  }
  return out;
}

/** 좌표 범위 `C` 에서 쓰는 질의 목록. */
export function queriesFor(C: number): number[] {
  const out: number[] = [];
  for (let j = 0; j < Q; j++) out.push(-C + Math.floor((2 * C * j) / Q));
  return out;
}

/* ────────────────────────── 이 가이드의 절차 ────────────────────────── */

/** 정본과 같은 자리에 계수만 붙였다. */
class CountedHull {
  readonly hull: Line[] = [];

  addLine(m: number, b: number): void {
    const line: Line = { m, b };
    bump(1);
    const top = this.hull[this.hull.length - 1];
    if (top !== undefined) {
      bump(1);
      if (top.m === m) {
        bump(1);
        if (top.b <= b) return;
        bump(1);
        this.hull.pop();
      }
    }
    for (;;) {
      bump(1);
      if (this.hull.length < 2) break;
      bump(2);
      const l1 = this.hull[this.hull.length - 2] as Line;
      const l2 = this.hull[this.hull.length - 1] as Line;
      bump(7);
      if (!isCovered(l1, l2, line)) break;
      bump(1);
      this.hull.pop();
    }
    bump(1);
    this.hull.push(line);
  }

  query(x: number): number {
    let lo = 0;
    bump(1);
    let hi = this.hull.length - 1;
    for (;;) {
      bump(1);
      if (lo >= hi) break;
      bump(2);
      const mid = Math.floor((lo + hi) / 2);
      bump(3);
      const here = (this.hull[mid] as Line).m * x + (this.hull[mid] as Line).b;
      bump(4);
      const next =
        (this.hull[mid + 1] as Line).m * x + (this.hull[mid + 1] as Line).b;
      bump(1);
      if (here <= next) hi = mid;
      else lo = mid + 1;
    }
    bump(3);
    return (this.hull[lo] as Line).m * x + (this.hull[lo] as Line).b;
  }
}

/* ────────────────────────── 리 차오 트리 ────────────────────────── */

/**
 * 마디 번호는 뿌리 1 · 자식 `2k`·`2k+1` 이다. 좌표 범위가 `2^30` 이면 마디 번호가 `2^32` 까지
 * 가는데, 그 값은 배정밀도 정수로 정확히 표현된다.
 */
class LiChao {
  private readonly node = new Map<number, Line>();

  constructor(
    private readonly lo: number,
    private readonly hi: number,
  ) {}

  get size(): number {
    return this.node.size;
  }

  addLine(m: number, b: number): void {
    this.insert(1, this.lo, this.hi, { m, b });
  }

  private insert(id: number, lo: number, hi: number, line: Line): void {
    let cur = line;
    let nid = id;
    let a = lo;
    let z = hi;
    for (;;) {
      bump(1);
      const held = this.node.get(nid);
      if (held === undefined) {
        bump(1);
        this.node.set(nid, cur);
        return;
      }
      bump(2);
      const mid = Math.floor((a + z) / 2);
      bump(4);
      const leftBetter = cur.m * a + cur.b < held.m * a + held.b;
      bump(1);
      bump(4);
      const midBetter = cur.m * mid + cur.b < held.m * mid + held.b;
      bump(1);
      let loser = cur;
      if (midBetter) {
        bump(1);
        this.node.set(nid, cur);
        loser = held;
      }
      bump(1);
      if (a === z) return;
      bump(1);
      if (leftBetter !== midBetter) {
        bump(1);
        nid = 2 * nid;
        z = mid;
      } else {
        bump(2);
        nid = 2 * nid + 1;
        a = mid + 1;
      }
      cur = loser;
    }
  }

  query(x: number): number {
    let best = Number.POSITIVE_INFINITY;
    let nid = 1;
    let a = this.lo;
    let z = this.hi;
    for (;;) {
      bump(1);
      const held = this.node.get(nid);
      if (held !== undefined) {
        bump(2);
        const v = held.m * x + held.b;
        bump(1);
        if (v < best) best = v;
      }
      bump(1);
      if (a === z) return best;
      bump(2);
      const mid = Math.floor((a + z) / 2);
      bump(1);
      if (x <= mid) {
        bump(1);
        nid = 2 * nid;
        z = mid;
      } else {
        bump(2);
        nid = 2 * nid + 1;
        a = mid + 1;
      }
    }
  }
}

/* ────────────────────────── 계측 ────────────────────────── */

/** 정본의 답. 대조가 답을 바꾸지 않았는지 매 실행마다 확인하는 기준이다. */
function reference(C: number): number[] {
  const ref = new ConvexHullTrick();
  for (const [m, b] of linesFor(C)) ref.addLine(m, b);
  return queriesFor(C).map((x) => ref.query(x));
}

/** 계수를 0 에서 시작해 한 번 재고, 답이 정본과 같은지 함께 확인한다. */
function measure(
  C: number,
  build: (C: number) => {
    addLine(m: number, b: number): void;
    query(x: number): number;
  },
): { ops: number; cells: number } {
  const want = reference(C);
  const it = build(C);
  ops = 0;
  const lines = linesFor(C);
  for (const [m, b] of lines) it.addLine(m, b);
  const xs = queriesFor(C);
  for (const [j, x] of xs.entries()) {
    const got = it.query(x);
    if (got !== want[j]) {
      throw new Error(
        `답이 정본과 다르다 — C=${C} x=${x} ${got} ≠ ${want[j] as number}`,
      );
    }
  }
  const cells =
    it instanceof CountedHull ? it.hull.length : (it as unknown as LiChao).size;
  return { ops, cells };
}

const hullAt = new Map<number, { ops: number; cells: number }>();
const liChaoAt = new Map<number, { ops: number; cells: number }>();
for (const C of RANGES) {
  hullAt.set(
    C,
    measure(C, () => new CountedHull()),
  );
  liChaoAt.set(
    C,
    measure(C, (c) => new LiChao(-c, c)),
  );
}

const at = (
  table: Map<number, { ops: number; cells: number }>,
  C: number,
  key: "ops" | "cells",
): number => (table.get(C) as { ops: number; cells: number })[key];

export const cases: Record<string, BenchCase> = {
  "볼록 껍질 트릭 (이 가이드)": () => ({
    // 셋이 같은 값이다 — 이 절차의 비용은 좌표 범위와 무관하다는 것이 그 사실이다.
    "좌표 범위 2^30 · 기본 연산": at(hullAt, 2 ** 30, "ops"),
    "좌표 범위 2^11 · 기본 연산": at(hullAt, 2 ** 11, "ops"),
    "좌표 범위 2^10 · 기본 연산": at(hullAt, 2 ** 10, "ops"),
    "잡는 칸": at(hullAt, 2 ** 30, "cells"),
  }),
  "리 차오 트리": () => ({
    "좌표 범위 2^30 · 기본 연산": at(liChaoAt, 2 ** 30, "ops"),
    "좌표 범위 2^11 · 기본 연산": at(liChaoAt, 2 ** 11, "ops"),
    "좌표 범위 2^10 · 기본 연산": at(liChaoAt, 2 ** 10, "ops"),
    "좌표 범위 2^30 · 잡는 칸": at(liChaoAt, 2 ** 30, "cells"),
    "좌표 범위 2^10 · 잡는 칸": at(liChaoAt, 2 ** 10, "cells"),
  }),
};

/** `deep.math`·`purpose.alt` 가 인용하는 뒤집힘 경계. 지수 하나씩 재서 처음 뒤집히는 자리. */
export function flipExponent(): {
  exp: number;
  hull: number;
  liChao: number;
  prevExp: number;
  prevHull: number;
  prevLiChao: number;
} {
  let prev: { exp: number; hull: number; liChao: number } | null = null;
  for (let e = 10; e <= 30; e++) {
    const C = 2 ** e;
    const h = measure(C, () => new CountedHull()).ops;
    const l = measure(C, (c) => new LiChao(-c, c)).ops;
    if (h < l && prev !== null) {
      return {
        exp: e,
        hull: h,
        liChao: l,
        prevExp: prev.exp,
        prevHull: prev.hull,
        prevLiChao: prev.liChao,
      };
    }
    prev = { exp: e, hull: h, liChao: l };
  }
  throw new Error("뒤집히는 자리를 못 찾았다");
}
