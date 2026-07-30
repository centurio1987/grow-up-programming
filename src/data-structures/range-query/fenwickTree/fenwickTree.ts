export class FenwickTree {
  private arr: number[];
  constructor(n: number) {
    this.arr = Array.from({ length: n + 1 }, () => 0);
  }

  update(i: number, delta: number): void {
    let idx = i;

    while (idx < this.arr.length) {
      this.arr[idx]! += delta;
      idx += idx & -idx;
    }
  }

  prefixSum(i: number): number {
    let idx = i;

    let sum = 0;

    while (idx > 0) {
      sum += this.arr[idx]!;
      idx -= idx & -idx;
    }

    return sum;
  }

  rangeSum(l: number, r: number): number {
    return this.prefixSum(r) - this.prefixSum(l - 1);
  }
}
