# 🆓 Deploy to Render (FREE!)

## Why Render?
- **✅ Completely FREE** for your use case
- **✅ 750 hours/month** (always-on app)
- **✅ Free PostgreSQL** database
- **✅ Auto-deploys** from GitHub
- **✅ Custom domains** supported
- **✅ No credit card** required to start

## 🚀 Deploy in 3 Steps

### 1. Go to Render
- Visit [render.com](https://render.com)
- Sign up with your GitHub account (free)

### 2. Create New Web Service  
- Click **"New +"** → **"Web Service"**
- Connect your GitHub: `prite-study-tool-v2`
- Render auto-detects everything from `render.yaml`!

### 3. Set Environment Variables
In the Render dashboard, add:
```bash
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret-here
CLAUDE_API_KEY=your-claude-api-key-here
```

**That's it!** Render will:
- ✅ Create PostgreSQL database automatically
- ✅ Install dependencies  
- ✅ Build your app
- ✅ Run database migrations
- ✅ Deploy and give you a live URL!

## 🎯 After Deployment

Your app will be live at: `https://your-app-name.onrender.com`

**First steps:**
1. Create your admin account
2. Upload some PRITE questions to seed the community
3. Share with your residency program
4. Watch the magic happen! ✨

## 💡 Render Free Tier Limits
- **750 hours/month** web service (plenty for always-on)
- **100GB bandwidth/month**  
- **Free PostgreSQL** with 1GB storage
- **Sleeps after 15min** of inactivity (spins up in ~30 seconds)

Perfect for launching your community platform! 🎉

## 🚀 Ready to Change the Game?

This deployment will give hundreds of psychiatry residents access to collaborative PRITE prep. You're about to launch something incredible! 

**Repository**: https://github.com/moonlitpsych/prite-study-tool-v2
**Deploy**: render.com → New Web Service → Connect GitHub → Deploy! 🎯