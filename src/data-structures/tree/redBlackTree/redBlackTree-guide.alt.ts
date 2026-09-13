/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력**에 두 설계를 걸고 **결정론적 계수**만 센다. 벽시계·처리량은 실행마다 달라
 * "본문의 수치가 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run tools/bench-alt.ts src/data-structures/tree/redBlackTree/redBlackTree-guide.alt.ts
 *
 * **경쟁 설계는 `tree/splayTree` 의 정본이다.** 연산 집합과 상한이 이 계약과 같고 한정자만
 * `amortized` 로 다르다 — 조회한 자리를 뿌리로 끌어올려, 호출을 모아 평균 내면 로그를 지키지만
 * 호출 하나가 로그를 넘는 것을 허용한다. 두 정본의 `__cost` 단위는 같다 — **노드 하나를
 * 지나갈 때마다 1**, 회전과 색 바꾸기도 지나간 노드로 센다(두 파일의 머리 주석).
 *
 * **입력은 계약 스위트의 「순차 조회」 시나리오와 같은 모양이다** — 0 부터 `N − 1` 까지
 * 오름차순으로 넣고, 0 부터 차례로 `has` 를 부른다. 전개의 스무 번 호출은 원소가 여섯뿐이라
 * 두 설계의 트리 높이가 한두 칸 차이로 붙어 나오고, 규모에 따라 어떻게 벌어지는지가 안 보인다
 * (L20 — 입력을 바꾼 사유를 본문에도 적는다).
 */
import { SplayTree } from "../splayTree/_reference/splayTree.ts";
import { RedBlackTree } from "./_reference/redBlackTree.ts";

/** 대조에 쓰는 원소 수. 계약 스위트 축3 의 첫 크기와 같다. 한 번 정하면 바꾸지 않는다. */
export const N = 1024;

interface Counts {
  [metric: string]: number;
  "넣기 한 번의 최댓값": number;
  "넣기 전체": number;
  "조회 한 번의 최댓값": number;
  "조회 전체": number;
}

interface Tree {
  insert(item: number): void;
  has(item: number): boolean;
  toArray(): number[];
  __cost: number;
}

function measure(make: () => Tree, name: string): Counts {
  const t = make();
  let insertMax = 0;
  const insertStart = t.__cost;
  for (let i = 0; i < N; i++) {
    const before = t.__cost;
    t.insert(i);
    insertMax = Math.max(insertMax, t.__cost - before);
  }
  const insertTotal = t.__cost - insertStart;

  let lookupMax = 0;
  const lookupStart = t.__cost;
  for (let i = 0; i < N; i++) {
    const before = t.__cost;
    if (!t.has(i)) throw new Error(`${name} 이 넣은 값 ${i} 를 못 찾았다`);
    lookupMax = Math.max(lookupMax, t.__cost - before);
  }
  const lookupTotal = t.__cost - lookupStart;

  const listed = t.toArray();
  if (listed.length !== N || listed.some((v, i) => v !== i)) {
    throw new Error(`${name} 의 toArray 가 0 … ${N - 1} 이 아니다`);
  }
  return {
    "넣기 한 번의 최댓값": insertMax,
    "넣기 전체": insertTotal,
    "조회 한 번의 최댓값": lookupMax,
    "조회 전체": lookupTotal,
  };
}

export const cases = {
  "레드블랙 트리": () =>
    measure(() => new RedBlackTree<number>(), "레드블랙 트리"),
  "스플레이 트리": () =>
    measure(() => new SplayTree<number>(), "스플레이 트리"),
};
