/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/advanced/convexHullTrick/convexHullTrick.ts` 가 요구하는 것과 **같은
 * 계약**이다 — 기울기가 비감소 순서로 들어오는 직선 `y = m·x + b` 를 등록하고, 임의의 `x`
 * 에서 등록된 모든 직선의 최솟값을 돌려준다. 가이드 본문의 코드는 이 파일에서 옮긴다.
 *
 * **자리 이름은 본문 기호표와 글자까지 같다.**
 *
 * | 이름 | 무엇 |
 * | --- | --- |
 * | `hull` | 살아남은 직선을 기울기 오름차순으로 담은 배열 |
 * | `m` · `b` | 직선의 기울기와 y 절편 |
 * | `x` | 최솟값을 묻는 자리 |
 * | `lo` · `hi` | 이진 탐색이 아직 후보로 두고 있는 `hull` 의 자리 범위 |
 *
 * **정확한 범위를 여기 적어 둔다.** 이 코드는 `number`(배정밀도) 하나로 계산하므로,
 * `m·x + b` 와 `isCovered` 안의 두 곱이 모두 절댓값 `2^53 = 9,007,199,254,740,992` 미만인
 * 동안만 정확하다. 문제의 제약 상한(`|b| ≤ 10^18` · `|m·x| ≤ 10^18`)은 그 범위 밖이고,
 * 본문의 「멈춤 — 제약이 허용하는 값에서 배정밀도가 답을 어긋나게 한다」가 그 경계를 값으로
 * 낸다.
 */

/** 직선 하나. `y = m·x + b`. */
export type Line = { m: number; b: number };

/** 직선 하나를 `x` 에서 계산한 값. */
export function evalAt(line: Line, x: number): number {
  return line.m * x + line.b;
}

/**
 * 가운데 직선 `l2` 의 담당 구간이 비었는가 — 기울기가 `l1.m < l2.m < l3.m` 일 때만 뜻이 있다.
 *
 * 교점을 나눗셈으로 구해 견주면 실수가 되고 기울기가 같을 때 0 으로 나눈다. 양변에 양수
 * `(l2.m − l3.m)(l1.m − l2.m)` 를 곱해 **부등호 방향을 유지한 채** 정수 곱 두 개의 대소로
 * 바꾼 것이 아래 식이다. 유도는 본문 「수식 정의와 유도」에 있다.
 */
export function isCovered(l1: Line, l2: Line, l3: Line): boolean {
  return (l3.b - l2.b) * (l1.m - l2.m) >= (l2.b - l1.b) * (l2.m - l3.m);
}

/**
 * 기울기가 비감소 순서로 들어오는 직선 집합에서 임의의 `x` 의 최솟값을 답하는 자료구조.
 *
 * `hull` 에는 「어떤 `x` 에서 자기 혼자 최솟값을 내는 구간」을 가진 직선만 남는다. 그 구간은
 * 자리가 뒤로 갈수록 왼쪽으로 가므로, 한 `x` 에서 `hull` 을 자리 순서로 계산한 값들은 한 번
 * 내려갔다 올라가는 모양이 되고 이진 탐색으로 가장 낮은 자리를 찾을 수 있다.
 */
export class ConvexHullTrick {
  readonly hull: Line[] = [];

  addLine(m: number, b: number): void {
    const line: Line = { m, b };
    const top = this.hull[this.hull.length - 1];
    if (top !== undefined && top.m === m) {
      // ① 기울기가 같고 절편이 더 크거나 같으면 새 직선은 어디서도 최솟값이 아니다.
      if (top.b <= b) return;
      // ② 절편이 더 작으면 꼭대기를 버린다. hull 에 같은 기울기는 하나뿐이라 한 번이면 된다.
      this.hull.pop();
    }
    /** 꼭대기가 담당 구간을 잃었는가. 껍질에 직선이 둘 미만이면 물을 것이 없다. */
    const topCovered = (): boolean =>
      this.hull.length >= 2 &&
      isCovered(
        this.hull[this.hull.length - 2] as Line,
        this.hull[this.hull.length - 1] as Line,
        line,
      );
    // ③ 담당 구간을 잃은 꼭대기를 버린다. 하나를 버리면 그 아래가 새 꼭대기라 다시 본다.
    while (topCovered()) this.hull.pop();
    // ④ 새 직선은 기울기가 가장 크므로 언제나 뒤에 붙는다.
    this.hull.push(line);
  }

  query(x: number): number {
    let lo = 0;
    let hi = this.hull.length - 1;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      const here = evalAt(this.hull[mid] as Line, x);
      const next = evalAt(this.hull[mid + 1] as Line, x);
      // ⑤ 오른쪽 이웃이 더 크지 않다 — 가장 낮은 자리는 mid 이거나 그 왼쪽이다.
      if (here <= next) hi = mid;
      // ⑥ 오른쪽 이웃이 더 작다 — mid 까지는 후보에서 뺀다.
      else lo = mid + 1;
    }
    // ⑦ lo 와 hi 가 만난 자리가 이 x 에서 최솟값을 내는 직선이다.
    return evalAt(this.hull[lo] as Line, x);
  }
}
