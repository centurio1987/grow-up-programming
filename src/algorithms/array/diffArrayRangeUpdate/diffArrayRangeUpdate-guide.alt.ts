/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력·같은 작업 목록**에 두 설계를 걸고 **결정론적 계수**만 센다. 세는 것은 **배열
 * 접근 수**(읽기 + 쓰기)다. 벽시계·처리량은 실행마다 달라 "본문의 수치가 실측과 일치하는가"
 * (P10)를 정의할 수 없다.
 *
 *   bun run ../../../../tools/bench-alt.ts diffArrayRangeUpdate-guide.alt.ts
 *
 * **전개 입력을 그대로 못 쓰는 이유**(L20). 전개는 `N = 7` 에 갱신 셋짜리 입력을 쓰는데,
 * 일곱 칸에서는 펜윅 트리가 한 번에 지나는 칸이 두세 개뿐이라 두 설계의 접근 수가 상수에
 * 묻힌다. 그래서 같은 규칙으로 만든 1,024 칸 입력을 쓴다. **난수를 쓰지 않으므로 시드가
 * 없다** — 아래 생성식이 입력의 전부이고, 그 식을 본문에도 적는다.
 */

/** 결과 배열의 길이. 2 의 거듭제곱이라 펜윅 트리의 칸이 정확히 채워진다. */
export const N = 1024;

/** 구간 갱신의 개수. */
export const Q = 1024;

/**
 * 갱신 목록. `k` 번째 갱신은 `l = (37k) mod N` 에서 시작해 `k mod 64` 칸 뒤에서 끝나고
 * `v = (k mod 7) + 1` 을 더한다. 구간 길이가 1 부터 64 까지 나온다(배열 끝에서는 잘린다).
 */
export const UPDATES: [number, number, number][] = Array.from(
  { length: Q },
  (_, k) => {
    const l = (k * 37) % N;
    const r = Math.min(N - 1, l + (k % 64));
    return [l, r, (k % 7) + 1] as [number, number, number];
  },
);

/** 점 조회 `p` 개를 만든다. `t` 번째 조회는 인덱스 `(91(t+1)) mod N` 의 지금 값을 묻는다. */
function probes(p: number): number[] {
  return Array.from({ length: p }, (_, t) => ((t + 1) * 91) % N);
}

type Op = ["u", number] | ["q", number];

/**
 * 점 조회 `p` 회를 갱신 `Q` 회 사이에 고르게 끼운 작업 목록. **두 설계가 같은 목록을 받는다.**
 *
 * 조회를 맨 끝에 몰면 차분 배열이 복원 한 번으로 전부 답할 수 있어 대조가 연출이 된다 —
 * 갱신과 조회가 섞여 들어오는 것이 이 대조가 재려는 상황이다.
 */
export function workload(p: number): Op[] {
  const ops: Op[] = [];
  let done = 0;
  for (let k = 0; k < Q; k++) {
    ops.push(["u", k]);
    const want = Math.floor(((k + 1) * p) / Q);
    while (done < want) {
      ops.push(["q", done]);
      done++;
    }
  }
  while (done < p) {
    ops.push(["q", done]);
    done++;
  }
  return ops;
}

/**
 * 이 가이드가 가르치는 절차 — **차분 배열**. `diffArrayRangeUpdate-guide.ref.ts` 와 같은
 * 절차이고 접근 계수만 덧붙였다.
 *
 * 갱신은 경계 두 칸을 고쳐 끝나지만, 중간에 값 하나를 물으면 칸 0 부터 그 칸까지 다시
 * 더해야 한다 — 그 자리가 이 설계가 내주는 축이다.
 */
function diffAccesses(p: number): { acc: number; answers: number[] } {
  const P = probes(p);
  const D = new Array<number>(N + 1).fill(0);
  let acc = N + 1; // 0 으로 채우는 쓰기
  const answers: number[] = [];

  for (const op of workload(p)) {
    if (op[0] === "u") {
      const [l, r, v] = UPDATES[op[1]] as [number, number, number];
      acc += 2; // D[l] 읽기 · 쓰기
      D[l] = (D[l] as number) + v;
      acc += 2; // D[r+1] 읽기 · 쓰기
      D[r + 1] = (D[r + 1] as number) - v;
    } else {
      const x = P[op[1]] as number;
      let s = 0;
      for (let j = 0; j <= x; j++) {
        acc += 1; // D[j] 읽기
        s += D[j] as number;
      }
      answers.push(s);
    }
  }

  const A = new Array<number>(N);
  let running = 0;
  for (let i = 0; i < N; i++) {
    acc += 2; // D[i] 읽기 · A[i] 쓰기
    running += D[i] as number;
    A[i] = running;
  }
  answers.push(...A);
  return { acc, answers };
}

/**
 * 경쟁 설계 — **펜윅 트리**(이진 인덱스 트리)에 같은 차이 값을 담은 것.
 *
 * 같은 목표(구간 갱신을 모아 두었다가 값을 읽기)를 노리고 저장 방식이 다르다. 칸 `j` 가
 * 자기 아래 `j & -j` 개 칸의 차이 합을 들고 있어서, 갱신 하나가 `log N` 개의 칸을 고치고
 * 값 하나를 묻는 것도 `log N` 개의 칸을 읽어 끝난다.
 */
function fenwickAccesses(p: number): { acc: number; answers: number[] } {
  const P = probes(p);
  const tree = new Array<number>(N + 1).fill(0);
  let acc = N + 1; // 0 으로 채우는 쓰기
  const answers: number[] = [];

  const add = (pos: number, delta: number): void => {
    for (let j = pos; j <= N; j += j & -j) {
      acc += 2; // tree[j] 읽기 · 쓰기
      tree[j] = (tree[j] as number) + delta;
    }
  };
  const at = (k: number): number => {
    let s = 0;
    for (let j = k; j > 0; j -= j & -j) {
      acc += 1; // tree[j] 읽기
      s += tree[j] as number;
    }
    return s;
  };

  for (const op of workload(p)) {
    if (op[0] === "u") {
      const [l, r, v] = UPDATES[op[1]] as [number, number, number];
      add(l + 1, v);
      if (r + 2 <= N) add(r + 2, -v);
    } else {
      const x = P[op[1]] as number;
      answers.push(at(x + 1));
    }
  }

  const A = new Array<number>(N);
  for (let i = 0; i < N; i++) {
    acc += 1; // A[i] 쓰기
    A[i] = at(i + 1);
  }
  answers.push(...A);
  return { acc, answers };
}

/** 점 조회를 몇 회 끼웠을 때 두 설계의 접근 수 순서가 뒤집히는가. */
export const PROBE_POINTS = [0, 44, 45, Q] as const;

/**
 * 두 설계가 **같은 답을 낸다는 것**을 매번 대조한다. 답이 다르면 계수는 서로 다른 일을 잰
 * 것이라 대조가 성립하지 않는다.
 */
function counts(
  run: (p: number) => { acc: number; answers: number[] },
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of PROBE_POINTS) {
    const mine = run(p);
    const other = diffAccesses(p);
    if (JSON.stringify(mine.answers) !== JSON.stringify(other.answers)) {
      throw new Error(`점 조회 ${p} 회에서 두 설계의 답이 다르다`);
    }
    out[`점 조회 ${p.toLocaleString("en-US")} 회 배열 접근`] = mine.acc;
  }
  out["저장 칸"] = N + 1;
  return out;
}

export const cases = {
  "차분 배열": () => counts(diffAccesses),
  "펜윅 트리": () => counts(fenwickAccesses),
};
