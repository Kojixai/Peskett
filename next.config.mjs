

const nextConfig = {
  basePath: '/peskett',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.vinted.com' },
      { protocol: 'https', hostname: '**.ebayimg.com' },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['@anthropic-ai/sdk'],
  },
  output: 'standalone',
}

export default nextConfig
