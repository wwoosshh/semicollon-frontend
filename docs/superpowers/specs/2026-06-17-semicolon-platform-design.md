# 세미콜론(Semicolon) 통합 동아리 플랫폼 — 설계 스펙 (v2)

- **작성일**: 2026-06-17
- **대상**: 세미콜론 코딩 동아리 *내부 전용*
- **개발**: 단독 개발 (Claude가 전 구현). 초보 친화성보다 **목적·최적 구조 우선**.
- **상태**: 아키텍처 확정 (custom backend + LiveKit) → 0단계 구현 계획 준비

> v1 대비 변경: Supabase 올인원 폐기 → **Railway 커스텀 백엔드 + 자체 Postgres**. 음성은 **LiveKit(SFU)**. 3개 레포(frontend/backend/db)로 분리.

---

## 1. 목적

세미콜론 동아리 활동(음성통화, 실시간 채팅, 활동 기록·추적, 일정, 출석, 공지/게시판, 자료실, 멤버 관리)을 하나의 웹 기반 플랫폼으로 통합한다.

세미콜론은 **프로젝트 중심** 동아리: 안건 제안 → 참여 희망자 모집 → 진행. 세미나·코딩대회·해커톤은 희망자만 별도 모집.

## 2. 성공 기준

- 하나의 앱에서 활동 공간 참여 / 일정 / 출석 / 공지 / 자료 / 채팅 / 음성통화가 동작.
- 단계별 출시: 각 단계 완료 즉시 실사용 가능.
- 동아리 규모(수십~수백 명)를 클라우드 무료/저가 티어로 운영.

## 3. 시스템 아키텍처 — 3개 레포 분리

```
┌─────────────────────┐     REST + WebSocket      ┌──────────────────────┐
│  semicolon-frontend │ ◄───────────────────────► │  semicolon-backend    │
│  Next.js (Vercel)   │                           │  NestJS (Railway)     │
│  PWA                │                           │  REST · Socket.IO     │
└─────────┬───────────┘                           │  JWT auth · R2 · LK   │
          │                                       └──────────┬───────────┘
          │ WebRTC (음성, LiveKit SDK)                       │ SQL (Kysely)
          ▼                                                  ▼
┌─────────────────────┐                           ┌──────────────────────┐
│   LiveKit Cloud     │                           │  semicolon-db          │
│   (SFU, 음성 미디어)│                           │  PostgreSQL (Supabase)│
└─────────────────────┘                           │  스키마/마이그레이션   │
                                                   └──────────────────────┘
                          파일/자료실 → Cloudflare R2 (백엔드가 presigned URL 발급)
```

- **frontend** (`semicolon-frontend`): Next.js(App Router) PWA. 화면 + LiveKit으로 음성 연결 + Socket.IO로 채팅.
- **backend** (`semicolon-backend`): NestJS API 서버. REST + Socket.IO(채팅/presence) + 자체 JWT 인증 + LiveKit 토큰 발급 + R2 파일 스토리지.
- **db** (`semicolon-db`): PostgreSQL 스키마/마이그레이션의 진실 공급원. **Supabase Postgres**에 적용. 백엔드가 Kysely로 소비.

## 4. 핵심 컨셉 — "활동 공간(Space)" 통합 모델

프로젝트·세미나·코딩대회·해커톤을 공통 엔티티 `Space`로 통합. 종류(`type`)만 다르고 구조는 동일. 프로젝트의 "제안→모집→진행"은 `Space.status`(`제안중→모집중→진행중→완료→보관`)로 표현.

```
세미콜론 (전체 레벨)
├─ 전체 공지 / 전체 게시판 / 전체 캘린더 / 멤버 관리
└─ 활동 공간(Space)들  ← type: 프로젝트 | 세미나 | 코딩대회 | 해커톤
   └─ 각 Space: 멤버 · 일정 · 출석 · 공지 · 게시판 · 자료/docs · 채팅 · 음성방
```

## 5. 기능 범위

필수: A 출석, B 통합 캘린더, C 프로젝트 관리·개요·docs, D 공지/게시판(전체+Space), F 파일/자료실, G 멤버 관리, + 실시간 채팅, + 음성통화. 선택: E 활동 점수/랭킹.

범위 외(YAGNI): 멀티테넌시, 결제, 외부 공개, 네이티브 앱(초기).

## 6. 플랫폼 영역 — 웹 우선 + PWA

하나의 웹 코드로 4개 영역 커버. 윈도우=브라우저/PWA, 안드로이드=모바일 브라우저/PWA, iOS=모바일 브라우저/PWA(푸시·백그라운드 제약), 웹=기본. 네이티브 앱은 후속 옵션.

## 7. 기술 스택

### Frontend
| 항목 | 선택 |
|---|---|
| 프레임워크 | Next.js (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| 데이터 | TanStack Query |
| 음성 | LiveKit React SDK |
| 실시간 | Socket.IO client |
| PWA | next-pwa (또는 App Router PWA 설정) |

### Backend
| 항목 | 선택 |
|---|---|
| 프레임워크 | NestJS (TypeScript) |
| 인증 | 자체 JWT (access + refresh), bcrypt 해싱, Nest Guards로 역할 강제 |
| 실시간 | Socket.IO 게이트웨이 (채팅 · presence), 메시지는 Postgres 영속화 |
| DB 접근 | Kysely (타입 안전 쿼리) + kysely-codegen(타입 생성) |
| 음성 | LiveKit Server SDK (방 토큰 발급 엔드포인트) |
| 파일 | Cloudflare R2 (S3 호환), presigned URL |

### DB
| 항목 | 선택 |
|---|---|
| 엔진 | PostgreSQL (Supabase 관리형, 순수 DB로만 사용) |
| 마이그레이션 | dbmate (SQL 기반, 언어 비종속) |
| 진실 공급원 | `semicolon-db` 레포 |

### 음성 인프라 (LiveKit)
- **LiveKit Cloud** 무료 티어로 시작 (STUN·TURN·SFU 내장 → NAT/포트포워딩 신경 불필요).
- 백엔드가 사용자·권한 검증 후 **LiveKit access token** 발급 → 프론트가 그 토큰으로 방 참여.
- 필요 시 추후 **Railway에 LiveKit 셀프호스트**로 전환 가능.

> 판단 포인트(추후 조정 가능): ORM은 Kysely 대신 Prisma(백엔드 내장) 선택지도 있음. 음성은 Cloud 대신 Railway 셀프호스트 선택지 있음. 스토리지는 R2 대신 S3/Railway Volume 가능.

## 8. 배포·호스팅 (전부 클라우드)

| 구성 | 클라우드 | 무료 티어 |
|---|---|---|
| 프론트엔드 | Vercel | O (GitHub 푸시 자동 배포) |
| 백엔드 API | Railway | O (소액) |
| DB | Supabase (Postgres) | O |
| 음성 | LiveKit Cloud | O |
| 파일 스토리지 | Cloudflare R2 | O |

- 시크릿(JWT secret, DB URL, LiveKit key/secret, R2 키)은 각 플랫폼 환경변수로 주입, 레포 커밋 금지.
- 환경: production 우선, 필요 시 preview/staging.

## 9. 데이터 모델 (Postgres 테이블)

```
users          : id, email, password_hash, name, role(운영진|부원), cohort, avatar_url, created_at
spaces         : id, type(프로젝트|세미나|대회|해커톤), title, description,
                 status(제안중|모집중|진행중|완료|보관), created_by, created_at
memberships    : user_id, space_id, role(리더|멤버), joined_at   (PK: user_id+space_id)
events         : id, scope(전체|space), space_id?, title, starts_at, ends_at, location, kind
attendance     : event_id, user_id, status(출석|지각|결석), checked_at   (PK: event_id+user_id)
announcements  : id, scope(전체|space), space_id?, author_id, title, body, created_at
posts          : id, scope(전체|space), space_id?, author_id, title, body, created_at
comments       : id, post_id, author_id, body, created_at
docs           : id, scope(전체|space), space_id?, kind(개요|문서|파일), title, content?, file_key?, created_at
chat_channels  : id, scope(전체|space), space_id?, name
messages       : id, channel_id, author_id, body, created_at
activity_points: id, user_id, reason, points, created_at   ← E기능(후속)
```

핵심: 대부분 테이블의 `scope` 컬럼이 "전체 레벨"과 "Space 레벨"을 동일 코드로 처리.

## 10. 권한 모델

- 전역 역할: `운영진` / `부원`. Space 역할: `리더` / `멤버`.
- 강제 위치: **백엔드 NestJS Guards**(app 레벨). 예: 전체 공지=운영진, Space 공지/문서=해당 Space 리더, 게시글=멤버, 출석 체크=운영진 또는 Space 리더.
- (Supabase RLS는 더 이상 사용 안 함 — 권한은 백엔드가 책임.)

## 11. 로드맵 (단계별)

| 단계 | 내용 | 주요 작업 |
|---|---|---|
| 0. 기반·인증·멤버(G) | 3레포 스캐폴딩, DB 스키마·users, 자체 JWT 인증(가입/로그인/리프레시), 멤버 관리, 앱 셸, 클라우드 배포 | NestJS+Kysely, Next.js, Railway/Vercel |
| 1. 활동공간 + 공지·게시판(C·D) | Space CRUD/제안/모집, 공지, 게시판·댓글, 프로젝트 개요·docs | REST CRUD, Tiptap |
| 2. 캘린더 + 출석(B·A) | 전체+Space 일정 통합 달력, 출석 체크 | FullCalendar |
| 3. 실시간 채팅 | 전체/Space 채널, presence | Socket.IO 게이트웨이 |
| 4. 파일/자료실(F) | 업로드/다운로드 | R2 presigned URL |
| 5. 음성통화 | Space별 음성방 | LiveKit (토큰 발급 + React SDK) |
| 6. (선택) 활동점수·랭킹(E) | 출석·참여 집계 | 집계 쿼리 |

순서 근거: 0번(레포·인증·DB·멤버)은 모든 것의 토대라 선행. 1~2번 핵심 도메인. 채팅(3)·파일(4)·음성(5)은 토대 위에 독립적으로 추가. 음성은 가장 무거워 후반.

## 12. 현실적 주의점

- **iOS PWA 제약**: 푸시·백그라운드 제한. 음성은 화면 활성 상태 위주. 필요 시 네이티브 앱 후속 검토.
- **백엔드 비용**: 모든 트래픽이 Railway 통과 → 무료/저가 티어 한도 모니터링. 음성 미디어는 LiveKit이 분담하므로 백엔드 부담은 주로 API·채팅.
- **시크릿 관리**: 환경변수만 사용.
- **YAGNI**: E(점수)는 선택, 0~5단계 실사용 후 추가.

## 13. 다음 단계

이 스펙 기준으로 **0단계(기반·인증·멤버) 상세 구현 계획**을 3레포에 걸쳐 작성한다. 각 후속 단계도 자체 계획 → 구현.
