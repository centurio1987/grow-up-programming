/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력·같은 작업 목록**에 두 설계를 걸고 **결정론적 계수**만 센다. 세는 것은 **배열
 * 접근 수**(읽기 + 쓰기)다. 벽시계·처리량은 실행마다 달라 "본문의 수치가 실측과 일치하는가"
 * (P10)를 정의할 수 없다.
 *
 *   bun run ../../../../tools/bench-alt.ts segmentTreeRangeMin-guide.alt.ts
 *
 * **전개 입력을 그대로 못 쓰는 이유**(L20). 전개는 다섯 칸짜리 `[5 2 4 1 3]` 에 연산
 * 다섯을 건다. 스파스 테이블의 표는 층이 `⌊log₂N⌋ + 1` 개라 `N = 5` 에서 세 층뿐이고,
 * 두 설계의 접근 수가 열 몇 번짜리 상수에 묻힌다. 그래서 같은 규칙으로 만든 1,024 칸
 * 입력을 쓴다. **난수를 쓰지 않으므로 시드가 없다** — 아래 생성식이 입력의 전부이고,
 * 그 식을 본문에도 적는다.
 */

/** 겹치지 않는 가지가 돌려주는 값. 정본과 같다. */
const INF = Number.MAX_SAFE_INTEGER;

/** 배열 길이. 2 의 거듭제곱이라 두 설계 모두 층이 정확히 채워진다. */
export const N = 1024;

/** 입력 배열. `A[i] = (37i) mod 101`. 값 자체는 접근 수에 영향을 주지 않는다. */
export const A: number[] = Array.from({ length: N }, (_, i) => (i * 37) % 101);

/** 질의 `t` 번째. `a = (37t) mod N`, `b = (91t) mod N` 을 만들고 작은 쪽을 왼쪽 끝으로 둔다. */
export function queryAt(t: number): [number, number] {
  const a = (t * 37) % N;
  const b = (t * 91) % N;
  return a <= b ? [a, b] : [b, a];
}

/** 갱신 `k` 번째. `A[(53k) mod N]` 를 `((29k) mod 1000) − 500` 으로 덮어쓴다. */
export function updateAt(k: number): [number, number] {
  return [(k * 53) % N, ((k * 29) % 1000) - 500];
}

type Op = ["q", number] | ["u", number];

/**
 * 갱신 `u` 회를 질의 `q` 회 사이에 고르게 끼운 작업 목록. **두 설계가 같은 목록을 받는다.**
 *
 * 갱신을 앞에 몰면 스파스 테이블이 표를 한 번만 다시 만들면 되어 대조가 연출이 된다 —
 * 갱신과 질의가 섞여 들어오는 것이 이 문제가 말하는 상황이다.
 */
export function workload(q: number, u: number): Op[] {
  const ops: Op[] = [];
  let done = 0;
  for (let i = 0; i < q; i++) {
    const want = Math.floor(((i + 1) * u) / q);
    while (done < want) {
      ops.push(["u", done]);
      done++;
    }
    ops.push(["q", i]);
  }
  while (done < u) {
    ops.push(["u", done]);
    done++;
  }
  return ops;
}

/**
 * 이 가이드가 가르치는 절차 — **세그먼트 트리**. `segmentTreeRangeMin-guide.ref.ts` 와 같은
 * 절차이고 접근 계수만 덧붙였다.
 */
function segAccesses(q: number, u: number): number {
  const a = A.slice();
  const tree = new Array<number>(4 * N).fill(INF);
  let acc = 0;

  const merge = (n: number): number => {
    acc += 2; // 자식 둘 읽기
    return Math.min(tree[2 * n] ?? INF, tree[2 * n + 1] ?? INF);
  };
  function build(n: number, s: number, e: number): void {
    if (s === e) {
      acc += 2; // a[s] 읽기 · tree[n] 쓰기
      tree[n] = a[s] ?? INF;
      return;
    }
    const mid = (s + e) >> 1;
    build(2 * n, s, mid);
    build(2 * n + 1, mid + 1, e);
    tree[n] = merge(n);
    acc++; // tree[n] 쓰기
  }
  function upd(n: number, s: number, e: number, i: number, v: number): void {
    if (s === e) {
      acc++; // tree[n] 쓰기
      tree[n] = v;
      return;
    }
    const mid = (s + e) >> 1;
    if (i <= mid) upd(2 * n, s, mid, i, v);
    else upd(2 * n + 1, mid + 1, e, i, v);
    tree[n] = merge(n);
    acc++; // tree[n] 쓰기
  }
  function ask(n: number, s: number, e: number, l: number, r: number): number {
    if (r < s || e < l) return INF;
    if (l <= s && e <= r) {
      acc++; // tree[n] 읽기
      return tree[n] ?? INF;
    }
    const mid = (s + e) >> 1;
    return Math.min(ask(2 * n, s, mid, l, r), ask(2 * n + 1, mid + 1, e, l, r));
  }

  build(1, 0, N - 1);
  for (const op of workload(q, u)) {
    if (op[0] === "q") {
      const [l, r] = queryAt(op[1]);
      ask(1, 0, N - 1, l, r);
      continue;
    }
    const [i, v] = updateAt(op[1]);
    acc++; // a[i] 쓰기
    a[i] = v;
    upd(1, 0, N - 1, i, v);
  }
  return acc;
}

/** 스파스 테이블의 층 수 − 1. 길이 `2^j` 짜리 구간까지 저장한다. */
const K = Math.floor(Math.log2(N));

/**
 * 경쟁 설계 — **스파스 테이블**.
 *
 * 층 `j` 의 칸 `i` 에 `A[i .. i+2^j−1]` 의 최솟값을 저장해 둔다. 질의 `[l, r]` 은 길이
 * `2^j` 짜리 구간 **둘로 겹쳐 덮어** 답하므로 칸 두 개만 읽으면 끝난다. 겹쳐도 되는 것은
 * 최솟값이 같은 값을 두 번 넣어도 답이 안 바뀌기 때문이다. 대신 **갱신을 받지 못한다** —
 * 원소 하나가 바뀌면 그 원소를 덮는 칸이 층마다 흩어져 있어 표를 다시 만들어야 한다.
 */
function sparseAccesses(q: number, u: number): number {
  const a = A.slice();
  let acc = 0;
  const table: number[][] = [];

  const build = (): void => {
    table.length = 0;
    const level0 = new Array<number>(N);
    for (let i = 0; i < N; i++) {
      acc += 2; // a[i] 읽기 · level0[i] 쓰기
      level0[i] = a[i] ?? INF;
    }
    table.push(level0);
    for (let j = 1; j <= K; j++) {
      const len = N - (1 << j) + 1;
      const cur = new Array<number>(len);
      const prev = table[j - 1] ?? [];
      for (let i = 0; i < len; i++) {
        acc += 3; // 앞 층 두 칸 읽기 · 이 층 한 칸 쓰기
        cur[i] = Math.min(prev[i] ?? INF, prev[i + (1 << (j - 1))] ?? INF);
      }
      table.push(cur);
    }
  };

  const ask = (l: number, r: number): number => {
    const j = 31 - Math.clz32(r - l + 1);
    const level = table[j] ?? [];
    acc += 2; // 겹치는 두 칸 읽기
    return Math.min(level[l] ?? INF, level[r - (1 << j) + 1] ?? INF);
  };

  build();
  for (const op of workload(q, u)) {
    if (op[0] === "q") {
      const [l, r] = queryAt(op[1]);
      ask(l, r);
      continue;
    }
    const [i, v] = updateAt(op[1]);
    acc++; // a[i] 쓰기
    a[i] = v;
    build();
  }
  return acc;
}

/** 스파스 테이블이 잡는 칸 수. 층마다 길이가 다르다. */
function sparseCells(): number {
  let cells = 0;
  for (let j = 0; j <= K; j++) cells += Math.max(0, N - (1 << j) + 1);
  return cells;
}

function counts(
  run: (q: number, u: number) => number,
  cells: number,
): Record<string, number> {
  return {
    "갱신 0 회 · 질의 3,515 개 배열 접근": run(3_515, 0),
    "갱신 0 회 · 질의 3,516 개 배열 접근": run(3_516, 0),
    "갱신 0 회 · 질의 4,096 개 배열 접근": run(4_096, 0),
    "갱신 0 회 · 질의 10,000 개 배열 접근": run(10_000, 0),
    "질의 4,096 개 · 갱신 1 회 배열 접근": run(4_096, 1),
    "질의 4,096 개 · 갱신 1,024 회 배열 접근": run(4_096, 1_024),
    "저장 칸": cells,
  };
}

export const cases = {
  "세그먼트 트리": () => counts(segAccesses, 4 * N),
  "스파스 테이블": () => counts(sparseAccesses, sparseCells()),
};
