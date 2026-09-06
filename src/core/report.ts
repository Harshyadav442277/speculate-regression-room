import type { RunArtifact } from './investigation.js';
import { regressionScript as generateRegression, markdownReport as generateReport } from '../../web/export.js';

// Browser, hosted, recorded and CLI exports share these exact generators.
export function regressionScript(artifact: RunArtifact): string { return generateRegression(artifact); }
export function markdownReport(artifact: RunArtifact): string { return generateReport(artifact); }
