/**
 * Type declarations for @wdio-framework/core
 */

// ─── Base ─────────────────────────────────────────────────────

export class AbstractBasePage {
    logger: any;
    timeout: number;
    /** Override in subclasses to define the page URL path. */
    url?: string;
    /** Override in subclasses to verify the page is fully loaded. */
    isLoaded(): Promise<boolean>;
    open(path?: string): Promise<this>;
    openAbsoluteUrl(absoluteUrl: string): Promise<this>;
    waitForPageLoad(timeout?: number): Promise<void>;
    click(element: string | WebdriverIO.Element): Promise<void>;
    type(element: string | WebdriverIO.Element, text: string): Promise<void>;
    getText(element: string | WebdriverIO.Element): Promise<string>;
    getAttribute(element: string | WebdriverIO.Element, attr: string): Promise<string>;
    getValue(element: string | WebdriverIO.Element): Promise<string>;
    isDisplayed(element: string | WebdriverIO.Element): Promise<boolean>;
    isExisting(element: string | WebdriverIO.Element): Promise<boolean>;
    isEnabled(element: string | WebdriverIO.Element): Promise<boolean>;
    isSelected(element: string | WebdriverIO.Element): Promise<boolean>;
    waitForDisplayed(element: string | WebdriverIO.Element, opts?: object): Promise<void>;
    waitForExist(element: string | WebdriverIO.Element, opts?: object): Promise<void>;
    waitForClickable(element: string | WebdriverIO.Element, opts?: object): Promise<void>;
    waitForEnabled(element: string | WebdriverIO.Element, opts?: object): Promise<void>;
    scrollIntoView(element: string | WebdriverIO.Element): Promise<void>;
    hoverElement(element: string | WebdriverIO.Element): Promise<void>;
    doubleClick(element: string | WebdriverIO.Element): Promise<void>;
    rightClick(element: string | WebdriverIO.Element): Promise<void>;
    clearAndType(element: string | WebdriverIO.Element, text: string): Promise<void>;
    executeScript<T>(script: string | Function, ...args: any[]): Promise<T>;
    executeAsync<T>(script: string | Function, ...args: any[]): Promise<T>;
    takeScreenshot(fileName: string): Promise<string>;
    takeElementScreenshot(element: string | WebdriverIO.Element, fileName: string): Promise<string>;
    pressKey(key: string): Promise<void>;
    pressKeys(keys: string[]): Promise<void>;
    dragAndDrop(source: string | WebdriverIO.Element, target: string | WebdriverIO.Element): Promise<void>;
    uploadFile(element: string | WebdriverIO.Element, filePath: string): Promise<void>;
}

// ─── Utilities ────────────────────────────────────────────────

export class Logger {
    static getInstance(label?: string): Logger;
    static setWorkerContext(cid: string): void;
    static setScenarioContext(scenarioName: string): void;
    static clearScenarioContext(): void;
    static flushAll(): Promise<void>;
    static reset(): void;
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
    debug(message: string): void;
}

export class RetryHandler {
    static retry<T>(fn: (attempt: number) => Promise<T>, options?: {
        maxAttempts?: number;
        maxRetries?: number;
        delay?: number;
        exponential?: boolean;
        onRetry?: (error: Error, attempt: number) => Promise<void>;
        shouldRetry?: (error: Error) => boolean;
    }): Promise<T>;
    static retryBrowserAction<T>(fn: () => Promise<T>, maxRetries?: number): Promise<T>;
    static createCircuitBreaker(options?: {
        threshold?: number;
        cooldown?: number;
    }): {
        execute<T>(fn: () => Promise<T>): Promise<T>;
        reset(): void;
        readonly state: 'closed' | 'half-open' | 'open';
    };
}

export class ScreenshotManager {
    static capture(name?: string): Promise<string | null>;
    static captureOnFailure(scenarioName: string): Promise<string | null>;
    static captureFullPage(name?: string): Promise<string>;
    static captureElement(element: string | WebdriverIO.Element, name?: string): Promise<string>;
    static cleanOldScreenshots(daysOld?: number): void;
    static captureAsBase64(): Promise<string>;
}

export class PerformanceTracker {
    static getInstance(): PerformanceTracker;
    startTimer(name: string): void;
    stopTimer(name: string): number;
    measure<T>(name: string, fn: () => Promise<T>): Promise<T>;
    getPagePerformance(): Promise<Record<string, number> | null>;
    getResourcePerformance(): Promise<Array<{ name: string; type: string; duration: number; transferSize: number }>>;
    getMetrics(): Array<{ name: string; elapsed: number; timestamp: string }>;
    clearMetrics(): void;
    assertPageLoadUnder(maxMs: number): Promise<void>;
}

export class ReportBackupManager {
    constructor(options?: { projectName?: string; sourceDir?: string; backupPath?: string; keepLastN?: number; compress?: boolean });
    backup(): Promise<string | null>;
    listBackups(): Array<{ name: string; path: string; date: Date }>;
}

export class CustomDriverResolver {
    static resolve(options?: {
        hostUrl?: string;
        driverName?: string;
        version?: string;
        os?: string;
        arch?: string;
        cacheDir?: string;
        fileExtension?: string;
        binaryName?: string;
        forceDownload?: boolean;
        customFilename?: string;
        sha256?: string;
    }): Promise<string>;
    static resolveEdgeCapabilityOverrides(options?: object): Promise<object>;
}

export class CustomReporter {
    // Reporter implementation
}

// ─── Helpers ──────────────────────────────────────────────────

interface ApiResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: any;
    duration: number;
    isSuccess(): boolean;
    isClientError(): boolean;
    isServerError(): boolean;
}

export class ApiHelper {
    constructor(baseURL: string, defaultHeaders?: Record<string, string>);
    static create(baseURL: string, defaultHeaders?: Record<string, string>): ApiHelper;
    enableRetry(config?: { maxAttempts?: number; delay?: number }): this;
    get(url: string, params?: object, headers?: object): Promise<ApiResponse>;
    post(url: string, data?: object, headers?: object): Promise<ApiResponse>;
    put(url: string, data?: object, headers?: object): Promise<ApiResponse>;
    patch(url: string, data?: object, headers?: object): Promise<ApiResponse>;
    delete(url: string, headers?: object): Promise<ApiResponse>;
    graphql(url: string, query: string, variables?: object, headers?: object): Promise<ApiResponse>;
    uploadFile(url: string, filePath: string, fieldName?: string, additionalData?: object): Promise<ApiResponse>;
    pollUntil(url: string, conditionFn: (res: ApiResponse) => boolean, opts?: { interval?: number; timeout?: number; method?: string }): Promise<ApiResponse>;
    setBearerToken(token: string): void;
    setBasicAuth(username: string, password: string): void;
    setHeader(key: string, value: string): void;
    clearAuth(): void;
}

export class DataGenerator {
    static seed(value: number): void;
    static setLocale(locale: string): void;
    static generateUser(overrides?: object): object;
    static generateUsers(count: number, overrides?: object): object[];
    static generateAddress(overrides?: object): object;
    static generateCompany(overrides?: object): object;
    static generateCreditCard(overrides?: object): object;
    static generateProduct(overrides?: object): object;
    static generateEmail(provider?: string): string;
    static generatePassword(length?: number): string;
    static generateUUID(): string;
    static generatePhone(): string;
    static generateNumber(min?: number, max?: number): number;
    static generateFloat(min?: number, max?: number, precision?: number): number;
    static generateBoolean(): boolean;
    static generateParagraph(sentences?: number): string;
    static generateSentence(wordCount?: number): string;
    static generateWord(): string;
    static generateWords(count?: number): string;
    static generateUrl(): string;
    static pickRandom<T>(array: T[]): T;
    static pickMultipleRandom<T>(array: T[], count: number): T[];
    static shuffle<T>(array: T[]): T[];
}

export class FileHelper {
    static readFile(filePath: string): string;
    static readJSON(filePath: string): any;
    static readYAML(filePath: string): any;
    static readCSV(filePath: string, delimiter?: string): object[];
    static writeFile(filePath: string, content: string): void;
    static writeJSON(filePath: string, data: any, pretty?: boolean): void;
    static appendFile(filePath: string, content: string): void;
    static ensureDirectory(dirPath: string): void;
    static listFiles(dirPath: string, extension?: string): string[];
    static listFilesRecursive(dirPath: string, extension?: string): string[];
    static exists(filePath: string): boolean;
    static deleteFile(filePath: string): void;
    static deleteDirectory(dirPath: string): void;
    static cleanDirectory(dirPath: string): void;
    static copyFile(source: string, destination: string): void;
    static moveFile(source: string, destination: string): void;
    static getFileSize(filePath: string): number;
    static getFileSizeFormatted(filePath: string): string;
    static waitForFileDownload(dirPath: string, filePattern: string | RegExp, timeout?: number): Promise<string>;
    static createTempFile(content: string, extension?: string): string;
    static cleanupTempFiles(): void;
}

export class DateHelper {
    static now(format?: string): string;
    static today(format?: string): string;
    static timestamp(): number;
    static isoNow(): string;
    static format(date: Date | string, format?: string): string;
    static addDays(days: number, fromDate?: Date, format?: string): string;
    static subtractDays(days: number, fromDate?: Date, format?: string): string;
    static addMonths(months: number, fromDate?: Date, format?: string): string;
    static addYears(years: number, fromDate?: Date, format?: string): string;
    static diffInDays(dateA: Date | string, dateB: Date | string): number;
    static diffInHours(dateA: Date | string, dateB: Date | string): number;
    static diffInMinutes(dateA: Date | string, dateB: Date | string): number;
    static isBefore(dateA: Date | string, dateB: Date | string): boolean;
    static isAfter(dateA: Date | string, dateB: Date | string): boolean;
    static isBetween(date: Date | string, startDate: Date | string, endDate: Date | string): boolean;
    static startOfDay(date?: Date, format?: string): string;
    static endOfDay(date?: Date, format?: string): string;
    static getMonthName(date?: Date): string;
    static getDayOfWeek(date?: Date): string;
    static timeAgo(date: Date | string): string;
    static fileTimestamp(): string;
}

export class StringHelper {
    static capitalize(str: string): string;
    static capitalizeWords(str: string): string;
    static toCamelCase(str: string): string;
    static toKebabCase(str: string): string;
    static toSnakeCase(str: string): string;
    static truncate(str: string, maxLength: number, suffix?: string): string;
    static removeWhitespace(str: string): string;
    static normalizeWhitespace(str: string): string;
    static contains(str: string, substring: string, caseInsensitive?: boolean): boolean;
    static extractNumbers(str: string): number[];
    static extractEmails(str: string): string[];
    static extractUrls(str: string): string[];
}

export class EncryptionHelper {
    static encrypt(plainText: string, passphrase?: string): string;
    static decrypt(cipherText: string, passphrase?: string): string;
    static generateKey(): string;
    static hash(value: string): string;
    static generateSecureRandom(length?: number): string;
    static base64Encode(value: string): string;
    static base64Decode(value: string): string;
}

export class ExcelHelper {
    static readWorkbook(filePath: string): Record<string, object[]>;
    static readSheet(filePath: string, sheetName: string): object[];
    static writeToExcel(filePath: string, data: object[], sheetName?: string): void;
    static appendToSheet(filePath: string, sheetName: string, newRows: object[]): void;
    static updateCell(filePath: string, sheetName: string, cellAddress: string, value: any): void;
    static excelToJson(excelPath: string, sheetName: string, jsonPath: string): object[];
    static jsonToExcel(jsonPath: string, excelPath: string, sheetName?: string): object[];
    static toGherkinExamples(filePath: string, sheetName: string, columns: string[], filters?: object): string;
    static getFilteredRows(filePath: string, sheetName: string, filters: object): object[];
}

export class DataDrivenManager {
    loadFromExcel(filePath: string, sheetName: string, storeKey?: string): object[];
    loadFromJSON(filePath: string, storeKey?: string): any;
    loadFromYAML(filePath: string, storeKey?: string): any;
    loadFromCSV(filePath: string, storeKey?: string): object[];
    loadFromEnv(prefix?: string): object;
    get(keyPath: string): any;
    getTargetedRows(storeKey: string, flagColumn?: string): object[];
    getRowsByTag(storeKey: string, tag: string, tagColumn?: string): object[];
    interpolate(template: string): string;
    resolveObject(dataObj: object): object;
    clear(): void;
    getSummary(): object;
}

export const dataDrivenManager: DataDrivenManager;

export class FeatureGenerator {
    constructor(outputDir?: string);
    generateFromExcel(config: object): string;
    generateFromJson(config: object): string;
    generateFromTemplate(config: object): string;
    generateRunnerConfig(config: object): object;
    generateRunnerFiles(config: object): string[];
}

export class TestExecutionFilter {
    // Filter tests by environment, tags, etc.
}

// ─── Constants ────────────────────────────────────────────────

export const Timeouts: {
    ELEMENT_WAIT: number;
    PAGE_LOAD: number;
    SCRIPT: number;
    IMPLICIT: number;
    ANIMATION: number;
    POLLING_INTERVAL: number;
    API_TIMEOUT: number;
    FILE_DOWNLOAD: number;
};

export const Environments: {
    DEV: string;
    STAGING: string;
    PROD: string;
};

export function getEnvironment(): string;

export const Messages: {
    [key: string]: string;
};

// ─── Config ───────────────────────────────────────────────────

export interface BaseHooksOptions {
    /** Absolute path to the reports output directory */
    reportsDir?: string;
    /** Absolute path to the logs directory (default: <cwd>/logs) */
    logsDir?: string;
    /** Auto-screenshot on scenario failure (default: true) */
    screenshotOnFailure?: boolean;
    /** Clear storage/cookies between scenarios (default: true) */
    cleanBrowserState?: boolean;
}

export interface BaseHooks {
    onPrepare(config: object, capabilities: object[]): void;
    onWorkerStart(cid: string): void;
    onWorkerEnd(cid: string, exitCode: number): void;
    before(capabilities: object, specs: string[], browser: object): Promise<void>;
    after(): Promise<void>;
    beforeFeature(uri: string, feature: object): void;
    afterFeature(uri: string, feature: object): void;
    beforeScenario(world: object): void;
    afterScenario(world: object, result: { passed: boolean }): Promise<void>;
    beforeStep(): void;
    afterStep(): Promise<void>;
    onComplete(exitCode: number): Promise<void>;
}

export function createBaseHooks(options?: BaseHooksOptions): BaseHooks;
