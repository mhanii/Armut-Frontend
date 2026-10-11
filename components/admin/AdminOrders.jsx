'use client';
import { fmtDate } from '@/lib/date.js';
import { money } from '@/lib/money.js';
import React from 'react';
import { PageTitle, AdminCard, AdminTable, StatusPill } from './shell.jsx';

export function AdminOrders({ orders }) {
  return (
    <div>
      <PageTitle eyebrow="Marketplace" title="Orders" />
      <AdminCard style={{ overflow: 'hidden' }}>
        <AdminTable columns={[{ label: 'Order' }, { label: 'Customer' }, { label: 'Vendor' }, { label: 'Deliver to' }, { label: 'Date' }, { label: 'Items', align: 'right' }, { label: 'Total', align: 'right' }, { label: 'Status', align: 'right' }]}>
          {orders.map(o => (
            <tr key={o.id}>
              <td className="strong">#{o.id}</td><td>{o.customer}</td><td>{o.vendor}</td>
              <td className="truncate" title={o.address || ''}>{o.address || '—'}</td><td className="nowrap">{fmtDate(o.date)}</td>
              <td className="num">{o.items}</td>
              <td className="num strong">{money(o.total)}</td>
              <td className="num"><StatusPill status={o.status} /></td>
            </tr>
          ))}
        </AdminTable>
      </AdminCard>
    </div>
  );
}

export function AdminClients({ clients }) {
  return (
    <div>
      <PageTitle eyebrow="Accounts" title="Customers" />
      <AdminCard style={{ overflow: 'hidden' }}>
        <AdminTable columns={[{ label: 'Name' }, { label: 'Email' }, { label: 'Joined' }, { label: 'Orders', align: 'right' }, { label: 'Spent', align: 'right' }, { label: 'Status', align: 'right' }]}>
          {clients.map(c => (
            <tr key={c.id}>
              <td className="strong">{c.name}</td><td>{c.email}</td><td className="nowrap">{fmtDate(c.joined)}</td>
              <td className="num">{c.orders}</td>
              <td className="num strong">{money(c.spent)}</td>
              <td className="num"><StatusPill status={c.status} /></td>
            </tr>
          ))}
        </AdminTable>
      </AdminCard>
    </div>
  );
}
