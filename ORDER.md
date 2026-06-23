# ORDER

이 문서는 인터랙티브 대화 대신 **문서로 지시를 받는 창구**다.
사용자는 `## 신규 지시` 영역만 편집한다. 완료된 지시는 `## 처리 완료 (COMMITTED)` 영역에
봉인 블록으로 옮겨지며, 봉인 블록은 편집·삭제하지 않는다(철회는 `reverts=ORD-NNN` 신규 지시로).

## 신규 지시

## 처리 완료 (COMMITTED)

<!-- ORDER:COMMITTED id=ORD-001 status=done committed=2026-06-23 -->
<!-- 봉인 구획: 편집 금지. 철회하려면 신규 지시에 reverts=ORD-001 항목을 추가하세요. -->

### ORD-001 — 가이드 집필 워크플로우 재정의

- 지시: 가이드 집필 워크플로우를 다시 정의 한다. "~/centurio1987.github.io" 프로젝트가 포함하고 있는 집필 workflow(리서치 -> 집필 -> 품질 게이트웨이 -> 발행)의 모든 사양과 내용을 반영한다. 단, 현재 가이드의 구성 항목(핵심 아이디어, 성능, 등등)은 계속 준수한다.
- 결과: `guide-for-problem` 스킬을 블로그 워크플로우(리서치 → 집필 → 품질 게이트웨이 → 발행) 4단계 파이프라인으로 재정의. 가이드 구성 항목(성능 목표 예측 / 목표 함수 / 핵심 아이디어 / 시뮬레이션 / 수도 코드와 Activity Diagram)은 그대로 보존.
  - `.claude/skills/guide-for-problem/SKILL.md` — 4단계 파이프라인으로 재작성(ORDER 원칙·외부 검토·품질 게이트 루프·발행 인덱스 등록 반영).
  - `.claude/skills/guide-for-problem/assets/QUALITY_CHECKLIST.md` — 신규. 블로그 quality-gate 루브릭을 알고리즘 가이드에 맞춰 이식(A~G, MUST/SHOULD/IF-APPLICABLE).
  - `.claude/skills/guide-for-problem/scripts/review-guide.sh` — 신규. 블로그 review-article.sh를 이식, codex/agy 외부 검토(누락·모순·복잡도/정확성). 실행권한·구문 검증 완료.
  <!-- /ORDER:COMMITTED id=ORD-001 -->

<!-- ORDER:COMMITTED id=ORD-002 status=done committed=2026-06-23 -->
<!-- 봉인 구획: 편집 금지. 철회하려면 신규 지시에 reverts=ORD-002 항목을 추가하세요. -->

### ORD-002 — 문제(*-problem.md) 집필 방법 개선

- 지시: 문제(*.problem.md) 집필 방법을 개선한다. "~/centurio1987.github.io"의 집필 workflow(리서치 → 집필 → 품질 게이트웨이 → 발행)의 모든 사양·내용을 반영하고, 내용을 더 풍성하게 제공하며, 독자가 문제를 쉽고 빠르게 이해하도록(독자=고객) 서술하고, 간단한 스토리를 추가하고, mdx로 표현 가능하게 한다. (정규 `## 신규 지시` 영역 밖 두 번째 `# ORDER` 제목 아래 작성돼 있었으나 신규 지시로 간주해 처리.)
- 결과: `gen-problem` 스킬을 블로그 워크플로우(리서치 → 집필 → 품질 게이트웨이 → 발행) 4단계 파이프라인으로 재정의. 문제 골격(함수 인터페이스 / 제약 조건 / 문제 상세 / 예시)과 기존 금기(파라미터 언더바 prefix 금지, 풀이 힌트 미포함)는 보존. 독자=고객 원칙·스토리 도입·mdx 지원·테스트-글 계약 일치를 추가.
  - `.claude/skills/gen-problem/SKILL.md` — 4단계 파이프라인으로 재작성(ORDER 원칙·스토리/한 줄 요약 도입·외부 검토·품질 게이트 루프·발행 단계·mdx 지원, 테스트 코드 생성 유지).
  - `.claude/skills/gen-problem/assets/PROBLEM_QUALITY_CHECKLIST.md` — 신규. blog quality-gate 루브릭을 문제 집필에 맞춰 이식(A~G: 빠른이해·스토리·완전성·풀이힌트금지·예시정확성·테스트커버리지·빌드, MUST/SHOULD/IF-APPLICABLE).
  - `.claude/skills/gen-problem/scripts/review-problem.sh` — 신규. review-guide.sh를 이식, codex/agy 외부 검토(모호·모순·예시정확성·힌트누출). 실행권한·구문 검증 완료.
  - `checklist.md`(테스트 커버리지 기준)는 보존하고 SKILL 2.2 / 체크리스트 F축에서 참조.
<!-- /ORDER:COMMITTED id=ORD-002 -->

## 신규 지시 (정규 위치 안내)

- 새 지시는 맨 위 `## 신규 지시` 영역에 추가해 주세요(이 봉인 영역은 편집·삭제하지 않습니다).
