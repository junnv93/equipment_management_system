/**
 * button-loading codemod
 *
 * Forwards mutation.isPending to the Button `loading` prop across the frontend.
 *
 * Rules:
 *  - Only rewrites <Button> whose import resolves to @/components/ui/button
 *  - Skips <Button asChild> (loading is no-op through Slot)
 *  - Skips AlertDialogCancel / AlertDialogAction (no loading prop)
 *  - Skips buttons that already have a `loading` attribute
 *  - Does NOT remove the `disabled` prop (Button OR-merges disabled || loading)
 *
 * Usage:
 *   pnpm tsx scripts/codemods/button-loading.ts [--dry] [--check]
 *
 *   --dry   : print diff preview, no writes
 *   --check : exit 1 if any Button still lacks loading= (CI gate)
 */

import { Project, SyntaxKind, Node, JsxAttributeLike, JsxAttribute } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, '../../');
const FRONTEND_TSCONFIG = path.join(ROOT, 'apps/frontend/tsconfig.json');
const BUTTON_IMPORT_SUFFIX = '@/components/ui/button';

/** Tags whose Radix implementation doesn't accept loading — never rewrite */
const SKIP_TAGS = new Set(['AlertDialogCancel', 'AlertDialogAction', 'AlertDialogTrigger']);

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const CHECK = args.includes('--check');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isPendingExpression(text: string): boolean {
  return /\bisPending\b/.test(text);
}

/** Extract the isPending sub-expression from a compound disabled value.
 *  e.g. "a.isPending || b.isPending" → "a.isPending || b.isPending"
 *       "a.isPending || someOtherFlag" → "a.isPending"
 *       "a.isPending" → "a.isPending"
 */
function extractPendingPart(expr: string): string {
  // Collect all tokens that contain isPending
  const tokens = expr
    .split(/(\|\||&&)/)
    .map((t) => t.trim())
    .filter((t) => isPendingExpression(t));
  if (tokens.length === 0) return '';
  return tokens.join(' || ');
}

/** Insert attribute string immediately after the `disabled` attribute node */
function insertLoadingAfterDisabled(
  disabledAttr: JsxAttribute,
  loadingValue: string,
  parent: Node
): boolean {
  const attrText = `loading={${loadingValue}}`;

  // Build new attribute list: insert loading right after disabled
  const attributes =
    parent.getKind() === SyntaxKind.JsxOpeningElement
      ? (parent as import('ts-morph').JsxOpeningElement).getAttributes()
      : (parent as import('ts-morph').JsxSelfClosingElement).getAttributes();

  const idx = attributes.indexOf(disabledAttr);
  if (idx === -1) return false;

  // Insert after disabled by manipulating text
  const disabledEnd = disabledAttr.getEnd();
  const sourceFile = disabledAttr.getSourceFile();
  const currentText = sourceFile.getFullText();

  const newText = currentText.slice(0, disabledEnd) + ' ' + attrText + currentText.slice(disabledEnd);
  sourceFile.replaceWithText(newText);
  return true;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const project = new Project({
    tsConfigFilePath: FRONTEND_TSCONFIG,
    skipAddingFilesFromTsConfig: false,
  });

  let totalFiles = 0;
  let totalAdded = 0;
  const violations: string[] = []; // for --check mode
  const modifiedFiles: string[] = [];

  const sourceFiles = project.getSourceFiles().filter((sf) => {
    const fp = sf.getFilePath();
    return (
      fp.includes('/apps/frontend/') &&
      (fp.includes('/components/') || fp.includes('/app/')) &&
      fp.endsWith('.tsx')
    );
  });

  for (const sourceFile of sourceFiles) {
    const filePath = sourceFile.getFilePath();

    // Check if this file imports Button from the correct location
    const hasButtonImport = sourceFile.getImportDeclarations().some((imp) => {
      const moduleSpec = imp.getModuleSpecifierValue();
      return moduleSpec === BUTTON_IMPORT_SUFFIX && imp.getNamedImports().some((n) => n.getName() === 'Button');
    });

    if (!hasButtonImport) continue;

    totalFiles++;
    let fileModified = false;
    let addedInFile = 0;

    const collectButtonTargets = () => {
      const jsxElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement);
      const jsxSelfClosing = sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);
      const allElements = [...jsxElements, ...jsxSelfClosing];
      const targets: Array<{ element: typeof allElements[0]; loadingValue: string; disabledAttr: JsxAttribute }> = [];

      for (const element of allElements) {
        const tagName =
          element.getKind() === SyntaxKind.JsxOpeningElement
            ? (element as import('ts-morph').JsxOpeningElement).getTagNameNode().getText()
            : (element as import('ts-morph').JsxSelfClosingElement).getTagNameNode().getText();

        if (tagName !== 'Button') continue;
        if (SKIP_TAGS.has(tagName)) continue;

        const attributes =
          element.getKind() === SyntaxKind.JsxOpeningElement
            ? (element as import('ts-morph').JsxOpeningElement).getAttributes()
            : (element as import('ts-morph').JsxSelfClosingElement).getAttributes();

        const hasAsChild = attributes.some(
          (a) => Node.isJsxAttribute(a) && a.getNameNode().getText() === 'asChild'
        );
        if (hasAsChild) continue;

        const hasLoading = attributes.some(
          (a) => Node.isJsxAttribute(a) && a.getNameNode().getText() === 'loading'
        );
        if (hasLoading) continue;

        const disabledAttr = attributes.find(
          (a): a is JsxAttribute =>
            Node.isJsxAttribute(a) &&
            a.getNameNode().getText() === 'disabled' &&
            (() => {
              const init = a.getInitializer();
              if (!init || init.getKind() !== SyntaxKind.JsxExpression) return false;
              return isPendingExpression(init.getText());
            })()
        );

        if (!disabledAttr) {
          if (CHECK) {
            const hasPendingAnywhere = attributes.some(
              (a) => Node.isJsxAttribute(a) && isPendingExpression(a.getText())
            );
            if (hasPendingAnywhere) {
              violations.push(`${filePath}: <Button> has isPending attribute but no loading prop`);
            }
          }
          continue;
        }

        const init = disabledAttr.getInitializer()!;
        const exprText = (init as import('ts-morph').JsxExpression).getExpression()?.getText() ?? '';
        const loadingValue = extractPendingPart(exprText);
        if (!loadingValue) continue;

        if (CHECK) {
          violations.push(`${filePath}: <Button disabled={${exprText}}> missing loading prop`);
          continue;
        }

        targets.push({ element, loadingValue, disabledAttr });
      }
      return targets;
    };

    if (DRY) {
      // Single-pass collection in dry mode — no AST mutation
      const targets = collectButtonTargets();
      for (const { loadingValue } of targets) {
        console.log(`[DRY] ${path.relative(ROOT, filePath)}: would add loading={${loadingValue}}`);
        addedInFile++;
      }
    } else {
      // Mutation mode: process one target at a time (AST mutates after each insertion)
      let iterationLimit = 200;
      while (iterationLimit-- > 0) {
        const targets = collectButtonTargets();
        if (targets.length === 0) break;

        const { element, loadingValue, disabledAttr } = targets[0];
        const added = insertLoadingAfterDisabled(disabledAttr, loadingValue, element);
        if (added) {
          addedInFile++;
          fileModified = true;
        } else {
          break; // insertion failed, avoid loop
        }
      }
    }

    if (addedInFile > 0) {
      totalAdded += addedInFile;
      if (!DRY) {
        modifiedFiles.push(`${path.relative(ROOT, filePath)} (+${addedInFile})`);
      }
    }

    if (fileModified && !DRY) {
      sourceFile.saveSync();
    }
  }

  // ---------------------------------------------------------------------------
  // Results
  // ---------------------------------------------------------------------------

  if (CHECK) {
    if (violations.length > 0) {
      console.error(`\n❌ ${violations.length} violation(s) found:\n`);
      violations.forEach((v) => console.error(`  ${v}`));
      process.exit(1);
    } else {
      console.log(`✅ All Button components with isPending already have loading prop`);
      process.exit(0);
    }
  }

  if (DRY) {
    console.log(`\n[DRY] Would add ${totalAdded} loading= attributes across ${totalFiles} files`);
    return;
  }

  if (modifiedFiles.length > 0) {
    console.log(`\n✅ Modified ${modifiedFiles.length} file(s), added ${totalAdded} loading= attr(s):\n`);
    modifiedFiles.forEach((f) => console.log(`  ${f}`));
  } else {
    console.log(`✅ No changes needed — all Buttons already have loading prop (idempotent)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
