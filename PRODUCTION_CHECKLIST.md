# Production Deployment Checklist

Use this checklist before deploying the Applicant Tracking System to production.

---

## Security Configuration

### Backend (.env)

- [ ] Set `APP_DEBUG=false`
- [ ] Set `APP_ENV=production`
- [ ] Generate new `APP_KEY` using `php artisan key:generate`
- [ ] Configure production database credentials
- [ ] Set strong database password
- [ ] Configure Gmail App Password (not regular password)
- [ ] Set `SESSION_SECURE_COOKIE=true` if using HTTPS
- [ ] Review and restrict CORS origins in `config/cors.php`

### Frontend (.env)

- [ ] Set `VITE_API_BASE_URL` to production API URL
- [ ] Remove any development-only configuration

---

## Database

- [ ] Run all migrations: `php artisan migrate --force`
- [ ] Create production database user with limited permissions
- [ ] Back up database before deployment
- [ ] Seed initial admin user (not demo accounts)

---

## SSL/HTTPS

- [ ] Obtain SSL certificate (Let's Encrypt or commercial)
- [ ] Configure web server (Nginx/Apache) for HTTPS
- [ ] Set up HTTP to HTTPS redirect
- [ ] Update `APP_URL` to use `https://`
- [ ] Update `FRONTEND_URL` to use `https://`

---

## File Storage

- [ ] Ensure `storage/` directory is writable by web server
- [ ] Verify `storage:link` is created: `php artisan storage:link`
- [ ] Configure backup strategy for uploaded CVs
- [ ] Consider cloud storage (S3, GCS) for scalability

---

## Performance

- [ ] Enable production caching: `php artisan config:cache`
- [ ] Enable route caching: `php artisan route:cache`
- [ ] Enable event caching: `php artisan event:cache`
- [ ] Build frontend for production: `npm run build`
- [ ] Enable OPcache for PHP
- [ ] Configure database query logging to false
- [ ] Optimize image assets (compress logos, icons)

---

## Monitoring & Logging

- [ ] Configure production log channel (single/errorlog)
- [ ] Set up log rotation
- [ ] Configure error monitoring (Sentry, Bugsnag, etc.)
- [ ] Set up uptime monitoring
- [ ] Configure database backup schedule

---

## Email Configuration

- [ ] Use Gmail App Password (not account password)
- [ ] Test email delivery
- [ ] Configure rate limiting to avoid SMTP limits
- [ ] Set up email templates for production

---

## Access Control

- [ ] Change all demo account passwords
- [ ] Create individual user accounts (no shared accounts)
- [ ] Review role assignments
- [ ] Audit permission settings

---

## Final Verification

- [ ] Test complete applicant submission flow
- [ ] Test admin login and authentication
- [ ] Test CV upload and download
- [ ] Test email notifications
- [ ] Test all CRUD operations
- [ ] Verify analytics charts load correctly
- [ ] Test on mobile devices
- [ ] Run security scan (OWASP ZAP, etc.)

---

## Post-Deployment

- [ ] Monitor error logs for 24 hours
- [ ] Verify backup jobs are running
- [ ] Check email delivery rates
- [ ] Document any issues and resolutions
- [ ] Update team on deployment status

---

## Rollback Plan

If deployment fails:

1. Revert to previous code version
2. Restore database from backup
3. Revert `.env` configuration
4. Document what went wrong

**Backup Location:** ___________________
**Last Known Good Version:** ___________________
**Rollback Contact:** ___________________

---

## Notes

- Never commit `.env` files to version control
- Use environment variable management in production
- Keep Laravel and dependencies updated
- Regular security audits recommended
