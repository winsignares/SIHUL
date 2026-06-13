import os
from pathlib import Path


def env_bool(name, default=False):
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {'1', 'true', 'yes', 'y', 'on'}


def env_list(name, default):
    value = os.getenv(name)
    if not value:
        return list(default)
    return [item.strip() for item in value.split(',') if item.strip()]

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv(
    'DJANGO_SECRET_KEY',
    'django-insecure-6vspu_xp0x41924(a&3!5kkn35+pew*ckujv96vwyq$m*uzz_l',
)

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env_bool('DJANGO_DEBUG', True)

ALLOWED_HOSTS = env_list('DJANGO_ALLOWED_HOSTS', ['*'])

AUTH_USER_MODEL = 'usuarios.Usuario'

MICROSOFT_CLIENT_ID = os.getenv('MICROSOFT_CLIENT_ID', '')
MICROSOFT_CLIENT_SECRET = os.getenv('MICROSOFT_CLIENT_SECRET', '')
MICROSOFT_TENANT = os.getenv('MICROSOFT_TENANT', 'common')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173').rstrip('/')
MICROSOFT_OAUTH_ENABLED = bool(MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET)
CHATBOT_FASTAPI_URL = os.getenv('CHATBOT_FASTAPI_URL', 'http://chatbot:8001/api/v1').rstrip('/')


# Application definition

INSTALLED_APPS = [
    'mysite.apps.MysiteConfig',  # App principal del proyecto
    'horario',
    'usuarios',
    'componentes',
    'sedes',
    'facultades',
    'programas',
    'periodos',
    'grupos',
    'asignaturas',
    'espacios',
    'recursos',
    'prestamos',
    'chatbot',
    'notificaciones',
    'financiero',  # App nueva para gestión financiera
    'rest_framework',
    'corsheaders',
    'django_filters',  # Para filtrados en API
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

if MICROSOFT_OAUTH_ENABLED:
    INSTALLED_APPS += [
        'django.contrib.sites',
        'allauth',
        'allauth.account',
        'allauth.socialaccount',
        'allauth.socialaccount.providers.microsoft',
    ]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'mysite.middleware.SedeFilterMiddleware',  # Middleware para filtrado por sede
]

if MICROSOFT_OAUTH_ENABLED:
    MIDDLEWARE.insert(MIDDLEWARE.index('django.contrib.messages.middleware.MessageMiddleware'), 'allauth.account.middleware.AccountMiddleware')

ROOT_URLCONF = 'mysite.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'mysite.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME", "mypostgresdb"),
        "USER": os.getenv("DB_USER", "postgres"),
        "PASSWORD": os.getenv("DB_PASSWORD", "mysecretpassword"),
        "HOST": os.getenv("DB_HOST", "db"),
        "PORT": os.getenv("DB_PORT", "5432"),
    }
}

# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

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


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'America/Bogota'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = 'static/'

# Media files (user-uploaded content)
MEDIA_URL = '/media/'
MEDIA_ROOT = Path(
    os.getenv(
        'FINANCIERO_DOCUMENT_ROOT',
        '/tmp/sihul_uploads',
    )
)
FINANCIERO_DOCUMENT_NETWORK_ROOT = os.getenv('FINANCIERO_DOCUMENT_NETWORK_ROOT', '')
FINANCIERO_DOCUMENT_NETWORK_USER = os.getenv('FINANCIERO_DOCUMENT_NETWORK_USER', '')
FINANCIERO_DOCUMENT_NETWORK_PASSWORD = os.getenv('FINANCIERO_DOCUMENT_NETWORK_PASSWORD', '')

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

SITE_ID = 1

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
]

if MICROSOFT_OAUTH_ENABLED:
    AUTHENTICATION_BACKENDS.append('allauth.account.auth_backends.AuthenticationBackend')

if MICROSOFT_OAUTH_ENABLED:
    ACCOUNT_USER_MODEL_USERNAME_FIELD = None
    ACCOUNT_USERNAME_REQUIRED = False
    ACCOUNT_EMAIL_REQUIRED = True
    ACCOUNT_UNIQUE_EMAIL = True
    ACCOUNT_USER_MODEL_EMAIL_FIELD = 'correo'

    SOCIALACCOUNT_AUTO_SIGNUP = True
    SOCIALACCOUNT_LOGIN_ON_GET = True
    SOCIALACCOUNT_ADAPTER = 'mysite.social_adapter.SocialAccountAdapter'

    SOCIALACCOUNT_PROVIDERS = {
        'microsoft': {
            'TENANT': MICROSOFT_TENANT,
            'APP': {
                'client_id': MICROSOFT_CLIENT_ID,
                'secret': MICROSOFT_CLIENT_SECRET,
                'key': '',
            },
            'SCOPE': ['openid', 'email', 'profile', 'User.Read'],
            'AUTH_PARAMS': {'prompt': 'select_account'},
        }
    }

    ACCOUNT_LOGIN_REDIRECT_URL = '/api/auth/login-success/'
    ACCOUNT_LOGOUT_REDIRECT_URL = f'{FRONTEND_URL}/login'

# CORS Configuration
CORS_ALLOWED_ORIGINS = env_list('CORS_ALLOWED_ORIGINS', [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://sihul.unilibre.edu.co",
])

CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = env_list('CSRF_TRUSTED_ORIGINS', [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://sihul.unilibre.edu.co",
])

SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_NAME = os.getenv('SESSION_COOKIE_NAME', 'sessionid')
CSRF_COOKIE_NAME = os.getenv('CSRF_COOKIE_NAME', 'csrftoken')

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'mysite.seccional_auth.SessionUsuarioAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

X_FRAME_OPTIONS = 'SAMEORIGIN'

# ETL configurations
ETL_PERIODO = os.getenv('ETL_PERIODO', '20261')
