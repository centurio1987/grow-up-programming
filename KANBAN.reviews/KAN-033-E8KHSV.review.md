---
card: KAN-033-E8KHSV
title: 완전히 새롭게 알고리즘 가이드 구성을 재기획 하려고 한다. 너는 나의 지시와 요구사항을 보고 계획과 실행 전략을 수립해라. 기존의 가이드나 집필 스킬에 의존하지 말고 이 지시와 요구사항에만 집중해라. 가이드 개발과정은 샌드박스 위에서 진행하며, pilot 가이드가 완전히 나에게 승인 됐을 때 비로소 모든 가이드에 적용할 예정이다.
created: 2026-08-19
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

**커밋 10건**

```text
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

**변경 파일 60개 (+7026 −38)**

| 파일 | 상태 | 추가 | 삭제 |
|---|:--:|---:|---:|
| `.kanban/archive.jsonl` | M | 1 | 0 |
| `.kanban/log.md` | M | 1 | 1 |
| `.kanban/state.json` | M | 21 | 17 |
| `KANBAN.cards/KAN-033-E8KHSV.md` | M | 212 | 0 |
| `KANBAN.md` | M | 6 | 5 |
| `bun.lock` | M | 94 | 0 |
| `package.json` | M | 9 | 1 |
| `sandbox/algo-guide-v2/.gitignore` | M | 3 | 0 |
| `sandbox/algo-guide-v2/JOURNAL.md` | M | 423 | 0 |
| `sandbox/algo-guide-v2/README.md` | M | 97 | 0 |
| `sandbox/algo-guide-v2/SPEC.md` | M | 369 | 0 |
| `sandbox/algo-guide-v2/SURVEY.md` | M | 122 | 0 |
| `sandbox/algo-guide-v2/_smoke/sample-guide.md` | M | 68 | 0 |
| `sandbox/algo-guide-v2/_smoke/sample-guide.sim.ts` | M | 21 | 0 |
| `sandbox/algo-guide-v2/pilot/babyStepGiantStep/babyStepGiantStep-guide.partial.md` | M | 82 | 0 |
| `sandbox/algo-guide-v2/pilot/mosAlgorithm/mosAlgorithm-guide.alt.ts` | M | 124 | 0 |
| `sandbox/algo-guide-v2/pilot/mosAlgorithm/mosAlgorithm-guide.bench.json` | M | 4 | 0 |
| `sandbox/algo-guide-v2/pilot/mosAlgorithm/mosAlgorithm-guide.md` | M | 485 | 0 |
| `sandbox/algo-guide-v2/pilot/mosAlgorithm/mosAlgorithm-guide.ref.ts` | M | 57 | 0 |
| `sandbox/algo-guide-v2/pilot/mosAlgorithm/mosAlgorithm-guide.sim.ts` | M | 89 | 0 |
| `sandbox/algo-guide-v2/pilot/mosAlgorithm/mosAlgorithm-guide.test.ts` | M | 110 | 0 |
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
| `sandbox/algo-guide-v2/tools/comprehension.sh` | M | 352 | 0 |
| `sandbox/algo-guide-v2/tools/mount.ts` | M | 60 | 0 |
| `sandbox/algo-guide-v2/tools/section.ts` | M | 166 | 0 |
| `sandbox/algo-guide-v2/tools/survey-views.ts` | M | 121 | 0 |
| `sandbox/algo-guide-v2/tsconfig.json` | M | 8 | 0 |
| `sandbox/algo-guide-v2/verdicts/.gitkeep` | M | 8 | 0 |
| `sandbox/algo-guide-v2/verdicts/mosAlgorithm-ablate-purpose-alt-r01.md` | M | 83 | 0 |
| `sandbox/algo-guide-v2/verdicts/mosAlgorithm-ablate-purpose-alt-r02.md` | M | 85 | 0 |
| `sandbox/algo-guide-v2/verdicts/mosAlgorithm-ablate-purpose-alt-r03.md` | M | 103 | 0 |
| `sandbox/algo-guide-v2/verdicts/mosAlgorithm-ablate-purpose-alt-r04.md` | M | 83 | 0 |
| `sandbox/algo-guide-v2/verdicts/mosAlgorithm-ablate-purpose-alt-r05.md` | M | 71 | 0 |
| `sandbox/algo-guide-v2/verdicts/mosAlgorithm-ablate-purpose-alt-r06.md` | M | 79 | 0 |
| `sandbox/algo-guide-v2/verdicts/mosAlgorithm-ablate-trace-r01.md` | M | 85 | 0 |
| `sandbox/algo-guide-v2/verdicts/mosAlgorithm-ablate-trace-r02.md` | M | 81 | 0 |
| `sandbox/algo-guide-v2/verdicts/mosAlgorithm-r01.md` | M | 65 | 0 |
| `sandbox/algo-guide-v2/verdicts/mosAlgorithm-r06.md` | M | 84 | 0 |
| `sandbox/algo-guide-v2/verdicts/mosAlgorithm-r07.md` | M | 77 | 0 |
| `sandbox/algo-guide-v2/verdicts/mosAlgorithm-r08.md` | M | 79 | 0 |
| `sandbox/algo-guide-v2/verdicts/mosAlgorithm-r09.md` | M | 67 | 0 |
| `sandbox/algo-guide-v2/verdicts/quicksort-ablate-purpose-alt-r01.md` | M | 69 | 0 |
| `sandbox/algo-guide-v2/verdicts/quicksort-ablate-trace-r01.md` | M | 87 | 0 |
| `sandbox/algo-guide-v2/verdicts/quicksort-r01.md` | M | 79 | 0 |
| `src/_guide-sim/guide-sim.test.tsx` | M | 171 | 1 |
| `src/_guide-sim/index.tsx` | M | 97 | 12 |
| `tools/check-links.ts` | B | 0 | 0 |
| `tools/ci.ts` | M | 7 | 0 |
| `tsconfig.json` | M | 11 | 1 |

**롤백 태그 0개** — 없음(`--tags` 를 넘기지 않았거나 아직 태그가 없습니다)

## 2. 검증 — 기준과 실행 결과

<!-- 기준은 카드 실행 문서 「검증」 절의 사본이다. 정본은 KANBAN.cards/KAN-033-E8KHSV.md 이므로
     기준이 바뀌면 그쪽을 고치고 review-init --force 로 다시 뜬다.
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
### 실행 결과 — 2026-08-19 04:19

$ bunx tsc --noEmit -p sandbox/algo-guide-v2
  → exit 0

$ bun test sandbox/algo-guide-v2
 48 pass
 0 fail
 66 expect() calls
Ran 48 tests across 4 files. [1.54s]

$ bunx --bun @biomejs/biome check sandbox/algo-guide-v2
Checked 20 files in 24ms. No fixes applied.
Found 1 error.

$ bun run sandbox/algo-guide-v2/tools/check-v2.ts <두 편>
sandbox/algo-guide-v2/pilot/quicksort/quicksort-guide.md — P1~P10 통과.
sandbox/algo-guide-v2/pilot/mosAlgorithm/mosAlgorithm-guide.md — P1~P10 통과.

$ bash sandbox/algo-guide-v2/tools/comprehension.selftest.sh
 자기시험 통과 — 7항목


$ bun run tools/ci.ts all
판정 제외(정상): ③ 실습 채점 — 스텁(미구현 실패가 정상, 판정 제외)
all 모드 통과 — 단계 12개.
```

## 3. 판단 항목 — 스크립트가 판정할 수 없는 것

<!-- 스크립트가 판정할 수 없는 것만 적는다 — 값의 진위, 선택지 중 하나를 고른 근거,
     범위를 그은 자리. 2항에서 이미 돌아간 검증을 여기 옮겨 적지 않는다.
     한 줄 형식: 체크박스 하나에 물음 하나 — "<물음> — <지금 고른 값과 그 근거>".
     비어 있으면 "기계가 다 판정했고 사람이 정할 것이 없다"는 뜻이다. 그 판단도
     착수한 쪽이 하는 것이지 검토자가 빈칸을 보고 추측할 일이 아니다. -->
- [ ] [결재 1] `perf` 를 `code`·`trace` **뒤로** 옮겼다 — 카드 원문의 항목 순서와 다르다. 카드는 성능(KANBAN.md:60)을 코드(:65) 앞에 놓았고, 면제 문구(:45)는 "항목명"만 면제한다. 옮긴 이유는 `perf.derive` 가 `trace` 의 T# 를 인용해야 결속(P5)이 서기 때문이다. 순서를 되돌리면 그 결속이 깨진다.
- [ ] [결재 2] `L7` 이 카드 원문의 "최악의 경우(O(n)), 통상적 경우(theta(n))" 짝짓기를 **위반으로 규정**했다. O·Θ 는 케이스가 아니라 경계의 종류라서다. 이대로 두면 111편이 "최악=O, 평균=Θ" 라는 틀린 짝을 복제하지 않는다. 카드 문면과 다르므로 결재가 필요하다.
- [ ] [결재 3] Claude 데스크톱 `/learn` 스킬의 **원문을 확인하지 못했다.** 웹 검색으로 안 잡혔고, 로컬 learning-output-style 플러그인 원문과 ChatGPT Study Mode 지침 요지 둘로 대체했다. 벤치마크 대조표(SPEC.md §7)가 그 둘에서만 나왔다.
- [ ] [결재 4] 이해 시험 판정이 **haiku 단독(잠정)** 이다. codex 는 2026-09-14 복구, agy 도 할당량 초과라 다모델 AND 합의가 아니다. 그리고 판정기 분산을 실측했다 — 본편 V2 가 한 회차에서 FAIL 인데 같은 회차 절제 사본은 통과했다(불가능한 조합). 3회 재실행은 전부 통과. **codex 복구 후 재판정을 승인 조건에 넣을지** 정해 달라.
- [ ] [결재 5] `purpose.alt` 절제 시험이 mosAlgorithm 에서 **판정력을 못 냈다**(지워도 V2 통과). 중단 조건 1 을 형식대로 적용하면 그 항목을 빼야 하지만, 감사가 실패 50편의 원인으로 지목한 항목이고 quicksort 에서는 절제가 정확히 작동했다. **판정기 신뢰도 확보 전까지 명세를 안 고치기로** 했다 — 이 판단을 승인할지 정해 달라.
- [ ] [결재 6] L10(그림 의무)의 **부류 예외를 열지 않기로** 했다. 근거는 babyStepGiantStep 한 편이다(세 절 다 그림이 자연스럽게 섰다). 표본이 하나인데 조항을 지운 것이 맞는지 정해 달라.
- [ ] [결재 7] pilot 이 **두 편 다 `array` 계열**이다. 111편에는 그래프 21편·트리 10편·matrix 12편이 있고 그 부류로는 명세를 시험하지 않았다. 이 상태로 전개 카드를 뽑아도 되는지 정해 달라.

## 4. 판정

<!-- 승인 또는 반려를 적고 사유를 남긴다. frontmatter 의 status 도 함께 고친다. -->

**판정**: (승인 / 반려 중 하나를 적으세요)

**사유**:

- 승인이면 → `apply --op move --id KAN-033-E8KHSV --to done`
- 반려면 → `apply --op move --id KAN-033-E8KHSV --to doing` 뒤에 `doc-log --entry "<반려 사유>"`
