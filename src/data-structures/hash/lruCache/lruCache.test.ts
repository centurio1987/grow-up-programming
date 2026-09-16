/**
 * `hash/lruCache` 계약 스위트 실행부(규약2).
 *
 * 무엇을 검사하는지는 `./lruCache.contract.ts` 에 있고, 계약 자체는 `./lruCache.ts` 헤더 한 곳이다.
 *
 * 대상이 둘이다. **스텁은 실패하는 것이 정상이고**(미구현) 정본은 통과해야 한다. 축3은 계측기가
 * 붙은 정본에만 돈다 — 학습자 스텁에 `__cost` 를 요구하지 않는다.
 *
 * 팩토리가 껍데기(`CacheSite`)를 씌우는 것은 이 구조가 용량을 생성자로 받기 때문이다
 * (`./lruCache.contract.ts` 머리말 — 불변 사실 83).
 *
 * 여기 남은 손으로 쓴 테스트는 **주입 정책**뿐이다. 계약 스위트는 키·값 타입 하나(`number`)로
 * 돌기 때문에(§규약2) 「펴기를 갈면 무엇이 갈리고 무엇이 안 갈리는가」, 「`number` 밖의 키에 펴기
 * 주입이 실제로 필수인가」, 「값으로 `null` 을 담으면 무엇이 구별되지 않고 무엇은 여전히 갈리는가」를
 * 담지 못한다.
 *
 * 벽시계 테스트는 두지 않는다(불변 사실 7). 고정 n 의 임계값이 재는 것은 복잡도 등급이 아니라 그
 * 기계의 상수다. 자리는 축3이다.
 */

import { describe, expect, test } from "bun:test";
import { runContract } from "../../_contract/runContract";
import { LRUCache as Reference } from "./_reference/lruCache";
import { LRUCache } from "./lruCache";
import {
  CacheSite,
  type LRUCacheContract,
  lruCacheContract,
} from "./lruCache.contract";

/** 축1이 도는 펴기. 정수 키를 그대로 돌려주므로 정보를 하나도 지우지 않는다. */
const identity = (key: number): number => key;

/** 학습자 구현. 계측기가 없으므로 축1·축2만 돈다. */
runContract(
  () =>
    new CacheSite(
      (capacity) => new LRUCache<number, number>(capacity, identity),
    ),
  lruCacheContract,
  { label: "스텁" },
);

/**
 * 정본. 펴기를 주입받는 구조라 하네스가 **밖에서** 호출 횟수를 셀 수 있다 — `__cost` 가 그 수보다
 * 작으면 자기 보고가 거짓이다(§규약2 계측).
 */
runContract(
  () =>
    new CacheSite(
      (capacity) => new Reference<number, number>(capacity, identity),
    ),
  lruCacheContract,
  {
    label: "정본",
    cost: {
      kind: "injected",
      make: (tick) =>
        new CacheSite(
          (capacity) =>
            new Reference<number, number>(capacity, (key) => {
              tick();
              return key;
            }),
        ),
    },
  },
);

/** 주입 정책은 계약의 일부다(규약1). 계약 스위트가 키 타입 하나로 도는 동안은 여기서 본다. */
function checkInjectionPolicy(
  label: string,
  make: <K, V>(
    capacity: number,
    spread: (key: K) => number,
  ) => LRUCacheContract<K, V>,
): void {
  describe(`LRUCache 주입 정책 [${label}]`, () => {
    test("펴기를 갈아도 답과 밀려나는 키는 갈리지 않는다 — 펴기가 정하는 것은 칸이지 의미가 아니다", () => {
      const straight = make<number, number>(8, (key) => key);
      const twisted = make<number, number>(8, (key) =>
        Math.imul(key, 0x9e37_79b1),
      );
      for (let key = 0; key < 30; key++) {
        straight.put(key, key * 3);
        twisted.put(key, key * 3);
        if (key % 3 === 0) {
          expect(straight.get(key - 4)).toBe(twisted.get(key - 4));
        }
      }
      for (let key = -5; key < 30; key++) {
        expect(straight.get(key)).toBe(twisted.get(key));
      }
    });

    test("키의 차이를 지우는 펴기를 줘도 답은 옳다 — 성립하지 않는 것은 상한뿐이다", () => {
      const erasing = make<number, number>(4, () => 0);
      for (let key = 1; key <= 4; key++) erasing.put(key, key * 10);
      expect(erasing.get(1)).toBe(10);
      erasing.put(5, 50);
      expect(erasing.get(2)).toBe(null);
      expect(erasing.get(1)).toBe(10);
      expect(erasing.get(5)).toBe(50);
    });

    test("number 밖의 키도 펴기를 주면 돈다", () => {
      const byChars = make<string, number>(2, (key) => {
        let spread = 0;
        for (let at = 0; at < key.length; at++) {
          spread = (Math.imul(spread, 31) + key.charCodeAt(at)) | 0;
        }
        return spread;
      });
      byChars.put("apple", 1);
      byChars.put("banana", 2);
      expect(byChars.get("apple")).toBe(1);
      byChars.put("fig", 3);
      expect(byChars.get("banana")).toBe(null);
      expect(byChars.get("apple")).toBe(1);
      expect(byChars.get("fig")).toBe(3);
    });

    test("값으로 null 을 담으면 get 이 없음과 구별되지 않지만, 맞은 get 은 여전히 그 키를 올린다", () => {
      const nullable = make<number, number | null>(2, identity);
      nullable.put(1, null);
      nullable.put(2, 20);
      // 둘 다 null 이다 — 답으로는 가를 수 없다.
      expect(nullable.get(1)).toBe(null);
      expect(nullable.get(9)).toBe(null);
      // 그런데 앞의 `get(1)` 은 맞은 물음이라 1 을 올렸고 `get(9)` 는 아무것도 안 바꿨다. 다음
      // 밀어내기가 그 차이를 드러낸다 — 밀려나는 것은 2 다.
      nullable.put(3, 30);
      expect(nullable.get(2)).toBe(null);
      expect(nullable.get(3)).toBe(30);
    });

    test("용량이 1 이상의 정수가 아니면 생성자가 RangeError 를 던진다", () => {
      for (const bad of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
        expect(() => make<number, number>(bad, identity)).toThrow(RangeError);
      }
    });
  });
}

checkInjectionPolicy(
  "정본",
  <K, V>(capacity: number, spread: (key: K) => number) =>
    new Reference<K, V>(capacity, spread),
);
