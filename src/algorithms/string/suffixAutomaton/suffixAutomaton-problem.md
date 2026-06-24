# 서로 다른 부분 문자열 집합 관리

## 한 줄 요약

> `SuffixAutomaton`은 문자열을 받아 구축되며, 서로 다른 비공 부분 문자열의 총 개수를 세고 특정 문자열이 부분 문자열인지 판단하는 두 연산을 제공한다.

## 스토리

표절 검사 시스템을 만드는 하은은 원본 문서 안에 어떤 부분 문자열이 얼마나 다양하게 존재하는지 빠르게 파악해야 한다. 문서를 한 번 전처리해 두면, 이후 의심 문장이 원본의 일부인지 즉시 확인할 수 있어야 한다.

문서가 수십만 자에 달하기 때문에 모든 부분 문자열을 직접 열거하는 방식은 시간과 공간 모두 감당이 안 된다. 하은에게는 선형 시간 전처리만으로 두 질의를 모두 처리할 수 있는 자료구조가 필요하다.

## 함수 인터페이스

```ts
export class SuffixAutomaton {
  constructor(s: string);
  countDistinctSubstrings(): number;
  contains(t: string): boolean;
}
```

- `constructor(s)` — 문자열 `s`로부터 자료구조를 구축한다.
- `countDistinctSubstrings()` — `s`의 서로 다른 비공(non-empty) 부분 문자열의 개수를 반환한다.
- `contains(t)` — `t`가 `s`의 부분 문자열이면 `true`, 아니면 `false`. 빈 문자열 `t`는 모든 문자열의 부분 문자열이므로 `true`.

## 제약 조건

- $1 \leq |s| \leq 10^5$
- $0 \leq |t| \leq 10^5$
- 문자 집합: 소문자 영문 알파벳 (`a`–`z`)
- 구축 시간 복잡도: $O(n)$
- `contains(t)` 시간 복잡도: $O(|t|)$
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

`countDistinctSubstrings()`는 다음 집합의 크기를 반환한다:

$$\#\{\, w \neq \varepsilon \mid w \text{는 } s \text{의 부분 문자열}\,\}$$

`contains(t)`는 $t = \varepsilon$ (빈 문자열)이면 `true`를 반환한다. `t`가 `s`보다 길면 `false`를 반환한다.

## 예시

```ts
const sam = new SuffixAutomaton("abcbc");
sam.countDistinctSubstrings();
// 12
// {"a","b","c","ab","bc","cb","abc","bcb","cbc","abcb","bcbc","abcbc"}

sam.contains("bcb");   // true  — "abcbc"의 부분 문자열
sam.contains("abc");   // true
sam.contains("bca");   // false — 존재하지 않는 패턴
sam.contains("");      // true  — 빈 문자열은 항상 true

const sam2 = new SuffixAutomaton("aaa");
sam2.countDistinctSubstrings();  // 3 → {"a","aa","aaa"}

const sam3 = new SuffixAutomaton("abc");
sam3.countDistinctSubstrings();  // 6 → {"a","b","c","ab","bc","abc"}
```
