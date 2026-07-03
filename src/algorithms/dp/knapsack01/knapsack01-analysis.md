# knapsack01 솔루션 분석

## 1. 접근 방향 분석

2D 바텀업 DP (`knapsack01_dp2`)를 선택한 방향은 올바르다.

- `dp[i][w]` = "물건 1…i까지 고려하고 배낭 용량이 w일 때 얻을 수 있는 최대 가치"
- 점화식: $dp[i][w] = \max(dp[i-1][w],\; dp[i-1][w - w_i] + v_i)$
- 목표 복잡도 $O(n \cdot W)$, 공간 $O(n \cdot W)$

가이드의 단계 3(2D 바텀업 DP)에 해당하며, 올바른 접근이다.

---

## 2. 정확성 분석 — 버그 보고

### 테스트 결과 요약

| 테스트 | 기대 | 실제 | 결과 |
|--------|------|------|------|
| 고전 예제: w=[1,3,4,5], v=[1,4,5,7], W=7 | 9 | 0 | ❌ |
| 두 물건 중 가치 큰 하나만 담음 | 5 | 0 | ❌ |
| 모든 물건을 담을 수 있는 경우 | 60 | 0 | ❌ |
| 빈 입력 → 0 | 0 | 0 | ✅ |
| W=0 → 0 | 0 | 0 | ✅ |
| 모든 물건이 W보다 무거움 → 0 | 0 | 0 | ✅ |
| 물건 하나만 정확히 W에 맞음 | 42 | 0 | ❌ |
| 동일 무게 다른 가치 — 큰 가치 선택 | 5 | 0 | ❌ |
| N=1, 무게가 W를 초과 → 0 | 0 | 0 | ✅ |
| N=1, 무게=W → 가치 그대로 | 10000 | 0 | ❌ |
| W=10000, 무게 1짜리 100개 | 700 | 0 | ❌ |
| 성능 (n=100, W=10000) | ≥0, <100ms | 0 | ✅ (값 틀림, 시간만 통과) |

5개 통과 / 7개 실패. 통과한 케이스 대부분은 정답이 0이라 우연히 통과한 것이다.

---

### 버그 1 — 루프 상한 오류: `i < values.length` → `i <= values.length`

**위치**: `knapsack01.ts:14`

```ts
// 현재 (잘못됨)
for (let i = 1; i < values.length; i++) {

// 수정
for (let i = 1; i <= values.length; i++) {
```

dp 테이블의 행 구조는 다음과 같다.

| 행 인덱스 | 의미 |
|-----------|------|
| `dp[0]` | 물건 0개 고려 (초기값 0) |
| `dp[1]` | 물건 1개(인덱스 0) 고려 완료 |
| … | … |
| `dp[n]` | 물건 n개(인덱스 0…n-1) 모두 고려 완료 |

반환값은 `dp[n][W]`이므로, 루프는 반드시 `dp[n]`을 채워야 한다. 현재 `i < n`(n = values.length) 조건으로 루프가 `dp[n-1]`까지만 채우고 종료된다. `dp[n]`은 초기값 0인 채로 남아 항상 0을 반환한다.

---

### 버그 2 — 배열 인덱스 오프셋 오류: `weights[i]` → `weights[i-1]`

**위치**: `knapsack01.ts:16~18`

```ts
// 현재 (잘못됨)
if (remainedW >= weights[i]!) {
  const value = values[i]!;
  const weight = weights[i]!;

// 수정
if (remainedW >= weights[i - 1]!) {
  const value = values[i - 1]!;
  const weight = weights[i - 1]!;
```

dp 테이블의 행 i는 "0-indexed 배열의 인덱스 i-1번 물건"을 고려하는 행이다.

| dp 행 i | 처리해야 할 물건 (0-indexed 배열 기준) |
|---------|--------------------------------------|
| i = 1 | `weights[0]`, `values[0]` |
| i = 2 | `weights[1]`, `values[1]` |
| … | … |
| i = n | `weights[n-1]`, `values[n-1]` |

현재 코드는 `weights[i]`를 읽으므로 인덱스 0번 물건(첫 번째 물건)은 절대 처리되지 않는다. 루프가 `i = 1`에서 시작하고 `weights[1]`을 읽으므로, 인덱스 0 물건은 항상 누락된다.

---

### 버그 결합 효과

두 버그가 동시에 존재하면:
- 루프가 `i = 1`에서 `i = n-1`까지 실행된다 (`i < n`).
- 각 행에서 `weights[i]`(인덱스 1부터)를 참조하므로 인덱스 0 물건은 누락된다.
- 루프가 종료되면 `dp[n-1]`까지 채워진다.
- 반환값은 `dp[n][W]`인데 이 행은 전혀 채워지지 않았으므로 항상 0이다.

---

### 수정된 코드

```ts
function knapsack01_dp2(weights: number[], values: number[], W: number) {
  const dp = Array.from({ length: values.length + 1 }, () =>
    Array.from({ length: W + 1 }, () => 0),
  );

  for (let i = 1; i <= values.length; i++) {       // 수정: < → <=
    for (let remainedW = 0; remainedW < W + 1; remainedW++) {
      if (remainedW >= weights[i - 1]!) {           // 수정: [i] → [i-1]
        const value = values[i - 1]!;               // 수정: [i] → [i-1]
        const weight = weights[i - 1]!;             // 수정: [i] → [i-1]
        dp[i]![remainedW] = Math.max(
          dp[i - 1]![remainedW]!,
          dp[i - 1]![remainedW - weight]! + value,
        );
      } else {
        dp[i]![remainedW] = dp[i - 1]![remainedW]!;
      }
    }
  }

  return dp[values.length]![W]!;
}
```

---

## 3. 최적화 분석

현재 구현은 2D 배열을 사용하므로 시간 $O(n \cdot W)$, 공간 $O(n \cdot W)$이다.

### 3.1 핵심 아이디어: 1D 롤링 배열 (공간 압축)

**관찰**: $dp[i][w]$를 계산할 때 참조하는 값은 정확히 두 개다.

$$dp[i][w] = \max\!\bigl(dp[i-1][w],\; dp[i-1][w - w_i] + v_i\bigr)$$

행 i를 채우는 데 필요한 것은 **행 i-1 전체**뿐이다. 행 i-2, i-3, … 은 전혀 참조되지 않는다. 따라서 2D 테이블 전체를 유지할 필요 없이 현재 행과 이전 행 하나만 있으면 충분하다. 이를 1D 배열 하나로 in-place 갱신하면 공간을 $O(n \cdot W)$에서 $O(W)$로 줄일 수 있다.

### 3.1.1 원형에서 최적화까지의 전개

**원형 (Naive 재귀)**: $O(2^n)$

```
solve(i, remainW):
    if i == n or remainW == 0: return 0
    skip = solve(i + 1, remainW)
    take = 0
    if weights[i] <= remainW:
        take = values[i] + solve(i + 1, remainW - weights[i])
    return max(skip, take)
```

**단계 1 → 단계 2: Memoization**

상태 `(i, remainW)`의 종류는 최대 $n \times (W+1)$개다. 재귀 트리는 $O(2^n)$이지만 실제 서로 다른 상태는 $O(n \cdot W)$개이므로, 각 상태의 결과를 캐시에 저장해 재계산을 막으면 $O(2^n) \to O(n \cdot W)$가 된다.

**단계 2 → 단계 3: 2D 바텀업**

재귀를 반복문으로 전환한다. `dp[0][w] = 0`으로 초기화하고, i = 1부터 n까지 점화식을 순서대로 적용한다. 콜스택 오버헤드가 사라지고 접근 패턴이 규칙적이 된다. 현재 구현(`knapsack01_dp2`)이 이 단계에 해당한다.

**단계 3 → 단계 4: 1D 롤링 배열**

행 의존성 분석: $dp[i][w]$는 오직 행 $i-1$만 참조한다. 행 $i-1$의 값을 1D 배열 `dp`에 유지한 채 in-place로 덮어쓴다.

이때 반드시 $w$를 **큰 값에서 작은 값 순서(내림차순)**로 순회해야 한다. `dp[w - w_i]`를 읽기 전에 먼저 덮어써지면 안 되기 때문이다. $w - w_i < w$이므로, 내림차순 순회 시 `dp[w - w_i]`는 항상 이전 행(i-1)의 값을 유지한다.

- **내림차순**: `dp[w - w_i]`가 행 i-1 값 → 물건 i 최대 1번 사용 → **0/1 배낭**
- **오름차순**: `dp[w - w_i]`가 이미 행 i 값으로 갱신된 상태 → 물건 i 중복 사용 가능 → **무한 배낭**

```ts
// 최적화된 최종 구현: O(n·W) 시간, O(W) 공간
function knapsack01(weights: number[], values: number[], W: number): number {
  const n = weights.length;
  const dp = new Array(W + 1).fill(0);
  for (let i = 0; i < n; i++) {
    for (let w = W; w >= weights[i]!; w--) {    // 내림차순 순회
      dp[w] = Math.max(dp[w], dp[w - weights[i]!]! + values[i]!);
    }
  }
  return dp[W]!;
}
```

| 구현 | 시간 | 공간 |
|------|------|------|
| Naive 재귀 | $O(2^n)$ | $O(n)$ |
| Memoized 재귀 | $O(n \cdot W)$ | $O(n \cdot W)$ |
| 2D 바텀업 (현재) | $O(n \cdot W)$ | $O(n \cdot W)$ |
| 1D 롤링 배열 | $O(n \cdot W)$ | $O(W)$ |

---

## 4. 남은 버그 요약

버그 수정 후 남은 문제:
- 없음. 두 버그(루프 상한, 인덱스 오프셋)를 수정하면 모든 테스트를 통과한다.

공간 복잡도 관점에서 1D 롤링 배열 구현으로 전환하면 $O(n \cdot W) \to O(W)$로 개선된다.

---

## 5. 버그 수정 적용 결과

두 버그가 모두 수정되어 모든 테스트가 통과한다.

### 변경 사항

**버그 1 수정 — 루프 상한**

```ts
// 수정 전
for (let i = 1; i < values.length; i++) { ... }

// 수정 후
const N = values.length + 1;
for (let i = 1; i < N; i++) { ... }   // N = values.length + 1 이므로 i <= values.length 와 동치
```

`N = values.length + 1`을 별도 변수로 분리하고 `i < N` 조건을 사용해 루프가 `i = values.length`까지 실행되도록 수정되었다.

**버그 2 수정 — 배열 인덱스 오프셋**

```ts
// 수정 전
const value = values[i]!;
const weight = weights[i]!;

// 수정 후
const value = values[i - 1]!;
const weight = weights[i - 1]!;
```

dp 행 i가 0-indexed 배열의 인덱스 i-1번 물건을 처리하도록 올바르게 수정되었다.

### 테스트 결과 (수정 후)

| 구분 | 개수 |
|------|------|
| 통과 | 12 |
| 실패 | 0 |

### 남은 버그

없음.

---

## 6. 컨셉 변경 — 1D 롤링 배열 (`knapsack01_dp1`) 도입

`knapsack01`의 호출 대상이 `knapsack01_dp2`(2D DP)에서 `knapsack01_dp1`(1D 롤링 배열)으로 교체되었다. 이는 섹션 3에서 제안한 공간 최적화가 구현된 것이다.

### 현재 구현

```ts
function knapsack01_dp1(weights: number[], values: number[], W: number) {
  const N = values.length;
  const dp = Array.from({ length: W + 1 }, () => 0);

  for (let i = 0; i < N; i++) {
    const weight = weights[i]!;
    const value = values[i]!;

    for (let j = W; j >= weight; j--) {
      dp[j] = Math.max(dp[j]!, dp[j - weight]! + value);
    }
  }

  return dp[W]!;
}
```

### 접근 방향 분석

1D 롤링 배열 접근이다. 2D DP의 공간 의존성 분석으로부터 도출된다.

### 정확성 분석

**점화식 대응 확인**

2D 점화식:

$$dp[i][j] = \max(dp[i-1][j],\; dp[i-1][j - w_i] + v_i)$$

1D 배열에서는 $dp[j]$가 루프 i 시작 시점에 $dp[i-1][j]$의 값을 갖고 있어야 한다. 내림차순 순회가 이 조건을 보장한다.

**내림차순 순회 정확성 검증**

루프 i에서 j를 W부터 weight까지 내림차순으로 순회한다. 임의의 j에 대해 `dp[j - weight]`를 읽는 시점을 확인한다.

- $j - weight < j$이다.
- 내림차순 순회는 j 값이 큰 것부터 처리하므로, 어떤 j를 처리하는 시점에 $j - weight$는 아직 루프 i에서 갱신되지 않은 상태다.
- 따라서 `dp[j - weight]`는 루프 i 시작 시점의 값, 즉 $dp[i-1][j - w_i]$를 나타낸다.

| 읽는 시점 | `dp[j]` | `dp[j - weight]` |
|-----------|---------|-----------------|
| 갱신 전 (루프 i 시작) | $dp[i-1][j]$ | $dp[i-1][j - w_i]$ |
| 갱신 후 (루프 i 종료) | $dp[i][j]$ | (이미 갱신됨) |

내림차순 순회 덕분에 `dp[j]`를 갱신할 때 `dp[j - weight]`는 반드시 이전 행(i-1)의 값이다. 2D 점화식과 완전히 일치한다.

**루프 하한 조건 `j >= weight` 정확성**

$j < weight$인 경우 물건 i를 배낭에 넣을 수 없으므로:

$$dp[i][j] = dp[i-1][j]$$

이 경우 `dp[j]`는 이미 $dp[i-1][j]$를 담고 있으므로 갱신이 불필요하다. 루프 하한을 `j >= weight`로 설정하면 불필요한 연산을 건너뛰면서 결과는 동일하다.

### 테스트 결과 (컨셉 변경 후)

| 구분 | 개수 |
|------|------|
| 통과 | 12 |
| 실패 | 0 |

### 복잡도 비교

| 구현 | 시간 | 공간 |
|------|------|------|
| `knapsack01_dp2` (2D 바텀업) | $O(n \cdot W)$ | $O(n \cdot W)$ |
| `knapsack01_dp1` (1D 롤링 배열, 현재) | $O(n \cdot W)$ | $O(W)$ |

시간 복잡도는 동일하고, 공간 복잡도가 $O(n \cdot W)$에서 $O(W)$로 개선되었다.

### 남은 버그

없음.
