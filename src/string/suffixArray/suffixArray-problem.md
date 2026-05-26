# 접미사 정렬 (Suffix Array)

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★ 하 — 특정 분야·고급 |
| 난이도 | 고급 |

## 함수 인터페이스

```ts
export function suffixArray(s: string): number[];
```

## 제약 조건

- $1 \leq |s| \leq 10^{5}$
- 효율적인 구현은 $O(n \log n)$ 이어야 한다

## 문제 상세

문자열 $s$의 모든 접미사를 사전순(lexicographic order)으로 정렬했을 때, 각 접미사의 시작 인덱스를 정렬 순서대로 담은 배열을 반환한다.

길이 $n = |s|$일 때 접미사 집합 $\text{Suf}(s) = \{ s[i \ldots n-1] \mid 0 \leq i < n \}$ 에 대하여:

$$\text{SA}[k] = i \;\iff\; s[i \ldots n-1] \text{ is the } (k+1)\text{-th smallest suffix}$$

## 예시

`suffixArray("banana") = [5, 3, 1, 0, 4, 2]`:

- `sa[0] = 5` → `"a"`
- `sa[1] = 3` → `"ana"`
- `sa[2] = 1` → `"anana"`
- `sa[3] = 0` → `"banana"`
- `sa[4] = 4` → `"na"`
- `sa[5] = 2` → `"nana"`
