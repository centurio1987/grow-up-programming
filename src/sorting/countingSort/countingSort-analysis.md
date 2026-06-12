# countingSort 분석 보고서

## 1. 접근 방법 방향성 분석

### 방향성: 올바름

구현은 계수 정렬(Counting Sort)의 정석 단순 버전(non-stable)을 정확히 따른다:

```ts
export function countingSort(A: number[]): number[] {
  const frequencyList: number[] = Array.from({ length: 1001 }, () => 0); // C[0..1000] = 0
  const outputList: number[] = [];

  for (let item of A) {
    frequencyList[item]!++;          // 각 값의 빈도 집계
  }

  for (let i = 0; i < frequencyList.length; i++) {
    for (let freq = 0; freq < frequencyList[i]!; freq++) {
      outputList.push(i);            // i를 C[i]번 출력
    }
  }

  return outputList;
}
```

**세 단계가 모두 올바르다:**

1. `frequencyList` 크기를 1001로 설정 — 값 범위 $[0, 1000]$을 모두 수용
2. 빈도 집계: $C[v] = |\{i \mid A[i] = v\}|$
3. $v = 0$부터 $1000$까지 $C[v]$개만큼 $v$를 출력 — 오름차순 보장

---

## 2. 정확성 분석

### 테스트 결과

```
bun test src/sorting/countingSort/countingSort.test.ts
 9 pass / 0 fail  [14.00ms]
```

모든 9개 테스트 통과.

### 정확성 증명

**원소 보존:** 빈도 집계 루프 완료 후:

$$\sum_{v=0}^{1000} C[v] = N$$

출력 루프에서 각 $v$를 $C[v]$번 추가하므로 출력 배열의 총 원소 수 = $N$. 원소를 하나도 잃거나 추가하지 않는다.

**오름차순 보장:** 출력 루프가 $v = 0$부터 $1000$까지 오름차순으로 처리하므로, 출력 배열은 자동으로 $B[j] \leq B[j+1]$을 만족한다.

**중복 원소 처리:** 동일한 값 $v$는 $C[v]$개 연속으로 출력되어 모든 인스턴스가 올바르게 포함된다.

**경계값 처리:** `Array.from({ length: 1001 }, () => 0)`으로 $C[0]$과 $C[1000]$ 모두 초기화되므로, $A[i] = 0$과 $A[i] = 1000$도 올바르게 처리된다.

---

## 3. 최적화 분석

### 시간 복잡도: O(N + k) — 목표 달성

| 구간 | 연산 수 |
|------|--------|
| 빈도 집계 루프 | $O(N)$ |
| 출력 루프 (외부) | $O(k) = O(1001)$ |
| 출력 루프 (내부 전체) | $O(N)$ (총 push 횟수 = N) |
| **합계** | $O(N + k)$ |

$k = 1000$이 고정이므로 $O(N + 1000) = O(N)$이다. 목표 복잡도를 달성한다.

### 공간 복잡도: O(N + k)

- `frequencyList`: $k + 1 = 1001$ 크기 — $O(k)$
- `outputList`: $N$ 크기 — $O(N)$

### 구현 품질

비교 기반 정렬의 $\Omega(N \log N)$ 하한을 값 범위 제한을 이용해 우회한다. 안정성이 요구되지 않으므로 단순 버전이 적합하다. 누적합 기반 안정 버전보다 코드가 짧고 이해하기 쉽다.

---

## 요약

| 항목 | 결과 |
|------|------|
| 방향성 | 올바름 (계수 정렬 단순 버전) |
| 정확성 | 9/10 테스트 통과 |
| 시간 복잡도 | $O(N + k)$ — 목표 달성 |
| 공간 복잡도 | $O(N + k)$ |
| 개선 필요 여부 | 없음 |
