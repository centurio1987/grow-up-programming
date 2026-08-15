# 이해 게이트 전수 감사 — `src/algorithms/` 111편

> 실측일 **2026-08-15** · 도구 `.claude/skills/guide-for-problem/scripts/comprehension-gate-batch.sh`
> 판정 근거는 전부 실행 출력이다 — 추측으로 채운 칸은 없다.
>
> 원시 출력 `docs/audit/comprehension-gate/raw/<이름>.txt` (111편, 936K) ·
> 집계 `docs/audit/comprehension-gate/results.tsv`
> **이 디렉터리를 지우면 재개가 깨진다** — 러너는 `raw/` 의 판정 유무로 건너뛸 건을 고른다.

**판정된 74편 중 52편이 미통과다(70%). 그중 50편이 같은 질문 하나에서 떨어졌다.**
37편은 외부 모델 사용량 소진으로 판정하지 못했다 — 통과가 아니라 **미판정**이다.

| 판정 | 건수 | 뜻 |
| --- | --- | --- |
| 통과 (exit 0) | 22 | 응답한 모델 전부가 본문만으로 5개 질문에 답함 |
| **미통과 (exit 3)** | **52** | 한 모델이라도 `근거 없음`·`결론만 있음` 판정 |
| 미판정 (exit 2) | 37 | 두 모델 다 사용 불가. **통과로 간주 금지** |

---

## 클래스 — "이 방법 말고 저 방법은 왜 지는가"가 없다

실패 52편 중 **50편이 Q1**, 그중에서도 **(b) 절차 층위**다. 나머지는 Q5 6편 · Q3 3편 · Q4 2편.

Q1(b)가 묻는 것은 이것이다 — *같은 목표를 노리지만 더 단순하거나 더 먼저 떠오르는 다른
절차·설계를 본문이 **실명으로** 제시하고, **같은 입력에서 수치로** 대조하는가.*

가이드들이 실제로 하는 대조는 **naive(무식한 완전탐색) ↔ 최종 해법** 하나뿐이다.
정작 독자가 막히는 자리인 **경쟁 설계와의 대조**가 없다. 채점 모델이 지목한 그대로 옮긴다.

| 가이드 | 본문에 없다고 지목된 경쟁 설계 |
| --- | --- |
| `knapsack01` | 무게당 가치 기준 정렬 후 담는 **그리디** — 최적해를 못 내는 반례와 수치 대조가 없음 |
| `topologicalSort` | **DFS 기반 위상 정렬** — 큐 기반과 같은 입력에서 대조하지 않음 |
| `mosAlgorithm` | `l` 기준 단순 정렬 · `r` 기준 단순 정렬 — 포인터 이동이 왜 폭증하는지 수치 없음 |

**"어떻게 작동하는가"는 다 있는데 "왜 하필 이것인가"가 없다.** 항목을 다 채웠는데도
이해가 생기지 않는다는 인상은 여기서 온다. 명세가 `naive` 절에 요구하는 것이
"가장 순진한 방법"과 "막히는 지점"뿐이고, 경쟁 설계 대조를 요구하는 항목이
**명세 어디에도 없었다**는 것이 직접 원인이다.

### 이 감사가 기존 피드백 루프와 다른 점

지금까지 지적은 **명세에 MUST 한 줄을 더하는 것**으로만 처리됐다(`0cc8b8e` E6·E7,
`4d9bdec` E7·E8). 측정 없이 항목만 늘면 문서는 체크박스의 합집합이 되고, 집필은 채우기가 된다.

이번 목록은 반대 방향이다 — **먼저 측정 장치(H축)를 배선하고, 그 측정이 반복 실패를 가리킨
자리**를 적었다. 그래서 처방도 항목 추가가 아니라 **기존 `naive` 절 직무의 재정의**로 간다.

---

## 미통과 52편 — 재집필 대상

대괄호는 떨어진 질문. `Q1` 은 위 클래스, `Q3` 정당성, `Q4` 반례, `Q5` 구현 실수 결과값.

### array (14)
`bestTimeToBuyAndSellStockK`[Q1] · `diffArrayRangeUpdate`[Q1] · `editDistance`[Q1] ·
`fenwickRangeSum`[Q1,Q3,Q5] · `houseRobber`[Q1] · `kadane`[Q1] · `largestRectangleInHistogram`[Q1] ·
`longestCommonSubsequence`[Q1] · `longestSubarrayAtMostSum`[Q1] · **`mosAlgorithm`**[Q1,Q5] ·
`nextGreaterElement`[Q1] · `prefixSumRangeQuery`[Q1,Q5] · `slidingWindowMaximum`[Q1] ·
`sparseTableRangeMin`[Q1]

### graph (10)
`articulationPoints`[Q1] · `bfsShortestPath`[Q1] · `bridgesInGraph`[Q1] · `connectedComponents`[Q1] ·
`countIslands`[Q1] · `dfsAllPaths`[Q1] · `dfsTraversal`[Q1] · `directedCycleDetection`[Q1] ·
`stronglyConnectedComponents`[Q1] · `topologicalSort`[Q1]

### dp (7)
`expectedValueDp`[Q1] · `knapsack01`[Q1] · `matrixChainMultiplication`[Q1] ·
`palindromePartitioningMinCut`[Q1] · `subsetSum`[Q1] · `treeMaxIndependentSet`[Q1] · `tspBitmask`[Q1]

### advanced (5)
`convexHullTrick`[Q1] · `countInversions`[Q1] · `divideAndConquerDp`[Q1] ·
`knuthOptimization`[Q1,Q3] · `nQueens`[Q1]

### bit-manipulation (4)
`enumerateSubmasks`[Q1] · `lowestSetBit`[Q1] · `matrixPowerFibonacci`[Q1] · `singleNumberXor`[Q4]

### geometry (3) · graph-flow (3)
`bentleyOttmann`[Q1] · `convexHull`[Q1] · `polygonArea`[Q1] ·
`isBipartite`[Q1] · `minCut`[Q1] · `primMst`[Q1,Q3]

### binary-search (2) · number-theory (2) · sorting (1) · etc (1)
`binarySearch`[Q1,Q5] · `ternarySearch`[Q1,Q4,Q5] ·
`babyStepGiantStep`[Q1] · `binomialModP`[Q1] · `quickSort`[Q5] · `maxCounters`[Q1]

> **`mosAlgorithm` 이 이 목록에 있다는 것이 이 감사의 요점이다.** 그 글은 `spec.md` 의
> 모범 예시이자 `paths.json` 의 `exemplars.algo-guide` 였고, 명세의 E6·E7 예문이 그 글에서
> 역추출됐다. 기준이 산출물에서 나오면 그 산출물은 자기 자신을 통과시킨다.
>
> **`mosAlgorithm` 은 2026-08-15 재집필했다(v3.0.0).** 아래 「재집필 1호」 참조.
> 다만 **H축 재판정은 아직 못 했다** — 외부 모델 할당량이 소진된 상태다.

---

## 통과 22편 — 재집필 시 참조군

`meetInTheMiddleSubsetSum` · `minMaxPair` · `bestTimeToBuyAndSellStock` ·
`longestIncreasingSubsequence` · `maximumProductSubarray` · `segmentTreeRangeMin` ·
`subarraySumEqualsK` · `parametricBinarySearch` · `searchInRotatedSortedArray` ·
`coinChangeWays` · `digitDp` · `unboundedKnapsack` · `closestPairOfPoints` · `pointInPolygon` ·
`rotatingCalipersDiameter` · `segmentsIntersect` · `kruskalMst` · `maxBipartiteMatching` ·
`maxFlow` · `minCostMaxFlow` · `undirectedCycleDetection` · `zeroOneBfs`

**모범 예시를 여기서 고른다.** 다만 통과는 "5개 질문에 답이 가능하다"는 하한이지 상한이 아니다.

---

## 미판정 37편 — 할당량 회복 후 재실행

codex 사용량 한도(리셋 2026-09-14) · agy 개인 할당량 소진(약 5일)으로 **두 모델 모두 응답
불가**. 러너는 재개 가능하므로 같은 명령을 다시 돌리면 이 37편만 이어서 판정한다.

- **number-theory (9)** `crt` · `extendedEuclidean` · `fastPower` · `fftMultiply` · `gcd` ·
  `isPrimeTrial` · `millerRabin` · `pollardRho` · `sieveOfEratosthenes`
- **sorting (8)** `countingSort` · `externalMergeSort` · `insertionSort` · `kthSmallest` ·
  `medianFromDataStream` · `radixSort` · `sortArray` · `topKFrequent`
- **string (8)** `ahoCorasick` · `findAllOccurrences` · `kasaiLcp` · `longestPalindrome` ·
  `radixTree` · `suffixArray` · `suffixAutomaton` · `trie`
- **shortest-path (6)** `aStarSearch` · `bellmanFord` · `dagShortestPath` · `dijkstra` ·
  `floydWarshall` · `spfa`
- **tree (6)** `heavyLightDecomposition` · `lowestCommonAncestor` · `subtreeSumQuery` ·
  `treeDiameter` · `treeIsomorphism` · `treeRerooting`

판정된 74편의 미통과율이 70% 이므로 이 37편도 상당수가 미통과일 것으로 **추정**되나,
**추정을 목록에 섞지 않는다.** 돌려서 확인한 것만 위 두 목록에 넣는다.

---

## 재현

```bash
# 낱건
bash .claude/skills/guide-for-problem/scripts/comprehension-gate.sh <가이드.mdx>

# 전수 (재개 가능 — 이미 판정된 건은 건너뛴다)
GATE_JOBS=3 bash .claude/skills/guide-for-problem/scripts/comprehension-gate-batch.sh \
  <출력디렉터리> $(find src/algorithms -name '*-guide.mdx' -not -path '*_deprecated*' | sort)
```

건당 약 45초, 병렬 3에서 111편에 약 28분. 종료코드 **0 통과 · 3 미통과 · 2 미실행**.
`results.tsv` 에 `exit · secs · name · failed_q · file` 이 쌓인다.

---

## 자료구조 트랙(`ds-guide`)의 같은 공백 — 명세 대조로 진단

**할당량 소진으로 ds 69편에는 게이트를 돌리지 못했다.** 대신 명세와 산출물을 대조했다.
8단계 골격으로 쓰인 35편이 대상이다.

| 층위 | 명세가 요구했는가 | 산출물 |
| --- | --- | --- |
| (a) 순진한 설계 대조 — `naive.limit` | **요구함.** *"형용사 서술을 쓰지 않는다 … 숫자로 대조한다"* | **35/35 (100%)** |
| (b) 경쟁 설계 대조 — `naive.rule` | **요구 없음.** *"관찰 → 설계 규칙 → 불변식"* 사슬만 | **10/35 (29%)** |

`deque` 는 배열 하나(순진)를 눕힌 뒤 **배열 두 개(등 맞대기)를 다시 세워** 큐 패턴에서는
옳다고 인정하고 앞뒤 교대 호출에서 `r = 4.00` 으로 눕힌다. `avlTree` 는 같은 자리에서
레드블랙·2-3 트리를 **이름만 대고** 지나간다. 같은 골격에서 결과가 갈렸다.

**명세가 요구한 것은 100%, 요구하지 않은 것은 29% 나온다.** algo 트랙의 Q1 실패율(68%)과
같은 병이고 위치만 다르다.

> 이 진단은 **명세 대조이지 이해 게이트 실측이 아니다.** (b) 를 "있음"으로 센 기준은
> `naive.rule` 절 안의 수치 존재이고, 그 수치가 실제로 경쟁 설계 대조인지까지는 재지 않았다
> — **오차는 한 방향이다: 실제보다 후하게 나온다.** 할당량 회복 후 게이트로 확인한다.

처방: `ds-guide` 의 `naive.rule` 직무에 경쟁 설계 대조를 넣고 `B4` 를 MUST 로 올렸다.
algo 와 같이 **항목을 새로 늘리지 않고 기존 직무를 고쳐 썼다.**

---

## 재집필 1호 — `mosAlgorithm` v3.0.0 (2026-08-15)

개선된 명세(`naive` 직무 4)와 이해 게이트 질문 5개를 **집필 기준**으로 삼아 재집필했다.
채점 기준으로 쓴 것이 아니다 — 자기 채점은 이 감사가 진단한 병 자체다.

메운 자리 다섯. 앞의 셋은 명세가 요구했는데 빠져 있던 것, 뒤의 둘은 게이트가 지목한 것이다.

| 자리 | 이전 | 이후 |
| --- | --- | --- |
| `naive` 경쟁 설계 (직무 4·Q1) | 없음 | `l`만·`r`만 정렬을 세우고 **이동 칸 수·성장률로 대조** |
| `idea.formal` 확인 질문 | 없음 | `freq` 가 왜 한 비트로 안 되는지 + 손으로 따라가는 질문 1개 |
| `idea.proof` 귀납 | "유지되는 이유" 한 문단 | **기저 → 귀납 가정 → 귀납 단계**, 경우의 완전성 명시 |
| `impl` 실수 결과값 (Q5) | "조용히 틀립니다"(값 없음) | `[3,3,2]` → **`[2,3,3]`** 실제 반환값 |
| `optcode` 기억법·실수 | 없음 | 홀짝을 블록이 아닌 질의로 판단하는 실수 + 한 줄 기억법 |

**틀린 주장 하나를 바로잡았다.** 이전 판은 축소를 먼저 하면 *"빈도가 음수가 되는 사고가
납니다"* 라고 썼는데, 실제로 돌려 보니 **답은 틀리지 않는다**(무작위 40만 건 대조, 반례 0).
`freq` 가 음수로 내려가는 것은 사실이나 그것은 **중간 상태**이고, distinct 는 $0 \leftrightarrow 1$
경계만 보므로 확장 루프가 오차를 상쇄한다. 검증되지 않은 주장이 "근거 있는 서술"의 외양으로
실려 있던 자리다 — 재집필본은 **왜 그런데도 확장 먼저를 쓰는지**(다른 질의로 갈아 끼울 때
중간 상태의 불변식이 필요하다)로 고쳐 썼다.

수치의 근거는 `_scratch/verify-guide-claims.ts` 다. 본문의 모든 표·반례가 이 파일에서 재현된다.

**통과한 검증**: mermaid 파서 · MDX 빌드 · 본문 코드 실행(완전탐색 5,000건 대조 일치) ·
타입 · 린트(경고 0) · 인용 246건 · 링크 255건.

**H축은 미실행이다.** 재집필본이 이해 게이트를 통과했는지는 **확인되지 않았다** —
할당량 회복 후 아래 명령으로 판정해야 한다. 미실행은 통과가 아니다.

```bash
bash .claude/skills/guide-for-problem/scripts/comprehension-gate.sh \
  src/algorithms/array/mosAlgorithm/mosAlgorithm-guide.mdx
```

---

## Q6 신설과 3차 재진단 (2026-08-15)

2차 재집필(v3.0.0) 뒤에도 같은 지적이 왔다 — *"아이디어 자세히 들여다보기를 포함한 모든
설명에 알고리즘 전개 과정과 해설이 없다."* 재진단 결과 **이 감사의 전제가 틀렸다.**

**이해 게이트는 이 문제를 못 잡는다.** "아이디어 자세히 들여다보기" 절에서 그림·코드·표 없이
이어지는 산문 문단의 최대 연속 수를 재면:

| 게이트 판정 | 편수 | 평균 최대연속 |
| --- | --- | --- |
| 통과 | 22 | **7.8문단** |
| 미통과 | 51 | 6.7문단 |

**통과편이 더 나쁘다.** Q1~Q5는 *"답할 수 있는가"* 를 묻지 *"따라갈 수 있는가"* 를 묻지 않아,
결론만 있어도 답이 나온다. 그래서 **Q6(전개 재현 시험)** 을 신설했다 —
(a) 단계마다 상태 값이 있는가 (b) **어느 갈림길로 왜 갔는지가 조건의 실제 값으로** 있는가
(c) 모든 분기가 최소 한 번씩 등장하는가.

### Q6을 현재 `mosAlgorithm` v3.0.0 에 돌린 결과

```
Q1 PASS · Q2 PASS · Q3 PASS · Q4 PASS · Q5 PASS · Q6 FAIL
VERDICT: FAIL   (haiku fallback 판정 — codex·agy 쿼터 소진)
```

**Q1~Q5가 전부 통과하는데 Q6만 떨어진다** — 기존 다섯 질문으로는 이 결함을 볼 수 없었다는
직접 증거다. 지목된 것 둘:

- **(b)** *"어떤 작업을 했는가만 명확하고, 왜 그 갈림길로 갔는가를 조건의 참/거짓으로 실제
  값으로 보이지 않는다."*
- **(c)** *"네 while 루프 중 **왼쪽 확장(`curL > l`) 분기가 한 번도 나타나지 않는다.**"*

(c)는 신설 스캐너가 `branch_cover = 0/4` 로 잰 것과 **같은 자리**다. 기계 계수와 외부 모델
판정이 서로를 확증했다.

### 2차 재집필이 지표를 악화시켰다

```
mosAlgorithm-guide.mdx    최대 연속 산문    산문 분량
  v2.0.0 (재집필 전)          7문단          9,439자
  v3.0.0 (2차 재집필)         9문단         13,015자   ← +38%, 2문단 악화
```

추가한 것이 전부 셀 수 있는 장치(기억법 한 줄·오해 호출·확인 질문·대조 표)였고 전개는 한 줄도
늘지 않았다. voice 금지 목록이 이 실패를 이미 이름 붙여 두고 있었다 —
*"친절 장치로 깊이를 대체하기: 어려운 단계는 건너뛰면서 존댓말·기억법·오해 호출만 갖춘 글."*

### 근본 원인 — 항목이 없어서가 아니라 면제 등급이라서

`specs/algo-guide/spec.json` 에 요구가 **이미 있었다.**

```
D2  IF-APPLICABLE   트레이스 예시 — 작은 고정 입력에 대한 단계별 손 추적
D3  IF-APPLICABLE   도식 — 핵심 개념 직후 그림이 있고 상태 변화 연산에 before/after 가 있다
```

`IF-APPLICABLE` 은 *"뺐다면 왜 뺐는지 메모가 있어야 충족"* — **메모 한 줄로 빠져나간다.**
전수 176편 중 규칙을 지키는 편이 **0편**인데 아무도 안 걸린 이유가 이것이다.
그래서 처방은 **항목 추가가 아니라 등급·충족 위치·판정 방식의 변경**이다(새 원칙 코드 0개).

### 배선한 것

| 지점 | 변경 |
| --- | --- |
| `tools/check-guide-rhythm.ts` (신설) | R1 전개 밀도 · R2 트레이스 단계 수 · **R3 분기 피복** · **R4 인용 결속** · R5 금지 문형. `ci.ts gates` 편입 |
| `tools/_baseline/guide-rhythm.tsv` (신설) | 180편 래칫. 재집필하면 행을 지운다 — **줄 수가 곧 남은 부채** |
| `algorithm-guide-canvas.md` | 4단계 *"설명은 결정 지점만"* → 담당 범위 선언으로 복원 · 3.1 "정의마다 계산" · **`trace` 절 신설** · clue/optcode/sim 결속 |
| `specs/algo-guide/spec.{json,md}` 2.0.0 | `sections[]` 에 `trace`(order 45) · **D2·D3 → MUST** |
| `voice.json` `params.max_prose_run: 2` | rhythm 중 셀 수 있는 부분을 계수 칸으로 |
| `QUALITY_RUBRIC.md` V1 | **`rhythm` 은 인용이 아니라 세어서 판정** — 표가 없으면 미흡 |
| `comprehension-gate.sh` | **Q6** + haiku fallback(codex·agy 둘 다 불가일 때만) |
| `tools/algo-skeleton.test.ts` (신설) | 규칙·템플릿·표본 셋이 같은 골격인지 회귀 시험 |

---

## 절제 시험 — 이 설계의 반증 장치 (2026-08-15)

**"체크박스만 늘었다"를 판별하는 유일한 방법.** 시험편에서 `trace` 절만 통째로 지운 사본을
같은 게이트에 넣는다. 사본이 **통과하면** 트레이스는 장식이었던 것이므로 규격을 되돌리고,
**실패해야** 트레이스가 이해를 실제로 지고 있다는 증거가 된다.

E6·E7과 `naive` 직무 4가 실패한 이유는 **그 항목의 유무가 독자의 이해를 바꾸는지 아무도 재지
않았기 때문**이다. 절제 시험은 그것을 직접 잰다.

### 1차 — 실패했고, 원인은 규격의 구멍이었다

`trace` 절을 지운 사본이 **Q6을 통과했다.** 채점 모델이 시뮬 프레임에 붙인
`trace: "T1"~"T9"` 태그를 트레이스로 인정했기 때문이다. 결속을 만들려고 붙인 태그가
**우회로**가 됐다. (b)를 *"다음: (0111) & 1011 = 3"* 같은 **계산 결과**로 충족 처리했는데,
그것은 `s > 0` 이 참이라 루프에 들어갔다는 **조건 판정이 아니다.**

spec 의 trace 절 금지 조항(*"시뮬 `detail` 을 늘여 쓴 것은 트레이스가 아니다"*)이 Q6 에
반영되지 않았던 것이라, Q6 을 조였다 — **시뮬 `steps` 배열은 전개로 인정하지 않고**,
(b)는 **분기 조건의 참/거짓 판정**을 요구한다.

### 2차 — 통과

| 사본 | `trace` 절 | Q6 |
| --- | --- | --- |
| 시험편 A | 있음 | **PASS** |
| 절제 사본 | 없음(시뮬만 있음) | **FAIL** — *"계산만 나열되고 각 단계의 조건 판정이 값과 함께 명시되지 않음"* |

다른 변수는 같고 `trace` 유무만 다르다. **트레이스가 이해를 지고 있다는 증거이므로 규격을
유지한다.** 절제 사본은 부수로 Q5 결함도 짚어 냈고(순서를 바꾸면 무엇이 틀리는지 값이 없다),
그것도 실측으로 메웠다.

> **멈춤 규칙**: 배치 3개(약 10편)마다 1편을 무작위로 골라 절제 시험을 돌린다.
> 사본이 통과하면 그 배치들의 트레이스는 장식이 된 것이다 — 배치를 멈추고 규격으로 돌아간다.
> 규격이 시간이 지나며 다시 "채우기"로 마모되는 것을 잡는 장치이고, 비용은 10편당 게이트 1회다.

---

## 시험편 A — `enumerateSubmasks` (2026-08-15)

`mosAlgorithm` 을 시험편으로 쓰지 않았다. exemplar 이자 역추출 원본이라 **개선이 규격 덕인지
지위 덕인지 분리되지 않기 때문**이다. 대신 게이트 미통과편 중 산문 연속이 가장 나쁜 편을 골랐다.

| 지표 | 재집필 전 | 재집필 후 |
| --- | --- | --- |
| `max_prose_run` | 6 | **2** |
| `trace_steps` | 0 | **9** |
| `branch_cover` | 0/4 | **4/4** |
| `cite_clue` / `cite_optcode` | 0 / 0 | **4 / 4** |

`branch_cover = 4/4` 가 핵심이다. `impl` 코드의 네 분기(①루프 조건 ②수집 ③점프 ④공집합)에
라벨을 달고 `trace` 절이 네 자리를 전부 밟는다 — ①은 T2~T8 에서 참, T9 에서 거짓으로 두 결과를
다 낸다. **실제로 굴리지 않으면 이 숫자가 나오지 않는다.**

메운 자리 셋. 전부 실측이 근거다.

- **경쟁 설계 대조(Q1)** — DFS 재귀를 실명으로 세우고 같은 입력에서 눕혔다.
  DFS 는 **항상 정확히 $2^{k+1}-1$번** 호출된다(리프 $2^k$ 개를 만들려고 내부 노드 $2^k-1$ 개를
  경유). `k = 3` 에서 15 vs 8, `k = 16` 에서 131,071 vs 65,536. 네 크기에서 식을 실행으로 확인.
- **실수 결과값(Q5)** — ②③을 뒤바꾸면 `mask` 자신이 빠지고 `0` 이 중복되는데
  **개수는 $2^k$ 개로 그대로**다. 개수 검사로는 안 잡히는 조용한 오류.
- **전개(Q6)** — `trace` 절 신설. 시뮬과 같은 고정 입력 `mask = 0b1011` 을 T1~T9 로 굴린다.

### 판정 — 다섯 층 전부 통과

| 층 | 판정 |
| --- | --- |
| 1 스캐너 R1~R5 | 통과 (`max_prose_run=2` · `9/9` · `4/4` · `4·4` · forbid 0) |
| 2 골격 회귀 | 통과 (6건) |
| 3 실측 정합 | 통과 — 본문 코드 실행값 = trace T9 반환값 = 시뮬 마지막 프레임 `[11,10,9,8,3,2,1,0]`, `mask 0..255` 완전탐색 대조 일치 |
| 4a 이해 게이트 | **PASS — Q1~Q6 전부** |
| 4b 절제 시험 | 통과 (사본 FAIL) |

**이 저장소에서 다섯 층을 모두 넘긴 첫 편이다.** 참고로 같은 게이트에서
`mosAlgorithm` v3.0.0 은 Q1~Q5 가 통과하고 Q6 만 떨어졌다 — 두 편의 차이가 `trace` 절이다.

mermaid · MDX 빌드 · 타입 · 린트 · 인용 · 링크도 통과.

---

## 시험편 B — `segmentsIntersect` (2026-08-15)

**이해 게이트를 이미 통과했던 편**을 골랐다. 진단의 핵심인 *"통과편이 오히려 더 나쁘다"* 를
대표하는 순수 표본이고, H축이 못 보는 결함만 남아 있는 자리다.

| 지표 | 전 | 후 |
| --- | --- | --- |
| `max_prose_run` | 8 | **2** |
| `trace_steps` | 0 | **9** |
| `branch_cover` | 0/0 | **6/6** |

이 편에는 `clue`·`optimize`·`optcode` 절이 없다(최적화 사다리가 없는 주제). 그래서 R4는
적용되지 않고 **R3(분기 피복)이 주 검사**가 된다.

**고정 입력 하나로는 여섯 갈래 중 ①밖에 못 밟는다.** 최종 구현이 ①일반 교차 · ②~⑤공선 접촉
4종 · ⑥false 로 갈리는데, 시뮬 입력(X자 교차)은 ① 하나만 탄다. spec 직무 3대로 짧은 보조 입력
셋을 더해 여섯을 전부 열었다. 특히 **`d4 = 0` 이라는 같은 값이 ①을 막고 ⑤를 여는** 자리가
이 알고리즘의 분업을 보여준다.

### 게이트가 잡아낸 것 — 통과편이었는데 Q1·Q5가 떨어졌다

1차 4a 에서 **Q6 은 PASS, Q1·Q5 가 FAIL** 이었다. 둘 다 실제 결함이라 실측으로 메웠다.

- **Q1(b)** — *"그럼 epsilon 을 두면 되지 않나"* 를 실명 경쟁 설계로 세우고 눕혔다.
  같은 입력에서 정수 외적은 `cross = 1`, `number + eps` 는 `0` 으로 부호가 소실된다.
  **무작위 20,000건 중 551건(2.8%)** 에서 두 방식의 부호가 갈린다.
  epsilon 을 조절해 고칠 수 없다 — 비교 시점이 아니라 **곱셈 단계**에서 이미 값이 죽었다
  ($10^9$ 좌표의 곱은 $10^{18}$ 규모, IEEE 754 안전 정수 한계는 $2^{53} \approx 9\times10^{15}$).
- **Q5** — `onSegment` 검사를 빼면 무엇이 틀리는지 값으로 보였다.
  `s1 = (0,0)-(2,2)`, `s2 = (5,5)-(9,9)` 는 같은 직선 위지만 선분은 떨어져 있는데,
  `d3 === 0n` 만 보면 `true` 로 오판한다. **`onSegment` 가 빠지면 평행하기만 하면 아무리 멀어도
  교차가 된다.**

### 판정

| 층 | 판정 |
| --- | --- |
| 1 스캐너 R1~R5 | 통과 (`max_prose_run=2` · `9/7` · **`6/6`** · forbid 0) |
| 2 골격 회귀 | 통과 |
| 3 실측 정합 | 통과 — 본문 코드 실행값이 trace 여섯 경로 주장과 전부 일치 |
| 4a 이해 게이트 | **PASS — Q1~Q6 전부**(1차 Q1·Q5 FAIL → 실측 보완 후 재실행) |
| 4b 절제 시험 | **통과 — 사본이 Q6 만 FAIL** |

**B의 절제가 A보다 깨끗한 대조다.** 사본에서 **Q1~Q5 는 전부 PASS 이고 Q6 만 FAIL** 이다 —
보완한 Q1·Q5 내용은 `trace` 절 밖에 있어 그대로 남았고 지운 것은 `trace` 뿐이라,
**단일 변수 대조**가 성립한다. 실패 사유도 정확하다: *"일반 교차 경우만 보여줌;
경계 케이스 분기 `d_i = 0` 의 전개는 없음"* — 시뮬은 ①만 보여주고 ②~⑥은 `trace` 절에만 있다.

> **`trace` 절이 Q6 만 담당한다는 것이 기계적으로 분리됐다.** 다른 항목을 대신 채워 주는 것도
> 아니고, 다른 항목이 대신해 줄 수 있는 것도 아니다.

mermaid · MDX 빌드 통과.

> **이 편이 진단을 확증한다.** 재집필 전에도 이해 게이트를 통과했지만, 그것은 Q1~Q5 만
> 있던 시절의 통과였다. Q6 을 넣고 다시 보니 **전개가 없었고**, 실측해 보니 Q1(경쟁 설계)과
> Q5(실수 결과값)도 비어 있었다. *"통과편이 오히려 더 나쁘다"* 가 이렇게 확인됐다.

---

## 배치 착수 조건 — 충족 (2026-08-15)

시험편 2편이 다섯 층을 모두 넘겼다.

| 층 | A `enumerateSubmasks` | B `segmentsIntersect` |
| --- | --- | --- |
| 1 스캐너 R1~R5 | 통과 (2 · 9/9 · **4/4** · 4·4 · 0) | 통과 (2 · 9/7 · **6/6** · — · 0) |
| 2 골격 회귀 | 통과 | 통과 |
| 3 실측 정합 | 통과 | 통과 |
| 4a 이해 게이트 | **Q1~Q6 PASS** | **Q1~Q6 PASS** |
| 4b 절제 시험 | 통과 (사본 FAIL) | 통과 (사본 Q6 만 FAIL) |

**규격을 되돌리지 않는다. T1 배치에 착수할 수 있다.**

### 현황과 배치 순서

```
algo 111편 — 재집필 완료 3편 (래칫 baseline 177편 남음 = 남은 부채)
  T1 미통과  49편   전면 재집필 (Q1 경쟁 설계 + 전개를 한 번에)
  T2 미판정  37편   게이트 먼저 → 미통과분은 T1 합류
  T3 통과편  21편   국소 수술 — 단, B 사례가 보여주듯 Q1·Q5도 함께 볼 것
```

T1 첫 배치 후보(`max_prose_run` 내림차순, 카테고리 묶음):

| 카테고리 | 편 |
| --- | --- |
| array | ~~`mosAlgorithm`(6)~~ **완료** · `diffArrayRangeUpdate`(5) · `houseRobber`(5) · `longestCommonSubsequence`(5) · `slidingWindowMaximum`(5) |
| dp | `knapsack01`(5) · `palindromePartitioningMinCut`(5) · `subsetSum`(5) |
| 기타 | `nQueens`(5) · `matrixPowerFibonacci`(5) · `maxCounters`(5) · `babyStepGiantStep`(5) |

`mosAlgorithm` 을 T1 첫 편으로 3차 재집필한다 — 규격이 검증된 뒤에 손대는 것이 순서이고,
exemplar 순환을 피하려고 시험편에서 뺐던 편이다. **2026-08-16 완료(v4.0.0), 아래 「T1-01」 참조.**

> **멈춤 규칙을 잊지 않는다.** 배치 3개(약 10편)마다 1편을 무작위로 골라 절제 시험을 돌린다.
> 사본이 통과하면 그 배치들의 트레이스는 장식이 된 것이다 — 배치를 멈추고 규격으로 돌아간다.

---

## T1-01 — `mosAlgorithm` v4.0.0 (2026-08-16)

T1 배치의 첫 편. **v3.0.0 이 Q6 에서 떨어진 원인은 항목이 아니라 절이 없던 것**이라,
`trace` 절 신설이 이 재집필의 전부에 가깝다(Q1~Q5 를 채운 v3.0.0 의 내용은 그대로 뒀다).

| 층 | 판정 |
| --- | --- |
| 1 스캐너 R1~R5 | 통과 (`max_prose_run` **6→2** · trace 12단계 / 시뮬 9프레임 · **`4/4`** · 인용 3·6 · forbid 0) |
| 2 골격 회귀 | 통과 (`tools/algo-skeleton.test.ts` 6 pass) |
| 3 실측 정합 | 통과 — 본문 `ts` 펜스를 뽑아 실행한 값이 trace 12단계·시뮬·홀짝 대조와 전부 일치 |
| 4a 이해 게이트 | **PASS — Q1~Q6 전부** (haiku fallback 판정, 아래 단서 참조) |
| 4b 절제 시험 | **통과 — 사본이 Q1~Q5 PASS · Q6 만 FAIL** |

### 고정 입력을 바꾼 것이 이 편의 설계 결정이다

v3.0.0 의 시뮬 입력(`arr` 6칸, 질의 3개)으로는 **네 while 루프 중 ②③ 이 한 번도 안 돈다** —
정렬된 `l`·`r` 이 둘 다 단조 증가라 확장·축소가 각각 한쪽만 발동한다. R3(분기 피복)이
`0/4` 였던 것이 그 사실을 기계로 잰 값이다.

캔버스는 이럴 때 *"입력을 늘리지 말고 두 번째 짧은 입력으로 따로 보인다"* 고 하지만,
**한 입력으로 넷을 다 밟는 편이 낫다**고 판단해 입력을 다시 골랐다. 조건 둘을 걸었다.

```text
arr = [1, 3, 2, 3, 1, 2, 1, 3, 2]   n = 9, B = 3
queries = [[0,8], [5,5], [3,8], [1,2]]

조건 (1) 네 분기 ①②③④ 를 참·거짓 양쪽으로 전부 밟는다      → 실측 4/4
조건 (2) 홀짝 정렬 트릭이 처리 순서를 실제로 바꾼다           → 24칸 → 19칸
```

(2)가 없으면 최적화 절의 R4 인용이 "형식만 T# 를 적은 것"이 된다. 홀짝 트릭은 점근을
안 바꾸는 휴리스틱이라 **단계 번호 대조 말고는 효과를 보일 방법이 없다** — 블록 1의 질의가
하나뿐인 입력에서는 순서가 그대로여서 보일 것이 없다. 앞 여섯 칸을 v3.0.0 의 배열과
같게 둬서 3.1 절의 그림은 그대로 산다.

### 실측으로 채운 것 둘

- **T8·T10 왕복** — 트레이스가 인덱스 6·7·8 을 뺐다가(T8) 도로 넣는(T10) 것을 값으로 보인다.
  `clue` 절이 이 두 단계를 지목하므로 낭비 서술이 결론이 아니라 관찰이 된다.
- **홀짝을 블록이 아니라 `l` 로 판단하는 실수** — 답은 맞고 이동 칸 수만 늘어난다.
  `n=q` 1,000 / 4,000 / 16,000 에서 **4.90배 → 8.09배 → 13.54배**, 성장률이 8 에서 13 으로
  밀린다. 배수가 커진다는 것이 요점이다 — 작은 입력에서 재면 "조금 느린" 정도로 보인다.

수치의 근거는 `src/algorithms/array/mosAlgorithm/_scratch/verify-guide-claims.ts` §5·§6 이다.

### 절제 시험 — 단일 변수 대조

`trace` 절만 통째로 지운 사본(4,463자 감소, 다른 절은 한 글자도 안 건드림)을 같은 게이트에
넣었다. 사본의 실패 사유가 정확하다.

> *"본문에 산문으로 고정 입력을 단계별로 끝까지 굴린 전개가 없다. 시뮬레이션 배열만 제시하고
> 있는데 … (b) 각 단계의 while 분기 조건이 그 시점의 실제 값으로 참/거짓인 근거가 명시되지
> 않으며, (c) 네 개 while 루프가 모두 최소 1회씩 실행되는 단계를 산문이 명시하지 않는다."*

시험편 A·B 와 **같은 패턴이 세 번째로 재현됐다** — 사본이 Q1~Q5 는 그대로 통과하고 Q6 만
떨어진다. `trace` 절이 Q6 만 담당하고, 다른 절이 그것을 대신해 주지 못한다.

**1차 절제가 뚫렸던 우회로가 닫혀 있는 것도 함께 확인됐다.** 사본에는 `trace: "T1"` 태그가
붙은 시뮬 프레임 9개가 그대로 남아 있는데, 판정문이 *"선언형 배열과 그 안의 `title`·`detail`·
`entries`·`trace` 필드는 값의 나열이지 해설이 아니다"* 를 근거로 대며 인정하지 않았다.

### 단서 — 판정 모델이 haiku fallback 이다

codex 는 사용 한도(리셋 2026-09-14), agy 는 개인 할당량(리셋까지 약 113시간)으로 **둘 다
응답 불가**였다. 본편과 절제 사본 **둘 다 같은 조건**에서 판정했으므로 대조 자체는
유효하지만, **외부 모델 둘의 판정은 받지 못했다.** 할당량 회복 후 재판정 대상이다.

**검증 명령 결과**: `bun run tools/ci.ts all` 통과(단계 11개) · `tools/check-guide-rhythm.ts`
180편 위반 0 · 인용 246건 · 링크 255건 · MDX 빌드·mermaid 통과 · biome 경고 0(변경분).
래칫 baseline **178 → 177편**.

---

## 남은 일

1. **미판정 37편 판정** — 배치 러너 재실행(재개 가능).
2. **외부 모델 재판정** — 시험편 A·B 와 T1-01 셋 다 haiku fallback 판정이다. agy 할당량이
   먼저 풀리므로(약 113시간) 회복 시 세 편을 한 번에 다시 돌린다.
3. **ds 트랙 실측** — 위 명세 대조 진단을 게이트로 확인한다. 특히 (b) 가 "있음"으로 잡힌
   10편이 진짜인지.
4. **모범 예시 교체** — `paths.json` 의 `exemplars.algo-guide` 와 `specs/algo-guide/spec.md`
   머리말 두 곳, 그리고 `ppangtolab-teacher` voice 의 `source.exemplars` 도 아직
   `mosAlgorithm` 을 가리킨다. **조건은 이미 충족됐다** — Q1~Q6 을 통과한 판본이 셋 나왔다.
   다만 `mosAlgorithm` 을 그대로 두면 역추출 순환이 남으므로 **시험편 A(`enumerateSubmasks`)
   나 B(`segmentsIntersect`) 로 바꾼다.** 외부 모델 재판정(2번) 뒤에 처리한다.
5. **나머지 49편 재집필** — 다중 실패 6편이 앞선다(`fenwickRangeSum`, `ternarySearch`,
   `binarySearch`, `prefixSumRangeQuery`, `knuthOptimization`, `primMst`).

### 완료

- ~~`naive` 절 직무 재정의~~ — algo `naive` 직무 4 신설 + `B4` MUST 승격(2026-08-15).
  ds `naive.rule` 도 같은 방식으로 처리.
- ~~`mosAlgorithm` 재집필~~ — v3.0.0(2026-08-15) 은 Q6 에서 떨어졌고,
  **v4.0.0(2026-08-16) 이 Q1~Q6 전부 통과**했다. 위 「T1-01」 참조.
- ~~`mosAlgorithm` H축 판정~~ — v4.0.0 에서 수행. 다만 haiku fallback 이라 2번이 남는다.
