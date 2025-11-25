import { type DreamEntry } from '~/src/types/dream';
import { formatDate } from '~/src/utils/dateFormatters';
import { DreamEntryCard } from './DreamEntryCard';

interface DreamEntryListProps {
  entries: DreamEntry[];
  onEdit: (entry: DreamEntry) => void;
  onDelete: (id: DreamEntry['_id']) => void;
  canEdit?: boolean;
}

export function DreamEntryList({ entries, onEdit, onDelete, canEdit = true }: DreamEntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-slate-400 dark:text-slate-500 text-lg mb-2">No dream entries yet</div>
        <p className="text-slate-500 dark:text-slate-400">Start recording your dreams to see patterns over time</p>
      </div>
    );
  }

  const groupedEntries = entries.reduce((groups, entry) => {
    const date = entry.dreamDate;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
    return groups;
  }, {} as Record<string, DreamEntry[]>);

  const sortedDates = Object.keys(groupedEntries).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-light text-slate-800 dark:text-slate-200 mb-6">
        Your Dream Journal ({entries.length} {entries.length === 1 ? 'entry' : 'entries'})
      </h2>
      
      {sortedDates.map((date) => (
        <div key={date} className="space-y-4">
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-600 pb-2">
            {formatDate(date)}
            {groupedEntries[date].length > 1 && (
              <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                ({groupedEntries[date].length} entries)
              </span>
            )}
          </h3>
          
          {groupedEntries[date]
            .sort((a, b) => {
              const aTime = a.dreamDateTime || a._creationTime;
              const bTime = b.dreamDateTime || b._creationTime;
              return bTime - aTime;
            })
            .map((entry, index) => (
              <DreamEntryCard
                key={entry._id}
                entry={entry}
              />
            ))}
        </div>
      ))}
    </div>
  );
}
