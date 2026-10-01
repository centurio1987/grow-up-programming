/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력**에 세 설계를 걸고 **결정론적 계수**만 센다. 세는 것은 **칸 접근**(읽기 +
 * 쓰기, 새 배열을 채우는 초기화 쓰기 포함)과 **추가 칸**(입력 밖에 새로 잡아 동시에 든 칸의 최댓값)이다. 벽시계·처리량은 실행마다 달라 "본문의
 * 수치가 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/array/missingInteger/missingInteger-guide.alt.ts
 *
 * **입력은 둘이다**(L20). 전개가 쓰는 여섯 칸 `[4 -1 9 1 1 2]` 를 그대로 쓰고, 규모의 차이를 보려고
 * 같은 성질(음수 · n 보다 큰 값 · 중복이 섞임)을 가진 100,000 칸 입력을 생성식으로 더한다. **난수를
 * 쓰지 않으므로 시드가 없다** — 아래 생성식이 입력의 전부이고, 그 식을 본문에도 적는다.
 *
 * **경쟁 설계가 매 실행마다 정본과 답을 대조한다.** 답이 다른 구현으로 잰 계수는 저울질이
 * 아니라 다른 문제의 값이다.
 */
import { missingInteger } from "./missingInteger-guide.ref.ts";

/** 전개 입력. */
export const WALK: number[] = [4, -1, 9, 1, 1, 2];

/** 규모를 키운 입력의 길이. */
export const BIG_N = 100_000;

/**
 * 규모를 키운 입력. `j = ⌊i/4⌋` 로 두고 `i mod 4` 에 따라 네 갈래로 만든다.
 *
 * | `i mod 4` | 값 | 무엇이 되는가 |
 * | --- | --- | --- |
 * | 0 | `(48271·j mod 25000) + 1` | 1 … 25,000 을 한 번씩 |
 * | 1 | `(7·j mod 25000) + 1` | 같은 수를 한 번 더(중복) |
 * | 2 | `−(j + 1)` | 음수 |
 * | 3 | `100000 + j + 1` | n 보다 큰 값 |
 *
 * 그래서 답은 25,001 이다.
 */
export const BIG: number[] = Array.from({ length: BIG_N }, (_, i) => {
  const j = Math.floor(i / 4);
  switch (i % 4) {
    case 0:
      return ((j * 48_271) % 25_000) + 1;
    case 1:
      return ((j * 7) % 25_000) + 1;
    case 2:
      return -(j + 1);
    default:
      return BIG_N + j + 1;
  }
});

/** 한 설계를 실행한 결과. */
export interface Run {
  answer: number;
  accesses: number;
  cells: number;
  /** 실행 뒤 입력 배열이 처음과 같은가. */
  intact: boolean;
}

/** 정본과 같은 절차에 접근 수를 세는 자리만 덧붙인 사본 — 직접 주소 테이블. */
export function tableRun(input: number[]): Run {
  const A = input;
  const before = JSON.stringify(A);
  const n = A.length;
  let accesses = 0;
  const seen = new Array<boolean>(n + 1).fill(false);
  accesses += n + 1; // 새 칸을 거짓으로 채우는 쓰기
  let answer = n + 1;
  for (let i = 0; i < n; i++) {
    const x = A[i] as number;
    accesses++; // A 읽기
    if (x >= 1 && x <= n) {
      seen[x] = true;
      accesses++; // seen 쓰기
    }
  }
  for (let x = 1; x <= n; x++) {
    accesses++; // seen 읽기
    if (!seen[x]) {
      answer = x;
      break;
    }
  }
  return {
    answer,
    accesses,
    cells: n + 1,
    intact: JSON.stringify(A) === before,
  };
}

/**
 * 제자리 배치 — 값 `x`(1 ≤ x ≤ n)를 배열의 자리 `x − 1` 로 맞바꿔 옮긴 뒤, 제 값이 아닌 첫 자리를
 * 찾는다. 추가 칸 없이 입력 배열을 테이블로 쓴다. **입력을 바꾼다.**
 */
export function inPlaceRun(input: number[]): Run {
  const B = input;
  const n = B.length;
  let accesses = 0;
  const read = (i: number): number => {
    accesses++;
    return B[i] as number;
  };
  const write = (i: number, v: number): void => {
    accesses++;
    B[i] = v;
  };
  for (let i = 0; i < n; i++) {
    for (;;) {
      const v = read(i);
      if (v < 1 || v > n) break;
      const w = read(v - 1);
      if (w === v) break;
      write(v - 1, v);
      write(i, w);
    }
  }
  let answer = n + 1;
  for (let i = 0; i < n; i++) {
    if (read(i) !== i + 1) {
      answer = i + 1;
      break;
    }
  }
  return { answer, accesses, cells: 0, intact: false };
}

/** 입력을 지켜야 할 때의 제자리 배치 — 복사본을 만들고 그 위에서 옮긴다. */
export function inPlaceCopyRun(input: number[]): Run {
  const n = input.length;
  const before = JSON.stringify(input);
  const copy = input.slice();
  const run = inPlaceRun(copy);
  return {
    answer: run.answer,
    // 복사할 때 원본 읽기 n 번 + 복사본 쓰기 n 번
    accesses: run.accesses + 2 * n,
    cells: n,
    intact: JSON.stringify(input) === before,
  };
}

/** 세 설계를 한 입력에 걸고 정본과 답을 맞댄다. */
export function runAll(A: number[]): Record<string, Run> {
  const want = missingInteger([...A]);
  const out: Record<string, Run> = {
    "직접 주소 테이블": tableRun([...A]),
    "제자리 배치": inPlaceRun([...A]),
    "제자리 배치(복사본)": inPlaceCopyRun([...A]),
  };
  for (const [name, run] of Object.entries(out)) {
    if (run.answer !== want) {
      throw new Error(
        `${name} 이 정본과 다른 답을 낸다 — ${run.answer} ≠ ${want}`,
      );
    }
  }
  return out;
}

const INPUTS: [string, number[]][] = [
  ["n=6", WALK],
  ["n=100000", BIG],
];

export const cases: Record<string, () => Record<string, number>> =
  Object.fromEntries(
    ["직접 주소 테이블", "제자리 배치", "제자리 배치(복사본)"].map((name) => [
      name,
      () => {
        const out: Record<string, number> = {};
        for (const [label, A] of INPUTS) {
          const run = runAll(A)[name] as Run;
          out[`${label} 칸 접근`] = run.accesses;
          out[`${label} 추가 칸`] = run.cells;
        }
        return out;
      },
    ]),
  );
