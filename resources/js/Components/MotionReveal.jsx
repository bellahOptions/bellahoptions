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

export function RevealSection({ children, className = "", variants = fadeUp, ...props }) {
    return (
        <motion.section
            className={className}
            variants={variants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.18 }}
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
            viewport={{ once: true, amount: 0.2 }}
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
            viewport={{ once: true, amount: 0.14 }}
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
