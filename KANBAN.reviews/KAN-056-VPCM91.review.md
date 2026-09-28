---
card: KAN-056-VPCM91
title: 알고리즘 가이드 집필 로직 피드백
created: 2026-09-26
branch: KAN-056-VPCM91
worktree: /Users/centurio/orca/workspaces/code_test/KAN-056-VPCM91
base: 5ad56c0
status: 검토 대기
---

# KAN-056-VPCM91 검토 요청 — 알고리즘 가이드 집필 로직 피드백

카드: [KAN-056-VPCM91.md](../KANBAN.cards/KAN-056-VPCM91.md)

> 이 문서는 **검토를 위한 산출물**이다. 수행 내역은 카드 실행 문서에 있고, 착수 전
> 계획은 배치 문서에 있다. 여기 있는 것은 "지금 이 브랜치를 무엇으로 판정하는가" 뿐이다.

## 1. 검토 대상

| 항목 | 값 |
|---|---|
| 브랜치 | `KAN-056-VPCM91` |
| 워크트리 | `/Users/centurio/orca/workspaces/code_test/KAN-056-VPCM91` |
| 베이스 | `5ad56c0` |
| 변경 훑기 | `git diff 5ad56c0...HEAD` |

**커밋 9건**

```text
c909300 KAN-056 S6 — 검증 전체 통과 기록
098410b KAN-056 S6 — check-v2.ts·section.ts·FEEDBACK.md 줄 이동으로 어긋난 인용 11곳 재지정, 대장 갱신
de8a56c KAN-056 S4·S5 — sparseTableRangeMin 파일럿: 서사를 「아이디어를 떠올리는 과정」으로 분리하고 아이디어 상세를 직무 일곱으로 재작성
6e4f576 KAN-056 S3 — FEEDBACK R24 기록
fa2d0df KAN-056 S2 — 스캐너가 deep.origin(아이디어를 떠올리는 과정)을 해소하고 있을 때만 그림·코드를 검사
5c85298 KAN-056 S1 — algo-guide-v2 SPEC: 아이디어 상세에서 서사를 deep.origin 으로 분리
023458b kanban: KAN-056 배치 계획 셋
1a64f08 kanban: KAN-056 실행 문서 — 전략·실행 계획(S1~S7)·검증
ca88485 kanban: KAN-056 진행 중으로 이동
```

**변경 파일 23개 (+852 −149)**

| 파일 | 상태 | 추가 | 삭제 |
|---|:--:|---:|---:|
| `.kanban/archive.jsonl` | M | 1 | 0 |
| `.kanban/log.md` | M | 1 | 1 |
| `.kanban/state.json` | M | 22 | 15 |
| `KANBAN.batches/KAN-056-VPCM91.batch1.md` | M | 42 | 0 |
| `KANBAN.batches/KAN-056-VPCM91.batch2.md` | M | 38 | 0 |
| `KANBAN.batches/KAN-056-VPCM91.batch3.md` | M | 38 | 0 |
| `KANBAN.board.html` | M | 4 | 4 |
| `KANBAN.cards/KAN-034-KSD7XR.md` | M | 1 | 1 |
| `KANBAN.cards/KAN-034.7-QMZ3RE.md` | M | 1 | 1 |
| `KANBAN.cards/KAN-034.8-BK1Q3A.md` | M | 3 | 3 |
| `KANBAN.cards/KAN-035-31T4BY.md` | M | 3 | 3 |
| `KANBAN.cards/KAN-056-VPCM91.md` | M | 93 | 0 |
| `KANBAN.md` | M | 13 | 11 |
| `KANBAN.requests/doing/KAN-056-VPCM91.request.md` | R | 0 | 0 |
| `sandbox/algo-guide-v2/FEEDBACK.md` | M | 3 | 2 |
| `sandbox/algo-guide-v2/SPEC.md` | M | 96 | 44 |
| `sandbox/ds-guide-v2/SPEC.md` | M | 1 | 1 |
| `src/algorithms/array/sparseTableRangeMin/sparseTableRangeMin-guide.md` | M | 237 | 43 |
| `src/algorithms/array/sparseTableRangeMin/sparseTableRangeMin-guide.proof.ts` | M | 169 | 5 |
| `tools/_baseline/citations.tsv` | M | 14 | 13 |
| `tools/check-v2.test.ts` | M | 64 | 1 |
| `tools/check-v2.ts` | M | 6 | 1 |
| `tools/section.ts` | M | 2 | 0 |

**롤백 태그 8개**

```text
kan/KAN-056-VPCM91/S1
kan/KAN-056-VPCM91/S2
kan/KAN-056-VPCM91/S3
kan/KAN-056-VPCM91/S4
kan/KAN-056-VPCM91/S5
kan/KAN-056-VPCM91/S6
kan/KAN-056-VPCM91/batch1
kan/KAN-056-VPCM91/batch2
```

## 2. 검증 — 기준과 실행 결과

<!-- 기준은 카드 실행 문서 「검증」 절의 사본이다. 정본은 KANBAN.cards/KAN-056-VPCM91.md 이므로
     기준이 바뀌면 그쪽을 고치고 review-init --refresh 로 이 항만 다시 뜬다.
     결과는 착수한 쪽이 이미 돌린 것이다 — 검토자에게 다시 돌리라고 시키지 않는다.
     **다시 돌려 아래와 다르게 나오면 그 자체가 반려 사유다.** -->

**기준**

<!-- 무엇을 실행해 무엇이 나오면 이 카드가 끝난 것인가. -->
```bash
G=src/algorithms/array/sparseTableRangeMin/sparseTableRangeMin-guide.md
bun run tools/check-v2.ts $G
bun run tools/check-proof.ts --all --require
bun run tools/check-v2.ts --all                  # 옛 구성 110편이 새로 깨지지 않는다
bun run tools/check-metaphor.ts --all
bun test tools/check-v2.test.ts
bunx tsc --noEmit
bunx --bun @biomejs/biome check tools/section.ts tools/check-v2.ts
bun run tools/check-rework.ts $G '### 아이디어 상세' --base main   # 0.6 이상
bun run tools/ci.ts all
# 아이디어 상세에 서사 증명 표지 0 개
awk '/^### 아이디어 상세 — /{f=1;next} /^### /{f=0} f' $G | grep -cE 'proof:(cost-scan|prefix-min-fails|cost-two-ways|cost-precompute-all)'
# 서사 표지어 — 0 이 목표, 남으면 사유 기록
awk '/^### 아이디어 상세 — /{f=1;next} /^### /{f=0} f' $G | grep -nE '단순한 방법|가장 먼저 떠오르는|차례로 읽|후보|욕심'
# 같은 값 블록 중복 — tools/check-overlap.ts 가 맞으면 그것으로, 아니면 proof.ts 새 키 출력과 pause-* 출력을 대조
bun run tools/build-html.ts $G
```

**사람 판정(최종).** 유저가 HTML 로 두 절을 읽고 「아이디어 상세가 아이디어에 초점을 두고 충분히 자세한가」를 본다. 위 기계 검사는 증명 표지·표지어·재작성률만 재고 산문으로 남은 서사나 설명 품질은 못 잡는다.

**실행 결과**

```text
bun run tools/check-v2.ts sparseTableRangeMin-guide.md   P1~P16 통과 (경고 P3 1건 — 변경 전부터 있던 .sim.ts T1·T2)
bun run tools/check-proof.ts --all --require             통과 (파일럿 증명 22개 전부 실행과 일치)
bun run tools/check-v2.ts --all                          변경 전 출력과 글자 단위로 같음 (옛 구성 110편 무회귀)
bun run tools/check-metaphor.ts --all                    655개 은유 위반 0
bun test tools/check-v2.test.ts                          142 통과 (deep.origin 사례 5건 추가)
bunx tsc --noEmit                                        오류 0
biome check section.ts · check-v2.test.ts · proof.ts     통과 (check-v2.ts:1332 포맷 지적은 변경 전부터 있음)
check-rework '### 아이디어 상세' --base main             재작성률 71% (기준 60%)
아이디어 상세 안 서사 증명 표지                           0 개
아이디어 상세 안 서사 표지어                              0 개
새 증명 블록 넷 ↔ 기존 블록 같은 줄                       0 줄 (check-overlap 은 편 사이 도구라 대신 출력 대조)
bun run tools/ci.ts all → gates                          ci all 은 인용 1건 실패(수정 전 시작) → 인용 11곳 재지정 후 gates 11단계 통과
build-html sparseTableRangeMin-guide.md                  724KB · viz 2개 · 레일 13항목
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
python3 scripts/kanban.py review-judge <project-root> --card KAN-056-VPCM91 --item <번호> --verdict 승인
# 추가 의견
python3 scripts/kanban.py review-note <project-root> --card KAN-056-VPCM91 --item <번호> --text "<추가 의견>"
# 추가 의견을 반영하다 새 의견이 생겼으면 (맨 뒤에 붙어 앞 번호가 안 밀립니다)
python3 scripts/kanban.py review-item <project-root> --card KAN-056-VPCM91 --add "<주제>
  <상세>"
```

**전체 승인은 살아있는 항목이 전부 승인일 때만 섭니다**(철회는 분모에서 빠집니다). 하나라도
반려·추가 의견·미정이면 4항의 전체 승인도 `→ 완료` 이동도 종료코드 14로 거부됩니다.

- [x] 새 「아이디어 상세」가 아이디어에 초점을 두고 충분히 자세한가 — 파일럿 판정. 직무 일곱으로 새로 썼습니다
    - **배경**
      - 카드 원문은 아이디어 상세에서 단순한 방법→아이디어 서사를 빼고 아이디어 자체를 최대한 자세히 쓰라고 했습니다. 원문: KANBAN.md:86-92
      - 새 절은 아래 일곱 부품으로 이뤄집니다. 원문: src/algorithms/array/sparseTableRangeMin/sparseTableRangeMin-guide.md:268
      - ① 표 칸 14개가 각각 맡는 구간
      - ② 겹쳐도 최솟값이 그대로인 이유
      - ③ 아래층 두 칸으로 채우는 규칙과 마지막 칸 경계
      - ④ 두 조각이 빠짐없이 덮는다는 것(다섯 모양)
      - ⑤ 표 크기
      - ⑥ 기대는 전제 셋
      - ⑦ 밑이 2 인 이유
      - 새 값은 전부 정본 실행으로 만든 증명 블록 넷에서 나옵니다.
      - 이 판단은 기계가 못 합니다. 검사는 형식(그림·증명 일치·재작성률 71%)만 잽니다.
    - **정할 것**
      이 수준으로 110편 전개의 기준을 삼을 것인가.

    | 선택지 | 대가 | 그러면 어떻게 되는가 |
    | --- | --- | --- |
    | **추천** 승인 | 한 편이 1,383줄에서 1,577줄로 194줄 늘어난다 | 이 파일럿을 기준으로 110편 전개 카드를 만든다 |
    | 반려 — 더 자세히 | 어느 부품이 부족한지 짚어 주셔야 한다 | 짚은 부품만 다시 쓰고 같은 검토서에서 다시 판정한다 |

    > **판정**
    >
    > - 승인 · 유저 · 2026-09-28

    > **추가 의견**
    >
    > - ai · 2026-09-28 — 지금 원고 기준으로 바뀐 것(2026-09-27~28 유저 피드백 셋 반영): 아이디어 상세가 「직무 일곱」이 아니라 「먼저 알아 둘 개념 — Sparse Table」 + 1~5단계 + 전제 · 밑이 2 인 까닭 · 이은 절차로 섰습니다(src/algorithms/array/sparseTableRangeMin/sparseTableRangeMin-guide.md:305). 한 편이 1,383줄에서 1,814줄이 됐습니다. 유저 판정 원문(2026-09-28 대화): 「합격이다.」

- [ ] 서사 절이 아이디어 이름에서 멈추고, 밑이 2 인 이유는 아이디어 상세 ⑦ 로 옮겼습니다
    - **배경**
      - 카드는 서사를 별도 항목으로 빼라고만 했고 경계는 정하지 않았습니다.
      - 밑 2 비교는 층·칸·두 조각을 알아야 읽히는데 그 정의가 아이디어 상세에 있어서, 서사 절에 두면 정의 전의 개념에 기댑니다. 원문: sandbox/algo-guide-v2/SPEC.md:276
      - 서사 절 「아이디어를 떠올리는 과정」은 단순한 방법의 수치 반박·접두 최솟값 반박·모든 짝 저장 반박까지 하고 버린 방법 요약 그림으로 끝납니다.
    - **정할 것**
      설계 선택(밑 2)을 어느 절에 둘 것인가.

    | 선택지 | 대가 | 그러면 어떻게 되는가 |
    | --- | --- | --- |
    | **추천** 아이디어 상세 ⑦ | 서사 절이 「왜 2 인가」를 말하지 않는다 | 모든 개념이 정의된 뒤에 결론이 나온다 |
    | 서사 절 끝 | 층·칸 개념을 서사 절에서 먼저 풀어야 한다 | 두 절이 같은 정의를 되풀이한다 |

    > **판정** — _아직 없습니다._

    > **추가 의견**
    >
    > - ai · 2026-09-28 — 지금 원고에서 밑 2 비교는 아이디어 상세의 「#### 밑이 2 인 까닭」에 있습니다(sparseTableRangeMin-guide.md:749). 서사 절은 여전히 아이디어 이름에서 멈춥니다. 추천(아이디어 상세에 둔다)과 같은 자리입니다.

- [ ] 새 절 「아이디어를 떠올리는 과정」은 필수지만 나머지 110편을 다시 쓸 때까지 있을 때만 검사합니다
    - **배경**
      - 옛 구성 110편에는 이 절이 없어서 필수로 검사하면 전부 위반이 됩니다.
      - 그래서 명세에 한시 조항을 두고 검사기는 있을 때만 그림과 코드를 봅니다. 원문: sandbox/algo-guide-v2/SPEC.md:856
      - 바꾸기 전후로 전수 검사 결과가 글자 단위로 같아 옛 편에는 영향이 없습니다.
      - 110편 재집필은 이 카드 범위 밖으로 두었습니다.
    - **정할 것**
      전개를 별도 카드로 할 것인가.

    | 선택지 | 대가 | 그러면 어떻게 되는가 |
    | --- | --- | --- |
    | **추천** 파일럿 승인 뒤 별도 카드 | 전개 전까지 두 구성이 함께 있다 | 이 카드는 파일럿으로 닫힌다 |
    | 이 카드에서 이어서 전개 | 카드가 110편 규모로 커진다 | 검토가 파일럿과 전개를 함께 본다 |

    > **판정** — _아직 없습니다._

    > **추가 의견**
    >
    > - ai · 2026-09-28 — 전개 카드가 받을 일이 늘었습니다 — 110편을 새 구성으로 다시 쓰는 일에 더해, 한시 조항 둘(SPEC §8, sandbox/algo-guide-v2/SPEC.md:950)을 걷는 일: P17·P18 전면 적용(본문 반말 43편 168곳), voice 「견주다」 켜기(91편 1,542곳).

- [ ] 아이디어 상세와 수행 절이 같은 표를 다른 관점으로 두 번 보입니다
    - **배경**
      - 아이디어 상세 ③ 의 채우기 표(구간과 칸 번호)와 수행 절 3 단계의 걸음 표가 같은 여덟 칸의 값을 담습니다. 원문: src/algorithms/array/sparseTableRangeMin/sparseTableRangeMin-guide.md:382
      - 걸음 표는 코드를 한 줄씩 실행한 순서대로 번호를 붙인 표로, 1 층 다섯 칸과 2 층 세 칸을 채우는 여덟 걸음입니다.
      - 줄 단위로는 겹치는 곳이 0 이지만 값은 같습니다.
      - 명세에는 「겹침을 피하려고 아이디어 상세를 줄이지 않는다 — 카드 원문의 최대한 자세히가 앞선다」고 적었습니다.
    - **정할 것**
      이 겹침을 둘 것인가.

    | 선택지 | 대가 | 그러면 어떻게 되는가 |
    | --- | --- | --- |
    | **추천** 둔다 | 같은 값을 두 번 본다 | 아이디어 상세만 읽어도 채우는 규칙이 완결된다 |
    | 아이디어 상세에서 뺀다 | 채우는 규칙의 경계 설명이 표 없이 남는다 | 수행 절을 읽어야 ③ 이 완결된다 |

    > **판정** — _아직 없습니다._

    > **추가 의견**
    >
    > - ai · 2026-09-28 — 지금 원고에서도 겹침은 그대로입니다 — 2단계의 채우기 표(sparseTableRangeMin-guide.md:524)와 수행 절 3 단계의 걸음 표(:913)가 같은 여덟 칸 값을 담습니다. 개념 절의 「위층과 아래층의 관계」 그림은 줄 전체를 옮겨 비교하는 관점이라 겹치지 않습니다.


## 4. 판정

<!-- 문서 하나에 대한 판정이다. **항목별로 갈리는 말은 여기 적지 않는다** — 3항 각 의견의
     「판정」과 「추가 의견」이 그 자리다. 여기 남는 것은 그 항목들이 전부 승인으로 닫혔다는
     사실 하나뿐이다.
     아래 「판정 이력」은 **덧붙기만 하는 이력**이다. 왕복이 돌면 줄이 쌓이고, 그것이 이 문서가
     무엇을 거쳐 승인에 닿았는지의 전부다 — 지우지 않는다. **판정에는 사유 칸이 없다** —
     승인은 대체로 덧붙일 말이 없고, 있다면 그것은 문서 전체가 아니라 그 항목에 대한
     말이라 3항의 「추가 의견」이 받는다.
     `review-judge --card KAN-056-VPCM91 --verdict 승인` 이 이 자리를 쓰고
     frontmatter 의 status 도 함께 고친다. 손으로 적어도 되지만, 그때는 수렴 검사를
     안 거치므로 `validate` 가 항목 판정과 어긋난 승인을 error 로 잡는다. -->

**판정**: (아직 없습니다)

**판정 이력**:

- 승인이면 → `apply --op move --id KAN-056-VPCM91 --to done` 뒤에 `main` 병합과 워크트리 정리(출력의 `cleanup`)
- 반려면 → `apply --op move --id KAN-056-VPCM91 --to doing` 뒤에 `doc-log --entry "<반려 사유>"`.
  요청서는 **지우지도 다시 뜨지도 않는다** — 고친 뒤 그 항목을 `review-judge --verdict 승인` 으로
  뒤집으면 같은 문서에서 수렴한다. 1·2항이 낡았으면 `review-init --refresh` 로 그 두 항만 간다.
