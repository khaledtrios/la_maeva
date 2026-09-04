import { withLayout } from '@/hooks/withLayout';

function Settings() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
                <p className="mt-1 text-sm text-gray-600">
                    Configurez les paramètres de votre boutique
                </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Fonctionnalité en développement
                    </h3>
                    <p className="text-gray-600">
                        Les paramètres de boutique seront disponibles très bientôt.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default withLayout(Settings);
