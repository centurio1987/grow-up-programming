---
card: KAN-064-4YZZV2
title: 실습 스텁에 새어 든 풀이 24편 되돌리기 — solutions 브랜치 병합 방향을 먼저 정한다
created: 2026-10-01
scope: src/algorithms/array/bestTimeToBuyAndSellStock/bestTimeToBuyAndSellStock.ts, src/algorithms/array/bestTimeToBuyAndSellStock/maxProfit.ts, src/algorithms/array/bestTimeToBuyAndSellStockK/bestTimeToBuyAndSellStockK.ts, src/algorithms/array/houseRobber/houseRobber.ts, src/algorithms/array/missingInteger/missingInteger.ts, src/algorithms/array/prefixSumRangeQuery/genomicRangeQuery.ts, src/algorithms/array/prefixSumRangeQuery/prefixSumRangeQuery.ts, src/algorithms/array/prefixSumRangeQuery/tapeEquilibrium.ts, src/algorithms/array/twoSum/twoSum.ts, src/algorithms/binary-search/binarySearch/binarySearch.ts, src/algorithms/binary-search/parametricBinarySearch/parametricBinarySearch.ts, src/algorithms/bit-manipulation/binaryGap/binaryGap.ts, src/algorithms/bit-manipulation/enumerateSubmasks/enumerateSubmasks.ts, src/algorithms/dp/knapsack01/knapsack01.ts, src/algorithms/etc/maxCounters/maxCounters.ts, src/algorithms/etc/numberOfDisintersection/numberOfDisintersection.ts, src/algorithms/graph-flow/kruskalMst/kruskalMst.ts, src/algorithms/graph/bfsShortestPath/bfsShortestPath.ts, src/algorithms/shortest-path/dijkstra/dijkstra.ts, src/algorithms/sorting/countingSort/countingSort.ts, src/algorithms/sorting/insertionSort/insertionSort.ts, src/algorithms/sorting/kthSmallest/kthSmallest.ts, src/algorithms/sorting/quicksort/quicksort.ts, src/algorithms/sorting/radixSort/radixSort.ts, tools/practice-ref.ts, tools/practice-ref.test.ts, tools/solutions-merge.ts, tools/solutions-merge.test.ts
---

# KAN-064-4YZZV2 — 실습 스텁에 새어 든 풀이 24편 되돌리기 — solutions 브랜치 병합 방향을 먼저 정한다

## 전략
**무엇이 문제인가.** 실습 스텁 24편이 `Not implemented` 를 던지지 않고 풀이를 담고 있다. 21편은 solutions 브랜치와 바이트까지 같고, 나머지 셋(maxProfit · genomicRangeQuery · tapeEquilibrium)은 KAN-060 S7 이 경로를 옮긴 것이라 solutions 에는 옛 경로로 같은 풀이가 있다. binaryGap 은 이력 어디에도 스텁 판이 없다(처음부터 풀이로 들어왔다).

**어떻게 새었나.** solutions 쪽 병합 커밋 `3aa95994`(2026-06-24, 「Merge branch 'main' into solutions」) 위에서 `feat/authoring-kit` 이 갈라졌고, 그 브랜치가 `d5591d11`(2026-08-04)로 main 에 병합되면서 solutions 의 풀이가 함께 들어왔다. 평소 흐름은 main→solutions 한 방향이다(최근 `fba671d3`).

**병합 방향 — main→solutions 한 방향을 유지하고, 되돌림을 넘기는 첫 병합 한 번만 풀이를 지킨다.** main 에서 24편을 스텁으로 되돌리면, solutions 쪽은 병합 기준점 이후 그 파일을 안 고쳤으므로 다음 `git merge main` 이 충돌 없이 스텁을 가져와 풀이를 덮는다. 그 병합 커밋에서 24편만 solutions 판으로 되살리면 기준점이 되돌림 뒤로 옮겨 가고, 그 뒤 병합은 평소대로 돈다. 이 되살림을 사람 기억에 맡기지 않도록 `tools/solutions-merge.ts` 가 한다 — 병합 결과에서 「solutions 쪽(첫째 부모)에서는 풀이였는데 병합 뒤 `Not implemented` 가 된 스텁」을 찾아 첫째 부모 판으로 되돌린다. 목록을 박지 않으므로 이번 24편만이 아니라 다음 누수에도 같은 규칙이 돈다.

**다시 새지 않게.** `tools/practice-ref.test.ts` 에 「스텁은 `Not implemented` 를 던진다」를 넣어, solutions 에서 갈라진 브랜치가 main 에 들어오면 CI(`bun test tools`)가 그 자리에서 잡는다.

**제약.** solutions 체크아웃(`/Users/centurio/code_test`)에는 유저의 미커밋 작업이 스테이징돼 있다(fenwickRangeSum · slidingWindowMaximum · deque · monotonicQueue). 그래서 이 카드는 solutions 브랜치를 직접 병합하지 않는다 — 도구와 모의 병합 결과까지 내고, 실제 병합은 유저가 그 체크아웃을 정리한 뒤 도구로 돌린다.

**버린 대안.** ① `.gitattributes` 의 `merge=ours` — 한쪽만 바뀐 파일에는 병합 드라이버가 불리지 않아 이번 경우를 못 막는다. ② solutions→main 방향으로 뒤집기 — 풀이가 main 에 들어오는 것이 곧 이번 누수다. ③ main 에서 되돌리고 병합은 그때 가서 손으로 — 한 번 잊으면 풀이 24편이 사라진다.

**scope 겹침 경고.** dep-check 가 KAN-039 와 24건 겹침을 내지만 KAN-039 쪽 글롭 `src/algorithms/*/huffman*/**` 에 24편 중 맞는 경로는 0개다(fnmatch 로 확인). 검사기의 오탐이다.

## 실행 계획
- [ ] `S1` 스텁 24편 되돌리기. 이력에 스텁 판이 있는 20편은 그 판(`fb61a7bd`·`3aa95994`)을 쓰고, 없는 넷(binaryGap · maxProfit · genomicRangeQuery · tapeEquilibrium)은 현재 시그니처를 두고 본문만 `throw new Error("Not implemented")` 로. 완료 기준: 24편 모두 `Not implemented` 를 던지고 export 이름·시그니처가 테스트 import 와 맞는다(`bunx tsc --noEmit` 통과), `bun run tools/practice-ref.ts` 실패 0
- [ ] `S2` 누수 가드 — `tools/practice-ref.test.ts` 에 스텁이 `Not implemented` 를 던지는지 검사를 더한다. 완료 기준: S1 전 트리에서 24건 실패, S1 뒤 0건
- [ ] `S3` 병합 도구 — `tools/solutions-merge.ts`(+test). 병합 결과에서 첫째 부모의 풀이가 스텁으로 바뀐 파일을 되살린다. 완료 기준: 임시 워크트리에서 solutions(`fba671d3`)에 이 브랜치를 병합하는 모의 실행으로 ① 도구 없이 병합하면 24편이 스텁이 되는 것 ② 도구를 거치면 24편 모두 solutions 판과 바이트 동일 ③ 그다음 main 에 변경을 하나 더 얹어 다시 병합해도 24편이 그대로인 것을 확인
- [ ] `S4` 전체 검증과 검토서. 완료 기준: `bun run tools/ci.ts all` 통과, 검토서에 모의 병합 결과와 유저가 solutions 에서 돌릴 명령을 싣는다

## 검증
- `bun run tools/ci.ts all` 통과(practice 모드의 미구현 실패는 정상)
- `bun test tools/practice-ref.test.ts` — 스텁 누수 0
- 모의 병합(S3): 도구를 거친 병합 뒤 `git diff fba671d3 -- <24편의 solutions 쪽 경로>` 가 비어 있다 — solutions 풀이 손실 0
- 24편 각각 `bun test <편>` 이 `Not implemented` 로 떨어진다

## 수행 내역
<!-- KANBAN:LOG append-only — 아래로만 덧붙인다. 위를 고치지 않는다. -->
- 2026-10-01T08:17 · s:9483b98c — `전략` 섹션 교체
- 2026-10-01T08:17 · s:9483b98c — `실행 계획` 섹션 교체
- 2026-10-01T08:17 · s:9483b98c — `검증` 섹션 교체
