export const templates = {
  verification: (name, code) => ({
    subject: "Verify your email — SpendWise AI",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff;">
        <h2 style="color: #111827; margin-bottom: 8px;">Verify your email</h2>
        <p style="color: #6b7280; margin-bottom: 24px;">Hi ${name}, welcome to SpendWise AI! Use the code below to verify your email address.</p>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #111827;">${code}</span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This code expires in <strong>30 minutes</strong>.</p>
        <p style="color: #6b7280; font-size: 14px;">If you did not sign up for SpendWise AI, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Team SpendWise AI</p>
      </div>
    `
  }),

  one_month_warning: (name) => ({
    subject: "SpendWise AI — Your Gmail has been disconnected for 1 month",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff;">
        <h2 style="color: #111827; margin-bottom: 8px;">Gmail Disconnected</h2>
        <p style="color: #6b7280; margin-bottom: 16px;">Hi ${name},</p>
        <p style="color: #6b7280; margin-bottom: 16px;">Your Gmail account has been disconnected from SpendWise AI for <strong>1 month</strong>.</p>
        <p style="color: #6b7280; margin-bottom: 24px;">Please reconnect to continue tracking your expenses. If you remain disconnected for <strong>2 more months</strong>, your account and all data will be permanently deleted.</p>
        <a href="http://localhost:5173" style="display: inline-block; background: #111827; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Reconnect Gmail</a>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Team SpendWise AI</p>
      </div>
    `
  }),

  two_month_warning: (name) => ({
    subject: "SpendWise AI — Account deletion warning (1 month remaining)",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff;">
        <h2 style="color: #dc2626; margin-bottom: 8px;">Account Deletion Warning</h2>
        <p style="color: #6b7280; margin-bottom: 16px;">Hi ${name},</p>
        <p style="color: #6b7280; margin-bottom: 16px;">Your Gmail account has been disconnected from SpendWise AI for <strong>2 months</strong>.</p>
        <p style="color: #6b7280; margin-bottom: 24px;">Your account and all associated data will be <strong>permanently deleted in 30 days</strong> if you do not reconnect.</p>
        <a href="http://localhost:5173" style="display: inline-block; background: #dc2626; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Reconnect Now</a>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Team SpendWise AI</p>
      </div>
    `
  }),

  deleted: (name) => ({
    subject: "SpendWise AI — Your account has been deleted",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff;">
        <h2 style="color: #111827; margin-bottom: 8px;">Account Deleted</h2>
        <p style="color: #6b7280; margin-bottom: 16px;">Hi ${name},</p>
        <p style="color: #6b7280; margin-bottom: 16px;">Your SpendWise AI account has been permanently deleted due to <strong>3 months of inactivity</strong> (Gmail disconnected).</p>
        <p style="color: #6b7280; margin-bottom: 24px;">You can sign up again anytime.</p>
        <a href="http://localhost:5173" style="display: inline-block; background: #111827; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Sign Up Again</a>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Team SpendWise AI</p>
      </div>
    `
  })
};