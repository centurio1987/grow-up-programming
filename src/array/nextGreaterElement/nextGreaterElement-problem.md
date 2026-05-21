# Next Greater Element (NGE)

## 함수 인터페이스

```ts
export function nextGreaterElement(nums: number[]): number[];
```

## 제약 조건

- $1 \leq N \leq 100{,}000$ (여기서 $N$ 은 `nums` 의 길이)
- $-10^9 \leq nums[i] \leq 10^9$ (정수)

## 문제 상세

정수 배열 $nums$ 가 주어진다. 각 인덱스 $i$ 에 대해, **오른쪽에 있는 원소들 중 자신보다 엄격하게 큰 첫 번째 원소** 의 값을 구한다. 그러한 원소가 없으면 $-1$ 로 둔다.

결과 배열 $R$ ($|R| = N$) 의 정의:

$$R[i] = \begin{cases} nums[j] & j = \min\{\, j > i \,\mid\, nums[j] > nums[i] \,\} \\ -1 & \text{such } j \text{ does not exist} \end{cases}$$

## 예시

```ts
nextGreaterElement([2, 1, 2, 4, 3]);    // [4, 2, 4, -1, -1]
nextGreaterElement([4, 3, 2, 1]);       // [-1, -1, -1, -1]
nextGreaterElement([1, 2, 3, 4]);       // [2, 3, 4, -1]
nextGreaterElement([5]);                // [-1]
nextGreaterElement([2, 7, 3, 5, 1, 6]); // [7, -1, 5, 6, 6, -1]
```
