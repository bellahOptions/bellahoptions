import { useCallback, useMemo, useState } from "react";

/**
 * Page-level state for the shared <HumanVerificationField />.
 *
 * It mirrors the server-declared verification mode and holds the challenge
 * currently on screen. Two ways the fallback can become active:
 *
 *  - the server already issued one for this render (for example after a failed
 *    submission consumed the previous challenge), signalled by
 *    `humanVerificationFallback.active` plus a question/nonce in the props; or
 *  - the visitor's captcha could not load and the server granted a fresh
 *    challenge, which arrives through `handleFallbackChallenge`.
 *
 * Either way the challenge always comes from the server, never from the client.
 *
 * @param {object} props Inertia page props for the form.
 * @returns {{verificationMode: string, question: string, fallbackAvailable: boolean, fallbackIssueUrl: string, handleFallbackChallenge: (challenge: {question: string, nonce: string}) => void}}
 */
export default function useHumanVerificationState({
    humanVerificationMode = "math",
    humanCheckQuestion = "",
    humanCheckNonce = "",
    humanVerificationFallback = {},
    setData,
} = {}) {
    const fallbackAvailable = Boolean(humanVerificationFallback?.available);
    const fallbackIssueUrl = String(humanVerificationFallback?.issueUrl || "");
    const serverIssuedFallback =
        Boolean(humanVerificationFallback?.active) &&
        Boolean(humanCheckQuestion) &&
        Boolean(humanCheckNonce);

    const [fallbackChallenge, setFallbackChallenge] = useState(() =>
        serverIssuedFallback
            ? { active: true, question: String(humanCheckQuestion), nonce: String(humanCheckNonce) }
            : { active: false, question: "", nonce: "" },
    );

    const handleFallbackChallenge = useCallback(
        (challenge) => {
            if (!challenge?.nonce || !challenge?.question) {
                return;
            }

            setFallbackChallenge({
                active: true,
                question: String(challenge.question),
                nonce: String(challenge.nonce),
            });

            // The submission must carry the challenge the server just issued.
            setData?.("human_check_nonce", String(challenge.nonce));
        },
        [setData],
    );

    // While the fallback is active the form behaves exactly like the plain math
    // mode: the server keeps requiring the Turnstile-or-fallback decision and
    // validates the answer against the single-use challenge it issued.
    const verificationMode = fallbackChallenge.active ? "math" : humanVerificationMode;
    const question = fallbackChallenge.active ? fallbackChallenge.question : humanCheckQuestion;
    const fallbackActive = fallbackChallenge.active;

    return useMemo(
        () => ({
            verificationMode,
            question,
            fallbackActive,
            fallbackAvailable: humanVerificationMode === "turnstile" && fallbackAvailable,
            fallbackIssueUrl,
            handleFallbackChallenge,
        }),
        [
            fallbackActive,
            fallbackAvailable,
            fallbackIssueUrl,
            handleFallbackChallenge,
            humanVerificationMode,
            question,
            verificationMode,
        ],
    );
}
