"use client";

import { useEffect, useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { parsePhoneNumberFromString } from "libphonenumber-js";

declare global {
  interface Window {
    google?: any;
  }
}

function loadGooglePlaces(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.maps?.places) return resolve();

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-google-places="true"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Google script failed")));
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

export default function LeadForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  // Phone
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneValue, setPhoneValue] = useState("");

  // Address (autocomplete)
  const [addressValue, setAddressValue] = useState("");
  const [addressReady, setAddressReady] = useState(false);
  const addressInputRef = useRef<HTMLInputElement | null>(null);

  // Vehicle dropdowns
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1984 }, (_, i) => String(currentYear - i)); // 1985..now

  const [year, setYear] = useState<string>("");
  const [make, setMake] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [drivetrain, setDrivetrain] = useState<string>("");

  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [vehicleLoading, setVehicleLoading] = useState<null | "makes" | "models">(null);

  // Client-side cache so we don't spam API (and we avoid repeated 502 bursts)
  const makesCache = useRef<Record<string, string[]>>({});
  const modelsCache = useRef<Record<string, string[]>>({});

  // Load Google Places
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

  // Year -> Makes
  useEffect(() => {
    if (!year) {
      setMakes([]);
      setMake("");
      setModels([]);
      setModel("");
      return;
    }

    // Serve from cache if available
    if (makesCache.current[year]) {
      setMakes(makesCache.current[year]);
      setMake("");
      setModels([]);
      setModel("");
      return;
    }

    setVehicleLoading("makes");

    fetch(`/api/vehicles/makes?year=${encodeURIComponent(year)}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok || !j.ok) throw new Error(j?.error || "Makes failed");
        const list: string[] = j.makes || [];
        makesCache.current[year] = list;
        setMakes(list);
        setMake("");
        setModels([]);
        setModel("");
      })
      .catch((e) => {
        console.error("Makes error:", e);
        setMakes([]);
      })
      .finally(() => setVehicleLoading(null));
  }, [year]);

  // Make -> Models
  useEffect(() => {
    if (!year || !make) {
      setModels([]);
      setModel("");
      return;
    }

    const cacheKey = `${year}__${make}`;

    if (modelsCache.current[cacheKey]) {
      setModels(modelsCache.current[cacheKey]);
      setModel("");
      return;
    }

    setVehicleLoading("models");

    fetch(`/api/vehicles/models?year=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok || !j.ok) throw new Error(j?.error || "Models failed");
        const list: string[] = j.models || [];
        modelsCache.current[cacheKey] = list;
        setModels(list);
        setModel("");
      })
      .catch((e) => {
        console.error("Models error:", e);
        setModels([]);
      })
      .finally(() => setVehicleLoading(null));
  }, [year, make]);

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

    formData.set("phone", phone.format("E.164"));

    // Address state
    formData.set("address", addressValue.trim());

    // Vehicle single-string (keeps your DB/email the same)
    const vehicleString = `${year} ${make} ${model}${drivetrain ? ` (${drivetrain})` : ""}`.trim();
    formData.set("vehicle", vehicleString);

    try {
      const payload = Object.fromEntries(formData.entries());

      // Save to DB
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error || "Failed to save lead.");

      // EmailJS
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!;
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!;
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!;

      await emailjs.sendForm(serviceId, templateId, form, { publicKey });

      form.reset();
      setPhoneValue("");
      setAddressValue("");
      setYear("");
      setMake("");
      setModel("");
      setDrivetrain("");
      setStatus("sent");
    } catch (err) {
      console.error("Lead submit error:", err);
      setStatus("error");
    }
  }

  const vehicleReady = Boolean(year && make && model);

  return (
    <form onSubmit={sendEmail} className="quote-form">
      <input className="input" name="name" placeholder="Full Name" required />

      {/* PHONE */}
      <input
        className="input"
        name="phone"
        placeholder="Phone (numbers only)"
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
        placeholder={addressReady ? "Service Address (start typing…)" : "Service Address"}
        required
        ref={addressInputRef}
        value={addressValue}
        onChange={(e) => setAddressValue(e.target.value)}
        autoComplete="street-address"
      />

      {/* VEHICLE */}
      <select className="input" value={year} onChange={(e) => setYear(e.target.value)} required>
        <option value="">Vehicle Year</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      <select
        className="input"
        value={make}
        onChange={(e) => setMake(e.target.value)}
        required
        disabled={!year || vehicleLoading === "makes"}
      >
        <option value="">
          {vehicleLoading === "makes" ? "Loading makes..." : "Make"}
        </option>
        {makes.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      <select
        className="input"
        value={model}
        onChange={(e) => setModel(e.target.value)}
        required
        disabled={!year || !make || vehicleLoading === "models"}
      >
        <option value="">
          {vehicleLoading === "models" ? "Loading models..." : "Model"}
        </option>
        {models.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      <select className="input" value={drivetrain} onChange={(e) => setDrivetrain(e.target.value)}>
        <option value="">Drivetrain (optional)</option>
        <option value="2WD">2WD</option>
        <option value="4WD">4WD</option>
        <option value="AWD">AWD</option>
      </select>

      {/* Hidden field your backend expects */}
      <input
        type="hidden"
        name="vehicle"
        value={`${year} ${make} ${model}${drivetrain ? ` (${drivetrain})` : ""}`.trim()}
      />

      <select className="input" name="service" required>
        <option value="">Select Service</option>
        <option>Diagnostics</option>
        <option>Brake Repair</option>
        <option>Oil Change</option>
        <option>Suspension</option>
        <option>Engine / Drivetrain</option>
        <option>Other</option>
      </select>

      <textarea className="input" name="message" rows={4} placeholder="Tell us what's going on" />

      <button className="quote-btn" type="submit" disabled={status === "sending" || !vehicleReady}>
        {status === "sending" ? "Sending..." : vehicleReady ? "Get Quote" : "Select Vehicle Details"}
      </button>

      {status === "sent" && <p>Thanks! We’ll be in touch shortly.</p>}
      {status === "error" && <p>Something went wrong. Please try again.</p>}
    </form>
  );
}
