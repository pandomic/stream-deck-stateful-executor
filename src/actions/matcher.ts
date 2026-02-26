import { listShortcuts, wait, renderTemplate } from '../utils';
import { ActionType, ExecutorSettings, MatcherSettings, RequestMatcherSettings } from '../types';
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
  KeyDownEvent,
  SendToPluginEvent,
  SingletonAction,
  WillAppearEvent,
  WillDisappearEvent
} from "@elgato/streamdeck";

const UI_GET_SHORTCUTS_DATASOURCE = 'getShortcuts';
const TEMPLATE_ERROR_TITLE = 'Syntax!';

const STATE_MATCHED = 0;
const STATE_UNMATCHED = 1;

@action({ UUID: "com.vlad-gramuzov.stream-deck-stateful-executor.matcher" })
export class RequestMatcherAction extends SingletonAction<RequestMatcherSettings> {
  private pollingInProgress = false;

  override async onSendToPlugin(ev: SendToPluginEvent<JsonValue, RequestMatcherSettings>): Promise<void> {
    if ((ev.payload as any).event === UI_GET_SHORTCUTS_DATASOURCE) {
      streamDeck.ui.current?.sendToPropertyInspector({
        event: UI_GET_SHORTCUTS_DATASOURCE,
        items: listShortcuts(),
      })
    }
  }

  override async onWillAppear(ev: WillAppearEvent<RequestMatcherSettings>): Promise<void> {
    this.pollingInProgress = true;

    await this.setDefaultState(ev.action as KeyAction, STATE_MATCHED);
    await this.startPolling(ev.action as KeyAction);
  }

  override onWillDisappear(ev: WillDisappearEvent<RequestMatcherSettings>): Promise<void> | void {
    this.pollingInProgress = false;
  }

  override async onKeyDown(ev: KeyDownEvent<RequestMatcherSettings>): Promise<void> {
    const settings = await ev.action.getSettings();

    if (settings?.actionSettings?.enable) {
      await this.executeJob(ev.action, settings.actionSettings as ExecutorSettings);
    }
  }

  private async startPolling(action: KeyAction<RequestMatcherSettings>) {
    while (true) {
      const settings = await action.getSettings();

      if (settings?.pollingSettings?.enable) {
        await this.executeJob(action, settings.pollingSettings as ExecutorSettings);
      }

      streamDeck.logger.debug('Polling interval', settings.pollingSettings?.interval ?? 1);
      await wait((settings.pollingSettings?.interval ?? 1) * 1000);

      if (!this.pollingInProgress) {
        break;
      }
    }
  }

  private async executeJob(action: KeyAction<RequestMatcherSettings>, executor: ExecutorSettings) {
    const settings = await action.getSettings();

    await this.setLoadingState(action);

    let hasError = false;
    let matcher = null;
    let targetState = STATE_MATCHED;
    let output = null;

    try {
      output = await executors[executor.actionType].execute(executor);

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
      await this.setMatcherState(action, matcher, output);
    } else {
      await this.setDefaultState(action, targetState, output);
    }

    // show alerts after state changes completed
    if (hasError) {
      await action.showAlert();
    } else if (settings?.enableSuccessIndicator) {
      await action.showOk();
    }
  }

  private async findMatcherForOutput(
    settings: RequestMatcherSettings,
    output: any
  ) {
    return Object.values(settings.matchers ?? {}).find(matcher => {
      if (!matcher.operator) {
        return false;
      }

      return matchers[matcher.operator].match(matcher, output);
    });
  }

  private async setMatcherState(action: KeyAction<RequestMatcherSettings>, matcher: MatcherSettings, result?: any) {
    const settings = await action.getSettings();

    await action.setState(STATE_MATCHED);

    if (matcher.stateIconPath) {
      await action.setImage(matcher.stateIconPath);
    } else if (settings.customIcons?.matched) {
      await action.setImage(settings.customIcons.matched);
    }

    if (matcher.stateTitle) {
      await this.setTitle(action, matcher.stateTitle, result);
    } else if (settings.customTitles?.matched) {
      await this.setTitle(action, settings.customTitles?.matched, result);
    }
  }

  private async setDefaultState(action: KeyAction<RequestMatcherSettings>, state: number, result?: any) {
    const settings = await action.getSettings();

    await action.setState(state);

    if (state === STATE_MATCHED) {
      await action.setImage(settings.customIcons?.matched);
      await this.setTitle(action, settings.customTitles?.matched, result);
    }

    if (state === STATE_UNMATCHED) {
      await action.setImage(settings.customIcons?.unmatched);
      await this.setTitle(action, settings.customTitles?.unmatched, result);
    }
  }

  private async setLoadingState(action: KeyAction<RequestMatcherSettings>) {
    const settings = await action.getSettings();

    if (settings?.customTitles?.loading) {
      await this.setTitle(action, settings?.customTitles?.loading, {});
    }
    if (settings?.customIcons?.loading) {
      await action.setImage(settings?.customIcons?.loading);
    }
  }

  private async setTitle(
    action: KeyAction<RequestMatcherSettings>,
    title: string | null | undefined,
    result: string | number | boolean | Record<string, any> | null | undefined,
  ) {
    if (!title) {
      await action.setTitle();
      return;
    }

    try {
      const renderedTitle = renderTemplate(title, result);
      await action.setTitle(renderedTitle);
    } catch (e) {
      streamDeck.logger.debug('Error rendering title template', e);
      await action.setTitle(TEMPLATE_ERROR_TITLE);
      await action.showAlert();
    }
  }
}
