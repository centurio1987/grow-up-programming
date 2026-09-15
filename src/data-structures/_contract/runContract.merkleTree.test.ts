/**
 * 하네스 자기시험 — `tree/merkleTree` 계약(뿌리 결속 · 수열 없는 검증 · 로그 고치기 · T5-07).
 *
 * `./runContract.test.ts` 와 같은 일을 한다 — 계약 스위트가 **계약을 어긴 구현을 실제로 떨어뜨리는지**, 그리고
 * **떨어뜨리지 못하는 자리가 어디인지**를 고정한다. 파일을 따로 둔 이유는 `./runContract.pairingHeap.test.ts`
 * 머리말과 같다(불변 사실 106·255).
 *
 * 묶음이 다섯이다 — 축3 결함 계열의 행 귀속, 모든 행 `worst` 의 근거(계열 셋), 축1 이 잡는 설계 둘(물려받은 끝 복제 · 블록과 견주는
 * 검증), 주입자 의무와 구현의 몫(통과하는 결속 위반 포함), 무작위 시퀀스가 지나는 자리.
 */

import { describe, expect, test } from "bun:test";
import { MerkleTree as Reference } from "../tree/merkleTree/_reference/merkleTree";
import {
  blocksOf,
  digest,
  merkleTreeContract,
  Rebuildable,
  scattered,
  wrap,
} from "../tree/merkleTree/merkleTree.contract";
import { BlockCheckingMerkleTree } from "./_fixtures/blockCheckingMerkleTree";
import { DuplicatingLastMerkleTree } from "./_fixtures/duplicatingLastMerkleTree";
import {
  type RecomputeRule,
  RecomputeRuleMerkleTree,
} from "./_fixtures/recomputeRuleMerkleTree";
import { UnseparatedMerkleTree } from "./_fixtures/unseparatedMerkleTree";
import { rngFrom } from "./judge";
import {
  type CostScenario,
  type CostSource,
  judgeScenario,
} from "./runContract";

type Built = {
  rootHash(): string;
  getProof(index: number): string[];
  verify(root: string, index: number, block: string, proof: string[]): boolean;
  update(index: number, block: string): void;
  __cost: number;
};
type Maker = (blocks: string[], hash: (data: string) => string) => Built;

const rule =
  (name: RecomputeRule): Maker =>
  (blocks, hash) =>
    new RecomputeRuleMerkleTree(blocks, hash, name);

const makers = {
  reference: (blocks, hash) => new Reference(blocks, hash),
  eagerRebuild: rule("eagerRebuild"),
  leafOnly: rule("leafOnly"),
  dirtyPaths: rule("dirtyPaths"),
  flushWhenFull: rule("flushWhenFull"),
  deferredBuild: rule("deferredBuild"),
  duplicatingLast: (blocks, hash) =>
    new DuplicatingLastMerkleTree(blocks, hash),
  blockChecking: (blocks, hash) => new BlockCheckingMerkleTree(blocks, hash),
  unseparated: (blocks, hash) => new UnseparatedMerkleTree(blocks, hash),
} satisfies Record<string, Maker>;

function injected(make: Maker): CostSource<Rebuildable> {
  return {
    kind: "injected",
    make: (tick) =>
      new Rebuildable((blocks) =>
        make(blocks, (data) => {
          tick();
          return digest(data);
        }),
      ) as Rebuildable & { __cost: number },
  };
}

const ROWS = ["constructor", "rootHash", "getProof", "verify", "update"];

/** 시나리오 이름(덮는 행) → 판정. `only` 를 주면 그 행의 시나리오만 돈다. */
function verdicts(
  make: Maker,
  only: readonly string[] = ROWS,
): Record<string, { ok: boolean; stats: number[] }> {
  const result: Record<string, { ok: boolean; stats: number[] }> = {};
  for (const scenario of merkleTreeContract.scenarios) {
    const row = scenario.covers.join("·");
    if (!only.includes(row)) continue;
    const verdict = judgeScenario(injected(make), scenario, "complexity");
    result[row] = {
      ok: verdict.ok,
      stats: verdict.points.map((point) => Math.round(point.stat * 100) / 100),
    };
  }
  return result;
}

const PASS = (stats: number[]) => ({ ok: true, stats });
const FAIL = (stats: number[]) => ({ ok: false, stats });

/** 경계 케이스마다 처음 갈리는 걸음(갈리지 않으면 `null`)과 무작위 시퀀스(seed 1 · 500 회)에서 처음 갈리는 자리. */
function behaviorSplits(make: Maker): {
  edges: Record<string, string | null>;
  random: string | null;
} {
  const byName = new Map(
    merkleTreeContract.ops.map((op) => [op.name, op] as const),
  );
  const same = (a: unknown, b: unknown) =>
    JSON.stringify(a) === JSON.stringify(b);
  const edges: Record<string, string | null> = {};
  for (const edge of merkleTreeContract.edges) {
    const impl = new Rebuildable((blocks) => make(blocks, wrap));
    const model = merkleTreeContract.model();
    edges[edge.name] = null;
    for (const [index, step] of edge.steps.entries()) {
      const op = byName.get(step.op);
      if (!op) throw new Error(`없는 연산: ${step.op}`);
      const observed = op.onImpl(impl, step.arg);
      const expected = op.onModel(model, step.arg);
      if (!same(observed, expected)) {
        edges[edge.name] =
          `${index}번째 ${step.op} — 관측 ${JSON.stringify(observed)} / 모델 ${JSON.stringify(expected)}`;
        break;
      }
    }
  }
  const rng = rngFrom(1);
  const impl = new Rebuildable((blocks) => make(blocks, wrap));
  const model = merkleTreeContract.model();
  let random: string | null = null;
  for (let index = 0; index < 500 && random === null; index++) {
    const op =
      merkleTreeContract.ops[Math.floor(rng() * merkleTreeContract.ops.length)];
    if (!op) throw new Error("연산 목록이 비었다");
    const arg = op.arg(rng);
    if (!same(op.onImpl(impl, arg), op.onModel(model, arg))) {
      random = `무작위 ${index}번째 ${op.name}`;
    }
  }
  return { edges, random };
}

describe("축3 — 정본과 결함 계열(행 귀속)", () => {
  test("정본은 시나리오 다섯을 통과한다", () => {
    expect(verdicts(makers.reference)).toEqual({
      constructor: PASS([3073, 12289, 49153]),
      rootHash: PASS([1, 1, 1]),
      getProof: PASS([10, 12, 14]),
      verify: PASS([22, 26, 30]),
      update: PASS([22, 26, 30]),
    });
  });

  /** 자명한 구현 하나 — 블록 토큰만 들고 읽을 때마다 위층을 다시 짓는다. */
  test("읽을 때마다 다시 짓는 구현은 뿌리 · 증명에서 걸린다", () => {
    expect(verdicts(makers.leafOnly)).toEqual({
      constructor: PASS([2049, 8193, 32769]),
      rootHash: FAIL([1025, 4097, 16385]),
      getProof: FAIL([1034, 4108, 16398]),
      verify: PASS([22, 26, 30]),
      update: PASS([1, 1, 1]),
    });
  });

  /**
   * 자명한 구현 둘 — 고칠 때마다 위층 전부를 다시 짓는다. 뿌리 · 증명 시나리오는 준비가 흩어진 자리 n 번 고치기라 이 계열에서 준비가 n² 이다
   * (사다리 끝에서 20 초를 넘는다) — 그 둘은 재지 않는다(불변 사실 50 의 모양). 읽기는 정본과 같은 모양이다.
   */
  test("고칠 때마다 다시 짓는 구현은 고치기에서 걸린다", () => {
    expect(
      verdicts(makers.eagerRebuild, ["constructor", "verify", "update"]),
    ).toEqual({
      constructor: PASS([3073, 12289, 49153]),
      verify: PASS([22, 26, 30]),
      update: FAIL([1025, 4097, 16385]),
    });
  });

  test("고친 자리를 모아 두는 구현은 고친 뒤 첫 읽기에서 걸린다", () => {
    expect(verdicts(makers.dirtyPaths)).toEqual({
      constructor: PASS([3073, 12289, 49153]),
      rootHash: FAIL([3071, 12287, 49151]),
      getProof: FAIL([3080, 12298, 49164]),
      verify: PASS([22, 26, 30]),
      update: PASS([2, 2, 2]),
    });
  });

  test("쌓아 두다 한꺼번에 다시 짓는 구현은 고치기에서만 걸린다", () => {
    expect(verdicts(makers.flushWhenFull)).toEqual({
      constructor: PASS([3073, 12289, 49153]),
      rootHash: PASS([1, 1, 1]),
      getProof: PASS([10, 12, 14]),
      verify: PASS([22, 26, 30]),
      update: FAIL([1057, 4225, 16897]),
    });
  });

  test("짓기를 첫 읽기로 미루는 구현은 뿌리 · 증명에서 걸린다", () => {
    expect(verdicts(makers.deferredBuild)).toEqual({
      constructor: PASS([1024, 4096, 16384]),
      rootHash: FAIL([3074, 12290, 49154]),
      getProof: FAIL([3083, 12301, 49167]),
      verify: PASS([22, 26, 30]),
      update: PASS([1, 1, 1]),
    });
  });

  /** 축1 에서 걸리는 둘과 결속을 어기는데 스위트가 못 보는 하나 — 비용 계급은 셋 다 정본과 같다. */
  test("끝 복제 설계 · 블록과 견주는 검증 · 경계 없는 짜임은 축3 을 전부 통과한다", () => {
    expect({
      duplicatingLast: verdicts(makers.duplicatingLast),
      blockChecking: verdicts(makers.blockChecking),
      unseparated: verdicts(makers.unseparated),
    }).toEqual({
      duplicatingLast: {
        constructor: PASS([2047, 8191, 32767]),
        rootHash: PASS([1, 1, 1]),
        getProof: PASS([10, 12, 14]),
        verify: PASS([21, 25, 29]),
        update: PASS([11, 13, 15]),
      },
      blockChecking: {
        constructor: PASS([3073, 12289, 49153]),
        rootHash: PASS([1, 1, 1]),
        getProof: PASS([10, 12, 14]),
        verify: PASS([23, 27, 31]),
        update: PASS([22, 26, 30]),
      },
      unseparated: {
        constructor: PASS([3073, 12289, 49153]),
        rootHash: PASS([1, 1, 1]),
        getProof: PASS([10, 12, 14]),
        verify: PASS([22, 26, 30]),
        update: PASS([22, 26, 30]),
      },
    });
  });
});

describe("축3 — 모든 행 worst 의 근거: 뒤 호출로 미루는 계열이 이 계약에는 실재한다", () => {
  const read = (make: Maker, scenario: CostScenario<Rebuildable>) => {
    const verdict = judgeScenario(injected(make), scenario, "complexity");
    return {
      ok: verdict.ok,
      stats: verdict.points.map((point) => Math.round(point.stat * 100) / 100),
    };
  };

  /** 흩어진 자리 n 곳을 고친 뒤 뿌리 n 번 — 첫 읽기 하나가 고친 수만큼 치르고 나머지는 상수다. */
  test("고친 자리를 모아 두는 계열은 뿌리 worst 로 걸리고 amortized 로 통과한다", () => {
    const roots = (
      qualifier: "worst" | "amortized",
    ): CostScenario<Rebuildable> => ({
      covers: ["rootHash"],
      qualifier,
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        impl.reindex(blocksOf(n));
        for (let k = 0; k < n; k++) impl.update(scattered(k, n), `u${k}`);
        for (let s = 0; s < n; s++) ctx.step(() => void impl.rootHash());
      },
    });
    expect({
      dirtyWorst: read(makers.dirtyPaths, roots("worst")),
      dirtyAverage: read(makers.dirtyPaths, roots("amortized")),
      referenceWorst: read(makers.reference, roots("worst")),
    }).toEqual({
      dirtyWorst: FAIL([3071, 12287, 49151]),
      dirtyAverage: PASS([4, 4, 4]),
      referenceWorst: PASS([1, 1, 1]),
    });
  });

  /** 고치기 n 번 — 블록 칸의 1/64 마다 한 번 통째로 다시 짓는다. */
  test("쌓아 두다 다시 짓는 계열은 고치기 worst 로 걸리고 amortized 로 통과한다", () => {
    const updates = (
      qualifier: "worst" | "amortized",
    ): CostScenario<Rebuildable> => ({
      covers: ["update"],
      qualifier,
      bound: "O(log n)",
      adversarial: true,
      run: (impl, n, ctx) => {
        impl.reindex(blocksOf(n));
        for (let s = 0; s < n; s++) {
          ctx.step(() => impl.update(scattered(s + 1, n), `v${s}`));
        }
      },
    });
    expect({
      flushWorst: read(makers.flushWhenFull, updates("worst")),
      flushAverage: read(makers.flushWhenFull, updates("amortized")),
      referenceWorst: read(makers.reference, updates("worst")),
    }).toEqual({
      flushWorst: FAIL([1057, 4225, 16897]),
      flushAverage: PASS([67, 67, 67]),
      referenceWorst: PASS([22, 26, 30]),
    });
  });
});

describe("축1 — 설계 둘이 경계 케이스에서 갈리고, 비용 규칙 다섯은 전부 통과한다", () => {
  test("같은 토큰 모양의 비용 규칙 다섯과 경계 없는 짜임은 경계 케이스와 무작위 시퀀스를 통과한다", () => {
    for (const make of [
      makers.reference,
      makers.eagerRebuild,
      makers.leafOnly,
      makers.dirtyPaths,
      makers.flushWhenFull,
      makers.deferredBuild,
      makers.unseparated,
    ]) {
      const { edges, random } = behaviorSplits(make);
      expect(Object.values(edges).every((split) => split === null)).toBe(true);
      expect(random).toBeNull();
    }
  });

  /** 물려받은 문서의 설계 — 결속을 두 자리에서, 검증을 한 자리에서 어긴다. */
  test("끝 블록을 복제하는 설계는 결속 경계 둘과 없는 자리 검증에서 갈린다", () => {
    const { edges } = behaviorSplits(makers.duplicatingLast);
    const split = Object.fromEntries(
      Object.entries(edges).filter(([, value]) => value !== null),
    );
    expect(split).toEqual({
      "빈 수열도 뿌리가 있고 증명은 없으며, 블록 하나짜리와 뿌리가 다르다":
        '4번째 rootHash — 관측 [[],true] / 모델 [[""],true]',
      "다른 수열이면 다른 뿌리 — 끝 블록을 한 번 더 붙인 수열 · 블록을 이어 붙인 수열과도 다르다":
        '3번째 rootHash — 관측 [["a","b","c"],true] / 모델 [["a","b","c","c"],true]',
      "없는 자리를 가리키는 검증은 거짓이다 — 끝 블록의 증명을 한 칸 뒤 자리로 물어도":
        "3번째 verify — 관측 true / 모델 false",
    });
  });

  /** 물려받은 표면(뿌리 인자 없음)에서는 정본과 같은 답이다 — 옛 뿌리를 묻는 순간 갈린다. */
  test("담긴 블록과 견주는 검증은 옛 뿌리를 묻는 경계 케이스에서만 갈린다", () => {
    const { edges } = behaviorSplits(makers.blockChecking);
    const split = Object.fromEntries(
      Object.entries(edges).filter(([, value]) => value !== null),
    );
    expect(split).toEqual({
      "검증은 담긴 블록을 읽지 않는다 — 고친 뒤와 다시 지은 뒤에도 옛 뿌리의 증명은 참이다":
        "4번째 verify — 관측 false / 모델 true",
    });
  });
});

describe("주입자 의무와 구현의 몫", () => {
  /** 의무 ②(단사)를 어긴 해시에서는 두 구현의 답이 갈린다 — 그래서 ②가 계약의 문장이다. */
  test("길이만 돌려주는 해시에서 틀린 블록의 검증이 구현마다 갈린다", () => {
    const lengthOnly = (data: string) => String(data.length);
    const answer = (make: Maker) => {
      const tree = make(["ab", "cd", "ef", "gh"], lengthOnly);
      const root = tree.rootHash();
      const proof = tree.getProof(1);
      return [
        tree.verify(root, 1, "zz", proof),
        tree.verify(root, 1, "cd", proof),
      ];
    };
    expect({
      reference: answer(makers.reference),
      blockChecking: answer(makers.blockChecking),
    }).toEqual({ reference: [true, true], blockChecking: [false, true] });
  });

  /**
   * **통과하는 결속 위반**(불변 사실 62). 해시가 단사여도 출력끼리 앞뒤가 겹칠 수 있으면(`s => s + "!"`), 갈래 표시 · 경계 없이 잇는 구현이
   * 다른 두 수열에 같은 뿌리를 준다. 두 수열은 그 구현이 토큰을 잇는 방식을 읽어 지었다 — 시나리오가 될 수 없다(불변 사실 44).
   */
  test("경계 없이 잇는 구현은 단사 해시에서도 다른 두 수열에 같은 뿌리를 준다", () => {
    const bang = (data: string) => `${data}!`;
    const roots = (make: Maker) => [
      make(["x!", "y"], bang).rootHash(),
      make(["x", "!y"], bang).rootHash(),
    ];
    expect({
      unseparated: roots(makers.unseparated),
      reference: roots(makers.reference),
    }).toEqual({
      unseparated: ["2:x!!y!!!", "2:x!!y!!!"],
      reference: ["R2:N4:Lx!!Ly!!!", "R2:N3:Lx!L!y!!!"],
    });
  });
});

describe("무작위 시퀀스가 지나는 자리", () => {
  test("검증이 참 · 거짓 · 자유를 모두 지나고 뿌리를 전에 본 수열에서 다시 묻는다", () => {
    const rng = rngFrom(1);
    const model = merkleTreeContract.model();
    const counts: Record<string, number> = {};
    const seen = new Set<string>();
    let repeatedRoots = 0;
    for (let index = 0; index < 500; index++) {
      const op =
        merkleTreeContract.ops[
          Math.floor(rng() * merkleTreeContract.ops.length)
        ];
      if (!op) throw new Error("연산 목록이 비었다");
      const arg = op.arg(rng);
      const answer = op.onModel(model, arg);
      if (op.name === "rootHash") {
        const key = JSON.stringify(model.blocks);
        if (seen.has(key)) repeatedRoots += 1;
        seen.add(key);
        continue;
      }
      const key = `${op.name} ${JSON.stringify(answer ?? "")}`;
      counts[key] = (counts[key] ?? 0) + 1;
    }
    expect({ counts, repeatedRoots }).toEqual({
      counts: {
        'getProof "RangeError"': 38,
        'getProof "증명"': 58,
        'reindex ""': 98,
        'update ""': 45,
        'update "RangeError"': 49,
        "verify false": 66,
        "verify true": 17,
        'verify "자유"': 13,
        'verify "증명 없음"': 6,
      },
      repeatedRoots: 67,
    });
  });
});
