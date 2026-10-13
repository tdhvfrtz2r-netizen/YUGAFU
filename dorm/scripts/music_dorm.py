# Quiet piano score for the dorm video, built from the repo's own synth kit (video2/synth.py).
# Bar length is chosen so the final chord lands exactly when the camera reaches the top-down view (argv[4], seconds).
import sys, os, numpy as np, soundfile as sf
sys.path.insert(0, sys.argv[1])                    # path to YUGAFU/video2
from synth import SR, piano, pad, ir, filt, place, tt
from scipy.signal import oaconvolve
OUT, TOTAL, LAND = sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
BAR = LAND/10; BEAT = BAR/4; E = BEAT/2   # 10 bars, then the final chord
N = int((TOTAL + 4) * SR)
MUS = np.zeros((N, 2)); REV = np.zeros((N, 2))
CH = {'Fmaj7': ([53,57,60,64], 41), 'G': ([55,59,62,67], 43), 'Em7': ([52,55,59,62], 40), 'Am': ([57,60,64,69], 45),
      'Dm7': ([50,53,57,60], 38), 'Gsus': ([55,60,62,67], 43), 'Cadd9': ([55,60,62,64,67], 36)}
prog = ['Fmaj7','G','Em7','Am','Fmaj7','Fmaj7','G','Em7','Am']
def P(t, n, d=3.0, vel=0.8, pan=0.0, rev=0.45):
    place(MUS, t, piano(n, d, vel), 1.0, pan, send=REV, sendgain=rev)
# pad bed under everything
for i, c in enumerate(prog + ['Dm7']):
    notes, root = CH[c]; place(MUS, i*BAR, pad(notes, BAR+0.8, 900, 1.2, 1.2, 0.035), 1.0, 0, send=REV, sendgain=0.6)
# bars 1-5: sparse — bass note + a soft broken chord (title card + orbit)
for i, c in enumerate(prog[:5]):
    notes, root = CH[c]; t0 = i*BAR
    P(t0, root+12, 4.0, 0.55, -0.2)
    for k, n in enumerate([notes[1], notes[2]+12, notes[3]]): P(t0 + BEAT*(1+k) + 0.02*k, n, 3.0, 0.38, 0.25)
# bars 6-9: flowing eighth-note arpeggio + melody (fly-in and walk)
for i, c in enumerate(prog[5:]):
    notes, root = CH[c]; t0 = (5+i)*BAR
    P(t0, root+12, 3.5, 0.62, -0.25); P(t0 + 2*BEAT, root+19, 2.5, 0.42, -0.2)
    seq = [notes[0], notes[1], notes[2], notes[3]+12, notes[2]+12, notes[3], notes[2], notes[1]]
    for k, n in enumerate(seq): P(t0 + k*E, n, 1.8, 0.30 + 0.06*(k % 2 == 0), 0.3)
mel = [(4,0,69,1),(4,1,72,1),(4,2,76,1.5),(4,3.5,74,0.5),(5,0,74,1),(5,1,71,1),(5,2,67,2),
       (6,0,67,1),(6,1,71,1),(6,2,76,1.5),(6,3.5,74,0.5),(7,0,72,1.5),(7,1.5,71,0.5),(7,2,69,2),
       (8,0,65,1),(8,1,69,1),(8,2,74,1),(8,3,72,1)]
for bar, beat, n, d in mel: P((bar+1)*BAR + beat*BEAT, n+12, max(2.0, d*BEAT*2.2), 0.62, 0.05, 0.55)
# bar 10: rise — Dm7 then Gsus, held breath
notes, root = CH['Dm7']; P(9*BAR, root+12, 3.0, 0.6, -0.2)
for k, n in enumerate([notes[1], notes[2], notes[3]+12]): P(9*BAR + 0.25*k, n, 2.0, 0.35, 0.2)
notes, root = CH['Gsus']; t9 = 9*BAR + 2*BEAT; P(t9, root+12, 2.0, 0.55, -0.2)
for k, n in enumerate(notes): P(t9 + 0.12*k, n, 2.0, 0.33, 0.2)
# bar 11 (top-down view): long C add9, gently rolled, rings out to the end
tE = LAND; notes, root = CH['Cadd9']
P(tE, root, 7.0, 0.6, -0.2, 0.6); P(tE, root+12, 7.0, 0.5, -0.15, 0.6)
P(tE + 3.2, 72, 3.5, 0.26, 0.1, 0.8)
for k, n in enumerate(notes + [76]): P(tE + 0.09*k, n + (12 if n < 60 else 0), 6.5, 0.36, 0.2, 0.65)
P(tE + 1.6, 79, 5.0, 0.30, 0.3, 0.8); P(tE + 2.9, 76, 4.0, 0.22, 0.3, 0.85)
place(MUS, tE, pad(CH['Cadd9'][0], 6.5, 800, 1.5, 3.0, 0.05), 1.0, 0, send=REV, sendgain=0.7)
# reverb, gentle limiter, fades
irm = ir(3.4, 6.0, 5200)
wet = np.stack([oaconvolve(REV[:, c], irm[:, c])[:N] for c in range(2)], 1)
mix = filt(MUS + wet*0.8, 'highpass', 40)
mix = mix / (np.abs(mix).max() + 1e-9) * 0.9
mix = np.tanh(mix * 1.2) / np.tanh(1.2) * 0.85
n_end = int(TOTAL * SR); fo = int(3.2 * SR); fi = int(0.4 * SR)
mix[:fi] *= np.linspace(0, 1, fi)[:, None]; mix[n_end-fo:n_end] *= np.linspace(1, 0, fo)[:, None] ** 1.5
mix = mix[:n_end]
sf.write(OUT, mix.astype(np.float32), SR); print('music', OUT, round(len(mix)/SR, 2), 's')
