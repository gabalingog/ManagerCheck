import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const TO_EMAIL = 'hello@managercheck.org'
const FROM_EMAIL = 'hello@managercheck.org'
const FROM_NAME = 'ManagerCheck'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const {
      suggestion,
      reviewId,
      reviewType,
      contextName,
      subContextName,
      reviewSnippet,
    } = await req.json()

    if (!suggestion?.trim()) {
      return new Response(JSON.stringify({ error: 'No suggestion provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const pageType = reviewType === 'manager' ? 'Manager' : 'Restaurant'
    const subject = reviewId
      ? `[ManagerCheck] Suggestion on a ${pageType} Review — ${contextName}`
      : `[ManagerCheck] Suggested Edit — ${pageType}: ${contextName}`

    const reviewBlock = reviewId && reviewSnippet
      ? `
        <tr>
          <td style="padding: 16px 0 4px; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #a89d8e; font-family: sans-serif;">
            Review flagged
          </td>
        </tr>
        <tr>
          <td style="background: #ede6d8; border-left: 3px solid #2a7a4b; border-radius: 4px; padding: 12px 16px; font-size: 14px; color: #7a6e5f; font-style: italic; font-family: sans-serif; line-height: 1.6;">
            "${reviewSnippet}${reviewSnippet.length >= 80 ? '…' : ''}"
          </td>
        </tr>
      `
      : ''

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;background:#f5f0e8;font-family:sans-serif;font-weight:300;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#faf8f4;border:1px solid rgba(60,45,20,0.16);border-radius:8px;overflow:hidden;">

                <tr>
                  <td style="background:#2a7a4b;padding:28px 40px;">
                    <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">
                      ManagerCheck
                    </span>
                  </td>
                </tr>

                <tr>
                  <td style="padding:36px 40px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0">

                      <tr>
                        <td style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#2a7a4b;padding-bottom:10px;font-weight:500;">
                          ${reviewId ? 'Review Suggestion' : 'Edit Suggestion'}
                        </td>
                      </tr>

                      <tr>
                        <td style="font-size:24px;color:#1e1a14;padding-bottom:6px;font-weight:400;">
                          ${contextName}
                        </td>
                      </tr>

                      ${subContextName ? `
                      <tr>
                        <td style="font-size:14px;color:#7a6e5f;padding-bottom:24px;font-weight:300;">
                          ${subContextName}
                        </td>
                      </tr>
                      ` : '<tr><td style="padding-bottom:24px;"></td></tr>'}

                      <tr>
                        <td style="padding-bottom:24px;">
                          <span style="display:inline-block;padding:5px 12px;background:#eaf5ee;border:1px solid rgba(42,122,75,0.2);border-radius:4px;font-size:12px;color:#2a7a4b;font-weight:500;letter-spacing:0.06em;text-transform:uppercase;margin-right:8px;">
                            ${pageType}
                          </span>
                          ${reviewId ? `
                          <span style="display:inline-block;padding:5px 12px;background:#ede6d8;border:1px solid rgba(60,45,20,0.16);border-radius:4px;font-size:12px;color:#7a6e5f;font-weight:400;letter-spacing:0.06em;text-transform:uppercase;">
                            Review #${reviewId}
                          </span>
                          ` : ''}
                        </td>
                      </tr>

                      ${reviewBlock}

                      <tr><td style="border-top:1px solid rgba(60,45,20,0.10);padding-top:24px;padding-bottom:4px;"></td></tr>

                      <tr>
                        <td style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#a89d8e;padding-bottom:12px;font-weight:500;">
                          Suggestion
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size:15px;color:#1e1a14;line-height:1.8;font-weight:300;white-space:pre-wrap;">
                          ${suggestion.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="background:#ede6d8;padding:20px 40px;font-size:12px;color:#a89d8e;font-weight:300;">
                    Sent automatically from ManagerCheck · ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' })} ET
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [TO_EMAIL],
        subject,
        html,
      }),
    })

    const resBody = await res.json()

    if (!res.ok) {
      console.error('Resend error:', resBody)
      return new Response(JSON.stringify({ error: 'Failed to send email', detail: resBody }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    return new Response(JSON.stringify({ success: true, id: resBody.id }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(JSON.stringify({ error: 'Internal error', detail: String(err) }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
})