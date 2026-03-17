import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const messages = {
  one_month_warning: {
    subject: "SpendWise AI — Your Gmail has been disconnected for 1 month",
    body: (name) => `Hi ${name},

Your Gmail account has been disconnected from SpendWise AI for 1 month.

Please reconnect to continue tracking your expenses. If you remain disconnected for 2 more months, your account and all data will be permanently deleted.

Login at http://localhost:5173

Team SpendWise AI`
  },
  two_month_warning: {
    subject: "SpendWise AI — Account deletion warning (1 month remaining)",
    body: (name) => `Hi ${name},

Your Gmail account has been disconnected from SpendWise AI for 2 months.

Your account and all associated data will be permanently deleted in 30 days if you do not reconnect.

Login at http://localhost:5173

Team SpendWise AI`
  },
  deleted: {
    subject: "SpendWise AI — Your account has been deleted",
    body: (name) => `Hi ${name},

Your SpendWise AI account has been permanently deleted due to 3 months of inactivity (Gmail disconnected).

You can sign up again at http://localhost:5173

Team SpendWise AI`
  }
};

export const sendInactivityEmail = async (email, name, type) => {
  try {
    const { subject, body } = messages[type];
    await resend.emails.send({
      from: "SpendWise AI <onboarding@resend.dev>",
      to: email,
      subject,
      text: body(name)
    });
    console.log(`Inactivity email (${type}) sent to ${email}`);
  } catch (err) {
    console.error(`Failed to send inactivity email to ${email}:`, err.message);
  }
};