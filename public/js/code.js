// public/js/code.js - stats page
(async function () {
  const el = document.getElementById('content');
  function getCode() {
    const p = location.pathname.split('/');
    return p[p.length-1] || p[p.length-2];
  }
  const code = getCode();
  if (!code) { el.innerText = 'Invalid code'; return; }
  try {
    const res = await fetch('/api/links/' + encodeURIComponent(code));
    if (res.status === 404) { el.innerText = 'Not found'; return; }
    if (!res.ok) { el.innerText = 'Error loading'; return; }
    const d = await res.json();
    el.innerHTML = `
      <p><strong>Code:</strong> ${escapeHtml(d.code)}</p>
      <p><strong>Short URL:</strong> <a href="/${escapeHtml(d.code)}">${location.origin}/${escapeHtml(d.code)}</a></p>
      <p><strong>Target URL:</strong> <a href="${escapeAttr(d.url)}" target="_blank" rel="noreferrer">${escapeHtml(d.url)}</a></p>
      <p><strong>Total clicks:</strong> ${d.clicks}</p>
      <p><strong>Last clicked:</strong> ${d.last_clicked ? new Date(d.last_clicked).toLocaleString() : 'never'}</p>
      <p class="muted">Created: ${new Date(d.created_at).toLocaleString()}</p>
    `;
  } catch (e) { el.innerText = 'Error loading stats'; }

  function escapeHtml(s){ if(!s) return ''; return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }
  function escapeAttr(s){ return escapeHtml(s).replace(/"/g,'&quot;'); }
})();
