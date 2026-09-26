# ねこビーム

猫がビームで戦う横スクロールアクションゲーム。丘・森・湖・古城の4ステージ、専用BGM、効果音、ネコ型ロボのボス戦を収録。
HTML / CSS / JavaScriptの静的サイトです。ビルドやnpmのインストールは不要です。

## GitHub Pagesで公開する

1. GitHubで新しいPublicリポジトリを作成します（名前の例：neko-beam）。
2. このZIPをパソコンで「すべて展開」します。
3. GitHubの「Add file → Upload files」から、展開した中身をアップロードします。assetsフォルダーはフォルダーごとドラッグしてください。
4. index.htmlがリポジトリの一番上にあり、隣にgame.js、boss.js、style.css、assetsフォルダーがあることを確認してコミットします。ZIPファイル自体をアップロードしてもゲームは公開されません。
5. 「Settings → Pages」でSourceを「Deploy from a branch」、Branchを「main」、Folderを「/(root)」にしてSaveします。
6. 公開処理が完了したら、Pages設定画面に表示されるURLを開きます。

公開URLの形式：https://ユーザー名.github.io/リポジトリ名/

通常ステージ：公開URLのトップページ。
動作プレビュー：公開URLの末尾にboss-animation-preview.htmlを追加。
更新時は変更したファイルを同じ場所へアップロード・コミットしてください。

GitHub公式手順：https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## ファイル構成

- index.html：ゲームの入口
- game.js：通常ステージ・操作・音声
- boss.js：ボス戦とアニメーション
- style.css：画面レイアウト
- assets/：画像・音楽・効果音・ボスのフレーム情報
- boss-animation-preview.html：ボスの動作確認
- .nojekyll：静的ファイルをそのまま配信する設定
- 遊び方.txt：操作説明

## 操作

← → / A Dで移動、Spaceでジャンプ、Z / X / Jでビーム、Pで一時停止。
同じ移動方向を2回押し、2回目を長押しでダッシュ。音は上部の「音 OFF」を押して有効にします。
「ボス戦から遊ぶ」で古城のボスに直接挑戦できます。
ボスの各腕は耐久8、コックピットは24。頭部の耐久が半分になるとガラスが割れ、司令官の動きが速くなります。
腕の破損後は目のビームが解禁。ハッチは機械ネズミの出撃時だけ開きます。

## ローカルで遊ぶ

index.htmlをEdgeまたはChromeで開いてください。assetsフォルダーは隣に置いたままにします。
進行状況の保存機能はありません。
