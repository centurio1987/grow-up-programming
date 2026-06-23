# Longest Common Subsequence

## 한 줄 요약

> 두 문자열을 받아, 두 문자열에 공통으로 존재하는 **가장 긴 부분 수열의 길이**를 반환한다.

## 스토리

유전공학 연구소의 분석가 은지는 두 DNA 염기 서열을 비교한다. 두 서열에 공통으로 나타나는 염기 패턴의 최대 길이를 찾는 것이 목표다.

두 서열에서 일부 염기를 제거해 나머지를 원래 순서대로 이었을 때 같아지는 최장 서열, 즉 공통 부분 수열을 구해야 한다. 제거된 염기가 연속될 필요는 없다.

은지는 이 최장 공통 부분 수열의 길이를 계산해 두 서열의 유사도를 수치화하려 한다.

## 함수 인터페이스

```ts
export function longestCommonSubsequence(s: string, t: string): number;
```

- `s` — 첫 번째 문자열.
- `t` — 두 번째 문자열.
- 반환 — 두 문자열의 최장 공통 부분 수열의 길이.

## 제약 조건

- $0 \leq |s| \leq 1{,}000$
- $0 \leq |t| \leq 1{,}000$
- 문자열의 문자는 ASCII 범위로 가정한다
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

문자열 $x$의 **부분 수열**이란 $x$에서 일부 문자를 골라(0개 이상) **원래 순서를 유지**한 채 이어 붙인 문자열이다. 인접하지 않아도 되며, 모두 제거할 수도 있다.

**공통 부분 수열** $w$는 $s$와 $t$ 모두의 부분 수열이 되는 문자열이다. 그 중 가장 긴 $w$의 길이를 반환한다($w$ 자체가 아닌 길이만).

한쪽 또는 양쪽이 빈 문자열이면 공통 부분 수열이 없으므로 $0$을 반환한다.

## 예시

```ts
longestCommonSubsequence("abcde", "ace");      // 3  — 공통 부분 수열 "ace"
longestCommonSubsequence("AGGTAB", "GXTXAYB"); // 4  — 공통 부분 수열 "GTAB"
longestCommonSubsequence("abc", "aabbcc");     // 3  — 공통 부분 수열 "abc"

longestCommonSubsequence("abc", "abc");        // 3  — 동일 문자열, 전체가 공통
longestCommonSubsequence("abc", "def");        // 0  — 공통 문자 없음

longestCommonSubsequence("", "abc");           // 0  — 빈 문자열은 공통 부분 수열 없음
longestCommonSubsequence("", "");              // 0  — 둘 다 빈 문자열

longestCommonSubsequence("a", "a");            // 1  — 단일 문자 일치
```
