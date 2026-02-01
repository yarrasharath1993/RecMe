# Push teluguvibes to new personal GitHub (yarrasharath1993@gmail.com)

Use this to create a new repo under your account **yarrasharath1993@gmail.com** and push all current changes there.

---

## Step 1: Create the new repo on GitHub

**Option A – Browser**

1. Log in to [GitHub](https://github.com) with **yarrasharath1993@gmail.com**.
2. Click **+** → **New repository**.
3. **Repository name:** `teluguvibes`
4. **Visibility:** Private (recommended) or Public.
5. Do **not** add a README, .gitignore, or license (you already have code).
6. Click **Create repository**.
7. Note the repo URL, e.g. `https://github.com/YOUR_USERNAME/teluguvibes` or `git@github.com:YOUR_USERNAME/teluguvibes`.

**Option B – GitHub CLI**

```bash
# Log in with the new account (browser will open)
gh auth login

# Create repo (replace YOUR_USERNAME if needed)
gh repo create teluguvibes --private --source=. --remote=personal --push
```

If you use Option B and then push (as in Step 3), you can skip adding the remote manually; `gh repo create` can set `personal` and push for you.

---

## Step 2: Add the new remote (if you used Option A)

In your project folder (Windows PowerShell or Mac terminal):

```bash
cd "c:\Users\mouni\Projects\teluguvibes"   # Windows
# cd ~/Projects/teluguvibes                 # Mac (adjust path)

# Add remote – replace YOUR_USERNAME with your GitHub username for yarrasharath1993@gmail.com
git remote add personal https://github.com/YOUR_USERNAME/teluguvibes.git

# Or with SSH (if you use SSH keys for that account):
# git remote add personal git@github.com:YOUR_USERNAME/teluguvibes.git
```

---

## Step 3: Stage, commit, and push

Run in the project folder:

```bash
# Stage all changes (modified + untracked)
git add -A

# Commit
git commit -m "chore: sync all changes before moving to Mac"

# Push to the new personal remote (use 'personal' if you added it in Step 2)
git push -u personal main
```

If you used **Option B** (`gh repo create ... --remote=personal --push`), the remote `personal` may already be set and the first push may be done. If not, run:

```bash
git add -A
git commit -m "chore: sync all changes before moving to Mac"
git push -u personal main
```

---

## If you get permission or auth errors

- **HTTPS:** GitHub will ask for username/password. Use a **Personal Access Token** (PAT) instead of password: [GitHub → Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens). Create a token with `repo` scope and paste it when prompted for password.
- **SSH:** Add the SSH key for yarrasharath1993@gmail.com to that GitHub account: [GitHub → Settings → SSH and GPG keys](https://github.com/settings/keys). Then use the `git@github.com:YOUR_USERNAME/teluguvibes.git` remote.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Create repo `teluguvibes` on GitHub logged in as yarrasharath1993@gmail.com |
| 2 | Add remote `personal` → `https://github.com/YOUR_USERNAME/teluguvibes.git` (replace YOUR_USERNAME) |
| 3 | `git add -A` → `git commit -m "chore: sync all changes before moving to Mac"` → `git push -u personal main` |

After this, all current changes will be on the new personal account’s repo. Copy `.env.local` and any secrets separately (they are not in git); use them when you set up the project on your Mac.
