/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력·같은 작업 목록**에 두 설계를 걸고 **결정론적 계수**만 센다. 세는 것은 **배열
 * 접근 수**(읽기 + 쓰기)다. 벽시계·처리량은 실행마다 달라 「본문의 수치가 실측과 같은가」
 * (P10)를 정의할 수 없다.
 *
 *   bun run ../../../../tools/bench-alt.ts nextGreaterElement-guide.alt.ts
 *
 * **전개 입력을 그대로 못 쓰는 이유**(L20). 전개는 다섯 칸짜리 `[2 1 2 4 3]` 을 쓴다. 구간
 * 최댓값 트리는 미리 만드는 값이 배열 길이에 비례하고 질의 하나가 `log₂ N` 을 따라가는데,
 * `N = 5` 에서는 그 둘이 열 몇 번짜리 상수에 묻혀 두 설계의 순서가 안 갈린다. 그래서
 * 「아이디어 상세」 ④⑥ 과 **같은 생성식**의 1,024 칸 입력을 쓰고, 질의 수와 갱신 수만
 * 바꾼다. **난수를 쓰지 않으므로 시드가 없다** — 아래 생성식이 입력의 전부이고, 그 식을
 * 본문에도 적는다.
 *
 * **작업 목록을 왜 이렇게 잡았는가.** 이 문제는 배열 하나를 받아 답을 한 번에 내지만, 그
 * 답을 **몇 자리나 쓰는지**와 **배열이 중간에 바뀌는지**는 지문이 정하지 않는다. 두 설계가
 * 갈리는 자리가 정확히 그 둘이라 작업 목록의 축을 그 둘로 뒀다.
 */

/** 배열 길이. 2 의 거듭제곱이라 트리가 정확히 나뉜다. */
export const N = 1024;

/** 입력 배열. `nums[i] = (7919 i) mod 1009`. 값이 반복되지 않아 답이 골고루 흩어진다. */
export const NUMS: number[] = Array.from(
  { length: N },
  (_, i) => (i * 7919) % 1009,
);

/** 질의 `t` 번째가 묻는 자리. `(23t) mod N`. */
export const askAt = (t: number): number => (t * 23) % N;

/** 갱신 `k` 번째. `nums[(59k) mod N]` 를 `(31k) mod 1009` 로 덮어쓴다. */
export const updateAt = (k: number): [number, number] => [
  (k * 59) % N,
  (k * 31) % 1009,
];

type Op = ["q", number] | ["u", number];

/**
 * 갱신 `u` 회를 질의 `q` 회 사이에 고르게 끼운 목록. **두 설계가 같은 목록을 받는다.**
 *
 * 갱신을 앞에 몰면 단조 스택이 재계산을 한 번만 하고 끝나 대조가 연출이 된다 — 갱신과
 * 질의가 섞여 들어오는 것이 이 축이 말하는 상황이다.
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

/**
 * 이 가이드가 가르치는 절차 — **단조 스택으로 한 번에 다 푼다**.
 *
 * 답 배열 한 벌을 만들어 두고 질의는 그 배열을 읽기만 한다. 갱신이 들어오면 답 배열이
 * 통째로 낡으므로, 다음 질의 앞에서 한 번 다시 만든다(갱신이 이어지면 재계산은 한 번뿐이다).
 */
function stackAccesses(q: number, u: number): { acc: number; peak: number } {
  const a = NUMS.slice();
  let acc = 0;
  let peak = 0;
  let cache: number[] | null = null;

  const rebuild = (): void => {
    const result = new Array<number>(N).fill(-1);
    acc += N; // 답 배열 초기화 쓰기
    const stack: number[] = [];
    for (let i = 0; i < N; i++) {
      acc++; // a[i] 읽기
      const cur = a[i] ?? 0;
      while (stack.length > 0) {
        acc++; // stack 꼭대기 읽기
        const top = stack[stack.length - 1] ?? 0;
        acc++; // a[top] 읽기
        if ((a[top] ?? 0) >= cur) break;
        stack.pop();
        acc++; // result[top] 쓰기
        result[top] = cur;
      }
      acc++; // stack 쓰기
      stack.push(i);
      if (stack.length > peak) peak = stack.length;
    }
    cache = result;
  };

  for (const op of workload(q, u)) {
    if (op[0] === "u") {
      const [i, v] = updateAt(op[1]);
      acc++; // a[i] 쓰기
      a[i] = v;
      cache = null;
      continue;
    }
    if (cache === null) rebuild();
    acc++; // 답 배열 읽기
  }
  return { acc, peak };
}

/**
 * 경쟁 설계 — **구간 최댓값 트리에서 내려가며 첫 자리를 찾는다**.
 *
 * 마디마다 그 구간의 최댓값을 들고 있다가, `nums[i]` 보다 큰 값이 든 가장 왼쪽 잎을 위에서
 * 내려가며 찾는다. 최댓값이 `nums[i]` 이하인 마디는 통째로 건너뛴다. 갱신은 잎 하나를 고치고
 * 뿌리까지 올라가며 다시 합치면 끝난다.
 */
function treeAccesses(q: number, u: number): { acc: number; cells: number } {
  const a = NUMS.slice();
  let size = 1;
  while (size < N) size *= 2;
  const tree = new Array<number>(2 * size).fill(Number.NEGATIVE_INFINITY);
  let acc = 2 * size; // 트리 초기화 쓰기

  for (let i = 0; i < N; i++) {
    acc += 2; // a[i] 읽기 · 잎 쓰기
    tree[size + i] = a[i] ?? 0;
  }
  for (let k = size - 1; k >= 1; k--) {
    acc += 3; // 자식 둘 읽기 · 자기 쓰기
    tree[k] = Math.max(tree[2 * k] ?? 0, tree[2 * k + 1] ?? 0);
  }

  const update = (i: number, v: number): void => {
    acc++; // a[i] 쓰기
    a[i] = v;
    acc++; // 잎 쓰기
    tree[size + i] = v;
    let k = (size + i) >> 1;
    while (k >= 1) {
      acc += 3; // 자식 둘 읽기 · 자기 쓰기
      tree[k] = Math.max(tree[2 * k] ?? 0, tree[2 * k + 1] ?? 0);
      k >>= 1;
    }
  };

  /** `[lo, N-1]` 안에서 값이 `x` 보다 큰 가장 왼쪽 자리. 없으면 `-1`. */
  const firstGreater = (lo: number, x: number): number => {
    const go = (k: number, l: number, r: number): number => {
      acc++; // 마디 읽기
      if (r < lo || (tree[k] ?? 0) <= x) return -1;
      if (l === r) return l;
      const m = (l + r) >> 1;
      const left = go(2 * k, l, m);
      return left !== -1 ? left : go(2 * k + 1, m + 1, r);
    };
    return go(1, 0, size - 1);
  };

  for (const op of workload(q, u)) {
    if (op[0] === "u") {
      const [i, v] = updateAt(op[1]);
      update(i, v);
      continue;
    }
    const i = askAt(op[1]);
    acc++; // a[i] 읽기
    const j = firstGreater(i + 1, a[i] ?? 0);
    if (j !== -1 && j < N) acc++; // a[j] 읽기
  }
  return { acc, cells: 2 * size };
}

function counts(
  run: (q: number, u: number) => number,
  cells: number,
): Record<string, number> {
  return {
    "갱신 0 회 · 질의 53 개 배열 접근": run(53, 0),
    "갱신 0 회 · 질의 54 개 배열 접근": run(54, 0),
    "갱신 0 회 · 질의 4,096 개 배열 접근": run(4_096, 0),
    "질의 1,024 개 · 갱신 0 회 배열 접근": run(1_024, 0),
    "질의 1,024 개 · 갱신 2 회 배열 접근": run(1_024, 2),
    "질의 1,024 개 · 갱신 3 회 배열 접근": run(1_024, 3),
    "질의 1,024 개 · 갱신 1,024 회 배열 접근": run(1_024, 1_024),
    "추가 칸": cells,
  };
}

/** 스택 방식이 잡는 칸 — 답 배열 `N` 칸 + 스택이 가장 깊었을 때의 칸 수. */
const stackCells = (): number => N + stackAccesses(1_024, 0).peak;

export const cases = {
  "단조 스택": () => counts((q, u) => stackAccesses(q, u).acc, stackCells()),
  "구간 최댓값 트리": () =>
    counts((q, u) => treeAccesses(q, u).acc, treeAccesses(0, 0).cells),
};
