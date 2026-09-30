/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `mask = 0b1011`(`1011₂`).
 * `submaskWalk` 는 준비 T1 · 바퀴 T2~T8 · 종료 검사 T9 다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가
 * 배열 무대(`arrayStage.ts`)를 고른다. 칸 `i` 가 자리 `i` 의 비트라서 이진 표기와 좌우가 거꾸로다. 맨 윗줄이
 * `mask` 이고, 괄호 「자리내림」은 `sub - 1` 이 바꾸는 자리 `[0, p]`(`p` 는 `sub` 의 최하위 1 비트)다. 그
 * 아래에 지금의 서브마스크 `sub`(▲ 가 최하위 1 비트) · `borrowed = sub - 1`(새로 씀이 바뀐 자리) ·
 * `next = borrowed & mask`(새로 씀이 AND 가 지운 자리) 세 줄을 `layers` 로 쌓는다. 계산 한 줄은 알약,
 * 결과 배열 `subMasks` 는 무대에 자리가 없어 남는 변수다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `enumerateSubmasks-guide.test.ts` 가 잰다.
 */

export const submaskWalk = {
  player: "stage",
  stage: "array",
  arrayName: "mask",
  rangeLabel: "자리내림",
  indexLabel: "자리",
  title: "enumerateSubmasks(0b1011)",
  result: "[11, 10, 9, 8, 3, 2, 1, 0]",
  steps: [
    {
      title: "T1 sub = 11",
      text: "mask 11 을 결과의 첫 칸에 담고 sub 를 11 로 둡니다. 아직 바퀴에 들어가지 않았습니다.",
      array: [1, 1, 0, 1],
      range: null,
      read: [],
      write: [],
      pointers: {},
      calc: { expr: "subMasks = [mask]", result: "sub = 11" },
      vars: "subMasks = [11]",
      layers: [
        {
          name: "sub",
          values: [1, 1, 0, 1],
          write: [0, 1, 2, 3],
          side: "11 = 1011₂",
        },
        { name: "borrowed", values: [null, null, null, null] },
        { name: "next", values: [null, null, null, null] },
      ],
    },
    {
      title: "T2 sub = 11",
      text: "최하위 1 비트가 자리 0 이라 1 을 빼면 그 자리만 0 이 됩니다. 10 은 이미 mask 안이라 AND 가 지우는 자리가 없습니다.",
      array: [1, 1, 0, 1],
      range: [0, 0],
      read: [],
      write: [],
      pointers: {},
      calc: { expr: "(11 − 1) & 11", result: "10 & 11 = 10" },
      vars: "subMasks = [11, 10]",
      layers: [
        { name: "sub", values: [1, 1, 0, 1], read: [0], side: "11 = 1011₂" },
        {
          name: "borrowed",
          values: [0, 1, 0, 1],
          write: [0],
          side: "10 = 1010₂",
        },
        { name: "next", values: [0, 1, 0, 1], write: [], side: "10 = 1010₂" },
      ],
    },
    {
      title: "T3 sub = 10",
      text: "최하위 1 비트가 자리 1 이라 1 을 빼면 그 자리가 0 이 되고 자리 0 이 1 이 됩니다. 9 는 이미 mask 안이라 AND 가 지우는 자리가 없습니다.",
      array: [1, 1, 0, 1],
      range: [0, 1],
      read: [],
      write: [],
      pointers: {},
      calc: { expr: "(10 − 1) & 11", result: "9 & 11 = 9" },
      vars: "subMasks = [11, 10, 9]",
      layers: [
        { name: "sub", values: [0, 1, 0, 1], read: [1], side: "10 = 1010₂" },
        {
          name: "borrowed",
          values: [1, 0, 0, 1],
          write: [0, 1],
          side: "9 = 1001₂",
        },
        { name: "next", values: [1, 0, 0, 1], write: [], side: "9 = 1001₂" },
      ],
    },
    {
      title: "T4 sub = 9",
      text: "최하위 1 비트가 자리 0 이라 1 을 빼면 그 자리만 0 이 됩니다. 8 은 이미 mask 안이라 AND 가 지우는 자리가 없습니다.",
      array: [1, 1, 0, 1],
      range: [0, 0],
      read: [],
      write: [],
      pointers: {},
      calc: { expr: "(9 − 1) & 11", result: "8 & 11 = 8" },
      vars: "subMasks = [11, 10, 9, 8]",
      layers: [
        { name: "sub", values: [1, 0, 0, 1], read: [0], side: "9 = 1001₂" },
        {
          name: "borrowed",
          values: [0, 0, 0, 1],
          write: [0],
          side: "8 = 1000₂",
        },
        { name: "next", values: [0, 0, 0, 1], write: [], side: "8 = 1000₂" },
      ],
    },
    {
      title: "T5 sub = 8",
      text: "최하위 1 비트가 자리 3 이라 1 을 빼면 그 자리가 0 이 되고 자리 0 ~ 2 가 1 이 됩니다. mask 에 없는 자리 2 를 AND 가 지워 3 이 남습니다.",
      array: [1, 1, 0, 1],
      range: [0, 3],
      read: [],
      write: [],
      pointers: {},
      calc: { expr: "(8 − 1) & 11", result: "7 & 11 = 3" },
      vars: "subMasks = [11, 10, 9, 8, 3]",
      layers: [
        { name: "sub", values: [0, 0, 0, 1], read: [3], side: "8 = 1000₂" },
        {
          name: "borrowed",
          values: [1, 1, 1, 0],
          write: [0, 1, 2, 3],
          side: "7 = 0111₂",
        },
        { name: "next", values: [1, 1, 0, 0], write: [2], side: "3 = 0011₂" },
      ],
    },
    {
      title: "T6 sub = 3",
      text: "최하위 1 비트가 자리 0 이라 1 을 빼면 그 자리만 0 이 됩니다. 2 는 이미 mask 안이라 AND 가 지우는 자리가 없습니다.",
      array: [1, 1, 0, 1],
      range: [0, 0],
      read: [],
      write: [],
      pointers: {},
      calc: { expr: "(3 − 1) & 11", result: "2 & 11 = 2" },
      vars: "subMasks = [11, 10, 9, 8, 3, 2]",
      layers: [
        { name: "sub", values: [1, 1, 0, 0], read: [0], side: "3 = 0011₂" },
        {
          name: "borrowed",
          values: [0, 1, 0, 0],
          write: [0],
          side: "2 = 0010₂",
        },
        { name: "next", values: [0, 1, 0, 0], write: [], side: "2 = 0010₂" },
      ],
    },
    {
      title: "T7 sub = 2",
      text: "최하위 1 비트가 자리 1 이라 1 을 빼면 그 자리가 0 이 되고 자리 0 이 1 이 됩니다. 1 은 이미 mask 안이라 AND 가 지우는 자리가 없습니다.",
      array: [1, 1, 0, 1],
      range: [0, 1],
      read: [],
      write: [],
      pointers: {},
      calc: { expr: "(2 − 1) & 11", result: "1 & 11 = 1" },
      vars: "subMasks = [11, 10, 9, 8, 3, 2, 1]",
      layers: [
        { name: "sub", values: [0, 1, 0, 0], read: [1], side: "2 = 0010₂" },
        {
          name: "borrowed",
          values: [1, 0, 0, 0],
          write: [0, 1],
          side: "1 = 0001₂",
        },
        { name: "next", values: [1, 0, 0, 0], write: [], side: "1 = 0001₂" },
      ],
    },
    {
      title: "T8 sub = 1",
      text: "최하위 1 비트가 자리 0 이라 1 을 빼면 그 자리만 0 이 됩니다. 0 은 이미 mask 안이라 AND 가 지우는 자리가 없습니다.",
      array: [1, 1, 0, 1],
      range: [0, 0],
      read: [],
      write: [],
      pointers: {},
      calc: { expr: "(1 − 1) & 11", result: "0 & 11 = 0" },
      vars: "subMasks = [11, 10, 9, 8, 3, 2, 1, 0]",
      layers: [
        { name: "sub", values: [1, 0, 0, 0], read: [0], side: "1 = 0001₂" },
        {
          name: "borrowed",
          values: [0, 0, 0, 0],
          write: [0],
          side: "0 = 0000₂",
        },
        { name: "next", values: [0, 0, 0, 0], write: [], side: "0 = 0000₂" },
      ],
    },
    {
      title: "T9 sub = 0",
      text: "sub 가 0 이라 0 > 0 이 거짓입니다. 바퀴 7 번으로 담은 값 8 개를 돌려줍니다.",
      array: [1, 1, 0, 1],
      range: null,
      read: [],
      write: [],
      pointers: {},
      calc: { expr: "0 > 0", result: "거짓 → subMasks 를 돌려준다" },
      vars: "subMasks = [11, 10, 9, 8, 3, 2, 1, 0]",
      layers: [
        {
          name: "sub",
          values: [0, 0, 0, 0],
          read: [0, 1, 2, 3],
          side: "0 = 0000₂",
        },
        { name: "borrowed", values: [null, null, null, null] },
        { name: "next", values: [null, null, null, null] },
      ],
    },
  ],
};
