# Armut API (Express + SQLite).
#
# better-sqlite3 is a native module: build it against the same Alpine/Node as
# the runtime, then copy the compiled node_modules across.
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=4000 HOST=0.0.0.0 DATA_DIR=/data UPLOAD_DIR=/uploads
RUN addgroup -g 1001 -S nodejs && adduser -S armut -u 1001 \
 && mkdir -p /data /uploads && chown -R armut:nodejs /data /uploads
COPY --from=deps --chown=armut:nodejs /app/node_modules ./node_modules
COPY --chown=armut:nodejs package.json ./
COPY --chown=armut:nodejs src ./src
USER armut
EXPOSE 4000
VOLUME ["/data", "/uploads"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "src/server.js"]
