// 가이드 본문 코드를 그대로 옮긴 자기 검증용 스크래치 파일.
// bun 으로 직접 실행해 본문의 모든 수치 예시/트레이스/시뮬 프레임을 검증한다.

class VanEmdeBoasTree {
  private U: number;
  private _min: number | undefined = undefined;
  private _max: number | undefined = undefined;
  private summary: VanEmdeBoasTree | undefined = undefined;
  private clusters: (VanEmdeBoasTree | undefined)[] = [];
  private readonly lowerSqrtU: number;

  constructor(U: number) {
    this.U = U;
    this.lowerSqrtU = U > 2 ? VanEmdeBoasTree.lowerSqrt(U) : 0;
  }

  static upperSqrt(U: number): number {
    return 2 ** Math.ceil(Math.log2(U) / 2);
  }
  static lowerSqrt(U: number): number {
    return 2 ** Math.floor(Math.log2(U) / 2);
  }
  private high(x: number): number {
    return Math.floor(x / this.lowerSqrtU);
  }
  private low(x: number): number {
    return x % this.lowerSqrtU;
  }
  private index(h: number, l: number): number {
    return h * this.lowerSqrtU + l;
  }

  min(): number | undefined {
    return this._min;
  }
  max(): number | undefined {
    return this._max;
  }

  has(x: number): boolean {
    if (x === this._min || x === this._max) return true;
    if (this.U === 2 || this._min === undefined) return false;
    const cluster = this.clusters[this.high(x)];
    if (cluster === undefined) return false;
    return cluster.has(this.low(x));
  }

  insert(x: number): void {
    if (this.has(x)) return; // 집합 의미론: 중복 무시
    this.insertNew(x);
  }

  private insertNew(x: number): void {
    if (this._min === undefined) {
      this._min = x;
      this._max = x;
      return;
    }
    if (x < this._min) {
      const tmp = this._min;
      this._min = x;
      x = tmp;
    }
    if (this.U > 2) {
      const h = this.high(x);
      const l = this.low(x);
      if (this.clusters[h] === undefined) {
        this.clusters[h] = new VanEmdeBoasTree(this.lowerSqrtU);
      }
      if (this.clusters[h]!.min() === undefined) {
        if (this.summary === undefined) {
          this.summary = new VanEmdeBoasTree(VanEmdeBoasTree.upperSqrt(this.U));
        }
        this.summary.insertNew(h);
      }
      this.clusters[h]!.insertNew(l);
    }
    if (x > this._max!) this._max = x;
  }

  delete(x: number): void {
    if (!this.has(x)) return; // 없는 값의 삭제는 무시
    this.deleteExisting(x);
  }

  private deleteExisting(x: number): void {
    if (this._min === this._max) {
      this._min = undefined;
      this._max = undefined;
      return;
    }
    if (this.U === 2) {
      this._min = x === 0 ? 1 : 0;
      this._max = this._min;
      return;
    }
    if (x === this._min) {
      const firstCluster = this.summary!.min()!;
      x = this.index(firstCluster, this.clusters[firstCluster]!.min()!);
      this._min = x;
    }
    const h = this.high(x);
    const l = this.low(x);
    this.clusters[h]!.deleteExisting(l);
    if (this.clusters[h]!.min() === undefined) {
      this.summary!.deleteExisting(h);
      if (x === this._max) {
        const summaryMax = this.summary!.max();
        if (summaryMax === undefined) {
          this._max = this._min;
        } else {
          this._max = this.index(summaryMax, this.clusters[summaryMax]!.max()!);
        }
      }
    } else if (x === this._max) {
      this._max = this.index(h, this.clusters[h]!.max()!);
    }
  }

  successor(x: number): number | undefined {
    if (this.U === 2) {
      if (x === 0 && this._max === 1) return 1;
      return undefined;
    }
    if (this._min !== undefined && x < this._min) return this._min;

    const h = this.high(x);
    const l = this.low(x);
    const cluster = this.clusters[h];
    const clusterMax = cluster?.max();
    if (clusterMax !== undefined && l < clusterMax) {
      const offset = cluster!.successor(l)!;
      return this.index(h, offset);
    }
    const succCluster = this.summary?.successor(h);
    if (succCluster === undefined) return undefined;
    const offset = this.clusters[succCluster]!.min()!;
    return this.index(succCluster, offset);
  }

  predecessor(x: number): number | undefined {
    if (this.U === 2) {
      if (x === 1 && this._min === 0) return 0;
      return undefined;
    }
    if (this._max !== undefined && x > this._max) return this._max;

    const h = this.high(x);
    const l = this.low(x);
    const cluster = this.clusters[h];
    const clusterMin = cluster?.min();
    if (clusterMin !== undefined && l > clusterMin) {
      const offset = cluster!.predecessor(l)!;
      return this.index(h, offset);
    }
    const predCluster = this.summary?.predecessor(h);
    if (predCluster === undefined) {
      if (this._min !== undefined && x > this._min) return this._min;
      return undefined;
    }
    const offset = this.clusters[predCluster]!.max()!;
    return this.index(predCluster, offset);
  }
}

// ---------------------------------------------------------------------------
// 실측 검증
// ---------------------------------------------------------------------------

function log(label: string, value: unknown) {
  console.log(`${label}: ${JSON.stringify(value)}`);
}

console.log("=== 문제 예시 (vanEmdeBoasTree-problem.md) ===");
{
  const veb = new VanEmdeBoasTree(16);
  veb.insert(2);
  veb.insert(5);
  veb.insert(8);
  veb.insert(11);
  log("has(5)", veb.has(5)); // true
  log("has(6)", veb.has(6)); // false
  log("min()", veb.min()); // 2
  log("max()", veb.max()); // 11
  log("successor(5)", veb.successor(5)); // 8
  log("successor(8)", veb.successor(8)); // 11
  log("successor(11)", veb.successor(11)); // undefined
  log("predecessor(8)", veb.predecessor(8)); // 5
  veb.delete(5);
  log("has(5) after delete", veb.has(5)); // false
  log("successor(2) after delete", veb.successor(2)); // 8
}

console.log("\n=== 시뮬레이션 프레임 재현 (U=16) ===");
{
  const veb = new VanEmdeBoasTree(16);
  log("frame0 min/max", [veb.min(), veb.max()]);

  veb.insert(2);
  log("frame1 insert(2) min/max", [veb.min(), veb.max()]);

  veb.insert(5);
  log("frame2 insert(5) min/max", [veb.min(), veb.max()]);

  veb.insert(8);
  veb.insert(11);
  log("frame3 insert(8,11) min/max", [veb.min(), veb.max()]);

  const succ5 = veb.successor(5);
  log("frame4 successor(5)", succ5); // expect 8

  veb.delete(5);
  log("frame5 after delete(5)", [veb.min(), veb.max(), veb.has(5), veb.has(2), veb.has(8), veb.has(11)]);
}

console.log("\n=== 엣지 케이스 ===");
{
  const empty = new VanEmdeBoasTree(16);
  log("empty min/max", [empty.min(), empty.max()]);
  log("empty has(0)", empty.has(0));
  log("empty successor(0)", empty.successor(0));
  log("empty predecessor(0)", empty.predecessor(0));
  empty.delete(3); // 없는 값 삭제 무시
  log("delete on empty no-op min/max", [empty.min(), empty.max()]);

  const single = new VanEmdeBoasTree(16);
  single.insert(7);
  log("single min/max", [single.min(), single.max()]);
  single.delete(7);
  log("single after delete min/max", [single.min(), single.max()]);

  const base2 = new VanEmdeBoasTree(2);
  base2.insert(0);
  base2.insert(1);
  log("base2 min/max", [base2.min(), base2.max()]);
  log("base2 successor(0)", base2.successor(0)); // 1
  log("base2 predecessor(1)", base2.predecessor(1)); // 0
  base2.delete(0);
  log("base2 after delete(0) min/max", [base2.min(), base2.max()]);

  const dup = new VanEmdeBoasTree(16);
  dup.insert(4);
  dup.insert(4); // 중복 무시
  log("dup size-proxy min/max", [dup.min(), dup.max()]);
  log("dup has(4)", dup.has(4));
}

console.log("\n=== 무작위 교차검증 (naive 배열 대조, U=64, 500회) ===");
{
  function randTest(seedBase: number) {
    const U = 64;
    const veb = new VanEmdeBoasTree(U);
    const set = new Set<number>();
    let seed = seedBase;
    function rnd() {
      // xorshift 유사 PRNG (결정적 재현을 위해)
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      seed |= 0;
      return (seed >>> 0) % U;
    }
    for (let i = 0; i < 500; i++) {
      const op = rnd() % 3;
      const x = rnd();
      if (op === 0) {
        veb.insert(x);
        set.add(x);
      } else if (op === 1) {
        veb.delete(x);
        set.delete(x);
      } else {
        const expected = veb.has(x);
        const actual = set.has(x);
        if (expected !== actual) {
          throw new Error(`has(${x}) mismatch at op ${i}: veb=${expected}, set=${actual}`);
        }
      }
      // min/max 검증
      const sorted = [...set].sort((a, b) => a - b);
      const expMin = sorted.length > 0 ? sorted[0] : undefined;
      const expMax = sorted.length > 0 ? sorted[sorted.length - 1] : undefined;
      if (veb.min() !== expMin || veb.max() !== expMax) {
        throw new Error(`min/max mismatch at op ${i}: veb=[${veb.min()},${veb.max()}], expected=[${expMin},${expMax}]`);
      }
      // successor/predecessor 검증 (모든 x)
      for (let v = 0; v < U; v++) {
        const expSucc = sorted.find((s) => s > v);
        const actSucc = veb.successor(v);
        if (expSucc !== actSucc) {
          throw new Error(`successor(${v}) mismatch at op ${i}: veb=${actSucc}, expected=${expSucc}`);
        }
        const cands = sorted.filter((s) => s < v);
        const expPred = cands.length > 0 ? cands[cands.length - 1] : undefined;
        const actPred = veb.predecessor(v);
        if (expPred !== actPred) {
          throw new Error(`predecessor(${v}) mismatch at op ${i}: veb=${actPred}, expected=${expPred}`);
        }
      }
    }
    return true;
  }
  let allOk = true;
  for (let s = 1; s <= 20; s++) {
    try {
      randTest(s * 7919 + 1);
    } catch (e) {
      allOk = false;
      console.log(`시드 ${s} 실패:`, e);
    }
  }
  console.log("무작위 교차검증 전체 통과:", allOk);
}

console.log("\n=== 성능 목표: log log U 확인 ===");
{
  log("log2(log2(2**16))", Math.log2(Math.log2(2 ** 16)));
  log("log2(log2(2**32))", Math.log2(Math.log2(2 ** 32)));
}

console.log("\n=== 내부 구조 상세 검증 (U=16, insert 2,5,8,11) ===");
{
  // private 필드 접근을 위해 as any 사용 (검증 전용 스크립트)
  const veb: any = new VanEmdeBoasTree(16);
  veb.insert(2);
  veb.insert(5);
  veb.insert(8);
  veb.insert(11);
  log("top min/max", [veb.min(), veb.max()]);
  log("top.summary min/max", [veb["summary"].min(), veb["summary"].max()]);
  log("top.clusters[1] min/max", [veb["clusters"][1].min(), veb["clusters"][1].max()]);
  log("top.clusters[2] min/max", [veb["clusters"][2].min(), veb["clusters"][2].max()]);
  log("top.clusters[1] exists only?", veb["clusters"].map((c: any) => c !== undefined));
  const summary = veb["summary"];
  log("summary.clusters[1] min/max", [summary["clusters"][1]?.min(), summary["clusters"][1]?.max()]);
  log("summary.summary min/max", [summary["summary"]?.min(), summary["summary"]?.max()]);
  const c2 = veb["clusters"][2];
  log("clusters[2].clusters[1] min/max", [c2["clusters"][1]?.min(), c2["clusters"][1]?.max()]);
  log("clusters[2].summary min/max", [c2["summary"]?.min(), c2["summary"]?.max()]);
}

console.log("\n=== 함정 검증: successor의 'x < min' 분기를 빼먹으면? ===");
{
  class BuggySuccessor extends (VanEmdeBoasTree as any) {}
  // private 필드 재사용이 어려우므로 별도 클래스로 재구현
  class Buggy {
    U: number;
    _min: number | undefined = undefined;
    _max: number | undefined = undefined;
    summary: Buggy | undefined = undefined;
    clusters: (Buggy | undefined)[] = [];
    lowerSqrtU: number;
    constructor(U: number) {
      this.U = U;
      this.lowerSqrtU = U > 2 ? VanEmdeBoasTree.lowerSqrt(U) : 0;
    }
    high(x: number) { return Math.floor(x / this.lowerSqrtU); }
    low(x: number) { return x % this.lowerSqrtU; }
    index(h: number, l: number) { return h * this.lowerSqrtU + l; }
    has(x: number): boolean {
      if (x === this._min || x === this._max) return true;
      if (this.U === 2 || this._min === undefined) return false;
      const c = this.clusters[this.high(x)];
      if (c === undefined) return false;
      return c.has(this.low(x));
    }
    insert(x: number): void {
      if (this.has(x)) return;
      this.insertNew(x);
    }
    insertNew(x: number): void {
      if (this._min === undefined) { this._min = x; this._max = x; return; }
      if (x < this._min) { const t = this._min; this._min = x; x = t; }
      if (this.U > 2) {
        const h = this.high(x), l = this.low(x);
        if (this.clusters[h] === undefined) this.clusters[h] = new Buggy(this.lowerSqrtU);
        if (this.clusters[h]!.min() === undefined) {
          if (this.summary === undefined) this.summary = new Buggy(VanEmdeBoasTree.upperSqrt(this.U));
          this.summary.insertNew(h);
        }
        this.clusters[h]!.insertNew(l);
      }
      if (x > this._max!) this._max = x;
    }
    min() { return this._min; }
    max() { return this._max; }
    // 버그: "x < min이면 min 반환" 분기를 빼먹은 successor
    successorBuggy(x: number): number | undefined {
      if (this.U === 2) {
        if (x === 0 && this._max === 1) return 1;
        return undefined;
      }
      // (누락) if (this._min !== undefined && x < this._min) return this._min;
      const h = this.high(x), l = this.low(x);
      const cluster = this.clusters[h];
      const clusterMax = cluster?.max();
      if (clusterMax !== undefined && l < clusterMax) {
        const offset = cluster!.successorBuggy(l)!;
        return this.index(h, offset);
      }
      const succCluster = this.summary?.successorBuggy(h);
      if (succCluster === undefined) return undefined;
      const offset = this.clusters[succCluster]!.min()!;
      return this.index(succCluster, offset);
    }
  }
  const buggy = new Buggy(16);
  buggy.insert(2); buggy.insert(5); buggy.insert(8); buggy.insert(11);
  log("정상 successor(0) [기대: 2]", (() => {
    const good = new VanEmdeBoasTree(16);
    good.insert(2); good.insert(5); good.insert(8); good.insert(11);
    return good.successor(0);
  })());
  log("버그 버전 successorBuggy(0)", buggy.successorBuggy(0));
}

console.log("\n=== 확인 질문 검증 ===");
{
  const veb = new VanEmdeBoasTree(16);
  veb.insert(2); veb.insert(5); veb.insert(8); veb.insert(11);
  log("predecessor(2) [min 자신보다 작은 값 없음]", veb.predecessor(2));
  log("predecessor(8) [기대 5]", veb.predecessor(8));
  log("successor(11) [최댓값 다음 없음]", veb.successor(11));
}

console.log("\n=== insert(11) 전/후 상태 검증 ===");
{
  const veb: any = new VanEmdeBoasTree(16);
  veb.insert(2); veb.insert(5); veb.insert(8);
  log("insert(11) 직전 top min/max", [veb.min(), veb.max()]);
  log("insert(11) 직전 clusters[2] min/max", [veb["clusters"][2]?.min(), veb["clusters"][2]?.max()]);
  log("insert(11) 직전 summary min/max", [veb["summary"]?.min(), veb["summary"]?.max()]);
  veb.insert(11);
  log("insert(11) 직후 top min/max", [veb.min(), veb.max()]);
  log("insert(11) 직후 clusters[2] min/max", [veb["clusters"][2]?.min(), veb["clusters"][2]?.max()]);
  log("insert(11) 직후 summary min/max", [veb["summary"]?.min(), veb["summary"]?.max()]);
}

console.log("\n=== delete(5) 전/후 상태 검증 ===");
{
  const veb: any = new VanEmdeBoasTree(16);
  veb.insert(2); veb.insert(5); veb.insert(8); veb.insert(11);
  log("delete(5) 직전 clusters[1] min/max", [veb["clusters"][1]?.min(), veb["clusters"][1]?.max()]);
  log("delete(5) 직전 summary min/max", [veb["summary"]?.min(), veb["summary"]?.max()]);
  veb.delete(5);
  log("delete(5) 직후 top min/max", [veb.min(), veb.max()]);
  log("delete(5) 직후 clusters[1] min/max", [veb["clusters"][1]?.min(), veb["clusters"][1]?.max()]);
  log("delete(5) 직후 summary min/max", [veb["summary"]?.min(), veb["summary"]?.max()]);
}
