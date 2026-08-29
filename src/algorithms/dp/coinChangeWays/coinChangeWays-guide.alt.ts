/**
 * `purpose.alt` 의 수치 — L13. 같은 전이식을 **어느 순서로 계산하느냐**가 다른 두 설계를
 * 같은 입력에 걸고 계수를 센다.
 *
 * 대조 상대는 **하향식 메모이제이션**이다. 전이식은 이 가이드와 글자 그대로 같고, 다른 것은
 * 「표를 전부 채우고 마지막 칸을 읽는가」와 「필요한 칸을 답에서부터 거슬러 채우는가」다.
 * 그래서 **어느 쪽을 고르는지가 도달 가능한 칸의 비율에 달려 있다** — 대조가 성립하는 자리다.
 *
 * 계수 둘. **값을 정한 칸**은 두 설계가 실제로 채운 `(i, a)` 칸 수이고, **최대 깊이**는
 * 하향식이 답 하나를 얻기까지 쌓아 둬야 하는 미해결 칸의 최대 개수다. 재귀로 적으면 그것이
 * 그대로 호출 스택의 깊이가 된다. 둘 다 실행마다 같은 값이 나온다.
 *
 * **왜 전개 입력을 안 쓰는가**(L20). 전개는 `coins = [1, 2, 5]` · `amount = 5` 인데, 그
 * 크기에서는 값을 정한 칸이 24 대 16 이라 두 설계가 갈리지 않는다. 여기서는 **동전 종류 수 3 과
 * 액면가 `[1, 2, 5]` 를 그대로 두고 금액만 제약 상단 `10^4` 로 올린 것**을 입력 A 로 쓰고,
 * 액면가만 금액에 가깝게 키운 것을 입력 B 로 쓴다. 두 입력의 차이는 액면가 하나뿐이다.
 */
import type { BenchCase } from "../../../../tools/bench-alt.ts";

/** 입력 A — 전개와 같은 액면가, 금액만 제약 상단. */
const A = { coins: [1, 2, 5], amount: 10_000 };
/** 입력 B — 종류 수와 금액은 그대로, 액면가만 금액에 가깝게. */
const B = { coins: [3000, 5000, 7000], amount: 10_000 };

/** 상향식 표 — 이 가이드의 절차. `(n+1)(amount+1)` 칸을 언제나 전부 정한다. */
function bottomUp(input: { coins: number[]; amount: number }) {
  const { coins, amount } = input;
  const n = coins.length;
  let cells = 0;
  let prev = new Array<number>(amount + 1).fill(0);
  prev[0] = 1;
  cells += amount + 1; // 0 번째 줄
  for (let i = 1; i <= n; i++) {
    const c = coins[i - 1] as number;
    const cur = new Array<number>(amount + 1).fill(0);
    for (let a = 0; a <= amount; a++) {
      cells++;
      if (a < c) cur[a] = prev[a] as number;
      else cur[a] = (prev[a] as number) + (cur[a - c] as number);
    }
    prev = cur;
  }
  // 재귀가 없으므로 쌓아 두는 칸이 없다.
  return { "값을 정한 칸": cells, "최대 깊이": 0 };
}

/**
 * 하향식 메모이제이션 — 같은 전이식을 답 `(n, amount)` 에서부터 거슬러 채운다.
 *
 * 재귀 대신 명시적 스택으로 적었다. 액면가에 1 이 있으면 깊이가 `amount` 에 이르러 호출
 * 스택으로는 끝까지 못 가기 때문이고, 스택 길이를 세는 것이 여기서 재는 계수 자체다.
 */
function topDown(input: { coins: number[]; amount: number }) {
  const { coins, amount } = input;
  const n = coins.length;
  const memo = new Map<number, number>();
  const key = (i: number, a: number): number => i * (amount + 1) + a;

  let maxDepth = 0;
  const stack: { i: number; a: number }[] = [{ i: n, a: amount }];
  while (stack.length > 0) {
    maxDepth = Math.max(maxDepth, stack.length);
    const top = stack[stack.length - 1] as { i: number; a: number };
    const { i, a } = top;
    if (memo.has(key(i, a))) {
      stack.pop();
      continue;
    }
    if (a === 0) {
      memo.set(key(i, a), 1);
      stack.pop();
      continue;
    }
    if (i === 0) {
      memo.set(key(i, a), 0);
      stack.pop();
      continue;
    }
    const c = coins[i - 1] as number;
    const up = memo.get(key(i - 1, a));
    if (up === undefined) {
      stack.push({ i: i - 1, a });
      continue;
    }
    if (a < c) {
      memo.set(key(i, a), up);
      stack.pop();
      continue;
    }
    const left = memo.get(key(i, a - c));
    if (left === undefined) {
      stack.push({ i, a: a - c });
      continue;
    }
    memo.set(key(i, a), up + left);
    stack.pop();
  }
  return { "값을 정한 칸": memo.size, "최대 깊이": maxDepth };
}

export const cases: Record<string, BenchCase> = {
  "상향식 표 (이 가이드) · 액면가 [1,2,5]": () => bottomUp(A),
  "하향식 메모 · 액면가 [1,2,5]": () => topDown(A),
  "상향식 표 (이 가이드) · 액면가 [3000,5000,7000]": () => bottomUp(B),
  "하향식 메모 · 액면가 [3000,5000,7000]": () => topDown(B),
};
