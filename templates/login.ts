import { Data } from "./index.ts";

export function template(data: Data) {
  return `<html>
  <head>
    <title>Paste</title>
    <link rel="stylesheet" href="css/styles.css"/>
  </head>
  <body>
    <div class="navbar">
      <a href="#">Paste.ts</a>
      <p class="version">${data.version}</p>
    </div>
    <main>
      <h1>Login Coming Soon</h1>
    </main>
  </body>
</html>`;
}
