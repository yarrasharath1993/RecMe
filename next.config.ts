import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'http',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'commons.wikimedia.org',
      },
      {
        protocol: 'http',
        hostname: 'commons.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
      },
      {
        protocol: 'https',
        hostname: 'www.themoviedb.org',
      },
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'archive.org',
      },
      {
        protocol: 'http',
        hostname: 'archive.org',
      },
      {
        protocol: 'https',
        hostname: 'ia800100.us.archive.org',
      },
      {
        protocol: 'https',
        hostname: 'ia601400.us.archive.org',
      },
      {
        protocol: 'https',
        hostname: '**.archive.org',
      },
      {
        protocol: 'https',
        hostname: 's.ltrbxd.com',
      },
      {
        protocol: 'https',
        hostname: 'a.ltrbxd.com',
      },
      {
        protocol: 'https',
        hostname: '*.letterboxd.com',
      },
      {
        protocol: 'https',
        hostname: 'erosnow.com',
      },
      {
        protocol: 'https',
        hostname: '*.erosnow.com',
      },
      {
        protocol: 'https',
        hostname: 'images.filmibeat.com',
      },
      {
        protocol: 'https',
        hostname: '*.filmibeat.com',
      },
      {
        protocol: 'https',
        hostname: 'images.moviebuff.com',
      },
      {
        protocol: 'https',
        hostname: '*.moviebuff.com',
      },
      {
        protocol: 'https',
        hostname: 'blogger.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lookaside.fbsbx.com',
      },
      {
        protocol: 'https',
        hostname: 'meragana.com',
      },
      {
        protocol: 'https',
        hostname: 'is1-ssl.mzstatic.com',
      },
      {
        protocol: 'https',
        hostname: '*.mzstatic.com',
      },
    ],
  },
};

export default nextConfig;
