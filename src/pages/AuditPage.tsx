import { useMemo, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { getAudit } from '@/api';
import { EmptyState, ErrorView, PageHeader, useApi } from '@/components/common';
import { Card, Input, Select, Skeleton } from '@/components/ui/primitives';
import { useStore } from '@/store';
import { fmtDate } from '@/lib/utils';

export default function AuditPage() {
  const { data, error, loading } = useApi(getAudit, []);
  const locations = useStore((s) => s.locations);
  const [type, setType] = useState('');
  const [person, setPerson] = useState('');
  const [place, setPlace] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const types = useMemo(() => [...new Set((data ?? []).map((a) => a.action))].sort(), [data]);
  const people = useMemo(() => [...new Set((data ?? []).map((a) => a.userName))].sort(), [data]);

  if (error) return <ErrorView error={error} />;

  const rows = (data ?? []).filter((a) => {
    const t = new Date(a.createdAt).getTime();
    return (!type || a.action === type) && (!person || a.userName === person) && (!place || a.target.startsWith(place)) && (!from || t >= new Date(from).getTime()) && (!to || t <= new Date(to).getTime() + 86_400_000);
  });

  return (
    <>
      <PageHeader title="Журнал" subtitle="Кто и что менял в системе" />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Select value={type} onChange={(e) => setType(e.target.value)} aria-label="Тип события">
          <option value="">Все события</option>
          {types.map((t) => <option key={t}>{t}</option>)}
        </Select>
        <Select value={person} onChange={(e) => setPerson(e.target.value)} aria-label="Человек">
          <option value="">Все люди</option>
          {people.map((t) => <option key={t}>{t}</option>)}
        </Select>
        <Select value={place} onChange={(e) => setPlace(e.target.value)} aria-label="Кофейня">
          <option value="">Все кофейни</option>
          {locations.filter((l) => !l.archived).map((l) => <option key={l.id}>{l.name}</option>)}
        </Select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="С даты" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="По дату" />
      </div>
      {loading ? (
        <Skeleton className="h-80" />
      ) : rows.length === 0 ? (
        <EmptyState icon={ScrollText} title="Событий нет" hint="Измените фильтры." />
      ) : (
        <>
        <Card className="divide-y md:hidden">
          {rows.map((a) => (
            <div key={a.id} className="p-3.5 text-sm">
              <div className="flex justify-between gap-2"><span className="font-medium">{a.userName}</span><span className="text-xs text-muted-foreground">{fmtDate(a.createdAt)}</span></div>
              <div className="mt-0.5">{a.action}</div>
              <div className="text-xs text-muted-foreground">{a.target}</div>
            </div>
          ))}
        </Card>
        <Card className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="p-3.5 font-medium">Когда</th><th className="p-3.5 font-medium">Кто</th><th className="p-3.5 font-medium">Действие</th><th className="p-3.5 font-medium">Объект</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="whitespace-nowrap p-3.5 text-muted-foreground">{fmtDate(a.createdAt)}</td>
                  <td className="p-3.5 font-medium">{a.userName}</td>
                  <td className="p-3.5">{a.action}</td>
                  <td className="p-3.5 text-muted-foreground">{a.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        </>
      )}
    </>
  );
}
