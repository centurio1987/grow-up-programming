# `algo-guide-v2` — 알고리즘 가이드 재기획 샌드박스

카드 `KAN-033-E8KHSV` 의 작업 공간이다. **pilot 이 유저에게 승인되기 전까지 `src/algorithms/`
의 기존 가이드 111편을 한 글자도 건드리지 않는다.**

전략 전문은 `KANBAN.cards/KAN-033-E8KHSV.md`, 명세 정본은 이 디렉터리의 `SPEC.md` 다.

## 무엇이 어디에 있는가

```
SPEC.md          명세 정본 — 23항목(필수 20 · 조건부 3) · id↔헤딩 매핑 · 작성법 · 범위 원칙
FEEDBACK.md      반영 상태의 정본 — 지적 → 규칙 → 강제 지점, 그리고 사람이 봐야 하는 목록
JOURNAL.md       배치 결과 · 반려 사유 · 실측값 · 확정 SPEC 해시
verdicts/        옛 이해 시험 응답 원문 <name>-r<NN>.md — 2026-08-29 이후 새로 안 쌓인다
tsconfig.json    루트를 extends 하되 exclude 를 비운다 (아래 「함정」)
.gitignore       *.html — 빌드 산출물은 커밋하지 않는다

pilot/<name>/
  <name>-guide.md        원천. 마커 둘이 md↔web 갈림점이다
  <name>-guide.sim.ts    { view, steps, title, result, extraViews?, overrides? }
  <name>-guide.alt.ts    경쟁 설계 구현 (bench-alt.ts 가 실행한다). purpose.alt 를
                         생략한 편에는 없다 — 남겨 두면 P10 이 잡는다 (L34)
  <name>-guide.ref.ts    deep.walk.final(전체 코드)의 정본
  <name>-guide.test.ts   기존 테스트의 입출력 케이스를 .ref.ts 에 재실행 (L9)

viz/             신규 컴포넌트 초안 + 테스트
_smoke/          B1 연기 시험용 최소 표본
tools/
  build-html.ts      md → 자립형 HTML. 우측 항목 레일(L37)을 함께 낸다
  check-v2.ts        P1~P10
  check-metaphor.ts  은유 표현 — 문서 전체(`.md`)
  check-rework.ts    구성 지적을 받은 절의 재작성률 — 재배치와 재작성을 가른다
  check-proof.ts     본문이 내미는 값 ↔ 실행 결과. 변이는 정본 소스에서 기계로 만든다
  comprehension.sh   옛 이해 시험 V1~V7 — **돌리지 않는다**(SPEC §0)
  bench-alt.ts       L13 의 결정론적 계수
```

**반영 상태의 정본은 `FEEDBACK.md` 다** — 유저 지적이 어느 규칙이 되었고 무엇이 그것을
강제하는지, **기계가 못 잡아 사람이 봐야 하는 목록**(§3), 그리고 **조건부 절 셋을 편마다
어떻게 판정했는지**(§5)가 거기 있다.

## 검증

```bash
bunx tsc --noEmit -p sandbox/algo-guide-v2                 # 샌드박스 전용
bunx --bun @biomejs/biome check sandbox/algo-guide-v2      # .ts 가 생긴 뒤부터
bun test sandbox/algo-guide-v2                             # .test.ts 가 생긴 뒤부터
bun run sandbox/algo-guide-v2/tools/check-v2.ts <파일>
bun run sandbox/algo-guide-v2/tools/build-html.ts <파일>
bun run sandbox/algo-guide-v2/tools/check-proof.ts <파일>
bun run tools/ci.ts all                                     # 배치 종료마다
```

### 함정 넷 (전부 실측)

- **`bun test <경로>` 와 `biome check <디렉터리>` 는 대상 파일이 0개면 exit 1** 이다.
  초반 배치에서는 돌리지 않는다.
- **`bunx tsc --noEmit -p` 도 입력이 0개면 `TS18003`** 이다. 이 디렉터리에 첫 `.ts` 가 생기는
  것은 S4(`check-v2.ts`)이므로 그 전까지는 이 명령이 실패하는 것이 정상이다.
- **`bunx biome` 을 쓰지 않는다.** npm 의 `biome` 은 이 저장소가 설정한 `@biomejs/biome` 와
  다른 패키지이고, 아무것도 검사하지 않고 exit 0 을 준다.
- **`tools/check-guide-rhythm.ts` 를 호출하지 않는다.** 규칙은 P1·P2 로 옮겼다. 호출해도
  R2~R4·R6 은 `hasTrace`(구 헤딩 문자열 접두 일치)가 새 헤딩과 어긋나 **조용히 공전한다** —
  통과 표시가 거짓이 된다.

## 신규 viz 컴포넌트 프로세스

1. **시각화 대상을 한 문장으로 적는다** — "무엇이 시간에 따라 변하는가".
2. **기존 뷰 조합으로 안 되는 이유를 적는다.** `view={[...]}` 조합까지 시도한 뒤에 판정한다.
   이 문장이 없으면 새 컴포넌트를 만들지 않는다.
3. **Frame 필드는 `extra` 아래에 둔다.** `Frame` 이 `BaseFrame & Partial<...>×6` 교집합이라
   최상위에 필드를 더하면 이름이 겹칠 때 `never` 가 되고, 살아 있는 가이드 182편이 함께 깨진다.
   그 파손은 `.mdx` 가 tsc 대상이 아니라 **런타임에, 편별로** 확인된다.
4. **`viz/` 에 구현 + 테스트.** 색은 `var(--guide-sim-*, 폴백)` 로만 — 하드코딩 금지.
   샌드박스에서는 **`extraViews`(새 이름)** 또는 **`overrides`(프리셋 개선)** 로 끼운다.
   - `extraViews` 키가 프리셋 이름과 겹치면 **던진다**(조용한 덮어쓰기 금지).
   - `overrides` 는 프리셋을 이기되 `console.warn` 을 낸다.
5. **md 쪽 ascii art 대응 표현을 같은 커밋에서 정의한다.** 쌍이 깨지면 L11 위반이다.
6. **승격은 pilot 승인 뒤.** `ViewName` 유니온 + `VIEW_REGISTRY` + `Frame` 에 추가한다.

**mosAlgorithm 용 새 컴포넌트는 기본적으로 만들지 않는다.** 현행은
`view={["array","keyValue"]}`(`src/algorithms/array/mosAlgorithm/mosAlgorithm-guide.mdx:769`)이고,
질의 재배열은 `matrix`(`rowLabels`=질의 번호, `colLabels`=`[l,r,block(l)]`, `cells`),
√n 블록 분할은 `array` 의 `pointers`+`marked` 로 덮인다. 남는 한계는 **뷰당 슬롯 1개**뿐이고
(`src/_guide-sim/index.tsx` 의 `views.map`), 그때도 "같은 뷰 2회 렌더"가 더 작은 변경이다.

## 승격 조건 (pilot 승인 뒤)

1. `extraViews`/`overrides` 로 검증된 뷰를 `VIEW_REGISTRY` 로 옮긴다.
2. `tools/ci.ts` 에 `check-v2`·`check-proof` 를 편입한다(`comprehension.sh` 는 편입하지 않는다 — 돌리지 않는다).
3. `tools/check-citations.ts:30` 의 `SCAN_GLOBS` 에 `src/algorithms` 를 추가한다 —
   현재 알고리즘 트랙의 `경로:줄번호` 인용은 **아무도 안 본다**.
4. `tools/_baseline/guide-rhythm.tsv` 의 `src/algorithms` **103행**을 이관한다.
   새 산출물이 `-guide.md` 라 `src/**/*-guide.mdx` 스캐너 밖이다.
5. 111편 재집필 배치를 별도 카드로 편성한다.

## 본 저장소에 이미 연 예외 6건 (B0a, 커밋 `b39e515`)

| 파일 | 무엇 | 왜 |
| --- | --- | --- |
| `package.json`+`bun.lock` | devDependencies 8개 | md→HTML 직렬화기가 없었다 |
| `tsconfig.json` | exclude 에 `sandbox/**` | 초안 하나가 GATES 첫 항목을 죽여 병행 카드를 막는다 |
| `tools/check-links.ts` | `check`·`refs` 에서 `verdicts/` 만 제외 | 모델 응답의 인용 링크가 깨진다. 통째로 빼면 `SPEC.md` 검사와 refs 스윕이 함께 눈이 먼다 |
| `tools/ci.ts` | SELF 에 `bun test src/_guide-sim` | 182편이 쓰는데 소비자가 `.mdx` 라 파손이 런타임에서만 드러났다 |
| `src/_guide-sim/index.tsx` | 4곳 + 회귀 9종 | `VIEW_REGISTRY` 가 닫힌 const 라 선개발이 불가능했다 |
| 칸반 | 카드 이동 + 실행 문서 | — |
