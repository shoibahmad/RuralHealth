import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    test: {
        // The repository path contains spaces, which breaks the default forked
        // worker URLs on Windows; threads resolve modules in-process instead.
        pool: "threads",
        environment: "jsdom",
        globals: true,
        setupFiles: ["./src/test/setup.ts"],
        css: false,
        coverage: {
            provider: "v8",
            reporter: ["text", "lcov"],

            // Coverage is measured over the logic layers, where a unit test is the
            // right tool. Route components and layouts are deliberately outside the
            // denominator: they are markup around these modules, and are exercised
            // end to end by the container smoke test in CI rather than by jsdom.
            include: ["src/lib/**/*.ts", "src/services/**/*.ts", "src/hooks/**/*.ts", "src/pages/screening/**/*.ts"],
            exclude: [
                "src/**/*.test.{ts,tsx}",
                // Thin wrappers over browser APIs and third-party SDKs. Testing these
                // measures the mock, not the code; they are covered by the CI smoke test.
                "src/lib/db.ts",
                "src/lib/sync.ts",
                "src/lib/firebase.ts",
                "src/services/db.ts",
                "src/hooks/useSpeechRecognition.ts",
                "src/hooks/useOfflineStorage.ts",
                // Static data, not logic.
                "src/lib/translations.ts",
            ],

            // Floors enforced by `npm run test:coverage`, which CI runs. Raise them
            // as coverage improves; never lower them to make a build pass.
            thresholds: {
                lines: 85,
                functions: 85,
                branches: 80,
                statements: 85,
            },
        },
    },
});
