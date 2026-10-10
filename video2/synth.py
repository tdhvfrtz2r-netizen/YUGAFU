# 合成乐器、音效与混音工具：横版与竖版配乐共用
import numpy as np, json, re, soundfile as sf
from scipy.signal import butter, sosfilt, oaconvolve

SR = 44100
rng = np.random.default_rng(2026)
mtof = lambda m: 440.0 * 2 ** ((m - 69) / 12)
tt = lambda d: np.arange(int(d * SR)) / SR

def load_timeline(path):
    """读 timeline.js，返回 (lines, total, T)；T 解析 'o1' / 'o1.e' / 'o1@0.5' / 'o1+0.3' 这样的时间引用"""
    tl = json.loads(open(path, encoding='utf-8').read().split('=', 1)[1].strip().rstrip(';'))
    ln, total = tl['lines'], tl['total']
    def T(ref):
        if isinstance(ref, (int, float)): return float(ref)
        if ref == 'end': return total
        m = re.match(r'^([a-z]\d+)(\.e)?(?:@([\d.]+))?([+-][\d.]+)?$', ref)
        L = ln[m.group(1)]
        t = L['e'] if m.group(2) else L['s']
        if m.group(3): t = L['s'] + (L['e'] - L['s']) * float(m.group(3))
        if m.group(4): t += float(m.group(4))
        return t
    return ln, total, T

def buffers(total):
    """音乐、音乐混响发送、音效、音效混响发送 四条立体声总线"""
    n = int((total + 2) * SR)
    return [np.zeros((n, 2)) for _ in range(4)]

def place(buf, t, sig, gain=1.0, pan=0.0, send=None, sendgain=0.0):
    i = int(t * SR); n = len(buf)
    if i >= n or len(sig) == 0: return
    if i < 0: sig = sig[-i:]; i = 0
    sig = sig[:n - i]
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

def lock_fx():
    """金属锁扣"""
    t = tt(.35)
    y = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, d in [(1180, 30), (2650, 45), (4100, 60)]) * .3
    y += filt(rng.standard_normal(len(t)), 'bandpass', [1500, 6000]) * np.exp(-t * 120) * .5
    return y + np.pad(kick(.5, .2), (0, len(t) - int(.2 * SR))) * .4

def water_fx(d=2.0):
    """排水声：带通噪声 + 随机气泡"""
    t = tt(d); y = tv_filter(rng.standard_normal(len(t)), 600 - 300 * t / d, 'bandpass', .8) * .25 * np.minimum(1, t / .2) * np.minimum(1, (d - t) / .3)
    for _ in range(int(d * 14)):
        f = rng.uniform(300, 900); b = np.sin(2 * np.pi * np.cumsum(f * (1 + 2 * tt(.06) / .06)) / SR) * np.exp(-tt(.06) * 40) * .12
        i = int(rng.uniform(0, d - .07) * SR); y[i:i + len(b)] += b
    return y

def alarm_fx(d=1.6):
    """两音报警"""
    y = np.zeros(int(d * SR)); k = 0
    while k * .4 < d - .2:
        b = (np.sign(np.sin(2 * np.pi * (880 if k % 2 == 0 else 660) * tt(.18))) * .12) * env(.18, .005, .03)
        i = int(k * .4 * SR); y[i:i + len(b)] += b; k += 1
    return filt(y, 'lowpass', 4000)

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

def section_groove(mus, mrev, t0, t1, prog, level=1.0):
    kicks = []
    for (cs, d, c) in chords_over(t0, t1, prog):
        notes, root = CH[c]
        place(mus, cs, pad([n - 12 for n in notes[:3]] + [notes[3]], d + .3, 1800, .05, .3, .07 * level), pan=0, send=mrev, sendgain=.25)
        for s in range(16):
            st = cs + s * STEP
            if st >= t1: break
            if s in (0, 7, 10): place(mus, st, kick(0.8), .55 * level); kicks.append(st)
            if s in (4, 12): place(mus, st, clap(), .5 * level, send=mrev, sendgain=.3)
            if s % 2 == 0: place(mus, st + (0.02 if s % 4 == 2 else 0), hat(), (.5 if s % 4 == 2 else .3) * level, pan=.3)
            if s == 14: place(mus, st, hat(True), .25 * level, pan=-.3)
            if s in (0, 3, 6, 10, 13): place(mus, st, bass(root + 12, .28, .3, .3), level)
            arp = [notes[0], notes[2], notes[1] + 12, notes[2], notes[3], notes[1] + 12, notes[2] + 12, notes[1]]
            if s % 2 == 0: place(mus, st, pluck(arp[(s // 2) % 8] + 12, .3, .1), level, pan=(-.4 if s % 4 else .4), send=mrev, sendgain=.35)
    return kicks

def section_drop(mus, mrev, t0, t1, prog, level=1.0, dark=False):
    kicks = []
    for (cs, d, c) in chords_over(t0, t1, prog):
        notes, root = CH[c]
        for s in range(16):
            st = cs + s * STEP
            if st >= t1: break
            if s in (0, 7, 10): place(mus, st, kick(1.15), .8 * level); kicks.append(st)
            if s == 8: place(mus, st, clap(), .75 * level, send=mrev, sendgain=.35); place(mus, st, snare(), .45 * level)
            if s == 15 and not dark: place(mus, st, snare(.15, .5), .25 * level)
            place(mus, st, hat(), (.42 if s % 2 else .24) * level, pan=.35 if s % 2 else -.2)
            if s in (0, 3, 6, 8, 11, 14) and not dark:
                place(mus, st, supersaw_stab(notes, .42, .12), level, send=mrev, sendgain=.3)
            if not dark:
                arp = [notes[0] + 12, notes[1] + 12, notes[2] + 12, notes[3] + 12, notes[2] + 24, notes[3] + 12, notes[1] + 12, notes[2] + 12]
                place(mus, st, pluck(arp[s % 8], .25, .06), level, pan=(-.6 if s % 2 else .6), send=mrev, sendgain=.4)
        place(mus, cs, bass(root, d, .5, .5), level)
        place(mus, cs, pad(notes, d + .2, 2600 if not dark else 1200, .02, .2, .09), level, send=mrev, sendgain=.3)
        if dark: place(mus, cs, supersaw_stab([n - 12 for n in notes[:2]], d, .1), level)
    return kicks

def piano_bed(mus, mrev, t0, t1, prog, bars_per=2, level=1.0, pattern=(0, 2, 1, 3, 2, 1)):
    for (cs, d, c) in chords_over(t0, t1, prog, bars_per):
        notes, root = CH[c]
        place(mus, cs, piano(root + 24, min(d + 1, 5), 0.9), level, pan=-.1, send=mrev, sendgain=.5)
        steps = int(d / (BEAT / 1)); seq = [notes[i % len(notes)] + 12 for i in pattern]
        for i in range(steps):
            place(mus, cs + i * BEAT, piano(seq[i % len(seq)], 2.4, 0.55 + 0.15 * (i % 2 == 0)), level, pan=.25 * ((i % 3) - 1), send=mrev, sendgain=.55)
        place(mus, cs, pad(notes, d + .6, 900, 1.0, 1.2, .05), level, send=mrev, sendgain=.4)

def add_events(sfx, srev, events):
    """把画面导出的事件表变成音效"""
    seen = []
    for e in events:
        if any(abs(e['t'] - s[0]) < .05 and e['kind'] == s[1] for s in seen): continue
        seen.append((e['t'], e['kind'])); t, k, a = e['t'], e['kind'], e['amp']
        if k == 'ding': place(sfx, t, ding(), .55, pan=rng.uniform(-.3, .3), send=srev, sendgain=.2)
        elif k == 'pop': place(sfx, t, pop(), .5)
        elif k == 'cash': place(sfx, t, cash(), .6, pan=-.4, send=srev, sendgain=.2)
        elif k == 'coins':
            for i in range(16): place(sfx, t + rng.uniform(0, 1.6), coin_clink(), .5, pan=rng.uniform(-.8, .8))
        elif k == 'hit':
            if a >= 28:
                place(sfx, t - 0.02, impact(min(1.0, a / 50)), .9, send=srev, sendgain=.45)
                if k == 'hit' and a >= 34: place(sfx, t - 1.2, rev_cymbal(1.2), .35)
            elif a >= 14: place(sfx, t, impact(.25) * .6, .7, send=srev, sendgain=.3); place(sfx, t - .25, whoosh(.3, True), .35)
            else: place(sfx, t - .2, whoosh(.3, True), .4); place(sfx, t, kick(.7, .3), .35)
        elif k == 'launch': place(sfx, t, launch(), .55, pan=.2)
        elif k == 'shatter': place(sfx, t, shatter(), .7, pan=.4, send=srev, sendgain=.3)
        elif k == 'chime': place(sfx, t, chime(), .8, pan=.3, send=srev, sendgain=.5)
        elif k == 'type': place(sfx, t, typing(a), .6)  # a = 打字动画时长
        elif k == 'fill': place(sfx, t, fill_fx(3.0), .5, pan=0)
        elif k == 'grow': place(sfx, t, grow(), .7, send=srev, sendgain=.5)
        elif k == 'whoosh': place(sfx, t - .15, whoosh(.45, True), .45 * a)
        elif k == 'tick': place(sfx, t, tick(), .7 * a)
        elif k == 'stamp': place(sfx, t, kick(.6, .25), .45 * a); place(sfx, t, filt(rng.standard_normal(int(.08 * SR)), 'bandpass', [300, 2500]) * np.exp(-tt(.08) * 50), .5 * a)
        elif k == 'lock': place(sfx, t, lock_fx(), .6 * a, send=srev, sendgain=.2)
        elif k == 'water': place(sfx, t, water_fx(a), .5)
        elif k == 'alarm': place(sfx, t, alarm_fx(a), .35)
        elif k == 'heartbeat': place(sfx, t, heartbeat(), .9 * a)


def ir(d=2.6, decay=6.9, lp=6000):
    t = tt(d); n = rng.standard_normal((len(t), 2)) * np.exp(-t * decay / d)[:, None]
    n = filt(n, 'lowpass', lp); n[:int(.012 * SR)] *= np.linspace(0, 1, int(.012 * SR))[:, None]
    return n / np.sqrt((n ** 2).sum(0))
def norm(x, peak): return x / (np.abs(x).max() + 1e-9) * peak

def master(MUS, MREV, SFX, SREV, vo_path, total, out):
    """混响 → 人声闪避（人声出现时压低音乐）→ 软限幅 → 尾部淡出，写出 out 与 *_music.wav"""
    N = len(MUS)
    irm = ir(2.8); irs = ir(1.8)
    for src, dst, irx in [(MREV, MUS, irm), (SREV, SFX, irs)]:
        w = np.stack([oaconvolve(src[:, c], irx[:, c])[:N] for c in range(2)], 1)
        dst += w * (.55 if irx is irm else .5)
    vo, _ = sf.read(vo_path, dtype='float64')
    vo = vo[:N] if len(vo) >= N else np.pad(vo, (0, N - len(vo)))
    vo = filt(vo, 'highpass', 80); vo /= np.abs(vo).max() + 1e-9
    envv = np.convolve(np.abs(vo), np.ones(441) / 441, 'same')
    x = np.clip(envv / 0.06, 0, 1)
    B = 64; nb = len(x) // B + 1; xb = np.pad(x, (0, nb * B - len(x))).reshape(nb, B).max(1)
    a_att, a_rel = np.exp(-B / (0.03 * SR)), np.exp(-B / (0.35 * SR)); s = 0.0; db = np.zeros(nb)
    for i, v in enumerate(xb):
        s = v + (s - v) * (a_att if v > s else a_rel); db[i] = s
    duck = np.repeat(db, B)[:len(x)]
    music_gain = 1 - 0.55 * duck; sfx_gain = 1 - 0.25 * duck
    MUS = norm(MUS, 1.0); SFX = norm(SFX, 1.0)
    mix = MUS * music_gain[:, None] * 0.42 + SFX * sfx_gain[:, None] * 0.55 + vo[:, None] * 0.82
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    fo = int(2.5 * SR); end = int(total * SR)
    mix[end - fo:end] *= np.linspace(1, 0, fo)[:, None]; mix[end:] = 0
    mix = mix[:end + int(0.2 * SR)]
    sf.write(out, (mix * 0.95).astype(np.float32), SR)
    sf.write(out.replace('.wav', '_music.wav'), (norm(MUS * 0.42 + SFX * 0.55, 0.9)[:end]).astype(np.float32), SR)
    print('done', out, round(len(mix) / SR, 2))
