export function mapOpenAIError(error) {
  const status = error?.status || error?.statusCode;
  const code = error?.code || error?.error?.code;
  const type = error?.type || error?.error?.type;
  const providerMessage =
    error?.error?.message ||
    error?.message ||
    "Failed to generate summary. Please try again.";

  if (status === 401 || status === 403) {
    return {
      status: 502,
      code: "openai_auth",
      error: "OpenAI authentication failed. Check the API key.",
    };
  }

  if (status === 429 && (code === "insufficient_quota" || type === "insufficient_quota")) {
    return {
      status: 402,
      code: "insufficient_quota",
      error:
        "OpenAI quota is exhausted. This is a billing limit, not a request rate limit. Add credits at https://platform.openai.com/account/billing and try again.",
    };
  }

  if (status === 429) {
    return {
      status: 429,
      code: code || "rate_limit_exceeded",
      error: "OpenAI is temporarily rate limited. Wait a moment and try again.",
    };
  }

  if (status === 404) {
    return {
      status: 502,
      code: "model_not_found",
      error: "The configured OpenAI model is not available for this API key.",
    };
  }

  return {
    status: 500,
    code: code || "openai_error",
    error: providerMessage,
  };
}
