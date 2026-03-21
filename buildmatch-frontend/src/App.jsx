import { useState, useEffect, useRef } from "react";
import { authAPI, professionalsAPI, projectsAPI, messagesAPI, schedulesAPI } from "./services/api";

// ============================================================
// PALETA OFICIAL BuildMatch
// ============================================================
const C = {
  primary:     "#1F4E8C",
  primaryDark: "#163a6b",
  accent:      "#F57C00",
  dark:        "#2E2E2E",
  gray:        "#6B7280",
  lightGray:   "#F5F5F5",
  white:       "#FFFFFF",
  success:     "#22C55E",
  error:       "#EF4444",
  border:      "#E5E7EB",
  purple:      "#7C3AED",
};

const CATEGORIES = [
  { icon: "🧱", name: "Pedreiro"    },
  { icon: "⚡", name: "Eletricista" },
  { icon: "🔧", name: "Canalizador" },
  { icon: "🎨", name: "Pintor"      },
  { icon: "🪵", name: "Carpinteiro" },
  { icon: "🏗️", name: "Engenheiro"  },
];

// ============================================================
// COMPONENTES BASE
// ============================================================
const Avatar = ({ name = "", color, size = 40 }) => {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "U";
  const colors   = [C.primary, C.accent, C.primaryDark, "#c96800", C.purple];
  const bg       = color || colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.35, flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>
      {initials}
    </div>
  );
};

const Stars = ({ rating = 0, size = 14 }) => (
  <span>{[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= Math.floor(rating) ? "#F59E0B" : "#D1D5DB", fontSize: size }}>★</span>)}</span>
);

const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{ background: C.white, borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", padding: 20, cursor: onClick ? "pointer" : "default", ...style }}>
    {children}
  </div>
);

const Btn = ({ children, onClick, variant = "primary", small, full, disabled, style: ex }) => {
  const v = {
    primary: { background: disabled ? "#9CA3AF" : C.primary, color: "#fff", border: "none" },
    accent:  { background: disabled ? "#9CA3AF" : C.accent,  color: "#fff", border: "none" },
    outline: { background: "transparent", color: C.primary,  border: `2px solid ${C.primary}` },
    ghost:   { background: "transparent", color: C.gray,     border: `1px solid ${C.border}` },
    danger:  { background: C.error,  color: "#fff", border: "none" },
    success: { background: C.success, color: "#fff", border: "none" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...v[variant], padding: small ? "8px 16px" : "12px 22px", borderRadius: 10, cursor: disabled ? "not-allowed" : "pointer", fontWeight: 600, fontSize: small ? 13 : 14, fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 6, justifyContent: "center", width: full ? "100%" : "auto", transition: "all 0.2s", whiteSpace: "nowrap", ...ex }}>
      {children}
    </button>
  );
};

const Input = ({ label, value, onChange, type = "text", placeholder }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ fontSize: 13, fontWeight: 600, color: C.dark, display: "block", marginBottom: 6 }}>{label}</label>}
    <input value={value} onChange={onChange} type={type} placeholder={placeholder}
      style={{ width: "100%", padding: "12px 14px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", outline: "none" }} />
  </div>
);

const Spinner = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
    <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.primary}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const ErrMsg = ({ msg }) => msg ? <div style={{ background: "#FEE2E2", color: C.error, padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 12 }}>{msg}</div> : null;

const SuccessModal = ({ message, onClose }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
    <div style={{ background: C.white, borderRadius: 24, padding: 32, textAlign: "center", maxWidth: 320, width: "90%" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
      <h3 style={{ color: C.dark, fontWeight: 800, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>Sucesso!</h3>
      <p style={{ color: C.gray, fontSize: 14, lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif", marginBottom: 20 }}>{message}</p>
      <Btn onClick={onClose} variant="primary" full>Fechar</Btn>
    </div>
  </div>
);

const StatCard = ({ icon, label, value, color = C.primary }) => (
  <Card style={{ padding: 16, textAlign: "center" }}>
    <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
    <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
    <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>{label}</div>
  </Card>
);

const StatusBadge = ({ status }) => {
  const map = {
    COMPLETED: { bg: "#D1FAE5", color: "#059669", label: "✓ Concluído"    },
    ACTIVE:    { bg: "#DBEAFE", color: "#1D4ED8", label: "⟳ Em andamento" },
    PENDING:   { bg: "#FEF3C7", color: "#D97706", label: "◷ Pendente"     },
    CANCELLED: { bg: "#FEE2E2", color: "#DC2626", label: "✕ Cancelado"    },
  };
  const s = map[status] || { bg: "#F3F4F6", color: C.gray, label: status };
  return <span style={{ background: s.bg, color: s.color, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{s.label}</span>;
};

// ============================================================
// ONBOARDING
// ============================================================
const Onboarding = ({ onFinish }) => {
  const [step, setStep] = useState(0);
  const slides = [
    { icon: "🔍", title: "Encontre Profissionais Confiáveis", desc: "Aceda a uma rede de profissionais qualificados e verificados da construção civil em Cabo Verde.", bg: C.primary },
    { icon: "⭐", title: "Avaliações Reais e Verificadas",   desc: "Tome decisões informadas com avaliações autênticas de outros clientes.",                   bg: "#163a6b" },
    { icon: "📅", title: "Agende com Facilidade",            desc: "Comunique, negoceie e agende serviços directamente pela plataforma.",                       bg: C.accent  },
  ];
  const s = slides[step];
  return (
    <div style={{ minHeight: "100vh", background: s.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, transition: "background 0.5s", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <div style={{ fontSize: 80, marginBottom: 32 }}>{s.icon}</div>
        <h2 style={{ color: "#fff", fontSize: 28, fontWeight: 800, marginBottom: 16, lineHeight: 1.2 }}>{s.title}</h2>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, lineHeight: 1.6, marginBottom: 48 }}>{s.desc}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 40 }}>
          {slides.map((_, i) => <div key={i} onClick={() => setStep(i)} style={{ width: i === step ? 28 : 8, height: 8, borderRadius: 4, background: i === step ? "#fff" : "rgba(255,255,255,0.4)", cursor: "pointer", transition: "all 0.3s" }} />)}
        </div>
        {step < slides.length - 1
          ? <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={onFinish} style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "none", padding: "14px 28px", borderRadius: 12, cursor: "pointer", fontSize: 15, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Saltar</button>
              <button onClick={() => setStep(step + 1)} style={{ background: "#fff", color: s.bg, border: "none", padding: "14px 28px", borderRadius: 12, cursor: "pointer", fontSize: 15, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>Próximo →</button>
            </div>
          : <button onClick={onFinish} style={{ background: "#fff", color: s.bg, border: "none", padding: "16px 48px", borderRadius: 14, cursor: "pointer", fontSize: 16, fontWeight: 800, fontFamily: "'DM Sans', sans-serif" }}>Começar agora 🚀</button>
        }
      </div>
    </div>
  );
};

// ============================================================
// LOGIN / REGISTO
// ============================================================
const Login = ({ onLogin }) => {
  const [mode, setMode]       = useState("login");
  const [type, setType]       = useState("CLIENT");
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [pass, setPass]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const submit = async () => {
    setError("");
    if (!email || !pass) { setError("Email e password são obrigatórios"); return; }
    if (mode === "register" && !name) { setError("Nome é obrigatório"); return; }
    setLoading(true);
    try {
      const data = mode === "login"
        ? await authAPI.login({ email, password: pass })
        : await authAPI.register({ name, email, password: pass, type });
      localStorage.setItem("buildmatch_token", data.token);
      localStorage.setItem("buildmatch_user",  JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.lightGray, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ background: C.primary, width: 64, height: 64, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 28 }}>🏗️</div>
          <span style={{ fontSize: 26, fontWeight: 800 }}>
            <span style={{ color: C.primary }}>Build</span><span style={{ color: C.accent }}>Match</span>
          </span>
        </div>
        <Card>
          <div style={{ display: "flex", background: C.lightGray, borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {["login","register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }} style={{ flex: 1, padding: "10px", border: "none", borderRadius: 8, background: mode === m ? C.white : "transparent", color: mode === m ? C.primary : C.gray, fontWeight: mode === m ? 700 : 500, cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
                {m === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          {mode === "register" && (
            <>
              <p style={{ fontSize: 13, color: C.gray, marginBottom: 10, fontWeight: 600 }}>Sou um:</p>
              <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                {[["CLIENT","👤 Cliente"],["PROFESSIONAL","🔨 Profissional"]].map(([t, l]) => (
                  <button key={t} onClick={() => setType(t)} style={{ flex: 1, padding: "14px 8px", border: `2px solid ${type === t ? C.primary : C.border}`, borderRadius: 12, background: type === t ? `${C.primary}10` : C.white, color: type === t ? C.primary : C.gray, fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s" }}>
                    {l}
                  </button>
                ))}
              </div>
              <Input label="Nome completo" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome completo" />
            </>
          )}

          <ErrMsg msg={error} />
          <Input label="Email"          value={email} onChange={e => setEmail(e.target.value)} type="email"    placeholder="seu@email.com" />
          <Input label="Palavra-passe"  value={pass}  onChange={e => setPass(e.target.value)}  type="password" placeholder="••••••••" />
          <Btn onClick={submit} full disabled={loading}>
            {loading ? "A processar..." : mode === "login" ? "Entrar na conta" : "Criar conta"}
          </Btn>
        </Card>
      </div>
    </div>
  );
};

// ============================================================
// ██  PAINEL DO CLIENTE  ██
// ============================================================
const ClientNav = ({ active, onChange }) => (
  <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.white, borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 100, padding: "8px 0 4px", boxShadow: "0 -4px 20px rgba(0,0,0,0.08)" }}>
    {[["home","🏠","Início"],["search","🔍","Buscar"],["projects","📋","Projectos"],["messages","💬","Chat"],["profile","👤","Perfil"]].map(([id, icon, label]) => (
      <button key={id} onClick={() => onChange(id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", color: active === id ? C.primary : C.gray }}>{label}</span>
        {active === id && <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.primary }} />}
      </button>
    ))}
  </div>
);

const ProfCard = ({ prof, onClick }) => {
  const name = prof.user?.name || "Profissional";
  return (
    <Card style={{ padding: 16, marginBottom: 12 }} onClick={onClick}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ position: "relative" }}>
          <Avatar name={name} size={52} />
          {prof.available && <div style={{ position: "absolute", bottom: 2, right: 2, width: 12, height: 12, background: C.success, borderRadius: "50%", border: "2px solid white" }} />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 700, color: C.dark, fontSize: 15 }}>{name} {prof.verified && <span style={{ color: C.primary, fontSize: 12 }}>✓</span>}</div>
              <div style={{ color: C.gray, fontSize: 13 }}>{prof.specialty}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              {prof.priceMin && <div style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>{prof.priceMin}–{prof.priceMax} CVE/h</div>}
              <div style={{ fontSize: 11, color: prof.available ? C.success : C.error, fontWeight: 600 }}>{prof.available ? "Disponível" : "Ocupado"}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <Stars rating={prof.rating} />
            <span style={{ fontSize: 12, fontWeight: 700 }}>{prof.rating?.toFixed(1)}</span>
            <span style={{ fontSize: 12, color: C.gray }}>({prof.reviewCount})</span>
            {prof.location && <span style={{ fontSize: 12, color: C.gray }}>• {prof.location}</span>}
          </div>
        </div>
      </div>
    </Card>
  );
};

const ClientHome = ({ user, onProfSelect, onSearch }) => {
  const [profs, setProfs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ]             = useState("");

  useEffect(() => {
    professionalsAPI.list({ limit: 4, sortBy: "rating" })
      .then(d => setProfs(d.data || [])).catch(() => setProfs([])).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`, padding: "28px 20px 40px", borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginBottom: 2 }}>Bem-vindo 👋</p>
            <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: 0 }}>{user?.name}</h2>
          </div>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "6px 12px" }}>
            <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>👤 Cliente</span>
          </div>
        </div>
        <div style={{ background: C.white, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
          <span style={{ fontSize: 18 }}>🔍</span>
          <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && onSearch(q)}
            placeholder="Que serviço precisa?" style={{ background: C.white, border: "none", outline: "none", flex: 1, fontSize: 15, fontFamily: "'DM Sans', sans-serif" }} />
          {q && <button onClick={() => onSearch(q)} style={{ background: C.accent, color: "#fff", border: "none", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Buscar</button>}
        </div>
      </div>
      <div style={{ padding: "20px 16px" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.dark, marginBottom: 14 }}>Categorias</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
          {CATEGORIES.map((cat, i) => (
            <div key={i} onClick={() => onSearch(cat.name)} style={{ background: C.white, borderRadius: 14, padding: "14px 10px", textAlign: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 26, marginBottom: 6 }}>{cat.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.dark }}>{cat.name}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.dark, margin: 0 }}>Recomendados</h3>
          <span onClick={() => onSearch("")} style={{ color: C.primary, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Ver todos</span>
        </div>
        {loading ? <Spinner /> : profs.map(prof => <ProfCard key={prof.id} prof={prof} onClick={() => onProfSelect(prof)} />)}
      </div>
    </div>
  );
};

const ClientSearch = ({ query: initQ, onProfSelect }) => {
  const [q, setQ]           = useState(initQ || "");
  const [profs, setProfs]   = useState([]);
  const [loading, setL]     = useState(false);
  const [sortBy, setSortBy] = useState("rating");
  const [priceMax, setPriceMax] = useState("");

  const search = async (query, sort) => {
    setL(true);
    try {
      const data = query ? await professionalsAPI.search(query) : await professionalsAPI.list({ sortBy: sort || sortBy, limit: 20 });
      let results = data.data || [];
      if (priceMax) results = results.filter(p => !p.priceMin || p.priceMin <= parseInt(priceMax));
      setProfs(results);
    } catch { setProfs([]); } finally { setL(false); }
  };

  useEffect(() => { search(initQ); }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: C.primary, padding: "20px 16px 24px", borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <div style={{ background: C.white, borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <span>🔍</span>
          <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && search(q)}
            placeholder="Pesquisar profissionais..." style={{ border: "none", outline: "none", flex: 1, fontSize: 14, fontFamily: "'DM Sans', sans-serif" }} />
          <button onClick={() => search(q)} style={{ background: C.accent, color: "#fff", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Buscar</button>
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <Card style={{ padding: 14, marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.dark, margin: "0 0 10px" }}>🎛️ Filtros</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ fontSize: 12, color: C.gray, display: "block", marginBottom: 4 }}>Ordenar por</label>
              <select value={sortBy} onChange={e => { setSortBy(e.target.value); search(q, e.target.value); }}
                style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none" }}>
                <option value="rating">⭐ Avaliação</option>
                <option value="experience">🏆 Experiência</option>
                <option value="reviewCount">💬 Mais avaliados</option>
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ fontSize: 12, color: C.gray, display: "block", marginBottom: 4 }}>Preço máx. (CVE/h)</label>
              <input value={priceMax} onChange={e => setPriceMax(e.target.value)} placeholder="Ex: 800"
                style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
          <button onClick={() => search(q)} style={{ marginTop: 10, background: C.primary, color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Aplicar filtros</button>
        </Card>
        <p style={{ color: C.gray, fontSize: 13, marginBottom: 12 }}>{profs.length} profissionais encontrados</p>
        {loading ? <Spinner /> : profs.length === 0
          ? <div style={{ textAlign: "center", padding: 48, color: C.gray }}><div style={{ fontSize: 48 }}>🔍</div><p>Nenhum profissional encontrado</p></div>
          : profs.map(prof => <ProfCard key={prof.id} prof={prof} onClick={() => onProfSelect(prof)} />)
        }
      </div>
    </div>
  );
};

const ClientProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setL]         = useState(true);
  const [tab, setTab]           = useState("all");

  useEffect(() => {
    projectsAPI.list().then(d => setProjects(d.data || [])).catch(() => setProjects([])).finally(() => setL(false));
  }, []);

  const filtered = tab === "all" ? projects : projects.filter(p =>
    tab === "active" ? p.status === "ACTIVE" : tab === "done" ? p.status === "COMPLETED" : p.status === "PENDING"
  );

  return (
    <div style={{ padding: "20px 16px", fontFamily: "'DM Sans', sans-serif" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: C.dark, marginBottom: 16 }}>📋 Meus Projectos</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        <StatCard icon="📁" label="Total"      value={projects.length}                                color={C.primary} />
        <StatCard icon="⟳"  label="Activos"    value={projects.filter(p=>p.status==="ACTIVE").length}    color={C.accent}  />
        <StatCard icon="✓"  label="Concluídos" value={projects.filter(p=>p.status==="COMPLETED").length} color={C.success} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", scrollbarWidth: "none" }}>
        {[["all","Todos"],["active","Activos"],["done","Concluídos"],["pending","Pendentes"]].map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)} style={{ padding: "8px 16px", border: "none", borderRadius: 20, cursor: "pointer", background: tab === v ? C.primary : C.white, color: tab === v ? "#fff" : C.gray, fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>{l}</button>
        ))}
      </div>
      {loading ? <Spinner /> : filtered.length === 0
        ? <div style={{ textAlign: "center", padding: 48, color: C.gray }}><div style={{ fontSize: 48 }}>📋</div><p>Sem projectos ainda</p></div>
        : filtered.map(proj => (
          <Card key={proj.id} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: C.dark }}>{proj.title}</div>
                <div style={{ color: C.gray, fontSize: 13 }}>{proj.professional?.user?.name}</div>
              </div>
              <StatusBadge status={proj.status} />
            </div>
            <div style={{ display: "flex", gap: 16, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
              {proj.startDate && <div><div style={{ fontSize: 10, color: C.gray }}>DATA</div><div style={{ fontSize: 13, fontWeight: 600 }}>{new Date(proj.startDate).toLocaleDateString("pt")}</div></div>}
              {proj.amount    && <div><div style={{ fontSize: 10, color: C.gray }}>VALOR</div><div style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>{proj.amount.toLocaleString()} CVE</div></div>}
            </div>
          </Card>
        ))
      }
    </div>
  );
};

const ClientMessages = ({ onOpenChat }) => {
  const [convs, setConvs] = useState([]);
  const [loading, setL]   = useState(true);

  useEffect(() => {
    messagesAPI.conversations().then(d => setConvs(d.data || [])).catch(() => setConvs([])).finally(() => setL(false));
  }, []);

  return (
    <div style={{ padding: "20px 16px", fontFamily: "'DM Sans', sans-serif" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: C.dark, marginBottom: 20 }}>💬 Mensagens</h2>
      {loading ? <Spinner /> : convs.length === 0
        ? <div style={{ textAlign: "center", padding: 48, color: C.gray }}><div style={{ fontSize: 48 }}>💬</div><p>Sem mensagens ainda</p></div>
        : convs.map(conv => {
          const last = conv.messages?.[0];
          const name = conv.professional?.user?.name || "Profissional";
          return (
            <div key={conv.id} onClick={() => onOpenChat(conv)} style={{ background: C.white, borderRadius: 14, padding: "14px 16px", display: "flex", gap: 12, alignItems: "center", cursor: "pointer", marginBottom: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: `1px solid ${C.border}` }}>
              <Avatar name={name} size={50} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 700, color: C.dark, fontSize: 14 }}>{name}</span>
                  {last && <span style={{ fontSize: 12, color: C.gray }}>{new Date(last.createdAt).toLocaleDateString("pt")}</span>}
                </div>
                <div style={{ color: C.gray, fontSize: 13, marginTop: 3 }}>{last?.content || conv.title}</div>
              </div>
            </div>
          );
        })
      }
    </div>
  );
};

const ClientProfile = ({ user, onLogout }) => (
  <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
    <div style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`, padding: "28px 16px 50px", textAlign: "center" }}>
      <Avatar name={user?.name} color={C.accent} size={80} />
      <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 800, marginTop: 12, marginBottom: 4 }}>{user?.name}</h2>
      <div style={{ background: "rgba(255,255,255,0.2)", display: "inline-block", padding: "4px 16px", borderRadius: 20, marginTop: 4 }}>
        <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>👤 Cliente</span>
      </div>
    </div>
    <div style={{ padding: "0 16px", marginTop: -24 }}>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: C.gray, marginBottom: 4 }}>Email</div>
        <div style={{ fontWeight: 600, color: C.dark }}>{user?.email}</div>
      </Card>
      {[["✏️","Editar perfil"],["📍","Endereços guardados"],["⭐","Minhas avaliações"],["🔔","Notificações"],["🔒","Segurança"],["❓","Ajuda"]].map(([icon, label], i) => (
        <div key={i} style={{ background: C.white, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", marginBottom: 6, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <span style={{ flex: 1, fontWeight: 500, color: C.dark, fontSize: 14 }}>{label}</span>
          <span style={{ color: C.gray }}>›</span>
        </div>
      ))}
      <div style={{ marginTop: 16, marginBottom: 32 }}><Btn onClick={onLogout} full variant="danger">Terminar sessão</Btn></div>
    </div>
  </div>
);

// ============================================================
// ██  PAINEL DO PROFISSIONAL  ██
// ============================================================
const ProfNav = ({ active, onChange }) => (
  <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#1a1a2e", borderTop: `2px solid ${C.accent}`, display: "flex", zIndex: 100, padding: "8px 0 4px" }}>
    {[["dashboard","📊","Dashboard"],["projects","📋","Projectos"],["agenda","📅","Agenda"],["portfolio","🖼️","Portfólio"],["profile","👷","Perfil"]].map(([id, icon, label]) => (
      <button key={id} onClick={() => onChange(id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", color: active === id ? C.accent : "#9CA3AF" }}>{label}</span>
        {active === id && <div style={{ width: 20, height: 3, borderRadius: 2, background: C.accent }} />}
      </button>
    ))}
  </div>
);

const ProfDashboard = ({ user }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setL]         = useState(true);

  useEffect(() => {
    projectsAPI.list().then(d => setProjects(d.data || [])).catch(() => setProjects([])).finally(() => setL(false));
  }, []);

  const completed = projects.filter(p => p.status === "COMPLETED").length;
  const active    = projects.filter(p => p.status === "ACTIVE").length;
  const pending   = projects.filter(p => p.status === "PENDING").length;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", padding: "28px 20px 32px", borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 2 }}>Painel do Profissional</p>
            <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: 0 }}>{user?.name}</h2>
          </div>
          <div style={{ background: C.accent, borderRadius: 12, padding: "6px 12px" }}>
            <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>🔨 PRO</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[[active, "Activos", "⟳", C.accent],[completed, "Concluídos", "✓", C.success],[pending, "Pendentes", "◷", "#F59E0B"]].map(([v, l, icon, color], i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 20 }}>{icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color, marginTop: 4 }}>{v}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: "20px 16px" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.dark, marginBottom: 14 }}>Projectos recentes</h3>
        {loading ? <Spinner /> : projects.length === 0
          ? <div style={{ textAlign: "center", padding: 32, color: C.gray }}><p>Sem projectos ainda</p></div>
          : projects.slice(0, 3).map(proj => (
            <Card key={proj.id} style={{ marginBottom: 12, borderLeft: `4px solid ${C.accent}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>{proj.title}</div>
                  <div style={{ color: C.gray, fontSize: 13, marginTop: 2 }}>👤 {proj.client?.name}</div>
                </div>
                <StatusBadge status={proj.status} />
              </div>
              {proj.amount && <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700, color: C.accent }}>{proj.amount.toLocaleString()} CVE</div>}
            </Card>
          ))
        }
        <div style={{ background: `${C.primary}10`, borderRadius: 14, padding: 16, marginTop: 8, border: `1px solid ${C.primary}30` }}>
          <p style={{ margin: 0, fontSize: 13, color: C.primary, fontWeight: 600 }}>💡 Dica</p>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: C.gray, lineHeight: 1.5 }}>Actualize o seu portfólio regularmente para atrair mais clientes.</p>
        </div>
      </div>
    </div>
  );
};

const ProfProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setL]         = useState(true);
  const [tab, setTab]           = useState("all");

  useEffect(() => {
    projectsAPI.list().then(d => setProjects(d.data || [])).catch(() => setProjects([])).finally(() => setL(false));
  }, []);

  const filtered = tab === "all" ? projects : projects.filter(p =>
    tab === "active" ? p.status === "ACTIVE" : tab === "done" ? p.status === "COMPLETED" : p.status === "PENDING"
  );

  const accept   = async (id) => { try { await projectsAPI.update(id, { status: "ACTIVE"     }); setProjects(p => p.map(proj => proj.id === id ? { ...proj, status: "ACTIVE"     } : proj)); } catch {} };
  const complete = async (id) => { try { await projectsAPI.update(id, { status: "COMPLETED" }); setProjects(p => p.map(proj => proj.id === id ? { ...proj, status: "COMPLETED" } : proj)); } catch {} };

  return (
    <div style={{ padding: "20px 16px", fontFamily: "'DM Sans', sans-serif" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: C.dark, marginBottom: 16 }}>📋 Projectos Recebidos</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", scrollbarWidth: "none" }}>
        {[["all","Todos"],["active","Activos"],["done","Concluídos"],["pending","Pendentes"]].map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)} style={{ padding: "8px 16px", border: "none", borderRadius: 20, cursor: "pointer", background: tab === v ? C.accent : C.white, color: tab === v ? "#fff" : C.gray, fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>{l}</button>
        ))}
      </div>
      {loading ? <Spinner /> : filtered.length === 0
        ? <div style={{ textAlign: "center", padding: 48, color: C.gray }}><div style={{ fontSize: 48 }}>📋</div><p>Sem projectos</p></div>
        : filtered.map(proj => (
          <Card key={proj.id} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: C.dark }}>{proj.title}</div>
                <div style={{ color: C.gray, fontSize: 13 }}>👤 {proj.client?.name}</div>
              </div>
              <StatusBadge status={proj.status} />
            </div>
            {proj.description && <p style={{ color: C.gray, fontSize: 13, margin: "8px 0", lineHeight: 1.5 }}>{proj.description}</p>}
            <div style={{ display: "flex", gap: 12, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
              {proj.amount  && <div><div style={{ fontSize: 10, color: C.gray }}>VALOR</div><div style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>{proj.amount.toLocaleString()} CVE</div></div>}
              {proj.address && <div><div style={{ fontSize: 10, color: C.gray }}>LOCAL</div><div style={{ fontSize: 13 }}>{proj.address}</div></div>}
            </div>
            {proj.status === "PENDING" && (
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Btn onClick={() => accept(proj.id)}   variant="success" small full>✓ Aceitar</Btn>
                <Btn onClick={() => complete(proj.id)} variant="ghost"   small full>✕ Recusar</Btn>
              </div>
            )}
            {proj.status === "ACTIVE" && (
              <Btn onClick={() => complete(proj.id)} variant="accent" small full style={{ marginTop: 12 }}>✓ Marcar como concluído</Btn>
            )}
          </Card>
        ))
      }
    </div>
  );
};

const ProfAgenda = ({ user }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setL]           = useState(true);
  const [date, setDate]           = useState("");
  const [start, setStart]         = useState("09:00");
  const [end, setEnd]             = useState("17:00");
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    if (!user?.professional?.id) { setL(false); return; }
    schedulesAPI.list(user.professional.id).then(d => setSchedules(d.data || [])).catch(() => setSchedules([])).finally(() => setL(false));
  }, []);

  const addSlot = async () => {
    if (!date || !user?.professional?.id) return;
    setSaving(true);
    try {
      const s = await schedulesAPI.create({ professionalId: user.professional.id, date, startTime: start, endTime: end });
      setSchedules(prev => [...prev, s]); setDate("");
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  return (
    <div style={{ padding: "20px 16px", fontFamily: "'DM Sans', sans-serif" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: C.dark, marginBottom: 16 }}>📅 Minha Agenda</h2>
      <Card style={{ marginBottom: 16, borderTop: `4px solid ${C.accent}` }}>
        <h4 style={{ margin: "0 0 14px", color: C.dark }}>Adicionar disponibilidade</h4>
        <Input label="Data" value={date} onChange={e => setDate(e.target.value)} type="date" />
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}><Input label="Início" value={start} onChange={e => setStart(e.target.value)} type="time" /></div>
          <div style={{ flex: 1 }}><Input label="Fim"    value={end}   onChange={e => setEnd(e.target.value)}   type="time" /></div>
        </div>
        <Btn onClick={addSlot} variant="accent" full disabled={saving || !date}>{saving ? "A guardar..." : "➕ Adicionar horário"}</Btn>
      </Card>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: C.dark, marginBottom: 12 }}>Horários adicionados</h3>
      {loading ? <Spinner /> : schedules.length === 0
        ? <div style={{ textAlign: "center", padding: 32, color: C.gray }}><div style={{ fontSize: 48 }}>📅</div><p>Nenhum horário adicionado</p></div>
        : schedules.map((s, i) => (
          <Card key={i} style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", padding: 14 }}>
            <div>
              <div style={{ fontWeight: 700, color: C.dark }}>{new Date(s.date).toLocaleDateString("pt", { weekday: "long", day: "numeric", month: "long" })}</div>
              <div style={{ color: C.gray, fontSize: 13, marginTop: 2 }}>⏰ {s.startTime} — {s.endTime}</div>
            </div>
            <span style={{ background: s.available ? "#D1FAE5" : "#FEE2E2", color: s.available ? "#059669" : C.error, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
              {s.available ? "Livre" : "Ocupado"}
            </span>
          </Card>
        ))
      }
    </div>
  );
};

const ProfPortfolio = ({ user }) => {
  const [items, setItems]       = useState([]);
  const [loading, setL]         = useState(true);
  const [title, setTitle]       = useState("");
  const [desc, setDesc]         = useState("");
  const [cat, setCat]           = useState("");
  const [saving, setSaving]     = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!user?.professional?.id) { setL(false); return; }
    import("./services/api").then(({ portfolioAPI }) =>
      portfolioAPI.list(user.professional.id)
        .then(d => setItems(d.data || [])).catch(() => setItems([])).finally(() => setL(false))
    );
  }, []);

  const add = async () => {
    if (!title || !user?.professional?.id) return;
    setSaving(true);
    try {
      const { portfolioAPI } = await import("./services/api");
      const item = await portfolioAPI.create({ professionalId: user.professional.id, title, description: desc, category: cat, imageUrls: "" });
      setItems(prev => [item, ...prev]); setTitle(""); setDesc(""); setCat(""); setShowForm(false);
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  return (
    <div style={{ padding: "20px 16px", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.dark, margin: 0 }}>🖼️ Portfólio</h2>
        <Btn onClick={() => setShowForm(!showForm)} variant="accent" small>{showForm ? "Cancelar" : "➕ Adicionar"}</Btn>
      </div>
      {showForm && (
        <Card style={{ marginBottom: 16, borderTop: `4px solid ${C.accent}` }}>
          <Input label="Título do projecto" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Moradia T3 em Assomada" />
          <Input label="Categoria"          value={cat}   onChange={e => setCat(e.target.value)}   placeholder="Ex: Residencial, Comercial..." />
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.dark, display: "block", marginBottom: 6 }}>Descrição</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descreva o projecto realizado..."
              style={{ width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 10, padding: 12, fontSize: 14, fontFamily: "'DM Sans', sans-serif", resize: "vertical", minHeight: 80, outline: "none", boxSizing: "border-box" }} />
          </div>
          <Btn onClick={add} variant="accent" full disabled={saving || !title}>{saving ? "A guardar..." : "Guardar projecto"}</Btn>
        </Card>
      )}
      {loading ? <Spinner /> : items.length === 0
        ? <div style={{ textAlign: "center", padding: 48, color: C.gray }}><div style={{ fontSize: 48 }}>🖼️</div><p>Sem itens no portfólio</p><p style={{ fontSize: 13 }}>Adicione projectos para atrair clientes</p></div>
        : items.map((item, i) => (
          <Card key={i} style={{ marginBottom: 12 }}>
            <div style={{ height: 120, background: `linear-gradient(135deg, ${C.primary}20, ${C.accent}20)`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, fontSize: 36 }}>🏠</div>
            <div style={{ fontWeight: 700, color: C.dark, fontSize: 15 }}>{item.title}</div>
            {item.category && <span style={{ background: `${C.accent}15`, color: C.accent, padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, display: "inline-block", marginTop: 4 }}>{item.category}</span>}
            {item.description && <p style={{ color: C.gray, fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>{item.description}</p>}
          </Card>
        ))
      }
    </div>
  );
};

const ProfProfile = ({ user, onLogout }) => {
  const prof = user?.professional;
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", padding: "28px 16px 50px", textAlign: "center" }}>
        <Avatar name={user?.name} color={C.accent} size={80} />
        <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 800, marginTop: 12, marginBottom: 4 }}>{user?.name}</h2>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, margin: 0 }}>{prof?.specialty || "Profissional"}</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 16 }}>
          {[[prof?.rating?.toFixed(1)||"0.0","Avaliação"],[prof?.reviewCount||0,"Avaliações"],[prof?.experience||0,"Anos exp."]].map(([v,l],i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 18 }}>{v}</div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: "0 16px", marginTop: -24 }}>
        <Card style={{ marginBottom: 16 }}>
          {[["Email", user?.email],["Localização", prof?.location ? `📍 ${prof.location}` : null],["Especialidade", prof?.specialty]].filter(([,v]) => v).map(([l,v],i) => (
            <div key={i} style={{ marginBottom: i < 2 ? 12 : 0 }}>
              <div style={{ fontSize: 12, color: C.gray }}>{l}</div>
              <div style={{ fontWeight: 600, color: C.dark, marginTop: 2 }}>{v}</div>
            </div>
          ))}
        </Card>
        {[["✏️","Editar perfil"],["🔔","Notificações"],["🔒","Segurança"],["❓","Ajuda"]].map(([icon, label], i) => (
          <div key={i} style={{ background: C.white, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", marginBottom: 6, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <span style={{ flex: 1, fontWeight: 500, color: C.dark, fontSize: 14 }}>{label}</span>
            <span style={{ color: C.gray }}>›</span>
          </div>
        ))}
        <div style={{ marginTop: 16, marginBottom: 32 }}><Btn onClick={onLogout} full variant="danger">Terminar sessão</Btn></div>
      </div>
    </div>
  );
};

// ============================================================
// CHAT (partilhado)
// ============================================================
// ============================================================
// SUBSTITUA APENAS ESTE COMPONENTE NO SEU App.jsx
// Encontre "const ChatScreen" e substitua tudo até ao próximo componente
// ============================================================

const ChatScreen = ({ conversation, user, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState("");
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const endRef                  = useRef(null);
  const inputRef                = useRef(null);
  const isPro                   = user?.type === "PROFESSIONAL";

  useEffect(() => {
    messagesAPI.history(conversation.id)
      .then(d => setMessages(d.data || []))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [conversation.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Foco automático na caixa de texto
  useEffect(() => {
    if (!loading) setTimeout(() => inputRef.current?.focus(), 100);
  }, [loading]);

  const send = async () => {
    if (!text.trim() || sending) return;
    const content = text.trim();
    setText("");
    setSending(true);

    // Mostrar mensagem imediatamente
    const temp = { id: `temp-${Date.now()}`, content, senderId: user?.id, createdAt: new Date().toISOString(), sending: true };
    setMessages(prev => [...prev, temp]);

    try {
      const msg = await messagesAPI.send(conversation.id, { content });
      setMessages(prev => prev.map(m => m.id === temp.id ? msg : m));
    } catch {
      setMessages(prev => prev.filter(m => m.id !== temp.id));
      setText(content);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const name     = conversation.professional?.user?.name || conversation.client?.name || "Utilizador";
  const subtitle = conversation.title || conversation.professional?.specialty || "";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "'DM Sans', sans-serif", background: C.lightGray }}>

      {/* Cabeçalho */}
      <div style={{ background: isPro ? "#1a1a2e" : C.primary, padding: "16px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", width: 36, height: 36, borderRadius: "50%", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
        <Avatar name={name} size={42} />
        <div style={{ flex: 1 }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{name}</div>
          {subtitle && <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 1 }}>{subtitle}</div>}
        </div>
        <div style={{ width: 10, height: 10, background: C.success, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)" }} />
      </div>

      {/* Mensagens */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 8 }}>
        {loading ? <Spinner /> : (
          <>
            {/* Ecrã vazio — mostra mensagem amigável mas mantém caixa visível */}
            {messages.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: C.gray }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>👋</div>
                <p style={{ fontWeight: 600, fontSize: 15, margin: "0 0 6px", color: C.dark }}>Inicie a conversa!</p>
                <p style={{ fontSize: 13, margin: 0 }}>Escreva a sua mensagem em baixo.</p>
              </div>
            )}

            {messages.map((msg, i) => {
              const isMe       = msg.senderId === user?.id;
              const showAvatar = !isMe && (i === 0 || messages[i-1]?.senderId !== msg.senderId);
              return (
                <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8 }}>
                  {!isMe && (
                    <div style={{ width: 28, flexShrink: 0 }}>
                      {showAvatar && <Avatar name={name} size={28} />}
                    </div>
                  )}
                  <div style={{ maxWidth: "72%" }}>
                    <div style={{
                      padding: "10px 14px",
                      borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      background: isMe ? (isPro ? "#1a1a2e" : C.primary) : C.white,
                      color: isMe ? "#fff" : C.dark,
                      fontSize: 14, lineHeight: 1.5,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                      opacity: msg.sending ? 0.7 : 1,
                    }}>
                      {msg.content}
                    </div>
                    <div style={{ fontSize: 10, color: C.gray, marginTop: 3, textAlign: isMe ? "right" : "left" }}>
                      {msg.sending ? "A enviar..." : new Date(msg.createdAt).toLocaleTimeString("pt", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </>
        )}
      </div>

      {/* ── CAIXA DE TEXTO — SEMPRE VISÍVEL ── */}
      <div style={{ background: C.white, padding: "12px 16px", borderTop: `1px solid ${C.border}`, flexShrink: 0, boxShadow: "0 -2px 10px rgba(0,0,0,0.06)" }}>

        {/* Sugestões rápidas quando não há mensagens */}
        {messages.length === 0 && !loading && (
          <div style={{ display: "flex", gap: 8, marginBottom: 10, overflowX: "auto", scrollbarWidth: "none" }}>
            {["Olá, estou interessado! 👋", "Qual o preço?", "Está disponível esta semana?"].map((s, i) => (
              <button key={i} onClick={() => { setText(s); inputRef.current?.focus(); }} style={{ background: `${C.primary}10`, color: C.primary, border: `1px solid ${C.primary}30`, padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif" }}>
                {s}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          {/* Campo de texto que cresce automaticamente */}
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Escrever mensagem..."
            rows={1}
            style={{
              flex: 1,
              border: `1.5px solid ${text ? C.primary : C.border}`,
              borderRadius: 24,
              padding: "10px 16px",
              outline: "none",
              fontSize: 14,
              fontFamily: "'DM Sans', sans-serif",
              resize: "none",
              boxSizing: "border-box",
              lineHeight: 1.5,
              maxHeight: 120,
              overflowY: "auto",
              transition: "border-color 0.2s",
              background: C.white,
            }}
            onInput={e => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
          />

          {/* Botão enviar */}
          <button
            onClick={send}
            disabled={!text.trim() || sending}
            style={{
              background: text.trim() ? (isPro ? C.accent : C.primary) : C.border,
              border: "none", color: "#fff",
              width: 46, height: 46,
              borderRadius: "50%",
              cursor: text.trim() ? "pointer" : "default",
              fontSize: 20,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              transition: "all 0.2s",
              transform: text.trim() ? "scale(1)" : "scale(0.9)",
            }}
          >
            {sending ? "⏳" : "➤"}
          </button>
        </div>

        <p style={{ fontSize: 11, color: C.gray, margin: "6px 0 0", textAlign: "center" }}>
          Enter para enviar • Shift+Enter para nova linha
        </p>
      </div>
    </div>
  );
};

// ============================================================
// PERFIL DO PROFISSIONAL (visão do cliente)
// ============================================================
const ProfessionalProfile = ({ prof, onBack, onMessage, onSchedule }) => {
  const [data, setData] = useState(prof);
  const [tab, setTab]   = useState("about");
  const [loading, setL] = useState(true);

  useEffect(() => {
    professionalsAPI.get(prof.id).then(setData).catch(() => {}).finally(() => setL(false));
  }, [prof.id]);

  const name = data.user?.name || "Profissional";
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`, padding: "20px 16px 60px", borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans', sans-serif", marginBottom: 20 }}>← Voltar</button>
        <div style={{ textAlign: "center" }}>
          <Avatar name={name} size={80} />
          <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 800, marginTop: 12, marginBottom: 4 }}>{name}</h2>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, margin: 0 }}>{data.specialty}</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 }}>
            <Stars rating={data.rating} size={16} />
            <span style={{ color: "#fff", fontWeight: 700 }}>{data.rating?.toFixed(1)}</span>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>({data.reviewCount} avaliações)</span>
          </div>
        </div>
      </div>
      <div style={{ padding: "0 16px", marginTop: -36 }}>
        <Card style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, textAlign: "center" }}>
            {[["Experiência",`${data.experience} anos`],["Projectos",`${data.reviewCount}+`],["Localização",data.location||"—"]].map(([l,v],i) => (
              <div key={i}><div style={{ fontWeight: 800, color: C.primary, fontSize: 14 }}>{v}</div><div style={{ fontSize: 11, color: C.gray }}>{l}</div></div>
            ))}
          </div>
        </Card>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <Btn onClick={onMessage}  variant="outline" full>💬 Mensagem</Btn>
          <Btn onClick={onSchedule} variant="accent"  full>📅 Agendar</Btn>
        </div>
        <div style={{ display: "flex", gap: 4, borderBottom: `2px solid ${C.border}`, marginBottom: 20 }}>
          {["about","portfolio","reviews"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "10px 18px", border: "none", background: "transparent", cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: tab === t ? C.primary : C.gray, borderBottom: `2px solid ${tab === t ? C.primary : "transparent"}`, marginBottom: -2 }}>
              {t === "about" ? "Sobre" : t === "portfolio" ? "Portfólio" : "Avaliações"}
            </button>
          ))}
        </div>
        {loading ? <Spinner /> : (
          <>
            {tab === "about" && (
              <div>
                {data.about    && <Card style={{ marginBottom: 14 }}><h4 style={{ margin:"0 0 10px",color:C.dark }}>Sobre mim</h4><p style={{ color:C.gray,fontSize:14,lineHeight:1.7,margin:0 }}>{data.about}</p></Card>}
                {data.tags     && <Card style={{ marginBottom: 14 }}><h4 style={{ margin:"0 0 12px",color:C.dark }}>Especialidades</h4><div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>{data.tags.split(",").map((t,i) => <span key={i} style={{ background:`${C.primary}15`,color:C.primary,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600 }}>{t.trim()}</span>)}</div></Card>}
                {data.priceMin && <Card><h4 style={{ margin:"0 0 8px",color:C.dark }}>Preço</h4><div style={{ fontSize:20,fontWeight:800,color:C.accent }}>{data.priceMin}–{data.priceMax} CVE/h</div></Card>}
              </div>
            )}
            {tab === "portfolio" && (
              (data.portfolio||[]).length === 0 ? <p style={{ textAlign:"center",color:C.gray,padding:32 }}>Sem portfólio.</p>
              : (data.portfolio||[]).map((item,i) => (
                <Card key={i} style={{ marginBottom:12 }}>
                  <div style={{ height:120,background:`linear-gradient(135deg,${C.primary}20,${C.accent}20)`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:10,fontSize:32 }}>🏠</div>
                  <div style={{ fontWeight:600,color:C.dark }}>{item.title}</div>
                  {item.description && <div style={{ color:C.gray,fontSize:13,marginTop:4 }}>{item.description}</div>}
                </Card>
              ))
            )}
            {tab === "reviews" && (
              (data.reviews||[]).length === 0 ? <p style={{ textAlign:"center",color:C.gray,padding:32 }}>Sem avaliações ainda.</p>
              : (data.reviews||[]).map((r,i) => (
                <Card key={i} style={{ marginBottom:12 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
                    <span style={{ fontWeight:700,color:C.dark }}>{r.author?.name}</span>
                    <span style={{ fontSize:12,color:C.gray }}>{new Date(r.createdAt).toLocaleDateString("pt")}</span>
                  </div>
                  <Stars rating={r.rating} />
                  <p style={{ color:C.gray,fontSize:13,lineHeight:1.6,margin:"8px 0 0" }}>{r.comment}</p>
                </Card>
              ))
            )}
          </>
        )}
      </div>
      <div style={{ height: 24 }} />
    </div>
  );
};

// Agendamento
const ScheduleScreen = ({ professional, onBack, onConfirm }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setL]                 = useState(false);
  const times = ["08:00","09:00","10:00","11:00","13:00","14:00","15:00","16:00"];
  const days  = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i + 1); return d; });

  const confirm = async () => {
    if (!selectedDate || !selectedTime) return;
    setL(true);
    try { await schedulesAPI.create({ professionalId: professional.id, date: selectedDate.toISOString(), startTime: selectedTime, endTime: selectedTime }); onConfirm(); }
    catch (err) { alert(err.message); } finally { setL(false); }
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: C.primary, padding: "20px 16px 24px", borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#fff", fontSize: 16, cursor: "pointer", marginBottom: 12 }}>← Voltar</button>
        <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 800, margin: 0 }}>Agendar Serviço</h2>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 4 }}>{professional?.user?.name} • {professional?.specialty}</p>
      </div>
      <div style={{ padding: "20px 16px" }}>
        <Card style={{ marginBottom: 16 }}>
          <h4 style={{ margin: "0 0 14px", color: C.dark }}>Seleccionar data</h4>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none" }}>
            {days.map((d, i) => (
              <div key={i} onClick={() => setSelectedDate(d)} style={{ minWidth: 52, textAlign: "center", padding: "10px 6px", borderRadius: 12, cursor: "pointer", background: selectedDate?.getDate() === d.getDate() ? C.primary : C.lightGray, color: selectedDate?.getDate() === d.getDate() ? "#fff" : C.dark, transition: "all 0.2s" }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", opacity: 0.8 }}>{d.toLocaleDateString("pt", { weekday: "short" })}</div>
                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{d.getDate()}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card style={{ marginBottom: 16 }}>
          <h4 style={{ margin: "0 0 14px", color: C.dark }}>Horário</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
            {times.map(t => (
              <button key={t} onClick={() => setSelectedTime(t)} style={{ padding: "10px 4px", border: `1.5px solid ${selectedTime === t ? C.primary : C.border}`, borderRadius: 10, cursor: "pointer", background: selectedTime === t ? `${C.primary}10` : C.white, color: selectedTime === t ? C.primary : C.dark, fontWeight: 600, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>{t}</button>
            ))}
          </div>
        </Card>
        <Btn onClick={confirm} full variant="accent" disabled={!selectedDate || !selectedTime || loading}>
          {loading ? "A agendar..." : selectedDate && selectedTime ? `✓ Confirmar: ${selectedDate.getDate()} às ${selectedTime}` : "Seleccione data e hora"}
        </Btn>
      </div>
    </div>
  );
};

// ============================================================
// APP PRINCIPAL
// ============================================================
export default function BuildMatchApp() {
  const [screen, setScreen]           = useState("onboarding");
  const [user, setUser]               = useState(null);
  const [clientTab, setClientTab]     = useState("home");
  const [profTab, setProfTab]         = useState("dashboard");
  const [selectedProf, setSelectedProf] = useState(null);
  const [searchQ, setSearchQ]         = useState("");
  const [openChat, setOpenChat]       = useState(null);
  const [scheduleFor, setScheduleFor] = useState(null);
  const [successMsg, setSuccessMsg]   = useState(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel   = "stylesheet";
    link.href  = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(link);

    const token = localStorage.getItem("buildmatch_token");
    const saved = localStorage.getItem("buildmatch_user");
    if (token && saved) { setUser(JSON.parse(saved)); setScreen("app"); }
  }, []);

  const login  = (u) => { setUser(u); setScreen("app"); };
  const logout = () => { localStorage.clear(); setUser(null); setScreen("login"); };
  const success = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 3000); };

  const isPro = user?.type === "PROFESSIONAL";

  // Chat em ecrã completo
  if (openChat) return <ChatScreen conversation={openChat} user={user} onBack={() => setOpenChat(null)} />;

  // Ecrãs iniciais
  if (screen === "onboarding") return <Onboarding onFinish={() => setScreen("login")} />;
  if (screen === "login")      return <Login onLogin={login} />;

  // Agendamento
  if (scheduleFor) return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: C.lightGray }}>
      <ScheduleScreen professional={scheduleFor} onBack={() => setScheduleFor(null)}
        onConfirm={() => { setScheduleFor(null); success("Agendamento realizado! O profissional será notificado."); }} />
    </div>
  );

  // Perfil do profissional (visão do cliente)
  if (selectedProf) return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: C.lightGray }}>
      <div style={{ overflowY: "auto" }}>
        <ProfessionalProfile prof={selectedProf} onBack={() => setSelectedProf(null)}
          onMessage={() => { setSelectedProf(null); setClientTab("messages"); }}
          onSchedule={() => { const p = selectedProf; setSelectedProf(null); setScheduleFor(p); }} />
      </div>
      {successMsg && <SuccessModal message={successMsg} onClose={() => setSuccessMsg(null)} />}
    </div>
  );

  // ── PAINEL DO PROFISSIONAL ──────────────────────────────────
  if (isPro) {
    const renderPro = () => {
      switch (profTab) {
        case "dashboard": return <ProfDashboard user={user} />;
        case "projects":  return <ProfProjects />;
        case "agenda":    return <ProfAgenda user={user} />;
        case "portfolio": return <ProfPortfolio user={user} />;
        case "profile":   return <ProfProfile user={user} onLogout={logout} />;
        default: return null;
      }
    };
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: C.lightGray }}>
        <div style={{ paddingBottom: 70, overflowY: "auto" }}>{renderPro()}</div>
        <ProfNav active={profTab} onChange={setProfTab} />
        {successMsg && <SuccessModal message={successMsg} onClose={() => setSuccessMsg(null)} />}
      </div>
    );
  }

  // ── PAINEL DO CLIENTE ───────────────────────────────────────
  const renderClient = () => {
    switch (clientTab) {
      case "home":     return <ClientHome user={user} onProfSelect={setSelectedProf} onSearch={q => { setSearchQ(q); setClientTab("search"); }} />;
      case "search":   return <ClientSearch query={searchQ} onProfSelect={setSelectedProf} />;
      case "projects": return <ClientProjects />;
      case "messages": return <ClientMessages onOpenChat={setOpenChat} />;
      case "profile":  return <ClientProfile user={user} onLogout={logout} />;
      default: return null;
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: C.lightGray }}>
      <div style={{ paddingBottom: 70, overflowY: "auto" }}>{renderClient()}</div>
      <ClientNav active={clientTab} onChange={tab => { setClientTab(tab); setSearchQ(""); }} />
      {successMsg && <SuccessModal message={successMsg} onClose={() => setSuccessMsg(null)} />}
    </div>
  );
}