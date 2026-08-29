/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력**에 두 설계를 걸고 **결정론적 계수**만 센다. 벽시계·처리량은 실행마다 달라
 * "본문의 수치가 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run ../../../../tools/bench-alt.ts nQueens-guide.alt.ts
 *
 * **왜 전개 입력을 안 쓰는가**(L20). `N` 을 전개의 `4` 로 바꿔 돌리면 방문 노드가 17 대 13,
 * 상태 연산이 228 대 127 이다. 네 노드 차이가 절차의 성질에서 온 것인지 판이 작아서 그런
 * 것인지 갈리지 않는다. 그래서 대조만 `n = 8` 을 쓰고, 그 사실을 본문에도 적는다.
 *
 * **`n = 8` 은 이 가이드에 불리한 쪽이다** — `n` 이 커질수록 앞을 내다보는 검사의 노드 절감이
 * 커진다. 수치가 마음에 드는 쪽으로 입력을 고르지 않는다(L20).
 */

/** 두 설계가 나눠 쓰는 고정 입력. 한 번 정하면 바꾸지 않는다. */
export const N = 8;

interface Counts {
  "방문 노드": number;
  "상태 연산": number;
  "새로 잡는 칸": number;
}

/**
 * 이 가이드의 절차. 정본(`nQueens-guide.ref.ts`)과 같은 절차이고 세는 것만 덧붙였다.
 *
 * `상태 연산` 은 비트를 읽거나 쓴 횟수다 — 열 후보 하나마다 검사 세 번, 실제로 놓을 때
 * 설정 세 번. 새로 잡는 칸은 없다(정수 셋을 인자로 넘긴다).
 */
function 가이드절차(n: number): Counts {
  let 방문노드 = 0;
  let 상태연산 = 0;
  const go = (row: number, cols: number, d1m: number, d2m: number): void => {
    방문노드++;
    if (row === n) return;
    for (let c = 0; c < n; c++) {
      const d1 = row - c + (n - 1);
      const d2 = row + c;
      상태연산 += 3;
      if (
        ((cols >> c) & 1) === 1 ||
        ((d1m >> d1) & 1) === 1 ||
        ((d2m >> d2) & 1) === 1
      ) {
        continue;
      }
      상태연산 += 3;
      go(row + 1, cols | (1 << c), d1m | (1 << d1), d2m | (1 << d2));
    }
  };
  go(0, 0, 0, 0);
  return { "방문 노드": 방문노드, "상태 연산": 상태연산, "새로 잡는 칸": 0 };
}

/**
 * 경쟁 설계 — **앞을 내다보는 검사**(forward checking).
 *
 * 퀸을 놓을 때마다 **아직 안 채운 모든 행**의 후보 열에서 그 열·두 대각선을 지운다. 후보가
 * 하나도 안 남는 행이 생기면 그 행까지 내려가기 전에 이 자리에서 가지를 접는다. 노드를 줄이는
 * 대신 행마다 후보 목록을 들고 다녀야 해서 재귀 한 단마다 새 배열을 잡는다.
 */
function 앞을내다보는검사(n: number): Counts {
  let 방문노드 = 0;
  let 상태연산 = 0;
  let 새칸 = 0;
  const full = (1 << n) - 1;

  const go = (row: number, dom: number[]): void => {
    방문노드++;
    if (row === n) return;
    let avail = dom[row] as number;
    상태연산 += 1;
    while (avail !== 0) {
      const bit = avail & -avail;
      avail ^= bit;

      // 남은 행들의 후보를 줄인 사본. 이 복사가 이 설계가 내주는 것이다.
      const next = dom.slice();
      새칸 += n;
      상태연산 += n;

      let 막힘 = false;
      for (let r = row + 1; r < n; r++) {
        상태연산 += 2;
        const k = r - row;
        const d =
          (next[r] as number) & ~bit & ~((bit << k) & full) & ~(bit >> k);
        next[r] = d;
        if (d === 0) {
          막힘 = true;
          break;
        }
      }
      if (막힘) continue;
      go(row + 1, next);
    }
  };

  go(
    0,
    Array.from({ length: n }, () => full),
  );
  return {
    "방문 노드": 방문노드,
    "상태 연산": 상태연산,
    "새로 잡는 칸": 새칸,
  };
}

export const cases = {
  "이 가이드의 절차": () => 가이드절차(N) as unknown as Record<string, number>,
  "앞을 내다보는 검사": () =>
    앞을내다보는검사(N) as unknown as Record<string, number>,
};
