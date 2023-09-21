export type Data = {
  version: string;
};

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
    <form action="/api/paste" method="post">
        <textarea name="text" placeholder="Enter your message here" required></textarea><br>
        <input type="submit" value="Submit">
        <input type="reset" value="Reset">
      </form>
    </main>
  </body>
</html>`;
}
