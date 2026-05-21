# 팰린드롬 분할 — 최소 컷 (Palindrome Partitioning · Min Cut)

## 함수 인터페이스

```ts
export function palindromePartitioningMinCut(s: string): number;
```

## 제약 조건

- $1 \leq |s| \leq 2000$
- $s$ 는 영문 소문자

## 문제 상세

문자열 $s$ 가 주어진다.

$s$ 를 모든 부분 문자열이 **팰린드롬**이 되도록 분할할 때, 필요한 **최소 컷 횟수**를 구하라. 분할 횟수가 $k$ 이면 부분 문자열은 $k+1$ 개이다.

문자열 자체가 이미 팰린드롬이면 컷 횟수는 $0$ 이다.

## 예시

| `s` | 반환값 | 설명 |
| --- | --- | --- |
| `"a"` | `0` | 이미 팰린드롬 |
| `"ab"` | `1` | `"a" \| "b"` |
| `"aab"` | `1` | `"aa" \| "b"` |
| `"aaba"` | `1` | `"a" \| "aba"` |
| `"abccbc"` | `2` | `"a" \| "bccb" \| "c"` |
| `"noonracecar"` | `1` | `"noon" \| "racecar"` |
