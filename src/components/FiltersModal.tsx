import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import IssuesSelector from './IssuesSelector';

interface FiltersState {
  doctorType: string | null;
  issues?: string[];
  minRating: number | null;
  insurance: string | null;
  openNow: boolean;
  scope: 'nearby' | 'country' | 'world';
  userType: 'rural' | 'urban' | null;
  hospitalLevel: 'primary' | 'secondary' | 'tertiary' | null;
  medicationAvailable: boolean | null;
}

interface FiltersModalProps {
  open: boolean;
  onClose: () => void;
  value: FiltersState;
  onChange: (v: FiltersState) => void;
  onApply: () => void;
  onReset: () => void;
}

const FiltersModal: React.FC<FiltersModalProps> = ({ open, onClose, value, onChange, onApply, onReset }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="w-[95vw] sm:w-3/4 md:w-1/2 lg:w-1/3">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Doctor / Specialty</label>
                    <select value={value.doctorType || ''} onChange={(e) => onChange({ ...value, doctorType: e.target.value || null, issues: [] })} className="w-full p-2 border rounded">
                      <option value="">Any</option>
                      <option value="general">General Practice</option>
                      <option value="cardiology">Cardiology</option>
                      <option value="pediatrics">Pediatrics</option>
                      <option value="obstetrics">Obstetrics / Gynecology</option>
                      <option value="neurology">Neurology</option>
                      <option value="orthopedics">Orthopedics</option>
                      <option value="dermatology">Dermatology</option>
                      <option value="psychiatry">Psychiatry</option>
                      <option value="ent">ENT</option>
                      <option value="ophthalmology">Ophthalmology</option>
                      <option value="dental">Dental</option>
                    </select>
                    <p className="text-xs text-muted-foreground">Pick a specialty to see common issues below.</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium">Select health issues</label>
                    <IssuesSelector specialty={value.doctorType} selected={value.issues || []} onChange={(issues) => onChange({ ...value, issues })} />
                    <p className="text-xs text-muted-foreground">Choose one or more issues so the assistant suggests relevant providers and advice.</p>
                  </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Minimum rating</label>
              <select value={value.minRating ?? ''} onChange={(e) => onChange({ ...value, minRating: e.target.value ? Number(e.target.value) : null })} className="w-full p-2 border rounded">
                <option value="">Any</option>
                <option value={5}>5+</option>
                <option value={4}>4+</option>
                <option value={3}>3+</option>
              </select>
              <p className="text-xs text-muted-foreground">Filter facilities with average rating at or above this value (if available).</p>
            </div>

            <div>
              <label className="text-sm font-medium">Health insurance</label>
              <input value={value.insurance || ''} onChange={(e) => onChange({ ...value, insurance: e.target.value || null })} placeholder="e.g., Aetna, State Insurance" className="w-full p-2 border rounded" />
              <p className="text-xs text-muted-foreground">Prefer facilities that accept a given insurance (best-effort via OSM tags or known list).</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Scope</label>
              <select value={value.scope} onChange={(e) => onChange({ ...value, scope: e.target.value as FiltersState['scope'] })} className="w-full p-2 border rounded">
                <option value="nearby">Nearby (50 km)</option>
                <option value="country">Country-wide</option>
                <option value="world">Worldwide</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">User type</label>
              <select value={value.userType ?? ''} onChange={(e) => onChange({ ...value, userType: e.target.value ? (e.target.value as FiltersState['userType']) : null })} className="w-full p-2 border rounded">
                <option value="">Auto</option>
                <option value="rural">Rural</option>
                <option value="urban">Urban</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Hospital level</label>
              <select value={value.hospitalLevel ?? ''} onChange={(e) => onChange({ ...value, hospitalLevel: e.target.value ? (e.target.value as FiltersState['hospitalLevel']) : null })} className="w-full p-2 border rounded">
                <option value="">Any</option>
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="tertiary">Tertiary</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Medication available</label>
              <select value={value.medicationAvailable === null ? '' : value.medicationAvailable ? 'yes' : 'no'} onChange={(e) => onChange({ ...value, medicationAvailable: e.target.value === '' ? null : e.target.value === 'yes' })} className="w-full p-2 border rounded">
                <option value="">Any</option>
                <option value="yes">Has meds / pharmacy</option>
                <option value="no">No meds</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input id="openNow" type="checkbox" checked={value.openNow} onChange={(e) => onChange({ ...value, openNow: e.target.checked })} />
            <label htmlFor="openNow" className="text-sm">Open now</label>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onReset}>Reset</Button>
            <Button onClick={() => { onApply(); onClose(); }}>Apply</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FiltersModal;
