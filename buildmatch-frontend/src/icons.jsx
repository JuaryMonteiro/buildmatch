// src/icons.jsx
// Ficheiro central de todos os ícones da app BuildMatch

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome, faSearch, faClipboardList, faComments, faUser,
  faChartBar, faBriefcase, faCalendarAlt, faImages, faHardHat,
  faBell, faLock, faQuestionCircle, faStar, faMapMarkerAlt,
  faPencilAlt, faSignOutAlt, faSave, faPlus, faTimes, faCheck,
  faArrowLeft, faArrowRight, faPaperPlane, faPhone, faEnvelope,
  faTools, faBolt, faFaucet, faPaintRoller, faTree, faDraftingCompass,
  faWrench, faChevronRight, faChevronDown, faChevronUp,
  faCheckCircle, faTimesCircle, faClock, faBan,
  faImage, faVideo, faFile, faSmile, faPaperclip,
  faUserCircle, faBuilding, faGlobe, faShieldAlt,
  faThumbsUp, faReply, faEdit, faTrash, faEye,
  faTachometerAlt, faMoneyBillWave, faPercentage,
  faExclamationCircle, faInfoCircle, faLightbulb,
  faHandshake, faUserTie, faUserCheck,
} from "@fortawesome/free-solid-svg-icons";

import {
  faStar as faStarRegular,
  faComments as faCommentsRegular,
  faCalendarAlt as faCalendarRegular,
  faBell as faBellRegular,
  faUser as faUserRegular,
} from "@fortawesome/free-regular-svg-icons";

// ── Componente ícone reutilizável ──────────────────────────
export const Icon = ({ icon, size = 16, color, style: ex }) => (
  <FontAwesomeIcon
    icon={icon}
    style={{ fontSize: size, color: color || "currentColor", ...ex }}
  />
);

// ── Ícones exportados por nome ─────────────────────────────
export const icons = {
  // Navegação
  home:          faHome,
  search:        faSearch,
  projects:      faClipboardList,
  messages:      faComments,
  profile:       faUser,
  dashboard:     faTachometerAlt,
  agenda:        faCalendarAlt,
  portfolio:     faImages,
  professional:  faHardHat,

  // Acções
  edit:          faPencilAlt,
  save:          faSave,
  add:           faPlus,
  close:         faTimes,
  check:         faCheck,
  back:          faArrowLeft,
  next:          faArrowRight,
  send:          faPaperPlane,
  reply:         faReply,
  delete:        faTrash,
  view:          faEye,

  // Perfil
  logout:        faSignOutAlt,
  notifications: faBell,
  security:      faLock,
  help:          faQuestionCircle,
  address:       faMapMarkerAlt,
  reviews:       faStar,
  stats:         faChartBar,
  password:      faLock,
  avatar:        faUserCircle,

  // Contacto
  phone:         faPhone,
  email:         faEnvelope,
  chat:          faComments,
  attachment:    faPaperclip,
  emoji:         faSmile,

  // Status
  available:     faCheckCircle,
  unavailable:   faTimesCircle,
  pending:       faClock,
  cancelled:     faBan,
  verified:      faUserCheck,

  // Categorias
  pedreiro:      faTools,
  eletricista:   faBolt,
  canalizador:   faFaucet,
  pintor:        faPaintRoller,
  carpinteiro:   faTree,
  engenheiro:    faDraftingCompass,
  wrench:        faWrench,

  // Info
  info:          faInfoCircle,
  warning:       faExclamationCircle,
  tip:           faLightbulb,
  handshake:     faHandshake,
  money:         faMoneyBillWave,
  percentage:    faPercentage,

  // Chevrons
  right:         faChevronRight,
  down:          faChevronDown,
  up:            faChevronUp,

  // Media
  image:         faImage,
  video:         faVideo,
  file:          faFile,

  // Outros
  building:      faBuilding,
  globe:         faGlobe,
  shield:        faShieldAlt,
  like:          faThumbsUp,
  userTie:       faUserTie,
};

// ── Ícone de categoria por nome ────────────────────────────
export const categoryIcon = (name) => {
  const map = {
    "Pedreiro":    icons.pedreiro,
    "Eletricista": icons.eletricista,
    "Canalizador": icons.canalizador,
    "Pintor":      icons.pintor,
    "Carpinteiro": icons.carpinteiro,
    "Engenheiro":  icons.engenheiro,
  };
  return map[name] || icons.wrench;
};