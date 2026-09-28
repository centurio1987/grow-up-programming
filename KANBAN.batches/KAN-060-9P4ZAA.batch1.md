---
card: KAN-060-9P4ZAA
batch: 1
created: 2026-09-29
branch: KAN-060-9P4ZAA
status: 계획
steps: S1, S2, S3
---

# KAN-060-9P4ZAA 배치1 — 명세·스캐너·규칙 자산

카드: [KAN-060-9P4ZAA.md](../KANBAN.cards/KAN-060-9P4ZAA.md) · 범위 `S1` · `S2` · `S3`
선행: 없음 (이 카드의 첫 배치)

> **이 문서는 착수 전 계획이다.** 수행 내역은 카드 실행 문서의 「수행 내역」에 있다.

## 1. 작업 패키지
<!-- work 하나에 WP 하나. 각 WP 는 완료 기준으로 끝난다. -->
### WP1 · `S1` SPEC·voice 개정

`sandbox/algo-guide-v2/SPEC.md` 에 `practice` 항목(§1 표 · §2 매핑 · §3 작성법)과 규칙 `L49`(§6 · §8 한시 조항)를 세우고, `deep.origin` ① 을 「다룰 과제를 고정한다」로 바꾼다. voice 의 「문서 끝」 규칙을 「파트 2 는 selfcheck 로 맺고 문서는 실습으로 끝낸다」로 고친다.

**완료 기준**: `grep -n '문제를 고정\|이 문제'` 가 SPEC·voice 에서 낸 자리마다 처분이 정해져 있다 · `check-links`·`check-citations` 통과.

### WP2 · `S2` 스캐너

`tools/section.ts` 매핑, `tools/check-v2.ts` 의 P22(실습 절 구조와 스텁·테스트 경로)·P23(실습 밖 실습 문제 지칭, `deep.origin` 있는 편만), `tools/check-v2.test.ts` 사례.

**완료 기준**: 시험 통과 · `--all` 에서 P22 위반이 「실습 절 없음」뿐이고 그 수가 이전 대상 수와 같다 · P22 밖 위반 수가 개정 전과 같다 · 옛 구성 두세 편에 실습 절을 임시로 붙여도 다른 검사가 새로 안 걸린다.

### WP3 · `S3` 규칙 자산

`.claude/authoring/specs/problem/` 퇴역, `gen-problem`·`guide-for-problem` 스킬 개정, `README.md`·`CLAUDE.md` 정정, `.claude/authoring.lock.json` 의 problem·voice 해시 갱신.

**완료 기준**: `authoring-doctor` 가 깨진 참조 없이 돈다 · `check-links` 통과.

## 2. 의존과 순서

S2 는 S1 이 정한 헤딩 문구와 규칙 번호를 그대로 쓰므로 S1 뒤다. S3 은 S1 이 `practice` 에 5항을 받아 둔 뒤에야 problem spec 을 퇴역시킬 수 있다. 셋 다 이어지는 흐름이라 병렬로 줄일 구간이 없다.

| 관점 | 흐름 | 병렬 폭 | 배치 수 | 리스크 |
| --- | --- | --- | --- | --- |
| **단일 에이전트** (추천) | S1 → S2 → S3 | 1 | 1 | 세 work 가 한 세션 예산 절반 안에 든다(work 3개 · 기본값 3~4) |
| 오케스트레이션 | S1 → (S2 ∥ S3) | 2 | 1 | S2·S3 은 파일이 안 겹치지만 둘 다 S1 문구를 읽는다. S1 을 고치면 둘 다 다시 맞춰야 한다 |

단일 에이전트를 추천한다. 병렬로 얻는 구간이 S2·S3 하나뿐이고, 명세 문구가 흔들리는 첫 배치에서 두 갈래가 따로 해석하면 맞추는 비용이 더 든다.

## 3. 리스크

- **옛 110편 회귀.** P22 를 켜는 순간 110편이 전부 「실습 절 없음」으로 걸린다. 이것은 배치 3 에서 닫히는 예정된 위반이라 수로만 대조한다. 다른 검사가 새로 걸리면 S2 에서 멈추고 규칙을 다시 본다.
- **플러그인 쪽 spec 참조.** problem spec 을 지우면 authoring-kit 이 그 이름을 찾다 실패할 수 있다(확인 안 함). S3 에서 `authoring-doctor` 로 먼저 확인한다.

## 4. 착수 시점 판단
<!-- 착수할 때 채운다 — 마지막 work 를 다음 배치로 미룰지 여기서 정한다. -->
