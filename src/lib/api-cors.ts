import { NextResponse } from "next/server";

function configuredOrigins() {
  return (process.env.ALLOWED_CORS_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function corsHeaders(request?: Request) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };

  const origin = request?.headers.get("origin");
  const allowedOrigins = configuredOrigins();
  if (origin && allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers.Vary = "Origin";
  } else if (!origin && allowedOrigins.length === 1) {
    headers["Access-Control-Allow-Origin"] = allowedOrigins[0];
  } else if (process.env.NODE_ENV !== "production") {
    headers["Access-Control-Allow-Origin"] = "*";
  }

  return headers;
}

export function jsonWithCors<T>(data: T, init?: ResponseInit, request?: Request) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...corsHeaders(request),
      ...(init?.headers ?? {}),
    },
  });
}

export function optionsWithCors(request?: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}
