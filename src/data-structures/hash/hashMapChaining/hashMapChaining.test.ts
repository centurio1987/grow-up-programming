/**
 * `hash/hashMapChaining` 계약 스위트 실행부(규약2).
 *
 * 무엇을 검사하는지는 `./hashMapChaining.contract.ts` 에 있고, 계약 자체는
 * `./hashMapChaining.ts` 헤더 한 곳이다.
 *
 * 대상이 둘이다. **스텁은 실패하는 것이 정상이고**(미구현) 정본은 통과해야 한다.
 * 축3은 계측기가 붙은 정본에만 돈다 — 학습자 스텁에 `__cost` 를 요구하지 않는다.
 *
 * 여기 남은 손으로 쓴 테스트는 **주입 정책**뿐이다. 계약 스위트는 키 타입 하나(`number`)로
 * 돌기 때문에(§규약2) 「펴기를 갈면 무엇이 갈리고 무엇이 안 갈리는가」와 「`number` 밖의
 * 키에 펴기 주입이 실제로 필수인가」를 담지 못한다.
 *
 * 벽시계 테스트는 두지 않는다(불변 사실 7). 고정 n 의 임계값이 재는 것은 복잡도 등급이
 * 아니라 그 기계의 상수다. 자리는 축3이다.
 */

import { describe, expect, test } from "bun:test";
import { runContract } from "../../_contract/runContract";
import { HashMapChaining as Reference } from "./_reference/hashMapChaining";
import { HashMapChaining } from "./hashMapChaining";
import {
  type HashMapChainingContract,
  hashMapChainingContract,
} from "./hashMapChaining.contract";

/** 축1·축2가 도는 펴기. 정수 키를 그대로 돌려주므로 정보를 하나도 지우지 않는다. */
const identity = (key: number): number => key;

/** 학습자 구현. 계측기가 없으므로 축1·축2만 돈다. */
runContract(
  () => new HashMapChaining<number, number>(identity),
  hashMapChainingContract,
  { label: "스텁" },
);

/**
 * 정본. 펴기를 주입받는 구조라 하네스가 **밖에서** 호출 횟수를 셀 수 있다 —
 * `__cost` 가 그 수보다 작으면 자기 보고가 거짓이다(§규약2 계측).
 */
runContract(
  () => new Reference<number, number>(identity),
  hashMapChainingContract,
  {
    label: "정본",
    cost: {
      kind: "injected",
      make: (tick) =>
        new Reference<number, number>((key) => {
          tick();
          return key;
        }),
    },
  },
);

/**
 * 주입 정책은 계약의 일부다(규약1). 계약 스위트가 키 타입 하나로 도는 동안은 여기서 본다.
 */
function checkInjectionPolicy(
  label: string,
  make: <K, V>(spread: (key: K) => number) => HashMapChainingContract<K, V>,
): void {
  describe(`HashMapChaining 주입 정책 [${label}]`, () => {
    test("펴기를 갈아도 답은 갈리지 않는다 — 펴기가 정하는 것은 자리이지 의미가 아니다", () => {
      const straight = make<number, string>((key) => key);
      const twisted = make<number, string>((key) =>
        Math.imul(key, 0x9e37_79b1),
      );
      for (let key = 0; key < 50; key++) {
        straight.set(key, `v${key}`);
        twisted.set(key, `v${key}`);
      }
      expect(straight.keys().length).toBe(twisted.keys().length);
      expect([...straight.keys()].sort((a, b) => a - b)).toEqual(
        [...twisted.keys()].sort((a, b) => a - b),
      );
      for (let key = 0; key < 50; key++) {
        expect(straight.get(key)).toBe(twisted.get(key));
      }
    });

    test("키의 차이를 지우는 펴기를 줘도 답은 옳다 — 무너지는 것은 상한뿐이다", () => {
      const erasing = make<number, number>(() => 0);
      for (let key = 0; key < 40; key++) erasing.set(key, key * 2);
      expect(erasing.keys().length).toBe(40);
      expect(erasing.get(17)).toBe(34);
      expect(erasing.has(40)).toBe(false);
      expect(erasing.delete(17)).toBe(true);
      expect(erasing.get(17)).toBe(null);
      expect(erasing.keys().length).toBe(39);
    });

    test("number 밖의 키도 펴기를 주면 돈다", () => {
      const byChars = make<string, number>((key) => {
        let spread = 0;
        for (let at = 0; at < key.length; at++) {
          spread = (Math.imul(spread, 31) + key.charCodeAt(at)) | 0;
        }
        return spread;
      });
      byChars.set("banana", 1);
      byChars.set("apple", 2);
      byChars.set("banana", 3);
      expect(byChars.keys().length).toBe(2);
      expect(byChars.get("banana")).toBe(3);
      expect(byChars.get("fig")).toBe(null);
      expect([...byChars.keys()].sort()).toEqual(["apple", "banana"]);
    });

    test("값으로 null 을 담으면 get 이 대응 없음과 구별되지 않는다 — 정본은 has 다", () => {
      const nullable = make<number, number | null>(identity);
      nullable.set(1, null);
      expect(nullable.get(1)).toBe(null);
      expect(nullable.get(2)).toBe(null);
      // 갈리는 자리는 `has` 하나다. 계약이 그 사실을 주입 정책에 적고 있다.
      expect(nullable.has(1)).toBe(true);
      expect(nullable.has(2)).toBe(false);
      expect(nullable.keys().length).toBe(1);
    });
  });
}

checkInjectionPolicy(
  "정본",
  <K, V>(spread: (key: K) => number) => new Reference<K, V>(spread),
);
