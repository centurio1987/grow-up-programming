import { test, expect, describe } from "bun:test";
import { MedianFinder } from "./medianFromDataStream";

describe("MedianFinder", () => {
  // 기본 동작
  test("한 개 → 중앙값은 자기 자신", () => {
    const m = new MedianFinder();
    m.addNum(1);
    expect(m.findMedian()).toBe(1);
  });

  test("두 개 → 두 값의 평균", () => {
    const m = new MedianFinder();
    m.addNum(1);
    m.addNum(2);
    expect(m.findMedian()).toBe(1.5);
  });

  test("세 개 → 가운데 값", () => {
    const m = new MedianFinder();
    m.addNum(1);
    m.addNum(2);
    m.addNum(3);
    expect(m.findMedian()).toBe(2);
  });

  test("순서대로 [1,2,3,4,5] 삽입하며 중앙값 추적", () => {
    const m = new MedianFinder();
    m.addNum(1);
    expect(m.findMedian()).toBe(1);
    m.addNum(2);
    expect(m.findMedian()).toBe(1.5);
    m.addNum(3);
    expect(m.findMedian()).toBe(2);
    m.addNum(4);
    expect(m.findMedian()).toBe(2.5);
    m.addNum(5);
    expect(m.findMedian()).toBe(3);
  });

  // 엣지 케이스
  test("역순으로 삽입 [5,4,3,2,1]", () => {
    const m = new MedianFinder();
    m.addNum(5);
    expect(m.findMedian()).toBe(5);
    m.addNum(4);
    expect(m.findMedian()).toBe(4.5);
    m.addNum(3);
    expect(m.findMedian()).toBe(4);
    m.addNum(2);
    expect(m.findMedian()).toBe(3.5);
    m.addNum(1);
    expect(m.findMedian()).toBe(3);
  });

  test("중복 원소", () => {
    const m = new MedianFinder();
    m.addNum(2);
    m.addNum(2);
    m.addNum(2);
    expect(m.findMedian()).toBe(2);
    m.addNum(2);
    expect(m.findMedian()).toBe(2);
  });

  test("음수와 양수 혼합", () => {
    const m = new MedianFinder();
    m.addNum(-1);
    m.addNum(-2);
    m.addNum(-3);
    expect(m.findMedian()).toBe(-2);
    m.addNum(0);
    expect(m.findMedian()).toBe(-1.5);
  });

  // 바운더리 테스트
  test("최솟값/최댓값 경계", () => {
    const m = new MedianFinder();
    m.addNum(-1_000_000_000);
    m.addNum(1_000_000_000);
    expect(m.findMedian()).toBe(0);
  });

  test("음수만 들어온 경우", () => {
    const m = new MedianFinder();
    m.addNum(-5);
    m.addNum(-10);
    expect(m.findMedian()).toBe(-7.5);
  });

  // 성능 테스트 — O(log N) 삽입 N=100,000을 100ms 이내
  test("N=100,000 삽입을 100ms 이내에 처리한다", () => {
    const N = 100_000;
    const m = new MedianFinder();
    const start = performance.now();
    for (let i = 0; i < N; i++) {
      m.addNum(Math.floor(Math.random() * 2_000_000_001) - 1_000_000_000);
    }
    const median = m.findMedian();
    const elapsed = performance.now() - start;

    expect(typeof median).toBe("number");
    expect(elapsed).toBeLessThan(100);
  });
});
