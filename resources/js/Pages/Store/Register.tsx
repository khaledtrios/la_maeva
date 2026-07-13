import { Link, useForm } from '@inertiajs/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { login as internalLoginRoute } from '@/routes';
import { login as storeLoginRoute } from '@/routes/store';
import { submit } from '@/routes/store/register';

export default function Register() {
    const [showMore, setShowMore] = useState(false);

    const form = useForm({
        name: '',
        owner_name: '',
        email: '',
        password: '',
        password_confirmation: '',
        phone: '',
        address: '',
        city: '',
        postal_code: '',
        siret: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post(submit.url());
    }

    return (
        <div
            className="login-scene register-scene"
            data-testid="store-register"
        >
            <div className="login-grain" />

            <div className="login-card login-card--wide">
                <div className="login-logo">LE MAEVA</div>
                <p className="login-sub">Inscription boutique</p>
                <div className="login-divider" />

                <form onSubmit={handleSubmit} noValidate>
                    <div className="field">
                        <label className="field-label" htmlFor="name">
                            Nom de la boutique
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                            placeholder="Ex : Maéva Cayenne"
                            autoFocus
                        />
                        {form.errors.name && (
                            <div className="field-error">
                                {form.errors.name}
                            </div>
                        )}
                    </div>

                    <div className="field">
                        <label className="field-label" htmlFor="owner_name">
                            Nom du propriétaire
                        </label>
                        <input
                            id="owner_name"
                            type="text"
                            value={form.data.owner_name}
                            onChange={(e) =>
                                form.setData('owner_name', e.target.value)
                            }
                            placeholder="Prénom Nom"
                        />
                        {form.errors.owner_name && (
                            <div className="field-error">
                                {form.errors.owner_name}
                            </div>
                        )}
                    </div>

                    <div className="field">
                        <label className="field-label" htmlFor="email">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={form.data.email}
                            onChange={(e) =>
                                form.setData('email', e.target.value)
                            }
                            placeholder="vous@exemple.com"
                        />
                        {form.errors.email && (
                            <div className="field-error">
                                {form.errors.email}
                            </div>
                        )}
                    </div>

                    <div className="field-row">
                        <div className="field">
                            <label className="field-label" htmlFor="password">
                                Mot de passe
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={form.data.password}
                                onChange={(e) =>
                                    form.setData('password', e.target.value)
                                }
                                placeholder="••••••••"
                            />
                            {form.errors.password && (
                                <div className="field-error">
                                    {form.errors.password}
                                </div>
                            )}
                        </div>
                        <div className="field">
                            <label
                                className="field-label"
                                htmlFor="password_confirmation"
                            >
                                Confirmation
                            </label>
                            <input
                                id="password_confirmation"
                                type="password"
                                value={form.data.password_confirmation}
                                onChange={(e) =>
                                    form.setData(
                                        'password_confirmation',
                                        e.target.value,
                                    )
                                }
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        className="register-more-toggle"
                        onClick={() => setShowMore((v) => !v)}
                    >
                        {showMore ? (
                            <ChevronUp size={14} strokeWidth={1.5} />
                        ) : (
                            <ChevronDown size={14} strokeWidth={1.5} />
                        )}
                        Informations complémentaires (facultatif)
                    </button>

                    {showMore && (
                        <div className="register-more">
                            <div className="field">
                                <label className="field-label" htmlFor="phone">
                                    Téléphone
                                </label>
                                <input
                                    id="phone"
                                    type="text"
                                    value={form.data.phone}
                                    onChange={(e) =>
                                        form.setData('phone', e.target.value)
                                    }
                                    placeholder="0594 00 00 00"
                                />
                                {form.errors.phone && (
                                    <div className="field-error">
                                        {form.errors.phone}
                                    </div>
                                )}
                            </div>
                            <div className="field">
                                <label
                                    className="field-label"
                                    htmlFor="address"
                                >
                                    Adresse
                                </label>
                                <input
                                    id="address"
                                    type="text"
                                    value={form.data.address}
                                    onChange={(e) =>
                                        form.setData('address', e.target.value)
                                    }
                                    placeholder="Adresse complète"
                                />
                                {form.errors.address && (
                                    <div className="field-error">
                                        {form.errors.address}
                                    </div>
                                )}
                            </div>
                            <div className="field-row">
                                <div className="field">
                                    <label
                                        className="field-label"
                                        htmlFor="city"
                                    >
                                        Ville
                                    </label>
                                    <input
                                        id="city"
                                        type="text"
                                        value={form.data.city}
                                        onChange={(e) =>
                                            form.setData('city', e.target.value)
                                        }
                                        placeholder="Cayenne"
                                    />
                                    {form.errors.city && (
                                        <div className="field-error">
                                            {form.errors.city}
                                        </div>
                                    )}
                                </div>
                                <div className="field">
                                    <label
                                        className="field-label"
                                        htmlFor="postal_code"
                                    >
                                        Code postal
                                    </label>
                                    <input
                                        id="postal_code"
                                        type="text"
                                        value={form.data.postal_code}
                                        onChange={(e) =>
                                            form.setData(
                                                'postal_code',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="97300"
                                    />
                                    {form.errors.postal_code && (
                                        <div className="field-error">
                                            {form.errors.postal_code}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="field">
                                <label className="field-label" htmlFor="siret">
                                    SIRET
                                </label>
                                <input
                                    id="siret"
                                    type="text"
                                    value={form.data.siret}
                                    onChange={(e) =>
                                        form.setData('siret', e.target.value)
                                    }
                                    placeholder="123 456 789 00012"
                                />
                                {form.errors.siret && (
                                    <div className="field-error">
                                        {form.errors.siret}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary register-submit"
                        disabled={form.processing}
                    >
                        {form.processing
                            ? 'Inscription en cours…'
                            : "S'inscrire"}
                    </button>
                </form>

                <p className="register-footer-link">
                    Déjà inscrit ?{' '}
                    <Link href={storeLoginRoute.url()}>Connexion boutique</Link>
                </p>
                <p className="register-internal-link">
                    Vous êtes un membre de l'équipe interne ?{' '}
                    <Link href={internalLoginRoute.url()}>Connexion ici</Link>
                </p>
            </div>

            <style>{`
                .register-scene {
                    overflow-y: auto;
                    align-items: flex-start;
                    padding: 48px 16px;
                }
                .login-card--wide {
                    max-width: 460px;
                }
                .field {
                    display: flex;
                    flex-direction: column;
                    gap: 0.35rem;
                    margin-bottom: 1rem;
                }
                .field-label {
                    font-size: 0.7rem;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: var(--text-2);
                }
                .field input {
                    width: 100%;
                    padding: 0.65rem 0.875rem;
                }
                .field-error {
                    font-size: 0.72rem;
                    color: var(--danger);
                }
                .field-row {
                    display: flex;
                    gap: 1rem;
                }
                .field-row .field {
                    flex: 1;
                    min-width: 0;
                }
                .register-more-toggle {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    background: none;
                    border: none;
                    padding: 0.25rem 0;
                    margin-bottom: 0.75rem;
                    font-size: 0.78rem;
                    font-weight: 600;
                    color: var(--blue);
                    cursor: pointer;
                }
                .register-more-toggle:hover {
                    color: var(--blue-lt);
                }
                .register-more {
                    padding: 0.75rem;
                    margin-bottom: 0.5rem;
                    background: var(--bg-card-2);
                    border: 1px solid var(--border);
                    border-radius: var(--radius);
                }
                .register-submit {
                    width: 100%;
                    justify-content: center;
                    margin-top: 0.5rem;
                }
                .register-footer-link {
                    text-align: center;
                    font-size: 0.82rem;
                    color: var(--text-3);
                    margin-top: 1.4rem;
                }
                .register-footer-link a {
                    color: var(--blue);
                    font-weight: 600;
                    text-decoration: none;
                }
                .register-footer-link a:hover {
                    text-decoration: underline;
                }
                .register-internal-link {
                    text-align: center;
                    font-size: 0.72rem;
                    color: var(--text-3);
                    margin-top: 0.6rem;
                }
                .register-internal-link a {
                    color: var(--text-3);
                    text-decoration: underline;
                }
                .register-internal-link a:hover {
                    color: var(--blue);
                }
            `}</style>
        </div>
    );
}
