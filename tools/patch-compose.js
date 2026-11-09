/* 內建版面微調（原本由外殼注入；現在在工具頁內自行套用，不受 file:// 跨框架限制） */
(function(){
window.__frame={dataset:{},contentDocument:document};
function removeCompositorRounding() {
            const frame = window.__frame;
            if (!frame || !frame.contentDocument || !frame.contentDocument.body) return;
            const doc = frame.contentDocument;
            if (doc.getElementById('square-compositor-style')) return;
            const style = doc.createElement('style');
            style.id = 'square-compositor-style';
            style.textContent = `
                html, body { width:100%; min-height:100%; height:auto; box-sizing:border-box; }
                *, *::before, *::after { box-sizing:border-box; }
                body { display:flex; align-items:stretch; padding:8px; overflow:auto; background:#f6f7f9 !important; color:#1e293b !important; }
                .main-ui { width:min(100%, 1200px); min-width:0; margin:0 auto; gap:10px; }
                .box { padding:14px !important; border-radius:12px !important; box-shadow:none !important; }
                .box h4 { margin-bottom:8px; font-size:15px; }
                .stage { min-height:180px !important; max-height:44vh !important; border-radius:0 !important; }
                #canvas-container { height:clamp(180px, 34vh, 360px); }
                #canvas-container .canvas-container { max-width:100% !important; max-height:100% !important; }
                #canvas-container canvas, #img-a, .stage img { max-width:100%; max-height:100%; object-fit:contain; border-radius:0 !important; }
                .btn-group { gap:6px; margin-top:8px; }
                button { min-height:42px; padding:8px !important; font-size:14px; }
                .setting-row { margin-top:8px; padding:8px; }
                .label { display:none; }
                @media (max-width:899px) {
                    body { padding:8px; }
                    .main-ui { flex-direction:column !important; gap:8px; }
                    .box { width:100%; min-width:0; padding:10px !important; }
                    .stage { min-height:160px !important; max-height:34vh !important; }
                    #canvas-container { height:30vh; min-height:160px; }
                }
            `;
            doc.head.appendChild(style);
            const headings = doc.querySelectorAll('.main-ui h4');
            if (headings[0]) headings[0].textContent = '裁切圖片';
            if (headings[1]) headings[1].textContent = '合成畫布';
        }

function run(){try{removeCompositorRounding()}catch(e){console.warn('patch compose',e)}}
if(document.readyState==='complete')run();else addEventListener('load',run);
})();
