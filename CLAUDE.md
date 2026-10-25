# 注音符號學習樂園 - Claude Code 專案上下文

## 專案概述

這是一個為**失語症患者**與**學齡前兒童**設計的注音符號學習 Progressive Web App (PWA)。

- **版本**: v5.9.7
- **開發者**: 陳宜誠律師 & Claude Code
- **技術棧**: 純 HTML/CSS/JavaScript（無框架、無建置工具）
- **授權**: MIT License（音檔為教育部創用 CC）

## 技術架構

### 核心 API
- **Web Speech API**: 語音辨識（SpeechRecognition）
- **Web Speech Synthesis API**: 文字轉語音（TTS）
- **Web Audio API**: VAD 聲音活動偵測
- **localStorage**: 本地儲存進度與設定
- **Service Worker**: PWA 離線快取

### 關鍵檔案
```
js/config.js              - 全域配置、版本號、鼓勵語、相似度計算
js/speech-recognition.js  - 語音辨識核心（VAD、錄音回放、閃爍動畫）
js/speech-game.js         - 語音遊戲共用流程（聽一次／沒過關回饋／過關稱讚／家長「我會唸」／跳過）
js/vocabulary.js          - 詞彙資料庫（8大分類、80+詞彙）
js/sentence-generator.js  - 句型產生器（從字詞庫動態產生遊戲內容）
js/prevent-zoom.js        - 防止雙擊放大
js/number-practice.js     - 數字練習共用（第 1／2／3 關 0–9／0–30／0–99 同一個遊戲換資料；頁面只留版面、主題色、資料）
js/media-store.js         - 照片／錄音的 IndexedDB 共用存取（MediaStore.open(db) → put/get/del/each；localStorage 只有約 5MB，照片一律存這裡）
js/photo-crop.js          - 共用照片裁切（PhotoCrop.open(file,{aspect,outWidth}) → dataURL；拖曳／雙指／滑桿縮放／整張使用）
sw.js                     - Service Worker 快取策略
settings.html             - 設定頁面（字詞庫管理、麥克風測試）
exam/color.html           - 體檢練習：色盲圖卡（程式產生點狀色塊數字；家長問、家長判定）
exam/eye.html             - 體檢練習：視力表（E／缺角圓圈 C，10 列由大到小；點符號放大、家長判定）
```

## 專案結構

```
├── index.html            # 主選關畫面
├── settings.html         # 設定頁面
├── level0/index.html     # 基礎認識（37 注音符號）
├── level1/games/         # 6 個遊戲（注音基礎）
├── level2/games/         # 7 個遊戲（圖片識字）
├── level3/games/         # 11 個遊戲（句子閱讀）
├── sounds/F1~F37.mp3     # 37 個注音發音
└── images/private/       # 私人家人照片（.gitignore 排除；遊戲圖片實際使用 emoji，vocabulary.js 的 image 欄位未使用）
```

## 語音辨識系統（v5.0 架構：人聲偵測優先）

### 設計原則
- **判「有沒有人在發聲」不靠能量，靠基頻**：`js/speech-recognition.js` 以時域自相關（NSDF）
  偵測聲帶振動的週期性（F0 70–600Hz）。敲擊、拍打是非週期脈衝，抓不到穩定基頻 → 不算發聲。
  單幀判定另有：McLeod 零交越規則（排除低頻悶響）、包絡衰減比 ≤ 3.5（排除敲擊餘響）、
  連續 N 幀且基頻不亂跳才確認人聲。
- **零死區**：噪音底線在背景持續校準（取 30 百分位），按下麥克風立刻開始聽。
- **即時回應**：確認人聲約 125ms；鼓勵模式在發聲 ≥220ms 時立即過關，不等辨識引擎。
- **說完即判**：靜音 700ms → 呼叫 `recognition.stop()` 強制收尾，最多再等 1.5 秒，不再空等 7 秒。
- **Web Speech API 對孤立單音節不可靠**：單字／注音拼寫目標採 `hybrid` 模式（辨識命中即過；
  辨識無結果但確認人聲且夠長也過）。詞／句在門檻 > 0 時採 `speech` 模式，完全由相似度決定。
- **任何模式下「沒有人聲」一律不過關**（電視聲被辨識到也不過）。

### 判定模式
| 模式 | 條件 | 過關依據 |
|---|---|---|
| voice | 門檻 = 0 | 確認人聲且發聲 ≥ 最低時長 |
| hybrid | 單音節目標且門檻 > 0 | 辨識命中，或確認人聲且夠長 |
| speech | 詞／句且門檻 > 0 | `passesSimilarityThreshold()` |

### 內建 HUD（聲音燈）
聆聽時模組自行在畫面下方顯示音量環與狀態文字（灰＝安靜、橘＝有聲響非人聲、綠＝人聲），
12 個語音遊戲不需修改即可獲得即時回饋。設定頁可關閉。

### 使用者資料層（v5.6.0，`js/vocabulary.js` 的 `UserData`）
- `familySettings` 與 `vocabularyModifications` 只能透過 `UserData` 讀寫（`loadFamily／saveFamily／addFamilyMember／removeFamilyMember／familyWords`、
  `loadMods／saveMods／addWord／editWord／deleteWord／setWordImage／clearWordImage／addedWords／resetAll`）；頁面不得自行 `localStorage.getItem` 這兩個鍵。
- 家人只有一份名單 `familySettings`：14 個預設角色（唯一定義 `UserData.DEFAULT_FAMILY`，新版本加的角色自動補齊）＋使用者新增的（`isAdded`，`id` 以 `add_` 開頭），
  每筆 `{ id, name, zhuyin, emoji, gender, enabled, customImage, isAdded }`；預設角色用「停用」，新增的可刪除。
- 一般字詞的修改在 `vocabularyModifications { deleted, edited, added }`；新增的詞的圖片存在 `added` 項目本身，系統詞的圖片存 `edited[category][text].customImage`。
- 一次性遷移（第一次讀取時自動執行）：舊的 `customWords`（設定頁「自訂字詞」，遊戲從未讀取）併入 `added`（daily→items、place→nature、sentence→items、family→家人）；
  `vocabularyModifications` 裡的 family 項目併入 `familySettings`。
- 所有照片都經 `js/photo-crop.js` 的 `PhotoCrop.open()` 裁切縮圖後才存（家人 1:1 600px、字詞 1:1 600px、說話板 4:3 900px、郵輪 4:3／1.3:1 900px）；
  設定頁不再有自己的裁切 modal。

### 設定（localStorage）
> 稱讚語在 `config.js` 的 `APP_CONFIG.encouragements`（`correct` 24 句，每句只有結尾一個「！」；「繼續加油」不是稱讚，已拿掉，`getEncouragement` 的名字句型才接得順）。
- `similarityThreshold`：過關門檻（0 = 鼓勵模式）
- `voiceSensitivity`：`high` / `normal` / `low`（清晰度門檻、確認幀數、最低音量）
- `singleSyllableMode`：`voice`（預設）/ `strict`
- `showVoiceHud`：`1` / `0`
- `speechEndMs`：`1500`（預設）/ `2500` / `4000`——他停多久不出聲才算「說完一句」；說話板的 `silenceEndMs` 與郵輪**語音引擎判定**的辨識會話用它（說得慢、字間停頓長的人設長一點，否則說到一半就被稱讚）。
  郵輪**家長判定**自 v5.9.6 起不用它：他停 0.9 秒就出判定列但麥克風不關（他再說就繼續、船照樣動、30 秒計時重來），說完沒、對不對都由家長按 👍 決定（實測：2.5 秒太早出、4 秒等太久又再催）
- `judgeMode`：`parent`（預設）/ `asr`——門檻 > 0 時郵輪與說話板「說對了沒」由誰判定：家長按 👍（語言障礙者的發音，語音引擎常聽不懂，家長聽得懂）或語音辨識引擎
- `micTestOk`：`{ at, items: { permission|volume|asr|voice: 成功時間 } }`——麥克風測試紀錄（`config.js` 的 `recordMicTestOk／getMicTestRecord／describeMicTestRecord`）；設定頁與 `mic-test.html` 成功時寫入、載入時顯示「上次測試成功：…」，主選單指引卡第 3 步據此標示已完成；「還原預設值」不清它（是裝置事實，不是偏好）

### 錄音回放
- MediaRecorder 錄下每次嘗試；辨識失敗時遊戲可先回放用戶錄音再播正確答案。

### 測試
- 純 DSP（`SpeechModule.__dsp.analyzeFrame / classifyFrame`）可在 Node 中以合成訊號測試；
  模組頂層不觸碰瀏覽器 API，`require()` 即可載入。
- `mic-test.html` 第 4 項「人聲偵測測試」供實機驗證：說「ㄚ」亮綠燈、敲螢幕不亮。

## 「說話旅行」方向（v5.1 起的原型）

主要使用者是成年語言障礙者（含開發者的兒子，25 歲，有功能性單詞與固定句型）。設計原則：
- **聲音就是搖桿**：一出聲畫面立刻連續反應，不是說完才評分。
- **報酬是他愛的東西**：他自己的家人照片、食物、交通工具、旅行合照；不用卡通與星星。
- **建立在他既有的「看圖說詞」格式上**，內容換成他的生活。
- **家長判定為最終**：系統負責確認真的發聲、立即報酬、記錄；對不對由家長一鍵決定。
- 觸碰螢幕不推進任何進度；家長功能以長按開啟。
- 注音退為構音輔助層（附掛在已會說的詞的首音），不是入口。

`voyage/index.html`（郵輪出航）：持續發聲船前進；說完一個詞（確認人聲，且累計有聲 ≥150ms 或首尾跨度 ≥250ms；「嘟嘟」「出發」這種母音很短的兩音節詞靠跨度）→ `depart()` 航行動畫（短鳴、尾浪、黑煙、海豚、海鷗，船開進港口，剩的距離再短也至少 0.8 秒；期間忽略麥克風）→ `arrive()` 抵港：港口揭示家人合照＋長鳴汽笛＋卡片外四區煙火（共用 `createFireworks`）與彩帶＋稱讚（稱讚語 × 5 種句型，每種都含「到○○了」）；
站數由家長決定（v5.8.0：`voyage.data` v2 `{ v:2, ship, ports:[{ name, word, imgs, next }] }`，1～12 站，家長面板「➕ 加一站」／每站「🗑 刪除」；**每站有自己的口令 `word`**，空白＝站名；舊資料固定 5 站、口令清單 `words` 依序分到各站後存回）；> 6 站時航線標籤上下交錯、> 8 站圓點縮小。最後一站後終點（煙火、稱讚＋結尾句型）。**過關門檻（設定頁）也適用**：0% 有說話就抵港；>0% 時船仍隨聲音前進但停在港前，由 `judgeMode` 決定誰判「說對了」：`parent`（預設）他停 0.9 秒就出現判定列「他說的像「郵輪」嗎？」且繼續聽（v5.9.6），家長按 👍（單點）才進港、🔁 再一次（30 秒沒按也沒再說＝收起繼續聽；判定列掛著時不催口令）；`asr` 交給 `SpeechModule` 辨識會話（相似度 ≥ 門檻），說錯顯示「聽到「X」，再說一次：郵輪」。照片由家長在 iPad 上從「照片」選取，裁切縮至 900px 後存 IndexedDB `zhuyin-media`（key `voyage/ship`、`voyage/p<i>/<id>`），
`voyage.data`（localStorage）只存參照 `idb:voyage/…` 與港名、口令；舊版塞在 localStorage 的 dataURL 第一次載入時自動搬移
（iOS Safari localStorage 約 5MB，四、五張照片就會「儲存空間不足」，與 iPad 容量無關）。
起始畫面有「⚓ 家長設定」鈕（與 ⚓ 一樣按一下就開，v5.9.7；共用 `initParentLongPress` 的 `data-parent-longpress`）與「個人化設定」連結；`?setup=1` 直接開家長面板（設定頁「說話旅行」區由此連入）；左上「← 返回」與各關卡一致；
每次發聲與抵港寫入 `voyage.log`，家長面板可看今日統計與匯出。喇叭播音（汽笛／TTS）期間關閉麥克風判定。

`board/index.html`（說話板，`?set=iwant` / `?set=family`）：照片卡格 → 點卡進專注畫面 → 播示範（家人錄音，否則 TTS）
→ `startListening(say, cb, { hud: false, waitForEnd: true, silenceEndMs: 1500 })`（門檻 0% 時加 `passMode: 'voice'`，>0% 交給 SpeechModule 依相似度判定）：**等他說完**（靜音 1.5 秒，容許「我要…尿尿」中間停頓）才判定，不在句中回覆 → 報酬（稱讚語 TTS → 照片放大、播家人錄的回應）
→ 家長判定列（👍 與 🔁 都單點，v5.9.5 起不長按；門檻 0% 或 asr：報酬之後才出現，只記錄；門檻 > 0 且 `judgeMode=parent`：說完先出現判定列，家長按 👍 才給報酬）→ 回卡片格。郵輪的 👍 自 v5.9.7 起也是單點。
家人組沿用設定頁 `familySettings` 的名字與 `customImage`。卡片文字存 localStorage `board.items.<set>`；
照片／示範／回應錄音存 IndexedDB `zhuyin-board`（key `<set>/<id>/<photo|model|reply>`）；紀錄 `board.log`。
觸碰照片＝重播示範（`guardAudio` 保護）。無 MediaRecorder 的裝置（iOS < 14.5）隱藏錄音鈕、改 TTS。

## 體檢練習（v5.9.0，`exam/`）

目的：讓他能通過體檢的視力項目。檢查員指著圖問，他用說的（與手勢）回答；這兩頁**不用麥克風**，對不對由家長按 👍 判定（**單點即可，不是長按**：家長拿著 iPad 問，v5.9.2 實測回饋），
「👁 看答案」顯示並唸出答案（記為看答案，不稱讚），👍 之後稱讚（`getEncouragement`）＋煙火（`createFireworks`）＋自動下一題。
兩頁都有起始遮罩「開始練習」，在點擊內同步 `speak()` 開場（iOS 解鎖語音）。紀錄 `exam.color.log`／`exam.eye.log`，畫面顯示「今天：答對 N 題、看答案 M 題」；選項存 `exam.color.opts`／`exam.eye.opts`。
- `exam/color.html` 色盲圖卡：圖卡由 Canvas 隨機產生（不用有版權的石原氏圖片）——粗體數字畫成遮罩，圓形區域塞滿不重疊的圓點（先大後小，跨到筆畫邊緣的點縮小），
  配色涵蓋完整的圖卡類型（v5.9.3 實測回饋：只有紅綠型不夠）——`SCHEMES`：紅綠型三種（橘紅字綠底、綠字橘粉底、紅字灰綠底）、灰底雙色（石原氏分類圖：兩個數字各畫一張遮罩，一紫一紅）、藍黃型兩種（藍紫字黃綠底、黃字藍灰底）、清楚（深藍／淺黃）；
  每組顏色以 HSL 範圍抽，數字與背景明度範圍重疊、只靠色相分辨；「全部配色」每張隨機（連兩張不同），也可只練某一型；畫面下方標示這張的配色。數字預設從體檢常見的石原氏題目數字（12, 8, 6, 29, 57, 5, 3, 15, 74, 2, 97, 45, 7, 16, 73, 26, 42, 35, 96）抽，可切 1 位／2 位／混合、隨機。
- `exam/eye.html` 視力表：11 列（視力 0.1～1.0，最後兩列都是 1.0；每列 1,2,3,4,5,6,7,8,8,8,8 個），高度比＝視力值倒數、依表高反覆調整（小列至少一指寬好點）再乘 `CHART_SCALE` 0.86；
  同一列相鄰方向不重複（實測整列都朝上像沒出題）。E 為 Snellen E（5×5、筆畫 1）、C 為 Landolt C（外徑 5、環寬 1、缺口 1），以 SVG `rotate` 表示開口方向（右 0°、順時針；`C8` 另有 45° 斜角四向：右下 45、左下 135、左上 225、右上 315）。
  家長點一個符號 → 放大＋系統自動問「開口（缺口）朝哪邊？」（按放大的符號會再問）→ 👍／看答案（箭頭＋「開口朝上」）；「大圖練習」一次一個大符號；「換一張表」重抽方向。
- 兩頁的「問」都由系統自動發出（色盲圖卡每張新圖問「這是幾？」，他按到圖卡也問，最多每 1.5 秒一次）；稱讚講完才換下一題（`Promise.all([speak, delay])`），下一題的問句才不會把稱讚切掉。

裝置：主力 iPad 第五代（iPadOS 16.7，全功能）；iPhone 6 Plus（iOS 12.5）僅人聲偵測可用——
**程式碼不得使用 `?.`、`??`**（iOS 13.1 起才支援），`100dvh` 前須有 `100vh` 後備。

## 開發慣例

### 程式碼風格
- 繁體中文註解
- **共用邏輯一律在 `js/`，頁面只保留版面與該遊戲專屬規則；同一件事在第二個地方出現第二份實作即視為 bug**
  （v5.4.0 起。此前「每個 HTML 獨立完整」的慣例讓 26 頁各自複製 `speak`／`playSound`／`shuffle`／
  `createFireworks`／鼓勵語／`getUserName`，同一功能長出多種行為，是公測期多個 bug 的直接來源）
- 共用底層在 `js/config.js`：`speak(text, cb|options)`（一次性 callback、onerror、8 秒保險）、`speakShort`、
  `playZhuyinSound(symbol, onDone)`（停前一個、自動 `guardAudio`、路徑由 `APP_BASE` 推得）、
  `playSound`／`playSoundWithCallback`／`playSoundAsync` 相容別名、`createFireworks(count, container)`、
  `shuffle`（就地並回傳）、`getEncouragement(type)`（含名字）、`getUserName`、`initParentLongPress`、錯誤紀錄。
  每一頁都必須載入 `js/config.js`。
- 語音遊戲流程在 `js/speech-game.js`（`SpeechGame`，v5.5.0 起）：`listen({ target, button, status, heard, manualButton,
  onPass, onFail, onNoVoice, … })` 聽一次（按鈕狀態、「正在聽／聽到了／沒聽到／那不是說話聲」文案、`你說：…` 統一在此）、
  `review({ target, status, retryCount, manualButton, playTarget, playback })` 沒過關回饋（回放錄音 → 正確示範 → 再試／第 3 次起提示家長「我會唸」）、
  `celebrate({ status, fireworks })` 過關稱讚（含名字、震動、煙火、TTS）、`manualConfirm(target, onYes, opts)` 家長按「我會唸」（預設不問，`confirm:true` 才問）、`skip(target, next, opts)`。
  12 個語音遊戲不得再直接呼叫 `SpeechModule.startListening`（說話板 `board/` 與郵輪 `voyage/` 例外：它們是 passMode voice 的獨立流程）。
  **各遊戲何時開聽（按麥克風才聽、示範音播完自動聽、老鷹飛行中連續聽）是遊戲規則，留在頁面，不得為了統一而改掉。**
  `manualConfirm(target, onYes, { confirm: false })` 不跳對話框（示範播完直接算會唸）。
- 數字練習三關共用 `js/number-practice.js`（`NumberPractice.start({ numbers, storageKey, columns, rounds })`，v5.9.4）：大牌卡（數字＋注音／國字）；
  模式切換立即開始、無對話框；📚 學習出現就唸、點格子唸；👂 聽音選數自動唸題；🎤 看數唸出**自動開始聽**（不必按麥克風）、沒過關示範後自動再聽、
  沒人聲最多自動重聽 3 次；按牌卡／？／螢幕空白處＝再唸一次（看數唸出：先示範再自動聽）；「✅ 我會唸」家長按一下即算（`confirm:false`）、不長按。
  實測回饋（v5.9.4）：數字太小、沒牌卡、沒自動發音、選模式還要按確定、按？應重唸、看數唸出應自動聽、我會唸不必長按。
- 第 0 關掉落遊戲（v5.9.4）：他按得很快——「中」改為落得慢（26 秒）、出得密（1.3 秒）、畫面最多 12 個；一碰就算（`pointerdown`）；
  發音排隊（`queueSound`，按一個唸一個不互相切斷；按得比唸得快只留最近兩個，mp3 每個約 0.83 秒）。
- 版本號更新在 `js/config.js`（`APP_CONFIG.version`）、`sw.js`（`CACHE_VERSION`，觸發快取更新）與 `index.html` 頁尾；`manifest.json` 無版本欄位

### UI 設計原則
- 響應式設計（手機/平板/電腦）
- 使用 `100dvh` 解決手機瀏覽器網址列問題；全螢幕版面再加 `height: calc(var(--vh, 1vh) * 100)`（`config.js` 以 innerHeight 設 `--vh`，iPad Safari 的工具列／我的最愛列才扣得準）
- 固定高度佈局，無需捲動
- 放大的互動按鈕（適合兒童與長者）
- 麥克風按鈕有閃爍動畫引導
- **會離開頁面的按鈕一律長按 1.2 秒**（← 返回、遊戲結束畫面的「🏠 返回選單」、`data-back`），輕按只顯示提示；`config.js` 自動接上 `a.back-btn`／`button.back-btn`／`a.back`／`[data-back]`
- **家長按鍵一律單點**（👍 說對了、⚓ 家長設定、✅ 我會唸、體檢練習的 👍；v5.9.7 實測回饋：家長拿著 iPad 按，長按很擾人）：`[data-parent-longpress]` 由 `initParentLongPress` 接成單點（屬性名沿用）；`SpeechGame.manualConfirm` 預設不跳「你會唸嗎？」對話框
- **回上一頁的控制全站統一**：左上角「← 返回」（不寫「返回首頁」「回主選單」等變體）；其他會離開頁面的按鈕加 `data-back` 並標「（按住）」
- **設定一律改了就存**：設定頁沒有「儲存」按鈕（名稱輸入停 0.6 秒即存）；郵輪／說話板家長面板標示「修改會自動儲存」

### 新增遊戲步驟
1. 在對應 level 的 `games/` 目錄建立 HTML
2. 在 `levelX/index.html` 加入遊戲卡片
3. 在 `sw.js` 的 `urlsToCache` 加入新檔案
4. 更新 `js/config.js` 版本號

## 常見開發任務

### 語音辨識調整（v5.0 統一模組）
- 所有語音遊戲統一使用 `js/speech-recognition.js` 的 `SpeechModule`，callback 契約：
  `onVoiceDetected / onInterim / onResult / onTimeout / onError`（另有選用 `onVoiceLevel / onSpeechEnd`）
- 人聲偵測參數集中在模組常數區與 `SENSITIVITY` 表；改動後務必重跑合成訊號測試
- **遊戲播放任何音檔（注音示範音、家人錄音）前必須 `SpeechModule.guardAudio(audio)`**：
  喇叭放出的人聲有基頻，不擋會被當成使用者發聲（點一下重播＝過關）。Web Audio 合成音用 `notifyPlayback(ms)`。
- **開聽前不要用 TTS 提示**（如「請大聲唸」）：TTS 播放期間麥克風判定被閘門排除，只會延後聆聽。
- **iOS 的 AudioContext 要在手勢內建立／resume**：郵輪、說話板是「開場提示講完才開麥克風」，`SpeechModule.init()` 跑在手勢外時 context 停在 suspended、`resume()` 永遠不回來，起始遮罩收不掉（v5.9.6 實測：提示語講完畫面沒出來）。
  起始鈕的點擊裡先同步 `SpeechModule.prepareAudio()`；`init()` 的 resume 最多等 1.5 秒；頁面對 `init()` 加 10 秒時限並顯示錯誤。
- **iOS Safari 只播由使用者手勢觸發的 TTS**：頁面第一次 `speak()` 必須在點擊事件裡同步呼叫（不能先 `await` 麥克風或 timer），
  之後由 timer 觸發的稱讚、提示才播得出來；否則整頁的 TTS 都靜音（v5.6.3 郵輪實測：有汽笛、有照片、沒有口令與稱讚）。
  `SpeechModule._ttsSpeaking()` 另有卡住保護：`speaking` 旗標連續 15 秒為真即忽略並 cancel。
- **iOS 另一個已知問題：`cancel()` 之後立刻 `speak()` 會被吞掉**（v5.7.2 實測：說話板第二張卡起示範都不出聲）。
  `SpeechModule.speak` 與 `config.js speak` 都改為：前一句還在講才 `cancel()`，並等 120ms 再講；沒在講就同步講。
- **不要再寫「唸兩到三次」「聲音太短再唸一次」這類補丁**：v5 單次發聲 ≥220ms 即可判定；
  `onTimeout` 只在完全沒有人聲時觸發（有人聲但不過關走 `onResult(passed:false)`），
  用 `info.noiseOnly` 區分「那不是說話聲」與「沒聽到聲音」。
- 相似度門檻: 設定頁的全域設定，由 `config.js` 的 `getSimilarityThreshold()` 讀取

### 詞彙修改
- 資料來源: `js/vocabulary.js`
- 用戶修改: `UserData`（`familySettings`／`vocabularyModifications`，見「使用者資料層」）
- 8 大分類: family, animals, fruits, items, food, actions, body, nature

### 進度系統
- 儲存位置: localStorage
- 過關門檻: 設定頁可調 0-100%
- 快捷模式: 鼓勵(0%)、練習(50%)、挑戰(80%)、精準(90%)

## 版本歷史重點

- **v5.9.7**: 家長按鍵一律單點：郵輪 👍、郵輪／說話板 ⚓ 與「家長設定」鈕、11 個語音遊戲的「✅ 我會唸」（`initParentLongPress` 改接單點、`manualConfirm` 預設不問）；會離開頁面的按鈕維持長按
- **v5.9.6**: 郵輪／說話板出航卡住修正（`SpeechModule.prepareAudio()` 在手勢內先建 AudioContext；init 的 resume 與頁面的 init 都加時限）；郵輪家長判定列改為「停 0.9 秒就出、繼續聽、家長決定」，不再用說完判定秒數（實測：中等太早結束、長的等太久又再催）；郵輪語音引擎判定的會話補上 waitForEnd／silenceEndMs（之前 0.7 秒就收音）
- **v5.9.5**: 說話板（我要…／叫家人）的「👍 說對了」改為單點（實測回饋）；郵輪維持按住
- **v5.9.4**: 數字練習三關改為共用 `js/number-practice.js`：大牌卡、模式立即切換（拿掉確定對話框與長篇說明）、出現就唸、按牌卡／？／螢幕再唸、看數唸出自動聽（示範後自動再聽）、我會唸單點；第 0 關掉落遊戲落得慢、出得密、一碰就算、發音排隊。實測回饋：掉落太快、發音跟不上他按的速度；數字太小、沒牌卡、沒自動發音、選模式要按確定、按？應重唸
- **v5.9.3**: 色盲圖卡配色擴成完整類型：紅綠型三種、灰底雙色（紫字與紅字）、藍黃型兩種，每張隨機或指定只練某一型；實測回饋：原本只有紅綠型一種配色
- **v5.9.2**: 體檢練習的 👍 改為單點即回饋（兩頁；家長拿著 iPad 問，不必長按）
- **v5.9.1**: 體檢練習實測修正：「繼續加油」不是稱讚（拿掉）；色盲圖卡每張自動問「這是幾？」、他按圖卡也問；視力表縮小、最下面多一列 1.0、同列相鄰方向不重複（實測 0.3 列全朝上）；新增「C 八方向」（含斜角）
- **v5.9.0**: 體檢練習兩頁（`exam/color.html` 色盲圖卡：程式產生的點狀色塊數字、體檢常見數字；`exam/eye.html` 視力表：E／缺角圓圈 C 十列、點符號放大、大圖練習）——家長指著問、他說出／比出答案、家長按住 👍 才稱讚，看答案不稱讚；主選單新增「體檢練習」兩張卡；`tests/browser/exam-test.js`
- **v5.8.0**: 郵輪可玩性擴充（兒子願意玩兩次，想再加料）：(1) 站數由家長決定（1～12 站，家長面板加站／刪站；舊資料維持 5 站）；(2) 說完一個詞先有航行動畫（短鳴、尾浪、海豚、海鷗，船開進港口）才抵港；(3) 每站自己的口令整合在站的設定裡（站名、口令、照片），舊的口令清單依序分到各站；(4) 抵港在照片卡片外放煙火、撒彩帶，終點也放；(5) 稱讚語從 10 句加到 25 句、抵港句型 5 種、終點句型 4 種。測試音軌重做（每站多 ≈1.2 秒），新增 `tests/browser/voyage-ports-test.js`
- **v5.7.6**: 麥克風測試記住成功紀錄（localStorage `micTestOk`，共用函式在 `config.js`）：設定頁顯示「✅ 上次測試成功：10/17 14:03（麥克風權限、收音、語音辨識）」、`mic-test.html` 四項各自顯示上次成功時間、主選單指引卡第 3 步標示「已完成」或「麥克風已測過，第 4 項還沒測」。實測：麥克風測試不會記得測試成功過
- **v5.7.5**: 全站 34 頁的全螢幕高度都加上 `calc(var(--vh,1vh)*100)`（主選單、各關卡選單、24 個遊戲、設定、回報、麥克風測試），與郵輪／說話板一致；回上一頁已全站統一（每頁左上 `.nav-bar` 的「← 返回」長按）
- **v5.7.4**: 設定頁名稱改為自動儲存，拿掉「儲存名稱」與「儲存設定」鈕；回上一頁全站統一：所有頁面左上角一律「← 返回」（長按），遊戲結束畫面的「🏠 返回選單」與郵輪家長面板的返回也改為長按（`data-back`）
- **v5.7.3**: (1) 說完判定只看「持續的人聲」（連續 confirmFrames 幀才重置計時器，背景零星一兩幀不算），等說完的會話時限隨人聲延後（上限 60 秒）——實測：說完判定設 4 秒仍把背景聲當發音、說慢的被 8 秒時限切掉、判定列要等到時限才出現；(2) 郵輪／說話板開場提示講完才開麥克風（iOS 開麥克風會切換音訊路徑，把還在講的 TTS 打斷：開場提示斷斷續續）；(3) `config.js initViewportHeight()` 以 innerHeight 設 `--vh`，郵輪／說話板高度改用它（Safari 工具列／我的最愛列造成頁面比螢幕長）
- **v5.7.2**: TTS 修正：iOS 上 `cancel()` 後立刻 `speak()` 會被吞掉（說話板第二張卡起示範不出聲），改為只在前一句還在講時 cancel 並延後 120ms；首次指引卡加「麥克風一次允許」（設定 → Safari → 麥克風 → 允許），設定頁與起始畫面同步更新
- **v5.7.1**: 說話板按「開始」時用語音說怎麼玩（「想要什麼，就點那張圖。聽我說一次，再跟我說一次。」，在點擊內同步講），卡片格閒置 20 秒再說一次（最多兩次）；設定頁新增「說完判定」1.5／2.5／4 秒（`speechEndMs`）：說話板與郵輪（門檻 > 0）用它判定他說完了沒；SpeechModule 等說完的會話總時限加上靜音等待。實測：他說得慢，「我要…尿尿」說到一半就被稱讚或問家長
- **v5.7.0**: 說話板：示範提示移除 `getVoices()` 守門（iOS 常回空清單，示範整個不出聲，他只會一直按圖片）、TTS 示範改說「跟我說：我要尿尿」、沒聽到聲音就再提示一次；家長判定模式——門檻 > 0 時郵輪與說話板預設改由家長判定（說完出現「他說的像「X」嗎？」，按住 👍 才進港／才給回應，🔁 再一次），語音辨識引擎改為設定頁可選（`judgeMode`）。實測：他的發音家長聽得出接近「郵輪」「回家」，引擎辨識不到
- **v5.6.5**: 郵輪再出航（終點自動、家長按重新出航）也講開場口令；終點加稱讚語；郵輪／說話板家長面板標示「修改會自動儲存」，郵輪每次存檔浮出「已儲存」
- **v5.6.4**: 郵輪與說話板也看過關門檻：0% 有說話就過；>0% 要辨識說對（郵輪：船隨聲音前進、說對口令才進港、說錯提示再說一次；說話板：不再強制 voice 模式，說錯顯示聽到的字）；起始畫面與家長面板顯示目前門檻
- **v5.6.3**: 郵輪實測修正——(1) 口令改在「出航」點擊事件內同步開講（iOS 只播手勢觸發的語音；之前口令與抵港稱讚全被丟掉）、TTS 佇列同步起講、移除 `getVoices()` 守門；(2) 兩音節短詞（出發、嘟嘟）算一個詞：有聲 ≥150ms 或首尾跨度 ≥250ms、確認幀 3；`SpeechModule`：`_ttsSpeaking()` 卡住保護、結果加 `asrError`／`asrUsed`，`SpeechGame` 沒有辨識文字時顯示原因，`speak()` 只在有語句時才 `cancel()`
- **v5.6.2**: 長按統一：家長設定（郵輪／說話板的 ⚓ 與起始畫面「家長設定」鈕）與**全站的「← 返回」鈕**都要按住 1.2 秒才生效，輕按只顯示共用提示（`config.js` 的 `wireLongPress`／`initParentLongPress`／`initBackLongPress`／`showParentHint`，載入 config.js 的頁面自動生效）
- **v5.6.1**: 郵輪照片改存 IndexedDB（共用 `js/media-store.js`，說話板改用同一模組；修正加到第 4、5 張就「儲存空間不足」）；郵輪與說話板起始畫面加「⚓ 家長設定」鈕與「個人化設定」連結、`?setup=1` 直接開家長面板，設定頁新增「說話旅行」入口；郵輪左上改為各關卡一致的「← 返回」（移除 🏠 長按）
- **v5.6.0**: 共用化第 3 階段——使用者資料層 `UserData`（`js/vocabulary.js`）：家人單一名單（預設＋新增）、字詞修改與自訂圖片單一入口、舊 `customWords`／`vocabularyModifications.family` 自動遷移；設定頁「自訂字詞」改為「我新增的」（直接寫進各類別，遊戲會用到）、家人管理單一列表、字詞換圖改用共用 `PhotoCrop`（移除設定頁自己的裁切 modal）；說話板家人組改讀 `UserData`（含新增的家人）；修正新增字詞的自訂圖片存錯位置而遊戲看不到的問題；注音建議補生活用字
- **v5.5.0**: 共用化第 2 階段——`js/speech-game.js`（`SpeechGame.listen／review／celebrate／manualConfirm／skip`）；12 個語音遊戲改呼叫共用流程，刪除各自的 startListening 回呼樣板、錄音回放＋正確示範流程、稱讚流程與「我會唸」confirm；各遊戲開聽時機不變
- **v5.4.1**: 郵輪加口令提示（畫面大字＋🔊 系統示範，閒置／按螢幕時再唸，家長面板可改詞）、右上角 🏠 長按回主選單、起始遮罩與設定頁說明 Safari 每頁會再問一次麥克風
- **v5.4.0**: 共用化第 1 階段——`config.js` 成為唯一的 `speak`／`playZhuyinSound`／`createFireworks`／`shuffle`／`getEncouragement`／`getUserName` 來源；30 頁刪除本地重複實作（含 4 份 SOUND_MAP、17 份鼓勵語陣列、9 份 getUserName），13 頁補載 config.js
- **v5.3.1**: 共用照片裁切模組 `js/photo-crop.js`；設定頁家人照片、說話板卡片、郵輪照片皆可從合照框出臉孔（並縮圖，避免整張原圖塞爆 localStorage）
- **v5.3.0**: 說話板等使用者說完整句才判定（`waitForEnd`／`silenceEndMs` 選項），報酬先稱讚再播回應；郵輪抵港加稱讚語。實測回饋：說到「我要」就被回覆、沒有稱讚
- **v5.2.9**: 家人改名可一併改注音（`familySettings[].zhuyin`，`suggestZhuyin()` 自動帶入）；字詞庫家人頁改名後立即重繪；移除預設名字範例「正昇」
- **v5.2.8**: 電腦提示改為資訊性、可關閉（電腦可正常玩；觸控更順手）
- **v5.2.7**: 第 0 關掉落注音加「慢／中／快」速度切換（localStorage `fallSpeed`）；非觸控裝置預設慢（約 29 秒落地）
- **v5.2.6**: 主選單偵測非觸控裝置顯示「請改用 iPad／手機開啟」提示（含網址複製）；公測回饋：電腦滑鼠操作不順
- **v5.2.5**: 回報頁啟用 Web3Forms 自動轉送
- **v5.2.4**: 回報頁改為 relay 自動轉送（web3forms／Google 表單二選一），介面與設定檔不再出現開發者聯絡資訊
- **v5.2.3**: 公測支援——主選單首次使用指引卡（家長三步驟，可關閉／頁尾重開）、`feedback.html` 回報頁、`config.js` 全域錯誤紀錄（localStorage `errorLog`）與 `APP_CONFIG.feedback` 回饋管道設定
- **v5.2.2**: QA round 2 修正——數字練習 speak() callback 重複觸發（題目自動換掉）、唸唸看「我會唸」誤把 callback 當語速、無辨識引擎裝置不再擋住發音練習／射擊
- **v5.2.1**: QA round 1 修正（詞彙排序整頁失效、TTS 失敗卡死開場、重複載入、還原預設 UI、favicon、`initParentLongPress()` 家長長按「我會唸」）
- **v5.2.0**: 「說話板」（我要…板／叫家人）：家人錄音示範與回應、IndexedDB 媒體、家長判定紀錄；`startListening` 第三參數 `{ passMode, hud }`
- **v5.1.1**: 清除「唸兩到三次」「大聲唸」TTS 補丁與死碼分支；`guardAudio()` 喇叭播放閘門（示範音、重播、錄音回放期間不算人聲）；老鷹射擊改為示範音播完才開聽
- **v5.1.0**: 「郵輪出航」原型（聲音即搖桿）、iOS 12 相容性修正（移除 `?.`、時域資料後備）、起音幀清晰度規則、真瀏覽器測試（tests/browser）
- **v5.0.0**: 人聲偵測架構（NSDF 基頻偵測取代能量 VAD，解決「單音節無即時回應」與「敲螢幕過關」；零死區啟動、說完即判、內建聲音燈 HUD、設定頁靈敏度／單音節模式；mic-test 第 4 項）
- **v4.0.0**: 語音辨識系統全面重構（統一核心模組 SpeechModule、動態噪音底線、多候選比對、單音節強化、門檻=0 智慧模式、設定頁字詞庫與圖片裁切整合）
- **v3.12.0**: 失語症深度優化（錄音回放修復、我會唸按鈕、跳過按鈕、自動TTS讀題、單人練習模式、按鈕放大、延長換題時間）
- **v3.11.0**: 字詞庫與所有遊戲連動（sentence-generator.js、8 個遊戲動態化、customImage 支援）
- **v3.10.0**: 失語症可用性全面修復（SW快取補齊、競賽減速、按鈕放大、跳過按鈕、設定頁 Modal 化）
- **v3.9.0**: 語音即時回饋優化（VAD 強化震動、辨識中提示）+ iPad 選單溢出修正
- **v3.8.1**: 所有語音練習加入錄音回放
- **v3.8.0**: 語音辨識系統全面改進（VAD、聲音長度檢查）
- **v3.7.0**: 字詞庫管理系統升級
- **v3.6**: Level 1 遊戲更新，語音辨識升級
- **v3.5**: Safari 相容性修正、麥克風測試
- **v3.4**: 全面 UI 優化（23 個遊戲）

## 已知問題與注意事項

1. **Safari 語音辨識**: iOS Safari 的 Web Speech API 支援有限，需特別處理
2. **麥克風權限**: 首次使用需用戶授權，HTTPS 環境才能使用。iOS Safari 每個頁面都會再問一次；實測解法是 設定 → Safari → 麥克風 改為「允許」（首次指引卡、設定頁麥克風測試、郵輪／說話板起始畫面都有提醒）
3. **Service Worker 更新**: 修改檔案後需更新 `sw.js` 版本號觸發快取更新

## 部署

- **GitHub Pages**: 推薦，直接推送即部署
- **測試**: 本地使用 `python -m http.server 8000` 或 VS Code Live Server

## 對 Claude 的提醒

1. 這是一個教育應用，目標用戶是失語症患者和學齡前兒童
   - **鼓勵語與稱讚（「真聰明」「你好棒」「太棒了」）是刻意的，不要改成中性用語**（開發者 2026-09-29 指示）
2. 語音功能是核心，任何修改都要考慮語音辨識的穩定性
3. UI 要簡單直觀，按鈕要夠大
4. 保持程式碼簡潔，避免過度工程化
5. 每次修改後記得更新版本號
6. 新功能要同時更新 Service Worker 快取清單
