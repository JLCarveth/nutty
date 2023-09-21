export type Data = {
  version: string;
};

export function template(data: Data) {
  return `<html>
  <head>
    <title>Welcome to Paste</title>
    <link rel="stylesheet" href="css/styles.css"/>
  </head>
  <body>
    <h1>Welcome to Paste!</h1>
    <p>This is a very rudimentary index.html webpage. Nutty version <b>${data.version}</b></p>
  </body>
</html>`;
}
