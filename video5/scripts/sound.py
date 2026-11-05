#!/usr/bin/env python3
"""
全片声音：音效 + 配乐，全部用程序合成（振荡器、滤波噪声、卷积混响），不使用任何现成素材或歌曲。

输入  audio/cues.json   由 scripts/cues.js 从场景里的 <Cue> 收集（第几帧响什么）
输出  audio/sfx.wav     只有音效
      audio/music.wav   只有配乐（100 BPM，跟着片子的段落走）
      audio/mix.wav     混好的成品（未做响度归一，交给 scripts/mux.sh）

用法  python3 scripts/sound.py            全片
      python3 scripts/sound.py --demo    只渲染每种音效各一次，拼成 audio/sfx_demo.wav 方便检查
"""
import json
import math
import sys

import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
BPM = 100
BEAT = 60 / BPM
BAR = 4 * BEAT


# ---------------------------------------------------------------- 基础工具
def db(x):
    return 10 ** (x / 20)


def ns(sec):
    return max(1, int(round(sec * SR)))


def tt(n):
    return np.arange(n) / SR


def lp(x, f, order=2):
    sos = signal.butter(order, min(f, SR * 0.45), 'low', fs=SR, output='sos')
    return signal.sosfilt(sos, x, axis=0)


def hp(x, f, order=2):
    sos = signal.butter(order, f, 'high', fs=SR, output='sos')
    return signal.sosfilt(sos, x, axis=0)


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, min(hi, SR * 0.45)], 'band', fs=SR, output='sos')
    return signal.sosfilt(sos, x, axis=0)


def env(n, decay, attack=0.002):
    t = tt(n)
    return np.minimum(1.0, t / max(attack, 1e-5)) * np.exp(-t / decay)


def bell_env(n, peak=0.5):
    """平滑的起伏包络：0 → 1 → 0，峰值在 peak 位置"""
    t = np.linspace(0, 1, n)
    up = np.sin(np.clip(t / peak, 0, 1) * np.pi / 2) ** 2
    down = np.cos(np.clip((t - peak) / (1 - peak), 0, 1) * np.pi / 2) ** 2
    return np.where(t < peak, up, down)


def fades(x, fin=0.002, fout=0.012):
    n = len(x)
    a = np.ones(n)
    k = min(n, ns(fin))
    a[:k] *= np.linspace(0, 1, k)
    k = min(n, ns(fout))
    a[n - k:] *= np.linspace(1, 0, k)
    return x * (a[:, None] if x.ndim == 2 else a)


def sine(f, n, phase=0.0):
    if np.isscalar(f):
        return np.sin(2 * np.pi * f * tt(n) + phase)
    return np.sin(2 * np.pi * np.cumsum(f) / SR + phase)


def noise(n, rng):
    return rng.standard_normal(n)


def pan2(mono, pan=0.0):
    """等功率声像：pan -1 左 … 1 右"""
    a = (np.clip(pan, -1, 1) + 1) * np.pi / 4
    return np.stack([mono * np.cos(a), mono * np.sin(a)], axis=1) * math.sqrt(2)


def widen(mono, rng, amount=0.3, pan=0.0):
    """单声道变宽：两侧加一点去相关的短延迟"""
    d = ns(0.004 + 0.006 * rng.random())
    l = mono.copy()
    r = np.concatenate([np.zeros(d), mono[:-d]]) if d < len(mono) else mono.copy()
    st = np.stack([l * (1 - amount * 0.5) + r * amount * 0.5, r * (1 - amount * 0.5) + l * amount * 0.5], axis=1)
    if pan:
        g = pan2(np.ones(1), pan)[0] / math.sqrt(2)
        st = st * g * math.sqrt(2)
    return st


def peak(x, peak_db=-6.0):
    m = float(np.max(np.abs(x))) + 1e-12
    return x * (db(peak_db) / m)


def shaped_noise(n, rng, fc_points, bw_oct=0.9, nper=1024):
    """频带随时间移动的噪声（呼啸声用）。fc_points：一串均匀分布在整段时长上的中心频率"""
    x = noise(n + nper, rng)
    f, t, Z = signal.stft(x, fs=SR, nperseg=nper)
    fc = np.interp(t, np.linspace(0, (n + nper) / SR, len(fc_points)), fc_points)
    ratio = np.log2((f[:, None] + 20) / fc[None, :])
    H = np.exp(-0.5 * (ratio / bw_oct) ** 2)
    _, y = signal.istft(Z * H, fs=SR, nperseg=nper)
    return y[:n]


def tv_lowpass(x, times, cutoffs, nper=2048):
    """随时间变化的低通（配乐各段明暗不同）。x: (n, 2)"""
    out = np.zeros_like(x)
    for c in range(x.shape[1]):
        f, t, Z = signal.stft(x[:, c], fs=SR, nperseg=nper)
        fc = np.interp(t, times, cutoffs)
        H = 1.0 / np.sqrt(1.0 + (f[:, None] / fc[None, :]) ** 4)
        _, y = signal.istft(Z * H, fs=SR, nperseg=nper)
        out[:, c] = y[: len(x)] if len(y) >= len(x) else np.pad(y, (0, len(x) - len(y)))
    return out


def make_ir(sec, rng, damp=6000.0, pre=0.018):
    n = ns(sec)
    t = tt(n)
    tau = sec / 6.9
    ir = np.zeros((n + ns(pre), 2))
    for c in range(2):
        e = noise(n, rng) * np.exp(-t / tau)
        # 越往后越暗：把早段和晚段分别低通再按时间交叉淡化
        bright = lp(e, damp, 1)
        dark = lp(e, damp / 4, 1)
        w = np.clip(t / sec, 0, 1)
        ir[ns(pre):, c] = bright * (1 - w) + dark * w
    for d, g in [(0.011, 0.6), (0.017, 0.45), (0.023, 0.4), (0.031, 0.3), (0.043, 0.22)]:
        ir[ns(d), 0] += g
        ir[ns(d * 1.11), 1] += g
    ir /= np.sqrt(np.sum(ir ** 2, axis=0, keepdims=True))
    return ir


def conv_reverb(x, ir):
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    out = np.zeros((len(x) + len(ir) - 1, 2))
    for c in range(2):
        out[:, c] = signal.fftconvolve(x[:, c], ir[:, c])
    return out


def with_room(x, rng, mix=0.25, sec=0.9):
    ir = make_ir(sec, rng, damp=7000)
    wet = conv_reverb(x, ir)
    dry = np.zeros_like(wet)
    dry[: len(x)] = x if x.ndim == 2 else np.stack([x, x], axis=1)
    return dry * (1 - mix) + wet * mix


NOTE = lambda m: 440.0 * 2 ** ((m - 69) / 12)


# ---------------------------------------------------------------- 音效库
# 每个函数返回 (n, 2) 立体声，峰值统一到 -6 dBFS；混音时再乘每种音效的基准增益
def sfx_tick(rng, dur=None):
    n = ns(0.1)
    click = bp(noise(n, rng) * env(n, 0.0015, 0.0002), 2500, 9000)
    tone = (sine(1760, n) * 0.7 + sine(3520, n) * 0.15) * env(n, 0.025, 0.001)
    return widen(click * 0.45 + tone * 0.55, rng, 0.2)


def sfx_pop(rng, dur=None):
    n = ns(0.18)
    f = np.geomspace(330, 880, n) * (1 + 0.04 * rng.standard_normal())
    s = sine(f, n) * env(n, 0.05, 0.004)
    nz = bp(noise(n, rng), 900, 3200) * env(n, 0.012, 0.001) * 0.25
    return widen(s + nz, rng, 0.25)


def sfx_stamp(rng, dur=None):
    n = ns(0.6)
    thump = sine(np.geomspace(150, 50, n), n) * env(n, 0.14, 0.002)
    slap = bp(noise(n, rng), 500, 3200) * env(n, 0.035, 0.0008) * 0.75
    paper = bp(noise(n, rng), 2500, 7000) * env(n, 0.07, 0.004) * 0.16
    return with_room(widen(thump + slap + paper, rng, 0.15), rng, 0.18, 0.5)


def sfx_flip(rng, dur=None):
    n = ns(0.42)
    w = shaped_noise(n, rng, [700, 2400, 4200, 1800], 0.8) * bell_env(n, 0.55)
    snap_at = ns(0.33)
    snap = np.zeros(n)
    m = n - snap_at
    snap[snap_at:] = bp(noise(m, rng) * env(m, 0.004, 0.0003), 1800, 6000) * 0.8 + sine(1200, m) * env(m, 0.02, 0.001) * 0.25
    return widen(w * 0.6 + snap, rng, 0.35)


def _bell(rng, f0, n, decay=1.4, partials=((1, 1.0, 1.0), (2.0, 0.5, 0.75), (3.01, 0.3, 0.5), (4.17, 0.18, 0.35), (5.43, 0.1, 0.25))):
    t = tt(n)
    out = np.zeros(n)
    for ratio, amp, dk in partials:
        f = f0 * ratio
        if f > SR * 0.45:
            continue
        out += amp * np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28)) * np.exp(-t / (decay * dk))
    return out * np.minimum(1, t / 0.003)


def sfx_chime(rng, dur=None):
    n = ns(2.2)
    f0 = NOTE(rng.choice([86, 90, 93]))  # D6 / F#6 / A6：和配乐同调
    x = _bell(rng, f0, n, 0.9)
    return with_room(widen(x, rng, 0.4), rng, 0.35, 1.6)


def sfx_whoosh(rng, dur=None):
    d = dur or 0.8
    n = ns(d)
    fc = [350, 900, 2600, 3200, 1400]
    x = shaped_noise(n, rng, fc, 1.0) * bell_env(n, 0.6)
    p = np.linspace(-0.55, 0.55, n)
    st = np.stack([x * np.cos((p + 1) * np.pi / 4), x * np.sin((p + 1) * np.pi / 4)], axis=1) * math.sqrt(2)
    return st


def sfx_rise(rng, dur=None):
    d = dur or 2.0
    n = ns(d)
    x = lp(shaped_noise(n, rng, [300, 600, 1300, 2600, 4200], 1.0), 6500)
    tone = sine(np.geomspace(220, 440, n), n) * 0.06
    e = np.linspace(0, 1, n) ** 1.6 * (1 - np.clip((tt(n) - (d - 0.25)) / 0.25, 0, 1))
    return widen((x + tone) * e, rng, 0.5)


def sfx_riser(rng, dur=None):
    d = dur or 2.4
    n = ns(d)
    f = np.geomspace(110, 880, n)
    saw = sum(np.sin(2 * np.pi * np.cumsum(f * k) / SR) / k for k in range(1, 7))
    saw = lp(saw, 2500)
    nz = lp(shaped_noise(n, rng, [400, 1000, 2600, 4800], 1.0), 7000) * 0.7
    e = np.linspace(0, 1, n) ** 2.2
    e[-ns(0.03):] *= np.linspace(1, 0, ns(0.03))
    return widen((saw * 0.35 + nz) * e, rng, 0.5)


def sfx_impact(rng, dur=None):
    n = ns(3.2)
    boom = sine(np.geomspace(95, 36, n), n) * env(n, 0.75, 0.004)
    sub = sine(np.geomspace(55, 30, n), n) * env(n, 1.1, 0.01) * 0.6
    hit = lp(noise(n, rng), 500) * env(n, 0.09, 0.001) * 0.9
    air = bp(noise(n, rng), 2000, 8000) * env(n, 0.05, 0.001) * 0.08
    body = sine(np.geomspace(150, 75, n), n) * env(n, 0.28, 0.003) * 0.55  # 手机外放也听得到的那一层
    x = boom + sub + hit + air + body
    return with_room(widen(x, rng, 0.2), rng, 0.3, 2.6)


def sfx_bell(rng, dur=None):
    n = ns(4.5)
    x = _bell(rng, NOTE(74), n, 2.4) + _bell(rng, NOTE(81), n, 2.0) * 0.6 + _bell(rng, NOTE(62), n, 2.8) * 0.4  # D5 + A5 + D4
    return with_room(widen(x, rng, 0.5), rng, 0.4, 2.8)


def sfx_slide(rng, dur=None):
    d = dur or 1.2
    n = ns(d)
    x = bp(noise(n, rng), 2400, 7500)
    jitter = 0.6 + 0.4 * np.abs(signal.resample(rng.standard_normal(max(4, int(d * 45))), n))
    ring = sine(np.linspace(3100, 3500, n), n) * 0.08
    e = bell_env(n, 0.75) * 0.8 + 0.2 * np.linspace(0, 1, n)
    return widen((x * jitter + ring) * e, rng, 0.25)


def sfx_click(rng, dur=None):
    n = ns(0.7)
    out = np.zeros(n)
    m = n
    out += bp(noise(m, rng) * env(m, 0.0025, 0.0002), 1800, 7000) * 1.0
    out += sine(np.geomspace(190, 120, m), m) * env(m, 0.06, 0.001) * 0.7
    k = ns(0.045)
    m2 = n - k
    second = bp(noise(m2, rng) * env(m2, 0.002, 0.0002), 3000, 9000) * 0.85
    second += (sine(3200, m2) * 0.5 + sine(5100, m2) * 0.3) * env(m2, 0.12, 0.001) * 0.35
    out[k:] += second
    return with_room(widen(out, rng, 0.2), rng, 0.15, 0.6)


def sfx_coin(rng, dur=None):
    n = ns(0.6)
    f0 = rng.uniform(2200, 3100)
    t = tt(n)
    x = np.zeros(n)
    for r, a, d in [(1, 1, 0.22), (1.47, 0.6, 0.16), (2.09, 0.45, 0.12), (2.56, 0.3, 0.09), (3.3, 0.2, 0.06)]:
        f = f0 * r
        if f < SR * 0.45:
            x += a * np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28)) * np.exp(-t / d)
    x *= np.minimum(1, t / 0.0008)
    x += bp(noise(n, rng) * env(n, 0.003, 0.0002), 3000, 9000) * 0.6
    return widen(x, rng, 0.3)


def sfx_coins(rng, dur=None):
    d = dur or 1.0
    n = ns(d + 0.6)
    out = np.zeros((n, 2))
    k = int(10 + 14 * d)
    for i in range(k):
        at = ns(d * (i / k) ** 1.3 + rng.uniform(0, 0.04))
        c = sfx_coin(rng) * rng.uniform(0.4, 1.0)
        c = c * pan2(np.ones(1), rng.uniform(-0.6, 0.6))[0] / math.sqrt(2) * math.sqrt(2)
        e = min(n, at + len(c))
        out[at:e] += c[: e - at]
    return out


def sfx_sparkle(rng, dur=None):
    d = dur or 2.0
    n = ns(d + 0.5)
    out = np.zeros((n, 2))
    k = int(18 * d)
    dens = bell_env(1000, 0.4)
    for i in range(k):
        u = rng.random()
        if rng.random() > dens[int(u * 999)]:
            continue
        at = ns(u * d)
        m = ns(0.35)
        f = NOTE(rng.choice([86, 88, 90, 93, 95, 98, 100, 102]))
        p = sine(f, m) * env(m, rng.uniform(0.05, 0.14), 0.002) * rng.uniform(0.3, 1)
        p = pan2(p, rng.uniform(-0.8, 0.8))
        e = min(n, at + m)
        out[at:e] += p[: e - at]
    hiss = bp(noise(n, rng), 6000, 12000) * bell_env(n, 0.4) * 0.05
    out += widen(hiss, rng, 0.6)
    return with_room(out, rng, 0.35, 1.8)


def sfx_swell(rng, dur=None):
    d = dur or 2.5
    n = ns(d)
    base = lp(noise(n, rng), 1200)
    # "啊"一样的人声感：几个共振峰
    vox = np.zeros(n)
    for f0 in (NOTE(57), NOTE(62), NOTE(66)):
        saw = sum(np.sin(2 * np.pi * f0 * k * tt(n) * (1 + 0.003 * rng.standard_normal())) / k for k in range(1, 12))
        vox += saw
    form = bp(vox, 600, 900) * 1.0 + bp(vox, 1100, 1400) * 0.5 + bp(vox, 2400, 2800) * 0.2
    x = (base * 0.6 + form * 0.25) * bell_env(n, 0.55)
    return with_room(widen(x, rng, 0.6), rng, 0.4, 2.2)


def sfx_roll(rng, dur=None):
    d = dur or 1.0
    n = ns(d + 0.1)
    out = np.zeros(n)
    t = 0.0
    while t < d:
        u = t / d
        gap = 0.028 + 0.08 * u ** 2
        at = ns(t)
        m = ns(0.03)
        c = (sine(2900, m) * 0.5 + bp(noise(m, rng), 2000, 8000) * 0.5) * env(m, 0.006, 0.0005) * (1 - 0.5 * u)
        e = min(n, at + m)
        out[at:e] += c[: e - at]
        t += gap
    return widen(out, rng, 0.2)


def sfx_thud(rng, dur=None):
    n = ns(0.35)
    x = sine(np.geomspace(120, 68, n), n) * env(n, 0.09, 0.002)
    x += lp(noise(n, rng), 900) * env(n, 0.03, 0.001) * 0.5
    return widen(x, rng, 0.15)


def sfx_bounce(rng, dur=None):
    n = ns(0.5)
    knock = sfx_thud(rng)[:, 0]
    knock = np.pad(knock, (0, max(0, n - len(knock))))[:n]
    tone = sine(np.geomspace(420, 240, n), n) * env(n, 0.12, 0.003) * 0.45
    return widen(knock + tone, rng, 0.2)


def sfx_ping(rng, dur=None):
    n = ns(2.4)
    f = NOTE(rng.choice([81, 78, 74])) * np.linspace(1, 0.985, n)
    x = sine(f, n) * env(n, 0.7, 0.004) + sine(f * 2, n) * env(n, 0.3, 0.004) * 0.15
    return with_room(widen(x, rng, 0.4), rng, 0.45, 2.2)


def sfx_scribble(rng, dur=None):
    d = dur or 2.0
    n = ns(d)
    x = bp(noise(n, rng), 1500, 5000)
    strokes = np.abs(signal.resample(rng.standard_normal(max(4, int(d * 11))), n))
    strokes = np.clip(strokes, 0, 2) / 2
    return widen(x * strokes * bell_env(n, 0.2), rng, 0.3)


def sfx_peel(rng, dur=None):
    n = ns(0.3)
    x = bp(noise(n, rng), 1800, 6500) * env(n, 0.05, 0.004)
    x += bp(noise(n, rng) * env(n, 0.002, 0.0002), 3000, 8000) * 0.5
    return widen(lp(x, 9000), rng, 0.3)


def sfx_drop(rng, dur=None):
    n = ns(1.2)
    f = np.geomspace(660, 196, n) * (1 + 0.006 * np.sin(2 * np.pi * 6 * tt(n)))
    x = sine(f, n) * env(n, 0.45, 0.01) * 0.8 + sine(f * 2, n) * env(n, 0.2, 0.01) * 0.12
    th = sfx_thud(rng)[:, 0]
    at = ns(0.55)
    x[at: at + len(th)] += th[: max(0, n - at)] * 0.5
    return with_room(widen(x, rng, 0.3), rng, 0.3, 1.6)


def sfx_fizzle(rng, dur=None):
    d = dur or 3.0
    n = ns(d + 0.4)
    out = np.zeros((n, 2))
    k = int(26 * d)
    for i in range(k):
        u = (rng.random() ** 0.8)
        at = ns(u * d)
        m = ns(0.12)
        f = rng.uniform(900, 1600)
        b = sine(np.geomspace(f, f * 0.55, m), m) * env(m, 0.04, 0.002) * rng.uniform(0.2, 0.7) * (1 - 0.6 * u)
        b = pan2(b, rng.uniform(-0.8, 0.8))
        e = min(n, at + m)
        out[at:e] += b[: e - at]
    return with_room(out, rng, 0.25, 1.2)


def sfx_notify(rng, dur=None):
    n = ns(0.36)
    x = np.zeros(n)
    for i, m in enumerate((88, 93)):  # E6 → A6，简单的两个音，不像任何品牌提示音
        at = ns(0.085 * i)
        mm = ns(0.22)
        s = sine(NOTE(m), mm) * env(mm, 0.06, 0.004)
        x[at: at + mm] += s[: max(0, n - at)]
    return with_room(widen(x, rng, 0.2), rng, 0.2, 0.8)


def sfx_glass(rng, dur=None):
    n = ns(2.4)
    t = tt(n)
    x = np.zeros(n)
    for f in rng.uniform(2200, 5200, 6):
        x += np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28)) * (np.minimum(1, t / 0.12)) * np.exp(-t / rng.uniform(0.5, 1.1)) * rng.uniform(0.3, 1)
    x += bp(noise(n, rng), 4000, 10000) * bell_env(n, 0.2) * 0.3
    return with_room(widen(x, rng, 0.6), rng, 0.45, 2.0)


def sfx_step(rng, dur=None):
    n = ns(0.12)
    f = rng.uniform(560, 760)
    x = sine(f, n) * env(n, 0.03, 0.001) + bp(noise(n, rng), 1500, 6000) * env(n, 0.004, 0.0003) * 0.4
    return widen(x, rng, 0.15)


def sfx_punch(rng, dur=None):
    n = ns(0.5)
    x = bp(noise(n, rng) * env(n, 0.003, 0.0002), 1500, 7000) * 1.0
    x += sine(np.geomspace(160, 90, n), n) * env(n, 0.08, 0.001) * 0.8
    k = ns(0.06)
    x[k:] += bp(noise(n - k, rng), 2000, 6000) * env(n - k, 0.03, 0.002) * 0.3
    return with_room(widen(x, rng, 0.2), rng, 0.15, 0.5)


def sfx_conveyor(rng, dur=None):
    d = dur or 6.0
    n = ns(d)
    t = tt(n)
    hum = lp(sum(np.sin(2 * np.pi * 55 * k * t) / k for k in range(1, 8)), 400) * 0.35
    out = hum
    # 滚筒的咔嗒，每秒七下
    tick = np.zeros(n)
    for i in range(int(d * 7)):
        at = ns(i / 7 + rng.uniform(-0.004, 0.004))
        m = ns(0.03)
        c = bp(noise(m, rng), 1200, 4000) * env(m, 0.006, 0.0005) * 0.5
        e = min(n, at + m)
        tick[at:e] += c[: e - at]
    out = out + tick
    e = np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.8)
    return widen(out * e, rng, 0.3)


def sfx_sort(rng, dur=None):
    n = ns(0.3)
    w = shaped_noise(n, rng, [1200, 3500, 2000], 0.8) * bell_env(n, 0.4) * 0.6
    w += bp(noise(n, rng) * env(n, 0.003, 0.0002), 2500, 8000) * 0.5
    return widen(w, rng, 0.3)


def sfx_star(rng, dur=None):
    n = ns(1.6)
    tap = bp(noise(n, rng) * env(n, 0.002, 0.0002), 2000, 8000) * 0.7
    ch = _bell(rng, NOTE(93), n, 0.6) * 0.6 + _bell(rng, NOTE(98), n, 0.5) * 0.4
    ch = np.concatenate([np.zeros(ns(0.03)), ch])[:n]
    return with_room(widen(tap + ch, rng, 0.3), rng, 0.3, 1.4)


SFX = {
    'tick': (sfx_tick, -20),
    'pop': (sfx_pop, -18),
    'stamp': (sfx_stamp, -12),
    'flip': (sfx_flip, -14),
    'chime': (sfx_chime, -19),
    'whoosh': (sfx_whoosh, -16),
    'rise': (sfx_rise, -19),
    'riser': (sfx_riser, -15),
    'impact': (sfx_impact, -10),
    'bell': (sfx_bell, -18),
    'slide': (sfx_slide, -21),
    'click': (sfx_click, -11),
    'coin': (sfx_coin, -20),
    'coins': (sfx_coins, -18),
    'sparkle': (sfx_sparkle, -21),
    'swell': (sfx_swell, -20),
    'roll': (sfx_roll, -21),
    'thud': (sfx_thud, -16),
    'bounce': (sfx_bounce, -14),
    'ping': (sfx_ping, -21),
    'scribble': (sfx_scribble, -26),
    'peel': (sfx_peel, -19),
    'drop': (sfx_drop, -13),
    'fizzle': (sfx_fizzle, -21),
    'notify': (sfx_notify, -22),
    'glass': (sfx_glass, -22),
    'step': (sfx_step, -22),
    'punch': (sfx_punch, -11),
    'conveyor': (sfx_conveyor, -27),
    'sort': (sfx_sort, -19),
    'star': (sfx_star, -14),
}


def render_sfx(name, rng, dur=None):
    fn, base_db = SFX[name]
    x = fn(rng, dur)
    x = fades(peak(x, -6.0), 0.001, 0.02)
    return x * db(base_db + 6)  # base_db 是这一类音效最终的峰值（dBFS，混音前）


# ---------------------------------------------------------------- 配乐
# 和弦（MIDI 音高）：低音另算
CH = {
    'D': [57, 62, 66, 69, 73],  # Dmaj7 (A3 D4 F#4 A4 C#5)
    'Bm': [54, 59, 62, 66, 69],  # Bm7
    'G': [55, 59, 62, 66, 71],  # Gmaj7
    'A': [57, 61, 64, 69, 71],  # A(add9)
    'Asus': [57, 62, 64, 69, 71],  # Asus4(add9)
    'Em': [55, 59, 62, 64, 71],  # Em7
    'F#m': [54, 57, 61, 64, 69],  # F#m7
    'Gm': [55, 58, 62, 64, 70],  # Gm6
    'Bb': [53, 57, 62, 65, 70],  # Bbmaj7
}
ROOT = {'D': 38, 'Bm': 35, 'G': 31, 'A': 33, 'Asus': 33, 'Em': 28, 'F#m': 30, 'Gm': 31, 'Bb': 34}

# 段落风格：和弦进行、各声部开关、亮度、力度
STYLES = {
    'intro': dict(prog=['D', 'Bm', 'G', 'A'], pad=0.55, arp=0.55, arp_oct=12, arp_rate=2, bass=0.4, kick=0, rim=0.35, shaker=0.25, cutoff=2600, mel=0),
    'tense': dict(prog=['Asus'], pad=0.7, arp=0, bass=0.35, kick=0, rim=0, shaker=0, cutoff=1800, mel=0),
    'reflect': dict(prog=['Bm', 'G', 'D', 'A'], pad=0.6, arp=0.35, arp_oct=0, arp_rate=1, bass=0.3, kick=0, rim=0, shaker=0, cutoff=1700, mel=0),
    'build': dict(prog=['D', 'Bm', 'G', 'A'], pad=0.65, arp=0.55, arp_oct=12, arp_rate=2, bass=0.5, kick=0.3, rim=0, shaker=0.3, cutoff=2400, mel=0),
    'turn': dict(prog=['Em', 'A', 'D', 'D'], pad=0.6, arp=0.4, arp_oct=12, arp_rate=2, bass=0.4, kick=0, rim=0, shaker=0.2, cutoff=2200, mel=0),
    'tension': dict(prog=['Bm', 'F#m', 'G', 'A'], pad=0.6, arp=0.45, arp_oct=0, arp_rate=2, bass=0.5, kick=0.45, rim=0.25, shaker=0.35, cutoff=2000, mel=0),
    'think': dict(prog=['G', 'Em', 'Bm', 'A'], pad=0.6, arp=0.3, arp_oct=0, arp_rate=1, bass=0.35, kick=0, rim=0, shaker=0, cutoff=1600, mel=0),
    'warm': dict(prog=['G', 'A', 'D', 'Bm'], pad=0.7, arp=0.5, arp_oct=12, arp_rate=2, bass=0.5, kick=0.25, rim=0, shaker=0.25, cutoff=2800, mel=0),
    'groove': dict(prog=['D', 'G', 'Bm', 'A'], pad=0.6, arp=0.55, arp_oct=12, arp_rate=2, bass=0.55, kick=0.5, rim=0.35, shaker=0.4, cutoff=2600, mel=0),
    'groove_lite': dict(prog=['Bm', 'G', 'D', 'A'], pad=0.6, arp=0.4, arp_oct=0, arp_rate=1, bass=0.45, kick=0.3, rim=0, shaker=0.25, cutoff=2000, mel=0),
    'rise': dict(prog=['G', 'A', 'F#m', 'Bm'], pad=0.65, arp=0.6, arp_oct=24, arp_rate=2, bass=0.55, kick=0.5, rim=0.35, shaker=0.45, cutoff=3400, mel=0),
    'dark': dict(prog=['Gm', 'D', 'Bb', 'A'], pad=0.65, arp=0.3, arp_oct=-12, arp_rate=1, bass=0.4, kick=0, rim=0, shaker=0, cutoff=1100, mel=0),
    'outro': dict(prog=['D', 'Bm', 'G', 'A'], pad=0.6, arp=0.3, arp_oct=12, arp_rate=1, bass=0.4, kick=0, rim=0, shaker=0.15, cutoff=2600, mel=0.7),
    'final': dict(prog=['D'], pad=0.75, arp=0, bass=0.4, kick=0, rim=0, shaker=0, cutoff=2400, mel=0),
}

# 镜头 → 风格（镜头开头再往后 offset 小节换风格）。
# 片名、①②③ 落下之前用挂留和弦（tense）吊住，落下的那一拍解决到 D 大调（final）。
SECTION_AT = [
    ('quiz', 'intro', 0),
    ('wrong', 'tense', 0),
    ('title', 'final', 1.0),  # "土"字定格
    ('word', 'reflect', 0),
    ('phone', 'build', 0),
    ('key1', 'tense', 0),
    ('key1', 'final', 1.0),  # ①
    ('flip', 'turn', 0),
    ('scale', 'tension', 0),
    ('sorter', 'think', 0),
    ('daolang', 'warm', 0),
    ('lockIntro', 'groove_lite', 0),
    ('money', 'groove', 0),
    ('allOpen', 'tense', 0),
    ('allOpen', 'final', 2.0),  # ②
    ('climb', 'rise', 0),
    ('profit', 'dark', 0),
    ('rings', 'outro', 0),
    ('many', 'tense', 0),
    ('many', 'final', 2.0),  # ③
    ('lock', 'outro', 0),
    ('sea', 'final', 0),
]

# 收尾的旋律（原创，D 大调五声音阶的小短句，每小节几个音）：(小节内拍位, MIDI, 拍长)
MELODY = [
    [(0, 78, 1.5), (1.5, 81, 0.5), (2, 83, 1), (3, 81, 1)],
    [(0, 78, 2), (2, 76, 1), (3, 74, 1)],
    [(0, 76, 1.5), (1.5, 78, 0.5), (2, 81, 2)],
    [(0, 76, 2), (2, 74, 2)],
]


def saw_table(f, size=4096):
    K = int(min(48, (SR * 0.42) / f))
    ph = np.arange(size) / size
    tbl = np.zeros(size)
    for k in range(1, max(K, 1) + 1):
        tbl += np.sin(2 * np.pi * k * ph) / k * (0.62 ** (k / 6))
    return tbl / np.max(np.abs(tbl))


def osc(tbl, f, n, rng, cents=0.0, vib=3.0, vib_rate=0.23):
    lfo = vib * np.sin(2 * np.pi * vib_rate * tt(n) + rng.uniform(0, 6.28))
    inc = f / SR * 2 ** ((cents + lfo) / 1200)
    ph = (rng.random() + np.cumsum(inc)) % 1.0
    idx = ph * len(tbl)
    i0 = idx.astype(np.int64)
    fr = idx - i0
    return tbl[i0 % len(tbl)] * (1 - fr) + tbl[(i0 + 1) % len(tbl)] * fr


def pad_note(m, dur, rng, attack=0.7, release=1.6):
    f = NOTE(m)
    n = ns(dur + release)
    tbl = saw_table(f)
    out = np.zeros((n, 2))
    for cents, pn in ((-7, -0.6), (0, 0.0), (7, 0.6)):
        v = osc(tbl, f, n, rng, cents)
        out += pan2(v, pn) / 3
    t = tt(n)
    e = np.minimum(1, t / attack) * np.where(t < dur, 1.0, np.exp(-(t - dur) / (release / 4)))
    return out * e[:, None]


def pluck(m, dur, vel, rng, bright=1.0, decay=0.9):
    f = NOTE(m)
    n = ns(dur)
    t = tt(n)
    x = np.zeros(n)
    for k, (a, d) in enumerate([(1, 1.0), (0.5, 0.5), (0.28, 0.3), (0.15, 0.2), (0.08, 0.13)], start=1):
        fk = f * k * (1 + 0.0004 * k * k)
        if fk > SR * 0.42:
            break
        x += a * bright ** (k - 1) * np.sin(2 * np.pi * fk * t + rng.uniform(0, 6.28)) * np.exp(-t / (decay * d))
    return x * np.minimum(1, t / 0.003) * vel


def piano(m, dur, vel, rng):
    f = NOTE(m)
    n = ns(dur + 1.8)
    t = tt(n)
    x = np.zeros(n)
    for k, (a, d) in enumerate([(1, 2.2), (0.6, 1.4), (0.35, 0.9), (0.2, 0.6), (0.12, 0.4), (0.06, 0.3)], start=1):
        fk = f * k * (1 + 0.0007 * k * k)
        if fk > SR * 0.42:
            break
        x += a * np.sin(2 * np.pi * fk * t + rng.uniform(0, 6.28)) * np.exp(-t / d)
    x += lp(noise(n, rng), 2500) * np.exp(-t / 0.01) * 0.08
    rel = np.where(t < dur, 1.0, np.exp(-(t - dur) / 0.35))
    return x * np.minimum(1, t / 0.002) * rel * vel


def kick(rng):
    n = ns(0.5)
    x = sine(np.geomspace(120, 44, n), n) * env(n, 0.22, 0.002)
    x += bp(noise(n, rng), 1500, 5000) * env(n, 0.002, 0.0002) * 0.3
    return x


def rim(rng):
    n = ns(0.2)
    x = bp(noise(n, rng), 1500, 4500) * env(n, 0.035, 0.0005) * 0.7 + sine(1250, n) * env(n, 0.02, 0.0005) * 0.3
    return x


def shaker(rng, accent):
    n = ns(0.12)
    return hp(noise(n, rng), 6500) * env(n, 0.03, 0.006) * (0.6 + 0.4 * accent)


def add(buf, at, x, gain=1.0):
    if at >= len(buf):
        return
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    e = min(len(buf), at + len(x))
    buf[at:e] += x[: e - at] * gain


def compose(shots, total_sec, rng, cues):
    n = ns(total_sec + 4)
    bar_of_shot = {}
    acc = 0.0
    for s in shots:
        bar_of_shot[s['id']] = acc
        acc += s['bars']
    total_bars = acc
    # 每半小节一个格子，记下风格
    sec_starts = sorted((bar_of_shot[sid] + off, st) for sid, st, off in SECTION_AT)

    def style_at(bar):
        cur = sec_starts[0][1]
        for b0, st in sec_starts:
            if bar >= b0 - 1e-6:
                cur = st
        return cur

    def sec_start(bar):
        b = 0.0
        for b0, _ in sec_starts:
            if bar >= b0 - 1e-6:
                b = b0
        return b

    pad = np.zeros((n, 2))
    arp = np.zeros((n, 2))
    bass = np.zeros((n, 2))
    drums = np.zeros((n, 2))
    mel = np.zeros((n, 2))
    cut_t, cut_v = [], []
    hb = 0.0
    while hb < total_bars - 1e-6:
        st = style_at(hb)
        S = STYLES[st]
        rel_bar = int(math.floor(hb - sec_start(hb) + 1e-6))
        chord = S['prog'][rel_bar % len(S['prog'])]
        t0 = hb * BAR
        seg = 0.5
        # 同一个和弦连着的半小节合并成一段，避免每半小节重新起音
        nxt = hb + 0.5
        while nxt < total_bars - 1e-6:
            st2 = style_at(nxt)
            S2 = STYLES[st2]
            rb2 = int(math.floor(nxt - sec_start(nxt) + 1e-6))
            if S2['prog'][rb2 % len(S2['prog'])] != chord or st2 != st:
                break
            nxt += 0.5
        seg = nxt - hb
        dur = seg * BAR
        cut_t.append(t0)
        cut_v.append(S['cutoff'])
        # 铺底
        if S['pad'] > 0:
            for m in CH[chord]:
                add(pad, ns(t0), pad_note(m, dur, rng), S['pad'] / len(CH[chord]))
        # 低音
        if S['bass'] > 0:
            r = ROOT[chord]
            bn = ns(dur + 0.3)
            b = sine(NOTE(r), bn) * 0.85 + sine(NOTE(r) * 2, bn) * 0.12
            tb = tt(bn)
            b *= np.minimum(1, tb / 0.04) * np.where(tb < dur, 1.0, np.exp(-(tb - dur) / 0.08))
            add(bass, ns(t0), b, S['bass'])
        # 琶音
        if S['arp'] > 0:
            tones = CH[chord][1:] + [CH[chord][1] + 12]
            pattern = [0, 2, 1, 3, 2, 4, 3, 1]
            step = BEAT / S['arp_rate']
            k = 0
            tt0 = t0
            while tt0 < t0 + dur - 1e-6:
                m = tones[pattern[k % len(pattern)] % len(tones)] + S['arp_oct']
                beat_pos = round((tt0 - t0) / step) % (4 * S['arp_rate'])
                vel = 0.75 if beat_pos % S['arp_rate'] == 0 else 0.5
                p = pluck(m, 1.6, vel * S['arp'], rng, bright=0.85, decay=0.8)
                add(arp, ns(tt0), pan2(p, 0.35 if k % 2 else -0.35))
                k += 1
                tt0 += step
        # 鼓：轻
        for beat in range(int(round(seg * 4))):
            tb = t0 + beat * BEAT
            bib = int(round((tb / BEAT))) % 4
            if S['kick'] > 0 and bib in (0, 2):
                add(drums, ns(tb), kick(rng), S['kick'])
            if S['rim'] > 0 and bib in (1, 3):
                add(drums, ns(tb), pan2(rim(rng), 0.25), S['rim'])
            if S['shaker'] > 0:
                for h in range(2):
                    add(drums, ns(tb + h * BEAT / 2 + (0.02 if h else 0)), pan2(shaker(rng, 1 - h), -0.3), S['shaker'])
        # 旋律（只在收尾）
        if S['mel'] > 0:
            for b in range(int(round(seg))):
                ph = MELODY[(rel_bar + b) % len(MELODY)]
                for pos, m, ln in ph:
                    add(mel, ns(t0 + b * BAR + pos * BEAT), pan2(piano(m, ln * BEAT, 0.8 * S['mel'], rng), 0.1))
        hb = nxt

    # 各段亮度不同：铺底和琶音走一个随时间变化的低通
    cut_t.append(total_sec + 4)
    cut_v.append(cut_v[-1])
    pad = tv_lowpass(pad, np.array(cut_t), np.array(cut_v))
    arp = tv_lowpass(arp, np.array(cut_t), np.array(cut_v) * 1.6)
    bass = lp(bass, 220)
    # 琶音加一个附点八分的回声
    d = ns(BEAT * 0.75)
    echo = np.zeros_like(arp)
    fb = arp.copy()
    for i in range(3):
        fb = lp(np.concatenate([np.zeros((d, 2)), fb[:-d]]), 3000) * 0.35
        echo += fb[:, ::-1] if i % 2 == 0 else fb
    arp = arp + echo
    music = pad * 1.0 + arp * 0.55 + bass * 0.9 + drums * 0.5 + mel * 0.6
    # 混响送一份
    ir = make_ir(3.0, rng, damp=5500)
    wet = conv_reverb(pad * 0.35 + arp * 0.5 + mel * 0.45 + drums * 0.1, ir)[: len(music)]
    music = hp(music + wet * 0.55, 30)
    # 收尾：最后两小节淡出到无声，和画面一起黑
    end_n = ns(total_sec)
    fade_n = ns(BAR * 1.6)
    g = np.ones(len(music))
    g[end_n - fade_n: end_n] = np.linspace(1, 0, fade_n) ** 1.5
    g[end_n:] = 0
    music *= g[:, None]
    return music[: ns(total_sec)], bar_of_shot


def duck_curve(n, cues, depth_db=-5.0):
    """重点句、片名这些落点前后，把配乐压低一点，让音效和字更清楚"""
    g = np.zeros(n)
    for c in cues:
        if c['s'] in ('impact',):
            a = ns(c['t'] - 0.25)
            b = ns(c['t'] + 2.4)
            span = np.arange(max(0, a), min(n, b))
            u = (span - a) / max(1, b - a)
            shape = np.where(u < 0.1, u / 0.1, 1 - (u - 0.1) / 0.9)
            g[span] = np.minimum(g[span], depth_db * np.clip(shape, 0, 1))
    return db(g)


def main():
    rng = np.random.default_rng(20261105)
    if '--demo' in sys.argv:
        parts = []
        for name in SFX:
            x = render_sfx(name, np.random.default_rng(7), 1.6)
            parts.append(x)
            parts.append(np.zeros((ns(0.35), 2)))
        demo = np.concatenate(parts)
        wavfile.write('audio/sfx_demo.wav', SR, demo.astype(np.float32))
        print('demo:', len(demo) / SR, 's', 'peak', 20 * np.log10(np.max(np.abs(demo))))
        return
    data = json.load(open('audio/cues.json'))
    total_sec = data['total'] / data['fps']
    cues = data['cues']
    n = ns(total_sec)
    sfx = np.zeros((n + ns(8), 2))
    for i, c in enumerate(cues):
        crng = np.random.default_rng(1000 + i)
        x = render_sfx(c['s'], crng, c.get('dur'))
        if c.get('pan'):
            ang = (np.clip(c['pan'], -1, 1) + 1) * np.pi / 4
            x = x * np.array([math.cos(ang), math.sin(ang)]) * math.sqrt(2)
        add(sfx, ns(c['t']), x, c.get('gain', 1.0))
    sfx = sfx[:n]
    music, _ = compose(data['shots'], total_sec, rng, cues)
    music = music[:n]
    music *= duck_curve(n, cues)[:, None]
    wavfile.write('audio/sfx.wav', SR, sfx.astype(np.float32))
    wavfile.write('audio/music.wav', SR, music.astype(np.float32))
    print('sfx peak dBFS', round(20 * np.log10(np.max(np.abs(sfx)) + 1e-12), 1), 'music peak dBFS', round(20 * np.log10(np.max(np.abs(music)) + 1e-12), 1))


if __name__ == '__main__':
    main()
