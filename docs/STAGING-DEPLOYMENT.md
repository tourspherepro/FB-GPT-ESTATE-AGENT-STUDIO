# EstateAgent.Studio — staging deployment

Status: prepared locally; **not deployed**. Never use the old imported Firebase project by accident.

## Requirements

- VPS dedicated to design/testing, with Ubuntu 24.04, Docker Engine + Compose, Git and an Nginx reverse proxy.
- Access to GitHub repository: `tourspherepro/FB-GPT-ESTATE-AGENT-STUDIO`.
- A Firebase web app (Auth, Firestore, Storage) and the required web configuration values.
- **Important:** Firebase browser SDK configuration is compiled into the Next.js client. Values must be supplied at **image build time** (the Compose file does this).
- Gemini API key stored only as server environment variable `GEMINI_API_KEY`. The old `GOOGLE_GENAI_API_KEY` example was inconsistent with source code and has been corrected.
- Service account variables `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` are needed only for Outlook Voice. Avoid supplying them until that feature is enabled.
- Firebase Security Rules must be reviewed and applied to the **chosen staging Firebase project** first. CI emulator tests passed; nothing has been deployed yet. Existing private storage download tokens may need rotating.

## Deploy after gaining VPS access

Choose the actual testing VPS, **not the domains/production VPS**. SSH connectivity to `ansaos-vps` was tested from Windows but returned `Permission denied (publickey)`; do not assume this alias is the target until verified.

```bash
sudo mkdir -p /srv/design/estateagent-studio
sudo chown "$USER":"$USER" /srv/design/estateagent-studio
git clone --branch deploy/staging-readiness https://github.com/tourspherepro/FB-GPT-ESTATE-AGENT-STUDIO.git /srv/design/estateagent-studio
cd /srv/design/estateagent-studio
cp .env.example .env.local
chmod 600 .env.local
```

Fill `.env.local` using Firebase Console > Project settings > Your apps > Web app. Do not send service credentials through chat, email or GitHub. If using the ANSAOS Authentication Firebase project, **verify that Firestore and Storage are intended to be shared**; otherwise use a separate staging project.

```bash
docker compose --env-file .env.local -f compose.staging.yml config --quiet
docker compose --env-file .env.local -f compose.staging.yml up -d --build
docker compose --env-file .env.local -f compose.staging.yml ps
curl -i http://127.0.0.1:3002/api/health
```

The health endpoint returns HTTP 503 with `setup_required` when Firebase web configuration is missing. HTTP 200 only confirms configuration presence, not live Firebase or Gemini connectivity.

Use Nginx to proxy an **internal testing subdomain** to `http://127.0.0.1:3002`. Obtain an SSL certificate and restrict access during testing. Do not open port 3002 on the firewall. Do not expose the application publicly until login, permissions and storage isolation have been verified.

## Validation

1. `npm ci`, `npm run typecheck`, `npm run build`; GitHub Actions provides these checks.
2. `npm run test:rules` with Java 21 for Firebase security rules.
3. Verify Firebase sign-up, login, logout, password reset and profile creation with staging test accounts.
4. Verify one estate agency cannot access another agency's documents or original images.
5. Upload property images and retrieve them using an authorised account; test anonymous denial.
6. Test property creation, saving and listing; check Gemini generation separately.
7. Review placeholder modules (EA 360 panorama, calendar bookings, Outlook integration) before advertising them as functional.

## Updating

```bash
cd /srv/design/estateagent-studio
git pull --ff-only
docker compose --env-file .env.local -f compose.staging.yml up -d --build
```

The default branch `main` remains unchanged until the repair branches have been reviewed and merged.

## Local verification blockers

- Windows Docker Desktop daemon not running: Docker image not built locally.
- Local Firebase CLI not logged in: project settings unavailable.
- No `.env.local` file: authenticated features cannot yet be tested.
- Testing VPS SSH key rejected: deployment not performed.
