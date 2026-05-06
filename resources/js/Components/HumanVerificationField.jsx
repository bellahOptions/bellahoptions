import { useEffect, useRef, useState } from "react";

const turnstileScriptSrc = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

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
    inputClassName = "w-full rounded-md border-gray-300 text-sm focus:border-[#000285] focus:ring-[#000285]",
}) {
    const [turnstileClientError, setTurnstileClientError] = useState("");
    const turnstileContainerRef = useRef(null);
    const turnstileWidgetIdRef = useRef(null);

    useEffect(() => {
        if (mode !== "turnstile") {
            return;
        }

        const renderWidget = () => {
            if (!turnstileSiteKey || !turnstileContainerRef.current || turnstileWidgetIdRef.current !== null) {
                return;
            }

            if (!window.turnstile || typeof window.turnstile.render !== "function") {
                setTurnstileClientError("Captcha is still loading. Please wait a moment.");

                return;
            }

            setTurnstileClientError("");
            turnstileWidgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
                sitekey: turnstileSiteKey,
                callback: (token) => {
                    onTurnstileChange?.(token);
                    setTurnstileClientError("");
                },
                "expired-callback": () => {
                    onTurnstileChange?.("");
                    setTurnstileClientError("Verification expired. Please complete the captcha again.");
                },
                "error-callback": () => {
                    onTurnstileChange?.("");
                    setTurnstileClientError("Captcha verification failed. Please try again.");
                },
            });
        };

        const timer = window.setTimeout(renderWidget, 80);

        return () => window.clearTimeout(timer);
    }, [mode, onTurnstileChange, turnstileSiteKey]);

    useEffect(() => {
        if (mode !== "turnstile" || !turnstileError) {
            return;
        }

        if (window.turnstile && turnstileWidgetIdRef.current !== null) {
            window.turnstile.reset(turnstileWidgetIdRef.current);
        }
        onTurnstileChange?.("");
    }, [mode, onTurnstileChange, turnstileError]);

    if (mode === "turnstile") {
        return (
            <div>
                <script src={turnstileScriptSrc} async defer />
                <label className="mb-2 block text-sm font-bold text-gray-700">Security Check</label>
                {turnstileSiteKey ? (
                    <div ref={turnstileContainerRef} className="min-h-16" />
                ) : (
                    <p className="text-sm text-red-600">
                        Captcha site key is not configured. Please contact support.
                    </p>
                )}
                {(turnstileError || turnstileClientError) && (
                    <p className="mt-1 text-xs text-red-600">{turnstileError || turnstileClientError}</p>
                )}
            </div>
        );
    }

    return (
        <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">
                {labelPrefix}: {question}
            </label>
            <input
                type="text"
                value={mathValue}
                onChange={(event) => onMathChange?.(event.target.value)}
                className={inputClassName}
                placeholder="Enter answer"
            />
            {mathError && <p className="mt-1 text-xs text-red-600">{mathError}</p>}
        </div>
    );
}
