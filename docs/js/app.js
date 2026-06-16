/* app.js — Application state machine and UI rendering.
 * State is immutable: every update creates a new state object.
 * Persistence (localStorage), keyboard nav, theme, share-by-URL, review screen,
 * import/export and insight panels are layered on top of the original flow.
 */

const App = (function () {
  const INITIAL_STATE = {
    screen: 'welcome',
    answers: {},
    memos: {},
    projectName: '',
    categoryIndex: 0,
    questionIndex: 0,
    results: null,
    selfCheckTab: 'pre-impl',
    aiModel: 'generic',
  };

  const STORAGE = { progress: 'aidd:progress', history: 'aidd:history', theme: 'aidd:theme' };

  let state = { ...INITIAL_STATE };

  function setState(partial) {
    const prev = state;
    state = { ...state, ...partial };
    render(prev.screen !== state.screen);
    persist();
  }

  // ── Persistence (U4 / C4) ───────────────────────────────────────────────────

  function persist() {
    if (getAnsweredCount(state.answers) === 0) return;
    try {
      localStorage.setItem(STORAGE.progress, JSON.stringify({
        answers: state.answers, memos: state.memos, projectName: state.projectName,
        categoryIndex: state.categoryIndex, questionIndex: state.questionIndex,
        savedAt: new Date().toISOString(),
      }));
    } catch (e) { /* storage unavailable (private mode等) — 黙って継続 */ }
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE.progress);
      if (!raw) return null;
      const p = JSON.parse(raw);
      if (!p || typeof p.answers !== 'object' || p.answers === null) return null;
      return p;
    } catch (e) { return null; }
  }

  function clearProgress() { try { localStorage.removeItem(STORAGE.progress); } catch (e) {} }

  function saveSnapshot(results) {
    try {
      const hist = loadHistory();
      hist.unshift({
        at: new Date().toISOString(),
        projectName: results.projectName,
        totalScore: results.totalScore,
        level: results.level.name,
        categoryScores: results.categoryScores.map(s => ({ id: s.categoryId, score: s.score })),
      });
      localStorage.setItem(STORAGE.history, JSON.stringify(hist.slice(0, 10)));
    } catch (e) {}
  }

  function loadHistory() {
    try { return JSON.parse(localStorage.getItem(STORAGE.history) || '[]'); } catch (e) { return []; }
  }

  // ── Theme (UX4) ─────────────────────────────────────────────────────────────

  function initTheme() {
    let theme = null;
    try { theme = localStorage.getItem(STORAGE.theme); } catch (e) {}
    if (!theme) {
      theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }
    applyTheme(theme);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(STORAGE.theme, theme); } catch (e) {}
    document.querySelectorAll('[data-theme-toggle]').forEach(b => {
      b.textContent = theme === 'dark' ? '☀ ライト' : '☾ ダーク';
      b.setAttribute('aria-label', theme === 'dark' ? 'ライトモードに切替' : 'ダークモードに切替');
    });
  }

  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  }

  // ── Share by URL (FT1) ──────────────────────────────────────────────────────

  function encodeStateToHash() {
    const code = QUESTIONS.map(q => {
      const v = state.answers[q.id];
      if (v === undefined) return '-';
      if (v === null) return 'n';
      return String(v);
    }).join('');
    const pn = state.projectName ? '&p=' + encodeURIComponent(state.projectName) : '';
    return '#a=' + code + pn;
  }

  function shareUrl() {
    return location.origin + location.pathname + encodeStateToHash();
  }

  function decodeHashToState(hash) {
    const m = /[#&]a=([0-3n\-]+)/.exec(hash || '');
    if (!m || m[1].length !== QUESTIONS.length) return null;
    const code = m[1];
    const answers = {};
    QUESTIONS.forEach((q, i) => {
      const ch = code[i];
      if (ch === '-') return;
      answers[q.id] = ch === 'n' ? null : parseInt(ch, 10);
    });
    const pm = /[#&]p=([^&]*)/.exec(hash);
    return { answers, projectName: pm ? decodeURIComponent(pm[1]) : '' };
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  function startFresh() {
    const name = document.getElementById('project-name-input')?.value.trim() || '';
    clearProgress();
    setState({ ...INITIAL_STATE, projectName: name, screen: 'assessment', answers: {}, memos: {} });
  }

  function loadSample() {
    setState({
      ...INITIAL_STATE,
      projectName: SAMPLE_PROJECT_NAME,
      answers: { ...SAMPLE_ANSWERS },
      memos: {},
      screen: 'assessment',
    });
  }

  function resume() {
    const p = loadProgress();
    if (!p) return;
    setState({
      ...INITIAL_STATE,
      answers: p.answers || {}, memos: p.memos || {}, projectName: p.projectName || '',
      categoryIndex: p.categoryIndex || 0, questionIndex: p.questionIndex || 0,
      screen: 'assessment',
    });
  }

  function importJSON(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = parseDiagnosisJSON(String(reader.result));
      if (!res.ok) { window.alert('読み込みに失敗しました：' + res.error); return; }
      setState({ ...INITIAL_STATE, answers: res.answers, memos: res.memos || {}, projectName: res.projectName || '', screen: 'assessment' });
    };
    reader.readAsText(file);
  }

  function goTo(screen) {
    if (screen === 'results') {
      const results = buildResults(state.answers, state.projectName);
      results.previousSnapshot = loadHistory()[0] || null;
      saveSnapshot(results);
      setState({ screen, results });
    } else if (screen === 'review') {
      setState({ screen: 'review' });
    } else {
      setState({ screen });
    }
  }

  function goReview() { goTo('review'); }

  function nextQuestion() {
    const catQs = questionsForCategory(state.categoryIndex);
    if (state.questionIndex < catQs.length - 1) {
      setState({ questionIndex: state.questionIndex + 1 });
      return;
    }
    if (state.categoryIndex < CATEGORIES.length - 1) {
      setState({ categoryIndex: state.categoryIndex + 1, questionIndex: 0 });
    } else {
      viewResults();
    }
  }

  function prevQuestion() {
    if (state.questionIndex > 0) {
      setState({ questionIndex: state.questionIndex - 1 });
      return;
    }
    if (state.categoryIndex > 0) {
      const prevCatQs = questionsForCategory(state.categoryIndex - 1);
      setState({ categoryIndex: state.categoryIndex - 1, questionIndex: prevCatQs.length - 1 });
    }
  }

  function jumpToCategory(catIndex) {
    setState({ categoryIndex: catIndex, questionIndex: 0 });
  }

  function jumpToQuestion(qid) {
    const q = QUESTIONS.find(x => x.id === qid);
    if (!q) return;
    const catIndex = CATEGORIES.findIndex(c => c.id === q.categoryId);
    const qs = QUESTIONS.filter(x => x.categoryId === q.categoryId);
    setState({ screen: 'assessment', categoryIndex: catIndex, questionIndex: qs.findIndex(x => x.id === qid) });
  }

  function selectAnswer(questionId, score) {
    setState({ answers: { ...state.answers, [questionId]: score } });
  }

  function toggleNA(questionId, isNA) {
    if (isNA) {
      setState({ answers: { ...state.answers, [questionId]: null } });
    } else {
      const { [questionId]: _, ...rest } = state.answers;
      setState({ answers: rest });
    }
  }

  function viewResults() {
    const conf = calcConfidence(state.answers);
    if (conf.answeredCount === 0) {
      window.alert('回答がありません。少なくとも1問回答してから結果を表示してください。');
      return;
    }
    if (conf.completionRate < 100) {
      const ok = window.confirm(
        `未回答があります（回答率 ${conf.completionRate}%）。\n` +
        '未回答の領域は結果から除外され、総合レベルは「暫定」表示になります。\n' +
        'このまま結果を見ますか？'
      );
      if (!ok) return;
    }
    goTo('results');
  }

  function switchSelfCheckTab(tab) {
    setState({ selfCheckTab: tab });
    renderSelfCheckPrompt();
  }

  function setAiModel(model) {
    state = { ...state, aiModel: model };
    renderSelfCheckPrompt();
  }

  function copyReport() {
    copyToClipboard(generateMarkdownReport(state.results), 'report-copy-feedback');
  }

  function copySelfCheck() {
    copyToClipboard(generateSelfCheckPrompt(state.selfCheckTab, state.results, state.aiModel), 'selfcheck-copy-feedback');
  }

  function copyShareUrl() {
    copyToClipboard(shareUrl(), 'share-feedback');
  }

  function copyIssues() {
    const issues = generateGithubIssues(state.results)
      .map(i => `# ${i.title}\n\n${i.body}`).join('\n\n---\n\n');
    copyToClipboard(issues, 'export-feedback');
  }

  function copyBadge() {
    copyToClipboard(generateBadgeMarkdown(state.results), 'export-feedback');
  }

  function exportJSON() {
    download(`aidd-diagnosis-${dateStamp()}.json`,
      generateDiagnosisJSON({ answers: state.answers, projectName: state.projectName, memos: state.memos }),
      'application/json;charset=utf-8');
  }

  function exportReportCSV() {
    download(`aidd-scores-${dateStamp()}.csv`, generateReportCSV(state.results), 'text/csv;charset=utf-8');
  }

  function exportIssuesCSV() {
    download(`aidd-issues-${dateStamp()}.csv`, generateIssuesCSV(state.results), 'text/csv;charset=utf-8');
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function questionsForCategory(catIndex) {
    const cat = CATEGORIES[catIndex];
    return QUESTIONS.filter(q => q.categoryId === cat.id);
  }

  function dateStamp() { return new Date().toISOString().split('T')[0]; }

  function download(filename, text, mime) {
    const blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    const fb = document.getElementById('export-feedback');
    if (fb) { fb.textContent = '書き出しました：' + filename; setTimeout(() => { fb.textContent = ''; }, 2500); }
  }

  function copyToClipboard(text, feedbackId) {
    const ok = () => {
      const el = document.getElementById(feedbackId);
      if (!el) return;
      el.textContent = 'コピーしました';
      setTimeout(() => { el.textContent = ''; }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(ok).catch(() => {
        const el = document.getElementById(feedbackId);
        if (el) el.textContent = 'コピーに失敗しました。手動で選択してコピーしてください。';
      });
    } else {
      const el = document.getElementById(feedbackId);
      if (el) el.textContent = 'この環境ではコピーできません。手動で選択してください。';
    }
  }

  // ── Rendering ──────────────────────────────────────────────────────────────

  function render(screenChanged) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + state.screen)?.classList.add('active');

    switch (state.screen) {
      case 'welcome':    renderWelcome(); break;
      case 'assessment': renderAssessment(); break;
      case 'review':     renderReview(); break;
      case 'results':    if (screenChanged) renderResults(); break;
      case 'report':     if (screenChanged) renderReport(); break;
    }

    if (screenChanged) moveFocusToHeading();
  }

  function moveFocusToHeading() {
    const screenEl = document.getElementById('screen-' + state.screen);
    if (!screenEl) return;
    const heading = screenEl.querySelector('h1, h2, .maturity-level, h3');
    if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: false }); }
  }

  function renderWelcome() {
    const grid = document.getElementById('welcome-areas');
    if (grid) {
      grid.innerHTML = CATEGORIES.map((c, i) => `
        <div class="area-chip">
          <span class="area-number">${i + 1}</span>
          <span class="area-name">${escapeHtml(c.name)}</span>
        </div>
      `).join('');
    }
    const nameInput = document.getElementById('project-name-input');
    if (nameInput && state.projectName) nameInput.value = state.projectName;

    // U4: offer resume only when prior progress with answers exists
    const p = loadProgress();
    const resumeBtn = document.getElementById('resume-btn');
    if (resumeBtn) {
      const has = p && getAnsweredCount(p.answers || {}) > 0;
      resumeBtn.style.display = has ? '' : 'none';
      if (has) {
        const n = getAnsweredCount(p.answers);
        resumeBtn.textContent = `前回の続きから再開（${n}問回答済み）`;
      }
    }
  }

  function renderAssessment() {
    renderCategoryNav();
    renderQuestion();
    renderTotalProgress();
  }

  function renderCategoryNav() {
    const nav = document.getElementById('category-nav');
    if (!nav) return;
    nav.innerHTML = CATEGORIES.map((cat, i) => {
      const { answered, total } = getCategoryProgress(cat.id, state.answers);
      const score = calcCategoryScore(cat.id, state.answers);
      const lv = determineLevelForScore(score);
      const isActive = i === state.categoryIndex;
      const isComplete = answered === total;
      return `
        <button class="cat-nav-item ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}"
                data-cat-index="${i}" type="button">
          <span class="cat-nav-dot ${lv.cssClass}"></span>
          <span class="cat-nav-name">${escapeHtml(cat.name)}</span>
          <span class="cat-nav-progress">${answered}/${total}</span>
        </button>
      `;
    }).join('');
  }

  function renderQuestion() {
    const catQs = questionsForCategory(state.categoryIndex);
    const cat = CATEGORIES[state.categoryIndex];
    const q = catQs[state.questionIndex];
    if (!q) return;

    const currentAnswer = state.answers[q.id];
    const isNA = currentAnswer === null && q.id in state.answers;

    setText('cat-number', cat.id);
    setText('cat-title', cat.name);
    setText('breadcrumb-category', cat.name);
    setText('topbar-answered', getAnsweredCount(state.answers));
    setText('topbar-total', QUESTIONS.length);
    setText('q-number', `Q${state.questionIndex + 1} / ${catQs.length}`);
    setText('q-target', targetLabel(q.target));
    document.getElementById('q-target')?.setAttribute('data-target', q.target);
    setText('q-text', q.question);

    // UX5: category context + estimated time / remaining
    setText('cat-purpose', cat.purpose || '');
    const { answered, total } = getCategoryProgress(cat.id, state.answers);
    setText('cat-meta', `目安 約${cat.estimatedMinutes || 2}分 ・ 残り ${Math.max(total - answered, 0)}問`);

    const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
    const fill = document.getElementById('cat-progress-fill');
    if (fill) fill.style.width = pct + '%';
    setText('cat-progress-text', `${answered}/${total} 回答済み`);

    const choicesEl = document.getElementById('q-choices');
    if (choicesEl) {
      choicesEl.innerHTML = q.choices.map(choice => `
        <label class="choice-label ${currentAnswer === choice.score && !isNA ? 'selected' : ''}">
          <input type="radio" name="q-choice" value="${choice.score}"
                 data-qid="${escapeHtml(q.id)}" data-score="${choice.score}"
                 ${currentAnswer === choice.score && !isNA ? 'checked' : ''}
                 ${isNA ? 'disabled' : ''}>
          <div class="choice-content">
            <div class="choice-header">
              <span class="choice-score score-${choice.score}">${choice.score}</span>
              <span class="choice-label-text">${escapeHtml(choice.label)}</span>
            </div>
            <p class="choice-desc">${escapeHtml(choice.description)}</p>
          </div>
        </label>
      `).join('');
    }

    const naCheckbox = document.getElementById('q-na');
    if (naCheckbox) {
      naCheckbox.checked = isNA;
      naCheckbox.dataset.qid = q.id;
    }

    // FT4: optional evidence memo (uncontrolled update to preserve focus)
    const memoEl = document.getElementById('q-memo');
    if (memoEl) {
      memoEl.value = state.memos[q.id] || '';
      memoEl.dataset.qid = q.id;
      memoEl.placeholder = q.memoPrompt || '根拠・証跡を任意で記録';
    }

    const riskEl = document.getElementById('risk-preview');
    if (riskEl && currentAnswer !== undefined && !isNA) {
      const showRisk = currentAnswer <= 1;
      riskEl.style.display = showRisk ? 'block' : 'none';
      if (showRisk) {
        riskEl.innerHTML = `<div class="risk-icon">⚠</div><div><strong>リスク:</strong> ${escapeHtml(q.riskIfLow)}</div>`;
      }
    } else if (riskEl) {
      riskEl.style.display = 'none';
    }

    const prevBtn = document.getElementById('prev-btn');
    if (prevBtn) prevBtn.disabled = state.categoryIndex === 0 && state.questionIndex === 0;

    const nextBtn = document.getElementById('next-btn');
    const isLast = state.categoryIndex === CATEGORIES.length - 1 && state.questionIndex === catQs.length - 1;
    if (nextBtn) nextBtn.textContent = isLast ? '結果を見る →' : '次へ →';

    announce(`${cat.name} Q${state.questionIndex + 1} / ${catQs.length}`);
  }

  function renderTotalProgress() {
    setText('total-answered', getAnsweredCount(state.answers));
    setText('total-questions', QUESTIONS.length);
  }

  // ── Review screen (UX3) ───────────────────────────────────────────────────

  function renderReview() {
    const el = document.getElementById('review-grid');
    if (!el) return;
    el.innerHTML = CATEGORIES.map(cat => {
      const qs = QUESTIONS.filter(q => q.categoryId === cat.id);
      const cells = qs.map((q, i) => {
        const v = state.answers[q.id];
        let cls = 'unanswered', icon = '·';
        if (q.id in state.answers && v === null) { cls = 'na'; icon = '—'; }
        else if (v !== undefined) { cls = 'score-' + v; icon = String(v); }
        return `<button class="review-cell ${cls}" data-review-qid="${escapeHtml(q.id)}"
                  title="${escapeHtml(q.question)}" type="button">
                  <span class="review-cell-q">Q${i + 1}</span><span class="review-cell-v">${icon}</span>
                </button>`;
      }).join('');
      return `<div class="review-row">
        <div class="review-cat">${escapeHtml(cat.name)}</div>
        <div class="review-cells">${cells}</div>
      </div>`;
    }).join('');

    const conf = calcConfidence(state.answers);
    setText('review-summary', `回答率 ${conf.completionRate}%（回答 ${conf.answeredCount} ・ 対象外 ${conf.naCount} ・ 全 ${conf.totalQuestions}問）`);
  }

  // ── Results (incl. AL1/AL2/AL4/AL6/C3/C4) ─────────────────────────────────

  function renderResults() {
    const r = state.results;
    if (!r) return;

    const maturityCard = document.getElementById('maturity-card');
    if (maturityCard) maturityCard.className = 'maturity-card ' + r.level.cssClass;

    setText('maturity-score', r.totalScore + '/100');
    setText('maturity-level', r.level.icon + ' ' + r.level.name);
    setText('maturity-desc', r.level.description);

    renderInsights(r);
    renderRadarChart(r.categoryScores);
    renderRisksList(r.risks);
    renderIssuesList(r.issues);
    renderCategoryGrid(r.categoryScores);
  }

  function renderInsights(r) {
    const conf = r.confidence;
    setText('results-confidence',
      `回答率 ${conf.completionRate}%（${conf.provisional ? '暫定' : '十分'}） ・ 安定性 ${r.sensitivity.stability}`);
    const confEl = document.getElementById('results-confidence');
    if (confEl) confEl.className = 'insight-badge ' + (conf.provisional ? 'warn' : 'ok');

    const gap = r.gapToNextLevel;
    setText('results-gap', gap.atTop
      ? '最高レベルに到達しています。'
      : `次のレベル（${gap.nextLevel.name}）まで あと ${gap.gap} ポイント。`);

    const incEl = document.getElementById('results-incoherence');
    if (incEl) {
      if (r.incoherences.length === 0) { incEl.style.display = 'none'; }
      else {
        incEl.style.display = '';
        incEl.innerHTML = '<strong>整合性チェック</strong><ul>' +
          r.incoherences.map(i => `<li>${escapeHtml(i.message)}</li>`).join('') + '</ul>';
      }
    }

    const ratEl = document.getElementById('results-rationale');
    if (ratEl) {
      const drivers = r.rationale.drivers.map(d =>
        `<li>${escapeHtml(d.question)} <span class="muted">（${d.from}→${d.to}, 総合+${d.delta}）</span></li>`).join('');
      const weak = r.rationale.weakest.map(s => `${escapeHtml(s.abbr)} ${s.score}`).join(' ・ ');
      ratEl.innerHTML =
        `<p>${escapeHtml(r.rationale.summary)} ${escapeHtml(r.rationale.note)}</p>` +
        `<p class="muted">弱い領域: ${weak}</p>` +
        `<strong>最も効く改善</strong><ul>${drivers || '<li>改善ドライバはありません。</li>'}</ul>`;
    }

    // C4: diff vs previous snapshot
    const diffEl = document.getElementById('results-diff');
    if (diffEl) {
      const prev = r.previousSnapshot;
      if (!prev) { diffEl.style.display = 'none'; }
      else {
        diffEl.style.display = '';
        const delta = r.totalScore - prev.totalScore;
        const sign = delta > 0 ? '+' : '';
        const cls = delta > 0 ? 'ok' : delta < 0 ? 'critical' : 'neutral';
        diffEl.innerHTML = `<strong>前回との差分</strong> ` +
          `<span class="diff-badge ${cls}">${sign}${delta} 点</span> ` +
          `<span class="muted">（前回 ${prev.totalScore}/100 ${escapeHtml(prev.level)} ・ ${escapeHtml((prev.at || '').split('T')[0])}）</span>`;
      }
    }
  }

  function renderRadarChart(categoryScores) {
    const canvas = document.getElementById('radar-chart');
    if (!canvas) return;
    const size = 340;
    const cx = size / 2, cy = size / 2;
    const maxR = size / 2 - 50;
    const n = categoryScores.length;

    const ringRadii = [0.25, 0.5, 0.75, 1.0].map(f => f * maxR);
    const ringLabels = ['25', '50', '75', '100'];

    const angleFor = i => (i / n) * 2 * Math.PI - Math.PI / 2;
    const pointAt = (i, r) => ({ x: cx + r * Math.cos(angleFor(i)), y: cy + r * Math.sin(angleFor(i)) });

    const rings = ringRadii.map((r, ri) => {
      const pts = Array.from({ length: n }, (_, i) => pointAt(i, r));
      const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';
      const labelPt = pointAt(0, r);
      return `<path d="${d}" fill="none" stroke="var(--color-border-strong)" stroke-width="1"/>
              <text x="${(labelPt.x + 2).toFixed(1)}" y="${(labelPt.y - 3).toFixed(1)}" class="ring-label">${ringLabels[ri]}</text>`;
    }).join('');

    const axes = Array.from({ length: n }, (_, i) => {
      const p = pointAt(i, maxR);
      return `<line x1="${cx}" y1="${cy}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="var(--color-border-strong)" stroke-width="1"/>`;
    }).join('');

    const scorePoints = categoryScores.map((s, i) => pointAt(i, ((s.score ?? 0) / 100) * maxR));
    const scorePath = scorePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';

    // UX6: interactive dots (hover shows value, click jumps to category)
    const scoreDots = categoryScores.map((s, i) => {
      const p = scorePoints[i];
      const idx = CATEGORIES.findIndex(c => c.id === s.categoryId);
      return `<circle class="radar-dot" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="5"
                fill="#1E40AF" data-cat-index="${idx}" tabindex="0" role="button"
                aria-label="${escapeHtml(s.name)} ${s.score ?? 'N/A'}点。クリックでこの領域へ移動">
                <title>${escapeHtml(s.name)}: ${s.score ?? 'N/A'}/100</title></circle>`;
    }).join('');

    const labels = categoryScores.map((s, i) => {
      const p = pointAt(i, maxR + 22);
      const anchor = p.x < cx - 5 ? 'end' : p.x > cx + 5 ? 'start' : 'middle';
      const lv = determineLevelForScore(s.score);
      const idx = CATEGORIES.findIndex(c => c.id === s.categoryId);
      return `<text x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}" text-anchor="${anchor}"
                class="axis-label ${lv.cssClass}-text" data-cat-index="${idx}"
                title="${escapeHtml(s.name)}">${escapeHtml(s.abbr)}</text>`;
    }).join('');

    canvas.innerHTML = `
      <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        ${rings}${axes}
        <path d="${scorePath}" fill="rgba(30,64,175,0.12)" stroke="#1E40AF" stroke-width="2"/>
        ${scoreDots}${labels}
      </svg>`;
  }

  function renderRisksList(risks) {
    const el = document.getElementById('risks-list');
    if (!el) return;
    if (risks.length === 0) {
      el.innerHTML = '<p class="empty-state">✓ 優先対応が必要な高リスク項目はありません。</p>';
      return;
    }
    el.innerHTML = risks.slice(0, 8).map(r => {
      const catName = CATEGORIES.find(c => c.id === r.categoryId)?.abbr || '';
      return `
        <div class="risk-item severity-${r.severity}">
          <div class="risk-header">
            <span class="severity-badge ${r.severity}">${r.severity === 'critical' ? '重大' : '高'}</span>
            <span class="risk-category">${escapeHtml(catName)}</span>
          </div>
          <p class="risk-question">${escapeHtml(r.question)}</p>
          <p class="risk-action">${escapeHtml(r.recommendation)}</p>
        </div>`;
    }).join('');
  }

  function renderIssuesList(issues) {
    const el = document.getElementById('issues-list');
    if (!el) return;
    if (issues.length === 0) {
      el.innerHTML = '<p class="empty-state">改善Issue案は生成されませんでした。</p>';
      return;
    }
    el.innerHTML = issues.map(issue => `
      <div class="issue-item priority-${issue.priority.toLowerCase()}">
        <span class="priority-badge">${escapeHtml(issue.priority)}</span>
        <span class="issue-category">${escapeHtml(issue.category)}</span>
        <p class="issue-title">${escapeHtml(issue.title)}</p>
      </div>`).join('');
  }

  function renderCategoryGrid(categoryScores) {
    const el = document.getElementById('category-scores-grid');
    if (!el) return;
    el.innerHTML = categoryScores.map(s => {
      const lv = determineLevelForScore(s.score);
      const pct = s.score !== null ? s.score : 0;
      return `
        <div class="cat-score-card">
          <div class="cat-score-header">
            <span class="cat-score-name">${escapeHtml(s.name)}</span>
            <span class="cat-score-badge ${lv.cssClass}">${lv.icon} ${s.score !== null ? s.score : 'N/A'}</span>
          </div>
          <div class="cat-score-bar">
            <div class="cat-score-fill ${lv.cssClass}" style="width:${pct}%"></div>
          </div>
        </div>`;
    }).join('');
  }

  function renderReport() {
    const r = state.results;
    if (!r) return;
    const reportEl = document.getElementById('report-content');
    if (reportEl) reportEl.textContent = generateMarkdownReport(r);
    renderSelfCheckPrompt();
    setText('report-project-name', r.projectName);
    setText('report-score-summary', `${r.totalScore}/100 — ${r.level.name}`);

    // FT6: maturity badge
    const badgeEl = document.getElementById('report-badge');
    if (badgeEl) badgeEl.innerHTML = generateBadgeSVG(r.level);
  }

  function renderSelfCheckPrompt() {
    const r = state.results;
    if (!r) return;
    const el = document.getElementById('selfcheck-prompt');
    if (el) el.textContent = generateSelfCheckPrompt(state.selfCheckTab, r, state.aiModel);
    document.querySelectorAll('#selfcheck-tabs .tab-btn').forEach(btn => {
      const on = btn.dataset.tab === state.selfCheckTab;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  // ── DOM utilities ──────────────────────────────────────────────────────────

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function targetLabel(target) {
    return { human: '人間', ai: 'AIエージェント', repo: 'リポジトリ' }[target] || target;
  }

  function announce(msg) {
    const el = document.getElementById('a11y-live');
    if (el) el.textContent = msg;
  }

  // ── Event delegation & keyboard (UX1) ─────────────────────────────────────

  function initEventDelegation() {
    document.getElementById('category-nav')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-cat-index]');
      if (btn) jumpToCategory(parseInt(btn.dataset.catIndex, 10));
    });

    document.getElementById('q-choices')?.addEventListener('change', e => {
      if (e.target.type !== 'radio') return;
      const qid = e.target.dataset.qid;
      const score = parseInt(e.target.dataset.score, 10);
      if (qid && !isNaN(score)) selectAnswer(qid, score);
    });

    document.getElementById('q-na')?.addEventListener('change', e => {
      const qid = e.target.dataset.qid;
      if (qid) toggleNA(qid, e.target.checked);
    });

    // FT4: memo input — update without rerender to keep caret position
    document.getElementById('q-memo')?.addEventListener('input', e => {
      const qid = e.target.dataset.qid;
      if (qid) { state.memos = { ...state.memos, [qid]: e.target.value }; persist(); }
    });

    document.getElementById('selfcheck-tabs')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-tab]');
      if (btn) switchSelfCheckTab(btn.dataset.tab);
    });

    // UX3: review grid cell → jump to question
    document.getElementById('review-grid')?.addEventListener('click', e => {
      const cell = e.target.closest('[data-review-qid]');
      if (cell) jumpToQuestion(cell.dataset.reviewQid);
    });

    // UX6: radar dot/label → jump to category
    document.getElementById('radar-chart')?.addEventListener('click', e => {
      const t = e.target.closest('[data-cat-index]');
      if (t) setState({ screen: 'assessment', categoryIndex: parseInt(t.dataset.catIndex, 10), questionIndex: 0 });
    });

    // Theme toggles (UX4)
    document.querySelectorAll('[data-theme-toggle]').forEach(b => b.addEventListener('click', toggleTheme));

    // UX1: keyboard navigation on assessment
    document.addEventListener('keydown', handleKeydown);
  }

  function handleKeydown(e) {
    if (state.screen !== 'assessment') return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'textarea' || (tag === 'input' && e.target.type === 'text') || tag === 'select') return;

    const catQs = questionsForCategory(state.categoryIndex);
    const q = catQs[state.questionIndex];
    if (!q) return;

    if (e.key >= '0' && e.key <= '3') {
      selectAnswer(q.id, parseInt(e.key, 10)); e.preventDefault();
    } else if (e.key === 'n' || e.key === 'N') {
      const isNA = state.answers[q.id] === null && q.id in state.answers;
      toggleNA(q.id, !isNA); e.preventDefault();
    } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
      nextQuestion(); e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      prevQuestion(); e.preventDefault();
    }
  }

  // ── Initialize on load ─────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();

    // UX2 / F4: guard against corrupt question data
    const schema = validateQuestionSchema(QUESTIONS);
    if (!schema.valid) {
      const errEl = document.getElementById('screen-error');
      const listEl = document.getElementById('error-detail');
      if (listEl) listEl.textContent = schema.errors.slice(0, 8).join(' / ');
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      if (errEl) errEl.classList.add('active');
      return;
    }

    initEventDelegation();

    // FT1: restore from shared URL if present
    const fromHash = decodeHashToState(location.hash);
    if (fromHash && Object.keys(fromHash.answers).length > 0) {
      state = { ...INITIAL_STATE, answers: fromHash.answers, projectName: fromHash.projectName, screen: 'assessment' };
    }

    render(true);
  });

  return {
    startFresh, loadSample, resume, importJSON, goTo, goReview,
    nextQuestion, prevQuestion, jumpToCategory, jumpToQuestion,
    selectAnswer, toggleNA, viewResults,
    switchSelfCheckTab, setAiModel, toggleTheme,
    copyReport, copySelfCheck, copyShareUrl, copyIssues, copyBadge,
    exportJSON, exportReportCSV, exportIssuesCSV,
  };
})();

/* Node (test harness) からの参照用。ブラウザ実行時の挙動には影響しない。 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = App;
}
