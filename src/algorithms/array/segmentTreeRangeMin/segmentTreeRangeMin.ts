export type SegOp =
  | { type: "update"; i: number; v: number }
  | { type: "query"; l: number; r: number };

export function segmentTreeRangeMin(A: number[], ops: SegOp[]): number[] {
  throw new Error("Not implemented");
}
