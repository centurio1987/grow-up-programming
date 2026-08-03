import { test, expect, describe } from "bun:test";
import { BinarySearchTree } from "./binarySearchTree";

describe("BinarySearchTree", () => {
  describe("기본", () => {
    test("insert 후 search는 true를 반환한다", () => {
      const bst = new BinarySearchTree();
      bst.insert(5);
      bst.insert(3);
      bst.insert(7);
      expect(bst.search(5)).toBe(true);
      expect(bst.search(3)).toBe(true);
      expect(bst.search(7)).toBe(true);
    });

    test("없는 키에 대해 search는 false를 반환한다", () => {
      const bst = new BinarySearchTree();
      bst.insert(5);
      expect(bst.search(99)).toBe(false);
    });

    test("inorder는 삽입 순서와 무관하게 오름차순으로 반환한다", () => {
      const bst = new BinarySearchTree();
      [5, 3, 7, 1, 4, 6, 8].forEach((k) => bst.insert(k));
      expect(bst.inorder()).toEqual([1, 3, 4, 5, 6, 7, 8]);
    });

    test("min / max는 가장 작은 / 큰 키를 반환한다", () => {
      const bst = new BinarySearchTree();
      [5, 3, 7, 1, 9].forEach((k) => bst.insert(k));
      expect(bst.min()).toBe(1);
      expect(bst.max()).toBe(9);
    });
  });

  describe("delete", () => {
    test("리프 노드 삭제", () => {
      const bst = new BinarySearchTree();
      [5, 3, 7].forEach((k) => bst.insert(k));
      bst.delete(3);
      expect(bst.search(3)).toBe(false);
      expect(bst.inorder()).toEqual([5, 7]);
    });

    test("자식 하나짜리 노드 삭제", () => {
      const bst = new BinarySearchTree();
      [5, 3, 7, 6].forEach((k) => bst.insert(k));
      bst.delete(7);
      expect(bst.search(7)).toBe(false);
      expect(bst.inorder()).toEqual([3, 5, 6]);
    });

    test("자식 둘짜리 노드 삭제 (in-order successor)", () => {
      const bst = new BinarySearchTree();
      [5, 3, 7, 6, 8].forEach((k) => bst.insert(k));
      bst.delete(7); // in-order successor = 8
      expect(bst.search(7)).toBe(false);
      expect(bst.inorder()).toEqual([3, 5, 6, 8]);
    });

    test("루트 삭제", () => {
      const bst = new BinarySearchTree();
      [5, 3, 7].forEach((k) => bst.insert(k));
      bst.delete(5);
      expect(bst.search(5)).toBe(false);
      expect(bst.inorder()).toEqual([3, 7]);
    });

    test("없는 키 삭제는 에러 없이 무시한다", () => {
      const bst = new BinarySearchTree();
      bst.insert(5);
      expect(() => bst.delete(99)).not.toThrow();
      expect(bst.inorder()).toEqual([5]);
    });
  });

  describe("엣지", () => {
    test("빈 트리에서 min / max는 null을 반환한다", () => {
      const bst = new BinarySearchTree();
      expect(bst.min()).toBeNull();
      expect(bst.max()).toBeNull();
    });

    test("중복 삽입은 무시된다", () => {
      const bst = new BinarySearchTree();
      bst.insert(5);
      bst.insert(5);
      bst.insert(5);
      expect(bst.inorder()).toEqual([5]);
    });

    test("빈 트리의 inorder는 빈 배열을 반환한다", () => {
      const bst = new BinarySearchTree();
      expect(bst.inorder()).toEqual([]);
    });

    test("오름차순으로 삽입해도 search/inorder가 올바르다", () => {
      const bst = new BinarySearchTree();
      for (let i = 1; i <= 5; i++) bst.insert(i);
      expect(bst.inorder()).toEqual([1, 2, 3, 4, 5]);
      expect(bst.search(3)).toBe(true);
    });
  });

  describe("왼쪽으로 치우친 모양", () => {
    test("왼쪽 자식만 가진 내부 노드가 있어도 inorder에 중복이 없다", () => {
      // 50은 왼쪽 자식(30)만 갖고, 50을 방문하는 시점에 조상 100이 아직 남아 있다.
      const bst = new BinarySearchTree();
      [100, 50, 30, 200].forEach((k) => bst.insert(k));
      expect(bst.inorder()).toEqual([30, 50, 100, 200]);
    });

    test("내림차순으로 삽입해도 inorder가 올바르다", () => {
      const bst = new BinarySearchTree();
      [5, 4, 3, 2, 1].forEach((k) => bst.insert(k));
      expect(bst.inorder()).toEqual([1, 2, 3, 4, 5]);
      expect(bst.min()).toBe(1);
      expect(bst.max()).toBe(5);
    });

    test("왼쪽으로 완전히 치우친 트리의 inorder 길이는 노드 수와 같다", () => {
      // 순회가 방문한 서브트리로 되돌아가면 출력 길이가 노드 수를 초과한다.
      // N=20이면 그런 구현에서 출력이 2^19개까지 늘어나 길이 비교로 즉시 검출된다.
      const N = 20;
      const bst = new BinarySearchTree();
      for (let i = N; i >= 1; i--) bst.insert(i);

      const result = bst.inorder();
      expect(result).toHaveLength(N);
      expect(result).toEqual(Array.from({ length: N }, (_, i) => i + 1));
    });

    test("왼쪽으로 치우친 트리에서 삭제 후에도 inorder가 올바르다", () => {
      const bst = new BinarySearchTree();
      [5, 4, 3, 2, 1].forEach((k) => bst.insert(k));
      bst.delete(3);
      expect(bst.inorder()).toEqual([1, 2, 4, 5]);
      bst.delete(5);
      expect(bst.inorder()).toEqual([1, 2, 4]);
    });
  });

  describe("delete — 부모가 오른쪽 자식을 갖지 않는 경우", () => {
    test("왼쪽 리프를 삭제한다", () => {
      const bst = new BinarySearchTree();
      [50, 30].forEach((k) => bst.insert(k));
      bst.delete(30);
      expect(bst.search(30)).toBe(false);
      expect(bst.inorder()).toEqual([50]);
    });

    test("왼쪽 자식만 가진 노드를 삭제한다", () => {
      const bst = new BinarySearchTree();
      [50, 30, 20].forEach((k) => bst.insert(k));
      bst.delete(30);
      expect(bst.search(30)).toBe(false);
      expect(bst.inorder()).toEqual([20, 50]);
    });

    test("왼쪽 자식만 가진 루트를 삭제한다", () => {
      const bst = new BinarySearchTree();
      [50, 30].forEach((k) => bst.insert(k));
      bst.delete(50);
      expect(bst.search(50)).toBe(false);
      expect(bst.inorder()).toEqual([30]);
      expect(bst.min()).toBe(30);
      expect(bst.max()).toBe(30);
    });

    test("후계자가 오른쪽 서브트리의 깊은 왼쪽에 있는 노드를 삭제한다", () => {
      // 50의 후계자는 55이고, 55의 부모 60은 오른쪽 자식을 갖지 않는다.
      const bst = new BinarySearchTree();
      [50, 30, 70, 60, 55].forEach((k) => bst.insert(k));
      bst.delete(50);
      expect(bst.search(50)).toBe(false);
      expect(bst.inorder()).toEqual([30, 55, 60, 70]);
    });

    test("후계자가 오른쪽 자식을 가진 경우에도 삭제한다", () => {
      // 50의 후계자는 55이고, 55는 오른쪽 자식 57을 갖는다.
      const bst = new BinarySearchTree();
      [50, 30, 70, 60, 55, 57].forEach((k) => bst.insert(k));
      bst.delete(50);
      expect(bst.search(50)).toBe(false);
      expect(bst.inorder()).toEqual([30, 55, 57, 60, 70]);
    });

    test("단일 노드 트리에서 루트를 삭제한 뒤 다시 삽입할 수 있다", () => {
      const bst = new BinarySearchTree();
      bst.insert(50);
      bst.delete(50);
      expect(bst.inorder()).toEqual([]);
      expect(bst.min()).toBeNull();
      bst.insert(7);
      expect(bst.inorder()).toEqual([7]);
    });
  });

  describe("전수 검증", () => {
    /** items의 모든 순열을 생성한다. */
    function* permutations(items: readonly number[]): Generator<number[]> {
      if (items.length <= 1) {
        yield [...items];
        return;
      }
      for (let i = 0; i < items.length; i++) {
        const rest = [...items.slice(0, i), ...items.slice(i + 1)];
        for (const tail of permutations(rest)) yield [items[i]!, ...tail];
      }
    }

    // 삽입 순열을 모두 돌리면 크기 n 이하의 모든 BST 모양이 빠짐없이 생성된다.
    test("n<=6의 모든 삽입 순열에서 삽입 직후 상태가 올바르다", () => {
      for (let n = 1; n <= 6; n++) {
        const keys = Array.from({ length: n }, (_, i) => (i + 1) * 10);
        for (const order of permutations(keys)) {
          const bst = new BinarySearchTree();
          order.forEach((k) => bst.insert(k));

          try {
            expect(bst.inorder()).toEqual(keys);
            expect(bst.min()).toBe(keys[0] ?? null);
            expect(bst.max()).toBe(keys[n - 1] ?? null);
            for (const k of keys) expect(bst.search(k)).toBe(true);
            expect(bst.search(5)).toBe(false);
          } catch (error) {
            throw new Error(
              `삽입 순서 ${JSON.stringify(order)}: ${(error as Error).message}`
            );
          }
        }
      }
    });

    test("n<=6의 모든 삽입 순열에서 임의의 키 하나를 삭제한 결과가 올바르다", () => {
      for (let n = 1; n <= 6; n++) {
        const keys = Array.from({ length: n }, (_, i) => (i + 1) * 10);
        for (const order of permutations(keys)) {
          for (const target of keys) {
            const bst = new BinarySearchTree();
            order.forEach((k) => bst.insert(k));
            const remaining = keys.filter((k) => k !== target);

            try {
              bst.delete(target);
              expect(bst.inorder()).toEqual(remaining);
              expect(bst.search(target)).toBe(false);
              for (const k of remaining) expect(bst.search(k)).toBe(true);
              expect(bst.min()).toBe(remaining[0] ?? null);
              expect(bst.max()).toBe(remaining[remaining.length - 1] ?? null);
            } catch (error) {
              throw new Error(
                `삽입 순서 ${JSON.stringify(order)}, delete(${target}): ${(error as Error).message}`
              );
            }
          }
        }
      }
    });

    test("n<=4의 모든 삽입 순열 x 모든 삭제 순서에서 트리가 끝까지 올바르다", () => {
      for (let n = 1; n <= 4; n++) {
        const keys = Array.from({ length: n }, (_, i) => (i + 1) * 10);
        for (const order of permutations(keys)) {
          for (const deleteOrder of permutations(keys)) {
            const bst = new BinarySearchTree();
            order.forEach((k) => bst.insert(k));
            const remaining = new Set(keys);

            for (const target of deleteOrder) {
              bst.delete(target);
              remaining.delete(target);
              const expected = [...remaining].sort((a, b) => a - b);

              try {
                expect(bst.inorder()).toEqual(expected);
                expect(bst.min()).toBe(expected[0] ?? null);
                expect(bst.max()).toBe(expected[expected.length - 1] ?? null);
              } catch (error) {
                throw new Error(
                  `삽입 순서 ${JSON.stringify(order)}, 삭제 순서 ${JSON.stringify(deleteOrder)}, delete(${target})까지: ${(error as Error).message}`
                );
              }
            }
          }
        }
      }
    });
  });

  describe("무작위 대조", () => {
    /** 실패를 재현할 수 있도록 시드를 고정한 난수 생성기(xorshift32)를 쓴다. */
    function createRandom(seed: number): () => number {
      let state = seed >>> 0;
      return () => {
        state ^= state << 13;
        state >>>= 0;
        state ^= state >>> 17;
        state ^= state << 5;
        state >>>= 0;
        return state / 0x1_0000_0000;
      };
    }

    test("insert/delete를 무작위로 섞어도 Set 모델과 항상 일치한다", () => {
      const random = createRandom(20260730);

      for (let trial = 0; trial < 200; trial++) {
        const bst = new BinarySearchTree();
        const model = new Set<number>();
        const history: string[] = [];

        for (let op = 0; op < 30; op++) {
          const key = Math.floor(random() * 20);
          if (random() < 0.55) {
            history.push(`insert(${key})`);
            bst.insert(key);
            model.add(key);
          } else {
            history.push(`delete(${key})`);
            bst.delete(key);
            model.delete(key);
          }

          const expected = [...model].sort((a, b) => a - b);

          try {
            expect(bst.inorder()).toEqual(expected);
            for (const k of model) expect(bst.search(k)).toBe(true);
            if (expected.length === 0) {
              expect(bst.min()).toBeNull();
              expect(bst.max()).toBeNull();
            } else {
              expect(bst.min()).toBe(expected[0] ?? null);
              expect(bst.max()).toBe(expected[expected.length - 1] ?? null);
            }
          } catch (error) {
            throw new Error(
              `재현 연산열: ${history.join(" ")}\n${(error as Error).message}`
            );
          }
        }
      }
    });
  });

  describe("성능", () => {
    test("무작위 순서 10^4 insert/search를 100ms 이내에 처리한다", () => {
      const bst = new BinarySearchTree();
      const N = 10_000;
      const keys = Array.from({ length: N }, (_, i) => i + 1).sort(
        () => Math.random() - 0.5
      );
      const start = performance.now();
      for (const k of keys) bst.insert(k);
      for (const k of keys) expect(bst.search(k)).toBe(true);
      expect(performance.now() - start).toBeLessThan(100);
    });
  });
});
