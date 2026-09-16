---
card: KAN-045-D2PK6T
title: 인용 표류 게이트 — 병합으로 밀린 `경로:줄` 인용을 기계가 잡는다
created: 2026-09-16
branch: KAN-045-D2PK6T
worktree: /Users/centurio/orca/workspaces/code_test/KAN-045-D2PK6T
base: main
status: 검토 대기
---

# KAN-045-D2PK6T 검토 요청 — 인용 표류 게이트 — 병합으로 밀린 `경로:줄` 인용을 기계가 잡는다

카드: [KAN-045-D2PK6T.md](../KANBAN.cards/KAN-045-D2PK6T.md)

> 이 문서는 **검토를 위한 산출물**이다. 수행 내역은 카드 실행 문서에 있고, 착수 전
> 계획은 배치 문서에 있다. 여기 있는 것은 "지금 이 브랜치를 무엇으로 판정하는가" 뿐이다.

## 1. 검토 대상

| 항목 | 값 |
|---|---|
| 브랜치 | `KAN-045-D2PK6T` |
| 워크트리 | `/Users/centurio/orca/workspaces/code_test/KAN-045-D2PK6T` |
| 베이스 | `main` |
| 변경 훑기 | `git diff main...HEAD` |

**커밋 5건**

```text
421e238 KAN-045 배치3: 대장 초기 생성 · 표류 전수 목록 · 게이트 편입 (S3 · S4)
5779526 KAN-045 배치2: 표류 검사 구현과 문서·게이트 초안 (S2 · S4 초안)
4c82dc8 KAN-045 배치1: 인용 표류 게이트 규격 (S1)
f294d35 kanban: KAN-045 ↔ KAN-036 직렬 재기록(scope 등록으로 중재 무효화)
8a2a672 kanban: KAN-045 착수 — 카드 문서(전략·실행 계획·검증) · 배치 셋(오케스트레이션 3배치 결재)
```

**변경 파일 16개 (+3032 −110)**

| 파일 | 상태 | 추가 | 삭제 |
|---|:--:|---:|---:|
| `.kanban/archive.jsonl` | M | 2 | 0 |
| `.kanban/log.md` | M | 2 | 2 |
| `.kanban/state.json` | M | 35 | 28 |
| `CLAUDE.md` | M | 1 | 1 |
| `KANBAN.batches/KAN-045-D2PK6T.batch1.md` | M | 91 | 0 |
| `KANBAN.batches/KAN-045-D2PK6T.batch2.md` | M | 71 | 0 |
| `KANBAN.batches/KAN-045-D2PK6T.batch3.md` | M | 203 | 0 |
| `KANBAN.board.html` | M | 4 | 4 |
| `KANBAN.cards/KAN-045-D2PK6T.md` | M | 72 | 0 |
| `KANBAN.md` | M | 11 | 10 |
| `docs/ORD-006-conventions.md` | M | 299 | 1 |
| `docs/ORD-006-runbook.md` | M | 1 | 1 |
| `tools/_baseline/citations.tsv` | M | 1133 | 0 |
| `tools/check-citations.test.ts` | M | 432 | 0 |
| `tools/check-citations.ts` | M | 666 | 63 |
| `tools/ci.ts` | M | 9 | 0 |

**롤백 태그 7개**

```text
kan/KAN-045-D2PK6T/S1
kan/KAN-045-D2PK6T/S2
kan/KAN-045-D2PK6T/S3
kan/KAN-045-D2PK6T/S4
kan/KAN-045-D2PK6T/batch1
kan/KAN-045-D2PK6T/batch2
kan/KAN-045-D2PK6T/batch3
```

## 2. 검증 — 기준과 실행 결과

<!-- 기준은 카드 실행 문서 「검증」 절의 사본이다. 정본은 KANBAN.cards/KAN-045-D2PK6T.md 이므로
     기준이 바뀌면 그쪽을 고치고 review-init --refresh 로 이 항만 다시 뜬다.
     결과는 착수한 쪽이 이미 돌린 것이다 — 검토자에게 다시 돌리라고 시키지 않는다.
     **다시 돌려 아래와 다르게 나오면 그 자체가 반려 사유다.** -->

**기준**

**카드 종료 조건.**

1. `bun run tools/check-citations.ts` 가 **표류를 잡는다** — 자기시험 변형 셋에서 실패하고 정상 상태에서 통과한다.
2. `tools/_baseline/citations.tsv` 가 저장소에 있고 `--update` 로만 바뀐다.
3. `bun run tools/ci.ts all` 통과 · `bun test tools/check-citations.test.ts tools/ci-workflow.test.ts` 통과 · `cd rust && cargo test` 통과.
4. 지금 밀려 있는 인용의 목록이 배치 문서에 남고, 그 정정은 별도 작업으로 넘어간 것이 카드에 적힌다.

**실행 결과**

```text
이 브랜치에서 2026-09-16 실행. 로그: 세션 스크래치 `ci-045-b3.log`.

- `bun run tools/ci.ts all` — **all 모드 통과 — 단계 17개.** · `bun run tools/ci.ts gates` — 단계 11개 통과
- `cd rust && cargo test` — 11 스위트 · 25 pass / 0 fail
- `bun run tools/check-citations.ts` — 인용 1,150건 존재 통과 · **대장 1,130행과 지문이 모두 일치** · 경로 없는 인용 463(붙임 73 · 자기 256 · 보류 134)
- `bun test tools/check-citations.test.ts tools/ci-workflow.test.ts` — 18 pass / 0 fail. 변형 넷을 **앞뒤로** 재고(변형 전 통과 · 후 실패), 시험이 실효인지 돌연변이로 확인(표류 대조 무력화 → 5 실패, 래칫 · `--update` 안전장치 · 공백 정규화 · flag 보존 각각 → 4 실패)
- `bunx tsc --noEmit` 0 · biome 경고 0 · `check-links check` 843건
- 대장 결정론: `--tsv` 두 번이 같은 sha256, `--update` 멱등(바이트 동일), 정렬 위반 0 · 키 중복 0 · 지문 충돌 0

**게이트가 실제로 잡은 것**: 이미 밀려 있던 인용 **39건(대장 97행)**. 그중 여덟 행은 **이 카드가 낸 밀림**입니다 — `S2` 가 `tools/check-citations.ts` 를 161 → 751줄로 다시 써서 규격 절의 인용이 밀렸고, 새 게이트가 그것을 잡았습니다.
```

## 3. 판단 항목 — 스크립트가 판정할 수 없는 것

<!-- 스크립트가 판정할 수 없는 것만 적는다 — 값의 진위, 선택지 중 하나를 고른 근거,
     범위를 그은 자리. 2항에서 이미 돌아간 검증을 여기 옮겨 적지 않는다.
     한 줄 형식: 체크박스 하나에 의견 하나 — "<주제> — <지금 고른 값과 그 근거>".
     **의견마다 「상세」 접기가 따라붙는다** — 검토자는 이 카드를 수행하지 않았으므로
     내부 기호(`L10`·`P5`·`S8`)만 던지면 판정할 재료가 없다. 상세에는 그 기호를 풀어
     쓰고 원문 경로(`파일:줄`)나 링크를 건다.
     비어 있으면 "기계가 다 판정했고 사람이 정할 것이 없다"는 뜻이다. 그 판단도
     착수한 쪽이 하는 것이지 검토자가 빈칸을 보고 추측할 일이 아니다.
     **승계 절(3-0)이 있으면 그것이 먼저 온다** — 다른 검토서에서 넘어온 의견이고,
     판정은 승계를 받은 이 문서 하나에서만 내려진다. -->

**의견마다 판정과 추가 의견이 따로 붙습니다.** 판정은 상태이고 추가 의견은 말입니다 — 승인/반려를 아직
안 정했어도 의견 하나에만 추가 의견을 달 수 있고, 반대로 의견 하나만 먼저 닫을 수도 있습니다.
`<번호>`는 의견 순서이고, 주제의 문구 일부로도 찾습니다.

```
# 판정 — 승인 · 반려 · 철회
python3 scripts/kanban.py review-judge <project-root> --card KAN-045-D2PK6T --item <번호> --verdict 승인
# 추가 의견
python3 scripts/kanban.py review-note <project-root> --card KAN-045-D2PK6T --item <번호> --text "<추가 의견>"
# 추가 의견을 반영하다 새 의견이 생겼으면 (맨 뒤에 붙어 앞 번호가 안 밀립니다)
python3 scripts/kanban.py review-item <project-root> --card KAN-045-D2PK6T --add "<주제>
  <상세>"
```

**전체 승인은 살아있는 항목이 전부 승인일 때만 섭니다**(철회는 분모에서 빠집니다). 하나라도
반려·추가 의견·미정이면 4항의 전체 승인도 `→ 완료` 이동도 종료코드 14로 거부됩니다.


## 4. 판정

<!-- 문서 하나에 대한 판정이다. **항목별로 갈리는 말은 여기 적지 않는다** — 3항 각 의견의
     「판정」과 「추가 의견」이 그 자리다. 여기 남는 것은 그 항목들이 전부 승인으로 닫혔다는
     사실 하나뿐이다.
     아래 「판정 이력」은 **덧붙기만 하는 이력**이다. 왕복이 돌면 줄이 쌓이고, 그것이 이 문서가
     무엇을 거쳐 승인에 닿았는지의 전부다 — 지우지 않는다. **판정에는 사유 칸이 없다** —
     승인은 대체로 덧붙일 말이 없고, 있다면 그것은 문서 전체가 아니라 그 항목에 대한
     말이라 3항의 「추가 의견」이 받는다.
     `review-judge --card KAN-045-D2PK6T --verdict 승인` 이 이 자리를 쓰고
     frontmatter 의 status 도 함께 고친다. 손으로 적어도 되지만, 그때는 수렴 검사를
     안 거치므로 `validate` 가 항목 판정과 어긋난 승인을 error 로 잡는다. -->

**판정**: (아직 없습니다)

**판정 이력**:

- 승인이면 → `apply --op move --id KAN-045-D2PK6T --to done` 뒤에 `main` 병합과 워크트리 정리(출력의 `cleanup`)
- 반려면 → `apply --op move --id KAN-045-D2PK6T --to doing` 뒤에 `doc-log --entry "<반려 사유>"`.
  요청서는 **지우지도 다시 뜨지도 않는다** — 고친 뒤 그 항목을 `review-judge --verdict 승인` 으로
  뒤집으면 같은 문서에서 수렴한다. 1·2항이 낡았으면 `review-init --refresh` 로 그 두 항만 간다.
