/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력**에 두 설계를 걸고 **결정론적 계수**만 센다. 벽시계·처리량은 실행마다 달라
 * "본문의 수치가 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/binary-search/parametricBinarySearch/parametricBinarySearch-guide.alt.ts
 *
 * **왜 전개 입력을 안 쓰는가**(L20). 전개는 `A = [7, 2, 5, 10, 8]`·`K = 2` 다섯 칸을 쓰는데,
 * 이 대조가 갈리는 축은 **`N` 과 값의 크기 중 어느 쪽이 큰가**이고 다섯 칸으로는 두 축을
 * 갈라 놓을 수 없다. 그래서 축마다 한 벌씩 두 입력을 규칙으로 만들어 쓴다.
 * **난수를 쓰지 않으므로 시드가 없다** — 아래 두 생성식이 입력의 전부이고, 그 식을 본문에도
 * 적는다. 둘 다 문제의 제약(`N ≤ 10^5` · `A[i] ≤ 10^6` · `1 ≤ K ≤ N`) 안에 있다.
 *
 * **계수 둘의 정의.**
 *
 * - `기본 단계` — 상수 시간이 드는 단위 작업의 횟수. 파라메트릭 쪽은 탐욕 순회가 원소 하나를
 *   보는 것이 한 단계이고, 동적 계획법 쪽은 분할점 하나를 시험하는 것이 한 단계다. 두 설계
 *   모두 한 단계가 덧셈·비교 몇 개로 끝난다.
 * - `잡는 배열 칸` — 입력 배열 밖에 새로 잡는 배열 칸의 총수. 스칼라 변수는 세지 않는다.
 */

/** `N` 이 작고 값이 큰 입력. `A[i] = 10^6 − i`, `i = 0 … 5`. */
export const SMALL: number[] = Array.from(
  { length: 6 },
  (_, i) => 1_000_000 - i,
);
/** `SMALL` 에 거는 묶음 수. */
export const SMALL_K = 3;

/** `N` 이 크고 값이 작은 입력. `A[i] = (37i mod 1000) + 1`, `i = 0 … 299`. */
export const LARGE: number[] = Array.from(
  { length: 300 },
  (_, i) => ((i * 37) % 1000) + 1,
);
/** `LARGE` 에 거는 묶음 수. */
export const LARGE_K = 30;

interface Tally {
  answer: number;
  steps: number;
  slots: number;
}

/**
 * 이 가이드의 설계 — 답 후보 구간에 이분 탐색을 걸고, 후보값 하나를 탐욕 순회로 판정한다.
 * 절차는 `.ref.ts` 와 같고 계수만 덧붙인다.
 */
function parametric(A: number[], K: number): Tally {
  let steps = 0;
  const judge = (m: number): boolean => {
    let count = 1;
    let accSum = 0;
    for (const x of A) {
      steps++;
      if (accSum + x > m) {
        count++;
        accSum = 0;
      }
      accSum += x;
    }
    return count <= K;
  };

  let lo = 0;
  let hi = 0;
  for (const x of A) {
    if (x > lo) lo = x;
    hi += x;
  }
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (judge(mid)) hi = mid - 1;
    else lo = mid + 1;
  }
  // 스칼라 다섯 개(lo · hi · mid · count · accSum)뿐이라 새로 잡는 배열 칸이 없다.
  return { answer: lo, steps, slots: 0 };
}

/**
 * 경쟁 설계 — **동적 계획법**.
 *
 * 같은 목표(연속 묶음 `K` 개로 나눌 때의 최소 최대합)를 노리고 절차가 다르다. 답을 후보로
 * 두고 되묻지 않고, 앞 `i` 칸을 `j` 묶음으로 나눈 최적값을 표로 채워 올라간다.
 *
 *   dp[j][i] = min over k < i of  max( dp[j-1][k],  A[k] + … + A[i-1] )
 *
 * 판정 함수가 필요 없으므로 **값의 크기와 무관**하고, 원소에 음수가 섞여도 그대로 성립한다.
 * 대신 분할점을 전부 시험하므로 단계 수가 `N` 에 제곱으로 붙는다.
 */
function dynamicProgramming(A: number[], K: number): Tally {
  const N = A.length;
  let steps = 0;

  const prefix = new Array<number>(N + 1).fill(0);
  for (let i = 0; i < N; i++) {
    prefix[i + 1] = (prefix[i] as number) + (A[i] as number);
  }

  let prev = new Array<number>(N + 1).fill(Number.POSITIVE_INFINITY);
  prev[0] = 0;
  let slots = 2 * (N + 1);

  for (let j = 1; j <= K; j++) {
    const cur = new Array<number>(N + 1).fill(Number.POSITIVE_INFINITY);
    slots += N + 1;
    for (let i = 1; i <= N; i++) {
      for (let k = j - 1; k < i; k++) {
        steps++;
        const segment = (prefix[i] as number) - (prefix[k] as number);
        const worst = Math.max(prev[k] as number, segment);
        if (worst < (cur[i] as number)) cur[i] = worst;
      }
    }
    prev = cur;
  }

  // 한 줄씩 버리며 채우면 `prev`·`cur`·`prefix` 세 벌만 살아 있지만, 잡은 칸은 전부 센다.
  return { answer: prev[N] as number, steps, slots };
}

/** 두 설계가 같은 답을 내지 않으면 대조 자체가 성립하지 않는다. */
function counts(
  solve: (A: number[], K: number) => Tally,
): Record<string, number> {
  const small = solve(SMALL, SMALL_K);
  const large = solve(LARGE, LARGE_K);
  const want = {
    small: parametric(SMALL, SMALL_K).answer,
    large: parametric(LARGE, LARGE_K).answer,
  };
  if (small.answer !== want.small || large.answer !== want.large) {
    throw new Error(
      `두 설계의 답이 다르다 — 작은 입력 ${small.answer} vs ${want.small}, 큰 입력 ${large.answer} vs ${want.large}`,
    );
  }
  return {
    "작은 입력 기본 단계": small.steps,
    "작은 입력 잡는 배열 칸": small.slots,
    "큰 입력 기본 단계": large.steps,
    "큰 입력 잡는 배열 칸": large.slots,
  };
}

export const cases = {
  "파라메트릭 이분 탐색": () => counts(parametric),
  "동적 계획법": () => counts(dynamicProgramming),
};
