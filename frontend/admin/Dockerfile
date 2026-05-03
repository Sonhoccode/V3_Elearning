FROM node:20-alpine AS build

WORKDIR /app
COPY frontend/admin/package*.json /app/
RUN npm ci
COPY frontend/admin /app
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

FROM node:20-alpine

WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist /app/dist

ENV PORT=8080
CMD ["sh", "-c", "serve -s dist -l ${PORT:-8080}"]
