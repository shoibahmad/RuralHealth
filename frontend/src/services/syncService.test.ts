import { beforeEach, describe, expect, it, vi } from "vitest";

// The IndexedDB layer is replaced wholesale: these tests exercise the sync
// queue's own ordering, mapping and failure handling, not browser storage.
vi.mock("./db", () => ({
    db: {
        generateId: vi.fn(),
        savePatient: vi.fn(),
        saveScreening: vi.fn(),
        addToSyncQueue: vi.fn(),
        getSyncQueue: vi.fn(),
        getAllPatients: vi.fn(),
        getAllScreenings: vi.fn(),
        getPatient: vi.fn(),
        updatePatientServerId: vi.fn(),
        updateScreeningServerId: vi.fn(),
        removeFromSyncQueue: vi.fn(),
        updateSyncQueueItem: vi.fn(),
        getSyncQueueCount: vi.fn(),
    },
}));

import { db } from "./db";
import type { SyncQueueItem } from "./db";
import { syncService } from "./syncService";

const mockDb = vi.mocked(db);

const patientItem = (overrides: Partial<SyncQueueItem> = {}): SyncQueueItem => ({
    id: "q1",
    type: "patient",
    action: "create",
    localId: "local-p1",
    data: { full_name: "Ramesh Kumar", age: 52, gender: "Male", village: "Chandpur" },
    attempts: 0,
    ...overrides,
});

const screeningItem = (overrides: Partial<SyncQueueItem> = {}): SyncQueueItem => ({
    id: "q2",
    type: "screening",
    action: "create",
    localId: "local-s1",
    data: { patientLocalId: "local-p1", systolic_bp: 130 },
    attempts: 0,
    ...overrides,
});

/** Respond to each fetch call in order with the given JSON bodies. */
const mockFetchSequence = (...responses: { ok: boolean; body: unknown }[]) => {
    const fetchMock = vi.fn();
    for (const { ok, body } of responses) {
        fetchMock.mockResolvedValueOnce({ ok, json: async () => body });
    }
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
};

const setOnline = (online: boolean) => {
    Object.defineProperty(navigator, "onLine", { value: online, configurable: true });
};

beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    setOnline(true);
    syncService.setToken("test-token");

    mockDb.generateId.mockReturnValue("generated-local-id");
    mockDb.getSyncQueue.mockResolvedValue([]);
    mockDb.getAllPatients.mockResolvedValue([]);
    mockDb.getAllScreenings.mockResolvedValue([]);
    mockDb.getSyncQueueCount.mockResolvedValue(0);
    mockDb.getPatient.mockResolvedValue(undefined);
});

describe("isOnline", () => {
    it.each([true, false])("reflects navigator.onLine being %s", (online) => {
        setOnline(online);
        expect(syncService.isOnline()).toBe(online);
    });
});

describe("subscribe", () => {
    it("notifies subscribers of status transitions", async () => {
        const listener = vi.fn();
        const unsubscribe = syncService.subscribe(listener);

        await syncService.syncAll();

        expect(listener).toHaveBeenCalledWith("syncing");
        expect(listener).toHaveBeenCalledWith("success");
        unsubscribe();
    });

    it("stops notifying after unsubscribe", async () => {
        const listener = vi.fn();
        syncService.subscribe(listener)();

        await syncService.syncAll();

        expect(listener).not.toHaveBeenCalled();
    });

    it("returns to idle after the settle delay", async () => {
        const listener = vi.fn();
        const unsubscribe = syncService.subscribe(listener);

        await syncService.syncAll();
        listener.mockClear();
        await vi.advanceTimersByTimeAsync(3000);

        expect(listener).toHaveBeenCalledWith("idle");
        unsubscribe();
    });
});

describe("savePatientLocally", () => {
    it("stores the patient and queues it for sync", async () => {
        const localId = await syncService.savePatientLocally({
            full_name: "Ramesh Kumar",
            age: "52",
            gender: "Male",
            village: "Chandpur",
            phone: "9876543210",
        });

        expect(localId).toBe("generated-local-id");
        expect(mockDb.savePatient).toHaveBeenCalledWith(
            expect.objectContaining({
                localId: "generated-local-id",
                synced: false,
                data: expect.objectContaining({ full_name: "Ramesh Kumar", age: 52 }),
            }),
        );
        expect(mockDb.addToSyncQueue).toHaveBeenCalledWith(
            expect.objectContaining({ type: "patient", action: "create" }),
        );
    });

    it("coerces a numeric string age to a number", async () => {
        await syncService.savePatientLocally({ full_name: "X", age: "41" });

        const saved = mockDb.savePatient.mock.calls[0][0];
        expect(saved.data.age).toBe(41);
    });

    it("defaults an unparseable age to zero rather than NaN", async () => {
        await syncService.savePatientLocally({ full_name: "X", age: "unknown" });

        const saved = mockDb.savePatient.mock.calls[0][0];
        expect(saved.data.age).toBe(0);
    });

    it("omits a blank phone number", async () => {
        await syncService.savePatientLocally({ full_name: "X", age: "30", phone: "" });

        const saved = mockDb.savePatient.mock.calls[0][0];
        expect(saved.data.phone).toBeUndefined();
    });
});

describe("saveScreeningLocally", () => {
    it("stores the screening against its patient and queues it", async () => {
        await syncService.saveScreeningLocally({ systolic_bp: "130" }, "local-p1");

        expect(mockDb.saveScreening).toHaveBeenCalledWith(
            expect.objectContaining({
                patientLocalId: "local-p1",
                synced: false,
                data: expect.objectContaining({ systolic_bp: 130 }),
            }),
        );
        expect(mockDb.addToSyncQueue).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "screening",
                data: expect.objectContaining({ patientLocalId: "local-p1" }),
            }),
        );
    });

    it("omits measurements that were not taken instead of writing zero", async () => {
        await syncService.saveScreeningLocally(
            { systolic_bp: "130", diastolic_bp: "", glucose_level: undefined },
            "local-p1",
        );

        const saved = mockDb.saveScreening.mock.calls[0][0];
        expect(saved.data.systolic_bp).toBe(130);
        expect(saved.data.diastolic_bp).toBeUndefined();
        expect(saved.data.glucose_level).toBeUndefined();
    });

    it("keeps a decimal measurement intact", async () => {
        await syncService.saveScreeningLocally({ weight_kg: "68.5" }, "local-p1");

        expect(mockDb.saveScreening.mock.calls[0][0].data.weight_kg).toBe(68.5);
    });

    it("truncates a decimal supplied for an integer field", async () => {
        await syncService.saveScreeningLocally({ heart_rate: "72.6" }, "local-p1");

        expect(mockDb.saveScreening.mock.calls[0][0].data.heart_rate).toBe(72);
    });
});

describe("syncAll guards", () => {
    it("refuses to sync while offline", async () => {
        setOnline(false);

        const result = await syncService.syncAll();

        expect(result.success).toBe(false);
        expect(result.errors).toEqual(["Device is offline"]);
        expect(mockDb.getSyncQueue).not.toHaveBeenCalled();
    });

    it("refuses to sync without an auth token", async () => {
        syncService.setToken(null);

        const result = await syncService.syncAll();

        expect(result.success).toBe(false);
        expect(result.errors).toEqual(["Not authenticated"]);
    });

    it("reports an empty queue as a successful no-op", async () => {
        const result = await syncService.syncAll();

        expect(result).toEqual({ success: true, synced: 0, failed: 0, errors: [] });
    });
});

describe("syncAll patient records", () => {
    it("posts the patient and records its server id", async () => {
        mockDb.getSyncQueue.mockResolvedValue([patientItem()]);
        const fetchMock = mockFetchSequence({ ok: true, body: { id: 42 } });

        const result = await syncService.syncAll();

        expect(fetchMock).toHaveBeenCalledWith(
            "/api/screening/patients",
            expect.objectContaining({
                method: "POST",
                headers: expect.objectContaining({ Authorization: "Bearer test-token" }),
            }),
        );
        expect(mockDb.updatePatientServerId).toHaveBeenCalledWith("local-p1", 42);
        expect(mockDb.removeFromSyncQueue).toHaveBeenCalledWith("q1");
        expect(result).toMatchObject({ success: true, synced: 1, failed: 0 });
    });

    it("records the failure and keeps the item queued when the server rejects it", async () => {
        mockDb.getSyncQueue.mockResolvedValue([patientItem()]);
        mockFetchSequence({ ok: false, body: { detail: "Patient name is required" } });

        const result = await syncService.syncAll();

        expect(result).toMatchObject({ success: false, synced: 0, failed: 1 });
        expect(result.errors[0]).toContain("Patient name is required");
        expect(mockDb.removeFromSyncQueue).not.toHaveBeenCalled();
        expect(mockDb.updateSyncQueueItem).toHaveBeenCalledWith(
            expect.objectContaining({ attempts: 1, error: "Patient name is required" }),
        );
    });

    it("increments the attempt count across retries", async () => {
        mockDb.getSyncQueue.mockResolvedValue([patientItem({ attempts: 2 })]);
        mockFetchSequence({ ok: false, body: { detail: "still bad" } });

        await syncService.syncAll();

        expect(mockDb.updateSyncQueueItem).toHaveBeenCalledWith(
            expect.objectContaining({ attempts: 3 }),
        );
    });
});

describe("syncAll screening records", () => {
    it("resolves the patient's server id from the same run", async () => {
        mockDb.getSyncQueue.mockResolvedValue([patientItem(), screeningItem()]);
        const fetchMock = mockFetchSequence(
            { ok: true, body: { id: 42 } },
            { ok: true, body: { id: 99 } },
        );

        const result = await syncService.syncAll();

        const screeningBody = JSON.parse(fetchMock.mock.calls[1][1].body);
        expect(screeningBody.patient_id).toBe(42);
        // The offline-only key must never reach the server.
        expect(screeningBody).not.toHaveProperty("patientLocalId");
        expect(mockDb.updateScreeningServerId).toHaveBeenCalledWith("local-s1", 99, 42);
        expect(result.synced).toBe(2);
    });

    it("resolves the patient's server id from a previous run", async () => {
        mockDb.getSyncQueue.mockResolvedValue([screeningItem()]);
        mockDb.getAllPatients.mockResolvedValue([
            {
                localId: "local-p1",
                serverId: 7,
                synced: true,
                data: { full_name: "R", age: 52, gender: "Male", village: "C" },
                createdAt: new Date(),
            },
        ]);
        const fetchMock = mockFetchSequence({ ok: true, body: { id: 99 } });

        await syncService.syncAll();

        expect(JSON.parse(fetchMock.mock.calls[0][1].body).patient_id).toBe(7);
    });

    it("skips a screening whose patient has not synced yet", async () => {
        mockDb.getSyncQueue.mockResolvedValue([screeningItem()]);
        const fetchMock = mockFetchSequence();

        const result = await syncService.syncAll();

        expect(fetchMock).not.toHaveBeenCalled();
        expect(mockDb.removeFromSyncQueue).not.toHaveBeenCalled();
        // Skipped, not failed: it will be retried once the patient lands.
        expect(result).toMatchObject({ success: true, synced: 0, failed: 0 });
    });

    it("still syncs later items when an earlier one fails", async () => {
        mockDb.getSyncQueue.mockResolvedValue([
            patientItem({ id: "q1", localId: "local-p1" }),
            patientItem({ id: "q2", localId: "local-p2" }),
        ]);
        mockFetchSequence(
            { ok: false, body: { detail: "rejected" } },
            { ok: true, body: { id: 43 } },
        );

        const result = await syncService.syncAll();

        expect(result).toMatchObject({ synced: 1, failed: 1, success: false });
        expect(mockDb.updatePatientServerId).toHaveBeenCalledWith("local-p2", 43);
    });
});

describe("syncAll concurrency", () => {
    it("refuses a second run while one is in flight", async () => {
        mockDb.getSyncQueue.mockResolvedValue([patientItem()]);
        mockFetchSequence({ ok: true, body: { id: 42 } });

        const first = syncService.syncAll();
        const second = await syncService.syncAll();

        expect(second).toMatchObject({
            success: false,
            errors: ["Sync already in progress"],
        });

        await first;
    });

    it("allows a new run once the previous one finishes", async () => {
        mockDb.getSyncQueue.mockResolvedValue([]);

        await syncService.syncAll();
        const second = await syncService.syncAll();

        expect(second.success).toBe(true);
    });
});

describe("local statistics", () => {
    it("reports the pending queue length", async () => {
        mockDb.getSyncQueueCount.mockResolvedValue(4);

        expect(await syncService.getPendingCount()).toBe(4);
    });

    it("summarises what is held locally", async () => {
        mockDb.getAllPatients.mockResolvedValue([{}, {}] as never);
        mockDb.getAllScreenings.mockResolvedValue([{}, {}, {}] as never);
        mockDb.getSyncQueueCount.mockResolvedValue(5);

        expect(await syncService.getLocalStats()).toEqual({
            localPatients: 2,
            localScreenings: 3,
            pendingSync: 5,
        });
    });
});
