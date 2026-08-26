import os

os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("AUTH0_DOMAIN", "test.example.auth0.com")
os.environ.setdefault("AUTH0_AUDIENCE", "https://api.test.lifeops")
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://lifeops:lifeops@localhost:5432/lifeops_test")
