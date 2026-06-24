# DynamicArray (동적 배열)

## 한 줄 요약
> 내부 크기가 자동으로 조절되는 동적 배열을 더블링 전략으로 구현하라.

## 스토리

JavaScript의 `Array`는 개발자가 크기를 신경 쓰지 않아도 자동으로 늘어난다. 이것이 어떻게 가능할까? 내부에는 고정 크기의 메모리 블록이 있고, 원소가 가득 차면 2배 크기의 새 블록으로 전체를 복사한다. 이를 "더블링(doubling)" 또는 "배열 재할당"이라고 한다.

매번 복사하면 비싸 보이지만, 수학적으로 분석하면 n번의 push에 걸친 총 복사 횟수는 n + n/2 + n/4 + ... = 2n이다. 따라서 한 번 push의 분할 상환 비용은 O(1)이다. 이것이 amortized O(1)의 핵심이다.

반대로 원소가 줄어들 때는 너무 빨리 축소하면 "공간 낭비 → 축소 → push → 확장 → pop → 축소" 사이클(thrashing)이 발생할 수 있다. 그래서 `capacity / 4` 이하일 때만 절반으로 줄이는 전략을 쓴다.

## 함수 인터페이스

```ts
export class DynamicArray<T> {
  push(item: T): void;              // amortized O(1) — 뒤에 추가, 필요 시 2배 확장
  pop(): T | undefined;             // O(1) — 뒤에서 제거, 필요 시 절반 축소
  get(index: number): T | undefined; // O(1) — 인덱스 접근
  set(index: number, item: T): void; // O(1) — 인덱스 교체
  size(): number;                    // O(1) — 원소 개수
  capacity(): number;                // O(1) — 내부 배열 크기
  toArray(): T[];                    // O(n) — 복사 배열 반환
}
```

| 메서드 | 설명 | 반환값 |
|--------|------|--------|
| `push(item)` | 맨 뒤에 원소 추가 (확장 가능) | `void` |
| `pop()` | 맨 뒤 원소 제거 (축소 가능) | `T \| undefined` |
| `get(index)` | index번 원소 조회 | `T \| undefined` |
| `set(index, item)` | index번 원소 교체 | `void` |
| `size()` | 현재 원소 개수 | `number` |
| `capacity()` | 내부 배열 슬롯 개수 | `number` |
| `toArray()` | 원소 복사 배열 | `T[]` |

## 제약 조건

- $n \leq 10^5$ (push/pop 연산 횟수)
- 시간 제한: 1초, 메모리 제한: 256 MB
- 초기 `capacity = 4`
- `push` 시 `size > capacity` → `capacity *= 2`
- `pop` 시 `size <= capacity / 4` 이고 `capacity > 4` → `capacity /= 2`
- `get`/`set` 에서 인덱스가 `[0, size)` 범위를 벗어나면 각각 `undefined` 반환 / no-op

## 문제 상세

동적 배열의 핵심은 **분할 상환 분석(amortized analysis)**이다.

**더블링의 수학적 정당성**: n번 push 시 재할당이 발생하는 시점은 size가 4, 8, 16, ..., n에 도달할 때다. 재할당 시 복사하는 원소 수는 4 + 8 + 16 + ... + n ≤ 2n이다. 따라서 총 복사 비용은 O(n), push당 평균 O(1).

**Shrinking 전략의 이유**: `capacity / 2` 기준으로 축소하면, pop → push 반복 시 매번 재할당이 발생한다(thrashing). `capacity / 4` 기준을 쓰면 축소 직후 최소 `capacity / 4` 개의 push를 견딜 수 있어 thrashing이 방지된다.

**`toArray` 구현 주의**: `_data` 배열에는 `_size` 이후의 슬롯에 쓰레기 값이 있을 수 있다. `_data.slice(0, _size)`로 정확히 잘라야 한다.

## 예시

```ts
const arr = new DynamicArray<number>();
arr.capacity(); // 4

arr.push(1); arr.push(2); arr.push(3); arr.push(4);
arr.capacity(); // 4 (꽉 찼지만 아직 미초과)

arr.push(5);
arr.capacity(); // 8 (2배 확장)
arr.size();     // 5

arr.get(2);     // 3
arr.set(2, 99); // arr = [1, 2, 99, 4, 5]
arr.toArray();  // [1, 2, 99, 4, 5]

arr.pop(); // 5
arr.pop(); // 4
arr.pop(); // 99 → size=2, capacity=8 → 2 <= 8/4=2, capacity>4 → capacity=4
arr.capacity(); // 4
```
