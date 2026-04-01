FROM node:20-bookworm-slim AS web-builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED="1"

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable

WORKDIR /app

COPY web/ ./

RUN pnpm install --frozen-lockfile \
  && pnpm exec prisma generate \
  && pnpm build


FROM node:20-bookworm-slim AS web

ENV NODE_ENV="production"
ENV NEXT_TELEMETRY_DISABLED="1"
ENV HOSTNAME="0.0.0.0"
ENV PORT="3000"

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=web-builder /app/.next/standalone ./
COPY --from=web-builder /app/.next/static ./.next/static
COPY --from=web-builder /app/public ./public

RUN mkdir -p /app/.next/cache \
  && touch /app/.env \
  && chown -R node:node /app

USER node

EXPOSE 3000

CMD ["node", "server.js"]


FROM python:3.12-slim-bookworm AS dashboard

ENV PYTHONDONTWRITEBYTECODE="1"
ENV PYTHONUNBUFFERED="1"
ENV HOME="/home/app"
ENV MAMBA_ROOT_PREFIX="/home/app/.local/share/micromamba"
ENV BOOK_GENERATOR_ENV_NAME="book-generator"
ENV BOOK_GENERATOR_ENV_PREFIX="/home/app/.local/share/micromamba/envs/book-generator"

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    bash \
    ca-certificates \
    curl \
    jq \
    libxml2-utils \
  && rm -rf /var/lib/apt/lists/*

RUN if ! getent group 1000 >/dev/null; then groupadd --gid 1000 app; fi \
  && if ! id -u 1000 >/dev/null 2>&1; then useradd --uid 1000 --gid 1000 --create-home --shell /bin/bash app; fi

WORKDIR /app

COPY dashboard_server.py ./
COPY *.sh ./
COPY scripts ./scripts
COPY docker/dashboard-entrypoint.sh /usr/local/bin/dashboard-entrypoint.sh

RUN python3 -m venv "$BOOK_GENERATOR_ENV_PREFIX" \
  && "$BOOK_GENERATOR_ENV_PREFIX/bin/pip" install --no-cache-dir --upgrade pip \
  && "$BOOK_GENERATOR_ENV_PREFIX/bin/pip" install --no-cache-dir \
    beautifulsoup4 \
    pillow \
    requests \
  && find /app -type f -name "*.sh" -exec chmod +x {} + \
  && chmod +x /usr/local/bin/dashboard-entrypoint.sh \
  && mkdir -p /app/book_outputs /app/multi_provider_logs /app/dashboard \
  && chown -R 1000:1000 /app /home/app

USER app

EXPOSE 8765

ENTRYPOINT ["dashboard-entrypoint.sh"]
