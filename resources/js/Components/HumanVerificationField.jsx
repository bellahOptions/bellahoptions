import { useEffect, useRef, useState } from "react";
import { loadTurnstileScript } from "@/lib/turnstile";

export default function HumanVerificationField({
    mode = "math",
    question = "",
    turnstileSiteKey = "",
    mathValue = "",
    onMathChange,
    onTurnstileChange,
    mathError = "",
    turnstileError = "",
    labelPrefix = "Human Check",
    inputClassName = "jv-input",
}) {
    const [turnstileClientError, setTurnstileClientError] = useState("");
    const turnstileContainerRef = useRef(null);
    const turnstileWidgetIdRef = useRef(null);
    const onTurnstileChangeRef = useRef(onTurnstileChange);

    useEffect(() => {
        onTurnstileChangeRef.current = onTurnstileChange;
    }, [onTurnstileChange]);

    useEffect(() => {
        if (mode !== "turnstile") {
            return;
        }

        if (!turnstileSiteKey) {
            return;
        }

        let cancelled = false;

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
                        setTurnstileClientError("Captcha verification failed. Please try again.");
                        return true;
                    },
                });
                setTurnstileClientError("");
            })
            .catch(() => {
                if (!cancelled) {
                    setTurnstileClientError("Captcha failed to load. Please refresh and try again.");
                }
            });

        return () => {
            cancelled = true;
            if (window.turnstile && turnstileWidgetIdRef.current !== null) {
                window.turnstile.remove(turnstileWidgetIdRef.current);
                turnstileWidgetIdRef.current = null;
            }
        };
    }, [mode, turnstileSiteKey]);

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
        return (
            <div className="jv-field">
                <label className="jv-label">Security Check</label>
                {turnstileSiteKey ? (
                    <div ref={turnstileContainerRef} className="min-h-16" />
                ) : (
                    <p className="text-sm text-red-300">
                        Captcha site key is not configured. Please contact support.
                    </p>
                )}
                {(turnstileError || turnstileClientError) && (
                    <p className="text-xs text-red-300">{turnstileError || turnstileClientError}</p>
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
