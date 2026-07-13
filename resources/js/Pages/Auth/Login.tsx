import { useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { login } from '@/routes';

export default function Login() {
    const { errors } = usePage().props as any;
    const form = useForm({
        entity_id: '',
        pin: '',
    });

    const [pinValue, setPinValue] = useState('');

    const addDigit = (digit: string) => {
        if (pinValue.length < 4) {
            const newPin = pinValue + digit;
            setPinValue(newPin);
            form.setData('pin', newPin);

            // Auto-submit dès que 4 digits + entity sélectionnée
            if (newPin.length === 4 && form.data.entity_id) {
                // Petit délai pour permettre l'affichage du dernier dot
                setTimeout(() => {
                    console.log('Submitting login with:', {
                        entity_id: form.data.entity_id,
                        pin: newPin,
                    });
                    form.post(login.url(), {
                        onError: () => {
                            console.log('Login error:', errors.pin);
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

                {/* Select établissement */}
                <div style={{ marginBottom: '22px' }}>
                    <label className="login-field-label">Établissement</label>
                    <select
                        value={form.data.entity_id}
                        onChange={(e) => form.setData('entity_id', e.target.value)}
                        className="login-entity-input"
                        required
                    >
                        <option value="">— Choisir votre site —</option>
                        <option value="1">1 · Labo Maéva Cayenne</option>
                        <option value="2">2 · Maéva Cayenne</option>
                        <option value="3">3 · Maéva Soula</option>
                        <option value="4">4 · Mé Mo Toucho Cayenne</option>
                    </select>
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
            </div>
        </div>
    );
}
