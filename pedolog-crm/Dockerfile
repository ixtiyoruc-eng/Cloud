FROM node:22-alpine
ENV NODE_ENV=production TZ=Asia/Tashkent DATA_DIR=/data PORT=3000
RUN apk add --no-cache tzdata
WORKDIR /app
COPY package.json server.js ./
COPY public ./public
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME /data
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1
CMD ["node", "--disable-warning=ExperimentalWarning", "server.js"]
