/**
 * One-time Google OAuth setup for Calendar + Meet (personal Gmail).
 *
 * BEFORE running:
 * 1. Google Cloud Console → APIs & Services → Credentials
 * 2. Create OAuth client ID → Web application
 * 3. Add redirect URI: http://localhost:8765/oauth2callback
 * 4. Put GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env
 *
 * Run: npm run google:auth
 */
require("dotenv").config();
const http = require("http");
const { exec } = require("child_process");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const PORT = 8765;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const SCOPES = ["https://www.googleapis.com/auth/calendar"];

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

const openBrowser = (url) => {
  const cmd =
    process.platform === "win32"
      ? `start "" "${url}"`
      : process.platform === "darwin"
        ? `open "${url}"`
        : `xdg-open "${url}"`;
  exec(cmd, () => {});
};

const printSetupHelp = () => {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║  MediLink — Google Calendar + Meet OAuth setup                   ║
╚══════════════════════════════════════════════════════════════════╝

You need GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env first.

── Step A: Google Cloud Console (one time) ──
  1. Open: https://console.cloud.google.com/apis/credentials
  2. Select project: medilink-500208 (or your project)
  3. If "OAuth consent screen" is not configured:
     - APIs & Services → OAuth consent screen
     - User type: External → Create
     - App name: MediLink, your email as support + developer
     - Scopes: add .../auth/calendar
     - Test users: add sundarlingam272000@gmail.com
  4. Credentials → Create credentials → OAuth client ID
     - Application type: Web application
     - Name: MediLink Local
     - Authorized redirect URIs → ADD:
         ${REDIRECT_URI}
     - Create → copy Client ID and Client secret

── Step B: Add to .env ──
  GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
  GOOGLE_CLIENT_SECRET=GOCSPX-...
  GOOGLE_OAUTH_REDIRECT_URI=${REDIRECT_URI}

── Step C: Run again ──
  npm run google:auth

`);
};

if (!clientId || !clientSecret) {
  printSetupHelp();
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  process.env.GOOGLE_OAUTH_REDIRECT_URI || REDIRECT_URI
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: SCOPES,
});

console.log("\n🔐 Opening Google sign-in in your browser...\n");
console.log("Sign in as: sundarlingam272000@gmail.com (or your calendar owner Gmail)");
console.log("Click Allow for Calendar access.\n");
console.log("If the browser does not open, paste this URL:\n");
console.log(authUrl);
console.log("\nWaiting for authorization on port", PORT, "...\n");

const server = http.createServer(async (req, res) => {
  if (!req.url?.startsWith("/oauth2callback")) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    res.writeHead(400, { "Content-Type": "text/html" });
    res.end(`<h2>Authorization failed: ${error}</h2><p>You can close this tab.</p>`);
    server.close();
    process.exit(1);
  }

  if (!code) {
    res.writeHead(400, { "Content-Type": "text/html" });
    res.end("<h2>Missing authorization code</h2>");
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(
      "<h2>✅ MediLink authorized!</h2><p>You can close this tab and return to the terminal.</p>"
    );

    console.log("✅ Authorization successful!\n");
    console.log("── Add these lines to your .env file ──\n");
    console.log(`GOOGLE_CLIENT_ID=${clientId}`);
    console.log(`GOOGLE_CLIENT_SECRET=${clientSecret}`);
    console.log(`GOOGLE_OAUTH_REDIRECT_URI=${REDIRECT_URI}`);

    if (tokens.refresh_token) {
      console.log(`GOOGLE_CALENDAR_REFRESH_TOKEN=${tokens.refresh_token}`);
    } else {
      console.log(
        "⚠️  No refresh_token returned. Revoke app access at"
      );
      console.log(
        "   https://myaccount.google.com/permissions then run npm run google:auth again."
      );
    }

    console.log("\n── Then restart backend ──");
    console.log("   npm run dev\n");

    const envPath = path.join(__dirname, "..", ".env");
    if (tokens.refresh_token && fs.existsSync(envPath)) {
      let env = fs.readFileSync(envPath, "utf8");
      const setLine = (key, value) => {
        const line = `${key}=${value}`;
        const re = new RegExp(`^${key}=.*$`, "m");
        env = re.test(env) ? env.replace(re, line) : `${env.trimEnd()}\n${line}\n`;
      };
      setLine("GOOGLE_CLIENT_ID", clientId);
      setLine("GOOGLE_CLIENT_SECRET", clientSecret);
      setLine("GOOGLE_OAUTH_REDIRECT_URI", REDIRECT_URI);
      setLine("GOOGLE_CALENDAR_REFRESH_TOKEN", tokens.refresh_token);
      fs.writeFileSync(envPath, env);
      console.log("✅ .env updated automatically with OAuth tokens.\n");
    }

    server.close();
    process.exit(0);
  } catch (err) {
    console.error("Token exchange failed:", err.message);
    res.writeHead(500, { "Content-Type": "text/html" });
    res.end(`<h2>Error: ${err.message}</h2>`);
    server.close();
    process.exit(1);
  }
});

server.listen(PORT, () => {
  openBrowser(authUrl);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is in use. Close that app and try again.`);
  } else {
    console.error(err.message);
  }
  process.exit(1);
});
