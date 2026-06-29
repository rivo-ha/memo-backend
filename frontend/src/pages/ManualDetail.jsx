import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getManualById, addComment } from '../api';
import { MessageSquare, ArrowLeft, Clock, Tag } from 'lucide-react';

export default function ManualDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [manual, setManual] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Comment form state
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchManual();
  }, [id]);

  const fetchManual = async () => {
    try {
      const response = await getManualById(id);
      setManual(response.data);
    } catch (error) {
      console.error('Failed to fetch manual', error);
      alert('매뉴얼을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!author.trim() || !content.trim()) return;
    
    setSubmitting(true);
    try {
      await addComment(id, { author, content });
      setAuthor('');
      setContent('');
      await fetchManual(); // Refresh comments
    } catch (error) {
      console.error('Failed to add comment', error);
      alert('댓글 저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>로딩 중...</div>;
  if (!manual) return <div style={{ textAlign: 'center', padding: '3rem' }}>매뉴얼을 찾을 수 없습니다.</div>;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <button onClick={() => navigate(-1)} className="btn btn-secondary">
          <ArrowLeft size={18} /> 돌아가기
        </button>
        <button onClick={() => navigate(`/edit/${manual.id}`)} className="btn btn-outline">
          매뉴얼 수정
        </button>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <span className="badge" style={{ marginBottom: '1rem' }}>{manual.category}</span>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{manual.title}</h1>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '2rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={16} /> {manual.lastUpdated}</span>
          {manual.tags && manual.tags.length > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Tag size={16} /> {manual.tags.join(', ')}</span>
          )}
        </div>

        <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '1.1rem' }}>
          {manual.content}
        </div>
      </div>

      {/* Comments Section */}
      <div className="glass-card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <MessageSquare size={20} color="var(--primary)" /> 
          댓글 ({manual.comments?.length || 0})
        </h3>

        <div style={{ marginBottom: '2rem' }}>
          {manual.comments?.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!</p>
          ) : (
            manual.comments?.map((comment, idx) => (
              <div key={idx} className="comment-box animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{comment.author}</strong>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {new Date(comment.date).toLocaleString()}
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>
                  {comment.content}
                </p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleCommentSubmit} style={{ marginTop: '2rem', borderTop: '1px solid var(--surface-border)', paddingTop: '2rem' }}>
          <h4 style={{ marginBottom: '1rem' }}>댓글 작성</h4>
          <input 
            type="text" 
            placeholder="작성자 이름" 
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            required 
            style={{ maxWidth: '300px' }}
          />
          <textarea 
            placeholder="댓글 내용을 입력하세요..." 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            style={{ minHeight: '100px' }}
          />
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? '등록 중...' : '댓글 등록'}
          </button>
        </form>
      </div>
    </div>
  );
}
