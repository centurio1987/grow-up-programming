export function solution(S: string, P: number[], Q: number[]): number[] {
  // TODO: implement
  const result: number[] = [];
  const prefixA: number[] = [];
  const prefixC: number[] = [];
  const prefixG: number[] = [];

  switch (S[0]) {
    case "A":
      prefixA.push(1);
      prefixC.push(0);
      prefixG.push(0);
      break;
    case "C":
      prefixC.push(1);
      prefixA.push(0);
      prefixG.push(0);
      break;
    case "G":
      prefixG.push(1);
      prefixC.push(0);
      prefixA.push(0);
      break;
    default:
      prefixG.push(0);
      prefixC.push(0);
      prefixA.push(0);
      break;
  }

  for (let i = 0; i < S.length - 1; i++) {
    if (S[i + 1] === "A") {
      prefixA.push(prefixA[i]! + 1);
      prefixC.push(prefixC[i]!);
      prefixG.push(prefixG[i]!);
    } else if (S[i + 1] === "C") {
      prefixC.push(prefixC[i]! + 1);
      prefixA.push(prefixA[i]!);
      prefixG.push(prefixG[i]!);
    } else if (S[i + 1] === "G") {
      prefixG.push(prefixG[i]! + 1);
      prefixA.push(prefixA[i]!);
      prefixC.push(prefixC[i]!);
    } else {
      prefixG.push(prefixG[i]!);
      prefixA.push(prefixA[i]!);
      prefixC.push(prefixC[i]!);
    }
  }

  for (let j = 0; j < P.length; j++) {
    const start = P[j]!;
    const end = Q[j]!;

    if (prefixA[end]! - (prefixA[start - 1] ?? 0) > 0) {
      result.push(1);
    } else if (prefixC[end]! - (prefixC[start - 1] ?? 0) > 0) {
      result.push(2);
    } else if (prefixG[end]! - (prefixG[start - 1] ?? 0) > 0) {
      result.push(3);
    } else {
      result.push(4);
    }
  }
  return result;
}
