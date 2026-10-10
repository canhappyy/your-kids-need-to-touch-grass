/// <reference path="./.sst/platform/config.d.ts" />

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

    const ranker = new sst.aws.Function("AiRanker", {
      architecture: "x86_64",
      handler: "handler.handler",
      memory: "3 GB",
      python: { container: true },
      runtime: "python3.12",
      timeout: "30 seconds",
    });

    const oidcProvider = new aws.iam.OpenIdConnectProvider("VercelOidc", {
      clientIdLists: [`https://vercel.com/${teamSlug}`],
      url: `https://${issuerHost}`,
    });

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
