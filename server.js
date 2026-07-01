require('dotenv').config();
const express = require('express');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors()); 
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/manager_hub';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB 연결 성공!'))
  .catch(err => console.error('❌ MongoDB 연결 에러:', err));

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_memo_app';

// 유저 스키마 정의
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// 댓글 스키마 정의
const commentSchema = new mongoose.Schema({
  author: { type: String, required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // 회원 연동
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
  author: { type: String, default: '손님(Guest)' },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  images: [String],
  lastUpdated: String,
  comments: [commentSchema]
});
const Manual = mongoose.model('Manual', manualSchema);

// =======================
// Auth (인증) API
// =======================

// 회원가입
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, name } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: '이미 존재하는 아이디입니다.' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ username, password: hashedPassword, name });
    await newUser.save();
    
    res.status(201).json({ message: '회원가입이 완료되었습니다.' });
  } catch (err) {
    res.status(500).json({ message: '회원가입 중 오류 발생', error: err.message });
  }
});

// 로그인
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: '아이디 또는 비밀번호가 틀렸습니다.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: '아이디 또는 비밀번호가 틀렸습니다.' });

    const payload = { userId: user._id, username: user.username, name: user.name };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: payload });
  } catch (err) {
    res.status(500).json({ message: '로그인 중 오류 발생', error: err.message });
  }
});

// 내 정보 가져오기
app.post('/api/auth/verify-site', (req, res) => {
  const { password } = req.body;
  if (!process.env.SITE_PASSWORD) {
    return res.status(500).json({ message: '서버에 사이트 비밀번호가 설정되지 않았습니다.' });
  }
  if (password === process.env.SITE_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ message: '비밀번호가 틀렸습니다.' });
  }
});

app.put('/api/auth/profile', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: '새 이름을 입력해주세요.' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    user.name = name;
    await user.save();

    // 작성한 매뉴얼과 댓글의 이름도 업데이트
    await Manual.updateMany(
      { authorId: user._id },
      { $set: { author: name } }
    );
    await Manual.updateMany(
      { 'comments.authorId': user._id },
      { $set: { 'comments.$[elem].author': name } },
      { arrayFilters: [{ 'elem.authorId': user._id }] }
    );

    const token = jwt.sign(
      { userId: user._id, username: user.username, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ message: '프로필이 업데이트되었습니다.', token, user: { username: user.username, name: user.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '프로필 업데이트 중 오류 발생' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (err) {
    res.status(500).json({ message: '정보를 가져올 수 없습니다.' });
  }
});

// =======================
// 매뉴얼 및 댓글 API
// =======================

app.get('/api/manuals', async (req, res) => {
  try {
    const manuals = await Manual.find();
    res.status(200).json(manuals);
  } catch (err) {
    res.status(500).json({ message: '데이터 불러오기 오류', error: err.message });
  }
});

app.get('/api/manuals/:id', async (req, res) => {
  try {
    const manual = await Manual.findOne({ id: Number(req.params.id) });
    if (!manual) return res.status(404).json({ message: '매뉴얼을 찾을 수 없습니다.' });
    res.status(200).json(manual);
  } catch (err) {
    res.status(500).json({ message: '데이터 불러오기 오류', error: err.message });
  }
});

app.post('/api/manuals', authMiddleware, async (req, res) => {
  try {
    const { title, category, content, tags } = req.body;
    const lastManual = await Manual.findOne().sort({ id: -1 });
    const newId = lastManual ? lastManual.id + 1 : 1;
    
    const newManual = new Manual({
      id: newId,
      title,
      category,
      content,
      tags: tags || [],
      author: req.user.name,
      authorId: req.user.userId,
      lastUpdated: new Date().toISOString().split('T')[0],
      comments: []
    });
    
    await newManual.save();
    res.status(201).json(newManual);
  } catch (err) {
    res.status(400).json({ message: '생성 오류', error: err.message });
  }
});

app.put('/api/manuals/:id', authMiddleware, async (req, res) => {
  try {
    const { title, category, content, tags } = req.body;
    const manual = await Manual.findOne({ id: Number(req.params.id) });
    if (!manual) return res.status(404).json({ message: '매뉴얼을 찾을 수 없습니다.' });

    // 작성자만 수정 가능 (혹은 모든 회원이 수정 가능하게 할 수도 있지만, 보안상 작성자만으로 설정)
    if (manual.authorId && manual.authorId.toString() !== req.user.userId) {
      return res.status(403).json({ message: '자신이 작성한 글만 수정할 수 있습니다.' });
    }

    manual.title = title;
    manual.category = category;
    manual.content = content;
    if (tags !== undefined) manual.tags = tags;
    manual.lastUpdated = new Date().toISOString().split('T')[0];

    await manual.save();
    res.status(200).json(manual);
  } catch (err) {
    res.status(400).json({ message: '수정 오류', error: err.message });
  }
});

app.post('/api/manuals/:id/comments', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const manual = await Manual.findOne({ id: Number(req.params.id) });
    if (!manual) return res.status(404).json({ message: '해당 매뉴얼을 찾을 수 없습니다.' });

    manual.comments.push({ 
      author: req.user.name, 
      authorId: req.user.userId,
      content 
    });
    await manual.save();
    res.status(201).json(manual);
  } catch (err) {
    res.status(400).json({ message: '댓글 저장 오류', error: err.message });
  }
});

app.put('/api/manuals/:id/comments/:commentId', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const manual = await Manual.findOne({ id: Number(req.params.id) });
    if (!manual) return res.status(404).json({ message: '매뉴얼을 찾을 수 없습니다.' });

    const comment = manual.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
    
    if (!comment.authorId || comment.authorId.toString() !== req.user.userId) {
      return res.status(403).json({ message: '자신이 작성한 댓글만 수정할 수 있습니다.' });
    }

    comment.content = content;
    await manual.save();
    res.status(200).json(manual);
  } catch (err) {
    res.status(400).json({ message: '댓글 수정 실패', error: err.message });
  }
});

app.delete('/api/manuals/:id/comments/:commentId', authMiddleware, async (req, res) => {
  try {
    const manual = await Manual.findOne({ id: Number(req.params.id) });
    if (!manual) return res.status(404).json({ message: '매뉴얼을 찾을 수 없습니다.' });

    const comment = manual.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
    
    if (!comment.authorId || comment.authorId.toString() !== req.user.userId) {
      return res.status(403).json({ message: '자신이 작성한 댓글만 삭제할 수 있습니다.' });
    }

    manual.comments.pull(req.params.commentId);
    await manual.save();
    res.status(200).json(manual);
  } catch (err) {
    res.status(400).json({ message: '댓글 삭제 실패', error: err.message });
  }
});

app.post('/api/ai/review', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ message: 'GEMINI_API_KEY가 서버에 설정되지 않았습니다. 관리자에게 문의하세요.' });
    }
    
    const { title, category, content } = req.body;
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `
당신은 사내 매뉴얼과 문서를 전문적으로 검토하는 AI 에디터입니다.
작성자가 작성한 매뉴얼의 '내용(Content)' 부분만 중점적으로 읽고 피드백해 주세요.
불필요한 인사말이나 서론 없이, 내용에 대한 핵심적인 조언이나 개선점만 짧고 명확하게 전달해 주세요.

[작성된 내용]:
${content}
`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    res.status(200).json({ feedback: response.text });
  } catch (err) {
    res.status(500).json({ message: 'AI 피드백 생성 중 오류가 발생했습니다.', error: err.message });
  }
});

app.post('/api/ai/revise', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ message: 'GEMINI_API_KEY가 서버에 설정되지 않았습니다. 관리자에게 문의하세요.' });
    }
    
    const { content } = req.body;
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `
당신은 사내 매뉴얼과 문서를 전문적으로 교정하는 AI 에디터입니다.
아래 작성된 매뉴얼 내용을 읽고, 오탈자를 교정하고 문맥을 더 자연스럽고 읽기 쉽게 완전히 다듬어 주세요.
반드시 **교정된 최종 내용만 텍스트로 출력**하고, 어떠한 인사말이나 서론, 결론, 혹은 추가 설명이나 마크다운 코드 블록(예: \`\`\`)을 포함하지 마세요.

[작성된 내용]:
${content}
`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    
    // 응답 텍스트에서 혹시 모를 앞뒤 마크다운(```) 제거나 공백 제거
    let revisedText = response.text.trim();
    if (revisedText.startsWith('```')) {
      revisedText = revisedText.split('\n').slice(1).join('\n');
    }
    if (revisedText.endsWith('```')) {
      revisedText = revisedText.slice(0, -3).trim();
    }
    
    res.status(200).json({ revisedContent: revisedText });
  } catch (err) {
    res.status(500).json({ message: 'AI 교정 중 오류가 발생했습니다.', error: err.message });
  }
});

app.post('/api/ai/search', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ message: 'GEMINI_API_KEY가 설정되지 않았습니다.' });
    }
    const { query } = req.body;
    if (!query) return res.status(400).json({ message: '검색어를 입력해주세요.' });

    // Fetch all manuals (excluding huge images for performance)
    const manuals = await Manual.find({}, 'id title category tags content');
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `
당신은 똑똑한 사내 매뉴얼 검색 도우미 AI입니다.
아래는 현재 시스템에 등록된 모든 매뉴얼들의 정보(JSON)입니다.
${JSON.stringify(manuals)}

사용자의 질문: "${query}"

위 질문을 읽고, 질문에 가장 부합하고 도움이 될 만한 매뉴얼을 최대 3개까지만 골라주세요.
만약 관련된 매뉴얼이 없다면 추천하지 않아도 됩니다.

반드시 아래 JSON 형식으로만 답변을 반환하세요. 마크다운이나 다른 텍스트는 포함하지 마세요.
{
  "recommendations": [
    { "id": 매뉴얼id숫자, "reason": "이 매뉴얼을 추천하는 이유 (친절한 말투로 1~2문장)" }
  ],
  "message": "사용자에게 보여줄 친절한 검색 결과 요약 인사말 (예: 원하시는 프린터 관련 매뉴얼을 2개 찾았습니다!)"
}
`;
    const response = await ai.models.generateContent({ 
      model: 'gemini-2.5-flash', 
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    
    const jsonText = response.text;
    res.status(200).json(JSON.parse(jsonText));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'AI 검색 중 오류가 발생했습니다.', error: err.message });
  }
});

app.use(express.static(path.join(__dirname, 'frontend/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
