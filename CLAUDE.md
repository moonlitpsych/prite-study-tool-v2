# PRITE Study Tool - Development Roadmap

## Project Vision
A collaborative PRITE exam preparation platform focused on three core experiences:
1. **Easy Question Upload** - Streamlined digitization of physical PRITE booklets
2. **Smart Study System** - Spaced repetition with weakness-focused studying
3. **AI-Powered Explanations** - UWorld-style explanations for comprehensive learning

## Current Status ✅
- [x] User authentication (registration/login)
- [x] Basic UI/UX framework
- [x] Database schema with User model
- [x] TRPC API setup
- [x] Deployment pipeline (Render + PostgreSQL)

## Phase 1: Question Management System 🎯

### Question Upload Solutions (Priority Order)
1. **Web-based OCR Solution** (Recommended)
   - Client-side OCR using Tesseract.js or similar
   - Drag & drop interface for photos/scans
   - Real-time preview and editing
   - Batch processing capability
   - Cross-platform compatibility

2. **AI-Powered Document Processing**
   - Integration with Claude/GPT Vision API
   - Upload photos → AI extracts and formats questions
   - Higher accuracy than traditional OCR
   - Automatic answer choice detection

3. **Progressive Web App (PWA) Camera Integration**
   - Native camera access through web browser
   - Real-time OCR processing
   - Works on all modern smartphones
   - Offline capability for processing

### Question Data Model Enhancement
```typescript
interface Question {
  // Core content
  text: string
  options: { label: string, text: string }[]
  correctAnswers: string[]
  explanation?: string
  
  // Categorization & Tagging
  category: string // "Adult Psychiatry", "Child Psychiatry", etc.
  subcategory?: string
  examPart: "Part 1" | "Part 2"
  difficulty: "easy" | "medium" | "hard"
  topics: string[] // ["Depression", "DSM-5", "Pharmacology"]
  
  // PRITE-specific metadata
  examYear?: number
  questionNumber?: number
  
  // Performance tracking
  averageScore?: number
  timesAnswered: number
  weaknessIndicator: boolean // Flagged as commonly missed
}
```

## Phase 2: Intelligent Study System 📚

### Spaced Repetition Algorithm
- Implement SM-2 or Anki-style algorithm
- Track user performance per question
- Adaptive scheduling based on confidence/accuracy

### Weakness-Focused Study Mode
- Analytics dashboard showing performance by category
- "Study Weaknesses" mode that surfaces low-performing areas
- Customizable study sessions by category/topic combinations

### Study Session Features
- Timer and performance tracking
- Confidence ratings (low/medium/high)
- Immediate feedback with explanations
- Progress visualization

## Phase 3: AI-Powered Explanations 🤖

### UWorld-Style Explanation Generation
- **Correct Answer Explanation**: 2-3 comprehensive paragraphs
- **Incorrect Options**: 1-2 sentences per wrong choice
- Context about PRITE exam patterns and common pitfalls

### AI Integration Architecture
- Claude API integration for explanation generation
- Caching system for generated explanations
- Manual review/editing capability for accuracy

### Content Quality System
- Community rating/feedback on explanations
- Expert review workflow
- Continuous improvement through user feedback

## Technical Architecture Priorities

### Database Enhancements Needed
- [ ] Expand Question model with tagging/categorization
- [ ] Study session tracking tables
- [ ] Performance analytics schema
- [ ] Explanation storage and versioning

### API Development
- [ ] Question upload endpoints
- [ ] OCR processing pipeline
- [ ] Study session management
- [ ] Analytics and progress tracking
- [ ] AI explanation generation

### Frontend Components
- [ ] Question upload interface (camera/file upload)
- [ ] Study session UI with timer and feedback
- [ ] Performance dashboard and analytics
- [ ] Question bank browser with filtering
- [ ] Explanation viewer with AI-generated content

## Question Upload Implementation Strategy

### Recommended Approach: Hybrid OCR + AI
1. **Client-side preprocessing** with Tesseract.js
2. **AI post-processing** with Claude Vision API for accuracy
3. **Interactive editing** interface for corrections
4. **Batch processing** for efficiency

### User Flow
1. User uploads photo(s) of PRITE booklet pages
2. Client-side OCR extracts raw text
3. AI processes and formats into structured questions
4. User reviews and edits before saving
5. Questions automatically tagged and categorized
6. Added to personal/community question bank

## Success Metrics
- **Upload Efficiency**: Time from photo to usable question
- **Study Effectiveness**: Improvement in category performance
- **User Engagement**: Session frequency and duration
- **Content Quality**: Community ratings on explanations

## Next Immediate Steps
1. Implement question upload UI with OCR capability
2. Enhance Question model with categorization
3. Build basic study session interface
4. Integrate AI for explanation generation

---

*This roadmap serves as the source of truth for all development work on the PRITE Study Tool. Update as priorities and requirements evolve.*