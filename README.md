# 全能工作站 (Omni-Workstation 2026) — 專案說明文件

## 📌 專案簡介

**全能工作站** 是一個基於 HTML5、CSS3 與 JavaScript 開發的純前端單頁式（Single Page Application, SPA）多功能多媒體工具箱。

雖然本專案非標準 PWA (Progressive Web App) 架構，但採用了**高整合度單一 HTML 檔案封裝**設計，將多個獨立的多媒體處理工具（如圖片編輯、PDF 工具、QR Code 生成器、影片播放器與螢幕錄影等）結合在統一的響應式選單介面中。內嵌大量前端高階處理庫（例如 `pako`、`UTIF`、`gifshot`、`heic2any` 以及編譯為 WebAssembly 的 `libde265`），實現無需伺服器端（Serverless）、所有資料與運算均在使用者本機瀏覽器端完成的安全操作體驗。

---

## 🛠️ 主要功能模組

工作站介面頂部提供頁籤切換（行動裝置自動轉換為下拉選單），包含以下 7 大核心工具模組：

1. **圖片工作站**
   * 支援高階與特殊格式圖片解碼（包含 TIFF, DNG, CR2, NEF 等 RAW 檔以及 HEIC/HEIF 格式）。
   * 提供多種圖檔格式轉換（含 GIF 動圖生成、解壓縮與處理）。
2. **PDF 工作站**
   * 提供 PDF 文件檢視、頁面拆分、合併與基本文字/表格欄位處理能力。
3. **看圖及裁切塗鴉工具**
   * 圖片預覽、旋轉、自由裁切。
   * 內建 Canvas 塗鴉畫布，支援手繪標記與標註繪製。
4. **圖片合成工具**
   * 支援多圖層疊加、透明度調整、圖案拼接與浮水印合成。
5. **網址轉 QR Code**
   * 快速將輸入之 URL 或純文字轉換為 QR Code 條碼圖檔並支援下載。
6. **影片播放器**
   * 支援本機影片檔案載入播放、播放速率控制與影音預覽。
7. **螢幕錄影**
   * 利用瀏覽器 `MediaDevices.getDisplayMedia()` API 實現全螢幕、應用程式視窗或分頁錄影，並可匯出影片檔。

---

## 🏗️ 技術架構與套件整合

本專案採用自包含（Self-contained）設計，直接將眾多高階 C/C++ 編譯庫與 JS 工具庫打包/內嵌於內文區塊中：

* **核心 UI / 佈局**：HTML5, CSS Flexbox / Media Queries 響應式佈局, Web Frontend iFrame 沙盒切換機制。
* **解壓縮與資料流 (Decompression & Streams)**：
  * **`pako`**：Zlib / Deflate 演算法之 JS 實作，用於解開圖檔壓縮資料。
* **影像處理庫 (Image Processing Libraries)**：
  * **`UTIF.js`**：Fast TIFF / EXIF / RAW 圖檔解碼與 RGBA8 轉碼器（包含 LZW、JPEG、Lossless JPEG、PackBits 等壓縮解碼支援）。
  * **`gifshot`**：GIF 動圖合成與影音幀擷取工具。
  * **`heic2any`**：將 Apple HEIC / HEIF 格式圖片轉碼為 JPEG/PNG 的純前端套件。
* **WebAssembly (Wasm) 與 C/C++ 轉譯模組**：
  * **`libde265.js` / Emscripten**：內嵌以 Emscripten 編譯的 `libde265` HEVC/H.265 C++ 解碼器，支援在瀏覽器中直接解碼 HEIF 高效能影像檔案。

---

## 🚀 使用說明與安裝方式

由於本專案為**單檔網頁應用**，無需複雜的開發環境建置或 Node.js / NPM 打包流程：

1. **取得檔案**：將網頁原始碼儲存為 `全能工作站20261103.html`（或任意 `.html` 檔名）。
2. **執行方式**：直接雙擊該 `.html` 檔案，或將其拖曳至任何現代主流瀏覽器（如 Google Chrome, Microsoft Edge, Safari, Firefox）即可立即開啟使用。
3. **離線使用**：開啟過後，即便在無網路連線（Offline）環境下，大部分本機運算功能（如圖片轉檔、塗鴉、QR Code、螢幕錄影等）仍可正常運作。

---

## 💻 瀏覽器相容性需求

* 建議使用 Chrome 90+ / Edge 90+ / Safari 14+ / Firefox 88+ 或更新版本。
* 部分功能需要瀏覽器提供相應 API 支援：
  * **螢幕錄影**：需要瀏覽器支援 `navigator.mediaDevices.getDisplayMedia`（通常不適用於 iOS 行動版瀏覽器）。
  * **HEIC/RAW 解碼**：需要瀏覽器支援 `WebAssembly` 及 `ArrayBuffer` 操作。

---

## 🔒 隱私與安全性說明

* **本機端處理（Zero-Server Storage）**：所有圖片、PDF 及影片處理過程全數在使用者瀏覽器的記憶體（Memory）與 Web Worker 中執行，**不會將任何資料上傳至第三方伺服器**，高度保障個人隱私與文件安全。