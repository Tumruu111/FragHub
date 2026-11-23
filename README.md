# Veritas Parfums

A shop for perfume decants. The admin lists a bottle (for example a 100ml
Dior Sauvage) and sets a price for each decant size (2, 5 and 10ml). All the
sizes draw from the ml left in the same bottle. Customers pay with QPay.

## Layout

| Path            | What it is                                          |
| --------------- | --------------------------------------------------- |
| `apps/api`      | Express + Apollo GraphQL + Prisma (Postgres) API    |
| `apps/frontend` | React + Vite + Tailwind shop and admin panel        |
| `deploy/`       | How to put it on a server (`DEPLOY.md`, Caddy, pm2) |

REST handles auth, payments and image uploads. GraphQL handles listings,
orders and the admin panel.

## Run it locally

You need Node 20+ and a Postgres database.

```sh
npm ci
cp apps/api/.env.example apps/api/.env   # then fill in the values
cd apps/api && npx prisma migrate deploy && cd ../..
npx nx serve @org/api                    # API on http://localhost:3333
npm run dev -w frontend                  # shop on http://localhost:5173
```

## Checks

CI runs these same checks:

```sh
npx nx format:check
npx nx run-many -t lint test build typecheck
```

The unit tests sit next to the code in `apps/api/src/lib/*.test.ts`.
