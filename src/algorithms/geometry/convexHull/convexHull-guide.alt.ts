/**
 * `purpose.alt`(경쟁 설계와의 대조) 의 수치를 내는 하네스 — L13.
 *
 *   bun run ../../../../tools/bench-alt.ts convexHull-guide.alt.ts
 *
 * **경쟁 설계는 선물 포장(gift wrapping · Jarvis march)이다.** 같은 목표(점 집합의 볼록
 * 껍질 꼭짓점을 반시계 방향으로 전부 내는 것)를 노리되 정렬을 하지 않는다. 가장 왼쪽 점에서
 * 시작해 「나머지 점이 전부 왼쪽에 오는 다음 점」을 매번 전수 검사로 골라, 껍질을 한 꼭짓점씩
 * 이어 간다. 꼭짓점 수를 `h` 라 하면 방향 판정이 `h` 바퀴 든다.
 *
 * **입력을 결과에 맞춰 고르지 않는다**(L20). 생성식 하나를 정하고 `h` 만 바꾼다.
 *
 *   껍질 꼭짓점  (t, SPREAD·t²)            t = 0 … h−1   — 포물선 위라 전부 볼록 위치다
 *   안쪽 점      (t, SPREAD·t² + k)        t = 1 … h−2   — 포물선 위, 첫 점과 끝 점을 이은 현 아래
 *
 * 그렇게 만든 점 `n` 개를 고정 씨앗 `SHUFFLE_SEED` 의 선형 합동 난수로 섞는다. 껍질은 언제나
 * 포물선 위의 `h` 개이고, 그 사실을 `measure()` 가 매번 확인한다.
 *
 * **전개 입력(점 여덟 개)도 같은 표에 넣는다.** 다만 그 크기에서는 두 설계의 계수가 한 자리
 * 수준이라 갈리는 자리가 안 나오므로, 규모만 키운 `n` 을 따로 재서 뒤집히는 자리를 찾는다.
 */
import { convexHull, type Point, sideOf } from "./convexHull-guide.ref.ts";

/** 포물선의 세로 배율. 이 값이 안쪽 점을 담을 자리를 만든다. */
const SPREAD = 8192;

/** 섞기 씨앗. 값을 바꾸면 입력이 바뀌므로 상수로 고정한다. */
const SHUFFLE_SEED = 20_260_904;

/** 규모 대조에 쓰는 점 개수. */
const MID = 4_096;
const BIG = 100_000;

/** 기본 연산이 뒤집히는 자리. 아래 `flipPoint()` 가 차례로 재서 확인한다. */
const TIE = 13;
const FLIP = 14;

/** `SPREAD` 에서 좌표 상한 10^9 을 넘지 않는 가장 큰 껍질 크기. */
const WIDEST = 350;

/** `deep.build`·`deep.walk` 가 쓰는 전개 입력. */
const WALK: Point[] = [
  [3, 2],
  [6, 0],
  [0, 0],
  [3, 4],
  [6, 3],
  [0, 3],
  [3, 0],
  [6, 0],
];

interface Counted {
  hull: Point[];
  /** 기본 연산 — 좌표 비교 + 방향 판정. 두 설계가 같은 두 가지를 센다. */
  ops: number;
  /** 답 배열을 뺀, 추가로 잡는 칸. */
  cells: number;
}

/** 생성식이 만드는 점 `n` 개. 껍질은 포물선 위의 `h` 개다. */
function makePoints(total: number, hullSize: number): Point[] {
  const points: Point[] = [];
  for (let t = 0; t < hullSize; t++) points.push([t, SPREAD * t * t]);
  for (let k = 1; points.length < total; k++) {
    let added = false;
    for (let t = 1; t <= hullSize - 2 && points.length < total; t++) {
      const y = SPREAD * t * t + k;
      // 첫 점과 끝 점을 이은 현보다 아래여야 안쪽이다.
      if (y >= SPREAD * t * (hullSize - 1)) continue;
      points.push([t, y]);
      added = true;
    }
    if (!added)
      throw new Error(`안쪽 자리가 모자란다 — n=${total} h=${hullSize}`);
  }
  let seed = SHUFFLE_SEED;
  const rnd = (): number => {
    seed = (seed * 1_103_515_245 + 12_345) & 0x7fff_ffff;
    return seed;
  };
  for (let at = points.length - 1; at > 0; at--) {
    const to = rnd() % (at + 1);
    const keep = points[at] as Point;
    points[at] = points[to] as Point;
    points[to] = keep;
  }
  return points;
}

/** 비교 횟수를 세는 합치기 정렬. 엔진의 정렬에 기대면 계수가 구현에 따라 갈린다. */
function sortCounted(items: Point[], seen: { count: number }): Point[] {
  if (items.length <= 1) return items;
  const mid = items.length >> 1;
  const left = sortCounted(items.slice(0, mid), seen);
  const right = sortCounted(items.slice(mid), seen);
  const out: Point[] = [];
  let at = 0;
  let to = 0;
  while (at < left.length && to < right.length) {
    seen.count++;
    const a = left[at] as Point;
    const b = right[to] as Point;
    if (a[0] < b[0] || (a[0] === b[0] && a[1] <= b[1])) {
      out.push(a);
      at++;
    } else {
      out.push(b);
      to++;
    }
  }
  while (at < left.length) out.push(left[at++] as Point);
  while (to < right.length) out.push(right[to++] as Point);
  return out;
}

/** 이 가이드가 가르치는 절차에 계수만 덧붙인 것. */
function byTwoChains(points: Point[]): Counted {
  const seen = { count: 0 };
  const sorted = sortCounted([...points], seen);
  let ops = seen.count;

  const uniq: Point[] = [];
  for (const p of sorted) {
    ops++;
    const last = uniq.at(-1);
    if (last === undefined || last[0] !== p[0] || last[1] !== p[1])
      uniq.push(p);
  }
  if (uniq.length <= 2) {
    return { hull: uniq, ops, cells: points.length + uniq.length };
  }

  const chain = (seq: Point[]): Point[] => {
    const built: Point[] = [];
    for (const p of seq) {
      while (built.length >= 2) {
        ops++;
        const o = built.at(-2) as Point;
        const a = built.at(-1) as Point;
        if (sideOf(o, a, p) > 0) break;
        built.pop();
      }
      built.push(p);
    }
    return built;
  };
  const lower = chain(uniq);
  const upper = chain([...uniq].reverse());
  lower.pop();
  upper.pop();
  return {
    hull: lower.concat(upper),
    // 정렬 사본 + 중복을 지운 목록 + 뒤집은 사본 + 사슬 둘.
    cells:
      points.length + uniq.length + uniq.length + lower.length + upper.length,
    ops,
  };
}

/** 경쟁 설계 — 선물 포장. 정렬 없이 꼭짓점을 한 개씩 이어 간다. */
function byGiftWrapping(points: Point[]): Counted {
  let ops = 0;
  const seen = new Set<string>();
  const uniq: Point[] = [];
  for (const p of points) {
    ops++;
    const key = `${p[0]},${p[1]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniq.push(p);
  }
  const total = uniq.length;
  if (total <= 2) return { hull: uniq, ops, cells: total + uniq.length };

  let start = 0;
  for (let at = 1; at < total; at++) {
    ops++;
    const cand = uniq[at] as Point;
    const best = uniq[start] as Point;
    if (cand[0] < best[0] || (cand[0] === best[0] && cand[1] < best[1])) {
      start = at;
    }
  }

  const squared = (a: Point, b: Point): number =>
    (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

  const hull: Point[] = [];
  let cur = start;
  do {
    hull.push(uniq[cur] as Point);
    let next = (cur + 1) % total;
    for (let at = 0; at < total; at++) {
      if (at === cur || at === next) continue;
      ops++;
      const side = sideOf(
        uniq[cur] as Point,
        uniq[next] as Point,
        uniq[at] as Point,
      );
      if (side < 0) {
        next = at;
        continue;
      }
      if (side !== 0) continue;
      // 한 직선 위면 더 먼 점이 다음 꼭짓점이다. 공선 중간 점은 답에서 빠진다.
      ops++;
      const here = uniq[cur] as Point;
      if (
        squared(here, uniq[at] as Point) > squared(here, uniq[next] as Point)
      ) {
        next = at;
      }
    }
    cur = next;
  } while (cur !== start);

  return { hull, ops, cells: total + uniq.length + hull.length };
}

/** 꼭짓점 집합을 순환 순서와 상관없이 견주기 위한 키. */
function ring(hull: Point[]): string {
  if (hull.length === 0) return "";
  let head = 0;
  for (let at = 1; at < hull.length; at++) {
    const a = hull[at] as Point;
    const b = hull[head] as Point;
    if (a[0] < b[0] || (a[0] === b[0] && a[1] < b[1])) head = at;
  }
  return [...hull.slice(head), ...hull.slice(0, head)]
    .map((p) => `${p[0]},${p[1]}`)
    .join(" ");
}

/**
 * 두 설계가 **정본과 같은 답**을 내는지 매번 확인한다. 답이 다른 구현으로 잰 계수는
 * 저울질이 아니라 다른 문제의 값이고, 그것으로 낸 판정은 근거가 없다.
 */
function measure(points: Point[]): { mine: Counted; theirs: Counted } {
  const mine = byTwoChains(points);
  const theirs = byGiftWrapping(points);
  const want = ring(convexHull(points));
  if (ring(mine.hull) !== want || ring(theirs.hull) !== want) {
    throw new Error(`두 설계와 정본의 답이 다르다 — 점 ${points.length} 개`);
  }
  return { mine, theirs };
}

/** 기본 연산의 순서가 처음 뒤집히는 껍질 크기. 상수 `FLIP` 이 실제로 그 자리인지 본다. */
function flipPoint(): number {
  for (let h = 3; h <= 200; h++) {
    const points = makePoints(MID, h);
    if (byTwoChains(points).ops < byGiftWrapping(points).ops) return h;
  }
  throw new Error("재 본 구간 안에서 기본 연산이 뒤집히지 않았다");
}

if (flipPoint() !== FLIP) {
  throw new Error(
    `기본 연산이 뒤집히는 자리가 ${flipPoint()} 이다 — 상수와 어긋난다`,
  );
}

// 좌표 상한 10^9 안에 들어가는 가장 큰 껍질 크기가 `WIDEST` 인지 확인한다.
if (
  SPREAD * (WIDEST - 1) ** 2 > 1_000_000_000 ||
  SPREAD * WIDEST ** 2 <= 1_000_000_000
) {
  throw new Error(`좌표 상한에 걸리는 껍질 크기가 ${WIDEST} 가 아니다`);
}

const W = measure(WALK);
const A = measure(makePoints(MID, 3));
const B = measure(makePoints(MID, TIE));
const C = measure(makePoints(MID, FLIP));
const D = measure(makePoints(MID, WIDEST));
const E = measure(makePoints(BIG, WIDEST));

export const cases = {
  "정렬해 두고 사슬 둘": () => ({
    "전개 입력 기본 연산": W.mine.ops,
    "n=4,096 · h=3 기본 연산": A.mine.ops,
    "n=4,096 · h=13 기본 연산": B.mine.ops,
    "n=4,096 · h=14 기본 연산": C.mine.ops,
    "n=4,096 · h=350 기본 연산": D.mine.ops,
    "n=100,000 · h=350 기본 연산": E.mine.ops,
    "전개 입력 잡는 칸": W.mine.cells,
    "n=100,000 · h=350 잡는 칸": E.mine.cells,
  }),
  "선물 포장": () => ({
    "전개 입력 기본 연산": W.theirs.ops,
    "n=4,096 · h=3 기본 연산": A.theirs.ops,
    "n=4,096 · h=13 기본 연산": B.theirs.ops,
    "n=4,096 · h=14 기본 연산": C.theirs.ops,
    "n=4,096 · h=350 기본 연산": D.theirs.ops,
    "n=100,000 · h=350 기본 연산": E.theirs.ops,
    "전개 입력 잡는 칸": W.theirs.cells,
    "n=100,000 · h=350 잡는 칸": E.theirs.cells,
  }),
};
