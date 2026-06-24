# Find Median from Data Stream

## 한 줄 요약

> 정수가 하나씩 스트림으로 들어올 때, `addNum`으로 수를 추가하고 `findMedian`으로 **지금까지 들어온 모든 수의 중앙값**을 즉시 반환하는 자료구조를 구현한다.

## 스토리

실시간 주식 거래소 모니터링 시스템. 매 거래마다 체결 가격이 하나씩 들어온다.
분석팀은 언제든 "지금까지 체결된 가격들의 중앙값이 얼마야?"라고 물어볼 수 있다.

거래 건수가 홀수이면 가운데 값, 짝수이면 가운데 두 값의 평균을 답해야 한다.
음수 가격(정산 후 조정치)도 포함될 수 있고, 같은 가격이 반복될 수 있다.

## 함수 인터페이스

```ts
export class MedianFinder {
  addNum(num: number): void;
  findMedian(): number;
}
```

- `addNum(num)` — 스트림에 정수 `num`을 추가한다. 반환값 없음.
- `findMedian()` — 지금까지 추가된 모든 수의 중앙값을 반환한다. 원소 개수가 짝수이면 가운데 두 값의 평균을 반환한다.

## 제약 조건

- 총 호출 횟수 $1 \leq Q \leq 100{,}000$
- $-10^9 \leq \text{num} \leq 10^9$ — 각 수는 이 범위의 정수이며 음수일 수 있다.
- `findMedian`은 적어도 한 번 이상 `addNum`이 호출된 뒤에만 호출된다.
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

지금까지 추가된 수들의 다중집합을 $S$라 하고 $N = |S|$라 할 때, 중앙값은 다음과 같이 정의된다.

$$\text{median}(S) = \begin{cases}
  \text{sort}(S)\!\left[\tfrac{N-1}{2}\right] & (N \text{이 홀수}) \\[4pt]
  \dfrac{\text{sort}(S)\!\left[\tfrac{N}{2}-1\right] + \text{sort}(S)\!\left[\tfrac{N}{2}\right]}{2} & (N \text{이 짝수})
\end{cases}$$

- **홀수 개일 때.** 정렬된 수열의 정확히 가운데 인덱스 $\lfloor (N-1)/2 \rfloor$에 해당하는 값을 반환한다.
- **짝수 개일 때.** 가운데 두 값 $(\text{index } N/2-1,\ N/2)$의 산술 평균을 반환한다. 두 값이 정수여도 평균은 소수점 이하가 생길 수 있다 (예: $(1+2)/2 = 1.5$).
- **중복.** 같은 수가 여럿 들어오면 각각이 독립적인 원소로 취급된다.
- **음수.** 음수도 일반 정수로 취급하며, 중앙값 계산에 포함된다.

## 예시

```ts
const mf = new MedianFinder();

mf.addNum(1);
mf.findMedian();   // 1    — 원소 [1], 홀수 개이므로 유일한 값

mf.addNum(2);
mf.findMedian();   // 1.5  — 원소 [1,2], 짝수 개이므로 (1+2)/2

mf.addNum(3);
mf.findMedian();   // 2    — 원소 [1,2,3], 홀수 개이므로 가운데 값

mf.addNum(4);
mf.findMedian();   // 2.5  — 원소 [1,2,3,4], 짝수 개이므로 (2+3)/2

// 음수 포함(경계: 값이 음수)
const mf2 = new MedianFinder();
mf2.addNum(-1_000_000_000);
mf2.addNum(1_000_000_000);
mf2.findMedian();  // 0    — 짝수 개이므로 (-1e9+1e9)/2 = 0

// 중복(경계: 모든 값 동일)
const mf3 = new MedianFinder();
mf3.addNum(5);
mf3.addNum(5);
mf3.addNum(5);
mf3.findMedian();  // 5    — 정렬 결과 [5,5,5], 홀수 개이므로 가운데 값
```
