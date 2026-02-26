import { ExecutorSettings } from '../types';

export type ExecutorResult = Record<string, any> | string | null | undefined;

export interface Executor {
  execute(settings: ExecutorSettings): Promise<ExecutorResult>;
}
