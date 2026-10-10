# 用离线 Kokoro 中文男声生成每句配音，并写出时间轴 timeline.js 与 vo.wav
import sherpa_onnx, numpy as np, soundfile as sf, json, os, hashlib, sys
from script import LINES, TAIL
M = os.environ.get('KOKORO', '/tmp/claude-0/tts/kokoro-multi-lang-v1_1') + '/'
SID = int(os.environ.get('SID', 60))
CACHE = os.environ.get('TTS_CACHE', '/tmp/claude-0/tts/cache'); os.makedirs(CACHE, exist_ok=True)
SR = 44100
tts = None
def synth(text, speed):
    global tts
    key = hashlib.md5(f'{SID}|{speed}|{text}'.encode()).hexdigest()
    p = f'{CACHE}/{key}.wav'
    if not os.path.exists(p):
        if tts is None:
            cfg = sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
                kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(model=M+'model.onnx', voices=M+'voices.bin', tokens=M+'tokens.txt',
                    lexicon=M+'lexicon-us-en.txt,'+M+'lexicon-zh.txt', data_dir=M+'espeak-ng-data', dict_dir=M+'dict'), num_threads=4),
                rule_fsts=f'{M}date-zh.fst,{M}phone-zh.fst,{M}number-zh.fst')
            tts = sherpa_onnx.OfflineTts(cfg)
        a = tts.generate(text, sid=SID, speed=speed)
        x = np.array(a.samples, dtype=np.float32)
        if a.sample_rate != SR:
            x = np.interp(np.arange(int(len(x)*SR/a.sample_rate))*a.sample_rate/SR, np.arange(len(x)), x).astype(np.float32)
        sf.write(p, x, SR)
    x, _ = sf.read(p, dtype='float32')
    # 去掉首尾静音
    env = np.convolve(np.abs(x), np.ones(441)/441, 'same'); idx = np.where(env > 0.01)[0]
    x = x[max(0, idx[0]-600): idx[-1]+2200]
    return x

t = 0.0; lines = {}; order = []; clips = []
for lid, text, speed, gap in LINES:
    x = synth(text, speed); t += gap
    lines[lid] = {'s': round(t, 3), 'e': round(t + len(x)/SR, 3), 'text': text}
    order.append(lid); clips.append((t, x)); t += len(x)/SR
total = t + TAIL
vo = np.zeros(int(total*SR)+SR, np.float32)
for s, x in clips:
    i = int(s*SR); vo[i:i+len(x)] += x
vo /= np.abs(vo).max() + 1e-9
sf.write('/tmp/claude-0/vo.wav', vo * 0.9, SR)
with open('timeline.js', 'w', encoding='utf-8') as f:
    f.write('window.TL = ' + json.dumps({'total': round(total, 3), 'order': order, 'lines': lines}, ensure_ascii=False) + ';\n')
for lid in order: print(lid, lines[lid]['s'], lines[lid]['e'])
print('TOTAL', round(total, 2))
