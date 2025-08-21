import nodemailer from "nodemailer";
import { generateEmailResetPasswordHtml } from "./emailHtmlContents.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SENDER_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export const sendEmailResetPassword = async function (userEmail, accessToken) {
  try {
    transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: [userEmail],
      subject: "Password Reset Form",
      html: generateEmailResetPasswordHtml(userEmail, accessToken),
    });
  } catch (err) {
    console.log(err);
    err.name = "sendEmailError";
    err.message = "Error while sending email";
    console.log(err);
  }
};
