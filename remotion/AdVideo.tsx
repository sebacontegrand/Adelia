import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Img } from 'remotion';

export interface AdVideoProps {
    headline: string;
    subtext: string;
    brandColor: string;
    bgImage: string;
    logo?: string;
    ctaText?: string;
    overlayOpacity?: number;
    headlineStartFrame?: number;
    subtextStartFrame?: number;
    ctaStartFrame?: number;
    fontFamily?: string;
    bgBlur?: number;
    bgGrayscale?: boolean;
    gradientDirection?: 'top-to-bottom' | 'left-to-right' | 'radial';
    animationStyle?: 'cinematic' | 'fast' | 'minimal';
    textAlignment?: 'left' | 'center' | 'right';
    showSafeZones?: boolean;
    showProgressBar?: boolean;
    logoPosition?: 'top-left' | 'top-right' | 'center' | 'bottom-right';
    ctaMarginBottom?: number;
}

export const AdVideo: React.FC<AdVideoProps> = ({
    headline,
    subtext,
    brandColor,
    bgImage,
    logo,
    ctaText,
    overlayOpacity = 0.6,
    headlineStartFrame = 0,
    subtextStartFrame = 25,
    ctaStartFrame = 50,
    fontFamily = 'Helvetica, Arial, sans-serif',
    bgBlur = 0,
    bgGrayscale = false,
    gradientDirection = 'top-to-bottom',
    animationStyle = 'cinematic',
    textAlignment = 'center',
    showSafeZones = false,
    showProgressBar = false,
    logoPosition = 'center',
    ctaMarginBottom = 60
}) => {
    const frame = useCurrentFrame();
    const { width, height, fps, durationInFrames } = useVideoConfig();

    // Scale factors based on 1920px reference width
    const s = width / 1920;
    const padding = 100 * s;

    // Animations
    const springValue = spring({
        frame: frame - headlineStartFrame,
        fps,
        config: {
            stiffness: 100,
        },
    });

    const subtextSpring = spring({
        frame: frame - subtextStartFrame,
        fps,
        config: {
            stiffness: 100,
        },
    });

    const ctaSpring = spring({
        frame: frame - ctaStartFrame,
        fps,
        config: { stiffness: 100 }
    });

    const headlineOpacity = interpolate(frame - headlineStartFrame, [0, 20], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });

    const subtextY = interpolate(subtextSpring, [0, 1], [20 * s, 0]);
    const subtextOpacity = interpolate(frame - subtextStartFrame, [0, 20], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });

    const bgScale = interpolate(frame, [0, durationInFrames], animationStyle === 'cinematic' ? [1, 1.2] : [1, 1]);

    const getGradient = () => {
        if (gradientDirection === 'left-to-right') return `linear-gradient(to right, rgba(0,0,0,0.8), ${brandColor}CC)`;
        if (gradientDirection === 'radial') return `radial-gradient(circle, ${brandColor}CC, rgba(0,0,0,0.8))`;
        return `linear-gradient(to bottom, rgba(0,0,0,0.8), ${brandColor}CC)`;
    };

    const getLogoStyle = (): React.CSSProperties => {
        const base: React.CSSProperties = {
            position: 'absolute',
            padding: `${40 * s}px`,
            display: 'flex',
            zIndex: 10,
            opacity: headlineOpacity,
            transform: `scale(${interpolate(frame, [0, 20], [0.8, 1])})`,
        };
        switch (logoPosition) {
            case 'top-left': return { ...base, top: 0, left: 0, justifyContent: 'flex-start' };
            case 'top-right': return { ...base, top: 0, right: 0, justifyContent: 'flex-end' };
            case 'bottom-right': return { ...base, bottom: 0, right: 0, justifyContent: 'flex-end', paddingBottom: `${60 * s}px` };
            case 'center':
            default: return { ...base, top: `${60 * s}px`, width: '100%', justifyContent: 'center' };
        }
    };

    return (
        <AbsoluteFill style={{ backgroundColor: 'black' }}>
            {/* Background Image */}
            <AbsoluteFill style={{ transform: `scale(${bgScale})`, filter: `blur(${bgBlur * s}px) ${bgGrayscale ? 'grayscale(100%)' : ''}` }}>
                {bgImage ? (
                    <Img src={bgImage} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                ) : (
                    <div style={{ width: '100%', height: '100%', backgroundColor: '#1a1a1a' }} />
                )}
            </AbsoluteFill>

            {/* Gradient Overlay */}
            <AbsoluteFill style={{
                background: getGradient(),
                opacity: overlayOpacity,
                mixBlendMode: 'multiply'
            }} />

            {/* Logo Section */}
            {logo && (
                <div style={getLogoStyle()}>
                    <Img src={logo} style={{ height: `${80 * s}px`, width: 'auto', filter: 'drop-shadow(0 5px 15px rgba(0,0,0,0.3))' }} />
                </div>
            )}

            {/* Content Container */}
            <AbsoluteFill style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: textAlignment === 'left' ? 'flex-start' : textAlignment === 'right' ? 'flex-end' : 'center',
                padding: `${padding}px`,
                textAlign: textAlignment,
                color: 'white',
                fontFamily: fontFamily
            }}>
                <div style={{
                    opacity: headlineOpacity,
                    transform: `scale(${springValue})`,
                    fontSize: `${90 * s}px`,
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    letterSpacing: `${-2 * s}px`,
                    textShadow: `0 ${15 * s}px ${30 * s}px rgba(0,0,0,0.5)`,
                    marginBottom: `${10 * s}px`,
                    lineHeight: 1
                }}>
                    {headline}
                </div>

                <div style={{
                    opacity: subtextOpacity,
                    transform: `translateY(${subtextY}px)`,
                    fontSize: `${40 * s}px`,
                    fontWeight: '300',
                    textShadow: `0 ${5 * s}px ${15 * s}px rgba(0,0,0,0.3)`,
                    maxWidth: '85%'
                }}>
                    {subtext}
                </div>

                {/* CTA Button */}
                {ctaText && (
                    <div style={{
                        marginTop: `${ctaMarginBottom * s}px`,
                        padding: `${20 * s}px ${60 * s}px`,
                        backgroundColor: brandColor,
                        borderRadius: '100px',
                        fontSize: `${32 * s}px`,
                        fontWeight: 'bold',
                        color: 'white',
                        boxShadow: `0 ${15 * s}px ${35 * s}px rgba(0,0,0,0.3)`,
                        opacity: interpolate(frame - ctaStartFrame, [0, 20], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }),
                        transform: `scale(${ctaSpring})`
                    }}>
                        {ctaText}
                    </div>
                )}
            </AbsoluteFill>

            {/* Progress Bar */}
            {showProgressBar && (
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    height: `${10 * s}px`,
                    backgroundColor: brandColor,
                    width: `${(frame / durationInFrames) * 100}%`
                }} />
            )}

            {/* Safe Zones */}
            {showSafeZones && (
                <AbsoluteFill style={{ border: `${4 * s}px dashed rgba(255,255,255,0.2)`, margin: `${100 * s}px`, pointerEvents: 'none' }} />
            )}
        </AbsoluteFill>
    );
};
