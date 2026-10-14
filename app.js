const $ = (id) => document.getElementById(id);
let db = null;
let clients = [];
let toastTimer;

const money = (value) => new Intl.NumberFormat("sr-RS", { maximumFractionDigits: 0 }).format(Number(value || 0)) + " RSD";
const dateDisplay = (value) => {
  if (!value) return "—";
  const [y, m, d] = value.split("-");
  return `${d}.${m}.${y}.`;
};
const todayISO = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
};
const configReady = () => window.APP_CONFIG &&
  window.APP_CONFIG.SUPABASE_URL.startsWith("https://") &&
  !window.APP_CONFIG.SUPABASE_URL.includes("UNESITE") &&
  window.APP_CONFIG.SUPABASE_ANON_KEY &&
  !window.APP_CONFIG.SUPABASE_ANON_KEY.includes("UNESITE");

function setConnection(text, state = "") {
  $("connectionStatus").innerHTML = `<i class="${state}"></i> ${text}`;
}
function showToast(message, error = false) {
  const el = $("toast");
  el.textContent = message;
  el.className = `toast show${error ? " error" : ""}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.className = "toast", 3200);
}
function explainError(error) {
  if (!error) return "Došlo je do nepoznate greške.";
  if (/duplicate key|unique constraint/i.test(error.message || "")) return "Ovaj ID već postoji. Unesite jedinstven ID klijenta.";
  if (/Invalid login credentials/i.test(error.message || "")) return "Email ili lozinka nisu ispravni.";
  return error.message || "Došlo je do greške. Pokušajte ponovo.";
}
function openModal(client = null) {
  $("clientForm").reset();
  $("recordId").value = client?.id || "";
  $("clientCode").value = client?.client_code || "";
  $("clientName").value = client?.full_name || "";
  $("clientDate").value = client?.service_date || todayISO();
  $("clientService").value = client?.service_type || "";
  $("clientPrice").value = client?.price ?? "";
  $("modalTitle").textContent = client ? "Izmeni zapis" : "Dodaj klijenta";
  $("saveBtn").innerHTML = client ? "Sačuvaj izmene <span>→</span>" : "Sačuvaj zapis <span>→</span>";
  $("clientFormMessage").textContent = "";
  $("clientModal").classList.remove("hidden");
  setTimeout(() => $("clientCode").focus(), 80);
}
function closeModal() { $("clientModal").classList.add("hidden"); }
function filteredClients() {
  const query = $("searchInput").value.trim().toLocaleLowerCase("sr");
  const service = $("serviceFilter").value;
  return clients.filter(c => {
    const searchable = `${c.client_code} ${c.full_name} ${c.service_type}`.toLocaleLowerCase("sr");
    return (!query || searchable.includes(query)) && (!service || c.service_type === service);
  }).sort((a,b) => b.service_date.localeCompare(a.service_date) || String(b.client_code).localeCompare(String(a.client_code)));
}
function render() {
  const rows = filteredClients();
  const tbody = $("clientsTable");
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-cell"><div class="empty-icon">⌕</div><strong>Nema pronađenih zapisa</strong><small>Dodajte klijenta ili promenite pretragu.</small></td></tr>`;
  } else {
    tbody.innerHTML = rows.map(c => `<tr>
      <td><span class="id-pill">#${escapeHtml(c.client_code)}</span></td>
      <td><span class="client-avatar">${escapeHtml(initials(c.full_name))}</span><strong class="client-name">${escapeHtml(c.full_name)}</strong></td>
      <td class="date-cell">${dateDisplay(c.service_date)}</td>
      <td><span class="service-pill">${escapeHtml(c.service_type)}</span></td>
      <td class="price-cell">${money(c.price)}</td>
      <td><div class="row-actions"><button class="icon-btn edit-btn" data-edit="${c.id}" title="Izmeni" aria-label="Izmeni zapis">✎</button><button class="icon-btn delete-btn" data-delete="${c.id}" title="Obriši" aria-label="Obriši zapis">⌫</button></div></td>
    </tr>`).join("");
  }
  $("resultsCount").textContent = `${rows.length} ${rows.length === 1 ? "zapis" : "zapisa"}`;
  $("totalClients").textContent = clients.length.toLocaleString("sr-RS");
  const month = todayISO().slice(0,7);
  const thisMonth = clients.filter(c => (c.service_date || "").startsWith(month));
  $("monthVisits").textContent = thisMonth.length.toLocaleString("sr-RS");
  $("monthRevenue").textContent = money(thisMonth.reduce((sum,c) => sum + Number(c.price || 0), 0));
}
function initials(name) {
  return String(name || "?").trim().split(/\s+/).slice(0,2).map(s => s[0] || "").join("").toLocaleUpperCase("sr");
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));
}
async function loadClients() {
  setConnection("Učitavanje...", "loading");
  const { data, error } = await db.from("clients").select("*").order("service_date", { ascending: false });
  if (error) {
    setConnection("Greška u vezi", "bad");
    showToast("Ne mogu da učitam podatke: " + explainError(error), true);
    $("clientsTable").innerHTML = `<tr><td colspan="6" class="empty-cell">Podaci nisu dostupni. Proverite podešavanje baze i internet vezu.</td></tr>`;
    return;
  }
  clients = data || [];
  setConnection("Povezano", "good");
  render();
}
async function saveClient(event) {
  event.preventDefault();
  const save = $("saveBtn");
  save.disabled = true;
  save.textContent = "Čuvanje...";
  const recordId = $("recordId").value;
  const payload = {
    client_code: $("clientCode").value.trim(),
    full_name: $("clientName").value.trim(),
    service_date: $("clientDate").value,
    service_type: $("clientService").value,
    price: Number($("clientPrice").value)
  };
  try {
    const result = recordId
      ? await db.from("clients").update(payload).eq("id", recordId)
      : await db.from("clients").insert(payload);
    if (result.error) throw result.error;
    closeModal();
    showToast(recordId ? "Izmene su sačuvane." : "Klijent je uspešno dodat.");
    await loadClients();
  } catch (error) {
    $("clientFormMessage").textContent = explainError(error);
    $("clientFormMessage").classList.add("is-error");
  } finally {
    save.disabled = false;
    save.innerHTML = recordId ? "Sačuvaj izmene <span>→</span>" : "Sačuvaj zapis <span>→</span>";
  }
}
async function deleteClient(id) {
  const client = clients.find(c => String(c.id) === String(id));
  if (!client || !confirm(`Da li sigurno želite da obrišete zapis za ${client.full_name} (ID ${client.client_code})? Ova radnja se ne može poništiti.`)) return;
  const { error } = await db.from("clients").delete().eq("id", id);
  if (error) { showToast("Brisanje nije uspelo: " + explainError(error), true); return; }
  showToast("Zapis je obrisan.");
  await loadClients();
}
function showApp() {
  $("loginView").classList.add("hidden");
  $("appView").classList.remove("hidden");
  $("logoutBtn").classList.remove("hidden");
}
function showLogin() {
  $("appView").classList.add("hidden");
  $("loginView").classList.remove("hidden");
  $("logoutBtn").classList.add("hidden");
}
async function init() {
  if (!configReady() || !window.supabase) {
    setConnection("Potrebno podešavanje", "bad");
    showLogin();
    $("loginMessage").textContent = "Pre korišćenja unesite Supabase URL i publishable/anon ključ u fajl config.js, a zatim podesite bazu prema README-u.";
    $("loginMessage").classList.add("is-error");
    $("loginForm").querySelector("button").disabled = true;
    return;
  }
  db = window.supabase.createClient(window.APP_CONFIG.SUPABASE_URL, window.APP_CONFIG.SUPABASE_ANON_KEY);
  const { data: { session } } = await db.auth.getSession();
  if (session) { showApp(); await loadClients(); } else { showLogin(); setConnection("Niste prijavljeni"); }
  db.auth.onAuthStateChange((event, sessionNow) => {
    if (sessionNow) {
      showApp();
      setTimeout(() => loadClients(), 0);
    } else {
      showLogin();
      clients = [];
      render();
      setConnection("Niste prijavljeni");
    }
  });
}
$("loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (!db) return;
  const button = $("loginForm").querySelector("button");
  button.disabled = true;
  $("loginMessage").textContent = "Prijavljivanje...";
  $("loginMessage").classList.remove("is-error");
  const { error } = await db.auth.signInWithPassword({ email: $("loginEmail").value.trim(), password: $("loginPassword").value });
  button.disabled = false;
  if (error) {
    $("loginMessage").textContent = explainError(error);
    $("loginMessage").classList.add("is-error");
  } else {
    $("loginMessage").textContent = "";
  }
});
$("logoutBtn").addEventListener("click", async () => { if (db) await db.auth.signOut(); });
$("newClientBtn").addEventListener("click", () => openModal());
$("closeModalBtn").addEventListener("click", closeModal);
$("cancelBtn").addEventListener("click", closeModal);
$("clientModal").addEventListener("click", e => { if (e.target.dataset.close) closeModal(); });
$("clientForm").addEventListener("submit", saveClient);
$("searchInput").addEventListener("input", render);
$("serviceFilter").addEventListener("change", render);
$("refreshBtn").addEventListener("click", loadClients);
$("clientsTable").addEventListener("click", e => {
  const edit = e.target.closest("[data-edit]");
  const del = e.target.closest("[data-delete]");
  if (edit) openModal(clients.find(c => String(c.id) === edit.dataset.edit));
  if (del) deleteClient(del.dataset.delete);
});
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
init();
