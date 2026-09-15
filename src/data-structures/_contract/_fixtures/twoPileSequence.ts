/**
 * 판정 도구 fixture — `linear/singlyLinkedList` 계약을 **넣는 자리를 두 무더기로 나눠** 지키는 구현.
 *
 * **결함이 아니다.** 이 계약을 지키는 정당한 구현이고, 계약이 `removeFirst` 를 `amortized` 로 적은
 * 근거를 실물로 재려고 둔다(불변 사실 196 의 「판정 도구」 쪽 — 흔한 실수가 아니다).
 *
 * 앞에 넣은 것은 앞 무더기 꼭대기에, 뒤에 넣은 것은 뒤 무더기 꼭대기에 쌓는다. 빼는데 앞 무더기가
 * 비었으면 뒤 무더기를 통째로 뒤집어 앞 무더기로 옮긴다. 뒤 끝에서 빼는 연산이 계약에 없으므로 앞
 * 무더기로 옮겨진 원소는 되돌아가지 않고, 원소마다 옮겨지는 횟수가 한 번이다 — 그래서 옮기는 호출
 * 하나는 담긴 수에 비례해도 n 회의 평균은 상수다. `worst` 로 적었다면 이 구현이 나간다.
 *
 * 계측 단위는 §규약2 계측 단위를 따른다 — 무더기 칸 하나를 지나갈 때마다 1. 옮기는 원소마다 1 을 센다.
 */
export class TwoPileSequence {
  /** 꼭대기(끝 칸)가 수열의 앞 끝이다. */
  #front: number[] = [];
  /** 꼭대기(끝 칸)가 수열의 뒤 끝이다. */
  #back: number[] = [];

  __cost = 0;

  prepend(value: number): void {
    this.__cost += 1;
    this.#front.push(value);
  }

  append(value: number): void {
    this.__cost += 1;
    this.#back.push(value);
  }

  removeFirst(): number | null {
    if (this.#front.length === 0) {
      // 뒤 무더기를 뒤집어 옮긴다. 뒤 무더기의 바닥(가장 먼저 뒤에 넣은 것)이 앞 무더기 꼭대기가 된다.
      while (this.#back.length > 0) {
        this.__cost += 1;
        this.#front.push(this.#back.pop() as number);
      }
    }
    if (this.#front.length === 0) return null;
    this.__cost += 1;
    return this.#front.pop() as number;
  }

  toArray(): number[] {
    const out: number[] = [];
    for (let at = this.#front.length - 1; at >= 0; at--) {
      this.__cost += 1;
      out.push(this.#front[at] as number);
    }
    for (const value of this.#back) {
      this.__cost += 1;
      out.push(value);
    }
    return out;
  }

  size(): number {
    this.__cost += 1;
    return this.#front.length + this.#back.length;
  }
}
