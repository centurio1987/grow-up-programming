# Bloom Filter

## 한 줄 요약

> `BloomFilter`는 크기와 해시 함수 개수를 받아, 문자열의 멤버십을 확률적으로 판단한다.

## 스토리

어느 대형 전자상거래 플랫폼의 쿠폰 발급 팀은 수천만 개의 쿠폰 코드를 관리한다. 고객이 결제창에서 코드를 입력할 때마다 서버는 "이미 사용된 코드인가?"를 확인해야 한다. 매번 데이터베이스 전체를 뒤지는 건 너무 느리다.

팀은 메모리 사용량을 크게 줄이면서도 "절대 사용된 코드를 통과시키지 않는" 1차 관문을 두기로 했다. 1차 관문이 "아직 안 쓴 것 같다"고 판단하면 실제 DB 조회를 진행하고, "사용된 것 같다"고 판단하면 바로 차단한다. 가끔 멀쩡한 코드를 오차로 막을 수는 있어도, 진짜 사용된 코드를 통과시켜서는 안 된다.

쿠폰 코드 문자열을 받아 등록·조회할 수 있는 이 1차 관문 자료구조를 구현하라.

## 함수 인터페이스

```ts
export class BloomFilter {
  constructor(size: number, hashCount: number): void;
  add(item: string): void;
  has(item: string): boolean;
}
```

- `size` — 내부 비트 배열의 길이 $m$ ($m \geq 1$)
- `hashCount` — 사용할 독립 해시 함수의 개수 $k$ ($k \geq 1$)
- `add(item)` — 문자열 `item`을 집합에 추가한다. 반환값 없음
- `has(item)` — 문자열 `item`이 집합에 있을 가능성이 있으면 `true`, 없으면 `false`를 반환한다. `add`로 등록된 문자열에 대해 반드시 `true`를 반환해야 한다(거짓 음성 불가)

## 제약 조건

- $1 \leq \text{size} \leq 10^6$
- $1 \leq \text{hashCount} \leq 16$
- 삽입 원소 수 $n \leq 10^5$
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

크기 $m$의 비트 배열 $B$와 $k$개의 독립 해시 함수 $h_1, h_2, \ldots, h_k$를 사용한다.

**add(item):** 모든 $j \in [1, k]$에 대해 $B[\,h_j(\text{item}) \bmod m\,] \leftarrow 1$

**has(item):** $\displaystyle\bigwedge_{j=1}^{k} B[\,h_j(\text{item}) \bmod m\,]$ 를 반환한다. 모든 비트가 1이면 `true`, 하나라도 0이면 `false`

거짓 음성(false negative)은 절대 발생하지 않는다. `add`된 문자열은 반드시 `has`에서 `true`를 반환해야 한다. 거짓 양성(false positive)은 허용된다: 등록하지 않은 문자열도 `true`가 될 수 있다.

`size=1, hashCount=1`이면 비트 하나만 존재하므로 어떤 `add` 이후에도 모든 질의가 `true`를 반환한다.

## 예시

```ts
const bf = new BloomFilter(1000, 4);

bf.add("apple");
bf.add("banana");

bf.has("apple");    // true — add된 원소, 항상 true
bf.has("banana");   // true — add된 원소, 항상 true
bf.has("cherry");   // false 또는 true — 미등록 원소, false positive 가능

// 충분히 큰 배열에서는 미등록 원소가 false일 확률이 높다
const large = new BloomFilter(100_000, 7);
large.add("registered");
large.has("registered");        // true — 항상
large.has("not-registered-0");  // 거의 false

// size=1이면 모든 질의가 true
const tiny = new BloomFilter(1, 1);
tiny.add("x");
tiny.has("x"); // true
tiny.has("y"); // true — 단일 비트라 충돌
```
