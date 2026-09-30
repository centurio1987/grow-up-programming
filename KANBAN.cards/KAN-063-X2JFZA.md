---
card: KAN-063-X2JFZA
title: 그림 무대·증명 도구 개선 후보 — KAN-058 전개 중 모인 한계 목록
created: 2026-10-01
scope: src/_viz/**, tools/check-proof.ts, tools/check-proof.test.ts, tools/check-v2.ts, tools/check-v2.test.ts, sandbox/algo-guide-v2/SPEC.md, src/algorithms/advanced/convexHullTrick/**, src/algorithms/advanced/meetInTheMiddleSubsetSum/**, src/algorithms/advanced/nQueens/**, src/algorithms/array/diffArrayRangeUpdate/**, src/algorithms/array/houseRobber/**, src/algorithms/array/longestIncreasingSubsequence/**, src/algorithms/array/longestSubarrayAtMostSum/**, src/algorithms/array/nextGreaterElement/**, src/algorithms/array/subarraySumEqualsK/**, src/algorithms/binary-search/searchInRotatedSortedArray/**, src/algorithms/binary-search/ternarySearch/**, src/algorithms/bit-manipulation/binaryGap/**, src/algorithms/bit-manipulation/enumerateSubmasks/**, src/algorithms/bit-manipulation/lowestSetBit/**, src/algorithms/dp/expectedValueDp/**, src/algorithms/dp/palindromePartitioningMinCut/**, src/algorithms/dp/subsetSum/**, src/algorithms/dp/treeMaxIndependentSet/**, src/algorithms/graph-flow/maxFlow/**, src/algorithms/graph/connectedComponents/**, src/algorithms/graph/countIslands/**, src/algorithms/graph/dfsTraversal/**, src/algorithms/number-theory/babyStepGiantStep/**, src/algorithms/number-theory/extendedEuclidean/**, src/algorithms/number-theory/fftMultiply/**, src/algorithms/number-theory/gcd/**, src/algorithms/number-theory/isPrimeTrial/**, src/algorithms/number-theory/pollardRho/**, src/algorithms/number-theory/sieveOfEratosthenes/**, src/algorithms/sorting/insertionSort/**, src/algorithms/sorting/kthSmallest/**, src/algorithms/sorting/quicksort/**, src/algorithms/sorting/radixSort/**, src/algorithms/sorting/sortArray/**, src/algorithms/string/findAllOccurrences/**, src/algorithms/string/radixTree/**
---

# KAN-063-X2JFZA — 그림 무대·증명 도구 개선 후보 — KAN-058 전개 중 모인 한계 목록

## 전략
카드 메모: 목록 정본: KANBAN.batches/KAN-058-8XT6PC.s11-findings.md §7. KAN-058 검토 7

지시 원문은 `KANBAN.md` 카드의 `원문:` 블록에 있다(중복 보관하지 않음).

### 무엇을 하는가

§7 후보는 아홉 갈래다. 갈래마다 **고친다 · 규약으로 올린다 · 버린다(사유)** 셋 중 하나로 닫고, 그 처분을 근거 파일 §7 옆에 표로 남긴다. 목표 문장(「후보마다 처리하거나 버린 사유가 적히고, 무대를 넓힌 경우 그 무대를 쓰는 편의 그림을 다시 뽑아 render-figs --check 가 통과한다」)이 완료 조건이다.

### 원칙

- **무대는 선택 필드를 더하는 쪽으로만 넓힌다.** 기본값을 안 바꾸면 무대를 쓰는 115편 중 해당 편 밖의 그림은 바이트 그대로이고, `render-figs --check` 가 그것을 확인한다. 예외는 「아직 안 쓴 칸을 밖으로 칠하는 것」 하나다 — SPEC §13 상태표(아직 = 채움과 값 없음, 밖 = 질의 밖 배열 칸)와 코드가 어긋난 버그라 기본값을 고치고, 바뀌는 6편을 다시 뽑는다.
- **소비자가 없는 무대는 만들지 않는다.** 힙 무대는 SPEC §13 표에 한 줄이 있지만 쓰는 편이 없다. dijkstra 는 「힙 모양 자체가 필요할 때」 만들기로 규약을 세우고 큐 띠 둘로 그렸고, primMst·medianFromDataStream·topKFrequent 가 그 규약을 따른다. 100~150줄을 들여 아무 그림도 안 바뀌는 무대를 세우는 것은 공회전이다 → 버린다.
- **잠재 결함도 시험으로 막는다.** 증명 도구의 「펜스로 시작한 블록 뒤 닫는 마커 무시」는 지금 17곳 모두 사이 줄이 비어 있어 드러난 피해가 없다. 그래도 SPEC §12 L47 이 「닫는 마커까지 대조한다」고 적어 두었으므로 코드를 SPEC 에 맞추고 시험을 단다.
- **저장소 밖은 고치지 않는다.** 스캐너 오탐 셋 중 P4 느낌표와 천 단위 쉼표는 authoring-kit 플러그인(`scan_ai_style.py`)의 것이다. 여러 프로젝트가 함께 쓰는 파일이라 이 카드에서 고치지 않고, 재현 결과와 두 줄 수정안을 검토 판단 항목으로 올린다. P21 「최저가」 는 저장소의 `tools/check-v2.ts` 라 여기서 고친다.
- **「견주다」 는 넘긴다.** 알고리즘 편은 0곳이고 남은 124곳(19편)은 자료구조 가이드다. 자료구조 가이드는 KAN-036 이 새로 쓰므로, 받는 자리로 KAN-036 카드 메모에 한 줄을 남긴다.
- **확인 안 한 주장 11건은 재거나 출처를 대거나 문장을 낮춘다.** 잴 수 있는 것(Bun 스택 한도·재귀 깊이·바이트 산수)은 명령과 출력을 수행 내역에 남기고, 잴 수 없는 것은 「어림」 으로 적힌 대로 두되 그 사실을 처분표에 적는다.

### 버린 대안

- 스택 비슷한 layer 를 쓰는 다른 5편(largestRectangleInHistogram 등)을 새 `strips` 로 옮기기 — 강제가 아니고 그 편들은 규약상 틀리지 않았다. nextGreaterElement 한 편만 옮긴다.
- gcd 만 고치는 opt-in 플래그 — 같은 버그가 6편에 있으므로 기본값을 고치는 편이 옳다.

## 실행 계획
- [ ] `S1` 증명 도구: 펜스로 시작한 증명 블록도 닫는 마커까지 대조한다 — 완료 기준: `tools/check-proof.test.ts` 에 「펜스 + 닫는 마커 + 사이 문장」 시험이 붙어 통과하고, 기존 17곳이 그대로 통과한다. SPEC §0 에 한 문장
- [ ] `S2` 배열 무대 선택 필드: `indexLabel` · 아직 안 쓴 칸(null)을 밖으로 칠하지 않기 · `later` · `ArrayLayer.out` · `ArrayLayer.range` · `strips` — 완료 기준: StepPlayer 시험이 필드마다 하나씩 붙고, SPEC §13 에 필드가 적힌다
- [ ] `S3` CellStageFilm 머리 폭을 장 전체에서 하나로 — 완료 기준: 어긋나던 6장(4편)의 칸 열이 맞고 나머지 필름은 바이트 그대로(render-figs --check)
- [ ] `S4` 넓힌 무대를 쓰는 편 반영과 재출력: binaryGap·enumerateSubmasks·lowestSetBit(자리) · gcd 외 5편(아직/밖) · convexHullTrick · isPrimeTrial · meetInTheMiddleSubsetSum · nextGreaterElement · S3 의 4편 — 완료 기준: `bun run tools/render-figs.ts --check` 통과
- [ ] `S5` 규약 없이 정한 자리 9편: 편마다 고치거나 SPEC §13 에 규약으로 올린다 — 완료 기준: 9편 각각의 처분이 처분표에 있고, 고친 편은 재출력 후 --check 통과
- [ ] `S6` 그림 품질: radixTree 세로 1254px · subsetSum 참 칸 · nQueens 판을 table 무대로 — 완료 기준: radixTree 그림이 책 본문 높이(약 896px) 안, subsetSum 참/거짓이 눈으로 갈리고, nQueens 가 손그림 대신 패널로 그린다
- [ ] `S7` 편 안에서 확인하지 않은 주장 11건: 재고 출처를 대거나 문장을 낮춘다 — 완료 기준: 건마다 명령·출력 또는 출처가 수행 내역에 있고, 본문이 그 결과와 맞는다
- [ ] `S8` 스캐너 P21 「최저가」 오탐 수정(check-v2) + 시험 · 플러그인 쪽 둘(P4 주석 마커 · 천 단위 쉼표)은 재현 결과와 수정안만 기록 — 완료 기준: bestTimeToBuyAndSellStock 의 P21 경고 4건이 사라지고 시험이 통과
- [ ] `S9` 처분표와 넘김: 근거 파일 §7 처분표(아홉 갈래 전부) · 힙 무대 버린 사유 · 「견주다」 를 KAN-036 메모로 · 검사 공백은 KAN-058 S10 에서 닫힘 — 완료 기준: §7 모든 줄에 처분이 있다
- [ ] `S10` 게이트와 검토서 — 완료 기준: `bun run tools/ci.ts gates` 통과, 검토서 발행

## 검증
- `bun run tools/render-figs.ts --check` — 「그림 사이드카가 있는 가이드 115편 / 대상 115편」 대조 통과
- `bun test tools/check-proof.test.ts tools/check-v2.test.ts` 와 StepPlayer·CellStage 시험 통과
- `bun run tools/ci.ts gates` 통과(도구 자기시험 포함)
- `bun run tools/check-v2.ts src/algorithms/array/bestTimeToBuyAndSellStock/bestTimeToBuyAndSellStock-guide.md` 에 P21 경고 0
- 근거 파일 §7 의 모든 줄에 처분(고침 · 규약 · 버림+사유 · 넘김+받는 자리)이 적혀 있다

## 수행 내역
<!-- KANBAN:LOG append-only — 아래로만 덧붙인다. 위를 고치지 않는다. -->
- 2026-10-01T07:20 · s:df6b517e — `전략` 섹션 교체
- 2026-10-01T07:20 · s:df6b517e — `실행 계획` 섹션 교체
- 2026-10-01T07:20 · s:df6b517e — `검증` 섹션 교체
