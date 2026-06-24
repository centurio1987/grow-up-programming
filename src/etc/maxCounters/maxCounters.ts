export function maxCounters(N: number, A: number[]): number[] {
  // TODO: implement
  // const counters = Array.from({ length: N }, () => 0);

  // let max = 0;
  // for (let elem of A) {
  //   if (1 <= elem && elem <= N) {
  //     counters[elem - 1] = counters[elem - 1]! + 1;
  //     if (max < counters[elem - 1]!) {
  //       max = counters[elem - 1]!;
  //     }
  //   } else if (elem === N + 1) {
  //     for (let i = 0; i < counters.length; i++) {
  //       counters[i] = max;
  //     }
  //   }
  // }

  // return counters;

  //Optimized
  let trackedMax = 0;
  let max = 0;
  const counter = Array.from({ length: N }, () => 0);

  for (let elem of A) {
    if (1 <= elem && elem <= N) {
      if (counter[elem - 1]! < max) {
        counter[elem - 1]! = max;
      }
      counter[elem - 1]!++;
      if (counter[elem - 1]! > trackedMax) {
        trackedMax = counter[elem - 1]!;
      }
    } else if (elem === N + 1) {
      max = trackedMax;
    } else {
      throw new Error();
    }
  }

  for (let idx in counter) {
    if (counter[idx]! < max) {
      counter[idx] = max;
    }
  }

  return counter;
}
