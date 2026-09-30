---
card: KAN-059-PSFTN4
title: 책 빌더의 SVG 그림 인쇄 — 알고리즘 가이드 fig 자리를 책(PDF)에서 어떻게 찍는가
created: 2026-09-29
scope: tools/book/**, src/_viz/patterns/CellStage.tsx, src/_viz/patterns.test.tsx, src/algorithms/array/sparseTableRangeMin/figs/walk-build.svg, src/algorithms/array/sparseTableRangeMin/figs/walk-answer.svg
---

# KAN-059-PSFTN4 — 책 빌더의 SVG 그림 인쇄 — 알고리즘 가이드 fig 자리를 책(PDF)에서 어떻게 찍는가

## 전략
### 목표

KAN-057 이 가이드 도식을 ASCII 에서 SVG 그림(fig)으로 바꿨다. 이 카드가 끝나면 fig 가 있는 가이드가 책 PDF 에서 **그림 한 벌이 한 쪽 안에 온전히** 찍히고, 그렇지 않은 그림은 책 빌드가 이름을 대며 알린다. 110편 전개(KAN-058)가 그림을 늘려도 인쇄에서 깨지는 것은 빌드가 먼저 잡는다.

### 지금 상태 (2026-09-29 main `0e1db0d` 에서 실측)

파일럿 `sparseTableRangeMin` 을 `bun run tools/book/build-book.ts` 로 찍었다(고급 권 795~854쪽, 60쪽).

- **그림은 이미 책에 들어간다.** 책 조각은 `build-html` 의 `build()` 를 그대로 불러(`tools/book/fragment.ts:34`) 그림 9장이 인라인 SVG 로 실린다. 작은 그림 7장(높이 200~600px 대)은 제대로 찍힌다 — 796쪽의 층 그림이 본문 폭 안에 선다.
- **세로로 긴 필름 그림 둘이 깨진다.** `walk-build`(712×2324)와 `walk-answer`(684×2384)는 걸음마다 한 칸씩 세로로 쌓은 `CellStageFilm` 한 장이다(`src/_viz/patterns/CellStage.tsx:448`). A4 본문 높이(297−35.4−25mm ≈ 237mm)의 세 배 가까이 된다.
  - 823쪽·832쪽: 「시뮬레이션 / SCREEN: INTERACTIVE」 머리 줄만 있는 **빈 틀 한 쪽**이 찍힌다. `.gs-mount` 와 `figure` 가 `break-inside: avoid` 라(`tools/book/print-css.ts:156`) 한 쪽에 안 들어가는 그림을 다음 쪽으로 밀고 틀만 남긴다.
  - 그림은 824~826쪽에 틀 없이 이어지고 **쪽 경계에서 걸음 한 칸이 가운데서 잘린다**(824쪽 아래 T6).
  - 걸음 T3~T15 는 빠진 것 없이 한 번씩 찍힌다(쪽별 글자 추출로 확인).
- **폭**: 가장 넓은 그림 712px, 본문 폭 170mm ≈ 642px(96dpi 환산). 824쪽에서는 잘린 자국이 안 보이지만 실제로 줄었는지 넘쳤는지는 확인 안 함 — S1 의 측정이 답한다.
- **ASCII 전제 자리 넷**(`build-book.ts:57` FIT_JS · `print-css.ts:155-245` · `fragment.ts:23` · `build-sample.ts:164`)은 `pre` 만 고르므로 fig 에 해를 끼치지 않는다. 그대로 둔다. 다만 디자인 샘플 목록(`build-sample.ts`)에 그림 블록 항목이 없다.

### 접근 — 재는 검사를 먼저 세우고, 필름만 칸별로 가른다

1. **깨짐을 재는 검사부터 만든다.** 책 빌더는 이미 조각마다 쪽수를 재려고 한 번 조판한다(FIT_JS 가 도는 자리). 그 자리에서 그림 단위(필름이면 걸음 한 칸)마다 상자 크기를 재 본문 상자보다 크면 위반으로 낸다. 지금 main 에서 이 검사가 **필름 둘을 정확히 잡고 나머지 일곱은 통과**해야 한다. 고치기 전에 실패하는 검사가 있어야 고친 뒤 통과가 뜻을 갖는다.
2. **필름은 책에서만 칸별 SVG 로 가른다.** 렌더러가 걸음 칸마다 세로 자리(`data-viz-step` 에 y·높이)를 박고, 책 조각이 그 값으로 필름 한 장을 칸 수만큼의 `<svg viewBox="0 y w h">` 로 나눈다. 칸 하나가 쪽 안에서 안 갈라지는 단위가 되고, 칸과 칸 사이에서는 쪽이 넘어간다. 웹 화면과 커밋된 `figs/*.svg` 모양(그림 하나 = 파일 하나)은 그대로다.
3. **인쇄 CSS 는 그림이 든 `.gs-mount` 만 따로 다룬다.** 필름이 든 틀은 쪽을 넘어가도 되게 풀고, 머리 줄은 첫 칸과 붙어 다니게 한다. 모든 그림 SVG 는 본문 폭을 넘지 않게 줄인다.

### 버린 것

- **인쇄 CSS 만으로 틀을 풀기** — 빈 쪽은 사라지지만 걸음 칸이 쪽 경계에서 반으로 잘린다(824쪽이 그 모양이다). SVG 한 장 안에서는 쪽 나눔 자리를 CSS 로 정할 수 없다.
- **render-figs 가 인쇄용 칸별 SVG 를 따로 뽑아 커밋** — 필름마다 파일이 수십 장 늘고 110편이면 수백 장이 된다. 같은 그림의 두 벌은 어긋날 자리를 만든다.
- **필름을 웹에서도 칸별 그림으로 바꾸기** — 그림 하나 = 파일 하나라는 KAN-057 규약(`fig` 마커 ↔ `FIGS` 키 ↔ SVG 삼자 일치, `tools/check-v2.ts` P6)을 흔든다. 인쇄 문제를 웹 규약을 바꿔 풀 이유가 없다.

### 범위 밖

- **EPUB.** 전자책 빌더는 `feat/book-volumes` 에만 있고 그 워크트리에 아직 커밋 안 된 변경으로 있다(`build-epub.ts`·`epub-css.ts`). main 에 없는 것을 이 카드가 다루지 않는다. 그 브랜치가 병합될 때 인라인 SVG 가 EPUB(XHTML)에서 검사기(epubcheck)를 지나는지는 그쪽 몫이다.
- **`feat/book-volumes` 와 겹치는 파일.** 그 브랜치도 `fragment.ts`·`print-css.ts`·`build-book.ts`·`build-sample.ts` 를 고친다(ASCII 도식을 칸 격자 SVG 로 바꾸는 `grid.ts`). 이 카드는 기다리지 않고 main 위에서 하되, 변경을 **새 함수·새 CSS 묶음으로 덧붙여** 나중 병합에서 충돌 자리를 좁힌다. 먼저 들어가는 쪽이 그대로 서고 뒤에 들어가는 쪽이 푼다.
- ASCII 전제 자리 넷을 걷어내는 일 — 110편이 아직 ASCII 를 쓰고, 등폭 실행 결과처럼 ASCII 가 남는 자리도 있다(SPEC §12).

### 제약

- 책 빌드 산출(`build/book/`)은 `.gitignore` 대상이라 커밋 안 한다. 증거는 수행 내역에 쪽 번호와 명령으로 남긴다.
- 조각 모양이 바뀌므로 `BUILDER_VERSION` 을 올린다(`tools/book/fragment.ts:44`) — 옛 조각과 새 조각이 한 권에 섞이지 않게 한다.
- 전체 빌드는 세 권 111편을 다시 조판한다. 측정 검사를 고칠 때는 `--limit`·`--html-only` 로 줄여 돌리고 마지막에 한 번 전체를 돈다.

## 실행 계획
- [x] `S1` 인쇄 그림 측정 검사 — 책 빌더가 조각을 조판할 때 `figure.gs-fig` 안의 그림 단위(필름은 `data-viz-step` 칸, 아니면 SVG 한 장)마다 상자를 재 본문 상자(폭·높이)를 넘으면 위반으로 낸다. 위반은 편 id·그림 id·치수로 출력하고 종료코드 1. 완료: 지금 main 에서 `walk-build`·`walk-answer` 둘만 「높이 초과」로 잡히고 나머지 일곱은 통과 · 폭 초과 여부가 수로 나온다 · `book.test.ts` 에 위반·통과 시험
- [x] `S2` 필름 칸 경계 — `CellStageFilm` 이 칸마다 `data-viz-step` 에 세로 자리(y·높이)를 박는다. 완료: `render-figs.ts` 로 파일럿 SVG 다시 뽑기 · `render-figs --check` 통과 · 화면 모양 불변(웹 HTML 에서 걸음 그림이 전과 같게 보임) · `patterns.test.tsx` 에 경계값 시험
- [x] `S3` 책에서 필름 가르기 + 인쇄 CSS — `fragment.ts` 에 필름 SVG 를 칸별 `<svg viewBox>` 로 나누는 함수(칠 스타일은 칸마다 싣거나 한 번 공유), `BUILDER_VERSION` 올림. `print-css.ts` 에 그림 묶음 규칙(그림 SVG 는 본문 폭까지 줄임 · 필름 틀은 쪽 넘김 허용 · 머리 줄은 첫 칸과 붙임 · 칸은 안 갈라짐). 완료: S1 검사 위반 0 · 파일럿 PDF 에 빈 틀 쪽 없음 · T3~T15 가 한 번씩, 쪽 경계에서 잘린 칸 없음(쪽 이미지로 확인)
- [x] `S4` 디자인 샘플·문서 — `build-sample.ts` 목록에 「그림」·「걸음 필름」 블록 항목, `tools/book/README.md` 조판 규칙에 그림 줄. 완료: `build-sample.ts` 가 돌고 새 항목이 샘플 PDF 에 찍힘
- [x] `S5` 전체 검증 + 검토서 + 검토로 이동. 완료: 아래 「검증」 전부 · 수행 내역에 쪽 번호 증거 · 검토서 판단 항목에 `feat/book-volumes` 병합 순서 판단을 올림

## 검증
```bash
bun run tools/book/build-book.ts                 # 세 권 전체 — S1 측정 검사 위반 0, 종료코드 0
bun test tools/book src/_viz                     # 측정·가르기·경계값 시험
bun run tools/render-figs.ts --check             # 파일럿 SVG 가 렌더러와 같다
bun run tools/ci.ts all                          # CI 4모드 + 게이트
bunx tsc --noEmit
bunx --bun @biomejs/biome check tools/book src/_viz   # 새로 쓴 곳 경고 0
```

눈으로 확인할 것(쪽 이미지, `pdftoppm -f <쪽> -l <쪽> -r 40 -png`):

- 파일럿 장에서 「시뮬레이션」 머리 줄만 있는 빈 쪽이 없다(고치기 전: 고급 권 823·832쪽).
- 걸음 칸 T3~T15 가 한 번씩 찍히고 쪽 경계에서 반으로 잘린 칸이 없다.
- 작은 그림 일곱이 전과 같은 크기로 본문 폭 안에 있다.

실패로 보는 것: S1 검사가 고치기 전 main 에서 필름 둘을 못 잡으면 검사가 틀린 것이다 — 고친 뒤의 통과도 믿지 않는다.

## 수행 내역
<!-- KANBAN:LOG append-only — 아래로만 덧붙인다. 위를 고치지 않는다. -->
- 2026-09-29T01:32 · s:e2ca442a — `전략` 섹션 교체
- 2026-09-29T01:32 · s:e2ca442a — `실행 계획` 섹션 교체
- 2026-09-29T01:32 · s:e2ca442a — `검증` 섹션 교체
- 2026-09-29T01:38 · s:59ac9d04 · S1 doing — 착수
- 2026-09-29T01:44 · s:59ac9d04 · S1 done — 측정 검사(tools/book/figures.ts) — 고치기 전 main 에서 그림 9장 중 walk-build 2091px·walk-answer 2232px > 본문 856px 둘만 높이 초과, 폭 초과 셋(0.98·0.90·0.94배)은 알림. 세 권 빌드 종료 1
- 2026-09-29T01:44 · s:59ac9d04 · S2 doing — 착수
- 2026-09-29T01:44 · s:59ac9d04 · S2 done — CellStageFilm 이 칸마다 data-viz-y·data-viz-h 를 박는다(filmCells) — 파일럿 SVG 재렌더, 두 속성 외 바이트 동일, render-figs --check 통과. walk-build 칸 8(282~302px), walk-answer 칸 5(468~488px)
- 2026-09-29T01:44 · s:59ac9d04 · S3 doing — 착수
- 2026-09-29T01:46 · s:59ac9d04 · S3 done — fragment.ts splitFilms 가 필름을 칸별 SVG 로 가름(BUILDER_VERSION 5) + print-css 그림 묶음. 고급 권 빌드: 높이 초과 0 · 파일럿 60→58쪽(795~852) · 머리 줄+첫 칸 822·830쪽, T4~T10 823~825, T12~T15 831~833 — 빈 틀 쪽 없음, 잘린 칸 없음(쪽 이미지 확인)
- 2026-09-29T01:47 · s:59ac9d04 · S4 doing — 착수
- 2026-09-29T01:51 · s:59ac9d04 · S4 done — build-sample 에 「그림」·「걸음 필름」 항목, README 조판 규칙 두 줄. 샘플이 SVG 안 <style> 뒤를 통째로 놓치던 happy-dom 문제(파일럿 장 표 0/89)를 자리표로 우회 — 샘플 종료 0, 103쪽, 17·18쪽에 견본
- 2026-09-29T02:01 · s:59ac9d04 · S5 doing — 착수
- 2026-09-29T02:01 · s:59ac9d04 — 검증: 세 권 전체 빌드 종료 0(그림 9장 높이 초과 0 · 초급 750·중급 1272·고급 1518쪽) · bun test tools/book src/_viz 60 통과 · render-figs --check 통과 · tsc 통과 · biome tools/book src/_viz 경고 0 · ci.ts all ①②④ 통과 ③ 판정 제외, 게이트는 인용 1건(이 카드 전략 절 인용이 대장 미등록인 채 줄이 밀림) → 줄번호 고치고 --update 뒤 gates 13단계 통과
- 2026-09-29T02:02 · s:59ac9d04 · S5 done — 검증 전부 통과, 검토서 작성 — 판단 항목 둘(전자책 브랜치 병합 순서 · 넓은 그림 알림)
