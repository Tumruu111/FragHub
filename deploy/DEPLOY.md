# Veritas Parfums — AWS Deployment Guide

Architecture:
- **API** → AWS Lightsail (Ubuntu) + Caddy (auto-SSL) + pm2
- **Frontend** → S3 + CloudFront
- **Database** → Neon (already hosted)
- **Images** → Cloudflare R2 (already hosted)

Replace `veritasparfums.com` everywhere with your actual domain.

---

## Part 1 — API on Lightsail

### 1. Create the instance
1. AWS Console → Lightsail → Create instance
2. Region: closest to your users (e.g. Singapore `ap-southeast-1` — same as Neon)
3. Ubuntu 22.04 LTS, $5/mo plan (1 GB RAM)
4. Create. Then **Networking tab → Create static IP** and attach it.
5. Networking tab → Firewall → add rule: **HTTPS (443)**. Keep SSH (22) and HTTP (80).

### 2. Install runtime (SSH in via the browser terminal or `ssh ubuntu@<static-ip>`)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update && sudo apt-get install -y caddy

sudo npm install -g pm2
```

### 3. Get the code and build
```bash
cd ~
git clone https://github.com/<your-username>/FragHub.git
cd FragHub
npm install
cd apps/api
npx prisma generate          # generates the LINUX query engine — must run on the server
cd ../..
npx nx build @org/api --configuration=production
```

### 4. Create the production .env
```bash
nano ~/FragHub/apps/api/.env
```
Paste (with real values — never commit this file):
```env
NODE_ENV=production
PORT=3333
DATABASE_URL="<your NEW Neon connection string>"
JWT_SECRET="<the value from your local .env>"
ADMIN_SECRET_KEY="<the value from your local .env>"
ALLOWED_ORIGIN=https://veritasparfums.com

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=parfumsveritas@gmail.com
SMTP_PASS=<gmail app password>
SMTP_FROM="Veritas Parfums <parfumsveritas@gmail.com>"

QPAY_USERNAME=<real merchant username>
QPAY_PASSWORD=<real merchant password>
QPAY_INVOICE_CODE=<real invoice code>
QPAY_CALLBACK_URL=https://api.veritasparfums.com/api/payments/callback

# R2 / S3
AWS_REGION=auto
AWS_ENDPOINT=<r2 endpoint>
AWS_ACCESS_KEY_ID=<r2 key>
AWS_SECRET_ACCESS_KEY=<r2 secret>
AWS_BUCKET=<bucket>
AWS_FILE_UPLOAD_TYPE=public
```

### 5. Apply migrations & start
```bash
cd ~/FragHub/apps/api
npx prisma migrate deploy    # deploy, NOT dev — applies existing migrations only

cd ~/FragHub
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup                  # run the command it prints — starts pm2 on reboot
```

### 6. Caddy (SSL reverse proxy)
```bash
sudo cp ~/FragHub/deploy/Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

### 7. DNS
At your DNS provider add: **A record** `api` → `<Lightsail static IP>`.
Wait a few minutes, then verify: `https://api.veritasparfums.com/api/graphql`
(Caddy fetches the certificate automatically on first request after DNS resolves.)

---

## Part 2 — Frontend on S3 + CloudFront

### 1. Build with production URLs
On your PC (`.env.production` already points at `api.veritasparfums.com`):
```powershell
cd apps/frontend
npm run build       # output in dist/
```

### 2. S3 bucket
1. Console → S3 → Create bucket, name e.g. `veritasparfums-frontend`, keep "Block all public access" ON (CloudFront will access it, not the public)
2. Upload the **contents** of `apps/frontend/dist/` (index.html + assets/)

### 3. Certificate (must be region us-east-1)
1. Console → Certificate Manager, **region N. Virginia (us-east-1)**
2. Request certificate for `veritasparfums.com` and `www.veritasparfums.com`
3. DNS validation → add the CNAME records it shows at your DNS provider → wait for "Issued"

### 4. CloudFront distribution
1. Console → CloudFront → Create distribution
2. Origin: your S3 bucket → **Origin access: Origin access control (OAC)** → create control setting → after creating, copy the bucket policy it offers into the S3 bucket permissions
3. Viewer protocol policy: Redirect HTTP to HTTPS
4. Alternate domain names (CNAMEs): `veritasparfums.com`, `www.veritasparfums.com`; select the ACM certificate
5. Default root object: `index.html`
6. **Error pages** (needed for React Router): create two custom error responses —
   - 403 → response page `/index.html`, HTTP code 200
   - 404 → response page `/index.html`, HTTP code 200

### 5. DNS
- `veritasparfums.com` → CloudFront domain (`dxxxx.cloudfront.net`). Use an ALIAS/ANAME record, or a CNAME for `www` + redirect for root, depending on your DNS provider (Cloudflare: CNAME works on root via flattening).

---

## Part 3 — Register the QPay callback

When you get merchant credentials from QPay, tell them / configure:
```
https://api.veritasparfums.com/api/payments/callback
```

---

## Updating the site later

**API** (on the server):
```bash
cd ~/FragHub && git pull && npm install
cd apps/api && npx prisma generate && npx prisma migrate deploy && cd ../..
npx nx build @org/api --configuration=production
pm2 restart veritas-api
```

**Frontend** (on your PC):
```powershell
cd apps/frontend; npm run build
# upload dist/ to S3 (replace files), then CloudFront → Invalidations → create "/*"
```
