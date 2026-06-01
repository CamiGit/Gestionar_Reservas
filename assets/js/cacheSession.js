// Token → localStorage (solo el token)
// Perfil de usuario → Cache API del navegador

(function () {
    const TOKEN_KEY   = 'sf-token';
    const CACHE_NAME  = 'sf-session-v1';
    const PROFILE_KEY = '/sf/profile';

    const sfSession = {
        // ── Token (síncrono) ────────────────────────────────────────────────
        getToken() {
            return localStorage.getItem(TOKEN_KEY) ?? null;
        },

        // ── Perfil (asíncrono, Cache API) ───────────────────────────────────
        async getProfile() {
            if (!('caches' in window)) return null;
            const cache = await caches.open(CACHE_NAME);
            const res   = await cache.match(PROFILE_KEY);
            if (!res) return null;
            return res.json().catch(() => null);
        },

        async setProfile(perfil) {
            if (!('caches' in window)) return;
            const cache = await caches.open(CACHE_NAME);
            await cache.put(PROFILE_KEY, new Response(JSON.stringify(perfil), {
                headers: { 'Content-Type': 'application/json' },
            }));
        },

        // ── Sesión completa ─────────────────────────────────────────────────
        async setSession(token, perfil) {
            localStorage.setItem(TOKEN_KEY, token);
            await this.setProfile(perfil);
        },

        async clear() {
            localStorage.removeItem(TOKEN_KEY);
            if (!('caches' in window)) return;
            const cache = await caches.open(CACHE_NAME);
            await cache.delete(PROFILE_KEY);
        },
    };

    // Migración automática desde el formato anterior ('usuarioLogueado' en localStorage)
    (async function migrar() {
        const legacy = localStorage.getItem('usuarioLogueado');
        if (!legacy) return;
        try {
            const obj   = JSON.parse(legacy);
            const token = obj?.token ?? obj?.accessToken ?? null;
            if (!token) { localStorage.removeItem('usuarioLogueado'); return; }
            const { token: _t, accessToken: _a, ...perfil } = obj;
            await sfSession.setSession(token, perfil);
        } catch { /* noop */ }
        finally { localStorage.removeItem('usuarioLogueado'); }
    })();

    window.sfSession = sfSession;
})();
