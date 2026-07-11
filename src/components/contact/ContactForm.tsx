"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { clsx } from "@/lib/clsx";
import { site } from "@/data/site";
import { submitContact } from "@/lib/actions/contact";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitContact(form);
    const text = `Enquiry from ${form.name}%0APhone: ${form.phone}%0AEmail: ${form.email}%0A%0A${form.message}`;
    window.open(`${site.whatsappHref}?text=${text}`, "_blank", "noopener,noreferrer");
    setSent(true);
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-success/30 bg-success/5 p-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <Icon name="check_circle" className="text-4xl text-success" />
        </div>
        <h3 className="mt-5 font-[var(--font-heading)] text-2xl text-on-surface">Thank you!</h3>
        <p className="mt-2 max-w-sm text-sm text-on-surface-variant">
          Your message is on its way to our consultants on WhatsApp. We typically respond
          within a few hours.
        </p>
        <button
          onClick={() => {
            setSent(false);
            setForm({ name: "", phone: "", email: "", message: "" });
          }}
          className="mt-6 text-sm font-semibold text-secondary hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 md:p-8"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input label="Name" required value={form.name} onChange={update("name")} placeholder="Your full name" />
        <Input label="Phone" value={form.phone} onChange={update("phone")} placeholder="+92 3xx xxxxxxx" type="tel" />
      </div>
      <div className="mt-5">
        <Input label="Email" value={form.email} onChange={update("email")} placeholder="you@example.com" type="email" />
      </div>
      <div className="mt-5">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Message <span className="text-error">*</span>
          </span>
          <textarea
            required
            value={form.message}
            onChange={update("message")}
            rows={5}
            placeholder="Tell us about your travel plans…"
            className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-sm focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
          />
        </label>
      </div>
      <button
        type="submit"
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-semibold uppercase tracking-widest text-on-primary transition-colors hover:bg-primary-container sm:w-auto"
      >
        <Icon name="send" className="text-base" /> Send Message
      </button>
    </form>
  );
}

function Input({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
        {label} {props.required && <span className="text-error">*</span>}
      </span>
      <input
        {...props}
        className={clsx(
          "w-full rounded-lg border border-outline-variant bg-surface px-4 py-2.5 text-sm",
          "focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20",
        )}
      />
    </label>
  );
}
