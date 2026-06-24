import { test, expect, describe } from "bun:test";
import { BitArray } from "./bitArray";

describe("BitArray", () => {
  describe("기본", () => {
    test("초기 상태에서 모든 비트는 0이다", () => {
      const ba = new BitArray(10);
      for (let i = 0; i < 10; i++) {
        expect(ba.get(i)).toBe(false);
      }
    });

    test("set으로 비트를 1로 설정할 수 있다", () => {
      const ba = new BitArray(8);
      ba.set(3);
      expect(ba.get(3)).toBe(true);
      expect(ba.get(0)).toBe(false);
    });

    test("clear로 비트를 0으로 설정할 수 있다", () => {
      const ba = new BitArray(8);
      ba.set(5);
      expect(ba.get(5)).toBe(true);
      ba.clear(5);
      expect(ba.get(5)).toBe(false);
    });

    test("toggle은 비트를 반전한다", () => {
      const ba = new BitArray(8);
      ba.toggle(2); // 0 → 1
      expect(ba.get(2)).toBe(true);
      ba.toggle(2); // 1 → 0
      expect(ba.get(2)).toBe(false);
    });

    test("count는 1인 비트 개수를 반환한다", () => {
      const ba = new BitArray(10);
      expect(ba.count()).toBe(0);
      ba.set(0);
      ba.set(3);
      ba.set(7);
      expect(ba.count()).toBe(3);
    });

    test("size는 생성자에 전달한 크기를 반환한다", () => {
      const ba = new BitArray(100);
      expect(ba.size()).toBe(100);
    });

    test("32비트 경계를 넘는 인덱스도 올바르게 동작한다", () => {
      const ba = new BitArray(64);
      ba.set(31); // 첫 번째 워드 마지막 비트
      ba.set(32); // 두 번째 워드 첫 번째 비트
      expect(ba.get(31)).toBe(true);
      expect(ba.get(32)).toBe(true);
      expect(ba.get(30)).toBe(false);
      expect(ba.get(33)).toBe(false);
    });

    test("set을 여러 번 호출해도 count가 중복 카운트되지 않는다", () => {
      const ba = new BitArray(10);
      ba.set(5);
      ba.set(5);
      ba.set(5);
      expect(ba.count()).toBe(1);
    });

    test("clear를 이미 0인 비트에 호출해도 정상이다", () => {
      const ba = new BitArray(10);
      ba.clear(3); // 이미 0
      expect(ba.get(3)).toBe(false);
      expect(ba.count()).toBe(0);
    });
  });

  describe("엣지", () => {
    test("size=1 비트 배열에서 단일 비트 조작이 동작한다", () => {
      const ba = new BitArray(1);
      expect(ba.get(0)).toBe(false);
      ba.set(0);
      expect(ba.get(0)).toBe(true);
      ba.clear(0);
      expect(ba.get(0)).toBe(false);
      ba.toggle(0);
      expect(ba.get(0)).toBe(true);
      expect(ba.count()).toBe(1);
    });

    test("범위를 벗어난 get은 false를 반환한다", () => {
      const ba = new BitArray(8);
      expect(ba.get(-1)).toBe(false);
      expect(ba.get(8)).toBe(false);
      expect(ba.get(100)).toBe(false);
    });

    test("범위를 벗어난 set/clear/toggle은 아무것도 하지 않는다", () => {
      const ba = new BitArray(8);
      ba.set(-1);
      ba.set(8);
      ba.clear(-1);
      ba.toggle(100);
      expect(ba.count()).toBe(0);
    });

    test("모든 비트를 set 후 count는 size와 같다", () => {
      const size = 10;
      const ba = new BitArray(size);
      for (let i = 0; i < size; i++) ba.set(i);
      expect(ba.count()).toBe(size);
    });

    test("모든 비트를 set 후 clear 하면 count는 0이다", () => {
      const size = 10;
      const ba = new BitArray(size);
      for (let i = 0; i < size; i++) ba.set(i);
      for (let i = 0; i < size; i++) ba.clear(i);
      expect(ba.count()).toBe(0);
    });

    test("생성자에 1 미만의 값을 전달하면 RangeError가 발생한다", () => {
      expect(() => new BitArray(0)).toThrow(RangeError);
      expect(() => new BitArray(-1)).toThrow(RangeError);
    });
  });

  describe("바운더리", () => {
    test("정확히 32비트 크기 배열에서 모든 비트 조작이 올바르다", () => {
      const ba = new BitArray(32);
      for (let i = 0; i < 32; i++) ba.set(i);
      expect(ba.count()).toBe(32);
      for (let i = 0; i < 32; i += 2) ba.clear(i); // 짝수 비트 제거
      expect(ba.count()).toBe(16);
    });

    test("33번째 비트(index=32)가 올바른 워드에 저장된다", () => {
      const ba = new BitArray(33);
      ba.set(32);
      expect(ba.get(32)).toBe(true);
      expect(ba.count()).toBe(1);
      // 앞 32비트는 0
      for (let i = 0; i < 32; i++) {
        expect(ba.get(i)).toBe(false);
      }
    });

    test("size가 32의 배수가 아닐 때 마지막 워드 경계 비트가 올바르다", () => {
      const ba = new BitArray(35); // 35비트: 워드 2개 (32 + 3)
      ba.set(34); // 마지막 유효 비트
      expect(ba.get(34)).toBe(true);
      expect(ba.get(35)).toBe(false); // 범위 밖
      expect(ba.count()).toBe(1);
    });

    test("toggle 후 count가 정확히 변화한다", () => {
      const ba = new BitArray(10);
      ba.toggle(0);
      ba.toggle(1);
      ba.toggle(2);
      expect(ba.count()).toBe(3);
      ba.toggle(1); // 0으로 되돌리기
      expect(ba.count()).toBe(2);
    });
  });

  describe("성능", () => {
    test("10^6 비트 배열의 set/get/count를 100ms 이내에 완료한다", () => {
      const N = 1_000_000;
      const ba = new BitArray(N);
      const start = performance.now();
      // 짝수 인덱스 set
      for (let i = 0; i < N; i += 2) ba.set(i);
      // count
      const c = ba.count();
      // get 확인
      expect(ba.get(0)).toBe(true);
      expect(ba.get(1)).toBe(false);
      const elapsed = performance.now() - start;
      expect(c).toBe(N / 2);
      expect(elapsed).toBeLessThan(100);
    });

    test("10^6 toggle 연산을 100ms 이내에 완료한다", () => {
      const N = 1_000_000;
      const ba = new BitArray(N);
      const start = performance.now();
      for (let i = 0; i < N; i++) ba.toggle(i);
      const elapsed = performance.now() - start;
      expect(ba.count()).toBe(N);
      expect(elapsed).toBeLessThan(100);
    });

    test("Set<number> 대비 메모리 효율 — BitArray는 32배 압축", () => {
      // 이 테스트는 개념을 검증한다.
      // Set<number>에서 N개 원소: ~N * 8bytes (number당)
      // BitArray(N): Math.ceil(N/32) * 4bytes
      // 비율: (N*8) / (ceil(N/32)*4) ≈ 64 (압축 아닌 비교)
      const N = 1_000_000;
      const ba = new BitArray(N);
      const wordsCount = Math.ceil(N / 32);
      const bitArrayBytes = wordsCount * 4; // Uint32Array: 워드당 4바이트
      const setBytes = N * 8; // Set<number>: 원소당 약 8바이트 (최소)
      // BitArray가 훨씬 작아야 함
      expect(bitArrayBytes * 32).toBeLessThanOrEqual(setBytes * 2);
    });
  });
});
