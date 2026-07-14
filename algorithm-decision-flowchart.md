# 알고리즘 의사 결정 Flow Chart

문제의 겉모양이 아니라 **제약 → 구조 → 목표 → 성질 → 구현 최적화** 순서로 후보를 좁히는 지도입니다. 하나의 거대한 트리로 모든 알고리즘을 억지로 배타 분류하지 않고, 먼저 전체 라우터에서 영역을 고른 뒤 해당 세부 트리로 내려갑니다.

> 같은 문제에 여러 트리가 동시에 적용될 수 있습니다. 예: 문자열 매칭 + DP, 트리 + 구간 자료구조, 그래프 + 비트마스크 DP.

## 0. 복잡도 예산부터 정하기

| 대략적인 입력 크기 `N` | 먼저 검토할 시간복잡도 |
| --- | --- |
| `N ≤ 20` | `O(2^N)`, meet-in-the-middle, bitmask DP |
| `N ≤ 40` | `O(2^(N/2))`, meet-in-the-middle |
| `N ≤ 500` | `O(N^3)` 가능성 검토 |
| `N ≤ 5,000` | `O(N^2)` 가능성 검토 |
| `N ≤ 2×10^5` | 보통 `O(N log N)` 이하 |
| `N ≥ 10^6` | 보통 `O(N)` 또는 작은 상수의 `O(N log N)` |

수치 범위가 작으면 `N` 대신 값의 범위 `V`를 이용하는 counting, sieve, frequency DP도 후보입니다. 메모리는 상태 수 × 상태 하나의 크기로 별도 계산합니다.

## 1. 전체 라우터

```mermaid
flowchart TD
    A["문제의 제약과 출력 목표 확인"] --> B{"완전탐색이 예산 안인가?"}
    B -->|Yes| B1{"중복 상태가 생기는가?"}
    B1 -->|Yes| DP["DP / Memoization 트리"]
    B1 -->|No| EX["Brute Force / Backtracking<br/>가지치기 · 대칭 제거"]
    B -->|No| C{"핵심 대상은 무엇인가?"}

    C -->|"배열 · 수열 · 구간"| ARR["배열 · 질의 트리"]
    C -->|문자열| STR["문자열 트리"]
    C -->|"그래프 · 트리 · 상태공간"| GRA["그래프 · 트리 트리"]
    C -->|"수 · 조합 · 다항식"| NUM["수학 · 정수론 트리"]
    C -->|"점 · 선 · 도형"| GEO["기하 트리"]
    C -->|"최댓값 · 최솟값의 위치/답"| OPT["탐색 · 최적화 트리"]

    ARR --> MIX["필요하면 여러 기법 결합"]
    STR --> MIX
    GRA --> MIX
    NUM --> MIX
    GEO --> MIX
    OPT --> MIX
    DP --> MIX
```

## 2. 배열 · 수열 · 구간

```mermaid
flowchart TD
    A["배열 / 수열"] --> B{"연속 구간이 핵심인가?"}
    B -->|Yes| C{"구간을 늘리고 줄이며<br/>조건을 유지할 수 있는가?"}
    C -->|Yes| C1{"음수 등 때문에<br/>포인터 단조성이 깨지는가?"}
    C1 -->|No| SW["Sliding Window / Two Pointers"]
    C1 -->|Yes| PH["Prefix Sum + Hash / Deque / DP"]
    C -->|No| D{"정적 구간 질의가 많은가?"}
    D -->|"합 · 역원 가능"| PS["Prefix Sum"]
    D -->|"min/max/gcd · 갱신 없음"| ST["Sparse Table"]
    D -->|"오프라인 질의"| MO["Mo's Algorithm"]

    B -->|No| E{"갱신과 구간 질의가 함께 있는가?"}
    E -->|Yes| E1{"연산/갱신 형태는?"}
    E1 -->|"점 갱신 + 누적 결합"| FW["Fenwick Tree"]
    E1 -->|"일반 구간 결합 · lazy 갱신"| SEG["Segment Tree / Lazy Propagation"]
    E1 -->|"구간 가산 후 일괄 복원"| DIFF["Difference Array"]
    E -->|No| F{"순서 관계가 핵심인가?"}
    F -->|"다음 큰/작은 원소"| MS["Monotonic Stack / Queue"]
    F -->|"증가 부분수열"| LIS["LIS: DP 또는 Patience + Binary Search"]
    F -->|"쌍 · 순위 · 역전"| ORD["Sort + Two Pointers / Fenwick / Divide & Conquer"]
    F -->|"빈도 · 존재 · 중복"| HASH["Hash Map / Set / Counting"]
    F -->|"상위 K · 반복 최솟값"| HEAP["Heap / Selection"]
```

## 3. DP 설계와 차원 · 메모리 최적화

```mermaid
flowchart TD
    A["최적값 / 가능 여부 / 경우의 수"] --> B{"같은 부분 문제가 반복되는가?"}
    B -->|No| NDP["Greedy / Divide & Conquer / Search 재검토"]
    B -->|Yes| S["상태 정의<br/>미래 결정에 필요한 정보만 포함"]
    S --> T["전이 · 기저값 · 계산 순서 작성"]
    T --> G{"상태 전이 그래프가 DAG인가?"}
    G -->|Yes| ORD["Top-down memo 또는<br/>Bottom-up 위상 순서"]
    G -->|No| CYC["최단경로 · 고정점 · 게임 DP 여부 검토"]

    ORD --> M{"다음 상태가 과거 전체가 아니라<br/>최근 k개 층에만 의존하는가?<br/>Markov 성질 / bounded dependency"}
    M -->|No| FULL["전체 DP 테이블 유지<br/>경로 복원이 필요하면 부모 정보 저장"]
    M -->|Yes| REC{"이전 값이 다시 필요하거나<br/>출력 복원이 필요한가?"}
    REC -->|Yes| KEEP["필요한 층/체크포인트/부모만 유지"]
    REC -->|No| COMP["Rolling Array로 차원 축소<br/>2D → 1D, k층 → 원형 버퍼"]

    COMP --> DIR{"같은 1D 배열을 in-place 갱신하는가?"}
    DIR -->|"각 항목 1회 사용: 0/1 knapsack"| BACK["인덱스 역순 순회<br/>이번 층 값 재사용 방지"]
    DIR -->|"항목 반복 사용: unbounded"| FORW["인덱스 정순 순회<br/>이번 층 값 재사용 허용"]
    DIR -->|"좌/상/대각 등 여러 이전 값"| TEMP["덮기 전 임시 변수 또는<br/>2개 행/열 유지"]

    FULL --> O{"전이 비용이 병목인가?"}
    KEEP --> O
    BACK --> O
    FORW --> O
    TEMP --> O
    O -->|"구간 최적 분할 + 단조 opt"| DC["Divide & Conquer DP Optimization"]
    O -->|"사각 부등식 + opt 단조성"| KN["Knuth Optimization"]
    O -->|"선형식의 min/max"| CHT["Convex Hull Trick / Li Chao Tree"]
    O -->|"부분집합 상태"| BIT["Bitmask DP / SOS DP"]
    O -->|"자리수 제약"| DIG["Digit DP"]
```

### DP 차원 축소 체크리스트

1. `dp[i][...]`에서 `i+1` 계산에 실제로 참조되는 층을 식으로 표시한다.
2. 최근 `k`개 층만 참조하면 상태 전이는 `k`차 Markov 성질을 가지므로 오래된 층을 버릴 수 있다.
3. in-place 갱신 시 순회 방향이 문제의 의미를 바꾸는지 확인한다. 0/1 선택은 보통 역순, 무제한 선택은 보통 정순이다.
4. 최적값만 필요한지, 실제 선택/경로 복원도 필요한지 구분한다. 복원이 필요하면 부모 배열, checkpoint 재계산, Hirschberg 같은 별도 기법이 필요할 수 있다.
5. 시간 차원은 줄여도 다른 상태 축이 미래를 구분하는 데 필요하면 제거하면 안 된다.

## 4. 문자열

```mermaid
flowchart TD
    A["문자열 문제"] --> B{"무엇을 비교/질의하는가?"}
    B -->|"한 패턴의 출현"| P{"전처리 대상은?"}
    P -->|패턴| KMP["KMP / Z Algorithm"]
    P -->|"해시 충돌을 허용 가능한가"| RH["Rolling Hash / Rabin-Karp"]
    B -->|"여러 패턴을 한 텍스트에서"| AC["Aho-Corasick"]
    B -->|"접두사 검색 · 사전 · XOR 문자열화"| TRIE["Trie / Radix Tree"]

    B -->|"접미사 · 반복 · 사전순"| S{"질의 형태는?"}
    S -->|"모든 접미사 순서 · LCP"| SA["Suffix Array + Kasai LCP"]
    S -->|"서로 다른 부분문자열 · 온라인 확장"| SAM["Suffix Automaton"]
    S -->|"정적 전문 색인"| STREE["Suffix Tree 계열"]

    B -->|회문| PAL{"필요한 결과는?"}
    PAL -->|"모든 중심의 최대 반경"| MAN["Manacher"]
    PAL -->|"구간 회문 판정"| PALDP["DP / Hash"]
    PAL -->|"최소 분할"| CUT["Palindrome DP + Partition DP"]

    B -->|"두 문자열의 편집/정렬"| SD["LCS / Edit Distance / Sequence DP"]
    B -->|"문법 · 괄호 · 토큰"| PARSE["Stack / Parser / CYK DP"]
    B -->|"문자열 구간 비교 질의"| LCP["Hash + Binary Search 또는<br/>Suffix Array/LCP + RMQ"]
```

## 5. 탐색 · 수치 최적화

```mermaid
flowchart TD
    A["값 또는 최적점을 찾는다"] --> B{"정확한 이산 후보를 찾는가?"}
    B -->|Yes| C{"판정 P(x)가 한 방향으로 단조인가?"}
    C -->|Yes| BS["Binary Search / Parametric Search<br/>경계의 불변식 정의"]
    C -->|No| D{"함숫값이 단봉/unimodal인가?"}
    D -->|Yes| DT["Discrete Ternary Search 또는<br/>이웃 비교로 peak search"]
    D -->|No| ENUM["정렬 · 자료구조 · DP · 완전탐색 재검토"]

    B -->|"연속 실수 최적점"| E{"목적함수가 단봉 또는<br/>convex/concave인가?"}
    E -->|Yes| CT["Ternary Search / Golden-section Search"]
    E -->|No| F{"도함수/기울기의 부호가 단조인가?"}
    F -->|Yes| DB["도함수에 Binary Search"]
    F -->|No| NUM["Newton / 수치해석<br/>초깃값·오차·수렴성 검증"]

    BS --> SAFE["정수 overflow · 경계 포함 · 종료 조건 확인"]
    DT --> WARN["정수 구간이 작아지면 직접 열거"]
    CT --> EPS["반복 횟수/절대·상대 오차와<br/>부동소수점 안정성 명시"]
```

> Ternary search는 단순히 “정렬됨”이 아니라 **목적함수의 단봉성**이 증명될 때 사용합니다. 판정의 참/거짓이 단조라면 binary search가 우선입니다.

## 6. 그래프 · 트리 · 상태공간

```mermaid
flowchart TD
    A["정점과 이동/관계가 있다"] --> B{"목표는 무엇인가?"}
    B -->|도달/탐색| TR{"가중치가 없는가?"}
    TR -->|Yes| BF["BFS / DFS"]
    TR -->|"암시적 상태공간 + 휴리스틱"| AST["A* / Bidirectional Search"]

    B -->|최단거리| SP{"간선 가중치 조건은?"}
    SP -->|"0 또는 1"| ZB["0-1 BFS"]
    SP -->|"모두 비음수"| DIJ["Dijkstra"]
    SP -->|"음수 간선 · 음수 사이클 판별"| BEL["Bellman-Ford / SPFA는 주의"]
    SP -->|DAG| DAG["Topological DP"]
    SP -->|"모든 쌍 · 정점 수 작음"| FW["Floyd-Warshall"]

    B -->|연결/구조| CON{"어떤 구조인가?"}
    CON -->|"동적 그룹 합치기"| UF["Union-Find"]
    CON -->|"방향 강연결"| SCC["Tarjan / Kosaraju SCC"]
    CON -->|"단절점 · 단절선"| LOW["DFS Low-link"]
    CON -->|"DAG 선후관계"| TOP["Topological Sort"]

    B -->|"최소 연결 비용"| MST["Kruskal / Prim MST"]
    B -->|"용량 · 배정 · 절단"| FLOW["Max Flow / Min Cut / Matching<br/>Min-Cost Max-Flow"]
    B -->|트리 질의| TREE{"질의 형태는?"}
    TREE -->|"조상 · 경로 점프"| LCA["LCA / Binary Lifting"]
    TREE -->|"서브트리 구간"| EUL["Euler Tour + Fenwick/Segment Tree"]
    TREE -->|"경로 갱신/질의"| HLD["Heavy-Light Decomposition"]
    TREE -->|"모든 루트를 고려"| REROOT["Rerooting DP"]
    TREE -->|"지름 · 중심"| DIA["2회 탐색 / Tree DP"]
```

## 7. 수학 · 정수론 · 조합

```mermaid
flowchart TD
    A["정수/조합 구조"] --> B{"핵심 연산은?"}
    B -->|"소수 · 소인수"| P{"범위와 질의 수는?"}
    P -->|"범위 전체"| SIEVE["Sieve / SPF"]
    P -->|"큰 수 소수 판정"| MR["Miller-Rabin"]
    P -->|"큰 합성수 분해"| PR["Pollard Rho"]
    B -->|"gcd · 역원 · 합동식"| MOD["Euclidean / Extended Euclidean<br/>CRT / Modular Inverse"]
    B -->|"거듭제곱 · 선형 점화"| POW["Fast Power / Matrix Exponentiation"]
    B -->|"조합 수 mod p"| COMB["Factorial + Inverse / Lucas 등"]
    B -->|"합성곱 · 큰 정수 곱"| FFT["FFT / NTT"]
    B -->|"부분집합 합 · N≈40"| MITM["Meet in the Middle"]
    B -->|"비트 부분집합 전이"| SOS["Submask Enumeration / SOS DP"]
```

## 8. 기하

```mermaid
flowchart TD
    A["좌표/도형"] --> B{"무엇을 구하는가?"}
    B -->|"방향 · 교차 · 포함"| ORI["CCW/Cross Product<br/>Segment Intersection / Point in Polygon"]
    B -->|"외곽 경계"| HULL["Convex Hull"]
    B -->|"볼록 다각형의 지름/폭"| CAL["Rotating Calipers"]
    B -->|"가장 가까운 점 쌍"| CLOSE["Sweep Line 또는 Divide & Conquer"]
    B -->|"다수 선분 교차"| SWEEP["Sweep Line / Bentley-Ottmann"]
    B -->|"넓이"| AREA["Shoelace Formula"]
    B -->|"거리 최적화가 단봉"| TER["Ternary Search<br/>단봉성 증명 필요"]
```

## 9. Greedy · 분할정복 · 탐색 판별

```mermaid
flowchart TD
    A["DP 외 후보를 검토"] --> B{"한 선택 뒤 남은 문제가<br/>같은 형태로 유지되는가?"}
    B -->|Yes| C{"교환 논증/컷 성질/matroid 등으로<br/>국소 최선의 안전성을 증명 가능한가?"}
    C -->|Yes| GR["Greedy"]
    C -->|No| DP["DP / Search"]
    B -->|No| D{"독립적인 하위 문제로 분할되고<br/>결과를 빠르게 합칠 수 있는가?"}
    D -->|Yes| DC["Divide & Conquer"]
    D -->|No| E{"모든 후보가 필요하지만<br/>상한/하한으로 가지치기 가능한가?"}
    E -->|Yes| BT["Backtracking / Branch and Bound"]
    E -->|No| SIM["Simulation / 문제별 불변식 재탐색"]
```

## 10. 최종 선택 전 검증 질문

1. 입력 크기와 시간·메모리 예산에 맞는가?
2. 알고리즘의 핵심 전제(단조성, 단봉성, 비음수 가중치, 최적 부분 구조 등)를 **증명**했는가?
3. 온라인/오프라인, 정적/동적, 단일/반복 질의를 구분했는가?
4. 중복 값, 빈 입력, overflow, 음수, disconnected graph, cycle을 처리하는가?
5. DP 상태가 미래를 구분하는 최소 정보인가? 최근 층만 참조한다면 rolling array로 줄일 수 있는가?
6. in-place DP의 순회 방향이 0/1 선택과 무제한 선택의 의미를 보존하는가?
7. 정답뿐 아니라 경로·선택 복원이 필요한가?
8. 더 단순한 알고리즘이 같은 복잡도를 달성하지 않는가?

## 핵심 단서 색인

| 관찰 가능한 단서 | 우선 검토할 후보 |
| --- | --- |
| `P(x)`가 false→true 또는 true→false로 한 번만 변함 | Binary/Parametric Search |
| 목적함수가 한 번만 증가 후 감소(또는 반대) | Ternary/Golden-section Search |
| 최근 `k`개 DP 층만 다음 상태에 영향 | Rolling Array, 차원 축소 |
| 0/1 항목을 1D knapsack으로 압축 | 용량 역순 순회 |
| 무제한 항목을 1D knapsack으로 압축 | 용량 정순 순회 |
| 연속 구간의 양끝을 이동해도 조건 변화가 단조 | Sliding Window / Two Pointers |
| 음수 때문에 window 합의 단조성이 깨짐 | Prefix Sum + Hash/Deque |
| 다음 큰/작은 원소, 히스토그램 | Monotonic Stack |
| 여러 패턴을 한 텍스트에서 검색 | Aho-Corasick |
| 접미사 순서·LCP·반복 부분문자열 | Suffix Array + LCP |
| 온라인 부분문자열 상태·서로 다른 부분문자열 | Suffix Automaton |
| 모든 회문 중심의 반경 | Manacher |
| 가중치 0/1 최단거리 | 0-1 BFS |
| 선형식들의 최솟값/최댓값이 DP 전이 | CHT / Li Chao Tree |
| 트리 경로 갱신·질의 | HLD + Segment Tree |
| `N≈40` 부분집합 탐색 | Meet in the Middle |

이 문서는 알고리즘 이름의 백과사전이 아니라, **문제에서 증명 가능한 성질을 찾아 후보를 좁히는 의사 결정 지도**로 사용합니다.
