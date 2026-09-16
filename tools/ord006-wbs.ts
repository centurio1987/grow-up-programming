/**
 * ORD-006 B군(KAN-027) WBS 상태 계산기.
 *
 * **claim 상태를 어느 문서에도 적지 않는다.** 병렬 세션이 상태 파일을 함께 고치면 그 파일이
 * 곧 충돌 지점이 되고, 병렬화가 막으려던 것이 상태 관리에서 그대로 돌아온다. 진실은 파일
 * 시스템이다 — 구조의 `_reference/` 가 있으면 그 구조는 끝났다. 이 도구는 그 사실을 유닛
 * 단위로 접어 보여줄 뿐이고 아무것도 쓰지 않는다.
 *
 * 유닛 = 계약 하나 = 배치 하나. 계약이 접힌 자리(B17·B18·B19 판정)에서는 정본 하나에 성격
 * 전환 여럿이 딸리고, 전환은 정본이 선 뒤에만 열린다(B20 → B22·B23 이 그 순서였다).
 *
 * 사용:
 *   bun run tools/ord006-wbs.ts           # 트랙별 상태 + claim 후보
 *   bun run tools/ord006-wbs.ts --json    # 기계용
 *   bun run tools/ord006-wbs.ts --all     # 전 유닛 표
 *
 * 규격 전문은 docs/ORD-006-wbs.md.
 */
import { stat } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const scanRoot = join(root, "src/data-structures");

type Track = {
  readonly id: string;
  readonly title: string;
  /** 이 트랙이 런북 불변 사실에 쓸 번호 대역. 병렬 세션이 같은 번호를 쓰지 않게 미리 가른다. */
  readonly facts: string;
};

const TRACKS: readonly Track[] = [
  { id: "T1", title: "탐색 트리", facts: "100-119" },
  { id: "T2", title: "우선순위 큐", facts: "120-139" },
  { id: "T3", title: "사전·집합·분리집합", facts: "140-159" },
  { id: "T4", title: "구간 질의·공간", facts: "160-179" },
  { id: "T5", title: "선형·확률·기타", facts: "180-199" },
  // KAN-026 S1 판정(2026-09-14). 카드가 단일 에이전트 직렬로 결재돼 트랙을 가르지 않았다 —
  // 트랙을 나누면 claim 이 병렬을 암시한다. 유닛 순서가 곧 카드 배치안 순서다.
  // 200-229 는 S6 에서 소진됐고 S5(TA-04)부터 둘째 대역을 쓴다. 230-269 는 KAN-027 의 대역이다.
  // 270-299 는 S14 · S19(TA-12 · TA-13)에서 소진됐고 셋째 대역 350-379 를 연다. 300-349 · 380-389 는 KAN-027 몫이다.
  { id: "TA", title: "A군 계약 전환", facts: "200-229 · 270-299 · 350-379" },
];

type UnitFields = {
  readonly id: string;
  readonly track: string;
  /** 계약을 한 줄로. 구조 이름이 아니라 계약 이름을 적는다. */
  readonly contract: string;
  /** 정본 구조 `<category>/<name>`. 이것이 서야 전환이 열린다. */
  readonly canonical: string;
  /** 성격 전환 구조들. 정본과 같은 계약이고 `.contract.ts` 는 정본 것을 그대로 쓴다. */
  readonly transitions: readonly string[];
  /** 이 유닛에만 걸리는 것. 없으면 빈 문자열. */
  readonly note: string;
};

/**
 * B군 42종 중 재집필이 남은 37종을 32 유닛으로 접은 것.
 *
 * 끝난 5종(avlTree·redBlackTree·twoThreeTree·bTree·bPlusTree = 정렬 집합 `worst` 계약)은
 * 여기에 없다. 유닛 목록이 곧 남은 일이다.
 *
 * 출처는 셋뿐이다 — B17(이진 탐색 트리 아홉 → 계약 다섯) · B18(힙 여덟 → 계약 넷) ·
 * B19(해시 셋 + 흩어진 쌍 여덟). 판정 전문은 docs/ORD-006-conventions.md §규약1.
 * **판정이 끝나지 않은 자리는 유닛 안에 note 로 적는다** — 추정으로 접지 않는다.
 */
const UNITS: readonly Unit[] = [
  // ── T1 탐색 트리 ────────────────────────────────────────────────────────────
  {
    id: "T1-01",
    track: "T1",
    contract: "정렬 집합 · 전 연산 amortized O(log n)",
    canonical: "tree/splayTree",
    transitions: [],
    note: "한정자를 겨누는 시나리오가 필수(§규약1 4단계). fixture 는 splayingSearchTree 재사용 — redBlackTree 계약에서 걸리는 것이 여기서는 통과해야 한다",
  },
  {
    id: "T1-02",
    track: "T1",
    contract: "정렬 집합 · 전 연산 expected O(log n)",
    canonical: "tree/treap",
    transitions: [],
    note: "축3 통계가 seed 별 중앙값이다. B11 이 만들다 뺀 결정론적 우선순위 입력을 시나리오로 쓰지 않는다(불변 사실 44)",
  },
  {
    id: "T1-03",
    track: "T1",
    contract: "정렬 집합 · 조회 worst + 갱신 amortized O(log n)",
    canonical: "tree/scapegoatTree",
    transitions: [],
    note: "한정자가 연산마다 갈리는 첫 계약",
  },
  {
    id: "T1-04",
    track: "T1",
    contract: "정렬 집합 · 상한 없음",
    canonical: "tree/binarySearchTree",
    transitions: [],
    note: "등급이 complexity 가 아니다(불변 사실 56 — 자명한 구현이 전 행을 통과). 재집필과 함께 등급을 확정해 VERIFICATION_GRADES 에 박는다",
  },
  {
    id: "T1-05",
    track: "T1",
    contract: "순위 질의를 가진 정렬 다중집합",
    canonical: "tree/orderStatisticTree",
    transitions: [],
    note: "B11 확정 — multiset 을 담는다(포섭이므로 다른 구조)",
  },
  {
    id: "T1-06",
    track: "T1",
    contract: "수열에서 만드는 트리 (미확정)",
    canonical: "tree/cartesianTree",
    transitions: [],
    note: "불변 구조일 수 있다 — 그렇다면 불변 사실 52 의 넷을 적용한다",
  },
  {
    id: "T1-07",
    track: "T1",
    contract: "동적 트리 · amortized O(log n)",
    canonical: "tree/linkCutTree",
    transitions: [],
    note: "",
  },

  // ── T2 우선순위 큐 ──────────────────────────────────────────────────────────
  {
    id: "T2-01",
    track: "T2",
    contract: "기본 우선순위 큐",
    canonical: "heap/priorityQueue",
    transitions: ["heap/minHeap", "heap/maxHeap", "heap/daryHeap"],
    note: "정본 이름이 임시가 아니다(불변 사실 66 — ADT 이름이라 KAN-031 로 안 넘긴다). 전환 셋은 정본이 선 뒤 서로 병렬",
  },
  {
    id: "T2-02",
    track: "T2",
    contract: "합칠 수 있는 우선순위 큐 (merge)",
    canonical: "heap/leftistHeap",
    transitions: ["heap/binomialHeap"],
    note: "정본 이름은 **임시**다(불변 사실 64) — 구현 이름뿐이라 계약 이름은 KAN-031 이 정한다",
  },
  {
    id: "T2-03",
    track: "T2",
    contract: "상수 시간 넣기·합치기",
    canonical: "heap/pairingHeap",
    transitions: [],
    note: "T2-02 와 상한이 로그 인수 하나 차이라 축3이 못 가른다(불변 사실 53). 한정자로 보이므로 「넣기 n 번 뒤 빼기 한 번」 시나리오가 필수",
  },
  {
    id: "T2-04",
    track: "T2",
    contract: "키 낮추기를 가진 우선순위 큐",
    canonical: "heap/fibonacciHeap",
    transitions: [],
    note: "decreaseKey 상각 O(1) 이 계약. 연산 유무로 갈리므로 축1이 본다",
  },
  {
    id: "T2-05",
    track: "T2",
    contract: "정수 우주 위의 정렬 집합 · O(log log u)",
    canonical: "heap/vanEmdeBoasTree",
    transitions: [],
    note: "**Bound 확장 판정을 동반한다** — n 이 아닌 것이 상한에 들어오는 첫 사례다. 늘리기 전에 겹침부터 본다(불변 사실 53). 판정 결과를 §규약2 에 적는다",
  },

  // ── T3 사전·집합·분리집합 ───────────────────────────────────────────────────
  {
    id: "T3-01",
    track: "T3",
    contract: "사전 (키→값)",
    canonical: "hash/hashMapChaining",
    transitions: ["hash/hashMapOpenAddressing"],
    note: "B15·B19 확정 — 갈리려던 자리가 표현과 적재율이라 계약의 문장이 못 된다. 정본 이름은 **임시**(불변 사실 64)",
  },
  {
    id: "T3-02",
    track: "T3",
    contract: "집합 (합·교·차집합)",
    canonical: "hash/hashSet",
    transitions: [],
    note: "B19 확정 — 사전과 서로 담지 않는다(불변 사실 54). 사전은 get(key): V 를, 집합은 집합 연산을 요구한다",
  },
  {
    id: "T3-03",
    track: "T3",
    contract: "용량 정책을 가진 사전 (LRU)",
    canonical: "hash/lruCache",
    transitions: [],
    note: "용량이 관측 연산을 가지면 계약에 들어온다(불변 사실 67 — circularBuffer 와 같은 자리)",
  },
  {
    id: "T3-04",
    track: "T3",
    contract: "분리 집합",
    canonical: "disjoint-set/unionFind",
    transitions: [],
    note: "**Bound 를 늘리지 않는다**(B19 확정 — 역아커만이 O(1) 구간과 겹쳐 아무것도 배제하지 못한다)",
  },
  {
    id: "T3-05",
    track: "T3",
    contract: "되돌릴 수 있는 분리 집합",
    canonical: "disjoint-set/disjointSetRollback",
    transitions: [],
    note: "B19 확정 — unionFind 와 다르다(되돌리기가 경로 압축을 막는다)",
  },

  // ── T4 구간 질의·공간 ───────────────────────────────────────────────────────
  {
    id: "T4-01",
    track: "T4",
    contract: "앞구간 합",
    canonical: "range-query/fenwickTree",
    transitions: [],
    note: "B19 확정 — segmentTree 와 다르다(반례가 연산 하나)",
  },
  {
    id: "T4-02",
    track: "T4",
    contract: "임의 구간 · 임의 결합",
    canonical: "range-query/segmentTree",
    transitions: [],
    note: "B19 확정 — 셋이 전부 다르다",
  },
  {
    id: "T4-03",
    track: "T4",
    contract: "구간 갱신을 가진 구간 질의",
    canonical: "range-query/segmentTreeLazy",
    transitions: [],
    note: "",
  },
  {
    id: "T4-04",
    track: "T4",
    contract: "옛 버전 접근을 가진 구간 질의",
    canonical: "range-query/persistentSegmentTree",
    transitions: [],
    note: "공간이 대가인 구조 — 불변 사실 67 의 물음을 쓴다(그 제약을 관측하는 연산이 계약에 있는가)",
  },
  {
    id: "T4-05",
    track: "T4",
    contract: "불변 구조 위의 구간 질의",
    canonical: "range-query/sparseTable",
    transitions: [],
    note: "**불변 구조다** — 불변 사실 52 의 넷을 그대로 적용한다(축2 · 인자 없는 질의 · 구성 시점 · 껍데기 팩토리)",
  },
  {
    id: "T4-06",
    track: "T4",
    contract: "다차원 최근접·범위 질의",
    canonical: "spatial/kdTree",
    transitions: [],
    note: "B19 확정 — quadtree 와 다르다",
  },
  {
    id: "T4-07",
    track: "T4",
    contract: "평면 분할 질의",
    canonical: "spatial/quadtree",
    transitions: [],
    note: "",
  },

  // ── T5 선형·확률·기타 ───────────────────────────────────────────────────────
  {
    id: "T5-01",
    track: "T5",
    contract: "고정 용량 수열 (isFull 관측)",
    canonical: "linear/circularBuffer",
    transitions: [],
    note: "**불변 사실 67 의 실물이다** — 시간 상한을 하나도 쓰지 않고 queue 와 갈린다. 「공간이 존재 이유」 13 건의 판정 선례가 된다",
  },
  {
    id: "T5-02",
    track: "T5",
    contract: "편집 지역성을 가진 수열 (미확정)",
    canonical: "linear/gapBuffer",
    transitions: [],
    note: "공간 표시. 존재 이유가 계약의 문장이 되는지부터 본다 — 안 되면 B15 처분(존치 + 성격 전환)",
  },
  {
    id: "T5-03",
    track: "T5",
    contract: "원본 불변 + 조각 목록 (미확정)",
    canonical: "linear/pieceTable",
    transitions: [],
    note: "같음. T5-02 와 같은 계약인지도 함께 본다",
  },
  {
    id: "T5-04",
    track: "T5",
    contract: "정렬 집합 · expected O(log n)",
    canonical: "probabilistic/skipList",
    transitions: [],
    note: "**T1-02(treap)와 계약이 같을 수 있다** — 둘 다 정렬 집합 expected 다. T1-02 가 먼저 서면 이 유닛은 성격 전환이 된다. 두 트랙에 걸친 유일한 자리라 T1-02 완료를 확인하고 착수한다",
  },
  {
    id: "T5-05",
    track: "T5",
    contract: "지울 수 있는 근사 소속 집합",
    canonical: "probabilistic/cuckooFilter",
    transitions: [],
    note: "**「같은계약?」 판정이 유일하게 남은 자리다**(B19 인계). bloomFilter 와 갈리는 자리가 지우기인데 bloomFilter 는 A군이라 등급으로 먼저 가른다(불변 사실 56). 재집필 전에 판정을 먼저 낸다",
  },
  {
    id: "T5-06",
    track: "T5",
    contract: "미확정 — 자료구조인지부터",
    canonical: "tree/huffmanTree",
    transitions: [],
    note: "축밖 표시. 알고리즘 산출물이면 계약이 서지 않는다 — 그 판정 자체가 이 유닛의 산출",
  },
  {
    id: "T5-07",
    track: "T5",
    contract: "증명 검증을 가진 불변 구조",
    canonical: "tree/merkleTree",
    transitions: [],
    note: "**불변 구조다** — 불변 사실 52 의 넷을 적용한다. T4-05 와 같은 처리라 둘 중 뒤에 도는 쪽이 앞의 선례를 쓴다",
  },
  {
    id: "T5-08",
    track: "T5",
    contract: "다중 패턴 동시 매칭",
    canonical: "trie/ahoCorasick",
    transitions: [],
    note: "",
  },

  // ── TA A군 (KAN-026) ────────────────────────────────────────────────────────
  // A군 16종 + B군에서 이관된 cuckooFilter = 17종을 16 유닛으로 접은 것. 판정 전문은
  // docs/ORD-006-conventions.md 「A군 17종 판정」. 접힌 것은 TA-01 하나이고 그 정본
  // (ternarySearchTree)은 이미 섰으므로 A군 밖 구조가 하나 더 세어진다.
  // 사람 결정 넷은 2026-09-15 에 내려졌다 — 해당 유닛 note 가 「결정(2026-09-15 유저)」으로 시작한다.
  {
    id: "TA-01",
    track: "TA",
    contract: "문자열 집합 · 접두사 질의 (B15 계약)",
    canonical: "trie/ternarySearchTree",
    transitions: ["trie/trie", "trie/radixTree"],
    note: "완료(KAN-026 S2 · S3) — 정본은 TST 에 둔다(임시, 불변 사실 64 · 이름은 KAN-031). 전환 둘은 같은 계약 객체 + 기법별 정본. 꼬리를 새 문자열로 만드는 쪼개기가 O(m) 을 어기는 것을 실측(r = 3.99)했고, S20 이 정본 스위트에 「곁에 긴 낱말」 insert · delete 둘을 넣어 그 구현이 걸린다(불변 사실 216 · 222). 앞 다섯 시나리오는 여전히 그 위반을 통과시킨다",
  },
  {
    id: "TA-02",
    track: "TA",
    contract: "앞에 넣기·뒤에 넣기·앞에서 빼기가 상수인 수열",
    canonical: "linear/singlyLinkedList",
    transitions: [],
    note: "완료(KAN-026 S4) — 마디 핸들 · 공개 next 를 뺐고 물려받은 find 도 뺐다(toArray 와 같은 계급이라 배제 없음, 불변 사실 224). 빼는 끝이 하나라 두 무더기 구현이 살아 removeFirst 가 amortized(불변 사실 225). invariant(불변식 1)",
  },
  {
    id: "TA-03",
    track: "TA",
    contract: "첨자 접근 + 뒤 끝 넣기·빼기 수열",
    canonical: "linear/dynamicArray",
    transitions: [],
    note: "완료(KAN-026 S6) — capacity() 와 늘리기·줄이기 정책을 뺐다. 범위 밖 첨자는 get 이 null · set 이 RangeError(연산마다 판별, 불변 사실 226). 정본은 칸을 직접 옮기며 세어 push · pop 의 amortized 근거가 계측에 보인다(불변 사실 227). 경계 교대 시나리오는 칸 수가 사다리와 맞는 구현만 겨눈다(불변 사실 228). S23 · S29 — 목적 기준(원칙 A5′)으로 toArray 를 빼 불변식 둘의 한쪽 경로가 사라져 basic(처음 invariant)",
  },
  {
    id: "TA-04",
    track: "TA",
    contract: "위치 핸들로 상수 시간 끼우기·빼기를 하는 수열",
    canonical: "linear/doublyLinkedList",
    transitions: [],
    note: "완료(KAN-026 S5) — 핸들 모형을 헤더가 적는다(넣은 원소 하나를 가리킨다 · 그 원소를 빼는 호출로만 죽는다 · 죽은 핸들과 다른 수열 핸들은 insertAfter null · remove false, 불변 사실 270). 공개 prev·next·ListNode 를 뺐다. 하네스는 고치지 않고 핸들을 번호로 부른다(불변 사실 271). 값 끌어오기 우회가 축3 전부를 통과하고 축1에서 걸린다(불변 사실 272). 링크 정합은 불변식이 아니지만 이음을 빠뜨린 정본 변이 넷이 전부 축2·축1에 걸린다(불변 사실 273). invariant(불변식 1)",
  },
  {
    id: "TA-05",
    track: "TA",
    contract: "한쪽 끝에서 넣고 빼며 최댓값을 상수에 묻는 스택 (비교자 주입)",
    canonical: "linear/monotonicStack",
    transitions: [],
    note: "완료(KAN-026 S7) — 상태 없는 함수 셋을 빼고 stack 다섯 행 + max 로 새로 지었다. 다른 후보(넣을 때 가장 가까운 큰 원소)는 빼기와 함께면 이름의 기법이 한 쌍 담긴 수에 비례해(탐침) 배제 — 선택은 사람 결정으로 올렸다(불변 사실 276). 짝 배열이 자명해 basic, 빼는 끝 하나로 TA-06 과 등급이 갈린다(불변 사실 277). 최솟값은 뒤집은 비교자로 접힘을 축1로 실행(불변 사실 279). 가이드 링크 2 교체",
  },
  {
    id: "TA-06",
    track: "TA",
    contract: "뒤에 넣고 앞에서 빼며 최댓값을 묻는 큐 (비교자 주입)",
    canonical: "linear/monotonicQueue",
    transitions: [],
    note: "완료(KAN-026 S8) — slidingWindowMax·Min 을 빼고 queue 다섯 행 + max 로 새로 지었다(창 크기는 구조가 들지 않는다). complexity — 자명한 길 넷이 각자 한 행을 놓고 그중 셋이 fixture 로 서로 다른 행에서 걸린다(불변 사실 280). enqueue·dequeue 를 서로 다른 계열이 상각으로만 지켜 둘 다 amortized(불변 사실 278). 가이드 링크 3 교체 — slidingWindowMaximum:100 문장은 「덱」을 가리켜 뜻이 어긋난다(불변 사실 282)",
  },
  {
    id: "TA-07",
    track: "TA",
    contract: "정점을 늘릴 수 있고 이웃 열거가 차수에 비례하는 그래프",
    canonical: "graph-repr/graphAdjList",
    transitions: [],
    note: "완료(KAN-026 S9) — 정점 번호는 구조가 [0, n) 으로 매긴다(사전 미결 회피, TA-09 가 따른다). bfs·dfs·hasPath 는 뺐다. 차수 d 상한은 고리·별 두 끝으로 잰다(불변 사실 209–211)",
  },
  {
    id: "TA-08",
    track: "TA",
    contract: "정점 수 고정 · 인접 여부와 가중치가 상수인 그래프",
    canonical: "graph-repr/graphAdjMatrix",
    transitions: [],
    note: "완료(KAN-026 S10) — 판별 셋째 걸음을 축3으로 돌려 계약이 갈림을 확정(이웃 배열 구현이 쌍 연산 넷에서 걸린다, 불변 사실 212). hasEdge 를 상수보다 약하게 적으면 TA-07 과의 판정이 다시 열린다",
  },
  {
    id: "TA-09",
    track: "TA",
    contract: "사이클을 만드는 간선을 거부하는 방향 그래프",
    canonical: "graph-repr/dag",
    transitions: [],
    note: "완료(KAN-026 S11) — 사이클을 닫는 간선은 false(전면화) · 순서는 하나로 정하지 않고 껍데기가 판정(true|어긋남)으로 관측한다(불변 사실 284–285). longestPath·무게·hasCycle 을 뺐다. addEdge 상한은 「닿는 부분」 k(u, v) — S25 가 k 를 그래프와 넣는 간선만으로 정하고(A(u, v) = u 에 오는 정점 ∪ v 에서 가는 정점, k = |A| + A 에 닿는 간선 수) 국소 갱신 비용을 목적으로 적었다(2026-09-16 검토 결정). 비순환은 불변식이 아니다(286). invariant(불변식 1)",
  },
  {
    id: "TA-10",
    track: "TA",
    contract: "없음 — 자료구조가 아니다(S1)",
    canonical: "hash/rollingHash",
    transitions: [],
    transferredTo: "KAN-039-FG8HWZ",
    note: "이관 — 이 카드(KAN-026)의 종료 범위에서 뺐다(2026-09-15 유저 결재 「가」 · 2026-09-16 검토 결정). 판정: 상태가 생성자 인자뿐이고 search 가 algorithms/string/findAllOccurrences 와 서명·의미가 같아 자료구조가 아니다(불변 사실 200 · conventions 「A군 17종 판정」 ⑥). 이 카드에서 옮기지 않은 이유: 알고리즘 목록 편 수를 algo-wbs.test 가 111 로 고정하고 가이드 없는 편을 셀 자리가 없으며 옛 mdx 를 둘 자리가 없다(불변 사실 288). KAN-039 가 인수하는 것: 알고리즘 트랙 한 편(문제 서술 · 함수 · 테스트 · v2 가이드)으로 옮기기 · 목록 링크와 algo-wbs 기대값 · ord004-manifest · inventory 행 · 이 디렉터리 걷기. 걷히면 경로 가드가 exit 1 로 이 유닛을 지우라고 알린다 — 그때 이 유닛을 지운다",
  },
  {
    id: "TA-11",
    track: "TA",
    contract: "고정 크기 불리언 수열 (B15 처분 · 짝 정본 없음)",
    canonical: "linear/bitArray",
    transitions: [],
    note: "완료(KAN-026 S13) — 짝 정본이 없는 B15 처분이라 헤더가 계약을 적고 판별 세 걸음을 실행했다 — 자리마다 불리언 하나인 구현이 네 축을 정본과 같은 값으로 통과(불변 사실 289). count·toggle 은 여러 번 불러 같은 계급이라 뺐고 불변식 후보가 사라져 basic — S1 예상 invariant 에서 갈림(290). 범위 밖 첨자는 세 연산 RangeError · 자리 수 0 허용(291) · 생성자 행을 껍데기 연산으로 축1에 올렸다(292). 메모리 직접 사용 목록 미편입 — 정본이 Uint32Array 에 상태를 두는 것이 조건(296)",
  },
  {
    id: "TA-12",
    track: "TA",
    contract: "지우지 않는 근사 소속 집합",
    canonical: "probabilistic/bloomFilter",
    transitions: [],
    note: "완료(KAN-026 S14) — 오차 보장을 축1 연산 하나(falsePositiveCheck)로 판정한다 — 새 필터에 고정 seed 원소 n 개를 넣고 64/ε 개를 물어 참 ≤ 128(여유 2), 모델은 늘 true, 하네스 무수정(불변 사실 297). 확률의 출처는 구현이 뽑는 무작위 — 고정 해시는 계약 위반인 채 통과(298). 여유는 경계 구현이 판정 8,000 회에서 0 회 떨어지는 값(299). 생성자는 (용량, 목표 ε), 원소는 문자열 고정 · 주입 없음(351). add · has expected O(L · log(1/ε)) · basic",
  },
  {
    id: "TA-13",
    track: "TA",
    contract: "지울 수 있는 근사 소속 다중집합 · 가득 참을 관측",
    canonical: "probabilistic/cuckooFilter",
    transitions: [],
    note: "완료(KAN-026 S19) — TA-12 의 판정 방식을 여섯 판정으로 나눠 쓴다(errorCheck). add 의 거절을 결정적 문장으로 적었다 — 용량 미만이고 has 가 거짓인 원소는 거절하지 않는다, 밀어내기 상한에서 거절하는 흔한 뻐꾸기는 계약 위반(불변 사실 353). 등급은 add 한정자가 아니라 칸마다 세는 블룸 필터(자명)가 정해 basic(354). delete 는 사본 없는 원소에도 정의하고 결정적 보장의 범위를 헷갈린 지우기 전으로 둔다(355). size · loadFactor 제거(357). bloomFilter 와 반례 셋 실행(356). T5-05 에서 이관 — KAN-027 병합 전까지 이 워크트리에서 두 번 세어진다",
  },
  {
    id: "TA-14",
    track: "TA",
    contract: "과소 추정 없는 빈도 추정",
    canonical: "probabilistic/countMinSketch",
    transitions: [],
    note: "완료(KAN-026 S15) — TA-12 의 판정 모양 그대로(overestimateCheck — 흐름 뒤 넣지 않은 원소 64/δ 개, ε·N 초과 ≤ 128, 여유 2 — 경계 구현 8,000 회 0 실패, 불변 사실 360 · 361). 결정적 쪽은 추정 ≥ 실제 빈도 하나, 안 넣은 원소는 0 이상(207). 생성자 (ε, δ) · 증분 0 이상 안전한 정수 · 총증분 초과 RangeError(362). update · estimate expected O(L · log(1/δ)) · basic — 증분 전체 합은 오차 판정만 잡는다(363). -problem.md 는 도구 차단으로 남았다 — 사람이 지운다",
  },
  {
    id: "TA-15",
    track: "TA",
    contract: "서로 다른 원소 수 추정 · 합치기",
    canonical: "probabilistic/hyperLogLog",
    transitions: [],
    note: "완료(KAN-026 S16) — 판정 모양은 TA-12 를 따르되 인스턴스마다 모은다(errorCheck — ⌈16/δ⌉ 개 중 ε·n 초과 ≤ 48, 여유 3 은 이항 꼬리로 골랐다, 불변 사실 360 · 361). 결정적 쪽은 「같은 실행 · 같은 (ε, δ) 에서 추정은 들어온 원소 집합의 함수」 한 문장(365). 합치기는 정확한 집합을 merge 행에서만 배제해 남았다(364). 그 때문에 해시 무작위를 실행이 한 번 뽑는다 — 사람 결정 대기(366). error() · precision 제거. add O(L · log(1/δ)) · count · merge O(1/(ε²·δ)) · basic(367). 자리 16 고정 구현은 무작위 시퀀스를 통과하고 경계 케이스가 잡는다(368). -problem.md 는 도구 차단으로 남았다 — 사람이 지운다",
  },
  {
    id: "TA-16",
    track: "TA",
    contract: "두 집합의 자카드 닮음 추정",
    canonical: "probabilistic/minHash",
    transitions: [],
    note: "완료(KAN-026 S17) — 표면을 원소 단위 add + 인스턴스 similarity(other) 로 고쳐 상태를 쌓았다(덮어쓰는 update(set) · signature() · exact() · numHashes 제거, 불변 사실 371). 결정적 쪽은 「같은 실행 · 같은 (ε, δ) 에서 닮음은 두 집합의 짝만으로 정해지고 같은 집합이면 1」(372). similarity 가 정확한 집합을 상한으로 배제(373). 오차 판정은 인스턴스 짝마다 모은다(errorCheck — ⌈16/δ⌉ 짝 중 ε 초과 ≤ 48, 여유 3, 374). 해시 무작위를 실행이 한 번 뽑는다 — 366 과 같은 사람 결정에 매달림(375). add O(L/(ε²·δ)) · similarity O(1/(ε²·δ)) expected · basic(376). 늘 1 은 가벼운 첫 판정 모양을 통과해 판정 모양의 틈을 적었다(378)",
  },
];

/**
 * 유닛 하나. 필드 대부분은 위 `UnitFields` 이고, 이관 필드만 여기서 붙인다 — 붙이는 자리를 `UNITS` 뒤로 둔 것은
 * `UNITS` 안의 줄을 다른 문서가 `tools/ord006-wbs.ts:<줄>` 로 인용하기 때문이다(불변 사실 81).
 */
type Unit = UnitFields & {
  /**
   * 이 유닛을 **인수한 다른 카드의 id**(예: `"KAN-039-FG8HWZ"`). 적으면 이 유닛은 완료도 미완료도 아닌
   * `transferred`(이관)로 세고, 트랙의 분모에서 빠지며, claim 후보가 되지 않는다 — 트랙이 이 유닛을
   * 기다리며 멈춰 있는 것처럼 보이지 않게 하고(교착), 끝나지 않은 유닛을 완료로 세지도 않게 한다.
   * **경로 가드는 그대로 걸린다** — 인수한 카드가 디렉터리를 옮기거나 걷으면 `exit 1` 로 이 유닛을
   * 지우라고 알린다. 판정 전문과 인수 범위는 `note` 에 적는다. 이관이 아니면 적지 않는다.
   */
  readonly transferredTo?: string;
};

type UnitState = "open" | "partial" | "done" | "transferred";

type UnitStatus = {
  readonly unit: Unit;
  readonly state: UnitState;
  readonly canonicalDone: boolean;
  readonly transitionsDone: readonly string[];
  readonly transitionsOpen: readonly string[];
};

async function isDir(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

/** 구조가 끝났는가 = `_reference/` 가 있는가. 규약4 (가) 등급은 B군에 없다(C군 1종뿐). */
async function hasReference(structure: string): Promise<boolean> {
  return isDir(join(scanRoot, structure, "_reference"));
}

async function statusOf(unit: Unit): Promise<UnitStatus> {
  const canonicalDone = await hasReference(unit.canonical);
  const done: string[] = [];
  const open: string[] = [];
  for (const t of unit.transitions) {
    if (await hasReference(t)) done.push(t);
    else open.push(t);
  }
  const state: UnitState =
    unit.transferredTo !== undefined
      ? "transferred"
      : !canonicalDone
        ? "open"
        : open.length > 0
          ? "partial"
          : "done";
  return {
    unit,
    state,
    canonicalDone,
    transitionsDone: done,
    transitionsOpen: open,
  };
}

// 유닛에 적힌 경로가 실제 디렉터리와 어긋나면(오타·KAN-031 의 이동) 조용히 `open` 으로 새지
// 않도록 여기서 멈춘다. ord006-inventory.ts 의 판정 표 가드와 같은 규칙이다.
const missing: string[] = [];
for (const unit of UNITS) {
  for (const s of [unit.canonical, ...unit.transitions]) {
    if (!(await isDir(join(scanRoot, s)))) missing.push(`${unit.id}: ${s}`);
  }
}
if (missing.length > 0) {
  console.error(
    `[ord006-wbs] 유닛이 가리키는 구조가 없다 — 경로가 바뀌었으면 UNITS 를 함께 고친다:\n  ${missing.join("\n  ")}`,
  );
  process.exit(1);
}

const statuses = await Promise.all(UNITS.map(statusOf));
const byTrack = new Map<string, UnitStatus[]>();
for (const s of statuses) {
  const list = byTrack.get(s.unit.track) ?? [];
  list.push(s);
  byTrack.set(s.unit.track, list);
}

/**
 * claim 후보 = 트랙별로 **가장 앞선 미완 유닛 하나**.
 * `partial` 이 `open` 보다 앞이다 — 정본이 선 계약의 전환은 배치가 가볍고, 미완으로 두면
 * 그 계약의 스위트가 정본 하나로만 검증된 채 남는다(B22 가 그 자리를 닫았다).
 */
function claimOf(list: readonly UnitStatus[]): UnitStatus | undefined {
  return (
    list.find((s) => s.state === "partial") ??
    list.find((s) => s.state === "open")
  );
}

/** 한글은 터미널에서 두 칸을 먹는다. String.padEnd 는 한 칸으로 세므로 열이 어긋난다. */
function padDisplay(text: string, width: number): string {
  let cells = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    cells += code >= 0x1100 && code <= 0xffe6 ? 2 : 1;
  }
  return text + " ".repeat(Math.max(0, width - cells));
}

/** 이관 유닛은 분모에서 뺀다 — 이 WBS 가 끝낼 일이 아니다(`Unit.transferredTo`). */
const inScope = statuses.filter((s) => s.state !== "transferred");
const transferredAll = statuses.filter((s) => s.state === "transferred");
const structuresOf = (list: readonly UnitStatus[]) =>
  list.reduce((n, s) => n + 1 + s.unit.transitions.length, 0);
const totalStructures = structuresOf(inScope);
const doneStructures = inScope.reduce(
  (n, s) => n + (s.canonicalDone ? 1 : 0) + s.transitionsDone.length,
  0,
);

/** 트랙 한 줄의 분수 뒤에 붙는 이관 표시. 이관이 없으면 빈 문자열. */
function transferNote(list: readonly UnitStatus[]): string {
  const moved = list.filter((s) => s.state === "transferred");
  if (moved.length === 0) return "";
  const targets = [...new Set(moved.map((s) => s.unit.transferredTo))];
  return ` (+${moved.length} 이관 → ${targets.join(" · ")})`;
}

if (process.argv.includes("--json")) {
  console.log(
    JSON.stringify(
      {
        // 이관 유닛은 totalUnits · units 에 들지 않고 transferred 에 따로 나온다.
        totalUnits: inScope.length,
        doneUnits: inScope.filter((s) => s.state === "done").length,
        totalStructures,
        doneStructures,
        transferredUnits: transferredAll.length,
        tracks: TRACKS.map((t) => {
          const list = byTrack.get(t.id) ?? [];
          const claim = claimOf(list);
          return {
            ...t,
            units: list.filter((s) => s.state !== "transferred").length,
            done: list.filter((s) => s.state === "done").length,
            transferred: list
              .filter((s) => s.state === "transferred")
              .map((s) => ({
                id: s.unit.id,
                canonical: s.unit.canonical,
                to: s.unit.transferredTo,
              })),
            claim: claim
              ? {
                  id: claim.unit.id,
                  state: claim.state,
                  canonical: claim.unit.canonical,
                  contract: claim.unit.contract,
                  open:
                    claim.state === "partial"
                      ? claim.transitionsOpen
                      : [claim.unit.canonical],
                  note: claim.unit.note,
                }
              : null,
          };
        }),
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

console.log(
  `ORD-006 B군 WBS — ${inScope.length} 유닛 / ${totalStructures} 종  (완료 ${doneStructures}종)${
    transferredAll.length > 0
      ? `  · 이관 ${transferredAll.length} 유닛 / ${structuresOf(transferredAll)} 종은 셈에서 뺐다`
      : ""
  }\n`,
);

for (const t of TRACKS) {
  const list = byTrack.get(t.id) ?? [];
  const done = list.filter((s) => s.state === "done").length;
  const moved = list.filter((s) => s.state === "transferred").length;
  const scope = list.length - moved;
  const bar = `${"#".repeat(done)}${".".repeat(scope - done)}${">".repeat(moved)}`;
  const claim = claimOf(list);
  const head = `[${t.id}] ${padDisplay(t.title, 22)} ${padDisplay(bar, 9)} ${done}/${scope}${transferNote(list)}  불변사실 ${t.facts}`;
  if (!claim) {
    console.log(
      `${head}  -- 트랙 완료${moved > 0 ? " (이관 유닛은 인수한 카드가 끝낸다)" : ""}`,
    );
    continue;
  }
  const target =
    claim.state === "partial"
      ? `${claim.unit.id} 성격전환 ${claim.transitionsOpen.join(" · ")}`
      : `${claim.unit.id} ${claim.unit.canonical}`;
  console.log(`${head}\n${" ".repeat(9)}claim -> ${target}`);
}

if (process.argv.includes("--all")) {
  console.log("\n전 유닛");
  for (const t of TRACKS) {
    console.log(`\n[${t.id}] ${t.title}`);
    for (const s of byTrack.get(t.id) ?? []) {
      const mark =
        s.state === "done"
          ? "x"
          : s.state === "partial"
            ? "~"
            : s.state === "transferred"
              ? ">"
              : " ";
      const extra =
        (s.unit.transitions.length > 0
          ? ` (+전환 ${s.transitionsDone.length}/${s.unit.transitions.length})`
          : "") +
        (s.unit.transferredTo !== undefined
          ? ` (이관 → ${s.unit.transferredTo})`
          : "");
      console.log(`  [${mark}] ${s.unit.id}  ${s.unit.canonical}${extra}`);
      console.log(`        ${s.unit.contract}`);
      if (s.unit.note) console.log(`        ! ${s.unit.note}`);
    }
  }
}

console.log(
  "\n규격: docs/ORD-006-wbs.md  |  배치 진입: docs/ORD-006-runbook.md  |  확정 규약: docs/ORD-006-conventions.md",
);
