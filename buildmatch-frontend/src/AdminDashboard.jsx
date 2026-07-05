import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers, faUser, faClipboardList,
  faStar, faMoneyBillWave, faSignOutAlt, faSearch, faTimes,
  faCheck, faBan, faTrash, faChevronLeft, faChevronRight,
  faExclamationTriangle, faShieldAlt, faEnvelopeCircleCheck,
  faGauge, faHardHat, faClock, faBell,
} from "@fortawesome/free-solid-svg-icons";

// -------------------------------------------------------------------
// Admin panel tabs configuration
// -------------------------------------------------------------------
const TABS = [
  { id: "overview", label: "Visão geral", icon: faGauge },
  { id: "users", label: "Utilizadores", icon: faUsers },
  { id: "projects", label: "Projectos", icon: faClipboardList },
  { id: "reviews", label: "Avaliações", icon: faStar },
  { id: "portfolios", label: "Portfolios", icon: faHardHat },
  { id: "comments", label: "Comentários", icon: faEnvelopeCircleCheck },
  { id: "lowRatings", label: "Baixas Avaliações", icon: faExclamationTriangle },
  { id: "alerts", label: "Alertas", icon: faBell },
  { id: "audit", label: "Auditoria", icon: faShieldAlt },
];

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

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

// ── Paleta partilhada com o resto da app ────────────────────────────────


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

  const load = useCallback(() => {
    setL(true);
    const params = new URLSearchParams({ page, limit: 15, ...(status ? { status } : {}) });
    adminFetch(`/projects?${params}`).then(d => { setProjects(d.data); setPages(d.pages); }).finally(() => setL(false));
  }, [page, status]);

  useEffect(() => {
    const t = setTimeout(() => load(), 0);
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
// AVALIAÇÕES (moderação)
// ============================================================
const ReviewsPanel = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setL] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [confirmAction, setConfirmAction] = useState(null);

  const load = useCallback(() => {
    setL(true);
    adminFetch(`/reviews?page=${page}&limit=15`).then(d => { setReviews(d.data); setPages(d.pages); }).finally(() => setL(false));
  }, [page]);

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

  if (loading) return <Spinner />;

  return (
    <div>
      {reviews.map(r => (
        <Card key={r.id} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 700, color: C.dark, fontSize: 14 }}>{r.author?.name}</div>
              <div style={{ color: C.gray, fontSize: 12 }}>avaliou {r.professional?.user?.name} ({r.professional?.specialty})</div>
            </div>
            <button className="admin-icon-btn danger" onClick={() => setConfirmAction({ id: r.id })}>
              <Icon icon={faTrash} size={13} color={C.error} />
            </button>
          </div>
          <div style={{ marginTop: 8 }}>
            {[1, 2, 3, 4, 5].map(i => <Icon key={i} icon={faStar} size={13} color={i <= r.rating ? "#F59E0B" : C.border} />)}
          </div>
          <p style={{ color: C.gray, fontSize: 13, lineHeight: 1.6, margin: "8px 0 0", background: C.lightGray, padding: "10px 12px", borderRadius: 10 }}>{r.comment}</p>
        </Card>
      ))}
      {reviews.length === 0 && <p style={{ textAlign: "center", color: C.gray, padding: 32 }}>Nenhuma avaliação encontrada</p>}
      <Pagination page={page} pages={pages} onChange={setPage} />
      {confirmAction && (
        <ConfirmModal text="Eliminar esta avaliação? A média do profissional será recalculada." onCancel={() => setConfirmAction(null)} onConfirm={() => remove(confirmAction.id)} />
      )}
    </div>
  );
};

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

// ---------------------------------------------------------------
// PLACE‑HOLDERS DOS NOVOS PAINÉIS (a substituir por código real)
// ---------------------------------------------------------------
const PortfoliosPanel = () => (
  <div>
    <p style={{ color: C.gray, textAlign: "center", padding: 32 }}>
      Gestão de Portfolios (a implementar)
    </p>
  </div>
);

const CommentsPanel = () => (
  <div>
    <p style={{ color: C.gray, textAlign: "center", padding: 32 }}>
      Moderação de Comentários (a implementar)
    </p>
  </div>
);

const LowRatingsPanel = () => (
  <div>
    <p style={{ color: C.gray, textAlign: "center", padding: 32 }}>
      Profissionais com baixa classificação (a implementar)
    </p>
  </div>
);

const AlertsPanel = () => (
  <div>
    <p style={{ color: C.gray, textAlign: "center", padding: 32 }}>
      Alertas do sistema (a implementar)
    </p>
  </div>
);

const AuditPanel = () => (
  <div>
    <p style={{ color: C.gray, textAlign: "center", padding: 32 }}>
      Registo de auditoria (a implementar)
    </p>
  </div>
);
// ============================================================
// PAINEL PRINCIPAL
// ============================================================

const initialTab = TABS[0].id;
const [tab, setTab] = useState(initialTab);

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

    {!hideHeader && (
      <div className="admin-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`admin-tab-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            <Icon icon={t.icon} size={14} /> {t.label}
          </button>
        ))}
      </div>
    )}

    <div className="admin-body" style={{ padding: hideHeader ? "16px 12px 60px" : undefined }}>
      {tab === "overview" && <Overview />}
      {tab === "users" && <UsersPanel />}
      {tab === "projects" && <ProjectsPanel />}
      {tab === "reviews" && <ReviewsPanel />}
      {tab === "portfolios" && <PortfoliosPanel />}
      {tab === "comments" && <CommentsPanel />}
      {tab === "lowRatings" && <LowRatingsPanel />}
      {tab === "alerts" && <AlertsPanel />}
      {tab === "audit" && <AuditPanel />}
    </div>
  </div>
);
