/**
 * 원형 아이디어
 */
// export function enumerateSubmasks(mask: number): number[] {
//   const subMasks = [];
//   for (let i = mask; i > 0; i--) {
//     if ((mask & i) === i) {
//       subMasks.push(i);
//     }
//   }

//   subMasks.push(0);

//   return subMasks;
// }

/**
 * 최적 아이디어
 */
export function enumerateSubmasks(mask: number): number[] {
  let sub = mask;
  const subMasks = [mask];

  while (sub > 0) {
    const next = (sub - 1) & mask;
    subMasks.push(next);

    sub = next;
  }

  return subMasks;
}
