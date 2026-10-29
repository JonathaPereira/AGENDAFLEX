import { Link } from 'react-router-dom';
export function MobilePreview() {
  return (
    <main className="mobile-preview">
      <header>
        <img src="/ross-logo.png" alt="Ross Barbearia" width="40" height="40" />
        <div>
          <strong>Prévia para celular</strong>
          <small>Dados fictícios · Sem pagamentos reais</small>
        </div>
        <Link to="/login">Voltar ao login</Link>
      </header>
      <iframe
        src="/demo.html?mobile=1"
        title="Demonstração interativa Ross Barbearia"
      />
    </main>
  );
}
