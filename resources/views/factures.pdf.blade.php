<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 5px 0 0; color: #666; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; }
        .text-right { text-align: right; }
        .total { font-size: 16px; font-weight: bold; margin-top: 20px; }
        .footer { margin-top: 40px; font-size: 10px; color: #999; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>FACTURE {{ $facture->numero }}</h1>
        <p>
            <strong>{{ $company['name'] }}</strong><br>
            {{ $company['address'] }}<br>
            SIRET: {{ $company['siret'] }}<br>
            TVA: {{ $company['tva'] }}
        </p>
    </div>

    <div>
        <strong>Émetteur:</strong> {{ $facture->entity->nom }}<br>
        <strong>Destinataire:</strong> {{ $facture->boulangerie->nom }}<br>
        @if($facture->boulangerie->adresse)
            {{ $facture->boulangerie->adresse }}<br>
        @endif
    </div>

    <div style="margin: 20px 0;">
        <strong>Période:</strong> {{ $facture->periode_type }}
        du {{ $facture->date_debut->format('d/m/Y') }} au {{ $facture->date_fin->format('d/m/Y') }}
    </div>

    @if($facture->notes)
        <div style="background: #f9f9f9; padding: 10px; margin-bottom: 20px;">
            <strong>Notes:</strong> {{ $facture->notes }}
        </div>
    @endif

    <table>
        <thead>
            <tr>
                <th>Produit</th>
                <th class="text-right">Quantité</th>
                <th class="text-right">Prix unit.</th>
                <th class="text-right">Montant</th>
                <th>Lot / DLC</th>
            </tr>
        </thead>
        <tbody>
            @foreach($facture->lignes as $ligne)
                <tr>
                    <td>{{ $ligne->product->nom }}</td>
                    <td class="text-right">{{ $ligne->quantite }}</td>
                    <td class="text-right">{{ number_format($ligne->prix_unitaire, 2, ',', ' ') }} €</td>
                    <td class="text-right">{{ number_format($ligne->montant, 2, ',', ' ') }} €</td>
                    <td>
                        @if($ligne->lot_reference)
                            Lot: {{ $ligne->lot_reference }}<br>
                        @endif
                        @if($ligne->dlc)
                            DLC: {{ $ligne->dlc->format('d/m/Y') }}
                        @endif
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="total text-right">
        TOTAL TTC: {{ number_format($facture->montant_total, 2, ',', ' ') }} €
    </div>

    <div class="footer">
        Généré le {{ now()->format('d/m/Y H:i') }}
    </div>
</body>
</html>
