---
card: KAN-059-PSFTN4
title: 책 빌더의 SVG 그림 인쇄 — 알고리즘 가이드 fig 자리를 책(PDF)에서 어떻게 찍는가
created: 2026-09-29
branch: KAN-059-PSFTN4
worktree: /Users/centurio/orca/workspaces/code_test/KAN-059-PSFTN4
base: 8e7b5b8
status: 승인
---

# KAN-059-PSFTN4 검토 요청 — 책 빌더의 SVG 그림 인쇄 — 알고리즘 가이드 fig 자리를 책(PDF)에서 어떻게 찍는가

카드: [KAN-059-PSFTN4.md](../KANBAN.cards/KAN-059-PSFTN4.md)

> 이 문서는 **검토를 위한 산출물**이다. 수행 내역은 카드 실행 문서에 있고, 착수 전
> 계획은 배치 문서에 있다. 여기 있는 것은 "지금 이 브랜치를 무엇으로 판정하는가" 뿐이다.

## 1. 검토 대상

| 항목 | 값 |
|---|---|
| 브랜치 | `KAN-059-PSFTN4` |
| 워크트리 | `/Users/centurio/orca/workspaces/code_test/KAN-059-PSFTN4` |
| 베이스 | `8e7b5b8` |
| 변경 훑기 | `git diff 8e7b5b8...HEAD` |

**커밋 6건**

```text
fb842b2 KAN-059: 카드 전략 절 인용 줄번호를 바로잡고 인용 대장에 등록
1d51b81 KAN-059 S4: 디자인 샘플에 그림·걸음 필름 항목, README 조판 규칙
f7730b7 KAN-059 S3: 책에서 걸음 필름을 칸별 SVG 로 가르고 그림 인쇄 CSS 를 더한다
5fba546 KAN-059 S2: 필름 칸 경계 — CellStageFilm 이 걸음 칸마다 세로 자리를 박는다
e2dd696 KAN-059 S1: 인쇄 그림 측정 검사 — 한 쪽에 안 드는 그림을 책 빌드가 잡는다
074ba75 kanban: KAN-059 진행 중으로 이동 — orca 워크트리 착수
```

**변경 파일 21개 (+651 −54)**

| 파일 | 상태 | 추가 | 삭제 |
|---|:--:|---:|---:|
| `.kanban/archive.jsonl` | M | 1 | 0 |
| `.kanban/log.md` | M | 1 | 1 |
| `.kanban/state.json` | M | 14 | 14 |
| `KANBAN.batches/KAN-059-PSFTN4.batch1.md` | M | 2 | 1 |
| `KANBAN.board.html` | M | 4 | 4 |
| `KANBAN.cards/KAN-059-PSFTN4.md` | M | 18 | 8 |
| `KANBAN.md` | M | 7 | 7 |
| `src/_viz/index.ts` | M | 1 | 0 |
| `src/_viz/patterns.test.tsx` | M | 35 | 0 |
| `src/_viz/patterns/CellStage.tsx` | M | 27 | 1 |
| `src/algorithms/array/sparseTableRangeMin/figs/walk-answer.svg` | M | 1 | 1 |
| `src/algorithms/array/sparseTableRangeMin/figs/walk-build.svg` | M | 1 | 1 |
| `tools/_baseline/citations.tsv` | M | 4 | 0 |
| `tools/book/README.md` | M | 8 | 0 |
| `tools/book/book.test.ts` | M | 155 | 0 |
| `tools/book/build-book.ts` | M | 31 | 6 |
| `tools/book/build-sample.ts` | M | 38 | 4 |
| `tools/book/chrome.ts` | M | 7 | 0 |
| `tools/book/figures.ts` | M | 151 | 0 |
| `tools/book/fragment.ts` | M | 133 | 6 |
| `tools/book/print-css.ts` | M | 12 | 0 |

**롤백 태그 5개**

```text
kan/KAN-059-PSFTN4/S1
kan/KAN-059-PSFTN4/S2
kan/KAN-059-PSFTN4/S3
kan/KAN-059-PSFTN4/S4
kan/KAN-059-PSFTN4/batch1
```

## 2. 검증 — 기준과 실행 결과

<!-- 기준은 카드 실행 문서 「검증」 절의 사본이다. 정본은 KANBAN.cards/KAN-059-PSFTN4.md 이므로
     기준이 바뀌면 그쪽을 고치고 review-init --refresh 로 이 항만 다시 뜬다.
     결과는 착수한 쪽이 이미 돌린 것이다 — 검토자에게 다시 돌리라고 시키지 않는다.
     **다시 돌려 아래와 다르게 나오면 그 자체가 반려 사유다.** -->

**기준**

```bash
bun run tools/book/build-book.ts                 # 세 권 전체 — S1 측정 검사 위반 0, 종료코드 0
bun test tools/book src/_viz                     # 측정·가르기·경계값 시험
bun run tools/render-figs.ts --check             # 파일럿 SVG 가 렌더러와 같다
bun run tools/ci.ts all                          # CI 4모드 + 게이트
bunx tsc --noEmit
bunx --bun @biomejs/biome check tools/book src/_viz   # 새로 쓴 곳 경고 0
```

눈으로 확인할 것(쪽 이미지, `pdftoppm -f <쪽> -l <쪽> -r 40 -png`):

- 파일럿 장에서 「시뮬레이션」 머리 줄만 있는 빈 쪽이 없다(고치기 전: 고급 권 823·832쪽).
- 걸음 칸 T3~T15 가 한 번씩 찍히고 쪽 경계에서 반으로 잘린 칸이 없다.
- 작은 그림 일곱이 전과 같은 크기로 본문 폭 안에 있다.

실패로 보는 것: S1 검사가 고치기 전 main 에서 필름 둘을 못 잡으면 검사가 틀린 것이다 — 고친 뒤의 통과도 믿지 않는다.

**실행 결과**

```text
bun run tools/book/build-book.ts — 종료 0. 그림 9장 높이 초과 0건(고치기 전 main: walk-build 2091px·walk-answer 2232px > 본문 856px 로 종료 1). 초급 750 · 중급 1272 · 고급 1518쪽, 쪽수 예측 = 실측
bun test tools/book src/_viz — 60 통과 0 실패
bun run tools/render-figs.ts --check — 대조 통과
bun run tools/ci.ts all — ① 자기검증 · ② 정본 · ④ 통계 자기시험 통과, ③ 실습 채점은 판정 제외(정상). 게이트는 인용 1건 실패 → 이 카드 전략 절 인용 줄번호를 고치고 대장 갱신(fb842b2) 뒤 ci.ts gates 13단계 통과
bunx tsc --noEmit — 통과
bunx --bun @biomejs/biome check tools/book src/_viz — 28파일 경고 0
쪽 이미지(고급 권 pdftoppm -r 40): 822쪽 틀 머리 줄 + T3, 823~825쪽 T4~T10, 830쪽 머리 줄 + T11, 831~833쪽 T12~T15 — 빈 틀 쪽 없음, 쪽 경계에서 잘린 칸 없음, T3~T15 각 한 번
bun run tools/book/build-sample.ts — 종료 0, 103쪽. 「그림」 17쪽 · 「걸음 필름」 18쪽 견본
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
python3 scripts/kanban.py review-judge <project-root> --card KAN-059-PSFTN4 --item <번호> --verdict 승인
# 추가 의견
python3 scripts/kanban.py review-note <project-root> --card KAN-059-PSFTN4 --item <번호> --text "<추가 의견>"
# 추가 의견을 반영하다 새 의견이 생겼으면 (맨 뒤에 붙어 앞 번호가 안 밀립니다)
python3 scripts/kanban.py review-item <project-root> --card KAN-059-PSFTN4 --add "<주제>
  <상세>"
```

**전체 승인은 살아있는 항목이 전부 승인일 때만 섭니다**(철회는 분모에서 빠집니다). 하나라도
반려·추가 의견·미정이면 4항의 전체 승인도 `→ 완료` 이동도 종료코드 14로 거부됩니다.

- [x] 전자책 작업 브랜치(feat/book-volumes)보다 이 카드를 먼저 main 에 병합해도 되는가 — 먼저 병합하기를 권합니다
    - **배경**
      - 두 브랜치가 책 빌더의 같은 파일을 고칩니다. 지금 커밋된 상태끼리 모의 병합하면 세 파일에서 충돌이 납니다: fragment.ts 4곳 · build-book.ts 3곳 · book.test.ts 2곳. 원문: git merge-tree --write-tree KAN-059-PSFTN4 feat/book-volumes
      - 충돌은 모두 양쪽이 같은 자리에 덧붙인 모양입니다(import 줄 · 파일 머리 주석의 번호 · 조각 판 번호 BUILDER_VERSION · 파일 끝에 붙인 시험). 한쪽 코드를 고쳐 쓴 자리는 없습니다. 원문: tools/book/fragment.ts:44
      - 전자책 브랜치에는 아직 커밋 안 된 파일이 열 개 넘게 있습니다(build-epub.ts · grid.ts 등). 그쪽이 언제 끝날지는 이 카드가 정할 수 없습니다. 원문: ../book-volumes 워크트리의 git status
      - 이 카드가 main 에 없으면 KAN-058(110편 전개)이 그림을 늘릴 때 인쇄 깨짐을 잡을 검사가 없습니다. 원문: KANBAN.cards/KAN-059-PSFTN4.md 「목표」
    - **정할 것**
      이 카드를 전자책 브랜치보다 먼저 병합할 것인가.

    | 선택지 | 대가 | 그러면 어떻게 되는가 |
    | --- | --- | --- |
    | **추천** 먼저 병합한다 | 전자책 브랜치가 병합할 때 세 파일의 덧붙임 충돌을 풀어야 합니다 | KAN-058 이 그림을 늘리는 동안 책 빌드가 깨진 그림을 바로 잡습니다 |
    | 전자책 브랜치를 기다린다 | 이 카드가 검토에 묶이고 KAN-058 착수 때 검사가 없습니다 | 충돌은 이 카드 쪽에서 풀게 되고, 기다리는 기간은 정해져 있지 않습니다 |

    > **판정**
    >
    > - 승인 · 유저 · 2026-09-29

    > **추가 의견**
    >
    > - 유저 · 2026-09-29 — 전자책 브랜치는 main 을 지속적으로 병합해 쓰는 독립 브랜치다 — 이 카드를 먼저 병합하고 충돌은 그쪽이 main 을 받을 때 푼다

- [x] 본문보다 넓은 그림을 줄여 찍는 것을 위반이 아니라 알림으로 둘 것인가 — 알림으로 두었습니다
    - **배경**
      - 파일럿 그림 셋이 본문 폭(170mm, 약 643px)보다 넓어 줄어 찍힙니다: 걸음 필름 walk-build 0.90배 · walk-answer 0.94배 · 층 막대 그림 0.98배. 원문: 세 권 빌드 로그의 「폭이 본문을 넘어 … 줄어 찍힌다」 줄
      - 0.90배면 그림 안 글자 11px 가 약 10px 로 찍힙니다. 쪽 이미지에서 읽기 어려운 자리는 보지 못했습니다(고급 권 822~833쪽).
      - 높이 초과만 빌드 실패(종료코드 1)로 두었습니다. 높이가 넘치면 빈 쪽과 잘린 칸이 생기지만, 폭은 줄어들 뿐 잘리지 않기 때문입니다. 원문: tools/book/figures.ts:83
    - **정할 것**
      넓은 그림을 알림으로 둘 것인가, 한도를 정해 실패로 올릴 것인가.

    | 선택지 | 대가 | 그러면 어떻게 되는가 |
    | --- | --- | --- |
    | **추천** 알림으로 둔다 | 많이 줄어든 그림도 빌드는 통과합니다 | 로그에 배율이 남아 사람이 보고 판단합니다. 110편에서 넓은 그림이 늘어도 빌드가 멈추지 않습니다 |
    | 배율 한도(예: 0.85)를 두고 넘으면 실패 | 한도 값을 근거 없이 정해야 합니다 | 글자가 너무 작아지는 그림을 빌드가 막지만, 그림을 다시 그려야 빌드가 통과합니다 |

    > **판정**
    >
    > - 승인 · 유저 · 2026-09-29

    > **추가 의견** — _아직 없습니다._


## 4. 판정

<!-- 문서 하나에 대한 판정이다. **항목별로 갈리는 말은 여기 적지 않는다** — 3항 각 의견의
     「판정」과 「추가 의견」이 그 자리다. 여기 남는 것은 그 항목들이 전부 승인으로 닫혔다는
     사실 하나뿐이다.
     아래 「판정 이력」은 **덧붙기만 하는 이력**이다. 왕복이 돌면 줄이 쌓이고, 그것이 이 문서가
     무엇을 거쳐 승인에 닿았는지의 전부다 — 지우지 않는다. **판정에는 사유 칸이 없다** —
     승인은 대체로 덧붙일 말이 없고, 있다면 그것은 문서 전체가 아니라 그 항목에 대한
     말이라 3항의 「추가 의견」이 받는다.
     `review-judge --card KAN-059-PSFTN4 --verdict 승인` 이 이 자리를 쓰고
     frontmatter 의 status 도 함께 고친다. 손으로 적어도 되지만, 그때는 수렴 검사를
     안 거치므로 `validate` 가 항목 판정과 어긋난 승인을 error 로 잡는다. -->

**판정**: 승인

**판정 이력**:

- 승인 · 유저 · 2026-09-29

- 승인이면 → `apply --op move --id KAN-059-PSFTN4 --to done` 뒤에 `main` 병합과 워크트리 정리(출력의 `cleanup`)
- 반려면 → `apply --op move --id KAN-059-PSFTN4 --to doing` 뒤에 `doc-log --entry "<반려 사유>"`.
  요청서는 **지우지도 다시 뜨지도 않는다** — 고친 뒤 그 항목을 `review-judge --verdict 승인` 으로
  뒤집으면 같은 문서에서 수렴한다. 1·2항이 낡았으면 `review-init --refresh` 로 그 두 항만 간다.
