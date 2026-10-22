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

Supabase's built-in mailer is for testing only: it sends only to pre-authorized team addresses and is limited to about 2 emails/hour. Public customer signups need an external SMTP provider.

Recommended first option: **Brevo SMTP**. Check its current free-plan limits and eligibility before relying on it:
1. Create a Brevo account at [Brevo](https://www.brevo.com/).
2. Add a sender and follow Brevo's verification instructions. For reliable delivery, authenticate a domain you control by publishing the SPF/DKIM DNS records Brevo supplies. The GitHub Pages subdomain itself is not a domain you control for DNS verification; if you do not own a domain, ask Brevo which sender-verification options are available for your account before proceeding.
3. In Brevo, open **Settings → SMTP & API → SMTP**, and create/copy an **SMTP key** (not an API key).
4. In Supabase open **Authentication → Emails → SMTP Settings**, enable custom SMTP and enter:
   - Host: `smtp-relay.brevo.com`
   - Port: `587`
   - Username: your Brevo login email
   - Password: the Brevo SMTP key
   - Sender email: the verified sender shown in Brevo
   - Sender name: `Rannar Menu`
5. Save. Keep email confirmations enabled. Trigger a signup with an email you can access, open the verification link, and confirm that full recipe details become available only after verification.

Do not send SMTP credentials to ChatGPT or store them in GitHub. Enter them only in Supabase's dashboard. If Brevo requires a domain you do not own, pause here rather than using a fake sender; you can use a domain you own or another SMTP provider that permits your sender setup.

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
