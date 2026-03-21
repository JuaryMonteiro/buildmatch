import { useState, useEffect, useRef } from "react";
import { authAPI, professionalsAPI, projectsAPI, messagesAPI, schedulesAPI } from "./services/api";

// ============================================================
// PALETA OFICIAL BuildMatch
// ============================================================
const COLORS = {
  primary:      "#1F4E8C",
  primaryDark:  "#163a6b",
  primaryLight: "#2a6ab8",
  accent:       "#F57C00",
  accentDark:   "#c96800",
  dark:         "#2E2E2E",
  gray:         "#6B7280",
  lightGray:    "#F5F5F5",
  white:        "#FFFFFF",
  success:      "#22C55E",
  error:        "#EF4444",
  border:       "#E5E7EB",
};

// ============================================================
// CATEGORIAS
// ============================================================
const CATEGORIES = [
  { id: 1, icon: "🧱", name: "Pedreiro" },
  { id: 2, icon: "⚡", name: "Eletricista" },
  { id: 3, icon: "🔧", name: "Canalizador" },
  { id: 4, icon: "🎨", name: "Pintor" },
  { id: 5, icon: "🪵", name: "Carpinteiro" },
  { id: 6, icon: "🏗️", name: "Engenheiro" },
];

// ============================================================
// COMPONENTES BASE
// ============================================================
const Avatar = ({ initials, color, size = 40 }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%",
    background: color || COLORS.primary, color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: size * 0.35, flexShrink: 0,
    fontFamily: "'DM Sans', sans-serif",
  }}>{initials}</div>
);

const StarRating = ({ rating, size = 14 }) => (
  <span>
    {[1,2,3,4,5].map(i => (
      <span key={i} style={{ color: i <= Math.floor(rating) ? "#F59E0B" : "#D1D5DB", fontSize: size }}>★</span>
    ))}
  </span>
);

const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{
    background: COLORS.white, borderRadius: 16,
    boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
    padding: 20, cursor: onClick ? "pointer" : "default", ...style,
  }}>{children}</div>
);

const Btn = ({ children, onClick, variant = "primary", small, full, disabled, style: ex }) => {
  const styles = {
    primary: { background: disabled ? "#9CA3AF" : COLORS.primary, color: "#fff", border: "none" },
    accent:  { background: disabled ? "#9CA3AF" : COLORS.accent,  color: "#fff", border: "none" },
    outline: { background: "transparent", color: COLORS.primary, border: `2px solid ${COLORS.primary}` },
    ghost:   { background: "transparent", color: COLORS.gray,    border: `1px solid ${COLORS.border}` },
    danger:  { background: COLORS.error,  color: "#fff",          border: "none" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...styles[variant],
      padding: small ? "8px 16px" : "12px 22px",
      borderRadius: 10, cursor: disabled ? "not-allowed" : "pointer",
      fontWeight: 600, fontSize: small ? 13 : 14,
      fontFamily: "'DM Sans', sans-serif",
      display: "flex", alignItems: "center", gap: 6,
      justifyContent: "center", width: full ? "100%" : "auto",
      transition: "all 0.2s", whiteSpace: "nowrap", ...ex,
    }}>{children}</button>
  );
};

const Input = ({ label, value, onChange, type = "text", placeholder }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.dark, display: "block", marginBottom: 6 }}>{label}</label>}
    <input value={value} onChange={onChange} type={type} placeholder={placeholder}
      style={{ width: "100%", padding: "12px 14px", border: `1.5px solid ${COLORS.border}`, borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", outline: "none" }} />
  </div>
);

const StatusBadge = ({ status }) => {
  const map = {
    COMPLETED:  { bg: "#D1FAE5", color: "#059669", label: "✓ Concluído" },
    ACTIVE:     { bg: "#DBEAFE", color: "#1D4ED8", label: "⟳ Em andamento" },
    PENDING:    { bg: "#FEF3C7", color: "#D97706", label: "◷ Pendente" },
    CANCELLED:  { bg: "#FEE2E2", color: "#DC2626", label: "✕ Cancelado" },
  };
  const s = map[status] || { bg: "#F3F4F6", color: "#6B7280", label: status };
  return <span style={{ background: s.bg, color: s.color, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{s.label}</span>;
};

const Spinner = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
    <div style={{ width: 36, height: 36, border: `3px solid ${COLORS.border}`, borderTop: `3px solid ${COLORS.primary}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const ErrorMsg = ({ msg }) => msg ? (
  <div style={{ background: "#FEE2E2", color: COLORS.error, padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 12 }}>{msg}</div>
) : null;

const SuccessModal = ({ message, onClose }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
    <div style={{ background: COLORS.white, borderRadius: 24, padding: 32, textAlign: "center", maxWidth: 320, width: "90%" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
      <h3 style={{ color: COLORS.dark, fontWeight: 800, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>Sucesso!</h3>
      <p style={{ color: COLORS.gray, fontSize: 14, lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif", marginBottom: 20 }}>{message}</p>
      <Btn onClick={onClose} variant="primary" full>Fechar</Btn>
    </div>
  </div>
);

// ============================================================
// ONBOARDING
// ============================================================
const OnboardingScreen = ({ onFinish }) => {
  const [step, setStep] = useState(0);
  const slides = [
    { icon: "🔍", title: "Encontre Profissionais Confiáveis", desc: "Aceda a uma rede de profissionais qualificados e verificados da construção civil em Cabo Verde.", bg: COLORS.primary },
    { icon: "⭐", title: "Avaliações Reais e Verificadas", desc: "Tome decisões informadas com avaliações autênticas de outros clientes.", bg: "#163a6b" },
    { icon: "📅", title: "Agende com Facilidade", desc: "Comunique, negoceie e agende serviços directamente pela plataforma.", bg: COLORS.accent },
  ];
  const s = slides[step];
  return (
    <div style={{ minHeight: "100vh", background: s.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, transition: "background 0.5s", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <div style={{ fontSize: 80, marginBottom: 32 }}>{s.icon}</div>
        <h2 style={{ color: "#fff", fontSize: 28, fontWeight: 800, marginBottom: 16, lineHeight: 1.2 }}>{s.title}</h2>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, lineHeight: 1.6, marginBottom: 48 }}>{s.desc}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 40 }}>
          {slides.map((_, i) => (
            <div key={i} onClick={() => setStep(i)} style={{ width: i === step ? 28 : 8, height: 8, borderRadius: 4, background: i === step ? "#fff" : "rgba(255,255,255,0.4)", cursor: "pointer", transition: "all 0.3s" }} />
          ))}
        </div>
        {step < slides.length - 1 ? (
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={onFinish} style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "none", padding: "14px 28px", borderRadius: 12, cursor: "pointer", fontSize: 15, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Saltar</button>
            <button onClick={() => setStep(step + 1)} style={{ background: "#fff", color: s.bg, border: "none", padding: "14px 28px", borderRadius: 12, cursor: "pointer", fontSize: 15, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>Próximo →</button>
          </div>
        ) : (
          <button onClick={onFinish} style={{ background: "#fff", color: s.bg, border: "none", padding: "16px 48px", borderRadius: 14, cursor: "pointer", fontSize: 16, fontWeight: 800, fontFamily: "'DM Sans', sans-serif" }}>Começar agora 🚀</button>
        )}
      </div>
    </div>
  );
};

// ============================================================
// LOGIN / REGISTO — ligado à API real
// ============================================================
const LoginScreen = ({ onLogin }) => {
  const [mode, setMode] = useState("login");
  const [userType, setUserType] = useState("CLIENT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!email || !pass) { setError("Email e password são obrigatórios"); return; }
    if (mode === "register" && !name) { setError("Nome é obrigatório"); return; }

    setLoading(true);
    try {
      let data;
      if (mode === "login") {
        data = await authAPI.login({ email, password: pass });
      } else {
        data = await authAPI.register({ name, email, password: pass, type: userType });
      }
      localStorage.setItem("buildmatch_token", data.token);
      localStorage.setItem("buildmatch_user", JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.lightGray, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ background: COLORS.primary, width: 64, height: 64, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 28 }}>🏗️</div>
          <span style={{ fontSize: 26, fontWeight: 800 }}>
            <span style={{ color: COLORS.primary }}>Build</span>
            <span style={{ color: COLORS.accent }}>Match</span>
          </span>
        </div>
        <Card>
          <div style={{ display: "flex", background: COLORS.lightGray, borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }} style={{
                flex: 1, padding: "10px", border: "none", borderRadius: 8,
                background: mode === m ? COLORS.white : "transparent",
                color: mode === m ? COLORS.primary : COLORS.gray,
                fontWeight: mode === m ? 700 : 500, cursor: "pointer",
                boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                fontSize: 14, fontFamily: "'DM Sans', sans-serif",
              }}>{m === "login" ? "Entrar" : "Criar conta"}</button>
            ))}
          </div>

          {mode === "register" && (
            <>
              <p style={{ fontSize: 13, color: COLORS.gray, marginBottom: 10 }}>Tipo de conta:</p>
              <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                {[["CLIENT", "👤 Cliente"], ["PROFESSIONAL", "🔨 Profissional"]].map(([t, l]) => (
                  <button key={t} onClick={() => setUserType(t)} style={{
                    flex: 1, padding: "12px", border: `2px solid ${userType === t ? COLORS.primary : COLORS.border}`,
                    borderRadius: 10, background: userType === t ? `${COLORS.primary}10` : COLORS.white,
                    color: userType === t ? COLORS.primary : COLORS.gray,
                    fontWeight: 600, cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                  }}>{l}</button>
                ))}
              </div>
              <Input label="Nome completo" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome completo" />
            </>
          )}

          <ErrorMsg msg={error} />
          <Input label="Email" value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="seu@email.com" />
          <Input label="Palavra-passe" value={pass} onChange={e => setPass(e.target.value)} type="password" placeholder="••••••••" />

          <Btn onClick={handleSubmit} full disabled={loading}>
            {loading ? "A processar..." : mode === "login" ? "Entrar na conta" : "Criar conta"}
          </Btn>
        </Card>
      </div>
    </div>
  );
};

// ============================================================
// HOME — ligado à API real
// ============================================================
const HomeScreen = ({ user, onProfessionalSelect, onSearch }) => {
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    professionalsAPI.list({ limit: 4, sortBy: "rating" })
      .then(data => setProfessionals(data.data || []))
      .catch(() => setProfessionals([]))
      .finally(() => setLoading(false));
  }, []);

  const initials = user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`, padding: "28px 20px 40px", borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginBottom: 2 }}>Bem-vindo de volta 👋</p>
            <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: 0 }}>{user?.name || "Utilizador"}</h2>
          </div>
          <Avatar initials={initials} color={COLORS.accent} size={44} />
        </div>
        <div style={{ background: COLORS.white, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
          <span style={{ fontSize: 18 }}>🔍</span>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && onSearch(searchQuery)}
            placeholder="Que tipo de serviço precisa?"
            style={{ border: "none", outline: "none", flex: 1, fontSize: 15, fontFamily: "'DM Sans', sans-serif" }} />
          {searchQuery && (
            <button onClick={() => onSearch(searchQuery)} style={{ background: COLORS.accent, color: "#fff", border: "none", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Buscar</button>
          )}
        </div>
      </div>

      <div style={{ padding: "20px 16px" }}>
        {/* Categorias */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: COLORS.dark, margin: 0 }}>Categorias</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {CATEGORIES.map(cat => (
              <div key={cat.id} onClick={() => onSearch(cat.name)} style={{ background: COLORS.white, borderRadius: 14, padding: "14px 10px", textAlign: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: `1px solid ${COLORS.border}` }}>
                <div style={{ fontSize: 26, marginBottom: 6 }}>{cat.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.dark }}>{cat.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Profissionais recomendados */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: COLORS.dark, margin: 0 }}>Recomendados</h3>
            <span onClick={() => onSearch("")} style={{ color: COLORS.primary, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Ver todos</span>
          </div>
          {loading ? <Spinner /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {professionals.map(prof => (
                <ProfCard key={prof.id} prof={prof} onClick={() => onProfessionalSelect(prof)} />
              ))}
              {professionals.length === 0 && (
                <div style={{ textAlign: "center", padding: 32, color: COLORS.gray }}>
                  <p>Nenhum profissional encontrado.</p>
                  <p style={{ fontSize: 13 }}>Certifique-se que o servidor está a correr.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// CARD DE PROFISSIONAL (reutilizável)
// ============================================================
const ProfCard = ({ prof, onClick }) => {
  const name    = prof.user?.name || "Profissional";
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const colors  = ["#1F4E8C", "#F57C00", "#163a6b", "#c96800", "#2E2E2E"];
  const color   = colors[name.charCodeAt(0) % colors.length];

  return (
    <Card style={{ padding: 16 }} onClick={onClick}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ position: "relative" }}>
          <Avatar initials={initials} color={color} size={52} />
          {prof.available && <div style={{ position: "absolute", bottom: 2, right: 2, width: 12, height: 12, background: COLORS.success, borderRadius: "50%", border: "2px solid white" }} />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 700, color: COLORS.dark, fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}>
                {name}
                {prof.verified && <span style={{ color: COLORS.primary, fontSize: 13 }}>✓</span>}
              </div>
              <div style={{ color: COLORS.gray, fontSize: 13, marginTop: 2 }}>{prof.specialty}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              {prof.priceMin && <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.accent }}>{prof.priceMin}–{prof.priceMax} CVE/h</div>}
              <div style={{ fontSize: 11, color: prof.available ? COLORS.success : COLORS.error, fontWeight: 600, marginTop: 2 }}>{prof.available ? "Disponível" : "Ocupado"}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <StarRating rating={prof.rating} />
            <span style={{ fontSize: 12, fontWeight: 700 }}>{prof.rating?.toFixed(1) || "0.0"}</span>
            <span style={{ fontSize: 12, color: COLORS.gray }}>({prof.reviewCount} av.)</span>
            {prof.location && <span style={{ fontSize: 12, color: COLORS.gray }}>• {prof.location}</span>}
          </div>
        </div>
      </div>
    </Card>
  );
};

// ============================================================
// BUSCA — ligada à API real
// ============================================================
const SearchScreen = ({ query: initialQuery, onProfessionalSelect }) => {
  const [query, setQuery] = useState(initialQuery || "");
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("rating");

  const doSearch = async (q, sort) => {
    setLoading(true);
    try {
      let data;
      if (q) {
        data = await professionalsAPI.search(q);
      } else {
        data = await professionalsAPI.list({ sortBy: sort || sortBy, limit: 20 });
      }
      setProfessionals(data.data || []);
    } catch {
      setProfessionals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { doSearch(initialQuery); }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: COLORS.primary, padding: "20px 16px 24px", borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <div style={{ background: COLORS.white, borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🔍</span>
          <input value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && doSearch(query)}
            placeholder="Pesquisar profissionais..."
            style={{ border: "none", outline: "none", flex: 1, fontSize: 14, fontFamily: "'DM Sans', sans-serif" }} />
          <button onClick={() => doSearch(query)} style={{ background: COLORS.accent, color: "#fff", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Buscar</button>
        </div>
      </div>

      <div style={{ padding: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ color: COLORS.gray, fontSize: 13 }}>{professionals.length} profissionais</span>
          <div style={{ display: "flex", gap: 8 }}>
            {["rating", "experience"].map(s => (
              <button key={s} onClick={() => { setSortBy(s); doSearch(query, s); }} style={{
                padding: "6px 12px", border: `1px solid ${sortBy === s ? COLORS.primary : COLORS.border}`,
                borderRadius: 8, background: sortBy === s ? `${COLORS.primary}10` : COLORS.white,
                color: sortBy === s ? COLORS.primary : COLORS.gray,
                cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
              }}>{s === "rating" ? "⭐ Avaliação" : "🏆 Experiência"}</button>
            ))}
          </div>
        </div>

        {loading ? <Spinner /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {professionals.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px", color: COLORS.gray }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                <p style={{ fontWeight: 600 }}>Nenhum profissional encontrado</p>
              </div>
            ) : professionals.map(prof => (
              <ProfCard key={prof.id} prof={prof} onClick={() => onProfessionalSelect(prof)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// PERFIL DO PROFISSIONAL — ligado à API real
// ============================================================
const ProfessionalProfile = ({ professional, onBack, onMessage, onSchedule }) => {
  const [fullData, setFullData] = useState(professional);
  const [tab, setTab] = useState("about");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    professionalsAPI.get(professional.id)
      .then(data => setFullData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [professional.id]);

  const name     = fullData.user?.name || "Profissional";
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const colors   = ["#1F4E8C", "#F57C00", "#163a6b", "#c96800"];
  const color    = colors[name.charCodeAt(0) % colors.length];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`, padding: "20px 16px 60px", borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans', sans-serif", marginBottom: 20 }}>← Voltar</button>
        <div style={{ textAlign: "center" }}>
          <Avatar initials={initials} color={color} size={80} />
          <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 800, marginTop: 12, marginBottom: 4 }}>{name}</h2>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, margin: 0 }}>{fullData.specialty}</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 }}>
            <StarRating rating={fullData.rating} size={16} />
            <span style={{ color: "#fff", fontWeight: 700 }}>{fullData.rating?.toFixed(1)}</span>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>({fullData.reviewCount} avaliações)</span>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 16px", marginTop: -36 }}>
        <Card style={{ padding: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, textAlign: "center" }}>
            {[["Experiência", `${fullData.experience} anos`], ["Projectos", `${fullData.reviewCount}+`], ["Localização", fullData.location || "—"]].map(([l, v], i) => (
              <div key={i}>
                <div style={{ fontWeight: 800, color: COLORS.primary, fontSize: 14 }}>{v}</div>
                <div style={{ fontSize: 11, color: COLORS.gray }}>{l}</div>
              </div>
            ))}
          </div>
          {fullData.verified && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "flex-end" }}>
              <span style={{ background: `${COLORS.primary}10`, color: COLORS.primary, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>✓ Verificado</span>
            </div>
          )}
        </Card>
      </div>

      <div style={{ padding: "16px 16px 0", display: "flex", gap: 10 }}>
        <Btn onClick={onMessage} variant="outline" full>💬 Mensagem</Btn>
        <Btn onClick={onSchedule} variant="accent" full>📅 Agendar</Btn>
      </div>

      {/* Tabs */}
      <div style={{ padding: "20px 16px 0" }}>
        <div style={{ display: "flex", gap: 4, borderBottom: `2px solid ${COLORS.border}`, marginBottom: 20 }}>
          {["about", "portfolio", "reviews"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "10px 18px", border: "none", background: "transparent", cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: tab === t ? COLORS.primary : COLORS.gray, borderBottom: `2px solid ${tab === t ? COLORS.primary : "transparent"}`, marginBottom: -2 }}>
              {t === "about" ? "Sobre" : t === "portfolio" ? "Portfólio" : "Avaliações"}
            </button>
          ))}
        </div>

        {loading ? <Spinner /> : (
          <>
            {tab === "about" && (
              <div>
                {fullData.about && <Card style={{ marginBottom: 14 }}><h4 style={{ margin: "0 0 10px", color: COLORS.dark }}>Sobre mim</h4><p style={{ color: COLORS.gray, fontSize: 14, lineHeight: 1.7, margin: 0 }}>{fullData.about}</p></Card>}
                {fullData.tags && <Card style={{ marginBottom: 14 }}><h4 style={{ margin: "0 0 12px", color: COLORS.dark }}>Especialidades</h4><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{fullData.tags.split(",").map((tag, i) => <span key={i} style={{ background: `${COLORS.primary}15`, color: COLORS.primary, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{tag.trim()}</span>)}</div></Card>}
                {fullData.priceMin && <Card><h4 style={{ margin: "0 0 8px", color: COLORS.dark }}>Preço</h4><div style={{ fontSize: 20, fontWeight: 800, color: COLORS.accent }}>{fullData.priceMin}–{fullData.priceMax} CVE/h</div></Card>}
              </div>
            )}
            {tab === "portfolio" && (
              <div>
                {(fullData.portfolio || []).length === 0 ? <p style={{ color: COLORS.gray, textAlign: "center", padding: 32 }}>Sem portfólio disponível.</p> :
                  (fullData.portfolio || []).map((item, i) => (
                    <Card key={i} style={{ marginBottom: 12 }}>
                      <div style={{ height: 120, background: `linear-gradient(135deg, ${COLORS.primary}20, ${COLORS.accent}20)`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10, fontSize: 32 }}>🏠</div>
                      <div style={{ fontWeight: 600, color: COLORS.dark }}>{item.title}</div>
                      {item.description && <div style={{ color: COLORS.gray, fontSize: 13, marginTop: 4 }}>{item.description}</div>}
                      {item.category && <span style={{ background: `${COLORS.primary}10`, color: COLORS.primary, padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600, marginTop: 8, display: "inline-block" }}>{item.category}</span>}
                    </Card>
                  ))
                }
              </div>
            )}
            {tab === "reviews" && (
              <div>
                {(fullData.reviews || []).length === 0 ? <p style={{ color: COLORS.gray, textAlign: "center", padding: 32 }}>Sem avaliações ainda.</p> :
                  (fullData.reviews || []).map((r, i) => (
                    <Card key={i} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, color: COLORS.dark }}>{r.author?.name || "Cliente"}</span>
                        <span style={{ fontSize: 12, color: COLORS.gray }}>{new Date(r.createdAt).toLocaleDateString("pt")}</span>
                      </div>
                      <StarRating rating={r.rating} />
                      <p style={{ color: COLORS.gray, fontSize: 13, lineHeight: 1.6, margin: "8px 0 0" }}>{r.comment}</p>
                      {r.reply && <div style={{ background: `${COLORS.primary}08`, borderLeft: `3px solid ${COLORS.primary}`, padding: "8px 12px", marginTop: 10, borderRadius: "0 8px 8px 0", fontSize: 13, color: COLORS.dark }}><strong>Resposta:</strong> {r.reply}</div>}
                    </Card>
                  ))
                }
              </div>
            )}
          </>
        )}
      </div>
      <div style={{ height: 24 }} />
    </div>
  );
};

// ============================================================
// PROJECTOS — ligado à API real
// ============================================================
const ProjectsScreen = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");

  useEffect(() => {
    projectsAPI.list()
      .then(data => setProjects(data.data || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tab === "all" ? projects :
    tab === "active"  ? projects.filter(p => p.status === "ACTIVE") :
    tab === "done"    ? projects.filter(p => p.status === "COMPLETED") :
    projects.filter(p => p.status === "PENDING");

  return (
    <div style={{ padding: "20px 16px", fontFamily: "'DM Sans', sans-serif" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: COLORS.dark, marginBottom: 20 }}>Meus Projectos</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[["Total", projects.length, COLORS.primary], ["Activos", projects.filter(p => p.status === "ACTIVE").length, COLORS.accent], ["Concluídos", projects.filter(p => p.status === "COMPLETED").length, COLORS.success]].map(([l, v, c], i) => (
          <Card key={i} style={{ padding: 14, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: c }}>{v}</div>
            <div style={{ fontSize: 11, color: COLORS.gray }}>{l}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", scrollbarWidth: "none" }}>
        {[["all", "Todos"], ["active", "Activos"], ["done", "Concluídos"], ["pending", "Pendentes"]].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} style={{ padding: "8px 16px", border: "none", borderRadius: 20, cursor: "pointer", background: tab === v ? COLORS.primary : COLORS.white, color: tab === v ? "#fff" : COLORS.gray, fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>{l}</button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, color: COLORS.gray }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
              <p style={{ fontWeight: 600 }}>Sem projectos ainda</p>
            </div>
          ) : filtered.map(proj => (
            <Card key={proj.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.dark }}>{proj.title}</div>
                  <div style={{ color: COLORS.gray, fontSize: 13, marginTop: 2 }}>{proj.professional?.user?.name || "Profissional"}</div>
                </div>
                <StatusBadge status={proj.status} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: `1px solid ${COLORS.border}` }}>
                <div style={{ display: "flex", gap: 16 }}>
                  {proj.startDate && <div><div style={{ fontSize: 10, color: COLORS.gray }}>DATA</div><div style={{ fontSize: 13, fontWeight: 600 }}>{new Date(proj.startDate).toLocaleDateString("pt")}</div></div>}
                  {proj.amount && <div><div style={{ fontSize: 10, color: COLORS.gray }}>VALOR</div><div style={{ fontSize: 13, fontWeight: 700, color: COLORS.accent }}>{proj.amount.toLocaleString()} CVE</div></div>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// MENSAGENS — ligado à API real
// ============================================================
const MessagesScreen = ({ onOpenChat }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    messagesAPI.conversations()
      .then(data => setConversations(data.data || []))
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: "20px 16px", fontFamily: "'DM Sans', sans-serif" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: COLORS.dark, marginBottom: 20 }}>Mensagens</h2>
      {loading ? <Spinner /> : conversations.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: COLORS.gray }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
          <p style={{ fontWeight: 600 }}>Sem mensagens ainda</p>
          <p style={{ fontSize: 13 }}>Contacte um profissional para começar</p>
        </div>
      ) : conversations.map(conv => {
        const lastMsg  = conv.messages?.[0];
        const profName = conv.professional?.user?.name || "Profissional";
        const initials = profName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
        return (
          <div key={conv.id} onClick={() => onOpenChat(conv)} style={{ background: COLORS.white, borderRadius: 14, padding: "14px 16px", display: "flex", gap: 12, alignItems: "center", cursor: "pointer", marginBottom: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: `1px solid ${COLORS.border}` }}>
            <Avatar initials={initials} color={COLORS.primary} size={50} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700, color: COLORS.dark, fontSize: 14 }}>{profName}</span>
                {lastMsg && <span style={{ fontSize: 12, color: COLORS.gray }}>{new Date(lastMsg.createdAt).toLocaleDateString("pt")}</span>}
              </div>
              <div style={{ color: COLORS.gray, fontSize: 13, marginTop: 3 }}>{lastMsg?.content || conv.title}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================
// CHAT — ligado à API real
// ============================================================
const ChatScreen = ({ conversation, user, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const endRef = useRef(null);

  useEffect(() => {
    messagesAPI.history(conversation.id)
      .then(data => setMessages(data.data || []))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [conversation.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    const t = text; setText("");
    try {
      const msg = await messagesAPI.send(conversation.id, { content: t });
      setMessages(m => [...m, msg]);
    } catch {
      setText(t);
    }
  };

  const profName = conversation.professional?.user?.name || "Profissional";
  const initials = profName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: COLORS.primary, padding: "16px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer" }}>←</button>
        <Avatar initials={initials} color={COLORS.accent} size={40} />
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{profName}</div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>{conversation.title}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px", background: COLORS.lightGray, display: "flex", flexDirection: "column", gap: 10 }}>
        {loading ? <Spinner /> : messages.length === 0 ? (
          <div style={{ textAlign: "center", color: COLORS.gray, padding: 32 }}>Sem mensagens ainda. Diga olá!</div>
        ) : messages.map(msg => {
          const isMe = msg.senderId === user?.id;
          return (
            <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "75%", padding: "10px 14px", borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: isMe ? COLORS.primary : COLORS.white, color: isMe ? "#fff" : COLORS.dark, fontSize: 14, lineHeight: 1.5, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                {msg.content}
                <div style={{ fontSize: 10, marginTop: 4, textAlign: "right", opacity: 0.7 }}>{new Date(msg.createdAt).toLocaleTimeString("pt", { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div style={{ background: COLORS.white, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center", borderTop: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Escrever mensagem..."
          style={{ flex: 1, border: `1.5px solid ${COLORS.border}`, borderRadius: 24, padding: "10px 16px", outline: "none", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }} />
        <button onClick={send} style={{ background: COLORS.primary, border: "none", color: "#fff", width: 44, height: 44, borderRadius: "50%", cursor: "pointer", fontSize: 18 }}>→</button>
      </div>
    </div>
  );
};

// ============================================================
// AGENDAMENTO — ligado à API real
// ============================================================
const ScheduleScreen = ({ professional, onBack, onConfirm }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const times = ["08:00","09:00","10:00","11:00","13:00","14:00","15:00","16:00"];
  const days  = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i + 1); return d; });

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) return;
    setLoading(true);
    try {
      await schedulesAPI.create({
        professionalId: professional.id,
        date: selectedDate.toISOString(),
        startTime: selectedTime,
        endTime: selectedTime,
      });
      onConfirm();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: COLORS.primary, padding: "20px 16px 24px", borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#fff", fontSize: 16, cursor: "pointer", marginBottom: 12 }}>← Voltar</button>
        <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 800, margin: 0 }}>Agendar Serviço</h2>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 4 }}>{professional?.user?.name} • {professional?.specialty}</p>
      </div>
      <div style={{ padding: "20px 16px" }}>
        <Card style={{ marginBottom: 16 }}>
          <h4 style={{ margin: "0 0 14px", color: COLORS.dark }}>Seleccionar data</h4>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none" }}>
            {days.map((d, i) => (
              <div key={i} onClick={() => setSelectedDate(d)} style={{ minWidth: 52, textAlign: "center", padding: "10px 6px", borderRadius: 12, cursor: "pointer", background: selectedDate?.getDate() === d.getDate() ? COLORS.primary : COLORS.lightGray, color: selectedDate?.getDate() === d.getDate() ? "#fff" : COLORS.dark, transition: "all 0.2s" }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", opacity: 0.8 }}>{d.toLocaleDateString("pt", { weekday: "short" })}</div>
                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{d.getDate()}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card style={{ marginBottom: 16 }}>
          <h4 style={{ margin: "0 0 14px", color: COLORS.dark }}>Horário</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
            {times.map(t => (
              <button key={t} onClick={() => setSelectedTime(t)} style={{ padding: "10px 4px", border: `1.5px solid ${selectedTime === t ? COLORS.primary : COLORS.border}`, borderRadius: 10, cursor: "pointer", background: selectedTime === t ? `${COLORS.primary}10` : COLORS.white, color: selectedTime === t ? COLORS.primary : COLORS.dark, fontWeight: 600, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>{t}</button>
            ))}
          </div>
        </Card>
        <Card style={{ marginBottom: 20 }}>
          <h4 style={{ margin: "0 0 10px", color: COLORS.dark }}>Descrição do serviço</h4>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva o que precisa ser feito..."
            style={{ width: "100%", border: `1.5px solid ${COLORS.border}`, borderRadius: 10, padding: 12, fontSize: 14, fontFamily: "'DM Sans', sans-serif", resize: "vertical", minHeight: 90, outline: "none", boxSizing: "border-box" }} />
        </Card>
        <Btn onClick={handleConfirm} full variant="accent" disabled={!selectedDate || !selectedTime || loading}>
          {loading ? "A agendar..." : selectedDate && selectedTime ? `Confirmar: ${selectedDate.getDate()} às ${selectedTime}` : "Seleccione data e hora"}
        </Btn>
      </div>
    </div>
  );
};

// ============================================================
// PERFIL DO UTILIZADOR
// ============================================================
const ProfileScreen = ({ user, onLogout }) => (
  <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
    <div style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`, padding: "28px 16px 50px", textAlign: "center" }}>
      <Avatar initials={user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "U"} color={COLORS.accent} size={80} />
      <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 800, marginTop: 12, marginBottom: 4 }}>{user?.name}</h2>
      <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: 0 }}>{user?.type === "PROFESSIONAL" ? "Profissional" : "Cliente"}</p>
    </div>
    <div style={{ padding: "0 16px", marginTop: -24 }}>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontSize: 13, color: COLORS.gray }}>Email</div>
          <div style={{ fontWeight: 600, color: COLORS.dark }}>{user?.email}</div>
        </div>
      </Card>
      {[["👤", "Editar perfil"], ["🔔", "Notificações"], ["🔒", "Segurança"], ["❓", "Ajuda e suporte"]].map(([icon, label], i) => (
        <div key={i} style={{ background: COLORS.white, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", marginBottom: 6, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <span style={{ flex: 1, fontWeight: 500, color: COLORS.dark, fontSize: 14 }}>{label}</span>
          <span style={{ color: COLORS.gray }}>›</span>
        </div>
      ))}
      <div style={{ marginTop: 16, marginBottom: 32 }}>
        <Btn onClick={onLogout} full variant="danger">Terminar sessão</Btn>
      </div>
    </div>
  </div>
);

// ============================================================
// BOTTOM NAV
// ============================================================
const BottomNav = ({ active, onChange }) => (
  <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: COLORS.white, borderTop: `1px solid ${COLORS.border}`, display: "flex", zIndex: 100, padding: "8px 0 4px", boxShadow: "0 -4px 20px rgba(0,0,0,0.08)" }}>
    {[["home","🏠","Início"], ["search","🔍","Buscar"], ["projects","📋","Projectos"], ["messages","💬","Mensagens"], ["profile","👤","Perfil"]].map(([id, icon, label]) => (
      <button key={id} onClick={() => onChange(id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", color: active === id ? COLORS.primary : COLORS.gray }}>{label}</span>
        {active === id && <div style={{ width: 4, height: 4, borderRadius: "50%", background: COLORS.primary }} />}
      </button>
    ))}
  </div>
);

// ============================================================
// APP PRINCIPAL
// ============================================================
export default function BuildMatchApp() {
  const [screen, setScreen]                     = useState("onboarding");
  const [user, setUser]                         = useState(null);
  const [activeTab, setActiveTab]               = useState("home");
  const [selectedProfessional, setSelectedProf] = useState(null);
  const [searchQuery, setSearchQuery]           = useState("");
  const [openChat, setOpenChat]                 = useState(null);
  const [scheduleFor, setScheduleFor]           = useState(null);
  const [successMsg, setSuccessMsg]             = useState(null);

  // Carregar sessão guardada
  useEffect(() => {
    const font = document.createElement("link");
    font.rel = "stylesheet";
    font.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(font);

    const token = localStorage.getItem("buildmatch_token");
    const savedUser = localStorage.getItem("buildmatch_user");
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setScreen("app");
    }
  }, []);

  const handleLogin = (userData) => { setUser(userData); setScreen("app"); };

  const handleLogout = () => {
    localStorage.removeItem("buildmatch_token");
    localStorage.removeItem("buildmatch_user");
    setUser(null);
    setScreen("login");
  };

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 3000); };

  if (openChat) return <ChatScreen conversation={openChat} user={user} onBack={() => setOpenChat(null)} />;
  if (screen === "onboarding") return <OnboardingScreen onFinish={() => setScreen("login")} />;
  if (screen === "login") return <LoginScreen onLogin={handleLogin} />;

  if (scheduleFor) return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: COLORS.lightGray }}>
      <ScheduleScreen professional={scheduleFor} onBack={() => setScheduleFor(null)}
        onConfirm={() => { setScheduleFor(null); showSuccess("Agendamento realizado! O profissional será notificado."); }} />
    </div>
  );

  if (selectedProfessional) return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: COLORS.lightGray }}>
      <div style={{ overflowY: "auto" }}>
        <ProfessionalProfile
          professional={selectedProfessional}
          onBack={() => setSelectedProf(null)}
          onMessage={() => { setSelectedProf(null); setActiveTab("messages"); }}
          onSchedule={() => { const p = selectedProfessional; setSelectedProf(null); setScheduleFor(p); }}
        />
      </div>
      {successMsg && <SuccessModal message={successMsg} onClose={() => setSuccessMsg(null)} />}
    </div>
  );

  const renderScreen = () => {
    switch (activeTab) {
      case "home":     return <HomeScreen user={user} onProfessionalSelect={setSelectedProf} onSearch={q => { setSearchQuery(q); setActiveTab("search"); }} />;
      case "search":   return <SearchScreen query={searchQuery} onProfessionalSelect={setSelectedProf} />;
      case "projects": return <ProjectsScreen />;
      case "messages": return <MessagesScreen onOpenChat={setOpenChat} />;
      case "profile":  return <ProfileScreen user={user} onLogout={handleLogout} />;
      default: return null;
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: COLORS.lightGray, position: "relative" }}>
      <div style={{ paddingBottom: 70, overflowY: "auto" }}>{renderScreen()}</div>
      <BottomNav active={activeTab} onChange={tab => { setActiveTab(tab); setSearchQuery(""); }} />
      {successMsg && <SuccessModal message={successMsg} onClose={() => setSuccessMsg(null)} />}
    </div>
  );
}