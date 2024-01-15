const BASE_URL = Deno.env.get("BASE_URL");

export function Register() {
  return `
<div class="middle">
  <h2>Register</h2>
  <form method="POST" action="${BASE_URL}/register">
    <label for="email">Email</label>
    <input type="email" name="email" placeholder="john_d@mail.com" class="form-control"/>
    <label for="password">Password</label>
    <input type="password" name="password" placeholder="hunter2" class="form-control"/>
    <input type="submit" value="Register">
  </form>
</div>
`;
}
