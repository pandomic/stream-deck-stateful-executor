# Stream Deck Stateful Executor

Stateful Executor is the automation plugin for your Stream Deck, enabling execution of HTTP Requests, Apple Shortcuts, Terminal Commands, Shell Scripts with dynamic button state updates based on execution results.

## Installation

### Elgato Marketplace

1. Go to the Stateful Executor [page](https://marketplace.elgato.com/product/stateful-executor-e9612a4f-b8d7-44f8-a5ed-9ad9f9ae3064) on Elgato Marketplace.
2. Click on the "Get" button and follow the prompt to complete the installation.

### Manual Installation

1. Go to the [releases](https://github.com/pandomic/stream-deck-stateful-executor/releases) page.
2. Download the latest `.streamDeckPlugin` file.
3. Double-click the downloaded file to install it, by following the prompt.

## Configuration

### General Settings

* `Enable success indicator`: displays the default success indicator when the execution completes without errors. This indicator does take matchers into account.

Note that the error indicator is intentionally not configurable, as it is always shown when the execution fails.

### Icons and Titles

> TLDR; if you set icons/titles on the plugin level, make sure to leave the icons/titles empty in Stream Deck's UI (set to default)

> IMPORTANT: when using custom icons, place them in a permanent location, as they are referenced by path.

* If you pick an icon or a title using the default Stream Deck's UI, the first icon would represent the matched state, and the second icon would represent the unmatched state FOR ALL MATCHERS. Note that any customization made on the plugin level of the icons/titles would not work in this case.
* If you want to have more states just leave icons/titles blank (set to default) and configure them through the plugin's configuration.

### Actions

#### Action triggers

* `Click`: runs the action on button click
* `Polling`: runs the action every `n` seconds, where `n` is the polling interval. The polling action will wait the action to finish before running the next one.

You can combine both triggers, but polling will have a higher presentation priority.

#### Action types

* `request`: executes HTTP request. Use JSON-parsable output if you want to use matchers with requests.
* `shortcut (MacOS only)`: executes Apple Shortcut. Use `Dictionary` output if you want to use matchers with shortcuts.
* `terminal`: executes terminal command. Make sure to use JSON-parsable output if you want to use matchers with terminal commands.
* `script`: executes shell script. Make sure to use JSON-parsable output if you want to use matchers with shell scripts.
  * `shell binary`: the shell binary to use for executing the script. Defaults to `/bin/bash`. You can experiment with other binaries, such as python, node, etc.
  * `script path`: the path to the script to execute. The script should be executable and have the appropriate shebang.

### Matchers

> Matchers currently can only be used with JSON results. Ensure your actions produce JSON-parsable outputs.

* `Field`: dot-notated json path to the property used for matching. For example, if the output is `{"status": "ok"}`, the field would be `status`.
* `Operator`: the operator to use for matching. Note strings and numbers have different operators.
* `Value`: the value to match against.
* `State Title`: Custom title to use when the matcher is matched.
* `State Icon`: Custom icon path to use when the matcher is matched.
