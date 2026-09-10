/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력·같은 작업 목록**에 두 설계를 걸고 **결정론적 계수**만 센다. 세는 것은 **기본
 * 연산 수**(뺄셈 + 비교)다. 벽시계·처리량은 실행마다 달라 "본문의 수치가 실측과 일치하는가"
 * (P10)를 정의할 수 없다.
 *
 *   bun run ../../../../tools/bench-alt.ts bestTimeToBuyAndSellStock-guide.alt.ts
 *
 * **전개 입력을 그대로 못 쓰는 이유**(L20). 전개는 여섯 날짜짜리 배열을 쓰는데, 그 크기에서는
 * 세그먼트 트리가 한 번 갱신할 때 합치는 마디가 세 개뿐이라 두 설계의 계수가 상수에 묻힌다.
 * 그래서 같은 규칙으로 만든 1,024 날짜 입력을 쓴다 — 2 의 거듭제곱이라 트리의 잎이 정확히
 * 채워지고 빈 잎을 위한 특수값이 필요 없다. **난수를 쓰지 않으므로 시드가 없다** — 아래
 * 생성식이 입력의 전부이고, 그 식을 본문에도 적는다.
 */

/** 날짜 수. */
export const N = 1024;

/** 갱신의 개수. */
export const U = 1024;

/** 초기 가격 배열. `prices[k] = 37k mod 101` 이라 0 부터 100 까지의 값이 나온다. */
export function initial(): number[] {
  return Array.from({ length: N }, (_, k) => (k * 37) % 101);
}

/** `k` 번째 갱신은 날 `91k mod N` 의 가격을 `53k mod 101` 로 바꾼다. */
export const UPDATES: [number, number][] = Array.from(
  { length: U },
  (_, k) => [(k * 91) % N, (k * 53) % 101] as [number, number],
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
 * 이 가이드가 가르치는 절차 — **날마다 이어받기**. `bestTimeToBuyAndSellStock-guide.ref.ts`
 * 와 같은 절차이고 기본 연산 계수만 덧붙였다.
 *
 * 갱신은 날 하나의 가격을 바꾸는 것으로 끝나지만, 지금 배열의 최대 이익을 물으면 배열을
 * 처음부터 다시 순회해야 한다 — 그 자리가 이 설계가 내주는 축이다.
 */
function carryOps(p: number): { ops: number; answers: number[] } {
  const prices = initial();
  let ops = 0;
  const answers: number[] = [];

  for (const op of workload(p)) {
    if (op[0] === "u") {
      const [at, value] = UPDATES[op[1]] as [number, number];
      prices[at] = value;
      continue;
    }
    let minP = prices[0] as number;
    let best = 0;
    for (let i = 1; i < N; i++) {
      const price = prices[i] as number;
      ops += 1; // 오늘 파는 이익을 만드는 뺄셈
      const gain = price - minP;
      ops += 1; // 지금까지의 최대 이익과 견주기
      best = Math.max(best, gain);
      ops += 1; // 최저가 갱신
      minP = Math.min(minP, price);
    }
    answers.push(best);
  }

  return { ops, answers };
}

/** 마디 하나가 들고 있는 세 값. */
interface Node {
  low: number;
  high: number;
  best: number;
}

/**
 * 경쟁 설계 — **세그먼트 트리**. 마디마다 그 구간의 (최저가 · 최고가 · 그 구간 안에서만
 * 거래했을 때의 최대 이익) 셋을 들고, 두 마디를 합칠 때 셋을 함께 만든다.
 *
 * 합치기의 요점은 가운데를 넘는 거래다 — 왼쪽 구간에서 사고 오른쪽 구간에서 파는 이익이
 * `오른쪽 최고가 − 왼쪽 최저가` 이고, 그것과 양쪽 각각의 최대 이익 중 큰 것이 합친 구간의
 * 답이 된다.
 *
 * 갱신 하나가 잎에서 뿌리까지 `log N` 번의 합치기로 끝나고, 최대 이익은 뿌리에 이미 적혀
 * 있어 질의가 읽기 한 번이다.
 */
function segmentOps(p: number): { ops: number; answers: number[] } {
  const prices = initial();
  const tree = new Array<Node>(2 * N);
  let ops = 0;
  const answers: number[] = [];

  const leaf = (x: number): Node => ({ low: x, high: x, best: 0 });

  /** 합치기 한 번에 뺄셈 하나와 비교 넷이 든다. */
  const merge = (a: Node, b: Node): Node => {
    ops += 5;
    return {
      low: Math.min(a.low, b.low),
      high: Math.max(a.high, b.high),
      best: Math.max(a.best, b.best, b.high - a.low),
    };
  };

  for (let i = 0; i < N; i++) tree[N + i] = leaf(prices[i] as number);
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

/** 두 설계가 같은 목록에서 같은 답을 내는지 확인한다. 안 같으면 계측이 다른 것을 잰 것이다. */
function assertAgree(p: number): void {
  const a = carryOps(p).answers;
  const b = segmentOps(p).answers;
  if (a.length !== b.length || a.some((v, k) => v !== b[k])) {
    throw new Error(`질의 ${p} 회에서 두 설계의 답이 다르다`);
  }
}

/** 본문 표가 쓰는 네 지점. 뒤집히는 자리를 앞뒤로 감싼다. */
const POINTS = [0, 17, 18, 1024];

for (const p of POINTS) assertAgree(p);

export const cases: Record<string, () => Record<string, number>> = {
  "날마다 이어받기 · 질의 0 회": () => ({ "기본 연산": carryOps(0).ops }),
  "날마다 이어받기 · 질의 17 회": () => ({ "기본 연산": carryOps(17).ops }),
  "날마다 이어받기 · 질의 18 회": () => ({ "기본 연산": carryOps(18).ops }),
  "날마다 이어받기 · 질의 1,024 회": () => ({
    "기본 연산": carryOps(1024).ops,
  }),
  "날마다 이어받기": () => ({ "저장 칸": 2 }),
  "세그먼트 트리 · 질의 0 회": () => ({ "기본 연산": segmentOps(0).ops }),
  "세그먼트 트리 · 질의 17 회": () => ({ "기본 연산": segmentOps(17).ops }),
  "세그먼트 트리 · 질의 18 회": () => ({ "기본 연산": segmentOps(18).ops }),
  "세그먼트 트리 · 질의 1,024 회": () => ({
    "기본 연산": segmentOps(1024).ops,
  }),
  "세그먼트 트리": () => ({ "저장 칸": 3 * 2 * N }),
};
