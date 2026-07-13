import { useForm } from '@inertiajs/react';
import { FlashMessage } from '@/Components/UI/FlashMessage';
import { submit } from '@/routes/superadmin/login';

export default function SuperAdminLogin() {
    const form = useForm({
        email: '',
        password: '',
        remember: false,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post(submit.url());
    }

    return (
        <div className="login-scene" data-testid="superadmin-login">
            <FlashMessage />

            {/* Glow & grain */}
            <div className="login-grain" />

            {/* Orbites animées */}
            <div className="orbit-stage">
                <div className="orbit orbit-1" />
                <div className="orbit orbit-2" />
                <div className="orbit orbit-3" />
            </div>

            {/* Particles flottantes (8 divs) */}
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className={`lp lp-${i}`} />
            ))}

            {/* Login card */}
            <div className="login-card">
                <div className="login-logo">LE MAEVA</div>
                <p className="login-sub">Super Administration</p>
                <div className="login-divider" />

                <form onSubmit={handleSubmit} noValidate>
                    <div style={{ marginBottom: '18px' }}>
                        <label className="login-field-label" htmlFor="email">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            className="login-entity-input"
                            value={form.data.email}
                            onChange={(e) =>
                                form.setData('email', e.target.value)
                            }
                            placeholder="vous@exemple.com"
                            autoFocus
                        />
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                        <label className="login-field-label" htmlFor="password">
                            Mot de passe
                        </label>
                        <input
                            id="password"
                            type="password"
                            className="login-entity-input"
                            value={form.data.password}
                            onChange={(e) =>
                                form.setData('password', e.target.value)
                            }
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="store-login-remember">
                        <input
                            type="checkbox"
                            id="remember"
                            checked={form.data.remember}
                            onChange={(e) =>
                                form.setData('remember', e.target.checked)
                            }
                        />
                        <label htmlFor="remember">Se souvenir de moi</label>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary store-login-submit"
                        disabled={form.processing}
                    >
                        {form.processing ? 'Connexion…' : 'Se connecter'}
                    </button>

                    {(form.errors.email || form.errors.password) && (
                        <div className="login-error">
                            {form.errors.email || form.errors.password}
                        </div>
                    )}
                </form>
            </div>

            <style>{`
                .store-login-remember {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin: 0.75rem 0 1.1rem;
                }
                .store-login-remember input {
                    width: 16px;
                    height: 16px;
                    cursor: pointer;
                }
                .store-login-remember label {
                    font-size: 0.8rem;
                    color: var(--text-2);
                    cursor: pointer;
                }
                .store-login-submit {
                    width: 100%;
                    justify-content: center;
                }
            `}</style>
        </div>
    );
}
