# MinHash (민해시)

## 한 줄 요약
> Jaccard 유사도를 서명(signature) 비교만으로 빠르게 추정하는 확률적 해시 기법

## 스토리

당신은 검색 엔진 회사의 크롤링 팀에서 일하고 있다. 매일 수억 개의 웹 페이지를 수집하지만, 그 중 상당수는 내용이 거의 동일한 복사본이다. 뉴스 기사, 광고 스팸, 미러 사이트 등이 대표적이다.

두 페이지의 유사도를 정확하게 계산하려면 전체 단어 집합을 비교해야 한다. 하지만 억 개의 페이지를 서로 비교하는 것은 컴퓨팅 자원이 폭발적으로 증가한다. 각 페이지가 평균 1,000개의 단어를 가진다고 해도, 페이지 하나당 수 KB의 집합 데이터를 저장하고 비교해야 한다.

MinHash는 이 문제를 우아하게 해결한다. 각 페이지의 단어 집합을 단 수십~수백 개의 정수 배열(서명)로 압축한다. 두 페이지의 서명을 비교하면 수 마이크로초 만에 Jaccard 유사도를 근사 계산할 수 있다. 원본 집합을 전혀 보관하지 않아도 된다. 검색 엔진은 이 방법으로 하루에 수십억 쌍의 유사도를 효율적으로 판단한다.

## 함수 인터페이스

```ts
export class MinHash {
  constructor(numHashes: number)
  update(set: Iterable<string>): void
  signature(): number[]
  static jaccard(a: MinHash, b: MinHash): number
  static exact(a: Set<string>, b: Set<string>): number
}
```

| 메서드 | 설명 | 반환 |
|--------|------|------|
| `constructor(numHashes)` | 해시 함수 개수로 초기화. 클수록 정확도 증가 | - |
| `update(set)` | 집합으로 MinHash 서명 계산 (이전 서명 덮어씀) | `void` |
| `signature()` | 현재 MinHash 서명 배열 반환 | `number[]` |
| `MinHash.jaccard(a, b)` | 두 서명으로 Jaccard 유사도 추정 | `number` [0,1] |
| `MinHash.exact(a, b)` | 두 Set으로 정확한 Jaccard 계산 | `number` [0,1] |

## 제약 조건

- $n \leq 10^4$ (집합 원소 수)
- $k \leq 512$ (numHashes)
- 시간 제한: 1초, 메모리 제한: 256 MB
- `jaccard` 추정 오차: `numHashes = 128`일 때 표준 편차 ≈ `1/sqrt(128) ≈ 0.088`
- `signature()` 반환 배열의 길이는 `numHashes`와 같아야 한다

## 문제 상세

### Jaccard 유사도

두 집합 A, B의 Jaccard 유사도는 다음과 같이 정의한다:

```
J(A, B) = |A ∩ B| / |A ∪ B|
```

- 완전히 같은 집합: J = 1
- 교집합이 없는 집합: J = 0
- 절반이 겹치는 경우: J는 0과 1 사이의 값

### MinHash의 수학적 근거

무작위 해시 함수 h에 대해, 다음 등식이 성립한다:

```
P[min(h(A)) == min(h(B))] = J(A, B)
```

즉, A와 B 각각에 해시를 적용했을 때 **최솟값이 같을 확률**이 Jaccard 유사도와 같다. 이를 이용하면:

1. k개의 독립 해시 함수 h₁, h₂, …, hₖ를 준비한다
2. 집합 A의 서명: `sig(A) = [min(h₁(A)), min(h₂(A)), ..., min(hₖ(A))]`
3. Jaccard 추정: `sig(A)[i] == sig(B)[i]`인 비율

### 해시 함수 생성 (Universal Hashing)

실제 구현에서는 k개의 해시 함수를 다음 방식으로 시뮬레이션한다:

```
h_i(x) = (a_i * fnv1a(x) + b_i) % LARGE_PRIME
```

각 i에 대해 a_i, b_i를 무작위(또는 사전 정해진) 상수로 설정한다.

## 예시

```ts
const mh1 = new MinHash(128);
const mh2 = new MinHash(128);

// 두 문서의 단어 집합
const doc1 = new Set(["the", "quick", "brown", "fox", "jumps"]);
const doc2 = new Set(["the", "quick", "brown", "dog", "runs"]);

mh1.update(doc1);
mh2.update(doc2);

// 서명 비교로 유사도 추정
const estimated = MinHash.jaccard(mh1, mh2);
// 예: 0.38 (실제 Jaccard = 3/7 ≈ 0.43, 오차 범위 내)

// 정확한 Jaccard 계산 (검증용)
const exact = MinHash.exact(doc1, doc2);
// 정확히: 3 / 7 ≈ 0.4286

console.log(`추정: ${estimated.toFixed(3)}, 정확: ${exact.toFixed(3)}`);
```
