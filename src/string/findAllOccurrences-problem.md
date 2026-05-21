# 부분 문자열 검색 (KMP / Z-Algorithm / Rabin-Karp)

## 함수 인터페이스

```ts
export function findAllOccurrences(text: string, pattern: string): number[];
```

## 제약 조건

- $0 \leq n \leq 10^{5}$ (여기서 $n = |T|$, 텍스트 길이)
- $0 \leq m \leq 10^{5}$ (여기서 $m = |P|$, 패턴 길이)

## 문제 상세

텍스트 문자열 $T$와 패턴 문자열 $P$가 주어질 때, $T$ 내에서 $P$가 등장하는 모든 시작 위치를 오름차순으로 반환한다.

$T$의 길이를 $n$, $P$의 길이를 $m$이라 하면, 등장 위치 집합은:

$$\text{Occ}(T, P) = \{\, i \mid 0 \leq i \leq n - m,\; T[i \ldots i+m-1] = P \,\}$$

전체 시간 복잡도는 $O(n + m)$이어야 한다.

### 빈 패턴 규약

빈 패턴 ($m = 0$)이 주어지면 모든 위치 $0, 1, \ldots, n$을 반환하지 않고 **빈 배열**을 반환한다.

## 예시

```ts
findAllOccurrences("ababcababab", "abab");   // [0, 5, 7]
findAllOccurrences("aaaa", "aa");             // [0, 1, 2]
findAllOccurrences("abc", "d");               // []
findAllOccurrences("abc", "");                // []  (빈 패턴 규약)
```
