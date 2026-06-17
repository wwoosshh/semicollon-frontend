# 0단계: 기반·인증·멤버 구현 계획 (Phase 0) — 3레포

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** db·backend·frontend 3레포의 토대를 만든다 — Postgres 스키마, 자체 JWT 인증(가입/로그인/리프레시), 멤버 명단·역할·기수 관리, 앱 셸, Railway·Vercel 배포.

**Architecture:** `semicolon-db`(PostgreSQL + dbmate 마이그레이션) → `semicolon-backend`(NestJS + Kysely + JWT) → `semicolon-frontend`(Next.js). 프론트는 백엔드 REST API를 호출하고 Bearer 토큰으로 인증한다.

**Tech Stack:** PostgreSQL, dbmate, NestJS, Kysely, kysely-codegen, @nestjs/jwt, bcryptjs, Next.js(App Router), Tailwind, shadcn/ui, TanStack Query, Railway, Vercel.

상위 설계: `frontend/docs/superpowers/specs/2026-06-17-semicolon-platform-design.md`

각 레포 경로(로컬):
- db: `C:/Users/user/Desktop/프로젝트/semicollon/db`
- backend: `C:/Users/user/Desktop/프로젝트/semicollon/backend`
- frontend: `C:/Users/user/Desktop/프로젝트/semicollon/frontend`

---

## 사전 수동 설정 (Manual Setup)

### M1. Railway — 백엔드 + Postgres
- [ ] https://railway.app 가입 → New Project.
- [ ] **+ New → Database → PostgreSQL** 추가. 생성 후 Variables 탭에서 `DATABASE_URL`(public, `postgresql://...`) 복사.
- [ ] 백엔드 서비스는 Task B9에서 GitHub 레포 연결로 추가(지금은 DB만).

### M2. Vercel — 프론트엔드
- [ ] https://vercel.com 가입 → `semicolon-frontend` 레포 import.
- [ ] Environment Variable에 `NEXT_PUBLIC_API_URL`(백엔드 Railway 공개 URL, Task B9 후 확정)을 나중에 등록.

### M3. Cloudflare R2 / LiveKit
- [ ] **0단계에서는 불필요.** 파일(4단계)·음성(5단계)에서 설정.

---

# Part A — semicolon-db (스키마)

## Task A1: dbmate 설치 + 프로젝트 설정

**Files (db 레포):** Create `package.json`, `.env.example`, `.gitignore`

- [ ] **Step 1: package.json 생성**

`db/package.json`:
```json
{
  "name": "semicolon-db",
  "private": true,
  "scripts": {
    "new": "dbmate new",
    "up": "dbmate up",
    "down": "dbmate down",
    "status": "dbmate status"
  },
  "devDependencies": {
    "dbmate": "^2.21.0"
  }
}
```

- [ ] **Step 2: 설치 + 환경설정 파일**

```bash
cd C:/Users/user/Desktop/프로젝트/semicollon/db
npm install
```

`db/.env.example`:
```
DATABASE_URL=postgresql://user:pass@host:port/dbname?sslmode=require
DBMATE_MIGRATIONS_DIR=./migrations
DBMATE_SCHEMA_FILE=./schema.sql
DBMATE_NO_DUMP_SCHEMA=false
```

`db/.gitignore`:
```
node_modules/
.env
```

- [ ] **Step 3: 실제 .env 작성(커밋 안 함)**

`db/.env` 에 M1의 `DATABASE_URL`을 넣고 나머지는 `.env.example`과 동일하게.

- [ ] **Step 4: 커밋**

```bash
git add package.json package-lock.json .env.example .gitignore
git commit -m "chore: dbmate 설정"
git push
```

---

## Task A2: users 테이블 마이그레이션

**Files (db 레포):** Create `migrations/<timestamp>_create_users.sql`

- [ ] **Step 1: 마이그레이션 파일 생성**

```bash
cd C:/Users/user/Desktop/프로젝트/semicollon/db
npx dbmate new create_users
```
Expected: `migrations/YYYYMMDDHHMMSS_create_users.sql` 생성.

- [ ] **Step 2: 마이그레이션 내용 작성**

생성된 파일 내용을 다음으로 교체:
```sql
-- migrate:up
create type user_role as enum ('운영진', '부원');

create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  name text not null default '',
  role user_role not null default '부원',
  cohort integer,
  avatar_url text,
  created_at timestamptz not null default now()
);

create index users_role_idx on users (role);

-- migrate:down
drop table users;
drop type user_role;
```

- [ ] **Step 3: Railway DB에 적용**

```bash
npx dbmate up
```
Expected: "Applying: ...create_users.sql" 성공. `schema.sql` 이 갱신됨.

- [ ] **Step 4: 적용 확인**

```bash
npx dbmate status
```
Expected: 마이그레이션이 `[X]`(applied)로 표시.

- [ ] **Step 5: 커밋**

```bash
git add migrations schema.sql
git commit -m "feat: users 테이블 + user_role enum"
git push
```

---

# Part B — semicolon-backend (NestJS API)

## Task B1: NestJS 스캐폴딩

**Files (backend 레포):** 다수 생성(Nest CLI)

- [ ] **Step 1: 스캐폴딩**

```bash
cd C:/Users/user/Desktop/프로젝트/semicollon/backend
npx @nestjs/cli@latest new . --skip-git --package-manager npm
```
프롬프트에서 npm 선택. 기존 `README.md`는 덮어쓸지 묻는데 덮어써도 됨(아래에서 의미 있는 README는 docs로 관리).

- [ ] **Step 2: 동작 확인**

```bash
npm run start:dev
```
Expected: `http://localhost:3000` 에서 "Hello World!". 확인 후 종료.

- [ ] **Step 3: 커밋**

```bash
git add -A
git commit -m "chore: NestJS 스캐폴딩"
git push
```

---

## Task B2: 설정 + Kysely DB 연결 + 타입 생성

**Files (backend 레포):**
- Create: `.env.example`, `.env`, `src/config/env.ts`, `src/db/database.module.ts`, `src/db/database.ts`, `src/db/types.ts`(생성됨)

- [ ] **Step 1: 의존성 설치**

```bash
npm install @nestjs/config kysely pg
npm install -D kysely-codegen @types/pg
```

- [ ] **Step 2: 환경변수 파일**

`backend/.env.example`:
```
PORT=3000
DATABASE_URL=postgresql://user:pass@host:port/dbname?sslmode=require
JWT_ACCESS_SECRET=change-me-access
JWT_REFRESH_SECRET=change-me-refresh
CORS_ORIGIN=http://localhost:3001
```
`backend/.env`: 실제 값(특히 M1의 `DATABASE_URL`, 임의의 긴 시크릿 두 개). `CORS_ORIGIN`은 프론트 dev 포트(아래 Task C에서 3001로 띄움).

`backend/.gitignore`에 `.env` 가 포함돼 있는지 확인(Nest 스캐폴딩 기본 포함).

- [ ] **Step 3: Kysely DB 타입 생성**

```bash
npx kysely-codegen --url "$DATABASE_URL_FROM_ENV" --out-file src/db/types.ts
```
> 실제로는 `.env`의 URL을 사용. PowerShell이면:
> `npx kysely-codegen --url "<DATABASE_URL>" --out-file src/db/types.ts`
Expected: `src/db/types.ts` 에 `Users`, `DB` 등 인터페이스 생성. `DB`에 `users` 포함 확인.

- [ ] **Step 4: Kysely 인스턴스 팩토리**

`src/db/database.ts`:
```typescript
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import type { DB } from "./types";

export function createDb(connectionString: string): Kysely<DB> {
  return new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString,
        ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
      }),
    }),
  });
}

export type Database = Kysely<DB>;
export const DB_TOKEN = "DB_CONNECTION";
```

- [ ] **Step 5: DatabaseModule (전역 provider)**

`src/db/database.module.ts`:
```typescript
import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createDb, DB_TOKEN } from "./database";

@Global()
@Module({
  providers: [
    {
      provide: DB_TOKEN,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        createDb(config.getOrThrow<string>("DATABASE_URL")),
    },
  ],
  exports: [DB_TOKEN],
})
export class DatabaseModule {}
```

- [ ] **Step 6: AppModule에 등록**

`src/app.module.ts` 의 imports에 추가(다른 import는 유지):
```typescript
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./db/database.module";
// ...
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
  ],
  // controllers, providers 유지
})
```

- [ ] **Step 7: 빌드 확인 + 커밋**

```bash
npm run build
```
Expected: 성공.
```bash
git add -A
git commit -m "feat: 설정 + Kysely DB 연결"
git push
```

---

## Task B3: 비밀번호 서비스 (TDD)

**Files (backend 레포):**
- Create: `src/auth/password.service.ts`
- Test: `src/auth/password.service.spec.ts`

- [ ] **Step 1: bcrypt 설치**

```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

- [ ] **Step 2: 실패하는 테스트 작성**

`src/auth/password.service.spec.ts`:
```typescript
import { PasswordService } from "./password.service";

describe("PasswordService", () => {
  const svc = new PasswordService();

  it("해시는 평문과 다르다", async () => {
    const hash = await svc.hash("secret123");
    expect(hash).not.toBe("secret123");
    expect(hash.length).toBeGreaterThan(20);
  });

  it("같은 평문은 compare 시 true", async () => {
    const hash = await svc.hash("secret123");
    expect(await svc.compare("secret123", hash)).toBe(true);
  });

  it("다른 평문은 compare 시 false", async () => {
    const hash = await svc.hash("secret123");
    expect(await svc.compare("wrong", hash)).toBe(false);
  });
});
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `npm test -- password`
Expected: FAIL — `password.service` 없음.

- [ ] **Step 4: 구현**

`src/auth/password.service.ts`:
```typescript
import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcryptjs";

@Injectable()
export class PasswordService {
  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, 10);
  }
  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
```

- [ ] **Step 5: 통과 확인 + 커밋**

Run: `npm test -- password` → PASS.
```bash
git add src/auth/password.service.ts src/auth/password.service.spec.ts package.json package-lock.json
git commit -m "feat: 비밀번호 해싱 서비스 (TDD)"
git push
```

---

## Task B4: 권한 순수 함수 (TDD)

**Files (backend 레포):**
- Create: `src/auth/roles.ts`
- Test: `src/auth/roles.spec.ts`

- [ ] **Step 1: 실패하는 테스트**

`src/auth/roles.spec.ts`:
```typescript
import { isAdmin, canManageMembers } from "./roles";

describe("roles", () => {
  it("isAdmin: 운영진 true, 부원 false, null false", () => {
    expect(isAdmin("운영진")).toBe(true);
    expect(isAdmin("부원")).toBe(false);
    expect(isAdmin(null)).toBe(false);
  });
  it("canManageMembers: 운영진만 true", () => {
    expect(canManageMembers("운영진")).toBe(true);
    expect(canManageMembers("부원")).toBe(false);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- roles`
Expected: FAIL.

- [ ] **Step 3: 구현**

`src/auth/roles.ts`:
```typescript
export type Role = "운영진" | "부원";

export function isAdmin(role: Role | null | undefined): boolean {
  return role === "운영진";
}

export function canManageMembers(role: Role | null | undefined): boolean {
  return isAdmin(role);
}
```

- [ ] **Step 4: 통과 + 커밋**

Run: `npm test -- roles` → PASS.
```bash
git add src/auth/roles.ts src/auth/roles.spec.ts
git commit -m "feat: 역할 권한 순수 함수 (TDD)"
git push
```

---

## Task B5: 토큰 서비스 (TDD)

**Files (backend 레포):**
- Create: `src/auth/token.service.ts`
- Test: `src/auth/token.service.spec.ts`

- [ ] **Step 1: JWT 설치**

```bash
npm install @nestjs/jwt
```

- [ ] **Step 2: 실패하는 테스트**

`src/auth/token.service.spec.ts`:
```typescript
import { JwtService } from "@nestjs/jwt";
import { TokenService } from "./token.service";

describe("TokenService", () => {
  const svc = new TokenService(new JwtService(), {
    getOrThrow: (k: string) => (k === "JWT_ACCESS_SECRET" ? "a-secret" : "r-secret"),
  } as any);

  it("access 토큰을 발급하고 검증한다", () => {
    const token = svc.signAccess({ sub: "u1", role: "부원" });
    const payload = svc.verifyAccess(token);
    expect(payload.sub).toBe("u1");
    expect(payload.role).toBe("부원");
  });

  it("잘못된 시크릿의 토큰은 access 검증 실패", () => {
    const token = svc.signRefresh({ sub: "u1", role: "부원" });
    expect(() => svc.verifyAccess(token)).toThrow();
  });
});
```

- [ ] **Step 3: 실패 확인**

Run: `npm test -- token`
Expected: FAIL.

- [ ] **Step 4: 구현**

`src/auth/token.service.ts`:
```typescript
import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import type { Role } from "./roles";

export interface JwtPayload {
  sub: string;
  role: Role;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  signAccess(payload: JwtPayload): string {
    return this.jwt.sign(payload, {
      secret: this.config.getOrThrow("JWT_ACCESS_SECRET"),
      expiresIn: "15m",
    });
  }

  signRefresh(payload: JwtPayload): string {
    return this.jwt.sign(payload, {
      secret: this.config.getOrThrow("JWT_REFRESH_SECRET"),
      expiresIn: "30d",
    });
  }

  verifyAccess(token: string): JwtPayload {
    return this.jwt.verify(token, {
      secret: this.config.getOrThrow("JWT_ACCESS_SECRET"),
    });
  }

  verifyRefresh(token: string): JwtPayload {
    return this.jwt.verify(token, {
      secret: this.config.getOrThrow("JWT_REFRESH_SECRET"),
    });
  }
}
```

- [ ] **Step 5: 통과 + 커밋**

Run: `npm test -- token` → PASS.
```bash
git add src/auth/token.service.ts src/auth/token.service.spec.ts package.json package-lock.json
git commit -m "feat: JWT 토큰 서비스 (TDD)"
git push
```

---

## Task B6: 인증 가드 + 데코레이터

**Files (backend 레포):**
- Create: `src/auth/jwt-auth.guard.ts`, `src/auth/current-user.decorator.ts`, `src/auth/roles.guard.ts`, `src/auth/roles.decorator.ts`

- [ ] **Step 1: JwtAuthGuard**

`src/auth/jwt-auth.guard.ts`:
```typescript
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { TokenService } from "./token.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokens: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const header: string | undefined = req.headers["authorization"];
    if (!header?.startsWith("Bearer ")) throw new UnauthorizedException();
    try {
      req.user = this.tokens.verifyAccess(header.slice(7));
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
```

- [ ] **Step 2: CurrentUser 데코레이터**

`src/auth/current-user.decorator.ts`:
```typescript
import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { JwtPayload } from "./token.service";

export const CurrentUser = createParamDecorator(
  (_data, ctx: ExecutionContext): JwtPayload =>
    ctx.switchToHttp().getRequest().user,
);
```

- [ ] **Step 3: Roles 데코레이터 + 가드**

`src/auth/roles.decorator.ts`:
```typescript
import { SetMetadata } from "@nestjs/common";
import type { Role } from "./roles";

export const ROLES_KEY = "roles";
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

`src/auth/roles.guard.ts`:
```typescript
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "./roles.decorator";
import type { Role } from "./roles";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;
    const user = context.switchToHttp().getRequest().user;
    if (!user || !required.includes(user.role)) throw new ForbiddenException();
    return true;
  }
}
```

- [ ] **Step 4: 빌드 + 커밋**

Run: `npm run build` → 성공.
```bash
git add src/auth
git commit -m "feat: JWT/Roles 가드 + 데코레이터"
git push
```

---

## Task B7: 인증 모듈 (signup / login / refresh / me)

**Files (backend 레포):**
- Create: `src/auth/auth.service.ts`, `src/auth/auth.controller.ts`, `src/auth/auth.module.ts`, `src/auth/dto.ts`

- [ ] **Step 1: DTO**

`src/auth/dto.ts`:
```typescript
export interface SignupDto {
  email: string;
  password: string;
  name: string;
}
export interface LoginDto {
  email: string;
  password: string;
}
export interface RefreshDto {
  refreshToken: string;
}
```

- [ ] **Step 2: AuthService**

`src/auth/auth.service.ts`:
```typescript
import { ConflictException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { DB_TOKEN, type Database } from "../db/database";
import { PasswordService } from "./password.service";
import { TokenService } from "./token.service";
import type { SignupDto, LoginDto } from "./dto";

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: Database,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
  ) {}

  private issue(user: { id: string; role: "운영진" | "부원" }) {
    const payload = { sub: user.id, role: user.role };
    return {
      accessToken: this.tokens.signAccess(payload),
      refreshToken: this.tokens.signRefresh(payload),
    };
  }

  async signup(dto: SignupDto) {
    const existing = await this.db
      .selectFrom("users").select("id").where("email", "=", dto.email).executeTakeFirst();
    if (existing) throw new ConflictException("이미 가입된 이메일입니다.");

    const password_hash = await this.passwords.hash(dto.password);
    const user = await this.db
      .insertInto("users")
      .values({ email: dto.email, password_hash, name: dto.name })
      .returning(["id", "role"])
      .executeTakeFirstOrThrow();
    return this.issue(user);
  }

  async login(dto: LoginDto) {
    const user = await this.db
      .selectFrom("users")
      .select(["id", "role", "password_hash"])
      .where("email", "=", dto.email)
      .executeTakeFirst();
    if (!user || !(await this.passwords.compare(dto.password, user.password_hash))) {
      throw new UnauthorizedException("이메일 또는 비밀번호가 올바르지 않습니다.");
    }
    return this.issue(user);
  }

  refresh(refreshToken: string) {
    const payload = this.tokens.verifyRefresh(refreshToken);
    return this.issue({ id: payload.sub, role: payload.role });
  }

  async me(userId: string) {
    return this.db
      .selectFrom("users")
      .select(["id", "email", "name", "role", "cohort", "avatar_url"])
      .where("id", "=", userId)
      .executeTakeFirstOrThrow();
  }
}
```

- [ ] **Step 3: AuthController**

`src/auth/auth.controller.ts`:
```typescript
import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { CurrentUser } from "./current-user.decorator";
import type { JwtPayload } from "./token.service";
import type { SignupDto, LoginDto, RefreshDto } from "./dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("signup")
  signup(@Body() dto: SignupDto) {
    return this.auth.signup(dto);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post("refresh")
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() user: JwtPayload) {
    return this.auth.me(user.sub);
  }
}
```

- [ ] **Step 4: AuthModule + JwtModule + AppModule 등록**

`src/auth/auth.module.ts`:
```typescript
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { PasswordService } from "./password.service";
import { TokenService } from "./token.service";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, TokenService, JwtAuthGuard],
  exports: [TokenService, JwtAuthGuard],
})
export class AuthModule {}
```
`src/app.module.ts` imports에 `AuthModule` 추가.

- [ ] **Step 5: 수동 동작 확인**

`npm run start:dev` 후 다른 터미널에서:
```bash
curl -X POST http://localhost:3000/auth/signup -H "Content-Type: application/json" \
  -d '{"email":"me@test.com","password":"secret123","name":"운영자"}'
```
Expected: `{"accessToken":"...","refreshToken":"..."}`.

- [ ] **Step 6: 첫 운영진 지정**

db 레포에서(또는 Railway 콘솔 SQL):
```sql
update users set role = '운영진' where email = 'me@test.com';
```

- [ ] **Step 7: 커밋**

```bash
git add src/auth src/app.module.ts
git commit -m "feat: 인증 모듈 (signup/login/refresh/me)"
git push
```

---

## Task B8: 멤버 모듈 (목록 + 운영진 수정)

**Files (backend 레포):**
- Create: `src/members/members.service.ts`, `src/members/members.controller.ts`, `src/members/members.module.ts`, `src/members/dto.ts`

- [ ] **Step 1: DTO**

`src/members/dto.ts`:
```typescript
import type { Role } from "../auth/roles";
export interface UpdateMemberDto {
  role?: Role;
  cohort?: number | null;
}
```

- [ ] **Step 2: MembersService**

`src/members/members.service.ts`:
```typescript
import { Inject, Injectable } from "@nestjs/common";
import { DB_TOKEN, type Database } from "../db/database";
import type { UpdateMemberDto } from "./dto";

@Injectable()
export class MembersService {
  constructor(@Inject(DB_TOKEN) private readonly db: Database) {}

  list() {
    return this.db
      .selectFrom("users")
      .select(["id", "name", "email", "role", "cohort", "avatar_url"])
      .orderBy("cohort", "asc")
      .orderBy("name", "asc")
      .execute();
  }

  async update(id: string, dto: UpdateMemberDto) {
    return this.db
      .updateTable("users")
      .set(dto)
      .where("id", "=", id)
      .returning(["id", "name", "email", "role", "cohort", "avatar_url"])
      .executeTakeFirstOrThrow();
  }
}
```

- [ ] **Step 3: MembersController (운영진만 수정)**

`src/members/members.controller.ts`:
```typescript
import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { MembersService } from "./members.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import type { UpdateMemberDto } from "./dto";

@UseGuards(JwtAuthGuard)
@Controller("members")
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Get()
  list() {
    return this.members.list();
  }

  @UseGuards(RolesGuard)
  @Roles("운영진")
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateMemberDto) {
    return this.members.update(id, dto);
  }
}
```

- [ ] **Step 4: MembersModule + AppModule 등록**

`src/members/members.module.ts`:
```typescript
import { Module } from "@nestjs/common";
import { MembersService } from "./members.service";
import { MembersController } from "./members.controller";
import { AuthModule } from "../auth/auth.module";
import { RolesGuard } from "../auth/roles.guard";

@Module({
  imports: [AuthModule],
  controllers: [MembersController],
  providers: [MembersService, RolesGuard],
})
export class MembersModule {}
```
`src/app.module.ts` imports에 `MembersModule` 추가.

- [ ] **Step 5: CORS 활성화**

`src/main.ts` 의 bootstrap에서 `app.listen` 전에 추가:
```typescript
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? true,
    credentials: true,
  });
```

- [ ] **Step 6: 수동 확인**

`npm run start:dev` → login으로 accessToken 받고:
```bash
curl http://localhost:3000/members -H "Authorization: Bearer <accessToken>"
```
Expected: 멤버 배열(본인 1명, role 운영진).

- [ ] **Step 7: 빌드 + 커밋**

Run: `npm run build` → 성공. `npm test` → 기존 테스트 PASS.
```bash
git add src/members src/app.module.ts src/main.ts
git commit -m "feat: 멤버 목록 + 운영진 수정 API"
git push
```

---

## Task B9: Railway 배포

- [ ] **Step 1: Railway에 백엔드 서비스 추가**

Railway 프로젝트 → New → GitHub Repo → `semicolon-backend` 선택.

- [ ] **Step 2: 환경변수 등록**

서비스 Variables에 `DATABASE_URL`(같은 프로젝트 Postgres 참조), `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`(프론트 Vercel 도메인, 나중에 갱신), `PORT`(Railway가 주입하는 `$PORT` 사용 — `main.ts`에서 `process.env.PORT ?? 3000`).

- [ ] **Step 3: main.ts 포트 확인**

`src/main.ts` 의 listen이 `await app.listen(process.env.PORT ?? 3000)` 인지 확인(아니면 수정).

- [ ] **Step 4: 배포 확인**

Railway가 빌드·배포 → 공개 URL 생성. `https://<railway-url>/auth/login` 호출되는지 확인. 이 URL을 M2의 `NEXT_PUBLIC_API_URL`로 사용.

- [ ] **Step 5: 커밋(필요 시 main.ts 수정분)**

```bash
git add src/main.ts
git commit -m "chore: Railway 배포용 PORT 설정"
git push
```

---

# Part C — semicolon-frontend (Next.js)

## Task C1: Next.js + Tailwind + shadcn 스캐폴딩

**Files (frontend 레포):** 다수(create-next-app). 기존 `README.md`·`docs/`는 유지.

- [ ] **Step 1: 스캐폴딩**

```bash
cd C:/Users/user/Desktop/프로젝트/semicollon/frontend
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```
기존 파일 충돌 경고가 나오면 진행(README/docs는 보존). 완료 후 `git status`로 docs·README 유지 확인.

- [ ] **Step 2: shadcn/ui 초기화**

```bash
npx shadcn@latest init -d
npx shadcn@latest add button input table select label
```

- [ ] **Step 3: dev 포트 3001로 실행 확인**

```bash
npm run dev -- -p 3001
```
Expected: `http://localhost:3001` 기본 페이지. (백엔드 CORS_ORIGIN과 일치)

- [ ] **Step 4: 커밋**

```bash
git add -A
git commit -m "chore: Next.js + Tailwind + shadcn 스캐폴딩"
git push
```

---

## Task C2: API 클라이언트 + 토큰 저장

**Files (frontend 레포):**
- Create: `.env.local`, `.env.example`, `src/lib/api.ts`, `src/lib/auth-store.ts`

- [ ] **Step 1: 환경변수**

`frontend/.env.example`:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```
`frontend/.env.local`: 로컬 백엔드 `http://localhost:3000`.

- [ ] **Step 2: 토큰 저장(localStorage)**

`src/lib/auth-store.ts`:
```typescript
const ACCESS = "sc_access";
const REFRESH = "sc_refresh";

export const authStore = {
  get access() {
    return typeof window === "undefined" ? null : localStorage.getItem(ACCESS);
  },
  get refresh() {
    return typeof window === "undefined" ? null : localStorage.getItem(REFRESH);
  },
  set(tokens: { accessToken: string; refreshToken: string }) {
    localStorage.setItem(ACCESS, tokens.accessToken);
    localStorage.setItem(REFRESH, tokens.refreshToken);
  },
  clear() {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
  },
};
```

- [ ] **Step 3: API 클라이언트(401 시 refresh 1회 재시도)**

`src/lib/api.ts`:
```typescript
import { authStore } from "./auth-store";

const BASE = process.env.NEXT_PUBLIC_API_URL!;

async function refreshTokens(): Promise<boolean> {
  const refreshToken = authStore.refresh;
  if (!refreshToken) return false;
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return false;
  authStore.set(await res.json());
  return true;
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (authStore.access) headers.set("Authorization", `Bearer ${authStore.access}`);

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401 && retry && (await refreshTokens())) {
    return api<T>(path, options, false);
  }
  if (!res.ok) {
    const msg = await res.json().catch(() => ({}));
    throw new Error(msg.message ?? `요청 실패 (${res.status})`);
  }
  return res.json();
}
```

- [ ] **Step 4: 커밋**

```bash
git add src/lib .env.example
git commit -m "feat: API 클라이언트 + 토큰 저장"
git push
```

---

## Task C3: 회원가입 / 로그인 페이지

**Files (frontend 레포):**
- Create: `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`

- [ ] **Step 1: 회원가입 페이지**

`src/app/(auth)/signup/page.tsx`:
```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { authStore } from "@/lib/auth-store";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const tokens = await api<{ accessToken: string; refreshToken: string }>(
        "/auth/signup",
        { method: "POST", body: JSON.stringify(form) },
      );
      authStore.set(tokens);
      router.push("/");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-20 flex max-w-sm flex-col gap-3 p-4">
      <h1 className="text-xl font-bold">세미콜론 회원가입</h1>
      <input className="rounded border p-2" placeholder="이름" required
        value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input className="rounded border p-2" type="email" placeholder="이메일" required
        value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input className="rounded border p-2" type="password" placeholder="비밀번호(6자 이상)" required
        value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="rounded bg-black p-2 text-white" type="submit">가입하기</button>
      <a href="/login" className="text-sm text-blue-600">이미 계정이 있어요</a>
    </form>
  );
}
```

- [ ] **Step 2: 로그인 페이지**

`src/app/(auth)/login/page.tsx`:
```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { authStore } from "@/lib/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const tokens = await api<{ accessToken: string; refreshToken: string }>(
        "/auth/login",
        { method: "POST", body: JSON.stringify(form) },
      );
      authStore.set(tokens);
      router.push("/");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-20 flex max-w-sm flex-col gap-3 p-4">
      <h1 className="text-xl font-bold">세미콜론 로그인</h1>
      <input className="rounded border p-2" type="email" placeholder="이메일" required
        value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input className="rounded border p-2" type="password" placeholder="비밀번호" required
        value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="rounded bg-black p-2 text-white" type="submit">로그인</button>
      <a href="/signup" className="text-sm text-blue-600">처음이신가요? 회원가입</a>
    </form>
  );
}
```

- [ ] **Step 3: 수동 확인**

백엔드(`:3000`) + 프론트(`:3001`) 동시 실행 → `/login`에서 Task B7에서 만든 계정으로 로그인 → `/`로 이동.

- [ ] **Step 4: 커밋**

```bash
git add "src/app/(auth)"
git commit -m "feat: 회원가입/로그인 페이지"
git push
```

---

## Task C4: 인증 컨텍스트 + 보호 레이아웃

**Files (frontend 레포):**
- Create: `src/lib/use-me.ts`, `src/app/(app)/layout.tsx`, `src/components/app-shell.tsx`, `src/components/nav.tsx`, `src/app/(app)/page.tsx`
- Modify: `src/app/layout.tsx` (TanStack Query Provider)

- [ ] **Step 1: TanStack Query 설치 + Provider**

```bash
npm install @tanstack/react-query
```
`src/components/query-provider.tsx`:
```tsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```
`src/app/layout.tsx` 의 `<body>` 안을 `<QueryProvider>{children}</QueryProvider>` 로 감싼다.

- [ ] **Step 2: useMe 훅**

`src/lib/use-me.ts`:
```typescript
"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

export interface Me {
  id: string;
  email: string;
  name: string;
  role: "운영진" | "부원";
  cohort: number | null;
  avatar_url: string | null;
}

export function useMe() {
  return useQuery<Me>({
    queryKey: ["me"],
    queryFn: () => api<Me>("/auth/me"),
    retry: false,
  });
}
```

- [ ] **Step 3: 네비 + 앱 셸 + 로그아웃**

`src/components/nav.tsx`:
```tsx
import Link from "next/link";

export function Nav() {
  return (
    <nav className="flex flex-col gap-1 p-3 text-sm">
      <Link href="/" className="rounded px-2 py-1 hover:bg-gray-100">홈</Link>
      <Link href="/members" className="rounded px-2 py-1 hover:bg-gray-100">멤버</Link>
    </nav>
  );
}
```
`src/components/app-shell.tsx`:
```tsx
"use client";
import { useRouter } from "next/navigation";
import { Nav } from "./nav";
import { authStore } from "@/lib/auth-store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  function logout() {
    authStore.clear();
    router.push("/login");
  }
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-48 flex-col border-r bg-gray-50">
        <div className="p-3 text-lg font-bold">세미콜론</div>
        <Nav />
        <button onClick={logout} className="mt-auto p-3 text-left text-sm text-gray-500 hover:text-black">
          로그아웃
        </button>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: 보호 레이아웃 (클라이언트 가드)**

`src/app/(app)/layout.tsx`:
```tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMe } from "@/lib/use-me";
import { AppShell } from "@/components/app-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: me, isLoading, isError } = useMe();

  useEffect(() => {
    if (isError) router.replace("/login");
  }, [isError, router]);

  if (isLoading) return <div className="p-6">불러오는 중…</div>;
  if (!me) return null;
  return <AppShell>{children}</AppShell>;
}
```

- [ ] **Step 5: 홈 페이지**

`src/app/(app)/page.tsx`:
```tsx
"use client";
import { useMe } from "@/lib/use-me";

export default function HomePage() {
  const { data: me } = useMe();
  return <h1 className="text-2xl font-bold">{me?.name}님, 환영합니다 👋</h1>;
}
```

- [ ] **Step 6: 기본 홈 제거**

스캐폴딩 기본 `src/app/page.tsx` 삭제:
```bash
rm src/app/page.tsx
```

- [ ] **Step 7: 수동 확인 + 커밋**

로그인 후 `/`에서 좌측 셸 + "○○님, 환영합니다", 미로그인 시 `/login`으로 튕기는지 확인.
```bash
git add -A
git commit -m "feat: 인증 컨텍스트 + 보호 레이아웃 + 앱 셸"
git push
```

---

## Task C5: 멤버 페이지 (목록 + 운영진 편집)

**Files (frontend 레포):**
- Create: `src/app/(app)/members/page.tsx`, `src/app/(app)/members/member-row.tsx`

- [ ] **Step 1: 멤버 페이지**

`src/app/(app)/members/page.tsx`:
```tsx
"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useMe, type Me } from "@/lib/use-me";
import { MemberRow } from "./member-row";

export default function MembersPage() {
  const { data: me } = useMe();
  const { data: members } = useQuery<Me[]>({
    queryKey: ["members"],
    queryFn: () => api<Me[]>("/members"),
  });
  const canEdit = me?.role === "운영진";

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">멤버</h1>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="p-2">이름</th>
            <th className="p-2">역할</th>
            <th className="p-2">기수</th>
          </tr>
        </thead>
        <tbody>
          {members?.map((m) => <MemberRow key={m.id} member={m} canEdit={canEdit} />)}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: 멤버 행(편집)**

`src/app/(app)/members/member-row.tsx`:
```tsx
"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Me } from "@/lib/use-me";

export function MemberRow({ member, canEdit }: { member: Me; canEdit: boolean }) {
  const qc = useQueryClient();
  const [cohort, setCohort] = useState(member.cohort?.toString() ?? "");

  const mutation = useMutation({
    mutationFn: (patch: { role?: Me["role"]; cohort?: number | null }) =>
      api(`/members/${member.id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });

  if (!canEdit) {
    return (
      <tr className="border-b">
        <td className="p-2">{member.name || "(이름 없음)"}</td>
        <td className="p-2">{member.role}</td>
        <td className="p-2">{member.cohort ?? "-"}</td>
      </tr>
    );
  }

  return (
    <tr className="border-b">
      <td className="p-2">{member.name || "(이름 없음)"}</td>
      <td className="p-2">
        <select className="rounded border p-1" defaultValue={member.role}
          disabled={mutation.isPending}
          onChange={(e) => mutation.mutate({ role: e.target.value as Me["role"] })}>
          <option value="부원">부원</option>
          <option value="운영진">운영진</option>
        </select>
      </td>
      <td className="p-2">
        <input className="w-16 rounded border p-1" type="number" value={cohort}
          disabled={mutation.isPending}
          onChange={(e) => setCohort(e.target.value)}
          onBlur={() => mutation.mutate({ cohort: cohort === "" ? null : Number(cohort) })} />
      </td>
    </tr>
  );
}
```

- [ ] **Step 3: 수동 확인**

운영진 계정으로 `/members` → 두 번째 테스트 계정 가입 후 역할/기수 변경 → 반영 확인. 부원 계정으로는 편집 UI 안 보임.

- [ ] **Step 4: 커밋**

```bash
git add "src/app/(app)/members"
git commit -m "feat: 멤버 페이지 + 운영진 편집"
git push
```

---

## Task C6: Vercel 배포 + 최종 검증

- [ ] **Step 1: 빌드 확인**

```bash
npm run build
```
Expected: 성공.

- [ ] **Step 2: Vercel 환경변수**

Vercel 프로젝트 Variables에 `NEXT_PUBLIC_API_URL = <Railway 백엔드 URL>` 등록. 백엔드 Railway의 `CORS_ORIGIN`을 Vercel 프론트 도메인으로 갱신하고 재배포.

- [ ] **Step 3: 배포 + 전체 흐름 검증**

```bash
git push
```
Vercel 자동 배포 후 프론트 URL에서: 회원가입 → 로그인 → 홈 환영 → 멤버 목록 → (운영진) 역할 편집 → 로그아웃 전체 동작 확인.

---

## 0단계 완료 기준 (Definition of Done)

- [ ] 3레포 모두 GitHub + 클라우드(Railway/Vercel)에 배포되어 동작.
- [ ] Vercel URL에서 회원가입·로그인·로그아웃 동작.
- [ ] 미로그인 시 보호 페이지가 `/login`으로 리다이렉트.
- [ ] 멤버 목록 표시, 운영진만 역할·기수 편집 가능(백엔드 RolesGuard로 강제).
- [ ] backend `npm test`(password/roles/token) 와 `npm run build`, frontend `npm run build` 통과.

다음 단계: **1단계 — 활동공간(Space) + 공지·게시판(C·D)** 계획 작성.
```
