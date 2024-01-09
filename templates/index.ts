export function Index() {
  return `
    <form action="/api/paste" method="post">
      <textarea name="text" placeholder="Enter your message here" rows="20" required></textarea><br>
      <input type="submit" value="Submit">
      <input type="reset" value="Reset">
    </form>
    <div id="recent-posts" class="recent-posts"></div>`;
}
