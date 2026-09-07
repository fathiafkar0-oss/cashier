FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY . .

EXPOSE 3000

# Jalankan dev server Vite pada port 3000
CMD ["npm", "run", "dev", "--", "--port", "3000"]
