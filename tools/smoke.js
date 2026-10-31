// 実際のボタンを押して、主な流れが動くことを確かめる
function smoke(s) {
  var lines = [], out = document.getElementById('out');
  function ok(c, m) { lines.push((c ? 'PASS ' : 'FAIL ') + m); }
  var q = function (sel) { return document.querySelector(sel); }, all = function (sel) { return Array.from(document.querySelectorAll(sel)); };
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  async function until(fn, ms) {
    var t = 0;
    while (t < (ms || 20000)) { if (fn()) return true; await sleep(30); t += 30; }
    return false;
  }
  function closeAll() { var b = q('#modal:not([hidden]) .mbtn button'); if (b) b.click(); }
  (async function () {
    try {
      ['mon', 'bag', 'mix', 'dict', 'dex', 'help', 'adv'].forEach(function (t) { q('[data-t="' + t + '"]').click(); ok(q('#main').children.length > 0, 'tab ' + t); });
      q('[data-a="4"]').click();
      ok(q('.stn.on').dataset.a === '4', 'select area');
      q('[data-t="mon"]').click();
      var sel = q('#detail select[data-slot="weapon"]'), itemOpt = sel.options[1];
      if (itemOpt) { sel.value = itemOpt.value; sel.dispatchEvent(new Event('change')); ok(TK.bagList(s).some(function (b) { return b.by; }), 'equip item'); }
      q('[data-t="bag"]').click();
      var coins = s.coins;
      q('#buyC').click();
      s.coins += 100000;
      var wareBtn = q('[data-buy]'), bagBefore = Object.keys(s.items).length;
      wareBtn.click();
      ok(Object.keys(s.items).length === bagBefore + 1, 'shop item bought');
      s.coins -= 100000;
      ok(s.cookies === 4, 'buy snack');

      q('[data-t="mix"]').click();
      var cards = all('[data-m]');
      var base = TK.findInst(s, +cards[0].dataset.m), other = TK.findInst(s, +cards[1].dataset.m), count = s.ranch.length;
      cards[0].click();
      all('[data-m]')[1].click();
      ok(!q('#doMix').disabled, 'mix enabled');
      q('#doMix').click();
      q('#modal .btn.pri').click();
      var kid = s.ranch[s.ranch.length - 1];
      ok(kid.sp === base.sp && kid.lv === 1 && TK.levelCap(kid) === 60, 'child born at Lv1 with cap 60');
      ok(s.ranch.length === count - 1 && !TK.findInst(s, other.uid) && !TK.findInst(s, base.uid), 'both parents left');
      closeAll();

      s.speed = 1000;
      q('[data-t="adv"]').click();
      q('[data-a="6"]').click();
      var before = s.runs;
      q('#start').click();
      ok(s.runs === before + 1, 'run starts');
      ok(await until(function () { return !q('#modal').hidden; }, 30000), 'run finishes');
      closeAll();
      ok(q('.map') !== null, 'back on map');

      q('[data-t="mon"]').click();
      q('#toDex').click();
      ok(q('[data-t="dex"]').getAttribute('aria-selected') === 'true' && !q('#modal').hidden, 'creature picture opens its dex entry');
      closeAll();
      q('[data-t="dict"]').click();
      var knownN = {}; s.ranch.forEach(function (m) { TK.knownSkills(m.sp, m.lv, m.learned).forEach(function (id) { knownN[id] = 1; }); });
      ok(all('.skrow').length === Object.keys(knownN).length, 'dictionary lists only skills the creatures know');
      q('[data-t="dex"]').click();
      ok(all('[data-d]').length === 50, 'dex shows 50 per page');
      var seenOnly = TK.SPECIES.filter(function (x) { return s.seen[x.id] && !s.owned[x.id]; })[0];
      q('#seg-dexp [data-v="' + Math.floor(seenOnly.id / 50) + '"]').click();
      ok(q('[data-d="' + seenOnly.id + '"]').textContent.indexOf(seenOnly.name) < 0, 'seen-only creature hides its name');
      q('[data-d="' + seenOnly.id + '"]').click();
      var mt = q('#modal').textContent;
      ok(q('#modal svg') && !q('#modal .resist') && !q('#modal .pills') && mt.indexOf(seenOnly.name) < 0, 'seen-only shows the picture only');
      closeAll();
      var ownedOne = TK.SPECIES.filter(function (x) { return s.owned[x.id]; })[0];
      TK.debug.dexEntry(ownedOne.id);
      ok(q('#modal .resist') && q('#modal .pills'), 'owned creature shows full info');
      closeAll();
      q('[data-t="adv"]').click();
      q('[data-a="7"]').click();
      ok(all('[data-f]').length === 5 && !q('[data-f="0"]').disabled && q('[data-f="1"]').disabled, 'floor buttons follow progress');
      q('[data-t="bag"]').click();
      ok(q('#doAl') && q('#doAl').disabled, 'alchemy shown after area 2 opens');
      var als = all('[data-al]');
      als[0].click();
      all('[data-al]')[1].click();
      ok(!q('#doAl').disabled, 'two materials enable alchemy');
      var itemsBefore = Object.keys(s.items).length;
      q('#doAl').click();
      q('#modal .btn.pri').click();
      ok(Object.keys(s.items).length === itemsBefore - 1, 'alchemy makes one from two');
      closeAll();
      q('[data-t="help"]').click();
      ok(q('#expFile') && q('#reset'), 'save tools are shown');
      ok(JSON.parse(localStorage.getItem(TK.SAVE_KEY)).runs === s.runs, 'saved to localStorage');
    } catch (e) { ok(false, 'EXCEPTION ' + e.stack); }
    var errs = document.getElementById('errs').textContent;
    ok(!errs, 'no runtime errors ' + errs);
    out.textContent = lines.join('\n');
  })();
}
