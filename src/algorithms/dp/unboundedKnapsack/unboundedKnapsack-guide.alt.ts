/**
 * `purpose.alt` 의 수치 — L13. 같은 답을 **전혀 다른 방식으로** 내는 두 설계를 같은 입력에
 * 걸고 계수를 센다.
 *
 * 대조 상대는 **분기 한정 탐색**이다. 액면가를 큰 것부터 정렬해 두고 「이 액면가를 몇 개 쓸
 * 것인가」를 깊이 우선으로 정하되, 지금까지 찾은 최소 개수(`best`)보다 나아질 수 없는 가지를
 * 잘라 낸다. 남은 금액을 `rest`, 지금 보는 액면가를 `c` 라 하면 앞으로 필요한 동전이 적어도
 * `ceil(rest / c)` 개라, `count + ceil(rest / c) >= best` 면 그 아래를 보지 않는다.
 *
 * 표를 안 만들어 저장 칸이 액면가 종류 수 규모로 끝나는 대신, **자를 기준이 되는 첫 답을
 * 못 찾으면 아무것도 못 자른다.** 그래서 「답이 있는가」가 채택을 가른다 — 대조가 성립하는
 * 자리다.
 *
 * 계수 둘. **기본 연산**은 표 쪽에서 값을 정한 칸 하나당 1, 분기 한정 쪽에서 재귀 호출
 * 하나당 1 · 개수를 하나 정해 보는 바퀴마다 1 이다. **새로 잡는 칸**은 두 설계가 실제로 들고
 * 있어야 하는 칸 수 — 표는 `(n+1)(amount+1)`, 분기 한정은 정렬한 액면가 배열 `n` 칸에 실제로
 * 가장 깊었던 재귀 프레임 수를 더한 것이다. 둘 다 실행마다 같은 값이다.
 *
 * **왜 전개 입력을 안 쓰는가**(L20). 전개는 `coins = [3, 4, 1]` · `amount = 6` 인데, 그
 * 크기에서는 기본 연산이 28 대 19 라 1.5 배 차이뿐이고 어느 쪽이 왜 적은지가 값에서 나오지
 * 않는다. 여기서는 **액면가를 `[4, 6]` 으로 고정하고 금액만 1 씩 바꾼다** — 둘 다 짝수라
 * 만들 수 있는 금액이 짝수뿐이고, 그래서 금액 하나로 「답이 있는 경우」와 「없는 경우」가
 * 갈린다. 다른 것은 아무것도 안 바꾸므로 뒤집히는 원인이 금액의 홀짝 하나로 좁혀진다.
 */
import type { BenchCase } from "../../../../tools/bench-alt.ts";
import { unboundedKnapsack } from "./unboundedKnapsack-guide.ref.ts";

interface Input {
  coins: number[];
  amount: number;
}

/** 입력 A — 답이 있는 쪽. `6 × 1,666 = 9,996`. */
const A: Input = { coins: [4, 6], amount: 9_996 };
/** 입력 B — 답이 없는 쪽. 홀수라 짝수 액면가로 만들 수 없다. */
const B: Input = { coins: [4, 6], amount: 9_997 };
/** 경계를 다른 규모에서 한 번 더 — 같은 액면가에 금액만 1 다르다. */
const C: Input = { coins: [4, 6], amount: 1_000 };
const D: Input = { coins: [4, 6], amount: 999 };

/** 표 채우기 — 이 가이드의 절차. `(n+1)(amount+1)` 칸을 언제나 전부 정한다. */
function fillTable(input: Input): Record<string, number> {
  const { coins, amount } = input;
  const n = coins.length;
  let ops = 0;
  let prev = new Array<number>(amount + 1).fill(Number.POSITIVE_INFINITY);
  prev[0] = 0;
  ops += amount + 1; // 0 번째 줄
  for (let i = 1; i <= n; i++) {
    const c = coins[i - 1] as number;
    const cur = new Array<number>(amount + 1).fill(Number.POSITIVE_INFINITY);
    for (let a = 0; a <= amount; a++) {
      ops++;
      if (a < c) cur[a] = prev[a] as number;
      else {
        const skip = prev[a] as number;
        const take = (cur[a - c] as number) + 1;
        cur[a] = skip <= take ? skip : take;
      }
    }
    prev = cur;
  }
  return { "기본 연산": ops, "새로 잡는 칸": (n + 1) * (amount + 1) };
}

/**
 * 분기 한정 탐색 — 액면가를 큰 것부터 두고 개수를 깊이 우선으로 정한다.
 *
 * `best` 가 아직 무한이면 `count + ceil(rest / c) >= best` 가 한 번도 참이 되지 않아
 * 가지치기가 실행되지 않는다. 답이 없는 입력이 그 상태다.
 */
function branchAndBound(input: Input): Record<string, number> {
  const cs = [...new Set(input.coins)].sort((a, b) => b - a);
  let best = Number.POSITIVE_INFINITY;
  let ops = 0;
  let deepest = 0;

  const dfs = (idx: number, rest: number, count: number): void => {
    ops++;
    if (idx + 1 > deepest) deepest = idx + 1;
    if (rest === 0) {
      if (count < best) best = count;
      return;
    }
    if (idx === cs.length) return;
    const c = cs[idx] as number;
    if (count + Math.ceil(rest / c) >= best) return;
    for (let k = Math.floor(rest / c); k >= 0; k--) {
      ops++;
      dfs(idx + 1, rest - k * c, count + k);
    }
  };
  dfs(0, input.amount, 0);

  return { "기본 연산": ops, "새로 잡는 칸": cs.length + deepest };
}

// 두 설계가 같은 답을 내야 대조가 대조다. 다르면 여기서 실패한다.
for (const [name, input] of [
  ["A", A],
  ["B", B],
  ["C", C],
  ["D", D],
] as [string, Input][]) {
  const cs = [...new Set(input.coins)].sort((a, b) => b - a);
  let best = Number.POSITIVE_INFINITY;
  const walk = (idx: number, rest: number, count: number): void => {
    if (rest === 0) {
      if (count < best) best = count;
      return;
    }
    if (idx === cs.length) return;
    const c = cs[idx] as number;
    for (let k = Math.floor(rest / c); k >= 0; k--)
      walk(idx + 1, rest - k * c, count + k);
  };
  walk(0, input.amount, 0);
  const bnb = Number.isFinite(best) ? best : -1;
  if (bnb !== unboundedKnapsack(input.coins, input.amount)) {
    throw new Error(
      `입력 ${name} 에서 두 설계의 답이 다르다 — 대조가 성립하지 않는다`,
    );
  }
}

/** 경계 행은 기본 연산 하나만 낸다 — 잡는 칸까지 실으면 본문 표가 재는 것을 덮는다. */
const opsOnly = (r: Record<string, number>): Record<string, number> => ({
  "기본 연산": r["기본 연산"] as number,
});

export const cases: Record<string, BenchCase> = {
  "표 채우기 (이 가이드) · 입력 A": () => fillTable(A),
  "분기 한정 · 입력 A": () => branchAndBound(A),
  "표 채우기 (이 가이드) · 입력 B": () => fillTable(B),
  "분기 한정 · 입력 B": () => branchAndBound(B),
  "표 채우기 (이 가이드) · 경계 금액 1,000": () => opsOnly(fillTable(C)),
  "분기 한정 · 경계 금액 1,000": () => opsOnly(branchAndBound(C)),
  "표 채우기 (이 가이드) · 경계 금액 999": () => opsOnly(fillTable(D)),
  "분기 한정 · 경계 금액 999": () => opsOnly(branchAndBound(D)),
};
