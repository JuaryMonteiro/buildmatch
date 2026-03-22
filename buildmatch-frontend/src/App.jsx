import { useState, useEffect, useRef } from "react";
import { authAPI, professionalsAPI, projectsAPI, messagesAPI, schedulesAPI } from "./services/api";

// ============================================================
// PALETA OFICIAL BuildMatch
// ============================================================
const C = {
  primary: "#1F4E8C",
  primaryDark: "#163a6b",
  accent: "#F57C00",
  dark: "#2E2E2E",
  gray: "#6B7280",
  lightGray: "#F5F5F5",
  white: "#FFFFFF",
  success: "#22C55E",
  error: "#EF4444",
  border: "#E5E7EB",
  purple: "#7C3AED",
};
{/*
const CATEGORIES = [
  { name: "Pedreiro",    img: "/buildmatch/categories/pedreiro.jpg"    },
  { name: "Eletricista", img: "/buildmatch/categories/eletricista.jpg" },
  { name: "Canalizador", img: "/buildmatch/categories/canalizador.jpg" },
  { name: "Pintor",      img: "/buildmatch/categories/pintor.webp"     },
  { name: "Carpinteiro", img: "/buildmatch/categories/carpinteiro.jpg" },
  { name: "Engenheiro",  img: "/buildmatch/categories/engenheiro.jpg"  },
];
*/}

const BASE = import.meta.env.BASE_URL;

const CATEGORIES = [
  { name: "Pedreiro", img: `${BASE}categories/pedreiro.jpg` },
  { name: "Eletricista", img: `${BASE}categories/eletricista.jpg` },
  { name: "Canalizador", img: `${BASE}categories/canalizador.jpg` },
  { name: "Pintor", img: `${BASE}categories/pintor.webp` },
  { name: "Carpinteiro", img: `${BASE}categories/carpinteiro.jpg` },
  { name: "Engenheiro", img: `${BASE}categories/engenheiro.webp` },
];
// ============================================================
// COMPONENTES BASE
// ============================================================
const Avatar = ({ name = "", color, size = 40 }) => {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "U";
  const colors = [C.primary, C.accent, C.primaryDark, "#c96800", C.purple];
  const bg = color || colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.35, flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>
      {initials}
    </div>
  );
};

const Stars = ({ rating = 0, size = 14 }) => (
  <span>{[1, 2, 3, 4, 5].map(i => <span key={i} style={{ color: i <= Math.floor(rating) ? "#F59E0B" : "#D1D5DB", fontSize: size }}>★</span>)}</span>
);

const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{ background: C.white, borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", padding: 20, cursor: onClick ? "pointer" : "default", ...style }}>
    {children}
  </div>
);

const Btn = ({ children, onClick, variant = "primary", small, full, disabled, style: ex }) => {
  const v = {
    primary: { background: disabled ? "#9CA3AF" : C.primary, color: "#fff", border: "none" },
    accent: { background: disabled ? "#9CA3AF" : C.accent, color: "#fff", border: "none" },
    outline: { background: "transparent", color: C.primary, border: `2px solid ${C.primary}` },
    ghost: { background: "transparent", color: C.gray, border: `1px solid ${C.border}` },
    danger: { background: C.error, color: "#fff", border: "none" },
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
    COMPLETED: { bg: "#D1FAE5", color: "#059669", label: "✓ Concluído" },
    ACTIVE: { bg: "#DBEAFE", color: "#1D4ED8", label: "⟳ Em andamento" },
    PENDING: { bg: "#FEF3C7", color: "#D97706", label: "◷ Pendente" },
    CANCELLED: { bg: "#FEE2E2", color: "#DC2626", label: "✕ Cancelado" },
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
    { icon: "⭐", title: "Avaliações Reais e Verificadas", desc: "Tome decisões informadas com avaliações autênticas de outros clientes.", bg: "#163a6b" },
    { icon: "📅", title: "Agende com Facilidade", desc: "Comunique, negoceie e agende serviços directamente pela plataforma.", bg: C.accent },
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
  const [mode, setMode] = useState("login");
  const [type, setType] = useState("CLIENT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      localStorage.setItem("buildmatch_user", JSON.stringify(data.user));
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
            {["login", "register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }} style={{ flex: 1, padding: "10px", border: "none", borderRadius: 8, background: mode === m ? C.white : "transparent", color: mode === m ? C.primary : C.gray, fontWeight: mode === m ? 700 : 500, cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
                {m === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          {mode === "register" && (
            <>
              <p style={{ fontSize: 13, color: C.gray, marginBottom: 10, fontWeight: 600 }}>Sou um:</p>
              <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                {[["CLIENT", "👤 Cliente"], ["PROFESSIONAL", "🔨 Profissional"]].map(([t, l]) => (
                  <button key={t} onClick={() => setType(t)} style={{ flex: 1, padding: "14px 8px", border: `2px solid ${type === t ? C.primary : C.border}`, borderRadius: 12, background: type === t ? `${C.primary}10` : C.white, color: type === t ? C.primary : C.gray, fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s" }}>
                    {l}
                  </button>
                ))}
              </div>
              <Input label="Nome completo" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome completo" />
            </>
          )}

          <ErrMsg msg={error} />
          <Input label="Email" value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="seu@email.com" />
          <Input label="Palavra-passe" value={pass} onChange={e => setPass(e.target.value)} type="password" placeholder="••••••••" />
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
    {[["home", "🏠", "Início"], ["search", "🔍", "Buscar"], ["projects", "📋", "Projectos"], ["messages", "💬", "Chat"], ["profile", "👤", "Perfil"]].map(([id, icon, label]) => (
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
  const [profs, setProfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

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
        <div className="categories-grid">
          {CATEGORIES.map((cat, i) => (
            <div key={i} className="category-card" onClick={() => onSearch(cat.name)}>
              <img
                src={cat.img}
                alt={cat.name}
                onError={e => {
                  e.target.style.display = "none";
                  e.target.parentElement.style.background = i % 2 === 0 ? "#1F4E8C" : "#F57C00";
                }}
              />
              <div className="overlay" />
              <div className="label">{cat.name}</div>
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
  const [q, setQ] = useState(initQ || "");
  const [profs, setProfs] = useState([]);
  const [loading, setL] = useState(false);
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
            placeholder="Pesquisar profissionais..." style={{ background: C.white, border: "none", outline: "none", flex: 1, fontSize: 14, fontFamily: "'DM Sans', sans-serif" }} />
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
                style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none" , background: "transparent", color: C.dark }}>
                <option value="rating">⭐ Avaliação</option>
                <option value="experience">🏆 Experiência</option>
                <option value="reviewCount">💬 Mais avaliados</option>
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ fontSize: 12, color: C.gray, display: "block", marginBottom: 4 }}>Preço máx. (CVE/h)</label>
              <input value={priceMax} onChange={e => setPriceMax(e.target.value)} placeholder="Ex: 800"
             style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box", background: "transparent", color: C.dark  }} />   
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
  const [loading, setL] = useState(true);
  const [tab, setTab] = useState("all");

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
        <StatCard icon="📁" label="Total" value={projects.length} color={C.primary} />
        <StatCard icon="⟳" label="Activos" value={projects.filter(p => p.status === "ACTIVE").length} color={C.accent} />
        <StatCard icon="✓" label="Concluídos" value={projects.filter(p => p.status === "COMPLETED").length} color={C.success} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", scrollbarWidth: "none" }}>
        {[["all", "Todos"], ["active", "Activos"], ["done", "Concluídos"], ["pending", "Pendentes"]].map(([v, l]) => (
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
              {proj.amount && <div><div style={{ fontSize: 10, color: C.gray }}>VALOR</div><div style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>{proj.amount.toLocaleString()} CVE</div></div>}
            </div>
          </Card>
        ))
      }
    </div>
  );
};

const ClientMessages = ({ onOpenChat }) => {
  const [convs, setConvs] = useState([]);
  const [loading, setL] = useState(true);

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

// ============================================================
// SUBSTITUA O COMPONENTE ClientProfile no seu App.jsx
// ============================================================

const ClientProfile = ({ user, onLogout }) => {
  const [section, setSection] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // ── Editar Perfil ──────────────────────────────
  const EditProfile = () => {
    const [name,   setName]   = useState(user?.name  || "");
    const [email,  setEmail]  = useState(user?.email || "");
    const [phone,  setPhone]  = useState(user?.phone || "");
    const [saving, setSaving] = useState(false);

    const save = async () => {
      setSaving(true);
      try {
        const { usersAPI } = await import("./services/api");
        const updated = await usersAPI.update(user.id, { name, phone });
        localStorage.setItem("buildmatch_user", JSON.stringify({ ...user, ...updated }));
        showSuccess("Perfil actualizado com sucesso!");
        setSection(null);
      } catch (err) {
        alert(err.message);
      } finally { setSaving(false); }
    };

    return (
      <div style={{ padding: "20px 16px", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={() => setSection(null)} style={{ background: C.lightGray, border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>← Voltar</button>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.dark, margin: 0 }}>Editar Perfil</h2>
        </div>

        {/* Avatar */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <Avatar name={name} color={C.accent} size={88} />
            <button style={{ position: "absolute", bottom: 0, right: 0, background: C.primary, border: "none", width: 30, height: 30, borderRadius: "50%", cursor: "pointer", color: "#fff", fontSize: 14 }}>✏️</button>
          </div>
          <p style={{ color: C.gray, fontSize: 12, marginTop: 8 }}>Toque para alterar a foto</p>
        </div>

        <Card>
          <Input label="Nome completo"  value={name}  onChange={e => setName(e.target.value)}  placeholder="Seu nome completo" />
          <Input label="Email"          value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="seu@email.com" />
          <Input label="Telefone"       value={phone} onChange={e => setPhone(e.target.value)} type="tel"   placeholder="+238 991 0000" />
        </Card>

        <div style={{ marginTop: 20 }}>
          <Btn onClick={save} full disabled={saving}>{saving ? "A guardar..." : "💾 Guardar alterações"}</Btn>
        </div>
      </div>
    );
  };


  // ── Endereços — API REAL ───────────────────────────────────
  const Addresses = () => {
    const [addresses, setAddresses] = useState([]);
    const [loading,   setL]         = useState(true);
    const [showForm,  setShowForm]  = useState(false);
    const [label,     setLabel]     = useState("");
    const [address,   setAddress]   = useState("");
    const [saving,    setSaving]    = useState(false);

    useEffect(() => {
      loadAddresses();
    }, []);

    const loadAddresses = async () => {
      setL(true);
      try {
        const { addressesAPI } = await import("./services/api");
        const data = await addressesAPI.list();
        setAddresses(data.data || []);
      } catch {
        setAddresses([]);
      } finally { setL(false); }
    };

    const add = async () => {
      if (!label || !address) return;
      setSaving(true);
      try {
        const { addressesAPI } = await import("./services/api");
        const newAddr = await addressesAPI.create({ label, address, default: addresses.length === 0 });
        setAddresses(prev => [...prev, newAddr]);
        setLabel(""); setAddress(""); setShowForm(false);
      } catch (err) { alert(err.message); }
      finally { setSaving(false); }
    };

    const remove = async (id) => {
      try {
        const { addressesAPI } = await import("./services/api");
        await addressesAPI.delete(id);
        setAddresses(prev => prev.filter(a => a.id !== id));
      } catch (err) { alert(err.message); }
    };

    const setDefault = async (id) => {
      try {
        const { addressesAPI } = await import("./services/api");
        await addressesAPI.update(id, { default: true });
        setAddresses(prev => prev.map(a => ({ ...a, default: a.id === id })));
      } catch (err) { alert(err.message); }
    };

    return (
      <div style={{ padding: "20px 16px", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={() => setSection(null)} style={{ background: C.lightGray, border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>← Voltar</button>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.dark, margin: 0 }}>Endereços</h2>
          <button onClick={() => setShowForm(!showForm)} style={{ marginLeft: "auto", background: C.accent, color: "#fff", border: "none", padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
            {showForm ? "✕ Cancelar" : "➕ Novo"}
          </button>
        </div>

        {showForm && (
          <Card style={{ marginBottom: 16, borderTop: `4px solid ${C.accent}` }}>
            <Input label="Nome do endereço" value={label}   onChange={e => setLabel(e.target.value)}   placeholder="Ex: Casa, Trabalho..." />
            <Input label="Endereço"         value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, número, cidade" />
            <Btn onClick={add} variant="accent" full disabled={saving || !label || !address}>
              {saving ? "A guardar..." : "💾 Guardar endereço"}
            </Btn>
          </Card>
        )}

        {loading ? <Spinner /> : addresses.length === 0
          ? (
            <div style={{ textAlign: "center", padding: 48, color: C.gray }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📍</div>
              <p style={{ fontWeight: 600 }}>Nenhum endereço guardado</p>
              <p style={{ fontSize: 13 }}>Adicione um endereço para facilitar os agendamentos</p>
            </div>
          )
          : addresses.map(addr => (
            <Card key={addr.id} style={{ marginBottom: 12, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 18 }}>📍</span>
                    <span style={{ fontWeight: 700, color: C.dark, fontSize: 14 }}>{addr.label}</span>
                    {addr.default && (
                      <span style={{ background: `${C.primary}15`, color: C.primary, padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600 }}>Principal</span>
                    )}
                  </div>
                  <p style={{ color: C.gray, fontSize: 13, margin: 0, lineHeight: 1.5 }}>{addr.address}</p>
                </div>
                <button onClick={() => remove(addr.id)} style={{ background: "#FEE2E2", border: "none", color: C.error, width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 14, flexShrink: 0, marginLeft: 10 }}>✕</button>
              </div>
              {!addr.default && (
                <button onClick={() => setDefault(addr.id)} style={{ marginTop: 10, background: "none", border: `1px solid ${C.border}`, color: C.gray, padding: "7px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif", width: "100%", fontWeight: 500 }}>
                  ✓ Definir como principal
                </button>
              )}
            </Card>
          ))
        }
      </div>
    );
  };

  // ── Avaliações feitas — API REAL ───────────────────────────
  const MyReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setL]       = useState(true);

    useEffect(() => {
      loadReviews();
    }, []);

    const loadReviews = async () => {
      setL(true);
      try {
        // Carregar projectos concluídos com avaliações
        const data = await projectsAPI.list({ status: "COMPLETED" });
        const projects = data.data || [];

        // Filtrar os que têm avaliação
        const withReviews = projects.filter(p => p.review);
        setReviews(withReviews);
      } catch {
        setReviews([]);
      } finally { setL(false); }
    };

    return (
      <div style={{ padding: "20px 16px", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={() => setSection(null)} style={{ background: C.lightGray, border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>← Voltar</button>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.dark, margin: 0 }}>Minhas Avaliações</h2>
        </div>

        {loading ? <Spinner /> : reviews.length === 0
          ? (
            <div style={{ textAlign: "center", padding: 48, color: C.gray }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⭐</div>
              <p style={{ fontWeight: 600 }}>Ainda não fez nenhuma avaliação</p>
              <p style={{ fontSize: 13 }}>Após concluir um serviço poderá avaliar o profissional</p>
            </div>
          )
          : reviews.map(proj => (
            <Card key={proj.id} style={{ marginBottom: 12 }}>
              {/* Info do profissional */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, color: C.dark, fontSize: 14 }}>{proj.professional?.user?.name}</div>
                  <div style={{ color: C.gray, fontSize: 12, marginTop: 2 }}>{proj.professional?.specialty}</div>
                  <div style={{ color: C.gray, fontSize: 12, marginTop: 2 }}>📋 {proj.title}</div>
                </div>
                <span style={{ fontSize: 12, color: C.gray }}>{new Date(proj.review.createdAt).toLocaleDateString("pt")}</span>
              </div>

              {/* Estrelas */}
              <div style={{ display: "flex", gap: 3, marginBottom: 8 }}>
                {[1,2,3,4,5].map(i => (
                  <span key={i} style={{ color: i <= proj.review.rating ? "#F59E0B" : "#D1D5DB", fontSize: 20 }}>★</span>
                ))}
                <span style={{ fontSize: 13, fontWeight: 600, color: C.dark, marginLeft: 6, alignSelf: "center" }}>{proj.review.rating}/5</span>
              </div>

              {/* Comentário */}
              <p style={{ color: C.gray, fontSize: 13, lineHeight: 1.6, margin: 0, background: C.lightGray, padding: "10px 12px", borderRadius: 10 }}>
                "{proj.review.comment}"
              </p>

              {/* Resposta do profissional */}
              {proj.review.reply && (
                <div style={{ marginTop: 10, background: `${C.primary}08`, borderLeft: `3px solid ${C.primary}`, padding: "8px 12px", borderRadius: "0 8px 8px 0" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.primary, marginBottom: 4 }}>Resposta do profissional:</div>
                  <p style={{ color: C.dark, fontSize: 13, margin: 0, lineHeight: 1.5 }}>{proj.review.reply}</p>
                </div>
              )}
            </Card>
          ))
        }
      </div>
    );
  };


  // ── Notificações ───────────────────────────────
  const Notifications = () => {
    const [settings, setSettings] = useState({
      newMessage:    true,
      projectUpdate: true,
      promotions:    false,
      reminders:     true,
      email:         true,
      sms:           false,
    });

    const toggle = (key) => setSettings(prev => ({ ...prev, [key]: !prev[key] }));

    const Toggle = ({ value, onChange }) => (
      <div onClick={onChange} style={{
        width: 44, height: 24, borderRadius: 12,
        background: value ? C.primary : C.border,
        position: "relative", cursor: "pointer",
        transition: "background 0.2s", flexShrink: 0,
      }}>
        <div style={{
          position: "absolute", top: 2,
          left: value ? 22 : 2,
          width: 20, height: 20, borderRadius: "50%",
          background: "#fff", transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }} />
      </div>
    );

    const items = [
      { key: "newMessage",    icon: "💬", label: "Novas mensagens",       desc: "Quando receber uma mensagem" },
      { key: "projectUpdate", icon: "📋", label: "Actualizações do projecto", desc: "Mudanças de estado" },
      { key: "reminders",     icon: "📅", label: "Lembretes de agendamento", desc: "Antes do serviço agendado" },
      { key: "promotions",    icon: "🎁", label: "Promoções e ofertas",    desc: "Novidades e descontos" },
      { key: "email",         icon: "📧", label: "Notificações por email", desc: "Receber por email" },
      { key: "sms",           icon: "📱", label: "Notificações por SMS",   desc: "Receber por mensagem" },
    ];

    return (
      <div style={{ padding: "20px 16px", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={() => setSection(null)} style={{ background: C.lightGray, border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>← Voltar</button>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.dark, margin: 0 }}>Notificações</h2>
        </div>

        <Card>
          {items.map((item, i) => (
            <div key={item.key}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0" }}>
                <span style={{ fontSize: 22, width: 32, textAlign: "center" }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: C.dark, fontSize: 14 }}>{item.label}</div>
                  <div style={{ color: C.gray, fontSize: 12, marginTop: 2 }}>{item.desc}</div>
                </div>
                <Toggle value={settings[item.key]} onChange={() => toggle(item.key)} />
              </div>
              {i < items.length - 1 && <div style={{ height: 1, background: C.border }} />}
            </div>
          ))}
        </Card>

        <div style={{ marginTop: 16 }}>
          <Btn onClick={() => { showSuccess("Preferências guardadas!"); setSection(null); }} full>💾 Guardar preferências</Btn>
        </div>
      </div>
    );
  };

  // ── Segurança ──────────────────────────────────
  const Security = () => {
    const [currentPass, setCurrentPass] = useState("");
    const [newPass,     setNewPass]     = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    const [saving,      setSaving]      = useState(false);
    const [error,       setError]       = useState("");

    const save = async () => {
      setError("");
      if (!currentPass || !newPass || !confirmPass) { setError("Preencha todos os campos"); return; }
      if (newPass !== confirmPass) { setError("As novas passwords não coincidem"); return; }
      if (newPass.length < 6) { setError("A nova password deve ter pelo menos 6 caracteres"); return; }
      setSaving(true);
      try {
        const { authAPI } = await import("./services/api");
        await authAPI.changePassword({ currentPassword: currentPass, newPassword: newPass });
        showSuccess("Password alterada com sucesso!");
        setSection(null);
      } catch (err) { setError(err.message); }
      finally { setSaving(false); }
    };

    return (
      <div style={{ padding: "20px 16px", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={() => setSection(null)} style={{ background: C.lightGray, border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>← Voltar</button>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.dark, margin: 0 }}>Segurança</h2>
        </div>

        <Card style={{ marginBottom: 16 }}>
          <h4 style={{ margin: "0 0 16px", color: C.dark, fontSize: 15 }}>🔒 Alterar palavra-passe</h4>
          {error && <div style={{ background: "#FEE2E2", color: C.error, padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <Input label="Password actual"    value={currentPass} onChange={e => setCurrentPass(e.target.value)} type="password" placeholder="••••••••" />
          <Input label="Nova password"      value={newPass}     onChange={e => setNewPass(e.target.value)}     type="password" placeholder="••••••••" />
          <Input label="Confirmar password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} type="password" placeholder="••••••••" />
          <Btn onClick={save} full disabled={saving}>{saving ? "A alterar..." : "Alterar password"}</Btn>
        </Card>

        <Card>
          <h4 style={{ margin: "0 0 14px", color: C.dark, fontSize: 15 }}>🛡️ Segurança da conta</h4>
          {[
            { icon: "✅", label: "Email verificado",           desc: user?.email,         status: true  },
            { icon: "📱", label: "Autenticação em dois passos", desc: "Não activado",       status: false },
            { icon: "🔑", label: "Sessões activas",             desc: "1 dispositivo",      status: true  },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < 2 ? `1px solid ${C.border}` : "none" }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: C.dark, fontSize: 13 }}>{item.label}</div>
                <div style={{ color: C.gray, fontSize: 12, marginTop: 2 }}>{item.desc}</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: item.status ? C.success : C.error }}>
                {item.status ? "Activo" : "Inactivo"}
              </span>
            </div>
          ))}
        </Card>
      </div>
    );
  };

  // ── Ajuda ──────────────────────────────────────
  const Help = () => {
    const [openFaq, setOpenFaq] = useState(null);

    const faqs = [
      { q: "Como posso contratar um profissional?",       a: "Pesquise o serviço que precisa, veja os perfis dos profissionais disponíveis e clique em 'Agendar' ou 'Mensagem' para contactar." },
      { q: "Como funciona o sistema de avaliações?",      a: "Após a conclusão de um serviço, pode avaliar o profissional com 1 a 5 estrelas e deixar um comentário. Só clientes que contrataram podem avaliar." },
      { q: "Posso cancelar um agendamento?",              a: "Sim, pode cancelar um agendamento pendente. Para serviços já confirmados, contacte o profissional directamente pelo chat." },
      { q: "Como altero os meus dados pessoais?",         a: "Vá ao seu Perfil → Editar Perfil e actualize as informações que desejar." },
      { q: "Os meus dados estão seguros?",                a: "Sim, os seus dados são encriptados e protegidos. Nunca partilhamos informações pessoais sem o seu consentimento." },
    ];

    return (
      <div style={{ padding: "20px 16px", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={() => setSection(null)} style={{ background: C.lightGray, border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>← Voltar</button>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.dark, margin: 0 }}>Ajuda</h2>
        </div>

        {/* Contacto rápido */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[["💬", "Chat", "Resposta imediata"], ["📧", "Email", "buildmatch@us.edu.cv"]].map(([icon, label, desc], i) => (
            <Card key={i} style={{ padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
              <div style={{ fontWeight: 700, color: C.dark, fontSize: 14 }}>{label}</div>
              <div style={{ color: C.gray, fontSize: 11, marginTop: 4 }}>{desc}</div>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.dark, marginBottom: 12 }}>Perguntas frequentes</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {faqs.map((faq, i) => (
            <div key={i} style={{ background: C.white, borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                <span style={{ fontWeight: 600, color: C.dark, fontSize: 13, flex: 1, paddingRight: 10 }}>{faq.q}</span>
                <span style={{ color: C.primary, fontSize: 18, transition: "transform 0.2s", transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)" }}>⌄</span>
              </div>
              {openFaq === i && (
                <div style={{ padding: "0 16px 14px", color: C.gray, fontSize: 13, lineHeight: 1.6, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <Card style={{ marginTop: 20, background: `${C.primary}08`, border: `1px solid ${C.primary}20` }}>
          <p style={{ margin: 0, fontSize: 13, color: C.primary, fontWeight: 600, marginBottom: 4 }}>📞 Suporte técnico</p>
          <p style={{ margin: 0, fontSize: 13, color: C.gray }}>Universidade de Santiago — CSAT</p>
          <p style={{ margin: 0, fontSize: 13, color: C.gray }}>Segunda a Sexta: 08h00 — 17h00</p>
        </Card>
      </div>
    );
  };

  // ── Renderizar secção activa ───────────────────
  if (section === "edit")          return <EditProfile />;
  if (section === "addresses")     return <Addresses />;
  if (section === "reviews")       return <MyReviews />;
  if (section === "notifications") return <Notifications />;
  if (section === "security")      return <Security />;
  if (section === "help")          return <Help />;

  // ── Ecrã principal do perfil ──────────────────
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {successMsg && <SuccessModal message={successMsg} onClose={() => setSuccessMsg(null)} />}

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`, padding: "28px 16px 50px", textAlign: "center" }}>
        <Avatar name={user?.name} color={C.accent} size={80} />
        <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 800, marginTop: 12, marginBottom: 4 }}>{user?.name}</h2>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: 0 }}>{user?.email}</p>
        <div style={{ background: "rgba(255,255,255,0.2)", display: "inline-block", padding: "4px 16px", borderRadius: 20, marginTop: 8 }}>
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>👤 Cliente</span>
        </div>
      </div>

      <div style={{ padding: "0 16px", marginTop: -24 }}>
        {/* Menu */}
        <Card style={{ marginBottom: 16, padding: 8 }}>
          {[
            { icon: "✏️", label: "Editar perfil",        desc: "Nome, email, telefone",  key: "edit"          },
            { icon: "📍", label: "Endereços guardados",  desc: "Gerir os seus endereços", key: "addresses"     },
            { icon: "⭐", label: "Minhas avaliações",    desc: "Avaliações que fez",      key: "reviews"       },
            { icon: "🔔", label: "Notificações",         desc: "Gerir alertas",           key: "notifications" },
            { icon: "🔒", label: "Segurança",            desc: "Password e privacidade",  key: "security"      },
            { icon: "❓", label: "Ajuda",                desc: "FAQ e suporte",           key: "help"          },
          ].map((item, i, arr) => (
            <div key={item.key}>
              <div onClick={() => setSection(item.key)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 10px", cursor: "pointer", borderRadius: 10, transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = C.lightGray}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ width: 40, height: 40, borderRadius: 12, background: C.lightGray, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: C.dark, fontSize: 14 }}>{item.label}</div>
                  <div style={{ color: C.gray, fontSize: 12, marginTop: 1 }}>{item.desc}</div>
                </div>
                <span style={{ color: C.gray, fontSize: 18 }}>›</span>
              </div>
              {i < arr.length - 1 && <div style={{ height: 1, background: C.border, marginLeft: 62 }} />}
            </div>
          ))}
        </Card>

        {/* Versão */}
        <p style={{ textAlign: "center", color: C.gray, fontSize: 12, marginBottom: 16 }}>
          BuildMatch v1.0.0 — Universidade de Santiago
        </p>

        <Btn onClick={onLogout} full variant="danger" style={{ marginBottom: 32 }}>Terminar sessão</Btn>
      </div>
    </div>
  );
};
// ============================================================
// ██  PAINEL DO PROFISSIONAL  ██
// ============================================================
const ProfNav = ({ active, onChange }) => (
  <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#1a1a2e", borderTop: `2px solid ${C.accent}`, display: "flex", zIndex: 100, padding: "8px 0 4px" }}>
    {[["dashboard", "📊", "Dashboard"], ["projects", "📋", "Projectos"], ["agenda", "📅", "Agenda"], ["portfolio", "🖼️", "Portfólio"], ["profile", "👷", "Perfil"]].map(([id, icon, label]) => (
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
  const [loading, setL] = useState(true);

  useEffect(() => {
    projectsAPI.list().then(d => setProjects(d.data || [])).catch(() => setProjects([])).finally(() => setL(false));
  }, []);

  const completed = projects.filter(p => p.status === "COMPLETED").length;
  const active = projects.filter(p => p.status === "ACTIVE").length;
  const pending = projects.filter(p => p.status === "PENDING").length;

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
          {[[active, "Activos", "⟳", C.accent], [completed, "Concluídos", "✓", C.success], [pending, "Pendentes", "◷", "#F59E0B"]].map(([v, l, icon, color], i) => (
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
  const [loading, setL] = useState(true);
  const [tab, setTab] = useState("all");

  useEffect(() => {
    projectsAPI.list().then(d => setProjects(d.data || [])).catch(() => setProjects([])).finally(() => setL(false));
  }, []);

  const filtered = tab === "all" ? projects : projects.filter(p =>
    tab === "active" ? p.status === "ACTIVE" : tab === "done" ? p.status === "COMPLETED" : p.status === "PENDING"
  );

  const accept = async (id) => { try { await projectsAPI.update(id, { status: "ACTIVE" }); setProjects(p => p.map(proj => proj.id === id ? { ...proj, status: "ACTIVE" } : proj)); } catch { } };
  const complete = async (id) => { try { await projectsAPI.update(id, { status: "COMPLETED" }); setProjects(p => p.map(proj => proj.id === id ? { ...proj, status: "COMPLETED" } : proj)); } catch { } };

  return (
    <div style={{ padding: "20px 16px", fontFamily: "'DM Sans', sans-serif" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: C.dark, marginBottom: 16 }}>📋 Projectos Recebidos</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", scrollbarWidth: "none" }}>
        {[["all", "Todos"], ["active", "Activos"], ["done", "Concluídos"], ["pending", "Pendentes"]].map(([v, l]) => (
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
              {proj.amount && <div><div style={{ fontSize: 10, color: C.gray }}>VALOR</div><div style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>{proj.amount.toLocaleString()} CVE</div></div>}
              {proj.address && <div><div style={{ fontSize: 10, color: C.gray }}>LOCAL</div><div style={{ fontSize: 13 }}>{proj.address}</div></div>}
            </div>
            {proj.status === "PENDING" && (
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Btn onClick={() => accept(proj.id)} variant="success" small full>✓ Aceitar</Btn>
                <Btn onClick={() => complete(proj.id)} variant="ghost" small full>✕ Recusar</Btn>
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
  const [loading, setL] = useState(true);
  const [date, setDate] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [saving, setSaving] = useState(false);

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
          <div style={{ flex: 1 }}><Input label="Fim" value={end} onChange={e => setEnd(e.target.value)} type="time" /></div>
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
  const [items, setItems] = useState([]);
  const [loading, setL] = useState(true);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("");
  const [saving, setSaving] = useState(false);
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
          <Input label="Categoria" value={cat} onChange={e => setCat(e.target.value)} placeholder="Ex: Residencial, Comercial..." />
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
          {[[prof?.rating?.toFixed(1) || "0.0", "Avaliação"], [prof?.reviewCount || 0, "Avaliações"], [prof?.experience || 0, "Anos exp."]].map(([v, l], i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 18 }}>{v}</div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: "0 16px", marginTop: -24 }}>
        <Card style={{ marginBottom: 16 }}>
          {[["Email", user?.email], ["Localização", prof?.location ? `📍 ${prof.location}` : null], ["Especialidade", prof?.specialty]].filter(([, v]) => v).map(([l, v], i) => (
            <div key={i} style={{ marginBottom: i < 2 ? 12 : 0 }}>
              <div style={{ fontSize: 12, color: C.gray }}>{l}</div>
              <div style={{ fontWeight: 600, color: C.dark, marginTop: 2 }}>{v}</div>
            </div>
          ))}
        </Card>
        {[["✏️", "Editar perfil"], ["🔔", "Notificações"], ["🔒", "Segurança"], ["❓", "Ajuda"]].map(([icon, label], i) => (
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
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const isPro = user?.type === "PROFESSIONAL";

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

  const name = conversation.professional?.user?.name || conversation.client?.name || "Utilizador";
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
              const isMe = msg.senderId === user?.id;
              const showAvatar = !isMe && (i === 0 || messages[i - 1]?.senderId !== msg.senderId);
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
  const [tab, setTab] = useState("about");
  const [loading, setL] = useState(true);

  useEffect(() => {
    professionalsAPI.get(prof.id).then(setData).catch(() => { }).finally(() => setL(false));
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
            {[["Experiência", `${data.experience} anos`], ["Projectos", `${data.reviewCount}+`], ["Localização", data.location || "—"]].map(([l, v], i) => (
              <div key={i}><div style={{ fontWeight: 800, color: C.primary, fontSize: 14 }}>{v}</div><div style={{ fontSize: 11, color: C.gray }}>{l}</div></div>
            ))}
          </div>
        </Card>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <Btn onClick={onMessage} variant="outline" full>💬 Mensagem</Btn>
          <Btn onClick={onSchedule} variant="accent" full>📅 Agendar</Btn>
        </div>
        <div style={{ display: "flex", gap: 4, borderBottom: `2px solid ${C.border}`, marginBottom: 20 }}>
          {["about", "portfolio", "reviews"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "10px 18px", border: "none", background: "transparent", cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: tab === t ? C.primary : C.gray, borderBottom: `2px solid ${tab === t ? C.primary : "transparent"}`, marginBottom: -2 }}>
              {t === "about" ? "Sobre" : t === "portfolio" ? "Portfólio" : "Avaliações"}
            </button>
          ))}
        </div>
        {loading ? <Spinner /> : (
          <>
            {tab === "about" && (
              <div>
                {data.about && <Card style={{ marginBottom: 14 }}><h4 style={{ margin: "0 0 10px", color: C.dark }}>Sobre mim</h4><p style={{ color: C.gray, fontSize: 14, lineHeight: 1.7, margin: 0 }}>{data.about}</p></Card>}
                {data.tags && <Card style={{ marginBottom: 14 }}><h4 style={{ margin: "0 0 12px", color: C.dark }}>Especialidades</h4><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{data.tags.split(",").map((t, i) => <span key={i} style={{ background: `${C.primary}15`, color: C.primary, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{t.trim()}</span>)}</div></Card>}
                {data.priceMin && <Card><h4 style={{ margin: "0 0 8px", color: C.dark }}>Preço</h4><div style={{ fontSize: 20, fontWeight: 800, color: C.accent }}>{data.priceMin}–{data.priceMax} CVE/h</div></Card>}
              </div>
            )}
            {tab === "portfolio" && (
              (data.portfolio || []).length === 0 ? <p style={{ textAlign: "center", color: C.gray, padding: 32 }}>Sem portfólio.</p>
                : (data.portfolio || []).map((item, i) => (
                  <Card key={i} style={{ marginBottom: 12 }}>
                    <div style={{ height: 120, background: `linear-gradient(135deg,${C.primary}20,${C.accent}20)`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10, fontSize: 32 }}>🏠</div>
                    <div style={{ fontWeight: 600, color: C.dark }}>{item.title}</div>
                    {item.description && <div style={{ color: C.gray, fontSize: 13, marginTop: 4 }}>{item.description}</div>}
                  </Card>
                ))
            )}
            {tab === "reviews" && (
              (data.reviews || []).length === 0 ? <p style={{ textAlign: "center", color: C.gray, padding: 32 }}>Sem avaliações ainda.</p>
                : (data.reviews || []).map((r, i) => (
                  <Card key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, color: C.dark }}>{r.author?.name}</span>
                      <span style={{ fontSize: 12, color: C.gray }}>{new Date(r.createdAt).toLocaleDateString("pt")}</span>
                    </div>
                    <Stars rating={r.rating} />
                    <p style={{ color: C.gray, fontSize: 13, lineHeight: 1.6, margin: "8px 0 0" }}>{r.comment}</p>
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
  const [loading, setL] = useState(false);
  const times = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i + 1); return d; });

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
  const [screen, setScreen] = useState("onboarding");
  const [user, setUser] = useState(null);
  const [clientTab, setClientTab] = useState("home");
  const [profTab, setProfTab] = useState("dashboard");
  const [selectedProf, setSelectedProf] = useState(null);
  const [searchQ, setSearchQ] = useState("");
  const [openChat, setOpenChat] = useState(null);
  const [scheduleFor, setScheduleFor] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(link);

    const token = localStorage.getItem("buildmatch_token");
    const saved = localStorage.getItem("buildmatch_user");
    if (token && saved) { setUser(JSON.parse(saved)); setScreen("app"); }
  }, []);

  const login = (u) => { setUser(u); setScreen("app"); };
  const logout = () => { localStorage.clear(); setUser(null); setScreen("login"); };
  const success = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 3000); };

  const isPro = user?.type === "PROFESSIONAL";

  // Chat em ecrã completo
  if (openChat) return <ChatScreen conversation={openChat} user={user} onBack={() => setOpenChat(null)} />;

  // Ecrãs iniciais
  if (screen === "onboarding") return <Onboarding onFinish={() => setScreen("login")} />;
  if (screen === "login") return <Login onLogin={login} />;

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
        case "projects": return <ProfProjects />;
        case "agenda": return <ProfAgenda user={user} />;
        case "portfolio": return <ProfPortfolio user={user} />;
        case "profile": return <ProfProfile user={user} onLogout={logout} />;
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
      case "home": return <ClientHome user={user} onProfSelect={setSelectedProf} onSearch={q => { setSearchQ(q); setClientTab("search"); }} />;
      case "search": return <ClientSearch query={searchQ} onProfSelect={setSelectedProf} />;
      case "projects": return <ClientProjects />;
      case "messages": return <ClientMessages onOpenChat={setOpenChat} />;
      case "profile": return <ClientProfile user={user} onLogout={logout} />;
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