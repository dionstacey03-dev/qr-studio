import QRCode from 'qrcode';
import { QRConfig, ScannedQRResult, QRContentType } from '../types';

/**
 * Generate standard payload string from QRConfig
 */
export function formatQRContent(config: QRConfig): string {
  switch (config.type) {
    case 'url': {
      if (config.trackingEnabled && config.trackingId) {
        if (typeof window !== 'undefined') {
          return `${window.location.origin}${window.location.pathname}?qr_proxy=${config.trackingId}`;
        }
        return `https://qrstudio.app?qr_proxy=${config.trackingId}`;
      }
      const trimmed = config.url.trim();
      if (!trimmed) return 'https://qrstudio.app';
      if (/^[a-zA-Z]+:\/\//i.test(trimmed)) {
        return trimmed;
      }
      return `https://${trimmed}`;
    }
    case 'text':
      return config.text || 'Hello from QR Studio!';
    case 'email': {
      const email = config.email.address.trim();
      const params = new URLSearchParams();
      if (config.email.subject) params.append('subject', config.email.subject);
      if (config.email.body) params.append('body', config.email.body);
      const query = params.toString();
      return `mailto:${email}${query ? `?${query}` : ''}`;
    }
    case 'phone': {
      const clean = config.phone.number.trim().replace(/\s+/g, '');
      return clean ? `tel:${clean}` : 'tel:+1234567890';
    }
    case 'sms': {
      const number = config.sms.number.trim().replace(/\s+/g, '');
      const body = config.sms.message;
      return body ? `sms:${number}?body=${encodeURIComponent(body)}` : `sms:${number}`;
    }
    case 'wifi': {
      const escape = (s: string) => s.replace(/([\\;,:"])/g, '\\$1');
      const ssid = escape(config.wifi.ssid.trim());
      const password = escape(config.wifi.password);
      const enc = config.wifi.encryption === 'nopass' ? 'nopass' : config.wifi.encryption;
      const hidden = config.wifi.hidden ? 'true' : 'false';
      return `WIFI:T:${enc};S:${ssid};P:${password};H:${hidden};;`;
    }
    case 'vcard': {
      const { firstName, lastName, organization, title, phone, email, url, street, city, country } = config.vcard;
      const fn = `${firstName} ${lastName}`.trim() || 'Contact';
      const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${lastName};${firstName};;;`,
        `FN:${fn}`,
      ];
      if (organization) lines.push(`ORG:${organization}`);
      if (title) lines.push(`TITLE:${title}`);
      if (phone) lines.push(`TEL;TYPE=CELL:${phone}`);
      if (email) lines.push(`EMAIL;TYPE=INTERNET:${email}`);
      if (url) lines.push(`URL:${url}`);
      if (street || city || country) {
        lines.push(`ADR;TYPE=WORK:;;${street};${city};;;${country}`);
      }
      lines.push('END:VCARD');
      return lines.join('\n');
    }
    default:
      return 'https://qrstudio.app';
  }
}

/**
 * Get human-readable summary of the QR content for cards and history
 */
export function getQRSummary(config: QRConfig): { title: string; summary: string } {
  switch (config.type) {
    case 'url':
      return {
        title: config.url ? (config.url.replace(/^https?:\/\//, '') || 'Website') : 'Website URL',
        summary: config.url || 'https://qrstudio.app',
      };
    case 'text':
      return {
        title: 'Plain Text',
        summary: config.text ? (config.text.length > 50 ? `${config.text.slice(0, 50)}...` : config.text) : 'Empty text note',
      };
    case 'email':
      return {
        title: config.email.address ? `Email: ${config.email.address}` : 'Email Address',
        summary: config.email.subject ? `Subj: ${config.email.subject}` : 'Quick mailto link',
      };
    case 'phone':
      return {
        title: config.phone.number || 'Phone Call',
        summary: 'Direct telephone link',
      };
    case 'sms':
      return {
        title: config.sms.number ? `SMS to ${config.sms.number}` : 'Text Message',
        summary: config.sms.message || 'Direct SMS link',
      };
    case 'wifi':
      return {
        title: config.wifi.ssid ? `Wi-Fi: ${config.wifi.ssid}` : 'Wi-Fi Network',
        summary: `Sec: ${config.wifi.encryption.toUpperCase()}${config.wifi.hidden ? ' (Hidden)' : ''}`,
      };
    case 'vcard':
      const name = `${config.vcard.firstName} ${config.vcard.lastName}`.trim();
      return {
        title: name || 'Contact Card',
        summary: config.vcard.organization || config.vcard.email || 'vCard 3.0 Profile',
      };
    default:
      return { title: 'QR Code', summary: 'Scannable barcode' };
  }
}

/**
 * Render QR code with logo onto a Canvas element
 */
export async function renderQRToCanvas(
  canvas: HTMLCanvasElement,
  config: QRConfig,
  renderSize?: number
): Promise<void> {
  const content = formatQRContent(config);
  const size = renderSize || config.size;
  canvas.width = size;
  canvas.height = size;

  // Use errorCorrection level H automatically if a logo is present to maintain scan reliability
  const errorCorrection = config.logoUrl ? 'H' : config.errorCorrection;

  await QRCode.toCanvas(canvas, content, {
    width: size,
    margin: config.margin,
    errorCorrectionLevel: errorCorrection,
    color: {
      dark: config.fgColor,
      light: config.bgColor,
    },
  });

  // If a logo is present, draw it at the center
  if (config.logoUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load logo image'));
        img.src = config.logoUrl!;
      });

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Logo size relative to canvas
        const logoDimension = (size * (config.logoSize || 20)) / 100;
        const x = (size - logoDimension) / 2;
        const y = (size - logoDimension) / 2;
        const padding = config.logoPadding || 6;
        const bgDimension = logoDimension + padding * 2;
        const bgX = (size - bgDimension) / 2;
        const bgY = (size - bgDimension) / 2;

        ctx.save();

        // Draw protective background badge behind the logo
        ctx.fillStyle = config.bgColor;
        if (config.logoShape === 'circle') {
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, bgDimension / 2, 0, Math.PI * 2);
          ctx.fill();

          // Subtle shadow/ring
          ctx.lineWidth = 2;
          ctx.strokeStyle = config.fgColor + '20';
          ctx.stroke();

          // Clip logo to circle
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, logoDimension / 2, 0, Math.PI * 2);
          ctx.clip();
        } else if (config.logoShape === 'rounded') {
          const r = 12 * (size / 300);
          ctx.beginPath();
          roundRect(ctx, bgX, bgY, bgDimension, bgDimension, r);
          ctx.fill();

          ctx.lineWidth = 2;
          ctx.strokeStyle = config.fgColor + '20';
          ctx.stroke();

          ctx.beginPath();
          roundRect(ctx, x, y, logoDimension, logoDimension, r * 0.8);
          ctx.clip();
        } else {
          // Square
          ctx.fillRect(bgX, bgY, bgDimension, bgDimension);
          ctx.lineWidth = 2;
          ctx.strokeStyle = config.fgColor + '20';
          ctx.strokeRect(bgX, bgY, bgDimension, bgDimension);
        }

        ctx.drawImage(img, x, y, logoDimension, logoDimension);
        ctx.restore();
      }
    } catch (e) {
      console.warn('Could not draw logo onto QR canvas:', e);
    }
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Generate SVG string of the QR code
 */
export async function generateQRSVG(config: QRConfig): Promise<string> {
  const content = formatQRContent(config);
  const errorCorrection = config.logoUrl ? 'H' : config.errorCorrection;

  const svgString = await QRCode.toString(content, {
    type: 'svg',
    width: config.size,
    margin: config.margin,
    errorCorrectionLevel: errorCorrection,
    color: {
      dark: config.fgColor,
      light: config.bgColor,
    },
  });

  // If a logo is present, insert an SVG image and protective background
  if (config.logoUrl) {
    const size = config.size;
    const logoDimension = (size * (config.logoSize || 20)) / 100;
    const padding = config.logoPadding || 6;
    const bgDimension = logoDimension + padding * 2;
    const bgX = (size - bgDimension) / 2;
    const bgY = (size - bgDimension) / 2;
    const logoX = (size - logoDimension) / 2;
    const logoY = (size - logoDimension) / 2;

    let badgeSvg = '';
    if (config.logoShape === 'circle') {
      badgeSvg = `<circle cx="${size / 2}" cy="${size / 2}" r="${bgDimension / 2}" fill="${config.bgColor}" stroke="${config.fgColor}20" stroke-width="2"/>
      <clipPath id="logo-circle-clip"><circle cx="${size / 2}" cy="${size / 2}" r="${logoDimension / 2}" /></clipPath>
      <image href="${config.logoUrl}" x="${logoX}" y="${logoY}" width="${logoDimension}" height="${logoDimension}" clip-path="url(#logo-circle-clip)" />`;
    } else {
      const rx = config.logoShape === 'rounded' ? '12' : '0';
      badgeSvg = `<rect x="${bgX}" y="${bgY}" width="${bgDimension}" height="${bgDimension}" rx="${rx}" fill="${config.bgColor}" stroke="${config.fgColor}20" stroke-width="2"/>
      <image href="${config.logoUrl}" x="${logoX}" y="${logoY}" width="${logoDimension}" height="${logoDimension}" />`;
    }

    // Insert badge before closing </svg>
    return svgString.replace('</svg>', `${badgeSvg}</svg>`);
  }

  return svgString;
}

/**
 * Parse any raw scanned QR string into categorized structured data
 */
export function parseScannedContent(raw: string): ScannedQRResult {
  const trimmed = raw.trim();

  // 1. URL
  if (/^https?:\/\//i.test(trimmed)) {
    return {
      raw: trimmed,
      type: 'url',
      parsed: {
        url: trimmed,
      },
      timestamp: Date.now(),
    };
  }

  // 2. Wi-Fi
  if (/^WIFI:/i.test(trimmed)) {
    const ssidMatch = trimmed.match(/S:([^;]+)/);
    const passMatch = trimmed.match(/P:([^;]+)/);
    const typeMatch = trimmed.match(/T:([^;]+)/);
    const hiddenMatch = trimmed.match(/H:([^;]+)/);
    return {
      raw: trimmed,
      type: 'wifi',
      parsed: {
        ssid: ssidMatch ? ssidMatch[1].replace(/\\([\\;,:"])/g, '$1') : '',
        password: passMatch ? passMatch[1].replace(/\\([\\;,:"])/g, '$1') : '',
        encryption: typeMatch ? typeMatch[1] : 'WPA',
        hidden: hiddenMatch && hiddenMatch[1] === 'true' ? 'Yes' : 'No',
      },
      timestamp: Date.now(),
    };
  }

  // 3. Email
  if (/^mailto:/i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      return {
        raw: trimmed,
        type: 'email',
        parsed: {
          address: url.pathname || '',
          subject: url.searchParams.get('subject') || '',
          body: url.searchParams.get('body') || '',
        },
        timestamp: Date.now(),
      };
    } catch {
      const emailOnly = trimmed.replace(/^mailto:/i, '');
      return {
        raw: trimmed,
        type: 'email',
        parsed: { address: emailOnly },
        timestamp: Date.now(),
      };
    }
  }

  // 4. Phone
  if (/^tel:/i.test(trimmed)) {
    return {
      raw: trimmed,
      type: 'phone',
      parsed: {
        number: trimmed.replace(/^tel:/i, ''),
      },
      timestamp: Date.now(),
    };
  }

  // 5. SMS
  if (/^(sms|smsto):/i.test(trimmed)) {
    const after = trimmed.replace(/^(sms|smsto):/i, '');
    const parts = after.split(/[?:;]/);
    const number = parts[0];
    let body = '';
    const bodyMatch = trimmed.match(/[?&;]body=([^&]+)/i);
    if (bodyMatch) {
      body = decodeURIComponent(bodyMatch[1]);
    }
    return {
      raw: trimmed,
      type: 'sms',
      parsed: {
        number,
        body,
      },
      timestamp: Date.now(),
    };
  }

  // 6. vCard
  if (/BEGIN:VCARD/i.test(trimmed)) {
    const fnMatch = trimmed.match(/FN:(.+)/i);
    const telMatch = trimmed.match(/TEL[^:]*:(.+)/i);
    const emailMatch = trimmed.match(/EMAIL[^:]*:(.+)/i);
    const orgMatch = trimmed.match(/ORG:(.+)/i);
    const titleMatch = trimmed.match(/TITLE:(.+)/i);
    const urlMatch = trimmed.match(/URL:(.+)/i);
    return {
      raw: trimmed,
      type: 'vcard',
      parsed: {
        name: fnMatch ? fnMatch[1].trim() : '',
        phone: telMatch ? telMatch[1].trim() : '',
        email: emailMatch ? emailMatch[1].trim() : '',
        organization: orgMatch ? orgMatch[1].trim() : '',
        title: titleMatch ? titleMatch[1].trim() : '',
        url: urlMatch ? urlMatch[1].trim() : '',
      },
      timestamp: Date.now(),
    };
  }

  // Fallback: check if looks like a naked domain (e.g. www.google.com or example.com/path)
  if (/^(www\.[a-z0-9\-]+|[a-z0-9\-]+\.[a-z]{2,})(\/.*)?$/i.test(trimmed)) {
    return {
      raw: trimmed,
      type: 'url',
      parsed: {
        url: `https://${trimmed}`,
      },
      timestamp: Date.now(),
    };
  }

  return {
    raw: trimmed,
    type: 'text',
    parsed: {
      text: trimmed,
    },
    timestamp: Date.now(),
  };
}
