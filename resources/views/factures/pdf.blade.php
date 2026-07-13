<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page {
            margin: 1.6cm 1.8cm 2.2cm 1.8cm;
        }
        * {
            box-sizing: border-box;
        }
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            line-height: 1.5;
            color: #1a1a2e;
            background: #ffffff;
        }

        /* ─── VARIABLES DE THÈME (facture vs avoir) ─── */
        /* Appliquées dynamiquement via les classes .theme-facture / .theme-avoir */
        .theme-facture .accent       { color: #e8742a; }
        .theme-facture .accent-bg    { background: #e8742a; }
        .theme-facture .accent-border{ border-color: #e8742a; }
        .theme-avoir   .accent       { color: #7c3aed; }
        .theme-avoir   .accent-bg    { background: #7c3aed; }
        .theme-avoir   .accent-border{ border-color: #7c3aed; }

        /* ─── HEADER ─── */
        .header {
            display: table;
            width: 100%;
            margin-bottom: 20px;
            padding-bottom: 16px;
            border-bottom-width: 3px;
            border-bottom-style: solid;
        }
        .header-left {
            display: table-cell;
            vertical-align: middle;
            width: 60%;
        }
        .header-right {
            display: table-cell;
            vertical-align: middle;
            text-align: right;
            width: 40%;
        }
        .logo-img {
            max-height: 64px;
            max-width: 180px;
            margin-bottom: 6px;
            display: block;
        }
        .logo-placeholder {
            font-size: 20px;
            font-weight: 900;
            letter-spacing: -0.5px;
            margin-bottom: 6px;
        }
        .company-info {
            font-size: 9px;
            color: #666;
            line-height: 1.7;
        }
        .doc-badge {
            color: white;
            padding: 6px 18px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 900;
            letter-spacing: 2px;
            display: inline-block;
            text-transform: uppercase;
        }
        .doc-numero {
            font-size: 11px;
            color: #888;
            margin-top: 5px;
        }

        /* ─── AVOIR BANNER ─── */
        .avoir-banner {
            background: #f5f3ff;
            border: 1px solid #c4b5fd;
            border-left-width: 4px;
            border-left-color: #7c3aed;
            border-radius: 6px;
            padding: 10px 14px;
            margin-bottom: 20px;
            display: table;
            width: 100%;
        }
        .avoir-banner-inner {
            display: table-cell;
            vertical-align: middle;
        }
        .avoir-banner-title {
            font-size: 11px;
            font-weight: 700;
            color: #5b21b6;
            margin-bottom: 2px;
        }
        .avoir-banner-sub {
            font-size: 9.5px;
            color: #7c3aed;
        }

        /* ─── STATUS RIBBON ─── */
        .status-ribbon {
            margin-bottom: 20px;
            padding: 8px 14px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: table;
            width: 100%;
        }
        .status-ribbon-inner {
            display: table-cell;
            vertical-align: middle;
        }
        .status-BROUILLON { background: #fef3c7; color: #92400e; border-left: 4px solid #f59e0b; }
        .status-EMISE     { background: #dbeafe; color: #1e40af; border-left: 4px solid #3b82f6; }
        .status-PAYEE     { background: #d1fae5; color: #065f46; border-left: 4px solid #10b981; }
        .status-ANNULEE   { background: #fee2e2; color: #991b1b; border-left: 4px solid #ef4444; }

        /* ─── PARTIES ─── */
        .parties-section {
            display: table;
            width: 100%;
            margin-bottom: 20px;
            border-collapse: separate;
            border-spacing: 10px 0;
        }
        .party-box {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            background: #f8f9fa;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 14px 14px;
        }
        .party-label {
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
            padding-bottom: 6px;
            border-bottom: 1px solid #e5e7eb;
        }
        .party-logo {
            max-height: 36px;
            max-width: 110px;
            margin-bottom: 6px;
            display: block;
        }
        .party-name {
            font-size: 13px;
            font-weight: 800;
            color: #1a1a2e;
            margin-bottom: 3px;
        }
        .party-address {
            font-size: 9.5px;
            color: #555;
            line-height: 1.6;
        }
        .party-type-badge {
            display: inline-block;
            margin-top: 8px;
            color: white;
            font-size: 8px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 20px;
            text-transform: uppercase;
        }
        .badge-labo { background: #e8742a; }
        .badge-boutique { background: #3b82f6; }

        /* ─── META GRID ─── */
        .meta-grid {
            display: table;
            width: 100%;
            margin-bottom: 20px;
            border-collapse: separate;
            border-spacing: 8px 0;
        }
        .meta-cell {
            display: table-cell;
            width: 33.333%;
            background: #f8f9fa;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 10px 14px;
            vertical-align: top;
        }
        .meta-cell-label {
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #aaa;
            margin-bottom: 4px;
        }
        .meta-cell-value {
            font-size: 11px;
            font-weight: 700;
            color: #1a1a2e;
        }
        .meta-cell-sub {
            font-size: 9px;
            color: #888;
            margin-top: 2px;
        }

        /* ─── TABLE ─── */
        .section-title {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
            padding-bottom: 5px;
            border-bottom-width: 2px;
            border-bottom-style: solid;
        }
        table.lines {
            width: 100%;
            border-collapse: collapse;
        }
        table.lines thead tr {
            background: #1a1a2e;
            color: white;
        }
        table.lines th {
            padding: 9px 12px;
            font-size: 8.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: left;
        }
        table.lines th.r { text-align: right; }
        table.lines tbody tr:nth-child(even) {
            background: #f8f9fa;
        }
        table.lines td {
            padding: 9px 12px;
            border-bottom: 1px solid #f0f0f0;
            font-size: 10px;
            vertical-align: top;
        }
        table.lines td.r { text-align: right; }
        table.lines tbody tr:last-child td { border-bottom: none; }
        .product-name {
            font-weight: 700;
            color: #1a1a2e;
        }
        .product-category {
            font-size: 8.5px;
            color: #aaa;
            margin-top: 2px;
        }
        .lot-ref {
            font-family: 'Courier New', monospace;
            font-size: 9px;
            background: #eef2ff;
            color: #3b5bdb;
            padding: 1px 5px;
            border-radius: 3px;
            display: inline-block;
        }
        .dlc-text {
            font-size: 9px;
            color: #666;
            margin-top: 3px;
        }

        /* ─── TOTAL ─── */
        .total-wrapper {
            display: table;
            width: 100%;
            margin-top: 6px;
        }
        .total-spacer {
            display: table-cell;
            width: 58%;
        }
        .total-box {
            display: table-cell;
            width: 42%;
            vertical-align: top;
        }
        .total-lines-wrap {
            background: #f8f9fa;
            border: 1px solid #e5e7eb;
            border-radius: 8px 8px 0 0;
            overflow: hidden;
        }
        .total-line {
            display: table;
            width: 100%;
            padding: 7px 14px;
            border-bottom: 1px solid #efefef;
        }
        .total-line:last-child { border-bottom: none; }
        .total-line-label {
            display: table-cell;
            font-size: 10px;
            color: #555;
        }
        .total-line-value {
            display: table-cell;
            text-align: right;
            font-size: 10px;
            font-weight: 700;
            color: #1a1a2e;
        }
        .grand-total-box {
            color: white;
            border-radius: 0 0 8px 8px;
            padding: 12px 14px;
            display: table;
            width: 100%;
        }
        .grand-total-label {
            display: table-cell;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.5px;
        }
        .grand-total-value {
            display: table-cell;
            text-align: right;
            font-size: 17px;
            font-weight: 900;
        }

        /* ─── NOTES ─── */
        .notes-section {
            margin-top: 20px;
            padding: 12px 14px;
            background: #fffbeb;
            border: 1px solid #fcd34d;
            border-left: 4px solid #f59e0b;
            border-radius: 6px;
        }
        .notes-label {
            font-size: 8.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #92400e;
            margin-bottom: 5px;
        }
        .notes-text {
            font-size: 10px;
            color: #555;
            line-height: 1.6;
        }

        /* ─── SIGNATAIRES ─── */
        .signataires {
            display: table;
            width: 100%;
            margin-top: 28px;
            padding-top: 18px;
            border-top: 1px solid #e5e7eb;
        }
        .sig-cell {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding-right: 14px;
        }
        .sig-cell:last-child {
            padding-right: 0;
            padding-left: 14px;
            text-align: right;
        }
        .sig-label {
            font-size: 8.5px;
            font-weight: 700;
            color: #aaa;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 28px;
        }
        .sig-line {
            border-top: 1px solid #ccc;
            padding-top: 5px;
            font-size: 9px;
            color: #888;
        }

        /* ─── FOOTER ─── */
        .footer {
            position: fixed;
            bottom: -1.8cm;
            left: -1.8cm;
            right: -1.8cm;
            padding: 9px 1.8cm;
            background: #f8f9fa;
            border-top-width: 2px;
            border-top-style: solid;
            font-size: 8.5px;
            color: #999;
            text-align: center;
        }
        .footer strong {
            font-weight: 700;
        }
    </style>
</head>
<body>

@php
    $isAvoir = str_contains(strtolower($facture->numero), 'avoir');
    $themeClass = $isAvoir ? 'theme-avoir' : 'theme-facture';
    $accentColor = $isAvoir ? '#7c3aed' : '#e8742a';
    $docLabel = $isAvoir ? 'AVOIR' : 'FACTURE';
@endphp

<div class="{{ $themeClass }}">

    {{-- ─── HEADER ─── --}}
    <div class="header accent-border" style="border-bottom-color: {{ $accentColor }}">
        <div class="header-left">
            @if($facture->entity->logo)
                <img src="{{ public_path('storage/' . $facture->entity->logo) }}" class="logo-img" alt="{{ $facture->entity->nom }}">
            @else
                <div class="logo-placeholder accent" style="color: {{ $accentColor }}">{{ strtoupper($facture->entity->nom) }}</div>
            @endif
            <div class="company-info">
                {{ $facture->entity->adresse ?? 'Zone Industrielle, Cayenne — Guyane Française' }}<br>
                SIRET : {{ $company['siret'] }} &nbsp;|&nbsp; TVA : {{ $company['tva'] }}
            </div>
        </div>
        <div class="header-right">
            <div class="doc-badge accent-bg" style="background: {{ $accentColor }}">{{ $docLabel }}</div>
            <div class="doc-numero">N° {{ $facture->numero }}</div>
        </div>
    </div>

    {{-- ─── AVOIR : bannière explicative ─── --}}
    @if($isAvoir)
    <div class="avoir-banner">
        <div class="avoir-banner-inner">
            <div class="avoir-banner-title">Note de crédit (avoir)</div>
            <div class="avoir-banner-sub">
                Ce document est un avoir émis en compensation ou correction d'une facture précédente.
                @if($facture->notes) — {{ Str::limit($facture->notes, 120) }} @endif
            </div>
        </div>
    </div>
    @endif

    {{-- ─── STATUT ─── --}}
    <div class="status-ribbon status-{{ $facture->statut }}">
        <div class="status-ribbon-inner">
            Statut : <strong>{{ $facture->statut }}</strong>
            @if($facture->generation_auto) &nbsp;·&nbsp; Génération automatique @else &nbsp;·&nbsp; Génération manuelle @endif
            @if($facture->generator) par {{ $facture->generator->nom }} @endif
            @if($facture->validator) &nbsp;·&nbsp; Validé{{ $isAvoir ? '' : 'e' }} par {{ $facture->validator->nom }} @endif
            @if($facture->paid_at) &nbsp;·&nbsp; Réglé le {{ \Carbon\Carbon::parse($facture->paid_at)->format('d/m/Y') }} @endif
        </div>
    </div>

    {{-- ─── PARTIES ─── --}}
    <div class="parties-section">
        <div class="party-box">
            <div class="party-label accent" style="color: {{ $accentColor }}">Émetteur</div>
            @if($facture->entity->logo)
                <img src="{{ public_path('storage/' . $facture->entity->logo) }}" class="party-logo" alt="">
            @endif
            <div class="party-name">{{ $facture->entity->nom }}</div>
            @if($facture->entity->adresse)
                <div class="party-address">{{ $facture->entity->adresse }}</div>
            @endif
            <span class="party-type-badge {{ $facture->entity->type === 'LABO' ? 'badge-labo' : 'badge-boutique' }}"
                  style="{{ $facture->entity->type === 'LABO' ? 'background:'.$accentColor : '' }}">
                {{ $facture->entity->type === 'LABO' ? 'Laboratoire' : 'Boulangerie' }}
            </span>
        </div>
        <div class="party-box">
            <div class="party-label" style="color: #3b82f6">Destinataire</div>
            @if($facture->boulangerie->logo)
                <img src="{{ public_path('storage/' . $facture->boulangerie->logo) }}" class="party-logo" alt="">
            @endif
            <div class="party-name">{{ $facture->boulangerie->nom }}</div>
            @if($facture->boulangerie->adresse)
                <div class="party-address">{{ $facture->boulangerie->adresse }}</div>
            @endif
            <span class="party-type-badge badge-boutique">Boulangerie</span>
        </div>
    </div>

    {{-- ─── META ─── --}}
    <div class="meta-grid">
        <div class="meta-cell">
            <div class="meta-cell-label">Période</div>
            <div class="meta-cell-value">
                {{ \Carbon\Carbon::parse($facture->date_debut)->format('d/m/Y') }} → {{ \Carbon\Carbon::parse($facture->date_fin)->format('d/m/Y') }}
            </div>
            <div class="meta-cell-sub">{{ $facture->periode_type }}</div>
        </div>
        <div class="meta-cell">
            <div class="meta-cell-label">Date d'émission</div>
            <div class="meta-cell-value">{{ now()->format('d/m/Y') }}</div>
            <div class="meta-cell-sub">Généré à {{ now()->format('H:i') }}</div>
        </div>
        <div class="meta-cell">
            <div class="meta-cell-label">{{ $isAvoir ? 'Lignes avoir' : 'Lignes facture' }}</div>
            <div class="meta-cell-value">{{ $facture->lignes->count() }} article(s)</div>
            <div class="meta-cell-sub">Montant TTC</div>
        </div>
    </div>

    {{-- ─── LIGNES ─── --}}
    <div class="section-title accent" style="color: {{ $accentColor }}; border-bottom-color: {{ $accentColor }}">
        {{ $isAvoir ? 'Détail des articles crédités' : 'Détail des prestations' }}
    </div>
    <table class="lines">
        <thead>
            <tr>
                <th style="width:36%">Produit</th>
                <th class="r" style="width:8%">Qté</th>
                <th class="r" style="width:14%">Prix unit.</th>
                <th class="r" style="width:14%">Montant</th>
                <th style="width:28%">Lot / DLC</th>
            </tr>
        </thead>
        <tbody>
            @foreach($facture->lignes as $ligne)
            <tr>
                <td>
                    <div class="product-name">{{ $ligne->product->nom }}</div>
                    @if($ligne->product->category)
                        <div class="product-category">{{ $ligne->product->category->nom }}</div>
                    @endif
                </td>
                <td class="r">{{ $ligne->quantite }}</td>
                <td class="r">{{ number_format($ligne->prix_unitaire, 2, ',', ' ') }} €</td>
                <td class="r" style="font-weight:700;">{{ number_format($ligne->montant, 2, ',', ' ') }} €</td>
                <td>
                    @if($ligne->lot_reference)
                        <span class="lot-ref">{{ $ligne->lot_reference }}</span>
                    @endif
                    @if($ligne->dlc)
                        <div class="dlc-text">DLC : {{ \Carbon\Carbon::parse($ligne->dlc)->format('d/m/Y') }}</div>
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>

    {{-- ─── TOTAL ─── --}}
    <div class="total-wrapper">
        <div class="total-spacer"></div>
        <div class="total-box">
            <div class="total-lines-wrap">
                <div class="total-line">
                    <span class="total-line-label">Sous-total HT</span>
                    <span class="total-line-value">{{ number_format($facture->montant_total, 2, ',', ' ') }} €</span>
                </div>
                <div class="total-line">
                    <span class="total-line-label">TVA (0 %)</span>
                    <span class="total-line-value">0,00 €</span>
                </div>
            </div>
            <div class="grand-total-box accent-bg" style="background: {{ $accentColor }}">
                <span class="grand-total-label">{{ $isAvoir ? 'TOTAL AVOIR' : 'TOTAL TTC' }}</span>
                <span class="grand-total-value">{{ number_format($facture->montant_total, 2, ',', ' ') }} €</span>
            </div>
        </div>
    </div>

    @if($facture->notes && !$isAvoir)
    <div class="notes-section">
        <div class="notes-label">Notes</div>
        <div class="notes-text">{{ $facture->notes }}</div>
    </div>
    @endif

    {{-- ─── SIGNATURES ─── --}}
    <div class="signataires">
        <div class="sig-cell">
            <div class="sig-label">Signature émetteur</div>
            <div class="sig-line">{{ $facture->entity->nom }}</div>
        </div>
        <div class="sig-cell">
            <div class="sig-label">{{ $isAvoir ? 'Signature destinataire' : 'Signature destinataire' }}</div>
            <div class="sig-line">{{ $facture->boulangerie->nom }}</div>
        </div>
    </div>

    {{-- ─── FOOTER ─── --}}
    <div class="footer accent-border" style="border-top-color: {{ $accentColor }}">
        <strong>LE MAEVA</strong> &nbsp;—&nbsp; {{ $docLabel }} {{ $facture->numero }} &nbsp;—&nbsp; Généré le {{ now()->format('d/m/Y à H:i') }} par {{ auth()->user()->nom ?? 'Système' }}
    </div>

</div>
</body>
</html>
