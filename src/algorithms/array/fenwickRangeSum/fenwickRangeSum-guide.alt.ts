/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력·같은 작업 목록**에 두 설계를 걸고 **결정론적 계수**만 센다. 세는 것은 **배열
 * 접근 수**(읽기 + 쓰기)다. 벽시계·처리량은 실행마다 달라 「본문의 수치가 실측과 같은가」
 * (P10)를 정의할 수 없다.
 *
 *   bun run ../../../../tools/bench-alt.ts fenwickRangeSum-guide.alt.ts
 *
 * **전개 입력을 그대로 못 쓰는 이유**(L20). 전개는 다섯 칸짜리 `[1 2 3 4 5]` 에 연산 넷을
 * 건다. 제곱근 분할의 묶음 길이가 `N = 5` 에서는 2 아니면 4 뿐이라 두 설계의 접근 수가 열
 * 몇 번짜리 상수에 묻힌다. 그래서 「아이디어 상세」 ④⑥ 이 쓰는 것과 **같은 생성식**의
 * 1,024 칸 입력을 쓰고, 질의 수와 갱신 수만 바꾼다. **난수를 쓰지 않으므로 시드가 없다** —
 * 아래 생성식이 입력의 전부이고, 그 식을 본문에도 적는다.
 */

/** 배열 길이. 2 의 거듭제곱이라 묶음이 정확히 나뉜다. */
export const N = 1024;

/** 입력 배열. `A[i] = (41i) mod 97`. 값 자체는 접근 수에 영향을 주지 않는다. */
export const A: number[] = Array.from({ length: N }, (_, i) => (i * 41) % 97);

/** 제곱근 분할의 묶음 길이. `√1024 = 32` 다. */
export const B = 32;

/** 질의 `t` 번째. `a = (23t) mod N`, `b = (67t) mod N` 중 작은 쪽이 왼쪽 끝이다. */
export function queryAt(t: number): [number, number] {
  const a = (t * 23) % N;
  const b = (t * 67) % N;
  return a <= b ? [a, b] : [b, a];
}

/** 갱신 `k` 번째. `A[(59k) mod N]` 를 `((31k) mod 1000) − 500` 으로 덮어쓴다. */
export function updateAt(k: number): [number, number] {
  return [(k * 59) % N, ((k * 31) % 1000) - 500];
}

type Op = ["q", number] | ["u", number];

/**
 * 갱신 `u` 회를 질의 `q` 회 사이에 고르게 끼운 목록. **두 설계가 같은 목록을 받는다.**
 *
 * 갱신을 앞에 몰면 두 설계 다 갱신을 한 덩어리로 처리해 대조가 연출이 된다 — 갱신과 질의가
 * 섞여 들어오는 것이 이 문제가 말하는 상황이다.
 */
export function workload(q: number, u: number): Op[] {
  const ops: Op[] = [];
  let done = 0;
  for (let i = 0; i < q; i++) {
    const want = q === 0 ? u : Math.floor(((i + 1) * u) / q);
    while (done < want) {
      ops.push(["u", done]);
      done++;
    }
    ops.push(["q", i]);
  }
  while (done < u) {
    ops.push(["u", done]);
    done++;
  }
  return ops;
}

const lowbit = (k: number): number => k & -k;

/**
 * 이 가이드가 가르치는 절차 — **최하위 비트로 담당 길이를 정하는 트리**.
 * `fenwickRangeSum-guide.ref.ts` 와 같은 절차이고 접근 계수만 덧붙였다.
 */
function fenwickAccesses(q: number, u: number): number {
  const a = A.slice();
  const tree = new Array<number>(N + 1).fill(0);
  let acc = 0;

  for (let i = 1; i <= N; i++) {
    acc += 2; // a[i-1] 읽기 · tree[i] 쓰기
    tree[i] = a[i - 1] ?? 0;
  }
  for (let i = 1; i <= N; i++) {
    const j = i + lowbit(i);
    if (j > N) continue;
    acc += 3; // tree[i] 읽기 · tree[j] 읽기 · tree[j] 쓰기
    tree[j] = (tree[j] ?? 0) + (tree[i] ?? 0);
  }

  const prefix = (r: number): number => {
    let s = 0;
    for (let k = r; k > 0; k -= lowbit(k)) {
      acc++; // tree[k] 읽기
      s += tree[k] ?? 0;
    }
    return s;
  };

  for (const op of workload(q, u)) {
    if (op[0] === "q") {
      const [l, r] = queryAt(op[1]);
      prefix(r + 1) - prefix(l);
      continue;
    }
    const [i, v] = updateAt(op[1]);
    acc += 2; // a[i] 읽기 · a[i] 쓰기
    const d = v - (a[i] ?? 0);
    a[i] = v;
    for (let k = i + 1; k <= N; k += lowbit(k)) {
      acc += 2; // tree[k] 읽기 · tree[k] 쓰기
      tree[k] = (tree[k] ?? 0) + d;
    }
  }
  return acc;
}

/**
 * 경쟁 설계 — **제곱근 분할**(고정 길이 묶음).
 *
 * 배열을 `B` 칸씩 끊어 묶음마다 합 하나를 저장한다. 갱신은 그 칸과 묶음 합 하나만 고치면
 * 끝나므로 배열 길이와 무관하게 접근 넷이다. 질의는 온전히 들어가는 묶음의 저장값을 읽고
 * 양 끝의 남는 칸만 직접 읽으므로, 묶음 수와 묶음 길이의 합만큼 읽는다.
 */
function blockAccesses(q: number, u: number): number {
  const a = A.slice();
  const nb = Math.ceil(N / B);
  const sums = new Array<number>(nb).fill(0);
  let acc = 0;

  for (let i = 0; i < N; i++) {
    acc++; // a[i] 읽기
    const j = Math.floor(i / B);
    sums[j] = (sums[j] ?? 0) + (a[i] ?? 0);
  }
  acc += nb; // 묶음 합 쓰기

  for (const op of workload(q, u)) {
    if (op[0] === "q") {
      const [l, r] = queryAt(op[1]);
      let k = l;
      while (k <= r) {
        acc++; // 묶음 합 또는 a[k] 읽기
        if (k % B === 0 && k + B - 1 <= r) k += B;
        else k++;
      }
      continue;
    }
    const [i, v] = updateAt(op[1]);
    acc += 2; // a[i] 읽기 · a[i] 쓰기
    const d = v - (a[i] ?? 0);
    a[i] = v;
    acc += 2; // 묶음 합 읽기 · 쓰기
    sums[Math.floor(i / B)] = (sums[Math.floor(i / B)] ?? 0) + d;
  }
  return acc;
}

function counts(
  run: (q: number, u: number) => number,
  cells: number,
): Record<string, number> {
  return {
    "갱신 0 회 · 질의 136 개 배열 접근": run(136, 0),
    "갱신 0 회 · 질의 137 개 배열 접근": run(137, 0),
    "갱신 0 회 · 질의 4,096 개 배열 접근": run(4_096, 0),
    "질의 1,024 개 · 갱신 0 회 배열 접근": run(1_024, 0),
    "질의 1,024 개 · 갱신 2,684 회 배열 접근": run(1_024, 2_684),
    "질의 1,024 개 · 갱신 2,685 회 배열 접근": run(1_024, 2_685),
    "질의 1,024 개 · 갱신 16,384 회 배열 접근": run(1_024, 16_384),
    "추가 칸": cells,
  };
}

export const cases = {
  "최하위 비트 트리": () => counts(fenwickAccesses, N + 1),
  "제곱근 분할": () => counts(blockAccesses, Math.ceil(N / B)),
};
