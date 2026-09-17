import { Section } from "@/Components/PublicUI";

const brandLogos = [
    { name: "Wingram", src: "/Wingram-07.svg" },
    { name: "Lexis Group", src: "/lexis.svg" },
    { name: "Velit", src: "/velit.svg" },
    { name: "Ziego Furnitures", src: "/ziego.svg" },
    { name: "Neddstech", src: "/neddstech.svg" },
    { name: "Rovv Africa", src: "/rovv.svg" },
    { name: "Clime Space", src: "/clime.png" },
    { name: "Kasa", src: "/kasa.svg" },
];

// The marquee animation translates the track by exactly -50%, so it only
// loops seamlessly when the track holds precisely two copies of the set —
// a third copy throws off that math and makes the loop jump.
const scrollingLogos = [...brandLogos, ...brandLogos];

export default function TrustedByLogos({ className = "" }) {
    return (
        <Section tight reveal={false} className={`border-y border-jv-line ${className}`}>
            <div className="grid items-center gap-8 lg:grid-cols-[240px_1fr]">
                <div className="text-center lg:text-left">
                    <p className="jv-mono text-white/40">Trusted By</p>
                    <p className="jv-small mt-2 max-w-xs">
                        Growing brands, teams, and founders building stronger digital presence.
                    </p>
                </div>
                <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
                    <div className="jv-marquee items-center gap-14 sm:gap-20">
                        {scrollingLogos.map((logo, index) => (
                            <img
                                key={`${logo.name}-${index}`}
                                src={logo.src}
                                className="h-8 w-auto shrink-0 brightness-0 invert opacity-50 transition hover:opacity-90 sm:h-10 lg:h-11"
                                alt={logo.name}
                                loading="lazy"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </Section>
    );
}
