# 把 ERRRC/xingcezhenti 题库打包成刷题 App 的数据文件。
# 用法：python3 build.py <题库目录> <输出目录>
# 输出：index.txt（总目录 + 考情统计）、t/*.txt（题目文字，按 模块×年份 分片）、i/*.txt（图片包）
# 托管只收文本类型，所以 gzip 过的 JSON 和 WebP 图片都存成 base64；每张图单独编码，App 可以按字符范围只取一张。
import os, re, sys, json, gzip, hashlib, io, base64, collections as C
from html.parser import HTMLParser
from multiprocessing import Pool

MODS = ["01-政治理论", "02-常识判断", "03-言语理解与表达", "04-数量关系", "05-判断推理", "06-资料分析"]
MN = ["政治理论", "常识判断", "言语理解", "数量关系", "判断推理", "资料分析"]
MIN_PER_Q = [0.5, 0.5, 0.875, 1.0, 0.875, 1.25]
REGION_ORDER = ["国考", "北京", "天津", "河北", "山西", "内蒙古", "辽宁", "吉林", "黑龙江", "上海", "江苏", "浙江", "安徽", "福建", "江西", "山东", "河南", "湖北", "湖南", "广东", "广西", "海南", "重庆", "四川", "贵州", "云南", "西藏", "陕西", "甘肃", "青海", "宁夏", "新疆", "深圳市考", "广州市考", "选调"]
PACK = 1_200_000  # 图片包大小上限（base64 字符数）

repo, out = sys.argv[1], sys.argv[2]
for d in ("t", "i"):
    os.makedirs(os.path.join(out, d), exist_ok=True)

# ---------- HTML 清理：只留排版标签，图片改成 data-i 引用 ----------
OK_TAGS = {"p", "br", "img", "b", "strong", "i", "em", "u", "sub", "sup", "span", "div", "table", "thead", "tbody", "tr", "td", "th", "ul", "ol", "li", "blockquote", "hr"}
VOID = {"br", "img", "hr"}
IMG_RE = re.compile(r"^\.\./90-图片/(题目图|公式图)/(.+)$")
used_imgs = {}  # key -> 原文件路径


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


class San(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.o, self.stack, self.skip = [], [], 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self.skip += 1
            return
        if tag not in OK_TAGS:
            return
        a = dict(attrs)
        if tag == "img":
            m = IMG_RE.match(a.get("src") or "")
            if not m:
                return
            d, f = m.groups()
            p = os.path.join(repo, "90-图片", d, f)
            if not os.path.exists(p):
                return  # 原库缺图
            key = ("t:" if d == "题目图" else "f:") + f
            used_imgs[key] = p
            cls = ' class="fx"' if d == "公式图" else ""
            w = re.sub(r"px$", "", a.get("width") or "")
            wa = f' width="{w}"' if w.isdigit() else ""
            self.o.append(f'<img data-i="{esc(key)}"{cls}{wa} alt="">')
            return
        keep = ""
        if tag in ("td", "th"):
            for k in ("colspan", "rowspan"):
                if (a.get(k) or "").isdigit():
                    keep += f' {k}="{a[k]}"'
        self.o.append(f"<{tag}{keep}>")
        if tag not in VOID:
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self.skip = max(0, self.skip - 1)
            return
        if tag in OK_TAGS and tag not in VOID and tag in self.stack:
            while self.stack:
                t = self.stack.pop()
                self.o.append(f"</{t}>")
                if t == tag:
                    break

    def handle_data(self, data):
        if not self.skip:
            self.o.append(esc(data))

    def result(self):
        while self.stack:
            self.o.append(f"</{self.stack.pop()}>")
        return "".join(self.o)


def md(lines, inline=False):
    """题库里大部分是 HTML，少数是纯文本行；纯文本行包成段落，**粗体** 转 <b>"""
    out = []
    for l in lines:
        l = l.strip()
        if not l or l == "---":
            continue
        l = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", l)
        if inline or re.match(r"^<(p|table|div|ul|ol|blockquote)\b", l):
            out.append(l)
        else:
            out.append(f"<p>{l}</p>")
    s = San()
    s.feed("".join(out))
    s.close()
    return s.result().replace("<p></p>", "")


def clean_exp(lines):
    t = "\n".join(lines)
    t = re.sub(r"(本题为选非题，)?故(本题|正确)?答案为[A-H]+(项)?[。.]?", "", t)
    t = re.sub(r"【文段出处】(.*)", r"<p>【出处】\1</p>", t)
    h = md(t.split("\n"))
    return h if len(re.sub(r"<[^>]+>", "", h).strip()) >= 4 or "<img" in h else ""


def nick(short):
    t = short.replace("国家公务员录用考试", "国考")
    t = re.sub(r"网友回忆版|考生回忆版", "", t).replace("笔试题", "笔试")
    t = t.replace("《行测》", "").replace("《行政职业能力测验》", "")
    t = re.sub(r"公务员录用考试|公务员考试", "", t)
    t = re.sub(r"(试题|题|试卷)(?=（|$)", "", t)
    t = re.sub(r"（\s*）", "", t).strip()
    i = t.find("（")
    head, tail = (t, "") if i < 0 else (t[:i], t[i:])
    if not any(k in head for k in "考测联选卷"):
        head += "考" if re.search(r"[省市]$", head) else "省考"
    return head + tail


# ---------- 读题库 ----------
QH = re.compile(r"^#{2,3} 第 (\d+) 题　<sub>qid (\d+) · (.*?)</sub>")


def parse_file(path):
    lines = open(path, encoding="utf-8").read().split("\n")
    fm, i = {}, 0
    if lines[0] == "---":
        i = 1
        while lines[i] != "---":
            m = re.match(r'^(\S+?): "(.*)"$', lines[i])
            if m:
                fm[m[1]] = m[2]
            i += 1
        i += 1
    blocks, cur, mode = [], None, "body"
    for l in lines[i:]:
        if re.match(r"^#{2,3} 材料 \d+", l):
            cur = {"kind": "mat", "lines": []}
            blocks.append(cur)
            mode = "body"
            continue
        m = QH.match(l)
        if m:
            cur = {"kind": "q", "qid": int(m[2]), "type": m[3], "lines": [], "ans": None, "expl": []}
            blocks.append(cur)
            mode = "body"
            continue
        if not cur:
            continue
        m = re.match(r"^\*\*答案\*\*：(.*)$", l)
        if m and cur["kind"] == "q":
            cur["ans"] = m[1].strip()
            mode = "after"
            continue
        if l.startswith("**官方解析**"):
            mode = "expl"
            continue
        if mode == "body":
            cur["lines"].append(l)
        elif mode == "expl" and cur["kind"] == "q":
            cur["expl"].append(l)
    return fm, blocks


papers = {}
for mi, mod in enumerate(MODS):
    for fn in sorted(os.listdir(os.path.join(repo, mod))):
        if fn == "README.md" or not fn.endswith(".md"):
            continue
        fm, blocks = parse_file(os.path.join(repo, mod, fn))
        t = fm["试卷"]
        p = papers.setdefault(t, {"t": t, "r": fm["地区"], "y": int(fm["年份"]), "mods": {}})
        p["mods"][mi] = blocks

rk = {r: i for i, r in enumerate(REGION_ORDER)}
order = sorted(papers.values(), key=lambda p: (-p["y"], rk.get(p["r"], 99), p["t"]))

Q = {}          # qid -> 题目
MATS = {}       # 材料 hash -> html
qfirst = {}     # qid -> 首次出现的 (模块, 年份)
qpapers = C.defaultdict(list)
idx_papers = {}
law, four, two, conj = C.Counter(), C.Counter(), C.Counter(), C.Counter()
CONJ = set("但是 而且 因此 所以 然而 甚至 并且 即使 虽然 如果 只有 只要 不仅 而是 何况 况且 尽管 否则".split())

for p in order:
    pid = hashlib.md5(p["t"].encode()).hexdigest()[:8]
    qs, mods = [], []
    for mi in range(6):
        blocks = p["mods"].get(mi)
        if not blocks:
            continue
        start = len(qs)
        mat, left, prev = None, 0, None
        for b in blocks:
            if b["kind"] == "mat":
                h = md(b["lines"])
                mat = hashlib.md5(h.encode()).hexdigest()[:10]
                MATS.setdefault(mat, h)
                left = 10 ** 9 if mi == 5 else 5
                prev = None
                continue
            # 资料分析的材料管到下一份材料；其他模块原数据没标范围，按"最多5题、题号连续、不是逻辑填空"推断
            if mat and mi != 5 and (left <= 0 or b["type"] == "逻辑填空" or (prev is not None and abs(b["qid"] - prev) > 30)):
                mat = None
            qid = b["qid"]
            if qid not in Q:
                opts, stem = [], []
                for l in b["lines"]:
                    m = re.match(r"^- \*\*([A-H])\*\*\.\s?(.*)$", l)
                    if m:
                        opts.append((m[1], m[2].replace("✅", "").strip()))
                    else:
                        stem.append(l)
                trivial = opts and all(v == k for k, v in opts)
                a = b["ans"] if re.fullmatch(r"[A-H]+", b["ans"] or "") else None
                q = {"m": mi, "ty": b["type"], "s": md(stem), "k": "".join(k for k, _ in opts)}
                if opts and not trivial:
                    q["o"] = [md([v], inline=True) for _, v in opts]
                if a:
                    q["a"] = a
                elif b["ans"]:
                    q["at"] = esc(b["ans"])  # 文字答案
                if mat:
                    q["x"] = mat
                e = clean_exp(b["expl"])
                if e:
                    q["e"] = e
                Q[qid] = q
                qfirst[qid] = (mi, p["y"])
                # 统计
                if b["type"] == "逻辑填空" and a:
                    for k, v in opts:
                        if k in a:
                            for tok in re.split(r"[\s　，、；;,/]+", re.sub(r"<[^>]+>", "", v)):
                                if re.fullmatch(r"[一-鿿]{4}", tok):
                                    four[tok] += 1
                                elif re.fullmatch(r"[一-鿿]{2}", tok):
                                    (conj if tok in CONJ else two)[tok] += 1
                if b["type"] == "法律常识":
                    for lw in set(re.findall(r"《中华人民共和国([^》]{1,20}?法)》|《([^》]{1,12}法)》", "\n".join(b["expl"]))):
                        law[(lw[0] or lw[1])] += 1
            qs.append(qid)
            qpapers[qid].append(pid)
            if mat:
                left -= 1
                prev = qid
        if len(qs) > start:
            mods.append([mi, start, len(qs) - start])
    est = sum(max(5, round(MIN_PER_Q[mi] * n / 5) * 5) for mi, _, n in mods)
    idx_papers[pid] = {"t": p["t"], "n": nick(re.sub(r"^\d{4}年(度)?", "", p["t"]).strip()), "r": p["r"], "y": p["y"],
                       "mods": mods, "q": qs, "lim": 120 if est <= 125 else round(est / 5) * 5}

# ---------- 图片：转 WebP ----------
def conv(args):
    key, path = args
    from PIL import Image
    try:
        im = Image.open(path)
        im.seek(0)
        im.load()
    except Exception:
        return key, None
    formula = key.startswith("f:")
    if im.mode in ("P", "PA", "LA", "L", "1", "I", "I;16", "CMYK", "YCbCr"):
        im = im.convert("RGBA" if ("A" in im.mode or "transparency" in im.info) else "RGB")
    if im.mode == "RGBA" and not formula:
        bg = Image.new("RGB", im.size, "white")
        bg.paste(im, mask=im.split()[-1])
        im = bg
    b1 = io.BytesIO()
    im.save(b1, "WEBP", lossless=True, method=4)
    if formula:
        return key, (b1.getvalue(), im.size)
    b2 = io.BytesIO()
    im.save(b2, "WEBP", quality=88, method=5)
    best = b1 if b1.tell() <= 1.5 * b2.tell() else b2
    return key, (best.getvalue(), im.size)


# 按 模块×年份 分组题目，图片按组内顺序装包
groups = C.OrderedDict()
for p in order:
    pid = hashlib.md5(p["t"].encode()).hexdigest()[:8]
    for qid in idx_papers[pid]["q"]:
        groups.setdefault(qfirst[qid], {})[qid] = 1
groups = C.OrderedDict(sorted(((g, list(v)) for g, v in groups.items()), key=lambda x: (-x[0][1], x[0][0])))


def imgs_of(html):
    return re.findall(r'data-i="([^"]+)"', html)


print("converting", len(used_imgs), "images", flush=True)
with Pool(os.cpu_count()) as pool:
    WEBP = dict(pool.imap_unordered(conv, sorted(used_imgs.items()), chunksize=64))

placed = {}  # key -> [pack, off, len, w, h]
packs = []
cur = bytearray()


def place(key):
    global cur
    if key in placed or not WEBP.get(key):
        return
    data, (w, h) = WEBP[key]
    data = base64.b64encode(data)
    if len(cur) + len(data) > PACK and cur:
        packs.append(cur)
        cur = bytearray()
    placed[key] = [len(packs), len(cur), len(data), w, h]
    cur += data


shard_of = {}
shards = []
for (mi, y), qids in groups.items():
    sid = len(shards)
    mats = {}
    for qid in qids:
        q = Q[qid]
        shard_of[qid] = sid
        for part in [q["s"]] + q.get("o", []) + ([MATS[q["x"]]] if "x" in q else []):
            for k in imgs_of(part):
                place(k)
        if "x" in q:
            mats[q["x"]] = MATS[q["x"]]
    # 解析里的图片放后面，让题面图片更集中
    for qid in qids:
        for k in imgs_of(Q[qid].get("e", "")):
            place(k)
    shards.append((mi, y, qids, mats))
    if cur:
        packs.append(cur)
        cur = bytearray()

tot_t = 0
for sid, (mi, y, qids, mats) in enumerate(shards):
    im = {}
    for qid in qids:
        q = Q[qid]
        for part in [q["s"], q.get("e", "")] + q.get("o", []) + ([mats[q["x"]]] if "x" in q else []):
            for k in imgs_of(part):
                if k in placed:
                    im[k] = placed[k]
    body = json.dumps({"q": {str(k): Q[k] for k in qids}, "x": mats, "im": im}, ensure_ascii=False, separators=(",", ":")).encode()
    gz = gzip.compress(body, 9)
    tot_t += len(gz)
    open(os.path.join(out, "t", f"{sid}.txt"), "wb").write(base64.b64encode(gz))
tot_i = 0
for i, pk in enumerate(packs):
    open(os.path.join(out, "i", f"{i}.txt"), "wb").write(pk)
    tot_i += len(pk)

# ---------- 考情统计 ----------
yr_mod = C.defaultdict(lambda: [0] * 6)      # 每年各模块题次
yr_papers = C.Counter()
for pid, p in idx_papers.items():
    yr_papers[p["y"]] += 1
    for mi, _, n in p["mods"]:
        yr_mod[p["y"]][mi] += n
gk = {}
for pid, p in idx_papers.items():
    if p["r"] == "国考" and "副省级" in p["t"]:
        gk[p["y"]] = [next((n for m, _, n in p["mods"] if m == mi), 0) for mi in range(6)]
types = C.defaultdict(C.Counter)
type_year = C.defaultdict(C.Counter)  # (模块,题型) -> 年 -> 数
ans = [C.Counter() for _ in range(6)]
for qid, q in Q.items():
    types[q["m"]][q["ty"]] += 1
    type_year[q["m"], q["ty"]][qfirst[qid][1]] += 1
    if q.get("a") in ("A", "B", "C", "D"):
        ans[q["m"]][q["a"]] += 1
reuse = sorted(((len(set(v)), k) for k, v in qpapers.items()), reverse=True)
hot = [k for n, k in reuse if n >= 5]
years = sorted(yr_mod)
stats = {
    "papers": len(idx_papers), "qtotal": sum(len(p["q"]) for p in idx_papers.values()), "uniq": len(Q),
    "years": years, "yrPapers": [yr_papers[y] for y in years], "yrMod": [yr_mod[y] for y in years],
    "gk": [[y] + gk[y] for y in sorted(gk)],
    "types": [[[k, v] for k, v in types[mi].most_common()] for mi in range(6)],
    "typeYear": {f"{m}|{t}": [type_year[m, t][y] for y in years] for (m, t) in type_year},
    "ans": [[ans[mi][k] for k in "ABCD"] for mi in range(6)],
    "four": four.most_common(60), "two": two.most_common(40), "conj": conj.most_common(15),
    "law": law.most_common(20),
    "reuseDist": sorted(C.Counter(min(n, 10) for n, _ in reuse).items()),
    "hotN": len(hot),
}
regions = [r for r in dict.fromkeys(REGION_ORDER + [p["r"] for p in idx_papers.values()]) if any(p["r"] == r for p in idx_papers.values())]
index = {
    "v": hashlib.md5(json.dumps(stats).encode()).hexdigest()[:8],
    "mn": MN,
    "regions": [{"r": r, "ps": sorted([k for k, p in idx_papers.items() if p["r"] == r], key=lambda k: (-idx_papers[k]["y"], idx_papers[k]["t"]))} for r in regions],
    "papers": idx_papers,
    # 每道题：[分片, 模块, 题型序号, 首次出现年份, 被几套卷使用]
    "tyn": [[k for k, _ in types[mi].most_common()] for mi in range(6)],
    "qm": {},
    "hot": hot,
    "stats": stats,
}
tyi = [{k: i for i, k in enumerate(index["tyn"][mi])} for mi in range(6)]
for qid, q in Q.items():
    index["qm"][str(qid)] = [shard_of[qid], q["m"], tyi[q["m"]][q["ty"]], qfirst[qid][1], len(set(qpapers[qid]))]
ib = gzip.compress(json.dumps(index, ensure_ascii=False, separators=(",", ":")).encode(), 9)
open(os.path.join(out, "index.txt"), "wb").write(base64.b64encode(ib))
print(json.dumps({"papers": len(idx_papers), "unique": len(Q), "shards": len(shards), "packs": len(packs),
                  "textMB": round(tot_t / 1e6, 1), "imgMB": round(tot_i / 1e6, 1), "indexKB": len(ib) // 1000,
                  "images": len(placed), "noExp": sum(1 for q in Q.values() if "e" not in q),
                  "noAns": sum(1 for q in Q.values() if "a" not in q), "hot": len(hot)}, ensure_ascii=False))
