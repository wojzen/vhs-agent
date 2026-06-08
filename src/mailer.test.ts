import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('nodemailer', () => {
  const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'test-id' });
  const mockCreateTransport = vi.fn(() => ({ sendMail: mockSendMail }));

  return {
    default: {
      createTransport: mockCreateTransport,
    },
  };
});

import { sendEmail } from './mailer.js';
import nodemailer from 'nodemailer';

const mockCreateTransport = vi.mocked(nodemailer.createTransport);

describe('sendEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GMAIL_USER = 'sender@gmail.com';
    process.env.GMAIL_APP_PASSWORD = 'test-password';
    process.env.RECIPIENT_EMAIL = 'recipient@example.com';
  });

  it('creates a Gmail SMTP transporter', async () => {
    const mockSendMail = vi.fn().mockResolvedValue({});
    mockCreateTransport.mockReturnValue({ sendMail: mockSendMail } as any);

    await sendEmail('Test Subject', 'Test Body');

    expect(mockCreateTransport).toHaveBeenCalledWith({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: 'sender@gmail.com', pass: 'test-password' },
    });
  });

  it('sends email with correct fields', async () => {
    const mockSendMail = vi.fn().mockResolvedValue({});
    mockCreateTransport.mockReturnValue({ sendMail: mockSendMail } as any);

    await sendEmail('Töpferkurs verfügbar', 'Jetzt anmelden!');

    expect(mockSendMail).toHaveBeenCalledWith({
      from: 'sender@gmail.com',
      to: 'recipient@example.com',
      subject: 'Töpferkurs verfügbar',
      text: 'Jetzt anmelden!',
    });
  });

  it('throws when sendMail fails', async () => {
    const mockSendMail = vi.fn().mockRejectedValue(new Error('SMTP error'));
    mockCreateTransport.mockReturnValue({ sendMail: mockSendMail } as any);

    await expect(sendEmail('Subject', 'Body')).rejects.toThrow('SMTP error');
  });
});
