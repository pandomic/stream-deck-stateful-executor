import tempfile from 'tempfile'
import { Logger } from '@elgato/streamdeck'
import { readFileSync, unlinkSync, writeFileSync } from 'fs'
import { execSync } from 'child_process';

import { Executor } from './base';
import { ExecutorSettings } from '../types';

export class ShortcutExecutor implements Executor {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  public async execute(settings: ExecutorSettings): Promise<Record<string, any>> {
    this.validateSettings(settings);

    const { inputFilePath, outputFilePath } = this.createTempFiles();

    this.writeInputToFile(inputFilePath, settings.shortcutInput);
    this.executeShortcut(inputFilePath, outputFilePath, settings.shortcutName as string);

    const output = this.readOutputFromFile(outputFilePath);

    this.deleteTempFiles(inputFilePath, outputFilePath);

    return output;
  }

  private validateSettings(settings: ExecutorSettings) {
    if (!settings.shortcutName) {
      throw new Error('Shortcut name is not provided');
    }
  }

  private createTempFiles() {
    const inputFilePath = tempfile();
    const outputFilePath = tempfile();
    return { inputFilePath, outputFilePath };
  }

  private writeInputToFile(inputFilePath: string, input: string | null | undefined) {
    if (!input) {
      return;
    }

    this.logger.debug(`Writing shortcut input to ${inputFilePath}`);
    writeFileSync(inputFilePath, input);
  }

  private executeShortcut(inputFilePath: string, outputFilePath: string, shortcutName: string) {
    try {
      this.logger.debug(`shortcuts run "${shortcutName}" --input-path ${inputFilePath} --output-path ${outputFilePath}`);
      execSync(`shortcuts run "${shortcutName}" --input-path ${inputFilePath} --output-path ${outputFilePath}`);
    } catch (e) {
      this.logger.error(e);
      throw new Error('Error executing shortcut');
    }
  }

  private readOutputFromFile(outputFilePath: string) {
    const output = readFileSync(outputFilePath).toString();
    this.logger.debug('Shortcut output', output);

    let jsonOutput = {};

    try {
      jsonOutput = JSON.parse(output);
    } catch (e) {
      this.logger.debug('Unable to parse shortcut output as json');
    }

    return jsonOutput;
  }

  private deleteTempFiles(inputFilePath: string, outputFilePath: string) {
    try {
      unlinkSync(inputFilePath);
      unlinkSync(outputFilePath);
    } catch (e) {
      this.logger.error('Error deleting temp files', e);
    }
  }
}
