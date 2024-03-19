export function About() {
  return (`
    <div class="middle">
      <h2>About Paste.ts</h2>
      <section>
       <h3>What is Paste.ts?</h3>
       <p>Paste.ts is a Pastebin-like website designed for developers to share and collaborate on code snippets. It provides a secure and user-friendly platform for posting, retrieving, and managing text files, making it an invaluable tool for programmers and software developers.</p>
   </section>

   <section>
       <h3>Key Features</h3>
       <ul>
           <li><strong>User Authentication</strong>: Paste.ts offers a robust authentication system, allowing users to register and log in securely using their email and password. This ensures that your pastes are protected and only accessible to you.</li>
           <li><strong>Paste Management</strong>: With Paste.ts, you can easily post text files (or "pastes") and receive a unique UUID for each paste. You can retrieve your pastes using the UUID or list all your paste UUIDs for easy access.</li>
           <li><strong>Public Pastes</strong>: If desired, you can share your pastes publicly by creating a symlink in the "public" folder. This feature allows others to access your pastes without authentication, promoting collaboration and code sharing.</li>
           <li><strong>Burnable Pastes</strong>: Paste.ts offers a unique "burnable" paste feature. When enabled, your paste file will be automatically deleted after being viewed once, providing an extra layer of security and privacy.</li>
           <li><strong>Syntax Highlighting</strong>: To enhance readability and make your code snippets more visually appealing, Paste.ts automatically detects the programming language and provides syntax highlighting using the "speed_highlight_js" library.</li>
       </ul>
   </section>

   <section>
       <h3>Built for Developers</h3>
       <p>Paste.ts is built with developers in mind, offering a robust and feature-rich platform for sharing and collaborating on code. Whether you need to share a snippet with a colleague, collaborate on a project, or simply store code snippets for later reference, Paste.ts has you covered.</p>
      </section>
    </div>
  `);
}
