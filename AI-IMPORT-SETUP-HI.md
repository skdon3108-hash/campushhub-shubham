# CampusHub AI import setup

CampusHub's admin panel includes an AI import flow for notices, assignments, events, Lost & Found posts, and timetable rows. It accepts pasted text and PDF, JPG, PNG, WebP, TXT, CSV, and JSON files (up to 5 MB). Extracted data stays a draft until an admin reviews and approves it.

## Configure the AI service

AI parsing uses the OpenAI Responses API from the CampusHub server. You need an OpenAI API key with API billing enabled; a ChatGPT subscription alone does not provide API usage. The model can be changed with `CAMPUSHUB_AI_MODEL`; the default is `gpt-4.1-mini`.

### Run locally

In PowerShell, from the `campushub-app` folder, set the key in the current terminal and then start the server:

```powershell
$env:OPENAI_API_KEY = 'your-api-key'
$env:CAMPUSHUB_AI_MODEL = 'gpt-4.1-mini'
.\Start-CampusHub.bat
```

Do not paste the key into browser code, `app.js`, GitHub, or a committed file. Keep `.env` private if you use one.

### On Render

Open the CampusHub web service's **Environment** settings. Add `OPENAI_API_KEY` as a secret value, optionally set `CAMPUSHUB_AI_MODEL`, save changes, and redeploy. The key is read only by `server.js` and is never sent to student browsers.

## Use it

1. Sign in as Admin and open **Admin**.
2. Click **AI import**, then paste the text or choose a supported document.
3. Click **Extract with AI**. Check names, dates, rooms, times, and the confidence/missing-field notes.
4. Edit the JSON preview if needed, then choose **Approve & import**.

Uploaded files are sent to OpenAI's API for extraction. Do not upload student passwords, private student records, or documents you are not allowed to share. API usage may incur charges. AI extraction can make mistakes; always review before importing.
