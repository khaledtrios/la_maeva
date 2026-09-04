import { useState } from 'react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { register as storeRegister } from '@/routes/store';

interface Store {
    id: number;
    name: string;
    slug: string;
    entity_name: string | null;
}

interface LoginProps {
    store: Store;
}

export default function Login() {
    const { errors, store } = usePage().props as any as LoginProps;
    const form = useForm({
        pin: '',
    });

    const [pinValue, setPinValue] = useState('');

    const addDigit = (digit: string) => {
        if (pinValue.length < 4) {
            const newPin = pinValue + digit;
            setPinValue(newPin);
            form.setData('pin', newPin);

            // Auto-submit dès que 4 digits
            if (newPin.length === 4) {
                // Petit délai pour permettre l'affichage du dernier dot
                setTimeout(() => {
                    form.post(`/${store.slug}/login`, {
                        onError: () => {
                            setPinValue('');
                        },
                    });
                }, 100);
            }
        }
    };

    const deleteDigit = () => {
        const newPin = pinValue.slice(0, -1);
        setPinValue(newPin);
        form.setData('pin', newPin);
    };

    return (
        <div className="login-scene" data-testid="login">
            {/* Glow & grain */}
            <div className="login-glow" />
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
                {/* Logo */}
                <div className="login-logo">LE MAEVA</div>
                <p className="login-sub">Gestion Boulangerie &amp; HACCP</p>
                <div className="login-divider" />

                {/* Store Info */}
                <div style={{ marginBottom: '22px' }}>
                    <label className="login-field-label">Votre store</label>
                    <div
                        style={{
                            padding: '12px 16px',
                            background: 'var(--bg-card-2)',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            fontWeight: 500,
                            color: 'var(--text-1)',
                        }}
                    >
                        {(store as Store).name}
                    </div>
                </div>

                {/* PIN indicator (4 dots) */}
                <div style={{ marginBottom: '8px' }}>
                    <label className="login-field-label">Code PIN</label>
                    <div className="pin-indicator">
                        {[0, 1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className={`pin-dot ${pinValue.length > i ? 'active' : ''}`}
                            >
                                {pinValue.length > i && (
                                    <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>
                                        ●
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Keypad 3×3 + 0 + delete */}
                <div className="pin-grid">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                        <button
                            key={d}
                            type="button"
                            className="pin-key"
                            onClick={() => addDigit(d)}
                        >
                            {d}
                        </button>
                    ))}
                    <div /> {/* spacer vide pour l'organisation de la grille */}
                    <button
                        type="button"
                        className="pin-key"
                        onClick={() => addDigit('0')}
                    >
                        0
                    </button>
                    <button
                        type="button"
                        className="pin-key pin-key-del"
                        onClick={deleteDigit}
                    >
                        ⌫
                    </button>
                </div>

                {/* Error message */}
                {errors.pin && (
                    <div className="login-error">{errors.pin}</div>
                )}

                <p
                    style={{
                        textAlign: 'center',
                        fontSize: '0.72rem',
                        color: 'var(--text-3)',
                        marginTop: '18px',
                    }}
                >
                    Vous êtes une boutique ?{' '}
                    <Link href={storeRegister.url()}>Inscrivez-vous ici</Link>
                </p>
            </div>
        </div>
    );
}
