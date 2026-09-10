/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력·같은 작업 목록**에 두 설계를 걸고 **결정론적 계수**만 센다. 세는 것은 **배열
 * 접근 수**(읽기 + 쓰기)다. 벽시계·처리량은 실행마다 달라 "본문의 수치가 실측과 일치하는가"
 * (P10)를 정의할 수 없다.
 *
 *   bun run ../../../../tools/bench-alt.ts prefixSumRangeQuery-guide.alt.ts
 *
 * **전개 입력을 그대로 못 쓰는 이유**(L20). 전개는 여섯 칸짜리 `[3 1 4 1 5 9]` 를 쓰는데,
 * 여섯 칸에서는 펜윅 트리가 한 번에 지나는 칸이 두세 개뿐이라 두 설계의 접근 수가 상수에
 * 묻힌다. 그래서 같은 규칙으로 만든 1,024 칸 입력을 쓴다. **난수를 쓰지 않으므로 시드가
 * 없다** — 아래 생성식이 입력의 전부이고, 그 식을 본문에도 적는다.
 */

/** 배열 길이. 2 의 거듭제곱이라 펜윅 트리의 칸이 정확히 채워진다. */
export const N = 1024;

/** 입력 배열. `A[i] = (37i) mod 101`. 값 자체는 접근 수에 영향을 주지 않는다. */
export const A: number[] = Array.from({ length: N }, (_, i) => (i * 37) % 101);

/** 질의 수. */
export const Q = 1024;

/** 질의 목록. `a = (37i) mod N`, `b = (91i) mod N` 을 만들고 작은 쪽을 왼쪽 끝으로 둔다. */
export const QUERIES: [number, number][] = Array.from({ length: Q }, (_, i) => {
  const a = (i * 37) % N;
  const b = (i * 91) % N;
  return (a <= b ? [a, b] : [b, a]) as [number, number];
});

/** 갱신 목록. `k` 번째 갱신은 `A[(53k) mod N]` 에 `(k mod 7) + 1` 을 더한다. */
function updates(u: number): [number, number][] {
  return Array.from(
    { length: u },
    (_, k) => [(k * 53) % N, (k % 7) + 1] as [number, number],
  );
}

type Op = ["q", number] | ["u", number];

/**
 * 갱신 `u` 회를 질의 `Q` 회 사이에 고르게 끼운 작업 목록. **두 설계가 같은 목록을 받는다.**
 *
 * 갱신을 앞에 몰면 누적합 쪽이 표를 한 번만 다시 만들면 되어 대조가 연출이 된다 — 갱신과
 * 질의가 섞여 들어오는 것이 이 대조가 재려는 상황이다.
 */
export function workload(u: number): Op[] {
  const ops: Op[] = [];
  let done = 0;
  for (let i = 0; i < Q; i++) {
    const want = Math.floor(((i + 1) * u) / Q);
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
 * 이 가이드가 가르치는 절차 — **누적합 표**. `prefixSumRangeQuery-guide.ref.ts` 와 같은
 * 절차이고 접근 계수만 덧붙였다. 갱신이 들어오면 표를 처음부터 다시 만든다.
 */
function prefixAccesses(u: number): number {
  const a = A.slice();
  const P = new Array<number>(N + 1);
  const up = updates(u);
  let acc = 0;

  const build = (): void => {
    P[0] = 0;
    acc += 1; // P[0] 쓰기
    for (let i = 0; i < N; i++) {
      acc += 3; // P[i] 읽기 · a[i] 읽기 · P[i+1] 쓰기
      P[i + 1] = (P[i] as number) + (a[i] as number);
    }
  };

  build();
  for (const op of workload(u)) {
    if (op[0] === "q") {
      const [l, r] = QUERIES[op[1]] as [number, number];
      acc += 2; // P[r+1] 읽기 · P[l] 읽기
      void ((P[r + 1] as number) - (P[l] as number));
    } else {
      const [idx, delta] = up[op[1]] as [number, number];
      acc += 2; // a[idx] 읽기 · a[idx] 쓰기
      a[idx] = (a[idx] as number) + delta;
      build();
    }
  }
  return acc;
}

/**
 * 경쟁 설계 — **펜윅 트리**(이진 인덱스 트리).
 *
 * 같은 목표(구간 합 질의에 답하기)를 노리고 저장 방식이 다르다. 칸 `j` 가 자기 아래
 * `j & -j` 개 원소의 합을 들고 있어서, 앞 `k` 개의 합을 `k` 의 1 비트 수만큼의 칸을 읽어
 * 만든다. 갱신은 그 원소를 덮는 칸들만 고쳐 끝난다.
 */
function fenwickAccesses(u: number): number {
  const a = A.slice();
  const tree = new Array<number>(N + 1).fill(0);
  const up = updates(u);
  let acc = 0;

  const add = (pos: number, delta: number): void => {
    for (let j = pos; j <= N; j += j & -j) {
      acc += 2; // tree[j] 읽기 · tree[j] 쓰기
      tree[j] = (tree[j] as number) + delta;
    }
  };
  const prefix = (k: number): number => {
    let s = 0;
    for (let j = k; j > 0; j -= j & -j) {
      acc += 1; // tree[j] 읽기
      s += tree[j] as number;
    }
    return s;
  };

  for (let i = 0; i < N; i++) {
    acc += 1; // a[i] 읽기
    add(i + 1, a[i] as number);
  }
  for (const op of workload(u)) {
    if (op[0] === "q") {
      const [l, r] = QUERIES[op[1]] as [number, number];
      void (prefix(r + 1) - prefix(l));
    } else {
      const [idx, delta] = up[op[1]] as [number, number];
      acc += 2; // a[idx] 읽기 · a[idx] 쓰기
      a[idx] = (a[idx] as number) + delta;
      add(idx + 1, delta);
    }
  }
  return acc;
}

function counts(run: (u: number) => number): Record<string, number> {
  return {
    "갱신 0 회 배열 접근": run(0),
    "갱신 6 회 배열 접근": run(6),
    "갱신 7 회 배열 접근": run(7),
    "갱신 1024 회 배열 접근": run(1024),
    "저장 칸": N + 1,
  };
}

export const cases = {
  "누적합 표": () => counts(prefixAccesses),
  "펜윅 트리": () => counts(fenwickAccesses),
};
