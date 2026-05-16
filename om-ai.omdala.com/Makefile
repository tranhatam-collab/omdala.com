.PHONY: install dev ci build test up down logs

install:
	npm install
	npm --prefix backend install
	npm --prefix web install
	npm --prefix gateway install

dev:
	npm run dev:all

ci:
	npm run ci

build:
	npm run build:all

test:
	npm --prefix backend run test

up:
	docker compose up --build -d

down:
	docker compose down

logs:
	docker compose logs -f
