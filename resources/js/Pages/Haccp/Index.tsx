import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import {
    Thermometer,
    Sparkles,
    Truck,
    AlertCircle,
    CheckCircle,
    Clock,
    Plus,
    X,
    Calendar,
    User,
    FileCheck,
    Pencil,
} from 'lucide-react';
import type {
    HaccpTemperature,
    HaccpNettoyage,
    HaccpControleReception,
} from '@/types';
import { useAuth } from '@/hooks/useAuth';
import temperatures from '@/routes/haccp/temperatures';
import nettoyage from '@/routes/haccp/nettoyage';
import receptionsFournisseurs from '@/routes/haccp/receptions-fournisseurs';

const storeTemp = temperatures.store;
const storeNettoyage = nettoyage.store;
const updateNettoyage = nettoyage.update;
const storeFournisseur = receptionsFournisseurs.store;

type Tab = 'temperatures' | 'nettoyage' | 'fournisseurs';

interface Props {
    temperatures: (HaccpTemperature & { creator?: { nom: string } | null })[];
    plans: (HaccpNettoyage & { validateur?: { nom: string } | null })[];
    controles: (HaccpControleReception & {
        creator?: { nom: string } | null;
    })[];
    initialTab?: 'temperatures' | 'nettoyage' | 'fournisseurs';
}

export default function HaccpIndex({
    temperatures,
    plans,
    controles,
    initialTab = 'temperatures',
}: Props) {
    const { hasRole } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>(initialTab);

    // ============================================
    // TEMPERATURES
    // ============================================
    const [tempModalOpen, setTempModalOpen] = useState(false);
    const tempForm = useForm({
        enceinte: '',
        temperature: '',
        date: new Date().toISOString().slice(0, 16),
    });

    const submitTemperature = (e: React.FormEvent) => {
        e.preventDefault();
        tempForm.post(storeTemp.url(), {
            onSuccess: () => {
                tempForm.reset('enceinte', 'temperature');
                setTempModalOpen(false);
            },
        });
    };

    const isTempAlert = (temp: number, enceinte: string) => {
        if (enceinte.toLowerCase().includes('froide') && temp > 7) return true;
        if (enceinte.toLowerCase().includes('négative') && temp > -15)
            return true;
        return false;
    };

    // ============================================
    // NETTOYAGE
    // ============================================
    const defaultTasks = [
        { nom: 'Plan de travail principal', fait: false },
        { nom: 'Four/étuve', fait: false },
        { nom: 'Sol laboratoire', fait: false },
        { nom: 'Chambre froide 1', fait: false },
        { nom: 'Chambre froide 2', fait: false },
        { nom: 'Zone pétrissage', fait: false },
        { nom: 'Comptoir vente', fait: false },
        { nom: 'Vitrine froide', fait: false },
        { nom: 'Sol boutique', fait: false },
        { nom: 'Réfrigérateur présentoir', fait: false },
    ];

    const [selectedTaches, setSelectedTaches] =
        useState<Array<{ nom: string; fait: boolean }>>(defaultTasks);
    const [newTacheCustom, setNewTacheCustom] = useState('');
    const [planModalOpen, setPlanModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<HaccpNettoyage | null>(null);
    const [newPlanDate, setNewPlanDate] = useState(
        new Date().toISOString().split('T')[0],
    );

    const todayPlan = plans.find(
        (p) => p.date === new Date().toISOString().split('T')[0],
    );
    const historicalPlans = plans.filter(
        (p) => p.date !== new Date().toISOString().split('T')[0],
    );

    const openCreatePlanModal = () => {
        setEditingPlan(null);
        setSelectedTaches(defaultTasks.map((t) => ({ ...t })));
        setNewPlanDate(new Date().toISOString().split('T')[0]);
        setNewTacheCustom('');
        setPlanModalOpen(true);
    };

    const openEditPlanModal = (plan: HaccpNettoyage) => {
        setEditingPlan(plan);
        setSelectedTaches(plan.taches_json || []);
        setNewPlanDate(plan.date);
        setNewTacheCustom('');
        setPlanModalOpen(true);
    };

    const toggleTachePredefinie = (nom: string) => {
        setSelectedTaches((prev) =>
            prev.some((t) => t.nom === nom)
                ? prev.filter((t) => t.nom !== nom)
                : [...prev, { nom, fait: false }],
        );
    };

    const addTacheCustom = () => {
        const nom = newTacheCustom.trim();
        if (nom && !selectedTaches.some((t) => t.nom === nom)) {
            setSelectedTaches((prev) => [...prev, { nom, fait: false }]);
        }
        setNewTacheCustom('');
    };

    const submitPlan = () => {
        if (selectedTaches.length === 0) return;

        const url = editingPlan
            ? updateNettoyage.url(editingPlan.id)
            : storeNettoyage.url();
        const method = editingPlan ? 'put' : 'post';
        const data = editingPlan
            ? {
                  taches_json: selectedTaches.map((t) => ({ ...t })),
                  statut: editingPlan.statut,
              }
            : {
                  date: newPlanDate,
                  taches_json: selectedTaches.map((t) => ({ ...t })),
              };

        router[method](url, data, {
            onSuccess: () => {
                setPlanModalOpen(false);
                setEditingPlan(null);
                setSelectedTaches(defaultTasks.map((t) => ({ ...t })));
                setNewPlanDate(new Date().toISOString().split('T')[0]);
            },
        });
    };

    const toggleTache = (plan: HaccpNettoyage, idx: number) => {
        const updated = [...plan.taches_json];
        updated[idx].fait = !updated[idx].fait;
        router.put(updateNettoyage.url(plan.id), {
            taches_json: updated,
            statut: plan.statut,
        });
    };

    const validatePlan = (plan: HaccpNettoyage) => {
        const allDone = (plan.taches_json || []).every((t) => t.fait);
        if (!allDone) return;
        router.put(updateNettoyage.url(plan.id), {
            taches_json: plan.taches_json,
            statut: 'VALIDE',
        });
    };

    // ============================================
    // FOURNISSEURS
    // ============================================
    const [fournisseurModalOpen, setFournisseurModalOpen] = useState(false);
    const fournisseurForm = useForm({
        fournisseur: '',
        bl_number: '',
        categorie: 'FRAIS' as 'AMBIANT' | 'FRAIS' | 'SURGELE',
        temperature: '',
        commentaire: '',
        date: new Date().toISOString().split('T')[0],
    });

    const [conformeTemp, setConformeTemp] = useState(true);

    const checkAutoConformite = () => {
        const temp = parseFloat(fournisseurForm.data.temperature);
        if (isNaN(temp)) return;
        if (fournisseurForm.data.categorie === 'FRAIS')
            setConformeTemp(temp <= 4);
        else if (fournisseurForm.data.categorie === 'SURGELE')
            setConformeTemp(temp <= -18);
        else setConformeTemp(true);
    };

    const submitFournisseur = (e: React.FormEvent) => {
        e.preventDefault();
        if (
            !fournisseurForm.data.fournisseur ||
            !fournisseurForm.data.bl_number
        )
            return;
        fournisseurForm.post(storeFournisseur.url(), {
            onSuccess: () => {
                fournisseurForm.reset();
                setConformeTemp(true);
                setFournisseurModalOpen(false);
            },
        });
    };

    // ============================================
    // FORMATAGE DES DATES
    // ============================================
    const formatDateShort = (d: string) => {
        return new Date(d).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const formatDateLong = (d: string) => {
        return new Date(d).toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatTime = (d: string) => {
        return new Date(d).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDateForGroup = (d: string) => {
        return new Date(d).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const stats = {
        temperatures: temperatures.length,
        alertes: temperatures.filter((t) =>
            isTempAlert(t.temperature, t.enceinte),
        ).length,
        plansValides: plans.filter((p) => p.statut === 'VALIDE').length,
        controlesNonConformes: controles.filter((c) => !c.conforme).length,
    };

    const groupedTemperatures = temperatures.reduce(
        (acc, t) => {
            const dateKey = formatDateForGroup(t.date);
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(t);
            return acc;
        },
        {} as Record<string, typeof temperatures>,
    );

    const todayDateFormatted = formatDateLong(
        new Date().toISOString().split('T')[0],
    );

    return (
        <div className="haccp-page">
            {/* ── PAGE HEADER ── */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">HACCP</h1>
                    <p className="page-subtitle">Traçabilité et conformité</p>
                </div>
            </div>

            {/* ── STATS CARDS ── */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon stat-icon--orange">
                        <Thermometer size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Relevés température</div>
                        <div className="stat-value">{stats.temperatures}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div
                        className={`stat-icon ${stats.alertes > 0 ? 'stat-icon--danger' : 'stat-icon--orange'}`}
                    >
                        <AlertCircle size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Alertes température</div>
                        <div
                            className={`stat-value ${stats.alertes > 0 ? 'stat-value--danger' : ''}`}
                        >
                            {stats.alertes}
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon--success">
                        <Sparkles size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Plans validés</div>
                        <div className="stat-value stat-value--success">
                            {stats.plansValides}
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div
                        className={`stat-icon ${stats.controlesNonConformes > 0 ? 'stat-icon--danger' : 'stat-icon--orange'}`}
                    >
                        <Truck size={22} strokeWidth={1.5} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Non-conformités fourn.</div>
                        <div
                            className={`stat-value ${stats.controlesNonConformes > 0 ? 'stat-value--danger' : ''}`}
                        >
                            {stats.controlesNonConformes}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── TABS ── */}
            <div className="tabs">
                <button
                    onClick={() => setActiveTab('temperatures')}
                    className={`tab-btn ${activeTab === 'temperatures' ? 'active' : ''}`}
                >
                    <Thermometer size={16} strokeWidth={1.5} />
                    Températures
                </button>
                <button
                    onClick={() => setActiveTab('nettoyage')}
                    className={`tab-btn ${activeTab === 'nettoyage' ? 'active' : ''}`}
                >
                    <Sparkles size={16} strokeWidth={1.5} />
                    Nettoyage
                </button>
                <button
                    onClick={() => setActiveTab('fournisseurs')}
                    className={`tab-btn ${activeTab === 'fournisseurs' ? 'active' : ''}`}
                >
                    <Truck size={16} strokeWidth={1.5} />
                    Réceptions fournisseurs
                </button>
            </div>

            {/* ============================================ */}
            {/* TAB TEMPÉRATURES */}
            {/* ============================================ */}
            {activeTab === 'temperatures' && (
                <div className="tab-content">
                    <div className="table-card">
                        <div className="table-header">
                            <div className="table-title">
                                <div className="table-dot" />
                                <span>Relevés de température</span>
                            </div>
                            <button
                                onClick={() => setTempModalOpen(true)}
                                className="btn-primary-sm"
                            >
                                <Plus size={14} strokeWidth={1.5} />
                                Nouveau relevé
                            </button>
                        </div>

                        {Object.keys(groupedTemperatures).length === 0 ? (
                            <div className="empty-state-card">
                                <Thermometer size={48} strokeWidth={1} />
                                <div className="empty-state-text">
                                    Aucun relevé de température
                                </div>
                            </div>
                        ) : (
                            <div className="records-list">
                                {Object.entries(groupedTemperatures).map(
                                    ([date, entries]) => (
                                        <div
                                            key={date}
                                            className="record-group"
                                        >
                                            <div className="record-group-header">
                                                <Calendar
                                                    size={16}
                                                    strokeWidth={1.5}
                                                />
                                                <span>{date}</span>
                                            </div>
                                            <div className="record-group-body">
                                                {entries.map((t) => {
                                                    const alert = isTempAlert(
                                                        t.temperature,
                                                        t.enceinte,
                                                    );
                                                    return (
                                                        <div
                                                            key={t.id}
                                                            className={`record-item ${alert ? 'alert' : ''}`}
                                                        >
                                                            <div className="record-info">
                                                                <div className="record-name">
                                                                    {t.enceinte}
                                                                </div>
                                                                <div className="record-meta">
                                                                    <Clock
                                                                        size={
                                                                            12
                                                                        }
                                                                        strokeWidth={
                                                                            1.5
                                                                        }
                                                                    />
                                                                    <span>
                                                                        {formatTime(
                                                                            t.date,
                                                                        )}
                                                                    </span>
                                                                    <User
                                                                        size={
                                                                            12
                                                                        }
                                                                        strokeWidth={
                                                                            1.5
                                                                        }
                                                                    />
                                                                    <span>
                                                                        {t
                                                                            .creator
                                                                            ?.nom ||
                                                                            '—'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="record-value-group">
                                                                {alert && (
                                                                    <span className="alert-badge">
                                                                        <AlertCircle
                                                                            size={
                                                                                12
                                                                            }
                                                                            strokeWidth={
                                                                                1.5
                                                                            }
                                                                        />
                                                                        ALERTE
                                                                    </span>
                                                                )}
                                                                <span
                                                                    className={`record-value ${alert ? 'text-danger' : 'text-orange'}`}
                                                                >
                                                                    {
                                                                        t.temperature
                                                                    }
                                                                    °C
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ============================================ */}
            {/* TAB NETTOYAGE */}
            {/* ============================================ */}
            {activeTab === 'nettoyage' && (
                <div className="tab-content">
                    {/* Plan du jour */}
                    <div className="plan-card">
                        <div className="plan-card-header">
                            <div>
                                <div className="plan-title">Plan du jour</div>
                                <div className="plan-date">
                                    {todayDateFormatted}
                                </div>
                            </div>
                            {todayPlan ? (
                                todayPlan.statut === 'VALIDE' ? (
                                    <div className="validated-badge">
                                        <CheckCircle
                                            size={14}
                                            strokeWidth={1.5}
                                        />
                                        Validé par {todayPlan.validateur?.nom}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() =>
                                            openEditPlanModal(todayPlan)
                                        }
                                        className="btn-ghost"
                                    >
                                        <Pencil size={14} strokeWidth={1.5} />
                                        Modifier
                                    </button>
                                )
                            ) : (
                                <button
                                    onClick={openCreatePlanModal}
                                    className="btn-primary-sm"
                                >
                                    <Plus size={14} strokeWidth={1.5} />
                                    Créer le plan
                                </button>
                            )}
                        </div>

                        {todayPlan ? (
                            <>
                                {todayPlan.statut !== 'VALIDE' &&
                                    hasRole('RESP_LABO', 'RESP_BOUTIQUE') && (
                                        <button
                                            onClick={() =>
                                                validatePlan(todayPlan)
                                            }
                                            className="validate-btn"
                                            disabled={
                                                !todayPlan.taches_json?.every(
                                                    (t) => t.fait,
                                                )
                                            }
                                        >
                                            <CheckCircle
                                                size={16}
                                                strokeWidth={1.5}
                                            />
                                            Valider le plan (toutes les tâches
                                            doivent être cochées)
                                        </button>
                                    )}

                                <div className="tasks-list">
                                    {(todayPlan.taches_json || []).map(
                                        (tache, idx) => (
                                            <label
                                                key={idx}
                                                className={`task-item ${todayPlan.statut === 'VALIDE' ? 'disabled' : ''}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={tache.fait}
                                                    onChange={() =>
                                                        todayPlan.statut !==
                                                            'VALIDE' &&
                                                        toggleTache(
                                                            todayPlan,
                                                            idx,
                                                        )
                                                    }
                                                    disabled={
                                                        todayPlan.statut ===
                                                        'VALIDE'
                                                    }
                                                    className="task-checkbox"
                                                />
                                                <span
                                                    className={`task-name ${tache.fait ? 'completed' : ''}`}
                                                >
                                                    {tache.nom}
                                                </span>
                                                <span
                                                    className={`task-status ${tache.fait ? 'done' : 'pending'}`}
                                                >
                                                    {tache.fait
                                                        ? 'Fait'
                                                        : 'À faire'}
                                                </span>
                                            </label>
                                        ),
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="plan-empty">
                                <Sparkles size={32} strokeWidth={1} />
                                <p>Aucun plan créé pour aujourd'hui</p>
                            </div>
                        )}
                    </div>

                    {/* Historique */}
                    {historicalPlans.length > 0 && (
                        <div className="history-card">
                            <div className="history-header">
                                <FileCheck size={16} strokeWidth={1.5} />
                                <span>Historique des plans</span>
                            </div>
                            <div className="history-list">
                                {historicalPlans.map((p) => (
                                    <div key={p.id} className="history-item">
                                        <div className="history-info">
                                            <span className="history-date">
                                                {formatDateLong(p.date)}
                                            </span>
                                            <span
                                                className={`history-status ${p.statut === 'VALIDE' ? 'validated' : 'pending'}`}
                                            >
                                                {p.statut === 'VALIDE'
                                                    ? `Validé par ${p.validateur?.nom}`
                                                    : 'En cours'}
                                            </span>
                                        </div>
                                        <div className="history-count">
                                            {p.taches_json?.length || 0}{' '}
                                            tâche(s)
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ============================================ */}
            {/* TAB FOURNISSEURS */}
            {/* ============================================ */}
            {activeTab === 'fournisseurs' && (
                <div className="tab-content">
                    <div className="table-card">
                        <div className="table-header">
                            <div className="table-title">
                                <div className="table-dot" />
                                <span>Contrôles réception fournisseurs</span>
                            </div>
                            <button
                                onClick={() => setFournisseurModalOpen(true)}
                                className="btn-primary-sm"
                            >
                                <Plus size={14} strokeWidth={1.5} />
                                Nouveau contrôle
                            </button>
                        </div>

                        {controles.length === 0 ? (
                            <div className="empty-state-card">
                                <Truck size={48} strokeWidth={1} />
                                <div className="empty-state-text">
                                    Aucun contrôle de réception enregistré
                                </div>
                            </div>
                        ) : (
                            <div className="controls-list">
                                {controles.map((c) => (
                                    <div
                                        key={c.id}
                                        className={`control-item ${c.conforme ? 'conforme' : 'non-conforme'}`}
                                    >
                                        <div className="control-header">
                                            <div>
                                                <div className="control-fournisseur">
                                                    {c.fournisseur}
                                                </div>
                                                <div className="control-meta">
                                                    <span>
                                                        BL {c.bl_number || '-'}
                                                    </span>
                                                    <span>•</span>
                                                    <span>
                                                        {formatDateShort(
                                                            c.date,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                            <div
                                                className={`control-badge ${c.conforme ? 'conforme' : 'non-conforme'}`}
                                            >
                                                {c.conforme
                                                    ? 'CONFORME'
                                                    : 'NON CONFORME'}
                                            </div>
                                        </div>
                                        <div className="control-details">
                                            <span
                                                className={`category-badge ${c.categorie === 'FRAIS' ? 'frais' : c.categorie === 'SURGELE' ? 'surgele' : 'ambiant'}`}
                                            >
                                                {c.categorie}
                                            </span>
                                            {c.temperature !== null && (
                                                <span className="control-temp">
                                                    {c.temperature}°C
                                                    {!c.conforme && (
                                                        <span className="nc-indicator">
                                                            ⚠ NC créée
                                                        </span>
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                        {c.commentaire && (
                                            <div className="control-commentaire">
                                                {c.commentaire}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── MODAL TEMPÉRATURE ── */}
            {tempModalOpen && (
                <div
                    className="modal-overlay"
                    onClick={() => setTempModalOpen(false)}
                >
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">
                                    Nouveau relevé de température
                                </h3>
                                <p className="modal-subtitle">
                                    Enregistrer une mesure de température
                                </p>
                            </div>
                            <button
                                onClick={() => setTempModalOpen(false)}
                                className="modal-close"
                            >
                                <X size={18} strokeWidth={1.5} />
                            </button>
                        </div>
                        <form onSubmit={submitTemperature}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">
                                        Enceinte *
                                    </label>
                                    <input
                                        type="text"
                                        value={tempForm.data.enceinte}
                                        onChange={(e) =>
                                            tempForm.setData(
                                                'enceinte',
                                                e.target.value,
                                            )
                                        }
                                        className="form-input"
                                        placeholder="Ex: Chambre froide 1"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Température (°C) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={tempForm.data.temperature}
                                        onChange={(e) =>
                                            tempForm.setData(
                                                'temperature',
                                                e.target.value,
                                            )
                                        }
                                        className="form-input temp-input"
                                        placeholder="0.0"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Date & heure *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={tempForm.data.date}
                                        onChange={(e) =>
                                            tempForm.setData(
                                                'date',
                                                e.target.value,
                                            )
                                        }
                                        className="form-input"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    onClick={() => setTempModalOpen(false)}
                                    className="btn-neutral"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={tempForm.processing}
                                    className="btn-primary"
                                >
                                    {tempForm.processing ? (
                                        <span className="spinner" />
                                    ) : (
                                        <Thermometer
                                            size={16}
                                            strokeWidth={1.5}
                                        />
                                    )}
                                    {tempForm.processing
                                        ? 'Enregistrement...'
                                        : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MODAL PLAN NETTOYAGE ── */}
            {planModalOpen && (
                <div
                    className="modal-overlay"
                    onClick={() => setPlanModalOpen(false)}
                >
                    <div
                        className="modal modal-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">
                                    {editingPlan
                                        ? 'Modifier le plan de nettoyage'
                                        : 'Créer le plan de nettoyage'}
                                </h3>
                                <p className="modal-subtitle">
                                    {editingPlan
                                        ? 'Modifier les tâches du plan'
                                        : 'Sélectionnez les tâches à effectuer'}
                                </p>
                            </div>
                            <button
                                onClick={() => setPlanModalOpen(false)}
                                className="modal-close"
                            >
                                <X size={18} strokeWidth={1.5} />
                            </button>
                        </div>
                        <div className="modal-body">
                            {!editingPlan && (
                                <div className="form-group">
                                    <label className="form-label">Date</label>
                                    <input
                                        type="date"
                                        value={newPlanDate}
                                        onChange={(e) =>
                                            setNewPlanDate(e.target.value)
                                        }
                                        className="form-input"
                                    />
                                </div>
                            )}

                            <div className="tasks-selector">
                                <div className="tasks-selector-title">
                                    Tâches prédéfinies
                                </div>
                                <div className="tasks-grid">
                                    {defaultTasks.map((tache) => (
                                        <label
                                            key={tache.nom}
                                            className="task-check"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedTaches.some(
                                                    (t) => t.nom === tache.nom,
                                                )}
                                                onChange={() =>
                                                    toggleTachePredefinie(
                                                        tache.nom,
                                                    )
                                                }
                                                className="task-checkbox"
                                            />
                                            <span>{tache.nom}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="custom-task">
                                <div className="custom-task-title">
                                    Tâche personnalisée
                                </div>
                                <div className="custom-task-input-group">
                                    <input
                                        type="text"
                                        value={newTacheCustom}
                                        onChange={(e) =>
                                            setNewTacheCustom(e.target.value)
                                        }
                                        onKeyDown={(e) =>
                                            e.key === 'Enter' &&
                                            addTacheCustom()
                                        }
                                        className="form-input"
                                        placeholder="Nouvelle tâche..."
                                    />
                                    <button
                                        type="button"
                                        onClick={addTacheCustom}
                                        className="btn-secondary"
                                    >
                                        <Plus size={14} strokeWidth={1.5} />
                                        Ajouter
                                    </button>
                                </div>
                            </div>

                            {selectedTaches.filter(
                                (t) =>
                                    !defaultTasks.some(
                                        (dt) => dt.nom === t.nom,
                                    ),
                            ).length > 0 && (
                                <div className="custom-tasks-list">
                                    <div className="custom-tasks-title">
                                        Tâches personnalisées
                                    </div>
                                    {selectedTaches
                                        .filter(
                                            (t) =>
                                                !defaultTasks.some(
                                                    (dt) => dt.nom === t.nom,
                                                ),
                                        )
                                        .map((tache, idx) => (
                                            <div
                                                key={idx}
                                                className="custom-task-item"
                                            >
                                                <span>{tache.nom}</span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedTaches(
                                                            (prev) =>
                                                                prev.filter(
                                                                    (t) =>
                                                                        t.nom !==
                                                                        tache.nom,
                                                                ),
                                                        )
                                                    }
                                                    className="remove-btn"
                                                >
                                                    <X
                                                        size={14}
                                                        strokeWidth={1.5}
                                                    />
                                                </button>
                                            </div>
                                        ))}
                                </div>
                            )}

                            <div className="tasks-count">
                                {selectedTaches.length} tâche(s) sélectionnée(s)
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                onClick={() => setPlanModalOpen(false)}
                                className="btn-neutral"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={submitPlan}
                                disabled={selectedTaches.length === 0}
                                className="btn-primary"
                            >
                                <Sparkles size={16} strokeWidth={1.5} />
                                {editingPlan
                                    ? 'Mettre à jour'
                                    : 'Créer le plan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL FOURNISSEUR ── */}
            {fournisseurModalOpen && (
                <div
                    className="modal-overlay"
                    onClick={() => setFournisseurModalOpen(false)}
                >
                    <div
                        className="modal modal-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">
                                    Contrôle réception fournisseur
                                </h3>
                                <p className="modal-subtitle">
                                    Enregistrer un contrôle de réception
                                </p>
                            </div>
                            <button
                                onClick={() => setFournisseurModalOpen(false)}
                                className="modal-close"
                            >
                                <X size={18} strokeWidth={1.5} />
                            </button>
                        </div>
                        <form onSubmit={submitFournisseur}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">
                                            Fournisseur *
                                        </label>
                                        <input
                                            type="text"
                                            value={
                                                fournisseurForm.data.fournisseur
                                            }
                                            onChange={(e) =>
                                                fournisseurForm.setData(
                                                    'fournisseur',
                                                    e.target.value,
                                                )
                                            }
                                            className="form-input"
                                            placeholder="Nom du fournisseur"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">
                                            N° BL *
                                        </label>
                                        <input
                                            type="text"
                                            value={
                                                fournisseurForm.data.bl_number
                                            }
                                            onChange={(e) =>
                                                fournisseurForm.setData(
                                                    'bl_number',
                                                    e.target.value,
                                                )
                                            }
                                            className="form-input"
                                            placeholder="BL-XXXX"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">
                                            Catégorie
                                        </label>
                                        <select
                                            value={
                                                fournisseurForm.data.categorie
                                            }
                                            onChange={(e) => {
                                                fournisseurForm.setData(
                                                    'categorie',
                                                    e.target.value as any,
                                                );
                                                checkAutoConformite();
                                            }}
                                            className="form-select"
                                        >
                                            <option value="AMBIANT">
                                                Ambiant
                                            </option>
                                            <option value="FRAIS">
                                                Frais (max 4°C)
                                            </option>
                                            <option value="SURGELE">
                                                Surgelé (max -18°C)
                                            </option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">
                                            Température (°C)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={
                                                fournisseurForm.data.temperature
                                            }
                                            onChange={(e) => {
                                                fournisseurForm.setData(
                                                    'temperature',
                                                    e.target.value,
                                                );
                                                checkAutoConformite();
                                            }}
                                            className="form-input"
                                            placeholder="0.0"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">
                                            Date
                                        </label>
                                        <input
                                            type="date"
                                            value={fournisseurForm.data.date}
                                            onChange={(e) =>
                                                fournisseurForm.setData(
                                                    'date',
                                                    e.target.value,
                                                )
                                            }
                                            className="form-input"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Commentaire (optionnel)
                                    </label>
                                    <textarea
                                        value={fournisseurForm.data.commentaire}
                                        onChange={(e) =>
                                            fournisseurForm.setData(
                                                'commentaire',
                                                e.target.value,
                                            )
                                        }
                                        className="form-textarea"
                                        rows={2}
                                        placeholder="Commentaire..."
                                    />
                                </div>
                                <div className="conformite-buttons">
                                    <button
                                        type="button"
                                        onClick={() => setConformeTemp(true)}
                                        className={`conformite-btn ${conformeTemp ? 'conforme active' : ''}`}
                                    >
                                        <CheckCircle
                                            size={16}
                                            strokeWidth={1.5}
                                        />
                                        Conforme
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConformeTemp(false)}
                                        className={`conformite-btn ${!conformeTemp ? 'non-conforme active' : ''}`}
                                    >
                                        <X size={16} strokeWidth={1.5} />
                                        Non conforme
                                    </button>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setFournisseurModalOpen(false)
                                    }
                                    className="btn-neutral"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={fournisseurForm.processing}
                                    className="btn-primary"
                                >
                                    {fournisseurForm.processing ? (
                                        <span className="spinner" />
                                    ) : (
                                        <Truck size={16} strokeWidth={1.5} />
                                    )}
                                    {fournisseurForm.processing
                                        ? 'Enregistrement...'
                                        : 'Enregistrer le contrôle'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .haccp-page {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                /* Header */
                .page-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 1rem;
                }
                .page-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-1);
                    margin-bottom: 0.25rem;
                }
                .page-subtitle {
                    font-size: 0.8rem;
                    color: var(--text-3);
                }

                /* Stats Grid */
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                }
                @media (min-width: 640px) {
                    .stats-grid {
                        grid-template-columns: repeat(4, 1fr);
                    }
                }
                .stat-card {
                    background: var(--bg-card);
                    border-radius: 14px;
                    padding: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.85rem;
                    border: 1px solid var(--border);
                    transition: all 0.25s ease;
                }
                .stat-card:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-sm);
                }
                .stat-icon {
                    width: 50px;
                    height: 50px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .stat-icon--orange {
                    background: rgba(232, 116, 42, 0.1);
                    color: var(--orange);
                }
                .stat-icon--success {
                    background: rgba(30, 158, 106, 0.1);
                    color: var(--success);
                }
                .stat-icon--danger {
                    background: rgba(214, 59, 59, 0.1);
                    color: var(--danger);
                }
                .stat-content {
                    flex: 1;
                }
                .stat-label {
                    font-size: 0.7rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: var(--text-3);
                    margin-bottom: 0.25rem;
                }
                .stat-value {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: var(--orange);
                    line-height: 1.2;
                }
                .stat-value--danger {
                    color: var(--danger);
                }
                .stat-value--success {
                    color: var(--success);
                }

                /* Tabs */
                .tabs {
                    display: flex;
                    gap: 4px;
                    background: var(--bg-card-2);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    padding: 4px;
                    width: fit-content;
                }
                .tab-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1.2rem;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: var(--text-3);
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .tab-btn:hover {
                    color: var(--text-1);
                }
                .tab-btn.active {
                    background: var(--bg-card);
                    color: var(--orange);
                    box-shadow: var(--shadow-sm);
                }

                /* Tab Content */
                .tab-content {
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                }

                /* Table Card */
                .table-card {
                    background: var(--bg-card);
                    border-radius: 14px;
                    border: 1px solid var(--border);
                    overflow: hidden;
                }
                .table-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1rem 1.25rem;
                    border-bottom: 1px solid var(--border);
                }
                .table-title {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.85rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--text-2);
                }
                .table-dot {
                    width: 8px;
                    height: 8px;
                    background: var(--orange);
                    border-radius: 50%;
                }

                /* Records List */
                .records-list {
                    display: flex;
                    flex-direction: column;
                }
                .record-group {
                    border-bottom: 1px solid var(--border);
                }
                .record-group:last-child {
                    border-bottom: none;
                }
                .record-group-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.25rem;
                    background: linear-gradient(135deg, var(--orange), var(--orange-lt));
                    border-bottom: 1px solid var(--border);
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: white;
                }
                .record-group-body {
                    padding: 0.25rem 0;
                }
                .record-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1rem 1.25rem;
                    border-bottom: 1px solid var(--border);
                    transition: background 0.2s;
                }
                .record-item:last-child {
                    border-bottom: none;
                }
                .record-item.alert {
                    background: rgba(214, 59, 59, 0.03);
                }
                .record-item:hover {
                    background: var(--bg-card-2);
                }
                .record-info {
                    flex: 1;
                }
                .record-name {
                    font-weight: 600;
                    color: var(--text-1);
                    margin-bottom: 0.25rem;
                }
                .record-meta {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-size: 0.7rem;
                    color: var(--text-3);
                }
                .record-value-group {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                .alert-badge {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    padding: 0.2rem 0.5rem;
                    background: rgba(214, 59, 59, 0.1);
                    color: var(--danger);
                    border-radius: 20px;
                    font-size: 0.65rem;
                    font-weight: 600;
                }
                .record-value {
                    font-size: 1.4rem;
                    font-weight: 700;
                }
                .text-danger {
                    color: var(--danger);
                }
                .text-orange {
                    color: var(--orange);
                }

                /* Plan Card */
                .plan-card {
                    background: var(--bg-card);
                    border-radius: 14px;
                    border: 1px solid var(--border);
                    overflow: hidden;
                }
                .plan-card-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1rem 1.25rem;
                    border-bottom: 1px solid var(--border);
                }
                .plan-title {
                    font-size: 1rem;
                    font-weight: 700;
                    color: var(--text-1);
                }
                .plan-date {
                    font-size: 0.75rem;
                    color: var(--text-3);
                    margin-top: 2px;
                }
                .validated-badge {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.3rem 0.8rem;
                    background: rgba(30, 158, 106, 0.1);
                    color: var(--success);
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 600;
                }
                .validate-btn {
                    margin: 1rem 1.25rem 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    width: calc(100% - 2.5rem);
                    padding: 0.6rem;
                    background: rgba(30, 158, 106, 0.1);
                    color: var(--success);
                    border: 1px solid rgba(30, 158, 106, 0.3);
                    border-radius: 10px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .validate-btn:hover {
                    background: var(--success);
                    color: white;
                }
                .validate-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .tasks-list {
                    padding: 1rem 1.25rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .task-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem;
                    border-radius: 10px;
                    transition: background 0.2s;
                    cursor: pointer;
                }
                .task-item:hover {
                    background: var(--bg-card-2);
                }
                .task-item.disabled {
                    cursor: not-allowed;
                    opacity: 0.6;
                }
                .task-checkbox {
                    width: 18px;
                    height: 18px;
                    border-radius: 4px;
                    accent-color: var(--orange);
                    cursor: pointer;
                }
                .task-name {
                    flex: 1;
                    font-size: 0.85rem;
                    color: var(--text-1);
                }
                .task-name.completed {
                    text-decoration: line-through;
                    color: var(--text-3);
                }
                .task-status {
                    font-size: 0.65rem;
                    font-weight: 600;
                    padding: 0.2rem 0.5rem;
                    border-radius: 20px;
                }
                .task-status.done {
                    background: rgba(30, 158, 106, 0.1);
                    color: var(--success);
                }
                .task-status.pending {
                    background: rgba(245, 158, 11, 0.1);
                    color: #f59e0b;
                }
                .plan-empty {
                    text-align: center;
                    padding: 2rem;
                    color: var(--text-3);
                }

                /* History Card */
                .history-card {
                    background: var(--bg-card);
                    border-radius: 14px;
                    border: 1px solid var(--border);
                    overflow: hidden;
                }
                .history-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 1rem 1.25rem;
                    border-bottom: 1px solid var(--border);
                    font-size: 0.85rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--text-2);
                }
                .history-list {
                    padding: 0.5rem 0;
                }
                .history-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0.75rem 1.25rem;
                    border-bottom: 1px solid var(--border);
                }
                .history-item:last-child {
                    border-bottom: none;
                }
                .history-info {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                }
                .history-date {
                    font-weight: 600;
                    color: var(--text-1);
                    font-size: 0.85rem;
                }
                .history-status {
                    font-size: 0.7rem;
                    padding: 0.2rem 0.5rem;
                    border-radius: 20px;
                }
                .history-status.validated {
                    background: rgba(30, 158, 106, 0.1);
                    color: var(--success);
                }
                .history-status.pending {
                    background: rgba(245, 158, 11, 0.1);
                    color: #f59e0b;
                }
                .history-count {
                    font-size: 0.75rem;
                    color: var(--text-3);
                }

                /* Supplier Controls */
                .controls-list {
                    display: flex;
                    flex-direction: column;
                }
                .control-item {
                    padding: 1rem 1.25rem;
                    border-bottom: 1px solid var(--border);
                    transition: background 0.2s;
                }
                .control-item:last-child {
                    border-bottom: none;
                }
                .control-item.conforme {
                    border-left: 4px solid var(--success);
                }
                .control-item.non-conforme {
                    border-left: 4px solid var(--danger);
                }
                .control-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    margin-bottom: 0.5rem;
                }
                .control-fournisseur {
                    font-weight: 700;
                    color: var(--text-1);
                    margin-bottom: 0.25rem;
                }
                .control-meta {
                    display: flex;
                    gap: 0.5rem;
                    font-size: 0.7rem;
                    color: var(--text-3);
                }
                .control-badge {
                    font-size: 0.65rem;
                    font-weight: 700;
                    padding: 0.2rem 0.6rem;
                    border-radius: 20px;
                }
                .control-badge.conforme {
                    background: rgba(30, 158, 106, 0.1);
                    color: var(--success);
                }
                .control-badge.non-conforme {
                    background: rgba(214, 59, 59, 0.1);
                    color: var(--danger);
                }
                .control-details {
                    display: flex;
                    gap: 0.75rem;
                    align-items: center;
                    margin-top: 0.5rem;
                }
                .category-badge {
                    font-size: 0.7rem;
                    font-weight: 600;
                    padding: 0.2rem 0.5rem;
                    border-radius: 20px;
                }
                .category-badge.frais {
                    background: rgba(59, 91, 219, 0.1);
                    color: var(--blue);
                }
                .category-badge.surgele {
                    background: rgba(139, 92, 246, 0.1);
                    color: #8b5cf6;
                }
                .category-badge.ambiant {
                    background: rgba(107, 114, 128, 0.1);
                    color: #6b7280;
                }
                .control-temp {
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: var(--text-2);
                }
                .nc-indicator {
                    margin-left: 0.5rem;
                    font-size: 0.7rem;
                    color: var(--danger);
                }
                .control-commentaire {
                    margin-top: 0.5rem;
                    padding: 0.5rem;
                    background: var(--bg-card-2);
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-style: italic;
                    color: var(--orange);
                }

                /* Empty State */
                .empty-state-card {
                    background: var(--bg-card-2);
                    text-align: center;
                    padding: 3rem;
                    color: var(--text-3);
                }
                .empty-state-text {
                    margin-top: 1rem;
                    font-size: 0.9rem;
                }

                /* Form Elements */
                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                    margin-bottom: 1rem;
                }
                .form-row {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1rem;
                }
                @media (min-width: 640px) {
                    .form-row {
                        grid-template-columns: 1fr 1fr;
                    }
                }
                .form-label {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--text-3);
                }
                .form-input, .form-select, .form-textarea {
                    padding: 0.65rem 0.9rem;
                    font-size: 0.9rem;
                    border-radius: 10px;
                    border: 1.5px solid var(--border);
                    background: var(--bg-card);
                    transition: all 0.2s;
                    width: 100%;
                }
                .form-input:focus, .form-select:focus, .form-textarea:focus {
                    outline: none;
                    border-color: var(--orange);
                    box-shadow: 0 0 0 3px rgba(232, 116, 42, 0.1);
                }
                .temp-input {
                    text-align: center;
                    font-weight: 700;
                    font-size: 1rem;
                }

                /* Tasks Selector */
                .tasks-selector {
                    margin-bottom: 1rem;
                }
                .tasks-selector-title {
                    font-size: 0.75rem;
                    font-weight: 700;
                    margin-bottom: 0.5rem;
                    color: var(--text-3);
                }
                .tasks-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 0.5rem;
                }
                .task-check {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.4rem 0.5rem;
                    background: var(--bg-card-2);
                    border-radius: 8px;
                    font-size: 0.75rem;
                    cursor: pointer;
                }
                .custom-task {
                    margin-bottom: 1rem;
                }
                .custom-task-title {
                    font-size: 0.75rem;
                    font-weight: 700;
                    margin-bottom: 0.5rem;
                    color: var(--text-3);
                }
                .custom-task-input-group {
                    display: flex;
                    gap: 0.5rem;
                }
                .custom-tasks-list {
                    margin-bottom: 1rem;
                }
                .custom-tasks-title {
                    font-size: 0.75rem;
                    font-weight: 700;
                    margin-bottom: 0.5rem;
                    color: var(--text-3);
                }
                .custom-task-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0.5rem;
                    background: rgba(232, 116, 42, 0.05);
                    border-radius: 8px;
                    margin-bottom: 0.25rem;
                }
                .remove-btn {
                    background: transparent;
                    border: none;
                    color: var(--danger);
                    cursor: pointer;
                }
                .tasks-count {
                    font-size: 0.7rem;
                    color: var(--text-3);
                    text-align: center;
                    margin-top: 0.5rem;
                }

                /* Conformite Buttons */
                .conformite-buttons {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }
                .conformite-btn {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.6rem;
                    background: var(--bg-card-2);
                    border: 1.5px solid var(--border);
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .conformite-btn.active.conforme {
                    background: rgba(30, 158, 106, 0.15);
                    border-color: var(--success);
                    color: var(--success);
                }
                .conformite-btn.active.non-conforme {
                    background: rgba(214, 59, 59, 0.15);
                    border-color: var(--danger);
                    color: var(--danger);
                }

                /* Buttons */
                .btn-primary {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.6rem 1.2rem;
                    background: linear-gradient(135deg, var(--orange), var(--orange-lt));
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.25s ease;
                }
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(232, 116, 42, 0.35);
                }
                .btn-primary-sm {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.5rem 0.8rem;
                    background: linear-gradient(135deg, var(--orange), var(--orange-lt));
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                }
                .btn-ghost {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.35rem 0.8rem;
                    background: transparent;
                    color: var(--orange);
                    border: 1px solid rgba(232, 116, 42, 0.3);
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    cursor: pointer;
                }
                .btn-ghost:hover {
                    background: rgba(232, 116, 42, 0.1);
                }
                .btn-secondary {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.4rem 0.8rem;
                    background: var(--bg-card-2);
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    cursor: pointer;
                }
                .btn-neutral {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    background: transparent;
                    color: var(--text-2);
                    border: 1px solid var(--border);
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 500;
                    cursor: pointer;
                }
                .btn-neutral:hover {
                    background: var(--bg-card-2);
                }

                /* Modal */
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
                    animation: overlayIn 0.2s ease;
                }
                @keyframes overlayIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .modal {
                    background: var(--bg-card);
                    border-radius: 20px;
                    max-width: 560px;
                    width: 100%;
                    animation: modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    overflow: hidden;
                }
                .modal-lg {
                    max-width: 680px;
                }
                @keyframes modalIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95) translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
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
                    transition: all 0.2s;
                }
                .modal-close:hover {
                    background: rgba(214, 59, 59, 0.1);
                    color: var(--danger);
                }
                .modal-body {
                    padding: 1.5rem;
                    max-height: 60vh;
                    overflow-y: auto;
                }
                .modal-footer {
                    padding: 1rem 1.5rem 1.5rem;
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    background: var(--bg-card-2);
                    border-top: 1px solid var(--border);
                }

                /* Spinner */
                .spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                    display: inline-block;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
