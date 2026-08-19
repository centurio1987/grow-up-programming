---
card: KAN-033-E8KHSV
title: 완전히 새롭게 알고리즘 가이드 구성을 재기획 하려고 한다. 너는 나의 지시와 요구사항을 보고 계획과 실행 전략을 수립해라. 기존의 가이드나 집필 스킬에 의존하지 말고 이 지시와 요구사항에만 집중해라. 가이드 개발과정은 샌드박스 위에서 진행하며, pilot 가이드가 완전히 나에게 승인 됐을 때 비로소 모든 가이드에 적용할 예정이다.
created: 2026-08-20
branch: KAN-033-E8KHSV
worktree: /Users/centurio/orca/workspaces/code_test/KAN-033-E8KHSV
base: bbe4644
status: 검토 대기
---

# KAN-033-E8KHSV 검토 요청 — 완전히 새롭게 알고리즘 가이드 구성을 재기획 하려고 한다. 너는 나의 지시와 요구사항을 보고 계획과 실행 전략을 수립해라. 기존의 가이드나 집필 스킬에 의존하지 말고 이 지시와 요구사항에만 집중해라. 가이드 개발과정은 샌드박스 위에서 진행하며, pilot 가이드가 완전히 나에게 승인 됐을 때 비로소 모든 가이드에 적용할 예정이다.

카드: [KAN-033-E8KHSV.md](../KANBAN.cards/KAN-033-E8KHSV.md)

> 이 문서는 **검토를 위한 산출물**이다. 수행 내역은 카드 실행 문서에 있고, 착수 전
> 계획은 배치 문서에 있다. 여기 있는 것은 "지금 이 브랜치를 무엇으로 판정하는가" 뿐이다.

## 1. 검토 대상

| 항목 | 값 |
|---|---|
| 브랜치 | `KAN-033-E8KHSV` |
| 워크트리 | `/Users/centurio/orca/workspaces/code_test/KAN-033-E8KHSV` |
| 베이스 | `bbe4644` |
| 변경 훑기 | `git diff bbe4644...HEAD` |

**커밋 17건**

```text
00d9ba7 KAN-033-E8KHSV S12 — pilot ③ knapsack01 (dp·matrix)
813db1f KAN-033-E8KHSV S14 — mos 전개가 창 이동 네 갈래를 모두 밟는다
dcc9d04 KAN-033-E8KHSV S11 — sonnet 재판정 종료, 결함 둘을 갈라 냈다
79f1bd5 KAN-033-E8KHSV S11 진행 — sonnet 재판정 4회 원문 보관
5eb2825 KAN-033-E8KHSV 반려 반영 — 판정 모델 sonnet + 재작업 S11~S13
ddfaaf3 kanban: KAN-033-E8KHSV 검토 반려 반영 (검토 → 진행 중)
3c14b76 KAN-033-E8KHSV S10 — 검토 요청 (진행 중 → 검토)
9cdb02e KAN-033-E8KHSV S9 — pilot ② mosAlgorithm
fabd61d KAN-033-E8KHSV S8 — L10 예외를 열지 않는다
2ee0a52 KAN-033-E8KHSV S7 — pilot ① quicksort
b9e2024 KAN-033-E8KHSV S6 — md→HTML 빌드 파이프라인
c2d39d0 KAN-033-E8KHSV S5 — 부류 후보 조사
39e3355 KAN-033-E8KHSV S4 — 스캐너 P1~P10
8d18092 KAN-033-E8KHSV S3 — 이해 시험 V1~V7
37dc295 KAN-033-E8KHSV S2 — algo-learn-guide 명세 정본
b39e515 KAN-033-E8KHSV B0a — 본 저장소 예외 6건 + 카드 착수
13e31d5 kanban: KAN-033-E8KHSV 실행 문서 작성 — 전략·WBS 9단계·검증 기준
```

**변경 파일 80개 (+9728 −59)**

| 파일 | 상태 | 추가 | 삭제 |
|---|:--:|---:|---:|
| `.kanban/archive.jsonl` | M | 3 | 0 |
| `.kanban/log.md` | M | 3 | 3 |
| `.kanban/state.json` | M | 50 | 36 |
| `KANBAN.cards/KAN-033-E8KHSV.md` | M | 249 | 0 |
| `KANBAN.md` | M | 7 | 5 |
| `KANBAN.reviews/KAN-033-E8KHSV.review.html` | M | 260 | 0 |
| `KANBAN.reviews/KAN-033-E8KHSV.review.md` | M | 228 | 0 |
| `bun.lock` | M | 94 | 0 |
| `package.json` | M | 9 | 1 |
| `sandbox/algo-guide-v2/.gitignore` | M | 3 | 0 |
| `sandbox/algo-guide-v2/JOURNAL.md` | M | 573 | 0 |
| `sandbox/algo-guide-v2/README.md` | M | 97 | 0 |
| `sandbox/algo-guide-v2/SPEC.md` | M | 369 | 0 |
| `sandbox/algo-guide-v2/SURVEY.md` | M | 122 | 0 |
| `sandbox/algo-guide-v2/_smoke/sample-guide.md` | M | 68 | 0 |
| `sandbox/algo-guide-v2/_smoke/sample-guide.sim.ts` | M | 21 | 0 |
| `sandbox/algo-guide-v2/pilot/babyStepGiantStep/babyStepGiantStep-guide.partial.md` | M | 82 | 0 |
| `sandbox/algo-guide-v2/pilot/knapsack01/knapsack01-guide.alt.ts` | M | 76 | 0 |
| `sandbox/algo-guide-v2/pilot/knapsack01/knapsack01-guide.bench.json` | M | 4 | 0 |
| `sandbox/algo-guide-v2/pilot/knapsack01/knapsack01-guide.md` | M | 748 | 0 |
| `sandbox/algo-guide-v2/pilot/knapsack01/knapsack01-guide.ref.ts` | M | 45 | 0 |
| `sandbox/algo-guide-v2/pilot/knapsack01/knapsack01-guide.sim.ts` | M | 115 | 0 |
| `sandbox/algo-guide-v2/pilot/knapsack01/knapsack01-guide.test.ts` | M | 36 | 0 |
| `sandbox/algo-guide-v2/pilot/mosAlgorithm/mosAlgorithm-guide.alt.ts` | M | 128 | 0 |
| `sandbox/algo-guide-v2/pilot/mosAlgorithm/mosAlgorithm-guide.bench.json` | M | 4 | 0 |
| `sandbox/algo-guide-v2/pilot/mosAlgorithm/mosAlgorithm-guide.md` | M | 493 | 0 |
| `sandbox/algo-guide-v2/pilot/mosAlgorithm/mosAlgorithm-guide.ref.ts` | M | 57 | 0 |
| `sandbox/algo-guide-v2/pilot/mosAlgorithm/mosAlgorithm-guide.sim.ts` | M | 108 | 0 |
| `sandbox/algo-guide-v2/pilot/mosAlgorithm/mosAlgorithm-guide.test.ts` | M | 113 | 0 |
| `sandbox/algo-guide-v2/pilot/quicksort/quicksort-guide.alt.ts` | M | 84 | 0 |
| `sandbox/algo-guide-v2/pilot/quicksort/quicksort-guide.bench.json` | M | 6 | 0 |
| `sandbox/algo-guide-v2/pilot/quicksort/quicksort-guide.md` | M | 463 | 0 |
| `sandbox/algo-guide-v2/pilot/quicksort/quicksort-guide.ref.ts` | M | 39 | 0 |
| `sandbox/algo-guide-v2/pilot/quicksort/quicksort-guide.sim.ts` | M | 66 | 0 |
| `sandbox/algo-guide-v2/pilot/quicksort/quicksort-guide.test.ts` | M | 49 | 0 |
| `sandbox/algo-guide-v2/tools/bench-alt.ts` | M | 123 | 0 |
| `sandbox/algo-guide-v2/tools/build-html.test.ts` | M | 110 | 0 |
| `sandbox/algo-guide-v2/tools/build-html.ts` | M | 357 | 0 |
| `sandbox/algo-guide-v2/tools/check-v2.test.ts` | M | 310 | 0 |
| `sandbox/algo-guide-v2/tools/check-v2.ts` | M | 575 | 0 |
| `sandbox/algo-guide-v2/tools/comprehension.selftest.sh` | M | 168 | 0 |
| `sandbox/algo-guide-v2/tools/comprehension.sh` | M | 357 | 0 |
| `sandbox/algo-guide-v2/tools/mount.ts` | M | 60 | 0 |
| `sandbox/algo-guide-v2/tools/section.ts` | M | 166 | 0 |
| `sandbox/algo-guide-v2/tools/survey-views.ts` | M | 121 | 0 |
| `sandbox/algo-guide-v2/tsconfig.json` | M | 8 | 0 |
| `sandbox/algo-guide-v2/verdicts/.gitkeep` | M | 8 | 0 |
| `sandbox/algo-guide-v2/verdicts/knapsack01-ablate-purpose-alt-r01.md` | M | 97 | 0 |
| `sandbox/algo-guide-v2/verdicts/knapsack01-ablate-purpose-alt-r02.md` | M | 78 | 0 |
| `sandbox/algo-guide-v2/verdicts/knapsack01-ablate-trace-r01.md` | M | 63 | 0 |
| `sandbox/algo-guide-v2/verdicts/knapsack01-ablate-trace-r02.md` | M | 76 | 0 |
| `sandbox/algo-guide-v2/verdicts/knapsack01-r01.md` | M | 84 | 0 |
| `sandbox/algo-guide-v2/verdicts/knapsack01-r02.md` | M | 96 | 0 |
| `sandbox/algo-guide-v2/verdicts/mosAlgorithm-ablate-purpose-alt-r01.md` | M | 83 | 0 |
| `sandbox/algo-guide-v2/verdicts/mosAlgorithm-ablate-purpose-alt-r02.md` | M | 85 | 0 |
| `sandbox/algo-guide-v2/verdicts/mosAlgorithm-ablate-purpose-alt-r03.md` | M | 103 | 0 |
| `sandbox/algo-guide-v2/verdicts/mosAlgorithm-ablate-purpose-alt-r04.md` | M | 83 | 0 |
| `sandbox/algo-guide-v2/verdicts/mosAlgorithm-ablate-purpose-alt-r05.md` | M | 71 | 0 |
| `sandbox/algo-guide-v2/verdicts/mosAlgorithm-ablate-purpose-alt-r06.md` | M | 79 | 0 |
| `sandbox/algo-guide-v2/verdicts/mosAlgorithm-ablate-purpose-alt-r07.md` | M | 72 | 0 |
| `sandbox/algo-guide-v2/verdicts/mosAlgorithm-ablate-trace-r01.md` | M | 85 | 0 |
| `sandbox/algo-guide-v2/verdicts/mosAlgorithm-ablate-trace-r02.md` | M | 81 | 0 |
| `sandbox/algo-guide-v2/verdicts/mosAlgorithm-r01.md` | M | 65 | 0 |
| `sandbox/algo-guide-v2/verdicts/mosAlgorithm-r06.md` | M | 84 | 0 |
| `sandbox/algo-guide-v2/verdicts/mosAlgorithm-r07.md` | M | 77 | 0 |
| `sandbox/algo-guide-v2/verdicts/mosAlgorithm-r08.md` | M | 79 | 0 |
| `sandbox/algo-guide-v2/verdicts/mosAlgorithm-r09.md` | M | 67 | 0 |
| `sandbox/algo-guide-v2/verdicts/mosAlgorithm-r10.md` | M | 88 | 0 |
| `sandbox/algo-guide-v2/verdicts/mosAlgorithm-r11.md` | M | 71 | 0 |
| `sandbox/algo-guide-v2/verdicts/mosAlgorithm-r12.md` | M | 66 | 0 |
| `sandbox/algo-guide-v2/verdicts/quicksort-ablate-purpose-alt-r01.md` | M | 69 | 0 |
| `sandbox/algo-guide-v2/verdicts/quicksort-ablate-purpose-alt-r02.md` | M | 74 | 0 |
| `sandbox/algo-guide-v2/verdicts/quicksort-ablate-trace-r01.md` | M | 87 | 0 |
| `sandbox/algo-guide-v2/verdicts/quicksort-r01.md` | M | 79 | 0 |
| `sandbox/algo-guide-v2/verdicts/quicksort-r02.md` | M | 65 | 0 |
| `src/_guide-sim/guide-sim.test.tsx` | M | 171 | 1 |
| `src/_guide-sim/index.tsx` | M | 97 | 12 |
| `tools/check-links.ts` | B | 0 | 0 |
| `tools/ci.ts` | M | 7 | 0 |
| `tsconfig.json` | M | 11 | 1 |

**롤백 태그 0개** — 없음(`--tags` 를 넘기지 않았거나 아직 태그가 없습니다)

## 2. 검증 — 기준과 실행 결과

<!-- 기준은 카드 실행 문서 「검증」 절의 사본이다. 정본은 KANBAN.cards/KAN-033-E8KHSV.md 이므로
     기준이 바뀌면 그쪽을 고치고 review-init --refresh 로 이 항만 다시 뜬다.
     결과는 착수한 쪽이 이미 돌린 것이다 — 검토자에게 다시 돌리라고 시키지 않는다.
     **다시 돌려 아래와 다르게 나오면 그 자체가 반려 사유다.** -->

**기준**

배치마다 아래를 돌린다. 샌드박스는 **루트 타입 검사에서 빠져 있으므로**(`tsconfig.json` exclude)
반드시 `-p` 로 따로 판정한다.

```bash
bunx tsc --noEmit -p sandbox/algo-guide-v2                 # 샌드박스 전용
bunx --bun @biomejs/biome check sandbox/algo-guide-v2      # .ts 가 생긴 뒤부터
bun test sandbox/algo-guide-v2                             # .test.ts 가 생긴 뒤부터
bun run sandbox/algo-guide-v2/tools/check-v2.ts <파일>      # P1~P10
bun run sandbox/algo-guide-v2/tools/build-html.ts <파일>    # 빌드 + 스모크 (L19)
bash sandbox/algo-guide-v2/tools/comprehension.sh <파일>    # V1~V7
bun run tools/ci.ts all                                     # 배치 종료마다
```

**함정 둘을 미리 적는다(실측).**

- `bun test <경로>` 와 `bunx --bun @biomejs/biome check <디렉터리>` 는 **대상 파일이 0개면
  exit 1** 이다. 초반 배치(S1~S3)에서는 돌리지 않는다 — 돌리면 무조건 빨간불이다.
- **`bunx biome` 을 쓰지 않는다.** npm 의 `biome` 은 이 저장소가 설정한 `@biomejs/biome` 와
  다른 패키지이고 아무것도 검사하지 않고 exit 0 을 준다(`CLAUDE.md`).

**`tools/check-guide-rhythm.ts` 는 호출하지 않는다.** 규칙은 P1·P2 로 옮겼다. 호출해도
R2~R4·R6 은 `hasTrace`(구 헤딩 문자열 **접두 일치**, `:53`·`:183`·`:221-222`)가 새 헤딩과
어긋나 **조용히 공전한다** — 통과 표시가 거짓이 된다.

**판정 장치와 그것이 재는 것**

| 장치 | 재는 것 |
|---|---|
| 이해 시험 V1~V7 | 외부 모델이 본문만 읽고 이해했는가. **응답한 모델 전부 PASS(AND)** |
| `check-v2.ts` P1~P10 | 기계로 셀 수 있는 것. P5(결속)는 **형식만** 재고 실질은 V7 |
| 절제 시험 | `trace`·`purpose.alt` 가 장식인가. **그 절과 그것을 가리키는 `T#` 인용을 함께 지운다** |
| `bench-alt.ts` | L13 의 **결정론적** 계수(비교 횟수·이동 칸 수). 벽시계는 안 쓴다 |
| `bun test` | L9 — 완성 코드가 기존 테스트의 **입출력 케이스**를 통과 |
| 유저 | 최종 승인. **편 단위**, 항목 id 로 반려 |

**이해 시험의 현재 한계**: codex 사용 한도가 2026-09-14 복구, agy 도 한도 초과라 지금은
haiku 단독 판정이 될 수 있다. 그 경우 **「잠정」으로 표기**하고 codex 복구 후 재판정 대상에
등록한다. 미실행(exit 2)은 통과가 아니고, 카운터에도 넣지 않으며 배치를 멈춘다.

**본 저장소 예외 6건의 검증**(S1 에서 이미 통과):
`bun run tools/ci.ts all` 초록 · `bunx tsc --noEmit` 무출력 · `bun test src/_guide-sim` 14개 통과 ·
새 코드 린트 경고 0(기존 `index.tsx` 의 미정리 경고 9건은 이 카드 범위 밖).

**실행 결과**

```text
### 실행 결과 — 2026-08-20

$ bunx tsc --noEmit -p sandbox/algo-guide-v2
  → exit 0 (무출력)

$ bun test sandbox/algo-guide-v2
 59 pass
 0 fail
Ran 59 tests across 5 files. [1.63s]

$ bunx --bun @biomejs/biome check sandbox/algo-guide-v2/pilot
Checked 15 files in 14ms. No fixes applied.

$ bun run sandbox/algo-guide-v2/tools/check-v2.ts <세 편>
sandbox/algo-guide-v2/pilot/quicksort/quicksort-guide.md — P1~P10 통과.
sandbox/algo-guide-v2/pilot/mosAlgorithm/mosAlgorithm-guide.md — P1~P10 통과.
sandbox/algo-guide-v2/pilot/knapsack01/knapsack01-guide.md — P1~P10 통과.

$ bash sandbox/algo-guide-v2/tools/comprehension.selftest.sh
 자기시험 통과 — 7항목


$ bash sandbox/algo-guide-v2/tools/comprehension.sh <세 편> — 이해 시험 V1~V7
quicksort  r02  통과 (V1~V7 전부 PASS)
knapsack01 r01·r02 통과 (V1~V7 전부 PASS)
mosAlgorithm r12  미통과 — V2 하나 (V6 은 S14 수정으로 통과)
  ↳ 셋 다 codex·agy 한도 초과로 sonnet 단독 「잠정」 판정

$ bun run tools/ci.ts all
판정 제외(정상): ③ 실습 채점 — 스텁(미구현 실패가 정상, 판정 제외)
all 모드 통과 — 단계 12개.
```

## 3. 판단 항목 — 스크립트가 판정할 수 없는 것

<!-- 스크립트가 판정할 수 없는 것만 적는다 — 값의 진위, 선택지 중 하나를 고른 근거,
     범위를 그은 자리. 2항에서 이미 돌아간 검증을 여기 옮겨 적지 않는다.
     한 줄 형식: 체크박스 하나에 물음 하나 — "<물음> — <지금 고른 값과 그 근거>".
     **물음마다 「배경」 접기가 따라붙는다** — 검토자는 이 카드를 수행하지 않았으므로
     내부 기호(`L10`·`P5`·`S8`)만 던지면 판정할 재료가 없다. 배경에는 그 기호를 풀어
     쓰고 원문 경로(`파일:줄`)나 링크를 건다.
     비어 있으면 "기계가 다 판정했고 사람이 정할 것이 없다"는 뜻이다. 그 판단도
     착수한 쪽이 하는 것이지 검토자가 빈칸을 보고 추측할 일이 아니다.
     **승계 절(3-0)이 있으면 그것이 먼저 온다** — 다른 검토서에서 넘어온 물음이고,
     판정은 승계를 받은 이 문서 하나에서만 내려진다. -->

**물음마다 판정과 의견이 따로 붙습니다.** 판정은 상태이고 의견은 말입니다 — 승인/반려를 아직
안 정했어도 물음 하나에만 의견을 달 수 있고, 반대로 물음 하나만 먼저 닫을 수도 있습니다.
`<번호>`는 물음 순서이고, 물음의 문구 일부로도 찾습니다.

```
# 판정 — 승인 · 반려 · 철회
python3 scripts/kanban.py review-judge <project-root> --card KAN-033-E8KHSV --item <번호> --verdict 승인 --reason "<사유>"
# 추가 의견
python3 scripts/kanban.py review-note <project-root> --card KAN-033-E8KHSV --item <번호> --text "<의견>"
# 추가 의견을 반영하다 새 물음이 생겼으면 (맨 뒤에 붙어 앞 번호가 안 밀립니다)
python3 scripts/kanban.py review-item <project-root> --card KAN-033-E8KHSV --add "<물음>
  <배경>"
```

**전체 승인은 살아있는 항목이 전부 승인일 때만 섭니다**(철회는 분모에서 빠집니다). 하나라도
반려·추가 의견·미정이면 4항의 전체 승인도 `→ 완료` 이동도 종료코드 14로 거부됩니다.

- [ ] [결재 1] 이해 시험 판정을 sonnet 단독(잠정)으로 두고 진행할 것인가 — 지금은 그렇게 두었고, codex 복구 후 다모델 재판정을 승인 조건에 넣을지 정해 주세요.
    - **배경** — 이해 시험이란: 외부 AI 모델이 가이드 본문만 읽고 일곱 물음에 답하게 하는 시험입니다. 일곱 물음에 붙인 번호가 V1 ~ V7 이고, 원문은 `sandbox/algo-guide-v2/tools/comprehension.sh:148-170` 에 있습니다.
      번호별 뜻: V1 = 가장 단순한 방법이 수치로 무너지는가 · V2 = 경쟁 설계와 같은 입력의 수치로 대조했는가 · V3 = 왜 항상 옳은지 재구성되는가 · V4 = 오해를 반례로 무너뜨렸는가 · V5 = 코드 한 곳을 바꿨을 때의 잘못된 값이 있는가 · V6 = 한 입력으로 전개가 재현되고 모든 분기가 나오는가 · V7 = 복잡도를 케이스와 경계 두 축으로 갈랐는가.
      판정 결합은 AND 입니다 — 응답한 모델 **전부**가 통과해야 그 항목이 통과입니다.
      원래 세 모델(codex=ChatGPT · agy · claude)을 쓰는데, codex 는 사용량 한도(2026-09-14 복구), agy 는 할당량 초과라 지금은 claude 하나만 답합니다. 단독 판정에는 보고서에 「잠정」이 붙습니다.
      지난 검토에서 주신 지시("haiku 대신 sonnet 을 사용해라")대로 폴백 모델을 교체했습니다(`sandbox/algo-guide-v2/tools/comprehension.sh:32`).
      교체 효과가 실제로 있었습니다 — haiku 가 통과시켰던 mosAlgorithm 편을 sonnet 이 떨어뜨렸고, 떨어뜨린 근거 둘 다 원문 대조로 사실이었습니다(그중 하나가 아래 [결재 5] 로 이어집니다).

    > **판정** — _아직 없습니다._

    > **의견** — _아직 없습니다._

- [ ] [결재 2] 그림 의무의 부류 예외를 안 열기로 한 판단을 유지할 것인가 — 지난 검토 때 표본이 한 편뿐이라 결재를 미뤄 두신 항목입니다. 지금은 표본이 늘었습니다.
    - **배경** — L10 = 이 프로젝트가 명세에 붙인 조항 번호이고, 뜻은 「그림 의무」입니다. 원문은 `sandbox/algo-guide-v2/SPEC.md:333` 의 "그림 의무 — 아홉 절 각각 >= 1. code.step 은 절 전체 기준. deep.proof 제외. **예외 없음**" 입니다.
      여기서 "그림" 은 코드 펜스와 표만 셉니다(`sandbox/algo-guide-v2/SPEC.md:281-285`). 산문 사이에 그림이 최소 하나는 있어야 한다는 뜻입니다.
      명세 4판까지는 "그림이 성립하지 않는 부류" 를 위한 예외 조항이 열려 있었는데, S8 = 이 카드의 여덟째 작업 단계(`KANBAN.cards/KAN-033-E8KHSV.md` 「실행 계획」)에서 babyStepGiantStep 한 편으로 시험해 닫았습니다. 그때 근거가 **한 편뿐**이라 결재 대상으로 올렸습니다.
      지금은 세 편이 더 나왔고 전부 스캐너의 그림 의무 검사를 통과했습니다 — quicksort(정렬) · mosAlgorithm(배열) · knapsack01(동적 계획). 부류가 셋으로 늘었습니다.

    > **판정** — _아직 없습니다._

    > **의견** — _아직 없습니다._

- [ ] [결재 3] pilot 세 편으로 전개 카드를 뽑을 것인가 — 지금은 아래 [결재 5] 가 정해지기 전에는 안 뽑는 쪽으로 두었습니다.
    - **배경** — 지난 검토에서 "mosalgorithm 은 포함하고 다른건 dp 에서 하나 골라라" 라고 주셔서, dp 10편 중 knapsack01 을 골랐습니다. 고른 근거는 셋입니다 — dp 에서 유일하게 표(matrix) 시각화를 쓰고, 테스트가 있어 완성 코드를 검증할 수 있고, 구 v3.0.0 가이드(커밋 `3d232f4`)가 있어 대조가 됩니다.
      세 편의 상태: quicksort 와 knapsack01 은 이해 시험 일곱 물음을 전부 통과했고, mosAlgorithm 은 그중 하나만 미통과입니다.
      일곱 물음의 번호는 V1 = 가장 단순한 방법이 수치로 무너지는가 부터 V7 = 복잡도를 케이스와 경계 두 축으로 갈랐는가 까지이고, 원문은 `sandbox/algo-guide-v2/tools/comprehension.sh:148-170` 입니다.
      mosAlgorithm 이 못 넘은 것은 둘째 물음(V2 = 경쟁 설계와 같은 입력의 수치로 대조했는가)이고, 판정 원문은 `sandbox/algo-guide-v2/verdicts/mosAlgorithm-r12.md` 입니다.
      그 V2 미통과는 원고 결함이 아니라 **명세와 원고의 충돌**입니다 — 아래 [결재 5] 가 그 내용입니다.

    > **판정** — _아직 없습니다._

    > **의견** — _아직 없습니다._

- [ ] [결재 4] 절제 시험의 중단 조건을 부류에 따라 다르게 볼 것인가 — 지금은 원고를 더 깎지 않고 조건을 그대로 둔 채 이 사실만 보고합니다.
    - **배경** — 절제 시험이란: 가이드에서 어떤 절을 통째로 지운 사본을 만들어 같은 이해 시험을 돌리는 장치입니다. 결과가 안 바뀌면 그 절이 없어도 독자가 이해했다는 뜻이므로 "그 절은 장식" 이라고 봅니다. 그 절을 가리키는 인용 표시도 함께 지웁니다(`sandbox/algo-guide-v2/tools/comprehension.sh:91`).
      카드의 중단 조건 1 원문: "절제 시험에서 결과가 안 바뀌면 — 그 절은 장식이다"(`KANBAN.cards/KAN-033-E8KHSV.md` 「실행 계획」 절의 중단 조건 목록).
      knapsack01 에서 전개 절과 경쟁 설계 절을 각각 지웠는데 **둘 다 통과**했습니다. 처음에는 제가 다른 절에 같은 내용을 흘려 쓴 것이 원인이어서 네 곳을 고쳤는데, 고친 뒤에도 통과합니다.
      판정기가 대신 근거로 쓴 곳: 전개 절 대신 「전체 컨셉」의 표 계산과 「이해 점검」의 칸 계산, 경쟁 설계 절 대신 「흔한 오해」의 그리디 반례였습니다.
      더 깎으려면 「전체 컨셉」에서 표를 빼야 하는데 그러면 "이 절만 읽고도 전체가 잡혀야 한다" 는 자립 요건을 어깁니다(`sandbox/algo-guide-v2/SPEC.md:126-131`).
      원인은 부류의 성질로 보입니다 — 동적 계획은 상태가 표 하나뿐이라 **최종 표가 전개를 겸합니다.** 퀵 정렬과 Mo 는 포인터가 움직인 자취가 결과에 안 남아 전개 절이 따로 필요했습니다.

    > **판정** — _아직 없습니다._

    > **의견** — _아직 없습니다._

- [ ] [결재 5] 이해 시험 V2 의 물음 문구를 고칠 것인가 — 명세를 고치는 일이라 제가 정하지 않고 올립니다. 지금은 안 고친 상태입니다.
    - **배경** — V2 = 이해 시험 일곱 물음 중 **둘째** 물음입니다. 원문(`sandbox/algo-guide-v2/tools/comprehension.sh:161-162`): "같은 목표를 노리는 **다른 절차**가 **실명으로** 제시되고, 왜 이 알고리즘이 이기는지가 **같은 입력의 수치로** 대조돼 있는가?"
      문제는 "왜 **이 알고리즘이 이기는지**" 입니다. mosAlgorithm 편은 정직하게 "이 문제에서는 펜윅 트리가 이긴다"(연산 6,895 대 4,850)를 적고, Mo 를 택하는 근거는 **일반성**(다른 질의로도 옮겨진다)이라고 썼습니다(`sandbox/algo-guide-v2/pilot/mosAlgorithm/mosAlgorithm-guide.md:213-244`). 수치로 이기는 축이 없습니다.
      그 결과 mosAlgorithm 본편이 이 둘째 물음에서 r10 · r11 · r12 **세 회차 연속** 실패했습니다(회차 원문 `sandbox/algo-guide-v2/verdicts/mosAlgorithm-r12.md`). 카드의 중단 조건 3("같은 V 번호에서 2회 연속 실패하면 명세가 문제다")이 발동한 상태입니다.
      같은 명세에서 knapsack01 은 V2 를 통과했습니다 — 거기서는 이 가이드가 가르치는 절차가 경쟁 설계보다 12.1배 적은 표를 채워 **이기는 수치가 있었습니다**(51,051 대 617,552).
      즉 이기는 편은 통과하고 정직하게 지는 편은 구조적으로 못 넘습니다. 넘기려면 Mo 가 이기는 입력을 따로 만들어야 하는데, 그것은 대조를 유리한 자리로 옮기는 일이라 이 명세가 막으려던 바로 그 행위입니다.

    > **판정** — _아직 없습니다._

    > **의견** — _아직 없습니다._


## 4. 판정

<!-- 문서 하나에 대한 판정이다. **항목별로 갈리는 말은 여기 적지 않는다** — 3항 각 물음의
     「판정」과 「의견」이 그 자리다. 여기 남는 것은 그 항목들이 전부 승인으로 닫혔다는
     사실 하나뿐이다.
     아래 「사유」는 **덧붙기만 하는 이력**이다. 왕복이 돌면 줄이 쌓이고, 그것이 이 문서가
     무엇을 거쳐 승인에 닿았는지의 전부다 — 지우지 않는다.
     `review-judge --card KAN-033-E8KHSV --verdict 승인 --reason "<사유>"` 가 이 자리를 쓰고
     frontmatter 의 status 도 함께 고친다. 손으로 적어도 되지만, 그때는 수렴 검사를
     안 거치므로 `validate` 가 항목 판정과 어긋난 승인을 error 로 잡는다. -->

**판정**: (아직 없습니다)

**사유**:

- 승인이면 → `apply --op move --id KAN-033-E8KHSV --to done` 뒤에 `main` 병합과 워크트리 정리(출력의 `cleanup`)
- 반려면 → `apply --op move --id KAN-033-E8KHSV --to doing` 뒤에 `doc-log --entry "<반려 사유>"`.
  요청서는 **지우지도 다시 뜨지도 않는다** — 고친 뒤 그 항목을 `review-judge --verdict 승인` 으로
  뒤집으면 같은 문서에서 수렴한다. 1·2항이 낡았으면 `review-init --refresh` 로 그 두 항만 간다.
