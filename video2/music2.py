# 配乐 + 音效 + 混音：全部用 numpy 合成，无版权素材
# 结构跟着剧情走：紧张开场 → 倒带 → 轻快律动 → 低落 → 蓄力 → 爆发(火箭) → 底气 → 沉思 → 二次爆发 → 收尾
# 用法：python3 music2.py  （需要先有 timeline.js、events.json、/tmp/claude-0/vo.wav）
import numpy as np, json, re, os, soundfile as sf
from scipy.signal import butter, sosfilt, oaconvolve

SR = 44100
TL = json.loads(open('timeline.js', encoding='utf-8').read().split('=', 1)[1].strip().rstrip(';'))
LN, TOTAL = TL['lines'], TL['total']
EVENTS = json.load(open('events.json'))
VO_PATH = os.environ.get('VO', '/tmp/claude-0/vo.wav')
OUT = os.environ.get('OUT', '/tmp/claude-0/mix.wav')

def T(ref):
    if isinstance(ref, (int, float)): return float(ref)
    if ref == 'end': return TOTAL
    m = re.match(r'^([a-z]\d)(\.e)?(?:@([\d.]+))?([+-][\d.]+)?$', ref)
    L = LN[m.group(1)]
    t = L['e'] if m.group(2) else L['s']
    if m.group(3): t = L['s'] + (L['e'] - L['s']) * float(m.group(3))
    if m.group(4): t += float(m.group(4))
    return t

N = int((TOTAL + 2) * SR)
MUS = np.zeros((N, 2)); MREV = np.zeros((N, 2))
SFX = np.zeros((N, 2)); SREV = np.zeros((N, 2))
rng = np.random.default_rng(2026)
mtof = lambda m: 440.0 * 2 ** ((m - 69) / 12)
tt = lambda d: np.arange(int(d * SR)) / SR

def place(buf, t, sig, gain=1.0, pan=0.0, send=None, sendgain=0.0):
    i = int(t * SR)
    if i >= N or len(sig) == 0: return
    if i < 0: sig = sig[-i:]; i = 0
    sig = sig[:N - i]
    if sig.ndim == 1:
        a = (pan + 1) * np.pi / 4
        st = np.stack([sig * np.cos(a), sig * np.sin(a)], 1)
    else: st = sig
    buf[i:i + len(st)] += st * gain
    if send is not None and sendgain: send[i:i + len(st)] += st * gain * sendgain

def filt(x, kind, fc, order=2):
    w = np.asarray(fc, dtype=float) / (SR / 2)
    sos = butter(order, w if w.ndim else float(w), btype=kind, output='sos')
    return sosfilt(sos, x, axis=0)

def tv_filter(x, fcs, kind='bandpass', q=0.6, chunk=1024):
    """随时间变化的滤波（升调噪声、扫频用）"""
    out = np.zeros_like(x); zi = None
    for s in range(0, len(x), chunk):
        fc = float(fcs[min(s, len(fcs) - 1)])
        if kind == 'bandpass': band = np.clip([fc * (1 - q / 2), fc * (1 + q / 2)], 30, SR / 2 - 100)
        else: band = min(fc, SR / 2 - 100)
        w = np.asarray(band, dtype=float) / (SR / 2)
        sos = butter(2, w if w.ndim else float(w), btype=kind, output='sos')
        if zi is None: zi = np.zeros((sos.shape[0], 2))
        out[s:s + chunk], zi = sosfilt(sos, x[s:s + chunk], zi=zi)
    return out

# ---------------- 乐器 ----------------
def saw(f, d, voices=3, det=0.006):
    t = tt(d); y = np.zeros_like(t)
    for v in range(voices):
        k = 1 + det * (v - (voices - 1) / 2)
        y += 2 * np.mod(f * k * t + rng.random(), 1) - 1
    return y / voices

def env(d, a=0.01, r=0.3, curve=1.0):
    t = tt(d); e = np.minimum(1, t / max(a, 1e-4)); e = e * np.clip((d - t) / max(r, 1e-4), 0, 1)
    return e ** curve

def pad(notes, d, bright=1400, a=0.6, r=0.9, gain=0.12):
    y = sum(saw(mtof(n), d, 4, 0.008) for n in notes)
    y = filt(y, 'lowpass', bright, 2) * env(d, a, r) * gain
    return y

def supersaw_stab(notes, d, gain=0.16):
    y = sum(saw(mtof(n), d, 7, 0.014) + 0.5 * saw(mtof(n + 12), d, 3, 0.01) for n in notes)
    y = filt(y, 'lowpass', 5200, 2) * np.exp(-tt(d) * 3.2) * env(d, 0.004, 0.05) * gain
    return y

def pluck(n, d=0.35, gain=0.18):
    s = saw(mtof(n), d, 2, 0.004)
    y = filt(s, 'lowpass', 4500) * np.exp(-tt(d) * 14) * 0.6 + filt(s, 'lowpass', 1100) * np.exp(-tt(d) * 5) * 0.4
    return y * env(d, 0.002, 0.04) * gain

def piano(n, d=3.0, vel=1.0, gain=0.22):
    f = mtof(n); t = tt(d); y = np.zeros_like(t)
    for k in range(1, 9):
        fk = f * k * (1 + 0.0004 * k * k)
        if fk > 12000: break
        y += np.sin(2 * np.pi * fk * t) * (1 / k ** 1.4) * np.exp(-t * (0.9 + 0.55 * k) * (1.3 if n > 72 else 1))
    y += filt(rng.standard_normal(len(t)), 'bandpass', [800, 3000]) * np.exp(-t * 90) * 0.05
    return filt(y, 'lowpass', 5000) * env(d, 0.003, 0.25) * gain * vel

def bass(n, d, gain=0.35, grit=0.0):
    t = tt(d); f = mtof(n)
    y = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)
    if grit: y = np.tanh(y * (1 + grit * 3)) + grit * 0.3 * filt(saw(f * 2, d, 2), 'lowpass', 900)
    return y * env(d, 0.01, 0.08) * gain

def kick(hard=1.0, d=0.6):
    t = tt(d); f = 42 + 120 * np.exp(-t * 28) * hard
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) * np.exp(-t * (5.5 / (0.6 + 0.4 * hard)))
    y += filt(rng.standard_normal(len(t)), 'highpass', 2500) * np.exp(-t * 300) * 0.35
    return np.tanh(y * 1.6) * 0.9

def clap(d=0.35):
    t = tt(d); n = rng.standard_normal(len(t)); e = np.zeros_like(t)
    for k, o in enumerate([0, 0.009, 0.019]): e += (t >= o) * np.exp(-np.clip(t - o, 0, None) * (160 if k < 2 else 22))
    return filt(n, 'bandpass', [1000, 4200]) * e * 0.55

def snare(d=0.25, tone=1.0):
    t = tt(d)
    return filt(rng.standard_normal(len(t)), 'bandpass', [1200, 7500]) * np.exp(-t * 24) * 0.5 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 35) * 0.4 * tone

def hat(open_=False):
    d = 0.3 if open_ else 0.06; t = tt(d)
    return filt(rng.standard_normal(len(t)), 'highpass', 7500) * np.exp(-t * (14 if open_ else 70)) * 0.28

def sub_drop(d=1.8, f0=70, f1=28):
    t = tt(d); f = f1 + (f0 - f1) * np.exp(-t * 2.2); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 1.6) * 0.9

def riser(d, f0=250, f1=9000):
    t = tt(d); k = t / d
    nz = tv_filter(rng.standard_normal(len(t)), f0 * (f1 / f0) ** k, 'bandpass', 0.5)
    pitch = 110 * 2 ** (2 * k); tone = filt(2 * np.mod(np.cumsum(pitch) / SR, 1) - 1, 'lowpass', 2500)
    return (nz * 0.7 + tone * 0.12) * k ** 2.2

def rev_cymbal(d=1.4):
    t = tt(d)
    return filt(rng.standard_normal(len(t)), 'highpass', 4000) * (t / d) ** 3 * 0.5

def impact(big=1.0):
    d = 3.0; t = tt(d)
    boom = sub_drop(d, 85, 30) * (0.8 + 0.4 * big)
    crack = filt(rng.standard_normal(len(t)), 'lowpass', 3500) * np.exp(-t * (9 - 4 * big)) * 0.7
    body = kick(1.2, d) * 0.6
    return (boom + crack + body) * (0.6 + 0.5 * big)

def whoosh(d=0.6, up=True):
    t = tt(d); k = t / d
    fc = 300 * (25 ** (k if up else 1 - k))
    return tv_filter(rng.standard_normal(len(t)), fc, 'bandpass', 0.8) * np.sin(np.pi * k) ** 2 * 0.8

def bell(f, d=1.2, gain=0.2, bright=1.0):
    t = tt(d); y = np.zeros_like(t)
    for r, a, dc in [(1, 1, 2.5), (2.76, .4 * bright, 5), (5.4, .2 * bright, 9), (8.9, .08 * bright, 14)]:
        y += a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * dc)
    return y * env(d, 0.002, 0.1) * gain

def ding():
    a = bell(1760, 0.5, .22); b = bell(2217.46, 0.5, .22); o = int(.09 * SR)
    y = np.zeros(len(a) + o); y[:len(a)] += a; y[o:] += b
    return y

def pop():
    t = tt(0.12); f = 300 + 900 * np.exp(-t * 60)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 40) * 0.5

def coin_clink():
    f = rng.uniform(3000, 6000); return bell(f, 0.25, 0.12, 0.6)

def cash():
    t = tt(0.05); click = filt(rng.standard_normal(len(t)), 'bandpass', [2000, 6000]) * np.exp(-t * 120) * 0.6
    y = np.zeros(int(0.9 * SR)); y[:len(click)] += click
    for f in [2093, 2637, 3136, 4186]:
        b = bell(f, 0.8, 0.07); y[int(0.04 * SR):int(0.04 * SR) + len(b)] += b[:len(y) - int(0.04 * SR)]
    return y

def rewind_fx(d):
    y = np.zeros(int(d * SR)); t0 = 0.0; k = 0
    while t0 < d - 0.1:
        cd = max(0.05, 0.16 - 0.012 * k); t = tt(cd)
        f = 300 + 1600 * (t / cd) ** 1.5
        ch = (2 * np.mod(np.cumsum(f) / SR, 1) - 1) * np.sin(np.pi * t / cd) * 0.18
        i = int(t0 * SR); y[i:i + len(ch)] += ch[:len(y) - i]; t0 += cd * 0.9; k += 1
    hiss = filt(rng.standard_normal(len(y)), 'highpass', 3000) * 0.06
    whir = np.sin(2 * np.pi * np.cumsum(60 + 400 * tt(d)[:len(y)] / d) / SR) * 0.15
    return filt(y, 'lowpass', 6000) + hiss + whir

def launch():
    d = 3.2; t = tt(d); k = t / d
    roar = tv_filter(rng.standard_normal(len(t)), 300 + 3500 * k, 'lowpass') * (np.minimum(1, t / .05)) * np.exp(-np.clip(t - 2.2, 0, None) * 3) * 0.9
    rumble = filt(rng.standard_normal(len(t)), 'lowpass', 120) * np.exp(-t * 0.8) * 1.4
    return roar + rumble

def shatter():
    y = filt(rng.standard_normal(int(0.5 * SR)), 'highpass', 2500) * np.exp(-tt(0.5) * 9) * 0.5
    y = np.pad(y, (0, int(0.6 * SR)))
    for _ in range(26):
        b = bell(rng.uniform(2500, 7500), 0.3, 0.06, 0.8); i = int(rng.uniform(0, 0.6) * SR); y[i:i + len(b)] += b
    return y

def chime():
    y = np.zeros(int(3 * SR))
    for i, n in enumerate([84, 88, 91, 96]):
        b = bell(mtof(n), 2.2, 0.08); s = int(i * 0.11 * SR); y[s:s + len(b)] += b
    return y

def typing(d, n=11):
    y = np.zeros(int((d + .2) * SR))
    for i in range(n):
        c = filt(rng.standard_normal(int(.03 * SR)), 'bandpass', [1500, 5000]) * np.exp(-tt(.03) * 200) * 0.35
        s = int(i * d / n * SR); y[s:s + len(c)] += c
    return y

def fill_fx(d=3.0):
    y = np.zeros(int(d * SR)); t0 = 0; k = 0
    while t0 < d:
        f = 1200 + 2400 * t0 / d; b = bell(f, 0.06, 0.05, .3); s = int(t0 * SR); y[s:s + len(b)] += b[:len(y) - s]
        t0 += max(0.025, 0.11 * (1 - t0 / d) ** 1.5); k += 1
    return y

def grow():
    y = np.zeros(int(4 * SR))
    for i, n in enumerate([72, 76, 79, 83, 84, 88, 91, 95, 96]):
        b = bell(mtof(n), 2.0, 0.05); s = int(i * 0.28 * SR); y[s:s + len(b)] += b[:len(y) - s]
    return y + np.pad(whoosh(1.4, True) * 0.3, (0, len(y) - int(1.4 * SR)))

def heartbeat():
    t = tt(0.5)
    b = lambda: np.sin(2 * np.pi * (45 + 30 * np.exp(-tt(.18) * 30)) * tt(.18)) * np.exp(-tt(.18) * 22)
    y = np.zeros(len(t)); y[:int(.18 * SR)] += b(); s = int(.24 * SR); y[s:s + int(.18 * SR)] += b() * .7
    return y * 0.9

def tick():
    return filt(rng.standard_normal(int(.02 * SR)), 'bandpass', [2500, 6000]) * np.exp(-tt(.02) * 300) * 0.3

# ---------------- 和声 ----------------
CH = {
  'Am': ([57, 60, 64, 71], 33), 'F': ([53, 57, 60, 64], 29), 'C': ([55, 60, 64, 67], 36), 'G': ([55, 59, 62, 67], 31),
  'Dm': ([57, 62, 65, 69], 38), 'E': ([56, 59, 64, 68], 28), 'Cadd9': ([55, 60, 62, 64, 67], 36), 'G/B': ([55, 59, 62, 67], 35),
}
BEAT = 0.6; BAR = 2.4; STEP = 0.15

def chords_over(t0, t1, prog, bars_per=1):
    """返回 [(start, dur, chord)]，从 t0 开始按小节铺和弦，截到 t1"""
    out = []; t = t0; i = 0
    while t < t1 - 0.05:
        d = min(BAR * bars_per, t1 - t); out.append((t, d, prog[i % len(prog)])); t += BAR * bars_per; i += 1
    return out

def sidechain_curve(t0, t1, kicks):
    n = int((t1 - t0) * SR); g = np.ones(n)
    for k in kicks:
        i = int((k - t0) * SR)
        if 0 <= i < n:
            m = min(n - i, int(0.35 * SR)); g[i:i + m] = np.minimum(g[i:i + m], 1 - 0.75 * np.exp(-tt(m / SR)[:m] / 0.07))
    return g

def section_groove(t0, t1, prog, level=1.0):
    kicks = []
    for (cs, d, c) in chords_over(t0, t1, prog):
        notes, root = CH[c]
        place(MUS, cs, pad([n - 12 for n in notes[:3]] + [notes[3]], d + .3, 1800, .05, .3, .07 * level), pan=0, send=MREV, sendgain=.25)
        for s in range(16):
            st = cs + s * STEP
            if st >= t1: break
            if s in (0, 7, 10): place(MUS, st, kick(0.8), .55 * level); kicks.append(st)
            if s in (4, 12): place(MUS, st, clap(), .5 * level, send=MREV, sendgain=.3)
            if s % 2 == 0: place(MUS, st + (0.02 if s % 4 == 2 else 0), hat(), (.5 if s % 4 == 2 else .3) * level, pan=.3)
            if s == 14: place(MUS, st, hat(True), .25 * level, pan=-.3)
            if s in (0, 3, 6, 10, 13): place(MUS, st, bass(root + 12, .28, .3, .3), level)
            arp = [notes[0], notes[2], notes[1] + 12, notes[2], notes[3], notes[1] + 12, notes[2] + 12, notes[1]]
            if s % 2 == 0: place(MUS, st, pluck(arp[(s // 2) % 8] + 12, .3, .1), level, pan=(-.4 if s % 4 else .4), send=MREV, sendgain=.35)
    return kicks

def section_drop(t0, t1, prog, level=1.0, dark=False):
    kicks = []
    for (cs, d, c) in chords_over(t0, t1, prog):
        notes, root = CH[c]
        for s in range(16):
            st = cs + s * STEP
            if st >= t1: break
            if s in (0, 7, 10): place(MUS, st, kick(1.15), .8 * level); kicks.append(st)
            if s == 8: place(MUS, st, clap(), .75 * level, send=MREV, sendgain=.35); place(MUS, st, snare(), .45 * level)
            if s == 15 and not dark: place(MUS, st, snare(.15, .5), .25 * level)
            place(MUS, st, hat(), (.42 if s % 2 else .24) * level, pan=.35 if s % 2 else -.2)
            if s in (0, 3, 6, 8, 11, 14) and not dark:
                place(MUS, st, supersaw_stab(notes, .42, .12), level, send=MREV, sendgain=.3)
            if not dark:
                arp = [notes[0] + 12, notes[1] + 12, notes[2] + 12, notes[3] + 12, notes[2] + 24, notes[3] + 12, notes[1] + 12, notes[2] + 12]
                place(MUS, st, pluck(arp[s % 8], .25, .06), level, pan=(-.6 if s % 2 else .6), send=MREV, sendgain=.4)
        place(MUS, cs, bass(root, d, .5, .5), level)
        place(MUS, cs, pad(notes, d + .2, 2600 if not dark else 1200, .02, .2, .09), level, send=MREV, sendgain=.3)
        if dark: place(MUS, cs, supersaw_stab([n - 12 for n in notes[:2]], d, .1), level)
    return kicks

def piano_bed(t0, t1, prog, bars_per=2, level=1.0, pattern=(0, 2, 1, 3, 2, 1)):
    for (cs, d, c) in chords_over(t0, t1, prog, bars_per):
        notes, root = CH[c]
        place(MUS, cs, piano(root + 24, min(d + 1, 5), 0.9), level, pan=-.1, send=MREV, sendgain=.5)
        steps = int(d / (BEAT / 1)); seq = [notes[i % len(notes)] + 12 for i in pattern]
        for i in range(steps):
            place(MUS, cs + i * BEAT, piano(seq[i % len(seq)], 2.4, 0.55 + 0.15 * (i % 2 == 0)), level, pan=.25 * ((i % 3) - 1), send=MREV, sendgain=.55)
        place(MUS, cs, pad(notes, d + .6, 900, 1.0, 1.2, .05), level, send=MREV, sendgain=.4)

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
piano_bed(T('r2') - 0.3, T('f1') - 0.35, ['Am', 'F'], 1, 0.9)

# 4 分岔：轻快律动
G0, G1 = T('f1') - 0.35, T('b1') - 0.7
section_groove(G0, G1, ['Am', 'F', 'C', 'G'])
place(SFX, G1 - .6, whoosh(.7, False), .5)

# 5 煎熬：只剩钢琴、低垫音和钟表
D0, D1 = G1, T('k1')
piano_bed(D0, D1, ['Am', 'Am', 'F', 'E'], 1, .75, pattern=(0, 2, 3, 2))
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
section_drop(X0, X1, ['Am', 'F', 'C', 'G'])
place(SFX, X1 - .5, whoosh(.8, True), .6)
# 7b 高潮前段：暗色鼓点（电量对比）
Y0, Y1 = X1, T('c4')
section_drop(Y0, Y1, ['Am', 'F', 'Dm', 'E'], .8, dark=True)
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
piano_bed(P0, P1, ['Am', 'F', 'C', 'G'], 2, .9)
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
section_drop(V0, V1, ['C', 'G', 'Am', 'F'], 1.0)
place(SFX, V1 - .3, impact(.5) * .5, .7)
# 13 收尾：钢琴 + 长音，落在 C 大调
W0, W1 = V1, TOTAL
piano_bed(W0, W1 - 2.4, ['F', 'G', 'Am', 'Cadd9'], 2, .85)
place(MUS, W1 - 6, pad(CH['Cadd9'][0] + [48], 6, 1500, 2, 3.5, .08), 1.0, send=MREV, sendgain=.6)

# ---------------- 音效事件 ----------------
seen = []
for e in EVENTS:
    if any(abs(e['t'] - s[0]) < .05 and e['kind'] == s[1] for s in seen): continue
    seen.append((e['t'], e['kind'])); t, k, a = e['t'], e['kind'], e['amp']
    if k == 'ding': place(SFX, t, ding(), .55, pan=rng.uniform(-.3, .3), send=SREV, sendgain=.2)
    elif k == 'pop': place(SFX, t, pop(), .5)
    elif k == 'cash': place(SFX, t, cash(), .6, pan=-.4, send=SREV, sendgain=.2)
    elif k == 'coins':
        for i in range(16): place(SFX, t + rng.uniform(0, 1.6), coin_clink(), .5, pan=rng.uniform(-.8, .8))
    elif k == 'hit':
        if a >= 28:
            place(SFX, t - 0.02, impact(min(1.0, a / 50)), .9, send=SREV, sendgain=.45)
            if k == 'hit' and a >= 34: place(SFX, t - 1.2, rev_cymbal(1.2), .35)
        elif a >= 14: place(SFX, t, impact(.25) * .6, .7, send=SREV, sendgain=.3); place(SFX, t - .25, whoosh(.3, True), .35)
        else: place(SFX, t - .2, whoosh(.3, True), .4); place(SFX, t, kick(.7, .3), .35)
    elif k == 'launch': place(SFX, t, launch(), .55, pan=.2)
    elif k == 'shatter': place(SFX, t, shatter(), .7, pan=.4, send=SREV, sendgain=.3)
    elif k == 'chime': place(SFX, t, chime(), .8, pan=.3, send=SREV, sendgain=.5)
    elif k == 'type': place(SFX, t, typing(a * 0.52), .6)
    elif k == 'fill': place(SFX, t, fill_fx(3.0), .5, pan=0)
    elif k == 'grow': place(SFX, t, grow(), .7, send=SREV, sendgain=.5)

# ---------------- 混响 ----------------
def ir(d=2.6, decay=6.9, lp=6000):
    t = tt(d); n = rng.standard_normal((len(t), 2)) * np.exp(-t * decay / d)[:, None]
    n = filt(n, 'lowpass', lp); n[:int(.012 * SR)] *= np.linspace(0, 1, int(.012 * SR))[:, None]
    return n / np.sqrt((n ** 2).sum(0))
print('reverb...')
irm = ir(2.8); irs = ir(1.8)
for src, dst, g in [(MREV, MUS, .55), (SREV, SFX, .5)]:
    w = np.stack([oaconvolve(src[:, c], irm[:, c] if dst is MUS else irs[:, c])[:N] for c in range(2)], 1)
    dst += w * g

# ---------------- 混音 ----------------
vo, sr = sf.read(VO_PATH, dtype='float64')
vo = vo[:N] if len(vo) >= N else np.pad(vo, (0, N - len(vo)))
vo = filt(vo, 'highpass', 80); vo /= np.abs(vo).max() + 1e-9
# 人声轻压缩 + 存在感
envv = np.convolve(np.abs(vo), np.ones(441) / 441, 'same')
# 闪避：人声出现时压低音乐
x = np.clip(envv / 0.06, 0, 1)
B = 64; nb = len(x) // B + 1; xb = np.pad(x, (0, nb * B - len(x))).reshape(nb, B).max(1)
a_att, a_rel = np.exp(-B / (0.03 * SR)), np.exp(-B / (0.35 * SR)); s = 0.0; db = np.zeros(nb)
for i, v in enumerate(xb):
    s = v + (s - v) * (a_att if v > s else a_rel); db[i] = s
duck = np.repeat(db, B)[:len(x)]
music_gain = 1 - 0.55 * duck; sfx_gain = 1 - 0.25 * duck

def norm(x, peak): return x / (np.abs(x).max() + 1e-9) * peak
MUS = norm(MUS, 1.0); SFX = norm(SFX, 1.0)
mix = MUS * music_gain[:, None] * 0.42 + SFX * sfx_gain[:, None] * 0.55 + vo[:, None] * np.array([1, 1]) * 0.82
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
# 尾部淡出
fo = int(2.5 * SR); end = int(TOTAL * SR)
mix[end - fo:end] *= np.linspace(1, 0, fo)[:, None]; mix[end:] = 0
mix = mix[:end + int(0.2 * SR)]
sf.write(OUT, (mix * 0.95).astype(np.float32), SR)
sf.write(OUT.replace('.wav', '_music.wav'), (norm(MUS * 0.42 + SFX * 0.55, 0.9)[:end]).astype(np.float32), SR)
print('done', OUT, round(len(mix) / SR, 2))
