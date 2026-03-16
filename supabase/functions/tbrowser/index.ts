Deno.serve(async (req) => {
  const url = req.headers.get("x-target-url") || new URL(req.url).searchParams.get("url");
  
  if (!url) {
    return new Response(JSON.stringify({ error: "No URL provided" }), { status: 400 });
  }

  const targetUrl = url.startsWith("http") ? url : `https://${url}`;

  try {
    const headers = new Headers();
    req.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "host" && key.toLowerCase() !== "x-target-url") {
        headers.set(key, value);
      }
    });
    headers.set("User-Agent", "TalcumOS-Browser/1.0");

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? await req.arrayBuffer() : undefined,
      redirect: "manual"
    });

    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      if (["content-type", "content-length", "cache-control", "etag"].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
