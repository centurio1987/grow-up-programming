import { test, expect, describe } from "bun:test";
import { CircularBuffer } from "./circularBuffer";

describe("CircularBuffer", () => {
  describe("기본", () => {
    test("write 후 read는 FIFO 순서로 반환한다", () => {
      const buf = new CircularBuffer<number>(3);
      buf.write(1);
      buf.write(2);
      buf.write(3);
      expect(buf.read()).toBe(1);
      expect(buf.read()).toBe(2);
      expect(buf.read()).toBe(3);
    });

    test("isFull은 용량이 꽉 찼을 때 true를 반환한다", () => {
      const buf = new CircularBuffer<number>(2);
      buf.write(1);
      expect(buf.isFull()).toBe(false);
      buf.write(2);
      expect(buf.isFull()).toBe(true);
    });

    test("isEmpty — 초기에 true, write 후 false", () => {
      const buf = new CircularBuffer<number>(3);
      expect(buf.isEmpty()).toBe(true);
      buf.write(1);
      expect(buf.isEmpty()).toBe(false);
    });

    test("size는 현재 아이템 개수를 반환한다", () => {
      const buf = new CircularBuffer<number>(5);
      expect(buf.size()).toBe(0);
      buf.write(1);
      buf.write(2);
      expect(buf.size()).toBe(2);
      buf.read();
      expect(buf.size()).toBe(1);
    });
  });

  describe("덮어쓰기 (overflow)", () => {
    test("꽉 찬 상태에서 write하면 가장 오래된 항목을 덮어쓴다", () => {
      const buf = new CircularBuffer<number>(3);
      buf.write(1);
      buf.write(2);
      buf.write(3);
      buf.write(4); // 1 덮어씀
      expect(buf.read()).toBe(2);
      expect(buf.read()).toBe(3);
      expect(buf.read()).toBe(4);
    });

    test("capacity=1에서 연속 write는 항상 마지막 값만 남긴다", () => {
      const buf = new CircularBuffer<number>(1);
      buf.write(10);
      buf.write(20);
      buf.write(30);
      expect(buf.read()).toBe(30);
    });
  });

  describe("엣지", () => {
    test("빈 버퍼에서 read는 undefined를 반환한다", () => {
      const buf = new CircularBuffer<number>(3);
      expect(buf.read()).toBeUndefined();
    });

    test("빈 버퍼에서 peek은 undefined를 반환한다", () => {
      const buf = new CircularBuffer<number>(3);
      expect(buf.peek()).toBeUndefined();
    });

    test("peek은 원소를 제거하지 않는다", () => {
      const buf = new CircularBuffer<number>(3);
      buf.write(42);
      expect(buf.peek()).toBe(42);
      expect(buf.size()).toBe(1);
    });

    test("read 후 다시 write하면 슬롯이 재사용된다", () => {
      const buf = new CircularBuffer<number>(2);
      buf.write(1);
      buf.write(2);
      buf.read();        // 슬롯 해제
      buf.write(3);      // 재사용
      expect(buf.read()).toBe(2);
      expect(buf.read()).toBe(3);
    });
  });

  describe("성능", () => {
    test("10^6 write/read를 200ms 이내에 처리한다", () => {
      const buf = new CircularBuffer<number>(1000);
      const N = 1_000_000;
      const start = performance.now();
      for (let i = 0; i < N; i++) buf.write(i);
      for (let i = 0; i < 1000; i++) buf.read();
      expect(performance.now() - start).toBeLessThan(200);
    });
  });
});
