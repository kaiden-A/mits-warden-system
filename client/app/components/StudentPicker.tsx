'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '@/app/lib/api';
import LoadingSpinner from './LoadingSpinner';

export type StudentReason = 'blj' | 'sakit' | 'klinik' | 'lewat';

export interface StudentEntry {
  id: number;
  name: string;
  classLabel: string;
  reason: StudentReason;
}

export const STUDENT_REASON_LABELS: Record<StudentReason, string> = {
  blj: 'B.L.J',
  sakit: 'SAKIT',
  klinik: 'KLINIK',
  lewat: 'LEWAT',
};

export const STUDENT_REASON_ORDER: StudentReason[] = ['blj', 'sakit', 'klinik', 'lewat'];

interface Student {
  id: number;
  ic_number: string;
  name: string;
  gender: 'male' | 'female';
  tingkatan: number;
  kelas: string;
}

function classLabelOf(s: Student): string {
  return `${s.tingkatan} ${s.kelas}`;
}

interface StudentPickerProps {
  hostel: string;
  value: StudentEntry[];
  onChange: (entries: StudentEntry[]) => void;
}

export default function StudentPicker({ hostel, value, onChange }: StudentPickerProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiGet('/api/students')
      .then((data: { total: number; items: Student[] }) => {
        if (!cancelled) setStudents(data?.items || []);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || 'Gagal memuatkan senarai murid.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const gender = hostel === 'Asrama Putera' ? 'male' : hostel === 'Asrama Puteri' ? 'female' : null;

  const classes = useMemo(() => {
    const genderStudents = gender ? students.filter(s => s.gender === gender) : students;
    const set = new Set<string>();
    genderStudents.forEach(s => set.add(classLabelOf(s)));
    return [...set].sort((a, b) => {
      const ta = Number(a.split(' ')[0]);
      const tb = Number(b.split(' ')[0]);
      if (ta !== tb) return ta - tb;
      return a.localeCompare(b);
    });
  }, [students, gender]);

  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    const genderStudents = gender ? students.filter(s => s.gender === gender) : students;
    return genderStudents
      .filter(s => classLabelOf(s) === selectedClass)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students, gender, selectedClass]);

  const selectedIds = new Set(value.map(v => v.id));

  const toggleStudent = (student: Student) => {
    if (selectedIds.has(student.id)) {
      onChange(value.filter(v => v.id !== student.id));
    } else {
      onChange([
        ...value,
        { id: student.id, name: student.name, classLabel: classLabelOf(student), reason: 'sakit' },
      ]);
    }
  };

  const setReason = (id: number, reason: StudentReason) => {
    onChange(value.map(v => (v.id === id ? { ...v, reason } : v)));
  };

  const removeStudent = (id: number) => {
    onChange(value.filter(v => v.id !== id));
  };

  return (
    <div className="border border-paper-line rounded bg-white p-3 sm:p-4">
      <label className="block text-[0.72rem] font-semibold uppercase tracking-wider text-dim-text mb-1.5">
        Pilih Kelas
      </label>
      <select
        value={selectedClass}
        onChange={e => setSelectedClass(e.target.value)}
        disabled={loading || !!error}
        className="w-full px-3 py-2 border border-paper-line rounded bg-white text-sm text-ink-text outline-none focus-visible:border-brass disabled:opacity-60 min-h-[38px]"
      >
        <option value="">{loading ? 'Memuatkan kelas…' : 'Pilih kelas (cth: 4 IMAM NAFI\x27)'}</option>
        {classes.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {error && (
        <p className="text-xs text-red mt-2">Gagal memuatkan murid: {error}</p>
      )}
      {loading && !error && (
        <p className="text-xs text-dim-text mt-2 inline-flex items-center gap-2">
          <LoadingSpinner size={14} />Memuatkan senarai murid…
        </p>
      )}

      {selectedClass && !loading && !error && (
        <ul className="mt-3 max-h-64 overflow-y-auto border border-paper-line rounded divide-y divide-paper-line">
          {classStudents.map(student => {
            const entry = value.find(v => v.id === student.id);
            const checked = !!entry;
            return (
              <li key={student.id} className="px-3 py-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleStudent(student)}
                    className="mt-1 accent-brass"
                  />
                  <span className="flex-1 min-w-0">
                    <span className={`block text-sm font-medium ${checked ? 'text-brass-deep' : 'text-ink-text'}`}>{student.name}</span>
                    <span className="block text-[0.68rem] text-dim-text font-mono">{student.ic_number} · {student.kelas}</span>
                  </span>
                </label>
                {checked && entry && (
                  <div className="flex gap-1.5 flex-wrap pl-6 mt-1.5">
                    {STUDENT_REASON_ORDER.map(reason => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setReason(student.id, reason)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded border transition-colors ${
                          entry.reason === reason
                            ? 'bg-brass-wash border-brass text-brass-deep'
                            : 'bg-transparent border-paper-line text-dim-text hover:border-brass'
                        }`}
                      >
                        {STUDENT_REASON_LABELS[reason]}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {value.length > 0 && (
        <div className="mt-3 rounded-lg bg-brass-wash/40 border border-brass-wash p-3">
          <p className="text-[0.66rem] font-mono font-semibold uppercase tracking-wider text-brass-deep mb-2">
            Dipilih ({value.length})
          </p>
          <ul className="space-y-1.5">
            {value.map(entry => (
              <li key={entry.id} className="flex items-center gap-2 text-sm">
                <span className="flex-1 min-w-0 truncate">
                  <span className="font-medium text-ink-text">{entry.name}</span>
                  <span className="text-dim-text text-xs"> · {entry.classLabel}</span>
                  <span className={`ml-1 text-xs font-semibold ${entry.reason === 'sakit' ? 'text-red' : entry.reason === 'klinik' ? 'text-green' : 'text-brass-deep'}`}>
                    ({STUDENT_REASON_LABELS[entry.reason]})
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => removeStudent(entry.id)}
                  className="text-dim-text hover:text-red text-lg leading-none p-0.5"
                  aria-label={`Buang ${entry.name}`}
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}