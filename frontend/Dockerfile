FROM node:18

WORKDIR /app

COPY package.json .
RUN npm config set registry https://registry.npmjs.org/
RUN npm install --legacy-peer-deps --fetch-retries=5 --fetch-retry-mintimeout=20000

COPY . .

CMD ["npx", "vite", "--port", "5173", "--host"]
