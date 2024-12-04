import { listShortcuts, wait } from '../utils';
import { ActionType, ExecutorSettings, PollingExecutorSettings, MatcherSettings } from '../types';
import { Executor, RequestExecutor, ScriptExecutor, ShortcutExecutor, TerminalExecutor } from '../executors';
import { Matcher, StringMatcher, NumericalMatcher, StringMatcherVariant, NumericalMatcherVariant } from '../matchers';

const executors: Record<ActionType, Executor> = {
  request: new RequestExecutor(streamDeck.logger),
  script: new ScriptExecutor(streamDeck.logger),
  shortcut: new ShortcutExecutor(streamDeck.logger),
  terminal: new TerminalExecutor(streamDeck.logger),
};

const matchers: Record<StringMatcherVariant | NumericalMatcherVariant, Matcher> = {
  equals: new StringMatcher('equals'),
  not_equals: new StringMatcher('not_equals'),
  includes: new StringMatcher('includes'),
  '>': new NumericalMatcher('>'),
  '<': new NumericalMatcher('<'),
  '>=': new NumericalMatcher('>='),
  '<=': new NumericalMatcher('<='),
  '=': new NumericalMatcher('='),
};

import streamDeck, {
  action,
  KeyAction,
  JsonValue,
  KeyDownEvent, SendToPluginEvent,
  SingletonAction,
  WillAppearEvent
} from "@elgato/streamdeck";

const UI_GET_SHORTCUTS_DATASOURCE = 'getShortcuts';

const STATE_MATCHED = 0;
const STATE_UNMATCHED = 1;

@action({ UUID: "com.vlad-gramuzov.stream-deck-stateful-executor.execution" })
export class RequestExecutorAction extends SingletonAction<RequestExecutorSettings> {
  override async onSendToPlugin(ev: SendToPluginEvent<JsonValue, RequestExecutorSettings>): Promise<void> {
    if ((ev.payload as any).event === UI_GET_SHORTCUTS_DATASOURCE) {
      streamDeck.ui.current?.sendToPropertyInspector({
        event: UI_GET_SHORTCUTS_DATASOURCE,
        items: listShortcuts(),
      })
    }
  }

  override async onWillAppear(ev: WillAppearEvent<RequestExecutorSettings>): Promise<void> {
    await this.setDefaultState(ev.action as KeyAction, STATE_MATCHED);
    await this.startPolling(ev.action as KeyAction);
  }

  override async onKeyDown(ev: KeyDownEvent<RequestExecutorSettings>): Promise<void> {
    const settings = await ev.action.getSettings();

    if (settings?.actionSettings?.enable) {
      await this.executeJob(ev.action, settings.actionSettings as ExecutorSettings);
    }
  }

  private async startPolling(action: KeyAction<RequestExecutorSettings>) {
    while (true) {
      const settings = await action.getSettings();

      if (settings?.pollingSettings?.enable) {
        await this.executeJob(action, settings.pollingSettings as ExecutorSettings);
      }

      streamDeck.logger.debug('Polling interval', settings.pollingSettings?.interval ?? 1);
      await wait((settings.pollingSettings?.interval ?? 1) * 1000);
    }
  }

  private async executeJob(action: KeyAction<RequestExecutorSettings>, executor: ExecutorSettings) {
    const settings = await action.getSettings();

    await this.setLoadingState(action);

    let hasError = false;
    let matcher = null;
    let targetState = STATE_MATCHED;

    try {
      const output = await executors[executor.actionType].execute(executor);

      if (Object.values(settings?.matchers ?? {}).length > 0) {
        matcher = await this.findMatcherForOutput(settings, output);
        targetState = matcher ? STATE_MATCHED : STATE_UNMATCHED;
      }
    } catch (e) {
      streamDeck.logger.error('Error executing job', e);
      hasError = true;
      targetState = STATE_UNMATCHED;
    }

    if (matcher) {
      await this.setMatcherState(action, matcher);
    } else {
      await this.setDefaultState(action, targetState);
    }

    // show alerts after state changes completed
    if (hasError) {
      await action.showAlert();
    } else if (settings?.enableSuccessIndicator) {
      await action.showOk();
    }
  }

  private async findMatcherForOutput(
    settings: RequestExecutorSettings,
    output: any
  ) {
    return Object.values(settings.matchers ?? {}).find(matcher => {
      if (!matcher.operator) {
        return false;
      }

      return matchers[matcher.operator].match(matcher, output);
    });
  }

  private async setMatcherState(action: KeyAction<RequestExecutorSettings>, matcher: MatcherSettings) {
    await this.setDefaultState(action, STATE_MATCHED);

    if (matcher.stateTitle) {
      await action.setTitle(matcher.stateTitle);
    }
    if (matcher.stateIconPath) {
      await action.setImage(matcher.stateIconPath);
    }
  }

  private async setDefaultState(action: KeyAction<RequestExecutorSettings>, state: number) {
    const settings = await action.getSettings();

    await action.setState(state);

    if (state === STATE_MATCHED) {
      await action.setImage(settings.customIcons?.matched);
      await action.setTitle(settings.customTitles?.matched);
    }

    if (state === STATE_UNMATCHED) {
      await action.setImage(settings.customIcons?.unmatched);
      await action.setTitle(settings.customTitles?.unmatched);
    }
  }

  private async setLoadingState(action: KeyAction<RequestExecutorSettings>) {
    const settings = await action.getSettings();

    if (settings?.customTitles?.loading) {
      await action.setTitle(settings?.customTitles?.loading);
    }
    if (settings?.customIcons?.loading) {
      await action.setImage(settings?.customIcons?.loading);
    }
  }
}

type RequestExecutorSettings = {
  customIcons?: {
    matched?: string;
    unmatched?: string;
    loading?: string;
  },
  customTitles: {
    matched?: string;
    unmatched?: string;
    loading?: string;
  }

  pollingSettings?: PollingExecutorSettings;
  actionSettings?: ExecutorSettings;

  matchers?: Record<string, MatcherSettings>;

  enableSuccessIndicator?: boolean;
};
