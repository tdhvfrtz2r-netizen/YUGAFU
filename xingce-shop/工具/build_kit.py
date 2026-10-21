"""Build the 刷题工具包 (index pages, 30-day plans, 错题本, 考情速览) from data.json.

Usage: python3 -I build_kit.py data.json OUT_DIR
The kit contains only links, titles and statistics -- no question text.
"""
import json, os, re, sys, collections as C

data_path, out = sys.argv[1], sys.argv[2]
R = json.load(open(data_path, encoding="utf-8"))
KIT = "00-刷题工具包"
base = os.path.join(out, KIT)

MOD_ORDER = ["01-政治理论", "02-常识判断", "03-言语理解与表达", "04-数量关系", "05-判断推理", "06-资料分析"]
SHORT = {"01-政治理论": "政治理论", "02-常识判断": "常识判断", "03-言语理解与表达": "言语理解",
         "04-数量关系": "数量关系", "05-判断推理": "判断推理", "06-资料分析": "资料分析"}
MIN_PER_Q = {"01-政治理论": 0.5, "02-常识判断": 0.5, "03-言语理解与表达": 0.875,
             "04-数量关系": 1.0, "05-判断推理": 0.875, "06-资料分析": 1.25}
MOCK_ORDER = ["01-政治理论", "02-常识判断", "03-言语理解与表达", "05-判断推理", "06-资料分析", "04-数量关系"]
REGION_ORDER = ["国考", "北京", "天津", "河北", "山西", "内蒙古", "辽宁", "吉林", "黑龙江", "上海", "江苏", "浙江",
                "安徽", "福建", "江西", "山东", "河南", "湖北", "湖南", "广东", "广西", "海南", "重庆", "四川",
                "贵州", "云南", "西藏", "陕西", "甘肃", "青海", "宁夏", "新疆", "深圳市考", "广州市考", "选调"]
CONJ = {"但是", "然而", "不仅", "尽管", "只有", "如果", "固然", "而且", "因此", "所以", "虽然", "即使", "因为",
        "甚至", "而是", "并且", "可是", "不过", "既然", "除非", "否则", "从而", "进而", "可见", "何况", "况且",
        "无论", "不管", "只要", "即便", "哪怕", "以致", "以免", "不但", "反而", "而且", "同时", "于是", "毕竟"}


def nick(p):
    t = p["short"].replace("国家公务员录用考试", "国考")
    t = re.sub(r"网友回忆版|考生回忆版", "", t).replace("笔试题", "笔试")
    t = t.replace("《行测》", "").replace("《行政职业能力测验》", "")
    t = re.sub(r"公务员录用考试|公务员考试", "", t)
    t = re.sub(r"(试题|题|试卷)(?=（|$)", "", t)
    t = re.sub(r"（\s*）", "", t).strip()
    head, sep, tail = t.partition("（")
    if not any(k in head for k in ("考", "测", "联", "选", "卷")):
        head += "考" if head.endswith(("省", "市")) else "省考"
    return head + sep + tail


def minutes(mod, n):
    return max(5, int(round(MIN_PER_Q[mod] * n / 5.0)) * 5)


def write(rel, text):
    p = os.path.join(base, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        f.write(text.rstrip() + "\n")


# ---------- papers ----------
papers = C.OrderedDict()
for r in R:
    p = papers.setdefault(r["paper"], {"title": r["paper"], "region": r["region"], "year": int(r["year"]), "mods": {}})
    p["mods"][r["module"]] = {"file": r["file"], "count": r["count"], "qids": {q["qid"] for q in r["qs"]}}
for p in papers.values():
    p["total"] = sum(m["count"] for m in p["mods"].values())
    p["qids"] = set().union(*(m["qids"] for m in p["mods"].values()))
    p["short"] = re.sub(r"^\d{4}年(度)?", "", p["title"]).strip()
    p["is_full"] = len(p["mods"]) >= 5 and p["total"] >= 90

by_region = C.defaultdict(list)
for p in papers.values():
    by_region[p["region"]].append(p)
for lst in by_region.values():
    lst.sort(key=lambda p: (-p["year"], p["title"]))
regions = [r for r in REGION_ORDER if r in by_region] + sorted(set(by_region) - set(REGION_ORDER))


def link(p, mod, label=None):
    return "[[%s/%s|%s]]" % (mod, p["mods"][mod]["file"], label or SHORT[mod])


def plan_name(region):
    return "%s 30天计划" % region


def region_link(region, label=None):
    return "[[%s/01-按考试找卷/%s|%s]]" % (KIT, region, label or region)


def plan_link(region, label=None):
    return "[[%s/02-30天计划/%s|%s]]" % (KIT, plan_name(region), label or plan_name(region))


WRONG = "[[%s/03-错题本/错题本|错题本]]" % KIT
HOME = "[[%s/00-从这里开始|← 回首页]]" % KIT

# ---------- region pages ----------
for region in regions:
    lst = by_region[region]
    years = sorted({p["year"] for p in lst})
    lines = ["# %s · 真题卷" % region, "",
             "%s · 想按计划刷 → %s" % (HOME, plan_link(region)), "",
             "> 共 **%d 套卷 · %d 题**（%d–%d）。刷完一个模块就点一下前面的方框打勾，进度自动保存。" %
             (len(lst), sum(p["total"] for p in lst), years[0], years[-1]), ""]
    if len(lst) < 8 and region != "国考":
        lines += ["> 本地区收录的卷比较少，建议同时刷 %s，题型和难度最接近。" % region_link("国考"), ""]
    cur_year = None
    for i, p in enumerate(lst):
        if p["year"] != cur_year:
            cur_year = p["year"]
            lines += ["## %d 年" % cur_year, ""]
        lines.append("### %s" % p["short"])
        est = sum(minutes(m, p["mods"][m]["count"]) for m in p["mods"])
        meta = "%d 题" % p["total"]
        if p["is_full"]:
            meta += " · 整套建议限时 %d 分钟" % (120 if est <= 125 else int(round(est / 5.0)) * 5)
        lines.append(meta)
        # overlap with other papers in the same region
        best = None
        for o in lst[:i]:
            if not p["qids"]:
                continue
            share = len(p["qids"] & o["qids"]) / len(p["qids"])
            if share >= 0.3 and (best is None or share > best[0]):
                best = (share, o)
        if best:
            lines.append("（和「%d %s」有 %d%% 的题重合，刷过那套的话这套挑没做过的题即可）" %
                         (best[1]["year"], best[1]["short"], round(best[0] * 100)))
        lines.append("")
        for m in MOD_ORDER:
            if m in p["mods"]:
                n = p["mods"][m]["count"]
                lines.append("- [ ] %s · %d 题 · 约 %d 分钟" % (link(p, m), n, minutes(m, n)))
        lines.append("")
    write("01-按考试找卷/%s.md" % region, "\n".join(lines))

# ---------- 30-day plans ----------
NEED = C.OrderedDict([("03-言语理解与表达", 9), ("05-判断推理", 9), ("06-资料分析", 8),
                      ("04-数量关系", 6), ("02-常识判断", 6), ("01-政治理论", 4)])
HEAVY = ["03-言语理解与表达", "05-判断推理"]
LIGHT = ["06-资料分析", "04-数量关系", "02-常识判断", "01-政治理论"]
REVIEW_DAYS = {7, 14, 21}
GK = by_region["国考"]


def pick_mocks(region):
    cands = [p for p in by_region[region] if p["is_full"]]
    if region != "国考":
        cands += [p for p in GK if p["is_full"] and "地市级" in p["title"]]
    mocks, seen = [], set()
    for p in cands:
        if len(mocks) >= 4:
            break
        if len(p["qids"] & seen) > 0.4 * len(p["qids"]):
            continue  # 同年 A/B 卷、副省/地市卷重题多，模考只取一套
        mocks.append(p)
        seen |= p["qids"]
    return mocks


def pick_practice(region, mocks):
    used = {id(p) for p in mocks}
    own = [p for p in by_region[region] if id(p) not in used]
    extra = [p for p in GK if id(p) not in used] if region != "国考" else []
    chosen = {}
    for m, need in NEED.items():
        got, seen = [], set()
        for p in own + extra:
            if len(got) >= need:
                break
            if m not in p["mods"] or p["mods"][m]["count"] < 3:
                continue
            q = p["mods"][m]["qids"]
            if len(q & seen) > 0.5 * len(q):
                continue  # 联考/A·B卷重题太多，跳过
            got.append(p)
            seen |= q
        got.sort(key=lambda p: (p["year"], p["title"]))  # 从老卷刷到新卷
        chosen[m] = [(p, m) for p in got]
    return chosen


def task_line(p, m):
    n = p["mods"][m]["count"]
    return "- [ ] %s · %d 题 · 限时 %d 分钟" % (link(p, m, "%d %s · %s" % (p["year"], nick(p), SHORT[m])), n, minutes(m, n))


PLANS = []
for region in regions:
    mocks = pick_mocks(region)
    chosen = pick_practice(region, mocks)
    heavy, light = [], []
    hq = [list(chosen[m]) for m in HEAVY]
    while any(hq):
        for q in hq:
            if q:
                heavy.append(q.pop(0))
    lq = [list(chosen[m]) for m in LIGHT]
    while any(lq):
        for q in lq:
            if q:
                light.append(q.pop(0))
    study_days = [d for d in range(1, 25) if d not in REVIEW_DAYS]
    days = {}
    for d in study_days:
        tasks = []
        for _ in range(2):
            if heavy and (not tasks or tasks[0][1] not in HEAVY):
                tasks.append(heavy.pop(0))
            elif light:
                tasks.append(light.pop(0))
            elif heavy:
                tasks.append(heavy.pop(0))
        days[d] = tasks
    # leftovers (rare) go to the last study days
    for t in heavy + light:
        days[study_days[-1]].append(t)

    own_cnt = len(by_region[region])
    PLANS.append({"region": region,
                  "supplemented": region != "国考" and (own_cnt < 8 or any(p["region"] == "国考" for p in mocks)),
                  "days": {d: [[p["title"], m] for p, m in days[d]] for d in days},
                  "mocks": [p["title"] for p in mocks]})
    L = ["# %s · 30 天刷题计划" % region, "",
         "%s · %s · %s" % (HOME, region_link(region, "%s 全部卷" % region), WRONG), "",
         "> **怎么用**：每天把当天的方框全部打勾就算完成。第 1–24 天按模块专项练，从老卷刷到新卷；"
         "第 7、14、21 天是复盘日；最后 6 天用最新的 4 套整卷限时模考。",
         "> 做完一组就对答案，错题记进%s。" % WRONG, ""]
    if region != "国考" and (own_cnt < 8 or any(p["region"] == "国考" for p in mocks)):
        L += ["> %s收录的卷不多，计划里用国考卷补齐（国考和省考题型基本一致）。" % region, ""]
    L += ["## 第一阶段 · 专项打基础（第 1–24 天）", ""]
    for d in range(1, 25):
        if d in REVIEW_DAYS:
            L += ["### 第 %d 天 · 复盘日" % d, "",
                  "- [ ] 把这周%s里的题全部重做一遍，还错的标红" % WRONG,
                  "- [ ] 数一数哪个模块错得最多，明天先刷它",
                  "- [ ] 休息一下，别连续熬", ""]
            continue
        tasks = days[d]
        tot = sum(minutes(m, p["mods"][m]["count"]) for p, m in tasks)
        L += ["### 第 %d 天 · %s（约 %d 分钟）" % (d, " + ".join(SHORT[m] for _, m in tasks), tot), ""]
        L += [task_line(p, m) for p, m in tasks]
        L += ["- [ ] 对答案，错题记进%s" % WRONG, ""]
    L += ["## 第二阶段 · 整卷模考（第 25–30 天）", "",
          "> 整卷按 政治理论 → 常识 → 言语 → 判断 → 资料 → 数量 的顺序做，数量关系放最后，没时间就蒙。"
          "严格限时，用答题卡或白纸写答案，别边做边看解析。", ""]
    mock_days = [25, 26, 28, 29]
    for d in range(25, 31):
        if d in (27, 30):
            L += ["### 第 %d 天 · 模考复盘" % d, "",
                  "- [ ] 把前两套模考的错题全部重新做一遍，看解析弄懂",
                  "- [ ] 对比两套的各模块正确率，找出最拖分的模块"]
            if d == 30:
                L += ["- [ ] 把%s从头翻一遍" % WRONG,
                      "- [ ] 考前确认：准考证、身份证、2B 铅笔、橡皮、手表（不能用智能手表）"]
            L.append("")
            continue
        idx = mock_days.index(d)
        if idx >= len(mocks):
            L += ["### 第 %d 天 · 自选整卷" % d, "", "- [ ] 从 %s 里挑一套没做过的整卷限时做完" % region_link(region), ""]
            continue
        p = mocks[idx]
        est = sum(minutes(m, p["mods"][m]["count"]) for m in p["mods"])
        lim = 120 if est <= 125 else int(round(est / 5.0)) * 5
        L += ["### 第 %d 天 · 整卷模考：%d %s（限时 %d 分钟）" % (d, p["year"], nick(p), lim), ""]
        L += ["- [ ] %s · %d 题" % (link(p, m), p["mods"][m]["count"]) for m in MOCK_ORDER if m in p["mods"]]
        L += ["- [ ] 对答案，算出总正确率，错题记进%s" % WRONG, ""]
    write("02-30天计划/%s.md" % plan_name(region), "\n".join(L))

# ---------- 错题本 ----------
write("03-错题本/错题本.md", """# 错题本

%s

> **怎么记**：做错一道，就在下面表格里加一行。
> 「题目」那一栏输入 `[[` 再打几个字（比如 `2024年国家`），Obsidian 会弹出试卷列表，选中就是链接，后面写上第几题。
> 复习时点链接直接跳回原题。

## 错因怎么选

| 错因 | 意思 | 下次怎么办 |
|---|---|---|
| 审题 | 看错/漏看题目条件 | 圈出关键词再做 |
| 知识 | 这个知识点不会 | 看解析，把知识点抄一遍 |
| 方法 | 知道考什么，但不会做 | 把解析的方法用自己的话写下来 |
| 计算 | 会做但算错 | 练估算、截位直除 |
| 纠结 | 两个选项犹豫选错 | 写下正确选项比错误选项好在哪 |
| 时间 | 没时间做/蒙的 | 调整做题顺序，先易后难 |

## 我的错题

| 日期 | 题目 | 模块 | 错因 | 正确思路（一句话） | 复习过 |
|---|---|---|---|---|---|
| 示例 10-21 | 2016 联考内蒙古 · 言语 第 1 题 | 言语 | 纠结 | “字斟句酌”对应“字不虚设”，B 只说追求完美 | ✓ |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |
""" % HOME)

# ---------- 考情速览 ----------
seen = set()
uniq = []
for r in R:
    for q in r["qs"]:
        if q["qid"] not in seen:
            seen.add(q["qid"])
            uniq.append((r["module"], q))
types = C.defaultdict(C.Counter)
four, two, conj, ans = C.Counter(), C.Counter(), C.Counter(), C.Counter()
for m, q in uniq:
    types[m][q["type"]] += 1
    if q["ans"] in ("A", "B", "C", "D"):
        ans[q["ans"]] += 1
    if q["type"] == "逻辑填空":
        for c in q["correct"]:
            for tok in re.split(r"[\s　，、；;,/]+", c):
                if re.fullmatch(r"[一-鿿]{4}", tok):
                    four[tok] += 1
                elif re.fullmatch(r"[一-鿿]{2}", tok):
                    (conj if tok in CONJ else two)[tok] += 1
yr = C.defaultdict(C.Counter)
for r in R:
    yr[int(r["year"])][r["module"]] += r["count"]
gk = C.defaultdict(dict)
for p in GK:
    if "副省级" in p["title"]:
        for m, v in p["mods"].items():
            gk[p["year"]][m] = v["count"]

S = ["# 十年行测考情速览（2016–2026）", "", HOME, "",
     "> 以下数据由工具包对整套题库自动统计，题型分类沿用题库原始标注。题库为网友回忆版，个别卷不完整，看趋势就好。", "",
     "## 一、题库有多少题", "",
     "- **%d 套卷**，覆盖 2016–2026 年国考、各省省考、市考、选调" % len(papers),
     "- 按卷累计 **%s 题次**；联考卷各省共用题目，**去重后 %s 道不同的题**" % (format(sum(r["count"] for r in R), ","), format(len(seen), ",")),
     "", "| 地区 | 卷数 | 地区 | 卷数 | 地区 | 卷数 |", "|---|---|---|---|---|---|"]
cells = ["%s | %d" % (region_link(rg).replace("|", "\\|"), len(by_region[rg])) for rg in regions]
while len(cells) % 3:
    cells.append(" | ")
for i in range(0, len(cells), 3):
    S.append("| " + " | ".join(cells[i:i + 3]) + " |")
S += ["", "## 二、国考变了：2025 年起政治理论大幅增加", "",
      "国考副省级卷各模块题量（题）：", "",
      "| 年份 | 政治理论 | 常识 | 言语 | 数量 | 判断 | 资料 |", "|---|---|---|---|---|---|---|"]
for y in sorted(gk):
    S.append("| %d | %s |" % (y, " | ".join(str(gk[y].get(m, 0) or "–") for m in MOD_ORDER)))
S += ["", "**结论**：2025 年起国考副省级政治理论从个位数涨到 20 题左右，言语从 40 题减到 30 题、判断从 40 题减到 35 题。"
      "时政和政治理论要单独留时间复习，不能只靠常识。", "",
      "## 三、所有卷各模块占比变化", "",
      "| 年份 | 政治理论 | 常识 | 言语 | 数量 | 判断 | 资料 |", "|---|---|---|---|---|---|---|"]
for y in sorted(yr):
    t = sum(yr[y].values())
    S.append("| %d | %s |" % (y, " | ".join("%.1f%%" % (100.0 * yr[y][m] / t) for m in MOD_ORDER)))
S += ["", "## 四、各模块考什么（去重后题量）", ""]
for m in MOD_ORDER:
    t = sum(types[m].values())
    parts = "、".join("%s %d（%d%%）" % (k, v, round(100.0 * v / t)) for k, v in types[m].most_common())
    S.append("- **%s**（%d 道）：%s" % (SHORT[m], t, parts))
S += ["", "## 五、逻辑填空：十年里反复当正确答案的词", "",
      "> 统计的是**正确选项**里出现的词，同一道题只算一次。这些词的意思和用法一定要吃透。", "",
      "**高频成语 Top 30**", ""]
S.append("、".join("%s（%d）" % (k, v) for k, v in four.most_common(30)))
S += ["", "**高频双字实词 Top 30**", ""]
S.append("、".join("%s（%d）" % (k, v) for k, v in two.most_common(30)))
S += ["", "**高频关联词**", ""]
S.append("、".join("%s（%d）" % (k, v) for k, v in conj.most_common(15)))
t = sum(ans.values())
S += ["", "## 六、单选题答案分布", "",
      "| A | B | C | D |", "|---|---|---|---|",
      "| %s |" % " | ".join("%.1f%%" % (100.0 * ans[k] / t) for k in "ABCD"), "",
      "基本平均，A 略少。**别靠蒙，靠刷。**"]
write("04-十年考情速览.md", "\n".join(S))

# ---------- 首页 ----------
H = ["# 行测刷题工具包 · 从这里开始", "",
     "> 配合免费开源题库 **xingcezhenti**（GitHub：ERRRC/xingcezhenti）使用。"
     "题目、答案和解析都在题库里，本工具包负责帮你**找卷、排计划、记错题、看考情**。", "",
     "## 三步开始", "",
     "1. 在下面「按考试找卷」点你要考的地区，看看有哪些卷",
     "2. 打开同一地区的「30 天计划」，每天照着刷，刷完打勾",
     "3. 做错的题记进%s，复盘日重做" % WRONG, "",
     "## 按考试找卷", ""]
groups = [("国考", [r for r in regions if r == "国考"]),
          ("省考", [r for r in regions if r not in ("国考", "深圳市考", "广州市考", "选调")]),
          ("市考", [r for r in regions if r in ("深圳市考", "广州市考")]),
          ("选调", [r for r in regions if r == "选调"])]
for g, lst in groups:
    if lst:
        H.append("- **%s**：%s" % (g, " · ".join("%s（%d）" % (region_link(r), len(by_region[r])) for r in lst)))
H += ["", "## 30 天计划", "",
      "- **国考**：%s" % plan_link("国考"),
      "- **省考**：%s" % " · ".join(plan_link(r, r) for r in regions if r not in ("国考", "深圳市考", "广州市考", "选调")),
      "- **市考 / 选调**：%s" % " · ".join(plan_link(r, r) for r in ("深圳市考", "广州市考", "选调") if r in by_region),
      "", "## 其他", "",
      "- %s：错因分类 + 记录表" % WRONG,
      "- [[%s/04-十年考情速览|十年考情速览]]：国考结构变化、各模块题型、高频成语" % KIT, "",
      "## 各模块建议用时（按国考 120 分钟）", "",
      "| 模块 | 每题 | 举例 |", "|---|---|---|",
      "| 政治理论 / 常识 | 30 秒 | 20 题 10 分钟 |",
      "| 言语理解 | 50 秒 | 30 题 25 分钟 |",
      "| 判断推理 | 50 秒 | 35 题 30 分钟 |",
      "| 资料分析 | 75 秒 | 20 题 25 分钟 |",
      "| 数量关系 | 60 秒 | 15 题 15 分钟，难题直接跳 |", "",
      "## 说明", "",
      "- 题库是 GitHub 上的免费开源项目，题目、答案、解析的版权归原作者和原出处，本工具包不包含任何题目内容。",
      "- 工具包里的链接指向题库里的文件，所以要把「%s」文件夹放进题库文件夹里才能用（见使用教程）。" % KIT,
      "- 打勾的进度保存在你自己的文件里，换电脑时整个文件夹一起拷走即可。"]
write("00-从这里开始.md", "\n".join(H))

print("regions", len(regions), "files", sum(len(f) for _, _, f in os.walk(base)))

if len(sys.argv) > 3:
    json.dump(PLANS, open(sys.argv[3], "w", encoding="utf-8"), ensure_ascii=False)
