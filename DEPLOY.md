# 🚀 PRITE Study Tool v2 - Deployment Guide

## Quick Deploy to Railway

### 1. Create Railway Account
- Go to [railway.app](https://railway.app)  
- Sign up with GitHub

### 2. Connect Repository
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose your repository
- Railway auto-detects our configuration!

### 3. Environment Variables
Add these in Railway dashboard:

**Required:**
```bash
NODE_ENV=production
JWT_SECRET=your-super-secure-production-jwt-secret-here
```

**Optional (for AI features):**
```bash
CLAUDE_API_KEY=your-claude-api-key-here
```

**Auto-provided by Railway:**
```bash
DATABASE_URL=postgresql://...  # Railway provides this automatically
```

### 4. Deploy! 🎉
- Push to main branch
- Railway builds and deploys automatically
- Get your live URL!

## Database Setup

After deployment:
1. Railway creates PostgreSQL database automatically
2. Run database migration:
   ```bash
   railway run npm run db:push
   ```
3. Your community-ready schema is live!

## Custom Domain (Optional)

1. Go to Railway project settings
2. Add custom domain
3. Point your DNS to Railway
4. SSL automatically handled

## 🎯 What You Get

- **Full-stack app** deployed in one command
- **PostgreSQL database** with all community features
- **Automatic SSL** and custom domains
- **Environment management** through Railway dashboard
- **Auto-scaling** as your community grows

## 🔧 Post-Deployment

1. **Test the upload system** with a sample PRITE question
2. **Create your first user account**
3. **Upload some questions** to seed the community
4. **Share with residents** and watch it grow!

---

**You're about to launch something incredible for the psychiatry resident community! 🎉**