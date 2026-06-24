# SuffixArray (접미사 배열)

## 한 줄 요약
> 문자열의 모든 접미사를 사전순 정렬한 인덱스 배열로, 긴 텍스트에서 패턴을 O(m log n)에 검색하는 자료구조를 구현하라.

## 스토리

유전체 분석 회사에서 인간 게놈 데이터를 다루고 있다. 게놈은 약 30억 개의 염기서열(A, C, G, T)로 이루어진 문자열이다. 특정 유전자 서열 패턴이 게놈에서 몇 번이나, 어디에 등장하는지 빠르게 찾아야 한다.

단순한 방법으로는 KMP나 Boyer-Moore 알고리즘을 사용할 수 있지만, 이 방법들은 패턴이 바뀔 때마다 텍스트 전체를 다시 스캔해야 한다. 수천 개의 서열 패턴을 검색할 경우 O(nm) 시간이 걸린다.

**접미사 배열(Suffix Array)**은 텍스트에 대한 색인을 미리 구성해두어, 이후 임의의 패턴을 O(m log n)에 찾을 수 있게 한다. 텍스트가 고정되고 패턴이 자주 바뀌는 상황에서 최적의 해법이다. BLAST(유전체 서열 정렬 도구)를 비롯한 많은 생물정보학 소프트웨어가 이 구조를 기반으로 한다.

## 함수 인터페이스

```ts
export class SuffixArray {
  constructor(s: string)                    // O(n^2 log n) naive 구성
  search(pattern: string): number[]         // O(m log n), 정렬된 인덱스 반환
  lcp(i: number, j: number): number         // suffixArray[i], [j] 접미사의 LCP 길이
  longestRepeatedSubstring(): string        // 가장 긴 반복 부분 문자열
  suffixes(): string[]                      // 정렬된 접미사 배열 (디버깅용)
}
```

## 제약 조건

- 시간 제한: 1초, 메모리 제한: 256 MB
- 입력 문자열 길이: 최대 1,000
- O(n^2 log n) naive 구현 허용
- `lcp(i, j)`: i, j는 접미사 배열의 인덱스 (0-based)
- `search` 결과는 정렬된 상태로 반환

## 문제 상세

### 접미사 배열 구성

문자열 `s`의 모든 접미사를 생성하고 사전순으로 정렬한 뒤, 원래 문자열에서의 시작 인덱스 배열을 유지한다.

예: `s = "banana"` (n=6)
| 인덱스 | 접미사 |
|--------|--------|
| 5 | a |
| 3 | ana |
| 1 | anana |
| 0 | banana |
| 4 | na |
| 2 | nana |

SA = [5, 3, 1, 0, 4, 2]

### 패턴 검색

접미사 배열에 대해 이진 탐색을 수행한다. 패턴 `p`가 접두사로 등장하는 접미사의 범위 `[lo, hi)`를 이진 탐색으로 찾고, 해당 범위의 SA 값을 반환한다.

### LCP (최장 공통 접두사)

`lcp(i, j)`: SA[i]번째 접미사와 SA[j]번째 접미사를 직접 문자 비교하여 공통 접두사 길이를 구한다.

### 최장 반복 부분 문자열

인접한 두 접미사의 LCP를 모두 계산하여 최댓값에 해당하는 문자열을 반환한다. 정렬된 접미사 배열에서 반복 부분 문자열은 항상 인접한 두 접미사의 공통 접두사로 나타난다.

## 예시

```ts
const sa = new SuffixArray("banana");

sa.suffixes();
// ["a", "ana", "anana", "banana", "na", "nana"]

sa.search("ana");
// [1, 3]  ("banana"에서 "ana"는 위치 1, 3에 등장)

sa.search("xyz");
// []

sa.lcp(1, 2);
// 3  (suffixes()[1]="ana", suffixes()[2]="anana" → 공통 접두사 "ana")

sa.longestRepeatedSubstring();
// "ana"  ("banana"에서 "ana"가 두 번 등장)
```
