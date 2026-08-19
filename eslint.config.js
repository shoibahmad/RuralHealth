/**
 * Root ESLint configuration.
 *
 * The application source lives in `frontend/`, which carries the React and
 * TypeScript rules. This root config re-exports it so `npx eslint .` works
 * from the repository root as well as from inside the workspace.
 */
import frontendConfig from './frontend/eslint.config.js'

export default frontendConfig
