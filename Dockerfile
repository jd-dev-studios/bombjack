# ─────────────────────────────────────────────────────────────────────────────
# Dockerfile
# ─────────────────────────────────────────────────────────────────────────────
# Multi-stage build:
#   Stage 1 (builder) — installs Node deps and runs `vite build`.
#   Stage 2 (runtime) — copies only the compiled dist/ into a lean nginx image.
#
# The final image contains no Node, no source code, and no node_modules —
# just nginx and the ~1.5 MB static bundle.
#
# Build:
#   docker build -t bombjack:latest .
#
# Run locally:
#   docker run --rm -p 8080:80 bombjack:latest
#   open http://localhost:8080
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests first so Docker can cache the npm install layer
# independently of source-code changes.
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# Copy the rest of the source and produce the optimised dist/.
COPY . .
RUN npm run build


# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Remove the default nginx placeholder site.
RUN rm -rf /usr/share/nginx/html/*

# Copy the compiled assets from the builder stage.
COPY --from=builder /app/dist /usr/share/nginx/html

# Drop the default nginx config and replace it with one tuned for a
# single-page application (all unknown paths → index.html).
COPY nginx.conf /etc/nginx/conf.d/default.conf

# nginx listens on 80 inside the container; the k8s Service maps this
# to whatever external port is needed.
EXPOSE 80

# nginx:alpine already sets the correct CMD; this is explicit documentation.
CMD ["nginx", "-g", "daemon off;"]
