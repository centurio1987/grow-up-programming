# ORD-006 실행 런북

> **새 세션은 이 문서로 시작한다.** 전략 전문(`docs/ORD-006-strategy.md` 361줄)과 보드 전문
> (`KANBAN.md`)을 매번 통독하지 않기 위한 문서다. 아래 `불변 사실`과 자기 배치 카드만 읽고 착수한다.
> 필요할 때만 전략 전문의 해당 절을 줄 번호로 찾아 읽는다.
>
> 실행 계획 원본: `~/.claude/plans/kan-001-jazzy-charm.md`
> 이 문서는 처음부터 완성돼 있지 않다. **배치가 끝날 때마다 그 배치 칸을 채운다.**

## 불변 사실 (매 배치 공통)

1. 적용 범위는 `src/data-structures/` 69종뿐이다. `src/algorithms/` 107종은 현행 유지.
2. `<name>-problem.md`는 제거한다. 대체물은 `<name>.ts` 헤더 JSDoc의 계약 명세다.
3. `<name>.ts` 본문은 실습 스텁(`Not implemented`)으로 유지한다.
4. 명세에 **내부 표현·알고리즘을 처방하지 않는다.** 진단된 A급 결함 4건의 직접 원인이 이것이다.
5. 테스트는 3축이다 — 축1 동작 / 축2 불변식 / 축3 복잡도 계약.
6. 축3은 절대 카운트가 아니라 **성장률** $r = C(4n)/C(n)$ 로 판정한다. 특정 구현을 강제하지 않기 위해서다.
7. 축3은 **벽시계를 쓰지 않는다.** 구현이 노출하는 `__cost` 누적 카운터로만 잰다. 벽시계는 `_bench/`로 격리하고 CI 판정에서 제외한다.
8. 언어 우선순위는 TypeScript → Rust → Python. Python은 정의만 두고 산출물 요구는 보류한다.
9. 언어 에스컬레이션은 2등급이다 — (가) TS로 계약 충족 불가 → Rust 필수 / (나) 점근 계약은 되나 실측 불가 → Rust 선택.
10. 가이드는 문제가 아니라 자료구조를 다룬다. 캔버스 8단계, 문제 스토리 금지.
11. 가이드 코드는 복제하지 않는다. `// #region guide:core` 로 `_reference/`에서 추출한다.
12. 집필은 `Skill(authoring-kit:authoring-write) --spec ds-guide` 로만 한다. **구 경로 폴백은 없다** — 플러그인이 안 잡히면 거기서 멈춘다.
13. 집필 규칙의 정본은 이 저장소가 아니라 `authoring-kit` 플러그인의 spec·voice다. 규칙을 스킬 문서에 다시 쓰지 않는다.
14. 과장·구어 표현을 쓰지 않는다. 지어낸 은유 동사(무너지다·버티다·밟다)와 가짜 질문 부정 도입도 금지다(principles D5·F5).
15. 확인하지 않은 수치를 쓰지 않는다. 본문에 싣는 값은 실제로 돌려 본 것만.

## 배치 규약

- **배치 하나 = 세션 하나 = 커밋 경계.** 세션 중간에 끊지 않는다.
- 배치 **시작**: `git status`로 워킹트리가 깨끗한지 확인한다.
- 배치 **종료**: 셋을 남긴다. 하나라도 빠지면 다음 세션이 이전 대화를 복원하느라 비용을 쓴다.
  1. `KANBAN.md` 카드 메모에 결과 1~3줄(결정·수치·미해결) + 변경 파일 요약 — `manage-kanban` 스킬 경유
  2. 규약이 바뀌었으면 `docs/ORD-006-conventions.md` 갱신
  3. 이 문서의 다음 배치 칸 채우기

## 배치 지도

| 배치 | 카드 | 상태 | 선행 | 산출 |
|---|---|---|---|---|
| B0 | 029·001메모·030 | **진행 중** | — | 이 문서 |
| B0' | 030 | 대기 | B0 | `ORD-006-inventory.tsv`, `tools/ord006-inventory.ts` |
| B1 | 007 + 005 | 대기 | B0' | conventions §규약4, 처분 결정 3건 |
| B2 | 002 | 대기 | B1 | conventions §규약1, 시범 2종 |
| B3 | 003 | 대기 | B2 | conventions §규약2, `runContract.ts` |
| B4 | 004 | 대기 | — | ds-guide spec 8단계 + lock |
| B5 | 006 | 대기 | B1 | `rust/` (조건부) |
| B6~ | 008~028 | 대기 | — | 계획서 §4 |
| 최종 | 001 봉인 | 대기 | 전 카드 | ORD-006 COMMITTED |

## 배치별 진입 카드

### B0 — 카드 정리 + 최소 런북 (진행 중)

- **읽을 것**: 이 문서, `KANBAN.md`의 KAN-001·029·030
- **할 것**: ① `authoring.py status`/`lock` 확인 ② KAN-001 메모에 이관 완료 사실 고정 ③ KAN-030 신설 ④ 이 문서 작성
- **끝낼 때**: KAN-029는 CLI 재시작 후 스킬 등록을 확인하기 전까지 `검토`에 둔다

**2026-08-04 결과**

- `authoring.py status` 정상 — spec 3종(`algo-guide`·`ds-guide`·`problem`), voice 5종 인식
- `lock`이 stale이었다. principles가 `f4e11e6`으로 전진했고 내용은 **D5(지어낸 은유 동사 금지)·F5(가짜 질문 부정 도입 금지)** 신설이다. ORD-006 지시 원문의 *"무너지긴 뭐가 무너져. 오버좀 하지 마라"* 와 같은 요구라 수용하고 `lock --update`로 재고정했다. **spec·voice·QUALITY_RUBRIC 해시는 불변** — `ds-guide` spec 3종은 무효화되지 않았다
- **미해결**: 이 세션의 스킬 목록에 `authoring-kit:*` 6종이 없다. `/clear`는 플러그인을 재적재하지 않는다. **CLI 프로세스를 완전히 재시작한 뒤 `Skill(authoring-kit:authoring-write)`가 뜨는지 확인해야 KAN-029를 닫을 수 있다.** 이것이 안 되면 KAN-008~010 파일럿이 집필 단계에 진입하지 못한다

### B0' — 인벤토리 (다음)

- **읽을 것**: 이 문서, `ORDER.md:39-63`(진단 9건 표 — 결함등급 열의 유일한 출처)
- **할 것**: `tools/ord006-inventory.ts` 작성 → `docs/ORD-006-inventory.tsv` 생성
- **열**: `path · category · name · 결함등급(A/B/C/-) · 검증등급후보 · 에스컬레이션후보((가)/(나)/-) · problem_lines · guide_lines · has_reference`
- **채우지 않는 것**: 결함등급은 진단 표에 있는 9종만. 나머지 60종은 `-`로 두고 추정하지 않는다. 검증등급·에스컬레이션 후보 열도 B1·B2 전까지는 비워 둔다
- **검증**: 행 수가 아니라 양방향 diff

  ```bash
  find src/data-structures -mindepth 2 -maxdepth 2 -type d ! -name '_*' | sort > /tmp/fs.txt
  tail -n +2 docs/ORD-006-inventory.tsv | cut -f1 | sort > /tmp/tsv.txt
  diff /tmp/fs.txt /tmp/tsv.txt && echo OK
  ```
- **끝낼 때**: KAN-030 메모에 생성 행 수와 diff 결과를 남긴다

## 참조 (필요할 때만)

| 찾는 것 | 위치 |
|---|---|
| 지시 원문 · 진단 9건 표 | `ORDER.md:13-63` |
| 산출물 배치 | `docs/ORD-006-strategy.md:57-75` |
| 규약1 명세 규격 | `docs/ORD-006-strategy.md:77-94` |
| 규약2 계약 스위트 · 축3 판정 수치 | `docs/ORD-006-strategy.md:96-142` |
| 규약3 캔버스 8단계 표 | `docs/ORD-006-strategy.md:144-184` |
| 규약4 에스컬레이션 | `docs/ORD-006-strategy.md:186-205` |
| CI 3모드 | `docs/ORD-006-strategy.md:207-213` |
| 공통 DoD 10항목 | `docs/ORD-006-strategy.md:269-280` |
| 집필 엔진 구조 | `docs/ORD-006-strategy.md:215-250`, `CLAUDE.md` |
