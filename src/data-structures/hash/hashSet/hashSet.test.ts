/**
 * `hash/hashSet` 계약 스위트 실행부(규약2).
 *
 * 무엇을 검사하는지는 `./hashSet.contract.ts` 에 있고, 계약 자체는 `./hashSet.ts` 헤더 한
 * 곳이다.
 *
 * 대상이 둘이다. **스텁은 실패하는 것이 정상이고**(미구현) 정본은 통과해야 한다. 축3은
 * 계측기가 붙은 정본에만 돈다 — 학습자 스텁에 `__cost` 를 요구하지 않는다.
 *
 * 여기 남은 손으로 쓴 테스트는 **주입 정책**뿐이다. 계약 스위트는 원소 타입 하나(`number`)로
 * 돌기 때문에(§규약2) 「펴기를 갈면 무엇이 갈리고 무엇이 안 갈리는가」와 「`number` 밖의
 * 원소에 펴기 주입이 실제로 필수인가」를 담지 못한다. **두 피연산자가 서로 다른 펴기를 써도
 * 된다**는 조항도 계약 스위트가 담지 못하는 자리다 — 껍데기가 세 집합을 같은 팩토리로 짓기
 * 때문이다.
 *
 * 벽시계 테스트는 두지 않는다(불변 사실 7). 고정 n 의 임계값이 재는 것은 복잡도 등급이
 * 아니라 그 기계의 상수다. 자리는 축3이다.
 */

import { describe, expect, test } from "bun:test";
import { runContract } from "../../_contract/runContract";
import { HashSet as Reference } from "./_reference/hashSet";
import { HashSet } from "./hashSet";
import {
  type HashSetContract,
  hashSetContract,
  SetPair,
} from "./hashSet.contract";

/** 축1·축2가 도는 펴기. 정수 원소를 그대로 돌려주므로 정보를 하나도 지우지 않는다. */
const identity = (item: number): number => item;

/** 학습자 구현. 계측기가 없으므로 축1·축2만 돈다. */
runContract(
  () => new SetPair<number>(() => new HashSet<number>(identity)),
  hashSetContract,
  { label: "스텁" },
);

/**
 * 정본. 펴기를 주입받는 구조라 하네스가 **밖에서** 호출 횟수를 셀 수 있다 —
 * `__cost` 가 그 수보다 작으면 자기 보고가 거짓이다(§규약2 계측).
 */
runContract(
  () => new SetPair<number>(() => new Reference<number>(identity)),
  hashSetContract,
  {
    label: "정본",
    cost: {
      kind: "injected",
      make: (tick) =>
        new SetPair<number>(
          () =>
            new Reference<number>((item) => {
              tick();
              return item;
            }),
        ),
    },
  },
);

/**
 * 주입 정책은 계약의 일부다(규약1). 계약 스위트가 원소 타입 하나로 도는 동안은 여기서 본다.
 */
function checkInjectionPolicy(
  label: string,
  make: <T>(spread: (item: T) => number) => HashSetContract<T>,
): void {
  describe(`HashSet 주입 정책 [${label}]`, () => {
    test("펴기를 갈아도 답은 갈리지 않는다 — 펴기가 정하는 것은 자리이지 의미가 아니다", () => {
      const straight = make<number>((item) => item);
      const twisted = make<number>((item) => Math.imul(item, 0x9e37_79b1));
      for (let value = 0; value < 50; value++) {
        straight.add(value);
        twisted.add(value);
      }
      expect(straight.size()).toBe(twisted.size());
      expect([...straight.values()].sort((a, b) => a - b)).toEqual(
        [...twisted.values()].sort((a, b) => a - b),
      );
      for (let value = 0; value < 50; value++) {
        expect(straight.has(value)).toBe(twisted.has(value));
      }
    });

    test("두 피연산자가 서로 다른 펴기를 써도 세 연산의 답이 같다", () => {
      const left = make<number>((item) => item);
      const right = make<number>((item) => Math.imul(item, 0x9e37_79b1));
      for (let value = 0; value < 30; value++) left.add(value);
      for (let value = 15; value < 45; value++) right.add(value);

      const union = left.union(right);
      const intersection = left.intersection(right);
      const difference = left.difference(right);

      expect(union.size()).toBe(45);
      expect(intersection.size()).toBe(15);
      expect(difference.size()).toBe(15);
      expect(intersection.has(20)).toBe(true);
      expect(difference.has(20)).toBe(false);
      expect(difference.has(3)).toBe(true);
      expect(union.has(44)).toBe(true);
    });

    test("원소의 차이를 지우는 펴기를 줘도 답은 옳다 — 무너지는 것은 상한뿐이다", () => {
      const erasing = make<number>(() => 0);
      for (let value = 0; value < 40; value++) erasing.add(value);
      expect(erasing.size()).toBe(40);
      expect(erasing.has(17)).toBe(true);
      expect(erasing.has(40)).toBe(false);
      expect(erasing.delete(17)).toBe(true);
      expect(erasing.has(17)).toBe(false);
      expect(erasing.size()).toBe(39);
    });

    test("number 밖의 원소도 펴기를 주면 돈다", () => {
      const byChars = make<string>((item) => {
        let spread = 0;
        for (let at = 0; at < item.length; at++) {
          spread = (Math.imul(spread, 31) + item.charCodeAt(at)) | 0;
        }
        return spread;
      });
      const other = make<string>((item) => item.length);

      byChars.add("banana");
      byChars.add("apple");
      byChars.add("banana");
      other.add("apple");
      other.add("fig");

      expect(byChars.size()).toBe(2);
      expect(byChars.has("fig")).toBe(false);
      expect([...byChars.values()].sort()).toEqual(["apple", "banana"]);
      expect([...byChars.intersection(other).values()]).toEqual(["apple"]);
      expect([...byChars.difference(other).values()]).toEqual(["banana"]);
      expect([...byChars.union(other).values()].sort()).toEqual([
        "apple",
        "banana",
        "fig",
      ]);
    });

    test("돌려준 집합은 피연산자와 독립이다 — 뒤에 어느 쪽을 고쳐도 안 바뀐다", () => {
      const left = make<number>(identity);
      const right = make<number>(identity);
      left.add(1);
      left.add(2);
      right.add(2);
      right.add(3);

      const union = left.union(right);
      const intersection = left.intersection(right);
      const difference = left.difference(right);

      left.add(9);
      right.add(8);
      left.delete(1);
      right.delete(2);

      expect(union.size()).toBe(3);
      expect(union.has(9)).toBe(false);
      expect(union.has(8)).toBe(false);
      expect(union.has(1)).toBe(true);
      expect(intersection.size()).toBe(1);
      expect(intersection.has(2)).toBe(true);
      expect(difference.size()).toBe(1);
      expect(difference.has(1)).toBe(true);

      // 반대 방향도 본다 — 결과를 고쳐도 피연산자가 안 바뀐다.
      union.add(100);
      expect(left.has(100)).toBe(false);
      expect(right.has(100)).toBe(false);
    });
  });
}

checkInjectionPolicy(
  "정본",
  <T>(spread: (item: T) => number) => new Reference<T>(spread),
);
