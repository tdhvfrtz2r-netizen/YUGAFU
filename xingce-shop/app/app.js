'use strict';
// 行测真题刷题：纯前端、离线可用。做题记录只存在本机（localStorage）。

const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const app = $('#app');
let IDX = null, PLANS = null;
const paperCache = {};

// ---------- 本机存储 ----------
const KEY = 'xingce-v1';
const DEF = () => ({ region: null, planStart: null, pp: {}, wrong: {}, star: {}, exams: {}, last: null, fs: 17, auto: false });
let S = DEF();
try { S = Object.assign(DEF(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* 隐私模式等，读不到就用默认值 */ }
let saveTimer = 0;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* 存不下就算了 */ } }, 150);
}
document.documentElement.style.setProperty('--fs', S.fs + 'px');

// ---------- 数据 ----------
const getJSON = u => fetch(u).then(r => { if (!r.ok) throw new Error(u); return r.json(); });
const paper = pid => (paperCache[pid] ||= getJSON(`data/p/${pid}.json`));
const P = pid => IDX.papers[pid];
const MN = () => IDX.mn;
const pname = pid => `${P(pid).y} ${P(pid).n}`;
const modOf = (pid, mi) => P(pid).mods.find(m => m[0] === mi);
const pp = pid => (S.pp[pid] ||= {});
function progress(pid, mi) {
  const rec = S.pp[pid] || {};
  let lo = 0, n = P(pid).mods.reduce((s, m) => s + m[2], 0);
  if (mi != null) { const m = modOf(pid, mi); lo = m[1]; n = m[2]; }
  let done = 0, ok = 0;
  for (const k in rec) { const i = +k; if (i >= lo && i < lo + n) { done++; ok += rec[k]; } }
  return { done, ok, n };
}
function totals() {
  let done = 0, ok = 0;
  for (const pid in S.pp) for (const k in S.pp[pid]) { done++; ok += S.pp[pid][k]; }
  return { done, ok, wrong: Object.keys(S.wrong).length };
}
const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
const fmtTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 1600);
}
function sheet(html) { const s = $('#sheet'); s.innerHTML = `<div class="pane">${html}</div>`; s.hidden = false; }
$('#sheet').addEventListener('click', e => { if (e.target.id === 'sheet' || e.target.closest('[data-close]')) $('#sheet').hidden = true; });

function tabs(on) {
  const t = $('#tabs'); t.hidden = !on;
  t.querySelectorAll('a').forEach(a => a.classList.toggle('on', a.dataset.tab === on));
}

// ---------- 30 天计划 ----------
function planDay() {
  if (!S.planStart) return 0;
  const d = Math.floor((Date.now() - S.planStart) / 864e5) + 1;
  return Math.max(1, Math.min(30, d));
}
function dayTasks(region, d) {
  const pl = PLANS[region]; if (!pl) return { kind: 'none' };
  if ([7, 14, 21].includes(d)) return { kind: 'review' };
  if (d === 27 || d === 30) return { kind: 'mockreview' };
  if (d >= 25) { const pid = pl.mocks[[25, 26, 28, 29].indexOf(d)]; return pid ? { kind: 'mock', pid } : { kind: 'free' }; }
  return { kind: 'study', tasks: pl.days[d] || [] };
}
function taskRows(region, d) {
  const t = dayTasks(region, d);
  if (t.kind === 'study') return t.tasks.map(([pid, mi]) => {
    const g = progress(pid, mi), fin = g.done >= g.n;
    return `<a class="task" href="#/do/${pid}/practice/${mi}/0"><span class="ck ${fin ? 'on' : ''}">${fin ? '✓' : ''}</span>
      <span class="m"><b>${esc(pname(pid))} · ${MN()[mi]}</b><span>${g.n} 题 · 已做 ${g.done}${g.done ? ` · 正确率 ${pct(g.ok, g.done)}%` : ''}</span></span><span class="go">›</span></a>`;
  }).join('');
  if (t.kind === 'mock') {
    const ex = S.exams[t.pid], fin = ex && ex.done;
    return `<a class="task" href="#/p/${t.pid}"><span class="ck ${fin ? 'on' : ''}">${fin ? '✓' : ''}</span>
      <span class="m"><b>整卷模考：${esc(pname(t.pid))}</b><span>限时 ${P(t.pid).lim} 分钟${fin ? ` · 得分 ${ex.res.score}` : ''}</span></span><span class="go">›</span></a>`;
  }
  if (t.kind === 'review' || t.kind === 'mockreview') return `<a class="task" href="#/wrong"><span class="ck"></span><span class="m"><b>${t.kind === 'review' ? '复盘日' : '模考复盘'}：把错题重做一遍</b><span>错题本里现在有 ${Object.keys(S.wrong).length} 道</span></span><span class="go">›</span></a>`;
  if (t.kind === 'free') return `<a class="task" href="#/r/${encodeURIComponent(region)}"><span class="ck"></span><span class="m"><b>自选一套没做过的整卷限时模考</b></span><span class="go">›</span></a>`;
  return '';
}

// ---------- 页面 ----------
function pickRegion(after) {
  sheet(`<h3>你要考哪里？<a data-close>✕</a></h3><div class="regions">${IDX.regions.map(g =>
    `<button data-r="${esc(g.r)}" class="${g.r === S.region ? 'on' : ''}">${esc(g.r)}<span>${g.ps.length} 套</span></button>`).join('')}</div>`);
  $('#sheet').querySelectorAll('[data-r]').forEach(a => a.onclick = () => {
    S.region = a.dataset.r; save(); $('#sheet').hidden = true; (after || route)();
  });
}

function home() {
  tabs('home');
  if (!S.region) {
    app.innerHTML = `<div class="top"><h1>行测真题刷题</h1></div>
      <div class="hello">先选一下你要考哪里</div><div class="sub">之后首页会显示这个地区的卷子和 30 天计划，随时可以改</div>
      <div class="regions">${IDX.regions.map(g => `<button data-r="${esc(g.r)}">${esc(g.r)}<span>${g.ps.length} 套</span></button>`).join('')}</div>`;
    app.querySelectorAll('[data-r]').forEach(a => a.onclick = () => { S.region = a.dataset.r; save(); home(); });
    return;
  }
  const g = IDX.regions.find(x => x.r === S.region), tt = totals(), d = planDay();
  const latest = g.ps.find(pid => P(pid).mods.length >= 5) || g.ps[0];
  let plan;
  if (d) plan = `<div class="card"><h2>今日计划 · 第 ${d} 天 <small><a href="#/plan">全部 30 天 ›</a></small></h2>${taskRows(S.region, d)}</div>`;
  else plan = `<div class="card"><h2>30 天刷题计划</h2><div class="sub" style="margin-bottom:10px">每天做什么都排好了：前 24 天分模块专项，最后 6 天整卷模考</div>
    <button class="btn acc block" id="startPlan">从今天开始</button></div>`;
  let cont = '';
  if (S.last && P(S.last.pid)) cont = `<a class="card" style="display:block" href="${S.last.href}"><h2>继续上次 <small>›</small></h2><div class="sub">${esc(S.last.label)}</div></a>`;
  app.innerHTML = `<div class="top"><h1>行测真题刷题</h1><button class="chip" id="reg">${esc(S.region)} ▾</button><a class="chip" href="#/me">设置</a></div>
    <div class="statrow"><div class="stat"><b>${tt.done}</b><span>已做题</span></div><div class="stat"><b>${tt.done ? pct(tt.ok, tt.done) + '%' : '–'}</b><span>正确率</span></div><a class="stat" href="#/wrong"><b>${tt.wrong}</b><span>错题</span></a></div>
    ${plan}${cont}
    <div class="grid4">
      <a class="tile" href="#/r/${encodeURIComponent(S.region)}"><b>历年真题</b><span>${esc(S.region)} · ${g.ps.length} 套</span></a>
      <a class="tile" href="#/p/${latest}"><b>限时模考</b><span>${esc(pname(latest))}</span></a>
      <a class="tile" href="#/wrong"><b>错题本</b><span>${tt.wrong} 道待复习</span></a>
      <a class="tile" href="#/star"><b>收藏夹</b><span>${Object.keys(S.star).length} 道</span></a>
    </div>
    <div class="note">网友回忆版真题 · 含题目和答案 · 做题记录只保存在这台手机上</div>`;
  $('#reg').onclick = () => pickRegion();
  const sp = $('#startPlan'); if (sp) sp.onclick = () => { const t = new Date(); t.setHours(0, 0, 0, 0); S.planStart = t.getTime(); save(); home(); };
}

function bank() {
  tabs('bank');
  app.innerHTML = `<div class="top"><h1>题库</h1></div><div class="sub">${Object.keys(IDX.papers).length} 套 · 网友回忆版</div>
    <div class="regions">${IDX.regions.map(g => `<a href="#/r/${encodeURIComponent(g.r)}" class="${g.r === S.region ? 'on' : ''}">${esc(g.r)}<span>${g.ps.length} 套</span></a>`).join('')}</div>`;
}

function region(r) {
  tabs('bank');
  const g = IDX.regions.find(x => x.r === r); if (!g) return notFound();
  let html = `<div class="top"><a class="back" href="#/bank">‹</a><h1>${esc(r)}</h1><span class="sub">${g.ps.length} 套</span></div>`, yr = 0, open = false;
  for (const pid of g.ps) {
    const p = P(pid);
    if (p.y !== yr) { if (open) html += '</div>'; html += `<div class="yr">${p.y} 年</div><div class="list">`; yr = p.y; open = true; }
    const pr = progress(pid), ex = S.exams[pid];
    html += `<a class="row" href="#/p/${pid}"><span class="m"><b>${esc(p.n)}${p.ec ? ' <span class="badge">解析</span>' : ''}</b><span>${pr.n} 题${pr.done ? ` · 已做 ${pr.done} · 正确率 ${pct(pr.ok, pr.done)}%` : ''}${ex && ex.done ? ` · 模考 ${ex.res.score} 分` : ''}</span>
      <div class="bar"><i style="width:${pct(pr.done, pr.n)}%"></i></div></span><span class="go">›</span></a>`;
  }
  app.innerHTML = html + (open ? '</div>' : '');
}

function paperPage(pid) {
  tabs('bank');
  const p = P(pid); if (!p) return notFound();
  const pr = progress(pid), ex = S.exams[pid];
  let exBtn = `<a class="main" href="#/do/${pid}/exam/all/0"><b>限时模考</b><span>${p.lim} 分钟 · 交卷打分</span></a>`;
  if (ex && !ex.done) exBtn = `<a class="main" href="#/do/${pid}/exam/all/0"><b>继续模考</b><span>已答 ${Object.keys(ex.a).length} 题</span></a>`;
  if (ex && ex.done) exBtn = `<a class="main" href="#/report/${pid}"><b>${ex.res.score} 分</b><span>看成绩 / 重考</span></a>`;
  app.innerHTML = `<div class="top"><a class="back" href="#/r/${encodeURIComponent(p.r)}">‹</a><h1>${esc(p.y + ' ' + p.n)}</h1></div>
    <div class="sub">${esc(p.t)}</div>
    <div class="card"><h2>${pr.n} 题 <small>已做 ${pr.done}${pr.done ? ` · 正确率 ${pct(pr.ok, pr.done)}%` : ''}</small></h2><div class="bar"><i style="width:${pct(pr.done, pr.n)}%"></i></div>
      <div class="sub" style="margin-top:8px">${IDX.orig ? `<span class="badge">解析</span> 每道题都有原题库解析${p.ec ? `，其中 ${p.ec} 道另有精简解析` : ''}` : p.ec ? `<span class="badge">解析</span> 本卷 ${p.ec === pr.n ? '全部' : p.ec + ' 道'}题目有解析` : '本卷解析还在编写中，可以先刷题看答案'}</div></div>
    <div class="big3"><a href="#/do/${pid}/practice/all/0"><b>练习</b><span>做一题对一题</span></a><a href="#/do/${pid}/memo/all/0"><b>背题</b><span>直接看答案</span></a>${exBtn}</div>
    <div class="mh">按模块</div>
    <div class="list">${p.mods.map(([mi, st, n]) => { const g = progress(pid, mi); return `<div class="row"><span class="m"><b>${MN()[mi]}</b><span>第 ${st + 1}–${st + n} 题 · ${n} 题${g.done ? ` · 已做 ${g.done} · ${pct(g.ok, g.done)}%` : ''}</span><div class="bar"><i style="width:${pct(g.done, n)}%"></i></div></span>
      <a class="btn sm ghost" href="#/do/${pid}/memo/${mi}/0">背</a><a class="btn sm" href="#/do/${pid}/practice/${mi}/0">练</a></div>`; }).join('')}</div>`;
}

// ---------- 解析 ----------
// 解析是纯文字：【思路】【排除】这类标签加粗，换行保留
// 个人版另有原题库解析 q.oe（HTML），有精简解析时折叠在下面，没有时直接展开
function expBlock(q) {
  const ours = q.e ? `<div class="exp"><div class="exp-h">解析</div>${esc(q.e).replace(/【([^】]{1,6})】/g, '<b class="el">$1</b>').replace(/\n/g, '<br>')}</div>` : '';
  const orig = q.oe ? `<details class="exp orig"${q.e ? '' : ' open'}><summary>原题库解析</summary><div class="oe">${q.oe}</div></details>` : '';
  return ours + orig || `<div class="exp none">本题解析还在编写中</div>`;
}

// ---------- 做题 ----------
let SES = null, timerId = 0;
async function doPage(src, mode, mod, start) {
  tabs(null);
  clearInterval(timerId);
  let items = [], title = '';
  if (src === '_wrong' || src === '_star') {
    const book = src === '_wrong' ? S.wrong : S.star;
    const keys = Object.keys(book).sort((a, b) => book[b] - book[a]);
    const pids = [...new Set(keys.map(k => k.split(':')[0]))].filter(P);
    await Promise.all(pids.map(paper));
    for (const k of keys) {
      const [pid, qi] = k.split(':'); if (!P(pid)) continue;
      const q = (await paper(pid)).qs[+qi];
      if (q && (mod === 'all' || q.m === +mod)) items.push({ pid, qi: +qi });
    }
    title = (src === '_wrong' ? '错题重做' : '收藏') + (mod === 'all' ? '' : ' · ' + MN()[+mod]);
    if (!items.length) { app.innerHTML = `<div class="top"><a class="back" href="#/${src.slice(1)}">‹</a><h1>${title}</h1></div><div class="empty">这里没有题了 🎉</div>`; return; }
  } else {
    const pd = await paper(src), p = P(src);
    const qs = pd.qs.map((q, qi) => ({ pid: src, qi, q }));
    items = (mod === 'all' ? qs : qs.filter(x => x.q.m === +mod)).map(({ pid, qi }) => ({ pid, qi }));
    title = `${p.y} ${p.n}` + (mod === 'all' ? '' : ' · ' + MN()[+mod]);
  }
  const papers = {};
  for (const it of items) papers[it.pid] = await paper(it.pid);
  SES = { src, mode, mod, items, i: Math.min(+start || 0, items.length - 1), title, papers, picked: {}, shown: {} };
  if (mode === 'exam') {
    const ex = S.exams[src];
    if (!ex || ex.done) { S.exams[src] = { st: Date.now(), a: {}, done: false }; save(); }
    timerId = setInterval(tick, 1000);
  }
  renderQ();
}
function examLeft() { const ex = S.exams[SES.src]; return P(SES.src).lim * 60 - (Date.now() - ex.st) / 1000; }
function tick() {
  if (!SES || SES.mode !== 'exam') return clearInterval(timerId);
  const left = examLeft(), el = $('#timer');
  if (el) el.textContent = fmtTime(Math.max(0, left));
  if (left <= 0) { clearInterval(timerId); toast('时间到，自动交卷'); submitExam(); }
}

function qOf(it) { return SES.papers[it.pid].qs[it.qi]; }
function answerState(it) {
  const key = it.pid + ':' + it.qi, q = qOf(it);
  if (SES.mode === 'exam') return { chosen: S.exams[SES.src].a[it.qi], reveal: false };
  if (SES.mode === 'memo') return { chosen: null, reveal: true };
  if (SES.picked[key] != null) return { chosen: SES.picked[key], reveal: true };
  return { chosen: null, reveal: false, q };
}

function renderQ() {
  const it = SES.items[SES.i], q = qOf(it), pd = SES.papers[it.pid], key = it.pid + ':' + it.qi;
  const st = answerState(it), multi = q.a && q.a.length > 1, mode = SES.mode;
  S.last = { pid: it.pid, href: `#/do/${SES.src}/${mode}/${SES.mod}/${SES.i}`, label: `${SES.title} · 第 ${SES.i + 1} 题（${{ practice: '练习', memo: '背题', exam: '模考' }[mode]}）` };
  save();
  const mat = q.x != null ? `<div class="mat fold" id="mat"><div class="mat-h"><span>${q.m === 5 ? '资料' : '材料'}</span><button id="matT">展开全部</button></div><div class="mat-b">${pd.mats[q.x]}</div></div>` : '';
  let opts = '';
  const sel = st.chosen || SES.shown[key] || '';
  if (q.k) {
    const cls = q.o ? 'opts' : 'opts row4';
    opts = `<div class="${cls}" id="opts">${[...q.k].map((k, j) => {
      let c = '';
      if (st.reveal && q.a) c = q.a.includes(k) ? 'right' : (st.chosen && st.chosen.includes(k) ? 'wrong' : '');
      else if (sel.includes(k)) c = 'sel';
      return `<button class="opt ${c}" data-k="${k}"><span class="ok">${k}</span><span class="ot">${q.o ? q.o[j] : ''}</span></button>`;
    }).join('')}</div>`;
    if (multi && !st.reveal) opts += `<div class="sub" style="margin:-4px 0 8px">多选题：选好后点「确认」</div>`;
  } else {
    opts = `<div class="opts"><button class="btn ghost block" id="showAns">本题没有选项，点击看答案</button></div>`;
  }
  let fb = '';
  if (mode === 'practice' && st.reveal) {
    const ok = st.chosen === q.a;
    fb = q.a ? `<div class="fb ${ok ? 'ok' : 'bad'}"><span>${ok ? '✓ 回答正确' : `✗ 正确答案 ${q.a}`}</span><small>${ok ? '' : '已加入错题本'}</small></div>` : `<div class="fb memo">本题答案缺失</div>`;
  }
  if (mode === 'memo') fb = `<div class="fb memo"><span>答案 ${q.a || (q.k ? '缺失' : '略')}</span></div>`;
  if (mode === 'memo' || (mode === 'practice' && st.reveal)) fb += expBlock(q);
  const total = SES.items.length;
  const no = SES.src.startsWith('_') ? SES.i + 1 : it.qi + 1;
  const timer = mode === 'exam' ? `<span class="timer" id="timer">${fmtTime(Math.max(0, examLeft()))}</span>` : '';
  const back = SES.src.startsWith('_') ? `#/${SES.src.slice(1)}` : `#/p/${SES.src}`;
  const lastBtn = SES.i < total - 1 ? `<button class="btn" id="next">下一题</button>` : (mode === 'exam' ? `<button class="btn acc" id="submit">交卷</button>` : `<a class="btn" href="${back}">完成</a>`);
  const confirmBtn = multi && !st.reveal && mode !== 'memo' ? `<button class="btn acc" id="confirm">确认</button>` : '';
  app.innerHTML = `<div class="qwrap">
    <div class="qbar"><a class="back" href="${back}">‹</a><span class="t">${esc(SES.title)}</span>${timer}<span class="sub">${SES.i + 1}/${total}</span></div>
    <div class="prog"><i style="width:${pct(SES.i + 1, total)}%"></i></div>
    ${mat}
    <div class="qhead"><span class="qno">${no}.</span><span class="tag">${MN()[q.m]} · ${esc(q.ty)}${SES.src.startsWith('_') ? ' · ' + esc(pname(it.pid)) : ''}</span><button class="star ${S.star[key] ? 'on' : ''}" id="star">${S.star[key] ? '★' : '☆'}</button></div>
    <div class="stem">${q.s}</div>${opts}${fb}</div>
    <div class="qnav"><div><button class="btn ghost" id="prev" ${SES.i ? '' : 'disabled style="opacity:.4"'}>上一题</button>
    <button class="btn ghost card-btn" id="cardBtn">题卡</button>${confirmBtn || lastBtn}${mode === 'exam' && SES.i < total - 1 ? `<button class="btn acc" id="submit" style="flex:.8">交卷</button>` : ''}</div></div>`;
  window.scrollTo(0, 0);
  const m = $('#mat');
  if (m) { const b = $('.mat-b', m); if (b.scrollHeight < innerHeight * 0.34) { m.classList.remove('fold'); $('#matT').remove(); } else $('#matT').onclick = () => { m.classList.toggle('fold'); $('#matT').textContent = m.classList.contains('fold') ? '展开全部' : '收起'; }; }
  $('#star').onclick = () => { if (S.star[key]) delete S.star[key]; else S.star[key] = Date.now(); save(); toast(S.star[key] ? '已收藏' : '已取消收藏'); renderQ(); };
  $('#prev').onclick = () => go(-1);
  const nx = $('#next'); if (nx) nx.onclick = () => go(1);
  const sb = $('#submit'); if (sb) sb.onclick = () => confirmSubmit();
  $('#cardBtn').onclick = answerCard;
  const sa = $('#showAns'); if (sa) sa.onclick = () => { sa.outerHTML = `<div class="fb memo">答案 ${q.a || '略'}</div>`; };
  const cf = $('#confirm'); if (cf) cf.onclick = () => { const v = [...(SES.shown[key] || '')].sort().join(''); if (!v) return toast('先选答案'); choose(it, v); };
  if (q.k && !st.reveal && mode !== 'memo') {
    app.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      const k = b.dataset.k;
      if (multi) { const cur = SES.shown[key] || ''; SES.shown[key] = cur.includes(k) ? cur.replace(k, '') : cur + k; if (mode === 'exam') choose(it, [...SES.shown[key]].sort().join(''), true); else renderQ(); return; }
      choose(it, k);
    });
  }
}

function choose(it, v, stay) {
  const q = qOf(it), key = it.pid + ':' + it.qi;
  if (SES.mode === 'exam') {
    S.exams[SES.src].a[it.qi] = v; save();
    if (stay || (q.a && q.a.length > 1)) return renderQ();
    if (SES.i < SES.items.length - 1) return setTimeout(() => go(1), 180);
    return renderQ();
  }
  SES.picked[key] = v;
  const ok = q.a ? (v === q.a ? 1 : 0) : 1;
  pp(it.pid)[it.qi] = ok;
  if (!ok) S.wrong[key] = Date.now();
  else if (S.wrong[key] && SES.src === '_wrong') { delete S.wrong[key]; toast('答对了，已移出错题本'); }
  save(); renderQ();
  if (ok && S.auto && !q.e && SES.i < SES.items.length - 1) setTimeout(() => { if (SES && SES.items[SES.i] === it) go(1); }, 650);
}
function go(d) {
  const n = SES.i + d; if (n < 0 || n >= SES.items.length) return;
  SES.i = n; setHash(`#/do/${SES.src}/${SES.mode}/${SES.mod}/${n}`, true); renderQ();
}
function answerCard() {
  const cells = SES.items.map((it, i) => {
    const key = it.pid + ':' + it.qi, q = qOf(it);
    let c = '';
    if (SES.mode === 'exam') c = S.exams[SES.src].a[it.qi] ? 'ans' : '';
    else if (SES.picked[key] != null) c = SES.picked[key] === q.a ? 'ok' : 'bad';
    else if (SES.mode === 'practice' && S.pp[it.pid] && S.pp[it.pid][it.qi] != null) c = S.pp[it.pid][it.qi] ? 'ok' : 'bad';
    return `<button data-i="${i}" class="${c} ${i === SES.i ? 'cur' : ''}">${SES.src.startsWith('_') ? i + 1 : it.qi + 1}</button>`;
  });
  const legend = SES.mode === 'exam' ? '<span>蓝色 = 已作答</span>' : '<span>绿 = 对</span><span>红 = 错</span>';
  sheet(`<h3>题卡<a data-close>✕</a></h3><div class="legend">${legend}</div><div class="cardgrid">${cells.join('')}</div>
    ${SES.mode === 'exam' ? '<div class="btns"><button class="btn acc" id="sheetSubmit">交卷</button></div>' : ''}`);
  $('#sheet').querySelectorAll('[data-i]').forEach(a => a.onclick = () => { $('#sheet').hidden = true; go(+a.dataset.i - SES.i); });
  const ss = $('#sheetSubmit'); if (ss) ss.onclick = () => { $('#sheet').hidden = true; confirmSubmit(); };
}
function confirmSubmit() {
  const left = SES.items.length - Object.keys(S.exams[SES.src].a).length;
  sheet(`<h3>确定交卷？<a data-close>✕</a></h3><div class="sub">${left ? `还有 ${left} 题没做，` : ''}交卷后马上出成绩，错题会自动进错题本。</div>
    <div class="btns"><button class="btn ghost" data-close>再检查一下</button><button class="btn acc" id="doSubmit">交卷</button></div>`);
  $('#doSubmit').onclick = () => { $('#sheet').hidden = true; submitExam(); };
}
function submitExam() {
  clearInterval(timerId);
  const pid = SES.src, ex = S.exams[pid], pd = SES.papers[pid], p = P(pid);
  let ok = 0, scored = 0; const mods = {};
  pd.qs.forEach((q, qi) => {
    if (!q.a) return;
    scored++;
    const v = ex.a[qi], right = v === q.a ? 1 : 0;
    ok += right;
    (mods[q.m] ||= [0, 0]); mods[q.m][0] += right; mods[q.m][1]++;
    if (v != null) { pp(pid)[qi] = right; if (!right) S.wrong[pid + ':' + qi] = Date.now(); }  // 没作答的不进错题本
  });
  ex.done = true;
  ex.res = { score: pct(ok, scored), ok, total: scored, blank: pd.qs.filter((q, qi) => q.a && ex.a[qi] == null).length, used: Math.min(p.lim * 60, Math.round((Date.now() - ex.st) / 1000)), mods: Object.entries(mods).map(([m, [a, b]]) => [+m, a, b]) };
  S.last = null; save();
  nav(`#/report/${pid}`, true);
}

function report(pid) {
  tabs(null);
  const ex = S.exams[pid], p = P(pid); if (!ex || !ex.done) return paperPage(pid);
  const r = ex.res;
  const blank = r.blank || 0, wrongN = r.total - r.ok - blank;
  app.innerHTML = `<div class="top"><a class="back" href="#/p/${pid}">‹</a><h1>模考成绩</h1></div>
    <div class="sub">${esc(p.y + ' ' + p.n)}</div>
    <div class="score"><b>${r.score}</b><span>答对 ${r.ok} · 答错 ${wrongN} · 未答 ${blank} · 用时 ${fmtTime(r.used)}（限时 ${p.lim} 分钟）</span></div>
    <div class="card"><h2>各模块正确率</h2><table class="mods">${r.mods.map(([m, a, b]) => `<tr><td>${MN()[m]}</td><td>${a} / ${b}</td><td>${pct(a, b)}%</td></tr>`).join('')}</table></div>
    <div class="btns"><a class="btn acc" href="#/review/${pid}">看错题 ${wrongN + blank}</a><button class="btn ghost" id="redo">重新模考</button></div>
    <div class="note">分数按正确率折算成百分制，只用来看自己的水平变化；真实考试各题分值不同。</div>`;
  $('#redo').onclick = () => { delete S.exams[pid]; save(); nav(`#/do/${pid}/exam/all/0`, true); };
}

async function review(pid) {
  tabs(null);
  const ex = S.exams[pid], pd = await paper(pid);
  if (!ex || !ex.done) return paperPage(pid);
  const items = pd.qs.map((q, qi) => ({ pid, qi, q })).filter(x => x.q.a && ex.a[x.qi] !== x.q.a);
  if (!items.length) { app.innerHTML = `<div class="top"><a class="back" href="#/report/${pid}">‹</a><h1>错题回顾</h1></div><div class="empty">全对，厉害 🎉</div>`; return; }
  SES = { src: pid, mode: 'practice', mod: 'all', items: items.map(({ pid, qi }) => ({ pid, qi })), i: 0, title: '模考错题回顾', papers: { [pid]: pd }, picked: {}, shown: {} };
  items.forEach(x => { SES.picked[pid + ':' + x.qi] = ex.a[x.qi] || ''; });
  renderQ();
}

function book(kind) {
  tabs(kind === 'wrong' ? 'wrong' : null);
  const b = kind === 'wrong' ? S.wrong : S.star, keys = Object.keys(b).filter(k => P(k.split(':')[0]));
  const name = kind === 'wrong' ? '错题本' : '收藏夹';
  if (!keys.length) { app.innerHTML = `<div class="top">${kind === 'star' ? '<a class="back" href="#/">‹</a>' : ''}<h1>${name}</h1></div><div class="empty">${kind === 'wrong' ? '还没有错题。做练习或模考时答错的题会自动收进来。' : '做题时点右上角 ☆ 收藏。'}</div>`; return; }
  app.innerHTML = `<div class="top">${kind === 'star' ? '<a class="back" href="#/">‹</a>' : ''}<h1>${name}</h1><span class="sub">${keys.length} 道</span></div>
    <a class="btn acc block" href="#/do/_${kind}/practice/all/0">全部重做</a>
    <div class="note" style="margin:10px 4px">${kind === 'wrong' ? '重做时答对的题会自动移出错题本。' : ''}</div>
    <div class="mh">按模块</div><div class="list" id="bym"></div>`;
  // 按模块统计需要读题目所在模块：用卷子的模块区间推算，不用加载整卷
  const cnt = {};
  for (const k of keys) {
    const [pid, qi] = k.split(':'), m = P(pid).mods.find(([, st, n]) => +qi >= st && +qi < st + n);
    if (m) cnt[m[0]] = (cnt[m[0]] || 0) + 1;
  }
  $('#bym').innerHTML = Object.entries(cnt).sort((a, b) => a[0] - b[0]).map(([m, n]) =>
    `<a class="row" href="#/do/_${kind}/practice/${m}/0"><span class="m"><b>${MN()[m]}</b><span>${n} 道</span></span><span class="go">重做 ›</span></a>`).join('');
}

function planPage() {
  tabs(null);
  if (!S.region) return home();
  const d = planDay(), pl = PLANS[S.region];
  let html = `<div class="top"><a class="back" href="#/">‹</a><h1>${esc(S.region)} · 30 天计划</h1></div>`;
  if (pl && pl.sup) html += `<div class="note" style="margin:0 4px 8px">${esc(S.region)}收录的卷不多，计划里用国考卷补齐。</div>`;
  for (let i = 1; i <= 30; i++) {
    const t = dayTasks(S.region, i);
    const label = { study: '专项练习', review: '复盘日', mock: '整卷模考', mockreview: '模考复盘', free: '自选整卷' }[t.kind] || '';
    html += `<div class="card day ${i === d ? 'today' : ''}" id="d${i}"><h2>第 ${i} 天 <small>${label}${i === d ? ' · 今天' : ''}</small></h2>${taskRows(S.region, i)}</div>`;
  }
  html += `<div class="btns"><button class="btn ghost" id="restart">${S.planStart ? '从今天重新开始' : '从今天开始计划'}</button></div>`;
  app.innerHTML = html;
  $('#restart').onclick = () => { const t = new Date(); t.setHours(0, 0, 0, 0); S.planStart = t.getTime(); save(); planPage(); toast('计划从今天开始'); };
  if (d) { const el = $('#d' + d); if (el) setTimeout(() => el.scrollIntoView({ block: 'center' }), 50); }
}

async function statsPage() {
  tabs('stats');
  app.innerHTML = `<div class="top"><h1>十年考情速览</h1></div><div class="statsdoc" id="sd">加载中…</div>`;
  try { $('#sd').innerHTML = await fetch('data/stats.html').then(r => r.text()); } catch (e) { $('#sd').textContent = '加载失败，联网后再试'; }
}

function me() {
  tabs(null);
  const sizes = [[15, '小'], [17, '中'], [19, '大'], [21, '特大']];
  app.innerHTML = `<div class="top"><a class="back" href="#/">‹</a><h1>设置</h1></div>
    <div class="list">
      <button class="row" id="reg"><span class="m"><b>考试地区</b><span>首页和 30 天计划按这个地区</span></span><span class="r">${esc(S.region || '未选')} ›</span></button>
      <div class="row"><span class="m"><b>题目字号</b></span><div class="seg" style="width:180px">${sizes.map(([v, n]) => `<button data-fs="${v}" class="${S.fs === v ? 'on' : ''}">${n}</button>`).join('')}</div></div>
      <div class="row"><span class="m"><b>答对自动下一题</b><span>练习模式，有解析的题不自动跳</span></span><button class="switch ${S.auto ? 'on' : ''}" id="auto"></button></div>
      <a class="row" href="#/plan"><span class="m"><b>30 天计划</b><span>${S.planStart ? '已开始，第 ' + planDay() + ' 天' : '还没开始'}</span></span><span class="go">›</span></a>
    </div>
    <div class="list"><button class="row" id="clear"><span class="m"><b style="color:var(--bad)">清空做题记录</b><span>做题进度、错题、收藏、模考成绩全部清掉</span></span></button></div>
    <div class="note">${IDX.orig ? '个人学习版：题目为网友回忆版；「原题库解析」来自 xingcezhenti 开源项目，版权归原出处，仅供个人学习，请勿传播。' : '题目为网友回忆版，含题目和参考答案。'}<br>做题记录只保存在这台手机的浏览器里，换手机或清理浏览器数据后记录会丢失。<br>添加到主屏幕：iPhone 用 Safari 点「分享 → 添加到主屏幕」；安卓在浏览器菜单里点「添加到桌面」。</div>`;
  $('#reg').onclick = () => pickRegion(me);
  app.querySelectorAll('[data-fs]').forEach(b => b.onclick = () => { S.fs = +b.dataset.fs; document.documentElement.style.setProperty('--fs', S.fs + 'px'); save(); me(); });
  $('#auto').onclick = () => { S.auto = !S.auto; save(); me(); };
  $('#clear').onclick = () => {
    sheet(`<h3>确定清空？<a data-close>✕</a></h3><div class="sub">清空后不能恢复。</div><div class="btns"><button class="btn ghost" data-close>取消</button><button class="btn acc" id="doClear">清空</button></div>`);
    $('#doClear').onclick = () => { const r = S.region; S = DEF(); S.region = r; save(); $('#sheet').hidden = true; toast('已清空'); me(); };
  };
}

function notFound() { app.innerHTML = `<div class="empty">找不到这一页 <a href="#/">回首页</a></div>`; }

// ---------- 路由 ----------
// 当前页面记在 HASH 里；能写地址栏的环境顺便写进去，这样浏览器的返回键也能用
let HASH = /^#\//.test(location.hash) ? location.hash : '#/';
function setHash(h, replace) { HASH = h; try { history[replace ? 'replaceState' : 'pushState'](null, '', h); } catch (e) { /* 有些内嵌环境不让改地址 */ } }
function nav(h, replace) { setHash(h, replace); route(); }
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#/"]');
  if (!a || e.defaultPrevented) return;
  e.preventDefault(); nav(a.getAttribute('href'));
});
window.addEventListener('popstate', () => { HASH = /^#\//.test(location.hash) ? location.hash : '#/'; route(); });

async function route() {
  $('#sheet').hidden = true;
  if (SES && !HASH.startsWith('#/do/')) { SES = null; clearInterval(timerId); }
  const [page, ...a] = HASH.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  try {
    if (!page) return home();
    if (page === 'bank') return bank();
    if (page === 'r') return region(a[0]);
    if (page === 'p') return paperPage(a[0]);
    if (page === 'do') return await doPage(a[0], a[1] || 'practice', a[2] || 'all', a[3] || 0);
    if (page === 'report') return report(a[0]);
    if (page === 'review') return await review(a[0]);
    if (page === 'wrong') return book('wrong');
    if (page === 'star') return book('star');
    if (page === 'plan') return planPage();
    if (page === 'stats') return statsPage();
    if (page === 'me') return me();
    notFound();
  } catch (e) {
    console.error(e);
    app.innerHTML = `<div class="empty">加载失败，检查一下网络再试<br><br><button class="btn ghost sm" onclick="location.reload()">重试</button></div>`;
  }
}

// 点图片放大（资料分析的表格、图形题）
app.addEventListener('click', e => {
  const img = e.target.closest('.stem img, .mat-b img, .ot img');
  if (!img || img.closest('.opt')) return;  // 选项里的图点了是选答案
  sheet(`<h3>双指可以放大<a data-close>✕</a></h3><div style="overflow:auto;background:#fff;border-radius:10px"><img src="${img.getAttribute('src')}" style="display:block;width:${Math.max(img.naturalWidth, 320)}px;max-width:none"></div>`);
});

// 左右滑动切题
let tx = 0, ty = 0;
document.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
document.addEventListener('touchend', e => {
  if (!SES || !HASH.startsWith('#/do/') && !HASH.startsWith('#/review/') || !$('#sheet').hidden) return;
  const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
  if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.8) go(dx < 0 ? 1 : -1);
}, { passive: true });

(async () => {
  try { [IDX, PLANS] = await Promise.all([getJSON('data/index.json'), getJSON('data/plans.json')]); }
  catch (e) { app.innerHTML = '<div class="empty">题库加载失败，检查一下网络再刷新</div>'; return; }
  route();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
