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
  { id: "TA", title: "A군 계약 전환", facts: "200-229" },
];

type Unit = {
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
    note: "결정(2026-09-15 유저) — 정본은 TST 에 둔다(임시, 불변 사실 64 · 이름은 KAN-031). 그래서 전환 둘이 순서 없이 열린다. radixTree 는 가지를 쪼갤 때 꼬리를 문자열로 복사하면 O(m) 을 어긴다 — 논증, 미실측",
  },
  {
    id: "TA-02",
    track: "TA",
    contract: "앞에 넣기·뒤에 넣기·앞에서 빼기가 상수인 수열 + 값 찾기",
    canonical: "linear/singlyLinkedList",
    transitions: [],
    note: "결정(2026-09-15 유저) — 연결 마디는 자명한 구현이다 → complexity 아님(deque 근거 재판정은 별도 카드). 받는 연산이 없는 마디 핸들과 공개 next 는 표현 누출",
  },
  {
    id: "TA-03",
    track: "TA",
    contract: "첨자 접근 + 뒤 끝 넣기·빼기 수열",
    canonical: "linear/dynamicArray",
    transitions: [],
    note: "capacity() 와 늘리기·줄이기 정책은 어느 행의 의미도 안 바꾸는 표현 관측이라 표면에서 빠진다(avlTree.height 와 같은 자리). 언어 배열 위임은 불변 사실 197 로 자명한 구현이다",
  },
  {
    id: "TA-04",
    track: "TA",
    contract: "위치 핸들로 상수 시간 끼우기·빼기를 하는 수열",
    canonical: "linear/doublyLinkedList",
    transitions: [],
    note: "결정(2026-09-15 유저) — TA-02 와 같다(연결 마디 자명, complexity 아님). TA-02 와 갈리는 행이 remove(node) 이고 「다른 핸들은 그대로 유효하다」를 적어야 반례가 선다. 「앞뒤 링크 정합」은 표현 성질이라 불변식 후보가 아니다(불변 사실 36)",
  },
  {
    id: "TA-05",
    track: "TA",
    contract: "미확정 — 현재 표면은 상태 없는 함수 셋",
    canonical: "linear/monotonicStack",
    transitions: [],
    note: "결정(2026-09-15 유저) — 상태 있는 계약으로 연산 집합을 바꾼다(T5-02 선례). 알고리즘 가이드 링크 교체는 어느 쪽이든 남는다",
  },
  {
    id: "TA-06",
    track: "TA",
    contract: "미확정 — 추천은 「뒤에 넣고 앞에서 빼며 최댓값을 묻는 큐」",
    canonical: "linear/monotonicQueue",
    transitions: [],
    note: "결정(2026-09-15 유저) — TA-05 와 같다(상태 있는 계약, 큐는 「뒤에 넣고 앞에서 빼며 최댓값을 묻는 큐」). slidingWindowMax 가 algorithms/array/slidingWindowMaximum 과 서명·의미가 같다. 상태 있는 계약이면 최솟값은 비교자 주입으로 접힌다",
  },
  {
    id: "TA-07",
    track: "TA",
    contract: "정점을 늘릴 수 있고 이웃 열거가 차수에 비례하는 그래프",
    canonical: "graph-repr/graphAdjList",
    transitions: [],
    note: "bfs·dfs·hasPath 는 이웃 열거에서 유도되고 순서가 이웃 순서에 기댄다 — 남기면 처방. 정점 id 를 임의 정수로 받으면 언어 사전 미결(T3-01)에 걸려 등급이 흔들린다",
  },
  {
    id: "TA-08",
    track: "TA",
    contract: "정점 수 고정 · 인접 여부와 가중치가 상수인 그래프",
    canonical: "graph-repr/graphAdjMatrix",
    transitions: [],
    note: "공간 표시지만 계약이 갈린다(불변 사실 204) — 판별 셋째 걸음(축3)을 이 유닛이 돌린다. 안 갈리면 B15 처분으로 되돌린다. hasEdge 를 상수보다 약하게 적으면 TA-07 과의 판정이 다시 열린다",
  },
  {
    id: "TA-09",
    track: "TA",
    contract: "사이클을 만드는 간선을 거부하는 방향 그래프",
    canonical: "graph-repr/dag",
    transitions: [],
    note: "자료구조다(S1). 위상 순서는 하나로 정하지 않는 관측 연산으로 들어온다 — Kahn·DP 는 처방. hasCycle() 은 늘 거짓이라 배제하는 것이 없다. TA-07 과는 동시에 만족하는 구현이 없다(불변 사실 181 모양)",
  },
  {
    id: "TA-10",
    track: "TA",
    contract: "없음 — 자료구조가 아니다(S1)",
    canonical: "hash/rollingHash",
    transitions: [],
    note: "결정(2026-09-15 유저) — 알고리즘 트랙으로 이관한다. search 가 algorithms/string/findAllOccurrences 와 서명·의미가 같다. 디렉터리가 사라지면 이 유닛을 지운다 — 경로 가드가 exit 1 로 잡는다",
  },
  {
    id: "TA-11",
    track: "TA",
    contract: "고정 크기 불리언 수열 (B15 처분 · 짝 정본 없음)",
    canonical: "linear/bitArray",
    transitions: [],
    note: "공간 제약을 적는 행이 없다 → 존치 + 성격 전환인데 같은 계약의 다른 이름이 없어 자기 계약을 적는다. 메모리 직접 사용 목록에 넣지 않는다(불변 사실 206) — 정본 상태를 typed array 에 둔다는 전제",
  },
  {
    id: "TA-12",
    track: "TA",
    contract: "지우지 않는 근사 소속 집합",
    canonical: "probabilistic/bloomFilter",
    transitions: [],
    note: "결정(2026-09-15 유저) — 오차 보장을 축1 안에서 고정 seed 로 판정한다(불변 사실 202). 결정적 쪽(거짓 음성 없음)은 has 가 늘 참인 구현도 통과한다. 생성자 (size, hashCount) 는 표현 매개변수다",
  },
  {
    id: "TA-13",
    track: "TA",
    contract: "지울 수 있는 근사 소속 다중집합 · 가득 참을 관측",
    canonical: "probabilistic/cuckooFilter",
    transitions: [],
    note: "결정(2026-09-15 유저) — TA-12 와 같다(고정 seed 판정). bloomFilter 와 반례(지우기)로 갈렸고 등급은 add 행 한정자가 정한다. delete 전제조건은 불변 사실 82 로 전면화. T5-05 에서 이관 — KAN-027 병합 전까지 이 워크트리에서 두 번 세어진다",
  },
  {
    id: "TA-14",
    track: "TA",
    contract: "과소 추정 없는 빈도 추정",
    canonical: "probabilistic/countMinSketch",
    transitions: [],
    note: "결정(2026-09-15 유저) — TA-12 와 같다(고정 seed 판정). 문제 문서의 「update 안 한 원소는 0」은 충돌이 있으면 거짓(불변 사실 207). 증분 전체 합을 돌려주는 구현이 결정적 쪽을 통과한다",
  },
  {
    id: "TA-15",
    track: "TA",
    contract: "서로 다른 원소 수 추정 · 합치기",
    canonical: "probabilistic/hyperLogLog",
    transitions: [],
    note: "결정(2026-09-15 유저) — TA-12 와 같다(고정 seed 판정). error() 의 1.04/√m 은 한 구현의 상수라 표면에서 빠진다. 결정적 쪽은 중복에 무감·합치기가 넣은 순서와 무관",
  },
  {
    id: "TA-16",
    track: "TA",
    contract: "두 집합의 자카드 닮음 추정",
    canonical: "probabilistic/minHash",
    transitions: [],
    note: "결정(2026-09-15 유저) — TA-12 와 같다(고정 seed 판정). update(set) 가 서명을 덮어써 상태가 안 쌓인다 — 원소 단위 넣기로 표면을 고칠지 이 유닛이 정한다. exact() 는 참조 모델의 몫",
  },
];

type UnitState = "open" | "partial" | "done";

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
  const state: UnitState = !canonicalDone
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

const totalStructures = UNITS.reduce((n, u) => n + 1 + u.transitions.length, 0);
const doneStructures = statuses.reduce(
  (n, s) => n + (s.canonicalDone ? 1 : 0) + s.transitionsDone.length,
  0,
);

if (process.argv.includes("--json")) {
  console.log(
    JSON.stringify(
      {
        totalUnits: UNITS.length,
        doneUnits: statuses.filter((s) => s.state === "done").length,
        totalStructures,
        doneStructures,
        tracks: TRACKS.map((t) => {
          const list = byTrack.get(t.id) ?? [];
          const claim = claimOf(list);
          return {
            ...t,
            units: list.length,
            done: list.filter((s) => s.state === "done").length,
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
  `ORD-006 B군 WBS — ${UNITS.length} 유닛 / ${totalStructures} 종  (완료 ${doneStructures}종)\n`,
);

for (const t of TRACKS) {
  const list = byTrack.get(t.id) ?? [];
  const done = list.filter((s) => s.state === "done").length;
  const bar = `${"#".repeat(done)}${".".repeat(list.length - done)}`;
  const claim = claimOf(list);
  const head = `[${t.id}] ${padDisplay(t.title, 22)} ${padDisplay(bar, 9)} ${done}/${list.length}  불변사실 ${t.facts}`;
  if (!claim) {
    console.log(`${head}  -- 트랙 완료`);
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
      const mark = s.state === "done" ? "x" : s.state === "partial" ? "~" : " ";
      const extra =
        s.unit.transitions.length > 0
          ? ` (+전환 ${s.transitionsDone.length}/${s.unit.transitions.length})`
          : "";
      console.log(`  [${mark}] ${s.unit.id}  ${s.unit.canonical}${extra}`);
      console.log(`        ${s.unit.contract}`);
      if (s.unit.note) console.log(`        ! ${s.unit.note}`);
    }
  }
}

console.log(
  "\n규격: docs/ORD-006-wbs.md  |  배치 진입: docs/ORD-006-runbook.md  |  확정 규약: docs/ORD-006-conventions.md",
);
