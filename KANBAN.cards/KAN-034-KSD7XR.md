---
card: KAN-034-KSD7XR
title: algo-guide-v2 전 편 전개 — pilot 4편의 골격을 src/algorithms/ 111편에 적용
created: 2026-08-28
scope: src/algorithms/**, sandbox/algo-guide-v2/**, tools/**, src/_guide-sim/**, 문제_가이드_목록.md, 알고리즘 중요도 기준 문제 목록.md, KANBAN.md, KANBAN.cards/**, .kanban/**
---

# KAN-034-KSD7XR — algo-guide-v2 전 편 전개 — pilot 4편의 골격을 src/algorithms/ 111편에 적용

## 전략
지시 원문은 `KANBAN.md` 카드의 `원문:` 블록에 있다(중복 보관하지 않음).
전략 전문은 `~/.claude/plans/dapper-whistling-taco.md`. 여기에는 요지만 적는다.

### 핵심 판단 — 111편을 그냥 반복하면 완주하지 못한다

파일럿 4편에 배치 `S1`~`S19`, 유저 지적 `R2`~`R23` 23라운드, 이해 시험 31회가 들었다.
편당 산출도 커졌다 — v1 평균 405.8줄에서 v2 는 md 958~1,071줄 + 사이드카 5종으로 **2.5배**다.
그래서 전개 전에 **편당 비용을 깎는 카드 넷**을 먼저 두고, 그 다음에 웨이브를 돈다.

### 순서는 중요도다 (유저 지시)

`문제_가이드_목록.md` 를 순서의 정본으로 쓴다. 실측 검증 — 그 문서가 가리키는 알고리즘 편이
**유니크 111개**이고 **죽은 링크 0 · 누락 0** 이다. 등급 안에서도 위에 있을수록 자주 등장한다는
것이 그 문서의 규약이므로 **문서 순서가 곧 집필 순서**다.

| 웨이브 | 등급 | 전체 | 파일럿 제외 |
| --- | --- | --- | --- |
| W1 | ★★★ 상 | 26 | 24 |
| W2 | ★★ 중 | 41 | 41 |
| W3 | ★ 하 | 44 | 42 |
| | | 111 | **107** |

**웨이브 경계가 배리어다.** 웨이브 안에서만 카테고리로 병렬화한다 — 중요도 순이 병렬화에
먹히면 유저 지시를 어기는 것이 된다.

### 선례는 별도 단계가 아니다

중요도 순으로 가면 각 카테고리의 첫 편이 자연스럽게 그 카테고리의 선례가 된다.
카테고리가 처음 열리는 시점 — 파일럿(`array`·`sorting`·`dp`·`number-theory`) →
W1(`binary-search`·`graph`·`advanced`·`etc`) →
W2(`bit-manipulation`·`string`·`graph-flow`·`shortest-path`·`tree`) → W3(`geometry`).

**전역 정지가 아니다.** 첫 편이 도는 동안 **같은 카테고리의 후속만** claim 을 막고 다른
카테고리는 진행한다. 전역 정지면 총 10번 전 트랙이 멈춘다.
그리고 **`matrix` 는 카테고리가 아니라 뷰다** — 실측 14 카테고리에 없고 `matrix` 를 쓰는 편
16개가 여러 카테고리에 흩어져 있다. 그래서 선례 판정 축을 둘로 둔다:
① 카테고리 첫 편 ② **뷰 조합 첫 등장**. 둘 중 하나라도 처음이면 단독으로 돌린다.

### 버린 대안 셋

1. **카테고리 트랙만으로 병렬화** — 유저가 중요도 순을 지시했다. 카테고리로만 가르면
   `geometry` 7편(전부 하 등급)이 상 등급보다 먼저 나올 수 있다.
2. **선례 10편을 별도 단계로** — 중요도 순이 이미 카테고리를 순서대로 연다. 단계를 따로
   두면 그 10편이 중요도를 무시하고 앞으로 당겨진다.
3. **v1 `.mdx` 를 전개 끝까지 병존** — 유저가 편별 즉시 교체로 정했다. 병존하면 전개 기간
   내내 한 알고리즘에 가이드가 둘이고 인덱스가 어느 쪽을 가리키는지 편마다 갈린다.

### 착수 전 막혀 있던 것 넷 (실측)

1. **파일럿 승인 근거 없음** — `verdicts/` 31개가 전부 8/20, 원고는 8/28. 그 사이 파트 2분할
   (`SPEC.md:75`) · 항목 3종 개편 · `invariant` 신설이 들어갔다. `babyStepGiantStep` 은 verdict 0개.
2. **미커밋 잔여물은 `KAN-033` 의 것** — 마지막 커밋 `efabba1`(S18) 이후 19파일 수정 + untracked
   다수. 그 카드는 `b561f62` 로 완료됐으므로 **`KAN-033` 명의로 닫는다.**
3. **문서가 결번을 가리킴** — `SPEC.md:677` 이 `L23`·`L26`~`L31` 을 결번 선언했는데
   `FEEDBACK.md` 는 16줄에서 쓴다. **그중 `:49`·`:87` 은 폐기 사실의 기록이라 고치지 않는다** —
   0 을 요구하면 결번 선언의 근거를 지운다. 교정 대상은 §1 반영표 규칙 열뿐이다.
4. **파일럿 4편이 미이관** — 원고는 샌드박스에 있고 `src/algorithms/` 그 자리에는 v1 `.mdx` 가
   그대로다(실측). 이관 단계가 없으면 잔여 수치가 0 으로 닫히지 않는다.

## 실행 계획
`S<n>` 하나가 하위 카드 하나에 대응한다. 하위 카드 id 는 괄호 안에 적는다.

- [>] `S1` 정합 회복 + 파일럿 4편 재판정 (`KAN-034.1-V337W5`) <!-- claim:s=b90b730c t=2026-08-28T22:46 -->
      완료 기준: `git status --short` 잔여 0(`KAN-033` 명의로 닫은 뒤) ·
      `FEEDBACK.md` §1 반영표의 결번 참조 0(§2 이후 이력 서술은 대상 아님) ·
      은유 부류 표기 11 로 일치 · **파일럿 4편이 최신 골격으로 `comprehension.sh` exit 0**
      (`babyStepGiantStep` 은 첫 실행) · HTML 레일 렌더를 브라우저로 확인
- [ ] `S2` 인프라 승격 + 파일럿 4편 이관 (`KAN-034.2-5V5M2F`)
      완료 기준: `bun run tools/ci.ts all` 초록 · `check-citations` 가 `src/algorithms` 를 봄 ·
      `bun test src/_guide-sim` 통과 · 파일럿 4편이 `.md` 로 서고 그 `.mdx` 4개가 사라짐 ·
      인덱스 「자동 추가」 절 중복 3줄 정리 · `guide-rhythm.tsv` 103 → 101
- [ ] `S3` 사람 검토 12줄의 기계화 — `L38`~ 신설 (`KAN-034.3-53E4F9`)
      완료 기준: `bun test tools` 통과(신설 규칙마다 회귀 시험) ·
      파일럿 4편에서 신설 규칙 위반 **0건** — 기존 산출을 깨지 않는 것이 판정이다
- [ ] `S4` 전개 WBS + `tools/algo-wbs.ts` (`KAN-034.4-4NS63H`)
      완료 기준: `bun run tools/algo-wbs.ts` 가 웨이브별 남은 편과 트랙별 claim 후보를 냄 ·
      `--all` 이 107 유닛 전수를 냄 · 앞 웨이브가 안 비면 다음 후보를 내지 않음 ·
      같은 카테고리·같은 뷰 조합 첫 편이 도는 중이면 그 후속만 막음
- [ ] `S5` W1 — 중요도 상 24편 (`KAN-034.5-0RGSQM`)
      완료 기준: 상 등급에서 살아 있는 `.mdx` 0 · `guide-rhythm.tsv` 101 → 79
- [ ] `S6` W2 — 중요도 중 41편 (`KAN-034.6-CF6ZHE`)
      완료 기준: 중 등급에서 살아 있는 `.mdx` 0 · `guide-rhythm.tsv` 79 → 41
- [ ] `S7` W3 — 중요도 하 42편 (`KAN-034.7-QMZ3RE`)
      완료 기준: `src/algorithms` 의 살아 있는 `.mdx` **0** · `guide-rhythm.tsv` **0**
- [ ] `S8` v1 잔여 처분 (`KAN-034.8-BK1Q3A`)
      완료 기준: `_deprecated/` 처분 완료 · `check-guide-rhythm.ts` 가 자료구조만 봄 ·
      `bun run tools/check-links.ts check` 통과

### 편별 배치 종료 산출 (일곱) — `S5`~`S7` 의 편마다 적용

1. `<name>-guide.md` + 사이드카 5종 생성
2. 같은 편의 `<name>-guide.mdx` **삭제**
3. `문제_가이드_목록.md` 에서 **그 편을 가리키는 모든 줄**의 링크를 `.md` 로 교체 —
   링크는 114회 등장 · 111 유니크라 세 편이 두 번 나온다
   (`graph/dfsTraversal`·`dfsAllPaths`·`countIslands`, 전부 W1). `S2` 에서 미리 정리한다
4. `tools/_baseline/guide-rhythm.tsv` 그 편의 행 삭제 — **행이 없는 편이 8개**이므로 없으면
   없는 대로 넘어간다(`diffArrayRangeUpdate`·`houseRobber`·`longestCommonSubsequence`·
   `slidingWindowMaximum`·`enumerateSubmasks`·`segmentsIntersect`·`mosAlgorithm`·`knapsack01`)
5. `FEEDBACK.md` §5 에 조건부 절 셋(`L34`·`L35`·`L36`) 판정 행 추가
6. `verdicts/<name>-r<NN>.md` 커밋
7. `KANBAN.md` 카드 메모에 유닛 id 로 시작하는 결과 — `manage-kanban` 경유

### 이해 시험 회차 상한

파일럿 실적이 `mosAlgorithm` 13회차 · `knapsack01` 3회 · `quicksort` 3회다. 1편 1회 가정은 위험하다.
① 편당 상한 **5회차** ② 초과하면 그 편을 **보류**하고 다음 편으로 넘어간다(웨이브를 막지 않는다)
③ `exit 2`(미실행 — 외부 모델 소진)는 실패로 세지 않고 **배치를 멈춘다**.
`CALL_TIMEOUT` 기본 420초 × AND 결합이라 편당 수 분이 든다.

## 검증
## 검증
이 카드가 끝난 것은 아래 셋이 동시에 참일 때다.

```bash
# ① src/algorithms 에 살아 있는 v1 가이드가 없다
find src/algorithms -name '*-guide.mdx' -not -path '*_deprecated*' -not -path '*_scratch*' | wc -l   # 0
# ② rhythm 래칫의 알고리즘 부채가 없다
grep -c 'src/algorithms' tools/_baseline/guide-rhythm.tsv                                             # 0
# ③ 새 산출 111편이 게이트를 통과한다
bun run tools/ci.ts all
```

### 단계별 판정

```bash
# S1 — 정합 회복 + 재판정
git status --short                                            # 잔여 0
for f in sandbox/algo-guide-v2/pilot/*/*-guide.md; do bash sandbox/algo-guide-v2/tools/comprehension.sh "$f"; done
#   ↑ 파일 하나씩 받는다(다중 인자 안 받음). exit 0 통과 · 2 미실행(멈춘다) · 3 미통과
sed -n '/^## 1\./,/^## 2\./p' sandbox/algo-guide-v2/FEEDBACK.md \
  | grep -E '^\| R' | grep -v '^| R19-1 ' | grep -cE 'L23|L2[6-9]|L3[01]'                          # 0
#   ↑ §1 반영표의 **데이터 행**만 본다. R19-1 은 폐기 사실의 기록이라 대상이 아니고,
#     §2 이후의 이력 서술도 대상이 아니다. 앞판 기준(§1 전체에서 0)은 성립하지 않는다 —
#     R19-1 행과 그 사실을 적은 문단이 결번 번호를 그대로 들고 있어야 결번 선언의 근거가 선다
bun run sandbox/algo-guide-v2/tools/check-metaphor.ts \
  sandbox/algo-guide-v2/{SPEC,FEEDBACK,README,SURVEY}.md sandbox/algo-guide-v2/pilot/*/*.md   # 9편 0건
#   ↑ 부류 수의 정본은 `METAPHORS.length`(실측 11)다. 문서 표기가 그것과 어긋나면 고친다

# S2 — 인프라 승격 + 파일럿 이관
bun run tools/ci.ts all
bun run tools/check-citations.ts                              # src/algorithms 가 검사 대상에 든다
bun test src/_guide-sim                                       # VIEW_REGISTRY 이관 회귀
bun run tools/check-links.ts check                            # 중복 3줄 정리 후 링크 실재
grep -c 'src/algorithms' tools/_baseline/guide-rhythm.tsv      # 103 → 101

# S3 — 기계화
bun test tools
bun run tools/check-v2.ts sandbox/algo-guide-v2/pilot/*/*-guide.md   # 신설 규칙 0건

# S4 — WBS
bun run tools/algo-wbs.ts
bun run tools/algo-wbs.ts --all                               # 107 유닛

# S5~S7 — 편 하나마다
bun run tools/check-v2.ts <name>-guide.md
bun run tools/bench-alt.ts --check <name>-guide.alt.ts
bun run tools/build-html.ts <name>-guide.md
bash tools/comprehension.sh <name>-guide.md                   # 상한 5회차
bun test src/algorithms/<cat>/<name>
bun run tools/check-links.ts check
bun run tools/ci.ts all

# 웨이브 종료
grep -c 'src/algorithms' tools/_baseline/guide-rhythm.tsv      # 101 → 79 → 41 → 0
find src/algorithms -name '*-guide.mdx' -not -path '*_deprecated*' -not -path '*_scratch*' | wc -l
#                                                              # 107 → 83 → 42 → 0
```

### 함정 (전부 실측 — `sandbox/algo-guide-v2/README.md:53-63`)

- 대상 파일이 **0개면** `bun test <경로>` · `biome check <디렉터리>` · `tsc --noEmit -p` 가 exit 1 이다.
- **`bunx biome` 을 쓰지 않는다.** npm 의 `biome` 은 이 저장소가 설정한 `@biomejs/biome` 와 다른
  패키지이고, 아무것도 검사하지 않고 exit 0 을 준다. `bunx --bun @biomejs/biome check` 다.
- **`tools/check-guide-rhythm.ts` 를 v2 편에 호출하지 않는다.** 구 헤딩 접두와 어긋나 조용히
  공전하고, 통과 표시가 거짓이 된다.
- `comprehension.sh` 는 파일 **하나**만 받는다. 다중 인자는 안 돈다.

### 판정 장치와 그것이 재는 것

| 장치 | 무엇을 재는가 |
| --- | --- |
| `check-v2.ts` P1~P10 | 산문 연속 · 은유 11부류 · 표기 혼용 · 라벨 좌표 · 전개 단계·멈춤·전체 코드 · 분기 라벨 피복 · `T#` 결속 · 마커↔sim · 그림 의무 · `concept` 자립 · `related` 자리 · `result` 일치 · `purpose.alt` 실측값 |
| `check-metaphor.ts` | 은유 — 문서 전체(`.md`). 인용 구간 제외 |
| `check-rework.ts` | 구성 지적을 받은 절의 재작성률(기준 60%) — 재배치와 재작성을 가른다 |
| `bench-alt.ts --check` | `purpose.alt` 의 결정론적 계수가 본문 수치와 같은가 |
| `build-html.ts` | 항목 레일 · 앵커가 절 id 에서 오는가 · JS-off 정적 산출 |
| `comprehension.sh` V1~V7 | 본문만 근거로 이해가 재구성되는가 (외부 모델 · AND 결합) |
| `algo-wbs.ts` | 웨이브 배리어 · 선례 대기 · 남은 편 수 |
| 사람 | `FEEDBACK.md` §3 중 기계로 못 내린 것 — 멈춤 자리 · 부제의 뜻 · 조건부 절 판정 · 레일 렌더 |
| 유저 | 편 단위 최종 승인. 항목 id 로 반려 |

## 수행 내역
<!-- KANBAN:LOG append-only — 아래로만 덧붙인다. 위를 고치지 않는다. -->
- 2026-08-28T21:47 · s:e76c7ae0 — `전략` 섹션 교체
- 2026-08-28T21:47 · s:e76c7ae0 — `실행 계획` 섹션 교체
- 2026-08-28T21:48 · s:e76c7ae0 — `검증` 섹션 교체
- 2026-08-28T22:46 · s:b90b730c · S1 doing — 착수
- 2026-08-28T22:53 · s:b90b730c — `검증` 섹션 교체
- 2026-08-28T22:58 · s:b90b730c — S1 기계 판정 전부 초록 — 파일럿 4편 V1~V7 통과(bSGS r01·qs r04·knap r04·mos r14) · 반영표 결번 0 · 잔여 0. 남은 것 둘은 사람 몫이다 — HTML 레일 브라우저 확인(L37)과 편 단위 승인. 브라우저 확장이 연결돼 있지 않아 레일 확인을 대신 못 했다.
