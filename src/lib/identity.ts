// Re-export everything the app needs from the auth + api modules.
// getMyProfileId lives in api.ts because it's used by api functions too.

export { getMyProfileId } from './api';
export { useAuth } from './auth';
export type { Profile } from './types';
