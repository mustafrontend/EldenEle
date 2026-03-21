export async function GET(request, { params }) {
    const { id } = await params;
    if (!id) return new Response('Not Found', { status: 404 });

    try {
        const { getListingServer } = await import('@/lib/firebaseServer');
        const listing = await getListingServer(id);

        if (!listing || !listing.photos || listing.photos.length === 0) {
            // Return a default image or 404
            return new Response('Not Found', { status: 404 });
        }

        const photo = listing.photos[0];

        if (photo.startsWith('data:image')) {
            // It's a base64 string
            const matches = photo.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {
                return new Response('Invalid Image Data', { status: 400 });
            }

            const type = matches[1];
            const buffer = Buffer.from(matches[2], 'base64');

            return new Response(buffer, {
                headers: {
                    'Content-Type': `image/${type}`,
                    'Cache-Control': 'public, max-age=86400',
                },
            });
        } else if (photo.startsWith('http')) {
            // Redirect to real URL
            return Response.redirect(photo, 302);
        }

        return new Response('Not Found', { status: 404 });
    } catch (e) {
        console.error('OG Image generation error:', e);
        return new Response('Server Error', { status: 500 });
    }
}
