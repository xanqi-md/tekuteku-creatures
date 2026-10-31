// 属性・とくぎ・とくせい・役割・そうびの定義
window.TK = window.TK || {};

TK.ELEMENTS = ['fire', 'water', 'thunder', 'earth', 'wind', 'light', 'dark'];
TK.EL_NAME = { fire: '火', water: '水', thunder: '雷', earth: '地', wind: '風', light: '光', dark: '闇' };
// 属性つきそうびの接頭辞
TK.EL_PREFIX = { fire: 'あかい', water: 'あおい', wind: 'みどりの', earth: 'ちゃいろい', thunder: 'きいろい', light: 'きんの', dark: 'くろい' };
TK.EL_COLOR = {
  fire: '#ff7a45', water: '#3fa9f5', thunder: '#ffc62e', earth: '#b98a4e',
  wind: '#62cf8a', light: '#ffe27a', dark: '#8a64d6'
};

// 耐性は5段階。とても強い=1/3、強い=1/2、ふつう=1、弱い=2、とても弱い=3 倍
TK.RES_STEPS = [
  { name: 'とても強い', mult: 1 / 3, short: '◎' },
  { name: '強い', mult: 1 / 2, short: '○' },
  { name: 'ふつう', mult: 1, short: '－' },
  { name: '弱い', mult: 2, short: '△' },
  { name: 'とても弱い', mult: 3, short: '×' }
];

TK.STATS = ['hp', 'mp', 'atk', 'def', 'mag', 'spd'];
TK.STAT_NAME = { hp: 'HP', mp: 'MP', atk: 'こうげき', def: 'しゅび', mag: 'まりょく', spd: 'すばやさ' };

TK.GROWTH = [
  { name: '伸びにくい', mult: 0.82 },
  { name: 'ふつう', mult: 1 },
  { name: '伸びやすい', mult: 1.18 }
];

TK.ROLES = {
  balance: { name: 'オールラウンダー', hp: 1.1, mp: 0.9, atk: 1.15, def: 1.05, mag: 1.15, spd: 0.95 },
  tank: { name: 'かべ役', hp: 1.5, mp: 0.8, atk: 0.85, def: 1.6, mag: 0.6, spd: 0.55 },
  bruiser: { name: 'パワー型', hp: 1.25, mp: 0.6, atk: 1.55, def: 1.05, mag: 0.5, spd: 0.85 },
  mage: { name: 'まほう型', hp: 0.8, mp: 1.5, atk: 0.45, def: 0.7, mag: 1.7, spd: 1.05 },
  healer: { name: 'かいふく型', hp: 1.05, mp: 1.5, atk: 0.5, def: 0.95, mag: 1.3, spd: 0.8 },
  speed: { name: 'すばやさ型', hp: 0.8, mp: 0.8, atk: 1.2, def: 0.7, mag: 0.8, spd: 1.8 },
  glass: { name: 'いちげき型', hp: 0.6, mp: 1, atk: 1.75, def: 0.5, mag: 1.45, spd: 1.35 },
  support: { name: 'サポート型', hp: 0.95, mp: 1.6, atk: 0.55, def: 0.8, mag: 1.05, spd: 1.45 }
};

// 属性別とくぎ名: [単体まほう, 全体まほう, 強力まほう, 物理]
TK.EL_SKILLS = {
  fire: ['ひのこ', 'ほのおのうず', 'ごうかだん', 'もえるキック'],
  water: ['しずくだん', 'おおなみ', 'ふんすいほう', 'みずのムチ'],
  thunder: ['ぴりぴり', 'らいうん', 'いかずちのやり', 'でんげきパンチ'],
  earth: ['いしつぶて', 'じならし', 'がんせきおとし', 'どろんこアタック'],
  wind: ['かまいたち', 'たつまき', 'あらしのつばさ', 'しっぷうげり'],
  light: ['ひかりのたま', 'オーロラカーテン', 'せいなるひかり', 'きらめきタックル'],
  dark: ['かげのつぶて', 'よるのとばり', 'やみのほうこう', 'シャドウクロー']
};

// 属性別とくぎ名の続き: [2回まほう, どく, しびれ, しゅび下げ, 全体物理, 2回物理, 捨て身, 吸収, 大わざ]
TK.EL_SKILLS2 = {
  fire: ['れんぞくひのこ', 'じりじりのほのお', 'めくらましのひ', 'とかしのほのお', 'かえんなぎ', 'ほのおのれんげき', 'すてみのほのお', 'ほのおのすいあげ', 'だいばくえん'],
  water: ['あめあられ', 'どくのしずく', 'しびれのしぶき', 'ふやかしのみず', 'みずしぶきなぎ', 'みずのれんげき', 'すてみのおおなみ', 'うるおいのしずく', 'だいこうずい'],
  thunder: ['らいめいれんさ', 'びりびりのさび', 'かなしばりのいかずち', 'くずしのいなずま', 'らいげきなぎ', 'でんげきれんだ', 'すてみのいかずち', 'じゅうでんのいなずま', 'だいらくらい'],
  earth: ['つぶてのあめ', 'どろどろのつぶて', 'あしどめのいわ', 'ひびわれのいわ', 'だいちなぎ', 'いわのれんげき', 'すてみのがんせき', 'だいちのめぐみ', 'だいじしん'],
  wind: ['れんぞくかまいたち', 'くされのかぜ', 'めまいのかぜ', 'けずりのかぜ', 'せんぷうなぎ', 'つむじのれんげき', 'すてみのとっぷう', 'いきふきのかぜ', 'だいぼうふう'],
  light: ['ひかりのつぶて', 'やきつけのひかり', 'くらましのひかり', 'あばきのひかり', 'ひかりのなぎ', 'ひかりのれんげき', 'すてみのせんこう', 'めぐみのひかり', 'だいせんこう'],
  dark: ['かげのれんだん', 'のろいのつぶて', 'かなしばりのかげ', 'むしばみのやみ', 'やみのなぎ', 'かげのれんげき', 'すてみのやみ', 'いのちすいのやみ', 'だいくうきょ']
};

// kind: phys/mag/heal/buff/debuff/poison/stun  target: one/all/self/ally/allies
// 追加の効果: drain 吸収 / recoil 反動 / ignore しゅびをむし / critUp 会心 / addPoison・addStun 状態異常 / lower 相手の能力下げ
TK.SKILLS = {
  basic: { name: 'たいあたり', kind: 'phys', pow: 1, mp: 0, target: 'one' },
  mag1: { name: 'まりょくだん', kind: 'mag', pow: 0.95, mp: 3, target: 'one' },
  mag2: { name: 'まりょくのうず', kind: 'mag', pow: 0.68, mp: 8, target: 'all' },
  heavy: { name: 'つよいいちげき', kind: 'phys', pow: 1.5, mp: 4, target: 'one' },
  multi: { name: 'れんぞくアタック', kind: 'phys', pow: 0.75, mp: 5, target: 'one', hits: 2 },
  sweep: { name: 'なぎはらい', kind: 'phys', pow: 0.75, mp: 6, target: 'all' },
  power: { name: 'ちからいっぱい', kind: 'phys', pow: 2.2, mp: 10, target: 'one' },
  triple: { name: 'みだれうち', kind: 'phys', pow: 0.5, mp: 7, target: 'one', hits: 3 },
  pierceHit: { name: 'つらぬきづき', kind: 'phys', pow: 1.1, mp: 5, target: 'one', ignore: 0.5 },
  critHit: { name: 'ねらいうち', kind: 'phys', pow: 0.9, mp: 5, target: 'one', critUp: 0.4 },
  drainHit: { name: 'すいとりアタック', kind: 'phys', pow: 0.8, mp: 6, target: 'one', drain: 0.4 },
  healbig: { name: 'おおいなるいやし', kind: 'heal', pow: 1.7, mp: 10, target: 'ally' },
  healall2: { name: 'いのちのうた', kind: 'heal', pow: 0.85, mp: 15, target: 'allies' },
  selfatk: { name: 'ふるいたつ', kind: 'buff', stat: 'atk', amt: 0.6, mp: 4, target: 'self' },
  guardall: { name: 'みんなをまもる', kind: 'buff', stat: 'def', amt: 0.45, mp: 9, target: 'allies' },
  downspd: { name: 'あしどめのこな', kind: 'debuff', stat: 'spd', amt: 0.3, mp: 5, target: 'all' },
  downmag: { name: 'まほうふうじ', kind: 'debuff', stat: 'mag', amt: 0.3, mp: 5, target: 'all' },
  heal: { name: 'いやしのうた', kind: 'heal', pow: 1, mp: 5, target: 'ally' },
  healall: { name: 'みんなげんき', kind: 'heal', pow: 0.55, mp: 9, target: 'allies' },
  recover: { name: 'ひとやすみ', kind: 'heal', pow: 1.3, mp: 5, target: 'self' },
  upatk: { name: 'ちからのうた', kind: 'buff', stat: 'atk', amt: 0.3, mp: 6, target: 'allies' },
  updef: { name: 'まもりのうた', kind: 'buff', stat: 'def', amt: 0.3, mp: 6, target: 'allies' },
  upmag: { name: 'まほうのうた', kind: 'buff', stat: 'mag', amt: 0.3, mp: 6, target: 'allies' },
  upspd: { name: 'はやあしのうた', kind: 'buff', stat: 'spd', amt: 0.35, mp: 5, target: 'allies' },
  guard: { name: 'てっぺきのかまえ', kind: 'buff', stat: 'def', amt: 0.6, mp: 4, target: 'self' },
  downatk: { name: 'よわよわのこな', kind: 'debuff', stat: 'atk', amt: 0.25, mp: 5, target: 'all' },
  downdef: { name: 'よろいくだき', kind: 'debuff', stat: 'def', amt: 0.3, mp: 5, target: 'all' },
  poison: { name: 'どくのこな', kind: 'poison', chance: 0.65, mp: 6, target: 'all' },
  stun: { name: 'しびれのこな', kind: 'stun', chance: 0.55, mp: 6, target: 'one' }
};
TK.ELEMENTS.forEach(function (el) {
  var n = TK.EL_SKILLS[el];
  TK.SKILLS[el + '1'] = { name: n[0], kind: 'mag', el: el, pow: 1, mp: 3, target: 'one' };
  TK.SKILLS[el + '2'] = { name: n[1], kind: 'mag', el: el, pow: 0.72, mp: 8, target: 'all' };
  TK.SKILLS[el + '3'] = { name: n[2], kind: 'mag', el: el, pow: 1.6, mp: 9, target: 'one' };
  TK.SKILLS[el + 'P'] = { name: n[3], kind: 'phys', el: el, pow: 1.2, mp: 3, target: 'one' };
  var m = TK.EL_SKILLS2[el];
  TK.SKILLS[el + '5'] = { name: m[0], kind: 'mag', el: el, pow: 0.55, mp: 5, target: 'one', hits: 2 };
  TK.SKILLS[el + '6'] = { name: m[1], kind: 'mag', el: el, pow: 0.8, mp: 5, target: 'one', addPoison: 0.3 };
  TK.SKILLS[el + '7'] = { name: m[2], kind: 'mag', el: el, pow: 0.8, mp: 6, target: 'one', addStun: 0.2 };
  TK.SKILLS[el + '8'] = { name: m[3], kind: 'mag', el: el, pow: 0.85, mp: 6, target: 'one', lower: 0.2 };
  TK.SKILLS[el + '9'] = { name: m[4], kind: 'phys', el: el, pow: 0.7, mp: 7, target: 'all' };
  TK.SKILLS[el + 'A'] = { name: m[5], kind: 'phys', el: el, pow: 0.62, mp: 5, target: 'one', hits: 2 };
  TK.SKILLS[el + 'B'] = { name: m[6], kind: 'phys', el: el, pow: 1.9, mp: 7, target: 'one', recoil: 0.15 };
  TK.SKILLS[el + 'C'] = { name: m[7], kind: 'mag', el: el, pow: 0.8, mp: 7, target: 'one', drain: 0.3 };
  TK.SKILLS[el + 'D'] = { name: m[8], kind: 'mag', el: el, pow: 2.2, mp: 16, target: 'one' };
});

// 役割ごとのおぼえるとくぎ。$ と % は体ごとに決まる わざの属性。[おぼえるレベル, id]
TK.KITS = {
  balance: [[1, 'basic'], [1, 'mag1'], [9, 'heal'], [18, '$P'], [32, '%2'], [46, 'upspd']],
  tank: [[1, 'basic'], [1, 'guard'], [10, '$P'], [22, 'recover'], [34, 'updef'], [48, 'heavy']],
  bruiser: [[1, 'basic'], [1, '$P'], [10, 'heavy'], [22, 'sweep'], [34, 'upatk'], [48, 'downdef']],
  mage: [[1, 'basic'], [1, '$1'], [10, 'mag2'], [24, '%3'], [36, 'upmag'], [50, 'downdef']],
  healer: [[1, 'basic'], [1, 'heal'], [8, 'mag1'], [20, 'healall'], [34, 'updef'], [48, '$2']],
  speed: [[1, 'basic'], [1, '$P'], [10, 'multi'], [22, 'upspd'], [34, '%1'], [46, 'downatk']],
  glass: [[1, 'basic'], [1, '$P'], [8, 'mag1'], [20, 'heavy'], [32, '%3'], [46, '$2']],
  support: [[1, 'basic'], [1, 'upatk'], [8, 'mag1'], [18, 'poison'], [30, 'stun'], [42, 'upmag'], [52, 'downatk']]
};

// 役割の型に加えて、体ごとに2つ ここから おぼえる(レベルは TK.kitOf が決める)
TK.KIT_POOL = {
  balance: ['$5', '%9', '$A', 'selfatk', 'critHit', 'drainHit', '$6', '%8', 'healbig', '%C'],
  tank: ['guardall', '$9', '%C', 'downspd', 'drainHit', '$7', '$B', '%8'],
  bruiser: ['power', '$A', '%B', '$9', 'selfatk', 'pierceHit', 'triple', '%6'],
  mage: ['$D', '%5', '%C', '$6', '%7', 'downmag', '$8', '%D'],
  healer: ['healbig', 'healall2', '%C', 'guardall', '$5', 'downmag', '$8', '%6'],
  speed: ['triple', '$A', '%A', 'critHit', 'pierceHit', '$7', 'downspd', '%9'],
  glass: ['$D', '%B', 'power', 'critHit', '$5', '%9', 'pierceHit', '%D', '$B'],
  support: ['downspd', 'downmag', 'guardall', '$6', '%7', '$8', 'healbig', '%5', '$7']
};

TK.TRAITS = {
  sente: { name: 'せんて', desc: '1ターン目だけ すばやさ 1.6倍' },
  counter: { name: 'はんげき', desc: '物理攻撃を受けると 30%で なぐり返す' },
  drain: { name: 'きゅうけつ', desc: '与えた物理ダメージの 20%を回復' },
  regen: { name: 'さいせい', desc: '毎ターン 最大HPの 6%回復' },
  thorns: { name: 'トゲのからだ', desc: '物理攻撃の相手に 受けたダメージの 20%を返す' },
  guts: { name: 'ふんばり', desc: '一度だけ HP1で たえる' },
  crit: { name: 'かいしん', desc: '会心の一撃が 25%で出る' },
  magicboost: { name: 'まりょく集中', desc: 'まほう威力 +25%、物理で受けるダメージ +15%' },
  elboost: { name: 'ぞくせいの力', desc: '属性のあるわざの 威力 +25%' },
  mpregen: { name: 'めいそう', desc: '毎ターン 最大MPの 8%回復' },
  dodge: { name: 'みかわし', desc: '単体攻撃を 20%で よける' },
  armor: { name: 'てっこう', desc: '物理ダメージ −25%' },
  barrier: { name: 'まほうのかべ', desc: 'まほうダメージ −25%' },
  berserk: { name: 'ピンチ力', desc: 'HP半分以下で 与えるダメージ +40%' },
  lone: { name: 'いっぴきおおかみ', desc: 'なかまが倒れて 自分ひとりになると ダメージ +60%' },
  support: { name: 'なかま想い', desc: '回復とバフの効果 +30%' },
  poison: { name: 'どくのつめ', desc: '物理攻撃が 30%で 相手をどくにする' },
  stun: { name: 'しびれのつめ', desc: '攻撃が 18%で 相手をしびれさせる' },
  lucky: { name: 'ごうん', desc: '冒険のコインと経験値 +15%（戦闘には関係なし）' },
  firstaid: { name: 'おまもり', desc: 'HP30%以下で 一度だけ HPを50%回復' },
  glass: { name: 'ガラスのやいば', desc: '与えるダメージ +35%、受けるダメージ +25%' },
  pair: { name: 'にれんげき', desc: '行動が 25%で もう1回' },
  taunt: { name: 'かばう', desc: 'なかまへの単体攻撃を 30%で かわりに受ける' },
  pierce: { name: 'つらぬき', desc: '相手のしゅびを 30%むしする' }
};

TK.TACTICS = {
  ganga: { name: 'ガンガンいこう', healAt: 0.3, skillRate: 1 },
  balance: { name: 'バランスよく', healAt: 0.5, skillRate: 0.85 },
  inochi: { name: 'いのちだいじに', healAt: 0.7, skillRate: 0.6 }
};

TK.ITEM_SLOTS = { weapon: 'ぶき', armor: 'よろい', acc: 'アクセ' };
TK.ITEM_BASE = {
  weapon: [['こんぼう', 'atk'], ['まほうのつえ', 'mag'], ['ショートソード', 'atk'], ['スターロッド', 'mag']],
  armor: [['かわのふく', 'def'], ['くさりベスト', 'hp'], ['てつのよろい', 'def'], ['ぬののローブ', 'hp']],
  acc: [['はやてのくつ', 'spd'], ['めいそうのリング', 'mp'], ['ちからのバンド', 'atk'], ['まもりのおまもり', 'def']]
};
TK.QUALITY = [
  { name: 'ぼろぼろの', mult: 0.7, weight: 25 },
  { name: '', mult: 1, weight: 45 },
  { name: 'よいできの', mult: 1.3, weight: 20 },
  { name: 'みごとな', mult: 1.65, weight: 8 },
  { name: 'でんせつの', mult: 2.2, weight: 2 }
];

// そうびの追加効果。パレード全体で 1種類につき FX_MAX まで
TK.ITEM_FX = { coin: { name: 'コイン' }, xp: { name: 'けいけんち' }, drop: { name: 'そうび発見' } };
TK.FX_MAX = 60;

TK.TARGET_NAME = { one: '敵1体', all: '敵全体', self: '自分', ally: '味方1体', allies: '味方全体' };
// とくぎの説明は 定義の数値から作る
TK.skillDesc = function (id) {
  var k = TK.SKILLS[id], who = TK.TARGET_NAME[k.target], el = k.el ? TK.EL_NAME[k.el] + '属性の ' : '';
  if (k.kind === 'phys' || k.kind === 'mag') {
    var pct = function (v) { return Math.round(v * 100) + '%'; }, plus = '';
    if (k.drain) plus += '・ダメージの' + pct(k.drain) + 'を回復';
    if (k.recoil) plus += '・ダメージの' + pct(k.recoil) + 'を自分も受ける';
    if (k.ignore) plus += '・しゅびを' + pct(k.ignore) + 'むし';
    if (k.critUp) plus += '・会心 +' + pct(k.critUp);
    if (k.addPoison) plus += '・' + pct(k.addPoison) + 'で どく';
    if (k.addStun) plus += '・' + pct(k.addStun) + 'で しびれ';
    if (k.lower) plus += '・しゅびを' + pct(k.lower) + '下げる（3ターン）';
    return who + 'に ' + el + (k.kind === 'phys' ? '物理' : 'まほう') + 'ダメージ（威力' + pct(k.pow) + (k.hits ? '×' + k.hits + '回' : '') + plus + '）';
  }
  if (k.kind === 'heal') return who + 'の HPを回復（威力' + Math.round(k.pow * 100) + '%）';
  if (k.kind === 'buff') return who + 'の ' + TK.STAT_NAME[k.stat] + 'を ' + Math.round(k.amt * 100) + '%上げる（4ターン）';
  if (k.kind === 'debuff') return who + 'の ' + TK.STAT_NAME[k.stat] + 'を ' + Math.round(k.amt * 100) + '%下げる（3ターン）';
  if (k.kind === 'poison') return who + 'を ' + Math.round(k.chance * 100) + '%で どくにする（3ターン、毎ターン最大HPの7%）';
  return who + 'を ' + Math.round(k.chance * 100) + '%で しびれさせる（1回 動けない）';
};
// 基本の能力の高さ S〜D。前作と同じ5段階
TK.statRank = function (v) { return v >= 1.4 ? 'S' : v >= 1.2 ? 'A' : v >= 1 ? 'B' : v >= 0.75 ? 'C' : 'D'; };

// 1つの場所は5層。最後の層に ぬしがいる
TK.FLOORS = 5;
