/* app.js — Application state machine and UI rendering.
 * State is immutable: every update creates a new state object.
 */

const App = (function () {
  const INITIAL_STATE = {
    screen: 'welcome',
    answers: {},
    projectName: '',
    categoryIndex: 0,
    questionIndex: 0,
    results: null,
    selfCheckTab: 'pre-impl',
    radarChart: null,
  };

  let state = { ...INITIAL_STATE };

  function setState(partial) {
    const prev = state;
    state = { ...state, ...partial };
    render(prev.screen !== state.screen);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  function startFresh() {
    const name = document.getElementById('project-name-input')?.value.trim() || '';
    setState({ ...INITIAL_STATE, projectName: name, screen: 'assessment', answers: {} });
  }

  function loadSample() {
    setState({
      ...INITIAL_STATE,
      projectName: SAMPLE_PROJECT_NAME,
      answers: { ...SAMPLE_ANSWERS },
      screen: 'assessment',
      categoryIndex: 0,
      questionIndex: 0,
    });
  }

  function goTo(screen) {
    if (screen === 'results') {
      const results = buildResults(state.answers, state.projectName);
      setState({ screen, results });
    } else {
      setState({ screen });
    }
  }

  function nextQuestion() {
    const catQs = questionsForCategory(state.categoryIndex);
    if (state.questionIndex < catQs.length - 1) {
      setState({ questionIndex: state.questionIndex + 1 });
      return;
    }
    if (state.categoryIndex < CATEGORIES.length - 1) {
      setState({ categoryIndex: state.categoryIndex + 1, questionIndex: 0 });
    } else {
      goTo('results');
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
    goTo('results');
  }

  function switchSelfCheckTab(tab) {
    setState({ selfCheckTab: tab });
    renderSelfCheckPrompt();
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
  }

  function copyReport() {
    const text = generateMarkdownReport(state.results);
    copyToClipboard(text, 'report-copy-feedback');
  }

  function copySelfCheck() {
    const text = generateSelfCheckPrompt(state.selfCheckTab, state.results);
    copyToClipboard(text, 'selfcheck-copy-feedback');
  }

  function copyShareURL() {
    const search = encodeStateToURL(state.answers, state.projectName);
    const url = window.location.origin + window.location.pathname + search;
    copyToClipboard(url, 'share-url-feedback');
  }

  function dismissURLBanner() {
    const el = document.getElementById('url-import-banner');
    if (el) el.hidden = true;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function questionsForCategory(catIndex) {
    const cat = CATEGORIES[catIndex];
    return QUESTIONS.filter(q => q.categoryId === cat.id);
  }

  function copyToClipboard(text, feedbackId) {
    navigator.clipboard.writeText(text).then(() => {
      const el = document.getElementById(feedbackId);
      if (!el) return;
      el.textContent = 'コピーしました';
      setTimeout(() => { el.textContent = ''; }, 2000);
    }).catch(() => {
      const el = document.getElementById(feedbackId);
      if (el) el.textContent = 'コピーに失敗しました。手動で選択してコピーしてください。';
    });
  }

  // ── Rendering ──────────────────────────────────────────────────────────────

  function render(screenChanged) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + state.screen)?.classList.add('active');

    switch (state.screen) {
      case 'welcome':    renderWelcome(); break;
      case 'assessment': renderAssessment(); break;
      case 'results':    if (screenChanged) renderResults(); break;
      case 'report':     if (screenChanged) renderReport(); break;
    }
  }

  function renderWelcome() {
    const grid = document.getElementById('welcome-areas');
    if (!grid) return;
    grid.innerHTML = CATEGORIES.map((c, i) => `
      <div class="area-chip">
        <span class="area-number">${i + 1}</span>
        <span class="area-name">${escapeHtml(c.name)}</span>
      </div>
    `).join('');

    const nameInput = document.getElementById('project-name-input');
    if (nameInput && state.projectName) nameInput.value = state.projectName;
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

    const { answered, total } = getCategoryProgress(cat.id, state.answers);
    const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
    const fill = document.getElementById('cat-progress-fill');
    if (fill) fill.style.width = pct + '%';
    setText('cat-progress-text', `${answered}/${total} 回答済み`);

    const choicesEl = document.getElementById('q-choices');
    if (choicesEl) {
      // data-qid / data-score carry values; no inline handlers (XSS prevention)
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

    const riskEl = document.getElementById('risk-preview');
    if (riskEl && currentAnswer !== undefined && !isNA) {
      const showRisk = currentAnswer <= 1;
      riskEl.style.display = showRisk ? 'block' : 'none';
      if (showRisk) {
        riskEl.innerHTML = `
          <div class="risk-icon">⚠</div>
          <div>
            <strong>リスク:</strong> ${escapeHtml(q.riskIfLow)}
          </div>
        `;
      }
    } else if (riskEl) {
      riskEl.style.display = 'none';
    }

    const prevBtn = document.getElementById('prev-btn');
    if (prevBtn) prevBtn.disabled = state.categoryIndex === 0 && state.questionIndex === 0;

    const nextBtn = document.getElementById('next-btn');
    const isLast = state.categoryIndex === CATEGORIES.length - 1 &&
                   state.questionIndex === catQs.length - 1;
    if (nextBtn) nextBtn.textContent = isLast ? '結果を見る →' : '次へ →';
  }

  function renderTotalProgress() {
    const total = QUESTIONS.length;
    const answered = getAnsweredCount(state.answers);
    setText('total-answered', answered);
    setText('total-questions', total);
  }

  function renderResults() {
    const r = state.results;
    if (!r) return;

    const maturityCard = document.getElementById('maturity-card');
    if (maturityCard) maturityCard.className = 'maturity-card ' + r.level.cssClass;

    setText('maturity-score', r.totalScore + '/100');
    setText('maturity-level', r.level.icon + ' ' + r.level.name);
    setText('maturity-desc', r.level.description);

    renderRadarChart(r.categoryScores);
    renderRisksList(r.risks);
    renderIssuesList(r.issues);
    renderCategoryGrid(r.categoryScores);
    renderExecSummary(r);
  }

  function renderExecSummary(r) {
    const date = new Date().toISOString().split('T')[0];
    setText('es-project-name', r.projectName);
    setText('es-date', date);
    setText('es-total-score', r.totalScore + '/100');
    setText('es-level', r.level.icon + ' ' + r.level.name);
    setText('es-level-desc', r.level.description);

    const risksEl = document.getElementById('es-risks-list');
    if (risksEl) {
      risksEl.innerHTML = r.risks.slice(0, 5).map(risk => {
        const catName = CATEGORIES.find(c => c.id === risk.categoryId)?.abbr || '';
        const sev = escapeHtml(risk.severity);
        const sevLabel = risk.severity === 'critical' ? '重大' : '高';
        return `<div class="es-risk-item">
          <span class="severity-badge ${sev}">${sevLabel}</span>
          <span class="es-risk-cat">${escapeHtml(catName)}</span>
          <span class="es-risk-text">${escapeHtml(risk.recommendation)}</span>
        </div>`;
      }).join('') || '<p>優先リスクは検出されませんでした。</p>';
    }

    const actionsEl = document.getElementById('es-actions-list');
    if (actionsEl) {
      actionsEl.innerHTML = r.issues.slice(0, 3).map(issue =>
        `<li><strong>${escapeHtml(issue.priority)}</strong> ${escapeHtml(issue.title)}</li>`
      ).join('') || '<li>改善アクションは生成されませんでした。</li>';
    }

    const el = document.getElementById('exec-summary-print');
    if (el) el.removeAttribute('aria-hidden');
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
    const pointAt = (i, r) => ({
      x: cx + r * Math.cos(angleFor(i)),
      y: cy + r * Math.sin(angleFor(i)),
    });

    const rings = ringRadii.map((r, ri) => {
      const pts = Array.from({ length: n }, (_, i) => pointAt(i, r));
      const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';
      const labelPt = pointAt(0, r);
      return `<path d="${d}" fill="none" stroke="#CBD5E1" stroke-width="1"/>
              <text x="${(labelPt.x + 2).toFixed(1)}" y="${(labelPt.y - 3).toFixed(1)}"
                    class="ring-label">${ringLabels[ri]}</text>`;
    }).join('');

    const axes = Array.from({ length: n }, (_, i) => {
      const p = pointAt(i, maxR);
      return `<line x1="${cx}" y1="${cy}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}"
                    stroke="#CBD5E1" stroke-width="1"/>`;
    }).join('');

    const scorePoints = categoryScores.map((s, i) => {
      const val = (s.score ?? 0) / 100;
      return pointAt(i, val * maxR);
    });
    const scorePath = scorePoints.map((p, i) =>
      `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
    ).join(' ') + ' Z';
    const scoreDots = scorePoints.map(p =>
      `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="#1E40AF"/>`
    ).join('');

    const labels = categoryScores.map((s, i) => {
      const p = pointAt(i, maxR + 22);
      const anchor = p.x < cx - 5 ? 'end' : p.x > cx + 5 ? 'start' : 'middle';
      const lv = determineLevelForScore(s.score);
      return `<text x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}"
                    text-anchor="${anchor}" class="axis-label ${lv.cssClass}-text"
                    title="${escapeHtml(s.name)}">${escapeHtml(s.abbr)}</text>`;
    }).join('');

    canvas.innerHTML = `
      <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        ${rings}
        ${axes}
        <path d="${scorePath}" fill="rgba(30,64,175,0.12)" stroke="#1E40AF" stroke-width="2"/>
        ${scoreDots}
        ${labels}
      </svg>
    `;
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
        </div>
      `;
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
      </div>
    `).join('');
  }

  function renderCategoryGrid(categoryScores) {
    const el = document.getElementById('category-scores-grid');
    if (!el) return;
    const topId = state.results?.topPriorityCategory?.categoryId ?? null;
    el.innerHTML = categoryScores.map(s => {
      const lv = determineLevelForScore(s.score);
      const pct = s.score !== null ? s.score : 0;
      const isTop = topId !== null && s.categoryId === topId;
      return `
        <div class="cat-score-card${isTop ? ' top-priority' : ''}">
          <div class="cat-score-header">
            <span class="cat-score-name">${escapeHtml(s.name)}</span>
            <div class="cat-score-badges">
              ${isTop ? '<span class="top-priority-badge">最優先</span>' : ''}
              <span class="cat-score-badge ${escapeHtml(lv.cssClass)}">${escapeHtml(lv.icon)} ${s.score !== null ? s.score : 'N/A'}</span>
            </div>
          </div>
          <div class="cat-score-bar">
            <div class="cat-score-fill ${escapeHtml(lv.cssClass)}" style="width:${pct}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderReport() {
    const r = state.results;
    if (!r) return;
    const reportEl = document.getElementById('report-content');
    if (reportEl) reportEl.textContent = generateMarkdownReport(r);
    renderSelfCheckPrompt();
    const pnEl = document.getElementById('report-project-name');
    if (pnEl) pnEl.textContent = escapeHtml(r.projectName);
    const scoreEl = document.getElementById('report-score-summary');
    if (scoreEl) scoreEl.textContent = `${r.totalScore}/100 — ${r.level.name}`;
  }

  function renderSelfCheckPrompt() {
    const r = state.results;
    if (!r) return;
    const el = document.getElementById('selfcheck-prompt');
    if (el) el.textContent = generateSelfCheckPrompt(state.selfCheckTab, r);
    // Sync tab button active state (data-tab drives the delegation listener)
    document.querySelectorAll('#selfcheck-tabs .tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === state.selfCheckTab);
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

  // ── Event delegation (no inline handlers in dynamic HTML) ─────────────────

  function initEventDelegation() {
    // Category nav: data-cat-index
    document.getElementById('category-nav')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-cat-index]');
      if (btn) jumpToCategory(parseInt(btn.dataset.catIndex, 10));
    });

    // Answer choices: data-qid + data-score
    document.getElementById('q-choices')?.addEventListener('change', e => {
      if (e.target.type !== 'radio') return;
      const qid = e.target.dataset.qid;
      const score = parseInt(e.target.dataset.score, 10);
      if (qid && !isNaN(score)) selectAnswer(qid, score);
    });

    // N/A checkbox: data-qid
    document.getElementById('q-na')?.addEventListener('change', e => {
      const qid = e.target.dataset.qid;
      if (qid) toggleNA(qid, e.target.checked);
    });

    // Self-check tabs: data-tab
    document.getElementById('selfcheck-tabs')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-tab]');
      if (!btn) return;
      document.querySelectorAll('#selfcheck-tabs .tab-btn')
        .forEach(b => b.classList.toggle('active', b === btn));
      switchSelfCheckTab(btn.dataset.tab);
    });
  }

  // Initialize on load — check for shared URL state before rendering
  document.addEventListener('DOMContentLoaded', () => {
    initEventDelegation();
    const imported = decodeStateFromURL(window.location.search);
    if (imported) {
      state = { ...INITIAL_STATE, answers: imported.answers, projectName: imported.projectName, screen: 'assessment' };
      render(true);
      const banner = document.getElementById('url-import-banner');
      if (banner) banner.hidden = false;
    } else {
      render(true);
    }
  });

  return {
    startFresh, loadSample, goTo,
    nextQuestion, prevQuestion, jumpToCategory,
    selectAnswer, toggleNA, viewResults,
    switchSelfCheckTab, copyReport, copySelfCheck,
    copyShareURL, dismissURLBanner,
  };
})();
