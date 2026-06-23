// Dev-mode impersonation: the chosen seeded user's id is stored locally and sent
// as `x-dev-user-id` on every request (auth is temporarily off).
const KEY = "devUserId";

export const getDevUserId = () => localStorage.getItem(KEY) || "";
export const setDevUserId = (id) => localStorage.setItem(KEY, id);
export const clearDevUserId = () => localStorage.removeItem(KEY);
