const axios = require('axios');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/db');
const logger = require('../config/logger');

const providerFields = { google: 'googleId', github: 'githubId', apple: 'appleId' };
const frontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

const callbackUrl = (provider) => {
  const explicit = process.env[`${provider.toUpperCase()}_REDIRECT_URI`];
  if (explicit) return explicit;
  const apiUrl = (process.env.API_PUBLIC_URL || process.env.BACKEND_PUBLIC_URL || process.env.API_URL || 'http://localhost:5000').replace(/\/$/, '');
  return `${apiUrl}/api/auth/oauth/${provider}/callback`;
};

const applePrivateKey = () => (process.env.APPLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const applePrivateKeyIsValid = () => {
  try {
    const key = crypto.createPrivateKey(applePrivateKey());
    return key.asymmetricKeyType === 'ec' && key.asymmetricKeyDetails?.namedCurve === 'prime256v1';
  } catch {
    return false;
  }
};
const callbackConfigured = (provider) => {
  const explicit = process.env[`${provider.toUpperCase()}_REDIRECT_URI`];
  const publicApiUrl = process.env.API_PUBLIC_URL || process.env.BACKEND_PUBLIC_URL || process.env.API_URL;
  if (!explicit && process.env.NODE_ENV === 'production' && !publicApiUrl) return false;
  try {
    const protocol = new URL(callbackUrl(provider)).protocol;
    return process.env.NODE_ENV !== 'production' || protocol === 'https:';
  } catch {
    return false;
  }
};

const providerConfigured = (provider) => {
  const callbackReady = callbackConfigured(provider);
  if (provider === 'google') return Boolean(callbackReady && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  if (provider === 'github') return Boolean(callbackReady && process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
  return Boolean(callbackReady && process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && applePrivateKeyIsValid());
};

exports.getProviders = (_req, res) => {
  const providers = Object.fromEntries(Object.keys(providerFields).map(provider => [provider, {
    available: providerConfigured(provider),
    callbackUrl: callbackUrl(provider),
  }]));
  return res.json({ success: true, providers });
};

exports.start = (req, res) => {
  const provider = String(req.params.provider || '').toLowerCase();
  if (!providerFields[provider]) return res.status(404).json({ success: false, message: 'Sign-in provider not found.' });
  if (!providerConfigured(provider)) return res.status(503).json({ success: false, message: 'This sign-in provider is not configured yet.' });
  if (!process.env.JWT_SECRET) return res.status(503).json({ success: false, message: 'Sign-in is not configured yet.' });

  const nonce = crypto.randomBytes(24).toString('base64url');
  const browserNonce = String(req.query.browser_nonce || '');
  if (!/^[A-Za-z0-9_-]{40,48}$/.test(browserNonce)) return res.status(400).json({ success: false, message: 'Restart sign-in and try again.' });
  const flow = req.query.flow === 'register' ? 'register' : 'login';
  const state = jwt.sign({ purpose: 'oauth-state', provider, flow, nonce, browserNonce }, process.env.JWT_SECRET, { expiresIn: '10m' });
  const redirect = callbackUrl(provider);
  let authorizationUrl;

  if (provider === 'google') {
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.search = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: redirect,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      nonce,
      prompt: 'select_account',
    }).toString();
    authorizationUrl = url.toString();
  } else if (provider === 'github') {
    const url = new URL('https://github.com/login/oauth/authorize');
    url.search = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID,
      redirect_uri: redirect,
      scope: 'read:user user:email',
      state,
    }).toString();
    authorizationUrl = url.toString();
  } else {
    const url = new URL('https://appleid.apple.com/auth/authorize');
    url.search = new URLSearchParams({
      client_id: process.env.APPLE_CLIENT_ID,
      redirect_uri: redirect,
      response_type: 'code id_token',
      response_mode: 'form_post',
      scope: 'name email',
      state,
      nonce,
    }).toString();
    authorizationUrl = url.toString();
  }

  return res.redirect(302, authorizationUrl);
};

const postForm = async (url, values, headers = {}) => {
  const response = await axios.post(url, new URLSearchParams(values).toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...headers },
    timeout: 15000,
  });
  return response.data;
};

const verifyGoogleIdentityToken = async (token, expectedNonce) => {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid Google identity token');
  const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
  const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  if (header.alg !== 'RS256' || !header.kid) throw new Error('Unsupported Google identity token');
  const keys = await axios.get('https://www.googleapis.com/oauth2/v3/certs', { timeout: 15000 });
  const jwk = keys.data?.keys?.find(key => key.kid === header.kid && key.kty === 'RSA');
  if (!jwk) throw new Error('Google signing key not found');
  const publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  const signatureIsValid = crypto.verify(
    'RSA-SHA256',
    Buffer.from(`${parts[0]}.${parts[1]}`),
    publicKey,
    Buffer.from(parts[2], 'base64url'),
  );
  const now = Math.floor(Date.now() / 1000);
  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  const authorizedPartyIsValid = audience.length <= 1 || claims.azp === process.env.GOOGLE_CLIENT_ID;
  const emailIsVerified = claims.email_verified === true || claims.email_verified === 'true';
  if (!signatureIsValid || !['accounts.google.com', 'https://accounts.google.com'].includes(claims.iss) || !audience.includes(process.env.GOOGLE_CLIENT_ID) || !authorizedPartyIsValid || claims.exp <= now || claims.nonce !== expectedNonce || !emailIsVerified) {
    throw new Error('Google identity token validation failed');
  }
  return claims;
};

const verifyAppleIdentityToken = async (token, expectedNonce) => {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid Apple identity token');
  const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
  const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  if (header.alg !== 'RS256' || !header.kid) throw new Error('Unsupported Apple identity token');

  const keys = await axios.get('https://appleid.apple.com/auth/keys', { timeout: 15000 });
  const jwk = keys.data?.keys?.find(key => key.kid === header.kid && key.kty === 'RSA');
  if (!jwk) throw new Error('Apple signing key not found');
  const publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  const signatureIsValid = crypto.verify(
    'RSA-SHA256',
    Buffer.from(`${parts[0]}.${parts[1]}`),
    publicKey,
    Buffer.from(parts[2], 'base64url'),
  );
  const now = Math.floor(Date.now() / 1000);
  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!signatureIsValid || claims.iss !== 'https://appleid.apple.com' || !audience.includes(process.env.APPLE_CLIENT_ID) || claims.exp <= now || claims.nonce !== expectedNonce) {
    throw new Error('Apple identity token validation failed');
  }
  return claims;
};

const appleClientSecret = () => {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign({
    iss: process.env.APPLE_TEAM_ID,
    iat: now,
    exp: now + 5 * 60,
    aud: 'https://appleid.apple.com',
    sub: process.env.APPLE_CLIENT_ID,
  }, crypto.createPrivateKey(applePrivateKey()), {
    algorithm: 'ES256',
    keyid: process.env.APPLE_KEY_ID,
  });
};

const getIdentity = async (provider, code, stateClaims, appleUserData) => {
  const redirectUri = callbackUrl(provider);
  if (provider === 'google') {
    const tokens = await postForm('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });
    const claims = await verifyGoogleIdentityToken(tokens.id_token || '', stateClaims.nonce);
    const response = await axios.get('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      timeout: 15000,
    });
    const profile = response.data;
    const profileEmailIsVerified = profile.email_verified === true || profile.email_verified === 'true';
    if (!profile.sub || profile.sub !== claims.sub || !profile.email || profile.email.toLowerCase() !== String(claims.email).toLowerCase() || !profileEmailIsVerified) {
      throw new Error('Google did not return a verified identity');
    }
    return { id: String(profile.sub), email: profile.email, name: profile.name || '', verified: true };
  }

  if (provider === 'github') {
    const tokens = await postForm('https://github.com/login/oauth/access_token', {
      code,
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      redirect_uri: redirectUri,
    }, { Accept: 'application/json' });
    if (!tokens.access_token) throw new Error('GitHub did not return an access token');
    const headers = { Authorization: `Bearer ${tokens.access_token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'Sitemendr' };
    const [profileResponse, emailsResponse] = await Promise.all([
      axios.get('https://api.github.com/user', { headers, timeout: 15000 }),
      axios.get('https://api.github.com/user/emails?per_page=100', { headers, timeout: 15000 }),
    ]);
    const email = emailsResponse.data?.find(item => item.primary && item.verified)?.email;
    if (!profileResponse.data?.id || !email) throw new Error('GitHub did not return a verified email');
    return { id: String(profileResponse.data.id), email, name: profileResponse.data.name || profileResponse.data.login || '', verified: true };
  }

  const clientSecret = appleClientSecret();
  const tokens = await postForm('https://appleid.apple.com/auth/token', {
    code,
    client_id: process.env.APPLE_CLIENT_ID,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });
  const claims = await verifyAppleIdentityToken(tokens.id_token || '', stateClaims.nonce);
  const postedUser = appleUserData ? JSON.parse(appleUserData) : {};
  const name = [postedUser?.name?.firstName, postedUser?.name?.lastName].filter(Boolean).join(' ');
  const verified = claims.email_verified === true || claims.email_verified === 'true';
  if (!claims.sub || !claims.email || !verified) throw new Error('Apple did not return a verified identity');
  return { id: String(claims.sub), email: claims.email, name, verified: true };
};

const findOrCreateUser = async (provider, identity) => {
  const field = providerFields[provider];
  const linkedRows = await prisma.$queryRawUnsafe(`SELECT * FROM "User" WHERE "${field}" = $1 LIMIT 1`, identity.id);
  const linked = linkedRows[0];
  if (linked) return { user: linked, isNew: false };

  const email = identity.email.trim().toLowerCase();
  const emailRows = await prisma.$queryRawUnsafe('SELECT * FROM "User" WHERE "email" = $1 LIMIT 1', email);
  let user = emailRows[0];
  if (user) {
    if (user.role !== 'user' || user.banned) throw new Error('account_unavailable');
    if (user[field] && user[field] !== identity.id) throw new Error('This email is already connected to another account for this provider');
    await prisma.$executeRawUnsafe(
      `UPDATE "User" SET "${field}" = $1, "isEmailVerified" = true, "emailVerificationToken" = NULL, "emailVerificationExpires" = NULL, "name" = CASE WHEN "name" = '' THEN $2 ELSE "name" END WHERE "id" = $3`,
      identity.id,
      identity.name.slice(0, 120),
      user.id,
    );
    const updatedRows = await prisma.$queryRawUnsafe('SELECT * FROM "User" WHERE "id" = $1 LIMIT 1', user.id);
    return { user: updatedRows[0], isNew: false };
  }

  const randomPassword = crypto.randomBytes(48).toString('base64url');
  const password = await bcrypt.hash(randomPassword, 12);
  user = await prisma.user.create({
    data: {
      name: (identity.name || email.split('@')[0] || 'Sitemendr client').trim().slice(0, 120),
      email,
      password,
      role: 'user',
      isEmailVerified: true,
    },
  });
  await prisma.$executeRawUnsafe(`UPDATE "User" SET "${field}" = $1 WHERE "id" = $2`, identity.id, user.id);
  const createdRows = await prisma.$queryRawUnsafe('SELECT * FROM "User" WHERE "id" = $1 LIMIT 1', user.id);
  user = createdRows[0] || user;
  return { user, isNew: true };
};

exports.callback = async (req, res) => {
  const provider = String(req.params.provider || '').toLowerCase();
  let flow = 'login';
  try {
    if (!providerFields[provider] || !providerConfigured(provider)) throw new Error('provider_unavailable');
    const state = req.body?.state || req.query?.state;
    const stateClaims = jwt.verify(state, process.env.JWT_SECRET);
    if (stateClaims.purpose !== 'oauth-state' || stateClaims.provider !== provider) throw new Error('invalid_state');
    flow = stateClaims.flow === 'register' ? 'register' : 'login';
    if (req.body?.error || req.query?.error) throw new Error('provider_cancelled');
    const code = req.body?.code || req.query?.code;
    if (!code) throw new Error('missing_code');

    const identity = await getIdentity(provider, code, stateClaims, req.body?.user);
    if (!identity.verified) throw new Error('unverified_email');
    const { user, isNew } = await findOrCreateUser(provider, identity);
    if (user.banned || user.role !== 'user') throw new Error('account_unavailable');
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    const callback = new URL('/oauth/callback', frontendUrl());
    const fragment = new URLSearchParams({ token, flow, browser_nonce: stateClaims.browserNonce, ...(isNew ? { new_user: '1' } : {}) });
    callback.hash = fragment.toString();
    return res.redirect(303, callback.toString());
  } catch (error) {
    logger.warn('OAUTH_CALLBACK_FAILED', { provider, reason: error.message });
    const errorCode = ['provider_unavailable', 'provider_cancelled', 'account_unavailable'].includes(error.message)
      ? error.message
      : 'sign_in_failed';
    return res.redirect(303, `${frontendUrl()}/login?oauthError=${encodeURIComponent(errorCode)}`);
  }
};
