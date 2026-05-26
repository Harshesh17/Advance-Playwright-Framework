/**
 * support/ajv-setup.ts
 * -----------------------------------------------------------------------------
 * Central AJV instance + a Playwright custom expect matcher `toMatchSchema`.
 *
 * Usage in a spec:
 *
 *   import { expect } from '../../fixtures/api-fixtures';
 *   import bookingSchema from '../../schemas/booking.schema.json';
 *
 *   const body = await response.json();
 *   expect(body).toMatchSchema(bookingSchema);
 *
 * The matcher returns AJV's error trail (path + message) when validation
 * fails, so debugging schema mismatches is a one-line read.
 */
import Ajv, { type ErrorObject, type Schema, type ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { expect as baseExpect } from '@playwright/test';

/**
 * Tell the TS compiler that `toMatchSchema` is a real matcher. Without this
 * declaration the IDE flags every call site with "Property 'toMatchSchema'
 * does not exist on type". The merge target is the Playwright Matchers
 * interface.
 */
declare global {
    namespace PlaywrightTest {
        interface Matchers<R> {
            /**
             * AJV draft-07 schema match. Pass the imported JSON schema.
             *
             *   expect(body).toMatchSchema(bookingSchema);
             */
            toMatchSchema(schema: Schema): R;
        }
    }
}

const ajv = new Ajv({
    allErrors: true,
    strict: false,
    verbose: true,
    $data: true,
});
addFormats(ajv);

// Cache compiled validators by schema $id (or by reference identity when
// there's no $id). Recompiling on every call would blow up wall-clock time
// for tests that hit the same schema many times.
const validatorCache = new WeakMap<object, ValidateFunction>();

function getValidator(schema: Schema): ValidateFunction {
    if (typeof schema === 'object' && schema !== null) {
        const cached = validatorCache.get(schema as object);
        if (cached) return cached;
        const compiled = ajv.compile(schema);
        validatorCache.set(schema as object, compiled);
        return compiled;
    }
    return ajv.compile(schema);
}

function formatErrors(errors: ErrorObject[] | null | undefined): string {
    if (!errors || errors.length === 0) return '(no error detail)';
    return errors
        .map((e) => {
            const where = e.instancePath || '(root)';
            const extra = e.params ? ` ${JSON.stringify(e.params)}` : '';
            return `  - ${where} ${e.message ?? ''}${extra}`;
        })
        .join('\n');
}

/**
 * Extend Playwright's expect with `toMatchSchema(schema)`.
 *
 * Why a custom matcher (and not just `expect(ajv.validate(...)).toBe(true)`)?
 * Because we want the failure message to print AJV's full error trail, not
 * just "expected true, got false".
 */
export const expect = baseExpect.extend({
    toMatchSchema(received: unknown, schema: Schema) {
        const validator = getValidator(schema);
        const valid = validator(received);

        if (valid) {
            return {
                pass: true,
                message: () => 'expected payload NOT to match schema, but it did',
            };
        }

        return {
            pass: false,
            message: () =>
                [
                    'Payload did not match JSON schema:',
                    formatErrors(validator.errors),
                    '',
                    'Received:',
                    JSON.stringify(received, null, 2).slice(0, 2000),
                ].join('\n'),
        };
    },
});

export { ajv };
