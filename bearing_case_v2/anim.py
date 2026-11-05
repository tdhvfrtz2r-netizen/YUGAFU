"""Post-process a pptxgenjs deck: inject animations, slide transitions, theme colours and CJK theme fonts.
usage: python3 anim.py in.pptx anim.json out.pptx

anim.json = { "_theme": {dk1..folHlink hex}, "<slideNo>": [ {trigger: auto|click, items: [{name, fx, delay, dur, ...}]} ] }
  - only the FIRST step of a slide may be "auto" (starts with the slide); every other step is one click
  - name = the shape's objectName set in build.js
  - fx (entrance): fade | float | wipeL | zoom
       (exit)    : out                      fade out and hide
       (emphasis): spin   deg=360, repeat="indefinite"|N  (Spin; rotates about the shape centre)
                   wobble deg=8,  repeat=N               (Spin with auto-reverse: "trying to turn but stuck")
                   blink  repeat=N                       (Blink, preset 35)
       (path)    : path   path="M 0 0 L 0.2 0.05 E"      (fractions of slide width/height, relative to the shape)
       (media)   : play                                  (play an embedded video from the start)
v2: no Morph. Every "transformation" happens inside a slide with ordinary entrance/exit/emphasis/path effects,
because the target player is WPS. Transitions are plain fades.
"""
import json, re, sys, zipfile, itertools

FINAL = '--final' in sys.argv     # preview mode: bake every slide's END state (exits removed, paths/spins applied), no timing
src, spec_path, out = [a for a in sys.argv[1:] if a != '--final'][:3]
spec = json.load(open(spec_path, encoding='utf-8'))
EMU_W, EMU_H = 12192000, 6858000

DUR = {'fade': 500, 'float': 700, 'wipeL': 600, 'zoom': 500, 'out': 500, 'spin': 2000, 'wobble': 160, 'blink': 400, 'path': 1500}


def effect(ids, spid, fx, delay, dur, node, grp=0, it=None):
    it = it or {}
    dur = dur or DUR.get(fx, 500)
    cid = next(ids)
    tgt = f'<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl>'
    vis = (f'<p:set><p:cBhvr><p:cTn id="{next(ids)}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>'
           f'{tgt}<p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>')
    fade = lambda d, way='in': (f'<p:animEffect transition="{way}" filter="fade"><p:cBhvr><p:cTn id="{next(ids)}" dur="{d}"/>{tgt}</p:cBhvr></p:animEffect>')

    def anim(attr, v0, v1, d, decel=False):
        dec = ' decel="100000"' if decel else ''
        return (f'<p:anim calcmode="lin" valueType="num"><p:cBhvr><p:cTn id="{next(ids)}" dur="{d}" fill="hold"{dec}/>{tgt}'
                f'<p:attrNameLst><p:attrName>{attr}</p:attrName></p:attrNameLst></p:cBhvr><p:tavLst>'
                f'<p:tav tm="0"><p:val><p:strVal val="{v0}"/></p:val></p:tav>'
                f'<p:tav tm="100000"><p:val><p:strVal val="{v1}"/></p:val></p:tav></p:tavLst></p:anim>')

    def wrap(pid, cls, sub, body, extra=''):
        return (f'<p:par><p:cTn id="{cid}" presetID="{pid}" presetClass="{cls}" presetSubtype="{sub}"{extra} fill="hold" grpId="{grp}" nodeType="{node}">'
                f'<p:stCondLst><p:cond delay="{delay}"/></p:stCondLst><p:childTnLst>{body}</p:childTnLst></p:cTn></p:par>')

    if fx == 'fade':
        return wrap(10, 'entr', 0, vis + fade(dur))
    if fx == 'float':
        return wrap(42, 'entr', 0, vis + fade(dur) + anim('ppt_x', '#ppt_x', '#ppt_x', dur) + anim('ppt_y', '#ppt_y+.06', '#ppt_y', dur, True))
    if fx == 'wipeL':
        return wrap(22, 'entr', 8, vis + (f'<p:animEffect transition="in" filter="wipe(left)"><p:cBhvr><p:cTn id="{next(ids)}" dur="{dur}"/>{tgt}</p:cBhvr></p:animEffect>'))
    if fx == 'zoom':
        return wrap(53, 'entr', 16, vis + anim('ppt_w', '#ppt_w*0.6', '#ppt_w', dur, True) + anim('ppt_h', '#ppt_h*0.6', '#ppt_h', dur, True) + fade(dur))
    if fx == 'out':
        hide = (f'<p:set><p:cBhvr><p:cTn id="{next(ids)}" dur="1" fill="hold"><p:stCondLst><p:cond delay="{max(dur - 1, 0)}"/></p:stCondLst></p:cTn>'
                f'{tgt}<p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="hidden"/></p:to></p:set>')
        return wrap(10, 'exit', 0, fade(dur, 'out') + hide)
    if fx in ('spin', 'wobble'):
        deg = it.get('deg', 360 if fx == 'spin' else 8)
        by = int(round(deg * 60000))
        rep = it.get('repeat')
        rep_attr = ''
        if rep:
            rep_attr = f' repeatCount="{rep if rep == "indefinite" else int(rep) * 1000}"'
        if fx == 'spin':
            body = (f'<p:animRot by="{by}"><p:cBhvr><p:cTn id="{next(ids)}" dur="{dur}" fill="hold"/>{tgt}'
                    f'<p:attrNameLst><p:attrName>r</p:attrName></p:attrNameLst></p:cBhvr></p:animRot>')
            return wrap(8, 'emph', 0, body, rep_attr)
        body = (f'<p:animRot by="{by}"><p:cBhvr><p:cTn id="{next(ids)}" dur="{dur}" autoRev="1"{rep_attr} fill="hold"/>{tgt}'
                f'<p:attrNameLst><p:attrName>r</p:attrName></p:attrNameLst></p:cBhvr></p:animRot>')
        return wrap(8, 'emph', 0, body)
    if fx == 'blink':
        rep = int(it.get('repeat', 4)) * 1000
        body = (f'<p:anim calcmode="discrete" valueType="str"><p:cBhvr override="childStyle"><p:cTn id="{next(ids)}" dur="{dur}" fill="hold"/>{tgt}'
                f'<p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:tavLst>'
                f'<p:tav tm="0"><p:val><p:strVal val="hidden"/></p:val></p:tav>'
                f'<p:tav tm="50000"><p:val><p:strVal val="visible"/></p:val></p:tav></p:tavLst></p:anim>')
        return wrap(35, 'emph', 0, body, f' repeatCount="{rep}"')
    if fx == 'path':
        body = (f'<p:animMotion origin="layout" path="{it["path"]}" pathEditMode="relative"><p:cBhvr><p:cTn id="{next(ids)}" dur="{dur}" fill="hold"/>{tgt}'
                f'<p:attrNameLst><p:attrName>ppt_x</p:attrName><p:attrName>ppt_y</p:attrName></p:attrNameLst></p:cBhvr></p:animMotion>')
        ease = ' accel="50000" decel="50000"' if it.get('ease', True) else ''
        return wrap(0, 'path', 0, body, ease)
    if fx == 'play':
        body = (f'<p:cmd type="call" cmd="playFrom(0.0)"><p:cBhvr><p:cTn id="{next(ids)}" dur="{dur}" fill="hold"/>{tgt}</p:cBhvr></p:cmd>')
        return (f'<p:par><p:cTn id="{cid}" presetID="1" presetClass="mediacall" presetSubtype="0" fill="hold" nodeType="{node}">'
                f'<p:stCondLst><p:cond delay="{delay}"/></p:stCondLst><p:childTnLst>{body}</p:childTnLst></p:cTn></p:par>')
    raise ValueError(fx)


def timing(steps, name2id):
    ids = itertools.count(3)
    pars, animated, grps, media = [], [], {}, []
    for si, st in enumerate(steps):
        missing = [it['name'] for it in st['items'] if it['name'] not in name2id]
        if missing:
            raise SystemExit(f'missing shapes {missing}')
        items = st['items']
        if not items:
            continue
        auto = st['trigger'] == 'auto'
        if auto and si != 0:
            raise SystemExit('auto step must be first')
        outer_id, inner_id = next(ids), next(ids)
        effs = []
        for k, it in enumerate(sorted(items, key=lambda i: i['delay'])):
            node = 'withEffect' if (auto or k > 0) else 'clickEffect'
            sid = name2id[it['name']]
            if it['fx'] == 'play':
                media.append(sid)
                effs.append(effect(ids, sid, 'play', it['delay'], it['dur'], node, 0, it))
                continue
            g = grps.get(sid, -1) + 1
            grps[sid] = g
            effs.append(effect(ids, sid, it['fx'], it['delay'], it['dur'], node, g, it))
            animated.append((sid, g))
        cond = ('<p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond>' if auto
                else '<p:cond delay="indefinite"/>')
        pars.append(f'<p:par><p:cTn id="{outer_id}" fill="hold"><p:stCondLst>{cond}</p:stCondLst><p:childTnLst>'
                    f'<p:par><p:cTn id="{inner_id}" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>'
                    + ''.join(effs) + '</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par>')
    if not pars:
        return '', []
    media_xml = ''.join(
        f'<p:video><p:cMediaNode vol="80000"><p:cTn id="{next(ids)}" fill="hold" display="0"><p:stCondLst><p:cond delay="indefinite"/></p:stCondLst></p:cTn>'
        f'<p:tgtEl><p:spTgt spid="{sid}"/></p:tgtEl></p:cMediaNode></p:video>' for sid in media)
    xml = ('<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>'
           '<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>'
           + ''.join(pars) +
           '</p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>'
           '<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq>'
           + media_xml +
           '</p:childTnLst></p:cTn></p:par></p:tnLst>{BLD}</p:timing>')
    return xml, animated


def bake_final(x, steps):
    """Apply the end state of all animations to the slide XML (for a static PDF preview)."""
    for st in steps:
        for it in st['items']:
            pat = re.compile(r'<p:(sp|pic|cxnSp)>(?:(?!</p:\1>).)*?name="' + re.escape(it['name']) + r'".*?</p:\1>', re.S)
            m = pat.search(x)
            if not m:
                continue
            el = m.group(0)
            if it['fx'] == 'out':
                el = ''
            elif it['fx'] == 'path':
                nums = re.findall(r'-?\d+(?:\.\d+)?', it['path'].replace('E', ''))
                dx, dy = float(nums[-2]), float(nums[-1])
                el = re.sub(r'<a:off x="(-?\d+)" y="(-?\d+)"/>', lambda o: f'<a:off x="{int(o.group(1)) + round(dx * EMU_W)}" y="{int(o.group(2)) + round(dy * EMU_H)}"/>', el, count=1)
            elif it['fx'] == 'spin' and it.get('repeat') != 'indefinite':
                deg = it.get('deg', 360) * int(it.get('repeat') or 1)
                def addrot(o):
                    attrs = o.group(1)
                    r0 = re.search(r'rot="(-?\d+)"', attrs)
                    r1 = (int(r0.group(1)) if r0 else 0) + round(deg * 60000)
                    attrs = re.sub(r'\s*rot="-?\d+"', '', attrs)
                    return f'<a:xfrm{attrs} rot="{r1 % 21600000}">'
                el = re.sub(r'<a:xfrm([^>]*)>', addrot, el, count=1)
            x = x[:m.start()] + el + x[m.end():]
    return x


def transition(n):
    t = spec.get('_transitions', {}).get(str(n))
    if t == 'fast':
        return '<p:transition spd="fast"><p:fade/></p:transition>'
    if t == 'black':
        return '<p:transition spd="slow"><p:fade thruBlk="1"/></p:transition>'
    return '<p:transition spd="med"><p:fade/></p:transition>'


zin = zipfile.ZipFile(src)
zout = zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED)
total = 0
for item in zin.infolist():
    data = zin.read(item.filename)
    m = re.fullmatch(r'ppt/slides/slide(\d+)\.xml', item.filename)
    if m:
        n = int(m.group(1))
        x = data.decode('utf-8')
        name2id, kinds = {}, {}
        for el in re.finditer(r'<p:(sp|pic|cxnSp)>.*?</p:\1>', x, re.S):
            mm = re.search(r'<p:cNvPr id="(\d+)" name="([^"]*)"', el.group(0))
            if mm:
                if mm.group(2) in name2id:
                    raise SystemExit(f'slide {n}: duplicate shape name {mm.group(2)}')
                name2id[mm.group(2)] = mm.group(1)
                kinds[mm.group(1)] = el.group(1)
        if FINAL:
            zout.writestr(item, bake_final(x, spec.get(str(n), [])).encode('utf-8'))
            continue
        tim, animated = timing(spec.get(str(n), []), name2id)
        if tim:
            bld = ''.join(f'<p:bldP spid="{i}" grpId="{g}" animBg="1"/>' for i, g in dict.fromkeys(animated) if kinds[i] == 'sp')
            tim = tim.replace('{BLD}', f'<p:bldLst>{bld}</p:bldLst>' if bld else '')
            total += len(animated)
        assert '<p:timing' not in x and '<p:transition' not in x
        x = x.replace('</p:clrMapOvr>', '</p:clrMapOvr>' + transition(n) + tim, 1)
        data = x.encode('utf-8')
    elif item.filename == 'ppt/theme/theme1.xml':
        x = data.decode('utf-8')
        for k, v in spec.get('_theme', {}).items():   # theme colors (what pptxgenjs cannot write itself)
            x = re.sub(rf'<a:{k}>.*?</a:{k}>', f'<a:{k}><a:srgbClr val="{v}"/></a:{k}>', x, count=1, flags=re.S)
        x = x.replace('<a:ea typeface=""/>', '<a:ea typeface="Microsoft YaHei"/>')
        x = re.sub(r'<a:font script="Hans" typeface="[^"]*"/>', '<a:font script="Hans" typeface="微软雅黑"/>', x)
        data = x.encode('utf-8')
    zout.writestr(item, data)
zout.close()
print('animated shapes:', total)
