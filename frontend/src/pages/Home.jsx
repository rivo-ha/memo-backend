import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getManuals, searchWithAI } from '../api';
import { FileText, Search, Sparkles, ChevronDown, ChevronUp, User } from 'lucide-react';

export default function Home() {
  const [manuals, setManuals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [aiSearching, setAiSearching] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [openPerson, setOpenPerson] = useState(null); // 현재 열린 사람

  const location = useLocation();
  const navigate = useNavigate();

  const currentDocType = location.pathname.includes('interviews') ? 'interview' : 'manual';

  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/manuals', { replace: true });
    }
    fetchManuals();
  }, [location.pathname]);

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
    setSearchTerm('');
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

  const pageTitle = currentDocType === 'interview' ? '면담일지' : '매뉴얼';
  const pageIcon = currentDocType === 'interview' ? '👥' : '📚';

  // 면담일지 탭: 인원별 아코디언 뷰
  if (currentDocType === 'interview') {
    const interviewManuals = manuals.filter(m => (m.docType || 'manual') === 'interview');

    // 사람별로 그룹핑 (첫 번째 태그 = 사람 이름)
    const personMap = {};
    interviewManuals.forEach(m => {
      const person = (m.tags && m.tags[0]) ? m.tags[0] : '기타';
      if (!personMap[person]) personMap[person] = [];
      personMap[person].push(m);
    });

    const persons = Object.keys(personMap).sort();

    // 검색어 필터링
    const filteredPersons = searchTerm
      ? persons.filter(p =>
          p.toLowerCase().includes(searchTerm.toLowerCase()) ||
          personMap[p].some(m => m.title.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      : persons;

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{pageIcon} {pageTitle} 목록</h2>
        </div>

        {/* 검색창 */}
        <div style={{ position: 'relative', marginBottom: '2rem' }}>
          <Search size={20} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="이름 또는 키워드로 검색..."
            style={{ paddingLeft: '3rem', marginBottom: 0 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            데이터를 불러오는 중입니다...
          </div>
        ) : filteredPersons.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            검색 결과가 없습니다.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredPersons.map(person => {
              const logs = personMap[person];
              const isOpen = openPerson === person;

              return (
                <div key={person} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                  {/* 사람 헤더 (클릭하면 펼침) */}
                  <button
                    onClick={() => setOpenPerson(isOpen ? null : person)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem 1.5rem',
                      background: isOpen ? 'linear-gradient(to right, var(--primary), #818cf8)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: isOpen ? 'white' : 'var(--text-primary)',
                      transition: 'all 0.25s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        backgroundColor: isOpen ? 'rgba(255,255,255,0.25)' : 'var(--primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <User size={18} color="white" />
                      </div>
                      <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>{person}</span>
                      <span style={{
                        fontSize: '0.8rem',
                        backgroundColor: isOpen ? 'rgba(255,255,255,0.25)' : 'var(--surface-border)',
                        color: isOpen ? 'white' : 'var(--text-secondary)',
                        padding: '0.2rem 0.6rem', borderRadius: '20px'
                      }}>
                        {logs.length}건
                      </span>
                    </div>
                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>

                  {/* 펼쳐지는 목록 */}
                  {isOpen && (
                    <div className="animate-fade-in" style={{ padding: '0.75rem 1.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--surface-border)' }}>
                      {logs
                        .slice()
                        .sort((a, b) => (b.lastUpdated || '').localeCompare(a.lastUpdated || ''))
                        .map(log => (
                          <Link to={`/manual/${log.id}`} key={log.id} style={{ textDecoration: 'none' }}>
                            <div style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '0.75rem 1rem',
                              borderRadius: '8px',
                              backgroundColor: 'var(--surface)',
                              border: '1px solid var(--surface-border)',
                              transition: 'all 0.2s',
                              cursor: 'pointer',
                            }}
                              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--surface-border)'}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                                <FileText size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontWeight: '500', fontSize: '0.9rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {log.title}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                    {log.content.substring(0, 60)}...
                                  </div>
                                </div>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flexShrink: 0, marginLeft: '1rem' }}>
                                {log.lastUpdated || '날짜 없음'}
                              </div>
                            </div>
                          </Link>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // 매뉴얼 탭: 기존 그리드 뷰
  const filteredManuals = manuals.filter(manual => {
    const manualType = manual.docType || 'manual';
    if (manualType !== currentDocType) return false;
    if (aiResult?.recommendations) {
      return aiResult.recommendations.some(rec => String(rec.id) === String(manual.id));
    }
    return manual.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           manual.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (manual.tags && manual.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{pageIcon} {pageTitle} 목록</h2>
      </div>

      {/* AI Semantic Search Box */}
      <div className="glass-card" style={{ marginBottom: '2rem', background: 'linear-gradient(to right, #faf5ff, #f3e8ff)', border: '1px solid #d8b4fe' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#7e22ce', marginBottom: '1rem' }}>
          <Sparkles size={20} /> AI 스마트 검색 (베타)
        </h3>
        <form onSubmit={handleAiSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: aiResult ? '1.5rem' : 0 }}>
          <input
            type="text"
            placeholder={`예: 관련된 ${pageTitle} 찾아줘`}
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
          placeholder={`${pageTitle} 검색 (제목 또는 카테고리)...`}
          style={{ paddingLeft: '3rem', marginBottom: 0 }}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (aiResult) setAiResult(null);
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
              const aiRec = aiResult?.recommendations?.find(r => String(r.id) === String(manual.id));
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
