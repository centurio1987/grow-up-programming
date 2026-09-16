---
card: KAN-046-ZFDFCQ
title: 밀린 인용 39건 정정 — KAN-045 대장이 drift 로 표시한 자리
created: 2026-09-16
branch: KAN-046-ZFDFCQ
worktree: /Users/centurio/orca/workspaces/code_test/KAN-046-ZFDFCQ
base: main
status: 검토 대기
---

# KAN-046-ZFDFCQ 검토 요청 — 밀린 인용 39건 정정 — KAN-045 대장이 drift 로 표시한 자리

카드: [KAN-046-ZFDFCQ.md](../KANBAN.cards/KAN-046-ZFDFCQ.md)

> 이 문서는 **검토를 위한 산출물**이다. 수행 내역은 카드 실행 문서에 있고, 착수 전
> 계획은 배치 문서에 있다. 여기 있는 것은 "지금 이 브랜치를 무엇으로 판정하는가" 뿐이다.

## 1. 검토 대상

| 항목 | 값 |
|---|---|
| 브랜치 | `KAN-046-ZFDFCQ` |
| 워크트리 | `/Users/centurio/orca/workspaces/code_test/KAN-046-ZFDFCQ` |
| 베이스 | `main` |
| 변경 훑기 | `git diff main...HEAD` |

**커밋 3건**

```text
30039a7 KAN-046 배치2: 대장 갱신과 마감 (S4)
e45f905 KAN-046 배치1: 밀린 인용 정정 — 규약 문서 172건 · 가이드/sandbox 7건 (S1 · S2 · S3)
e845fd0 kanban: KAN-046 착수 — 카드 문서 · 배치 둘(오케스트레이션 2배치 결재) · KAN-036 직렬 재기록
```

**변경 파일 15개 (+766 −342)**

| 파일 | 상태 | 추가 | 삭제 |
|---|:--:|---:|---:|
| `.kanban/archive.jsonl` | M | 2 | 0 |
| `.kanban/log.md` | M | 2 | 2 |
| `.kanban/state.json` | M | 47 | 44 |
| `KANBAN.batches/KAN-046-ZFDFCQ.batch1.md` | M | 244 | 0 |
| `KANBAN.batches/KAN-046-ZFDFCQ.batch2.md` | M | 115 | 0 |
| `KANBAN.board.html` | M | 4 | 4 |
| `KANBAN.cards/KAN-046-ZFDFCQ.md` | M | 76 | 0 |
| `KANBAN.md` | M | 11 | 10 |
| `docs/ORD-006-conventions.md` | M | 165 | 165 |
| `sandbox/algo-guide-v2/FEEDBACK.md` | M | 1 | 1 |
| `sandbox/ds-guide-v2/SPEC.md` | M | 1 | 1 |
| `src/data-structures/heap/binomialHeap/binomialHeap-guide.mdx` | M | 3 | 3 |
| `src/data-structures/tree/bTree/bTree-guide.mdx` | M | 1 | 1 |
| `src/data-structures/tree/orderStatisticTree/orderStatisticTree-guide.mdx` | M | 1 | 1 |
| `tools/_baseline/citations.tsv` | M | 93 | 110 |

**롤백 태그 6개**

```text
kan/KAN-046-ZFDFCQ/S1
kan/KAN-046-ZFDFCQ/S2
kan/KAN-046-ZFDFCQ/S3
kan/KAN-046-ZFDFCQ/S4
kan/KAN-046-ZFDFCQ/batch1
kan/KAN-046-ZFDFCQ/batch2
```

## 2. 검증 — 기준과 실행 결과

<!-- 기준은 카드 실행 문서 「검증」 절의 사본이다. 정본은 KANBAN.cards/KAN-046-ZFDFCQ.md 이므로
     기준이 바뀌면 그쪽을 고치고 review-init --refresh 로 이 항만 다시 뜬다.
     결과는 착수한 쪽이 이미 돌린 것이다 — 검토자에게 다시 돌리라고 시키지 않는다.
     **다시 돌려 아래와 다르게 나오면 그 자체가 반려 사유다.** -->

**기준**

**카드 종료 조건.**

1. 대장(`tools/_baseline/citations.tsv`)의 `drift` 행이 **모호 1건을 뺀 0** 이고, 남긴 1건은 사유가 카드에 적혀 있다.
2. 고친 인용마다 **대상 줄의 내용이 감싼 산문의 주장과 맞는다** — 표본이 아니라 전수로 확인한 기록이 배치 문서에 있다.
3. `bun run tools/check-citations.ts` 통과(대장 일치 · 래칫 불변 또는 하락) · `bun run tools/ci.ts all` 통과 · `cd rust && cargo test` 통과.
4. 고치지 않기로 한 것(모호 1건 · 기록 11건)이 무엇이고 왜인지 카드에 남는다.

**실행 결과**

```text
이 브랜치에서 2026-09-16 실행. 로그: 세션 스크래치 `ci-046-b2.log`.

- `bun run tools/check-citations.ts` — **exit 0**. 인용 1,150건 존재 통과 · **대장 1,113행 지문 전부 일치** · `drift` **0** · 경로 없는 인용 463(붙임 73 · 자기 288 · 보류 102: detached 74 · unresolved 14 · naked-name 14)
- `bun run tools/ci.ts all` — **all 모드 통과 — 단계 17개.** · `bun run tools/ci.ts gates` — 11단계
- `cd rust && cargo test` — 대상 11개 전부 ok · 실패 0
- `bun test tools/check-citations.test.ts tools/ci-workflow.test.ts` — 19 pass / 0 fail · `bunx tsc --noEmit` 0 · `guide-core check` 펜스 58건 일치 · `check-links check` 849건

**정정 규모**: 규약 문서 172건(갈래 A 154 + 좌표 8 + B 5 + D 3 + 대장 미표시 8 중 규약 몫) · 가이드·sandbox 7건. **172건 전부 같은 자릿수 치환이라 줄 수·글자 수가 그대로**이고, 이 편집이 민 인용은 0입니다.

**전수 확인 방법**: 추적표의 「위치」 칸은 원 목록 행의 첫 칸을 그대로 옮긴 것이므로, 인용이 가리키는 줄의 첫 칸과 추적표가 적은 칸을 문자열로 대조하면 행마다 기계 판정이 됩니다 — 목록 행 222개에 걸어 일치 221 · 문면 차이 1(`S30` 이 앞머리를 다시 쓴 자리, 번호 문제 아님). 갈래 B·D 와 가이드는 대상 파일을 열어 하나씩 대조했습니다.

**대장 갱신**: 1,130 → 1,113행. 래칫은 `unresolved` 46 → 14 로 내려갔고 나머지는 불변이라 `--update` 가드에 걸리지 않았습니다. `--update` 뒤 남은 `drift` 15행은 이미 맞는 자리인데 키가 살아남아 표시를 들고 간 것이라 `flag` 열만 `-` 로 내렸고, 그 뒤 `--update` 재실행이 **바이트 동일**(멱등)임을 확인했습니다.
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
python3 scripts/kanban.py review-judge <project-root> --card KAN-046-ZFDFCQ --item <번호> --verdict 승인
# 추가 의견
python3 scripts/kanban.py review-note <project-root> --card KAN-046-ZFDFCQ --item <번호> --text "<추가 의견>"
# 추가 의견을 반영하다 새 의견이 생겼으면 (맨 뒤에 붙어 앞 번호가 안 밀립니다)
python3 scripts/kanban.py review-item <project-root> --card KAN-046-ZFDFCQ --add "<주제>
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
     `review-judge --card KAN-046-ZFDFCQ --verdict 승인` 이 이 자리를 쓰고
     frontmatter 의 status 도 함께 고친다. 손으로 적어도 되지만, 그때는 수렴 검사를
     안 거치므로 `validate` 가 항목 판정과 어긋난 승인을 error 로 잡는다. -->

**판정**: (아직 없습니다)

**판정 이력**:

- 승인이면 → `apply --op move --id KAN-046-ZFDFCQ --to done` 뒤에 `main` 병합과 워크트리 정리(출력의 `cleanup`)
- 반려면 → `apply --op move --id KAN-046-ZFDFCQ --to doing` 뒤에 `doc-log --entry "<반려 사유>"`.
  요청서는 **지우지도 다시 뜨지도 않는다** — 고친 뒤 그 항목을 `review-judge --verdict 승인` 으로
  뒤집으면 같은 문서에서 수렴한다. 1·2항이 낡았으면 `review-init --refresh` 로 그 두 항만 간다.
