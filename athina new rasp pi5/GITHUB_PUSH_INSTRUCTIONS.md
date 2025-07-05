# Push Athina to GitHub

## Step 1: Create a New Repository on GitHub

1. Go to https://github.com/new
2. Repository name: `athina-voice-assistant`
3. Description: "Offline voice assistant for Raspberry Pi 5 optimized for luxury vehicles"
4. Choose: Public
5. DO NOT initialize with README, .gitignore, or license
6. Click "Create repository"

## Step 2: Push Your Local Repository

After creating the empty repository on GitHub, run these commands:

```bash
# Navigate to your project directory
cd /Users/etch/Downloads/athina\ new\ rasp\ pi5

# Add the remote repository (replace YOUR_GITHUB_USERNAME with your actual username)
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/athina-voice-assistant.git

# Push to GitHub
git push -u origin main
```

## Alternative: Using SSH (if you have SSH keys set up)

```bash
# Add remote with SSH
git remote add origin git@github.com:YOUR_GITHUB_USERNAME/athina-voice-assistant.git

# Push to GitHub
git push -u origin main
```

## Step 3: Verify

After pushing, your repository will be available at:
`https://github.com/YOUR_GITHUB_USERNAME/athina-voice-assistant`

## Additional Steps (Optional)

### Add Topics/Tags on GitHub:
- raspberry-pi
- voice-assistant
- offline-ai
- speech-recognition
- text-to-speech
- automotive
- privacy-first

### Create Releases:
After pushing, you can create a release:
1. Go to "Releases" → "Create a new release"
2. Tag version: `v1.0.0`
3. Release title: "Athina v1.0.0 - Initial Release"
4. Describe the features
5. Attach any binary files if needed

### Set Up GitHub Actions (Optional):
Create `.github/workflows/python-app.yml` for CI/CD:

```yaml
name: Python application

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    - name: Set up Python 3.9
      uses: actions/setup-python@v3
      with:
        python-version: "3.9"
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install flake8 pytest
        if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
    - name: Lint with flake8
      run: |
        flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
        flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics
    - name: Test with pytest
      run: |
        pytest
```