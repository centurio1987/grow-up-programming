/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/geometry/bentleyOttmann/bentleyOttmann.ts` 는 학습자 스텁이라
 * 가이드가 그대로 인용할 수 없다. 가이드 본문의 코드는 이 파일에서 옮기고, 증명 사이드카
 * (`*.proof.ts`)와 재실행 시험(`*.test.ts`), 대조 하네스(`*.alt.ts`)도 이 파일을 부른다.
 *
 * **판정에 배정밀도를 한 번도 쓰지 않는다.** 두 선분이 만나는 자리는 좌표가 분수라서
 * 배정밀도로 담으면 자리끼리의 앞뒤가 갈릴 수 있다. 그래서 자리를 분자 둘과 분모 하나의
 * 정수 세 개로 적어 두고, 크기 비교는 곱셈으로 한다. `bigint` 는 자릿수 제한이 없으므로
 * 제약의 좌표 상한 `10^9` 에서도 부호가 확정된다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 네 줄을
 * 각각 하나씩 바꾸거나 지운다 — 세로 선분의 y 범위 위끝 · 만나는 선분 모으기 · 기울기 정렬 ·
 * 오른쪽 이웃 예약. 맞는 줄이 정확히 하나가 아니면 던지므로, 그 식들을 주석에 같은 모양으로
 * 다시 적지 않는다.
 */

export type Point = [number, number];
export type Segment = [Point, Point];

/** 사건이 일어나는 자리. 좌표는 `(x/d, y/d)` 이고 `d` 는 언제나 양수다. */
interface Spot {
  x: bigint;
  y: bigint;
  d: bigint;
}

/** 두 끝점을 사전순으로 세워 둔 선분. `lo` 가 앞선 끝점이다. */
interface Seg {
  id: number;
  lox: bigint;
  loy: bigint;
  hix: bigint;
  hiy: bigint;
  dx: bigint;
  dy: bigint;
  vertical: boolean;
}

/** 부호만 돌려준다. 크기는 어디서도 쓰지 않는다. */
function sign(v: bigint): number {
  return v > 0n ? 1 : v < 0n ? -1 : 0;
}

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x;
}

/**
 * 분자 둘과 분모를 최대공약수로 나눈다.
 *
 * 같은 자리가 언제나 같은 세 수로 적혀야 사전 열쇠가 맞는다. 줄이지 않으면 `(2,2)` 가
 * 어떤 경로에서는 `4/4/2` 로 적혀 끝점 `(2,2)` 와 다른 자리로 읽힌다.
 */
function reduced(x: bigint, y: bigint, d: bigint): Spot {
  const g = gcd(gcd(x, y), d);
  return g > 1n ? { x: x / g, y: y / g, d: d / g } : { x, y, d };
}

/** 사전순 대소 — x 가 먼저이고 같으면 y 다. */
function cmpSpot(a: Spot, b: Spot): number {
  const dx = a.x * b.d - b.x * a.d;
  if (dx !== 0n) return sign(dx);
  return sign(a.y * b.d - b.y * a.d);
}

/** 자리를 문자열 하나로 적는다. 사전에서 끝점을 찾는 열쇠다. */
function spotKey(p: Spot): string {
  return `${p.x}/${p.y}/${p.d}`;
}

/**
 * 자리 `p` 가 선분 `s` 의 직선보다 위면 1, 아래면 −1, 직선 위면 0.
 *
 * 세 점의 방향 판정과 같은 식이고, 분모 `d` 가 양수라 곱해도 부호가 안 바뀐다.
 */
function orient(s: Seg, p: Spot): number {
  return sign(s.dx * (p.y - s.loy * p.d) - s.dy * (p.x - s.lox * p.d));
}

/** 기울기 대소. 상태 배열에 담기는 선분은 세로가 아니라 `dx` 가 양수다. */
function slopeOrder(a: Seg, b: Seg): number {
  return sign(a.dy * b.dx - b.dy * a.dx);
}

/** 두 끝점을 사전순으로 세운다. */
function toSeg(raw: Segment, id: number): Seg {
  const [a, b] = raw;
  const front = a[0] < b[0] || (a[0] === b[0] && a[1] <= b[1]);
  const lo = front ? a : b;
  const hi = front ? b : a;
  const lox = BigInt(lo[0]);
  const loy = BigInt(lo[1]);
  const hix = BigInt(hi[0]);
  const hiy = BigInt(hi[1]);
  return {
    id,
    lox,
    loy,
    hix,
    hiy,
    dx: hix - lox,
    dy: hiy - loy,
    vertical: lo[0] === hi[0],
  };
}

/**
 * 두 선분이 한 점에서 가로지르는 자리. 평행하거나 만나는 점이 선분 밖이면 `null`.
 *
 * 같은 직선 위의 두 선분은 분모가 0 이라 여기서 `null` 이 된다. 그 짝은 한쪽 끝점이 다른
 * 선분 위에 있으므로 끝점 사건에서 세어진다.
 */
function crossingSpot(a: Seg, b: Seg): Spot | null {
  let den = a.dx * b.dy - a.dy * b.dx;
  if (den === 0n) return null;
  const wx = b.lox - a.lox;
  const wy = b.loy - a.loy;
  let tn = wx * b.dy - wy * b.dx;
  let un = wx * a.dy - wy * a.dx;
  if (den < 0n) {
    den = -den;
    tn = -tn;
    un = -un;
  }
  if (tn < 0n || tn > den || un < 0n || un > den) return null;
  return reduced(a.lox * den + tn * a.dx, a.loy * den + tn * a.dy, den);
}

/** 최소 힙에 자리 하나를 넣는다. */
function heapPush(heap: Spot[], p: Spot): void {
  heap.push(p);
  let at = heap.length - 1;
  while (at > 0) {
    const parent = (at - 1) >> 1;
    if (cmpSpot(heap[at] as Spot, heap[parent] as Spot) >= 0) break;
    const keep = heap[at] as Spot;
    heap[at] = heap[parent] as Spot;
    heap[parent] = keep;
    at = parent;
  }
}

/** 사전순으로 가장 앞선 자리를 꺼낸다. */
function heapPop(heap: Spot[]): Spot {
  const top = heap[0] as Spot;
  const last = heap.pop() as Spot;
  if (heap.length > 0) {
    heap[0] = last;
    let at = 0;
    for (;;) {
      const left = at * 2 + 1;
      const right = left + 1;
      let small = at;
      if (
        left < heap.length &&
        cmpSpot(heap[left] as Spot, heap[small] as Spot) < 0
      ) {
        small = left;
      }
      if (
        right < heap.length &&
        cmpSpot(heap[right] as Spot, heap[small] as Spot) < 0
      ) {
        small = right;
      }
      if (small === at) break;
      const keep = heap[at] as Spot;
      heap[at] = heap[small] as Spot;
      heap[small] = keep;
      at = small;
    }
  }
  return top;
}

/**
 * 선분 배열에서 서로 교차하는 선분 쌍의 개수.
 *
 * 끝점끼리 만나기만 해도, 같은 직선 위에서 구간을 공유해도 한 쌍으로 센다.
 * 같은 점에서 `m` 개가 만나면 그 안의 모든 짝을 세므로 `m(m−1)/2` 쌍이다.
 */
export function bentleyOttmann(segments: Segment[]): number {
  const n = segments.length;
  if (n < 2) return 0;
  const segs = segments.map(toSeg);

  const events: Spot[] = [];
  const startAt = new Map<string, number[]>();
  const endAt = new Map<string, number[]>();
  const uprightLow = new Map<string, number[]>();
  const uprightHigh = new Map<string, number[]>();
  const fileInto = (
    book: Map<string, number[]>,
    at: string,
    id: number,
  ): void => {
    const got = book.get(at);
    if (got === undefined) book.set(at, [id]);
    else got.push(id);
  };
  for (const s of segs) {
    const lo: Spot = { x: s.lox, y: s.loy, d: 1n };
    const hi: Spot = { x: s.hix, y: s.hiy, d: 1n };
    heapPush(events, lo);
    heapPush(events, hi);
    fileInto(s.vertical ? uprightLow : startAt, spotKey(lo), s.id);
    fileInto(s.vertical ? uprightHigh : endAt, spotKey(hi), s.id);
  }

  /** 세로가 아닌 활성 선분. 스위프 자리에서의 y 오름차순이다. */
  const status: number[] = [];
  /** 지금 열려 있는 세로 선분. 전부 지금 사건 자리의 x 에 있다. */
  const upright: number[] = [];
  const seen = new Set<number>();
  let pairs = 0;

  const record = (a: number, b: number): void => {
    const key = a < b ? a * n + b : b * n + a;
    if (seen.has(key)) return;
    seen.add(key);
    pairs++;
  };

  /** y 가 자리보다 작은 선분은 앞쪽에 몰려 있다. 처음으로 그렇지 않은 첨자. */
  const firstNotBelow = (p: Spot): number => {
    let lo = 0;
    let hi = status.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (orient(segs[status[mid] as number] as Seg, p) > 0) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };

  /** 처음으로 y 가 자리보다 큰 선분의 첨자. */
  const firstAbove = (p: Spot): number => {
    let lo = 0;
    let hi = status.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (orient(segs[status[mid] as number] as Seg, p) >= 0) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };

  const scheduleAt = (now: Spot, left: number, right: number): void => {
    if (left < 0 || right >= status.length) return;
    const q = crossingSpot(
      segs[status[left] as number] as Seg,
      segs[status[right] as number] as Seg,
    );
    if (q !== null && cmpSpot(q, now) > 0) heapPush(events, q);
  };

  while (events.length > 0) {
    const now = heapPop(events);
    while (events.length > 0 && cmpSpot(events[0] as Spot, now) === 0)
      heapPop(events);
    const here = spotKey(now);

    // ① 이 자리에서 시작하는 세로 선분을 연다. 열려 있는 세로 선분은 전부 이 자리를 지나고,
    //    상태 배열에서 이 세로 선분의 y 범위 안에 있는 선분도 전부 이 세로 선분과 만난다.
    for (const id of uprightLow.get(here) ?? []) {
      const v = segs[id] as Seg;
      for (const other of upright) record(id, other);
      const top: Spot = { x: v.hix, y: v.hiy, d: 1n };
      const to = firstAbove(top);
      for (let at = firstNotBelow(now); at < to; at++)
        record(id, status[at] as number);
      upright.push(id);
    }

    // ② 이 자리를 지나는 선분을 모은다. 상태 배열에서 방향 판정이 0 인 구간이 그것이고,
    //    여기서 시작하는 선분과 열려 있는 세로 선분도 같은 자리를 지나므로 함께 센다.
    const from = firstNotBelow(now);
    const through = status.slice(from, firstAbove(now));
    const starting = startAt.get(here) ?? [];
    const meeting = [...through, ...starting];
    for (let i = 0; i < meeting.length; i++) {
      const one = meeting[i] as number;
      for (let j = i + 1; j < meeting.length; j++)
        record(one, meeting[j] as number);
      for (const v of upright) record(one, v);
    }

    // ③ 여기서 끝나는 선분을 빼고, 남은 것을 이 자리 **뒤**의 순서로 다시 놓는다.
    //    이 자리를 지나는 선분끼리는 기울기가 큰 쪽이 위로 간다.
    const ending = new Set(endAt.get(here) ?? []);
    const after = [
      ...through.filter((id) => !ending.has(id)),
      ...starting,
    ].sort((x, y) => slopeOrder(segs[x] as Seg, segs[y] as Seg) || x - y);
    status.splice(from, through.length, ...after);

    // ④ 이 자리에서 끝나는 세로 선분을 닫는다.
    for (const id of uprightHigh.get(here) ?? []) {
      const at = upright.indexOf(id);
      if (at >= 0) upright.splice(at, 1);
    }

    // ⑤ 새로 이웃이 된 두 자리에서 다음 교차 자리를 예약한다. 가운데 토막은 전부 이 자리를
    //    지나므로 다시 만날 일이 없고, 예약할 것은 토막의 양 끝뿐이다.
    scheduleAt(now, from - 1, from);
    scheduleAt(now, from + after.length - 1, from + after.length);
  }

  return pairs;
}
