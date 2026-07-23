import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers, faUser, faClipboardList,
  faStar, faMoneyBillWave, faSignOutAlt, faSearch, faTimes,
  faCheck, faBan, faTrash, faChevronLeft, faChevronRight,
  faExclamationTriangle, faShieldAlt, faEnvelopeCircleCheck,
  faGauge, faHardHat, faClock, faBell, faPlus, faComments,
  faList, faQuestionCircle, faEdit, faSave
} from "@fortawesome/free-solid-svg-icons";

// -------------------------------------------------------------------
// Admin panel tabs configuration
// -------------------------------------------------------------------
const TABS = [
  { id: "overview", label: "Visão geral", icon: faGauge },
  { id: "users", label: "Utilizadores", icon: faUsers },
  { id: "projects", label: "Projectos", icon: faClipboardList },
  { id: "conversations", label: "Conversas / Mensagens", icon: faComments },
  { id: "reviews", label: "Avaliações", icon: faStar },
  { id: "portfolios", label: "Portfolios", icon: faHardHat },
  { id: "verifications", label: "Verificações", icon: faShieldAlt },
  { id: "alerts", label: "Alertas", icon: faBell },
  { id: "audit", label: "Auditoria", icon: faShieldAlt },
  { id: "categories", label: "Categorias", icon: faList },
  { id: "faqs", label: "FAQs", icon: faQuestionCircle },
];

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

// -------------------------------------------------------------------
// Cores partilhadas
// -------------------------------------------------------------------
const C = {
  primary: "var(--color-primary)",
  primaryDark: "var(--color-primary-dark)",
  accent: "var(--color-accent)",
  dark: "var(--color-dark)",
  gray: "var(--color-gray)",
  lightGray: "var(--color-light-gray)",
  white: "var(--color-white)",
  success: "var(--color-success)",
  error: "var(--color-error)",
  border: "var(--color-border)",
  purple: "var(--color-purple)",
};

// ── Cliente HTTP simples e isolado (não depende de services/api.js) ────
const adminFetch = async (path, opts = {}) => {
  const token = localStorage.getItem("buildmatch_token");
  const res = await fetch(`${API_BASE}/api/admin${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Erro no pedido");
  return data;
};

// ── Componentes utilitários ────────────────────────────────────────────

const Icon = ({ icon, size = 16, color, style: ex }) => (
  <FontAwesomeIcon icon={icon} style={{ fontSize: size, color: color || "currentColor", ...ex }} />
);

const Card = ({ children, style }) => (
  <div style={{ background: C.white, borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", padding: 18, ...style }}>
    {children}
  </div>
);

const Spinner = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
    <div style={{ width: 32, height: 32, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.primary}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
  </div>
);

const StatCard = ({ icon, label, value, color = C.primary }) => (
  <Card style={{ padding: 16, textAlign: "center" }}>
    <Icon icon={icon} size={24} color={color} />
    <div style={{ fontSize: 22, fontWeight: 800, color, marginTop: 8 }}>{value}</div>
    <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>{label}</div>
  </Card>
);

const Pill = ({ children, bg, color }) => (
  <span style={{ background: bg, color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
    {children}
  </span>
);

const ConfirmModal = ({ text, onConfirm, onCancel }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
    <div style={{ background: C.white, borderRadius: 18, padding: 24, maxWidth: 340, width: "100%" }}>
      <Icon icon={faExclamationTriangle} size={32} color={C.error} />
      <p style={{ margin: "12px 0 20px", color: C.dark, fontSize: 14, lineHeight: 1.5 }}>{text}</p>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: 10, border: `1px solid ${C.border}`, background: "transparent", borderRadius: 10, cursor: "pointer" }}>Cancelar</button>
        <button onClick={onConfirm} style={{ flex: 1, padding: 10, border: "none", background: C.error, color: "#fff", borderRadius: 10, cursor: "pointer", fontWeight: 700 }}>Confirmar</button>
      </div>
    </div>
  </div>
);

const Pagination = ({ page, pages, onChange }) => {
  if (pages <= 1) return null;
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 16 }}>
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, width: 34, height: 34, cursor: page <= 1 ? "default" : "pointer", opacity: page <= 1 ? 0.4 : 1 }}>
        <Icon icon={faChevronLeft} size={12} />
      </button>
      <span style={{ fontSize: 13, color: C.gray }}>Página {page} de {pages}</span>
      <button disabled={page >= pages} onClick={() => onChange(page + 1)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, width: 34, height: 34, cursor: page >= pages ? "default" : "pointer", opacity: page >= pages ? 0.4 : 1 }}>
        <Icon icon={faChevronRight} size={12} />
      </button>
    </div>
  );
};

// ============================================================
// VISÃO GERAL
// ============================================================
const Overview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setL] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch("/stats").then(setStats).catch(e => setError(e.message)).finally(() => setL(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <p style={{ color: C.error, textAlign: "center", padding: 32 }}>{error}</p>;

  return (
    <div>
      <div className="admin-stats-grid">
        <StatCard icon={faUsers} label="Utilizadores" value={stats.totalUsers} color={C.primary} />
        <StatCard icon={faUser} label="Clientes" value={stats.totalClients} color={C.purple} />
        <StatCard icon={faHardHat} label="Profissionais" value={stats.totalProfessionals} color={C.accent} />
        <StatCard icon={faClipboardList} label="Projectos" value={stats.totalProjects} color={C.primary} />
        <StatCard icon={faClock} label="Activos" value={stats.activeProjects} color="#F59E0B" />
        <StatCard icon={faCheck} label="Concluídos" value={stats.completedProjects} color={C.success} />
        <StatCard icon={faStar} label="Avaliações" value={stats.totalReviews} color="#F59E0B" />
        <StatCard icon={faEnvelopeCircleCheck} label="Emails p/ confirmar" value={stats.unverifiedEmails} color={C.error} />
      </div>
      <Card style={{ marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Icon icon={faMoneyBillWave} size={16} color={C.accent} />
          <h4 style={{ margin: 0, color: C.dark }}>Receita total (projectos concluídos)</h4>
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: C.accent }}>
          {Number(stats.totalRevenue || 0).toLocaleString()} CVE
        </div>
      </Card>
    </div>
  );
};

// ============================================================
// UTILIZADORES
// ============================================================
const UsersPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setL] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [confirmAction, setConfirmAction] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  // Formulário de criação
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newType, setNewType] = useState("CLIENT");
  const [newSpecialty, setNewSpecialty] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const load = useCallback(() => {
    setL(true);
    const params = new URLSearchParams({ page, limit: 15, ...(search ? { search } : {}), ...(type ? { type } : {}) });
    adminFetch(`/users?${params}`).then(d => { setUsers(d.data); setPages(d.pages); }).catch(e => setError(e.message)).finally(() => setL(false));
  }, [page, search, type]);

  useEffect(() => {
    const t = setTimeout(() => load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const toggleActive = async (u) => {
    try {
      await adminFetch(`/users/${u.id}/status`, { method: "PUT", body: JSON.stringify({ active: !u.active }) });
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, active: !u.active } : x));
    } catch (e) { alert(e.message); }
  };

  const remove = async (id) => {
    try {
      await adminFetch(`/users/${id}`, { method: "DELETE" });
      setUsers(prev => prev.filter(u => u.id !== id));
      setConfirmAction(null);
    } catch (e) { alert(e.message); }
  };

  const createUser = async () => {
    if (!newName || !newEmail || !newPass) { setCreateError("Nome, email e password são obrigatórios"); return; }
    setCreating(true); setCreateError("");
    try {
      const created = await adminFetch("/users", {
        method: "POST",
        body: JSON.stringify({ name: newName, email: newEmail, password: newPass, type: newType, specialty: newSpecialty }),
      });
      setUsers(prev => [created, ...prev]);
      setShowCreate(false);
      setNewName(""); setNewEmail(""); setNewPass(""); setNewType("CLIENT"); setNewSpecialty("");
    } catch (e) { setCreateError(e.message); } finally { setCreating(false); }
  };

  return (
    <div>
      <div className="admin-toolbar">
        <div className="admin-search-box">
          <Icon icon={faSearch} size={14} color={C.gray} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Pesquisar por nome ou email..." />
          {search && <button onClick={() => setSearch("")} className="admin-clear-btn"><Icon icon={faTimes} size={12} color={C.gray} /></button>}
        </div>
        <select value={type} onChange={e => { setType(e.target.value); setPage(1); }} className="admin-select">
          <option value="">Todos os tipos</option>
          <option value="CLIENT">Clientes</option>
          <option value="PROFESSIONAL">Profissionais</option>
          <option value="ADMIN">Administradores</option>
        </select>
        <button
          id="admin-create-user-btn"
          onClick={() => setShowCreate(true)}
          style={{
            background: C.primary, color: "#fff", border: "none",
            padding: "8px 14px", borderRadius: 8, cursor: "pointer",
            fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
            display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
          }}
        >
          <Icon icon={faPlus} size={12} color="#fff" /> Novo utilizador
        </button>
      </div>

      {error && <p style={{ color: C.error }}>{error}</p>}
      {loading ? <Spinner /> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th className="hide-mobile">Email</th>
                <th>Tipo</th>
                <th className="hide-mobile">Estado</th>
                <th>Acções</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: C.dark }}>{u.name}</div>
                    <div className="show-mobile-only" style={{ fontSize: 11, color: C.gray }}>{u.email}</div>
                  </td>
                  <td className="hide-mobile">{u.email}</td>
                  <td>
                    <Pill bg={u.type === "PROFESSIONAL" ? `${C.accent}18` : u.type === "ADMIN" ? `${C.purple}18` : `${C.primary}18`}
                      color={u.type === "PROFESSIONAL" ? C.accent : u.type === "ADMIN" ? C.purple : C.primary}>
                      {u.type === "CLIENT" ? "Cliente" : u.type === "PROFESSIONAL" ? "Profissional" : "Admin"}
                    </Pill>
                    {!u.emailVerified && (
                      <div style={{ marginTop: 4 }}>
                        <Pill bg="#FEF3C7" color="#D97706"><Icon icon={faEnvelopeCircleCheck} size={9} /> Por confirmar</Pill>
                      </div>
                    )}
                  </td>
                  <td className="hide-mobile">
                    <Pill bg={u.active === false ? "#FEE2E2" : "#D1FAE5"} color={u.active === false ? C.error : C.success}>
                      {u.active === false ? "Suspenso" : "Activo"}
                    </Pill>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="admin-icon-btn" title={u.active === false ? "Reactivar" : "Suspender"} onClick={() => toggleActive(u)}>
                        <Icon icon={u.active === false ? faCheck : faBan} size={13} color={u.active === false ? C.success : "#D97706"} />
                      </button>
                      <button className="admin-icon-btn danger" title="Eliminar" onClick={() => setConfirmAction({ type: "user", id: u.id, name: u.name })}>
                        <Icon icon={faTrash} size={13} color={C.error} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 24, color: C.gray }}>Nenhum utilizador encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={pages} onChange={setPage} />

      {confirmAction?.type === "user" && (
        <ConfirmModal
          text={`Eliminar permanentemente a conta de "${confirmAction.name}"? Esta acção não pode ser desfeita.`}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => remove(confirmAction.id)}
        />
      )}

      {/* Modal de criação de utilizador */}
      {showCreate && (
        <div onClick={() => setShowCreate(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 460, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontWeight: 800, color: C.dark, display: "flex", alignItems: "center", gap: 8 }}>
                <Icon icon={faPlus} size={16} color={C.primary} /> Novo Utilizador
              </h3>
              <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.gray }}>×</button>
            </div>

            {createError && <p style={{ color: C.error, fontSize: 13, margin: "0 0 12px", padding: "8px 12px", background: "#FEE2E2", borderRadius: 8 }}>{createError}</p>}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: C.dark, display: "block", marginBottom: 4 }}>Nome completo *</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome do utilizador"
                  style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: C.dark, display: "block", marginBottom: 4 }}>Email *</label>
                <input value={newEmail} onChange={e => setNewEmail(e.target.value)} type="email" placeholder="email@exemplo.com"
                  style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: C.dark, display: "block", marginBottom: 4 }}>Password *</label>
                <input value={newPass} onChange={e => setNewPass(e.target.value)} type="password" placeholder="Mínimo 6 caracteres"
                  style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: C.dark, display: "block", marginBottom: 4 }}>Tipo de conta *</label>
                <select value={newType} onChange={e => setNewType(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", background: "#fff", color: C.dark }}>
                  <option value="CLIENT">Cliente</option>
                  <option value="PROFESSIONAL">Profissional</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              {newType === "PROFESSIONAL" && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: C.dark, display: "block", marginBottom: 4 }}>Especialidade</label>
                  <input value={newSpecialty} onChange={e => setNewSpecialty(e.target.value)} placeholder="Ex: Pedreiro, Electricista..."
                    style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }} />
                </div>
              )}
              <p style={{ fontSize: 11, color: C.gray, margin: 0 }}>
                ℹ️ O utilizador será criado com email já verificado e conta activa.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowCreate(false)}
                style={{ flex: 1, padding: "11px", border: `1px solid ${C.border}`, borderRadius: 12, background: "transparent", cursor: "pointer", fontSize: 14, fontWeight: 600, color: C.gray, fontFamily: "'DM Sans', sans-serif" }}>
                Cancelar
              </button>
              <button onClick={createUser} disabled={creating}
                style={{ flex: 1, padding: "11px", border: "none", borderRadius: 12, background: creating ? C.lightGray : C.primary, cursor: creating ? "default" : "pointer", fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
                {creating ? "A criar..." : "Criar utilizador"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// PROJECTOS
// ============================================================
const ProjectsPanel = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setL] = useState(true);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [confirmAction, setConfirmAction] = useState(null);

  // Load projects list
  const load = useCallback(() => {
    setL(true);
    const params = new URLSearchParams({ page, limit: 15, ...(status ? { status } : {}) });
    adminFetch(`/projects?${params}`)
      .then(d => { setProjects(d.data); setPages(d.pages); })
      .catch(e => console.error('Erro ao carregar projectos', e))
      .finally(() => setL(false));
  }, [page, status]);

  // Load projects on mount / when dependencies change
  useEffect(() => {
    const t = setTimeout(() => {
      load();
    }, 0);
    return () => clearTimeout(t);
  }, [load]);

  const statusMap = {
    COMPLETED: { bg: "#D1FAE5", color: "#059669", label: "Concluído" },
    ACTIVE: { bg: "#DBEAFE", color: "#1D4ED8", label: "Activo" },
    PENDING: { bg: "#FEF3C7", color: "#D97706", label: "Pendente" },
    CANCELLED: { bg: "#FEE2E2", color: "#DC2626", label: "Cancelado" },
  };

  const remove = async (id) => {
    try {
      await adminFetch(`/projects/${id}`, { method: "DELETE" });
      setProjects(prev => prev.filter(p => p.id !== id));
      setConfirmAction(null);
    } catch (e) { alert(e.message); }
  };

  return (
    <div>
      {/* Existing Toolbar and Table */}
      <div className="admin-toolbar">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="admin-select">
          <option value="">Todos os estados</option>
          <option value="PENDING">Pendentes</option>
          <option value="ACTIVE">Activos</option>
          <option value="COMPLETED">Concluídos</option>
          <option value="CANCELLED">Cancelados</option>
        </select>
      </div>
      {loading ? <Spinner /> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Projecto</th><th className="hide-mobile">Cliente</th><th className="hide-mobile">Profissional</th><th>Estado</th><th>Acções</th></tr>
            </thead>
            <tbody>
              {projects.map(p => {
                const s = statusMap[p.status] || {};
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700, color: C.dark }}>{p.title}</td>
                    <td className="hide-mobile">{p.client?.name}</td>
                    <td className="hide-mobile">{p.professional?.user?.name}</td>
                    <td><Pill bg={s.bg} color={s.color}>{s.label}</Pill></td>
                    <td>
                      <button className="admin-icon-btn danger" title="Eliminar" onClick={() => setConfirmAction({ id: p.id, name: p.title })}>
                        <Icon icon={faTrash} size={13} color={C.error} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {projects.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 24, color: C.gray }}>Nenhum projecto encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={pages} onChange={setPage} />
      {confirmAction && (
        <ConfirmModal text={`Eliminar o projecto "${confirmAction.name}"?`} onCancel={() => setConfirmAction(null)} onConfirm={() => remove(confirmAction.id)} />
      )}
    </div>
  );
};

// ============================================================
// AVALIAÇÕES
// ============================================================
const ReviewsPanel = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setL] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [confirmAction, setConfirmAction] = useState(null); // { id } for delete, { userId, name, active } for suspend

  const load = useCallback(() => {
    setL(true);
    const params = new URLSearchParams({ page, limit: 15, ...(search ? { search } : {}), ...(ratingFilter ? { rating: ratingFilter } : {}) });
    adminFetch(`/comments?${params}`) // Using /comments since it supports search and rating filtering
      .then(d => { setReviews(d.data); setPages(d.pages); })
      .finally(() => setL(false));
  }, [page, search, ratingFilter]);

  useEffect(() => {
    const t = setTimeout(() => load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const remove = async (id) => {
    try {
      await adminFetch(`/reviews/${id}`, { method: "DELETE" });
      setReviews(prev => prev.filter(r => r.id !== id));
      setConfirmAction(null);
    } catch (e) { alert(e.message); }
  };

  const suspend = async (userId, currentActive) => {
    try {
      await adminFetch(`/users/${userId}/status`, { method: "PUT", body: JSON.stringify({ active: !currentActive }) });
      setReviews(prev => prev.map(r => 
        r.professional?.user?.id === userId 
          ? { ...r, professional: { ...r.professional, user: { ...r.professional.user, active: !currentActive } } } 
          : r
      ));
      setConfirmAction(null);
    } catch (e) { alert(e.message); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="admin-toolbar">
        <div className="admin-search-box">
          <Icon icon={faSearch} size={14} color={C.gray} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Pesquisar por texto ou autor..." />
          {search && <button onClick={() => setSearch("")} className="admin-clear-btn"><Icon icon={faTimes} size={12} color={C.gray} /></button>}
        </div>
        <select value={ratingFilter} onChange={e => { setRatingFilter(e.target.value); setPage(1); }} className="admin-select">
          <option value="">Todas as estrelas</option>
          <option value="1">1 estrela (Critico)</option>
          <option value="2">2 estrelas</option>
          <option value="3">3 estrelas</option>
          <option value="4">4 estrelas</option>
          <option value="5">5 estrelas</option>
        </select>
      </div>

      {reviews.map(r => {
        const isLowRating = r.rating < 3;
        const profUser = r.professional?.user;
        return (
        <Card key={r.id} style={{ marginBottom: 14, borderLeft: `4px solid ${isLowRating ? C.error : "#F59E0B"}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 700, color: C.dark, fontSize: 14 }}>{r.author?.name}</div>
              <div style={{ color: C.gray, fontSize: 12 }}>Avaliação para {profUser?.name} ({r.professional?.specialty})</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ background: isLowRating ? "#FEE2E2" : "#FEF3C7", padding: "4px 10px", borderRadius: 20, display: "flex", alignItems: "center", gap: 6 }}>
                {[1, 2, 3, 4, 5].map(i => <Icon key={i} icon={faStar} size={12} color={i <= r.rating ? (isLowRating ? C.error : "#F59E0B") : C.border} />)}
                <span style={{ fontWeight: 800, fontSize: 12, color: isLowRating ? C.error : "#D97706" }}>{r.rating}/5</span>
              </div>
              
              {profUser && profUser.id && (
                <button
                  className="admin-icon-btn"
                  title={profUser.active === false ? "Reactivar Profissional" : "Suspender Profissional"}
                  onClick={() => setConfirmAction({ userId: profUser.id, name: profUser.name, active: profUser.active })}
                >
                  <Icon icon={profUser.active === false ? faCheck : faBan} size={13} color={profUser.active === false ? C.success : "#D97706"} />
                </button>
              )}
              <button className="admin-icon-btn danger" title="Eliminar Avaliação" onClick={() => setConfirmAction({ id: r.id })}>
                <Icon icon={faTrash} size={13} color={C.error} />
              </button>
            </div>
          </div>
          <div style={{ background: C.lightGray, padding: "12px 14px", borderRadius: 10, border: `1px solid ${isLowRating ? "#FECACA" : C.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: isLowRating ? C.error : C.gray, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {isLowRating ? "⚠️ Motivo da baixa avaliação" : "Comentário"}
              </div>
            </div>
            <p style={{ color: C.dark, fontSize: 13, lineHeight: 1.6, margin: 0 }}>{r.comment || "Sem comentário escrito."}</p>
            {r.reply && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${C.border}`, fontSize: 12, color: C.gray }}>
                <strong>Resposta do profissional:</strong> {r.reply}
              </div>
            )}
          </div>
        </Card>
      )})}
      {reviews.length === 0 && <p style={{ textAlign: "center", color: C.gray, padding: 32 }}>Nenhuma avaliação encontrada</p>}
      <Pagination page={page} pages={pages} onChange={setPage} />
      {confirmAction && confirmAction.id && (
        <ConfirmModal text="Eliminar esta avaliação? A média do profissional será recalculada." onCancel={() => setConfirmAction(null)} onConfirm={() => remove(confirmAction.id)} />
      )}
      {confirmAction && confirmAction.userId && (
        <ConfirmModal
          text={confirmAction.active === false
            ? `Reactivar a conta de "${confirmAction.name}"?`
            : `Suspender a conta de "${confirmAction.name}"? (Ideal para casos de avaliações muito baixas)`
          }
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => suspend(confirmAction.userId, confirmAction.active)}
        />
      )}
    </div>
  );
};

// ============================================================
// CONVERSAS & MENSAGENS (Admin Monitoring)
// ============================================================
const ConversationsPanel = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setL] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const load = useCallback(() => {
    setL(true);
    adminFetch('/messages/conversations')
      .then(d => setConversations(d.data || []))
      .catch(e => console.error(e))
      .finally(() => setL(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const selectConversation = (conv) => {
    setSelectedConv(conv);
    setLoadingMsgs(true);
    adminFetch(`/messages/project/${conv.id}`)
      .then(d => setMessages(d.data || []))
      .catch(e => console.error(e))
      .finally(() => setLoadingMsgs(false));
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <h3 style={{ marginBottom: 16, color: C.dark }}>Conversas da Plataforma</h3>
      {selectedConv ? (
        <div>
          <button
            onClick={() => setSelectedConv(null)}
            className="admin-btn secondary"
            style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}
          >
            <Icon icon={faChevronLeft} size={13} /> Voltar às Conversas
          </button>
          <Card style={{ marginBottom: 16, borderLeft: `4px solid ${C.primary}` }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.dark }}>
              Cliente: {selectedConv.client?.name} ({selectedConv.client?.email})
            </div>
            <div style={{ fontWeight: 600, fontSize: 13, color: C.gray, marginTop: 4 }}>
              Profissional: {selectedConv.professional?.user?.name} ({selectedConv.professional?.specialty})
            </div>
            <div style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>
              Projeto Contexto: {selectedConv.title}
            </div>
          </Card>
          {loadingMsgs ? <Spinner /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {messages.length === 0 ? (
                <p style={{ textAlign: "center", color: C.gray, padding: 20 }}>Sem mensagens nesta conversa.</p>
              ) : (
                messages.map((m) => (
                  <Card key={m.id} style={{ background: m.senderId === selectedConv.clientId ? C.white : C.lightGray }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: C.primary }}>
                        {m.sender?.name || "Utilizador"}
                      </span>
                      <span style={{ fontSize: 11, color: C.gray }}>
                        {new Date(m.createdAt).toLocaleString("pt-PT")}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, color: C.dark, lineHeight: 1.5 }}>{m.content}</p>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {conversations.length === 0 ? (
            <p style={{ textAlign: "center", color: C.gray, padding: 32 }}>Nenhuma conversa iniciada na plataforma.</p>
          ) : (
            conversations.map((c) => {
              const lastMsg = c.messages?.[0];
              return (
                <Card key={c.id} style={{ cursor: "pointer", transition: "all 0.2s" }} onClick={() => selectConversation(c)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: C.dark }}>
                        {c.client?.name} & {c.professional?.user?.name}
                      </div>
                      <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>
                        Especialidade: {c.professional?.specialty} | Projeto: {c.title}
                      </div>
                      {lastMsg && (
                        <p style={{ fontSize: 13, color: C.dark, margin: "8px 0 0", fontStyle: "italic", background: C.lightGray, padding: "6px 10px", borderRadius: 8 }}>
                          "{lastMsg.content?.slice(0, 100)}{lastMsg.content?.length > 100 ? '...' : ''}"
                        </p>
                      )}
                    </div>
                    <button className="admin-btn primary small" style={{ whiteSpace: "nowrap" }}>
                      Ver Histórico
                    </button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================
// PORTFOLIOS
// ============================================================
const PortfoliosPanel = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setL] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [confirmAction, setConfirmAction] = useState(null);
  const [viewItem, setViewItem] = useState(null);

  const load = useCallback(() => {
    setL(true);
    const params = new URLSearchParams({ page, limit: 15, ...(search ? { search } : {}), ...(status ? { status } : {}) });
    adminFetch(`/portfolios?${params}`)
      .then(d => { setPortfolios(d.data); setPages(d.pages); })
      .catch(e => setError(e.message))
      .finally(() => setL(false));
  }, [page, search, status]);

  useEffect(() => { const t = setTimeout(() => load(), 0); return () => clearTimeout(t); }, [load]);

  const approve = async (id) => {
    try {
      await adminFetch(`/portfolios/${id}/approve`, { method: "POST" });
      setPortfolios(prev => prev.map(p => p.id === id ? { ...p, featured: true } : p));
    } catch (e) { alert(e.message); }
  };

  const reject = async (id) => {
    try {
      await adminFetch(`/portfolios/${id}/reject`, { method: "POST" });
      setPortfolios(prev => prev.map(p => p.id === id ? { ...p, featured: false } : p));
    } catch (e) { alert(e.message); }
  };

  const remove = async (id) => {
    try {
      await adminFetch(`/portfolios/${id}`, { method: "DELETE" });
      setPortfolios(prev => prev.filter(p => p.id !== id));
      setConfirmAction(null);
    } catch (e) { alert(e.message); }
  };

  const images = (item) => {
    try { return Array.isArray(item.imageUrls) ? item.imageUrls : JSON.parse(item.imageUrls || "[]"); }
    catch { return []; }
  };

  return (
    <div>
      <div className="admin-toolbar">
        <div className="admin-search-box">
          <Icon icon={faSearch} size={14} color={C.gray} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Pesquisar por título..." />
          {search && <button onClick={() => setSearch("")} className="admin-clear-btn"><Icon icon={faTimes} size={12} color={C.gray} /></button>}
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="admin-select">
          <option value="">Todos</option>
          <option value="approved">Aprovados</option>
          <option value="pending">Pendentes</option>
        </select>
      </div>

      {error && <p style={{ color: C.error }}>{error}</p>}
      {loading ? <Spinner /> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Título</th>
                <th className="hide-mobile">Profissional</th>
                <th className="hide-mobile">Categoria</th>
                <th>Estado</th>
                <th>Acções</th>
              </tr>
            </thead>
            <tbody>
              {portfolios.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: C.dark }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: C.gray }}>{p.description?.slice(0, 60)}{p.description?.length > 60 ? "…" : ""}</div>
                  </td>
                  <td className="hide-mobile">{p.professional?.user?.name}</td>
                  <td className="hide-mobile">{p.category || "—"}</td>
                  <td>
                    <Pill bg={p.featured ? "#D1FAE5" : "#FEF3C7"} color={p.featured ? C.success : "#D97706"}>
                      {p.featured ? "Aprovado" : "Pendente"}
                    </Pill>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="admin-icon-btn" title="Visualizar" onClick={() => setViewItem(p)}>
                        <Icon icon={faSearch} size={13} color={C.primary} />
                      </button>
                      {!p.featured && (
                        <button className="admin-icon-btn" title="Aprovar" onClick={() => approve(p.id)}>
                          <Icon icon={faCheck} size={13} color={C.success} />
                        </button>
                      )}
                      {p.featured && (
                        <button className="admin-icon-btn" title="Rejeitar" onClick={() => reject(p.id)}>
                          <Icon icon={faBan} size={13} color="#D97706" />
                        </button>
                      )}
                      <button className="admin-icon-btn danger" title="Eliminar" onClick={() => setConfirmAction({ id: p.id, name: p.title })}>
                        <Icon icon={faTrash} size={13} color={C.error} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {portfolios.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 24, color: C.gray }}>Nenhum portfólio encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={pages} onChange={setPage} />

      {confirmAction && (
        <ConfirmModal
          text={`Eliminar permanentemente o portfólio "${confirmAction.name}"? Esta acção não pode ser desfeita.`}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => remove(confirmAction.id)}
        />
      )}

      {viewItem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setViewItem(null)}>
          <div style={{ background: C.white, borderRadius: 20, padding: 24, maxWidth: 520, width: "100%", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: C.dark }}>{viewItem.title}</h3>
              <button onClick={() => setViewItem(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon icon={faTimes} size={18} color={C.gray} /></button>
            </div>
            {viewItem.description && <p style={{ color: C.gray, fontSize: 13, marginBottom: 16 }}>{viewItem.description}</p>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {images(viewItem).map((url, i) => (
                <img key={i} src={url} alt={`img-${i}`} style={{ width: "calc(50% - 4px)", borderRadius: 10, objectFit: "cover", aspectRatio: "4/3" }} />
              ))}
              {images(viewItem).length === 0 && <p style={{ color: C.gray, fontSize: 13 }}>Sem imagens</p>}
            </div>
            {viewItem.videoUrl && (
              <div style={{ marginTop: 12 }}>
                <a href={viewItem.videoUrl} target="_blank" rel="noreferrer" style={{ color: C.primary, fontSize: 13 }}>Ver vídeo</a>
              </div>
            )}
            <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {viewItem.category && <Pill bg={`${C.primary}15`} color={C.primary}>{viewItem.category}</Pill>}
              {viewItem.price && <Pill bg={`${C.accent}15`} color={C.accent}>{viewItem.price} CVE</Pill>}
              {viewItem.estimatedDuration && <Pill bg={`${C.purple}15`} color={C.purple}>{viewItem.estimatedDuration} dias</Pill>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================


// ============================================================
// ALERTAS
// ============================================================
const AlertsPanel = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setL] = useState(true);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [confirmAction, setConfirmAction] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", level: "info" });
  const [formLoading, setFormLoading] = useState(false);

  const load = useCallback(() => {
    setL(true);
    const params = new URLSearchParams({ page, limit: 20 });
    if (filter === "active") params.set("resolved", "false");
    if (filter === "resolved") params.set("resolved", "true");
    adminFetch(`/alerts?${params}`)
      .then(d => { setAlerts(d.data); setPages(d.pages); })
      .catch(e => console.error(e))
      .finally(() => setL(false));
  }, [page, filter]);

  useEffect(() => { const t = setTimeout(() => load(), 0); return () => clearTimeout(t); }, [load]);

  const levelColors = {
    info:    { bg: "#DBEAFE", color: "#1D4ED8", label: "Info" },
    warning: { bg: "#FEF3C7", color: "#D97706", label: "Aviso" },
    error:   { bg: "#FEE2E2", color: "#DC2626", label: "Erro" },
  };

  const create = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const newAlert = await adminFetch("/alerts", { method: "POST", body: JSON.stringify(form) });
      setAlerts(prev => [newAlert, ...prev]);
      setForm({ title: "", message: "", level: "info" });
      setShowForm(false);
    } catch (err) { alert(err.message); }
    finally { setFormLoading(false); }
  };

  const resolve = async (id) => {
    try {
      const updated = await adminFetch(`/alerts/${id}/resolve`, { method: "PUT" });
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true, resolvedAt: updated.resolvedAt } : a));
    } catch (e) { alert(e.message); }
  };

  const remove = async (id) => {
    try {
      await adminFetch(`/alerts/${id}`, { method: "DELETE" });
      setAlerts(prev => prev.filter(a => a.id !== id));
      setConfirmAction(null);
    } catch (e) { alert(e.message); }
  };

  return (
    <div>
      <div className="admin-toolbar" style={{ justifyContent: "space-between" }}>
        <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }} className="admin-select">
          <option value="">Todos os alertas</option>
          <option value="active">Activos</option>
          <option value="resolved">Resolvidos</option>
        </select>
        <button onClick={() => setShowForm(v => !v)} style={{ padding: "10px 16px", background: C.accent, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
          {showForm ? "Cancelar" : "Novo Alerta"}
        </button>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 12px", color: C.dark }}>Criar Alerta</h3>
          <form onSubmit={create} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              placeholder="Título"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
              style={{ padding: "10px 12px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13 }}
            />
            <textarea
              placeholder="Mensagem"
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              required
              rows={3}
              style={{ padding: "10px 12px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, resize: "vertical" }}
            />
            <select
              value={form.level}
              onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
              style={{ padding: "10px 12px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, background: C.white }}
            >
              <option value="info">Info</option>
              <option value="warning">Aviso</option>
              <option value="error">Erro</option>
            </select>
            <button type="submit" disabled={formLoading} style={{ padding: 10, background: C.primary, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, opacity: formLoading ? 0.6 : 1 }}>
              {formLoading ? "A criar..." : "Criar Alerta"}
            </button>
          </form>
        </Card>
      )}

      {loading ? <Spinner /> : (
        <>
          {alerts.map(a => {
            const lc = levelColors[a.level] || levelColors.info;
            return (
              <Card key={a.id} style={{ marginBottom: 10, borderLeft: `4px solid ${lc.color}`, opacity: a.resolved ? 0.65 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <Pill bg={lc.bg} color={lc.color}>{lc.label}</Pill>
                      {a.resolved && <Pill bg="#D1FAE5" color={C.success}>Resolvido</Pill>}
                      <span style={{ fontWeight: 700, color: C.dark, fontSize: 14 }}>{a.title}</span>
                    </div>
                    <p style={{ margin: 0, color: C.gray, fontSize: 13, lineHeight: 1.5 }}>{a.message}</p>
                    <div style={{ fontSize: 11, color: C.gray, marginTop: 6 }}>
                      {new Date(a.createdAt).toLocaleString("pt-PT")}
                      {a.resolved && a.resolvedAt && ` · Resolvido em ${new Date(a.resolvedAt).toLocaleString("pt-PT")}`}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                    {!a.resolved && (
                      <button className="admin-icon-btn" title="Resolver" onClick={() => resolve(a.id)}>
                        <Icon icon={faCheck} size={13} color={C.success} />
                      </button>
                    )}
                    <button className="admin-icon-btn danger" title="Eliminar" onClick={() => setConfirmAction({ id: a.id, name: a.title })}>
                      <Icon icon={faTrash} size={13} color={C.error} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
          {alerts.length === 0 && <p style={{ textAlign: "center", color: C.gray, padding: 32 }}>Nenhum alerta encontrado</p>}
        </>
      )}
      <Pagination page={page} pages={pages} onChange={setPage} />
      {confirmAction && (
        <ConfirmModal
          text={`Eliminar o alerta "${confirmAction.name}"?`}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => remove(confirmAction.id)}
        />
      )}
    </div>
  );
};

// ============================================================
// AUDITORIA
// ============================================================
const AUDIT_ACTIONS = [
  "", "USER_SUSPENDED", "USER_REACTIVATED", "USER_DELETED",
  "PROJECT_CREATED_BY_ADMIN", "PROJECT_DELETED",
  "REVIEW_DELETED", "COMMENT_DELETED",
  "PORTFOLIO_APPROVED", "PORTFOLIO_REJECTED", "PORTFOLIO_DELETED",
  "ALERT_CREATED", "ALERT_RESOLVED", "ALERT_DELETED",
];

const AuditPanel = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setL] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(() => {
    setL(true);
    const params = new URLSearchParams({ page, limit: 20, ...(actionFilter ? { action: actionFilter } : {}) });
    adminFetch(`/audit?${params}`)
      .then(d => { setLogs(d.data); setPages(d.pages); })
      .catch(e => console.error(e))
      .finally(() => setL(false));
  }, [page, actionFilter]);

  useEffect(() => { const t = setTimeout(() => load(), 0); return () => clearTimeout(t); }, [load]);

  const actionLabel = (action) => action.replace(/_/g, " ");

  const actionColor = (action) => {
    if (action.includes("DELETED") || action.includes("SUSPENDED")) return { bg: "#FEE2E2", color: "#DC2626" };
    if (action.includes("APPROVED") || action.includes("REACTIVATED") || action.includes("RESOLVED")) return { bg: "#D1FAE5", color: "#059669" };
    if (action.includes("REJECTED")) return { bg: "#FEF3C7", color: "#D97706" };
    return { bg: `${C.primary}15`, color: C.primary };
  };

  return (
    <div>
      <div className="admin-toolbar">
        <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }} className="admin-select" style={{ flex: 1 }}>
          <option value="">Todas as acções</option>
          {AUDIT_ACTIONS.filter(a => a).map(a => <option key={a} value={a}>{actionLabel(a)}</option>)}
        </select>
      </div>

      {loading ? <Spinner /> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Acção</th>
                <th className="hide-mobile">Administrador</th>
                <th>Data</th>
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => {
                const ac = actionColor(l.action);
                return (
                  <tr key={l.id}>
                    <td><Pill bg={ac.bg} color={ac.color}>{actionLabel(l.action)}</Pill></td>
                    <td className="hide-mobile" style={{ color: C.dark, fontSize: 13 }}>
                      {l.user ? <span>{l.user.name}<span style={{ color: C.gray, fontSize: 11, display: "block" }}>{l.user.email}</span></span> : <span style={{ color: C.gray }}>—</span>}
                    </td>
                    <td style={{ fontSize: 12, color: C.gray, whiteSpace: "nowrap" }}>
                      {new Date(l.createdAt).toLocaleString("pt-PT")}
                    </td>
                    <td>
                      {l.details && (
                        <button
                          onClick={() => setExpandedId(expandedId === l.id ? null : l.id)}
                          style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 11, color: C.gray }}
                        >
                          {expandedId === l.id ? "ocultar" : "ver"}
                        </button>
                      )}
                      {expandedId === l.id && l.details && (
                        <pre style={{ margin: "6px 0 0", fontSize: 11, color: C.dark, background: C.lightGray, padding: "8px 10px", borderRadius: 8, overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                          {JSON.stringify(l.details, null, 2)}
                        </pre>
                      )}
                    </td>
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: 24, color: C.gray }}>Nenhum registo encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={pages} onChange={setPage} />
    </div>
  );
};

// ============================================================
// VERIFICAÇÕES DE PROFISSIONAIS
// ============================================================
const VerificationsPanel = () => {
  const [items, setItems] = useState([]);
  const [loading, setL] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setL(true);
    setError("");
    const params = new URLSearchParams({ page, limit: 15 });
    adminFetch(`/professionals/pending?${params}`)
      .then(d => {
        setItems(d.data || []);
        setPages(d.pages || 1);
      })
      .catch(e => {
        console.error(e);
        setError("Erro ao carregar dados: " + e.message);
      })
      .finally(() => setL(false));
  }, [page]);

  useEffect(() => {
    const t = setTimeout(() => load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const handleApprove = async (id) => {
    if (!window.confirm("Tem a certeza que deseja aprovar e verificar este profissional?")) return;
    try {
      await adminFetch(`/professionals/${id}/approve`, { method: "POST" });
      setItems(prev => prev.filter(item => item.id !== id));
      alert("Profissional aprovado e verificado com sucesso!");
    } catch (e) {
      alert("Erro ao aprovar: " + e.message);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Tem a certeza que deseja rejeitar este documento? O profissional será notificado e terá de submeter um novo comprovativo.")) return;
    try {
      await adminFetch(`/professionals/${id}/reject`, { method: "POST" });
      setItems(prev => prev.filter(item => item.id !== id));
      alert("Documento rejeitado. O profissional foi notificado para re-enviar.");
    } catch (e) {
      alert("Erro ao rejeitar: " + e.message);
    }
  };

  return (
    <div>
      {error && <p style={{ color: C.error, textAlign: "center", padding: 16 }}>{error}</p>}
      
      {loading ? <Spinner /> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Profissional</th>
                <th>Especialidade</th>
                <th>Documento</th>
                <th>Acções</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", color: C.gray, padding: 32 }}>
                    Nenhum profissional com verificação pendente de momento.
                  </td>
                </tr>
              ) : (
                items.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: C.dark }}>{p.user?.name}</div>
                      <div style={{ fontSize: 11, color: C.gray }}>{p.user?.email}</div>
                    </td>
                    <td>
                      <Pill bg={`${C.primary}15`} color={C.primary}>{p.specialty || "Geral"}</Pill>
                    </td>
                    <td>
                      {p.verificationDoc ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <img
                            src={p.verificationDoc}
                            alt="Documento"
                            onClick={() => setSelectedDoc(p.verificationDoc)}
                            style={{ width: 48, height: 48, borderRadius: 6, objectFit: "cover", border: `1.5px solid ${C.border}`, cursor: "pointer" }}
                          />
                          <button onClick={() => setSelectedDoc(p.verificationDoc)} style={{ background: "none", border: "none", color: C.primary, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                            Ver ampliado
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: C.error, fontSize: 12 }}>Sem documento</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => handleApprove(p.id)}
                          style={{ border: "none", background: C.success, color: "#fff", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
                        >
                          <Icon icon={faCheck} size={12} /> Aprovar
                        </button>
                        <button
                          onClick={() => handleReject(p.id)}
                          style={{ border: "none", background: C.error, color: "#fff", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
                        >
                          <Icon icon={faTimes} size={12} /> Rejeitar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <Pagination page={page} pages={pages} onChange={setPage} />
        </div>
      )}

      {selectedDoc && (
        <div
          onClick={() => setSelectedDoc(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, cursor: "pointer" }}
        >
          <div style={{ position: "relative", maxWidth: "90%", maxHeight: "90%", background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }} onClick={e => e.stopPropagation()}>
            <img src={selectedDoc} alt="Documento ampliado" style={{ maxWidth: "100%", maxHeight: "75vh", borderRadius: 8, objectFit: "contain" }} />
            <div style={{ marginTop: 12, textAlign: "right" }}>
              <button
                onClick={() => setSelectedDoc(null)}
                style={{ border: "none", background: C.dark, color: "#fff", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// PAINEL DE CATEGORIAS
// ============================================================
const CategoriesPanel = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [img, setImg] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', msg }
  const token = () => localStorage.getItem("buildmatch_token");

  const load = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/categories`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(res => res.json())
      .then(d => { setItems(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const showFeedback = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setImg(ev.target.result);
    reader.readAsDataURL(file);
  };

  const add = async () => {
    if (!name.trim()) { showFeedback("error", "O nome é obrigatório."); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ name: name.trim(), icon: icon.trim(), img })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar");
      setName(""); setIcon(""); setImg("");
      showFeedback("success", `Categoria "${data.data?.name}" criada com sucesso!`);
      load();
    } catch (e) {
      showFeedback("error", e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id, nome) => {
    if (!window.confirm(`Apagar a categoria "${nome}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/categories/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token()}` }
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      showFeedback("success", `Categoria "${nome}" apagada.`);
      load();
    } catch (e) {
      showFeedback("error", e.message);
    }
  };

  return (
    <div>
      {/* Feedback banner */}
      {feedback && (
        <div style={{
          marginBottom: 14, padding: "12px 16px", borderRadius: 10, fontWeight: 600, fontSize: 13,
          background: feedback.type === "success" ? "#D1FAE5" : "#FEE2E2",
          color: feedback.type === "success" ? "#065F46" : "#991B1B",
          border: `1px solid ${feedback.type === "success" ? "#6EE7B7" : "#FECACA"}`
        }}>
          {feedback.type === "success" ? "✅ " : "❌ "}{feedback.msg}
        </div>
      )}

      {/* Formulário de criação */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: C.dark }}>Nova Categoria</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.gray, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>Nome *</label>
            <input
              placeholder="Ex: Pedreiro, Electricista..."
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && add()}
              className="admin-search-box"
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.gray, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>Ícone FontAwesome</label>
            <input
              placeholder="Ex: faTools, faHammer..."
              value={icon}
              onChange={e => setIcon(e.target.value)}
              className="admin-search-box"
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.gray, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>Imagem (opcional)</label>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <input type="file" accept="image/*" onChange={handleImageChange} style={{ fontSize: 13 }} />
            {img && (
              <div style={{ position: "relative" }}>
                <img src={img} alt="preview" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 10, border: `2px solid ${C.border}` }} />
                <button onClick={() => setImg("")} style={{ position: "absolute", top: -6, right: -6, background: C.error, border: "none", borderRadius: "50%", width: 18, height: 18, cursor: "pointer", color: "#fff", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={add}
          disabled={saving}
          className="admin-logout-btn"
          style={{ background: saving ? C.gray : C.accent, opacity: saving ? 0.7 : 1 }}
        >
          <Icon icon={faPlus} /> {saving ? "A guardar..." : "Adicionar Categoria"}
        </button>
      </div>

      {/* Tabela de categorias */}
      <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.dark }}>Categorias existentes</h3>
          <span style={{ background: C.lightGray, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 700, color: C.gray }}>{items.length}</span>
        </div>
        {loading ? <div style={{ padding: 32, textAlign: "center" }}><Spinner /></div> : items.length === 0 ? (
          <p style={{ textAlign: "center", color: C.gray, padding: 32, margin: 0 }}>Nenhuma categoria criada ainda.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Imagem</th>
                <th>Nome</th>
                <th>Ícone</th>
                <th style={{ width: 60 }}>Acções</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td>
                    {item.img
                      ? <img src={item.img} alt={item.name} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 8, border: `1px solid ${C.border}` }} />
                      : <div style={{ width: 40, height: 40, borderRadius: 8, background: C.lightGray, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏷️</div>
                    }
                  </td>
                  <td style={{ fontWeight: 600, color: C.dark }}>{item.name}</td>
                  <td style={{ color: C.gray, fontFamily: "monospace", fontSize: 12 }}>{item.icon || "—"}</td>
                  <td>
                    <button onClick={() => remove(item.id, item.name)} className="admin-icon-btn danger" title="Apagar categoria">
                      <Icon icon={faTrash} size={13} color={C.error} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ============================================================
// PAINEL DE FAQS
// ============================================================
const FAQsPanel = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [type, setType] = useState("BOTH");

  const load = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/faqs`, { headers: { Authorization: `Bearer ${localStorage.getItem("buildmatch_token")}` } })
      .then(res => res.json())
      .then(d => { setItems(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!q || !a) return;
    await fetch(`${API_BASE}/api/faqs`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("buildmatch_token")}` },
      body: JSON.stringify({ question: q, answer: a, type })
    });
    setQ(""); setA(""); load();
  };

  const remove = async (id) => {
    if (!window.confirm("Apagar FAQ?")) return;
    await fetch(`${API_BASE}/api/faqs/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("buildmatch_token")}` } });
    load();
  };

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 20 }}>
      <h3 style={{ margin: "0 0 16px" }}>Perguntas Frequentes</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        <input placeholder="Pergunta" value={q} onChange={e => setQ(e.target.value)} className="admin-search-box" />
        <textarea placeholder="Resposta" value={a} onChange={e => setA(e.target.value)} className="admin-search-box" style={{ minHeight: 60, width: "100%" }} />
        <div style={{ display: "flex", gap: 10 }}>
          <select value={type} onChange={e => setType(e.target.value)} className="admin-select">
            <option value="CLIENT">Cliente</option>
            <option value="PROFESSIONAL">Profissional</option>
            <option value="BOTH">Ambos</option>
          </select>
          <button onClick={add} className="admin-logout-btn" style={{ background: C.accent }}><Icon icon={faPlus} /> Adicionar</button>
        </div>
      </div>
      {loading ? <Spinner /> : (
        <table className="admin-table">
          <thead><tr><th>Pergunta</th><th>Tipo</th><th>Acções</th></tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td>{item.question}</td>
                <td>{item.type}</td>
                <td><button onClick={() => remove(item.id)} className="admin-icon-btn danger"><Icon icon={faTrash} color={C.error} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

// ============================================================
// PAINEL PRINCIPAL
// ============================================================
export default function AdminDashboard({ onLogout, hideHeader, tab, initialTab }) {
  const [internalTab, setInternalTab] = useState(initialTab || TABS[0].id);
  const [prevInitialTab, setPrevInitialTab] = useState(initialTab);

  if (initialTab !== prevInitialTab && tab === undefined) {
    setPrevInitialTab(initialTab);
    setInternalTab(initialTab);
  }

  const activeTab = tab !== undefined ? tab : internalTab;

  return (
    <div className="admin-shell">
      <style>{`
        .admin-shell { font-family: 'DM Sans', sans-serif; min-height: 100vh; background: ${C.lightGray}; }
        .admin-topbar {
          background: #14142b; color: #fff; padding: 16px 20px; display: flex;
          align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 50;
          box-shadow: 0 2px 12px rgba(0,0,0,0.2);
        }
        .admin-topbar-title { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 16px; }
        .admin-logout-btn { background: rgba(255,255,255,0.1); border: none; color: #fff; padding: 8px 14px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; }
        .admin-tabs { display: flex; gap: 4px; overflow-x: auto; padding: 10px 12px; background: #1e1e3a; scrollbar-width: none; }
        .admin-tabs::-webkit-scrollbar { display: none; }
        .admin-tab-btn {
          display: flex; align-items: center; gap: 8px; white-space: nowrap; padding: 10px 16px;
          border: none; border-radius: 10px; cursor: pointer; font-size: 13px; font-weight: 600;
          background: transparent; color: rgba(255,255,255,0.65); font-family: 'DM Sans', sans-serif;
        }
        .admin-tab-btn.active { background: ${C.accent}; color: #fff; }
        .admin-body { padding: 20px 16px 60px; max-width: 100%; margin: 0 auto; }
        .admin-stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .admin-toolbar { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
        .admin-search-box {
          flex: 1; min-width: 200px; display: flex; align-items: center; gap: 8px;
          background: ${C.white}; border: 1.5px solid ${C.border}; border-radius: 10px; padding: 10px 14px;
        }
        .admin-search-box input { border: none; outline: none; flex: 1; font-size: 13px; font-family: 'DM Sans', sans-serif; background: transparent; color: ${C.dark}; }
        .admin-clear-btn { background: none; border: none; cursor: pointer; }
        .admin-select { border: 1.5px solid ${C.border}; border-radius: 10px; padding: 10px 12px; font-size: 13px; font-family: 'DM Sans', sans-serif; background: ${C.white}; color: ${C.dark}; }
        .admin-table-wrap { background: ${C.white}; border-radius: 16px; overflow-x: auto; box-shadow: 0 2px 12px rgba(0,0,0,0.07); }
        .admin-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 480px; }
        .admin-table th { text-align: left; padding: 12px 14px; color: ${C.gray}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid ${C.border}; }
        .admin-table td { padding: 12px 14px; border-bottom: 1px solid ${C.border}; vertical-align: middle; color: ${C.dark}; }
        .admin-table tr:last-child td { border-bottom: none; }
        .admin-icon-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid ${C.border}; background: ${C.white}; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
        .admin-icon-btn.danger:hover { background: #FEE2E2; }
        .show-mobile-only { display: none; }

        @media (max-width: 640px) {
          .hide-mobile { display: none; }
          .show-mobile-only { display: block; }
          .admin-body { padding: 16px 10px 60px; }
          .admin-topbar-title span.full-title { display: none; }
        }
        @media (min-width: 640px) {
          .admin-stats-grid { grid-template-columns: repeat(4, 1fr); }
        }
        @media (min-width: 1024px) {
          .admin-stats-grid { grid-template-columns: repeat(4, 1fr); gap: 14px; }
          .admin-body { padding: 28px 24px 60px; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {!hideHeader && (
        <div className="admin-topbar">
          <div className="admin-topbar-title">
            <Icon icon={faShieldAlt} size={20} color={C.accent} />
            <span className="full-title">Painel de Administração</span>
          </div>
          <button className="admin-logout-btn" onClick={onLogout}>
            <Icon icon={faSignOutAlt} size={13} /> Sair
          </button>
        </div>
      )}



      <div className="admin-body" style={{ padding: hideHeader ? "16px 12px 60px" : undefined }}>
        {activeTab === "overview" && <Overview />}
        {activeTab === "users" && <UsersPanel />}
        {activeTab === "projects" && <ProjectsPanel />}
        {activeTab === "conversations" && <ConversationsPanel />}
        {activeTab === "reviews" && <ReviewsPanel />}
        {activeTab === "portfolios" && <PortfoliosPanel />}
        {activeTab === "verifications" && <VerificationsPanel />}
        {activeTab === "alerts" && <AlertsPanel />}
        {activeTab === "audit" && <AuditPanel />}
        {activeTab === "categories" && <CategoriesPanel />}
        {activeTab === "faqs" && <FAQsPanel />}
      </div>
    </div>
  );
}
