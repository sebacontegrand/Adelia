import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion"

export const AnimatedTitle: React.FC = () => {
    const frame = useCurrentFrame()
    const { fps } = useVideoConfig()

    const words = ["Design", "the", "Future", "of"]
    const highlightWords = ["Digital", "Creatives"]

    // Stagger animation for each word
    const getWordAnimation = (index: number) => {
        const delay = index * 8 // Delay each word by 8 frames
        const progress = spring({
            frame: frame - delay,
            fps,
            config: {
                damping: 20,
                stiffness: 80,
            },
        })

        return {
            opacity: interpolate(progress, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(progress, [0, 1], [30, 0])}px)`,
        }
    }

    // Special animation for highlight words (faster, more dramatic)
    const getHighlightAnimation = (index: number) => {
        const delay = (words.length + index) * 8
        const progress = spring({
            frame: frame - delay,
            fps,
            config: {
                damping: 15,
                stiffness: 120,
            },
        })

        return {
            opacity: interpolate(progress, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(progress, [0, 1], [40, 0])}px) scale(${interpolate(progress, [0, 1], [0.9, 1])})`,
        }
    }

    // Pulsing glow effect for gradient text
    const glowIntensity = interpolate(
        Math.sin((frame / 30) * Math.PI),
        [-1, 1],
        [0.5, 1]
    )

    return (
        <AbsoluteFill
            style={{
                backgroundColor: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                padding: "0",
                fontFamily: "system-ui, -apple-system, sans-serif",
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "24px",
                    fontSize: "120px",
                    fontWeight: 800,
                    lineHeight: 1.1,
                    maxWidth: "100%",
                    justifyContent: "center",
                }}
            >
                {words.map((word, i) => (
                    <span
                        key={i}
                        style={{
                            ...getWordAnimation(i),
                            display: "inline-block",
                            color: "#ffffff",
                        }}
                    >
                        {word}
                    </span>
                ))}
                {highlightWords.map((word, i) => (
                    <span
                        key={i}
                        style={{
                            ...getHighlightAnimation(i),
                            display: "inline-block",
                            fontSize: "120px",
                            background: "linear-gradient(to right, #60a5fa, #34d399)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                            filter: `drop-shadow(0 0 ${30 * glowIntensity}px rgba(96, 165, 250, 0.8))`,
                            marginLeft: i === 0 ? "0px" : "20px",
                        }}
                    >
                        {word}
                    </span>
                ))}
            </div>
        </AbsoluteFill>
    )
}
