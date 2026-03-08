import { getPost } from '../../../lib/communityService';
import CommunityDetailClient from './CommunityDetailClient';

export async function generateMetadata({ params }) {
    const { id } = await params;
    const post = await getPost(id);

    if (!post) {
        return {
            title: 'Gönderi Bulunamadı',
            description: 'Aradığınız gönderi bulunamadı.',
            robots: { index: false, follow: true },
        };
    }

    // A simple title based on content
    const titleText = post.content.length > 50 ? post.content.substring(0, 50) + '...' : post.content;

    return {
        title: `${post.userName} Sordu: ${titleText}`,
        description: post.content,
        openGraph: {
            type: 'article',
            locale: 'tr_TR',
            title: `${post.userName} Sordu: ${titleText}`,
            description: post.content,
            siteName: 'EldenEle.app Topluluk',
        }
    };
}

export default async function CommunityDetailPage({ params }) {
    const { id } = await params;
    const post = await getPost(id);

    return <CommunityDetailClient postId={id} serverPost={post} />;
}
