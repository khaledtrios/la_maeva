import { useForm } from '@inertiajs/react';
import { withLayout } from '@/hooks/withLayout';
import { ArrowLeft } from 'lucide-react';

interface CreateProps {
    roles: string[];
}

function EmployeeCreate({ roles }: CreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        nom: '',
        role: 'RESP_LABO',
        pin: '',
    });

    const ROLE_LABELS: Record<string, string> = {
        RESP_LABO: 'Responsable Laboratoire',
        EMPLOYE_LABO: 'Employé Laboratoire',
        RESP_BOUTIQUE: 'Responsable Boutique',
        EMPLOYE_VENTE: 'Employé Vente',
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/store/admin/employees');
    };

    return (
        <div className="page-content">
            <a href="/store/admin/employees" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--text-3)',
                textDecoration: 'none',
                marginBottom: '1.5rem',
                fontSize: '0.9rem',
            }}>
                <ArrowLeft size={16} />
                Retour à la liste
            </a>

            <div style={{ maxWidth: '600px' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        Créer un nouvel employé
                    </h1>
                    <p style={{ color: 'var(--text-3)', fontSize: '0.9rem' }}>
                        L'employé aura automatiquement accès à votre store
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '2rem',
                }}>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label">
                            Nom <span style={{ color: 'var(--orange)' }}>*</span>
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Prénom Nom"
                            value={data.nom}
                            onChange={(e) => setData('nom', e.target.value)}
                        />
                        {errors.nom && (
                            <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                                {errors.nom}
                            </p>
                        )}
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label">
                            Rôle <span style={{ color: 'var(--orange)' }}>*</span>
                        </label>
                        <select
                            className="form-select"
                            value={data.role}
                            onChange={(e) => setData('role', e.target.value)}
                        >
                            {roles.map((role) => (
                                <option key={role} value={role}>
                                    {ROLE_LABELS[role]}
                                </option>
                            ))}
                        </select>
                        {errors.role && (
                            <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                                {errors.role}
                            </p>
                        )}
                    </div>

                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                        <label className="form-label">
                            Code PIN <span style={{ color: 'var(--orange)' }}>*</span>
                        </label>
                        <input
                            type="text"
                            maxLength={4}
                            className="form-input"
                            placeholder="4 chiffres"
                            value={data.pin}
                            onChange={(e) => setData('pin', e.target.value)}
                        />
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.5rem' }}>
                            Le PIN sera hashé avant stockage
                        </p>
                        {errors.pin && (
                            <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                                {errors.pin}
                            </p>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <a href="/store/employees" className="btn-neutral">
                            Annuler
                        </a>
                        <button
                            type="submit"
                            disabled={processing}
                            className="btn-primary"
                        >
                            {processing ? 'Création en cours…' : 'Créer l\'employé'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default withLayout(EmployeeCreate);
