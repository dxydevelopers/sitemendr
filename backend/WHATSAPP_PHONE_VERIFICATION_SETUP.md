# WhatsApp phone verification setup

Sitemendr uses an inbound-only WhatsApp verification flow. It does not send OTP messages through Twilio or Meta. The client starts a challenge in My Account, then sends the prefilled message `Hi Sitemendr, I'm verifying my phone number. Code: 123 XXX 456` to Sitemendr. The three digits on each side of `XXX` are the same six-digit verification code, grouped for readability. Meta forwards the incoming message to the backend webhook, which validates the sender number and one-time code.

## Backend environment

Set these values on the hosted backend:

```env
WHATSAPP_BUSINESS_NUMBER=2547XXXXXXXX
META_WHATSAPP_PHONE_NUMBER_ID=
META_APP_SECRET=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=
```

- `WHATSAPP_BUSINESS_NUMBER`: Sitemendr's WhatsApp Business number, digits only with country code.
- `META_WHATSAPP_PHONE_NUMBER_ID`: Phone Number ID shown for Sitemendr's number in Meta's WhatsApp setup.
- `META_APP_SECRET`: App Secret from the Meta developer app connected to the WhatsApp Business Account. Keep it private.
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`: A long random string created by Sitemendr. Enter the same value when configuring Meta's webhook.

`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_VERIFY_SERVICE_SID` remain for SMS only.

## Meta webhook

Configure the Meta app's WhatsApp webhook with:

- Callback URL: `https://<hosted-backend>/api/auth/whatsapp/webhook`
- Verify token: the value of `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- Webhook field subscription: `messages`

Connect the WhatsApp Business Account and phone number to that app, then subscribe the account to the app's webhook. The hosted backend must be publicly reachable over HTTPS. No separate webhook host is needed; this endpoint runs in the existing backend.

The webhook validates Meta's `X-Hub-Signature-256` against the raw request body before processing events. It only accepts messages addressed to the configured Phone Number ID. A matching, unexpired challenge is consumed once; the sender's WhatsApp number must match the number on the pending account change.

## Client experience

On a phone, the client opens the prefilled Sitemendr WhatsApp chat and taps **Send**. On a wider screen, My Account also shows a QR code for that chat and a button to open WhatsApp Web. The client must send from the WhatsApp account belonging to the number being verified. My Account polls the backend and updates when the webhook confirms the number.

WhatsApp verification is reported as available only when all four environment values above are configured. Until the Meta app and webhook are connected, the client UI keeps it unavailable.
