// 画面。ルールは engine.js に任せ、ここは表示と操作だけを扱う。
(function (TK) {
  'use strict';
  var S = null, tab = 'adv', pickedArea = 0, selUid = null, activeRun = null, skip = false;
  var mix = { a: null, b: null, base: null, skill: '' }, dexRole = 'all', dexPage = 0, ranchPage = 0, ranchSort = 'lv', bagSlot = 'all';
  var PAGE_SIZE = 50;
  var $ = function (id) { return document.getElementById(id); };
  var app = $('app'), modalEl = $('modal'), toastEl = $('toast');
  var sp = function (id) { return TK.SPECIES[id]; };
  var art = function (id) { return TK.creatureSvg(id); };
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, skip ? 0 : ms / (S.speed || 1)); }); }
  function save() { TK.save(S); }
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('on');
    clearTimeout(toast.t);
    toast.t = setTimeout(function () { toastEl.classList.remove('on'); }, 2400);
  }
  // buttons: [[ラベル, コールバック, 'pri'など]]
  function modal(title, body, buttons, img) {
    modalEl.innerHTML = '<div class="mbox" role="dialog" aria-modal="true"><h3>' + title + '</h3>' + (img != null ? '<div class="c">' + art(img) + '</div>' : '') +
      '<div>' + body + '</div><div class="mbtn"></div></div>';
    var box = modalEl.querySelector('.mbtn');
    (buttons || [['とじる']]).forEach(function (b) {
      var el = document.createElement('button');
      el.className = 'btn ' + (b[2] || '');
      el.textContent = b[0];
      el.onclick = function () { closeModal(); if (b[1]) b[1](); };
      box.appendChild(el);
    });
    modalEl.hidden = false;
    var f = box.querySelector('button');
    if (f) f.focus();
  }
  function closeModal() { modalEl.hidden = true; modalEl.innerHTML = ''; }
  function ask(title, body, ok) {
    return modal(title, body, [['はい', ok, 'pri'], ['やめる']]);
  }
  function fmtTime(ms) {
    var s = Math.ceil(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
    return h + ':' + ('0' + m).slice(-2) + ':' + ('0' + s % 60).slice(-2);
  }

  function logo(size) { return '<div class="logo ' + size + '"><span data-t="てくてく">てくてく</span><span data-t="クリーチャーズ">クリーチャーズ</span></div>'; }

  // --- タイトルと はじめの1体 ---
  function title() {
    var ids = [0, 2, 7, 20, 28, 35, 84];
    app.innerHTML = '<div class="title">' + logo('lg') +
      '<div class="parade">' + ids.map(function (i) { return '<div class="c">' + art(i) + '</div>'; }).join('') + '</div>' +
      '<p class="tagline">400体のなかまと、40の場所を てくてく歩こう</p>' +
      '<button class="btn pri big" id="go">はじめる</button></div>';
    $('go').onclick = function () { TK.requestPersist(); if (S) shell(); else starter(); };
  }
  function starter() {
    var ids = [0, 1, 2];
    app.innerHTML = '<div class="title"><div class="logo sm"><span data-t="さいしょの なかま">さいしょの なかま</span></div><p>いっしょに旅に出る1体を えらんでね</p>' +
      '<div class="starter">' + ids.map(function (i) {
        return '<button data-i="' + i + '">' + art(i) + sp(i).name + '<span class="tag">' + TK.ROLES[sp(i).role].name + '</span></button>';
      }).join('') + '</div></div>';
    app.querySelectorAll('[data-i]').forEach(function (b) {
      b.onclick = function () {
        var now = Date.now();
        S = TK.newState(+b.dataset.i, now, now % 2147483647);
        save();
        shell();
        modal('てくてくクリーチャーズへ ようこそ', '<p>なかまと列（パレード）になって歩く、育成RPGです。</p><p>ちずで場所をえらんで「しゅっぱつ」。あとは自動で歩いて戦います。なかまが増えたら「なかま」でパレードを組みかえましょう。</p><p class="sub">くわしくは「あそびかた」を見てね。</p>');
      };
    });
  }

  // --- 共通の枠 ---
  var TABS = [['adv', 'ぼうけん'], ['mon', 'なかま'], ['bag', 'もちもの'], ['mix', 'はいごう'], ['dex', 'ずかん'], ['dict', 'じてん'], ['help', 'あそびかた']];
  function shell() {
    app.innerHTML = '<div class="app"><header class="hud">' + logo('sm') + '<div class="purse" id="purse"></div></header>' +
      '<nav class="nav" role="tablist">' + TABS.map(function (t) {
        return '<button role="tab" data-t="' + t[0] + '" aria-selected="false">' + TK.icon(t[0]) + t[1] + '</button>';
      }).join('') + '</nav><main id="main"></main></div>';
    app.querySelectorAll('.nav [data-t]').forEach(function (b) { b.onclick = function () { go(b.dataset.t); }; });
    go('adv');
    tick();
  }
  function go(t) {
    if (activeRun && t !== 'adv') { toast('ぼうけん中は 切りかえられません'); return; }
    tab = t;
    app.querySelectorAll('.nav [data-t]').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.t === t); });
    render();
  }
  function render() { ({ adv: viewAdv, mon: viewMon, bag: viewBag, mix: viewMix, dex: viewDex, dict: viewDict, help: viewHelp })[tab](); }
  function purse() {
    var el = $('purse');
    if (!el) return;
    var next = TK.staminaNext(S.stamina, Date.now());
    el.innerHTML = '<span class="chip"><i style="background:var(--green)"></i><small>冒険回数</small>' + S.stamina.n + '/' + TK.STAMINA.max + (next ? '<small>+1まで ' + fmtTime(next) + '</small>' : '') + '</span>' +
      '<span class="chip"><i style="background:var(--yellow)"></i><small>コイン</small>' + S.coins + '</span><span class="chip"><i style="background:var(--orange)"></i><small>あまーいおやつ</small>' + S.cookies + '</span>';
  }
  function tick() {
    if (!S) return;
    var now = Date.now();
    TK.tickStamina(S.stamina, now);
    purse();
  }

  // --- ぼうけん ---
  // 5列のジグザグで線路をつなぐ
  function stationPos(i) {
    var row = Math.floor(i / 5), c = i % 5, col = row % 2 ? 4 - c : c;
    return [10 + col * 20, (row + 0.5) * 100 / Math.ceil(TK.AREAS.length / 5)];
  }
  var pickedFloor = null;
  function viewAdv() {
    if (activeRun) return;
    var a = TK.AREAS[pickedArea], open = TK.areaOpen(S, a.id), done = TK.floorsDone(S, a.id);
    if (pickedFloor == null || !TK.floorOpen(S, a.id, pickedFloor)) pickedFloor = Math.min(done, TK.FLOORS - 1);
    var floors = '';
    for (var f = 0; f < TK.FLOORS; f++) {
      floors += '<button data-f="' + f + '" class="' + (f < done ? 'done ' : '') + (f === TK.FLOORS - 1 ? 'boss' : '') + '" aria-pressed="' + (open && f === pickedFloor) + '"' + (open && TK.floorOpen(S, a.id, f) ? '' : ' disabled') + ' aria-label="' + (f + 1) + '層">' + (f + 1) + '</button>';
    }
    var map = TK.mapSvg(TK.AREAS, stationPos, function (i) { return TK.areaOpen(S, i); }) +
      TK.AREAS.map(function (x, i) {
        var p = stationPos(i), lock = !TK.areaOpen(S, i);
        return '<button class="stn ' + (S.cleared[i] ? 'clear ' : '') + (lock ? 'lock ' : '') + (i === pickedArea ? 'on ' : '') + '" style="left:' + p[0] + '%;top:' + p[1] + '%" data-a="' + i + '" aria-label="' + (lock ? '未開放' : x.name) + '">' + (i + 1) + '</button>';
      }).join('');
    var habit = a.regulars.concat(TK.wanderers(S, a.id).filter(function (id) { return id !== a.boss; }), [a.boss]).map(function (id) {
      return '<span class="' + (S.seen[id] ? '' : 'un') + '" title="' + (S.owned[id] ? sp(id).name : '？？？') + '">' + art(id) + '</span>';
    }).join('');
    $('main').innerHTML = '<div class="view"><section class="card"><h2 class="h">せかいの ちず</h2><div class="map">' + map + '</div></section>' +
      '<section class="card area"><div class="thumb" style="background:' + TK.sceneThumb(a.bg) + '"></div><div>' +
      '<h2 class="h">' + (a.id + 1) + '. ' + (open ? a.name : '？？？') + (S.cleared[a.id] ? '<span class="tag y">クリア</span>' : '') + '</h2>' +
      '<p class="sub">' + (open ? a.desc : '前の場所のぬしを たおすと 行けるよ') + '</p>' +
      '<p class="sub">' + (pickedFloor + 1) + '層 ・ 敵レベル ' + TK.floorLv(a.id, pickedFloor) + ' ・ ' + a.steps + 'マス' + (pickedFloor === TK.FLOORS - 1 ? ' ・ ぬしがいる' : '') + '</p>' +
      '<div class="floors">' + floors + '</div><div class="habit">' + habit + '</div></div></section>' +
      levelHint(a) + '<section class="card"><div class="row"><button class="btn pri big" id="start"' + (open ? '' : ' disabled') + '>しゅっぱつ</button>' +
      '<span>' + segHtml('tac', TK.TACTICS, S.tactic) + '</span>' +
      '<label class="row" style="gap:6px"><input type="checkbox" id="auto"' + (S.autoCookie ? ' checked' : '') + '>おやつ自動</label></div>' +
      '<p class="sub" style="margin-top:8px">1回の冒険で 冒険回数を1つ使います。たたかいはオートで進みます。</p></section></div>';
    app.querySelectorAll('[data-a]').forEach(function (b) {
      b.onclick = function () { pickedArea = +b.dataset.a; pickedFloor = null; viewAdv(); };
    });
    app.querySelectorAll('[data-f]').forEach(function (b) {
      b.onclick = function () { pickedFloor = +b.dataset.f; viewAdv(); };
    });
    bindSeg('tac', function (v) { S.tactic = v; save(); viewAdv(); });
    $('auto').onchange = function (e) { S.autoCookie = e.target.checked; save(); };
    $('start').onclick = function () { startRun(a.id, pickedFloor); };
  }
  function levelHint(a) {
    var list = TK.partyInsts(S), lv = list.reduce(function (t, m) { return t + m.lv; }, 0) / Math.max(1, list.length);
    if (!TK.areaOpen(S, a.id) || S.cleared[a.id] || lv >= TK.floorLv(a.id, pickedFloor) - 2) return '';
    return '<p class="note warn">パレードの平均レベルは ' + Math.floor(lv) + ' です。この層は レベル ' + (TK.floorLv(a.id, pickedFloor) - 2) + ' くらいで挑むのが おすすめ。前の場所で 育ててからでも OK！</p>';
  }
  function segHtml(id, map, cur) {
    return '<span class="seg" id="seg-' + id + '">' + Object.keys(map).map(function (k) {
      return '<button data-v="' + k + '" aria-pressed="' + (k === String(cur)) + '">' + map[k].name + '</button>';
    }).join('') + '</span>';
  }
  function bindSeg(id, fn) {
    $('seg-' + id).querySelectorAll('button').forEach(function (b) { b.onclick = function () { fn(b.dataset.v); }; });
  }

  function makeStage(bg) {
    var l = TK.sceneLayers(bg);
    return '<div class="stage walk" id="stage" style="background:' + l.sky + '">' +
      '<div class="lay l1" style="background-image:' + l.far + '"></div><div class="lay l2" style="background-image:' + l.mid + '"></div><div class="lay l3" style="background-image:' + l.ground + '"></div>' +
      '<div class="side l" id="sideL"></div><div class="side r" id="sideR"></div></div>';
  }
  function unitHtml(u, i) {
    var pct = Math.round(100 * u.hp / u.maxHp), mp = u.maxMp ? Math.round(100 * u.mp / u.maxMp) : 0;
    return '<div class="unit enter' + (u.hp <= 0 ? ' ko' : '') + '" id="u' + i + '"><div class="uname">Lv' + u.lv + ' ' + esc(u.name) + '</div><div class="sprite">' + art(u.sp) + '</div>' +
      '<div class="bars"><div class="bar ' + (pct < 30 ? 'low' : '') + '"><div style="width:' + pct + '%"></div></div><div class="bar m"><div style="width:' + mp + '%"></div></div></div></div>';
  }
  function setBar(i, hp, maxHp, mp, maxMp) {
    var u = $('u' + i);
    if (!u) return;
    var b = u.querySelectorAll('.bar');
    if (hp != null) {
      var p = Math.max(0, 100 * hp / maxHp);
      b[0].firstChild.style.width = p + '%';
      b[0].classList.toggle('low', p < 30);
    }
    if (mp != null) b[1].firstChild.style.width = (maxMp ? 100 * mp / maxMp : 0) + '%';
  }
  function pop(i, text, cls) {
    var u = $('u' + i);
    if (!u) return;
    var el = document.createElement('div');
    el.className = 'pop ' + (cls || '');
    el.textContent = text;
    u.appendChild(el);
    setTimeout(function () { el.remove(); }, 720);
  }
  function say(t) {
    var el = $('say'), log = $('runlog');
    if (el) el.innerHTML = t;
    if (log && t.charAt(0) === '<') {
      log.insertAdjacentHTML('afterbegin', '<div>' + t + '</div>');
      while (log.children.length > 40) log.lastChild.remove();
    }
  }

  // simulate の結果を再生する。mySide の側を左に並べる
  async function replay(fighters, res, mySide) {
    var units = res.units.map(function (u, i) {
      var f = fighters[i];
      return { sp: f.sp, lv: f.lv, name: f.name || sp(f.sp).name, side: u.side, maxHp: u.maxHp, maxMp: u.maxMp, hp: f.curHp == null ? u.maxHp : f.curHp, mp: f.curMp == null ? u.maxMp : f.curMp };
    });
    var html = function (side) {
      return units.map(function (u, i) { return u.side === side ? unitHtml(u, i) : ''; }).join('');
    };
    $('sideL').innerHTML = html(mySide);
    $('sideR').innerHTML = html(1 - mySide);
    $('stage').classList.remove('walk');
    await wait(450);
    var nm = function (i) { return esc(units[i].name); };
    for (var n = 0; n < res.events.length; n++) {
      var e = res.events[n];
      if (e.e === 'use') {
        var u = $('u' + e.u), sk = TK.SKILLS[e.skill];
        if (u) u.classList.add('lunge');
        say('<span>' + nm(e.u) + ' の <b>' + sk.name + '</b>！</span>');
        setBar(e.u, null, null, e.mp, units[e.u].maxMp);
        await wait(300);
        if (u) u.classList.remove('lunge');
      } else if (e.e === 'hit') {
        var tu = $('u' + e.t);
        if (tu) { tu.classList.remove('hit'); void tu.offsetWidth; tu.classList.add('hit'); }
        pop(e.t, e.d, e.crit ? 'crit' : '');
        if (e.mult > 1) pop(e.t, 'ばつぐん！', 'info');
        else if (e.mult < 1) pop(e.t, 'いまひとつ', 'info');
        setBar(e.t, e.hp, units[e.t].maxHp);
        await wait(320);
      } else if (e.e === 'heal') {
        pop(e.t, '+' + e.a, 'heal');
        setBar(e.t, e.hp, units[e.t].maxHp);
        await wait(240);
      } else if (e.e === 'ko') {
        var ku = $('u' + e.t);
        if (ku) ku.classList.add('ko');
        say('<span>' + nm(e.t) + ' は たおれた！</span>');
        await wait(340);
      } else if (e.e === 'miss') {
        pop(e.t, 'ミス', 'info');
        await wait(220);
      } else if (e.e === 'trait') {
        pop(e.t, e.name, 'info');
        await wait(240);
      } else if (e.e === 'buff') {
        pop(e.t, TK.STAT_NAME[e.stat] + (e.up ? ' ↑' : ' ↓'), 'info');
        await wait(90);
      } else if (e.e === 'status') {
        pop(e.t, e.st === 'poison' ? 'どく！' : 'しびれ！', 'info');
        await wait(200);
      } else if (e.e === 'poison') {
        pop(e.t, e.d);
        setBar(e.t, e.hp, units[e.t].maxHp);
        await wait(200);
      } else if (e.e === 'skip') {
        say('<span>' + nm(e.t) + ' は しびれて動けない！</span>');
        await wait(280);
      } else if (e.e === 'timeup') {
        say('<span>じかんぎれ！ 残りHPで 勝負が決まった！</span>');
        await wait(600);
      }
    }
    skip = false;
  }

  function stageControls() {
    var speeds = { 1: { name: '×1' }, 2: { name: '×2' }, 4: { name: '×4' } };
    return '<div class="row">' + segHtml('spd', speeds, S.speed) + '<button class="btn sm" id="skip">とばす</button><span id="runBtns" class="row"></span></div>';
  }
  function bindControls() {
    bindSeg('spd', function (v) {
      S.speed = +v;
      save();
      $('seg-spd').querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === v); });
    });
    $('skip').onclick = function () { skip = true; };
  }
  function drawRails(run) {
    var el = $('rails');
    if (!el) return;
    var h = '';
    for (var i = 0; i < run.total; i++) h += '<b class="' + (i < run.step ? 'on ' : '') + (i === run.total - 1 && run.floor === TK.FLOORS - 1 ? 'boss' : '') + '"></b>';
    el.innerHTML = h;
    $('stepNo').textContent = run.step + '/' + run.total;
  }
  function drawParty(run) {
    var list = TK.partyInsts(S).map(function (m) {
      var st = TK.instStats(m, S.items);
      return { sp: m.sp, lv: m.lv, name: sp(m.sp).name, hp: run.hp[m.uid], maxHp: st.hp, mp: run.mp[m.uid], maxMp: st.mp };
    });
    $('sideL').innerHTML = list.map(function (u, i) { return unitHtml(u, 'w' + i); }).join('');
    $('sideR').innerHTML = '';
  }

  async function startRun(areaId, floor) {
    if (!TK.partyInsts(S).length) { toast('パレードに なかまを入れてね'); return; }
    var run = TK.startRun(S, areaId, Date.now(), floor);
    if (!run) { modal('冒険回数が たりません', '<p>4時間で1回 回復します。ゆっくり待ってね。</p>'); return; }
    activeRun = run;
    save();
    purse();
    var a = TK.AREAS[areaId];
    $('main').innerHTML = '<div class="stagewrap"><div class="track"><span class="nm">' + a.name + ' ' + (run.floor + 1) + '層</span><div class="rails" id="rails"></div><span class="sub" id="stepNo"></span></div>' +
      makeStage(a.bg) + '<div class="say" id="say" aria-live="polite">てくてく…</div>' + stageControls() + '<div class="runlog" id="runlog"></div></div>';
    bindControls();
    var quit = document.createElement('button');
    quit.className = 'btn sm danger';
    quit.textContent = 'もどる';
    quit.onclick = function () { run.quit = true; quit.disabled = true; say('<span>次のマスで もどります…</span>'); };
    $('runBtns').appendChild(quit);
    while (!run.over && !run.quit) {
      drawParty(run);
      drawRails(run);
      $('stage').classList.add('walk');
      say('てくてく…');
      await wait(1000);
      var st = TK.nextStep(S, run, Date.now());
      drawRails(run);
      save();
      purse();
      await playStep(st);
    }
    finishRun(run);
  }
  async function playStep(st) {
    if (st.type === 'treasure') { say('<span>宝ばこ！ <b class="q' + st.item.q + '">' + esc(st.item.name) + '</b> を見つけた！</span>'); await wait(900); return; }
    if (st.type === 'coins') { say('<span>コインを ' + st.coins + ' まい ひろった！</span>'); await wait(800); return; }
    if (st.type === 'rest') { say('<span>きれいな泉で ひとやすみ。HPとMPが回復した！</span>'); await wait(900); return; }
    if (st.cookies) { say('<span>あまーいおやつを ' + st.cookies + ' こ 食べた！</span>'); await wait(500); }
    if (st.type === 'boss') { say('<span>この地のぬし <b>' + sp(st.foes[0].sp).name + '</b> が あらわれた！</span>'); await wait(900); }
    await replay(st.team.concat(st.foes), st.result, 0);
    if (st.won) {
      var t = st.xp + ' けいけんち・コイン ' + st.coins;
      if (st.drop) t += '・<b class="q' + st.drop.q + '">' + esc(st.drop.name) + '</b>';
      say('<span>かった！ ' + t + (st.ups.length ? '・レベルアップ！' : '') + '</span>');
      await wait(800);
      if (st.recruit) {
        say('<span><b>' + sp(st.recruit.sp).name + '</b> が なかまに なった！' + (st.recruitNew ? ' ずかんに登録！' : '') + '</span>');
        await wait(1000);
      }
    } else {
      say('<span>パレードは ぜんめつした…</span>');
      await wait(900);
    }
  }
  function finishRun(run) {
    activeRun = null;
    var a = TK.AREAS[run.area], head = run.cleared ? a.name + ' クリア！' : run.floorCleared ? (run.floor + 1) + '層 クリア！' : run.wiped ? 'パレードがくずれた…' : 'ぶじに もどった';
    var body = (run.wiped ? '<p class="sub">手に入れたものは ぜんぶ持ち帰れた！</p>' : '') + '<p>コイン ' + run.coins + '・けいけんち ' + run.xp + '・なかま ' + run.recruits.length + '体・そうび ' + run.items.length + 'こ</p>';
    if (run.cleared && run.area === 0) body += '<p class="note">もちものの「れんきん」が できるようになった！</p>';
    if (run.cleared && pickedArea === run.area && run.area < TK.AREAS.length - 1) pickedArea = run.area + 1;
    pickedFloor = null;
    save();
    render();
    modal(head, body);
  }

  // --- なかま ---
  function viewMon() {
    if (selUid == null || !TK.findInst(S, selUid)) selUid = S.party[0];
    var slots = '';
    for (var i = 0; i < 4; i++) {
      var m = TK.findInst(S, S.party[i]);
      slots += m ? monCard(m, S.party[i] === selUid) : '<div class="slot">あき</div>';
    }
    // パレードの列にいる仲間は まきばに並べない
    var list = S.ranch.filter(function (x) { return S.party.indexOf(x.uid) < 0; }).sort(function (a, b) { return ranchSort === 'no' ? a.sp - b.sp || b.lv - a.lv : b.lv - a.lv || a.sp - b.sp; });
    ranchPage = clampPage(ranchPage, list.length);
    $('main').innerHTML = '<div class="view lay2"><div><section class="card"><h2 class="h">パレードの列 <span class="sub">先頭から順に歩きます。最大4体</span></h2><div class="slots">' + slots + '</div>' +
      '<div class="row" style="margin-top:10px"><span class="sub">さくせん</span>' + segHtml('tac', TK.TACTICS, S.tactic) + '</div></section>' +
      '<section class="card"><h2 class="h">まきば <span class="sub">' + list.length + '/' + TK.PRICE.ranchMax + '</span></h2>' +
      '<div class="row" style="margin-bottom:10px"><span class="sub">ならびかえ</span>' + segHtml('rsort', { lv: { name: 'レベル' }, no: { name: 'ずかん番号' } }, ranchSort) + '</div>' +
      pagerHtml('rp', ranchPage, list.length) + '<div class="grid">' + pageOf(list, ranchPage).map(function (x) { return monCard(x, x.uid === selUid); }).join('') + '</div></section></div>' +
      '<div><section class="card sticky" id="detail"></section></div></div>';
    $('main').querySelectorAll('[data-m]').forEach(function (b) { b.onclick = function () { selUid = +b.dataset.m; viewMon(); if (matchMedia('(max-width:820px)').matches) $('detail').scrollIntoView(); }; });
    bindSeg('tac', function (v) { S.tactic = v; save(); viewMon(); });
    bindSeg('rsort', function (v) { ranchSort = v; ranchPage = 0; viewMon(); });
    bindPager('rp', function (v) { ranchPage = v; viewMon(); });
    drawDetail();
  }
  // 50体ごとの ページ送り
  function clampPage(p, n) { return Math.max(0, Math.min(p, Math.ceil(n / PAGE_SIZE) - 1)); }
  function pageOf(list, p) { return list.slice(p * PAGE_SIZE, (p + 1) * PAGE_SIZE); }
  function pagerHtml(id, p, n) {
    if (n <= PAGE_SIZE) return '';
    var map = {};
    for (var i = 0; i < Math.ceil(n / PAGE_SIZE); i++) map[i] = { name: (i * PAGE_SIZE + 1) + '〜' };
    return '<div class="pager">' + segHtml(id, map, p) + '</div>';
  }
  function bindPager(id, fn) { if ($('seg-' + id)) bindSeg(id, function (v) { fn(+v); }); }
  function monCard(m, on) {
    var s = sp(m.sp);
    return '<button class="mon" data-m="' + m.uid + '" aria-pressed="' + !!on + '">' + (S.party.indexOf(m.uid) >= 0 ? '<span class="tag y mk">列</span>' : '') + art(m.sp) +
      '<span class="n">' + s.name + '</span><span class="l">Lv' + m.lv + '/' + TK.levelCap(m) + '</span></button>';
  }
  function resistHtml(steps) {
    return '<div class="resist">' + TK.ELEMENTS.map(function (el, i) {
      var r = TK.RES_STEPS[steps[i]];
      return '<div class="res r' + steps[i] + '" title="' + TK.EL_NAME[el] + ' ' + r.name + '"><b>' + TK.EL_NAME[el] + '</b><small>' + r.name.replace('とても', 'とても<br>') + '</small></div>';
    }).join('') + '</div>';
  }
  function skillRow(id, label, off) {
    var sk = TK.SKILLS[id], mark = sk.el ? '<i class="dot" style="background:' + TK.EL_COLOR[sk.el] + '"></i> ' : '';
    return '<div class="skrow' + (off ? ' off' : '') + '"><span class="sklv">' + label + '</span><div><b>' + mark + sk.name + '</b> <span class="sub">MP' + sk.mp + '</span><br><span class="sub">' + TK.skillDesc(id) + '</span></div></div>';
  }
  // おぼえるレベルと効果を並べる。受けついだ とくぎは 最後に足す
  function skillHtml(spId, lv, learned) {
    return '<div class="pills sklist">' + TK.kitOf(spId).map(function (k) {
      return skillRow(TK.skillId(spId, k[1]), 'Lv' + k[0], lv != null && k[0] > lv);
    }).concat((learned || []).map(function (id) { return skillRow(id, '受けつぎ', false); })).join('') + '</div>';
  }
  function drawDetail() {
    var m = TK.findInst(S, selUid), el = $('detail');
    if (!m) { el.innerHTML = '<p class="sub">なかまを えらんでね</p>'; return; }
    var s = sp(m.sp), st = TK.instStats(m, S.items), max = Math.max(st.atk, st.def, st.mag, st.spd), inParty = S.party.indexOf(m.uid) >= 0;
    var rows = TK.STATS.map(function (k) {
      var g = TK.GROWTH[m.g[k]], w = k === 'hp' || k === 'mp' ? 100 * st[k] / Math.max(st.hp, st.mp) : 100 * st[k] / max;
      return '<span>' + TK.STAT_NAME[k] + '</span><b>' + st[k] + '</b><div class="sb"><div style="width:' + w + '%"></div></div><span class="gl g' + m.g[k] + '">' + g.name + '</span>';
    }).join('');
    var bag = TK.bagList(S);
    var eq = Object.keys(TK.ITEM_SLOTS).map(function (slot) {
      var opts = bag.filter(function (b) { return b.it.slot === slot && (!b.by || b.by === m.uid); }).map(function (b) {
        return '<option value="' + b.it.id + '"' + (m.eq[slot] === b.it.id ? ' selected' : '') + '>' + esc(b.it.name) + ' ' + bonusText(b.it) + '</option>';
      }).join('');
      return '<label class="slotrow">' + TK.ITEM_SLOTS[slot] + '<select data-slot="' + slot + '"><option value="">なし</option>' + opts + '</select></label>';
    }).join('');
    var need = TK.xpNeed(m.lv), capped = m.lv >= TK.levelCap(m);
    el.innerHTML = '<div class="dhead"><button class="dimg" id="toDex" aria-label="ずかんを見る">' + art(m.sp) + '</button><div><h2 class="h" style="margin:0">' + s.name + '</h2><span class="tag v">' + TK.ROLES[s.role].name + '</span>' +
      '<p class="sub">Lv ' + m.lv + ' / ' + TK.levelCap(m) + '・配合 ' + m.breed + '回</p><p class="sub">絵をタップで ずかんへ</p></div></div>' +
      '<div class="sb xp"><div style="width:' + (capped ? 100 : 100 * m.xp / need) + '%"></div></div><p class="sub">' + (capped ? 'レベル上限です。はいごうできます' : '次のレベルまで ' + (need - m.xp)) + '</p>' +
      '<div class="stats">' + rows + '</div><p class="note"><b>' + TK.TRAITS[s.trait].name + '</b>：' + TK.TRAITS[s.trait].desc + '</p>' +
      '<h3 class="sub" style="margin-top:8px">耐性</h3>' + resistHtml(TK.resistSteps(m)) +
      '<h3 class="sub">とくぎ（うすい文字は これから おぼえる）</h3>' + skillHtml(m.sp, m.lv, m.learned) + '<h3 class="sub" style="margin-top:8px">そうび</h3>' + eq +
      '<div class="row" style="margin-top:12px"><button class="btn sm" id="tog">' + (inParty ? '列からはずす' : '列にくわえる') + '</button><button class="btn sm danger" id="rel">おわかれ</button></div>';
    $('toDex').onclick = function () { dexRole = 'all'; dexPage = Math.floor(m.sp / PAGE_SIZE); go('dex'); dexEntry(m.sp); };
    el.querySelectorAll('select').forEach(function (sel) {
      sel.onchange = function () { m.eq[sel.dataset.slot] = sel.value ? +sel.value : null; save(); viewMon(); };
    });
    $('tog').onclick = function () {
      if (inParty) {
        if (S.party.length <= 1) { toast('1体は 列にのこしてね'); return; }
        S.party = S.party.filter(function (u) { return u !== m.uid; });
      } else {
        if (S.party.length >= 4) { toast('列は4体までです'); return; }
        S.party.push(m.uid);
      }
      save();
      viewMon();
    };
    $('rel').onclick = function () {
      if (S.ranch.length <= 1 || (inParty && S.party.length <= 1)) { toast('最後の1体とは おわかれできません'); return; }
      ask('おわかれしますか？', '<p>' + s.name + ' はまきばを 旅立ちます。もどってきません。</p>', function () {
        removeInst(m.uid);
        selUid = null;
        save();
        viewMon();
      });
    };
  }
  function removeInst(uid) {
    S.ranch = S.ranch.filter(function (x) { return x.uid !== uid; });
    S.party = S.party.filter(function (u) { return u !== uid; });
  }
  function bonusText(it) {
    return Object.keys(it.bonus).map(function (k) { return TK.STAT_NAME[k] + '+' + it.bonus[k]; }).join(' ') + (it.el ? ' ' + TK.EL_NAME[it.el] + '+' + it.elv + '%' : '') +
      (it.fx || []).map(function (f) { return ' ' + TK.ITEM_FX[f.k].name + '+' + f.v + '%'; }).join('');
  }

  // --- もちもの ---
  function viewBag() {
    var bag = TK.bagList(S).sort(function (a, b) { return b.it.q - a.it.q || b.it.lv - a.it.lv; }), alOpen = TK.alchemyOpen(S);
    alchemy = alchemy.filter(function (id) { return S.items[id] && !bag.some(function (b) { return b.it.id === id && b.by; }); });
    var slots = { all: { name: 'すべて' } };
    Object.keys(TK.ITEM_SLOTS).forEach(function (k) { slots[k] = { name: TK.ITEM_SLOTS[k] }; });
    var rows = bag.filter(function (b) { return bagSlot === 'all' || b.it.slot === bagSlot; }).map(function (b) {
      return '<div class="itemrow"><div><span class="tag">' + TK.ITEM_SLOTS[b.it.slot] + '</span> <b class="q' + b.it.q + '">' + esc(b.it.name) + '</b> <span class="sub">' + bonusText(b.it) + (b.by ? '・そうび中' : '') + '</span></div>' +
        (b.by ? '' : '<div class="row" style="gap:6px;flex-wrap:nowrap">' + (alOpen ? '<button class="btn sm" data-al="' + b.it.id + '" aria-pressed="' + (alchemy.indexOf(b.it.id) >= 0) + '">' + (alchemy.indexOf(b.it.id) >= 0 ? 'えらび中' : 'そざいに') + '</button>' : '') + '<button class="btn sm" data-sell="' + b.it.id + '">' + TK.sellPrice(b.it) + 'で売る</button></div>') + '</div>';
    }).join('') || '<p class="sub">まだ何もありません。宝ばこや バトルで手に入ります。</p>';
    $('main').innerHTML = '<div class="view"><section class="card"><h2 class="h">おみせ</h2><div class="row">' +
      '<button class="btn" id="buyC">あまーいおやつ ' + TK.PRICE.cookie + 'コイン</button></div>' + shopHtml() +
      '<p class="sub" style="margin-top:6px">あまーいおやつは 冒険のとちゅうで パレード全員のHPを最大の50%、MPを20%回復します。そうびの品ぞろえは 冒険のたびに変わります。</p></section>' +
      (alOpen ? alchemyHtml() : '') + '<section class="card"><h2 class="h">そうび <span class="sub">' + bag.length + 'こ</span><button class="btn sm" id="sellLow">効果なしの ぼろぼろ・ふつうを まとめて売る</button></h2><div style="margin-bottom:10px">' + segHtml('bagf', slots, bagSlot) + '</div>' + rows + '</section></div>';
    bindSeg('bagf', function (v) { bagSlot = v; viewBag(); });
    $('buyC').onclick = function () {
      if (S.coins < TK.PRICE.cookie) { toast('コインが たりません'); return; }
      S.coins -= TK.PRICE.cookie; S.cookies++; save(); purse(); toast('あまーいおやつを 買った！');
    };
    $('main').querySelectorAll('[data-buy]').forEach(function (b) {
      b.onclick = function () {
        var it = TK.buyItem(S, +b.dataset.buy);
        if (!it) { toast('コインが たりません'); return; }
        save(); purse(); viewBag(); toast(it.name + ' を買った！');
      };
    });
    $('sellLow').onclick = function () {
      var list = bag.filter(function (b) { return !b.by && b.it.q <= 1 && !(b.it.fx || []).length; });
      if (!list.length) { toast('売れるものが ありません'); return; }
      ask('まとめて売りますか？', '<p>' + list.length + 'こ を売ります。</p>', function () {
        list.forEach(function (b) { S.coins += TK.sellPrice(b.it); delete S.items[b.it.id]; });
        save(); purse(); viewBag();
      });
    };
    $('main').querySelectorAll('[data-al]').forEach(function (b) {
      b.onclick = function () {
        var id = +b.dataset.al, at = alchemy.indexOf(id);
        if (at >= 0) alchemy.splice(at, 1);
        else if (alchemy.length < 2) alchemy.push(id);
        else { toast('そざいは 2つまでです'); return; }
        viewBag();
      };
    });
    if ($('doAl')) $('doAl').onclick = function () {
      var a = S.items[alchemy[0]], b = S.items[alchemy[1]];
      ask('れんきんしますか？', '<p><b>' + esc(a.name) + '</b> と <b>' + esc(b.name) + '</b> は なくなります。</p>', function () {
        var it = TK.alchemy(S, a.id, b.id, TK.rng((Date.now() ^ S.itemId) >>> 0));
        alchemy = [];
        save();
        viewBag();
        modal('れんきん せいこう！', '<p><span class="tag">' + TK.ITEM_SLOTS[it.slot] + '</span> <b class="q' + it.q + '">' + esc(it.name) + '</b></p><p>' + bonusText(it) + '</p>');
      });
    };
    $('main').querySelectorAll('[data-sell]').forEach(function (b) {
      b.onclick = function () {
        var it = S.items[b.dataset.sell];
        S.coins += TK.sellPrice(it);
        delete S.items[it.id];
        save(); purse(); viewBag();
      };
    });
  }

  function shopHtml() {
    var list = S.shop || [];
    if (!list.length) return '<p class="sub" style="margin-top:8px">売り切れ。次の冒険のあとに 入荷します。</p>';
    return '<div style="margin-top:8px">' + list.map(function (it) {
      return '<div class="itemrow"><div><span class="tag">' + TK.ITEM_SLOTS[it.slot] + '</span> <b class="q' + it.q + '">' + esc(it.name) + '</b> <span class="sub">' + bonusText(it) + '</span></div>' +
        '<button class="btn sm" data-buy="' + it.id + '">' + TK.buyPrice(it) + 'で買う</button></div>';
    }).join('') + '</div>';
  }
  var alchemy = [];
  function alchemyHtml() {
    var a = S.items[alchemy[0]], b = S.items[alchemy[1]], lines = '';
    var box = function (it) { return it ? '<div class="alslot"><b class="q' + it.q + '">' + esc(it.name) + '</b><span class="sub">' + TK.ITEM_SLOTS[it.slot] + ' ' + bonusText(it) + '</span></div>' : '<div class="alslot sub">下から えらんでね</div>'; };
    if (a && b) {
      var p = TK.alchemyPreview(a, b);
      lines = '<ul class="allist"><li>部位：' + (p.slot ? TK.ITEM_SLOTS[a.slot] + '（確定）' : 'どちらか') + '</li><li>レアリティ：' + (p.q ? (TK.QUALITY[a.q].name.replace(/[のな]$/, '') || 'ふつう') + '（確定）' : 'どちらか') + '</li>' +
        '<li>属性：' + (p.el ? TK.EL_NAME[a.el] + '（確定・属性値かならず上昇）' : 'どちらか') + '</li></ul>';
    }
    return '<section class="card"><h2 class="h">れんきん <span class="sub">そうび2つから 1つを作る</span></h2><div class="albar">' + box(a) + '<div class="plus">＋</div>' + box(b) + '</div>' + lines +
      '<div class="row" style="margin-top:10px;justify-content:center"><button class="btn pri" id="doAl"' + (a && b ? '' : ' disabled') + '>れんきんする</button></div>' +
      '<p class="sub" style="margin-top:6px">同じ属性なら その属性に（属性値は かならず上昇）、同じレアリティなら そのレアリティに、同じ部位なら その部位になります。そうび中のものは使えません。</p></section>';
  }

  // --- はいごう ---
  function viewMix() {
    var ready = S.ranch.filter(function (m) { return m.lv >= TK.levelCap(m); });
    var a = TK.findInst(S, mix.a), b = TK.findInst(S, mix.b);
    if (!a) mix.a = null;
    if (!b) mix.b = null;
    if (mix.base !== mix.a && mix.base !== mix.b) mix.base = mix.a;
    var box = function (m) {
      if (!m) return '<div class="mixbox">下から えらんでね</div>';
      return '<button class="mixbox ' + (mix.base === m.uid ? 'base' : '') + '" data-base="' + m.uid + '">' + art(m.sp) + sp(m.sp).name + ' Lv' + m.lv + (mix.base === m.uid ? '<span class="tag y">この種類の子が生まれる</span>' : '<span class="sub">おしてえらぶ</span>') + '</button>';
    };
    var check = TK.canBreed(a, b), baseM = TK.findInst(S, mix.base), otherM = baseM === a ? b : a, heirs = check.ok ? TK.inheritable(baseM, otherM) : [];
    if (heirs.indexOf(mix.skill) < 0) mix.skill = '';
    var heirHtml = !check.ok ? '' : '<div style="margin-top:12px"><h3 class="sub">' + sp(otherM.sp).name + ' から 受けつぐ とくぎ（1つ・自分のとくぎと合わせて' + TK.SKILL_MAX + '個まで）</h3>' +
      (heirs.length ? '<div class="heirs"><button class="skpick" data-heir="" aria-pressed="' + !mix.skill + '">受けつがない</button>' + heirs.map(function (id) {
        return '<button class="skpick" data-heir="' + id + '" aria-pressed="' + (mix.skill === id) + '">' + skillRow(id, '', false) + '</button>';
      }).join('') + '</div>' : '<p class="sub">受けつげる とくぎは ありません。</p>') + '</div>';
    $('main').innerHTML = '<div class="view"><section class="card"><h2 class="h">はいごう</h2><div class="mixbar">' + box(a) + '<div class="plus">＋</div>' + box(b) + '</div>' + heirHtml +
      '<div class="row" style="margin-top:12px;justify-content:center"><button class="btn pri big" id="doMix"' + (check.ok ? '' : ' disabled') + '>はいごうする</button></div>' +
      (a && b && !check.ok ? '<p class="note warn" style="margin-top:8px">' + check.why + '</p>' : '') + '</section>' +
      '<section class="card"><h2 class="h">はいごうできる なかま <span class="sub">レベル上限に達した ' + ready.length + '体</span></h2>' +
      (ready.length ? '<div class="grid">' + ready.map(function (m) { return monCard(m, m.uid === mix.a || m.uid === mix.b); }).join('') + '</div>' : '<p class="sub">レベル上限(はじめは50)まで育てると、ここに出てきます。</p>') + '</section>' +
      '<section class="card"><h2 class="h">はいごうのきまり</h2><div class="help"><ul>' +
      '<li>レベル上限に達した、ちがう種類の2体で できます。</li><li>親は2体とも旅立ち、えらんだ親と同じ種類の子が レベル' + TK.CHILD_LV + 'で生まれます。そうびは もちものに もどります。</li>' +
      '<li>子のレベル上限は 親より <b>10</b> 上がります（最大100）。回数の制限はありません。</li><li>姿を えらばなかった親が おぼえている とくぎを 1つ 受けつげます（自分のとくぎと合わせて' + TK.SKILL_MAX + '個まで）。受けついだ とくぎは 子や孫にも 残ります。</li></ul><ul>' +
      '<li>子の伸びやすさは えらんだ親を受けつぎ、各能力 1/3 で1段階あがります（下がりません）。</li><li>50%で どれかの耐性が1段階あがります。</li></ul></div></section></div>';
    $('main').querySelectorAll('[data-m]').forEach(function (el) {
      el.onclick = function () {
        var uid = +el.dataset.m;
        if (mix.a === uid) mix.a = null;
        else if (mix.b === uid) mix.b = null;
        else if (mix.a == null) mix.a = uid;
        else mix.b = uid;
        viewMix();
      };
    });
    $('main').querySelectorAll('[data-base]').forEach(function (el) { el.onclick = function () { mix.base = +el.dataset.base; viewMix(); }; });
    $('main').querySelectorAll('[data-heir]').forEach(function (el) { el.onclick = function () { mix.skill = el.dataset.heir; viewMix(); }; });
    $('doMix').onclick = function () {
      var base = TK.findInst(S, mix.base), other = base === a ? b : a;
      ask('はいごうしますか？', '<p><b>' + sp(base.sp).name + '</b> と <b>' + sp(other.sp).name + '</b> は旅立ち、<b>' + sp(base.sp).name + '</b> の子が レベル' + TK.CHILD_LV + 'で生まれます。</p>' + (mix.skill ? '<p>受けつぐ とくぎ：<b>' + TK.SKILLS[mix.skill].name + '</b></p>' : ''), function () {
        var r = TK.breed(S, base.uid, other.uid, TK.rng((Date.now() ^ S.uid) >>> 0), mix.skill);
        var body = '<p>レベル上限 ' + r.capBefore + ' → <b>' + r.capAfter + '</b></p>' +
          (r.learned ? '<p>「' + TK.SKILLS[r.learned].name + '」を 受けついだ！</p>' : '') +
          (r.growth.length ? '<p>' + r.growth.map(function (g) { return TK.STAT_NAME[g.stat] + ' が ' + TK.GROWTH[g.to].name + ' に！'; }).join('<br>') + '</p>' : '<p class="sub">伸びやすさは かわらなかった</p>') +
          (r.resist != null ? '<p class="note">【' + TK.EL_NAME[TK.ELEMENTS[r.resist]] + '耐性が上がった！】</p>' : '');
        mix = { a: null, b: null, base: null, skill: '' };
        save();
        viewMix();
        modal(sp(r.child.sp).name + ' の子が 生まれた！', body, null, r.child.sp);
      });
    };
  }

  // --- ずかん ---
  function viewDex() {
    var seen = Object.keys(S.seen).length, owned = Object.keys(S.owned).length, can = TK.SPECIES.length;
    var roles = { all: { name: 'すべて' } };
    Object.keys(TK.ROLES).forEach(function (k) { roles[k] = { name: TK.ROLES[k].name.replace('型', '') }; });
    var list = TK.SPECIES.filter(function (s) { return dexRole === 'all' || s.role === dexRole; });
    dexPage = clampPage(dexPage, list.length);
    $('main').innerHTML = '<div class="view"><section class="card"><h2 class="h">クリーチャーずかん <span class="sub">なかま ' + owned + ' / ' + can + ' ・ 出会った ' + seen + '</span></h2>' +
      '<div style="margin-bottom:10px">' + segHtml('dex', roles, dexRole) + '</div>' + pagerHtml('dexp', dexPage, list.length) + '<div class="grid">' + pageOf(list, dexPage).map(function (s) {
        // 名前も情報も 仲間にしてから。出会っただけなら絵だけ見られる
        var k = !!S.seen[s.id], own = !!S.owned[s.id];
        return '<button class="mon ' + (k ? '' : 'un') + '" data-d="' + s.id + '"' + (k ? '' : ' disabled') + '>' + art(s.id) + '<span class="n">' + (s.id + 1) + '. ' + (own ? s.name : '？？？') + '</span></button>';
      }).join('') + '</div></section></div>';
    bindSeg('dex', function (v) { dexRole = v; dexPage = 0; viewDex(); });
    bindPager('dexp', function (v) { dexPage = v; viewDex(); });
    $('main').querySelectorAll('[data-d]').forEach(function (b) { b.onclick = function () { dexEntry(+b.dataset.d); }; });
  }
  function dexEntry(id) {
    if (!S.owned[id]) { modal('？？？', '<p class="sub" style="text-align:center">' + (sp(id).boss ? 'この地のぬし。倒したあと どこかで また会えるかも。' : 'まだ なかまにしていない。') + '</p>', null, id); return; }
    var s = sp(id), t = TK.TRAITS[s.trait], top = Math.max.apply(null, TK.STATS.map(function (k) { return s.shape[k]; }));
    var bars = TK.STATS.map(function (k) { return '<span>' + TK.STAT_NAME[k] + '</span><b>' + TK.statRank(s.shape[k]) + '</b><div class="sb"><div style="width:' + 100 * s.shape[k] / top + '%"></div></div><span></span>'; }).join('');
    var home = TK.AREAS[s.area].name;
    modal(s.name, '<p class="sub" style="text-align:center">' + s.desc + '</p><p style="text-align:center;margin:6px 0"><span class="tag v">' + TK.ROLES[s.role].name + '</span> <span class="tag g">' + home + '</span></p>' +
      '<div class="stats">' + bars + '</div><p class="note"><b>' + t.name + '</b>：' + t.desc + '</p><h3 class="sub" style="margin-top:8px">耐性</h3>' + resistHtml(s.res) + '<h3 class="sub">おぼえる とくぎ</h3>' + skillHtml(id, null), null, id);
  }

  // --- じてん ---
  // まきばとパレードの仲間が いま おぼえている とくぎだけを 並べる
  function viewDict() {
    var known = {};
    S.ranch.forEach(function (m) { TK.knownSkills(m.sp, m.lv, m.learned).forEach(function (id) { known[id] = 1; }); });
    var ids = Object.keys(TK.SKILLS).filter(function (id) { return known[id]; });
    $('main').innerHTML = '<div class="view"><section class="card"><h2 class="h">とくぎじてん <span class="sub">' + ids.length + ' / ' + Object.keys(TK.SKILLS).length + 'こ</span></h2>' +
      '<p class="sub">なかまが いま おぼえている とくぎです。</p><div class="pills sklist" style="margin-top:8px">' + ids.map(function (id) { return skillRow(id, '', false); }).join('') + '</div></section></div>';
  }

  // --- あそびかた ---
  function viewHelp() {
    var sec = function (h, items) { return '<div><h3>' + h + '</h3><ul>' + items.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul></div>'; };
    $('main').innerHTML = '<div class="view"><section class="card"><h2 class="h">あそびかた</h2><div class="help">' +
      sec('ぼうけん', ['ちずで場所をえらんで「しゅっぱつ」。パレードが自動で歩いて戦います。', '冒険回数は4時間で1回復、最大100回までためられます。', 'どの場所も1〜5層あり、層の最後まで歩くと次の層へ進めます。', '5層の「ぬし」を倒すと その場所はクリアです。', 'ぬしは 5層の戦いでは仲間になりませんが、倒すと次の場所に ときどき現れ、そこで仲間にできます。', '最後の場所のぬしは クリアしたあと、同じ場所に ときどき現れます。','パレードが全滅しても、手に入れたものは なくなりません。']) +
      sec('あまーいおやつ', ['パレードが つかれたときに 食べる おやつです。右上の「あまーいおやつ」が のこりの数です。', '効果：パレード全員のHPを 最大の50%、MPを20% 回復します。倒れた仲間も 起き上がります。', '「おやつ自動」がONなら、戦いの前に 全員のHPの合計が 半分を切ると 自動で食べます（1回の戦いの前に 3こまで）。OFFなら 食べません。', 'はじめは3こ。おみせで ' + TK.PRICE.cookie + 'コインで買えるほか、場所を はじめてクリアすると 3こ もらえます。']) +
      sec('なかまと そうび', ['伸びやすさ（伸びやすい／ふつう／伸びにくい）は 1体ごとにちがい、レベルアップでの 能力の伸びが変わります。', 'ずかんの S〜D は その種類の 得意・不得意です。', 'そうびは ぶき・よろい・アクセの3つ。名前の色が品質で、ぼろぼろの＜ふつう＜よいできの＜みごとな＜でんせつの です。', '品質が高いほど、コイン・けいけんち・そうび発見が上がる 追加効果がつきます。パレード全体で 1種類 ' + TK.FX_MAX + '%まで。', 'おみせの品は 冒険のたびに入れかわります。']) +
      sec('さくせん', ['ガンガンいこう：とくぎをどんどん使う', 'バランスよく：攻撃と回復をほどほどに', 'いのちだいじに：はやめに回復する']) +
      sec('耐性', ['わざの属性は 火・水・雷・地・風・光・闇 の7つ。属性のないわざもあります。', 'クリーチャー自身に属性はなく、体ごとに耐性だけが決まっています。', 'とても強い 1/3倍、強い 1/2倍、ふつう 1倍、弱い 2倍、とても弱い 3倍。', '耐性は「ずかん」で確認できます。']) +
      sec('はいごう', ['レベル上限に達した ちがう種類の2体で行います。親は2体とも旅立ち、えらんだ親の種類の子が生まれます。', '子はレベル' + TK.CHILD_LV + 'からですが、レベル上限が10上がり（最大100）、伸びやすさや耐性が上がることがあります。', 'えらばなかった親の とくぎを 1つ 受けつげます（自分のとくぎと合わせて' + TK.SKILL_MAX + '個まで）。']) +
      '</div></section>' + saveCard() + '<footer class="foot"><span>登場するクリーチャーはすべてオリジナルです。</span><button class="btn sm danger" id="reset">データを消す</button></footer></div>';
    bindSaveCard();
    $('reset').onclick = function () {
      ask('データを消しますか？', '<p>この端末のセーブが消えます。元に戻せません。</p>', function () {
        TK.wipe().then(function () { S = null; title(); });
      });
    };
  }
  function saveCard() {
    return '<section class="card"><h2 class="h">セーブの守り</h2>' +
      '<p class="sub">この端末の2か所に自動で保存しています。ブラウザの「サイトデータの削除」では どちらも消えるので、下のファイル書き出しで 備えてください。別の端末へ移すときも 使えます。</p>' +
      '<h3 class="h" style="font-size:16px;margin-top:10px">ファイル</h3><div class="row"><button class="btn sm" id="expFile">ファイルに書き出す</button><button class="btn sm" id="impFile">ファイルから読みこむ</button><input type="file" id="fileIn" accept=".json,application/json" hidden></div></section>';
  }
  function replaceSave(data) {
    if (!TK.validSave(data)) { modal('読みこめませんでした', '<p>セーブデータの形が ちがいます。</p>'); return; }
    ask('読みこみますか？', '<p>いまのデータは 読みこんだデータで 上書きされます。</p>', function () {
      S = TK.migrateSave(data);
      save();
      shell();
      toast('読みこみました');
    });
  }
  function bindSaveCard() {
    $('expFile').onclick = function () {
      var url = URL.createObjectURL(new Blob([JSON.stringify(S)], { type: 'application/json' })), a = document.createElement('a');
      a.href = url;
      a.download = 'tekuteku-creatures-save.json';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    };
    $('impFile').onclick = function () { $('fileIn').click(); };
    $('fileIn').onchange = function (e) {
      var file = e.target.files[0];
      if (!file) return;
      file.text().then(function (t) { replaceSave(JSON.parse(t)); }).catch(function () { modal('読みこめませんでした', '<p>ファイルを 確かめてください。</p>'); });
    };
  }

  S = TK.load();
  title();
  // IndexedDB 側の方が新しい、または localStorage だけ消えていた時は そちらから戻す
  TK.loadBest().then(function (best) {
    if (best && !app.querySelector('.app') && (!S || (best.savedAt || 0) > (S.savedAt || 0))) S = best;
  });
  setInterval(tick, 1000);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modalEl.hidden && modalEl.querySelectorAll('.mbtn button').length === 1) closeModal(); });
  TK.debug = {
    get state() { return S; }, set state(v) { S = v; }, shell: shell, go: go, dexEntry: dexEntry, modal: modal, startRun: startRun,
    setSkip: function (v) { skip = v; }, render: render
  };
})(window.TK);
