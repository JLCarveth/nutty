import { Navbar } from "./navbar.ts";

export type LayoutData = {
  title: string;
  content: string;
  version: string;
};

export function Layout(data: LayoutData) {
  return `
<html>
  <head>
    <title>${data.title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="css/styles.css"/>
  </head>
  <body>
    ${Navbar({ version: data.version })}
    <main>
      ${data.content}
    </main>
  </body>
</html>`;
}
