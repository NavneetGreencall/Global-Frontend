import { useState } from "react";
import type { FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { changePassword, login } from "@/lib/backend-api/auth";
import { SAPLING_LOGO } from "@/layout";
import { SESSION_KEY, afterLoginPath, statusOf, useSession } from "./session";
import { TENANT_CODE, USE_SAMPLE_DATA } from "@/config/data-mode";
import "./login.css";

/* =====================================================================
   /auth: sign in, and set a new password when the account requires it.

   - Uses login() and changePassword() from src/lib/backend-api/auth.ts.
   - The tenant code comes from VITE_TENANT_CODE in .env.
   - Passwords are never stored or logged; the session is an HttpOnly cookie.
   ===================================================================== */

const MIN_PASSWORD_LENGTH = 12; // adjust to the backend's password rule

/** Turn a failed request into a message for the person signing in */
const ICONS: Record<string, JSX.Element> = {
  sparkle: <path d="M12 3.5l1.6 4.4 4.4 1.6-4.4 1.6L12 15.5l-1.6-4.4L6 9.5l4.4-1.6zM18.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />,
  pulse: <path d="M3.5 12h4l2-5 4 10 2-5h5" />,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5" /></>,
  shield: <><path d="M12 3.5l7 3v5c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9v-5z" /><path d="M9 12l2 2 4-4" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M3 3l18 18" /><path d="M10.6 5.6A9.7 9.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.2 4M6.4 6.5C3.9 8.2 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  signin: <><path d="M10 7V5.5A1.5 1.5 0 0 1 11.5 4h7A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 10 18.5V17" /><path d="M4 12h10M11 9l3 3-3 3" /></>,
};
const Icon = ({ n, s = 18 }: { n: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[n]}</svg>
);

function loginMessage(err: unknown): string {
  const status = statusOf(err);
  if (status === 400 || status === 401) return "Email or password is incorrect.";
  if (status === 403) {
    // show the server's own reason (e.g. an origin or CSRF check), not a guess about the account
    const detail = err instanceof Error && err.message && !/^forbidden$/i.test(err.message.trim()) ? err.message : "";
    return detail
      ? `Sign-in was refused: ${detail}`
      : "Sign-in was refused by the server (403). This can be the account's access or the server not accepting sign-ins from this address.";
  }
  if (status === 423) return "This account is locked. Contact your administrator.";
  if (status === 429) return "Too many attempts. Wait a few minutes and try again.";
  if (status === undefined) return "Can't reach the server. Check your connection and try again.";
  return (err instanceof Error && err.message) || "Sign-in failed. Please try again.";
}

function SignInForm({ onSignedIn }: { onSignedIn: (mustChangePassword: boolean) => void }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return; // no double submits
    if (!email.trim() || !password) return setError("Enter your email and password.");
    setBusy(true);
    setError("");
    try {
      const res = await login({ tenantCode: TENANT_CODE, email: email.trim(), password });
      queryClient.setQueryData(SESSION_KEY, res.session);
      onSignedIn(res.session.mustChangePassword);
    } catch (err) {
      setError(loginMessage(err));
      setPassword("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="login-form" onSubmit={submit} noValidate>
      <h1 className="login-title">Sign in to your workspace</h1>
      <p className="login-subtitle">Use the work email and password issued by your Platform Admin.</p>

      <label className="login-field">
        <span>Work email</span>
        <input
          className="login-input"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy}
          autoFocus
        />
      </label>

      <label className="login-field">
        <span className="login-label-row">
          <span>Password</span>
          <small>Secure password</small>
        </span>
        <span className="login-password">
          <input
            className="login-input"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
          />
          <button
            type="button"
            className="login-eye"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            <Icon n={showPassword ? "eyeOff" : "eye"} />
          </button>
        </span>
      </label>

      {error && <p className="login-error" role="alert">{error}</p>}

      <button className="login-button" type="submit" disabled={busy}>
        {busy ? <span className="login-spinner" aria-hidden="true" /> : <Icon n="signin" s={17} />}
        {busy ? "Signing in…" : "Sign in"}
      </button>

      {!TENANT_CODE && (
        <p className="login-warning">VITE_TENANT_CODE is not set in .env, so sign-in will fail.</p>
      )}

      <p className="login-note">
        Access is invitation-only. For a locked account or password reset, contact your Platform Admin; every credential
        reset is recorded in the audit trail.
      </p>
    </form>
  );
}

function ChangePasswordForm({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    if (newPassword.length < MIN_PASSWORD_LENGTH) return setError(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
    if (newPassword !== confirm) return setError("The two new passwords don't match.");
    if (newPassword === currentPassword) return setError("Choose a password different from the current one.");
    setBusy(true);
    setError("");
    try {
      await changePassword({ currentPassword, newPassword });
      await queryClient.invalidateQueries({ queryKey: SESSION_KEY }); // reload the session (mustChangePassword → false)
      onDone();
    } catch (err) {
      const status = statusOf(err);
      setError(
        status === 400 || status === 401 || status === 422
          ? (err instanceof Error && err.message) || "The current password is incorrect, or the new one isn't allowed."
          : loginMessage(err)
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="login-form" onSubmit={submit} noValidate>
      <h1 className="login-title">Set a new password</h1>
      <p className="login-subtitle">Your account needs a new password before you continue.</p>

      <label className="login-field">
        <span>Current password</span>
        <input className="login-input" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} disabled={busy} autoFocus />
      </label>
      <label className="login-field">
        <span>New password</span>
        <input className="login-input" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNew(e.target.value)} disabled={busy} />
        <small className="login-hint">At least {MIN_PASSWORD_LENGTH} characters.</small>
      </label>
      <label className="login-field">
        <span>Confirm new password</span>
        <input className="login-input" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={busy} />
      </label>

      {error && <p className="login-error" role="alert">{error}</p>}

      <button className="login-button" type="submit" disabled={busy}>
        {busy && <span className="login-spinner" aria-hidden="true" />}
        {busy ? "Saving…" : "Save and continue"}
      </button>
    </form>
  );
}

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = useSession();
  const [step, setStep] = useState<"signin" | "password">(
    new URLSearchParams(location.search).get("step") === "password" ? "password" : "signin"
  );
  const next = afterLoginPath(location.search);

  // Nothing to sign in to in sample-data mode
  if (USE_SAMPLE_DATA) return <Navigate to="/admin" replace />;
  // Already signed in (and no password change pending): go straight in
  if (session.data && !session.data.mustChangePassword && step === "signin") return <Navigate to={next} replace />;

  return (
    <main className="login-page">
      <div className="login-layout">
        {/* Left: what the platform is */}
        <section className="login-hero" aria-label="About Sapling Global">
          <span className="login-badge"><Icon n="sparkle" s={14} /> Verification operations</span>
          <h2 className="login-hero-title">
            Sapling Global
            <span>Background verification platform</span>
          </h2>
          <ul className="login-features">
            <li>
              <span className="login-feature-icon"><Icon n="pulse" /></span>
              <span><strong>Live delivery control</strong>SLA health, throughput and exceptions in one control tower.</span>
            </li>
            <li>
              <span className="login-feature-icon"><Icon n="users" /></span>
              <span><strong>Role-scoped workspaces</strong>Admin oversight, operations execution and sales pipeline stay separate.</span>
            </li>
            <li>
              <span className="login-feature-icon"><Icon n="shield" /></span>
              <span><strong>Audit-ready access</strong>Every sign-in, grant and case action is traceable.</span>
            </li>
          </ul>
          <p className="login-hero-foot">Access is issued by the platform team. All activity is logged in IST.</p>
        </section>

        {/* Right: the sign-in card */}
        <div className="login-card">
        <div className="login-brand">
          <img className="login-logo" src={SAPLING_LOGO} alt="" />
          <div>
            <strong>Sapling Global</strong>
            <span>Platform Admin · IST</span>
          </div>
        </div>

        {step === "signin" ? (
          <SignInForm onSignedIn={(mustChange) => (mustChange ? setStep("password") : navigate(next, { replace: true }))} />
        ) : (
          <ChangePasswordForm onDone={() => navigate(next, { replace: true })} />
        )}
        </div>
      </div>
    </main>
  );
}
