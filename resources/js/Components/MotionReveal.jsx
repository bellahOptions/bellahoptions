import { motion } from "motion/react";

export const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0 },
};

export const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

export const scaleIn = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1 },
};

export const staggerContainer = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.09,
            delayChildren: 0.08,
        },
    },
};

const defaultTransition = {
    duration: 0.55,
    ease: [0.22, 1, 0.36, 1],
};

/**
 * Query for the in-view options used by every reveal wrapper.
 *
 * We use `amount: "some"` rather than a numeric threshold. A numeric threshold
 * is relative to the ELEMENT's height, so any section taller than
 * `threshold x viewportHeight` can never report enough of itself as visible and
 * stays stuck at opacity 0 permanently — which is what happened to the long
 * services page. "some" fires as soon as any part of the element intersects the
 * viewport, so it behaves identically for a small card and a 14,000px section.
 *
 * The bottom margin is intentionally 0: a negative margin shrinks the root
 * bounds and can stop elements near the very bottom of the page from ever
 * intersecting.
 */
const inViewOptions = { once: true, amount: "some" };

export function RevealSection({ children, className = "", variants = fadeUp, ...props }) {
    return (
        <motion.section
            className={className}
            variants={variants}
            initial="hidden"
            whileInView="visible"
            viewport={inViewOptions}
            transition={defaultTransition}
            {...props}
        >
            {children}
        </motion.section>
    );
}

export function Reveal({ children, className = "", variants = fadeUp, ...props }) {
    return (
        <motion.div
            className={className}
            variants={variants}
            initial="hidden"
            whileInView="visible"
            viewport={inViewOptions}
            transition={defaultTransition}
            {...props}
        >
            {children}
        </motion.div>
    );
}

export function Stagger({ children, className = "", ...props }) {
    return (
        <motion.div
            className={className}
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={inViewOptions}
            {...props}
        >
            {children}
        </motion.div>
    );
}

const motionComponents = {
    article: motion.article,
    div: motion.div,
    section: motion.section,
};

export function StaggerItem({ children, className = "", as = "div", variants = fadeUp, ...props }) {
    const Component = motionComponents[as] || motion.div;

    return (
        <Component
            className={className}
            variants={variants}
            transition={defaultTransition}
            {...props}
        >
            {children}
        </Component>
    );
}
