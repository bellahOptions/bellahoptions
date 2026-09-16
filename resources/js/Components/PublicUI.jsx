import { Link } from '@inertiajs/react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { RevealSection, Stagger, StaggerItem } from '@/Components/MotionReveal';

/**
 * Joyce-style public UI primitives.
 *
 * These wrap the `.jv-*` design-system classes defined in `resources/css/app.css`
 * so pages share one visual language instead of re-deriving it from utilities.
 */

function classes(...values) {
    return values.filter(Boolean).join(' ');
}

/** Vertical rhythm wrapper for a page band. */
export function Section({ children, className = '', containerClassName = '', tight = false, reveal = true, ...props }) {
    const Wrapper = reveal ? RevealSection : 'section';

    return (
        <Wrapper
            className={classes('jv-section', tight && 'jv-section--tight', className)}
            {...props}
        >
            <div className={classes('jv-container', containerClassName)}>{children}</div>
        </Wrapper>
    );
}

/**
 * Section marker: a short accent rule followed by letterspaced uppercase text.
 *
 * Replaces the old pill-style `Eyebrow`. The pill read as a status badge and
 * collided visually with `.jv-tag` / `Badge`, so a section label and a real
 * badge looked the same. This is deliberately typographic — no capsule, no
 * glow — which keeps the hierarchy clear and stays legible in the dense
 * admin/dashboard headers.
 *
 * The export name is kept as `Eyebrow` so all existing call sites keep working.
 */
export function Eyebrow({ children, center = false, strong = false, size = 'md', className = '', as: Tag = 'span' }) {
    return (
        <Tag
            className={classes(
                'jv-kicker',
                center && 'jv-kicker--center',
                strong && 'jv-kicker--strong',
                size === 'sm' && 'jv-kicker--sm',
                className,
            )}
        >
            {children}
        </Tag>
    );
}

/**
 * Oversized display heading. Pass `muted` to render the second line in the
 * dimmed tone the reference uses.
 */
export function Display({
    children,
    size = 'lg',
    muted = null,
    as: Tag = 'h2',
    className = '',
    ...props
}) {
    return (
        <Tag className={classes('jv-display', `jv-display--${size}`, className)} {...props}>
            {children}
            {muted ? (
                <>
                    {' '}
                    <span className="jv-muted">{muted}</span>
                </>
            ) : null}
        </Tag>
    );
}

/** Centered section intro: eyebrow → heading → sub-copy. */
export function SectionHeading({
    eyebrow,
    title,
    muted,
    description,
    align = 'center',
    size = 'lg',
    className = '',
    children,
}) {
    const alignment = align === 'left' ? 'text-left items-start' : align === 'right' ? 'text-right items-end' : 'items-center text-center';

    return (
        <div className={classes('flex flex-col', alignment, className)}>
            {eyebrow ? <Eyebrow center={align === 'center'}>{eyebrow}</Eyebrow> : null}
            {title ? (
                <Display size={size} muted={muted} className={eyebrow ? 'mt-6' : ''}>
                    {title}
                </Display>
            ) : null}
            {description ? (
                <p className={classes('jv-lead', align === 'center' ? 'mx-auto max-w-2xl' : 'max-w-2xl', title ? 'mt-5' : '')}>
                    {description}
                </p>
            ) : null}
            {children}
        </div>
    );
}

/** Glass surface. */
export function Card({ children, className = '', hover = false, pad = true, flat = false, solid = false, featured = false, as: Tag = 'div', ...props }) {
    return (
        <Tag
            className={classes(
                'jv-card',
                pad && 'jv-card--pad',
                hover && 'jv-card--hover',
                flat && 'jv-card--flat',
                solid && 'jv-card--solid',
                featured && 'jv-card--featured',
                className,
            )}
            {...props}
        >
            {children}
        </Tag>
    );
}

const buttonVariantClass = {
    primary: 'jv-btn--primary',
    ghost: 'jv-btn--ghost',
    outline: 'jv-btn--outline',
    white: 'jv-btn--white',
};

const buttonSizeClass = {
    sm: 'jv-btn--sm',
    md: '',
    lg: 'jv-btn--lg',
};

/**
 * Pill button. Renders an Inertia `<Link>` when `href` is an internal path,
 * an `<a>` for external URLs, otherwise a `<button>`.
 *
 * The label is wrapped in a span so it is a real flex item. As an anonymous
 * flex item the text node inherits the button's `white-space` and cannot wrap,
 * which made long labels (e.g. "Subscribe now" in a narrow package card)
 * overflow the pill. `jv-btn__label` lets it wrap and break safely instead.
 */
export function Button({
    children,
    variant = 'primary',
    size = 'md',
    href = null,
    external = false,
    icon = false,
    className = '',
    type = 'button',
    ...props
}) {
    const shared = classes(
        'jv-btn',
        buttonVariantClass[variant] || buttonVariantClass.primary,
        buttonSizeClass[size],
        className,
    );

    const content = (
        <>
            <span className="jv-btn__label">{children}</span>
            {icon ? <ArrowRightIcon className="h-4 w-4 shrink-0" /> : null}
        </>
    );

    if (href && external) {
        return (
            <a href={href} target="_blank" rel="noreferrer" className={shared} {...props}>
                {content}
            </a>
        );
    }

    if (href) {
        return (
            <Link href={href} className={shared} {...props}>
                {content}
            </Link>
        );
    }

    return (
        <button type={type} className={shared} {...props}>
            {content}
        </button>
    );
}

/** Checkmark list row. */
export function CheckItem({ children, icon: Icon, className = '' }) {
    return (
        <li className={classes('jv-check', className)}>
            {Icon ? <Icon className="h-4 w-4" /> : <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-jv-accent" />}
            <span>{children}</span>
        </li>
    );
}

/** Numbered process step card (icon → "Stage N" → title → copy). */
export function ProcessCard({ step, title, description, icon: Icon, className = '' }) {
    return (
        <Card hover className={classes('flex flex-col', className)}>
            {Icon ? (
                <span className="mb-6 inline-flex h-11 w-11 items-center justify-center rounded-jv-sm border border-jv-line-strong bg-white/[0.06] text-jv-accent">
                    <Icon className="h-5 w-5" />
                </span>
            ) : null}
            {step ? <span className="jv-mono text-white/40">Stage {step}</span> : null}
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-white">{title}</h3>
            {description ? <p className="jv-body mt-3">{description}</p> : null}
        </Card>
    );
}

/** Big-number metric, as used in the reference stat rows. */
export function Stat({ value, label, className = '' }) {
    return (
        <div className={className}>
            <p className="jv-display jv-display--md">{value}</p>
            <p className="jv-small mt-2">{label}</p>
        </div>
    );
}

export { RevealSection, Stagger, StaggerItem };
