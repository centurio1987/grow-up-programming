/**
 * `purpose.alt`(경쟁 설계와의 대조) 의 수치를 내는 하네스 — L13.
 *
 *   bun run ../../../../tools/bench-alt.ts pointInPolygon-guide.alt.ts
 *
 * **경쟁 설계는 「높이 버킷」이다.** 같은 목표(점이 다각형의 내부이거나 경계 위인지를 정확히
 * 답하는 것)를 노리되, 질의마다 변을 전부 훑지 않고 **다각형을 한 번 읽어 변을 높이 구간별로
 * 나누어 적어 둔 다음** 질의 점의 높이가 걸리는 구간의 변만 본다. 스캔라인 채우기가 쓰는 변 표와
 * 같은 자료이고, 구간 수는 `⌈√n⌉` 로 둔다.
 *
 * 두 설계는 **어떤 입력에서도 같은 답**을 낸다. 반직선이 실제로 만나는 변은 높이 구간이 질의
 * 점의 높이를 담는 변뿐이고, 그런 변은 그 점이 걸리는 구간에 반드시 들어 있기 때문이다. 갈리는
 * 것은 **어느 변을 보는가**와 그것을 위해 미리 잡는 칸이다.
 *
 * **계수 둘을 센다.**
 *
 *   기본 연산  좌표 읽기 + 배정밀도 곱 + 큰 정수 변환 + 큰 정수 곱 + 좌표 비교 + 변 번호 읽기
 *   잡는 칸    절차가 입력 밖에 새로 잡는 칸의 수
 *
 * 「기본 연산」의 정의는 `perf`(비용 계산) 절이 쓰는 것과 같다 — 한 낱말이 두 절에서 다른 것을
 * 세면 표를 나란히 놓을 수 없다. 변 하나를 보는 값은 두 설계가 같은 규칙으로 세고(`edgeStep`
 * 하나를 함께 쓴다), 갈리는 것은 그 함수를 몇 번 부르는가와 전처리에 드는 값이다.
 * **벽시계는 재지 않는다** — 실행마다 값이 달라 「일치」를 정의할 수 없다(L13).
 *
 * **입력을 결과에 맞춰 고르지 않는다**(L20). 다각형 가족 둘과 질의 점 생성식 하나를 고정하고
 * **질의 수**와 **이빨 높이** 둘만 바꾼다.
 *
 *   톱니   이빨 `m` 개가 오른쪽으로 한 칸씩 올라가며 높이 `h` 를 걸친다. `h` 가 이 편의 축이다
 *   원형   반지름 `R` 의 원 위 `n` 점을 반올림해 잇는다. 변 하나가 걸치는 높이가 아주 작다
 *   질의   씨앗 하나로 만든 좌표 쌍. **다각형 모양과 무관하게 같은 점**을 쓴다
 *
 * 전개 입력(L자 여섯 변 · 질의 셋)은 계수가 세 자리라 순서가 뒤집히는 자리가 안 나온다. 그래서
 * 규모를 키운 두 가족을 함께 재고, 전개 입력의 값도 표의 첫 줄로 싣는다.
 */
import { type Point, pointInPolygon } from "./pointInPolygon-guide.ref.ts";

/** 정본과 같은 값. 여기서 다시 정하는 것이 아니라 같은 하한을 쓴다는 뜻이다. */
const SAFE = 2048;

/** 질의 점 생성 씨앗. 값을 바꾸면 입력이 바뀌므로 상수로 고정한다. */
const SEED = 20_260_904;

/** 톱니 다각형의 이빨 수. 꼭짓점은 `2m + 3` 개다. */
const TEETH = 2_048;

/** 원형 다각형의 꼭짓점 수와 반지름. */
const RING = 4_096;
const RADIUS = 1_000_000;

/** 질의 수 축에서 쓰는 이빨 높이. */
const SPAN = 512;

/** 이빨 높이 축에서 쓰는 질의 수. */
const QUERIES = 8;

/** 두 축에서 순서가 뒤집히는 자리. `flipQuery()`·`flipSpan()` 이 실제로 그 자리인지 본다. */
const FLIP_Q = 4;
const FLIP_H = 1_303;

/** `deep.walk` 가 쓰는 전개 입력 — L 자 다각형과 질의 점 셋. */
const WALK_POLYGON: Point[] = [
  [0, 0],
  [4, 0],
  [4, 2],
  [2, 2],
  [2, 4],
  [0, 4],
];
const WALK_QUERIES: Point[] = [
  [1, 1],
  [3, 3],
  [2, 3],
];

interface Counted {
  /** 좌표 읽기 + 배정밀도 곱 + 큰 정수 변환 + 큰 정수 곱 + 좌표 비교 + 변 번호 읽기. */
  ops: number;
  /** 절차가 입력 밖에 새로 잡는 칸. */
  cells: number;
}

/** 이 가이드가 가르치는 방향 판정에 계수만 덧붙인 것. */
function judge(o: Point, a: Point, b: Point, c: Counted): number {
  const ux = a[0] - o[0];
  const uy = a[1] - o[1];
  const vx = b[0] - o[0];
  const vy = b[1] - o[1];
  c.ops += 2;
  const approx = ux * vy - uy * vx;
  if (approx > SAFE || approx < -SAFE) return approx > 0 ? 1 : -1;
  c.ops += 6;
  const exact = BigInt(ux) * BigInt(vy) - BigInt(uy) * BigInt(vx);
  return exact > 0n ? 1 : exact < 0n ? -1 : 0;
}

const inBox = (a: Point, b: Point, p: Point): boolean =>
  Math.min(a[0], b[0]) <= p[0] &&
  p[0] <= Math.max(a[0], b[0]) &&
  Math.min(a[1], b[1]) <= p[1] &&
  p[1] <= Math.max(a[1], b[1]);

/**
 * 변 하나를 보는 몸통. **두 설계가 이 함수를 함께 쓴다** — 변 하나의 값이 설계마다 다르면
 * 표의 두 열이 같은 것을 세지 않게 된다.
 *
 * 답이 그 자리에서 정해지면 `true` 를 돌려주고, 아니면 `null` 을 돌려주며 `state.inside` 를
 * 필요할 때 뒤집는다.
 */
function edgeStep(
  a: Point,
  b: Point,
  p: Point,
  state: { inside: boolean },
  c: Counted,
): boolean | null {
  c.ops += 4;
  const d = judge(a, b, p, c);
  if (d === 0) {
    c.ops += 4;
    if (inBox(a, b, p)) return true;
  }
  c.ops += 2;
  const aboveA = a[1] > p[1];
  const aboveB = b[1] > p[1];
  if (aboveA === aboveB) return null;
  c.ops += 1;
  const onLeft = d > 0;
  const goesUp = b[1] > a[1];
  if (onLeft === goesUp) state.inside = !state.inside;
  return null;
}

/** 이 가이드가 가르치는 설계 — 질의마다 변을 전부 본다. */
function byRay(p: Point, polygon: Point[], c: Counted): boolean {
  const state = { inside: false };
  for (
    let at = 0, prev = polygon.length - 1;
    at < polygon.length;
    prev = at++
  ) {
    const done = edgeStep(
      polygon[prev] as Point,
      polygon[at] as Point,
      p,
      state,
      c,
    );
    if (done !== null) return done;
  }
  return state.inside;
}

interface Buckets {
  ymin: number;
  ymax: number;
  size: number;
  slots: number[][];
}

/** 경쟁 설계의 전처리 — 변을 높이 구간별로 나누어 적어 둔다. */
function buildBuckets(polygon: Point[], c: Counted): Buckets {
  let ymin = Number.POSITIVE_INFINITY;
  let ymax = Number.NEGATIVE_INFINITY;
  for (const v of polygon) {
    c.ops += 1;
    if (v[1] < ymin) ymin = v[1];
    if (v[1] > ymax) ymax = v[1];
  }
  const size = Math.ceil(Math.sqrt(polygon.length));
  const height = Math.max(1, ymax - ymin);
  const slots: number[][] = Array.from({ length: size }, () => []);
  c.cells += size;
  const slotOf = (y: number): number =>
    Math.min(size - 1, Math.max(0, Math.floor(((y - ymin) * size) / height)));
  for (
    let at = 0, prev = polygon.length - 1;
    at < polygon.length;
    prev = at++
  ) {
    const a = polygon[prev] as Point;
    const b = polygon[at] as Point;
    c.ops += 4;
    const first = slotOf(Math.min(a[1], b[1]));
    const last = slotOf(Math.max(a[1], b[1]));
    for (let k = first; k <= last; k++) {
      c.ops += 1;
      c.cells += 1;
      (slots[k] as number[]).push(prev);
    }
  }
  return { ymin, ymax, size, slots };
}

/** 경쟁 설계의 조회 — 질의 점의 높이가 걸리는 구간의 변만 본다. */
function byBuckets(
  p: Point,
  polygon: Point[],
  table: Buckets,
  c: Counted,
): boolean {
  c.ops += 2;
  if (p[1] < table.ymin || p[1] > table.ymax) return false;
  const height = Math.max(1, table.ymax - table.ymin);
  const k = Math.min(
    table.size - 1,
    Math.max(0, Math.floor(((p[1] - table.ymin) * table.size) / height)),
  );
  const state = { inside: false };
  for (const at of table.slots[k] as number[]) {
    c.ops += 1;
    const done = edgeStep(
      polygon[at] as Point,
      polygon[(at + 1) % polygon.length] as Point,
      p,
      state,
      c,
    );
    if (done !== null) return done;
  }
  return state.inside;
}

/**
 * 이빨 `m` 개가 오른쪽으로 한 칸씩 올라가며 높이 `span` 을 걸치는 톱니 다각형.
 *
 * `span` 이 작으면 변 하나가 낮은 구간 하나에만 들어가고, `span` 이 크면 여러 구간에 겹쳐
 * 들어간다 — 그것이 이 편의 대조 축이다. 아래를 `y = -1` 로 막아 단순 다각형으로 닫는다.
 */
function comb(m: number, span: number): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < m; i++) {
    out.push([2 * i, i]);
    out.push([2 * i + 1, i + span]);
  }
  out.push([2 * m, m]);
  out.push([2 * m, -1]);
  out.push([0, -1]);
  return out;
}

/** 반지름 `r` 의 원 위 `n` 점을 반올림해 이은 다각형. 변 하나가 걸치는 높이가 아주 작다. */
function ring(n: number, r: number): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < n; i++) {
    const t = (2 * Math.PI * i) / n;
    out.push([Math.round(r * Math.cos(t)), Math.round(r * Math.sin(t))]);
  }
  return out;
}

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

/** 질의 점 `total` 개. **다각형 모양과 무관하게 같은 점**이라 축 하나만 움직인다. */
function queries(total: number): Point[] {
  const rnd = makeRnd(SEED);
  const out: Point[] = [];
  for (let at = 0; at < total; at++) {
    out.push([rnd() % (2 * TEETH + 1), rnd() % (TEETH + 1)]);
  }
  return out;
}

/**
 * 두 설계가 **정본과 같은 답**을 내는지 질의마다 확인한다. 답이 다른 구현으로 잰 계수는
 * 저울질이 아니라 다른 문제의 값이고, 그것으로 낸 판정은 근거가 없다.
 */
function measure(
  polygon: Point[],
  points: Point[],
): { mine: Counted; theirs: Counted } {
  const mine: Counted = { ops: 0, cells: 1 };
  const theirs: Counted = { ops: 0, cells: 0 };
  const table = buildBuckets(polygon, theirs);
  for (const p of points) {
    const want = pointInPolygon(p, polygon);
    if (byRay(p, polygon, mine) !== want) {
      throw new Error(`반직선 세기가 정본과 다른 답을 냈다 — ${p.join(",")}`);
    }
    if (byBuckets(p, polygon, table, theirs) !== want) {
      throw new Error(`높이 버킷이 정본과 다른 답을 냈다 — ${p.join(",")}`);
    }
  }
  return { mine, theirs };
}

/** 기본 연산의 순서가 처음 뒤집히는 질의 수. */
function flipQuery(): number {
  const polygon = comb(TEETH, SPAN);
  for (let q = 1; q <= 64; q++) {
    const { mine, theirs } = measure(polygon, queries(q));
    if (theirs.ops < mine.ops) return q;
  }
  throw new Error("재 본 구간 안에서 기본 연산이 뒤집히지 않았다");
}

/** 기본 연산의 순서가 **되돌아** 뒤집히는 이빨 높이. 이분으로 좁힌다. */
function flipSpan(): number {
  const points = queries(QUERIES);
  const bucketsWin = (span: number): boolean => {
    const { mine, theirs } = measure(comb(TEETH, span), points);
    return theirs.ops < mine.ops;
  };
  let low = 1;
  let high = TEETH;
  if (!bucketsWin(low) || bucketsWin(high)) {
    throw new Error("이빨 높이 축의 양 끝이 이미 같은 쪽이다");
  }
  while (high - low > 1) {
    const mid = (low + high) >> 1;
    if (bucketsWin(mid)) low = mid;
    else high = mid;
  }
  return high;
}

if (flipQuery() !== FLIP_Q) {
  throw new Error(
    `기본 연산이 뒤집히는 질의 수가 ${flipQuery()} 이다 — 상수와 어긋난다`,
  );
}
if (flipSpan() !== FLIP_H) {
  throw new Error(
    `기본 연산이 되돌아 뒤집히는 이빨 높이가 ${flipSpan()} 이다 — 상수와 어긋난다`,
  );
}

const WALK = measure(WALK_POLYGON, WALK_QUERIES);
const Q0 = measure(comb(TEETH, SPAN), queries(0));
const Q3 = measure(comb(TEETH, SPAN), queries(FLIP_Q - 1));
const Q4 = measure(comb(TEETH, SPAN), queries(FLIP_Q));
const Q16 = measure(comb(TEETH, SPAN), queries(16));
const H_LOW = measure(comb(TEETH, FLIP_H - 1), queries(QUERIES));
const H_HIGH = measure(comb(TEETH, FLIP_H), queries(QUERIES));
const RING1 = measure(ring(RING, RADIUS), queries(1));
const RING16 = measure(ring(RING, RADIUS), queries(16));

export const cases = {
  "반직선 세기": () => ({
    "전개 입력 기본 연산": WALK.mine.ops,
    "톱니 질의 0 회 기본 연산": Q0.mine.ops,
    "톱니 질의 3 회 기본 연산": Q3.mine.ops,
    "톱니 질의 4 회 기본 연산": Q4.mine.ops,
    "톱니 질의 16 회 기본 연산": Q16.mine.ops,
    "이빨 1302 기본 연산": H_LOW.mine.ops,
    "이빨 1303 기본 연산": H_HIGH.mine.ops,
    "원형 질의 1 회 기본 연산": RING1.mine.ops,
    "원형 질의 16 회 기본 연산": RING16.mine.ops,
    "톱니 잡는 칸": Q16.mine.cells,
  }),
  "높이 버킷": () => ({
    "전개 입력 기본 연산": WALK.theirs.ops,
    "톱니 질의 0 회 기본 연산": Q0.theirs.ops,
    "톱니 질의 3 회 기본 연산": Q3.theirs.ops,
    "톱니 질의 4 회 기본 연산": Q4.theirs.ops,
    "톱니 질의 16 회 기본 연산": Q16.theirs.ops,
    "이빨 1302 기본 연산": H_LOW.theirs.ops,
    "이빨 1303 기본 연산": H_HIGH.theirs.ops,
    "원형 질의 1 회 기본 연산": RING1.theirs.ops,
    "원형 질의 16 회 기본 연산": RING16.theirs.ops,
    "톱니 잡는 칸": Q16.theirs.cells,
  }),
};
