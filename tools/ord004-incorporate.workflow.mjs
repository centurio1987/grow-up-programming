export const meta = {
  name: 'ord004-incorporate-review',
  description: 'ORD-004 사실성 카테고리: 외부검토(codex/agy) 유효 지적 + 게이트 갭을 신규 temp에 반영→G1/G4/자기검증 재확인→(FAIL이던 것만) 재채점',
  phases: [
    { title: 'Incorporate', detail: 'sonnet가 유효 지적만 선별 반영 + 게이트 갭 수정 + 재검증' },
    { title: 'Regate', detail: '이전 게이트 FAIL이던 topic만 재채점' },
  ],
}

// args: { category, dir, items: [{name, newFile, reviewFile, kind, gateGaps|null, wasFail}] }
const A = typeof args === 'string' ? JSON.parse(args) : (args || {})
const items = A.items
if (!Array.isArray(items)) throw new Error('args.items 배열 필요. args 타입=' + typeof args)
log(`ORD-004 검토 반영: ${A.category} — ${items.length}종 (재채점 대상 ${items.filter(i => i.wasFail).length}종)`)

const CANVAS = {
  algo: '.claude/skills/guide-for-problem/algorithm-guide-canvas.md',
  ds: '.claude/skills/guide-for-problem/data-structure-guide-canvas.md',
}

function incPrompt(it) {
  const g4Line = it.kind === 'algo'
    ? `, \`bun run tools/guide-preview/check-mermaid.ts ${it.newFile}\` (G4)`
    : ' (자료구조라 mermaid 없음 — G4 n/a)'
  const gapLine = it.gateGaps
    ? `\n## 품질 게이트 갭(반드시 수정)\n직전 채점에서 이 가이드는 게이트 FAIL이었다. 아래 갭을 모두 해소하라(캔버스/TONE 규칙 준수):\n${it.gateGaps}\n`
    : `\n## 게이트\n직전 채점 PASS. 게이트 갭 없음 — 아래 외부검토 반영으로 MUST 항목이 깨지지 않게 주의.\n`
  return `너는 ORD-003 가이드 교정자다. **${it.name}** 신규 가이드(임시본)에 대해 (1) 외부검토(ChatGPT/Gemini)의 **유효한 사실성·논리·복잡도·모순·누락 지적만** 반영하고, (2) 아래 품질 게이트 갭이 있으면 함께 수정한다. 파일을 직접 편집한다.

## 대상 파일 (편집)
${it.newFile}

## 필독
- 외부검토 원문: ${it.reviewFile}
- 캔버스(집필 규격): ${CANVAS[it.kind]}
- 톤(강제): .claude/skills/guide-for-problem/assets/TONE_REFERENCE.md
- 체크리스트: .claude/skills/guide-for-problem/assets/QUALITY_CHECKLIST.md
${gapLine}
## 반영 원칙 (엄격)
- **반영할 것**: 사실 오류(복잡도 분석 오류·틀린 수식·표준 알고리즘과 어긋난 동작), 내부 모순(정의≠사용, 트레이스·그림·본문 불일치, 인덱스 오류), 논리 비약(증명 골자 누락), 핵심 용어·기호 미정의, 잘못된 단정. 특히 **트레이스/손검산 수치 오류**와 **자기 점검 문제가 존재하지 않는 절을 참조**하는 류의 모순은 반드시 고친다.
- **무시할 것**: 순수 문체 취향, "더 있으면 좋겠다"류 확장 제안, 캔버스 규격과 배치되는 요구(예: 없는 절 추가 강요), "추정" 딱지가 붙은 불확실한 지적 중 사실 근거가 약한 것. 자료구조 캔버스에 mermaid를 넣으라는 류의 지적도 무시(규격 위반).
- 반영하되 **캔버스 골격·헤딩·톤(존댓말·ascii·헷갈리는 포인트·확인질문)** 은 유지. 문서 안에 "이 절은 생략합니다" 류 집필 메타가 있으면 삭제(TONE 금지목록). 캔버스 내부 절번호(3.1/3.2/3.3 등)가 본문에 노출됐으면 실제 절 제목으로 치환.
- 프론트매터는 넣지 마라(전환 단계에서 부여).

## 수치·코드 정합 (필수)
- 본문 코드/트레이스/시뮬 steps를 수정했으면, 코드를 ${it.dir}/_scratch/${it.name}.ts로 추출해 \`bun\`으로 실행해 **모든 수치가 실측과 일치**하는지 재확인하라(대표+엣지+무작위 교차검증). 불일치면 실측에 맞춘다.
- 편집 후 반드시 실행: \`bun run tools/guide-preview/compile-check.ts ${it.newFile}\` (G1)${g4Line}. 둘 다 통과해야 한다(실패 시 고쳐서 통과).

## 반환(StructuredOutput)
g1/g4 결과, incorporated(반영한 지적 요지 3~6개 배열), rejected(무시한 지적과 사유 1~4개 배열), scratchReVerified(수치 수정이 있었으면 재실행 검증했는지), note(한 줄).`
}

const INC_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['g1', 'g4', 'incorporated', 'rejected', 'scratchReVerified', 'note'],
  properties: {
    g1: { type: 'string', enum: ['pass', 'fail'] },
    g4: { type: 'string', enum: ['pass', 'n/a', 'fail'] },
    incorporated: { type: 'array', items: { type: 'string' } },
    rejected: { type: 'array', items: { type: 'string' } },
    scratchReVerified: { type: 'boolean' },
    note: { type: 'string' },
  },
}

function gatePrompt(it) {
  return `너는 ORD-003 품질 게이트 채점관이다. 아래 신규 가이드를 채점만 한다(수정 금지).

대상: ${it.newFile}
Read: 대상 / ${CANVAS[it.kind]} / .claude/skills/guide-for-problem/assets/QUALITY_CHECKLIST.md / .claude/skills/guide-for-problem/assets/TONE_REFERENCE.md

배경: 직전 채점 FAIL이었고 외부검토 반영+게이트 갭 수정을 거쳤다. G1/G4는 재실행 확인됨. E3(본문 코드 _scratch 자기검증)는 완료로 간주. ${it.kind === 'ds' ? '자료구조 캔버스 5단계·mermaid 없음(정당). B6/C4 해당없음.' : '알고리즘 캔버스 10단계. 최적화 사다리 없으면 5~8 생략 정당한지 확인.'}

QUALITY_CHECKLIST 전 항목(A~F, G1/G4 제외) 충족/미흡/해당없음 + 본문 인용 평가. PASS = MUST 전부 + SHOULD 미흡 ≤2 + IF-APPLICABLE 충족/정당생략.

StructuredOutput: verdict(PASS/FAIL), mustPass, mustTotal, shouldMiss, topGaps(FAIL이면 "[코드] 위치→조치" 3개, PASS면 "없음"), oneLine.`
}
const GATE_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['verdict', 'mustPass', 'mustTotal', 'shouldMiss', 'topGaps', 'oneLine'],
  properties: {
    verdict: { type: 'string', enum: ['PASS', 'FAIL'] },
    mustPass: { type: 'number' }, mustTotal: { type: 'number' },
    shouldMiss: { type: 'number' }, topGaps: { type: 'string' }, oneLine: { type: 'string' },
  },
}

const results = await pipeline(
  items,
  (it) => agent(incPrompt(it), { label: `inc:${it.name}`, phase: 'Incorporate', model: 'sonnet', agentType: 'general-purpose', schema: INC_SCHEMA })
    .then((r) => ({ it, inc: r })),
  ({ it, inc }) => {
    if (!inc) return { name: it.name, kind: it.kind, newFile: it.newFile, inc: null, gate: null, status: 'inc-failed' }
    if (!it.wasFail) return { name: it.name, kind: it.kind, newFile: it.newFile, inc, gate: null, status: inc.g1 === 'pass' ? 'ok' : 'g1-fail' }
    return agent(gatePrompt(it), { label: `regate:${it.name}`, phase: 'Regate', model: 'sonnet', agentType: 'general-purpose', schema: GATE_SCHEMA })
      .then((v) => ({ name: it.name, kind: it.kind, newFile: it.newFile, inc, gate: v, status: v && v.verdict === 'PASS' ? 'ok' : 'regate-fail' }))
  },
)

const ok = results.filter((r) => r && r.status === 'ok')
const bad = results.filter((r) => !r || r.status !== 'ok')
log(`검토 반영 완료: OK ${ok.length}/${items.length}${bad.length ? ` · 미해결 ${bad.map((r) => r?.name || '?').join(', ')}` : ''}`)
return { category: A.category, ok, bad, results }
