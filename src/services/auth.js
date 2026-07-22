const API_BASE = "";

export async function requestLoginOtp(identifier) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      identifier,
      purpose: "LOGIN",
    }),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON body */
  }

  if (!res.ok) {
    const message =
      data?.message ??
      data?.error ??
      (typeof data === "string" ? data : null) ??
      `Request failed (${res.status})`;
    throw new Error(message);
  }
}
