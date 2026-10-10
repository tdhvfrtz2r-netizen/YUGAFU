# 生成背景音乐：缓慢的氛围和弦铺底（无版权问题）
import numpy as np, wave, sys
SR, DUR = 44100, 236
t = np.arange(int(SR*DUR)) / SR
hz = lambda n: 440 * 2 ** ((n - 69) / 12)
# Am9 – Fmaj7 – Cmaj7 – G6 ，每个和弦 12 秒
chords = [[45,57,60,64,67,71],[41,53,57,60,64,69],[48,55,59,64,67,72],[43,55,59,62,64,71]]
L = np.zeros_like(t); R = np.zeros_like(t)
seg = 12.0
for k in range(int(DUR // seg) + 1):
    c = chords[k % 4]; s0 = k * seg
    i0, i1 = int(max(0, s0 - 3) * SR), int(min(DUR, s0 + seg + 3) * SR)
    tt = t[i0:i1] - s0
    env = np.clip((tt + 3) / 4, 0, 1) * np.clip((seg + 3 - tt) / 4, 0, 1)
    env = env ** 1.5
    for j, n in enumerate(c):
        f = hz(n); ph = j * 1.7
        w = (np.sin(2*np.pi*f*tt + ph) + 0.3*np.sin(2*np.pi*2*f*tt + ph) ) * (0.5 + 0.5*np.sin(2*np.pi*0.07*(j+1)*tt + ph))
        a = (0.9 if n < 50 else 0.35) * env
        pan = 0.5 + 0.35 * np.sin(j * 2.1)
        L[i0:i1] += w * a * (1 - pan); R[i0:i1] += w * a * pan
# 轻微的高音铃声点缀
rng = np.random.default_rng(7)
for s in np.arange(4, DUR - 6, 6.0):
    n = rng.choice([72,76,79,83,84]); f = hz(n)
    i0 = int(s*SR); i1 = min(len(t), i0 + int(5*SR)); tt = t[i0:i1] - s
    b = 0.12 * np.sin(2*np.pi*f*tt) * np.exp(-tt*1.1) * np.minimum(1, tt*200)
    p = rng.random(); L[i0:i1] += b*(1-p); R[i0:i1] += b*p
m = np.stack([L, R], 1)
fade = np.clip(t/4, 0, 1) * np.clip((DUR - t)/6, 0, 1)
m *= fade[:, None]; m /= np.abs(m).max(); m *= 0.5
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((m * 32767).astype('<i2').tobytes())
