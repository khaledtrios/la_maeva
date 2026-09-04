import { Users, Settings, Building } from 'lucide-react';
import { withLayout } from '@/hooks/withLayout';
import { router } from '@inertiajs/react';
import store from '@/routes/store';

const adminModules = [
    {
        name: 'Gestion des employés',
        description: 'Ajouter, modifier, désactiver des employés',
        icon: Users,
        url: store.employees.url(),
    },
    {
        name: 'Paramètres',
        description: 'Configurer les paramètres de votre boutique',
        icon: Settings,
        url: store.settings.url(),
    },
];

function AdminDashboard() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
                <p className="mt-1 text-sm text-gray-600">
                    Gérez votre boutique et vos employés
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adminModules.map((module) => (
                    <button
                        key={module.name}
                        onClick={() => router.visit(module.url)}
                        className="text-left p-6 bg-white border border-gray-200 rounded-lg hover:border-orange-500 hover:shadow-lg transition-all duration-200"
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-orange-100 rounded-lg text-orange-600">
                                <module.icon size={24} strokeWidth={1.5} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {module.name}
                                </h3>
                                <p className="mt-1 text-sm text-gray-600">
                                    {module.description}
                                </p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default withLayout(AdminDashboard);
