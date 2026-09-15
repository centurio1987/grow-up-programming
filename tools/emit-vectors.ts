/**
 * 축1 동작 계약을 **언어 중립 JSON** 으로 뽑는다.
 *
 * 두 번째 언어가 들어오면 축1이 갈라진다. TS 하네스는 `ContractSpec` 을 읽어 참조 모델과
 * 교차검증하는데, Rust 는 그 `ContractSpec` 을 읽을 수 없다. 같은 계약을 두 번 적으면
 * 그 둘이 갈라지고, 갈라진 자리가 곧 이 프로젝트가 고치려는 결함이다.
 *
 * 그래서 **TS 가 정본이고 JSON 은 그 파생물이다.** 이 도구는 `spec.model()`(자명한 참조
 * 모델)을 실제로 돌려 각 단계의 기대값을 기록한다. 사람이 적지 않으므로 두 언어가
 * 어긋날 자리가 없다.
 *
 * 규격의 정본은 `docs/ORD-006-conventions.md` §규약2 「언어 중립 test vector」다.
 *
 * ```bash
 * bun run tools/emit-vectors.ts          # rust/vectors/*.json 재생성
 * bun run tools/emit-vectors.ts --check  # 재생성 결과가 커밋된 것과 같은지만 본다
 * ```
 */

import { join, resolve } from "node:path";
import { rngFrom } from "../src/data-structures/_contract/judge.ts";
import type { ContractSpec } from "../src/data-structures/_contract/runContract.ts";
import { disjointSetRollbackContract } from "../src/data-structures/disjoint-set/disjointSetRollback/disjointSetRollback.contract.ts";
import { unionFindContract } from "../src/data-structures/disjoint-set/unionFind/unionFind.contract.ts";
import { hashMapChainingContract } from "../src/data-structures/hash/hashMapChaining/hashMapChaining.contract.ts";
import { hashSetContract } from "../src/data-structures/hash/hashSet/hashSet.contract.ts";
import { lruCacheContract } from "../src/data-structures/hash/lruCache/lruCache.contract.ts";
import { fibonacciHeapContract } from "../src/data-structures/heap/fibonacciHeap/fibonacciHeap.contract.ts";
import { leftistHeapContract } from "../src/data-structures/heap/leftistHeap/leftistHeap.contract.ts";
import { pairingHeapContract } from "../src/data-structures/heap/pairingHeap/pairingHeap.contract.ts";
import { priorityQueueContract } from "../src/data-structures/heap/priorityQueue/priorityQueue.contract.ts";
import { vanEmdeBoasTreeContract } from "../src/data-structures/heap/vanEmdeBoasTree/vanEmdeBoasTree.contract.ts";
import { circularBufferContract } from "../src/data-structures/linear/circularBuffer/circularBuffer.contract.ts";
import { dequeContract } from "../src/data-structures/linear/deque/deque.contract.ts";
import { gapBufferContract } from "../src/data-structures/linear/gapBuffer/gapBuffer.contract.ts";
import { queueContract } from "../src/data-structures/linear/queue/queue.contract.ts";
import { stackContract } from "../src/data-structures/linear/stack/stack.contract.ts";
import { unrolledLinkedListContract } from "../src/data-structures/linear/unrolledLinkedList/unrolledLinkedList.contract.ts";
import { xorLinkedListContract } from "../src/data-structures/linear/xorLinkedList/xorLinkedList.contract.ts";
import { concurrentSkipListContract } from "../src/data-structures/probabilistic/concurrentSkipList/concurrentSkipList.contract.ts";
import { fenwickTreeContract } from "../src/data-structures/range-query/fenwickTree/fenwickTree.contract.ts";
import { intervalTreeContract } from "../src/data-structures/range-query/intervalTree/intervalTree.contract.ts";
import { persistentSegmentTreeContract } from "../src/data-structures/range-query/persistentSegmentTree/persistentSegmentTree.contract.ts";
import { segmentTreeContract } from "../src/data-structures/range-query/segmentTree/segmentTree.contract.ts";
import {
  segmentTreeLazyContract,
  segmentTreeLazyCountedContract,
} from "../src/data-structures/range-query/segmentTreeLazy/segmentTreeLazy.contract.ts";
import { sparseTableContract } from "../src/data-structures/range-query/sparseTable/sparseTable.contract.ts";
import { binarySearchTreeContract } from "../src/data-structures/tree/binarySearchTree/binarySearchTree.contract.ts";
import { cartesianTreeContract } from "../src/data-structures/tree/cartesianTree/cartesianTree.contract.ts";
import { linkCutTreeContract } from "../src/data-structures/tree/linkCutTree/linkCutTree.contract.ts";
import { multisetContract } from "../src/data-structures/tree/multiset/multiset.contract.ts";
import { orderStatisticTreeContract } from "../src/data-structures/tree/orderStatisticTree/orderStatisticTree.contract.ts";
import { redBlackTreeContract } from "../src/data-structures/tree/redBlackTree/redBlackTree.contract.ts";
import { scapegoatTreeContract } from "../src/data-structures/tree/scapegoatTree/scapegoatTree.contract.ts";
import { splayTreeContract } from "../src/data-structures/tree/splayTree/splayTree.contract.ts";
import { treapContract } from "../src/data-structures/tree/treap/treap.contract.ts";
import { suffixArrayContract } from "../src/data-structures/trie/suffixArray/suffixArray.contract.ts";
import { suffixTreeContract } from "../src/data-structures/trie/suffixTree/suffixTree.contract.ts";
import { ternarySearchTreeContract } from "../src/data-structures/trie/ternarySearchTree/ternarySearchTree.contract.ts";

const root = resolve(import.meta.dir, "..");
const OUT_DIR = "rust/vectors";

/** 무작위 시퀀스의 길이. 파일 크기와 검출력의 교환점이다. */
const RANDOM_STEPS = 200;
/** 무작위 시퀀스 seed. TS 하네스 축1과 같은 값을 쓴다. */
const RANDOM_SEED = 1;

interface VectorStep {
  op: string;
  /** 인자가 없는 연산은 생략한다. */
  arg?: unknown;
  /**
   * 참조 모델이 돌려준 값. **반환이 없는 연산은 이 열쇠 자체가 없다.**
   * `null` 을 돌려주는 연산(빈 스택의 `pop`)과 구분해야 하므로 `null` 로 뭉뚱그리지 않는다.
   */
  expect?: unknown;
}

interface VectorCase {
  name: string;
  /** `edge` = 계약이 손으로 짚은 경계, `random` = 결정적 난수 시퀀스. */
  kind: "edge" | "random";
  steps: VectorStep[];
}

interface Vector {
  schema: "ord006/contract-vector@1";
  structure: string;
  grade: string;
  /** 스위트가 도는 원소 타입. 지금은 전 구조가 `number` 다(§규약2). */
  element: "number";
  cases: VectorCase[];
}

/** 참조 모델을 돌려 한 단계의 기대값을 만든다. 반환이 없으면 `expect` 를 붙이지 않는다. */
function record(step: VectorStep, observed: unknown): VectorStep {
  if (observed === undefined) return step;
  return { ...step, expect: observed };
}

function buildVector<Impl, Model>(spec: ContractSpec<Impl, Model>): Vector {
  const byName = new Map(spec.ops.map((op) => [op.name, op] as const));
  const cases: VectorCase[] = [];

  for (const edge of spec.edges) {
    const model = spec.model();
    const steps: VectorStep[] = [];
    for (const step of edge.steps) {
      const op = byName.get(step.op);
      if (op === undefined) {
        throw new Error(
          `${spec.name} 의 경계 케이스 "${edge.name}" 가 없는 연산을 부른다: ${step.op}`,
        );
      }
      const base: VectorStep =
        step.arg === undefined
          ? { op: step.op }
          : { op: step.op, arg: step.arg };
      steps.push(record(base, op.onModel(model, step.arg)));
    }
    cases.push({ name: edge.name, kind: "edge", steps });
  }

  const rng = rngFrom(RANDOM_SEED);
  const model = spec.model();
  const steps: VectorStep[] = [];
  for (let index = 0; index < RANDOM_STEPS; index++) {
    const op = spec.ops[Math.floor(rng() * spec.ops.length)];
    if (op === undefined)
      throw new Error(`${spec.name} 의 연산 목록이 비어 있다`);
    const arg = op.arg(rng);
    const base: VectorStep =
      arg === undefined ? { op: op.name } : { op: op.name, arg };
    steps.push(record(base, op.onModel(model, arg)));
  }
  cases.push({
    name: `무작위 시퀀스 seed=${RANDOM_SEED} ${RANDOM_STEPS}회`,
    kind: "random",
    steps,
  });

  return {
    schema: "ord006/contract-vector@1",
    structure: spec.name,
    grade: spec.grade,
    element: "number",
    cases,
  };
}

/**
 * 등록 목록. **구조 경로 알파벳 순으로 고정한다**(`docs/ORD-006-wbs.md` §4).
 *
 * 병렬 배치가 저마다 자기 구조를 여기 더하므로 순서가 자유로우면 같은 자리에 두 줄이
 * 들어와 충돌한다. 순서가 고정이면 충돌이 나도 **양쪽을 살리는 해결이 유일하다.**
 * B20 에서 실제로 이 파일이 충돌해 등록 하나를 다음 배치로 미뤘다.
 */
// biome-ignore lint/suspicious/noExplicitAny: 여러 구조의 spec 을 한 배열에 담는 자리다
const SPECS: ContractSpec<any, any>[] = [
  // 성격 전환은 등록하지 않는다 — 같은 계약 객체에 `name` 만 다르므로 vector 가 같다
  // (`avlTree`·`bTree` 계열이 같은 선례다).
  // 케이스의 앞 아홉이 `UnionFind.json` 의 경계 케이스와 같다 — `disjoint-set/unionFind` 의 경계 케이스 객체를
  // 그대로 펼쳐 넣었기 때문이다(`disjointSetRollback.contract.ts` 머리말). `reset` 과 `"RangeError"` 는 아래
  // `unionFindContract` 주석과 같다. `rollback` 은 인자가 없고 기대값이 `true`/`false` 다 — 되돌리는 단위는
  // **합치기 호출**이라 아무것도 안 바꾼 `union` 도 하나로 세고 던진 `union` 은 세지 않는다. 받아들인 `reset` 은
  // 되돌릴 호출을 비운다.
  disjointSetRollbackContract,
  // 연산 `reset(원소 수)` 은 계약 표의 연산이 아니라 껍데기(`PartitionSite`)가 생성자 행을 나르는 자리다 —
  // 받아들이면 그 크기의 홀로 선 원소들로 새로 세운다(`unionFind.contract.ts` 머리말). 경계 케이스가 아닌
  // 케이스는 원소 48 에서 시작하고 무작위 시퀀스는 거절되는 원소 수만 넘긴다. 기대값 `"RangeError"` 는 던진
  // 예외를 관측값으로 바꾼 것이다. `find` 의 기대값은 그 집합의 가장 작은 원소라 재생하는 쪽이 뿌리를 그대로
  // 돌려주면 갈린다.
  unionFindContract,
  hashMapChainingContract,
  hashSetContract,
  // 연산 `reset(용량)` 은 계약 표의 연산이 아니라 껍데기(`CacheSite`)가 생성자 행을 나르는 자리다 —
  // 받아들이면 그 용량의 빈 캐시를 새로 세운다(`lruCache.contract.ts` 머리말). 경계 케이스가 아닌 케이스는
  // 용량 4 에서 시작하고 무작위 시퀀스는 거절되는 용량만 넘긴다. 기대값 `"RangeError"` 는 던진 예외를
  // 관측값으로 바꾼 것이다. 펴기는 키를 그대로 돌려주는 함수다 — 재생하는 쪽이 칸을 어떻게 정하든 답은 같다.
  lruCacheContract,
  // 케이스의 앞 여덟이 `LeftistHeap.json` 의 경계 케이스와 같다 — `heap/leftistHeap` 의 경계 케이스
  // 객체를 그대로 펼쳐 넣었기 때문이다(`fibonacciHeap.contract.ts` 머리말). `decreaseKey` 의 인자
  // `[번호, 값]` 의 번호는 **받은 핸들을 받은 순서로 센 것**이고 핸들 수로 나눈 나머지로 읽는다 —
  // 이 vector 를 재생하는 쪽이 껍데기(`DecreaseSite`)의 그 규칙을 함께 옮겨야 한다.
  fibonacciHeapContract,
  leftistHeapContract,
  // 케이스가 `LeftistHeap.json` 과 같다 — 두 계약이 의미 열을 같은 객체로 쓰기 때문이다
  // (`pairingHeap.contract.ts` 머리말). 성격 전환과 달리 **다른 계약**이라 등록한다.
  pairingHeapContract,
  priorityQueueContract,
  // 연산 `reset(우주 크기)` 은 계약 표의 연산이 아니라 껍데기(`UniverseSite`)가 생성자 행을 나르는
  // 자리다 — 받아들이면 그 크기의 빈 구조를 새로 세우고 담긴 것이 사라진다(`vanEmdeBoasTree.contract.ts`
  // 머리말). 경계 케이스가 아닌 케이스는 우주 100 에서 시작하고, 무작위 시퀀스는 거절되는 우주만 넘긴다.
  // 기대값 `"RangeError"` 는 던진 예외를 관측값으로 바꾼 것이다.
  vanEmdeBoasTreeContract,
  circularBufferContract,
  dequeContract,
  gapBufferContract,
  queueContract,
  stackContract,
  unrolledLinkedListContract,
  xorLinkedListContract,
  // 이 구조만 vector 의 쓰임이 다르다. 나머지는 TS 하네스가 이미 축1을 돌고 vector 는 Rust
  // 포트를 위한 파생물인데, `concurrency` 등급은 TS 스위트가 돌지 않으므로 **vector 가 축1의
  // 유일한 경로**다(§규약2 「축4 — 동시성」).
  concurrentSkipListContract,
  fenwickTreeContract,
  intervalTreeContract,
  // `update` 의 인자 `[버전, 자리, 값]` · `query` 의 인자 `[버전, from, to]` 에서 **버전 자리가 음수가 아니면 지금 있는 버전 수로 나눈
  // 나머지로 읽는다** — 경계 케이스는 번호가 작아 그대로이고 무작위 시퀀스가 이 규칙을 쓴다(`persistentSegmentTree.contract.ts`
  // 머리말 · `VersionedSized#pick`). 재생하는 쪽이 받아들인 갱신 수를 세어 같은 규칙을 옮겨야 한다. `update` 의 기대값은 지은
  // 버전의 번호이고 결합은 `segmentTree` 와 같은 `firstNonZero`(항등원 0), 초기 수열은 `initialValues(16)` 이다.
  persistentSegmentTreeContract,
  segmentTreeContract,
  // `apply` 의 인자는 `[from, to, update]` 이고 대수는 스위트의 것이다 — 결합은 `segmentTree` 와 같은 「왼쪽에서 처음
  // 만나는 0 아닌 값」(항등원 0), 갱신은 「0 이 아닌 `update` 는 덮는 자리를 그 수로 덮고 0 은 그대로 둔다」, 합성은
  // 「나중 것이 0 이 아니면 나중 것」(`segmentTreeLazy.contract.ts` 의 `coverAct`·`coverCompose`). 재생하는 쪽이 이
  // 넷을 함께 옮겨야 한다. 초기 수열은 `segmentTree` 와 같은 `initialValues(16)` 이다.
  segmentTreeLazyContract,
  // **같은 구조의 둘째 벌이다**(S20) — 다른 계약이 아니라 같은 계약을 자리 수가 값을 바꾸는 대수로 한 번 더 돈 것이다. 결합은
  // 합(항등원 0), 갱신은 「덮는 자리마다 `update` 를 더한다」(`act(u, v, k) = v + u·k`), 합성은 더하기이고 초기 수열은
  // `initialValues(13)` 이다(`segmentTreeLazy.contract.ts` 의 `sum`·`addAct`·`addCompose`·`COUNTED_SLOTS`). 위 파일의 대수는
  // 자리 수를 0 과 그 밖만 가르므로 **재생하는 쪽이 둘 다 돌아야** 자리 수 오전달이 걸린다.
  segmentTreeLazyCountedContract,
  // 연산 `reindex(수열)` 은 계약 표의 연산이 아니라 불변 구조의 껍데기(`Reindexable`)가 생성자 행을 나르는 자리다 — 받은 수열로 새로
  // 짓는다(`sparseTable.contract.ts` 머리말 · 불변 사실 52 ④). 처음 색인은 빈 수열이다. `query` 의 인자 `[a, b]` 는 **음수가 아니면
  // 지금 수열 길이 + 1 로 나눈 나머지로 읽고 둘을 작은 것부터 늘어놓는다** — 둘 중 하나라도 음수면 그대로 넘긴다. 결합은 멱등인
  // `firstNonZero`(항등원 0)이고 기대값 `"RangeError"` 는 던진 예외를 관측값으로 바꾼 것이다.
  sparseTableContract,
  binarySearchTreeContract,
  cartesianTreeContract,
  linkCutTreeContract,
  multisetContract,
  orderStatisticTreeContract,
  redBlackTreeContract,
  scapegoatTreeContract,
  splayTreeContract,
  treapContract,
  suffixArrayContract,
  suffixTreeContract,
  ternarySearchTreeContract,
];

const check = Bun.argv.includes("--check");
const drifted: string[] = [];

for (const spec of SPECS) {
  const vector = buildVector(spec);
  const path = join(OUT_DIR, `${vector.structure}.json`);
  const text = `${JSON.stringify(vector, null, 2)}\n`;

  if (check) {
    const existing = Bun.file(join(root, path));
    const current = (await existing.exists()) ? await existing.text() : "";
    if (current !== text) drifted.push(path);
    continue;
  }
  await Bun.write(join(root, path), text);
  console.log(`${path} — 케이스 ${vector.cases.length}개`);
}

if (check) {
  if (drifted.length > 0) {
    console.error(
      `test vector 가 계약과 어긋난다: ${drifted.join(", ")}\n` +
        "`bun run tools/emit-vectors.ts` 로 다시 뽑고 커밋한다.",
    );
    process.exit(1);
  }
  console.log(`test vector ${SPECS.length}종이 계약과 일치한다.`);
}
