import { useState, useEffect } from 'react';
import { verifySitePassword } from '../api';
import { Lock } from 'lucide-react';

export default function SiteGateway({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const siteAccess = localStorage.getItem('site_access');
    if (siteAccess === 'granted') {
      setIsAuthenticated(true);
    }
    setChecking(false);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;
    
    setLoading(true);
    setError('');
    
    try {
      await verifySitePassword({ password });
      localStorage.setItem('site_access', 'granted');
      setIsAuthenticated(true);
    } catch (err) {
      setError(err.response?.data?.message || '비밀번호가 틀렸습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) return null; // 화면 깜빡임 방지

  if (isAuthenticated) {
    return children;
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: 'var(--background)',
      padding: '1rem'
    }}>
      <div className="glass-card" style={{ maxWidth: '400px', width: '100%', padding: '3rem 2rem', textAlign: 'center' }}>
        <div style={{ 
          width: '64px', height: '64px', 
          backgroundColor: 'var(--primary-light)', 
          borderRadius: '50%', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem auto'
        }}>
          <Lock size={32} color="var(--primary)" />
        </div>
        
        <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>팀원 인증</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
          사이트에 접속하려면 비밀번호를 입력해주세요.
        </p>

        <form onSubmit={handleSubmit}>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호 입력"
            style={{ marginBottom: '1rem', textAlign: 'center', letterSpacing: '2px' }}
            required
            autoFocus
          />
          
          {error && (
            <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {error}
            </p>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
            disabled={loading}
          >
            {loading ? '확인 중...' : '입장하기'}
          </button>
        </form>
      </div>
    </div>
  );
}
