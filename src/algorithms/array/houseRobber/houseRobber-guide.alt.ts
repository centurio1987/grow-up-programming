/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력·같은 작업 목록**에 두 설계를 걸고 **결정론적 계수**만 센다. 세는 것은 **기본
 * 연산 수**(덧셈 + 비교)다. 벽시계·처리량은 실행마다 달라 "본문의 수치가 실측과 일치하는가"
 * (P10)를 정의할 수 없다.
 *
 *   bun run ../../../../tools/bench-alt.ts houseRobber-guide.alt.ts
 *
 * **전개 입력을 그대로 못 쓰는 이유**(L20). 전개는 집 여섯 채짜리 배열을 쓰는데, 그 크기에서는
 * 세그먼트 트리가 한 번 갱신할 때 합치는 마디가 셋뿐이라 두 설계의 계수가 상수에 묻힌다.
 * 그래서 같은 규칙으로 만든 1,024 채짜리 입력을 쓴다 — 2 의 거듭제곱이라 트리의 잎이 정확히
 * 채워지고 빈 잎을 위한 특수값이 필요 없다. **난수를 쓰지 않으므로 시드가 없다** — 아래
 * 생성식이 입력의 전부이고, 그 식을 본문에도 적는다.
 */

/** 집의 수. */
export const N = 1024;

/** 갱신의 개수. */
export const U = 1024;

/** 초기 배열. `A[k] = (37k mod 97) + 1` 이라 값이 1 부터 97 사이에 든다. */
export function initial(): number[] {
  return Array.from({ length: N }, (_, k) => ((k * 37) % 97) + 1);
}

/** `k` 번째 갱신은 집 `91k mod N` 의 값을 `(53k mod 97) + 1` 로 바꾼다. */
export const UPDATES: [number, number][] = Array.from(
  { length: U },
  (_, k) => [(k * 91) % N, ((k * 53) % 97) + 1] as [number, number],
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
 * 이 가이드가 가르치는 절차 — **두 값을 이어받으며 한 번 순회하기**.
 * `houseRobber-guide.ref.ts` 와 같은 절차이고 기본 연산 계수만 덧붙였다.
 *
 * 갱신은 칸 하나를 바꾸는 것으로 끝나지만, 지금 배열의 답을 물으면 배열을 처음부터 다시
 * 순회해야 한다 — 그 자리가 이 설계가 내주는 축이다.
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
    let prev = 0;
    let cur = A[0] as number;
    for (let i = 1; i < N; i++) {
      const skip = cur;
      ops += 1; // 집 i 를 고른 답을 만드는 덧셈
      const take = prev + (A[i] as number);
      prev = cur;
      ops += 1; // 두 답 중 큰 쪽을 고르는 비교
      cur = Math.max(skip, take);
    }
    answers.push(cur);
  }

  return { ops, answers };
}

/**
 * 마디 하나가 들고 있는 네 값. 자리는 `[첫 집을 골랐는가][마지막 집을 골랐는가]` 순서이고,
 * 값은 그 조건에서 이 구간이 낼 수 있는 최댓값이다. 불가능한 조합은 `-Infinity` 다.
 */
type Node = [number, number, number, number];

const IMPOSSIBLE = Number.NEGATIVE_INFINITY;

/**
 * 경쟁 설계 — **세그먼트 트리**. 마디마다 위 네 값을 들고, 두 마디를 합칠 때 왼쪽의 마지막
 * 집과 오른쪽의 첫 집이 함께 골라지지 않는 조합 셋만 더한다.
 *
 * 합치기가 max-plus 반환(덧셈 자리에 max, 곱셈 자리에 덧셈이 오는 대수)의 2×2 행렬 곱과 같은
 * 모양이라, 갱신 하나가 잎에서 뿌리까지 `log N` 번의 합치기로 끝난다. 답은 뿌리의 네 값 중
 * 최댓값이라 질의가 비교 세 번이다.
 */
function segmentOps(p: number): { ops: number; answers: number[] } {
  const A = initial();
  const tree = new Array<Node>(2 * N);
  let ops = 0;
  const answers: number[] = [];

  const leaf = (v: number): Node => [0, IMPOSSIBLE, IMPOSSIBLE, v];

  /** 합치기 한 번에 덧셈 열둘과 비교 여덟이 든다 — 네 자리마다 후보 셋을 만들어 고른다. */
  const merge = (a: Node, b: Node): Node => {
    const out: number[] = [];
    for (let hi = 0; hi < 2; hi++) {
      for (let lo = 0; lo < 2; lo++) {
        ops += 3; // 후보 셋을 만드는 덧셈
        const c0 = (a[hi * 2] as number) + (b[lo] as number);
        const c1 = (a[hi * 2] as number) + (b[2 + lo] as number);
        const c2 = (a[hi * 2 + 1] as number) + (b[lo] as number);
        ops += 2; // 그중 최댓값을 고르는 비교
        out.push(Math.max(c0, c1, c2));
      }
    }
    return out as Node;
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
    const root = tree[1] as Node;
    ops += 3; // 네 값 중 최댓값을 고르는 비교
    answers.push(Math.max(root[0], root[1], root[2], root[3]));
  }

  return { ops, answers };
}

/** 질의를 몇 회 끼웠을 때 두 설계의 기본 연산 수 순서가 뒤집히는가. */
export const QUERY_POINTS = [0, 109, 110, U] as const;

/** 마디 하나가 값 넷을 들고, 마디가 `2N` 개다. */
const SEGMENT_CELLS = 2 * N * 4;

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
  "두 값 이어받기": () => counts(carryOps, 2),
  "세그먼트 트리": () => counts(segmentOps, SEGMENT_CELLS),
};
