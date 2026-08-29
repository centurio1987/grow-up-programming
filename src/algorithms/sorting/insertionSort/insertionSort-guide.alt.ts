/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력**에 두 설계를 걸고 **결정론적 계수**만 센다. 벽시계·처리량은 실행마다 달라
 * "본문의 수치가 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run ../../../../tools/bench-alt.ts insertionSort-guide.alt.ts
 *
 * **입력 넷을 쓰는 이유**(L20). 전개가 쓰는 `[5 2 4 6 1 3]` 을 그대로 넣지만, 여섯 칸에서는
 * 두 설계의 계수가 한 자릿수 차이라 어느 쪽이 무엇을 내주는지가 안 갈린다. 그래서 같은
 * 길이 64 인 배열 세 벌을 **식으로** 만들어 함께 잰다. **난수를 쓰지 않으므로 시드가
 * 없다** — 아래 세 생성식이 입력의 전부이고, 그 식을 본문에도 적는다.
 *
 * 계수 둘의 정의를 여기서 못 박는다.
 *
 * - **견주기** — 배열의 두 값을 견준 횟수. 인덱스 판정(`j >= 0`·`t < N`)은 안 센다.
 * - **쓰기** — 배열 칸에 값을 적은 횟수. **처음 복사본을 만드는 `N` 칸은 빼고** 센다 —
 *   두 설계가 똑같이 한 번 복사하므로 그 칸은 대조에 아무것도 더하지 않는다.
 */

/** 전개가 쓰는 입력. */
export const SIX = [5, 2, 4, 6, 1, 3];

/** 칸 수. 64 로 둔 이유는 견주기 상한 `N(N−1)/2` 가 2,016 이라 손으로 대조되기 때문이다. */
const N = 64;

/** 이미 오름차순인 입력. `A[t] = t`, `t = 0 … 63`. 역순쌍 0 개. */
export const SORTED: number[] = Array.from({ length: N }, (_, t) => t);

/** 완전한 역순 입력. `A[t] = 63 − t`. 역순쌍 2,016 개로 가능한 최댓값이다. */
export const REVERSED: number[] = Array.from({ length: N }, (_, t) => N - 1 - t);

/**
 * 거의 정렬된 입력. `A[t] = t` 로 두고 `t = 0, 16, 32, 48` 에서 이웃 두 칸을 맞바꾼다.
 * 맞바꾼 쌍이 서로 떨어져 있어 역순쌍이 정확히 4 개다.
 */
export const NEARLY: number[] = (() => {
  const out = Array.from({ length: N }, (_, t) => t);
  for (let t = 0; t < N; t += 16) {
    const tmp = out[t] as number;
    out[t] = out[t + 1] as number;
    out[t + 1] = tmp;
  }
  return out;
})();

interface Counts {
  /** 배열의 두 값을 견준 횟수. */
  compares: number;
  /** 배열 칸에 값을 적은 횟수. 처음 복사본을 만드는 칸은 빼고 센다. */
  writes: number;
}

/**
 * 이 가이드가 가르치는 절차 — **삽입 정렬**. `insertionSort-guide.ref.ts` 와 같은 절차이고
 * 계수만 덧붙였다. 정렬된 구역을 오름차순으로 유지하면서 그 오른쪽 값 하나를 구역 안의
 * 제 자리에 넣는다.
 */
function insertionCounts(A: number[]): Counts {
  const c: Counts = { compares: 0, writes: 0 };
  const B = Array.from(A);

  for (let i = 1; i < B.length; i++) {
    const key = B[i] as number;
    let j = i - 1;
    while (j >= 0) {
      c.compares++;
      if ((B[j] as number) <= key) break;
      B[j + 1] = B[j] as number;
      c.writes++;
      j--;
    }
    B[j + 1] = key;
    c.writes++;
  }
  return c;
}

/**
 * 경쟁 설계 — **선택 정렬**.
 *
 * 같은 목표(정수 배열을 오름차순으로 정렬한 새 배열 돌려주기)를 노리고 절차가 다르다.
 * 왼쪽 구역을 「입력 전체에서 가장 작은 값들이 최종 자리에 놓인 구간」으로 유지한다 —
 * 삽입 정렬의 구역이 「앞쪽 `i` 개를 정렬해 둔 것」인 것과 다른 약속이다. 그래서 남은
 * 구간 전체를 봐야 최솟값이 정해지고, 자리를 찾은 값은 **맞바꿈 한 번**으로 간다.
 *
 * 맞바꿈에 `min !== k` 판정을 두었다 — 이미 제자리인 값을 자기 자신과 맞바꾸는 쓰기 두
 * 번은 어떤 구현도 하지 않는다. 그 판정을 빼면 선택 정렬의 쓰기가 실제보다 커진다.
 */
function selectionCounts(A: number[]): Counts {
  const c: Counts = { compares: 0, writes: 0 };
  const B = Array.from(A);

  for (let k = 0; k + 1 < B.length; k++) {
    let min = k;
    for (let t = k + 1; t < B.length; t++) {
      c.compares++;
      if ((B[t] as number) < (B[min] as number)) min = t;
    }
    if (min !== k) {
      const tmp = B[k] as number;
      B[k] = B[min] as number;
      B[min] = tmp;
      c.writes += 2;
    }
  }
  return c;
}

function counts(sort: (A: number[]) => Counts): Record<string, number> {
  return {
    "여섯 칸 입력 견주기": sort(SIX).compares,
    "여섯 칸 입력 쓰기": sort(SIX).writes,
    "이미 정렬된 입력 견주기": sort(SORTED).compares,
    "이미 정렬된 입력 쓰기": sort(SORTED).writes,
    "거의 정렬된 입력 견주기": sort(NEARLY).compares,
    "거의 정렬된 입력 쓰기": sort(NEARLY).writes,
    "역순 입력 견주기": sort(REVERSED).compares,
    "역순 입력 쓰기": sort(REVERSED).writes,
  };
}

export const cases = {
  "삽입 정렬": () => counts(insertionCounts),
  "선택 정렬": () => counts(selectionCounts),
};
