import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    RadialBarChart,
    RadialBar,
} from 'recharts';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Package,
    Store,
    Award,
} from 'lucide-react';

interface ReportingIndexProps {
    ca_total: number;
    marge_globale: number;
    taux_marge: number;
    taux_invendus: number;
    by_boulangerie: Array<{
        entity: { id: number; nom: string };
        ca: number;
        marge: number;
        taux_marge: number;
        taux_invendus: number;
        nb_ventes: number;
    }>;
    top_products: Array<{
        product: { id: number; nom: string; category: { nom: string } };
        qte_vendue: number;
    }>;
}

export default function ReportingIndex({
    ca_total,
    marge_globale,
    taux_marge,
    taux_invendus,
    by_boulangerie,
    top_products,
}: ReportingIndexProps) {
    const pieData = [
        {
            name: 'Coût des ventes',
            value: ca_total - marge_globale,
            color: '#3b5bdb',
        },
        { name: 'Marge brute', value: marge_globale, color: '#e8742a' },
    ];

    const barDataBoutiques = by_boulangerie.map((b) => ({
        nom:
            b.entity.nom.length > 15
                ? b.entity.nom.substring(0, 12) + '...'
                : b.entity.nom,
        ca: b.ca,
        marge: b.marge,
        taux_marge: b.taux_marge,
    }));

    const barDataProducts = top_products.slice(0, 8).map((p) => ({
        nom:
            p.product.nom.length > 20
                ? p.product.nom.substring(0, 17) + '...'
                : p.product.nom,
        qte: p.qte_vendue,
    }));

    const COLORS = ['#3b5bdb', '#e8742a', '#1e9e6a', '#8b5cf6', '#f59e0b'];

    const meilleureBoulangerie = by_boulangerie.reduce(
        (best, current) => (current.ca > best.ca ? current : best),
        by_boulangerie[0],
    );

    return (
        <div className="reporting-page">
            {/* ── PAGE HEADER ── */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Reporting Direction</h1>
                    <p className="page-subtitle">
                        Vue d'ensemble des performances commerciales
                    </p>
                </div>
                <div className="period-badge">
                    <span className="period-dot" />
                    Période en cours
                </div>
            </div>

            {/* ── KPI CARDS ── */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-icon kpi-icon--orange">
                        <DollarSign size={24} strokeWidth={1.5} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">
                            Chiffre d'affaires total
                        </span>
                        <span className="kpi-value">
                            {ca_total.toLocaleString('fr-FR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}{' '}
                            €
                        </span>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon kpi-icon--success">
                        <TrendingUp size={24} strokeWidth={1.5} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Marge brute</span>
                        <span className="kpi-value kpi-value--success">
                            {marge_globale.toLocaleString('fr-FR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}{' '}
                            €
                        </span>
                        <span className="kpi-subvalue">
                            {taux_marge.toFixed(1)}% de marge
                        </span>
                    </div>
                </div>
                <div className="kpi-card">
                    <div
                        className={`kpi-icon ${Number(taux_invendus) > 15 ? 'kpi-icon--danger' : 'kpi-icon--warning'}`}
                    >
                        <TrendingDown size={24} strokeWidth={1.5} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Taux d'invendus</span>
                        <span
                            className={`kpi-value ${Number(taux_invendus) > 15 ? 'kpi-value--danger' : 'kpi-value--warning'}`}
                        >
                            {taux_invendus}%
                        </span>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon kpi-icon--orange">
                        <Store size={24} strokeWidth={1.5} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Sites actifs</span>
                        <span className="kpi-value">
                            {by_boulangerie.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── MEILLEURE PERFORMANCE ── */}
            {meilleureBoulangerie && (
                <div className="highlight-card">
                    <div className="highlight-icon">
                        <Award size={28} strokeWidth={1.5} />
                    </div>
                    <div className="highlight-content">
                        <span className="highlight-label">
                            Meilleure performance
                        </span>
                        <span className="highlight-name">
                            {meilleureBoulangerie.entity.nom}
                        </span>
                        <div className="highlight-stats">
                            <span className="highlight-stat">
                                {meilleureBoulangerie.ca.toLocaleString(
                                    'fr-FR',
                                )}{' '}
                                € CA
                            </span>
                            <span className="highlight-separator">•</span>
                            <span className="highlight-stat">
                                {meilleureBoulangerie.taux_marge.toFixed(1)}%
                                marge
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* ── CHARTS GRID ── */}
            <div className="charts-grid">
                {/* Pie chart */}
                <div className="chart-card">
                    <div className="chart-header">
                        <div className="chart-dot chart-dot--blue" />
                        <span className="chart-title">Répartition du CA</span>
                    </div>
                    <div className="chart-body">
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({ name, percent }) => {
                                        if (percent !== undefined) {
                                            return `${name} ${(percent * 100).toFixed(0)}%`;
                                        }
                                        return name;
                                    }}
                                    labelLine={false}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => {
                                        if (typeof value === 'number') {
                                            return `${value.toLocaleString('fr-FR')} €`;
                                        }
                                        return value;
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="chart-legend">
                            {pieData.map((item, i) => (
                                <div key={i} className="legend-item">
                                    <div
                                        className="legend-dot"
                                        style={{ background: item.color }}
                                    />
                                    <span className="legend-label">
                                        {item.name}
                                    </span>
                                    <span className="legend-value">
                                        {item.value.toLocaleString('fr-FR')} €
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Radial bar for invendus */}
                <div className="chart-card">
                    <div className="chart-header">
                        <div className="chart-dot chart-dot--danger" />
                        <span className="chart-title">
                            Taux d'invendus global
                        </span>
                    </div>
                    <div className="chart-body text-center">
                        <ResponsiveContainer width="100%" height={220}>
                            <RadialBarChart
                                innerRadius="30%"
                                outerRadius="80%"
                                data={[
                                    {
                                        name: 'Invendus',
                                        value: Number(taux_invendus),
                                        fill:
                                            Number(taux_invendus) > 15
                                                ? '#d63b3b'
                                                : '#e8742a',
                                    },
                                ]}
                                startAngle={90}
                                endAngle={-270}
                            >
                                <RadialBar
                                    label={{
                                        position: 'insideStart',
                                        fill: '#fff',
                                        fontWeight: 'bold',
                                    }}
                                    background
                                    dataKey="value"
                                    cornerRadius={10}
                                />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="radial-value">
                            <span className="radial-number">
                                {taux_invendus}%
                            </span>
                            <span className="radial-label">d'invendus</span>
                        </div>
                        <p className="radial-note">Objectif : {'<'} 10%</p>
                    </div>
                </div>
            </div>

            {/* ── BAR CHART PAR BOULANGERIE ── */}
            <div className="chart-card full-width">
                <div className="chart-header">
                    <div className="chart-dot chart-dot--orange" />
                    <span className="chart-title">
                        CA & Marge par boulangerie
                    </span>
                </div>
                <div className="chart-body">
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart
                            data={barDataBoutiques}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="var(--border)"
                            />
                            <XAxis dataKey="nom" tick={{ fontSize: 12 }} />
                            <YAxis
                                tickFormatter={(value) => `${value / 1000}k`}
                            />
                            <Tooltip
                                formatter={(value) => {
                                    if (typeof value === 'number') {
                                        return `${value.toLocaleString('fr-FR')} €`;
                                    }
                                    return value;
                                }}
                            />
                            <Legend />
                            <Bar
                                dataKey="ca"
                                name="CA (€)"
                                fill="#3b5bdb"
                                radius={[4, 4, 0, 0]}
                            />
                            <Bar
                                dataKey="marge"
                                name="Marge (€)"
                                fill="#e8742a"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ── TOP PRODUITS ── */}
            <div className="chart-card full-width">
                <div className="chart-header">
                    <div className="chart-dot chart-dot--success" />
                    <span className="chart-title">
                        Top produits par volume vendu
                    </span>
                </div>
                <div className="chart-body">
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart
                            data={barDataProducts}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="var(--border)"
                            />
                            <XAxis type="number" />
                            <YAxis
                                dataKey="nom"
                                type="category"
                                tick={{ fontSize: 12 }}
                                width={120}
                            />
                            <Tooltip
                                formatter={(value) => {
                                    if (typeof value === 'number') {
                                        return `${value.toLocaleString('fr-FR')} €`;
                                    }
                                    return value;
                                }}
                            />
                            <Bar
                                dataKey="qte"
                                name="Quantité vendue"
                                fill="#1e9e6a"
                                radius={[0, 4, 4, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ── TABLEAU DÉTAILLÉ ── */}
            <div className="table-card">
                <div className="table-header">
                    <div className="table-title">
                        <div className="table-dot" />
                        <span>Performance détaillée par boulangerie</span>
                    </div>
                    <div className="table-count">
                        {by_boulangerie.length} site(s)
                    </div>
                </div>

                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Site</th>
                                <th className="text-right">CA</th>
                                <th className="text-right">Marge</th>
                                <th className="text-right">Taux marge</th>
                                <th className="text-right">Invendus</th>
                                <th className="text-right">Ventes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {by_boulangerie.map((b) => (
                                <tr key={b.entity.id}>
                                    <td className="product-name">
                                        {b.entity.nom}
                                    </td>
                                    <td className="text-success text-right">
                                        {b.ca.toLocaleString('fr-FR')} €
                                    </td>
                                    <td className="text-right">
                                        {b.marge.toLocaleString('fr-FR')} €
                                    </td>
                                    <td className="text-right">
                                        <span className="margin-badge avg">
                                            {b.taux_marge.toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <span
                                            className={`margin-badge ${b.taux_invendus > 15 ? 'low' : b.taux_invendus > 10 ? 'avg' : 'good'}`}
                                        >
                                            {b.taux_invendus.toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="text-muted text-right">
                                        {b.nb_ventes}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mobile-list">
                    {by_boulangerie.map((b) => (
                        <div key={b.entity.id} className="mobile-row">
                            <div className="mobile-row-top">
                                <span className="mobile-name">
                                    {b.entity.nom}
                                </span>
                            </div>
                            <div className="mobile-stats-grid">
                                <div className="mobile-stat">
                                    <span className="mobile-stat-label">
                                        CA
                                    </span>
                                    <span className="mobile-stat-value mobile-stat-value--success">
                                        {b.ca.toLocaleString('fr-FR')} €
                                    </span>
                                </div>
                                <div className="mobile-stat">
                                    <span className="mobile-stat-label">
                                        Marge
                                    </span>
                                    <span className="mobile-stat-value">
                                        {b.marge.toLocaleString('fr-FR')} €
                                    </span>
                                </div>
                                <div className="mobile-stat">
                                    <span className="mobile-stat-label">
                                        Taux marge
                                    </span>
                                    <span className="mobile-stat-value text-orange">
                                        {b.taux_marge.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="mobile-stat">
                                    <span className="mobile-stat-label">
                                        Invendus
                                    </span>
                                    <span
                                        className={`mobile-stat-value ${b.taux_invendus > 15 ? 'text-danger' : 'text-warning'}`}
                                    >
                                        {b.taux_invendus.toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                .reporting-page { display: flex; flex-direction: column; gap: 1.5rem; }

                /* Header */
                .page-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 1rem;
                }
                .page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-1); margin-bottom: 0.25rem; }
                .page-subtitle { font-size: 0.8rem; color: var(--text-3); }
                .period-badge {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.4rem 0.9rem;
                    background: var(--bg-card-2);
                    border: 1px solid var(--border);
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: var(--text-2);
                }
                .period-dot {
                    width: 8px;
                    height: 8px;
                    background: var(--success);
                    border-radius: 50%;
                }

                /* KPI Grid */
                .kpi-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                }
                @media (min-width: 768px) { .kpi-grid { grid-template-columns: repeat(4, 1fr); } }
                .kpi-card {
                    background: var(--bg-card);
                    border-radius: 14px;
                    padding: 1.1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.85rem;
                    border: 1px solid var(--border);
                    transition: all 0.25s ease;
                }
                .kpi-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-sm); }
                .kpi-icon {
                    width: 52px;
                    height: 52px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .kpi-icon--orange { background: rgba(232, 116, 42, 0.1); color: var(--orange); }
                .kpi-icon--success { background: rgba(30, 158, 106, 0.1); color: var(--success); }
                .kpi-icon--warning { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
                .kpi-icon--danger { background: rgba(214, 59, 59, 0.1); color: var(--danger); }
                .kpi-content { flex: 1; }
                .kpi-label { display: block; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; color: var(--text-3); margin-bottom: 0.25rem; }
                .kpi-value { font-size: 1.35rem; font-weight: 800; color: var(--orange); line-height: 1.2; }
                .kpi-value--success { color: var(--success); }
                .kpi-value--warning { color: #f59e0b; }
                .kpi-value--danger { color: var(--danger); }
                .kpi-subvalue { font-size: 0.7rem; color: var(--text-3); display: block; margin-top: 2px; }

                /* Highlight Card */
                .highlight-card {
                    background: linear-gradient(135deg, rgba(232, 116, 42, 0.08), rgba(232, 116, 42, 0.02));
                    border: 1px solid rgba(232, 116, 42, 0.2);
                    border-radius: 14px;
                    padding: 1rem 1.25rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .highlight-icon {
                    width: 56px;
                    height: 56px;
                    border-radius: 28px;
                    background: rgba(232, 116, 42, 0.15);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--orange);
                }
                .highlight-content { flex: 1; }
                .highlight-label { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; color: var(--orange); }
                .highlight-name { font-size: 1rem; font-weight: 700; color: var(--text-1); margin: 0.2rem 0; }
                .highlight-stats { display: flex; gap: 0.5rem; align-items: center; }
                .highlight-stat { font-size: 0.75rem; color: var(--text-2); }
                .highlight-separator { color: var(--text-3); }

                /* Charts Grid */
                .charts-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1.5rem;
                }
                @media (min-width: 768px) { .charts-grid { grid-template-columns: 1fr 1fr; } }
                .chart-card {
                    background: var(--bg-card);
                    border-radius: 14px;
                    border: 1px solid var(--border);
                    overflow: hidden;
                }
                .chart-card.full-width { grid-column: 1 / -1; }
                .chart-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 1rem 1.25rem;
                    border-bottom: 1px solid var(--border);
                }
                .chart-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }
                .chart-dot--blue { background: var(--blue); }
                .chart-dot--orange { background: var(--orange); }
                .chart-dot--success { background: var(--success); }
                .chart-dot--danger { background: var(--danger); }
                .chart-title { font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: var(--text-2); }
                .chart-body { padding: 1.25rem; }
                .chart-legend {
                    display: flex;
                    justify-content: center;
                    gap: 1.5rem;
                    margin-top: 1rem;
                    flex-wrap: wrap;
                }
                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .legend-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                }
                .legend-label { font-size: 0.75rem; color: var(--text-2); }
                .legend-value { font-size: 0.75rem; font-weight: 600; color: var(--text-1); }

                /* Radial chart */
                .radial-value {
                    text-align: center;
                    margin-top: 0.5rem;
                }
                .radial-number {
                    font-size: 2rem;
                    font-weight: 800;
                    color: var(--orange);
                }
                .radial-label {
                    font-size: 0.75rem;
                    color: var(--text-3);
                    margin-left: 0.25rem;
                }
                .radial-note {
                    text-align: center;
                    font-size: 0.7rem;
                    color: var(--text-3);
                    margin-top: 0.5rem;
                }
                .text-center { text-align: center; }

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
                .table-dot { width: 8px; height: 8px; background: var(--orange); border-radius: 50%; }
                .table-count {
                    font-size: 0.7rem;
                    color: var(--text-3);
                    background: var(--bg-card-2);
                    padding: 0.25rem 0.7rem;
                    border-radius: 20px;
                }

                /* Desktop Table */
                .table-wrapper { display: none; overflow-x: auto; }
                @media (min-width: 768px) { .table-wrapper { display: block; } }
                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.875rem;
                }
                .data-table thead tr { border-bottom: 2px solid var(--border); }
                .data-table th {
                    padding: 0.85rem 1rem;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--text-3);
                    text-align: left;
                }
                .data-table th.text-right { text-align: right; }
                .data-table tbody tr { border-bottom: 1px solid var(--border); transition: background 0.2s; }
                .data-table tbody tr:hover { background: var(--bg-card-2); }
                .data-table td {
                    padding: 0.85rem 1rem;
                }
                .data-table td.text-right { text-align: right; }
                .product-name { font-weight: 600; color: var(--text-1); }
                .text-success { color: var(--success); font-weight: 600; }
                .text-orange { color: var(--orange); font-weight: 600; }
                .text-danger { color: var(--danger); font-weight: 600; }
                .text-warning { color: #f59e0b; font-weight: 600; }
                .text-muted { color: var(--text-3); }

                /* Mobile List */
                .mobile-list { display: flex; flex-direction: column; }
                @media (min-width: 768px) { .mobile-list { display: none; } }
                .mobile-row { padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); }
                .mobile-row:last-child { border-bottom: none; }
                .mobile-row-top { margin-bottom: 0.75rem; }
                .mobile-name { font-weight: 600; font-size: 0.9rem; color: var(--text-1); }
                .mobile-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 0.75rem;
                }
                .mobile-stat { display: flex; flex-direction: column; gap: 2px; }
                .mobile-stat-label { font-size: 0.6rem; font-weight: 700; text-transform: uppercase; color: var(--text-3); }
                .mobile-stat-value { font-size: 0.9rem; font-weight: 700; color: var(--text-1); }
                .mobile-stat-value--success { color: var(--success); }

                /* Margin Badges */
                .margin-badge {
                    display: inline-block;
                    padding: 0.2rem 0.5rem;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 600;
                }
                .margin-badge.good { background: rgba(30, 158, 106, 0.1); color: var(--success); }
                .margin-badge.avg { background: rgba(232, 116, 42, 0.1); color: var(--orange); }
                .margin-badge.low { background: rgba(214, 59, 59, 0.1); color: var(--danger); }
            `}</style>
        </div>
    );
}
