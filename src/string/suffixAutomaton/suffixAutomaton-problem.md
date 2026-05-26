# 접미사 구조 통합 (Suffix Automaton / Suffix Tree)

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★ 하 — 특정 분야·고급 |
| 난이도 | 고급 |

## 함수 인터페이스

```ts
export class SuffixAutomaton {
  constructor(s: string);
  countDistinctSubstrings(): number;
  contains(t: string): boolean;
}
```

## 제약 조건

- $1 \leq |s| \leq 10^{5}$
- 자료구조 구축은 $O(n)$ 시간/공간이어야 한다
- `contains(t)` 는 $O(|t|)$ 시간이어야 한다

## 문제 상세

문자열 $s$의 모든 부분 문자열을 표현하는 최소 결정성 유한 오토마타를 구축하고, 다음 두 가지 연산을 제공한다.

### 메서드 명세

- `new SuffixAutomaton(s)` — 문자열 $s$ 로부터 자료구조를 구축한다.

- `countDistinctSubstrings()` — 문자열 $s$ 의 서로 다른 비공(non-empty) 부분 문자열 개수를 반환한다.

  $$\#\{\, w \neq \varepsilon \mid w \text{ is a substring of } s \,\}$$

- `contains(t)` — $t$ 가 $s$ 의 부분 문자열이면 `true`, 아니면 `false` 를 반환한다.

  $$t \in \text{Sub}(s) \;?$$

## 예시

```ts
const sa = new SuffixAutomaton("abcbc");

sa.countDistinctSubstrings();   // 10
// {"a","b","c","ab","bc","cb","abc","bcb","cbc","abcb","bcbc","abcbc"} 중
// 실제 distinct substring 개수

sa.contains("bcb");    // true
sa.contains("abc");    // true
sa.contains("bca");    // false
sa.contains("");       // true (관례)
```

`"abcbc"` 의 서로 다른 비공 부분 문자열은
`{"a", "b", "c", "ab", "bc", "cb", "abc", "bcb", "cbc", "abcb", "bcbc", "abcbc"}` 으로 총 12 개이다.
