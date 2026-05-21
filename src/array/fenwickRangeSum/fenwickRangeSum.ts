export type FenwickOp =
  | { type: "update"; i: number; v: number }
  | { type: "query"; l: number; r: number };

export function fenwickRangeSum(A: number[], ops: FenwickOp[]): number[] {
  throw new Error("Not implemented");
}
