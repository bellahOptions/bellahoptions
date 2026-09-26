import { useCallback, useEffect, useRef, useState } from "react";
import { requestFallbackChallenge } from "@/lib/turnstile";

/**
 * Manages the degraded-mode human-verification challenge shown when the primary
 * Cloudflare Turnstile widget cannot be delivered.
 *
 * The hook never decides on its own that a visitor may skip verification: it
 * asks the server for a fallback challenge and only reports success when the
 * server issues one. Until then the form keeps requiring the primary captcha.
 *
 * @param {object} options
 * @param {string} options.mode              Server-declared verification mode.
 * @param {boolean} options.fallbackAvailable Whether the server offers a fallback.
 * @param {string} options.fallbackIssueUrl   Server-provided endpoint URL.
 * @param {(challenge: {question: string, nonce: string}) => void} [options.onFallbackActivate]
 * @returns {{fallback: {active: boolean, question: string, nonce: string, error: string}, isRequestingFallback: boolean, activateFallback: () => Promise<boolean>, resetFallback: () => void}}
 */
export default function useTurnstileFallback({
    mode,
    fallbackAvailable,
    fallbackIssueUrl,
    onFallbackActivate,
} = {}) {
    const [fallback, setFallback] = useState({
        active: false,
        question: "",
        nonce: "",
        error: "",
    });
    const [isRequestingFallback, setIsRequestingFallback] = useState(false);

    const inFlightRef = useRef(null);
    const activateRef = useRef(onFallbackActivate);

    useEffect(() => {
        activateRef.current = onFallbackActivate;
    }, [onFallbackActivate]);

    useEffect(() => {
        if (mode !== "turnstile" || fallbackAvailable) {
            return;
        }

        // The server is not offering a fallback: make sure no stale fallback
        // state can keep a form submittable.
        inFlightRef.current = null;
        setIsRequestingFallback(false);
        setFallback({ active: false, question: "", nonce: "", error: "" });
    }, [mode, fallbackAvailable]);

    const activateFallback = useCallback(async () => {
        if (mode !== "turnstile" || !fallbackAvailable || !fallbackIssueUrl) {
            return false;
        }

        if (inFlightRef.current) {
            return inFlightRef.current;
        }

        setIsRequestingFallback(true);

        const request = requestFallbackChallenge(fallbackIssueUrl)
            .then((challenge) => {
                setFallback({
                    active: true,
                    question: challenge.question,
                    nonce: challenge.nonce,
                    error: "",
                });
                activateRef.current?.(challenge);

                return true;
            })
            .catch((error) => {
                setFallback((current) => ({
                    ...current,
                    active: false,
                    error: error?.message || "The backup security check is not available right now.",
                }));

                return false;
            })
            .finally(() => {
                inFlightRef.current = null;
                setIsRequestingFallback(false);
            });

        inFlightRef.current = request;

        return request;
    }, [fallbackAvailable, fallbackIssueUrl, mode]);

    const resetFallback = useCallback(() => {
        inFlightRef.current = null;
        setIsRequestingFallback(false);
        setFallback({ active: false, question: "", nonce: "", error: "" });
    }, []);

    return { fallback, isRequestingFallback, activateFallback, resetFallback };
}
