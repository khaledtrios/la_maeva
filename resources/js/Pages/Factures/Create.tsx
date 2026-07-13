import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import {
    X,
    Calendar,
    Building2,
    Store,
    FileText,
    AlertCircle,
} from 'lucide-react';

export default function FactureCreate({
    boutiques,
    labos,
    periodeTypes,
    onClose,
}: {
    boutiques: Array<{ id: number; nom: string }>;
    labos: Array<{ id: number; nom: string }>;
    periodeTypes: string[];
    onClose: () => void;
}) {
    const [data, setData] = useState({
        boulangerie_id: '',
        entity_id: '',
        periode_type: 'MOIS',
        date_debut: '',
        date_fin: '',
        notes: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Préremplir les dates selon le type de période sélectionné
    useEffect(() => {
        if (data.periode_type !== 'CUSTOM') {
            const today = new Date();
            let debut: string, fin: string;

            switch (data.periode_type) {
                case 'SEMAINE':
                    const d = new Date(today);
                    d.setDate(today.getDate() - today.getDay());
                    debut = d.toISOString().split('T')[0];
                    const f = new Date(d.getTime() + 6 * 24 * 60 * 60 * 1000);
                    fin = f.toISOString().split('T')[0];
                    break;
                case 'MOIS':
                    const month = today.getMonth();
                    const year = today.getFullYear();
                    debut = `${year}-${String(month + 1).padStart(2, '0')}-01`;
                    fin = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`;
                    break;
                case 'ANNEE':
                    const y = today.getFullYear();
                    debut = `${y}-01-01`;
                    fin = `${y}-12-31`;
                    break;
                default:
                    debut = today.toISOString().split('T')[0];
                    fin = today.toISOString().split('T')[0];
            }
            setData((prev) => ({ ...prev, date_debut: debut, date_fin: fin }));
        }
    }, [data.periode_type]);

    const handleChange = (field: string, value: string) => {
        setData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const handlePeriodTypeChange = (type: string) => {
        setData((prev) => ({
            ...prev,
            periode_type: type,
            ...(type === 'CUSTOM' ? {} : { date_debut: '', date_fin: '' }),
        }));
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!data.boulangerie_id)
            newErrors.boulangerie_id = 'La boutique est requise';
        if (!data.entity_id)
            newErrors.entity_id = 'Le laboratoire émetteur est requis';
        if (!data.date_debut)
            newErrors.date_debut = 'La date de début est requise';
        if (!data.date_fin) newErrors.date_fin = 'La date de fin est requise';
        if (
            data.date_debut &&
            data.date_fin &&
            data.date_debut > data.date_fin
        ) {
            newErrors.date_fin =
                'La date de fin doit être postérieure à la date de début';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        router.post('/factures', data, {
            onSuccess: () => {
                setIsSubmitting(false);
                onClose();
            },
            onError: (err) => {
                setIsSubmitting(false);
                setErrors(err);
            },
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h3 className="modal-title">Générer une facture</h3>
                        <p className="modal-subtitle">
                            Créer une nouvelle facture pour une boutique
                        </p>
                    </div>
                    <button onClick={onClose} className="modal-close">
                        <X size={18} strokeWidth={1.5} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {/* Boutique */}
                        <div className="form-group">
                            <label className="form-label">
                                Boutique destinataire{' '}
                                <span className="text-orange">*</span>
                            </label>
                            <div className="select-wrapper">
                                <Store
                                    size={18}
                                    strokeWidth={1.5}
                                    className="select-icon"
                                />
                                <select
                                    value={data.boulangerie_id}
                                    onChange={(e) =>
                                        handleChange(
                                            'boulangerie_id',
                                            e.target.value,
                                        )
                                    }
                                    className={`form-select ${errors.boulangerie_id ? 'error' : ''}`}
                                >
                                    <option value="">
                                        Choisir une boutique...
                                    </option>
                                    {boutiques.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.nom}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {errors.boulangerie_id && (
                                <span className="form-error">
                                    {errors.boulangerie_id}
                                </span>
                            )}
                        </div>

                        {/* Laboratoire émetteur */}
                        <div className="form-group">
                            <label className="form-label">
                                Laboratoire émetteur{' '}
                                <span className="text-orange">*</span>
                            </label>
                            <div className="select-wrapper">
                                <Building2
                                    size={18}
                                    strokeWidth={1.5}
                                    className="select-icon"
                                />
                                <select
                                    value={data.entity_id}
                                    onChange={(e) =>
                                        handleChange(
                                            'entity_id',
                                            e.target.value,
                                        )
                                    }
                                    className={`form-select ${errors.entity_id ? 'error' : ''}`}
                                >
                                    <option value="">
                                        Choisir un laboratoire...
                                    </option>
                                    {labos.map((l) => (
                                        <option key={l.id} value={l.id}>
                                            {l.nom}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {errors.entity_id && (
                                <span className="form-error">
                                    {errors.entity_id}
                                </span>
                            )}
                        </div>

                        {/* Type de période */}
                        <div className="form-group">
                            <label className="form-label">
                                Type de période
                            </label>
                            <div className="period-buttons">
                                {periodeTypes.map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        className={`period-btn ${data.periode_type === type ? 'active' : ''}`}
                                        onClick={() =>
                                            handlePeriodTypeChange(type)
                                        }
                                    >
                                        {type === 'SEMAINE'
                                            ? 'Semaine'
                                            : type === 'MOIS'
                                              ? 'Mois'
                                              : type === 'ANNEE'
                                                ? 'Année'
                                                : 'Personnalisée'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="dates-grid">
                            <div className="form-group">
                                <label className="form-label">
                                    Du <span className="text-orange">*</span>
                                </label>
                                <div className="date-wrapper">
                                    <Calendar
                                        size={18}
                                        strokeWidth={1.5}
                                        className="date-icon"
                                    />
                                    <input
                                        type="date"
                                        value={data.date_debut}
                                        onChange={(e) =>
                                            handleChange(
                                                'date_debut',
                                                e.target.value,
                                            )
                                        }
                                        className={`form-input ${errors.date_debut ? 'error' : ''}`}
                                    />
                                </div>
                                {errors.date_debut && (
                                    <span className="form-error">
                                        {errors.date_debut}
                                    </span>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="form-label">
                                    Au <span className="text-orange">*</span>
                                </label>
                                <div className="date-wrapper">
                                    <Calendar
                                        size={18}
                                        strokeWidth={1.5}
                                        className="date-icon"
                                    />
                                    <input
                                        type="date"
                                        value={data.date_fin}
                                        onChange={(e) =>
                                            handleChange(
                                                'date_fin',
                                                e.target.value,
                                            )
                                        }
                                        className={`form-input ${errors.date_fin ? 'error' : ''}`}
                                    />
                                </div>
                                {errors.date_fin && (
                                    <span className="form-error">
                                        {errors.date_fin}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="form-group">
                            <label className="form-label">
                                Notes{' '}
                                <span className="form-optional">
                                    optionnelles
                                </span>
                            </label>
                            <textarea
                                value={data.notes}
                                onChange={(e) =>
                                    handleChange('notes', e.target.value)
                                }
                                className="form-textarea"
                                rows={3}
                                placeholder="Informations complémentaires..."
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-neutral"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn-primary"
                        >
                            {isSubmitting ? (
                                <span className="spinner" />
                            ) : (
                                <FileText size={16} strokeWidth={1.5} />
                            )}
                            {isSubmitting
                                ? 'Génération...'
                                : 'Générer la facture'}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 100;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(6px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                }
                .modal {
                    background: var(--bg-card);
                    border-radius: 20px;
                    max-width: 560px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding: 1.5rem 1.5rem 1rem;
                    border-bottom: 1px solid var(--border);
                }
                .modal-title {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: var(--text-1);
                }
                .modal-subtitle {
                    font-size: 0.8rem;
                    color: var(--text-3);
                    margin-top: 4px;
                }
                .modal-close {
                    width: 32px;
                    height: 32px;
                    background: var(--bg-card-2);
                    border: 1px solid var(--border);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }
                .modal-body {
                    padding: 1.5rem;
                }
                .modal-footer {
                    padding: 1rem 1.5rem 1.5rem;
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    background: var(--bg-card-2);
                    border-top: 1px solid var(--border);
                }

                .form-group {
                    margin-bottom: 1rem;
                }
                .form-label {
                    display: block;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--text-3);
                    margin-bottom: 0.4rem;
                }
                .form-optional {
                    font-weight: 400;
                    text-transform: none;
                    font-size: 0.65rem;
                }
                .select-wrapper, .date-wrapper {
                    position: relative;
                }
                .select-icon, .date-icon {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-3);
                    pointer-events: none;
                }
                .form-select, .form-input {
                    width: 100%;
                    padding: 0.65rem 0.9rem 0.65rem 2.5rem;
                    font-size: 0.85rem;
                    border: 1.5px solid var(--border);
                    border-radius: 10px;
                    background: var(--bg-card);
                }
                .form-textarea {
                    width: 100%;
                    padding: 0.65rem 0.9rem;
                    font-size: 0.85rem;
                    border: 1.5px solid var(--border);
                    border-radius: 10px;
                    background: var(--bg-card);
                }
                .form-select:focus, .form-input:focus, .form-textarea:focus {
                    outline: none;
                    border-color: var(--orange);
                }
                .form-select.error, .form-input.error, .form-textarea.error {
                    border-color: var(--danger);
                }
                .form-error {
                    display: block;
                    font-size: 0.7rem;
                    color: var(--danger);
                    margin-top: 0.25rem;
                }
                .dates-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }
                .period-buttons {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }
                .period-btn {
                    padding: 0.4rem 1rem;
                    background: var(--bg-card-2);
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    font-size: 0.75rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .period-btn.active {
                    background: var(--orange);
                    border-color: var(--orange);
                    color: white;
                }

                .btn-primary {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.6rem 1.2rem;
                    background: linear-gradient(135deg, var(--orange), var(--orange-lt));
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                }
                .btn-neutral {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.6rem 1.2rem;
                    background: transparent;
                    color: var(--text-2);
                    border: 1px solid var(--border);
                    border-radius: 10px;
                    font-size: 0.8rem;
                    cursor: pointer;
                }
                .text-orange {
                    color: var(--orange);
                }
                .spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
