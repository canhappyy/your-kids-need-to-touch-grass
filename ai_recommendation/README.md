# AI recommendation service

Private AWS Lambda ranker. Next.js filters valid activities first, then invokes this service. The Lambda has no database credentials or public URL. Models and tag embeddings are baked into the image and loaded offline once per Lambda runtime.

## Local tests

From the repository root:

```bash
PYTHONPATH=. uv run --project ai_recommendation pytest ai_recommendation/tests
```

Build and smoke-test the production image:

```bash
docker build --platform linux/amd64 -t grass-ai-ranker:test ai_recommendation
docker run --rm --platform linux/amd64 \
  --entrypoint /var/lang/bin/python3.12 \
  grass-ai-ranker:test \
  -c 'from ai_recommendation.ranker import load_runtime; load_runtime(); print("models loaded offline")'
```

## Deploy with SST

Use Vercel team-mode OIDC. Supply the exact Vercel team slug and project name. Preview and production deployments are trusted by default.

```bash
cd ai_recommendation
npm ci
VERCEL_TEAM_SLUG=your-team \
VERCEL_PROJECT_NAME=your-project \
VERCEL_ENVIRONMENTS=preview,production \
npx sst deploy --stage production
```

Copy SST outputs into the Vercel project:

```text
AWS_REGION=ap-southeast-2
AWS_ROLE_ARN=<roleArn output>
AI_RANKER_FUNCTION_NAME=<functionName output>
AI_RANKING_ENABLED=false
```

Enable `AI_RANKING_ENABLED=true` in staging first. Local Next.js development can omit `AWS_ROLE_ARN` and use the normal AWS profile credential chain. The active identity still needs `lambda:InvokeFunction` for the deployed function.

## Security

- IAM trust is restricted to the configured Vercel team, project, and environments.
- The role can synchronously invoke only this Lambda.
- The Lambda has no Function URL.
- Logs contain request ID, candidate count, duration, cold-start state, and error class. Free text is never logged.
