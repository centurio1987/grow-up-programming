/**
 * `heap/pairingHeap` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./pairingHeap.ts` 헤더 한 곳이고(규약1),
 * 여기 있는 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `complexity` → 축3 엄격도는 `discriminating`(±30% · 3점 · 적대적 필수).
 *
 * **축1·축2 자리는 `heap/leftistHeap` 의 객체를 그대로 쓴다.** 두 계약의 연산 표는 의미 열이
 * 글자 하나 다르지 않고 상한·한정자 열만 갈린다(헤더 「연산 계약」). 같아야 하는 것을 두 벌
 * 적으면 그 둘이 갈리므로 `model`·`ops`·`edges` 를 저쪽에서 가져오고, **이 파일이 새로 적는
 * 것은 `scenarios` 뿐이다.** 성격 전환(`heap/binomialHeap`)과 다른 자리가 여기다 — 전환은
 * 시나리오까지 같은 객체이고 이쪽은 시나리오가 갈린다. 하네스 자기시험이 셋의 참조가 같고
 * 시나리오만 다르다는 것을 `toBe` 로 고정한다. **저쪽 의미 열이 움직이면 이 계약의 헤더도
 * 함께 고쳐야 한다** — 참조가 같으므로 스위트는 따라가지만 헤더는 따라가지 않는다.
 *
 * **껍데기(`MergeSite`)도 저쪽 것이다.** 이 계약의 `merge` 도 두 번째 큐를 인자로 받으므로
 * 인자 없는 팩토리로는 그 자리를 못 만든다(불변 사실 83). 같은 껍데기를 쓰는 덕에 두 계약의
 * 정본을 서로의 스위트에 넣어 볼 수 있다(§규약1 「한정자만 다른 계약은 정본을 교차시켜
 * 판정한다」).
 *
 * **n 은 담긴 원소 수다.** `merge` 행에서만 「합친 뒤의 원소 수」로 읽는다.
 */

import type { ContractSpec } from "../../_contract/runContract";
import {
  leftistHeapContract,
  type MergeableQueue,
  type MergeSite,
} from "../leftistHeap/leftistHeap.contract";

/** 합칠 수 있는 우선순위 큐와 같은 표면. 갈리는 것은 비용뿐이다. */
export type PairingHeapContract<T> = MergeableQueue<T>;

/**
 * 호출 **하나**를 재는 시나리오가 같은 상태를 다시 만드는 횟수. `worst` 통계가 최댓값이라
 * 표본이 하나면 그 하나의 흔들림이 곧 판정이 된다.
 */
const ROUNDS = 3;

export const pairingHeapContract: ContractSpec<MergeSite<number>, number[]> = {
  name: "PairingHeap",
  grade: "complexity",
  model: leftistHeapContract.model,
  ops: leftistHeapContract.ops,
  edges: leftistHeapContract.edges,

  // 헤더 불변식 절이 「없다」이므로 빈 배열이다. 항목을 지우는 것과 다르다.
  invariants: [],

  scenarios: [
    {
      covers: ["enqueue"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: true,
      // **오름차순 넣기.** 늘 정렬해 두는 계열에는 새 원소가 늘 가장 뒤라 매번 통째로 민다
      // (1,024 · 4,096 · 16,384). 뿌리 둘을 잇는 계열에는 입력 방향이 비용을 안 바꾼다 —
      // 정본은 2.00 고정이다.
      //
      // **`worst` 가 사는 자리다.** 쌓아 두었다 이따금 한꺼번에 잇는 계열
      // (`_contract/_fixtures/bufferedLinkingHeap.ts`)이 여기서 1,025 · 4,097 · 16,385 로
      // 걸리고, 같은 입력을 `amortized` 로 다시 재면 3.00 고정으로 통과한다.
      //
      // **무작위 넣기 시나리오를 두지 않았다**(불변 사실 57 — 아무것도 더 가르지 못하는
      // 시나리오는 두지 않는다). 지어 재 보니 잡는 계열이 이쪽과 같았고(정렬 계열 987 ·
      // 3,991 · 16,332, 쌓아 두는 계열 1,025 · 4,097 · 16,385) 정본의 걸음도 2.00 으로 같아
      // 「계급이 입력 모양에 기대지 않는다」를 따로 잴 것이 없다 — `heap/leftistHeap` 이 두
      // 시나리오를 둔 근거(불변 사실 130)가 여기서는 서지 않는다. 내림차순은 어느 계열도
      // 못 잡았다.
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) ctx.step(() => impl.enqueue(i));
      },
    },
    {
      covers: ["dequeue"],
      qualifier: "amortized",
      bound: "O(log n)",
      adversarial: true,
      // **크기를 n 으로 유지하며 번갈아 부르기.** 측정이 **넣기 n 번 뒤의 첫 빼기**에서
      // 시작하고, 거기서 처음 몇 호출이 담긴 수에 비례할 수 있다는 것이 이 계약이 빼기를
      // 상각으로 내린 자리다(정본은 n = 1,024 에서 둘째 호출이 1,445). 상각 통계는 그것을
      // n 회 평균에 녹이므로 정본이 통과한다.
      //
      // **넣기 n 번 뒤 빼기 한 번만 재는 시나리오는 이 스위트에 둘 수 없다.** 상각은 n 회
      // 측정을 요구하고(§규약2 시나리오 규칙 4) 하네스가 그것을 막는다. 그 상태를 호출
      // 하나로 재는 자리는 `worst` 계약인 `heap/leftistHeap` 의 빼기 시나리오이고, 이 계약의
      // 정본이 거기서 걸린다는 것을 하네스 자기시험이 정본 교차로 고정한다.
      //
      // **미뤄 두었다 한꺼번에 정렬하는 계열을 잡는 것은 이 시나리오뿐이다** — 빼기마다
      // 새 원소 하나가 밀려 있어 매번 정렬된 줄 전체에 끼워 넣어야 한다. 아래 시나리오에서는
      // 그 정렬이 한 번뿐이라 상각이 성립한다(`heap/priorityQueue` 계약이 같은 두 시나리오로
      // 같은 갈림을 냈고, 여기서 다시 쟀다).
      //
      // 넣는 호출은 걸음에 넣지 않는다. 재려는 것이 빼기의 비용이기 때문이다.
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.enqueue(Math.floor(ctx.rng() * n * 4));
        for (let i = 0; i < n; i++) {
          impl.enqueue(Math.floor(ctx.rng() * n * 4));
          ctx.step(() => {
            impl.dequeue();
          });
        }
      },
    },
    {
      covers: ["dequeue"],
      qualifier: "amortized",
      bound: "O(log n)",
      adversarial: false,
      // **무작위로 n 번 넣은 뒤 n 번 빼기.** 넣기 n 번 뒤 빼기 한 번의 상태에서 출발해 구조가
      // 줄어드는 방향으로 끝까지 잰다 — 위 시나리오가 크기를 유지하는 것과 다른 걸음 분포다.
      //
      // **위 시나리오와 겨누는 계열이 겹친다.** 형제를 한 줄로 잇는 계열
      // (`_contract/_fixtures/sequentialLinkingHeap.ts`)이 둘 다에서 걸리고, 이쪽에서만
      // 걸리는 계열은 지어 보지 못했다. 그래도 두는 이유는 위 시나리오가 못 재는 상태
      // (크게 채운 뒤 비워 가는 동안)를 이쪽이 지나가기 때문이고, 겹친다는 사실을 여기
      // 적어 둔다(불변 사실 130).
      //
      // 값을 무작위로 채우는 것이 요점이다. 오름차순이나 내림차순으로 채우면 한 줄로 잇는
      // 계열도 뿌리 아래가 길 하나로 서서 빼기마다 상수다(오름차순 4.00 · 내림차순 2.00 고정).
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.enqueue(Math.floor(ctx.rng() * n * 4));
        for (let i = 0; i < n; i++) {
          ctx.step(() => {
            impl.dequeue();
          });
        }
      },
    },
    {
      covers: ["merge"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: true,
      // **크기가 다른 둘 합치기 — 받는 쪽 n/4, 넘겨받는 쪽 3n/4.** 합친 뒤 원소가 n 개다.
      // 두 큐를 하나로 접는 일을 원소 수에 비례하게 하는 계열(배열 한 줄 · 늘 정렬해 두는
      // 줄)이 여기서 걸린다.
      //
      // **같은 크기 둘(n/2 씩)로 채우지 않는 것이 이 시나리오의 적대성이다.** 쌓아 두었다
      // 문턱이 두 배씩 오를 때 한꺼번에 잇는 계열(`_contract/_fixtures/bufferedLinkingHeap.ts`)은
      // 합치기도 쌓인 줄을 먼저 잇는데, 사다리의 n 이 2의 거듭제곱이라 n/2 개를 채운 순간
      // 한꺼번에 잇기가 막 끝나 있어 줄이 하나뿐이다 — 같은 크기 둘에서 8.00 고정으로
      // **통과했다.** n/2 + 1 로 옮겨도 8.00 이었고, 3n/4 를 넘겨받게 하면 쌓인 줄이 n/4 를
      // 넘어 520 · 2,056 · 8,200 으로 걸린다. 같은 크기 둘이 잡던 계열은 여기서도 걸리므로
      // 옮기며 잃은 것이 없다 — 배열 한 줄은 같은 크기 둘에서 1,678 · 6,641 · 26,384, 여기서
      // 2,260 · 9,070 · 36,233 이고 정렬해 두는 줄은 둘 다 1,026 · 4,098 · 16,386 이다.
      //
      // **로그에 합치는 계열은 여기서 안 갈린다** — `heap/leftistHeap` 정본이 15 · 17 · 19
      // 로 통과한다(불변 사실 53). 이 행의 `O(1)` 과 저쪽 `O(log n)` 의 차이가 축3의
      // 해상도 아래라서다. n/2 + 1 로 채우면 같은 정본이 15 · 16 · 21($r$ = 1.31)로 허용
      // 상단을 넘어 걸렸다 — 로그 인수가 흔들림과 겹치는 자리라 그 채우기를 쓰지 않는다.
      //
      // 채우기는 걸음 밖이고, 같은 상태를 ROUNDS 번 다시 만든다.
      run: (impl, n, ctx) => {
        const kept = n >> 2;
        for (let round = 0; round < ROUNDS; round++) {
          while (!impl.isEmpty()) impl.dequeue();
          for (let i = 0; i < kept; i++)
            impl.enqueue(Math.floor(ctx.rng() * n * 4));
          impl.stage(
            Array.from({ length: n - kept }, () =>
              Math.floor(ctx.rng() * n * 4),
            ),
          );
          ctx.step(() => {
            impl.absorb();
          });
        }
      },
    },
    {
      covers: ["peek", "size", "isEmpty"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: true,
      // 세 조회를 한 걸음으로 묶어 잰다. 세 행이 같은 상한·한정자라 갈라 잴 이유가 없다.
      //
      // **넣기와 합치기를 섞어 n 개를 채운다.** 뿌리를 목록으로 늘어놓고 최우선 자리를 따로
      // 들지 않는 계열은 보기마다 그 목록을 훑고, 목록은 넣기와 합치기가 **둘 다** 늘린다 —
      // 한쪽으로만 채우면 다른 쪽에서만 최우선 자리를 놓치는 구현이 드러나지 않는다.
      //
      // **저장소의 결함 fixture 중 이 시나리오에서 걸리는 것은 없다.** 행을 덮으려고 두는
      // 시나리오이고(§규약2 시나리오 규칙 1), 정본을 포함한 여덟 구현이 전부 3.00 고정이다.
      run: (impl, n, ctx) => {
        let filled = 0;
        while (filled + 2 <= n) {
          impl.enqueue(Math.floor(ctx.rng() * n * 4));
          impl.stage([Math.floor(ctx.rng() * n * 4)]);
          impl.absorb();
          filled += 2;
        }
        while (filled < n) {
          impl.enqueue(Math.floor(ctx.rng() * n * 4));
          filled += 1;
        }

        for (let i = 0; i < n; i++) {
          ctx.step(() => {
            impl.peek();
            impl.size();
            impl.isEmpty();
          });
        }
      },
    },
  ],
};
