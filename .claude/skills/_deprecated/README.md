# _deprecated — authoring-kit 플러그인이 대체한 자산

**아직 지우지 않는다.** shadow run 과 실제 신규 집필 1건이 통과한 뒤에 지운다.
문제가 생기면 여기서 되돌린다.

| 옮긴 것 | 대체한 것 |
| --- | --- |
| `_shared/STYLE_GUIDE.md` | L1 `voices/tony` — 이 프로젝트의 글은 `ppangto-teacher` 가 쓴다. 이 파일은 애초에 **다른 저자(tony)의 문체**였고, 존재하지 않는 스킬(`tech-deepdive`·`review-writing`)을 참조하는 죽은 문서였다 |
| `_shared/NATURAL_KOREAN_GUIDE.md` | L0 `L0_NATURAL_KOREAN.md` — blog 판본의 진부분집합이라 이관 손실 0. §D(D1~D6) 6개 조항을 새로 받는다 |
| `guide-for-problem/assets/TONE_REFERENCE.md` | L1 `voices/ppangto-teacher` — blog 의 `ppangto-teacher-voice.md` 와 문자 단위로 같은 문서였다. 하나로 통합 |
| `guide-for-problem/assets/QUALITY_CHECKLIST.md` | L0 `QUALITY_RUBRIC.md`(공통 A·E·F·V축) + `specs/algo-guide`·`specs/ds-guide` 의 `principles`(B·C·D·G축) |
| `gen-problem/assets/PROBLEM_QUALITY_CHECKLIST.md` | 같은 방식 — 공통분은 L0, 문제 고유(힌트 금지 D축)는 `specs/problem` |
| `*/scripts/review-*.sh` | `review-external.sh` — 셋의 diff 는 프롬프트 3축뿐이었다. 축은 `review-axes/{guide,problem}.md` 로 |

## 남긴 것 (프로젝트 소유)

- `guide-for-problem/*-canvas.md` — 템플릿. spec 이 `template_ref` 로 참조한다
- `guide-for-problem/simulation-scaffold.md` — `#guide-sim` 규격. 이 프로젝트의 렌더 계약
- `solving-problem-canvas.md` — 구 템플릿(사용 금지). 이력 보존용
