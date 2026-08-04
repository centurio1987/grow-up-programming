# KANBAN — main

> hyper plan 보드. 앱 기능 백로그가 아니라 프로젝트 차원의 계획을 유저·AI가 공동 관리한다.
> 카드 메타(생성/최종/갱신)는 manage-kanban 스킬이 관리한다. 규칙은 스킬 SKILL.md를 따른다.

## 백로그
<!-- 아직 착수 결정 전. 우선순위 미정 후보 풀. 백로그→할 일 이동이 "할지 고민" → "하기로 확정" 전환점. -->
- `KAN-008` [P1·8] deque 재집필 — 배열/버퍼 계열 파일럿 — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 L·리스크 중. 두 배열 처방 제거, 링 버퍼를 대표 구현으로(단 '정답'으로 고정 금지). 축3에 큐·역큐 적대 패턴. _bench/로 실측 이관 — 수치뿐 아니라 재현 명령·입력·환경(bun 버전·머신)까지 고정. 현 실측: 큐 패턴 이동 2.95 vs 0.55, 지연 스파이크 7.7ms vs 0.015ms. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
- `KAN-009` [P1·9] intervalTree 재집필 — 트리 계열 파일럿 — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 L·리스크 상. 균형 없는 BST→증강 레드-블랙. 축3의 난제(균형성·높이 검증)를 여기서 규격화. 적대 입력=시작시간 정렬(스토리의 실제 접근 패턴). 현재 표는 전부 O(log n) 주장인데 회전·균형 언급 0건. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
- `KAN-010` xorLinkedList 재집필 — 성격 전환((나) 등급) — 생성:ai · 최종:ai · 갱신:2026-08-04
  - 메모: 공수 M·리스크 중. **KAN-007 결정 확정(2026-08-04): 존치하되 성격 전환.** 삭제하지 않는다. 규약4 **(나)** 등급(TSV escalation=opt) — 카드 제목의 구 표기 '(가) 등급 첫 사례'는 B1 에서 정정했다. **가이드 주제를 바꾼다** — 'XOR 트릭 연습'에서 '이 구조가 왜 현대 언어에서 성립하지 않는가'(GC · 메모리 모델 · 포인터 프로버넌스)로. 할 일 ① 계약에 '이 구현의 메모리 이득은 음수다'를 명시(Map 노드 ID 테이블이 아끼려던 포인터보다 크다 — B급 판정의 내용) ② 가이드를 실패한 최적화의 해부로 재구성. **Rust 시연은 (나) 등급이라 선택이다** — 붙이지 않아도 계약 위반이 아니므로 KAN-006(Rust crate)을 기다리지 않는다. 붙인다면 제약을 함께 써야 한다: 주소 두 개를 XOR 한 값에서 유효 포인터를 복원하는 것은 Rust 엄격 프로버넌스(strict provenance)에서 성립하지 않고, 노출 프로버넌스 API 를 거쳐야 하며 Miri 검증이 까다롭다. 'Rust 로 옮기면 정직해진다'가 참이 아니라는 것이 B1 조사의 결론이다. 근거: ORDER.md ORD-006 / docs/ORD-006-conventions.md 처분 결정
- `KAN-011` [P1·11] 파일럿 회고 — 규약 1~4에 반영 — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 S·리스크 하. 파일럿에서 드러난 규약 결함을 규약에 되돌려 고친다. **P0-b·P2 착수 전 필수 관문.** 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
- `KAN-012` [P0-b·12] CI 3모드 구성 — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 M·리스크 중. ①스위트 자기검증(_fixtures/broken/이 **축3에서** 실패해야 통과 — 컴파일 에러·예외와 계약 위반을 구분해 단언) ②정본 검증(_reference/ 녹색) ③실습 채점(스텁, CI 판정 제외·별도 리포팅). 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
- `KAN-013` [P0-b·13] 가이드↔코드 region 추출 파이프라인 + 일치 검사 — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 M·리스크 중. 가이드는 코드를 복제하지 않는다. `// #region guide:core` 마커로 _reference/에서 추출. 추출 순서·범위·import 제거 규칙 규격화 후 게이트에 편입. 이 정책이 없으면 가이드 코드가 다시 무검증으로 남는다. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
- `KAN-014` [P0-b·14] 게이트 확장 — 타입체크·MDX 빌드·신캔버스 호환 점검 — 생성:ai · 최종:ai · 갱신:2026-08-04
  - 메모: 공수 M·리스크 중. **게이트 소유권이 바뀌었다(rev4).** 루브릭 채점·외부 검토는 authoring-kit 의 authoring-gate + spec 의 gate.external_review 로 넘어갔고 review-guide.sh 는 이관 때 사라졌다 — 승계 대상이 아니다. 프로젝트가 계속 소유하는 것은 comprehension-gate.sh(이해 게이트)·check-mermaid.ts·compile-check.ts 셋. 여기에 tsc --noEmit·lint·코드 추출 일치를 추가한다. 기존 게이트가 '문제 풀이 가이드' 전제에 묶여 있는지, 8단계 캔버스를 이해하는지 먼저 점검. authoring.py status/lock 이 깨끗한 상태에서 집필됐는지도 게이트 항목. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
- `KAN-015` [P0-b·15] problem 참조 스윕 + 링크 무결성 도구 — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 S·리스크 하. 삭제 전 문서·스킬·인덱스·README 참조 검색. algorithms는 유지하고 data-structures만 제거하므로 경계 조건 주의. migration note까지만 — redirect 인프라는 만들지 않는다(외부 소비자 없음, git 히스토리 보존). 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
- `KAN-016` [P0-b·16] ds-guide 집필 경로 정합 + 회귀 골든 (guide-for-structure 신설 철회) — 생성:ai · 최종:ai · 갱신:2026-08-04
  - 메모: 공수 M·리스크 중. **guide-for-structure 신설은 철회한다(rev4).** guide-for-problem 이 이미 src/data-structures/** → ds-guide spec 으로 라우팅하므로, 자료구조 트랙을 가르는 축은 스킬이 아니라 spec 이다. 스킬을 더 만들면 authoring-kit 이관으로 한 벌로 합친 규칙이 다시 갈라진다(CLAUDE.md: '규칙을 스킬 문서에 다시 쓰지 않는다'). 할 일: ①guide-for-problem 라우팅 표의 ds-guide 행 '5단계'→'8단계' 정정 ②paths.json exemplars.ds-guide 가 구 5단계 bPlusTree-guide.mdx 를 가리키므로 파일럿 산출물로 교체(spec.md 가 '모범 예시 필독'으로 참조) ③problem spec 적용 범위를 algorithms/ 로 한정 명시 + gen-problem 의 data-structures 대상 폐기와 짝 ④샘플 입력→산출물→게이트 통과 회귀 fixture. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md 집필 엔진(rev4)
- `KAN-017` [P0-b·17] CLAUDE.md 자료구조 트랙 서술 추가 — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 S·리스크 하. 현행 '이 프로젝트는 코드 테스트 문제 풀이 목적 / 주석에 적힌 문제를 보고 함수를 선언'이 새 방향과 정면 충돌. 안 고치면 새 세션이 문제 풀이 프레임으로 회귀한다. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
- `KAN-018` [P0-b·18] 메모리 guide-quality-standard 갱신 — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 S·리스크 하. ORD-006 반영(캔버스 8단계·축3 성장률·에스컬레이션 2등급·검증 등급). 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
- `KAN-019` [P2·19] multiset 재집필 — 균형 BST 전환 — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 L·리스크 중. **A급 최악**: 스토리가 '배열 정렬은 O(K) 삽입'을 이기겠다며 O(log K)를 약속해놓고 인터페이스는 O(n) splice를 처방 — 이기겠다던 그 자료구조를 그대로 처방. 카드 7의 재분류 원칙 적용. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
- `KAN-020` [P2·20] unrolledLinkedList 재집필 — 양방향 연결 — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 M·리스크 하. 표는 pop() O(1) amortized인데 상세는 'head부터 순회 O(p)'. 에스컬레이션 (나) 판정 예상 — 점근 계약은 TS로 충족, 캐시 지역성만 Rust 실측. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
- `KAN-021` [P3·21] suffixArray·suffixTree 구성 복잡도 정합 — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 M·리스크 중. naive O(n² log n)/O(n²)를 명시는 했으나 스토리가 30억 염기 BLAST. naive 유지 시 스토리 스케일 조정, 또는 O(n log n)/Ukkonen 승격 중 택1. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
- `KAN-022` [P3·22] queue 재집필 — 두 스택 권유 제거 — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 S·리스크 하. 문제 상세 :51의 '두 개의 스택으로 구현하는 방식도 유효하다'가 deque와 같은 권유. 링 버퍼 미언급. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
- `KAN-023` [P3·23] ternarySearchTree 근거 정정 — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 S·리스크 하. 스토리 :10이 '일반 Trie는 노드마다 26개 포인터 낭비'를 근거로 드나 이 리포의 trie는 Map<string,TrieNode> 희소 구조라 전제 불성립. 교차 불일치. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
- `KAN-024` [P3·24] concurrentSkipList 처분 실행 — 생성:ai · 최종:ai · 갱신:2026-08-04
  - 메모: 공수 L·리스크 상(B1 에서 M·중 → L·상 상향). **KAN-007 결정 확정(2026-08-04): Rust 전용으로 존치.** 개명도 삭제도 아니다 — 이름을 지키고 실체를 Rust 로 채운다. 규약4 (가) 등급(TSV escalation=req). 근거: 현행은 probabilistic/skipList 와 계약이 같고(MAX_LEVEL 16·p=0.5·평균 O(log n)), 실제 차이는 동시성이 아니라 제네릭이었다. 이름을 정당화하려면 계약에 **선형화(linearizability)와 진행 보장(lock-freedom)** 이 들어와야 한다. 할 일 ① 계약 명세에 선형화·진행 보장 명시 ② Rust lock-free 구현(CAS·마킹 삭제) ③ 동시성 검증. **선행 둘** — KAN-006(Rust crate 구조), 그리고 KAN-003(규약2)이 **동시성 축을 정의해야 한다**. 3축 스위트는 __cost 누적 카운터 기반이라 동시성을 담지 못한다. 이 구조 하나 때문에 CI 에 축이 하나 는다는 것이 존치의 확정된 비용이다. skipList 의 제네릭 승격 여부는 이 카드에 딸린 문제가 아니다(KAN-025). 근거: ORDER.md ORD-006 / docs/ORD-006-conventions.md 처분 결정
- `KAN-025` [P4·25] P4 분류 확정 — 60종을 3군에 배정 — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 M·리스크 중. 카테고리가 아니라 난이도 기준(검증 등급·에스컬레이션 필요성·가이드 수정량)으로 분류하고 군별 공수 추정. **'결함 없음 60종'은 작업 없음이 아니다** — problem 삭제·명세·검증 등급·캔버스 8단계·코드 추출이 전원 붙는다. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
- `KAN-026` [P4·26] P4-A군 — basic/invariant 등급(축3 불필요) — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 L·리스크 하. 카드 25 분류 결과에 따름. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
- `KAN-027` [P4·27] P4-B군 — complexity 등급(축3 필요, 에스컬레이션 불필요) — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 L·리스크 중. 카드 25 분류 결과에 따름. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
- `KAN-028` [P4·28] P4-C군 — 에스컬레이션 (나) 후보(Rust 실측 동반) — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 L·리스크 중. 카드 25 분류 결과에 따름. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
- `KAN-031` 카테고리 전면 재편 — 계약(ADT) 기준으로 10개 분류 재정의 — 생성:ai · 최종:ai · 갱신:2026-08-04
  - 메모: 공수 L·리스크 상. **B1 분류 원칙 확정에서 파생(2026-08-04).** 원칙은 docs/ORD-006-conventions.md 분류 원칙 절에 확정돼 있다 — 카테고리는 계약(ADT)으로 가르고 구현으로 가르지 않는다. 근거는 ORD-006 의 핵심 결정('명세에 내부 표현을 처방하지 않는다')과 구현 기준 분류가 양립 불가라는 것이다. 구현이 자유로우면 구현으로 나눈 카테고리는 정해지지 않는다. **현행 10개 카테고리는 세 종류가 섞여 있다** — 계약 이름(disjoint-set·heap·linear) · 구현 기법 이름(hash·tree·trie) · 용도 이름(range-query·spatial·graph-repr·probabilistic). 할 일 ① 계약 축으로 카테고리 집합을 재정의 ② 69종을 재배정 ③ 경로 변경에 딸린 참조 스윕(문제_가이드_목록.md · tools/ord004-manifest.json · 가이드 인덱스 · TSV 재생성). **선행: KAN-015(참조 스윕 도구) 필수** — 도구 없이 옮기면 링크가 조용히 깨진다. KAN-025(P4 분류) 이후가 자연스럽다. B1 에서는 명백한 오분류 한 건(hash/multiset → tree/)만 교정하기로 했고, tree/ 가 구현 이름이라는 모순은 이 카드가 닫힐 때까지 남는다. **주의: 이 카드 신설로 KAN-001 봉인 조건이 29장→30장으로 늘어난다.** 근거: docs/ORD-006-conventions.md 분류 원칙
  - 원문:
    ```text
    1.a, 2.c, 3.a
    ```

## 할 일
- `KAN-001` [P0-a·1] ORD-006 봉인 — 지시 원문·진단 9건 표 이관 — 생성:ai · 최종:ai · 갱신:2026-08-04
  - 메모: 공수 S·리스크 하. ORDER.md 신규 지시에 원문+진단표 기재, docs/ORD-006-strategy.md에 전략 전문 보존. 전 카드 완료 시 COMMITTED로 봉인. **이관분 완료 확인(2026-08-04)** — ORDER.md:13-24 원문 verbatim, :39-63 진단 9건 표, docs/ORD-006-strategy.md 전문이 모두 존재한다. **잔여 작업 = 봉인뿐.** 선행조건은 KAN-002~030 전 카드 완료. 실행 계획(배치 B0~최종)은 ~/.claude/plans/kan-001-jazzy-charm.md. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
  - 원문:
    ```text
    자료구조 본래의 목적과 장점을 호도하는 문제와 가이드는 필요 없다. 지금 자료구조 싹 다 진단해
    
    - 문제는 제거한다.
    - 테스트는 자료구조가 제대로 작동하며, 불변식을 지키고, 해당 자료구조로써 필요충분조건을 충족했는지 파악한다.
    - 가이드는 문제가 아니라, 자료구조 자체에 집중한다. 목적, 목적을 충족할 수 있는 최적화된 형태의 구현을 작성하기 위한 과정이 포함되어야 한다. typescript에서 최적화 할 수 없다면 최적화 불가능한 이유를 서술하고, 차선책을 제시한다. 그리고 최적화 가능한 언어를 채택해서 해당 언어로 최적화 과정을 보인다. 최적화를 위해 채택할 언어의 우선순위는 typescript, rust, python 순이다.
    - 위 요구사항을 준수하여 자료 구조 재집필 전략을 세우고, 칸반 태스크를 정의해라. 칸반 카드 정의 과정에서 지시 사항이 소실되거나 무시 되지 않고, 새로운 세션에서 태스크를 수행할 때 지금 세운 전략이 완벽히 핸드오프 가능해야 한다.
    ```
- `KAN-002` [P0-a·2] 규약1 — 자료구조 명세 규격(.ts 헤더 JSDoc) — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 M·리스크 중. 목적/불변식/연산 계약(worst·amortized·expected 구분)/주입 정책/검증 등급/필요충분조건. **내부 표현·알고리즘 처방 금지**(A급 결함 4건의 직접 원인). 검증 등급 판정 규칙 1문장 고정. _reference/ 정합 검사 스크립트. linear/stack 문형이 모범. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
  - 원문:
    ```text
    문제는 제거한다.
    ```
- `KAN-003` [P0-a·3] 규약2 — 계약 스위트 규격(축1~3·성장률 판정) — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 L·리스크 상. runContract(factory,opts). 축1 동작(언어 중립 JSON vector는 이 축 전용)/축2 불변식/축3 복잡도. 축3은 절대 카운트 금지, 구현이 __cost만 노출하고 성장비율 r=C(4n)/C(n)로 판정. n∈{2^10,2^12,2^14}, 허용치 ±30%, worst=단일 최대·amortized=시퀀스 평균·expected=seed 5개 중앙값, 균형 구조는 높이 직접 검사. 적대적 입력 필수. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
  - 원문:
    ```text
    테스트는 자료구조가 제대로 작동하며, 불변식을 지키고, 해당 자료구조로써 필요충분조건을 충족했는지 파악한다.
    ```
- `KAN-004` [P0-a·4] 규약3 — 가이드 캔버스 8단계 개정 — 생성:ai · 최종:ai · 갱신:2026-08-04
  - 메모: 공수 M·리스크 중. 개요/이 구조가 필요한 이유/단순한 구현의 한계/불변식과 연산별 복잡도 조건/구현(TS)/TS의 한계와 대체 언어(조건부)/단계별 동작 확인/스스로 점검하기. **고칠 곳은 세 곳 + lock** — .claude/authoring/specs/ds-guide/spec.json(sections[] 골격 정본)·spec.md(항목별 작성법)·.claude/skills/guide-for-problem/data-structure-guide-canvas.md(템플릿), 그리고 authoring.py lock 재생성. 캔버스만 고치면 집필기가 spec 을 읽으므로 반영되지 않는다. **현행 ds-guide spec 은 문제 종속이 required/MUST 로 박혀 있다** — when.clue 절과 원칙 B2('문제에서 어떤 단서가 보일 때')를 '이 구조가 필요한 이유'로 대체, detail.spec 은 4단계로 흡수. E7·E8(복잡도가 무엇을 센 값인지·최악/기대/상환 구분)은 축3과 같은 요구라 승계. 절 제목은 제목만 읽고 내용을 알 수 있어야 한다 — ORD-005 '왜 이 모양이어야 하는가'가 미달해 교체. 과장·구어 표현 금지. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md 규약3(rev4)
  - 원문:
    ```text
    가이드는 문제가 아니라, 자료구조 자체에 집중한다. 목적, 목적을 충족할 수 있는 최적화된 형태의 구현을 작성하기 위한 과정이 포함되어야 한다.
    
    왜 이 모양이어야 하는가는 무슨 말이냐. 사람이 알아들을 수 있는 말로 작성해 외계어 말고
    
    무너지긴 뭐가 무너져. 오버좀 하지 마라. 정상적인 표현으로 적어. 연산이 싸긴 뭐가 싸. 장사하냐
    ```
- `KAN-006` [P0-a·6] Rust 최소 crate 구조 확정 — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 M·리스크 중. 워크스페이스 경계, JSON vector 공유 위치(rust/vectors/), TS↔Rust API 대응 규칙. (가) 판정 구조만 점진 추가 — 처음부터 69종 crate 만들지 않는다. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md

## 진행 중

## 검토

## 완료
- `KAN-029` [P0-a·29] 집필 엔진 가용성 확보 — 플러그인 설치·활성화 + lock 버전 재고정 — 생성:ai · 최종:ai · 갱신:2026-08-04
  - 메모: 공수 S·리스크 중. **rev4 신설. P1 파일럿 착수 전 필수 관문.** guide-for-problem·gen-problem 둘 다 0단계에서 authoring.py status 를 돌리고 없으면 거기서 멈춘다(구 경로 폴백 없음). **2026-08-04 1차 처리:** 플러그인 project 스코프 설치(0.3.0, 스킬 6종) + lock 0.2.0→0.3.0 재고정. **2026-08-04 재점검(B0):** lock 이 다시 stale 이라 재고정했다 — principles f4e11e6(D5 지어낸 은유 동사 금지·F5 가짜 질문 부정 도입 금지 신설). spec·voice·QUALITY_RUBRIC 해시는 불변 = ds-guide spec 3종 무효화 없음. **2026-08-04 종결(B0'):** CLI 재시작 후 스킬 목록에 authoring-kit:* 5종(authoring-doctor·gate·spec·voice·write)이 적재 확인됐다. 6번째 authoring-method 는 SKILL.md 에 disable-model-invocation: true 로 선언된 **내부 스킬**이라 모델 목록에 뜨지 않는 것이 정상이다(워커가 authoring-write 경유로 호출). 누락이 아니다. 집필 진입점 Skill(authoring-kit:authoring-write) 가용 → KAN-008~010 파일럿의 집필 단계 차단이 풀렸다. 근거: docs/ORD-006-strategy.md 집필 엔진(rev4)
  - 원문:
    ```text
    집필 엔진은 개선했다. kan-001 계획에 새로운 집필 엔진을 사용하는 것이 고려 됐는지 확인하고 안 되어 있으면 반영해라. 계획에서 고려하지 않아도, 자연스럽게 작용하는 것이면 그냥 둬도 된다.
    ```
- `KAN-030` [P0-a·30] ORD-006 배치 인프라 — 런북 + 구조 인벤토리 — 생성:ai · 최종:ai · 갱신:2026-08-04
  - 메모: 공수 S·리스크 하. 실행 계획(~/.claude/plans/kan-001-jazzy-charm.md) §2-3 파생. **목적은 세션 진입 비용 절감** — 현행 핸드오프는 ORDER.md(21KB)+KANBAN.md(18KB)+strategy.md(27KB) 통독을 요구했다. **2026-08-04 완료.** ① docs/ORD-006-runbook.md — 불변 사실 15항 + 배치 규약 + 배치 지도 + 배치별 진입 카드. 완성형으로 쓰지 않고 배치 종료마다 한 칸씩 채운다(현재 B0·B0 프라임 결과 기재, B1 진입 카드 신설) ② docs/ORD-006-inventory.tsv **69행** + tools/ord006-inventory.ts. 헤더는 ASCII 9열(path·category·name·defect_grade·verification_grade·escalation·problem_lines·guide_lines·has_reference) — 하위 도구가 cut -f1 로 path 를 뽑기 때문. **검증: 양방향 diff 일치**(find 결과 69 vs TSV path 69, diff 무출력), path 중복 0, 전 행 9열, 재실행 동일(멱등), problem_lines·guide_lines 는 69종 전부 wc -l 과 교차검증. 결함등급 분포 A 4·B 2·C 3·미분류 60 — ORDER.md:39-63 진단 표 9종만 채우고 추정하지 않았다. trie/ternarySearchTree 는 표 본문이 아니라 각주(:63)라 미분류이며 KAN-023 이 따로 들고 있다. has_reference 는 전 행 false(_reference/ 미도입, 현재는 _deprecated/ 69종·_scratch/ 50종만 존재). 진단 표 키가 실제 디렉터리와 어긋나면 도구가 exit 1 로 멈춘다. KAN-025(P4 분류)가 이 TSV 를 입력으로 써서 60종을 다시 읽지 않는다. **주의: 이 카드 신설로 KAN-001 봉인 조건이 28장→29장으로 늘어났다.** 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
  - 원문:
    ```text
    kan-001에 대한 실행 계획을 세워라. 토큰을 고려해서 배치 전략을 반영해서 전략 수립해라.
    ```
- `KAN-007` [P0-a·7] 처분 결정 3건 — concurrentSkipList·xorLinkedList·multiset — 생성:ai · 최종:ai · 갱신:2026-08-04
  - 메모: 공수 M·리스크 중. **2026-08-04 확정(B1).** 근거 전문은 docs/ORD-006-conventions.md 처분 결정 절. ① **concurrentSkipList = Rust 전용 존치**((가) 등급). 현행은 probabilistic/skipList 와 계약이 같다 — 둘 다 MAX_LEVEL 16·p=0.5·평균 O(log n) 이고, 실제 차이는 동시성이 아니라 제네릭(T + comparator + min/max/size)이었다. 이름을 정당화하려면 계약에 선형화·진행 보장이 들어와야 하는데 단일 스레드 TS 는 그것을 표현도 검증도 못 한다 → 실행은 KAN-024, 선행 KAN-006 ② **xorLinkedList = 존치하되 성격 전환**((나) 등급). 삭제하지 않고 가이드 주제를 'XOR 트릭 연습'에서 '이 구조가 왜 현대 언어에서 성립하지 않는가'(GC·메모리 모델·포인터 프로버넌스)로 바꾼다. Map 노드 테이블이 아끼려던 포인터보다 커서 메모리 이득이 음수라는 사실을 계약에 명시한다. Rust 포트는 선택이며, 주소 XOR 로 유효 포인터를 복원하는 것이 Rust 엄격 프로버넌스에서 성립하지 않는다는 제약을 함께 서술해야 한다 → 실행은 KAN-010 ③ **multiset = tree/ 로 재분류**((-) 등급). hash/ 는 순서를 약속하지 않는 계열인데 multiset 의 계약은 정렬 순서 유지다. 분류 원칙을 '카테고리는 계약(ADT)으로 가른다, 구현으로 가르지 않는다'로 확정했고, 전면 재편은 KAN-031 로 분리했다. 디렉터리 이동은 참조 스윕 도구(KAN-015) 없이 하면 링크가 조용히 깨지므로 KAN-019 에서 실행한다. **부수 발견:** tree/orderStatisticTree 의 계약이 multiset 을 포섭한다(count=rank 차, min=kth(1), max=kth(size)) — 합칠지는 KAN-019 판단. 근거: ORDER.md ORD-006 / docs/ORD-006-conventions.md
- `KAN-005` [P0-a·5] 규약4 — 언어 에스컬레이션 (가)/(나) 2등급 기준 — 생성:ai · 최종:ai · 갱신:2026-08-04
  - 메모: 공수 S·리스크 하. **2026-08-04 완료(B1).** 산출: docs/ORD-006-conventions.md 규약4 절. (가) TS 로 명세 계약 자체를 만족 불가 → Rust 필수(포인터 산술·원자적 연산·정수 폭 제어). (나) 점근 계약은 TS 로 되나 실측 근거를 TS 에서 못 보임 → Rust 선택(캐시 레이아웃·GC 없는 결정적 지연). (-) 계약도 근거도 TS 안에서 닫힌다(기본값). **판정 절차 4단계를 명문화했다** — 계약 확정 → TS 로 표현 가능한가((가) 판정) → 뒷받침 수치를 TS 에서 낼 수 있는가((나) 판정) → 가이드에 판정과 근거 한 줄. **(나)는 Rust 를 강제하지 않는다** — 산출물 없이 실측 불가 사유만 서술해도 계약 위반이 아니다. 강제는 (가)뿐. 확정 판정 3건은 KAN-007 참조(concurrentSkipList=(가)/req, xorLinkedList=(나)/opt, multiset=(-)). 전략 표의 예상 목록(rollingHash·bitArray·unrolledLinkedList·bPlusTree)은 **미확정이라 인벤토리에 넣지 않았다** — 결함등급과 같은 규칙으로 추정하지 않는다. Python 은 정의만 두고 산출물 요구 보류. 근거: ORDER.md ORD-006 / docs/ORD-006-conventions.md
  - 원문:
    ```text
    typescript에서 최적화 할 수 없다면 최적화 불가능한 이유를 서술하고, 차선책을 제시한다. 그리고 최적화 가능한 언어를 채택해서 해당 언어로 최적화 과정을 보인다. 최적화를 위해 채택할 언어의 우선순위는 typescript, rust, python 순이다.
    ```
