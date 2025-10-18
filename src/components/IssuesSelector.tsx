import React from 'react';

const ISSUES_BY_SPECIALTY: Record<string, string[]> = {
  general: ['Fever', 'Cough', 'Fatigue', 'Headache'],
  cardiology: ['Chest pain', 'Shortness of breath', 'Palpitations', 'Hypertension concerns'],
  pediatrics: ['Fever (child)', 'Diarrhea (child)', 'Rash', 'Vaccination queries'],
  obstetrics: ['Pregnancy checkup', 'Bleeding', 'Labour pain', 'Prenatal care'],
  neurology: ['Severe headache', 'Seizures', 'Numbness', 'Dizziness'],
  orthopedics: ['Joint pain', 'Fracture', 'Back pain', 'Sports injury'],
  dermatology: ['Rash', 'Acne', 'Itching', 'Skin infection'],
  psychiatry: ['Anxiety', 'Depression', 'Insomnia', 'Behavioral issues'],
  ent: ['Ear pain', 'Sore throat', 'Nasal congestion', 'Hearing loss'],
  ophthalmology: ['Eye pain', 'Blurry vision', 'Red eye', 'Floaters'],
  dental: ['Toothache', 'Gum bleeding', 'Cavity', 'Loose tooth'],
};

interface IssuesSelectorProps {
  specialty?: string | null;
  selected: string[];
  onChange: (selected: string[]) => void;
}

const IssuesSelector: React.FC<IssuesSelectorProps> = ({ specialty, selected, onChange }) => {
  const key = (specialty && specialty.trim()) ? specialty : 'general';
  const issues = ISSUES_BY_SPECIALTY[key] || ISSUES_BY_SPECIALTY['general'];

  const toggle = (issue: string) => {
    if (selected.includes(issue)) onChange(selected.filter((s) => s !== issue));
    else onChange([...selected, issue]);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {issues.map((issue) => (
        <label key={issue} className={`flex items-center gap-2 p-2 border rounded ${selected.includes(issue) ? 'bg-primary/10 border-primary' : ''}`}>
          <input type="checkbox" checked={selected.includes(issue)} onChange={() => toggle(issue)} />
          <span className="text-sm">{issue}</span>
        </label>
      ))}
    </div>
  );
};

export default IssuesSelector;
