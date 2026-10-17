import React, { useMemo, useState } from 'react';
import Icon from '../../components/Icon';
import Menu from '../../components/Menu';
import PageHeading from '../../components/PageHeading';
import { EmptyState, ErrorState, Loading } from '../../components/DataState';
import { api } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { money, toneFor } from '../../lib/presentation';

const RANKING_ICONS = ['paw', 'sparkles', 'services', 'sparkles'];
const PERIODS = [
  { months: 3, label: 'Últimos 3 meses' },
  { months: 7, label: 'Últimos 7 meses' },
];

export default function ReportsView() {
  const reports = useApi(() => api.reports());
  const [period, setPeriod] = useState(7);
  const data = reports.data;

  const cards = data
    ? [
        {
          label: 'Receita no período',
          value: money(data.revenue, 0),
          note: `${data.revenueChangePct >= 0 ? '↑' : '↓'} ${Math.abs(data.revenueChangePct)}% vs. mês anterior`,
        },
        { label: 'Ticket médio', value: money(data.averageTicket, 2), note: 'por atendimento' },
        { label: 'Atendimentos', value: data.appointments, note: 'no período' },
        { label: 'Taxa de retorno', value: `${data.returnRate}%`, note: 'Meta: 75%' },
      ]
    : [];

  const monthly = useMemo(
    () => (data ? data.monthly.slice(-period) : []),
    [data, period],
  );

  const maxRevenue = useMemo(
    () => Math.max(1, ...monthly.map((month) => Number(month.revenue) || 0)),
    [monthly],
  );

  const periodLabel = PERIODS.find((item) => item.months === period)?.label ?? `Últimos ${period} meses`;

  function exportCsv() {
    if (!data) {
      return;
    }
    const rows = [
      ['Relatório Petly', data.periodLabel],
      [],
      ['Indicador', 'Valor'],
      ...cards.map((card) => [card.label, String(card.value)]),
      [],
      ['Mês', 'Faturamento'],
      ...data.monthly.map((month) => [month.month, String(month.revenue)]),
      [],
      ['Serviço', 'Participação (%)', 'Receita'],
      ...data.services.map((service) => [service.name, String(service.sharePct), String(service.revenue)]),
    ];
    const csv = rows
      .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-petly-${data.periodLabel.replace(/\s+/g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeading
        eyebrow="DADOS DO NEGÓCIO"
        title="Relatórios"
        description="Acompanhe resultados e tome decisões com confiança."
        action="Exportar relatório"
        onAction={exportCsv}
      />

      {reports.loading ? (
        <Loading label="Carregando relatórios..." />
      ) : reports.error ? (
        <ErrorState error={reports.error} onRetry={reports.reload} />
      ) : (
        <>
          <div className="report-cards">
            {cards.map((card) => (
              <div key={card.label}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <small>{card.note}</small>
              </div>
            ))}
          </div>

          <div className="reports-grid">
            <section className="workspace-card revenue-chart">
              <div className="card-heading">
                <div>
                  <h2>Faturamento</h2>
                  <p>{data.periodLabel}</p>
                </div>
                <Menu
                  align="right"
                  trigger={<button className="outline-button">{periodLabel}</button>}
                  items={PERIODS.map((item) => ({
                    label: item.label,
                    icon: 'chart',
                    onClick: () => setPeriod(item.months),
                  }))}
                />
              </div>
              <div className="chart-area">
                <div className="chart-y">
                  <span>{money(maxRevenue, 0)}</span>
                  <span>{money(maxRevenue * 0.66, 0)}</span>
                  <span>{money(maxRevenue * 0.33, 0)}</span>
                  <span>0</span>
                </div>
                <div className="bar-chart">
                  {monthly.map((month, index) => (
                    <div key={`${month.month}-${index}`}>
                      <i
                        className={index === monthly.length - 1 ? 'active' : ''}
                        style={{ height: `${Math.round((Number(month.revenue) / maxRevenue) * 100)}%` }}
                        title={money(month.revenue, 0)}
                      />
                      <span>{month.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="workspace-card service-ranking">
              <div className="card-heading">
                <div>
                  <h2>Serviços mais vendidos</h2>
                  <p>Participação no faturamento</p>
                </div>
              </div>

              {data.services.length === 0 ? (
                <EmptyState title="Sem dados de serviços no período." />
              ) : (
                data.services.map((item, index) => (
                  <div className="ranking-row" key={item.name}>
                    <span>{index + 1}</span>
                    <div className={`combo-icon ${toneFor(index)}`}>
                      <Icon name={RANKING_ICONS[index % RANKING_ICONS.length]} size={17} />
                    </div>
                    <div>
                      <strong>{item.name}</strong>
                      <i>
                        <b style={{ width: `${item.sharePct}%` }} />
                      </i>
                    </div>
                    <span>{item.sharePct}%</span>
                  </div>
                ))
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}
