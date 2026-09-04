import { useForm } from '@inertiajs/react';
import { withLayout } from '@/hooks/withLayout';
import { ArrowLeft } from 'lucide-react';

interface Employee {
    id: number;
    nom: string;
    role: string;
    active: boolean;
}

interface EditProps {
    employee: Employee;
    roles: string[];
}

function EmployeeEdit({ employee, roles }: EditProps) {
    const { data, setData, put, processing, errors } = useForm({
        nom: employee.nom,
        role: employee.role,
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
        put(`/store/admin/employees/${employee.id}`);
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
                        Éditer {employee.nom}
                    </h1>
                    <p style={{ color: 'var(--text-3)', fontSize: '0.9rem' }}>
                        Modifiez les informations de cet employé
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
                        <label className="form-label">Code PIN</label>
                        <input
                            type="text"
                            maxLength={4}
                            className="form-input"
                            placeholder="Laisser vide pour ne pas changer"
                            value={data.pin}
                            onChange={(e) => setData('pin', e.target.value)}
                        />
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.5rem' }}>
                            Entrez un nouveau PIN (4 chiffres) pour le changer, sinon laissez vide
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
                            {processing ? 'Enregistrement…' : 'Enregistrer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default withLayout(EmployeeEdit);
