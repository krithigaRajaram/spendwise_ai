import { Resend } from "resend";
import { templates } from "./email.templates.js";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendInactivityEmail = async (email, name, type) => {
  try {
    const { subject, html } = templates[type](name);
    await resend.emails.send({
      from: "SpendWise AI <onboarding@resend.dev>",
      to: email,
      subject,
      html
    });
    console.log(`Inactivity email (${type}) sent to ${email}`);
  } catch (err) {
    console.error(`Failed to send inactivity email to ${email}:`, err.message);
  }
};

export const sendVerificationEmail = async (email, name, code) => {
  try {
    const { subject, html } = templates.verification(name, code);
    await resend.emails.send({
      from: "SpendWise AI <onboarding@resend.dev>",
      to: email,
      subject,
      html
    });
    console.log(`Verification email sent to ${email}`);
  } catch (err) {
    console.error(`Failed to send verification email to ${email}:`, err.message);
  }
};