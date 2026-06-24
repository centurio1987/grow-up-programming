# BitArray (비트 배열)

## 한 줄 요약
> Uint32Array를 이용해 비트 단위로 플래그를 저장하고 조작하는 배열을 구현하라.

## 스토리

대형 전자상거래 플랫폼에서 오늘 특정 상품 페이지를 방문한 유저 ID를 추적해야 한다. 유저 ID는 0부터 N-1까지의 정수이고 N은 최대 1,000만이다.

`Set<number>`를 쓰면 원소 하나당 최소 8바이트가 필요해 최악의 경우 80MB가 된다. 방문 여부는 "예/아니오"만 알면 되므로 비트 하나(1 bit)로 충분하다. 비트 배열을 쓰면 1,000만 비트 = 약 1.25MB로 64배 절약된다.

`Uint32Array`는 32비트 정수 배열이다. 하나의 원소에 32개의 비트를 밀어 넣을 수 있다. 비트 연산(`|`, `&`, `^`, `~`, `>>>`)으로 개별 비트를 조작한다. index번 비트가 몇 번째 워드의 몇 번째 비트인지 계산하면 O(1) 접근이 가능하다.

## 함수 인터페이스

```ts
export class BitArray {
  constructor(size: number);          // size >= 1, 비트 개수
  set(index: number): void;           // index번 비트를 1로
  clear(index: number): void;         // index번 비트를 0으로
  get(index: number): boolean;        // index번 비트 값 (true=1)
  toggle(index: number): void;        // 비트 반전
  count(): number;                    // 1인 비트 수 (popcount)
  size(): number;                     // 전체 비트 수
}
```

| 메서드 | 설명 | 반환값 |
|--------|------|--------|
| `set(index)` | 비트를 1로 설정 | `void` |
| `clear(index)` | 비트를 0으로 설정 | `void` |
| `get(index)` | 비트 값 조회 | `boolean` |
| `toggle(index)` | 비트 반전 | `void` |
| `count()` | 1인 비트 개수 | `number` |
| `size()` | 총 비트 수 | `number` |

## 제약 조건

- $1 \leq size \leq 10^6$ (비트 개수)
- $0 \leq index < size$ 가 유효 범위, 벗어나면 무시 / false 반환
- 시간 제한: 1초, 메모리 제한: 256 MB
- `constructor(size < 1)`는 `RangeError`를 던진다
- `Uint32Array`를 내부 저장소로 사용한다 (JavaScript 비트 연산 최적화)

## 문제 상세

**비트 주소 계산**:
```
wordIndex = index >>> 5     // Math.floor(index / 32)
bitIndex  = index & 31      // index % 32
mask      = 1 << bitIndex   // 해당 비트 마스크
```

**비트 연산 테이블**:
| 연산 | 코드 | 설명 |
|------|------|------|
| set | `words[w] \|= mask` | OR: 비트를 1로 |
| clear | `words[w] &= ~mask` | AND NOT: 비트를 0으로 |
| get | `(words[w] >>> b) & 1` | 해당 비트 추출 |
| toggle | `words[w] ^= mask` | XOR: 반전 |

**popcount (count 구현)**:
```
for word of words:
  n = word
  n = n - ((n >>> 1) & 0x55555555)
  n = (n & 0x33333333) + ((n >>> 2) & 0x33333333)
  n = (n + (n >>> 4)) & 0x0f0f0f0f
  count += (n * 0x01010101) >>> 24
```
이 비트 조작 트릭으로 32비트 워드 하나의 popcount를 O(1)에 계산한다.

**마지막 워드의 패딩**: size가 32의 배수가 아니면 마지막 워드에 여분의 비트가 있다. `set`이 이 영역을 건드리지 않는 한 문제없으나, count 시 이 비트들이 이미 0이므로 오차가 없다.

## 예시

```ts
const ba = new BitArray(100); // 100비트, 내부 Uint32Array(4) (32*4=128 슬롯)

ba.set(0);    // 비트 0을 1로
ba.set(31);   // 비트 31을 1로 (첫 번째 워드 마지막)
ba.set(32);   // 비트 32를 1로 (두 번째 워드 첫 번째)
ba.set(99);   // 비트 99를 1로 (마지막 워드)

ba.get(0);    // true
ba.get(1);    // false
ba.count();   // 4

ba.toggle(0); // 비트 0을 0으로
ba.count();   // 3

ba.clear(31);
ba.count();   // 2

ba.size();    // 100
```
