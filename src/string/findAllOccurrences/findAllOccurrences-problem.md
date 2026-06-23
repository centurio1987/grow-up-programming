# 부분 문자열 등장 위치 검색

## 한 줄 요약

> `findAllOccurrences(text, pattern)`은 텍스트와 패턴을 받아, 패턴이 텍스트 안에서 등장하는 모든 시작 위치를 오름차순 배열로 반환한다.

## 스토리

편집자 준호는 수십만 글자짜리 원고 안에서 특정 단어가 몇 군데나 쓰였는지 전수 확인해야 한다. "찾기" 기능이 처음 발견한 위치만 알려줄 때는 나머지를 일일이 손으로 넘겨야 했다.

준호에게는 패턴이 나타나는 위치를 모조리 돌려주는 도구가 필요하다. 원고가 길어도 빠르게, 그리고 겹쳐서 등장하는 경우도 빠짐없이 잡아야 한다.

## 함수 인터페이스

```ts
export function findAllOccurrences(text: string, pattern: string): number[];
```

- `text` — 검색 대상 텍스트
- `pattern` — 검색할 패턴
- 반환 — 패턴이 시작하는 인덱스(0-based) 배열, 오름차순 정렬. 등장하지 않으면 빈 배열.

## 제약 조건

- $0 \leq |text| \leq 10^5$
- $0 \leq |pattern| \leq 10^5$
- 문자 집합: 소문자 영문 알파벳 (`a`–`z`)
- 시간 복잡도: $O(|text| + |pattern|)$
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

텍스트 $T$(길이 $n$)와 패턴 $P$(길이 $m$)가 주어질 때, $T$ 내에서 $P$가 등장하는 모든 시작 위치를 오름차순으로 반환한다.

$$\text{Occ}(T, P) = \{\, i \mid 0 \leq i \leq n - m,\; T[i \ldots i+m-1] = P \,\}$$

겹치는 등장도 모두 포함한다. 예를 들어 `"aaaa"`에서 `"aa"`는 위치 0, 1, 2에서 모두 매칭된다.

**빈 패턴 규약**: $m = 0$이면 빈 배열을 반환한다. 빈 텍스트($n = 0$)에 비어 있지 않은 패턴을 검색하면 빈 배열을 반환한다.

## 예시

```ts
findAllOccurrences("ababcababab", "abab");  // [0, 5, 7] — 겹침 포함 전체 매칭
findAllOccurrences("aaaa", "aa");           // [0, 1, 2] — 겹치는 3곳
findAllOccurrences("abc", "d");             // [] — 패턴 없음
findAllOccurrences("abc", "");              // [] — 빈 패턴 규약
findAllOccurrences("", "a");               // [] — 빈 텍스트
```
