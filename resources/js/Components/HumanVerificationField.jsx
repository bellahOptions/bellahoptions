import { useEffect, useRef, useState } from "react";
import { loadTurnstileScript } from "@/lib/turnstile";
import useTurnstileFallback from "@/hooks/use-turnstile-fallback";

/**
 * Shared human-verification field.
 *
 * Primary path: the Cloudflare Turnstile widget. When the widget cannot be
 * delivered the component asks the server for a degraded-mode challenge and
 * only switches over when the server actually issues one.
 *
 * `onFallbackChange` receives the server-issued challenge so the parent form can
 * store the matching nonce and question alongside its other form data.
 */
export default function HumanVerificationField({
    mode = "math",
    question = "",
    turnstileSiteKey = "",
    fallbackAvailable = false,
    fallbackIssueUrl = "",
    mathValue = "",
    onMathChange,
    onTurnstileChange,
    onFallbackChange,
    mathError = "",
    turnstileError = "",
    labelPrefix = "Human Check",
    inputClassName = "jv-input",
}) {
    const [turnstileClientError, setTurnstileClientError] = useState("");
    const turnstileContainerRef = useRef(null);
    const turnstileWidgetIdRef = useRef(null);
    const onTurnstileChangeRef = useRef(onTurnstileChange);
    const onFallbackChangeRef = useRef(onFallbackChange);

    useEffect(() => {
        onTurnstileChangeRef.current = onTurnstileChange;
    }, [onTurnstileChange]);

    useEffect(() => {
        onFallbackChangeRef.current = onFallbackChange;
    }, [onFallbackChange]);

    const { fallback, isRequestingFallback, activateFallback } = useTurnstileFallback({
        mode,
        fallbackAvailable,
        fallbackIssueUrl,
        onFallbackActivate: (challenge) => {
            setTurnstileClientError("");
            onFallbackChangeRef.current?.(challenge);
        },
    });

    useEffect(() => {
        if (mode !== "turnstile") {
            return;
        }

        if (!turnstileSiteKey || fallback.active) {
            return;
        }

        let cancelled = false;

        const useFallback = () => {
            if (fallbackAvailable) {
                void activateFallback();
            } else {
                setTurnstileClientError("Captcha failed to load. Please refresh the page and try again.");
            }
        };

        loadTurnstileScript()
            .then((turnstile) => {
                if (cancelled || !turnstileContainerRef.current || turnstileWidgetIdRef.current !== null) {
                    return;
                }

                turnstileWidgetIdRef.current = turnstile.render(turnstileContainerRef.current, {
                    sitekey: turnstileSiteKey,
                    appearance: "always",
                    execution: "render",
                    callback: (token) => {
                        onTurnstileChangeRef.current?.(token);
                        setTurnstileClientError("");
                    },
                    "expired-callback": () => {
                        onTurnstileChangeRef.current?.("");
                        setTurnstileClientError("Verification expired. Please complete the captcha again.");
                    },
                    "error-callback": () => {
                        onTurnstileChangeRef.current?.("");
                        useFallback();

                        return true;
                    },
                });
                setTurnstileClientError("");
            })
            .catch(() => {
                if (!cancelled) {
                    useFallback();
                }
            });

        return () => {
            cancelled = true;
            if (window.turnstile && turnstileWidgetIdRef.current !== null) {
                window.turnstile.remove(turnstileWidgetIdRef.current);
                turnstileWidgetIdRef.current = null;
            }
        };
    }, [activateFallback, fallback.active, fallbackAvailable, mode, turnstileSiteKey]);

    useEffect(() => {
        if (mode !== "turnstile" || !turnstileError) {
            return;
        }

        if (window.turnstile && turnstileWidgetIdRef.current !== null) {
            window.turnstile.reset(turnstileWidgetIdRef.current);
        }
        onTurnstileChangeRef.current?.("");
    }, [mode, turnstileError]);

    if (mode === "turnstile") {
        const showFallback = fallback.active;
        const errorMessage = turnstileError || fallback.error || turnstileClientError;

        return (
            <div className="jv-field">
                <label className="jv-label">
                    {showFallback ? `${labelPrefix}: ${fallback.question}` : "Security Check"}
                </label>
                {showFallback ? (
                    <>
                        <input
                            type="text"
                            value={mathValue}
                            onChange={(event) => onMathChange?.(event.target.value)}
                            className={inputClassName}
                            placeholder="Enter answer"
                        />
                        <p className="mt-1 text-xs text-white/60">
                            The captcha could not load, so a backup security check is in use.
                        </p>
                    </>
                ) : turnstileSiteKey ? (
                    <div ref={turnstileContainerRef} className="min-h-16" />
                ) : (
                    <p className="text-sm text-red-300">
                        Captcha site key is not configured. Please contact support.
                    </p>
                )}
                {isRequestingFallback && (
                    <p className="text-xs text-white/60">Loading backup security check…</p>
                )}
                {errorMessage && <p className="text-xs text-red-300">{errorMessage}</p>}
                {showFallback && !errorMessage && mathError && (
                    <p className="text-xs text-red-300">{mathError}</p>
                )}
            </div>
        );
    }

    return (
        <div className="jv-field">
            <label className="jv-label">
                {labelPrefix}: {question}
            </label>
            <input
                type="text"
                value={mathValue}
                onChange={(event) => onMathChange?.(event.target.value)}
                className={inputClassName}
                placeholder="Enter answer"
            />
            {mathError && <p className="text-xs text-red-300">{mathError}</p>}
        </div>
    );
}
