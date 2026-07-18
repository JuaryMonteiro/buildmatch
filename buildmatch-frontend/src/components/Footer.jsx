import logo from "../assets/logo.png";

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-col">
          <img src={logo} alt="BuildMatch" className="footer-logo" />
          <p className="footer-tagline">Ligamos clientes a profissionais da construção civil.</p>
        </div>
        <div className="footer-col">
          <h4>Plataforma</h4>
          <a href="#">Como funciona</a>
          <a href="#">Profissionais</a>
          <a href="#">Categorias</a>
        </div>
        <div className="footer-col">
          <h4>Suporte</h4>
          <a href="#">Ajuda</a>
          <a href="#">Contacto</a>
          <a href="#">Termos e Condições</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>&copy; {new Date().getFullYear()} BuildMatch. Todos os direitos reservados.</span>
      </div>
    </footer>
  );
}