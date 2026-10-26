export default {
  async fetch(request, env) {
    const assetResponse = await env.ASSETS.fetch(request);
    const response = new Response(assetResponse.body, assetResponse);
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  },
};
