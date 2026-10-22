// Logo hosted at a public URL (any public bucket or CDN) — email clients
// only load images from a public URL, they can't reach local app assets.
const LOGO_URL = Deno.env.get("EMAIL_LOGO_URL");

// Email wrapper following Lenvy's design system (DESIGN.md):
// - Palette: parchment canvas, deep ink, Evergreen accent, hairline borders
// - Typography: Inter-like system stack, tabular-nums on all numerics
// - Spacing: 4-pt base, generous (28px card pad, 20px gutter)
// - Radius: lg (20px) for floating surfaces
// - Voice: no exclamation marks, no emoji, restraint signals trust
// - Footer carries the brand tagline "Every number has a purpose."
export function wrapEmail(bodyHtml: string) {
  return `
  <div style="background:#F4F2EE;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
    <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border-radius:20px;overflow:hidden;border:1px solid #EAE6DE;">
      <div style="background:#1E4D3B;padding:20px 28px;">
        ${
    LOGO_URL
      ? `<img src="${LOGO_URL}" alt="Lenvy" height="24" style="display:block;height:24px;width:auto;" />`
      : `<span style="color:#FFFFFF;font-size:16px;font-weight:600;letter-spacing:0.2px;">Lenvy</span>`
  }
      </div>
      <div style="padding:28px;color:#0A0D12;font-size:15px;line-height:1.6;">
        ${bodyHtml}
      </div>
      <div style="padding:16px 28px;border-top:1px solid #EAE6DE;">
        <span style="color:#8A94A2;font-size:11px;line-height:1.4;">Every number has a purpose.<br/>You're receiving this because you have a Lenvy account.</span>
      </div>
    </div>
  </div>`;
}
