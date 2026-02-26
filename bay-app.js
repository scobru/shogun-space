/* ===========================
   GunBay <-> GunSpace UI Integration
   =========================== */

(function () {
  'use strict';

  // We expose a short alias to gunbay instance
  let gb;
  let activeCategory = 'all';
  let searchQuery = '';

  const CAT_ICONS = {
    video: '🎬',
    audio: '🎵',
    software: '💾',
    games: '🎮',
    other: '📦'
  };

  function initBay() {
    if (window.GunBay && window.gun && window.state && window.gUser) {
      // Initialize GunBay using the existing gun instance from GunSpace
      gb = new window.GunBay({
        gun: window.gun, 
        onTorrentsUpdate: () => window.renderTorrents(),
        onFeedbackUpdate: () => window.renderTorrents(),
        onAuthUpdate: (user) => {
          // In GunSpace, auth is globally managed, but GunBay might trigger this
          window.renderTorrents();
        }
      });
      // Force sync with GunSpace current user if already logged in
      if (window.state && window.state.me) {
        gb.currentUser = { alias: window.state.me, pub: window.gUser._.sea.pub };
      }
    } else {
      setTimeout(initBay, 100);
    }
  }

  // Escape HTML helper
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Time ago helper from GunSpace can be used, or local
  function timeAgo(ts) {
    if (!ts) return '—';
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    const days = Math.floor(hrs / 24);
    if (days < 30) return days + 'd ago';
    const months = Math.floor(days / 30);
    return months + 'mo ago';
  }

  function isValidMagnet(str) {
    return /^magnet:\?xt=urn:[a-z0-9]+:[a-zA-Z0-9]+/i.test(str);
  }

  // Expose render function for GunSpace navigation
  window.renderTorrents = function() {
    if (!gb) return;
    
    // Sync user again just in case
    if (window.state && window.state.me && !gb.currentUser) {
       gb.currentUser = { alias: window.state.me, pub: window.gUser._.sea.pub };
    }

    const torrentList = document.getElementById('torrentList');
    const torrentCount = document.getElementById('torrentCount');
    if (!torrentList || !torrentCount) return;

    const entries = Object.entries(gb.allTorrents)
      .filter(([, t]) => t && t.name && t.magnet)
      .map(([id, t]) => ({ id, ...t }));

    let filtered = entries;
    if (activeCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === activeCategory);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    filtered.sort((a, b) => (b.uploadedAt || 0) - (a.uploadedAt || 0));

    torrentCount.textContent = filtered.length + ' torrent' + (filtered.length !== 1 ? 's' : '');

    if (filtered.length === 0) {
      torrentList.innerHTML = `
        <tr class="empty-row">
          <td colspan="6" style="text-align:center; padding: 20px; color:var(--fg-dim);">
            <div style="font-size:32px; opacity:0.5; margin-bottom:8px;">🏴‍☠️</div>
            ${searchQuery ? 'No results for "' + escapeHtml(searchQuery) + '"' : 'No torrents yet. Be the first pirate!'}
          </td>
        </tr>`;
      return;
    }

    torrentList.innerHTML = filtered
      .map((t) => {
        const fb = gb.getFeedbackCounts(t.id);
        const myVote = gb.getMyVote(t.id);
        const isOwner = gb.currentUser && t.ownerPub === gb.currentUser.pub;
        const scoreColor = fb.score > 0 ? 'var(--accent2)' : fb.score < 0 ? 'var(--danger)' : 'var(--fg-dim)';

        return `
      <tr data-id="${t.id}" style="border-bottom: 1px solid rgba(255,255,255,0.05);">
        <td style="padding:8px 4px; font-size:16px;">${CAT_ICONS[t.category] || '📦'}</td>
        <td style="padding:8px;">
          <span style="font-weight:bold; cursor:pointer;" onclick="window.openBayDetailPanel('${t.id}')">${escapeHtml(t.name)}</span>
          <span style="font-size:10px; padding:2px 4px; border:1px solid var(--border); border-radius:4px; margin-left:6px; color:var(--fg-dim);">${t.category || 'other'}</span>
          <br><span style="font-size:11px; color:var(--fg-dim);">by @${escapeHtml(t.uploadedBy || 'anon')}</span>
        </td>
        <td style="padding:8px; font-family:var(--font-mono);">${escapeHtml(t.size) || '—'}</td>
        <td style="padding:8px;">
          <div style="display:flex; gap:4px; align-items:center;">
            <button class="btn-sm ${myVote === 'up' ? 'text-accent' : ''}" style="padding:2px 4px;" onclick="window.bayVote('${t.id}','up')">👍 ${fb.up}</button>
            <button class="btn-sm ${myVote === 'down' ? 'text-danger' : ''}" style="padding:2px 4px;" onclick="window.bayVote('${t.id}','down')">👎 ${fb.down}</button>
            <span style="color:${scoreColor}; font-weight:bold; margin-left:4px;">${fb.score > 0 ? '+' : ''}${fb.score}</span>
          </div>
        </td>
        <td style="padding:8px; color:var(--fg-dim);">${timeAgo(t.uploadedAt)}</td>
        <td style="padding:8px; text-align:center; display:flex; gap:8px; justify-content:center; align-items:center;">
          <a href="${escapeHtml(t.magnet)}" style="text-decoration:none; font-size:18px;" title="Download">🧲</a>
          ${isOwner ? `<button class="btn-sm text-danger" style="padding:2px 6px; font-size:10px;" onclick="window.deleteBayTorrent('${t.id}')" title="Delete">🗑️</button>` : ''}
        </td>
      </tr>`;
      })
      .join('');
  };

  // Upload Modal
  window.openBayUploadModal = function() {
    if (!window.state || !window.state.me) {
      window.showToast('Login to GunSpace to upload torrents!');
      return;
    }
    document.getElementById('uploadModal').classList.add('show');
    document.getElementById('torrentName').focus();
  };

  window.closeBayUploadModal = function() {
    document.getElementById('uploadModal').classList.remove('show');
  };

  window.submitBayUpload = function() {
    if (!gb.currentUser && window.state && window.state.me) {
      gb.currentUser = { alias: window.state.me, pub: window.gUser._.sea.pub };
    }
    
    if (!gb.currentUser) {
      window.showToast('Login required!');
      return;
    }

    const name = document.getElementById('torrentName').value.trim();
    const magnet = document.getElementById('torrentMagnet').value.trim();
    const category = document.getElementById('torrentCategory').value;
    const size = document.getElementById('torrentSize').value.trim();
    const description = document.getElementById('torrentDesc').value.trim();

    if (!name || !magnet) {
      window.showToast('Name and magnet link are required!');
      return;
    }

    if (!isValidMagnet(magnet)) {
      window.showToast('Invalid magnet link! Must start with magnet:?xt=urn:...');
      return;
    }

    gb.uploadTorrent({
      name,
      magnet,
      category,
      size: size || null,
      description: description || null
    }, (ack) => {
      if (ack.err) {
        window.showToast('Error uploading: ' + ack.err);
      } else {
        document.getElementById('torrentName').value = '';
        document.getElementById('torrentMagnet').value = '';
        document.getElementById('torrentSize').value = '';
        document.getElementById('torrentDesc').value = '';
        window.closeBayUploadModal();
        window.showToast('Torrent shared successfully! 🏴‍☠️');
      }
    });
  };

  // Detail Panel
  window.openBayDetailPanel = function(id) {
    const t = gb.allTorrents[id];
    if (!t) return;
    const fb = gb.getFeedbackCounts(id);
    const myVote = gb.getMyVote(id);
    const isOwner = gb.currentUser && t.ownerPub === gb.currentUser.pub;
    const scoreColor = fb.score > 0 ? 'var(--accent2)' : fb.score < 0 ? 'var(--danger)' : 'var(--fg-dim)';

    const detailContent = document.getElementById('detailContent');
    detailContent.innerHTML = `
      <div style="font-family:var(--font-display);font-size:24px;color:var(--fg-bright);margin-bottom:8px;">${escapeHtml(t.name)}</div>
      <div style="display:flex; gap:16px; font-size:12px; color:var(--fg-dim); margin-bottom:16px;">
        <div>${CAT_ICONS[t.category] || '📦'} ${t.category || 'other'}</div>
        <div>📦 ${escapeHtml(t.size) || 'Unknown'}</div>
        <div>🕐 ${timeAgo(t.uploadedAt)}</div>
        <div>👤 @${escapeHtml(t.uploadedBy || 'anon')}</div>
      </div>

      <div style="padding:12px; background:var(--input-bg); border:1px solid var(--border); display:flex; gap:12px; align-items:center; margin-bottom:16px;">
        <button class="btn-sm ${myVote === 'up' ? 'text-accent' : ''}" onclick="window.bayVote('${id}','up'); window.openBayDetailPanel('${id}');">👍 Reliable (${fb.up})</button>
        <button class="btn-sm ${myVote === 'down' ? 'text-danger' : ''}" onclick="window.bayVote('${id}','down'); window.openBayDetailPanel('${id}');">👎 Fake (${fb.down})</button>
        <span style="color:${scoreColor}; font-weight:bold; margin-left:auto;">Score: ${fb.score > 0 ? '+' : ''}${fb.score}</span>
      </div>

      ${t.description ? `<div style="margin-bottom:16px; padding:12px; border-left:2px solid var(--border); color:var(--fg); font-size:13px;">${escapeHtml(t.description)}</div>` : ''}
      
      <div style="background:var(--bg); padding:8px; border:1px solid var(--border); margin-bottom:16px; font-family:var(--font-mono); font-size:10px; word-break:break-all; color:var(--text-accent);">
        ${escapeHtml(t.magnet)}
      </div>

      <div style="display:flex; gap:12px; align-items:center;">
        <a href="${escapeHtml(t.magnet)}" class="btn-primary" style="text-decoration:none;">🧲 OPEN MAGNET</a>
        <button class="btn-sm" onclick="navigator.clipboard.writeText('${escapeHtml(t.magnet)}').then(()=>window.showToast('Magnet link copied!'))">📋 COPY LINK</button>
        ${isOwner ? `<button class="btn-sm text-danger" style="margin-left:auto;" onclick="window.deleteBayTorrent('${id}')">🗑️ DELETE</button>` : ''}
      </div>
    `;

    document.getElementById('detailPanel').classList.add('show');
  };

  window.closeBayDetailPanel = function() {
    document.getElementById('detailPanel').classList.remove('show');
  };

  window.bayVote = function(id, direction) {
    if (!window.state || !window.state.me) {
      window.showToast('Login to vote!');
      return;
    }
    if (!gb.currentUser && window.state && window.state.me) {
      gb.currentUser = { alias: window.state.me, pub: window.gUser._.sea.pub };
    }
    gb.vote(id, direction);
  };

  window.deleteBayTorrent = function(id) {
    if (!gb.currentUser && window.state && window.state.me) {
      gb.currentUser = { alias: window.state.me, pub: window.gUser._.sea.pub };
    }
    if (confirm('Are you sure you want to delete this torrent?')) {
      gb.deleteTorrent(id, (ack) => {
        if (ack.err) {
          window.showToast('Error deleting: ' + ack.err);
        } else {
          window.closeBayDetailPanel();
          window.showToast('Torrent removed!');
        }
      });
    }
  };

  // Wait for DOM
  document.addEventListener('DOMContentLoaded', () => {
    // Search bindings
    const baySearch = document.querySelector('.bay-search input');
    if (baySearch) {
      baySearch.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        window.renderTorrents();
      });
    }

    // Category bindings
    document.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        activeCategory = e.target.dataset.cat;
        window.renderTorrents();
      });
    });

    initBay();
  });

})();
