import { _supabase } from './supabase.js';
import { showToast } from './utils.js';
import { STRIPE_PAYMENT_LINK } from './config.js';

// ── Circular dependency with payment.js — use late binding via window ──

// Detectar retorno desde Stripe
(function() {
  const p = new URLSearchParams(window.location.search);
  if (p.get('payment') === 'success') {
    const sid = p.get('sid') || null; // {CHECKOUT_SESSION_ID} configurado en Stripe
    window._stripeSessionId = sid;
    if (sid) localStorage.setItem('stripeSessionId', sid); // persiste para sobrevivir OAuth redirect
    history.replaceState({}, '', window.location.pathname + window.location.hash);
    window._pendingPaymentSuccess = true;
  }
  if (p.get('payment') === 'cancelled') {
    history.replaceState({}, '', window.location.pathname + window.location.hash);
    window._paymentCancelled = true;
  }
})();

// Also set STRIPE_PAYMENT_LINK on window for payment.js late binding
window.STRIPE_PAYMENT_LINK = STRIPE_PAYMENT_LINK;

export async function initAuth() {
  console.log('[Auth] initAuth start');

  _supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('[Auth] EVENT:', event, '|', session?.user?.email || 'sin sesión');

    // Bloqueo de cuenta no registrada: si _forceSignOut está activo,
    // rechazar cualquier SIGNED_IN hasta que el signOut complete
    if (window._forceSignOut) {
      if (event === 'SIGNED_IN' || (event === 'INITIAL_SESSION' && session)) {
        await _supabase.auth.signOut();
        return;
      }
      if (event === 'SIGNED_OUT') {
        window._forceSignOut = false;
        showToast('⚠️ Esta cuenta de Google no está registrada. Primero compra tu acceso.', 7000);
        window.appUser.session = null;
        window.appUser.profile = null;
        window.appUser.hasPaid = false;
        renderAuthUI();
      }
      return;
    }

    // Si viene de "Ya tienes cuenta", NO renderizar sesión aún — evita flash de login
    const _isLoginFromProfile = sessionStorage.getItem('loginFromProfile') === 'true';

    window.appUser.session = session;
    if (!session) { window.appUser.profile = null; window.appUser.hasPaid = false; }
    if (!_isLoginFromProfile) renderAuthUI();

    // Cargar datos del perfil (hasPaid, etc.)
    await setUser(session);
    if (!_isLoginFromProfile) renderAuthUI();

    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
      if (session) {
        const freshLogin = sessionStorage.getItem('oauthStarted') === 'true';
        sessionStorage.removeItem('oauthStarted');

        // ESCENARIO 2 (post-pago anónimo): Registró cuenta después de pagar
        // Si llegó aquí es porque acaba de pagar — activar has_paid directamente
        const postPaymentReg = localStorage.getItem('postPaymentReg') === 'true';
        if (postPaymentReg) {
          localStorage.removeItem('postPaymentReg');
          localStorage.removeItem('anonymousCheckoutId');
          localStorage.removeItem('stripeSessionId');
          sessionStorage.removeItem('loginFromProfile');
          // Activar premium directamente — el pago ya fue verificado por el webhook
          const { error: payErr } = await _supabase
            .from('user_profiles')
            .update({ has_paid: true })
            .eq('id', session.user.id);
          if (payErr) console.error('[Auth] Error activando has_paid:', payErr.message);
          window.appUser.hasPaid = true;
          renderAuthUI();
          window.showPaymentSuccessModal();
          return;
        }

        // ESCENARIO 3: Login desde perfil (botón "Ya tienes cuenta")
        // Limpiar flag aunque freshLogin sea false para evitar flags huérfanos
        const loginFromProfile = sessionStorage.getItem('loginFromProfile') === 'true';
        if (loginFromProfile) {
          sessionStorage.removeItem('loginFromProfile');
          if (!window.appUser.hasPaid) {
            // Sin acceso premium (usuario nuevo o existente sin pago) → bloquear
            // El trigger de DB ya crea el perfil, así que isNewUser siempre es false.
            // La única distinción válida es has_paid.
            window._forceSignOut = true;
            window.appUser.session = null;
            window.appUser.hasPaid = false;
            renderAuthUI();
            await _supabase.auth.signOut();
          } else {
            // Ya pagó → bienvenida premium
            showToast('¡Bienvenido de vuelta! Tienes acceso Premium completo ⭐', 5000);
            renderAuthUI();
          }
          return;
        }

        // Flujo legacy (pendingCheckout)
        if (freshLogin && sessionStorage.getItem('pendingCheckout') === 'true') {
          sessionStorage.removeItem('pendingCheckout');
          setTimeout(() => window.startCheckout(), 300);
        }
      }
    }

    if (event === 'SIGNED_OUT') {
      console.log('[Auth] SIGNED_OUT');
    }
  });

  const { data: { session }, error } = await _supabase.auth.getSession();
  if (error) console.warn('[Auth] getSession ERROR:', error.message);
  console.log('[Auth] getSession result:', session?.user?.email || 'sin sesión');

  if (session && !window.appUser.session) {
    await setUser(session);
    renderAuthUI();
  } else if (!session && !window.appUser.session) {
    renderAuthUI();
  }

  // Retorno de Stripe con sesión activa (pagó estando logueado)
  if (window._pendingPaymentSuccess && window.appUser.session) {
    window._pendingPaymentSuccess = false;
    await setUser(window.appUser.session);
    renderAuthUI();
    window.showPaymentSuccessModal();
    // Polling: webhook puede tardar 2-5s
    if (!window.appUser.hasPaid) {
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        await setUser(window.appUser.session);
        renderAuthUI();
        if (window.appUser.hasPaid || attempts >= 6) clearInterval(poll);
      }, 2000);
    }
    return;
  }

  // Retorno de Stripe SIN sesión (pago anónimo) → pedir registro con Google
  if (window._pendingPaymentSuccess && !window.appUser.session) {
    window._pendingPaymentSuccess = false;
    window.showPostPaymentRegistrationModal();
    return;
  }

  if (window._paymentCancelled) {
    window._paymentCancelled = false;
    if (window.appUser.session && !window.appUser.hasPaid) {
      _supabase.auth.signOut().catch(() => {});
      window.appUser = { session: null, profile: null, hasPaid: false };
      renderAuthUI();
    }
    showToast('Pago cancelado. Puedes intentarlo cuando quieras.');
  }
}

// Activa el acceso premium revisando pending_activations
// Orden de búsqueda: anonymousCheckoutId > stripe_session_id > email
export async function activatePendingPayment(email) {
  try {
    const u = window.appUser.session.user;
    const anonId = localStorage.getItem('anonymousCheckoutId');
    const sessionId = localStorage.getItem('stripeSessionId');

    async function tryActivate() {
      // 1) Por UUID anónimo generado antes del pago (más confiable, email-agnóstico)
      if (anonId) {
        const { data } = await _supabase
          .from('pending_activations')
          .select('anonymous_checkout_id')
          .eq('anonymous_checkout_id', anonId)
          .maybeSingle();
        if (data) { console.log('[Auth] match por anonymousCheckoutId'); return data; }
      }
      // 2) Por stripe_session_id (si Stripe redirect URL tiene {CHECKOUT_SESSION_ID})
      if (sessionId) {
        const { data } = await _supabase
          .from('pending_activations')
          .select('stripe_session_id')
          .eq('stripe_session_id', sessionId)
          .maybeSingle();
        if (data) { console.log('[Auth] match por stripe_session_id'); return data; }
      }
      // 3) Fallback por email
      if (email) {
        const { data } = await _supabase
          .from('pending_activations')
          .select('email')
          .eq('email', email)
          .maybeSingle();
        if (data) { console.log('[Auth] match por email'); return data; }
      }
      return null;
    }

    const activate = async () => {
      await _supabase.from('user_profiles').update({ has_paid: true }).eq('id', u.id);
      window.appUser.hasPaid = true;
      localStorage.removeItem('anonymousCheckoutId');
      localStorage.removeItem('stripeSessionId');
    };

    let data = await tryActivate();

    if (data) {
      await activate();
      console.log('[Auth] ✅ Pago activado');
    } else {
      // Webhook puede no haber llegado aún → polling
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        const d2 = await tryActivate();
        if (d2) {
          clearInterval(poll);
          await activate();
          renderAuthUI();
          console.log('[Auth] ✅ Pago activado tras polling');
        } else if (attempts >= 8) {
          clearInterval(poll);
          console.warn('[Auth] ⚠️ No se encontró pago. anonId:', anonId, 'sessionId:', sessionId, 'email:', email);
          showToast('Cuenta creada. Si ya pagaste, el acceso se activará en breve.');
        }
      }, 2000);
    }
  } catch (e) {
    console.error('[Auth] activatePendingPayment error:', e.message);
  }
}

export async function setUser(session) {
  window.appUser.session = session;
  if (session) {
    try {
      const u = session.user;
      // SOLO leer — nunca hacer upsert/update aquí para no corromper has_paid
      // El trigger de DB crea el perfil en el primer registro
      const { data, error } = await _supabase
        .from('user_profiles')
        .select('has_paid, full_name, avatar_url')
        .eq('id', u.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('[Auth] user_profiles query error:', error.message);
      }

      if (!data) {
        // Perfil no existe → usuario nuevo (no se había registrado antes)
        await _supabase.from('user_profiles').insert({
          id: u.id,
          email: u.email || null,
          full_name: u.user_metadata?.full_name || u.user_metadata?.name || null,
          avatar_url: u.user_metadata?.avatar_url || u.user_metadata?.picture || null,
        });
        window.appUser.profile = null;
        window.appUser.hasPaid = false;
        window.appUser.isNewUser = true;
      } else {
        window.appUser.profile = data;
        window.appUser.hasPaid = data.has_paid === true;
        window.appUser.isNewUser = false;
      }
      console.log('[Auth] setUser hasPaid:', window.appUser.hasPaid, '| isNewUser:', window.appUser.isNewUser, '| DB has_paid:', data?.has_paid);
    } catch (e) {
      console.error('[Auth] setUser error:', e.message);
      window.appUser.profile = null;
      window.appUser.hasPaid = false;
    }
  } else {
    window.appUser.profile = null;
    window.appUser.hasPaid = false;
  }
}

export async function loginWithGoogle() {
  sessionStorage.setItem('oauthStarted', 'true');
  const redirectTo = window.location.origin + window.location.pathname;
  const { error } = await _supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: { prompt: 'select_account' }
    }
  });
  if (error) {
    console.error('[Auth] loginWithGoogle error:', error.message);
    sessionStorage.removeItem('oauthStarted');
  }
}

// Login desde el ícono de perfil — ESCENARIOS 2 y 3
// Marca loginFromProfile para que initAuth sepa que si no ha pagado, debe ir al pago
export function loginFromProfileIcon() {
  // Según escenario 1 del doc: mostrar paywall con 3 opciones, no ir directo a Google
  window.showPaywall('Inicia sesión o crea tu cuenta para acceder a todas las funciones.');
}

export async function logout() {
  closeProfileMenu();
  // Limpiar estado local PRIMERO — UI cambia de inmediato sin esperar Supabase
  window.appUser = { session: null, profile: null, hasPaid: false };
  renderAuthUI();
  // Cerrar sesión en Supabase
  try {
    const { error } = await _supabase.auth.signOut({ scope: 'local' });
    if (error) console.error('[Auth] signOut error:', error.message);
    else console.log('[Auth] signOut OK');
  } catch(e) {
    console.error('[Auth] signOut exception:', e.message);
  }
  // Limpiar manualmente localStorage de Supabase por si signOut no lo hizo
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sb-') || key.startsWith('supabase.auth.')) {
      localStorage.removeItem(key);
    }
  });
}

export function renderAuthUI() {
  const container = document.getElementById('auth-ui-global') || document.getElementById('auth-ui');
  if (!container) return;

  if (window.appUser.session) {
    const user = window.appUser.session.user;
    const meta = user.user_metadata || {};
    const name = meta.full_name || meta.name || user.email?.split('@')[0] || 'Usuario';
    const firstName = name.split(' ')[0];
    const email = user.email || '';
    const avatar = meta.avatar_url || meta.picture || '';
    const hasPaid = window.appUser.hasPaid;
    const initials = name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();

    container.innerHTML = `
      <div style="position:relative;">
        <button class="auth-avatar-btn" onclick="toggleProfileMenu(event)" aria-expanded="false" aria-haspopup="true">
          ${avatar
            ? `<img class="auth-avatar-img" src="${avatar}" alt="${name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
               <div style="display:none;width:34px;height:34px;border-radius:50%;background:#4285F4;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:.85rem;">${initials}</div>`
            : `<div style="width:34px;height:34px;border-radius:50%;background:#4285F4;display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:.85rem;">${initials}</div>`
          }
          <span class="auth-avatar-name">${firstName}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        <div class="profile-menu" id="profile-menu" style="display:none;" role="menu">
          <div class="profile-menu-header">
            ${avatar
              ? `<img class="profile-menu-avatar" src="${avatar}" alt="${name}" onerror="this.outerHTML='<div class=profile-menu-avatar-fallback>${initials}</div>'">`
              : `<div class="profile-menu-avatar-fallback">${initials}</div>`
            }
            <div style="min-width:0;">
              <div class="profile-menu-name">${name}</div>
              <div class="profile-menu-email">${email}</div>
              ${hasPaid
                ? `<span class="plan-badge premium">⭐ Premium</span>`
                : `<span class="plan-badge free">🆓 Plan gratuito</span>`
              }
            </div>
          </div>
          <div class="profile-menu-body">
            <button class="profile-menu-item" onclick="showScreen('history');closeProfileMenu()" role="menuitem">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              Mi progreso
            </button>
            ${!hasPaid ? `
            <button class="profile-menu-item" onclick="startCheckout();closeProfileMenu()" role="menuitem" style="color:#16A34A;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
              Actualizar a Premium
            </button>` : ''}
            <div class="profile-menu-divider"></div>
            <button class="profile-menu-item danger" onclick="logout()" role="menuitem">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>`;
  } else {
    // Usuario no logueado: ícono de perfil → login desde perfil (Escenarios 2 y 3)
    container.innerHTML = `
      <button class="auth-login-icon" onclick="loginFromProfileIcon()" title="Iniciar sesión" aria-label="Iniciar sesión">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      </button>`;
  }
}

export function toggleProfileMenu(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('profile-menu');
  if (!menu) return;
  const isOpen = menu.style.display !== 'none';
  if (isOpen) { closeProfileMenu(); } else { menu.style.display = 'block'; }
}

export function closeProfileMenu() {
  const menu = document.getElementById('profile-menu');
  if (menu) menu.style.display = 'none';
}

// Cerrar dropdown al hacer clic fuera
document.addEventListener('click', function(e) {
  if (!e.target.closest('#auth-ui-global') && !e.target.closest('#auth-ui')) closeProfileMenu();
});

// Verifica si el usuario puede acceder a contenido premium
// nivel: 'A1'|'A2'|'B1'|'B2'|'C1'|'C2', topicIndex: número 0-based dentro del nivel
export function canAccessTopic(nivel, topicIndex) {
  if (window.appUser.hasPaid) return true;
  if (nivel === 'A1') return true;          // A1 gratis completo
  return topicIndex < 3;                    // Solo 3 temas por nivel gratis
}

// Verifica si puede usar el conjugador para un grupo de verbo
// grupo: string como 'groupe1', 'groupe2', 'groupe3', 'ir_irreg', etc.
export function canAccessVerbGroup(grupo) {
  if (window.appUser.hasPaid) return true;
  return grupo === 'groupe1';               // Solo -ER gratis
}
