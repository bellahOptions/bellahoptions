export default function HashLoader({ color = '#050a80', size = 56 }) {
    const barStyle = {
        backgroundColor: color,
        height: size * 0.16,
        width: size * 0.58,
    };

    return (
        <span
            className="relative inline-flex items-center justify-center"
            style={{ height: size, width: size }}
            role="status"
            aria-label="Loading"
        >
            <span
                className="absolute animate-hash-loader-first rounded-full"
                style={barStyle}
            />
            <span
                className="absolute animate-hash-loader-second rounded-full"
                style={barStyle}
            />
        </span>
    );
}
