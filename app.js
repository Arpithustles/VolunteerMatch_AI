const ALL_SKILLS = ['Teaching', 'Web Dev', 'First Aid', 'Event Management', 'Social Media', 'Python', 'Public Speaking'];
const ALL_INTERESTS = ['Education', 'Environment', 'Healthcare', 'Digital Literacy'];

const DEFAULT_OPPORTUNITIES = [
  {
    id: 'opp-1',
    title: 'Weekend Digital Literacy Camp',
    ngo: 'Udaan Welfare Foundation',
    cause: 'Digital Literacy',
    skills: ['Teaching', 'Web Dev', 'Python'],
    slot: 'Weekends',
    date: 'Sat, 21 Nov 2026',
    location: 'Indirapuram, Ghaziabad',
    hours: 6,
    spots: 4,
    desc: 'Mentor underprivileged high-school students in basic computer operations, internet safety, and introductory coding.',
    tasks: ['Set up lab laptops & Wi-Fi', 'Conduct 2-hour MS Office & Web basics session', 'Evaluate student mini-quiz']
  },
  {
    id: 'opp-2',
    title: 'Hindon Riverbank Clean-Up & Plantation',
    ngo: 'GreenEarth NCR Initiative',
    cause: 'Environment',
    skills: ['Event Management', 'Public Speaking'],
    slot: 'Weekends',
    date: 'Sat, 21 Nov 2026',
    location: 'Hindon Eco Park, Ghaziabad',
    hours: 4,
    spots: 9,
    desc: 'Join our Sunday morning drive to plant 300 native saplings and coordinate waste segregation teams.',
    tasks: ['Check-in volunteer kits at Gate 2', 'Plant & tag 15 saplings in Zone B', 'Upload geo-tagged completion photo']
  },
  {
    id: 'opp-3',
    title: 'Community Blood Donation & Health Camp',
    ngo: 'Sanjeevani Red Cross Trust',
    cause: 'Healthcare',
    skills: ['First Aid', 'Event Management'],
    slot: 'Weekends',
    date: 'Sun, 29 Nov 2026',
    location: 'Sector 62, Noida',
    hours: 5,
    spots: 3,
    desc: 'Assist medical staff with donor registration, hydration desk management, and post-donation recovery monitoring.',
    tasks: ['Verify donor registration forms', 'Manage post-donation refreshment desk', 'Assist triage nurse with vitals log']
  },
  {
    id: 'opp-4',
    title: 'Evening Remedial Math & English Tutoring',
    ngo: 'Asha Kiran Vidya Kendra',
    cause: 'Education',
    skills: ['Teaching', 'Public Speaking'],
    slot: 'Weekday Evenings',
    date: 'Wed, 25 Nov 2026',
    location: 'Raj Nagar, Ghaziabad',
    hours: 3,
    spots: 5,
    desc: 'Support middle-school learners with homework assistance and spoken English confidence exercises.',
    tasks: ['Review weekly worksheets', 'Conduct group reading exercise', 'Log student attendance']
  },
  {
    id: 'opp-5',
    title: 'NGO Fundraising Campaign Website Revamp',
    ngo: 'HopeBridge Child Care',
    cause: 'Digital Literacy',
    skills: ['Web Dev', 'Social Media'],
    slot: 'Flexible Remote',
    date: 'Flexible (Nov 2026)',
    location: 'Remote / Online',
    hours: 8,
    spots: 2,
    desc: 'Build a lightweight, mobile-friendly donation landing page and social media toolkit for winter relief.',
    tasks: ['Design responsive landing page', 'Integrate UPI QR & donor receipt form', 'Hand over GitHub repo to NGO admin']
  }
];

const DEFAULT_HISTORY = [
  {
    id: 'hist-101',
    title: 'Community Coding & Cyber Safety Workshop',
    ngo: 'Udaan Welfare Foundation',
    date: '08 Nov 2026',
    hours: 8,
    certId: 'VM-2026-8841'
  },
  {
    id: 'hist-102',
    title: 'City Park Green Belt Plantation Drive',
    ngo: 'GreenEarth NCR Initiative',
    date: '24 Oct 2026',
    hours: 6,
    certId: 'VM-2026-7912'
  }
];

let state = {
  authRole: 'volunteer',
  userName: 'Archita Katiyar',
  ngoName: 'Udaan Welfare Foundation',
  profile: {
    skills: ['Teaching', 'Web Dev', 'First Aid'],
    interests: ['Education', 'Digital Literacy', 'Healthcare'],
    availability: 'Weekends'
  },
  opportunities: JSON.parse(localStorage.getItem('vm_opportunities')) || DEFAULT_OPPORTUNITIES,
  acceptedIds: JSON.parse(localStorage.getItem('vm_accepted')) || ['opp-1'],
  completedTasks: JSON.parse(localStorage.getItem('vm_tasks')) || {},
  history: JSON.parse(localStorage.getItem('vm_history')) || DEFAULT_HISTORY
};

function persistState() {
  localStorage.setItem('vm_opportunities', JSON.stringify(state.opportunities));
  localStorage.setItem('vm_accepted', JSON.stringify(state.acceptedIds));
  localStorage.setItem('vm_tasks', JSON.stringify(state.completedTasks));
  localStorage.setItem('vm_history', JSON.stringify(state.history));
}

/* ==================== AUTH LOGIC ==================== */
function selectAuthRole(role) {
  state.authRole = role;
  const volBtn = document.getElementById('roleBtnVolunteer');
  const ngoBtn = document.getElementById('roleBtnNgo');
  const nameLabel = document.getElementById('loginNameLabel');
  const nameInput = document.getElementById('loginName');
  const emailInput = document.getElementById('loginEmail');
  const submitBtn = document.getElementById('loginSubmitBtn');
  const demoHint = document.getElementById('quickDemoHint');

  if (role === 'volunteer') {
    volBtn.className = 'py-2.5 px-4 rounded-lg text-sm font-semibold transition bg-white text-emerald-700 shadow-sm';
    ngoBtn.className = 'py-2.5 px-4 rounded-lg text-sm font-semibold transition text-slate-600 hover:text-slate-900';
    nameLabel.textContent = 'Volunteer Full Name';
    nameInput.value = 'Archita Katiyar';
    emailInput.value = 'archita.katiyar@volunteer.org';
    submitBtn.textContent = 'Continue as Volunteer →';
    submitBtn.className = 'w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition cursor-pointer';
    demoHint.textContent = 'Switch to NGO Coordinator Login';
  } else {
    ngoBtn.className = 'py-2.5 px-4 rounded-lg text-sm font-semibold transition bg-white text-teal-700 shadow-sm';
    volBtn.className = 'py-2.5 px-4 rounded-lg text-sm font-semibold transition text-slate-600 hover:text-slate-900';
    nameLabel.textContent = 'NGO / Organization Name';
    nameInput.value = 'Udaan Welfare Foundation';
    emailInput.value = 'coordinator@udaanwelfare.org';
    submitBtn.textContent = 'Enter NGO Organizer Portal →';
    submitBtn.className = 'w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md shadow-teal-600/20 transition cursor-pointer';
    demoHint.textContent = 'Switch to Volunteer Login';
  }
}

function quickSwitchDemo() {
  selectAuthRole(state.authRole === 'volunteer' ? 'ngo' : 'volunteer');
}

function handleLogin(e) {
  e.preventDefault();
  const enteredName = document.getElementById('loginName').value.trim();

  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('appShell').classList.remove('hidden');

  if (state.authRole === 'volunteer') {
    state.userName = enteredName || 'Archita Katiyar';
    document.getElementById('roleBadge').textContent = 'Volunteer POV';
    document.getElementById('roleBadge').className = 'ml-2 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700';
    document.getElementById('volunteerNav').classList.remove('hidden');
    document.getElementById('volunteerNav').classList.add('md:flex');
    document.getElementById('ngoNav').classList.add('hidden');
    document.getElementById('ngoNav').classList.remove('flex');
    document.getElementById('editPrefsBtn').classList.remove('hidden');
    document.getElementById('volunteerWorkspace').classList.remove('hidden');
    document.getElementById('ngoWorkspace').classList.add('hidden');
    document.getElementById('volGreetingName').textContent = state.userName.split(' ')[0];

    initPreferencesUI();
    renderOpportunities();
    renderSchedule();
    renderImpact();
  } else {
    state.ngoName = enteredName || 'Udaan Welfare Foundation';
    document.getElementById('roleBadge').textContent = 'NGO Organizer POV';
    document.getElementById('roleBadge').className = 'ml-2 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-teal-50 text-teal-700';
    document.getElementById('ngoNav').classList.remove('hidden');
    document.getElementById('ngoNav').classList.add('flex');
    document.getElementById('volunteerNav').classList.add('hidden');
    document.getElementById('volunteerNav').classList.remove('md:flex');
    document.getElementById('editPrefsBtn').classList.add('hidden');
    document.getElementById('ngoWorkspace').classList.remove('hidden');
    document.getElementById('volunteerWorkspace').classList.add('hidden');
    document.getElementById('ngoHeadingName').textContent = state.ngoName;

    renderNgoPortal();
  }
}

function logoutToAuth() {
  document.getElementById('appShell').classList.add('hidden');
  document.getElementById('authScreen').classList.remove('hidden');
}

/* ==================== VOLUNTEER TABS ==================== */
function switchVolTab(tab) {
  ['discover', 'schedule', 'impact'].forEach(t => {
    document.getElementById('view-' + t).classList.toggle('hidden', t !== tab);
    const btn = document.getElementById('tab-' + t);
    if (btn) {
      btn.className = t === tab
        ? 'vol-tab px-4 py-1.5 rounded-full text-sm font-semibold bg-white text-emerald-700 shadow-sm transition cursor-pointer'
        : 'vol-tab px-4 py-1.5 rounded-full text-sm font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer';
    }
  });
  if (tab === 'schedule') renderSchedule();
  if (tab === 'impact') renderImpact();
}

/* ==================== AI MATCH ENGINE ==================== */
function computeMatchScore(opp) {
  let score = 42;
  const reasons = [];

  const matchedSkills = opp.skills.filter(s => state.profile.skills.includes(s));
  if (matchedSkills.length > 0) {
    score += Math.min(30, matchedSkills.length * 15);
    reasons.push(`Matches your ${matchedSkills.join(' & ')} skill${matchedSkills.length > 1 ? 's' : ''}`);
  }

  if (state.profile.interests.includes(opp.cause)) {
    score += 15;
    reasons.push(`Aligns with your ${opp.cause} passion`);
  }

  if (opp.slot === state.profile.availability || opp.slot === 'Flexible Remote') {
    score += 12;
    reasons.push(`Fits your ${opp.slot} schedule`);
  } else {
    reasons.push(`Scheduled on ${opp.slot}`);
  }

  return { score: Math.min(99, score), reasons };
}

function renderOpportunities() {
  const filter = document.getElementById('causeFilter').value;
  const grid = document.getElementById('opportunitiesGrid');
  document.getElementById('activeContextSummary').textContent =
    `Matched by Skills: ${state.profile.skills.join(', ')} • Availability: ${state.profile.availability}`;

  const ranked = state.opportunities
    .filter(o => filter === 'All' || o.cause === filter)
    .map(o => ({ ...o, match: computeMatchScore(o) }))
    .sort((a, b) => b.match.score - a.match.score);

  grid.innerHTML = ranked.map(opp => {
    const isAccepted = state.acceptedIds.includes(opp.id);
    return `
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between gap-2 mb-3">
            <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">${opp.cause}</span>
            <span class="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ${opp.match.score}% AI Match
            </span>
          </div>

          <h3 class="text-lg font-extrabold text-slate-900 leading-snug">${opp.title}</h3>
          <p class="text-xs font-semibold text-teal-700 mt-1">✓ ${opp.ngo}</p>
          <p class="text-sm text-slate-600 mt-3 leading-relaxed">${opp.desc}</p>

          <!-- Explainable AI Strip -->
          <div class="mt-4 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
            <p class="text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-1">Why This Fits You</p>
            <ul class="text-xs text-emerald-900 space-y-0.5">
              ${opp.match.reasons.map(r => `<li>• ${r}</li>`).join('')}
            </ul>
          </div>

          <div class="mt-4 flex flex-wrap gap-1.5">
            ${opp.skills.map(s => `<span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium">${s}</span>`).join('')}
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-100">
          <div class="flex items-center justify-between text-xs text-slate-500 mb-3">
            <span>📅 ${opp.date}</span>
            <span>⏱ ${opp.hours} hrs • ${opp.spots} spots left</span>
          </div>
          <button onclick="toggleAcceptOpportunity('${opp.id}')" class="w-full py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
            isAccepted
              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
          }">
            ${isAccepted ? '✓ Added to Schedule (Click to Cancel)' : 'Accept & Add to Schedule'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function toggleAcceptOpportunity(id) {
  if (state.acceptedIds.includes(id)) {
    state.acceptedIds = state.acceptedIds.filter(item => item !== id);
  } else {
    state.acceptedIds.push(id);
  }
  persistState();
  renderOpportunities();
  renderSchedule();
}

/* ==================== SCHEDULE & CONFLICT DETECTOR ==================== */
function renderSchedule() {
  const list = document.getElementById('scheduleList');
  const acceptedOpps = state.opportunities.filter(o => state.acceptedIds.includes(o.id));

  // Conflict check by matching exact date string
  const dateMap = {};
  const clashes = [];
  acceptedOpps.forEach(o => {
    if (dateMap[o.date]) {
      clashes.push(`"${dateMap[o.date]}" and "${o.title}" are both scheduled on ${o.date}.`);
    } else {
      dateMap[o.date] = o.title;
    }
  });

  const banner = document.getElementById('conflictBanner');
  if (clashes.length > 0) {
    banner.classList.remove('hidden');
    document.getElementById('conflictDetails').textContent = clashes.join(' ');
  } else {
    banner.classList.add('hidden');
  }

  if (acceptedOpps.length === 0) {
    list.innerHTML = `<div class="bg-white p-10 rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">No drives scheduled yet. Head over to <strong>Discover Drives</strong> to accept a match!</div>`;
    return;
  }

  list.innerHTML = acceptedOpps.map(opp => {
    const taskState = state.completedTasks[opp.id] || [];
    const allDone = opp.tasks.every((_, idx) => taskState[idx]);

    return `
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span class="text-xs font-bold text-emerald-700">${opp.ngo}</span>
            <h3 class="text-lg font-extrabold text-slate-900">${opp.title}</h3>
            <p class="text-xs text-slate-500 mt-0.5">📅 ${opp.date} • 📍 ${opp.location} • ⏱ ${opp.hours} Service Hours</p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="completeDriveAndLog('${opp.id}')" class="px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              allDone ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm' : 'bg-slate-900 hover:bg-slate-800 text-white'
            }">
              ✓ Mark Drive Complete & Claim Certificate
            </button>
          </div>
        </div>

        <div class="mt-4">
          <p class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Assigned NGO Task Checklist</p>
          <div class="space-y-2">
            ${opp.tasks.map((task, idx) => `
              <label class="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer">
                <input type="checkbox" ${taskState[idx] ? 'checked' : ''} onchange="toggleTask('${opp.id}', ${idx})" class="w-4 h-4 accent-emerald-600 rounded" />
                <span class="text-sm ${taskState[idx] ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}">${task}</span>
              </label>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function toggleTask(oppId, idx) {
  if (!state.completedTasks[oppId]) state.completedTasks[oppId] = [];
  state.completedTasks[oppId][idx] = !state.completedTasks[oppId][idx];
  persistState();
  renderSchedule();
}

function completeDriveAndLog(oppId) {
  const opp = state.opportunities.find(o => o.id === oppId);
  if (!opp) return;

  const newEntry = {
    id: 'hist-' + Date.now(),
    title: opp.title,
    ngo: opp.ngo,
    date: opp.date.replace(/^[A-Za-z]+,\s*/, ''),
    hours: opp.hours,
    certId: 'VM-2026-' + Math.floor(1000 + Math.random() * 9000)
  };

  state.history.unshift(newEntry);
  state.acceptedIds = state.acceptedIds.filter(id => id !== oppId);
  persistState();

  switchVolTab('impact');
  openCertificateModal(newEntry.id);
}

/* ==================== IMPACT & CERTIFICATES ==================== */
function renderImpact() {
  const totalHours = state.history.reduce((sum, item) => sum + Number(item.hours), 0);
  document.getElementById('statTotalHours').textContent = `${totalHours} hrs`;
  document.getElementById('statDrivesCount').textContent = state.history.length;
  document.getElementById('statTier').textContent = totalHours >= 20 ? 'Gold Ambassador' : 'Civic Champion';

  const tbody = document.getElementById('impactTableBody');
  tbody.innerHTML = state.history.map(item => `
    <tr class="hover:bg-slate-50/80">
      <td class="py-4 px-6">
        <p class="font-bold text-slate-900">${item.title}</p>
        <p class="text-xs text-teal-700 font-medium">${item.ngo}</p>
      </td>
      <td class="py-4 px-6 text-slate-600">${item.date}</td>
      <td class="py-4 px-6 font-semibold text-slate-900">${item.hours} hrs</td>
      <td class="py-4 px-6 font-mono text-xs text-slate-500">${item.certId}</td>
      <td class="py-4 px-6 text-right">
        <button onclick="openCertificateModal('${item.id}')" class="px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs border border-emerald-200 transition cursor-pointer">
          🎓 View / Download
        </button>
      </td>
    </tr>
  `).join('');
}

function openCertificateModal(entryId) {
  document.getElementById('certVolunteerName').textContent = state.userName;

  if (entryId === 'consolidated') {
    const totalHours = state.history.reduce((sum, item) => sum + Number(item.hours), 0);
    document.getElementById('certBodyText').innerHTML =
      `In recognition of sustained civic leadership and community service across <strong>${state.history.length} verified NGO initiatives</strong> on the VolunteerMatch AI Network, completing a cumulative total of <strong>${totalHours} verified service hours</strong>.`;
    document.getElementById('certIssueDate').textContent = '19 Nov 2026';
    document.getElementById('certVerifyId').textContent = 'ID: VM-2026-PORTFOLIO';
  } else {
    const entry = state.history.find(h => h.id === entryId) || state.history[0];
    document.getElementById('certBodyText').innerHTML =
      `In recognition of dedicated voluntary service and community contribution during the <strong>${entry.title}</strong> organized by <strong>${entry.ngo}</strong>, completing <strong>${entry.hours} verified service hours</strong>.`;
    document.getElementById('certIssueDate').textContent = entry.date;
    document.getElementById('certVerifyId').textContent = `ID: ${entry.certId}`;
  }

  document.getElementById('certModal').classList.remove('hidden');
}

function closeCertificateModal() {
  document.getElementById('certModal').classList.add('hidden');
}

function downloadCertificateHTML() {
  const certHTML = document.getElementById('certificatePrintableArea').outerHTML;
  const fullDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Certificate - ${state.userName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:ital,wght@0,700;1,600&display=swap" rel="stylesheet">
  <style>body{font-family:'Inter',sans-serif;padding:40px;background:#f5f5f4;} .cert-serif{font-family:'Playfair Display',serif;}</style>
</head>
<body>${certHTML}</body>
</html>`;
  const blob = new Blob([fullDoc], { type: 'text/html' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `VolunteerMatch_Certificate_${state.userName.replace(/\s+/g, '_')}.html`;
  link.click();
}

/* ==================== PREFERENCES DRAWER ==================== */
function initPreferencesUI() {
  const skillContainer = document.getElementById('skillPillsContainer');
  skillContainer.innerHTML = ALL_SKILLS.map(skill => {
    const active = state.profile.skills.includes(skill);
    return `<button type="button" onclick="toggleProfileTag('skills', '${skill}')" class="px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
      active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
    }">${skill}</button>`;
  }).join('');

  const intContainer = document.getElementById('interestPillsContainer');
  intContainer.innerHTML = ALL_INTERESTS.map(interest => {
    const active = state.profile.interests.includes(interest);
    return `<button type="button" onclick="toggleProfileTag('interests', '${interest}')" class="px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
      active ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
    }">${interest}</button>`;
  }).join('');

  document.getElementById('prefAvailability').value = state.profile.availability;
}

function toggleProfileTag(key, value) {
  if (state.profile[key].includes(value)) {
    if (state.profile[key].length > 1) {
      state.profile[key] = state.profile[key].filter(v => v !== value);
    }
  } else {
    state.profile[key].push(value);
  }
  initPreferencesUI();
}

function togglePrefsDrawer(open) {
  if (open) initPreferencesUI();
  document.getElementById('prefsDrawer').classList.toggle('hidden', !open);
}

function savePreferences() {
  state.profile.availability = document.getElementById('prefAvailability').value;
  togglePrefsDrawer(false);
  renderOpportunities();
}

/* ==================== NGO ORGANIZER PORTAL ==================== */
function switchNgoTab(tab) {
  ['drives', 'create', 'roster'].forEach(t => {
    document.getElementById('nview-' + t).classList.toggle('hidden', t !== tab);
    const btn = document.getElementById('ntab-' + t);
    if (btn) {
      btn.className = t === tab
        ? 'ngo-tab px-4 py-1.5 rounded-full text-sm font-semibold bg-white text-teal-700 shadow-sm transition cursor-pointer'
        : 'ngo-tab px-4 py-1.5 rounded-full text-sm font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer';
    }
  });
  renderNgoPortal();
}

function renderNgoPortal() {
  const grid = document.getElementById('ngoDrivesGrid');
  grid.innerHTML = state.opportunities.map(opp => `
    <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700">${opp.cause}</span>
          <span class="text-xs font-bold text-slate-500">${opp.spots} spots open</span>
        </div>
        <h3 class="text-lg font-extrabold text-slate-900">${opp.title}</h3>
        <p class="text-xs text-slate-500 mt-1">📅 ${opp.date} • 📍 ${opp.location}</p>
        <p class="text-sm text-slate-600 mt-3">${opp.desc}</p>
      </div>
      <div class="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
        <span class="font-semibold text-slate-700">Skills: ${opp.skills.join(', ')}</span>
        <span class="text-teal-700 font-bold">${opp.hours} hrs</span>
      </div>
    </div>
  `).join('');

  const rosterBody = document.getElementById('ngoRosterBody');
  rosterBody.innerHTML = `
    <tr>
      <td class="py-4 px-6 font-bold text-slate-900">${state.userName}</td>
      <td class="py-4 px-6 text-slate-700">Weekend Digital Literacy Camp</td>
      <td class="py-4 px-6 text-xs text-slate-500">${state.profile.skills.join(', ')}</td>
      <td class="py-4 px-6"><span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">Active & Verified</span></td>
      <td class="py-4 px-6 text-right">
        <button onclick="openCertificateModal('consolidated')" class="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer">
          Preview Certificate
        </button>
      </td>
    </tr>
    <tr>
      <td class="py-4 px-6 font-bold text-slate-900">Arpit Singh</td>
      <td class="py-4 px-6 text-slate-700">Hindon Riverbank Clean-Up</td>
      <td class="py-4 px-6 text-xs text-slate-500">Event Management, Public Speaking</td>
      <td class="py-4 px-6"><span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">Scheduled</span></td>
      <td class="py-4 px-6 text-right text-xs text-slate-400">Awaiting Drive Completion</td>
    </tr>
  `;
}

function handleCreateOpportunity(e) {
  e.preventDefault();
  const newOpp = {
    id: 'opp-' + Date.now(),
    title: document.getElementById('newOppTitle').value.trim(),
    ngo: state.ngoName,
    cause: document.getElementById('newOppCause').value,
    skills: document.getElementById('newOppSkills').value.split(',').map(s => s.trim()).filter(Boolean),
    slot: document.getElementById('newOppSlot').value,
    date: document.getElementById('newOppDate').value.trim(),
    location: document.getElementById('newOppLocation').value.trim(),
    hours: Number(document.getElementById('newOppHours').value),
    spots: 10,
    desc: document.getElementById('newOppDesc').value.trim(),
    tasks: ['Check-in at venue desk', 'Complete primary drive activity', 'Submit attendance sign-off']
  };

  state.opportunities.unshift(newOpp);
  persistState();
  e.target.reset();
  switchNgoTab('drives');
}
