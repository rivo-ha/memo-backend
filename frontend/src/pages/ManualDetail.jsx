import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getManualById, addComment, updateComment, deleteComment } from '../api';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, ArrowLeft, Clock, Tag, Trash2, Edit2, X, Check, User } from 'lucide-react';

export default function ManualDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [manual, setManual] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Comment form state
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit comment state
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');

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
    if (!user) {
      alert('댓글을 작성하려면 로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    if (!content.trim()) return;
    
    setSubmitting(true);
    try {
      await addComment(id, { content });
      setContent('');
      await fetchManual();
    } catch (error) {
      console.error('Failed to add comment', error);
      alert('댓글 저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) return;

    try {
      await deleteComment(id, commentId);
      alert('댓글이 삭제되었습니다.');
      await fetchManual();
    } catch (error) {
      alert(error.response?.data?.message || '댓글 삭제에 실패했습니다.');
    }
  };

  const startEditing = (comment) => {
    setEditingCommentId(comment._id);
    setEditContent(comment.content);
  };

  const submitEditComment = async (commentId) => {
    try {
      await updateComment(id, commentId, { content: editContent });
      setEditingCommentId(null);
      await fetchManual();
    } catch (error) {
      alert(error.response?.data?.message || '댓글 수정에 실패했습니다.');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>로딩 중...</div>;
  if (!manual) return <div style={{ textAlign: 'center', padding: '3rem' }}>매뉴얼을 찾을 수 없습니다.</div>;

  const isManualAuthor = user && (user.userId === manual.authorId || user.username === 'rivo');

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <button onClick={() => navigate(-1)} className="btn btn-secondary">
          <ArrowLeft size={18} /> 돌아가기
        </button>
        {isManualAuthor && (
          <button onClick={() => navigate(`/edit/${manual.id}`)} className="btn btn-outline">
            <Edit2 size={16} /> 매뉴얼 수정
          </button>
        )}
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <span className="badge" style={{ marginBottom: '1rem' }}>{manual.category}</span>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{manual.title}</h1>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '2rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><User size={16} /> 작성자: {manual.author}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={16} /> {manual.lastUpdated}</span>
          {manual.tags && manual.tags.length > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Tag size={16} /> {manual.tags.join(', ')}</span>
          )}
        </div>

        <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '1.1rem', marginBottom: '2rem' }}>
          {manual.content}
        </div>

        {manual.images && manual.images.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--surface-border)', paddingTop: '2rem' }}>
            {manual.images.map((img, index) => (
              <img 
                key={index}
                src={img} 
                alt={`manual-img-${index}`} 
                style={{ width: '100%', maxWidth: '100%', borderRadius: '8px', border: '1px solid var(--border)' }} 
              />
            ))}
          </div>
        )}
      </div>

      <div className="glass-card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <MessageSquare size={20} color="var(--primary)" /> 
          댓글 ({manual.comments?.length || 0})
        </h3>

        <div style={{ marginBottom: '2rem' }}>
          {manual.comments?.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!</p>
          ) : (
            manual.comments?.map((comment) => {
              const isCommentAuthor = user && (user.userId === comment.authorId || user.username === 'rivo');
              
              return (
                <div key={comment._id} className="comment-box animate-fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{comment.author}</strong>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {new Date(comment.date).toLocaleString()}
                      </span>
                    </div>
                    
                    {isCommentAuthor && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {editingCommentId === comment._id ? (
                          <>
                            <button onClick={() => submitEditComment(comment._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--success)' }} title="수정 완료">
                              <Check size={16} />
                            </button>
                            <button onClick={() => setEditingCommentId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} title="취소">
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEditing(comment)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} title="수정">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDeleteComment(comment._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }} title="삭제">
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {editingCommentId === comment._id ? (
                    <textarea 
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      style={{ minHeight: '60px', marginBottom: '0' }}
                    />
                  ) : (
                    <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>
                      {comment.content}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {user ? (
          <form onSubmit={handleCommentSubmit} style={{ marginTop: '2rem', borderTop: '1px solid var(--surface-border)', paddingTop: '2rem' }}>
            <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} /> {user.name} 님으로 댓글 쓰기
            </h4>
            <textarea 
              placeholder="댓글 내용을 입력하세요..." 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              style={{ minHeight: '80px' }}
            />
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? '등록 중...' : '댓글 등록'}
            </button>
          </form>
        ) : (
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--surface-border)', paddingTop: '2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>댓글을 작성하려면 로그인이 필요합니다.</p>
            <button onClick={() => navigate('/login')} className="btn btn-primary">
              로그인하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
