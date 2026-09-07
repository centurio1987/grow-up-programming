/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/geometry/bentleyOttmann/bentleyOttmann.test.ts` 는 학습자 스텁을
 * 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 *
 * 「성능」 케이스에서 벽시계 판정을 뺐다 — 실행마다 값이 달라 판정이 안 된다. 그 케이스가
 * 실제로 묻는 것(선분 1 만 개를 받아도 답이 나오는가)은 그대로 두고, 무작위 배치를 전부
 * 대조와 맞대는 시험을 따로 뒀다.
 */
import { expect, test } from "bun:test";
import { segmentsIntersect } from "../segmentsIntersect/segmentsIntersect-guide.ref.ts";
import {
  bentleyOttmann,
  type Point,
  type Segment,
} from "./bentleyOttmann-guide.ref.ts";

/** 전부 대조. 정본과 다른 경로로 같은 답을 낸다. */
function bruteForce(segs: Segment[]): number {
  let pairs = 0;
  for (let i = 0; i < segs.length; i++) {
    for (let j = i + 1; j < segs.length; j++) {
      if (segmentsIntersect(segs[i] as Segment, segs[j] as Segment)) pairs++;
    }
  }
  return pairs;
}

/** 32 비트 xorshift. 실행마다 같은 값이 나온다. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s;
  };
}

test("교차 없는 두 선분 — 0", () => {
  const segs: Segment[] = [
    [
      [0, 0],
      [1, 0],
    ],
    [
      [0, 5],
      [1, 5],
    ],
  ];
  expect(bentleyOttmann(segs)).toBe(0);
});

test("X 자 두 선분 — 1", () => {
  const segs: Segment[] = [
    [
      [0, 0],
      [4, 4],
    ],
    [
      [0, 4],
      [4, 0],
    ],
  ];
  expect(bentleyOttmann(segs)).toBe(1);
});

test("3 개 선분이 한 점에서 만남 — 쌍 단위 3", () => {
  const segs: Segment[] = [
    [
      [0, 0],
      [4, 4],
    ],
    [
      [0, 4],
      [4, 0],
    ],
    [
      [2, 0],
      [2, 4],
    ],
  ];
  expect(bentleyOttmann(segs)).toBe(3);
});

test("격자 — 가로 2 개와 세로 2 개 → 4 교차", () => {
  const segs: Segment[] = [
    [
      [0, 1],
      [10, 1],
    ],
    [
      [0, 3],
      [10, 3],
    ],
    [
      [2, 0],
      [2, 5],
    ],
    [
      [5, 0],
      [5, 5],
    ],
  ];
  expect(bentleyOttmann(segs)).toBe(4);
});

test("끝점 공유 (L 자) — 1", () => {
  const segs: Segment[] = [
    [
      [0, 0],
      [1, 0],
    ],
    [
      [1, 0],
      [1, 1],
    ],
  ];
  expect(bentleyOttmann(segs)).toBe(1);
});

test("공선 겹침 — 1", () => {
  const segs: Segment[] = [
    [
      [0, 0],
      [4, 0],
    ],
    [
      [2, 0],
      [6, 0],
    ],
  ];
  expect(bentleyOttmann(segs)).toBe(1);
});

test("선분 1 개 — 0", () => {
  const segs: Segment[] = [
    [
      [0, 0],
      [1, 1],
    ],
  ];
  expect(bentleyOttmann(segs)).toBe(0);
});

test("선분 0 개 — 0", () => {
  expect(bentleyOttmann([])).toBe(0);
});

test("모두 평행하고 분리됨 — 0", () => {
  const segs: Segment[] = [
    [
      [0, 0],
      [10, 0],
    ],
    [
      [0, 2],
      [10, 2],
    ],
    [
      [0, 4],
      [10, 4],
    ],
  ];
  expect(bentleyOttmann(segs)).toBe(0);
});

test("큰 좌표 ±10^9 — 어긋남 없이 정확", () => {
  const segs: Segment[] = [
    [
      [-1_000_000_000, -1_000_000_000],
      [1_000_000_000, 1_000_000_000],
    ],
    [
      [-1_000_000_000, 1_000_000_000],
      [1_000_000_000, -1_000_000_000],
    ],
  ];
  expect(bentleyOttmann(segs)).toBe(1);
});

test("선분 10,000 개 — 답이 나온다", () => {
  // 원본 테스트의 「성능」 케이스와 같은 생성식이다. 벽시계 판정만 뺐다.
  const total = 10_000;
  const segs: Segment[] = new Array(total);
  for (let at = 0; at < total; at++) {
    segs[at] = [
      [0, at],
      [1, at],
    ];
  }
  expect(bentleyOttmann(segs)).toBe(0);
});

test("본문 전개가 쓰는 선분 다섯 개와 그 답", () => {
  // `deep.build`·`deep.walk`·`.sim.ts`·`.alt.ts` 가 모두 이 입력을 쓴다.
  const walk: Segment[] = [
    [
      [0, 0],
      [8, 8],
    ],
    [
      [0, 6],
      [6, 0],
    ],
    [
      [2, 1],
      [2, 5],
    ],
    [
      [0, 8],
      [8, 4],
    ],
    [
      [9, 0],
      [11, 2],
    ],
  ];
  expect(bentleyOttmann(walk)).toBe(4);
  expect(bentleyOttmann(walk)).toBe(bruteForce(walk));
  // 선분의 순서를 바꿔도 답이 같다.
  expect(bentleyOttmann([...walk].reverse())).toBe(4);
});

test("퇴화 배치를 섞은 작은 좌표 — 전부 대조와 같은 답", () => {
  const next = rng(20_260_907);
  for (let round = 0; round < 600; round++) {
    const count = 3 + (next() % 6);
    const segs: Segment[] = [];
    for (let at = 0; at < count; at++) {
      const ax = next() % 4;
      const ay = next() % 4;
      const kind = next() % 5;
      let bx = next() % 4;
      let by = next() % 4;
      if (kind === 0) {
        bx = ax;
        by = ay;
      } else if (kind === 1) {
        by = ay;
      } else if (kind === 2) {
        bx = ax;
      }
      segs.push([[ax, ay] as Point, [bx, by] as Point]);
    }
    expect(bentleyOttmann(segs)).toBe(bruteForce(segs));
  }
});

test("한 점에 모이는 다발과 같은 직선 위의 다발 — 전부 대조와 같은 답", () => {
  const next = rng(4_242);
  for (let round = 0; round < 300; round++) {
    const segs: Segment[] = [];
    for (let at = 0; at < 3 + (next() % 4); at++) {
      const dx = (next() % 7) - 3;
      const dy = (next() % 7) - 3;
      if (dx === 0 && dy === 0) continue;
      segs.push([[5 - dx, 5 - dy] as Point, [5 + dx, 5 + dy] as Point]);
    }
    const stepX = 1 + (next() % 3);
    const stepY = (next() % 5) - 2;
    for (let at = 0; at < 2 + (next() % 4); at++) {
      const t1 = next() % 8;
      const t2 = next() % 8;
      segs.push([
        [t1 * stepX, t1 * stepY] as Point,
        [t2 * stepX, t2 * stepY] as Point,
      ]);
    }
    expect(bentleyOttmann(segs)).toBe(bruteForce(segs));
  }
});

test("좌표 상한 10^9 무작위 배치 — 전부 대조와 같은 답", () => {
  const next = rng(2_026);
  const bound = 1_000_000_000;
  for (let round = 0; round < 200; round++) {
    const segs: Segment[] = [];
    for (let at = 0; at < 2 + (next() % 8); at++) {
      const ax = (next() % (2 * bound)) - bound;
      const ay = (next() % (2 * bound)) - bound;
      let bx = (next() % (2 * bound)) - bound;
      let by = (next() % (2 * bound)) - bound;
      if (next() % 4 === 0) bx = ax;
      if (next() % 4 === 0) by = ay;
      segs.push([[ax, ay] as Point, [bx, by] as Point]);
    }
    expect(bentleyOttmann(segs)).toBe(bruteForce(segs));
  }
});
