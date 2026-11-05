"""Generate the one-page click guide (每页点几下) from the built deck + build/anim.json.
usage: python3 clickguide.py out/bearing_case_v2.pptx build/anim.json out/点击说明.md"""
import json, re, sys
from pptx import Presentation

deck, spec_path, out_md = sys.argv[1:4]
spec = json.load(open(spec_path, encoding='utf-8'))
prs = Presentation(deck)
FIXED = {1: '开场：电机在转', 2: '故障瞬间（视频）', 20: '总结 + 讨论'}
rows, total_clicks, total_min = [], 0, 0.0
for i, sl in enumerate(prs.slides, 1):
    title = FIXED.get(i)
    if not title:
        title = next((sh.text_frame.text for sh in sl.placeholders if sh.placeholder_format.type is not None and 'TITLE' in str(sh.placeholder_format.type)), '')
    steps = spec.get(str(i), [])
    auto = bool(steps) and steps[0]['trigger'] == 'auto'
    clicks = sum(1 for st in steps if st['trigger'] == 'click')
    notes = sl.notes_slide.notes_text_frame.text
    m = re.search(r'约([\d.]+)分钟', notes)
    mins = float(m.group(1)) if m else 0
    what = []
    for l in notes.splitlines():
        if not l.startswith('[点击]'):
            continue
        segs = [x.strip() for x in re.split(r'[：，→—。]', re.sub(r'^\[点击\]\s*', '', l)) if x.strip()]
        w = segs[0] if len(segs[0]) > 2 or len(segs) == 1 else segs[0] + '：' + segs[1]
        what.append(w[:22])
    assert len(what) == sum(1 for st in spec.get(str(i), []) if st['trigger'] == 'click'), f'slide {i}: notes [点击] count != click steps'
    rows.append((i, title, '自动播放' if auto else '—', clicks, '；'.join(f'{k + 1}) {w}' for k, w in enumerate(what)) or '—', mins))
    total_clicks += clicks
    total_min += mins

md = ['# 点击说明（每页点几下）', '',
      f'共 {len(rows)} 页，正文约 {total_min:g} 分钟 + 讨论 3–5 分钟；全片共 {total_clicks} 次点击。"自动"＝换页后自动播放，不用点。', '',
      '| 页 | 标题 | 换页后 | 点击 | 每次点击出现什么 | 用时 |', '|---|---|---|---|---|---|']
for r in rows:
    md.append(f'| {r[0]} | {r[1]} | {r[2]} | {r[3]} | {r[4]} | {r[5]:g} 分 |')
md += ['', '**放映前在 WPS 实测**：第 2 页视频是否自动播放（不播就单击画面）；第 1、8、20 页转动是否连续；第 6 页红灯闪烁、表针摆动；第 9、14、17 页的路径动画终点是否正确。',
       '视频备份：`out/opening.mp4`（嵌入失败时可直接用播放器打开）。']
open(out_md, 'w', encoding='utf-8').write('\n'.join(md) + '\n')
print('\n'.join(md))
