Deno.serve((request: Request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  // Keep legacy background callers compatible without sending staff activity email.
  return Response.json({ ok: true, disabled: true, modes: [], claimed: 0, sent: 0, errors: [] });
});
