import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    createLogger,
    describeError,
    getLogLevel,
    addSink,
    resetSinks,
    setLogLevel,
    setSinks,
    type LogRecord,
} from "./logger";

let captured: LogRecord[];

beforeEach(() => {
    captured = [];
    setSinks([(record) => captured.push(record)]);
    setLogLevel("debug");
});

afterEach(() => {
    resetSinks();
    setLogLevel("debug");
});

describe("record shape", () => {
    it("tags every record with level, module, message and timestamp", () => {
        createLogger("PatientsPage").info("fetched patients");

        expect(captured).toHaveLength(1);
        expect(captured[0]).toMatchObject({
            level: "info",
            module: "PatientsPage",
            message: "fetched patients",
        });
        expect(captured[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("emits a valid ISO 8601 timestamp", () => {
        createLogger("Test").info("x");

        expect(Number.isNaN(Date.parse(captured[0].timestamp))).toBe(false);
    });

    it.each(["debug", "info", "warn", "error"] as const)(
        "records the %s level",
        (level) => {
            const logger = createLogger("Test");
            if (level === "error") logger.error("boom");
            else logger[level]("message");

            expect(captured[0].level).toBe(level);
        },
    );

    it("attaches context when given", () => {
        createLogger("PatientsPage").warn("slow query", { durationMs: 1200 });

        expect(captured[0].context).toEqual({ durationMs: 1200 });
    });

    it("omits an empty context object", () => {
        createLogger("Test").info("no context", {});

        expect(captured[0].context).toBeUndefined();
    });

    it("keeps modules distinct", () => {
        createLogger("A").info("one");
        createLogger("B").info("two");

        expect(captured.map((r) => r.module)).toEqual(["A", "B"]);
    });
});

describe("error capture", () => {
    it("serialises an Error with its name, message and stack", () => {
        createLogger("SettingsPage").error("save failed", new TypeError("bad input"));

        expect(captured[0].error).toMatchObject({
            name: "TypeError",
            message: "bad input",
        });
        expect(captured[0].error?.stack).toBeTruthy();
    });

    it("serialises a non-Error throwable", () => {
        createLogger("Test").error("odd failure", "just a string");

        expect(captured[0].error).toEqual({
            name: "UnknownError",
            message: "just a string",
        });
    });

    it("allows an error record with no throwable", () => {
        createLogger("Test").error("something went wrong");

        expect(captured[0].error).toBeUndefined();
        expect(captured[0].level).toBe("error");
    });

    it("carries both an error and context", () => {
        createLogger("Test").error("failed", new Error("nope"), { patientId: "p1" });

        expect(captured[0].context).toEqual({ patientId: "p1" });
        expect(captured[0].error?.message).toBe("nope");
    });
});

describe("describeError", () => {
    it.each([undefined, null])("returns undefined for %s", (value) => {
        expect(describeError(value)).toBeUndefined();
    });

    it("describes a plain object throwable", () => {
        expect(describeError({ code: 500 })).toEqual({
            name: "UnknownError",
            message: "[object Object]",
        });
    });
});

describe("level filtering", () => {
    it("suppresses records below the configured level", () => {
        setLogLevel("warn");
        const logger = createLogger("Test");

        logger.debug("hidden");
        logger.info("hidden");
        logger.warn("shown");
        logger.error("shown");

        expect(captured.map((r) => r.level)).toEqual(["warn", "error"]);
    });

    it("emits everything at debug level", () => {
        setLogLevel("debug");
        const logger = createLogger("Test");

        logger.debug("a");
        logger.error("b");

        expect(captured).toHaveLength(2);
    });

    it("reports the configured level", () => {
        setLogLevel("error");
        expect(getLogLevel()).toBe("error");
    });
});

describe("sinks", () => {
    it("fans a record out to every registered sink", () => {
        const extra: LogRecord[] = [];
        const remove = addSink((record) => extra.push(record));

        createLogger("Test").info("broadcast");

        expect(captured).toHaveLength(1);
        expect(extra).toHaveLength(1);
        remove();
    });

    it("stops delivering to a removed sink", () => {
        const extra: LogRecord[] = [];
        addSink((record) => extra.push(record))();

        createLogger("Test").info("after removal");

        expect(extra).toHaveLength(0);
        expect(captured).toHaveLength(1);
    });

    it("does not let a throwing sink break the caller", () => {
        setSinks([
            () => {
                throw new Error("sink exploded");
            },
            (record) => captured.push(record),
        ]);

        expect(() => createLogger("Test").info("still fine")).not.toThrow();
        expect(captured).toHaveLength(1);
    });
});

describe("default console sink", () => {
    it("writes to the console method matching the level", () => {
        resetSinks();
        const spy = vi.spyOn(console, "error").mockImplementation(() => {});

        createLogger("PatientsPage").error("boom", new Error("bad"));

        expect(spy).toHaveBeenCalledWith(
            "[ERROR] PatientsPage:",
            "boom",
            expect.objectContaining({ message: "bad" }),
        );
        spy.mockRestore();
    });

    it("routes a warning to console.warn", () => {
        resetSinks();
        const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

        createLogger("Test").warn("careful");

        expect(spy).toHaveBeenCalledWith("[WARN] Test:", "careful");
        spy.mockRestore();
    });
});
