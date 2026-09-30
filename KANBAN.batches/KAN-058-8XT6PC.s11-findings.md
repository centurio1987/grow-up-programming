# KAN-058 S11 — 전개 중 모은 판단 근거

카드: [KAN-058-8XT6PC.md](../KANBAN.cards/KAN-058-8XT6PC.md) · 검토서의 판단 항목이 가리키는 원자료다.

> 출처는 카드 「수행 내역」(편마다 서브에이전트 보고와 메인 재확인을 한 줄씩 적은 기록)이다. 2026-10-01 에 한 번 전수로 옮겨 적었다. 나중에 정정된 것은 〔정정됨〕, 기록이 확인하지 않았다고 적은 것은 〔확인 안 됨〕으로 표시한다. 이 문서는 모은 것을 옮긴 것이고 여기서 고친 것은 없다.

## 1. 전개 규모와 비용

- 알고리즘 가이드 115편 전부가 새 구성으로 섰다(`bun run tools/algo-wbs.ts` — 115 편, 남은 0).
- 서브에이전트 토큰·시간이 둘 다 적힌 편 82편: 토큰 합 40,610,893 · 편 평균 약 495,255, 시간 합 약 2,582분 · 편 평균 약 31.5분. 나머지 편은 값이 어림이거나 알림 뒤로 남아 합에서 뺐다. 메인 세션의 검증·커밋 비용은 들어 있지 않다.
- 옛 원고의 틀린 값·틀린 서술을 새 원고에서 바로잡은 편: 틀렸다고 명시된 정정 65편, 근거 없던 값을 실측으로 바꾸거나 셈 기준 섞임을 맞춘 편 23편.

## 2. 문체 등급 전후 비교(115편)

authoring-kit 0.4.1 `scan_ai_style.py --voice algorithm-guide-writer`, `## 실습` 앞까지, 옛 원고는 KAN-058 착수 직전 커밋 `6086e1e2`.

| 결과 | 편 수 | 내역 |
| --- | --- | --- |
| 같음 | 92 | C→C 88 · A→A 3 · B→B 1 |
| 내려감 | 17 | A→C 6 · A→B 2 · B→C 9 |
| 올라감 | 6 | C→A 2 · C→B 4 |

- 내려감(A→C): minMaxPair · bestTimeToBuyAndSellStockK · longestSubarrayAtMostSum · subarraySumEqualsK · twoSum · kasaiLcp
- 내려감(A→B): maxCounters · kthSmallest
- 내려감(B→C): longestIncreasingSubsequence · coinChangeWays · subsetSum · treeMaxIndependentSet · kruskalMst · extendedEuclidean · gcd · quicksort · treeDiameter
- 올라감: enumerateSubmasks(C→A) · rotatingCalipersDiameter(C→A) · lowestSetBit · convexHull · sieveOfEratosthenes · floydWarshall(C→B)
- 참고: 승인된 샘플 두 편과 파일럿도 C 다. 배치 1 에서 「등급으로 막으면 본보기가 떨어진다」며 등급을 합격선에서 뺐다.

## 3. 실습 절·스텁 테스트 결함(고치지 않고 모음)

### 3-1. 틀린 기대값 — 맞게 풀어도 시험이 실패한다

| 편 | 자리 | 틀린 것 |
| --- | --- | --- |
| searchInRotatedSortedArray | `searchInRotatedSortedArray.test.ts:76` | [7,1,2,3,4,5,6] 에서 5 의 위치를 4 로 기대 — 실제 5 |
| fastPower | 스텁 테스트 59줄 | `fastPower(2n,60n,10^18+9)` 기대값 2^60 — 법보다 커서 실제 152921504606846967n |
| matrixChainMultiplication | 스텁 테스트 50-51줄 | [1,1,1,1,1] 기대값 0 — 실제 3 |
| palindromePartitioningMinCut | 스텁 테스트 63-68줄 | `"ab".repeat(1000)` 기대값 1999 — 실제 1 |
| largestRectangleInHistogram | 스텁 테스트 24줄 | [6,7,5,2,4,5,9,3] 기대값 15 — 실제 16(시험 제목은 「→ 16」) |
| ahoCorasick | 스텁 테스트 33줄 | `he@1` — 가이드 시험 머리 주석에 이미 적혀 있던 것, 카드에는 무엇이 틀렸는지 없음 〔확인 안 됨〕 |

### 3-2. 그 밖 — 서술·제약·예시 불일치, 벽시계 판정

- maximumProductSubarray: 「모든 원소가 음수이면 가장 큰 음수가 답」이 틀림([-4 -3 -2] 의 답은 12).
- bestTimeToBuyAndSellStock: 「그보다 늦은 날 팔」과 「같거나 뒤여야」가 어긋남.
- longestCommonSubsequence: 「빈 문자열이면 공통 부분 수열이 없으므로 0」 — 빈 문자열이 공통 부분 수열이고 길이가 0.
- searchInRotatedSortedArray: 회전 정의대로면 k=4 결과가 [5,6,7,0,1,2,4] 인데 [4,5,6,7,0,1,2] 로 적힘(k=3 이어야 맞음). 「1번부터 번호」와 예시의 0 불일치.
- trie: 제목 「접두사 트리 사전」이 본문 이름과 다름. 제약에 목표 복잡도 O(L). 스토리가 풀이 방향을 흘림.
- bestTimeToBuyAndSellStockK: 스텁에 탐욕 풀이가 들어 있음(유저 풀이인지 〔확인 안 됨〕). 「배열이 비거나(N < 2)」가 제약 1 ≤ N 과 어긋남.
- kruskalMst: 실습 예시 1 이 스텁 테스트에 없음. 테스트 CLRS 주석의 MST 간선 (g,i)=6 이 틀림(실제 (c,i)=2, 기대값 37 은 맞음). 「마을 다섯 곳」이 예시와 무관.
- radixTree: 목표 복잡도 O(L) · 스토리와 인터페이스가 풀이를 미리 말함.
- subsetSum · unboundedKnapsack: 제약은 1 ≤ 길이인데 상세·예시·스텁 테스트가 빈 배열을 다룸.
- enumerateSubmasks: 스토리는 개수를 묻는데 함수는 목록을 돌려줌.
- primMst · aStarSearch: 스토리가 풀이 절차를 흘림.
- longestIncreasingSubsequence: 스토리가 「엄격히 감소해야」, 「최장 연속(비연속도 허용)」 모순, 빈 배열 규정 없음, 성능 케이스 벽시계 100ms.
- findAllOccurrences: 스텁 테스트 "hello world" 의 공백이 제약 「소문자 영문」과 어긋남.
- singleNumberXor: 목표 복잡도 O(N)/O(1), 스토리 주술 불일치.
- undirectedCycleDetection: 「사이클은 3개 이상의 서로 다른 정점」이 자기 루프·중복 간선 규칙과 모순.
- matrixPowerFibonacci: 제약 n ≤ 10^18 · 1초는 지킬 수 없음(F(10^18) 은 2.09 × 10^17 자리). n = 10^18 두 케이스는 통과 불가, 하나는 벽시계.
- matrixChainMultiplication: 행렬 셋을 「세 가지 결합」이라 함 — 실제 둘.
- palindromePartitioningMinCut: 주석 「단일문자만 팰린드롬」이 틀림, 벽시계 100ms.
- topKFrequent: 성능 케이스가 시드 없는 `Math.random` 과 벽시계 100ms.
- binomialModP: 「문제 상세」가 풀이 방법(팩토리얼과 역원)을 처방.
- isPrimeTrial: 예시 「1 미만」은 「2 미만」, 스토리 10^9 vs 제약 10^12.
- pollardRho: 「20 자리면 시행 나눗셈 10^10 번 이상」은 과장(2^64 아래 6k±1 후보 약 1.43×10^9).
- suffixArray: 예시 abc 설명 「가장 짧은 접미사부터」가 틀림(기대값은 맞음).
- kasaiLcp · suffixAutomaton · longestPalindrome: 제약에 목표 복잡도. longestPalindrome 은 벽시계 100ms 둘.
- ahoCorasick: 스텁 테스트 19줄 텍스트에 빈칸.
- rotatingCalipersDiameter: 최대 반환값 4×10^18 이 틀림 — 8×10^18. 벽시계 100ms.
- crt: 「가장 가까운 과거 시점」이 계약(가장 작은 음 아닌 x)과 뜻이 다름.
- babyStepGiantStep: 「임의의 bigint」로 서로소 아닌 입력도 받는데 정본이 그 입력에서 틀림(4-1). 서로소 아닌 스텁 케이스 둘은 우연히 통과.
- divideAndConquerDp: 예시 주석 「// 3 — … 최솟값 = 2」 — 실제 2.
- knuthOptimization: 스토리 100 vs 110, 제약 n ≤ 5000 과 256MB 불일치, 벽시계 케이스와 주석 불일치.
- coinChangeWays: 액면가 중복 여부를 정하지 않음(정본은 [1,1]/2 에서 3).
- 벽시계 판정만 기록된 편: fastPower(50ms) · treeMaxIndependentSet · fenwickRangeSum · digitDp · slidingWindowMaximum · bridgesInGraph(121·128·137·142행).
- 결함 없음이라 적은 편: expectedValueDp · meetInTheMiddleSubsetSum · countInversions 등.

## 4. 정본(`-guide.ref.ts`) 결함과 정본 주석의 어긋남

### 4-1. 동작 결함·한계

- babyStepGiantStep: a 와 m 이 서로소가 아니면 틀린 답. m ≤ 60 전수에서 서로소 아닌 29,579 개 중 12,180 개가 어긋남(예: (2,0,8) 에 1, 정답 3). 원고는 과제를 서로소로 고정했다.
- matrixPowerFibonacci: n = 2^20 에서 쓰이지 않는 마지막 제곱이 M^2097152 를 만들다 RangeError. 답 자체는 한도 안.
- convexHullTrick: 과제 범위 |b| ≤ 10^18 에서 number 정본이 부정확(원고 짚고 가기에서 값으로 보임).
- externalMergeSort: Bun 스트림이 작은 파일을 블록 하나로 통째로 줘서 합치기 시작 때 런 1,000 개가 모두 메모리에 올라옴(72,777,845 바이트). 주석 「런 하나와 힙뿐」은 정수 개수로 셀 때만 참.
- kruskalMst: 「붙이는 방향만」 판의 칸 접근이 5,995·20,730 으로 가장 적고 경로 압축까지 넣은 정본 쪽은 7,993·24,576. 정본을 이대로 둘지.
- treeDiameter: dist=-1 을 방문 표시로 써서 음수 가중치에서 끝나지 않음.
- coinChangeWays: 액면가가 중복되면 [1,1]/2 에서 3.

### 4-2. 주석·서술과 실측의 어긋남

- expectedValueDp: 「큰 쪽부터 더하면 덜 누적」 — 실측 3.09e-15 대 3.50e-15.
- subtreeSumQuery: tout 은 「나온 차례」가 아니라 「나오는 순간까지 준 마지막 자리」.
- millerRabin: 본문은 561 을 제곱 수열로 설명하지만 정본은 사전 나눗셈에서 잡음(옛 원고와 같은 서술).
- minMaxPair: 지시서는 「분할 정복」, 정본은 반복문 짝 비교.
- 정본 주석에 남은 실습 지칭: 옛 편 23곳(sortArray 기록), dfsTraversal 머리 JSDoc, singleNumberXor JSDoc.
- 정본 용어가 원고와 다름: unboundedKnapsack 「층」/「줄」, heavyLightDecomposition 「마디」/「칸」.
- minCut: maxFlow 정본을 부르지 않고 디닉을 복사(유량 값은 전부 일치).

## 5. 편 사이 불일치

### 5-1. 비용·메모리를 세는 기준

- geometry: convexHull(좌표 비교+방향 판정) · segmentsIntersect(곱셈+나눗셈+큰 정수 변환+범위 비교) · pointInPolygon(좌표 읽기+곱셈+큰 정수 변환+좌표 비교) · polygonArea · bentleyOttmann(정수 곱셈+자료 접근) · closestPairOfPoints · rotatingCalipersDiameter(좌표 비교+방향 판정+거리 계산).
- gcd 「연산 횟수」 vs extendedEuclidean·crt 「나눗셈 횟수」.
- suffixArray 「자료 접근」 vs radixSort 「배열 접근」.
- ahoCorasick 「자료 접근」 vs trie 「기본 연산」.
- treeRerooting vs treeMaxIndependentSet: 「기본 연산」 정의가 다름.
- divideAndConquerDp·matrixChainMultiplication 「후보 수」 vs convexHullTrick 「기본 연산」.
- countInversions 「칸 접근」(펜윅 트리와 같은 잣대) vs 병합 정렬 편 「비교 횟수」 — 최악 비교 1,568,929 는 같음.
- meetInTheMiddleSubsetSum vs subsetSum: 측정 방식 셋이 다름(생성식 곱수 37 vs 7,919 · 부분합 세는 법 · 조기 종료). 시간 어림 1초에 10^9(subsetSum) vs 10^8(binarySearch·이 편·SPEC).
- 한 편 안에서 기준이 둘: gcd · digitDp · bridgesInGraph · segmentTreeRangeMin · knapsack01(본문에 밝힘) · aStarSearch(이웃 목록 만들기를 넣느냐에 따라 우열이 뒤집힘 16,180 vs 18,836).
- 여러 편: 경쟁 설계 절 산문의 배수(9.0배·139배 등)를 bench 표에서 손으로 계산해 적음. 샘플 binarySearch 에도 10곳.

### 5-2. 용어·표기

- 간선 값: zeroOneBfs 「값」 vs dijkstra 「가중치」.
- 같은 간선: articulationPoints 「되돌아가는 간선」 vs undirectedCycleDetection 「여분 간선」(본문에 같다고 한 줄).
- bellmanFord 단서 절이 floydWarshall 을 「표를 한 번 만드는 쪽」이라 부름(그 편 이름은 「거리 행렬」). 라운드 번호 1부터 vs 0부터.
- 「라운드」: minCostMaxFlow·maxFlow 는 바깥 반복, bellmanFord·spfa 는 간선 목록 한 번 읽기.
- 「서브트리」(treeMaxIndependentSet) vs 「부분트리」(treeRerooting·heavyLightDecomposition).
- kasaiLcp vs suffixArray: 순위 배열 inv vs rank, 칸 번호 r vs k.
- 규모 기호: mosAlgorithm n·q vs 구간 편 N·Q.
- externalMergeSort 「런」 vs sortArray 「조각」.
- subsetSum 「이분 탐색」(다른 편은 「이진 탐색」).
- countInversions 「역순쌍」 vs 병합 정렬 편 「역순 쌍」.
- polygonArea vs pointInPolygon: 같은 L 자 도형의 변 이름이 한 칸 어긋남.
- 꼭짓점 수: rotatingCalipersDiameter m·u vs convexHull m·h.
- 비트 자리 방향: tspBitmask(자리 0 오른쪽) vs enumerateSubmasks 그림(왼쪽). binaryGap 편 안의 좌우 반대.
- 정렬 규칙: closestPairOfPoints 는 x 만, convexHull 은 x 같으면 y.
- ahoCorasick 본문이 「자동자」로 줄여 부름(한 대상에 한 이름 규칙).

## 6. bench(비교 측정) 잣대·키 변경

### 6-1. 한쪽 설계에 유리해졌다고 적힌 것 — 모두 본문이나 커밋 메시지에 사유를 적었다

| 편 | 무엇을 바꿨나 | 누구에게 유리한가 |
| --- | --- | --- |
| longestPalindrome | 배열 칸 접근 → 자료 접근, 생성식·키·입력 | 회문 트리. 옛 결론 「질의 3회에서 뒤집힘」이 사라짐 |
| ahoCorasick | 잣대 | 「패턴마다 실패 함수」에 조금. 뒤집히는 패턴 수 39·40 → 41·42 |
| tspBitmask | 분기 한정도 호출 진입·복귀를 셈 | DP 테이블 쪽. 우열·경계 5/6 그대로 |
| crt | 「기본 연산·자릿수 일·저장 자릿수」 → 「질의 q 회 나눗셈·들고 있는 값」 | 경쟁 설계(옛 기준은 이 편에 유리). 뒤집히는 자리 8회 → 2회 |
| divideAndConquerDp | 경쟁 설계를 크누스 최적화로, 키·입력·잣대 | 분할 정복 쪽에 조금. k=148 에서 뒤집힘 |
| mosAlgorithm | 입력·키, 32비트 생성식 | 펜윅 쪽에 조금 불리, 우열 그대로 |
| fftMultiply | 키만 | 「연산 전부」가 삼각함수를 한 번으로 셈 — FFT 에 유리(본문에 밝힘) |
| meetInTheMiddleSubsetSum | 키만 | 답을 찾으면 멈추는 이 절차에 유리(본문에 밝힘) |

### 6-2. 입력을 바꾼 것

spfa · segmentsIntersect(s3 한 점, 값 그대로) · closestPairOfPoints(내용 기록 없음) · sieveOfEratosthenes(상한 10^7) · coinChangeWays(최악 입력) · stronglyConnectedComponents(완전 DAG → 사슬) · insertionSort(규모 10^5) · largestRectangleInHistogram(같은 높이 입력 뺌) · treeRerooting(단순한 방법 식).

## 7. 공용 인프라에 남은 후보·공백

- 검사 공백: `ci.ts gates` 가 도구 자기시험(`bun test tools`)을 돌리지 않는다. check-metaphor 시험이 countIslands 줄 번호에 고정돼 W1 부터 실패하던 것을 웨이브 마감 게이트가 못 잡았다(S10 에서 시험은 고쳤음).
- 배열 무대: 인덱스 줄 이름이 「인덱스」로 고정(binaryGap·enumerateSubmasks·lowestSetBit 은 「자리」가 맞음) · 「밖」 상태가 하나뿐(gcd · convexHullTrick · isPrimeTrial) · 쌓은 줄 위에 구간 괄호를 못 그림(meetInTheMiddleSubsetSum) · 스택 띠를 layers 로 그림(nextGreaterElement).
- 그 밖 무대·패턴: CellStageFilm 줄 머리 폭이 장마다 달라 칸 열이 어긋남 · 힙 무대 없음(dijkstra) · nQueens 판을 패널이 직접 못 그림.
- 무대 규약 없이 정한 자리: longestSubarrayAtMostSum · sortArray · radixSort · countIslands · connectedComponents · ternarySearch · treeMaxIndependentSet · sieveOfEratosthenes · longestIncreasingSubsequence.
- 그림 품질: radixTree build-over-trie 세로 약 1250px · subsetSum 참인 칸이 덜 보임(브라우저 확인 안 함).
- 증명 도구: 펜스로 시작하는 증명 블록은 닫는 마커가 있어도 펜스 아래 문장을 대조하지 않는다(SPEC 에 없는 동작).
- 스캐너 오탐 주장: P21 「최저가」 〔오탐으로 봄〕 · P4 `!==` 〔재현 안 됨〕 · 천 단위 쉼표 〔재현 안 됨〕.
- 편 안에서 확인하지 않은 주장: quicksort 호출 스택 넘침 · subarraySumEqualsK 좌표압축 · kthSmallest 30% · treeMaxIndependentSet 역추적 · palindromePartitioningMinCut 8바이트/칸 · maxFlow 최악 칸 · fftMultiply 반올림 · expectedValueDp NumPy·Icepool 인용 · maxBipartiteMatching 「쿤」 출처 · dfsTraversal·houseRobber 스택 한도.
- 「견주다」: 알고리즘 가이드 0곳. 자료구조 가이드 19편 124곳(이 카드 범위 밖). voice 원본(`~/.claude/authoring/voices/algorithm-guide-writer/style.json`)에서는 아직 꺼져 있고, 저장소 검사기 `check-v2` 가 알고리즘 편에만 직접 잰다.

처분(2026-10-01, KAN-063): 줄마다의 처분은 `KANBAN.batches/KAN-063-X2JFZA.batch3.md` 「처분표」.
