import { auth } from "@/lib/firebase";

/**
 * Drop-in-Ersatz für fetch() für alle /api/ Calls.
 * Hängt automatisch den Firebase ID-Token als Authorization-Header an.
 * Bei einem 401 wird der Token einmalig force-refreshed und der Request wiederholt.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const user = auth.currentUser;
  if (!user) throw new Error("Nicht eingeloggt");

  const buildHeaders = (token: string) => ({
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  });

  // Erster Versuch: gecachten Token verwenden
  const token = await user.getIdToken(false);
  const res = await fetch(url, { ...options, headers: buildHeaders(token) });

  // Bei 401: einmalig frischen Token holen und wiederholen
  if (res.status === 401) {
    console.warn(`[authFetch] 401 erhalten für ${url} – Token wird force-refreshed.`);
    const freshToken = await user.getIdToken(true);
    return fetch(url, { ...options, headers: buildHeaders(freshToken) });
  }

  return res;
}
