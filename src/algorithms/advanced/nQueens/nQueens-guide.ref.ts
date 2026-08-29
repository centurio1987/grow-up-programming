/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/advanced/nQueens/nQueens.ts` 가 요구하는 것과 **같은 계약**이다 —
 * `n` 을 받아 서로 공격하지 않는 배치의 수를 돌려준다. 가이드 본문의 코드는 이 파일에서 옮긴다.
 */

/**
 * `n × n` 판에 퀸 `n` 개를 서로 공격하지 않게 놓는 배치의 수.
 *
 * 행마다 정확히 하나를 놓고, 열과 두 대각선을 정수 세 개의 비트로 기억한다.
 */
export function nQueens(n: number): number {
  let count = 0;

  function place(
    row: number,
    cols: number,
    diag1: number,
    diag2: number,
  ): void {
    if (row === n) {
      // ① 행을 전부 채웠다 — 배치 하나가 완성됐다.
      count++;
      return;
    }

    for (let c = 0; c < n; c++) {
      // `\` 대각선과 `/` 대각선의 번호. 음수가 안 되게 n-1 을 더한다.
      const d1 = row - c + (n - 1);
      const d2 = row + c;

      if (
        ((cols >> c) & 1) === 1 ||
        ((diag1 >> d1) & 1) === 1 ||
        ((diag2 >> d2) & 1) === 1
      ) {
        // ② 열이나 대각선 중 하나가 이미 쓰였다 — 이 열은 건너뛴다.
        continue;
      }

      // ③ 놓는다 — 세 비트를 켜고 다음 행으로 내려간다.
      cols |= 1 << c;
      diag1 |= 1 << d1;
      diag2 |= 1 << d2;

      place(row + 1, cols, diag1, diag2);

      // 돌아왔으면 켠 비트를 그대로 끈다. 다음 열 후보가 이 행을 비어 있는 것으로 봐야 한다.
      cols ^= 1 << c;
      diag1 ^= 1 << d1;
      diag2 ^= 1 << d2;
    }
  }

  place(0, 0, 0, 0);
  return count;
}
