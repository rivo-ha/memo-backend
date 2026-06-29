import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import ManualDetail from './pages/ManualDetail';
import CreateManual from './pages/CreateManual';
import EditManual from './pages/EditManual';
import { BookOpen } from 'lucide-react';
import './index.css';

function App() {
  return (
    <Router>
      <div className="container animate-fade-in">
        <header className="header-nav">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <BookOpen size={32} color="#818cf8" />
            <h1 style={{ margin: 0, fontSize: '2rem' }}>Manager Hub</h1>
          </Link>
          <Link to="/create" className="btn btn-primary">
            + 매뉴얼 작성
          </Link>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/manual/:id" element={<ManualDetail />} />
            <Route path="/create" element={<CreateManual />} />
            <Route path="/edit/:id" element={<EditManual />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
