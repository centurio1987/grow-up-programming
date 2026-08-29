/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력·같은 작업 목록**에 두 설계를 걸고 **결정론적 계수**만 센다. 세는 것은 **기본
 * 연산 수**(곱셈 + 비교)다. 벽시계·처리량은 실행마다 달라 "본문의 수치가 실측과 일치하는가"
 * (P10)를 정의할 수 없다.
 *
 *   bun run ../../../../tools/bench-alt.ts maximumProductSubarray-guide.alt.ts
 *
 * **전개 입력을 그대로 못 쓰는 이유**(L20). 전개는 여섯 칸짜리 배열을 쓰는데, 그 크기에서는
 * 세그먼트 트리가 한 번 갱신할 때 합치는 마디가 셋뿐이라 두 설계의 계수가 상수에 묻힌다.
 * 그래서 같은 규칙으로 만든 1,024 칸 입력을 쓴다 — 2 의 거듭제곱이라 트리의 잎이 정확히
 * 채워지고 빈 잎을 위한 특수값이 필요 없다. **난수를 쓰지 않으므로 시드가 없다** — 아래
 * 생성식이 입력의 전부이고, 그 식을 본문에도 적는다.
 *
 * **값을 −1 · 0 · 1 로 둔 이유.** 1,024 칸의 곱은 double 의 표현 범위를 넘어 두 설계의 답이
 * 둘 다 `Infinity` 가 되고, 0 이 섞이면 `Infinity × 0` 이 `NaN` 이라 답 대조가 성립하지
 * 않는다. **두 설계 다 값을 보지 않고 정해진 수의 연산을 하므로 값의 범위는 계수를 바꾸지
 * 않는다** — 값은 「두 설계가 같은 답을 내는가」를 확인하는 데만 쓰인다.
 */

/** 배열의 길이. */
export const N = 1024;

/** 갱신의 개수. */
export const U = 1024;

/** 초기 배열. `A[k] = (37k mod 3) − 1` 이라 −1 · 0 · 1 이 나온다. */
export function initial(): number[] {
  return Array.from({ length: N }, (_, k) => ((k * 37) % 3) - 1);
}

/** `k` 번째 갱신은 칸 `91k mod N` 의 값을 `(53k mod 3) − 1` 로 바꾼다. */
export const UPDATES: [number, number][] = Array.from(
  { length: U },
  (_, k) => [(k * 91) % N, ((k * 53) % 3) - 1] as [number, number],
);

type Op = ["u", number] | ["q"];

/**
 * 질의 `p` 개를 갱신 `U` 개 사이에 고르게 끼운 작업 목록. **두 설계가 같은 목록을 받는다.**
 * 목록의 맨 끝에는 두 설계가 다 답하는 질의를 하나 둔다.
 */
export function workload(p: number): Op[] {
  const ops: Op[] = [];
  let done = 0;
  for (let k = 0; k < U; k++) {
    ops.push(["u", k]);
    const want = Math.floor(((k + 1) * p) / U);
    while (done < want) {
      ops.push(["q"]);
      done++;
    }
  }
  while (done < p) {
    ops.push(["q"]);
    done++;
  }
  ops.push(["q"]);
  return ops;
}

/**
 * 이 가이드가 가르치는 절차 — **칸마다 최댓값과 최솟값을 함께 이어받기**.
 * `maximumProductSubarray-guide.ref.ts` 와 같은 절차이고 기본 연산 계수만 덧붙였다.
 *
 * 갱신은 칸 하나를 바꾸는 것으로 끝나지만, 지금 배열의 최대 부분곱을 물으면 배열을 처음부터
 * 다시 순회해야 한다 — 그 자리가 이 설계가 내주는 축이다.
 */
function carryOps(p: number): { ops: number; answers: number[] } {
  const A = initial();
  let ops = 0;
  const answers: number[] = [];

  for (const op of workload(p)) {
    if (op[0] === "u") {
      const [at, value] = UPDATES[op[1]] as [number, number];
      A[at] = value;
      continue;
    }
    let curMax = A[0] as number;
    let curMin = A[0] as number;
    let best = A[0] as number;
    for (let i = 1; i < N; i++) {
      const x = A[i] as number;
      ops += 2; // 이어 붙이는 후보 둘을 만드는 곱셈
      const grown = curMax * x;
      const flipped = curMin * x;
      ops += 2; // 후보 셋에서 최댓값 고르기
      curMax = Math.max(x, grown, flipped);
      ops += 2; // 같은 후보 셋에서 최솟값 고르기
      curMin = Math.min(x, grown, flipped);
      ops += 1; // 지금까지의 최댓값 갱신
      best = Math.max(best, curMax);
    }
    answers.push(best);
  }

  return { ops, answers };
}

/** 마디 하나가 들고 있는 여섯 값. */
interface Node {
  prod: number;
  preMax: number;
  preMin: number;
  sufMax: number;
  sufMin: number;
  best: number;
}

/**
 * 경쟁 설계 — **세그먼트 트리**. 마디마다 그 구간의 (전체 곱 · 왼쪽 끝에서 시작하는 곱의
 * 최댓값과 최솟값 · 오른쪽 끝에서 끝나는 곱의 최댓값과 최솟값 · 최대 부분곱) 여섯을 들고,
 * 두 마디를 합칠 때 여섯을 함께 만든다.
 *
 * **최솟값을 함께 드는 이유가 이 가이드의 관찰과 같다.** 왼쪽 마디의 뒤쪽 곱과 오른쪽 마디의
 * 앞쪽 곱을 이을 때, 둘 다 음수면 그 곱이 최댓값이 된다. 그래서 네 모서리 곱을 다 만든다.
 *
 * 갱신 하나가 잎에서 뿌리까지 `log N` 번의 합치기로 끝나고, 최대 부분곱은 뿌리에 이미 적혀
 * 있어 질의가 읽기 한 번이다.
 */
function segmentOps(p: number): { ops: number; answers: number[] } {
  const A = initial();
  const tree = new Array<Node>(2 * N);
  let ops = 0;
  const answers: number[] = [];

  const leaf = (x: number): Node => ({
    prod: x,
    preMax: x,
    preMin: x,
    sufMax: x,
    sufMin: x,
    best: x,
  });

  /** 합치기 한 번에 곱셈 아홉과 비교 열셋이 든다. */
  const merge = (a: Node, b: Node): Node => {
    ops += 9 + 13;
    const headHi = a.prod * b.preMax;
    const headLo = a.prod * b.preMin;
    const tailHi = b.prod * a.sufMax;
    const tailLo = b.prod * a.sufMin;
    return {
      prod: a.prod * b.prod,
      preMax: Math.max(a.preMax, headHi, headLo),
      preMin: Math.min(a.preMin, headHi, headLo),
      sufMax: Math.max(b.sufMax, tailHi, tailLo),
      sufMin: Math.min(b.sufMin, tailHi, tailLo),
      best: Math.max(
        a.best,
        b.best,
        a.sufMax * b.preMax,
        a.sufMax * b.preMin,
        a.sufMin * b.preMax,
        a.sufMin * b.preMin,
      ),
    };
  };

  for (let i = 0; i < N; i++) tree[N + i] = leaf(A[i] as number);
  for (let i = N - 1; i >= 1; i--) {
    tree[i] = merge(tree[2 * i] as Node, tree[2 * i + 1] as Node);
  }

  for (const op of workload(p)) {
    if (op[0] === "u") {
      const [at, value] = UPDATES[op[1]] as [number, number];
      tree[N + at] = leaf(value);
      for (let i = (N + at) >> 1; i >= 1; i >>= 1) {
        tree[i] = merge(tree[2 * i] as Node, tree[2 * i + 1] as Node);
      }
      continue;
    }
    answers.push((tree[1] as Node).best);
  }

  return { ops, answers };
}

/** 질의를 몇 회 끼웠을 때 두 설계의 기본 연산 수 순서가 뒤집히는가. */
export const QUERY_POINTS = [0, 33, 34, U] as const;

/** 마디 하나가 값 여섯을 들고, 마디가 `2N` 개다. */
const SEGMENT_CELLS = 2 * N * 6;

/**
 * 두 설계가 **같은 답을 낸다는 것**을 매번 대조한다. 답이 다르면 계수는 서로 다른 일을 잰
 * 것이라 대조가 성립하지 않는다.
 */
function counts(
  run: (p: number) => { ops: number; answers: number[] },
  cells: number,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of QUERY_POINTS) {
    const mine = run(p);
    const other = carryOps(p);
    if (JSON.stringify(mine.answers) !== JSON.stringify(other.answers)) {
      throw new Error(`질의 ${p} 회에서 두 설계의 답이 다르다`);
    }
    out[`질의 ${p.toLocaleString("en-US")} 회 기본 연산`] = mine.ops;
  }
  out["저장 칸"] = cells;
  return out;
}

export const cases = {
  "칸마다 이어받기": () => counts(carryOps, 3),
  "세그먼트 트리": () => counts(segmentOps, SEGMENT_CELLS),
};
