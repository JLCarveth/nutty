import { Navbar } from "./navbar.ts";
import { Footer } from "./footer.ts";

export type LayoutData = {
  title?: string;
  content?: string;
  version?: string;
  scripts?: string[];
  stylesheets?: string[];
};

export function Layout(data: LayoutData) {
  return `
<!DOCTYPE html>
<html>
  <head>
    <title>${data.title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta charset="utf-8">
    <link rel="stylesheet" href="/css/styles.css"/>
    ${data.stylesheets?.join("\n") ?? ""}
  </head>
  <body>
    ${Navbar({ version: data.version })}
    <main>
      ${data.content}
    </main>
    ${Footer()}
    ${data.scripts?.join("\n") ?? ""}
  </body>
</html>`;
}
