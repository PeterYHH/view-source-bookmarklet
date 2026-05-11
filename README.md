# View Source Bookmarklet

一個給 Safari（也支援其他瀏覽器）用的書籤工具，點一下就能查看當前網頁的原始碼，支援語法高亮、行號、搜尋、DOM/Source 切換、深淺色主題。

## 功能

- 🎨 語法高亮（Prism.js）
- 🔢 行號顯示
- 🔍 即時搜尋（支援結果計數）
- 🔄 DOM / Source 雙模式切換
  - **DOM**：經過 JS 修改後的當前 DOM
  - **Source**：伺服器原始回傳的 HTML（透過 fetch）
- 🌓 深色 / 淺色主題切換
- ✨ Beautify 美化壓縮過的 HTML（預設關閉）
- 📋 一鍵複製

## 安裝

### iOS Safari

1. 隨便加任一個網頁到書籤
2. 進「書籤」→ 編輯剛建的書籤
3. 標題改成「查看原始碼」
4. 網址欄整個刪掉，貼上 [`dist/bookmarklet.min.js`](./dist/bookmarklet.min.js) 的內容
5. 存檔

### macOS Safari / Chrome / Firefox

把書籤列叫出來，新增書籤，網址欄貼上 `bookmarklet.min.js` 內容。

## 使用

在任何網頁點這個書籤即可。

## 開發

原始碼在 `src/bookmarklet.js`，是可讀的多行版本。
`dist/bookmarklet.min.js` 是壓縮後可直接當書籤用的一行版。

## 授權

MIT
