/**
 * Structured client-side logging.
 *
 * Bare `console.error(err)` scatters unlabelled strings across the console and
 * gives an error-tracking backend nothing to group on. Every record here
 * carries a level, the module that emitted it, a timestamp and an optional
 * context object, so a Sentry-style transport can be attached later by
 * registering a sink rather than rewriting call sites.
 */

export const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

export interface LogRecord {
    level: LogLevel;
    /** The module or component that emitted the record, e.g. "PatientsPage". */
    module: string;
    message: string;
    /** ISO 8601 timestamp. */
    timestamp: string;
    context?: Record<string, unknown>;
    /** Present when the record was produced from a caught throwable. */
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
}

/** A destination for log records. The console sink is installed by default. */
export type LogSink = (record: LogRecord) => void;

const LEVEL_ORDER: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
};

const CONSOLE_METHOD: Record<LogLevel, "debug" | "info" | "warn" | "error"> = {
    debug: "debug",
    info: "info",
    warn: "warn",
    error: "error",
};

/** Normalise an unknown throwable into a serialisable shape. */
export function describeError(error: unknown): LogRecord["error"] | undefined {
    if (error === undefined || error === null) return undefined;

    if (error instanceof Error) {
        return { name: error.name, message: error.message, stack: error.stack };
    }

    return { name: "UnknownError", message: String(error) };
}

const consoleSink: LogSink = (record) => {
    const prefix = `[${record.level.toUpperCase()}] ${record.module}:`;
    const details: unknown[] = [];

    if (record.context) details.push(record.context);
    if (record.error) details.push(record.error);

    console[CONSOLE_METHOD[record.level]](prefix, record.message, ...details);
};

let sinks: LogSink[] = [consoleSink];

// Quiet by default in production builds; verbose while developing.
let minimumLevel: LogLevel = import.meta.env?.DEV ? "debug" : "info";

/** Register an additional destination, e.g. an error-tracking service. */
export function addSink(sink: LogSink): () => void {
    sinks.push(sink);
    return () => {
        sinks = sinks.filter((registered) => registered !== sink);
    };
}

/** Replace all sinks. Primarily useful in tests. */
export function setSinks(next: LogSink[]): void {
    sinks = [...next];
}

/** Restore the default console-only configuration. */
export function resetSinks(): void {
    sinks = [consoleSink];
}

export function setLogLevel(level: LogLevel): void {
    minimumLevel = level;
}

export function getLogLevel(): LogLevel {
    return minimumLevel;
}

function emit(
    level: LogLevel,
    module: string,
    message: string,
    context?: Record<string, unknown>,
    error?: unknown,
): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[minimumLevel]) return;

    const record: LogRecord = {
        level,
        module,
        message,
        timestamp: new Date().toISOString(),
    };

    if (context && Object.keys(context).length > 0) record.context = context;

    const described = describeError(error);
    if (described) record.error = described;

    for (const sink of sinks) {
        try {
            sink(record);
        } catch {
            // A failing sink must never take down the code being logged.
        }
    }
}

export interface Logger {
    debug(message: string, context?: Record<string, unknown>): void;
    info(message: string, context?: Record<string, unknown>): void;
    warn(message: string, context?: Record<string, unknown>): void;
    error(message: string, error?: unknown, context?: Record<string, unknown>): void;
}

/**
 * Create a logger bound to one module.
 *
 * @param module - Name reported with every record, usually the component or
 * service doing the logging.
 */
export function createLogger(module: string): Logger {
    return {
        debug: (message, context) => emit("debug", module, message, context),
        info: (message, context) => emit("info", module, message, context),
        warn: (message, context) => emit("warn", module, message, context),
        error: (message, error, context) => emit("error", module, message, context, error),
    };
}
