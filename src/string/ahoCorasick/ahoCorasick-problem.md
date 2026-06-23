# 다중 패턴 검색

## 한 줄 요약

> `ahoCorasick(text, patterns)`은 텍스트와 패턴 배열을 받아, 각 패턴이 텍스트 내에서 등장하는 모든 (패턴 인덱스, 시작 위치) 쌍을 반환한다.

## 스토리

바이러스 분석 연구실의 미나는 수십만 염기서열 중에서 알려진 위험 패턴 수백 개를 동시에 찾아야 한다. 패턴마다 텍스트 전체를 따로 훑으면 퇴근도 못 한다. 그녀는 모든 패턴을 한 번의 텍스트 순회만으로 처리할 수 있는 방법이 필요하다.

단순한 반복 검색은 패턴이 늘어날수록 시간이 선형으로 불어난다. 미나에게는 패턴 수와 무관하게 텍스트 길이에 비례하는 시간 안에 결과를 내놓는 도구가 필요하다.

## 함수 인터페이스

```ts
export function ahoCorasick(
  text: string,
  patterns: string[],
): Array<{ patternIndex: number; position: number }>;
```

- `text` — 검색 대상 텍스트 문자열
- `patterns` — 검색할 패턴 문자열 배열 (인덱스 0부터 시작)
- 반환 — `{ patternIndex, position }` 매칭 결과 배열. `position`은 텍스트 내 패턴 시작 인덱스(0-based). 결과는 `position` 오름차순, 동률 시 `patternIndex` 오름차순으로 정렬된다.

## 제약 조건

- $1 \leq |text| \leq 10^5$
- $1 \leq |\text{patterns}|$
- 모든 패턴 길이의 합 $\sum |p_i| \leq 10^5$
- 문자 집합: 소문자 영문 알파벳 (`a`–`z`)
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

텍스트 $T$와 패턴 집합 $P = \{p_0, p_1, \ldots, p_{k-1}\}$가 주어질 때, 각 패턴이 $T$ 안에서 등장하는 모든 (패턴 인덱스, 시작 위치) 쌍을 반환한다.

반환 집합의 정의:

$$\text{result} = \{\, (i, j) \mid 0 \leq i < k,\; 0 \leq j \leq |T| - |p_i|,\; T[j \ldots j + |p_i| - 1] = p_i \,\}$$

겹치는 등장도 모두 포함한다. 결과는 `position` 오름차순으로 정렬하며, 같은 위치에 여러 패턴이 매칭되면 `patternIndex` 오름차순으로 정렬한다.

패턴이 하나도 매칭되지 않으면 빈 배열을 반환한다.

## 예시

```ts
ahoCorasick("ahishers", ["he", "she", "his", "hers"]);
// [
//   { patternIndex: 0, position: 1 },  // "he"  at 1
//   { patternIndex: 2, position: 1 },  // "his" at 1
//   { patternIndex: 1, position: 3 },  // "she" at 3
//   { patternIndex: 0, position: 4 },  // "he"  at 4
//   { patternIndex: 3, position: 4 },  // "hers" at 4
// ]

ahoCorasick("aaaa", ["aa"]);
// [
//   { patternIndex: 0, position: 0 },  // 위치 0에서 겹침 시작
//   { patternIndex: 0, position: 1 },
//   { patternIndex: 0, position: 2 },
// ]

ahoCorasick("abc", ["abc", "bc"]);
// [
//   { patternIndex: 0, position: 0 },  // "abc" at 0
//   { patternIndex: 1, position: 1 },  // "bc"  at 1
// ]

ahoCorasick("abcdef", ["xyz", "qrs"]);
// []  — 어떤 패턴도 매칭되지 않음
```
