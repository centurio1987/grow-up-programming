/**
 * 결함 fixture — 용량을 받아 두고도 **아무것도 밀어내지 않는** 캐시.
 *
 * 대상 계약: `hash/lruCache`.
 *
 * **축1이 혼자 잡는 결함 fixture 다**(`_fixtures/unboundedRingBuffer.ts` 가 `linear/circularBuffer` 에서
 * 낸 자리의 사전판 · 불변 사실 182). 두 행의 시간 상한을 전부 지키면서 계약을 어긴다 — 맞은 `get`
 * 과 `put` 이 호출 하나당 상수다. 어기는 자리는 비용이 아니라 **용량 경계의 의미**다: 담긴 수가
 * 용량에 닿은 뒤 새 키를 넣어도 가장 오래 안 쓴 키가 남아 있어, 그 키를 묻는 `get` 이 `null` 대신
 * 값을 돌려준다.
 *
 * 이것이 헤더 「목적」이 적은 판별(불변 사실 67 · T5-01 절차 ③)의 실물이다 — 용량 제약은 저장량을
 * 거치지 않고 **`put` 행의 밀어내기와 `get` 행의 `null`** 로 계약에 들어오고, 그 제약을 무시하는
 * 구현을 그 제약이 사는 축(의미 → 축1)이 갈라낸다. 이 구현은 사전 계약(`hash/hashMapChaining`)의
 * `set`·`get` 두 행을 그대로 지키는 모양이다.
 *
 * 축3 계측 단위는 정본과 같다 — *"단위 하나를 지나갈 때마다 1"*(§규약2 계측 단위). `Map` 조회
 * 하나를 1 로 센다.
 */

export class UnboundedCache<K, V> {
  readonly #entries = new Map<K, V>();

  __cost = 0;

  constructor(capacity: number, _spread: (key: K) => number) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new RangeError(
        `용량은 1 이상의 정수여야 한다 — 받은 값은 ${capacity} 이다`,
      );
    }
  }

  get(key: K): V | null {
    this.__cost += 1;
    if (!this.#entries.has(key)) return null;
    return this.#entries.get(key) as V;
  }

  put(key: K, value: V): void {
    // 경계를 보지 않는다. 이 한 줄이 계약을 어기는 전부이고, 비용은 여전히 상수다.
    this.__cost += 1;
    this.#entries.set(key, value);
  }
}
