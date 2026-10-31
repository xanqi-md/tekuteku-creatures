# てくてくクリーチャーズ

400体のクリーチャーと40の場所を歩く、オートパレードRPG。「てくてくモンスターズ」の続編です。

## あそびかた

`index.html` をブラウザで開くだけで動きます。ビルドは不要です。セーブはブラウザの localStorage と IndexedDB に保存され、ファイルへ書き出せます。サーバーは使いません。



## 構成

| パス | 内容 |
|---|---|
| `js/data-creatures.js` | クリーチャー400体と40エリア |
| `js/data-rules.js` | 属性・とくぎ・とくせい・そうびの定義 |
| `js/engine.js` | ルール本体(DOM非依存) |
| `js/balance-tuned.js` | 自動調整で生成される補正値 |
| `js/art.js` | SVGの絵と背景 |
| `js/ui.js` | 画面 |

## 検証ツール

Windows の Edge をヘッドレスで使います。

```powershell
# ルールのテスト
powershell -ExecutionPolicy Bypass -File tools\run-realtime.ps1 -Page tools\test.html -WaitSec 14
# 実ボタンを押すUIテスト
powershell -ExecutionPolicy Bypass -File tools\run-headless.ps1 -Page tools\shot.html -Query "?shot=smoke" -Budget 60000
# 375px幅のはみ出し検査
powershell -ExecutionPolicy Bypass -File tools\run-headless.ps1 -Page tools\narrow.html -Budget 20000
# バランス再調整(js/balance-tuned.js を更新)
powershell -ExecutionPolicy Bypass -File tools\retune.ps1
```

クリーチャーやルールを変えたら `retune.ps1` を実行してください。
