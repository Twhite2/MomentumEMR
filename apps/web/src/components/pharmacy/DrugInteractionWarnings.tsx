'use client';

import { AlertTriangle, AlertCircle, Info, XCircle, type LucideIcon } from 'lucide-react';

// Import types locally (will be available after database package is built)
type DrugInteraction = {
  severity: 'critical' | 'major' | 'moderate' | 'minor';
  type: 'interaction' | 'allergy' | 'duplicate' | 'contraindication';
  drug1: string;
  drug2?: string;
  description: string;
  recommendation: string;
};

// Import functions (these will be available from the database package)
import { checkDrugInteractions, getSeverityColor } from '@/lib/drug-interactions';

interface DrugInteractionWarningsProps {
  drugs: Array<{
    drugName: string;
    drugCategory?: string | null;
  }>;
  patientAllergies?: string[];
}

export function DrugInteractionWarnings({ drugs, patientAllergies }: DrugInteractionWarningsProps) {
  // Only check if we have at least one drug
  if (drugs.length === 0 || drugs.every(d => !d.drugName)) {
    return null;
  }

  const interactions = checkDrugInteractions(
    drugs.filter(d => d.drugName),
    patientAllergies
  );

  if (interactions.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">✓</span>
          </div>
          <div>
            <h3 className="font-semibold text-green-900">No interactions detected</h3>
            <p className="text-sm text-green-700 mt-1">
              This prescription appears safe to dispense
            </p>
          </div>
        </div>
      </div>
    );
  }

  const criticalCount = interactions.filter((i: DrugInteraction) => i.severity === 'critical').length;
  const majorCount = interactions.filter((i: DrugInteraction) => i.severity === 'major').length;

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className={`border rounded-lg p-4 ${
        criticalCount > 0 
          ? 'bg-red-50 border-red-200' 
          : 'bg-orange-50 border-orange-200'
      }`}>
        <div className="flex items-start gap-3">
          {criticalCount > 0 ? (
            <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
          )}
          <div>
            <h3 className={`font-semibold ${
              criticalCount > 0 ? 'text-red-900' : 'text-orange-900'
            }`}>
              {criticalCount > 0 ? '🚨 Critical Warnings Detected' : '⚠️ Drug Interaction Warnings'}
            </h3>
            <p className={`text-sm mt-1 ${
              criticalCount > 0 ? 'text-red-700' : 'text-orange-700'
            }`}>
              {criticalCount > 0 && `${criticalCount} critical, `}
              {majorCount > 0 && `${majorCount} major, `}
              {interactions.length} total warning{interactions.length > 1 ? 's' : ''} found
            </p>
          </div>
        </div>
      </div>

      {/* Individual Warnings */}
      <div className="space-y-2">
        {interactions.map((interaction: DrugInteraction, idx: number) => {
          const colors = getSeverityColor(interaction.severity);
          const IconComponent: LucideIcon = getIconForSeverity(interaction.severity);

          return (
            <div
              key={idx}
              className={`border rounded-lg p-4 ${colors.bg} ${colors.border}`}
            >
              <div className="flex items-start gap-3">
                <IconComponent className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                  interaction.severity === 'critical' ? 'text-red-600' :
                  interaction.severity === 'major' ? 'text-orange-600' :
                  interaction.severity === 'moderate' ? 'text-yellow-600' :
                  'text-blue-600'
                }`} />
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold uppercase px-2 py-1 rounded ${
                          interaction.severity === 'critical' ? 'bg-red-200 text-red-900' :
                          interaction.severity === 'major' ? 'bg-orange-200 text-orange-900' :
                          interaction.severity === 'moderate' ? 'bg-yellow-200 text-yellow-900' :
                          'bg-blue-200 text-blue-900'
                        }`}>
                          {interaction.severity}
                        </span>
                        <span className={`text-xs font-semibold uppercase px-2 py-1 rounded ${
                          interaction.type === 'allergy' ? 'bg-red-100 text-red-800' :
                          interaction.type === 'interaction' ? 'bg-purple-100 text-purple-800' :
                          interaction.type === 'duplicate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {interaction.type}
                        </span>
                      </div>
                      <h4 className={`font-semibold mt-2 ${colors.text}`}>
                        {interaction.drug2 
                          ? `${interaction.drug1} ↔ ${interaction.drug2}`
                          : interaction.drug1
                        }
                      </h4>
                    </div>
                  </div>

                  {/* Description */}
                  <p className={`text-sm mt-2 ${colors.text}`}>
                    {interaction.description}
                  </p>

                  {/* Recommendation */}
                  <div className={`mt-3 p-3 rounded ${
                    interaction.severity === 'critical' ? 'bg-red-100' :
                    interaction.severity === 'major' ? 'bg-orange-100' :
                    interaction.severity === 'moderate' ? 'bg-yellow-100' :
                    'bg-blue-100'
                  }`}>
                    <p className="text-sm font-medium">
                      <span className={colors.text}>💡 Recommendation:</span>{' '}
                      {interaction.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Warning for Critical */}
      {criticalCount > 0 && (
        <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4">
          <p className="text-sm font-semibold text-red-900 text-center">
            ⛔ Critical interactions detected. Review prescription before proceeding.
          </p>
        </div>
      )}
    </div>
  );
}

function getIconForSeverity(severity: DrugInteraction['severity']): LucideIcon {
  switch (severity) {
    case 'critical':
      return XCircle;
    case 'major':
      return AlertTriangle;
    case 'moderate':
      return AlertCircle;
    case 'minor':
      return Info;
  }
}
