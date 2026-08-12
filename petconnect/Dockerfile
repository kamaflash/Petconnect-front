FROM node:24-alpine AS build

WORKDIR /app

# Install dependencies (use package-lock if present)
COPY package*.json .npmrc ./
# Remove package-lock.json to regenerate it for this platform
RUN rm -f package-lock.json && npm install --legacy-peer-deps

# Copy sources and build
COPY . .
RUN npm run build -- --configuration=production

FROM nginx:alpine

# Copy build output from Angular
COPY --from=build /app/dist/petconnect /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --retries=3 CMD wget -q --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
