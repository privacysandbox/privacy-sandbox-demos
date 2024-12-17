// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer').themes.github;
const darkCodeTheme = require('prism-react-renderer').themes.dracula;

const host = process.env.HOME_HOST || 'UNDEFINED';
const measurementID = process.env.HOME_MEASUREMENT_ID || 'G-UNDEFINED'; // if user build site without defining env vars, assign a default value.

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Privacy Sandbox Demos',
  tagline: 'A use cases demos library for Privacy Sandbox APIs.',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: `https://${host}`,
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'privacysandbox/privacy-sandbox-demos', // Usually your GitHub org/user name.
  projectName: 'privacy-sandbox-demos', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {mermaid: true},
  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
        },
        blog: {
          showReadingTime: true,
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
        gtag: {
          trackingID: measurementID,
          anonymizeIP: true,
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/privacy-sandbox-demos.png',
      navbar: {
        title: 'Privacy Sandbox Demos',
        logo: {
          alt: 'Privacy Sandbox Demos Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'docsSidebar',
            position: 'left',
            label: 'Explore',
          },
          {
            href: 'https://github.com/privacysandbox/privacy-sandbox-demos',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Community',
            items: [
              {
                label: 'Privacy Sandbox',
                href: 'https://privacysandbox.com/',
              },
              {
                label: 'Privacy Sandbox Developers Documentation',
                href: 'https://developer.chrome.com/docs/privacy-sandbox/',
              },
              {
                label: 'Chromium Blog',
                href: 'https://blog.chromium.org/search/label/privacy%20sandbox',
              },
            ],
          },
          {
            title: 'Contribute',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/privacysandbox/privacy-sandbox-demos',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Google, Inc.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
