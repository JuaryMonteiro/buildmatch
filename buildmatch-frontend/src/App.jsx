import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { authAPI, professionalsAPI, projectsAPI, messagesAPI, schedulesAPI, proposalsAPI, contractsAPI, milestonesAPI, paymentsAPI, disputesAPI, reviewsAPI } from "./services/api";
import logo from "./assets/logo.png";
import AppHeader from "./components/AppHeader";
import Footer from "./components/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome, faSearch, faClipboardList, faComments, faUser, faUsers,
  faChartBar, faCalendarAlt, faImages, faHardHat,
  faBell, faLock, faQuestionCircle, faStar, faMapMarkerAlt,
  faPencilAlt, faCamera, faSignOutAlt, faSave, faPlus, faTimes, faCheck,
  faArrowLeft, faPaperPlane, faPhone, faEnvelope,
  faTools, faBolt, faFaucet, faPaintRoller, faTree, faDraftingCompass,
  faWrench, faChevronRight, faChevronDown,
  faCheckCircle, faClock,
  faShieldAlt, faReply,
  faTachometerAlt, faMoneyBillWave,
  faExclamationCircle, faInfoCircle, faLightbulb,
  faUserCheck,
  faBuilding, faKey,
  faHammer, faChartLine, faCog,
} from "@fortawesome/free-solid-svg-icons";
import AdminDashboard from "./AdminDashboard";
// ── Componente ícone ───────────────────────────────────────
const Icon = ({ icon, size = 16, color, style: ex }) => (
  <FontAwesomeIcon icon={icon} style={{ fontSize: size, color: color || "currentColor", ...ex }} />
);

// ── Mapa de ícones por categoria ───────────────────────────
const categoryIconMap = {
  "Pedreiro": faTools,
  "Eletricista": faBolt,
  "Canalizador": faFaucet,
  "Pintor": faPaintRoller,
  "Carpinteiro": faTree,
  "Engenheiro": faDraftingCompass,
};

// ============================================================
// PALETA OFICIAL BuildMatch
// ============================================================
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

const BASE = import.meta.env.BASE_URL;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || "http://localhost:3001";

const parseImages = (imageUrls) => {
  if (!imageUrls) return [];
  if (Array.isArray(imageUrls)) return imageUrls.filter(Boolean);
  try {
    const parsed = JSON.parse(imageUrls);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return typeof imageUrls === "string" ? imageUrls.split(",").filter(Boolean) : [];
  }
};
const stringifyImages = (arr) => JSON.stringify(arr || []);

const CATEGORIES = [
  { name: "Pedreiro", img: `${BASE}categories/pedreiro.webp` },
  { name: "Eletricista", img: `${BASE}categories/eletricista.webp` },
  { name: "Canalizador", img: `${BASE}categories/canalizador.webp` },
  { name: "Pintor", img: `${BASE}categories/pintor.webp` },
  { name: "Carpinteiro", img: `${BASE}categories/carpinteiro.webp` },
  { name: "Engenheiro", img: `${BASE}categories/engenheiro.webp` },
];

// ============================================================
// COMPONENTES BASE
// ============================================================
const Avatar = ({ name = "", color, size = 40, src }) => {
  if (src) {
    return (
      <img src={src} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
    );
  }
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

// ── Leaflet Map Component ──────────────────────────────────
const LeafletMap = ({ lat, lng, radius, editable, onCoordsChange }) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const containerId = useRef("map-" + Math.random().toString(36).substring(2, 9));

  useEffect(() => {
    if (!window.L) {
      console.warn("Leaflet not loaded yet.");
      return;
    }

    const defaultLat = parseFloat(lat) || 14.921; // Praia as default
    const defaultLng = parseFloat(lng) || -23.508;

    // Initialize map
    const map = window.L.map(containerId.current).setView([defaultLat, defaultLng], 12);
    mapRef.current = map;

    // Load OpenStreetMap tiles
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    // Create marker
    const marker = window.L.marker([defaultLat, defaultLng], {
      draggable: !!editable
    }).addTo(map);
    markerRef.current = marker;

    // Create circle if radius is provided
    if (radius) {
      const circle = window.L.circle([defaultLat, defaultLng], {
        color: '#E05A47',
        fillColor: '#E05A47',
        fillOpacity: 0.12,
        radius: parseFloat(radius) * 1000 // Convert km to meters
      }).addTo(map);
      circleRef.current = circle;
    }

    // Handle updates when coordinate changes via drag/click
    if (editable && onCoordsChange) {
      marker.on("dragend", () => {
        const position = marker.getLatLng();
        onCoordsChange(position.lat, position.lng);
        if (circleRef.current) {
          circleRef.current.setLatLng(position);
        }
      });

      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        onCoordsChange(lat, lng);
        if (circleRef.current) {
          circleRef.current.setLatLng([lat, lng]);
        }
      });
    }

    // Adjust map sizing
    setTimeout(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    }, 200);

    return () => {
      map.remove();
    };
  }, [lat, lng, editable]);

  // Update circle radius dynamically if changed
  useEffect(() => {
    if (circleRef.current && radius) {
      circleRef.current.setRadius(parseFloat(radius) * 1000);
    }
  }, [radius]);

  return (
    <div style={{ position: "relative", marginBottom: 16 }}>
      <div id={containerId.current} style={{ height: 260, width: "100%", borderRadius: 12, border: "1px solid #E5E7EB", zIndex: 1 }} />
    </div>
  );
};

const ErrMsg = ({ msg }) => msg ? <div style={{ background: "#FEE2E2", color: C.error, padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 12 }}>{msg}</div> : null;

const SuccessModal = ({ message, onClose }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
    <div style={{ background: C.white, borderRadius: 24, padding: 32, textAlign: "center", maxWidth: 320, width: "90%" }}>
      <Icon icon={faCheckCircle} size={56} color={C.success} />
      <h3 style={{ color: C.dark, fontWeight: 800, marginBottom: 8, fontFamily: "'DM Sans', sans-serif", marginTop: 12 }}>Sucesso!</h3>
      <p style={{ color: C.gray, fontSize: 14, lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif", marginBottom: 20 }}>{message}</p>
      <Btn onClick={onClose} variant="primary" full>Fechar</Btn>
    </div>
  </div>
);

const StatCard = ({ icon, label, value, color = C.primary }) => (
  <Card style={{ padding: 16, textAlign: "center" }}>
    <Icon icon={icon} size={28} color={color} />
    <div style={{ fontSize: 22, fontWeight: 800, color, marginTop: 8 }}>{value}</div>
    <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>{label}</div>
  </Card>
);

const StatusBadge = ({ status }) => {
  const map = {
    COMPLETED: { bg: "#D1FAE5", color: "#059669", label: "Concluído", icon: faCheck },
    ACTIVE: { bg: "#DBEAFE", color: "#1D4ED8", label: "Em andamento", icon: faClock },
    PENDING: { bg: "#FEF3C7", color: "#D97706", label: "Pendente", icon: faClock },
    CANCELLED: { bg: "#FEE2E2", color: "#DC2626", label: "Cancelado", icon: faTimes },
  };
  const s = map[status] || { bg: "#F3F4F6", color: C.gray, label: status, icon: faInfoCircle };
  return (
    <span style={{ background: s.bg, color: s.color, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
      <Icon icon={s.icon} size={10} color={s.color} /> {s.label}
    </span>
  );
};

const Toggle = ({ value, onChange, accentColor = C.primary }) => (
  <div onClick={onChange} style={{ width: 44, height: 24, borderRadius: 12, background: value ? accentColor : C.border, position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
    <div style={{ position: "absolute", top: 2, left: value ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
  </div>
);

// ============================================================
// ONBOARDING
// ============================================================
const Onboarding = ({ onFinish }) => {
  const [step, setStep] = useState(0);
  const slides = [
    { icon: faSearch, title: "Encontre Profissionais Confiáveis", desc: "Aceda a uma rede de profissionais qualificados e verificados da construção civil em Cabo Verde.", bg: C.primary },
    { icon: faStar, title: "Avaliações Reais e Verificadas", desc: "Tome decisões informadas com avaliações autênticas de outros clientes.", bg: "#163a6b" },
    { icon: faCalendarAlt, title: "Agende com Facilidade", desc: "Comunique, negoceie e agende serviços directamente pela plataforma.", bg: C.accent },
  ];
  const s = slides[step];
  return (
    <div style={{ minHeight: "100vh", background: s.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, transition: "background 0.5s", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <div style={{ marginBottom: 32, opacity: 0.9 }}>
          <Icon icon={s.icon} size={80} color="#fff" />
        </div>
        <h2 style={{ color: "#fff", fontSize: 28, fontWeight: 800, marginBottom: 16, lineHeight: 1.2 }}>{s.title}</h2>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, lineHeight: 1.6, marginBottom: 48 }}>{s.desc}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 40 }}>
          {slides.map((_, i) => <div key={i} onClick={() => setStep(i)} style={{ width: i === step ? 28 : 8, height: 8, borderRadius: 4, background: i === step ? "#fff" : "rgba(255,255,255,0.4)", cursor: "pointer", transition: "all 0.3s" }} />)}
        </div>
        {step < slides.length - 1
          ? <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={onFinish} style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "none", padding: "14px 28px", borderRadius: 12, cursor: "pointer", fontSize: 15, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Saltar</button>
            <button onClick={() => setStep(step + 1)} style={{ background: "#fff", color: s.bg, border: "none", padding: "14px 28px", borderRadius: 12, cursor: "pointer", fontSize: 15, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
              Próximo <Icon icon={faChevronRight} size={14} color={s.bg} />
            </button>
          </div>
          : <button onClick={onFinish} style={{ background: "#fff", color: s.bg, border: "none", padding: "16px 48px", borderRadius: 14, cursor: "pointer", fontSize: 16, fontWeight: 800, fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 8, margin: "0 auto" }}>
            Começar agora <Icon icon={faChevronRight} size={16} color={s.bg} />
          </button>
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

    if (mode === "register") {
      localStorage.setItem("buildmatch_pending_verification", "1");
    }

    onLogin(data.user);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={{ minHeight: "100vh", background: C.lightGray, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", }}>
          <img src={logo} alt="BuildMatch Logo" style={{ width: 180 }} />
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
                {[["CLIENT", "Cliente", faUser], ["PROFESSIONAL", "Profissional", faHardHat]].map(([t, l, ico]) => (
                  <button key={t} onClick={() => setType(t)} style={{ flex: 1, padding: "14px 8px", border: `2px solid ${type === t ? C.primary : C.border}`, borderRadius: 12, background: type === t ? `${C.primary}10` : C.white, color: type === t ? C.primary : C.gray, fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <Icon icon={ico} size={16} color={type === t ? C.primary : C.gray} /> {l}
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
          {mode === "login" && (
            <p style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: C.gray }}>
              <button
                id="forgot-password-link"
                onClick={() => setMode("forgot")}
                style={{ background: "none", border: "none", color: C.primary, fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}
              >
                Esqueci-me da password
              </button>
            </p>
          )}
          {mode === "forgot" && (
            <ForgotPasswordInline onBack={() => setMode("login")} />
          )}
        </Card>
      </div>
    </div>
  );
};

// Formulário inline de recuperação de password (dentro do Login)
const ForgotPasswordInline = ({ onBack }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    if (!email) { setError("Email é obrigatório"); return; }
    setLoading(true); setError("");
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) return (
    <div style={{ textAlign: "center", padding: "16px 0" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
      <p style={{ fontWeight: 700, color: C.dark }}>Email enviado!</p>
      <p style={{ color: C.gray, fontSize: 13 }}>Verifique a sua caixa de entrada. O link expira em 1 hora.</p>
      <button onClick={onBack} style={{ marginTop: 16, background: "none", border: "none", color: C.primary, fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>← Voltar ao login</button>
    </div>
  );

  return (
    <div>
      <p style={{ fontWeight: 700, color: C.dark, marginBottom: 4 }}>Recuperar password</p>
      <p style={{ color: C.gray, fontSize: 13, marginBottom: 16 }}>Introduza o seu email para receber o link de recuperação.</p>
      <ErrMsg msg={error} />
      <Input label="Email" value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="seu@email.com" />
      <Btn onClick={handleSend} full disabled={loading}>{loading ? "A enviar..." : "Enviar link de recuperação"}</Btn>
      <button onClick={onBack} style={{ marginTop: 12, background: "none", border: "none", color: C.gray, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif", display: "block", textAlign: "center", width: "100%" }}>← Voltar</button>
    </div>
  );
};

// ============================================================
// BOTTOM NAV CLIENTE
// ============================================================
const ClientNav = ({ active, onChange }) => (
  <div className="bottom-nav">
    {[
      ["home", faHome, "Início"],
      ["search", faSearch, "Buscar"],
      ["projects", faClipboardList, "Projectos"],
      ["messages", faComments, "Chat"],
      ["profile", faUser, "Perfil"],
    ].map(([id, icon, label]) => (
      <button key={id} onClick={() => onChange(id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
        <Icon icon={icon} size={20} color={active === id ? C.primary : C.gray} />
        <span style={{ fontSize: 10, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", color: active === id ? C.primary : C.gray }}>{label}</span>
        {active === id && <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.primary }} />}
      </button>
    ))}
  </div>
);

// ============================================================
// BOTTOM NAV PROFISSIONAL
// ============================================================
const ProfNav = ({ active, onChange }) => (
  <div className="bottom-nav" style={{ background: "#1a1a2e", borderTop: `2px solid ${C.accent}` }}>
    {[
      ["dashboard", faTachometerAlt, "Dashboard"],
      ["projects", faClipboardList, "Projectos"],
      ["messages", faComments, "Mensagens"],
      ["agenda", faCalendarAlt, "Agenda"],
      ["portfolio", faImages, "Portfólio"],
      ["profile", faHardHat, "Perfil"],
    ].map(([id, icon, label]) => (
      <button key={id} onClick={() => onChange(id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "none", border: "none", cursor: "pointer", padding: "4px 0", minWidth: 0 }}>
        <Icon icon={icon} size={18} color={active === id ? C.accent : "#9CA3AF"} />
        <span style={{ fontSize: 9, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", color: active === id ? C.accent : "#9CA3AF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", paddingLeft: 2, paddingRight: 2 }}>{label}</span>
        {active === id && <div style={{ width: 16, height: 3, borderRadius: 2, background: C.accent }} />}
      </button>
    ))}
  </div>
);

// ============================================================
// CARD DE PROFISSIONAL
// ============================================================
const ProfCard = ({ prof, onClick }) => {
  const name = prof.user?.name || "Profissional";
  return (
    <Card style={{ padding: 16, marginBottom: 12 }} onClick={onClick}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ position: "relative" }}>
          <Avatar name={name} size={52} src={prof.user?.avatar} />
          {prof.available && <div style={{ position: "absolute", bottom: 2, right: 2, width: 12, height: 12, background: C.success, borderRadius: "50%", border: "2px solid white" }} />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 700, color: C.dark, fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}>
                {name}
                {prof.verified && <Icon icon={faUserCheck} size={12} color={C.primary} />}
              </div>
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
            {prof.location && <span style={{ fontSize: 12, color: C.gray, display: "flex", alignItems: "center", gap: 3 }}><Icon icon={faMapMarkerAlt} size={10} color={C.gray} /> {prof.location}</span>}
          </div>
        </div>
      </div>
    </Card>
  );
};

// ============================================================
// SEARCH SUGGESTIONS
// ============================================================
const SearchSuggestions = ({ query, onSelect, visible }) => {
  const SUGGESTIONS = [
    { label: "Pedreiro", icon: faTools },
    { label: "Eletricista", icon: faBolt },
    { label: "Canalizador", icon: faFaucet },
    { label: "Pintor", icon: faPaintRoller },
    { label: "Carpinteiro", icon: faTree },
    { label: "Engenheiro Civil", icon: faDraftingCompass },
    { label: "Serralheiro", icon: faWrench },
    { label: "Arquitecto", icon: faDraftingCompass },
  ];

  const filtered = query
    ? SUGGESTIONS.filter(s => s.label.toLowerCase().includes(query.toLowerCase()))
    : SUGGESTIONS;

  if (!visible || filtered.length === 0) return null;

  return (
    <div style={{
      position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
      background: C.white, borderRadius: 14, marginTop: 6,
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden",
      border: `1px solid ${C.border}`
    }}>
      {!query && (
        <div style={{
          padding: "10px 16px 6px", fontSize: 11, fontWeight: 700,
          color: C.gray, textTransform: "uppercase", letterSpacing: 0.8
        }}>
          Sugestões populares
        </div>
      )}
      {filtered.map((s, i) => (
        <div key={i} onClick={() => onSelect(s.label)}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "11px 16px", cursor: "pointer", transition: "background 0.15s",
            borderTop: i > 0 ? `1px solid ${C.border}` : "none"
          }}
          onMouseEnter={e => e.currentTarget.style.background = C.lightGray}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: `${C.primary}12`, display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0
          }}>
            <Icon icon={s.icon} size={15} color={C.primary} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 500, color: C.dark }}>{s.label}</span>
          <Icon icon={faChevronRight} size={11} color={C.gray} style={{ marginLeft: "auto" }} />
        </div>
      ))}
    </div>
  );
};

const PinterestGallery = ({ onProfSelect, onMessage }) => {
  const [items,    setItems]    = useState([]);
  const [loading,  setL]        = useState(true);
  const [selected, setSelected] = useState(null);
  const [related,  setRelated]  = useState([]);

  useEffect(() => {
    professionalsAPI.list({ limit: 20 }).then(async d => {
      const profs = d.data || [];
      const all = [];
      for (const prof of profs) {
        try {
          const { portfolioAPI } = await import("./services/api");
          const port = await portfolioAPI.list(prof.id);
          (port.data || []).forEach(item => all.push({ ...item, prof }));
        } catch {
          /* ignore error */
        }
      }
      setItems(all);
    }).catch(() => setItems([])).finally(() => setL(false));
  }, []);

  const openItem = (item) => {
    setSelected(item);
    // sugestões da mesma categoria ou profissional
    const rel = items.filter(i =>
      i.id !== item.id &&
      (i.category === item.category || i.prof?.id === item.prof?.id)
    ).slice(0, 6);
    setRelated(rel);
  };

  const col1 = items.filter((_, i) => i % 2 === 0);
  const col2 = items.filter((_, i) => i % 2 !== 0);

  const CATEGORY_COLORS = {
    "Residencial": { bg: `${C.primary}15`, color: C.primary  },
    "Comercial":   { bg: `${C.accent}15`,  color: C.accent   },
    "Industrial":  { bg: "#7C3AED15",      color: "#7C3AED"  },
  };

  const PinCard = ({ item }) => {
    const imgs    = parseImages(item.imageUrls);
    const catStyle = CATEGORY_COLORS[item.category] || { bg: `${C.primary}15`, color: C.primary };
    return (
      <div onClick={() => openItem(item)}
        style={{ borderRadius: 16, overflow: "hidden", background: C.white,
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: 10,
          cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.14)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)";    e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)"; }}
      >
        {imgs[0]
          ? <img src={imgs[0]} alt={item.title}
              style={{ width: "100%", display: "block", objectFit: "cover",
                maxHeight: 200, minHeight: 90 }} />
          : <div style={{ height: 110 + (item.title?.length % 4) * 20,
             background: C.primary,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon icon={faBuilding} size={32} color={`${C.primary}50`} />
            </div>
        }
        <div style={{ padding: "8px 10px 10px" }}>
          {item.category && (
            <span style={{ background: catStyle.bg, color: catStyle.color,
              fontSize: 9, fontWeight: 700, padding: "2px 7px",
              borderRadius: 8, display: "inline-block", marginBottom: 4 }}>
              {item.category}
            </span>
          )}
          <div style={{ fontWeight: 700, color: C.dark, fontSize: 12, lineHeight: 1.3 }}>
            {item.title}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5 }}>
            <Avatar name={item.prof?.user?.name || "?"} size={16} src={item.prof?.user?.avatar} />
            <span style={{ fontSize: 10, color: C.gray, fontWeight: 500 }}>
              {item.prof?.user?.name}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <Spinner />;
  if (items.length === 0) return null;

  return (
    <div>
      {/* Galeria */}
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>{col1.map((item, i) => <PinCard key={i} item={item} />)}</div>
        <div style={{ flex: 1 }}>{col2.map((item, i) => <PinCard key={i} item={item} />)}</div>
      </div>

      {/* Modal */}
      {selected && (
        <div onClick={() => setSelected(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
            zIndex: 300, overflowY: "auto", padding: "20px 16px" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: C.white, borderRadius: 24, maxWidth: 480,
              margin: "0 auto", overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>

            {/* Fotos */}
            {(() => {
              const imgs = parseImages(selected.imageUrls);
              return imgs.length > 0 ? (
                <div>
                  <img src={imgs[0]} alt={selected.title}
                    style={{ width: "100%", maxHeight: 260, objectFit: "cover", display: "block" }} />
                  {imgs.length > 1 && (
                    <div style={{ display: "flex", gap: 6, padding: "8px 10px",
                      background: "#111", overflowX: "auto" }}>
                      {imgs.map((img, i) => (
                        <img key={i} src={img} alt=""
                          style={{ width: 52, height: 52, borderRadius: 8,
                            objectFit: "cover", flexShrink: 0,
                            border: `2px solid ${C.accent}` }} />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ height: 160,
                   background: C.primary,
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon icon={faBuilding} size={56} color={`${C.primary}50`} />
                </div>
              );
            })()}

            <div style={{ padding: "18px 18px 24px" }}>
              {/* Categoria */}
              {selected.category && (
                <span style={{ background: `${C.accent}15`, color: C.accent,
                  fontSize: 11, fontWeight: 700, padding: "3px 10px",
                  borderRadius: 10, display: "inline-block", marginBottom: 8 }}>
                  {selected.category}
                </span>
              )}

              {/* Título */}
              <h3 style={{ fontSize: 18, fontWeight: 800, color: C.dark, margin: "0 0 8px" }}>
                {selected.title}
              </h3>

              {/* Descrição */}
              {selected.description && (
                <p style={{ color: C.gray, fontSize: 13, lineHeight: 1.6, margin: "0 0 14px" }}>
                  {selected.description}
                </p>
              )}

              {/* Profissional */}
              <div onClick={() => { setSelected(null); onProfSelect(selected.prof); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                  background: C.lightGray, borderRadius: 12, marginBottom: 14, cursor: "pointer" }}>
                <Avatar name={selected.prof?.user?.name} size={40} src={selected.prof?.user?.avatar} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: C.dark, fontSize: 14 }}>
                    {selected.prof?.user?.name}
                  </div>
                  <div style={{ color: C.gray, fontSize: 12 }}>{selected.prof?.specialty}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Stars rating={selected.prof?.rating} size={12} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.dark }}>
                    {selected.prof?.rating?.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Botões */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button onClick={() => { setSelected(null); onProfSelect(selected.prof); }}
                  style={{ flex: 1, padding: "11px", border: `1.5px solid ${C.primary}`,
                    borderRadius: 12, background: "transparent", cursor: "pointer",
                    fontSize: 13, fontWeight: 600, color: C.primary,
                    fontFamily: "'DM Sans', sans-serif",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Icon icon={faUser} size={13} color={C.primary} /> Ver perfil
                </button>
                <button onClick={() => { setSelected(null); onMessage(selected.prof); }}
                  style={{ flex: 1, padding: "11px", border: "none",
                    borderRadius: 12, background: C.accent, cursor: "pointer",
                    fontSize: 13, fontWeight: 700, color: "#fff",
                    fontFamily: "'DM Sans', sans-serif",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Icon icon={faComments} size={13} color="#fff" /> Pedir orçamento
                </button>
              </div>

              {/* Sugestões relacionadas */}
              {related.length > 0 && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: C.gray,
                    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                    Projectos semelhantes
                  </p>
                  <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none" }}>
                    {related.map((item, i) => {
                      const imgs = parseImages(item.imageUrls);
                      return (
                        <div key={i} onClick={() => openItem(item)}
                          style={{ flexShrink: 0, width: 100, borderRadius: 12,
                            overflow: "hidden", cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                          {imgs[0]
                            ? <img src={imgs[0]} alt={item.title}
                                style={{ width: "100%", height: 80,
                                  objectFit: "cover", display: "block" }} />
                            : <div style={{ height: 80,
                                background: C.primary,
                                display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Icon icon={faBuilding} size={24} color={`${C.primary}50`} />
                              </div>
                          }
                          <div style={{ padding: "5px 7px", background: C.white }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: C.dark,
                              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {item.title}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Fechar */}
              <button onClick={() => setSelected(null)}
                style={{ width: "100%", marginTop: 14, padding: "11px",
                  border: `1px solid ${C.border}`, borderRadius: 12,
                  background: "transparent", cursor: "pointer",
                  fontSize: 13, fontWeight: 600, color: C.gray,
                  fontFamily: "'DM Sans', sans-serif" }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
const ClientHome = ({ onProfSelect, onSearch, onOpenChat, categories }) => {
  const [profs, setProfs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    professionalsAPI.list({ limit: 4, sortBy: "rating" })
      .then(d => setProfs(d.data || [])).catch(() => setProfs([])).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ padding: "20px 16px" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.dark, marginBottom: 14 }}>Categorias</h3>
        <div className="categories-grid">
          {(categories && categories.length > 0 ? categories : CATEGORIES).map((cat, i) => {
            const imgUrl = cat.img && (cat.img.startsWith("http") || cat.img.startsWith("/"))
              ? cat.img
              : `${BASE}${cat.img || ""}`;
            return (
              <div key={i} className="category-card" onClick={() => onSearch(cat.name)}>
                <img src={imgUrl} alt={cat.name}
                  onError={e => {
                    e.target.style.display = "none";
                    e.target.parentElement.style.background = i % 2 === 0 ? C.primary : C.accent;
                    const fb = e.target.parentElement.querySelector(".cat-icon-fallback");
                    if (fb) fb.style.display = "flex";
                  }}
                />
                <div className="cat-icon-fallback" style={{ display: "none", position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
                  <Icon icon={categoryIconMap[cat.name] || faTools} size={32} color="rgba(255,255,255,0.8)" />
                </div>
                <div className="overlay" />
                <div className="label">{cat.name}</div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.dark, margin: 0 }}>Recomendados</h3>
          <span onClick={() => onSearch("")} style={{ color: C.primary, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Ver todos</span>
        </div>

        {loading ? <Spinner /> : (profs.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
            {profs.map(prof => (
              <ProfCard key={prof.id} prof={prof} onClick={() => onProfSelect(prof)} />
            ))}
          </div>
        ))}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, marginTop: 8 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.dark, margin: 0 }}>
            Inspirações
          </h3>
          <span style={{ color: C.primary, fontSize: 13, fontWeight: 600 }}>Portfólios</span>
        </div>
        <PinterestGallery
          onProfSelect={onProfSelect}
          onMessage={async (prof) => {
            try {
              const project = await projectsAPI.create({
                title: `Contacto — ${prof.specialty}`,
                professionalId: prof.id,
                description: "Pedido de orçamento via portfólio"
              });
              onOpenChat({ id: project.id, title: `Contacto — ${prof.specialty}`, professional: prof });
            } catch {
              /* ignore error */
            }
          }}
        />

       </div>
    </div>
  );
};

// ============================================================
// BUSCA DO CLIENTE
// ============================================================
const ClientSearch = ({ query: initQ, onProfSelect }) => {
  const [q, setQ] = useState(initQ || "");
  const [profs, setProfs] = useState([]);
  const [loading, setL] = useState(false);
  const [sortBy, setSortBy] = useState("rating");
  const [priceMax, setPriceMax] = useState("");
  const [searched, setSearched] = useState(!!initQ);
  const [phIndex, setPhIndex] = useState(0);
  const [phVisible, setPhVisible] = useState(true);
  // Geolocalização
  const [geoLat, setGeoLat] = useState(null);
  const [geoLng, setGeoLng] = useState(null);
  const [geoRadius, setGeoRadius] = useState(10);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");

  const SUGGESTIONS = [
    { label: "Pedreiro", icon: faTools },
    { label: "Eletricista", icon: faBolt },
    { label: "Canalizador", icon: faFaucet },
    { label: "Pintor", icon: faPaintRoller },
    { label: "Carpinteiro", icon: faTree },
    { label: "Engenheiro Civil", icon: faDraftingCompass },
    { label: "Serralheiro", icon: faWrench },
    { label: "Arquitecto", icon: faDraftingCompass },
  ];

  const PLACEHOLDERS = SUGGESTIONS.map(s => `Pesquisar ${s.label}...`);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhVisible(false);
      setTimeout(() => {
        setPhIndex(i => (i + 1) % PLACEHOLDERS.length);
        setPhVisible(true);
      }, 400);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const search = async (query, sort) => {
    setSearched(true);
    setL(true);
    try {
      const params = { sortBy: sort || sortBy, limit: 20 };
      if (geoLat && geoLng) {
        params.lat = geoLat;
        params.lng = geoLng;
        params.radius = geoRadius;
      }
      const data = query
        ? await professionalsAPI.search(query)
        : await professionalsAPI.list(params);
      let results = data.data || [];
      if (priceMax) results = results.filter(p => !p.priceMin || p.priceMin <= parseInt(priceMax));
      setProfs(results);
    } catch { setProfs([]); } finally { setL(false); }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) { setGeoError("Geolocalização não suportada neste browser"); return; }
    setGeoLoading(true); setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLat(pos.coords.latitude);
        setGeoLng(pos.coords.longitude);
        setGeoLoading(false);
      },
      () => { setGeoError("Não foi possível obter a localização"); setGeoLoading(false); }
    );
  };

  useEffect(() => { if (initQ) search(initQ); }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        .ph-text { transition: opacity 0.4s ease; }
        .ph-visible { opacity: 1; }
        .ph-hidden  { opacity: 0; }
      `}</style>

      {/* Barra de pesquisa */}
      <div style={{
        background: C.white, padding: "20px 16px 16px",
        borderBottom: `1px solid ${C.border}`
      }}>
        <div style={{
          background: C.lightGray, borderRadius: 12, padding: "12px 14px",
          display: "flex", alignItems: "center", gap: 10
        }}>
          <Icon icon={faSearch} size={16} color={C.gray} />
          <div style={{ flex: 1, position: "relative" }}>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === "Enter" && search(q)}
              style={{
                background: "transparent", border: "none", outline: "none",
                width: "100%", fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                color: C.dark, position: "relative", zIndex: 1
              }}
            />
            {!q && (
              <span className={`ph-text ${phVisible ? "ph-visible" : "ph-hidden"}`}
                style={{
                  position: "absolute", left: 0, top: 0, fontSize: 14,
                  color: C.gray, pointerEvents: "none",
                  fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap"
                }}>
                {PLACEHOLDERS[phIndex]}
              </span>
            )}
          </div>
          {q && (
            <button onClick={() => setQ("")}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
              <Icon icon={faTimes} size={13} color={C.gray} />
            </button>
          )}
          <button onClick={() => search(q)}
            style={{
              background: C.primary, color: "#fff", border: "none",
              padding: "6px 12px", borderRadius: 8, cursor: "pointer",
              fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif"
            }}>
            Buscar
          </button>
        </div>
      </div>

      <div style={{ padding: 16 }}>


        {/* Filtros — sempre visíveis */}
        <Card style={{ padding: 14, marginBottom: 16 }}>
          <p style={{
            fontSize: 13, fontWeight: 700, color: C.dark, margin: "0 0 10px",
            display: "flex", alignItems: "center", gap: 6
          }}>
            <Icon icon={faCog} size={14} color={C.gray} /> Filtros
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ fontSize: 12, color: C.gray, display: "block", marginBottom: 4 }}>Ordenar por</label>
              <select value={sortBy} onChange={e => { setSortBy(e.target.value); search(q, e.target.value); }}
                style={{
                  width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`,
                  borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                  outline: "none", background: "transparent", color: C.dark
                }}>
                <option value="rating">Avaliação</option>
                <option value="experience">Experiência</option>
                <option value="reviewCount">Mais avaliados</option>
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ fontSize: 12, color: C.gray, display: "block", marginBottom: 4 }}>Preço máx. (CVE/h)</label>
              <input value={priceMax} onChange={e => setPriceMax(e.target.value)} placeholder="Ex: 800"
                style={{
                  width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`,
                  borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                  outline: "none", boxSizing: "border-box", background: "transparent", color: C.dark
                }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <button onClick={() => search(q)}
              style={{
                background: C.primary, color: "#fff", border: "none",
                padding: "8px 16px", borderRadius: 8, cursor: "pointer",
                fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif"
              }}>
              Aplicar filtros
            </button>
            {searched && (
              <button onClick={() => { setQ(""); setSearched(false); setProfs([]); setGeoLat(null); setGeoLng(null); }}
                style={{
                  background: "none", border: `1px solid ${C.border}`, color: C.gray,
                  padding: "8px 14px", borderRadius: 8, cursor: "pointer",
                  fontSize: 13, fontFamily: "'DM Sans', sans-serif"
                }}>
                Limpar
              </button>
            )}
          </div>

          {/* Geolocalização */}
          <div style={{ marginTop: 14, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.dark, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
              📍 Pesquisa por proximidade
            </p>
            {geoError && <p style={{ fontSize: 11, color: C.error, margin: "0 0 6px" }}>{geoError}</p>}
            {geoLat ? (
              <div>
                <p style={{ fontSize: 12, color: C.success, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 4 }}>
                  ✓ Localização detectada
                </p>
                <label style={{ fontSize: 12, color: C.gray, display: "block", marginBottom: 4 }}>Raio: <strong>{geoRadius} km</strong></label>
                <input type="range" min={1} max={100} value={geoRadius} onChange={e => setGeoRadius(parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: C.primary }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.gray }}>
                  <span>1 km</span><span>100 km</span>
                </div>
                <button onClick={() => { setGeoLat(null); setGeoLng(null); }}
                  style={{ marginTop: 8, background: "none", border: `1px solid ${C.border}`, color: C.gray, padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
                  Remover localização
                </button>
              </div>
            ) : (
              <button onClick={detectLocation} disabled={geoLoading}
                style={{
                  background: geoLoading ? C.lightGray : `${C.primary}12`, color: C.primary,
                  border: `1.5px solid ${C.primary}40`, padding: "8px 14px",
                  borderRadius: 8, cursor: geoLoading ? "default" : "pointer",
                  fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                  display: "flex", alignItems: "center", gap: 6
                }}>
                {geoLoading ? "A detectar..." : "📍 Usar a minha localização"}
              </button>
            )}
          </div>
        </Card>

        {/* Resultados */}
        {searched && (
          <>
            <p style={{ color: C.gray, fontSize: 13, marginBottom: 12 }}>
              {profs.length} profissionais encontrados
              {geoLat && <span style={{ color: C.primary, fontWeight: 700 }}> · num raio de {geoRadius} km</span>}
            </p>
            {loading ? <Spinner /> : profs.length === 0
              ? <div style={{ textAlign: "center", padding: 48, color: C.gray }}>
                <Icon icon={faSearch} size={48} color={C.border} />
                <p style={{ marginTop: 12 }}>Nenhum profissional encontrado</p>
              </div>
              : profs.map(prof =>
                <ProfCard key={prof.id} prof={prof} onClick={() => onProfSelect(prof)} />
              )
            }
          </>
        )}

        {/* Estado inicial */}
        {!searched && (
          <div style={{ textAlign: "center", padding: "32px 20px", color: C.gray }}>
            <Icon icon={faSearch} size={44} color={C.border} />
            <p style={{ marginTop: 12, fontSize: 14, fontWeight: 600, color: C.dark }}>
              Encontre o profissional certo
            </p>
            <p style={{ fontSize: 13, color: C.gray, marginTop: 4 }}>
              Clique numa sugestão ou escreva no campo acima
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
// ============================================================
// PROJECTOS DO CLIENTE
// ============================================================
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
      <h2 style={{ fontSize: 22, fontWeight: 800, color: C.dark, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <Icon icon={faClipboardList} size={20} color={C.primary} /> Meus Projectos
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        <StatCard icon={faClipboardList} label="Total" value={projects.length} color={C.primary} />
        <StatCard icon={faClock} label="Activos" value={projects.filter(p => p.status === "ACTIVE").length} color={C.accent} />
        <StatCard icon={faCheck} label="Concluídos" value={projects.filter(p => p.status === "COMPLETED").length} color={C.success} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", scrollbarWidth: "none" }}>
        {[["all", "Todos"], ["active", "Activos"], ["done", "Concluídos"], ["pending", "Pendentes"]].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} style={{ padding: "8px 16px", border: "none", borderRadius: 20, cursor: "pointer", background: tab === v ? C.primary : C.white, color: tab === v ? "#fff" : C.gray, fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>{l}</button>
        ))}
      </div>
      {loading ? <Spinner /> : filtered.length === 0
        ? <div style={{ textAlign: "center", padding: 48, color: C.gray }}><Icon icon={faClipboardList} size={48} color={C.border} /><p style={{ marginTop: 12 }}>Sem projectos ainda</p></div>
        : filtered.map(proj => (
          <Card key={proj.id} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: C.dark }}>{proj.title}</div>
                <div style={{ color: C.gray, fontSize: 13, marginTop: 2 }}>{proj.professional?.user?.name}</div>
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

// ============================================================
// MENSAGENS DO CLIENTE
// ============================================================
const MessagesLayout = ({ user, initialConv, onConsumeInitial }) => {
  const [convs, setConvs] = useState([]);
  const [loading, setL] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    messagesAPI.conversations().then(d => setConvs(dedupeConversations(d.data || []))).catch(() => setConvs([])).finally(() => setL(false));
  }, []);

  // Se chegou aqui a partir de "Mensagem" no perfil de um profissional, abre já essa conversa
  useEffect(() => {
    if (!initialConv) return;
    const t = setTimeout(() => {
      setConvs(prev => dedupeConversations([initialConv, ...prev]));
      setSelected(initialConv);
      onConsumeInitial?.();
    }, 0);
    return () => clearTimeout(t);
  }, [initialConv, onConsumeInitial]);

  const filtered = convs.filter(conv => {
    const name = conv.professional?.user?.name || conv.client?.name || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="messages-layout">
      <div className={`messages-list-pane${selected ? " has-selection" : ""}`}>
        <div  className="messages-layout-top" style={{ padding: "20px 16px 12px",  }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.dark, marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
            <Icon icon={faComments} size={20} color={C.primary} /> Mensagens
          </h2>
          <div style={{ position: "relative" }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar conversas..."
              style={{ width: "100%", padding: "10px 14px 10px 38px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }} />
            <Icon icon={faSearch} size={13} color={C.gray} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
          </div>
        </div>
        <div style={{ padding: "0 16px 16px", overflowY: "auto" }}>
          {loading ? <Spinner /> : filtered.length === 0
            ? <div style={{ textAlign: "center", padding: 48, color: C.gray }}><Icon icon={faComments} size={48} color={C.border} /><p style={{ marginTop: 12 }}>Sem mensagens ainda</p></div>
            : filtered.map(conv => {
              const last = conv.messages?.[0];
              const name = conv.professional?.user?.name || conv.client?.name || "Utilizador";
              const isActive = selected?.id === conv.id;
              return (
                <div key={conv.id} onClick={() => setSelected(conv)} style={{ background: isActive ? `${C.primary}10` : C.white, borderRadius: 14, padding: "14px 16px", display: "flex", gap: 12, alignItems: "center", cursor: "pointer", marginBottom: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: `1.5px solid ${isActive ? C.primary : C.border}` }}>
                  <Avatar name={name} size={50} src={conv.professional?.user?.avatar || conv.client?.avatar} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 700, color: C.dark, fontSize: 14 }}>{name}</span>
                      {last && <span style={{ fontSize: 12, color: C.gray, flexShrink: 0, marginLeft: 8 }}>{new Date(last.createdAt).toLocaleDateString("pt")}</span>}
                    </div>
                    <div style={{ color: C.gray, fontSize: 13, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{last?.content || conv.title}</div>
                  </div>
                  <Icon icon={faChevronRight} size={12} color={C.gray} />
                </div>
              );
            })
          }
        </div>
      </div>

      <div className={`messages-chat-pane${selected ? " active" : ""}`}>
        {selected ? (
          <ChatScreen conversation={selected} user={user} onBack={() => setSelected(null)} embedded />
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: C.gray, fontFamily: "'DM Sans', sans-serif" }}>
            <Icon icon={faComments} size={56} color={C.border} />
            <p style={{ marginTop: 14, fontSize: 15, fontWeight: 600, color: C.dark }}>Selecione uma conversa</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Escolha um contacto à esquerda para começar a conversar</p>
          </div>
        )}
      </div>

      <style>{`
        .messages-layout { display: flex; height: calc(100vh - 96px); background: ${C.white}; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.07); font-family: 'DM Sans', sans-serif; }
        .messages-list-pane { width: 360px; flex-shrink: 0; border-right: 1px solid ${C.border}; display: flex; flex-direction: column; overflow: hidden; }
        .messages-chat-pane { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .messages-layout-top { padding: 20px 16px 12px
        @media (max-width: 860px) {
          .messages-layout { height: calc(100vh - 80px); border-radius: 0; box-shadow: none; }
          .messages-list-pane { width: 100%; }
          .messages-chat-pane { display: none; }
          .messages-chat-pane.active { display: flex; position: fixed; inset: 0; z-index: 150; }
          .messages-list-pane.has-selection { display: none; }
        }
      `}</style>
    </div>
  );
};

// Agrupa conversas pelo mesmo profissional, mantendo apenas a mais recente
// (evita profissionais repetidos na lista quando existem vários "projectos"/conversas com a mesma pessoa)
const dedupeConversations = (list) => {
  const lastTime = (conv) => new Date(conv.messages?.[0]?.createdAt || conv.updatedAt || conv.createdAt || 0).getTime();
  const byKey = new Map();
  for (const conv of list) {
    const key = conv.professional?.id || conv.professionalId || conv.client?.id || conv.id;
    const existing = byKey.get(key);
    if (!existing || lastTime(conv) > lastTime(existing)) byKey.set(key, conv);
  }
  return [...byKey.values()].sort((a, b) => lastTime(b) - lastTime(a));
};

// ============================================================
// PERFIL DO CLIENTE
// ============================================================
const ClientProfile = ({ user, onLogout, onUpdate, initialSection, onSectionChange }) => {
  const [section, setSection] = useState(initialSection || null);

  useEffect(() => {
    if (initialSection) {
      setSection(initialSection);
      if (onSectionChange) onSectionChange(null);
    }
  }, [initialSection]);
  const [successMsg, setSuccessMsg] = useState(null);

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 3001); };

  const BackBtn = ({ light }) => (
    <button onClick={() => setSection(null)} style={{ background: light ? "rgba(255,255,255,0.15)" : C.lightGray, border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: light ? "#fff" : C.dark, display: "flex", alignItems: "center", gap: 6 }}>
      <Icon icon={faArrowLeft} size={13} color={light ? "#fff" : C.dark} /> 
    </button>
  );

  const EditProfile = () => {
    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [saving, setSaving] = useState(false);
    const [photoURL, setPhotoURL] = useState(user?.avatar || user?.photo || null);
    const fileRef = useRef(null);

    const handlePhoto = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoURL(ev.target.result);
      reader.readAsDataURL(file);
    };

    const save = async () => {
      setSaving(true);
      try {
        const { usersAPI } = await import("./services/api");
        const updated = await usersAPI.update(user.id, { name, phone, avatar: photoURL });
        const newUser = { ...user, ...updated, avatar: photoURL };
        localStorage.setItem("buildmatch_user", JSON.stringify(newUser));
        onUpdate(newUser);  
        showSuccess("Perfil actualizado com sucesso!");
        setSection(null);
      } catch (err) { alert(err.message); }
      finally { setSaving(false); }
    };

    return (
      <div style={{ padding: "20px 16px", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <BackBtn />
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.dark, margin: 0 }}>Editar Perfil</h2>
        </div>

        {/* Foto centralizada */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <Avatar name={name} color={C.accent} size={96} src={photoURL} />
            {/* Botão de câmera por cima */}
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                position: "absolute", bottom: 2, right: 2,
                background: C.primary, border: "2px solid #fff",
                width: 32, height: 32, borderRadius: "50%", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
              }}>
              <Icon icon={faCamera} size={13} color="#fff" />
            </button>
            <input ref={fileRef} type="file" accept="image/*"
              onChange={handlePhoto}
              style={{ display: "none" }} />
          </div>
        </div>

        <Card>
          <Input label="Nome completo" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome completo" />
          <Input label="Email" value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="seu@email.com" />
          <Input label="Telefone" value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="+238 991 0000" />
        </Card>

        <div style={{ marginTop: 20 }}>
          <Btn onClick={save} full disabled={saving}>
            <Icon icon={faSave} size={14} color="#fff" />
            {saving ? "A guardar..." : "Guardar alterações"}
          </Btn>
        </div>
      </div>
    );
  };
  const Addresses = () => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setL] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [label, setLabel] = useState("");
    const [address, setAddress] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadAddresses(); }, []);

    const loadAddresses = async () => {
      setL(true);
      try {
        const { addressesAPI } = await import("./services/api");
        const data = await addressesAPI.list();
        setAddresses(data.data || []);
      } catch { setAddresses([]); } finally { setL(false); }
    };

    const add = async () => {
      if (!label || !address) return;
      setSaving(true);
      try {
        const { addressesAPI } = await import("./services/api");
        const newAddr = await addressesAPI.create({ label, address, default: addresses.length === 0 });
        setAddresses(prev => [...prev, newAddr]);
        setLabel(""); setAddress(""); setShowForm(false);
      } catch (err) { alert(err.message); } finally { setSaving(false); }
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
          <BackBtn />
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.dark, margin: 0 }}>Endereços</h2>
          <button onClick={() => setShowForm(!showForm)} style={{ marginLeft: "auto", background: C.accent, color: "#fff", border: "none", padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
            <Icon icon={showForm ? faTimes : faPlus} size={12} color="#fff" /> {showForm ? "Cancelar" : "Novo"}
          </button>
        </div>
        {showForm && (
          <Card style={{ marginBottom: 16, borderTop: `4px solid ${C.accent}` }}>
            <Input label="Nome do endereço" value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex: Casa, Trabalho..." />
            <Input label="Endereço" value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, número, cidade" />
            <Btn onClick={add} variant="accent" full disabled={saving || !label || !address}>
              <Icon icon={faSave} size={14} color="#fff" /> {saving ? "A guardar..." : "Guardar endereço"}
            </Btn>
          </Card>
        )}
        {loading ? <Spinner /> : addresses.length === 0
          ? <div style={{ textAlign: "center", padding: 48, color: C.gray }}><Icon icon={faMapMarkerAlt} size={48} color={C.border} /><p style={{ marginTop: 12, fontWeight: 600 }}>Nenhum endereço guardado</p></div>
          : addresses.map(addr => (
            <Card key={addr.id} style={{ marginBottom: 12, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Icon icon={faMapMarkerAlt} size={14} color={C.primary} />
                    <span style={{ fontWeight: 700, color: C.dark, fontSize: 14 }}>{addr.label}</span>
                    {addr.default && <span style={{ background: `${C.primary}15`, color: C.primary, padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600 }}>Principal</span>}
                  </div>
                  <p style={{ color: C.gray, fontSize: 13, margin: 0 }}>{addr.address}</p>
                </div>
                <button onClick={() => remove(addr.id)} style={{ background: "#FEE2E2", border: "none", color: C.error, width: 32, height: 32, borderRadius: 8, cursor: "pointer", flexShrink: 0, marginLeft: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon icon={faTimes} size={12} color={C.error} />
                </button>
              </div>
              {!addr.default && (
                <button onClick={() => setDefault(addr.id)} style={{ marginTop: 10, background: "none", border: `1px solid ${C.border}`, color: C.gray, padding: "7px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Icon icon={faCheck} size={11} color={C.gray} /> Definir como principal
                </button>
              )}
            </Card>
          ))
        }
      </div>
    );
  };

  const MyReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setL] = useState(true);

    useEffect(() => {
      projectsAPI.list({ status: "COMPLETED" })
        .then(d => setReviews((d.data || []).filter(p => p.review)))
        .catch(() => setReviews([]))
        .finally(() => setL(false));
    }, []);

    return (
      <div style={{ padding: "20px 16px", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <BackBtn />
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.dark, margin: 0 }}>Minhas Avaliações</h2>
        </div>
        {loading ? <Spinner /> : reviews.length === 0
          ? <div style={{ textAlign: "center", padding: 48, color: C.gray }}><Icon icon={faStar} size={48} color={C.border} /><p style={{ marginTop: 12, fontWeight: 600 }}>Ainda não fez nenhuma avaliação</p></div>
          : reviews.map(proj => (
            <Card key={proj.id} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, color: C.dark }}>{proj.professional?.user?.name}</div>
                  <div style={{ color: C.gray, fontSize: 12 }}>{proj.professional?.specialty}</div>
                </div>
                <span style={{ fontSize: 12, color: C.gray }}>{new Date(proj.review.createdAt).toLocaleDateString("pt")}</span>
              </div>
              <Stars rating={proj.review.rating} size={18} />
              <p style={{ color: C.gray, fontSize: 13, lineHeight: 1.6, margin: "8px 0 0", background: C.lightGray, padding: "10px 12px", borderRadius: 10 }}>"{proj.review.comment}"</p>
              {proj.review.reply && (
                <div style={{ marginTop: 10, background: `${C.primary}08`, borderLeft: `3px solid ${C.primary}`, padding: "8px 12px", borderRadius: "0 8px 8px 0" }}>
                  <p style={{ color: C.dark, fontSize: 13, margin: 0 }}>{proj.review.reply}</p>
                </div>
              )}
            </Card>
          ))
        }
      </div>
    );
  };

  const Notifications = () => {
    const [settings, setSettings] = useState({ newMessage: true, projectUpdate: true, promotions: false, reminders: true, email: true, sms: false });
    const toggle = (key) => setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    const items = [
      { key: "newMessage", icon: faComments, label: "Novas mensagens", desc: "Quando receber uma mensagem" },
      { key: "projectUpdate", icon: faClipboardList, label: "Actualizações do projecto", desc: "Mudanças de estado" },
      { key: "reminders", icon: faCalendarAlt, label: "Lembretes de agendamento", desc: "Antes do serviço agendado" },
      { key: "promotions", icon: faStar, label: "Promoções e ofertas", desc: "Novidades e descontos" },
      { key: "email", icon: faEnvelope, label: "Notificações por email", desc: "Receber por email" },
      { key: "sms", icon: faPhone, label: "Notificações por SMS", desc: "Receber por mensagem" },
    ];
    return (
      <div style={{ padding: "20px 16px", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <BackBtn />
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.dark, margin: 0 }}>Notificações</h2>
        </div>
        <Card>
          {items.map((item, i) => (
            <div key={item.key}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: C.lightGray, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon icon={item.icon} size={18} color={C.primary} />
                </div>
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
          <Btn onClick={() => { showSuccess("Preferências guardadas!"); setSection(null); }} full>
            <Icon icon={faSave} size={14} color="#fff" /> Guardar preferências
          </Btn>
        </div>
      </div>
    );
  };

  const Security = () => {
    const [currentPass, setCurrentPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const save = async () => {
      setError("");
      if (!currentPass || !newPass || !confirmPass) { setError("Preencha todos os campos"); return; }
      if (newPass !== confirmPass) { setError("As novas passwords não coincidem"); return; }
      if (newPass.length < 6) { setError("Mínimo 6 caracteres"); return; }
      setSaving(true);
      try {
        const { authAPI } = await import("./services/api");
        await authAPI.changePassword({ currentPassword: currentPass, newPassword: newPass });
        showSuccess("Password alterada com sucesso!");
        setSection(null);
      } catch (err) { setError(err.message); } finally { setSaving(false); }
    };

    return (
      <div style={{ padding: "20px 16px", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <BackBtn />
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.dark, margin: 0 }}>Segurança</h2>
        </div>
        <Card style={{ marginBottom: 16 }}>
          <h4 style={{ margin: "0 0 16px", color: C.dark, fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon icon={faLock} size={14} color={C.primary} /> Alterar palavra-passe
          </h4>
          {error && <ErrMsg msg={error} />}
          <Input label="Password actual" value={currentPass} onChange={e => setCurrentPass(e.target.value)} type="password" placeholder="••••••••" />
          <Input label="Nova password" value={newPass} onChange={e => setNewPass(e.target.value)} type="password" placeholder="••••••••" />
          <Input label="Confirmar password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} type="password" placeholder="••••••••" />
          <Btn onClick={save} full disabled={saving}>{saving ? "A alterar..." : "Alterar password"}</Btn>
        </Card>
        <Card>
          {[
            [faCheckCircle, "Email verificado", user?.email, true],
            [faPhone, "Autenticação em dois passos", "Não activado", false],
            [faKey, "Sessões activas", "1 dispositivo", true],
          ].map(([ico, label, desc, status], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < 2 ? `1px solid ${C.border}` : "none" }}>
              <Icon icon={ico} size={18} color={status ? C.success : C.gray} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: C.dark, fontSize: 13 }}>{label}</div>
                <div style={{ color: C.gray, fontSize: 12 }}>{desc}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: status ? C.success : C.error }}>{status ? "Activo" : "Inactivo"}</span>
            </div>
          ))}
        </Card>
      </div>
    );
  };

  const Help = () => {
    const [openFaq, setOpenFaq] = useState(null);
    const faqs = [
      { q: "Como posso contratar um profissional?", a: "Pesquise o serviço, veja os perfis e clique em Agendar ou Mensagem." },
      { q: "Como funcionam as avaliações?", a: "Após conclusão, pode avaliar com 1 a 5 estrelas. Só clientes que contrataram podem avaliar." },
      { q: "Posso cancelar um agendamento?", a: "Sim, pode cancelar agendamentos pendentes pelo chat." },
      { q: "Como altero os meus dados?", a: "Perfil → Editar Perfil." },
      { q: "Os meus dados estão seguros?", a: "Sim, todos os dados são encriptados e protegidos." },
    ];
    return (
      <div style={{ padding: "20px 16px", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <BackBtn />
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.dark, margin: 0 }}>Ajuda</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[[faComments, "Chat", "Resposta imediata"], [faEnvelope, "Email", "buildmatch@us.edu.cv"]].map(([ico, label, desc], i) => (
            <Card key={i} style={{ padding: 16, textAlign: "center" }}>
              <Icon icon={ico} size={28} color={C.primary} />
              <div style={{ fontWeight: 700, color: C.dark, fontSize: 14, marginTop: 8 }}>{label}</div>
              <div style={{ color: C.gray, fontSize: 11, marginTop: 4 }}>{desc}</div>
            </Card>
          ))}
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.dark, marginBottom: 12 }}>Perguntas frequentes</h3>
        {faqs.map((faq, i) => (
          <div key={i} style={{ background: C.white, borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 8 }}>
            <div onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
              <span style={{ fontWeight: 600, color: C.dark, fontSize: 13, flex: 1, paddingRight: 10 }}>{faq.q}</span>
              <Icon icon={faChevronDown} size={12} color={C.primary} style={{ transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
            </div>
            {openFaq === i && <div style={{ padding: "0 16px 14px", color: C.gray, fontSize: 13, lineHeight: 1.6, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>{faq.a}</div>}
          </div>
        ))}
        <Card style={{ marginTop: 20, background: `${C.primary}08`, border: `1px solid ${C.primary}20` }}>
          <p style={{ margin: 0, fontSize: 13, color: C.primary, fontWeight: 600, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon icon={faPhone} size={12} color={C.primary} /> Suporte técnico
          </p>
          <p style={{ margin: 0, fontSize: 13, color: C.gray }}>Universidade de Santiago — CSAT</p>
          <p style={{ margin: 0, fontSize: 13, color: C.gray }}>Segunda a Sexta: 08h00 — 17h00</p>
        </Card>
      </div>
    );
  };

  if (section === "edit") return <EditProfile />;
  if (section === "addresses") return <Addresses />;
  if (section === "reviews") return <MyReviews />;
  if (section === "notifications") return <Notifications />;
  if (section === "security") return <Security />;
  if (section === "help") return <Help />;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {successMsg && <SuccessModal message={successMsg} onClose={() => setSuccessMsg(null)} />}
      <div style={{ background: C.primary, padding: "28px 16px 50px", textAlign: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
          <Avatar name={user?.name} color={C.accent} size={80} src={user?.avatar} />
        </div>
        <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 800, marginTop: 12, marginBottom: 4 }}>{user?.name}</h2>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: 0 }}>{user?.email}</p>
        <div style={{ background: "rgba(255,255,255,0.2)", display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 16px", borderRadius: 20, marginTop: 8 }}>
          <Icon icon={faUser} size={12} color="#fff" />
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>Cliente</span>
        </div>
      </div>
      <div style={{ padding: "0 16px", marginTop: -24 }}>
        <Card style={{ marginBottom: 16, padding: 8 }}>
          {[
            { icon: faPencilAlt, label: "Editar perfil", desc: "Nome, email, telefone", key: "edit" },
            { icon: faMapMarkerAlt, label: "Endereços guardados", desc: "Gerir os seus endereços", key: "addresses" },
            { icon: faStar, label: "Minhas avaliações", desc: "Avaliações que fez", key: "reviews" },
            { icon: faBell, label: "Notificações", desc: "Gerir alertas", key: "notifications" },
            { icon: faLock, label: "Segurança", desc: "Password e privacidade", key: "security" },
            { icon: faQuestionCircle, label: "Ajuda", desc: "FAQ e suporte", key: "help" },
          ].map((item, i, arr) => (
            <div key={item.key}>
              <div onClick={() => setSection(item.key)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 10px", cursor: "pointer", borderRadius: 10 }}
                onMouseEnter={e => e.currentTarget.style.background = C.lightGray}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${C.primary}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon icon={item.icon} size={18} color={C.primary} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: C.dark, fontSize: 14 }}>{item.label}</div>
                  <div style={{ color: C.gray, fontSize: 12, marginTop: 1 }}>{item.desc}</div>
                </div>
                <Icon icon={faChevronRight} size={13} color={C.gray} />
              </div>
              {i < arr.length - 1 && <div style={{ height: 1, background: C.border, marginLeft: 62 }} />}
            </div>
          ))}
        </Card>
        <p style={{ textAlign: "center", color: C.gray, fontSize: 12, marginBottom: 16 }}>BuildMatch v1.0.0</p>
        <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px", background: C.error, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: "'DM Sans', sans-serif", marginBottom: 32 }}>
          <Icon icon={faSignOutAlt} size={16} color="#fff" /> Terminar sessão
        </button>
      </div>
    </div>
  );
};

// ============================================================
// PAINEL DO PROFISSIONAL
// ============================================================
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
      <div style={{  background: C.primary, padding: "28px 20px 32px", borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 2 }}>Painel do Profissional</p>
            <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: 0 }}>{user?.name}</h2>
          </div>
          <div style={{  background: C.primary, borderRadius: 12, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
            <Icon icon={faHammer} size={12} color="#fff" />
            <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>PRO</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[[active, "Activos", faClock, C.accent], [completed, "Concluídos", faCheck, C.success], [pending, "Pendentes", faExclamationCircle, "#F59E0B"]].map(([v, l, ico, color], i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 10px", textAlign: "center" }}>
              <Icon icon={ico} size={20} color={color} />
              <div style={{ fontSize: 22, fontWeight: 800, color, marginTop: 6 }}>{v}</div>
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
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>{proj.title}</div>
                  <div style={{ color: C.gray, fontSize: 13, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                    <Icon icon={faUser} size={11} color={C.gray} /> {proj.client?.name}
                  </div>
                </div>
                <StatusBadge status={proj.status} />
              </div>
              {proj.amount && <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700, color: C.accent }}>{proj.amount.toLocaleString()} CVE</div>}
            </Card>
          ))
        }
        <div style={{ background: `${C.primary}10`, borderRadius: 14, padding: 16, marginTop: 8, border: `1px solid ${C.primary}30` }}>
          <p style={{ margin: 0, fontSize: 13, color: C.primary, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon icon={faLightbulb} size={13} color={C.primary} /> Dica
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: C.gray, lineHeight: 1.5 }}>Actualize o seu portfólio regularmente para atrair mais clientes.</p>
        </div>
      </div>
    </div>
  );
};

const ProfProjects = ({ onOpenChat }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setL] = useState(true);
  const [tab, setTab] = useState("all");

  useEffect(() => {
    projectsAPI.list().then(d => setProjects(d.data || [])).catch(() => setProjects([])).finally(() => setL(false));
  }, []);

  const filtered = tab === "all" ? projects : projects.filter(p =>
    tab === "active" ? p.status === "ACTIVE" : tab === "done" ? p.status === "COMPLETED" : p.status === "PENDING"
  );

  const pendingCount = projects.filter(p => p.status === "PENDING").length;

  const accept = async (id) => {
    try {
      await projectsAPI.acceptDirect(id);
      setProjects(p => p.map(proj => proj.id === id ? { ...proj, status: "ACTIVE" } : proj));
      alert("Trabalho aceite com sucesso!");
    } catch (err) {
      alert("Erro ao aceitar: " + err.message);
    }
  };

  const reject = async (id) => {
    if (!window.confirm("Deseja recusar este trabalho?")) return;
    try {
      await projectsAPI.update(id, { status: "CANCELLED" });
      setProjects(p => p.map(proj => proj.id === id ? { ...proj, status: "CANCELLED" } : proj));
      alert("Trabalho recusado.");
    } catch (err) {
      alert("Erro ao recusar: " + err.message);
    }
  };

  const complete = async (id) => { try { await projectsAPI.update(id, { status: "COMPLETED" }); setProjects(p => p.map(proj => proj.id === id ? { ...proj, status: "COMPLETED" } : proj)); } catch { /* ignore */ } };

  const handleRespond = (proj, tab = "messages") => {
    if (onOpenChat) onOpenChat(proj, tab);
  };

  return (
    <div style={{ padding: "20px 16px", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.dark, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <Icon icon={faClipboardList} size={20} color={C.accent} /> Pedidos Recebidos
        </h2>
        {pendingCount > 0 && (
          <span style={{ background: C.error, color: "#fff", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>
            {pendingCount} novo{pendingCount > 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", scrollbarWidth: "none" }}>
        {[["all", "Todos"], ["pending", "Novos Pedidos"], ["active", "Em Curso"], ["done", "Concluídos"]].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} style={{ padding: "8px 16px", border: "none", borderRadius: 20, cursor: "pointer", background: tab === v ? C.accent : C.white, color: tab === v ? "#fff" : C.gray, fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>{l}</button>
        ))}
      </div>
      {loading ? <Spinner /> : filtered.length === 0
        ? <div style={{ textAlign: "center", padding: 48, color: C.gray }}><Icon icon={faClipboardList} size={48} color={C.border} /><p style={{ marginTop: 12 }}>Sem pedidos nesta categoria</p></div>
        : filtered.map(proj => {
          const isPending = proj.status === "PENDING";
          return (
            <div key={proj.id} style={{
              background: C.white,
              borderRadius: 16,
              marginBottom: 14,
              boxShadow: isPending ? `0 2px 16px ${C.accent}25` : "0 2px 8px rgba(0,0,0,0.06)",
              border: isPending ? `2px solid ${C.accent}50` : `1.5px solid ${C.border}`,
              overflow: "hidden"
            }}>
              {/* Badge de novo pedido */}
              {isPending && (
                <div style={{ background: `linear-gradient(90deg, ${C.accent}, ${C.accent}cc)`, padding: "6px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon icon={faExclamationCircle} size={12} color="#fff" />
                  <span style={{ color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>NOVO PEDIDO DE ORÇAMENTO</span>
                </div>
              )}
              <div style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: C.dark, marginBottom: 4 }}>{proj.title}</div>
                    <div style={{ color: C.gray, fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                      <Icon icon={faUser} size={11} color={C.gray} /> {proj.client?.name}
                    </div>
                  </div>
                  {!isPending && <StatusBadge status={proj.status} />}
                </div>

                {proj.description && (
                  <p style={{ color: C.gray, fontSize: 13, margin: "8px 0 12px", lineHeight: 1.6, background: C.lightGray, padding: "10px 12px", borderRadius: 8 }}>
                    {proj.description.length > 120 ? proj.description.substring(0, 120) + "..." : proj.description}
                  </p>
                )}

                <div style={{ display: "flex", gap: 12, paddingTop: 10, borderTop: `1px solid ${C.border}`, flexWrap: "wrap" }}>
                  {(proj.budgetAmount || proj.amount) && (
                    <div style={{ background: isPending ? `${C.success}15` : C.lightGray, borderRadius: 8, padding: "6px 12px" }}>
                      <div style={{ fontSize: 10, color: C.gray, fontWeight: 700 }}>ORÇAMENTO ESPERADO</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: isPending ? C.success : C.accent }}>
                        {(proj.budgetAmount || proj.amount).toLocaleString("pt")} CVE
                      </div>
                    </div>
                  )}
                  {proj.budgetDeadline && (
                    <div style={{ background: C.lightGray, borderRadius: 8, padding: "6px 12px" }}>
                      <div style={{ fontSize: 10, color: C.gray, fontWeight: 700 }}>PRAZO PRETENDIDO</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{new Date(proj.budgetDeadline).toLocaleDateString("pt")}</div>
                    </div>
                  )}
                  {proj.address && (
                    <div style={{ background: C.lightGray, borderRadius: 8, padding: "6px 12px" }}>
                      <div style={{ fontSize: 10, color: C.gray, fontWeight: 700 }}>LOCAL</div>
                      <div style={{ fontSize: 13 }}>{proj.address}</div>
                    </div>
                  )}
                </div>

                {isPending && (
                  <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Btn
                        onClick={() => accept(proj.id)}
                        variant="success"
                        small
                        full
                      >
                        <Icon icon={faCheck} size={12} color="#fff" /> Aceitar Trabalho
                      </Btn>
                      <Btn
                        onClick={() => reject(proj.id)}
                        variant="danger"
                        small
                        full
                      >
                        <Icon icon={faTimes} size={12} color="#fff" /> Recusar
                      </Btn>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Btn
                        onClick={() => handleRespond(proj, "project")}
                        variant="accent"
                        small
                        full
                      >
                        <Icon icon={faClipboardList} size={12} color="#fff" /> Enviar Orçamento
                      </Btn>
                      {onOpenChat && (
                        <Btn
                          onClick={() => handleRespond(proj, "messages")}
                          variant="ghost"
                          small
                          full
                        >
                          <Icon icon={faComments} size={12} color={C.gray} /> Falar com Cliente
                        </Btn>
                      )}
                    </div>
                  </div>
                )}
                {proj.status === "ACTIVE" && (
                  <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                    {onOpenChat && (
                      <Btn onClick={() => handleRespond(proj, "messages")} variant="ghost" small full>
                        <Icon icon={faComments} size={12} color={C.gray} /> Ver Conversa
                      </Btn>
                    )}
                    <Btn onClick={() => complete(proj.id)} variant="accent" small full>
                      <Icon icon={faCheck} size={12} color="#fff" /> Marcar como Concluído
                    </Btn>
                  </div>
                )}
              </div>
            </div>
          );
        })
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
    // Usa o endpoint autenticado "mine" para ver TODOS os horários,
    // incluindo os já reservados por clientes (não apenas os livres).
    schedulesAPI.mine().then(d => setSchedules(d.data || [])).catch(() => setSchedules([])).finally(() => setL(false));
  }, []);

  const addSlot = async () => {
    if (!date || !user?.professional?.id) return;
    setSaving(true);
    try {
      // O professionalId é sempre determinado no servidor a partir do
      // utilizador autenticado — nunca enviado pelo cliente (evita
      // que alguém crie disponibilidade em nome de outro profissional).
      const s = await schedulesAPI.create({ date, startTime: start, endTime: end });
      setSchedules(prev => [...prev, s]); setDate("");
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  return (
    <div style={{ padding: "20px 16px", fontFamily: "'DM Sans', sans-serif" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: C.dark, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <Icon icon={faCalendarAlt} size={20} color={C.accent} /> Minha Agenda
      </h2>
      <Card style={{ marginBottom: 16, borderTop: `4px solid ${C.accent}` }}>
        <h4 style={{ margin: "0 0 14px", color: C.dark }}>Adicionar disponibilidade</h4>
        <Input label="Data" value={date} onChange={e => setDate(e.target.value)} type="date" />
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}><Input label="Início" value={start} onChange={e => setStart(e.target.value)} type="time" /></div>
          <div style={{ flex: 1 }}><Input label="Fim" value={end} onChange={e => setEnd(e.target.value)} type="time" /></div>
        </div>
        <Btn onClick={addSlot} variant="accent" full disabled={saving || !date}>
          <Icon icon={faPlus} size={13} color="#fff" /> {saving ? "A guardar..." : "Adicionar horário"}
        </Btn>
      </Card>
      {loading ? <Spinner /> : schedules.length === 0
        ? <div style={{ textAlign: "center", padding: 32, color: C.gray }}><Icon icon={faCalendarAlt} size={48} color={C.border} /><p style={{ marginTop: 12 }}>Nenhum horário adicionado</p></div>
        : schedules.map((s, i) => (
          <Card key={i} style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", padding: 14 }}>
            <div>
              <div style={{ fontWeight: 700, color: C.dark }}>{new Date(s.date.split("T")[0] + "T12:00:00").toLocaleDateString("pt", { weekday: "long", day: "numeric", month: "long" })}</div>
              <div style={{ color: C.gray, fontSize: 13, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                <Icon icon={faClock} size={11} color={C.gray} /> {s.startTime} — {s.endTime}
              </div>
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
  const [items,     setItems]    = useState([]);
  const [loading,   setL]        = useState(true);
  const [title,     setTitle]    = useState("");
  const [desc,      setDesc]     = useState("");
  const [cat,       setCat]      = useState("");
  const [videoUrl,  setVideoUrl] = useState("");
  const [saving,    setSaving]   = useState(false);
  const [showForm,  setShowForm] = useState(false);
  const [photos,    setPhotos]   = useState([]);
  const [selected,  setSelected] = useState(null);
  const fileRef = useRef(null);
  const [editItem, setEditItem] = useState(null);

  useEffect(() => {
    if (!user?.professional?.id) { setL(false); return; }
    import("./services/api").then(({ portfolioAPI }) =>
      portfolioAPI.list(user.professional.id)
        .then(d => setItems(d.data || []))
        .catch(() => setItems([]))
        .finally(() => setL(false))
    );
  }, []);

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotos(prev => [...prev, ev.target.result]);
      reader.readAsDataURL(file);
    });
  };

 const add = async () => {
  if (!title || !user?.professional?.id) return;
  setSaving(true);
  try {
    const { portfolioAPI } = await import("./services/api");
    if (editItem) {
      await portfolioAPI.update(editItem.id, {
        title, description: desc, category: cat,
        imageUrls: stringifyImages(photos),
        videoUrl: videoUrl || null,
      });
      setItems(prev => prev.map(i => i.id === editItem.id
        ? { ...i, title, description: desc, category: cat, imageUrls: stringifyImages(photos), videoUrl: videoUrl || null }
        : i
      ));
      setEditItem(null);
    } else {
      const item = await portfolioAPI.create({
        professionalId: user.professional.id,
        title, description: desc, category: cat,
        imageUrls: stringifyImages(photos),
        videoUrl: videoUrl || null,
      });
      setItems(prev => [{ ...item, imageUrls: stringifyImages(photos) }, ...prev]);
    }
    setTitle(""); setDesc(""); setCat(""); setPhotos([]); setVideoUrl(""); setShowForm(false);
  } catch (err) { alert(err.message); } finally { setSaving(false); }
};

  // Galeria pinterest: divide em 2 colunas
  const col1 = items.filter((_, i) => i % 2 === 0);
  const col2 = items.filter((_, i) => i % 2 !== 0);

  const CATEGORY_COLORS = {
    "Residencial": { bg: `${C.primary}15`, color: C.primary },
    "Comercial":   { bg: `${C.accent}15`,  color: C.accent  },
    "Industrial":  { bg: "#7C3AED15",       color: "#7C3AED" },
  };

  const PinCard = ({ item }) => {
    const imgs = parseImages(item.imageUrls);
    const catStyle = CATEGORY_COLORS[item.category] || { bg: `${C.primary}15`, color: C.primary };
    return (
      <div onClick={() => setSelected(item)}
        style={{ borderRadius: 16, overflow: "hidden", background: C.white,
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: 12,
          cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.14)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)"; }}
      >
        {/* Imagem ou placeholder */}
        {imgs[0]
          ? <img src={imgs[0]} alt={item.title}
              style={{ width: "100%", display: "block", objectFit: "cover",
                maxHeight: 220, minHeight: 100 }} />
          : <div style={{ height: 120 + (item.title?.length % 3) * 30,
               background: C.primary,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon icon={faBuilding} size={36} color={`${C.primary}60`} />
            </div>
        }
        {/* Info */}
        <div style={{ padding: "10px 12px 12px" }}>
          {item.category && (
            <span style={{ background: catStyle.bg, color: catStyle.color,
              fontSize: 10, fontWeight: 700, padding: "2px 8px",
              borderRadius: 10, display: "inline-block", marginBottom: 6 }}>
              {item.category}
            </span>
          )}
          <div style={{ fontWeight: 700, color: C.dark, fontSize: 13, lineHeight: 1.3 }}>
            {item.title}
          </div>
          {item.description && (
            <div style={{ color: C.gray, fontSize: 11, marginTop: 4, lineHeight: 1.4,
              display: "-webkit-box", WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {item.description}
            </div>
          )}
          {imgs.length > 1 && (
            <div style={{ marginTop: 6, fontSize: 10, color: C.gray,
              display: "flex", alignItems: "center", gap: 4 }}>
              <Icon icon={faImages} size={10} color={C.gray} /> {imgs.length} fotos
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: "20px 16px", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.dark, margin: 0,
          display: "flex", alignItems: "center", gap: 10 }}>
          <Icon icon={faImages} size={20} color={C.accent} /> Portfólio
        </h2>
        <Btn onClick={() => setShowForm(!showForm)} variant="accent" small>
          <Icon icon={showForm ? faTimes : faPlus} size={12} color="#fff" />
          {showForm ? "Cancelar" : "Adicionar"}
        </Btn>
      </div>

      {/* Formulário */}
      {showForm && (
        <Card style={{ marginBottom: 16, borderTop: `4px solid ${C.accent}` }}>
          <p style={{ fontWeight: 700, color: C.dark, fontSize: 14, margin: "0 0 14px",
            display: "flex", alignItems: "center", gap: 6 }}>
            <Icon icon={editItem ? faPencilAlt : faPlus} size={13} color={C.accent} />
            {editItem ? "Editar projecto" : "Novo projecto"}
          </p>
          <Input label="Título" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Ex: Moradia T3 em Assomada" />
          <Input label="Categoria" value={cat} onChange={e => setCat(e.target.value)}
            placeholder="Ex: Residencial, Comercial..." />
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.dark,
              display: "block", marginBottom: 6 }}>Descrição</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="Descreva o projecto..."
              style={{ width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 10,
                padding: 12, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                resize: "vertical", minHeight: 80, outline: "none", boxSizing: "border-box" }} />
          </div>

          {/* Upload de fotos */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.dark,
              display: "block", marginBottom: 8 }}>Fotografias</label>
            <div onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${C.border}`, borderRadius: 12, padding: "20px",
                textAlign: "center", cursor: "pointer", background: C.lightGray }}>
              <Icon icon={faImages} size={28} color={C.gray} />
              <p style={{ color: C.gray, fontSize: 13, margin: "8px 0 0" }}>
                Clique para adicionar fotos
              </p>
              <p style={{ color: C.gray, fontSize: 11, margin: "4px 0 0" }}>
                JPG, PNG · máx. 20 fotos
              </p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple
              onChange={handlePhotos} style={{ display: "none" }} />
            {photos.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                {photos.map((p, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <img src={p} alt=""
                      style={{ width: 64, height: 64, borderRadius: 10,
                        objectFit: "cover", border: `2px solid ${C.border}` }} />
                    <button onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                      style={{ position: "absolute", top: -6, right: -6,
                        background: C.error, border: "none", color: "#fff",
                        width: 18, height: 18, borderRadius: "50%", cursor: "pointer",
                        fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload de vídeo (URL) */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.dark, display: "block", marginBottom: 6 }}>URL de Vídeo <span style={{ color: C.gray, fontWeight: 400 }}>(opcional)</span></label>
            <input
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              placeholder="Ex: https://youtube.com/watch?v=... ou https://vimeo.com/..."
              style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box", background: "transparent", color: C.dark }}
            />
            {videoUrl && (
              <div style={{ marginTop: 8, borderRadius: 10, overflow: "hidden" }}>
                <video controls src={videoUrl} style={{ width: "100%", maxHeight: 180, borderRadius: 10, background: "#000" }}>
                  O seu browser não suporta vídeo.
                </video>
              </div>
            )}
          </div>

          <Btn onClick={add} variant="accent" full disabled={saving || !title}>
            <Icon icon={faSave} size={13} color="#fff" />
            {saving ? "A guardar..." : "Guardar projecto"}
          </Btn>
        </Card>
      )}

      {/* Galeria Pinterest */}
      {loading ? <Spinner /> : items.length === 0
        ? <div style={{ textAlign: "center", padding: 48, color: C.gray }}>
            <Icon icon={faImages} size={48} color={C.border} />
            <p style={{ marginTop: 12 }}>Sem itens no portfólio</p>
          </div>
        : <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>{col1.map((item, i) => <PinCard key={i} item={item} />)}</div>
            <div style={{ flex: 1 }}>{col2.map((item, i) => <PinCard key={i} item={item} />)}</div>
          </div>
      }

      {/* Modal de detalhe ao clicar */}
      {selected && (
        <div onClick={() => setSelected(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
            zIndex: 300, overflowY: "auto", padding: "20px 16px" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: C.white, borderRadius: 24, maxWidth: 480,
              margin: "0 auto", overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>

            {/* Galeria de fotos no topo */}
            {(() => {
              const imgs = parseImages(selected.imageUrls);
              return imgs.length > 0 ? (
                <div style={{ position: "relative" }}>
                  <img src={imgs[0]} alt={selected.title}
                    style={{ width: "100%", maxHeight: 280,
                      objectFit: "cover", display: "block" }} />
                  {imgs.length > 1 && (
                    <div style={{ display: "flex", gap: 6, padding: "8px 12px",
                      background: "#000", overflowX: "auto" }}>
                      {imgs.map((img, i) => (
                        <img key={i} src={img} alt=""
                          style={{ width: 56, height: 56, borderRadius: 8,
                            objectFit: "cover", flexShrink: 0,
                            border: `2px solid ${C.accent}`, cursor: "pointer" }} />
                      ))}
                    </div>
                  )}
                </div>
              ) : selected.videoUrl ? (
                <video controls src={selected.videoUrl} style={{ width: "100%", maxHeight: 280, display: "block", background: "#000" }}>
                  O seu browser não suporta vídeo.
                </video>
              ) : (
                <div style={{ height: 160,
                   background: C.primary,
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon icon={faBuilding} size={56} color={`${C.primary}60`} />
                </div>
              );
            })()}

            <div style={{ padding: "20px 20px 28px" }}>
              {/* Categoria */}
              {selected.category && (
                <span style={{ background: `${C.accent}15`, color: C.accent,
                  fontSize: 11, fontWeight: 700, padding: "3px 10px",
                  borderRadius: 12, display: "inline-block", marginBottom: 10 }}>
                  {selected.category}
                </span>
              )}

              {/* Título */}
              <h3 style={{ fontSize: 20, fontWeight: 800, color: C.dark,
                margin: "0 0 10px" }}>{selected.title}</h3>

              {/* Descrição */}
              {selected.description && (
                <p style={{ color: C.gray, fontSize: 14, lineHeight: 1.6,
                  margin: "0 0 16px" }}>{selected.description}</p>
              )}

              {/* Estatísticas */}
              <div style={{ display: "flex", gap: 16, padding: "12px 0",
                borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
                marginBottom: 16 }}>
                {[
                  [faImages,   `${parseImages(selected.imageUrls).length} fotos`],
                  [faCalendarAlt, selected.createdAt ? new Date(selected.createdAt).toLocaleDateString("pt") : "—"],
                  [faBuilding, selected.category || "Geral"],
                ].map(([ico, val], i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center",
                    gap: 6, color: C.gray, fontSize: 12 }}>
                    <Icon icon={ico} size={13} color={C.gray} /> {val}
                  </div>
                ))}
              </div>

              {/* Ações */}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button onClick={() => setSelected(null)}
                style={{ flex: 1, padding: "11px", border: `1px solid ${C.border}`,
                  borderRadius: 12, background: "transparent", cursor: "pointer",
                  fontSize: 13, fontWeight: 600, color: C.gray,
                  fontFamily: "'DM Sans', sans-serif",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Icon icon={faTimes} size={13} color={C.gray} /> Fechar
              </button>
              <button onClick={() => {
                  setEditItem(selected);
                  setTitle(selected.title);
                  setDesc(selected.description || "");
                  setCat(selected.category || "");
                  setVideoUrl(selected.videoUrl || "");
                  setPhotos(parseImages(selected.imageUrls));
                  setSelected(null);
                  setShowForm(true);
                }}
                style={{ flex: 1, padding: "11px", border: `1.5px solid ${C.primary}`,
                  borderRadius: 12, background: "transparent", cursor: "pointer",
                  fontSize: 13, fontWeight: 600, color: C.primary,
                  fontFamily: "'DM Sans', sans-serif",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Icon icon={faPencilAlt} size={13} color={C.primary} /> Editar
              </button>
              <button onClick={async () => {
                  if (!window.confirm("Eliminar este projecto?")) return;
                  try {
                    const { portfolioAPI } = await import("./services/api");
                    await portfolioAPI.delete(selected.id);
                    setItems(prev => prev.filter(i => i.id !== selected.id));
                    setSelected(null);
                  } catch (err) { alert(err.message); }
                }}
                style={{ flex: 1, padding: "11px", border: "none",
                  borderRadius: 12, background: C.error, cursor: "pointer",
                  fontSize: 13, fontWeight: 600, color: "#fff",
                  fontFamily: "'DM Sans', sans-serif",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Icon icon={faTimes} size={13} color="#fff" /> Eliminar
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// PERFIL DO PROFISSIONAL
// ============================================================
const ProfProfile = ({ user, onLogout, onUpdate, initialSection, onSectionChange, specialties }) => {
  const [section, setSection] = useState(initialSection || null);

  useEffect(() => {
    if (initialSection) {
      setSection(initialSection);
      if (onSectionChange) onSectionChange(null);
    }
  }, [initialSection]);
  const [successMsg, setSuccessMsg] = useState(null);

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 3001); };

  const BackBtn = () => (
    <button onClick={() => setSection(null)} style={{ background: "#2a2a3e", border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
      <Icon icon={faArrowLeft} size={13} color="#fff" /> Voltar
    </button>
  );

  const EditProfProfile = () => {
    const prof = user?.professional || {};
    const [address, setAddress] = useState(prof.address || "");
    const [city, setCity] = useState(prof.city || "");
    const [island, setIsland] = useState(prof.island || "");
    const [postalCode, setPostalCode] = useState(prof.postalCode || "");
    const [name, setName] = useState(user?.name || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [specialty, setSpecialty] = useState(prof.specialty || "");
    const [location, setLocation] = useState(prof.location || "");
    const [about, setAbout] = useState(prof.about || "");
    const [priceMin, setPriceMin] = useState(prof.priceMin || "");
    const [priceMax, setPriceMax] = useState(prof.priceMax || "");
    const [experience, setExp] = useState(prof.experience || "");
    const [tags, setTags] = useState(prof.tags || "");
    const [available, setAvailable] = useState(prof.available ?? true);
    const [latitude, setLatitude] = useState(prof.latitude || null);
    const [longitude, setLongitude] = useState(prof.longitude || null);
    const [radius, setRadius] = useState(prof.radius || 10);
    const [saving, setSaving] = useState(false);
    const [geocoding, setGeocoding] = useState(false);
    const [photoURL, setPhotoURL] = useState(user?.avatar || user?.photo || null);
    const [coverURL, setCoverURL] = useState(prof.coverPhoto || null);
    const avatarRef = useRef(null);
    const coverRef = useRef(null);

    // Geocodificação reversa: Coordenadas -> Morada escrita
    const updateAddressFromCoords = async (lat, lng) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
        const data = await res.json();
        if (data && data.address) {
          const addr = data.address;
          const road = addr.road || addr.suburb || addr.neighbourhood || "";
          const houseNumber = addr.house_number || "";
          const streetAddress = road ? `${road}${houseNumber ? ', ' + houseNumber : ''}` : "";
          if (streetAddress) setAddress(streetAddress);
          
          const parsedCity = addr.city || addr.town || addr.village || addr.municipality || "";
          if (parsedCity) setCity(parsedCity);
          
          const parsedIsland = addr.island || addr.county || "";
          if (parsedIsland) setIsland(parsedIsland);
          
          if (addr.postcode) setPostalCode(addr.postcode);
          
          if (parsedCity || parsedIsland) {
            setLocation([parsedCity, parsedIsland].filter(Boolean).join(", "));
          }
        }
      } catch (err) {
        console.error("Erro ao obter endereço das coordenadas:", err);
      }
    };

    // Geocodificação direta: Morada escrita -> Coordenadas no mapa
    const geocodeAddress = async () => {
      const query = [address, city, island].filter(Boolean).join(", ");
      if (!query) {
        alert("Preencha a Cidade, Ilha ou Endereço primeiro.");
        return;
      }
      setGeocoding(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encod$00IComponent(query)}&limit=1`);
        const data = await res.json();
        if (data && data.length > 0) {
          const first = data[0];
          setLatitude(parseFloat(first.lat));
          setLongitude(parseFloat(first.lon));
        } else {
          alert("Endereço não encontrado no mapa. Tente simplificar.");
        }
      } catch (err) {
        console.error("Erro ao geocodificar:", err);
        alert("Erro ao ligar ao servidor do mapa.");
      } finally {
        setGeocoding(false);
      }
    };

    const finalSpecialties = specialties && specialties.length > 0
      ? specialties
      : ["Pedreiro", "Eletricista", "Canalizador", "Pintor", "Carpinteiro", "Engenheiro Civil", "Arquitecto", "Serralheiro"];

    const handlePhoto = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoURL(ev.target.result);
      reader.readAsDataURL(file);
    };

    const handleCover = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => setCoverURL(ev.target.result);
      reader.readAsDataURL(file);
    };

    const save = async () => {
      setSaving(true);
      try {
        const { usersAPI, professionalsAPI } = await import("./services/api");

        // Só envia avatar se foi alterado (evita payload gigante em cada save)
        const userPayload = { name, phone };
        const originalAvatar = user?.avatar || user?.photo || null;
        if (photoURL !== originalAvatar) {
          userPayload.avatar = photoURL;
        }

        await usersAPI.update(user.id, userPayload);

        let updatedProf = {};
        if (prof.id) {
          updatedProf = await professionalsAPI.update(prof.id, {
            specialty,
            location,
            about,
            available,
            priceMin: priceMin !== "" ? priceMin : null,
            priceMax: priceMax !== "" ? priceMax : null,
            experience: experience !== "" ? experience : 0,
            tags,
            address, city, island, postalCode,
            coverPhoto: coverURL,
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            radius: parseFloat(radius),
          });
        }

        const newUser = {
          ...user,
          name,
          phone,
          avatar: photoURL,
          professional: {
            ...prof,
            ...updatedProf,
            specialty, location, about, available,
            priceMin, priceMax, experience, tags,
            address, city, island, postalCode,
            coverPhoto: coverURL,
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            radius: parseFloat(radius),
          }
        };
        localStorage.setItem("buildmatch_user", JSON.stringify(newUser));
        onUpdate(newUser);
        showSuccess("Perfil actualizado com sucesso!");
        setSection(null);
      } catch (err) {
        alert("Erro ao guardar: " + (err.message || "Tente novamente."));
      } finally { setSaving(false); }
    };

    return (
      <div style={{ padding: "20px 16px", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <BackBtn />
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.dark, margin: 0 }}>Editar Perfil</h2>
        </div>
        
        {/* Cover Photo Banner & Avatar */}
        <div style={{
          position: "relative",
          height: 140,
          borderRadius: 16,
          backgroundImage: coverURL ? `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.4)), url(${coverURL})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: coverURL ? "transparent" : C.primary,
          marginBottom: 60,
          display: "flex",
          justifyContent: "center"
        }}>
          <button
            onClick={() => coverRef.current?.click()}
            style={{
              position: "absolute", top: 12, right: 12,
              background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.4)",
              borderRadius: 8, padding: "6px 12px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6, color: "#fff", fontSize: 12, fontWeight: 600
            }}>
            <Icon icon={faCamera} size={12} color="#fff" /> Alterar Capa
          </button>
          <input ref={coverRef} type="file" accept="image/*" onChange={handleCover} style={{ display: "none" }} />

          <div style={{ position: "absolute", bottom: -44, display: "inline-block" }}>
            <Avatar name={name} color={C.accent} size={88} src={photoURL} />
            <button
              onClick={() => avatarRef.current?.click()}
              style={{
                position: "absolute", bottom: 0, right: 0,
                background: C.accent, border: "2px solid #fff",
                width: 30, height: 30, borderRadius: "50%", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
              }}>
              <Icon icon={faCamera} size={12} color="#fff" />
            </button>
            <input ref={avatarRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
          </div>
        </div>

        <Card style={{ marginBottom: 14 }}>
          <h4 style={{ margin: "0 0 14px", color: C.dark, fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon icon={faUser} size={14} color={C.accent} /> Dados pessoais
          </h4>
          <Input label="Nome completo" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" />
          <Input label="Telefone" value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="+238 991 0000" />
        </Card>
        <Card style={{ marginBottom: 14 }}>
          <h4 style={{ margin: "0 0 14px", color: C.dark, fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon icon={faHammer} size={14} color={C.accent} /> Dados profissionais
          </h4>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.dark, display: "block", marginBottom: 6 }}>Especialidade</label>
            <select value={specialty} onChange={e => setSpecialty(e.target.value)} style={{ width: "100%", padding: "12px 14px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", background: C.white }}>
              <option value="">Seleccionar especialidade</option>
              {finalSpecialties.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Input label="Localização (ex: Praia, Santiago)" value={location} onChange={e => setLocation(e.target.value)} placeholder="Ex: Praia, Santiago" />
          <Input label="Endereço (rua, número)" value={address} onChange={e => setAddress(e.target.value)} placeholder="Ex: Rua de Achada Santo António, 12" />
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 2 }}><Input label="Cidade" value={city} onChange={e => setCity(e.target.value)} placeholder="Ex: Praia" /></div>
            <div style={{ flex: 2 }}><Input label="Ilha" value={island} onChange={e => setIsland(e.target.value)} placeholder="Ex: Santiago" /></div>
            <div style={{ flex: 1 }}><Input label="Código postal" value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="Ex: 7600" /></div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <button type="button" onClick={geocodeAddress} disabled={geocoding}
              style={{ width: "100%", padding: "10px", background: "transparent", border: `1.5px solid ${C.primary}`, color: C.primary, borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>
              {geocoding ? "A procurar no mapa..." : "🔍 Sincronizar mapa com a morada indicada acima"}
            </button>
          </div>

          {/* Selector de coordenadas no mapa */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.dark, display: "block", marginBottom: 6 }}>📍 Pin no Mapa (Coordenadas de Serviço)</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <button type="button" onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition((pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    setLatitude(lat);
                    setLongitude(lng);
                    updateAddressFromCoords(lat, lng);
                  }, (err) => {
                    alert("Não foi possível obter a sua localização GPS.");
                  });
                } else {
                  alert("Geolocalização não é suportada por este browser.");
                }
              }} style={{ padding: "8px 12px", background: `${C.primary}12`, border: `1px solid ${C.primary}30`, borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, color: C.primary, fontFamily: "'DM Sans', sans-serif" }}>
                📍 Detetar a minha localização GPS
              </button>
              {latitude && (
                <span style={{ fontSize: 12, color: C.gray, alignSelf: "center" }}>
                  Lat: {latitude.toFixed(5)}, Lng: {longitude.toFixed(5)}
                </span>
              )}
            </div>
            <LeafletMap lat={latitude} lng={longitude} radius={radius} editable onCoordsChange={(lat, lng) => {
              setLatitude(lat);
              setLongitude(lng);
              updateAddressFromCoords(lat, lng); // Sincroniza em tempo real ao arrastar
            }} />
          </div>

          {/* Raio de atendimento */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.dark, display: "block", marginBottom: 4 }}>Raio de atendimento: <strong>{radius} km</strong></label>
            <input type="range" min={1} max={100} value={radius} onChange={e => setRadius(parseInt(e.target.value))}
              style={{ width: "100%", accentColor: C.primary }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.gray }}>
              <span>1 km</span><span>100 km</span>
            </div>
          </div>

          <Input label="Anos de experiência" value={experience} onChange={e => setExp(e.target.value)} type="number" placeholder="Ex: 5" />
          <Input label="Tags (separadas por vírgula)" value={tags} onChange={e => setTags(e.target.value)} placeholder="Ex: Residencial, Restauro" />
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}><Input label="Preço mín. (CVE/h)" value={priceMin} onChange={e => setPriceMin(e.target.value)} type="number" placeholder="500" /></div>
            <div style={{ flex: 1 }}><Input label="Preço máx. (CVE/h)" value={priceMax} onChange={e => setPriceMax(e.target.value)} type="number" placeholder="1000" /></div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.dark, display: "block", marginBottom: 6 }}>Sobre mim</label>
            <textarea value={about} onChange={e => setAbout(e.target.value)} placeholder="Descreva a sua experiência..."
              style={{ width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 10, padding: 12, fontSize: 14, fontFamily: "'DM Sans', sans-serif", resize: "vertical", minHeight: 100, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderTop: `1px solid ${C.border}` }}>
            <div>
              <div style={{ fontWeight: 600, color: C.dark, fontSize: 14 }}>Disponível para serviços</div>
              <div style={{ color: C.gray, fontSize: 12, marginTop: 2 }}>{available ? "Aparece nas pesquisas" : "Oculto das pesquisas"}</div>
            </div>
            <Toggle value={available} onChange={() => setAvailable(!available)} accentColor={C.accent} />
          </div>
        </Card>
        <Btn onClick={save} full variant="accent" disabled={saving}>
          <Icon icon={faSave} size={14} color="#fff" /> {saving ? "A guardar..." : "Guardar alterações"}
        </Btn>
      </div>
    );
  };

  const ChangePassword = () => {
    const [currentPass, setCurrentPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const save = async () => {
      setError("");
      if (!currentPass || !newPass || !confirmPass) { setError("Preencha todos os campos"); return; }
      if (newPass !== confirmPass) { setError("As novas passwords não coincidem"); return; }
      if (newPass.length < 6) { setError("Mínimo 6 caracteres"); return; }
      setSaving(true);
      try {
        const { authAPI } = await import("./services/api");
        await authAPI.changePassword({ currentPassword: currentPass, newPassword: newPass });
        showSuccess("Password alterada com sucesso!");
        setSection(null);
      } catch (err) { setError(err.message); } finally { setSaving(false); }
    };

    return (
      <div style={{ padding: "20px 16px", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <BackBtn />
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.dark, margin: 0 }}>Alterar Password</h2>
        </div>
        <Card>
          {error && <ErrMsg msg={error} />}
          <Input label="Password actual" value={currentPass} onChange={e => setCurrentPass(e.target.value)} type="password" placeholder="••••••••" />
          <Input label="Nova password" value={newPass} onChange={e => setNewPass(e.target.value)} type="password" placeholder="••••••••" />
          <Input label="Confirmar password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} type="password" placeholder="••••••••" />
          <Btn onClick={save} full variant="accent" disabled={saving}>
            <Icon icon={faLock} size={14} color="#fff" /> {saving ? "A alterar..." : "Alterar password"}
          </Btn>
        </Card>
      </div>
    );
  };

  const Notifications = () => {
    const [settings, setSettings] = useState({ newProject: true, newMessage: true, newReview: true, reminders: true, promotions: false, email: true, sms: false });
    const toggle = (key) => setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    const items = [
      { key: "newProject", icon: faClipboardList, label: "Novos projectos", desc: "Quando um cliente solicitar serviço" },
      { key: "newMessage", icon: faComments, label: "Novas mensagens", desc: "Quando receber uma mensagem" },
      { key: "newReview", icon: faStar, label: "Novas avaliações", desc: "Quando um cliente avaliar" },
      { key: "reminders", icon: faCalendarAlt, label: "Lembretes", desc: "Antes do serviço agendado" },
      { key: "promotions", icon: faLightbulb, label: "Novidades BuildMatch", desc: "Actualizações da plataforma" },
      { key: "email", icon: faEnvelope, label: "Notificações por email", desc: "Receber alertas por email" },
      { key: "sms", icon: faPhone, label: "Notificações por SMS", desc: "Receber alertas por SMS" },
    ];
    return (
      <div style={{ padding: "20px 16px", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <BackBtn />
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.dark, margin: 0 }}>Notificações</h2>
        </div>
        <Card>
          {items.map((item, i) => (
            <div key={item.key}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${C.accent}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon icon={item.icon} size={18} color={C.accent} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: C.dark, fontSize: 14 }}>{item.label}</div>
                  <div style={{ color: C.gray, fontSize: 12, marginTop: 2 }}>{item.desc}</div>
                </div>
                <Toggle value={settings[item.key]} onChange={() => toggle(item.key)} accentColor={C.accent} />
              </div>
              {i < items.length - 1 && <div style={{ height: 1, background: C.border }} />}
            </div>
          ))}
        </Card>
        <div style={{ marginTop: 16 }}>
          <Btn onClick={() => { showSuccess("Preferências guardadas!"); setSection(null); }} full variant="accent">
            <Icon icon={faSave} size={14} color="#fff" /> Guardar preferências
          </Btn>
        </div>
      </div>
    );
  };

  const Statistics = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setL] = useState(true);

    useEffect(() => {
      projectsAPI.list().then(d => setProjects(d.data || [])).catch(() => setProjects([])).finally(() => setL(false));
    }, []);

    const completed = projects.filter(p => p.status === "COMPLETED").length;
    const active = projects.filter(p => p.status === "ACTIVE").length;
    const pending = projects.filter(p => p.status === "PENDING").length;
    const total = projects.length;
    const revenue = projects.filter(p => p.status === "COMPLETED").reduce((sum, p) => sum + (p.amount || 0), 0);
    const prof = user?.professional;
    const convRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
      <div style={{ padding: "20px 16px", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <BackBtn />
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.dark, margin: 0 }}>Estatísticas</h2>
        </div>
        {loading ? <Spinner /> : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <StatCard icon={faClipboardList} label="Total" value={total} color={C.primary} />
              <StatCard icon={faCheck} label="Concluídos" value={completed} color={C.success} />
              <StatCard icon={faClock} label="Em andamento" value={active} color={C.accent} />
              <StatCard icon={faExclamationCircle} label="Pendentes" value={pending} color="#F59E0B" />
            </div>
            <Card style={{ marginBottom: 14 }}>
              <h4 style={{ margin: "0 0 14px", color: C.dark, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                <Icon icon={faMoneyBillWave} size={14} color={C.accent} /> Receita total
              </h4>
              <div style={{ fontSize: 28, fontWeight: 800, color: C.accent }}>{revenue.toLocaleString()} CVE</div>
              <div style={{ color: C.gray, fontSize: 13, marginTop: 4 }}>Baseado em {completed} projectos concluídos</div>
            </Card>
            <Card style={{ marginBottom: 14 }}>
              <h4 style={{ margin: "0 0 14px", color: C.dark, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                <Icon icon={faChartLine} size={14} color={C.accent} /> Desempenho
              </h4>
              <div style={{ display: "flex", gap: 20 }}>
                <div><div style={{ fontSize: 22, fontWeight: 800, color: "#F59E0B" }}>{prof?.rating?.toFixed(1) || "0.0"}</div><div style={{ fontSize: 12, color: C.gray }}>Avaliação</div></div>
                <div><div style={{ fontSize: 22, fontWeight: 800, color: C.primary }}>{prof?.reviewCount || 0}</div><div style={{ fontSize: 12, color: C.gray }}>Avaliações</div></div>
                <div><div style={{ fontSize: 22, fontWeight: 800, color: C.success }}>{convRate}%</div><div style={{ fontSize: 12, color: C.gray }}>Conversão</div></div>
                <div><div style={{ fontSize: 22, fontWeight: 800, color: C.accent }}>{prof?.experience || 0}</div><div style={{ fontSize: 12, color: C.gray }}>Anos exp.</div></div>
              </div>
            </Card>
            <div style={{ background: `${C.accent}10`, borderRadius: 14, padding: 16, border: `1px solid ${C.accent}30` }}>
              <p style={{ margin: 0, fontSize: 13, color: C.accent, fontWeight: 600, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                <Icon icon={faLightbulb} size={13} color={C.accent} /> Dica para melhorar
              </p>
              <p style={{ margin: 0, fontSize: 13, color: C.gray, lineHeight: 1.5 }}>
                {convRate < 50 ? "Actualize o portfólio e responda rapidamente às mensagens." : "Excelente desempenho! Continue a manter o portfólio actualizado."}
              </p>
            </div>
          </>
        )}
      </div>
    );
  };

  const MyReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setL] = useState(true);
    const [reply, setReply] = useState({});
    const [saving, setSaving] = useState(null);

    useEffect(() => {
      const prof = user?.professional;
      if (!prof?.id) { setL(false); return; }
      import("./services/api").then(({ reviewsAPI }) =>
        reviewsAPI.list(prof.id).then(d => setReviews(d.data || [])).catch(() => setReviews([])).finally(() => setL(false))
      );
    }, []);

    const submitReply = async (reviewId) => {
      if (!reply[reviewId]?.trim()) return;
      setSaving(reviewId);
      try {
        const { reviewsAPI } = await import("./services/api");
        await reviewsAPI.reply(reviewId, reply[reviewId]);
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, reply: reply[reviewId] } : r));
        setReply(prev => ({ ...prev, [reviewId]: "" }));
        showSuccess("Resposta enviada!");
      } catch (err) { alert(err.message); } finally { setSaving(null); }
    };

    return (
      <div style={{ padding: "20px 16px", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <BackBtn />
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.dark, margin: 0 }}>Avaliações Recebidas</h2>
        </div>
        <Card style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#F59E0B" }}>{user?.professional?.rating?.toFixed(1) || "0.0"}</div>
            <Stars rating={user?.professional?.rating || 0} size={14} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: C.dark }}>{user?.professional?.reviewCount || 0} avaliações</div>
            <div style={{ color: C.gray, fontSize: 13, marginTop: 4 }}>Clique em Responder para responder</div>
          </div>
        </Card>
        {loading ? <Spinner /> : reviews.length === 0
          ? <div style={{ textAlign: "center", padding: 48, color: C.gray }}><Icon icon={faStar} size={48} color={C.border} /><p style={{ marginTop: 12 }}>Ainda não tem avaliações</p></div>
          : reviews.map(r => (
            <Card key={r.id} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <Avatar name={r.author?.name || "Cliente"} size={38} />
                  <div>
                    <div style={{ fontWeight: 700, color: C.dark, fontSize: 14 }}>{r.author?.name}</div>
                    <div style={{ color: C.gray, fontSize: 12 }}>{new Date(r.createdAt).toLocaleDateString("pt")}</div>
                  </div>
                </div>
                <Stars rating={r.rating} size={16} />
              </div>
              <p style={{ color: C.gray, fontSize: 13, lineHeight: 1.6, margin: "0 0 10px", background: C.lightGray, padding: "10px 12px", borderRadius: 10 }}>"{r.comment}"</p>
              {r.reply && (
                <div style={{ background: `${C.accent}10`, borderLeft: `3px solid ${C.accent}`, padding: "8px 12px", borderRadius: "0 8px 8px 0", marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.accent, marginBottom: 4 }}>A sua resposta:</div>
                  <p style={{ color: C.dark, fontSize: 13, margin: 0 }}>{r.reply}</p>
                </div>
              )}
              {!r.reply && (
                <div>
                  <textarea value={reply[r.id] || ""} onChange={e => setReply(prev => ({ ...prev, [r.id]: e.target.value }))}
                    placeholder="Escreva a sua resposta..."
                    style={{ width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 10, padding: 10, fontSize: 13, fontFamily: "'DM Sans', sans-serif", resize: "vertical", minHeight: 70, outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
                  <Btn onClick={() => submitReply(r.id)} variant="accent" small disabled={saving === r.id || !reply[r.id]?.trim()}>
                    <Icon icon={faReply} size={12} color="#fff" /> {saving === r.id ? "A enviar..." : "Responder"}
                  </Btn>
                </div>
              )}
            </Card>
          ))
        }
      </div>
    );
  };

  const Help = () => {
    const [openFaq, setOpenFaq] = useState(null);
    const faqs = [
      { q: "Como apareço nas pesquisas?", a: "Active 'Disponível para serviços' no Editar Perfil." },
      { q: "Como aceito um projecto?", a: "Projectos → Pendentes → Aceitar." },
      { q: "Como respondo a uma avaliação?", a: "Perfil → Avaliações Recebidas → Responder." },
      { q: "Como adiciono fotos ao portfólio?", a: "Portfólio → Adicionar." },
      { q: "Como gestão os horários?", a: "Agenda → Adicionar horário." },
    ];
    return (
      <div style={{ padding: "20px 16px", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <BackBtn />
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.dark, margin: 0 }}>Ajuda</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[[faComments, "Chat", "Resposta imediata"], [faEnvelope, "Email", "buildmatch@us.edu.cv"]].map(([ico, label, desc], i) => (
            <Card key={i} style={{ padding: 16, textAlign: "center" }}>
              <Icon icon={ico} size={28} color={C.accent} />
              <div style={{ fontWeight: 700, color: C.dark, fontSize: 14, marginTop: 8 }}>{label}</div>
              <div style={{ color: C.gray, fontSize: 11, marginTop: 4 }}>{desc}</div>
            </Card>
          ))}
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.dark, marginBottom: 12 }}>Perguntas frequentes</h3>
        {faqs.map((faq, i) => (
          <div key={i} style={{ background: C.white, borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 8 }}>
            <div onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
              <span style={{ fontWeight: 600, color: C.dark, fontSize: 13, flex: 1, paddingRight: 10 }}>{faq.q}</span>
              <Icon icon={faChevronDown} size={12} color={C.accent} style={{ transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
            </div>
            {openFaq === i && <div style={{ padding: "0 16px 14px", color: C.gray, fontSize: 13, lineHeight: 1.6, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>{faq.a}</div>}
          </div>
        ))}
        <Card style={{ marginTop: 20, background: `${C.accent}08`, border: `1px solid ${C.accent}20` }}>
          <p style={{ margin: 0, fontSize: 13, color: C.accent, fontWeight: 600, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon icon={faPhone} size={12} color={C.accent} /> Suporte técnico
          </p>
          <p style={{ margin: 0, fontSize: 13, color: C.gray }}>Universidade de Santiago — CSAT | Segunda a Sexta: 08h00 — 17h00</p>
        </Card>
      </div>
    );
  };

  if (section === "edit") return <EditProfProfile />;
  if (section === "password") return <ChangePassword />;
  if (section === "notifications") return <Notifications />;
  if (section === "stats") return <Statistics />;
  if (section === "reviews") return <MyReviews />;
  if (section === "help") return <Help />;

  const prof = user?.professional;
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {successMsg && <SuccessModal message={successMsg} onClose={() => setSuccessMsg(null)} />}
      <div style={{
        backgroundImage: prof?.coverPhoto ? `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(${prof.coverPhoto})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: prof?.coverPhoto ? "transparent" : C.primary,
        padding: "28px 16px 50px",
        textAlign: "center"
      }}>
        <Avatar name={user?.name} color={C.accent} size={80} src={user?.avatar} />
        <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 800, marginTop: 12, marginBottom: 4 }}>{user?.name}</h2>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: 0 }}>{prof?.specialty || "Profissional"}</p>
        <div style={{ background: C.accent, display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 16px", borderRadius: 20, marginTop: 8 }}>
          <Icon icon={faHammer} size={12} color="#fff" />
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>PRO</span>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 28, marginTop: 16 }}>
          {[[prof?.rating?.toFixed(1) || "0.0", "Avaliação"], [prof?.reviewCount || 0, "Avaliações"], [prof?.experience || 0, "Anos"]].map(([v, l], i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 18 }}>{v}</div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: "0 16px", marginTop: -24 }}>
        <Card style={{ marginBottom: 14, padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: prof?.available ? C.success : C.error, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: C.dark, fontSize: 14 }}>{prof?.available ? "Disponível para serviços" : "Indisponível"}</div>
            <div style={{ color: C.gray, fontSize: 12 }}>{prof?.available ? "Apareço nas pesquisas" : "Oculto das pesquisas"}</div>
          </div>
          <Btn onClick={() => setSection("edit")} variant="ghost" small>Editar</Btn>
        </Card>
        <Card style={{ marginBottom: 14, padding: 8 }}>
          {[
            { icon: faPencilAlt, label: "Editar perfil", desc: "Especialidade, preços, localização", key: "edit" },
            { icon: faChartBar, label: "Estatísticas", desc: "Projectos, receita, avaliações", key: "stats" },
            { icon: faStar, label: "Avaliações recebidas", desc: "Ver e responder avaliações", key: "reviews" },
            { icon: faBell, label: "Notificações", desc: "Gerir alertas e avisos", key: "notifications" },
            { icon: faKey, label: "Alterar password", desc: "Segurança da conta", key: "password" },
            { icon: faQuestionCircle, label: "Ajuda", desc: "FAQ e suporte técnico", key: "help" },
          ].map((item, i, arr) => (
            <div key={item.key}>
              <div onClick={() => setSection(item.key)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 10px", cursor: "pointer", borderRadius: 10 }}
                onMouseEnter={e => e.currentTarget.style.background = C.lightGray}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${C.accent}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon icon={item.icon} size={18} color={C.accent} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: C.dark, fontSize: 14 }}>{item.label}</div>
                  <div style={{ color: C.gray, fontSize: 12, marginTop: 1 }}>{item.desc}</div>
                </div>
                <Icon icon={faChevronRight} size={13} color="#9CA3AF" />
              </div>
              {i < arr.length - 1 && <div style={{ height: 1, background: C.border, marginLeft: 62 }} />}
            </div>
          ))}
        </Card>
        <p style={{ textAlign: "center", color: C.gray, fontSize: 12, marginBottom: 14 }}>BuildMatch v1.0.0</p>
        <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px", background: C.error, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: "'DM Sans', sans-serif", marginBottom: 32 }}>
          <Icon icon={faSignOutAlt} size={16} color="#fff" /> Terminar sessão
        </button>
      </div>
    </div>
  );
};

// ============================================================
// CHAT
// ============================================================
const ChatScreen = ({ conversation, user, onBack, embedded = false }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isPro = user?.type === "PROFESSIONAL";

  // ── Estados para Acordo & Pagamentos ──────────────
  const [chatTab, setChatTab] = useState(conversation.initialTab || "messages"); // messages | project
  const [proposal, setProposal] = useState(null);
  const [project, setProject] = useState(null);
  const [contract, setContract] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [payments, setPayments] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loadingProject, setLoadingProject] = useState(false);

  // Forms
  const [proposedAmount, setProposedAmount] = useState("");
  const [proposedDeadline, setProposedDeadline] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [counterAmount, setCounterAmount] = useState("");
  const [showCounterForm, setShowCounterForm] = useState(false);

  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneAmount, setMilestoneAmount] = useState("");
  const [milestoneDueDate, setMilestoneDueDate] = useState("");

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentProof, setPaymentProof] = useState("");
  const [paymentMilestoneId, setPaymentMilestoneId] = useState("");
  const [viewingProofId, setViewingProofId] = useState(null);

  const [disputeDesc, setDisputeDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Review states
  const [ratingVal, setRatingVal] = useState(5);
  const [commentVal, setCommentVal] = useState("");
  const [reviewed, setReviewed] = useState(false);

  // ── Histórico inicial via API REST ──────────────
  useEffect(() => {
    messagesAPI.history(conversation.id)
      .then(d => setMessages(d.data || [])).catch(() => setMessages([])).finally(() => setLoading(false));
  }, [conversation.id]);

  // ── Ligação Socket.IO — chat em tempo real ──────
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token: localStorage.getItem("buildmatch_token") },
    });
    socketRef.current = socket;
    socket.emit("join_room", conversation.id);

    socket.on("receive_message", (data) => {
      setMessages(prev => {
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, data];
      });
      setPeerTyping(false);
    });

    socket.on("user_typing", (data) => {
      if (data.senderId === user?.id) return;
      setPeerTyping(true);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setPeerTyping(false), 2000);
    });

    return () => {
      clearTimeout(typingTimeoutRef.current);
      socket.disconnect();
    };
  }, [conversation.id, user?.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, peerTyping]);

  useEffect(() => {
    if (!loading && chatTab === "messages") setTimeout(() => inputRef.current?.focus(), 100);
  }, [loading, chatTab]);

  const notifyTyping = () => {
    socketRef.current?.emit("typing", { projectId: conversation.id, senderId: user?.id });
  };

  const send = async () => {
    if (!text.trim() || sending) return;
    const content = text.trim();
    setText("");
    setSending(true);
    const temp = { id: `temp-${Date.now()}`, content, senderId: user?.id, createdAt: new Date().toISOString(), sending: true };
    setMessages(prev => [...prev, temp]);
    try {
      const msg = await messagesAPI.send(conversation.id, { content });
      setMessages(prev => prev.map(m => m.id === temp.id ? msg : m));
      socketRef.current?.emit("send_message", { ...msg, projectId: conversation.id });
    } catch {
      setMessages(prev => prev.filter(m => m.id !== temp.id));
      setText(content);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  // ── Carregar Dados do Projeto ─────────────────────
  const loadProjectData = async () => {
    setLoadingProject(true);
    try {
      const projRes = await projectsAPI.get(conversation.id);
      setProject(projRes);

      const propRes = await proposalsAPI.listByProject(conversation.id);
      const allProposals = propRes.data || [];
      // Prioritize ACCEPTED proposal, then COUNTERED, then PENDING
      const activeProp =
        allProposals.find(p => p.status === "ACCEPTED") ||
        allProposals.find(p => p.status === "COUNTERED") ||
        allProposals.find(p => p.status === "PENDING") ||
        allProposals[0] || null;
      setProposal(activeProp || null);

      // Only load contract when proposal has been ACCEPTED (contract exists)
      if (activeProp && activeProp.status === "ACCEPTED") {
        try {
          const contr = await contractsAPI.getByProject(conversation.id);
          setContract(contr || null);
          if (contr) {
            const miles = await milestonesAPI.list(contr.id);
            setMilestones(miles.data || []);
          }
        } catch {
          setContract(null);
          setMilestones([]);
        }
      } else {
        setContract(null);
        setMilestones([]);
      }

      const payRes = await paymentsAPI.list(conversation.id);
      setPayments(payRes.data || []);

      const dispRes = await disputesAPI.list(conversation.id);
      setDisputes(dispRes.data || []);

      // Check if project is completed and already reviewed
      if (activeProp?.project?.status === "COMPLETED") {
        try {
          const rRes = await (isPro ? reviewsAPI.listClient(activeProp.clientId) : reviewsAPI.list(activeProp.professionalId));
          const hasReviewed = (rRes.data || []).some(r => r.projectId === conversation.id);
          setReviewed(hasReviewed);
        } catch {
          setReviewed(false);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProject(false);
    }
  };

  useEffect(() => {
    if (conversation.initialTab) {
      setChatTab(conversation.initialTab);
      if (conversation.initialTab === "project") {
        loadProjectData();
      }
    }
  }, [conversation.initialTab, conversation.id]);

  // ── Ações de Proposta ─────────────────────────────
  const submitProposal = async () => {
    if (!proposedAmount) return;
    setSubmitting(true);
    try {
      await proposalsAPI.create({
        projectId: conversation.id,
        proposedAmount: parseFloat(proposedAmount),
        proposedDeadline: proposedDeadline ? new Date(proposedDeadline).toISOString() : null,
        coverLetter
      });
      await loadProjectData();
      setProposedAmount("");
      setProposedDeadline("");
      setCoverLetter("");
    } catch (err) {
      alert("Erro ao enviar orçamento: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const acceptProposal = async () => {
    if (!proposal) return;
    setSubmitting(true);
    try {
      await proposalsAPI.accept(proposal.id);
      await loadProjectData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const rejectProposal = async () => {
    if (!proposal) return;
    setSubmitting(true);
    try {
      await proposalsAPI.reject(proposal.id);
      await loadProjectData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitCounter = async () => {
    if (!counterAmount || !proposal) return;
    setSubmitting(true);
    try {
      await proposalsAPI.counter(proposal.id, { proposedAmount: parseFloat(counterAmount) });
      setShowCounterForm(false);
      setCounterAmount("");
      await loadProjectData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Ações do Contrato ─────────────────────────────
  const signContract = async () => {
    if (!contract) return;
    setSubmitting(true);
    try {
      await contractsAPI.sign(contract.id);
      await loadProjectData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Ações dos Marcos ──────────────────────────────
  const addMilestone = async () => {
    if (!contract || !milestoneTitle || !milestoneAmount) return;
    setSubmitting(true);
    try {
      await milestonesAPI.create({
        contractId: contract.id,
        title: milestoneTitle,
        amount: parseFloat(milestoneAmount),
        dueDate: milestoneDueDate ? new Date(milestoneDueDate).toISOString() : null
      });
      setMilestoneTitle("");
      setMilestoneAmount("");
      setMilestoneDueDate("");
      await loadProjectData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const completeMilestone = async (mId) => {
    setSubmitting(true);
    try {
      await milestonesAPI.complete(mId);
      await loadProjectData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const releaseMilestone = async (mId) => {
    setSubmitting(true);
    try {
      await milestonesAPI.release(mId);
      await loadProjectData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Ações de Pagamento (Comprovativos) ────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPaymentProof(ev.target.result);
    reader.readAsDataURL(file);
  };

  const submitPayment = async () => {
    if (!paymentAmount || !paymentProof) {
      alert("Selecione o valor e o comprovativo em Base64.");
      return;
    }
    setSubmitting(true);
    try {
      await paymentsAPI.create({
        projectId: conversation.id,
        milestoneId: paymentMilestoneId || null,
        amount: parseFloat(paymentAmount),
        proof: paymentProof
      });
      setPaymentAmount("");
      setPaymentProof("");
      setPaymentMilestoneId("");
      await loadProjectData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const approvePayment = async (pId) => {
    setSubmitting(true);
    try {
      await paymentsAPI.approve(pId);
      await loadProjectData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const rejectPayment = async (pId) => {
    setSubmitting(true);
    try {
      await paymentsAPI.reject(pId);
      await loadProjectData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Ações de Disputa ──────────────────────────────
  const submitDispute = async () => {
    if (!disputeDesc) return;
    setSubmitting(true);
    try {
      await disputesAPI.create({
        contractId: contract?.id,
        description: disputeDesc
      });
      setDisputeDesc("");
      await loadProjectData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Ações de Avaliação Mútua ──────────────────────
  const submitReview = async () => {
    if (!commentVal) return;
    setSubmitting(true);
    try {
      if (isPro) {
        // Professional reviews client
        await reviewsAPI.createClient({
          rating: ratingVal,
          comment: commentVal,
          clientId: proposal.clientId,
          projectId: conversation.id
        });
      } else {
        // Client reviews professional
        await reviewsAPI.create({
          rating: ratingVal,
          comment: commentVal,
          professionalId: proposal.professionalId,
          projectId: conversation.id
        });
      }
      setCommentVal("");
      await loadProjectData();
      alert("Avaliação submetida!");
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const name = isPro
    ? (conversation.client?.name || "Cliente")
    : (conversation.professional?.user?.name || "Profissional");
  const subtitle = conversation.title || conversation.professional?.specialty || "";
  const peerAvatar = isPro
    ? (conversation.client?.avatar || null)
    : (conversation.professional?.user?.avatar || conversation.professional?.avatar || null);
  // Project details the professional needs to see
  const projectTitle = conversation.title || "";
  const projectDescription = conversation.description || "";
  const projectBudget = conversation.budgetAmount || conversation.amount || null;
  const projectDeadline = conversation.budgetDeadline || conversation.startDate || null;
  const hasNoPropsal = !proposal && isPro;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: embedded ? "100%" : "100vh", fontFamily: "'DM Sans', sans-serif", background: C.lightGray }}>
      {/* Header */}
      <div style={{ background: isPro ? "#1a1a2e" : C.primary, padding: "16px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", width: 36, height: 36, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon icon={faArrowLeft} size={14} color="#fff" />
        </button>
        <Avatar name={name} size={42} src={peerAvatar} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
          {subtitle && <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {isPro ? `📋 ${subtitle}` : subtitle}
          </div>}
        </div>
        {/* Professional: quick shortcut to send quote */}
        {isPro && !proposal && (
          <button
            onClick={() => { if (chatTab !== "project") { setChatTab("project"); loadProjectData(); } }}
            style={{ background: C.accent, border: "none", color: "#fff", padding: "6px 12px", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}
          >
            Enviar Orçamento
          </button>
        )}
        {!isPro && <div style={{ width: 10, height: 10, background: C.success, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", flexShrink: 0 }} />}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1.5px solid ${C.border}`, background: C.white, flexShrink: 0 }}>
        <button
          onClick={() => setChatTab("messages")}
          style={{
            flex: 1, padding: "12px", border: "none", background: "transparent",
            fontWeight: 700, fontSize: 13, cursor: "pointer",
            color: chatTab === "messages" ? (isPro ? C.accent : C.primary) : C.gray,
            borderBottom: `3px solid ${chatTab === "messages" ? (isPro ? C.accent : C.primary) : "transparent"}`,
            fontFamily: "'DM Sans', sans-serif"
          }}
        >
          Conversa
        </button>
        <button
          onClick={() => { if (chatTab !== "project") { setChatTab("project"); loadProjectData(); } }}
          style={{
            flex: 1, padding: "12px", border: "none", background: "transparent",
            fontWeight: 700, fontSize: 13, cursor: "pointer",
            color: chatTab === "project" ? (isPro ? C.accent : C.primary) : C.gray,
            borderBottom: `3px solid ${chatTab === "project" ? (isPro ? C.accent : C.primary) : "transparent"}`,
            fontFamily: "'DM Sans', sans-serif"
          }}
        >
          Acordo & Pagamento
        </button>
      </div>

      {/* Content */}
      {chatTab === "messages" ? (
        <>
          {/* Banner para profissional sem proposta enviada */}
          {isPro && !loadingProject && !proposal && (
            <div style={{ background: `linear-gradient(135deg, ${C.accent}15, ${C.accent}05)`, borderBottom: `2px solid ${C.accent}30`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
              <Icon icon={faClipboardList} size={20} color={C.accent} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: C.dark }}>Pedido de Orçamento Recebido</div>
                <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>{projectTitle}</div>
              </div>
              <button
                onClick={() => { setChatTab("project"); loadProjectData(); }}
                style={{ background: C.accent, border: "none", color: "#fff", padding: "8px 14px", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}
              >
                Responder
              </button>
            </div>
          )}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 8 }}>
            {loading ? <Spinner /> : (
              <>
                {messages.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: C.gray }}>
                    <Icon icon={faComments} size={48} color={C.border} />
                    <p style={{ fontWeight: 600, fontSize: 15, margin: "12px 0 6px", color: C.dark }}>Inicie a conversa!</p>
                    <p style={{ fontSize: 13, margin: 0 }}>Escreva a sua mensagem em baixo.</p>
                  </div>
                )}
                {messages.map((msg, i) => {
                  const isMe = msg.senderId === user?.id;
                  const showAvatar = !isMe && (i === 0 || messages[i - 1]?.senderId !== msg.senderId);
                  return (
                    <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8 }}>
                      {!isMe && <div style={{ width: 28, flexShrink: 0 }}>{showAvatar && <Avatar name={name} size={28} src={peerAvatar} />}</div>}
                      <div style={{ maxWidth: "72%" }}>
                        <div style={{ padding: "10px 14px", borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: isMe ? (isPro ? "#1a1a2e" : C.primary) : C.white, color: isMe ? "#fff" : C.dark, fontSize: 14, lineHeight: 1.5, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", opacity: msg.sending ? 0.7 : 1 }}>
                          {msg.content}
                        </div>
                        <div style={{ fontSize: 10, color: C.gray, marginTop: 3, textAlign: isMe ? "right" : "left" }}>
                          {msg.sending ? "A enviar..." : new Date(msg.createdAt).toLocaleTimeString("pt", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {peerTyping && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 28, flexShrink: 0 }}><Avatar name={name} size={28} src={peerAvatar} /></div>
                    <div style={{ padding: "10px 14px", borderRadius: "18px 18px 18px 4px", background: C.white, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", display: "flex", gap: 4 }}>
                      {[0, 1, 2].map(i => (
                        <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: C.gray, opacity: 0.6, animation: `typingDot 1s ${i * 0.15}s infinite ease-in-out` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </>
            )}
          </div>

          <div style={{ background: C.white, padding: "12px 16px", borderTop: `1px solid ${C.border}`, flexShrink: 0, boxShadow: "0 -2px 10px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <textarea ref={inputRef} value={text} onChange={e => { setText(e.target.value); notifyTyping(); }} onKeyDown={handleKey}
                placeholder="Escrever mensagem..." rows={1}
                style={{ flex: 1, border: `1.5px solid ${text ? C.primary : C.border}`, borderRadius: 24, padding: "10px 16px", outline: "none", fontSize: 14, fontFamily: "'DM Sans', sans-serif", resize: "none", boxSizing: "border-box", lineHeight: 1.5, maxHeight: 120, overflowY: "auto", transition: "border-color 0.2s", background: C.white }}
                onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
              />
              <button onClick={send} disabled={!text.trim() || sending} style={{ background: text.trim() ? (isPro ? C.accent : C.primary) : C.border, border: "none", color: "#fff", width: 46, height: 46, borderRadius: "50%", cursor: text.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
                <Icon icon={sending ? faClock : faPaperPlane} size={16} color="#fff" />
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Acordo & Pagamentos Tab */
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }}>
          {loadingProject ? (
            <Spinner />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              
              {/* Status e Ações do Projeto */}
              {project && (
                <Card style={{
                  borderLeft: `4px solid ${
                    project.status === 'COMPLETED' ? C.success :
                    project.status === 'ACTIVE' ? C.accent :
                    project.status === 'CANCELLED' ? C.error :
                    '#D97706'
                  }`,
                  background: 'linear-gradient(135deg, #ffffff, #fcfcfc)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h3 style={{ margin: "0 0 4px", fontSize: 15, color: C.dark, fontWeight: 700 }}>
                        Status do Projeto
                      </h3>
                      <p style={{ margin: 0, fontSize: 13, color: C.gray }}>
                        {project.status === 'PENDING' && "Aguardando aceitação do profissional para iniciar."}
                        {project.status === 'ACTIVE' && "O projeto está em andamento."}
                        {project.status === 'COMPLETED' && "Projeto concluído com sucesso!"}
                        {project.status === 'CANCELLED' && "O projeto foi cancelado."}
                      </p>
                    </div>
                    <span style={{
                      background: 
                        project.status === 'COMPLETED' ? '#D1FAE5' :
                        project.status === 'ACTIVE' ? '#EFF6FF' :
                        project.status === 'CANCELLED' ? '#FEE2E2' :
                        '#FEF3C7',
                      color:
                        project.status === 'COMPLETED' ? '#059669' :
                        project.status === 'ACTIVE' ? '#1D4ED8' :
                        project.status === 'CANCELLED' ? C.error :
                        '#D97706',
                      padding: "6px 14px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700
                    }}>
                      {project.status === 'PENDING' && "PENDENTE"}
                      {project.status === 'ACTIVE' && "EM ANDAMENTO"}
                      {project.status === 'COMPLETED' && "CONCLUÍDO"}
                      {project.status === 'CANCELLED' && "CANCELADO"}
                    </span>
                  </div>

                  {/* Ações para o Profissional */}
                  {isPro && proposal?.status === "ACCEPTED" && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                      {project.status === 'PENDING' && (
                        <Btn onClick={async () => {
                          if (window.confirm("Deseja aceitar o projeto e iniciar o trabalho?")) {
                            setSubmitting(true);
                            try {
                              await projectsAPI.acceptDirect(project.id);
                              alert("Projeto aceite e em andamento!");
                              await loadProjectData();
                            } catch (err) {
                              alert(err.message);
                            } finally {
                              setSubmitting(false);
                            }
                          }
                        }} variant="success" full disabled={submitting}>
                          <Icon icon={faCheck} size={13} style={{ marginRight: 6 }} /> Aceitar Projeto e Iniciar Trabalho
                        </Btn>
                      )}
                      {project.status === 'ACTIVE' && (
                        <Btn onClick={async () => {
                          if (window.confirm("Tem certeza que deseja marcar este projeto como concluído?")) {
                            setSubmitting(true);
                            try {
                              await projectsAPI.update(project.id, { status: "COMPLETED" });
                              alert("Projeto marcado como concluído!");
                              await loadProjectData();
                            } catch (err) {
                              alert(err.message);
                            } finally {
                              setSubmitting(false);
                            }
                          }
                        }} variant="accent" full disabled={submitting}>
                          <Icon icon={faCheck} size={13} style={{ marginRight: 6 }} /> Marcar Projeto como Concluído
                        </Btn>
                      )}
                    </div>
                  )}
                </Card>
              )}
              {/* ── 1. DETALHES DO PEDIDO (visível para ambos, destaque para profissional) ── */}
              {isPro && (
                <div style={{ background: `linear-gradient(135deg, #1a1a2e08, #1a1a2e03)`, border: `2px solid #1a1a2e20`, borderRadius: 14, padding: "16px", marginBottom: 4 }}>
                  <h3 style={{ margin: "0 0 12px", color: C.dark, display: "flex", alignItems: "center", gap: 8, fontSize: 15 }}>
                    <Icon icon={faClipboardList} color={C.accent} size={18} /> Pedido do Cliente
                  </h3>
                  <div style={{ fontWeight: 800, fontSize: 16, color: C.dark, marginBottom: 6 }}>{projectTitle || "Sem título"}</div>
                  {projectDescription && (
                    <p style={{ fontSize: 13, color: C.gray, margin: "0 0 12px", lineHeight: 1.6, background: C.lightGray, padding: "10px 12px", borderRadius: 8 }}>
                      {projectDescription}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    {projectBudget && (
                      <div style={{ background: `${C.success}15`, borderRadius: 10, padding: "8px 14px" }}>
                        <div style={{ fontSize: 10, color: C.gray, fontWeight: 700, marginBottom: 2 }}>ORÇAMENTO ESPERADO</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: C.success }}>{projectBudget.toLocaleString("pt")} CVE</div>
                      </div>
                    )}
                    {projectDeadline && (
                      <div style={{ background: `${C.accent}15`, borderRadius: 10, padding: "8px 14px" }}>
                        <div style={{ fontSize: 10, color: C.gray, fontWeight: 700, marginBottom: 2 }}>PRAZO PRETENDIDO</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>{new Date(projectDeadline).toLocaleDateString("pt")}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── 2. ORÇAMENTO/PROPOSTA ── */}
              <Card style={{ borderLeft: `4px solid ${C.primary}` }}>
                <h3 style={{ margin: "0 0 12px", color: C.dark, display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon icon={faClipboardList} color={C.primary} size={18} /> Orçamento & Proposta
                </h3>
                
                {!proposal ? (
                  isPro ? (
                    <div>
                      {projectBudget && (
                        <div style={{ marginBottom: 16, padding: 12, background: `${C.success}10`, border: `1px dashed ${C.success}`, borderRadius: 10 }}>
                          <p style={{ fontSize: 13, margin: "0 0 8px", color: C.dark }}>
                            O cliente definiu um orçamento de <b>{projectBudget.toLocaleString("pt")} CVE</b>.
                          </p>
                          <Btn onClick={async () => {
                            if (window.confirm("Deseja aceitar o trabalho com o orçamento do cliente?")) {
                              setSubmitting(true);
                              try {
                                await projectsAPI.acceptDirect(conversation.id);
                                alert("Trabalho aceite com sucesso!");
                                await loadProjectData();
                              } catch(e) {
                                alert(e.message);
                              } finally {
                                setSubmitting(false);
                              }
                            }
                          }} variant="success" small full disabled={submitting}>
                            Aceitar Orçamento do Cliente
                          </Btn>
                        </div>
                      )}
                      <p style={{ fontSize: 13, color: C.gray, marginBottom: 12 }}>Ou envie a sua proposta de orçamento personalizada:</p>
                      <Input label="Valor Proposto ($00)" value={proposedAmount} onChange={e => setProposedAmount(e.target.value)} type="number" placeholder="Ex: 500" />
                      <Input label="Prazo Proposto (Data)" value={proposedDeadline} onChange={e => setProposedDeadline(e.target.value)} type="date" />
                      <Input label="Comentários/Escopo" value={coverLetter} onChange={e => setCoverLetter(e.target.value)} placeholder="Descreva os serviços incluídos..." />
                      <Btn onClick={submitProposal} variant="success" full disabled={submitting || !proposedAmount}>
                        Enviar Proposta
                      </Btn>
                    </div>
                  ) : (
                    <div style={{ padding: 12, textAlign: "center", color: C.gray, fontSize: 13 }}>
                      Aguardando proposta do profissional...
                    </div>
                  )
                ) : (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>Proposta Atual</span>
                      <span style={{ background: proposal.status === "ACCEPTED" ? "#D1FAE5" : proposal.status === "PENDING" ? "#FEF3C7" : proposal.status === "COUNTERED" ? "#EFF6FF" : "#FEE2E2", color: proposal.status === "ACCEPTED" ? "#059669" : proposal.status === "PENDING" ? "#D97706" : proposal.status === "COUNTERED" ? "#1D4ED8" : C.error, padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                        {proposal.status === "ACCEPTED" ? "ACEITE" : proposal.status === "PENDING" ? "PENDENTE" : proposal.status === "COUNTERED" ? "CONTRAPROPOSTA" : "REJEITADA"}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.dark, marginBottom: 4 }}>
                      Valor: <span style={{ color: C.accent, fontWeight: 800 }}>{proposal.proposedAmount} $00</span>
                    </div>
                    {proposal.proposedDeadline && (
                      <div style={{ fontSize: 13, color: C.gray, marginBottom: 8 }}>
                        Prazo: {new Date(proposal.proposedDeadline).toLocaleDateString()}
                      </div>
                    )}
                    {proposal.coverLetter && (
                      <p style={{ background: C.lightGray, padding: 10, borderRadius: 8, fontSize: 13, color: C.dark, margin: "6px 0 12px" }}>
                        "{proposal.coverLetter}"
                      </p>
                    )}

                    {/* PENDING: client decides; COUNTERED: the other party can respond */}
                    {(proposal.status === "PENDING" || proposal.status === "COUNTERED") && (
                      <>
                        {!isPro && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                            <div style={{ display: "flex", gap: 8 }}>
                              <Btn onClick={acceptProposal} variant="success" full disabled={submitting}>Aceitar Proposta</Btn>
                              <Btn onClick={rejectProposal} variant="danger" full disabled={submitting}>Recusar</Btn>
                            </div>
                            {!showCounterForm ? (
                              <Btn onClick={() => setShowCounterForm(true)} variant="ghost" full>Enviar Contraproposta</Btn>
                            ) : (
                              <div style={{ borderTop: `1.5px solid ${C.border}`, paddingTop: 10, marginTop: 4 }}>
                                <p style={{ fontSize: 12, color: C.gray, margin: "0 0 8px" }}>Sugira um novo valor:</p>
                                <Input label="Novo Valor de Contraproposta ($00)" value={counterAmount} onChange={e => setCounterAmount(e.target.value)} type="number" />
                                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                  <Btn onClick={submitCounter} variant="accent" full disabled={submitting || !counterAmount}>Confirmar Contraproposta</Btn>
                                  <Btn onClick={() => setShowCounterForm(false)} variant="ghost" full>Cancelar</Btn>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {isPro && proposal.status === "PENDING" && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                            <p style={{ fontSize: 12, color: C.gray, textAlign: "center", margin: 0 }}>Aguardando resposta do cliente...</p>
                            <Btn onClick={rejectProposal} variant="danger" full disabled={submitting}>Retirar Proposta</Btn>
                          </div>
                        )}
                        {isPro && proposal.status === "COUNTERED" && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                            <p style={{ fontSize: 12, color: "#1D4ED8", marginBottom: 4, fontWeight: 600 }}>O cliente enviou uma contraproposta. Aceite, recuse ou negocie:</p>
                            <div style={{ display: "flex", gap: 8 }}>
                              <Btn onClick={acceptProposal} variant="success" full disabled={submitting}>Aceitar</Btn>
                              <Btn onClick={rejectProposal} variant="danger" full disabled={submitting}>Recusar</Btn>
                            </div>
                            {!showCounterForm ? (
                              <Btn onClick={() => setShowCounterForm(true)} variant="ghost" full>Enviar Contraproposta</Btn>
                            ) : (
                              <div style={{ borderTop: `1.5px solid ${C.border}`, paddingTop: 10, marginTop: 4 }}>
                                <Input label="Novo Valor de Contraproposta ($00)" value={counterAmount} onChange={e => setCounterAmount(e.target.value)} type="number" />
                                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                  <Btn onClick={submitCounter} variant="accent" full disabled={submitting || !counterAmount}>Confirmar Contraproposta</Btn>
                                  <Btn onClick={() => setShowCounterForm(false)} variant="ghost" full>Cancelar</Btn>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}


                    {/* If accepted, show confirmation banner */}
                    {proposal.status === "ACCEPTED" && (
                      <div style={{ marginTop: 10, background: "#D1FAE5", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#065F46", fontWeight: 600 }}>
                        ✓ Proposta aceite — Contrato gerado automaticamente. Avance para assinar.
                      </div>
                    )}

                    {/* If rejected and professional, allow new proposal */}
                    {proposal.status === "REJECTED" && isPro && (
                      <div style={{ marginTop: 12 }}>
                        <p style={{ fontSize: 12, color: C.error, marginBottom: 8 }}>A sua proposta foi recusada. Pode enviar uma nova proposta.</p>
                        <Input label="Novo Valor ($00)" value={proposedAmount} onChange={e => setProposedAmount(e.target.value)} type="number" placeholder="Ex: 450" />
                        <Input label="Prazo Proposto" value={proposedDeadline} onChange={e => setProposedDeadline(e.target.value)} type="date" />
                        <Input label="Comentários" value={coverLetter} onChange={e => setCoverLetter(e.target.value)} />
                        <Btn onClick={submitProposal} variant="success" full disabled={submitting || !proposedAmount}>Enviar Nova Proposta</Btn>
                      </div>
                    )}
                  </div>
                )}
              </Card>

              {/* ── 2. CONTRATO DIGITAL ── */}
              {contract && (
                <Card style={{ borderLeft: `4px solid ${C.success}` }}>
                  <h3 style={{ margin: "0 0 12px", color: C.dark, display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon icon={faShieldAlt} color={C.success} size={18} /> Contrato Digital
                  </h3>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>Status do Contrato</span>
                    <span style={{ background: contract.status === "ACTIVE" ? "#D1FAE5" : "#FEF3C7", color: contract.status === "ACTIVE" ? "#059669" : "#D97706", padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                      {contract.status === "ACTIVE" ? "ASSINADO & ATIVO" : "RASCUNHO"}
                    </span>
                  </div>

                  <a href={contractsAPI.getPdfUrl(contract.id)} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", background: C.lightGray, borderRadius: 8, color: C.dark, textDecoration: "none", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                    <Icon icon={faClipboardList} size={14} /> Descarregar PDF do Contrato
                  </a>

                  <div style={{ fontSize: 13, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span>Cliente:</span>
                      <span style={{ fontWeight: 600, color: contract.terms?.clientSignedAt ? C.success : C.error }}>
                        {contract.terms?.clientSignedAt ? "✓ Assinado" : "Pendente"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <span>Profissional:</span>
                      <span style={{ fontWeight: 600, color: contract.terms?.professionalSignedAt ? C.success : C.error }}>
                        {contract.terms?.professionalSignedAt ? "✓ Assinado" : "Pendente"}
                      </span>
                    </div>

                    {/* Button to Sign */}
                    {((!isPro && !contract.terms?.clientSignedAt) || (isPro && !contract.terms?.professionalSignedAt)) && (
                      <Btn onClick={signContract} variant="accent" full disabled={submitting}>
                        Assinar Digitalmente o Contrato
                      </Btn>
                    )}
                  </div>
                </Card>
              )}

              {/* ── 3. MARCOS DO PROJETO ── */}
              {contract && (
                <Card style={{ borderLeft: `4px solid ${C.accent}` }}>
                  <h3 style={{ margin: "0 0 12px", color: C.dark, display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon icon={faClock} color={C.accent} size={18} /> Marcos e Fases (Milestones)
                  </h3>
                  
                  {isPro && (
                    <div style={{ background: C.lightGray, padding: 12, borderRadius: 8, marginBottom: 14 }}>
                      <h4 style={{ margin: "0 0 10px", fontSize: 13 }}>Adicionar Novo Marco</h4>
                      <Input label="Título do Marco" value={milestoneTitle} onChange={e => setMilestoneTitle(e.target.value)} placeholder="Ex: Fundações concluídas" />
                      <Input label="Valor do Marco ($00)" value={milestoneAmount} onChange={e => setMilestoneAmount(e.target.value)} type="number" />
                      <Input label="Prazo Previsto" value={milestoneDueDate} onChange={e => setMilestoneDueDate(e.target.value)} type="date" />
                      <Btn onClick={addMilestone} variant="accent" small full disabled={submitting || !milestoneTitle || !milestoneAmount}>
                        Criar Marco
                      </Btn>
                    </div>
                  )}

                  {milestones.length === 0 ? (
                    <p style={{ textAlign: "center", fontSize: 13, color: C.gray, margin: "10px 0" }}>Nenhum marco definido ainda.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {milestones.map((m) => (
                        <div key={m.id} style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <span style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>{m.title}</span>
                            <span style={{ background: m.status === "PAID" ? "#D1FAE5" : m.status === "RELEASED" ? "#FEF3C7" : C.lightGray, color: m.status === "PAID" ? "#059669" : m.status === "RELEASED" ? "#D97706" : C.gray, padding: "2px 8px", borderRadius: 8, fontSize: 10, fontWeight: 700 }}>
                              {m.status}
                            </span>
                          </div>
                          <div style={{ fontSize: 13, color: C.gray, display: "flex", justifyContent: "space-between" }}>
                            <span>Valor: <b>{m.amount} $00</b></span>
                            {m.dueDate && <span>Até: {new Date(m.dueDate).toLocaleDateString()}</span>}
                          </div>
                          
                          {/* Actions */}
                          {m.status === "PENDING" && isPro && contract.status === "ACTIVE" && (
                            <Btn onClick={() => completeMilestone(m.id)} variant="accent" small full style={{ marginTop: 8 }}>
                              Marcar Marco como Concluído
                            </Btn>
                          )}
                          {m.status === "RELEASED" && !isPro && (
                            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                              <Btn onClick={() => releaseMilestone(m.id)} variant="success" small full>Aprovar & Libertar Pagamento</Btn>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {/* ── 4. PAGAMENTOS E COMPROVATIVOS ── */}
              {contract && (
                <Card style={{ borderLeft: "4px solid var(--color-purple)" }}>
                  <h3 style={{ margin: "0 0 12px", color: C.dark, display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon icon={faMoneyBillWave} color={C.purple} size={18} /> Comprovativos de Pagamento
                  </h3>

                  {/* Submit payment form */}
                  {!isPro && (
                    <div style={{ background: C.lightGray, padding: 12, borderRadius: 8, marginBottom: 14 }}>
                      <h4 style={{ margin: "0 0 10px", fontSize: 13 }}>Submeter Comprovativo de Pagamento</h4>
                      <Input label="Valor do Pagamento ($00)" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} type="number" />
                      
                      {milestones.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.dark, marginBottom: 4 }}>Marco Associado (Opcional)</label>
                          <select value={paymentMilestoneId} onChange={e => setPaymentMilestoneId(e.target.value)} style={{ width: "100%", padding: "10px 14px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", background: C.white }}>
                            <option value="">Nenhum marco (Pagamento Geral)</option>
                            {milestones.filter(m => m.status !== "PAID").map(m => (
                              <option key={m.id} value={m.id}>{m.title} ({m.amount} $00)</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div style={{ marginBottom: 12 }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.dark, marginBottom: 4 }}>Ficheiro de Comprovativo (Imagem)</label>
                        <input type="file" accept="image/*" onChange={handleFileChange} style={{ fontSize: 13 }} />
                        {paymentProof && (
                          <div style={{ marginTop: 8 }}>
                            <img src={paymentProof} style={{ maxWidth: 100, maxHeight: 100, borderRadius: 6, border: `1px solid ${C.border}` }} alt="Preview" />
                          </div>
                        )}
                      </div>

                      <Btn onClick={submitPayment} variant="accent" small full disabled={submitting || !paymentAmount || !paymentProof}>
                        Enviar Comprovativo para Validação
                      </Btn>
                    </div>
                  )}

                  {/* Payments list */}
                  {payments.length === 0 ? (
                    <p style={{ textAlign: "center", fontSize: 13, color: C.gray, margin: "10px 0" }}>Nenhum comprovativo enviado ainda.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {payments.map((p) => (
                        <div key={p.id} style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <span style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>{p.amount} $00</span>
                            <span style={{ background: p.status === "COMPLETED" ? "#D1FAE5" : p.status === "PENDING" ? "#FEF3C7" : "#FEE2E2", color: p.status === "COMPLETED" ? "#059669" : p.status === "PENDING" ? "#D97706" : C.error, padding: "2px 8px", borderRadius: 8, fontSize: 10, fontWeight: 700 }}>
                              {p.status === "COMPLETED" ? "CONFIRMADO" : p.status === "PENDING" ? "PENDENTE" : "REJEITADO"}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: C.gray, marginBottom: 8 }}>
                            Submetido em: {new Date(p.createdAt).toLocaleString()}
                          </div>

                          <Btn onClick={() => setViewingProofId(viewingProofId === p.id ? null : p.id)} variant="ghost" small full>
                            {viewingProofId === p.id ? "Esconder Comprovativo" : "Ver Comprovativo"}
                          </Btn>

                          {viewingProofId === p.id && p.proof && (
                            <div style={{ marginTop: 10, border: `1px solid ${C.border}`, borderRadius: 8, padding: 6, background: C.lightGray }}>
                              <img src={p.proof} alt="Comprovativo" style={{ width: "100%", borderRadius: 6 }} />
                            </div>
                          )}

                          {p.status === "PENDING" && isPro && (
                            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                              <Btn onClick={() => approvePayment(p.id)} variant="success" small full>Confirmar Validez</Btn>
                              <Btn onClick={() => rejectPayment(p.id)} variant="danger" small full>Rejeitar Comprovativo</Btn>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {/* ── 5. DISPUTAS / CONTESTAÇÕES ── */}
              {contract && (
                <Card style={{ borderLeft: `4px solid ${C.error}` }}>
                  <h3 style={{ margin: "0 0 12px", color: C.dark, display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon icon={faExclamationCircle} color={C.error} size={18} /> Abrir Disputa
                  </h3>

                  {disputes.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
                      {disputes.map((d) => (
                        <div key={d.id} style={{ background: "#FEF2F2", border: `1.5px solid ${C.error}30`, borderRadius: 10, padding: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <span style={{ fontWeight: 700, fontSize: 13, color: C.error }}>Disputa #{d.id.substring(0, 8)}</span>
                            <span style={{ background: d.status === "OPEN" ? "#FEE2E2" : "#D1FAE5", color: d.status === "OPEN" ? C.error : "#059669", padding: "2px 8px", borderRadius: 8, fontSize: 10, fontWeight: 700 }}>
                              {d.status === "OPEN" ? "ABERTA" : "RESOLVIDA"}
                            </span>
                          </div>
                          <p style={{ fontSize: 13, margin: "4px 0", color: C.dark }}>"{d.description}"</p>
                          {d.resolution && (
                            <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}`, fontSize: 13 }}>
                              <b>Resolução Admin:</b> {d.resolution}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {contract.status === "ACTIVE" && (
                    <div>
                      <Input label="Descreva o motivo da contestação" value={disputeDesc} onChange={e => setDisputeDesc(e.target.value)} placeholder="Explique os problemas com o serviço ou pagamento..." />
                      <Btn onClick={submitDispute} variant="danger" full disabled={submitting || !disputeDesc}>
                        Abrir Contestação Oficial
                      </Btn>
                    </div>
                  )}
                </Card>
              )}

              {/* ── 6. AVALIAÇÃO DO PROJETO ── */}
              {proposal?.project?.status === "COMPLETED" && (
                <Card style={{ borderLeft: `4px solid ${C.purple}` }}>
                  <h3 style={{ margin: "0 0 12px", color: C.dark, display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon icon={faStar} color={C.purple} size={18} /> Avaliação Mútua
                  </h3>
                  
                  {reviewed ? (
                    <p style={{ textAlign: "center", fontSize: 13, color: C.gray, margin: "10px 0" }}>Você já avaliou este projeto.</p>
                  ) : (
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.dark, marginBottom: 4 }}>
                        Classificação (1-5)
                      </label>
                      <input type="number" min="1" max="5" value={ratingVal} onChange={e => setRatingVal(parseInt(e.target.value))} style={{ width: "100%", padding: "10px 14px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, marginBottom: 12 }} />
                      
                      <Input label="Comentário" value={commentVal} onChange={e => setCommentVal(e.target.value)} placeholder="Compartilhe a sua experiência com a outra parte..." />
                      
                      <Btn onClick={submitReview} variant="accent" full disabled={submitting || !commentVal}>
                        Submeter Avaliação
                      </Btn>
                    </div>
                  )}
                </Card>
              )}

            </div>
          )}
        </div>
      )}
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
      <div style={{
        backgroundImage: data.coverPhoto ? `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(${data.coverPhoto})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: data.coverPhoto ? "transparent" : C.primary,
        padding: "20px 16px 60px",
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28
      }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans', sans-serif", marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>
          <Icon icon={faArrowLeft} size={13} color="#fff" /> Voltar
        </button>
        <div style={{ textAlign: "center" }}>
          <Avatar name={name} size={80} src={data.user?.avatar} />
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
          <button onClick={onMessage} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", background: "transparent", color: C.primary, border: `2px solid ${C.primary}`, borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
            <Icon icon={faComments} size={16} color={C.primary} /> Mensagem
          </button>
          <button onClick={onSchedule} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", background: C.accent, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
            <Icon icon={faCalendarAlt} size={16} color="#fff" /> Agendar
          </button>
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
                {(data.address || data.city) && (
                  <Card style={{ marginTop: 14 }}>
                    <h4 style={{ margin: "0 0 12px", color: C.dark, display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon icon={faMapMarkerAlt} size={14} color={C.primary} /> Localização
                    </h4>
                    {data.address && <p style={{ color: C.gray, fontSize: 13, margin: "0 0 4px" }}>{data.address}</p>}
                    {data.city && <p style={{ color: C.gray, fontSize: 13, margin: "0 0 4px" }}>{data.city}{data.island ? `, ${data.island}` : ""}</p>}
                    {data.postalCode && <p style={{ color: C.gray, fontSize: 13, margin: "0 0 12px" }}>CP: {data.postalCode}</p>}
                    {data.latitude && data.longitude && (
                      <LeafletMap lat={data.latitude} lng={data.longitude} radius={data.radius || 10} />
                    )}
                  </Card>
                )}
              </div>
            )}
            {tab === "portfolio" && (
              (data.portfolio || []).length === 0
                ? <p style={{ textAlign: "center", color: C.gray, padding: 32 }}>Sem portfólio.</p>
                : (data.portfolio || []).map((item, i) => {
                  const imgs = parseImages(item.imageUrls);
                  return (
                  <Card key={i} style={{ marginBottom: 12 }}>
                    {imgs[0]
                      ? <img src={imgs[0]} alt={item.title}
                          style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 10, marginBottom: 10, display: "block" }} />
                      : <div style={{ height: 120, background: C.primary, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                          <Icon icon={faBuilding} size={40} color={`${C.primary}60`} />
                        </div>
                    }
                    <div style={{ fontWeight: 600, color: C.dark }}>{item.title}</div>
                    {item.description && <div style={{ color: C.gray, fontSize: 13, marginTop: 4 }}>{item.description}</div>}
                  </Card>
                  );
                })
            )}
            {tab === "reviews" && (
              (data.reviews || []).length === 0
                ? <p style={{ textAlign: "center", color: C.gray, padding: 32 }}>Sem avaliações ainda.</p>
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

// ============================================================
// AGENDAMENTO
// ============================================================
// O cliente só pode escolher entre os horários que o PRÓPRIO profissional
// definiu como disponíveis (ver ProfAgenda). Nunca é possível inventar
// uma data/hora arbitrária — isto é validado outra vez no servidor.
const ScheduleScreen = ({ professional, onBack, onConfirm }) => {
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    schedulesAPI.list(professional.id)
      .then(d => setSlots(d.data || []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [professional.id]);

  // Agrupa os horários disponíveis por dia
  const byDate = slots.reduce((acc, s) => {
    const dateStr = s.date.split("T")[0];
    const key = new Date(dateStr + "T12:00:00").toDateString();
    (acc[key] = acc[key] || []).push(s);
    return acc;
  }, {});
  const availableDates = Object.keys(byDate).map(k => new Date(k)).sort((a, b) => a - b);
  const timesForDay = selectedDateKey ? (byDate[selectedDateKey] || []).sort((a, b) => a.startTime.localeCompare(b.startTime)) : [];

  const confirm = async () => {
    if (!selectedSlot) return;
    setError("");
    setBooking(true);
    try {
      await schedulesAPI.book(selectedSlot.id);
      onConfirm();
    } catch (err) {
      // Ex.: 409 se outro cliente reservou entretanto — refrescar lista
      setError(err.message || "Não foi possível reservar este horário.");
      schedulesAPI.list(professional.id).then(d => setSlots(d.data || [])).catch(() => {});
      setSelectedSlot(null);
    } finally { setBooking(false); }
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: C.primary, padding: "20px 16px 24px", borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#fff", fontSize: 16, cursor: "pointer", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <Icon icon={faArrowLeft} size={14} color="#fff" />
        </button>
        <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 800, margin: 0 }}>Agendar Serviço</h2>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 4 }}>{professional?.user?.name} • {professional?.specialty}</p>
      </div>
      <div style={{ padding: "20px 16px", maxWidth: 560, margin: "0 auto" }}>
        <ErrMsg msg={error} />
        {loadingSlots ? <Spinner /> : availableDates.length === 0 ? (
          <Card style={{ textAlign: "center", padding: 32 }}>
            <Icon icon={faCalendarAlt} size={40} color={C.border} />
            <p style={{ color: C.gray, marginTop: 12 }}>Este profissional ainda não definiu disponibilidade.</p>
            <p style={{ color: C.gray, fontSize: 13 }}>Tente enviar uma mensagem para combinar directamente.</p>
          </Card>
        ) : (
          <>
            <Card style={{ marginBottom: 16 }}>
              <h4 style={{ margin: "0 0 14px", color: C.dark, display: "flex", alignItems: "center", gap: 6 }}>
                <Icon icon={faCalendarAlt} size={14} color={C.primary} /> Datas disponíveis
              </h4>
              <div className="schedule-dates-grid">
                {availableDates.map((d, i) => {
                  const key = d.toDateString();
                  const isSel = selectedDateKey === key;
                  return (
                    <div key={i} onClick={() => { setSelectedDateKey(key); setSelectedSlot(null); }}
                      style={{ textAlign: "center", padding: "10px 6px", borderRadius: 12, cursor: "pointer", background: isSel ? C.primary : C.lightGray, color: isSel ? "#fff" : C.dark, transition: "all 0.2s" }}>
                      <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", opacity: 0.8 }}>{d.toLocaleDateString("pt", { weekday: "short" })}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{d.getDate()}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
            {selectedDateKey && (
              <Card style={{ marginBottom: 16 }}>
                <h4 style={{ margin: "0 0 14px", color: C.dark, display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon icon={faClock} size={14} color={C.primary} /> Horários disponíveis
                </h4>
                {timesForDay.length === 0 ? (
                  <p style={{ color: C.gray, fontSize: 13 }}>Sem horários livres neste dia.</p>
                ) : (
                  <div className="schedule-times-grid">
                    {timesForDay.map(s => (
                      <button key={s.id} onClick={() => setSelectedSlot(s)}
                        style={{ padding: "10px 4px", border: `1.5px solid ${selectedSlot?.id === s.id ? C.primary : C.border}`, borderRadius: 10, cursor: "pointer", background: selectedSlot?.id === s.id ? `${C.primary}10` : C.white, color: selectedSlot?.id === s.id ? C.primary : C.dark, fontWeight: 600, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
                        {s.startTime}
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            )}
            <Btn onClick={confirm} full variant="accent" disabled={!selectedSlot || booking}>
              <Icon icon={faCheck} size={14} color="#fff" />
              {booking ? "A reservar..." : selectedSlot ? `Confirmar: ${new Date(selectedSlot.date).getDate()} às ${selectedSlot.startTime}` : "Seleccione data e hora"}
            </Btn>
          </>
        )}
      </div>
      <style>{`
        .schedule-dates-grid, .schedule-times-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
          gap: 8px;
        }
        @media (min-width: 768px) {
          .schedule-dates-grid, .schedule-times-grid { grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 10px; }
        }
      `}</style>
    </div>
  );
};

const ResponsiveShell = () => (
  <style>{`
    .app-container { width: 100%; min-height: 100vh; background: ${C.lightGray}; }
    @media (min-width: 768px) {
      .app-container {  box-shadow: 0 0 40px rgba(0,0,0,0.06); min-height: 100vh; }
      .categories-grid { grid-template-columns: repeat(4, 1fr) !important; }
    }
    @media (min-width: 1024px) {
      .app-container {  }
    }
    @media (min-width: 1280px) {
      .app-container { }
    }
    .categories-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 24px; }
    .category-card { position: relative; border-radius: 14px; overflow: hidden; aspect-ratio: 1; cursor: pointer; }
    .category-card img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .category-card .overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.55), transparent 60%); }
    .category-card .label { position: absolute; bottom: 8px; left: 8px; right: 8px; color: #fff; font-weight: 700; font-size: 12px; }
    .bottom-nav { position: fixed; bottom: 0; left: 50%; right: 0; display: flex; background: ${C.white}; border-top: 1px solid ${C.border}; padding: 8px 4px; z-index: 100; }
    @media (min-width: 768px) {
      .bottom-nav { left: 50%; transform: translateX(-50%); max-width: 100%; }
    }
    @media (min-width: 1024px) {
      .bottom-nav { max-width: 100%;}
    }
    @media (min-width: 1280px) {
      .bottom-nav { }
    }
  `}</style>
);

// ============================================================
// APP PRINCIPAL
// ============================================================
export default function BuildMatchApp() {
  const [screen, setScreen] = useState("onboarding");
  const [user, setUser] = useState(null);
  const [clientTab, setClientTab] = useState("home");
  const [profTab, setProfTab] = useState("dashboard");
  const [adminTab, setAdminTab] = useState("overview");
  const [selectedProf, setSelectedProf] = useState(null);
  const [searchQ, setSearchQ] = useState("");
  const [openChat, setOpenChat] = useState(null);
  const [scheduleFor, setScheduleFor] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [initialProfileSection, setInitialProfileSection] = useState(null);
  const [categories, setCategories] = useState([]);
  const [specialties, setSpecialties] = useState([]);

useEffect(() => {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap";
  document.head.appendChild(link);
  const token = localStorage.getItem("buildmatch_token");
  const saved = localStorage.getItem("buildmatch_user");
  if (token && saved) {
    const savedUser = JSON.parse(saved);
    setUser(savedUser);
    setScreen("app");

    if (localStorage.getItem("buildmatch_open_profile") === "1") {
      localStorage.removeItem("buildmatch_open_profile");
      if (savedUser.type === "PROFESSIONAL") setProfTab("profile");
      else if (savedUser.type === "ADMIN") setAdminTab("profile");
      else setClientTab("profile");
    }
  }

  import("./services/api").then(({ professionalsAPI }) => {
    professionalsAPI.getMeta()
      .then(res => {
        if (res.categories) setCategories(res.categories);
        if (res.specialties) setSpecialties(res.specialties);
      })
      .catch(err => console.error("Erro ao obter especialidades/categorias do backend:", err));
  });
}, []);



  const login = (u) => { setUser(u); setScreen("app"); };
  const logout = () => { localStorage.clear(); setUser(null); setScreen("login"); };
  const success = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 3001); };
  const isPro = user?.type === "PROFESSIONAL";
  const isAdmin = user?.type === "ADMIN";

  // Abre uma conversa dentro do separador "Mensagens" (split-view), em vez de tomar o ecrã todo
  const goToChat = (conv, initialTab = "messages") => {
    setOpenChat({ ...conv, initialTab });
    if (isPro) setProfTab("messages"); else setClientTab("messages");
  };

  const handleNotificationAction = async (notif, action) => {
    try {
      const { projectsAPI } = await import("./services/api");
      if (action === 'chat' && notif.projectId) {
        const project = await projectsAPI.get(notif.projectId);
        goToChat({
          id: project.id,
          title: project.title,
          professional: project.professional,
          client: project.client
        });
      } else if (action === 'accept' && notif.projectId) {
        await projectsAPI.update(notif.projectId, { status: 'ACTIVE' });
        success("Serviço aceite! O projecto está agora activo.");
        const project = await projectsAPI.get(notif.projectId);
        goToChat({
          id: project.id,
          title: project.title,
          professional: project.professional,
          client: project.client
        });
      }
    } catch (err) {
      alert("Erro ao processar acção da notificação: " + err.message);
    }
  };

if (window.location.pathname.endsWith("/verify-email")) {
  return <VerifyEmailScreen />;
}

if (window.location.pathname.endsWith("/reset-password")) {
  return <ResetPasswordScreen />;
}

  if (screen === "onboarding") return <Onboarding onFinish={() => setScreen("login")} />;
  if (screen === "login") return <Login onLogin={login} />;

const pendingVerification = localStorage.getItem("buildmatch_pending_verification") === "1";

if (pendingVerification && user && !user.emailVerified) {
  return (
    <EmailNotVerifiedScreen
      user={user}
      onLogout={logout}
      onVerified={(verifiedUser) => {
        localStorage.removeItem("buildmatch_pending_verification");
        setUser(verifiedUser);
        setScreen("app");
        if (verifiedUser.type === "PROFESSIONAL") {
          setProfTab("profile");
        } else if (verifiedUser.type === "CLIENT") {
          setClientTab("profile");
        } else if (verifiedUser.type === "ADMIN") {
          setAdminTab("profile");
        }
        setInitialProfileSection("edit");
      }}
    />
  );
}

// GATILHO DA VERIFICAÇÃO PROFISSIONAL
const isProfessional = user && user.type === "PROFESSIONAL";
const isPendingProVerification = isProfessional && (!user.professional || !user.professional.verified);

if (isPendingProVerification) {
  return (
    <ProfessionalVerificationScreen
      user={user}
      onLogout={logout}
      onVerified={(verifiedUser) => {
        setUser(verifiedUser);
        setScreen("app");
        setProfTab("dashboard");
      }}
    />
  );
}


  if (scheduleFor) return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: C.lightGray }}>
      <ScheduleScreen professional={scheduleFor} onBack={() => setScheduleFor(null)}
        onConfirm={() => { setScheduleFor(null); success("Agendamento realizado! O profissional será notificado."); }} />
    </div>
  );

  if (selectedProf) return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: C.lightGray }}>
      <div style={{ overflowY: "auto" }}>
        <ProfessionalProfile prof={selectedProf} onBack={() => setSelectedProf(null)}
          onMessage={async () => {
            try {
              const project = await projectsAPI.create({ title: `Contacto — ${selectedProf.specialty}`, professionalId: selectedProf.id, description: "Conversa iniciada pelo cliente" });
              setSelectedProf(null);
              goToChat({ id: project.id, title: `Contacto — ${selectedProf.specialty}`, professional: selectedProf });
            } catch (err) {
              const data = await messagesAPI.conversations().catch(() => ({ data: [] }));
              const existing = (data.data || []).find(c => c.professional?.id === selectedProf.id || c.professionalId === selectedProf.id);
              if (existing) { setSelectedProf(null); goToChat(existing); }
              else alert("Erro ao iniciar conversa: " + err.message);
            }
          }}
          onSchedule={() => { const p = selectedProf; setSelectedProf(null); setScheduleFor(p); }}
        />
      </div>
      {successMsg && <SuccessModal message={successMsg} onClose={() => setSuccessMsg(null)} />}
    </div>
  );

  if (isAdmin) {
    const renderAdmin = () => {
      if (adminTab === "profile") {
        return <AdminProfile user={user} onLogout={logout} onUpdate={(updated) => setUser(updated)} initialSection={initialProfileSection} onSectionChange={setInitialProfileSection} />;
      }
      return <AdminDashboard user={user} onLogout={logout} tab={adminTab} onChangeTab={setAdminTab} hideHeader={true} />;
    };
    return (
      <div className="admin-layout-container">
        <AdminNav active={adminTab} onChange={setAdminTab} />
        <div className="admin-main-content" style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh" }}>
          <AppHeader onLogout={logout} user={user} onNotificationAction={handleNotificationAction} />
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, padding: "20px 16px 40px" }}>
              {renderAdmin()}
            </div>
            <Footer />
          </div>
          {successMsg && <SuccessModal message={successMsg} onClose={() => setSuccessMsg(null)} />}
        </div>
      </div>
    );
  }

  if (isPro) {
    const renderPro = () => {
      switch (profTab) {
        case "dashboard": return <ProfDashboard user={user} />;
        case "projects": return <ProfProjects onOpenChat={goToChat} />;
        case "messages": return <MessagesLayout user={user} initialConv={openChat} onConsumeInitial={() => setOpenChat(null)} />;
        case "agenda": return <ProfAgenda user={user} />;
        case "portfolio": return <ProfPortfolio user={user} />;
        case "home": return <ClientHome user={user} onProfSelect={setSelectedProf} onOpenChat={goToChat} onSearch={q => { setSearchQ(q); setClientTab("search"); }} categories={categories} />;
        
        case "profile": return <ProfProfile user={user} onLogout={logout} onUpdate={(updated) => setUser(updated)} initialSection={initialProfileSection} onSectionChange={setInitialProfileSection} specialties={specialties} />;
        default: return null;
      }
    };
    return (
      <div className="app-container">
        <ResponsiveShell />
        <AppHeader onLogout={logout} user={user} onNotificationAction={handleNotificationAction} />
        <div style={{ paddingBottom: profTab === "messages" ? 0 : 80, overflowY: profTab === "messages" ? "hidden" : "auto" }}>
          {renderPro()}
          {profTab !== "messages" && <Footer />}
        </div>
        <ProfNav active={profTab} onChange={setProfTab} />
        {successMsg && <SuccessModal message={successMsg} onClose={() => setSuccessMsg(null)} />}
      </div>
    );
  }

  const renderClient = () => {
    switch (clientTab) {
      case "profile": return <ClientProfile user={user} onLogout={logout} onUpdate={(updated) => setUser(updated)} initialSection={initialProfileSection} onSectionChange={setInitialProfileSection} />;
      case "home": return <ClientHome user={user} onProfSelect={setSelectedProf} onSearch={q => { setSearchQ(q); setClientTab("search"); }} categories={categories} />;
      case "search": return <ClientSearch query={searchQ} onProfSelect={setSelectedProf} />;
      case "projects": return <ClientProjects />;
      case "messages": return <MessagesLayout user={user} initialConv={openChat} onConsumeInitial={() => setOpenChat(null)} />;
      default: return null;
    }
  };

  return (
    <div className="app-container">
      <ResponsiveShell />
      <AppHeader onLogout={logout} user={user} onNotificationAction={handleNotificationAction} />
      <div style={{ paddingBottom: clientTab === "messages" ? 0 : 80, overflowY: clientTab === "messages" ? "hidden" : "auto" }}>
        {renderClient()}
        {clientTab !== "messages" && <Footer />}
      </div>
      <ClientNav active={clientTab} onChange={tab => { setClientTab(tab); setSearchQ(""); }} />
      {successMsg && <SuccessModal message={successMsg} onClose={() => setSuccessMsg(null)} />}
    </div>
  );
}
const VerifyEmailScreen = () => {
  const [status, setStatus] = useState("loading"); // loading | error
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setStatus("error");
      setMsg("Link inválido.");
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/auth/verify-email?token=${token}`)
      .then(r => r.json().then(data => ({ ok: r.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          setStatus("error");
          setMsg(data.error || "Não foi possível confirmar o email.");
          return;
        }
        localStorage.setItem("buildmatch_token", data.token);
        localStorage.setItem("buildmatch_user", JSON.stringify(data.user));
        localStorage.setItem("buildmatch_open_profile", "1");
        localStorage.removeItem("buildmatch_pending_verification");
        window.location.href = import.meta.env.BASE_URL || "/";
      })
      .catch(() => {
        setStatus("error");
        setMsg("Erro ao confirmar email.");
      });
  }, []);

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.lightGray, fontFamily: "'DM Sans', sans-serif" }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.lightGray, padding: 20, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 32, textAlign: "center", maxWidth: 360 }}>
        <Icon icon={faTimes} size={48} color={C.error} />
        <p style={{ marginTop: 16, color: C.dark, fontWeight: 600 }}>{msg}</p>
        <button onClick={() => { window.location.href = import.meta.env.BASE_URL || "/"; }}
          style={{ marginTop: 16, background: C.primary, color: "#fff", border: "none", padding: "10px 24px", borderRadius: 10, cursor: "pointer", fontWeight: 700 }}>
          Ir para a aplicação
        </button>
      </div>
    </div>
  );
};

// ============================================================
// RESET PASSWORD SCREEN — acedido via link do email
// ============================================================
const ResetPasswordScreen = () => {
  const [status, setStatus] = useState("form"); // form | loading | success | error
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const token = new URLSearchParams(window.location.search).get("token");

  const handleReset = async () => {
    if (!newPassword || !confirm) { setError("Preencha ambos os campos"); return; }
    if (newPassword.length < 6) { setError("A password deve ter pelo menos 6 caracteres"); return; }
    if (newPassword !== confirm) { setError("As passwords não coincidem"); return; }
    if (!token) { setError("Link inválido"); return; }
    setStatus("loading"); setError("");
    try {
      await authAPI.resetPassword(token, newPassword);
      setStatus("success");
    } catch (err) {
      setError(err.message);
      setStatus("form");
    }
  };

  const goToApp = () => { window.location.href = import.meta.env.BASE_URL || "/"; };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.lightGray, padding: 20, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img src={logo} alt="BuildMatch" style={{ width: 160 }} />
        </div>
        <Card>
          {status === "success" ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
              <p style={{ fontWeight: 800, fontSize: 20, color: C.dark }}>Password redefinida!</p>
              <p style={{ color: C.gray, marginBottom: 24 }}>Pode fazer login com a sua nova password.</p>
              <Btn onClick={goToApp} full>Ir para o login</Btn>
            </div>
          ) : (
            <>
              <h2 style={{ fontWeight: 800, color: C.dark, marginBottom: 6 }}>Nova password</h2>
              <p style={{ color: C.gray, fontSize: 14, marginBottom: 20 }}>Escolha uma password segura com pelo menos 6 caracteres.</p>
              <ErrMsg msg={error} />
              <Input label="Nova password" value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" placeholder="••••••••" />
              <Input label="Confirmar password" value={confirm} onChange={e => setConfirm(e.target.value)} type="password" placeholder="••••••••" />
              <Btn onClick={handleReset} full disabled={status === "loading"}>
                {status === "loading" ? "A redefinir..." : "Redefinir password"}
              </Btn>
              <button onClick={goToApp} style={{ marginTop: 14, background: "none", border: "none", color: C.gray, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif", display: "block", textAlign: "center", width: "100%" }}>← Voltar ao login</button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

// ============================================================
// BOTTOM NAV ADMINISTRADOR
// ============================================================
const AdminNav = ({ active, onChange }) => (
  <div className="admin-sidebar">
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28, padding: "0 8px", justifyContent: "center" }}>
      <Icon icon={faShieldAlt} size={20} color={C.accent} style={{ flexShrink: 0 }} />
      <span className="admin-sidebar-logo-text" style={{ fontWeight: 800, fontSize: 16, color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>Admin BM</span>
    </div>
    {[
      ["overview", faTachometerAlt, "Painel"],
      ["users", faUsers, "Utilizadores"],
      ["projects", faClipboardList, "Projectos"],
      ["reviews", faStar, "Avaliações"],
      ["portfolios", faHardHat, "Portfólios"],
      ["comments", faComments, "Comentários"],
      ["lowRatings", faExclamationCircle, "Avaliação"],
      ["verifications", faShieldAlt, "Verificações"],
      ["alerts", faBell, "Alertas"],
      ["audit", faShieldAlt, "Auditoria"],
      ["profile", faUser, "Perfil"],
    ].map(([id, icon, label]) => {
      const isActive = active === id;

      return (
        <button key={id} onClick={() => onChange(id)} style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: isActive ? C.accent : "transparent",
          color: isActive ? "#fff" : "rgba(255,255,255,0.7)",
          border: "none",
          cursor: "pointer",
          borderRadius: 10,
          textAlign: "left",
          width: "100%",
          transition: "all 0.2s",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          fontWeight: 600,
        }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
        title={label}
        >
          <Icon icon={icon} size={16} color={isActive ? "#fff" : "#9CA3AF"} style={{ flexShrink: 0 }} />
          <span>{label}</span>
        </button>
      );
    })}
  </div>
);

// ============================================================
// PERFIL DO ADMINISTRADOR
// ============================================================
const AdminProfile = ({ user, onLogout, onUpdate, initialSection, onSectionChange }) => {
  const [section, setSection] = useState(initialSection || null);
  const [successMsg, setSuccessMsg] = useState(null);

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 3001); };

  useEffect(() => {
    if (initialSection) {
      setSection(initialSection);
      if (onSectionChange) onSectionChange(null);
    }
  }, [initialSection]);

  const BackBtn = () => (
    <button onClick={() => setSection(null)} style={{ background: C.lightGray, border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: C.dark, display: "flex", alignItems: "center", gap: 6 }}>
      <Icon icon={faArrowLeft} size={13} color={C.dark} /> Voltar
    </button>
  );

  const EditAdmin = () => {
    const [name, setName] = useState(user?.name || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [saving, setSaving] = useState(false);

    const save = async () => {
      setSaving(true);
      try {
        const { usersAPI } = await import("./services/api");
        const updated = await usersAPI.update(user.id, { name, phone });
        const newUser = { ...user, ...updated };
        localStorage.setItem("buildmatch_user", JSON.stringify(newUser));
        onUpdate(newUser);
        showSuccess("Perfil de Administrador actualizado!");
        setSection(null);
      } catch (err) { alert(err.message); }
      finally { setSaving(false); }
    };

    return (
      <div style={{ padding: "20px 16px", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <BackBtn />
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.dark, margin: 0 }}>Editar Perfil</h2>
        </div>
        <Card style={{ marginBottom: 16 }}>
          <Input label="Nome completo" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" />
          <Input label="Telefone" value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="+238 991 0000" />
          <Btn onClick={save} full disabled={saving}>{saving ? "A guardar..." : "Guardar alterações"}</Btn>
        </Card>
      </div>
    );
  };

  const ChangePassword = () => {
    const [currentPass, setCurrentPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const save = async () => {
      setError("");
      if (!currentPass || !newPass || !confirmPass) { setError("Preencha todos os campos"); return; }
      if (newPass !== confirmPass) { setError("As novas passwords não coincidem"); return; }
      if (newPass.length < 8) { setError("Mínimo 8 caracteres"); return; }
      setSaving(true);
      try {
        const { authAPI } = await import("./services/api");
        await authAPI.changePassword({ currentPassword: currentPass, newPassword: newPass });
        showSuccess("Password alterada com sucesso!");
        setSection(null);
      } catch (err) { setError(err.message); } finally { setSaving(false); }
    };

    return (
      <div style={{ padding: "20px 16px", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <BackBtn />
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.dark, margin: 0 }}>Segurança</h2>
        </div>
        <Card style={{ marginBottom: 16 }}>
          <h4 style={{ margin: "0 0 16px", color: C.dark, fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon icon={faLock} size={14} color={C.primary} /> Alterar palavra-passe
          </h4>
          {error && <ErrMsg msg={error} />}
          <Input label="Password actual" value={currentPass} onChange={e => setCurrentPass(e.target.value)} type="password" placeholder="••••••••" />
          <Input label="Nova password" value={newPass} onChange={e => setNewPass(e.target.value)} type="password" placeholder="••••••••" />
          <Input label="Confirmar password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} type="password" placeholder="••••••••" />
          <Btn onClick={save} full disabled={saving}>{saving ? "A alterar..." : "Alterar password"}</Btn>
        </Card>
      </div>
    );
  };

  const Help = () => {
    return (
      <div style={{ padding: "20px 16px", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <BackBtn />
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.dark, margin: 0 }}>Ajuda Admin</h2>
        </div>
        <Card style={{ marginTop: 20, background: `${C.primary}08`, border: `1px solid ${C.primary}20` }}>
          <p style={{ margin: 0, fontSize: 13, color: C.primary, fontWeight: 600, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon icon={faShieldAlt} size={12} color={C.primary} /> Suporte de Sistema
          </p>
          <p style={{ margin: 0, fontSize: 13, color: C.gray }}>Acesso de administração do BuildMatch.</p>
          <p style={{ margin: 0, fontSize: 13, color: C.gray }}>Contacto técnico: suporte.buildmatch@gmail.com</p>
        </Card>
      </div>
    );
  };

  if (section === "edit") return <EditAdmin />;
  if (section === "security") return <ChangePassword />;
  if (section === "help") return <Help />;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {successMsg && <SuccessModal message={successMsg} onClose={() => setSuccessMsg(null)} />}
      <div style={{ background: C.primary, padding: "28px 16px 50px", textAlign: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
          <Avatar name={user?.name} color={C.accent} size={80} />
        </div>
        <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 800, marginTop: 12, marginBottom: 4 }}>{user?.name}</h2>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: 0 }}>{user?.email}</p>
        <div style={{ background: "rgba(255,255,255,0.2)", display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 16px", borderRadius: 20, marginTop: 8 }}>
          <Icon icon={faShieldAlt} size={12} color={C.accent} />
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>Administrador</span>
        </div>
      </div>
      <div style={{ padding: "0 16px", marginTop: -24 }}>
        <Card style={{ marginBottom: 16, padding: 8 }}>
          {[
            { icon: faPencilAlt, label: "Editar perfil", desc: "Nome, telefone", key: "edit" },
            { icon: faLock, label: "Segurança", desc: "Alterar palavra-passe", key: "security" },
            { icon: faQuestionCircle, label: "Ajuda & Suporte", desc: "Contacto técnico", key: "help" },
          ].map((item, i, arr) => (
            <div key={item.key}>
              <div onClick={() => setSection(item.key)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 10px", cursor: "pointer", borderRadius: 10 }}
                onMouseEnter={e => e.currentTarget.style.background = C.lightGray}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${C.primary}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon icon={item.icon} size={18} color={C.primary} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: C.dark, fontSize: 14 }}>{item.label}</div>
                  <div style={{ color: C.gray, fontSize: 12, marginTop: 1 }}>{item.desc}</div>
                </div>
                <Icon icon={faChevronRight} size={13} color={C.gray} />
              </div>
              {i < arr.length - 1 && <div style={{ height: 1, background: C.border, marginLeft: 62 }} />}
            </div>
          ))}
        </Card>
        <p style={{ textAlign: "center", color: C.gray, fontSize: 12, marginBottom: 16 }}>BuildMatch Admin v1.0.0</p>
        <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px", background: C.error, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: "'DM Sans', sans-serif", marginBottom: 32 }}>
          <Icon icon={faSignOutAlt} size={16} color="#fff" /> Terminar sessão
        </button>
      </div>
    </div>
  );
};

// ============================================================
// ECRÃ DE EMAIL NÃO CONFIRMADO
// ============================================================
const EmailNotVerifiedScreen = ({ user, onLogout, onVerified }) => {
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");

  const checkStatus = async () => {
    setChecking(true);
    setMsg("");
    try {
      const refreshed = await authAPI.me();
      if (refreshed.emailVerified) {
        onVerified(refreshed);
      } else {
        setMsg("O seu email ainda não está confirmado. Verifique a sua caixa de entrada.");
      }
    } catch (err) {
      setMsg("Erro ao verificar estado: " + err.message);
    } finally {
      setChecking(false);
    }
  };

  const resendEmail = async () => {
    setSending(true);
    setMsg("");
    try {
      const res = await authAPI.resendVerification(user.email);
      setMsg(res.message || "Link de confirmação enviado!");
    } catch (err) {
      setMsg("Erro ao reenviar: " + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.lightGray, padding: 20, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 32, textAlign: "center", maxWidth: 380, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: `${C.primary}15`, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <Icon icon={faEnvelope} size={28} color={C.primary} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: C.dark, margin: "0 0 8px" }}>Confirme o seu email</h2>
        <p style={{ color: C.gray, fontSize: 14, lineHeight: 1.5, margin: "0 0 16px" }}>
          Para aceder ao BuildMatch, por favor confirme o seu endereço de email. Enviámos um link de verificação para:
        </p>
        <p style={{ fontWeight: 700, color: C.dark, fontSize: 15, margin: "0 0 24px", wordBreak: "break-all" }}>{user?.email}</p>
        
        {msg && <p style={{ color: C.primary, fontSize: 13, fontWeight: 600, background: `${C.primary}10`, padding: "10px 12px", borderRadius: 10, margin: "0 0 20px" }}>{msg}</p>}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={checkStatus} disabled={checking}
            style={{ width: "100%", background: C.primary, color: "#fff", border: "none", padding: "12px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
            {checking ? "A verificar..." : "Já confirmei / Atualizar"}
          </button>
          
          <button onClick={resendEmail} disabled={sending}
            style={{ width: "100%", background: "none", border: `1.5px solid ${C.border}`, color: C.dark, padding: "11px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
            {sending ? "A enviar..." : "Reenviar email de confirmação"}
          </button>

          <button onClick={onLogout}
            style={{ width: "100%", background: "none", border: "none", color: C.error, padding: "10px", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans', sans-serif", marginTop: 10 }}>
            Terminar sessão
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// ECRÃ DE VERIFICAÇÃO PROFISSIONAL
// ============================================================
const ProfessionalVerificationScreen = ({ user, onLogout, onVerified }) => {
  const [checking, setChecking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(user.professional?.verificationDoc || null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("O ficheiro é demasiado grande. Máximo 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setErrorMsg("");
    };
    reader.readAsDataURL(file);
  };

  const uploadDoc = async () => {
    if (!preview) {
      setErrorMsg("Por favor, selecione ou tire uma foto do seu documento comprovativo.");
      return;
    }
    setUploading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await professionalsAPI.uploadVerificationDoc(preview);
      setSuccessMsg("Documento enviado com sucesso! Aguarda aprovação do administrador.");
      
      const refreshed = await authAPI.me();
      onVerified(refreshed);
    } catch (err) {
      setErrorMsg(err.message || "Erro ao fazer upload do documento.");
    } finally {
      setUploading(false);
    }
  };

  const checkStatus = async () => {
    setChecking(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const refreshed = await authAPI.me();
      if (refreshed.professional?.verified) {
        onVerified(refreshed);
      } else if (refreshed.professional?.verificationDoc) {
        setSuccessMsg("O seu documento está em análise pela nossa equipa de administração.");
      } else {
        setPreview(null);
        setErrorMsg("O seu documento anterior foi rejeitado. Envie um novo comprovativo válido.");
      }
    } catch (err) {
      setErrorMsg("Erro ao verificar estado: " + err.message);
    } finally {
      setChecking(false);
    }
  };

  const isPending = user.professional?.verificationDoc && !user.professional?.verified;

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.lightGray, padding: 20, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 32, textAlign: "center", maxWidth: 420, width: "100%", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: isPending ? `${C.accent}15` : `${C.primary}15`, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <Icon icon={isPending ? faClock : faShieldAlt} size={28} color={isPending ? C.accent : C.primary} />
        </div>
        
        <h2 style={{ fontSize: 20, fontWeight: 800, color: C.dark, margin: "0 0 8px" }}>Verificação de Conta</h2>
        <p style={{ color: C.gray, fontSize: 14, lineHeight: 1.5, margin: "0 0 20px" }}>
          Olá, <strong>{user?.name}</strong>. Para começar a aceitar orçamentos e agendamentos no BuildMatch, necessitamos de validar a sua atividade profissional.
        </p>

        {isPending ? (
          <div style={{ margin: "0 0 24px" }}>
            <div style={{ background: `${C.accent}10`, color: C.accent, padding: "12px", borderRadius: 12, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 }}>
              <Icon icon={faClock} size={14} />
              Aguardando aprovação do Administrador
            </div>
            <p style={{ color: C.gray, fontSize: 13, margin: "0 0 16px" }}>
              O seu comprovativo profissional foi submetido e está a ser avaliado pela nossa equipa de suporte.
            </p>
            {preview && (
              <div style={{ width: "100%", height: 160, borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}`, position: "relative", background: "#f8f9fa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src={preview} alt="Documento enviado" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </div>
            )}
          </div>
        ) : (
          <div style={{ margin: "0 0 24px", textAlign: "left" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: C.dark, textTransform: "uppercase", marginBottom: 8 }}>
              Enviar Comprovativo de Profissão
            </label>
            <p style={{ color: C.gray, fontSize: 13, lineHeight: 1.4, marginBottom: 16 }}>
              Submeta uma foto legível do seu documento de identificação profissional, alvará, carteira de eletricista/canalizador ou certificado.
            </p>

            {preview ? (
              <div style={{ position: "relative", width: "100%", height: 180, borderRadius: 12, overflow: "hidden", border: `1.5px dashed ${C.primary}`, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <img src={preview} alt="Antevisão do documento" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                <button onClick={() => setPreview(null)} style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <Icon icon={faTimes} size={14} />
                </button>
              </div>
            ) : (
              <div style={{ position: "relative", width: "100%", height: 120, borderRadius: 12, border: `2px dashed ${C.border}`, background: "#f8f9fa", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", marginBottom: 16 }}>
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }} />
                <Icon icon={faCamera} size={24} color={C.gray} />
                <span style={{ fontSize: 13, color: C.gray, fontWeight: 600 }}>Escolher Ficheiro ou Foto</span>
                <span style={{ fontSize: 11, color: C.gray }}>PNG, JPG até 5MB</span>
              </div>
            )}
          </div>
        )}

        {errorMsg && <p style={{ color: C.error, fontSize: 13, fontWeight: 600, background: `${C.error}10`, padding: "10px 12px", borderRadius: 10, margin: "0 0 20px" }}>{errorMsg}</p>}
        {successMsg && <p style={{ color: C.success || "#2ec4b6", fontSize: 13, fontWeight: 600, background: `${C.success || "#2ec4b6"}10`, padding: "10px 12px", borderRadius: 10, margin: "0 0 20px" }}>{successMsg}</p>}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {isPending ? (
            <button onClick={checkStatus} disabled={checking}
              style={{ width: "100%", background: C.primary, color: "#fff", border: "none", padding: "12px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
              {checking ? "A verificar..." : "Atualizar Estado"}
            </button>
          ) : (
            <button onClick={uploadDoc} disabled={uploading || !preview}
              style={{ width: "100%", background: C.primary, color: "#fff", border: "none", padding: "12px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "'DM Sans', sans-serif", opacity: (!preview || uploading) ? 0.6 : 1 }}>
              {uploading ? "A enviar comprovativo..." : "Submeter para Aprovação"}
            </button>
          )}

          <button onClick={onLogout}
            style={{ width: "100%", background: "none", border: "none", color: C.error, padding: "10px", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
            Terminar sessão
          </button>
        </div>
      </div>
    </div>
  );
};