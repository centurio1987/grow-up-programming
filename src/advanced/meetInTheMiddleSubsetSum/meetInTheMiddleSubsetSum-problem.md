# Meet in the Middle — Subset Sum

## 함수 인터페이스

```ts
export function meetInTheMiddleSubsetSum(nums: number[], target: number): boolean;
```

## 제약 조건

- $1 \leq n \leq 40$ (여기서 $n$ 은 `nums` 의 길이)
- $-10^9 \leq \text{nums}[i] \leq 10^9$
- $-10^{18} \leq \text{target} \leq 10^{18}$

## 문제 상세

길이 $n$ 인 정수 배열 $\text{nums}$ 와 목표값 $\text{target}$ 이 주어진다. 어떤 부분집합 $S \subseteq \text{nums}$ 에 대해 다음을 만족하는 $S$ 가 존재하면 `true`, 존재하지 않으면 `false` 를 반환하라.

$$\sum_{x \in S} x = \text{target}$$

공집합도 부분집합으로 인정한다. 따라서 `target = 0` 인 경우 항상 `true` 이다.

## 예시

| `nums` | `target` | 반환값 | 설명 |
| --- | --- | --- | --- |
| `[1, 2, 3]` | `5` | `true` | $\{2, 3\}$ |
| `[1, 2, 3]` | `7` | `false` | 전체 합 $6$ 이 최대 |
| `[1, 2, 3]` | `0` | `true` | 공집합 |
| `[-3, 1, 4]` | `-2` | `true` | $\{-3, 1\}$ |
| `[10, 20, 30, 40]` | `60` | `true` | $\{20, 40\}$ 또는 $\{10, 20, 30\}$ |
