import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../api';
import { User, Save, ArrowLeft } from 'lucide-react';

export default function Profile() {
  const { user, updateToken } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user === null && !localStorage.getItem('token')) {
      alert('로그인이 필요한 서비스입니다.');
      navigate('/login');
    } else if (user) {
      setName(user.name);
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('변경할 이름을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const response = await updateProfile({ name: name.trim() });
      updateToken(response.data.token, { ...user, name: response.data.user.name });
      alert('이름이 성공적으로 변경되었습니다!\\n(이전에 작성했던 글과 댓글의 이름도 모두 변경되었습니다)');
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || '이름 변경 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div style={{ textAlign: 'center', padding: '3rem' }}>로딩 중...</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '500px', margin: '0 auto', paddingTop: '2rem' }}>
      <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginBottom: '2rem' }}>
        <ArrowLeft size={18} /> 돌아가기
      </button>

      <div className="glass-card" style={{ padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: '64px', height: '64px', 
            backgroundColor: 'var(--primary-light)', 
            borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem auto'
          }}>
            <User size={32} color="var(--primary)" />
          </div>
          <h2>프로필 설정</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            매뉴얼과 댓글에 표시될 이름을 변경할 수 있습니다.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>현재 활동명</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              style={{ fontSize: '1.1rem', padding: '0.75rem' }}
              placeholder="새로운 이름을 입력하세요"
            />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              이름을 변경하면 이전에 작성했던 모든 매뉴얼과 댓글의 이름도 새 이름으로 함께 변경됩니다.
            </p>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', justifyContent: 'center' }}
            disabled={loading || name === user.name}
          >
            <Save size={18} /> {loading ? '변경 중...' : '변경 내용 저장'}
          </button>
        </form>
      </div>
    </div>
  );
}
