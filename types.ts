
export type ColumnType = 'numeric' | 'categorical' | 'boolean' | 'date' | 'unknown';

export interface ColumnStats {
  name: string;
  type: ColumnType;
  missingCount: number;
  missingPercentage: number;
  uniqueCount: number;
  // Numeric stats
  mean?: number;
  std?: number;
  min?: number;
  max?: number;
  median?: number;
  q1?: number;
  q3?: number;
  // Categorical stats
  topValues?: { value: string; count: number }[];
}

export interface DataIssue {
  column: string;
  severity: 'low' | 'medium' | 'high';
  type: 'missing_values' | 'constant_column' | 'outliers' | 'skewed' | 'too_many_categories';
  description: string;
}

export interface HypothesisResult {
  title: string;
  description: string;
  conclusion: string;
  strength: 'strong' | 'moderate' | 'weak' | 'none';
  metricValue: number;
  metricLabel: string;
}

export interface ModelPerformance {
  problemType: 'classification' | 'regression';
  metricName: string;
  metricValue: number;
  featureImportance: { column: string; score: number }[];
  targetName: string;
}

export interface AnalysisResult {
  id: string;
  timestamp: number;
  fileName: string;
  rowCount: number;
  columnCount: number;
  columns: ColumnStats[];
  issues: DataIssue[];
  hypotheses: HypothesisResult[];
  model?: ModelPerformance;
  log: string[];
}

export type AnalysisMode = 'Auto' | 'Classification' | 'Regression' | 'Just Explore';
