/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * 세 정렬 순서를 **같은 입력**에 걸고 **포인터가 움직인 칸 수**를 센다. 벽시계가 아니라
 * 이동 칸 수인 이유는 하나다 — 실행마다 같은 값이 나와야 "본문의 수치가 실측과 일치하는가"
 * (P10)를 정의할 수 있다.
 *
 *   bun run ../../tools/bench-alt.ts mosAlgorithm-guide.alt.ts
 *
 * **왜 전개 입력을 안 쓰는가**(L20). `makeInput` 을 전개의 `arr=[1,1,2,1,3]` ·
 * 질의 다섯으로 바꿔 돌리면 Mo 11 · 펜윅 25 로 **방향이 반대로 나온다** — 그 크기에서는
 * 펜윅의 트리 높이 상수가 그대로 드러나기 때문이다. 전개 입력을 대조에 그대로 쓰면
 * Mo 가 이기는 그림이 나오는데, 유리한 입력을 고르는 것이 L20 이 막는 자리다.
 */

const N = 400;
const Q = 200;

/** 결정론적 의사난수. 시드를 고정해 실행마다 같은 입력을 만든다. */
function makeInput(): { arr: number[]; queries: [number, number][] } {
  let seed = 20260819;
  const next = (): number => (seed = (seed * 1103515245 + 12345) % 2147483648);
  const arr = Array.from({ length: N }, () => next() % 50);
  const queries: [number, number][] = Array.from({ length: Q }, () => {
    const a = next() % N;
    const b = next() % N;
    return [Math.min(a, b), Math.max(a, b)];
  });
  return { arr, queries };
}

type Order = (
  queries: { l: number; r: number; i: number }[],
  block: number,
) => void;

/** 정렬 순서만 갈아 끼우고 포인터 이동 칸 수를 센다. */
function moveCount(order: Order): number {
  const { arr, queries } = makeInput();
  const list = queries.map((q, i) => ({ l: q[0], r: q[1], i }));
  const block = Math.max(1, Math.floor(Math.sqrt(arr.length)));
  order(list, block);

  let moves = 0;
  let curL = 0;
  let curR = -1;
  for (const q of list) {
    while (curL > q.l) {
      curL--;
      moves++;
    }
    while (curR < q.r) {
      curR++;
      moves++;
    }
    while (curL < q.l) {
      curL++;
      moves++;
    }
    while (curR > q.r) {
      curR--;
      moves++;
    }
  }
  return moves;
}

/**
 * 경쟁 설계 — **오프라인 + 펜윅 트리(BIT)**.
 *
 * 창을 옮기는 대신 배열을 왼쪽부터 한 번만 훑는다. 값 `v` 를 만나면 **그 값의 직전 등장
 * 자리를 지우고** 지금 자리에 1을 세운다. 그러면 임의의 시점 `i` 에서 BIT 의 구간합
 * `[l, i]` 가 곧 "그 구간의 서로 다른 값 수" 다 — 각 값이 **가장 오른쪽 등장**에서만 세지기
 * 때문이다. 질의를 `r` 로만 정렬하면 훑기 한 번으로 전부 답한다.
 *
 * Mo 와 **다른 축**이다. Mo 는 질의 순서를 바꿔 창 이동을 줄이고, 이쪽은 자료구조를 바꿔
 * 창 자체를 없앤다.
 */
function fenwickOps(): number {
  const { arr, queries } = makeInput();
  const n = arr.length;
  let ops = 0;

  const tree = new Array<number>(n + 1).fill(0);
  const update = (i: number, delta: number): void => {
    for (let x = i + 1; x <= n; x += x & -x) {
      tree[x] = (tree[x] as number) + delta;
      ops++;
    }
  };
  const prefix = (i: number): number => {
    let sum = 0;
    for (let x = i + 1; x > 0; x -= x & -x) {
      sum += tree[x] as number;
      ops++;
    }
    return sum;
  };

  const byR = queries
    .map((q, i) => ({ l: q[0], r: q[1], i }))
    .sort((a, b) => a.r - b.r);
  const last = new Map<number, number>();
  const out = new Array<number>(queries.length);
  let cursor = 0;

  for (let i = 0; i < n; i++) {
    const v = arr[i] as number;
    const prev = last.get(v);
    if (prev !== undefined) update(prev, -1);
    update(i, 1);
    last.set(v, i);
    while (cursor < byR.length && (byR[cursor] as { r: number }).r === i) {
      const q = byR[cursor] as { l: number; r: number; i: number };
      out[q.i] = prefix(q.r) - (q.l > 0 ? prefix(q.l - 1) : 0);
      cursor++;
    }
  }
  return ops;
}

export const cases = {
  "Mo (블록,r)": () => ({
    이동칸: moveCount((list, block) => {
      list.sort((x, y) => {
        const bx = Math.floor(x.l / block);
        const by = Math.floor(y.l / block);
        return bx !== by ? bx - by : x.r - y.r;
      });
    }),
  }),
  "펜윅 트리": () => ({ 노드방문: fenwickOps() }),
};
