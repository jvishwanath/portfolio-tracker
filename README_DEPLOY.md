# Deployment Instructions for Google Cloud Run

## Prerequisites
1.  Google Cloud SDK (`gcloud`) installed and authenticated.
2.  A Google Cloud Project created.
3.  `GEMINI_API_KEY` ready.

## Steps

### 1. Set your Project ID
Replace `YOUR_PROJECT_ID` with your actual Google Cloud Project ID.
```bash
export PROJECT_ID=YOUR_PROJECT_ID
gcloud config set project $PROJECT_ID
```

### 2. Enable Services
Enable Cloud Build and Cloud Run APIs if not already enabled.
```bash
gcloud services enable cloudbuild.googleapis.com run.googleapis.com
```

### 3. Build the Docker Image
This submits the build to Cloud Build.
```bash
gcloud builds submit --tag gcr.io/$PROJECT_ID/portfolio-tracker
```

### 4. Deploy to Cloud Run
Deploy the image. Replace `YOUR_GEMINI_API_KEY` with your actual key.
```bash
gcloud run deploy portfolio-tracker \
  --image gcr.io/$PROJECT_ID/portfolio-tracker \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --set-env-vars GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

**Note on Free Tier:**
-   We set `--memory 512Mi` and `--cpu 1` to stay within low resource usage.
-   Cloud Run has a generous free tier (2 million requests/month, 360,000 GB-seconds memory, 180,000 vCPU-seconds).
-   The Docker image uses `python:slim` and multi-stage builds to keep storage costs low.

## Local Testing (Optional)
To test the Docker image locally before deploying:
```bash
docker build -t portfolio-tracker .
docker run -p 8080:8080 -e GEMINI_API_KEY=your_key_here portfolio-tracker
```
Visit `http://localhost:8080`.
