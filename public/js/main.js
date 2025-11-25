// public/js/main.js - dashboard logic (validation, create, list, delete, copy, sort)
(function () {
  const listEl = document.getElementById('linksContainer');
  const createBtn = document.getElementById('createBtn');
  const urlInput = document.getElementById('url');
  const codeInput = document.getElementById('code');
  const createMsg = document.getElementById('createMsg');
  const search = document.getElementById('search');
  const toast = document.getElementById('toast');
  const urlError = document.getElementById('urlError');
  const codeError = document.getElementById('codeError');
  const sortClicks = document.getElementById('sortClicks');

  let cache = [];
  let sortDesc = true;
  const CODE_REGEX = /^[A-Za-z0-9]{6,8}$/;

  function showToast(msg) {
    toast.innerText = msg;
    toast.style.display = 'block';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { toast.style.display = 'none'; }, 2200);
  }

  async function fetchLinks() {
    listEl.innerHTML = '<tr><td colspan="5" class="muted">Loading...</td></tr>';
    try {
      const res = await fetch('/api/links');
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      cache = Array.isArray(data) ? data : [];
      renderTable();
    } catch (e) {
      listEl.innerHTML = '<tr><td colspan="5" class="muted">Error loading links</td></tr>';
      console.error(e);
    }
  }

  function renderTable() {
    if (!cache.length) {
      listEl.innerHTML = '<tr><td colspan="5" class="muted">No links yet</td></tr>';
      return;
    }
    const q = (search.value || '').toLowerCase();
    let rows = cache.filter(r => (r.code||'').toLowerCase().includes(q) || (r.url||'').toLowerCase().includes(q));
    rows = rows.sort((a,b) => sortDesc ? b.clicks - a.clicks : a.clicks - b.clicks);
    listEl.innerHTML = rows.map(r => `
      <tr>
        <td><a href="/${r.code}" target="_blank" rel="noreferrer">${r.code}</a></td>
        <td><span class="truncate" title="${escapeHtml(r.url)}">${r.url}</span></td>
        <td>${r.clicks}</td>
        <td>${r.last_clicked ? new Date(r.last_clicked).toLocaleString() : 'never'}</td>
        <td class="actions">
          <button data-code="${r.code}" class="del">Delete</button>
          <button data-code="${r.code}" class="cpy">Copy</button>
          <a href="/code/${r.code}">Stats</a>
        </td>
      </tr>
    `).join('');
    attach();
  }

  function attach() {
    document.querySelectorAll('.del').forEach(b => b.onclick = () => handleDelete(b.dataset.code));
    document.querySelectorAll('.cpy').forEach(b => b.onclick = () => { navigator.clipboard.writeText(location.origin + '/' + b.dataset.code).then(()=>showToast('Copied')); });
  }

  async function handleDelete(code) {
    if (!confirm('Delete ' + code + '?')) return;
    try {
      const res = await fetch('/api/links/' + encodeURIComponent(code), { method: 'DELETE' });
      if (res.status === 204) {
        showToast('Deleted');
        fetchLinks();
      } else {
        const body = await safeJson(res);
        alert('Delete failed: ' + (body && body.error ? body.error : res.status));
      }
    } catch (e) { alert('Delete failed'); }
  }

  function safeJson(res) { return res.text().then(t => { try { return JSON.parse(t); } catch { return null; } }); }

  function escapeHtml(s){ if(!s) return ''; return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }

  async function handleCreate() {
    urlError.style.display = 'none'; codeError.style.display = 'none';
    const url = urlInput.value.trim();
    const code = codeInput.value.trim();
    if (!validateUrl(url)) { urlError.innerText = 'Enter a valid absolute URL (https://...)'; urlError.style.display = 'block'; return; }
    if (code && !CODE_REGEX.test(code)) { codeError.innerText = 'Code must be 6–8 alnum'; codeError.style.display = 'block'; return; }
    createBtn.disabled = true; createMsg.innerText = 'Saving...';
    try {
      const res = await fetch('/api/links', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ url, code: code || undefined }) });
      if (res.status === 201) {
        const data = await res.json();
        createMsg.innerText = 'Created: ' + location.origin + '/' + data.code;
        urlInput.value = ''; codeInput.value = '';
        showToast('Created ' + data.code);
        fetchLinks();
      } else if (res.status === 409) {
        const body = await safeJson(res);
        createMsg.innerText = 'Error: ' + (body && body.error ? body.error : 'Conflict');
      } else {
        const body = await safeJson(res);
        createMsg.innerText = 'Error: ' + (body && body.error ? body.error : 'Failed');
      }
    } catch (e) { createMsg.innerText = 'Network error'; }
    createBtn.disabled = false;
  }

  function validateUrl(s){ try { new URL(s); return true } catch { return false } }

  createBtn.addEventListener('click', handleCreate);
  search.addEventListener('input', renderTable);
  sortClicks.addEventListener('click', () => { sortDesc = !sortDesc; renderTable(); });

  fetchLinks();
})();
