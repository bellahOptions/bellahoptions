# cPanel Auto Deployment (GitHub Actions)

This project is configured to auto-deploy from `main` to cPanel using:

- `.github/workflows/deploy-cpanel.yml`
- `scripts/deploy/cpanel-post-deploy.sh`

## 1) cPanel Prerequisites

1. Create your Laravel app directory on cPanel (example: `/home/<cpanel_user>/apps/bellahoptions`).
2. Point your domain/subdomain document root to that app's `public` folder.
3. Ensure a production `.env` already exists on the server.
4. Ensure `storage` and `bootstrap/cache` are writable by the web server.
5. Enable SSH in cPanel if you want auto migrations/cache commands after file upload.

## 2) GitHub Repository Secrets

In GitHub: `Settings -> Secrets and variables -> Actions -> New repository secret`

Required:

- `CPANEL_FTP_HOST` (example: `ftp.yourdomain.com`)
- `CPANEL_FTP_USERNAME`
- `CPANEL_FTP_PASSWORD`
- `CPANEL_DEPLOY_PATH` (absolute path where `artisan` lives)

Optional (recommended):

- `CPANEL_FTP_PROTOCOL` (`ftps`, `ftp`, or `ftps-legacy`; default is `ftps`)
- `CPANEL_FTP_PORT` (default `21`)
- `CPANEL_FTP_TIMEOUT` (milliseconds, default `120000`)
- `CPANEL_PUBLIC_HTML_PATH` (default `/public_html`; set your absolute cPanel path if needed)

Optional SSH post-deploy:

- `CPANEL_SSH_HOST`
- `CPANEL_SSH_USER`
- `CPANEL_SSH_KEY` (private key contents for the SSH user)
- `CPANEL_SSH_PORT` (default `22`)

When SSH secrets are set, the workflow also runs:

- `bash scripts/deploy/cpanel-post-deploy.sh`

on the server after files upload.

## 3) What Gets Deployed

The workflow:

1. Installs production PHP dependencies in CI (`composer install --no-dev ...`)
2. Builds frontend assets (`npm ci && npm run build`)
3. Uploads project files to cPanel via FTP/FTPS
4. Copies `public/build` to `/public_html/build` after successful deploy
5. Optionally runs post-deploy Laravel tasks over SSH

Excluded from upload:

- `.env*` files
- `.git*`, `.github`, tests, editor configs
- transient storage/runtime cache and logs
- `node_modules`

## 4) First Deployment Checklist

1. Commit and push these deployment files to `main`.
2. Add all required GitHub secrets.
3. Trigger workflow manually from the Actions tab (`Deploy to cPanel`) or push to `main`.
4. Confirm site loads and `.env` values are correct in cPanel.

## 5) Notes

- If your host does not allow SSH, deployment still works by FTP upload only.
- If your host has no Composer on server, CI upload already includes `vendor`.
- Keep server-only secrets in `.env` on cPanel, not in Git.
