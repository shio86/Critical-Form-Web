# Critical Form

放置質化研究課程報告的靜態網頁。左側是報告清單（可展開各段落標題），點選後右側顯示對應的 Markdown 內容。純前端、沒有後台，放在 GitHub Pages。

## 新增一篇文章（匯入 .md 檔）

1. 準備一個 `.md` 檔，檔名用英文與連字號，例如 `schon-reflective-practitioner.md`（檔名會變成網址的一部分）。
2. 檔案開頭可以加上文章資訊（選填）：

   ```md
   ---
   title: 論文標題
   subtitle: 作者 (年份)
   order: 3
   ---

   # 論文標題

   ### 作者全名

   ## 1. Title / Author(s)
   ...
   ```

   - `title`：左側清單顯示的標題。沒填的話用內文第一個 `#` 標題。
   - `subtitle`：左側清單的小字，沒填就不顯示。
   - `order`：排列順序，數字小的在上面。沒填的排在最後，依檔名排序。
   - 內文裡每個 `##` 標題，都會自動變成左側可點擊的段落錨點。

3. 到 GitHub 的存放庫，進入 `data/reports/` 資料夾 → 「Add file」→「Upload files」→ 拖進 `.md` 檔 →「Commit changes」。
4. 約 1 分鐘後網站自動更新（`.github/workflows/deploy.yml` 會重新產生 `data/index.json` 文章清單並發布）。

要修改文章，就在 GitHub 上點開該 `.md` 檔，按鉛筆圖示編輯後存檔；要刪除，就在該檔案的「…」選單選 Delete file。

## 本機預覽

文章是用 `fetch` 讀取的，直接雙擊 `index.html` 會讀不到。需要用本機伺服器開啟：

```bash
cd Critical-Form-Web
python3 -m http.server 8080
# 開瀏覽器到 http://localhost:8080
```

本機新增 `.md` 檔後，要自己把檔名加進 `data/index.json`（上傳到 GitHub 時會自動產生，不用手動改）。

## 檔案結構

```
index.html                     頁面結構
css/style.css                  樣式（側邊欄、鋸齒縫線、Markdown 排版）
js/app.js                      讀取文章、切換內容、段落錨點
js/config.js                   作者姓名 / 學號（顯示在側邊欄底部）
js/marked.min.js               Markdown 轉 HTML 的套件
data/index.json                文章檔名清單（發布時自動產生）
data/reports/*.md              每篇文章
.github/workflows/deploy.yml   自動發布到 GitHub Pages
assets/                        logo、縫線圖
```

## 關於設計稿

`../設計稿/` 裡的 SVG 是視覺設計參考稿（Figma 匯出）。網站的配色與版型是照設計稿用 CSS 還原的，設計稿更新時需要手動同步 `css/style.css`。
