import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import ManualDetail from './pages/ManualDetail';
import CreateManual from './pages/CreateManual';
import EditManual from './pages/EditManual';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import SiteGateway from './components/SiteGateway';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BookOpen, LogOut, User, Users } from 'lucide-react';
import './index.css';

function Navigation() {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  const isInterview = location.pathname.includes('interviews');
  const createPath = isInterview ? '/create?type=interview' : '/create';
  const createText = isInterview ? '+ 면담일지 작성' : '+ 매뉴얼 작성';

  return (
    <header className="header-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link to="/manuals" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'var(--text)' }}>
          <BookOpen size={32} color="#3b82f6" />
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>5A 매뉴얼</h1>
        </Link>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/manuals" style={{ textDecoration: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
            <BookOpen size={18} /> 매뉴얼
          </Link>
          <Link to="/interviews" style={{ textDecoration: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
            <Users size={18} /> 면담일지
          </Link>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {user ? (
          <>
            <Link to="/profile" style={{ textDecoration: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', borderRadius: '8px', transition: 'background-color 0.2s' }} className="hover:bg-gray-100">
              <User size={18} /> <span style={{ fontWeight: '500' }}>{user.name}</span>님
            </Link>
            <Link to={createPath} className="btn btn-primary">
              {createText}
            </Link>
            <button onClick={logout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
              <LogOut size={18} /> 로그아웃
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-secondary">로그인</Link>
            <Link to="/register" className="btn btn-primary">회원가입</Link>
          </>
        )}
      </div>
    </header>
  );
}

function App() {
  return (
    <SiteGateway>
      <AuthProvider>
        <Router>
          <div className="container animate-fade-in">
            <Navigation />

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/manuals" element={<Home />} />
            <Route path="/interviews" element={<Home />} />
            <Route path="/manual/:id" element={<ManualDetail />} />
            <Route path="/create" element={<CreateManual />} />
            <Route path="/edit/:id" element={<EditManual />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
      </Router>
      </AuthProvider>
    </SiteGateway>
  );
}

export default App;
