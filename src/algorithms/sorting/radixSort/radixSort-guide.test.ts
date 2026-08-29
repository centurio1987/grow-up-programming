/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/sorting/radixSort/radixSort.test.ts` 는 학습자가 채우는 파일을
 * 가져오므로 그대로 재사용하지 않는다. **케이스만** 옮겨 정본에 다시 건다.
 * 벽시계를 재는 성능 케이스(`N=100,000` 을 100ms 이내)는 옮기지 않았다 — 실행마다 값이
 * 달라 판정이 안 된다. 그 자리는 「제약 상한 크기의 입력에서 값이 정확하고 다중집합이
 * 보존되는가」로 바꿔 두었고, 입력도 난수 대신 생성식으로 만든다.
 */
import { expect, test } from "bun:test";
import { radixSort } from "./radixSort-guide.ref.ts";

const CASES: [number[], number[]][] = [
  // 기본 동작
  [
    [170, 45, 75, 90, 802, 24, 2, 66],
    [2, 24, 45, 66, 75, 90, 170, 802],
  ],
  [
    [1, 10, 100, 1000],
    [1, 10, 100, 1000],
  ],
  [
    [5, 4, 3, 2, 1],
    [1, 2, 3, 4, 5],
  ],
  // 엣지 케이스
  [
    [12, 12, 1, 1, 100, 100],
    [1, 1, 12, 12, 100, 100],
  ],
  [
    [0, 10, 0, 1],
    [0, 0, 1, 10],
  ],
  [
    [321, 213, 132, 123],
    [123, 132, 213, 321],
  ],
  // 바운더리
  [[12345], [12345]],
  [
    [1_000_000_000, 0, 999_999_999, 1],
    [0, 1, 999_999_999, 1_000_000_000],
  ],
  // 문제 문서가 명시한 빈 입력과 값이 전부 0 인 입력. 둘 다 바퀴가 한 번도 실행되지 않는다.
  [[], []],
  [
    [0, 0, 0],
    [0, 0, 0],
  ],
  // 전개가 쓰는 입력.
  [
    [513, 45, 258, 2, 66, 90, 301],
    [2, 45, 66, 90, 258, 301, 513],
  ],
];

for (const [input, want] of CASES) {
  test(`정본 — ${JSON.stringify(input)}`, () => {
    expect(radixSort(input)).toEqual(want);
  });
}

test("입력 배열을 바꾸지 않고 다른 배열을 돌려준다", () => {
  // 문제의 계약이다 — 「`A` 의 모든 원소를 오름차순으로 정렬한 새 배열」을 반환한다.
  const A = [513, 45, 258, 2, 66, 90, 301];
  const before = [...A];
  const out = radixSort(A);
  expect(A).toEqual(before);
  expect(out).not.toBe(A);

  // 바퀴가 한 번도 실행되지 않는 입력에서도 같다.
  const zeros = [0, 0, 0];
  expect(radixSort(zeros)).not.toBe(zeros);
  const empty: number[] = [];
  expect(radixSort(empty)).not.toBe(empty);
});

test("같은 값끼리의 앞뒤가 유지된다", () => {
  // 안정성이 이 절차의 성립 근거다. 값이 같으면 결과에서 구별할 수 없으므로, 값에 자리
  // 번호를 실어(`값 × 1000 + 자리`) 같은 자리 값을 가진 원소들의 앞뒤를 확인한다.
  const keys = [513, 45, 258, 2, 66, 90, 301];
  const tagged = keys.map((v, t) => v * 1000 + t);
  const out = radixSort(tagged);

  // 키가 오름차순이고, 키가 같은 자리에서는 원래 앞뒤가 남는다.
  for (let t = 1; t < out.length; t++) {
    expect(out[t] as number).toBeGreaterThan(out[t - 1] as number);
  }
  expect(out.map((x) => Math.floor(x / 1000))).toEqual([
    2, 45, 66, 90, 258, 301, 513,
  ]);
});

test("제약 상한 크기의 입력에서도 값이 정확하다", () => {
  // 성능이 아니라 정확성을 본다. 벽시계는 실행마다 달라 판정에 쓰지 않고, 입력도 난수 대신
  // 생성식으로 만들어 실행마다 같은 배열이 되게 한다.
  const N = 100_000;
  const A = Array.from({ length: N }, (_, t) => (t * 999_983) % 1_000_000_001);

  const out = radixSort(A);
  expect(out.length).toBe(N);
  for (let t = 1; t < N; t++) {
    expect(out[t] as number).toBeGreaterThanOrEqual(out[t - 1] as number);
  }

  // 다중집합이 보존되는가 — 값마다의 개수가 입력과 같아야 한다.
  expect([...out].sort((a, b) => a - b)).toEqual([...A].sort((a, b) => a - b));
});

test("값의 상한 10^9 이 자기 자리를 갖는다", () => {
  // 바퀴 수를 최댓값에서 정하므로 10^9 은 256 진법 네 자리다. 바퀴를 셋으로 끊으면 여기서
  // 걸린다.
  const A = [1_000_000_000, 16_777_215, 16_777_216, 0];
  expect(radixSort(A)).toEqual([0, 16_777_215, 16_777_216, 1_000_000_000]);
});
