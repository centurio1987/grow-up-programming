# Bloom Filter — 메모리 절약형 집합 멤버십 자료구조

## 함수 인터페이스

```ts
export class BloomFilter {
  constructor(size: number, hashCount: number);
  add(item: string): void;
  has(item: string): boolean;
}
```

## 제약 조건

- 비트 배열 크기 $m \leq 10^6$ ($1 \leq m$)
- 해시 함수 개수 $k \leq 16$ ($1 \leq k$)
- 원소 수 $n \leq 10^5$

## 문제 상세

크기 $m$의 비트 배열 $B$와 $k$개의 독립 해시 함수 $h_1, h_2, \ldots, h_k$를 사용해 집합 멤버십을 확률적으로 판단하는 자료구조를 구현하라.

**추가 (`add`):**

$$\forall\, j \in [1, k],\; B[\, h_j(x) \bmod m\,] \leftarrow 1$$

**존재 여부 질의 (`has`):**

$$\mathrm{has}(x) \;=\; \bigwedge_{j=1}^{k} B[\, h_j(x) \bmod m\,]$$

거짓 음성(false negative)이 없다: 추가된 원소는 반드시 `true`를 반환한다. 거짓 양성(false positive) 확률은 $n$개 원소 추가 후 다음에 근사한다:

$$p \approx \left(1 - e^{-kn/m}\right)^{k}$$

### 메서드 명세

- `new BloomFilter(size, hashCount)` — 크기 $m$ 비트 배열과 $k$개의 해시 함수를 갖는 Bloom Filter를 생성한다.
- `add(item)` — 원소 $x$를 집합에 추가한다. 반환값은 없다.
- `has(item)` — 원소 $x$가 집합에 속하는지 추정한다.
  - 추가된 원소에 대해서는 반드시 `true` (no false negative)
  - 추가되지 않은 원소에 대해서도 `true`가 될 수 있음 (false positive 가능)

## 예시

```ts
const bf = new BloomFilter(1000, 4);

bf.add("apple");
bf.add("banana");

bf.has("apple");     // true (반드시)
bf.has("banana");    // true (반드시)
bf.has("cherry");    // 대부분 false (false positive 가능)
```
