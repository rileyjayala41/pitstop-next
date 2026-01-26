"use client";

import { useEffect, useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { parsePhoneNumberFromString } from "libphonenumber-js";

declare global {
  interface Window {
    google?: any;
  }
}

type UTMFields = {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  gclid: string;
  fbclid: string;
};

function loadGooglePlaces(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.maps?.places) return resolve();

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-google-places="true"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Google script failed"))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.dataset.googlePlaces = "true";

    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google script failed to load"));

    document.head.appendChild(script);
  });
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function readUtmFromUrl(): UTMFields {
  if (typeof window === "undefined") {
    return {
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
      utm_content: "",
      utm_term: "",
      gclid: "",
      fbclid: "",
    };
  }

  const p = new URLSearchParams(window.location.search);

  return {
    utm_source: p.get("utm_source") || "",
    utm_medium: p.get("utm_medium") || "",
    utm_campaign: p.get("utm_campaign") || "",
    utm_content: p.get("utm_content") || "",
    utm_term: p.get("utm_term") || "",
    gclid: p.get("gclid") || "",
    fbclid: p.get("fbclid") || "",
  };
}

export default function LeadForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  // UTMs
  const [utm, setUtm] = useState<UTMFields>({
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    utm_content: "",
    utm_term: "",
    gclid: "",
    fbclid: "",
  });

  // Phone (digits only + validated)
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneValue, setPhoneValue] = useState("");

  // Address autocomplete
  const [addressValue, setAddressValue] = useState("");
  const [addressReady, setAddressReady] = useState(false);
  const addressInputRef = useRef<HTMLInputElement | null>(null);

  // Capture UTMs once on load (keeps the “source/campaign” tied to the session/page load)
  useEffect(() => {
    setUtm(readUtmFromUrl());
  }, []);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
      console.warn("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
      return;
    }

    let autocomplete: any = null;

    loadGooglePlaces(key)
      .then(() => {
        const input = addressInputRef.current;
        if (!input || !window.google?.maps?.places) return;

        autocomplete = new window.google.maps.places.Autocomplete(input, {
          types: ["address"],
          componentRestrictions: { country: "us" },
          fields: ["formatted_address"],
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          const formatted = place?.formatted_address;
          if (formatted) setAddressValue(formatted);
        });

        setAddressReady(true);
      })
      .catch((err) => console.error("Google Places load error:", err));

    return () => {
      autocomplete = null;
    };
  }, []);

  async function sendEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPhoneError(null);
    setStatus("sending");

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Validate phone
    const phoneRaw = phoneValue.trim();
    const phone = parsePhoneNumberFromString(phoneRaw, "US");

    if (!phone || !phone.isValid()) {
      setPhoneError("Please enter a valid US phone number.");
      setStatus("idle");
      return;
    }

    // Always store phone in E.164 format
    formData.set("phone", phone.format("E.164"));

    // Address from state (Google autocomplete)
    formData.set("address", addressValue.trim());

    // Attach tracking fields to BOTH DB payload and EmailJS form
    formData.set("utm_source", utm.utm_source);
    formData.set("utm_medium", utm.utm_medium);
    formData.set("utm_campaign", utm.utm_campaign);
    formData.set("utm_content", utm.utm_content);
    formData.set("utm_term", utm.utm_term);
    formData.set("gclid", utm.gclid);
    formData.set("fbclid", utm.fbclid);

    try {
      const payload = Object.fromEntries(formData.entries());

      // Save lead to DB (Supabase via /api/leads)
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error || "Failed to save lead.");

      // EmailJS notification
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!;
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!;
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!;

      await emailjs.sendForm(serviceId, templateId, form, { publicKey });

      // Reset
      form.reset();
      setPhoneValue("");
      setAddressValue("");
      setStatus("sent");
    } catch (err) {
      console.error("Lead submit error:", err);
      setStatus("error");
    }
  }

  return (
    <form onSubmit={sendEmail} className="quote-form">
      <input className="input" name="name" placeholder="Full Name" required />

      {/* PHONE */}
      <input
        className="input"
        name="phone"
        placeholder="Phone number"
        required
        inputMode="numeric"
        pattern="\d{10,15}"
        value={phoneValue}
        onChange={(e) => {
          const cleaned = digitsOnly(e.target.value);
          setPhoneValue(cleaned);
          setPhoneError(null);
        }}
      />
      {phoneError && <div style={{ color: "#ff6b6b", fontSize: 14 }}>{phoneError}</div>}

      {/* ADDRESS */}
      <input
        className="input"
        name="address_display"
        placeholder={addressReady ? "Service Address" : "Service Address"}
        required
        ref={addressInputRef}
        value={addressValue}
        onChange={(e) => setAddressValue(e.target.value)}
        autoComplete="street-address"
      />

      {/* VEHICLE (simple again) */}
      <input
        className="input"
        name="vehicle"
        placeholder="Vehicle (Year, Make, Model) — ex: 2004 Toyota Corolla"
        required
      />

      <select className="input" name="service" required>
        <option value="">Select Service</option>
        <option>Oil Change</option>
        <option>Brake Repair</option>
        <option>Diagnostics</option>
	<option>Tune-Up</option>
        <option>Suspension</option>
        <option>Engine / Drivetrain</option>
        <option>Other</option>
      </select>

      <textarea className="input" name="message" rows={4} placeholder="How can we help?" />

      {/* Hidden fields so EmailJS gets them too */}
      <input type="hidden" name="address" value={addressValue} />
      <input type="hidden" name="utm_source" value={utm.utm_source} />
      <input type="hidden" name="utm_medium" value={utm.utm_medium} />
      <input type="hidden" name="utm_campaign" value={utm.utm_campaign} />
      <input type="hidden" name="utm_content" value={utm.utm_content} />
      <input type="hidden" name="utm_term" value={utm.utm_term} />
      <input type="hidden" name="gclid" value={utm.gclid} />
      <input type="hidden" name="fbclid" value={utm.fbclid} />

      <button className="quote-btn" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending..." : "Get Quote"}
      </button>

      {status === "sent" && <p>Thanks! We’ll be in touch shortly.</p>}
      {status === "error" && <p>Something went wrong. Please try again.</p>}
    </form>
  );
}
