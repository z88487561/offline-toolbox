# Offline Toolbox / 全能工具

https://z88487561.github.io/offline-toolbox/#image

一個純前端、可離線使用的工具箱，聚合多種常見媒體/文件處理功能，所有處理都在瀏覽器本機完成，不依賴後端服務。

這個專案以 Progressive Web App（PWA）方式提供，支援安裝到桌面/主畫面，且在離線環境中也可繼續使用。

## 功能總覽

主界面提供 7 個工具分頁：

- 圖片工具
  - 圖片轉檔（PNG / JPG / WEBP / BMP / GIF 等）
  - 壓縮與格式轉換
  - 支援 HEIC / HEIF / TIFF / RAW 等進階影像格式
- PDF 工具
  - PDF 預覽
  - 合併 / 拆分 / 轉檔相關處理
  - 依賴瀏覽器端 PDF 解析與生成能力
- 看圖及裁切塗鴉工具
  - 打開圖片進行檢視
  - 自由裁切與旋轉
  - 畫筆 / 標註 / 塗鴉標記
- 圖片合成工具
  - 多張圖片疊加合成
  - 透明度調整與拼接
  - 浮水印 / 版面組合
- QR Code 工具
  - 將 URL、文字或內容轉換為 QR Code
  - 支援下載圖片
- 影片播放器
  - 本機影片播放
  - 播放速度調整
  - 基本媒體預覽/控制
- 螢幕錄影
  - 使用 `getDisplayMedia()` 擷取桌面、視窗或分頁
  - 匯出影片檔

## 特色

- 100% 前端：不需要後端伺服器
- 離線可用：透過 Service Worker 快取資源
- 本機處理：圖片、PDF、影片資料不會上傳到第三方伺服器
- 安裝型 App：可安裝成桌面/手機應用
- 跨平台：適用於 Chrome / Edge / Safari / Firefox 等主流瀏覽器


## 專案結構

```text
offline-toolbox/
├── index.html              # 主入口與工具切換頁
├── manifest.webmanifest    # PWA manifest
├── sw.js                   # Service Worker，負責離線快取
├── README.md               # 專案說明
├── css/                    # 共用樣式（如有擴充）
├── icons/                  # App icon / PWA icon
├── lib/                    # 第三方函式庫
│   ├── cropper.js
│   ├── fabric.js
│   ├── heic2any.js
│   ├── jspdf.js
│   ├── kjua.js
│   ├── pako-inflate.js
│   ├── pdf-lib.js
│   ├── pdf.worker.js
│   ├── pdfjs.js
│   ├── sortable.js
│   └── utif.js
├── tools/
│   ├── image.html
│   ├── pdf.html
│   ├── viewer.html
│   ├── compose.html
│   ├── qr.html
│   ├── player.html
│   ├── record.html
│   ├── patch-image.js
│   ├── patch-pdf.js
│   ├── patch-compose.js
│   └── ...
└── ...
```

## 技術說明

- 前端框架：原生 HTML / CSS / JavaScript
- PWA：`manifest.webmanifest` + `service worker`
- 影像處理：UTIF、heic2any、cropper、Canvas
- PDF：PDF.js、PDF-lib、jsPDF
- QR Code：kjua
- 壓縮處理：pako

## 使用限制與相容性

部分功能依賴瀏覽器支援：

- 螢幕錄影：需要 `navigator.mediaDevices.getDisplayMedia()`
- HEIC / TIFF / RAW：需要相容的解碼能力與 WebAssembly 支援
- 安裝為 App：需以 HTTPS 或 localhost 服務執行

建議使用：

- Chrome / Edge 90+
- Safari 14+
- Firefox 88+

## 隱私與安全

本專案的設計目標是「本機處理」：

- 圖片、PDF、影片等資料在瀏覽器中處理
- 不會預設上傳到伺服器
- 會透過瀏覽器的本機快取與 Service Worker 做離線資源儲存

所以它很適合處理個人檔案、內部文件與敏感影像內容。
