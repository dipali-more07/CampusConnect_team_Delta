.PHONY: install run run-docker stop-docker migrate makemigration test format

install:
	pip install -r requirements.txt

run:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

run-docker:
	docker compose up -d db
	sleep 3
	docker compose --profile migrate up migrate
	docker compose up api

stop-docker:
	docker compose down

migrate:
	alembic upgrade head

makemigration:
	alembic revision --autogenerate -m "$(MSG)"

test:
	pytest app/tests/ -v --tb=short

test-cov:
	pytest app/tests/ -v --cov=app --cov-report=html

format:
	black app/
	isort app/

db-reset:
	alembic downgrade base
	alembic upgrade head
