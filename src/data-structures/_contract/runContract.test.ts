/**
 * 하네스 자신에 대한 시험.
 *
 * 계약 스위트가 **통과시키는지**만 보면 아무것도 증명되지 않는다. 아무 검사도 하지 않는
 * 스위트가 그 시험을 통과한다. 그래서 여기서 보는 것은 반대쪽이다 — 계약을 어긴 구현을
 * 실제로 **떨어뜨리는가**.
 *
 * `_fixtures/` 의 결함 fixture 는 **전부 동작상 옳다.** 축1·축2로는 잡히지 않고 축3만이
 * 잡는다. 축2가 잡는 종류의 결함은 성격이 반대라 여기 인라인으로 둔다 — 그쪽은 동작이
 * 틀린 구현이고, 그 자리에서 무엇이 깨졌는지를 이름으로 말하는 것이 불변식의 일이다.
 */

import { describe, expect, test } from "bun:test";
import {
  type DequeContract,
  dequeContract,
} from "../linear/deque/deque.contract";
import { Queue as ReferenceQueue } from "../linear/queue/_reference/queue";
import {
  type QueueContract,
  queueContract,
} from "../linear/queue/queue.contract";
import { Stack as ReferenceStack } from "../linear/stack/_reference/stack";
import {
  type StackContract,
  stackContract,
} from "../linear/stack/stack.contract";
import { UnrolledLinkedList as ReferenceUnrolledLinkedList } from "../linear/unrolledLinkedList/_reference/unrolledLinkedList";
import {
  type UnrolledLinkedListContract,
  unrolledLinkedListContract,
} from "../linear/unrolledLinkedList/unrolledLinkedList.contract";
import { XorLinkedList as ReferenceXorLinkedList } from "../linear/xorLinkedList/_reference/xorLinkedList";
import {
  type XorLinkedListContract,
  xorLinkedListContract,
} from "../linear/xorLinkedList/xorLinkedList.contract";
import { IntervalTree as ReferenceIntervalTree } from "../range-query/intervalTree/_reference/intervalTree";
import {
  type IntervalTreeContract,
  intervalTreeContract,
} from "../range-query/intervalTree/intervalTree.contract";
import { BinarySearchTree as ReferenceBinarySearchTree } from "../tree/binarySearchTree/_reference/binarySearchTree";
import { binarySearchTreeContract } from "../tree/binarySearchTree/binarySearchTree.contract";
import { CartesianTree as ReferenceCartesianTree } from "../tree/cartesianTree/_reference/cartesianTree";
import {
  Walkable as CartesianTreeShell,
  cartesianTreeContract,
} from "../tree/cartesianTree/cartesianTree.contract";
import { LinkCutTree as ReferenceLinkCutTree } from "../tree/linkCutTree/_reference/linkCutTree";
import {
  Sized as LinkCutTreeShell,
  linkCutTreeContract,
} from "../tree/linkCutTree/linkCutTree.contract";
import { Multiset as ReferenceMultiset } from "../tree/multiset/_reference/multiset";
import {
  type MultisetContract,
  multisetContract,
} from "../tree/multiset/multiset.contract";
import { OrderStatisticTree as ReferenceOrderStatisticTree } from "../tree/orderStatisticTree/_reference/orderStatisticTree";
import {
  type OrderStatisticTreeContract,
  orderStatisticTreeContract,
} from "../tree/orderStatisticTree/orderStatisticTree.contract";
import { RedBlackTree as ReferenceRedBlackTree } from "../tree/redBlackTree/_reference/redBlackTree";
import {
  type RedBlackTreeContract,
  redBlackTreeContract,
} from "../tree/redBlackTree/redBlackTree.contract";
import { ScapegoatTree as ReferenceScapegoatTree } from "../tree/scapegoatTree/_reference/scapegoatTree";
import { scapegoatTreeContract } from "../tree/scapegoatTree/scapegoatTree.contract";
import { SplayTree as ReferenceSplayTree } from "../tree/splayTree/_reference/splayTree";
import { splayTreeContract } from "../tree/splayTree/splayTree.contract";
import { Treap as ReferenceTreap } from "../tree/treap/_reference/treap";
import { treapContract } from "../tree/treap/treap.contract";
import { SuffixArray as ReferenceSuffixArray } from "../trie/suffixArray/_reference/suffixArray";
import {
  Rebuildable as SuffixArrayShell,
  suffixArrayContract,
} from "../trie/suffixArray/suffixArray.contract";
import { SuffixTree as ReferenceSuffixTree } from "../trie/suffixTree/_reference/suffixTree";
import {
  Rebuildable as SuffixTreeShell,
  suffixTreeContract,
} from "../trie/suffixTree/suffixTree.contract";
import { TernarySearchTree as ReferenceTernarySearchTree } from "../trie/ternarySearchTree/_reference/ternarySearchTree";
import {
  type TernarySearchTreeContract,
  ternarySearchTreeContract,
} from "../trie/ternarySearchTree/ternarySearchTree.contract";
import { FixedChunkList } from "./_fixtures/fixedChunkList";
import { FrontPushStack } from "./_fixtures/frontPushStack";
import { KeyCountingMultiset } from "./_fixtures/keyCountingMultiset";
import { LazySortingSet } from "./_fixtures/lazySortingSet";
import { MapWordSet } from "./_fixtures/mapWordSet";
import { PathCopyingCartesianTree } from "./_fixtures/pathCopyingCartesianTree";
import { RecountingSizeSet } from "./_fixtures/recountingSizeSet";
import { RelabelingForest } from "./_fixtures/relabelingForest";
import { RescanningCartesianView } from "./_fixtures/rescanningCartesianView";
import { RootedSuffixTree } from "./_fixtures/rootedSuffixTree";
import { ScanIntervalList } from "./_fixtures/scanIntervalList";
import { ScanningCartesianTree } from "./_fixtures/scanningCartesianTree";
import { ScanningForest } from "./_fixtures/scanningForest";
import { ScanningSuffixArray } from "./_fixtures/scanningSuffixArray";
import { ScanningSuffixTree } from "./_fixtures/scanningSuffixTree";
import { ShiftQueue } from "./_fixtures/shiftQueue";
import { SortedArrayMultiset } from "./_fixtures/sortedArrayMultiset";
import { SortedArraySet } from "./_fixtures/sortedArraySet";
import { SortedSuffixArray } from "./_fixtures/sortedSuffixArray";
import { SortedWordSet } from "./_fixtures/sortedWordSet";
import { SplayingSearchTree } from "./_fixtures/splayingSearchTree";
import { SpliceArrayList } from "./_fixtures/spliceArrayList";
import { StaleEndCacheSet } from "./_fixtures/staleEndCacheSet";
import { TailScanList } from "./_fixtures/tailScanList";
import { TwoArrayDeque } from "./_fixtures/twoArrayDeque";
import { UnbalancedIntervalTree } from "./_fixtures/unbalancedIntervalTree";
import { UnbalancedRankedMultiset } from "./_fixtures/unbalancedRankedMultiset";
import { UnbalancedSearchTree } from "./_fixtures/unbalancedSearchTree";
import { UnshiftDeque } from "./_fixtures/unshiftDeque";
import { UnshiftQueue } from "./_fixtures/unshiftQueue";
import { UnsplayedForest } from "./_fixtures/unsplayedForest";
import { expectedRatio, judgeGrowth, statistic } from "./judge";
import {
  type CostScenario,
  type CostSource,
  judgeScenario,
} from "./runContract";

function scenarioOf<Impl>(
  spec: { scenarios: readonly CostScenario<Impl>[] },
  covers: string,
  adversarial: boolean,
): CostScenario<Impl> {
  const found = spec.scenarios.find(
    (scenario) =>
      scenario.covers.includes(covers) && scenario.adversarial === adversarial,
  );
  if (!found)
    throw new Error(`시나리오를 못 찾았다: ${covers} (적대적=${adversarial})`);
  return found;
}

describe("판정 — 순수 부분", () => {
  test("기대 비율은 상한에서 나온다", () => {
    expect(expectedRatio("O(1)", 1024)).toBe(1);
    expect(expectedRatio("O(n)", 1024)).toBe(4);
    // log2(4096)/log2(1024) = 12/10
    expect(expectedRatio("O(log n)", 1024)).toBeCloseTo(1.2, 10);
    expect(expectedRatio("O(log n)", 4096)).toBeCloseTo(14 / 12, 10);
    // sqrt(4n)/sqrt(n) = 2. n 에 기대지 않는 유일한 비상수 상한이다.
    expect(expectedRatio("O(sqrt n)", 1024)).toBe(2);
    expect(expectedRatio("O(sqrt n)", 16384)).toBe(2);
  });

  test("판정은 상한을 넘는 쪽만이 아니라 성장 계급을 벗어나는 쪽 전부를 잡는다", () => {
    // O(sqrt n) 계약에 O(log n) 구현을 넣으면 계약을 **어기지 않았는데도** 실패한다.
    // 축3은 "상한 이하인가"가 아니라 "적어 놓은 계급인가"를 본다. 정본을 고를 때
    // 계약보다 빠른 구현을 쓸 수 없는 이유가 이것이다(§규약2).
    const faster = judgeGrowth("O(sqrt n)", "discriminating", [
      { n: 1024, stat: 10 },
      { n: 4096, stat: 12 },
    ]);
    expect(faster.ok).toBe(false);
    expect(faster.reason).toContain("O(sqrt n)");
  });

  test("로그 인수 하나는 이 사다리에서 판별되지 않는다", () => {
    // n log n 의 기대 비율은 4·log2(4n)/log2(n) 이다. n=1024 에서 4.8.
    expect(expectedRatio("O(n log n)", 1024)).toBeCloseTo(4.8, 10);
    expect(expectedRatio("O(n log n)", 4096)).toBeCloseTo(4 * (14 / 12), 10);

    // **그리고 그 값은 O(n) 의 4.0 과 서로의 허용 구간 안에 있다.** 크기가 4배씩 오르는
    // 사다리에서 로그 인수 하나가 바꾸는 비율은 1.2 배뿐이고 허용치가 ±30% 이기 때문이다.
    // 선형 구현이 O(n log n) 계약을 통과하고, n log n 구현이 O(n) 계약을 통과한다.
    const linearPoints = [
      { n: 1024, stat: 1000 },
      { n: 4096, stat: 4000 },
    ];
    expect(judgeGrowth("O(n log n)", "discriminating", linearPoints).ok).toBe(
      true,
    );
    const linearithmicPoints = [
      { n: 1024, stat: 1000 },
      { n: 4096, stat: 4800 },
    ];
    expect(judgeGrowth("O(n)", "discriminating", linearithmicPoints).ok).toBe(
      true,
    );

    // 같은 이유로 O(1)(1.0)과 O(log n)(1.2)도 갈리지 않는다. 로그 인수의 자리가 위든
    // 아래든 결과가 같다.
    const logarithmicPoints = [
      { n: 1024, stat: 1000 },
      { n: 4096, stat: 1200 },
    ];
    expect(judgeGrowth("O(1)", "discriminating", logarithmicPoints).ok).toBe(
      true,
    );

    // 이 상한이 실제로 가르는 것은 이차 이탈이다 — 거기서는 비율이 16 이라 겹치지 않는다.
    const quadraticPoints = [
      { n: 1024, stat: 1000 },
      { n: 4096, stat: 16000 },
    ];
    expect(
      judgeGrowth("O(n log n)", "discriminating", quadraticPoints).ok,
    ).toBe(false);
  });

  test("한정자는 기대 비율이 아니라 통계를 바꾼다", () => {
    const samples = [[1, 1, 10]];
    expect(statistic("worst", samples)).toBe(10);
    expect(statistic("amortized", samples)).toBeCloseTo(4, 10);
    expect(statistic("expected", [[2], [4], [100], [1], [3]])).toBe(3);
  });

  test("허용치 안이면 통과하고 벗어나면 실패한다", () => {
    const onTarget = judgeGrowth("O(1)", "discriminating", [
      { n: 1024, stat: 1 },
      { n: 4096, stat: 1.2 },
    ]);
    expect(onTarget.ok).toBe(true);

    const drifted = judgeGrowth("O(1)", "discriminating", [
      { n: 1024, stat: 1 },
      { n: 4096, stat: 4 },
    ]);
    expect(drifted.ok).toBe(false);
    expect(drifted.reason).toContain("O(1)");
  });

  test("회귀 수준은 O(1) 과 O(log n) 을 구분하지 않지만 O(n) 이탈은 잡는다", () => {
    const logLike = judgeGrowth("O(1)", "regression", [
      { n: 1024, stat: 1 },
      { n: 4096, stat: 1.2 },
    ]);
    expect(logLike.ok).toBe(true);

    const linear = judgeGrowth("O(1)", "regression", [
      { n: 1024, stat: 1 },
      { n: 4096, stat: 4 },
    ]);
    expect(linear.ok).toBe(false);
  });

  test("계측이 비었거나 간격이 4배가 아니면 판정 자체를 거부한다", () => {
    expect(
      judgeGrowth("O(1)", "regression", [
        { n: 1024, stat: 0 },
        { n: 4096, stat: 0 },
      ]).reason,
    ).toContain("계측이 비어 있으면");

    expect(
      judgeGrowth("O(1)", "regression", [
        { n: 1024, stat: 1 },
        { n: 2048, stat: 1 },
      ]).reason,
    ).toContain("4배 간격");
  });
});

const referenceStack: CostSource<StackContract<number>> = {
  kind: "self-reported",
  make: () => new ReferenceStack<number>(),
};

const frontPushStack: CostSource<StackContract<number>> = {
  kind: "self-reported",
  make: () => new FrontPushStack<number>(),
};

const unshiftDeque: CostSource<DequeContract<number>> = {
  kind: "self-reported",
  make: () => new UnshiftDeque<number>(),
};

const twoArrayDeque: CostSource<DequeContract<number>> = {
  kind: "self-reported",
  make: () => new TwoArrayDeque<number>(),
};

const referenceMultiset: CostSource<MultisetContract<number>> = {
  kind: "injected",
  make: (tick) =>
    new ReferenceMultiset<number>((a, b) => {
      tick();
      return a - b;
    }),
};

function sortedArrayMultiset(
  honest: boolean,
): CostSource<MultisetContract<number>> {
  return {
    kind: "injected",
    make: (tick) =>
      new SortedArrayMultiset<number>(
        (a, b) => {
          tick();
          return a - b;
        },
        { honest },
      ),
  };
}

const referenceIntervalTree: CostSource<IntervalTreeContract> = {
  kind: "self-reported",
  make: () => new ReferenceIntervalTree(),
};

const unbalancedIntervalTree: CostSource<IntervalTreeContract> = {
  kind: "self-reported",
  make: () => new UnbalancedIntervalTree(),
};

const scanIntervalList: CostSource<IntervalTreeContract> = {
  kind: "self-reported",
  make: () => new ScanIntervalList(),
};

const referenceXorLinkedList: CostSource<XorLinkedListContract> = {
  kind: "self-reported",
  make: () => new ReferenceXorLinkedList(),
};

const tailScanList: CostSource<XorLinkedListContract> = {
  kind: "self-reported",
  make: () => new TailScanList(),
};

const referenceUnrolledLinkedList: CostSource<
  UnrolledLinkedListContract<number>
> = {
  kind: "self-reported",
  make: () => new ReferenceUnrolledLinkedList<number>(),
};

const fixedChunkList: CostSource<UnrolledLinkedListContract<number>> = {
  kind: "self-reported",
  make: () => new FixedChunkList<number>(),
};

/**
 * 불변 구조의 계측 대상은 껍데기다.
 *
 * `Rebuildable` 은 계약의 일부가 아니라 하네스가 요구하는 「연산을 이어 붙인다」는 모양에
 * 대한 적응이다(각 `.contract.ts` 참고). 비용은 껍데기가 버린 색인까지 합쳐 센다.
 */
const referenceSuffixArray: CostSource<SuffixArrayShell> = {
  kind: "self-reported",
  make: () => new SuffixArrayShell((s) => new ReferenceSuffixArray(s)),
};
const sortedSuffixArray: CostSource<SuffixArrayShell> = {
  kind: "self-reported",
  make: () => new SuffixArrayShell((s) => new SortedSuffixArray(s)),
};
const scanningSuffixArray: CostSource<SuffixArrayShell> = {
  kind: "self-reported",
  make: () => new SuffixArrayShell((s) => new ScanningSuffixArray(s)),
};
const referenceSuffixTree: CostSource<SuffixTreeShell> = {
  kind: "self-reported",
  make: () => new SuffixTreeShell((s) => new ReferenceSuffixTree(s)),
};
const rootedSuffixTree: CostSource<SuffixTreeShell> = {
  kind: "self-reported",
  make: () => new SuffixTreeShell((s) => new RootedSuffixTree(s)),
};
const scanningSuffixTree: CostSource<SuffixTreeShell> = {
  kind: "self-reported",
  make: () => new SuffixTreeShell((s) => new ScanningSuffixTree(s)),
};

const referenceQueue: CostSource<QueueContract<number>> = {
  kind: "self-reported",
  make: () => new ReferenceQueue<number>(),
};
const shiftQueue: CostSource<QueueContract<number>> = {
  kind: "self-reported",
  make: () => new ShiftQueue<number>(),
};
const unshiftQueue: CostSource<QueueContract<number>> = {
  kind: "self-reported",
  make: () => new UnshiftQueue<number>(),
};

const referenceTernarySearchTree: CostSource<TernarySearchTreeContract> = {
  kind: "self-reported",
  make: () => new ReferenceTernarySearchTree(),
};
const mapWordSet: CostSource<TernarySearchTreeContract> = {
  kind: "self-reported",
  make: () => new MapWordSet(),
};
const sortedWordSet: CostSource<TernarySearchTreeContract> = {
  kind: "self-reported",
  make: () => new SortedWordSet(),
};

const spliceArrayList: CostSource<UnrolledLinkedListContract<number>> = {
  kind: "self-reported",
  make: () => new SpliceArrayList<number>(),
};

const referenceRedBlackTree: CostSource<RedBlackTreeContract<number>> = {
  kind: "self-reported",
  make: () => new ReferenceRedBlackTree<number>(),
};
const unbalancedSearchTree: CostSource<RedBlackTreeContract<number>> = {
  kind: "self-reported",
  make: () => new UnbalancedSearchTree<number>(),
};
const sortedArraySet: CostSource<RedBlackTreeContract<number>> = {
  kind: "self-reported",
  make: () => new SortedArraySet<number>(),
};
const splayingSearchTree: CostSource<RedBlackTreeContract<number>> = {
  kind: "self-reported",
  make: () => new SplayingSearchTree<number>(),
};

const referenceSplayTree: CostSource<RedBlackTreeContract<number>> = {
  kind: "self-reported",
  make: () => new ReferenceSplayTree<number>(),
};
const referenceScapegoatTree: CostSource<RedBlackTreeContract<number>> = {
  kind: "self-reported",
  make: () => new ReferenceScapegoatTree<number>(),
};
const referenceTreap: CostSource<RedBlackTreeContract<number>> = {
  kind: "self-reported",
  make: () => new ReferenceTreap<number>(),
};

/**
 * 상한 없는 정렬 집합(`tree/binarySearchTree`)의 정본과 그 계약의 결함 셋.
 *
 * 표면이 나란한 넷과 같으므로 `RedBlackTreeContract` 를 그대로 쓴다 — 갈리는 것은 계약의
 * 상한이고 타입이 아니다.
 */
const referenceBinarySearchTree: CostSource<RedBlackTreeContract<number>> = {
  kind: "self-reported",
  make: () => new ReferenceBinarySearchTree<number>(),
};
const staleEndCacheSet: CostSource<RedBlackTreeContract<number>> = {
  kind: "self-reported",
  make: () => new StaleEndCacheSet<number>(),
};
const recountingSizeSet: CostSource<RedBlackTreeContract<number>> = {
  kind: "self-reported",
  make: () => new RecountingSizeSet<number>(),
};
const lazySortingSet: CostSource<RedBlackTreeContract<number>> = {
  kind: "self-reported",
  make: () => new LazySortingSet<number>(),
};

/**
 * 위치 좌표계를 가진 정렬 다중집합(`tree/orderStatisticTree`)의 정본과 결함 둘.
 *
 * **결함 둘의 표면이 정본과 같으므로 세 CostSource 가 같은 타입을 쓴다.** 셋을 두 계약에
 * 넣어 보는 것이 아래 「포섭」 자리이고, `keyCountingMultiset` 은 `tree/multiset` 계약의
 * 표면도 만족하므로 그쪽 스위트에도 그대로 들어간다.
 */
const referenceOrderStatisticTree: CostSource<
  OrderStatisticTreeContract<number>
> = {
  kind: "self-reported",
  make: () => new ReferenceOrderStatisticTree<number>(),
};
const keyCountingMultiset: CostSource<OrderStatisticTreeContract<number>> = {
  kind: "self-reported",
  make: () => new KeyCountingMultiset<number>(),
};
const unbalancedRankedMultiset: CostSource<OrderStatisticTreeContract<number>> =
  {
    kind: "self-reported",
    make: () => new UnbalancedRankedMultiset<number>(),
  };

/**
 * 같은 것 셋을 담기는 쪽 계약의 표면으로 다시 적는다.
 *
 * **교차가 한 방향으로만 되는 것이 포섭의 다른 모습이다.** 담는 쪽 계약의 표면은 담기는 쪽의
 * 표면을 포함하므로 이 방향은 그냥 되고, 반대 방향은 안 된다 — `tree/multiset` 정본에는
 * `rankOf`·`at` 이 아예 없다. 한정자만 갈린 계약끼리는 표면이 같아 양방향이 다 됐다
 * (불변 사실 100·107). **연산 집합이 갈린 계약에서는 그 대칭이 없다.**
 */
const referenceOrderStatisticTreeAsMultiset: CostSource<
  MultisetContract<number>
> = {
  kind: "self-reported",
  make: () => new ReferenceOrderStatisticTree<number>(),
};
const keyCountingAsMultiset: CostSource<MultisetContract<number>> = {
  kind: "self-reported",
  make: () => new KeyCountingMultiset<number>(),
};
const unbalancedRankedAsMultiset: CostSource<MultisetContract<number>> = {
  kind: "self-reported",
  make: () => new UnbalancedRankedMultiset<number>(),
};

/**
 * 수열이 정하는 트리(`tree/cartesianTree`)의 정본과 결함 셋.
 *
 * **불변 구조라 넷 다 껍데기를 쓴다**(불변 사실 52 ④). 이 껍데기는 `suffixArray` 의 것보다
 * 하나 더 하는데, 다시 색인하는 것에 더해 **지금 서 있는 마디를 자리로 든다.** `left()`·
 * `right()` 가 값이 아니라 객체를 돌려주므로 걸음을 껍데기가 대신 밟아야 「한 걸음의 비용」을
 * 잴 수 있다.
 *
 * 결함 셋이 계약의 서로 다른 자리를 짚는다 — 구성만 · 훑기만 · **깊이에 비례하는 훑기.**
 */
const referenceCartesianTree: CostSource<CartesianTreeShell<number>> = {
  kind: "self-reported",
  make: () =>
    new CartesianTreeShell<number>((seq) => new ReferenceCartesianTree(seq)),
};
const scanningCartesianTree: CostSource<CartesianTreeShell<number>> = {
  kind: "self-reported",
  make: () =>
    new CartesianTreeShell<number>((seq) => new ScanningCartesianTree(seq)),
};
const rescanningCartesianView: CostSource<CartesianTreeShell<number>> = {
  kind: "self-reported",
  make: () =>
    new CartesianTreeShell<number>((seq) => new RescanningCartesianView(seq)),
};
const pathCopyingCartesianTree: CostSource<CartesianTreeShell<number>> = {
  kind: "self-reported",
  make: () =>
    new CartesianTreeShell<number>((seq) => new PathCopyingCartesianTree(seq)),
};

/**
 * 동적 숲(`tree/linkCutTree`)의 정본과 결함 셋.
 *
 * **넷 다 껍데기를 쓴다**(불변 사실 52 ④). 여기서 껍데기가 나르는 것은 **마디 수**다 —
 * 이 구조는 생성자가 크기를 받고 그 뒤로 크기가 바뀌지 않으므로, 사다리를 오르려면
 * 시나리오가 그 크기의 숲을 다시 세워야 한다.
 *
 * 결함 셋이 계약이 든 반례 둘과 그 밖의 계열 하나를 나눠 짚는다 — 간선만 적어 두는 쪽 ·
 * 덩어리 번호를 적어 두는 쪽 · **모양은 나무인데 지나간 길을 고쳐 쓰지 않는 쪽.**
 */
const referenceLinkCutTree: CostSource<LinkCutTreeShell> = {
  kind: "self-reported",
  make: () => new LinkCutTreeShell((n) => new ReferenceLinkCutTree(n)),
};
const scanningForest: CostSource<LinkCutTreeShell> = {
  kind: "self-reported",
  make: () => new LinkCutTreeShell((n) => new ScanningForest(n)),
};
const relabelingForest: CostSource<LinkCutTreeShell> = {
  kind: "self-reported",
  make: () => new LinkCutTreeShell((n) => new RelabelingForest(n)),
};
const unsplayedForest: CostSource<LinkCutTreeShell> = {
  kind: "self-reported",
  make: () => new LinkCutTreeShell((n) => new UnsplayedForest(n)),
};

describe("축3 — 정본은 통과한다", () => {
  test("Stack 정본의 push·pop 이 amortized O(1) 계약 안에 있다", () => {
    const verdict = judgeScenario(
      referenceStack,
      scenarioOf(stackContract, "push", false),
      "basic",
    );
    expect(verdict.reason).toBe("");
  });

  test("Multiset 정본이 무작위·오름차순 삽입 모두에서 expected O(log n) 을 지킨다", () => {
    for (const adversarial of [false, true]) {
      const verdict = judgeScenario(
        referenceMultiset,
        scenarioOf(multisetContract, "add", adversarial),
        "complexity",
      );
      expect(verdict.reason).toBe("");
    }
  });

  test("IntervalTree 정본이 여섯 시나리오를 전부 지킨다", () => {
    for (const scenario of intervalTreeContract.scenarios) {
      const verdict = judgeScenario(
        referenceIntervalTree,
        scenario,
        "complexity",
      );
      expect(`${scenario.covers.join("·")}: ${verdict.reason}`).toBe(
        `${scenario.covers.join("·")}: `,
      );
    }
  });

  test("XorLinkedList 정본이 네 시나리오를 전부 지킨다 — 회귀 수준으로", () => {
    for (const scenario of xorLinkedListContract.scenarios) {
      const verdict = judgeScenario(
        referenceXorLinkedList,
        scenario,
        "invariant",
      );
      expect(`${scenario.covers.join("·")}: ${verdict.reason}`).toBe(
        `${scenario.covers.join("·")}: `,
      );
    }
  });

  test("UnrolledLinkedList 정본이 일곱 시나리오를 전부 지킨다", () => {
    for (const scenario of unrolledLinkedListContract.scenarios) {
      const verdict = judgeScenario(
        referenceUnrolledLinkedList,
        scenario,
        "complexity",
      );
      expect(`${scenario.covers.join("·")}: ${verdict.reason}`).toBe(
        `${scenario.covers.join("·")}: `,
      );
    }
  });

  test("Queue 정본이 세 시나리오를 전부 지킨다 — 회귀 수준으로", () => {
    for (const scenario of queueContract.scenarios) {
      const verdict = judgeScenario(referenceQueue, scenario, "basic");
      expect(`${scenario.covers.join("·")}: ${verdict.reason}`).toBe(
        `${scenario.covers.join("·")}: `,
      );
    }
  });

  test("TernarySearchTree 정본이 다섯 시나리오를 전부 지킨다", () => {
    for (const scenario of ternarySearchTreeContract.scenarios) {
      const verdict = judgeScenario(
        referenceTernarySearchTree,
        scenario,
        "invariant",
      );
      expect(`${scenario.covers.join("·")}: ${verdict.reason}`).toBe(
        `${scenario.covers.join("·")}: `,
      );
    }
  });

  test("SuffixArray 정본이 다섯 시나리오를 전부 지킨다", () => {
    for (const scenario of suffixArrayContract.scenarios) {
      const verdict = judgeScenario(
        referenceSuffixArray,
        scenario,
        "complexity",
      );
      expect(`${scenario.covers.join("·")}: ${verdict.reason}`).toBe(
        `${scenario.covers.join("·")}: `,
      );
    }
  });

  test("SuffixTree 정본이 다섯 시나리오를 전부 지킨다", () => {
    for (const scenario of suffixTreeContract.scenarios) {
      const verdict = judgeScenario(
        referenceSuffixTree,
        scenario,
        "complexity",
      );
      expect(`${scenario.covers.join("·")}: ${verdict.reason}`).toBe(
        `${scenario.covers.join("·")}: `,
      );
    }
  });

  test("정렬 집합 정본이 일곱 시나리오를 전부 통과한다", () => {
    for (const scenario of redBlackTreeContract.scenarios) {
      const verdict = judgeScenario(
        referenceRedBlackTree,
        scenario,
        "complexity",
      );
      expect(`${scenario.covers.join("·")}: ${verdict.reason}`).toBe(
        `${scenario.covers.join("·")}: `,
      );
    }
  });

  /**
   * 상각 계약의 정본. **최악 계약의 정본도 이 계약을 지킨다** — 담는 쪽이 넓기 때문이다.
   * 그 포섭을 아래 「두 계약이 서로를 어떻게 담는가」가 실측으로 확인한다.
   */
  test("상각 정렬 집합 정본이 일곱 시나리오를 전부 통과한다", () => {
    for (const scenario of splayTreeContract.scenarios) {
      const verdict = judgeScenario(referenceSplayTree, scenario, "complexity");
      expect(`${scenario.covers.join("·")}: ${verdict.reason}`).toBe(
        `${scenario.covers.join("·")}: `,
      );
    }
  }, 30_000);

  test("기대 정렬 집합 정본이 일곱 시나리오를 전부 통과한다", () => {
    for (const scenario of treapContract.scenarios) {
      const verdict = judgeScenario(referenceTreap, scenario, "complexity");
      expect(`${scenario.covers.join("·")}: ${verdict.reason}`).toBe(
        `${scenario.covers.join("·")}: `,
      );
    }
  }, 30_000);

  /**
   * 한정자가 **연산마다 갈리는** 첫 계약의 정본. 같은 실행에서 갱신 행은 시퀀스 평균으로,
   * 조회 행은 단일 호출 최대로 판정된다.
   */
  test("혼합 한정자 정렬 집합 정본이 일곱 시나리오를 전부 통과한다", () => {
    for (const scenario of scapegoatTreeContract.scenarios) {
      const verdict = judgeScenario(
        referenceScapegoatTree,
        scenario,
        "complexity",
      );
      expect(`${scenario.covers.join("·")}: ${verdict.reason}`).toBe(
        `${scenario.covers.join("·")}: `,
      );
    }
  }, 30_000);

  /**
   * 상한이 없는(선형인) 계약의 정본. **등급이 `invariant` 라 회귀 수준으로 돈다** — 나란한
   * 넷과 갈리는 첫 자리이고, 크기가 두 점이라 판정이 그만큼 싸다.
   */
  test("상한 없는 정렬 집합 정본이 여섯 시나리오를 전부 통과한다", () => {
    for (const scenario of binarySearchTreeContract.scenarios) {
      const verdict = judgeScenario(
        referenceBinarySearchTree,
        scenario,
        "invariant",
      );
      expect(`${scenario.covers.join("·")}: ${verdict.reason}`).toBe(
        `${scenario.covers.join("·")}: `,
      );
    }
  });

  /**
   * 위치 좌표계를 가진 정렬 다중집합의 정본. 시나리오가 여덟인 것은 위치 연산을 겨눈 것이
   * 둘이기 때문이다(무작위로 채우기 · 오름차순으로 채우기).
   */
  test("위치 질의 다중집합 정본이 여덟 시나리오를 전부 통과한다", () => {
    for (const scenario of orderStatisticTreeContract.scenarios) {
      const verdict = judgeScenario(
        referenceOrderStatisticTree,
        scenario,
        "complexity",
      );
      expect(`${scenario.covers.join("·")}: ${verdict.reason}`).toBe(
        `${scenario.covers.join("·")}: `,
      );
    }
  }, 30_000);

  /**
   * 수열이 정하는 트리의 정본. **훑기가 상수라는 것이 재는 값에 그대로 보인다** — 단일
   * 걸음 최대 비용이 세 크기에서 4·4·4 로 움직이지 않는다. 성장률이 아니라 값 자체가
   * 고정인 행은 이 계약에서 여기뿐이다.
   */
  test("수열이 정하는 트리의 정본이 다섯 시나리오를 전부 통과한다", () => {
    for (const scenario of cartesianTreeContract.scenarios) {
      const verdict = judgeScenario(
        referenceCartesianTree,
        scenario,
        "complexity",
      );
      expect(`${scenario.covers.join("·")}: ${verdict.reason}`).toBe(
        `${scenario.covers.join("·")}: `,
      );
    }
  }, 30_000);

  /**
   * 동적 숲의 정본. **적대적 입력에서 시퀀스 평균이 상수로 고정되는 것**이 이 계약을
   * `amortized` 로 적은 대가이자 이유다 — 한 줄로 이어 둔 숲을 끝까지 차례로 물으면
   * 평균은 20.3 → 20.4 → 20.4 로 움직이지 않는데 **단일 호출 최대는 4,100 → 16,388 →
   * 65,540 으로 정확히 네 배씩 자란다.** 같은 실행이 `worst` 통계에서는 떨어진다.
   *
   * 계급이 실제로 보이는 자리는 무작위 시나리오 셋이다(`link` 23.7 → 26.2 → 28.8 ·
   * `connected` 45.1 → 52.8 → 59.9 · `cut` 35.8 → 42.3 → 49.9).
   */
  test("동적 숲의 정본이 여섯 시나리오를 전부 통과한다", () => {
    for (const scenario of linkCutTreeContract.scenarios) {
      const verdict = judgeScenario(
        referenceLinkCutTree,
        scenario,
        "complexity",
      );
      const label = `${scenario.covers.join("·")}${scenario.adversarial ? " (적대적)" : ""}`;
      expect(`${label}: ${verdict.reason}`).toBe(`${label}: `);
    }
  }, 30_000);

  /**
   * **같은 실행이 두 한정자에 정반대 판정을 낸다** — `tree/splayTree` 가 낸 것과 같은
   * 자리이고(불변 사실 63), 이 계약에서도 실물로 확인한다. 한정자만 `worst` 로 바꿔
   * 재면 사슬 시나리오가 떨어진다.
   *
   * 이것이 계약 헤더가 「`worst` 로 적으면 접는 계열이 통째로 나간다」고 적은 것의 수치다.
   */
  test("사슬 시나리오는 amortized 로 통과하고 worst 로는 떨어진다", () => {
    const chained = scenarioOf(linkCutTreeContract, "connected", true);
    expect(judgeScenario(referenceLinkCutTree, chained, "complexity").ok).toBe(
      true,
    );

    const asWorst = { ...chained, qualifier: "worst" as const };
    const strict = judgeScenario(referenceLinkCutTree, asWorst, "complexity");
    expect(strict.ok).toBe(false);
    // 단일 호출 최대가 마디 수에 비례한다 — 비율이 로그가 아니라 4 쪽으로 간다.
    const stats = strict.points.map((point) => point.stat);
    expect((stats[1] ?? 0) / (stats[0] ?? 1)).toBeGreaterThan(3);
  }, 30_000);
});

describe("축3 — 결함 fixture 를 실제로 떨어뜨린다", () => {
  test("앞쪽으로 넣는 스택은 동작이 옳아도 회귀 수준에서 걸린다", () => {
    const verdict = judgeScenario(
      frontPushStack,
      scenarioOf(stackContract, "push", false),
      "basic",
    );
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toContain("O(1)");
    // 연산당 비용이 n 에 비례하므로 비율이 1 이 아니라 4 쪽으로 간다.
    const stats = verdict.points.map((point) => point.stat);
    expect((stats[1] ?? 0) / (stats[0] ?? 1)).toBeGreaterThan(3);
  });

  test("정렬 배열 multiset 은 무작위 삽입에서 성장률로 걸린다", () => {
    const verdict = judgeScenario(
      sortedArrayMultiset(true),
      scenarioOf(multisetContract, "add", false),
      "complexity",
    );
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toContain("O(log n)");
  });

  test("오름차순 삽입만으로는 정렬 배열이 잡히지 않는다 — 적대적 입력이 하나로 부족한 이유", () => {
    const verdict = judgeScenario(
      sortedArrayMultiset(true),
      scenarioOf(multisetContract, "add", true),
      "complexity",
    );
    // 뒤에 붙이기만 하면 되므로 정렬 배열에게 오름차순은 최선의 입력이다.
    expect(verdict.ok).toBe(true);
  });

  test("비용을 축소 보고하면 외부 계수와의 하한 검증이 잡는다", () => {
    const verdict = judgeScenario(
      sortedArrayMultiset(false),
      scenarioOf(multisetContract, "add", false),
      "complexity",
    );
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toContain("외부 계수보다 작다");
  });

  test("배열 하나에 unshift 를 쓰는 덱은 앞쪽을 건드리는 전 시나리오에서 걸린다", () => {
    const failing = dequeContract.scenarios
      .filter((scenario) => scenario.qualifier === "amortized")
      .map((scenario) => judgeScenario(unshiftDeque, scenario, "complexity"));

    expect(failing.every((verdict) => !verdict.ok)).toBe(true);
    // 앞을 건드릴 때마다 뒤 원소 전부가 밀리므로 비율이 1 이 아니라 4 쪽으로 간다.
    for (const verdict of failing) {
      const stats = verdict.points.map((point) => point.stat);
      expect((stats[1] ?? 0) / (stats[0] ?? 1)).toBeGreaterThan(3);
    }
  });

  test("두 배열 덱은 앞뒤를 번갈아 뺄 때만 걸린다 — 큐 패턴에서는 상각이 옳다", () => {
    const queuePattern = judgeScenario(
      twoArrayDeque,
      scenarioOf(dequeContract, "pushBack", true),
      "complexity",
    );
    expect(queuePattern.ok).toBe(true);

    const alternating = judgeScenario(
      twoArrayDeque,
      scenarioOf(dequeContract, "popBack", true),
      "complexity",
    );
    expect(alternating.ok).toBe(false);
    expect(alternating.reason).toContain("O(1)");
  });

  test("균형을 안 잡는 증강 BST 는 오름차순 삽입에서만 걸린다 — 무작위 삽입은 통과한다", () => {
    const random = judgeScenario(
      unbalancedIntervalTree,
      scenarioOf(intervalTreeContract, "insert", false),
      "complexity",
    );
    // 무작위 순서로 들어온 키는 그 자체로 대체로 균형 잡힌 트리를 만든다.
    expect(random.ok).toBe(true);

    const sorted = judgeScenario(
      unbalancedIntervalTree,
      scenarioOf(intervalTreeContract, "insert", true),
      "complexity",
    );
    expect(sorted.ok).toBe(false);
    expect(sorted.reason).toContain("O(log n)");
    const stats = sorted.points.map((point) => point.stat);
    expect((stats[1] ?? 0) / (stats[0] ?? 1)).toBeGreaterThan(3);
  });

  test("전부 훑는 목록은 질의에서 걸리고 삽입에서는 통과한다 — 반대쪽에서 걸린다", () => {
    for (const adversarial of [false, true]) {
      const insert = judgeScenario(
        scanIntervalList,
        scenarioOf(intervalTreeContract, "insert", adversarial),
        "complexity",
      );
      // 배열 뒤에 붙이기만 하므로 삽입은 두 입력 모두에서 상수다.
      expect(insert.ok).toBe(true);
    }

    for (const covers of ["stabQuery", "overlapQuery"]) {
      const query = judgeScenario(
        scanIntervalList,
        scenarioOf(intervalTreeContract, covers, true),
        "complexity",
      );
      expect(query.ok).toBe(false);
      expect(query.reason).toContain("O(log n)");
    }
  });

  test("뒤 끝을 안 들고 매번 훑는 사슬은 붙이기에서만 걸리고 나머지 셋은 통과한다", () => {
    const append = judgeScenario(
      tailScanList,
      scenarioOf(xorLinkedListContract, "append", false),
      "invariant",
    );
    expect(append.ok).toBe(false);
    expect(append.reason).toContain("O(1)");
    const stats = append.points.map((point) => point.stat);
    expect((stats[1] ?? 0) / (stats[0] ?? 1)).toBeGreaterThan(3);

    // 순회 둘은 상한이 O(n) 이라 전부 훑어도 계약 안이고, size 는 세어 두면 상수다.
    // **축3이 이 계약에서 잡을 수 있는 것은 위의 한 자리뿐**이라는 것이 이 검사의 내용이다.
    for (const covers of ["toArray", "toArrayReverse", "size"]) {
      const verdict = judgeScenario(
        tailScanList,
        scenarioOf(xorLinkedListContract, covers, false),
        "invariant",
      );
      expect(`${covers}: ${verdict.reason}`).toBe(`${covers}: `);
    }
  });

  test("크기를 고정한 묶음 목록은 위치 연산 셋과 뒤 끝 빼기에서 걸린다 — 넣기는 통과한다", () => {
    // 처방받았던 그 구현이다. 묶음 크기가 상수라 묶음 수가 n 에 비례하고, 그 하나가
    // 네 자리를 동시에 무너뜨린다. **진단이 지목한 것은 `pop` 하나였다.**
    const drain = judgeScenario(
      fixedChunkList,
      scenarioOf(unrolledLinkedListContract, "pop", true),
      "complexity",
    );
    expect(drain.ok).toBe(false);
    expect(drain.reason).toContain("O(1)");

    for (const covers of ["get", "insert", "remove"]) {
      const verdict = judgeScenario(
        fixedChunkList,
        scenarioOf(unrolledLinkedListContract, covers, true),
        "complexity",
      );
      expect(verdict.ok).toBe(false);
      expect(verdict.reason).toContain("O(sqrt n)");
      const stats = verdict.points.map((point) => point.stat);
      // 선형 이탈이다. sqrt 계약의 기대 2.0 이 아니라 4.0 쪽에 붙는다.
      expect((stats[1] ?? 0) / (stats[0] ?? 1)).toBeGreaterThan(3);
    }

    // 표가 맞게 적었던 셋. 결함이 있는 구현인데 이 셋에서는 정본과 구별되지 않는다.
    for (const covers of ["push", "size", "toArray"]) {
      const verdict = judgeScenario(
        fixedChunkList,
        scenarioOf(unrolledLinkedListContract, covers, false),
        "complexity",
      );
      expect(`${covers}: ${verdict.reason}`).toBe(`${covers}: `);
    }
  });

  test("배열 하나는 반대쪽에서 걸린다 — 위치 삽입·제거만 무너지고 읽기는 오히려 상수다", () => {
    for (const covers of ["insert", "remove"]) {
      const verdict = judgeScenario(
        spliceArrayList,
        scenarioOf(unrolledLinkedListContract, covers, true),
        "complexity",
      );
      expect(verdict.ok).toBe(false);
      expect(verdict.reason).toContain("O(sqrt n)");
    }

    for (const covers of ["push", "size", "toArray"]) {
      const verdict = judgeScenario(
        spliceArrayList,
        scenarioOf(unrolledLinkedListContract, covers, false),
        "complexity",
      );
      expect(`${covers}: ${verdict.reason}`).toBe(`${covers}: `);
    }
    const drain = judgeScenario(
      spliceArrayList,
      scenarioOf(unrolledLinkedListContract, "pop", true),
      "complexity",
    );
    expect(drain.ok).toBe(true);

    // **읽기는 상수라 걸리는데, 느려서가 아니라 빨라서 걸린다.** 이 구현은 `get` 계약을
    // 어기지 않았다 — 판정이 성장 계급을 보기 때문에 계급 아래도 벗어남이다.
    // 위 「판정 — 순수 부분」의 같은 성질을 실물 구현에서 확인하는 자리다.
    const read = judgeScenario(
      spliceArrayList,
      scenarioOf(unrolledLinkedListContract, "get", true),
      "complexity",
    );
    expect(read.ok).toBe(false);
    const stats = read.points.map((point) => point.stat);
    expect((stats[1] ?? 0) / (stats[0] ?? 1)).toBeLessThan(1.4);
  });

  /**
   * 시나리오 하나에 이름을 붙여 판정을 모은다.
   *
   * `scenarioOf` 를 쓰지 못하는 이유는 이 두 구조에 **같은 행을 덮는 적대적 시나리오가
   * 둘 이상** 있기 때문이다(구성만 재는 것과 구성+LRS 를 함께 재는 것). 무엇이 통과하고
   * 무엇이 걸리는지가 이 자리의 내용이므로 전부 이름으로 적는다.
   */
  function outcomesAt<Impl>(
    cost: CostSource<Impl>,
    spec: { scenarios: readonly CostScenario<Impl>[] },
    grade: "basic" | "invariant" | "complexity",
  ): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    for (const scenario of spec.scenarios) {
      const label = `${scenario.covers.join("·")}${scenario.adversarial ? " (적대적)" : ""}`;
      result[label] = judgeScenario(cost, scenario, grade).ok;
    }
    return result;
  }

  function outcomes<Impl>(
    cost: CostSource<Impl>,
    spec: { scenarios: readonly CostScenario<Impl>[] },
  ): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    for (const scenario of spec.scenarios) {
      const label = `${scenario.covers.join("·")}${scenario.adversarial ? " (적대적)" : ""}`;
      result[label] = judgeScenario(cost, scenario, "complexity").ok;
    }
    return result;
  }

  test("큐의 두 결함이 서로 반대쪽에서 걸린다 — 넣기와 꺼내기", () => {
    // 앞을 실제로 지우는 구현: 꺼내기만 무너진다.
    const drain = judgeScenario(
      shiftQueue,
      scenarioOf(queueContract, "dequeue", true),
      "basic",
    );
    expect(drain.ok).toBe(false);
    expect(drain.reason).toContain("O(1)");
    for (const covers of ["enqueue", "front"]) {
      const verdict = judgeScenario(
        shiftQueue,
        scenarioOf(queueContract, covers, false),
        "basic",
      );
      expect(`${covers}: ${verdict.reason}`).toBe(`${covers}: `);
    }

    // 앞에 끼워 넣는 구현: 넣기만 무너진다. 한쪽만 두면 다른 쪽이 통과한다.
    const fill = judgeScenario(
      unshiftQueue,
      scenarioOf(queueContract, "enqueue", false),
      "basic",
    );
    expect(fill.ok).toBe(false);
    expect(fill.reason).toContain("O(1)");
    for (const [covers, adversarial] of [
      ["dequeue", true],
      ["front", false],
    ] as const) {
      const verdict = judgeScenario(
        unshiftQueue,
        scenarioOf(queueContract, covers, adversarial),
        "basic",
      );
      expect(`${covers}: ${verdict.reason}`).toBe(`${covers}: `);
    }
  });

  test("표 하나에 담으면 접두사 질의에서만 걸린다", () => {
    expect(
      outcomesAt(mapWordSet, ternarySearchTreeContract, "invariant"),
    ).toEqual({
      insert: true,
      search: true,
      // 낱말을 통째로 열쇠로 삼으면 접두사로 묶이지 않는다. 명세의 필요충분조건이
      // 검사되는 자리가 여기다.
      "startsWith·wordsWithPrefix (적대적)": false,
      "delete (적대적)": true,
      size: true,
    });
  });

  test("정렬 배열은 반대쪽에서 걸리고, 어긴 자리 하나를 축3이 놓친다", () => {
    expect(
      outcomesAt(sortedWordSet, ternarySearchTreeContract, "invariant"),
    ).toEqual({
      insert: false,
      // **계약 위반인데 통과한다.** 이분 탐색이라 O(m log n) 이고 계약은 O(m) 인데,
      // 크기가 4배 오를 때 로그 인수가 바꾸는 비율이 1.2 배뿐이라 허용 구간 안이다
      // (§규약2 「로그 인수는 축3의 해상도 아래에 있다」).
      search: true,
      "startsWith·wordsWithPrefix (적대적)": true,
      "delete (적대적)": false,
      size: true,
    });
  });

  test("접미사를 통째로 견주어 정렬하면 반복 입력에서만 걸린다", () => {
    expect(outcomes(sortedSuffixArray, suffixArrayContract)).toEqual({
      // **무작위 문자열에서는 계약을 지킨다.** 비교가 몇 글자 만에 갈리기 때문이다.
      constructor: true,
      "constructor (적대적)": false,
      "constructor·longestRepeatedSubstring (적대적)": false,
      "range (적대적)": true,
      length·at·rankOf: true,
    });
  });

  test("색인을 제대로 짓고도 훑으면 구성이 아니라 질의에서 걸린다", () => {
    expect(outcomes(scanningSuffixArray, suffixArrayContract)).toEqual({
      constructor: true,
      "constructor (적대적)": true,
      "constructor·longestRepeatedSubstring (적대적)": true,
      "range (적대적)": false,
      length·at·rankOf: true,
    });
  });

  test("접미사를 뿌리부터 하나씩 넣는 트리도 반복 입력에서만 걸린다", () => {
    expect(outcomes(rootedSuffixTree, suffixTreeContract)).toEqual({
      constructor: true,
      "constructor (적대적)": false,
      "constructor·longestRepeatedSubstring (적대적)": false,
      "contains·count (적대적)": true,
      "findAll·length (적대적)": true,
    });
  });

  test("트리를 짓고도 원문을 훑으면 이 계약의 중심 문장에서 걸린다", () => {
    expect(outcomes(scanningSuffixTree, suffixTreeContract)).toEqual({
      constructor: true,
      "constructor (적대적)": true,
      "constructor·longestRepeatedSubstring (적대적)": true,
      // 질의 비용이 색인 크기에 기대면 안 된다는 것이 이 계약이 접미사 배열과 갈리는
      // 자리이고, 그것을 실제로 잡는 시나리오가 이 둘이다.
      "contains·count (적대적)": false,
      "findAll·length (적대적)": false,
    });
  });

  /**
   * 정렬 집합 계약의 결함 셋. **한정자를 어기는 결함이 여기서 처음 나온다.**
   *
   * 앞의 둘(균형 없는 트리·정렬 배열)은 계약의 **상한**을 어긴다. 스플레이는 상한을
   * 어기지 않는다 — 로그를 지키되 **호출 하나하나**가 로그 안에 든다는 것만 못 지킨다.
   * 그래서 걸리는 자리가 `worst` 통계로 재면서 그 계열을 겨누는 시나리오뿐이다
   * (불변 사실 63).
   */
  test("정렬 집합의 결함 셋이 서로 다른 자리에서 걸린다", () => {
    // 균형을 스스로 잡지 않는 트리: 오름차순 넣기와 순차 조회에서 사슬이 된다.
    expect(outcomes(unbalancedSearchTree, redBlackTreeContract)).toEqual({
      "insert (적대적)": false,
      insert: true,
      "has·min·max (적대적)": false,
      "delete (적대적)": true,
      range: true,
      toArray: true,
      size: true,
    });

    // 정렬 배열: 갱신 둘만 무너진다. **오름차순 넣기는 통과한다** — 뒤에 붙이기만
    // 하면 되기 때문이고, 같은 입력이 위 구현에는 최악이었다(불변 사실 24·57).
    expect(outcomes(sortedArraySet, redBlackTreeContract)).toEqual({
      "insert (적대적)": true,
      insert: false,
      "has·min·max (적대적)": true,
      "delete (적대적)": false,
      range: true,
      toArray: true,
      size: true,
    });

    // 스플레이: **넣기 둘을 다 통과한다.** 상한을 어기지 않기 때문이다. 걸리는 것은
    // **사슬인 채로 맞는 첫 호출**이 있는 두 자리뿐이고, 거기서 그 한 번이 n 에 비례한다.
    // 끌어올리기가 곧바로 트리를 납작하게 만들어 뒤 걸음은 싸지므로, `worst` 가 보고하는
    // 최댓값은 첫 걸음의 것이다.
    expect(outcomes(splayingSearchTree, redBlackTreeContract)).toEqual({
      "insert (적대적)": true,
      insert: true,
      "has·min·max (적대적)": false,
      "delete (적대적)": false,
      range: true,
      toArray: true,
      size: true,
    });
  });

  /**
   * **한정자만 다른 두 계약이 같은 구현들에 어떤 판정을 내는가.**
   *
   * `tree/splayTree` 계약은 `tree/redBlackTree` 계약과 연산 집합도 상한도 시나리오
   * 입력도 같고 `qualifier` 하나만 다르다. 그래서 이 자리는 **판정 규격 한 줄이 계약을
   * 가른다**는 것을 세 구현으로 각각 확인한다.
   *
   * **기본 시간 제한을 넘는 첫 자기시험이다.** `toArray` 행이 `amortized` 라 n 회
   * 측정을 요구하고(§규약2), 호출 하나가 n 이므로 그 시나리오 하나가 사다리 맨 위에서
   * 2.7억 걸음이 된다. `worst` 계약이었으면 네 번만 불러도 성장률이 나온다 —
   * **한정자를 약하게 적는 대가가 판정 시간에 있다**(불변 사실 102).
   */
  test("상각 계약은 상한 위반만 잡고 한정자 위반은 통과시킨다", () => {
    // 끌어올리는 구현: **일곱을 전부 통과한다.** 최악 계약에서 걸리던 두 자리
    // (순차 조회·오름차순 지우기)가 여기서는 통과다 — 튄 호출을 뒤 호출들이 갚기
    // 때문이고, 그 갚음을 보는 것이 시퀀스 평균이다.
    expect(outcomes(splayingSearchTree, splayTreeContract)).toEqual({
      "insert (적대적)": true,
      insert: true,
      "has·min·max (적대적)": true,
      "delete (적대적)": true,
      range: true,
      toArray: true,
      size: true,
    });

    // 균형을 안 잡는 트리: **최악 계약에서 걸리던 자리에서 똑같이 걸린다.** 사슬이
    // 사슬로 남으므로 평균을 내도 원소 수에 비례한다 — 상각이 구해 주는 것은 「가끔
    // 비싼 호출」이지 「늘 비싼 호출」이 아니다.
    expect(outcomes(unbalancedSearchTree, splayTreeContract)).toEqual({
      "insert (적대적)": false,
      insert: true,
      "has·min·max (적대적)": false,
      "delete (적대적)": true,
      range: true,
      toArray: true,
      size: true,
    });

    // 정렬 배열: 같은 이유로 갱신 둘이 그대로 걸린다.
    expect(outcomes(sortedArraySet, splayTreeContract)).toEqual({
      "insert (적대적)": true,
      insert: false,
      "has·min·max (적대적)": true,
      "delete (적대적)": false,
      range: true,
      toArray: true,
      size: true,
    });
  }, 30_000);

  /**
   * **포섭의 방향을 정본 둘로 잰다.**
   *
   * 「`worst` 계약을 만족하는 구현은 전부 `amortized` 계약을 만족한다」는 논증이었다.
   * 정본을 서로의 계약에 넣으면 그 사슬이 수치가 된다 — 한쪽은 전부 통과하고 반대쪽은
   * 두 자리에서 걸린다. 담는 쪽이 좁다는 것이 이 비대칭이다.
   */
  test("최악 정본은 상각 계약을 지키고 상각 정본은 최악 계약을 못 지킨다", () => {
    expect(outcomes(referenceRedBlackTree, splayTreeContract)).toEqual({
      "insert (적대적)": true,
      insert: true,
      "has·min·max (적대적)": true,
      "delete (적대적)": true,
      range: true,
      toArray: true,
      size: true,
    });

    expect(outcomes(referenceSplayTree, redBlackTreeContract)).toEqual({
      "insert (적대적)": true,
      insert: true,
      "has·min·max (적대적)": false,
      "delete (적대적)": false,
      range: true,
      toArray: true,
      size: true,
    });
  }, 30_000);

  /**
   * **같은 실행이 두 계약에 정반대 판정을 낸다.**
   *
   * 시나리오도 구현도 seed 도 같고 읽는 통계만 다르다. 평균은 크기를 네 배씩 올려도
   * 움직이지 않고, 최대는 정확히 네 배씩 자란다. 불변 사실 63 이 논증으로만 있던 것에
   * 붙는 수치가 이 한 쌍이다.
   */
  test("한 실행에서 시퀀스 평균은 상수인데 단일 호출 최대는 네 배씩 자란다", () => {
    const amortized = judgeScenario(
      referenceSplayTree,
      scenarioOf(splayTreeContract, "has", true),
      "complexity",
    );
    expect(amortized.ok).toBe(true);
    const means = amortized.points.map((point) => point.stat);
    // 19.7 → 19.8 → 19.8. 네 배씩 커진 입력에서 평균이 1% 안쪽으로 붙어 있다.
    expect((means[2] ?? 0) / (means[0] ?? 1)).toBeLessThan(1.1);

    const worst = judgeScenario(
      referenceSplayTree,
      scenarioOf(redBlackTreeContract, "has", true),
      "complexity",
    );
    expect(worst.ok).toBe(false);
    const peaks = worst.points.map((point) => point.stat);
    // 1540 → 6148 → 24580. 같은 실행의 최댓값이다.
    expect((peaks[2] ?? 0) / (peaks[0] ?? 1)).toBeGreaterThan(15);
  });

  /**
   * **`expected` 계약이 축3에서 어디까지 보이는가.**
   *
   * `tree/treap` 계약은 형제 둘과 연산 집합도 상한도 같고 한정자만 다르다. 정본
   * 교차(불변 사실 100)를 네 방향으로 돌리면 **둘은 안정적이고 둘은 흔들린다** — 그
   * 갈림이 T1-02 의 수확이다.
   *
   * | 방향 | 40회 중 걸린 횟수 |
   * |---|---|
   * | `redBlackTree` 정본 → `treap` 계약 | 0 |
   * | `splayTree` 정본 → `treap` 계약 | 0 |
   * | `treap` 정본 → `redBlackTree` 계약 | **11** (`delete` 적대 6 · `insert` 적대 4 · `insert` 2) |
   * | `treap` 정본 → `splayTree` 계약 | **2** |
   *
   * **아래 둘은 단언하지 않는다.** `treap` 정본이 무작위를 쓰므로 그 결과가 실행마다
   * 다르고, 못 박으면 CI 가 흔들린다. 흔들린다는 것 자체가 여기 적을 관측이다 —
   * 「`treap` 계약이 `redBlackTree` 계약보다 넓다」가 **확률적으로 보인다**는 뜻이고,
   * 한 번만 돌려 통과한 것을 「담긴다」로 읽으면 틀린다.
   *
   * 단언하는 둘 중 **둘째가 축이 못 보는 자리다.** `splayTree` 정본은 이 계약을 어기는데
   * (사슬 끝 첫 조회가 원소 수에 비례하고 결정론적이라 그 값이 곧 기댓값이다) 40회 내내
   * 통과한다. 통계가 시퀀스 평균이라 그 하나가 묻히기 때문이고, 이쪽은 흔들림이 아니라
   * **판정 규격의 한계**다.
   */
  test("기대 계약은 최악 정본을 담고 상각 정본의 위반을 못 본다", () => {
    // 담는 쪽 → 담기는 쪽. 결정론적 정본이라 안정적으로 통과한다(최악까지 로그면
    // 기댓값도 로그다).
    expect(outcomes(referenceRedBlackTree, treapContract)).toEqual({
      "insert (적대적)": true,
      insert: true,
      "has·min·max (적대적)": true,
      "delete (적대적)": true,
      range: true,
      toArray: true,
      size: true,
    });

    // **이 계약을 어기는 정본이 일곱을 전부 통과한다.** B17 이 「서로 담지 않는다」로
    // 판정한 한 쌍인데 축이 그 한쪽을 못 본다.
    expect(outcomes(referenceSplayTree, treapContract)).toEqual({
      "insert (적대적)": true,
      insert: true,
      "has·min·max (적대적)": true,
      "delete (적대적)": true,
      range: true,
      toArray: true,
      size: true,
    });
  }, 30_000);

  /**
   * **기대 계약의 스위트가 통과시키는 것 중에 계약 위반이 있다**(불변 사실 62 가 요구하는
   * 기록).
   *
   * `splayingSearchTree` 는 사슬인 채로 맞는 첫 조회 하나가 원소 수에 비례하고 결정론적이라
   * 그 값이 곧 기댓값이다 — **`expected O(log n)` 을 어긴다.** 그런데 축3의 `expected`
   * 통계가 시퀀스 평균이라 그 하나가 묻힌다. 통과를 「계약을 지킨다」로 읽지 않도록 여기
   * 이름으로 적어 둔다.
   *
   * 스위트가 아무것도 못 잡는다는 뜻은 아니다 — **입력에 치우치는 구현은 잡는다.**
   */
  test("기대 계약은 입력에 치우치는 구현을 잡고 무작위성에 안 기대는 구현은 놓친다", () => {
    // 균형을 스스로 잡지 않는 트리: 오름차순 넣기와 순차 조회에서 걸린다.
    expect(outcomes(unbalancedSearchTree, treapContract)).toEqual({
      "insert (적대적)": false,
      insert: true,
      "has·min·max (적대적)": false,
      "delete (적대적)": true,
      range: true,
      toArray: true,
      size: true,
    });

    // 정렬 배열: 갱신 둘이 걸린다. 무작위 위치에 넣으면 평균 n/2 개가 밀리므로 기댓값도
    // n 에 비례한다.
    expect(outcomes(sortedArraySet, treapContract)).toEqual({
      "insert (적대적)": true,
      insert: false,
      "has·min·max (적대적)": true,
      "delete (적대적)": false,
      range: true,
      toArray: true,
      size: true,
    });

    // **끌어올리는 구현: 전부 통과한다 — 그런데 이 계약을 어긴다.** 못 잡는 자리다.
    expect(outcomes(splayingSearchTree, treapContract)).toEqual({
      "insert (적대적)": true,
      insert: true,
      "has·min·max (적대적)": true,
      "delete (적대적)": true,
      range: true,
      toArray: true,
      size: true,
    });
  }, 30_000);

  /**
   * **포섭 사슬이 축3에서 양방향으로 보이는 첫 자리.**
   *
   * B17 이 네 계약을 가르며 `redBlackTree` ⊂ `scapegoatTree` ⊂ `splayTree` 사슬을 논증으로
   * 냈다. T1-01 은 그 사슬의 한 방향만 실측할 수 있었고(불변 사실 100), T1-02 는 무작위
   * 정본이라 확률적으로만 보였다(불변 사실 105). **여기서는 양방향이 결정론적으로 갈리고,
   * 걸리는 자리가 정확히 한정자가 갈린 행이다.**
   *
   * 그렇게 되는 이유는 이 계약이 조회에 `worst` 를 쓰기 때문이다 — `worst` 통계는
   * 최댓값이라 「가끔 튀는」 구현을 그대로 보고한다. `amortized` 와 `expected` 는 둘 다
   * 평균이라 서로를 못 가르지만(불변 사실 105), **한 행이라도 `worst` 가 있으면 그 행이
   * 갈림을 잡는다.**
   */
  test("포섭 사슬의 양쪽이 정확히 갈린 한정자의 행에서 갈린다", () => {
    // ① 좁은 쪽(전 연산 worst) → 이 계약: 전부 통과. 담긴다.
    expect(outcomes(referenceRedBlackTree, scapegoatTreeContract)).toEqual({
      "insert (적대적)": true,
      insert: true,
      "has·min·max (적대적)": true,
      "delete (적대적)": true,
      range: true,
      toArray: true,
      size: true,
    });

    // ② 이 정본 → 좁은 쪽 계약: **갱신 행만 걸린다.** 다시 짓기 한 번이 원소 수에
    //    비례하므로 `worst` 통계가 그것을 그대로 보고한다. 조회는 통과한다.
    expect(outcomes(referenceScapegoatTree, redBlackTreeContract)).toEqual({
      "insert (적대적)": false,
      insert: false,
      "has·min·max (적대적)": true,
      "delete (적대적)": false,
      range: true,
      toArray: true,
      size: true,
    });

    // ③ 이 정본 → 넓은 쪽 계약(전 연산 amortized): 전부 통과. 담긴다.
    expect(outcomes(referenceScapegoatTree, splayTreeContract)).toEqual({
      "insert (적대적)": true,
      insert: true,
      "has·min·max (적대적)": true,
      "delete (적대적)": true,
      range: true,
      toArray: true,
      size: true,
    });

    // ④ 넓은 쪽 정본 → 이 계약: **조회 행만 걸린다.** 접근한 자리를 끌어올리는 계열은
    //    사슬인 채로 맞는 첫 조회가 원소 수에 비례한다. 갱신은 통과한다.
    //    **②와 ④가 서로 다른 행에서 걸리는 것이 이 계약이 둘 사이에 실재하는 근거다.**
    expect(outcomes(referenceSplayTree, scapegoatTreeContract)).toEqual({
      "insert (적대적)": true,
      insert: true,
      "has·min·max (적대적)": false,
      "delete (적대적)": true,
      range: true,
      toArray: true,
      size: true,
    });
  }, 30_000);

  /**
   * **연산 집합이 갈린 두 계약의 포섭을 처음으로 실측한다.**
   *
   * 앞의 포섭 실측 셋은 전부 **한정자만 갈린** 계약 사이의 것이었다(불변 사실 100·105·107).
   * 표면이 같으므로 정본을 서로의 계약에 그대로 넣을 수 있었고, 그래서 양방향을 다 잴 수
   * 있었다. `tree/orderStatisticTree` 와 `tree/multiset` 은 **연산 집합이 갈린다** — 앞의
   * 것이 뒤의 것에 `rankOf`·`at` 둘을 더한 계약이다. 그 갈림이 실측 방법을 바꾼다.
   *
   * | 방향 | 되는가 | 결과 |
   * |---|---|---|
   * | 담는 쪽 정본 → 담기는 쪽 계약 | 된다(표면이 포함한다) | 여섯 전부 통과 |
   * | 담기는 쪽 정본 → 담는 쪽 계약 | **안 된다** — `rankOf`·`at` 이 없다 | — |
   * | 담기는 쪽만 만족하는 구현 → 두 계약 | 된다 | 아래 |
   *
   * 둘째 줄이 막히므로 **포섭이 진짜 포섭이라는 것**(한쪽만 만족하는 구현이 실재한다는 것)은
   * 정본 교차가 아니라 **결함 fixture 로** 보인다. `keyCountingMultiset` 이 그 자리이고,
   * 그것이 담기는 쪽 계약을 전부 지키면서 담는 쪽에서 **정확히 새 두 행만** 어긴다.
   *
   * 20회 반복해 넷 다 같은 결과였다(fixture 와 정본이 둘 다 우선순위를 난수로 뽑으므로
   * 한 번 돌린 결과를 판정으로 읽지 않는다 — 불변 사실 105).
   */
  test("위치 질의 계약이 다중집합 계약을 담고, 그 포섭이 진짜 포섭이다", () => {
    // ① 담는 쪽 정본 → 담기는 쪽 계약: 전부 통과. **포섭의 방향이다.**
    expect(
      outcomes(referenceOrderStatisticTreeAsMultiset, multisetContract),
    ).toEqual({
      "add (적대적)": true,
      add: true,
      delete·deleteAll: true,
      has·count·min·max: true,
      toArray: true,
      size: true,
    });

    // ② 담기는 쪽만 만족하는 구현 → 담기는 쪽 계약: 전부 통과.
    expect(outcomes(keyCountingAsMultiset, multisetContract)).toEqual({
      "add (적대적)": true,
      add: true,
      delete·deleteAll: true,
      has·count·min·max: true,
      toArray: true,
      size: true,
    });

    // ③ 같은 구현 → 담는 쪽 계약: **새로 들어온 두 행에서만 걸린다.** ②와 ③이 함께
    //    「포섭은 같음의 증거가 아니라 반대 방향의 증거다」를 수치로 만든다.
    expect(outcomes(keyCountingMultiset, orderStatisticTreeContract)).toEqual({
      "add (적대적)": true,
      add: true,
      delete·deleteAll: true,
      has·count·min·max: true,
      rankOf·at: false,
      "rankOf·at (적대적)": false,
      toArray: true,
      size: true,
    });
  }, 60_000);

  /**
   * **위치 연산을 겨눈 시나리오가 둘인 이유.**
   *
   * 하나는 「위치를 세는 값을 안 드는」 계열을, 다른 하나는 「값은 드는데 담는 모양을 안
   * 고치는」 계열을 잡는다. 둘째 계열은 무작위로 채우면 기대 높이가 로그라 **첫째 시나리오를
   * 통과한다** — 적대성이 (계약, 구현) 쌍에 대해 정의된다는 것이 이 한 쌍이다(불변 사실 57).
   */
  test("위치 연산의 두 시나리오가 서로 다른 계열을 잡는다", () => {
    // 값을 안 드는 계열: 무작위로 채워도 걸린다. 서로 다른 키의 수가 원소 수에 비례한다.
    const naiveRandom = judgeScenario(
      keyCountingMultiset,
      scenarioOf(orderStatisticTreeContract, "rankOf", false),
      "complexity",
    );
    expect(naiveRandom.ok).toBe(false);
    const naiveStats = naiveRandom.points.map((point) => point.stat);
    expect((naiveStats[2] ?? 0) / (naiveStats[0] ?? 1)).toBeGreaterThan(10);

    // 값은 드는데 모양을 안 고치는 계열: **무작위로 채우면 통과하고** 오름차순으로 채우면
    // 걸린다. 시나리오가 하나뿐이었다면 이 계열이 통째로 새어 나간다.
    expect(
      outcomes(unbalancedRankedMultiset, orderStatisticTreeContract),
    ).toEqual({
      "add (적대적)": false,
      add: true,
      delete·deleteAll: true,
      has·count·min·max: true,
      rankOf·at: true,
      "rankOf·at (적대적)": false,
      toArray: true,
      size: true,
    });

    // 같은 구현을 담기는 쪽 계약에 넣으면 갱신 행 하나만 걸린다 — 저 계약에는 위치 연산이
    // 없으므로 이 계열이 어디서 갈리는지를 **물을 자리 자체가 없다.**
    expect(outcomes(unbalancedRankedAsMultiset, multisetContract)).toEqual({
      "add (적대적)": false,
      add: true,
      delete·deleteAll: true,
      has·count·min·max: true,
      toArray: true,
      size: true,
    });
  }, 60_000);

  /**
   * **상한이 느슨한 계약에서 축3이 무엇을 할 수 있는가.** 위아래로 한 자리씩 눈이 멀어
   * 있고, 남는 것이 `size` 행 하나다.
   *
   * 셋이 서로 다른 축에서 걸리도록 지었다 — 축2만, 축3만, **어느 축도 아닌 것.**
   * 셋째가 이 자리의 내용이다.
   */
  test("상한 없는 계약의 결함 셋이 서로 다른 축에서 걸린다", () => {
    const grade = "invariant" as const;

    // ① 양 끝을 캐시하고 지울 때 갱신을 빠뜨리는 구현: **축3은 전부 통과시킨다.**
    //    담는 모양이 정본과 같아서 성장 계급이 갈리지 않는다 — 잡는 것은 축2뿐이고,
    //    그 확인은 아래 「축2 — 상한이 느슨하면 축2가 주 판별기다」에 있다.
    expect(
      outcomesAt(staleEndCacheSet, binarySearchTreeContract, grade),
    ).toEqual({
      "insert (적대적)": true,
      "has·min·max (적대적)": true,
      "delete (적대적)": true,
      "range (적대적)": true,
      size: true,
      toArray: true,
    });

    // ② 크기를 매번 훑어 세는 구현: **`size` 행 하나만 걸린다.** 여덟 행 중 유일하게
    //    상한이 상수인 행이고, 그래서 이 계약에서 축3이 위쪽으로 판별력을 갖는 유일한
    //    자리다. 나란한 넷의 계약에서라면 갱신·조회가 먼저 걸려 이 자리가 묻힌다.
    expect(
      outcomesAt(recountingSizeSet, binarySearchTreeContract, grade),
    ).toEqual({
      "insert (적대적)": true,
      "has·min·max (적대적)": true,
      "delete (적대적)": true,
      "range (적대적)": true,
      size: false,
      toArray: true,
    });

    // ③ 순서를 유지하지 않고 관측할 때마다 만드는 구현: **여섯을 전부 통과한다.**
    //    필요충분조건의 비용 조건을 어기는데(관측 하나가 n log n) 어기는 폭이 로그 인수
    //    하나뿐이라 축3의 해상도 아래다(불변 사실 53·62). 축1·축2는 답이 맞으므로
    //    통과시킨다. **네 축이 전부 통과시키는 계약 위반이고, 처분은 가이드다.**
    expect(outcomesAt(lazySortingSet, binarySearchTreeContract, grade)).toEqual(
      {
        "insert (적대적)": true,
        "has·min·max (적대적)": true,
        "delete (적대적)": true,
        "range (적대적)": true,
        size: true,
        toArray: true,
      },
    );
  });

  /**
   * **계약을 만족하는 것과 이 스위트를 통과하는 것이 갈리는 첫 자리.**
   *
   * 축3은 상한이 아니라 성장 계급을 판정하므로 아래쪽으로도 허용치가 있다(불변 사실 49).
   * 나란한 넷에서는 그것이 문제가 되지 않았다 — 로그를 약속하면 만족하는 구현이 전부 로그
   * 계급이기 때문이다. **이 계약은 선형만 약속하므로 계급이 흩어지고, 흩어진 만큼 걸린다.**
   *
   * 지금까지 「계약보다 빠른 구현도 실패한다」는 결함 fixture 에 대한 문장이었다. 여기서는
   * **계약이 이름을 불러 초대한 구현**이 실패한다 — 헤더가 *"정렬 배열도 이 계약을
   * 만족한다, 그것은 결함이 아니라 계약의 내용"* 이라고 적은 그 구현이다.
   */
  test("느슨한 상한은 계약을 지키는 구현을 축3에서 걸러 낸다", () => {
    const grade = "invariant" as const;
    const chain = [
      ["redBlackTree", referenceRedBlackTree],
      ["scapegoatTree", referenceScapegoatTree],
      ["splayTree", referenceSplayTree],
      ["treap", referenceTreap],
      ["정렬 배열", sortedArraySet],
    ] as const;

    // 다섯 다 이 계약을 **만족한다** — 로그 안에 드는 구현은 선형 안에도 든다. 그런데
    // 여섯 시나리오를 전부 통과하는 것은 **하나도 없다.**
    for (const [name, cost] of chain) {
      const passed = Object.values(
        outcomesAt(cost, binarySearchTreeContract, grade),
      ).filter(Boolean).length;
      expect(`${name}: ${passed}/6`).not.toBe(`${name}: 6/6`);
    }

    // 걸리는 자리는 그 구현이 무엇을 **덜 쓰는가**에 따라 갈린다. 균형을 잡는 정본은 넷
    // 전부에서 로그 계급이라 넷 다 걸리고, 접근한 자리를 끌어올리는 정본은 순차 조회에서만
    // 선형이라 그 행만 통과한다.
    expect(
      outcomesAt(referenceRedBlackTree, binarySearchTreeContract, grade),
    ).toEqual({
      "insert (적대적)": false,
      "has·min·max (적대적)": false,
      "delete (적대적)": false,
      "range (적대적)": false,
      size: true,
      toArray: true,
    });
    expect(
      outcomesAt(referenceSplayTree, binarySearchTreeContract, grade),
    ).toEqual({
      "insert (적대적)": false,
      "has·min·max (적대적)": true,
      "delete (적대적)": false,
      "range (적대적)": false,
      size: true,
      toArray: true,
    });

    // **`toArray` 행만 여섯 중 계급이 안 갈린다.** 어떤 구현으로 지어도 호출 하나가 원소
    // 수만큼 들기 때문이고, 그래서 이 행에는 적대적 입력이 없다. 다섯이 같은 값을 낸다.
    for (const [, cost] of chain) {
      const verdict = judgeScenario(
        cost,
        scenarioOf(binarySearchTreeContract, "toArray", false),
        grade,
      );
      expect(verdict.ok).toBe(true);
    }

    // 반대 방향 — 이 정본은 나란한 넷의 계약에서 걸린다. **포섭의 방향이 그 비대칭이고,**
    // 이 계약이 사슬의 가장 넓은 쪽이라는 근거다(불변 사실 100 의 절차).
    expect(
      judgeScenario(
        referenceBinarySearchTree,
        scenarioOf(redBlackTreeContract, "insert", true),
        "complexity",
      ).ok,
    ).toBe(false);
  }, 30_000);

  test("한정자를 어기는 구현은 무작위 입력으로는 잡히지 않는다", () => {
    // 같은 스플레이 구현이 무작위 넣기에서는 통과하고 순차 조회에서 걸린다.
    // **시나리오를 무작위로만 두면 `worst` 계약과 `amortized` 계약의 스위트가
    // 서로를 통과시킨다** — B17 이 넷으로 가른 계약이 축에서 구분되지 않는다.
    const random = judgeScenario(
      splayingSearchTree,
      scenarioOf(redBlackTreeContract, "insert", false),
      "complexity",
    );
    expect(random.ok).toBe(true);

    const sequential = judgeScenario(
      splayingSearchTree,
      scenarioOf(redBlackTreeContract, "has", true),
      "complexity",
    );
    expect(sequential.ok).toBe(false);
    expect(sequential.reason).toContain("O(log n)");
    // 단일 호출 최대 비용이 원소 수에 비례하므로 비율이 1.2 가 아니라 4 쪽으로 간다.
    const stats = sequential.points.map((point) => point.stat);
    expect((stats[1] ?? 0) / (stats[0] ?? 1)).toBeGreaterThan(3);
  });

  /**
   * **불변 구조의 계약이 두 자리에서 갈린다 — 짓는 값과 훑는 값.**
   *
   * `tree/cartesianTree` 는 상태를 바꾸는 연산이 없으므로 축2가 볼 것이 없고(불변 사실 52 ①),
   * 계약이 실제로 배제하는 일을 하는 자리가 축3의 두 행뿐이다. 그 둘이 **서로를 대신하지
   * 못한다**는 것을 결함 둘이 반대쪽에서 보인다.
   *
   * | fixture | 구성 | 훑기 |
   * |---|---|---|
   * | 구간을 훑어 나누는 것 | 오름차순에서 걸린다 | 상수라 통과 |
   * | 수열만 들고 다시 훑는 것 | 사본 하나라 통과 | 둘 다 걸린다 |
   *
   * 시나리오를 한쪽만 뒀다면 나머지 하나가 통째로 새어 나간다.
   */
  test("구성만 어기는 결함과 훑기만 어기는 결함이 서로 다른 행에서 걸린다", () => {
    // ① 구간의 최솟값을 훑어 나누는 구현. 트리는 정본과 같은 것을 짓고 마디도 세워 두므로
    //    훑기 넷이 상수다. **무작위 수열은 통과한다** — 나눔이 반씩 갈려 로그 인수 하나
    //    차이이고, 그 차이는 축3의 해상도 아래다(불변 사실 53).
    expect(outcomes(scanningCartesianTree, cartesianTreeContract)).toEqual({
      constructor: true,
      "constructor (적대적)": false,
      size·value·left·right: true,
      "size·value·left·right (적대적)": true,
      "inOrder (적대적)": true,
    });

    // 오름차순에서 걸리는 폭이 로그 인수가 아니라 계급 하나다 — 총비용 524,800 →
    // 8,390,656 → 134,225,920 으로 $r$ 이 16 이다.
    const skewed = judgeScenario(
      scanningCartesianTree,
      scenarioOf(cartesianTreeContract, "constructor", true),
      "complexity",
    );
    const skewedStats = skewed.points.map((point) => point.stat);
    expect((skewedStats[1] ?? 0) / (skewedStats[0] ?? 1)).toBeGreaterThan(12);

    // ② 트리를 세우지 않고 수열 조각만 드는 구현. **구성 둘을 통과한다** — 사본을 뜨는 것이
    //    전부라 선형이다. 걸리는 것은 훑기 둘이고, 값은 전부 옳으므로 축1도 통과한다.
    expect(outcomes(rescanningCartesianView, cartesianTreeContract)).toEqual({
      constructor: true,
      "constructor (적대적)": true,
      size·value·left·right: false,
      "size·value·left·right (적대적)": false,
      "inOrder (적대적)": true,
    });
  }, 60_000);

  /**
   * **사슬 시나리오가 혼자 잡는 계열이 있다.**
   *
   * 훑기를 겨눈 시나리오가 둘인 이유가 이 자리다. 앞 두 fixture 는 두 시나리오에서 똑같이
   * 굴어 **적대적 입력의 몫을 말하지 못한다** — 같은 행을 겨눈 시나리오를 둘 두면서 결함
   * 하나로만 재면 그 하나가 둘 다에서 걸려 무엇이 더 잡히는지가 안 보인다(불변 사실 118).
   *
   * 부분트리 객체가 뿌리부터의 길을 복사해 드는 구현이 그 계열이다. 걸음 하나가 지금 깊이에
   * 비례하므로 무작위 수열에서는 로그이고 사슬에서는 선형이다. 이것은 「트리를 잘못 지었다」가
   * 아니라 **부분트리를 값으로 돌려주는 계약이 실제로 여는 실패 자리**다.
   */
  test("깊이에 비례하는 걸음은 무작위 훑기를 통과하고 사슬에서만 걸린다", () => {
    expect(outcomes(pathCopyingCartesianTree, cartesianTreeContract)).toEqual({
      constructor: true,
      "constructor (적대적)": true,
      size·value·left·right: true,
      "size·value·left·right (적대적)": false,
      "inOrder (적대적)": true,
    });

    // 무작위: 단일 걸음 최대가 18 → 22 → 24 다. $r$ 이 1.22·1.09 로 허용 상단 1.30 **아래**라
    // 통과하는 것이지, 이 구현이 상수 걸음이어서가 아니다.
    const balanced = judgeScenario(
      pathCopyingCartesianTree,
      scenarioOf(cartesianTreeContract, "size", false),
      "complexity",
    );
    const balancedStats = balanced.points.map((point) => point.stat);
    expect((balancedStats[2] ?? 0) / (balancedStats[0] ?? 1)).toBeLessThan(2);

    // 사슬: 1,026 → 4,099 → 16,386 으로 걸음이 마디 수에 비례한다.
    const chained = judgeScenario(
      pathCopyingCartesianTree,
      scenarioOf(cartesianTreeContract, "size", true),
      "complexity",
    );
    expect(chained.ok).toBe(false);
    const chainedStats = chained.points.map((point) => point.stat);
    expect((chainedStats[1] ?? 0) / (chainedStats[0] ?? 1)).toBeGreaterThan(3);
  }, 60_000);

  /**
   * **동적 숲의 자명한 구현 둘이 정확히 반대쪽에서 걸린다.**
   *
   * `tree/linkCutTree` 계약이 검증 등급 항목에 든 반례가 이 둘이고, 여기서 그 둘이
   * 서로를 보완하지 못한다는 것이 수치로 나온다 — 간선만 적어 두면 갱신이 상수인 대신
   * 판정이 마디 수에 비례하고, 덩어리 번호를 적어 두면 그 반대다.
   *
   * **`RelabelingForest` 의 `link` 가 통과하는 것이 이 자리의 요점이다.** 작은 쪽만 다시
   * 적으면 넣기는 상각 로그 안에 들어온다(2.8 → 2.7 → 2.8). 자명한 구현이라고 해서 모든
   * 행에서 걸리지 않는다 — **걸리는 행은 `cut` 하나뿐이고**, 「크기가 두 배가 될 때까지
   * 기다린다」는 논증이 빼기로 넘어가지 못하는 것이 그 이유다.
   *
   * **통과하는 자리 중 계약 위반은 없다**(불변 사실 62). `ScanningForest` 의 `cut` 은
   * 실제로 상수이고 `RelabelingForest` 의 `connected` 도 실제로 상수다.
   */
  test("동적 숲의 자명한 구현 둘이 서로 반대쪽 행에서 걸린다", () => {
    expect(outcomes(scanningForest, linkCutTreeContract)).toEqual({
      link: false,
      "link (적대적)": false,
      connected: false,
      "connected (적대적)": false,
      cut: true,
      "cut (적대적)": true,
    });

    expect(outcomes(relabelingForest, linkCutTreeContract)).toEqual({
      link: true,
      "link (적대적)": true,
      connected: true,
      "connected (적대적)": true,
      cut: false,
      "cut (적대적)": false,
    });

    // 빼기가 덩어리를 반으로 가르는 자리를 되풀이하면 514 → 2,050 → 8,194 다.
    const halving = judgeScenario(
      relabelingForest,
      scenarioOf(linkCutTreeContract, "cut", true),
      "complexity",
    );
    const stats = halving.points.map((point) => point.stat);
    expect((stats[1] ?? 0) / (stats[0] ?? 1)).toBeGreaterThan(3);
  }, 60_000);

  /**
   * **모양이 이미 나무인 결함은 사슬에서만 걸린다.**
   *
   * 앞의 둘과 다른 계열이다. 지나간 길을 고쳐 쓰지 않는 부모 포인터 숲은 무작위로 이어
   * 붙인 숲에서 깊이가 얕아 계약을 지키는 것처럼 보이고, 마디 수만큼 깊은 나무가 들어오면
   * 그때 걸린다. 같은 행을 겨눈 시나리오를 적대·비적대로 둘 두는 것이 무엇을 사는지가 이
   * fixture 하나로 보인다(불변 사실 118 이 그대로 한 번 더).
   *
   * **통과하는 자리 중 하나가 계약 위반을 숨긴다**(불변 사실 62). `link (적대적)` 이
   * 통과하는데(4.0 고정 — 한 줄로 이어 나가면 뿌리를 세울 일이 없다) 이 구현의 `link` 는
   * 계약을 어긴다. 잡는 것은 같은 행의 **비적대** 시나리오다. 적대적 입력이 늘 더 많이
   * 잡는 것이 아니라는 자리이고, 시나리오를 행마다 둘 둔 근거가 여기 있다.
   */
  test("길을 고쳐 쓰지 않는 숲은 무작위 잇기와 사슬 묻기에서 갈린다", () => {
    expect(outcomes(unsplayedForest, linkCutTreeContract)).toEqual({
      link: false,
      "link (적대적)": true,
      connected: false,
      "connected (적대적)": false,
      cut: true,
      "cut (적대적)": true,
    });

    // 사슬 묻기: 513.5 → 2,049.5 → 8,193.5 으로 걸음이 마디 수에 비례한다.
    const chainQuery = judgeScenario(
      unsplayedForest,
      scenarioOf(linkCutTreeContract, "connected", true),
      "complexity",
    );
    const queryStats = chainQuery.points.map((point) => point.stat);
    expect((queryStats[1] ?? 0) / (queryStats[0] ?? 1)).toBeGreaterThan(3);

    // 무작위 잇기: 22.3 → 30.1 → 51.1. 이차가 아니라 **로그보다 빠르게 자라는** 것으로
    // 걸린다 — 허용 상단 1.56 을 넘는 것이 판정의 전부다.
    const randomLink = judgeScenario(
      unsplayedForest,
      scenarioOf(linkCutTreeContract, "link", false),
      "complexity",
    );
    const linkStats = randomLink.points.map((point) => point.stat);
    expect((linkStats[2] ?? 0) / (linkStats[1] ?? 1)).toBeGreaterThan(1.56);
  }, 60_000);
});

/**
 * 축2가 잡으라고 있는 결함들. `_fixtures/` 의 것들과 달리 **동작이 틀린 구현**이라 축1도 함께
 * 잡는다. 다른 것은 실패가 말해 주는 내용이다 — 축1은 몇 번째 호출에서 값이 갈렸는지를
 * 말하고, 축2는 무엇이 깨졌는지를 이름으로 말한다.
 */
class LowKeyedIndex implements IntervalTreeContract {
  /** 시작점만 키로 잡았다. 시작점이 같은 구간을 넣으면 앞의 것이 조용히 밀려난다. */
  #byLow = new Map<number, [number, number]>();
  #inserted = 0;

  insert(low: number, high: number): void {
    this.#byLow.set(low, [low, high]);
    this.#inserted += 1;
  }

  delete(low: number, high: number): boolean {
    const stored = this.#byLow.get(low);
    if (stored === undefined || stored[1] !== high) return false;
    this.#byLow.delete(low);
    this.#inserted -= 1;
    return true;
  }

  stabQuery(point: number): [number, number][] {
    return this.overlapQuery(point, point);
  }

  overlapQuery(low: number, high: number): [number, number][] {
    const found: [number, number][] = [];
    for (const stored of this.#byLow.values()) {
      if (stored[0] <= high && low <= stored[1]) found.push([...stored]);
    }
    return found;
  }

  size(): number {
    return this.#inserted;
  }
}

class SplitQueryIndex implements IntervalTreeContract {
  #items: [number, number][] = [];

  insert(low: number, high: number): void {
    this.#items.push([low, high]);
  }

  delete(low: number, high: number): boolean {
    const at = this.#items.findIndex(
      (stored) => stored[0] === low && stored[1] === high,
    );
    if (at < 0) return false;
    this.#items.splice(at, 1);
    return true;
  }

  /** 구간 질의와 따로 썼고, 끝점 비교가 한 글자 다르다. 끝점에 정확히 닿는 구간을 놓친다. */
  stabQuery(point: number): [number, number][] {
    return this.#items
      .filter((stored) => stored[0] <= point && point < stored[1])
      .map((stored) => [...stored] as [number, number]);
  }

  overlapQuery(low: number, high: number): [number, number][] {
    return this.#items
      .filter((stored) => stored[0] <= high && low <= stored[1])
      .map((stored) => [...stored] as [number, number]);
  }

  size(): number {
    return this.#items.length;
  }
}

describe("축2 — 불변식이 상태의 성질을 실제로 잡는다", () => {
  const [completeness, agreement] = intervalTreeContract.invariants;

  test("불변식 절이 둘이고 정본은 둘 다 만족한다", () => {
    expect(intervalTreeContract.invariants).toHaveLength(2);
    const impl = new ReferenceIntervalTree();
    impl.insert(1, 5);
    impl.insert(1, 9);
    impl.insert(3, 3);
    for (const invariant of intervalTreeContract.invariants) {
      expect(invariant.check(impl)).toBeNull();
    }
  });

  test("세고 있는 수와 내놓을 수 있는 수가 갈리면 불변식 1이 잡는다", () => {
    const impl = new LowKeyedIndex();
    impl.insert(1, 5);
    impl.insert(1, 9);
    expect(completeness?.check(impl)).toContain("전 범위 질의 1개 / size 2");
    // 두 질의는 서로 갈리지 않는다 — 같은 것을 잃었기 때문이다.
    expect(agreement?.check(impl)).toBeNull();
  });

  test("두 질의를 따로 쓰면 불변식 2가 갈림을 잡는다", () => {
    const impl = new SplitQueryIndex();
    impl.insert(1, 5);
    // 잃은 것이 없으므로 개수는 맞는다. 갈리는 것은 끝점 하나에서다.
    expect(completeness?.check(impl)).toBeNull();
    expect(agreement?.check(impl)).toContain("p=5");
  });
});

/** 자리를 정해 두고 넘치면 앞에서부터 버리는데, 붙인 횟수는 그대로 센다. */
class CappedLogList implements XorLinkedListContract {
  #values: number[] = [];
  #appended = 0;

  append(value: number): void {
    this.#values.push(value);
    if (this.#values.length > 8) this.#values.shift();
    this.#appended += 1;
  }

  toArray(): number[] {
    return [...this.#values];
  }

  toArrayReverse(): number[] {
    return [...this.#values].reverse();
  }

  size(): number {
    return this.#appended;
  }
}

/** 방향마다 이음을 따로 들었다. 뒤쪽 벌에 붙이는 자리가 앞쪽 벌과 같아서 두 벌이 갈린다. */
class TwoChainList implements XorLinkedListContract {
  #forward: number[] = [];
  #backward: number[] = [];

  append(value: number): void {
    this.#forward.push(value);
    this.#backward.push(value);
  }

  toArray(): number[] {
    return [...this.#forward];
  }

  toArrayReverse(): number[] {
    return [...this.#backward];
  }

  size(): number {
    return this.#forward.length;
  }
}

describe("축2 — 관측 경로가 둘이라야 정합을 물을 수 있다", () => {
  const [counted, agreed] = xorLinkedListContract.invariants;

  test("불변식 절이 둘이고 정본은 둘 다 만족한다", () => {
    expect(xorLinkedListContract.invariants).toHaveLength(2);
    const impl = new ReferenceXorLinkedList();
    for (const value of [3, 0, -1, 3]) impl.append(value);
    for (const invariant of xorLinkedListContract.invariants) {
      expect(invariant.check(impl)).toBeNull();
    }
  });

  test("자리가 넘쳐 앞을 버리면 불변식 1이 잡는다", () => {
    const impl = new CappedLogList();
    for (let i = 0; i < 9; i++) impl.append(i);
    expect(counted?.check(impl)).toContain("순회 8개 / size 9");
    // 버린 뒤에도 두 방향은 서로의 역순이다 — 같은 것을 잃었기 때문이다.
    expect(agreed?.check(impl)).toBeNull();
  });

  test("방향마다 이음을 따로 들면 불변식 2가 갈림을 잡는다", () => {
    const impl = new TwoChainList();
    impl.append(1);
    // 원소가 하나면 뒤집어도 같으므로 아직 갈리지 않는다.
    expect(agreed?.check(impl)).toBeNull();

    impl.append(2);
    // 잃은 것이 없으므로 개수는 맞는다. 갈리는 것은 순서다.
    expect(counted?.check(impl)).toBeNull();
    expect(agreed?.check(impl)).toContain("0번째에서 갈린다");
  });
});

/**
 * 최소·최대를 필드에 들어 두고 `add` 에서만 갱신한다. 지울 때 갱신을 빠뜨렸다.
 *
 * 이 구현은 **동작상 옳아 보인다** — `toArray()` 는 정렬돼 있고 개수도 다중도도 맞는다.
 * 갈리는 것은 최소를 읽는 두 길뿐이다. B10 이 `tree/multiset` 에 이 불변식을 새로 넣은
 * 근거가 이 구현이다.
 */
class StaleMinMultiset implements MultisetContract<number> {
  #items: number[] = [];
  #min: number | null = null;
  #max: number | null = null;

  add(item: number): void {
    const at = this.#items.findIndex((value) => value > item);
    this.#items.splice(at < 0 ? this.#items.length : at, 0, item);
    if (this.#min === null || item < this.#min) this.#min = item;
    if (this.#max === null || item > this.#max) this.#max = item;
  }

  delete(item: number): boolean {
    const at = this.#items.indexOf(item);
    if (at < 0) return false;
    this.#items.splice(at, 1);
    // 여기서 #min·#max 를 다시 잡아야 하는데 잡지 않는다.
    return true;
  }

  deleteAll(item: number): number {
    let removed = 0;
    while (this.delete(item)) removed += 1;
    return removed;
  }

  has(item: number): boolean {
    return this.#items.includes(item);
  }

  count(item: number): number {
    return this.#items.filter((value) => value === item).length;
  }

  min(): number | null {
    return this.#min;
  }

  max(): number | null {
    return this.#max;
  }

  size(): number {
    return this.#items.length;
  }

  toArray(): number[] {
    return [...this.#items];
  }
}

describe("축2 — B10 이 multiset 의 불변식 한 자리를 갈았다", () => {
  const [counted, multiplicity, ends] = multisetContract.invariants;

  test("불변식 절이 셋이고 정본은 셋 다 만족한다", () => {
    expect(multisetContract.invariants).toHaveLength(3);
    const impl = new ReferenceMultiset<number>();
    for (const value of [5, 1, 5, 9]) impl.add(value);
    impl.delete(1);
    for (const invariant of multisetContract.invariants) {
      expect(invariant.check(impl)).toBeNull();
    }
  });

  test("최소를 캐시하고 지울 때 갱신을 빠뜨리면 불변식 3이 잡는다", () => {
    const impl = new StaleMinMultiset();
    for (const value of [1, 5, 9]) impl.add(value);
    expect(ends?.check(impl)).toBeNull();

    impl.delete(1);
    // 개수도 다중도도 맞는다. 갈리는 것은 최소를 읽는 두 길뿐이다.
    expect(counted?.check(impl)).toBeNull();
    expect(multiplicity?.check(impl)).toBeNull();
    expect(ends?.check(impl)).toContain("min 1 인데 첫 원소 5");
  });

  test("정렬 순서는 축2가 아니라 축1이 본다 — 읽는 길이 하나뿐이다", () => {
    // `toArray()` 의 의미 열이 「비내림차순 배열의 사본」이므로 참조 모델과의 대조가 판정한다.
    const names = multisetContract.invariants.map(
      (invariant) => invariant.name,
    );
    expect(names.some((name) => name.includes("비내림차순"))).toBe(false);
  });
});

/**
 * **등급이 `invariant` 라는 것이 「축2가 주 판별기다」의 다른 이름이다.**
 *
 * `tree/binarySearchTree` 계약은 상한이 선형이라 축3이 위아래로 한 자리씩 눈이 멀어 있다
 * (위는 로그 인수, 아래는 계약이 허용하는 더 빠른 계급). 남는 판별기가 축2이고, 그 넷이
 * 나란한 넷의 넷과 **같다** — 판별 절차가 상한을 읽지 않기 때문이다.
 */
describe("축2 — 상한이 느슨하면 축2가 주 판별기다", () => {
  const [counted, membership, ends, ranged] =
    binarySearchTreeContract.invariants;

  test("불변식 절이 넷이고 나란한 넷의 넷과 같다 — 상한을 내려도 안 움직인다", () => {
    expect(binarySearchTreeContract.invariants).toHaveLength(4);
    expect(
      binarySearchTreeContract.invariants.map((invariant) => invariant.name),
    ).toEqual(
      redBlackTreeContract.invariants.map((invariant) => invariant.name),
    );

    const impl = new ReferenceBinarySearchTree<number>();
    for (const value of [5, 1, 9, 3]) impl.insert(value);
    impl.delete(1);
    for (const invariant of binarySearchTreeContract.invariants) {
      expect(invariant.check(impl)).toBeNull();
    }
  });

  test("양 끝을 캐시하고 지울 때 갱신을 빠뜨리면 불변식 3이 잡는다", () => {
    const impl = new StaleEndCacheSet<number>();
    for (const value of [1, 5, 9]) impl.insert(value);
    // 아직 갈리지 않는다 — 캐시가 옳다.
    for (const invariant of binarySearchTreeContract.invariants) {
      expect(invariant.check(impl)).toBeNull();
    }

    impl.delete(1);
    // 개수도 담김 여부도 구간도 맞는다. 갈리는 것은 양 끝을 읽는 두 길뿐이다.
    expect(counted?.check(impl)).toBeNull();
    expect(membership?.check(impl)).toBeNull();
    expect(ranged?.check(impl)).toBeNull();
    expect(ends?.check(impl)).toContain("min()=1 인데 첫 원소는 5 다");
  });

  test("그 구현을 축3은 통과시킨다 — 담는 모양이 정본과 같아서다", () => {
    for (const scenario of binarySearchTreeContract.scenarios) {
      expect(judgeScenario(staleEndCacheSet, scenario, "invariant").ok).toBe(
        true,
      );
    }
  });
});

/**
 * 위치를 세는 값을 따로 들고 지울 때 갱신을 빠뜨렸다.
 *
 * **이 구현은 담기는 쪽 계약(`tree/multiset`)의 불변식 셋을 전부 만족한다** — `toArray()` 도
 * 개수도 다중도도 양 끝도 맞는다. 갈리는 것은 위치를 읽는 두 길뿐이고, 그 길이 담는 쪽
 * 계약에서만 열린다.
 */
class StaleRankIndexMultiset implements OrderStatisticTreeContract<number> {
  #items: number[] = [];
  /** 위치 질의만 읽는 사본. `add` 에서만 다시 뜬다. */
  #index: number[] = [];

  add(item: number): void {
    const at = this.#items.findIndex((value) => value > item);
    this.#items.splice(at < 0 ? this.#items.length : at, 0, item);
    this.#index = [...this.#items];
  }

  delete(item: number): boolean {
    const at = this.#items.indexOf(item);
    if (at < 0) return false;
    this.#items.splice(at, 1);
    // 여기서 #index 를 다시 떠야 하는데 뜨지 않는다.
    return true;
  }

  deleteAll(item: number): number {
    let removed = 0;
    while (this.delete(item)) removed += 1;
    return removed;
  }

  has(item: number): boolean {
    return this.#items.includes(item);
  }

  count(item: number): number {
    return this.#items.filter((value) => value === item).length;
  }

  rankOf(item: number): number {
    return this.#index.filter((value) => value < item).length;
  }

  at(index: number): number | null {
    if (!Number.isInteger(index)) return null;
    if (index < 0 || index >= this.#index.length) return null;
    return this.#index[index] as number;
  }

  min(): number | null {
    return this.#items.length === 0 ? null : (this.#items[0] as number);
  }

  max(): number | null {
    return this.#items.length === 0
      ? null
      : (this.#items[this.#items.length - 1] as number);
  }

  size(): number {
    return this.#items.length;
  }

  toArray(): number[] {
    return [...this.#items];
  }
}

/**
 * **불변식 판별 절차가 계약마다 다른 답을 내는 자리.**
 *
 * T1-03 이 남긴 것은 「정본이 내부 판정에만 쓰는 값은 네 축이 검사하지 않는다」였다
 * (불변 사실 109) — 그때 어긋난 것이 부분트리 크기였고, 그 계약에는 그 값을 읽는 공개 연산이
 * 없어서 축1·축2·축3이 전부 통과시켰다. **이 계약에는 그 연산이 둘 있다.** 같은 종류의
 * 어긋남이 여기서는 불변식 넷째·다섯째에 이름으로 걸린다 — 아래 fixture 가 위치 경로만
 * 낡게 만든 것이라 정확히 그 둘이다. **어느 불변식이 걸리는지는 구현이 정한다**: 이 계약의
 * 정본은 `size`·`count` 도 같은 값을 읽으므로 그쪽이 어긋나면 1·2 도 함께 걸린다.
 *
 * 그러므로 불변 사실 109 의 처분(정본 헤더에 적고 감사 스크립트를 따로 돌린다)은 이 계약에
 * 걸리지 않는다. 관측되면 축이 본다.
 */
describe("축2 — 위치를 세는 값이 관측되면 그 갈림을 잡는다", () => {
  const [, , , ranked, positioned] = orderStatisticTreeContract.invariants;

  test("불변식이 다섯이고 앞의 셋은 담기는 쪽 계약의 셋과 같다", () => {
    expect(orderStatisticTreeContract.invariants).toHaveLength(5);
    expect(
      orderStatisticTreeContract.invariants
        .slice(0, 3)
        .map((invariant) => invariant.name),
    ).toEqual(multisetContract.invariants.map((invariant) => invariant.name));

    const impl = new ReferenceOrderStatisticTree<number>();
    for (const value of [5, 1, 5, 9]) impl.add(value);
    impl.delete(1);
    for (const invariant of orderStatisticTreeContract.invariants) {
      expect(invariant.check(impl)).toBeNull();
    }
  });

  test("위치를 세는 사본이 낡으면 뒤의 둘만 걸린다", () => {
    const impl = new StaleRankIndexMultiset();
    for (const value of [1, 5, 9]) impl.add(value);
    for (const invariant of orderStatisticTreeContract.invariants) {
      expect(invariant.check(impl)).toBeNull();
    }

    impl.delete(1);
    // 앞의 셋은 그대로 성립한다 — 개수도 다중도도 양 끝도 `#items` 에서 나온다.
    for (const invariant of orderStatisticTreeContract.invariants.slice(0, 3)) {
      expect(invariant.check(impl)).toBeNull();
    }
    expect(ranked?.check(impl)).toContain("rankOf(2)=1 인데 실제 0");
    expect(positioned?.check(impl)).toContain("at(0)=1");
  });

  test("담기는 쪽 계약에는 같은 갈림을 물을 자리가 없다", () => {
    const impl = new StaleRankIndexMultiset();
    for (const value of [1, 5, 9]) impl.add(value);
    impl.delete(1);
    // 같은 상태를 `tree/multiset` 의 불변식 셋에 물으면 **전부 통과한다.** 그 계약에서
    // 위치는 관측되지 않으므로 갈릴 상대가 없다(불변 사실 109 와 같은 자리).
    for (const invariant of multisetContract.invariants) {
      expect(invariant.check(impl)).toBeNull();
    }
  });
});

describe("축3 — 하네스가 계측을 신뢰하지 않는다", () => {
  test("amortized 계약은 n 회 측정을 요구한다", () => {
    const verdict = judgeScenario(
      referenceStack,
      {
        covers: ["push"],
        qualifier: "amortized",
        bound: "O(1)",
        adversarial: false,
        run: (impl, _n, ctx) => {
          for (let i = 0; i < 4; i++) ctx.step(() => impl.push(i));
        },
      },
      "basic",
    );
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toContain("n 회 측정");
  });
});
