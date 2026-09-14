import { Link, useForm } from '@inertiajs/react';
import { FlashMessage } from '@/Components/UI/FlashMessage';
import { register as storeRegisterRoute } from '@/routes/store';
import { submit } from '@/routes/store/login';

export default function Login() {
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
        <div className="login-scene" data-testid="store-login">
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
                <p className="login-sub">Espace Boutique</p>
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

                {/* <p className="store-login-footer-link">
                    Pas encore de compte ?{' '}
                    <Link href={storeRegisterRoute.url()}>
                        Inscrivez votre boutique
                    </Link>
                </p> */}
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
                .store-login-footer-link {
                    text-align: center;
                    font-size: 0.82rem;
                    color: var(--text-3);
                    margin-top: 1.4rem;
                }
                .store-login-footer-link a {
                    color: var(--blue);
                    font-weight: 600;
                    text-decoration: none;
                }
                .store-login-footer-link a:hover {
                    text-decoration: underline;
                }
            `}</style>
        </div>
    );
}
