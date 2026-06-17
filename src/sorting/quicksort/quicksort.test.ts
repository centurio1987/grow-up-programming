import { test, expect } from "bun:test";
import { quickSort } from "./quicksort";

test("quicksort - 기본 테스트 케이스 1", () => {
  expect(quickSort([5, 2, 3, 1])).toEqual([1, 2, 3, 5]);
});

test("quicksort - 기본 테스트 케이스 2", () => {
  expect(quickSort([5, 1, 1, 2, 0, 0])).toEqual([0, 0, 1, 1, 2, 5]);
});

test("quicksort - 엣지 케이스: 빈 배열", () => {
  expect(quickSort([])).toEqual([]);
});

test("quicksort - 엣지 케이스: 하나의 요소", () => {
  expect(quickSort([1])).toEqual([1]);
});

test("quicksort - 엣지 케이스: 이미 정렬된 배열", () => {
  expect(quickSort([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
});

test("quicksort - 엣지 케이스: 역순으로 정렬된 배열", () => {
  expect(quickSort([5, 4, 3, 2, 1])).toEqual([1, 2, 3, 4, 5]);
});

test("quicksort - 엣지 케이스: 모든 요소가 같은 배열", () => {
  expect(quickSort([2, 2, 2, 2, 2])).toEqual([2, 2, 2, 2, 2]);
});

test("quicksort - 바운더리 테스트: 음수 포함", () => {
  expect(quickSort([-10, 5, -3, 0, 8, -1])).toEqual([-10, -3, -1, 0, 5, 8]);
});

test("quicksort - 성능 테스트: 50,000개의 무작위 데이터", () => {
  const size = 50000;
  const arr = Array.from({ length: size }, () => Math.floor(Math.random() * 100000) - 50000);
  const arrCopy = [...arr];
  
  const start = performance.now();
  quickSort(arr);
  const end = performance.now();
  
  arrCopy.sort((a, b) => a - b);
  expect(arr).toEqual(arrCopy);
  
  // 50,000개 데이터 정렬은 O(N log N) 시간에 완료되어야 함
  // 단순 연산 기준 초당 10^8 가능이므로 충분히 100ms 이내에 완료되어야 함
  expect(end - start).toBeLessThan(150); 
});

test("quicksort - 성능 테스트: 50,000개의 이미 정렬된 데이터 (최악의 경우 방지 확인)", () => {
  const size = 50000;
  const arr = Array.from({ length: size }, (_, i) => i);
  const arrCopy = [...arr];
  
  const start = performance.now();
  quickSort(arr);
  const end = performance.now();
  
  expect(arr).toEqual(arrCopy);
  
  // 피벗 선택이 최적화되지 않았다면 O(N^2)으로 수 초가 걸림.
  // 중간 피벗을 사용했으므로 O(N log N) 시간에 완료되어야 함.
  expect(end - start).toBeLessThan(150); 
});
