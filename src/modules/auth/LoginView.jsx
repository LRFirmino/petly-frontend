import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import { useAuth } from '../../context/AuthContext';

// Cadastro público desabilitado por enquanto: as contas são criadas por um
// administrador em Configurações > Usuários e acessos.
// (O código de criação de conta continua aqui — basta ligar a flag para voltar.)
const SELF_SIGNUP_ENABLED = false;

const features = [
  { icon: 'paw', title: 'Clientes, pets e agenda', text: 'Tudo o que a sua equipe precisa em um só painel.' },
  { icon : "calendar", title: "Mock feature",text:"Lorem ipsum"},
  { icon: "chart", title:"Mock feature",text:"Lorem ipsum"}
];

export default function LoginView() {
  const { login, register, status, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname ?? '/';

  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '', petshopName: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (status === 'authenticated') {
    return <Navigate to={user?.role === 'PLATFORM_ADMIN' ? '/plataforma' : from} replace />;
  }

  const isLogin = mode === 'login';

  function update(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function switchMode(next) {
    setMode(next);
    setError(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const logged = isLogin
        ? await login(form.email.trim(), form.password)
        : await register({
            petshopName: form.petshopName.trim(),
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
          });
      navigate(logged?.role === 'PLATFORM_ADMIN' ? '/plataforma' : from, { replace: true });
    } catch (err) {
      setError(err.message ?? 'Não foi possível concluir a operação.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <aside className="auth-brand">
        <div className="auth-brand-top">
          <div className="brand-mark">
            <Icon name="paw" size={23} />
          </div>
          <div>
            <strong>Petly</strong>
            <span>Gestão pet</span>
          </div>
        </div>

        <div className="auth-brand-body">
          <h1>Bem-vindo de volta ao seu petshop</h1>
          <p>
            Gerencie agenda, clientes e pets em um painel intuitivo e moderno.
          </p>
          {features.map((feature) => (
            <div className="auth-feature" key={feature.title}>
              <div className="auth-feature-icon">
                <Icon name={feature.icon} size={18} />
              </div>
              <div>
                <strong>{feature.title}</strong>
                <span>{feature.text}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="auth-brand-foot">
          © {new Date().getFullYear()} Petly. Todos os direitos reservados.
        </div>
      </aside>

      <main className="auth-panel">
        <div className="auth-inner">
          <div className="auth-mobile-brand">
            <div className="brand-mark">
              <Icon name="paw" size={20} />
            </div>
            <strong>Petly</strong>
          </div>

          <div className="auth-card">
            <h2>{isLogin ? 'Entrar na sua conta' : 'Criar um novo petshop'}</h2>
            <p className="auth-subtitle">
              {isLogin
                ? 'Use suas credenciais para acessar o painel.'
                : 'Cadastre-se para começar. Criaremos uma área isolada só sua.'}
            </p>

            {SELF_SIGNUP_ENABLED ? (
              <div className="auth-tabs">
                <button
                  type="button"
                  className={`auth-tab ${isLogin ? 'active' : ''}`}
                  onClick={() => switchMode('login')}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  className={`auth-tab ${!isLogin ? 'active' : ''}`}
                  onClick={() => switchMode('register')}
                >
                  Criar conta
                </button>
              </div>
            ) : null}

            {error ? (
              <div className="auth-error">
                <Icon name="alert" size={16} />
                <span>{error}</span>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} noValidate>
              {!isLogin ? (
                <>
                  <div className="auth-field">
                    <label htmlFor="petshopName">Nome do petshop</label>
                    <div className="auth-input-wrap">
                      <Icon name="building" size={16} className="aside" />
                      <input
                        id="petshopName"
                        className="auth-input"
                        type="text"
                        value={form.petshopName}
                        onChange={(event) => update('petshopName', event.target.value)}
                        placeholder="Ex.: Petly Banho & Tosa"
                        required
                      />
                    </div>
                  </div>
                  <div className="auth-field">
                    <label htmlFor="name">Seu nome</label>
                    <div className="auth-input-wrap">
                      <Icon name="user" size={16} className="aside" />
                      <input
                        id="name"
                        className="auth-input"
                        type="text"
                        value={form.name}
                        onChange={(event) => update('name', event.target.value)}
                        placeholder="Ex.: Marina Souza"
                        required
                      />
                    </div>
                  </div>
                </>
              ) : null}

              <div className="auth-field">
                <label htmlFor="email">E-mail</label>
                <div className="auth-input-wrap">
                  <Icon name="mail" size={16} className="aside" />
                  <input
                    id="email"
                    className="auth-input"
                    type="email"
                    value={form.email}
                    onChange={(event) => update('email', event.target.value)}
                    placeholder="voce@petly.com.br"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="password">Senha</label>
                <div className="auth-input-wrap">
                  <Icon name="lock" size={16} className="aside" />
                  <input
                    id="password"
                    className="auth-input"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(event) => update('password', event.target.value)}
                    placeholder="••••••••"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    required
                  />
                  <button
                    type="button"
                    className="auth-eye"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    <Icon name={showPassword ? 'eyeOff' : 'eye'} size={16} />
                  </button>
                </div>
                {!isLogin ? <p className="auth-hint">Mínimo de 8 caracteres.</p> : null}
              </div>

              <button type="submit" className="auth-submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Icon name="loader" size={16} className="auth-spin" />
                    {isLogin ? 'Entrando...' : 'Criando...'}
                  </>
                ) : (
                  <>
                    {isLogin ? 'Entrar' : 'Criar petshop e entrar'}
                    <Icon name="arrowRight" size={16} />
                  </>
                )}
              </button>
            </form>

            {!SELF_SIGNUP_ENABLED ? (
              <p className="auth-demo-note" style={{ marginTop: 14 }}>
                Precisa de acesso? Peça a um administrador do seu petshop para criar a sua conta.
              </p>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
