---
card: KAN-044-VZXM29
title: cartesianTree 구성 상한의 셋째 계열 실측 — 헤더 「배제되는 계열은 둘」 보강
created: 2026-09-17
branch: KAN-044-VZXM29
worktree: /Users/centurio/orca/workspaces/code_test/KAN-044-VZXM29
base: 5f25c38
status: 검토 대기
---

# KAN-044-VZXM29 검토 요청 — cartesianTree 구성 상한의 셋째 계열 실측 — 헤더 「배제되는 계열은 둘」 보강

카드: [KAN-044-VZXM29.md](../KANBAN.cards/KAN-044-VZXM29.md)

> 이 문서는 **검토를 위한 산출물**이다. 수행 내역은 카드 실행 문서에 있고, 착수 전
> 계획은 배치 문서에 있다. 여기 있는 것은 "지금 이 브랜치를 무엇으로 판정하는가" 뿐이다.

## 1. 검토 대상

| 항목 | 값 |
|---|---|
| 브랜치 | `KAN-044-VZXM29` |
| 워크트리 | `/Users/centurio/orca/workspaces/code_test/KAN-044-VZXM29` |
| 베이스 | `5f25c38` |
| 변경 훑기 | `git diff 5f25c38...HEAD` |

**커밋 5건**

```text
0952973 KAN-044 배치2: 검토 반려 셋을 닫는다 (S3 · S4)
4671882 kanban: KAN-044 배치2 계획 — 검토 반려 셋 처리(S3 약한 한정자 둘 · S4 받는 자리)
ad2305f kanban: KAN-044 검토 — 승인 4 · 반려 3 (Fable 5.1 · 판정 by=ai)
c9b805a kanban: KAN-044 → 검토 (판단 항목 7 · 검증 결과 동봉)
41e3aa3 KAN-044 배치1: cartesianTree 셋째 계열 실측과 성질로 하는 전수 판정 (S1 · S2)
```

**변경 파일 19개 (+997 −53)**

| 파일 | 상태 | 추가 | 삭제 |
|---|:--:|---:|---:|
| `.kanban/archive.jsonl` | M | 3 | 0 |
| `.kanban/log.md` | M | 3 | 3 |
| `.kanban/reviews/KAN-044-VZXM29.events.jsonl` | M | 29 | 0 |
| `.kanban/reviews/KAN-044-VZXM29.review.json` | M | 21 | 0 |
| `.kanban/state.json` | M | 34 | 33 |
| `KANBAN.batches/KAN-044-VZXM29.batch1.md` | M | 69 | 5 |
| `KANBAN.batches/KAN-044-VZXM29.batch2.md` | M | 84 | 0 |
| `KANBAN.board.html` | M | 2 | 2 |
| `KANBAN.cards/KAN-044-VZXM29.md` | M | 21 | 2 |
| `KANBAN.md` | M | 3 | 2 |
| `KANBAN.reviews/KAN-044-VZXM29.review.md` | M | 231 | 0 |
| `docs/ORD-006-conventions.md` | M | 129 | 0 |
| `docs/ORD-006-runbook.md` | M | 37 | 0 |
| `src/data-structures/_contract/_fixtures/deferredCartesianTree.ts` | M | 70 | 0 |
| `src/data-structures/_contract/runContract.cartesianTree.test.ts` | M | 223 | 0 |
| `src/data-structures/tree/cartesianTree/cartesianTree.ts` | M | 19 | 5 |
| `src/data-structures/trie/suffixArray/suffixArray.ts` | M | 9 | 0 |
| `src/data-structures/trie/suffixTree/suffixTree.ts` | M | 9 | 0 |
| `tools/_baseline/citations.tsv` | M | 1 | 1 |

**롤백 태그 6개**

```text
kan/KAN-044-VZXM29/S1
kan/KAN-044-VZXM29/S2
kan/KAN-044-VZXM29/S3
kan/KAN-044-VZXM29/S4
kan/KAN-044-VZXM29/batch1
kan/KAN-044-VZXM29/batch2
```

## 2. 검증 — 기준과 실행 결과

<!-- 기준은 카드 실행 문서 「검증」 절의 사본이다. 정본은 KANBAN.cards/KAN-044-VZXM29.md 이므로
     기준이 바뀌면 그쪽을 고치고 review-init --refresh 로 이 항만 다시 뜬다.
     결과는 착수한 쪽이 이미 돌린 것이다 — 검토자에게 다시 돌리라고 시키지 않는다.
     **다시 돌려 아래와 다르게 나오면 그 자체가 반려 사유다.** -->

**기준**

- **축1·축2**: 새 fixture 가 계약 동작과 불변식을 전부 통과한다. 통과하지 못하면 그것은 「축3만 어기는 계열」이 아니므로 근거가 되지 않는다.
- **축3**: 걸리는 시나리오와 통과하는 시나리오가 **각각 무엇인지** 자기시험에 수치로 고정된다. 걸리는 자리가 하나도 없으면 그 사실을 검사 공백으로 적고 헤더 문단의 주장을 그에 맞춰 고친다(「배제해도 잃는 것이 없다」를 근거 없이 적지 않는다).
- **전수 조사**: 성질로 훑은 결과가 목록으로 남고, 목록의 각 행이 처분(고침 · 둠 · 넘김)과 근거를 갖는다. 목록에 없는 구조가 뒤에 나오면 조사 기준이 틀린 것이므로 기준을 적어 둔다.
- **게이트**: `bun run tools/ci.ts all` 17단계 · `bun run tools/check-contract.ts` · `bun run tools/check-citations.ts`(대장 지문 일치 · 래칫 세 칸 유지) · `bunx tsc --noEmit` · 고친 파일의 `bunx --bun @biomejs/biome check` 경고 0 · `cd rust && cargo test --workspace`.
- **문서 정정**: 줄 수를 유지했는지 `git diff --numstat` 으로 확인하고, 표류가 고친 자리에서만 났는지 목록을 눈으로 본 뒤 대장을 갱신한다.

**실행 결과**

```text
배치2 커밋(0952973) 상태에서 착수한 쪽이 돌린 출력이다. 검토자는 같은 명령을 다시 돌리지 않아도 된다 — 특히 ci.ts all 은 워커를 수백 개 띄우므로 돌리지 않는다.

[1] bun run tools/ci.ts all → all 모드 통과 · 단계 17개
    자기검증 712 · 도구 501 · 시뮬 14 · 통계 판정 53 · 정본 1,321 전부 0 fail.
    실습 스텁 627 fail 은 판정 제외(정상).

[2] bun test src/data-structures/_contract/runContract.cartesianTree.test.ts
    4 pass · 0 fail. 훑기 두 시험이 이제 worst · amortized · expected 셋을
    지연 구성 계열 · 수열만 드는 계열 · 정본 셋 다에 대해 나란히 고정한다.

[3] bun run tools/check-contract.ts → 67종 일치
    bun run tools/emit-vectors.ts --check → 56종
    bun run tools/guide-core.ts check → 58건
    bun run tools/check-links.ts check → 870건

[4] bun run tools/check-citations.ts
    인용 1,211건 · 대장 1,199행 지문 일치.
    래칫 세 칸 그대로: 칸반 밖 461(detached 74 · unresolved 14 · naked-name 14) ·
    카드 23(detached 2 · unresolved 16) · 맨 줄 번호 29.
    이번 배치는 표류 0건이다 — --update 가 대장 파일을 한 줄도 바꾸지 않았다.
    헤더에서 걸린 인용 하나는 마무리 문장보다 위의 계열 셋 문단을 가리키고, 규약·런북에서
    고친 자리는 이 카드가 쓴 절 안이라 가리키는 인용이 없다.

[5] bunx tsc --noEmit → 통과
    bunx --bun @biomejs/biome check <고친 다섯 파일> → 경고 10건은 전부 학습자 스텁의
    미사용 매개변수로 이 카드 전부터 있던 것이다. 이번에 넣은 것은 주석 줄뿐이다.

[6] cd rust && cargo test --workspace → 전부 통과

[7] git diff --numstat 로 확인한 변경 모양(배치2 몫)
    src/data-structures/tree/cartesianTree/cartesianTree.ts 7 추가 · 7 삭제(줄 수 유지)
    src/data-structures/trie/suffixArray/suffixArray.ts 9 추가 · 0 삭제(검사 공백 한 문단)
    src/data-structures/trie/suffixTree/suffixTree.ts 9 추가 · 0 삭제(같음)
    docs/ORD-006-conventions.md 61 추가 · 30 삭제(전부 이 카드가 쓴 새 절 안)
    docs/ORD-006-runbook.md 25 추가 · 13 삭제(불변 사실 404 · 405)
    src/data-structures/_contract/runContract.cartesianTree.test.ts 34 추가 · 10 삭제
    src/data-structures/_contract/_fixtures/deferredCartesianTree.ts 4 추가 · 3 삭제(머리말)
    tools/_baseline/citations.tsv 변경 없음

[8] 배치2 가 직접 잰 expected (시나리오 본문 · 입력 · 걸음을 그대로 두고 한정자만 바꿔 판정기 호출)

    시나리오          한정자      지연 구성                      정본                    수열만 드는 계열
    훑기(무작위)      worst       실패 5,112·20,469·81,902       통과 4·4·4              실패 2,049·8,193·32,769
                      amortized   통과 8.19·8.16·8.13            통과 3.20·3.16·3.14     실패 579.67·1,552.29·5,109.18
                      expected    통과 8.17·8.16·8.15            통과 3.19·3.16·3.15     실패 472.86·1,563.69·5,786.64
    훑기(사슬)        worst       실패 4,098·16,386·65,538       통과 4·4·4              실패 3,070·12,286·49,150
                      amortized   통과 7.51·7.50·7.50            통과 3.51·3.50·3.50     실패 1,286.89·5,130.45·20,496.46
                      expected    통과 7.50·7.50·7.50            통과 3.50·3.50·3.50     실패 1,278.07·5,123.87·20,479.39

    검토자가 낸 expected 여섯 묶음과 한 자리도 다르지 않았다. 문서에 실은 값은 이 배치가 잰
    값이고, 일치라는 사실을 함께 적었다. 판정기의 expected 정의도 확인했다 — seed 다섯의
    시퀀스 평균 중 중앙값이지 최대가 아니다.
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
python3 scripts/kanban.py review-judge <project-root> --card KAN-044-VZXM29 --item <번호> --verdict 승인
# 추가 의견
python3 scripts/kanban.py review-note <project-root> --card KAN-044-VZXM29 --item <번호> --text "<추가 의견>"
# 추가 의견을 반영하다 새 의견이 생겼으면 (맨 뒤에 붙어 앞 번호가 안 밀립니다)
python3 scripts/kanban.py review-item <project-root> --card KAN-044-VZXM29 --add "<주제>
  <상세>"
```

**전체 승인은 살아있는 항목이 전부 승인일 때만 섭니다**(철회는 분모에서 빠집니다). 하나라도
반려·추가 의견·미정이면 4항의 전체 승인도 `→ 완료` 이동도 종료코드 14로 거부됩니다.

- [ ] 지연 구성 fixture 가 이 계약의 셋째 계열을 옳게 대표하는가
    - **상세** — 이 카드가 푼 것은 하나다 — `tree/cartesianTree` 헤더가 「배제되는 계열은 둘」이라 적었는데 앞 카드가 셋째 계열(구성을 첫 질의로 미루기)을 `range-query/sparseTable` 에서 실물로 냈고(런북 불변 사실 328), 이 계약만 그 정정을 못 받았습니다. 짓지 않고 산문만 고치면 「배제해도 잃는 것이 없다」의 근거가 비므로 실물을 지어 쟀습니다. 새 fixture 는 `src/data-structures/_contract/_fixtures/deferredCartesianTree.ts` 이고, 생성자는 수열을 자리마다 1 씩 세며 베끼기만 하고 다섯 질의 중 처음 불린 것이 안쪽 정본을 세웁니다. 계측은 베낀 몫에 안쪽 정본의 계측을 더한 것이고, 부분트리 객체를 따로 감싸지 않은 것은 정본의 부분트리가 뿌리의 칸을 올리기 때문입니다. 축1 은 경계 여덟과 무작위 500 회에서 참조 모델과 갈리는 자리가 없었고, 이 계약은 불변식 절이 「없다」라 축2 는 돌 것이 없습니다. 판정할 것은 이 구현이 계약을 지키면서 축3 만 어기는 계열의 대표로 옳은가, 그리고 계측 단위를 그렇게 잡은 것이 규약2 의 계측 규약과 맞는가입니다. 머리말은 `src/data-structures/_contract/_fixtures/deferredCartesianTree.ts:1-20`, 선례는 `src/data-structures/_contract/_fixtures/deferredSparseTable.ts:1-13`.

    > **판정** — _아직 없습니다._

    > **추가 의견** — _아직 없습니다._

- [ ] 걸리는 질의 시나리오가 예측과 달리 하나가 아니라 둘인 것
    - **상세** — 카드 전략은 「구성 시나리오는 통과하고 질의 시나리오의 단일 호출 최대에서 걸린다」고 예측했고 방향은 맞았지만, 걸린 자리가 둘이었습니다 — 훑기를 겨눈 시나리오가 둘이고(무작위와 사슬) 둘 다 첫 걸음이 트리를 짓습니다. 실측은 5,112 · 20,469 · 81,902 와 4,098 · 16,386 · 65,538 이고 비율이 둘 다 4.00 이며, 정본은 같은 자리에서 4 · 4 · 4 입니다. `sparseTable` 은 질의 시나리오가 하나뿐이라 하나에서만 걸렸습니다. 판정할 것은 둘에서 걸리는 것이 이 계약의 자연스러운 결과인가(질의를 겨눈 시나리오가 둘이니 당연한가), 아니면 시나리오 둘이 같은 성질을 두 번 재고 있어 하나로 줄여야 하는가입니다. 헤더의 근거 문단은 `src/data-structures/tree/cartesianTree/cartesianTree.ts:102`.

    > **판정** — _아직 없습니다._

    > **추가 의견** — _아직 없습니다._

- [ ] 호출 평균이 진짜 상수라는 실측으로 헤더 마무리 문장을 뒤집은 것
    - **상세** — 같은 실행을 한정자만 바꿔 호출 평균으로 읽으니 지연 구성 계열이 8.19 · 8.16 · 8.13(무작위)과 7.51 · 7.50 · 7.50(사슬)으로 **통과**했습니다. 선례에서는 같은 계열의 평균이 로그를 따라 자라 「축3 해상도 아래라 통과」였는데, 여기서는 구성이 선형이고 나눠 갚을 걸음이 n 개라 평균이 고정됩니다 — 이 계열이 상각 읽기를 **실제로 지킨다**는 뜻입니다. 그래서 헤더의 옛 마무리 문장(「상태가 하나뿐인 구조에서 amortized 나 expected 를 적는 것은 아무것도 다르게 배제하지 않으면서 상한을 흐리는 것」)을 고쳤습니다 — 이 구조에서 amortized 는 셋째 계열을 통째로 들이는 것이고, 흐리기가 참인 것은 expected 쪽뿐입니다. 판정할 것은 이 뒤집기가 맞는가, 그리고 같은 마무리 문장을 쓰는 다른 계약에도 같은 뒤집기가 필요한가입니다. 자리는 `src/data-structures/tree/cartesianTree/cartesianTree.ts:108` 과 규약 `docs/ORD-006-conventions.md:8730`.

    > **판정** — _아직 없습니다._

    > **추가 의견** — _아직 없습니다._

- [ ] 자기시험을 공용 파일이 아니라 새 파일로 뺀 판단
    - **상세** — 새 자기시험을 `src/data-structures/_contract/runContract.cartesianTree.test.ts` 로 따로 만들었습니다. 공용 자기시험 파일에 줄을 넣으면 이 카드 범위 밖의 가이드 인용이 밀리기 때문이고(런북 불변 사실 106 · 255), `runContract.sparseTable.test.ts` 가 같은 이유로 갈라진 선례입니다. 판정할 것은 이 분리가 규약이 인정하는 길인가, 아니면 자기시험 파일이 계약마다 늘어나는 것을 막을 규칙이 필요한가입니다. 근거는 `docs/ORD-006-runbook.md:192` 와 `docs/ORD-006-runbook.md:432`, 새 파일 머리말은 `src/data-structures/_contract/runContract.cartesianTree.test.ts:1-10`.

    > **판정** — _아직 없습니다._

    > **추가 의견** — _아직 없습니다._

- [ ] 전수 판정의 기준 둘이 옳은 기준인가
    - **상세** — 같은 근거 문단이 필요한 계약을 **이름이 아니라 성질로** 훑었습니다. 기준은 둘입니다 — ① 스텁의 공개 메서드가 전부 질의다(상태를 바꾸는 연산이 하나도 없다) ② 연산 계약 표에 생성자 행이 있고 상한이 적혀 있다. 계약 67 종의 스텁 헤더 표와 공개 메서드를 기계로 뽑아 대조해 다섯이 나왔습니다. 목록 밖 이웃 둘의 근거도 적었습니다 — `tree/merkleTree` 와 `range-query/persistentSegmentTree` 는 갱신 연산이 있어 기준 ① 에서 떨어집니다. 판정할 것은 기준 둘이 이 문단이 필요한 계약을 빠짐없이 거르는가입니다. 예를 들어 공개 연산에 갱신이 있어도 구성 상한이 따로 선 계약이 있다면 기준 ① 이 그것을 놓칩니다. 표는 `docs/ORD-006-conventions.md:8749`, 요약은 런북 `docs/ORD-006-runbook.md:4270`.

    > **판정** — _아직 없습니다._

    > **추가 의견** — _아직 없습니다._

- [ ] suffixArray 와 suffixTree 를 「재지 않았다 · 검사 공백」으로 적고 넘긴 선
    - **상세** — 둘은 기준 둘을 만족해 목록에 들지만, 「배제되는 계열은 둘」이라는 문장을 쓴 것이 아니라 **한정자 근거 문단이 아예 없습니다.** 두 계약의 스위트는 그 계열을 잡을 모양으로 읽힙니다(질의 시나리오가 색인을 걸음 밖에서 짓고 그 뒤 n 번을 재므로 첫 걸음이 구성을 집니다) — 다만 이것은 코드를 읽은 구조적 사실이고 **실제로 재지는 않았습니다.** 그래서 「걸린다」가 아니라 검사 공백으로 적고 다음 카드로 넘겼습니다. 판정할 것은 이 선이 맞는가입니다 — 카드 목표가 「suffixArray · suffixTree 헤더에 같은 근거 문단이 필요한지도 판정된다」였으므로 「필요하다 · 재지 않았다 · 다음 카드」가 그 목표를 채운 것인지, 아니면 이 카드 안에서 실물을 지어 재야 했는지. 두 헤더의 해당 자리는 `src/data-structures/trie/suffixArray/suffixArray.ts:44` 와 `src/data-structures/trie/suffixTree/suffixTree.ts:57` 이고(둘 다 「구성 시점」 문단만 있고 한정자 근거 문단이 없습니다), 처분은 `docs/ORD-006-conventions.md:8749` 의 표에 적었습니다.

    > **판정** — _아직 없습니다._

    > **추가 의견** — _아직 없습니다._

- [ ] 규약 기존 절 셋의 담당이 미정으로 남은 것
    - **상세** — 규약의 기존 절 셋이 이 카드로 끝난 일을 아직 남은 일로 적고 있습니다 — ① 앞 카드의 정정 목록에 있는 이 계약 행 ② 정정 담당 표의 한 행과 그 위의 「사람이 담당을 정해야 한다」 범례 ③ 앞 카드가 셋째 계열을 보강하며 적은 「그 하나를 보강하는 일은 별도 카드다」. 작업 분해 문서 4절의 「기존 절을 고치지 않는다」를 따라 손대지 않고 새 절의 「낡는 문장」 표에 적었습니다(`docs/ORD-006-conventions.md:8779`). 처음에는 줄 수를 유지한 제자리 정정으로 닫았다가, 앞 카드가 같은 자리에서 규약 문서 쪽은 다른 카드로 넘긴 선례를 보고 되돌렸습니다. 판정할 것은 되돌린 것이 맞는가, 그리고 담당을 `KAN-049` 에 얹을지입니다 — 그 카드는 이미 규약 문서 두 자리를 담당으로 받았지만, 다른 카드의 브리프를 고치는 일이라 이 배치에서는 하지 않았습니다.

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
     `review-judge --card KAN-044-VZXM29 --verdict 승인` 이 이 자리를 쓰고
     frontmatter 의 status 도 함께 고친다. 손으로 적어도 되지만, 그때는 수렴 검사를
     안 거치므로 `validate` 가 항목 판정과 어긋난 승인을 error 로 잡는다. -->

**판정**: (아직 없습니다)

**판정 이력**:

- 승인이면 → `apply --op move --id KAN-044-VZXM29 --to done` 뒤에 `main` 병합과 워크트리 정리(출력의 `cleanup`)
- 반려면 → `apply --op move --id KAN-044-VZXM29 --to doing` 뒤에 `doc-log --entry "<반려 사유>"`.
  요청서는 **지우지도 다시 뜨지도 않는다** — 고친 뒤 그 항목을 `review-judge --verdict 승인` 으로
  뒤집으면 같은 문서에서 수렴한다. 1·2항이 낡았으면 `review-init --refresh` 로 그 두 항만 간다.
