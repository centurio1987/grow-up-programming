/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력·같은 창 크기**에 두 설계를 걸고 **결정론적 계수**만 센다. 세는 것은 **자료
 * 접근 수**(읽기 + 쓰기)다. 벽시계·처리량은 실행마다 달라 「본문의 수치가 실측과 같은가」
 * (P10)를 정의할 수 없다.
 *
 *   bun run ../../../../tools/bench-alt.ts slidingWindowMaximum-guide.alt.ts
 *
 * **전개 입력을 그대로 못 쓰는 이유**(L20). 전개는 여덟 칸에 `k = 3` 을 쓴다. 블록 방식은
 * 배열을 두 번 지나며 표 두 벌을 만드는데, 여덟 칸에서는 그 두 벌이 열 몇 번짜리 상수에
 * 묻혀 두 설계의 순서가 안 갈린다. 그래서 「아이디어 상세」 ④⑥ 이 쓰는 것과 **같은 두 입력**
 * (곱셈 나머지 1,024 칸 · 같은 길이의 감소 수열)을 쓰고 창 크기만 바꾼다. **난수를 쓰지
 * 않으므로 시드가 없다** — 아래 생성식이 입력의 전부이고, 그 식을 본문에도 적는다.
 *
 * **창 크기를 축으로 잡은 이유.** 이 문제의 지문은 배열과 창 크기 둘을 주는데, 두 설계가
 * 갈리는 자리가 정확히 창 크기다. 블록 방식의 접근 수는 배열의 **값에 전혀 안 매이고**
 * 길이와 창 크기만으로 정해지는 반면, 후보를 줄 세우는 쪽은 값의 순서를 따라 움직인다.
 */

/** 배열 길이. 두 설계가 같은 길이를 받는다. */
export const N = 1024;

/** 곱셈 나머지 입력. `nums[i] = (2731 i) mod 1201`. 1201 이 소수라 1,024 개가 전부 다르다. */
export const MIXED: number[] = Array.from(
  { length: N },
  (_, i) => (i * 2731) % 1201,
);

/** 감소 수열. `nums[i] = N − i`. 후보가 창 크기만큼 쌓이는 쪽이다. */
export const DOWN: number[] = Array.from({ length: N }, (_, i) => N - i);

/**
 * 이 가이드가 가르치는 절차 — **앞으로 답이 될 수 있는 자리를 줄 세워 둔다**.
 *
 * 계수 회계: `nums` 읽기 · 후보 통 읽기와 쓰기 · 답 배열 쓰기를 각각 한 번으로 센다. 통의
 * 앞·뒤 어느 쪽에서 넣고 빼도 한 번이다(덱의 계약).
 */
function dequeAccesses(
  nums: number[],
  k: number,
): { acc: number; peak: number } {
  const n = nums.length;
  const result: number[] = [];
  const cand: number[] = [];
  let acc = 0;
  let peak = 0;
  for (let i = 0; i < n; i++) {
    acc++; // nums[i] 읽기
    const cur = nums[i] ?? 0;
    if (cand.length > 0) {
      acc++; // 맨 앞 후보 읽기
      if ((cand[0] ?? 0) <= i - k) {
        acc++; // 앞에서 버리기
        cand.shift();
      }
    }
    while (cand.length > 0) {
      acc += 2; // 뒤쪽 후보 읽기 + 그 자리의 값 읽기
      if ((nums[cand[cand.length - 1] ?? 0] ?? 0) >= cur) break;
      acc++; // 뒤에서 버리기
      cand.pop();
    }
    acc++; // 뒤에 붙이기
    cand.push(i);
    if (cand.length > peak) peak = cand.length;
    if (i >= k - 1) {
      acc += 3; // 맨 앞 후보 읽기 + 그 자리의 값 읽기 + 답 쓰기
      result.push(nums[cand[0] ?? 0] ?? 0);
    }
  }
  return { acc, peak };
}

/**
 * 경쟁 설계 — **배열을 창 크기 `k` 칸씩 끊고 조각마다 접두·접미 최댓값 표를 만든다**.
 *
 * 길이 `k` 인 창은 조각 경계를 **정확히 하나** 지나므로, 창의 최댓값이 「왼쪽 끝에서 그
 * 조각 끝까지의 접미 최댓값」과 「그 다음 조각 처음부터 오른쪽 끝까지의 접두 최댓값」 중
 * 큰 쪽이다. van Herk(1992)와 Gil–Werman(1993)이 같은 해 전후로 낸 방법이고, 영상 처리의
 * 최대·최소 필터가 이것을 쓴다.
 *
 * 표 두 벌을 미리 만들어야 하므로 배열 전체가 있어야 하고 추가로 `2N` 칸을 잡는다.
 */
function blockAccesses(
  nums: number[],
  k: number,
): { acc: number; cells: number } {
  const n = nums.length;
  const pre = new Array<number>(n).fill(0);
  const suf = new Array<number>(n).fill(0);
  const result: number[] = [];
  let acc = 0;

  for (let i = 0; i < n; i++) {
    acc++; // nums[i] 읽기
    const v = nums[i] ?? 0;
    if (i % k === 0) {
      acc++; // 조각의 첫 칸은 그대로 적는다
      pre[i] = v;
    } else {
      acc++; // 왼쪽 칸 읽기
      const left = pre[i - 1] ?? 0;
      acc++; // 쓰기
      pre[i] = left > v ? left : v;
    }
  }
  for (let i = n - 1; i >= 0; i--) {
    acc++; // nums[i] 읽기
    const v = nums[i] ?? 0;
    if (i % k === k - 1 || i === n - 1) {
      acc++; // 조각의 마지막 칸은 그대로 적는다
      suf[i] = v;
    } else {
      acc++; // 오른쪽 칸 읽기
      const right = suf[i + 1] ?? 0;
      acc++; // 쓰기
      suf[i] = right > v ? right : v;
    }
  }
  for (let i = 0; i + k <= n; i++) {
    acc += 2; // 접미 표와 접두 표에서 한 칸씩 읽기
    const a = suf[i] ?? 0;
    const b = pre[i + k - 1] ?? 0;
    acc++; // 답 쓰기
    result.push(a > b ? a : b);
  }
  return { acc, cells: 2 * n };
}

/** 두 설계가 같은 답을 내는지 계수를 내기 전에 확인한다. */
function assertSameAnswer(): void {
  for (const nums of [MIXED, DOWN]) {
    for (const k of [1, 2, 44, 45, 128, N]) {
      const want: number[] = [];
      for (let i = 0; i + k <= nums.length; i++) {
        let best = nums[i] ?? 0;
        for (let j = i + 1; j < i + k; j++) {
          const v = nums[j] ?? 0;
          if (v > best) best = v;
        }
        want.push(best);
      }
      const pre = new Array<number>(nums.length).fill(0);
      const suf = new Array<number>(nums.length).fill(0);
      for (let i = 0; i < nums.length; i++) {
        const v = nums[i] ?? 0;
        pre[i] = i % k === 0 ? v : Math.max(pre[i - 1] ?? 0, v);
      }
      for (let i = nums.length - 1; i >= 0; i--) {
        const v = nums[i] ?? 0;
        suf[i] =
          i % k === k - 1 || i === nums.length - 1
            ? v
            : Math.max(suf[i + 1] ?? 0, v);
      }
      const got: number[] = [];
      for (let i = 0; i + k <= nums.length; i++) {
        got.push(Math.max(suf[i] ?? 0, pre[i + k - 1] ?? 0));
      }
      if (got.join(",") !== want.join(",")) {
        throw new Error(`블록 방식의 답이 다르다 — k=${k}`);
      }
    }
  }
}

assertSameAnswer();

function counts(
  run: (nums: number[], k: number) => number,
  cellsAt: (k: number) => number,
): Record<string, number> {
  return {
    "감소 수열 · k=2 자료 접근": run(DOWN, 2),
    "감소 수열 · k=44 자료 접근": run(DOWN, 44),
    "감소 수열 · k=45 자료 접근": run(DOWN, 45),
    "감소 수열 · k=1,024 자료 접근": run(DOWN, N),
    "곱셈 나머지 · k=45 자료 접근": run(MIXED, 45),
    "곱셈 나머지 · k=1,024 자료 접근": run(MIXED, N),
    "감소 수열 · k=45 추가 칸": cellsAt(45),
    "감소 수열 · k=1,024 추가 칸": cellsAt(N),
  };
}

export const cases = {
  "후보 줄 세우기": () =>
    counts(
      (nums, k) => dequeAccesses(nums, k).acc,
      (k) => dequeAccesses(DOWN, k).peak,
    ),
  "조각 접두·접미 표": () =>
    counts(
      (nums, k) => blockAccesses(nums, k).acc,
      (k) => blockAccesses(DOWN, k).cells,
    ),
};
