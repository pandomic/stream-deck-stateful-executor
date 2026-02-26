install:
	npm install -g @elgato/cli@latest;
	npm install;

build-templates:
	npx mustache \
 	-p src/ui/common/action_settings_template.mustache \
 	-p src/ui/matcher/matcher.mustache \
 	src/ui/matcher/data.json src/ui/matcher/layout.mustache \
 	> com.vlad-gramuzov.stream-deck-stateful-executor.sdPlugin/ui/matcher.html;
	npx mustache \
 	-p src/ui/common/action_settings_template.mustache \
 	src/ui/executor/data.json src/ui/executor/layout.mustache \
 	> com.vlad-gramuzov.stream-deck-stateful-executor.sdPlugin/ui/executor.html;

validate:
	streamdeck validate com.vlad-gramuzov.stream-deck-stateful-executor.sdPlugin;

build: build-templates
	npm run build;
	rm -f com.vlad-gramuzov.stream-deck-stateful-executor.streamDeckPlugin;
	streamdeck pack com.vlad-gramuzov.stream-deck-stateful-executor.sdPlugin;

.PHONY: install build-templates build
