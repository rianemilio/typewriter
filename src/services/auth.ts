// Demo credentials, shown on the card on the desk.
// Replace the body of login() with a real API call; the UI only depends on its signature.
const DEMO_USER = { username: 'typist', password: 'carbon' };

export async function login(username: string, password: string): Promise<boolean> {
  return username.trim().toLowerCase() === DEMO_USER.username && password === DEMO_USER.password;
}
