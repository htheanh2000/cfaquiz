export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const ts = new Date().toISOString();
    // eslint-disable-next-line no-console
    console.log(`[${ts}] CFA Quiz server starting (Node.js runtime)`);
  }
}
