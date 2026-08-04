# 자료구조 트랙 재집필 전략 (ORD-006)

> **ORD-006 전략 전문.** 지시 원문과 진단 결과는 `ORDER.md`의 ORD-006 항목에, 작업 단위는 `KANBAN.md`에 있다.
> 승인 2026-08-02 · rev3(외부 검토 2회 반영) · rev4 2026-08-04(집필 엔진 `authoring-kit` 이관 반영)
> · 새 세션은 이 문서 → `ORDER.md` → `KANBAN.md` 순으로 읽는다.

## Context

`src/data-structures/` 69종을 전수 진단한 결과, **문제 파일이 처방한 구현이 그 자료구조가 스스로 내건 목적·복잡도를 배신하는** 결함이 9건 확인됐다. 근본 원인은 구조적이다 — 이 트랙의 산출물이 "자료구조"가 아니라 "문제"를 중심으로 조직돼 있어서, 문제 파일이 내부 표현까지 처방했고 가이드가 그것을 그대로 받았다. 그 결과 학습자는 표준 라이브러리가 아무도 쓰지 않는 구현을 정답으로 배운다.

검증 가능한 절차가 없다는 것이 이를 방치했다. 테스트는 동작만 확인하고 **복잡도 계약을 확인하지 않아서**, A급 결함 4건이 전부 테스트를 통과한다.

목표: 문제 종속을 걷어내고, 자료구조 자체(목적 → 불변식 → 계약을 만족하는 대표 구현에 이르는 유도)를 중심으로 재편하며, **계약 위반이 CI에서 실패하도록** 만든다.

## 확정 사항 (사용자 결정)

| 항목 | 결정 |
|---|---|
| `<name>-problem.md` | **제거** |
| `<name>.ts` | **실습 스텁 유지** (`Not implemented`) |
| Rust/Python 산출물 | **빌드·테스트되는 실제 파일** (`cargo test`) |
| 적용 범위 | **`data-structures/` 69종만**. `algorithms/` 107종은 현행 유지 |
| 언어 우선순위 | TypeScript → Rust → Python. **Python은 규약에 정의만 두고 산출물 요구는 실제 사례 발생 시까지 보류** |

## 진단 결과 (유실 금지 — 카드 1에서 ORD-006으로 이관)

### A급 — 자기모순 (표/스토리와 처방이 직접 충돌)

| 구조 | 내건 것 | 처방한 것 | 정본 |
|---|---|---|---|
| `hash/multiset` | 스토리 `:8-10` "배열 정렬은 O(K) 삽입" → "multiset이면 모두 O(log K)" | 인터페이스 `:19` `add // O(log n) 탐색 + **O(n) 삽입**` (정렬배열+`splice`) | 균형 BST. 리포에 `avlTree`·`redBlackTree`·`treap`·`orderStatisticTree` 이미 있음. `hash/` 분류도 오분류 |
| `range-query/intervalTree` | 요약 `:4`, 표 `:18-27` 전부 O(log n) | maxHigh 증강만. **회전·균형 언급 0건** → 스토리의 예약이 시작시간 순 = 정렬 입력 = 사슬 = O(n) | 증강 레드-블랙 (CLRS 14장) |
| `linear/unrolledLinkedList` | 표 `:32` `pop()` O(1) amortized | 상세 `:59` "head부터 순회 — O(p) 탐색 필요" | 양방향 연결 |
| `linear/deque` | 표 전체 amortized O(1) (성립은 함) | `:51-57` 두 배열 구현 처방 | 링 버퍼. 실측: 큐 패턴 이동 2.95 vs 0.55, 지연 스파이크 7.7ms vs 0.015ms |

### B급 — 존재 이유 상실 (그 사실을 안 적음)

| 구조 | 문제 |
|---|---|
| `linear/xorLinkedList` | 스토리 `:8` "메모리 수 KB라 prev/next를 못 쓴다" → `:14` **Map 노드 테이블**로 시뮬레이션. Map이 절약분보다 큼. 메모리 이득이 0이 아니라 **마이너스**라는 서술이 없음 |
| `probabilistic/concurrentSkipList` | `concurrent`의 실체(lock-free/CAS/마킹 삭제)가 전무. `:12`에서 단일 스레드라고 공시하지만 그러면 `probabilistic/skipList`와 동일 구조 |

### C급 — 공시는 했으나 스케일 불일치

| 구조 | 문제 |
|---|---|
| `trie/suffixArray` | `:18`·`:30` naive O(n² log n) 명시. 스토리는 30억 염기 BLAST |
| `trie/suffixTree` | 동일. 단 `:52-55`에 Ukkonen O(n) 병기 → 상대적으로 정직 |
| `linear/queue` | `:51` "두 개의 스택으로 구현하는 방식도 유효하다" (deque와 같은 권유). 링 버퍼 미언급 |

각주: `trie/ternarySearchTree` 스토리 `:10`은 "일반 Trie는 노드마다 26개 포인터 낭비"를 근거로 드나, 이 리포의 `trie`는 `Map<string, TrieNode>` 희소 구조라 전제가 성립하지 않는다.

**결함 없음 60종 — 단 전원 규약 적용 대상.** 결함이 없다는 것이지 작업이 없다는 뜻이 아니다(problem 삭제·명세·검증 등급·캔버스 8단계·코드 추출이 모두 붙는다). `linear/stack`은 *"내부 저장소는 자유롭게 선택할 수 있지만"* 으로 구현을 안 묶어서 **모범 사례**.

---

## 산출물 배치

**"최적 구현"이라는 말은 쓰지 않는다** — 자료구조는 사용 조건에 따라 최적이 달라지므로(값 범위가 좁으면 multiset은 counting array가 낫다), 목표는 **"명세한 계약을 만족하는 대표 구현"** 이다. 링 버퍼를 새로운 정답으로 고정하면 deque에서 저지른 것과 같은 처방을 방향만 바꿔 반복하게 된다.

```
<structure>/
  <name>.ts                        실습 스텁 — 헤더 JSDoc = 규약1 명세
  <name>.contract.ts               계약 스위트. runContract(factory, opts)
  <name>.test.ts                   스텁 대상 (exercise 모드)
  _reference/<name>.reference.ts   계약을 만족하는 대표 구현 ← 가이드 코드의 유일한 출처
  _reference/<name>.reference.test.ts
  _fixtures/broken/*.ts            의도적 결함 구현 (스위트 자기검증용)
  _bench/                          문서용 벤치. 벽시계 허용, CI 제외
  <name>-guide.mdx                 코드블록은 _reference/에서 region 추출
rust/                              워크스페이스 루트. (가) 판정 구조만 crate 추가
  vectors/                         언어 중립 JSON test vector (축1 전용)
```

**가이드는 코드를 복제하지 않는다.** `// #region guide:core` 마커로 구간을 표시하고 그 구간만 추출한다. 추출 순서·범위·import 제거 규칙을 규격으로 고정하고, 일치 검사를 게이트에 넣는다. 이 정책이 없으면 가이드 코드가 다시 무검증으로 남아 이번에 진단한 결함과 같은 구조가 재생산된다.

## 규약 1 — 자료구조 명세 (문제 파일을 대체)

위치: `<name>.ts` 헤더 JSDoc. 담는 것은 **계약뿐**이다.

- **목적** — 어떤 연산 집합을 어떤 비용에 제공하려는 구조인가 (스토리·시나리오 금지)
- **불변식** — 이 구조를 구조이게 하는 구조적 성질
- **연산 계약** — 시그니처 + 의미 + 복잡도 상한 + **worst / amortized / expected 중 어느 것인지 명시**
- **주입 정책** — comparator·equality·hash 주입 여부, generic 지원 범위, 에러 처리(던지는가 `undefined`인가). 트리·힙·해시에서는 **이것이 계약의 일부다**
- **검증 등급**(`contract profile`) — 이 구조를 어느 수준까지 검증할지. `basic` / `invariant` / `complexity` / `concurrency` 넷 중 하나
- **필요충분조건** — 이 계약을 못 지키면 그것은 무엇이 되는가 (예: "O(log n) 삽입을 못 지키면 multiset이 아니라 정렬 배열이다")

**금지: 내부 표현·알고리즘 처방.** 이것이 A급 결함 4건의 직접 원인이다. `linear/stack`의 문형을 표준으로 삼는다.

**검증 등급 판정 규칙** — 주관을 없애기 위해 한 문장으로 고정한다.

> 명세의 복잡도 상한이 **자명한 구현**(배열 끝 조작, 직접 인덱싱 등)으로 달성되면 `basic`/`invariant`. 상한 달성에 **비자명한 설계**(균형·상각·확률적 구조)가 필요하면 `complexity`. 동시 접근이 계약에 포함되면 `concurrency`.

**정합 검사** — 명세는 스텁에 있고 구현은 `_reference/`에 있어서 둘이 따로 놀 수 있다. `_reference/`가 선언된 시그니처·검증 등급·주입 정책을 실제로 구현하는지 검사하는 스크립트를 둔다.

## 규약 2 — 계약 스위트 (rev3 — 구현 중립 전환)

`<name>.contract.ts`가 `runContract(factory, opts)`를 export한다. 구현을 팩토리로 받으므로 스텁·정본·결함 fixture·Rust 포트에 같은 스위트가 돈다.

- **축1 동작 정확성** — 자명한 참조 모델(순수 배열/맵)과 무작위 교차검증 + 결정적 경계 케이스. **언어 중립 JSON test vector는 이 축 전용**
- **축2 불변식** — 매 연산 후 구조 불변식 검사
- **축3 복잡도 계약** — 아래 성장률 판정

### 축3 — 절대 카운트가 아니라 성장률

rev2는 "원소 이동 횟수" 같은 절대 지표를 구조 부류별로 고정했다. 그러면 **테스트가 특정 구현을 강제하게 된다** — 같은 덱이라도 링버퍼·두 스택·블록 덱은 "이동"이 무엇인지가 서로 다르니, "이동 횟수를 재겠다"는 말 자체가 이미 한 가지 구현을 전제한다. 이는 deque 문제 파일이 두 배열을 처방한 것과 같은 문제다.

대신 이렇게 한다.

1. 구현은 누적 비용 훅 `__cost: number` 하나만 노출한다. **무엇을 세는지는 구현이 정한다** — 다만 "연산 1회의 내부 작업량에 비례하는 양"이어야 한다(이동·비교·노드 방문 등)
2. 스위트는 시나리오를 $n \in \{2^{10}, 2^{12}, 2^{14}\}$로 실행해 총비용 $C(n)$을 잰다
3. **성장 비율** $r = C(4n)/C(n)$ 로 판정한다

$$\text{amortized } O(1) \Rightarrow r \approx 4 \qquad O(\log n) \Rightarrow r \approx 4\cdot\tfrac{\log 4n}{\log n} \qquad O(n) \Rightarrow r \approx 16$$

$n = 2^{10}$ 기준 $O(\log n)$의 기대 비율은 $4 \times 12/10 = 4.8$이다.

**판별 마진의 한계.** 이 방식은 $O(1)$(4.0)과 $O(\log n)$(4.8)을 가르기엔 마진이 좁다. 그러나 **우리가 반드시 잡아야 하는 A급 결함은 전부 "$O(\log n)$ 주장 vs 실제 $O(n)$"** 이고, 그건 4.8 대 16으로 3배 이상 벌어진다. 축3의 1차 목표는 이 격차를 잡는 것이고, $O(1)$/$O(\log n)$ 구분은 2차 목표로 둔다.

**판정 규칙 수치화**

| 항목 | 규격 |
|---|---|
| 입력 크기 | $\{2^{10}, 2^{12}, 2^{14}\}$ |
| 허용치 | 기대 비율의 $\pm 30\%$ 이내 |
| worst 계약 | 시퀀스 총합이 아니라 **단일 연산 최대 비용**으로 판정 |
| amortized 계약 | **시퀀스 평균**으로만 판정. 단일 연산의 일시적 비용 증가는 실패로 보지 않는다 |
| expected 계약 (randomized) | seed 5개 중앙값. `treap`·`skipList` 등 |
| 균형이 조건의 본체 | 위에 더해 **높이 직접 검사** $h \le c \log n$. 높이는 구현이 무엇이든 밖에서 잴 수 있는 값이라, 이걸 요구해도 특정 구현을 강제하지 않는다 |
| 입력 | 적대적 입력 필수 — 정렬·역정렬·한쪽 편중·중복 과다 |
| 재현성 | seed 고정, 실패 시 재현 명령과 입력을 `_fixtures/failures/`에 저장 |

**벤치와 계약의 경계** — 축3은 벽시계를 쓰지 않고 CI에 포함된다. `_bench/`는 가이드 서술용이라 벽시계·환경 의존을 허용하되 **CI 판정에서 제외**한다. 이 둘을 섞지 않는다.

### 검증 등급 네 가지

| 등급 | 검사하는 축 | 대상 예 |
|---|---|---|
| `basic` | 축1 | `stack`, `graphAdjMatrix` |
| `invariant` | 축1+2 | `doublyLinkedList`, `bitArray` |
| `complexity` | 축1+2+3 | 대부분의 트리·힙·덱 |
| `concurrency` | 축1+2+3+선형화 | `concurrentSkipList` (존치 시) |

## 규약 3 — 가이드 캔버스 8단계

**고치는 대상은 캔버스 한 장이 아니라 세 곳 + lock 이다** (rev4 — 집필 엔진 이관 반영). rev3은 `assets/data-structure-guide-canvas.md`
한 파일을 지목했는데, 그 파일은 존재하지 않고 골격의 정본도 캔버스가 아니다.

| 파일 | 고치는 것 |
|---|---|
| `.claude/authoring/specs/ds-guide/spec.json` | **골격 정본.** `sections[]`(`heading_fixed: true`)를 8단계로 교체하고 `principles`를 정합화 |
| `.claude/authoring/specs/ds-guide/spec.md` | 항목별 작성 방법을 8단계에 맞춰 다시 씀 |
| `.claude/skills/guide-for-problem/data-structure-guide-canvas.md` | 템플릿. spec 이 `template_ref: ds-guide-canvas` → `paths.json` 으로 가리킨다 |
| `.claude/authoring.lock.json` | spec 해시 갱신 (`authoring.py lock`). 안 하면 다음 집필이 stale 경고로 멈춘다 |

**캔버스만 고치면 반영되지 않는다.** 집필기(`authoring-kit:authoring-write`)는 spec 의 `sections[]`를 골격으로 읽고
캔버스는 그 렌더 템플릿으로 쓴다. 셋이 어긋나면 spec 이 이긴다.

**현행 ds-guide spec 은 ORD-006 과 정면 충돌한다** — 이 개정의 핵심이 여기 있다.

- `sections[].when.clue`("이런 단서가 보이면")와 원칙 `B2`("**문제에서** 어떤 근거·단서가 보일 때 이 자료구조를
  떠올려야 하는지 명시한다")가 **required/MUST** 로 박혀 있다. 문제 종속을 걷어내겠다는 ORD-006 과 반대다.
  절을 지우는 것이 아니라 **"이 구조가 필요한 이유"(2단계)로 대체**한다 — 선택 근거는 남기되 근거를 문제가 아니라
  연산·복잡도에서 끌어온다.
- `detail.spec`("전체 스펙: 속성과 액션")은 4단계(불변식과 연산별 복잡도 조건)로 흡수된다.
- 반대로 `E7`(복잡도가 무엇을 센 값인지 밝힘)·`E8`(최악/기대/상환 구분)은 **그대로 승계한다.** 규약 2의 축3 판정과
  같은 것을 요구하고 있어서 손댈 이유가 없다.
- 새로 필요한 원칙: 3단계(단순한 구현의 한계) 수치 근거, 6단계(대체 언어) 조건부 절, 5단계의 "사용 조건이 달라지면
  다른 구현이 적합" 진술.

**절 제목은 제목만 읽고 그 절의 내용을 알 수 있어야 한다.** ORD-005의 `## 왜 이 모양이어야 하는가`는 이 기준에 미달한다 — "모양"이 무엇을 가리키는지 제목에 없다. 내용은 승계하되 제목을 바꾼다. 아래 8개 제목을 같은 기준으로 다시 지었다.

| # | 제목 | 이 절의 내용 |
|---|---|---|
| 1 | **개요** | 한 문단 요약 |
| 2 | **이 구조가 필요한 이유** | 어떤 연산을 어떤 복잡도로 제공하는 구조인지 진술. 문제 스토리 금지 |
| 3 | **단순한 구현의 한계** | 순진한 설계를 실제로 구현해 어느 지점에서 복잡도가 나빠지는지 수치로 제시하고, 그로부터 설계 규칙을 도출 *(ORD-005 내용 승계)* |
| 4 | **불변식과 연산별 복잡도 조건** | 필요충분조건. 이 조건을 만족하지 못하면 무엇이 되는지 명시 |
| 5 | **구현 (TypeScript)** | 유도 → 구현 → 성장률로 조건 충족 확인. **사용 조건이 달라지면 다른 구현이 적합하다는 점도 함께 기술** |
| 6 | **TypeScript의 한계와 대체 언어** *(조건부)* | ① 충족 불가(또는 실측 불가)한 이유 ② TypeScript 차선책과 그 비용 ③ Rust 포트 + 실측 대조 |
| 7 | **단계별 동작 확인** | 실행 시각화 |
| 8 | **스스로 점검하기** | 확인 문제 |

`algorithms` 트랙의 10단계 캔버스 제목도 같은 기준으로 점검이 필요하지만, 이번 ORD 범위 밖이므로 별도 지시가 있을 때 다룬다.

## 규약 4 — 언어 에스컬레이션 (2등급)

"계약 충족 불가능"과 "실측 설득력 부족"은 다른 사유다. 섞으면 TS로도 점근 계약을 지킬 수 있는 구조가 부당하게 Rust로 밀린다.

**(가) TS로 명세 계약 자체를 만족 불가 → Rust 필수**

| 트리거 | 해당(예상) |
|---|---|
| 포인터 산술 | `xorLinkedList` |
| 원자적 연산·동시성 | `concurrentSkipList` (존치 시) |
| 언어 수준 정수 폭·오버플로 제어 | `rollingHash`, `bitArray` 일부 |

**(나) 점근 계약은 TS로 충족되나 실측 근거를 TS에서 못 보임 → Rust 선택**

| 트리거 | 해당(예상) |
|---|---|
| 명시적 메모리 레이아웃·캐시 라인 | `unrolledLinkedList`, `bPlusTree` |
| GC 없는 결정적 지연 | 실시간 계약을 내건 구조 |

구조마다 (가)/(나)/해당없음 판정과 근거 한 줄을 가이드에 남긴다.

## CI 3모드

| 모드 | 대상 | 기대 | CI 판정 |
|---|---|---|---|
| ① 스위트 자기검증 | `_fixtures/broken/` | **축3이 실패**해야 통과. "무언가 실패"로는 불충분 — 컴파일 에러·예외와 계약 위반을 구분해 단언 | 포함 |
| ② 정본 검증 | `_reference/` | 녹색 | 포함 |
| ③ 실습 채점 | `<name>.ts` 스텁 | 미구현 실패가 정상 | **제외** (별도 리포팅) |

## 집필 엔진 (rev4 — `authoring-kit` 이관 반영)

이 전략은 2026-08-03 에 섰고, **집필 규칙을 `authoring-kit` 플러그인으로 옮긴 브랜치는 그다음 날 병합**됐다(`d5591d1`).
그래서 rev3 의 파이프라인 서술은 이관 전 세계를 가리킨다. 지금 서 있는 구조는 이렇다.

```
guide-for-problem / gen-problem       진입점. 어느 spec 으로 쓸지 고르고 넘기기만 한다
        ↓ Skill(authoring-kit:authoring-write) --spec <id>
.claude/authoring/specs/{algo-guide,ds-guide,problem}/   골격·항목별 작성법 (정본)
.claude/authoring/paths.json                              경로·빌드 명령 바인딩
.claude/authoring.lock.json                               지금 서 있는 규칙 조합(해시)
~/.claude/authoring/principles + 플러그인 voice           공통 원칙·퍼소나 (전역)
```

**경로 라우팅은 이미 있다.** `guide-for-problem` 은 `src/data-structures/**` → `ds-guide`,
`src/algorithms/**` → `algo-guide` 로 spec 을 고른다. 그래서 rev3 이 계획한 **`guide-for-structure` 스킬 신설은 철회한다** —
자료구조 트랙을 가르는 축은 이제 스킬이 아니라 spec 이고, 스킬을 하나 더 만들면 방금 한 벌로 합친 규칙이 다시 갈라진다
(`CLAUDE.md`: *"규칙을 스킬 문서에 다시 쓰지 않는다"*). 자료구조 트랙의 골격 변경은 **전부 `ds-guide` spec 개정으로 처리**한다.

**전제: 이 프로젝트에서 플러그인이 실제로 잡혀야 한다.** 진입점 두 스킬 모두 0단계에서
`${CLAUDE_PLUGIN_ROOT}/scripts/authoring.py status` 를 돌리고 **없으면 거기서 멈춘다**(구 경로 폴백 없음).
rev4 작성 시점에 이 프로젝트에는 플러그인이 걸려 있지 않았고(다른 프로젝트에 project 스코프로만 설치), lock 은
`0.2.0` 을 가리키는데 캐시 설치본은 `0.3.0` 이었다. **그 상태로는 P1 파일럿이 집필 단계에 진입하지 못한다.**

**2026-08-04 해소 완료 (KAN-029).**

```
claude plugin install authoring-kit@centurio87-plugins --scope project   # 0.3.0, 스킬 6종 등록
python3 …/authoring.py lock --update                                     # 0.2.0 → 0.3.0 재고정
```

- 활성화 기록은 `.claude/settings.json` 의 `enabledPlugins` 에 남는다 — 리포에 들어가므로 워크트리를 옮겨도 따라간다.
- lock 변경분은 **플러그인 버전 + `QUALITY_RUBRIC.md` 해시 + principles revision 뿐이고 spec·voice 해시는 불변**이다.
  0.3.0 승격이 프로젝트 spec 3종을 무효화하지 않는다는 뜻이다.
- 루브릭 변경분의 실체는 **H축(이해 게이트) 신설** — 집필자가 자기 글을 채점하지 않는 유일한 축. ORD-005·006 방향과
  같아서 그대로 수용했다.

## 파이프라인·문서 변경

| 대상 | 변경 |
|---|---|
| `.claude/authoring/specs/ds-guide/` | **골격 정본.** 8단계로 개정 + 문제 종속 원칙(`B2`·`when.clue`) 제거 → 규약 3 |
| `.claude/authoring/specs/problem/` | 적용 범위를 `algorithms/` 로 한정한다고 명시. 자료구조 문제 문서는 더 만들지 않는다 |
| `.claude/authoring/paths.json` | `exemplars.ds-guide` 가 `bPlusTree-guide.mdx`(구 5단계)를 가리킨다. 파일럿 산출물로 교체 |
| `.claude/authoring.lock.json` | spec 개정마다 `authoring.py lock` 재생성. 플러그인 버전도 여기서 고정 |
| `.claude/skills/guide-for-problem/` | 존치. 라우팅 표의 `ds-guide` 행을 "5단계"→"8단계"로 정정. **`guide-for-structure` 신설은 철회** |
| `.claude/skills/gen-problem/` | data-structures 대상 폐기 명시 (spec 범위 한정과 짝) |
| `CLAUDE.md` | "코드 테스트 문제 풀이 목적 / 주석에 적힌 문제를 보고" 문구가 새 방향과 **정면 충돌**. 자료구조 트랙 서술 추가 |
| `ORDER.md` | ORD-006 원문(verbatim) 봉인 (ORD-001~005 관례) |
| 메모리 `guide-quality-standard.md` | ORD-006 반영 |
| `rust/` | **점진 도입** — P0-a에서 최소 crate 구조만, 이후 (가) 판정 구조만 추가 |
| 게이트 | 루브릭·외부 검토는 **플러그인의 `authoring-gate` + spec 의 `gate.external_review`** 로 이미 넘어갔다(`review-guide.sh` 는 이관 때 사라졌다). 프로젝트가 계속 소유하는 것은 `comprehension-gate.sh`·`check-mermaid.ts`·`compile-check.ts`. 여기에 **타입체크·lint·코드 추출 일치**를 추가하고, 8단계 캔버스 호환을 점검한다 |
| problem 삭제 | 참조 스윕 + migration note. redirect 인프라는 만들지 않는다(외부 소비자 없음, git 히스토리 보존) |

## 공통 DoD (구조 1종)

1. `<name>-problem.md` 삭제 + 참조 스윕 통과
2. `<name>.ts` 헤더 = 규약1 명세, 본문은 스텁 유지
3. `_reference/` 대표 구현 + 명세 정합 검사 통과
4. `<name>.contract.ts` — 검증 등급에 맞는 축
5. CI 3모드가 각각 의도대로
6. `<name>-guide.mdx` — **`ds-guide` spec 으로 집필**(캔버스 8단계), 코드는 region 추출
7. 에스컬레이션 판정 기록 — (가)/(나)/해당없음 + 근거
8. (가)면 Rust 포트가 같은 JSON vector(축1) 통과 + 축2·3은 언어별 계측
9. 게이트 통과 — 이해 게이트 0, mermaid, 타입체크, MDX 빌드, 추출 일치, 외부 검토
10. 완료 보고에 **`resolve` 해시**(어떤 규칙 조합으로 쓰였는지)를 남긴다 — lock 이 stale 인 채 쓴 글을 나중에 가려낼 수 있어야 한다

## 칸반 카드 (공수 S/M/L · 리스크 상/중/하)

`KANBAN.md` 없음 → `init` 필요. 사용자 지시 파생 카드는 `--verbatim`.

**P0-a — 파일럿을 돌리는 데 꼭 필요한 것만**

| # | 카드 | 공수 | 리스크 |
|---|---|---|---|
| 1 | `ORD-006 봉인` — 지시 원문 + **진단 9건 표 이관**. 최우선 | S | 하 |
| 2 | `규약1: 명세 규격` — JSDoc 규격·검증 등급 판정 규칙·주입 정책·정합 검사 | M | 중 |
| 3 | `규약2: 계약 스위트 규격` — `runContract`, 축1~3, **성장률 판정 수치 규격**, 적대적 입력 생성기, seed·재현 | L | **상** |
| 4 | `규약3: 캔버스 8단계 개정` — **`ds-guide` spec(정본) + 캔버스 + lock 3종 동시** | M | 중 |
| 29 | `집필 엔진 가용성 확보` — 플러그인 설치·활성화, lock 의 플러그인 버전 재고정. **rev4 신설. P1 파일럿 착수 전 필수** | S | 중 |
| 5 | `규약4: (가)/(나) 판정 기준` | S | 하 |
| 6 | `Rust 최소 crate 구조 확정` — 워크스페이스 경계, vector 공유 위치, TS↔Rust API 대응 | M | 중 |
| 7 | `처분 결정 3건` — `concurrentSkipList`(개명/Rust전용/삭제 + 판정 기준) · `xorLinkedList`(Rust unsafe/역사적 처분) · `multiset` 재분류 원칙 | M | 중 |

**P1 — 파일럿 (카드 7 결과에 따라 2~3종)**

| # | 카드 | 공수 | 리스크 |
|---|---|---|---|
| 8 | `deque 재집필` — 배열/버퍼 계열 + amortized 계약 대표. `_bench/` 이관(재현 명령·환경 고정) | L | 중 |
| 9 | `intervalTree 재집필` — 트리 계열 + 높이 계약 대표. 축3 난제를 여기서 규격화 | L | **상** |
| 10 | `xorLinkedList 재집필` — (가) 등급 검증. 카드 7에서 "역사적 처분"이 나오면 이 카드는 처분 작업으로 축소 | M | 중 |
| 11 | `파일럿 회고 — 규약에 반영` — 파일럿에서 드러난 규약 결함을 규약 1~4에 되돌려 고친다. **P0-b·P2 착수 전 필수 관문** | S | 하 |

**P0-b — 도구·자동화 (파일럿이 형태를 증명한 뒤)**

| # | 카드 | 공수 | 리스크 |
|---|---|---|---|
| 12 | `CI 3모드 구성` | M | 중 |
| 13 | `가이드↔코드 region 추출 파이프라인 + 일치 검사` | M | 중 |
| 14 | `게이트 확장` — 타입체크·MDX 빌드·신캔버스 호환 점검 | M | 중 |
| 15 | `problem 참조 스윕 + 링크 무결성 도구` | S | 하 |
| 16 | `ds-guide 집필 경로 정합 + 회귀 골든` — **스킬 신설 아님**(철회). 라우팅 표 정정 · `exemplars.ds-guide` 를 파일럿 산출물로 교체 · `problem` spec 범위를 algorithms 로 한정 · 샘플 입력 → 산출물 → 게이트 통과 확인 | M | 중 |
| 17 | `CLAUDE.md 자료구조 트랙 서술` | S | 하 |
| 18 | `메모리 guide-quality-standard 갱신` | S | 하 |

**P2 — A급 잔여**

| # | 카드 | 공수 | 리스크 |
|---|---|---|---|
| 19 | `multiset 재집필` — 균형 BST + 카드 7의 재분류 원칙 적용 | L | 중 |
| 20 | `unrolledLinkedList 재집필` — 양방향 연결. (나) 판정 예상 | M | 하 |

**P3 — B·C급**

| # | 카드 | 공수 | 리스크 |
|---|---|---|---|
| 21 | `suffixArray·suffixTree 구성 복잡도 정합` | M | 중 |
| 22 | `queue 재집필` | S | 하 |
| 23 | `ternarySearchTree 근거 정정` | S | 하 |
| 24 | `concurrentSkipList 처분 실행` — 카드 7 결정 이행 | M | 중 |

**P4 — 잔여 60종 (난이도 기준)**

| # | 카드 | 공수 | 리스크 |
|---|---|---|---|
| 25 | `P4 분류 확정` — 60종을 아래 3군에 배정 + 군별 공수 추정 | M | 중 |
| 26 | `P4-A: basic/invariant 군` — 축3 불필요 | L | 하 |
| 27 | `P4-B: complexity 군` — 축3 필요, 에스컬레이션 불필요 | L | 중 |
| 28 | `P4-C: (나) 후보 군` — Rust 실측이 붙음 | L | 중 |

## 검증

- **모드①** 결함 fixture가 **축3에서** 실패하는지 (다른 이유의 실패는 불합격). 통과해 버리면 스위트가 무력하므로 규약 2로 회귀
- **모드②** `_reference/` 녹색 + 명세 정합 검사
- `cargo test --workspace` — (가) 구조가 같은 JSON vector(축1) 통과
- `tsc --noEmit` / lint / MDX 빌드 / region 추출 일치
- `comprehension-gate.sh` 종료코드 0 (2=미실행은 통과 아님) / `check-mermaid.ts` / `compile-check.ts`
- `authoring.py status` · `lock` 이 깨끗한 상태에서 집필됐는지 (stale lock 으로 쓴 글은 규칙 조합을 특정할 수 없다)
- 링크 무결성 — problem 삭제·스킬 분기 후 broken link 0

## 핸드오프

새 세션이 읽어야 하는 것: ① `ORDER.md` ORD-006(지시 원문 + 진단 표) ② `KANBAN.md`(카드 + verbatim) ③ 규약 1~4 + 공통 DoD
④ 메모리 ⑤ `_bench/` ⑥ **집필 엔진** — `CLAUDE.md` 의 "집필 규칙의 정본은 플러그인이다" 절과
`.claude/authoring/specs/ds-guide/` · `paths.json` · `authoring.lock.json`.

**리스크:** 진단 표와 deque 실측이 지금 세션 산물에만 있다. 카드 1과 카드 8의 `_bench/` 이관을 최우선으로 처리한다. 벤치는 수치만이 아니라 **재현 명령·입력·환경(bun 버전, 머신)** 까지 고정해야 기록이 아닌 검증 가능한 지식이 된다.
