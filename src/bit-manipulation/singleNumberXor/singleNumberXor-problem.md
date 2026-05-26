# XOR 누적 트릭 (Single Number)

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★★★ 상 — 필수 |
| 난이도 | 초급 |

## 함수 인터페이스

```ts
export function singleNumberXor(nums: number[]): number;
```

## 제약 조건

- $1 \leq N \leq 10^6$ (배열 길이)
- $|\text{nums}[i]| < 2^{31}$ (32비트 정수)
- 시간 복잡도 $O(N)$, 공간 복잡도 $O(1)$

## 문제 상세

$N$ 개의 정수로 이루어진 배열 $\text{nums}$ 가 주어진다.
정확히 하나의 원소만 **홀수 번** 등장하고, 나머지는 모두 **짝수 번**(보통 2회) 등장한다.

홀수 번 등장하는 그 유일한 원소를 $O(N)$ 시간, $O(1)$ 공간으로 찾아 반환한다.

## 예시

- $\text{singleNumberXor}([4,1,2,1,2]) = 4$
- $\text{singleNumberXor}([7]) = 7$
