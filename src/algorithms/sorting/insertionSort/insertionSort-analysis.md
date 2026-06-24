# insertionSort 분석 보고서

## 1. 접근 방법 방향성 분석

### 개념적 방향성: 올바름

구현이 사용하는 개념은 "새 원소를 sortedA의 끝에 추가한 뒤, 내부 루프로 올바른 위치에 배치한다"이다. 이는 삽입 정렬의 핵심 불변식—**왼쪽 구간은 항상 정렬된 상태**—을 유지하는 방향과 일치한다.

```ts
for (let item of A) {
  sortedA.push(item);           // 새 원소를 끝에 추가
  for (let i = 0; i < sortedA.length; i++) {
    if (sortedA[i]! > sortedA[sortedA.length - 1]!) {
      // sortedA[i]와 마지막 원소를 교환
    }
  }
}
```

### 삽입 메커니즘: 비표준

표준 삽입 정렬은 **오른쪽→왼쪽** 스캔으로 삽입 위치를 찾고, 필요한 위치에서 즉시 종료한다. 현재 구현은 **왼쪽→오른쪽** 전체 스캔 후 마지막 원소와의 교환을 반복한다.

**트레이스: `[1, 2, 5]`에 원소 `1` 삽입 시**

```
sortedA = [1, 2, 5, 1]
i=0: 1 > 1? No
i=1: 2 > 1? Yes → swap → [1, 1, 5, 2]
i=2: 5 > 2? Yes → swap → [1, 1, 2, 5]
i=3: 5 > 5? No
결과: [1, 1, 2, 5] ✓
```

결과는 정확하지만, 내부 루프가 항상 sortedA 전체를 순회한다.

---

## 2. 정확성 분석

### 테스트 결과

```
bun test src/sorting/insertionSort/insertionSort.test.ts
 10 pass / 0 fail  [84.00ms]
```

모든 10개 테스트 통과. 정렬 결과는 항상 올바르다.

### 정확성 증명 (귀납)

**기저:** 외부 루프 첫 번째 반복에서 sortedA = [A[0]]. 단일 원소는 자명하게 정렬됨.

**귀납 단계:** 외부 루프 $k$번째 반복 시작 전에 sortedA[0..k-1]이 정렬되어 있다고 가정한다. 새 원소 item을 끝에 추가하면 sortedA[k] = item. 내부 루프는 i=0부터 i=k까지:

- sortedA[i] > sortedA[k]이면 swap. 이후 sortedA[k]는 더 작은 값이 된다.
- 이 과정을 반복하면, 최종적으로 sortedA[k]에는 "처음에 sortedA[k]였던 item이 올바른 위치로 이동한 결과"가 남는다.

직관적으로: 왼쪽에서 오른쪽으로 스캔하며 sortedA[i] > sortedA[last]이면 교환하므로, 더 큰 값이 계속 뒤로 밀리고 item은 올바른 위치를 찾아간다.

**음수·중복 처리:** `sortedA[i] > sortedA[last]` 조건은 음수와 중복 원소에서 모두 정확히 작동한다.

---

## 3. 최적화 분석

### 현재 시간 복잡도: O(N²) — 목표 미달

문제 요구사항은 $T(N) = O(N + I(A))$이다. 현재 구현은 내부 루프가 항상 현재 sortedA 길이 전체를 순회하므로:

$$T(N) = \sum_{k=1}^{N} k = \frac{N(N+1)}{2} = O(N^2)$$

거의 정렬된 입력($I(A) \approx O(N)$)에서도 내부 루프가 전체를 스캔하므로 O(N)이 아닌 O(N²)이 소요된다. **조기 종료가 없다.**

| 구현 | 거의 정렬된 입력 ($I(A) = O(N)$) | 역순 입력 ($I(A) = O(N^2)$) |
|------|--------------------------------|----------------------------|
| 현재 (좌→우 스캔) | $O(N^2)$ | $O(N^2)$ |
| 표준 삽입 정렬 | $O(N)$ | $O(N^2)$ |

### 성능 테스트가 통과하는 이유

N=10,000, 역순쌍 ≈ N/100 = 100인 입력에서 현재 구현의 총 비교 횟수:

$$\sum_{k=1}^{10000} k = 50{,}005{,}000$$

현대 JS 엔진에서 단순 정수 비교 5천만 회는 ~100ms 이내에 처리 가능하다. 테스트는 통과하지만, 목표 복잡도 $O(N + I(A))$를 달성하지 못한다.

---

## 3.1 핵심 개선 아이디어: 조기 종료가 있는 오른쪽→왼쪽 스캔

### 핵심 아이디어

$i$번째 원소 $B[i]$ = key를 삽입할 때, $B[0..i-1]$은 이미 정렬된 상태이다. key를 올바른 위치에 삽입하려면:

1. $j = i-1$에서 시작해 왼쪽으로 이동
2. $B[j] > \text{key}$인 동안 $B[j+1] \leftarrow B[j]$ (원소를 한 칸 오른쪽으로 이동)
3. $B[j] \leq \text{key}$가 되는 순간 즉시 종료
4. $B[j+1] \leftarrow \text{key}$

### 3.1.1 알고리즘 원형에서 개선책 유도 과정

**Step 1 — 원형 알고리즘 (버블 정렬)**

임의의 두 원소를 비교해 잘못된 순서면 교환한다:

```
for i from 0 to N-1:
    for j from i+1 to N-1:
        if A[i] > A[j]: swap(A[i], A[j])
```

총 비교 횟수: $\frac{N(N-1)}{2}$. 거의 정렬된 입력에서도 항상 $O(N^2)$.

**Step 2 — 관찰 1: 역순쌍과 교환의 1:1 대응**

인접 원소 교환(swap) 1회는 역순쌍을 정확히 1개 제거한다. 따라서:

$$\text{최소 필요 swap 횟수} = I(A)$$

즉, $I(A)$번의 swap으로 완전한 정렬이 가능하다. 현재 구현은 비교는 $O(N^2)$번 하면서 실제 swap은 $I(A)$번 수행한다. **비교 횟수가 낭비되고 있다.**

**Step 3 — 관찰 2: 정렬된 접두사 불변식**

배열을 왼쪽부터 항상 정렬된 상태로 유지하면, $i$번째 원소 삽입은 정렬된 배열에서 올바른 위치를 찾는 문제로 축소된다.

정렬된 배열 $B[0..i-1]$에서 key의 삽입 위치 조건:

$$B[j] \leq \text{key} < B[j+1]$$

이 조건을 만족하는 $j$를 찾으면, $B[j+1..i-1]$을 한 칸 오른쪽으로 이동하고 $B[j+1] = \text{key}$로 쓴다.

**Step 4 — 관찰 3: 조기 종료의 효과**

$B[0..i-1]$이 정렬되어 있으므로, 오른쪽에서 왼쪽으로 스캔할 때 $B[j] \leq \text{key}$를 처음 만나는 순간 더 왼쪽은 모두 $\leq \text{key}$임이 보장된다. 여기서 즉시 종료 가능.

$i$번째 삽입에서의 이동 횟수 = $B[i]$와 $B[0..i-1]$ 사이의 역순쌍 수. 따라서:

$$\text{총 이동 횟수} = \sum_{i=1}^{N-1} \text{(i번째 삽입 이동 횟수)} = I(A)$$

**Step 5 — 형식화: 개선된 삽입 로직**

```ts
function insertionSort(A: number[]): number[] {
  const B = [...A];
  for (let i = 1; i < B.length; i++) {
    const key = B[i]!;
    let j = i - 1;
    while (j >= 0 && B[j]! > key) {
      B[j + 1] = B[j]!;  // 원소를 한 칸 오른쪽으로 이동
      j--;
    }
    B[j + 1] = key;       // 올바른 위치에 삽입
  }
  return B;
}
```

**내부 루프 종료 조건 비교:**

| | 현재 구현 | 개선된 구현 |
|---|---|---|
| 스캔 방향 | 좌 → 우 | 우 → 좌 |
| 종료 조건 | 항상 끝까지 | `B[j] ≤ key`이면 즉시 종료 |
| i번째 삽입 비용 | $O(i)$ 항상 | $O(\text{역순쌍 수}_i)$ |
| 총 비용 | $O(N^2)$ | $O(N + I(A))$ |

**불변식 증명:**

- **기저:** $i=1$. $B[0..0]$은 원소 1개이므로 정렬됨.
- **귀납 단계:** $B[0..i-1]$이 정렬되어 있다고 가정. 내부 루프 종료 시 $j+1$은 $B[j] \leq \text{key} < B[j+2]$ (또는 경계)가 성립하는 위치. $B[j+1] = \text{key}$ 삽입 후 $B[0..i]$는 오름차순.

**거의 정렬된 입력에서의 복잡도:**

각 원소가 최종 위치에서 최대 $c$칸 벗어나 있으면 $I(A) \leq c \cdot N$이고, 총 비용은 $O(cN)$이다. $c$가 상수이면 선형 시간.

---

## 요약

| 항목 | 현재 구현 | 개선된 구현 |
|------|----------|-----------|
| 방향성 | 올바름 (정렬된 접두사 불변식) | 동일 |
| 정확성 | 10/10 테스트 통과 | — |
| 시간 복잡도 | $O(N^2)$ (조기 종료 없음) | $O(N + I(A))$ |
| 성능 테스트 | 통과 (N=10,000은 허용 범위) | — |
| 핵심 문제 | 좌→우 전체 스캔으로 조기 종료 불가 | 우→좌 스캔으로 조기 종료 |

---

## [V2 개정] 컨셉 변경: 우→좌 스캔 + break 시도

### 변경된 코드

```ts
for (let i = sortedA.length - 2; i <= 0; i--) {
  if (sortedA[i]! > sortedA[sortedA.length - 1]!) {
    let swap = sortedA[i]!;
    sortedA[i] = sortedA[sortedA.length - 1]!;
    sortedA[sortedA.length - 1] = swap;
    break;
  }
}
```

V1(좌→우 전체 스캔)에서 우→좌 스캔 + 조기 종료(break)로 컨셉을 전환했다. 방향성은 올바른 목표를 향하고 있으나, 구현에 두 가지 독립적인 버그가 있다.

---

### 테스트 결과

```
bun test src/sorting/insertionSort/insertionSort.test.ts --timeout 5000
→ 무한 루프로 인한 행(hang), exit code 144 (SIGKILL)
 0 pass / 0 fail — 첫 번째 테스트에서 중단
```

---

### Bug 1 (Critical): 루프 조건 오류 — `i <= 0` → 무한 루프

**현재 코드:**
```ts
for (let i = sortedA.length - 2; i <= 0; i--)
```

`i--`로 감소하는 루프에서 조건 `i <= 0`은 의도와 반대로 작동한다.

**케이스별 동작 분석:**

| sortedA.length | i 시작값 | `i <= 0` 초기 평가 | 결과 |
|---|---|---|---|
| 1 (첫 번째 원소) | -1 | true | 무한 루프 (`sortedA[-1]`은 `undefined`, 조건 항상 false, break 미발동) |
| 2 (두 번째 원소) | 0 | true | swap 발동 시 break로 탈출; swap 미발동 시 i=-1로 무한 루프 |
| ≥ 3 | ≥ 1 | false | 루프 본문 **미실행** (정렬 시도 없음) |

**V2의 실제 실행 흐름 (첫 번째 원소 A[0] = 5 삽입 시):**

```
sortedA = [5]
i = sortedA.length - 2 = -1
조건: -1 <= 0 → true
sortedA[-1] = undefined
undefined > 5 → false (swap 없음, break 없음)
i-- → i = -2
조건: -2 <= 0 → true
→ 동일한 false, 반복
→ 무한 루프
```

**수정:** `i <= 0` → `i >= 0`

---

### Bug 2 (Correctness): swap + break는 단일 이동만 수행

루프 조건을 `i >= 0`으로 수정해도 정렬이 올바르지 않다.

**원인:** `break`는 한 번의 swap 후 즉시 내부 루프를 종료한다. 그러나 삽입할 원소가 최종 위치로부터 $d > 1$칸 떨어져 있으면, 1회 swap으로는 올바른 위치에 도달하지 못한다.

**트레이스: sortedA = [2, 4, 5, 6], 원소 1 삽입 (조건 `i >= 0`으로 수정 가정)**

```
sortedA = [2, 4, 5, 6, 1]
i=3: sortedA[3]=6 > sortedA[4]=1 → swap → [2, 4, 5, 1, 6], break
결과: [2, 4, 5, 1, 6]  ✗  (정답: [1, 2, 4, 5, 6])
```

1을 최종 위치(index 0)로 이동시키려면 4번의 swap이 필요하지만, break로 1번만 수행한다.

**swap 후 포인터 문제:** swap 후 삽입 원소는 sortedA[last]가 아닌 sortedA[i]에 위치한다. 다음 비교 대상은 sortedA[i-1]과 sortedA[i]가 되어야 하지만, 현재 코드는 계속 sortedA[last]와 비교한다. 루프 구조 자체가 swap 기반 우→좌 삽입을 올바르게 표현하지 못한다.

---

### 올바른 접근: swap 대신 shift

우→좌 스캔에서 조기 종료를 올바르게 구현하려면, swap이 아닌 **shift(한 칸 오른쪽 이동)** 패턴을 사용해야 한다.

- swap: 삽입 원소와 sortedA[i]의 값을 서로 교환 → 이후 비교 대상(sortedA[last])이 바뀌어 구조가 복잡해짐
- shift: sortedA[i]를 sortedA[i+1]로 이동(덮어쓰기) → 삽입 원소를 key 변수로 별도 보관, 루프 종료 후 한 번만 삽입

shift 기반의 올바른 구현은 보고서 3.1 섹션의 개선된 코드를 참조.

---

### V2 개선 사항 및 남은 버그 요약

| 항목 | V1 | V2 |
|---|---|---|
| 스캔 방향 | 좌→우 | 우→좌 (올바른 방향) |
| 조기 종료 시도 | 없음 | break 추가 (의도는 올바름) |
| 루프 조건 | 정상 (`i < sortedA.length`) | **버그: `i <= 0` (무한 루프)** |
| 삽입 메커니즘 | swap (완전 스캔으로 보완) | **버그: swap + break (단일 이동)** |
| 테스트 통과 | 10/10 | **0/10 (무한 루프로 중단)** |
| 복잡도 | $O(N^2)$ | 미측정 (실행 불가) |

**남은 버그:**
1. 루프 조건 `i <= 0` → `i >= 0`으로 수정 필요
2. swap + break 구조 → shift + 루프 종료 후 단일 삽입 구조로 교체 필요

---

## [V3 개정] 컨셉 변경: shift 기반 우→좌 스캔 + key 변수 도입

### 변경된 코드 (현재 상태)

```ts
export function insertionSort(A: number[]): number[] {
  const sortedA = Array.from(A);

  for (let i = 1; i < sortedA.length; i++) {
    const key = sortedA[i]!;
    for (let j = i - 1; j <= 0; j--) {
      if (sortedA[j]! <= 0 && sortedA[j]! > key) {
        sortedA[j + 1] = sortedA[j]!;
      } else {
        sortedA[j + 1] = key;
        break;
      }
    }
  }

  return sortedA;
}
```

### 1. 방향성 분석

V2(swap + break)에서 V3(shift + key 변수)로 컨셉을 전환했다. 이 전환의 방향은 **올바르다**. V2의 남은 버그 2번(swap → shift 교체)을 실제로 반영하여:

- 삽입할 값을 `key` 변수에 먼저 보관한다.
- 비교 시 `sortedA[j]`를 `sortedA[j + 1]`로 덮어쓰는(shift) 구조를 사용한다.
- 외부 루프를 `i = 1`부터 시작하는 표준 인덱스 기반 형태로 바꾸었다.

이는 보고서 §3.1의 개선된 코드가 사용하는 메커니즘과 동일한 방향이다. 그러나 세부 구현에 3개의 독립적인 버그가 있어, 실제로는 정렬이 거의 수행되지 않는다.

### 2. 정확성 분석

#### 테스트 결과

```
bun test src/sorting/insertionSort/insertionSort.test.ts
 4 pass / 6 fail   [9.00ms]
```

통과한 4개는 모두 **"정렬을 하지 않아도 입력과 정답이 같은"** 경우뿐이다.

| 통과한 테스트 | 입력 | 정답 = 입력? |
|---|---|---|
| 이미 정렬된 배열 | `[1,2,3,4,5]` | 같음 |
| 모든 원소가 같은 배열 | `[4,4,4,4]` | 같음 |
| 최소 길이 (N=1) | `[42]` | 같음 |
| 길이 2 — 정렬됨 | `[1,2]` | 같음 |

실제로 원소의 재배치가 필요한 6개 테스트는 모두 실패한다. 예를 들어 `[5,2,4,6,1,3]`의 반환값은 입력과 동일한 `[5,2,4,6,1,3]`이다. 즉 **현재 구현은 입력 배열을 그대로 복사해서 반환하는 항등 함수에 가깝다.**

### 3. 버그 상세

#### Bug 1 (Critical): 내부 루프 조건 `j <= 0`

```ts
for (let j = i - 1; j <= 0; j--)
```

`j--`로 감소하는 루프에서 시작값은 `j = i - 1`이다. 조건 `j <= 0`은 다음과 같이 작동한다.

| i | j 시작값 = i − 1 | `j <= 0` 초기 평가 | 내부 루프 본문 |
|---|---|---|---|
| 1 | 0 | `0 <= 0` → true | 1회 실행 |
| 2 | 1 | `1 <= 0` → false | **미실행** |
| ≥ 3 | ≥ 2 | false | **미실행** |

따라서 `i ≥ 2`인 모든 원소에 대해 내부 루프 본문이 한 번도 실행되지 않는다. `key`가 어디에도 다시 기록되지 않으므로 `sortedA[i]`는 원래 값 그대로 남는다. 결과적으로 인덱스 2 이후의 원소는 전혀 이동하지 않는다.

**수정:** `j <= 0` → `j >= 0`

#### Bug 2 (Correctness): shift 조건의 `sortedA[j]! <= 0`

```ts
if (sortedA[j]! <= 0 && sortedA[j]! > key)
```

shift를 수행할 조건은 `sortedA[j] > key` 하나뿐이어야 한다. 앞에 붙은 `sortedA[j]! <= 0`은 "`sortedA[j]`가 0 이하일 때만 이동"이라는 불필요한 제약을 추가한다. 이 때문에 양수 원소는 `sortedA[j] > key`가 참이어도 이동하지 않고 곧바로 else 분기로 빠진다.

Bug 1을 `j >= 0`으로 고치더라도, 이 조건이 남아 있으면 양수만으로 이루어진 입력은 정렬되지 않는다.

**수정:** `sortedA[j]! <= 0 &&` 부분을 제거하여 조건을 `sortedA[j]! > key`로 단순화

#### Bug 3 (Boundary): 내부 루프가 끝까지 진행될 때 key 미배치

`key`가 `sortedA[j + 1] = key`로 기록되는 위치는 **else 분기 한 곳뿐**이다. else 분기는 "`sortedA[j] ≤ key`인 원소를 처음 만났을 때"만 실행된다.

그러나 `key`가 정렬된 접두사의 모든 원소보다 작으면, 내부 루프는 else 분기에 도달하지 못하고 `j`가 −1이 될 때까지 shift만 반복한 뒤 조건 `j >= 0`이 거짓이 되어 종료한다. 이때 `key`를 `sortedA[0]`에 기록하는 코드가 없으므로 `key`가 사라지고 중복 값이 남는다.

**트레이스: Bug 1·2를 모두 수정했다고 가정, 입력 `[2, 1]`**

```
i = 1, key = 1, j = 0
  sortedA[0] = 2 > 1 → shift: sortedA[1] = 2 → [2, 2]
  j-- → j = -1, 조건 j >= 0 거짓 → 루프 종료
  (key = 1을 sortedA[0]에 기록하는 코드 없음)
결과: [2, 2]   ✗  (정답: [1, 2])
```

**수정:** 내부 루프를 `while (j >= 0 && sortedA[j] > key)` 형태로 바꾸고, **루프 종료 후** `sortedA[j + 1] = key`를 단 한 번 실행한다. 즉 key 배치를 루프 본문 바깥으로 빼야 한다.

### 4. 올바른 구현

세 버그를 모두 수정한 형태는 보고서 §3.1의 개선 코드와 동일하다.

```ts
export function insertionSort(A: number[]): number[] {
  const sortedA = Array.from(A);

  for (let i = 1; i < sortedA.length; i++) {
    const key = sortedA[i]!;
    let j = i - 1;
    while (j >= 0 && sortedA[j]! > key) {  // Bug 1·2 수정: j >= 0, 조건 단순화
      sortedA[j + 1] = sortedA[j]!;
      j--;
    }
    sortedA[j + 1] = key;                  // Bug 3 수정: 루프 밖에서 단 한 번 배치
  }

  return sortedA;
}
```

핵심 차이는 세 가지다.

1. 내부 루프의 종료 조건이 `j >= 0`이어서 정렬된 접두사 전체를 왼쪽 방향으로 탐색할 수 있다.
2. shift 조건이 `sortedA[j] > key` 하나뿐이어서 부호에 관계없이 동작한다.
3. `key` 배치가 루프 본문이 아니라 루프 종료 직후에 정확히 한 번 실행되므로, key가 인덱스 0까지 이동하는 경우에도 값이 보존된다.

이 형태에서 i번째 삽입의 이동 횟수는 `sortedA[i]`와 정렬된 접두사 사이의 역순쌍 수와 같고, 총 이동 횟수는 $\sum I_i = I(A)$이다. 따라서 시간 복잡도는 목표인 $O(N + I(A))$를 달성한다(유도 과정은 §3.1.1 참조).

### 5. V3 개선 사항 및 남은 버그 요약

| 항목 | V2 | V3 |
|---|---|---|
| 삽입 메커니즘 | swap + break | **shift + key 변수 (올바른 방향)** |
| key 보관 | 없음 | `key` 변수 도입 (개선) |
| 외부 루프 | `length - 2`부터 우→좌 | `i = 1`부터 표준 인덱스 (개선) |
| 내부 루프 조건 | `i <= 0` | **버그: `j <= 0` (i≥2에서 미실행)** |
| shift 조건 | — | **버그: `sortedA[j] <= 0` 불필요 제약** |
| key 배치 위치 | — | **버그: else 분기에만 존재 (경계에서 유실)** |
| 테스트 통과 | 0/10 (무한 루프) | 4/10 (항등 함수에 근접) |

**개선된 내용:** swap → shift 전환, key 변수 도입, 표준 외부 루프 형태 채택으로 §3.1의 올바른 구조에 근접했다.

**남은 버그:**
1. 내부 루프 조건 `j <= 0` → `j >= 0` (Bug 1)
2. shift 조건의 `sortedA[j]! <= 0 &&` 제거 (Bug 2)
3. key 배치를 else 분기에서 빼내 루프 종료 직후 1회 실행 (Bug 3)

---

## [V4 개정] 버그 수정: key 배치를 루프 밖으로 이동 (V3 Bug 3 해결)

### 변경된 코드 (현재 상태)

```ts
export function insertionSort(A: number[]): number[] {
  const sortedA = Array.from(A);

  for (let i = 1; i < sortedA.length; i++) {
    const key = sortedA[i]!;

    let j = i - 1;
    while (j <= 0) {
      const comparedTarget = sortedA[j]!;

      if (comparedTarget >= 0 && comparedTarget > key) {
        sortedA[j + 1] = comparedTarget;
      } else {
        break;
      }
      j--;
    }
    sortedA[j + 1] = key;
  }

  return sortedA;
}
```

### 1. 방향성 분석

V3에서 지적한 **Bug 3(key 배치 위치)**를 정확히 반영했다. `sortedA[j + 1] = key`를 while 루프 본문 밖, 루프 종료 직후(18행)로 옮겼다. 또한 내부 루프를 `while` 형태로 바꾸고 비교 대상을 `comparedTarget` 변수로 분리하여 §3.1의 표준 구조에 더 가까워졌다. 방향은 올바르다.

그러나 V3의 **Bug 1·2가 그대로 남아** 있어, 실제로는 인덱스 0·1 두 원소만 정렬되고 나머지는 이동하지 않는다.

### 2. 정확성 분석

#### 테스트 결과

```
bun test src/sorting/insertionSort/insertionSort.test.ts
 5 pass / 5 fail   [35.00ms]
```

V3 대비 1개 증가(4 → 5)했다. 새로 통과한 것은 **`[2, 1]`(길이 2 — 역순)**이다. Bug 3 수정으로 key가 보존되어 인덱스 0·1의 교환이 올바르게 끝나기 때문이다.

| 통과한 테스트 | 입력 | 통과 이유 |
|---|---|---|
| 이미 정렬된 배열 | `[1,2,3,4,5]` | 정렬 불필요 |
| 모든 원소가 같은 배열 | `[4,4,4,4]` | 정렬 불필요 |
| 최소 길이 (N=1) | `[42]` | 정렬 불필요 |
| 길이 2 — 정렬됨 | `[1,2]` | 정렬 불필요 |
| **길이 2 — 역순** | `[2,1]` | **i=1만으로 처리 가능 (신규 통과)** |

실패한 5개는 모두 인덱스 2 이상의 원소 재배치가 필요한 경우다(`[5,2,4,6,1,3]`, `[1,3,2,4,5]`, `[5,4,3,2,1]`, `[-1,3,-1,2,0,2]`, 성능 테스트).

### 3. 버그 상세

#### Bug 1 (Critical, 미해결): 내부 루프 조건 `j <= 0`

```ts
let j = i - 1;
while (j <= 0) { ... }
```

`j`의 시작값은 `i - 1`이다. 조건 `j <= 0`은 V3와 동일하게 작동한다.

| i | j 시작값 = i − 1 | `j <= 0` 초기 평가 | while 본문 |
|---|---|---|---|
| 1 | 0 | true | 실행 (단, 아래 트레이스 참조) |
| ≥ 2 | ≥ 1 | false | **미실행** |

`i ≥ 2`인 모든 원소에서 while 본문이 실행되지 않고, 루프 직후 `sortedA[j + 1] = sortedA[i] = key`(항등 대입)만 수행된다. 따라서 인덱스 2 이후 원소는 전혀 이동하지 않는다.

`i = 1`일 때는 `j = 0`에서 한 번 비교한 뒤 `j`가 −1로 감소하는데, 조건이 `j <= 0`이므로 `j = -1`에서도 루프에 재진입한다. 이때 `sortedA[-1]`은 `undefined`이고 `undefined >= 0`은 false이므로 else 분기에서 break하여 종료한다. 결과적으로 인덱스 0·1 두 원소만 정상 정렬된다.

**`[2, 1]` 트레이스 (정상 동작 사례):**
```
i = 1, key = 1, j = 0
  comparedTarget = sortedA[0] = 2,  2 >= 0 && 2 > 1 → shift: sortedA[1] = 2 → [2, 2]
  j-- → j = -1
  j <= 0 (true) 재진입: comparedTarget = sortedA[-1] = undefined → undefined >= 0 false → break
  sortedA[j + 1] = sortedA[0] = key = 1 → [1, 2]   ✓
```

**수정:** `while (j <= 0)` → `while (j >= 0)`

#### Bug 2 (Correctness, 미해결): shift 조건의 `comparedTarget >= 0`

```ts
if (comparedTarget >= 0 && comparedTarget > key)
```

shift 조건은 `comparedTarget > key` 하나여야 한다. V3에서는 잘못된 제약이 `<= 0`이었고 V4에서는 `>= 0`으로 부호만 바뀌었다. 이제는 **음수 원소가 shift 대상에서 제외**된다. 즉 `comparedTarget`이 음수이면서 `comparedTarget > key`(예: −1 > −5)인 경우에도 이동하지 않는다.

현재는 Bug 1 때문에 i=1만 실행되어 이 결함이 드러날 기회가 제한적이지만, Bug 1을 고치면 음수가 포함된 입력에서 곧바로 오작동한다.

**수정:** `comparedTarget >= 0 &&` 부분을 제거하여 조건을 `comparedTarget > key`로 단순화

### 4. 올바른 구현

Bug 1·2를 마저 고치면 §3.1의 개선 코드와 동일해진다. V4에서 추가로 바꿀 부분은 두 곳뿐이다.

```ts
export function insertionSort(A: number[]): number[] {
  const sortedA = Array.from(A);

  for (let i = 1; i < sortedA.length; i++) {
    const key = sortedA[i]!;

    let j = i - 1;
    while (j >= 0) {                 // Bug 1 수정: j <= 0 → j >= 0
      const comparedTarget = sortedA[j]!;

      if (comparedTarget > key) {    // Bug 2 수정: comparedTarget >= 0 && 제거
        sortedA[j + 1] = comparedTarget;
      } else {
        break;
      }
      j--;
    }
    sortedA[j + 1] = key;            // (V4에서 이미 올바른 위치)
  }

  return sortedA;
}
```

key 배치가 루프 밖에 있는 구조(V4의 성과)는 그대로 두고, 내부 루프의 탐색 범위(`j >= 0`)와 shift 조건(`comparedTarget > key`)만 바로잡으면 목표 복잡도 $O(N + I(A))$를 달성한다(유도 과정은 §3.1.1 참조).

### 5. V4 개선 사항 및 남은 버그 요약

| 항목 | V3 | V4 |
|---|---|---|
| key 배치 위치 | else 분기 안 (Bug 3) | **루프 종료 직후 (해결)** |
| 내부 루프 형태 | for + if/else | while + comparedTarget 변수 (정돈) |
| 내부 루프 조건 | `j <= 0` (버그) | **`j <= 0` (미해결, Bug 1)** |
| shift 조건 | `sortedA[j] <= 0` (버그) | **`comparedTarget >= 0` (미해결, Bug 2)** |
| 테스트 통과 | 4/10 | 5/10 (`[2,1]` 신규 통과) |

**개선된 내용:** V3 Bug 3(key 배치)을 해결하여 인덱스 0·1 정렬이 올바르게 동작하고, while + 변수 분리로 구조를 정돈했다.

**남은 버그:**
1. 내부 루프 조건 `j <= 0` → `j >= 0` (Bug 1, 미해결) — i≥2 원소 미처리의 직접 원인
2. shift 조건의 `comparedTarget >= 0 &&` 제거 (Bug 2, 미해결) — 음수 원소 이동 누락

---

## [V5 개정] 버그 수정: 내부 루프 조건 `j >= 0` (V4 Bug 1 해결)

### 변경된 코드 (현재 상태)

```ts
export function insertionSort(A: number[]): number[] {
  const sortedA = Array.from(A);

  for (let i = 1; i < sortedA.length; i++) {
    const key = sortedA[i]!;

    let j = i - 1;
    while (j >= 0) {
      const comparedTarget = sortedA[j]!;

      if (comparedTarget >= 0 && comparedTarget > key) {
        sortedA[j + 1] = comparedTarget;
      } else {
        break;
      }
      j--;
    }
    sortedA[j + 1] = key;
  }

  return sortedA;
}
```

### 1. 방향성 분석

V4의 **Bug 1(`while (j <= 0)`)**을 `while (j >= 0)`로 수정했다. 이제 내부 루프가 정렬된 접두사 전체를 오른쪽에서 왼쪽으로 탐색하므로, 인덱스 2 이상의 원소도 정상적으로 삽입된다. 구조는 §3.1의 표준 삽입 정렬과 사실상 동일하다.

다만 **Bug 2(shift 조건의 `comparedTarget >= 0`)는 그대로 남아** 있다. 현재 테스트 스위트가 이 결함을 자극하지 못해 전부 통과하지만, 구현은 여전히 불완전하다.

### 2. 정확성 분석

#### 테스트 결과

```
bun test src/sorting/insertionSort/insertionSort.test.ts
 10 pass / 0 fail   [34.00ms]
```

10개 테스트를 모두 통과한다. Bug 1 수정으로 일반적인 양수 입력과 성능 테스트(거의 정렬된 N=10,000)가 정상 동작한다.

#### 그러나 잠복 버그(Bug 2)가 남아 있다

테스트 통과가 곧 정확성을 의미하지는 않는다. 조건 `comparedTarget >= 0 && comparedTarget > key`는 **음수 원소를 오른쪽으로 이동(shift)하지 못한다.** Bug 2가 드러나는 조건은 다음 두 가지를 동시에 만족하는 경우다.

1. `comparedTarget < 0` (왼쪽의 정렬된 원소가 음수)
2. `comparedTarget > key` (그 음수보다 key가 더 작음, 즉 `key < comparedTarget < 0`)

이때 `comparedTarget >= 0`이 거짓이므로 else 분기에서 break하고, key가 올바른 위치까지 이동하지 못한다.

**반례 (직접 실행 확인):**

```
insertionSort([-1, -3])      → [-1, -3]      (정답: [-3, -1])   ✗
insertionSort([-1, -2, -3])  → [-1, -2, -3]  (정답: [-3, -2, -1]) ✗
```

`[-1, -3]` 트레이스:
```
i = 1, key = -3, j = 0
  comparedTarget = sortedA[0] = -1
  조건: -1 >= 0 → false  →  else → break
  sortedA[j + 1] = sortedA[1] = key = -3 → [-1, -3]   ✗
```

문제 제약은 $-10^9 \leq A[i] \leq 10^9$로 음수를 허용하므로 이는 실제 결함이다. **현재 테스트 스위트에는 "음수 원소를 더 작은 음수 key가 추월해야 하는" 케이스가 없어 통과**하는 것이다. 기존 음수 테스트 `[-1, 3, -1, 2, 0, 2]`는 −1보다 작은 원소가 없어 이 경로를 타지 않는다.

### 3. 올바른 구현

남은 곳은 한 군데뿐이다. shift 조건에서 `comparedTarget >= 0 &&`를 제거한다.

```ts
export function insertionSort(A: number[]): number[] {
  const sortedA = Array.from(A);

  for (let i = 1; i < sortedA.length; i++) {
    const key = sortedA[i]!;

    let j = i - 1;
    while (j >= 0) {
      const comparedTarget = sortedA[j]!;

      if (comparedTarget > key) {   // Bug 2 수정: comparedTarget >= 0 && 제거
        sortedA[j + 1] = comparedTarget;
      } else {
        break;
      }
      j--;
    }
    sortedA[j + 1] = key;
  }

  return sortedA;
}
```

`comparedTarget`의 부호는 삽입 위치 결정과 무관하다. 정렬의 비교 기준은 오직 `comparedTarget`과 `key`의 대소(`comparedTarget > key`)뿐이며, 이는 음수·0·양수에서 모두 동일하게 성립한다. 이 한 줄을 고치면 위 반례를 포함한 모든 입력에서 정확하고, 시간 복잡도도 목표인 $O(N + I(A))$를 달성한다(유도 과정은 §3.1.1 참조).

### 4. 권장: 회귀 테스트 추가

Bug 2가 테스트를 통과한 이유는 스위트의 커버리지 공백 때문이다. 다음과 같은 케이스를 추가하면 동일한 잠복 버그를 잡을 수 있다.

```ts
test("음수만으로 이루어진 역순 배열", () => {
  expect(insertionSort([-1, -3])).toEqual([-3, -1]);
  expect(insertionSort([-1, -2, -3])).toEqual([-3, -2, -1]);
});
```

### 5. V5 개선 사항 및 남은 버그 요약

| 항목 | V4 | V5 |
|---|---|---|
| 내부 루프 조건 | `j <= 0` (Bug 1) | **`j >= 0` (해결)** |
| key 배치 위치 | 루프 밖 (V4에서 해결) | 동일 |
| shift 조건 | `comparedTarget >= 0` (Bug 2) | **`comparedTarget >= 0` (미해결, 잠복)** |
| 테스트 통과 | 5/10 | **10/10 (단, 커버리지 공백)** |
| 실제 정확성 | 인덱스 0·1만 정렬 | 음수 추월 케이스만 오작동 |

**개선된 내용:** V4 Bug 1을 해결하여 모든 인덱스의 삽입이 정상 동작하고, 공개된 테스트 10개를 전부 통과한다.

**남은 버그:**
1. shift 조건의 `comparedTarget >= 0 &&` 제거 (Bug 2, **잠복 — 음수를 더 작은 음수 key가 추월하는 입력에서 오작동**). 예: `insertionSort([-1, -3])` → `[-1, -3]`. 테스트 스위트에 해당 케이스가 없어 10/10이 통과하지만, 문제 제약(음수 허용)상 실제 결함이다.

---

## [V6 개정] 버그 수정: shift 조건 단순화 (V5 Bug 2 해결) — 완성

### 변경된 코드 (현재 상태)

```ts
export function insertionSort(A: number[]): number[] {
  const sortedA = Array.from(A);

  for (let i = 1; i < sortedA.length; i++) {
    const key = sortedA[i]!;

    let j = i - 1;
    while (j >= 0) {
      const comparedTarget = sortedA[j]!;

      if (comparedTarget > key) {
        sortedA[j + 1] = comparedTarget;
      } else {
        break;
      }
      j--;
    }
    sortedA[j + 1] = key;
  }

  return sortedA;
}
```

### 1. 방향성 분석

V5의 **Bug 2**를 해결했다. shift 조건이 `comparedTarget >= 0 && comparedTarget > key`에서 `comparedTarget > key`로 단순화되었다. 부호와 무관하게 대소 비교만으로 삽입 위치를 결정하므로, 음수·0·양수가 섞인 모든 입력에서 정확하다.

이로써 구현은 §3.1·§3.1.1에서 유도한 **표준 삽입 정렬과 완전히 동일**해졌다.

- 정렬된 접두사 불변식: 외부 루프 시작 시 `sortedA[0..i-1]`은 항상 오름차순.
- 우→좌 탐색 + 조기 종료: `comparedTarget > key`가 거짓이면 즉시 break.
- shift + 루프 밖 단일 배치: key를 보관하고 더 큰 원소들을 한 칸씩 오른쪽으로 옮긴 뒤, 종료 위치 `sortedA[j + 1]`에 key를 한 번 기록.

### 2. 정확성 분석

#### 테스트 결과

```
bun test src/sorting/insertionSort/insertionSort.test.ts
 10 pass / 0 fail   [37.00ms]
```

10개 테스트를 모두 통과한다.

#### V5 잠복 버그(Bug 2) 반례 재검증 — 모두 해결

```
insertionSort([-1, -3])        → [-3, -1]          ✓
insertionSort([-1, -2, -3])    → [-3, -2, -1]      ✓
insertionSort([3, -5, -1, -9, 0]) → [-9, -5, -1, 0, 3] ✓
insertionSort([])              → []                ✓
```

V5에서 오작동하던 "음수를 더 작은 음수 key가 추월하는" 입력이 모두 올바르게 정렬된다. 빈 배열은 외부 루프가 실행되지 않아 `[]`를 그대로 반환한다.

`[-1, -3]` 트레이스:
```
i = 1, key = -3, j = 0
  comparedTarget = sortedA[0] = -1,  -1 > -3 → shift: sortedA[1] = -1 → [-1, -1]
  j-- → j = -1, 조건 j >= 0 거짓 → 종료
  sortedA[j + 1] = sortedA[0] = key = -3 → [-3, -1]   ✓
```

### 3. 최적화 분석 — 목표 복잡도 달성

내부 while 루프는 `comparedTarget > key`가 거짓이 되는 즉시 종료한다. i번째 삽입에서 수행하는 shift 횟수는 `sortedA[i]`와 정렬된 접두사 `sortedA[0..i-1]` 사이의 역순쌍 수 $I_i$와 같다. 따라서 총 연산량은

$$\sum_{i=1}^{N-1} (1 + I_i) = (N-1) + \sum_{i=1}^{N-1} I_i = O(N + I(A))$$

로, 문제가 요구한 $T(N) = O(N + I(A))$를 정확히 달성한다.

- 거의 정렬된 입력($I(A) = O(N)$): $O(N)$ — 성능 테스트(N=10,000, 역순쌍 ≈ N/100)를 여유 있게 통과.
- 역순 입력($I(A) = O(N^2)$): $O(N^2)$ — 삽입 정렬의 이론적 하한과 일치.

더 이상의 알고리즘적 개선 여지는 없다(삽입 정렬 기준 최적). 추가 개선은 알고리즘 자체를 머지 정렬·힙 정렬 등 $O(N \log N)$ 비교 정렬로 교체하는 별도 문제이며, 본 문제의 요구사항($O(N + I(A))$)을 이미 충족하므로 불필요하다.

### 4. V6 개선 사항 및 남은 버그 요약

| 항목 | V5 | V6 |
|---|---|---|
| 내부 루프 조건 | `j >= 0` (V5에서 해결) | 동일 |
| key 배치 위치 | 루프 밖 (V4에서 해결) | 동일 |
| shift 조건 | `comparedTarget >= 0 && …` (Bug 2) | **`comparedTarget > key` (해결)** |
| 테스트 통과 | 10/10 (커버리지 공백) | **10/10 (잠복 버그 포함 정확)** |
| 실제 정확성 | 음수 추월 케이스 오작동 | **모든 입력 정확** |
| 시간 복잡도 | $O(N + I(A))$ | $O(N + I(A))$ |

**개선된 내용:** V5 Bug 2를 해결하여 음수가 포함된 모든 입력에서 정확해졌다. V1~V5에서 식별된 4개 버그(좌→우 전체 스캔, 무한 루프 `i <= 0`, swap+break 단일 이동, key 미배치, 루프 조건 `j <= 0`, shift 조건 부호 제약)가 모두 해소되었다.

**남은 버그:** 없음. 구현은 §3.1의 표준 삽입 정렬과 동일하며 정확성·복잡도 모두 목표를 충족한다.

> 권장: §V5-4의 음수 회귀 테스트(`[-1,-3]`, `[-1,-2,-3]`)를 테스트 스위트에 추가하면, 해당 경로가 향후 회귀로부터 보호된다. (현재 스위트는 통과하지만 음수 추월 경로를 직접 커버하지 않는다.)
