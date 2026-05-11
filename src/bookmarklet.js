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
    '.toolbar input{cursor:text;min-width:180px}',
    '.toolbar .status{margin-left:auto;font-size:12px;opacity:.7;align-self:center}',
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
    '<pre class="line-numbers"><code id="code" class="language-markup"></code></pre>',
    '</body></html>'
  ].join(''));
  d.close();

  w.__originalDom = originalSrc;
  w.__pageUrl = pageUrl;
  w.__rawSource = null;

  var init = function() {
    if (!w.Prism || !w.html_beautify) {
      setTimeout(init, 50);
      return;
    }

    var state = { view: 'dom', beautify: false, dark: true };
    var codeEl = d.getElementById('code');
    var status = d.getElementById('status');

    function render() {
      var raw = state.view === 'dom' ? w.__originalDom : (w.__rawSource || '載入中...');
      var text = state.beautify && raw !== '載入中...'
        ? w.html_beautify(raw, { indent_size: 2, wrap_line_length: 0, preserve_newlines: true })
        : raw;
      codeEl.textContent = text;
      w.Prism.highlightElement(codeEl);
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
          codeEl.textContent = '抓取失敗：' + e.message + '\n\n（可能是 CORS 或需要登入的頁面）';
        });
      } else {
        render();
      }
    };

    d.getElementById('btnBeautify').onclick = function() {
      state.beautify = !state.beautify;
      this.classList.toggle('active', state.beautify);
      render();
    };

    d.getElementById('btnTheme').onclick = function() {
      state.dark = !state.dark;
      d.body.className = state.dark ? 'dark' : 'light';
      this.textContent = state.dark ? 'Light' : 'Dark';
      d.getElementById('theme').href = state.dark
        ? 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css'
        : 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css';
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
  };
  init();
})();
