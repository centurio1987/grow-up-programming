# binarySearch 분석 보고서

## 1. 접근 방법의 방향성

솔루션 `src/3/binarySearch.ts`는 가이드(`binarySearch-guide.md`)가 권장하는 **반복문 기반 이진 탐색**을 그대로 따른다.

- 닫힌 구간 $[\text{left}, \text{right}]$로 탐색 범위를 표현하고, `left <= right`인 동안 반복한다.
- 중간점은 $\text{mid} = \text{left} + \lfloor (\text{right} - \text{left}) / 2 \rfloor$로 계산하여 두 인덱스의 합 오버플로를 회피한다.
- 비교 후 일치하면 즉시 반환, 그렇지 않으면 단조성에 따라 한쪽 절반을 제거한다.

루프 불변식 "target이 배열 안에 존재한다면 $A[\text{left} \ldots \text{right}]$ 구간 안에 있다"가 매 반복 시작에서 유지된다. 빈 배열은 시작에서 `left = 0, right = -1`이 되어 루프가 한 번도 실행되지 않으므로 별도 가드(`A.length < 1`)가 없어도 `-1`로 안전 종료한다. 즉, 현재 가드는 방어적 코드일 뿐 정합성에 필수는 아니다.

**방향성은 가이드와 일치한다.** 시간복잡도 $O(\log N)$, 공간복잡도 $O(1)$의 목표를 정확히 달성한다.

## 2. 정확성 분석

`bun test src/3/binarySearch.test.ts` 결과:

```
 16 pass
 0 fail
 18 expect() calls
Ran 16 tests across 1 file. [33.00ms]
```

전체 16개 케이스(중간값, 양 끝, 부재값, 빈 배열, 단일 원소, 음수 포함, 2-원소 경계, INT32 경계, $N = 10^6$ 성능)가 모두 통과한다.

세부 검증:

- **빈 배열**: `A.length < 1` 가드로 `-1` 반환. 가드가 없어도 `right = -1`로 루프 미진입하여 동일하게 `-1`이 반환된다.
- **단일 원소 일치/불일치**: `left = right = 0`에서 `mid = 0`. 비교 후 일치하면 반환, 아니면 `left = 1` 또는 `right = -1`로 갱신되어 다음 반복에서 종료한다.
- **INT32 경계값**: TypeScript의 `number`는 IEEE 754 double이므로 $\pm 2^{31}$ 값을 정확히 표현한다. `right - left`는 인덱스 차이이므로 배열 길이가 $2^{53}$ 미만이면 안전하다.
- **$N = 10^6$ 성능**: 100ms 내 처리(테스트 통과). $\log_2(10^6) \approx 20$회 비교에 1000회 호출 → 약 $2 \times 10^4$회 인덱스 접근으로 매우 여유롭다.

## 3. 최적화 분석

이미 시간복잡도 $O(\log N)$, 공간복잡도 $O(1)$로 본 문제의 이론적 하한을 달성한다. 알고리즘적 개선의 여지는 없으며, 미시적인 코드 품질·가독성 차원의 정리만 남는다.

### 3.1. 코드 품질: 마지막 분기의 조건식 정리

```ts
if (target === A[mid]!) {
  return mid;
} else if (target < A[mid]!) {
  right = mid - 1;
} else if (target >= A[mid]!) {   // ← 여기
  left = mid + 1;
}
```

세 번째 분기 조건 `target >= A[mid]`는 **논리적으로 항상 `target > A[mid]`와 동치**이다. 이유는 다음과 같다.

1. 첫 번째 분기가 `target === A[mid]`를 이미 처리했으므로, 두 번째 분기로 도달한 시점에서 `target !== A[mid]`가 성립한다.
2. 두 번째 분기 또한 `target < A[mid]`를 처리하므로, 세 번째 분기로 도달한 시점에서 `target !== A[mid]` 그리고 `target >= A[mid]`가 동시에 성립한다.
3. 두 조건의 교집합은 `target > A[mid]` 하나뿐이다.

따라서 `>=`는 `>`로 바꾸거나, 더 간결하게 `else { left = mid + 1; }`로 작성해도 동작이 동일하다. 현 상태로도 정답을 내지만, 독자에게 "동일 값일 때도 `left = mid + 1`이 실행될 수 있다"는 잘못된 인상을 줄 수 있다.

### 3.2. (참고) 알고리즘 원형에서의 유도

선형 탐색이라는 원형에서 이진 탐색을 유도하는 과정은 다음과 같다. 이미 가이드가 같은 내용을 다루지만, 본 솔루션의 구현 선택과 매칭되도록 다시 정리한다.

#### 1단계: 선형 탐색의 한계

선형 탐색은 인덱스 $i = 0$부터 순차로 $A[i] = \text{target}$을 검사한다.

$$
\text{linearSearch}(A, \text{target}) = \min \{\, i \in [0, N) \mid A[i] = \text{target} \,\}
$$

시간복잡도는 $O(N)$이다. 정렬되어 있다는 부가 정보를 사용하지 않는다.

#### 2단계: 단조성으로부터의 관찰

배열이 오름차순 정렬되어 있다는 조건 $A[i] \leq A[i+1]$로부터, 임의 인덱스 $m \in [0, N)$에 대해 다음이 성립한다.

- $A[m] < \text{target} \;\Rightarrow\; \forall i \in [0, m],\ A[i] \leq A[m] < \text{target}$
- $A[m] > \text{target} \;\Rightarrow\; \forall i \in [m, N),\ A[i] \geq A[m] > \text{target}$

즉, 한 번의 비교로 인덱스 절반에서 target의 부재가 확정된다.

#### 3단계: 탐색 구간 상태와 불변식

탐색 대상 인덱스 집합을 닫힌 구간 $[\text{left}, \text{right}]$로 표현한다. 다음 불변식을 도입한다.

$$
\text{target} \in A \;\Longrightarrow\; \text{target} \in A[\text{left} \ldots \text{right}]
$$

초기 $\text{left} = 0,\ \text{right} = N - 1$에서 이 불변식은 자명하게 성립한다.

#### 4단계: 점화식

매 반복에서 중간 인덱스 $\text{mid} = \text{left} + \lfloor (\text{right} - \text{left}) / 2 \rfloor$를 계산한 뒤, 비교 결과에 따라 구간을 갱신한다.

$$
(\text{left}', \text{right}') = \begin{cases}
(\text{left}, \text{right}) \to \text{return mid} & A[\text{mid}] = \text{target} \\
(\text{left}, \text{mid} - 1) & A[\text{mid}] > \text{target} \\
(\text{mid} + 1, \text{right}) & A[\text{mid}] < \text{target}
\end{cases}
$$

2단계의 관찰에 의해, 갱신 후에도 3단계의 불변식이 보존된다.

#### 5단계: 종료 조건

매 반복마다 구간 크기 $\text{right} - \text{left} + 1$이 적어도 1 감소(정확히는 절반 이하)한다. 유한 횟수 반복 후 반드시 $\text{left} > \text{right}$가 되며, 이 시점에서 $A[\text{left} \ldots \text{right}]$는 공집합이다. 불변식의 대우 명제에 의해 target은 $A$ 안에 존재하지 않으므로 $-1$을 반환한다.

#### 6단계: 오버플로 회피와 가드

중간점을 $(\text{left} + \text{right}) / 2$로 계산하지 않고 $\text{left} + \lfloor (\text{right} - \text{left}) / 2 \rfloor$로 계산하는 것은, 두 인덱스의 합이 정수 표현 범위를 초과할 가능성을 차단하기 위함이다. TypeScript의 `number`는 안전한 정수 표현이 $2^{53}$까지이므로 본 문제의 $N \leq 10^6$ 범위에서는 어느 식을 써도 결과가 같지만, 식을 일반화하여 더 큰 범위에서도 안전한 형태를 채택한 것이다.

빈 배열 가드 `if (A.length < 1) return -1;`는 정합성 측면에서 불필요(루프 미진입으로 자동 처리됨)하지만, 코드 의도를 드러내는 방어적 표현으로 해석할 수 있다.

## 4. 결론

- **방향성**: 가이드의 닫힌 구간 반복문 이진 탐색을 정확히 구현했다.
- **정확성**: 16/16 테스트 통과. 빈 배열, 단일 원소, 양 끝 경계, INT32 경계, $N = 10^6$ 성능 케이스 모두 정상.
- **최적화**: 시간 $O(\log N)$, 공간 $O(1)$로 이미 이론적 최적. 알고리즘적 개선 여지 없음. 단, 세 번째 분기 조건 `target >= A[mid]`는 도달 시점에서 항상 `target > A[mid]`와 동치이므로 `else` 또는 `>`로 바꾸면 가독성이 향상된다(동작 불변).

## 개인 정리
