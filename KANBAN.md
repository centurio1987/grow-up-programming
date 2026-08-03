# KANBAN — main

> hyper plan 보드. 앱 기능 백로그가 아니라 프로젝트 차원의 계획을 유저·AI가 공동 관리한다.
> 카드 메타(생성/최종/갱신)는 manage-kanban 스킬이 관리한다. 규칙은 스킬 SKILL.md를 따른다.

## 백로그
<!-- 아직 착수 결정 전. 우선순위 미정 후보 풀. 백로그→할 일 이동이 "할지 고민" → "하기로 확정" 전환점. -->
- `KAN-008` [P1·8] deque 재집필 — 배열/버퍼 계열 파일럿 — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 L·리스크 중. 두 배열 처방 제거, 링 버퍼를 대표 구현으로(단 '정답'으로 고정 금지). 축3에 큐·역큐 적대 패턴. _bench/로 실측 이관 — 수치뿐 아니라 재현 명령·입력·환경(bun 버전·머신)까지 고정. 현 실측: 큐 패턴 이동 2.95 vs 0.55, 지연 스파이크 7.7ms vs 0.015ms. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
- `KAN-009` [P1·9] intervalTree 재집필 — 트리 계열 파일럿 — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 L·리스크 상. 균형 없는 BST→증강 레드-블랙. 축3의 난제(균형성·높이 검증)를 여기서 규격화. 적대 입력=시작시간 정렬(스토리의 실제 접근 패턴). 현재 표는 전부 O(log n) 주장인데 회전·균형 언급 0건. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
- `KAN-010` [P1·10] xorLinkedList 재집필 — (가) 등급 첫 사례 — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 M·리스크 중. 카드 7에서 '역사적 처분'이 나오면 이 카드는 처분 작업으로 축소. 존치 시: Map 노드 테이블이 절약분보다 커서 **메모리 이득이 마이너스**라는 사실을 명시하고 Rust 포트로 실제 포인터 XOR 시연. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
- `KAN-011` [P1·11] 파일럿 회고 — 규약 1~4에 반영 — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 S·리스크 하. 파일럿에서 드러난 규약 결함을 규약에 되돌려 고친다. **P0-b·P2 착수 전 필수 관문.** 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
- `KAN-012` [P0-b·12] CI 3모드 구성 — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 M·리스크 중. ①스위트 자기검증(_fixtures/broken/이 **축3에서** 실패해야 통과 — 컴파일 에러·예외와 계약 위반을 구분해 단언) ②정본 검증(_reference/ 녹색) ③실습 채점(스텁, CI 판정 제외·별도 리포팅). 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
- `KAN-013` [P0-b·13] 가이드↔코드 region 추출 파이프라인 + 일치 검사 — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 M·리스크 중. 가이드는 코드를 복제하지 않는다. `// #region guide:core` 마커로 _reference/에서 추출. 추출 순서·범위·import 제거 규칙 규격화 후 게이트에 편입. 이 정책이 없으면 가이드 코드가 다시 무검증으로 남는다. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
- `KAN-014` [P0-b·14] 게이트 확장 — 타입체크·MDX 빌드·신캔버스 호환 점검 — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 M·리스크 중. 기존 3종(comprehension-gate.sh·review-guide.sh·check-mermaid.ts) 승계 + tsc --noEmit·lint·MDX 빌드 추가. 기존 게이트가 '문제 풀이 가이드' 전제에 묶여 있는지, 8단계 캔버스를 이해하는지 먼저 점검. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
- `KAN-015` [P0-b·15] problem 참조 스윕 + 링크 무결성 도구 — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 S·리스크 하. 삭제 전 문서·스킬·인덱스·README 참조 검색. algorithms는 유지하고 data-structures만 제거하므로 경계 조건 주의. migration note까지만 — redirect 인프라는 만들지 않는다(외부 소비자 없음, git 히스토리 보존). 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
- `KAN-016` [P0-b·16] guide-for-structure 스킬 신설 + 회귀 fixture — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 L·리스크 중. guide-for-problem은 algorithms 전용으로 축소, 자산 공유. 샘플 입력→산출물→게이트 통과까지 확인하는 fixture 필수 — 없으면 스킬 변경이 또 무검증 생성기를 만든다. gen-problem은 data-structures 대상 폐기 명시. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
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
- `KAN-024` [P3·24] concurrentSkipList 처분 실행 — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 M·리스크 중. 카드 7 결정 이행. 존치 시 concurrency 등급(선형화·동시성 스트레스) 필요. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
- `KAN-025` [P4·25] P4 분류 확정 — 60종을 3군에 배정 — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 M·리스크 중. 카테고리가 아니라 난이도 기준(검증 등급·에스컬레이션 필요성·가이드 수정량)으로 분류하고 군별 공수 추정. **'결함 없음 60종'은 작업 없음이 아니다** — problem 삭제·명세·검증 등급·캔버스 8단계·코드 추출이 전원 붙는다. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
- `KAN-026` [P4·26] P4-A군 — basic/invariant 등급(축3 불필요) — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 L·리스크 하. 카드 25 분류 결과에 따름. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
- `KAN-027` [P4·27] P4-B군 — complexity 등급(축3 필요, 에스컬레이션 불필요) — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 L·리스크 중. 카드 25 분류 결과에 따름. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
- `KAN-028` [P4·28] P4-C군 — 에스컬레이션 (나) 후보(Rust 실측 동반) — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 L·리스크 중. 카드 25 분류 결과에 따름. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md

## 할 일
- `KAN-001` [P0-a·1] ORD-006 봉인 — 지시 원문·진단 9건 표 이관 — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 S·리스크 하. ORDER.md 신규 지시에 원문+진단표 기재, docs/ORD-006-strategy.md에 전략 전문 보존. 전 카드 완료 시 COMMITTED로 봉인. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
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
- `KAN-004` [P0-a·4] 규약3 — 가이드 캔버스 8단계 개정 — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 M·리스크 하. 개요/이 구조가 필요한 이유/단순한 구현의 한계/불변식과 연산별 복잡도 조건/구현(TS)/TS의 한계와 대체 언어(조건부)/단계별 동작 확인/스스로 점검하기. **절 제목은 제목만 읽고 내용을 알 수 있어야 한다** — ORD-005 '왜 이 모양이어야 하는가'가 이 기준에 미달해 교체. 과장·구어 표현 금지. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
  - 원문:
    ```text
    가이드는 문제가 아니라, 자료구조 자체에 집중한다. 목적, 목적을 충족할 수 있는 최적화된 형태의 구현을 작성하기 위한 과정이 포함되어야 한다.
    
    왜 이 모양이어야 하는가는 무슨 말이냐. 사람이 알아들을 수 있는 말로 작성해 외계어 말고
    
    무너지긴 뭐가 무너져. 오버좀 하지 마라. 정상적인 표현으로 적어. 연산이 싸긴 뭐가 싸. 장사하냐
    ```
- `KAN-005` [P0-a·5] 규약4 — 언어 에스컬레이션 (가)/(나) 2등급 기준 — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 S·리스크 하. (가) TS로 계약 충족 불가→Rust 필수(포인터 산술·원자적 연산·정수 폭 제어). (나) 점근 계약은 TS로 되나 실측 불가→Rust 선택(캐시 레이아웃·결정적 지연). 구조마다 판정+근거 1줄 기록. Python은 정의만 두고 산출물 요구 보류. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
  - 원문:
    ```text
    typescript에서 최적화 할 수 없다면 최적화 불가능한 이유를 서술하고, 차선책을 제시한다. 그리고 최적화 가능한 언어를 채택해서 해당 언어로 최적화 과정을 보인다. 최적화를 위해 채택할 언어의 우선순위는 typescript, rust, python 순이다.
    ```
- `KAN-006` [P0-a·6] Rust 최소 crate 구조 확정 — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 M·리스크 중. 워크스페이스 경계, JSON vector 공유 위치(rust/vectors/), TS↔Rust API 대응 규칙. (가) 판정 구조만 점진 추가 — 처음부터 69종 crate 만들지 않는다. 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md
- `KAN-007` [P0-a·7] 처분 결정 3건 — concurrentSkipList·xorLinkedList·multiset — 생성:ai · 최종:ai · 갱신:2026-08-02
  - 메모: 공수 M·리스크 중. concurrentSkipList: 개명/Rust 전용/삭제 중 택1 + 판정 기준(단일 스레드 TS에서 lock-free 계약 검증 불가). xorLinkedList: Rust unsafe 포트 vs '안전 언어에서 사라진 역사적 구조'로 처분. multiset: hash/→tree/ 재분류 원칙(ADT 관점 vs 구현 관점). **결과가 P1 파일럿 구성과 규약4에 영향하므로 P1 착수 전 필수.** 근거: ORDER.md ORD-006 / docs/ORD-006-strategy.md

## 진행 중

## 검토

## 완료
