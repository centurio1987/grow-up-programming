---
card: KAN-064-4YZZV2
title: 실습 스텁에 새어 든 풀이 24편 되돌리기 — solutions 브랜치 병합 방향을 먼저 정한다
created: 2026-10-01
branch: KAN-064-4YZZV2
worktree: /Users/centurio/orca/workspaces/code_test/KAN-064-4YZZV2
base: d61a1b8a
status: 검토 대기
---

# KAN-064-4YZZV2 검토 요청 — 실습 스텁에 새어 든 풀이 24편 되돌리기 — solutions 브랜치 병합 방향을 먼저 정한다

카드: [KAN-064-4YZZV2.md](../KANBAN.cards/KAN-064-4YZZV2.md)

> 이 문서는 **검토를 위한 산출물**이다. 수행 내역은 카드 실행 문서에 있고, 착수 전
> 계획은 배치 문서에 있다. 여기 있는 것은 "지금 이 브랜치를 무엇으로 판정하는가" 뿐이다.

## 1. 검토 대상

| 항목 | 값 |
|---|---|
| 브랜치 | `KAN-064-4YZZV2` |
| 워크트리 | `/Users/centurio/orca/workspaces/code_test/KAN-064-4YZZV2` |
| 베이스 | `d61a1b8a` |
| 변경 훑기 | `git diff d61a1b8a...HEAD` |

**커밋 8건**

```text
e86c8d56 KAN-064 S4: ci all 통과
799951a6 KAN-064 S5: solutions 에 병합(93876975) — 풀이 24편 보존
911373ed kanban: KAN-064 실행 계획에 S5(solutions 실제 병합) 추가
da0c0b80 KAN-064 S3: solutions-merge 도구 — main 병합 때 solutions 풀이를 스텁으로 덮지 않는다
64373179 KAN-064 S2: 스텁 누수 가드 — 풀이가 든 실습 스텁을 CI 가 잡는다
19fccc13 KAN-064 S1: 실습 스텁 24편을 Not implemented 로 되돌린다
81b3c86f kanban: KAN-039↔KAN-064 scope 겹침 용인(검사기 오탐, 유저 승인)
6f1ed0b4 KAN-064 착수: 실행 문서(전략·WBS·검증) · 배치1 · 계획 리포트 · 진행 중으로 이동
```

**변경 파일 36개 (+1006 −934)**

| 파일 | 상태 | 추가 | 삭제 |
|---|:--:|---:|---:|
| `.kanban/archive.jsonl` | M | 2 | 0 |
| `.kanban/log.md` | M | 2 | 2 |
| `.kanban/state.json` | M | 62 | 25 |
| `KANBAN.batches/KAN-064-4YZZV2.batch1.md` | M | 47 | 0 |
| `KANBAN.board.html` | M | 4 | 4 |
| `KANBAN.cards/KAN-064-4YZZV2.md` | M | 56 | 0 |
| `KANBAN.md` | M | 12 | 10 |
| `KANBAN.reports/KAN-064-4YZZV2.report.html` | M | 490 | 0 |
| `src/algorithms/array/bestTimeToBuyAndSellStock/bestTimeToBuyAndSellStock.ts` | M | 1 | 16 |
| `src/algorithms/array/bestTimeToBuyAndSellStock/maxProfit.ts` | M | 1 | 48 |
| `src/algorithms/array/bestTimeToBuyAndSellStockK/bestTimeToBuyAndSellStockK.ts` | M | 1 | 26 |
| `src/algorithms/array/houseRobber/houseRobber.ts` | M | 1 | 43 |
| `src/algorithms/array/missingInteger/missingInteger.ts` | M | 1 | 8 |
| `src/algorithms/array/prefixSumRangeQuery/genomicRangeQuery.ts` | M | 1 | 64 |
| `src/algorithms/array/prefixSumRangeQuery/prefixSumRangeQuery.ts` | M | 2 | 17 |
| `src/algorithms/array/prefixSumRangeQuery/tapeEquilibrium.ts` | M | 2 | 14 |
| `src/algorithms/array/twoSum/twoSum.ts` | M | 1 | 16 |
| `src/algorithms/binary-search/binarySearch/binarySearch.ts` | M | 1 | 24 |
| `src/algorithms/binary-search/parametricBinarySearch/parametricBinarySearch.ts` | M | 2 | 51 |
| `src/algorithms/bit-manipulation/binaryGap/binaryGap.ts` | M | 1 | 20 |
| `src/algorithms/bit-manipulation/enumerateSubmasks/enumerateSubmasks.ts` | M | 1 | 30 |
| `src/algorithms/dp/knapsack01/knapsack01.ts` | M | 1 | 24 |
| `src/algorithms/etc/maxCounters/maxCounters.ts` | M | 1 | 47 |
| `src/algorithms/etc/numberOfDisintersection/numberOfDisintersection.ts` | M | 1 | 38 |
| `src/algorithms/graph-flow/kruskalMst/kruskalMst.ts` | M | 3 | 73 |
| `src/algorithms/graph/bfsShortestPath/bfsShortestPath.ts` | M | 1 | 65 |
| `src/algorithms/shortest-path/dijkstra/dijkstra.ts` | M | 6 | 117 |
| `src/algorithms/sorting/countingSort/countingSort.ts` | M | 1 | 15 |
| `src/algorithms/sorting/insertionSort/insertionSort.ts` | M | 1 | 20 |
| `src/algorithms/sorting/kthSmallest/kthSmallest.ts` | M | 1 | 40 |
| `src/algorithms/sorting/quicksort/quicksort.ts` | M | 4 | 41 |
| `src/algorithms/sorting/radixSort/radixSort.ts` | M | 1 | 31 |
| `tools/practice-ref.test.ts` | M | 19 | 3 |
| `tools/practice-ref.ts` | M | 28 | 2 |
| `tools/solutions-merge.test.ts` | M | 83 | 0 |
| `tools/solutions-merge.ts` | M | 164 | 0 |

**롤백 태그 5개**

```text
kan/KAN-064-4YZZV2/S1
kan/KAN-064-4YZZV2/S2
kan/KAN-064-4YZZV2/S3
kan/KAN-064-4YZZV2/S4
kan/KAN-064-4YZZV2/S5
```

## 2. 검증 — 기준과 실행 결과

<!-- 기준은 카드 실행 문서 「검증」 절의 사본이다. 정본은 KANBAN.cards/KAN-064-4YZZV2.md 이므로
     기준이 바뀌면 그쪽을 고치고 review-init --refresh 로 이 항만 다시 뜬다.
     결과는 착수한 쪽이 이미 돌린 것이다 — 검토자에게 다시 돌리라고 시키지 않는다.
     **다시 돌려 아래와 다르게 나오면 그 자체가 반려 사유다.** -->

**기준**

- `bun run tools/ci.ts all` 통과(practice 모드의 미구현 실패는 정상)
- `bun test tools/practice-ref.test.ts` — 스텁 누수 0
- 모의 병합(S3): 도구를 거친 병합 뒤 `git diff fba671d3 -- <24편의 solutions 쪽 경로>` 가 비어 있다 — solutions 풀이 손실 0
- 24편 각각 `bun test <편>` 이 `Not implemented` 로 떨어진다

**실행 결과**

```text
bun run tools/ci.ts all — all 모드 통과, 단계 20개(③ 실습 채점의 미구현 실패는 판정 제외)
bun run tools/practice-ref.ts — 파일 117 · 시험 1,443 · 실패 0 · 스텁 누수 0 (되돌리기 전 트리에서는 누수 24)
bun test tools/solutions-merge.test.ts — 2 pass(도구 없는 병합은 풀이를 덮고, 도구를 거치면 남고, 그다음 병합에서도 남는다)
solutions 실제 병합 93876975 — 되살린 풀이 24(경로 이동 3 포함), 병합 전 solutions(7288f68a) 판과 바이트 불일치 0, 병합 전 풀이였던 파일 중 스텁이 된 것 0
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
python3 scripts/kanban.py review-judge <project-root> --card KAN-064-4YZZV2 --item <번호> --verdict 승인
# 추가 의견
python3 scripts/kanban.py review-note <project-root> --card KAN-064-4YZZV2 --item <번호> --text "<추가 의견>"
# 추가 의견을 반영하다 새 의견이 생겼으면 (맨 뒤에 붙어 앞 번호가 안 밀립니다)
python3 scripts/kanban.py review-item <project-root> --card KAN-064-4YZZV2 --add "<주제>
  <상세>"
```

**전체 승인은 살아있는 항목이 전부 승인일 때만 섭니다**(철회는 분모에서 빠집니다). 하나라도
반려·추가 의견·미정이면 4항의 전체 승인도 `→ 완료` 이동도 종료코드 14로 거부됩니다.

- [ ] solutions 병합의 충돌 파일 spec.json 을 main 쪽 삭제로 풀었다 — solutions 쪽 수정은 이력에만 남는다
    - **배경**
      - solutions 에 병합할 때 스텁과 무관한 충돌이 하나 났다. 파일은 문제 문서 집필 규칙(.claude/authoring/specs/problem/spec.json)이다. 원문: KANBAN.cards/KAN-064-4YZZV2.md 의 S5 수행 내역
      - main 은 문제 문서를 없애면서 이 규칙 파일도 지웠다(KAN-060 S3, 커밋 298c12be).
      - solutions 에서는 그 파일에 ORD-005 강화 항목(자료구조 가이드 재집필 규칙)을 옮겨 적은 커밋이 있었다(1d5fd580). main 에는 없는 커밋이다.
      - main 쪽 삭제를 따랐으므로 그 수정은 solutions 의 현재 파일에서는 사라지고 git 이력에만 남는다.
    - **정할 것**
      이 충돌 해결을 그대로 둘 것인가.

    | 선택지 | 대가 | 그러면 어떻게 되는가 |
    | --- | --- | --- |
    | **추천** 그대로 둔다 | 퇴역한 규칙 파일에 적었던 강화 항목이 파일로는 안 남는다 | solutions 가 main 과 같은 규칙 구성을 따른다 |
    | 파일을 solutions 에 되살린다 | 쓰는 곳 없는 규칙 파일이 solutions 에만 남는다 | 다음 병합에서도 같은 충돌이 되풀이될 수 있다 |

    > **판정** — _아직 없습니다._

    > **추가 의견** — _아직 없습니다._

- [ ] solutions 에 main 에는 없는 비풀이 커밋이 섞여 있다 — 이 카드에서는 건드리지 않았다
    - **배경**
      - solutions 에만 있는 커밋 가운데 풀이가 아닌 것이 있다. 예: 가이드 인덱스 훅(807bc7b9 · c4555102), 가이드 재집필(0adb1fc2 · b494a300), 자료구조 스텁·테스트 계약 변경(dcd37711 · b83a1d5b). 원문: git log main..solutions
      - 이번 누수도 solutions 위에서 갈라진 브랜치가 main 에 들어오면서 생겼다. 이런 커밋을 main 으로 가져오려고 solutions 에서 가지를 내면 같은 일이 되풀이된다.
      - 이번에 넣은 누수 가드가 스텁의 풀이는 CI 에서 잡는다. 풀이가 아닌 커밋이 어디로 가야 하는지까지는 판단하지 못한다.
      - 풀이 분석 문서(*-analysis.md) 12편과 _scratch 파일도 main 에 들어 있다. 풀이 코드를 설명하는 글이라 답이 드러나는 것은 같다.
    - **정할 것**
      이 둘을 새 카드로 뗄 것인가.

    | 선택지 | 대가 | 그러면 어떻게 되는가 |
    | --- | --- | --- |
    | **추천** 새 카드로 뗀다 | 이 카드가 끝나도 분석 문서는 main 에 남는다 | 비풀이 커밋을 main 으로 옮기는 길과 분석 문서의 자리를 따로 정한다 |
    | 그대로 둔다 | 분석 문서로 답이 보이고 비풀이 커밋은 solutions 에만 남는다 | 할 일이 없다 |

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
     `review-judge --card KAN-064-4YZZV2 --verdict 승인` 이 이 자리를 쓰고
     frontmatter 의 status 도 함께 고친다. 손으로 적어도 되지만, 그때는 수렴 검사를
     안 거치므로 `validate` 가 항목 판정과 어긋난 승인을 error 로 잡는다. -->

**판정**: (아직 없습니다)

**판정 이력**:

- 승인이면 → `apply --op move --id KAN-064-4YZZV2 --to done` 뒤에 `main` 병합과 워크트리 정리(출력의 `cleanup`)
- 반려면 → `apply --op move --id KAN-064-4YZZV2 --to doing` 뒤에 `doc-log --entry "<반려 사유>"`.
  요청서는 **지우지도 다시 뜨지도 않는다** — 고친 뒤 그 항목을 `review-judge --verdict 승인` 으로
  뒤집으면 같은 문서에서 수렴한다. 1·2항이 낡았으면 `review-init --refresh` 로 그 두 항만 간다.
