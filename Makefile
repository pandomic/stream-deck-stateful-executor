install:
	npm install -g @elgato/cli@latest;
	npm install;

build-templates:
	npx mustache \
 	-p src/ui/action_settings_template.mustache \
 	-p src/ui/matcher_template.mustache \
 	src/ui/data.json src/ui/execution_template.mustache \
 	> com.vlad-gramuzov.stream-deck-stateful-executor.sdPlugin/ui/execution.html;

validate:
	streamdeck validate com.vlad-gramuzov.stream-deck-stateful-executor.sdPlugin;

build: build-templates
	npm run build;
	streamdeck pack com.vlad-gramuzov.stream-deck-stateful-executor.sdPlugin;

.PHONY: install build-templates build
