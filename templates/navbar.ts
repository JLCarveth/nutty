import { LayoutData } from "./layout.ts"

export function Navbar(data: LayoutData) {
  return `
    <div class="navbar">
      <h1><a href="/">Paste.ts</a></h1>
      <div class="right-side">
        <div class="welcome" id="welcome">
          <a href="/login">Login</a>
          <a href="/register">Register</a>
        </div>
        <p class="version">${data.version}</p>
      </div>
    </div>
`
}
