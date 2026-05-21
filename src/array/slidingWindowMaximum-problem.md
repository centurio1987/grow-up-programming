# Sliding Window Maximum

## 함수 인터페이스

```ts
export function slidingWindowMaximum(nums: number[], k: number): number[];
```

## 제약 조건

- $1 \leq N \leq 100{,}000$ (여기서 $N$ 은 `nums` 의 길이)
- $1 \leq k \leq N$ (윈도우 크기)
- $-10^4 \leq nums[i] \leq 10^4$ (정수)

## 문제 상세

정수 배열 $nums$ 와 윈도우 크기 $k$ 가 주어진다. 길이 $k$ 의 슬라이딩 윈도우가 배열의 왼쪽 끝에서 시작해 한 칸씩 오른쪽으로 이동할 때, **각 윈도우 위치에서의 최댓값** 을 순서대로 담은 배열을 반환한다.

윈도우의 시작 인덱스를 $i$ 라 하면 $i$ 는 $0, 1, \ldots, N - k$ 의 값을 가질 수 있고, 결과 배열의 길이는 $N - k + 1$ 이다.

$$\text{result}[i] = \max_{i \leq j < i + k}\, nums[j]$$

## 예시

```ts
slidingWindowMaximum([1, 3, -1, -3, 5, 3, 6, 7], 3);
// [3, 3, 5, 5, 6, 7]
// 윈도우들: [1,3,-1] -> 3, [3,-1,-3] -> 3, [-1,-3,5] -> 5,
//          [-3,5,3] -> 5, [5,3,6] -> 6, [3,6,7] -> 7

slidingWindowMaximum([1], 1);          // [1]
slidingWindowMaximum([9, 11], 2);      // [11]
slidingWindowMaximum([4, -2], 2);      // [4]
slidingWindowMaximum([1, 2, 3, 4], 1); // [1, 2, 3, 4]
```
