---
card: KAN-065-CV4WP7
title: solutions 에만 있는 비풀이 커밋과 main 의 풀이 분석 문서 정리 — 두 브랜치가 무엇을 나눠 갖는지 정한다
created: 2026-10-01
scope: src/algorithms/array/houseRobber/houseRobber-analysis.md, src/algorithms/binary-search/parametricBinarySearch/parametricBinarySearch-analysis.md, src/algorithms/bit-manipulation/enumerateSubmasks/enumerateSubmasks-analysis.md, src/algorithms/dp/knapsack01/knapsack01-analysis.md, src/algorithms/graph-flow/kruskalMst/kruskalMst-analysis.md, src/algorithms/graph/bfsShortestPath/bfsShortestPath-analysis.md, src/algorithms/shortest-path/dijkstra/dijkstra-analysis.md, src/algorithms/sorting/countingSort/countingSort-analysis.md, src/algorithms/sorting/insertionSort/insertionSort-analysis.md, src/algorithms/sorting/kthSmallest/kthSmallest-analysis.md, src/algorithms/sorting/quicksort/quicksort-analysis.md, src/algorithms/sorting/radixSort/radixSort-analysis.md, src/data-structures/tree/binarySearchTree/binarySearchTree-analysis.md, tools/solutions-merge.ts, tools/solutions-merge.test.ts, .claude/skills/analyze-solution/SKILL.md, .agents/skills/analyze-solution/SKILL.md, README.md, CLAUDE.md, KANBAN.cards/KAN-001.md
---

# KAN-065-CV4WP7 — solutions 에만 있는 비풀이 커밋과 main 의 풀이 분석 문서 정리 — 두 브랜치가 무엇을 나눠 갖는지 정한다

## 전략
**전제(유저 확인, 2026-10-01).** solutions 는 main 에 병합되지 않는 브랜치이고 앞으로도 병합될 일이 없다. main 을 받아서 쓰는 브랜치다. 그래서 「solutions 의 비풀이 커밋을 main 으로 옮기는 길」은 병합이 아니라 **내용 대조**로 정한다.

**대조 결과 — 옮길 것은 문서 한 편뿐이다.** solutions 는 병합 기준점 `911373ed`(main 커밋) 위에 33개 파일만 다르다(`git diff --stat main...solutions`). 그 33개는 풀이 스텁 29편 · 분석 문서 둘(deque · monotonicQueue) · `KANBAN.cards/KAN-001.md` · 빈 잠금 파일 둘이다. 카드 메모가 든 비풀이 커밋(807bc7b9·c4555102 훅, 0adb1fc2·b494a300 가이드, dcd37711·b83a1d5b 자료구조 계약 등)은 그 뒤 solutions 가 main 을 받을 때 main 판으로 정리돼 지금 solutions 트리에 차이가 남아 있지 않다. 셋은 main 에 같은 내용이 있고(807bc7b9·48096d24·b494a300 — `git apply -R --check` 통과), 나머지는 main 이 그 파일을 다시 썼거나 지웠다(ORD-006 재집필로 `*-problem.md` 퇴역, 집필 spec 의 플러그인 이관, problem spec 퇴역).

- `KANBAN.cards/KAN-001.md`(337줄, 8aa553d4) — 보드의 살아 있는 카드 KAN-001 의 실행 문서인데 solutions 에만 있다. main 으로 가져온다.
- `KANBAN.cards/.KAN-001.lock` · `KANBAN.state.json.lock` — 빈 잠금 파일이 커밋된 것이다. 버린다(잠금 파일은 커밋 대상이 아니다).

**분석 문서 13편은 main 에서 지우고 solutions 에서 지킨다.** `*-analysis.md` 는 `analyze-solution` 스킬이 학습자 풀이를 진단한 기록이라 풀이를 그대로 드러낸다(코드 인용·버그 위치). main 에서 지우기만 하면 solutions 는 그 파일을 기준점 뒤로 안 고쳤으므로 다음 `git merge main` 이 삭제를 그대로 가져온다 — KAN-064 의 스텁 덮어쓰기와 같은 길이다. 그래서 `tools/solutions-merge.ts` 가 「solutions 전용 파일」(경로 규칙 `*-analysis.md` · `*-analysis/`)을 main 이 지웠을 때도 HEAD 판으로 되살리게 넓힌다. 같은 규칙으로 main 쪽 누수 검사를 건다 — 규칙은 한 자리(`SOLUTIONS_ONLY`)에만 둔다.

**`_scratch/` 는 그대로 둔다.** 155개 파일 모두 가이드 생성 커밋(ORD-004·005 재집필)에서 들어온 가이드 본문 코드의 자기검증 습작이다. 가이드 `-guide.ref.ts` 가 이미 같은 코드를 싣고 있어 더 드러내는 것이 없고, 학습자 풀이가 아니다.

**다시 새지 않게.** ① `analyze-solution` 스킬이 solutions 브랜치가 아니면 보고서를 쓰지 않고 멈춘다. ② README 의 분석 보고서 안내에 같은 사실을 적는다. ③ CLAUDE.md 에 두 브랜치의 역할(비풀이 작업은 main 에서, solutions 는 `tools/solutions-merge.ts` 로 main 을 받기만 한다)을 적는다.

**solutions 쪽 실제 병합은 이 카드에서 한다.** KAN-064 S5 와 같은 방식으로, 이 브랜치를 solutions 체크아웃(`/Users/centurio/code_test`)에서 넓힌 도구로 병합하고 분석 문서 13편이 남는지 확인한다. push 는 하지 않는다.

**버린 대안.** ① 분석 문서를 `_private/` 같은 무시 폴더로 옮기기 — 이력에는 그대로 남고, solutions 에서도 자리가 바뀌어 스킬 경로를 다시 짜야 한다. ② solutions 의 비풀이 커밋을 cherry-pick — 옮길 내용이 이미 없다(위 대조). ③ 이력에서 분석 문서를 지우기(filter-repo) — 공유 이력을 다시 쓰는 일이라 이 카드 범위가 아니다. 필요하면 별도 카드로 뗀다.

## 실행 계획
- [x] `S1` solutions 전용 파일 규칙과 누수 검사 — `tools/solutions-merge.ts` 에 `SOLUTIONS_ONLY` 와 판별 함수를 두고, main 이 지운 solutions 전용 파일을 되살리게 `plan` 을 넓힌다. 테스트에 ① 모의 저장소에서 main 이 분석 문서를 지운 병합 뒤 HEAD 판이 남는지 ② 저장소에 solutions 전용 파일이 0인지를 더한다. 완료 기준: 새 시험이 S2 전 트리에서 13건 실패, 뒤 0건. biome 경고 0
- [x] `S2` main 에서 분석 문서 13편을 지우고 KAN-001 실행 문서를 가져온다 — `KANBAN.cards/KAN-001.md` 는 solutions 판(8aa553d4) 그대로. 참조 두 자리(analyze-solution 스킬의 보고서 경로 예시 · README 분석 절)는 S3 에서 고친다. 완료 기준: `git ls-files | grep -c -- -analysis.md` 0, `check-links` 통과
- [x] `S3` 재발 방지 문서 — analyze-solution 스킬(.claude · .agents 두 벌)에 「solutions 브랜치가 아니면 쓰지 않는다」, README 분석 절에 같은 안내, CLAUDE.md 에 두 브랜치 역할. 완료 기준: 세 자리에 문구가 서고 `check-links`·`check-citations` 통과
- [x] `S4` solutions 실제 병합 — solutions 체크아웃에서 `bun run <이 워크트리>/tools/solutions-merge.ts KAN-065-CV4WP7`. 완료 기준: 병합 커밋 뒤 solutions 에 분석 문서 15편(13 + deque · monotonicQueue)이 병합 전과 바이트 동일, 풀이→스텁 0. push 안 함
- [ ] `S5` 전체 검증과 검토서. 완료 기준: `bun run tools/ci.ts all` 통과

## 검증
- `bun run tools/ci.ts all` 통과(practice 모드의 미구현 실패는 정상)
- `bun test tools/solutions-merge.test.ts tools/practice-ref.test.ts` — 스텁 누수 0 · solutions 전용 파일 0
- `git ls-files | grep -- '-analysis'` 가 비어 있다
- solutions 병합(S4) 뒤 `git diff <병합 전 solutions> HEAD -- '*-analysis.md'` 가 비어 있다

## 수행 내역
<!-- KANBAN:LOG append-only — 아래로만 덧붙인다. 위를 고치지 않는다. -->
- 2026-10-01T09:34 · s:3f0bb39d — `전략` 섹션 교체
- 2026-10-01T09:34 · s:3f0bb39d — `실행 계획` 섹션 교체
- 2026-10-01T09:34 · s:3f0bb39d — `검증` 섹션 교체
- 2026-10-01T09:36 · s:3f0bb39d · S1 doing — 착수
- 2026-10-01T09:36 · s:3f0bb39d · S1 done — solutions-merge.ts 에 SOLUTIONS_ONLY(*-analysis.md · *-analysis/) + isSolutionsOnly · solutionsOnlyFiles, plan 이 main 이 지운 전용 파일을 되살림. 시험 3 추가 — S2 전 트리에서 저장소 검사 13건 실패 실측. biome 경고 0
- 2026-10-01T09:36 · s:3f0bb39d · S2 doing — 착수
- 2026-10-01T09:36 · s:3f0bb39d — `실행 계획` 섹션 교체
- 2026-10-01T09:36 · s:3f0bb39d · S2 done — 분석 보고서 13편 git rm(알고리즘 12 · binarySearchTree 1). KAN-001 실행 문서를 solutions 판(8aa553d4) 그대로 가져옴 — 바이트 동일. 저장소 검사 13→0. scope 를 실제 경로로 좁히고 KAN-036·039 와의 글롭 오탐 겹침은 dep-waive(실제 일치 0, fnmatch)
- 2026-10-01T09:36 · s:3f0bb39d · S3 doing — 착수
- 2026-10-01T09:37 · s:3f0bb39d · S3 done — analyze-solution 스킬 0단계(solutions 아니면 멈춤) · README 분석 절 · CLAUDE.md 「브랜치 — main 과 solutions」 절. .agents 판은 정본을 가리키기만 하므로 고치지 않음. check-links·check-citations 통과
- 2026-10-01T09:37 · s:3f0bb39d · S4 doing — 착수
- 2026-10-01T09:37 · s:3f0bb39d · S4 done — solutions 309d9173(← 93876975) — 도구가 분석 보고서 13편 되살림. 병합 전후 분석 문서 15편 차이 0, 풀이→스텁 0, KAN-001 문서 동일. push 안 함
