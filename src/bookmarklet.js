(function() {
  var originalSrc = document.documentElement.outerHTML;
  var pageUrl = location.href;
  var w = window.open('about:blank');
  var d = w.document;

  d.write([
    '<!DOCTYPE html><html><head><meta charset="utf-8">',
    '<title>Source: ' + document.title + '</title>',
    '<link id="theme" rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css">',
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"><\/script>',
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/line-numbers/prism-line-numbers.min.js"><\/script>',
    '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/line-numbers/prism-line-numbers.min.css">',
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.14.9/beautify-html.min.js"><\/script>',
    '<style>',
    'body{margin:0;font-family:-apple-system,BlinkMacSystemFont,sans-serif;transition:background .2s}',
    'body.dark{background:#2d2d2d;color:#ccc}',
    'body.light{background:#fff;color:#222}',
    '.toolbar{position:sticky;top:0;display:flex;gap:8px;padding:10px;flex-wrap:wrap;border-bottom:1px solid;z-index:10}',
    'body.dark .toolbar{background:#1e1e1e;border-color:#444}',
    'body.light .toolbar{background:#f6f8fa;border-color:#ddd}',
    '.toolbar button,.toolbar input{padding:6px 12px;border:1px solid;border-radius:6px;font-size:13px;cursor:pointer}',
    'body.dark .toolbar button,body.dark .toolbar input{background:#333;color:#ccc;border-color:#555}',
    'body.light .toolbar button,body.light .toolbar input{background:#fff;color:#222;border-color:#ccc}',
    '.toolbar button.active{background:#0969da;color:#fff;border-color:#0969da}',
    '.toolbar button:disabled{opacity:.4;cursor:not-allowed}',
    '.toolbar input{cursor:text;min-width:180px}',
    '.toolbar .status{margin-left:auto;font-size:12px;opacity:.7;align-self:center}',
    '.warning{padding:10px 16px;background:#5c3a00;color:#ffd700;border-bottom:1px solid #7a5000;font-size:13px}',
    'body.light .warning{background:#fff3cd;color:#664d03;border-color:#ffecb5}',
    'pre{margin:0;padding:16px;white-space:pre-wrap;word-break:break-word;font-size:13px;font-family:Menlo,Consolas,monospace}',
    'pre[class*="language-"]{margin:0;padding:16px;white-space:pre-wrap;word-break:break-word;font-size:13px}',
    'mark{background:#ffd54f;color:#000;border-radius:2px}',
    '</style></head><body class="dark">',
    '<div class="toolbar">',
    '  <button id="btnDom" class="active">DOM</button>',
    '  <button id="btnSrc">Source</button>',
    '  <button id="btnBeautify">Beautify</button>',
    '  <button id="btnTheme">Light</button>',
    '  <button id="btnCopy">Copy</button>',
    '  <input id="search" type="search" placeholder="Search...">',
    '  <span class="status" id="status"></span>',
    '</div>',
    '<div id="warning" class="warning" style="display:none"></div>',
    '<pre id="codeWrap" class="line-numbers"><code id="code" class="language-markup"></code></pre>',
    '</body></html>'
  ].join(''));
  d.close();

  w.__originalDom = originalSrc;
  w.__pageUrl = pageUrl;
  w.__rawSource = null;

  var startTime = Date.now();
  var TIMEOUT_MS = 2000;

  var init = function() {
    var hasPrism = !!w.Prism;
    var hasBeautify = !!w.html_beautify;
    var elapsed = Date.now() - startTime;

    // 都載完了，正常啟動
    if (hasPrism && hasBeautify) {
      start({ prism: true, beautify: true });
      return;
    }

    // 還沒 timeout，繼續等
    if (elapsed < TIMEOUT_MS) {
      setTimeout(init, 50);
      return;
    }

    // Timeout 了，走降級模式
    start({ prism: hasPrism, beautify: hasBeautify });
  };

  function start(caps) {
    var state = { view: 'dom', beautify: false, dark: true };
    var codeEl = d.getElementById('code');
    var codeWrap = d.getElementById('codeWrap');
    var status = d.getElementById('status');
    var warning = d.getElementById('warning');
    var btnBeautify = d.getElementById('btnBeautify');

    // 顯示降級警告
    if (!caps.prism || !caps.beautify) {
      var missing = [];
      if (!caps.prism) missing.push('語法高亮');
      if (!caps.beautify) missing.push('美化');
      warning.style.display = 'block';
      warning.textContent = '⚠️ 此頁面的 CSP 阻擋了外部資源載入，已停用：' + missing.join('、') + '。原始碼仍可正常檢視、搜尋、複製。';
    }

    // 如果 Prism 沒載入，把 <code> 換成純 <pre>，避免出現空 code 元素
    if (!caps.prism) {
      codeWrap.className = '';
      codeWrap.removeAttribute('class');
    }

    // Beautify 沒載入就停用按鈕
    if (!caps.beautify) {
      btnBeautify.disabled = true;
      btnBeautify.title = 'CSP 阻擋，無法載入 beautify 函式庫';
    }

    function render() {
      var raw = state.view === 'dom' ? w.__originalDom : (w.__rawSource || '載入中...');
      var text = (state.beautify && caps.beautify && raw !== '載入中...')
        ? w.html_beautify(raw, { indent_size: 2, wrap_line_length: 0, preserve_newlines: true })
        : raw;
      codeEl.textContent = text;
      if (caps.prism) {
        w.Prism.highlightElement(codeEl);
      }
      status.textContent = text.split('\n').length + ' lines, ' + text.length + ' chars';
      applySearch();
    }

    function applySearch() {
      var q = d.getElementById('search').value;
      if (!q) return;
      var safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var walker = d.createTreeWalker(codeEl, 4, null);
      var nodes = [], n;
      while (n = walker.nextNode()) nodes.push(n);
      var count = 0;
      nodes.forEach(function(node) {
        var t = node.nodeValue;
        if (t.toLowerCase().indexOf(q.toLowerCase()) === -1) return;
        var span = d.createElement('span');
        span.innerHTML = t
          .replace(/[<>&]/g, function(ch) { return {'<':'&lt;','>':'&gt;','&':'&amp;'}[ch]; })
          .replace(new RegExp(safe, 'gi'), function(m) {
            count++;
            return '<mark>' + m + '</mark>';
          });
        node.parentNode.replaceChild(span, node);
      });
      status.textContent = count + ' matches';
    }

    d.getElementById('btnDom').onclick = function() {
      state.view = 'dom';
      this.classList.add('active');
      d.getElementById('btnSrc').classList.remove('active');
      render();
    };
    d.getElementById('btnSrc').onclick = function() {
      state.view = 'src';
      this.classList.add('active');
      d.getElementById('btnDom').classList.remove('active');
      if (w.__rawSource === null) {
        codeEl.textContent = '正在 fetch 原始 HTML...';
        fetch(w.__pageUrl).then(function(r) { return r.text(); }).then(function(t) {
          w.__rawSource = t;
          render();
        }).catch(function(e) {
          codeEl.textContent = '抓取失敗：' + e.message + '\n\n（可能是 CORS、CSP connect-src 限制或需要登入）';
        });
      } else {
        render();
      }
    };

    btnBeautify.onclick = function() {
      if (this.disabled) return;
      state.beautify = !state.beautify;
      this.classList.toggle('active', state.beautify);
      render();
    };

    d.getElementById('btnTheme').onclick = function() {
      state.dark = !state.dark;
      d.body.className = state.dark ? 'dark' : 'light';
      this.textContent = state.dark ? 'Light' : 'Dark';
      if (caps.prism) {
        d.getElementById('theme').href = state.dark
          ? 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css'
          : 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css';
      }
    };

    d.getElementById('btnCopy').onclick = function() {
      var t = codeEl.textContent;
      w.navigator.clipboard.writeText(t).then(function() {
        status.textContent = '已複製 ' + t.length + ' 字元';
      });
    };

    var timer;
    d.getElementById('search').oninput = function() {
      clearTimeout(timer);
      timer = setTimeout(render, 200);
    };

    render();
  }

  init();
})();