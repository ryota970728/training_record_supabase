export const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // 全てのオリジンを許可
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", // 許可するヘッダー
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS", // 許可するメソッド
  "Access-Control-Allow-Credentials": "true", // クッキーなどの認証情報を許可
};
/**
 * 成功時のレスポンスを構築
 */
export function buildResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * エラー時のレスポンスを構築
 */
export function buildErrorResponse(error: any) {
  console.error("Error details:", error);
  const message = error instanceof Error ? error.message : "Internal Server Error";
  return buildResponse({ error: message }, 500);
}