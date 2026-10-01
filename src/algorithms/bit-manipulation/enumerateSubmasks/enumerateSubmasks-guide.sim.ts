import type { TablePlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `mask = 0b1011`(`1011₂`).
 * `submaskWalk` 는 준비 T1 · 바퀴 T2~T8 · 종료 검사 T9 다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "table"` 이
 * 2 차원 표 무대(`tableStage.ts`)를 고른다. 열 머리가 자리 번호이고 **자리 0 이 오른쪽 끝**이라 칸의 순서가
 * 이진 표기와 같다(배열 무대는 인덱스 줄이 왼쪽부터 0 으로 고정이라 쓰지 않는다). 줄은 위부터 `mask` ·
 * 지금의 서브마스크 `sub`(읽음 테가 최하위 1 비트) · `borrowed = sub - 1`(새로 씀이 바뀐 자리) ·
 * `next = borrowed & mask`(새로 씀이 AND 가 지운 자리)다. 표 아래 괄호 「자리내림」은 `sub - 1` 이 바꾸는
 * 자리 `[0, p]`(`p` 는 `sub` 의 최하위 1 비트)이고, `mask` 줄의 대시 칸은 그 밖의 자리다. 계산 한 줄은 알약,
 * 결과 배열 `subMasks` 는 무대에 자리가 없어 남는 변수다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `enumerateSubmasks-guide.test.ts` 가 잰다.
 */

export const submaskWalk = {
  player: "stage",
  stage: "table",
  rowHeads: ["mask", "sub", "borrowed", "next"],
  colHeads: [3, 2, 1, 0],
  colLabel: "자리",
  title: "enumerateSubmasks(0b1011)",
  result: "[11, 10, 9, 8, 3, 2, 1, 0]",
  steps: [
    {
      title: "T1 sub = 11",
      text: "mask 11 을 결과의 첫 칸에 담고 sub 를 11 로 둡니다. 아직 바퀴에 들어가지 않았습니다.",
      table: [
        [1, 0, 1, 1],
        [1, 0, 1, 1],
        [null, null, null, null],
        [null, null, null, null],
      ],
      write: [
        [1, 3],
        [1, 2],
        [1, 1],
        [1, 0],
      ],
      out: [
        [0, 3],
        [0, 2],
        [0, 1],
        [0, 0],
      ],
      rowSide: ["11 = 1011₂", "11 = 1011₂", null, null],
      calc: {
        expr: "subMasks = [mask]",
        result: "sub = 11",
      },
      vars: "subMasks = [11]",
    },
    {
      title: "T2 sub = 11",
      text: "최하위 1 비트가 자리 0 이라 1 을 빼면 그 자리만 0 이 됩니다. 10 은 이미 mask 안이라 AND 가 지우는 자리가 없습니다.",
      table: [
        [1, 0, 1, 1],
        [1, 0, 1, 1],
        [1, 0, 1, 0],
        [1, 0, 1, 0],
      ],
      read: [[1, 3]],
      write: [[2, 3]],
      out: [
        [0, 2],
        [0, 1],
        [0, 0],
      ],
      pieces: [
        {
          label: "자리내림",
          from: 3,
          to: 3,
          tone: "query",
          text: "[0,0]",
        },
      ],
      rowSide: ["11 = 1011₂", "11 = 1011₂", "10 = 1010₂", "10 = 1010₂"],
      calc: {
        expr: "(11 − 1) & 11",
        result: "10 & 11 = 10",
      },
      vars: "subMasks = [11, 10]",
    },
    {
      title: "T3 sub = 10",
      text: "최하위 1 비트가 자리 1 이라 1 을 빼면 그 자리가 0 이 되고 자리 0 이 1 이 됩니다. 9 는 이미 mask 안이라 AND 가 지우는 자리가 없습니다.",
      table: [
        [1, 0, 1, 1],
        [1, 0, 1, 0],
        [1, 0, 0, 1],
        [1, 0, 0, 1],
      ],
      read: [[1, 2]],
      write: [
        [2, 3],
        [2, 2],
      ],
      out: [
        [0, 1],
        [0, 0],
      ],
      pieces: [
        {
          label: "자리내림",
          from: 2,
          to: 3,
          tone: "query",
          text: "[0,1]",
        },
      ],
      rowSide: ["11 = 1011₂", "10 = 1010₂", "9 = 1001₂", "9 = 1001₂"],
      calc: {
        expr: "(10 − 1) & 11",
        result: "9 & 11 = 9",
      },
      vars: "subMasks = [11, 10, 9]",
    },
    {
      title: "T4 sub = 9",
      text: "최하위 1 비트가 자리 0 이라 1 을 빼면 그 자리만 0 이 됩니다. 8 은 이미 mask 안이라 AND 가 지우는 자리가 없습니다.",
      table: [
        [1, 0, 1, 1],
        [1, 0, 0, 1],
        [1, 0, 0, 0],
        [1, 0, 0, 0],
      ],
      read: [[1, 3]],
      write: [[2, 3]],
      out: [
        [0, 2],
        [0, 1],
        [0, 0],
      ],
      pieces: [
        {
          label: "자리내림",
          from: 3,
          to: 3,
          tone: "query",
          text: "[0,0]",
        },
      ],
      rowSide: ["11 = 1011₂", "9 = 1001₂", "8 = 1000₂", "8 = 1000₂"],
      calc: {
        expr: "(9 − 1) & 11",
        result: "8 & 11 = 8",
      },
      vars: "subMasks = [11, 10, 9, 8]",
    },
    {
      title: "T5 sub = 8",
      text: "최하위 1 비트가 자리 3 이라 1 을 빼면 그 자리가 0 이 되고 자리 0 ~ 2 가 1 이 됩니다. mask 에 없는 자리 2 를 AND 가 지워 3 이 남습니다.",
      table: [
        [1, 0, 1, 1],
        [1, 0, 0, 0],
        [0, 1, 1, 1],
        [0, 0, 1, 1],
      ],
      read: [[1, 0]],
      write: [
        [2, 3],
        [2, 2],
        [2, 1],
        [2, 0],
        [3, 1],
      ],
      out: [],
      pieces: [
        {
          label: "자리내림",
          from: 0,
          to: 3,
          tone: "query",
          text: "[0,3]",
        },
      ],
      rowSide: ["11 = 1011₂", "8 = 1000₂", "7 = 0111₂", "3 = 0011₂"],
      calc: {
        expr: "(8 − 1) & 11",
        result: "7 & 11 = 3",
      },
      vars: "subMasks = [11, 10, 9, 8, 3]",
    },
    {
      title: "T6 sub = 3",
      text: "최하위 1 비트가 자리 0 이라 1 을 빼면 그 자리만 0 이 됩니다. 2 는 이미 mask 안이라 AND 가 지우는 자리가 없습니다.",
      table: [
        [1, 0, 1, 1],
        [0, 0, 1, 1],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
      ],
      read: [[1, 3]],
      write: [[2, 3]],
      out: [
        [0, 2],
        [0, 1],
        [0, 0],
      ],
      pieces: [
        {
          label: "자리내림",
          from: 3,
          to: 3,
          tone: "query",
          text: "[0,0]",
        },
      ],
      rowSide: ["11 = 1011₂", "3 = 0011₂", "2 = 0010₂", "2 = 0010₂"],
      calc: {
        expr: "(3 − 1) & 11",
        result: "2 & 11 = 2",
      },
      vars: "subMasks = [11, 10, 9, 8, 3, 2]",
    },
    {
      title: "T7 sub = 2",
      text: "최하위 1 비트가 자리 1 이라 1 을 빼면 그 자리가 0 이 되고 자리 0 이 1 이 됩니다. 1 은 이미 mask 안이라 AND 가 지우는 자리가 없습니다.",
      table: [
        [1, 0, 1, 1],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
        [0, 0, 0, 1],
      ],
      read: [[1, 2]],
      write: [
        [2, 3],
        [2, 2],
      ],
      out: [
        [0, 1],
        [0, 0],
      ],
      pieces: [
        {
          label: "자리내림",
          from: 2,
          to: 3,
          tone: "query",
          text: "[0,1]",
        },
      ],
      rowSide: ["11 = 1011₂", "2 = 0010₂", "1 = 0001₂", "1 = 0001₂"],
      calc: {
        expr: "(2 − 1) & 11",
        result: "1 & 11 = 1",
      },
      vars: "subMasks = [11, 10, 9, 8, 3, 2, 1]",
    },
    {
      title: "T8 sub = 1",
      text: "최하위 1 비트가 자리 0 이라 1 을 빼면 그 자리만 0 이 됩니다. 0 은 이미 mask 안이라 AND 가 지우는 자리가 없습니다.",
      table: [
        [1, 0, 1, 1],
        [0, 0, 0, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      read: [[1, 3]],
      write: [[2, 3]],
      out: [
        [0, 2],
        [0, 1],
        [0, 0],
      ],
      pieces: [
        {
          label: "자리내림",
          from: 3,
          to: 3,
          tone: "query",
          text: "[0,0]",
        },
      ],
      rowSide: ["11 = 1011₂", "1 = 0001₂", "0 = 0000₂", "0 = 0000₂"],
      calc: {
        expr: "(1 − 1) & 11",
        result: "0 & 11 = 0",
      },
      vars: "subMasks = [11, 10, 9, 8, 3, 2, 1, 0]",
    },
    {
      title: "T9 sub = 0",
      text: "sub 가 0 이라 0 > 0 이 거짓입니다. 바퀴 7 번으로 담은 값 8 개를 돌려줍니다.",
      table: [
        [1, 0, 1, 1],
        [0, 0, 0, 0],
        [null, null, null, null],
        [null, null, null, null],
      ],
      read: [
        [1, 3],
        [1, 2],
        [1, 1],
        [1, 0],
      ],
      out: [
        [0, 3],
        [0, 2],
        [0, 1],
        [0, 0],
      ],
      rowSide: ["11 = 1011₂", "0 = 0000₂", null, null],
      calc: {
        expr: "0 > 0",
        result: "거짓 → subMasks 를 돌려준다",
      },
      vars: "subMasks = [11, 10, 9, 8, 3, 2, 1, 0]",
    },
  ],
} satisfies TablePlayerSpec;
