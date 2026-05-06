const turnstileScriptId = "cf-turnstile-api-script";
const turnstileScriptSrc = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let turnstileLoadPromise = null;

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
