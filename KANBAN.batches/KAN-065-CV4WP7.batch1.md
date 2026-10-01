---
card: KAN-065-CV4WP7
batch: 1
created: 2026-10-01
branch: KAN-065-CV4WP7
status: 계획
steps: S1, S2, S3, S4, S5
---

# KAN-065-CV4WP7 배치1 — 분석 문서를 solutions 로 몰고 다시 새지 않게 막는다

카드: [KAN-065-CV4WP7.md](../KANBAN.cards/KAN-065-CV4WP7.md) · 범위 `S1` · `S2` · `S3` · `S4` · `S5`
선행: 없음 (이 카드의 첫 배치)

> **이 문서는 착수 전 계획이다.** 수행 내역은 카드 실행 문서의 「수행 내역」에 있다.

## 1. 작업 패키지

### WP1 · `S1` solutions 전용 파일 규칙과 누수 검사

`tools/solutions-merge.ts` 에 경로 규칙 `SOLUTIONS_ONLY`(`*-analysis.md` · `*-analysis/`)를 두고, 병합에서 main 이 지운 solutions 전용 파일을 HEAD 판으로 되살린다. 같은 규칙으로 저장소에 그런 파일이 있는지 세는 함수를 내보내 테스트가 쓴다.

**완료 기준**: 새 시험이 S2 전 트리에서 13건 실패, 뒤 0건. 모의 병합 시험 통과. biome 경고 0

### WP2 · `S2` 분석 문서 13편 삭제 · KAN-001 실행 문서 이관

**완료 기준**: `git ls-files | grep -c -- -analysis.md` 0. `KANBAN.cards/KAN-001.md` 가 solutions 판과 바이트 동일

### WP3 · `S3` 재발 방지 문서

analyze-solution 스킬 두 벌 · README 분석 절 · CLAUDE.md 브랜치 절.

**완료 기준**: `check-links`·`check-citations` 통과

### WP4 · `S4` solutions 실제 병합

**완료 기준**: 병합 뒤 solutions 의 분석 문서 15편이 병합 전과 바이트 동일, 풀이→스텁 0. push 안 함

### WP5 · `S5` 전체 검증과 검토서

**완료 기준**: `bun run tools/ci.ts all` 통과, 검토서 발행

## 2. 의존과 순서

S1 → S2(누수 검사가 실패에서 통과로 바뀌는 것을 실측하려면 S1 이 먼저다) → S3 → S4(S2 의 삭제를 solutions 가 받아야 도구가 일을 하는지 볼 수 있다) → S5.

**수행 방식 두 안.** work 다섯이 모두 작고 앞 결과에 기대므로 **단일 에이전트 순차 수행**으로 한 배치에 끝낸다. 오케스트레이션 안은 병렬로 나눌 자리가 S3(문서 셋) 하나뿐이고 그것도 파일 셋이라, 서브에이전트를 띄우는 비용이 일보다 크다.

## 3. 리스크

- S4 는 다른 체크아웃(`/Users/centurio/code_test`)에 병합 커밋을 쌓는다. 작업 트리가 깨끗하지 않으면 도구가 멈춘다 — 그때는 손대지 않고 보고한다.
- 분석 문서는 이력에 남는다. 이력 정리는 이 카드 범위 밖이다.

## 4. 착수 시점 판단

다섯을 한 배치로 간다. 미룰 work 없음.
