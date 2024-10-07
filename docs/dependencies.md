# Codebase Dependencies

You may find it useful make changes to the codebase beyond the files that integrate directly with Privacy Sandbox APIs. You are welcome to do so! For
your convenience here are some notes about other technologies used in this codebase.

## What’s in this framework ?

This framework does use but does not provide guidance about the following web technologies. Knowledge of the following will enable a more focused
exploration of Privacy Sandbox APIs.

<dl>
  <dt>Express (Node.js web application framework)</dt>
  <dd>This lightweight server side technology is used to organize and serve each of the sites in the demos such as the shop or news site</dd>
  <dt>EJS (Embedded Javascript templating)</dt>
  <dd>This view templating engine enable enables easier maintenance of some of the repetitive content in the demo, such as the product pages in the shop site.</dd>
  <dt>Typescript</dt>
  <dd>Typescript is used in the implementation of each demo site's web application alongside Express. However, most direct integration with Privacy Sandbox APIs is done in JavaScript.</dd>
  <dt>CSS</dt>
  <dd>CSS is used extensively throughout the demo to enable a more streamlined user experience when testing the Privacy Sandbox integrations.</dd>
</dl>

Additionally, this codebase does not provide extensive information about Advertising Technology. You should be familiar with these before you start
exploring. We recommend the following resource to learn more https://clearcode.cc/blog/understanding-advertising-technology/
