import fs from 'fs';
import path from 'path';

type AuditRole =
  | 'test_engineer'
  | 'technical_manager'
  | 'quality_manager'
  | 'lab_manager'
  | 'system_admin';

export interface PublicQualityAuditRoute {
  id: string;
  path: string;
  label: string;
  lighthouse: boolean;
  a11y: boolean;
}

export interface AuthenticatedQualityAuditRoute extends PublicQualityAuditRoute {
  role: AuditRole;
}

interface QualityAuditRouteRegistry {
  version: number;
  description: string;
  publicRoutes: PublicQualityAuditRoute[];
  authenticatedRoutes: AuthenticatedQualityAuditRoute[];
}

const REPO_ROOT = path.resolve(__dirname, '../../../../../..');
const REGISTRY_PATH = path.join(REPO_ROOT, 'docs/operations/quality-audit-routes.json');

function assertRouteRegistry(registry: QualityAuditRouteRegistry) {
  if (!Array.isArray(registry.publicRoutes) || !Array.isArray(registry.authenticatedRoutes)) {
    throw new Error(`Invalid quality audit route registry: ${REGISTRY_PATH}`);
  }

  const ids = new Set<string>();

  for (const route of [...registry.publicRoutes, ...registry.authenticatedRoutes]) {
    if (!route.id || ids.has(route.id)) {
      throw new Error(`Duplicate or missing quality audit route id: ${route.id}`);
    }
    ids.add(route.id);

    if (!route.path.startsWith('/')) {
      throw new Error(`Quality audit route path must start with "/": ${route.id}`);
    }
  }

  const automatedAuthenticatedRoutes = registry.authenticatedRoutes.filter(
    (route) => route.lighthouse || route.a11y
  );
  if (automatedAuthenticatedRoutes.length > 0) {
    throw new Error(
      `Authenticated quality audit routes are registry-only until auth audit setup exists: ${automatedAuthenticatedRoutes
        .map((route) => route.id)
        .join(', ')}`
    );
  }
}

export function loadQualityAuditRoutes(): QualityAuditRouteRegistry {
  const raw = fs.readFileSync(REGISTRY_PATH, 'utf8');
  const registry = JSON.parse(raw) as QualityAuditRouteRegistry;

  assertRouteRegistry(registry);

  return registry;
}

export function getPublicA11yRoutes(): PublicQualityAuditRoute[] {
  return loadQualityAuditRoutes().publicRoutes.filter((route) => route.a11y);
}
