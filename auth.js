/**
 * HQ Dashboard Password Protection
 * Password: Sherlock
 */
(function() {
    'use strict';
    
    const PASSWORD_HASH = '68a383f3113e48e26ab2a6ad98a22a8a309d62c98c58c38fc3a5c149c5ad5e3e';
    const SESSION_KEY = 'hq_auth';
    
    async function sha256(str) {
        const buf = new TextEncoder().encode(str);
        const hash = await crypto.subtle.digest('SHA-256', buf);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    window.HQAuth = {
        async check(password) {
            return await sha256(password) === PASSWORD_HASH;
        },
        isLoggedIn() {
            try {
                return sessionStorage.getItem(SESSION_KEY) === 'true';
            } catch(e) { return false; }
        },
        login() { sessionStorage.setItem(SESSION_KEY, 'true'); },
        logout() { sessionStorage.removeItem(SESSION_KEY); }
    };
    
    // Show login if not authenticated
    if (!window.HQAuth.isLoggedIn() && !document.getElementById('loginForm')) {
        document.body.innerHTML = `
            <div id="loginForm" style="background:#0f0f1a;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;">
                <div style="background:#1a1a2e;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:3rem;max-width:400px;width:100%;text-align:center;">
                    <img src="sherlock-avatar.png" style="width:80px;height:80px;border-radius:16px;margin-bottom:1rem;">
                    <h1 style="color:#fff;font-size:1.5rem;font-weight:800;margin-bottom:0.5rem;">MY850 HQ</h1>
                    <p style="color:#6c6c8a;margin-bottom:2rem;">Team Dashboard</p>
                    <input type="password" id="pwInput" placeholder="Enter password" style="width:100%;padding:1rem;background:#252542;border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#fff;font-size:1rem;margin-bottom:1rem;" autofocus>
                    <div id="pwError" style="color:#ff6b6b;font-size:0.9rem;margin-bottom:1rem;display:none;">Incorrect password</div>
                    <button onclick="doLogin()" style="width:100%;padding:1rem;background:linear-gradient(135deg,#2E5090,#20C997);color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Enter</button>
                    <noscript><p style="color:#ff6b6b;margin-top:1rem;">JavaScript required</p></noscript>
                </div>
            </div>
        `;
        window.doLogin = async function() {
            const pw = document.getElementById('pwInput').value;
            if (await window.HQAuth.check(pw)) {
                window.HQAuth.login();
                location.reload();
            } else {
                document.getElementById('pwError').style.display = 'block';
            }
        };
        document.getElementById('pwInput').addEventListener('keypress', e => e.key === 'Enter' && doLogin());
    }
})();
