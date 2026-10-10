/// <reference path="./.sst/platform/config.d.ts" />

/**
 * @file sst.config.ts
 * SST v3 configuration for deploying the AI recommendation ranking microservice to AWS.
 *
 * Deploys:
 * 1. A containerized Python 3.12 AWS Lambda function (`AiRanker`) with 3 GB RAM and baked ONNX models.
 * 2. An IAM OIDC Identity Provider and IAM AssumeRole configuration enabling Vercel preview/production
 *    deployments to invoke the Lambda function securely without persistent AWS credentials.
 */

export default $config({
  app() {
    return {
      home: "aws",
      name: "playgo-ai-recommendation",
      providers: { aws: { region: "ap-southeast-2" } },
    };
  },
  async run() {
    const teamSlug = process.env.VERCEL_TEAM_SLUG;
    const projectName = process.env.VERCEL_PROJECT_NAME;
    if (!teamSlug || !projectName) {
      throw new Error("VERCEL_TEAM_SLUG and VERCEL_PROJECT_NAME are required.");
    }

    const environments = (process.env.VERCEL_ENVIRONMENTS ?? "production,preview")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const issuerHost = `oidc.vercel.com/${teamSlug}`;

    // Deploy containerized Python 3.12 AWS Lambda ranking function
    const ranker = new sst.aws.Function("AiRanker", {
      architecture: "x86_64",
      handler: "handler.handler",
      memory: "3008 MB",
      python: { container: true },
      runtime: "python3.12",
      timeout: "30 seconds",
    });


    // Configure Vercel OpenID Connect (OIDC) identity provider
    const oidcProvider = new aws.iam.OpenIdConnectProvider("VercelOidc", {
      clientIdLists: [`https://vercel.com/${teamSlug}`],
      url: `https://${issuerHost}`,
    });

    // Create IAM Role that Vercel workloads assume via WebIdentity federation
    const invokeRole = new aws.iam.Role("VercelAiInvokeRole", {
      assumeRolePolicy: $jsonStringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { Federated: oidcProvider.arn },
            Action: "sts:AssumeRoleWithWebIdentity",
            Condition: {
              StringEquals: {
                [`${issuerHost}:aud`]: `https://vercel.com/${teamSlug}`,
                [`${issuerHost}:sub`]: environments.map(
                  (environment) =>
                    `owner:${teamSlug}:project:${projectName}:environment:${environment}`,
                ),
              },
            },
          },
        ],
      }),
    });

    // Attach least-privilege IAM policy allowing only lambda:InvokeFunction on the ranker
    new aws.iam.RolePolicy("VercelAiInvokePolicy", {
      role: invokeRole.id,
      policy: $jsonStringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: "lambda:InvokeFunction",
            Resource: ranker.arn,
          },
        ],
      }),
    });

    return {
      functionName: ranker.name,
      region: "ap-southeast-2",
      roleArn: invokeRole.arn,
    };
  },
});

