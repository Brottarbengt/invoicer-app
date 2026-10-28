import QRCode from 'qrcode';

export async function generateSwishQrCode(
  swishNumber: string,
  amount: number,
  message: string
): Promise<string> {
  const cleanNumber = swishNumber.replace(/[^0-9]/g, '');
  if (!cleanNumber) return '';

  // Standard Swish QR data format
  // Format C: { "version": 1, "payee": { "value": "..." }, "amount": { "value": ... }, "message": { "value": "..." } }
  const swishPayload = JSON.stringify({
    version: 1,
    payee: {
      value: cleanNumber,
    },
    amount: {
      value: Math.round(amount),
    },
    message: {
      value: message.substring(0, 50),
      editable: false,
    },
  });

  try {
    const dataUrl = await QRCode.toDataURL(swishPayload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 180,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate Swish QR code', err);
    return '';
  }
}
