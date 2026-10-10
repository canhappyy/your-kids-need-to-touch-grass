/**
 * @file ai-ranking.service.ts
 * Service module responsible for delegating semantic ranking of recommendation candidates
 * to the containerized AWS Lambda AI ranking service.
 *
 * It uses AWS IAM OIDC federation (via Vercel OIDC AWS credentials provider) to securely
 * invoke the Lambda function without long-lived static credentials, sends the child's free-text
 * interests alongside candidate activity metadata, and validates the returned ranked IDs.
 */

import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";
import { z } from "zod";

import type { RecommendationCandidate } from "@/types/recommendation";

/**
 * Zod schema for validating the structured JSON payload returned by the AI ranking Lambda function.
 */
const rankResponseSchema = z.object({
  /** Unique request identifier matching the client-generated UUID for trace correlation. */
  requestId: z.string().min(1),
  /** Ordered list of mission IDs ranked from most relevant to least relevant. */
  rankedMissionIds: z.array(z.string().min(1)),
});

/**
 * Parses and strictly validates the raw JSON response payload from the AI ranking Lambda function.
 *
 * Enforces data integrity guarantees:
 * 1. The returned payload conforms to {@link rankResponseSchema}.
 * 2. The returned `requestId` matches the expected `requestId` sent in the invocation.
 * 3. Every returned mission ID exists within the set of allowed candidate IDs sent.
 * 4. No duplicate mission IDs exist in the ranking.
 * 5. All candidate mission IDs are preserved (no missions omitted).
 *
 * @param payload - Raw JSON string decoded from the Lambda response payload buffer.
 * @param expectedRequestId - The client-generated request UUID sent in the invocation.
 * @param allowedMissionIds - Set of valid candidate mission IDs sent to the ranker.
 * @returns The validated array of mission IDs in ranked order.
 * @throws {Error} If payload is malformed, request ID mismatches, or candidate IDs are unknown/duplicate/missing.
 */
export function parseRankResponse(
  payload: string,
  expectedRequestId: string,
  allowedMissionIds: Set<string>,
): string[] {
  // Parse and schema-validate the raw JSON string
  const parsed = rankResponseSchema.parse(JSON.parse(payload));

  // Guard against stale or mismatched responses
  if (parsed.requestId !== expectedRequestId) {
    throw new Error("AI ranker returned a mismatched request ID.");
  }

  // Verify that all returned mission IDs belong to the candidate set and contain no duplicates
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

  // Ensure completeness: the ranker must return every candidate mission ID
  if (seen.size !== allowedMissionIds.size) {
    throw new Error("AI ranker omitted one or more mission IDs.");
  }

  return parsed.rankedMissionIds;
}

/**
 * Semantically ranks recommendation candidate activities against user-specified free-text interests.
 *
 * Workflow:
 * 1. Checks feature flag `AI_RANKING_ENABLED` and candidate availability (skips ranking if disabled or empty).
 * 2. Configures the AWS Lambda client using the Vercel OIDC role assumption (`AWS_ROLE_ARN`) if running on Vercel,
 *    or default AWS credentials for local development.
 * 3. Constructs a structured JSON payload containing the user's free-text interests and candidate metadata
 *    (missionId, title, description, varietyTags).
 * 4. Invokes the AWS Lambda ranking function synchronously with a 20-second abort timeout.
 * 5. Parses and validates the response, returning candidate mission IDs sorted by relevance.
 *
 * @param interests - Free-text description of child interests or activity desires (e.g. "likes dinosaurs and outdoor climbing").
 * @param candidates - List of candidate activities matching preliminary hard constraints (age, duration, location).
 * @returns A promise resolving to an array of ranked mission IDs, or an empty array if AI ranking is disabled.
 * @throws {Error} If required environment variables are missing or Lambda invocation fails.
 */
export async function rankRecommendationCandidates(
  interests: string,
  candidates: RecommendationCandidate[],
): Promise<string[]> {
  // Short-circuit if AI ranking is disabled by configuration or there are no candidates to rank
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

  // Instantiate Lambda client with Vercel OIDC credential federation or local AWS profile chain
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
    // Send invocation request to the AWS Lambda ranker with a 20-second timeout
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

    // Verify successful execution without function runtime error
    if (response.FunctionError || !response.Payload) {
      throw new Error("AI ranker invocation failed.");
    }

    // Decode and validate the ranking payload
    return parseRankResponse(
      new TextDecoder().decode(response.Payload),
      requestId,
      new Set(candidates.map((candidate) => candidate.missionId)),
    );
  } finally {
    // Log latency and candidate metrics for operational monitoring
    console.info("AI ranking request finished.", {
      candidateCount: candidates.length,
      durationMs: Math.round(performance.now() - startedAt),
      requestId,
    });
    // Clean up client connection pool resources
    client.destroy();
  }
}
