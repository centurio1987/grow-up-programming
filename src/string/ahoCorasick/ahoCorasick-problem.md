# 다중 패턴 검색 (Aho-Corasick)

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★ 하 — 특정 분야·고급 |
| 난이도 | 고급 |

## 함수 인터페이스

```ts
export function ahoCorasick(
  text: string,
  patterns: string[],
): Array<{ patternIndex: number; position: number }>;
```

## 제약 조건

- $1 \leq n \leq 10^{5}$ (여기서 $n = |T|$, 텍스트 길이)
- $1 \leq k$ (패턴 개수)
- $\sum |p_i| \leq 10^{5}$ (모든 패턴 길이의 합)

## 문제 상세

텍스트 문자열 $T$와 패턴 집합 $P = \{p_0, p_1, \ldots, p_{k-1}\}$가 주어질 때, 각 패턴이 $T$ 안에서 등장하는 모든 (패턴 인덱스, 등장 위치) 쌍을 반환한다.

반환 형식:

$$\text{result} = \{\, (i, j) \mid 0 \leq i < k,\; 0 \leq j \leq n - |p_i|,\; T[j \ldots j + |p_i| - 1] = p_i \,\}$$

결과는 등장 위치(`position`) 오름차순으로 정렬하며, 동률 시 `patternIndex` 오름차순으로 정렬한다.

### 입력

- `text`: 검색 대상 텍스트
- `patterns`: 패턴 배열

### 출력

- `{ patternIndex, position }` 매칭 결과 배열 (position 오름차순, 동률 시 patternIndex 오름차순)

## 예시

```ts
ahoCorasick("ahishers", ["he", "she", "his", "hers"]);
// [
//   { patternIndex: 2, position: 1 },  // "his" at 1
//   { patternIndex: 1, position: 3 },  // "she" at 3
//   { patternIndex: 0, position: 4 },  // "he" at 4
//   { patternIndex: 3, position: 4 },  // "hers" at 4
// ]
```
