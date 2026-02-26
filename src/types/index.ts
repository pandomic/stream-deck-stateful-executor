export type ActionType = 'request' | 'shortcut' | 'terminal' | 'script';

export type ExecutorSettings = {
  enable?: boolean;
  actionType: ActionType;
  requestMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  requestUrl?: string;
  requestHeaders?: string;
  requestBody?: string;

  shortcutName?: string;
  shortcutInput?: string;

  terminalCommand?: string;

  scriptPath?: string;
  scriptShellBinary?: string;
}

export type PollingExecutorSettings = ExecutorSettings & {
  interval?: number;
}

export type MatcherSettings = {
  field?: string;
  operator?: 'equals' | 'not_equals' | 'includes' | '>' | '<' | '>=' | '<=' | '=';
  value?: string;
  stateTitle?: string;
  stateIconPath?: string;
}

export type RequestExecutorSettings = {
  successTitle?: string;
  failedTitle?: string;

  pollingSettings?: PollingExecutorSettings;
  actionSettings?: ExecutorSettings;

  enableSuccessIndicator?: boolean;
};

export type RequestMatcherSettings = {
  customIcons?: {
    matched?: string;
    unmatched?: string;
    loading?: string;
  },
  customTitles?: {
    matched?: string;
    unmatched?: string;
    loading?: string;
  }

  pollingSettings?: PollingExecutorSettings;
  actionSettings?: ExecutorSettings;

  matchers?: Record<string, MatcherSettings>;

  enableSuccessIndicator?: boolean;
};
