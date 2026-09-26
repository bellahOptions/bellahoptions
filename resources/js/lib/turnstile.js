const turnstileScriptId = "cf-turnstile-api-script";
const turnstileScriptSrc = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let turnstileLoadPromise = null;

/**
 * Load the Cloudflare Turnstile API script.
 *
 * Rejects when the script cannot be delivered (offline visitor, blocked CDN,
 * CSP/proxy interference). Callers treat rejection as "primary challenge
 * unavailable" and may request the server-issued degraded-mode challenge.
 */
export function loadTurnstileScript() {
    if (typeof window === "undefined" || typeof document === "undefined") {
        return Promise.reject(new Error("Turnstile can only be loaded in the browser."));
    }

    if (window.turnstile && typeof window.turnstile.render === "function") {
        return Promise.resolve(window.turnstile);
    }

    if (turnstileLoadPromise) {
        return turnstileLoadPromise;
    }

    turnstileLoadPromise = new Promise((resolve, reject) => {
        let script = document.getElementById(turnstileScriptId);

        const resolveIfReady = () => {
            if (window.turnstile && typeof window.turnstile.render === "function") {
                resolve(window.turnstile);
                return true;
            }

            return false;
        };

        if (resolveIfReady()) {
            return;
        }

        let completed = false;
        let pollTimer = null;
        let loadTimeout = null;

        const cleanup = () => {
            if (pollTimer !== null) {
                window.clearInterval(pollTimer);
            }

            if (loadTimeout !== null) {
                window.clearTimeout(loadTimeout);
            }

            script?.removeEventListener("load", onLoad);
            script?.removeEventListener("error", onError);
        };

        const finish = (callback) => {
            if (completed) {
                return;
            }

            completed = true;
            cleanup();
            callback();
        };

        const onLoad = () => {
            if (resolveIfReady()) {
                finish(() => {});
            }
        };

        const onError = () => {
            finish(() => reject(new Error("Failed to load the Turnstile script.")));
        };

        const startReadinessPoll = () => {
            pollTimer = window.setInterval(() => {
                if (resolveIfReady()) {
                    finish(() => {});
                }
            }, 50);

            loadTimeout = window.setTimeout(() => {
                finish(() => reject(new Error("Turnstile did not initialize in time.")));
            }, 10000);
        };

        if (!script) {
            script = document.createElement("script");
            script.id = turnstileScriptId;
            script.src = turnstileScriptSrc;
            script.async = true;
            script.defer = true;
            script.addEventListener("load", onLoad);
            script.addEventListener("error", onError);
            document.head.appendChild(script);
            startReadinessPoll();
            return;
        }

        script.addEventListener("load", onLoad);
        script.addEventListener("error", onError);
        startReadinessPoll();
    }).catch((error) => {
        turnstileLoadPromise = null;
        throw error;
    });

    return turnstileLoadPromise;
}

/**
 * Read the Laravel XSRF-TOKEN cookie so the degraded-mode request passes CSRF.
 *
 * @returns {string}
 */
function readXsrfToken() {
    if (typeof document === "undefined") {
        return "";
    }

    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : "";
}

/**
 * Request a server-issued degraded-mode human-verification challenge.
 *
 * The server decides whether a fallback may be issued at all: it must have
 * already served a Turnstile challenge for this session, the per-visitor and
 * platform-wide quotas must have room, and the fallback must be enabled. This
 * function only asks; it can never grant itself a bypass.
 *
 * @param {string} issueUrl
 * @returns {Promise<{question: string, nonce: string, issuedAt: number}>}
 */
export function requestFallbackChallenge(issueUrl) {
    if (!issueUrl) {
        return Promise.reject(new Error("No fallback endpoint is configured."));
    }

    const headers = {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
    };
    const xsrfToken = readXsrfToken();

    if (xsrfToken) {
        headers["X-XSRF-TOKEN"] = xsrfToken;
    }

    return fetch(issueUrl, {
        method: "GET",
        credentials: "same-origin",
        headers,
    }).then(async (response) => {
        let payload = null;

        try {
            payload = await response.json();
        } catch {
            payload = null;
        }

        if (!response.ok || !payload?.available || !payload?.nonce || !payload?.question) {
            throw new Error(payload?.message || "The backup security check is not available right now.");
        }

        return {
            question: String(payload.question),
            nonce: String(payload.nonce),
            issuedAt: Number(payload.issuedAt) || 0,
        };
    });
}
