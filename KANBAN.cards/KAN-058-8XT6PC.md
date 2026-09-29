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

**전개 순서는 KAN-034 규약을 그대로 쓴다.** `문제_가이드_목록.md` 중요도 웨이브 W1 → W2 → W3, 웨이브 안에서는 카테고리 선례(카테고리 첫 편이 선 뒤 같은 카테고리 후속, `tools/algo-wbs.ts:18-22`). 동시 집필 폭은 KAN-060 에서 쓴 셋에서 시작하고, 샘플 실측으로 배치 크기를 정한다.

**샘플 두 편은 이 순서의 예외다.** SCC 는 W3 이라 순서대로라면 W1·W2 가 끝나야 열린다. 샘플은 전개 순서가 아니라 게이트이므로 웨이브 배리어와 카테고리 선례에서 뺀다. SCC 는 graph 카테고리의 선례를 **겸하지 않는다.** graph 의 선례는 순서대로 W1 첫 graph 편(`bfsShortestPath`)이 맡고, SCC 에서 세운 그래프 패턴은 그 편부터 재사용한다. `binarySearch` 는 W1 첫 편이라 예외가 필요 없고, binary-search 카테고리의 선례를 겸한다.

**제약.** 실습 절(`## 실습`)은 KAN-060 이 옮긴 그대로 두고 본문만 고친다. 자료구조 트랙은 건드리지 않는다. 옛 원고의 값·증명(`proof.ts`)은 버리지 않고 새 구성으로 옮긴다.

**버린 대안.** 샘플을 메인 세션이 직접 쓰기(전개 절차를 검증하지 못함) · 샘플 없이 W1 부터(유저 지시와 다름) · 기계 치환만(「견주다」·반말만 고치고 구성은 유지 — 카드 목표 미달) · 웨이브마다 하위 카드(KAN-034 처럼 카드가 늘어남, 게이트가 필요한 곳은 샘플 하나뿐).

## 실행 계획
<!-- `S<n>`은 고정 id — 이름을 바꾸지 않는다. 체크 상태는 doc-step 이 갱신한다. -->
**배치 1 — 잴 수 있게 하기**
- [x] `S1` `check-v2 --strict <편>` — 한시 조항 셋을 끈 판정(`deep.origin` 필수 · P17·P18·P23 · 「견주다」 활용형 전부, `style.json:254` `v.common.gyeonju` 의 형태 목록을 읽는다). 완료: 시험 추가·통과, 파일럿 통과, 신규 넷 결과 기록(걸리면 전개 대상에 더함), `binarySearch` 에서 위반 목록이 나온다
- [x] `S3` 재집필 지시서 — `.claude/skills/guide-for-problem/SKILL.md` 에 「v2 재집필 경로」 절(입력: 옛 원고·`ref.ts`·`proof.ts`·기존 `sim.ts`(걸음 패널이 남으면 고쳐 쓰고 새로 만들지 않는다)·파일럿 · 순서 · 편 완료 명령). 규칙은 다시 쓰지 않고 SPEC·voice·파일럿을 가리킨다. 완료: `check-links` 통과

(`S2` 는 id 를 유지한 채 배치 3 첫머리로 옮긴다.)

**배치 2 — 샘플 (하위 카드 `KAN-058.1`)**
- [ ] `S4` `binarySearch` 재집필(서브에이전트). 완료: 편 완료 기준 통과 · 토큰·시간 기록
- [ ] `S5` `stronglyConnectedComponents` 재집필(서브에이전트, 그래프 패턴이 필요하면 패턴 신설 포함 — `src/_viz/patterns.test.tsx` 패턴 등록 가드 통과). 완료: 편 완료 기준 통과 · 토큰·시간 기록
- [ ] `S6` 샘플 검토서 — HTML 빌드 두 편, 판단 항목(두 편의 서술 수준 · 시각화 · 실측 비용과 110편 추정 · 지시서 고칠 점), `KAN-058.1` 을 검토로. 완료: 검토 화면이 열린다. **유저 승인으로 `KAN-058.1` 완료 = 전개 게이트 통과**

**배치 3~ — 전개 (게이트 통과 뒤)**
- [ ] `S2` `algo-wbs` 완료 판정을 `--strict` 통과로, 샘플 두 편은 완료로 센다. 완료: 남은 편 = 108(+ S1 에서 걸린 신규 편), `tools/algo-wbs.test.ts` 통과
- [ ] `S7` W1 나머지 전개. 시작 때 샘플 실측으로 배치 문서를 나눈다(`batch-init`). 완료: W1 남은 편 0(`algo-wbs`) · `ci.ts gates` 통과
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
