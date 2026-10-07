FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache openssl
# A shared corepack folder, so the non-root user below finds pnpm without a download.
ENV COREPACK_HOME=/opt/corepack
RUN corepack enable && corepack prepare pnpm@8.9.0 --activate

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN pnpm install --frozen-lockfile
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api build

WORKDIR /app/apps/api
# The build ran as root. The app itself does not need to.
USER node
EXPOSE 3500
CMD ["node", "dist/main.js"]
