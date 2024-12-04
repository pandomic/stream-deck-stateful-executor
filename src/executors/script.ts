import { Logger } from '@elgato/streamdeck';
import { Executor } from './base';
import { ExecutorSettings } from "../types";
import {execSync} from "child_process";

export class ScriptExecutor implements Executor {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  public async execute(settings: ExecutorSettings): Promise<Record<string, any>> {
    this.validateSettings(settings);
    const output = this.executeScript(settings);
    return this.parseOutput(output);
  }

  private validateSettings(settings: ExecutorSettings) {
    if (!settings.scriptPath) {
      throw new Error('Script path is not provided');
    }
  }

  private executeScript(settings: ExecutorSettings): string | null | undefined {
    const binary = settings.scriptShellBinary ?? '/bin/sh';
    return execSync(`${binary} ${settings.scriptPath}`).toString().trim();
  }

  private async parseOutput(output: string | null | undefined): Promise<Record<string, any>> {
    this.logger.debug('Script output', output);
    return JSON.parse(output ?? '{}');
  }
}
