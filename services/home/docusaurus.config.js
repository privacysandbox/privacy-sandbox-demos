// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github")
const darkCodeTheme = require("prism-react-renderer/themes/dracula")

const host = process.env.HOME_HOST

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Privacy Sandbox Demos",
  tagline: "A use cases demos library for Privacy Sandbox APIs.",
  favicon: "img/favicon.ico",

  // Set the production url of your site here
  url: `https://${host}`,
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "privacysandbox/privacy-sandbox-demos", // Usually your GitHub org/user name.
  projectName: "privacy-sandbox-demos", // Usually your repo name.

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"]
  },

  markdown: { mermaid: true },
  themes: ["@docusaurus/theme-mermaid"],

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/"
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/"
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css")
        }
      })
    ]
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: "img/privacy-sandbox-demos.png",
      navbar: {
        title: "Privacy Sandbox Demos",
        logo: {
          alt: "Privacy Sandbox Demos Logo",
          src: "img/logo.svg"
        },
        items: [
          {
            type: "docSidebar",
            sidebarId: "docsSidebar",
            position: "left",
            label: "Explore"
          },
          {
            href: "https://github.com/privacysandbox/privacy-sandbox-demos",
            label: "GitHub",
            position: "right"
          }
        ]
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "Community",
            items: [
              {
                label: "Privacy Sandbox",
                href: "https://privacysandbox.com/"
              },
              {
                label: "Privacy Sandbox Developers Documentation",
                href: "https://developer.chrome.com/docs/privacy-sandbox/"
              },
              {
                label: "Chromium Blog",
                href: "https://blog.chromium.org/search/label/privacy%20sandbox"
              }
            ]
          },
          {
            title: "Contribute",
            items: [
              {
                label: "GitHub",
                href: "https://github.com/privacysandbox/privacy-sandbox-demos"
              }
            ]
          }
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Google, Inc.`
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme
      },
      algolia: {
        // The application ID provided by Algolia
        appId: "30C2Z24495",

        // Public API key: it is safe to commit it
        apiKey: "fab13a7b22e907ce81ed9ef0904f4122",

        indexName: "privacy-sandbox-demos",

        // Optional: see doc section below
        contextualSearch: true,

        // Optional: Specify domains where the navigation should occur through window.location instead on history.push. Useful when our Algolia config crawls multiple documentation sites and we want to navigate with window.location.href to them.
        // @ts-ignore for using replaceAll
        externalUrlRegex: host?.replaceAll(".", "\\."),

        // Optional: Replace parts of the item URLs from Algolia. Useful when using the same search index for multiple deployments using a different baseUrl. You can use regexp or string in the `from` param. For example: localhost:3000 vs myCompany.com/docs
        replaceSearchResultPathname: {
          from: "/docs/", // or as RegExp: /\/docs\//
          to: "/"
        },

        // Optional: Algolia search parameters
        searchParameters: {},

        // Optional: path for search page that enabled by default (`false` to disable it)
        searchPagePath: "search"

        //... other Algolia params
      }
    })
}

module.exports = config
