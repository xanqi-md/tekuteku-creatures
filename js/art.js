// クリーチャーと背景のオリジナルSVG。外部画像は使わない。
window.TK = window.TK || {};
(function (TK) {
  'use strict';

  var INK = '#232b52', SW = 3.4;
  // 属性ごとの配色セット [本体, 影, おなか, アクセント]。個体ごとに順番に選ぶ
  var PAL = {
    fire: [['#ff8a4c', '#e2602c', '#ffe3b8', '#ffd23f'], ['#ff6464', '#d93f4f', '#ffd9c7', '#ffb347'], ['#ffb03a', '#ee8a1c', '#fff0c2', '#ff5e4d']],
    water: [['#57bdf7', '#2f93dc', '#dff5ff', '#ffe27a'], ['#46d3d0', '#20a8ad', '#d8fbf2', '#ff9eb5'], ['#7a9bff', '#5475e0', '#e3e9ff', '#ffd76a']],
    thunder: [['#ffd84a', '#f0b41e', '#fff6c9', '#ff8a4c'], ['#ffc02e', '#e89a10', '#fff0b8', '#4fb6ff'], ['#d8e04a', '#b2bb25', '#f8fbc4', '#7a64e8']],
    earth: [['#c79a5e', '#a4763d', '#f5e4c3', '#6fce7c'], ['#9ec95e', '#78a53c', '#eef8c8', '#e8885a'], ['#d2a27a', '#ad7a54', '#f9e7d2', '#5cb6c9']],
    wind: [['#7bdca0', '#4fbd7e', '#e4fbea', '#ffd54a'], ['#a5e8c7', '#6fcfa2', '#f0fff6', '#ff97a8'], ['#8ee0e6', '#58c1cb', '#e6fcfd', '#ffc25c']],
    light: [['#fff0a0', '#f4d268', '#fffbe0', '#ff9ec2'], ['#ffd9ec', '#f7b0d0', '#fff5fa', '#ffd34d'], ['#d9f4ff', '#a8dcf2', '#f6fdff', '#ffb84d']],
    dark: [['#9477e6', '#6f52c6', '#e3dbff', '#ffd76a'], ['#6c6ea8', '#4c4e88', '#dcdef5', '#ff7f9f'], ['#b86ad6', '#9045b4', '#f4dcff', '#7bf0d3']]
  };

  function circle(x, y, r, fill, extra) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + fill + '" ' + (extra || '') + '/>'; }
  function ell(x, y, rx, ry, fill, extra) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + fill + '" ' + (extra || '') + '/>'; }
  function path(d, fill, extra) { return '<path d="' + d + '" fill="' + fill + '" ' + (extra || '') + '/>'; }
  var LINE = 'stroke="' + INK + '" stroke-width="' + SW + '" stroke-linejoin="round" stroke-linecap="round"';
  var THIN = 'stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"';

  function eyes(x, y, gap, style, size) {
    var s = size || 1, l = x - gap, r = x + gap, o = '';
    function round(cx) {
      return ell(cx, y, 6.2 * s, 7.4 * s, INK) + circle(cx + 1.8 * s, y - 2.8 * s, 2.5 * s, '#fff') + circle(cx - 1.6 * s, y + 3 * s, 1.2 * s, '#fff');
    }
    if (style === 0) o = round(l) + round(r);
    else if (style === 1) { // にっこり
      o = path('M' + (l - 6) + ' ' + (y + 2) + 'q6 -9 12 0', 'none', LINE) + path('M' + (r - 6) + ' ' + (y + 2) + 'q6 -9 12 0', 'none', LINE);
    } else if (style === 2) { // するどい
      o = round(l) + round(r) + path('M' + (l - 8) + ' ' + (y - 9) + 'l13 4', 'none', LINE) + path('M' + (r + 8) + ' ' + (y - 9) + 'l-13 4', 'none', LINE);
    } else if (style === 3) { // ねむそう
      o = ell(l, y, 6, 5, INK) + ell(r, y, 6, 5, INK) + circle(l + 2, y - 1, 1.8, '#fff') + circle(r + 2, y - 1, 1.8, '#fff') +
        path('M' + (l - 7) + ' ' + (y - 4) + 'h14', 'none', LINE) + path('M' + (r - 7) + ' ' + (y - 4) + 'h14', 'none', LINE);
    } else { // ひとつ目
      o = ell(x, y, 11, 11, '#fff', LINE) + ell(x, y + 1, 6, 6.6, INK) + circle(x + 2, y - 2, 2.2, '#fff');
    }
    return o;
  }
  function mouth(x, y, style) {
    if (style === 0) return path('M' + (x - 5) + ' ' + y + 'q5 6 10 0', 'none', THIN);
    if (style === 1) return path('M' + (x - 6) + ' ' + y + 'q6 10 12 0z', '#d94a5e', THIN);
    if (style === 2) return path('M' + (x - 5) + ' ' + (y + 1) + 'l3 3 2 -3 2 3 3 -3', 'none', THIN);
    return path('M' + (x - 3) + ' ' + y + 'h6', 'none', THIN);
  }
  function cheeks(x, y, gap) { return ell(x - gap, y, 5, 3, '#ff8fa3', 'opacity=".55"') + ell(x + gap, y, 5, 3, '#ff8fa3', 'opacity=".55"'); }
  function shine(x, y, rx, ry) { return ell(x, y, rx, ry, '#fff', 'opacity=".45"'); }

  // 頭のかざり。cx,cy は頭のてっぺん
  function acc(kind, cx, cy, c) {
    var a = c[3], m = c[1];
    switch (kind) {
      case 'leaf': return path('M' + cx + ' ' + (cy + 4) + 'q-18 -6 -14 -22q14 2 14 22z', '#6fce7c', LINE) + path('M' + cx + ' ' + (cy + 4) + 'q16 -8 14 -20q-14 2 -14 20z', '#8ee08e', LINE);
      case 'ears': return path('M' + (cx - 26) + ' ' + (cy + 12) + 'l-3 -24 22 12z', c[0], LINE) + path('M' + (cx + 26) + ' ' + (cy + 12) + 'l3 -24 -22 12z', c[0], LINE) + path('M' + (cx - 23) + ' ' + (cy + 6) + 'l-1 -10 9 5z', '#ffb3c1') + path('M' + (cx + 23) + ' ' + (cy + 6) + 'l1 -10 -9 5z', '#ffb3c1');
      case 'horn': return path('M' + (cx - 13) + ' ' + (cy + 6) + 'q-2 -18 -12 -22q16 -2 22 20z', a, LINE) + path('M' + (cx + 13) + ' ' + (cy + 6) + 'q2 -18 12 -22q-16 -2 -22 20z', a, LINE);
      case 'flame': return path('M' + cx + ' ' + (cy + 6) + 'c-14 -6 -12 -16 -6 -20c0 5 3 6 4 2c1 -7 5 -9 8 -12c-1 6 8 10 7 20c-1 6 -6 9 -13 10z', '#ff9a3d', LINE) + path('M' + cx + ' ' + (cy + 3) + 'c-5 -3 -4 -8 -1 -10c2 3 7 5 5 8c-1 2 -2 2 -4 2z', '#ffe27a');
      case 'crown': return path('M' + (cx - 17) + ' ' + (cy + 6) + 'l-3 -19 11 9 9 -14 9 14 11 -9 -3 19z', '#ffd23f', LINE) + circle(cx, cy - 1, 3, '#ff6b81', THIN);
      case 'antenna': return path('M' + (cx - 8) + ' ' + (cy + 5) + 'q-4 -14 -14 -17', 'none', LINE) + path('M' + (cx + 8) + ' ' + (cy + 5) + 'q4 -14 14 -17', 'none', LINE) + circle(cx - 22, cy - 13, 4.4, a, THIN) + circle(cx + 22, cy - 13, 4.4, a, THIN);
      case 'wing': return path('M' + (cx - 24) + ' ' + (cy + 24) + 'q-26 -8 -28 -28q14 2 34 14z', '#fff', LINE) + path('M' + (cx + 24) + ' ' + (cy + 24) + 'q26 -8 28 -28q-14 2 -34 14z', '#fff', LINE);
      case 'shell': return path('M' + (cx - 20) + ' ' + (cy + 9) + 'q20 -30 40 0q-20 -6 -40 0z', a, LINE) + path('M' + cx + ' ' + (cy - 6) + 'v9M' + (cx - 9) + ' ' + (cy - 2) + 'l3 7M' + (cx + 9) + ' ' + (cy - 2) + 'l-3 7', 'none', THIN);
      case 'spike': return path('M' + (cx - 22) + ' ' + (cy + 10) + 'l6 -18 7 13 9 -19 9 19 7 -13 6 18z', a, LINE);
      case 'bolt': return path('M' + (cx + 3) + ' ' + (cy - 20) + 'l-13 19h9l-4 15 15 -21h-10l6 -13z', '#ffd23f', LINE);
      case 'gear': return circle(cx, cy - 4, 10, '#c7cfdf', LINE + ' stroke-dasharray="6 3"') + circle(cx, cy - 4, 4, m, THIN);
      case 'drop': return path('M' + cx + ' ' + (cy - 18) + 'c-9 12 -11 16 -9 20c2 6 16 6 18 0c2 -4 0 -8 -9 -20z', '#7fd4ff', LINE);
      case 'star': return path('M' + cx + ' ' + (cy - 18) + 'l5.5 11 12 1.6 -8.8 8 2.3 12 -11 -6 -11 6 2.3 -12 -8.8 -8 12 -1.6z', '#ffd23f', LINE);
      case 'mush': return path('M' + (cx - 16) + ' ' + (cy + 5) + 'q16 -28 32 0z', '#ff7a7a', LINE) + circle(cx - 3, cy - 4, 2.6, '#fff') + circle(cx + 6, cy - 1, 2, '#fff');
      case 'bow': return path('M' + cx + ' ' + cy + 'l-15 -9v18zM' + cx + ' ' + cy + 'l15 -9v18z', a, LINE) + circle(cx, cy, 3.6, m, THIN);
      default: return '';
    }
  }

  // ロボットの目。形と色を変えて顔つきを分ける
  function visor(v) {
    var col = ['#7bf0ff', '#ff8fa3', '#ffe27a', '#9dffa8', '#ffb35c'][v.eye];
    if (v.mouth === 0) return circle(48, 46, 5, col) + circle(72, 46, 5, col);
    if (v.mouth === 1) return '<rect x="42" y="42" width="12" height="8" rx="2" fill="' + col + '"/><rect x="66" y="42" width="12" height="8" rx="2" fill="' + col + '"/>';
    if (v.mouth === 2) return '<rect x="40" y="43" width="40" height="6" rx="3" fill="' + col + '"/>';
    return path('M42 49q6 -9 12 0M66 49q6 -9 12 0', 'none', 'stroke="' + col + '" stroke-width="4" stroke-linecap="round"');
  }

  var BODIES = {
    blob: function (c, v) {
      return { top: [60, 28], html: path('M60 28c30 0 42 26 42 48c0 22 -18 30 -42 30s-42 -8 -42 -30c0 -22 12 -48 42 -48z', c[0], LINE) +
        path('M34 94c8 7 44 7 52 0c-4 -14 -48 -14 -52 0z', c[2]) + shine(42, 46, 9, 6) + eyes(60, 66, 15, v.eye) + cheeks(60, 77, 25) + mouth(60, 78, v.mouth) };
    },
    bird: function (c, v) {
      return { top: [60, 24], html: path('M22 62q-14 -6 -14 -20q16 0 26 12z', c[1], LINE) + path('M98 62q14 -6 14 -20q-16 0 -26 12z', c[1], LINE) +
        path('M47 100l-3 10h10M73 100l3 10h-10', 'none', 'stroke="#ff9a3d" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"') +
        ell(60, 66, 38, 40, c[0], LINE) + ell(60, 82, 24, 22, c[2]) + shine(44, 42, 8, 5) + eyes(60, 56, 15, v.eye) + path('M52 66l8 10 8 -10z', ['#ffb03a', '#ff8a4c', '#ffd23f', '#f2a0a0'][v.mouth], LINE) };
    },
    beast: function (c, v) {
      return { top: [60, 24], html: path('M94 82q18 2 16 -20q-3 12 -18 10z', c[1], LINE) +
        path('M30 92v14h14v-12M76 94v12h14v-14', c[1], LINE) +
        path('M26 82c0 -20 12 -30 34 -30s34 10 34 30c0 18 -14 22 -34 22s-34 -4 -34 -22z', c[0], LINE) + ell(60, 90, 19, 12, c[2]) +
        ell(60, 50, 32, 28, c[0], LINE) + ell(60, 60, 16, 12, c[2]) + shine(44, 34, 7, 4.5) + eyes(60, 46, 15, v.eye, 0.9) + ell(60, 55, 4, 3, INK) + mouth(60, 60, v.mouth) };
    },
    dragon: function (c, v) {
      return { top: [62, 20], html: path('M28 90q-22 6 -20 -18q6 10 22 6z', c[1], LINE) + path('M34 58q-22 -16 -22 -30q18 2 32 18z', c[3], LINE) + path('M88 58q22 -16 22 -30q-18 2 -32 18z', c[3], LINE) +
        path('M38 94v12h13v-10M70 96v10h13v-12', c[1], LINE) +
        path('M28 80c0 -18 14 -30 32 -30s34 12 34 30c0 18 -14 24 -34 24s-32 -6 -32 -24z', c[0], LINE) + path('M46 72q14 -6 28 0v28h-28z', c[2]) +
        ell(62, 44, 30, 25, c[0], LINE) + ell(62, 56, 20, 12, c[2], THIN) + circle(55, 54, 1.8, INK) + circle(69, 54, 1.8, INK) + shine(46, 30, 7, 4.5) + eyes(62, 39, 14, v.eye, 0.85) + mouth(62, 60, v.mouth) };
    },
    fish: function (c, v) {
      return { top: [54, 24], html: path('M92 66q24 -22 22 -26q2 18 -2 26q4 8 2 26q2 -4 -22 -26z', c[1], LINE) + path('M50 28q14 -14 28 2z', c[1], LINE) +
        ell(54, 66, 44, 36, c[0], LINE) + path('M18 76q36 26 72 0q-36 34 -72 0z', c[2]) + path('M62 52q20 6 6 22q-12 -8 -6 -22z', c[3], THIN) + shine(34, 46, 9, 5) + eyes(38, 60, 12, v.eye, 0.9) + mouth(36, 78, v.mouth) };
    },
    plant: function (c, v) {
      return { top: [60, 26], html: path('M60 104v8', 'none', LINE) + path('M24 106q36 -10 72 0l-6 8h-60z', '#a97c50', LINE) +
        path('M26 76q-16 -6 -18 -22q18 -4 28 12z', '#7bdca0', LINE) + path('M94 76q16 -6 18 -22q-18 -4 -28 12z', '#7bdca0', LINE) +
        path('M60 26c26 0 36 18 36 42s-14 38 -36 38s-36 -14 -36 -38s10 -42 36 -42z', c[0], LINE) + ell(60, 90, 18, 12, c[2]) + shine(44, 44, 7, 5) + eyes(60, 62, 14, v.eye) + cheeks(60, 74, 23) + mouth(60, 74, v.mouth) };
    },
    bug: function (c, v) {
      return { top: [60, 28], html: path('M24 92l-12 8M26 76l-14 2M96 92l12 8M94 76l14 2', 'none', LINE) +
        ell(60, 74, 40, 33, c[0], LINE) + path('M60 41v66', 'none', LINE) + circle(38, 66, 7, c[3], THIN) + circle(82, 66, 7, c[3], THIN) + circle(42, 88, 5, c[3], THIN) + circle(78, 88, 5, c[3], THIN) +
        ell(60, 44, 24, 19, c[2], LINE) + eyes(60, 42, 11, v.eye, 0.78) + mouth(60, 51, v.mouth) };
    },
    golem: function (c, v) {
      return { top: [60, 24], html: path('M22 62h-10q-6 16 2 30h14zM98 62h10q6 16 -2 30h-14z', c[1], LINE) + path('M36 100v10h16v-10M68 100v10h16v-10', c[1], LINE) +
        path('M30 34l28 -10 32 10 8 32 -6 36h-62l-8 -36z', c[0], LINE) + path('M40 86h40l-4 14h-32z', c[2]) + path('M36 42l12 -5M84 76l6 4M34 72l5 6', 'none', THIN) + eyes(60, 58, 15, v.eye) + mouth(60, 74, v.mouth) };
    },
    ghost: function (c, v) {
      return { top: [60, 22], html: path('M60 22c26 0 38 20 38 46v38l-12 -9 -13 11 -13 -11 -13 11 -13 -11 -12 9v-38c0 -26 12 -46 38 -46z', c[0], LINE + ' opacity=".94"') +
        path('M14 66q6 -8 12 -4M106 66q-6 -8 -12 -4', 'none', LINE) + shine(44, 42, 9, 6) + eyes(60, 60, 15, v.eye) + cheeks(60, 73, 25) + mouth(60, 74, v.mouth) };
    },
    robot: function (c, v) {
      return { top: [60, 22], html: path('M34 102v8h16v-8M70 102v8h16v-8', c[1], LINE) + path('M22 66h-8v22h8M98 66h8v22h-8', '#c7cfdf', LINE) +
        '<rect x="24" y="24" width="72" height="44" rx="11" fill="' + c[0] + '" ' + LINE + '/>' + '<rect x="30" y="66" width="60" height="38" rx="8" fill="' + c[1] + '" ' + LINE + '/>' +
        '<rect x="34" y="34" width="52" height="24" rx="7" fill="#2f3a6e" ' + THIN + '/>' + visor(v) + circle(42, 80, 3.4, c[3], THIN) + circle(52, 80, 3.4, '#fff', THIN) + path('M64 78h16M64 86h16M64 94h10', 'none', THIN) };
    },
    shroom: function (c, v) {
      return { top: [60, 16], html: path('M38 62h44l6 40q-28 12 -56 0z', c[2], LINE) +
        path('M12 64c0 -34 22 -48 48 -48s48 14 48 48c-20 10 -76 10 -96 0z', c[0], LINE) + circle(40, 40, 8, c[3], THIN) + circle(72, 32, 6, c[3], THIN) + circle(86, 52, 5, c[3], THIN) + eyes(60, 80, 12, v.eye, 0.85) + mouth(60, 92, v.mouth) };
    },
    serpent: function (c, v) {
      return { top: [68, 18], html: path('M18 98c0 -14 22 -18 40 -14c16 3 26 -2 24 -18', 'none', 'stroke="' + INK + '" stroke-width="26" stroke-linecap="round" fill="none"') +
        path('M18 98c0 -14 22 -18 40 -14c16 3 26 -2 24 -18', 'none', 'stroke="' + c[0] + '" stroke-width="19" stroke-linecap="round" fill="none"') +
        path('M24 95c4 -8 22 -11 36 -8', 'none', 'stroke="' + c[2] + '" stroke-width="6" stroke-linecap="round" fill="none"') +
        ell(68, 44, 32, 26, c[0], LINE) + ell(68, 56, 19, 11, c[2], THIN) + shine(52, 30, 7, 4.5) + eyes(68, 40, 14, v.eye, 0.85) + mouth(68, 58, v.mouth) };
    }
  };

  var cache = {}, looks = null;
  // ぬしは王冠をかぶらない
  function accOf(s) { return s.boss && s.acc === 'crown' ? 'none' : s.acc; }
  // 図鑑番号から顔と配色を決め、まったく同じ絵になる組み合わせは ずらして避ける
  function assignLooks() {
    var used = {};
    looks = TK.SPECIES.map(function (s) {
      var id = s.id, pal = (id + (id >> 3)) % 3, eye = s.boss ? 2 : [0, 0, 1, 3, 0, 2, 4][id % 7], m = id % 4;
      for (var n = 0; n < 12; n++) {
        var mouth = (m + n) % 4, p = (pal + Math.floor(n / 4)) % 3;
        var key = [s.body, s.theme, accOf(s), p, eye, mouth].join();
        if (!used[key]) { used[key] = 1; return { pal: p, eye: eye, mouth: mouth }; }
      }
      return { pal: pal, eye: eye, mouth: m };
    });
  }
  // 同じ体型でも 配色・目・口 が重ならないよう 図鑑番号から決める
  TK.creatureSvg = function (id) {
    if (cache[id]) return cache[id];
    if (!looks) assignLooks();
    var s = TK.SPECIES[id], c = PAL[s.theme][looks[id].pal];
    var v = looks[id];
    var b = BODIES[s.body](c, v);
    var kind = accOf(s), behind = kind === 'wing' || kind === 'ears';
    var deco = behind ? acc(kind, b.top[0], b.top[1], c) : '';
    var over = behind ? '' : acc(kind, b.top[0], b.top[1], c);
    cache[id] = '<svg viewBox="-8 -12 136 132" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      ell(60, 111, 40, 6, INK, 'opacity=".16"') + deco + b.html + over + '</svg>';
    return cache[id];
  };

  // --- 背景 ---
  // [空の上, 空の下, 遠景, 中景, 地面, 地面の線, 小物, 夜ならtrue]
  var SCENES = {
    meadow: ['#6fc8ff', '#d4f3ff', '#a8e3a0', '#7fd07a', '#8ed868', '#5fb44c', 'tree', 0],
    forest: ['#79d0b4', '#e6f7c8', '#5fb384', '#3f9a6c', '#7cc55c', '#4f9a3f', 'pine', 0],
    beach: ['#5fd0ff', '#e3fbff', '#7fdcf5', '#3fbfe8', '#fbe3a4', '#e2bb6c', 'palm', 0],
    spa: ['#ffb6a0', '#ffe9c4', '#d8a890', '#b98a78', '#c7b49a', '#9a8670', 'steam', 0],
    mine: ['#3a3660', '#6b5a7e', '#544a70', '#463c60', '#8a7360', '#62503f', 'gear', 1],
    hill: ['#1c2360', '#5a4f9e', '#3a3a80', '#2f3070', '#4a6a8a', '#2f4c6a', 'star', 1],
    lake: ['#8ad8ff', '#fdf6d8', '#a6dcc0', '#7fcfd8', '#5ec6e8', '#3aa2cc', 'reed', 0],
    desert: ['#ffcb6b', '#fff0c0', '#f5c470', '#eaa850', '#f7d48a', '#d8a858', 'cactus', 0],
    grave: ['#5a3f7e', '#f09a7a', '#4f3a6e', '#3a2c58', '#5a4f6a', '#3f3550', 'grave', 1],
    ice: ['#a0dcff', '#effbff', '#d0efff', '#b4e4fa', '#e8f8ff', '#b4dcef', 'ice', 0],
    storm: ['#4a5a8c', '#9fb0c8', '#6a7a9c', '#54648a', '#7a9a78', '#587a5c', 'bolt', 1],
    castle: ['#3e3a66', '#8a6f9e', '#544c7a', '#3f3862', '#6a6480', '#4c4664', 'tower', 1],
    lava: ['#4a1e2e', '#d8552c', '#6a2a30', '#4e1e28', '#3f2a32', '#ff7a3a', 'rock', 1],
    sky: ['#69c6ff', '#fff2fa', '#ffffff', '#f0f7ff', '#e6f3ff', '#bcdcf7', 'cloud', 0],
    sea: ['#123e7a', '#2fa6c8', '#1a5a90', '#144878', '#2f7fa2', '#1e5f80', 'coral', 1],
    city: ['#2a2358', '#c0569e', '#3e3478', '#2e2860', '#4a4a70', '#32325a', 'neon', 1],
    tree: ['#8fd8a8', '#f4f7c8', '#6cbc84', '#4f9f6c', '#88c868', '#5e9e4a', 'mush', 0],
    volcano: ['#2a1a2e', '#a83a2a', '#3a2230', '#2a1a26', '#3a2c32', '#ff6a2a', 'rock', 1],
    aurora: ['#10245a', '#3fc8a8', '#2a3a7a', '#1e2c64', '#dceeff', '#a8c8e8', 'ice', 1],
    space: ['#0c0f38', '#3c2a7e', '#1a1c58', '#141648', '#2a2460', '#5a4aa0', 'star', 1],
    flower: ['#ffc4e0', '#fff4c8', '#ffd0a8', '#f2a8c8', '#b8e08a', '#8cc060', 'mush', 0],
    mirage: ['#ffb06a', '#ffeec0', '#f0c080', '#d8a070', '#f2cf8e', '#cfa35c', 'tower', 0],
    palace: ['#9ab4f0', '#eaf4ff', '#c8d8f8', '#a8c0ec', '#dcebff', '#a8c2e6', 'tower', 0],
    canyon: ['#7a6a9c', '#f0b890', '#a0725c', '#7e5848', '#b08a68', '#7e6048', 'bolt', 1],
    darkwood: ['#101f30', '#3a5a5a', '#1a3a3a', '#142e30', '#2a4a3a', '#1a3428', 'pine', 1],
    ember: ['#5a1c1c', '#ffae5c', '#7a2c24', '#5a2020', '#6a4438', '#ffa04a', 'tower', 1],
    float: ['#8ad8ff', '#fff6e0', '#c8f0d8', '#a0e4c4', '#a8e088', '#74bc60', 'cloud', 0],
    deep: ['#0a2850', '#2878a8', '#123c68', '#0e3058', '#1e5a78', '#144860', 'coral', 1],
    timegap: ['#2c1c5c', '#e08cd0', '#4a2c80', '#3a2268', '#6a5a9c', '#4c3e7c', 'gear', 1],
    origin: ['#1a1046', '#ff9a7a', '#3a2070', '#2a1858', '#5a3a7a', '#ffc86a', 'star', 1],
    amber: ['#4a2c1a', '#e0a040', '#6a4024', '#54321c', '#a8743c', '#7a5228', 'rock', 1],
    upside: ['#7ae0c0', '#f8e0ff', '#6ac0a8', '#4fa890', '#9ad080', '#6aa858', 'pine', 0],
    mistport: ['#9aa8b8', '#e8eef0', '#b8c4cc', '#98a8b4', '#8a9aa8', '#64788a', 'reed', 0],
    toyland: ['#ff9ac0', '#ffe8a8', '#8ad8f0', '#ffb0d0', '#ffd870', '#e8a840', 'gear', 0],
    dragonbed: ['#6a3a5a', '#f8a870', '#80485a', '#603848', '#8a6a58', '#5e463c', 'rock', 1],
    rainbow: ['#78d8f8', '#fff8d0', '#90e8c0', '#60c8e0', '#70d8f0', '#40a8d0', 'cloud', 0],
    bonefield: ['#c8a8a0', '#f8e8d0', '#d8c8b8', '#b8a898', '#e8dcc8', '#b8a890', 'grave', 0],
    dreamback: ['#3a2a78', '#e0a0e8', '#5a3a90', '#482c78', '#7a58a8', '#583c88', 'mush', 1],
    stardust: ['#0a1440', '#4a6ad0', '#18286a', '#101e58', '#3050a0', '#a0c0ff', 'star', 1],
    forever: ['#fff0b0', '#ffb8d0', '#ffd8a0', '#f8b8b0', '#f0e0c0', '#d0a880', 'tree', 0]
  };
  function hills(w, h, base, amp, n, fill) {
    var d = 'M0 ' + h + 'L0 ' + base, k = 2 * Math.PI * n / w, k2 = 2 * Math.PI * (n * 2 + 1) / w;
    for (var x = 0; x <= w; x += 20) d += 'L' + x + ' ' + (base - Math.sin(x * k) * amp - Math.sin(x * k2) * amp * 0.3).toFixed(1);
    return '<path d="' + d + 'L' + w + ' ' + h + 'z" fill="' + fill + '"/>';
  }
  var S2 = 'stroke="' + INK + '" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"';
  function prop(kind, x, y, sc) {
    var b = '';
    switch (kind) {
      case 'tree': b = '<rect x="-6" y="-34" width="12" height="36" fill="#a9754a" ' + S2 + '/>' + circle(0, -56, 28, '#6cc96a', S2) + circle(-20, -42, 18, '#58b85c', S2) + circle(20, -42, 18, '#7fd77a', S2); break;
      case 'pine': b = '<rect x="-5" y="-22" width="10" height="24" fill="#8e6240" ' + S2 + '/>' + path('M0 -90l26 40h-14l20 30h-64l20 -30h-14z', '#3f9e72', S2); break;
      case 'palm': b = path('M-5 2q2 -40 10 -70l7 2q-6 34 -5 68z', '#b58a54', S2) + path('M6 -70q-30 -18 -46 4q24 -8 46 -4zM6 -70q30 -20 48 6q-26 -12 -48 -6zM6 -70q-10 -26 -32 -24q18 8 32 24zM6 -70q12 -26 34 -22q-20 8 -34 22z', '#4fc48a', S2); break;
      case 'steam': b = path('M-16 0q-6 -18 8 -22q10 -2 24 2q10 6 2 20z', '#8d8496', S2) + path('M-6 -30q-10 -14 2 -24q10 -12 0 -24M12 -30q-8 -12 2 -22', 'none', 'stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".7"'); break;
      case 'gear': b = circle(0, -28, 24, '#a9a6bf', S2 + ' stroke-dasharray="11 5"') + circle(0, -28, 10, '#6c678c', S2); break;
      case 'star': b = path('M0 -60l6 13 14 2 -10 10 2 14 -12 -7 -12 7 2 -14 -10 -10 14 -2z', '#ffe27a', S2); break;
      case 'reed': b = path('M0 2q-4 -30 2 -58M12 2q4 -24 -2 -44', 'none', 'stroke="#4f8f5a" stroke-width="5" stroke-linecap="round"') + ell(2, -62, 5, 12, '#a9754a', S2); break;
      case 'cactus': b = path('M-10 2v-62q10 -14 20 0v62zM-10 -24h-14v-20q6 -8 11 0v8h3zM10 -34h14v-16q-6 -8 -11 0v4h-3z', '#5cb86a', S2); break;
      case 'grave': b = path('M-20 2v-40q20 -26 40 0v40z', '#8d88a4', S2) + path('M0 -36v20M-8 -28h16', 'none', S2); break;
      case 'ice': b = path('M-26 2l10 -60 14 26 12 -40 16 74z', '#c4efff', S2) + path('M-12 -30l6 16M12 -36l4 18', 'none', 'stroke="#fff" stroke-width="4" stroke-linecap="round"'); break;
      case 'bolt': b = path('M-20 -90h50l-16 26h22l-44 64 10 -46h-22z', '#ffd84a', S2); break;
      case 'tower': b = path('M-26 2v-84h10v10h10v-10h12v10h10v-10h10v84z', '#7a7296', S2) + '<rect x="-7" y="-58" width="14" height="22" rx="7" fill="#ffd76a" ' + S2 + '/>'; break;
      case 'rock': b = path('M-30 2l10 -30 22 -14 22 16 8 28z', '#5a4650', S2) + path('M-8 -14l6 10 8 -8', 'none', 'stroke="#ff8a3a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"'); break;
      case 'cloud': b = circle(-22, -22, 18, '#fff', S2) + circle(6, -32, 24, '#fff', S2) + circle(30, -20, 15, '#fff', S2) + ell(4, -11, 44, 13, '#fff', S2); break;
      case 'coral': b = path('M0 2v-34M0 -18q-20 -4 -20 -24M0 -24q18 -2 20 -28M-20 -42q-6 -6 -4 -14', 'none', 'stroke="' + INK + '" stroke-width="12" stroke-linecap="round" fill="none"') + path('M0 2v-34M0 -18q-20 -4 -20 -24M0 -24q18 -2 20 -28M-20 -42q-6 -6 -4 -14', 'none', 'stroke="#ff8fa3" stroke-width="7" stroke-linecap="round" fill="none"'); break;
      case 'neon': b = '<rect x="-24" y="-96" width="48" height="98" fill="#3f3a7c" ' + S2 + '/>' + '<rect x="-14" y="-84" width="12" height="12" fill="#7bf0ff"/><rect x="4" y="-84" width="12" height="12" fill="#ff8fd0"/><rect x="-14" y="-62" width="12" height="12" fill="#ffe27a"/><rect x="4" y="-62" width="12" height="12" fill="#7bf0ff"/><rect x="-14" y="-40" width="12" height="12" fill="#ff8fd0"/><rect x="4" y="-40" width="12" height="12" fill="#ffe27a"/>'; break;
      case 'mush': b = '<rect x="-8" y="-24" width="16" height="26" rx="5" fill="#fff2d8" ' + S2 + '/>' + path('M-30 -22q30 -44 60 0z', '#ff7a7a', S2) + circle(-8, -32, 5, '#fff') + circle(10, -30, 4, '#fff'); break;
    }
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ')">' + b + '</g>';
  }
  function svgUrl(w, h, body) {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' + body + '</svg>';
    return "url('data:image/svg+xml," + encodeURIComponent(svg).replace(/'/g, '%27') + "')";
  }
  var bgCache = {};
  // 継ぎ目なくループする3層を返す
  TK.sceneLayers = function (name) {
    if (bgCache[name]) return bgCache[name];
    var c = SCENES[name], w = 1200, h = 360, r = TK.rng(TK.hashStr(name)), i, far = hills(w, h, 190, 34, 2, c[2]), mid = hills(w, h, 232, 22, 3, c[3]);
    if (c[7]) for (i = 0; i < 46; i++) far = circle(Math.round(r() * w), Math.round(r() * 150), (r() * 1.6 + 0.7).toFixed(1), '#fff', 'opacity="' + (0.4 + r() * 0.6).toFixed(2) + '"') + far;
    var props = '';
    for (i = 0; i < 6; i++) props += prop(c[6], Math.round(60 + i * 200 + r() * 70), 266 + Math.round(r() * 8), (0.72 + r() * 0.4).toFixed(2));
    var ground = '<rect y="262" width="' + w + '" height="98" fill="' + c[4] + '"/><path d="M0 262h' + w + '" stroke="' + c[5] + '" stroke-width="6"/>';
    for (i = 0; i < 26; i++) ground += ell(Math.round(r() * w), 282 + Math.round(r() * 70), 10 + Math.round(r() * 16), 3, c[5], 'opacity=".55"');
    return (bgCache[name] = { sky: 'linear-gradient(180deg,' + c[0] + ',' + c[1] + ')', far: svgUrl(w, h, far), mid: svgUrl(w, h, mid + props), ground: svgUrl(w, h, ground), night: !!c[7] });
  };
  // 地図: 20か所を小さなジオラマとして並べ、線路でつなぐ。pos は % 座標
  TK.mapSvg = function (areas, pos, isOpen) {
    var W = 1000, H = Math.ceil(areas.length / 5) * 153.4, tiles = '', names = '', pts = [];
    areas.forEach(function (a, i) {
      var c = SCENES[a.bg], X = pos(i)[0] * 10, Y = pos(i)[1] * H / 100, x = X - 88, y = Y - 62, r = TK.rng(i + 3);
      pts.push(X + ' ' + Y);
      var open = isOpen(i), inner = '<rect x="' + x + '" y="' + y + '" width="176" height="124" fill="' + c[1] + '"/><rect x="' + x + '" y="' + y + '" width="176" height="44" fill="' + c[0] + '" opacity=".75"/>' +
        hillsAt(x, y + 72, 176, 52, c[3]) + '<rect x="' + x + '" y="' + (y + 88) + '" width="176" height="36" fill="' + c[4] + '"/>' +
        prop(c[6], x + 34, y + 92, 0.46 + r() * 0.12) + prop(c[6], x + 146, y + 90, 0.42 + r() * 0.12);
      tiles += '<clipPath id="mt' + i + '"><rect x="' + x + '" y="' + y + '" width="176" height="124" rx="20"/></clipPath>' +
        '<g' + (open ? '' : ' class="maplock"') + '><g clip-path="url(#mt' + i + ')">' + inner + '</g><rect x="' + x + '" y="' + y + '" width="176" height="124" rx="20" fill="none" ' + S2 + '/></g>' +
        '';
      if (open) names += '<text x="' + X + '" y="' + (y + 116) + '" text-anchor="middle" class="mapname">' + a.name + '</text>';
    });
    var line = 'M' + pts.join(' L');
    return '<svg class="rail" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' + tiles +
      '<path d="' + line + '" fill="none" stroke="' + INK + '" stroke-width="13" stroke-linejoin="round"/><path d="' + line + '" fill="none" stroke="#fff" stroke-width="6" stroke-dasharray="11 9"/>' + names + '</svg>';
  };
  function hillsAt(x, y, w, h, fill) {
    return '<path d="M' + x + ' ' + (y + h) + 'V' + (y + 12) + 'Q' + (x + w * 0.25) + ' ' + (y - 14) + ' ' + (x + w * 0.5) + ' ' + (y + 8) + 'T' + (x + w) + ' ' + (y + 4) + 'V' + (y + h) + 'z" fill="' + fill + '"/>';
  }
  TK.sceneThumb = function (name) { var c = SCENES[name]; return 'linear-gradient(180deg,' + c[0] + ' 0 45%,' + c[1] + ' 60%,' + c[3] + ' 60% 74%,' + c[4] + ' 74%)'; };

  var ICONS = {
    adv: '<path d="M4 20l6 -14 5 8 3 -4 4 10z"/>', mon: '<circle cx="12" cy="13" r="8"/><circle cx="9" cy="12" r="1.5" fill="#232b52"/><circle cx="15" cy="12" r="1.5" fill="#232b52"/>',
    bag: '<path d="M6 8h12l2 12h-16zM9 8v-2a3 3 0 0 1 6 0v2"/>', mix: '<path d="M12 21s-8 -5 -8 -11a4.5 4.5 0 0 1 8 -3a4.5 4.5 0 0 1 8 3c0 6 -8 11 -8 11z"/>',
    friend: '<path d="M6 4h12v5a6 6 0 0 1 -12 0zM12 15v4M8 20h8"/>', dict: '<path d="M12 6c-3 -2 -6 -2 -9 -1v14c3 -1 6 -1 9 1c3 -2 6 -2 9 -1v-14c-3 -1 -6 -1 -9 1zM12 6v14"/>', dex: '<path d="M5 4h12a2 2 0 0 1 2 2v14h-12a2 2 0 0 1 -2 -2zM9 8h6M9 12h6"/>', help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4 -1 .8 -1 1.7M12 17h.01"/>'
  };
  TK.icon = function (k) { return '<svg viewBox="0 0 24 24" fill="currentColor" stroke="#232b52" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">' + ICONS[k] + '</svg>'; };
})(window.TK);
