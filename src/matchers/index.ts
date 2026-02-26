import { get } from 'lodash';

import { MatcherSettings } from '../types';

// todo: move to shared types
export type ExecutorResult = Record<string, any> | string | null | undefined;

export interface Matcher {
  match(settings: MatcherSettings, output: ExecutorResult): boolean;
}

export type StringMatcherVariant = 'equals' | 'not_equals' | 'includes';
export class StringMatcher implements Matcher {
  private readonly variant: StringMatcherVariant;

  constructor(variant: StringMatcherVariant) {
    this.variant = variant;
  }

  public match(settings: MatcherSettings, output: ExecutorResult): boolean {
    const { field, value: expectedValue } = settings;
    const actualValue = typeof output === 'object' ? get(output, field as string) : output;

    if (this.variant === 'includes') {
      return actualValue?.includes(expectedValue);
    }
    if (this.variant === 'equals') {
      return expectedValue === actualValue;
    }
    if (this.variant === 'not_equals') {
      return expectedValue !== actualValue;
    }

    return false;
  }
}

export type NumericalMatcherVariant = '>' | '<' | '>=' | '<=' | '=';
export class NumericalMatcher implements Matcher {
  private readonly variant: NumericalMatcherVariant;

  constructor(variant: NumericalMatcherVariant) {
    this.variant = variant;
  }

  public match(settings: MatcherSettings, output: ExecutorResult): boolean {
    const { field, value: expectedValue } = settings;
    const actualValue = typeof output === 'object' ? get(output, field as string) : output;

    const expectedNumber = Number(expectedValue);
    const actualNumber = Number(actualValue);

    if (this.variant === '=') {
      return actualNumber === expectedNumber;
    }
    if (this.variant === '>') {
      return actualNumber > expectedNumber;
    }
    if (this.variant === '<') {
      return actualNumber < expectedNumber;
    }
    if (this.variant === '>=') {
      return actualNumber >= expectedNumber;
    }
    if (this.variant === '<=') {
      return actualNumber <= expectedNumber;
    }

    return false;
  }
}
