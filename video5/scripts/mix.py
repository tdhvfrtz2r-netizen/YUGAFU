#!/usr/bin/env python3
"""
混音：配乐垫底、音效在上，整体响度归一到 -16 LUFS，峰值限制在 -2 dBFS。
输入  audio/sfx.wav、audio/music.wav（scripts/sound.py 生成）
输出  audio/mix.wav（成品），audio/music_final.wav、audio/sfx_final.wav（同样增益的分轨，方便换配乐）
"""
import re
import subprocess

import numpy as np
from scipy.io import wavfile

SR = 48000
MUSIC_LUFS = -24.5  # 配乐在混音前的响度：垫底，不抢字
TARGET_LUFS = -16.0
CEIL_DB = -2.0


def lufs(path):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    m = re.findall(r'I:\s+(-?[\d.]+) LUFS', out)
    return float(m[-1])


def limiter(x, ceil_db=CEIL_DB, look_ms=5, release_ms=90, block=48):
    """简单的前瞻限幅：按 1 ms 一块算需要的衰减，向前看 5 ms，放开时慢慢回到 1"""
    ceil = 10 ** (ceil_db / 20)
    n = len(x)
    nb = int(np.ceil(n / block))
    pad = np.zeros((nb * block, x.shape[1]))
    pad[:n] = x
    pk = np.max(np.abs(pad).reshape(nb, block, -1), axis=(1, 2))
    need = np.minimum(1.0, ceil / np.maximum(pk, 1e-9))
    look = max(1, int(look_ms * SR / 1000 / block))
    # 向前看：这一块的增益取后面 look 块里最小的
    from scipy.ndimage import minimum_filter1d

    need = minimum_filter1d(need, size=2 * look + 1, origin=-look // 2 if look > 1 else 0)
    rel = np.exp(-block / (release_ms * SR / 1000))
    g = np.empty(nb)
    cur = 1.0
    for i in range(nb):
        cur = need[i] if need[i] < cur else need[i] + (cur - need[i]) * rel
        g[i] = cur
    gs = np.interp(np.arange(nb * block), np.arange(nb) * block + block / 2, g)[:n]
    return x * gs[:, None], float(np.min(g))


def main():
    _, sfx = wavfile.read('audio/sfx.wav')
    _, music = wavfile.read('audio/music.wav')
    n = min(len(sfx), len(music))
    sfx, music = sfx[:n].astype(np.float64), music[:n].astype(np.float64)
    m_gain = 10 ** ((MUSIC_LUFS - lufs('audio/music.wav')) / 20)
    music *= m_gain
    pre = sfx + music
    wavfile.write('audio/premix.wav', SR, pre.astype(np.float32))
    g = 10 ** ((TARGET_LUFS - lufs('audio/premix.wav')) / 20)
    mix, min_gain = limiter(pre * g)
    wavfile.write('audio/mix.wav', SR, mix.astype(np.float32))
    wavfile.write('audio/music_final.wav', SR, (music * g).astype(np.float32))
    wavfile.write('audio/sfx_final.wav', SR, (sfx * g).astype(np.float32))
    print(f'music gain {20 * np.log10(m_gain):.1f} dB, master gain {20 * np.log10(g):.1f} dB, max limiting {20 * np.log10(min_gain):.1f} dB')
    print(f'mix LUFS {lufs("audio/mix.wav"):.1f}, peak {20 * np.log10(np.max(np.abs(mix))):.2f} dBFS')


if __name__ == '__main__':
    main()
