import { registerRoot, Composition } from 'remotion';
import { AdVideo } from './AdVideo';

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="AdVideo"
                component={AdVideo as any}
                durationInFrames={150}
                fps={30}
                width={1920}
                height={1080}
                defaultProps={{
                    headline: 'Your Ad Headline',
                    subtext: 'Call to action or description goes here',
                    brandColor: '#10b981',
                    bgImage: 'https://images.unsplash.com/photo-1557683316-973673baf926'
                }}
            />
        </>
    );
};

registerRoot(RemotionRoot);
