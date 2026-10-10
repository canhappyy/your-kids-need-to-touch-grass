import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";
import { z } from "zod";

import type { RecommendationCandidate } from "@/types/recommendation";

const rankResponseSchema = z.object({
  requestId: z.string().min(1),
  rankedMissionIds: z.array(z.string().min(1)),
});

export function parseRankResponse(
  payload: string,
  expectedRequestId: string,
  allowedMissionIds: Set<string>,
): string[] {
  const parsed = rankResponseSchema.parse(JSON.parse(payload));
  if (parsed.requestId !== expectedRequestId) {
    throw new Error("AI ranker returned a mismatched request ID.");
  }

  const seen = new Set<string>();
  for (const missionId of parsed.rankedMissionIds) {
    if (!allowedMissionIds.has(missionId)) {
      throw new Error("AI ranker returned an unknown mission ID.");
    }
    if (seen.has(missionId)) {
      throw new Error("AI ranker returned a duplicate mission ID.");
    }
    seen.add(missionId);
  }

  if (seen.size !== allowedMissionIds.size) {
    throw new Error("AI ranker omitted one or more mission IDs.");
  }

  return parsed.rankedMissionIds;
}

export async function rankRecommendationCandidates(
  interests: string,
  candidates: RecommendationCandidate[],
): Promise<string[]> {
  if (process.env.AI_RANKING_ENABLED !== "true" || candidates.length === 0) {
    return [];
  }

  const functionName = process.env.AI_RANKER_FUNCTION_NAME;
  const region = process.env.AWS_REGION ?? "ap-southeast-2";
  if (!functionName) throw new Error("AI_RANKER_FUNCTION_NAME is required.");

  const roleArn = process.env.AWS_ROLE_ARN;
  if (process.env.VERCEL && !roleArn) {
    throw new Error("AWS_ROLE_ARN is required on Vercel.");
  }

  const client = new LambdaClient({
    region,
    ...(roleArn
      ? {
          credentials: awsCredentialsProvider({
            roleArn,
            roleSessionName: "vercel-ai-ranking",
          }),
        }
      : {}),
  });
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();

  try {
    const response = await client.send(
      new InvokeCommand({
        FunctionName: functionName,
        InvocationType: "RequestResponse",
        Payload: Buffer.from(
          JSON.stringify({
            requestId,
            freeText: interests,
            candidates: candidates.map((candidate) => ({
              missionId: candidate.missionId,
              title: candidate.title,
              description: candidate.description,
              varietyTags: candidate.varietyTags,
            })),
          }),
        ),
      }),
      { abortSignal: AbortSignal.timeout(20_000) },
    );

    if (response.FunctionError || !response.Payload) {
      throw new Error("AI ranker invocation failed.");
    }

    return parseRankResponse(
      new TextDecoder().decode(response.Payload),
      requestId,
      new Set(candidates.map((candidate) => candidate.missionId)),
    );
  } finally {
    console.info("AI ranking request finished.", {
      candidateCount: candidates.length,
      durationMs: Math.round(performance.now() - startedAt),
      requestId,
    });
    client.destroy();
  }
}
