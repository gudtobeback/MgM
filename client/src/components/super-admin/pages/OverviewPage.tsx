import React, { useEffect, useState } from 'react';
import { Building2, Users, Database, ArrowRight } from 'lucide-react';
import { apiClient } from '../../../services/apiClient';

interface OverviewPageProps {
  onNavigate: (page: any) => void;
}

export function OverviewPage({ onNavigate }: OverviewPageProps) {
  const [stats, setStats] = useState({ companies: 0, users: 0, organizations: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [companies, users] = await Promise.all([
          apiClient.listAdminCompanies(),
          apiClient.listAdminUsers(),
        ]);
        setStats({
          companies: companies.length,
          users: users.length,
          organizations: 0,
        });
      } catch (err) {
        console.error('Overview load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statCards = [
    { label: 'Companies', value: stats.companies, icon: <Building2 size={20} />, page: 'companies' },
    { label: 'Total Users', value: stats.users, icon: <Users size={20} />, page: 'users' },
    { label: 'Audit Events', value: '—', icon: <Database size={20} />, page: 'audit' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
          MSP Overview
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          Manage all companies, users, and system activity from this portal.
        </p>
      </div>

      {loading ? (
        <div style={{ fontSize: '14px', color: 'var(--color-text-tertiary)' }}>Loading…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {statCards.map(card => (
            <div
              key={card.label}
              onClick={() => onNavigate(card.page)}
              style={{
                border: '1px solid var(--color-border-primary)',
                borderRadius: '10px',
                padding: '24px',
                backgroundColor: 'var(--color-bg-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
              }}
            >
              <div style={{
                width: '44px', height: '44px', borderRadius: '10px',
                backgroundColor: '#e8f5eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#2563eb', flexShrink: 0,
              }}>
                {card.icon}
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
                  {card.value}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                  {card.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={() => onNavigate('companies')}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '9px 18px',
            backgroundColor: '#2563eb', color: '#fff',
            border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Manage Companies <ArrowRight size={13} />
        </button>
        <button
          onClick={() => onNavigate('users')}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '9px 18px',
            backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border-primary)', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          View All Users <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
