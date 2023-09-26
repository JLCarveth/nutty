import { Data } from "./index.ts";

export function Navbar(data: Data) {
  return `
    <div class="navbar">
      <h1><a href="#">Paste.ts</a></h1>
      <p class="version">${data.version}</p>
    </div>
`
}
