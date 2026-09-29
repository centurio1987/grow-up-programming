---
card: KAN-058-8XT6PC
title: 알고리즘 가이드 110편 v2 재구성 전개 — KAN-056 파일럿 구성을 나머지 편에 적용
created: 2026-09-29
scope: src/algorithms/**, src/_viz/**, design/viz/**, sandbox/algo-guide-v2/**, tools/check-v2.ts, tools/check-v2.test.ts, tools/section.ts, tools/algo-wbs.ts, tools/algo-wbs.test.ts, .claude/skills/guide-for-problem/**, .claude/authoring/voices/algorithm-guide-writer/**, .claude/authoring.lock.json, 문제_가이드_목록.md
---

# KAN-058-8XT6PC — 알고리즘 가이드 110편 v2 재구성 전개 — KAN-056 파일럿 구성을 나머지 편에 적용

## 전략
<!-- 왜 이 접근인가 · 제약 · 버린 대안. 사람이 자유롭게 편집한다. -->
지시 원문은 `KANBAN.md` 카드의 `원문:` 블록에 있다(중복 보관하지 않음). 승인된 플랜: `~/.claude/plans/kan-058-goofy-lamport.md`(Claude 세션 검토 fable 1회 · 지적 5 반영, 2026-09-29).

**유저 지시(2026-09-29).** 개념이 단순한 가이드 한 편과 sparseTable 보다 개념이 어려운 가이드 한 편을 샘플로 먼저 내고, 유저 검토를 통과하면 전편을 전개한다.

### 지금 상태 (2026-09-29 실측)

- 알고리즘 가이드 115편. `deep.origin`(아이디어를 떠올리는 과정 절)이 있는 편은 5편(파일럿 `sparseTableRangeMin` + KAN-060 신규 넷 `twoSum`·`missingInteger`·`numberOfDisintersection`·`binaryGap`). **나머지 110편이 옛 구성**이다.
- 그림 사이드카 `*.fig.tsx` 는 파일럿에만 있다. 걸음 표 사이드카 `*-guide.sim.ts` 는 111편에 있다(샘플 두 편 포함). 옛 110편은 ASCII 펜스 그대로라 KAN-057 이 넘긴 시각화 전환(L46~L48)도 이 카드 몫이다(`KANBAN.cards/KAN-057-J36E1B.md` 전략 「110편 전환은 KAN-058 몫」).
- 「견주다」 90편 1,482곳(`grep -roE '견(주|줘|준|줄|줬)'`. 카드 메모의 91편 1,542곳은 KAN-060 전 수치).
- 시각화 패턴은 `src/_viz/patterns/` 에 배열 계열 일곱(ArrayStrip·RangeCover·LevelTable·StepTrace·ApproachLadder·CellStage·LayerBars)뿐이고 **그래프·트리 패턴이 없다.**
- `tools/algo-wbs.ts` 는 「`-guide.md` 가 있으면 완료」로 세서 지금 「115/115 완료」라고 답한다 — 이 카드의 진척을 못 잰다.
- `tools/check-v2.ts` 에는 한시 조항 셋(`sandbox/algo-guide-v2/SPEC.md:1053-1067`)을 끈 채 한 편을 최종 기준으로 재는 모드가 없다.
- 지난 v2 전개(KAN-034, 111편)는 약 59.3억 토큰이 들었다(메모리 `no-prework-idling` 의 2026-09-18 진단 기록). 이번 편당 비용은 샘플에서 잰다.

### 전략

**이 카드의 몫(카드 메모 ①~⑤ + 시각화).** ① 110편을 파일럿 구성(`deep.origin` → 실현 단계로 나눈 `deep.build`, L41~L45)으로 재집필 ② SPEC §8 한시 조항 셋 제거(`deep.origin` 필수 · P17·P18·P23 전 편) ③ 본문 반말(P18) ④ 「견주다」 교정 뒤 voice `v.common.gyeonju` 켜기(L44) ⑤ 알고리즘 중심 서술(L49) ⑥ ASCII 를 전하려는 것에 맞는 그림으로(L46~L48, KAN-057 인계). ③~⑥은 따로 도는 일이 아니라 한 편을 다시 쓸 때 함께 끝낸다.

**한 편의 재집필이 끝났다는 기준은 기계가 잰다.** 한시 조항을 끈 최종 기준으로 그 편 하나를 재는 `check-v2 --strict <편>` 을 먼저 만든다. 편 완료 = `--strict` · `check-proof --require` · `render-figs --check` · 가이드 시험 · `build-html` 통과. 샘플 앞에는 이것 하나만 둔다. 이것이 없으면 샘플의 합격선을 잴 수 없다. `algo-wbs` 의 완료 판정을 이 기준으로 바꾸는 일은 전개의 남은 편을 셀 때 필요하므로 샘플 승인 뒤로 미룬다. 샘플이 반려돼 기준이 바뀌어도 한 번만 고치면 된다.

**샘플은 전개와 같은 절차로 쓴다.** 파일럿은 메인 세션이 직접 썼지만 110편은 서브에이전트가 쓴다. 샘플도 서브에이전트가 전개용 지시서 그대로 써야 샘플 검토가 「전개 결과가 이렇게 나온다」는 검증이 된다. 메인 세션은 지시서 전달 · 기계 검증 · 커밋만 한다.

**샘플 두 편(추천).**

| 자리 | 편 | 고른 이유 |
| --- | --- | --- |
| 개념이 단순한 편 | `binary-search/binarySearch` | 중요도 목록 첫 편이라 전개 순서에서도 첫 편이고, 배열 패턴으로 그릴 수 있다. 단순한 개념에 실현 단계·낯선 개념 절이 과하게 붙는지 보는 자리 |
| sparseTable 보다 어려운 편 | `graph/stronglyConnectedComponents` | DFS 트리·low-link 두 낯선 개념이 겹쳐 L41(심상) 요구가 파일럿보다 크다. 그래프 패턴이 없어 패턴 신설 비용이 샘플에서 드러난다 |

**샘플 게이트는 하위 카드 `KAN-058.1` 의 검토로 건다.** 샘플 두 편을 하위 카드로 떼고, 그 카드의 검토서(판단 항목마다 승인·반려)를 유저가 판정한다. 반려되면 지시서·SPEC·voice 중 원인 자리를 고치고 샘플을 다시 쓴 뒤 재검토한다. **`KAN-058.1` 이 완료되기 전에는 전개 단계를 시작하지 않는다.** 검토서에는 편당 실측 비용(토큰·시간)과 그로부터 낸 110편 추정을 함께 올린다.

**전개 순서는 KAN-034 규약을 그대로 쓴다.** `문제_가이드_목록.md` 중요도 웨이브 W1 → W2 → W3, 웨이브 안에서는 카테고리 선례(카테고리 첫 편이 선 뒤 같은 카테고리 후속, `tools/algo-wbs.ts:19-23`). 동시 집필 폭은 KAN-060 에서 쓴 셋에서 시작하고, 샘플 실측으로 배치 크기를 정한다.

**샘플 두 편은 이 순서의 예외다.** SCC 는 W3 이라 순서대로라면 W1·W2 가 끝나야 열린다. 샘플은 전개 순서가 아니라 게이트이므로 웨이브 배리어와 카테고리 선례에서 뺀다. SCC 는 graph 카테고리의 선례를 **겸하지 않는다.** graph 의 선례는 순서대로 W1 첫 graph 편(`bfsShortestPath`)이 맡고, SCC 에서 세운 그래프 패턴은 그 편부터 재사용한다. `binarySearch` 는 W1 첫 편이라 예외가 필요 없고, binary-search 카테고리의 선례를 겸한다.

**제약.** 실습 절(`## 실습`)은 KAN-060 이 옮긴 그대로 두고 본문만 고친다. 자료구조 트랙은 건드리지 않는다. 옛 원고의 값·증명(`proof.ts`)은 버리지 않고 새 구성으로 옮긴다.

**버린 대안.** 샘플을 메인 세션이 직접 쓰기(전개 절차를 검증하지 못함) · 샘플 없이 W1 부터(유저 지시와 다름) · 기계 치환만(「견주다」·반말만 고치고 구성은 유지 — 카드 목표 미달) · 웨이브마다 하위 카드(KAN-034 처럼 카드가 늘어남, 게이트가 필요한 곳은 샘플 하나뿐).

## 실행 계획
<!-- `S<n>`은 고정 id — 이름을 바꾸지 않는다. 체크 상태는 doc-step 이 갱신한다. -->
**배치 1 — 잴 수 있게 하기**
- [x] `S1` `check-v2 --strict <편>` — 한시 조항 셋을 끈 판정(`deep.origin` 필수 · P17·P18·P23 · 「견주다」 활용형 전부, `style.json:254` `v.common.gyeonju` 의 형태 목록을 읽는다). 완료: 시험 추가·통과, 파일럿 통과, 신규 넷 결과 기록(걸리면 전개 대상에 더함), `binarySearch` 에서 위반 목록이 나온다
- [x] `S3` 재집필 지시서 — `.claude/skills/guide-for-problem/SKILL.md` 에 「v2 재집필 경로」 절(입력: 옛 원고·`ref.ts`·`proof.ts`·기존 `sim.ts`(걸음 패널이 남으면 고쳐 쓰고 새로 만들지 않는다)·파일럿 · 순서 · 편 완료 명령). 규칙은 다시 쓰지 않고 SPEC·voice·파일럿을 가리킨다. 완료: `check-links` 통과

(`S2` 는 id 를 유지한 채 배치 3 첫머리로 옮겼다. `S12`~`S14` 는 샘플 검토 승인(2026-09-30)에서 나왔다.)

**배치 2 — 샘플 (하위 카드 `KAN-058.1`)**
- [x] `S4` `binarySearch` 재집필(서브에이전트). 완료: 편 완료 기준 통과 · 토큰·시간 기록
- [x] `S5` `stronglyConnectedComponents` 재집필(서브에이전트, 그래프 패턴이 필요하면 패턴 신설 포함 — `src/_viz/patterns.test.tsx` 패턴 등록 가드 통과). 완료: 편 완료 기준 통과 · 토큰·시간 기록
- [x] `S6` 샘플 검토서 — HTML 빌드 두 편, 판단 항목(두 편의 서술 수준 · 시각화 · 실측 비용과 110편 추정 · 지시서 고칠 점), `KAN-058.1` 을 검토로. 완료: 검토 화면이 열린다. **유저 승인으로 `KAN-058.1` 완료 = 전개 게이트 통과**

**배치 3~ — 전개 (게이트 통과 2026-09-30 — KAN-058.1 승인 6/6, 동시 셋)**
- [x] `S2` 잴 수 있게 — `algo-wbs` 완료 판정을 `--strict` 통과로(샘플 두 편은 완료로 센다), P1 이 `$$` 수식 블록을 산문 문단으로 세지 않게 고친다(샘플 검토 관찰). 완료: 남은 편 = 108, `tools/algo-wbs.test.ts`·`check-v2.test.ts` 통과
- [x] `S12` 배열·구간 걸음 무대 — SPEC §13 「다른 갈래의 무대」의 배열 줄을 `STAGES` 에 더하고 `binarySearch` 패널을 옮긴다(KAN-058.1 검토 3 승인 — 전개 첫머리에 만든다). 완료: `bun test src/_viz` · `binarySearch` 편 완료 명령 통과
- [x] `S13` 지시서 보강 — 짧은 실행 결과도 증명 블록으로(KAN-058.1 검토 4 승인), 배열 무대·그래프 무대를 쓰는 법을 가리킨다, `binarySearch` 의 남은 손 값도 바꾼다. 완료: `check-links` · `binarySearch` 편 완료 명령 통과
- [ ] `S14` KAN-060 신규 넷에 그림 — `twoSum`·`missingInteger`·`numberOfDisintersection`·`binaryGap` 에 `fig.tsx`·`figs/` 를 더한다(KAN-060 검토 3 「그림은 KAN-058 때」). 웨이브 편과 함께 동시 셋 안에서 돈다. 완료: 네 편 편 완료 명령 통과 · 본문 `<!--fig:` 1 이상
- [>] `S7` W1 나머지 전개. 시작 때 샘플 실측으로 배치 문서를 나눈다(`batch-init`). 완료: W1 남은 편 0(`algo-wbs`) · `ci.ts gates` 통과 <!-- claim:s=62654a5c t=2026-09-30T03:00 -->
- [ ] `S8` W2 전개. 완료: S7 과 같은 기준으로 W2 남은 편 0
- [ ] `S9` W3 전개. 완료: S7 과 같은 기준으로 W3 남은 편 0

**마감**
- [ ] `S10` 이전 카드가 꺼 둔 규칙과 한시 조항을 예정대로 켜고 걷는다 — 규칙 내용은 새로 쓰지 않는다(KAN-056 L44 · KAN-056/060 §8 이 「전개 카드와 함께 켠다」로 남겨 둔 것). SPEC §8 세 조항 삭제, `--strict` 를 기본으로, `deep.origin` 을 `FIGURE_REQUIRED` 로, voice `v.common.gyeonju` 의 `enabled` 를 `false` → `true`. 원본은 여러 프로젝트가 함께 쓰는 `~/.claude/authoring/voices/algorithm-guide-writer/style.json` 이고 저장소 것은 사본이다(`tools/voice-style.ts:4-18`) — 원본 값 변경 → `tools/voice-style.ts --sync` → `--check`. 원본 변경은 그 자리에서 유저 실행 요청을 받고 한다. 완료: `check-v2 --all` 0 · `ci.ts all` 통과
- [ ] `S11` 검토서 · 검토로 이동

## 검증
<!-- 무엇을 실행해 무엇이 나오면 이 카드가 끝난 것인가. -->
편 하나의 완료(샘플·전개 공통). 정본은 `.claude/skills/guide-for-problem/SKILL.md` 「알고리즘 가이드 v2 재집필 경로」의 편 완료 명령이고 여기는 사본이다:

```bash
G=src/algorithms/<카테고리>/<편>/<편>-guide.md
bun run tools/check-v2.ts --strict $G
bun run tools/check-proof.ts --require $G
bun run tools/render-figs.ts --check
bun test src/algorithms/<카테고리>/<편>/<편>-guide.test.ts
bun run tools/build-html.ts $G
bun run tools/check-metaphor.ts $G
bun run tools/guide-core.ts check
bunx tsc --noEmit
```

문체 박자 등급(실습 앞까지, `scan_ai_style.py --voice algorithm-guide-writer`)은 합격선이 아니라 보고할 값이다 — 파일럿 파트 1·2 도 C 다.

카드 전체:

```bash
bun run tools/ci.ts all                                   # 4모드 + 게이트
bun run tools/check-v2.ts --all                           # S10 뒤 strict 가 기본
bun run tools/algo-wbs.ts                                 # 남은 편 0
bun run tools/check-proof.ts --all
bun run tools/render-figs.ts --check
grep -roE '견(주|줘|준|줄|줬)' src/algorithms --include='*-guide.md' | wc -l   # 0
bun run tools/voice-style.ts --check                      # 원본·사본 일치
bunx tsc --noEmit
```

## 수행 내역
<!-- KANBAN:LOG append-only — 아래로만 덧붙인다. 위를 고치지 않는다. -->
- 2026-09-29T18:21 · s:62654a5c — `전략` 섹션 교체
- 2026-09-29T18:21 · s:62654a5c — `실행 계획` 섹션 교체
- 2026-09-29T18:21 · s:62654a5c — `검증` 섹션 교체
- 2026-09-30T01:21 · s:62654a5c — `실행 계획` 섹션 교체
- 2026-09-30T01:21 · s:62654a5c · S1 doing — 착수
- 2026-09-30T01:25 · s:62654a5c · S1 done — check-v2 --strict — 한시 조항 셋을 끈다(deep.origin 없음 P7 · P17 단계 0 · P18 · P23 을 조건 없이), voice 에서 아직 안 켠 금지 어휘를 voice-style.ts DEFERRED_METAPHORS(weight -3 · enabled:false, 지금 v.common.gyeonju 하나)로 읽어 P2 로. 시험 4개 추가(175/175). 결과: 파일럿·신규 넷 모두 --strict 통과(전개 대상에 더할 편 0). --all --strict 위반 110편 = 옛 구성 전부, 한시 조항 모드 --all 은 그대로 통과. binarySearch: P7 deep.origin 없음 · P17 단계 0 · P23 「이 문제」 3곳. SPEC §8 에 --strict 안내 한 줄. 발견: voice 정규식 견[주줘준줄줬] 이 「견줍」 32곳·「견줌」 2곳을 놓친다(93편 1,516곳 중 1,482곳만 잡음) — 원본이 전역이라 안 고쳤고 유저에게 묻는다. 인용 remap 6곳(KAN-034.8·KAN-035 카드 문서 · FEEDBACK.md — scope 밖, 줄번호만)
- 2026-09-30T01:25 · s:62654a5c · S3 doing — 착수
- 2026-09-30T01:26 · s:62654a5c — `검증` 섹션 교체
- 2026-09-30T01:27 · s:62654a5c · S3 done — guide-for-problem SKILL.md 에 「알고리즘 가이드 v2 재집필 경로」 절 — 규칙 정본 세 곳(SPEC·voice 사본·파일럿) 표, 대상 판정(--strict), 입력 다섯(옛 원고·ref·proof·sim·alt/bench, sim 은 고쳐 쓰고 새로 안 만듦), 바꾸지 않는 것(실습 절·스텁·ds), 순서 여섯, 편 완료 명령 일곱, 보고 항목. 카드 「검증」 절을 같은 명령으로 맞춤. 문체 박자 등급은 합격선에서 뺐다 — 파일럿 파트 1·2 가 C(신규 twoSum·binaryGap 은 A), 등급으로 막으면 본보기가 떨어진다. check-links 1182 · check-citations 통과, 인용 remap 1곳(KAN-056 카드). 관찰: authoring.py lock 이 voices/algorithm-guide-writer 「내용 변경」으로 낡음 — main 에서도 같아 이 카드가 만든 것이 아님, 안 고침
- 2026-09-30T01:43 · s:62654a5c — 유저 「고쳐」(2026-09-30): voice 원본 ~/.claude/authoring/voices/algorithm-guide-writer/style.json 의 v.common.gyeonju 정규식을 견[주줘준줄줬줍줌] 로(enabled 는 false 그대로) → voice-style --sync(사본 한 줄) → authoring.py lock --update(0.4.1 판으로, voice 해시 한 줄 — 처음에 0.3.0 판으로 돌려 style 항목이 빠진 것을 되돌리고 다시 함). 시험 1개 추가(176/176). 잡히는 곳 1,482 → 1,516(92편). 파일럿 149행 「견줍니다」→「비교합니다」(--strict · check-proof 25/25 · build-html 통과). ~/.claude 저장소에는 이 변경 말고도 전부터 커밋 안 된 voice.json·voice.md 변경이 있다 — 손대지 않음
- 2026-09-30T01:43 · s:62654a5c · S4 doing — 착수
- 2026-09-30T01:43 · s:62654a5c · S5 doing — 착수
- 2026-09-30T02:07 · s:62654a5c · S4 done — 서브에이전트(지시서만 받음) 재집필 — 토큰 371,083 · 22분 32초 · 도구 69회. deep.origin: 선형 탐색 Q=1,000·N=10^6 에서 10^9 번(10 초) vs 가운데 읽기 20 번 · 첫 칸 읽기도 최악 10^6. deep.build 3단계(후보 구간 정하기 · 가운데 칸 고르기 · 비교해서 한쪽 빼기), 낯선 개념 절 없음(후보 구간은 concept 에서 정의·그림). 그림 7장 전부 기존 패턴(RangeCover·CellStageFilm·ApproachLadder), 새 fig.tsx·figs/. 메인 재확인: --strict · check-proof --require 16/16 · 가이드 시험 19/19 · check-metaphor 통과, 스텁·실습 절 무변경. 문체 박자 C(옛 원고도 C). 검토로 올릴 관찰 7: 배열 걸음 무대 없음(L48 미충족, 옛 array 패널) · purpose.alt 수식을 14511 로 쓰면 P1 이 산문으로 셈(검사기↔L46 어긋남) · 옛 원고 값 정정 둘 · 손으로 적은 짧은 실행 결과 펜스 남음 · proof.ts→fig.tsx import 새 의존 · 중화 실행 회피 문구 조정 · origin-one-read 표시 부정확
- 2026-09-30T02:19 · s:62654a5c · S5 done — 서브에이전트 재집필 — 토큰 600,343 · 34분 00초 · 도구 99회(자기 추정: 읽기 38만 · 패턴 6만 · 원고 15만). 새 패턴 P8 NodeGraph(정점·간선 종류·묶음·띠, treeLayout, 흑백 구별) + 걸음 재생 패널 「그래프」 무대(graphStage.ts, PlayerSpec 을 층|그래프 합 타입으로). deep.origin: 쌍마다 왕복 탐색 V=10^5 에서 약 10^10 번(100 초) · 앞뒤 도달 집합 2×10^10 · 스택 전부 묶기 반례. 먼저 알아 둘 개념 둘(DFS 트리 · low-link) (a)~(f), deep.build 4단계. 그림 11장(ApproachLadder·NodeGraph·NodeGraphFilm). 메인 재확인: --strict · check-proof --require 43/43 · 가이드 시험+_viz 45 통과 · render-figs --check · tsc 0 · 새 파일 biome 0(경고 9건은 손 안 댄 학습자 스텁) · 스텁·실습 절 무변경 · 파일럿 --strict 유지. 메인이 SPEC §13 「무대 갈래는 층 하나」 문장을 층·그래프 둘로, 힙 줄 「견준」→「비교한」. 문체 박자 C(파일럿도 C). 검토로 올릴 관찰: 이름 「끊다/끊겨 나간 정점」· 단순한 방법 재는 입력을 완전 DAG→사슬로 바꿔 옛 수치와 다름 · purpose.alt(Kosaraju) 생략 사유 JOURNAL 미기록 · walkFirst result 가 반환값이 아니라 끊은 차례
- 2026-09-30T02:29 · s:62654a5c · S6 doing — 착수
- 2026-09-30T02:32 · s:62654a5c · S6 done — KAN-058.1 검토서 — 판단 항목 5(단순한 편 서술 기준 · 어려운 편 서술 기준 · 배열 걸음 무대 시점 · 손으로 적은 짧은 실행 결과 · 전개 비용과 동시 폭). 두 편 HTML 빌드. 하위 카드 실행 문서를 만들고 검토로 이동. ci.ts all 19단계 통과. 관찰: KAN-060 신규 넷은 --strict 를 통과하지만 SVG 그림이 없다 — KAN-060 검토 3번(그림은 KAN-058 때)대로 전개에서 그림만 더한다(S1 기록 「더할 편 0」을 이것으로 고친다)
- 2026-09-30T02:47 · s:62654a5c — `실행 계획` 섹션 교체
- 2026-09-30T02:47 · s:62654a5c — 샘플 게이트 통과(2026-09-30) — KAN-058.1 검토 승인 6/6. 유저가 새 항목으로 「승인 = 추천을 따른다」를 명시. 따라서: 두 샘플 서술 수준을 전개 기준으로 · 배열 걸음 무대를 전개 첫머리에(S12) · 짧은 실행 결과도 증명 블록으로(S13) · 동시 셋. S2 에 P1 수식 블록 수정을 더했고, KAN-060 신규 넷 그림을 S14 로 올렸다
- 2026-09-30T02:47 · s:62654a5c · S2 doing — 착수
- 2026-09-30T02:49 · s:62654a5c · S2 done — check-v2.ts 에서 입력 모으기·판정을 guideFindings(target, strict) 로 떼어 export(checkOne 은 찍기만). algo-wbs isDone 을 「.md 있음」→「--strict 통과」로(비동기) — 115편 완료 7 · 남은 108(W1 4/29 · W2 1/42 · W3 2/44). P1 이 47336 수식 블록을 산문 문단으로 세던 것을 건너뛰게(연속을 끊지도 않음 — SPEC §12 「수식은 문단을 끊지 못한다」). check-v2 --all 옛 모드·--strict 결과가 고치기 전과 줄 단위로 같음. 시험 191 통과(P1 수식 1 추가). 인용 remap 11곳(카드 문서 5 · FEEDBACK · 대장, 줄번호만)
- 2026-09-30T02:49 · s:62654a5c · S12 doing — 착수
- 2026-09-30T02:53 · s:62654a5c · S12 done — src/_viz/player/arrayStage.ts — 걸음 필드 array · range(쥔 구간, 비면 null) · read · write · pointers · calc · vars, 패널 옵션 arrayName · rangeLabel. StepPlayer 에 STAGES.array · ArrayPlayerSpec, StageKind 를 옵션 타입으로 일반화. binarySearch: fig.tsx 가 필름과 패널 걸음을 모두 arrayStage 로 만들고(ARRAY_OPTIONS), sim.ts 두 벌을 player:stage · stage:array 로 다시 뽑음(정본 실행 → 리터럴). walk-probe · walk-miss SVG 재렌더. 시험: StepPlayer 배열 무대 1 추가 · _viz 27 통과 · binarySearch 가이드 시험 19 · --strict · check-proof 16 · build-html · render-figs --check 통과. SPEC §13 무대 셋과 배열 걸음 필드. 인용 remap 3곳
- 2026-09-30T02:53 · s:62654a5c · S13 doing — 착수
- 2026-09-30T03:00 · s:62654a5c · S13 done — 지시서(ab7b833): 짧은 실행 결과도 증명 블록으로 · 옛 패널은 무대 셋(배열·층·그래프) 중 하나로 · 승인된 샘플 둘을 본보기로. binarySearch 손 값 전환(서브에이전트 두 번 이어서, 토큰 약 40만 · 4분 + 추가분): 증명 블록 16 → 32 — walk 1~3 · 전체 코드 아래 호출 · deep.math 검산·유도·접기 · 불변식 m 값·③ 변이·② 경계 입력 표 · selfcheck 두 곳(표로) · perf.derive 비교·후보 수 · 코드 주석의 기대값. 옛 원고의 틀린 값 하나를 실행이 잡아 고침(경계 입력 [42] 에서 7: lo = 1 이 아니라 hi = -1). 남긴 것: 벤치 표(.bench.json 과 P10 이 대조) · 「축」 표(같은 값 되풀이) · 산문 속 수. 메인 재확인: --strict · check-proof 32/32 · 시험 19 · build-html · biome 0 · 실습 절 무변경
- 2026-09-30T03:00 · s:62654a5c · S7 doing — 착수
- 2026-09-30T03:19 · s:62654a5c — S7 W1 longestSubarrayAtMostSum — 토큰 363,929 · 16분 52초. 두 포인터·슬라이딩 윈도 첫 편, 배열 무대(창 · l·r · 합은 calc · best 는 vars). 증명 36 · 시험 14 · --strict 통과(메인 재확인). 낯선 개념 절 없음, deep.build 4단계. 검토 때 볼 것: 옛 원고의 검증 없던 값(25 번)을 잴 수 있는 15 번으로 교체 · 전제 표 둘째 줄 새 내용(「창의 값을 칸 하나씩 더하고 뺄 수 있다」) · 뺀 칸을 「읽음」으로 그리는 방식을 무대 규약 없이 정함
- 2026-09-30T03:21 · s:62654a5c — S7 W1 bfsShortestPath — 토큰 433,296 · 19분 41초. graph 첫 편, 그래프 무대(대기열은 띠, 거리는 정점 값)·NodeGraph 그림 6, 새 패턴 없음. 증명 31 · 시험 11 · --strict 통과(메인 재확인). 검토 때 볼 것: 옛 원고 두 표의 셈 기준이 어긋나 있던 것을 실행 기준 하나로(V=10 에서 180 · 10만에서 19,999,800,000) · 걸음이 T1~T10 → T1~T12 · 「경로를 전부 만들면 지수」 주장을 근거 없어 뺌 · deep.math 를 남긴 것이 L36(식이 본문 값만으로 안 나오는 것을 주는가)을 넘는지
- 2026-09-30T03:31 · s:62654a5c — `검증` 섹션 교체
- 2026-09-30T03:31 · s:62654a5c — 지적 없이 스스로 찾은 누락: 편 검증에 tsc 가 없어 longestSubarrayAtMostSum proof.ts 의 타입 오류(실행은 맞음)를 커밋함(4add202 에서 정정). 편 완료 명령(지시서 · 카드 검증 절)에 bunx tsc --noEmit 을 더했다 — 메인 재확인도 이것을 돈다
- 2026-09-30T03:31 · s:62654a5c — S7 W1 parametricBinarySearch — 토큰 485,021 · 28분 07초. 낯선 개념 「판정 함수」(a)~(f), deep.build 3단계, 증명 44 · 시험 18 · 그림 11. 배열 무대에 valueAxis(값이 좌표인 줄 — 인덱스 줄 빼고 괄호를 값으로) · SPEC §13 두 줄 · StepPlayer 시험 1. 공용 arrayStage.ts 에 다른 두 편의 진행 중 변경(layers · pieces)이 섞인 채 커밋 — tsc 0 · _viz 28 · 배열 무대 쓰는 세 편 --strict·시험 통과를 확인하고 넣었다. 검토 때 볼 것: 옛 원고 틀린 주장 넷(짚고 가기 제목 · 음수면 판정이 단조가 아니다 → 실제로 깨지는 것은 아래 끝과 탐욕 최소성 · DP 비용 115일 → 19.3일 · 경쟁 설계 경계식 삭제) · 중화 실행 때만 fig.tsx 가 절차를 직접 다시 돌리는 방식 · 판정 함수를 낯선 개념으로 둔 것과 설계 선택 절 생략 · 23칸 그림 폭
- 2026-09-30T03:43 · s:62654a5c — S7 W1 prefixSumRangeQuery — 토큰 422,326 · 23분 10초. 낯선 개념 「누적합 배열」(a)~(f), deep.build 3단계, 증명 40 · 시험 14 · 그림 5. 배열 무대에 layers(배열에서 만드는 구조 한두 줄을 괄호 아래에) · SPEC §13 한 문장 · StepPlayer 시험 1. 정본 ref.ts 는 주석 용어만(표 → 누적합 배열, L43), alt 키도 같이 바꿔 bench 재생성(값 같음). 메인 재확인: --strict · 증명 40 · tsc 0 · _viz 29 · guide-core · 실습 절·스텁 무변경. 사고: 공유 스크래치에서 다른 서브에이전트와 같은 이름 파일이 덮여 sortArray 실습 절이 한때 섞였다 — 서브에이전트가 HEAD 에서 되살렸고 메인이 diff 로 확인. 다음 지시부터 편마다 스크래치 하위 폴더를 쓰게 한다. 검토 때 볼 것: 옛 원고 틀린 값(여섯 칸 → 다섯 칸) · 실행으로 못 보이는 주장을 설명 문장으로만 둠 · 새 반례(앞 칸 최솟값 배열)
- 2026-09-30T03:48 · s:62654a5c — S7 W1 sortArray — 토큰 453,603 · 24분 35초. sorting 첫 편(병합 정렬), 낯선 개념 절 없음, deep.build 3단계, 증명 44 · 시험 14 · 그림 5, 배열 무대 pieces(쥔 구간 안 조각 괄호) · SPEC §13 네 줄. 메인 재확인에서 본문 전체 코드 주석 「이 문제의 계약이다」를 발견 — P23 이 코드 펜스를 안 봐서 지나감. 조치: --strict 에서 P23 이 코드 펜스의 주석 줄도 읽게(check-v2 · 시험 1), 끝난 12편 중 걸린 곳은 sortArray 하나 — 정본 주석과 펜스를 「이 과제의 계약이다」로. 지시서 순서 4 에 「코드 주석도 포함」. 정본·alt 주석에 실습 지칭이 남은 파일은 23곳(옛 편) — 전개가 --strict 로 걸러 고친다. 검토 때 볼 것: mergeHeads 무대가 실제 메모리 모양이 아닌 약속(out·L·R 을 한 줄로) · 규모 1 ≤ N → 0 ≤ N
