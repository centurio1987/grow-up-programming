/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/tree/treeIsomorphism/treeIsomorphism.test.ts` 는 학습자 스텁을
 * 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본
 * (`treeIsomorphism-guide.ref.ts`)에 다시 건다.
 *
 * **벽시계를 재는 단언은 옮기지 않았다** — 실행마다 값이 달라 판정이 안 된다. 같은 규모
 * (`N = 10^5`)는 그대로 실행하되 **판정 결과**로 본다. 재귀로 적었으면 정점 10 만 개짜리
 * 사슬에서 호출 스택 한계에 먼저 이르는 자리이기도 하다.
 */
import { expect, test } from "bun:test";
import {
  centers,
  type Edge,
  neighbors,
  treeIsomorphism,
} from "./treeIsomorphism-guide.ref.ts";

function chain(n: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i < n - 1; i++) out.push([i, i + 1]);
  return out;
}

function reversedChain(n: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i < n - 1; i++) out.push([n - 1 - i, n - 2 - i]);
  return out;
}

function star(n: number, hub: number): Edge[] {
  const out: Edge[] = [];
  for (let v = 0; v < n; v++) if (v !== hub) out.push([hub, v]);
  return out;
}

/** 정의를 그대로 옮긴 절차 — 정점 대응을 되추적으로 찾는다. 작은 `n` 에서만 쓴다. */
function byPermutation(n: number, e1: Edge[], e2: Edge[]): boolean {
  const link1 = neighbors(n, e1);
  const link2 = neighbors(n, e2);
  const has = new Set<number>();
  for (const [u, v] of e2) {
    has.add(u * n + v);
    has.add(v * n + u);
  }
  const map: number[] = Array.from({ length: n }, () => -1);
  const used: boolean[] = Array.from({ length: n }, () => false);
  const place = (i: number): boolean => {
    if (i === n) return true;
    for (let j = 0; j < n; j++) {
      if (used[j] === true) continue;
      if ((link1[i] as number[]).length !== (link2[j] as number[]).length)
        continue;
      let ok = true;
      for (const w of link1[i] as number[]) {
        if (w < i && !has.has(j * n + (map[w] as number))) ok = false;
      }
      if (ok) {
        for (const w of link2[j] as number[]) {
          const back = map.indexOf(w);
          if (back !== -1 && back < i && !(link1[i] as number[]).includes(back))
            ok = false;
        }
      }
      if (!ok) continue;
      map[i] = j;
      used[j] = true;
      if (place(i + 1)) return true;
      used[j] = false;
      map[i] = -1;
    }
    return false;
  };
  return place(0);
}

const CASES: [string, number, Edge[], Edge[], boolean][] = [
  ["정점 하나짜리 트리 둘", 1, [], [], true],
  ["정점 둘 — 간선을 거꾸로 적었다", 2, [[0, 1]], [[1, 0]], true],
  ["정점 둘 — 같은 간선", 2, [[0, 1]], [[0, 1]], true],
  [
    "정점 셋 경로 둘",
    3,
    [
      [0, 1],
      [1, 2],
    ],
    [
      [2, 0],
      [0, 1],
    ],
    true,
  ],
  [
    "같은 모양의 작은 트리 — 번호만 다르다",
    4,
    [
      [0, 1],
      [0, 2],
      [1, 3],
    ],
    [
      [3, 2],
      [3, 1],
      [2, 0],
    ],
    true,
  ],
  [
    "중심이 둘인 트리 — 길이가 짝수인 경로",
    4,
    [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
    [
      [3, 2],
      [2, 1],
      [1, 0],
    ],
    true,
  ],
  [
    "번호만 바꾼 균형 트리",
    5,
    [
      [0, 1],
      [0, 2],
      [1, 3],
      [1, 4],
    ],
    [
      [4, 3],
      [4, 2],
      [3, 1],
      [3, 0],
    ],
    true,
  ],
  ["사슬 다섯 — 번호를 거꾸로 매겼다", 5, chain(5), reversedChain(5), true],
  ["사슬 다섯 대 별 다섯", 5, chain(5), star(5, 0), false],
  ["별 여섯 — 가운데 번호만 다르다", 6, star(6, 0), star(6, 5), true],
  [
    "가지가 갈리는 자리가 다르다",
    5,
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [0, 4],
    ],
    [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
    ],
    false,
  ],
  [
    "차수 합은 같은데 모양이 다르다",
    5,
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [1, 4],
    ],
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
    false,
  ],
  [
    "차수 수열까지 같은데 모양이 다르다",
    6,
    [
      [2, 3],
      [1, 2],
      [0, 1],
      [0, 4],
      [0, 5],
    ],
    [
      [2, 4],
      [1, 3],
      [0, 1],
      [0, 4],
      [0, 5],
    ],
    false,
  ],
  [
    "본문 전개가 쓰는 고정 입력",
    8,
    [
      [0, 1],
      [0, 6],
      [1, 2],
      [1, 7],
      [2, 3],
      [3, 4],
      [3, 5],
    ],
    [
      [0, 1],
      [0, 6],
      [2, 6],
      [3, 4],
      [3, 5],
      [3, 7],
      [6, 7],
    ],
    true,
  ],
];

for (const [name, n, e1, e2, want] of CASES) {
  test(`정본 — ${name}`, () => {
    expect(treeIsomorphism(n, e1, e2)).toBe(want);
    expect(treeIsomorphism(n, e2, e1)).toBe(want);
    expect(byPermutation(n, e1, e2)).toBe(want);
  });
}

test("중심은 하나이거나 둘이다 — 열 모양에서", () => {
  const shapes: [number, Edge[]][] = [
    [1, []],
    [2, chain(2)],
    [3, chain(3)],
    [4, chain(4)],
    [5, chain(5)],
    [7, star(7, 3)],
    [8, chain(8)],
    [9, chain(9)],
    [
      8,
      [
        [0, 1],
        [0, 6],
        [1, 2],
        [1, 7],
        [2, 3],
        [3, 4],
        [3, 5],
      ],
    ],
    [16, star(16, 0)],
  ];
  for (const [n, edges] of shapes) {
    const got = centers(n, neighbors(n, edges)).length;
    expect(got === 1 || got === 2).toBe(true);
  }
});

test("N=10^5 사슬 둘 — 번호를 거꾸로 매겨도 동형", () => {
  const N = 100_000;
  expect(treeIsomorphism(N, chain(N), reversedChain(N))).toBe(true);
});

test("N=10^5 별 둘 — 가운데 번호가 달라도 동형", () => {
  const N = 100_000;
  expect(treeIsomorphism(N, star(N, 0), star(N, N - 1))).toBe(true);
});

test("N=10^4 사슬 대 별 — 비동형", () => {
  const N = 10_000;
  expect(treeIsomorphism(N, chain(N), star(N, 0))).toBe(false);
});

test("정점 아홉 이하 무작위 트리 400 짝에서 순열 되추적과 답이 같다", () => {
  let seed = 20260908 | 0;
  const next = (): number => {
    seed ^= seed << 13;
    seed |= 0;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    seed |= 0;
    return seed >>> 0;
  };
  const make = (n: number): Edge[] => {
    const out: Edge[] = [];
    for (let v = 1; v < n; v++) out.push([next() % v, v]);
    return out;
  };
  for (let round = 0; round < 400; round++) {
    const n = (next() % 9) + 1;
    const a = make(n);
    const b = make(n);
    expect(treeIsomorphism(n, a, b)).toBe(byPermutation(n, a, b));
  }
});
