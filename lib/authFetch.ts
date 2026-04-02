import { auth } from "@/lib/firebase";

/**
 * Drop-in-Ersatz für fetch() für alle /api/ Calls.
 * Hängt automatisch den Firebase ID-Token als Authorization-Header an.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const user = auth.currentUser;
  if (!user) throw new Error("Nicht eingeloggt");
  const token = await user.getIdToken();
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
}
