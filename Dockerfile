# syntax=docker/dockerfile:1

ARG NODE_VERSION=24.13.0

FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /usr/src/app
RUN corepack enable pnpm

FROM base AS build
# Désactive husky (absent en prod, déclencherait une erreur dans prepare)
ENV HUSKY=0
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
COPY . .
RUN pnpm run prisma:generate
RUN pnpm run build
# Élagage des devDependencies après build (--ignore-scripts : husky déjà supprimé à ce stade)
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --prod --ignore-scripts

FROM base AS final

ENV NODE_ENV=production

USER node

COPY --chown=node:node package.json .
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/main.js"]
