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
    const { fps, durationInFrames } = useVideoConfig();

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

    const subtextY = interpolate(subtextSpring, [0, 1], [20, 0]);
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
            padding: '40px',
            display: 'flex',
            zIndex: 10,
            opacity: headlineOpacity,
            transform: `scale(${interpolate(frame, [0, 20], [0.8, 1])})`,
        };
        switch (logoPosition) {
            case 'top-left': return { ...base, top: 0, left: 0, justifyContent: 'flex-start' };
            case 'top-right': return { ...base, top: 0, right: 0, justifyContent: 'flex-end' };
            case 'bottom-right': return { ...base, bottom: 0, right: 0, justifyContent: 'flex-end', paddingBottom: '60px' };
            case 'center':
            default: return { ...base, top: '60px', width: '100%', justifyContent: 'center' };
        }
    };

    return (
        <AbsoluteFill style={{ backgroundColor: 'black' }}>
            {/* Background Image */}
            <AbsoluteFill style={{ transform: `scale(${bgScale})`, filter: `blur(${bgBlur}px) ${bgGrayscale ? 'grayscale(100%)' : ''}` }}>
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
                    <Img src={logo} style={{ height: '80px', width: 'auto', filter: 'drop-shadow(0 5px 15px rgba(0,0,0,0.3))' }} />
                </div>
            )}

            {/* Content Container */}
            <AbsoluteFill style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: textAlignment === 'left' ? 'flex-start' : textAlignment === 'right' ? 'flex-end' : 'center',
                padding: '100px',
                textAlign: textAlignment,
                color: 'white',
                fontFamily: fontFamily
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
                        marginTop: `${ctaMarginBottom}px`,
                        padding: '20px 60px',
                        backgroundColor: brandColor,
                        borderRadius: '100px',
                        fontSize: '32px',
                        fontWeight: 'bold',
                        color: 'white',
                        boxShadow: '0 15px 35px rgba(0,0,0,0.3)',
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
                    height: '10px',
                    backgroundColor: brandColor,
                    width: `${(frame / durationInFrames) * 100}%`
                }} />
            )}

            {/* Safe Zones */}
            {showSafeZones && (
                <AbsoluteFill style={{ border: '4px dashed rgba(255,255,255,0.2)', margin: '100px', pointerEvents: 'none' }} />
            )}
        </AbsoluteFill>
    );
};
