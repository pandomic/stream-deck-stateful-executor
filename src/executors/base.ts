import { ExecutorSettings } from '../types';

export interface Executor {
  execute(settings: ExecutorSettings): Promise<Record<string, any>>;
}
