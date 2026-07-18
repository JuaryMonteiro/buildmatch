const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendVerificationEmail(to, token) {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: 'Confirme o seu email — BuildMatch',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Confirme o seu email — BuildMatch</h2>
          <p>Confirme o seu endereço de email clicando no botão abaixo:</p>
          <a href="${verifyUrl}"
             style="
               background-color:#007bff;
               color:#fff;
               padding:12px 20px;
               text-decoration:none;
               border-radius:6px;
               display:inline-block;
               font-weight:bold;
             ">
             Confirmar Email
          </a>
          <p style="margin-top:20px;">Este link expira em 24 horas.</p>
          <p>Se o botão não funcionar, copie e cole este link no navegador:</p>
          <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Erro ao enviar email de verificação:', err);
    throw new Error('Não foi possível enviar o email de verificação');
  }
}

async function sendPasswordResetEmail(to, token) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: 'Recuperação de password — BuildMatch',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1F4E8C, #163a6b); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 24px;">🔐 BuildMatch</h1>
          </div>
          <div style="background: #fff; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #E5E7EB; border-top: none;">
            <h2 style="color: #1F4E8C; margin-top: 0;">Recuperação de password</h2>
            <p style="color: #6B7280;">Recebemos um pedido para redefinir a password da sua conta BuildMatch.</p>
            <p style="color: #6B7280;">Clique no botão abaixo para criar uma nova password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}"
                 style="
                   background-color: #F57C00;
                   color: #fff;
                   padding: 14px 28px;
                   text-decoration: none;
                   border-radius: 8px;
                   display: inline-block;
                   font-weight: bold;
                   font-size: 16px;
                 ">
                 Redefinir Password
              </a>
            </div>
            <p style="color: #6B7280; font-size: 14px;">⏰ Este link expira em <strong>1 hora</strong>.</p>
            <p style="color: #6B7280; font-size: 14px;">Se não pediu a recuperação de password, ignore este email — a sua conta continua segura.</p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;">
            <p style="color: #9CA3AF; font-size: 12px;">Se o botão não funcionar, copie e cole este link no navegador:</p>
            <p style="color: #9CA3AF; font-size: 12px; word-break: break-all;"><a href="${resetUrl}" style="color: #1F4E8C;">${resetUrl}</a></p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('Erro ao enviar email de recuperação de password:', err);
    throw new Error('Não foi possível enviar o email de recuperação');
  }
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
