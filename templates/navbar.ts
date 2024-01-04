import { LayoutData } from "./layout.ts"

export function Navbar(data: LayoutData) {
  return `
    <div class="navbar">
      <h1><a href="/">Paste.ts</a></h1>
      <div class="right-side">
        <p class="welcome" id="welcome"><a href="/login">Login</a></p>
        <p class="version">${data.version}</p>
      </div>
    </div>
`
}
