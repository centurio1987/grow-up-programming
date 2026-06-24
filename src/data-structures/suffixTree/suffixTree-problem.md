# SuffixTree (접미사 트리)

## 한 줄 요약
> 문자열의 모든 접미사를 압축 트리로 구성해 패턴 검색 O(m), 최장 반복 부분 문자열 탐색 O(n)을 달성하라.

## 스토리
인간 유전체는 약 30억 개의 염기서열로 구성된다. 유전자 연구자들은 특정 DNA 패턴(예: "ATCG...")이 유전체 어디에 등장하는지, 얼마나 자주 반복되는지 수시로 검색해야 한다. 이 데이터를 단순 문자열로 저장하면 KMP로도 O(n+m)밖에 안 나온다 — 하지만 같은 쿼리를 수천 번 반복하면 전처리 구조가 필요하다.

접미사 트리는 문자열 s의 모든 접미사 s[0..n-1], s[1..n-1], ..., s[n-1..n-1]을 압축 Radix Tree에 삽입해 전처리한다. 전처리 후 임의의 패턴 검색이 O(패턴 길이)에 가능하다. BLAST(유전자 검색 도구), 텍스트 편집기의 Find 기능 최적화, 데이터 압축(LZ계열)의 이론적 기반이 된다.

가장 긴 반복 부분 문자열(Longest Repeated Substring)은 접미사 트리에서 자식이 2개 이상인 내부 노드(분기점) 중 가장 깊은 노드까지의 경로 문자열로 O(n)에 구할 수 있다.

## 함수 인터페이스

```ts
export class SuffixTree {
  constructor(s: string)
  search(pattern: string): boolean
  findAll(pattern: string): number[]
  longestRepeatedSubstring(): string
}
```

## 제약 조건
- $1 \leq |s| \leq 10^3$ (Naive O(n²) 구현 허용)
- $1 \leq |pattern| \leq |s|$
- 문자는 임의의 ASCII 문자
- 시간 제한: 1초 (|s| ≤ 10³ 기준), 메모리 제한: 256 MB

## 문제 상세

### 접미사 트리 구성 (Naive)
1. 빈 Radix Tree 생성
2. 각 i = 0, 1, ..., n-1에 대해 접미사 `s[i..n-1]`을 삽입
3. 삽입 시 각 노드에 인덱스 i를 기록

### 패턴 검색 (search)
루트에서 시작해 패턴 문자를 에지 레이블과 비교하며 내려간다. 패턴을 완전히 소비하면 true (이 지점의 서브트리에 해당 접미사 인덱스들이 존재).

### 전체 인덱스 반환 (findAll)
패턴과 일치하는 노드에 도달 후, 서브트리의 모든 리프 인덱스를 수집.

### 최장 반복 부분 문자열 (longestRepeatedSubstring)
- 자식이 2개 이상인 내부 노드 = 두 개 이상의 접미사가 이 지점까지 공통 경로를 공유
- 루트에서 해당 노드까지의 경로 문자열이 반복 부분 문자열
- 가장 깊은(문자열 길이가 긴) 그런 노드를 찾으면 된다

### 접미사 배열 vs 접미사 트리

| | 접미사 배열 | 접미사 트리 |
|---|---|---|
| 공간 | O(n log n) | O(n) ~ O(n²) |
| 구성 | O(n log n) or O(n) | O(n²) Naive, O(n) Ukkonen |
| 패턴 검색 | O(m log n) | O(m) |
| LRS | O(n) w/ LCP 배열 | O(n) |

## 예시

```ts
const tree = new SuffixTree("banana");

console.log(tree.search("ana"));    // true
console.log(tree.search("xyz"));    // false
console.log(tree.findAll("ana").sort()); // [1, 3]
console.log(tree.longestRepeatedSubstring()); // "ana" (길이 3)

const tree2 = new SuffixTree("mississippi");
console.log(tree2.findAll("issi").sort()); // [1, 4]
console.log(tree2.longestRepeatedSubstring()); // "issi" (길이 4)
```
