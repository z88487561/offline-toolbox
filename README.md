# 全能工作站 PWA

## 部署（PWA 必須使用 HTTPS 或 localhost）
- GitHub Pages / Netlify / Cloudflare Pages：整個資料夾原樣上傳即可（子路徑也可用，所有路徑皆為相對路徑）。
- 本機測試：在此資料夾執行 `python -m http.server 8080`，開啟 http://localhost:8080
- 首次開啟後即預先快取全部檔案（約 4.3 MB），之後完全離線可用。

## 更新
修改任何檔案後，重新執行 stamp（或手動把 sw.js 內的 VERSION 改成新字串）→ 使用者下次開啟會看到「有新版本可用」。

## 結構
index.html 外殼｜sw.js 離線快取＋分享目標｜manifest.webmanifest｜tools/patch-*.js 原有的版面微調（內建於圖片/PDF/合成工具頁）
lib/ 共用函式庫（原本重複內嵌的 pdf-lib、cropper 只剩一份；PDF worker 還原為實體檔）｜tools/ 七個工具

注意：請用 http(s) 或 localhost 開啟；直接雙擊 index.html（file://）時 Service Worker、檔案分流與安裝功能都無法使用。
