# 접미사 LCP (Kasai's Algorithm)

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★ 하 — 특정 분야·고급 |
| 난이도 | 고급 |

## 함수 인터페이스

```ts
export function kasaiLcp(s: string, sa: number[]): number[];
```

## 제약 조건

- $1 \leq |s| \leq 10^{5}$
- `sa` 는 $s$ 의 접미사 배열 (길이 $n = |s|$)
- 전체 시간 복잡도는 $O(n)$ 이어야 한다

## 문제 상세

문자열 $s$와 그 접미사 배열 $\text{SA}$가 주어질 때, 인접한 정렬된 접미사들의 최장 공통 접두사(LCP, Longest Common Prefix) 길이를 담은 배열 $\text{LCP}$를 반환한다.

정의 (Kasai 표준 표기, 길이 $n$ 배열로 마지막 원소는 0):

$$\text{LCP}[i] = \mathrm{lcp}\bigl(s[\text{SA}[i] \ldots],\; s[\text{SA}[i+1] \ldots]\bigr)
  \quad (0 \leq i < n - 1),\;\; \text{LCP}[n - 1] = 0$$

여기서 $\mathrm{lcp}(x, y)$는 두 문자열의 가장 긴 공통 접두사의 길이.

## 예시

`s = "banana"`, `sa = [5, 3, 1, 0, 4, 2]` 일 때 `kasaiLcp("banana", sa) = [1, 3, 0, 0, 2, 0]`:

- `lcp("a", "ana") = 1`
- `lcp("ana", "anana") = 3`
- `lcp("anana", "banana") = 0`
- `lcp("banana", "na") = 0`
- `lcp("na", "nana") = 2`
- 마지막: `0`
