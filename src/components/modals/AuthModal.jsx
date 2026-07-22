import { useEffect, useRef, useState } from 'react'
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
import PasswordStrength from '../ui/PasswordStrength'
import Spinner from '../ui/Spinner'
import PrimaryBtn, { Divider, SocialBtns, SuccessState } from '../auth/AuthFormParts'
import { isValidEmail } from '../../utils/validation'
import { requestLoginOtp } from '../../services/auth'

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState('login')

  const [lEmail, setLEmail] = useState('')
  const [lPass, setLPass] = useState('')
  const [lPassShow, setLPassShow] = useState(false)
  const [lErrors, setLErrors] = useState({})
  const [lLoading, setLLoading] = useState(false)
  const [lDone, setLDone] = useState(false)

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
      setLDone(true)
      setTimeout(onClose, 1500)
    } catch (error) {
      setLErrors({
        email: error instanceof Error ? error.message : 'Failed to send OTP. Please try again.',
      })
    } finally {
      setLLoading(false)
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
        background: 'rgba(8,18,40,0.6)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <div
        className="relative w-full max-w-[420px] bg-white rounded-[24px] shadow-2xl overflow-hidden"
        style={{ animation: 'modalPop 0.3s cubic-bezier(0.34,1.5,0.64,1) both' }}
      >
        <div
          className="h-1"
          style={{ background: 'linear-gradient(90deg,#0057B8,#00A0FF,#00A651)' }}
        />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 transition-colors"
        >
          <X size={15} />
        </button>

        <div className="flex items-center justify-center gap-2 pt-7 pb-1">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#0057B8,#0090FF)' }}
          >
            <Activity size={14} className="text-white" strokeWidth={2.5} />
          </div>
          <span
            className="text-lg font-black tracking-tight"
            style={{ color: '#0057B8', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            MEDIQ
          </span>
        </div>

        {mode === 'login' && (
          <div className="px-7 pt-5 pb-7" style={{ animation: 'slideIn 0.22s ease both' }}>
            {lDone ? (
              <SuccessState title="OTP sent!" sub="Check your email for the verification code." />
            ) : (
              <form onSubmit={submitLogin} noValidate>
                <div className="text-center mb-6">
                  <h2
                    className="text-2xl font-black text-slate-900"
                    style={{ letterSpacing: '-0.025em' }}
                  >
                    Welcome Back 👋
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">Sign in to your MEDIQ account</p>
                </div>
                <div className="space-y-3.5">
                  <Field
                    label="Email"
                    icon={Mail}
                    type="email"
                    value={lEmail}
                    onChange={setLEmail}
                    placeholder="you@example.com"
                    error={lErrors.email}
                    autoComplete="email"
                  />
                  {/* <Field
                    label="Password"
                    icon={Lock}
                    type={lPassShow ? 'text' : 'password'}
                    value={lPass}
                    onChange={setLPass}
                    placeholder="Your password"
                    error={lErrors.pass}
                    autoComplete="current-password"
                  >
                    <button
                      type="button"
                      onClick={() => setLPassShow(!lPassShow)}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {lPassShow ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </Field> */}
                </div>
                {/* <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div> */}
                <PrimaryBtn loading={lLoading} label="Send OTP" />
                {/* <Divider />
                <SocialBtns /> */}
                {/* <p className="text-center text-sm text-slate-500 mt-5">
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="font-bold text-blue-600 hover:underline"
                  >
                    Sign Up
                  </button>
                </p> */}
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
                    className="text-2xl font-black text-slate-900"
                    style={{ letterSpacing: '-0.025em' }}
                  >
                    Create Account ✨
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
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
                <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
                  By signing up you agree to MEDIQ&apos;s{' '}
                  <span className="text-blue-600 font-semibold cursor-pointer hover:underline">
                    Terms
                  </span>{' '}
                  &amp;{' '}
                  <span className="text-blue-600 font-semibold cursor-pointer hover:underline">
                    Privacy Policy
                  </span>
                  .
                </p>
                <PrimaryBtn loading={sLoading} label="Create Account" green />
                <p className="text-center text-sm text-slate-500 mt-5">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="font-bold text-blue-600 hover:underline"
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
                  className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center"
                  style={{ animation: 'popIn 0.35s cubic-bezier(0.34,1.5,0.64,1)' }}
                >
                  <Mail size={26} className="text-blue-600" />
                </div>
                <div>
                  <div className="text-lg font-black text-slate-800">Check your inbox 📬</div>
                  <div className="text-sm text-slate-400 mt-1">
                    Reset link sent to{' '}
                    <span className="font-semibold text-slate-600">{fEmail}</span>
                  </div>
                </div>
                <button
                  onClick={() => setMode('login')}
                  className="text-sm font-bold text-blue-600 hover:underline"
                >
                  ← Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={submitForgot} noValidate>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-600 mb-4 transition-colors"
                >
                  <ChevronLeft size={13} />
                  Back to Login
                </button>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Lock size={22} className="text-blue-600" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900">Forgot Password?</h2>
                  <p className="text-sm text-slate-400 mt-1">
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
                  className="mt-5 w-full py-3.5 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#0057B8,#0090FF)' }}
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
