all: test

test:
	NODE_ENV=test ./bin/ppunit -R list test/

test-cov:
	NODE_ENV=test node node_modules/istanbul/lib/cli.js --print=detail cover \
		./bin/ppunit -- -R list test/

test-cov-html:
	NODE_ENV=test node node_modules/istanbul/lib/cli.js --print=summary cover \
		./bin/ppunit -- -R list test/

	@echo ""
	@echo "****************************************************************************************"
	@echo "Results: file://$$PWD/coverage/lcov-report/index.html"
	@echo "****************************************************************************************"

.PHONY: all test test-cov test-cov-html
