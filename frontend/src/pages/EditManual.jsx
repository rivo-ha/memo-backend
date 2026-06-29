import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getManualById, updateManual } from '../api';
import { ArrowLeft, Save } from 'lucide-react';

export default function EditManual() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    content: '',
    tags: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchManual();
  }, [id]);

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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Save size={18} /> {submitting ? '저장 중...' : '수정 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
