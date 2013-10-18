all: test

test: sanity
	NODE_ENV=test ./bin/ppunit -R list -R dependencies=graph.dot test/

test-cov: sanity
	NODE_ENV=test node node_modules/istanbul/lib/cli.js --print=detail cover \
		./bin/ppunit -- -R list test/

test-cov-html: sanity
	NODE_ENV=test node node_modules/istanbul/lib/cli.js --print=summary cover \
		./bin/ppunit -- -R list test/

	@echo ""
	@echo "****************************************************************************************"
	@echo "Results: file://$$PWD/coverage/lcov-report/index.html"
	@echo "****************************************************************************************"

sanity:
	node test/sanity.js

.PHONY: all test test-cov test-cov-html sanity
