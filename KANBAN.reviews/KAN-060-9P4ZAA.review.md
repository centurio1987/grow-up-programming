---
card: KAN-060-9P4ZAA
title: 알고리즘 가이드에 문제를 통합한다.
created: 2026-09-29
branch: KAN-060-9P4ZAA
worktree: /Users/centurio/orca/workspaces/code_test/KAN-060-9P4ZAA
base: 6d46c82
status: 검토 대기
---

# KAN-060-9P4ZAA 검토 요청 — 알고리즘 가이드에 문제를 통합한다.

카드: [KAN-060-9P4ZAA.md](../KANBAN.cards/KAN-060-9P4ZAA.md)

> 이 문서는 **검토를 위한 산출물**이다. 수행 내역은 카드 실행 문서에 있고, 착수 전
> 계획은 배치 문서에 있다. 여기 있는 것은 "지금 이 브랜치를 무엇으로 판정하는가" 뿐이다.

## 1. 검토 대상

| 항목 | 값 |
|---|---|
| 브랜치 | `KAN-060-9P4ZAA` |
| 워크트리 | `/Users/centurio/orca/workspaces/code_test/KAN-060-9P4ZAA` |
| 베이스 | `6d46c82` |
| 변경 훑기 | `git diff 6d46c82...HEAD` |

**커밋 16건**

```text
d15970d KAN-060 S9: 책 간지는 「파트」 제목만 요약에 싣는다(실습 제외), algo-wbs 편수 시험 115 로
03196e0 KAN-060: 옮긴 실습 문장의 사실 오류 1곳·띄어쓰기 7곳 바로잡음
2a5f6bf kanban: KAN-060 배치 4 착수 판단 기록
ba772d2 KAN-060 S12: 신규 가이드 bit-manipulation/binaryGap (v2 · 실습 절 · problem.md 삭제)
929507e KAN-060 S11: 신규 가이드 etc/numberOfDisintersection (v2 · 실습 절 · problem.md 삭제)
7dd94e7 KAN-060 S10: 신규 가이드 array/twoSum (v2 · 실습 절 · problem.md 삭제)
103261b KAN-060 S8: 신규 가이드 array/missingInteger (v2 · 실습 절 · problem.md 삭제)
1594802 kanban: KAN-060 S8 을 신규 가이드 넷(S8·S10·S11·S12)으로 나눔
ec9d42b KAN-060 S7: 가이드 없는 문제 넷을 같은 알고리즘 가이드의 실습으로 흡수(kadane·maxProfit·tapeEquilibrium·genomicRangeQuery)
055b844 KAN-060 S6: 문제 문서 110개를 가이드 끝 실습 절로 옮기고 삭제, 링크 131개를 가이드로
c134cd1 KAN-060 S6: 문제 문서 → 실습 절 이전 도구(아직 실행 안 함, dry-run 통과)
f088365 KAN-060 S4: 파일럿 sparseTableRangeMin 을 알고리즘 중심으로, 문서 끝 실습 절, problem.md 삭제
298c12b KAN-060 S3: problem spec 퇴역(SPEC practice 로 이관), gen-problem·guide-for-problem·README·CLAUDE.md 정정, authoring lock 갱신
c885537 KAN-060 S2: P22 실습 절 구조 · P23 실습 문제 지칭 검사, 본문 검사는 실습 앞까지
e656373 KAN-060 S1: SPEC practice 절·L49 신설, deep.origin ① 과제 고정, voice 규칙 9 개정
648f74c kanban: KAN-060 진행 중으로 이동 — 워크트리 착수
```

**변경 파일 302개 (+18147 −8270)**

| 파일 | 상태 | 추가 | 삭제 |
|---|:--:|---:|---:|
| `.claude/authoring.lock.json` | M | 2 | 3 |
| `.claude/authoring/specs/problem/spec.json` | M | 0 | 98 |
| `.claude/authoring/specs/problem/spec.md` | M | 0 | 119 |
| `.claude/authoring/voices/algorithm-guide-writer/voice.md` | M | 3 | 1 |
| `.claude/skills/gen-problem/SKILL.md` | M | 46 | 72 |
| `.claude/skills/guide-for-problem/SKILL.md` | M | 10 | 2 |
| `.kanban/archive.jsonl` | M | 7 | 0 |
| `.kanban/log.md` | M | 7 | 7 |
| `.kanban/state.json` | M | 90 | 89 |
| `CLAUDE.md` | M | 2 | 2 |
| `KANBAN.batches/KAN-060-9P4ZAA.batch1.md` | M | 2 | 1 |
| `KANBAN.batches/KAN-060-9P4ZAA.batch2.md` | M | 2 | 1 |
| `KANBAN.batches/KAN-060-9P4ZAA.batch3.md` | M | 2 | 1 |
| `KANBAN.batches/KAN-060-9P4ZAA.batch4.md` | M | 3 | 2 |
| `KANBAN.board.html` | M | 4 | 4 |
| `KANBAN.cards/KAN-034-KSD7XR.md` | M | 1 | 1 |
| `KANBAN.cards/KAN-034.8-BK1Q3A.md` | M | 1 | 1 |
| `KANBAN.cards/KAN-035-31T4BY.md` | M | 2 | 2 |
| `KANBAN.cards/KAN-056-VPCM91.md` | M | 1 | 1 |
| `KANBAN.cards/KAN-057-J36E1B.md` | M | 1 | 1 |
| `KANBAN.cards/KAN-060-9P4ZAA.md` | M | 47 | 14 |
| `KANBAN.md` | M | 14 | 14 |
| `README.md` | M | 5 | 6 |
| `sandbox/algo-guide-v2/FEEDBACK.md` | M | 3 | 2 |
| `sandbox/algo-guide-v2/SPEC.md` | M | 117 | 6 |
| `sandbox/ds-guide-v2/SPEC.md` | M | 1 | 1 |
| `src/algorithms/advanced/convexHullTrick/convexHullTrick-guide.md` | M | 85 | 0 |
| `src/algorithms/advanced/convexHullTrick/convexHullTrick-problem.md` | M | 0 | 78 |
| `src/algorithms/advanced/countInversions/countInversions-guide.md` | M | 59 | 0 |
| `src/algorithms/advanced/countInversions/countInversions-problem.md` | M | 0 | 52 |
| `src/algorithms/advanced/divideAndConquerDp/divideAndConquerDp-guide.md` | M | 73 | 1 |
| `src/algorithms/advanced/divideAndConquerDp/divideAndConquerDp-problem.md` | M | 0 | 65 |
| `src/algorithms/advanced/knuthOptimization/knuthOptimization-guide.md` | M | 59 | 0 |
| `src/algorithms/advanced/knuthOptimization/knuthOptimization-guide.proof.ts` | M | 1 | 1 |
| `src/algorithms/advanced/knuthOptimization/knuthOptimization-problem.md` | M | 0 | 52 |
| `src/algorithms/advanced/meetInTheMiddleSubsetSum/meetInTheMiddleSubsetSum-guide.md` | M | 64 | 0 |
| `src/algorithms/advanced/meetInTheMiddleSubsetSum/meetInTheMiddleSubsetSum-problem.md` | M | 0 | 57 |
| `src/algorithms/advanced/minMaxPair/minMaxPair-guide.md` | M | 60 | 3 |
| `src/algorithms/advanced/minMaxPair/minMaxPair-problem.md` | M | 0 | 50 |
| `src/algorithms/advanced/nQueens/nQueens-guide.md` | M | 62 | 0 |
| `src/algorithms/advanced/nQueens/nQueens-problem.md` | M | 0 | 55 |
| `src/algorithms/array/bestTimeToBuyAndSellStock/bestTimeToBuyAndSellStock-guide.md` | M | 128 | 4 |
| `src/algorithms/array/bestTimeToBuyAndSellStock/bestTimeToBuyAndSellStock-problem.md` | M | 0 | 56 |
| `src/algorithms/array/bestTimeToBuyAndSellStock/maxProfit.md` | R | 0 | 0 |
| `src/algorithms/array/bestTimeToBuyAndSellStock/maxProfit.test.ts` | R | 0 | 0 |
| `src/algorithms/array/bestTimeToBuyAndSellStock/maxProfit.ts` | R | 0 | 0 |
| `src/algorithms/array/bestTimeToBuyAndSellStockK/bestTimeToBuyAndSellStockK-guide.md` | M | 59 | 0 |
| `src/algorithms/array/bestTimeToBuyAndSellStockK/bestTimeToBuyAndSellStockK-problem.md` | M | 0 | 52 |
| `src/algorithms/array/diffArrayRangeUpdate/diffArrayRangeUpdate-guide.md` | M | 77 | 5 |
| `src/algorithms/array/diffArrayRangeUpdate/diffArrayRangeUpdate-problem.md` | M | 0 | 65 |
| `src/algorithms/array/editDistance/editDistance-guide.md` | M | 63 | 1 |
| `src/algorithms/array/editDistance/editDistance-problem.md` | M | 0 | 55 |
| `src/algorithms/array/fenwickRangeSum/fenwickRangeSum-guide.md` | M | 84 | 7 |
| `src/algorithms/array/fenwickRangeSum/fenwickRangeSum-problem.md` | M | 0 | 70 |
| `src/algorithms/array/genomicRangeQuery/genomicRangeQuery-problem.md` | M | 0 | 61 |
| `src/algorithms/array/houseRobber/houseRobber-guide.md` | M | 61 | 5 |
| `src/algorithms/array/houseRobber/houseRobber-problem.md` | M | 0 | 49 |
| `src/algorithms/array/kadane/kadane-guide.md` | M | 66 | 5 |
| `src/algorithms/array/kadane/kadane-problem.md` | M | 0 | 54 |
| `src/algorithms/array/kadane/maxSubarraySum.test.ts` | R | 1 | 1 |
| `src/algorithms/array/kadane/maxSubarraySum.ts` | R | 0 | 0 |
| `src/algorithms/array/largestRectangleInHistogram/largestRectangleInHistogram-guide.md` | M | 68 | 4 |
| `src/algorithms/array/largestRectangleInHistogram/largestRectangleInHistogram-problem.md` | M | 0 | 57 |
| `src/algorithms/array/longestCommonSubsequence/longestCommonSubsequence-guide.md` | M | 64 | 3 |
| `src/algorithms/array/longestCommonSubsequence/longestCommonSubsequence-problem.md` | M | 0 | 54 |
| `src/algorithms/array/longestIncreasingSubsequence/longestIncreasingSubsequence-guide.md` | M | 57 | 0 |
| `src/algorithms/array/longestIncreasingSubsequence/longestIncreasingSubsequence-problem.md` | M | 0 | 50 |
| `src/algorithms/array/longestSubarrayAtMostSum/longestSubarrayAtMostSum-guide.md` | M | 68 | 2 |
| `src/algorithms/array/longestSubarrayAtMostSum/longestSubarrayAtMostSum-problem.md` | M | 0 | 59 |
| `src/algorithms/array/maximumProductSubarray/maximumProductSubarray-guide.md` | M | 69 | 5 |
| `src/algorithms/array/maximumProductSubarray/maximumProductSubarray-problem.md` | M | 0 | 57 |
| `src/algorithms/array/missingInteger/missingInteger-guide.alt.ts` | M | 180 | 0 |
| `src/algorithms/array/missingInteger/missingInteger-guide.bench.json` | M | 14 | 0 |
| `src/algorithms/array/missingInteger/missingInteger-guide.md` | M | 1154 | 0 |
| `src/algorithms/array/missingInteger/missingInteger-guide.proof.ts` | M | 1019 | 0 |
| `src/algorithms/array/missingInteger/missingInteger-guide.ref.ts` | M | 41 | 0 |
| `src/algorithms/array/missingInteger/missingInteger-guide.test.ts` | M | 51 | 0 |
| `src/algorithms/array/missingInteger/missingInteger-problem.md` | M | 0 | 55 |
| `src/algorithms/array/mosAlgorithm/mosAlgorithm-guide.md` | M | 75 | 0 |
| `src/algorithms/array/mosAlgorithm/mosAlgorithm-problem.md` | M | 0 | 68 |
| `src/algorithms/array/nextGreaterElement/nextGreaterElement-guide.md` | M | 62 | 5 |
| `src/algorithms/array/nextGreaterElement/nextGreaterElement-problem.md` | M | 0 | 50 |
| `src/algorithms/array/prefixSumRangeQuery/genomicRangeQuery.md` | R | 0 | 0 |
| `src/algorithms/array/prefixSumRangeQuery/genomicRangeQuery.test.ts` | R | 0 | 0 |
| `src/algorithms/array/prefixSumRangeQuery/genomicRangeQuery.ts` | R | 0 | 0 |
| `src/algorithms/array/prefixSumRangeQuery/genomicRangeQuery_solved.md` | R | 0 | 0 |
| `src/algorithms/array/prefixSumRangeQuery/genomicRangeQuery_solved.ts` | R | 0 | 0 |
| `src/algorithms/array/prefixSumRangeQuery/prefixSumRangeQuery-guide.md` | M | 207 | 6 |
| `src/algorithms/array/prefixSumRangeQuery/prefixSumRangeQuery-problem.md` | M | 0 | 61 |
| `src/algorithms/array/prefixSumRangeQuery/tapeEquilibrium.test.ts` | R | 0 | 0 |
| `src/algorithms/array/prefixSumRangeQuery/tapeEquilibrium.ts` | R | 0 | 0 |
| `src/algorithms/array/segmentTreeRangeMin/segmentTreeRangeMin-guide.md` | M | 87 | 6 |
| `src/algorithms/array/segmentTreeRangeMin/segmentTreeRangeMin-problem.md` | M | 0 | 74 |
| `src/algorithms/array/slidingWindowMaximum/slidingWindowMaximum-guide.md` | M | 66 | 4 |
| `src/algorithms/array/slidingWindowMaximum/slidingWindowMaximum-problem.md` | M | 0 | 55 |
| `src/algorithms/array/sparseTableRangeMin/sparseTableRangeMin-guide.md` | M | 91 | 19 |
| `src/algorithms/array/sparseTableRangeMin/sparseTableRangeMin-problem.md` | M | 0 | 65 |
| `src/algorithms/array/subarraySumEqualsK/subarraySumEqualsK-guide.md` | M | 65 | 5 |
| `src/algorithms/array/subarraySumEqualsK/subarraySumEqualsK-problem.md` | M | 0 | 53 |
| `src/algorithms/array/tapeEquilibrium/tapeEquilibrium-problem.md` | M | 0 | 66 |
| `src/algorithms/array/twoSum/twoSum-guide.alt.ts` | M | 160 | 0 |
| `src/algorithms/array/twoSum/twoSum-guide.bench.json` | M | 10 | 0 |
| `src/algorithms/array/twoSum/twoSum-guide.md` | M | 1007 | 0 |
| `src/algorithms/array/twoSum/twoSum-guide.proof.ts` | M | 855 | 0 |
| `src/algorithms/array/twoSum/twoSum-guide.ref.ts` | M | 34 | 0 |
| `src/algorithms/array/twoSum/twoSum-guide.test.ts` | M | 63 | 0 |
| `src/algorithms/array/twoSum/twoSum-problem.md` | M | 0 | 57 |
| `src/algorithms/binary-search/binarySearch/binarySearch-guide.md` | M | 62 | 0 |
| `src/algorithms/binary-search/binarySearch/binarySearch-problem.md` | M | 0 | 53 |
| `src/algorithms/binary-search/parametricBinarySearch/parametricBinarySearch-guide.md` | M | 55 | 0 |
| `src/algorithms/binary-search/parametricBinarySearch/parametricBinarySearch-problem.md` | M | 0 | 48 |
| `src/algorithms/binary-search/searchInRotatedSortedArray/searchInRotatedSortedArray-guide.md` | M | 61 | 0 |
| `src/algorithms/binary-search/searchInRotatedSortedArray/searchInRotatedSortedArray-problem.md` | M | 0 | 52 |
| `src/algorithms/binary-search/ternarySearch/ternarySearch-guide.md` | M | 71 | 0 |
| `src/algorithms/binary-search/ternarySearch/ternarySearch-problem.md` | M | 0 | 64 |
| `src/algorithms/bit-manipulation/binaryGap/binaryGap-guide.md` | M | 1035 | 0 |
| `src/algorithms/bit-manipulation/binaryGap/binaryGap-guide.proof.ts` | M | 807 | 0 |
| `src/algorithms/bit-manipulation/binaryGap/binaryGap-guide.ref.ts` | M | 33 | 0 |
| `src/algorithms/bit-manipulation/binaryGap/binaryGap-guide.test.ts` | M | 52 | 0 |
| `src/algorithms/bit-manipulation/binaryGap/binaryGap-problem.md` | M | 0 | 51 |
| `src/algorithms/bit-manipulation/enumerateSubmasks/enumerateSubmasks-guide.md` | M | 59 | 3 |
| `src/algorithms/bit-manipulation/enumerateSubmasks/enumerateSubmasks-problem.md` | M | 0 | 49 |
| `src/algorithms/bit-manipulation/lowestSetBit/lowestSetBit-guide.md` | M | 53 | 0 |
| `src/algorithms/bit-manipulation/lowestSetBit/lowestSetBit-problem.md` | M | 0 | 46 |
| `src/algorithms/bit-manipulation/matrixPowerFibonacci/matrixPowerFibonacci-guide.md` | M | 55 | 0 |
| `src/algorithms/bit-manipulation/matrixPowerFibonacci/matrixPowerFibonacci-problem.md` | M | 0 | 48 |
| `src/algorithms/bit-manipulation/singleNumberXor/singleNumberXor-guide.md` | M | 55 | 2 |
| `src/algorithms/bit-manipulation/singleNumberXor/singleNumberXor-problem.md` | M | 0 | 46 |
| `src/algorithms/dp/coinChangeWays/coinChangeWays-guide.md` | M | 66 | 0 |
| `src/algorithms/dp/coinChangeWays/coinChangeWays-problem.md` | M | 0 | 59 |
| `src/algorithms/dp/digitDp/digitDp-guide.md` | M | 61 | 0 |
| `src/algorithms/dp/digitDp/digitDp-problem.md` | M | 0 | 54 |
| `src/algorithms/dp/expectedValueDp/expectedValueDp-guide.md` | M | 66 | 0 |
| `src/algorithms/dp/expectedValueDp/expectedValueDp-problem.md` | M | 0 | 59 |
| `src/algorithms/dp/knapsack01/knapsack01-guide.md` | M | 71 | 0 |
| `src/algorithms/dp/knapsack01/knapsack01-problem.md` | M | 0 | 64 |
| `src/algorithms/dp/matrixChainMultiplication/matrixChainMultiplication-guide.md` | M | 63 | 0 |
| `src/algorithms/dp/matrixChainMultiplication/matrixChainMultiplication-problem.md` | M | 0 | 56 |
| `src/algorithms/dp/palindromePartitioningMinCut/palindromePartitioningMinCut-guide.md` | M | 62 | 0 |
| `src/algorithms/dp/palindromePartitioningMinCut/palindromePartitioningMinCut-problem.md` | M | 0 | 55 |
| `src/algorithms/dp/subsetSum/subsetSum-guide.md` | M | 66 | 0 |
| `src/algorithms/dp/subsetSum/subsetSum-problem.md` | M | 0 | 59 |
| `src/algorithms/dp/treeMaxIndependentSet/treeMaxIndependentSet-guide.md` | M | 68 | 0 |
| `src/algorithms/dp/treeMaxIndependentSet/treeMaxIndependentSet-problem.md` | M | 0 | 61 |
| `src/algorithms/dp/tspBitmask/tspBitmask-guide.md` | M | 68 | 0 |
| `src/algorithms/dp/tspBitmask/tspBitmask-problem.md` | M | 0 | 61 |
| `src/algorithms/dp/unboundedKnapsack/unboundedKnapsack-guide.md` | M | 64 | 0 |
| `src/algorithms/dp/unboundedKnapsack/unboundedKnapsack-problem.md` | M | 0 | 57 |
| `src/algorithms/etc/kadane/kadane-problem.md` | M | 0 | 55 |
| `src/algorithms/etc/maxCounters/maxCounters-guide.md` | M | 74 | 3 |
| `src/algorithms/etc/maxCounters/maxCounters-problem.md` | M | 0 | 62 |
| `src/algorithms/etc/maxProfit/maxProfit-problem.md` | M | 0 | 58 |
| `src/algorithms/etc/numberOfDisintersection/numberOfDisintersection-guide.md` | M | 1125 | 0 |
| `src/algorithms/etc/numberOfDisintersection/numberOfDisintersection-guide.proof.ts` | M | 884 | 0 |
| `src/algorithms/etc/numberOfDisintersection/numberOfDisintersection-guide.ref.ts` | M | 45 | 0 |
| `src/algorithms/etc/numberOfDisintersection/numberOfDisintersection-guide.test.ts` | M | 73 | 0 |
| `src/algorithms/etc/numberOfDisintersection/numberOfDisintersection-problem.md` | M | 0 | 59 |
| `src/algorithms/geometry/bentleyOttmann/bentleyOttmann-guide.md` | M | 83 | 0 |
| `src/algorithms/geometry/bentleyOttmann/bentleyOttmann-problem.md` | M | 0 | 76 |
| `src/algorithms/geometry/closestPairOfPoints/closestPairOfPoints-guide.md` | M | 73 | 0 |
| `src/algorithms/geometry/closestPairOfPoints/closestPairOfPoints-problem.md` | M | 0 | 66 |
| `src/algorithms/geometry/convexHull/convexHull-guide.md` | M | 83 | 4 |
| `src/algorithms/geometry/convexHull/convexHull-problem.md` | M | 0 | 72 |
| `src/algorithms/geometry/pointInPolygon/pointInPolygon-guide.md` | M | 77 | 0 |
| `src/algorithms/geometry/pointInPolygon/pointInPolygon-problem.md` | M | 0 | 70 |
| `src/algorithms/geometry/polygonArea/polygonArea-guide.md` | M | 76 | 0 |
| `src/algorithms/geometry/polygonArea/polygonArea-problem.md` | M | 0 | 69 |
| `src/algorithms/geometry/rotatingCalipersDiameter/rotatingCalipersDiameter-guide.md` | M | 74 | 0 |
| `src/algorithms/geometry/rotatingCalipersDiameter/rotatingCalipersDiameter-problem.md` | M | 0 | 67 |
| `src/algorithms/geometry/segmentsIntersect/segmentsIntersect-guide.md` | M | 77 | 1 |
| `src/algorithms/geometry/segmentsIntersect/segmentsIntersect-problem.md` | M | 0 | 69 |
| `src/algorithms/graph-flow/isBipartite/isBipartite-guide.md` | M | 61 | 0 |
| `src/algorithms/graph-flow/isBipartite/isBipartite-problem.md` | M | 0 | 54 |
| `src/algorithms/graph-flow/kruskalMst/kruskalMst-guide.md` | M | 74 | 0 |
| `src/algorithms/graph-flow/kruskalMst/kruskalMst-problem.md` | M | 0 | 67 |
| `src/algorithms/graph-flow/maxBipartiteMatching/maxBipartiteMatching-guide.md` | M | 85 | 1 |
| `src/algorithms/graph-flow/maxBipartiteMatching/maxBipartiteMatching-problem.md` | M | 0 | 77 |
| `src/algorithms/graph-flow/maxFlow/maxFlow-guide.md` | M | 88 | 0 |
| `src/algorithms/graph-flow/maxFlow/maxFlow-problem.md` | M | 0 | 81 |
| `src/algorithms/graph-flow/minCostMaxFlow/minCostMaxFlow-guide.md` | M | 92 | 0 |
| `src/algorithms/graph-flow/minCostMaxFlow/minCostMaxFlow-problem.md` | M | 0 | 85 |
| `src/algorithms/graph-flow/minCut/minCut-guide.md` | M | 85 | 0 |
| `src/algorithms/graph-flow/minCut/minCut-problem.md` | M | 0 | 78 |
| `src/algorithms/graph-flow/primMst/primMst-guide.md` | M | 73 | 0 |
| `src/algorithms/graph-flow/primMst/primMst-problem.md` | M | 0 | 66 |
| `src/algorithms/graph/articulationPoints/articulationPoints-guide.md` | M | 77 | 0 |
| `src/algorithms/graph/articulationPoints/articulationPoints-problem.md` | M | 0 | 70 |
| `src/algorithms/graph/bfsShortestPath/bfsShortestPath-guide.md` | M | 80 | 0 |
| `src/algorithms/graph/bfsShortestPath/bfsShortestPath-problem.md` | M | 0 | 73 |
| `src/algorithms/graph/bridgesInGraph/bridgesInGraph-guide.md` | M | 77 | 0 |
| `src/algorithms/graph/bridgesInGraph/bridgesInGraph-problem.md` | M | 0 | 70 |
| `src/algorithms/graph/connectedComponents/connectedComponents-guide.md` | M | 74 | 0 |
| `src/algorithms/graph/connectedComponents/connectedComponents-problem.md` | M | 0 | 67 |
| `src/algorithms/graph/countIslands/countIslands-guide.md` | M | 104 | 0 |
| `src/algorithms/graph/countIslands/countIslands-problem.md` | M | 0 | 97 |
| `src/algorithms/graph/dfsAllPaths/dfsAllPaths-guide.md` | M | 94 | 0 |
| `src/algorithms/graph/dfsAllPaths/dfsAllPaths-problem.md` | M | 0 | 87 |
| `src/algorithms/graph/dfsTraversal/dfsTraversal-guide.md` | M | 87 | 0 |
| `src/algorithms/graph/dfsTraversal/dfsTraversal-problem.md` | M | 0 | 80 |
| `src/algorithms/graph/directedCycleDetection/directedCycleDetection-guide.md` | M | 75 | 0 |
| `src/algorithms/graph/directedCycleDetection/directedCycleDetection-problem.md` | M | 0 | 68 |
| `src/algorithms/graph/stronglyConnectedComponents/stronglyConnectedComponents-guide.md` | M | 75 | 0 |
| `src/algorithms/graph/stronglyConnectedComponents/stronglyConnectedComponents-problem.md` | M | 0 | 68 |
| `src/algorithms/graph/topologicalSort/topologicalSort-guide.md` | M | 76 | 1 |
| `src/algorithms/graph/topologicalSort/topologicalSort-problem.md` | M | 0 | 68 |
| `src/algorithms/graph/undirectedCycleDetection/undirectedCycleDetection-guide.md` | M | 74 | 0 |
| `src/algorithms/graph/undirectedCycleDetection/undirectedCycleDetection-problem.md` | M | 0 | 67 |
| `src/algorithms/graph/zeroOneBfs/zeroOneBfs-guide.md` | M | 80 | 0 |
| `src/algorithms/graph/zeroOneBfs/zeroOneBfs-problem.md` | M | 0 | 73 |
| `src/algorithms/number-theory/babyStepGiantStep/babyStepGiantStep-guide.md` | M | 58 | 0 |
| `src/algorithms/number-theory/babyStepGiantStep/babyStepGiantStep-problem.md` | M | 0 | 51 |
| `src/algorithms/number-theory/binomialModP/binomialModP-guide.md` | M | 63 | 0 |
| `src/algorithms/number-theory/binomialModP/binomialModP-problem.md` | M | 0 | 56 |
| `src/algorithms/number-theory/crt/crt-guide.md` | M | 77 | 0 |
| `src/algorithms/number-theory/crt/crt-problem.md` | M | 0 | 68 |
| `src/algorithms/number-theory/extendedEuclidean/extendedEuclidean-guide.md` | M | 73 | 0 |
| `src/algorithms/number-theory/extendedEuclidean/extendedEuclidean-problem.md` | M | 0 | 66 |
| `src/algorithms/number-theory/fastPower/fastPower-guide.md` | M | 66 | 4 |
| `src/algorithms/number-theory/fastPower/fastPower-problem.md` | M | 0 | 55 |
| `src/algorithms/number-theory/fftMultiply/fftMultiply-guide.md` | M | 70 | 0 |
| `src/algorithms/number-theory/fftMultiply/fftMultiply-problem.md` | M | 0 | 63 |
| `src/algorithms/number-theory/gcd/gcd-guide.md` | M | 59 | 0 |
| `src/algorithms/number-theory/gcd/gcd-problem.md` | M | 0 | 52 |
| `src/algorithms/number-theory/isPrimeTrial/isPrimeTrial-guide.md` | M | 62 | 0 |
| `src/algorithms/number-theory/isPrimeTrial/isPrimeTrial-problem.md` | M | 0 | 55 |
| `src/algorithms/number-theory/millerRabin/millerRabin-guide.md` | M | 60 | 0 |
| `src/algorithms/number-theory/millerRabin/millerRabin-problem.md` | M | 0 | 53 |
| `src/algorithms/number-theory/pollardRho/pollardRho-guide.md` | M | 56 | 0 |
| `src/algorithms/number-theory/pollardRho/pollardRho-problem.md` | M | 0 | 49 |
| `src/algorithms/number-theory/sieveOfEratosthenes/sieveOfEratosthenes-guide.md` | M | 65 | 5 |
| `src/algorithms/number-theory/sieveOfEratosthenes/sieveOfEratosthenes-problem.md` | M | 0 | 53 |
| `src/algorithms/shortest-path/aStarSearch/aStarSearch-guide.md` | M | 88 | 0 |
| `src/algorithms/shortest-path/aStarSearch/aStarSearch-problem.md` | M | 0 | 81 |
| `src/algorithms/shortest-path/bellmanFord/bellmanFord-guide.md` | M | 96 | 6 |
| `src/algorithms/shortest-path/bellmanFord/bellmanFord-problem.md` | M | 0 | 83 |
| `src/algorithms/shortest-path/dagShortestPath/dagShortestPath-guide.md` | M | 88 | 4 |
| `src/algorithms/shortest-path/dagShortestPath/dagShortestPath-problem.md` | M | 0 | 77 |
| `src/algorithms/shortest-path/dijkstra/dijkstra-guide.md` | M | 89 | 3 |
| `src/algorithms/shortest-path/dijkstra/dijkstra-problem.md` | M | 0 | 79 |
| `src/algorithms/shortest-path/floydWarshall/floydWarshall-guide.md` | M | 92 | 0 |
| `src/algorithms/shortest-path/floydWarshall/floydWarshall-guide.proof.ts` | M | 1 | 1 |
| `src/algorithms/shortest-path/floydWarshall/floydWarshall-problem.md` | M | 0 | 85 |
| `src/algorithms/shortest-path/spfa/spfa-guide.md` | M | 88 | 5 |
| `src/algorithms/shortest-path/spfa/spfa-problem.md` | M | 0 | 76 |
| `src/algorithms/sorting/countingSort/countingSort-guide.md` | M | 55 | 0 |
| `src/algorithms/sorting/countingSort/countingSort-problem.md` | M | 0 | 48 |
| `src/algorithms/sorting/externalMergeSort/externalMergeSort-guide.md` | M | 99 | 0 |
| `src/algorithms/sorting/externalMergeSort/externalMergeSort-problem.md` | M | 0 | 92 |
| `src/algorithms/sorting/insertionSort/insertionSort-guide.md` | M | 57 | 0 |
| `src/algorithms/sorting/insertionSort/insertionSort-problem.md` | M | 0 | 50 |
| `src/algorithms/sorting/kthSmallest/kthSmallest-guide.md` | M | 98 | 2 |
| `src/algorithms/sorting/kthSmallest/kthSmallest-problem.md` | M | 0 | 94 |
| `src/algorithms/sorting/kthSmallest/kthSmallest.test.ts` | M | 1 | 1 |
| `src/algorithms/sorting/medianFromDataStream/medianFromDataStream-guide.md` | M | 90 | 4 |
| `src/algorithms/sorting/medianFromDataStream/medianFromDataStream-problem.md` | M | 0 | 77 |
| `src/algorithms/sorting/quicksort/quicksort-guide.md` | M | 56 | 0 |
| `src/algorithms/sorting/quicksort/quicksort-problem.md` | M | 0 | 49 |
| `src/algorithms/sorting/radixSort/radixSort-guide.md` | M | 70 | 0 |
| `src/algorithms/sorting/radixSort/radixSort-problem.md` | M | 0 | 63 |
| `src/algorithms/sorting/sortArray/sortArray-guide.md` | M | 58 | 0 |
| `src/algorithms/sorting/sortArray/sortArray-problem.md` | M | 0 | 51 |
| `src/algorithms/sorting/topKFrequent/topKFrequent-guide.md` | M | 73 | 0 |
| `src/algorithms/sorting/topKFrequent/topKFrequent-problem.md` | M | 0 | 66 |
| `src/algorithms/string/ahoCorasick/ahoCorasick-guide.md` | M | 84 | 4 |
| `src/algorithms/string/ahoCorasick/ahoCorasick-guide.test.ts` | M | 1 | 1 |
| `src/algorithms/string/ahoCorasick/ahoCorasick-problem.md` | M | 0 | 73 |
| `src/algorithms/string/findAllOccurrences/findAllOccurrences-guide.md` | M | 61 | 5 |
| `src/algorithms/string/findAllOccurrences/findAllOccurrences-problem.md` | M | 0 | 49 |
| `src/algorithms/string/kasaiLcp/kasaiLcp-guide.md` | M | 73 | 0 |
| `src/algorithms/string/kasaiLcp/kasaiLcp-problem.md` | M | 0 | 66 |
| `src/algorithms/string/longestPalindrome/longestPalindrome-guide.md` | M | 58 | 0 |
| `src/algorithms/string/longestPalindrome/longestPalindrome-problem.md` | M | 0 | 51 |
| `src/algorithms/string/radixTree/radixTree-guide.md` | M | 72 | 3 |
| `src/algorithms/string/radixTree/radixTree-problem.md` | M | 0 | 62 |
| `src/algorithms/string/suffixArray/suffixArray-guide.md` | M | 67 | 3 |
| `src/algorithms/string/suffixArray/suffixArray-problem.md` | M | 0 | 57 |
| `src/algorithms/string/suffixAutomaton/suffixAutomaton-guide.md` | M | 69 | 0 |
| `src/algorithms/string/suffixAutomaton/suffixAutomaton-problem.md` | M | 0 | 62 |
| `src/algorithms/string/trie/trie-guide.md` | M | 73 | 5 |
| `src/algorithms/string/trie/trie-problem.md` | M | 0 | 61 |
| `src/algorithms/tree/heavyLightDecomposition/heavyLightDecomposition-guide.md` | M | 104 | 0 |
| `src/algorithms/tree/heavyLightDecomposition/heavyLightDecomposition-problem.md` | M | 0 | 97 |
| `src/algorithms/tree/lowestCommonAncestor/lowestCommonAncestor-guide.md` | M | 87 | 0 |
| `src/algorithms/tree/lowestCommonAncestor/lowestCommonAncestor-problem.md` | M | 0 | 80 |
| `src/algorithms/tree/subtreeSumQuery/subtreeSumQuery-guide.md` | M | 97 | 0 |
| `src/algorithms/tree/subtreeSumQuery/subtreeSumQuery-problem.md` | M | 0 | 90 |
| `src/algorithms/tree/treeDiameter/treeDiameter-guide.md` | M | 85 | 0 |
| `src/algorithms/tree/treeDiameter/treeDiameter-problem.md` | M | 0 | 78 |
| `src/algorithms/tree/treeIsomorphism/treeIsomorphism-guide.md` | M | 90 | 0 |
| `src/algorithms/tree/treeIsomorphism/treeIsomorphism-problem.md` | M | 0 | 83 |
| `src/algorithms/tree/treeRerooting/treeRerooting-guide.md` | M | 86 | 0 |
| `src/algorithms/tree/treeRerooting/treeRerooting-problem.md` | M | 0 | 79 |
| `tools/_baseline/citations.tsv` | M | 22 | 24 |
| `tools/algo-wbs.test.ts` | M | 6 | 4 |
| `tools/book/fragment.ts` | M | 11 | 5 |
| `tools/check-metaphor.test.ts` | M | 10 | 0 |
| `tools/check-metaphor.ts` | M | 11 | 1 |
| `tools/check-v2.test.ts` | M | 204 | 1 |
| `tools/check-v2.ts` | M | 215 | 25 |
| `tools/migrate-practice.ts` | M | 337 | 0 |
| `tools/section.ts` | M | 43 | 0 |
| `"\353\254\270\354\240\234_\352\260\200\354\235\264\353\223\234_\353\252\251\353\241\235.md"` | M | 3 | 3 |

**롤백 태그 14개**

```text
kan/KAN-060-9P4ZAA/S1
kan/KAN-060-9P4ZAA/S10
kan/KAN-060-9P4ZAA/S11
kan/KAN-060-9P4ZAA/S12
kan/KAN-060-9P4ZAA/S2
kan/KAN-060-9P4ZAA/S3
kan/KAN-060-9P4ZAA/S4
kan/KAN-060-9P4ZAA/S6
kan/KAN-060-9P4ZAA/S7
kan/KAN-060-9P4ZAA/S8
kan/KAN-060-9P4ZAA/batch1
kan/KAN-060-9P4ZAA/batch2
kan/KAN-060-9P4ZAA/batch3
kan/KAN-060-9P4ZAA/batch4
```

## 2. 검증 — 기준과 실행 결과

<!-- 기준은 카드 실행 문서 「검증」 절의 사본이다. 정본은 KANBAN.cards/KAN-060-9P4ZAA.md 이므로
     기준이 바뀌면 그쪽을 고치고 review-init --refresh 로 이 항만 다시 뜬다.
     결과는 착수한 쪽이 이미 돌린 것이다 — 검토자에게 다시 돌리라고 시키지 않는다.
     **다시 돌려 아래와 다르게 나오면 그 자체가 반려 사유다.** -->

**기준**

<!-- 무엇을 실행해 무엇이 나오면 이 카드가 끝난 것인가. -->
```bash
bun run tools/ci.ts all                                  # 4모드 + 게이트
bun run tools/check-v2.ts --all                          # P22·P23 포함
bun run tools/check-links.ts refs src/algorithms         # -problem.md 참조 0
find src/algorithms -name '*-problem.md' | wc -l         # 0
grep -rl 'problem\.md' src/algorithms --include='*.ts' --exclude-dir=_scratch | wc -l   # 0
bun run tools/check-proof.ts --all                   # CI 와 같다(--require 는 main 에서도 세 편이 증명 블록 없음으로 실패)
bun run tools/check-proof.ts --require src/algorithms/array/sparseTableRangeMin/sparseTableRangeMin-guide.md
bun run tools/render-figs.ts --check
bun test tools/check-v2.test.ts
bunx tsc --noEmit
bunx --bun @biomejs/biome check tools/migrate-practice.ts tools/check-v2.ts tools/section.ts
```

**실행 결과**

```text
bun run tools/ci.ts all → all 모드 통과 — 단계 19개(③ 실습 채점은 판정 제외, 미구현 실패가 정상)
bun run tools/check-v2.ts --all → exit 0 (P1~P23, 알고리즘 115편 + 자료구조 3편)
bun run tools/check-links.ts refs src/algorithms → -problem.md 참조 0
find src/algorithms -name '*-problem.md' (\_scratch 제외) → 0
git grep 'problem\.md' src/algorithms/**/*.ts (\_scratch 제외) → 0 (\_scratch 30개 파일은 그대로 둠)
bun run tools/check-proof.ts --all → exit 0
bun run tools/check-proof.ts --require <신규 넷·파일럿> → 26 · 23 · 23 · 22 · 25 전부 실행과 일치
bun run tools/render-figs.ts --check → 통과(115편)
bun test tools/check-v2.test.ts tools/check-metaphor.test.ts → 194 pass 0 fail
bunx tsc --noEmit → 통과
bunx --bun @biomejs/biome check <새·고친 도구 6개> → 경고 0
```

## 3. 판단 항목 — 스크립트가 판정할 수 없는 것

<!-- 스크립트가 판정할 수 없는 것만 적는다 — 값의 진위, 선택지 중 하나를 고른 근거,
     범위를 그은 자리. 2항에서 이미 돌아간 검증을 여기 옮겨 적지 않는다.
     한 줄 형식: 체크박스 하나에 의견 하나 — "<주제> — <지금 고른 값과 그 근거>".
     **의견마다 상세가 따라붙고, 상세는 조각 둘이다** — `**배경**` 과 `**정할 것**` 이
     각각 단독 줄이다(없거나 하나뿐이면 종료코드 12). 검토자는 이 카드를 수행하지
     않았으므로 내부 기호(`L10`·`P5`·`S8`)만 던지면 판정할 재료가 없고, 재료가 있어도
     줄글 한 덩이면 필요한 부분만 골라 읽지 못한다.
       **배경** — 무엇이 문제인가. `- ` 목록으로, 항목 하나에 사실 하나. 기호를 풀어 쓰고
         항목 끝에 `원문: 파일:줄` 이나 링크를 건다. ①②… 로 늘어놓을 것은 항목으로 가른다.
         목록이 없으면 종료코드 12 — 줄글은 화면에서 한 문단으로 붙는다.
       **정할 것** — 정할 것 한 줄. 그 아래 갈래마다 대가와 결과를 표로 단다:
         | 선택지 | 대가 | 그러면 어떻게 되는가 |
       추천은 선택지 셀 맨 앞의 `**추천** ` 접두다. 고를 것이 없는 항목이면 표를 비운다.
     **올리기 전에 둘을 본다.** ① 이 의견이 카드 의도(원문·목적·이유·목표)와 이어지는가
     — 이어지지 않으면 올리지 않는다. 문제를 위한 문제는 판단 항목이 아니라 별도 카드다.
     ② 지시 원본보다 낮은 레이어로 내려가지 않았는가 — 유저가 제품 관점으로 지시했는데
     플래그 이름·함수 이름을 묻고 있으면 서술을 고칠 것이 아니라 올릴 것이 아니다.
     (SKILL.md 5.6 「판단 항목에 무엇을 올리는가」)
     비어 있으면 "기계가 다 판정했고 사람이 정할 것이 없다"는 뜻이다. 그 판단도
     착수한 쪽이 하는 것이지 검토자가 빈칸을 보고 추측할 일이 아니다.
     **승계 절(3-0)이 있으면 그것이 먼저 온다** — 다른 검토서에서 넘어온 의견이고,
     판정은 승계를 받은 이 문서 하나에서만 내려진다. -->

**의견마다 판정과 추가 의견이 따로 붙습니다.** 판정은 상태이고 추가 의견은 말입니다 — 승인/반려를 아직
안 정했어도 의견 하나에만 추가 의견을 달 수 있고, 반대로 의견 하나만 먼저 닫을 수도 있습니다.
`<번호>`는 의견 순서이고, 주제의 문구 일부로도 찾습니다.

```
# 판정 — 승인 · 반려 · 철회
python3 scripts/kanban.py review-judge <project-root> --card KAN-060-9P4ZAA --item <번호> --verdict 승인
# 추가 의견
python3 scripts/kanban.py review-note <project-root> --card KAN-060-9P4ZAA --item <번호> --text "<추가 의견>"
# 추가 의견을 반영하다 새 의견이 생겼으면 (맨 뒤에 붙어 앞 번호가 안 밀립니다)
python3 scripts/kanban.py review-item <project-root> --card KAN-060-9P4ZAA --add "<주제>
  <상세>"
```

**전체 승인은 살아있는 항목이 전부 승인일 때만 섭니다**(철회는 분모에서 빠집니다). 하나라도
반려·추가 의견·미정이면 4항의 전체 승인도 `→ 완료` 이동도 종료코드 14로 거부됩니다.

- [ ] 실습 절의 문제 서술을 옮긴 그대로(평서형 「~한다」) 둘 것인가 — 그대로 두었습니다
    - **배경**
      - 가이드 본문은 존댓말(「~습니다」)이고, 끝에 붙은 실습 절은 옛 문제 문서를 한 글자도 안 바꾸고 옮겨 「~한다」로 끝납니다. 한 문서 안에서 문체가 갈립니다. 원문: sandbox/algo-guide-v2/SPEC.md §3 practice 「문체는 문제 서술의 것이다」
      - 문체를 검사하는 도구(반말·은유 검사)는 실습 절을 읽지 않도록 고쳤습니다. 옮긴 문장을 고치면 115편의 문제 서술을 사람이 하나씩 다시 써야 합니다.
    - **정할 것**
      실습 절 문체를 이대로 둘 것인가.

    | 선택지 | 대가 | 그러면 어떻게 되는가 |
    | --- | --- | --- |
    | **추천** 이대로 둔다 | 한 문서에 문체가 둘이다 | 문제 서술은 「풀 과제」라는 것이 문체로도 갈려 보인다 |
    | 존댓말로 바꾼다 | 115편 문제 서술을 손으로 다시 쓴다 | KAN-058 재집필 때 편마다 함께 고친다 |

    > **판정** — _아직 없습니다._

    > **추가 의견** — _아직 없습니다._

- [ ] 파일럿의 「이 문제」류 표현을 과제 표현으로 바꾼 서술을 받아들일 것인가 — 11곳을 바꿨습니다
    - **배경**
      - 파일럿(구간 최솟값, Sparse Table) 본문이 「이 문제」·「문제가 정해 두었다」로 실습 문제를 가리키던 11곳을 「이 과제」·「정적 배열」·「이 제약 범위」로 바꿨습니다. 값과 증명은 그대로입니다. 원문: src/algorithms/array/sparseTableRangeMin/sparseTableRangeMin-guide.md
      - 설계 판단에 쓰이던 메모리 256 MB 는 실습 문제의 제한이 아니라 「흔한 채점 환경의 예산인 1 초 · 256 MB」로 불렀고, 이 기준을 명세에 한 줄 적었습니다. 원문: sandbox/algo-guide-v2/SPEC.md §3 deep.origin
      - KAN-058 이 나머지 110편을 다시 쓸 때 이 파일럿이 기준이 됩니다.
    - **정할 것**
      이 바꿔 쓴 방식을 110편의 기준으로 삼을 것인가.

    | 선택지 | 대가 | 그러면 어떻게 되는가 |
    | --- | --- | --- |
    | **추천** 받아들인다 | 없음 | KAN-058 이 같은 방식으로 110편을 고친다 |
    | 다시 쓴다 | 파일럿을 한 번 더 고친다 | 어디가 어색한지 추가 의견으로 주시면 그 방향으로 고친다 |

    > **판정** — _아직 없습니다._

    > **추가 의견** — _아직 없습니다._

- [ ] 새로 쓴 가이드 넷을 걸음 재생 화면과 그림 파일 없이 받아들일 것인가 — 표와 글자 그림으로 세웠습니다
    - **배경**
      - 가이드가 없던 문제 넷(twoSum · missingInteger · numberOfDisintersection · binaryGap)에 새 가이드를 썼습니다. 네 편 모두 명세 검사와 「본문 값 = 실행 결과」 검사를 통과했습니다(증명 22~26개씩). 원문: src/algorithms/array/twoSum/twoSum-guide.md
      - 파일럿에만 있는 웹 걸음 재생 화면과 SVG 그림 파일은 만들지 않았습니다. 명세상 선택 사항이고, 나머지 110편도 아직 없습니다.
    - **정할 것**
      네 편을 이 수준으로 받아들일 것인가.

    | 선택지 | 대가 | 그러면 어떻게 되는가 |
    | --- | --- | --- |
    | **추천** 받아들인다 | 웹에서 걸음을 넘겨 보는 화면이 없다 | 110편과 같은 수준으로 서고, 화면·그림은 KAN-058 때 함께 붙는다 |
    | 이 카드에서 더 만든다 | 편마다 화면·그림 사이드카를 더 쓴다 | 이 카드가 그만큼 길어진다 |

    > **판정** — _아직 없습니다._

    > **추가 의견** — _아직 없습니다._

- [ ] 새 가이드 넷을 목록의 어느 줄에 둘 것인가 — 중요도 줄 셋에 나눠 넣었습니다
    - **배경**
      - 가이드 목록은 중요도 절(★★★·★★·★)과 기법 줄로 짜여 있고, 사람이 자리를 정하는 문서입니다. 원문: 문제_가이드_목록.md
      - 지금 자리: twoSum·missingInteger → ★★★ 「해시맵 / 해시셋」, numberOfDisintersection → ★★★ 「두 포인터 / 슬라이딩 윈도우」(구간 스윕 변형), binaryGap → ★★ 「비트마스크·비트 연산」.
      - 이 자리로 KAN-058 의 작업 순서(중요도 웨이브)가 정해집니다. 셋째·넷째 줄은 이미 v2 로 쓰였으므로 순서에는 영향이 없습니다.
    - **정할 것**
      이 자리를 받아들일 것인가.

    | 선택지 | 대가 | 그러면 어떻게 되는가 |
    | --- | --- | --- |
    | **추천** 받아들인다 | 없음 | 목록이 그대로 선다 |
    | 옮긴다 | 없음 | 옮길 줄을 추가 의견으로 주시면 고친다 |

    > **판정** — _아직 없습니다._

    > **추가 의견** — _아직 없습니다._

- [ ] KAN-039 와의 순서 기록을 같은 결정으로 다시 걸어 둔 것에 동의하는가 — 다시 걸었습니다
    - **배경**
      - 앞서 「KAN-060 먼저, KAN-039(rollingHash·huffmanTree 알고리즘 이관) 뒤」로 정하셨습니다.
      - 작업 중 이 카드가 고치는 파일에 알고리즘 편수 시험(tools/algo-wbs.test.ts)이 더해졌고, 그 파일은 KAN-039 도 고칩니다. 겹침이 하나 늘어 순서 기록이 규칙대로 풀렸습니다.
      - 늘어난 겹침도 같은 순서(KAN-060 이 끝난 뒤 KAN-039 가 전략을 다시 세워 착수) 안에서 풀리므로 같은 결정으로 다시 걸었습니다.
    - **정할 것**
      다시 건 순서 기록을 그대로 둘 것인가.

    | 선택지 | 대가 | 그러면 어떻게 되는가 |
    | --- | --- | --- |
    | **추천** 그대로 둔다 | 없음 | KAN-039 는 이 카드 완료 뒤 전략을 다시 세워 착수한다 |
    | 다시 정한다 | 없음 | 원하시는 처리를 추가 의견으로 주시면 그대로 기록한다 |

    > **판정** — _아직 없습니다._

    > **추가 의견** — _아직 없습니다._


## 4. 판정

<!-- 문서 하나에 대한 판정이다. **항목별로 갈리는 말은 여기 적지 않는다** — 3항 각 의견의
     「판정」과 「추가 의견」이 그 자리다. 여기 남는 것은 그 항목들이 전부 승인으로 닫혔다는
     사실 하나뿐이다.
     아래 「판정 이력」은 **덧붙기만 하는 이력**이다. 왕복이 돌면 줄이 쌓이고, 그것이 이 문서가
     무엇을 거쳐 승인에 닿았는지의 전부다 — 지우지 않는다. **판정에는 사유 칸이 없다** —
     승인은 대체로 덧붙일 말이 없고, 있다면 그것은 문서 전체가 아니라 그 항목에 대한
     말이라 3항의 「추가 의견」이 받는다.
     `review-judge --card KAN-060-9P4ZAA --verdict 승인` 이 이 자리를 쓰고
     frontmatter 의 status 도 함께 고친다. 손으로 적어도 되지만, 그때는 수렴 검사를
     안 거치므로 `validate` 가 항목 판정과 어긋난 승인을 error 로 잡는다. -->

**판정**: (아직 없습니다)

**판정 이력**:

- 승인이면 → `apply --op move --id KAN-060-9P4ZAA --to done` 뒤에 `main` 병합과 워크트리 정리(출력의 `cleanup`)
- 반려면 → `apply --op move --id KAN-060-9P4ZAA --to doing` 뒤에 `doc-log --entry "<반려 사유>"`.
  요청서는 **지우지도 다시 뜨지도 않는다** — 고친 뒤 그 항목을 `review-judge --verdict 승인` 으로
  뒤집으면 같은 문서에서 수렴한다. 1·2항이 낡았으면 `review-init --refresh` 로 그 두 항만 간다.
