# ✦ FITCHECK
### The AI-Powered Personal Appearance Operating System

> *"The best-dressed person in the room isn't the one with the most clothes. It's the one who knows exactly what to wear."*

---

## What is FitCheck?

FitCheck is not a wardrobe app. FitCheck is the **AI-powered operating system for human appearance** — a category-defining platform that understands everything about what you own, how you wear it, and how you present yourself to the world.

Think:
- **Spotify Wrapped** for clothing
- **WHOOP** for personal style
- **Notion** for wardrobe management
- **Tesla Autopilot** for dressing

---

## Architecture

```
fitcheck/
├── apps/
│   ├── mobile/          # React Native + Expo (iOS/Android)
│   └── backend/         # Node.js + GraphQL + Apollo Server
├── packages/
│   ├── shared/          # Shared TypeScript types
│   └── ai/              # AI pipeline utilities
├── infrastructure/
│   ├── aws/             # Terraform (ECS, RDS, ElastiCache, S3, CloudFront)
│   └── docker/          # Local development
└── docs/                # Investor deck, growth strategy, ad campaigns
```

## Tech Stack

**Mobile:** React Native + Expo, Redux Toolkit, Moti/Reanimated 3
**Backend:** Node.js, Apollo GraphQL, Prisma + PostgreSQL (pgvector), Redis, Bull
**AI:** GPT-4o (styling + chat), text-embedding-3-large (style vectors), pgvector (semantic search)
**Infra:** AWS ECS Fargate, RDS PostgreSQL 16, ElastiCache Redis, S3 + CloudFront, Terraform

## Quick Start

```bash
yarn install
cp apps/backend/.env.example apps/backend/.env  # fill in keys
yarn infra:up          # start postgres + redis
yarn db:generate && yarn db:migrate && yarn db:seed
yarn backend           # http://localhost:4000/graphql
yarn mobile            # Expo dev server
```

## Subscription Tiers

| Tier | Price | Key Features |
|------|-------|-------------|
| **Free** | $0 | 50 items, basic suggestions |
| **Essential** | $9.99/mo | 200 items, daily AI outfits, analytics |
| **Style** | $24.99/mo | Unlimited, AI stylist chat, Style DNA, packing AI |
| **Luxe** | $79.99/mo | Everything + white-glove + creator dashboard |

---

**Know Yourself. Dress Accordingly.**

© 2025 FitCheck AI, Inc.