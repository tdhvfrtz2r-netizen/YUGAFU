# 定投宽基 配乐（纯音乐，无口播）：100 BPM，一小节 2.4 秒，和画面同一套小节号
# 开场钱币渐强 → 揭晓重拍 → 片名 → 森林轻律动 → 定投律动 + 顿悟 → 前提处收紧 → 真实数据 → 风暴（雷雨、心跳）
# → 天晴大爆发 → 雪球一路蓄力 → 46 万最大一拍 → 温暖收尾
# 用法（在 video4 目录）：python3 music.py   需要 events.json（node render.js events 导出）
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'video2'))
from synth import *

D = json.load(open('events.json'))
TOTAL, EVENTS = D['total'], D['events']
OUT = os.environ.get('OUT', 'mix.wav')
MUS, MREV, SFX, SREV = buffers(TOTAL)
b = lambda x: x * BAR
E8 = BAR / 8

# ---------------- 新乐器 ----------------
def lead(n, d, gain=.16, vib=.004):
    t = tt(d); f = mtof(n) * (1 + vib * np.sin(2 * np.pi * 5.2 * t) * np.clip(t / .4, 0, 1))
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) * .8 + .25 * np.sin(2 * ph) + .08 * np.sin(3 * ph)
    y = filt(y, 'lowpass', 3800)
    return y * env(d, .03, min(.35, d * .5)) * gain

def marimba(n, d=.6, gain=.2):
    t = tt(d); f = mtof(n)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t * 7) + .35 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 22) + .1 * np.sin(2 * np.pi * f * 10 * t) * np.exp(-t * 40)
    return y * env(d, .002, .05) * gain

def sub(n, d, gain=.4):
    t = tt(d); return np.sin(2 * np.pi * mtof(n) * t) * env(d, .02, .2) * gain

def noise_bed(d, lo=300, hi=3000, gain=.1):
    return filt(rng.standard_normal(int(d * SR)), 'bandpass', [lo, hi]) * gain

PROG = {'C': ([60, 64, 67, 71], 36), 'G': ([59, 62, 67, 69], 31), 'Am': ([57, 60, 64, 67], 33), 'F': ([57, 60, 65, 67], 29),
        'Em': ([55, 59, 64, 67], 28), 'Dm': ([57, 62, 65, 69], 26), 'E': ([56, 59, 64, 68], 28), 'Fmaj': ([53, 57, 60, 64], 29), 'Gsus': ([55, 60, 62, 67], 31)}

def chords(t0, t1, prog, per=1):
    out = []; t = t0; i = 0
    while t < t1 - .05: out.append((t, min(BAR * per, t1 - t), prog[i % len(prog)])); t += BAR * per; i += 1
    return out

def pads(t0, t1, prog, bright=1500, gain=.07, per=1, a=.4):
    for (cs, d, c) in chords(t0, t1, prog, per):
        notes, root = PROG[c]
        place(MUS, cs, pad(notes, d + .5, bright, a, .6, gain), 1, send=MREV, sendgain=.5)

def basses(t0, t1, prog, pattern=(0, 3, 6, 10, 13), gain=.32, grit=.2, per=1):
    for (cs, d, c) in chords(t0, t1, prog, per):
        root = PROG[c][1]
        for s in pattern:
            st = cs + s * STEP
            if st < t1 and st < cs + d: place(MUS, st, bass(root + 12, .26, gain, grit), 1)

def arps(t0, t1, prog, inst='pluck', gain=1.0, bright=1.0, every=2, octave=12):
    for (cs, d, c) in chords(t0, t1, prog):
        notes, _ = PROG[c]; seq = [notes[0], notes[2], notes[1] + 12, notes[2], notes[3], notes[1] + 12, notes[2] + 12, notes[1]]
        for s in range(0, 16, every):
            st = cs + s * STEP
            if st >= t1: break
            n = seq[(s // every) % 8] + octave
            sig = pluck(n, .32, .09 * bright) if inst == 'pluck' else marimba(n, .5, .12 * bright)
            place(MUS, st, sig, gain, pan=(-.4 if (s // every) % 2 else .4), send=MREV, sendgain=.35)

def drums(t0, t1, kick_steps=(0, 8), clap_steps=(4, 12), hats=True, level=1.0, open_hat=True):
    t = t0
    while t < t1 - .01:
        for s in range(16):
            st = t + s * STEP
            if st >= t1: break
            if s in kick_steps: place(MUS, st, kick(.9), .6 * level)
            if s in clap_steps: place(MUS, st, clap(), .45 * level, send=MREV, sendgain=.3)
            if hats and s % 2 == 0: place(MUS, st + (.015 if s % 4 == 2 else 0), hat(), (.42 if s % 4 == 2 else .22) * level, pan=.3)
            if open_hat and s == 14: place(MUS, st, hat(True), .2 * level, pan=-.3)
        t += BAR

def melody(t0, notes, level=1.0, inst=lead, oct=0):
    """notes: [(八分音符位置, midi, 时长八分音符数)]"""
    for (p, n, d) in notes:
        place(MUS, t0 + p * E8, inst(n + oct, d * E8 + .25), level, pan=.08, send=MREV, sendgain=.5)

MOTIF_A = [(0, 76, 3), (3, 74, 1), (4, 72, 4), (8, 74, 3), (11, 67, 5), (16, 72, 3), (19, 71, 1), (20, 69, 4), (24, 69, 3), (27, 67, 5)]
MOTIF_B = [(0, 76, 3), (3, 74, 1), (4, 72, 4), (8, 74, 3), (11, 79, 5), (16, 76, 3), (19, 74, 1), (20, 72, 4), (24, 72, 2), (26, 74, 2), (28, 76, 4)]

def riser_to(t_hit, d, level=.7, roll=True):
    place(MUS, t_hit - d, riser(d - .2), level)
    if roll:
        t = t_hit - d
        while t < t_hit - .25:
            k = (t - (t_hit - d)) / d
            place(MUS, t, snare(.2), .12 + .4 * k)
            t += BEAT / (1 if k < .4 else 2 if k < .75 else 4)

def drone(t0, t1, root=33, level=1.0):
    d = t1 - t0
    place(MUS, t0, (np.sin(2 * np.pi * mtof(root) * tt(d)) * .25 + filt(saw(mtof(root), d, 3), 'lowpass', 260) * .3) * env(d, min(2.0, d / 3), min(1.2, d / 3)), level)

# ================= 编曲 =================
# —— 开场：钱一枚枚落下（0–8）——
place(MUS, 0, piano(57, 4.5, .8), .9, send=MREV, sendgain=.6); place(MUS, .02, piano(64, 4.5, .6), .9, send=MREV, sendgain=.6); place(MUS, .04, piano(71, 4.5, .5), .9, send=MREV, sendgain=.6)
pads(0, b(1.5), ['Am'], 900, .06, 1, 1.2)
t = 0.0
while t < b(1.5): place(MUS, t, tick(), .5, pan=.4); t += BEAT
for i, (t0, lvl) in enumerate([(b(1.5), .5), (b(2.5), .7), (b(3.5), .85), (b(4.5), 1.0)]):
    arps(t0, t0 + BAR, ['Am', 'F', 'C', 'G'][i:i + 1], 'pluck', lvl, .7 + .1 * i, every=2 if i < 2 else 1)
    pads(t0, t0 + BAR, ['Am', 'F', 'C', 'G'][i:i + 1], 900 + 500 * i, .05 + .01 * i)
    basses(t0, t0 + BAR, ['Am', 'F', 'C', 'G'][i:i + 1], (0, 6, 10) if i < 2 else (0, 3, 6, 10, 13), .26 + .03 * i)
drums(b(2.5), b(5.5), kick_steps=(0, 8), clap_steps=(), level=.6)
drums(b(4.5), b(5.5), kick_steps=(0, 4, 8, 12), clap_steps=(4, 12), level=.75, open_hat=False)
riser_to(b(6), b(1.4), .75)
REV = b(6)
pads(REV, b(8), ['Fmaj', 'Gsus'], 2200, .12, 1, .02)
place(MUS, REV, sub(29, BAR, .5), 1); place(MUS, REV + BAR, sub(31, BAR, .45), 1)
melody(REV + BAR * .5, [(0, 72, 2), (2, 71, 2), (4, 69, 3), (8, 67, 4)], .7, inst=lambda n, d: piano(n, d + 1, .8))

# —— 片名（8–10）——
place(MUS, b(8), chime(), .7, send=MREV, sendgain=.6)
pads(b(8), b(10), ['C', 'G'], 2000, .08)
melody(b(8), [(0, 79, 2), (2, 76, 2), (4, 74, 2), (6, 72, 6)], .6, inst=lambda n, d: bell(mtof(n), d + .8, .16))
arps(b(8), b(9.6), ['C', 'G'], 'marimba', .6, .9, every=2)
place(MUS, b(9.5), rev_cymbal(1.4), .25)

# —— 森林（10–24）——
arps(b(10), b(12.5), ['C', 'G'], 'marimba', .8, 1.0, every=2)
pads(b(10), b(12.5), ['C', 'G'], 1300, .05)
arps(b(12.5), b(13.4), ['Am'], 'marimba', .6, .8, every=2)
pads(b(12.5), b(13.5), ['E'], 900, .06)
place(MUS, b(13.35), sub_drop(1.4), .45)
FR = b(13.5)
pads(FR, b(24), ['C', 'G', 'Am', 'F'], 1800, .06)
arps(FR, b(24), ['C', 'G', 'Am', 'F'], 'marimba', .85, 1.0, every=2)
basses(b(14), b(24), ['C', 'G', 'Am', 'F'], (0, 6, 10), .28, .15)
drums(b(14), b(17), kick_steps=(0, 10), clap_steps=(8,), level=.55)
drums(b(17), b(24), kick_steps=(0, 7, 10), clap_steps=(4, 12), level=.65)
melody(b(14), MOTIF_A, .55)
melody(b(21), MOTIF_B[:7], .6)

# —— 定投（24–46）——
DC = b(24)
pads(DC, b(34), ['Am', 'F', 'C', 'G'], 1700, .06)
arps(DC, b(34), ['Am', 'F', 'C', 'G'], 'pluck', .85, .9, every=2)
basses(DC, b(34), ['Am', 'F', 'C', 'G'], (0, 3, 6, 10, 13), .28, .25)
drums(DC, b(28), kick_steps=(0, 8), clap_steps=(4, 12), level=.55)
drums(b(28), b(34), kick_steps=(0, 7, 10), clap_steps=(4, 12), level=.68)
riser_to(b(34.2), b(1.1), .5, roll=False)
# 顿悟：+25%
AH = b(34.2)
pads(AH, b(37), ['F', 'G', 'C'], 2600, .09)
arps(AH, b(37), ['F', 'G', 'C'], 'pluck', 1.0, 1.1, every=1)
basses(AH, b(37), ['F', 'G', 'C'], (0, 3, 6, 8, 11, 14), .32, .35)
drums(AH, b(37), kick_steps=(0, 4, 8, 12), clap_steps=(4, 12), level=.75)
melody(b(34.5), MOTIF_B[:7], .55, oct=0)
# 前提：收紧
pads(b(37), b(41), ['Am', 'Em', 'F', 'E'], 1100, .07)
arps(b(37), b(41), ['Am', 'Em', 'F', 'E'], 'pluck', .55, .7, every=4)
drums(b(37), b(41), kick_steps=(0,), clap_steps=(8,), hats=False, level=.55)
place(MUS, b(38.55), sub_drop(1.6), .45)
place(MUS, b(41), impact(.5) * .8, .8, send=MREV, sendgain=.4)
pads(b(41), b(42), ['C'], 2400, .1)
# 真实 A 股：稳步向前
pads(b(42), b(46), ['Am', 'F', 'C', 'G'], 1600, .07)
arps(b(42), b(46), ['Am', 'F', 'C', 'G'], 'pluck', .8, .9, every=2)
basses(b(42), b(46), ['Am', 'F', 'C', 'G'], (0, 6, 10), .3, .25)
drums(b(42), b(46), kick_steps=(0, 8), clap_steps=(4, 12), level=.6)
melody(b(44.65), [(0, 72, 2), (2, 74, 2), (4, 76, 6)], .5)

# —— 风暴（46–56）——
ST = b(46)
drone(ST, b(56.2), 33, .9)
pads(ST, b(52), ['Am', 'Am', 'F', 'E'], 700, .06, 1, 1.0)
for i in range(int((b(52) - ST) / BEAT)):
    if i % 2 == 0: place(MUS, ST + i * BEAT, heartbeat(), .32 + .2 * (i % 8 == 0))
for k, (t0, n) in enumerate([(b(47.5), 69), (b(48.5), 64), (b(49.5), 65), (b(50.5), 64)]): place(MUS, t0, piano(n, 3.5, .6), .7, send=MREV, sendgain=.7)
# 转折：同样的钱买更多 → 打折 → 蓄力
pads(b(52), b(56), ['F', 'C', 'G', 'Gsus'], 1300, .07)
arps(b(52), b(56), ['F', 'C', 'G', 'Gsus'], 'pluck', .7, .8, every=2)
drums(b(52), b(55), kick_steps=(0, 8), clap_steps=(), hats=False, level=.5)
riser_to(b(56), b(1.6), .8)
# 天晴：大爆发
section_drop(MUS, MREV, b(56), b(60), ['F', 'G', 'C', 'Am'], .8)
melody(b(56), MOTIF_B, .7)

# —— 雪球（60–68）蓄力 ——
SN = b(60)
place(MUS, SN, piano(48, 4, .8), .8, send=MREV, sendgain=.6)
pads(SN, b(68), ['C', 'G', 'Am', 'F'], 1200, .05)
arps(b(61), b(64), ['C', 'G', 'Am'], 'marimba', .7, .9, every=4)
arps(b(64), b(66), ['F', 'C'], 'pluck', .8, 1.0, every=2)
arps(b(66), b(68), ['G', 'Gsus'], 'pluck', 1.0, 1.2, every=1)
basses(b(62), b(68), ['C', 'G', 'Am', 'F', 'G', 'Gsus'], (0, 6, 10), .3, .3)
drums(b(62), b(64), kick_steps=(0,), clap_steps=(), level=.5)
drums(b(64), b(66), kick_steps=(0, 8), clap_steps=(4, 12), level=.6)
drums(b(66), b(67.5), kick_steps=(0, 4, 8, 12), clap_steps=(4, 12), level=.75)
riser_to(b(68), b(2), .9)
# 46 万：最大一拍
BIG = b(68)
place(MUS, BIG, pad(PROG['C'][0] + [48, 72, 76, 79], b(4) + 1.5, 2600, .03, 1.5, .16), 1, send=MREV, sendgain=.7)
place(MUS, BIG, supersaw_stab([48, 55, 60, 64], 2.4, .18), 1, send=MREV, sendgain=.5)
section_drop(MUS, MREV, BIG, b(71.5), ['C', 'G', 'Am', 'F'], 1.05)
for i, c in enumerate(['C', 'G', 'Am', 'F']): place(MUS, BIG + i * BAR, sub(PROG[c][1], BAR, .5), 1)
melody(BIG + BAR * .5, [(0, 79, 3), (3, 76, 1), (4, 74, 4), (8, 76, 4), (12, 72, 8)], .7)

# —— 收尾（72–80.6）——
EN = b(72)
piano_bed(MUS, MREV, EN, b(80), ['C', 'G', 'Am', 'F'], 1, .75, pattern=(0, 2, 1, 3, 2, 1))
pads(EN, b(80), ['C', 'G', 'Am', 'F'], 1400, .05)
melody(b(76), MOTIF_A, .45)
place(MUS, b(80), piano(48, 6, .8), .9, send=MREV, sendgain=.7)
place(MUS, b(80), pad(PROG['C'][0], 4, 1200, .1, 3.0, .08), 1, send=MREV, sendgain=.6)

# 风暴雨声
rd = b(56.6) - b(46.4)
rain = filt(rng.standard_normal((int(rd * SR), 2)), 'bandpass', [900, 7000]) * .12 + filt(rng.standard_normal((int(rd * SR), 2)), 'lowpass', 400) * .18
rain *= np.minimum(1, np.minimum(tt(rd) / 2.0, (rd - tt(rd)) / 1.5))[:, None]
place(SFX, b(46.4), rain, .55)

# ---------------- 音效 ----------------
def crack():
    y = np.zeros(int(.9 * SR))
    for i in range(7):
        s = int((i * .045 + rng.uniform(0, .02)) * SR); c = filt(rng.standard_normal(int(.06 * SR)), 'bandpass', [600, 4000]) * np.exp(-tt(.06) * 70)
        y[s:s + len(c)] += c * (1 - i / 9)
    return y * .8

def thud(): return sub_drop(.9, 90, 40) * .9 + filt(rng.standard_normal(int(.9 * SR)), 'lowpass', 300) * np.exp(-tt(.9) * 9) * .6

def pops(d):
    y = np.zeros(int((d + .3) * SR)); n = int(d * 28)
    for i in range(n):
        p = pop() * rng.uniform(.25, .6); s = int(rng.uniform(0, d) * SR); y[s:s + len(p)] += p[:len(y) - s]
    return y

def chips_fx(n):
    k = max(2, int(3 + n * 8)); y = np.zeros(int((k * .035 + .3) * SR))
    for i in range(k):
        c = filt(rng.standard_normal(int(.03 * SR)), 'bandpass', [2500, 6500]) * np.exp(-tt(.03) * 160) * .5 + bell(rng.uniform(2200, 3200), .08, .05, .3)[:int(.03 * SR)]
        s = int(i * .035 * SR); y[s:s + len(c)] += c
    return y

def glide(f0, f1, d=1.0):
    t = tt(d); f = f0 * (f1 / f0) ** (t / d); y = np.sin(2 * np.pi * np.cumsum(f) / SR)
    return y * env(d, .05, .3) * .25

def thunder(a):
    d = 4.0; t = tt(d)
    crack_ = filt(rng.standard_normal(len(t)), 'highpass', 1500) * np.exp(-t * 14) * .6
    rumble = filt(rng.standard_normal(len(t)), 'lowpass', 140) * (np.exp(-t * .9) * (1 + .4 * np.sin(t * 9))) * 1.6
    return (crack_ + rumble) * a

def roll(d):
    t = tt(d); k = t / d
    y = tv_filter(rng.standard_normal(len(t)), 200 + 500 * k, 'lowpass') * (.15 + .45 * k)
    return y * np.minimum(1, (d - t) / .3)

def step():
    return filt(rng.standard_normal(int(.08 * SR)), 'bandpass', [200, 1200]) * np.exp(-tt(.08) * 50) * .5

for e in EVENTS:
    t, k, a = e['t'], e['kind'], e['amp']
    if k == 'coin': place(SFX, t, coin_clink(), .55 * a, pan=rng.uniform(-.3, .3)); place(SFX, t, kick(.3, .12), .12 * a)
    elif k == 'goldcoin': place(SFX, t, bell(rng.choice([2093, 2349, 2637, 3136]), .6, .16), .55, pan=.35, send=SREV, sendgain=.4)
    elif k == 'pop': place(SFX, t, pop(), .45 * a)
    elif k == 'hit':
        if a >= 28: place(SFX, t - .02, impact(min(1.0, a / 46)), .8, send=SREV, sendgain=.45)
        elif a >= 14: place(SFX, t, impact(.25) * .6, .6, send=SREV, sendgain=.3); place(SFX, t - .25, whoosh(.3, True), .3)
        else: place(SFX, t - .2, whoosh(.3, True), .35)
    elif k == 'whoosh': place(SFX, t - .15, whoosh(.5, True), .4 * a)
    elif k == 'grow': place(SFX, t, grow(), .5, send=SREV, sendgain=.5)
    elif k == 'crack': place(SFX, t, crack(), .55, pan=.1)
    elif k == 'thud': place(SFX, t, thud(), .7)
    elif k == 'pops': place(SFX, t, pops(a), .45)
    elif k == 'wither': place(SFX, t, glide(700, 350, .9), .35, send=SREV, sendgain=.3)
    elif k == 'sprout': place(SFX, t, bell(1568, .5, .14) + np.pad(pop(), (0, int(.5 * SR) - len(pop()))) * .3, .5, send=SREV, sendgain=.4)
    elif k == 'rise': place(SFX, t, whoosh(1.0, True), .35); place(SFX, t, glide(220, 440, 1.0), .25)
    elif k == 'chips': place(SFX, t, chips_fx(a), .5, pan=rng.uniform(-.3, .3))
    elif k == 'cash': place(SFX, t, cash(), .5, send=SREV, sendgain=.2)
    elif k == 'down': place(SFX, t, glide(520, 160, 1.4), .4)
    elif k == 'up': place(SFX, t, glide(200, 600, 1.2), .35)
    elif k == 'thunder': place(SFX, t, thunder(a), .7, send=SREV, sendgain=.4)
    elif k == 'step': place(SFX, t, step(), .35 * a, pan=rng.uniform(-.6, .6))
    elif k == 'roll': place(SFX, t, roll(a), .5)
    elif k == 'ding': place(SFX, t, ding(), .55, send=SREV, sendgain=.3)
    elif k == 'chime': place(SFX, t, chime(), .7, send=SREV, sendgain=.5)

# ---------------- 混音 ----------------
N = len(MUS)
irm, irs = ir(2.8), ir(1.8)
for src, dst, irx, g in [(MREV, MUS, irm, .55), (SREV, SFX, irs, .5)]:
    dst += np.stack([oaconvolve(src[:, c], irx[:, c])[:N] for c in range(2)], 1) * g
MUS = norm(MUS, 1.0); SFX = norm(SFX, 1.0)
mix = MUS * .62 + SFX * .42
mix = np.tanh(mix * 1.15) / np.tanh(1.15)
end = int(TOTAL * SR); fo = int(2.0 * SR)
mix[end - fo:end] *= np.linspace(1, 0, fo)[:, None]; mix = mix[:end]
sf.write(OUT, (mix * .95).astype(np.float32), SR)
print('done', OUT, round(len(mix) / SR, 2))
