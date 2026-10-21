import os, re, sys, json, collections
root = sys.argv[1]; out = sys.argv[2]
MODS = ["01-政治理论","02-常识判断","03-言语理解与表达","04-数量关系","05-判断推理","06-资料分析"]
fm_re = re.compile(r'^---\n(.*?)\n---\n', re.S)
q_re = re.compile(r'^#{2,3} 第 (\d+) 题　<sub>qid (\d+) · (.*?)</sub>\s*$', re.M)
ans_re = re.compile(r'^\*\*答案\*\*：(.*)$', re.M)
records = []
for m in MODS:
    d = os.path.join(root, m)
    for fn in sorted(os.listdir(d)):
        if fn == "README.md" or not fn.endswith(".md"): continue
        t = open(os.path.join(d, fn), encoding="utf-8").read()
        fm = dict(re.findall(r'^(\S+?): "(.*)"$', fm_re.match(t).group(1), re.M))
        # split per question block
        qs = []
        heads = list(q_re.finditer(t))
        for i, h in enumerate(heads):
            body = t[h.end(): heads[i+1].start() if i+1 < len(heads) else len(t)]
            a = ans_re.search(body)
            correct = [l for l in body.splitlines() if l.startswith("- **") and "✅" in l]
            correct = [re.sub(r'^- \*\*[A-H]\*\*\. ', '', c).replace("✅","").strip() for c in correct]
            qs.append({"n": int(h.group(1)), "qid": h.group(2), "type": h.group(3), "ans": a.group(1).strip() if a else None, "correct": correct})
        records.append({"module": m, "file": fn[:-3], "paper": fm.get("试卷"), "region": fm.get("地区"), "year": fm.get("年份"), "count": int(fm.get("题数", 0)), "qs": qs})
json.dump(records, open(out, "w", encoding="utf-8"), ensure_ascii=False)
print(len(records), sum(r["count"] for r in records), sum(len(r["qs"]) for r in records))
