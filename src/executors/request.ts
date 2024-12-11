import { Logger } from '@elgato/streamdeck';
import { Executor } from './base';
import { ExecutorSettings } from "../types";

export class RequestExecutor implements Executor {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  public async execute(settings: ExecutorSettings): Promise<Record<string, any>> {
    this.validateSettings(settings);

    const response = await this.makeRequest(settings);

    this.validateResponse(response);

    return this.parseResponse(response);
  }

  private validateSettings(settings: ExecutorSettings) {
    if (!settings.requestUrl) {
      throw new Error('Request URL is not provided');
    }
  }

  private validateResponse(response: Response) {
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
  }

  private makeRequest(settings: ExecutorSettings) {
    return fetch(settings.requestUrl as string, {
      method: settings.requestMethod ?? 'GET',
      headers: JSON.parse(settings.requestHeaders ?? '{}'),
      body: settings.requestBody,
    });
  }

  private async parseResponse(response: Response): Promise<Record<string, any>> {
    const json = await response.json();
    this.logger.debug('Request response', json);
    return json as Record<string, any>;
  }
}
