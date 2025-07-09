# Setting Up Upstream Update Notifications

**Author:** Abhilash Chadhar (FutureAtoms)
**Last Updated:** January 2025

This guide explains how to configure notifications for when upstream MCP repositories have updates.

## Available Notification Channels

1. **GitHub Issues** (Default)
   - Automatically created when updates are detected
   - No additional configuration required
   - Tagged with `upstream-update` label

2. **Slack Notifications**
   - Real-time notifications to your Slack workspace
   - Requires Slack webhook URL

3. **Discord Notifications**
   - Real-time notifications to your Discord server
   - Requires Discord webhook URL

4. **Email Notifications**
   - Email alerts when updates are detected
   - Requires SMTP configuration

## Configuration

### 1. GitHub Issues (Default)

No configuration needed. Issues are automatically created with:
- Title: "🔄 Upstream MCP Updates Available"
- Label: `upstream-update`, `enhancement`
- Details about which repositories have updates

### 2. Slack Notifications

1. Create a Slack webhook:
   - Go to your Slack workspace settings
   - Navigate to "Apps" → "Custom Integrations" → "Incoming Webhooks"
   - Create a new webhook and copy the URL

2. Add the webhook to GitHub secrets:
   - Go to your repository settings
   - Navigate to "Secrets and variables" → "Actions"
   - Add a new secret named `SLACK_WEBHOOK_URL`
   - Paste your Slack webhook URL

### 3. Discord Notifications

1. Create a Discord webhook:
   - Go to your Discord server settings
   - Navigate to "Integrations" → "Webhooks"
   - Create a new webhook and copy the URL

2. Add the webhook to GitHub secrets:
   - Add a new secret named `DISCORD_WEBHOOK_URL`
   - Paste your Discord webhook URL

### 4. Email Notifications

1. Configure SMTP settings in GitHub secrets:
   - `EMAIL_NOTIFICATION`: Set to `true` to enable
   - `EMAIL_USERNAME`: Your SMTP username
   - `EMAIL_PASSWORD`: Your SMTP password
   - `EMAIL_TO`: Recipient email address

For Gmail:
- Enable 2-factor authentication
- Generate an app-specific password
- Use the app password as `EMAIL_PASSWORD`

## Testing Notifications

To test your notification setup:

1. Manually trigger the check workflow:
   ```bash
   gh workflow run check-upstream-updates.yml
   ```

2. Or push a change to `.github/upstream-versions.json`

## Customizing Check Frequency

The default schedule runs daily at 2:00 AM UTC. To change:

1. Edit `.github/workflows/check-upstream-updates.yml`
2. Modify the cron expression:
   ```yaml
   schedule:
     - cron: '0 2 * * *'  # Daily at 2 AM UTC
   ```

Common schedules:
- Every 6 hours: `'0 */6 * * *'`
- Weekly: `'0 2 * * 0'`
- Twice daily: `'0 2,14 * * *'`

## Disabling Notifications

To disable specific channels, simply don't set their respective secrets in GitHub.

To disable all notifications:
1. Delete or disable the `notify-upstream-changes.yml` workflow
2. Keep only the issue creation in the main workflow
