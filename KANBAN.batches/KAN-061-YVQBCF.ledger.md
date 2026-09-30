# KAN-061 대조표 — 근거 파일 §3·§4 의 줄마다 처리

카드: [KAN-061-YVQBCF.md](../KANBAN.cards/KAN-061-YVQBCF.md) · 근거: [KAN-058-8XT6PC.s11-findings.md](./KAN-058-8XT6PC.s11-findings.md) §3(실습 절·스텁 테스트) · §4(정본)

처리는 셋이다 — **고침**(어느 work 의 커밋에서) · **사유**(고치지 않는 까닭) · **이미 고쳐짐**. 「(신규)」는 목록에 없었지만 같은 편에서 같은 종류로 보여 함께 고친 것이다. 벽시계 성능 시험은 유저 결정(2026-10-01)으로 유지한다 — 알고리즘 실습 규격은 성능 시험을 「CPU 1초 ≈ 10^8 연산」으로 정할 뿐 벽시계를 금하지 않고, 스텁 테스트 대부분이 같은 방식이다.

검증 도구: `tools/practice-ref.ts` 가 스텁 테스트를 정본에 물려 돈다. 착수 전 실패 10 → 지금 0(117 파일 · 1,443 시험). `ci.ts` 의 `bun test tools` 단계가 `tools/practice-ref.test.ts` 로 집행한다.

| 근거 줄 | 편 | 처리 | 내용 |
| --- | --- | --- | --- |
| 3-1 | searchInRotatedSortedArray | 고침 S2 | [7,1,2,3,4,5,6] 에서 5 → 기대값 5 |
| 3-1 | fastPower | 고침 S2 | 2^60 mod (10^18+9) → 152921504606846967n |
| 3-1 | matrixChainMultiplication | 고침 S2 | [1,1,1,1,1] → 3 |
| 3-1 | palindromePartitioningMinCut | 고침 S2 | "ab"×1000 → 1(시험 제목·주석도) |
| 3-1 | largestRectangleInHistogram | 고침 S2 | → 16(시험 제목·주석도) |
| 3-1 | ahoCorasick `he@1` | 이미 고쳐짐 | 96c71606(KAN-034.7 S18) 에서 고쳐졌고 지금 시험 주석이 그 사실을 적는다. 정본 대조에서도 통과 |
| 3-2 | searchInRotatedSortedArray | 고침 S2 | k=4 → k=3 · 스토리 「1번부터」 → 「작은 번호부터」, 풀이를 흘리던 문장 지움 |
| 3-2 | matrixChainMultiplication | 고침 S2 | 「세 가지 결합」 → 「두 가지 결합」 |
| 3-2 | palindromePartitioningMinCut 주석 | 고침 S2 | 「단일문자만 팰린드롬」 주석 교체 |
| 3-2 | ahoCorasick 빈칸 | 고침 S2 | "hello world" → "helloworld"(제약: 소문자만) |
| 3-2 | matrixPowerFibonacci | 고침 S2 | 상한 10^18 → 10^6, 문제 상세의 O(log n) 처방 지움, n=10^18 시험 둘 → n=10^6 자릿수·끝 아홉 자리(따로 계산)·1초 |
| 4-1 | matrixPowerFibonacci 정본 | 사유 | 원고 perf 절이 이 한계를 실측 표로 밝히고 실행 규모를 10^6 으로 잡았다(「정본은 이 자리를 고치지 않았으므로」). 고치면 walk·증명·그림이 모두 바뀐다. 실습 상한을 10^6 으로 맞춰 실습에서는 걸리지 않는다 |
| (신규) | polygonArea · pointInPolygon | 고침 S2 | 실습 제약에 「좌표는 모두 정수」가 빠져 있었고 성능 시험이 실수 좌표를 넣었다. 제약 한 줄 더함 · 시험 좌표를 반올림 정수(반지름 10^8) |
| 3-2 벽시계 | fastPower · palindromePartitioningMinCut | 사유 | 유저 결정(2026-10-01): 벽시계 성능 시험은 유지 |
| 3-2 | maximumProductSubarray | 고침 S3 | 「모두 음수면 가장 큰 음수」 → [-4,-3,-2] 의 답 12 로 바로잡음 · 그 시험 추가 |
| 3-2 | bestTimeToBuyAndSellStock | 고침 S3 | 스토리를 「그날이나 뒤의 날」로(문제 상세 P ≤ Q 와 맞춤) · 길이 1 설명 바로잡음 |
| 3-2 | longestCommonSubsequence | 고침 S3 | 빈 문자열이 공통 부분 수열이고 길이 0 |
| 3-2 | bestTimeToBuyAndSellStockK 「N < 2」 | 고침 S3 | 「거래일이 하루뿐이거나(N = 1)」 |
| 3-2 | bestTimeToBuyAndSellStockK 스텁 풀이 | 사유 | 스텁이 solutions 브랜치와 바이트 동일(3aa95994 병합으로 유입). main 에서 되돌리면 다음 main→solutions 병합이 유저 풀이를 스텁으로 덮는다. 같은 파일 24개(21개 바이트 동일) — 검토서 |
| 3-2 | longestIncreasingSubsequence | 고침 S3 | 스토리의 「엄격히 감소」·「최장 연속(비연속도 허용)」 모순을 다시 씀 · 빈 배열은 제약 1 ≤ N 이 이미 배제(시험에도 없음) · 벽시계는 유저 결정으로 유지 |
| 3-2 | subsetSum · unboundedKnapsack | 고침 S3 | 제약을 0 ≤ 길이로(문제 상세·예시·시험이 빈 배열을 규정하고 있어 그쪽에 맞춤) |
| 3-2 · 4-1 | coinChangeWays | 고침 S3 | 제약에 「coins 의 값은 서로 다르다」 추가, 0 ≤ 길이. 정본은 그대로 — 중복 액면가는 과제 밖이 됐다 |
| 3-2 | enumerateSubmasks | 고침 S3 | 스토리가 개수가 아니라 목록을 묻게 |
| 3-2 | singleNumberXor | 고침 S3 | 제약의 목표 복잡도 지움 · 풀이를 흘리고 주술이 어긋난 문장 교체 |
| 4-2 | singleNumberXor 정본 JSDoc | 고침 S3 | 「이 문제의 제약이」 → 「이 과제의 입력 범위가」(원고 코드에는 안 실리는 줄) |
| 4-2 | expectedValueDp | 사유 | 주석 「큰 쪽부터 더하면 덜 누적」은 실측(3.09e-15 < 3.50e-15)과 같은 방향이다. 원고 510~527행이 차이가 작다는 것까지 밝힌다. 어긋남이 아니다 |
| 4-2 | unboundedKnapsack 「층」/「줄」 | 사유 | 원고 621행이 「코드 주석의 층은 DP 테이블의 줄」이라고 두 말을 잇는다. 용어를 하나로 모으는 일은 KAN-062(편 사이 용어 정합)의 몫 |
| 4-2 | 정본 주석의 실습 지칭 「옛 편 23곳」 | 이미 고쳐짐 + 고침 | `-guide.ref.ts` 전체에서 「이 문제·문제의 제약·문제의 계약·문제가 정해」 0건(KAN-058 전개가 --strict 로 걸렀다). 같은 말이 남은 비교 판(`-guide.alt.ts`) 세 곳을 「과제」로: nextGreaterElement · parametricBinarySearch · dagShortestPath(원고에 안 실리는 주석) |
| 3-2 벽시계 | treeMaxIndependentSet · fenwickRangeSum · digitDp · slidingWindowMaximum · bridgesInGraph | 사유 | 유저 결정(2026-10-01): 벽시계 성능 시험 유지. 정본으로 돌려 전부 통과 |
| 3-2 | findAllOccurrences | 고침 S4 | 시험 "hello world" → "helloworld"(기대값 [5], 정본 실행 확인) · (신규) 제약의 목표 복잡도 지움 · 시험 이름의 알고리즘 이름 지움 |
| 3-2 | trie | 고침 S4 | 제목 「접두사 트리 사전」 → 「트라이」(원고 이름) · 제약 O(L) 지움 · 스토리의 흘림 지움 |
| 3-2 | radixTree | 고침 S4 | 제약 O(L) · 스토리·인터페이스 설명의 흘림 지움(시그니처는 내부 구조를 요구하지 않아 그대로) · (신규) 제목 → 「라딕스 트리」 · 시험 이름 「엣지 분할」 → 「앞부분만 겹치는 단어」 |
| 3-2 | suffixArray | 고침 S4 | 예시 abc 설명을 「첫 글자 순서가 곧 접미사 순서」로 · (신규) 제약 O(n log n) · 스토리의 흘림 지움 |
| 3-2 | kasaiLcp · suffixAutomaton · longestPalindrome | 고침 S4 | 제약의 목표 복잡도 지움 · (신규) 스토리의 「선형 시간」류 흘림 지움 · kasaiLcp 「Kasai 표준 표기에 따라」 → 「비교할 다음 접미사가 없으므로」 |
| 3-2 벽시계 | longestPalindrome | 사유 | 유저 결정(2026-10-01): 벽시계 성능 시험 유지 |
| (신규) | ahoCorasick | 고침 S4 | 스토리의 「텍스트 길이에 비례하는 시간」·「한 번의 순회」 흘림 지움 |
| 3-2 | binomialModP | 고침 S4 | 문제 상세의 풀이 처방(팩토리얼과 역원) 지움, 경계 규정 둘로 대체 · 스토리 흘림 지움 · (신규) 예시 C(100,50) 에 기대값 538992043n 적음 |
| 3-2 | isPrimeTrial | 고침 S4 | 「1 미만」 → 「2 미만」 · 스토리 10^9 → 10^12(제약과 맞춤) · 제약의 「권장 범위」를 n ≤ 10^12 로 |
| 3-2 | pollardRho | 고침 S4 | 「20 자리면 10^10 번 이상」 → 「2^64 에 가까운 수면 √n ≈ 4.3×10^9, 2·3 배수를 건너뛰어도 약 1.4×10^9 번」(⌊2^32/3⌋ = 1,431,655,765) · (신규) 제약 상한 n < 2^64 |
| 3-2 | crt | 고침 S4 | 스토리를 계약(가장 작은 음 아닌 x 와 주기 M)과 같은 뜻으로 다시 씀 |
| 3-2 | babyStepGiantStep | 고침 S4 | 실습 인터페이스·제약·문제 상세를 gcd(a, m) = 1 로 좁힘 · 서로소 아닌 예시·시험 (2,3,4)·(15,3,12) 를 서로소 (2,3,7)→-1 · (20,-14,17)→1 로 바꿔 「해 없음」·「정규화」 집행 유지 · (신규) 제약의 풀이 흘림 지움, m 범위 정량화 |
| 4-1 | babyStepGiantStep 정본 | 사유 | 원고가 과제를 서로소로 고정했고 정본 머리 주석(ref.ts:12-15)과 원고 「이 방법이 기대는 전제」가 (2,0,8) 오답을 이미 밝힌다. 실습도 서로소로 좁혀 과제 안에서는 틀린 답이 없다 |
| 4-2 | millerRabin | 고침 S4 | 561 제곱 수열 설명(증명 블록·그림과 얽힘)은 두고, 정본은 561 을 사전 나눗셈(3)에서 잡는다는 문장을 보탬 · 709행 「561 도 밑 2 하나로 잡혔으니」를 정본 동작과 맞게 |
| 3-2 벽시계 | fastPower | 사유 | 유저 결정(2026-10-01): 벽시계 성능 시험 유지 |
| 3-2 | kruskalMst | 고침 S5 | 실습 예시 1 을 스텁 시험으로 더함 · CLRS 주석 (g,i)=6 → (c,i)=2(합 37 그대로) · 「마을 다섯 곳」 → 「여러 곳」 |
| 4-1 | kruskalMst 정본 | 사유 | 원고 475~511행이 네 판의 칸 접근 수(5,995·7,993·20,730·24,576)와 높이를 보이고 둘 다 넣는 까닭(붙이는 방향의 log₂V 높이 보장, 경로 압축의 높이 3→2)을 적는다. 정본은 표준 판을 싣는 자리 |
| 3-2 | primMst · aStarSearch | 고침 S5 | 스토리의 풀이 절차 문장 지움(aStar 는 어림값이 실제 거리를 넘지 않는다는 조건만 남김) |
| 3-2 | undirectedCycleDetection | 고침 S5 | 사이클 정의를 「같은 간선을 두 번 지나지 않고 돌아오는 닫힌 경로(자기 루프·간선 두 개짜리 고리 포함)」로 — 자기 루프·중복 간선 규칙과 맞춤 |
| 3-2 | topKFrequent | 고침 S5 | 성능 시험의 Math.random → 시드 12345 선형 합동 생성기. 벽시계는 유저 결정으로 유지 |
| 3-2 | rotatingCalipersDiameter | 고침 S5 | 최대 반환값 4×10^18 → 8×10^18(정본 실행 확인), 2^53 초과 답의 반올림 규정 추가. 벽시계는 유지 |
| 3-2 | divideAndConquerDp | 고침 S5 | 예시 주석 3 → 2 · (신규) 예시의 3×3 세 경우를 시험으로 더함 |
| 3-2 | knuthOptimization | 고침 S5 | 스토리 100 → 110 · 제약 n ≤ 5000 → 2000(원고 104~117행: 2,000 이면 64MB, 5,000 이면 400MB) · 성능 시험 주석 n=2000 → n=500(실제 값) · 스토리의 「빠르게」 요구 지움 · (신규) 「모두 같은 값」 시험 주석 산수 바로잡음 |
| 4-1 | convexHullTrick | 고침 S5 | 원고 807~831행이 number 의 한계를 값으로 보인다. 실습 제약을 |m|,|x| ≤ 10^6 · |b| ≤ 10^9 정수로 좁혀 판정 곱 ≤ 4·10^15 < 2^53. 파트 1 의 과제 범위(|b| ≤ 10^18)는 그 한계를 보이는 자리라 그대로 |
| 4-1 | externalMergeSort | 고침 S5 | 정본 주석 네 곳을 참인 말로(정수 개수로는 런 하나와 힙뿐, 바이트로는 읽기 블록이 더 든다 · Bun 은 256 KiB 까지 블록 하나 — 실측) · 원고 전체 코드 동일하게 · (신규) 스텁 시험의 시드 없는 Math.random 교체 |
| 4-1 | treeDiameter | 사유 | 실습 제약(원고 1393행)이 이미 w ≥ 0 이고 원고 475·479행이 「-1 표시는 가중치 0 이상에 기댄다」, 492~503행이 음수 반례를 보인다 |
| 4-2 | subtreeSumQuery | 고침 S5 | tout 의 말 「나간 자리」 → 「준 자리」(정본 주석·머리 설명·원고 두 벌·proof.ts JSDoc), 「나온 차례가 아니다」 명시 |
| 4-2 | minMaxPair | 사유 | 실습 절·스텁·정본 어디에도 「분할 정복」이 없다. 「지시서」는 KAN-058 S7 집필 지시(KANBAN.cards/KAN-058-8XT6PC.md:160)였고 원고 205~229행이 분할 정복을 대안으로 세워 수치로 반박한다(n=100,000 비교 165,534 대 149,998) |
| 4-2 | dfsTraversal | 고침 S5 | 정본 머리 JSDoc 의 실습 지칭 교체 · (신규) treeDiameter · heavyLightDecomposition 정본 JSDoc 의 같은 문장도 |
| 4-2 | heavyLightDecomposition | 고침 S5 | 정본 주석의 「마디」 → 원고의 「칸」·「위 칸」, 원고 코드 두 벌 동일하게 |
| 4-2 | minCut | 사유 | minCut 은 디닉 마지막 BFS 의 level 배열이 필요한데 maxFlow 정본은 유량 값만 내보낸다(maxFlow-guide.ref.ts:28). 원고 694~698행이 그 차이를 설명한다. 바꾸려면 다른 편 정본의 공개 표면을 바꿔야 한다 |
| 3-2 | 「결함 없음이라 적은 편」(expectedValueDp · meetInTheMiddleSubsetSum · countInversions 등) | 해당 없음 | 결함 기록이 아니다 |
