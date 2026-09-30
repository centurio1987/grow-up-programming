---
card: KAN-061-YVQBCF
title: 알고리즘 실습 절·스텁 테스트 결함 약 40곳과 정본 결함 7건 정리 — KAN-058 전개 중 모은 목록
created: 2026-10-01
scope: src/algorithms/advanced/convexHullTrick/**, src/algorithms/advanced/divideAndConquerDp/**, src/algorithms/advanced/knuthOptimization/**, src/algorithms/advanced/minMaxPair/**, src/algorithms/array/bestTimeToBuyAndSellStock/**, src/algorithms/array/bestTimeToBuyAndSellStockK/**, src/algorithms/array/largestRectangleInHistogram/**, src/algorithms/array/longestCommonSubsequence/**, src/algorithms/array/longestIncreasingSubsequence/**, src/algorithms/array/maximumProductSubarray/**, src/algorithms/binary-search/searchInRotatedSortedArray/**, src/algorithms/bit-manipulation/enumerateSubmasks/**, src/algorithms/bit-manipulation/matrixPowerFibonacci/**, src/algorithms/bit-manipulation/singleNumberXor/**, src/algorithms/dp/coinChangeWays/**, src/algorithms/dp/expectedValueDp/**, src/algorithms/dp/matrixChainMultiplication/**, src/algorithms/dp/palindromePartitioningMinCut/**, src/algorithms/dp/subsetSum/**, src/algorithms/dp/unboundedKnapsack/**, src/algorithms/geometry/pointInPolygon/**, src/algorithms/geometry/polygonArea/**, src/algorithms/geometry/rotatingCalipersDiameter/**, src/algorithms/graph-flow/kruskalMst/**, src/algorithms/graph-flow/minCut/**, src/algorithms/graph-flow/primMst/**, src/algorithms/graph/dfsTraversal/**, src/algorithms/graph/undirectedCycleDetection/**, src/algorithms/number-theory/babyStepGiantStep/**, src/algorithms/number-theory/binomialModP/**, src/algorithms/number-theory/crt/**, src/algorithms/number-theory/fastPower/**, src/algorithms/number-theory/isPrimeTrial/**, src/algorithms/number-theory/millerRabin/**, src/algorithms/number-theory/pollardRho/**, src/algorithms/shortest-path/aStarSearch/**, src/algorithms/sorting/externalMergeSort/**, src/algorithms/sorting/sortArray/**, src/algorithms/sorting/topKFrequent/**, src/algorithms/string/ahoCorasick/**, src/algorithms/string/findAllOccurrences/**, src/algorithms/string/kasaiLcp/**, src/algorithms/string/longestPalindrome/**, src/algorithms/string/radixTree/**, src/algorithms/string/suffixArray/**, src/algorithms/string/suffixAutomaton/**, src/algorithms/string/trie/**, src/algorithms/tree/heavyLightDecomposition/**, src/algorithms/tree/subtreeSumQuery/**, src/algorithms/tree/treeDiameter/**, tools/practice-ref.ts, tools/practice-ref.test.ts, src/algorithms/array/nextGreaterElement/**, src/algorithms/binary-search/parametricBinarySearch/**, src/algorithms/shortest-path/dagShortestPath/**
---

# KAN-061-YVQBCF — 알고리즘 실습 절·스텁 테스트 결함 약 40곳과 정본 결함 7건 정리 — KAN-058 전개 중 모은 목록

## 전략
목록 정본은 `KANBAN.batches/KAN-058-8XT6PC.s11-findings.md` §3(실습 절·스텁 테스트)과 §4(정본)이다. 이 카드 승인이 「고쳐」 지시다(KAN-058 검토 4). 목표는 목록의 모든 줄이 **고쳐졌거나 고치지 않는 사유가 적힌** 상태다.

**먼저 재는 도구를 세운다.** 「맞게 풀어도 시험이 실패하는 자리」는 스텁 테스트를 정본(`-guide.ref.ts`)에 물려 돌리면 기계로 드러난다. 착수 전에 한 번 돌려 봤다(2026-10-01, scratch 하네스): 119 파일 1,399 시험 중 실패 15건, import 불일치 5파일. 실패는 목록의 3-1 여섯 편과 matrixPowerFibonacci(n=10^18) 외에 **목록에 없던 두 편**(polygonArea·pointInPolygon — 성능 시험이 정수 좌표 계약을 어기고 cos/sin 실수 좌표를 넣는다)을 잡았다. ahoCorasick 실패는 3-1 의 `he@1` 이 아니라 3-2 의 「텍스트에 빈칸」(제약은 소문자뿐)이었다. 이 도구를 `tools/practice-ref.test.ts` 로 저장소에 두면 `ci.ts` 의 `bun test tools` 단계(자기시험·gates 둘 다)가 그대로 집행한다 — `ci.ts` 를 고치지 않아도 되므로 KAN-036 과 겹치지 않는다. import 불일치 5파일(한 폴더에 문제가 둘 이상인 편: prefixSumRangeQuery 둘·kadane·bestTimeToBuyAndSellStock·numberOfDisintersection)은 정본이 그 함수를 싣지 않는 것이라 결함이 아니며, 도구에 사유를 단 제외 목록으로 둔다.

**편 단위로 묶는다.** 한 편에 실습 결함과 정본 결함이 함께 있는 경우가 넷이다(babyStepGiantStep · coinChangeWays · kruskalMst · unboundedKnapsack). 결함 종류로 work 를 나누면 같은 파일을 두 work 가 고치므로, 틀린 기대값만 먼저 한 work 로 걷고 나머지는 갈래별로 묶는다.

**실습 절과 스텁 테스트는 한 쌍으로 고친다.** SPEC `practice` 절: 「모든 기대값은 실행으로 확인하고 테스트 파일의 기대값과 같아야 한다」. 예시를 고치면 테스트를, 테스트를 고치면 예시를 함께 본다. 제약 조건의 목표 복잡도, 스토리의 풀이 흘림, 문제 상세의 풀이 처방은 같은 절의 「쓰는 법」대로 지운다.

**정본을 고치면 가이드 코드도 같이 바뀐다.** P16(원고 전체 코드 = 정본)이 대조하므로, 정본 수정 → `biome check --write` → 원고 코드 블록 갱신 → 인용 줄 재배치(`remap-citations`) 순서를 지킨다.

**고치지 않기로 미리 정한 것과 그 사유.**
- 벽시계 성능 시험(목록의 fastPower·treeMaxIndependentSet·fenwickRangeSum·digitDp·slidingWindowMaximum·bridgesInGraph 와 longestIncreasingSubsequence·palindromePartitioningMinCut·topKFrequent·longestPalindrome·rotatingCalipersDiameter·knuthOptimization 의 100ms 케이스): SPEC `practice` 절은 성능 시험을 「제약 상한, CPU 1 초 ≈ 10^8 연산」으로 정할 뿐 벽시계를 금하지 않는다(벽시계 금지는 bench 와 자료구조 축3 규약이다). 스텁 테스트 119 파일이 대부분 같은 방식이라 몇 편만 바꾸면 규약이 갈린다. 정본으로 돌려 전부 1.6 초 안에 통과했다. **예외**: 시드 없는 `Math.random`(topKFrequent)은 재현이 안 되므로 고친다. 통과할 수 없는 상한(matrixPowerFibonacci n=10^18)은 제약을 고친다. — 유저 확인 대상(착수 질문).
- bestTimeToBuyAndSellStockK 스텁의 탐욕 풀이: 파일이 `solutions` 브랜치와 바이트까지 같고 마지막 변경이 `3aa95994 Merge branch 'main' into solutions` 다. 유저 풀이가 병합으로 main 에 새어 든 것이다. main 에서 스텁으로 되돌리면 다음 main→solutions 병합에서 **solutions 쪽 풀이가 스텁으로 덮인다**. 그래서 이 카드에서 건드리지 않고 사유를 적는다. 같은 누수가 더 있는지는 S1 에서 한 번 세어 검토서에 올린다.
- kruskalMst 정본(경로 압축을 넣은 판이 칸 접근이 더 많음): 정본은 표준 판을 싣는 자리이고 원고가 두 판의 수를 이미 보인다. 정본을 바꾸면 가이드 코드·bench 가 다 바뀌는데 얻는 것이 없다.

**버린 대안.** 결함 종류별 work 분할(같은 편을 두 번 연다), 벽시계 전면 교체(119 파일, 이 카드 목표 밖 — 필요하면 별도 카드).

## 실행 계획
- [x] `S1` 스텁↔정본 대조 도구 — `tools/practice-ref.test.ts`(+ 제외 목록과 사유). 완료 기준: 착수 전 실측(실패 15 · import 불일치 5)을 그대로 재현하고, 제외 목록 밖 import 불일치는 실패로 잡는다. 스텁 누수(스텁이 `Not implemented` 를 안 던지는 파일) 수를 센다
- [x] `S2` 틀린 기대값 9편 — searchInRotatedSortedArray · fastPower · matrixChainMultiplication · palindromePartitioningMinCut · largestRectangleInHistogram · ahoCorasick · matrixPowerFibonacci · polygonArea · pointInPolygon. 테스트와 실습 예시·제약을 한 쌍으로. 완료 기준: S1 도구 실패 0
- [x] `S3` array·dp·binary-search·bit 갈래 실습·정본 결함(16편). 완료 기준: 해당 줄마다 고침 또는 사유, 편마다 `bun test <편>`·`check-v2` 통과
- [ ] `S4` string·number-theory 갈래(15편). 완료 기준: S3 과 같음. babyStepGiantStep 은 실습 제약을 서로소로 좁히고 서로소 아닌 스텁 케이스를 뺀다
- [ ] `S5` graph·graph-flow·shortest-path·tree·geometry·sorting·advanced 갈래(19편). 완료 기준: S3 과 같음. 정본을 고친 편은 원고 코드 블록(P16)·인용(`check-citations`)까지
- [ ] `S6` 대조표와 전체 검증 — 근거 파일 §3·§4 의 줄마다 「고침(커밋) / 사유」를 적은 표를 카드 문서에 남기고 `bun run tools/ci.ts all` 통과. 완료 기준: 표에 빈 줄 0, ci all 녹색
- [ ] `S7` 검토서 — `review-init` 과 판단 항목(벽시계 방침 · 스텁 누수 · 정본을 안 고친 편)

## 검증
- `bun test tools/practice-ref.test.ts` — 스텁 테스트를 정본에 물려 돌린 결과 실패 0(제외 목록 5파일은 사유와 함께 건너뜀)
- `bun run tools/check-v2.ts` — 고친 편 전부 오류 0(P16 원고 코드 = 정본, P22 실습 절 구조)
- `bun run tools/check-citations.ts` — 인용 표류 0
- `bun run tools/ci.ts all` — 녹색
- 카드 문서의 대조표 — 근거 파일 §3·§4 의 모든 줄에 「고침」 또는 「사유」가 있다

## 수행 내역
<!-- KANBAN:LOG append-only — 아래로만 덧붙인다. 위를 고치지 않는다. -->
- 2026-10-01T07:01 · s:1cf4aad1 — `전략` 섹션 교체
- 2026-10-01T07:01 · s:1cf4aad1 — `실행 계획` 섹션 교체
- 2026-10-01T07:01 · s:1cf4aad1 — `검증` 섹션 교체
- 2026-10-01T07:04 · s:1cf4aad1 — 착수 결정(유저 2026-10-01): 묶음 2 는 서브에이전트 셋 병렬 · 벽시계 성능 시험은 사유만 적음(topKFrequent 시드·matrixPowerFibonacci 상한은 고침) · KAN-039 겹침 용인
- 2026-10-01T07:06 · s:1cf4aad1 · S1 done — tools/practice-ref.ts(+test) — 117 파일 1,440 시험, 실패 10(착수 전 실측과 같은 편), 별칭 3 파일 통과, 부속 문제 2 건너뜀. 스텁에 풀이가 든 파일 24(21 은 solutions 브랜치와 바이트 동일) — 검토서로
- 2026-10-01T07:09 · s:1cf4aad1 · S2 done — 틀린 기대값 9편 + 같은 편의 실습 결함. practice-ref 실패 10 → 0. check-v2 5편 통과. 정본은 안 바꿈(matrixPowerFibonacci 는 원고가 한계를 밝힘)
- 2026-10-01T07:11 · s:1cf4aad1 · S3 done — array·dp·bit 11편 실습 절 · 정본 JSDoc 1. practice-ref 실패 0, check-v2 전부 통과, 인용 표류 0. 사유 넷(스텁 풀이 누수 · coinChangeWays 정본 · expectedValueDp · 층/줄)
