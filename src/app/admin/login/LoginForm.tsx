"use client";

import { useActionState } from "react";
import { Icon } from "@/components/ui/Icon";
import { loginAdmin } from "@/app/admin/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAdmin, undefined);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <p className="flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          <Icon name="error" className="text-base" />
          {state.error}
        </p>
      )}

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          Email
        </span>
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          placeholder="you@example.com"
          className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-2.5 text-sm text-on-surface focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          Password
        </span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-2.5 text-sm text-on-surface focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-secondary-fixed px-6 py-3 text-sm font-semibold uppercase tracking-widest text-on-secondary-fixed transition-all hover:brightness-105 disabled:opacity-60"
      >
        {pending ? (
          <Icon name="progress_activity" className="animate-spin text-base" />
        ) : (
          <Icon name="login" className="text-base" />
        )}
        Sign In
      </button>
    </form>
  );
}
