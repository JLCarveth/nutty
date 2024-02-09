export function Index() {
  return `
    <form action="/api/paste" method="post">
      <textarea name="text" placeholder="Enter your message here" rows="20" required></textarea><br>
      <input type="checkbox" id="burn" name="burn" value="true">
      <label for="burn">Burn after reading</label><br>
      <input type="submit" value="Submit">
      <input type="reset" value="Reset">
    </form>
    <div id="recent-posts" class="recent-posts"></div>`;
}
