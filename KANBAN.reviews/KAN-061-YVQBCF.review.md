---
card: KAN-061-YVQBCF
title: 알고리즘 실습 절·스텁 테스트 결함 약 40곳과 정본 결함 7건 정리 — KAN-058 전개 중 모은 목록
created: 2026-10-01
branch: KAN-061-YVQBCF
worktree: /Users/centurio/orca/workspaces/code_test/KAN-061-YVQBCF
base: ca0a4dc5
status: 검토 대기
---

# KAN-061-YVQBCF 검토 요청 — 알고리즘 실습 절·스텁 테스트 결함 약 40곳과 정본 결함 7건 정리 — KAN-058 전개 중 모은 목록

카드: [KAN-061-YVQBCF.md](../KANBAN.cards/KAN-061-YVQBCF.md)

> 이 문서는 **검토를 위한 산출물**이다. 수행 내역은 카드 실행 문서에 있고, 착수 전
> 계획은 배치 문서에 있다. 여기 있는 것은 "지금 이 브랜치를 무엇으로 판정하는가" 뿐이다.

## 1. 검토 대상

| 항목 | 값 |
|---|---|
| 브랜치 | `KAN-061-YVQBCF` |
| 워크트리 | `/Users/centurio/orca/workspaces/code_test/KAN-061-YVQBCF` |
| 베이스 | `ca0a4dc5` |
| 변경 훑기 | `git diff ca0a4dc5...HEAD` |

**커밋 12건**

```text
9bd13ab6 KAN-061 S6: 근거 파일 §3·§4 대조표 · ci all 통과
7dfe3825 kanban: KAN-061 S4·S5 완료
06b6b164 KAN-061 S5: 그래프·트리·기하·정렬·고급 갈래 실습 절·정본 주석
e827978b KAN-061 S4(정수론): 실습 절 처방·과장·계약 불일치, babyStepGiantStep 서로소로 좁힘
5bef3d30 KAN-061 S4(문자열): 실습 절 목표 복잡도·풀이 흘림·빈칸 시험
801ebf52 KAN-061: 비교 판 주석의 실습 지칭 세 곳 · scope 에 세 편 추가
cd22d34f KAN-061 S3: array·dp·bit 갈래 실습 절 결함
33243e90 KAN-061 S2: 틀린 기대값 9편 — 스텁 테스트와 실습 절을 한 쌍으로
e1f35b5f KAN-061 S1: 스텁 테스트를 정본에 물려 돌리는 검사(tools/practice-ref)
4427c9fa kanban: KAN-061 착수 결정 기록 · KAN-039 겹침 용인
6d227691 KAN-061 계획: 범위 50편으로 좁힘 · 전략·WBS(S1~S7)·검증 · 배치 3
a8838ebc kanban: KAN-061 진행 중으로 이동 · 실행 문서 생성(scope src/algorithms/**)
```

**변경 파일 80개 (+783 −223)**

| 파일 | 상태 | 추가 | 삭제 |
|---|:--:|---:|---:|
| `.kanban/archive.jsonl` | M | 3 | 0 |
| `.kanban/log.md` | M | 3 | 3 |
| `.kanban/state.json` | M | 98 | 41 |
| `KANBAN.batches/KAN-061-YVQBCF.batch1.md` | M | 39 | 0 |
| `KANBAN.batches/KAN-061-YVQBCF.batch2.md` | M | 35 | 0 |
| `KANBAN.batches/KAN-061-YVQBCF.batch3.md` | M | 35 | 0 |
| `KANBAN.batches/KAN-061-YVQBCF.ledger.md` | M | 71 | 0 |
| `KANBAN.board.html` | M | 4 | 4 |
| `KANBAN.cards/KAN-061-YVQBCF.md` | M | 55 | 0 |
| `KANBAN.md` | M | 11 | 10 |
| `src/algorithms/advanced/convexHullTrick/convexHullTrick-guide.md` | M | 3 | 3 |
| `src/algorithms/advanced/divideAndConquerDp/divideAndConquerDp-guide.md` | M | 1 | 1 |
| `src/algorithms/advanced/divideAndConquerDp/divideAndConquerDp.test.ts` | M | 12 | 0 |
| `src/algorithms/advanced/knuthOptimization/knuthOptimization-guide.md` | M | 3 | 3 |
| `src/algorithms/advanced/knuthOptimization/knuthOptimization.test.ts` | M | 2 | 2 |
| `src/algorithms/array/bestTimeToBuyAndSellStock/bestTimeToBuyAndSellStock-guide.md` | M | 2 | 2 |
| `src/algorithms/array/bestTimeToBuyAndSellStockK/bestTimeToBuyAndSellStockK-guide.md` | M | 1 | 1 |
| `src/algorithms/array/largestRectangleInHistogram/largestRectangleInHistogram.test.ts` | M | 4 | 10 |
| `src/algorithms/array/longestCommonSubsequence/longestCommonSubsequence-guide.md` | M | 2 | 2 |
| `src/algorithms/array/longestIncreasingSubsequence/longestIncreasingSubsequence-guide.md` | M | 3 | 3 |
| `src/algorithms/array/maximumProductSubarray/maximumProductSubarray-guide.md` | M | 1 | 1 |
| `src/algorithms/array/maximumProductSubarray/maximumProductSubarray.test.ts` | M | 4 | 0 |
| `src/algorithms/array/nextGreaterElement/nextGreaterElement-guide.alt.ts` | M | 1 | 1 |
| `src/algorithms/binary-search/parametricBinarySearch/parametricBinarySearch-guide.alt.ts` | M | 1 | 1 |
| `src/algorithms/binary-search/searchInRotatedSortedArray/searchInRotatedSortedArray-guide.md` | M | 3 | 3 |
| `src/algorithms/binary-search/searchInRotatedSortedArray/searchInRotatedSortedArray.test.ts` | M | 1 | 1 |
| `src/algorithms/bit-manipulation/enumerateSubmasks/enumerateSubmasks-guide.md` | M | 2 | 2 |
| `src/algorithms/bit-manipulation/matrixPowerFibonacci/matrixPowerFibonacci-guide.md` | M | 3 | 3 |
| `src/algorithms/bit-manipulation/matrixPowerFibonacci/matrixPowerFibonacci.test.ts` | M | 9 | 11 |
| `src/algorithms/bit-manipulation/singleNumberXor/singleNumberXor-guide.md` | M | 1 | 2 |
| `src/algorithms/bit-manipulation/singleNumberXor/singleNumberXor-guide.ref.ts` | M | 1 | 1 |
| `src/algorithms/dp/coinChangeWays/coinChangeWays-guide.md` | M | 2 | 1 |
| `src/algorithms/dp/matrixChainMultiplication/matrixChainMultiplication-guide.md` | M | 1 | 1 |
| `src/algorithms/dp/matrixChainMultiplication/matrixChainMultiplication.test.ts` | M | 2 | 2 |
| `src/algorithms/dp/palindromePartitioningMinCut/palindromePartitioningMinCut.test.ts` | M | 3 | 4 |
| `src/algorithms/dp/subsetSum/subsetSum-guide.md` | M | 1 | 1 |
| `src/algorithms/dp/unboundedKnapsack/unboundedKnapsack-guide.md` | M | 1 | 1 |
| `src/algorithms/geometry/pointInPolygon/pointInPolygon-guide.md` | M | 1 | 0 |
| `src/algorithms/geometry/pointInPolygon/pointInPolygon.test.ts` | M | 5 | 2 |
| `src/algorithms/geometry/polygonArea/polygonArea-guide.md` | M | 1 | 0 |
| `src/algorithms/geometry/polygonArea/polygonArea.test.ts` | M | 4 | 1 |
| `src/algorithms/geometry/rotatingCalipersDiameter/rotatingCalipersDiameter-guide.md` | M | 2 | 2 |
| `src/algorithms/graph-flow/kruskalMst/kruskalMst-guide.md` | M | 1 | 1 |
| `src/algorithms/graph-flow/kruskalMst/kruskalMst.test.ts` | M | 12 | 1 |
| `src/algorithms/graph-flow/primMst/primMst-guide.md` | M | 0 | 2 |
| `src/algorithms/graph/dfsTraversal/dfsTraversal-guide.ref.ts` | M | 2 | 2 |
| `src/algorithms/graph/undirectedCycleDetection/undirectedCycleDetection-guide.md` | M | 1 | 1 |
| `src/algorithms/number-theory/babyStepGiantStep/babyStepGiantStep-guide.md` | M | 6 | 5 |
| `src/algorithms/number-theory/babyStepGiantStep/babyStepGiantStep.test.ts` | M | 6 | 6 |
| `src/algorithms/number-theory/binomialModP/binomialModP-guide.md` | M | 4 | 4 |
| `src/algorithms/number-theory/crt/crt-guide.md` | M | 3 | 3 |
| `src/algorithms/number-theory/fastPower/fastPower.test.ts` | M | 1 | 1 |
| `src/algorithms/number-theory/isPrimeTrial/isPrimeTrial-guide.md` | M | 3 | 3 |
| `src/algorithms/number-theory/millerRabin/millerRabin-guide.md` | M | 2 | 2 |
| `src/algorithms/number-theory/pollardRho/pollardRho-guide.md` | M | 2 | 2 |
| `src/algorithms/shortest-path/aStarSearch/aStarSearch-guide.md` | M | 2 | 4 |
| `src/algorithms/shortest-path/dagShortestPath/dagShortestPath-guide.alt.ts` | M | 1 | 1 |
| `src/algorithms/sorting/externalMergeSort/externalMergeSort-guide.md` | M | 5 | 5 |
| `src/algorithms/sorting/externalMergeSort/externalMergeSort-guide.ref.ts` | M | 6 | 6 |
| `src/algorithms/sorting/externalMergeSort/externalMergeSort.test.ts` | M | 6 | 1 |
| `src/algorithms/sorting/topKFrequent/topKFrequent.test.ts` | M | 6 | 1 |
| `src/algorithms/string/ahoCorasick/ahoCorasick-guide.md` | M | 1 | 3 |
| `src/algorithms/string/ahoCorasick/ahoCorasick.test.ts` | M | 2 | 2 |
| `src/algorithms/string/findAllOccurrences/findAllOccurrences-guide.md` | M | 0 | 1 |
| `src/algorithms/string/findAllOccurrences/findAllOccurrences.test.ts` | M | 2 | 2 |
| `src/algorithms/string/kasaiLcp/kasaiLcp-guide.md` | M | 2 | 3 |
| `src/algorithms/string/longestPalindrome/longestPalindrome-guide.md` | M | 1 | 2 |
| `src/algorithms/string/radixTree/radixTree-guide.md` | M | 3 | 4 |
| `src/algorithms/string/radixTree/radixTree.test.ts` | M | 1 | 1 |
| `src/algorithms/string/suffixArray/suffixArray-guide.md` | M | 2 | 3 |
| `src/algorithms/string/suffixAutomaton/suffixAutomaton-guide.md` | M | 1 | 3 |
| `src/algorithms/string/trie/trie-guide.md` | M | 2 | 3 |
| `src/algorithms/tree/heavyLightDecomposition/heavyLightDecomposition-guide.md` | M | 4 | 4 |
| `src/algorithms/tree/heavyLightDecomposition/heavyLightDecomposition-guide.ref.ts` | M | 5 | 5 |
| `src/algorithms/tree/subtreeSumQuery/subtreeSumQuery-guide.md` | M | 4 | 4 |
| `src/algorithms/tree/subtreeSumQuery/subtreeSumQuery-guide.proof.ts` | M | 1 | 1 |
| `src/algorithms/tree/subtreeSumQuery/subtreeSumQuery-guide.ref.ts` | M | 3 | 3 |
| `src/algorithms/tree/treeDiameter/treeDiameter-guide.ref.ts` | M | 2 | 2 |
| `tools/practice-ref.test.ts` | M | 70 | 0 |
| `tools/practice-ref.ts` | M | 171 | 0 |

**롤백 태그 8개**

```text
kan/KAN-061-YVQBCF/S1
kan/KAN-061-YVQBCF/S2
kan/KAN-061-YVQBCF/S3
kan/KAN-061-YVQBCF/S4
kan/KAN-061-YVQBCF/S5
kan/KAN-061-YVQBCF/S6
kan/KAN-061-YVQBCF/batch1
kan/KAN-061-YVQBCF/batch2
```

## 2. 검증 — 기준과 실행 결과

<!-- 기준은 카드 실행 문서 「검증」 절의 사본이다. 정본은 KANBAN.cards/KAN-061-YVQBCF.md 이므로
     기준이 바뀌면 그쪽을 고치고 review-init --refresh 로 이 항만 다시 뜬다.
     결과는 착수한 쪽이 이미 돌린 것이다 — 검토자에게 다시 돌리라고 시키지 않는다.
     **다시 돌려 아래와 다르게 나오면 그 자체가 반려 사유다.** -->

**기준**

- `bun test tools/practice-ref.test.ts` — 스텁 테스트를 정본에 물려 돌린 결과 실패 0(제외 목록 5파일은 사유와 함께 건너뜀)
- `bun run tools/check-v2.ts` — 고친 편 전부 오류 0(P16 원고 코드 = 정본, P22 실습 절 구조)
- `bun run tools/check-citations.ts` — 인용 표류 0
- `bun run tools/ci.ts all` — 녹색
- 카드 문서의 대조표 — 근거 파일 §3·§4 의 모든 줄에 「고침」 또는 「사유」가 있다

**실행 결과**

```text
bun run tools/practice-ref.ts → 파일 117 · 시험 1443 · 실패 0 · 불러오기 실패 0 · 건너뜀 2(착수 전 실패 10)
bun run tools/check-v2.ts → 고친 원고 전부 종료코드 0
bun run tools/check-citations.ts → 대장 1241행과 지문이 모두 일치한다
bun run tools/ci.ts all → all 모드 통과 — 단계 20개
대조표 → 61줄, 빈 줄 0
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
python3 scripts/kanban.py review-judge <project-root> --card KAN-061-YVQBCF --item <번호> --verdict 승인
# 추가 의견
python3 scripts/kanban.py review-note <project-root> --card KAN-061-YVQBCF --item <번호> --text "<추가 의견>"
# 추가 의견을 반영하다 새 의견이 생겼으면 (맨 뒤에 붙어 앞 번호가 안 밀립니다)
python3 scripts/kanban.py review-item <project-root> --card KAN-061-YVQBCF --add "<주제>
  <상세>"
```

**전체 승인은 살아있는 항목이 전부 승인일 때만 섭니다**(철회는 분모에서 빠집니다). 하나라도
반려·추가 의견·미정이면 4항의 전체 승인도 `→ 완료` 이동도 종료코드 14로 거부됩니다.

- [ ] 스텁에 풀이가 든 24편을 새 카드로 뗄 것인가 — 이 카드에서는 건드리지 않았다
    - **배경**
      - 실습 스텁 24개가 미구현 오류를 던지지 않고 풀이를 담고 있다. 그중 21개는 solutions 브랜치의 같은 파일과 한 글자까지 같다. 원문: KANBAN.cards/KAN-061-YVQBCF.md 의 S1 수행 내역
      - 예로 든 bestTimeToBuyAndSellStockK 스텁의 마지막 변경은 커밋 3aa95994 「Merge branch 'main' into solutions」다. solutions 쪽 풀이가 병합으로 main 에 들어온 것이다.
      - main 에서 스텁을 빈 칸으로 되돌리면, 다음에 main 을 solutions 로 병합할 때 solutions 쪽 풀이가 빈 스텁으로 덮인다.
      - 학습자가 이 24편의 풀 파일을 열면 답이 이미 들어 있다. 실습 시험은 그대로 통과한다.
    - **정할 것**
      스텁 24편을 되돌리는 일을 어디서 할 것인가.

    | 선택지 | 대가 | 그러면 어떻게 되는가 |
    | --- | --- | --- |
    | **추천** 새 카드로 뗀다 | 이 카드가 끝나도 24편은 답이 든 채 남는다 | solutions 브랜치를 어떻게 병합할지 먼저 정하고, 그 방식에 맞춰 한 번에 되돌린다 |
    | 이 카드에서 되돌린다 | 다음 병합 때 solutions 쪽 풀이가 덮일 수 있다 | 실습은 바로 제 구실을 하지만 풀이를 따로 지켜야 한다 |
    | 그대로 둔다 | 24편이 실습 구실을 못 한다 | 할 일이 없다 |

    > **판정** — _아직 없습니다._

    > **추가 의견** — _아직 없습니다._

- [ ] 정본을 고치지 않고 실습 범위를 좁힌 네 편을 이대로 둘 것인가 — 원고가 한계를 이미 밝힌 편이라 실습을 정본이 맞는 범위로 좁혔다
    - **배경**
      - matrixPowerFibonacci: 실습 상한이 n ≤ 10^18 이었는데 그 답은 메모리에 담을 수 없다. 원고가 「정본은 n = 10^6 까지 실행한다」고 이미 적어 두어 실습 상한을 10^6 으로 낮췄다. 원문: src/algorithms/bit-manipulation/matrixPowerFibonacci/matrixPowerFibonacci-guide.md:806
      - convexHullTrick: 실습 범위 |b| ≤ 10^18 에서 정본의 배정밀도 계산이 틀린다. 원고가 그 한계를 값으로 보이는 절이 있어 실습을 |b| ≤ 10^9 로 좁혔다. 그래서 파트 1 이 말하는 과제 범위와 실습 범위가 이제 다르다. 원문: KANBAN.batches/KAN-061-YVQBCF.ledger.md
      - babyStepGiantStep: 정본은 a 와 m 이 서로소일 때만 맞는다. 원고가 과제를 서로소로 고정했으므로 실습도 서로소로 좁히고, 서로소가 아닌 시험 둘을 서로소 시험으로 바꿨다.
      - coinChangeWays: 같은 액면가가 두 번 들어오면 정본이 조합을 두 번 센다. 실습 제약에 「액면가는 서로 다르다」를 더했다.
    - **정할 것**
      네 편을 실습을 좁힌 채로 둘 것인가.

    | 선택지 | 대가 | 그러면 어떻게 되는가 |
    | --- | --- | --- |
    | **추천** 이대로 둔다 | 실습이 다루는 입력이 조금 줄어든다 | 원고와 정본과 실습이 같은 범위를 말한다 |
    | 정본을 넓힌다 | 원고의 코드와 단계별 따라가기, 증명과 그림을 다시 뽑아야 한다 | 편마다 원고를 다시 쓰는 규모의 작업이 된다 |

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
     `review-judge --card KAN-061-YVQBCF --verdict 승인` 이 이 자리를 쓰고
     frontmatter 의 status 도 함께 고친다. 손으로 적어도 되지만, 그때는 수렴 검사를
     안 거치므로 `validate` 가 항목 판정과 어긋난 승인을 error 로 잡는다. -->

**판정**: (아직 없습니다)

**판정 이력**:

- 승인이면 → `apply --op move --id KAN-061-YVQBCF --to done` 뒤에 `main` 병합과 워크트리 정리(출력의 `cleanup`)
- 반려면 → `apply --op move --id KAN-061-YVQBCF --to doing` 뒤에 `doc-log --entry "<반려 사유>"`.
  요청서는 **지우지도 다시 뜨지도 않는다** — 고친 뒤 그 항목을 `review-judge --verdict 승인` 으로
  뒤집으면 같은 문서에서 수렴한다. 1·2항이 낡았으면 `review-init --refresh` 로 그 두 항만 간다.
