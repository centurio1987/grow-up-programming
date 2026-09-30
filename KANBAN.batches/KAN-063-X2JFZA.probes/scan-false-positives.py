"""KAN-063 탐침 — authoring-kit 문체 검사기(scan_ai_style.py)의 오탐 둘을 잰다.

실행: python3 KANBAN.batches/KAN-063-X2JFZA.probes/scan-false-positives.py [scan_ai_style.py 경로]
기본 경로는 ~/.claude/plugins/cache/centurio87-plugins/authoring-kit/0.4.1/scripts/scan_ai_style.py.

① P4(느낌표·물결): 원본 그대로 셀 때와, 산문을 가르기 전에 HTML 주석(<!--…-->)을 걷을 때의 걸린 문단 수.
② P1(쉼표 과다): 원본 그대로 셀 때와, 숫자 사이 쉼표(1,000 의 쉼표)를 걷을 때의 걸린 자리 수.
대상은 src/algorithms 아래 *-guide.md 전부. 검사기의 scan() 을 그대로 부르고 입력 글만 바꾼다.
"""
import importlib.util
import os
import re
import sys
from pathlib import Path

path = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser(
    "~/.claude/plugins/cache/centurio87-plugins/authoring-kit/0.4.1/scripts/scan_ai_style.py")
spec = importlib.util.spec_from_file_location("scan_ai_style", path)
mod = importlib.util.module_from_spec(spec)
sys.modules["scan_ai_style"] = mod  # dataclass 가 모듈을 찾는다
spec.loader.exec_module(mod)

COMMENT = re.compile(r"<!--.*?-->", re.S)
DIGIT_COMMA = re.compile(r"(?<=\d),(?=\d{3})")


def count(raw: str, code: str) -> int:
    for f in mod.scan(raw)["findings"]:
        f = f if isinstance(f, dict) else f.__dict__
        if f.get("code") == code:
            return int(f.get("count", 0))
    return 0


guides = sorted(Path("src/algorithms").rglob("*-guide.md"))
p4 = [0, 0, 0]  # 원본 문단 · 주석 걷은 뒤 문단 · 줄어든 편
p1 = [0, 0, 0]
for g in guides:
    raw = g.read_text(encoding="utf-8")
    a, b = count(raw, "P4"), count(COMMENT.sub("", raw), "P4")
    p4[0] += a; p4[1] += b; p4[2] += a > b
    a, b = count(raw, "P1"), count(DIGIT_COMMA.sub("", raw), "P1")
    p1[0] += a; p1[1] += b; p1[2] += a > b
print(f"가이드 {len(guides)}편")
print(f"P4 걸린 문단: 원본 {p4[0]} → HTML 주석 걷으면 {p4[1]} (줄어든 {p4[0]-p4[1]}, 편 {p4[2]})")
print(f"P1 걸린 자리: 원본 {p1[0]} → 숫자 쉼표 걷으면 {p1[1]} (줄어든 {p1[0]-p1[1]}, 편 {p1[2]})")
