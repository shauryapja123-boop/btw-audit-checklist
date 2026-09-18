const page = document.body.dataset.page;

const THEME_KEY = 'btwTheme';
const PROFILE_KEY = 'btwOutletProfile';

const getDefaultProfile = () => ({
  outletName: 'BTW Hospitality',
  managerName: 'Audit Team',
  locationName: 'Head Office',
  auditDate: new Date().toISOString().slice(0, 10)
});

const getProfile = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
    return { ...getDefaultProfile(), ...saved };
  } catch (error) {
    return getDefaultProfile();
  }
};

const saveProfile = (profile) => {
  const nextProfile = { ...getProfile(), ...profile };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile));
  return nextProfile;
};

const applyProfileValues = () => {
  const profile = getProfile();

  document.querySelectorAll('[data-profile-outlet]').forEach((element) => {
    element.textContent = profile.outletName;
  });

  document.querySelectorAll('[data-profile-manager]').forEach((element) => {
    element.textContent = profile.managerName;
  });

  document.querySelectorAll('[data-profile-location]').forEach((element) => {
    element.textContent = profile.locationName;
  });

  document.querySelectorAll('[data-profile-date]').forEach((element) => {
    element.textContent = profile.auditDate;
  });

  const heading = document.querySelector('[data-profile-heading]');
  if (heading) {
    heading.textContent = `${profile.outletName} Audit Dashboard`;
  }
};

const syncAuditMetaFields = () => {
  const outletInput = document.getElementById('outletNameInput');
  const managerInput = document.getElementById('managerNameInput');
  const locationInput = document.getElementById('auditLocationInput');
  const dateInput = document.getElementById('auditDateInput');

  if (!outletInput && !managerInput && !locationInput && !dateInput) return;

  const profile = getProfile();
  if (outletInput) outletInput.value = profile.outletName || '';
  if (managerInput) managerInput.value = profile.managerName || '';
  if (locationInput) locationInput.value = profile.locationName || '';
  if (dateInput) dateInput.value = profile.auditDate || '';

  const saveMeta = () => {
    const nextProfile = saveProfile({
      outletName: (outletInput?.value || '').trim() || getDefaultProfile().outletName,
      managerName: (managerInput?.value || '').trim() || getDefaultProfile().managerName,
      locationName: (locationInput?.value || '').trim() || getDefaultProfile().locationName,
      auditDate: dateInput?.value || getDefaultProfile().auditDate,
    });

    applyProfileValues();

    const status = document.getElementById('auditMetaStatus');
    if (status) {
      status.textContent = `Audit saved for ${nextProfile.outletName} • ${nextProfile.managerName}`;
    }
  };

  outletInput?.addEventListener('input', saveMeta);
  managerInput?.addEventListener('input', saveMeta);
  locationInput?.addEventListener('input', saveMeta);
  dateInput?.addEventListener('change', saveMeta);
};

const getAuditStateKey = () => `btwAudit_${document.body.dataset.page || 'section'}`;

const getSavedAuditEntries = () => {
  const entries = [];

  Object.keys(localStorage).forEach((key) => {
    if (!key.startsWith('btwAudit_')) return;

    try {
      const item = JSON.parse(localStorage.getItem(key) || 'null');
      if (!item || !item.outletName) return;
      entries.push({ key, ...item, sectionName: key.replace('btwAudit_', '').replace('-', ' ') });
    } catch (error) {
      // ignore malformed audit entries
    }
  });

  return entries.sort((a, b) => new Date(b.savedAt || b.auditDate) - new Date(a.savedAt || a.auditDate));
};

const renderAuditHistory = () => {
  const dashboardTarget = document.getElementById('savedAuditHistory');
  const reportTable = document.querySelector('#auditHistoryBody');

  const entries = getSavedAuditEntries();
  const list = entries.slice(0, 5);

  if (dashboardTarget) {
    if (!list.length) {
      dashboardTarget.innerHTML = '<li class="muted-text">No saved audits yet.</li>';
      return;
    }

    dashboardTarget.innerHTML = list.map((entry) => {
      const score = entry.score ?? 0;
      const section = entry.sectionName || 'Audit section';
      return `
        <li>
          <strong>${entry.outletName}</strong>
          <span>${entry.managerName}</span>
          <small>${section} • ${score}/${entry.maxPoints || 0} pts</small>
        </li>
      `;
    }).join('');
  }

  if (reportTable) {
    if (!list.length) {
      reportTable.innerHTML = '<tr><td colspan="5">No saved audits yet.</td></tr>';
      return;
    }

    reportTable.innerHTML = list.map((entry) => {
      const status = entry.percentage >= 85 ? 'Pass' : entry.percentage >= 70 ? 'Review' : 'Action';
      const statusClass = status === 'Pass' ? 'success' : status === 'Review' ? 'warn' : 'danger';
      const section = entry.sectionName || 'Audit section';
      return `
        <tr>
          <td>${entry.outletName}</td>
          <td>${entry.managerName}</td>
          <td>${entry.score ?? 0}/${entry.maxPoints || 0}</td>
          <td><span class="status ${statusClass}">${status}</span></td>
          <td>${entry.auditDate || new Date(entry.savedAt).toLocaleDateString()}</td>
        </tr>
      `;
    }).join('');
  }
};

const saveCurrentAuditSection = () => {
  const sectionKey = getAuditStateKey();
  const outletName = document.getElementById('outletNameInput')?.value?.trim() || getProfile().outletName;
  const managerName = document.getElementById('managerNameInput')?.value?.trim() || getProfile().managerName;
  const locationName = document.getElementById('auditLocationInput')?.value?.trim() || getProfile().locationName;
  const auditDate = document.getElementById('auditDateInput')?.value || getProfile().auditDate;
  const checkboxes = [...document.querySelectorAll('input[type="checkbox"][data-points]')];
  const score = checkboxes.reduce((sum, box) => sum + (box.checked ? Number(box.dataset.points || 0) : 0), 0);
  const maxPoints = checkboxes.reduce((sum, box) => sum + Number(box.dataset.points || 0), 0) || Number(document.body.dataset.maxScore || 0);
  const percentage = maxPoints ? (score / maxPoints) * 100 : 0;

  const payload = {
    outletName,
    managerName,
    locationName,
    auditDate,
    score,
    maxPoints,
    percentage,
    savedAt: new Date().toISOString(),
    answers: checkboxes.map((box) => box.checked)
  };

  localStorage.setItem(sectionKey, JSON.stringify(payload));

  const status = document.getElementById('auditMetaStatus');
  if (status) {
    status.textContent = `Saved: ${outletName} • ${managerName} • ${auditDate}`;
  }

  renderAuditHistory();
  return payload;
};

const restoreCurrentAuditSection = () => {
  const sectionKey = getAuditStateKey();
  const saved = JSON.parse(localStorage.getItem(sectionKey) || 'null');
  if (!saved || !Array.isArray(saved.answers)) return;

  const checkboxes = [...document.querySelectorAll('input[type="checkbox"][data-points]')];
  checkboxes.forEach((box, index) => {
    box.checked = Boolean(saved.answers[index]);
  });

  const outletName = document.getElementById('outletNameInput');
  const managerName = document.getElementById('managerNameInput');
  const locationName = document.getElementById('auditLocationInput');
  const dateInput = document.getElementById('auditDateInput');

  if (outletName && saved.outletName) outletName.value = saved.outletName;
  if (managerName && saved.managerName) managerName.value = saved.managerName;
  if (locationName && saved.locationName) locationName.value = saved.locationName;
  if (dateInput && saved.auditDate) dateInput.value = saved.auditDate;

  const status = document.getElementById('auditMetaStatus');
  if (status && saved.outletName && saved.managerName) {
    status.textContent = `Restored: ${saved.outletName} • ${saved.managerName}`;
  }

  if (typeof updateSectionTotals === 'function') {
    updateSectionTotals();
  }
};

const applyTheme = (theme) => {
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light';
  document.body.dataset.theme = resolvedTheme;
  localStorage.setItem(THEME_KEY, resolvedTheme);

  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.textContent = resolvedTheme === 'dark' ? '☀️ Light' : '🌙 Dark';
  }
};

const initTheme = () => {
  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  applyTheme(savedTheme);

  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
    });
  }
};

if (page === 'login') {
  initTheme();

  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');

  if (localStorage.getItem('btwAuth') === 'true') {
    window.location.href = 'checklist.html';
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();

      if (!email || !password) {
        loginError.textContent = 'Please enter your email and password.';
        return;
      }

      if (email.toLowerCase() === 'admin@btw.com' && password === 'btw@123') {
        localStorage.setItem('btwAuth', 'true');
        window.location.href = 'checklist.html';
        return;
      }

      loginError.textContent = 'Invalid credentials. Use the demo access shown below.';
    });
  }
}

if (page === 'dashboard' || page === 'reports' || page === 'settings' || page?.startsWith('section-')) {
  initTheme();

  const authState = localStorage.getItem('btwAuth');

  if (authState !== 'true') {
    window.location.href = 'index.html';
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('btwAuth');
      window.location.href = 'index.html';
    });
  }

  const backToDashboard = document.getElementById('backToDashboard');
  if (backToDashboard) {
    backToDashboard.addEventListener('click', () => {
      window.location.href = 'checklist.html';
    });
  }

  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    const profile = getProfile();
    document.getElementById('outletName').value = profile.outletName;
    document.getElementById('managerName').value = profile.managerName;
    document.getElementById('locationName').value = profile.locationName;
    document.getElementById('auditDate').value = profile.auditDate;

    profileForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const updatedProfile = saveProfile({
        outletName: document.getElementById('outletName').value.trim() || getDefaultProfile().outletName,
        managerName: document.getElementById('managerName').value.trim() || getDefaultProfile().managerName,
        locationName: document.getElementById('locationName').value.trim() || getDefaultProfile().locationName,
        auditDate: document.getElementById('auditDate').value || getDefaultProfile().auditDate,
      });

      applyProfileValues();
      const status = document.getElementById('profileStatus');
      if (status) {
        status.textContent = `Saved for ${updatedProfile.outletName} • ${updatedProfile.managerName}`;
      }
    });
  }

  applyProfileValues();
  syncAuditMetaFields();
  restoreCurrentAuditSection();
  renderAuditHistory();

  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      saveCurrentAuditSection();
      updateSectionTotals();
    });
  }
}

const renderBarChart = () => {
  const chart = document.getElementById('performanceChart');
  if (!chart) return;

  const sectionLabels = ['Prep', 'Service', 'Quality', 'Clean', 'Ops'];
  const sectionValues = [92, 88, 94, 86, 90];
  const svgWidth = 520;
  const svgHeight = 200;
  const chartHeight = 120;
  const barWidth = 48;

  const bars = sectionValues.map((value, index) => {
    const x = 36 + index * 88;
    const barHeight = (value / 100) * chartHeight;
    const y = 150 - barHeight;
    const fill = index === 2 ? '#b81d24' : '#d7747a';
    return `
      <g>
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="10" fill="${fill}" />
        <text x="${x + barWidth / 2}" y="170" text-anchor="middle" fill="currentColor" font-size="12">${sectionLabels[index]}</text>
        <text x="${x + barWidth / 2}" y="${y - 8}" text-anchor="middle" fill="currentColor" font-size="11">${value}%</text>
      </g>
    `;
  }).join('');

  chart.innerHTML = `
    <svg viewBox="0 0 ${svgWidth} ${svgHeight}" role="img" aria-label="Section performance chart">
      <line x1="20" y1="150" x2="500" y2="150" stroke="currentColor" stroke-opacity="0.2" />
      ${bars}
    </svg>
  `;
};

const renderDonutChart = () => {
  const donut = document.getElementById('scoreDonut');
  if (!donut) return;

  const pass = 91.8;
  const review = 6.5;
  const pending = 1.7;
  donut.style.background = `conic-gradient(#b81d24 0 ${pass}%, #f7b267 ${pass}% ${pass + review}%, #dfe3ea ${pass + review}% 100%)`;
};

const exportReport = () => {
  const reportWindow = window.open('', '_blank', 'width=900,height=700');
  if (!reportWindow) return;

  const today = new Date().toLocaleDateString();
  const summaryHtml = `
    <html>
      <head>
        <title>BTW Audit Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 32px; color: #1d1d1d; }
          h1 { color: #b81d24; margin-bottom: 8px; }
          .meta { color: #666; margin-bottom: 24px; }
          .grid { display: grid; grid-template-columns: repeat(2, minmax(180px, 1fr)); gap: 14px; margin-bottom: 24px; }
          .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; background: #fafafa; }
          .label { display: block; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }
          .value { font-size: 24px; font-weight: 700; }
        </style>
      </head>
      <body>
        <h1>BTW Audit Report</h1>
        <div class="meta">Generated on ${today}</div>
        <div class="grid">
          <div class="card"><span class="label">Overall score</span><span class="value">91.8%</span></div>
          <div class="card"><span class="label">Pass rate</span><span class="value">88%</span></div>
          <div class="card"><span class="label">Audits completed</span><span class="value">146</span></div>
          <div class="card"><span class="label">Action items</span><span class="value">12</span></div>
        </div>
        <p>This report captures the latest outlet performance audit view across the service, quality, cleanliness, and operations sections.</p>
      </body>
    </html>
  `;

  reportWindow.document.write(summaryHtml);
  reportWindow.document.close();
  setTimeout(() => reportWindow.print(), 400);
};

const checkboxes = document.querySelectorAll('input[type="checkbox"][data-points]');
const maxScore = Number(document.body.dataset.maxScore || 45);

const updateSectionTotals = () => {
  const currentPage = document.body.dataset.page || '';
  const currentSection = Number((currentPage.match(/section-(\d+)/)?.[1] || '1'));

  const sectionCheckboxes = [...document.querySelectorAll(`input[data-section="${currentSection}"]`)];
  const relevantCheckboxes = sectionCheckboxes.length
    ? sectionCheckboxes
    : [...document.querySelectorAll('input[type="checkbox"][data-points]')];

  const sectionValue = relevantCheckboxes
    .filter((input) => input.checked)
    .reduce((sum, input) => sum + Number(input.dataset.points || 0), 0);

  const totalEl = document.querySelector(`[data-section-total="${currentSection}"]`) || document.querySelector('[data-section-total]');
  if (totalEl) {
    totalEl.textContent = sectionValue;
  }

  const totalScore = relevantCheckboxes.filter((box) => box.checked).reduce((sum, box) => sum + Number(box.dataset.points || 0), 0);
  const percent = (totalScore / maxScore) * 100;

  const scoreEl = document.getElementById('score-achieved');
  const percentEl = document.getElementById('performance-percent');
  const ratingEl = document.getElementById('performance-rating');

  if (scoreEl) scoreEl.textContent = totalScore;
  if (percentEl) percentEl.textContent = `${percent.toFixed(1)}%`;

  if (ratingEl) {
    if (percent >= 90) {
      ratingEl.textContent = 'Outstanding Performing';
    } else if (percent >= 85) {
      ratingEl.textContent = 'Good Performance';
    } else if (percent >= 80) {
      ratingEl.textContent = 'Needs Improvement';
    } else {
      ratingEl.textContent = 'Below Expectations';
    }
  }
};

checkboxes.forEach((checkbox) => {
  checkbox.addEventListener('change', updateSectionTotals);
});

const resetBtn = document.getElementById('resetBtn');
if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    checkboxes.forEach((checkbox) => {
      checkbox.checked = false;
    });
    updateSectionTotals();
  });
}

const printBtn = document.getElementById('printBtn');
if (printBtn) {
  printBtn.addEventListener('click', () => {
    window.print();
  });
}

const exportBtn = document.getElementById('exportBtn');
if (exportBtn) {
  exportBtn.addEventListener('click', exportReport);
}

renderBarChart();
renderDonutChart();

if (checkboxes.length) {
  updateSectionTotals();
}
