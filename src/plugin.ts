import streamDeck, { LogLevel } from "@elgato/streamdeck";

import { RequestExecutorAction, RequestMatcherAction } from "./actions";

streamDeck.logger.setLevel(LogLevel.INFO);

streamDeck.actions.registerAction(new RequestExecutorAction());
streamDeck.actions.registerAction(new RequestMatcherAction());

streamDeck.connect();
