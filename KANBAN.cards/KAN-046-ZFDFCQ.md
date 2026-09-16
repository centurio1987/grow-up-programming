---
card: KAN-046-ZFDFCQ
title: 밀린 인용 39건 정정 — KAN-045 대장이 drift 로 표시한 자리
created: 2026-09-16
scope: docs/ORD-006-conventions.md, docs/ORD-006-runbook.md, src/data-structures/heap/binomialHeap/binomialHeap-guide.mdx, src/data-structures/tree/bTree/bTree-guide.mdx, src/data-structures/tree/orderStatisticTree/orderStatisticTree-guide.mdx, sandbox/ds-guide-v2/SPEC.md, sandbox/algo-guide-v2/FEEDBACK.md, tools/_baseline/citations.tsv
---

# KAN-046-ZFDFCQ — 밀린 인용 39건 정정 — KAN-045 대장이 drift 로 표시한 자리

## 전략
**푸는 것.** KAN-045 의 게이트가 `drift` 로 표시한 인용 **39개(대장 97행)**를 실제 대상 줄로 맞추고 표시를 걷는다. 게이트는 지금 **통과**한다 — 대장이 「밀린 상태」를 기준으로 떴기 때문이다. 그래서 이 카드가 고치기 전까지는 **아무도 안 걸리는 채로 틀린 자리**다.

**왜 이 카드가 따로 있나.** 게이트를 세우는 카드가 고치는 일까지 하면 범위가 섞인다 — KAN-045 는 목록과 `drift` 표시까지로 선을 그었다(그 카드 전략). 정정의 정본은 커밋 `421e238` 대장의 `drift` 97행이고, 밀린 폭의 근거는 KAN-045 배치3 문서의 갈래표다.

**갈래 다섯(배치3 실측).**

| 갈래 | 무엇 | 인용 | 대장 행 | 밀린 폭 |
|---|---|---|---|---|
| A | 규약 문서 **정정 추적표 두 벌**의 자기 인용 | 대부분 | 80 | 블록으로 균일 — **+67 · +121 · +124** |
| B | 규격 절이 가리키는 `tools/check-citations.ts` | 5 | 8 | `S2` 가 그 파일을 161 → 751 줄로 다시 써서 밀렸다 |
| C | 가이드 여섯 — `binomialHeap`(3) · `bTree` · `orderStatisticTree` · `sandbox/ds-guide-v2/SPEC.md` | 6 | 6 | `guide-core` 가 **코드 내용만** 대조해 줄 번호는 아무도 안 보던 자리다 |
| D | 규약 문서의 그 밖 | 3 | 2 | `ord006-inventory.ts:231`→227 · `KAN-027.md:159`→168 |
| E | `FEEDBACK.md:594` → `check-v2.ts:409` | 1 | 1 | →713 |

**하는 법.** 갈래마다 **한 줄씩 대조**한다 — 인용을 감싼 산문이 무엇을 가리키려 했는지 읽고, 그 내용이 지금 몇 줄인지 찾아 번호를 고친다. 블록 밀림이라도 「+67 을 일괄 적용」하지 않는다. 같은 블록 안에서도 그 뒤 편집으로 폭이 갈린 줄이 있을 수 있고, 이 카드가 틀리면 다음 게이트가 그것을 **정상으로 학습**한다.

**모호 1건은 고치지 않는다.** `FEEDBACK.md:179 → check-v2.ts:381` 은 인용 당시에도 지금도 대상이 주석 기호뿐이라 무엇을 가리키려 했는지 산문에서 안 읽힌다. 판정을 적고 `drift` 를 남긴다.

**기록 11건도 고치지 않는다.** 런북 B2·B3 배치 기록처럼 「그때 그랬다」를 적은 자리는 고치면 기록이 거짓이 된다. KAN-045 가 이미 그렇게 갈라 두었다.

**끝내는 법.** 정정 뒤 `bun run tools/check-citations.ts --update` 로 대장을 갱신한다. 래칫 가드는 **내려가는 것을 막지 않는다**(KAN-045 `S5`). 다만 갈래 사이 재분류로 한 갈래가 오르면 `--update` 가 막히므로, 그때는 경로를 적어 보류를 없앤다.

## 실행 계획
- [ ] `S1` 갈래 A — 규약 문서 정정 추적표 두 벌의 자기 인용(대장 80행)을 한 줄씩 대조해 정정
- [ ] `S2` 갈래 B · D — 규격 절이 가리키는 `tools/check-citations.ts` 8행 · `ord006-inventory.ts` · `KAN-027.md`
- [ ] `S3` 갈래 C · E — 가이드 여섯과 `FEEDBACK.md` → `check-v2.ts`, 모호 1건 판정 기록
- [ ] `S4` 대장 갱신과 마감 — `--update` · `drift` 0 · 통합 검증

### 단계별 완료 기준

- **`S1`**: 대장에서 `flag` 가 `drift` 이고 출처·대상이 모두 `docs/ORD-006-conventions.md` 인 80행을 다룬다. 인용마다 **감싼 산문이 무엇을 가리키려 했는지** 읽고 그 내용의 현재 줄을 찾아 고친다. 블록 밀림(+67 · +121 · +124)은 **가설이지 규칙이 아니다** — 줄마다 확인하고, 폭이 다른 줄이 나오면 그 사실을 배치 문서에 적는다. 고친 뒤 그 자리들이 산문과 맞는지 **전수 재확인**.
- **`S2`**: 갈래 B 5인용 8행(`:61-62`→68-69 · `:51-58`→58-65 두 자리 · `:5-12`→6-13 · `:30-41`→37-48 가 배치3 의 관찰값이다. 그대로 믿지 말고 대상 파일에서 확인한다) · 갈래 D 둘(`tools/ord006-inventory.ts:231`→227 · `KANBAN.cards/KAN-027.md:159`→168).
- **`S3`**: 갈래 C 여섯 — `binomialHeap-guide.mdx` 셋(→ `_reference/binomialHeap.ts` 142 · 195 · 136) · `bTree-guide.mdx` · `orderStatisticTree-guide.mdx` · `sandbox/ds-guide-v2/SPEC.md`. 갈래 E 하나(`FEEDBACK.md:594` → `check-v2.ts:409`→713). 모호 1건(`FEEDBACK.md:179` → `check-v2.ts:381`)은 **고치지 않고** 판정 사유를 카드 수행 내역과 배치 문서에 남긴다. 가이드 본문의 설명이 대상 코드와 어긋나면 그 사실만 적고 본문은 KAN-036 몫으로 넘긴다.
- **`S4`**: `bun run tools/check-citations.ts --update` 로 대장 갱신 → `drift` 행이 **모호 1건을 뺀 0** 이 된다. `bun run tools/ci.ts all` · `cd rust && cargo test` · `bun test tools/check-citations.test.ts tools/ci-workflow.test.ts` 통과. 래칫 수치가 오르지 않았는지 확인(오르면 경로를 적어 없앤다).

## 검증
**카드 종료 조건.**

1. 대장(`tools/_baseline/citations.tsv`)의 `drift` 행이 **모호 1건을 뺀 0** 이고, 남긴 1건은 사유가 카드에 적혀 있다.
2. 고친 인용마다 **대상 줄의 내용이 감싼 산문의 주장과 맞는다** — 표본이 아니라 전수로 확인한 기록이 배치 문서에 있다.
3. `bun run tools/check-citations.ts` 통과(대장 일치 · 래칫 불변 또는 하락) · `bun run tools/ci.ts all` 통과 · `cd rust && cargo test` 통과.
4. 고치지 않기로 한 것(모호 1건 · 기록 11건)이 무엇이고 왜인지 카드에 남는다.

## 수행 내역
<!-- KANBAN:LOG append-only — 아래로만 덧붙인다. 위를 고치지 않는다. -->
- 2026-09-16T20:02 · s:f2fd90c7 — `전략` 섹션 교체
- 2026-09-16T20:03 · s:f2fd90c7 — `실행 계획` 섹션 교체
- 2026-09-16T20:03 · s:f2fd90c7 — `검증` 섹션 교체
