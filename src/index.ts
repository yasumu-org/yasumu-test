/// <reference path="./_common.ts" />

(() => {
  const isTestEnvironment = Yasumu.features.test;

  // we dont want to expose the testing API unless we are in a test environment
  if (!isTestEnvironment) {
    const noop = () => {};

    Object.assign(globalThis, {
      test: noop,
      expect: noop,
    });

    return;
  }

  const warnLog = (arg: string) =>
    Yasumu.context.__meta.console.push({
      type: 'warn',
      args: [arg],
      timestamp: Date.now(),
      test: true,
    });
  const writeSuccess = (arg: string) =>
    Yasumu.context.__meta.console.push({
      type: 'log',
      args: [arg],
      timestamp: Date.now(),
      test: true,
    });
  const writeError = (arg: string) =>
    Yasumu.context.__meta.console.push({
      type: 'error',
      args: [arg],
      timestamp: Date.now(),
      test: true,
    });

  const YASUMU_ASSERTION_ERROR = 'YasumuAssertionError';
  const TEST_CONTEXT_THROWAWAY_ERROR = 'TestContextThrowawayError';

  class YasumuAssertionError extends Error {
    public constructor(message: string) {
      super(message);
      this.name = YASUMU_ASSERTION_ERROR;
    }
  }

  class TestContextThrowawayError extends Error {
    public constructor(message: string) {
      super(message);
      this.name = TEST_CONTEXT_THROWAWAY_ERROR;
    }
  }

  function compareDeep(a: any, b: any): boolean {
    if (a === b) return true;

    if (typeof a !== 'object' || typeof b !== 'object') return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key) || !compareDeep(a[key], b[key])) return false;
    }

    return true;
  }

  class YasumuAssertion<T> implements Assertion<T> {
    constructor(
      private actual: T,
      private readonly negative: boolean = false
    ) {}

    public get not(): Assertion<T> {
      return new YasumuAssertion<T>(this.actual, !this.negative);
    }

    #throwIf(condition: boolean, message: string, value: any): void {
      if ((condition && !this.negative) || (!condition && this.negative)) {
        throw new YasumuAssertionError(
          `${message}\n${this.#getDiff(this.actual, value)}`
        );
      }
    }

    #getDiff(a: any, b: any): string {
      return `+ ${a}\n- ${b}`;
    }

    public toBeUndefined(): void {
      this.#throwIf(
        this.actual !== undefined,
        `Expected ${this.actual} to be undefined`,
        undefined
      );
    }

    public toHaveOwnProperty(expected: string): void {
      const hasProperty = Object.prototype.hasOwnProperty.call(
        this.actual,
        expected
      );
      this.#throwIf(
        !hasProperty,
        `Expected ${this.actual} to have own property ${expected}`,
        undefined
      );
    }

    public toHaveOwnPropertyValue(key: string, value: any): void {
      const hasProperty = Object.prototype.hasOwnProperty.call(
        this.actual,
        key
      );
      const valueMatch = (this.actual as any)[key] === value;

      this.#throwIf(
        !hasProperty,
        `Expected ${this.actual} to have own property ${key}`,
        undefined
      );
      this.#throwIf(
        !valueMatch,
        `Expected ${(this.actual as any)[key]} to be ${value}`,
        value
      );
    }

    public toBe(expected: T): void {
      this.#throwIf(
        this.actual !== expected,
        `Expected ${this.actual} to be ${expected}`,
        expected
      );
    }

    public toEqual(expected: T): void {
      this.#throwIf(
        this.actual != expected,
        `Expected ${this.actual} to equal ${expected}`,
        expected
      );
    }

    public toStrictEqual(expected: T): void {
      this.#throwIf(
        this.actual !== expected,
        `Expected ${this.actual} to strictly equal ${expected}`,
        expected
      );
    }

    public toDeepEqual(expected: T): void {
      this.#throwIf(
        compareDeep(this.actual, expected),
        `Expected ${this.actual} to deeply equal ${expected}`,
        expected
      );
    }

    public toMatch(expected: RegExp): void {
      this.#throwIf(
        !expected.test(String(this.actual)),
        `Expected ${this.actual} to match ${expected}`,
        expected
      );
    }

    public toBeTruthy(): void {
      this.#throwIf(!this.actual, `Expected ${this.actual} to be truthy`, true);
    }

    public toBeFalsy(): void {
      this.#throwIf(
        !!this.actual,
        `Expected ${this.actual} to be falsy`,
        false
      );
    }

    public toBeDefined(): void {
      this.#throwIf(
        this.actual === undefined,
        `Expected ${this.actual} to be defined`,
        undefined
      );
    }

    public toBeNull(): void {
      this.#throwIf(
        this.actual !== null,
        `Expected ${this.actual} to be null`,
        null
      );
    }

    public toBeInstanceOf(expected: any): void {
      this.#throwIf(
        !(this.actual instanceof expected),
        `Expected ${this.actual} to be an instance of ${expected}`,
        expected
      );
    }

    public toBeGreaterThan(expected: number): void {
      this.#throwIf(
        typeof this.actual !== 'number' || this.actual <= expected,
        `Expected ${this.actual} to be greater than ${expected}`,
        expected
      );
    }

    public toBeLessThan(expected: number): void {
      this.#throwIf(
        typeof this.actual !== 'number' || this.actual >= expected,
        `Expected ${this.actual} to be less than ${expected}`,
        expected
      );
    }

    public toBeGreaterThanOrEqual(expected: number): void {
      this.#throwIf(
        typeof this.actual !== 'number' || this.actual < expected,
        `Expected ${this.actual} to be greater than or equal to ${expected}`,
        expected
      );
    }

    public toBeLessThanOrEqual(expected: number): void {
      this.#throwIf(
        typeof this.actual !== 'number' || this.actual > expected,
        `Expected ${this.actual} to be less than or equal to ${expected}`,
        expected
      );
    }

    public toHaveProperty(expected: string): void {
      this.#throwIf(
        !(
          typeof this.actual === 'object' &&
          this.actual &&
          expected in this.actual
        ),
        `Expected ${this.actual} to have property ${expected}`,
        expected
      );
    }

    public toHaveLength(expected: number): void {
      this.#throwIf(
        typeof this.actual === 'object' &&
          this.actual &&
          'length' in this.actual &&
          this.actual.length !== expected,
        `Expected ${this.actual} to have length ${expected}`,
        expected
      );
    }
  }

  enum TestState {
    Passed = 'passed',
    Failed = 'failed',
    Skipped = 'skipped',
  }

  function test(name: string, fn: YasumuTest): void {
    let state: TestState | null = null;
    let stateReason: string | null | undefined = null;

    const testContext: TestContext = {
      skip: (reason?: string) => {
        state = TestState.Skipped;
        stateReason = reason;
        throw new TestContextThrowawayError('Test skipped');
      },
      pass: (reason?: string) => {
        state = TestState.Passed;
        stateReason = reason;
        throw new TestContextThrowawayError('Test passed');
      },
      fail: (reason?: string) => {
        state = TestState.Failed;
        stateReason = reason;
        throw new TestContextThrowawayError('Test failed');
      },
    };

    const formatTime = (duration: number) => {
      if (duration < 1000) return `${duration.toFixed(2)}ms`;
      return `${duration.toFixed(2)}s`;
    };

    const evaluateState = (duration: string) => {
      switch (state) {
        case TestState.Passed:
          writeSuccess(`[PASSED] (${duration}) ${name}: ${stateReason}`);
          break;
        case TestState.Failed:
          writeError(
            `[FAILED] (${duration}) Yasumu.test(${name}): ${stateReason}`
          );
          break;
        case TestState.Skipped:
          warnLog(
            `[SKIPPED] (${duration}) Yasumu.test(${name}): ${stateReason}`
          );
          break;
        default:
          break;
      }
    };

    let start = performance.now();
    let end;

    try {
      fn(testContext);
      end = performance.now();
      writeSuccess(`[PASSED] (${formatTime(end - start)}) ${name}`);
    } catch (_error) {
      end = performance.now();
      const timeTaken = formatTime(end - start);
      if (
        _error &&
        _error instanceof TestContextThrowawayError &&
        state != null
      )
        return void evaluateState(timeTaken);

      if (_error && _error instanceof YasumuAssertionError) {
        writeError(
          `[FAILED] (${timeTaken}) Yasumu.test(${name}):\n${_error.message}`
        );
        return;
      }

      writeError(
        `[ERROR] (${timeTaken}) Yasumu.test(${name}) failed with error:\n${
          (_error as Error).message || _error
        }`
      );
    }
  }

  function expect<T>(actual: T): Assertion<T> {
    return new YasumuAssertion<T>(actual);
  }

  Object.assign(globalThis, { test, expect });
})();
