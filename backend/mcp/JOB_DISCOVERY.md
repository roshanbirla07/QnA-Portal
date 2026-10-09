# Scheduled AI job discovery

This runner uses the OpenAI Responses API with web search plus the QnA Portal remote MCP server.

## Prerequisites

1. Merge and deploy the QnA MCP PR first.
2. Serve QnA through HTTPS. The remote MCP URL should be public and TLS-protected, for example `https://qna.example.com/mcp`.
3. Configure the backend MCP API key and service user.
4. Create `/etc/qna-portal/job-agent.env` from `deploy/systemd/qna-job-agent.env.example` and protect it with `chmod 600`.

## Manual test

```bash
cd ~/QnA-Portal
sudo cp deploy/systemd/qna-job-agent.env.example /etc/qna-portal/job-agent.env
sudo nano /etc/qna-portal/job-agent.env
sudo chmod 600 /etc/qna-portal/job-agent.env

set -a
source /etc/qna-portal/job-agent.env
set +a
node backend/scripts/discover-jobs-agent.js
```

The model performs web discovery, then uses the MCP tools to deduplicate, verify, classify, publish/update, and close jobs.

## systemd deployment

```bash
sudo cp deploy/systemd/qna-job-agent.service /etc/systemd/system/
sudo cp deploy/systemd/qna-job-agent.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now qna-job-agent.timer
systemctl list-timers qna-job-agent.timer
```

Run immediately:

```bash
sudo systemctl start qna-job-agent.service
sudo journalctl -u qna-job-agent.service -n 200 --no-pager
```

The timer runs at 00:15, 04:15, 08:15, 12:15, 16:15, and 20:15 in the EC2 host timezone, with up to five minutes of randomized delay.

## Safety/quality rules

- The AI agent is not given arbitrary database access.
- All writes go through the constrained QnA MCP tools.
- Existing source URL uniqueness still protects against duplicate listings.
- The agent should prefer official career pages and should not invent metadata.
- Closing is non-destructive: records remain in MongoDB with `status=closed`.
- Keep the maximum jobs per run conservative until source quality is measured.
