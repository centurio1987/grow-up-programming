/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력·같은 작업 목록**에 두 설계를 걸고 **결정론적 계수**만 센다. 세는 것은 **배열
 * 접근 수**(읽기 + 쓰기)다. 벽시계·처리량은 실행마다 달라 "본문의 수치가 실측과 일치하는가"
 * (P10)를 정의할 수 없다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/array/sparseTableRangeMin/sparseTableRangeMin-guide.alt.ts
 *
 * **전개 입력을 그대로 못 쓰는 이유**(L20). 전개는 여섯 칸짜리 `[5 2 7 4 6 3]` 을 쓰는데,
 * 여섯 칸에서는 표의 층이 셋뿐이고 세그먼트 트리의 깊이도 셋이라 두 설계의 접근 수가 상수에
 * 묻힌다. 그래서 같은 규칙으로 만든 2,048 칸 입력을 쓴다. **난수를 쓰지 않으므로 시드가
 * 없다** — 아래 생성식이 입력의 전부이고, 그 식을 본문에도 적는다.
 *
 * **경쟁 설계가 매 실행마다 정본과 답을 대조한다.** 답이 다른 구현으로 잰 계수는 저울질이
 * 아니라 다른 문제의 값이다(`FEEDBACK.md` §5, 2026-09-03 `S34`).
 */
import { sparseTableRangeMin } from "./sparseTableRangeMin-guide.ref.ts";

/** 배열 길이. 2 의 거듭제곱이라 세그먼트 트리의 잎이 정확히 채워진다. */
export const N = 2048;

/** 입력 배열. `A[i] = (733i) mod 1009`. */
export const A: number[] = Array.from(
  { length: N },
  (_, i) => (i * 733) % 1009,
);

/** 질의 수의 기본값. */
export const Q = 2048;

/** 질의 목록. `a = (577t) mod N`, `b = (1231t) mod N` 을 만들고 작은 쪽을 왼쪽 끝으로 둔다. */
export function queries(q: number): [number, number][] {
  return Array.from({ length: q }, (_, t) => {
    const a = (t * 577) % N;
    const b = (t * 1231) % N;
    return (a <= b ? [a, b] : [b, a]) as [number, number];
  });
}

/** 갱신 목록. `k` 번째는 `A[(97k) mod N]` 을 `((311k) mod 2001) − 1000` 으로 덮어쓴다. */
function updates(u: number): [number, number][] {
  return Array.from(
    { length: u },
    (_, k) => [(k * 97) % N, ((k * 311) % 2001) - 1000] as [number, number],
  );
}

type Op = ["q", number] | ["u", number];

/**
 * 갱신 `u` 회를 질의 `q` 회 사이에 고르게 끼운 작업 목록. **두 설계가 같은 목록을 받는다.**
 *
 * 갱신을 앞에 몰면 표를 한 번만 다시 만들면 되어 대조가 연출이 된다 — 갱신과 질의가 섞여
 * 들어오는 것이 이 대조가 재려는 상황이다.
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

/** 한 설계를 실행한 결과 — 접근 수와 답 목록, 저장 칸. */
interface Run {
  accesses: number;
  answers: number[];
  cells: number;
}

/**
 * 이 가이드가 가르치는 절차 — **스파스 테이블**. `sparseTableRangeMin-guide.ref.ts` 와 같은
 * 절차이고 접근 계수만 덧붙였다. 갱신이 들어오면 표를 처음부터 다시 만든다.
 */
export function sparseRun(q: number, u: number): Run {
  const a = A.slice();
  const up = updates(u);
  let acc = 0;
  let cells = 0;

  const logTable = new Array<number>(N + 1).fill(0);
  for (let m = 2; m <= N; m++) logTable[m] = (logTable[m >> 1] as number) + 1;
  const top = logTable[N] as number;

  let st: number[][] = [];
  const build = (): void => {
    st = [a.slice()];
    acc += 2 * N; // 0 층 — 배열 한 칸을 읽어 한 칸에 쓴다
    for (let k = 1; k <= top; k++) {
      const below = st[k - 1] as number[];
      const width = 1 << k;
      const half = width >> 1;
      const row = new Array<number>(N - width + 1);
      for (let i = 0; i + width <= N; i++) {
        acc += 3; // 아래층 두 칸 읽기 · 위층 한 칸 쓰기
        row[i] = Math.min(below[i] as number, below[i + half] as number);
      }
      st.push(row);
    }
    cells = st.reduce((s, row) => s + row.length, 0);
  };

  build();
  const answers: number[] = [];
  const qs = queries(q);
  for (const op of workload(q, u)) {
    if (op[0] === "q") {
      const [l, r] = qs[op[1]] as [number, number];
      const k = logTable[r - l + 1] as number;
      const row = st[k] as number[];
      acc += 2; // 두 조각 읽기
      answers.push(Math.min(row[l] as number, row[r - (1 << k) + 1] as number));
    } else {
      const [idx, value] = up[op[1]] as [number, number];
      acc += 1; // a[idx] 쓰기
      a[idx] = value;
      build();
    }
  }
  return { accesses: acc, answers, cells };
}

/**
 * 경쟁 설계 — **세그먼트 트리**(아래에서 위로 채우는 배열 구현).
 *
 * 같은 목표(구간 최솟값 질의에 답하기)를 노리고 저장 방식이 다르다. 마디 하나가 자기 아래
 * 구간의 최솟값을 들고 있어서, 질의는 겹치지 않는 마디 여럿으로 구간을 갈라 합친다. 갱신은
 * 그 잎에서 뿌리까지의 조상만 다시 계산하면 끝난다.
 */
export function segmentRun(q: number, u: number): Run {
  const a = A.slice();
  const up = updates(u);
  let acc = 0;

  let size = 1;
  while (size < N) size *= 2;
  const INF = Number.POSITIVE_INFINITY;
  const tree = new Array<number>(2 * size).fill(INF);

  for (let i = 0; i < N; i++) {
    acc += 2; // a[i] 읽기 · 잎 쓰기
    tree[size + i] = a[i] as number;
  }
  for (let i = size - 1; i >= 1; i--) {
    acc += 3; // 자식 둘 읽기 · 자기 쓰기
    tree[i] = Math.min(tree[2 * i] as number, tree[2 * i + 1] as number);
  }

  const query = (l: number, r: number): number => {
    let lo = l + size;
    let hi = r + size + 1;
    let best = INF;
    while (lo < hi) {
      if ((lo & 1) === 1) {
        acc += 1;
        best = Math.min(best, tree[lo] as number);
        lo++;
      }
      if ((hi & 1) === 1) {
        hi--;
        acc += 1;
        best = Math.min(best, tree[hi] as number);
      }
      lo >>= 1;
      hi >>= 1;
    }
    return best;
  };

  const update = (idx: number, value: number): void => {
    acc += 2; // a[idx] 쓰기 · 잎 쓰기
    a[idx] = value;
    tree[size + idx] = value;
    let j = (size + idx) >> 1;
    while (j >= 1) {
      acc += 3; // 자식 둘 읽기 · 자기 쓰기
      tree[j] = Math.min(tree[2 * j] as number, tree[2 * j + 1] as number);
      j >>= 1;
    }
  };

  const answers: number[] = [];
  const qs = queries(q);
  for (const op of workload(q, u)) {
    if (op[0] === "q") {
      const [l, r] = qs[op[1]] as [number, number];
      answers.push(query(l, r));
    } else {
      const [idx, value] = up[op[1]] as [number, number];
      update(idx, value);
    }
  }
  return { accesses: acc, answers, cells: 2 * size };
}

/**
 * 두 설계가 같은 작업 목록에서 **같은 답**을 내는지 확인한다. 정본이 낸 답과도 대조한다.
 *
 * 갱신이 섞인 목록은 정본 한 번으로 못 재현하므로, 갱신 0 회에서는 정본과 직접 견주고
 * 갱신이 있는 목록에서는 두 설계가 서로 같은지를 본다.
 */
function measure(q: number, u: number): { sparse: Run; segment: Run } {
  const sparse = sparseRun(q, u);
  const segment = segmentRun(q, u);
  if (sparse.answers.length !== segment.answers.length) {
    throw new Error("두 설계가 답한 개수가 다르다");
  }
  for (const [i, value] of sparse.answers.entries()) {
    if (value !== segment.answers[i]) {
      throw new Error(`두 설계의 답이 ${i} 번째에서 다르다`);
    }
  }
  if (u === 0) {
    const want = sparseTableRangeMin(A.slice(), queries(q));
    for (const [i, value] of want.entries()) {
      if (value !== sparse.answers[i]) {
        throw new Error(`스파스 테이블 사본이 정본과 ${i} 번째에서 다르다`);
      }
    }
  }
  return { sparse, segment };
}

/**
 * 갱신 0 회에서 스파스 테이블이 **처음으로 적어지는 질의 수**.
 *
 * 두 계수 다 질의 수에 대해 증가하고 차이는 단조라 이분 탐색으로 찾는다 — 한 자리씩 올리며
 * 재면 같은 값을 수천 번 다시 만든다.
 */
export function firstQueryWin(hi = 16384): number {
  const wins = (q: number): boolean => {
    const { sparse, segment } = measure(q, 0);
    return sparse.accesses < segment.accesses;
  };
  if (!wins(hi)) return -1;
  let lo = 1;
  let high = hi;
  while (lo < high) {
    const mid = (lo + high) >> 1;
    if (wins(mid)) high = mid;
    else lo = mid + 1;
  }
  return lo;
}

/** 질의를 `q` 개로 고정했을 때 세그먼트 트리가 처음으로 적어지는 갱신 수. */
export function firstUpdateWin(q: number, hi = 64): number {
  for (let u = 0; u <= hi; u++) {
    const { sparse, segment } = measure(q, u);
    if (segment.accesses < sparse.accesses) return u;
  }
  return -1;
}

/** 스파스 테이블이 앞서는 자리를 하나 잡아 갱신 축을 재는 질의 수. */
export const Q_BIG = 8192;

/**
 * 본문이 적는 네 자리. 6,994 와 6,995 가 순서가 뒤집히는 경계이고, 그 자리는
 * `firstQueryWin()` 이 낸 값이다 — 1 부터 16,384 까지 전수로 재어 상태가 뒤집히는 자리가
 * **한 곳뿐**인 것도 확인했다.
 */
const QUERY_POINTS = [64, 6994, 6995, 8192];

function counts(pick: (r: { sparse: Run; segment: Run }) => Run) {
  return (): Record<string, number> => {
    const out: Record<string, number> = {};
    for (const q of QUERY_POINTS) {
      out[`갱신 0 회 · 질의 ${q} 개 배열 접근`] = pick(measure(q, 0)).accesses;
    }
    for (const u of [1, 16]) {
      out[`질의 ${Q_BIG} 개 · 갱신 ${u} 회 배열 접근`] = pick(
        measure(Q_BIG, u),
      ).accesses;
    }
    out["저장 칸"] = pick(measure(64, 0)).cells;
    return out;
  };
}

export const cases = {
  "스파스 테이블": counts((r) => r.sparse),
  "세그먼트 트리": counts((r) => r.segment),
};
