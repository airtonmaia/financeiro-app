/** @type {import('next').NextConfig} */
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: true,
      },
    ]
  },
  webpack: (config, { isServer }) => {
    // Adiciona o plugin apenas para o cliente
    if (!isServer) {
      config.plugins.push(
        new MiniCssExtractPlugin({
          filename: 'static/css/[name].[contenthash].css',
          chunkFilename: 'static/css/[id].[contenthash].css',
        })
      );
    }

    // Adiciona regra para arquivos CSS
    config.module.rules.push({
      test: /\.css$/,
      use: [
        isServer ? 'null-loader' : MiniCssExtractPlugin.loader,
        'css-loader',
        'postcss-loader',
      ],
    });

    return config;
  },
};

module.exports = nextConfig;
