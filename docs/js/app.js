/* app.js — Application state machine and UI rendering.
 * State is immutable: every update creates a new state object.
 */

const App = (function () {
  // Simple client-side access control (not cryptographic security).
  const ADMIN_PASSWORD = 'aidd2024';

  const INITIAL_STATE = {
    screen: 'welcome',
    answers: {},
    projectName: '',
    categoryIndex: 0,
    questionIndex: 0,
    results: null,
    selfCheckTab: 'pre-impl',
    radarChart: null,
    mode: 'guest',
    adminTab: 'categories',
  };

  let state = { ...INITIAL_STATE };

  // Ephemeral admin editor state (not part of immutable app state)
  let _adminEditingCatId = null;
  let _adminEditingQId = null;
  let _adminQCatFilter = null;

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
    copyToClipboard(text);
  }

  function copySelfCheck() {
    const text = generateSelfCheckPrompt(state.selfCheckTab, state.results);
    copyToClipboard(text);
  }

  function copyShareURL() {
    const search = encodeStateToURL(state.answers, state.projectName);
    const url = window.location.origin + window.location.pathname + search;
    copyToClipboard(url);
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

  function copyToClipboard(text) {
    const toast = document.getElementById('copy-toast');
    function showToast(msg, duration) {
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), duration);
    }
    navigator.clipboard.writeText(text)
      .then(() => showToast('コピーしました', 2000))
      .catch(() => showToast('コピーに失敗しました。手動で選択してコピーしてください。', 3000));
  }

  // ── Rendering ──────────────────────────────────────────────────────────────

  function render(screenChanged) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + state.screen)?.classList.add('active');
    document.querySelectorAll('.sidenav-context').forEach(s => s.classList.remove('active'));
    document.getElementById('sidenav-' + state.screen)?.classList.add('active');

    // Update admin nav button label
    const adminBtn = document.getElementById('admin-nav-btn');
    if (adminBtn) {
      adminBtn.textContent = state.mode === 'admin' ? '管理者モード中' : '管理者ログイン';
    }

    switch (state.screen) {
      case 'welcome':    renderWelcome(); break;
      case 'assessment': renderAssessment(); break;
      case 'results':    if (screenChanged) renderResults(); break;
      case 'report':     if (screenChanged) renderReport(); break;
      case 'guide':      if (screenChanged) renderGuide(); break;
      case 'help':       if (screenChanged) renderHelp(); break;
      case 'catalog':    if (screenChanged) renderCatalog(); break;
      case 'rationale':  if (screenChanged) renderRationale(); break;
      case 'admin':      renderAdmin(); break;
    }
  }

  function renderWelcome() {
    const nav = document.getElementById('welcome-areas-nav');
    if (nav) {
      nav.innerHTML = CATEGORIES.map((c, i) => `
        <li class="sidenav-area-item">
          <span class="sidenav-area-num">${i + 1}</span>
          <span>${escapeHtml(c.name)}</span>
        </li>
      `).join('');
    }

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

    setText('sidenav-project-name', r.projectName || '（未設定）');
    setText('sidenav-result-score', r.totalScore + '/100');
    setText('sidenav-result-level', r.level.icon + ' ' + r.level.name);

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

    setText('sidenav-report-project-name', r.projectName || '（未設定）');
    setText('sidenav-report-level', r.level.icon + ' ' + r.level.name);

    const reportEl = document.getElementById('report-content');
    if (reportEl) reportEl.textContent = generateMarkdownReport(r);
    renderSelfCheckPrompt();
    const pnEl = document.getElementById('report-project-name');
    if (pnEl) pnEl.textContent = escapeHtml(r.projectName);
    const scoreEl = document.getElementById('report-score-summary');
    if (scoreEl) scoreEl.textContent = `${r.totalScore}/100 — ${r.level.name}`;
  }

  function renderGuide() {
    const el = document.getElementById('guide-content');
    if (!el) return;
    el.innerHTML = `
      <main class="content-main">
        <div class="content-hero">
          <div class="content-badge">ユーザーガイド</div>
          <h1 class="content-title">AIDD Process Next の使い方</h1>
          <p class="content-lead">本ツールはAIを活用した開発プロセスの品質成熟度を、10の診断領域・50問で自己診断します。</p>
        </div>

        <div class="guide-sections">
          <section class="guide-section">
            <h2 class="guide-section-title">診断の流れ</h2>
            <ol class="guide-steps">
              <li><strong>プロジェクト名を入力</strong>（任意）。URLで共有する際の識別に使います。</li>
              <li><strong>「診断を開始」</strong>をクリックし、10カテゴリ順に回答します。</li>
              <li>各質問に対して<strong>0〜3のスコアで回答</strong>します。該当しない場合は「対象外」を選択できます。</li>
              <li>全50問が終わると<strong>診断結果</strong>が自動表示されます。途中でも「結果を見る」で確認できます。</li>
              <li>結果画面から<strong>Markdownレポート</strong>と<strong>URLの共有</strong>が可能です。</li>
            </ol>
          </section>

          <section class="guide-section">
            <h2 class="guide-section-title">スコアの見方（BARS方式）</h2>
            <p class="guide-desc">各質問は行動固定評価尺度（BARS: Behaviorally Anchored Rating Scale）で設計されています。抽象的な感覚値ではなく、具体的な行動状態で自チームの現状を選びます。</p>
            <div class="guide-score-table">
              <div class="guide-score-row">
                <span class="guide-score-badge score-0">0</span>
                <div>
                  <strong>未整備</strong>
                  <p>取り組みが存在しない、またはまったく定義されていない状態。</p>
                </div>
              </div>
              <div class="guide-score-row">
                <span class="guide-score-badge score-1">1</span>
                <div>
                  <strong>属人的</strong>
                  <p>口頭の慣習や個人の記憶に依存し、文書化・共有されていない状態。</p>
                </div>
              </div>
              <div class="guide-score-row">
                <span class="guide-score-badge score-2">2</span>
                <div>
                  <strong>定義済み</strong>
                  <p>チームで共有された文書・手順・ツールが存在し、新規参画者も読める状態。</p>
                </div>
              </div>
              <div class="guide-score-row">
                <span class="guide-score-badge score-3">3</span>
                <div>
                  <strong>運用定着</strong>
                  <p>定期的な見直しと改善が行われ、実効性を継続的に確認している状態。</p>
                </div>
              </div>
            </div>
          </section>

          <section class="guide-section">
            <h2 class="guide-section-title">評価対象の種別（ターゲット）</h2>
            <p class="guide-desc">各質問には回答の主体を示す「ターゲット」が付いています。</p>
            <div class="guide-target-list">
              <div class="guide-target-item">
                <span class="question-target-badge" data-target="human">人間</span>
                <p>チームや組織として整備すべきプロセス・ポリシー・文書に関する質問です。</p>
              </div>
              <div class="guide-target-item">
                <span class="question-target-badge" data-target="ai">AIエージェント</span>
                <p>AIエージェントへの指示・制約・完了条件の設計に関する質問です。</p>
              </div>
              <div class="guide-target-item">
                <span class="question-target-badge" data-target="repo">リポジトリ</span>
                <p>コードベースやCI/CDパイプラインに整備すべき仕組みに関する質問です。</p>
              </div>
            </div>
          </section>

          <section class="guide-section">
            <h2 class="guide-section-title">成熟度レベル（総合スコア）</h2>
            <div class="guide-level-table">
              <div class="guide-level-row lv3">
                <span class="guide-level-score">75〜100</span>
                <div>
                  <strong>◎ 定着</strong>
                  <p>AIプロセスが組織的に定着し、継続的な改善サイクルが回っている状態。</p>
                </div>
              </div>
              <div class="guide-level-row lv2">
                <span class="guide-level-score">50〜74</span>
                <div>
                  <strong>○ 構築中</strong>
                  <p>主要な仕組みが整いつつあるが、一部領域にまだ整備が必要な状態。</p>
                </div>
              </div>
              <div class="guide-level-row lv1">
                <span class="guide-level-score">25〜49</span>
                <div>
                  <strong>△ 初期</strong>
                  <p>個別の取り組みはあるが、体系化・共有化が不十分な状態。</p>
                </div>
              </div>
              <div class="guide-level-row lv0">
                <span class="guide-level-score">0〜24</span>
                <div>
                  <strong>✕ 未整備</strong>
                  <p>AIを活用した開発の品質管理がほぼ未整備な状態。</p>
                </div>
              </div>
            </div>
          </section>

          <section class="guide-section">
            <h2 class="guide-section-title">結果の活用方法</h2>
            <ul class="guide-list">
              <li><strong>「優先リスク」</strong>：スコアが低く影響が大きい項目をピックアップします。改善の着手順の参考にします。</li>
              <li><strong>「改善Issue案」</strong>：GitHub Issuesなどへそのまま登録できるテキストを生成します。</li>
              <li><strong>「Markdownレポート」</strong>：ステークホルダーへの報告資料として活用できます。</li>
              <li><strong>「AIエージェント自己点検プロンプト」</strong>：Claude Code・Cursor・Codexなどへ貼り付けて使います。</li>
              <li><strong>「URLをコピー」</strong>：回答状態をURLに圧縮し、チームへ共有できます。</li>
            </ul>
          </section>

          <section class="guide-section guide-section-note">
            <h2 class="guide-section-title">利用上の注意</h2>
            <ul class="guide-list">
              <li>入力内容はブラウザ内で処理され、外部サーバーへは送信されません。</li>
              <li>v0.1は300件規模の根拠レビュー完了前の検証前ドラフトです。セキュリティ認証・監査基準の代替としては使用できません。</li>
              <li>スコアリングモデルは今後の検証を経て変更される可能性があります。</li>
            </ul>
          </section>
        </div>
      </main>
    `;
  }

  function renderHelp() {
    const el = document.getElementById('help-content');
    if (!el) return;
    const faqs = [
      {
        q: '入力した回答はどこかに保存されますか？',
        a: 'いいえ。すべてブラウザのメモリ内で処理されます。ページを閉じると回答は消えます。結果を保存するには「URLをコピー」して手元に保存してください。',
      },
      {
        q: 'URLで共有するとどんな情報が含まれますか？',
        a: '回答値（スコアまたはN/A）とプロジェクト名がBase64でエンコードされてURLに含まれます。選択肢のテキスト内容は含まれません。',
      },
      {
        q: '「対象外（N/A）」を選ぶと何が変わりますか？',
        a: 'そのプロジェクトに該当しない質問はN/Aとしてスコア計算から除外されます。分母から外れるため、他の質問の得点率に影響します。',
      },
      {
        q: 'サンプルデータはどんな内容ですか？',
        a: '中程度の成熟度（スコア30〜50点台）を想定したデモ用回答です。ツールの動作確認や説明デモに使えます。',
      },
      {
        q: '途中で回答を中断できますか？',
        a: '「URLをコピー」でその時点の回答状態をURLに保存できます。次回そのURLを開くと回答が復元されます。',
      },
      {
        q: 'Markdownレポートはどこで使えますか？',
        a: 'GitHub Issues、Confluence、Notion、Slackなど、Markdownを表示できるツールであればそのまま貼り付けて使えます。',
      },
      {
        q: 'AIエージェント自己点検プロンプトとは何ですか？',
        a: '診断結果に基づいてカスタマイズされた、実装前・PR前・マージ前に使えるチェックリストプロンプトです。Claude Code、Cursor、Codexなどのコーディングエージェントに貼り付けて使います。',
      },
      {
        q: '診断結果を認証や監査に使えますか？',
        a: 'いいえ。v0.1は検証前ドラフトです。300件規模の実案件での根拠レビューが完了するまでは、改善活動のたたき台としてのみご使用ください。ISO審査・セキュリティ認証・法的監査の代替にはなりません。',
      },
      {
        q: '全50問に回答しなくても結果は出ますか？',
        a: 'はい。途中でも「結果を見る」から診断結果を確認できます。未回答の質問はスコア計算から除外されます。',
      },
    ];

    const glossary = [
      { term: 'AIDD', desc: 'AI-Driven Development（AI駆動開発）の略。AIエージェントをコア開発手段として活用する開発スタイル。' },
      { term: 'BARS', desc: 'Behaviorally Anchored Rating Scale（行動固定評価尺度）。抽象的な評価ではなく、具体的な行動記述でレベルを定義する評価方式。' },
      { term: 'AGENTS.md / CLAUDE.md', desc: 'AIエージェントへのプロジェクト固有指示を記述するファイル。リポジトリに配置することでAIがプロジェクトの規約・制約を参照できる。' },
      { term: 'CURRENT_STATE.md', desc: 'AIセッション間の作業状態引き継ぎ文書。現在フェーズ、完了済み、次作業、保留事項などを記載する。' },
      { term: 'ADR', desc: 'Architecture Decision Record（アーキテクチャ決定記録）。技術的判断の背景・選択肢・決定・影響を文書化するもの。' },
      { term: 'SAST', desc: 'Static Application Security Testing（静的アプリケーションセキュリティテスト）。コードを実行せずに脆弱性を検出するツール。' },
      { term: '品質ゲート', desc: 'CI/CDパイプラインに設置する合否判定チェックポイント。lint・test・buildなど設定した条件を満たさなければマージを阻止する。' },
    ];

    el.innerHTML = `
      <main class="content-main">
        <div class="content-hero">
          <div class="content-badge">ヘルプ</div>
          <h1 class="content-title">よくある質問と用語集</h1>
        </div>

        <div class="guide-sections">
          <section class="guide-section">
            <h2 class="guide-section-title">よくある質問（FAQ）</h2>
            <div class="faq-list">
              ${faqs.map(f => `
                <div class="faq-item">
                  <p class="faq-q">${escapeHtml(f.q)}</p>
                  <p class="faq-a">${escapeHtml(f.a)}</p>
                </div>
              `).join('')}
            </div>
          </section>

          <section class="guide-section">
            <h2 class="guide-section-title">用語集</h2>
            <dl class="glossary-list">
              ${glossary.map(g => `
                <div class="glossary-item">
                  <dt class="glossary-term">${escapeHtml(g.term)}</dt>
                  <dd class="glossary-desc">${escapeHtml(g.desc)}</dd>
                </div>
              `).join('')}
            </dl>
          </section>
        </div>
      </main>
    `;
  }

  function renderCatalog() {
    const el = document.getElementById('catalog-content');
    const nav = document.getElementById('catalog-areas-nav');
    if (!el) return;

    if (nav) {
      nav.innerHTML = CATEGORIES.map((c, i) => `
        <li class="sidenav-area-item">
          <span class="sidenav-area-num">${i + 1}</span>
          <span>${escapeHtml(c.name)}</span>
        </li>
      `).join('');
    }

    const targetLabel = t => ({ human: '人間', ai: 'AIエージェント', repo: 'リポジトリ' }[t] || t);

    el.innerHTML = `
      <main class="content-main content-main-wide">
        <div class="content-hero">
          <div class="content-badge">診断項目一覧</div>
          <h1 class="content-title">10領域 · 50問 診断項目一覧</h1>
          <p class="content-lead">各質問のスコア基準・リスク・改善推奨事項の一覧です。診断前の準備や、チームでの内容確認にご活用ください。</p>
        </div>

        ${CATEGORIES.map((cat, ci) => {
          const qs = QUESTIONS.filter(q => q.categoryId === cat.id);
          return `
            <section class="catalog-category" id="catalog-cat-${cat.id}">
              <div class="catalog-cat-header">
                <span class="catalog-cat-num">${ci + 1}</span>
                <h2 class="catalog-cat-title">${escapeHtml(cat.name)}</h2>
                <span class="catalog-cat-count">${qs.length}問</span>
              </div>
              ${qs.map((q, qi) => `
                <div class="catalog-question">
                  <div class="catalog-q-meta">
                    <span class="catalog-q-id">${escapeHtml(q.id)}</span>
                    <span class="question-target-badge" data-target="${escapeHtml(q.target)}">${escapeHtml(targetLabel(q.target))}</span>
                  </div>
                  <p class="catalog-q-text">${escapeHtml(q.question)}</p>
                  <div class="catalog-choices">
                    ${q.choices.map(c => `
                      <div class="catalog-choice">
                        <span class="catalog-choice-score score-${c.score}">${c.score}</span>
                        <div>
                          <strong>${escapeHtml(c.label)}</strong>
                          <span class="catalog-choice-desc">${escapeHtml(c.description)}</span>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                  <div class="catalog-q-risk">
                    <span class="catalog-risk-label">低スコア時のリスク</span>
                    <p>${escapeHtml(q.riskIfLow)}</p>
                  </div>
                  <div class="catalog-q-rec">
                    <span class="catalog-rec-label">改善推奨</span>
                    <p>${escapeHtml(q.recommendation)}</p>
                  </div>
                </div>
              `).join('')}
            </section>
          `;
        }).join('')}
      </main>
    `;
  }

  const RATIONALE_DATA = [
    {
      key: 'governance',
      title: 'AI利用ガバナンス',
      summary: 'AIツールの無統制な利用は、責任の空白・情報漏えい・品質ばらつきを生み出します。組織として利用方針を定め、人間の最終承認責任を明確にすることが、AI導入の基盤となります。',
      why: [
        'AIは指示された範囲で最適化するため、組織としての利用可否・制限を明示しなければ、個人ごとに異なる判断で運用される（統制の欠如）。',
        'AI生成コードが障害を引き起こした際、承認者・対応者が曖昧だと原因分析も再発防止も進まない。',
        'AI利用ポリシーは、顧客契約・セキュリティ要件・法規制との整合を保証する最初の関門である。',
      ],
      references: [
        { name: 'NIST AI RMF（AI リスク管理フレームワーク）', desc: 'AIシステムのガバナンス・マッピング・測定・管理の4機能を定義したリスク管理フレームワーク。' },
        { name: 'ISO/IEC 38500', desc: 'IT Governance国際規格。指揮・評価・モニタリングの原則がAI利用統制にも適用される。' },
        { name: 'EU AI Act', desc: 'ハイリスクAIシステムに対する人間による監視義務を規定。責任体制の明確化を求める。' },
      ],
    },
    {
      key: 'instructions',
      title: 'エージェント指示管理',
      summary: 'AIエージェントはコンテキストの範囲内でしか判断できません。指示の品質が直接アウトプットの品質を決定します。再利用可能な指示体系の整備は、AI活用の生産性と一貫性の基盤です。',
      why: [
        'AIは与えられたコンテキスト外の制約・慣習・判断基準を知ることができない。指示がなければ汎用的なベストプラクティスで動作し、プロジェクト固有の要件に反する。',
        '毎回のセッションで同じ前提を説明するコストは累積する。再利用可能な指示テンプレートはチームの認知負荷を下げる。',
        '過去の失敗・禁止事項を指示ファイルへ反映することで、同じミスのセッション間再発を防止できる。',
      ],
      references: [
        { name: 'Anthropic Agent Design Principles', desc: 'エージェント向けコンテキスト設計、タスク分解、フィードバックループの設計指針。' },
        { name: 'Claude Code CLAUDE.md概念', desc: 'プロジェクト固有の規約・禁止事項・完了条件をリポジトリ内ファイルで管理する設計パターン。' },
        { name: 'Prompt Engineering Guide（OpenAI / Anthropic）', desc: '明確な指示・制約・例示が出力品質を決定することを示す実証的なガイドライン。' },
      ],
    },
    {
      key: 'requirements',
      title: '要件・コンテキスト品質',
      summary: '仕様のない実装は仕様通りには動きません。AIも同様で、ゴールが曖昧なままでは推測で実装します。正確で機械可読な要件の整備が、AI生成コードの品質の前提条件です。',
      why: [
        'AIは会話の断片・不完全な仕様から実装を補完する。補完が多いほど意図からの逸脱リスクが高まる。',
        'AIセッションをまたぐと文脈が失われる。CURRENT_STATE.mdのような状態引き継ぎ文書がなければ重複作業・逆戻りが起きる。',
        'ADRで設計判断の理由を文書化することで、AIが過去に棄却された設計を再提案するリスクを下げられる。',
      ],
      references: [
        { name: 'IEEE 830 / ISO 29148（要求仕様書）', desc: '機能要件・非機能要件・制約・受入条件の構造化を定義する要求工学標準。' },
        { name: 'INCOSE Systems Engineering Handbook', desc: '要件トレーサビリティとコンテキスト管理の重要性を定義するシステム工学ガイド。' },
        { name: 'Architecture Decision Records（ADR）', desc: '設計判断の背景・選択肢・決定・影響を記録するパターン。Michael Nygard提唱。' },
      ],
    },
    {
      key: 'review',
      title: 'AI成果物レビュー',
      summary: 'AI生成コードには人間とは異なる失敗パターンがあります。「もっともらしい誤り」「スコープ逸脱」「確認されていない前提」を見落とさない専用レビュー観点が必要です。',
      why: [
        'LLMは確率的に最も「もっともらしい」次のトークンを生成する。正しく見えるが仕様に合わない実装が生まれやすい（Hallucination）。',
        'AIは与えられた範囲を超えて「親切に」改善することがある。意図しない広範囲変更がレビュー密度を下げる。',
        '人間のコードレビュー観点（可読性・パフォーマンスなど）に加え、AI特有のリスク（前提誤り・未確認事項・セキュリティ）を専用チェックする必要がある。',
      ],
      references: [
        { name: 'OWASP LLM Top 10', desc: 'LLMアプリケーションの主要脆弱性トップ10。Prompt Injection・Hallucination・不適切な出力処理などを定義。' },
        { name: 'SEI「AI-Enabled Systems」研究', desc: 'AI生成コードに特有のレビュー観点・欠陥分類を定義したソフトウェアエンジニアリング研究。' },
        { name: 'ISTQB AI Testing Foundation', desc: 'AI成果物の品質特性・テスト観点・リスクベーステストを定義する国際標準。' },
      ],
    },
    {
      key: 'testing',
      title: 'テスト・自動化',
      summary: 'テストなき変更はシステム品質を保証できません。AIの変更速度はテスト負債を急速に拡大させます。AI変更に対応したテスト設計とレビューが不可欠です。',
      why: [
        'AIは実装速度を大幅に上げるが、テスト設計はそのペースを自動では追えない。テスト不足のまま変更が蓄積すると退行リスクが急増する。',
        'AI生成テストは正常系に偏る傾向がある。境界値・状態遷移・業務ルール例外はテスト設計の専門知識で補う必要がある。',
        'テストデータと期待結果の管理がなければ、AIが誤ったデータや期待値でテストを書く。',
      ],
      references: [
        { name: 'ISTQB Testing Principles', desc: 'テストは欠陥がないことを証明しない・早期テストが経済的・テストは文脈依存などの基本原則。' },
        { name: 'IEEE 829（テスト文書）', desc: 'テスト計画・設計・実行・報告の標準文書構造を定義。テスト観点の明示化を求める。' },
        { name: 'Google Testing Blog（テスト規模の分類）', desc: 'Small/Medium/Large/Huge の4段階でテストを分類し、適切な粒度設計を促す指針。' },
      ],
    },
    {
      key: 'cicd',
      title: 'CI/CD・品質ゲート',
      summary: '継続的な品質確認なしに開発速度を上げると、技術的負債と障害が増加します。AI変更を品質ゲートに通すことで、人間レビューへの依存を減らしつつ品質を維持できます。',
      why: [
        'DORA research（Google）によると、高パフォーマンスチームはデプロイ頻度が高くかつ変更失敗率が低い。自動化された品質ゲートがその両立を支える。',
        'AI変更が多い環境では、CIに通らない変更が積み重なると人間レビューが機能不全に陥る。',
        'secret scan・SAST・依存脆弱性検査はAI生成コードの副作用検知に特に有効。手動確認は見落としが多い。',
      ],
      references: [
        { name: 'DORA State of DevOps Report', desc: '高パフォーマンスエンジニアリング組織の特性を定義。CI/CDと品質の相関を実証。' },
        { name: 'DevSecOps Principles（OWASP）', desc: 'セキュリティを開発・デプロイパイプラインに統合するDevSecOpsのベストプラクティス。' },
        { name: 'Continuous Delivery（Jez Humble & David Farley）', desc: 'ソフトウェアを常にリリース可能な状態に保つためのパイプライン設計の定義書。' },
      ],
    },
    {
      key: 'security',
      title: 'セキュリティ・プライバシー',
      summary: 'AIは便利なセキュリティアンチパターン（ハードコードされた秘密情報・入力検証の欠如・過剰ログなど）を生成しやすい状態にあります。明示的な検査と教育が必須です。',
      why: [
        'LLMの学習データにはセキュリティの良い例も悪い例も含まれている。プロンプト・コンテキストによってはアンチパターンが生成される。',
        'AIに機密情報・個人情報・認証情報を入力することで、外部AIサービスへのデータ漏えいが起きる可能性がある。',
        '顧客・契約・社内規定によってはAI利用自体が制約される。案件開始前の確認が必要。',
      ],
      references: [
        { name: 'OWASP Top 10（Webアプリセキュリティ）', desc: 'インジェクション・認証不備・機密データ露出など10大Webリスクの定義。' },
        { name: 'NIST SP 800-53', desc: '情報システムのセキュリティ統制カタログ。プライバシーとセキュリティの両方をカバー。' },
        { name: 'GDPR / 個人情報保護法', desc: '個人情報の収集・処理・保管に関する法的要件。AIへの入力データも対象になりうる。' },
      ],
    },
    {
      key: 'traceability',
      title: 'トレーサビリティ',
      summary: '変更の根拠が追えないと、問題発生時の原因特定と是正が困難になります。要件・設計・実装・テスト・レビューをつなぐトレーサビリティが、AI時代の変更管理の基盤です。',
      why: [
        'AIが大量の変更を素早く作るほど、なぜその変更が加えられたかの文脈が失われやすくなる。',
        'AI会話の前提・決定事項は会話履歴消失とともに失われる。成果物側（ADR・Issue・PR）への転記が必要。',
        'リリース後の障害対応で「どの変更がどの要件を実装したのか」が分からないと、根本原因分析が進まない。',
      ],
      references: [
        { name: 'ISO/IEC 15288（システムライフサイクルプロセス）', desc: '要件・設計・実装・テスト間のトレーサビリティを定義するシステム工学国際規格。' },
        { name: 'FDA 21 CFR Part 11 / IEC 62304', desc: '医療・機能安全分野のトレーサビリティ要件。変更管理の最高水準事例として参照される。' },
        { name: 'Git Commit Message Conventions（Conventional Commits）', desc: '変更種別・スコープ・説明を標準化し、変更履歴の機械可読性を高める規約。' },
      ],
    },
    {
      key: 'selfaudit',
      title: 'エージェント自己監査',
      summary: 'AIが自己点検しないと、人間は最終段階まで問題を発見できません。作業前・完了前・エラー時の構造化された自己点検が、スケーラブルな品質保証の内製化につながります。',
      why: [
        'AIは「できた」と言いながら実際には仕様を満たしていないことがある。完了宣言の定義と証跡の提出を義務化することで品質を担保する。',
        'AIに「事実・推定・未確認」を区別して報告させることで、人間レビュアーが重点確認すべき箇所を絞れる。',
        '失敗・エラー時に原因分析と再発防止を報告させることで、AI学習改善のサイクルを組織に内製化できる。',
      ],
      references: [
        { name: 'Chain-of-Thought Prompting（Wei et al., 2022）', desc: '推論過程を明示させることでLLMの正確性が向上することを示した研究。自己点検の理論的基盤。' },
        { name: 'Self-Consistency and Reflection in LLMs', desc: 'LLMが自己の出力を批判・検証することで精度が改善されることを示す研究群。' },
        { name: 'Anthropic Constitution AI / RLHF', desc: '原則・方針に基づいてAIが自己評価・改善するアプローチ。自己監査の設計思想の参考。' },
      ],
    },
    {
      key: 'metrics',
      title: 'メトリクス・継続改善',
      summary: '測定なき改善は効果が見えません。AI活用の速度だけでなく品質指標も継続的に測定し、データ駆動の改善ループを回すことで成熟度を持続的に向上させます。',
      why: [
        '「AIで速くなった」という体感だけでは、品質劣化・技術的負債の蓄積・チーム間のばらつきを把握できない。',
        '欠陥・レビュー指摘・CI失敗を分類・蓄積することで、AI活用の弱点が可視化され改善優先度を決められる。',
        '定期的な再診断で成熟度の推移を確認し、改善施策の効果を証明することが経営層への投資正当化につながる。',
      ],
      references: [
        { name: 'CMMI v2.0（能力成熟度統合モデル）', desc: 'プロセス能力・成熟度の5段階モデル。継続的改善を最上位に置く組織改善フレームワーク。' },
        { name: 'Six Sigma DMAIC', desc: 'Define-Measure-Analyze-Improve-Controlの改善サイクル。測定と分析を改善の前提とする。' },
        { name: 'DORA Four Key Metrics', desc: 'デプロイ頻度・変更リードタイム・変更失敗率・サービス復旧時間の4指標でエンジニアリング効率を測定する。' },
      ],
    },
  ];

  function renderRationale() {
    const el = document.getElementById('rationale-content');
    const nav = document.getElementById('rationale-areas-nav');
    if (!el) return;

    if (nav) {
      nav.innerHTML = CATEGORIES.map((c, i) => `
        <li class="sidenav-area-item sidenav-area-item-link" data-scroll-to="rationale-cat-${escapeHtml(c.key)}" tabindex="0" role="button">
          <span class="sidenav-area-num">${i + 1}</span>
          <span>${escapeHtml(c.name)}</span>
        </li>
      `).join('');
      nav.addEventListener('click', e => {
        const item = e.target.closest('[data-scroll-to]');
        if (!item) return;
        const targetId = item.dataset.scrollTo;
        const targetEl = document.getElementById(targetId);
        if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
      });
      nav.addEventListener('keydown', e => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const item = e.target.closest('[data-scroll-to]');
        if (!item) return;
        e.preventDefault();
        const targetEl = document.getElementById(item.dataset.scrollTo);
        if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
      });
    }

    el.innerHTML = `
      <main class="content-main content-main-wide">
        <div class="content-hero">
          <div class="content-badge">根拠・論拠</div>
          <h1 class="content-title">診断項目の根拠と理論的背景</h1>
          <p class="content-lead">各診断領域がなぜ重要なのか、どのような研究・規格・実務知見に基づいているかを解説します。診断結果をチームや経営層へ説明する際の参考としてご活用ください。</p>
          <div class="rationale-disclaimer">
            <p>本モデルはv0.1の検証前ドラフトです。300件規模の実案件での根拠レビューが完了するまでは、各根拠の適用強度は暫定値です。</p>
          </div>
        </div>

        ${RATIONALE_DATA.map((r, ri) => `
          <section class="rationale-section" id="rationale-cat-${escapeHtml(r.key)}">
            <div class="rationale-header">
              <span class="rationale-num">${ri + 1}</span>
              <h2 class="rationale-title">${escapeHtml(r.title)}</h2>
            </div>
            <p class="rationale-summary">${escapeHtml(r.summary)}</p>
            <div class="rationale-body">
              <div class="rationale-why">
                <h3 class="rationale-sub-title">なぜこの領域を診断するのか</h3>
                <ul class="rationale-why-list">
                  ${r.why.map(w => `<li>${escapeHtml(w)}</li>`).join('')}
                </ul>
              </div>
              <div class="rationale-refs">
                <h3 class="rationale-sub-title">参照根拠</h3>
                <div class="rationale-ref-list">
                  ${r.references.map(ref => `
                    <div class="rationale-ref-item">
                      <strong class="rationale-ref-name">${escapeHtml(ref.name)}</strong>
                      <p class="rationale-ref-desc">${escapeHtml(ref.desc)}</p>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </section>
        `).join('')}
      </main>
    `;
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

  // ── Admin mode ─────────────────────────────────────────────────────────────

  function adminNavClick() {
    if (state.mode === 'admin') {
      setState({ screen: 'admin' });
    } else {
      showAdminLoginModal();
    }
  }

  function showAdminLoginModal() {
    const modal = document.getElementById('admin-login-modal');
    const input = document.getElementById('admin-password-input');
    const err = document.getElementById('admin-login-error');
    if (modal) modal.hidden = false;
    if (input) { input.value = ''; input.focus(); }
    if (err) err.hidden = true;
  }

  function adminLoginSubmit() {
    const input = document.getElementById('admin-password-input');
    const err = document.getElementById('admin-login-error');
    const val = input ? input.value : '';
    if (val === ADMIN_PASSWORD) {
      document.getElementById('admin-login-modal').hidden = true;
      setState({ mode: 'admin', screen: 'admin', adminTab: 'categories' });
    } else {
      if (err) err.hidden = false;
      if (input) { input.value = ''; input.focus(); }
    }
  }

  function adminLoginCancel() {
    document.getElementById('admin-login-modal').hidden = true;
  }

  function adminLogout() {
    setState({ mode: 'guest', screen: 'welcome' });
  }

  function adminShowTab(tab) {
    state = { ...state, adminTab: tab };
    renderAdmin();
  }

  function adminResetData() {
    if (!confirm('すべてのカスタムデータを削除し、初期データに戻します。よろしいですか？')) return;
    localStorage.removeItem('aidd_categories');
    localStorage.removeItem('aidd_questions');
    // Re-initialize global data
    CATEGORIES.length = 0;
    CATEGORIES_DEFAULT.forEach(c => CATEGORIES.push({ ...c }));
    QUESTIONS.length = 0;
    QUESTIONS_DEFAULT.forEach(q => QUESTIONS.push({ ...q, choices: q.choices.map(ch => ({ ...ch })) }));
    renderAdmin();
  }

  function renderAdmin() {
    const container = document.getElementById('admin-content');
    if (!container) return;

    const tabCategories = state.adminTab === 'categories';
    const tabQuestions = state.adminTab === 'questions';

    container.innerHTML = `
      <div class="content-main content-main-wide">
        <div class="content-hero">
          <div class="content-badge">管理者モード</div>
          <h1 class="content-title">診断データ管理</h1>
          <p class="content-lead">診断領域・設問・選択肢の追加・編集・削除ができます。</p>
        </div>

        <div class="admin-tabs" role="tablist">
          <button class="admin-tab-btn ${tabCategories ? 'active' : ''}"
                  role="tab" aria-selected="${tabCategories}"
                  data-admin-tab="categories">診断領域（${CATEGORIES.length}件）</button>
          <button class="admin-tab-btn ${tabQuestions ? 'active' : ''}"
                  role="tab" aria-selected="${tabQuestions}"
                  data-admin-tab="questions">設問（${QUESTIONS.length}件）</button>
        </div>

        <div class="admin-tab-content" id="admin-tab-content">
          ${tabCategories ? renderAdminCategoriesTab() : renderAdminQuestionsTab()}
        </div>
      </div>
    `;

    document.getElementById('admin-tab-content')?.addEventListener('click', handleAdminContentClick);
    document.getElementById('admin-tab-content')?.addEventListener('change', handleAdminContentChange);
    container.querySelector('.admin-tabs')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-admin-tab]');
      if (btn) adminShowTab(btn.dataset.adminTab);
    });
  }

  function renderAdminCategoriesTab() {
    const rows = CATEGORIES.map(c => `
      <tr>
        <td class="admin-td">${escapeHtml(String(c.id))}</td>
        <td class="admin-td">${escapeHtml(c.name)}</td>
        <td class="admin-td">${escapeHtml(c.abbr || '')}</td>
        <td class="admin-td">${escapeHtml(String(c.weight ?? 1))}</td>
        <td class="admin-td admin-actions-cell">
          <button class="btn-admin-edit" data-action="edit-cat" data-id="${escapeHtml(String(c.id))}">編集</button>
          <button class="btn-admin-delete" data-action="delete-cat" data-id="${escapeHtml(String(c.id))}">削除</button>
        </td>
      </tr>
    `).join('');

    return `
      <div class="admin-toolbar">
        <button class="btn btn-primary btn-sm" data-action="new-cat">＋ 新規追加</button>
      </div>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr>
            <th class="admin-th">ID</th>
            <th class="admin-th">領域名</th>
            <th class="admin-th">略称</th>
            <th class="admin-th">重み</th>
            <th class="admin-th">操作</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  function renderAdminQuestionsTab() {
    const catOptions = CATEGORIES.map(c =>
      `<option value="${c.id}" ${_adminQCatFilter === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
    ).join('');

    const filtered = _adminQCatFilter
      ? QUESTIONS.filter(q => q.categoryId === _adminQCatFilter)
      : QUESTIONS;

    const catMap = Object.fromEntries(CATEGORIES.map(c => [c.id, c.name]));
    const rows = filtered.map(q => `
      <tr>
        <td class="admin-td">${escapeHtml(String(q.id))}</td>
        <td class="admin-td">${escapeHtml(catMap[q.categoryId] || String(q.categoryId))}</td>
        <td class="admin-td">${escapeHtml(q.target || '')}</td>
        <td class="admin-td admin-td-long">${escapeHtml(q.question.slice(0, 60))}${q.question.length > 60 ? '…' : ''}</td>
        <td class="admin-td admin-actions-cell">
          <button class="btn-admin-edit" data-action="edit-q" data-id="${escapeHtml(String(q.id))}">編集</button>
          <button class="btn-admin-delete" data-action="delete-q" data-id="${escapeHtml(String(q.id))}">削除</button>
        </td>
      </tr>
    `).join('');

    return `
      <div class="admin-toolbar">
        <select class="admin-filter-select" data-action="filter-q-cat">
          <option value="">すべての領域</option>
          ${catOptions}
        </select>
        <button class="btn btn-primary btn-sm" data-action="new-q">＋ 新規追加</button>
      </div>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr>
            <th class="admin-th">ID</th>
            <th class="admin-th">診断領域</th>
            <th class="admin-th">対象</th>
            <th class="admin-th">設問文</th>
            <th class="admin-th">操作</th>
          </tr></thead>
          <tbody>${rows || '<tr><td colspan="5" class="admin-td">設問がありません</td></tr>'}</tbody>
        </table>
      </div>
    `;
  }

  function handleAdminContentClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (action === 'new-cat') openCategoryModal(null);
    else if (action === 'edit-cat') openCategoryModal(id);
    else if (action === 'delete-cat') adminDeleteCategory(id);
    else if (action === 'new-q') openQuestionModal(null);
    else if (action === 'edit-q') openQuestionModal(id);
    else if (action === 'delete-q') adminDeleteQuestion(id);
  }

  function handleAdminContentChange(e) {
    if (e.target.dataset.action === 'filter-q-cat') {
      const val = e.target.value;
      _adminQCatFilter = val ? parseInt(val, 10) : null;
      document.getElementById('admin-tab-content').innerHTML = renderAdminQuestionsTab();
      document.getElementById('admin-tab-content').addEventListener('click', handleAdminContentClick);
      document.getElementById('admin-tab-content').addEventListener('change', handleAdminContentChange);
    }
  }

  // ── Category CRUD ──────────────────────────────────────────────────────────

  function openCategoryModal(id) {
    _adminEditingCatId = id ? parseInt(id, 10) : null;
    const modal = document.getElementById('category-modal');
    const titleEl = document.getElementById('category-modal-title');
    if (!modal) return;

    if (_adminEditingCatId !== null) {
      const cat = CATEGORIES.find(c => c.id === _adminEditingCatId);
      if (!cat) return;
      document.getElementById('category-modal-id').value = cat.id;
      document.getElementById('category-modal-name').value = cat.name;
      document.getElementById('category-modal-abbr').value = cat.abbr || '';
      document.getElementById('category-modal-weight').value = cat.weight ?? 1;
      if (titleEl) titleEl.textContent = '診断領域を編集';
    } else {
      document.getElementById('category-modal-id').value = '';
      document.getElementById('category-modal-name').value = '';
      document.getElementById('category-modal-abbr').value = '';
      document.getElementById('category-modal-weight').value = '1';
      if (titleEl) titleEl.textContent = '診断領域を新規追加';
    }
    modal.hidden = false;
    document.getElementById('category-modal-name').focus();
  }

  function categoryModalCancel() {
    document.getElementById('category-modal').hidden = true;
    _adminEditingCatId = null;
  }

  function categoryModalSave() {
    const name = document.getElementById('category-modal-name').value.trim();
    const abbr = document.getElementById('category-modal-abbr').value.trim();
    const weight = parseFloat(document.getElementById('category-modal-weight').value);

    if (!name) { alert('領域名を入力してください。'); return; }
    if (isNaN(weight) || weight < 0.1 || weight > 1.0) { alert('重みは0.1〜1.0で入力してください。'); return; }

    if (_adminEditingCatId !== null) {
      const idx = CATEGORIES.findIndex(c => c.id === _adminEditingCatId);
      if (idx >= 0) {
        CATEGORIES[idx] = { ...CATEGORIES[idx], name, abbr, weight };
      }
    } else {
      const newId = CATEGORIES.length > 0 ? Math.max(...CATEGORIES.map(c => c.id)) + 1 : 1;
      CATEGORIES.push({ id: newId, key: 'custom_' + newId, name, abbr, weight });
    }

    persistAdminData();
    document.getElementById('category-modal').hidden = true;
    _adminEditingCatId = null;
    renderAdmin();
  }

  function adminDeleteCategory(id) {
    const catId = parseInt(id, 10);
    const cat = CATEGORIES.find(c => c.id === catId);
    if (!cat) return;
    const qCount = QUESTIONS.filter(q => q.categoryId === catId).length;
    const msg = qCount > 0
      ? `「${cat.name}」を削除すると、この領域の設問${qCount}件も削除されます。よろしいですか？`
      : `「${cat.name}」を削除しますか？`;
    if (!confirm(msg)) return;

    const catIdx = CATEGORIES.findIndex(c => c.id === catId);
    CATEGORIES.splice(catIdx, 1);
    // Remove questions belonging to this category
    for (let i = QUESTIONS.length - 1; i >= 0; i--) {
      if (QUESTIONS[i].categoryId === catId) QUESTIONS.splice(i, 1);
    }
    persistAdminData();
    renderAdmin();
  }

  // ── Question CRUD ──────────────────────────────────────────────────────────

  function openQuestionModal(id) {
    _adminEditingQId = id ? String(id) : null;
    const modal = document.getElementById('question-modal');
    const titleEl = document.getElementById('question-modal-title');
    if (!modal) return;

    // Populate category select
    const catSel = document.getElementById('question-modal-cat');
    if (catSel) {
      catSel.innerHTML = CATEGORIES.map(c =>
        `<option value="${c.id}">${escapeHtml(c.name)}</option>`
      ).join('');
    }

    if (_adminEditingQId !== null) {
      const q = QUESTIONS.find(q => String(q.id) === _adminEditingQId);
      if (!q) return;
      document.getElementById('question-modal-id').value = q.id;
      if (catSel) catSel.value = q.categoryId;
      document.getElementById('question-modal-target').value = q.target || '人';
      document.getElementById('question-modal-text').value = q.question;
      for (let i = 0; i <= 3; i++) {
        const ch = q.choices.find(c => c.score === i);
        const inp = document.getElementById('qm-choice-' + i);
        if (inp) inp.value = ch ? (ch.label + (ch.description ? '：' + ch.description : '')) : '';
      }
      document.getElementById('question-modal-risk').value = q.riskIfLow || '';
      document.getElementById('question-modal-rec').value = q.recommendation || '';
      if (titleEl) titleEl.textContent = '設問を編集';
    } else {
      document.getElementById('question-modal-id').value = '';
      if (catSel && CATEGORIES.length) catSel.value = CATEGORIES[0].id;
      document.getElementById('question-modal-target').value = '人';
      document.getElementById('question-modal-text').value = '';
      for (let i = 0; i <= 3; i++) {
        const inp = document.getElementById('qm-choice-' + i);
        if (inp) inp.value = '';
      }
      document.getElementById('question-modal-risk').value = '';
      document.getElementById('question-modal-rec').value = '';
      if (titleEl) titleEl.textContent = '設問を新規追加';
    }

    modal.hidden = false;
    document.getElementById('question-modal-text').focus();
  }

  function questionModalCancel() {
    document.getElementById('question-modal').hidden = true;
    _adminEditingQId = null;
  }

  function questionModalSave() {
    const catId = parseInt(document.getElementById('question-modal-cat').value, 10);
    const target = document.getElementById('question-modal-target').value.trim();
    const question = document.getElementById('question-modal-text').value.trim();
    const riskIfLow = document.getElementById('question-modal-risk').value.trim();
    const recommendation = document.getElementById('question-modal-rec').value.trim();

    if (!question) { alert('設問文を入力してください。'); return; }

    const choices = [0, 1, 2, 3].map(i => {
      const raw = (document.getElementById('qm-choice-' + i)?.value || '').trim();
      const sepIdx = raw.indexOf('：');
      const label = sepIdx >= 0 ? raw.slice(0, sepIdx).trim() : raw;
      const description = sepIdx >= 0 ? raw.slice(sepIdx + 1).trim() : '';
      return { score: i, label: label || String(i), description };
    });

    if (_adminEditingQId !== null) {
      const idx = QUESTIONS.findIndex(q => String(q.id) === _adminEditingQId);
      if (idx >= 0) {
        QUESTIONS[idx] = { ...QUESTIONS[idx], categoryId: catId, target, question, choices, riskIfLow, recommendation };
      }
    } else {
      const maxId = QUESTIONS.length > 0 ? Math.max(...QUESTIONS.map(q => typeof q.id === 'number' ? q.id : 0)) : 0;
      const newId = maxId + 1;
      QUESTIONS.push({ id: newId, categoryId: catId, target, question, choices, riskIfLow, recommendation, issueTemplate: '', aiSelfCheck: '' });
    }

    persistAdminData();
    document.getElementById('question-modal').hidden = true;
    _adminEditingQId = null;
    renderAdmin();
  }

  function adminDeleteQuestion(id) {
    const q = QUESTIONS.find(q => String(q.id) === String(id));
    if (!q) return;
    if (!confirm(`「${q.question.slice(0, 40)}…」を削除しますか？`)) return;
    const idx = QUESTIONS.findIndex(q => String(q.id) === String(id));
    if (idx >= 0) QUESTIONS.splice(idx, 1);
    persistAdminData();
    renderAdmin();
  }

  function persistAdminData() {
    try {
      localStorage.setItem('aidd_categories', JSON.stringify(CATEGORIES));
      localStorage.setItem('aidd_questions', JSON.stringify(QUESTIONS));
    } catch (e) {
      alert('データの保存に失敗しました。ローカルストレージの容量を確認してください。');
    }
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

    // Admin login: Enter key in password field
    document.getElementById('admin-password-input')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') adminLoginSubmit();
    });

    // Close modals on overlay click
    ['admin-login-modal', 'category-modal', 'question-modal'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', e => {
        if (e.target.id === id) {
          if (id === 'admin-login-modal') adminLoginCancel();
          else if (id === 'category-modal') categoryModalCancel();
          else if (id === 'question-modal') questionModalCancel();
        }
      });
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
    adminNavClick, adminLoginSubmit, adminLoginCancel, adminLogout,
    adminShowTab, adminResetData,
    categoryModalSave, categoryModalCancel,
    questionModalSave, questionModalCancel,
  };
})();
