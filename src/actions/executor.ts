import { listShortcuts, wait, renderTemplate } from '../utils';
import { ActionType, ExecutorSettings, RequestExecutorSettings } from '../types';
import { Executor, RequestExecutor, ScriptExecutor, ShortcutExecutor, TerminalExecutor } from '../executors';

const executors: Record<ActionType, Executor> = {
  request: new RequestExecutor(streamDeck.logger),
  script: new ScriptExecutor(streamDeck.logger),
  shortcut: new ShortcutExecutor(streamDeck.logger),
  terminal: new TerminalExecutor(streamDeck.logger),
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

const STATE_SUCCEEDED = 0;
const STATE_FAILED = 1;

@action({ UUID: "com.vlad-gramuzov.stream-deck-stateful-executor.executor" })
export class RequestExecutorAction extends SingletonAction<RequestExecutorSettings> {
  private pollingInProgress = false;

  override async onSendToPlugin(ev: SendToPluginEvent<JsonValue, RequestExecutorSettings>): Promise<void> {
    if ((ev.payload as any).event === UI_GET_SHORTCUTS_DATASOURCE) {
      streamDeck.ui.current?.sendToPropertyInspector({
        event: UI_GET_SHORTCUTS_DATASOURCE,
        items: listShortcuts(),
      })
    }
  }

  override async onWillAppear(ev: WillAppearEvent<RequestExecutorSettings>): Promise<void> {
    this.pollingInProgress = true;

    await this.startPolling(ev.action as KeyAction);
  }

  override onWillDisappear(ev: WillDisappearEvent<RequestExecutorSettings>): Promise<void> | void {
    this.pollingInProgress = false;
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

      if (!this.pollingInProgress) {
        break;
      }
    }
  }

  private async executeJob(action: KeyAction<RequestExecutorSettings>, executor: ExecutorSettings) {
    const settings = await action.getSettings();

    try {
      const output = await executors[executor.actionType].execute(executor);

      await this.setDefaultState(action, STATE_SUCCEEDED, output);

      if (settings?.enableSuccessIndicator) {
        await action.showOk();
      }
    } catch (e) {
      streamDeck.logger.error('Error executing job', e);
      await this.setDefaultState(action, STATE_FAILED);
      await action.showAlert();
    }
  }

  private async setDefaultState(action: KeyAction<RequestExecutorSettings>, state: number, result?: any) {
    const settings = await action.getSettings();

    await action.setState(state);

    if (state === STATE_SUCCEEDED) {
      await this.setTitle(action, settings.successTitle, result);
    }

    if (state === STATE_FAILED) {
      await this.setTitle(action, settings.failedTitle, result);
    }
  }

  private async setTitle(
    action: KeyAction<RequestExecutorSettings>,
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
