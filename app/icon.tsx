import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 512,
  height: 512,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0ea5e9',
          borderRadius: '128px',
          fontSize: '256px',
        }}
      >
        🐷
      </div>
    ),
    {
      ...size,
    }
  );
}
