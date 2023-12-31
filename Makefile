SHELL = /bin/bash
.SHELLFLAGS = -o pipefail -c

all: build

.PHONY: help
help: ## Print info about all commands
	@echo "Commands:"
	@echo
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "    \033[01;32m%-20s\033[0m %s\n", $$1, $$2}'

.PHONY: build
build: ## Build all executables
	deno run --allow-read --allow-write src/compile.js
b:
	@make build

.PHONY: format
format: ## Format the code
	deno fmt src/*.js

f:
	@make format