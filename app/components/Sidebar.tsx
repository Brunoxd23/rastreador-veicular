import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Define os menus disponíveis para cada tipo de usuário
  const getMenuItems = () => {
    if (!user) return [];

    const staffMenus = [
      { href: '/painel-admin', label: 'Painel Admin', icon: '👑' },
      { href: '/dashboard', label: 'Dashboard', icon: '📊' },
      { href: '/usuarios', label: 'Usuários', icon: '👥' },
      { href: '/veiculos', label: 'Veículos', icon: '🚗' },
      { href: '/tickets', label: 'Tickets', icon: '🎫' },
      { href: '/financeiro', label: 'Financeiro', icon: '💰' },
      { href: '/configuracoes', label: 'Configurações', icon: '⚙️' },
    ];

    const clientMenus = [
      { href: '/dashboard', label: 'Dashboard', icon: '📊' },
      { href: '/meus-veiculos', label: 'Meus Veículos', icon: '🚗' },
      { href: '/tickets', label: 'Suporte', icon: '🎫' },
    ];

    switch (user.role) {
      case 'admin':
      case 'funcionario':
        return staffMenus;
      case 'client':
        return clientMenus;
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <aside className="bg-white shadow-lg w-64 min-h-screen fixed left-0 top-0 z-10">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-purple-600 mb-8">
          {user?.role === 'admin' || user?.role === 'funcionario' ? 'Painel Admin' : 'Sistema'}
        </h1>
        <nav>
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center p-3 rounded-lg transition-colors ${
                    pathname === item.href
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-700 hover:bg-purple-50'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
} 