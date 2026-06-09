import os
from pathlib import Path
from django.core.management.utils import get_random_secret_key

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY') or get_random_secret_key()

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['*']

AUTH_USER_MODEL = 'usuarios.Usuario'

MICROSOFT_CLIENT_ID = os.getenv('MICROSOFT_CLIENT_ID', '')
MICROSOFT_CLIENT_SECRET = os.getenv('MICROSOFT_CLIENT_SECRET', '')
MICROSOFT_TENANT = os.getenv('MICROSOFT_TENANT', 'common')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173').rstrip('/')
MICROSOFT_OAUTH_ENABLED = bool(MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET)
RECAPTCHA_SITE_KEY = os.getenv('RECAPTCHA_SITE_KEY', '')
RECAPTCHA_SECRET_KEY = os.getenv('RECAPTCHA_SECRET_KEY', '')
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
    'mysite.csrf_protection.JSONCsrfMiddleware',
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

DB_NAME = os.getenv('DB_NAME', 'mypostgresdb')
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_HOST = os.getenv('DB_HOST', 'db')
DB_PORT = os.getenv('DB_PORT', '5432')

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": DB_NAME,
        "USER": DB_USER,
        "PASSWORD": DB_PASSWORD,
        "HOST": DB_HOST,
        "PORT": DB_PORT,
    }
}

# Cache (para bloqueo de intentos de login en entorno local)
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "sihul-auth-lockout",
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
        r'C:\Users\Harlem Hernandez\Documents\Trabajo - UL\Projects\Financiero Facturas',
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
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "https://sihul.unilibre.edu.co",
]

CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "https://sihul.unilibre.edu.co",
]

SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'

# DRF Throttling configurable por entorno
API_THROTTLE_USER = os.getenv('API_THROTTLE_USER', '200/min')
API_THROTTLE_ANON = os.getenv('API_THROTTLE_ANON', '50/min')

REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'mysite.seccional_auth.SessionUsuarioAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.AnonRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'user': API_THROTTLE_USER,
        'anon': API_THROTTLE_ANON,
    },
}

X_FRAME_OPTIONS = 'SAMEORIGIN'

# ETL configurations
ETL_PERIODO = os.getenv('ETL_PERIODO', '20261')

# Endurecimiento de Producción (activado si ENVIRONMENT/DJANGO_ENV=production)
ENVIRONMENT = (os.getenv('ENVIRONMENT') or os.getenv('DJANGO_ENV') or 'development').lower()
if ENVIRONMENT == 'production':
    DEBUG = False

    # ALLOWED_HOSTS desde env o dominio por defecto
    _env_hosts = os.getenv('ALLOWED_HOSTS', '')
    if _env_hosts:
        ALLOWED_HOSTS = [h.strip() for h in _env_hosts.split(',') if h.strip()]
    else:
        ALLOWED_HOSTS = ['sihul.unilibre.edu.co']

    # Cookies seguras y redirección a HTTPS
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = True

    # HSTS y headers de seguridad
    SECURE_HSTS_SECONDS = int(os.getenv('SECURE_HSTS_SECONDS', '31536000'))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

    # CORS y CSRF Trusted Origins desde env
    _env_cors = os.getenv('CORS_ALLOWED_ORIGINS', '')
    if _env_cors:
        CORS_ALLOWED_ORIGINS = [o.strip().rstrip('/') for o in _env_cors.split(',') if o.strip()]
    _env_csrf = os.getenv('CSRF_TRUSTED_ORIGINS', '')
    if _env_csrf:
        CSRF_TRUSTED_ORIGINS = [o.strip().rstrip('/') for o in _env_csrf.split(',') if o.strip()]
    else:
        # Derivar de ALLOWED_HOSTS si no se provee lista explícita
        CSRF_TRUSTED_ORIGINS = [
            (f"https://{h}" if not h.startswith('http') else h).rstrip('/')
            for h in ALLOWED_HOSTS if h != '*'
        ]

    # Requerir SECRET_KEY definido por entorno en producción
    if not os.getenv('DJANGO_SECRET_KEY'):
        raise RuntimeError('DJANGO_SECRET_KEY debe estar definido en producción')

