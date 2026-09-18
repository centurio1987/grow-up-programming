/**
 * `linear/gapBuffer` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./gapBuffer.ts` 헤더 한 곳이고(규약1),
 * 여기 있는 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `invariant` → 축3 엄격도는 `regression`(±60% · 2점 · 적대적 선택).
 *
 * **껍데기가 없다.** 생성자가 인자를 받지 않으므로 `runContract` 의 인자 없는 팩토리에 그대로
 * 들어간다. 크기 사다리는 시나리오가 `insert` 로 직접 올린다 — 준비 비용이 n 에 비례하므로
 * 사다리 위에서 허용된다(불변 사실 50).
 *
 * **범위 밖 인자를 관측값으로 만든다.** 계약이 `moveCursor` 자리에 `RangeError` 를 적었는데
 * 하네스는 던진 것을 값으로 대조하지 못한다(`runContract.ts` 의 축1은 반환값만 본다). 그래서
 * 양쪽을 같은 방식으로 감싸 문자열 하나로 바꾼다. `RangeError` 가 아닌 예외는 그대로
 * 올려보낸다(스텁의 `Not implemented` 가 통과로 읽히면 안 된다).
 *
 * **무작위 커서 자리를 좁게 뽑는다.** 넣기와 지우기가 같은 확률로 뽑히는 500 회 시퀀스에서
 * 담긴 수가 20 언저리를 오르내리므로, 자리를 `-2` 부터 `25` 까지에서 뽑으면 **범위 안과 밖이
 * 둘 다 자주 나온다.** 넓게 뽑으면 거의 전부 범위 밖이라 커서가 움직이는 자리를 축1이 보지
 * 못한다.
 *
 * **경계 케이스 하나가 크기를 훑는다(`S21` 추가).** 무작위 시퀀스는 담긴 수가 20 언저리를 오르내려
 * 「넣은 직후 칸이 꼭 찬 상태에서 커서를 옮기기」에 닿지 않고, 축3 시나리오는 그 상태를 지나가도 값을
 * 보지 않는다. 옛 정본이 정확히 그 자리에서 원소를 지웠다(불변 사실 93 · 240) — 마지막 경계 케이스가
 * 넣은 직후의 크기 1 ~ 17 마다 커서를 옮겼다 되돌리며 읽는다(`sweptMoves` 머리말).
 *
 * **시나리오가 여섯이고 그중 둘이 같은 행(`moveCursor`)을 겨눈다.** 이 계약의 내용이 그
 * 행에 있기 때문이다 — 커서를 **한 칸** 옮기는 값과 **끝에서 끝으로** 뛰는 값이 갈려야
 * 지역성이 약속된 것이고, 한쪽만 두면 둘 중 어느 쪽이든 통과하는 결함 구현이 있다.
 * 실측은 `./gapBuffer.ts` 헤더 「연산 계약」 아래 문단에 적혀 있다.
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 **다섯 행**을 그대로 옮긴 표면. */
export interface GapBufferContract<T> {
  insert(item: T): void;
  deleteBefore(): T | null;
  moveCursor(position: number): void;
  cursor(): number;
  toArray(): T[];
}

/** 범위 밖 호출의 관측값. 계약이 `RangeError` 를 적은 자리다. */
const OUT_OF_RANGE = "RangeError";

function observe(call: () => unknown): unknown {
  try {
    return call();
  } catch (error) {
    if (error instanceof RangeError) return OUT_OF_RANGE;
    throw error;
  }
}

/**
 * 축1 참조 모델. 배열 하나에 담고 커서를 정수로 든다 — 축1은 의미만 보고 비용은 보지
 * 않으므로 자명한 구현으로 충분하다.
 *
 * 같은 모양이 축3에서는 결함 fixture 가 된다
 * (`_contract/_fixtures/splicingEditableSequence.ts`).
 */
interface Model {
  items: number[];
  at: number;
}

function modelMoveCursor(model: Model, position: unknown): unknown {
  if (
    typeof position !== "number" ||
    !Number.isInteger(position) ||
    position < 0 ||
    position > model.items.length
  ) {
    return OUT_OF_RANGE;
  }
  model.at = position;
  return undefined;
}

/**
 * 넣은 직후 크기마다 커서를 가운데로 옮겼다 끝으로 되돌리며 읽는 경계 케이스의 걸음(`S21`).
 *
 * **크기 하나를 고르지 않고 1 부터 {@link SWEPT_SIZES} 까지 전부 지난다.** 칸을 이어 붙여 담는 구현은
 * 어느 크기에서 칸이 꼭 차는지를 스스로 정하고(처음 잡는 칸 수 · 늘리는 배수), 그 크기는 계약의 말이
 * 아니다(불변 사실 44). 넣은 직후의 모든 크기에서 양쪽으로 한 번씩 옮기면 **처음 꼭 차는 크기가 이 끝
 * 이하인 계열 전부**가 꼭 찬 상태에서 왼쪽 이동과 오른쪽 이동을 한 번씩 지난다 — 구현의 상수를 읽은
 * 입력이 아니라 그 계열의 산술을 겨누는 입력이다(§「적대적 입력은 구현이 아니라 계약의 산술을 겨눌 수
 * 있다」). 옛 정본(`_contract/_fixtures/fullGapErasingBuffer.ts`)은 크기 8 의 첫 읽기에서 걸린다.
 */
function sweptMoves(): { op: string; arg?: unknown }[] {
  const steps: { op: string; arg?: unknown }[] = [];
  for (let size = 1; size <= SWEPT_SIZES; size++) {
    steps.push(
      { op: "insert", arg: size },
      { op: "moveCursor", arg: size >> 1 },
      { op: "toArray" },
      { op: "moveCursor", arg: size },
      { op: "toArray" },
    );
  }
  return steps;
}

/** 경계 케이스가 훑는 크기의 끝. 처음 꼭 차는 크기가 16 인 두 배 늘리기 계열까지 한 번 지나고 하나 더 간다. */
const SWEPT_SIZES = 17;

/** 커서를 끝에 둔 채 원소 n 개를 채운다. 시나리오의 공통 준비다. */
function fill(impl: GapBufferContract<number>, n: number): void {
  for (let i = 0; i < n; i++) impl.insert(i);
}

export const gapBufferContract: ContractSpec<
  GapBufferContract<number>,
  Model
> = {
  name: "GapBuffer",
  grade: "invariant",
  model: () => ({ items: [], at: 0 }),

  ops: [
    {
      name: "insert",
      arg: (rng) => Math.floor(rng() * 100),
      onImpl: (impl, arg) => {
        impl.insert(arg as number);
      },
      onModel: (model, arg) => {
        model.items.splice(model.at, 0, arg as number);
        model.at += 1;
      },
    },
    {
      name: "deleteBefore",
      arg: () => undefined,
      onImpl: (impl) => impl.deleteBefore(),
      onModel: (model) => {
        if (model.at === 0) return null;
        model.at -= 1;
        return model.items.splice(model.at, 1)[0] as number;
      },
    },
    {
      name: "moveCursor",
      // 범위 안과 밖이 둘 다 자주 나오도록 좁게 뽑는다(헤더 참고).
      arg: (rng) => Math.floor(rng() * 28) - 2,
      onImpl: (impl, arg) =>
        observe(() => {
          impl.moveCursor(arg as number);
        }),
      onModel: (model, arg) => modelMoveCursor(model, arg),
    },
    {
      name: "cursor",
      arg: () => undefined,
      onImpl: (impl) => impl.cursor(),
      onModel: (model) => model.at,
    },
    {
      name: "toArray",
      arg: () => undefined,
      onImpl: (impl) => impl.toArray(),
      onModel: (model) => [...model.items],
    },
  ],

  edges: [
    {
      name: "빈 구조에서 커서는 0 이고 지울 것이 없다",
      steps: [
        { op: "toArray" },
        { op: "cursor" },
        { op: "toArray" },
        { op: "deleteBefore" },
        { op: "toArray" },
        { op: "cursor" },
      ],
    },
    {
      name: "넣으면 커서가 따라 와서 넣은 순서대로 늘어선다",
      steps: [
        { op: "insert", arg: 1 },
        { op: "cursor" },
        { op: "insert", arg: 2 },
        { op: "insert", arg: 3 },
        { op: "cursor" },
        { op: "toArray" },
        { op: "toArray" },
      ],
    },
    {
      // 이 계약이 덱·큐와 갈리는 자리다. 끝이 아니라 **커서 자리**에 들어간다.
      name: "커서를 가운데로 옮기고 넣으면 그 자리에 끼워진다",
      steps: [
        { op: "insert", arg: 1 },
        { op: "insert", arg: 2 },
        { op: "insert", arg: 3 },
        { op: "moveCursor", arg: 1 },
        { op: "cursor" },
        { op: "insert", arg: 9 },
        { op: "cursor" },
        { op: "toArray" },
        { op: "toArray" },
      ],
    },
    {
      name: "커서 앞을 지우면 커서가 하나 당겨지고 앞이 0 이면 아무 일도 없다",
      steps: [
        { op: "insert", arg: 1 },
        { op: "insert", arg: 2 },
        { op: "insert", arg: 3 },
        { op: "moveCursor", arg: 2 },
        { op: "deleteBefore" },
        { op: "cursor" },
        { op: "toArray" },
        { op: "moveCursor", arg: 0 },
        { op: "deleteBefore" },
        { op: "cursor" },
        { op: "toArray" },
      ],
    },
    {
      // 경계가 「0 이상 담긴 원소 수 이하」인 인자라 위쪽 끝이 담긴 원소 수 자신이다(불변 사실 166).
      name: "커서 자리는 0 과 담긴 원소 수를 포함하고 그 밖은 RangeError 다",
      steps: [
        { op: "insert", arg: 1 },
        { op: "insert", arg: 2 },
        { op: "moveCursor", arg: 2 },
        { op: "cursor" },
        { op: "moveCursor", arg: 0 },
        { op: "cursor" },
        { op: "moveCursor", arg: 3 },
        { op: "cursor" },
        { op: "moveCursor", arg: -1 },
        { op: "cursor" },
        { op: "moveCursor", arg: 1.5 },
        { op: "cursor" },
        { op: "toArray" },
      ],
    },
    {
      // 커서를 앞뒤로 오가며 고쳐도 담긴 수열이 어긋나지 않는다.
      name: "커서를 오가며 고쳐도 수열이 어긋나지 않는다",
      steps: [
        { op: "insert", arg: 1 },
        { op: "insert", arg: 2 },
        { op: "insert", arg: 3 },
        { op: "insert", arg: 4 },
        { op: "moveCursor", arg: 0 },
        { op: "insert", arg: 5 },
        { op: "moveCursor", arg: 5 },
        { op: "insert", arg: 6 },
        { op: "moveCursor", arg: 3 },
        { op: "deleteBefore" },
        { op: "toArray" },
        { op: "cursor" },
        { op: "toArray" },
      ],
    },
    {
      // 칸이 꼭 찬 상태에서 커서를 옮기는 자리다. 계약의 말로는 「넣은 직후 크기마다」로만 짚을 수 있어
      // 크기를 훑는다(`sweptMoves` 머리말). 옛 정본이 이 상태에서 원소를 지웠다(불변 사실 93 · 240).
      name: "넣은 직후 크기마다 커서를 옮겼다 되돌려도 수열이 그대로다",
      steps: sweptMoves(),
    },
  ],

  // 헤더의 불변식 절이 「없다」다. 세어 둔 수를 읽는 행이 표면에서 빠져 늘어놓은 수와 견줄
  // 둘째 경로가 사라졌고, 커서 자리를 상태를 바꾸지 않고 읽는 경로도 `cursor()` 하나뿐이다.
  invariants: [],

  scenarios: [
    {
      // 커서를 가운데 두고 넣는다. **끼운 자리 뒤를 미는 계열이 여기서 걸린다** —
      // 뒤쪽 절반이 호출마다 밀리므로 상각 평균이 선형이 된다.
      covers: ["insert"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        fill(impl, n);
        impl.moveCursor(n >> 1);
        for (let i = 0; i < n; i++) ctx.step(() => impl.insert(n + i));
      },
      // 가운데에 n 개를 끼웠으므로 앞 절반 · 끼운 것 · 뒤 절반 순으로 남아야 한다.
      endState: (impl, n) =>
        isRuns(impl.toArray(), [
          { from: 0, count: n >> 1 },
          { from: n, count: n },
          { from: n >> 1, count: n - (n >> 1) },
        ]),
    },
    {
      // 커서를 가운데 두고 앞을 지운다. 같은 계열이 같은 이유로 걸린다.
      covers: ["deleteBefore"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        fill(impl, n);
        impl.moveCursor(n >> 1);
        for (let i = 0; i < n >> 1; i++) ctx.step(() => impl.deleteBefore());
      },
      // 앞 절반을 지웠으므로 뒤 절반만 남아야 한다.
      endState: (impl, n) =>
        isRuns(impl.toArray(), [{ from: n >> 1, count: n - (n >> 1) }]),
    },
    {
      // **이 계약 고유의 자리다.** 커서를 한 칸씩만 오간다 — 지나갈 거리가 1 로 고정되므로
      // `O(d)` 행이 여기서 `O(1)` 이 된다. 거리를 보지 않고 통째로 다시 짓는 계열이
      // 정확히 여기서 걸리고, 아래 먼 뜀 시나리오는 통과한다.
      covers: ["moveCursor"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        fill(impl, n);
        const home = n;
        for (let i = 0; i < n; i++) {
          ctx.step(() => {
            impl.moveCursor(home - 1);
            impl.moveCursor(home);
          });
        }
      },
      // **커서를 옮기는 것은 수열을 바꾸지 않는다.** 옛 정본이 여기서 원소를 지웠다(불변 사실 240 · 241).
      endState: (impl, n) => isRuns(impl.toArray(), [{ from: 0, count: n }]),
    },
    {
      // 같은 행을 반대쪽에서 잰다. 끝에서 끝으로 뛰므로 지나갈 거리가 n 이고, `O(d)` 행이
      // 여기서 `O(n)` 이 된다. **커서를 옮기는 일이 상수인 계열이 여기서 걸린다** —
      // 계약을 어겨서가 아니라 계급이 달라서다(불변 사실 49).
      covers: ["moveCursor"],
      qualifier: "worst",
      bound: "O(n)",
      adversarial: false,
      run: (impl, n, ctx) => {
        fill(impl, n);
        for (let i = 0; i < n; i++) {
          ctx.step(() => {
            impl.moveCursor(0);
            impl.moveCursor(n);
          });
        }
      },
      // 같은 까닭이다 — 끝에서 끝으로 뛰어도 수열은 그대로다.
      endState: (impl, n) => isRuns(impl.toArray(), [{ from: 0, count: n }]),
    },
    {
      // 커서 자리를 세어 두지 않고 물을 때마다 훑는 계열이 여기서만 걸린다.
      covers: ["cursor"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        fill(impl, n);
        impl.moveCursor(n >> 1);
        for (let i = 0; i < n >> 2; i++) {
          ctx.step(() => {
            impl.cursor();
          });
        }
      },
      // 묻기만 했으므로 수열은 준비가 남긴 그대로다.
      endState: (impl, n) => isRuns(impl.toArray(), [{ from: 0, count: n }]),
    },
    {
      // 되풀이 횟수가 n 이 아닌 이유는 O(n) 연산을 n 회 돌면 시나리오가 O(n^2) 이 되기
      // 때문이다. `worst` 는 최대값으로 판정하므로 표본이 적어도 된다.
      covers: ["toArray"],
      qualifier: "worst",
      bound: "O(n)",
      adversarial: false,
      run: (impl, n, ctx) => {
        fill(impl, n);
        for (let i = 0; i < 8; i++)
          ctx.step(
            () => impl.toArray(),
            // **걸음이 돌려주는 값을 받는 자리다.** 여덟 번 다 늘어놓고 여덟 번 다 버리고 있었다.
            (listed) => isRuns(listed, [{ from: 0, count: n }]),
          );
      },
      endState: (impl, n) => isRuns(impl.toArray(), [{ from: 0, count: n }]),
    },
  ],
};

/** 차례로 세는 토막 하나 — `from` 부터 `count` 개. `fill` 과 시나리오의 넣기가 남기는 모양이다. */
interface Run {
  from: number;
  count: number;
}

/**
 * 늘어놓은 것이 토막들을 이어 붙인 수열과 같은가. 어기면 설명을, 같으면 `null` (`KAN-043` ·
 * `_contract/runValues.ts`).
 *
 * **시나리오가 무엇을 넣고 무엇을 지웠는지 아니까 남아 있어야 하는 수열이 정해진다** — 참조
 * 모델을 시나리오마다 다시 지을 필요가 없다. 그 비용이 T5-03 이 「축3 시나리오 끝에서 값을
 * 대조할지」를 미결로 넘긴 까닭이었고, 여기서는 토막 서술 한 줄이 그 자리를 대신한다.
 *
 * 기대 배열을 짓지 않고 자리마다 견준다 — 검증 실행이 크기에 비례하는 메모리를 더 쓰지 않는다.
 *
 * **넣는 값이 전부 수라 빈 칸은 곧 잃은 원소다.** 그래서 빈 칸 수를 함께 보고한다 — 옛 정본이
 * 남기는 것이 그것이고(런북 불변 사실 240 · 241), 그 수가 자기시험이 고정하는 값이다.
 */
function isRuns(listed: unknown, runs: readonly Run[]): string | null {
  if (!Array.isArray(listed))
    return `늘어놓은 것이 수열이 아니다 — ${String(listed)}`;
  const total = runs.reduce((sum, run) => sum + run.count, 0);
  const holes = listed.filter((item) => item === undefined).length;
  if (listed.length !== total)
    return `늘어놓은 것이 ${listed.length} 개인데 ${total} 개여야 한다 (빈 칸 ${holes} 개)`;
  let at = 0;
  for (const run of runs) {
    for (let index = 0; index < run.count; index++, at++) {
      const expected = run.from + index;
      if (listed[at] !== expected)
        return `${at} 번째가 ${String(listed[at])} 인데 ${expected} 여야 한다 (빈 칸 ${holes} 개)`;
    }
  }
  return null;
}
