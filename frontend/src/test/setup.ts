import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Unmount anything rendered by a test so the next one starts from a clean DOM.
afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

// jsdom implements neither of these, and layout-aware components call them.
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
    }),
});

class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
}

class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
}

window.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
window.IntersectionObserver = IntersectionObserverStub as unknown as typeof IntersectionObserver;
