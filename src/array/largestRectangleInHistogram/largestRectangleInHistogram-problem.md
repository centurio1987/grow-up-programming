# Largest Rectangle in Histogram

## 한 줄 요약

> 히스토그램 막대 높이 배열을 받아, 막대들로 만들 수 있는 **가장 큰 직사각형의 넓이**를 반환한다.

## 스토리

건축 설계사 준혁은 도심 스카이라인 단면도를 보고 있다. 각 구역의 건물 높이가 정수로 주어지며, 모든 건물의 폭은 1이다.

준혁은 연속된 여러 구역을 통틀어 가장 큰 직사각형 간판을 설치할 면적을 구하려 한다. 직사각형은 연속 구역에 걸쳐 있어야 하고, 그 높이는 해당 구역 내 모든 건물보다 낮거나 같아야 한다.

가능한 가장 큰 직사각형의 넓이를 계산하는 함수를 작성해야 한다.

## 함수 인터페이스

```ts
export function largestRectangleInHistogram(heights: number[]): number;
```

- `heights` — 히스토그램 각 막대의 높이 배열. 막대의 너비는 모두 $1$.
- 반환 — 히스토그램 안에 그릴 수 있는 가장 큰 직사각형의 넓이.

## 제약 조건

- $1 \leq N \leq 100{,}000$ (여기서 $N$은 `heights`의 길이)
- $0 \leq heights[i] \leq 10{,}000$ (비음의 정수)
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

연속 구간 $[l, r]$ ($0 \leq l \leq r < N$)에 걸친 직사각형의 넓이는

$$\text{area}(l, r) = (r - l + 1) \times \min_{l \leq i \leq r} heights[i]$$

이고, 답은

$$\text{answer} = \max_{0 \leq l \leq r < N}\, \text{area}(l, r)$$

이다.

높이가 $0$인 막대가 포함된 구간의 넓이는 $0$이다. 단일 막대($l = r$)도 유효한 직사각형이며, 넓이는 `heights[l]`이다.

## 예시

```ts
largestRectangleInHistogram([2, 1, 5, 6, 2, 3]); // 10 — 구간 [2,3], 높이 5, 너비 2
largestRectangleInHistogram([1, 2, 3, 4, 5]);    // 9  — 구간 [2,4], 높이 3, 너비 3
largestRectangleInHistogram([5, 4, 3, 2, 1]);    // 9  — 구간 [0,2], 높이 3, 너비 3

largestRectangleInHistogram([2, 0, 2]);          // 2  — 0이 구간을 나누어 양쪽이 독립
largestRectangleInHistogram([0, 0, 0]);          // 0  — 모든 막대 높이 0
largestRectangleInHistogram([1, 1, 1, 1]);       // 4  — 전체 구간, 높이 1, 너비 4

largestRectangleInHistogram([7]);                // 7  — 단일 막대
largestRectangleInHistogram([2, 4]);             // 4  — 단일 막대 [4]가 최대
```
