import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Shield } from 'lucide-react';

export function Settings() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-bold bg-gradient-to-r from-red-700 to-red-900 bg-clip-text text-transparent">
        Paramètres du compte
      </h1>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Informations personnelles</h2>

        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <User className="size-5 text-red-700 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Nom d'utilisateur</p>
              <p className="font-medium text-gray-900">{user?.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <Mail className="size-5 text-red-700 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <Shield className="size-5 text-red-700 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Rôle</p>
              <p className="font-medium text-gray-900">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
