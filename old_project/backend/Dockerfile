FROM python:3.10-slim

WORKDIR /app

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# 필요한 Python 패키지 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 소스코드는 볼륨을 통해 마운트하므로 복사하지 않음

# 환경 변수 설정
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 포트 노출
EXPOSE 8000

# 개발 서버 실행 (자동 리로딩)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"] 