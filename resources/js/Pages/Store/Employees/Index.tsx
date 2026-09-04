import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import { withLayout } from '@/hooks/withLayout';
import { UserPlus, Trash2, Pencil, Search } from 'lucide-react';

interface Employee {
    id: number;
    nom: string;
    role: string;
    active: boolean;
    pin: string;
}

interface IndexProps {
    employees: Employee[];
}

function EmployeeIndex({ employees: initialEmployees }: IndexProps) {
    const [employees, setEmployees] = useState(initialEmployees);
    const [search, setSearch] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; nom: string } | null>(null);

    const filteredEmployees = employees.filter(e =>
        e.nom.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = (employee: Employee) => {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer ${employee.nom} ?`)) return;
        router.delete(`/store/admin/employees/${employee.id}`, {
            onSuccess: () => {
                setEmployees(employees.filter(e => e.id !== employee.id));
            },
        });
    };

    const handleToggleActive = (employee: Employee) => {
        router.post(`/store/admin/employees/${employee.id}/toggle-active`, {}, {
            onSuccess: () => {
                setEmployees(employees.map(e =>
                    e.id === employee.id ? { ...e, active: !e.active } : e
                ));
            },
        });
    };

    const ROLE_LABELS: Record<string, string> = {
        RESP_LABO: 'Responsable Labo',
        EMPLOYE_LABO: 'Employé Labo',
        RESP_BOUTIQUE: 'Responsable Boutique',
        EMPLOYE_VENTE: 'Employé Vente',
    };

    const ROLE_COLORS: Record<string, string> = {
        RESP_LABO: '#3b5bdb',
        EMPLOYE_LABO: '#3b5bdb',
        RESP_BOUTIQUE: '#e8742a',
        EMPLOYE_VENTE: '#e8742a',
    };

    return (
        <div className="page-content">
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Gestion des employés
                </h1>
                <p style={{ color: 'var(--text-3)', fontSize: '0.9rem' }}>
                    Créez et gérez les employés de votre store
                </p>
            </div>

            <div className="table-card">
                <div className="table-header">
                    <div className="table-title">
                        <div className="table-dot" />
                        <span>Liste des employés ({employees.length})</span>
                    </div>
                    <div className="search-wrap">
                        <Search size={14} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="form-input finput--search"
                        />
                    </div>
                    <a href="/store/admin/employees/create" className="btn-primary">
                        <UserPlus size={14} strokeWidth={1.5} />
                        <span>Nouvel employé</span>
                    </a>
                </div>

                {filteredEmployees.length === 0 ? (
                    <div style={{
                        padding: '3rem 2rem',
                        textAlign: 'center',
                        color: 'var(--text-3)',
                    }}>
                        <p>Aucun employé enregistré</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Nom</th>
                                    <th>Rôle</th>
                                    <th>Statut</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEmployees.map((emp) => (
                                    <tr key={emp.id}>
                                        <td>
                                            <span style={{ fontWeight: 500 }}>{emp.nom}</span>
                                        </td>
                                        <td>
                                            <span
                                                style={{
                                                    background: `${ROLE_COLORS[emp.role]}15`,
                                                    color: ROLE_COLORS[emp.role],
                                                    padding: '0.35rem 0.75rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {ROLE_LABELS[emp.role]}
                                            </span>
                                        </td>
                                        <td>
                                            <span
                                                style={{
                                                    color: emp.active ? '#4caf50' : '#dc5f5f',
                                                    fontWeight: 500,
                                                    fontSize: '0.9rem',
                                                }}
                                            >
                                                {emp.active ? 'Actif' : 'Inactif'}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <a
                                                    href={`/store/admin/employees/${emp.id}/edit`}
                                                    className="btn-ghost-sm"
                                                    title="Éditer"
                                                >
                                                    <Pencil size={14} strokeWidth={1.5} />
                                                </a>
                                                <button
                                                    onClick={() => handleDelete(emp)}
                                                    className="btn-icon-danger-sm"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={14} strokeWidth={1.5} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default withLayout(EmployeeIndex);
