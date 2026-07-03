import { useState, useEffect, useRef, useCallback } from "react";
import logo from "../assets/logo.png";
import { notificationsAPI } from "../services/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSignOutAlt, faBell, faMoon, faSun,
  faCheck, faCheckDouble, faTrash, faCircle,
} from "@fortawesome/free-solid-svg-icons";

// Ícone por tipo de notificação
const typeIcons = {
  PROJETO: "📋",
  AGENDAMENTO: "📅",
  AVALIACAO: "⭐",
  SISTEMA: "🔔",
};

export default function AppHeader({ onLogout }) {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // ── Tema ──
  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  // ── Buscar notificações via API autenticada ──
  const fetchNotifications = useCallback(async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        notificationsAPI.list(),
        notificationsAPI.unreadCount(),
      ]);
      setNotifications(listRes.data || []);
      setUnreadCount(countRes.count || 0);
    } catch (err) {
      console.error("Erro ao buscar notificações:", err);
    }
  }, []);

  // Buscar ao montar e polling a cada 30 segundos
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Marcar como lida ──
  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, status: "LIDA" } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Erro ao marcar como lida:", err);
    }
  };

  // ── Marcar todas como lidas ──
  const handleMarkAllRead = async () => {
    try {
      setLoading(true);
      await notificationsAPI.markAllRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, status: "LIDA" }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Erro ao marcar todas como lidas:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Apagar notificação ──
  const handleDelete = async (id) => {
    try {
      await notificationsAPI.delete(id);
      const deleted = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (deleted && deleted.status === "NAO_LIDA") {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Erro ao apagar notificação:", err);
    }
  };

  // ── Formatar data ──
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMin / 60);
    const diffD = Math.floor(diffH / 24);

    if (diffMin < 1) return "Agora";
    if (diffMin < 60) return `${diffMin}min`;
    if (diffH < 24) return `${diffH}h`;
    if (diffD < 7) return `${diffD}d`;
    return date.toLocaleDateString("pt-PT");
  };

  return (
    <header className="app-header">
      <img src={logo} alt="BuildMatch" className="app-header-logo" />
      
      <div className="app-header-actions">
        <button onClick={toggleTheme} className="header-action-btn" title="Alternar Tema">
          <FontAwesomeIcon icon={theme === "light" ? faMoon : faSun} />
        </button>
        
        <div className="notification-wrapper" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="header-action-btn"
            title="Notificações"
          >
            <FontAwesomeIcon icon={faBell} />
            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="notifications-dropdown">
              <div className="notifications-header">
                <h4>Notificações</h4>
                {unreadCount > 0 && (
                  <button
                    className="mark-all-read-btn"
                    onClick={handleMarkAllRead}
                    disabled={loading}
                    title="Marcar todas como lidas"
                  >
                    <FontAwesomeIcon icon={faCheckDouble} />
                    <span>Marcar todas</span>
                  </button>
                )}
              </div>

              <div className="notifications-body">
                {notifications.length === 0 ? (
                  <div className="notifications-empty">
                    <FontAwesomeIcon icon={faBell} style={{ fontSize: 32, opacity: 0.3 }} />
                    <p>Sem notificações</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`notification-item ${n.status === "NAO_LIDA" ? "unread" : ""}`}
                    >
                      <div className="notification-icon">
                        {typeIcons[n.type] || "🔔"}
                      </div>
                      <div className="notification-content">
                        <div className="notification-title-row">
                          <strong className="notification-title">{n.titulo}</strong>
                          {n.status === "NAO_LIDA" && (
                            <FontAwesomeIcon
                              icon={faCircle}
                              className="unread-dot"
                            />
                          )}
                        </div>
                        <p className="notification-text">{n.mensagem}</p>
                        <span className="notification-date">
                          {formatDate(n.data_criacao)}
                        </span>
                      </div>
                      <div className="notification-actions">
                        {n.status === "NAO_LIDA" && (
                          <button
                            className="notif-action-btn"
                            onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}
                            title="Marcar como lida"
                          >
                            <FontAwesomeIcon icon={faCheck} />
                          </button>
                        )}
                        <button
                          className="notif-action-btn delete"
                          onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                          title="Apagar"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        <button onClick={onLogout} className="header-action-btn" title="Terminar Sessão">
          <FontAwesomeIcon icon={faSignOutAlt} />
        </button>
      </div>
    </header>
  );
}
