const SUPABASE_URL = "https://rjoccijmuynkqjmlfthz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqb2NjaWptdXlua3FqbWxmdGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNjUzNzcsImV4cCI6MjA5NjY0MTM3N30.ZWslusLzSKN6KxD-k1Gm-1BFaB_SWZqirUm4KjnOfrQ";

const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
};

let currentEditor = null;
let allManuscripts = [];

// ── SESSION RESTORE ──────────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  const stored = sessionStorage.getItem("editor");
  if (stored) {
    try {
      currentEditor = JSON.parse(stored);
      showDashboard();
      loadDashboard();
    } catch {
      sessionStorage.clear();
    }
  }
});

// ── LOGIN ────────────────────────────────────────────────────────────────────
async function login() {
  const email    = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    showError("Please enter your email and password.");
    return;
  }

  const btn = document.querySelector("#loginSection .btn-primary");
  btn.textContent = "Signing in…";
  btn.disabled = true;

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/editors?editor_email=eq.${encodeURIComponent(email)}&password=eq.${encodeURIComponent(password)}`,
      { headers: HEADERS }
    );

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      showError("Invalid email or password.");
      btn.textContent = "Sign in to dashboard";
      btn.disabled = false;
      return;
    }

    currentEditor = data[0];
    sessionStorage.setItem("editor", JSON.stringify(currentEditor));

    showDashboard();
    await loadDashboard();

  } catch (err) {
    console.error("Login error:", err);
    showError("Login failed. Please try again.");
    btn.textContent = "Sign in to dashboard";
    btn.disabled = false;
  }
}

// ── LOGOUT ───────────────────────────────────────────────────────────────────
function logout() {
  sessionStorage.clear();
  currentEditor = null;
  allManuscripts = [];

  document.getElementById("loginSection").style.display = "block";
  document.getElementById("dashboard").style.display    = "none";
  document.getElementById("navRight").style.display     = "none";
  document.getElementById("email").value    = "";
  document.getElementById("password").value = "";
}

// ── SHOW DASHBOARD SHELL ─────────────────────────────────────────────────────
function showDashboard() {
  document.getElementById("loginSection").style.display = "none";
  document.getElementById("dashboard").style.display    = "block";
  document.getElementById("navRight").style.display     = "flex";

  if (currentEditor?.editor_email) {
    const email    = currentEditor.editor_email;
    const initials = email.substring(0, 2).toUpperCase();
    document.getElementById("editorAvatar").textContent = initials;
    document.getElementById("editorEmail").textContent  = email;

    const now = new Date().toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric"
    });
    const subtitle = document.getElementById("dashSubtitle");
    if (subtitle) subtitle.textContent = `Signed in as ${email} · ${now}`;
  }
}

// ── LOAD DATA ────────────────────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/manuscripts?select=*&order=submission_date.desc`,
      { headers: HEADERS }
    );

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const manuscripts = await res.json();
    allManuscripts = manuscripts;

    updateStats(manuscripts);
    renderTable(manuscripts);

  } catch (err) {
    console.error("Dashboard load error:", err);
    showTableError("Could not load manuscripts. Check your connection and try again.");
  }
}

// ── STATS ────────────────────────────────────────────────────────────────────
function updateStats(manuscripts) {
  const count = (status) => manuscripts.filter(m => m.status === status).length;

  document.getElementById("submittedCount").textContent   = manuscripts.length;
  document.getElementById("underReviewCount").textContent = count("Under Review");
  document.getElementById("acceptedCount").textContent    = count("Accepted");
  document.getElementById("rejectedCount").textContent    = count("Rejected");
}

// ── TABLE ────────────────────────────────────────────────────────────────────
const STATUS_CLASS = {
  "Submitted":    "badge-submitted",
  "Under Review": "badge-review",
  "Accepted":     "badge-accepted",
  "Rejected":     "badge-rejected",
  "Revision":     "badge-revision",
};

function renderTable(manuscripts) {
  const tbody = document.querySelector("#manuscriptTable tbody");
  const empty = document.getElementById("emptyState");
  tbody.innerHTML = "";

  if (!manuscripts.length) {
    if (empty) empty.style.display = "block";
    return;
  }
  if (empty) empty.style.display = "none";

  manuscripts.forEach(m => {
    const badgeClass = STATUS_CLASS[m.status] || "badge-submitted";
    const date = m.submission_date
      ? new Date(m.submission_date).toLocaleDateString("en-GB", {
          day: "numeric", month: "short", year: "numeric"
        })
      : "—";

    const tr = document.createElement("tr");
    tr.dataset.status = m.status;
    tr.innerHTML = `
      <td class="td-id">${escapeHtml(m.article_id || "—")}</td>
      <td class="td-title">
        ${escapeHtml(m.title || "Untitled")}
        <small>${escapeHtml(m.authors || "")}</small>
      </td>
      <td><span class="badge ${badgeClass}">${escapeHtml(m.status || "—")}</span></td>
      <td>${date}</td>
      <td>
        <button class="btn-action" onclick="openManuscript('${escapeHtml(String(m.article_id))}')">
          View
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ── FILTER ───────────────────────────────────────────────────────────────────
function filterTable(status, btn) {
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  const filtered = status === "all"
    ? allManuscripts
    : allManuscripts.filter(m => m.status === status);

  renderTable(filtered);
}

// ── NAVIGATION ───────────────────────────────────────────────────────────────
function openManuscript(articleId) {
  window.location.href = `manuscript.html?id=${encodeURIComponent(articleId)}`;
}

function openPasswordPage() {
  window.location.href = "change-password.html";
}

// ── HELPERS ──────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function showError(message) {
  let el = document.getElementById("loginError");
  if (!el) {
    el = document.createElement("p");
    el.id = "loginError";
    el.style.cssText = "color:#A32D2D; font-size:13px; margin-top:10px; text-align:center;";
    document.querySelector("#loginSection .btn-primary").after(el);
  }
  el.textContent = message;
}

function showTableError(message) {
  const empty = document.getElementById("emptyState");
  if (empty) {
    empty.style.display = "block";
    empty.textContent   = message;
  }
}
