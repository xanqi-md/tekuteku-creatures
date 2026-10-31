// ゲームのルール本体。DOMに触らない。UI・バランス検証・テストで共用する。
window.TK = window.TK || {};
(function (TK) {
  'use strict';

  TK.rng = function (seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  TK.hashStr = function (s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };

  var OPPOSITE = { fire: 'water', water: 'thunder', thunder: 'earth', earth: 'wind', wind: 'fire', light: 'dark', dark: 'light' };
  var TIER_MUL = [0, 0.88, 0.94, 1, 1.06, 1.12, 1.18, 1.24, 1.3, 1.36, 1.42];
  var STAT_BASE = 22, HP_K = 1.7, MP_K = 0.55, GROW = 0.055;

  // 体ごとに固定の耐性。合計が0になるよう 強み と 弱み を必ず同数入れる
  function makeResist(i, el) {
    var r = TK.rng(i * 7919 + 13), arr = [2, 2, 2, 2, 2, 2, 2];
    var own = TK.ELEMENTS.indexOf(el), opp = TK.ELEMENTS.indexOf(OPPOSITE[el]);
    var strong = r() < 0.5;
    arr[own] = strong ? 0 : 1;
    arr[opp] = strong ? 4 : 3;
    var rest = [];
    for (var k = 0; k < 7; k++) if (k !== own && k !== opp) rest.push(k);
    for (var n = rest.length - 1; n > 0; n--) { var j = Math.floor(r() * (n + 1)), t = rest[n]; rest[n] = rest[j]; rest[j] = t; }
    var d = r() < 0.3 ? 2 : 1;
    arr[rest[0]] = 2 - d;
    arr[rest[1]] = 2 + d;
    return arr;
  }

  function makeShape(i, role) {
    var r = TK.rng(i * 104729 + 7), base = TK.ROLES[role], out = {}, sum = 0, want = 0;
    TK.STATS.forEach(function (s) { out[s] = base[s] * (0.85 + r() * 0.3); want += base[s]; });
    // 体ごとに 得意な能力 と 苦手な能力 を1つずつ決めて、同じ役割でも別物にする
    var order = TK.STATS.slice().sort(function (a, b) { return base[b] - base[a]; });
    var lean = role === 'balance' ? 0.5 : 0.35;
    out[order[Math.floor(r() * 3)]] *= 1 + lean; out[order[3 + Math.floor(r() * 3)]] *= 1 - lean;
    TK.STATS.forEach(function (s) { sum += out[s]; });
    TK.STATS.forEach(function (s) { out[s] = out[s] * want / sum; });
    return out;
  }

  // エリア順に並べ、各エリアの最後の1体を ぬしにする
  (function () {
    var groups = [];
    for (var a = 0; a < 40; a++) groups.push({ reg: [], boss: null });
    TK.CREATURE_ROWS.trim().split('\n').forEach(function (line, i) {
      if (i >= 140) groups[10 + i - 140].reg.push(line);
      else if (i % 7 === 6) groups[Math.floor(i / 7)].boss = line;
      else groups[Math.floor(i / 7)].reg.push(line);
    });
    TK.EXTRA_ROWS.trim().split('\n').forEach(function (line) {
      var k = line.indexOf('|');
      groups[+line.slice(0, k)].reg.push(line.slice(k + 1));
    });
    // 後半のエリアは5体ずつで、5体目がぬし。番号を保つため 最後に足す
    TK.LATE_ROWS.trim().split('\n').forEach(function (line, i) {
      var k = line.indexOf('|'), g = groups[+line.slice(0, k)];
      if (i % 5 === 4) g.boss = line.slice(k + 1); else g.reg.push(line.slice(k + 1));
    });
    TK.FINAL_ROWS.trim().split('\n').forEach(function (line, i) {
      var k = line.indexOf('|'), g = groups[+line.slice(0, k)];
      if (i % 10 === 9) g.boss = line.slice(k + 1); else g.reg.push(line.slice(k + 1));
    });
    TK.SPECIES = [];
    TK.AREAS = TK.AREA_ROWS.trim().split('\n').map(function (line, i) {
      var f = line.split('|'), g = groups[i], ids = [];
      g.reg.concat([g.boss]).forEach(function (row, k) {
        var c = row.split('|'), id = TK.SPECIES.length, isBoss = k === g.reg.length;
        var theme = c[2], rr = TK.rng(id * 6151 + 3), own = TK.ELEMENTS.indexOf(theme);
        ids.push(id);
        TK.SPECIES.push({
          id: id, name: c[0], body: c[1], theme: theme, role: c[3], trait: c[4], acc: c[5], desc: c[6],
          area: i, boss: isBoss, tier: Math.floor(i / 4) + 1,
          skillEls: [theme, TK.ELEMENTS[(own + 1 + Math.floor(rr() * 6)) % 7]],
          res: makeResist(id, theme), shape: makeShape(id, c[3])
        });
      });
      return {
        id: i, name: f[0], bg: f[1], desc: f[2],
        lv: i < 20 ? Math.round(2 + 3.6 * i) : Math.round(70 + (i - 19) * 1.3), steps: 4 + Math.floor(i / 10),
        regulars: ids.slice(0, -1), boss: ids[ids.length - 1], from: f[3] ? f[3].split(',').map(Number) : []
      };
    });
    // 後半のエリアには 近い雰囲気の場所の住人も現れる
    TK.AREAS.forEach(function (a) {
      a.from.forEach(function (src) { a.regulars = a.regulars.concat(TK.AREAS[src].regulars.slice(0, 3)); });
    });
  })();
  TK.PW = TK.PW || [];
  function pw(id) { return TK.PW[id] || 1; }

  TK.baseStat = function (id, stat) {
    var s = TK.SPECIES[id], v = s.shape[stat] * STAT_BASE * TIER_MUL[s.tier] * pw(id);
    return stat === 'hp' ? v * HP_K : stat === 'mp' ? v * MP_K : v;
  };
  TK.statAt = function (id, stat, lv, gIdx) {
    return Math.round(TK.baseStat(id, stat) * (1 + (lv - 1) * GROW * TK.GROWTH[gIdx].mult));
  };
  TK.resistSteps = function (inst) {
    return TK.SPECIES[inst.sp].res.map(function (v, i) { return Math.max(0, v - (inst.resUp ? inst.resUp[i] : 0)); });
  };

  // --- 個体 ---
  TK.levelCap = function (inst) { return Math.min(100, 50 + 10 * inst.breed); };
  TK.xpNeed = function (lv) { return Math.floor(12 + lv * 5 + lv * lv * 0.85); };

  TK.newInst = function (sp, lv, r, uid) {
    var g = {};
    TK.STATS.forEach(function (s) { var x = r(); g[s] = x < 0.25 ? 0 : x < 0.8 ? 1 : 2; });
    return { uid: uid, sp: sp, lv: lv, xp: 0, breed: 0, g: g, resUp: [0, 0, 0, 0, 0, 0, 0], eq: { weapon: null, armor: null, acc: null } };
  };
  TK.skillId = function (sp, code) {
    var e = TK.SPECIES[sp].skillEls;
    return code.replace('$', e[0]).replace('%', e[1]);
  };
  // 役割の型に、体ごとの2つを足す。消費MPが大きいほうを あとでおぼえる
  var kitCache = {};
  TK.kitOf = function (sp) {
    if (kitCache[sp]) return kitCache[sp];
    var s = TK.SPECIES[sp], r = TK.rng(sp * 7919 + 11), pool = TK.KIT_POOL[s.role].slice();
    var a = pool.splice(Math.floor(r() * pool.length), 1)[0], b = pool[Math.floor(r() * pool.length)];
    var mp = function (c) { return TK.SKILLS[TK.skillId(sp, c)].mp; };
    if (mp(a) > mp(b)) { var c = a; a = b; b = c; }
    kitCache[sp] = TK.KITS[s.role].concat([[14, a], [40, b]]).sort(function (x, y) { return x[0] - y[0]; });
    return kitCache[sp];
  };
  // learned は 配合で親から受けついだ とくぎ
  TK.knownSkills = function (sp, lv, learned) {
    var s = TK.SPECIES[sp];
    var own = TK.kitOf(sp).filter(function (k) { return k[0] <= lv; }).map(function (k) { return TK.skillId(sp, k[1]); });
    return own.concat((learned || []).filter(function (id) { return own.indexOf(id) < 0; }));
  };
  TK.kitSkills = function (sp) { return TK.kitOf(sp).map(function (k) { return TK.skillId(sp, k[1]); }); };
  // 姿を受けつがない親が おぼえている とくぎから 1つ。自分のとくぎと合わせて12個まで
  TK.SKILL_MAX = 12;
  TK.inheritable = function (base, other) {
    var own = TK.kitSkills(base.sp), had = base.learned || [];
    if (own.length + had.length >= TK.SKILL_MAX) return [];
    return TK.knownSkills(other.sp, other.lv, other.learned).filter(function (id) { return own.indexOf(id) < 0 && had.indexOf(id) < 0; });
  };
  // そうびの属性値を合計する。1つの属性につき威力 +60% まで
  TK.EL_POWER_MAX = 60;
  TK.elPower = function (inst, items) {
    var out = {};
    if (items) Object.keys(inst.eq).forEach(function (slot) {
      var it = inst.eq[slot] != null && items[inst.eq[slot]];
      if (it && it.el) out[it.el] = Math.min(TK.EL_POWER_MAX, (out[it.el] || 0) + it.elv);
    });
    return out;
  };
  TK.instStats = function (inst, items) {
    var out = {};
    TK.STATS.forEach(function (st) { out[st] = TK.statAt(inst.sp, st, inst.lv, inst.g[st]); });
    if (items) Object.keys(inst.eq).forEach(function (slot) {
      var it = inst.eq[slot] != null && items[inst.eq[slot]];
      if (it) Object.keys(it.bonus).forEach(function (k) { out[k] += it.bonus[k]; });
    });
    return out;
  };
  // バトル用の値だけを持つ形
  TK.toFighter = function (inst, items) {
    var st = TK.instStats(inst, items);
    return {
      sp: inst.sp, lv: inst.lv, hp: st.hp, mp: st.mp, atk: st.atk, def: st.def, mag: st.mag, spd: st.spd,
      res: TK.resistSteps(inst), skills: TK.knownSkills(inst.sp, inst.lv, inst.learned), trait: TK.SPECIES[inst.sp].trait,
      elp: TK.elPower(inst, items)
    };
  };
  TK.makeFoe = function (sp, lv, mul, hpMul) {
    var g = { hp: 1, mp: 1, atk: 1, def: 1, mag: 1, spd: 1 };
    var f = TK.toFighter({ sp: sp, lv: lv, g: g, resUp: null, eq: {} });
    ['atk', 'def', 'mag', 'spd'].forEach(function (k) { f[k] = Math.round(f[k] * mul); });
    f.hp = Math.round(f.hp * mul * (hpMul || 1));
    return f;
  };

  // --- はいごう ---
  TK.canBreed = function (a, b) {
    if (!a || !b || a.uid === b.uid) return { ok: false, why: '2体えらんでね' };
    if (a.sp === b.sp) return { ok: false, why: '同じクリーチャーどうしは はいごうできません' };
    if (a.lv < TK.levelCap(a)) return { ok: false, why: TK.SPECIES[a.sp].name + ' がレベル上限に達していません' };
    if (b.lv < TK.levelCap(b)) return { ok: false, why: TK.SPECIES[b.sp].name + ' がレベル上限に達していません' };
    return { ok: true };
  };
  // 能力の変化を inst に適用する。親を消して子を作るのは TK.breed の仕事
  TK.applyBreed = function (base, r) {
    var capBefore = TK.levelCap(base), result = { capBefore: capBefore, growth: [], resist: null };
    base.breed++;
    result.capAfter = TK.levelCap(base);
    TK.STATS.forEach(function (st) {
      var roll = r();
      if (base.g[st] < 2 && roll < 1 / 3) { base.g[st]++; result.growth.push({ stat: st, to: base.g[st] }); }
    });
    var chance = r(), steps = TK.resistSteps(base);
    if (chance < 0.5) {
      var can = [];
      steps.forEach(function (v, i) { if (v > 0) can.push(i); });
      if (can.length) {
        var pick = can[Math.floor(r() * can.length)];
        base.resUp[pick]++;
        result.resist = pick;
      }
    }
    return result;
  };

  // 親2体は旅立ち、種類と伸びやすさを base から受けついだ子が レベル1で生まれる
  TK.CHILD_LV = 1;
  TK.breed = function (s, baseUid, otherUid, r, skill) {
    var base = TK.findInst(s, baseUid), other = TK.findInst(s, otherUid);
    if (!TK.canBreed(base, other).ok) return null;
    var child = JSON.parse(JSON.stringify(base)), takes = !!skill && TK.inheritable(base, other).indexOf(skill) >= 0;
    if (takes) child.learned = (child.learned || []).concat([skill]);
    child.uid = s.uid++; child.lv = TK.CHILD_LV; child.xp = 0;
    child.eq = { weapon: null, armor: null, acc: null };
    var result = TK.applyBreed(child, r);
    result.learned = takes ? skill : null;
    var slot = s.party.indexOf(baseUid);
    if (slot < 0) slot = s.party.indexOf(otherUid);
    s.party = s.party.filter(function (u) { return u !== otherUid; });
    if (slot >= 0) {
      var at = s.party.indexOf(baseUid);
      if (at >= 0) s.party[at] = child.uid; else s.party.splice(Math.min(slot, s.party.length), 0, child.uid);
    }
    s.ranch = s.ranch.filter(function (m) { return m.uid !== baseUid && m.uid !== otherUid; });
    s.ranch.push(child);
    if (!s.party.length) s.party.push(child.uid);
    result.child = child;
    return result;
  };

  // --- バトル ---
  function mkUnit(f, side, idx) {
    var cur = f.curHp == null ? f.hp : Math.max(0, Math.min(f.hp, f.curHp));
    var m = f.curMp == null ? f.mp : Math.max(0, Math.min(f.mp, f.curMp));
    return {
      i: idx, side: side, f: f, sp: f.sp, trait: f.trait, hp: cur, maxHp: f.hp, mp: m, maxMp: f.mp,
      buff: { atk: 0, def: 0, mag: 0, spd: 0 }, buffT: { atk: 0, def: 0, mag: 0, spd: 0 },
      poison: 0, stun: 0, gutsUsed: false, aidUsed: false, castBuff: {}
    };
  }
  function stat(u, k) { return u.f[k] * (1 + u.buff[k]); }

  TK.simulate = function (teamA, teamB, opt) {
    var r = TK.rng(opt.seed), events = [], units = [];
    teamA.forEach(function (f) { units.push(mkUnit(f, 0, units.length)); });
    teamB.forEach(function (f) { units.push(mkUnit(f, 1, units.length)); });
    var tac = [TK.TACTICS[opt.tacticA || 'balance'], TK.TACTICS[opt.tacticB || 'balance']];
    var maxRounds = opt.maxRounds || 30, round = 0;
    function alive(side) { return units.filter(function (u) { return u.side === side && u.hp > 0; }); }
    function log(e) { events.push(e); }

    function ko(t) {
      if (t.trait === 'guts' && !t.gutsUsed) { t.gutsUsed = true; t.hp = 1; log({ e: 'trait', t: t.i, name: 'ふんばり' }); return; }
      t.hp = 0; log({ e: 'ko', t: t.i });
    }
    function applyDamage(t, d) {
      t.hp -= d;
      if (t.hp <= 0) ko(t);
      else if (t.trait === 'firstaid' && !t.aidUsed && t.hp / t.maxHp <= 0.3) {
        t.aidUsed = true;
        var h = Math.round(t.maxHp * 0.5);
        t.hp = Math.min(t.maxHp, t.hp + h);
        log({ e: 'trait', t: t.i, name: 'おまもり' });
        log({ e: 'heal', t: t.i, a: h, hp: t.hp });
      }
    }
    function dmgMult(u) {
      var m = 1;
      if (u.trait === 'glass') m *= 1.35;
      if (u.trait === 'berserk' && u.hp / u.maxHp <= 0.5) m *= 1.4;
      if (u.trait === 'lone' && alive(u.side).length === 1) m *= 1.6;
      return m;
    }
    function resMult(t, el) {
      if (!el) return 1;
      return TK.RES_STEPS[t.f.res[TK.ELEMENTS.indexOf(el)]].mult;
    }
    function hit(u, t0, sk, pow) {
      var t = t0;
      if (sk.target === 'one') {
        var cover = alive(t.side).filter(function (x) { return x !== t && x.trait === 'taunt'; });
        if (cover.length && r() < 0.3) { t = cover[0]; log({ e: 'trait', t: t.i, name: 'かばう' }); }
        if (t.trait === 'dodge' && r() < 0.2) { log({ e: 'miss', t: t.i }); return; }
      }
      var phys = sk.kind === 'phys';
      var att = phys ? stat(u, 'atk') : stat(u, 'mag');
      var def = phys ? stat(t, 'def') : (stat(t, 'mag') + stat(t, 'def')) * 0.5;
      if (u.trait === 'pierce') def *= 0.7;
      if (sk.ignore) def *= 1 - sk.ignore;
      def = Math.max(1, def);
      var mult = resMult(t, sk.el);
      var d = pow * att * att / (att + def) * 0.62 * mult * dmgMult(u) * (0.92 + r() * 0.16);
      if (!phys && u.trait === 'magicboost') d *= 1.25;
      if (sk.el && u.trait === 'elboost') d *= 1.25;
      if (sk.el && u.f.elp && u.f.elp[sk.el]) d *= 1 + u.f.elp[sk.el] / 100;
      if (phys && t.trait === 'magicboost') d *= 1.15;
      if (phys && t.trait === 'armor') d *= 0.75;
      if (!phys && t.trait === 'barrier') d *= 0.75;
      if (t.trait === 'glass') d *= 1.25;
      var crit = r() < (u.trait === 'crit' ? 0.25 : 0.05) + (sk.critUp || 0);
      if (crit) d *= 1.5;
      d = Math.max(1, Math.round(d));
      var after = Math.max(0, t.hp - d);
      log({ e: 'hit', u: u.i, t: t.i, d: d, crit: crit, mult: mult, hp: after });
      applyDamage(t, d);
      if (sk.drain && u.hp > 0) {
        var sd = Math.round(d * sk.drain);
        u.hp = Math.min(u.maxHp, u.hp + sd);
        log({ e: 'heal', t: u.i, a: sd, hp: u.hp });
      }
      if (sk.addPoison && t.hp > 0 && !t.poison && r() < sk.addPoison) { t.poison = 3; log({ e: 'status', t: t.i, st: 'poison' }); }
      if (sk.addStun && t.hp > 0 && !t.stun && r() < sk.addStun) { t.stun = 1; log({ e: 'status', t: t.i, st: 'stun' }); }
      if (sk.lower && t.hp > 0) {
        t.buff.def = Math.min(t.buff.def, -sk.lower);
        t.buffT.def = 3;
        log({ e: 'buff', t: t.i, stat: 'def', up: false });
      }
      if (sk.recoil && u.hp > 0) {
        var rc = Math.max(1, Math.round(d * sk.recoil));
        log({ e: 'hit', u: u.i, t: u.i, d: rc, crit: false, mult: 1, hp: Math.max(0, u.hp - rc) });
        applyDamage(u, rc);
      }
      if (phys) {
        if (u.trait === 'drain' && u.hp > 0) {
          var dr = Math.round(d * 0.2);
          u.hp = Math.min(u.maxHp, u.hp + dr);
          log({ e: 'heal', t: u.i, a: dr, hp: u.hp });
        }
        if (t.trait === 'thorns' && u.hp > 0) {
          var th = Math.max(1, Math.round(d * 0.2));
          log({ e: 'hit', u: t.i, t: u.i, d: th, crit: false, mult: 1, hp: Math.max(0, u.hp - th) });
          applyDamage(u, th);
        }
        if (t.trait === 'counter' && t.hp > 0 && u.hp > 0 && r() < 0.3) {
          log({ e: 'trait', t: t.i, name: 'はんげき' });
          hit(t, u, { kind: 'phys', target: 'all', pow: 0.8 }, 0.8);
        }
        if (u.trait === 'poison' && t.hp > 0 && !t.poison && r() < 0.3) { t.poison = 3; log({ e: 'status', t: t.i, st: 'poison' }); }
      }
      if (u.trait === 'stun' && t.hp > 0 && !t.stun && r() < 0.18) { t.stun = 1; log({ e: 'status', t: t.i, st: 'stun' }); }
    }

    function choose(u) {
      var skills = u.f.skills.map(function (id) { return TK.SKILLS[id] && { id: id, s: TK.SKILLS[id] }; })
        .filter(function (x) { return x && x.s.mp <= u.mp; });
      var t = tac[u.side], allies = alive(u.side), foes = alive(1 - u.side);
      var low = allies.filter(function (a) { return a.hp / a.maxHp < t.healAt; });
      if (low.length) {
        var heals = skills.filter(function (x) { return x.s.kind === 'heal'; }).sort(function (x, y) { return y.s.pow - x.s.pow; });
        var all = heals.filter(function (x) { return x.s.target === 'allies'; })[0];
        var one = heals.filter(function (x) { return x.s.target === 'ally'; })[0];
        var self = skills.filter(function (x) { return x.s.kind === 'heal' && x.s.target === 'self'; })[0];
        if (all && low.length >= 2) return all;
        if (one) return one;
        if (self && u.hp / u.maxHp < t.healAt) return self;
      }
      if (r() > t.skillRate) return { id: 'basic', s: TK.SKILLS.basic };
      var early = round <= 4;
      var sup = skills.filter(function (x) {
        var k = x.s.kind;
        if ((k === 'buff' || k === 'debuff') && early && !u.castBuff[x.id]) return true;
        if (k === 'poison' && foes.filter(function (f) { return !f.poison; }).length >= 2 && !u.castBuff[x.id]) return true;
        if (k === 'stun' && early && !u.castBuff[x.id]) return true;
        return false;
      });
      if (sup.length && r() < 0.65) return sup[Math.floor(r() * sup.length)];
      var best = null, bs = -1;
      skills.forEach(function (x) {
        var k = x.s.kind;
        if (k !== 'phys' && k !== 'mag') return;
        var att = k === 'phys' ? u.f.atk : u.f.mag, score = 0;
        var mults = foes.map(function (f) { return resMult(f, x.s.el) * x.s.pow * (x.s.hits || 1); });
        if (x.s.target === 'all') mults.forEach(function (m) { score += m; });
        else score = Math.max.apply(null, mults);
        score = score * att / (1 + x.s.mp * 0.02);
        if (score > bs) { bs = score; best = x; }
      });
      return best || { id: 'basic', s: TK.SKILLS.basic };
    }

    function act(u) {
      var foes = alive(1 - u.side), allies = alive(u.side);
      if (!foes.length) return;
      var c = choose(u), sk = c.s;
      u.mp -= sk.mp;
      u.castBuff[c.id] = true;
      log({ e: 'use', u: u.i, skill: c.id, mp: u.mp });
      var boost = u.trait === 'support' ? 1.3 : 1;
      if (sk.kind === 'phys' || sk.kind === 'mag') {
        if (sk.target === 'all') foes.forEach(function (t) { if (u.hp > 0) hit(u, t, sk, sk.pow); });
        else {
          var pick = foes.slice().sort(function (a, b) {
            return resMult(b, sk.el) - resMult(a, sk.el) || a.hp / a.maxHp - b.hp / b.maxHp;
          })[0];
          for (var h = 0; h < (sk.hits || 1); h++) if (pick.hp > 0 && u.hp > 0) hit(u, pick, sk, sk.pow);
        }
      } else if (sk.kind === 'heal') {
        var list = sk.target === 'allies' ? allies : sk.target === 'self' ? [u]
          : [allies.slice().sort(function (a, b) { return a.hp / a.maxHp - b.hp / b.maxHp; })[0]];
        list.forEach(function (t) {
          var a = Math.round((stat(u, 'mag') * 1.1 + t.maxHp * 0.12) * sk.pow * boost);
          t.hp = Math.min(t.maxHp, t.hp + a);
          log({ e: 'heal', t: t.i, a: a, hp: t.hp });
        });
      } else if (sk.kind === 'buff') {
        (sk.target === 'self' ? [u] : allies).forEach(function (t) {
          t.buff[sk.stat] = Math.max(t.buff[sk.stat], sk.amt * boost);
          t.buffT[sk.stat] = 4;
          log({ e: 'buff', t: t.i, stat: sk.stat, up: true });
        });
      } else if (sk.kind === 'debuff') {
        foes.forEach(function (t) {
          t.buff[sk.stat] = Math.min(t.buff[sk.stat], -sk.amt);
          t.buffT[sk.stat] = 3;
          log({ e: 'buff', t: t.i, stat: sk.stat, up: false });
        });
      } else if (sk.kind === 'poison') {
        foes.forEach(function (t) { if (!t.poison && r() < sk.chance) { t.poison = 3; log({ e: 'status', t: t.i, st: 'poison' }); } });
      } else if (sk.kind === 'stun') {
        var tgt = foes[Math.floor(r() * foes.length)];
        if (!tgt.stun && r() < sk.chance) { tgt.stun = 1; log({ e: 'status', t: tgt.i, st: 'stun' }); }
      }
    }

    while (round < maxRounds && alive(0).length && alive(1).length) {
      round++;
      log({ e: 'round', n: round });
      var order = units.filter(function (u) { return u.hp > 0; }).map(function (u) {
        var sp = stat(u, 'spd');
        if (u.trait === 'sente' && round === 1) sp *= 1.6;
        return { u: u, k: sp * (0.9 + r() * 0.2) };
      }).sort(function (a, b) { return b.k - a.k || a.u.i - b.u.i; });
      for (var n = 0; n < order.length; n++) {
        var u = order[n].u;
        if (u.hp <= 0) continue;
        if (!alive(1 - u.side).length) break;
        if (u.stun) { u.stun = 0; log({ e: 'skip', t: u.i }); continue; }
        act(u);
        if (u.hp > 0 && u.trait === 'pair' && alive(1 - u.side).length && r() < 0.25) { log({ e: 'trait', t: u.i, name: 'にれんげき' }); act(u); }
        if (u.hp > 0) {
          if (u.trait === 'regen' && u.hp < u.maxHp) {
            var rg = Math.round(u.maxHp * 0.06);
            u.hp = Math.min(u.maxHp, u.hp + rg);
            log({ e: 'heal', t: u.i, a: rg, hp: u.hp });
          }
          if (u.trait === 'mpregen') u.mp = Math.min(u.maxMp, u.mp + Math.round(u.maxMp * 0.08));
          if (u.poison) {
            u.poison--;
            var pd = Math.max(1, Math.round(u.maxHp * 0.07));
            log({ e: 'poison', t: u.i, d: pd, hp: Math.max(0, u.hp - pd) });
            applyDamage(u, pd);
          }
        }
      }
      units.forEach(function (u) {
        Object.keys(u.buffT).forEach(function (k) {
          if (u.buffT[k] > 0 && --u.buffT[k] === 0) u.buff[k] = 0;
        });
      });
    }
    var a = alive(0).length, b = alive(1).length, winner;
    if (a && !b) winner = 0;
    else if (b && !a) winner = 1;
    else {
      var ratio = function (side) {
        return units.filter(function (u) { return u.side === side; }).reduce(function (s, u) { return s + u.hp / u.maxHp; }, 0);
      };
      winner = ratio(0) >= ratio(1) ? 0 : 1;
      log({ e: 'timeup' });
    }
    return {
      events: events, winner: winner, rounds: round,
      units: units.map(function (u) { return { sp: u.sp, side: u.side, hp: u.hp, mp: u.mp, maxHp: u.maxHp, maxMp: u.maxMp, lv: u.f.lv }; })
    };
  };

  // --- ぼうけん回数 (4時間で1回復、最大100、初期20) ---
  TK.STAMINA = { start: 20, max: 100, ms: 4 * 3600 * 1000 };
  TK.tickStamina = function (st, now) {
    var c = TK.STAMINA;
    if (st.n >= c.max) { st.t = now; return st; }
    var gained = Math.floor((now - st.t) / c.ms);
    if (gained > 0) {
      st.n = Math.min(c.max, st.n + gained);
      st.t = st.n >= c.max ? now : st.t + gained * c.ms;
    }
    return st;
  };
  TK.staminaNext = function (st, now) {
    return st.n >= TK.STAMINA.max ? 0 : Math.max(0, st.t + TK.STAMINA.ms - now);
  };

  // --- セーブデータとぼうけんの進行 ---
  // 序盤は負けて覚えるより 歩いて楽しむ。後半ほど そうびと配合の分だけ敵も強くする
  TK.BOSS_MUL = 1.1;
  TK.bossHp = function (areaId) { return Math.min(2.7, 1.5 + areaId * 0.24); };
  TK.foeMul = function (areaId) {
    var base = areaId < 4 ? [0.54, 0.7, 0.78, 0.84][areaId] : 0.88 + areaId * 0.019;
    return base * ((TK.AREA_ADJ || [])[areaId] || 1);
  };
  TK.PRICE = { cookie: 40, bagMax: 80, ranchMax: 500, shopItem: 120 };

  TK.newState = function (starter, now, seed) {
    var r = TK.rng(seed);
    var s = {
      v: 3, seed: seed, uid: 1, itemId: 1, coins: 150, cookies: 3, autoCookie: true, tactic: 'balance', speed: 1,
      stamina: { n: TK.STAMINA.start, t: now }, ranch: [], party: [], items: {}, cleared: {}, floors: {}, seen: {}, owned: {}, shop: [],
      runs: 0, playerName: 'たびびと'
    };
    var a = TK.addCreature(s, starter, 6, r);
    // 2体目は最初の草原のなかま。ひとり旅で全滅しないように
    var b = TK.addCreature(s, starter === 3 ? 5 : 3, 5, r);
    s.party = [a.uid, b.uid];
    TK.refreshShop(s, r);
    return s;
  };
  TK.findInst = function (s, uid) {
    for (var i = 0; i < s.ranch.length; i++) if (s.ranch[i].uid === uid) return s.ranch[i];
    return null;
  };
  TK.addCreature = function (s, sp, lv, r) {
    var inst = TK.newInst(sp, lv, r, s.uid++);
    s.ranch.push(inst);
    s.seen[sp] = 1; s.owned[sp] = 1;
    if (s.party.length < 4 && s.party.indexOf(inst.uid) < 0) s.party.push(inst.uid);
    return inst;
  };
  TK.partyInsts = function (s) { return s.party.map(function (u) { return TK.findInst(s, u); }).filter(Boolean); };
  // パレードの列にいる仲間は まきばの数に入れない
  TK.ranchCount = function (s) { return s.ranch.length - TK.partyInsts(s).length; };

  TK.itemName = function (it) { return TK.QUALITY[it.q].name + (TK.EL_PREFIX[it.el] || '') + it.base; };
  function buildItem(s, slot, base, lv, q, el, elv, fx) {
    var v = (3 + lv * 0.9) * TK.QUALITY[q].mult, k = base[1], bonus = {};
    bonus[k] = Math.max(1, Math.round(v * (k === 'hp' ? 2.6 : k === 'spd' ? 0.6 : k === 'mp' ? 0.8 : 1)));
    var it = { id: s.itemId++, slot: slot, base: base[0], q: q, lv: lv, bonus: bonus, el: el || null, elv: el ? elv : 0, fx: fx || [] };
    it.name = TK.itemName(it);
    s.items[it.id] = it;
    return it;
  }
  TK.makeItem = function (s, lv, r, forceQ) {
    var slots = Object.keys(TK.ITEM_BASE), slot = slots[Math.floor(r() * slots.length)];
    var base = TK.ITEM_BASE[slot], b = base[Math.floor(r() * base.length)];
    var q = forceQ;
    if (q == null) {
      var w = r() * 100, acc = 0;
      for (q = 0; q < TK.QUALITY.length; q++) { acc += TK.QUALITY[q].weight; if (w < acc) break; }
      q = Math.min(q, TK.QUALITY.length - 1);
    }
    // 半分のそうびは属性つき
    var el = r() < 0.5 ? TK.ELEMENTS[Math.floor(r() * TK.ELEMENTS.length)] : null;
    var elv = 2 + Math.floor(r() * 5), keys = Object.keys(TK.ITEM_FX), fx = [];
    // 品質が高いほど 追加効果が多い
    var nfx = [0, r() < 0.2 ? 1 : 0, r() < 0.5 ? 1 : 0, 1 + (r() < 0.4 ? 1 : 0), 2 + (r() < 0.4 ? 1 : 0)][q];
    for (var i = 0; i < nfx; i++) fx.push({ k: keys.splice(Math.floor(r() * keys.length), 1)[0], v: 10 + 5 * Math.floor(r() * 5) });
    return buildItem(s, slot, b, lv, q, el, elv, fx);
  };

  // --- れんきん ---
  TK.alchemyOpen = function (s) { return TK.areaOpen(s, 1); };
  TK.canAlchemy = function (s, idA, idB) {
    var a = s.items[idA], b = s.items[idB];
    if (!a || !b || a.id === b.id) return false;
    var worn = {};
    TK.bagList(s).forEach(function (x) { if (x.by) worn[x.it.id] = 1; });
    return !worn[a.id] && !worn[b.id];
  };
  // 同じなら確定する項目
  TK.alchemyPreview = function (a, b) {
    return { slot: a.slot === b.slot, q: a.q === b.q, el: !!a.el && a.el === b.el };
  };
  // 素材2つを消して1つ作る。そろった項目は引きつぎ、そろわない項目は どちらかになる
  TK.alchemy = function (s, idA, idB, r) {
    if (!TK.canAlchemy(s, idA, idB)) return null;
    var a = s.items[idA], b = s.items[idB], pick = function (x, y) { return r() < 0.5 ? x : y; };
    var same = TK.alchemyPreview(a, b);
    var slot = same.slot ? a.slot : pick(a.slot, b.slot), q = same.q ? a.q : pick(a.q, b.q), el, elv;
    if (same.el) {
      el = a.el;
      elv = Math.max(a.elv, b.elv) + 1 + Math.floor(r() * 3);
    } else {
      var src = pick(a, b);
      el = src.el; elv = src.elv;
    }
    var from = a.slot === slot && b.slot === slot ? pick(a, b) : a.slot === slot ? a : b;
    var list = TK.ITEM_BASE[slot], stat = Object.keys(from.bonus)[0];
    var base = list.filter(function (x) { return x[1] === stat; })[0] || list[0];
    var lv = Math.max(a.lv, b.lv) + 1;
    delete s.items[idA];
    delete s.items[idB];
    return buildItem(s, slot, base, lv, q, el, elv, pick(a, b).fx);
  };
  // --- おみせ ---
  TK.SHOP_SIZE = 5;
  function shopLv(s) {
    var top = 0;
    TK.AREAS.forEach(function (a) { if (TK.areaOpen(s, a.id)) top = a.id; });
    return TK.floorLv(top, Math.min(TK.floorsDone(s, top), TK.FLOORS - 1));
  }
  TK.refreshShop = function (s, r) {
    s.shop = [];
    for (var i = 0; i < TK.SHOP_SIZE; i++) {
      var it = TK.makeItem(s, shopLv(s), r);
      delete s.items[it.id];
      s.shop.push(it);
    }
  };
  TK.buyPrice = function (it) { return Math.round((60 + it.lv * 10) * TK.QUALITY[it.q].mult * (it.el ? 1.25 : 1) * (1 + 0.25 * (it.fx || []).length)); };
  TK.buyItem = function (s, id) {
    var it = (s.shop || []).filter(function (x) { return x.id === id; })[0];
    if (!it || s.coins < TK.buyPrice(it)) return null;
    s.coins -= TK.buyPrice(it);
    s.shop = s.shop.filter(function (x) { return x.id !== id; });
    s.items[it.id] = it;
    return it;
  };
  TK.sellPrice = function (it) { return Math.round((10 + it.lv * 3) * TK.QUALITY[it.q].mult); };
  TK.bagList = function (s) {
    var worn = {};
    s.ranch.forEach(function (m) { Object.keys(m.eq).forEach(function (k) { if (m.eq[k] != null) worn[m.eq[k]] = m.uid; }); });
    return Object.keys(s.items).map(function (k) { var it = s.items[k]; return { it: it, by: worn[it.id] || null }; });
  };

  TK.floorsDone = function (s, areaId) { return (s.floors && s.floors[areaId]) || 0; };
  TK.floorOpen = function (s, areaId, floor) { return floor >= 0 && floor < TK.FLOORS && floor <= TK.floorsDone(s, areaId); };
  TK.floorLv = function (areaId, floor) { return Math.max(1, TK.AREAS[areaId].lv + floor - 2); };
  TK.startRun = function (s, areaId, now, floor) {
    floor = floor || 0;
    TK.tickStamina(s.stamina, now);
    if (s.stamina.n < 1 || !TK.floorOpen(s, areaId, floor)) return null;
    var hp = {}, mp = {};
    TK.partyInsts(s).forEach(function (m) { var st = TK.instStats(m, s.items); hp[m.uid] = st.hp; mp[m.uid] = st.mp; });
    if (!Object.keys(hp).length) return null;
    if (s.stamina.n >= TK.STAMINA.max) s.stamina.t = now;
    s.stamina.n--;
    s.runs++;
    // 帰ってくると おみせの品ぞろえが変わっている
    TK.refreshShop(s, TK.rng((now ^ (s.runs * 40503)) >>> 0));
    return { area: areaId, floor: floor, step: 0, total: TK.AREAS[areaId].steps, hp: hp, mp: mp, coins: 0, xp: 0, recruits: [], items: [], over: false, seed: (now ^ (s.runs * 2654435761)) >>> 0 };
  };

  function partyFighters(s, run) {
    return TK.partyInsts(s).filter(function (m) { return run.hp[m.uid] > 0; }).map(function (m) {
      var f = TK.toFighter(m, s.items);
      f.curHp = run.hp[m.uid]; f.curMp = run.mp[m.uid]; f.uid = m.uid;
      return f;
    });
  }
  // 倒したぬしは 次の場所を歩いている。最後のぬしだけは クリア後の同じ場所にいる
  TK.WANDER_RATE = 0.15;
  TK.wanderers = function (s, areaId) {
    var out = areaId > 0 ? [TK.AREAS[areaId - 1].boss] : [];
    if (areaId === TK.AREAS.length - 1 && s.cleared[areaId]) out.push(TK.AREAS[areaId].boss);
    return out;
  };
  // パレードのそうびの 追加効果を合計する
  TK.partyFx = function (s) {
    var out = {};
    TK.partyInsts(s).forEach(function (m) {
      Object.keys(m.eq).forEach(function (slot) {
        var it = m.eq[slot] != null && s.items[m.eq[slot]];
        if (it) (it.fx || []).forEach(function (f) { out[f.k] = Math.min(TK.FX_MAX, (out[f.k] || 0) + f.v); });
      });
    });
    return out;
  };
  function pickFoes(s, area, r) {
    var most = area.id === 0 ? 1 : area.id < 3 ? 2 : 3;
    var n = 1 + Math.floor(r() * most) + (area.id >= 6 && r() < 0.3 ? 1 : 0), out = [];
    for (var i = 0; i < n; i++) out.push(area.regulars[Math.floor(r() * area.regulars.length)]);
    var w = TK.wanderers(s, area.id), left = w.filter(function (id) { return !s.owned[id]; });
    if (left.length) w = left;
    if (w.length && r() < TK.WANDER_RATE) out[0] = w[Math.floor(r() * w.length)];
    return out;
  }
  // 敵より低いレベルの仲間ほど多く育つ。配合で生まれた子が追いつくための仕組み
  TK.catchUp = function (lv, foeLv) { return Math.max(1, Math.min(6, 1 + (foeLv - lv) * 0.15)); };
  function awardXp(s, run, amt, foeLv) {
    var ups = [], list = TK.partyInsts(s);
    var lucky = list.some(function (m) { return TK.SPECIES[m.sp].trait === 'lucky'; });
    var gain = Math.round(amt * (lucky ? 1.15 : 1));
    run.xp += gain;
    list.forEach(function (m) {
      var alive = run.hp[m.uid] > 0, before = TK.instStats(m, s.items);
      m.xp += Math.round(gain * TK.catchUp(m.lv, foeLv));
      while (m.lv < TK.levelCap(m) && m.xp >= TK.xpNeed(m.lv)) {
        m.xp -= TK.xpNeed(m.lv); m.lv++;
        if (ups.indexOf(m.uid) < 0) ups.push(m.uid);
      }
      if (m.lv >= TK.levelCap(m)) m.xp = 0;
      var after = TK.instStats(m, s.items);
      if (alive) {
        run.hp[m.uid] += after.hp - before.hp;
        run.mp[m.uid] += after.mp - before.mp;
      }
    });
    return { gain: gain, ups: ups, lucky: lucky };
  }
  function useCookies(s, run) {
    if (!s.autoCookie) return 0;
    var list = TK.partyInsts(s), used = 0;
    var tired = function () {
      var c = 0, m = 0;
      list.forEach(function (x) { c += run.hp[x.uid]; m += TK.instStats(x, s.items).hp; });
      return c / m;
    };
    while (s.cookies > 0 && tired() < 0.5 && used < 3) {
      s.cookies--; used++;
      list.forEach(function (x) {
        var st = TK.instStats(x, s.items);
        run.hp[x.uid] = Math.min(st.hp, run.hp[x.uid] + Math.round(st.hp * 0.5));
        run.mp[x.uid] = Math.min(st.mp, run.mp[x.uid] + Math.round(st.mp * 0.2));
      });
    }
    return used;
  }

  // 1マス進める。戻り値をUIが再生する。報酬は確定済み
  TK.nextStep = function (s, run, now) {
    var r = TK.rng(run.seed + run.step * 1009), area = TK.AREAS[run.area];
    var lastStep = run.step === run.total - 1, bossStep = lastStep && run.floor === TK.FLOORS - 1;
    run.step++;
    var x = r();
    if (!lastStep && x > 0.72) {
      if (x > 0.9) {
        var it = TK.makeItem(s, area.lv, r);
        run.items.push(it.id);
        return { type: 'treasure', item: it };
      }
      if (x > 0.8) {
        var c = Math.round((12 + area.lv * 4) * (0.8 + r() * 0.5));
        s.coins += c; run.coins += c;
        return { type: 'coins', coins: c };
      }
      TK.partyInsts(s).forEach(function (m) {
        var st = TK.instStats(m, s.items);
        if (run.hp[m.uid] > 0) {
          run.hp[m.uid] = Math.min(st.hp, run.hp[m.uid] + Math.round(st.hp * 0.3));
          run.mp[m.uid] = Math.min(st.mp, run.mp[m.uid] + Math.round(st.mp * 0.3));
        }
      });
      return { type: 'rest' };
    }
    var cookies = useCookies(s, run), fx = TK.partyFx(s);
    var foesIds = bossStep ? [area.boss] : pickFoes(s, area, r);
    var foeLv = TK.floorLv(area.id, run.floor) + (bossStep ? 2 : 0);
    var foes = foesIds.map(function (id, k) {
      s.seen[id] = 1;
      var lv = Math.max(1, foeLv + (bossStep ? 0 : Math.floor(r() * 3) - 1));
      return TK.makeFoe(id, lv, TK.foeMul(area.id) * (bossStep ? TK.BOSS_MUL : 1), bossStep ? TK.bossHp(area.id) : 1);
    });
    var team = partyFighters(s, run);
    var result = TK.simulate(team, foes, { seed: (run.seed ^ (run.step * 48271)) >>> 0, tacticA: s.tactic, tacticB: 'ganga' });
    team.forEach(function (f, i) { run.hp[f.uid] = result.units[i].hp; run.mp[f.uid] = result.units[i].mp; });
    var out = { type: bossStep ? 'boss' : 'battle', team: team, foes: foes, result: result, cookies: cookies, won: result.winner === 0 };
    if (out.won) {
      var sum = foes.reduce(function (t, f) { return t + f.lv; }, 0) * (bossStep ? 4 : 1);
      var coin = Math.round((8 + sum * 2.2) * (0.9 + r() * 0.3));
      // 必要経験値の伸びに合わせて 後半の場所ほど多くもらえる
      var ax = awardXp(s, run, Math.round((4 + sum * 0.7) * (1 + area.id * 0.13) * (area.id >= 14 ? 1.5 : 1) * (1 + (fx.xp || 0) / 100)), foeLv);
      coin = Math.round(coin * (ax.lucky ? 1.15 : 1) * (1 + (fx.coin || 0) / 100));
      s.coins += coin; run.coins += coin;
      out.coins = coin; out.xp = ax.gain; out.ups = ax.ups;
      var firstClear = bossStep && !s.cleared[run.area];
      var pick = foesIds[Math.floor(r() * foesIds.length)], sp = TK.SPECIES[pick];
      // 場所のぬしとの戦いでは仲間にならない。歩いているぬしは 優先して声をかける
      if (!bossStep && TK.SPECIES[foesIds[0]].boss) pick = foesIds[0];
      var chance = 0.1 + (s.owned[pick] ? 0 : 0.2);
      if (!bossStep && r() < chance && TK.ranchCount(s) < TK.PRICE.ranchMax) {
        var isNew = !s.owned[pick];
        var inst = TK.addCreature(s, pick, Math.min(50, Math.max(1, foes[0].lv - 2)), r);
        run.recruits.push(inst.uid);
        out.recruit = inst; out.recruitNew = isNew;
      }
      if (r() < 0.12 * (1 + (fx.drop || 0) / 100)) {
        var d = TK.makeItem(s, area.lv, r);
        run.items.push(d.id);
        out.drop = d;
      }
      if (lastStep) {
        run.over = true; run.floorCleared = true;
        s.floors = s.floors || {};
        s.floors[run.area] = Math.max(TK.floorsDone(s, run.area), run.floor + 1);
      }
      if (bossStep) {
        run.cleared = true;
        out.firstClear = firstClear;
        if (firstClear) {
          s.cleared[run.area] = true;
          s.stamina.n = Math.min(TK.STAMINA.max, s.stamina.n + 3);
          s.cookies += 3;
        }
      }
    } else {
      // 全滅しても 手に入れたものは すべて持ち帰れる
      run.over = true; run.wiped = true;
    }
    return out;
  };
  TK.areaOpen = function (s, id) { return id === 0 || !!s.cleared[id - 1]; };

  TK.SAVE_KEY = 'tekuteku-creatures-save-v2';
  var IDB_NAME = 'tekuteku-creatures', IDB_STORE = 'save';
  function idb(mode, fn) {
    return new Promise(function (resolve) {
      // 応答しない環境でも 画面を止めない
      setTimeout(function () { resolve(null); }, 3000);
      try {
        var open = indexedDB.open(IDB_NAME, 1);
        open.onupgradeneeded = function () { open.result.createObjectStore(IDB_STORE); };
        open.onerror = function () { resolve(null); };
        open.onsuccess = function () {
          var db = open.result, tx = db.transaction(IDB_STORE, mode), req = fn(tx.objectStore(IDB_STORE));
          tx.oncomplete = function () { db.close(); resolve(req.result === undefined ? null : req.result); };
          tx.onerror = tx.onabort = function () { db.close(); resolve(null); };
        };
      } catch (e) { resolve(null); }
    });
  }
  // localStorage と IndexedDB の両方に書く。片方だけ消えても もう片方から戻せる
  TK.save = function (s) {
    s.savedAt = Date.now();
    var raw = JSON.stringify(s), ok = false;
    try { localStorage.setItem(TK.SAVE_KEY, raw); ok = true; } catch (e) { /* IndexedDB 側に残す */ }
    idb('readwrite', function (st) { return st.put(raw, TK.SAVE_KEY); });
    return ok;
  };
  function parseSave(raw) {
    try {
      var s = raw && JSON.parse(raw);
      if (!TK.validSave(s)) return null;
      TK.migrateSave(s);
      // 名前の決まりが変わっても 持っているそうびを揃える
      Object.keys(s.items).forEach(function (k) { var it = s.items[k]; if (it.base) it.name = TK.itemName(it); });
      return s;
    } catch (e) { return null; }
  }
  TK.load = function () {
    try { return parseSave(localStorage.getItem(TK.SAVE_KEY)); } catch (e) { return null; }
  };
  // 新しい方を採用する
  TK.loadBest = function () {
    var local = TK.load();
    return idb('readonly', function (st) { return st.get(TK.SAVE_KEY); }).then(function (raw) {
      var other = parseSave(raw);
      if (!local) return other;
      return other && (other.savedAt || 0) > (local.savedAt || 0) ? other : local;
    });
  };
  // ブラウザに「勝手に消さないで」と頼む。ユーザーの削除操作は止められない
  TK.requestPersist = function () {
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* 対応していない環境では何もしない */ }
  };
  // 読みこむデータは外から来るので 形を確かめる
  TK.validSave = function (s) {
    if (!s || (s.v !== 2 && s.v !== 3) || !Array.isArray(s.ranch) || !Array.isArray(s.party) || !s.items || !s.stamina) return false;
    return s.ranch.every(function (m) { return m && TK.SPECIES[m.sp] && m.g && m.eq && m.lv >= 1 && m.lv <= 100; });
  };
  // 層のなかった頃のセーブは、クリア済みの場所を全層クリアとして引きつぐ
  TK.migrateSave = function (s) {
    if (!s.shop) TK.refreshShop(s, TK.rng((s.seed + s.runs) >>> 0));
    // 廃止した追加効果を そうびから外す
    Object.keys(s.items).map(function (k) { return s.items[k]; }).concat(s.shop).forEach(function (it) {
      if (it.fx) it.fx = it.fx.filter(function (f) { return TK.ITEM_FX[f.k]; });
    });
    if (s.v >= 3) return s;
    s.floors = {};
    Object.keys(s.cleared).forEach(function (a) { s.floors[a] = TK.FLOORS; });
    s.v = 3;
    return s;
  };
  // 「データを消す」ボタンだけが呼ぶ
  TK.wipe = function () {
    try {
      localStorage.removeItem(TK.SAVE_KEY);
      localStorage.removeItem('tekuteku-creatures-replays-v1');
    } catch (e) { /* 保存できない環境では何もしない */ }
    return idb('readwrite', function (st) { return st.delete(TK.SAVE_KEY); });
  };

  // リプレイは容量が大きいので、セーブとは分けて新しい順に残す
})(window.TK);
