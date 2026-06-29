require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
// 서버 포트 설정 (Render 등에서는 process.env.PORT를 자동으로 할당해줍니다)
const PORT = process.env.PORT || 5001;

// CORS 설정: 프론트엔드 도메인(예: 배포된 Cloudflare 주소)에서 서버로 요청을 보낼 수 있게 허용합니다.
// 실제 배포 시에는 origin에 프론트엔드 주소만 넣는 것이 안전합니다.
app.use(cors()); 
// 클라이언트에서 보내는 JSON 데이터를 파싱할 수 있게 해줍니다.
app.use(express.json());

// MongoDB 연결 (비밀번호가 포함된 URI는 환경변수 .env 로 관리해야 합니다)
// 로컬 테스트용 기본 주소를 폴백으로 세팅했습니다.
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/manager_hub';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB 연결 성공!'))
  .catch(err => console.error('❌ MongoDB 연결 에러:', err));

// 댓글 스키마 정의
const commentSchema = new mongoose.Schema({
  author: { type: String, required: true },
  content: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

// 매뉴얼 스키마 정의
const manualSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  content: { type: String, required: true },
  tags: [String],
  lastUpdated: String,
  comments: [commentSchema] // 댓글 스키마 포함 (서브도큐먼트)
});

// 모델 생성
const Manual = mongoose.model('Manual', manualSchema);

// API 1: 모든 매뉴얼 데이터 가져오기 (React 초기 로딩 시 호출)
app.get('/api/manuals', async (req, res) => {
  try {
    const manuals = await Manual.find();
    res.status(200).json(manuals);
  } catch (err) {
    res.status(500).json({ message: '데이터를 불러오는 중 오류가 발생했습니다.', error: err.message });
  }
});

// API: 특정 매뉴얼 데이터 하나 가져오기
app.get('/api/manuals/:id', async (req, res) => {
  try {
    const manual = await Manual.findOne({ id: Number(req.params.id) });
    if (!manual) return res.status(404).json({ message: '매뉴얼을 찾을 수 없습니다.' });
    res.status(200).json(manual);
  } catch (err) {
    res.status(500).json({ message: '데이터를 불러오는 중 오류가 발생했습니다.', error: err.message });
  }
});

// API: 새로운 매뉴얼 생성하기
app.post('/api/manuals', async (req, res) => {
  try {
    const { title, category, content, tags } = req.body;
    
    // 가장 큰 id를 찾아 1을 더해 새로운 id 생성
    const lastManual = await Manual.findOne().sort({ id: -1 });
    const newId = lastManual ? lastManual.id + 1 : 1;
    
    const newManual = new Manual({
      id: newId,
      title,
      category,
      content,
      tags: tags || [],
      lastUpdated: new Date().toISOString().split('T')[0], // YYYY-MM-DD 형식
      comments: []
    });
    
    await newManual.save();
    res.status(201).json(newManual);
  } catch (err) {
    res.status(400).json({ message: '매뉴얼을 생성하는 중 오류가 발생했습니다.', error: err.message });
  }
});

// API 2: 특정 매뉴얼에 새로운 댓글 추가하기
app.post('/api/manuals/:id/comments', async (req, res) => {
  try {
    const { author, content } = req.body;
    
    // URL 파라미터로 받은 id를 가진 매뉴얼 찾기
    const manual = await Manual.findOne({ id: Number(req.params.id) });
    
    if (!manual) {
      return res.status(404).json({ message: '해당 매뉴얼을 찾을 수 없습니다.' });
    }

    // 새 댓글을 배열에 추가
    manual.comments.push({ author, content });
    
    // DB에 변경사항 저장
    await manual.save();
    
    res.status(201).json(manual); // 업데이트된 매뉴얼 정보를 다시 프론트엔드로 전송
  } catch (err) {
    res.status(400).json({ message: '댓글을 저장하는 중 오류가 발생했습니다.', error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
