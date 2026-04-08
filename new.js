// ═══════════════════════════════════════════════════════════
//  TRACK CONFIG
// ═══════════════════════════════════════════════════════════
const TRACKS = [
  { name: "JEE / NEET Track", file: "data/JEE NEET Track.json",    icon: "ic-atom",        color: "ic-blue",   type: "exam" },
  { name: "Banking Track",    file: "data/Banking Track.json",      icon: "ic-bank",        color: "ic-green",  type: "exam" },
  { name: "Govt Exams Track", file: "data/Govt Exams Track.json",   icon: "ic-institution", color: "ic-orange", type: "exam" },
  { name: "Tech Track",       file: "data/tech track.json",         icon: "ic-cpu",         color: "ic-purple", type: "tech" },
];

// ═══════════════════════════════════════════════════════════
//  CATEGORY ICON / COLOUR CONFIG
// ═══════════════════════════════════════════════════════════
const CATEGORY_CONFIG = {
  "JEE — Joint Entrance Examination":              { icon: "ic-atom",        color: "ic-blue"   },
  "NEET — National Eligibility cum Entrance Test": { icon: "ic-stethoscope", color: "ic-green"  },
  "Banking":          { icon: "ic-bank",        color: "ic-green"  },
  "UPSC":             { icon: "ic-institution", color: "ic-orange" },
  "SSC":              { icon: "ic-award",       color: "ic-yellow" },
  "Railways":         { icon: "ic-train",       color: "ic-yellow" },
  "Defence":          { icon: "ic-shield",      color: "ic-red"    },
  "Insurance":        { icon: "ic-coins",       color: "ic-teal"   },
  "PSU":              { icon: "ic-gear",        color: "ic-indigo" },
  "State PSC":        { icon: "ic-layers",      color: "ic-orange" },
  "State PSC / State Exams": { icon: "ic-layers", color: "ic-orange" },
  "Teaching":         { icon: "ic-courses",     color: "ic-yellow" },
  "Judiciary":        { icon: "ic-briefcase",   color: "ic-teal"   },
  "Healthcare":       { icon: "ic-heartpulse",  color: "ic-green"  },
  "Central Police":   { icon: "ic-shield",      color: "ic-red"    },
  "Technical":        { icon: "ic-wrench",      color: "ic-indigo" },
  "State Generic":    { icon: "ic-globe",       color: "ic-purple" },
  "Other":            { icon: "ic-layers",      color: "ic-purple" },
  "DSA — Data Structures & Algorithms": { icon: "ic-layers", color: "ic-purple" },
  "Domain-Based":     { icon: "ic-cpu",         color: "ic-indigo" },
};

function getCfg(category) {
  if (!category) return { icon: "ic-globe", color: "ic-purple" };
  if (CATEGORY_CONFIG[category]) return CATEGORY_CONFIG[category];
  const lower = category.toLowerCase();
  if (lower.includes('jee'))      return { icon: "ic-atom",        color: "ic-blue"   };
  if (lower.includes('neet'))     return { icon: "ic-stethoscope", color: "ic-green"  };
  if (lower.includes('bank'))     return { icon: "ic-bank",        color: "ic-green"  };
  if (lower.includes('upsc'))     return { icon: "ic-institution", color: "ic-orange" };
  if (lower.includes('ssc'))      return { icon: "ic-award",       color: "ic-yellow" };
  if (lower.includes('rail'))     return { icon: "ic-train",       color: "ic-yellow" };
  if (lower.includes('defence'))  return { icon: "ic-shield",      color: "ic-red"    };
  if (lower.includes('insur'))    return { icon: "ic-coins",       color: "ic-teal"   };
  if (lower.includes('psu'))      return { icon: "ic-gear",        color: "ic-indigo" };
  if (lower.includes('state'))    return { icon: "ic-layers",      color: "ic-orange" };
  if (lower.includes('tech'))     return { icon: "ic-cpu",         color: "ic-indigo" };
  if (lower.includes('polic'))    return { icon: "ic-shield",      color: "ic-red"    };
  return { icon: "ic-globe", color: "ic-purple" };
}

// ═══════════════════════════════════════════════════════════
//  DOM REFS
// ═══════════════════════════════════════════════════════════
const tabsContainer = document.getElementById('tabs-container');
const contentArea   = document.getElementById('content-area');

// ═══════════════════════════════════════════════════════════
//  API CONFIG
// ═══════════════════════════════════════════════════════════
const API_BASE = ""; // Use relative paths for deployment

// ═══════════════════════════════════════════════════════════
//  APP STATE
// ═══════════════════════════════════════════════════════════
const loadedData = {};
let currentExam = "";
let currentYear = "";
let currentCategory = "";
let apiProgress = null;

function _getUpdated(eName) {
   if (!apiProgress || !apiProgress.exams || !eName) return 0;
   const map = apiProgress.exams;
   if (map[eName]) return map[eName];

   const searchName = eName.toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
   
   for (let k in map) {
      const keyName = k.toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
      if (keyName === searchName) return map[k];
      if (searchName.includes(keyName) && keyName.length >= 2) return map[k];
      if (keyName.includes(searchName) && searchName.length >= 2) return map[k];
   }
   return 0;
}

// Helper: get per-exam target year count
function _getTarget(eName) {
   if (!apiProgress || !apiProgress.examTargets || !eName) return 15;
   const map = apiProgress.examTargets;
   if (map[eName]) return map[eName];
   const searchName = eName.toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
   for (let k in map) {
      const keyName = k.toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
      if (keyName === searchName) return map[k];
      if (searchName.includes(keyName) && keyName.length >= 2) return map[k];
      if (keyName.includes(searchName) && searchName.length >= 2) return map[k];
   }
   return 15;
}

// Helper: get per-exam LIVE question count from server
function _getQuestionCount(eName, staticFallback) {
    if (!apiProgress || !apiProgress.examQuestionCounts || !eName) return staticFallback || "—";
    const map = apiProgress.examQuestionCounts;
    if (map[eName]) return map[eName].toLocaleString();

    const searchName = eName.toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
    for (let k in map) {
      const keyName = k.toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
      if (keyName === searchName) return map[k].toLocaleString();
      if (searchName.includes(keyName) && keyName.length >= 5) return map[k].toLocaleString();
      if (keyName.includes(searchName) && searchName.length >= 5) return map[k].toLocaleString();
    }
    return staticFallback || "—";
}

// ═══════════════════════════════════════════════════════════
//  FETCH ALL JSON FILES IN PARALLEL
// ═══════════════════════════════════════════════════════════
async function loadAllTracks() {
  showLoader();
  try {
    const [resTopic, resProg] = await Promise.all([
        fetch(`${API_BASE}/topics`),
        fetch(`${API_BASE}/api/progress`)
    ]);
    
    if (!resTopic.ok) throw new Error(`HTTP ${resTopic.status}`);
    const allTopics = await resTopic.json();
    
    if (resProg.ok) {
        apiProgress = await resProg.json();
    }
    
    TRACKS.forEach(track => {
      loadedData[track.name] = allTopics.filter(t => t.track_name === track.name);
    });
    
    init();
  } catch (err) {
    console.error("Failed to load topics from DB:", err);
  }
}

function showLoader() {
  contentArea.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;flex:1;flex-direction:column;gap:16px;color:var(--text-muted);">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" style="animation:spin 1s linear infinite;">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      <span style="font-size:14px;font-weight:600;">Loading tracks…</span>
    </div>
  `;
  if (!document.getElementById('spin-style')) {
    const s = document.createElement('style');
    s.id = 'spin-style';
    s.textContent = '@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}';
    document.head.appendChild(s);
  }
}

function init() {
  let activeTrackName = null;
  const activeTabBtn = document.querySelector('.tab-btn.active');
  
  if (activeTabBtn) {
    activeTrackName = activeTabBtn.dataset.track;
  } else {
    const urlParams = new URLSearchParams(window.location.search);
    activeTrackName = urlParams.get('track');
  }

  let activeTrack = TRACKS.find(t => t.name === activeTrackName) || TRACKS[0];

  renderTabs(activeTrack.name);

  if (activeTrack.type === 'tech') {
    renderTechTrack(loadedData[activeTrack.name] || []);
  } else {
    renderExamTrack(activeTrack.name, loadedData[activeTrack.name] || []);
  }
}

function renderTabs(activeTrackName) {
  tabsContainer.innerHTML = '';
  TRACKS.forEach((track) => {
    const btn = document.createElement('button');
    btn.className = `tab-btn ${track.name === activeTrackName ? 'active' : ''}`;
    btn.dataset.track = track.name;
    btn.dataset.type = track.type;
    btn.dataset.action = 'switch-tab';
    btn.innerHTML = `<svg class="tab-icon"><use href="#${track.icon}"/></svg>${track.name}`;
    tabsContainer.appendChild(btn);
  });
}

function renderExamTrack(trackName, items) {
  if (!items.length) {
    contentArea.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;flex:1;color:var(--text-muted);font-size:14px;font-weight:600;">No data available for ${trackName}.</div>`;
    return;
  }
  const categories = [...new Set(items.map(d => d.category))];
  const activeIdx = categories.indexOf(currentCategory) !== -1 ? categories.indexOf(currentCategory) : 0;
  if (!currentCategory && categories.length > 0) currentCategory = categories[0];

  let html = `<div class="tab-body"><div class="cat-list"><div class="cat-group-label">Categories</div>`;
  categories.forEach((cat, i) => {
    const catItems = items.filter(d => d.category === cat);
    const cfg = getCfg(cat);
    let catUpdated = 0;
    catItems.forEach(d => { catUpdated += _getUpdated(d.exam_name || d.topic); });
    const maxCat = catItems.reduce((sum, d) => sum + _getTarget(d.exam_name || d.topic), 0);
    const catPct = maxCat > 0 ? Math.min(100, Math.round((catUpdated / maxCat) * 100)) : 0;
    html += `<div class="cat-item ${i === activeIdx ? 'active' : ''}" data-action="switch-cat" data-panel="${safeid(trackName + '-' + cat)}" data-cat="${cat}">
        <div class="cat-item-left">
          <div class="cat-icon-wrap ${cfg.color}"><svg><use href="#${cfg.icon}"/></svg></div>
          <div>
            <div class="cat-name">${cat}</div>
            <div class="cat-sub-count" style="display:flex;align-items:center;gap:6px;">${catItems.length} exam${catItems.length !== 1 ? 's' : ''}<span style="color:var(--text-muted); font-size: 8px;">•</span><span style="color:${catPct > 0 ? '#00e676' : 'var(--text-muted)'}; white-space:nowrap;">${catPct}% Sync</span></div>
          </div>
        </div>
        <span class="cat-arrow"><svg width="12" height="12"><use href="#ic-chevron"/></svg></span>
      </div>`;
  });
  html += `</div>`;

  categories.forEach((cat, i) => {
    const catItems = items.filter(d => d.category === cat);
    const cfg = getCfg(cat);
    const panelId = safeid(trackName + '-' + cat);
    const isStatePSC = cat === 'State PSC / State Exams' || cat === 'State PSC';
    html += `<div class="sub-panel ${i === activeIdx ? 'active' : ''} ${isStatePSC ? 'sub-panel--state' : ''}" id="${panelId}">`;
    if (isStatePSC) {
      const stateMap = new Map();
      catItems.forEach(exam => {
        const name = exam.exam_name || '';
        const dashIdx = name.indexOf(' - ');
        const stateName = dashIdx > -1 ? name.substring(0, dashIdx) : name;
        if (!stateMap.has(stateName)) stateMap.set(stateName, []);
        stateMap.get(stateName).push(exam);
      });
      const states = [...stateMap.keys()];
      html += `<div class="sub-panel-header"><div class="sub-panel-icon ${cfg.color}"><svg><use href="#${cfg.icon}"/></svg></div><div><div class="sub-panel-title">State PSC / State Exams</div><div class="sub-panel-desc">${states.length} states · ${catItems.length} exams</div></div><div class="sub-panel-count">${states.length} States</div></div><div class="state-wrap" id="sw-${panelId}"><div class="state-search-wrap"><span class="sstate-ico"><svg width="14" height="14"><use href="#ic-globe"/></svg></span><input class="state-search" type="text" placeholder="Search state…" oninput="filterStates(this,'${panelId}')"></div><div class="sgrid" id="sgrid-${panelId}">`;
      states.forEach(state => {
        const count = stateMap.get(state).length;
        html += `<button class="sbtn" data-state="${state}" data-action="open-state" data-panel="${panelId}" data-sid="${safeid(state)}" data-sname="${state}"><div class="sbtn-icon ic-orange"><svg width="12" height="12"><use href="#ic-globe"/></svg></div><div><div class="sbn">${state}</div><div class="sbc">${count} exams</div></div></button>`;
      });
      html += `</div>`;
      states.forEach(state => {
        const stateExams = stateMap.get(state);
        const stateId = safeid(state);
        html += `<div class="state-exam-panel hidden" id="sep-${panelId}-${stateId}"><div class="se-head"><div class="sub-panel-icon ic-orange" style="width:32px;height:32px;flex-shrink:0;"><svg><use href="#ic-globe"/></svg></div><div class="se-title">${state}</div><div class="se-badge">${stateExams.length} exams</div><button class="se-back" onclick="closeState('${panelId}')"><svg width="12" height="12" style="transform:rotate(180deg);display:block;"><use href="#ic-chevron"/></svg>Back to States</button></div><div class="state-search-wrap"><span class="sstate-ico"><svg width="14" height="14"><use href="#ic-globe"/></svg></span><input class="state-search" type="text" placeholder="Search exams…" oninput="filterStateExams(this,'sep-${panelId}-${stateId}')"></div><div class="egrid">`;
        stateExams.forEach((exam, idx) => {
          const rawName = exam.exam_name || '';
          const prefix = state + ' - ';
          const displayName = rawName.startsWith(prefix) ? rawName.slice(prefix.length) : rawName;
          const qc = exam.question_count;
          const yr = exam.year_range;
          const examPct = Math.min(100, Math.round((_getUpdated(exam.exam_name || exam.topic) / _getTarget(exam.exam_name || exam.topic)) * 100));
          const liveQC = _getQuestionCount(exam.exam_name || exam.topic, qc);
          const hasQ = examPct > 0 && liveQC && liveQC !== '—';
          const hasY = yr && yr.trim() !== '';
          const delay = (Math.min(idx, 12) * 0.025).toFixed(3);
          let bText = 'COMING SOON';
          let bStyle = 'background: rgba(255, 77, 77, 0.1); color: #ff4d4d; border: 1px solid rgba(255, 77, 77, 0.2);';
          if (examPct > 0 && examPct < 100) { bText = `SYNCING (${examPct}%)`; bStyle = 'background: rgba(255, 145, 0, 0.1); color: #ff9100; border: 1px solid rgba(255, 145, 0, 0.2);'; }
          else if (examPct >= 100) { bText = `READY (100%)`; bStyle = 'background: rgba(0, 230, 118, 0.1); color: #00e676; border: 1px solid rgba(0, 230, 118, 0.2);'; }
          
          html += `<a class="ecard" href="javascript:void(0)" data-action="load-years" data-exam="${exam.exam_name || exam.topic}" style="animation-delay:${delay}s;"><div class="eico ${cfg.color}"><svg width="17" height="17"><use href="#${cfg.icon}"/></svg></div><div class="ebody"><div class="ename">${displayName}</div><div class="emeta"><span class="econd">${exam.conducting_body || ''}</span><div style="display:flex; gap:6px; align-items:center; margin-top:4px;"><span class="etag tg-orange">${exam.level || 'State'}</span><span class="badge-live" style="${bStyle}">${bText}</span></div></div><div class="epills"><span class="epill">${exam.eligibility || 'Varies'}</span><span class="epill">${exam.frequency || 'Varies'}</span></div>${hasQ ? `<div class="prog-wrap"><div class="prog-info"><span class="p-cnt">${liveQC}</span>${hasY ? `<span class="p-yr">${yr}</span>` : ''}</div><div class="prog-bar"><div class="prog-fill" style="width:${examPct}%"></div></div></div>` : ''}</div><div class="earrow"><svg width="7" height="7"><use href="#ic-chevron"/></svg></div></a>`;
        });
        html += `</div></div>`;
      });
      html += `</div>`;
    } else {
      html += `<div class="sub-panel-header"><div class="sub-panel-icon ${cfg.color}"><svg><use href="#${cfg.icon}"/></svg></div><div><div class="sub-panel-title">${cat}</div><div class="sub-panel-desc">${catItems.length} exam${catItems.length !== 1 ? 's' : ''} in this category</div></div><div class="sub-panel-count">${catItems.length} exams</div></div><div class="sub-grid">`;
      catItems.forEach(exam => {
        const qc = exam.question_count;
        const yr = exam.year_range;
        const examPct = Math.min(100, Math.round((_getUpdated(exam.exam_name || exam.topic) / _getTarget(exam.exam_name || exam.topic)) * 100));
        const liveQC = _getQuestionCount(exam.exam_name || exam.topic, qc);
        const hasQ = examPct > 0 && liveQC && liveQC !== '—';
        const hasY = yr && yr.trim() !== '';
        let bText = 'COMING SOON';
        let bStyle = 'background: rgba(255, 77, 77, 0.1); color: #ff4d4d; border: 1px solid rgba(255, 77, 77, 0.2);';
        if (examPct > 0 && examPct < 100) { bText = `SYNCING (${examPct}%)`; bStyle = 'background: rgba(255, 145, 0, 0.1); color: #ff9100; border: 1px solid rgba(255, 145, 0, 0.2);'; }
        else if (examPct >= 100) { bText = `READY (100%)`; bStyle = 'background: rgba(0, 230, 118, 0.1); color: #00e676; border: 1px solid rgba(0, 230, 118, 0.2);'; }
        
        html += `<a class="sub-card" href="javascript:void(0)" data-action="load-years" data-exam="${exam.exam_name || exam.topic}"><div class="sub-card-header"><div class="sub-card-icon ${cfg.color}"><svg><use href="#${cfg.icon}"/></svg></div><div class="sub-card-body"><div class="sub-card-name">${exam.exam_name || '—'}</div><div style="display:flex; justify-content:space-between; align-items:center; width:100%;"><div class="sub-card-tag">${exam.conducting_body || ''}</div><span class="badge-live-sm" style="${bStyle}">${bText}</span></div></div><div class="sub-card-arrow"><svg><use href="#ic-chevron"/></svg></div></div><div class="sub-card-details"><div class="detail-item"><span class="detail-label">Eligibility</span><span class="detail-value">${exam.eligibility || '—'}</span></div><div class="detail-item"><span class="detail-label">Frequency</span><span class="detail-value">${exam.frequency || '—'}</span></div><div class="detail-item"><span class="detail-label">Questions</span><span class="detail-value ${hasQ ? 'has-data' : ''}">${hasQ ? liveQC : '—'}</span></div><div class="detail-item"><span class="detail-label">Year Range</span><span class="detail-value ${hasY ? 'has-data' : ''}">${hasY ? yr : '—'}</span></div></div></a>`;
      });
      html += `</div>`;
    }
    html += `</div>`;
  });
  html += `</div>`;
  contentArea.innerHTML = html;
}

function renderTechTrack(rawItems) {
  const items = rawItems.filter(d => d.track_name === "Tech Track" && d.exam_name && d.exam_name !== "Topics and Domain Covered");
  const topicMap = new Map();
  items.forEach(d => {
    const key = `${d.category}|${d.exam_name}`;
    if (!topicMap.has(key)) {
      topicMap.set(key, { category: d.category, topic: d.exam_name, questionCount: d.question_count || '', subDomains: [], });
    }
    const entry = topicMap.get(key);
    entry.questionCount = d.level || d.question_count || '';
    const sd = (d.conducting_body || '').trim();
    if (sd && sd !== 'NO Sub-Domain' && !entry.subDomains.includes(sd)) { entry.subDomains.push(sd); }
  });
  const topics = [...topicMap.values()];
  const categories = [...new Set(topics.map(t => t.category))];
  const activeIdx = categories.indexOf(currentCategory) !== -1 ? categories.indexOf(currentCategory) : 0;
  if (!currentCategory && categories.length > 0) currentCategory = categories[0];
  let html = `<div class="tab-body"><div class="cat-list"><div class="cat-group-label">Sections</div>`;
  categories.forEach((cat, i) => {
    const topicsInCat = topics.filter(t => t.category === cat);
    const cfg = getCfg(cat);
    html += `<div class="cat-item ${i === activeIdx ? 'active' : ''}" onclick="switchCat(this,'${safeid('tech-' + cat)}', '${cat.replace(/'/g, "\\'")}')"><div class="cat-item-left"><div class="cat-icon-wrap ${cfg.color}"><svg><use href="#${cfg.icon}"/></svg></div><div><div class="cat-name">${cat}</div><div class="cat-sub-count">${topicsInCat.length} topics</div></div></div><span class="cat-arrow"><svg width="12" height="12"><use href="#ic-chevron"/></svg></span></div>`;
  });
  html += `</div>`;
  categories.forEach((cat, i) => {
    const topicsInCat = topics.filter(t => t.category === cat);
    const cfg = getCfg(cat);
    const panelId = safeid('tech-' + cat);
    html += `<div class="sub-panel ${i === activeIdx ? 'active' : ''}" id="${panelId}"><div class="sub-panel-header"><div class="sub-panel-icon ${cfg.color}"><svg><use href="#${cfg.icon}"/></svg></div><div><div class="sub-panel-title">${cat}</div><div class="sub-panel-desc">${topicsInCat.length} topics in this section</div></div><div class="sub-panel-count">${topicsInCat.length} topics</div></div><div class="sub-grid">`;
    topicsInCat.forEach(t => {
      const qCount = _getUpdated(t.topic);
      const liveQC = _getQuestionCount(t.topic, t.questionCount);
      const hasQ = qCount > 0 && liveQC && liveQC !== '—';
      const subLabel = t.subDomains.length ? t.subDomains.join(', ') : null;
      let bText = qCount > 0 ? `${qCount} Questions` : 'COMING SOON';
      let bStyle = qCount === 0 ? 'background: rgba(255, 77, 77, 0.1); color: #ff4d4d; border: 1px solid rgba(255, 77, 77, 0.2);' : 'background: rgba(0, 230, 118, 0.1); color: #00e676; border: 1px solid rgba(0, 230, 118, 0.2);';
      
      html += `<a class="sub-card" href="javascript:void(0)" data-action="load-years" data-exam="${t.topic}"><div class="sub-card-header"><div class="sub-card-icon ${cfg.color}"><svg><use href="#${cfg.icon}"/></svg></div><div class="sub-card-body" style="width:100%; display:flex; flex-direction:column;"><div class="sub-card-name">${t.topic}</div><div style="display:flex; justify-content:space-between; align-items:center; width:100%; margin-top:4px;"><span class="sub-card-tag">${subLabel || '—'}</span><span class="badge-live-sm" style="${bStyle}">${bText}</span></div></div><div class="sub-card-arrow"><svg><use href="#ic-chevron"/></svg></div></div><div class="sub-card-details" style="grid-template-columns:1fr;"><div class="detail-item"><span class="detail-label">Questions</span><span class="detail-value ${hasQ ? 'has-data' : ''}">${hasQ ? liveQC : '—'}</span></div></div></a>`;
    });
    html += `</div></div>`;
  });
  html += `</div>`;
  contentArea.innerHTML = html;
}

window.switchTab = function(track, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const data = loadedData[track.name] || [];
  if (track.type === 'tech') renderTechTrack(data); else renderExamTrack(track.name, data);
};

window.switchCat = function(item, panelId, catName) {
  if (catName) currentCategory = catName;
  const catList = item.closest('.cat-list');
  catList.querySelectorAll('.cat-item').forEach(i => i.classList.remove('active'));
  item.classList.add('active');
  const tabBody = catList.closest('.tab-body');
  tabBody.querySelectorAll('.sub-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById(panelId);
  if (panel) {
    panel.classList.add('active');
    panel.querySelectorAll('.sub-card, .ecard').forEach(c => { c.style.animation = 'none'; void c.offsetHeight; c.style.animation = ''; });
  }
};

window.openState = function(panelId, stateId, stateName) {
  const wrap = document.getElementById(`sw-${panelId}`);
  wrap.querySelector('.sgrid').classList.add('hidden');
  wrap.querySelector('.state-search-wrap').classList.add('hidden');
  const sep = document.getElementById(`sep-${panelId}-${stateId}`);
  if (sep) { sep.classList.remove('hidden'); sep.querySelectorAll('.ecard').forEach(c => { c.style.animation = 'none'; void c.offsetHeight; c.style.animation = ''; }); }
};

window.closeState = function(panelId) {
  const wrap = document.getElementById(`sw-${panelId}`);
  wrap.querySelectorAll('.state-exam-panel').forEach(p => p.classList.add('hidden'));
  wrap.querySelector('.sgrid').classList.remove('hidden');
  wrap.querySelector('.state-search-wrap').classList.remove('hidden');
  const searchInput = wrap.querySelector('.state-search-wrap .state-search');
  if (searchInput) { searchInput.value = ''; filterStates(searchInput, panelId); }
};

window.filterStates = function(input, panelId) {
  const q = input.value.toLowerCase();
  const grid = document.getElementById(`sgrid-${panelId}`);
  if (!grid) return;
  grid.querySelectorAll('.sbtn').forEach(btn => { const name = (btn.dataset.state || '').toLowerCase(); btn.style.display = name.includes(q) ? '' : 'none'; });
};

window.filterStateExams = function(input, sepId) {
  const q = input.value.toLowerCase();
  const sep = document.getElementById(sepId);
  if (!sep) return;
  sep.querySelectorAll('.ecard').forEach(card => { const name = (card.querySelector('.ename')?.textContent || '').toLowerCase(); card.style.display = name.includes(q) ? '' : 'none'; });
};

window.loadYears = async function(exam) {
  currentExam = exam;
  
  // Tech Track topics skip years/papers selection
  const isTech = (loadedData["Tech Track"] || []).some(t => (t.topic || t.exam_name) === exam);
  if (isTech) {
    return loadQuestions('tech-topic', exam, 'Topic-Based Selection');
  }

  showLoader();
  try {
    // Fetch both the synced years (from DB) and topic metadata in parallel
    const [yearsRes, metaRes] = await Promise.all([
      fetch(`${API_BASE}/years?exam=${encodeURIComponent(exam)}`),
      fetch(`${API_BASE}/topic-meta?exam=${encodeURIComponent(exam)}`)
    ]);
    const syncedYears = await yearsRes.json();         // years we actually have data for
    const meta       = await metaRes.json();           // { year_range, not_conducted }

    // Parse not_conducted list: "2018, 2019" → Set { "2018", "2019" }
    const notConductedSet = new Set(
      (meta.not_conducted || '').split(',').map(y => y.trim()).filter(Boolean)
    );

    // Expand year_range to a full list: "2025 - 2017" → [2025,2024,...,2017]
    let allYears = [];
    if (meta.year_range) {
      // Handle multi-segment ranges: "2025-2023, 2021-2020"
      const segments = meta.year_range.split(',');
      segments.forEach(seg => {
        const parts = seg.match(/(\d{4})/g);
        if (parts && parts.length >= 2) {
          const a = parseInt(parts[0]), b = parseInt(parts[1]);
          const lo = Math.min(a, b), hi = Math.max(a, b);
          for (let y = hi; y >= lo; y--) allYears.push(String(y));
        } else if (parts && parts.length === 1) {
          allYears.push(parts[0]);
        }
      });
    }

    // Build a set for fast lookups
    const syncedSet = new Set(syncedYears.map(String));
    const allYearsSet = new Set(allYears);

    // Merge DB years that fall OUTSIDE the defined year_range.
    // These are years with real questions that aren't listed in year_range — always show them.
    const extraYears = syncedYears
      .map(String)
      .filter(y => !allYearsSet.has(y))
      .sort((a, b) => parseInt(b) - parseInt(a)); // newest first
    if (extraYears.length > 0) allYears = [...allYears, ...extraYears];

    // If no year_range in topics AND no extra years, fall back to just synced years
    if (!allYears.length) allYears = [...syncedYears];

    const hasAny = allYears.length > 0;
    if (!hasAny) {
      contentArea.innerHTML = `<div style="padding: 30px; display: flex; flex-direction: column; height: 100%; width: 100%;"><div class="back-link" onclick="init()" style="align-self: flex-start; z-index: 10;">← Back to Dashboard</div><div class="minimal-empty-container" style="flex: 1; margin-top: -40px;"><div class="minimal-empty-ui"><h2 class="m-title">Questions for <span>${exam}</span> Coming Soon</h2><p class="m-desc">Our team is currently preparing the verified question bank for this exam.</p><button class="empty-btn" onclick="init()" style="padding:10px 20px; font-size:13px; margin-top:10px;">Return to Tracks</button></div></div></div>`;
      return;
    }

    let html = `<div class="sub-panel active"><div class="header-actions"><div class="back-link" onclick="init()">← Back to ${exam}</div></div><div class="sub-panel-header"><div class="sub-panel-icon ic-accent"><svg><use href="#ic-award"/></svg></div><div><div class="sub-panel-title">${exam} — Previous Years</div><div class="sub-panel-desc">Select a year to view available papers</div></div></div><div class="year-grid">`;

    allYears.forEach(year => {
      const yStr = String(year);
      const isNotConducted = notConductedSet.has(yStr);
      const isSynced       = syncedSet.has(yStr);
      const isExtra        = !allYearsSet.has(yStr); // outside the defined range

      // RULE: Real DB data always wins — if we have questions for this year, make it clickable
      // even if topics.not_conducted lists it, or it's outside the year_range.
      if (isSynced) {
        const extraBadge = isExtra
          ? `<span class="year-card__extra-badge" title="Outside listed range — data available">Extra</span>`
          : '';
        const ncHint = isNotConducted ? ' — not officially held but questions available' : '';
        html += `<div class="year-card year-card--has-data${isExtra ? ' year-card--extra' : ''}" data-action="load-papers" data-exam="${exam}" data-year="${yStr}" title="${exam} ${yStr}${ncHint}">${yStr}${extraBadge}</div>`;
      } else if (isNotConducted) {
        // Not conducted AND no DB data — grey out
        html += `<div class="year-card year-card--not-conducted" title="${exam} ${yStr} was not conducted">
          <span class="year-card__year">${yStr}</span>
          <span class="year-card__badge">Not Conducted</span>
        </div>`;
      } else {
        // Year in range but no data yet — Coming Soon
        html += `<div class="year-card year-card--pending" title="Data for ${yStr} coming soon">
          <span class="year-card__year">${yStr}</span>
          <span class="year-card__badge">Coming Soon</span>
        </div>`;
      }
    });

    html += `</div></div>`;
    contentArea.innerHTML = html;
  } catch (err) {
    console.error("API Error:", err);
    contentArea.innerHTML = `<div style="padding:40px;color:var(--red);">API Server is not responding. Make sure 'server.js' is running on port 5000.</div>`;
  }
};


window.loadPapers = async function(exam, year) {
  currentYear = year;
  showLoader();
  try {
    const res = await fetch(`${API_BASE}/papers?exam=${encodeURIComponent(exam)}&year=${year}`);
    const papers = await res.json();
    
    // Auto-skip if only 1 paper
    if (papers.length === 1) {
      return loadQuestions(papers[0]._id, exam, year);
    }

    let html = `<div class="sub-panel active"><div class="header-actions"><div class="back-link" onclick="loadYears('${exam.replace(/'/g, "\\\\'")}')">← Change Year</div></div><div class="sub-panel-header"><div class="sub-panel-icon ic-accent"><svg><use href="#ic-courses"/></svg></div><div><div class="sub-panel-title">${exam} — ${year} Papers</div><div class="sub-panel-desc">Select a paper to take the test</div></div></div><div class="paper-grid">`;
    papers.forEach(p => { html += `<div class="paper-card" data-action="load-questions" data-id="${p._id}" data-exam="${exam}" data-year="${year}"><h4>${p.paper}</h4><p>${p.pdf_name}</p></div>`; });
    html += `</div></div>`;
    contentArea.innerHTML = html;
  } catch (err) { console.error(err); }
};

window.loadQuestions = async function(paper_id, exam = currentExam, year = currentYear) {
  showLoader();
  try {
    const [qRes, pRes] = await Promise.all([
      fetch(`${API_BASE}/questions?paper_id=${paper_id}&exam=${encodeURIComponent(exam)}&year=${encodeURIComponent(year)}`),
      fetch(`${API_BASE}/papers?exam=${encodeURIComponent(exam)}&year=${year}`)
    ]);
    const questions = await qRes.json();
    const papers    = await pRes.json();
    const multiPaper = papers.length > 1;
    const isTech = year === 'Topic-Based Selection';

    // Show Tech Coming Soon if no questions found for a tech topic
    if (isTech && questions.length === 0) {
       contentArea.innerHTML = `<div style="padding: 30px; display: flex; flex-direction: column; height: 100%; width: 100%;"><div class="back-link" onclick="init()" style="align-self: flex-start; z-index: 10;">← Back to Dashboard</div><div class="minimal-empty-container" style="flex: 1; margin-top: -40px;"><div class="minimal-empty-ui"><h2 class="m-title">Questions for <span>${exam}</span> Coming Soon</h2><p class="m-desc">Our team is currently preparing the verified question bank for this topic.</p><button class="empty-btn" onclick="init()" style="padding:10px 20px; font-size:13px; margin-top:10px;">Return to Tracks</button></div></div></div>`;
       return;
    }

    let backAction = isTech ? `init()` : (multiPaper ? `loadPapers('${currentExam.replace(/'/g, "\\\\'")}', ${currentYear})` : `loadYears('${currentExam.replace(/'/g, "\\\\'")}')`);
    let backText = isTech ? 'Back to Dashboard' : (multiPaper ? 'Back to Papers' : 'Back to Years');

    let html = `<div class="sub-panel active" style="overflow-y:auto; position:relative;"><div class="header-actions" style="position:sticky; top:-26px; background:var(--bg-card); z-index:10; padding:18px 30px; border-bottom:1px solid var(--border); margin:-26px -30px 24px -30px; display:flex; justify-content:space-between; align-items:center;"><div class="back-link" onclick="${backAction}">← ${backText}</div><div style="display:flex; gap:20px; align-items:center;"><button class="show-answer-btn" id="global-toggle" onclick="toggleAllAnswers()">Show All Answers</button></div></div><div class="question-container" style="padding:0 30px 30px 30px;"><div style="margin-bottom:24px;"><h2 style="font-size:24px; font-weight:800; color:var(--text-primary); margin-bottom:4px;">${currentExam}</h2><p style="color:var(--text-muted); font-size:14px;">${year} · ${questions.length} Questions</p></div><div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; align-items: start;">`;
    questions.forEach((q, i) => {
      html += `<div class="question-card" style="margin-bottom:0; height:100%; display:flex; flex-direction:column;"><div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; gap:12px; flex-wrap:wrap;"><div class="diff ${q.difficulty === 'Easy' ? 'diff-easy' : q.difficulty === 'Hard' ? 'diff-hard' : 'diff-medium'}">${q.difficulty}</div><div style="font-size:11px; color:var(--text-muted); font-weight:600; text-align:right;">Subject: ${q.subject}</div></div><h4 style="line-height:1.5; font-size: 15px; margin-bottom: 20px;">Q${i + 1}. ${q.question}</h4><div class="options-list" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: auto;">${Object.entries(q.option || {}).map(([key, val]) => `<div class="paper-option" style="color: var(--text-secondary); font-size: 13.5px; line-height: 1.5; padding: 12px 14px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; display: flex;"><strong style="color: var(--text-primary); margin-right: 8px; min-width: 18px;">${key}.</strong> <span style="flex:1;">${val}</span></div>`).join("")}</div><div class="answer-box" style="margin-top: 20px;"><button class="show-answer-btn q-ans-btn" onclick="toggleAnswer(this)" style="width:100%;">Show Answer</button><div class="explanation hidden" style="margin-top: 12px;"><div style="font-weight:800; color:var(--green); margin-bottom:8px; display:flex; align-items:center; gap:8px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>Correct Answer: ${q.answer}</div><div style="color:var(--text-secondary); font-size: 13.5px; line-height: 1.6;">${q.explanation}</div></div></div></div>`;
    });
    html += `</div></div></div>`;
    contentArea.innerHTML = html;
  } catch (err) { console.error(err); }
};

window.toggleAnswer = function(btn) { const exp = btn.nextElementSibling; exp.classList.toggle('hidden'); btn.innerText = exp.classList.contains('hidden') ? 'Show Answer' : 'Hide Answer'; };
window.toggleAllAnswers = function() { const btn = document.getElementById('global-toggle'); const allExplanations = document.querySelectorAll('.explanation'); const show = btn.innerText === 'Show All Answers'; allExplanations.forEach(exp => { if (show) exp.classList.remove('hidden'); else exp.classList.add('hidden'); exp.previousElementSibling.innerText = show ? 'Hide Answer' : 'Show Answer'; }); btn.innerText = show ? 'Hide All Answers' : 'Show All Answers'; };

document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    const ds = target.dataset;
    if (action === 'switch-tab') { const track = TRACKS.find(t => t.name === ds.track); if (track) { currentExam = ""; currentYear = ""; currentCategory = ""; switchTab(track, target); } }
    else if (action === 'switch-cat') switchCat(target, ds.panel, ds.cat);
    else if (action === 'open-state') openState(ds.panel, ds.sid, ds.sname);
    else if (action === 'load-years') loadYears(ds.exam);
    else if (action === 'load-papers') loadPapers(ds.exam, ds.year);
    else if (action === 'load-questions') loadQuestions(ds.id, ds.exam, ds.year);
});

function safeid(str) { return str.replace(/[^a-zA-Z0-9]/g, '-'); }
loadAllTracks();
