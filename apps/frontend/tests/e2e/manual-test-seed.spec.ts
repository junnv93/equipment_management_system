import { test } from '@playwright/test';

test('setup page for manual testing', async ({ page }) => {
  const baseURL = 'http://localhost:3000';

  // 1. Get CSRF token
  const csrfResponse = await page.request.get(`${baseURL}/api/auth/csrf`);
  const { csrfToken } = await csrfResponse.json();

  // 2. Login via NextAuth test-login provider
  const loginResponse = await page.request.post(
    `${baseURL}/api/auth/callback/test-login?callbackUrl=/`,
    {
      form: {
        role: 'technical_manager',
        csrfToken: csrfToken,
        json: 'true',
      },
    }
  );

  // 3. Transfer cookies to browser context
  const setCookieHeaders = loginResponse.headers()['set-cookie'];
  if (setCookieHeaders) {
    const cookies = setCookieHeaders.split('\n').map((cookieStr: string) => {
      const parts = cookieStr.split(';');
      const [name, ...valueParts] = parts[0].split('=');
      const value = valueParts.join('=');
      const attributes: Record<string, string> = {};
      for (let i = 1; i < parts.length; i++) {
        const attr = parts[i].trim();
        if (attr.includes('=')) {
          const [key, val] = attr.split('=');
          attributes[key.toLowerCase()] = val;
        }
      }
      const rawSameSite = (attributes['samesite'] || 'Lax').toLowerCase();
      const sameSiteMap: Record<string, 'Strict' | 'Lax' | 'None'> = {
        strict: 'Strict',
        lax: 'Lax',
        none: 'None',
      };
      return {
        name: name.trim(),
        value,
        domain: 'localhost',
        path: attributes['path'] || '/',
        httpOnly: parts.some((p) => p.trim().toLowerCase() === 'httponly'),
        sameSite: sameSiteMap[rawSameSite] || 'Lax',
        expires: attributes['expires']
          ? new Date(attributes['expires']).getTime() / 1000
          : undefined,
      };
    });
    await page.context().addCookies(cookies);
  }

  // 4. Navigate to the main page
  await page.goto(`${baseURL}/`);
});
