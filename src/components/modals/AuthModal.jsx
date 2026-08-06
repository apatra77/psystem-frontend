import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  ChevronLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  UserCircle,
  X,
} from 'lucide-react'
import Field from '../ui/Field'
import OtpInput from '../ui/OtpInput'
import PasswordStrength from '../ui/PasswordStrength'
import Spinner from '../ui/Spinner'
import PrimaryBtn, { SuccessState, AuthTermsNotice } from '../auth/AuthFormParts'
import { isValidEmail } from '../../utils/validation'
import { requestLoginOtp, verifyLoginOtp, saveAuthSession, getPostLoginPath } from '../../services/auth'
import { colors } from '../../theme/colors'

const RESEND_SECONDS = 30

export default function AuthModal({ onClose }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')

  const [lEmail, setLEmail] = useState('')
  const [lErrors, setLErrors] = useState({})
  const [lLoading, setLLoading] = useState(false)

  const [otp, setOtp] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [otpDone, setOtpDone] = useState(false)
  const [resendSeconds, setResendSeconds] = useState(0)
  const [resendLoading, setResendLoading] = useState(false)

  const [sName, setSName] = useState('')
  const [sEmail, setSEmail] = useState('')
  const [sPass, setSPass] = useState('')
  const [sConfirm, setSConfirm] = useState('')
  const [sPassShow, setSPassShow] = useState(false)
  const [sCShow, setSCShow] = useState(false)
  const [sErrors, setSErrors] = useState({})
  const [sLoading, setSLoading] = useState(false)
  const [sDone, setSDone] = useState(false)

  const [fEmail, setFEmail] = useState('')
  const [fLoading, setFLoading] = useState(false)
  const [fDone, setFDone] = useState(false)

  const overlayRef = useRef(null)

  useEffect(() => {
    const fn = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', fn)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', fn)
      document.body.style.overflow = ''
    }
  }, [onClose])

  useEffect(() => {
    if (resendSeconds <= 0) return
    const timer = setInterval(() => {
      setResendSeconds((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendSeconds])

  const goToOtpStep = () => {
    setMode('otp')
    setOtp('')
    setOtpError('')
    setOtpDone(false)
    setResendSeconds(RESEND_SECONDS)
  }

  const backToLogin = () => {
    setMode('login')
    setOtp('')
    setOtpError('')
    setResendSeconds(0)
  }

  const submitLogin = async (e) => {
    e.preventDefault()
    const err = {}
    if (!lEmail) err.email = 'Email is required'
    else if (!isValidEmail(lEmail)) err.email = 'Enter a valid email'
    setLErrors(err)
    if (Object.keys(err).length) return

    setLLoading(true)
    setLErrors({})
    try {
      await requestLoginOtp(lEmail.trim())
      goToOtpStep()
    } catch (error) {
      setLErrors({
        email: error instanceof Error ? error.message : 'Failed to send OTP. Please try again.',
      })
    } finally {
      setLLoading(false)
    }
  }

  const submitOtp = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) {
      setOtpError('Please enter the 6-digit OTP')
      return
    }

    setOtpLoading(true)
    setOtpError('')
    try {
      const data = await verifyLoginOtp(lEmail.trim(), otp)
      const user = saveAuthSession(data, lEmail.trim())
      onClose()
      navigate(getPostLoginPath(user))
    } catch (error) {
      setOtpError(
        error instanceof Error ? error.message : 'Invalid OTP. Please try again.',
      )
    } finally {
      setOtpLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendSeconds > 0 || resendLoading) return
    setResendLoading(true)
    setOtpError('')
    try {
      await requestLoginOtp(lEmail.trim())
      setOtp('')
      setResendSeconds(RESEND_SECONDS)
    } catch (error) {
      setOtpError(
        error instanceof Error ? error.message : 'Failed to resend OTP. Please try again.',
      )
    } finally {
      setResendLoading(false)
    }
  }

  const submitSignup = (e) => {
    e.preventDefault()
    const err = {}
    if (!sName.trim()) err.name = 'Full name is required'
    if (!sEmail) err.email = 'Email is required'
    else if (!isValidEmail(sEmail)) err.email = 'Enter a valid email'
    if (!sPass) err.pass = 'Password is required'
    else if (sPass.length < 8) err.pass = 'At least 8 characters'
    if (!sConfirm) err.confirm = 'Please confirm your password'
    else if (sConfirm !== sPass) err.confirm = 'Passwords do not match'
    setSErrors(err)
    if (Object.keys(err).length) return
    setSLoading(true)
    setTimeout(() => {
      setSLoading(false)
      setSDone(true)
      setTimeout(onClose, 1500)
    }, 1800)
  }

  const submitForgot = (e) => {
    e.preventDefault()
    if (!isValidEmail(fEmail)) return
    setFLoading(true)
    setTimeout(() => {
      setFLoading(false)
      setFDone(true)
    }, 1600)
  }

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(5,15,12,0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <div
        className="relative w-full max-w-[420px] rounded-[24px] shadow-2xl overflow-hidden"
        style={{
          animation: 'modalPop 0.3s cubic-bezier(0.34,1.5,0.64,1) both',
          background: colors.bgElevated,
          border: `1px solid ${colors.borderStrong}`,
        }}
      >
        <div className="h-1" style={{ background: colors.primaryBtn }} />

        <div
          className="flex items-center justify-between px-5 pt-4 pb-2"
          style={{ borderBottom: `1px solid rgba(64,222,170,0.2)` }}
        >
          {mode === 'otp' ? (
            <button
              type="button"
              onClick={backToLogin}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{
                background: 'rgba(255,255,255,0.08)',
                color: colors.textSecondary,
              }}
              aria-label="Back"
            >
              <ChevronLeft size={16} />
            </button>
          ) : (
            <div className="w-8" />
          )}

          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{ background: colors.primaryBtn }}
            >
              <Activity size={14} className="text-[#04140f]" strokeWidth={2.5} />
            </div>
            <span
              className="text-lg font-black tracking-tight text-white"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              MEDIQ
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: colors.textSecondary,
            }}
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {mode === 'login' && (
          <div className="px-7 pt-5 pb-7" style={{ animation: 'slideIn 0.22s ease both' }}>
            <form onSubmit={submitLogin} noValidate>
              <div className="mb-6">
                <h2
                  className="text-2xl font-black text-white"
                  style={{ letterSpacing: '-0.025em' }}
                >
                  Sign in to MEDIQ
                </h2>
                <p className="text-sm mt-2 leading-relaxed" style={{ color: colors.textSecondary }}>
                  Enter your email or mobile number to receive a one-time password.
                </p>
              </div>
              <div className="space-y-3.5">
                <Field
                  label="Email or mobile"
                  icon={Mail}
                  type="text"
                  value={lEmail}
                  onChange={setLEmail}
                  placeholder="you@example.com or 9XXXXXXXXX"
                  error={lErrors.email}
                  autoComplete="username"
                />
              </div>
              <PrimaryBtn loading={lLoading} label="Send OTP" />
              <AuthTermsNotice />
            </form>
          </div>
        )}

        {mode === 'otp' && (
          <div className="px-7 pt-6 pb-7" style={{ animation: 'slideIn 0.22s ease both' }}>
            {otpDone ? (
              <SuccessState title="Verified!" sub="Opening your portal…" green />
            ) : (
              <form onSubmit={submitOtp} noValidate>
                <div className="mb-6">
                  <h2
                    className="text-2xl font-black text-white mb-2"
                    style={{ letterSpacing: '-0.025em' }}
                  >
                    Verify your identity
                  </h2>
                  <p className="text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
                    We sent a 6-digit OTP to{' '}
                    <span className="font-semibold" style={{ color: colors.accent }}>
                      {lEmail.trim()}
                    </span>
                  </p>
                </div>

                <label
                  className="block text-xs font-bold uppercase tracking-wider mb-3"
                  style={{ color: colors.textDim }}
                >
                  Enter OTP
                </label>
                <OtpInput value={otp} onChange={setOtp} error={otpError} />

                <button
                  type="submit"
                  disabled={otpLoading || otp.length !== 6}
                  className="mt-6 w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: colors.primaryBtn,
                    color: colors.accentText,
                    boxShadow:
                      otp.length === 6 ? '0 8px 24px rgba(64,222,170,0.35)' : 'none',
                  }}
                >
                  {otpLoading ? (
                    <>
                      <Spinner />
                      Verifying…
                    </>
                  ) : (
                    <>
                      Verify &amp; Continue
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>

                <p className="text-center text-sm mt-5" style={{ color: colors.textSecondary }}>
                  Didn&apos;t receive it?{' '}
                  {resendSeconds > 0 ? (
                    <span className="font-semibold" style={{ color: colors.accent }}>
                      Resend in {resendSeconds}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendLoading}
                      className="font-bold hover:underline disabled:opacity-60"
                      style={{ color: colors.accent }}
                    >
                      {resendLoading ? 'Sending…' : 'Resend OTP'}
                    </button>
                  )}
                </p>
              </form>
            )}
          </div>
        )}

        {mode === 'signup' && (
          <div className="px-7 pt-5 pb-7" style={{ animation: 'slideIn 0.22s ease both' }}>
            {sDone ? (
              <SuccessState title="Account created! 🎉" sub="Welcome to MEDIQ. Redirecting…" />
            ) : (
              <form onSubmit={submitSignup} noValidate>
                <div className="text-center mb-5">
                  <h2
                    className="text-2xl font-black text-white"
                    style={{ letterSpacing: '-0.025em' }}
                  >
                    Create Account ✨
                  </h2>
                  <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                    Join millions on MEDIQ — it&apos;s free
                  </p>
                </div>
                <div className="space-y-3">
                  <Field
                    label="Full Name"
                    icon={UserCircle}
                    value={sName}
                    onChange={setSName}
                    placeholder="Rahul Sharma"
                    error={sErrors.name}
                    autoComplete="name"
                  />
                  <Field
                    label="Email"
                    icon={Mail}
                    type="email"
                    value={sEmail}
                    onChange={setSEmail}
                    placeholder="you@example.com"
                    error={sErrors.email}
                    autoComplete="email"
                  />
                  <div>
                    <Field
                      label="Password"
                      icon={Lock}
                      type={sPassShow ? 'text' : 'password'}
                      value={sPass}
                      onChange={setSPass}
                      placeholder="Min. 8 characters"
                      error={sErrors.pass}
                      autoComplete="new-password"
                    >
                      <button
                        type="button"
                        onClick={() => setSPassShow(!sPassShow)}
                        className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {sPassShow ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </Field>
                    <PasswordStrength password={sPass} />
                  </div>
                  <Field
                    label="Confirm Password"
                    icon={Lock}
                    type={sCShow ? 'text' : 'password'}
                    value={sConfirm}
                    onChange={setSConfirm}
                    placeholder="Re-enter password"
                    error={sErrors.confirm}
                    autoComplete="new-password"
                  >
                    <button
                      type="button"
                      onClick={() => setSCShow(!sCShow)}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {sCShow ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </Field>
                </div>
                <p className="text-[11px] mt-2.5 leading-relaxed" style={{ color: colors.textDim }}>
                  By signing up you agree to MEDIQ&apos;s{' '}
                  <span className="font-semibold cursor-pointer hover:underline" style={{ color: colors.accent }}>
                    Terms
                  </span>{' '}
                  &amp;{' '}
                  <span className="font-semibold cursor-pointer hover:underline" style={{ color: colors.accent }}>
                    Privacy Policy
                  </span>
                  .
                </p>
                <PrimaryBtn loading={sLoading} label="Create Account" green />
                <p className="text-center text-sm mt-5" style={{ color: colors.textSecondary }}>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="font-bold hover:underline"
                    style={{ color: colors.accent }}
                  >
                    Login
                  </button>
                </p>
              </form>
            )}
          </div>
        )}

        {mode === 'forgot' && (
          <div className="px-7 pt-5 pb-7" style={{ animation: 'slideIn 0.22s ease both' }}>
            {fDone ? (
              <div className="flex flex-col items-center py-8 gap-4 text-center">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    animation: 'popIn 0.35s cubic-bezier(0.34,1.5,0.64,1)',
                    background: 'rgba(64,222,170,0.15)',
                  }}
                >
                  <Mail size={26} className="text-[#40deaa]" />
                </div>
                <div>
                  <div className="text-lg font-black text-white">Check your inbox 📬</div>
                  <div className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                    Reset link sent to{' '}
                    <span className="font-semibold text-white">{fEmail}</span>
                  </div>
                </div>
                <button
                  onClick={() => setMode('login')}
                  className="text-sm font-bold hover:underline"
                  style={{ color: colors.accent }}
                >
                  ← Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={submitForgot} noValidate>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="flex items-center gap-1 text-xs font-semibold mb-4 transition-colors"
                  style={{ color: colors.textDim }}
                >
                  <ChevronLeft size={13} />
                  Back to Login
                </button>
                <div className="text-center mb-6">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: 'rgba(64,222,170,0.15)' }}
                  >
                    <Lock size={22} className="text-[#40deaa]" />
                  </div>
                  <h2 className="text-xl font-black text-white">Forgot Password?</h2>
                  <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                    Enter your email to receive a reset link
                  </p>
                </div>
                <Field
                  label="Email"
                  icon={Mail}
                  type="email"
                  value={fEmail}
                  onChange={setFEmail}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                <button
                  type="submit"
                  disabled={fLoading || !fEmail}
                  className="mt-5 w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ background: colors.primaryBtn, color: colors.accentText }}
                >
                  {fLoading ? (
                    <>
                      <Spinner />
                      Sending…
                    </>
                  ) : (
                    <>
                      Send Reset Link <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
