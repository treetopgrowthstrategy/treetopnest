export const prerender = false;
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const ghToken = import.meta.env.GITHUB_TOKEN;
  if (!ghToken) return new Response(JSON.stringify({ error: 'no token' }), { status: 200 });

  // Test 1: verify token (who am I?)
  const whoami = await fetch('https://api.github.com/user', {
    headers: { 'Authorization': `Bearer ${ghToken}`, 'Accept': 'application/vnd.github.v3+json' }
  });
  const user = await whoami.json();

  // Test 2: can I read the repo?
  const repoCheck = await fetch('https://api.github.com/repos/treetopgrowthstrategy/treetopnest', {
    headers: { 'Authorization': `Bearer ${ghToken}`, 'Accept': 'application/vnd.github.v3+json' }
  });
  const repo = await repoCheck.json();

  // Test 3: can I write a test file?
  const testContent = btoa('test content');
  const writeTest = await fetch('https://api.github.com/repos/treetopgrowthstrategy/treetopnest/contents/public/reports/_test.txt', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${ghToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json'
    },
    body: JSON.stringify({ message: 'test write', content: testContent, branch: 'main' })
  });
  const writeResult = await writeTest.json();

  return new Response(JSON.stringify({
    tokenLength: ghToken.length,
    tokenPrefix: ghToken.slice(0, 6),
    userLogin: user.login || user.message,
    repoPermissions: repo.permissions || repo.message,
    writeStatus: writeTest.status,
    writeError: writeResult.message || 'ok',
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
