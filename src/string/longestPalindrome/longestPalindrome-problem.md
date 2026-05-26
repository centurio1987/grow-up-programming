# 최장 회문 부분 문자열 (Manacher's Algorithm)

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★ 하 — 특정 분야·고급 |
| 난이도 | 고급 |

## 함수 인터페이스

```ts
export function longestPalindrome(s: string): string;
```

## 제약 조건

- $0 \leq |s| \leq 10^{5}$
- 전체 시간 복잡도는 $O(n)$ 이어야 한다

## 문제 상세

문자열 $s$가 주어질 때, $s$의 부분 문자열 중 회문(Palindrome)인 가장 긴 부분 문자열을 반환한다.

부분 문자열 $s[i \ldots j]$가 회문이라는 것은:

$$\forall k \in [0, j - i],\; s[i + k] = s[j - k]$$

답이 여러 개라면 그중 어느 하나를 반환해도 된다. 빈 문자열 입력 시 빈 문자열을 반환한다.

## 예시

```ts
longestPalindrome("babad");   // "bab" 또는 "aba"
longestPalindrome("cbbd");    // "bb"
longestPalindrome("a");       // "a"
longestPalindrome("");        // ""
longestPalindrome("forgeeksskeegfor");  // "geeksskeeg"
```
