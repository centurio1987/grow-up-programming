/**
 * `purpose.alt`(경쟁 설계와의 대조) 의 수치를 내는 하네스 — L13.
 *
 *   bun run ../../../../tools/bench-alt.ts polygonArea-guide.alt.ts
 *
 * **경쟁 설계는 「블록 누적」이다.** 같은 목표(단순 다각형의 넓이를 정확히 내는 것)를 노리되,
 * 항마다 큰 정수로 가지 않는다. 곱 두 개가 배정밀도의 정수 범위 안이면 그 항을 배정밀도로
 * 만들고, 블록 합의 절댓값이 그 범위를 넘기 직전에만 큰 정수 누산기로 옮긴다. 넘는 항은 그
 * 자리에서 큰 정수로 되잰다.
 *
 * 두 설계는 **어떤 입력에서도 같은 답**을 낸다. 블록 누적은 배정밀도가 어긋남 없이 담는 구간
 * 안에서만 배정밀도를 쓰고, 그 밖은 큰 정수로 되재기 때문이다. 갈리는 것은 **큰 정수 연산을 몇
 * 번 하는가**와 그것을 위해 붙는 검사다.
 *
 * **계수 셋을 센다.**
 *
 *   기본 연산    좌표 읽기 + 곱 + 덧셈·뺄셈 + 비교 + 자료형 변환을 각각 1 로 센 것
 *   큰 정수 연산 그중 큰 정수 자료형이 하는 것만 (변환 · 곱 · 덧셈 · 뺄셈 · 비교)
 *   잡는 칸      절차가 입력 밖에 새로 잡는 칸의 수
 *
 * 「기본 연산」의 정의는 `perf`(비용 계산) 절이 쓰는 것과 같다 — 한 낱말이 두 절에서 다른 것을
 * 세면 표를 나란히 놓을 수 없다. **벽시계는 재지 않는다** — 실행마다 값이 달라 「일치」를
 * 정의할 수 없다(L13).
 *
 * **입력을 결과에 맞춰 고르지 않는다**(L20). 다각형 가족 하나(원 위 `RING` 점을 반올림해 이은
 * 것)를 고정하고 **반지름**과 **원점에서의 거리** 둘만 바꾼다. 전개 입력(L 자 여섯 변)은
 * 계수가 두 자리라 순서가 뒤집히는 자리가 안 나오므로, 값을 표의 첫 줄로 함께 싣는다.
 */
import { type Point, polygonArea } from "./polygonArea-guide.ref.ts";

/**
 * 곱 하나를 배정밀도에 어긋남 없이 담는 한계.
 *
 * 정수는 `2^53` 까지 어긋남 없이 담기고, 두 곱의 차는 그 둘의 합만큼 커질 수 있다. 곱 하나를
 * `2^52` 로 막아 두면 차가 `2^53` 을 안 넘어 그 뺄셈도 정확하다.
 */
const PRODUCT_LIMIT = 2 ** 52;

/** 블록 합의 절댓값 한계. 여기를 넘기 전에 큰 정수 누산기로 옮긴다. */
const BLOCK_LIMIT = 2 ** 53;

/** 다각형 가족의 꼭짓점 수. 두 축에서 같은 값을 쓴다. */
const RING = 1_024;

/** 크기 축에서 쓰는 반지름. */
const R_SMALL = 2 ** 20;
const R_BIG = 1_000_000_000;

/** 거리 축에서 쓰는 반지름 — 다각형 자체는 작게 두고 원점에서 멀리 옮긴다. */
const NEAR_R = 1_024;
const D_FAR = 500_000_000;

/** 두 축에서 큰 정수 연산의 순서가 뒤집히는 자리. `flipRadius()`·`flipShift()` 가 그 자리인지 본다. */
const FLIP_R = 856_724_713;
const FLIP_D = 67_109_587;

/** `deep.walk` 가 쓰는 전개 입력 — L 자 다각형. */
const WALK_POLYGON: Point[] = [
  [0, 0],
  [4, 0],
  [4, 2],
  [2, 2],
  [2, 4],
  [0, 4],
];

interface Counted {
  /** 좌표 읽기 + 곱 + 덧셈·뺄셈 + 비교 + 자료형 변환. */
  ops: number;
  /** 그중 큰 정수 자료형이 하는 것. */
  big: number;
  /** 절차가 입력 밖에 새로 잡는 칸. */
  cells: number;
}

/** 이 가이드가 가르치는 설계 — 항마다 큰 정수로 더한다. */
function byInteger(polygon: Point[], c: Counted): number {
  c.cells += 1;
  let twice = 0n;
  for (let at = 0; at < polygon.length; at++) {
    const a = polygon[at] as Point;
    const b = polygon[(at + 1) % polygon.length] as Point;
    c.ops += 4;
    c.ops += 4;
    c.big += 4;
    c.ops += 4;
    c.big += 4;
    twice += BigInt(a[0]) * BigInt(b[1]) - BigInt(b[0]) * BigInt(a[1]);
  }
  c.ops += 3;
  c.big += 2;
  const size = twice < 0n ? -twice : twice;
  return Number(size) / 2;
}

/**
 * 경쟁 설계 — 배정밀도가 어긋남 없이 담는 구간 안에서는 배정밀도로 더하고, 그 밖에서만 큰
 * 정수로 간다.
 *
 * 블록 합의 절댓값 상한을 항의 절댓값으로 누적해 두고, 다음 항을 더하면 한계를 넘는 자리에서
 * 큰 정수 누산기로 옮긴다. 그래서 배정밀도 쪽에서 반올림이 붙는 자리가 하나도 없다.
 */
function byBlock(polygon: Point[], c: Counted): number {
  c.cells += 3;
  let total = 0n;
  let block = 0;
  let bound = 0;
  const flush = (): void => {
    c.ops += 3;
    c.big += 2;
    total += BigInt(block);
    block = 0;
    bound = 0;
  };
  for (let at = 0; at < polygon.length; at++) {
    const a = polygon[at] as Point;
    const b = polygon[(at + 1) % polygon.length] as Point;
    c.ops += 4;
    const left = a[0] * b[1];
    const right = b[0] * a[1];
    c.ops += 2;
    c.ops += 2;
    if (Math.abs(left) > PRODUCT_LIMIT || Math.abs(right) > PRODUCT_LIMIT) {
      c.ops += 1;
      if (block !== 0) flush();
      c.ops += 4;
      c.big += 4;
      c.ops += 4;
      c.big += 4;
      total += BigInt(a[0]) * BigInt(b[1]) - BigInt(b[0]) * BigInt(a[1]);
      continue;
    }
    const term = left - right;
    c.ops += 2;
    if (bound + Math.abs(term) > BLOCK_LIMIT) flush();
    c.ops += 3;
    block += term;
    bound += Math.abs(term);
  }
  c.ops += 1;
  if (block !== 0) flush();
  c.ops += 3;
  c.big += 2;
  const size = total < 0n ? -total : total;
  return Number(size) / 2;
}

/** 반지름 `r` 의 원 위 `n` 점을 반올림해 잇고 `(dx, dy)` 만큼 옮긴 다각형. */
function ring(n: number, r: number, dx: number, dy: number): Point[] {
  const out: Point[] = [];
  for (let at = 0; at < n; at++) {
    const t = (2 * Math.PI * at) / n;
    out.push([
      Math.round(r * Math.cos(t)) + dx,
      Math.round(r * Math.sin(t)) + dy,
    ]);
  }
  return out;
}

/**
 * 두 설계가 **정본과 같은 답**을 내는지 매번 확인한다. 답이 다른 구현으로 잰 계수는 저울질이
 * 아니라 다른 문제의 값이고, 그것으로 낸 판정은 근거가 없다.
 */
function measure(polygon: Point[]): { mine: Counted; theirs: Counted } {
  const mine: Counted = { ops: 0, big: 0, cells: 0 };
  const theirs: Counted = { ops: 0, big: 0, cells: 0 };
  const want = polygonArea(polygon);
  if (byInteger(polygon, mine) !== want) {
    throw new Error("정수 누적이 정본과 다른 답을 냈다");
  }
  if (byBlock(polygon, theirs) !== want) {
    throw new Error("블록 누적이 정본과 다른 답을 냈다");
  }
  return { mine, theirs };
}

/** 큰 정수 연산의 순서가 처음 뒤집히는 반지름. 이분으로 좁힌다. */
function flipRadius(): number {
  const blockWins = (r: number): boolean => {
    const { mine, theirs } = measure(ring(RING, r, 0, 0));
    return theirs.big < mine.big;
  };
  let low = 1_024;
  let high = R_BIG;
  if (!blockWins(low) || blockWins(high)) {
    throw new Error("크기 축의 양 끝이 이미 같은 쪽이다");
  }
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    if (blockWins(mid)) low = mid;
    else high = mid;
  }
  return high;
}

/** 큰 정수 연산의 순서가 처음 뒤집히는 원점에서의 거리. */
function flipShift(): number {
  const blockWins = (d: number): boolean => {
    const { mine, theirs } = measure(ring(RING, NEAR_R, d, d));
    return theirs.big < mine.big;
  };
  let low = 0;
  let high = D_FAR;
  if (!blockWins(low) || blockWins(high)) {
    throw new Error("거리 축의 양 끝이 이미 같은 쪽이다");
  }
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    if (blockWins(mid)) low = mid;
    else high = mid;
  }
  return high;
}

if (flipRadius() !== FLIP_R) {
  throw new Error(
    `큰 정수 연산이 뒤집히는 반지름이 ${flipRadius()} 이다 — 상수와 어긋난다`,
  );
}
if (flipShift() !== FLIP_D) {
  throw new Error(
    `큰 정수 연산이 뒤집히는 거리가 ${flipShift()} 이다 — 상수와 어긋난다`,
  );
}

const WALK = measure(WALK_POLYGON);
const SMALL = measure(ring(RING, R_SMALL, 0, 0));
const EDGE_IN = measure(ring(RING, FLIP_R - 1, 0, 0));
const EDGE_OUT = measure(ring(RING, FLIP_R, 0, 0));
const HUGE = measure(ring(RING, R_BIG, 0, 0));
const NEAR = measure(ring(RING, NEAR_R, 0, 0));
const SHIFT_IN = measure(ring(RING, NEAR_R, FLIP_D - 1, FLIP_D - 1));
const SHIFT_OUT = measure(ring(RING, NEAR_R, FLIP_D, FLIP_D));
const FAR = measure(ring(RING, NEAR_R, D_FAR, D_FAR));

export const cases = {
  "정수 누적": () => ({
    "전개 입력 기본 연산": WALK.mine.ops,
    "전개 입력 큰 정수 연산": WALK.mine.big,
    "반지름 2^20 큰 정수 연산": SMALL.mine.big,
    "반지름 856724712 큰 정수 연산": EDGE_IN.mine.big,
    "반지름 856724713 큰 정수 연산": EDGE_OUT.mine.big,
    "반지름 10^9 큰 정수 연산": HUGE.mine.big,
    "반지름 10^9 기본 연산": HUGE.mine.ops,
    "원점 위 작은 원 큰 정수 연산": NEAR.mine.big,
    "거리 67109586 큰 정수 연산": SHIFT_IN.mine.big,
    "거리 67109587 큰 정수 연산": SHIFT_OUT.mine.big,
    "거리 5×10^8 큰 정수 연산": FAR.mine.big,
    "잡는 칸": HUGE.mine.cells,
  }),
  "블록 누적": () => ({
    "전개 입력 기본 연산": WALK.theirs.ops,
    "전개 입력 큰 정수 연산": WALK.theirs.big,
    "반지름 2^20 큰 정수 연산": SMALL.theirs.big,
    "반지름 856724712 큰 정수 연산": EDGE_IN.theirs.big,
    "반지름 856724713 큰 정수 연산": EDGE_OUT.theirs.big,
    "반지름 10^9 큰 정수 연산": HUGE.theirs.big,
    "반지름 10^9 기본 연산": HUGE.theirs.ops,
    "원점 위 작은 원 큰 정수 연산": NEAR.theirs.big,
    "거리 67109586 큰 정수 연산": SHIFT_IN.theirs.big,
    "거리 67109587 큰 정수 연산": SHIFT_OUT.theirs.big,
    "거리 5×10^8 큰 정수 연산": FAR.theirs.big,
    "잡는 칸": HUGE.theirs.cells,
  }),
};
