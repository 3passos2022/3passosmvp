import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Função para extrair query params da URL
  function getQueryParams(search: string) {
    return Object.fromEntries(new URLSearchParams(search));
  }

  const query = getQueryParams(location.search);

  useEffect(() => {
    // O Supabase processa o token automaticamente ao acessar a URL
    // Podemos exibir uma mensagem e redirecionar após alguns segundos
    if (query.type === 'email_change' || query.type === 'signup' || query.type === 'recovery') {
      // Opcional: atualizar sessão, se necessário
      setTimeout(() => {
        navigate('/login?emailChange=success');
      }, 3000);
    }
  }, [query, navigate]);

  let message = 'Processando confirmação...';
  if (query.type === 'email_change') {
    message = 'E-mail confirmado com sucesso! Você já pode acessar com o novo e-mail.';
  } else if (query.type === 'signup') {
    message = 'Cadastro confirmado! Você já pode acessar sua conta.';
  } else if (query.type === 'recovery') {
    message = 'Redefinição de senha confirmada!';
  }

  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h2>{message}</h2>
      <p>Você será redirecionado em instantes...</p>
    </div>
  );
};

export default AuthCallback; 