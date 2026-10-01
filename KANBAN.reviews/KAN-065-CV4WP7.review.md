---
card: KAN-065-CV4WP7
title: solutions 에만 있는 비풀이 커밋과 main 의 풀이 분석 문서 정리 — 두 브랜치가 무엇을 나눠 갖는지 정한다
created: 2026-10-01
branch: KAN-065-CV4WP7
worktree: /Users/centurio/orca/workspaces/code_test/KAN-065-CV4WP7
base: 9b1e2bc6
status: 검토 대기
---

# KAN-065-CV4WP7 검토 요청 — solutions 에만 있는 비풀이 커밋과 main 의 풀이 분석 문서 정리 — 두 브랜치가 무엇을 나눠 갖는지 정한다

카드: [KAN-065-CV4WP7.md](../KANBAN.cards/KAN-065-CV4WP7.md)

> 이 문서는 **검토를 위한 산출물**이다. 수행 내역은 카드 실행 문서에 있고, 착수 전
> 계획은 배치 문서에 있다. 여기 있는 것은 "지금 이 브랜치를 무엇으로 판정하는가" 뿐이다.

## 1. 검토 대상

| 항목 | 값 |
|---|---|
| 브랜치 | `KAN-065-CV4WP7` |
| 워크트리 | `/Users/centurio/orca/workspaces/code_test/KAN-065-CV4WP7` |
| 베이스 | `9b1e2bc6` |
| 변경 훑기 | `git diff 9b1e2bc6...HEAD` |

**커밋 6건**

```text
94db5cf0 KAN-065 S5: 전체 검증 통과
bfab08f6 KAN-065 S4: solutions 실제 병합 기록(309d9173)
8394003e KAN-065 S3: 분석 보고서는 solutions 에만 — 스킬·README·CLAUDE.md 에 두 브랜치의 역할을 적는다
98837268 KAN-065 S2: main 에서 풀이 분석 보고서 13편을 걷고 KAN-001 실행 문서를 가져온다
cf133af9 KAN-065 S1: solutions 전용 파일 규칙 — 병합에서 분석 보고서를 지키고 main 누수를 잡는다
a1b90fbf kanban: KAN-065 착수 — 실행 문서·배치1 계획
```

**변경 파일 26개 (+657 −5755)**

| 파일 | 상태 | 추가 | 삭제 |
|---|:--:|---:|---:|
| `.claude/skills/analyze-solution/SKILL.md` | M | 5 | 0 |
| `.kanban/archive.jsonl` | M | 3 | 0 |
| `.kanban/log.md` | M | 3 | 3 |
| `.kanban/state.json` | M | 72 | 36 |
| `CLAUDE.md` | M | 12 | 0 |
| `KANBAN.batches/KAN-065-CV4WP7.batch1.md` | M | 56 | 0 |
| `KANBAN.board.html` | M | 4 | 4 |
| `KANBAN.cards/KAN-001.md` | M | 337 | 0 |
| `KANBAN.cards/KAN-065-CV4WP7.md` | M | 56 | 0 |
| `KANBAN.md` | M | 12 | 10 |
| `README.md` | M | 2 | 0 |
| `src/algorithms/array/houseRobber/houseRobber-analysis.md` | M | 0 | 163 |
| `src/algorithms/binary-search/parametricBinarySearch/parametricBinarySearch-analysis.md` | M | 0 | 389 |
| `src/algorithms/bit-manipulation/enumerateSubmasks/enumerateSubmasks-analysis.md` | M | 0 | 219 |
| `src/algorithms/dp/knapsack01/knapsack01-analysis.md` | M | 0 | 218 |
| `src/algorithms/graph-flow/kruskalMst/kruskalMst-analysis.md` | M | 0 | 383 |
| `src/algorithms/graph/bfsShortestPath/bfsShortestPath-analysis.md` | M | 0 | 356 |
| `src/algorithms/shortest-path/dijkstra/dijkstra-analysis.md` | M | 0 | 871 |
| `src/algorithms/sorting/countingSort/countingSort-analysis.md` | M | 0 | 111 |
| `src/algorithms/sorting/insertionSort/insertionSort-analysis.md` | M | 0 | 855 |
| `src/algorithms/sorting/kthSmallest/kthSmallest-analysis.md` | M | 0 | 665 |
| `src/algorithms/sorting/quicksort/quicksort-analysis.md` | M | 0 | 402 |
| `src/algorithms/sorting/radixSort/radixSort-analysis.md` | M | 0 | 427 |
| `src/data-structures/tree/binarySearchTree/binarySearchTree-analysis.md` | M | 0 | 638 |
| `tools/solutions-merge.test.ts` | M | 61 | 1 |
| `tools/solutions-merge.ts` | M | 34 | 4 |

**롤백 태그 5개**

```text
kan/KAN-065-CV4WP7/S1
kan/KAN-065-CV4WP7/S2
kan/KAN-065-CV4WP7/S3
kan/KAN-065-CV4WP7/S4
kan/KAN-065-CV4WP7/S5
```

## 2. 검증 — 기준과 실행 결과

<!-- 기준은 카드 실행 문서 「검증」 절의 사본이다. 정본은 KANBAN.cards/KAN-065-CV4WP7.md 이므로
     기준이 바뀌면 그쪽을 고치고 review-init --refresh 로 이 항만 다시 뜬다.
     결과는 착수한 쪽이 이미 돌린 것이다 — 검토자에게 다시 돌리라고 시키지 않는다.
     **다시 돌려 아래와 다르게 나오면 그 자체가 반려 사유다.** -->

**기준**

- `bun run tools/ci.ts all` 통과(practice 모드의 미구현 실패는 정상)
- `bun test tools/solutions-merge.test.ts tools/practice-ref.test.ts` — 스텁 누수 0 · solutions 전용 파일 0
- `git ls-files | grep -- '-analysis'` 가 비어 있다
- solutions 병합(S4) 뒤 `git diff <병합 전 solutions> HEAD -- '*-analysis.md'` 가 비어 있다

**실행 결과**

```text
────────────────────────────────────────────────────────────
판정 제외(정상): ③ 실습 채점 — 스텁(미구현 실패가 정상, 판정 제외)
all 모드 통과 — 단계 20개.
 10 pass
 0 fail
 35 expect() calls
Ran 10 tests across 2 files. [3.55s]
git ls-files | grep -c -- -analysis → 0
solutions 309d9173: 분석 문서 15편 병합 전후 차이 0 · 풀이→스텁 0
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
python3 scripts/kanban.py review-judge <project-root> --card KAN-065-CV4WP7 --item <번호> --verdict 승인
# 추가 의견
python3 scripts/kanban.py review-note <project-root> --card KAN-065-CV4WP7 --item <번호> --text "<추가 의견>"
# 추가 의견을 반영하다 새 의견이 생겼으면 (맨 뒤에 붙어 앞 번호가 안 밀립니다)
python3 scripts/kanban.py review-item <project-root> --card KAN-065-CV4WP7 --add "<주제>
  <상세>"
```

**전체 승인은 살아있는 항목이 전부 승인일 때만 섭니다**(철회는 분모에서 빠집니다). 하나라도
반려·추가 의견·미정이면 4항의 전체 승인도 `→ 완료` 이동도 종료코드 14로 거부됩니다.

- [ ] 분석 보고서 13편은 main 의 최신 판에서만 지웠고 git 이력에는 남겨 두었다 — 이대로 둔다
    - **배경**
      - 분석 보고서는 학습자 풀이를 인용하고 버그 자리를 짚는 문서라 그 자체로 답을 드러낸다. 원문 예: src/algorithms/sorting/quicksort/quicksort-analysis.md(solutions 브랜치)
      - 이번 카드는 main 의 최신 판에서 13편을 지웠다. 그래서 main 을 받아 보는 사람에게 지금 판에서는 안 보이지만, 지난 커밋을 열면 볼 수 있다
      - 이력에서까지 지우려면 공유 이력을 다시 써야 하고(filter-repo 같은 도구), 이미 받아 간 체크아웃과 워크트리가 모두 어긋난다. 원문: KANBAN.cards/KAN-065-CV4WP7.md:26
    - **정할 것**
      이력 정리까지 할 것인가.

    | 선택지 | 대가 | 그러면 어떻게 되는가 |
    | --- | --- | --- |
    | **추천** 이대로 둔다 | 지난 커밋에는 보고서가 남는다 | 지금 판과 앞으로의 판에는 안 들어온다. 검사가 새 누수를 잡는다 |
    | 이력 정리 카드를 따로 만든다 | 모든 체크아웃을 다시 받아야 한다 | 지난 커밋에서도 사라진다 |

    > **판정** — _아직 없습니다._

    > **추가 의견** — _아직 없습니다._

- [ ] _scratch 폴더 155개 파일은 main 에 그대로 둔다
    - **배경**
      - _scratch 는 가이드를 쓸 때 본문 코드가 맞는지 돌려 본 실험 파일이다. 모두 가이드 재집필 커밋(ORD-004·005)에서 들어왔다
      - 학습자 풀이가 아니라 가이드 저자의 코드이고, 가이드 자체(-guide.ref.ts 등)가 같은 코드를 이미 싣고 있다. 원문 예: src/algorithms/sorting/quicksort/_scratch/quicksort.ts 첫 줄 「가이드 본문에 실리는 코드를 그대로 옮겨 실행 검증한다」. 판단 근거: KANBAN.cards/KAN-065-CV4WP7.md:20
    - **정할 것**
      _scratch 를 풀이로 보고 main 에서 뺄 것인가.

    | 선택지 | 대가 | 그러면 어떻게 되는가 |
    | --- | --- | --- |
    | **추천** 그대로 둔다 | 없다 | 가이드에 이미 공개된 코드만 남는다 |
    | main 에서 뺀다 | 가이드 검증 습작을 잃는다 | 드러나는 답은 늘거나 줄지 않는다 |

    > **판정** — _아직 없습니다._

    > **추가 의견** — _아직 없습니다._

- [ ] solutions 에만 있던 비풀이 커밋은 옮길 내용이 없다고 보고, KAN-001 실행 문서 한 편만 main 으로 가져왔다
    - **배경**
      - 카드 메모가 든 비풀이 커밋(훅·가이드·자료구조 계약 등)은 solutions 가 그 뒤 main 을 받을 때 main 판으로 정리됐다. 지금 solutions 가 main 과 다른 파일은 33개이고, 풀이 29편·분석 보고서 둘·KAN-001 실행 문서·빈 잠금 파일 둘이 전부다(git diff main...solutions). 원문: KANBAN.cards/KAN-065-CV4WP7.md:13
      - KAN-001 실행 문서(KANBAN.cards/KAN-001.md)는 보드의 살아 있는 카드 KAN-001 의 문서인데 solutions 에만 있었다. 바이트 그대로 가져왔다
      - 빈 잠금 파일 둘(KANBAN.cards/.KAN-001.lock · KANBAN.state.json.lock)은 커밋하면 안 되는 파일이라 버렸다. solutions 쪽에는 남아 있다
    - **정할 것**
      이 대조 결과를 받아들일 것인가.

    | 선택지 | 대가 | 그러면 어떻게 되는가 |
    | --- | --- | --- |
    | **추천** 받아들인다 | 없다 | 카드의 「버린 사유」 조건이 이 문서로 닫힌다 |
    | 커밋별로 다시 본다 | 시간이 든다 | 결과는 같을 가능성이 높다 — 트리 차이가 33개뿐이다 |

    > **판정** — _아직 없습니다._

    > **추가 의견** — _아직 없습니다._

- [ ] solutions 병합 커밋 309d9173 은 원격에 올리지 않았다
    - **배경**
      - 이 카드의 도구로 solutions 체크아웃(/Users/centurio/code_test)에서 main 을 받았다. 분석 보고서 13편이 지워지지 않고 남았고, 병합 전후로 분석 문서 15편의 차이가 0, 풀이가 스텁으로 바뀐 파일도 0이다. 원문: KANBAN.cards/KAN-065-CV4WP7.md:24
      - KAN-064 때도 solutions 는 올리지 않았다. 원격에 올리는 일은 함께 쓰는 상태를 바꾸는 일이라 따로 요청을 받는다
    - **정할 것**
      지금 올릴 것인가.

    | 선택지 | 대가 | 그러면 어떻게 되는가 |
    | --- | --- | --- |
    | **추천** 유저가 직접 올린다 | 한 번 더 손이 간다 | 언제 올릴지 유저가 정한다 |
    | 이 카드에서 올린다 | 없다 | 원격 solutions 가 바로 따라온다 |

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
     `review-judge --card KAN-065-CV4WP7 --verdict 승인` 이 이 자리를 쓰고
     frontmatter 의 status 도 함께 고친다. 손으로 적어도 되지만, 그때는 수렴 검사를
     안 거치므로 `validate` 가 항목 판정과 어긋난 승인을 error 로 잡는다. -->

**판정**: (아직 없습니다)

**판정 이력**:

- 승인이면 → `apply --op move --id KAN-065-CV4WP7 --to done` 뒤에 `main` 병합과 워크트리 정리(출력의 `cleanup`)
- 반려면 → `apply --op move --id KAN-065-CV4WP7 --to doing` 뒤에 `doc-log --entry "<반려 사유>"`.
  요청서는 **지우지도 다시 뜨지도 않는다** — 고친 뒤 그 항목을 `review-judge --verdict 승인` 으로
  뒤집으면 같은 문서에서 수렴한다. 1·2항이 낡았으면 `review-init --refresh` 로 그 두 항만 간다.
