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
16. 카테고리는 **계약(ADT)** 으로 가른다. 구현으로 가르지 않는다(B1 확정). 구현이 자유로우면 구현으로 나눈 분류는 정해지지 않는다.
17. 확정된 규약의 정본은 `docs/ORD-006-conventions.md`다. 전략과 어긋나면 conventions 가 이긴다.
18. 기계가 읽는 파일(TSV 등)의 값은 **ASCII 로 쓴다.** `en_US.UTF-8` 로케일의 `awk`·`uniq`는 한글 자모를 서로 같다고 판정한다.

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
| B0 | 029·001메모·030 | 완료 | — | 이 문서 |
| B0' | 030 | 완료 | B0 | `ORD-006-inventory.tsv`, `tools/ord006-inventory.ts` |
| B1 | 007 + 005 | 완료 | B0' | conventions §규약4, 처분 결정 3건 |
| B2 | 002 | **다음** | B1 | conventions §규약1, 시범 2종 |
| B3 | 003 | 대기 | B2 | conventions §규약2, `runContract.ts` |
| B4 | 004 | 대기 | — | ds-guide spec 8단계 + lock |
| B5 | 006 | 대기 | B1 | `rust/` (조건부) |
| B6~ | 008~028 | 대기 | — | 계획서 §4 |
| 최종 | 001 봉인 | 대기 | 전 카드 | ORD-006 COMMITTED |

## 배치별 진입 카드

### B0 — 카드 정리 + 최소 런북 (완료)

- **읽을 것**: 이 문서, `KANBAN.md`의 KAN-001·029·030
- **할 것**: ① `authoring.py status`/`lock` 확인 ② KAN-001 메모에 이관 완료 사실 고정 ③ KAN-030 신설 ④ 이 문서 작성
- **끝낼 때**: KAN-029는 CLI 재시작 후 스킬 등록을 확인하기 전까지 `검토`에 둔다

**2026-08-04 결과**

- `authoring.py status` 정상 — spec 3종(`algo-guide`·`ds-guide`·`problem`), voice 5종 인식
- `lock`이 stale이었다. principles가 `f4e11e6`으로 전진했고 내용은 **D5(지어낸 은유 동사 금지)·F5(가짜 질문 부정 도입 금지)** 신설이다. ORD-006 지시 원문의 *"무너지긴 뭐가 무너져. 오버좀 하지 마라"* 와 같은 요구라 수용하고 `lock --update`로 재고정했다. **spec·voice·QUALITY_RUBRIC 해시는 불변** — `ds-guide` spec 3종은 무효화되지 않았다
- **미해결**: 이 세션의 스킬 목록에 `authoring-kit:*` 6종이 없다. `/clear`는 플러그인을 재적재하지 않는다. **CLI 프로세스를 완전히 재시작한 뒤 `Skill(authoring-kit:authoring-write)`가 뜨는지 확인해야 KAN-029를 닫을 수 있다.** 이것이 안 되면 KAN-008~010 파일럿이 집필 단계에 진입하지 못한다

### B0' — 인벤토리 (완료)

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

**2026-08-04 결과**

- `docs/ORD-006-inventory.tsv` 69행 생성(카테고리 10종). 양방향 diff 일치, path 중복 0, 전 행 9열
- TSV 헤더는 ASCII다 — `path · category · name · defect_grade · verification_grade · escalation · problem_lines · guide_lines · has_reference`. 위 한글 열 이름과 순서가 같다. 하위 도구가 `cut -f1`로 path를 뽑기 때문에 헤더를 한글로 두지 않았다
- **값도 ASCII다**(B1에서 확정). `escalation`은 `(가)`/`(나)`가 아니라 `req`/`opt`로 적는다 — `en_US.UTF-8` 로케일의 `awk`·`uniq`가 `가`와 `나`를 같은 문자열로 판정하기 때문이다. 도구가 전 열에 대해 비 ASCII를 거부한다(`assertAscii`)
- 결함등급 분포 A 4 · B 2 · C 3 · `-` 60. `trie/ternarySearchTree`는 진단 표 본문이 아니라 각주(`ORDER.md:63`)라 `-`로 뒀다 — 이 건은 KAN-023이 따로 들고 있다
- `verification_grade`·`escalation`은 전 행 `-`. B1·B2가 채운다
- `has_reference`는 전 행 `false`. `_reference/`는 아직 한 곳도 없고 각 구조 디렉터리에는 `_deprecated/`(69종)·`_scratch/`(50종)만 있다. 규약2가 `_reference/`를 도입하면 이 열이 진척 지표가 된다
- 도구는 멱등이다(재실행 결과 동일). `problem_lines`·`guide_lines`는 69종 전부 `wc -l`과 교차검증했고 0줄 파일은 없다
- 진단 표 키 9개가 실제 디렉터리와 어긋나면 도구가 `-`로 새지 않고 exit 1로 멈춘다

### B1 — 처분 결정 3건 + 규약4 (완료)

- **읽을 것**: 이 문서, `docs/ORD-006-strategy.md:186-205`(규약4 에스컬레이션), `ORDER.md:39-63` 중 B급 2건
- **카드**: KAN-007(처분 결정 3건) → KAN-005(규약4). 순서를 지킨다 — 처분 결과가 규약4의 판정 사례가 된다
- **할 것**
  1. `probabilistic/concurrentSkipList` — 개명 / Rust 전용 / 삭제 중 택1. 단일 스레드 TS에서 lock-free 계약을 검증할 수 없다는 점이 판정의 축이다
  2. `linear/xorLinkedList` — Rust unsafe 포트 존치 vs "안전 언어에서 사라진 역사적 구조"로 처분
  3. `hash/multiset` — `hash/` → `tree/` 재분류 원칙(ADT 관점 vs 구현 관점)을 먼저 세우고 적용한다
  4. 위 셋의 판정 근거를 규약4 (가)/(나) 2등급 기준으로 일반화해 `docs/ORD-006-conventions.md` §규약4에 적는다
- **주의**: 이 세 건은 사용자 결정이 필요할 수 있다. 근거를 갖춰 `AskUserQuestion`으로 묻고, 답을 받기 전에 파일을 옮기거나 지우지 않는다
- **끝낼 때**: 결정 3건을 KAN-007 메모에 확정 기록 → `ORD-006-inventory.tsv`의 `escalation` 열을 해당 행에 채운다 → KAN-005 메모에 규약4 위치를 적는다

**2026-08-04 결과**

- **`docs/ORD-006-conventions.md` 신설.** 확정된 규약만 쌓는 문서다. **전략과 어긋나면 이 문서가 정본이다** — 전략의 규약 절은 착수 시점의 설계이므로 배치가 확정한 것과 충돌할 수 있다
- 사용자 결정 3건(근거는 conventions 처분 결정 절)
  - `probabilistic/concurrentSkipList` → **Rust 전용 존치**, (가) 등급. 현행이 `skipList`와 계약이 같았고(MAX_LEVEL 16·p=0.5·평균 O(log n)) 실제 차이는 동시성이 아니라 제네릭이었다
  - `linear/xorLinkedList` → **존치 + 성격 전환**, (나) 등급. 가이드 주제가 "XOR 트릭 연습"에서 "왜 현대 언어에서 성립하지 않는가"로 바뀐다. Rust 시연은 선택이며, 주소 XOR 은 Rust 엄격 프로버넌스에서 성립하지 않는다는 제약이 붙는다
  - `hash/multiset` → **`tree/`로 재분류**, (-) 등급. 이동 실행은 KAN-019(선행 KAN-015)
- **분류 원칙 확정** — 카테고리는 계약(ADT)으로 가른다. 구현으로 가르지 않는다. 구현이 자유로우면 구현으로 나눈 카테고리는 정해지지 않기 때문이다. 현행 10개는 계약 이름·구현 기법 이름·용도 이름이 섞여 있고, **전면 재편은 KAN-031 신설로 분리**했다(봉인 조건 29장→30장)
- **인벤토리 `escalation` 열**: `req` 1행 · `opt` 1행 · `-` 67행. 전략 표의 예상 목록은 미확정이라 넣지 않았다
- **결함 하나를 잡았다.** `escalation` 값을 `(가)`/`(나)`로 쓰면 `en_US.UTF-8` 로케일의 `awk`·`uniq`가 두 값을 **같은 문자열로 판정한다**(`awk '$6=="가"'`가 두 등급을 다 잡는다). 값을 `req`/`opt`로 바꾸고 도구에 전 열 비 ASCII 거부 가드(`assertAscii`)를 넣었다. 가드 동작은 한글 값을 주입해 exit 1을 확인했다
- **B2·B3 숙제**: `concurrency` 등급 이름은 전략 규약1(`:82`)에 이미 있다. 없는 것은 그 등급을 판정할 **축**이다 — 3축은 `__cost` 카운터 기반이라 선형화를 담지 못한다

### B2 — 규약1 계약 명세 규격 (다음)

- **읽을 것**: 이 문서, `docs/ORD-006-strategy.md:77-94`(규약1 초안), `docs/ORD-006-conventions.md`, `src/data-structures/linear/stack/stack-problem.md`(모범 문형 — 진단이 유일하게 칭찬한 구조)
- **카드**: KAN-002
- **할 것**
  1. `<name>.ts` 헤더 JSDoc 규격 확정 — 목적 · 불변식 · 연산 계약(worst/amortized/expected 명시) · 주입 정책 · 검증 등급 · 필요충분조건
  2. **검증 등급 4종을 확정**한다(`basic`/`invariant`/`complexity`/`concurrency`). 전략의 판정 규칙 한 문장(`:91`)을 그대로 쓸지 고칠지 여기서 정한다
  3. 시범 2종을 실제로 써 본다. **`linear/stack`(모범)과 `hash/multiset`(A급 최악)을 권한다** — 규격이 양극단에서 버티는지가 이 배치의 시험이다
  4. `docs/ORD-006-conventions.md`에 §규약1을 추가하고 상단 상태표를 갱신한다
- **경계**: 내부 표현·알고리즘을 처방하지 않는다(불변 사실 4). 규격이 처방을 유도하면 규격이 틀린 것이다
- **끝낼 때**: 검증 등급이 확정되면 `docs/ORD-006-inventory.tsv`의 `verification_grade` 열을 채우기 시작할 수 있다 — 다만 **69종 일괄 판정은 KAN-025의 일이고**, B2는 시범 2종만 채운다. 도구의 결정 맵에 박아 재생성해도 값이 유지되게 한다

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
| 69종 구조 목록·결함등급 | `docs/ORD-006-inventory.tsv` (재생성: `bun run tools/ord006-inventory.ts`) |
| **확정 규약**(전략보다 우선) | `docs/ORD-006-conventions.md` |
