import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createManual } from '../api';
import { ArrowLeft, Save } from 'lucide-react';

export default function CreateManual() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    content: '',
    tags: ''
  });
  const [submitting, setSubmitting] = useState(false);

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
      
      const response = await createManual(payload);
      navigate(`/manual/${response.data.id}`);
    } catch (error) {
      console.error('Failed to create manual', error);
      alert('매뉴얼 생성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginBottom: '2rem' }}>
        <ArrowLeft size={18} /> 돌아가기
      </button>

      <div className="glass-card">
        <h2 style={{ marginBottom: '2rem' }}>새 매뉴얼 작성</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>제목 *</label>
            <input 
              type="text" 
              name="title" 
              value={formData.title} 
              onChange={handleChange} 
              required 
              placeholder="매뉴얼 제목을 입력하세요"
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
              placeholder="예: IT, 인사, 마케팅, 일반"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>태그 (쉼표로 구분)</label>
            <input 
              type="text" 
              name="tags" 
              value={formData.tags} 
              onChange={handleChange} 
              placeholder="예: 신입, 가이드, 보안"
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>내용 *</label>
            <textarea 
              name="content" 
              value={formData.content} 
              onChange={handleChange} 
              required 
              placeholder="매뉴얼의 상세 내용을 작성해주세요..."
              style={{ minHeight: '300px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
              취소
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Save size={18} /> {submitting ? '저장 중...' : '매뉴얼 저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
