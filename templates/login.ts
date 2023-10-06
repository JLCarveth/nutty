const BASE_URL = Deno.env.get("BASE_URL");
export function Login() {
  return (`
    <div class="login-form">
    <form method="POST" action="${BASE_URL}/login">
      <label for="email" class="form-label">Email</label>
      <input type="email" name="email" placeholder="janedoe@mail.com" class="form-control"/>
      <label for="password" class="form-label">Password</label>
      <input type="password" name="password" class="form-control" placeholder="password"/>
      <input type="submit" value="Login"/>
      <input type="reset" value="Reset"/>
    </form>
    </div>
  `);
}
