import assert from "node:assert/strict";
import test from "node:test";
import worker from "./static-worker.mjs";

test("staging HTML is noindex even when the asset says index", async () => {
  const request = new Request("https://brand-staging.omdala.com/en/");
  const response = await worker.fetch(request, {
    ASSETS: {
      fetch(receivedRequest) {
        assert.equal(receivedRequest, request);
        return new Response("<html></html>", {
          headers: {
            "Content-Type": "text/html",
            "Content-Security-Policy": "default-src 'self'",
            "X-Robots-Tag": "index, follow",
          },
        });
      },
    },
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), "text/html");
  assert.equal(response.headers.get("Content-Security-Policy"), "default-src 'self'");
  assert.equal(response.headers.get("X-Robots-Tag"), "noindex, nofollow");
  assert.equal(await response.text(), "<html></html>");
});

test("staging redirects and missing assets retain status with noindex", async () => {
  for (const status of [302, 404]) {
    const response = await worker.fetch(
      new Request("https://staging.omdala.com/missing"),
      {
        ASSETS: {
          fetch() {
            return new Response(null, {
              status,
              headers: { Location: "/en/", "Cache-Control": "max-age=60" },
            });
          },
        },
      },
    );

    assert.equal(response.status, status);
    assert.equal(response.headers.get("Location"), "/en/");
    assert.equal(response.headers.get("Cache-Control"), "max-age=60");
    assert.equal(response.headers.get("X-Robots-Tag"), "noindex, nofollow");
  }
});
