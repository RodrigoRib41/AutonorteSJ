"use client";

import { getSupabaseClient } from "@/lib/supabaseClient";

type FunctionCallOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: BodyInit | Record<string, unknown> | unknown[] | null;
  headers?: HeadersInit;
  path?: string;
};

function buildFunctionUrl(functionName: string, path?: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  const normalizedPath = path?.trim().replace(/^\/+/, "");
  return `${supabaseUrl}/functions/v1/${functionName}${
    normalizedPath ? `/${normalizedPath}` : ""
  }`;
}

export async function callSupabaseFunction<T>(
  functionName: string,
  options: FunctionCallOptions = {}
) {
  const supabase = getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(options.headers);
  headers.set(
    "apikey",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? ""
  );

  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  const body =
    options.body instanceof FormData ||
    options.body instanceof URLSearchParams ||
    options.body instanceof Blob ||
    options.body instanceof ArrayBuffer ||
    typeof options.body === "string"
      ? options.body
      : options.body == null
        ? null
        : JSON.stringify(options.body);

  if (
    body &&
    typeof body === "string" &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(buildFunctionUrl(functionName, options.path), {
    method: options.method ?? "POST",
    headers,
    body,
  });

  const result = (await response.json().catch(() => null)) as T | null;

  return {
    ok: response.ok,
    status: response.status,
    data: result,
  };
}
