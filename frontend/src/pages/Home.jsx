import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getManuals } from '../api';
import { FileText, Search } from 'lucide-react';

export default function Home() {
  const [manuals, setManuals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchManuals();
  }, []);

  const fetchManuals = async () => {
    try {
      const response = await getManuals();
      setManuals(response.data);
    } catch (error) {
      console.error('Failed to fetch manuals', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredManuals = manuals.filter(manual => 
    manual.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manual.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: '2rem' }}>
        <Search size={20} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
        <input 
          type="text" 
          placeholder="매뉴얼 검색 (제목 또는 카테고리)..." 
          style={{ paddingLeft: '3rem', marginBottom: 0 }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          데이터를 불러오는 중입니다...
        </div>
      ) : (
        <div className="grid">
          {filteredManuals.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              검색 결과가 없거나 아직 등록된 매뉴얼이 없습니다.
            </div>
          ) : (
            filteredManuals.map(manual => (
              <Link to={`/manual/${manual.id}`} key={manual.id}>
                <div className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <span className="badge">{manual.category}</span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={20} color="var(--primary)" />
                    {manual.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', flexGrow: 1, marginBottom: '1rem' }}>
                    {manual.content.substring(0, 80)}...
                  </p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--surface-border)', paddingTop: '0.75rem' }}>
                    최종 업데이트: {manual.lastUpdated || '알 수 없음'} | 댓글 {manual.comments?.length || 0}개
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
