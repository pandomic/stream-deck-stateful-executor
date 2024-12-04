import streamDeck, { LogLevel } from "@elgato/streamdeck";

import { RequestExecutorAction } from "./actions/request";

// We can enable "trace" logging so that all messages between the Stream Deck, and the plugin are recorded. When storing sensitive information
streamDeck.logger.setLevel(LogLevel.DEBUG);

// Register the increment action.
streamDeck.actions.registerAction(new RequestExecutorAction());

// Finally, connect to the Stream Deck.
streamDeck.connect();
