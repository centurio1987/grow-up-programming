/**
 * 결함 fixture — `probabilistic/minHash` 계약에서 **해시의 무작위를 인스턴스마다 따로 뽑는** 구현.
 *
 * 정본과 같은 기법(해시 함수 k 개마다 가장 작은 값, 같은 칸의 몫)이고 k 도 같게 고르지만, 줄의 시작값 · 곱수와 해시 함수마다의
 * 섞는 값을 **생성자에서** 뽑는다. 인스턴스 하나만 보면 확률 문장의 출처(구현이 뽑는 무작위)를 더 곧게 따르는 모양이다. 그런데
 * 따로 세운 두 인스턴스가 같은 원소를 서로 다른 값으로 보내므로 **같은 집합을 넣어도 닮음이 1 이 아니다** — 결정적인 쪽의 둘째
 * 문장이 무작위를 뽑는 단위를 실행으로 옮기게 한다는 것(`docs/ORD-006-conventions.md` 「A군 닮음 추정」)을 실행으로 보이는
 * 자리다. 결정적 경계 케이스와 오차 판정(교집합이 큰 짝에서 닮음이 0 가까이 나온다)에서 걸린다. 자기 자신과의 닮음은 1 이다.
 *
 * 계측 단위는 정본과 같다(§규약2 계측 단위).
 */

export class PerInstanceSeedMinHash {
  __cost = 0;
  readonly #signature: Uint32Array;
  readonly #mixX: Uint32Array;
  readonly #mixY: Uint32Array;
  readonly #starts = Uint32Array.of(randomWord(), randomWord());
  readonly #mults = Uint32Array.of(randomWord() | 1, randomWord() | 1);
  readonly #epsilon: number;
  readonly #delta: number;
  #filled = false;

  constructor(epsilon: number, delta: number) {
    if (!(epsilon > 0 && epsilon < 1)) throw new RangeError(`ε ${epsilon}`);
    if (!(delta > 0 && delta < 1)) throw new RangeError(`δ ${delta}`);
    this.#epsilon = epsilon;
    this.#delta = delta;
    const k = Math.ceil(Math.log(2 / delta) / (2 * epsilon * epsilon));
    this.#signature = new Uint32Array(k).fill(0xffff_ffff);
    this.#mixX = Uint32Array.from({ length: k }, randomWord);
    this.#mixY = Uint32Array.from({ length: k }, randomWord);
    this.__cost += k + 1;
  }

  add(item: string): void {
    const a = this.#fold(0, item);
    const b = this.#fold(1, item);
    const signature = this.#signature;
    for (let i = 0; i < signature.length; i++) {
      const value = finish(
        finish(a ^ (this.#mixX[i] as number)) ^ b ^ (this.#mixY[i] as number),
      );
      if (value < (signature[i] as number)) signature[i] = value;
    }
    this.#filled = true;
    this.__cost += item.length * 2 + signature.length;
  }

  similarity(other: PerInstanceSeedMinHash): number {
    if (other.#epsilon !== this.#epsilon || other.#delta !== this.#delta)
      throw new RangeError("매개변수가 다르다");
    if (!this.#filled || !other.#filled) {
      this.__cost += 1;
      return this.#filled === other.#filled ? 1 : 0;
    }
    let same = 0;
    for (let i = 0; i < this.#signature.length; i++) {
      if (this.#signature[i] === other.#signature[i]) same++;
    }
    this.__cost += this.#signature.length;
    return same / this.#signature.length;
  }

  #fold(line: number, item: string): number {
    const mult = this.#mults[line] as number;
    let h = this.#starts[line] as number;
    for (let i = 0; i < item.length; i++)
      h = Math.imul(h ^ item.charCodeAt(i), mult);
    return finish(h ^ item.length);
  }
}

function randomWord(): number {
  return Math.floor(Math.random() * 0x1_0000_0000) >>> 0;
}

function finish(value: number): number {
  let x = value;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}
