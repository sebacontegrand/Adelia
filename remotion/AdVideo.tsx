import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Img } from 'remotion';

export interface AdVideoProps {
    headline: string;
    subtext: string;
    brandColor: string;
    bgImage: string;
    logo?: string;
    ctaText?: string;
    overlayOpacity?: number;
}

export const AdVideo: React.FC<AdVideoProps> = ({
    headline,
    subtext,
    brandColor,
    bgImage,
    logo,
    ctaText,
    overlayOpacity = 0.6
}) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();

    // Animations
    const springValue = spring({
        frame,
        fps,
        config: {
            stiffness: 100,
        },
    });

    const ctaSpring = spring({
        frame: frame - 50,
        fps,
        config: { stiffness: 100 }
    });

    const headlineOpacity = interpolate(frame, [0, 20], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });

    const subtextY = interpolate(springValue, [0, 1], [20, 0]);
    const subtextOpacity = interpolate(frame, [25, 45], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });

    const bgScale = interpolate(frame, [0, durationInFrames], [1, 1.2]);

    return (
        <AbsoluteFill style={{ backgroundColor: 'black' }}>
            {/* Background Image */}
            <AbsoluteFill style={{ transform: `scale(${bgScale})` }}>
                {bgImage ? (
                    <Img src={bgImage} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                ) : (
                    <div style={{ width: '100%', height: '100%', backgroundColor: '#1a1a1a' }} />
                )}
            </AbsoluteFill>

            {/* Gradient Overlay */}
            <AbsoluteFill style={{
                background: `linear-gradient(to bottom, rgba(0,0,0,0.8), ${brandColor}CC)`,
                opacity: overlayOpacity,
                mixBlendMode: 'multiply'
            }} />

            {/* Logo Section */}
            {logo && (
                <AbsoluteFill style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    paddingTop: '60px',
                    opacity: headlineOpacity,
                    transform: `scale(${interpolate(frame, [0, 20], [0.8, 1])})`
                }}>
                    <Img src={logo} style={{ height: '80px', width: 'auto', filter: 'drop-shadow(0 5px 15px rgba(0,0,0,0.3))' }} />
                </AbsoluteFill>
            )}

            {/* Content Container */}
            <AbsoluteFill style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '100px',
                textAlign: 'center',
                color: 'white',
                fontFamily: 'Helvetica, Arial, sans-serif'
            }}>
                <div style={{
                    opacity: headlineOpacity,
                    transform: `scale(${springValue})`,
                    fontSize: '90px',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    letterSpacing: '-2px',
                    textShadow: '0 15px 30px rgba(0,0,0,0.5)',
                    marginBottom: '10px',
                    lineHeight: 1
                }}>
                    {headline}
                </div>

                <div style={{
                    opacity: subtextOpacity,
                    transform: `translateY(${subtextY}px)`,
                    fontSize: '40px',
                    fontWeight: '300',
                    textShadow: '0 5px 15px rgba(0,0,0,0.3)',
                    maxWidth: '80%'
                }}>
                    {subtext}
                </div>

                {/* CTA Button */}
                {ctaText && (
                    <div style={{
                        marginTop: '60px',
                        padding: '20px 60px',
                        backgroundColor: brandColor,
                        borderRadius: '100px',
                        fontSize: '32px',
                        fontWeight: 'bold',
                        color: 'white',
                        boxShadow: '0 15px 35px rgba(0,0,0,0.3)',
                        opacity: interpolate(frame, [50, 70], [0, 1], { extrapolateRight: 'clamp' }),
                        transform: `scale(${ctaSpring})`
                    }}>
                        {ctaText}
                    </div>
                )}
            </AbsoluteFill>
        </AbsoluteFill>
    );
};
