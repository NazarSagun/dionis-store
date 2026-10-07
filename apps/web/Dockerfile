FROM node:20-alpine
WORKDIR /app

ENV COREPACK_HOME=/opt/corepack
RUN corepack enable && corepack prepare pnpm@8.9.0 --activate

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/web ./apps/web

RUN pnpm install --frozen-lockfile

# NEXT_PUBLIC_* values are inlined into the browser bundle at build time, so
# they are build arguments, not runtime variables.
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
RUN pnpm --filter web build

ENV NODE_ENV=production HOSTNAME=0.0.0.0
WORKDIR /app/apps/web
# Standalone output keeps the monorepo layout, so static files are copied beside server.js.
RUN cp -r .next/static .next/standalone/apps/web/.next/static \
 && cp -r public .next/standalone/apps/web/public
# Next writes its image cache under .next at run time. The build ran as root; the app does not need to.
RUN chown -R node:node .next
USER node
EXPOSE 3000
CMD ["node", ".next/standalone/apps/web/server.js"]
