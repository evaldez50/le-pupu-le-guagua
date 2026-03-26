import { _supabase } from './supabase.js';
import { launchConfetti } from './utils.js';

// ── Circular dependency with auth.js — use late binding via window ──

// Checkout para usuarios ya logueados (con client_reference_id)
export async function startCheckout() {
  if (!window.appUser.session) {
    // Fallback: si por alguna razón no hay sesión, login desde perfil
    sessionStorage.setItem('loginFromProfile', 'true');
    await window.loginWithGoogle();
    return;
  }
  const link = window.STRIPE_PAYMENT_LINK || '';
  if (!link) { alert('⚙️ Pago próximamente disponible.'); return; }
  const url = new URL(link);
  url.searchParams.set('client_reference_id', window.appUser.session.user.id);
  url.searchParams.set('prefilled_email', window.appUser.session.user.email || '');
  window.location.href = url.toString();
}

// Checkout anónimo: genera UUID local → client_reference_id en Stripe
// Permite activar pago después sin depender del email
export function startAnonymousCheckout() {
  const link = window.STRIPE_PAYMENT_LINK || '';
  if (!link) { alert('⚙️ Pago próximamente disponible.'); return; }
  const anonId = crypto.randomUUID();
  localStorage.setItem('anonymousCheckoutId', anonId);
  const url = new URL(link);
  url.searchParams.set('client_reference_id', anonId);
  window.location.href = url.toString();
}

export function showPaymentSuccessModal() {
  const m = document.getElementById('payment-success-modal');
  if (m) { m.style.display = 'flex'; if (typeof launchConfetti === 'function') launchConfetti(); }
}

export async function startPremium() {
  const btn = document.querySelector('#payment-success-modal button');
  // Si hasPaid ya está confirmado, cerrar inmediatamente sin polling
  if (window.appUser.hasPaid) {
    window.renderAuthUI();
    document.getElementById('payment-success-modal').style.display = 'none';
    return;
  }
  // Polling solo si por alguna razón hasPaid no está confirmado aún
  if (window.appUser.session) {
    if (btn) { btn.textContent = '⏳ Confirmando acceso...'; btn.disabled = true; }
    let attempts = 0;
    while (!window.appUser.hasPaid && attempts < 8) {
      await window.setUser(window.appUser.session);
      if (window.appUser.hasPaid) break;
      await new Promise(r => setTimeout(r, 1500));
      attempts++;
    }
  }
  window.appUser.hasPaid = true;
  window.renderAuthUI();
  document.getElementById('payment-success-modal').style.display = 'none';
}

// Modal que aparece después de un pago anónimo: pide crear cuenta Google
export function showPostPaymentRegistrationModal() {
  const existing = document.getElementById('post-payment-reg-modal');
  if (existing) { existing.style.display = 'flex'; return; }
  const modal = document.createElement('div');
  modal.id = 'post-payment-reg-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:10000;padding:20px;';
  modal.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:32px 28px;max-width:380px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.3);">
      <div style="font-size:3rem;margin-bottom:12px;">🎉</div>
      <h2 style="font-size:1.4rem;font-weight:800;color:#1a1a2e;margin:0 0 10px;">¡Pago completado!</h2>
      <p style="color:#64748b;font-size:.95rem;margin:0 0 24px;line-height:1.5;">
        Ahora crea tu cuenta con Google para activar tu acceso completo y guardar tu progreso.
      </p>
      <button onclick="registerAfterPayment()" style="width:100%;padding:14px;background:#4285F4;color:#fff;border:none;border-radius:12px;font-size:1rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:12px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Crear cuenta con Google
      </button>
      <p style="font-size:.8rem;color:#94a3b8;">Tu pago ya está confirmado. Solo necesitas crear la cuenta para acceder.</p>
    </div>`;
  document.body.appendChild(modal);
}

export function registerAfterPayment() {
  const modal = document.getElementById('post-payment-reg-modal');
  if (modal) modal.style.display = 'none';
  localStorage.setItem('postPaymentReg', 'true');
  window.loginWithGoogle();
}

export async function showPaywall(msg) {
  // Siempre verificar en BD si el usuario está logueado antes de mostrar el paywall
  if (window.appUser.session) {
    const { data } = await _supabase.from('user_profiles')
      .select('has_paid').eq('id', window.appUser.session.user.id).single();
    if (data?.has_paid) {
      window.appUser.hasPaid = true;
      return; // Ya pagó, no mostrar paywall
    }
  }
  const m = document.getElementById('paywall-modal');
  if (m) {
    document.getElementById('paywall-msg').textContent = msg || '¡Desbloquea el acceso completo!';
    const btn = document.getElementById('paywall-buy-btn');
    const loginLink = document.getElementById('paywall-login-link');
    if (btn) {
      const loggedIn = window.appUser && window.appUser.session;
      const hasPaid  = window.appUser && window.appUser.hasPaid;
      if (loggedIn && !hasPaid) {
        // ESCENARIO 2: Logueado sin pago → completar pago con su cuenta
        btn.textContent = '💳 Completar pago — $29.99 USD';
        btn.onclick = function() {
          document.getElementById('paywall-modal').style.display = 'none';
          startCheckout();
        };
        if (loginLink) loginLink.style.display = 'none';
      } else if (!loggedIn) {
        // ESCENARIO 1: Sin cuenta → ir directo a Stripe, registrar después
        btn.textContent = '💳 Comprar acceso completo — $29.99 USD';
        btn.onclick = function() {
          document.getElementById('paywall-modal').style.display = 'none';
          startAnonymousCheckout();
        };
        if (loginLink) loginLink.style.display = '';
      }
    }
    m.style.display = 'flex';
  } else {
    alert('🔒 ' + (msg || 'Esta función requiere una cuenta de pago. Precio: $29.99 USD (pago único)'));
  }
}

export function loginToExistingAccount() {
  document.getElementById('paywall-modal').style.display = 'none';
  sessionStorage.setItem('loginFromProfile', 'true');
  window.loginWithGoogle();
}
