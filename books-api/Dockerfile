# ---------- Stage 1: base (shared by the other stages) ----------
# Pinned, small official Node.js image (Alpine Linux)
FROM node:22-alpine AS base
WORKDIR /app
# Copy ONLY the dependency list first so Docker can cache "npm ci"
COPY package.json package-lock.json ./

# ---------- Stage 2: test (used by Jenkins: docker build --target test) ----------
FROM base AS test
# Install ALL dependencies, including Jest and Supertest
RUN npm ci
# Now copy the source code and tests
COPY . .
# Run the tests. If any test fails, this build FAILS.
RUN npm test

# ---------- Stage 3: production (the image we actually run) ----------
FROM base AS production
ENV NODE_ENV=production
# Install only the dependencies needed to run (no Jest)
RUN npm ci --omit=dev && npm cache clean --force
# Copy only the application code (no tests)
COPY src ./src
# Run as the built-in non-root "node" user
USER node
# Document the port the API listens on
EXPOSE 3001
# Docker checks /health every 10s; 3 failures = "unhealthy"
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3001/health || exit 1
CMD ["node", "src/server.js"]
