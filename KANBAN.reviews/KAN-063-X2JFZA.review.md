---
card: KAN-063-X2JFZA
title: 그림 무대·증명 도구 개선 후보 — KAN-058 전개 중 모인 한계 목록
created: 2026-10-01
branch: KAN-063-X2JFZA
worktree: /Users/centurio/orca/workspaces/code_test/KAN-063-X2JFZA
base: ca0a4dc5
status: 검토 대기
---

# KAN-063-X2JFZA 검토 요청 — 그림 무대·증명 도구 개선 후보 — KAN-058 전개 중 모인 한계 목록

카드: [KAN-063-X2JFZA.md](../KANBAN.cards/KAN-063-X2JFZA.md)

> 이 문서는 **검토를 위한 산출물**이다. 수행 내역은 카드 실행 문서에 있고, 착수 전
> 계획은 배치 문서에 있다. 여기 있는 것은 "지금 이 브랜치를 무엇으로 판정하는가" 뿐이다.

## 1. 검토 대상

| 항목 | 값 |
|---|---|
| 브랜치 | `KAN-063-X2JFZA` |
| 워크트리 | `/Users/centurio/orca/workspaces/code_test/KAN-063-X2JFZA` |
| 베이스 | `ca0a4dc5` |
| 변경 훑기 | `git diff ca0a4dc5...HEAD` |

**커밋 7건**

```text
2cb23d97 KAN-063 배치3: check-v2 P21 값 명사 오탐 · P1 펜스 뒤 닫힌 증명 문장 · §7 처분표
8878c8be KAN-063 배치2: 무대 필드 반영 7편 · 규약 없던 자리 9편 · 그림 품질 셋 · 확인 안 한 주장 10건
aa5465e1 KAN-063 배치2 계획
4b857d7a KAN-063 배치1: 증명 블록 펜스 뒤 닫는 마커 대조 · 배열 무대 선택 필드 다섯과 아직/밖 수정 · 칸 필름 공통 머리 폭
723e8005 KAN-063 배치 셋 계획(병렬 에이전트) · KAN-039 겹침 용인 기록
2dbe9e5b KAN-063 실행 문서: 전략·실행 계획(S1~S10)·검증 · scope 36편으로 좁힘
cc50f10c kanban: KAN-063 진행 중으로 이동
```

**변경 파일 100개 (+2392 −2121)**

| 파일 | 상태 | 추가 | 삭제 |
|---|:--:|---:|---:|
| `.kanban/archive.jsonl` | M | 2 | 0 |
| `.kanban/log.md` | M | 2 | 2 |
| `.kanban/state.json` | M | 75 | 24 |
| `KANBAN.batches/KAN-058-8XT6PC.s11-findings.md` | M | 2 | 0 |
| `KANBAN.batches/KAN-063-X2JFZA.batch1.md` | M | 50 | 0 |
| `KANBAN.batches/KAN-063-X2JFZA.batch2.md` | M | 56 | 0 |
| `KANBAN.batches/KAN-063-X2JFZA.batch3.md` | M | 74 | 0 |
| `KANBAN.batches/KAN-063-X2JFZA.probes/quicksort-stack.ts` | M | 19 | 0 |
| `KANBAN.board.html` | M | 4 | 4 |
| `KANBAN.cards/KAN-034.8-BK1Q3A.md` | M | 1 | 1 |
| `KANBAN.cards/KAN-035-31T4BY.md` | M | 2 | 2 |
| `KANBAN.cards/KAN-059-PSFTN4.md` | M | 1 | 1 |
| `KANBAN.cards/KAN-063-X2JFZA.md` | M | 77 | 0 |
| `KANBAN.md` | M | 11 | 10 |
| `sandbox/algo-guide-v2/FEEDBACK.md` | M | 2 | 2 |
| `sandbox/algo-guide-v2/SPEC.md` | M | 6 | 6 |
| `src/_viz/patterns.test.tsx` | M | 37 | 0 |
| `src/_viz/patterns/CellStage.tsx` | M | 31 | 9 |
| `src/_viz/player/StepPlayer.tsx` | M | 12 | 1 |
| `src/_viz/player/arrayStage.test.ts` | M | 99 | 0 |
| `src/_viz/player/arrayStage.ts` | M | 97 | 3 |
| `src/algorithms/advanced/convexHullTrick/convexHullTrick-guide.fig.tsx` | M | 3 | 1 |
| `src/algorithms/advanced/convexHullTrick/convexHullTrick-guide.md` | M | 1 | 1 |
| `src/algorithms/advanced/convexHullTrick/convexHullTrick-guide.sim.ts` | M | 17 | 1 |
| `src/algorithms/advanced/convexHullTrick/figs/walk-hull.svg` | M | 1 | 1 |
| `src/algorithms/advanced/meetInTheMiddleSubsetSum/figs/walk-mitm.svg` | M | 2 | 2 |
| `src/algorithms/advanced/meetInTheMiddleSubsetSum/meetInTheMiddleSubsetSum-guide.fig.tsx` | M | 6 | 0 |
| `src/algorithms/advanced/meetInTheMiddleSubsetSum/meetInTheMiddleSubsetSum-guide.md` | M | 1 | 1 |
| `src/algorithms/advanced/meetInTheMiddleSubsetSum/meetInTheMiddleSubsetSum-guide.sim.ts` | M | 27 | 1 |
| `src/algorithms/advanced/nQueens/figs/walk-board.svg` | M | 2 | 2 |
| `src/algorithms/advanced/nQueens/nQueens-guide.fig.tsx` | M | 92 | 70 |
| `src/algorithms/advanced/nQueens/nQueens-guide.md` | M | 5 | 4 |
| `src/algorithms/advanced/nQueens/nQueens-guide.sim.ts` | M | 494 | 699 |
| `src/algorithms/array/diffArrayRangeUpdate/figs/walk-run.svg` | M | 1 | 1 |
| `src/algorithms/array/houseRobber/houseRobber-guide.md` | M | 3 | 1 |
| `src/algorithms/array/longestIncreasingSubsequence/figs/build-confuse.svg` | M | 1 | 1 |
| `src/algorithms/array/longestIncreasingSubsequence/figs/walk-lis.svg` | M | 1 | 1 |
| `src/algorithms/array/longestIncreasingSubsequence/longestIncreasingSubsequence-guide.fig.tsx` | M | 7 | 11 |
| `src/algorithms/array/longestIncreasingSubsequence/longestIncreasingSubsequence-guide.md` | M | 3 | 3 |
| `src/algorithms/array/longestIncreasingSubsequence/longestIncreasingSubsequence-guide.sim.ts` | M | 53 | 67 |
| `src/algorithms/array/nextGreaterElement/nextGreaterElement-guide.fig.tsx` | M | 27 | 24 |
| `src/algorithms/array/nextGreaterElement/nextGreaterElement-guide.sim.ts` | M | 85 | 112 |
| `src/algorithms/array/subarraySumEqualsK/subarraySumEqualsK-guide.md` | M | 5 | 2 |
| `src/algorithms/binary-search/searchInRotatedSortedArray/figs/walk-descent.svg` | M | 1 | 1 |
| `src/algorithms/binary-search/searchInRotatedSortedArray/figs/walk-miss.svg` | M | 1 | 1 |
| `src/algorithms/bit-manipulation/binaryGap/binaryGap-guide.sim.ts` | M | 1 | 0 |
| `src/algorithms/bit-manipulation/enumerateSubmasks/enumerateSubmasks-guide.sim.ts` | M | 1 | 0 |
| `src/algorithms/bit-manipulation/lowestSetBit/lowestSetBit-guide.sim.ts` | M | 1 | 0 |
| `src/algorithms/dp/expectedValueDp/expectedValueDp-guide.md` | M | 2 | 2 |
| `src/algorithms/dp/subsetSum/figs/build-neighbors.svg` | M | 1 | 1 |
| `src/algorithms/dp/subsetSum/figs/build-read-cell.svg` | M | 1 | 1 |
| `src/algorithms/dp/subsetSum/figs/concept-rule.svg` | M | 1 | 1 |
| `src/algorithms/dp/subsetSum/figs/concept-table.svg` | M | 1 | 1 |
| `src/algorithms/dp/subsetSum/figs/origin-one-row.svg` | M | 1 | 1 |
| `src/algorithms/dp/subsetSum/figs/related-sumset.svg` | M | 1 | 1 |
| `src/algorithms/dp/subsetSum/figs/walk-lower.svg` | M | 1 | 1 |
| `src/algorithms/dp/subsetSum/figs/walk-upper.svg` | M | 1 | 1 |
| `src/algorithms/dp/subsetSum/subsetSum-guide.fig.tsx` | M | 15 | 8 |
| `src/algorithms/dp/subsetSum/subsetSum-guide.md` | M | 5 | 3 |
| `src/algorithms/dp/subsetSum/subsetSum-guide.sim.ts` | M | 65 | 571 |
| `src/algorithms/dp/treeMaxIndependentSet/figs/build-relation.svg` | M | 1 | 1 |
| `src/algorithms/dp/treeMaxIndependentSet/figs/invariant-moment.svg` | M | 1 | 1 |
| `src/algorithms/dp/treeMaxIndependentSet/figs/walk-film.svg` | M | 1 | 1 |
| `src/algorithms/dp/treeMaxIndependentSet/treeMaxIndependentSet-guide.fig.tsx` | M | 15 | 4 |
| `src/algorithms/dp/treeMaxIndependentSet/treeMaxIndependentSet-guide.md` | M | 23 | 6 |
| `src/algorithms/dp/treeMaxIndependentSet/treeMaxIndependentSet-guide.proof.ts` | M | 68 | 0 |
| `src/algorithms/dp/treeMaxIndependentSet/treeMaxIndependentSet-guide.sim.ts` | M | 20 | 16 |
| `src/algorithms/graph/connectedComponents/connectedComponents-guide.fig.tsx` | M | 21 | 5 |
| `src/algorithms/graph/connectedComponents/connectedComponents-guide.md` | M | 1 | 1 |
| `src/algorithms/graph/connectedComponents/figs/worst-shapes.svg` | M | 2 | 2 |
| `src/algorithms/graph/dfsTraversal/dfsTraversal-guide.md` | M | 2 | 1 |
| `src/algorithms/number-theory/babyStepGiantStep/figs/walk-trace.svg` | M | 1 | 1 |
| `src/algorithms/number-theory/extendedEuclidean/figs/walk-run.svg` | M | 1 | 1 |
| `src/algorithms/number-theory/gcd/figs/walk-run.svg` | M | 1 | 1 |
| `src/algorithms/number-theory/isPrimeTrial/figs/walk-trial.svg` | M | 1 | 1 |
| `src/algorithms/number-theory/isPrimeTrial/isPrimeTrial-guide.fig.tsx` | M | 4 | 1 |
| `src/algorithms/number-theory/isPrimeTrial/isPrimeTrial-guide.md` | M | 1 | 1 |
| `src/algorithms/number-theory/isPrimeTrial/isPrimeTrial-guide.sim.ts` | M | 10 | 1 |
| `src/algorithms/number-theory/pollardRho/figs/walk-run.svg` | M | 1 | 1 |
| `src/algorithms/number-theory/sieveOfEratosthenes/figs/concept-sieve.svg` | M | 2 | 2 |
| `src/algorithms/number-theory/sieveOfEratosthenes/figs/walk-sieve.svg` | M | 2 | 2 |
| `src/algorithms/number-theory/sieveOfEratosthenes/sieveOfEratosthenes-guide.fig.tsx` | M | 17 | 9 |
| `src/algorithms/number-theory/sieveOfEratosthenes/sieveOfEratosthenes-guide.md` | M | 4 | 4 |
| `src/algorithms/number-theory/sieveOfEratosthenes/sieveOfEratosthenes-guide.sim.ts` | M | 300 | 279 |
| `src/algorithms/sorting/insertionSort/figs/concept-insert.svg` | M | 2 | 2 |
| `src/algorithms/sorting/insertionSort/figs/walk-insert.svg` | M | 2 | 2 |
| `src/algorithms/sorting/kthSmallest/kthSmallest-guide.md` | M | 4 | 1 |
| `src/algorithms/sorting/quicksort/quicksort-guide.md` | M | 7 | 4 |
| `src/algorithms/sorting/sortArray/figs/walk-merge-heads.svg` | M | 2 | 2 |
| `src/algorithms/sorting/sortArray/sortArray-guide.fig.tsx` | M | 48 | 41 |
| `src/algorithms/sorting/sortArray/sortArray-guide.md` | M | 2 | 2 |
| `src/algorithms/sorting/sortArray/sortArray-guide.sim.ts` | M | 106 | 36 |
| `src/algorithms/string/findAllOccurrences/figs/walk-kmp.svg` | M | 1 | 1 |
| `src/algorithms/string/radixTree/figs/build-over-trie.svg` | M | 2 | 2 |
| `src/algorithms/string/radixTree/radixTree-guide.fig.tsx` | M | 20 | 3 |
| `tools/_baseline/citations.tsv` | M | 7 | 7 |
| `tools/check-proof.test.ts` | M | 22 | 0 |
| `tools/check-proof.ts` | M | 27 | 4 |
| `tools/check-v2.test.ts` | M | 29 | 0 |
| `tools/check-v2.ts` | M | 14 | 7 |

**롤백 태그 11개**

```text
kan/KAN-063-X2JFZA/S1
kan/KAN-063-X2JFZA/S2
kan/KAN-063-X2JFZA/S3
kan/KAN-063-X2JFZA/S4
kan/KAN-063-X2JFZA/S5
kan/KAN-063-X2JFZA/S6
kan/KAN-063-X2JFZA/S7
kan/KAN-063-X2JFZA/S8
kan/KAN-063-X2JFZA/S9
kan/KAN-063-X2JFZA/batch1
kan/KAN-063-X2JFZA/batch2
```

## 2. 검증 — 기준과 실행 결과

<!-- 기준은 카드 실행 문서 「검증」 절의 사본이다. 정본은 KANBAN.cards/KAN-063-X2JFZA.md 이므로
     기준이 바뀌면 그쪽을 고치고 review-init --refresh 로 이 항만 다시 뜬다.
     결과는 착수한 쪽이 이미 돌린 것이다 — 검토자에게 다시 돌리라고 시키지 않는다.
     **다시 돌려 아래와 다르게 나오면 그 자체가 반려 사유다.** -->

**기준**

- `bun run tools/render-figs.ts --check` — 「그림 사이드카가 있는 가이드 115편 / 대상 115편」 대조 통과
- `bun test tools/check-proof.test.ts tools/check-v2.test.ts` 와 StepPlayer·CellStage 시험 통과
- `bun run tools/ci.ts gates` 통과(도구 자기시험 포함)
- `bun run tools/check-v2.ts src/algorithms/array/bestTimeToBuyAndSellStock/bestTimeToBuyAndSellStock-guide.md` 에 P21 경고 0
- 근거 파일 §7 의 모든 줄에 처분(고침 · 규약 · 버림+사유 · 넘김+받는 자리)이 적혀 있다

**실행 결과**

```text
bun run tools/ci.ts gates → gates 모드 통과 — 단계 14개 (v2 그림 신선도 · 자기증명 대조 · 은유 · 인용 · 링크 · bun test tools 576 pass 포함)
bun run tools/render-figs.ts --check → 대조 통과 — 그림 사이드카가 있는 가이드 115편 / 대상 115편
bun test src/_viz → 54 pass 0 fail · 고친 21편 *-guide.test.ts → 354 pass 0 fail
bun run tools/check-v2.ts bestTimeToBuyAndSellStock-guide.md → P1~P23 통과 (P21 경고 4 → 0)
bun KANBAN.batches/KAN-063-X2JFZA.probes/quicksort-stack.ts → n=10000 completed · n=20000/50000 RangeError (bun 1.3.12)
처분표: KANBAN.batches/KAN-063-X2JFZA.batch3.md — §7 17줄 전부 처분
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
python3 scripts/kanban.py review-judge <project-root> --card KAN-063-X2JFZA --item <번호> --verdict 승인
# 추가 의견
python3 scripts/kanban.py review-note <project-root> --card KAN-063-X2JFZA --item <번호> --text "<추가 의견>"
# 추가 의견을 반영하다 새 의견이 생겼으면 (맨 뒤에 붙어 앞 번호가 안 밀립니다)
python3 scripts/kanban.py review-item <project-root> --card KAN-063-X2JFZA --add "<주제>
  <상세>"
```

**전체 승인은 살아있는 항목이 전부 승인일 때만 섭니다**(철회는 분모에서 빠집니다). 하나라도
반려·추가 의견·미정이면 4항의 전체 승인도 `→ 완료` 이동도 종료코드 14로 거부됩니다.

- [ ] 공용 문체 검사기의 오탐 두 가지를 고칠 것인가 — 이 카드에서는 고치지 않고 재현과 수정안만 적었습니다
    - **배경**
      - 느낌표 규칙이 가이드 115편에서 354문단을 잡는데, 그중 300문단은 느낌표가 아니라 그림·증명 표시(`<!--…-->`) 두 개가 한 문단에 붙어서 걸린 것입니다. 원문: KANBAN.batches/KAN-063-X2JFZA.batch3.md
      - 쉼표 밀도 규칙은 `1,000` 같은 숫자의 쉼표도 셉니다. 숫자 쉼표를 빼면 57편 94건이 사라집니다. 원문: KANBAN.batches/KAN-063-X2JFZA.batch3.md
      - 검사기는 authoring-kit 플러그인에 있고 여러 프로젝트가 함께 씁니다. 고치는 곳은 두 줄(주석 걷기 · 숫자 쉼표 빼기)입니다. 원문: ~/.claude/plugins/cache/centurio87-plugins/authoring-kit/0.4.1/scripts/scan_ai_style.py:41
    - **정할 것**
      플러그인 검사기를 고칠 것인가.

    | 선택지 | 대가 | 그러면 어떻게 되는가 |
    | --- | --- | --- |
    | **추천** 실행 요청을 받아 플러그인을 고친다 | 다른 프로젝트의 등급도 함께 바뀐다 | 가이드 문체 등급에서 가짜 경고가 빠진다 |
    | 그대로 둔다 | 경고 대부분이 가짜인 채로 남는다 | 진짜 경고가 가짜 사이에 묻힌다 |

    > **판정** — _아직 없습니다._

    > **추가 의견** — _아직 없습니다._

- [ ] nQueens 판을 표 무대 한 장에 판 4칸 줄과 비트 7칸 줄을 섞어 그렸다 — 그림은 바르게 나오지만 무대 코드의 설명과 어긋납니다
    - **배경**
      - nQueens 걸음 재생에서 이제 판(4×4)을 표로 그리고, 그 아래에 열·대각선 비트 줄(7칸)을 같은 표에 붙였습니다. 원문: src/algorithms/advanced/nQueens/nQueens-guide.sim.ts:7
      - 표 무대 코드의 설명은 「줄마다 칸이 같은 수다」라고 적고 있지만, 실제로는 가장 긴 줄에 맞춰 그려서 문제없이 나옵니다. 원문: src/_viz/player/tableStage.ts:47
      - 비트 줄을 따로 두면 걸음 17개짜리 그림이 하나 더 생겨 책 쪽 그림이 약 4,400px 길어지고, 웹에서는 두 패널을 따로 넘겨야 합니다.
    - **정할 것**
      칸 수가 다른 줄을 한 표에 두는 것을 허용할 것인가.

    | 선택지 | 대가 | 그러면 어떻게 되는가 |
    | --- | --- | --- |
    | **추천** 허용하고 무대 설명을 동작에 맞게 고친다 | 표 무대의 전제가 느슨해진다 | 판과 비트를 한 화면에서 함께 본다 |
    | 비트 줄을 별도 패널로 뗀다 | 그림이 길어지고 패널이 둘이 된다 | 표마다 칸 수가 같다는 전제가 지켜진다 |

    > **판정** — _아직 없습니다._

    > **추가 의견** — _아직 없습니다._

- [ ] meetInTheMiddleSubsetSum 의 새 괄호가 다섯 걸음 모두 칸 하나짜리다 — 좁혀지는 과정은 곁말 「읽은 칸 3 → 5 → 4」로 남겼습니다
    - **배경**
      - 이 편은 반쪽 목록에서 값을 이진 탐색합니다. 한 걸음 안에서 후보 구간이 여러 번 좁혀지므로 괄호 하나로는 한 순간만 보입니다. 원문: src/algorithms/advanced/meetInTheMiddleSubsetSum/meetInTheMiddleSubsetSum-guide.md:814
      - 지금 괄호는 마지막 비교를 시작할 때의 후보 구간이라 대부분 칸 하나입니다. 처음 구간으로 바꾸면 늘 목록 전체라 정보가 없습니다.
    - **정할 것**
      괄호가 보여 줄 순간을 바꿀 것인가.

    | 선택지 | 대가 | 그러면 어떻게 되는가 |
    | --- | --- | --- |
    | **추천** 그대로 둔다 | 괄호가 좁혀지는 과정을 보여 주지 않는다 | 답이 들어갈 자리가 괄호로, 읽은 차례가 곁말로 보인다 |
    | 첫 비교 뒤 구간으로 바꾼다 | 설정 한 곳과 걸음 리터럴을 다시 뽑는다 | 괄호가 넓어지지만 마지막 자리는 곁말로만 보인다 |

    > **판정** — _아직 없습니다._

    > **추가 의견** — _아직 없습니다._

- [ ] 이 카드에서 새로 드러난 한계 넷을 어디로 보낼 것인가 — 처분표에 적어 두었고 고치지는 않았습니다
    - **배경**
      - 그래프 무대 필름 2장(convexHull · ahoCorasick)도 칸 필름에서 고친 것과 같은 이유로 장마다 칸 위치가 어긋납니다. 원문: src/algorithms/geometry/convexHull/convexHull-guide.fig.tsx:610
      - 짝 없는 닫는 증명 표시를 잡는 검사가 없습니다. 원문: tools/check-proof.ts
      - radixSort 의 「자리 값」 줄은 정본이 따로 저장하지 않는 값이라, 이번에 체 편을 고친 규칙에 똑같이 어긋납니다. 원문: src/algorithms/sorting/radixSort/radixSort-guide.sim.ts:9
      - convexHullTrick 의 껍질 줄도 스택이라 새 스택 띠로 옮길 수 있는데 옮기지 않았습니다. 원문: src/algorithms/advanced/convexHullTrick/convexHullTrick-guide.sim.ts:9
      - 모두 해당 편은 지금 모양으로 게이트를 통과합니다. 원문: KANBAN.batches/KAN-063-X2JFZA.batch3.md
    - **정할 것**
      넷을 어디에 둘 것인가.

    | 선택지 | 대가 | 그러면 어떻게 되는가 |
    | --- | --- | --- |
    | **추천** 백로그 카드 하나에 목록으로 넘긴다 | 카드가 하나 는다 | 다음에 무대를 손볼 때 한 번에 처리한다 |
    | 이 카드에서 마저 고친다 | 배치 하나가 더 돈다 | 검토가 늦어진다 |
    | 처분표에만 둔다 | 같은 한계가 다음 편에서 다시 나온다 | 받는 자리가 문서 한 장뿐이다 |

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
     `review-judge --card KAN-063-X2JFZA --verdict 승인` 이 이 자리를 쓰고
     frontmatter 의 status 도 함께 고친다. 손으로 적어도 되지만, 그때는 수렴 검사를
     안 거치므로 `validate` 가 항목 판정과 어긋난 승인을 error 로 잡는다. -->

**판정**: (아직 없습니다)

**판정 이력**:

- 승인이면 → `apply --op move --id KAN-063-X2JFZA --to done` 뒤에 `main` 병합과 워크트리 정리(출력의 `cleanup`)
- 반려면 → `apply --op move --id KAN-063-X2JFZA --to doing` 뒤에 `doc-log --entry "<반려 사유>"`.
  요청서는 **지우지도 다시 뜨지도 않는다** — 고친 뒤 그 항목을 `review-judge --verdict 승인` 으로
  뒤집으면 같은 문서에서 수렴한다. 1·2항이 낡았으면 `review-init --refresh` 로 그 두 항만 간다.
