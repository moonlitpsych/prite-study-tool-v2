# PRITE Study Tool v2 🎯

> Modern collaborative PRITE exam preparation platform for psychiatry residents

A complete rewrite of the PRITE Study Tool with modern technologies, enhanced community features, and a focus on collaborative learning.

## ✨ Features

### 🧠 **Smart Study System**
- **Enhanced Spaced Repetition**: Advanced SM-2 algorithm with confidence scoring
- **Adaptive Learning**: Questions adjust based on your performance
- **Study Sessions**: Track progress with detailed analytics
- **Due Questions**: Smart scheduling based on review intervals

### 🤝 **Community-Driven**
- **Question Sharing**: Community database of PRITE questions
- **Peer Review**: Vote and rate question quality
- **Leaderboards**: Contribution and reputation scoring  
- **Real-time Activity**: See what the community is studying

### 📊 **Advanced Analytics**
- **PRITE Score Tracking**: Monitor your exam progress over time
- **Performance Insights**: Category-wise performance analysis
- **Study Streaks**: Build consistent study habits
- **Comparative Scoring**: See how you compare to peers

### 🔬 **Modern Architecture**
- **Type-Safe API**: End-to-end type safety with tRPC
- **Real-time Updates**: Modern data fetching with TanStack Query
- **Responsive Design**: Beautiful UI with Tailwind CSS and Shadcn/ui
- **Production Ready**: Built for scale with PostgreSQL and Railway

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (or use Railway's built-in database)

### Installation

1. **Clone and install**:
   ```bash
   git clone <your-repo>
   cd prite-v2
   npm install
   ```

2. **Environment setup**:
   ```bash
   cp .env.example .env
   # Edit .env with your database URL and JWT secret
   ```

3. **Database setup**:
   ```bash
   npm run db:push      # Push schema to database
   npm run db:generate  # Generate Prisma client
   ```

4. **Start development**:
   ```bash
   npm run dev  # Starts both client and server
   ```

Visit `http://localhost:5173` to see your app!

## 🏗 Architecture

### Tech Stack
- **Frontend**: React 19 + Vite + TypeScript
- **Backend**: Node.js + tRPC + Prisma
- **Database**: PostgreSQL
- **UI**: Tailwind CSS + Shadcn/ui + Lucide Icons
- **State**: Zustand + TanStack Query
- **Deployment**: Railway (full-stack)

### Project Structure
```
prite-v2/
├── src/                    # Frontend React app
│   ├── components/         # UI components
│   │   ├── ui/            # Base UI components
│   │   ├── auth/          # Authentication components
│   │   └── study/         # Study-specific components
│   ├── pages/             # Page components
│   ├── store/             # Zustand stores
│   └── lib/               # Utilities and config
├── server/                # Backend tRPC server
│   ├── routers/           # API route handlers
│   ├── lib/               # Server utilities
│   └── middleware/        # Auth and other middleware
└── prisma/                # Database schema and migrations
```

## 📊 Database Schema

The app uses a modern PostgreSQL schema designed for collaboration:

- **Users**: Profile, PGY level, reputation system
- **Questions**: Community question bank with voting/reviews
- **StudyRecords**: Individual spaced repetition data
- **PriteScores**: Historical PRITE exam tracking
- **Community Features**: Votes, reviews, reports

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start both client and server
npm run dev:client       # Frontend only
npm run dev:server       # Backend only

# Database  
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes
npm run db:studio        # Open Prisma Studio
npm run db:migrate       # Create migration

# Production
npm run build            # Build for production
npm start                # Start production server

# Code Quality
npm run lint             # ESLint
npm run type-check       # TypeScript check
```

## 🚢 Deployment

### Railway (Recommended)

1. **Create Railway account** at [railway.app](https://railway.app)

2. **Connect repository**:
   - Link your GitHub repository
   - Railway will auto-detect the configuration

3. **Add environment variables**:
   ```bash
   NODE_ENV=production
   JWT_SECRET=your-production-secret
   # DATABASE_URL is automatically provided by Railway
   ```

4. **Deploy**:
   - Push to main branch
   - Railway builds and deploys automatically
   - Get your live URL!

### Manual Deployment

For other platforms, use these build commands:
```bash
npm run build     # Builds both client and server
npm start         # Starts production server
```

## 🎯 Community Features

### Question Contribution
- Add questions with multiple choice options
- Mark as public to share with community
- Earn contribution points and reputation

### Peer Review
- Vote on question quality (upvote/downvote)
- Rate questions 1-5 stars
- Report inappropriate content
- Review accuracy and clarity

### Leaderboards
- **Contributors**: Top question contributors
- **Reputation**: Highest community ratings
- **Study Leaders**: Most active studiers

## 📈 Analytics & Tracking

### Personal Analytics
- Daily/weekly/monthly study statistics
- Category performance breakdowns
- Study streak tracking
- Accuracy trends over time

### PRITE Score Management
- Record multiple PRITE exam scores
- Track percentile improvements
- Category-wise score analysis
- Progress visualization

## 🤝 Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Use the existing UI component patterns
- Maintain end-to-end type safety with tRPC
- Write descriptive commit messages

## 📄 License

MIT License - see LICENSE file for details.

## 🎓 For Residents, By Residents

This tool is built by and for psychiatry residents. Our mission is to create the best collaborative study platform for PRITE exam preparation.

**Study together. Succeed together.** 🎯

---

*Built with ❤️ for the psychiatry resident community*