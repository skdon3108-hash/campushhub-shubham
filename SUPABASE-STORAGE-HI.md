# CampusHub ka data permanently save karna

Render Free service `data.json` ko temporary filesystem mein rakhti hai. Restart, sleep ya deploy par us file ka data mit sakta hai. Is setup se CampusHub ka poora state Supabase Postgres table mein save hoga. Database unavailable ya configuration galat ho to app startup rokegi, taaki chupchaap temporary storage par chal kar data lose na kare.

## Supabase table banana

Supabase project ke SQL Editor mein ye query ek baar run karein:

```sql
create table if not exists public.campushub_state (
  id integer primary key check (id = 1),
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.campushub_state enable row level security;
```

Is table par koi public policy na banayein. CampusHub server hi secret service key ke zariye is table ko padhega/likhega.

## Render par secrets set karna

Render Web Service → **Environment** mein ye do variables add karein:

- `SUPABASE_URL`: Supabase Project Settings → API mein diya project URL.
- `SUPABASE_SECRET_KEY`: Project Settings → API Keys mein server-side Secret key (`sb_secret_...`). Isko app code, GitHub, ya chat mein na daalein. Purani `service_role` key bhi supported hai.

Save karne par Render redeploy karega. Startup log mein `with persistent database` dikhna chahiye. Iske baad roster aur campus updates Postgres mein persist honge. Agar pehli baar startup par legacy `data.json` available ho, app usse Supabase mein copy karegi.

## Free plan ki had

Supabase Free project ek hafte kam activity par pause ho sakta hai. Pause hone par data turant delete nahi hota; project ko dashboard se resume kiya ja sakta hai, lekin restore ki window 1 saal hai. Zyada bharosemand continuous service ke liye paid database plan aur backups chahiye.

## Zaroori migration note

Current Render Free filesystem par pehle se jama roster deploy/restart ke baad pehle hi mit chuka ho sakta hai. Agar woh data abhi active service mein maujood hai, Supabase configure karne aur code deploy karne se pehle uska backup/migration verify karna hoga. App ka current data Supabase ko bhejne se pehle project owner ki approval zaroori hai.
