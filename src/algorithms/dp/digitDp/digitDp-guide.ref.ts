/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/dp/digitDp/digitDp.ts` 가 요구하는 것과 **같은 계약**이다 — 상한 `N`
 * 과 목표 합 `K` 를 받아, `1` 이상 `N` 이하의 정수 중 십진 자릿수의 합이 정확히 `K` 인 것의
 * 개수를 돌려준다. 가이드 본문의 코드는 이 파일에서 옮긴다.
 *
 * **자리 이름은 본문 기호표와 글자까지 같다.**
 *
 * | 이름 | 무엇 |
 * | --- | --- |
 * | `digits` | `N` 의 십진 자릿수를 왼쪽부터 담은 배열 |
 * | `L` | 그 배열의 길이 — `N` 의 자릿수 개수 |
 * | `pos` | 지금 숫자를 정하는 자리 (0 이 맨 왼쪽) |
 * | `sum` | `pos` 앞에서 이미 정한 숫자들의 합 |
 * | `tight` | 여기까지 고른 숫자가 `N` 의 같은 자리와 전부 같은가 |
 * | `memo` | `tight` 가 아닌 상태의 값을 적어 두는 표 |
 *
 * `memo` 는 언제나 `memo[pos][sum]` 로 읽는다 — `tight` 는 첨자가 아니다.
 */

/**
 * `1` 이상 `N` 이하의 정수 중 십진 자릿수 합이 `K` 인 것의 개수.
 *
 * `N` 을 자릿수로 가른 뒤 맨 왼쪽 자리부터 숫자를 하나씩 정한다. `tight` 는 여기까지 고른
 * 숫자가 `N` 의 앞부분과 전부 같은지를 뜻하고, 그 한 값이 이번 자리의 상한을 `digits[pos]`
 * 로 할지 `9` 로 할지 정한다.
 */
export function digitDp(N: number, K: number): number {
  const digits = [...String(N)].map(Number);
  const L = digits.length;

  // memo[pos][sum] = tight 가 아닌 상태로 자리 pos 에 왔을 때의 답. -1 은 아직 안 정한 칸이다.
  const memo: number[][] = Array.from({ length: L }, () =>
    new Array<number>(K + 1).fill(-1),
  );

  function count(pos: number, sum: number, tight: boolean): number {
    // ① 남은 자리를 전부 9 로 채워도 합이 K 에 못 미친다.
    if (sum + 9 * (L - pos) < K) return 0;
    // ② 자리를 다 정했다 — 합이 K 인 것만 하나로 센다.
    if (pos === L) return sum === K ? 1 : 0;
    // ③ 자유 상태이고 그 칸을 이미 정해 두었다.
    if (!tight) {
      const done = (memo[pos] as number[])[sum] as number;
      if (done !== -1) return done;
    }

    const limit = tight ? (digits[pos] as number) : 9;
    let total = 0;
    for (let x = 0; x <= limit; x++) {
      // ④ 합이 K 를 넘었다. x 가 커지면 더 넘으므로 이 자리에서 멈춘다.
      if (sum + x > K) break;
      total += count(pos + 1, sum + x, tight && x === (digits[pos] as number));
    }

    // ⑤ 자유 상태의 값만 표에 적는다.
    if (!tight) (memo[pos] as number[])[sum] = total;
    return total;
  }

  // ⑥ 수 0 은 [1, N] 밖인데 count 가 그것을 한 번 센다. 자릿수 합이 0 인 수는 0 뿐이다.
  return count(0, 0, true) - (K === 0 ? 1 : 0);
}
