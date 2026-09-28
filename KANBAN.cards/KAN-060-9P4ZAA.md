---
card: KAN-060-9P4ZAA
title: 알고리즘 가이드에 문제를 통합한다.
created: 2026-09-29
scope: src/algorithms/**, sandbox/algo-guide-v2/**, tools/section.ts, tools/check-v2.ts, tools/check-v2.test.ts, tools/check-metaphor.ts, tools/check-metaphor.test.ts, tools/migrate-practice.ts, .claude/authoring/specs/problem/**, .claude/authoring.lock.json, .claude/skills/gen-problem/**, .claude/skills/guide-for-problem/**, .claude/authoring/voices/algorithm-guide-writer/**, README.md, CLAUDE.md, 문제_가이드_목록.md
---

# KAN-060-9P4ZAA — 알고리즘 가이드에 문제를 통합한다.

## 전략
<!-- 왜 이 접근인가 · 제약 · 버린 대안. 사람이 자유롭게 편집한다. -->
지시 원문은 `KANBAN.md` 카드의 `원문:` 블록에 있다(중복 보관하지 않음). 승인된 플랜: `~/.claude/plans/kan-060-snoopy-sifakis.md`(Claude 세션 검토 1회 반영, fable).

**원문 읽기.** 원문의 「문제가 `*-guide.md`로 분리」는 `*-problem.md` 로 읽는다 — 분리된 쪽이 그 파일이다.

**지금 상태(2026-09-29 실측).** `src/algorithms/` 에 `*-problem.md` 119 · `*-guide.md` 111. 가이드 없이 문제만 있는 폴더 8, 문제 없는 가이드 0. 문제 서술(스토리·제약·예시)이 남은 곳은 `problem.md` 뿐이다 — 커밋 `29eab6e` 가 `.ts` 주석의 문제 설명을 이리로 옮겼고, 그래서 `CLAUDE.md:11` 의 「주석에 문제가 서술돼 있고」는 사실과 다르다. 가이드 37편에 `-problem.md` 링크 143개(대부분 다른 편을 가리킨다) — 깨지면 `check-links`(`tools/ci.ts:106`)가 실패한다. 코드 주석 넷이 `problem.md` 를 기준으로 삼는다: `src/algorithms/advanced/knuthOptimization/knuthOptimization-guide.proof.ts:65` · `src/algorithms/shortest-path/floydWarshall/floydWarshall-guide.proof.ts:47` · `src/algorithms/string/ahoCorasick/ahoCorasick-guide.test.ts:17` · `src/algorithms/sorting/kthSmallest/kthSmallest.test.ts:5`(맨 `problem.md` 라 `check-links refs` 에 안 걸린다). 명세 정본 `sandbox/algo-guide-v2/SPEC.md` 에 실습 절이 없고, 가이드를 문제 전제로 쓰게 만든 자리는 `deep.origin` ①「문제를 고정한다」(S1 에서 「다룰 과제를 고정한다」로 고쳤다 — `sandbox/algo-guide-v2/SPEC.md:334`)와 본문의 「이 문제에서는」이다.

**유저 결정(2026-09-29).** ① KAN-060 먼저, KAN-058 직렬 뒤 — 060 은 명세·파일럿·전 편 기계 이전, 058 은 110편 재집필 때 알고리즘 중심 서술까지. ② 실습 문제는 지금 문제를 옮긴다(시그니처·스텁·테스트 그대로). ③ 가이드 없는 8곳 — 같은 알고리즘 가이드가 있으면 그 가이드의 실습에 문제로 더하고, 없으면 가이드를 새로 쓴다.

**왜 두 단계인가.** 110편 본문을 알고리즘 중심으로 고치는 일은 곧 v2 재집필이다. 060 에서 하면 058 과 같은 110편을 두 번 쓴다. 그래서 060 은 규칙을 세워 파일럿 한 편으로 증명하고, 문제 서술을 가이드 끝 실습 절로 기계적으로 옮기는 데서 멈춘다. `problem.md` 는 060 안에서 모두 사라지고(원문 ③), 옛 구성 가이드도 문제 맥락을 같은 문서 끝에서 읽는다. **원문 ①의 110편 적용은 KAN-058 몫이다.**

**명세 개정.**

- 새 항목 `practice` — `## 실습 — 직접 풀어 보기`, fixed · 필수 · order 90, 파트 2 뒤 문서 끝. 문제마다 `### {문제 이름}`(`practice.problem`, 반복 ≥ 1), 그 아래 `####` 5절(스토리 · 함수 인터페이스 · 제약 조건 · 문제 상세 · 예시 — 옛 problem spec 5항), 끝에 스텁·테스트 경로와 `bun test <경로>`.
- voice 규칙 「문서 끝은 스스로 점검하기로 마무리」(`.claude/authoring/voices/algorithm-guide-writer/voice.md:95`, SPEC 이 인용하는 87행은 밀린 옛 번호)를 「파트 2 는 selfcheck 로 맺고, 문서는 실습으로 끝낸다」로 고친다.
- 새 규칙 `L49` — 파트 1·2 는 실습 문제를 전제하지 않는다. `deep.origin` ① 은 「다룰 과제를 고정한다」(스토리 없이 입출력 계약·규모·기호표). 「이 문제」·「지문」·「문제가 정해 두었다」류를 실습 밖에서 쓰지 않는다. §8 한시 조항: `deep.origin` 이 있는 편만 잰다, 058 이 닫히면 지운다.
- `selfcheck` 의 답 없는 문제(`sandbox/algo-guide-v2/SPEC.md:776`)는 이해 점검, 실습은 스텁을 채워 테스트를 통과시키는 과제 — 두 절에 경계를 한 줄씩.

**규칙 자산.** `specs/problem/` 5항을 SPEC `practice` 로 옮기고 퇴역, `.claude/authoring.lock.json` 의 problem·voice 해시 갱신(S3 에서 `lock --update`). `gen-problem` 은 가이드 실습 절과 테스트를 쓰도록 전환. 낡은 서술 `.claude/skills/guide-for-problem/SKILL.md` 의 description·입력 서술(S3 에서 고침) · `README.md:17,26-36,75` · `CLAUDE.md:11` 정정.

**가이드 없는 8곳 후보 처분(S5 에서 유저 확인).** `etc/kadane`→`array/kadane` · `etc/maxProfit`→`array/bestTimeToBuyAndSellStock` · `array/tapeEquilibrium`·`array/genomicRangeQuery`→`array/prefixSumRangeQuery` 흡수. `array/missingInteger`(`sorting/countingSort` 흡수 또는 신규)·`etc/numberOfDisintersection`(신규 또는 정렬·이분 탐색 쪽 흡수)은 확인 필요. `array/twoSum`·`bit-manipulation/binaryGap` 은 신규 가이드.

**제약.** 자료구조 트랙은 건드리지 않는다. 흡수 때 남은 메모 파일(`genomicRangeQuery_solved.*`, `*.md` 해설)은 지우지 않고 옮긴다. `_scratch/` 는 학습자 연습장이라 고치지 않는다.

**리스크.** `solutions` 브랜치(`/Users/centurio/code_test`)에 채운 스텁이 있으면 S7 폴더 이동과 충돌한다 — S7 전에 확인(확인 안 함). 옛 110편에 `## 실습` 이 붙으면 `check-v2 --all` 의 다른 검사가 새로 걸릴 수 있다 — S2 완료 기준으로 먼저 잡는다. 신규 가이드는 한 편이 파일럿 한 편 규모다.

**버린 대안.** 058 에 흡수(`problem.md` 가 058 완료까지 남는다) · 060 이 110편 본문까지 재집필(058 과 이중 작업) · 새 실습 문제 창작(편마다 스텁·테스트·정답 확인) · `.ts` JSDoc 이관(유저가 「가이드 끝」을 지정).

## 실행 계획
<!-- `S<n>`은 고정 id — 이름을 바꾸지 않는다. 체크 상태는 doc-step 이 갱신한다. -->
**배치 1 — 명세·도구**

- [x] `S1` SPEC·voice 개정 — §1 표 · §2 매핑 · §3 `practice` 작성법 · `deep.origin` ① 개정 · §6 `L49` · §8 한시 조항 · `selfcheck` 경계 · SPEC 의 voice 인용 행 번호(87 → 95) · voice 「문서 끝」 규칙 · `FEEDBACK.md` 한 줄. `grep -n '문제를 고정\|이 문제'` 로 SPEC·voice 의 자리를 전수로 처분(`deep.origin` ① · 873행 L3 포함). 완료 기준: 자리마다 처분이 정해져 있고 `check-links`·`check-citations` 통과
- [x] `S2` 스캐너 — `tools/section.ts` 에 `practice`·`practice.problem`, `tools/check-v2.ts` 에 P22(실습 절 · 문제마다 5소절 · 스텁·테스트 경로 실재)·P23(실습 밖 실습 문제 지칭, `deep.origin` 있는 편만), `check-v2.test.ts` 사례. 완료 기준: 시험 통과 · `--all` 에서 P22 위반이 「실습 절 없음」뿐이고 그 수가 이전 대상 수와 같다 · P22 밖 위반 수가 개정 전과 같다 · 옛 구성 두세 편에 실습 절을 임시로 붙여 순서·헤딩 규칙이 새로 안 걸리는지 확인
- [x] `S3` 규칙 자산 — `specs/problem` 퇴역 · `gen-problem`·`guide-for-problem` 개정 · `README.md`·`CLAUDE.md:11` 정정 · `.claude/authoring.lock.json` 의 problem·voice 해시 갱신. 완료 기준: `authoring-doctor` 가 깨진 참조 없이 돌고 `check-links` 통과

**배치 2 — 파일럿(메인 세션, learning 스타일 확인 뒤 직접 집필)**

- [x] `S4` `sparseTableRangeMin` 재집필 — 파트 1·2 에서 스토리와 「이 문제」류를 걷고 `deep.origin` ① 을 과제 고정으로, 기존 문제를 `## 실습` 으로 옮기고 `problem.md` 삭제, 값이 바뀐 자리는 `proof.ts`·`fig.tsx`·`sim.ts` 를 맞춘다. 완료 기준: `check-v2`(P22·P23) · `check-proof --require` · `render-figs --check` · 가이드 `bun test` · `build-html` 통과

**배치 3 — 전 편 기계 이전**

- [ ] `S5` 가이드 없는 8곳 분류 — 전략 절의 후보표를 유저에게 내밀어 흡수/신규를 확정. 완료 기준: 폴더마다 처분이 유저 확인으로 서고, 신규 편수가 정해져 S8 을 편마다 나눌 수 있다
- [ ] `S6` `tools/migrate-practice.ts`(일회성, `--dry-run`) — `problem.md` 를 가이드 끝 `## 실습` 으로(헤딩 두 단 강등 · 스텁·테스트 경로 줄), 삭제, 링크 143개를 같은 폴더 `-guide.md`(흡수 대상은 host 실습 앵커)로, 코드 주석 넷 정정. `--dry-run` 은 삽입 사본에 `check-v2` 결과까지 낸다. 110편 실행(파일럿 제외). 완료 기준: `check-links refs` 의 `-problem.md` 참조 0 · `check-links check`·`check-v2 --all` 통과 · `_scratch/` 밖 `src/algorithms/**/*.ts` 의 `problem\.md` grep 0(`_scratch/` 는 남은 수만 기록) · 남은 `problem.md` 는 신규 가이드 대기분뿐
- [ ] `S7` 흡수 — 스텁·테스트·메모 파일을 host 폴더로 옮기고(메모는 지우지 않는다) host 실습 절에 문제로 더하고 옛 폴더를 비운다. 시작 전 `solutions` 브랜치 충돌 여부 확인. 완료 기준: `ci.ts practice` 실행 목록에 옮긴 테스트가 있다(미구현 실패 정상) · `check-links` 통과

**배치 4 — 신규 가이드**

- [ ] `S8` 신규 가이드 집필 — S5 가 정한 편마다 v2 규격(ref·sim·fig·proof·test 사이드카) + 실습 절, `problem.md` 삭제, `문제_가이드_목록.md` 등재. S5 확정 뒤 둘째 편부터는 `S10` 이후 id 로 나누고 이 줄은 첫 편으로 좁힌다. 셋을 넘으면 배치를 나눈다. 완료 기준: 편마다 `check-v2`·`check-proof --require`·`render-figs --check`·`build-html` 통과

**배치 5 — 검증·검토**

- [ ] `S9` 검증 전체(아래 「검증」 절) · 검토서(판단 항목: 파일럿 서술 · S5 분류 · 신규 가이드) · 검토로 이동. 완료 기준: 전 항목 통과, 카드가 검토 컬럼에 있고 검토 화면이 열린다

## 검증
<!-- 무엇을 실행해 무엇이 나오면 이 카드가 끝난 것인가. -->
```bash
bun run tools/ci.ts all                                  # 4모드 + 게이트
bun run tools/check-v2.ts --all                          # P22·P23 포함
bun run tools/check-links.ts refs src/algorithms         # -problem.md 참조 0
find src/algorithms -name '*-problem.md' | wc -l         # 0
grep -rl 'problem\.md' src/algorithms --include='*.ts' --exclude-dir=_scratch | wc -l   # 0
bun run tools/check-proof.ts --all                   # CI 와 같다(--require 는 main 에서도 세 편이 증명 블록 없음으로 실패)
bun run tools/check-proof.ts --require src/algorithms/array/sparseTableRangeMin/sparseTableRangeMin-guide.md
bun run tools/render-figs.ts --check
bun test tools/check-v2.test.ts
bunx tsc --noEmit
bunx --bun @biomejs/biome check tools/migrate-practice.ts tools/check-v2.ts tools/section.ts
```

## 수행 내역
<!-- KANBAN:LOG append-only — 아래로만 덧붙인다. 위를 고치지 않는다. -->
- 2026-09-29T04:09 · s:15cf9d75 — `전략` 섹션 교체
- 2026-09-29T04:09 · s:15cf9d75 — `실행 계획` 섹션 교체
- 2026-09-29T04:09 · s:15cf9d75 — `검증` 섹션 교체
- 2026-09-29T04:34 · s:15cf9d75 · S1 doing — 착수
- 2026-09-29T04:37 · s:15cf9d75 · S1 done — SPEC: §1 practice 3행·실습 도입 문단, §2 매핑·해소 규칙, §3 deep.origin ① 「다룰 과제를 고정한다」, pause 의 「이 문제에서는」→「이 입력 범위에서는」, selfcheck voice 인용 87→95 + 실습과의 경계, practice 절 신설, §6 L3 문구·L49 행·번호 안내(다음 L50), §8 L49 한시 조항, §0 스캐너 P1~P23. voice 규칙 9(~/.claude 원본 → --sync). FEEDBACK R30. grep 처분: SPEC 312(고침)·510(고침)·735(고침)·873 L3(고침)·340(새 문장, 금지 표현을 인용하는 자리라 그대로). remap 으로 KAN-034·057 인용 7곳 이동, 대장 갱신. check-links·check-citations 통과
- 2026-09-29T04:37 · s:15cf9d75 · S2 doing — 착수
- 2026-09-29T04:50 · s:15cf9d75 — S2 에서 scope 에 tools/check-metaphor.ts·test 를 더했다(은유 검사가 실습 절을 읽어 옮겨 온 문제 스토리에서 위반을 냄). scope 변경으로 직렬 중재 둘(058·039)과 036 용인이 자동 무효가 돼, 겹침 내용이 같음을 확인하고 유저 결정 그대로 다시 기록했다
- 2026-09-29T04:51 · s:15cf9d75 · S2 done — section.ts: PRACTICE_HEADING·PRACTICE_PARTS, 실습 아래 ###/####/##### 를 practice.problem/part/sub 로(algo 만). check-v2.ts: guideText(실습 앞 본문만 본문 검사에) · P22 practiceFindings(절 하나·마지막 ##·문제 ≥1·소절 여섯 순서·풀 파일 줄·링크 실재) · P23 practiceReferenceFindings(「이 문제」·「문제가 … 정해」·「문제의 제약」, deep.origin 있는 편만). check-metaphor.ts 도 가이드는 실습 앞에서 끊는다(scope 추가). 시험 check-v2 171/171 · check-metaphor 23/23. --all: P22 111(전부 「실습 절 없음」) · P23 8(전부 파일럿, S4 몫) · 그 밖 0(기준선과 같음) · ds 0. kadane·dijkstra·ahoCorasick 에 실습 임시 부착 → check-v2 통과·check-proof·build-html·guide-core·check-metaphor 통과(은유 1건을 찾아 check-metaphor 를 고침) 뒤 되돌림. L49 문구에서 「지문」 제외(purpose.cue·해시 지문 오탐). 인용 remap 8곳
- 2026-09-29T04:51 · s:15cf9d75 · S3 doing — 착수
- 2026-09-29T04:54 · s:15cf9d75 · S3 done — specs/problem 퇴역(git rm) — 소절별 작성법·풀이 비암시·예시=테스트 기대값·테스트 세 축을 SPEC §3 practice 로 옮김. gen-problem SKILL 을 실습 절+스텁+테스트 쓰기로 다시 씀(-problem.md 생성 금지). guide-for-problem description·입력 서술 · README 폴더 구조·문제 생성·가이드 절 · CLAUDE.md 트랙 표·spec 경로 정정. authoring lock --update(voice 해시 · problem 제거 — 예상한 두 변경뿐). 완료 기준의 authoring-doctor 대신 authoring.py validate --all 로 확인(통과). check-links·check-citations 통과, 인용 remap 4곳. docs/ORD-006-strategy.md:257 의 problem spec 언급은 ORD-006 당시 기록이라 두었다
- 2026-09-29T04:54 · s:15cf9d75 · S4 doing — 착수
- 2026-09-29T05:13 · s:15cf9d75 · S4 done — 파일럿: 「이 문제」류 11곳을 과제·제약 범위·정적 배열로 다시 씀(P23 8 + 71·90·114행), 기호표 열 「이 과제에서」, 비용 예산을 「흔한 채점 환경의 예산 1 초·256 MB」로(SPEC deep.origin 에 그 기준 한 줄 추가), 링크 4개를 이웃 가이드로, 끝에 ## 실습 — 문제 문서 여섯 절을 두 단 내려 옮기고 sparseTableRangeMin-problem.md 삭제. 이웃 세 편의 파일럿 문제 링크 5개도 파일럿 가이드로. purpose.cue 의 「지문」 표는 문제 일반이라 둠. 값·증명·그림은 안 바뀜. 검사: check-v2 P1~P23 · check-proof --require(파일럿 25/25) · render-figs --check · build-html · check-metaphor · guide-core · 가이드 시험 16/16 · check-links · check-citations 통과. 남은 경고 P3(T1·T2 미도식)는 main 에도 있던 것. check-proof --all --require 는 main 에서도 세 편(증명 블록 없음)으로 실패 — 카드 검증 명령을 CI 와 같은 --all 로 고친다. 출력 스타일은 Plan KO 였다(learning 전환은 세션이 못 함) — 전면 재집필이 아니라 지칭 교체 범위라 voice·검사기로 진행
