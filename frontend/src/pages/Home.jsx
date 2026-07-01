import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getManuals, searchWithAI } from '../api';
import { FileText, Search, Sparkles } from 'lucide-react';

export default function Home() {
  const [manuals, setManuals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [aiSearching, setAiSearching] = useState(false);
  const [aiResult, setAiResult] = useState(null);

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

  const handleAiSearch = async (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    
    setAiSearching(true);
    setAiResult(null);
    setSearchTerm(''); // Clear normal search
    
    try {
      const response = await searchWithAI(aiQuery);
      setAiResult(response.data);
    } catch (error) {
      console.error('AI search failed', error);
      alert('AI 검색 중 오류가 발생했습니다.');
    } finally {
      setAiSearching(false);
    }
  };

  const filteredManuals = manuals.filter(manual => {
    // If AI search result exists, only show recommended ones
    if (aiResult?.recommendations) {
      return aiResult.recommendations.some(rec => rec.id === manual.id);
    }
    
    return manual.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           manual.category.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div>
      {/* AI Semantic Search Box */}
      <div className="glass-card" style={{ marginBottom: '2rem', background: 'linear-gradient(to right, #faf5ff, #f3e8ff)', border: '1px solid #d8b4fe' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#7e22ce', marginBottom: '1rem' }}>
          <Sparkles size={20} /> AI 스마트 검색 (베타)
        </h3>
        <form onSubmit={handleAiSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: aiResult ? '1.5rem' : 0 }}>
          <input 
            type="text" 
            placeholder="예: 프린터 토너 교체 방법 찾아줘" 
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            style={{ marginBottom: 0, flexGrow: 1, borderColor: '#d8b4fe' }}
          />
          <button type="submit" className="btn btn-primary" disabled={aiSearching} style={{ backgroundColor: '#9333ea', borderColor: '#9333ea' }}>
            {aiSearching ? '검색 중...' : 'AI에게 묻기'}
          </button>
        </form>

        {aiResult && (
          <div className="animate-fade-in" style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: '8px', color: '#6b21a8' }}>
            <p style={{ fontWeight: '500', marginBottom: '0.5rem' }}>{aiResult.message}</p>
          </div>
        )}
      </div>

      <div style={{ position: 'relative', marginBottom: '2rem' }}>
        <Search size={20} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
        <input 
          type="text" 
          placeholder="매뉴얼 일반 검색 (제목 또는 카테고리)..." 
          style={{ paddingLeft: '3rem', marginBottom: 0 }}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (aiResult) setAiResult(null); // Clear AI results when typing in normal search
          }}
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
            filteredManuals.map(manual => {
              const aiRec = aiResult?.recommendations?.find(r => r.id === manual.id);
              
              return (
                <Link to={`/manual/${manual.id}`} key={manual.id}>
                  <div className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', border: aiRec ? '2px solid #d8b4fe' : undefined }}>
                    <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className="badge">{manual.category}</span>
                      {aiRec && <span style={{ fontSize: '0.75rem', color: '#9333ea', backgroundColor: '#faf5ff', padding: '0.25rem 0.5rem', borderRadius: '1rem', fontWeight: '500' }}><Sparkles size={12} style={{ display: 'inline', marginRight: '4px' }}/> AI 추천</span>}
                    </div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={20} color="var(--primary)" />
                      {manual.title}
                    </h3>
                    
                    {aiRec ? (
                      <div style={{ backgroundColor: '#faf5ff', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', color: '#6b21a8' }}>
                        <strong>💡 AI 코멘트:</strong> {aiRec.reason}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', flexGrow: 1, marginBottom: '1rem' }}>
                        {manual.content.substring(0, 80)}...
                      </p>
                    )}
                    
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--surface-border)', paddingTop: '0.75rem', marginTop: 'auto' }}>
                      최종 업데이트: {manual.lastUpdated || '알 수 없음'} | 댓글 {manual.comments?.length || 0}개
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
