import { Logger } from '@elgato/streamdeck';
import { Executor } from './base';
import { ExecutorSettings } from "../types";
import {execSync} from "child_process";

export class TerminalExecutor implements Executor {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  public async execute(settings: ExecutorSettings): Promise<Record<string, any>> {
    this.validateSettings(settings);
    const output = this.executeCommand(settings);
    return this.parseOutput(output);
  }

  private validateSettings(settings: ExecutorSettings) {
    if (!settings.terminalCommand) {
      throw new Error('Terminal command is not provided');
    }
  }

  private executeCommand(settings: ExecutorSettings): string | null | undefined {
    return execSync(settings.terminalCommand as string).toString().trim();
  }

  private async parseOutput(output: string | null | undefined): Promise<Record<string, any>> {
    this.logger.debug('Terminal output', output);

    try {
      return JSON.parse(output ?? '{}');
    } catch (error) {
      this.logger.error('Failed to parse terminal output', error);
      return {};
    }
  }
}
