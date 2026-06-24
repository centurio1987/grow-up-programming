import { test, expect, describe } from "bun:test";
import { ternarySearch } from "./ternarySearch";

describe("ternarySearch", () => {
  // 기본 동작 — 표준 단봉 함수 (x-3)^2 + 5 의 최솟점은 x=3
  test("f(x) = (x-3)^2 + 5 의 최솟점은 x=3 (구간 [-10,10])", () => {
    const f = (x: number) => (x - 3) ** 2 + 5;
    const x = ternarySearch(f, -10, 10, 1e-9);
    expect(x).toBeCloseTo(3, 6);
  });

  // 최솟점이 구간 내부의 다양한 위치
  test("f(x) = x^2 의 최솟점은 x=0", () => {
    const f = (x: number) => x * x;
    const x = ternarySearch(f, -100, 100, 1e-9);
    expect(x).toBeCloseTo(0, 6);
  });

  test("f(x) = (x+7)^2 의 최솟점은 x=-7", () => {
    const f = (x: number) => (x + 7) ** 2;
    const x = ternarySearch(f, -20, 20, 1e-9);
    expect(x).toBeCloseTo(-7, 6);
  });

  test("f(x) = (x - 1.5)^2 + 2 의 최솟점은 x=1.5", () => {
    const f = (x: number) => (x - 1.5) ** 2 + 2;
    const x = ternarySearch(f, 0, 10, 1e-9);
    expect(x).toBeCloseTo(1.5, 6);
  });

  // 다른 형태의 단봉 함수
  test("f(x) = |x - 2| 의 최솟점은 x=2", () => {
    const f = (x: number) => Math.abs(x - 2);
    const x = ternarySearch(f, -10, 10, 1e-9);
    expect(x).toBeCloseTo(2, 6);
  });

  test("f(x) = x^4 - 4x^3 + 6x^2 (최솟점 x=0)", () => {
    // f'(x) = 4x^3 - 12x^2 + 12x = 4x(x^2 - 3x + 3); 실근 x=0 만이 임계점
    const f = (x: number) => x ** 4 - 4 * x ** 3 + 6 * x * x;
    const x = ternarySearch(f, -5, 5, 1e-9);
    expect(x).toBeCloseTo(0, 6);
  });

  // 엣지 케이스 — 최솟점이 구간 경계 근처
  test("최솟점이 구간 좌측 끝 근처일 때 [0, 100], f(x) = (x-0.5)^2", () => {
    const f = (x: number) => (x - 0.5) ** 2;
    const x = ternarySearch(f, 0, 100, 1e-9);
    expect(x).toBeCloseTo(0.5, 6);
  });

  test("최솟점이 구간 우측 끝 근처일 때 [0, 100], f(x) = (x-99.5)^2", () => {
    const f = (x: number) => (x - 99.5) ** 2;
    const x = ternarySearch(f, 0, 100, 1e-9);
    expect(x).toBeCloseTo(99.5, 6);
  });

  // 바운더리 테스트 — 구간이 매우 작거나 큰 경우
  test("매우 좁은 구간 [2.999, 3.001] 에서도 최솟점 x=3 을 찾는다", () => {
    const f = (x: number) => (x - 3) ** 2 + 5;
    const x = ternarySearch(f, 2.999, 3.001, 1e-12);
    expect(x).toBeCloseTo(3, 6);
  });

  test("매우 큰 구간 [-1e6, 1e6] 에서도 최솟점 x=3 을 찾는다", () => {
    const f = (x: number) => (x - 3) ** 2 + 5;
    const x = ternarySearch(f, -1_000_000, 1_000_000, 1e-9);
    expect(x).toBeCloseTo(3, 6);
  });

  test("음수 영역만 포함하는 구간 [-100, -1] 에서 최솟점 x=-50", () => {
    const f = (x: number) => (x + 50) ** 2;
    const x = ternarySearch(f, -100, -1, 1e-9);
    expect(x).toBeCloseTo(-50, 6);
  });

  // 큰 ε 일 때 정확도는 ε 만큼만 보장
  test("epsilon=1e-3 일 때 결과는 최솟점에 대해 약 1e-3 이내", () => {
    const f = (x: number) => (x - 3) ** 2 + 5;
    const x = ternarySearch(f, -10, 10, 1e-3);
    expect(Math.abs(x - 3)).toBeLessThan(1e-2);
  });

  // 성능 테스트 — O(log(1/ε)) 이므로 ε=1e-9 도 매우 빠르다 (~50회 반복)
  test("epsilon=1e-9 정밀도를 100ms 이내에 처리한다", () => {
    const f = (x: number) => (x - 3) ** 2 + 5;

    const start = performance.now();
    // 1000번 호출해도 100ms 이내여야 한다 (호출당 ~50 step)
    let acc = 0;
    for (let i = 0; i < 1000; i++) {
      acc += ternarySearch(f, -10, 10, 1e-9);
    }
    const elapsed = performance.now() - start;

    expect(acc / 1000).toBeCloseTo(3, 6);
    expect(elapsed).toBeLessThan(100);
  });
});
