"use client";

import { useState } from "react";
import emailjs from "@emailjs/browser";

export default function LeadForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function sendEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");

    const form = e.currentTarget;

    try {
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!;
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!;
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!;

      await emailjs.sendForm(serviceId, templateId, form, { publicKey });

      form.reset();
      setStatus("sent");
    } catch (error) {
      console.error("EmailJS error:", error);
      setStatus("error");
    }
  }

  return (
    <>
      <form onSubmit={sendEmail} aria-label="Quote request form">
        <input className="input" type="text" name="name" placeholder="Full Name" required />

        <input className="input" type="tel" name="phone" placeholder="Phone Number" required />

        <input className="input" type="text" name="address" placeholder="Service Address" required />

        <input
          className="input"
          type="text"
          name="vehicle"
          placeholder="Vehicle (Year, Make, Model)"
          required
        />

        <select className="input" name="service" required defaultValue="">
          <option value="">Choose a Service</option>
          <option value="oil">Oil Change</option>
          <option value="brakes">Brake Service</option>
          <option value="detail">Full Detail</option>
          <option value="tuneup">Tune-Up</option>
          <option value="diagnostics">Diagnostics</option>
          <option value="battery">Battery / Jump Start</option>
          <option value="other">Other</option>
        </select>

        <textarea className="input" name="message" placeholder="What's going on?" rows={3} />

        <button className="quote-btn" type="submit" disabled={status === "sending"}>
          {status === "sending"
            ? "Sending..."
            : status === "sent"
            ? "Sent!"
            : status === "error"
            ? "Error — Try Again"
            : "Request Quote"}
        </button>
      </form>

      {status === "sent" && (
        <div className="confirmation" role="alert">
          Thanks! We&apos;ll be in touch shortly.
        </div>
      )}

      {status === "error" && (
        <div className="confirmation" role="alert">
          Something went wrong. Please try again.
        </div>
      )}
    </>
  );
}
