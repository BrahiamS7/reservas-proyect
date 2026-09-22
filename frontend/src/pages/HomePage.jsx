import { Link } from 'react-router-dom';
import CourtIllustration from '../components/CourtIllustration';

export default function HomePage() {
  return (
    <div className="pagina-bloque">
      <nav className="bloque-nav">
        <span className="bloque-nav-marca">COMPLEJO DEPORTIVO</span>
      </nav>

      <div className="hero-bloque-grid">
        <div>
          <div className="hero-bloque-eyebrow">Volleyball · Pádel</div>
          <h1 className="hero-bloque-titulo">
            Tu cancha.
            <br />
            Tu hora.
          </h1>
          <p className="hero-bloque-subtitulo">
            Elegí el horario, confirmá por WhatsApp y listo. Pago en cancha, sin vueltas.
          </p>
          <div className="hero-bloque-acciones">
            <Link to="/cliente/login">
              <button className="btn-oscuro">Ver horarios disponibles</button>
            </Link>
            <span className="badge-oscuro">$70.000 / hora</span>
          </div>
        </div>

        <div className="hero-bloque-panel">
          <CourtIllustration />
        </div>
      </div>
    </div>
  );
}
