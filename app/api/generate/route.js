import { ImageResponse } from '@vercel/og';
export const config = {
  runtime: 'edge',
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const namn1 = searchParams.get('namn1') || '';
    const namn2 = searchParams.get('namn2') || '';

    // Kolla att båda namn finns
    if (!namn1 || !namn2) {
      return new Response('Missing namn1 or namn2', { status: 400 });
    }

    // Här kan du lägga till din genereringslogik – just nu returnerar vi bara texten som test
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 48,
            background: 'white',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <div>{namn1}</div>
          <div>{namn2}</div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.error(e);
    return new Response('Something went wrong', { status: 500 });
  }
}
