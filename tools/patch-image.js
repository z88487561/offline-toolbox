/* 內建版面微調（原本由外殼注入；現在在工具頁內自行套用，不受 file:// 跨框架限制） */
(function(){
window.__frame={dataset:{},contentDocument:document};
function polishImageWorkstation() {
            const frame = window.__frame;
            if (!frame || !frame.contentDocument || !frame.contentDocument.body) return;
            const doc = frame.contentDocument;
            if (doc.getElementById('compact-image-workstation-style')) return;
            const style = doc.createElement('style');
            style.id = 'compact-image-workstation-style';
            style.textContent = `
                html, body { width:100%; height:100%; min-height:0; }
                body { display:flex; flex-direction:column; overflow:hidden; background:#f6f7f9 !important; color:#1e293b !important; }
                #main-view { display:none !important; }
                #sidebar { order:0; display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); align-content:start; gap:8px; width:min(1100px, 100%); max-width:100%; height:100%; min-height:0; margin:0 auto; padding:12px; overflow-y:auto; overscroll-behavior:contain; }
                .tool-group { min-width:0; padding:0 !important; margin:0 !important; border-radius:12px !important; box-shadow:none !important; overflow:hidden; }
                .compact-image-section > summary { display:flex; align-items:center; min-height:44px; padding:10px 12px; cursor:pointer; font-weight:700; color:#1e293b; list-style:none; }
                .compact-image-section > summary::-webkit-details-marker { display:none; }
                .compact-image-section > summary::after { content:'＋'; margin-left:auto; color:#64748b; }
                .compact-image-section[open] > summary::after { content:'－'; }
                .compact-image-content { padding:0 12px 12px; }
                #sidebar h3 { margin:0 !important; padding:0 !important; border:0 !important; font-size:15px !important; }
                #sidebar label { margin:6px 0 4px !important; font-size:13px !important; }
                #sidebar button { min-height:42px; margin:4px 0; padding:8px 10px !important; }
                #sidebar input:not([type='range']), #sidebar select { min-width:0; min-height:42px; padding:8px 10px !important; font-size:16px; }
                #sidebar .btn-row { gap:8px; }
                #sidebar .btn-row button { min-width:0; flex:1; }
                #sidebar hr { margin:8px 0 !important; }
                #loading { top:12px; left:50%; transform:translateX(-50%); padding:10px 16px; border-radius:10px; }
                @media (max-width:850px) {
                    #sidebar { display:block; width:100%; height:100dvh; max-height:100dvh; padding:8px; }
                    #sidebar > .tool-group { margin:0 0 8px !important; }
                    #sidebar .btn-row { flex-wrap:wrap; }
                    #sidebar .btn-row > * { min-width:0; }
                }
            `;
            doc.head.appendChild(style);

            const sidebar = doc.getElementById('sidebar');
            const groups = Array.from(sidebar.children).filter(child => child.classList.contains('tool-group'));
            if (groups.length < 2) return;
            const first = groups[0];
            const segments = [[]];
            let segmentIndex = 0;
            Array.from(first.childNodes).forEach(node => {
                if (node.nodeType === 1 && node.tagName === 'H3') return;
                if (node.nodeType === 1 && node.tagName === 'HR') {
                    segmentIndex++;
                    segments.push([]);
                    return;
                }
                if (node.nodeType === 3 && !node.textContent.trim()) return;
                segments[segmentIndex].push(node);
            });
            const titles = ['圖片轉檔', '圖片轉 PDF', '圖片拼接'];
            const fragment = doc.createDocumentFragment();
            segments.forEach((nodes, index) => {
                if (!nodes.length) return;
                const section = doc.createElement('details');
                section.className = 'tool-group compact-image-section';
                section.open = index <= 1;
                const summary = doc.createElement('summary');
                summary.textContent = titles[index] || '圖片工具';
                const content = doc.createElement('div');
                content.className = 'compact-image-content';
                nodes.forEach(node => content.appendChild(node));
                const formatHint = Array.from(content.children).find(element => element.textContent.includes('支援格式：'));
                if (formatHint) formatHint.remove();
                const label = content.querySelector('label');
                if (label) label.textContent = index === 0 ? '輸出格式／品質' : titles[index];
                const resolution = content.querySelector('#stitchResolution');
                if (resolution) {
                    const optionLabels = ['自動最佳', '1080P', '手機 1080', '原始尺寸'];
                    Array.from(resolution.options).forEach((option, optionIndex) => {
                        option.textContent = optionLabels[optionIndex] || option.textContent;
                    });
                }
                section.append(summary, content);
                fragment.appendChild(section);
            });
            first.replaceWith(fragment);

            const resizeGroup = groups[1];
            const resizeHeading = resizeGroup.querySelector('h3');
            const resizeSection = doc.createElement('details');
            resizeSection.className = 'tool-group compact-image-section';
            const resizeSummary = doc.createElement('summary');
            resizeSummary.textContent = '批次縮圖';
            const resizeContent = doc.createElement('div');
            resizeContent.className = 'compact-image-content';
            Array.from(resizeGroup.childNodes).forEach(node => {
                if (node !== resizeHeading) resizeContent.appendChild(node);
            });
            const widthInput = resizeContent.querySelector('#reWidth');
            const heightInput = resizeContent.querySelector('#reHeight');
            if (widthInput) widthInput.placeholder = '寬 (px)';
            if (heightInput) heightInput.placeholder = '高 (px)';
            resizeSection.append(resizeSummary, resizeContent);
            resizeGroup.replaceWith(resizeSection);
        }

function run(){try{polishImageWorkstation()}catch(e){console.warn('patch image',e)}}
if(document.readyState==='complete')run();else addEventListener('load',run);
})();
