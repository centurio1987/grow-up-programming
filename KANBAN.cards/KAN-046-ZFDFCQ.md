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
- [x] `S1` 갈래 A — 규약 문서 정정 추적표 두 벌의 자기 인용(대장 80행)을 한 줄씩 대조해 정정
- [x] `S2` 갈래 B · D — 규격 절이 가리키는 `tools/check-citations.ts` 8행 · `ord006-inventory.ts` · `KAN-027.md`
- [x] `S3` 갈래 C · E — 가이드 여섯과 `FEEDBACK.md` → `check-v2.ts`, 모호 1건 판정 기록
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
- 2026-09-16T20:07 · s:f2fd90c7 · S3 doing — 착수
- 2026-09-16T20:14 · s:f2fd90c7 · S3 — `S3` 갈래 C·E 인용 7건 정정 — binomialHeap-guide 3(136-138→142-144 · 165→195 · 130→136) · bTree-guide(avlTree-guide:537→541) · orderStatisticTree-guide(런북 169→215) · ds-guide-v2/SPEC(section.ts:141→192) · algo-guide-v2/FEEDBACK(check-v2.ts:409→713). 전수 대조 근거는 배치1 문서 `### WP2` 1.
- 2026-09-16T20:14 · s:f2fd90c7 · S3 — 모호 1건 `sandbox/algo-guide-v2/FEEDBACK.md:179` → `tools/check-v2.ts:381` 은 고치지 않고 `drift` 를 남겼다 — 인용 커밋(fcba588c) 시점 381 이 `//` 한 줄이고 지금 381 도 ` *` 라 두 시점 모두 대상에 내용이 없다. 옮겨 간 자리를 지목할 근거가 없고, 추정으로 박으면 `S4` 대장이 그것을 정답으로 학습한다.
- 2026-09-16T20:14 · s:f2fd90c7 · S3 — `S3` 검증 — check-citations 어긋남 13건이 전부 정정한 7자리(신규 7·소멸 6, 다른 파일 0) · guide-core check 통과(펜스 58) · check-links 849 통과 · tsc 0. 다섯 파일 줄 수 보존. `S4` 확인 사항: orderStatisticTree-guide → 런북 215 는 담당 A 가 같은 런북을 고치므로 `--update` 직전 재대조.
- 2026-09-16T20:14 · s:f2fd90c7 · S3 done — 완료
- 2026-09-16T20:18 · s:f2fd90c7 · S1 doing — 착수
- 2026-09-16T20:18 · s:f2fd90c7 · S2 doing — 착수
- 2026-09-16T20:25 · s:f2fd90c7 · S1 — 갈래 A — 추적표 두 벌의 목록 행 자기 인용 154 개 정정(추적표① 66 · 추적표② 88) + 추적표① 135 행 「짧은 인용 14 곳」 좌표 8 개. 목록 일곱의 본문 첫 행을 실측해 행 순서로 풀었다 — 밀림 +67(B군·배치12) · +121(A군·원칙A) · +124(원칙B) 이 154 개 전부에서 성립, 예외 0. 135 행만 폭이 갈렸다(0·+89·+103·+113·+119·+121). 222 행 전수 재확인 — 일치 221, 나머지 하나는 고치지 않은 #123 의 문면 차이. 줄 수·글자 수 보존(8,362).
- 2026-09-16T20:26 · s:f2fd90c7 · S2 — 갈래 B 5(check-citations.ts :61-62→68-69 · :51-58→58-65 두 자리 · :5-12→6-12 · :30-41→37-48 — 배치3 의 6-13 은 끝이 빈 주석 줄이라 6-12 로 정정) · 갈래 D 3(ord006-inventory.ts:231→227 · KAN-027.md :159→168 두 자리). 대상 파일을 열어 전수 대조했다(옛 판본 9b16490 과 줄마다 맞댐). 대장이 표시하지 않았는데 밀려 있던 8 건도 함께 고쳤다 — 추적표① 135 행 좌표 다섯 · A군 목록 :4808→4810 · :5726→5728 · 추적표② #96 :6218→6339.
- 2026-09-16T20:26 · s:f2fd90c7 · S1 done — 완료
- 2026-09-16T20:26 · s:f2fd90c7 · S2 done — 완료
