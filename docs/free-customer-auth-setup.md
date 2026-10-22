# Rannar Menu — Free customer account setup

This guide completes the provider setup that cannot safely be automated without account-owner credentials. The React app already contains email/password signup, verification checks, Google OAuth initiation, phone OTP UI, persistent Supabase sessions, and profile editing. Do not put provider secrets in this repository or in any `VITE_*` variable.

## 1. Confirm the app URLs

- GitHub Pages site: `https://rannarmenu.github.io/Rannarmenu/`
- Google OAuth JavaScript origin: `https://rannarmenu.github.io`
- Supabase project: `https://supabase.com/dashboard/project/fiwqeivmieckzqglfrar`
- Google OAuth callback URI: `https://fiwqeivmieckzqglfrar.supabase.co/auth/v1/callback`

In Supabase, open **Authentication → URL Configuration**:
1. Set **Site URL** to `https://rannarmenu.github.io/Rannarmenu/`.
2. Add `https://rannarmenu.github.io/Rannarmenu/` to Redirect URLs. If you later add a custom domain, add that exact URL too.
3. Save.

## 2. Enable Google sign-in (no Google API fee for basic OAuth)

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create/select a project, then open **Google Auth Platform** and configure the app name, support email, audience and contact email.
3. In **Clients**, create an OAuth client ID with application type **Web application**.
4. Add Authorized JavaScript origin: `https://rannarmenu.github.io`.
5. Add Authorized redirect URI: `https://fiwqeivmieckzqglfrar.supabase.co/auth/v1/callback`.
6. Create the client and copy its **Client ID** and **Client secret**.
7. Open Supabase **Authentication → Sign In / Providers → Google**, enable Google, paste the Client ID and Client secret, and save.
8. Test using a Google account. If the Google consent screen is in **Testing** mode, add each tester under **Audience / Test users**. Before public launch, review Google's publishing/verification requirements.

Keep the client secret private. Enter it only in the Google and Supabase dashboards; never commit it to GitHub, a frontend environment variable, or chat.

## 3. Set up email verification with free SMTP

Supabase's built-in mailer is for testing only: it sends only to pre-authorized team addresses and is limited to about 2 emails/hour. Public customer signups need a custom SMTP provider.

### Option A — use an existing Gmail account for early testing (no custom domain)

This can be a no-extra-cost temporary route for a small test, but it is not my recommendation for a high-volume production service. Google may throttle or reject automated messages, and a personal Gmail sender looks less professional.

1. Use a dedicated Gmail account for Rannar Menu rather than your personal primary account, if possible.
2. Turn on 2-Step Verification for that Google account.
3. Create an **App Password** in Google Account security settings. This option appears only for eligible accounts with 2-Step Verification enabled. Never use your normal Google password.
4. In Supabase open **Authentication → Emails → SMTP Settings**, enable custom SMTP, and enter:
   - Host: `smtp.gmail.com`
   - Port: `587` (TLS/STARTTLS)
   - Username: the full Gmail address
   - Password: the Gmail App Password
   - Sender email: the same Gmail address
   - Sender name: `Rannar Menu`
5. Save and test signup verification and password reset. Do not assume it is production-ready until delivery is tested.

Google documents Gmail SMTP on `smtp.gmail.com` with port 587 or 465 and an app password for accounts with 2-Step Verification. Sending limits and abuse filters still apply: [Google's SMTP instructions](https://knowledge.workspace.google.com/admin/gmail/send-email-from-a-printer-scanner-or-app).

### Option B — Brevo for a more production-oriented sender

Brevo's free plan currently lists 300 emails/day, but transactional SMTP setup requires a domain you own/control and authenticate. Since this project currently only has a GitHub Pages URL, **do not attempt Brevo sender authentication using the GitHub Pages hostname or a Gmail address**. If you later own a domain, you can use Brevo:
1. Create a Brevo account at [Brevo](https://www.brevo.com/).
2. Add your owned domain and follow Brevo's DNS authentication steps for the domain.
3. Open **Settings → SMTP & API → SMTP** and create/copy an SMTP key.
4. In Supabase **Authentication → Emails → SMTP Settings**, enable custom SMTP and enter:
   - Host: `smtp-relay.brevo.com`
   - Port: `587`
   - Username: the SMTP login displayed in Brevo
   - Password: the Brevo SMTP key (not an API key)
   - Sender email: your authenticated sender
   - Sender name: `Rannar Menu`
5. Save, then test signup verification and password reset.

Keep SMTP credentials private. Enter them only in Supabase's dashboard. Do not send secrets to ChatGPT or store them in GitHub. Keep email confirmations enabled.


## 4. Phone OTP (optional; not guaranteed free)

The UI supports Bangladesh phone numbers, but SMS delivery requires an SMS provider configured in Supabase. SMS is commonly chargeable and is not included in this free-first plan. Leave it unavailable until you intentionally choose a provider and review its price.

## 5. Verification checklist

- [ ] A new email/password signup receives an email verification link.
- [ ] Unverified users cannot read full recipe details.
- [ ] Verified email users can log in again after closing and reopening the browser.
- [ ] Google sign-in completes and the resulting account is recognized as verified.
- [ ] Password reset email arrives and the reset link works.
- [ ] An unverified account cannot read full recipe data through the database API.
- [ ] Profile edits and avatar uploads work for the signed-in user only.

Current application auth/session behavior uses Supabase's persistent session setting. Do not disable email confirmation just to bypass SMTP configuration.
