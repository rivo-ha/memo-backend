import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getManualById, updateManual, reviewManualWithAI, reviseManualWithAI } from '../api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Save, Sparkles, Edit3 } from 'lucide-react';

export default function EditManual() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    content: '',
    tags: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // AI Feedback state
  const [aiFeedback, setAiFeedback] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [revising, setRevising] = useState(false);

  useEffect(() => {
    if (user === null && !localStorage.getItem('token')) {
      alert('로그인이 필요한 서비스입니다.');
      navigate('/login');
      return;
    }
    fetchManual();
  }, [id, user]);

  const fetchManual = async () => {
    try {
      const response = await getManualById(id);
      const manual = response.data;
      setFormData({
        title: manual.title,
        category: manual.category,
        content: manual.content,
        tags: manual.tags ? manual.tags.join(', ') : ''
      });
    } catch (error) {
      console.error('Failed to fetch manual', error);
      alert('매뉴얼을 불러오는데 실패했습니다.');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleReview = async () => {
    if (!formData.title || !formData.content) {
      alert('제목과 내용을 먼저 작성해주세요!');
      return;
    }
    setReviewing(true);
    setAiFeedback('');
    try {
      const response = await reviewManualWithAI({
        title: formData.title,
        category: formData.category,
        content: formData.content
      });
      setAiFeedback(response.data.feedback);
    } catch (error) {
      console.error('Failed to get AI review', error);
      alert(error.response?.data?.message || 'AI 피드백을 가져오지 못했습니다. 서버 설정을 확인하세요.');
    } finally {
      setReviewing(false);
    }
  };

  const handleRevise = async () => {
    if (!formData.content) {
      alert('내용을 먼저 작성해주세요!');
      return;
    }
    
    if (!window.confirm('AI가 내용을 다듬어 원래 내용을 완전히 덮어씌웁니다. 계속하시겠습니까?')) {
      return;
    }
    
    setRevising(true);
    try {
      const response = await reviseManualWithAI({
        content: formData.content
      });
      
      setFormData({
        ...formData,
        content: response.data.revisedContent
      });
      alert('AI가 내용을 성공적으로 다듬었습니다!');
    } catch (error) {
      console.error('Failed to get AI revision', error);
      alert(error.response?.data?.message || 'AI 수정 중 오류가 발생했습니다. 서버 설정을 확인하세요.');
    } finally {
      setRevising(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      };
      
      await updateManual(id, payload);
      navigate(`/manual/${id}`);
    } catch (error) {
      console.error('Failed to update manual', error);
      alert('매뉴얼 수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>로딩 중...</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginBottom: '2rem' }}>
        <ArrowLeft size={18} /> 취소
      </button>

      <div className="glass-card">
        <h2 style={{ marginBottom: '2rem' }}>매뉴얼 수정</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>제목 *</label>
            <input 
              type="text" 
              name="title" 
              value={formData.title} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>카테고리 *</label>
            <input 
              type="text" 
              name="category" 
              value={formData.category} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>태그 (쉼표로 구분)</label>
            <input 
              type="text" 
              name="tags" 
              value={formData.tags} 
              onChange={handleChange} 
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>내용 *</label>
            <textarea 
              name="content" 
              value={formData.content} 
              onChange={handleChange} 
              required 
              style={{ minHeight: '300px' }}
            />
          </div>

          {aiFeedback && (
            <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534', marginBottom: '1rem' }}>
                <Sparkles size={18} /> AI 피드백 결과
              </h4>
              <p style={{ whiteSpace: 'pre-wrap', color: '#15803d', fontSize: '0.95rem' }}>
                {aiFeedback}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                type="button" 
                onClick={handleReview} 
                className="btn btn-secondary" 
                disabled={reviewing || revising}
                style={{ borderColor: '#d8b4fe', color: '#9333ea', backgroundColor: '#faf5ff' }}
              >
                <Sparkles size={18} /> {reviewing ? 'AI 검토 중...' : 'AI 피드백 받기'}
              </button>
              
              <button 
                type="button" 
                onClick={handleRevise} 
                className="btn btn-primary" 
                disabled={reviewing || revising}
                style={{ backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' }}
              >
                <Edit3 size={18} /> {revising ? 'AI가 다듬는 중...' : 'AI가 내용 다듬기'}
              </button>
            </div>
            
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Save size={18} /> {submitting ? '저장 중...' : '수정 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
