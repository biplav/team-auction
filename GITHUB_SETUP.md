# GitHub Repository Setup Guide

This guide will help you push your Cricket Auction Platform to GitHub.

## Option 1: Using GitHub Web Interface (Recommended for Beginners)

### Step 1: Create Repository on GitHub

1. Go to https://github.com and sign in
2. Click the **+** icon in the top right corner
3. Select **New repository**
4. Fill in the details:
   - **Repository name**: `cricket-auction` (or your preferred name)
   - **Description**: Cricket player auction management system with real-time bidding
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README (we already have one)
5. Click **Create repository**

### Step 2: Push Your Code

GitHub will show you commands to push an existing repository. Copy the commands and run them in your terminal:

```bash
# Add the remote repository
git remote add origin https://github.com/YOUR_USERNAME/cricket-auction.git

# Verify the remote was added
git remote -v

# Push your code to GitHub
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

### Step 3: Verify Upload

1. Refresh your GitHub repository page
2. You should see all your files
3. The README.md will be displayed on the main page

## Option 2: Using GitHub CLI

If you have GitHub CLI installed:

```bash
# Login to GitHub (if not already logged in)
gh auth login

# Create repository and push
gh repo create cricket-auction --public --source=. --remote=origin --push
```

## After Pushing to GitHub

### 1. Configure Repository Settings

Go to your repository **Settings**:

#### Secrets (for GitHub Actions)

If using GitHub Actions CI/CD:
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add these secrets:
   - `DATABASE_URL` (production database connection string)
   - `NEXTAUTH_SECRET` (your production secret)
   - `NEXTAUTH_URL` (your production domain)

#### Branch Protection (Optional)

For production repositories:
1. Go to **Settings** → **Branches**
2. Add rule for `main` branch:
   - ☑ Require pull request reviews before merging
   - ☑ Require status checks to pass before merging
   - ☑ Require branches to be up to date before merging

### 2. Add Collaborators (Optional)

1. Go to **Settings** → **Collaborators**
2. Click **Add people**
3. Enter GitHub username or email
4. Choose permission level (Read, Write, or Admin)

### 3. Enable GitHub Actions

1. Go to **Actions** tab
2. If prompted, enable GitHub Actions
3. Your CI/CD pipeline will run automatically on push

### 4. Add Topics (Recommended)

1. Go to repository main page
2. Click the ⚙️ gear icon next to **About**
3. Add topics: `nextjs`, `typescript`, `cricket`, `auction`, `prisma`, `socketio`, `react`
4. This makes your repository more discoverable

## Repository Structure

Your repository includes:

```
cricket-auction/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI/CD pipeline
├── app/                        # Next.js app directory
├── components/                 # React components
├── lib/                        # Utility functions and configurations
├── prisma/                     # Database schema and migrations
├── public/                     # Static assets
├── .dockerignore               # Docker ignore file
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore file
├── DEPLOYMENT.md               # Deployment guide
├── Dockerfile                  # Docker configuration
├── README.md                   # Project documentation
└── package.json                # Dependencies and scripts
```

## Updating Your Repository

### Making Changes

```bash
# Make your changes to files

# Check what changed
git status

# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add new feature description"

# Push to GitHub
git push
```

### Best Practices for Commits

Use conventional commit messages:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```bash
git commit -m "feat: add player filtering by role"
git commit -m "fix: resolve bid validation error"
git commit -m "docs: update deployment guide"
```

## Troubleshooting

### Authentication Issues

If you get authentication errors:

**Using HTTPS:**
```bash
# GitHub now requires Personal Access Tokens
# Generate one at: https://github.com/settings/tokens
# Use the token as your password when prompted
```

**Using SSH (Recommended):**
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Copy public key
cat ~/.ssh/id_ed25519.pub

# Add to GitHub: Settings → SSH and GPG keys → New SSH key
```

Then change remote to SSH:
```bash
git remote set-url origin git@github.com:YOUR_USERNAME/cricket-auction.git
```

### Large File Errors

If you get errors about large files:

```bash
# Check for large files
find . -type f -size +50M

# Add large files to .gitignore
echo "path/to/large/file" >> .gitignore

# Remove from git history if already committed
git rm --cached path/to/large/file
```

### Wrong Remote URL

If you set the wrong remote:

```bash
# Remove existing remote
git remote remove origin

# Add correct remote
git remote add origin https://github.com/CORRECT_USERNAME/cricket-auction.git
```

## Deploying from GitHub

### Vercel

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click **Add New** → **Project**
4. Import your repository
5. Configure environment variables
6. Deploy

### Railway

1. Go to https://railway.app
2. Sign in with GitHub
3. Click **New Project** → **Deploy from GitHub repo**
4. Select your repository
5. Add environment variables
6. Deploy

### Render

1. Go to https://render.com
2. Sign in with GitHub
3. Click **New** → **Web Service**
4. Connect GitHub repository
5. Configure environment
6. Deploy

## Next Steps

After pushing to GitHub:

1. ✅ Repository is backed up and version controlled
2. ✅ Collaborators can contribute
3. ✅ CI/CD pipeline runs automatically
4. ✅ Ready to deploy to production
5. ✅ Can track issues and pull requests

## Additional Resources

- [GitHub Documentation](https://docs.github.com)
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Git Basics](https://git-scm.com/book/en/v2/Getting-Started-Git-Basics)
- [GitHub CLI](https://cli.github.com/)

---

Ready to deploy? Check out [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment options.
