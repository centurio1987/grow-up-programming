// E3 자기 검증: fenwickTree-study-guide.mdx 본문 코드 추출본. 가이드 수치의 실측 근거.
class FenwickTree {
  private tree: number[];
  private n: number;
  constructor(n: number) { this.n = n; this.tree = new Array(n + 1).fill(0); }
  update(i: number, delta: number): void { for (; i <= this.n; i += i & -i) this.tree[i] += delta; }
  prefixSum(i: number): number { let s = 0; for (; i > 0; i -= i & -i) s += this.tree[i]; return s; }
  rangeSum(l: number, r: number): number { return this.prefixSum(r) - this.prefixSum(l - 1); }
}
// 본문 예시: A[1..8] = [3,2,-1,6,5,4,-3,3], update(3,+2), rangeSum(3,7)
const A = [0, 3, 2, -1, 6, 5, 4, -3, 3];
const ft = new FenwickTree(8);
for (let i = 1; i <= 8; i++) ft.update(i, A[i]!);
ft.update(3, 2); // A[3]: -1 → 1
const got = ft.rangeSum(3, 7);
console.log("rangeSum(3,7) =", got, "(본문 주장: 13)", got === 13 ? "✓" : "✗ MISMATCH");
// 브루트포스 교차검증
const A2 = A.slice(); A2[3]! += 2;
let bf = 0; for (let i = 3; i <= 7; i++) bf += A2[i]!;
console.log("brute-force =", bf, bf === got ? "✓ 일치" : "✗");
console.log("prefixSum(7)=", ft.prefixSum(7), "prefixSum(2)=", ft.prefixSum(2), "(본문: 18, 5)");
