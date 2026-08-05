# ORD-006 P4 잠정 분류 (KAN-025 — B16)

> **잠정 판정이다.** 등급은 계약에서 기계적으로 따라 나오므로 계약을 적기 전에는 확정할 수
> 없다(§규약1 「검증 등급 4종」). 이 문서의 값은 **공수 추정용**이고 확정분이 아니다 —
> `docs/ORD-006-inventory.tsv` 의 `verification_grade` 열에는 넣지 않는다. 그 열은
> `tools/ord006-inventory.ts` 의 결정 맵이 강제하는 확정분 전용이다.
>
> 확정 판정은 각 재집필 카드가 계약을 적을 때 나오고, 그때 결정 맵에 박는다.

## 기준선 — 실제 판정 열

| 등급 | 확정된 구조 |
|---|---|
| `basic` | `linear/stack` · `linear/queue` |
| `invariant` | `linear/xorLinkedList` · `trie/ternarySearchTree` |
| `complexity` | `tree/multiset` · `linear/deque` · `range-query/intervalTree` · `linear/unrolledLinkedList` · `trie/suffixArray` · `trie/suffixTree` |
| `concurrency` | 없다. `probabilistic/concurrentSkipList` 가 KAN-024 에서 첫 사례가 된다 |

## 표시의 뜻

| 표시 | 무엇을 묻는가 | 근거 |
|---|---|---|
| **연산집합** | 자명한 구현(배열 하나·객체 하나)이 물려받은 전 연산을 상한 안에 하는가. 그렇다면 등급이 낮아서가 아니라 **연산 집합이 모자란 것**일 수 있다 | 불변 사실 47 |
| **같은계약?** | 이름이 비슷한 다른 구조와 계약이 같을 수 있다. **등급으로 먼저 갈라 본다** — 등급이 다르면 계약이 같을 수 없다 | 불변 사실 43·54·56 |
| **공간** | 존재 이유가 공간이다. **이 저장소의 계약은 시간만 말하므로** 계약이 그 구조를 지목하지 못할 수 있다 | 불변 사실 58·61 |
| **축밖** | 계약이 담을 성질을 재는 축이 없다(오차 보장·확률적 정확도 등) | 불변 사실 40·45 |
| **Bound** | 상한이 `judge.ts` 의 다섯(`O(1)`·`O(log n)`·`O(sqrt n)`·`O(n)`·`O(n log n)`)에 없다. **늘리기 전에 겹침부터 본다** | 불변 사실 53 |
| **불변구조** | 생성자로 다 지어지고 상태를 바꾸는 연산이 없다. B13 이 확정한 넷을 그대로 적용한다 | 불변 사실 52 |

## 분류

### P4-A군 — `basic`·`invariant` 잠정 (KAN-026) — 16종

| 구조 | 잠정 등급 | 표시 | 근거 한 줄 |
|---|---|---|---|
| `graph-repr/graphAdjList` | `invariant` | 같은계약? | 이웃 목록과 간선 수의 정합이 불변식. 인접 행렬과 계약이 같은지부터 본다 |
| `graph-repr/graphAdjMatrix` | `basic` | 연산집합 · 같은계약? · 공간 | 자명한 2차원 배열로 전 행이 상한 안. 존재 이유가 공간·밀도이고 그것은 계약에 없다 |
| `graph-repr/dag` | `invariant` | 축밖 | 비순환이 불변식. 위상 순서는 알고리즘이라 계약에 들어오는지부터 본다 |
| `hash/rollingHash` | `basic` | 축밖 | 자료구조인지부터 본다 — 상태가 창 하나이고 나머지는 함수다 |
| `linear/dynamicArray` | `basic` | 연산집합 · 같은계약? | 언어 배열이 이미 이 계약이다. 자명한 구현이 전 행을 통과하므로 연산 집합부터 본다 |
| `linear/singlyLinkedList` | `basic` | 연산집합 · 같은계약? | 자명한 배열이 전 행을 더 빠르게 한다. 양방향과 갈리는 자리가 있는지 본다 |
| `linear/doublyLinkedList` | `invariant` | 같은계약? | 앞뒤 링크의 정합이 불변식. 단방향과 계약이 갈리는지 본다 |
| `linear/bitArray` | `basic` | 연산집합 · 공간 | 존재 이유가 공간이다. 시간만 말하는 계약으로는 배열 하나와 갈리지 않는다 — B15 와 같은 자리 |
| `linear/monotonicStack` | `invariant` | — | 단조가 불변식이다. 상한은 자명한 배열로 나온다 |
| `linear/monotonicQueue` | `invariant` | — | 같음. 창 최댓값이 계약에 들어오면 갈린다 |
| `probabilistic/bloomFilter` | `invariant` | 공간 · 축밖 | 거짓 양성률이 계약인데 축3은 시간만 잰다. 공간이 존재 이유다 |
| `probabilistic/countMinSketch` | `invariant` | 공간 · 축밖 | 오차 보장이 계약. 재는 축이 없다 |
| `probabilistic/hyperLogLog` | `invariant` | 공간 · 축밖 | 같음. 공간이 존재 이유이고 오차가 계약이다 |
| `probabilistic/minHash` | `invariant` | 축밖 | 닮음 추정이 계약. 재는 축이 없다 |
| `trie/trie` | `invariant` | 같은계약? | B15 확정 — ternarySearchTree 와 계약이 같다. 이 카드가 계약의 정본이 된다 |
| `trie/radixTree` | `invariant` | 같은계약? | 압축 트라이다. trie 와 계약이 같은지 본다 — 갈리는 자리가 공간이면 담지 못한다 |

### P4-B군 — `complexity` 잠정 (KAN-027) — 42종

| 구조 | 잠정 등급 | 표시 | 근거 한 줄 |
|---|---|---|---|
| `disjoint-set/unionFind` | `complexity` | Bound | 합침·찾기 상한이 역아커만이라 자명한 구현(부모 배열)으로는 안 나온다. Bound 목록에 그 계급이 없다 |
| `disjoint-set/disjointSetRollback` | `complexity` | 같은계약? | 되돌리기가 경로 압축을 막으므로 랭크만 남아 O(log n). unionFind 와 계약이 갈리는 자리가 되돌리기다 |
| `hash/hashMapChaining` | `complexity` | 같은계약? | 이름이 곧 구현이다. 열린 주소법과 계약이 같을 가능성이 높다 — B15 와 같은 자리 |
| `hash/hashMapOpenAddressing` | `complexity` | 같은계약? · 공간 | 같음. 갈리는 자리가 공간(적재율)이면 계약이 담지 못한다 |
| `hash/hashSet` | `complexity` | 같은계약? | 값이 없는 사전이다. hashMap 계약에 담기는 포섭 관계 — queue ⊂ deque 와 같은 모양 |
| `hash/lruCache` | `complexity` | — | 용량 정책과 O(1) 접근이 함께 계약이다. 자명한 구현으로 안 나온다 |
| `heap/minHeap` | `complexity` | 같은계약? | 최대 힙과 비교자 방향만 다르다. 계약이 같을 가능성이 매우 높다 |
| `heap/maxHeap` | `complexity` | 같은계약? | 같음. 둘을 비교자 주입 하나로 합칠 수 있는지가 판정 |
| `heap/priorityQueue` | `complexity` | 같은계약? | 힙과 계약이 같은지 본다. 이름이 ADT 쪽이라 오히려 이쪽이 계약 이름일 수 있다 |
| `heap/daryHeap` | `complexity` | 같은계약? · 공간 | 이름이 곧 구현이다(d 갈래). d 는 계약의 문장이 될 수 없다 — B15 와 같은 자리 |
| `heap/binomialHeap` | `complexity` | 같은계약? | 합치기(meld)가 계약에 있으면 minHeap 과 갈린다. 없으면 이름이 곧 구현이다 |
| `heap/leftistHeap` | `complexity` | 같은계약? | 같음. 합치기 계약을 공유하는 넷 중 하나 |
| `heap/pairingHeap` | `complexity` | 같은계약? | 같음. 키 낮추기 상한이 계약에 들어오면 갈린다 |
| `heap/fibonacciHeap` | `complexity` | — | 키 낮추기 상각 O(1) 이 계약이면 넷 중 유일하게 혼자 갈린다 |
| `heap/vanEmdeBoasTree` | `complexity` | Bound | 우주 크기 u 에 대한 O(log log u). n 이 아닌 것이 상한에 들어오는 첫 사례 |
| `linear/circularBuffer` | `complexity` | 같은계약? | 고정 용량이 계약에 있으면 queue 와 갈린다. 없으면 queue 다 |
| `linear/gapBuffer` | `complexity` | 공간 | 편집 지역성이 존재 이유다. 그것이 계약의 문장이 되는지부터 본다 |
| `linear/pieceTable` | `complexity` | 공간 | 같음. 원본 불변과 조각 목록이 계약이 될 수 있는지 본다 |
| `probabilistic/skipList` | `complexity` | — | expected O(log n) 이 계약. 확률 논증이 필요하므로 자명하지 않다 |
| `probabilistic/cuckooFilter` | `complexity` | 같은계약? · 공간 · 축밖 | 같음. 블룸과 갈리는 자리가 지우기다 |
| `range-query/fenwickTree` | `complexity` | 같은계약? | 앞구간 합만 하는 계약이면 segmentTree 계약에 담긴다. 포섭 관계를 본다 |
| `range-query/segmentTree` | `complexity` | 같은계약? | 임의 구간 + 임의 결합. 이쪽이 넓은 계약이다 |
| `range-query/segmentTreeLazy` | `complexity` | 같은계약? | 구간 갱신이 더해지면 갈린다. 없으면 segmentTree 다 |
| `range-query/persistentSegmentTree` | `complexity` | 공간 | 옛 버전 접근이 계약이면 갈린다. 공간이 대가다 |
| `range-query/sparseTable` | `complexity` | 불변구조 | 불변 구조다 — 생성자로 다 지어지고 바뀌지 않는다. B13 의 넷을 그대로 적용한다 |
| `spatial/kdTree` | `complexity` | 같은계약? | 최근접·범위 질의. 차원이 상한에 들어오는지 본다 |
| `spatial/quadtree` | `complexity` | 같은계약? | 같음. 이름이 곧 구현(4갈래)이라 kdTree 와 계약이 같을 수 있다 |
| `tree/binarySearchTree` | `complexity` | 연산집합 | 균형이 없으면 O(n) 이다. 계약에 O(log n) 을 적으면 자기모순이고, 적지 않으면 정렬 배열과 갈리지 않는다 |
| `tree/avlTree` | `complexity` | 같은계약? | 균형 BST 여덟 중 하나. 여덟 계약이 전부 같을 가능성이 높다 — 이 배치의 가장 큰 덩어리 |
| `tree/redBlackTree` | `complexity` | 같은계약? | 같음 |
| `tree/scapegoatTree` | `complexity` | 같은계약? | 같음. 상각 O(log n) 이라 한정자가 갈릴 수 있다 |
| `tree/splayTree` | `complexity` | 같은계약? | 같음. 상각만 보장하므로 한정자가 갈린다 |
| `tree/treap` | `complexity` | 같은계약? | 같음. expected 라 한정자가 갈린다 |
| `tree/twoThreeTree` | `complexity` | 같은계약? | 같음 |
| `tree/bTree` | `complexity` | 같은계약? · 공간 | 같음. 갈리는 자리가 블록 크기·디스크면 계약이 담지 못한다 |
| `tree/bPlusTree` | `complexity` | 같은계약? · 공간 | 같음. 잎 사슬 순회가 계약에 들어오면 갈린다 |
| `tree/orderStatisticTree` | `complexity` | — | B11 확정 — multiset 을 담는다. 다른 구조다 |
| `tree/cartesianTree` | `complexity` | — | 수열에서 만드는 트리라 계약이 갈린다. 불변 구조일 수 있다 |
| `tree/huffmanTree` | `complexity` | 축밖 | 자료구조인지 알고리즘 산출물인지부터 본다 |
| `tree/merkleTree` | `complexity` | 불변구조 | 증명 검증이 계약. 불변 구조일 가능성이 높다 |
| `tree/linkCutTree` | `complexity` | — | 동적 트리. 계약이 확실히 갈리고 상각 O(log n) 이다 |
| `trie/ahoCorasick` | `complexity` | — | 다중 패턴 동시 매칭이 계약이라 갈린다 |

### P4-C군 — 에스컬레이션 (KAN-028) — 1종

| 구조 | 잠정 등급 | 표시 | 근거 한 줄 |
|---|---|---|---|
| `probabilistic/concurrentSkipList` | `concurrency` | — | B1 확정 — 규약4 (가). Rust 전용. KAN-024 가 실행한다 |
## 집계 — 이 분류가 실제로 말하는 것

| 표시 | 건수 | 무엇을 뜻하는가 |
|---|---|---|
| 같은계약? | **33** | 남은 59종의 **절반 이상**이 이름이 비슷한 다른 구조와 계약이 갈리지 않을 수 있다 |
| 공간 | 13 | 존재 이유가 공간이라 시간만 말하는 계약이 지목하지 못할 수 있다 |
| 축밖 | 8 | 계약이 담을 성질을 재는 축이 없다 |
| 연산집합 | 5 | 자명한 구현이 전 행을 통과한다 — 연산 집합부터 본다 |
| Bound | 2 | 상한이 현행 다섯에 없다(`unionFind` 의 역아커만, `vanEmdeBoasTree` 의 $\log\log u$) |
| 불변구조 | 2 | `range-query/sparseTable` · `tree/merkleTree` |

**「같은계약?」 33 건이 이 분류의 결론이다.** 재집필 카드를 59개 만드는 계획은 그 33 건이
전부 별개 계약이라는 전제 위에 서 있는데, B15 가 그 전제가 깨지는 첫 실물을 냈다
(`trie/ternarySearchTree` = `trie/trie`). 가장 큰 덩어리는 셋이다.

1. **균형 이진 탐색 트리 여덟** — `avlTree`·`redBlackTree`·`scapegoatTree`·`splayTree`·
   `treap`·`twoThreeTree`·`bTree`·`bPlusTree`. 계약이 갈릴 후보는 **한정자**뿐이다
   (`worst` / `amortized` / `expected`). 갈리면 셋으로 묶이고, 안 갈리면 하나다.
2. **힙 여덟** — `minHeap`·`maxHeap`·`priorityQueue`·`daryHeap`·`binomialHeap`·
   `leftistHeap`·`pairingHeap`·`fibonacciHeap`. 갈릴 후보는 **합치기(meld)의 유무**와
   **키 낮추기 상한**이다.
3. **해시 셋** — `hashMapChaining`·`hashMapOpenAddressing`·`hashSet`. 앞의 둘은 이름이 곧
   구현이고, `hashSet` 은 포섭 관계다(`queue` ⊂ `deque` 와 같은 모양).

**그래서 B17 이후의 순서를 이렇게 권한다.** 재집필을 하나씩 돌리기 전에 **덩어리별로
「같은 계약인가」를 먼저 판정한다.** 판정이 「같다」로 나오면 그 덩어리는 재집필 여덟이
아니라 **계약 하나 + 처분 일곱**이 된다. 판정 비용이 재집필 비용보다 훨씬 싸고, 순서를
뒤집으면 같은 계약을 여덟 번 적게 된다.

## 공수 추정 — 실적 기반

B7~B15 의 실적이 표본 열이다(재집필 10종 / 배치 9회).

| 배치 | 구조 | 종수 |
|---|---|---|
| B7·B8·B9·B11·B12 | deque · intervalTree · xorLinkedList · multiset · unrolledLinkedList | 각 1 |
| B13 | suffixArray · suffixTree | 2 |
| B14·B15 | queue · ternarySearchTree | 각 1 |

**한 배치가 한 종에 가깝고, 계약이 가벼우면 둘까지 간다.** 규약이 자라던 B7~B11 과 안정된
B12~B15 사이에 배치당 종수는 크게 안 변했는데, 바뀐 것은 **한 배치가 규약에 남기는 양**이다
(B14 는 불변 사실 넷, B15 는 둘).

| 군 | 종수 | 잠정 배치 수 | 근거 |
|---|---|---|---|
| P4-A | 16 | **8~12** | 계약이 가벼워 둘씩 묶을 수 있다. 다만 「공간」·「축밖」 표시가 붙은 여섯은 판정에 시간이 든다 |
| P4-B | 42 | **20~30** | 「같은계약?」 판정이 먼저 끝나면 **덩어리 셋(24종)이 배치 6~9 회로 줄어들 수 있다** |
| P4-C | 1 | **1~2** | `concurrentSkipList` 는 KAN-024 가 별도로 든다(Rust 구현 + 축4) |

**폭은 「같은계약?」 판정 결과가 정한다.** 33 건이 전부 별개면 상한(44회)에 가깝고, 덩어리
셋이 각각 하나로 접히면 하한(29회)에 가깝다. **B17 을 덩어리 판정으로 잡으면 이 폭이 그
배치에서 좁혀진다.**

## 이 분류가 넘기는 것

- **KAN-026(P4-A군) 카드 제목의 「축3 불필요」는 틀렸다.** 불변 사실 22 가 확정한 대로
  **전 등급이 축3을 돈다.** 등급은 축을 켜고 끄지 않고 엄격도를 가른다. 카드 제목을 고칠
  일이다
- **Bound 확장 후보 둘**(`unionFind` · `vanEmdeBoasTree`)은 늘리기 전에 겹침부터 본다
  (불변 사실 53). 역아커만은 사실상 상수라 `O(1)` 로 접을 수 있는지가 판정이고,
  $\log\log u$ 는 **n 이 아닌 것이 상한에 들어오는 첫 사례**라 규격이 그것을 받는지부터 본다
- **「공간」 13 건이 불변 사실 58 의 대상 목록이다.** 공간을 계약에 넣을지 정하는 규격
  카드가 생긴다면 이 열셋이 그 근거가 된다
