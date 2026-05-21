# Top K Frequent Elements

## 함수 인터페이스

```ts
export function topKFrequent(A: number[], k: number): number[];
```

## 제약 조건

- $1 \leq N \leq 100{,}000$ (여기서 $N$ 은 `A` 의 길이)
- $-10^9 \leq A[i] \leq 10^9$
- $1 \leq k \leq$ (`A` 의 고유값 개수)

## 문제 상세

정수 배열 $A$ 와 정수 $k$ 가 주어질 때, $A$ 에 등장하는 원소들 중 **빈도수가 가장 큰 상위 $k$ 개** 의 원소를 반환하라.

각 원소 $v$ 의 빈도를

$$f(v) = |\{ i \mid A[i] = v \}|$$

라 정의하면 결과 집합 $R$ 은 다음을 만족한다.

$$R \subseteq \{ v \mid v \in A \},\ |R| = k,\ \forall u \notin R,\ \forall v \in R: f(v) \geq f(u)$$

출력 순서는 **빈도 내림차순** 으로 가정한다(동률 시 임의).

## 예시

```ts
topKFrequent([1, 1, 1, 2, 2, 3], 2);        // [1, 2]
topKFrequent([1], 1);                       // [1]
topKFrequent([4, 4, 4, 5, 5, 6], 2);        // [4, 5]
topKFrequent([-1, -1, 2, 2, 2, 3, 3, 3, 3], 1);
// [3]
```
