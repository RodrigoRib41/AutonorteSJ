import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

function readEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  const content = readFileSync(filePath, "utf8");
  const values = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function getEnv(name, env) {
  const value = env[name]?.trim();

  if (!value) {
    throw new Error(`Missing ${name}.`);
  }

  return value;
}

function normalizeAdminUsername(value) {
  return value.trim().toLowerCase();
}

function toSessionDbUrl(databaseUrl) {
  const url = new URL(databaseUrl);

  if (url.port === "6543") {
    url.port = "5432";
  }

  url.searchParams.delete("pgbouncer");

  if (!url.searchParams.has("sslmode")) {
    url.searchParams.set("sslmode", "require");
  }

  return url.toString();
}

function toSqlLiteral(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

async function verifyLogin({ supabaseUrl, anonKey, email, password, username }) {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Supabase Auth rejected the bootstrap admin for @${username}. Response: ${body}`
    );
  }

  const result = await response.json();

  if (!result?.access_token) {
    throw new Error(`Bootstrap verification failed for @${username}.`);
  }
}

async function signUpAdmin({
  supabaseUrl,
  anonKey,
  email,
  password,
  username,
  name,
}) {
  const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      data: {
        name,
        username,
      },
    }),
  });

  const body = await response.text();

  if (!response.ok) {
    throw new Error(
      `Supabase Auth signup failed for @${username}. Response: ${body}`
    );
  }
}

function bootstrapAuthUserViaSql({
  rootDir,
  sessionDbUrl,
  username,
  name,
  email,
  password,
}) {
  const sql = `
do $$
declare
  target_instance_id uuid := '00000000-0000-0000-0000-000000000000';
  target_username text := ${toSqlLiteral(username)};
  target_name text := ${toSqlLiteral(name)};
  target_email text := ${toSqlLiteral(email)};
  target_password text := ${toSqlLiteral(password)};
  target_auth_user_id uuid := gen_random_uuid();
begin
  insert into auth.instances (id, uuid, raw_base_config, created_at, updated_at)
  values (
    target_instance_id,
    target_instance_id,
    '{}'::text,
    now(),
    now()
  )
  on conflict (id) do nothing;

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    is_super_admin,
    is_sso_user,
    is_anonymous
  )
  values (
    target_instance_id,
    target_auth_user_id,
    'authenticated',
    'authenticated',
    target_email,
    crypt(target_password, gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    jsonb_build_object('name', target_name, 'username', target_username),
    now(),
    now(),
    false,
    false,
    false
  );

  insert into auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values (
    target_auth_user_id::text,
    target_auth_user_id,
    jsonb_build_object(
      'sub', target_auth_user_id::text,
      'email', target_email,
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    null,
    now(),
    now()
  );
end
$$;
`;

  runSql({
    rootDir,
    sessionDbUrl,
    sql,
  });
}

function runSql({ rootDir, sessionDbUrl, sql }) {
  const tempSqlPath = resolve(rootDir, "scripts", ".bootstrap-supabase-admin.sql");
  writeFileSync(tempSqlPath, sql, "utf8");

  const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
  const queryResult = spawnSync(
    npxCommand,
    [
      "supabase",
      "db",
      "query",
      "--db-url",
      sessionDbUrl,
      "--agent=no",
      "--output",
      "table",
      "-f",
      tempSqlPath,
    ],
    {
      stdio: "pipe",
      cwd: rootDir,
      env: process.env,
      encoding: "utf8",
      shell: process.platform === "win32",
    }
  );

  unlinkSync(tempSqlPath);

  if (queryResult.status !== 0) {
    const details = [
      queryResult.stdout?.trim(),
      queryResult.stderr?.trim(),
      queryResult.error instanceof Error ? queryResult.error.message : "",
    ]
      .filter(Boolean)
      .join("\n");

    throw new Error(
      details
        ? `Could not bootstrap the Supabase admin user.\n${details}`
        : "Could not bootstrap the Supabase admin user."
    );
  }

  if (queryResult.stdout?.trim()) {
    console.log(queryResult.stdout.trim());
  }

  if (queryResult.stderr?.trim()) {
    console.error(queryResult.stderr.trim());
  }
}

async function main() {
  const rootDir = process.cwd();
  const envFromFile = readEnvFile(resolve(rootDir, ".env"));
  const env = {
    ...envFromFile,
    ...process.env,
  };

  const databaseUrl = getEnv("DATABASE_URL", env);
  const username = normalizeAdminUsername(getEnv("AUTH_ADMIN_USER", env));
  const password = getEnv("AUTH_ADMIN_PASSWORD", env);
  const name = env.AUTH_ADMIN_NAME?.trim() || "Superadmin";
  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL", env);
  const anonKey = getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", env);
  const adminAuthEmailDomain =
    env.AUTH_ADMIN_EMAIL_DOMAIN?.trim() ||
    env.NEXT_PUBLIC_ADMIN_AUTH_EMAIL_DOMAIN?.trim() ||
    "autonortesj-admin.com";

  if (!username || /\s/.test(username)) {
    throw new Error("AUTH_ADMIN_USER must be a valid username without spaces.");
  }

  const email = `${username}@${adminAuthEmailDomain}`;
  const legacyEmail = `${username}@admin.autonorte.local`;
  const sessionDbUrl = toSessionDbUrl(databaseUrl);

  try {
    await verifyLogin({
      supabaseUrl,
      anonKey,
      email,
      password,
      username,
    });
  } catch {
    const cleanupSql = `
do $$
declare
  target_username text := ${toSqlLiteral(username)};
  target_email text := ${toSqlLiteral(email)};
  legacy_email text := ${toSqlLiteral(legacyEmail)};
begin
  update public.admin_users
  set
    auth_user_id = null,
    updated_at = now()
  where username = target_username
     or email = target_email
     or email = legacy_email;

  delete from auth.identities
  where user_id in (
    select id
    from auth.users
    where email in (target_email, legacy_email)
  );

  delete from auth.users
  where email in (target_email, legacy_email);
end
$$;
`;

    runSql({
      rootDir,
      sessionDbUrl,
      sql: cleanupSql,
    });

    try {
      await signUpAdmin({
        supabaseUrl,
        anonKey,
        email,
        password,
        username,
        name,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("over_email_send_rate_limit")
      ) {
        bootstrapAuthUserViaSql({
          rootDir,
          sessionDbUrl,
          username,
          name,
          email,
          password,
        });
      } else {
        throw error;
      }
    }
  }

  const finalizeSql = `
do $$
declare
  target_username text := ${toSqlLiteral(username)};
  target_name text := ${toSqlLiteral(name)};
  target_email text := ${toSqlLiteral(email)};
  target_auth_user_id uuid;
begin
  select id
  into target_auth_user_id
  from auth.users
  where email = target_email
  limit 1;

  if target_auth_user_id is null then
    raise exception 'Auth user for % was not created.', target_email;
  end if;

  update auth.users
  set
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    confirmation_token = coalesce(confirmation_token, ''),
    email_change = coalesce(email_change, ''),
    email_change_token_new = coalesce(email_change_token_new, ''),
    recovery_token = coalesce(recovery_token, ''),
    raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('name', target_name, 'username', target_username),
    updated_at = now(),
    deleted_at = null,
    banned_until = null,
    is_sso_user = false,
    is_anonymous = false
  where id = target_auth_user_id;

  update public.admin_users
  set
    auth_user_id = target_auth_user_id,
    name = target_name,
    username = target_username,
    email = target_email,
    role = 'SUPERADMIN',
    is_active = true,
    updated_at = now()
  where auth_user_id = target_auth_user_id
     or username = target_username;

  if not found then
    insert into public.admin_users (
      auth_user_id,
      name,
      username,
      email,
      role,
      is_active
    )
    values (
      target_auth_user_id,
      target_name,
      target_username,
      target_email,
      'SUPERADMIN',
      true
    );
  end if;
end
$$;
`;

  runSql({
    rootDir,
    sessionDbUrl,
    sql: finalizeSql,
  });

  await verifyLogin({
    supabaseUrl,
    anonKey,
    email,
    password,
    username,
  });

  console.log(`Bootstrap admin ready: @${username}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
