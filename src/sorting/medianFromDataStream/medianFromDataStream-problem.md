# Find Median from Data Stream

## 함수 인터페이스

```ts
export class MedianFinder {
  addNum(num: number): void;
  findMedian(): number;
}
```

## 제약 조건

- 호출 횟수 $1 \leq Q \leq 100{,}000$
- $-10^9 \leq \text{num} \leq 10^9$
- `findMedian` 은 적어도 한 번 이상 `addNum` 이 호출된 뒤에만 호출된다

## 문제 상세

정수가 하나씩 들어오는 스트림에서, 매 순간 지금까지 들어온 수들의 **중앙값(median)** 을 빠르게 조회할 수 있는 자료구조를 구현하라.

지금까지 들어온 수들의 다중집합을 $S$ 라 하고 $N = |S|$ 라 할 때, 중앙값은 다음과 같다.

$$\text{median} = \begin{cases}
  \text{sort}(S)\left[\frac{N-1}{2}\right] & (N \text{이 홀수}) \\\\
  \dfrac{\text{sort}(S)\left[\frac{N}{2}-1\right] + \text{sort}(S)\left[\frac{N}{2}\right]}{2} & (N \text{이 짝수})
\end{cases}$$

### 메서드 명세

- `addNum(num)` — 스트림에 정수 `num` 을 추가한다. 반환값 없음.
- `findMedian()` — 지금까지 추가된 모든 수들의 중앙값을 반환한다. 원소 개수가 짝수일 경우 두 중앙 원소의 평균을 반환한다.

## 예시

```ts
const mf = new MedianFinder();

mf.addNum(1);
mf.findMedian();        // 1

mf.addNum(2);
mf.findMedian();        // 1.5  ((1 + 2) / 2)

mf.addNum(3);
mf.findMedian();        // 2

mf.addNum(4);
mf.findMedian();        // 2.5  ((2 + 3) / 2)
```
