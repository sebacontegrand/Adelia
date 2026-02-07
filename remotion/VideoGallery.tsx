import { AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { AdVideo, AdVideoProps } from './AdVideo';

export interface VideoGalleryProps {
    videos: AdVideoProps[];
}

export const VideoGallery: React.FC<VideoGalleryProps> = ({ videos }) => {
    const frame = useCurrentFrame();

    // Each video duration (standardized for now)
    const VIDEO_DURATION = 150;
    const TRANSITION_DURATION = 15; // frames for swipe effect

    return (
        <AbsoluteFill style={{ backgroundColor: 'black', overflow: 'hidden' }}>
            {videos.map((videoProps, index) => {
                const startFrame = index * VIDEO_DURATION;
                const endFrame = startFrame + VIDEO_DURATION;

                // Transition logic: swipe up
                const translateY = interpolate(
                    frame,
                    [startFrame - TRANSITION_DURATION, startFrame, endFrame - TRANSITION_DURATION, endFrame],
                    [100, 0, 0, -100],
                    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                );

                // We use Sequence to reset the internal 'currentFrame' of AdVideo to 0 at startFrame
                return (
                    <Sequence
                        key={index}
                        from={startFrame - TRANSITION_DURATION}
                        durationInFrames={VIDEO_DURATION + TRANSITION_DURATION}
                    >
                        <AbsoluteFill
                            style={{
                                transform: `translateY(${translateY}%)`,
                                zIndex: videos.length - index
                            }}
                        >
                            <AdVideo {...videoProps} />
                        </AbsoluteFill>
                    </Sequence>
                );
            })}
        </AbsoluteFill>
    );
};
