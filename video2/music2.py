# 横版配乐：结构跟着剧情走
# 紧张开场 → 倒带 → 轻快律动 → 低落 → 蓄力 → 爆发(火箭) → 底气 → 沉思 → 二次爆发 → 收尾
# 用法：python3 music2.py  （需要先有 timeline.js、events.json、配音 wav）
import json, os
from synth import *

LN, TOTAL, T = load_timeline('timeline.js')
EVENTS = json.load(open('events.json'))
VO_PATH = os.environ.get('VO', '/tmp/claude-0/vo.wav')
OUT = os.environ.get('OUT', '/tmp/claude-0/mix.wav')
MUS, MREV, SFX, SREV = buffers(TOTAL)

# ================= 编排 =================
R0 = T('r1') - 1.15; R1 = T('r1.e') + 0.1
HIT0 = T('o5@0.79') + 0.2

# 1 冷开场：心跳 + 低频嗡鸣 + 钟表滴答，在“139万”处炸开
d = HIT0 - 0.3
place(MUS, 0, (np.sin(2 * np.pi * 55 * tt(d)) * .25 + filt(saw(55, d, 3), 'lowpass', 300) * .3) * env(d, 2.0, 0.2), 1.0)
place(MUS, 0, pad([45, 52, 60, 71], d, 700, 3.0, .3, .09), 1.0, send=MREV, sendgain=.5)
t = 0.4
while t < HIT0 - 0.5:
    place(MUS, t, heartbeat(), .9 if t < T('o5') else 1.1)
    t += 1.0 if t < T('o5') else 0.6
t = T('o1')
while t < T('o5'):
    place(MUS, t, tick(), .6, pan=.5); t += BEAT
place(MUS, T('o5'), riser(HIT0 - 0.3 - T('o5')), .55)
place(MUS, HIT0, pad([45, 52, 57, 60, 64, 71], R0 - HIT0 + .5, 2200, .05, 1.0, .16), 1.0, send=MREV, sendgain=.6)
place(MUS, HIT0, bass(33, R0 - HIT0, .45), 1.0)

# 2 倒带
place(SFX, R0, rewind_fx(R1 - R0), 1.0)
place(MUS, R0, pad([45, 52, 57, 60, 64, 71], R1 - R0 + .3, 2200, .05, .3, .1)[::-1].copy(), .8, send=MREV, sendgain=.5)

# 3 回到 25 岁：温柔钢琴
piano_bed(MUS, MREV, T('r2') - 0.3, T('f1') - 0.35, ['Am', 'F'], 1, 0.9)

# 4 分岔：轻快律动
G0, G1 = T('f1') - 0.35, T('b1') - 0.7
section_groove(MUS, MREV, G0, G1, ['Am', 'F', 'C', 'G'])
place(SFX, G1 - .6, whoosh(.7, False), .5)

# 5 煎熬：只剩钢琴、低垫音和钟表
D0, D1 = G1, T('k1')
piano_bed(MUS, MREV, D0, D1, ['Am', 'Am', 'F', 'E'], 1, .75, pattern=(0, 2, 3, 2))
t = D0
while t < D1: place(MUS, t, tick(), .7, pan=-.4); t += BEAT

# 6 蓄力：噪声上扬 + 加速军鼓 + 四拍底鼓，火箭前留 0.35 秒真空
B0, B1 = T('k1'), T('k3')
place(MUS, B0, riser(B1 - B0 - 0.3), .9)
t = B0; i = 0
while t < B1 - 0.35:
    k = (t - B0) / (B1 - B0); stp = BEAT if k < .35 else BEAT / 2 if k < .6 else BEAT / 4 if k < .85 else BEAT / 8
    place(MUS, t, snare(.2), .2 + .5 * k)
    if abs((t - B0) / BEAT - round((t - B0) / BEAT)) < 1e-3: place(MUS, t, kick(.9), .5 + .3 * k)
    t += stp
place(MUS, B0, pad([45, 52, 57, 60, 64], B1 - B0 - .35, 1200, 2, .05, .1), 1.0, send=MREV, sendgain=.4)

# 7 爆发：火箭 → 本金/收益
X0, X1 = B1, T('c1') - 0.7
section_drop(MUS, MREV, X0, X1, ['Am', 'F', 'C', 'G'])
place(SFX, X1 - .5, whoosh(.8, True), .6)
# 7b 高潮前段：暗色鼓点（电量对比）
Y0, Y1 = X1, T('c4')
section_drop(MUS, MREV, Y0, Y1, ['Am', 'F', 'Dm', 'E'], .8, dark=True)
# 8 “不是钱——”：抽空，只剩高音弦 + 反向镲
Z0, Z1 = T('c4'), T('c5')
place(MUS, Z0, pad([76, 81], Z1 - Z0, 3000, 1.0, .1, .05), 1.0, send=MREV, sendgain=.6)
place(MUS, Z1 - 1.6, rev_cymbal(1.6), .8)
place(MUS, Z1 - 1.0, riser(1.0, 800, 12000), .4)
# 9 底气：巨大冲击 + 史诗和弦
Q0, Q1 = T('c5'), T('t1') - 1.4
place(MUS, Q0, pad(CH['Cadd9'][0] + [48, 72, 76], (Q1 - Q0) / 2 + .8, 2400, .03, .8, .14), 1.0, send=MREV, sendgain=.7)
place(MUS, Q0 + (Q1 - Q0) / 2, pad(CH['G/B'][0] + [47, 74, 79], (Q1 - Q0) / 2 + 1.2, 2400, .5, 1.2, .14), 1.0, send=MREV, sendgain=.7)
place(MUS, Q0, bass(36, (Q1 - Q0) / 2, .5), 1.0); place(MUS, Q0 + (Q1 - Q0) / 2, bass(35, (Q1 - Q0) / 2 + .5, .5), 1.0)
for k in range(0, int((Q1 - Q0) / BEAT)):
    if k % 4 == 0: place(MUS, Q0 + k * BEAT, kick(1.3, 1.0), .6, send=MREV, sendgain=.5)
# 10 沉思：钢琴
P0, P1 = Q1, T('p0') - 1.2
piano_bed(MUS, MREV, P0, P1, ['Am', 'F', 'C', 'G'], 2, .9)
# 11 二次蓄力
U0, U1 = P1, T('p1')
place(MUS, U0, riser(U1 - U0 - .25), .8)
t = U0
while t < U1 - .3:
    k = (t - U0) / (U1 - U0); place(MUS, t, snare(.2), .2 + .5 * k); t += BEAT / (1 if k < .4 else 2 if k < .7 else 4)
t = U0
while t < U1 - .3: place(MUS, t, kick(.9), .5); t += BEAT
place(MUS, U0, pad(CH['G'][0], U1 - U0 - .2, 1500, 1.5, .05, .1), 1.0)
# 12 二次爆发：三句话
V0, V1 = U1, T('e1') - 1.4
section_drop(MUS, MREV, V0, V1, ['C', 'G', 'Am', 'F'], 1.0)
place(SFX, V1 - .3, impact(.5) * .5, .7)
# 13 收尾：钢琴 + 长音，落在 C 大调
W0, W1 = V1, TOTAL
piano_bed(MUS, MREV, W0, W1 - 2.4, ['F', 'G', 'Am', 'Cadd9'], 2, .85)
place(MUS, W1 - 6, pad(CH['Cadd9'][0] + [48], 6, 1500, 2, 3.5, .08), 1.0, send=MREV, sendgain=.6)


add_events(SFX, SREV, EVENTS)
master(MUS, MREV, SFX, SREV, VO_PATH, TOTAL, OUT)
