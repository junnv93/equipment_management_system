FROM node:16-alpine

WORKDIR /app

# 의존성 설치만 수행
COPY package.json package-lock.json ./
RUN npm install

# 소스코드는 볼륨을 통해 마운트하므로 복사하지 않음
# 환경 변수 설정
ENV NODE_ENV=development
ENV CHOKIDAR_USEPOLLING=true
ENV WDS_SOCKET_PORT=0

# 포트 노출
EXPOSE 3000

# 개발 서버 실행
CMD ["npm", "start"] 