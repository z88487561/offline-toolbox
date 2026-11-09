/* 內建版面微調（原本由外殼注入；現在在工具頁內自行套用，不受 file:// 跨框架限制） */
(function(){
window.__frame={dataset:{},contentDocument:document};
function installPdfEnhancements() {
            const frame = window.__frame;
            if (!frame || frame.dataset.enhancementsInstalled) return;
            const doc = frame.contentDocument;
            if (!doc || !doc.body || !doc.getElementById('mainFile') || !doc.defaultView.PDFLib) return;
            frame.dataset.enhancementsInstalled = 'true';
            const style = doc.createElement('style');
            style.textContent = `
                html, body { width:100%; height:100%; min-height:0; }
                body { overflow:hidden; }
                #sidebar { width:min(390px, 42vw); min-width:280px; padding:12px; overflow-y:auto; overscroll-behavior:contain; }
                #sidebar > .tool-group { padding:0 !important; margin:0 0 8px !important; border-radius:12px !important; box-shadow:none !important; overflow:hidden; }
                .compact-pdf-section > summary { display:flex; align-items:center; min-height:44px; padding:10px 12px; cursor:pointer; font-weight:700; color:#1e293b; list-style:none; }
                .compact-pdf-section > summary::-webkit-details-marker { display:none; }
                .compact-pdf-section > summary::after { content:'＋'; margin-left:auto; color:#64748b; }
                .compact-pdf-section[open] > summary::after { content:'－'; }
                .compact-pdf-content { padding:0 12px 12px; }
                .tool-group h3 { margin:0 !important; padding:0 !important; border:0 !important; font-size:15px !important; }
                .compact-pdf-content h3 { margin:4px 0 10px !important; }
                .compact-pdf-content label { margin:6px 0 4px !important; font-size:13px; }
                .enhancement-controls { display:grid; gap:6px; margin:8px 0; }
                .enhancement-controls label { display:block; margin:2px 0; }
                .enhancement-controls input[type="text"], .enhancement-controls input[type="number"],
                .enhancement-controls select { width:100%; box-sizing:border-box; }
                .enhancement-controls .inline { display:flex; gap:8px; align-items:center; }
                .enhancement-controls .inline > * { flex:1; min-width:0; }
                .enhancement-controls .hint { display:none; }
                #sidebar input:not([type="range"]), #sidebar select { min-width:0; min-height:42px; padding:8px 10px !important; font-size:16px; }
                #sidebar button { min-height:42px; padding:8px 12px !important; margin:4px 0; }
                #sidebar hr { margin:8px 0 !important; }
                #fileInfo { margin-top:6px; overflow-wrap:anywhere; }
                @media (max-width:850px) {
                    body { flex-direction:column-reverse; }
                    #sidebar { width:100%; min-width:0; height:54%; max-height:54%; flex:none; padding:8px; }
                    #preview-area { width:100%; height:46%; flex:none; }
                    .page-wrapper { width:calc(100% - 16px); margin:8px auto; }
                    .compact-pdf-content { padding:0 10px 10px; }
                }
            `;
            doc.head.appendChild(style);
            const injected = doc.createElement('script');
            injected.textContent = String.raw`(() => {
                const byId = id => document.getElementById(id);
                const PDFDocument = PDFLib.PDFDocument;
                const degrees = PDFLib.degrees;
                let activeDoc = null;
                let loadVersion = 0;

                function requireDoc() {
                    if (!activeDoc) throw new Error('請先載入 PDF 檔案');
                    return activeDoc;
                }

                function pagesFromInput(value, pageCount, allowEmpty) {
                    const input = value.trim();
                    if (!input && allowEmpty) return [];
                    if (!input) throw new Error('請輸入頁碼');
                    const pages = [];
                    const seen = new Set();
                    for (const part of input.split(',')) {
                        const match = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
                        if (!match) throw new Error('頁碼格式錯誤，請使用 1, 3, 5-8');
                        const start = Number(match[1]);
                        const end = match[2] ? Number(match[2]) : start;
                        if (start < 1 || end > pageCount || end < start) throw new Error('頁碼超出範圍或順序錯誤');
                        for (let page = start; page <= end; page++) {
                            if (seen.has(page)) throw new Error('頁碼不可重複');
                            seen.add(page);
                            pages.push(page - 1);
                        }
                    }
                    return pages;
                }

                function makeLabel(text, fontSize) {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    ctx.font = '600 ' + fontSize + 'px "Microsoft JhengHei", "Noto Sans TC", sans-serif';
                    const width = Math.ceil(ctx.measureText(text).width) + 24;
                    canvas.width = width;
                    canvas.height = Math.ceil(fontSize * 1.8);
                    ctx.font = '600 ' + fontSize + 'px "Microsoft JhengHei", "Noto Sans TC", sans-serif';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#555555';
                    ctx.fillText(text, 12, canvas.height / 2);
                    return canvas;
                }

                function placeVisualImage(page, image, visualCenterX, visualCenterY, visualWidth, visualHeight, opacity, extraAngle) {
                    const size = page.getSize();
                    const rotation = ((page.getRotation().angle % 360) + 360) % 360;
                    const width = rotation % 180 === 0 ? visualWidth : visualHeight;
                    const height = rotation % 180 === 0 ? visualHeight : visualWidth;
                    let centerX = visualCenterX, centerY = visualCenterY;
                    if (rotation === 90) {
                        centerX = size.width - visualCenterY;
                        centerY = visualCenterX;
                    } else if (rotation === 180) {
                        centerX = size.width - visualCenterX;
                        centerY = size.height - visualCenterY;
                    } else if (rotation === 270) {
                        centerX = visualCenterY;
                        centerY = size.height - visualCenterX;
                    }
                    page.drawImage(image, {
                        x: centerX - width / 2,
                        y: centerY - height / 2,
                        width,
                        height,
                        opacity,
                        rotate: degrees(extraAngle - rotation)
                    });
                }

                function updatePreview(doc) {
                    return window.updatePreview(doc);
                }

                async function withProgress(action) {
                    showLoad(true, '正在處理 PDF...');
                    try {
                        await action();
                    } catch (error) {
                        alert('執行失敗，原因: ' + error.message);
                    } finally {
                        showLoad(false);
                    }
                }

                function addGroup(title, markup, after) {
                    const group = document.createElement('section');
                    group.className = 'tool-group enhancement-controls';
                    group.innerHTML = '<h3>' + title + '</h3>' + markup;
                    after.parentNode.insertBefore(group, after.nextSibling);
                    return group;
                }

                const mainFile = byId('mainFile');
                mainFile.onchange = async () => {
                    const version = ++loadVersion;
                    const file = mainFile.files && mainFile.files[0];
                    activeDoc = null;
                    currentPdfDoc = null;
                    currentRawBuffer = null;
                    if (!file) return;
                    showLoad(true, '正在載入 PDF...');
                    try {
                        const buffer = await file.arrayBuffer();
                        const pdf = await PDFDocument.load(buffer);
                        if (version !== loadVersion) return;
                        activeDoc = pdf;
                        currentPdfDoc = pdf;
                        currentRawBuffer = buffer;
                        currentFileName = file.name.replace(/\.[^/.]+$/, '');
                        byId('fileInfo').textContent = '✅ ' + file.name + '（' + pdf.getPageCount() + ' 頁）';
                        await updatePreview(pdf);
                    } catch (error) {
                        if (version === loadVersion) byId('fileInfo').textContent = '⚠️ PDF 無法開啟（可能加密或檔案損毀）';
                    } finally {
                        if (version === loadVersion) showLoad(false);
                    }
                };

                const rotateScope = byId('rotateScope');
                rotateScope.innerHTML = '<option value="all">全部頁面</option><option value="specific">指定頁面</option><option value="odd">奇數頁</option><option value="even">偶數頁</option>';
                const rotatePageGroup = byId('rotatePageGroup');
                rotatePageGroup.innerHTML = '<input type="text" id="rotatePageIdx" placeholder="頁碼，例如 1, 3, 5-8">';
                const rotateButton = rotatePageGroup.parentElement.querySelector('button[onclick*="applyRotatePreview"]');
                rotateButton.textContent = '套用所選旋轉（預覽）';
                const rotateOptions = document.createElement('div');
                rotateOptions.className = 'inline';
                rotateOptions.innerHTML = '<select id="rotateDegrees" aria-label="旋轉角度"><option value="90">↻ 順時針 90°</option><option value="-90">↺ 逆時針 90°</option><option value="180">🔄 旋轉 180°</option></select>';
                rotatePageGroup.parentNode.insertBefore(rotateOptions, rotateButton);
                window.toggleRotateInput = () => {
                    rotatePageGroup.style.display = rotateScope.value === 'specific' ? 'block' : 'none';
                };
                rotateScope.onchange = window.toggleRotateInput;
                window.toggleRotateInput();
                window.applyRotatePreview = async () => withProgress(async () => {
                    const pdf = requireDoc();
                    const pages = pdf.getPages();
                    const scope = rotateScope.value;
                    let indices;
                    if (scope === 'specific') {
                        indices = pagesFromInput(byId('rotatePageIdx').value, pages.length, false);
                    } else {
                        indices = pages.map((_, index) => index).filter(index =>
                            scope === 'all' || (scope === 'odd' && index % 2 === 0) || (scope === 'even' && index % 2 === 1)
                        );
                    }
                    const angle = Number(byId('rotateDegrees').value);
                    indices.forEach(index => {
                        const current = pages[index].getRotation().angle;
                        pages[index].setRotation(degrees(((current + angle) % 360 + 360) % 360));
                    });
                    currentPdfDoc = pdf;
                    activeDoc = pdf;
                    await updatePreview(pdf);
                    byId('downloadRotateBtn').style.display = 'block';
                });

                const numberButton = document.querySelector('button[onclick*="number"]');
                const numberOptions = document.createElement('div');
                numberOptions.className = 'enhancement-controls';
                numberOptions.innerHTML = '<label>位置</label><select id="pageNumberPosition"><option value="center">置中</option><option value="right">靠右</option><option value="left">靠左</option></select><label>格式</label><select id="pageNumberFormat"><option value="full">第 X 頁 / 共 Y 頁</option><option value="fraction">X / Y</option><option value="dash">- X -</option><option value="plain">純數字 X</option></select>';
                numberButton.parentNode.insertBefore(numberOptions, numberButton);
                numberButton.textContent = '插入頁碼並下載';
                numberButton.onclick = () => withProgress(async () => {
                    const pdf = requireDoc();
                    const pages = pdf.getPages();
                    const position = byId('pageNumberPosition').value;
                    const format = byId('pageNumberFormat').value;
                    for (let index = 0; index < pages.length; index++) {
                        const text = format === 'full' ? '第 ' + (index + 1) + ' 頁 / 共 ' + pages.length + ' 頁' :
                            format === 'fraction' ? (index + 1) + ' / ' + pages.length :
                            format === 'dash' ? '- ' + (index + 1) + ' -' : String(index + 1);
                        const canvas = makeLabel(text, 12);
                        const image = await pdf.embedPng(canvas.toDataURL('image/png'));
                        const size = pages[index].getSize();
                        const rotated = Math.abs(pages[index].getRotation().angle % 180) === 90;
                        const visualWidth = rotated ? size.height : size.width;
                        const visualHeight = rotated ? size.width : size.height;
                        const width = canvas.width, height = canvas.height;
                        const x = position === 'left' ? 28 + width / 2 :
                            position === 'right' ? visualWidth - 28 - width / 2 : visualWidth / 2;
                        placeVisualImage(pages[index], image, x, 20 + height / 2, width, height, 1, 0);
                    }
                    window.downloadBlob(await pdf.save(), currentFileName + '-numbered.pdf');
                });

                const optimizeGroup = numberButton.closest('.tool-group');
                const compressButton = optimizeGroup.querySelector('button[onclick*="compress"]');
                const compressOptions = document.createElement('div');
                compressOptions.className = 'enhancement-controls';
                compressOptions.innerHTML = '<label>壓縮模式</label><select id="compressionMode"><option value="smart">智慧無損（保留文字與向量）</option><option value="raster">掃描檔極限壓縮（轉圖片）</option></select><label>掃描檔品質：<span id="compressionQualityLabel">75</span>%</label><input id="compressionQuality" type="range" min="20" max="100" step="5" value="75"><div class="hint">智慧模式會重新封裝 PDF 並保留可搜尋文字；掃描模式將頁面轉成 JPEG，品質越高越清晰、檔案也較大。</div>';
                compressButton.parentNode.insertBefore(compressOptions, compressButton);
                byId('compressionQuality').oninput = () => {
                    byId('compressionQualityLabel').textContent = byId('compressionQuality').value;
                };
                compressButton.textContent = '執行 PDF 壓縮';
                compressButton.onclick = () => withProgress(async () => {
                    const pdf = requireDoc();
                    if (byId('compressionMode').value === 'smart') {
                        window.downloadBlob(await pdf.save({ useObjectStreams: true, objectsPerTick: 50 }), currentFileName + '-optimized.pdf');
                        return;
                    }
                    const source = await pdfjsLib.getDocument({ data: await pdf.save() }).promise;
                    const output = await PDFDocument.create();
                    const quality = Number(byId('compressionQuality').value) / 100;
                    for (let index = 1; index <= source.numPages; index++) {
                        const page = await source.getPage(index);
                        const viewport = page.getViewport({ scale: 1.5 });
                        const canvas = document.createElement('canvas');
                        canvas.width = Math.ceil(viewport.width);
                        canvas.height = Math.ceil(viewport.height);
                        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
                        const blob = await new Promise((resolve, reject) =>
                            canvas.toBlob(result => result ? resolve(result) : reject(new Error('掃描頁面輸出失敗')), 'image/jpeg', quality)
                        );
                        const image = await output.embedJpg(new Uint8Array(await blob.arrayBuffer()));
                        const outputPage = output.addPage([viewport.width, viewport.height]);
                        outputPage.drawImage(image, { x: 0, y: 0, width: viewport.width, height: viewport.height });
                    }
                    window.downloadBlob(await output.save(), currentFileName + '-compressed.pdf');
                });

                const loadingGroup = byId('mainFile').closest('.tool-group');
                const extractGroup = addGroup('提取指定頁面', '<label for="extractPages">頁碼（例如 1, 3, 5-8, 12）</label><input id="extractPages" type="text" placeholder="1, 3, 5-8, 12"><button id="extractPagesButton">提取並下載新 PDF</button>', loadingGroup);
                byId('extractPagesButton').onclick = () => withProgress(async () => {
                    const source = requireDoc();
                    const indices = pagesFromInput(byId('extractPages').value, source.getPageCount(), false);
                    const output = await PDFDocument.create();
                    const copied = await output.copyPages(source, indices);
                    copied.forEach(page => output.addPage(page));
                    window.downloadBlob(await output.save(), currentFileName + '-extracted.pdf');
                });

                const watermarkGroup = addGroup('文字浮水印', '<label for="watermarkText">浮水印文字</label><input id="watermarkText" type="text" placeholder="僅供 XX 申請使用、機密文件"><div class="inline"><label>角度<select id="watermarkAngle"><option value="-45">傾斜 -45°</option><option value="0">水平 0°</option></select></label><label>模式<select id="watermarkMode"><option value="center">頁面中央大浮水印</option><option value="tile">全頁重複平鋪</option></select></label></div><label>透明度：<span id="watermarkOpacityLabel">20</span>%</label><input id="watermarkOpacity" type="range" min="5" max="60" value="20"><label>字型大小：<span id="watermarkSizeLabel">48</span></label><input id="watermarkSize" type="range" min="16" max="120" value="48"><button id="watermarkButton">套用浮水印並下載</button>', extractGroup);
                byId('watermarkOpacity').oninput = () => { byId('watermarkOpacityLabel').textContent = byId('watermarkOpacity').value; };
                byId('watermarkSize').oninput = () => { byId('watermarkSizeLabel').textContent = byId('watermarkSize').value; };
                byId('watermarkButton').onclick = () => withProgress(async () => {
                    const text = byId('watermarkText').value.trim();
                    if (!text) throw new Error('請輸入浮水印文字');
                    const pdf = requireDoc();
                    const canvas = makeLabel(text, Number(byId('watermarkSize').value));
                    const image = await pdf.embedPng(canvas.toDataURL('image/png'));
                    const opacity = Number(byId('watermarkOpacity').value) / 100;
                    const angle = Number(byId('watermarkAngle').value);
                    for (const page of pdf.getPages()) {
                        const size = page.getSize();
                        const rotated = Math.abs(page.getRotation().angle % 180) === 90;
                        const visualWidth = rotated ? size.height : size.width;
                        const visualHeight = rotated ? size.width : size.height;
                        const width = Math.min(canvas.width, visualWidth * 0.9);
                        const height = width * canvas.height / canvas.width;
                        if (byId('watermarkMode').value === 'center') {
                            placeVisualImage(page, image, visualWidth / 2, visualHeight / 2, width, height, opacity, angle);
                        } else {
                            const stepX = Math.max(width * 1.8, 100);
                            const stepY = Math.max(height * 2.5, 90);
                            for (let y = -stepY; y <= visualHeight + stepY; y += stepY) {
                                for (let x = -stepX; x <= visualWidth + stepX; x += stepX) {
                                    placeVisualImage(page, image, x, y, width, height, opacity, angle);
                                }
                            }
                        }
                    }
                    window.downloadBlob(await pdf.save(), currentFileName + '-watermarked.pdf');
                });

                const reorderGroup = addGroup('頁面倒序 / 自訂重排', '<button id="reversePagesButton">整份倒序並下載</button><label for="pageOrder">自訂頁碼順序（需包含每頁一次，例如 3, 1, 2）</label><input id="pageOrder" type="text" placeholder="3, 1, 2, 4-6"><button id="reorderPagesButton">依指定順序輸出</button>', watermarkGroup);
                byId('reversePagesButton').onclick = () => withProgress(async () => {
                    const source = requireDoc();
                    const output = await PDFDocument.create();
                    const indices = source.getPageIndices().reverse();
                    const copied = await output.copyPages(source, indices);
                    copied.forEach(page => output.addPage(page));
                    window.downloadBlob(await output.save(), currentFileName + '-reversed.pdf');
                });
                byId('reorderPagesButton').onclick = () => withProgress(async () => {
                    const source = requireDoc();
                    const indices = pagesFromInput(byId('pageOrder').value, source.getPageCount(), false);
                    if (indices.length !== source.getPageCount()) throw new Error('自訂順序必須包含全部頁面且每頁一次');
                    const output = await PDFDocument.create();
                    const copied = await output.copyPages(source, indices);
                    copied.forEach(page => output.addPage(page));
                    window.downloadBlob(await output.save(), currentFileName + '-reordered.pdf');
                });

                const sidebar = byId('sidebar');
                const rotateGroup = rotatePageGroup.closest('.tool-group');
                const splitGroup = byId('splitGap').closest('.tool-group');
                const mergeGroup = byId('mergeFiles').closest('.tool-group');
                const decryptGroup = byId('pdfPass').closest('.tool-group');
                const jpgButton = optimizeGroup.querySelector('button[onclick*="jpg"]');
                const pageNumberTitle = numberButton.closest('.tool-group').querySelector('h3');
                const pageNumberHeading = document.createElement('h3');
                pageNumberHeading.textContent = '插入頁碼';
                numberOptions.insertBefore(pageNumberHeading, numberOptions.firstChild);
                numberOptions.style.marginTop = '12px';
                optimizeGroup.append(compressOptions, compressButton, jpgButton, numberOptions, numberButton);
                numberButton.textContent = '插入並下載';
                compressButton.textContent = '執行壓縮';
                jpgButton.textContent = 'PDF 轉圖片';
                byId('splitGap').previousElementSibling.textContent = '每個檔案頁數';
                byId('delInput').previousElementSibling.textContent = '刪除頁碼';
                byId('mergeFiles').previousElementSibling.textContent = '選取 PDF';
                byId('pageOrder').previousElementSibling.textContent = '自訂頁序（需包含每頁一次）';
                byId('extractPages').previousElementSibling.textContent = '頁碼';
                byId('rotatePageIdx').placeholder = '頁碼，例如 1, 3-5';
                byId('watermarkText').placeholder = '輸入浮水印文字';
                pageNumberTitle.textContent = '優化與轉檔';

                const orderedGroups = [
                    loadingGroup, optimizeGroup, rotateGroup, splitGroup,
                    extractGroup, mergeGroup, decryptGroup, watermarkGroup, reorderGroup
                ];
                const compactTitles = [
                    '載入 PDF', '優化與轉檔', '頁面旋轉', '拆分與刪除',
                    '提取指定頁面', '多檔合併', '密碼解除', '文字浮水印', '頁面倒序 / 自訂重排'
                ];
                orderedGroups.forEach((group, index) => {
                    const heading = group.querySelector('h3');
                    const details = document.createElement('details');
                    details.className = 'compact-pdf-section';
                    details.open = index < 2;
                    const summary = document.createElement('summary');
                    summary.textContent = compactTitles[index];
                    const content = document.createElement('div');
                    content.className = 'compact-pdf-content';
                    Array.from(group.childNodes).forEach(node => {
                        if (node !== heading) content.appendChild(node);
                    });
                    details.append(summary, content);
                    group.replaceChildren(details);
                    sidebar.appendChild(group);
                });
            })();`;
            doc.body.appendChild(injected);
        }

function run(){try{installPdfEnhancements()}catch(e){console.warn('patch pdf',e)}}
if(document.readyState==='complete')run();else addEventListener('load',run);
})();
