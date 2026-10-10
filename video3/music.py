# 第一期配乐：跟着剧情走
# 开场紧张 → 讲解轻律动 → 水池停水抽空 → 雪球渐强 → 暴跌静音心跳 → 火箭爆发 → A股稳步律动 → 安静钢琴 → 底气二次爆发 → 收尾
# 用法（在 video3 目录）：python3 music.py   需要 timeline.js、events.json、配音 wav
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'video2'))
from synth import *

LN, TOTAL, T = load_timeline('timeline.js')
EVENTS = json.load(open('events.json'))
VO_PATH = os.environ.get('VO', '/tmp/claude-0/vo3.wav')
OUT = os.environ.get('OUT', '/tmp/claude-0/mix3.wav')
MUS, MREV, SFX, SREV = buffers(TOTAL)

def drone(t0, t1, root=33, level=1.0):
    d = t1 - t0
    if d <= 0: return
    place(MUS, t0, (np.sin(2 * np.pi * mtof(root) * tt(d)) * .25 + filt(saw(mtof(root), d, 3), 'lowpass', 300) * .3) * env(d, min(2.0, d / 3), min(1.0, d / 3)), level)

def riser_to(t_hit, d, level=.8, roll=True):
    place(MUS, t_hit - d, riser(d - .25), level)
    if roll:
        t = t_hit - d
        while t < t_hit - .3:
            k = (t - (t_hit - d)) / d
            place(MUS, t, snare(.2), .15 + .45 * k)
            t += BEAT / (1 if k < .4 else 2 if k < .7 else 4)

# —— 一、冷开场 ——
HIT = T('o4@0.78') + .2
drone(0, HIT - .3)
place(MUS, 0, pad([45, 52, 60, 71], HIT - .3, 700, 3.0, .3, .09), 1.0, send=MREV, sendgain=.5)
t = T('o1')
while t < T('o4'): place(MUS, t, tick(), .55, pan=.5); t += BEAT
riser_to(HIT, HIT - T('o4'), .55, roll=False)
place(MUS, HIT, pad([45, 52, 57, 60, 64, 71], T('o5.e') - HIT + .8, 2200, .05, 1.0, .15), 1.0, send=MREV, sendgain=.6)
place(MUS, HIT, bass(33, T('o5.e') - HIT, .45), 1.0)

# —— 二、工资条：钢琴 + 轻拍 ——
W0, W1 = T('w1') - .4, T('j1') - .5
piano_bed(MUS, MREV, W0, W1, ['Am', 'F', 'C', 'G'], 1, .8)
t = T('w2')
while t < W1 - .2:
    place(MUS, t, kick(.6), .3); place(MUS, t + BEAT, hat(), .2, pan=.3); place(MUS, t + 2 * BEAT, hat(), .25, pan=-.3)
    t += BAR
place(MUS, T('w4@0.45'), sub_drop(1.6), .5)

# —— 三、水池：律动 → 停水后只剩低频 ——
J0, JOFF = T('j1') - .5, T('j4@0.25')
section_groove(MUS, MREV, J0, JOFF - .05, ['Am', 'F', 'C', 'G'], .65)
drone(JOFF, T('x1') - .4, 33, .9)
place(MUS, JOFF, pad([45, 48, 52, 56], T('x1') - .4 - JOFF, 900, .4, .8, .08), 1.0, send=MREV, sendgain=.5)

# —— 四、雪球：渐强 → 暴跌静音 → 熬 → 火箭 ——
X0, CRASH = T('x1') - .4, T('x5@0.4')
section_groove(MUS, MREV, X0, CRASH - .35, ['C', 'G', 'Am', 'F'], .75)
place(MUS, CRASH - 1.4, rev_cymbal(1.2), .4)
place(MUS, CRASH, sub_drop(2.2, 90, 25), .9)
D0, D1 = CRASH + 1.6, T('x9@0.5')
drone(CRASH + .3, D1, 33, .45)
piano_bed(MUS, MREV, D0, D1, ['Am', 'F', 'Am', 'E'], 1, .4, pattern=(0, 2, 3, 2))
ROCK = T('x10@0.72') + .2
riser_to(ROCK, ROCK - T('x9@0.5'), .85)
t = T('x9@0.5')
while t < ROCK - .3: place(MUS, t, kick(.9), .45); t += BEAT
section_drop(MUS, MREV, ROCK, T('a1') - .5, ['Am', 'F', 'C', 'G'], 1.0)

# —— 五、A 股：稳步律动，标普处略抬升，结尾落定 ——
A0, A1 = T('a1') - .5, T('s1') - .5
section_groove(MUS, MREV, A0, T('a5') - .2, ['Am', 'F', 'C', 'G'], .6)
section_groove(MUS, MREV, T('a5') - .2, T('a8'), ['F', 'G', 'C', 'Am'], .7)
place(MUS, T('a8'), pad(CH['Cadd9'][0], A1 - T('a8') + .6, 1400, .6, 1.0, .065), 1.0, send=MREV, sendgain=.6)
place(MUS, T('a8'), bass(36, A1 - T('a8'), .35), 1.0)

# —— 六、为什么常见：安静钢琴 ——
S0, S1 = T('s1') - .5, T('e1') - .5
piano_bed(MUS, MREV, S0, S1, ['Am', 'F', 'Dm', 'E'], 1, .75, pattern=(0, 2, 1, 3))

# —— 七、收尾：切断 → 蓄力 → 底气 → 问题 → 明亮收尾 ——
E0 = T('e1') - .5
DQ = T('e3@0.86')
drone(E0, DQ - .4, 33, .8)
place(MUS, E0, pad([45, 52, 57, 60], DQ - E0 - .3, 1200, .8, .2, .09), 1.0, send=MREV, sendgain=.5)
riser_to(DQ, DQ - T('e3') + .3, .8)
Q1 = T('e4') - .2
place(MUS, DQ, pad(CH['Cadd9'][0] + [48, 72, 76], Q1 - DQ + 1.5, 2400, .03, 1.2, .14), 1.0, send=MREV, sendgain=.7)
place(MUS, DQ, bass(36, Q1 - DQ + .5, .5), 1.0)
for k in range(0, int((Q1 - DQ) / BEAT)):
    if k % 4 == 0: place(MUS, DQ + k * BEAT, kick(1.3, 1.0), .6, send=MREV, sendgain=.5)
piano_bed(MUS, MREV, Q1, T('e5') - .2, ['F', 'G'], 2, .8)
place(MUS, T('e5') - .2, pad(CH['Cadd9'][0] + [48], TOTAL - T('e5') + .2, 1800, .3, 2.5, .1), 1.0, send=MREV, sendgain=.6)
piano_bed(MUS, MREV, T('e5') - .2, TOTAL - 1.5, ['C', 'G'], 1, .7)

add_events(SFX, SREV, EVENTS)
master(MUS, MREV, SFX, SREV, VO_PATH, TOTAL, OUT)
