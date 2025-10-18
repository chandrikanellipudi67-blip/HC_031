import React from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface FilterValues {
  specialty: string;
  minRating: number | null;
  insurance: string;
  telemedicine: boolean;
  delivery: boolean;
  publicOnly: boolean;
  maxCostLevel: number | null; // 1-low,2-mid,3-high
}

interface Props {
  values: FilterValues;
  onChange: (v: Partial<FilterValues>) => void;
}

const FilterModal = ({ values, onChange }: Props) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline">Filters</Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-[360px]">
        <div className="p-4 space-y-4">
          <h3 className="text-lg font-semibold">Filters</h3>

          <div>
            <label className="text-sm">Doctor / Specialty</label>
            <Input value={values.specialty} onChange={(e) => onChange({ specialty: e.target.value })} placeholder="e.g., cardiology, pediatrics" />
          </div>

          <div>
            <label className="text-sm">Minimum rating</label>
            <select value={values.minRating ?? ''} onChange={(e) => onChange({ minRating: e.target.value ? Number(e.target.value) : null })} className="w-full p-2 border rounded">
              <option value="">Any</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
              <option value="4.5">4.5+</option>
            </select>
          </div>

          <div>
            <label className="text-sm">Health insurance</label>
            <Input value={values.insurance} onChange={(e) => onChange({ insurance: e.target.value })} placeholder="e.g., Aetna, Govt Insurance" />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox checked={values.telemedicine} onCheckedChange={(c) => onChange({ telemedicine: Boolean(c) })} />
            <label className="text-sm">Telemedicine / remote consults</label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox checked={values.delivery} onCheckedChange={(c) => onChange({ delivery: Boolean(c) })} />
            <label className="text-sm">Medicine delivery available</label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox checked={values.publicOnly} onCheckedChange={(c) => onChange({ publicOnly: Boolean(c) })} />
            <label className="text-sm">Public / Government facilities only</label>
          </div>

          <div>
            <label className="text-sm">Max cost level</label>
            <select value={values.maxCostLevel ?? ''} onChange={(e) => onChange({ maxCostLevel: e.target.value ? Number(e.target.value) : null })} className="w-full p-2 border rounded">
              <option value="">Any</option>
              <option value="1">Low cost</option>
              <option value="2">Moderate</option>
              <option value="3">High</option>
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => onChange({ specialty: '', minRating: null, insurance: '', telemedicine: false, delivery: false, publicOnly: false, maxCostLevel: null })}>Clear</Button>
            <Button size="sm" onClick={() => { /* Sheet will auto-close via trigger behavior */ }}>Apply</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FilterModal;
