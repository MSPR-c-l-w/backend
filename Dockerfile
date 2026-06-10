# syntax=docker/dockerfile:1

ARG NODE_VERSION=24.13.0

FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /usr/src/app
RUN corepack enable pnpm

# Étape build : TOUTES les dépendances (dev incluses), génération du client
# Prisma et compilation. Cette étape sert aussi d'image "seeder" : elle contient
# les sources TS, ts-node et @faker-js/faker nécessaires à `pnpm run prisma:seed`.
FROM base AS build
# Désactive husky (absent en prod, déclencherait une erreur dans prepare)
ENV HUSKY=0
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
COPY . .
RUN pnpm run prisma:generate
RUN pnpm run build

# Étape prod-deps : node_modules de production uniquement (devDependencies
# élaguées). Dérivée de `build` pour conserver le client Prisma déjà généré.
# --ignore-scripts : husky déjà neutralisé à ce stade.
FROM build AS prod-deps
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --prod --ignore-scripts

FROM base AS final

ENV NODE_ENV=production

USER node

COPY --chown=node:node package.json .
COPY --chown=node:node prisma.config.ts .
COPY --chown=node:node --from=prod-deps /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist
COPY --chown=node:node prisma ./prisma

EXPOSE 3001

CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/main.js"]
