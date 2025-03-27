#equipment_management/settings.py
from pathlib import Path
from datetime import timedelta
import os
from dotenv import load_dotenv
from django.core.exceptions import ImproperlyConfigured

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY')

if not SECRET_KEY:
    raise ImproperlyConfigured("DJANGO_SECRET_KEY environment variable is not set")

DEBUG = True

# 환경 변수에서 허용된 호스트 목록을 가져옵니다
ALLOWED_HOSTS_ENV = os.getenv('DJANGO_ALLOWED_HOSTS', '')
if ALLOWED_HOSTS_ENV:
    ALLOWED_HOSTS = ALLOWED_HOSTS_ENV.split(',')
else:
    # 기본 허용 호스트
    ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# ngrok URL 직접 추가
ALLOWED_HOSTS.extend(['equipment-backend.ngrok-free.app', 'equipment-frontend.ngrok-free.app', '*'])

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'django_filters',
    'rest_framework_simplejwt',
    'equipment',
    'whitenoise.runserver_nostatic',  # Whitenoise 개발 서버 지원
    'debug_toolbar',  # Django Debug Toolbar
]

MIDDLEWARE = [
    'debug_toolbar.middleware.DebugToolbarMiddleware',  # Debug Toolbar는 가장 먼저
    'corsheaders.middleware.CorsMiddleware',  # CORS는 가장 먼저
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Whitenoise 미들웨어
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'equipment_management.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'equipment_management.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'equipment_db'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', 'postgres'),
        'HOST': os.getenv('DB_HOST', 'db'),
        'PORT': os.getenv('DB_PORT', '5432'),
        'CONN_MAX_AGE': 60,  # 연결 유지 시간(초)
        'OPTIONS': {
            'connect_timeout': 10,
        }
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'ko-kr'

TIME_ZONE = 'Asia/Seoul'

USE_I18N = True

USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# 기본 정적 파일 저장소 사용
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'
# WHITENOISE_MANIFEST_STRICT = False

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'equipment.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
}

# CORS 설정
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# CSRF 설정 강화
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:8000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8000',
    'https://equipment-frontend.ngrok-free.app',
    'https://equipment-backend.ngrok-free.app',
    'https://*.ngrok-free.app',
    'http://*.ngrok-free.app',
]

# CSRF 추가 설정
CSRF_COOKIE_SECURE = False
CSRF_COOKIE_SAMESITE = 'Lax'  # None에서 Lax로 변경
CSRF_COOKIE_HTTPONLY = False
CSRF_USE_SESSIONS = False  # 세션 대신 쿠키 사용
CSRF_COOKIE_NAME = 'csrftoken'
CSRF_HEADER_NAME = 'HTTP_X_CSRFTOKEN'  # 헤더 이름 설정
CSRF_COOKIE_DOMAIN = None  # 명시적으로 None 설정

# 세션 설정 개선
SESSION_COOKIE_SECURE = False  # ngrok 사용시 False로 설정
SESSION_COOKIE_SAMESITE = 'Lax'  # None에서 Lax로 변경
SESSION_COOKIE_HTTPONLY = False  # JavaScript에서 접근 허용

# Admin URL 설정
ADMIN_URL = 'admin/'

# Security 설정
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True
SECURE_SSL_REDIRECT = False

# X-Frame-Options 설정
X_FRAME_OPTIONS = 'SAMEORIGIN'
SECURE_HSTS_SECONDS = 0
SECURE_CONTENT_TYPE_NOSNIFF = False

# Debug Toolbar 설정
INTERNAL_IPS = [
    '127.0.0.1',
    'localhost',
]

# Debug Toolbar가 ngrok 환경에서도 표시되도록 설정
def show_toolbar(request):
    return True

DEBUG_TOOLBAR_CONFIG = {
    'SHOW_TOOLBAR_CALLBACK': 'equipment_management.settings.show_toolbar',
}

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'debug.log'),
        },
    },
    'root': {
        'handlers': ['file'],
        'level': 'DEBUG',
    },
}

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('EMAIL_HOST')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}

# 개발 환경에서도 CSRF 보호 유지
# if DEBUG:
#     MIDDLEWARE = [m for m in MIDDLEWARE if m != 'django.middleware.csrf.CsrfViewMiddleware']