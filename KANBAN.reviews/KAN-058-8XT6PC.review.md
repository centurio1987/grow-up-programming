---
card: KAN-058-8XT6PC
title: 알고리즘 가이드 110편 v2 재구성 전개 — KAN-056 파일럿 구성을 나머지 편에 적용
created: 2026-10-01
branch: KAN-058-8XT6PC
worktree: /Users/centurio/orca/workspaces/code_test/KAN-058-8XT6PC
base: 6086e1e2
status: 검토 대기
---

# KAN-058-8XT6PC 검토 요청 — 알고리즘 가이드 110편 v2 재구성 전개 — KAN-056 파일럿 구성을 나머지 편에 적용

카드: [KAN-058-8XT6PC.md](../KANBAN.cards/KAN-058-8XT6PC.md)

> 이 문서는 **검토를 위한 산출물**이다. 수행 내역은 카드 실행 문서에 있고, 착수 전
> 계획은 배치 문서에 있다. 여기 있는 것은 "지금 이 브랜치를 무엇으로 판정하는가" 뿐이다.

## 1. 검토 대상

| 항목 | 값 |
|---|---|
| 브랜치 | `KAN-058-8XT6PC` |
| 워크트리 | `/Users/centurio/orca/workspaces/code_test/KAN-058-8XT6PC` |
| 베이스 | `6086e1e2` |
| 변경 훑기 | `git diff 6086e1e2...HEAD` |

**커밋 144건**

```text
d94c20be KAN-058 S11: 검토 근거 모음 · 카드 검증 절의 --strict 정리
878bac5f KAN-058 S10: 한시 조항 셋을 걷고 최종 기준을 기본으로
101703bf KAN-058 배치 7(S10 · S11 마감) 착수
e28968a5 KAN-058 S9 완료(W3 44편 · 전개 115/115 · gates 통과)
a734711d KAN-058 S9: countInversions v2 재집필(W3)
dacaaca9 KAN-058 S9: meetInTheMiddleSubsetSum v2 재집필(W3)
6d0acb86 KAN-058 S9: expectedValueDp v2 재집필(W3)
352873bc KAN-058 S9: knuthOptimization v2 재집필(W3)
f0516c2d KAN-058 S9: divideAndConquerDp v2 재집필(W3)
a17eff4f KAN-058 S9: babyStepGiantStep v2 재집필(W3)
4805d5e2 KAN-058 S9: convexHullTrick v2 재집필(W3) · 패턴 P11 LineEnvelope
4c9c45c9 KAN-058 S9: crt v2 재집필(W3)
3aa0878e KAN-058 S9: mosAlgorithm v2 재집필(W3) · README 옛 인용 정리
83d27acd KAN-058 S9: suffixAutomaton v2 재집필(W3)
11919be0 KAN-058 S9: externalMergeSort v2 재집필(W3)
75ae1f25 KAN-058 S9: fftMultiply v2 재집필(W3) · 배열 무대 층 span
4f1df244 KAN-058 S9: rotatingCalipersDiameter v2 재집필(W3) · NodeGraph lines · 조사 헬퍼 경·해
61bd6c60 KAN-058 S9: tspBitmask v2 재집필(W3)
258d93fb KAN-058 S9: ahoCorasick v2 재집필(W3)
2b92dc40 KAN-058 S9: bentleyOttmann v2 재집필(W3)
6bd796bb KAN-058 S9: treeIsomorphism v2 재집필(W3)
efa9c35a KAN-058 S9: longestPalindrome v2 재집필(W3)
a2f98189 KAN-058 S9: minCostMaxFlow v2 재집필(W3) · 패턴 P10 CumulativeCurve · 패키지 직접 import 가드
5cce27e6 KAN-058 S9: subtreeSumQuery v2 재집필(W3) · nextGreaterElement 괄호 구조 역링크
73518d3f KAN-058 S9: kasaiLcp v2 재집필(W3) · KeyValueTable extra
5eea812f KAN-058 S9: maxBipartiteMatching v2 재집필(W3)
44fcf400 KAN-058 S9: treeRerooting v2 재집필(W3) · treeDiameter 이웃 소개 정정
24696b0a KAN-058 S9: suffixArray v2 재집필(W3) · LayerBars 첫 줄 글자
3c43773d KAN-058 S9: closestPairOfPoints v2 재집필(W3) · NodeGraph·그래프 무대 rules·bands
5cd84ff1 KAN-058 S9: heavyLightDecomposition v2 재집필(W3)
8623bd38 KAN-058 S9: minCut v2 재집필(W3)
d87f0d34 KAN-058 S9: bridgesInGraph v2 재집필(W3) · articulationPoints 미확인 문장 확정
b79dc503 KAN-058 S9: maxFlow v2 재집필(W3)
7cc86fd6 KAN-058 S9: polygonArea v2 재집필(W3)
da3d7888 KAN-058 S9: articulationPoints v2 재집필(W3)
fa745c0b KAN-058 S9: aStarSearch v2 재집필(W3)
22969eb7 KAN-058 S9: pointInPolygon v2 재집필(W3)
2d93fbdf KAN-058 S9: zeroOneBfs · floydWarshall v2 재집필(W3) · 인용 정리
f2022359 KAN-058 S9: segmentsIntersect v2 재집필(W3) · 지시서 수식 블록 주의
bce525f8 KAN-058 S9: bellmanFord 편 SPFA 측정·판정을 spfa 편에 맞춤
a700c285 KAN-058 S9: lowestCommonAncestor v2 재집필(W3)
beedbd58 KAN-058 S9: spfa v2 재집필(W3)
fae604f9 KAN-058 S9: pollardRho v2 재집필(W3) · gcd 편 이웃 서술 정정
b6d9888a KAN-058 S9: millerRabin v2 재집필(W3)
fae57404 KAN-058 S9: convexHull v2 재집필(W3)
2ef9eb3a KAN-058 S9: bellmanFord v2 재집필(W3)
1f26b002 KAN-058 S8 완료(W2 42편 · gates 통과) · 배치 6(S9 W3) 착수
7c2b368c KAN-058 S8: slidingWindowMaximum v2 재집필(W2) · nextGreaterElement 오기 · 인용 줄 이동
d3102e25 KAN-058 S8: isPrimeTrial v2 재집필(W2)
7143bcd6 KAN-058 S8: largestRectangleInHistogram v2 재집필(W2)
ece260d1 KAN-058 S8: sieveOfEratosthenes v2 재집필(W2) · 배열 무대 out
273838fb KAN-058 S8: digitDp v2 재집필(W2)
31742720 KAN-058 S8: nextGreaterElement v2 재집필(W2)
0cc28f3d KAN-058 S8: binomialModP v2 재집필(W2)
6fb05c9f KAN-058 S8: 자립 SVG 속성 값의 < 이스케이프(render.tsx)
e385cb4e KAN-058 S8: topKFrequent v2 재집필(W2)
972a9a56 KAN-058 S8: palindromePartitioningMinCut v2 재집필(W2)
bdee5ea0 kanban: KAN-058 문체 등급 전후 비교 기록
83d53863 KAN-058 S8: extendedEuclidean v2 재집필(W2)
a8fa19c0 KAN-058 S8: fenwickRangeSum v2 재집필(W2)
f8d53a36 KAN-058 S8: matrixChainMultiplication v2 재집필(W2) · 표 무대 strip·pieces·target
cb711a2f KAN-058 S8: gcd v2 재집필(W2)
b0f410e0 KAN-058 S8: matrixPowerFibonacci v2 재집필(W2) · 배열 무대 span·caret
df8894d4 KAN-058 S8: segmentTreeRangeMin v2 재집필(W2)
87296ff0 KAN-058 S8: treeMaxIndependentSet v2 재집필(W2)
7c3d2efd KAN-058 S8: fastPower v2 재집필(W2)
c489794b KAN-058 S8: kthSmallest v2 재집필(W2)
08482a82 KAN-058 S8: treeDiameter v2 재집필(W2)
7ccd297c KAN-058 S8: unboundedKnapsack v2 재집필(W2)
97ca9ae8 KAN-058 S8: lowestSetBit v2 재집필(W2)
90455e48 KAN-058 S8: medianFromDataStream v2 재집필(W2)
0a2f502c KAN-058 S8: undirectedCycleDetection v2 재집필(W2)
f2c6a372 KAN-058 S8: singleNumberXor v2 재집필(W2)
e9852cff KAN-058 S8: findAllOccurrences v2 재집필(W2)
b10770f8 KAN-058 S8: isBipartite v2 재집필(W2)
2dbcbe06 KAN-058 S8: directedCycleDetection v2 재집필(W2)
bd3ec1e7 KAN-058 S8: longestIncreasingSubsequence v2 재집필(W2)
693212ee KAN-058 S8: primMst v2 재집필(W2)
2dc54dad KAN-058 S8: enumerateSubmasks v2 재집필(W2)
b01bfb5f KAN-058 S8: subsetSum v2 재집필(W2)
ad25a84a KAN-058 S8: radixTree · kruskalMst · bestTimeToBuyAndSellStockK v2 재집필(W2) · NodeGraph nodeWidth · 그래프 무대 hidden 간선
cc420065 KAN-058 S8: trie v2 재집필(W2 · string 첫 편)
a662286c KAN-058 S8: searchInRotatedSortedArray · dagShortestPath v2 재집필(W2)
f073334d KAN-058: 공용 조사 헬퍼가 홀로 선 영문 글자를 글자 이름으로 읽는다 · editDistance 의 따로 둔 헬퍼 제거
9b9ccc16 KAN-058 S8: editDistance v2 재집필(W2)
2b1198de KAN-058 S8: dijkstra v2 재집필(W2 · shortest-path 첫 편) — 우선순위 큐는 그래프 무대 띠로
ee3060c5 KAN-058 S8: topologicalSort v2 재집필(W2) · 지시서에 린트는 만든 파일 경로만
7384765a KAN-058 S8: longestCommonSubsequence v2 재집필(W2)
06cc871e kanban: KAN-058 배치 4 완료 기록
bd9ca699 KAN-058 S14: KAN-060 신규 네 편에 그림 · 걸음 재생 패널
d5489aa4 kanban: KAN-058 S7 완료 — W1 29편 · ci.ts gates 통과
12e23897 KAN-058 S7: houseRobber v2 재집필(W1 마지막 편)
5d50f27b kanban: KAN-058 배치 5(W2 전개) 문서
3630c768 KAN-058 S7: bestTimeToBuyAndSellStock v2 재집필(W1)
8261c325 KAN-058 S7: minMaxPair v2 재집필(W1) · 옛 패널 정의를 가리키던 인용 행을 대장에서 걷음
cccff96e KAN-058 S7: knapsack01 · maximumProductSubarray v2 재집필(W1) · knapsack01 벤치 키를 DP 테이블 칸으로 · coinChangeWays 선수 문장
86b78d58 KAN-058 S7: nQueens v2 재집필(W1 · advanced 첫 편)
a245b1ee KAN-058 S7: coinChangeWays v2 재집필(W1 · dp 첫 편) · 2 차원 표 무대(tableStage)
527ddb4e KAN-058: kadane 실습 절에 빠진 흡수 문제(maxSubarraySum) 복구 · P22 가 폴더의 실습 테스트를 다 가리키는지 잰다
a32dae94 KAN-058 S7: kadane v2 재집필(W1)
f1846546 KAN-058 S7: countIslands · countingSort v2 재집필(W1) — countIslands alt 주석의 계수 정정
8dd0f6bb KAN-058 S7: radixSort v2 재집필(W1)
12c96b8a kanban: KAN-058 maxCounters 기록
990d9b64 KAN-058 S7: maxCounters v2 재집필(W1 · etc 첫 편) · 배열 무대 layers 줄 곁말(side)
6830a8e8 KAN-058 S7: dfsAllPaths v2 재집필(W1)
71261839 KAN-058 S7: insertionSort v2 재집필(W1)
af77d502 KAN-058 S7: diffArrayRangeUpdate v2 재집필(W1)
3340239b KAN-058 S7: dfsTraversal v2 재집필(W1)
81f3fc64 kanban: KAN-058 subarraySumEqualsK 기록
becb6149 KAN-058 S7: subarraySumEqualsK v2 재집필(W1) — 해시 맵 패턴 KeyValueTable 의 첫 편
a6a297b5 KAN-058 S7: quicksort v2 재집필(W1)
bb728b09 KAN-058 S7: ternarySearch v2 재집필(W1) · 배열 무대 rangeSide
f5861a17 KAN-058 S7: connectedComponents v2 재집필(W1)
85d19589 KAN-058 S7: sortArray v2 재집필(W1) · 배열 무대 pieces · --strict P23 이 코드 주석도 본다
35e1849b kanban: KAN-058 배치 4 리스크에 실제로 일어난 둘(임시 파일 충돌 · tsc 누락)
23f5f722 KAN-058 S7: prefixSumRangeQuery v2 재집필(W1) · 배열 무대 layers
9a82ccec KAN-058: 지시서 줄 추가로 밀린 인용 1곳 재지정
91b94930 KAN-058 S7: parametricBinarySearch v2 재집필(W1) · 배열 무대 valueAxis
b91d4489 KAN-058: 편 완료 명령에 tsc — 사이드카 타입 오류가 편 검증을 지나간 자리
4add202d KAN-058: longestSubarrayAtMostSum proof.ts 타입 표기 정정(groups 는 string[][][]) — tsc 오류
8ec0f1b6 kanban: KAN-058 bfsShortestPath 기록
aa0457bf KAN-058 S7: bfsShortestPath v2 재집필(W1 · graph 첫 편)
e599ddf3 KAN-058 S7: longestSubarrayAtMostSum v2 재집필(W1)
3f05e876 kanban: KAN-058 배치 4(W1 전개 · 신규 넷 그림) 착수
2655d08d kanban: KAN-058 배치 3 완료 기록
7c0979a3 KAN-058 S13: binarySearch 손 값을 증명 블록으로(16 → 32) — 옛 원고의 틀린 경계 값 하나 정정
ab7b8334 KAN-058 S13: 재집필 지시서 — 짧은 실행 결과도 증명 블록으로 · 무대 패널 셋 · 승인된 샘플 둘을 본보기로
64bfeac3 KAN-058 S12: 배열·구간 걸음 무대(arrayStage) · binarySearch 패널을 새 무대로
b9a0a23d KAN-058 S2: algo-wbs 완료 판정을 --strict 통과로 · P1 이 수식 블록을 산문으로 세지 않게
24fbb6cb kanban: KAN-058 샘플 승인 반영 — S12~S14 추가, 배치 3(전개 준비)
e142f27a kanban: KAN-058.1 검토 화면
69ea93bb kanban: KAN-058.1 검토 승인 6/6 · 완료 — 전개 게이트 통과
6a08f11f kanban: KAN-058.1 검토 — 유저 판정(항목 5 승인 · 추가 의견 5 · 새 항목 1)
eb644cf2 kanban: KAN-058 배치 2 완료 기록
3eb8f7fa kanban: KAN-058 S6 — KAN-058.1 샘플 검토서(판단 항목 5) · 검토로 이동
8b4c3964 KAN-058 S5: stronglyConnectedComponents v2 재집필(샘플 — 어려운 편) · 그래프 패턴 NodeGraph · 그래프 걸음 무대
f93cdef8 KAN-058 S4: binarySearch v2 재집필(샘플 — 개념이 단순한 편)
ce98c3cb kanban: KAN-058.1 진행 중 — 배치 2 착수
477bd436 kanban: 이벤트 회전분 archive 기록
1d5ef6a7 KAN-058: voice 「견주다」 정규식에 견줍·견줌 — 활용형 34곳 누락 보강
49dee920 kanban: KAN-058 배치 1 완료 기록
d1f2b0fa KAN-058 S3: guide-for-problem 에 v2 재집필 경로 — 입력·순서·편 완료 명령
654ffb41 KAN-058 S1: check-v2 --strict — 한시 조항을 끈 편 단위 최종 기준
a6b5e989 kanban: KAN-058 진행 중으로 이동 — 배치 1 착수
```

**변경 파일 1586개 (+444174 −179751)**

| 파일 | 상태 | 추가 | 삭제 |
|---|:--:|---:|---:|
| `.claude/authoring.lock.json` | M | 1 | 1 |
| `.claude/authoring/voices/algorithm-guide-writer/style.json` | M | 1 | 1 |
| `.claude/skills/guide-for-problem/SKILL.md` | M | 69 | 2 |
| `.kanban/archive.jsonl` | M | 5 | 0 |
| `.kanban/log.md` | M | 5 | 5 |
| `.kanban/reviews/KAN-058.1-9TBXDA.events.jsonl` | M | 29 | 0 |
| `.kanban/reviews/KAN-058.1-9TBXDA.review.json` | M | 27 | 0 |
| `.kanban/state.json` | M | 65 | 77 |
| `KANBAN.batches/KAN-058-8XT6PC.batch1.md` | M | 2 | 1 |
| `KANBAN.batches/KAN-058-8XT6PC.batch2.md` | M | 2 | 1 |
| `KANBAN.batches/KAN-058-8XT6PC.batch3.md` | M | 55 | 0 |
| `KANBAN.batches/KAN-058-8XT6PC.batch4.md` | M | 51 | 0 |
| `KANBAN.batches/KAN-058-8XT6PC.batch5.md` | M | 40 | 0 |
| `KANBAN.batches/KAN-058-8XT6PC.batch6.md` | M | 43 | 0 |
| `KANBAN.batches/KAN-058-8XT6PC.batch7.md` | M | 48 | 0 |
| `KANBAN.batches/KAN-058-8XT6PC.s11-findings.md` | M | 162 | 0 |
| `KANBAN.board.html` | M | 4 | 4 |
| `KANBAN.cards/KAN-034.6-CF6ZHE.md` | M | 1 | 1 |
| `KANBAN.cards/KAN-034.7-QMZ3RE.md` | M | 2 | 2 |
| `KANBAN.cards/KAN-034.8-BK1Q3A.md` | M | 1 | 1 |
| `KANBAN.cards/KAN-035-31T4BY.md` | M | 2 | 2 |
| `KANBAN.cards/KAN-056-VPCM91.md` | M | 1 | 1 |
| `KANBAN.cards/KAN-057-J36E1B.md` | M | 1 | 1 |
| `KANBAN.cards/KAN-058-8XT6PC.md` | M | 170 | 17 |
| `KANBAN.cards/KAN-058.1-9TBXDA.md` | M | 29 | 0 |
| `KANBAN.cards/KAN-059-PSFTN4.md` | M | 1 | 1 |
| `KANBAN.cards/KAN-060-9P4ZAA.md` | M | 2 | 2 |
| `KANBAN.md` | M | 20 | 18 |
| `KANBAN.reviews/KAN-058.1-9TBXDA.review.html` | M | 1211 | 0 |
| `KANBAN.reviews/KAN-058.1-9TBXDA.review.md` | M | 163 | 0 |
| `design/viz/algo.viz.tsx` | M | 33 | 2 |
| `docs/ORD-006-conventions.md` | M | 4 | 4 |
| `docs/ORD-006-runbook.md` | M | 2 | 2 |
| `sandbox/algo-guide-v2/FEEDBACK.md` | M | 2 | 2 |
| `sandbox/algo-guide-v2/README.md` | M | 1 | 1 |
| `sandbox/algo-guide-v2/SPEC.md` | M | 46 | 36 |
| `src/_viz/index.ts` | M | 47 | 0 |
| `src/_viz/patterns.test.tsx` | M | 616 | 0 |
| `src/_viz/patterns/ArrayStrip.tsx` | M | 17 | 5 |
| `src/_viz/patterns/CellStage.tsx` | M | 29 | 7 |
| `src/_viz/patterns/CumulativeCurve.tsx` | M | 207 | 0 |
| `src/_viz/patterns/KeyValueTable.tsx` | M | 134 | 0 |
| `src/_viz/patterns/LayerBars.tsx` | M | 5 | 2 |
| `src/_viz/patterns/LineEnvelope.tsx` | M | 381 | 0 |
| `src/_viz/patterns/NodeGraph.tsx` | M | 1069 | 0 |
| `src/_viz/patterns/meta.ts` | M | 72 | 1 |
| `src/_viz/player/StepPlayer.test.tsx` | M | 357 | 0 |
| `src/_viz/player/StepPlayer.tsx` | M | 189 | 26 |
| `src/_viz/player/arrayStage.ts` | M | 235 | 0 |
| `src/_viz/player/graphStage.ts` | M | 118 | 0 |
| `src/_viz/player/tableStage.ts` | M | 151 | 0 |
| `src/_viz/render.escape.test.tsx` | M | 13 | 0 |
| `src/_viz/render.tsx` | M | 6 | 1 |
| `src/algorithms/advanced/convexHullTrick/convexHullTrick-guide.alt.ts` | M | 64 | 2 |
| `src/algorithms/advanced/convexHullTrick/convexHullTrick-guide.fig.tsx` | M | 448 | 0 |
| `src/algorithms/advanced/convexHullTrick/convexHullTrick-guide.md` | M | 944 | 934 |
| `src/algorithms/advanced/convexHullTrick/convexHullTrick-guide.proof.ts` | M | 1328 | 540 |
| `src/algorithms/advanced/convexHullTrick/convexHullTrick-guide.ref.ts` | M | 2 | 2 |
| `src/algorithms/advanced/convexHullTrick/convexHullTrick-guide.sim.ts` | M | 507 | 243 |
| `src/algorithms/advanced/convexHullTrick/convexHullTrick-guide.test.ts` | M | 22 | 0 |
| `src/algorithms/advanced/convexHullTrick/figs/build-cover.svg` | M | 26 | 0 |
| `src/algorithms/advanced/convexHullTrick/figs/build-pop-film.svg` | M | 26 | 0 |
| `src/algorithms/advanced/convexHullTrick/figs/concept-envelope.svg` | M | 26 | 0 |
| `src/algorithms/advanced/convexHullTrick/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/advanced/convexHullTrick/figs/related-dual.svg` | M | 26 | 0 |
| `src/algorithms/advanced/convexHullTrick/figs/walk-hull.svg` | M | 26 | 0 |
| `src/algorithms/advanced/countInversions/countInversions-guide.fig.tsx` | M | 890 | 0 |
| `src/algorithms/advanced/countInversions/countInversions-guide.md` | M | 1031 | 774 |
| `src/algorithms/advanced/countInversions/countInversions-guide.proof.ts` | M | 1274 | 1052 |
| `src/algorithms/advanced/countInversions/countInversions-guide.ref.ts` | M | 2 | 2 |
| `src/algorithms/advanced/countInversions/countInversions-guide.sim.ts` | M | 351 | 85 |
| `src/algorithms/advanced/countInversions/countInversions-guide.test.ts` | M | 14 | 0 |
| `src/algorithms/advanced/countInversions/figs/build-cross.svg` | M | 26 | 0 |
| `src/algorithms/advanced/countInversions/figs/concept-one-compare.svg` | M | 26 | 0 |
| `src/algorithms/advanced/countInversions/figs/concept-pairs.svg` | M | 26 | 0 |
| `src/algorithms/advanced/countInversions/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/advanced/countInversions/figs/walk-run.svg` | M | 26 | 0 |
| `src/algorithms/advanced/divideAndConquerDp/divideAndConquerDp-guide.alt.ts` | M | 157 | 101 |
| `src/algorithms/advanced/divideAndConquerDp/divideAndConquerDp-guide.bench.json` | M | 14 | 12 |
| `src/algorithms/advanced/divideAndConquerDp/divideAndConquerDp-guide.fig.tsx` | M | 479 | 0 |
| `src/algorithms/advanced/divideAndConquerDp/divideAndConquerDp-guide.md` | M | 1181 | 1037 |
| `src/algorithms/advanced/divideAndConquerDp/divideAndConquerDp-guide.proof.ts` | M | 1372 | 742 |
| `src/algorithms/advanced/divideAndConquerDp/divideAndConquerDp-guide.ref.ts` | M | 8 | 8 |
| `src/algorithms/advanced/divideAndConquerDp/divideAndConquerDp-guide.sim.ts` | M | 329 | 213 |
| `src/algorithms/advanced/divideAndConquerDp/divideAndConquerDp-guide.test.ts` | M | 25 | 0 |
| `src/algorithms/advanced/divideAndConquerDp/figs/build-opt-bars.svg` | M | 26 | 0 |
| `src/algorithms/advanced/divideAndConquerDp/figs/build-recursion.svg` | M | 26 | 0 |
| `src/algorithms/advanced/divideAndConquerDp/figs/concept-table.svg` | M | 26 | 0 |
| `src/algorithms/advanced/divideAndConquerDp/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/advanced/divideAndConquerDp/figs/related-matrix.svg` | M | 26 | 0 |
| `src/algorithms/advanced/divideAndConquerDp/figs/walk-dp.svg` | M | 26 | 0 |
| `src/algorithms/advanced/knuthOptimization/figs/build-diagonal.svg` | M | 26 | 0 |
| `src/algorithms/advanced/knuthOptimization/figs/build-opt-table.svg` | M | 26 | 0 |
| `src/algorithms/advanced/knuthOptimization/figs/build-split-bars.svg` | M | 26 | 0 |
| `src/algorithms/advanced/knuthOptimization/figs/concept-table.svg` | M | 26 | 0 |
| `src/algorithms/advanced/knuthOptimization/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/advanced/knuthOptimization/figs/walk-knuth.svg` | M | 26 | 0 |
| `src/algorithms/advanced/knuthOptimization/knuthOptimization-guide.alt.ts` | M | 36 | 0 |
| `src/algorithms/advanced/knuthOptimization/knuthOptimization-guide.bench.json` | M | 14 | 0 |
| `src/algorithms/advanced/knuthOptimization/knuthOptimization-guide.fig.tsx` | M | 454 | 0 |
| `src/algorithms/advanced/knuthOptimization/knuthOptimization-guide.md` | M | 1196 | 940 |
| `src/algorithms/advanced/knuthOptimization/knuthOptimization-guide.proof.ts` | M | 1209 | 821 |
| `src/algorithms/advanced/knuthOptimization/knuthOptimization-guide.ref.ts` | M | 7 | 7 |
| `src/algorithms/advanced/knuthOptimization/knuthOptimization-guide.sim.ts` | M | 541 | 182 |
| `src/algorithms/advanced/knuthOptimization/knuthOptimization-guide.test.ts` | M | 34 | 8 |
| `src/algorithms/advanced/meetInTheMiddleSubsetSum/figs/build-doubling.svg` | M | 26 | 0 |
| `src/algorithms/advanced/meetInTheMiddleSubsetSum/figs/build-list.svg` | M | 26 | 0 |
| `src/algorithms/advanced/meetInTheMiddleSubsetSum/figs/concept-lists.svg` | M | 26 | 0 |
| `src/algorithms/advanced/meetInTheMiddleSubsetSum/figs/invariant-range.svg` | M | 26 | 0 |
| `src/algorithms/advanced/meetInTheMiddleSubsetSum/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/advanced/meetInTheMiddleSubsetSum/figs/walk-mitm.svg` | M | 26 | 0 |
| `src/algorithms/advanced/meetInTheMiddleSubsetSum/meetInTheMiddleSubsetSum-guide.alt.ts` | M | 20 | 18 |
| `src/algorithms/advanced/meetInTheMiddleSubsetSum/meetInTheMiddleSubsetSum-guide.bench.json` | M | 14 | 14 |
| `src/algorithms/advanced/meetInTheMiddleSubsetSum/meetInTheMiddleSubsetSum-guide.fig.tsx` | M | 528 | 0 |
| `src/algorithms/advanced/meetInTheMiddleSubsetSum/meetInTheMiddleSubsetSum-guide.md` | M | 1126 | 1112 |
| `src/algorithms/advanced/meetInTheMiddleSubsetSum/meetInTheMiddleSubsetSum-guide.proof.ts` | M | 996 | 748 |
| `src/algorithms/advanced/meetInTheMiddleSubsetSum/meetInTheMiddleSubsetSum-guide.ref.ts` | M | 4 | 4 |
| `src/algorithms/advanced/meetInTheMiddleSubsetSum/meetInTheMiddleSubsetSum-guide.sim.ts` | M | 281 | 115 |
| `src/algorithms/advanced/meetInTheMiddleSubsetSum/meetInTheMiddleSubsetSum-guide.test.ts` | M | 19 | 1 |
| `src/algorithms/advanced/minMaxPair/figs/build-candidates.svg` | M | 26 | 0 |
| `src/algorithms/advanced/minMaxPair/figs/concept-candidates.svg` | M | 26 | 0 |
| `src/algorithms/advanced/minMaxPair/figs/invariant-prefix.svg` | M | 26 | 0 |
| `src/algorithms/advanced/minMaxPair/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/advanced/minMaxPair/figs/origin-halves.svg` | M | 26 | 0 |
| `src/algorithms/advanced/minMaxPair/figs/related-tournament.svg` | M | 26 | 0 |
| `src/algorithms/advanced/minMaxPair/figs/walk-pairs.svg` | M | 26 | 0 |
| `src/algorithms/advanced/minMaxPair/minMaxPair-guide.fig.tsx` | M | 995 | 0 |
| `src/algorithms/advanced/minMaxPair/minMaxPair-guide.md` | M | 887 | 799 |
| `src/algorithms/advanced/minMaxPair/minMaxPair-guide.proof.ts` | M | 1351 | 672 |
| `src/algorithms/advanced/minMaxPair/minMaxPair-guide.sim.ts` | M | 483 | 171 |
| `src/algorithms/advanced/minMaxPair/minMaxPair-guide.test.ts` | M | 24 | 0 |
| `src/algorithms/advanced/nQueens/figs/build-diag-numbers.svg` | M | 26 | 0 |
| `src/algorithms/advanced/nQueens/figs/concept-attack.svg` | M | 26 | 0 |
| `src/algorithms/advanced/nQueens/figs/concept-solutions.svg` | M | 26 | 0 |
| `src/algorithms/advanced/nQueens/figs/concept-tree.svg` | M | 26 | 0 |
| `src/algorithms/advanced/nQueens/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/advanced/nQueens/figs/walk-board.svg` | M | 26 | 0 |
| `src/algorithms/advanced/nQueens/nQueens-guide.alt.ts` | M | 3 | 3 |
| `src/algorithms/advanced/nQueens/nQueens-guide.fig.tsx` | M | 808 | 0 |
| `src/algorithms/advanced/nQueens/nQueens-guide.md` | M | 708 | 473 |
| `src/algorithms/advanced/nQueens/nQueens-guide.proof.ts` | M | 1188 | 172 |
| `src/algorithms/advanced/nQueens/nQueens-guide.sim.ts` | M | 796 | 143 |
| `src/algorithms/advanced/nQueens/nQueens-guide.test.ts` | M | 14 | 0 |
| `src/algorithms/array/bestTimeToBuyAndSellStock/bestTimeToBuyAndSellStock-guide.alt.ts` | M | 1 | 1 |
| `src/algorithms/array/bestTimeToBuyAndSellStock/bestTimeToBuyAndSellStock-guide.fig.tsx` | M | 587 | 0 |
| `src/algorithms/array/bestTimeToBuyAndSellStock/bestTimeToBuyAndSellStock-guide.md` | M | 833 | 738 |
| `src/algorithms/array/bestTimeToBuyAndSellStock/bestTimeToBuyAndSellStock-guide.proof.ts` | M | 1051 | 403 |
| `src/algorithms/array/bestTimeToBuyAndSellStock/bestTimeToBuyAndSellStock-guide.sim.ts` | M | 222 | 83 |
| `src/algorithms/array/bestTimeToBuyAndSellStock/bestTimeToBuyAndSellStock-guide.test.ts` | M | 20 | 0 |
| `src/algorithms/array/bestTimeToBuyAndSellStock/figs/build-prefix.svg` | M | 26 | 0 |
| `src/algorithms/array/bestTimeToBuyAndSellStock/figs/concept-rows.svg` | M | 26 | 0 |
| `src/algorithms/array/bestTimeToBuyAndSellStock/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/array/bestTimeToBuyAndSellStock/figs/walk-scan.svg` | M | 26 | 0 |
| `src/algorithms/array/bestTimeToBuyAndSellStockK/bestTimeToBuyAndSellStockK-guide.alt.ts` | M | 15 | 15 |
| `src/algorithms/array/bestTimeToBuyAndSellStockK/bestTimeToBuyAndSellStockK-guide.bench.json` | M | 6 | 6 |
| `src/algorithms/array/bestTimeToBuyAndSellStockK/bestTimeToBuyAndSellStockK-guide.fig.tsx` | M | 836 | 0 |
| `src/algorithms/array/bestTimeToBuyAndSellStockK/bestTimeToBuyAndSellStockK-guide.md` | M | 949 | 791 |
| `src/algorithms/array/bestTimeToBuyAndSellStockK/bestTimeToBuyAndSellStockK-guide.proof.ts` | M | 1323 | 491 |
| `src/algorithms/array/bestTimeToBuyAndSellStockK/bestTimeToBuyAndSellStockK-guide.ref.ts` | M | 1 | 1 |
| `src/algorithms/array/bestTimeToBuyAndSellStockK/bestTimeToBuyAndSellStockK-guide.sim.ts` | M | 411 | 103 |
| `src/algorithms/array/bestTimeToBuyAndSellStockK/bestTimeToBuyAndSellStockK-guide.test.ts` | M | 20 | 0 |
| `src/algorithms/array/bestTimeToBuyAndSellStockK/figs/build-relation.svg` | M | 26 | 0 |
| `src/algorithms/array/bestTimeToBuyAndSellStockK/figs/build-witness.svg` | M | 26 | 0 |
| `src/algorithms/array/bestTimeToBuyAndSellStockK/figs/concept-grid.svg` | M | 26 | 0 |
| `src/algorithms/array/bestTimeToBuyAndSellStockK/figs/concept-trades.svg` | M | 26 | 0 |
| `src/algorithms/array/bestTimeToBuyAndSellStockK/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/array/bestTimeToBuyAndSellStockK/figs/walk-scan.svg` | M | 26 | 0 |
| `src/algorithms/array/diffArrayRangeUpdate/diffArrayRangeUpdate-guide.fig.tsx` | M | 560 | 0 |
| `src/algorithms/array/diffArrayRangeUpdate/diffArrayRangeUpdate-guide.md` | M | 770 | 640 |
| `src/algorithms/array/diffArrayRangeUpdate/diffArrayRangeUpdate-guide.proof.ts` | M | 1076 | 413 |
| `src/algorithms/array/diffArrayRangeUpdate/diffArrayRangeUpdate-guide.sim.ts` | M | 220 | 143 |
| `src/algorithms/array/diffArrayRangeUpdate/diffArrayRangeUpdate-guide.test.ts` | M | 20 | 0 |
| `src/algorithms/array/diffArrayRangeUpdate/figs/build-cover.svg` | M | 26 | 0 |
| `src/algorithms/array/diffArrayRangeUpdate/figs/build-overlap.svg` | M | 26 | 0 |
| `src/algorithms/array/diffArrayRangeUpdate/figs/concept-diff.svg` | M | 26 | 0 |
| `src/algorithms/array/diffArrayRangeUpdate/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/array/diffArrayRangeUpdate/figs/walk-run.svg` | M | 26 | 0 |
| `src/algorithms/array/editDistance/editDistance-guide.alt.ts` | M | 9 | 7 |
| `src/algorithms/array/editDistance/editDistance-guide.bench.json` | M | 20 | 20 |
| `src/algorithms/array/editDistance/editDistance-guide.fig.tsx` | M | 904 | 0 |
| `src/algorithms/array/editDistance/editDistance-guide.md` | M | 906 | 755 |
| `src/algorithms/array/editDistance/editDistance-guide.proof.ts` | M | 1386 | 815 |
| `src/algorithms/array/editDistance/editDistance-guide.ref.ts` | M | 2 | 2 |
| `src/algorithms/array/editDistance/editDistance-guide.sim.ts` | M | 277 | 81 |
| `src/algorithms/array/editDistance/editDistance-guide.test.ts` | M | 27 | 1 |
| `src/algorithms/array/editDistance/figs/build-border.svg` | M | 26 | 0 |
| `src/algorithms/array/editDistance/figs/build-read-cell.svg` | M | 26 | 0 |
| `src/algorithms/array/editDistance/figs/build-reads.svg` | M | 26 | 0 |
| `src/algorithms/array/editDistance/figs/build-trace-back.svg` | M | 26 | 0 |
| `src/algorithms/array/editDistance/figs/concept-edits.svg` | M | 26 | 0 |
| `src/algorithms/array/editDistance/figs/concept-rule.svg` | M | 26 | 0 |
| `src/algorithms/array/editDistance/figs/concept-table.svg` | M | 26 | 0 |
| `src/algorithms/array/editDistance/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/array/editDistance/figs/related-path.svg` | M | 26 | 0 |
| `src/algorithms/array/editDistance/figs/walk-row12.svg` | M | 26 | 0 |
| `src/algorithms/array/editDistance/figs/walk-row34.svg` | M | 26 | 0 |
| `src/algorithms/array/editDistance/figs/walk-row5.svg` | M | 26 | 0 |
| `src/algorithms/array/fenwickRangeSum/fenwickRangeSum-guide.alt.ts` | M | 4 | 4 |
| `src/algorithms/array/fenwickRangeSum/fenwickRangeSum-guide.bench.json` | M | 8 | 8 |
| `src/algorithms/array/fenwickRangeSum/fenwickRangeSum-guide.fig.tsx` | M | 1181 | 0 |
| `src/algorithms/array/fenwickRangeSum/fenwickRangeSum-guide.md` | M | 1091 | 831 |
| `src/algorithms/array/fenwickRangeSum/fenwickRangeSum-guide.proof.ts` | M | 1688 | 594 |
| `src/algorithms/array/fenwickRangeSum/fenwickRangeSum-guide.sim.ts` | M | 485 | 221 |
| `src/algorithms/array/fenwickRangeSum/fenwickRangeSum-guide.test.ts` | M | 24 | 3 |
| `src/algorithms/array/fenwickRangeSum/figs/build-bars.svg` | M | 26 | 0 |
| `src/algorithms/array/fenwickRangeSum/figs/build-bits.svg` | M | 26 | 0 |
| `src/algorithms/array/fenwickRangeSum/figs/build-climb.svg` | M | 26 | 0 |
| `src/algorithms/array/fenwickRangeSum/figs/build-erase.svg` | M | 26 | 0 |
| `src/algorithms/array/fenwickRangeSum/figs/concept-cells.svg` | M | 26 | 0 |
| `src/algorithms/array/fenwickRangeSum/figs/concept-prefix.svg` | M | 26 | 0 |
| `src/algorithms/array/fenwickRangeSum/figs/concept-update.svg` | M | 26 | 0 |
| `src/algorithms/array/fenwickRangeSum/figs/invariant-moment.svg` | M | 26 | 0 |
| `src/algorithms/array/fenwickRangeSum/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/array/fenwickRangeSum/figs/walk-run.svg` | M | 26 | 0 |
| `src/algorithms/array/houseRobber/figs/build-candidates.svg` | M | 26 | 0 |
| `src/algorithms/array/houseRobber/figs/build-neighbors.svg` | M | 26 | 0 |
| `src/algorithms/array/houseRobber/figs/concept-rows.svg` | M | 26 | 0 |
| `src/algorithms/array/houseRobber/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/array/houseRobber/figs/related-path.svg` | M | 26 | 0 |
| `src/algorithms/array/houseRobber/figs/walk-carry.svg` | M | 26 | 0 |
| `src/algorithms/array/houseRobber/houseRobber-guide.fig.tsx` | M | 692 | 0 |
| `src/algorithms/array/houseRobber/houseRobber-guide.md` | M | 937 | 802 |
| `src/algorithms/array/houseRobber/houseRobber-guide.proof.ts` | M | 988 | 534 |
| `src/algorithms/array/houseRobber/houseRobber-guide.sim.ts` | M | 215 | 91 |
| `src/algorithms/array/houseRobber/houseRobber-guide.test.ts` | M | 15 | 1 |
| `src/algorithms/array/kadane/figs/build-candidates.svg` | M | 26 | 0 |
| `src/algorithms/array/kadane/figs/build-extend.svg` | M | 26 | 0 |
| `src/algorithms/array/kadane/figs/concept-rows.svg` | M | 26 | 0 |
| `src/algorithms/array/kadane/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/array/kadane/figs/walk-carry.svg` | M | 26 | 0 |
| `src/algorithms/array/kadane/kadane-guide.fig.tsx` | M | 616 | 0 |
| `src/algorithms/array/kadane/kadane-guide.md` | M | 875 | 698 |
| `src/algorithms/array/kadane/kadane-guide.proof.ts` | M | 951 | 284 |
| `src/algorithms/array/kadane/kadane-guide.sim.ts` | M | 296 | 114 |
| `src/algorithms/array/kadane/kadane-guide.test.ts` | M | 14 | 0 |
| `src/algorithms/array/largestRectangleInHistogram/figs/build-on-input.svg` | M | 26 | 0 |
| `src/algorithms/array/largestRectangleInHistogram/figs/concept-answer.svg` | M | 26 | 0 |
| `src/algorithms/array/largestRectangleInHistogram/figs/concept-one-read.svg` | M | 26 | 0 |
| `src/algorithms/array/largestRectangleInHistogram/figs/concept-per-bar.svg` | M | 26 | 0 |
| `src/algorithms/array/largestRectangleInHistogram/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/array/largestRectangleInHistogram/figs/origin-expand.svg` | M | 26 | 0 |
| `src/algorithms/array/largestRectangleInHistogram/figs/pause-width-wide.svg` | M | 26 | 0 |
| `src/algorithms/array/largestRectangleInHistogram/figs/related-groups.svg` | M | 26 | 0 |
| `src/algorithms/array/largestRectangleInHistogram/figs/walk-film.svg` | M | 26 | 0 |
| `src/algorithms/array/largestRectangleInHistogram/largestRectangleInHistogram-guide.fig.tsx` | M | 1175 | 0 |
| `src/algorithms/array/largestRectangleInHistogram/largestRectangleInHistogram-guide.md` | M | 931 | 814 |
| `src/algorithms/array/largestRectangleInHistogram/largestRectangleInHistogram-guide.proof.ts` | M | 1280 | 562 |
| `src/algorithms/array/largestRectangleInHistogram/largestRectangleInHistogram-guide.sim.ts` | M | 457 | 177 |
| `src/algorithms/array/largestRectangleInHistogram/largestRectangleInHistogram-guide.test.ts` | M | 19 | 1 |
| `src/algorithms/array/longestCommonSubsequence/figs/build-read-cell.svg` | M | 26 | 0 |
| `src/algorithms/array/longestCommonSubsequence/figs/build-reads.svg` | M | 26 | 0 |
| `src/algorithms/array/longestCommonSubsequence/figs/build-trace-back.svg` | M | 26 | 0 |
| `src/algorithms/array/longestCommonSubsequence/figs/concept-pick.svg` | M | 26 | 0 |
| `src/algorithms/array/longestCommonSubsequence/figs/concept-rule.svg` | M | 26 | 0 |
| `src/algorithms/array/longestCommonSubsequence/figs/concept-table.svg` | M | 26 | 0 |
| `src/algorithms/array/longestCommonSubsequence/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/array/longestCommonSubsequence/figs/pause-rolling.svg` | M | 26 | 0 |
| `src/algorithms/array/longestCommonSubsequence/figs/walk-row12.svg` | M | 26 | 0 |
| `src/algorithms/array/longestCommonSubsequence/figs/walk-row34.svg` | M | 26 | 0 |
| `src/algorithms/array/longestCommonSubsequence/figs/walk-row5.svg` | M | 26 | 0 |
| `src/algorithms/array/longestCommonSubsequence/longestCommonSubsequence-guide.alt.ts` | M | 5 | 5 |
| `src/algorithms/array/longestCommonSubsequence/longestCommonSubsequence-guide.bench.json` | M | 15 | 15 |
| `src/algorithms/array/longestCommonSubsequence/longestCommonSubsequence-guide.fig.tsx` | M | 784 | 0 |
| `src/algorithms/array/longestCommonSubsequence/longestCommonSubsequence-guide.md` | M | 775 | 709 |
| `src/algorithms/array/longestCommonSubsequence/longestCommonSubsequence-guide.proof.ts` | M | 1134 | 695 |
| `src/algorithms/array/longestCommonSubsequence/longestCommonSubsequence-guide.ref.ts` | M | 3 | 3 |
| `src/algorithms/array/longestCommonSubsequence/longestCommonSubsequence-guide.sim.ts` | M | 318 | 84 |
| `src/algorithms/array/longestCommonSubsequence/longestCommonSubsequence-guide.test.ts` | M | 26 | 0 |
| `src/algorithms/array/longestIncreasingSubsequence/figs/build-confuse.svg` | M | 26 | 0 |
| `src/algorithms/array/longestIncreasingSubsequence/figs/build-lengths.svg` | M | 26 | 0 |
| `src/algorithms/array/longestIncreasingSubsequence/figs/concept-tails.svg` | M | 26 | 0 |
| `src/algorithms/array/longestIncreasingSubsequence/figs/invariant-t5.svg` | M | 26 | 0 |
| `src/algorithms/array/longestIncreasingSubsequence/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/array/longestIncreasingSubsequence/figs/related-piles.svg` | M | 26 | 0 |
| `src/algorithms/array/longestIncreasingSubsequence/figs/walk-lis.svg` | M | 26 | 0 |
| `src/algorithms/array/longestIncreasingSubsequence/longestIncreasingSubsequence-guide.fig.tsx` | M | 852 | 0 |
| `src/algorithms/array/longestIncreasingSubsequence/longestIncreasingSubsequence-guide.md` | M | 920 | 680 |
| `src/algorithms/array/longestIncreasingSubsequence/longestIncreasingSubsequence-guide.proof.ts` | M | 1156 | 369 |
| `src/algorithms/array/longestIncreasingSubsequence/longestIncreasingSubsequence-guide.ref.ts` | M | 9 | 9 |
| `src/algorithms/array/longestIncreasingSubsequence/longestIncreasingSubsequence-guide.sim.ts` | M | 250 | 121 |
| `src/algorithms/array/longestIncreasingSubsequence/longestIncreasingSubsequence-guide.test.ts` | M | 21 | 3 |
| `src/algorithms/array/longestSubarrayAtMostSum/figs/build-shrink.svg` | M | 26 | 0 |
| `src/algorithms/array/longestSubarrayAtMostSum/figs/concept-window.svg` | M | 26 | 0 |
| `src/algorithms/array/longestSubarrayAtMostSum/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/array/longestSubarrayAtMostSum/figs/walk-slide.svg` | M | 26 | 0 |
| `src/algorithms/array/longestSubarrayAtMostSum/longestSubarrayAtMostSum-guide.fig.tsx` | M | 516 | 0 |
| `src/algorithms/array/longestSubarrayAtMostSum/longestSubarrayAtMostSum-guide.md` | M | 552 | 430 |
| `src/algorithms/array/longestSubarrayAtMostSum/longestSubarrayAtMostSum-guide.proof.ts` | M | 877 | 211 |
| `src/algorithms/array/longestSubarrayAtMostSum/longestSubarrayAtMostSum-guide.sim.ts` | M | 75 | 112 |
| `src/algorithms/array/longestSubarrayAtMostSum/longestSubarrayAtMostSum-guide.test.ts` | M | 18 | 0 |
| `src/algorithms/array/maximumProductSubarray/figs/build-candidates.svg` | M | 26 | 0 |
| `src/algorithms/array/maximumProductSubarray/figs/build-flip.svg` | M | 26 | 0 |
| `src/algorithms/array/maximumProductSubarray/figs/concept-rows.svg` | M | 26 | 0 |
| `src/algorithms/array/maximumProductSubarray/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/array/maximumProductSubarray/figs/walk-pair.svg` | M | 26 | 0 |
| `src/algorithms/array/maximumProductSubarray/maximumProductSubarray-guide.fig.tsx` | M | 781 | 0 |
| `src/algorithms/array/maximumProductSubarray/maximumProductSubarray-guide.md` | M | 935 | 832 |
| `src/algorithms/array/maximumProductSubarray/maximumProductSubarray-guide.proof.ts` | M | 1305 | 534 |
| `src/algorithms/array/maximumProductSubarray/maximumProductSubarray-guide.sim.ts` | M | 272 | 90 |
| `src/algorithms/array/maximumProductSubarray/maximumProductSubarray-guide.test.ts` | M | 16 | 0 |
| `src/algorithms/array/missingInteger/figs/concept-marks.svg` | M | 26 | 0 |
| `src/algorithms/array/missingInteger/figs/invariant-cells.svg` | M | 26 | 0 |
| `src/algorithms/array/missingInteger/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/array/missingInteger/figs/walk-full-b.svg` | M | 26 | 0 |
| `src/algorithms/array/missingInteger/figs/walk-mark-a.svg` | M | 26 | 0 |
| `src/algorithms/array/missingInteger/missingInteger-guide.fig.tsx` | M | 540 | 0 |
| `src/algorithms/array/missingInteger/missingInteger-guide.md` | M | 28 | 8 |
| `src/algorithms/array/missingInteger/missingInteger-guide.sim.ts` | M | 434 | 0 |
| `src/algorithms/array/missingInteger/missingInteger-guide.test.ts` | M | 19 | 0 |
| `src/algorithms/array/mosAlgorithm/figs/build-block-order.svg` | M | 26 | 0 |
| `src/algorithms/array/mosAlgorithm/figs/concept-window.svg` | M | 26 | 0 |
| `src/algorithms/array/mosAlgorithm/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/array/mosAlgorithm/figs/walk-window.svg` | M | 26 | 0 |
| `src/algorithms/array/mosAlgorithm/mosAlgorithm-guide.alt.ts` | M | 61 | 78 |
| `src/algorithms/array/mosAlgorithm/mosAlgorithm-guide.bench.json` | M | 4 | 2 |
| `src/algorithms/array/mosAlgorithm/mosAlgorithm-guide.fig.tsx` | M | 822 | 0 |
| `src/algorithms/array/mosAlgorithm/mosAlgorithm-guide.md` | M | 874 | 686 |
| `src/algorithms/array/mosAlgorithm/mosAlgorithm-guide.proof.ts` | M | 1405 | 0 |
| `src/algorithms/array/mosAlgorithm/mosAlgorithm-guide.ref.ts` | M | 3 | 3 |
| `src/algorithms/array/mosAlgorithm/mosAlgorithm-guide.sim.ts` | M | 682 | 70 |
| `src/algorithms/array/mosAlgorithm/mosAlgorithm-guide.test.ts` | M | 39 | 2 |
| `src/algorithms/array/nextGreaterElement/figs/build-on-input.svg` | M | 26 | 0 |
| `src/algorithms/array/nextGreaterElement/figs/concept-one-read.svg` | M | 26 | 0 |
| `src/algorithms/array/nextGreaterElement/figs/concept-stack.svg` | M | 26 | 0 |
| `src/algorithms/array/nextGreaterElement/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/array/nextGreaterElement/figs/origin-scan.svg` | M | 26 | 0 |
| `src/algorithms/array/nextGreaterElement/figs/related-intervals.svg` | M | 26 | 0 |
| `src/algorithms/array/nextGreaterElement/figs/walk-film.svg` | M | 26 | 0 |
| `src/algorithms/array/nextGreaterElement/nextGreaterElement-guide.alt.ts` | M | 8 | 2 |
| `src/algorithms/array/nextGreaterElement/nextGreaterElement-guide.fig.tsx` | M | 848 | 0 |
| `src/algorithms/array/nextGreaterElement/nextGreaterElement-guide.md` | M | 886 | 791 |
| `src/algorithms/array/nextGreaterElement/nextGreaterElement-guide.proof.ts` | M | 1178 | 430 |
| `src/algorithms/array/nextGreaterElement/nextGreaterElement-guide.sim.ts` | M | 353 | 122 |
| `src/algorithms/array/nextGreaterElement/nextGreaterElement-guide.test.ts` | M | 21 | 3 |
| `src/algorithms/array/prefixSumRangeQuery/figs/build-cancel.svg` | M | 26 | 0 |
| `src/algorithms/array/prefixSumRangeQuery/figs/concept-cover.svg` | M | 26 | 0 |
| `src/algorithms/array/prefixSumRangeQuery/figs/concept-prefix.svg` | M | 26 | 0 |
| `src/algorithms/array/prefixSumRangeQuery/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/array/prefixSumRangeQuery/figs/walk-run.svg` | M | 26 | 0 |
| `src/algorithms/array/prefixSumRangeQuery/prefixSumRangeQuery-guide.alt.ts` | M | 4 | 4 |
| `src/algorithms/array/prefixSumRangeQuery/prefixSumRangeQuery-guide.bench.json` | M | 5 | 5 |
| `src/algorithms/array/prefixSumRangeQuery/prefixSumRangeQuery-guide.fig.tsx` | M | 563 | 0 |
| `src/algorithms/array/prefixSumRangeQuery/prefixSumRangeQuery-guide.md` | M | 706 | 568 |
| `src/algorithms/array/prefixSumRangeQuery/prefixSumRangeQuery-guide.proof.ts` | M | 1018 | 254 |
| `src/algorithms/array/prefixSumRangeQuery/prefixSumRangeQuery-guide.ref.ts` | M | 2 | 2 |
| `src/algorithms/array/prefixSumRangeQuery/prefixSumRangeQuery-guide.sim.ts` | M | 292 | 152 |
| `src/algorithms/array/prefixSumRangeQuery/prefixSumRangeQuery-guide.test.ts` | M | 20 | 0 |
| `src/algorithms/array/segmentTreeRangeMin/figs/build-bars.svg` | M | 26 | 0 |
| `src/algorithms/array/segmentTreeRangeMin/figs/concept-cover.svg` | M | 26 | 0 |
| `src/algorithms/array/segmentTreeRangeMin/figs/concept-tree.svg` | M | 26 | 0 |
| `src/algorithms/array/segmentTreeRangeMin/figs/concept-update.svg` | M | 26 | 0 |
| `src/algorithms/array/segmentTreeRangeMin/figs/invariant-moment.svg` | M | 26 | 0 |
| `src/algorithms/array/segmentTreeRangeMin/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/array/segmentTreeRangeMin/figs/walk-build.svg` | M | 26 | 0 |
| `src/algorithms/array/segmentTreeRangeMin/figs/walk-ops.svg` | M | 26 | 0 |
| `src/algorithms/array/segmentTreeRangeMin/segmentTreeRangeMin-guide.alt.ts` | M | 9 | 9 |
| `src/algorithms/array/segmentTreeRangeMin/segmentTreeRangeMin-guide.bench.json` | M | 7 | 7 |
| `src/algorithms/array/segmentTreeRangeMin/segmentTreeRangeMin-guide.fig.tsx` | M | 596 | 0 |
| `src/algorithms/array/segmentTreeRangeMin/segmentTreeRangeMin-guide.md` | M | 1061 | 813 |
| `src/algorithms/array/segmentTreeRangeMin/segmentTreeRangeMin-guide.proof.ts` | M | 2005 | 386 |
| `src/algorithms/array/segmentTreeRangeMin/segmentTreeRangeMin-guide.sim.ts` | M | 1514 | 210 |
| `src/algorithms/array/segmentTreeRangeMin/segmentTreeRangeMin-guide.test.ts` | M | 33 | 3 |
| `src/algorithms/array/slidingWindowMaximum/figs/build-on-input.svg` | M | 26 | 0 |
| `src/algorithms/array/slidingWindowMaximum/figs/concept-deque.svg` | M | 26 | 0 |
| `src/algorithms/array/slidingWindowMaximum/figs/concept-windows.svg` | M | 26 | 0 |
| `src/algorithms/array/slidingWindowMaximum/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/array/slidingWindowMaximum/figs/origin-rescan.svg` | M | 26 | 0 |
| `src/algorithms/array/slidingWindowMaximum/figs/walk-film.svg` | M | 26 | 0 |
| `src/algorithms/array/slidingWindowMaximum/slidingWindowMaximum-guide.alt.ts` | M | 17 | 17 |
| `src/algorithms/array/slidingWindowMaximum/slidingWindowMaximum-guide.bench.json` | M | 14 | 14 |
| `src/algorithms/array/slidingWindowMaximum/slidingWindowMaximum-guide.fig.tsx` | M | 946 | 0 |
| `src/algorithms/array/slidingWindowMaximum/slidingWindowMaximum-guide.md` | M | 1002 | 886 |
| `src/algorithms/array/slidingWindowMaximum/slidingWindowMaximum-guide.proof.ts` | M | 1423 | 573 |
| `src/algorithms/array/slidingWindowMaximum/slidingWindowMaximum-guide.ref.ts` | M | 8 | 8 |
| `src/algorithms/array/slidingWindowMaximum/slidingWindowMaximum-guide.sim.ts` | M | 605 | 133 |
| `src/algorithms/array/slidingWindowMaximum/slidingWindowMaximum-guide.test.ts` | M | 21 | 3 |
| `src/algorithms/array/sparseTableRangeMin/sparseTableRangeMin-guide.md` | M | 1 | 1 |
| `src/algorithms/array/subarraySumEqualsK/figs/build-map-whole.svg` | M | 26 | 0 |
| `src/algorithms/array/subarraySumEqualsK/figs/concept-lookup.svg` | M | 26 | 0 |
| `src/algorithms/array/subarraySumEqualsK/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/array/subarraySumEqualsK/figs/walk-scan.svg` | M | 26 | 0 |
| `src/algorithms/array/subarraySumEqualsK/subarraySumEqualsK-guide.fig.tsx` | M | 543 | 0 |
| `src/algorithms/array/subarraySumEqualsK/subarraySumEqualsK-guide.md` | M | 820 | 720 |
| `src/algorithms/array/subarraySumEqualsK/subarraySumEqualsK-guide.proof.ts` | M | 1041 | 297 |
| `src/algorithms/array/subarraySumEqualsK/subarraySumEqualsK-guide.ref.ts` | M | 5 | 5 |
| `src/algorithms/array/subarraySumEqualsK/subarraySumEqualsK-guide.sim.ts` | M | 288 | 114 |
| `src/algorithms/array/subarraySumEqualsK/subarraySumEqualsK-guide.test.ts` | M | 16 | 0 |
| `src/algorithms/array/twoSum/figs/build-map-final.svg` | M | 26 | 0 |
| `src/algorithms/array/twoSum/figs/concept-complement.svg` | M | 26 | 0 |
| `src/algorithms/array/twoSum/figs/concept-lookup.svg` | M | 26 | 0 |
| `src/algorithms/array/twoSum/figs/invariant-prefix.svg` | M | 26 | 0 |
| `src/algorithms/array/twoSum/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/array/twoSum/figs/walk-loop.svg` | M | 26 | 0 |
| `src/algorithms/array/twoSum/figs/walk-scan.svg` | M | 26 | 0 |
| `src/algorithms/array/twoSum/twoSum-guide.fig.tsx` | M | 523 | 0 |
| `src/algorithms/array/twoSum/twoSum-guide.md` | M | 33 | 17 |
| `src/algorithms/array/twoSum/twoSum-guide.sim.ts` | M | 180 | 0 |
| `src/algorithms/array/twoSum/twoSum-guide.test.ts` | M | 17 | 0 |
| `src/algorithms/binary-search/binarySearch/binarySearch-guide.fig.tsx` | M | 555 | 0 |
| `src/algorithms/binary-search/binarySearch/binarySearch-guide.md` | M | 518 | 436 |
| `src/algorithms/binary-search/binarySearch/binarySearch-guide.proof.ts` | M | 1053 | 155 |
| `src/algorithms/binary-search/binarySearch/binarySearch-guide.sim.ts` | M | 146 | 37 |
| `src/algorithms/binary-search/binarySearch/binarySearch-guide.test.ts` | M | 18 | 0 |
| `src/algorithms/binary-search/binarySearch/figs/build-candidates.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/binarySearch/figs/concept-first-read.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/binarySearch/figs/invariant-range.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/binarySearch/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/binarySearch/figs/origin-one-read.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/binarySearch/figs/walk-miss.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/binarySearch/figs/walk-probe.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/parametricBinarySearch/figs/build-candidates.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/parametricBinarySearch/figs/build-exact-vs-atmost.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/parametricBinarySearch/figs/build-greedy-ahead.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/parametricBinarySearch/figs/build-verdict-rows.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/parametricBinarySearch/figs/concept-judge.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/parametricBinarySearch/figs/concept-splits.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/parametricBinarySearch/figs/concept-verdict-line.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/parametricBinarySearch/figs/invariant-zones.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/parametricBinarySearch/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/parametricBinarySearch/figs/walk-probe.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/parametricBinarySearch/figs/walk-upper.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/parametricBinarySearch/parametricBinarySearch-guide.alt.ts` | M | 5 | 5 |
| `src/algorithms/binary-search/parametricBinarySearch/parametricBinarySearch-guide.bench.json` | M | 4 | 4 |
| `src/algorithms/binary-search/parametricBinarySearch/parametricBinarySearch-guide.fig.tsx` | M | 915 | 0 |
| `src/algorithms/binary-search/parametricBinarySearch/parametricBinarySearch-guide.md` | M | 794 | 548 |
| `src/algorithms/binary-search/parametricBinarySearch/parametricBinarySearch-guide.proof.ts` | M | 1252 | 209 |
| `src/algorithms/binary-search/parametricBinarySearch/parametricBinarySearch-guide.sim.ts` | M | 348 | 50 |
| `src/algorithms/binary-search/parametricBinarySearch/parametricBinarySearch-guide.test.ts` | M | 20 | 0 |
| `src/algorithms/binary-search/searchInRotatedSortedArray/figs/concept-break.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/searchInRotatedSortedArray/figs/concept-halves.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/searchInRotatedSortedArray/figs/concept-rotations.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/searchInRotatedSortedArray/figs/invariant-range.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/searchInRotatedSortedArray/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/searchInRotatedSortedArray/figs/walk-descent.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/searchInRotatedSortedArray/figs/walk-first-cut.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/searchInRotatedSortedArray/figs/walk-miss.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/searchInRotatedSortedArray/searchInRotatedSortedArray-guide.alt.ts` | M | 9 | 9 |
| `src/algorithms/binary-search/searchInRotatedSortedArray/searchInRotatedSortedArray-guide.bench.json` | M | 7 | 7 |
| `src/algorithms/binary-search/searchInRotatedSortedArray/searchInRotatedSortedArray-guide.fig.tsx` | M | 813 | 0 |
| `src/algorithms/binary-search/searchInRotatedSortedArray/searchInRotatedSortedArray-guide.md` | M | 864 | 665 |
| `src/algorithms/binary-search/searchInRotatedSortedArray/searchInRotatedSortedArray-guide.proof.ts` | M | 1389 | 283 |
| `src/algorithms/binary-search/searchInRotatedSortedArray/searchInRotatedSortedArray-guide.ref.ts` | M | 7 | 7 |
| `src/algorithms/binary-search/searchInRotatedSortedArray/searchInRotatedSortedArray-guide.sim.ts` | M | 344 | 65 |
| `src/algorithms/binary-search/searchInRotatedSortedArray/searchInRotatedSortedArray-guide.test.ts` | M | 23 | 0 |
| `src/algorithms/binary-search/ternarySearch/figs/build-candidates.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/ternarySearch/figs/build-two-valleys.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/ternarySearch/figs/build-unimodal-steps.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/ternarySearch/figs/build-unimodal.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/ternarySearch/figs/concept-two-probes.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/ternarySearch/figs/concept-unimodal.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/ternarySearch/figs/invariant-range.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/ternarySearch/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/ternarySearch/figs/origin-probes.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/ternarySearch/figs/walk-narrow.svg` | M | 26 | 0 |
| `src/algorithms/binary-search/ternarySearch/ternarySearch-guide.fig.tsx` | M | 769 | 0 |
| `src/algorithms/binary-search/ternarySearch/ternarySearch-guide.md` | M | 731 | 623 |
| `src/algorithms/binary-search/ternarySearch/ternarySearch-guide.proof.ts` | M | 1127 | 384 |
| `src/algorithms/binary-search/ternarySearch/ternarySearch-guide.sim.ts` | M | 238 | 114 |
| `src/algorithms/binary-search/ternarySearch/ternarySearch-guide.test.ts` | M | 17 | 0 |
| `src/algorithms/bit-manipulation/binaryGap/binaryGap-guide.fig.tsx` | M | 520 | 0 |
| `src/algorithms/bit-manipulation/binaryGap/binaryGap-guide.md` | M | 24 | 36 |
| `src/algorithms/bit-manipulation/binaryGap/binaryGap-guide.proof.ts` | M | 1 | 44 |
| `src/algorithms/bit-manipulation/binaryGap/binaryGap-guide.sim.ts` | M | 193 | 0 |
| `src/algorithms/bit-manipulation/binaryGap/binaryGap-guide.test.ts` | M | 14 | 0 |
| `src/algorithms/bit-manipulation/binaryGap/figs/concept-bits.svg` | M | 26 | 0 |
| `src/algorithms/bit-manipulation/binaryGap/figs/concept-shift.svg` | M | 26 | 0 |
| `src/algorithms/bit-manipulation/binaryGap/figs/invariant-open.svg` | M | 26 | 0 |
| `src/algorithms/bit-manipulation/binaryGap/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/bit-manipulation/binaryGap/figs/walk-scan.svg` | M | 26 | 0 |
| `src/algorithms/bit-manipulation/enumerateSubmasks/enumerateSubmasks-guide.fig.tsx` | M | 349 | 0 |
| `src/algorithms/bit-manipulation/enumerateSubmasks/enumerateSubmasks-guide.md` | M | 794 | 815 |
| `src/algorithms/bit-manipulation/enumerateSubmasks/enumerateSubmasks-guide.proof.ts` | M | 996 | 369 |
| `src/algorithms/bit-manipulation/enumerateSubmasks/enumerateSubmasks-guide.ref.ts` | M | 1 | 1 |
| `src/algorithms/bit-manipulation/enumerateSubmasks/enumerateSubmasks-guide.sim.ts` | M | 181 | 135 |
| `src/algorithms/bit-manipulation/enumerateSubmasks/enumerateSubmasks-guide.test.ts` | M | 19 | 0 |
| `src/algorithms/bit-manipulation/enumerateSubmasks/figs/build-counter.svg` | M | 26 | 0 |
| `src/algorithms/bit-manipulation/enumerateSubmasks/figs/concept-submasks.svg` | M | 26 | 0 |
| `src/algorithms/bit-manipulation/enumerateSubmasks/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/bit-manipulation/enumerateSubmasks/figs/walk-submasks.svg` | M | 26 | 0 |
| `src/algorithms/bit-manipulation/lowestSetBit/figs/build-regions.svg` | M | 26 | 0 |
| `src/algorithms/bit-manipulation/lowestSetBit/figs/concept-bits.svg` | M | 26 | 0 |
| `src/algorithms/bit-manipulation/lowestSetBit/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/bit-manipulation/lowestSetBit/figs/walk-lowbit.svg` | M | 26 | 0 |
| `src/algorithms/bit-manipulation/lowestSetBit/lowestSetBit-guide.fig.tsx` | M | 477 | 0 |
| `src/algorithms/bit-manipulation/lowestSetBit/lowestSetBit-guide.md` | M | 915 | 747 |
| `src/algorithms/bit-manipulation/lowestSetBit/lowestSetBit-guide.proof.ts` | M | 1269 | 567 |
| `src/algorithms/bit-manipulation/lowestSetBit/lowestSetBit-guide.ref.ts` | M | 2 | 2 |
| `src/algorithms/bit-manipulation/lowestSetBit/lowestSetBit-guide.sim.ts` | M | 312 | 152 |
| `src/algorithms/bit-manipulation/lowestSetBit/lowestSetBit-guide.test.ts` | M | 18 | 0 |
| `src/algorithms/bit-manipulation/matrixPowerFibonacci/figs/build-read.svg` | M | 26 | 0 |
| `src/algorithms/bit-manipulation/matrixPowerFibonacci/figs/concept-bits.svg` | M | 26 | 0 |
| `src/algorithms/bit-manipulation/matrixPowerFibonacci/figs/concept-step.svg` | M | 26 | 0 |
| `src/algorithms/bit-manipulation/matrixPowerFibonacci/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/bit-manipulation/matrixPowerFibonacci/figs/walk-run.svg` | M | 26 | 0 |
| `src/algorithms/bit-manipulation/matrixPowerFibonacci/matrixPowerFibonacci-guide.fig.tsx` | M | 738 | 0 |
| `src/algorithms/bit-manipulation/matrixPowerFibonacci/matrixPowerFibonacci-guide.md` | M | 932 | 880 |
| `src/algorithms/bit-manipulation/matrixPowerFibonacci/matrixPowerFibonacci-guide.proof.ts` | M | 1208 | 617 |
| `src/algorithms/bit-manipulation/matrixPowerFibonacci/matrixPowerFibonacci-guide.sim.ts` | M | 298 | 110 |
| `src/algorithms/bit-manipulation/matrixPowerFibonacci/matrixPowerFibonacci-guide.test.ts` | M | 21 | 4 |
| `src/algorithms/bit-manipulation/singleNumberXor/figs/build-bit-rows.svg` | M | 26 | 0 |
| `src/algorithms/bit-manipulation/singleNumberXor/figs/concept-columns.svg` | M | 26 | 0 |
| `src/algorithms/bit-manipulation/singleNumberXor/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/bit-manipulation/singleNumberXor/figs/origin-count-map.svg` | M | 26 | 0 |
| `src/algorithms/bit-manipulation/singleNumberXor/figs/walk-xor.svg` | M | 26 | 0 |
| `src/algorithms/bit-manipulation/singleNumberXor/singleNumberXor-guide.fig.tsx` | M | 492 | 0 |
| `src/algorithms/bit-manipulation/singleNumberXor/singleNumberXor-guide.md` | M | 769 | 801 |
| `src/algorithms/bit-manipulation/singleNumberXor/singleNumberXor-guide.proof.ts` | M | 968 | 712 |
| `src/algorithms/bit-manipulation/singleNumberXor/singleNumberXor-guide.sim.ts` | M | 247 | 102 |
| `src/algorithms/bit-manipulation/singleNumberXor/singleNumberXor-guide.test.ts` | M | 16 | 0 |
| `src/algorithms/dp/coinChangeWays/coinChangeWays-guide.fig.tsx` | M | 540 | 0 |
| `src/algorithms/dp/coinChangeWays/coinChangeWays-guide.md` | M | 811 | 571 |
| `src/algorithms/dp/coinChangeWays/coinChangeWays-guide.proof.ts` | M | 1121 | 191 |
| `src/algorithms/dp/coinChangeWays/coinChangeWays-guide.ref.ts` | M | 3 | 3 |
| `src/algorithms/dp/coinChangeWays/coinChangeWays-guide.sim.ts` | M | 325 | 127 |
| `src/algorithms/dp/coinChangeWays/coinChangeWays-guide.test.ts` | M | 26 | 0 |
| `src/algorithms/dp/coinChangeWays/figs/build-contrast.svg` | M | 26 | 0 |
| `src/algorithms/dp/coinChangeWays/figs/build-neighbors.svg` | M | 26 | 0 |
| `src/algorithms/dp/coinChangeWays/figs/build-read-cell.svg` | M | 26 | 0 |
| `src/algorithms/dp/coinChangeWays/figs/concept-rule.svg` | M | 26 | 0 |
| `src/algorithms/dp/coinChangeWays/figs/concept-table.svg` | M | 26 | 0 |
| `src/algorithms/dp/coinChangeWays/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/dp/coinChangeWays/figs/walk-row1.svg` | M | 26 | 0 |
| `src/algorithms/dp/coinChangeWays/figs/walk-row2.svg` | M | 26 | 0 |
| `src/algorithms/dp/coinChangeWays/figs/walk-row3.svg` | M | 26 | 0 |
| `src/algorithms/dp/digitDp/digitDp-guide.fig.tsx` | M | 1048 | 0 |
| `src/algorithms/dp/digitDp/digitDp-guide.md` | M | 990 | 849 |
| `src/algorithms/dp/digitDp/digitDp-guide.proof.ts` | M | 1023 | 551 |
| `src/algorithms/dp/digitDp/digitDp-guide.ref.ts` | M | 5 | 5 |
| `src/algorithms/dp/digitDp/digitDp-guide.sim.ts` | M | 1097 | 395 |
| `src/algorithms/dp/digitDp/digitDp-guide.test.ts` | M | 36 | 0 |
| `src/algorithms/dp/digitDp/figs/build-positions.svg` | M | 26 | 0 |
| `src/algorithms/dp/digitDp/figs/concept-states.svg` | M | 26 | 0 |
| `src/algorithms/dp/digitDp/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/dp/digitDp/figs/walk-free.svg` | M | 26 | 0 |
| `src/algorithms/dp/digitDp/figs/walk-tight.svg` | M | 26 | 0 |
| `src/algorithms/dp/expectedValueDp/expectedValueDp-guide.alt.ts` | M | 9 | 9 |
| `src/algorithms/dp/expectedValueDp/expectedValueDp-guide.bench.json` | M | 2 | 2 |
| `src/algorithms/dp/expectedValueDp/expectedValueDp-guide.fig.tsx` | M | 632 | 0 |
| `src/algorithms/dp/expectedValueDp/expectedValueDp-guide.md` | M | 933 | 711 |
| `src/algorithms/dp/expectedValueDp/expectedValueDp-guide.proof.ts` | M | 665 | 17 |
| `src/algorithms/dp/expectedValueDp/expectedValueDp-guide.ref.ts` | M | 7 | 7 |
| `src/algorithms/dp/expectedValueDp/expectedValueDp-guide.sim.ts` | M | 1460 | 239 |
| `src/algorithms/dp/expectedValueDp/expectedValueDp-guide.test.ts` | M | 27 | 0 |
| `src/algorithms/dp/expectedValueDp/figs/build-contrast.svg` | M | 26 | 0 |
| `src/algorithms/dp/expectedValueDp/figs/build-distribution.svg` | M | 26 | 0 |
| `src/algorithms/dp/expectedValueDp/figs/build-neighbors.svg` | M | 26 | 0 |
| `src/algorithms/dp/expectedValueDp/figs/build-read-cell.svg` | M | 26 | 0 |
| `src/algorithms/dp/expectedValueDp/figs/concept-rule.svg` | M | 26 | 0 |
| `src/algorithms/dp/expectedValueDp/figs/concept-table.svg` | M | 26 | 0 |
| `src/algorithms/dp/expectedValueDp/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/dp/expectedValueDp/figs/walk-row1.svg` | M | 26 | 0 |
| `src/algorithms/dp/expectedValueDp/figs/walk-row2.svg` | M | 26 | 0 |
| `src/algorithms/dp/expectedValueDp/figs/walk-tail.svg` | M | 26 | 0 |
| `src/algorithms/dp/knapsack01/figs/build-read-cell.svg` | M | 26 | 0 |
| `src/algorithms/dp/knapsack01/figs/build-reads.svg` | M | 26 | 0 |
| `src/algorithms/dp/knapsack01/figs/concept-rule.svg` | M | 26 | 0 |
| `src/algorithms/dp/knapsack01/figs/concept-table.svg` | M | 26 | 0 |
| `src/algorithms/dp/knapsack01/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/dp/knapsack01/figs/pause-one-row-down.svg` | M | 26 | 0 |
| `src/algorithms/dp/knapsack01/figs/pause-one-row-up.svg` | M | 26 | 0 |
| `src/algorithms/dp/knapsack01/figs/walk-row1.svg` | M | 26 | 0 |
| `src/algorithms/dp/knapsack01/figs/walk-row2.svg` | M | 26 | 0 |
| `src/algorithms/dp/knapsack01/figs/walk-row3.svg` | M | 26 | 0 |
| `src/algorithms/dp/knapsack01/figs/walk-row4.svg` | M | 26 | 0 |
| `src/algorithms/dp/knapsack01/knapsack01-guide.alt.ts` | M | 5 | 5 |
| `src/algorithms/dp/knapsack01/knapsack01-guide.bench.json` | M | 2 | 2 |
| `src/algorithms/dp/knapsack01/knapsack01-guide.fig.tsx` | M | 637 | 0 |
| `src/algorithms/dp/knapsack01/knapsack01-guide.md` | M | 834 | 565 |
| `src/algorithms/dp/knapsack01/knapsack01-guide.proof.ts` | M | 1308 | 0 |
| `src/algorithms/dp/knapsack01/knapsack01-guide.ref.ts` | M | 3 | 3 |
| `src/algorithms/dp/knapsack01/knapsack01-guide.sim.ts` | M | 649 | 60 |
| `src/algorithms/dp/knapsack01/knapsack01-guide.test.ts` | M | 30 | 0 |
| `src/algorithms/dp/matrixChainMultiplication/figs/build-contrast.svg` | M | 26 | 0 |
| `src/algorithms/dp/matrixChainMultiplication/figs/build-diagonals.svg` | M | 26 | 0 |
| `src/algorithms/dp/matrixChainMultiplication/figs/build-neighbors.svg` | M | 26 | 0 |
| `src/algorithms/dp/matrixChainMultiplication/figs/build-read-cell.svg` | M | 26 | 0 |
| `src/algorithms/dp/matrixChainMultiplication/figs/concept-rule.svg` | M | 26 | 0 |
| `src/algorithms/dp/matrixChainMultiplication/figs/concept-table.svg` | M | 26 | 0 |
| `src/algorithms/dp/matrixChainMultiplication/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/dp/matrixChainMultiplication/figs/related-polygon.svg` | M | 26 | 0 |
| `src/algorithms/dp/matrixChainMultiplication/figs/walk-len2.svg` | M | 26 | 0 |
| `src/algorithms/dp/matrixChainMultiplication/figs/walk-len3.svg` | M | 26 | 0 |
| `src/algorithms/dp/matrixChainMultiplication/figs/walk-len4.svg` | M | 26 | 0 |
| `src/algorithms/dp/matrixChainMultiplication/matrixChainMultiplication-guide.fig.tsx` | M | 1098 | 0 |
| `src/algorithms/dp/matrixChainMultiplication/matrixChainMultiplication-guide.md` | M | 997 | 691 |
| `src/algorithms/dp/matrixChainMultiplication/matrixChainMultiplication-guide.proof.ts` | M | 1211 | 531 |
| `src/algorithms/dp/matrixChainMultiplication/matrixChainMultiplication-guide.ref.ts` | M | 2 | 2 |
| `src/algorithms/dp/matrixChainMultiplication/matrixChainMultiplication-guide.sim.ts` | M | 646 | 288 |
| `src/algorithms/dp/matrixChainMultiplication/matrixChainMultiplication-guide.test.ts` | M | 36 | 0 |
| `src/algorithms/dp/palindromePartitioningMinCut/figs/build-cut-interval.svg` | M | 26 | 0 |
| `src/algorithms/dp/palindromePartitioningMinCut/figs/build-cut-prefixes.svg` | M | 26 | 0 |
| `src/algorithms/dp/palindromePartitioningMinCut/figs/build-cut-reads.svg` | M | 26 | 0 |
| `src/algorithms/dp/palindromePartitioningMinCut/figs/build-pal-contrast.svg` | M | 26 | 0 |
| `src/algorithms/dp/palindromePartitioningMinCut/figs/build-pal-diagonals.svg` | M | 26 | 0 |
| `src/algorithms/dp/palindromePartitioningMinCut/figs/build-pal-read.svg` | M | 26 | 0 |
| `src/algorithms/dp/palindromePartitioningMinCut/figs/concept-cut.svg` | M | 26 | 0 |
| `src/algorithms/dp/palindromePartitioningMinCut/figs/concept-pal.svg` | M | 26 | 0 |
| `src/algorithms/dp/palindromePartitioningMinCut/figs/concept-rule.svg` | M | 26 | 0 |
| `src/algorithms/dp/palindromePartitioningMinCut/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/dp/palindromePartitioningMinCut/figs/walk-cut-first.svg` | M | 26 | 0 |
| `src/algorithms/dp/palindromePartitioningMinCut/figs/walk-cut-last.svg` | M | 26 | 0 |
| `src/algorithms/dp/palindromePartitioningMinCut/figs/walk-pal-long.svg` | M | 26 | 0 |
| `src/algorithms/dp/palindromePartitioningMinCut/figs/walk-pal-short.svg` | M | 26 | 0 |
| `src/algorithms/dp/palindromePartitioningMinCut/palindromePartitioningMinCut-guide.fig.tsx` | M | 1451 | 0 |
| `src/algorithms/dp/palindromePartitioningMinCut/palindromePartitioningMinCut-guide.md` | M | 1288 | 717 |
| `src/algorithms/dp/palindromePartitioningMinCut/palindromePartitioningMinCut-guide.proof.ts` | M | 1796 | 607 |
| `src/algorithms/dp/palindromePartitioningMinCut/palindromePartitioningMinCut-guide.sim.ts` | M | 1006 | 315 |
| `src/algorithms/dp/palindromePartitioningMinCut/palindromePartitioningMinCut-guide.test.ts` | M | 50 | 0 |
| `src/algorithms/dp/subsetSum/figs/build-neighbors.svg` | M | 26 | 0 |
| `src/algorithms/dp/subsetSum/figs/build-read-cell.svg` | M | 26 | 0 |
| `src/algorithms/dp/subsetSum/figs/concept-rule.svg` | M | 26 | 0 |
| `src/algorithms/dp/subsetSum/figs/concept-table.svg` | M | 26 | 0 |
| `src/algorithms/dp/subsetSum/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/dp/subsetSum/figs/origin-one-row.svg` | M | 26 | 0 |
| `src/algorithms/dp/subsetSum/figs/related-sumset.svg` | M | 26 | 0 |
| `src/algorithms/dp/subsetSum/figs/walk-lower.svg` | M | 26 | 0 |
| `src/algorithms/dp/subsetSum/figs/walk-upper.svg` | M | 26 | 0 |
| `src/algorithms/dp/subsetSum/subsetSum-guide.alt.ts` | M | 21 | 19 |
| `src/algorithms/dp/subsetSum/subsetSum-guide.bench.json` | M | 6 | 6 |
| `src/algorithms/dp/subsetSum/subsetSum-guide.fig.tsx` | M | 645 | 0 |
| `src/algorithms/dp/subsetSum/subsetSum-guide.md` | M | 817 | 652 |
| `src/algorithms/dp/subsetSum/subsetSum-guide.proof.ts` | M | 1195 | 251 |
| `src/algorithms/dp/subsetSum/subsetSum-guide.sim.ts` | M | 851 | 249 |
| `src/algorithms/dp/subsetSum/subsetSum-guide.test.ts` | M | 31 | 0 |
| `src/algorithms/dp/treeMaxIndependentSet/figs/build-contrast.svg` | M | 26 | 0 |
| `src/algorithms/dp/treeMaxIndependentSet/figs/build-read-cell.svg` | M | 26 | 0 |
| `src/algorithms/dp/treeMaxIndependentSet/figs/build-relation.svg` | M | 26 | 0 |
| `src/algorithms/dp/treeMaxIndependentSet/figs/build-table.svg` | M | 26 | 0 |
| `src/algorithms/dp/treeMaxIndependentSet/figs/concept-table.svg` | M | 26 | 0 |
| `src/algorithms/dp/treeMaxIndependentSet/figs/concept-tree.svg` | M | 26 | 0 |
| `src/algorithms/dp/treeMaxIndependentSet/figs/invariant-moment.svg` | M | 26 | 0 |
| `src/algorithms/dp/treeMaxIndependentSet/figs/math-coloring.svg` | M | 26 | 0 |
| `src/algorithms/dp/treeMaxIndependentSet/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/dp/treeMaxIndependentSet/figs/origin-subtrees.svg` | M | 26 | 0 |
| `src/algorithms/dp/treeMaxIndependentSet/figs/related-cover.svg` | M | 26 | 0 |
| `src/algorithms/dp/treeMaxIndependentSet/figs/walk-film.svg` | M | 26 | 0 |
| `src/algorithms/dp/treeMaxIndependentSet/treeMaxIndependentSet-guide.fig.tsx` | M | 575 | 0 |
| `src/algorithms/dp/treeMaxIndependentSet/treeMaxIndependentSet-guide.md` | M | 999 | 860 |
| `src/algorithms/dp/treeMaxIndependentSet/treeMaxIndependentSet-guide.proof.ts` | M | 1710 | 426 |
| `src/algorithms/dp/treeMaxIndependentSet/treeMaxIndependentSet-guide.sim.ts` | M | 710 | 562 |
| `src/algorithms/dp/treeMaxIndependentSet/treeMaxIndependentSet-guide.test.ts` | M | 29 | 0 |
| `src/algorithms/dp/tspBitmask/figs/build-contrast.svg` | M | 26 | 0 |
| `src/algorithms/dp/tspBitmask/figs/build-merge.svg` | M | 26 | 0 |
| `src/algorithms/dp/tspBitmask/figs/build-read-cell.svg` | M | 26 | 0 |
| `src/algorithms/dp/tspBitmask/figs/build-relation.svg` | M | 26 | 0 |
| `src/algorithms/dp/tspBitmask/figs/concept-table.svg` | M | 26 | 0 |
| `src/algorithms/dp/tspBitmask/figs/concept-tour.svg` | M | 26 | 0 |
| `src/algorithms/dp/tspBitmask/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/dp/tspBitmask/figs/walk-part1.svg` | M | 26 | 0 |
| `src/algorithms/dp/tspBitmask/figs/walk-part2.svg` | M | 26 | 0 |
| `src/algorithms/dp/tspBitmask/figs/walk-part3.svg` | M | 26 | 0 |
| `src/algorithms/dp/tspBitmask/tspBitmask-guide.alt.ts` | M | 23 | 13 |
| `src/algorithms/dp/tspBitmask/tspBitmask-guide.bench.json` | M | 10 | 10 |
| `src/algorithms/dp/tspBitmask/tspBitmask-guide.fig.tsx` | M | 1083 | 0 |
| `src/algorithms/dp/tspBitmask/tspBitmask-guide.md` | M | 1156 | 959 |
| `src/algorithms/dp/tspBitmask/tspBitmask-guide.proof.ts` | M | 1220 | 1135 |
| `src/algorithms/dp/tspBitmask/tspBitmask-guide.ref.ts` | M | 9 | 9 |
| `src/algorithms/dp/tspBitmask/tspBitmask-guide.sim.ts` | M | 1405 | 853 |
| `src/algorithms/dp/tspBitmask/tspBitmask-guide.test.ts` | M | 30 | 0 |
| `src/algorithms/dp/unboundedKnapsack/figs/build-contrast.svg` | M | 26 | 0 |
| `src/algorithms/dp/unboundedKnapsack/figs/build-neighbors.svg` | M | 26 | 0 |
| `src/algorithms/dp/unboundedKnapsack/figs/build-read-cell.svg` | M | 26 | 0 |
| `src/algorithms/dp/unboundedKnapsack/figs/concept-rule.svg` | M | 26 | 0 |
| `src/algorithms/dp/unboundedKnapsack/figs/concept-table.svg` | M | 26 | 0 |
| `src/algorithms/dp/unboundedKnapsack/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/dp/unboundedKnapsack/figs/pause-one-row-down.svg` | M | 26 | 0 |
| `src/algorithms/dp/unboundedKnapsack/figs/pause-one-row-up.svg` | M | 26 | 0 |
| `src/algorithms/dp/unboundedKnapsack/figs/walk-row1.svg` | M | 26 | 0 |
| `src/algorithms/dp/unboundedKnapsack/figs/walk-row2.svg` | M | 26 | 0 |
| `src/algorithms/dp/unboundedKnapsack/figs/walk-row3.svg` | M | 26 | 0 |
| `src/algorithms/dp/unboundedKnapsack/unboundedKnapsack-guide.alt.ts` | M | 8 | 8 |
| `src/algorithms/dp/unboundedKnapsack/unboundedKnapsack-guide.bench.json` | M | 6 | 6 |
| `src/algorithms/dp/unboundedKnapsack/unboundedKnapsack-guide.fig.tsx` | M | 757 | 0 |
| `src/algorithms/dp/unboundedKnapsack/unboundedKnapsack-guide.md` | M | 851 | 630 |
| `src/algorithms/dp/unboundedKnapsack/unboundedKnapsack-guide.proof.ts` | M | 922 | 247 |
| `src/algorithms/dp/unboundedKnapsack/unboundedKnapsack-guide.sim.ts` | M | 370 | 156 |
| `src/algorithms/dp/unboundedKnapsack/unboundedKnapsack-guide.test.ts` | M | 26 | 0 |
| `src/algorithms/etc/maxCounters/figs/build-base-rows.svg` | M | 26 | 0 |
| `src/algorithms/etc/maxCounters/figs/concept-base.svg` | M | 26 | 0 |
| `src/algorithms/etc/maxCounters/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/etc/maxCounters/figs/walk-run.svg` | M | 26 | 0 |
| `src/algorithms/etc/maxCounters/maxCounters-guide.fig.tsx` | M | 521 | 0 |
| `src/algorithms/etc/maxCounters/maxCounters-guide.md` | M | 738 | 565 |
| `src/algorithms/etc/maxCounters/maxCounters-guide.proof.ts` | M | 962 | 259 |
| `src/algorithms/etc/maxCounters/maxCounters-guide.sim.ts` | M | 271 | 128 |
| `src/algorithms/etc/maxCounters/maxCounters-guide.test.ts` | M | 21 | 4 |
| `src/algorithms/etc/numberOfDisintersection/figs/concept-stop-one.svg` | M | 26 | 0 |
| `src/algorithms/etc/numberOfDisintersection/figs/concept-sweep.svg` | M | 26 | 0 |
| `src/algorithms/etc/numberOfDisintersection/figs/invariant-stop.svg` | M | 26 | 0 |
| `src/algorithms/etc/numberOfDisintersection/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/etc/numberOfDisintersection/figs/walk-sweep.svg` | M | 26 | 0 |
| `src/algorithms/etc/numberOfDisintersection/numberOfDisintersection-guide.fig.tsx` | M | 540 | 0 |
| `src/algorithms/etc/numberOfDisintersection/numberOfDisintersection-guide.md` | M | 27 | 23 |
| `src/algorithms/etc/numberOfDisintersection/numberOfDisintersection-guide.proof.ts` | M | 0 | 19 |
| `src/algorithms/etc/numberOfDisintersection/numberOfDisintersection-guide.sim.ts` | M | 223 | 0 |
| `src/algorithms/etc/numberOfDisintersection/numberOfDisintersection-guide.test.ts` | M | 16 | 0 |
| `src/algorithms/geometry/bentleyOttmann/bentleyOttmann-guide.alt.ts` | M | 101 | 57 |
| `src/algorithms/geometry/bentleyOttmann/bentleyOttmann-guide.bench.json` | M | 18 | 18 |
| `src/algorithms/geometry/bentleyOttmann/bentleyOttmann-guide.fig.tsx` | M | 523 | 0 |
| `src/algorithms/geometry/bentleyOttmann/bentleyOttmann-guide.md` | M | 1062 | 882 |
| `src/algorithms/geometry/bentleyOttmann/bentleyOttmann-guide.proof.ts` | M | 1776 | 1065 |
| `src/algorithms/geometry/bentleyOttmann/bentleyOttmann-guide.sim.ts` | M | 1693 | 129 |
| `src/algorithms/geometry/bentleyOttmann/bentleyOttmann-guide.test.ts` | M | 29 | 0 |
| `src/algorithms/geometry/bentleyOttmann/figs/build-status.svg` | M | 26 | 0 |
| `src/algorithms/geometry/bentleyOttmann/figs/concept-sweep.svg` | M | 26 | 0 |
| `src/algorithms/geometry/bentleyOttmann/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/geometry/bentleyOttmann/figs/walk-first.svg` | M | 26 | 0 |
| `src/algorithms/geometry/bentleyOttmann/figs/walk-second.svg` | M | 26 | 0 |
| `src/algorithms/geometry/closestPairOfPoints/closestPairOfPoints-guide.alt.ts` | M | 50 | 187 |
| `src/algorithms/geometry/closestPairOfPoints/closestPairOfPoints-guide.bench.json` | M | 15 | 19 |
| `src/algorithms/geometry/closestPairOfPoints/closestPairOfPoints-guide.fig.tsx` | M | 648 | 0 |
| `src/algorithms/geometry/closestPairOfPoints/closestPairOfPoints-guide.md` | M | 987 | 1028 |
| `src/algorithms/geometry/closestPairOfPoints/closestPairOfPoints-guide.proof.ts` | M | 1605 | 1358 |
| `src/algorithms/geometry/closestPairOfPoints/closestPairOfPoints-guide.sim.ts` | M | 1529 | 105 |
| `src/algorithms/geometry/closestPairOfPoints/closestPairOfPoints-guide.test.ts` | M | 33 | 0 |
| `src/algorithms/geometry/closestPairOfPoints/figs/build-strip.svg` | M | 26 | 0 |
| `src/algorithms/geometry/closestPairOfPoints/figs/build-tree.svg` | M | 26 | 0 |
| `src/algorithms/geometry/closestPairOfPoints/figs/concept-strip.svg` | M | 26 | 0 |
| `src/algorithms/geometry/closestPairOfPoints/figs/math-cells.svg` | M | 26 | 0 |
| `src/algorithms/geometry/closestPairOfPoints/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/geometry/closestPairOfPoints/figs/walk-left.svg` | M | 26 | 0 |
| `src/algorithms/geometry/closestPairOfPoints/figs/walk-right.svg` | M | 26 | 0 |
| `src/algorithms/geometry/convexHull/convexHull-guide.alt.ts` | M | 2 | 2 |
| `src/algorithms/geometry/convexHull/convexHull-guide.bench.json` | M | 8 | 8 |
| `src/algorithms/geometry/convexHull/convexHull-guide.fig.tsx` | M | 611 | 0 |
| `src/algorithms/geometry/convexHull/convexHull-guide.md` | M | 967 | 853 |
| `src/algorithms/geometry/convexHull/convexHull-guide.proof.ts` | M | 1011 | 705 |
| `src/algorithms/geometry/convexHull/convexHull-guide.ref.ts` | M | 1 | 1 |
| `src/algorithms/geometry/convexHull/convexHull-guide.sim.ts` | M | 1562 | 120 |
| `src/algorithms/geometry/convexHull/convexHull-guide.test.ts` | M | 34 | 1 |
| `src/algorithms/geometry/convexHull/figs/build-chains.svg` | M | 26 | 0 |
| `src/algorithms/geometry/convexHull/figs/build-lower-film.svg` | M | 26 | 0 |
| `src/algorithms/geometry/convexHull/figs/build-polyline.svg` | M | 26 | 0 |
| `src/algorithms/geometry/convexHull/figs/concept-chains.svg` | M | 26 | 0 |
| `src/algorithms/geometry/convexHull/figs/concept-hull.svg` | M | 26 | 0 |
| `src/algorithms/geometry/convexHull/figs/concept-turns.svg` | M | 26 | 0 |
| `src/algorithms/geometry/convexHull/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/geometry/convexHull/figs/walk-lower.svg` | M | 26 | 0 |
| `src/algorithms/geometry/convexHull/figs/walk-upper.svg` | M | 26 | 0 |
| `src/algorithms/geometry/pointInPolygon/figs/build-alternate.svg` | M | 26 | 0 |
| `src/algorithms/geometry/pointInPolygon/figs/build-direction.svg` | M | 26 | 0 |
| `src/algorithms/geometry/pointInPolygon/figs/build-ray-q1.svg` | M | 26 | 0 |
| `src/algorithms/geometry/pointInPolygon/figs/build-vertex.svg` | M | 26 | 0 |
| `src/algorithms/geometry/pointInPolygon/figs/concept-rays.svg` | M | 26 | 0 |
| `src/algorithms/geometry/pointInPolygon/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/geometry/pointInPolygon/figs/origin-grid.svg` | M | 26 | 0 |
| `src/algorithms/geometry/pointInPolygon/figs/walk-points.svg` | M | 26 | 0 |
| `src/algorithms/geometry/pointInPolygon/pointInPolygon-guide.alt.ts` | M | 4 | 2 |
| `src/algorithms/geometry/pointInPolygon/pointInPolygon-guide.bench.json` | M | 10 | 10 |
| `src/algorithms/geometry/pointInPolygon/pointInPolygon-guide.fig.tsx` | M | 684 | 0 |
| `src/algorithms/geometry/pointInPolygon/pointInPolygon-guide.md` | M | 1004 | 917 |
| `src/algorithms/geometry/pointInPolygon/pointInPolygon-guide.proof.ts` | M | 1052 | 571 |
| `src/algorithms/geometry/pointInPolygon/pointInPolygon-guide.sim.ts` | M | 1173 | 98 |
| `src/algorithms/geometry/pointInPolygon/pointInPolygon-guide.test.ts` | M | 25 | 0 |
| `src/algorithms/geometry/polygonArea/figs/build-fan-far.svg` | M | 26 | 0 |
| `src/algorithms/geometry/polygonArea/figs/concept-fan.svg` | M | 26 | 0 |
| `src/algorithms/geometry/polygonArea/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/geometry/polygonArea/figs/origin-ears.svg` | M | 26 | 0 |
| `src/algorithms/geometry/polygonArea/figs/walk-area.svg` | M | 26 | 0 |
| `src/algorithms/geometry/polygonArea/figs/walk-reverse.svg` | M | 26 | 0 |
| `src/algorithms/geometry/polygonArea/polygonArea-guide.alt.ts` | M | 3 | 3 |
| `src/algorithms/geometry/polygonArea/polygonArea-guide.fig.tsx` | M | 386 | 0 |
| `src/algorithms/geometry/polygonArea/polygonArea-guide.md` | M | 971 | 847 |
| `src/algorithms/geometry/polygonArea/polygonArea-guide.proof.ts` | M | 1131 | 603 |
| `src/algorithms/geometry/polygonArea/polygonArea-guide.sim.ts` | M | 1258 | 92 |
| `src/algorithms/geometry/polygonArea/polygonArea-guide.test.ts` | M | 27 | 0 |
| `src/algorithms/geometry/rotatingCalipersDiameter/figs/build-advance-film.svg` | M | 26 | 0 |
| `src/algorithms/geometry/rotatingCalipersDiameter/figs/build-antipodal.svg` | M | 26 | 0 |
| `src/algorithms/geometry/rotatingCalipersDiameter/figs/build-read.svg` | M | 26 | 0 |
| `src/algorithms/geometry/rotatingCalipersDiameter/figs/build-why.svg` | M | 26 | 0 |
| `src/algorithms/geometry/rotatingCalipersDiameter/figs/concept-calipers.svg` | M | 26 | 0 |
| `src/algorithms/geometry/rotatingCalipersDiameter/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/geometry/rotatingCalipersDiameter/figs/walk-calipers.svg` | M | 26 | 0 |
| `src/algorithms/geometry/rotatingCalipersDiameter/rotatingCalipersDiameter-guide.alt.ts` | M | 39 | 35 |
| `src/algorithms/geometry/rotatingCalipersDiameter/rotatingCalipersDiameter-guide.bench.json` | M | 17 | 17 |
| `src/algorithms/geometry/rotatingCalipersDiameter/rotatingCalipersDiameter-guide.fig.tsx` | M | 551 | 0 |
| `src/algorithms/geometry/rotatingCalipersDiameter/rotatingCalipersDiameter-guide.md` | M | 1046 | 933 |
| `src/algorithms/geometry/rotatingCalipersDiameter/rotatingCalipersDiameter-guide.proof.ts` | M | 1787 | 929 |
| `src/algorithms/geometry/rotatingCalipersDiameter/rotatingCalipersDiameter-guide.ref.ts` | M | 3 | 3 |
| `src/algorithms/geometry/rotatingCalipersDiameter/rotatingCalipersDiameter-guide.sim.ts` | M | 782 | 134 |
| `src/algorithms/geometry/rotatingCalipersDiameter/rotatingCalipersDiameter-guide.test.ts` | M | 28 | 0 |
| `src/algorithms/geometry/segmentsIntersect/figs/build-collinear.svg` | M | 26 | 0 |
| `src/algorithms/geometry/segmentsIntersect/figs/build-straddle-both.svg` | M | 26 | 0 |
| `src/algorithms/geometry/segmentsIntersect/figs/build-straddle-one.svg` | M | 26 | 0 |
| `src/algorithms/geometry/segmentsIntersect/figs/concept-shapes.svg` | M | 26 | 0 |
| `src/algorithms/geometry/segmentsIntersect/figs/concept-turns.svg` | M | 26 | 0 |
| `src/algorithms/geometry/segmentsIntersect/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/geometry/segmentsIntersect/figs/walk-pairs.svg` | M | 26 | 0 |
| `src/algorithms/geometry/segmentsIntersect/segmentsIntersect-guide.alt.ts` | M | 5 | 4 |
| `src/algorithms/geometry/segmentsIntersect/segmentsIntersect-guide.fig.tsx` | M | 612 | 0 |
| `src/algorithms/geometry/segmentsIntersect/segmentsIntersect-guide.md` | M | 905 | 852 |
| `src/algorithms/geometry/segmentsIntersect/segmentsIntersect-guide.proof.ts` | M | 1075 | 679 |
| `src/algorithms/geometry/segmentsIntersect/segmentsIntersect-guide.sim.ts` | M | 648 | 94 |
| `src/algorithms/geometry/segmentsIntersect/segmentsIntersect-guide.test.ts` | M | 39 | 2 |
| `src/algorithms/graph-flow/isBipartite/figs/build-clash.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/isBipartite/figs/build-rows.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/isBipartite/figs/concept-sides.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/isBipartite/figs/math-odd-cycle.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/isBipartite/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/isBipartite/figs/walk-bipartite.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/isBipartite/isBipartite-guide.fig.tsx` | M | 375 | 0 |
| `src/algorithms/graph-flow/isBipartite/isBipartite-guide.md` | M | 1175 | 1048 |
| `src/algorithms/graph-flow/isBipartite/isBipartite-guide.proof.ts` | M | 1541 | 439 |
| `src/algorithms/graph-flow/isBipartite/isBipartite-guide.ref.ts` | M | 2 | 2 |
| `src/algorithms/graph-flow/isBipartite/isBipartite-guide.sim.ts` | M | 810 | 416 |
| `src/algorithms/graph-flow/isBipartite/isBipartite-guide.test.ts` | M | 34 | 2 |
| `src/algorithms/graph-flow/kruskalMst/figs/build-compress.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/kruskalMst/figs/build-forest.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/kruskalMst/figs/build-union.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/kruskalMst/figs/concept-forest.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/kruskalMst/figs/concept-graph.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/kruskalMst/figs/concept-mst.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/kruskalMst/figs/invariant-cut.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/kruskalMst/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/kruskalMst/figs/walk-film.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/kruskalMst/kruskalMst-guide.alt.ts` | M | 50 | 5 |
| `src/algorithms/graph-flow/kruskalMst/kruskalMst-guide.bench.json` | M | 10 | 8 |
| `src/algorithms/graph-flow/kruskalMst/kruskalMst-guide.fig.tsx` | M | 541 | 0 |
| `src/algorithms/graph-flow/kruskalMst/kruskalMst-guide.md` | M | 1005 | 918 |
| `src/algorithms/graph-flow/kruskalMst/kruskalMst-guide.proof.ts` | M | 1676 | 327 |
| `src/algorithms/graph-flow/kruskalMst/kruskalMst-guide.sim.ts` | M | 733 | 301 |
| `src/algorithms/graph-flow/kruskalMst/kruskalMst-guide.test.ts` | M | 29 | 0 |
| `src/algorithms/graph-flow/maxBipartiteMatching/figs/build-contrast.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/maxBipartiteMatching/figs/build-flip-order.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/maxBipartiteMatching/figs/build-path.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/maxBipartiteMatching/figs/concept-flip.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/maxBipartiteMatching/figs/concept-matching.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/maxBipartiteMatching/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/maxBipartiteMatching/figs/related-konig.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/maxBipartiteMatching/figs/walk-film.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/maxBipartiteMatching/figs/worst-block.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/maxBipartiteMatching/maxBipartiteMatching-guide.alt.ts` | M | 15 | 14 |
| `src/algorithms/graph-flow/maxBipartiteMatching/maxBipartiteMatching-guide.bench.json` | M | 7 | 7 |
| `src/algorithms/graph-flow/maxBipartiteMatching/maxBipartiteMatching-guide.fig.tsx` | M | 537 | 0 |
| `src/algorithms/graph-flow/maxBipartiteMatching/maxBipartiteMatching-guide.md` | M | 1187 | 1040 |
| `src/algorithms/graph-flow/maxBipartiteMatching/maxBipartiteMatching-guide.proof.ts` | M | 1216 | 589 |
| `src/algorithms/graph-flow/maxBipartiteMatching/maxBipartiteMatching-guide.ref.ts` | M | 5 | 5 |
| `src/algorithms/graph-flow/maxBipartiteMatching/maxBipartiteMatching-guide.sim.ts` | M | 762 | 350 |
| `src/algorithms/graph-flow/maxBipartiteMatching/maxBipartiteMatching-guide.test.ts` | M | 30 | 1 |
| `src/algorithms/graph-flow/maxFlow/figs/alt-stair.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/maxFlow/figs/build-bfs-tree.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/maxFlow/figs/build-levels.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/maxFlow/figs/build-residual.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/maxFlow/figs/concept-levels.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/maxFlow/figs/concept-maxflow.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/maxFlow/figs/concept-network.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/maxFlow/figs/concept-residual.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/maxFlow/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/maxFlow/figs/origin-bridge.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/maxFlow/figs/related-mincut.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/maxFlow/figs/walk-film.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/maxFlow/figs/worst-stair.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/maxFlow/maxFlow-guide.alt.ts` | M | 2 | 2 |
| `src/algorithms/graph-flow/maxFlow/maxFlow-guide.bench.json` | M | 14 | 14 |
| `src/algorithms/graph-flow/maxFlow/maxFlow-guide.fig.tsx` | M | 582 | 0 |
| `src/algorithms/graph-flow/maxFlow/maxFlow-guide.md` | M | 1072 | 835 |
| `src/algorithms/graph-flow/maxFlow/maxFlow-guide.proof.ts` | M | 1939 | 415 |
| `src/algorithms/graph-flow/maxFlow/maxFlow-guide.sim.ts` | M | 990 | 274 |
| `src/algorithms/graph-flow/maxFlow/maxFlow-guide.test.ts` | M | 34 | 1 |
| `src/algorithms/graph-flow/minCostMaxFlow/figs/build-residual.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/minCostMaxFlow/figs/concept-network.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/minCostMaxFlow/figs/concept-residual.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/minCostMaxFlow/figs/concept-two-flows.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/minCostMaxFlow/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/minCostMaxFlow/figs/related-curve.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/minCostMaxFlow/figs/walk-film.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/minCostMaxFlow/minCostMaxFlow-guide.fig.tsx` | M | 440 | 0 |
| `src/algorithms/graph-flow/minCostMaxFlow/minCostMaxFlow-guide.md` | M | 1133 | 1021 |
| `src/algorithms/graph-flow/minCostMaxFlow/minCostMaxFlow-guide.proof.ts` | M | 1338 | 914 |
| `src/algorithms/graph-flow/minCostMaxFlow/minCostMaxFlow-guide.sim.ts` | M | 773 | 225 |
| `src/algorithms/graph-flow/minCostMaxFlow/minCostMaxFlow-guide.test.ts` | M | 33 | 0 |
| `src/algorithms/graph-flow/minCut/figs/build-cuts.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/minCut/figs/concept-cut.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/minCut/figs/concept-network.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/minCut/figs/concept-reach.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/minCut/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/minCut/figs/walk-film.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/minCut/figs/worst-stair.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/minCut/minCut-guide.fig.tsx` | M | 505 | 0 |
| `src/algorithms/graph-flow/minCut/minCut-guide.md` | M | 946 | 866 |
| `src/algorithms/graph-flow/minCut/minCut-guide.proof.ts` | M | 1544 | 1108 |
| `src/algorithms/graph-flow/minCut/minCut-guide.sim.ts` | M | 1336 | 369 |
| `src/algorithms/graph-flow/minCut/minCut-guide.test.ts` | M | 36 | 1 |
| `src/algorithms/graph-flow/primMst/figs/build-cut.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/primMst/figs/build-queue.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/primMst/figs/concept-cut.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/primMst/figs/concept-graph.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/primMst/figs/concept-mst.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/primMst/figs/invariant-cut.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/primMst/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/primMst/figs/walk-film.svg` | M | 26 | 0 |
| `src/algorithms/graph-flow/primMst/primMst-guide.alt.ts` | M | 6 | 6 |
| `src/algorithms/graph-flow/primMst/primMst-guide.bench.json` | M | 19 | 19 |
| `src/algorithms/graph-flow/primMst/primMst-guide.fig.tsx` | M | 470 | 0 |
| `src/algorithms/graph-flow/primMst/primMst-guide.md` | M | 1192 | 969 |
| `src/algorithms/graph-flow/primMst/primMst-guide.proof.ts` | M | 1777 | 552 |
| `src/algorithms/graph-flow/primMst/primMst-guide.sim.ts` | M | 695 | 269 |
| `src/algorithms/graph-flow/primMst/primMst-guide.test.ts` | M | 29 | 0 |
| `src/algorithms/graph/articulationPoints/articulationPoints-guide.fig.tsx` | M | 628 | 0 |
| `src/algorithms/graph/articulationPoints/articulationPoints-guide.md` | M | 1375 | 1169 |
| `src/algorithms/graph/articulationPoints/articulationPoints-guide.proof.ts` | M | 1794 | 866 |
| `src/algorithms/graph/articulationPoints/articulationPoints-guide.ref.ts` | M | 6 | 6 |
| `src/algorithms/graph/articulationPoints/articulationPoints-guide.sim.ts` | M | 1076 | 306 |
| `src/algorithms/graph/articulationPoints/articulationPoints-guide.test.ts` | M | 26 | 0 |
| `src/algorithms/graph/articulationPoints/figs/build-bfs-tree.svg` | M | 26 | 0 |
| `src/algorithms/graph/articulationPoints/figs/build-dfs-edges.svg` | M | 26 | 0 |
| `src/algorithms/graph/articulationPoints/figs/build-dfs-tree.svg` | M | 26 | 0 |
| `src/algorithms/graph/articulationPoints/figs/build-judge.svg` | M | 26 | 0 |
| `src/algorithms/graph/articulationPoints/figs/build-low-tree.svg` | M | 26 | 0 |
| `src/algorithms/graph/articulationPoints/figs/concept-cut.svg` | M | 26 | 0 |
| `src/algorithms/graph/articulationPoints/figs/concept-dfs-low.svg` | M | 26 | 0 |
| `src/algorithms/graph/articulationPoints/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/graph/articulationPoints/figs/related-blockcut.svg` | M | 26 | 0 |
| `src/algorithms/graph/articulationPoints/figs/walk-ap.svg` | M | 26 | 0 |
| `src/algorithms/graph/bfsShortestPath/bfsShortestPath-guide.fig.tsx` | M | 467 | 0 |
| `src/algorithms/graph/bfsShortestPath/bfsShortestPath-guide.md` | M | 646 | 582 |
| `src/algorithms/graph/bfsShortestPath/bfsShortestPath-guide.proof.ts` | M | 1215 | 200 |
| `src/algorithms/graph/bfsShortestPath/bfsShortestPath-guide.sim.ts` | M | 718 | 265 |
| `src/algorithms/graph/bfsShortestPath/bfsShortestPath-guide.test.ts` | M | 31 | 0 |
| `src/algorithms/graph/bfsShortestPath/figs/build-revisit.svg` | M | 26 | 0 |
| `src/algorithms/graph/bfsShortestPath/figs/concept-distance.svg` | M | 26 | 0 |
| `src/algorithms/graph/bfsShortestPath/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/graph/bfsShortestPath/figs/related-layers.svg` | M | 26 | 0 |
| `src/algorithms/graph/bfsShortestPath/figs/walk-bfs.svg` | M | 26 | 0 |
| `src/algorithms/graph/bfsShortestPath/figs/worst-shapes.svg` | M | 26 | 0 |
| `src/algorithms/graph/bridgesInGraph/bridgesInGraph-guide.alt.ts` | M | 1 | 1 |
| `src/algorithms/graph/bridgesInGraph/bridgesInGraph-guide.fig.tsx` | M | 532 | 0 |
| `src/algorithms/graph/bridgesInGraph/bridgesInGraph-guide.md` | M | 1402 | 1231 |
| `src/algorithms/graph/bridgesInGraph/bridgesInGraph-guide.proof.ts` | M | 2029 | 1371 |
| `src/algorithms/graph/bridgesInGraph/bridgesInGraph-guide.ref.ts` | M | 14 | 14 |
| `src/algorithms/graph/bridgesInGraph/bridgesInGraph-guide.sim.ts` | M | 1650 | 436 |
| `src/algorithms/graph/bridgesInGraph/bridgesInGraph-guide.test.ts` | M | 29 | 0 |
| `src/algorithms/graph/bridgesInGraph/figs/build-judge.svg` | M | 26 | 0 |
| `src/algorithms/graph/bridgesInGraph/figs/build-parallel.svg` | M | 26 | 0 |
| `src/algorithms/graph/bridgesInGraph/figs/concept-bridges.svg` | M | 26 | 0 |
| `src/algorithms/graph/bridgesInGraph/figs/concept-dfs-low.svg` | M | 26 | 0 |
| `src/algorithms/graph/bridgesInGraph/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/graph/bridgesInGraph/figs/walk-bridges.svg` | M | 26 | 0 |
| `src/algorithms/graph/connectedComponents/connectedComponents-guide.fig.tsx` | M | 460 | 0 |
| `src/algorithms/graph/connectedComponents/connectedComponents-guide.md` | M | 756 | 769 |
| `src/algorithms/graph/connectedComponents/connectedComponents-guide.proof.ts` | M | 1410 | 181 |
| `src/algorithms/graph/connectedComponents/connectedComponents-guide.sim.ts` | M | 978 | 322 |
| `src/algorithms/graph/connectedComponents/connectedComponents-guide.test.ts` | M | 24 | 0 |
| `src/algorithms/graph/connectedComponents/figs/build-skip.svg` | M | 26 | 0 |
| `src/algorithms/graph/connectedComponents/figs/concept-components.svg` | M | 26 | 0 |
| `src/algorithms/graph/connectedComponents/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/graph/connectedComponents/figs/related-forest.svg` | M | 26 | 0 |
| `src/algorithms/graph/connectedComponents/figs/walk-cc.svg` | M | 26 | 0 |
| `src/algorithms/graph/connectedComponents/figs/worst-shapes.svg` | M | 26 | 0 |
| `src/algorithms/graph/countIslands/countIslands-guide.alt.ts` | M | 2 | 2 |
| `src/algorithms/graph/countIslands/countIslands-guide.fig.tsx` | M | 545 | 0 |
| `src/algorithms/graph/countIslands/countIslands-guide.md` | M | 840 | 777 |
| `src/algorithms/graph/countIslands/countIslands-guide.proof.ts` | M | 1299 | 418 |
| `src/algorithms/graph/countIslands/countIslands-guide.ref.ts` | M | 5 | 5 |
| `src/algorithms/graph/countIslands/countIslands-guide.sim.ts` | M | 945 | 389 |
| `src/algorithms/graph/countIslands/countIslands-guide.test.ts` | M | 27 | 0 |
| `src/algorithms/graph/countIslands/figs/build-diagonal.svg` | M | 26 | 0 |
| `src/algorithms/graph/countIslands/figs/build-grid-graph.svg` | M | 26 | 0 |
| `src/algorithms/graph/countIslands/figs/build-skip.svg` | M | 26 | 0 |
| `src/algorithms/graph/countIslands/figs/concept-grid.svg` | M | 26 | 0 |
| `src/algorithms/graph/countIslands/figs/concept-neighbours.svg` | M | 26 | 0 |
| `src/algorithms/graph/countIslands/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/graph/countIslands/figs/origin-u-shape.svg` | M | 26 | 0 |
| `src/algorithms/graph/countIslands/figs/walk-islands.svg` | M | 26 | 0 |
| `src/algorithms/graph/countIslands/figs/worst-stack.svg` | M | 26 | 0 |
| `src/algorithms/graph/dfsAllPaths/dfsAllPaths-guide.fig.tsx` | M | 456 | 0 |
| `src/algorithms/graph/dfsAllPaths/dfsAllPaths-guide.md` | M | 982 | 826 |
| `src/algorithms/graph/dfsAllPaths/dfsAllPaths-guide.proof.ts` | M | 1706 | 490 |
| `src/algorithms/graph/dfsAllPaths/dfsAllPaths-guide.sim.ts` | M | 1170 | 415 |
| `src/algorithms/graph/dfsAllPaths/dfsAllPaths-guide.test.ts` | M | 121 | 78 |
| `src/algorithms/graph/dfsAllPaths/figs/alt-trap.svg` | M | 26 | 0 |
| `src/algorithms/graph/dfsAllPaths/figs/build-tree.svg` | M | 26 | 0 |
| `src/algorithms/graph/dfsAllPaths/figs/concept-paths.svg` | M | 26 | 0 |
| `src/algorithms/graph/dfsAllPaths/figs/math-grid.svg` | M | 26 | 0 |
| `src/algorithms/graph/dfsAllPaths/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/graph/dfsAllPaths/figs/walk-paths.svg` | M | 26 | 0 |
| `src/algorithms/graph/dfsTraversal/dfsTraversal-guide.fig.tsx` | M | 423 | 0 |
| `src/algorithms/graph/dfsTraversal/dfsTraversal-guide.md` | M | 821 | 680 |
| `src/algorithms/graph/dfsTraversal/dfsTraversal-guide.proof.ts` | M | 1591 | 332 |
| `src/algorithms/graph/dfsTraversal/dfsTraversal-guide.sim.ts` | M | 663 | 307 |
| `src/algorithms/graph/dfsTraversal/dfsTraversal-guide.test.ts` | M | 28 | 0 |
| `src/algorithms/graph/dfsTraversal/figs/build-segments.svg` | M | 26 | 0 |
| `src/algorithms/graph/dfsTraversal/figs/concept-order.svg` | M | 26 | 0 |
| `src/algorithms/graph/dfsTraversal/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/graph/dfsTraversal/figs/walk-dfs.svg` | M | 26 | 0 |
| `src/algorithms/graph/dfsTraversal/figs/worst-shapes.svg` | M | 26 | 0 |
| `src/algorithms/graph/directedCycleDetection/directedCycleDetection-guide.fig.tsx` | M | 423 | 0 |
| `src/algorithms/graph/directedCycleDetection/directedCycleDetection-guide.md` | M | 943 | 791 |
| `src/algorithms/graph/directedCycleDetection/directedCycleDetection-guide.proof.ts` | M | 1657 | 541 |
| `src/algorithms/graph/directedCycleDetection/directedCycleDetection-guide.sim.ts` | M | 842 | 372 |
| `src/algorithms/graph/directedCycleDetection/directedCycleDetection-guide.test.ts` | M | 27 | 0 |
| `src/algorithms/graph/directedCycleDetection/figs/build-colors.svg` | M | 26 | 0 |
| `src/algorithms/graph/directedCycleDetection/figs/concept-colors.svg` | M | 26 | 0 |
| `src/algorithms/graph/directedCycleDetection/figs/concept-graph.svg` | M | 26 | 0 |
| `src/algorithms/graph/directedCycleDetection/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/graph/directedCycleDetection/figs/origin-diamonds.svg` | M | 26 | 0 |
| `src/algorithms/graph/directedCycleDetection/figs/related-edge-kinds.svg` | M | 26 | 0 |
| `src/algorithms/graph/directedCycleDetection/figs/walk-film.svg` | M | 26 | 0 |
| `src/algorithms/graph/directedCycleDetection/figs/worst-shapes.svg` | M | 26 | 0 |
| `src/algorithms/graph/stronglyConnectedComponents/figs/build-cut.svg` | M | 26 | 0 |
| `src/algorithms/graph/stronglyConnectedComponents/figs/build-dfs-edges.svg` | M | 26 | 0 |
| `src/algorithms/graph/stronglyConnectedComponents/figs/build-dfs-tree.svg` | M | 26 | 0 |
| `src/algorithms/graph/stronglyConnectedComponents/figs/build-low-tree.svg` | M | 26 | 0 |
| `src/algorithms/graph/stronglyConnectedComponents/figs/concept-dfs-low.svg` | M | 26 | 0 |
| `src/algorithms/graph/stronglyConnectedComponents/figs/concept-scc.svg` | M | 26 | 0 |
| `src/algorithms/graph/stronglyConnectedComponents/figs/math-low-terms.svg` | M | 26 | 0 |
| `src/algorithms/graph/stronglyConnectedComponents/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/graph/stronglyConnectedComponents/figs/related-condensation.svg` | M | 26 | 0 |
| `src/algorithms/graph/stronglyConnectedComponents/figs/walk-first.svg` | M | 26 | 0 |
| `src/algorithms/graph/stronglyConnectedComponents/figs/walk-second.svg` | M | 26 | 0 |
| `src/algorithms/graph/stronglyConnectedComponents/stronglyConnectedComponents-guide.fig.tsx` | M | 605 | 0 |
| `src/algorithms/graph/stronglyConnectedComponents/stronglyConnectedComponents-guide.md` | M | 1206 | 1051 |
| `src/algorithms/graph/stronglyConnectedComponents/stronglyConnectedComponents-guide.proof.ts` | M | 1223 | 560 |
| `src/algorithms/graph/stronglyConnectedComponents/stronglyConnectedComponents-guide.sim.ts` | M | 1281 | 382 |
| `src/algorithms/graph/stronglyConnectedComponents/stronglyConnectedComponents-guide.test.ts` | M | 35 | 0 |
| `src/algorithms/graph/topologicalSort/figs/build-remove.svg` | M | 26 | 0 |
| `src/algorithms/graph/topologicalSort/figs/concept-graph.svg` | M | 26 | 0 |
| `src/algorithms/graph/topologicalSort/figs/concept-indegree.svg` | M | 26 | 0 |
| `src/algorithms/graph/topologicalSort/figs/concept-order.svg` | M | 26 | 0 |
| `src/algorithms/graph/topologicalSort/figs/invariant-state.svg` | M | 26 | 0 |
| `src/algorithms/graph/topologicalSort/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/graph/topologicalSort/figs/walk-topo.svg` | M | 26 | 0 |
| `src/algorithms/graph/topologicalSort/figs/worst-shapes.svg` | M | 26 | 0 |
| `src/algorithms/graph/topologicalSort/topologicalSort-guide.fig.tsx` | M | 481 | 0 |
| `src/algorithms/graph/topologicalSort/topologicalSort-guide.md` | M | 902 | 801 |
| `src/algorithms/graph/topologicalSort/topologicalSort-guide.proof.ts` | M | 1357 | 334 |
| `src/algorithms/graph/topologicalSort/topologicalSort-guide.ref.ts` | M | 17 | 17 |
| `src/algorithms/graph/topologicalSort/topologicalSort-guide.sim.ts` | M | 576 | 234 |
| `src/algorithms/graph/topologicalSort/topologicalSort-guide.test.ts` | M | 30 | 0 |
| `src/algorithms/graph/undirectedCycleDetection/figs/build-tree.svg` | M | 26 | 0 |
| `src/algorithms/graph/undirectedCycleDetection/figs/concept-graph.svg` | M | 26 | 0 |
| `src/algorithms/graph/undirectedCycleDetection/figs/concept-tree.svg` | M | 26 | 0 |
| `src/algorithms/graph/undirectedCycleDetection/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/graph/undirectedCycleDetection/figs/related-extra.svg` | M | 26 | 0 |
| `src/algorithms/graph/undirectedCycleDetection/figs/walk-film.svg` | M | 26 | 0 |
| `src/algorithms/graph/undirectedCycleDetection/undirectedCycleDetection-guide.alt.ts` | M | 8 | 8 |
| `src/algorithms/graph/undirectedCycleDetection/undirectedCycleDetection-guide.bench.json` | M | 16 | 16 |
| `src/algorithms/graph/undirectedCycleDetection/undirectedCycleDetection-guide.fig.tsx` | M | 370 | 0 |
| `src/algorithms/graph/undirectedCycleDetection/undirectedCycleDetection-guide.md` | M | 1034 | 826 |
| `src/algorithms/graph/undirectedCycleDetection/undirectedCycleDetection-guide.proof.ts` | M | 1950 | 485 |
| `src/algorithms/graph/undirectedCycleDetection/undirectedCycleDetection-guide.ref.ts` | M | 1 | 1 |
| `src/algorithms/graph/undirectedCycleDetection/undirectedCycleDetection-guide.sim.ts` | M | 622 | 247 |
| `src/algorithms/graph/undirectedCycleDetection/undirectedCycleDetection-guide.test.ts` | M | 26 | 0 |
| `src/algorithms/graph/zeroOneBfs/figs/build-groups.svg` | M | 26 | 0 |
| `src/algorithms/graph/zeroOneBfs/figs/concept-graph.svg` | M | 26 | 0 |
| `src/algorithms/graph/zeroOneBfs/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/graph/zeroOneBfs/figs/related-relabel.svg` | M | 26 | 0 |
| `src/algorithms/graph/zeroOneBfs/figs/walk-zero-one-bfs.svg` | M | 26 | 0 |
| `src/algorithms/graph/zeroOneBfs/zeroOneBfs-guide.alt.ts` | M | 7 | 3 |
| `src/algorithms/graph/zeroOneBfs/zeroOneBfs-guide.fig.tsx` | M | 421 | 0 |
| `src/algorithms/graph/zeroOneBfs/zeroOneBfs-guide.md` | M | 980 | 753 |
| `src/algorithms/graph/zeroOneBfs/zeroOneBfs-guide.proof.ts` | M | 1814 | 652 |
| `src/algorithms/graph/zeroOneBfs/zeroOneBfs-guide.ref.ts` | M | 2 | 2 |
| `src/algorithms/graph/zeroOneBfs/zeroOneBfs-guide.sim.ts` | M | 747 | 265 |
| `src/algorithms/graph/zeroOneBfs/zeroOneBfs-guide.test.ts` | M | 30 | 0 |
| `src/algorithms/number-theory/babyStepGiantStep/babyStepGiantStep-guide.alt.ts` | M | 2 | 2 |
| `src/algorithms/number-theory/babyStepGiantStep/babyStepGiantStep-guide.bench.json` | M | 2 | 2 |
| `src/algorithms/number-theory/babyStepGiantStep/babyStepGiantStep-guide.fig.tsx` | M | 846 | 0 |
| `src/algorithms/number-theory/babyStepGiantStep/babyStepGiantStep-guide.md` | M | 801 | 608 |
| `src/algorithms/number-theory/babyStepGiantStep/babyStepGiantStep-guide.proof.ts` | M | 1083 | 0 |
| `src/algorithms/number-theory/babyStepGiantStep/babyStepGiantStep-guide.ref.ts` | M | 5 | 0 |
| `src/algorithms/number-theory/babyStepGiantStep/babyStepGiantStep-guide.sim.ts` | M | 346 | 69 |
| `src/algorithms/number-theory/babyStepGiantStep/babyStepGiantStep-guide.test.ts` | M | 17 | 1 |
| `src/algorithms/number-theory/babyStepGiantStep/figs/build-dup.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/babyStepGiantStep/figs/concept-grid.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/babyStepGiantStep/figs/concept-table.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/babyStepGiantStep/figs/invariant-blocks.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/babyStepGiantStep/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/babyStepGiantStep/figs/related-meet.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/babyStepGiantStep/figs/walk-trace.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/binomialModP/binomialModP-guide.alt.ts` | M | 29 | 28 |
| `src/algorithms/number-theory/binomialModP/binomialModP-guide.bench.json` | M | 15 | 15 |
| `src/algorithms/number-theory/binomialModP/binomialModP-guide.fig.tsx` | M | 935 | 0 |
| `src/algorithms/number-theory/binomialModP/binomialModP-guide.md` | M | 957 | 864 |
| `src/algorithms/number-theory/binomialModP/binomialModP-guide.proof.ts` | M | 1131 | 531 |
| `src/algorithms/number-theory/binomialModP/binomialModP-guide.sim.ts` | M | 263 | 108 |
| `src/algorithms/number-theory/binomialModP/binomialModP-guide.test.ts` | M | 17 | 2 |
| `src/algorithms/number-theory/binomialModP/figs/build-digits.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/binomialModP/figs/build-factors.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/binomialModP/figs/build-inverse.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/binomialModP/figs/concept-digits.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/binomialModP/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/binomialModP/figs/walk-run.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/crt/crt-guide.alt.ts` | M | 56 | 102 |
| `src/algorithms/number-theory/crt/crt-guide.bench.json` | M | 11 | 16 |
| `src/algorithms/number-theory/crt/crt-guide.fig.tsx` | M | 752 | 0 |
| `src/algorithms/number-theory/crt/crt-guide.md` | M | 936 | 832 |
| `src/algorithms/number-theory/crt/crt-guide.proof.ts` | M | 1689 | 1007 |
| `src/algorithms/number-theory/crt/crt-guide.ref.ts` | M | 4 | 4 |
| `src/algorithms/number-theory/crt/crt-guide.sim.ts` | M | 283 | 148 |
| `src/algorithms/number-theory/crt/crt-guide.test.ts` | M | 18 | 0 |
| `src/algorithms/number-theory/crt/figs/build-cumulative.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/crt/figs/concept-pair.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/crt/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/crt/figs/walk-merge.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/extendedEuclidean/extendedEuclidean-guide.alt.ts` | M | 2 | 2 |
| `src/algorithms/number-theory/extendedEuclidean/extendedEuclidean-guide.fig.tsx` | M | 700 | 0 |
| `src/algorithms/number-theory/extendedEuclidean/extendedEuclidean-guide.md` | M | 895 | 737 |
| `src/algorithms/number-theory/extendedEuclidean/extendedEuclidean-guide.proof.ts` | M | 1187 | 452 |
| `src/algorithms/number-theory/extendedEuclidean/extendedEuclidean-guide.sim.ts` | M | 254 | 105 |
| `src/algorithms/number-theory/extendedEuclidean/extendedEuclidean-guide.test.ts` | M | 18 | 2 |
| `src/algorithms/number-theory/extendedEuclidean/figs/build-neighbors.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/extendedEuclidean/figs/concept-chain.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/extendedEuclidean/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/extendedEuclidean/figs/walk-run.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/extendedEuclidean/figs/worst-fib.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/fastPower/fastPower-guide.alt.ts` | M | 12 | 6 |
| `src/algorithms/number-theory/fastPower/fastPower-guide.bench.json` | M | 8 | 7 |
| `src/algorithms/number-theory/fastPower/fastPower-guide.fig.tsx` | M | 513 | 0 |
| `src/algorithms/number-theory/fastPower/fastPower-guide.md` | M | 808 | 866 |
| `src/algorithms/number-theory/fastPower/fastPower-guide.proof.ts` | M | 900 | 401 |
| `src/algorithms/number-theory/fastPower/fastPower-guide.sim.ts` | M | 208 | 103 |
| `src/algorithms/number-theory/fastPower/fastPower-guide.test.ts` | M | 15 | 0 |
| `src/algorithms/number-theory/fastPower/figs/build-powers.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/fastPower/figs/concept-bits.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/fastPower/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/fastPower/figs/walk-run.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/fftMultiply/fftMultiply-guide.alt.ts` | M | 5 | 5 |
| `src/algorithms/number-theory/fftMultiply/fftMultiply-guide.bench.json` | M | 9 | 9 |
| `src/algorithms/number-theory/fftMultiply/fftMultiply-guide.fig.tsx` | M | 994 | 0 |
| `src/algorithms/number-theory/fftMultiply/fftMultiply-guide.md` | M | 1178 | 1241 |
| `src/algorithms/number-theory/fftMultiply/fftMultiply-guide.proof.ts` | M | 1254 | 1015 |
| `src/algorithms/number-theory/fftMultiply/fftMultiply-guide.ref.ts` | M | 1 | 1 |
| `src/algorithms/number-theory/fftMultiply/fftMultiply-guide.sim.ts` | M | 422 | 115 |
| `src/algorithms/number-theory/fftMultiply/fftMultiply-guide.test.ts` | M | 17 | 0 |
| `src/algorithms/number-theory/fftMultiply/figs/build-layers.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/fftMultiply/figs/build-roots.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/fftMultiply/figs/concept-roundtrip.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/fftMultiply/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/fftMultiply/figs/walk-run.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/gcd/figs/concept-chain.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/gcd/figs/concept-divisors.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/gcd/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/gcd/figs/walk-run.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/gcd/figs/worst-fib.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/gcd/gcd-guide.fig.tsx` | M | 556 | 0 |
| `src/algorithms/number-theory/gcd/gcd-guide.md` | M | 825 | 655 |
| `src/algorithms/number-theory/gcd/gcd-guide.proof.ts` | M | 1047 | 323 |
| `src/algorithms/number-theory/gcd/gcd-guide.sim.ts` | M | 163 | 106 |
| `src/algorithms/number-theory/gcd/gcd-guide.test.ts` | M | 15 | 0 |
| `src/algorithms/number-theory/isPrimeTrial/figs/build-wheel.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/isPrimeTrial/figs/concept-pairs.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/isPrimeTrial/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/isPrimeTrial/figs/walk-trial.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/isPrimeTrial/isPrimeTrial-guide.alt.ts` | M | 57 | 48 |
| `src/algorithms/number-theory/isPrimeTrial/isPrimeTrial-guide.bench.json` | M | 18 | 18 |
| `src/algorithms/number-theory/isPrimeTrial/isPrimeTrial-guide.fig.tsx` | M | 613 | 0 |
| `src/algorithms/number-theory/isPrimeTrial/isPrimeTrial-guide.md` | M | 825 | 787 |
| `src/algorithms/number-theory/isPrimeTrial/isPrimeTrial-guide.proof.ts` | M | 1014 | 619 |
| `src/algorithms/number-theory/isPrimeTrial/isPrimeTrial-guide.sim.ts` | M | 212 | 120 |
| `src/algorithms/number-theory/isPrimeTrial/isPrimeTrial-guide.test.ts` | M | 14 | 0 |
| `src/algorithms/number-theory/millerRabin/figs/build-sequence.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/millerRabin/figs/concept-sequence.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/millerRabin/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/millerRabin/figs/walk-run.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/millerRabin/millerRabin-guide.alt.ts` | M | 50 | 38 |
| `src/algorithms/number-theory/millerRabin/millerRabin-guide.bench.json` | M | 13 | 11 |
| `src/algorithms/number-theory/millerRabin/millerRabin-guide.fig.tsx` | M | 812 | 0 |
| `src/algorithms/number-theory/millerRabin/millerRabin-guide.md` | M | 1158 | 971 |
| `src/algorithms/number-theory/millerRabin/millerRabin-guide.proof.ts` | M | 1433 | 832 |
| `src/algorithms/number-theory/millerRabin/millerRabin-guide.ref.ts` | M | 3 | 3 |
| `src/algorithms/number-theory/millerRabin/millerRabin-guide.sim.ts` | M | 676 | 121 |
| `src/algorithms/number-theory/millerRabin/millerRabin-guide.test.ts` | M | 15 | 2 |
| `src/algorithms/number-theory/pollardRho/figs/build-floyd.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/pollardRho/figs/build-rho.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/pollardRho/figs/concept-rho.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/pollardRho/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/pollardRho/figs/walk-run.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/pollardRho/pollardRho-guide.alt.ts` | M | 17 | 9 |
| `src/algorithms/number-theory/pollardRho/pollardRho-guide.bench.json` | M | 6 | 6 |
| `src/algorithms/number-theory/pollardRho/pollardRho-guide.fig.tsx` | M | 869 | 0 |
| `src/algorithms/number-theory/pollardRho/pollardRho-guide.md` | M | 1000 | 962 |
| `src/algorithms/number-theory/pollardRho/pollardRho-guide.proof.ts` | M | 1243 | 1043 |
| `src/algorithms/number-theory/pollardRho/pollardRho-guide.ref.ts` | M | 3 | 3 |
| `src/algorithms/number-theory/pollardRho/pollardRho-guide.sim.ts` | M | 209 | 106 |
| `src/algorithms/number-theory/pollardRho/pollardRho-guide.test.ts` | M | 19 | 6 |
| `src/algorithms/number-theory/sieveOfEratosthenes/figs/concept-sieve.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/sieveOfEratosthenes/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/sieveOfEratosthenes/figs/walk-sieve.svg` | M | 26 | 0 |
| `src/algorithms/number-theory/sieveOfEratosthenes/sieveOfEratosthenes-guide.alt.ts` | M | 30 | 26 |
| `src/algorithms/number-theory/sieveOfEratosthenes/sieveOfEratosthenes-guide.bench.json` | M | 14 | 14 |
| `src/algorithms/number-theory/sieveOfEratosthenes/sieveOfEratosthenes-guide.fig.tsx` | M | 493 | 0 |
| `src/algorithms/number-theory/sieveOfEratosthenes/sieveOfEratosthenes-guide.md` | M | 847 | 809 |
| `src/algorithms/number-theory/sieveOfEratosthenes/sieveOfEratosthenes-guide.proof.ts` | M | 1318 | 811 |
| `src/algorithms/number-theory/sieveOfEratosthenes/sieveOfEratosthenes-guide.ref.ts` | M | 9 | 9 |
| `src/algorithms/number-theory/sieveOfEratosthenes/sieveOfEratosthenes-guide.sim.ts` | M | 532 | 145 |
| `src/algorithms/number-theory/sieveOfEratosthenes/sieveOfEratosthenes-guide.test.ts` | M | 18 | 1 |
| `src/algorithms/shortest-path/aStarSearch/aStarSearch-guide.alt.ts` | M | 4 | 4 |
| `src/algorithms/shortest-path/aStarSearch/aStarSearch-guide.fig.tsx` | M | 499 | 0 |
| `src/algorithms/shortest-path/aStarSearch/aStarSearch-guide.md` | M | 1241 | 955 |
| `src/algorithms/shortest-path/aStarSearch/aStarSearch-guide.proof.ts` | M | 1942 | 1346 |
| `src/algorithms/shortest-path/aStarSearch/aStarSearch-guide.ref.ts` | M | 1 | 1 |
| `src/algorithms/shortest-path/aStarSearch/aStarSearch-guide.sim.ts` | M | 852 | 317 |
| `src/algorithms/shortest-path/aStarSearch/aStarSearch-guide.test.ts` | M | 43 | 0 |
| `src/algorithms/shortest-path/aStarSearch/figs/build-admissible.svg` | M | 26 | 0 |
| `src/algorithms/shortest-path/aStarSearch/figs/build-over.svg` | M | 26 | 0 |
| `src/algorithms/shortest-path/aStarSearch/figs/build-queue.svg` | M | 26 | 0 |
| `src/algorithms/shortest-path/aStarSearch/figs/concept-graph.svg` | M | 26 | 0 |
| `src/algorithms/shortest-path/aStarSearch/figs/concept-grid.svg` | M | 26 | 0 |
| `src/algorithms/shortest-path/aStarSearch/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/shortest-path/aStarSearch/figs/walk-astar.svg` | M | 26 | 0 |
| `src/algorithms/shortest-path/bellmanFord/bellmanFord-guide.alt.ts` | M | 24 | 18 |
| `src/algorithms/shortest-path/bellmanFord/bellmanFord-guide.bench.json` | M | 2 | 2 |
| `src/algorithms/shortest-path/bellmanFord/bellmanFord-guide.fig.tsx` | M | 484 | 0 |
| `src/algorithms/shortest-path/bellmanFord/bellmanFord-guide.md` | M | 994 | 793 |
| `src/algorithms/shortest-path/bellmanFord/bellmanFord-guide.proof.ts` | M | 1606 | 530 |
| `src/algorithms/shortest-path/bellmanFord/bellmanFord-guide.ref.ts` | M | 3 | 3 |
| `src/algorithms/shortest-path/bellmanFord/bellmanFord-guide.sim.ts` | M | 814 | 271 |
| `src/algorithms/shortest-path/bellmanFord/bellmanFord-guide.test.ts` | M | 41 | 3 |
| `src/algorithms/shortest-path/bellmanFord/figs/build-layers.svg` | M | 26 | 0 |
| `src/algorithms/shortest-path/bellmanFord/figs/concept-cycle.svg` | M | 26 | 0 |
| `src/algorithms/shortest-path/bellmanFord/figs/concept-graph.svg` | M | 26 | 0 |
| `src/algorithms/shortest-path/bellmanFord/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/shortest-path/bellmanFord/figs/walk-bellman-ford.svg` | M | 26 | 0 |
| `src/algorithms/shortest-path/dagShortestPath/dagShortestPath-guide.alt.ts` | M | 7 | 7 |
| `src/algorithms/shortest-path/dagShortestPath/dagShortestPath-guide.fig.tsx` | M | 434 | 0 |
| `src/algorithms/shortest-path/dagShortestPath/dagShortestPath-guide.md` | M | 995 | 879 |
| `src/algorithms/shortest-path/dagShortestPath/dagShortestPath-guide.proof.ts` | M | 2010 | 732 |
| `src/algorithms/shortest-path/dagShortestPath/dagShortestPath-guide.ref.ts` | M | 21 | 20 |
| `src/algorithms/shortest-path/dagShortestPath/dagShortestPath-guide.sim.ts` | M | 707 | 326 |
| `src/algorithms/shortest-path/dagShortestPath/dagShortestPath-guide.test.ts` | M | 35 | 0 |
| `src/algorithms/shortest-path/dagShortestPath/figs/build-turn.svg` | M | 26 | 0 |
| `src/algorithms/shortest-path/dagShortestPath/figs/concept-graph.svg` | M | 26 | 0 |
| `src/algorithms/shortest-path/dagShortestPath/figs/concept-order.svg` | M | 26 | 0 |
| `src/algorithms/shortest-path/dagShortestPath/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/shortest-path/dagShortestPath/figs/walk-dag.svg` | M | 26 | 0 |
| `src/algorithms/shortest-path/dijkstra/dijkstra-guide.fig.tsx` | M | 449 | 0 |
| `src/algorithms/shortest-path/dijkstra/dijkstra-guide.md` | M | 969 | 820 |
| `src/algorithms/shortest-path/dijkstra/dijkstra-guide.proof.ts` | M | 1634 | 568 |
| `src/algorithms/shortest-path/dijkstra/dijkstra-guide.sim.ts` | M | 720 | 254 |
| `src/algorithms/shortest-path/dijkstra/dijkstra-guide.test.ts` | M | 35 | 0 |
| `src/algorithms/shortest-path/dijkstra/figs/build-relax.svg` | M | 26 | 0 |
| `src/algorithms/shortest-path/dijkstra/figs/build-settle.svg` | M | 26 | 0 |
| `src/algorithms/shortest-path/dijkstra/figs/concept-graph.svg` | M | 26 | 0 |
| `src/algorithms/shortest-path/dijkstra/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/shortest-path/dijkstra/figs/related-prefix.svg` | M | 26 | 0 |
| `src/algorithms/shortest-path/dijkstra/figs/walk-dijkstra.svg` | M | 26 | 0 |
| `src/algorithms/shortest-path/floydWarshall/figs/build-layers.svg` | M | 26 | 0 |
| `src/algorithms/shortest-path/floydWarshall/figs/concept-graph.svg` | M | 26 | 0 |
| `src/algorithms/shortest-path/floydWarshall/figs/concept-matrix.svg` | M | 26 | 0 |
| `src/algorithms/shortest-path/floydWarshall/figs/concept-relax.svg` | M | 26 | 0 |
| `src/algorithms/shortest-path/floydWarshall/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/shortest-path/floydWarshall/figs/pause-loop-order.svg` | M | 26 | 0 |
| `src/algorithms/shortest-path/floydWarshall/figs/walk-floyd.svg` | M | 26 | 0 |
| `src/algorithms/shortest-path/floydWarshall/floydWarshall-guide.fig.tsx` | M | 490 | 0 |
| `src/algorithms/shortest-path/floydWarshall/floydWarshall-guide.md` | M | 1027 | 976 |
| `src/algorithms/shortest-path/floydWarshall/floydWarshall-guide.proof.ts` | M | 1371 | 736 |
| `src/algorithms/shortest-path/floydWarshall/floydWarshall-guide.ref.ts` | M | 1 | 1 |
| `src/algorithms/shortest-path/floydWarshall/floydWarshall-guide.sim.ts` | M | 231 | 156 |
| `src/algorithms/shortest-path/floydWarshall/floydWarshall-guide.test.ts` | M | 41 | 0 |
| `src/algorithms/shortest-path/spfa/figs/build-waves.svg` | M | 26 | 0 |
| `src/algorithms/shortest-path/spfa/figs/concept-graph.svg` | M | 26 | 0 |
| `src/algorithms/shortest-path/spfa/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/shortest-path/spfa/figs/walk-spfa.svg` | M | 26 | 0 |
| `src/algorithms/shortest-path/spfa/spfa-guide.alt.ts` | M | 38 | 28 |
| `src/algorithms/shortest-path/spfa/spfa-guide.bench.json` | M | 17 | 17 |
| `src/algorithms/shortest-path/spfa/spfa-guide.fig.tsx` | M | 461 | 0 |
| `src/algorithms/shortest-path/spfa/spfa-guide.md` | M | 1092 | 962 |
| `src/algorithms/shortest-path/spfa/spfa-guide.proof.ts` | M | 2001 | 903 |
| `src/algorithms/shortest-path/spfa/spfa-guide.ref.ts` | M | 7 | 6 |
| `src/algorithms/shortest-path/spfa/spfa-guide.sim.ts` | M | 999 | 307 |
| `src/algorithms/shortest-path/spfa/spfa-guide.test.ts` | M | 37 | 3 |
| `src/algorithms/sorting/countingSort/countingSort-guide.alt.ts` | M | 10 | 10 |
| `src/algorithms/sorting/countingSort/countingSort-guide.bench.json` | M | 8 | 8 |
| `src/algorithms/sorting/countingSort/countingSort-guide.fig.tsx` | M | 463 | 0 |
| `src/algorithms/sorting/countingSort/countingSort-guide.md` | M | 716 | 749 |
| `src/algorithms/sorting/countingSort/countingSort-guide.proof.ts` | M | 843 | 412 |
| `src/algorithms/sorting/countingSort/countingSort-guide.ref.ts` | M | 8 | 8 |
| `src/algorithms/sorting/countingSort/countingSort-guide.sim.ts` | M | 587 | 224 |
| `src/algorithms/sorting/countingSort/countingSort-guide.test.ts` | M | 18 | 0 |
| `src/algorithms/sorting/countingSort/figs/concept-count.svg` | M | 26 | 0 |
| `src/algorithms/sorting/countingSort/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/sorting/countingSort/figs/walk-count.svg` | M | 26 | 0 |
| `src/algorithms/sorting/externalMergeSort/externalMergeSort-guide.alt.ts` | M | 74 | 74 |
| `src/algorithms/sorting/externalMergeSort/externalMergeSort-guide.bench.json` | M | 8 | 8 |
| `src/algorithms/sorting/externalMergeSort/externalMergeSort-guide.fig.tsx` | M | 457 | 0 |
| `src/algorithms/sorting/externalMergeSort/externalMergeSort-guide.md` | M | 870 | 842 |
| `src/algorithms/sorting/externalMergeSort/externalMergeSort-guide.proof.ts` | M | 1531 | 648 |
| `src/algorithms/sorting/externalMergeSort/externalMergeSort-guide.ref.ts` | M | 13 | 13 |
| `src/algorithms/sorting/externalMergeSort/externalMergeSort-guide.sim.ts` | M | 542 | 227 |
| `src/algorithms/sorting/externalMergeSort/externalMergeSort-guide.test.ts` | M | 25 | 6 |
| `src/algorithms/sorting/externalMergeSort/figs/build-runs-cover.svg` | M | 26 | 0 |
| `src/algorithms/sorting/externalMergeSort/figs/concept-runs.svg` | M | 26 | 0 |
| `src/algorithms/sorting/externalMergeSort/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/sorting/externalMergeSort/figs/walk-merge-film.svg` | M | 26 | 0 |
| `src/algorithms/sorting/externalMergeSort/figs/walk-runs-film.svg` | M | 26 | 0 |
| `src/algorithms/sorting/insertionSort/figs/concept-grow.svg` | M | 26 | 0 |
| `src/algorithms/sorting/insertionSort/figs/concept-insert.svg` | M | 26 | 0 |
| `src/algorithms/sorting/insertionSort/figs/invariant-split.svg` | M | 26 | 0 |
| `src/algorithms/sorting/insertionSort/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/sorting/insertionSort/figs/walk-insert.svg` | M | 26 | 0 |
| `src/algorithms/sorting/insertionSort/insertionSort-guide.alt.ts` | M | 11 | 8 |
| `src/algorithms/sorting/insertionSort/insertionSort-guide.bench.json` | M | 8 | 8 |
| `src/algorithms/sorting/insertionSort/insertionSort-guide.fig.tsx` | M | 829 | 0 |
| `src/algorithms/sorting/insertionSort/insertionSort-guide.md` | M | 838 | 779 |
| `src/algorithms/sorting/insertionSort/insertionSort-guide.proof.ts` | M | 1371 | 384 |
| `src/algorithms/sorting/insertionSort/insertionSort-guide.ref.ts` | M | 2 | 2 |
| `src/algorithms/sorting/insertionSort/insertionSort-guide.sim.ts` | M | 703 | 49 |
| `src/algorithms/sorting/insertionSort/insertionSort-guide.test.ts` | M | 21 | 3 |
| `src/algorithms/sorting/kthSmallest/figs/build-discard.svg` | M | 26 | 0 |
| `src/algorithms/sorting/kthSmallest/figs/build-partition.svg` | M | 26 | 0 |
| `src/algorithms/sorting/kthSmallest/figs/concept-rounds.svg` | M | 26 | 0 |
| `src/algorithms/sorting/kthSmallest/figs/invariant-range.svg` | M | 26 | 0 |
| `src/algorithms/sorting/kthSmallest/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/sorting/kthSmallest/figs/origin-half-cut.svg` | M | 26 | 0 |
| `src/algorithms/sorting/kthSmallest/figs/walk-select.svg` | M | 26 | 0 |
| `src/algorithms/sorting/kthSmallest/figs/worst-rounds.svg` | M | 26 | 0 |
| `src/algorithms/sorting/kthSmallest/kthSmallest-guide.alt.ts` | M | 19 | 8 |
| `src/algorithms/sorting/kthSmallest/kthSmallest-guide.bench.json` | M | 6 | 6 |
| `src/algorithms/sorting/kthSmallest/kthSmallest-guide.fig.tsx` | M | 847 | 0 |
| `src/algorithms/sorting/kthSmallest/kthSmallest-guide.md` | M | 793 | 682 |
| `src/algorithms/sorting/kthSmallest/kthSmallest-guide.proof.ts` | M | 1036 | 307 |
| `src/algorithms/sorting/kthSmallest/kthSmallest-guide.sim.ts` | M | 526 | 46 |
| `src/algorithms/sorting/kthSmallest/kthSmallest-guide.test.ts` | M | 16 | 1 |
| `src/algorithms/sorting/medianFromDataStream/figs/build-two-heaps.svg` | M | 26 | 0 |
| `src/algorithms/sorting/medianFromDataStream/figs/concept-halves.svg` | M | 26 | 0 |
| `src/algorithms/sorting/medianFromDataStream/figs/invariant-boundary.svg` | M | 26 | 0 |
| `src/algorithms/sorting/medianFromDataStream/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/sorting/medianFromDataStream/figs/walk-median.svg` | M | 26 | 0 |
| `src/algorithms/sorting/medianFromDataStream/medianFromDataStream-guide.alt.ts` | M | 7 | 7 |
| `src/algorithms/sorting/medianFromDataStream/medianFromDataStream-guide.bench.json` | M | 2 | 2 |
| `src/algorithms/sorting/medianFromDataStream/medianFromDataStream-guide.fig.tsx` | M | 396 | 0 |
| `src/algorithms/sorting/medianFromDataStream/medianFromDataStream-guide.md` | M | 871 | 736 |
| `src/algorithms/sorting/medianFromDataStream/medianFromDataStream-guide.proof.ts` | M | 1822 | 549 |
| `src/algorithms/sorting/medianFromDataStream/medianFromDataStream-guide.ref.ts` | M | 6 | 6 |
| `src/algorithms/sorting/medianFromDataStream/medianFromDataStream-guide.sim.ts` | M | 240 | 155 |
| `src/algorithms/sorting/medianFromDataStream/medianFromDataStream-guide.test.ts` | M | 18 | 0 |
| `src/algorithms/sorting/quicksort/figs/build-calls-first.svg` | M | 26 | 0 |
| `src/algorithms/sorting/quicksort/figs/build-calls-middle.svg` | M | 26 | 0 |
| `src/algorithms/sorting/quicksort/figs/build-regions.svg` | M | 26 | 0 |
| `src/algorithms/sorting/quicksort/figs/concept-partition.svg` | M | 26 | 0 |
| `src/algorithms/sorting/quicksort/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/sorting/quicksort/figs/walk-partition.svg` | M | 26 | 0 |
| `src/algorithms/sorting/quicksort/quicksort-guide.fig.tsx` | M | 1094 | 0 |
| `src/algorithms/sorting/quicksort/quicksort-guide.md` | M | 931 | 591 |
| `src/algorithms/sorting/quicksort/quicksort-guide.proof.ts` | M | 1314 | 45 |
| `src/algorithms/sorting/quicksort/quicksort-guide.sim.ts` | M | 345 | 35 |
| `src/algorithms/sorting/quicksort/quicksort-guide.test.ts` | M | 26 | 1 |
| `src/algorithms/sorting/radixSort/figs/build-buckets.svg` | M | 26 | 0 |
| `src/algorithms/sorting/radixSort/figs/concept-digits.svg` | M | 26 | 0 |
| `src/algorithms/sorting/radixSort/figs/concept-passes.svg` | M | 26 | 0 |
| `src/algorithms/sorting/radixSort/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/sorting/radixSort/figs/walk-radix.svg` | M | 26 | 0 |
| `src/algorithms/sorting/radixSort/radixSort-guide.alt.ts` | M | 9 | 9 |
| `src/algorithms/sorting/radixSort/radixSort-guide.bench.json` | M | 6 | 6 |
| `src/algorithms/sorting/radixSort/radixSort-guide.fig.tsx` | M | 726 | 0 |
| `src/algorithms/sorting/radixSort/radixSort-guide.md` | M | 873 | 714 |
| `src/algorithms/sorting/radixSort/radixSort-guide.proof.ts` | M | 1108 | 542 |
| `src/algorithms/sorting/radixSort/radixSort-guide.ref.ts` | M | 4 | 5 |
| `src/algorithms/sorting/radixSort/radixSort-guide.sim.ts` | M | 869 | 93 |
| `src/algorithms/sorting/radixSort/radixSort-guide.test.ts` | M | 21 | 3 |
| `src/algorithms/sorting/sortArray/figs/build-levels.svg` | M | 26 | 0 |
| `src/algorithms/sorting/sortArray/figs/concept-levels.svg` | M | 26 | 0 |
| `src/algorithms/sorting/sortArray/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/sorting/sortArray/figs/walk-merge-heads.svg` | M | 26 | 0 |
| `src/algorithms/sorting/sortArray/figs/walk-merge6.svg` | M | 26 | 0 |
| `src/algorithms/sorting/sortArray/sortArray-guide.fig.tsx` | M | 811 | 0 |
| `src/algorithms/sorting/sortArray/sortArray-guide.md` | M | 760 | 591 |
| `src/algorithms/sorting/sortArray/sortArray-guide.proof.ts` | M | 1029 | 310 |
| `src/algorithms/sorting/sortArray/sortArray-guide.ref.ts` | M | 1 | 1 |
| `src/algorithms/sorting/sortArray/sortArray-guide.sim.ts` | M | 357 | 40 |
| `src/algorithms/sorting/sortArray/sortArray-guide.test.ts` | M | 19 | 3 |
| `src/algorithms/sorting/topKFrequent/figs/build-bucket-cover.svg` | M | 26 | 0 |
| `src/algorithms/sorting/topKFrequent/figs/build-contrast.svg` | M | 26 | 0 |
| `src/algorithms/sorting/topKFrequent/figs/concept-buckets.svg` | M | 26 | 0 |
| `src/algorithms/sorting/topKFrequent/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/sorting/topKFrequent/figs/walk-build.svg` | M | 26 | 0 |
| `src/algorithms/sorting/topKFrequent/figs/walk-collect.svg` | M | 26 | 0 |
| `src/algorithms/sorting/topKFrequent/topKFrequent-guide.alt.ts` | M | 12 | 11 |
| `src/algorithms/sorting/topKFrequent/topKFrequent-guide.bench.json` | M | 8 | 8 |
| `src/algorithms/sorting/topKFrequent/topKFrequent-guide.fig.tsx` | M | 887 | 0 |
| `src/algorithms/sorting/topKFrequent/topKFrequent-guide.md` | M | 868 | 663 |
| `src/algorithms/sorting/topKFrequent/topKFrequent-guide.proof.ts` | M | 905 | 382 |
| `src/algorithms/sorting/topKFrequent/topKFrequent-guide.ref.ts` | M | 7 | 7 |
| `src/algorithms/sorting/topKFrequent/topKFrequent-guide.sim.ts` | M | 916 | 216 |
| `src/algorithms/sorting/topKFrequent/topKFrequent-guide.test.ts` | M | 19 | 0 |
| `src/algorithms/string/ahoCorasick/ahoCorasick-guide.alt.ts` | M | 158 | 92 |
| `src/algorithms/string/ahoCorasick/ahoCorasick-guide.bench.json` | M | 12 | 12 |
| `src/algorithms/string/ahoCorasick/ahoCorasick-guide.fig.tsx` | M | 624 | 0 |
| `src/algorithms/string/ahoCorasick/ahoCorasick-guide.md` | M | 1095 | 943 |
| `src/algorithms/string/ahoCorasick/ahoCorasick-guide.proof.ts` | M | 1501 | 588 |
| `src/algorithms/string/ahoCorasick/ahoCorasick-guide.ref.ts` | M | 26 | 23 |
| `src/algorithms/string/ahoCorasick/ahoCorasick-guide.sim.ts` | M | 1134 | 446 |
| `src/algorithms/string/ahoCorasick/ahoCorasick-guide.test.ts` | M | 24 | 0 |
| `src/algorithms/string/ahoCorasick/figs/build-fail-links.svg` | M | 26 | 0 |
| `src/algorithms/string/ahoCorasick/figs/build-in-pattern.svg` | M | 26 | 0 |
| `src/algorithms/string/ahoCorasick/figs/build-outlink-skip.svg` | M | 26 | 0 |
| `src/algorithms/string/ahoCorasick/figs/build-read-one.svg` | M | 26 | 0 |
| `src/algorithms/string/ahoCorasick/figs/build-two-hop.svg` | M | 26 | 0 |
| `src/algorithms/string/ahoCorasick/figs/concept-automaton.svg` | M | 26 | 0 |
| `src/algorithms/string/ahoCorasick/figs/concept-matches.svg` | M | 26 | 0 |
| `src/algorithms/string/ahoCorasick/figs/invariant-mutant.svg` | M | 26 | 0 |
| `src/algorithms/string/ahoCorasick/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/string/ahoCorasick/figs/walk-ac-scan.svg` | M | 26 | 0 |
| `src/algorithms/string/findAllOccurrences/figs/build-fail-film.svg` | M | 26 | 0 |
| `src/algorithms/string/findAllOccurrences/figs/concept-fail.svg` | M | 26 | 0 |
| `src/algorithms/string/findAllOccurrences/figs/concept-overlap.svg` | M | 26 | 0 |
| `src/algorithms/string/findAllOccurrences/figs/invariant-window.svg` | M | 26 | 0 |
| `src/algorithms/string/findAllOccurrences/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/string/findAllOccurrences/figs/walk-kmp.svg` | M | 26 | 0 |
| `src/algorithms/string/findAllOccurrences/findAllOccurrences-guide.alt.ts` | M | 11 | 11 |
| `src/algorithms/string/findAllOccurrences/findAllOccurrences-guide.bench.json` | M | 8 | 8 |
| `src/algorithms/string/findAllOccurrences/findAllOccurrences-guide.fig.tsx` | M | 524 | 0 |
| `src/algorithms/string/findAllOccurrences/findAllOccurrences-guide.md` | M | 829 | 809 |
| `src/algorithms/string/findAllOccurrences/findAllOccurrences-guide.proof.ts` | M | 1016 | 415 |
| `src/algorithms/string/findAllOccurrences/findAllOccurrences-guide.ref.ts` | M | 1 | 1 |
| `src/algorithms/string/findAllOccurrences/findAllOccurrences-guide.sim.ts` | M | 469 | 144 |
| `src/algorithms/string/findAllOccurrences/findAllOccurrences-guide.test.ts` | M | 19 | 2 |
| `src/algorithms/string/kasaiLcp/figs/build-carry.svg` | M | 26 | 0 |
| `src/algorithms/string/kasaiLcp/figs/build-lcp-text.svg` | M | 26 | 0 |
| `src/algorithms/string/kasaiLcp/figs/concept-lcp.svg` | M | 26 | 0 |
| `src/algorithms/string/kasaiLcp/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/string/kasaiLcp/figs/walk-kasai.svg` | M | 26 | 0 |
| `src/algorithms/string/kasaiLcp/kasaiLcp-guide.fig.tsx` | M | 858 | 0 |
| `src/algorithms/string/kasaiLcp/kasaiLcp-guide.md` | M | 1096 | 970 |
| `src/algorithms/string/kasaiLcp/kasaiLcp-guide.proof.ts` | M | 1131 | 1203 |
| `src/algorithms/string/kasaiLcp/kasaiLcp-guide.ref.ts` | M | 4 | 4 |
| `src/algorithms/string/kasaiLcp/kasaiLcp-guide.sim.ts` | M | 409 | 98 |
| `src/algorithms/string/kasaiLcp/kasaiLcp-guide.test.ts` | M | 36 | 4 |
| `src/algorithms/string/longestPalindrome/figs/build-clip.svg` | M | 26 | 0 |
| `src/algorithms/string/longestPalindrome/figs/build-radius-bars.svg` | M | 26 | 0 |
| `src/algorithms/string/longestPalindrome/figs/concept-radius.svg` | M | 26 | 0 |
| `src/algorithms/string/longestPalindrome/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/string/longestPalindrome/figs/origin-centers.svg` | M | 26 | 0 |
| `src/algorithms/string/longestPalindrome/figs/walk-manacher.svg` | M | 26 | 0 |
| `src/algorithms/string/longestPalindrome/longestPalindrome-guide.alt.ts` | M | 68 | 123 |
| `src/algorithms/string/longestPalindrome/longestPalindrome-guide.bench.json` | M | 15 | 11 |
| `src/algorithms/string/longestPalindrome/longestPalindrome-guide.fig.tsx` | M | 1033 | 0 |
| `src/algorithms/string/longestPalindrome/longestPalindrome-guide.md` | M | 1246 | 995 |
| `src/algorithms/string/longestPalindrome/longestPalindrome-guide.proof.ts` | M | 1362 | 1009 |
| `src/algorithms/string/longestPalindrome/longestPalindrome-guide.ref.ts` | M | 4 | 4 |
| `src/algorithms/string/longestPalindrome/longestPalindrome-guide.sim.ts` | M | 803 | 166 |
| `src/algorithms/string/longestPalindrome/longestPalindrome-guide.test.ts` | M | 19 | 3 |
| `src/algorithms/string/radixTree/figs/build-over-trie.svg` | M | 26 | 0 |
| `src/algorithms/string/radixTree/figs/build-read-one.svg` | M | 26 | 0 |
| `src/algorithms/string/radixTree/figs/build-split.svg` | M | 26 | 0 |
| `src/algorithms/string/radixTree/figs/concept-radix.svg` | M | 26 | 0 |
| `src/algorithms/string/radixTree/figs/concept-trie.svg` | M | 26 | 0 |
| `src/algorithms/string/radixTree/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/string/radixTree/figs/pause-relink.svg` | M | 26 | 0 |
| `src/algorithms/string/radixTree/figs/walk-insert-shapes.svg` | M | 26 | 0 |
| `src/algorithms/string/radixTree/figs/walk-radix-ops.svg` | M | 26 | 0 |
| `src/algorithms/string/radixTree/radixTree-guide.fig.tsx` | M | 676 | 0 |
| `src/algorithms/string/radixTree/radixTree-guide.md` | M | 1041 | 978 |
| `src/algorithms/string/radixTree/radixTree-guide.proof.ts` | M | 1365 | 738 |
| `src/algorithms/string/radixTree/radixTree-guide.sim.ts` | M | 827 | 306 |
| `src/algorithms/string/radixTree/radixTree-guide.test.ts` | M | 26 | 0 |
| `src/algorithms/string/suffixArray/figs/build-levels.svg` | M | 26 | 0 |
| `src/algorithms/string/suffixArray/figs/build-pair.svg` | M | 26 | 0 |
| `src/algorithms/string/suffixArray/figs/concept-rank2.svg` | M | 26 | 0 |
| `src/algorithms/string/suffixArray/figs/concept-suffixes.svg` | M | 26 | 0 |
| `src/algorithms/string/suffixArray/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/string/suffixArray/figs/walk-doubling.svg` | M | 26 | 0 |
| `src/algorithms/string/suffixArray/suffixArray-guide.fig.tsx` | M | 1026 | 0 |
| `src/algorithms/string/suffixArray/suffixArray-guide.md` | M | 1082 | 981 |
| `src/algorithms/string/suffixArray/suffixArray-guide.proof.ts` | M | 948 | 1047 |
| `src/algorithms/string/suffixArray/suffixArray-guide.sim.ts` | M | 488 | 134 |
| `src/algorithms/string/suffixArray/suffixArray-guide.test.ts` | M | 29 | 0 |
| `src/algorithms/string/suffixAutomaton/figs/build-clone-film.svg` | M | 26 | 0 |
| `src/algorithms/string/suffixAutomaton/figs/build-endpos-longest.svg` | M | 26 | 0 |
| `src/algorithms/string/suffixAutomaton/figs/build-fill-frame.svg` | M | 26 | 0 |
| `src/algorithms/string/suffixAutomaton/figs/build-links.svg` | M | 26 | 0 |
| `src/algorithms/string/suffixAutomaton/figs/concept-automaton.svg` | M | 26 | 0 |
| `src/algorithms/string/suffixAutomaton/figs/concept-endpos.svg` | M | 26 | 0 |
| `src/algorithms/string/suffixAutomaton/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/string/suffixAutomaton/figs/origin-trie-merge.svg` | M | 26 | 0 |
| `src/algorithms/string/suffixAutomaton/figs/selfcheck-start.svg` | M | 26 | 0 |
| `src/algorithms/string/suffixAutomaton/figs/walk-sam.svg` | M | 26 | 0 |
| `src/algorithms/string/suffixAutomaton/suffixAutomaton-guide.fig.tsx` | M | 664 | 0 |
| `src/algorithms/string/suffixAutomaton/suffixAutomaton-guide.md` | M | 1152 | 902 |
| `src/algorithms/string/suffixAutomaton/suffixAutomaton-guide.proof.ts` | M | 1653 | 875 |
| `src/algorithms/string/suffixAutomaton/suffixAutomaton-guide.sim.ts` | M | 1499 | 344 |
| `src/algorithms/string/suffixAutomaton/suffixAutomaton-guide.test.ts` | M | 20 | 0 |
| `src/algorithms/string/trie/figs/build-apple.svg` | M | 26 | 0 |
| `src/algorithms/string/trie/figs/build-read-one.svg` | M | 26 | 0 |
| `src/algorithms/string/trie/figs/build-trie-share.svg` | M | 26 | 0 |
| `src/algorithms/string/trie/figs/build-unshared.svg` | M | 26 | 0 |
| `src/algorithms/string/trie/figs/concept-trie.svg` | M | 26 | 0 |
| `src/algorithms/string/trie/figs/invariant-mutant.svg` | M | 26 | 0 |
| `src/algorithms/string/trie/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/string/trie/figs/walk-insert-shapes.svg` | M | 26 | 0 |
| `src/algorithms/string/trie/figs/walk-trie-ops.svg` | M | 26 | 0 |
| `src/algorithms/string/trie/trie-guide.alt.ts` | M | 2 | 2 |
| `src/algorithms/string/trie/trie-guide.bench.json` | M | 4 | 4 |
| `src/algorithms/string/trie/trie-guide.fig.tsx` | M | 502 | 0 |
| `src/algorithms/string/trie/trie-guide.md` | M | 855 | 742 |
| `src/algorithms/string/trie/trie-guide.proof.ts` | M | 934 | 442 |
| `src/algorithms/string/trie/trie-guide.ref.ts` | M | 2 | 2 |
| `src/algorithms/string/trie/trie-guide.sim.ts` | M | 872 | 408 |
| `src/algorithms/string/trie/trie-guide.test.ts` | M | 23 | 0 |
| `src/algorithms/tree/heavyLightDecomposition/figs/build-chains.svg` | M | 26 | 0 |
| `src/algorithms/tree/heavyLightDecomposition/figs/build-read.svg` | M | 26 | 0 |
| `src/algorithms/tree/heavyLightDecomposition/figs/concept-chains.svg` | M | 26 | 0 |
| `src/algorithms/tree/heavyLightDecomposition/figs/concept-cover.svg` | M | 26 | 0 |
| `src/algorithms/tree/heavyLightDecomposition/figs/concept-tree.svg` | M | 26 | 0 |
| `src/algorithms/tree/heavyLightDecomposition/figs/invariant-moment.svg` | M | 26 | 0 |
| `src/algorithms/tree/heavyLightDecomposition/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/tree/heavyLightDecomposition/figs/walk-film.svg` | M | 26 | 0 |
| `src/algorithms/tree/heavyLightDecomposition/heavyLightDecomposition-guide.fig.tsx` | M | 695 | 0 |
| `src/algorithms/tree/heavyLightDecomposition/heavyLightDecomposition-guide.md` | M | 1163 | 1061 |
| `src/algorithms/tree/heavyLightDecomposition/heavyLightDecomposition-guide.proof.ts` | M | 2418 | 614 |
| `src/algorithms/tree/heavyLightDecomposition/heavyLightDecomposition-guide.sim.ts` | M | 1842 | 601 |
| `src/algorithms/tree/heavyLightDecomposition/heavyLightDecomposition-guide.test.ts` | M | 36 | 0 |
| `src/algorithms/tree/lowestCommonAncestor/figs/build-layer.svg` | M | 26 | 0 |
| `src/algorithms/tree/lowestCommonAncestor/figs/build-read.svg` | M | 26 | 0 |
| `src/algorithms/tree/lowestCommonAncestor/figs/concept-query.svg` | M | 26 | 0 |
| `src/algorithms/tree/lowestCommonAncestor/figs/concept-table.svg` | M | 26 | 0 |
| `src/algorithms/tree/lowestCommonAncestor/figs/concept-tree.svg` | M | 26 | 0 |
| `src/algorithms/tree/lowestCommonAncestor/figs/invariant-moment.svg` | M | 26 | 0 |
| `src/algorithms/tree/lowestCommonAncestor/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/tree/lowestCommonAncestor/figs/walk-film.svg` | M | 26 | 0 |
| `src/algorithms/tree/lowestCommonAncestor/lowestCommonAncestor-guide.alt.ts` | M | 50 | 11 |
| `src/algorithms/tree/lowestCommonAncestor/lowestCommonAncestor-guide.bench.json` | M | 4 | 4 |
| `src/algorithms/tree/lowestCommonAncestor/lowestCommonAncestor-guide.fig.tsx` | M | 614 | 0 |
| `src/algorithms/tree/lowestCommonAncestor/lowestCommonAncestor-guide.md` | M | 1015 | 820 |
| `src/algorithms/tree/lowestCommonAncestor/lowestCommonAncestor-guide.proof.ts` | M | 1904 | 383 |
| `src/algorithms/tree/lowestCommonAncestor/lowestCommonAncestor-guide.ref.ts` | M | 6 | 6 |
| `src/algorithms/tree/lowestCommonAncestor/lowestCommonAncestor-guide.sim.ts` | M | 2551 | 509 |
| `src/algorithms/tree/lowestCommonAncestor/lowestCommonAncestor-guide.test.ts` | M | 38 | 0 |
| `src/algorithms/tree/subtreeSumQuery/figs/build-euler.svg` | M | 26 | 0 |
| `src/algorithms/tree/subtreeSumQuery/figs/build-read.svg` | M | 26 | 0 |
| `src/algorithms/tree/subtreeSumQuery/figs/concept-flat.svg` | M | 26 | 0 |
| `src/algorithms/tree/subtreeSumQuery/figs/concept-tree.svg` | M | 26 | 0 |
| `src/algorithms/tree/subtreeSumQuery/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/tree/subtreeSumQuery/figs/related-parens.svg` | M | 26 | 0 |
| `src/algorithms/tree/subtreeSumQuery/figs/walk-film.svg` | M | 26 | 0 |
| `src/algorithms/tree/subtreeSumQuery/subtreeSumQuery-guide.alt.ts` | M | 2 | 2 |
| `src/algorithms/tree/subtreeSumQuery/subtreeSumQuery-guide.bench.json` | M | 8 | 8 |
| `src/algorithms/tree/subtreeSumQuery/subtreeSumQuery-guide.fig.tsx` | M | 623 | 0 |
| `src/algorithms/tree/subtreeSumQuery/subtreeSumQuery-guide.md` | M | 1038 | 968 |
| `src/algorithms/tree/subtreeSumQuery/subtreeSumQuery-guide.proof.ts` | M | 1684 | 1284 |
| `src/algorithms/tree/subtreeSumQuery/subtreeSumQuery-guide.ref.ts` | M | 6 | 6 |
| `src/algorithms/tree/subtreeSumQuery/subtreeSumQuery-guide.sim.ts` | M | 1907 | 377 |
| `src/algorithms/tree/subtreeSumQuery/subtreeSumQuery-guide.test.ts` | M | 33 | 0 |
| `src/algorithms/tree/treeDiameter/figs/build-tree-0.svg` | M | 26 | 0 |
| `src/algorithms/tree/treeDiameter/figs/build-tree-6.svg` | M | 26 | 0 |
| `src/algorithms/tree/treeDiameter/figs/concept-sweeps.svg` | M | 26 | 0 |
| `src/algorithms/tree/treeDiameter/figs/concept-tree.svg` | M | 26 | 0 |
| `src/algorithms/tree/treeDiameter/figs/invariant-moment.svg` | M | 26 | 0 |
| `src/algorithms/tree/treeDiameter/figs/math-median.svg` | M | 26 | 0 |
| `src/algorithms/tree/treeDiameter/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/tree/treeDiameter/figs/related-ecc.svg` | M | 26 | 0 |
| `src/algorithms/tree/treeDiameter/figs/walk-film.svg` | M | 26 | 0 |
| `src/algorithms/tree/treeDiameter/treeDiameter-guide.fig.tsx` | M | 588 | 0 |
| `src/algorithms/tree/treeDiameter/treeDiameter-guide.md` | M | 956 | 699 |
| `src/algorithms/tree/treeDiameter/treeDiameter-guide.proof.ts` | M | 1731 | 309 |
| `src/algorithms/tree/treeDiameter/treeDiameter-guide.sim.ts` | M | 1410 | 365 |
| `src/algorithms/tree/treeDiameter/treeDiameter-guide.test.ts` | M | 25 | 0 |
| `src/algorithms/tree/treeIsomorphism/figs/build-codes.svg` | M | 26 | 0 |
| `src/algorithms/tree/treeIsomorphism/figs/build-contrast.svg` | M | 26 | 0 |
| `src/algorithms/tree/treeIsomorphism/figs/build-layers.svg` | M | 26 | 0 |
| `src/algorithms/tree/treeIsomorphism/figs/concept-codes.svg` | M | 26 | 0 |
| `src/algorithms/tree/treeIsomorphism/figs/concept-pair.svg` | M | 26 | 0 |
| `src/algorithms/tree/treeIsomorphism/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/tree/treeIsomorphism/figs/origin-degree.svg` | M | 26 | 0 |
| `src/algorithms/tree/treeIsomorphism/figs/walk-film.svg` | M | 26 | 0 |
| `src/algorithms/tree/treeIsomorphism/treeIsomorphism-guide.fig.tsx` | M | 690 | 0 |
| `src/algorithms/tree/treeIsomorphism/treeIsomorphism-guide.md` | M | 1350 | 1216 |
| `src/algorithms/tree/treeIsomorphism/treeIsomorphism-guide.proof.ts` | M | 2302 | 1315 |
| `src/algorithms/tree/treeIsomorphism/treeIsomorphism-guide.sim.ts` | M | 5022 | 1086 |
| `src/algorithms/tree/treeIsomorphism/treeIsomorphism-guide.test.ts` | M | 39 | 0 |
| `src/algorithms/tree/treeRerooting/figs/build-contrast.svg` | M | 26 | 0 |
| `src/algorithms/tree/treeRerooting/figs/build-pieces.svg` | M | 26 | 0 |
| `src/algorithms/tree/treeRerooting/figs/build-read-edge.svg` | M | 26 | 0 |
| `src/algorithms/tree/treeRerooting/figs/build-relation.svg` | M | 26 | 0 |
| `src/algorithms/tree/treeRerooting/figs/concept-split.svg` | M | 26 | 0 |
| `src/algorithms/tree/treeRerooting/figs/concept-tree.svg` | M | 26 | 0 |
| `src/algorithms/tree/treeRerooting/figs/concept-updown.svg` | M | 26 | 0 |
| `src/algorithms/tree/treeRerooting/figs/invariant-moment.svg` | M | 26 | 0 |
| `src/algorithms/tree/treeRerooting/figs/math-split.svg` | M | 26 | 0 |
| `src/algorithms/tree/treeRerooting/figs/origin-approaches.svg` | M | 26 | 0 |
| `src/algorithms/tree/treeRerooting/figs/walk-film.svg` | M | 26 | 0 |
| `src/algorithms/tree/treeRerooting/treeRerooting-guide.fig.tsx` | M | 605 | 0 |
| `src/algorithms/tree/treeRerooting/treeRerooting-guide.md` | M | 1127 | 758 |
| `src/algorithms/tree/treeRerooting/treeRerooting-guide.proof.ts` | M | 1740 | 968 |
| `src/algorithms/tree/treeRerooting/treeRerooting-guide.sim.ts` | M | 1567 | 404 |
| `src/algorithms/tree/treeRerooting/treeRerooting-guide.test.ts` | M | 25 | 0 |
| `tools/_baseline/citations.tsv` | M | 26 | 30 |
| `tools/algo-wbs.ts` | M | 25 | 10 |
| `tools/check-metaphor.test.ts` | M | 4 | 3 |
| `tools/check-v2.test.ts` | M | 245 | 98 |
| `tools/check-v2.ts` | M | 121 | 38 |
| `tools/josa.test.ts` | M | 17 | 2 |
| `tools/josa.ts` | M | 19 | 2 |
| `tools/migrate-practice.ts` | M | 7 | 2 |
| `tools/voice-style.ts` | M | 21 | 0 |

**롤백 태그 4개**

```text
kan/KAN-058-8XT6PC/S8
kan/KAN-058-8XT6PC/S9
kan/KAN-058-8XT6PC/batch5
kan/KAN-058-8XT6PC/batch6
```

## 2. 검증 — 기준과 실행 결과

<!-- 기준은 카드 실행 문서 「검증」 절의 사본이다. 정본은 KANBAN.cards/KAN-058-8XT6PC.md 이므로
     기준이 바뀌면 그쪽을 고치고 review-init --refresh 로 이 항만 다시 뜬다.
     결과는 착수한 쪽이 이미 돌린 것이다 — 검토자에게 다시 돌리라고 시키지 않는다.
     **다시 돌려 아래와 다르게 나오면 그 자체가 반려 사유다.** -->

**기준**

<!-- 무엇을 실행해 무엇이 나오면 이 카드가 끝난 것인가. -->
편 하나의 완료(샘플·전개 공통). 정본은 `.claude/skills/guide-for-problem/SKILL.md` 「알고리즘 가이드 v2 재집필 경로」의 편 완료 명령이고 여기는 사본이다:

```bash
G=src/algorithms/<카테고리>/<편>/<편>-guide.md
bun run tools/check-v2.ts $G                          # S10 뒤 한시 조항 없이 재는 것이 기본(--strict 는 무시된다)
bun run tools/check-proof.ts --require $G
bun run tools/render-figs.ts --check
bun test src/algorithms/<카테고리>/<편>/<편>-guide.test.ts
bun run tools/build-html.ts $G
bun run tools/check-metaphor.ts $G
bun run tools/guide-core.ts check
bunx tsc --noEmit
```

문체 박자 등급(실습 앞까지, `scan_ai_style.py --voice algorithm-guide-writer`)은 합격선이 아니라 보고할 값이다 — 파일럿 파트 1·2 도 C 다.

카드 전체:

```bash
bun run tools/ci.ts all                                   # 4모드 + 게이트
bun run tools/check-v2.ts --all                           # S10 뒤 strict 가 기본
bun run tools/algo-wbs.ts                                 # 남은 편 0
bun run tools/check-proof.ts --all
bun run tools/render-figs.ts --check
grep -roE '견(주|줘|준|줄|줬)' src/algorithms --include='*-guide.md' | wc -l   # 0
bun run tools/voice-style.ts --check                      # 원본·사본 일치
bunx tsc --noEmit
```

**실행 결과**

```text
카드 「검증」 절의 카드 전체 명령을 메인 세션이 2026-10-01 에 실행:
- bun run tools/ci.ts all — 첫 실행에서 ① 도구 자기시험 1건 실패(check-metaphor.test.ts 가 countIslands proof.ts 줄 번호를 고정, 첫 웨이브 재집필로 밀림). 시험을 내용으로 찾게 고친 뒤 bun run tools/ci.ts self 통과(단계 3개), bun test tools 574 pass 0 fail. 나머지 모드(② reference · ③ practice 판정 제외 · ④ trials · gates)는 첫 실행에서 통과.
- bun run tools/check-v2.ts --all — 종료 코드 0(경고 5건 2편, 판정 제외)
- bun run tools/algo-wbs.ts — 115 편 (완료 115 · 남은 0)
- bun run tools/check-proof.ts --all — 종료 코드 0
- bun run tools/render-figs.ts --check — 대조 통과, 그림 사이드카가 있는 가이드 115편 / 대상 115편
- grep 「견주다」 활용형(src/algorithms 가이드) — 0
- bun run tools/voice-style.ts --check — voice 사본 = 원본
- bunx tsc --noEmit — 종료 코드 0
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
python3 scripts/kanban.py review-judge <project-root> --card KAN-058-8XT6PC --item <번호> --verdict 승인
# 추가 의견
python3 scripts/kanban.py review-note <project-root> --card KAN-058-8XT6PC --item <번호> --text "<추가 의견>"
# 추가 의견을 반영하다 새 의견이 생겼으면 (맨 뒤에 붙어 앞 번호가 안 밀립니다)
python3 scripts/kanban.py review-item <project-root> --card KAN-058-8XT6PC --add "<주제>
  <상세>"
```

**전체 승인은 살아있는 항목이 전부 승인일 때만 섭니다**(철회는 분모에서 빠집니다). 하나라도
반려·추가 의견·미정이면 4항의 전체 승인도 `→ 완료` 이동도 종료코드 14로 거부됩니다.


## 4. 판정

<!-- 문서 하나에 대한 판정이다. **항목별로 갈리는 말은 여기 적지 않는다** — 3항 각 의견의
     「판정」과 「추가 의견」이 그 자리다. 여기 남는 것은 그 항목들이 전부 승인으로 닫혔다는
     사실 하나뿐이다.
     아래 「판정 이력」은 **덧붙기만 하는 이력**이다. 왕복이 돌면 줄이 쌓이고, 그것이 이 문서가
     무엇을 거쳐 승인에 닿았는지의 전부다 — 지우지 않는다. **판정에는 사유 칸이 없다** —
     승인은 대체로 덧붙일 말이 없고, 있다면 그것은 문서 전체가 아니라 그 항목에 대한
     말이라 3항의 「추가 의견」이 받는다.
     `review-judge --card KAN-058-8XT6PC --verdict 승인` 이 이 자리를 쓰고
     frontmatter 의 status 도 함께 고친다. 손으로 적어도 되지만, 그때는 수렴 검사를
     안 거치므로 `validate` 가 항목 판정과 어긋난 승인을 error 로 잡는다. -->

**판정**: (아직 없습니다)

**판정 이력**:

- 승인이면 → `apply --op move --id KAN-058-8XT6PC --to done` 뒤에 `main` 병합과 워크트리 정리(출력의 `cleanup`)
- 반려면 → `apply --op move --id KAN-058-8XT6PC --to doing` 뒤에 `doc-log --entry "<반려 사유>"`.
  요청서는 **지우지도 다시 뜨지도 않는다** — 고친 뒤 그 항목을 `review-judge --verdict 승인` 으로
  뒤집으면 같은 문서에서 수렴한다. 1·2항이 낡았으면 `review-init --refresh` 로 그 두 항만 간다.
