"""Pruebas del chatbot: no usan la base de datos, Redis ni OpenAI.

Los ajustes exigen una llave y una base de datos al importar `app`; aquí se fijan valores falsos
(siempre, aunque el entorno tenga otros) para que ninguna prueba pueda consumir una llave real.
"""
import os

os.environ["OPENAI_API_KEY"] = "clave-falsa-para-pruebas"
os.environ["DATABASE_URL"] = "postgresql+asyncpg://prueba:prueba@localhost:5432/prueba"
os.environ.pop("REDIS_URL", None)
