import _ from 'lodash'
import fs from 'fs'
import YAML from 'yaml'
import ValidateTemplate from '../templates/ValidateTemplate'
import ApiError from '@/api/ApiError';
import { ParsedTemplate } from '@/types'
import { Template } from 'tests'

function assertThatObjectsAreEqual(path: string, actual: any, expected: any): string|null
{
    const prettyActual = JSON.stringify(actual, undefined, 2)
    const prettyExpected = JSON.stringify(expected, undefined, 2)

    if(_.isObject(expected) && _.isObject(actual)) {
        const actualProperties = Object.keys(actual)
        const expectedProperties = Object.keys(expected)
        const missingProperties = expectedProperties
            .map(expectedProperty => actualProperties.includes(expectedProperty) ? null : `'${expectedProperty}'`)
            .filter(Boolean);

        const context = `in ${path}\n\nActual: ${prettyActual}\n\nExpected: ${prettyExpected}`

        if(missingProperties.length > 0) {
            return missingProperties.length === 1
                ? `Missing property ${missingProperties[0]} ${context}.`
                : `Missing properties ${missingProperties.join(', ')} ${context}.`
        }
        
        for(const expectedProperty of expectedProperties) {
            // @ts-ignore
            const actualValue = actual[expectedProperty]
            // @ts-ignore
            const expectedValue = expected[expectedProperty]

            if(_.isString(actualValue) && _.isString(expectedValue)) {
                return actualValue.trim() === expectedValue.trim()
                    ? null
                    : `Value '${actualValue.trim()}' does not equal '${expectedValue.trim()}' ${context}.`
            }

            const nestedPath = path ? `${path} > ${expectedProperty}` : expectedProperty;
            const output = assertThatObjectsAreEqual(nestedPath, actualValue, expectedValue)

            if(output !== null) {
                return output
            }
        }

        return null
    }

    if(_.isString(expected) && _.isString(actual)) {
        return actual.trim() === expected.trim() ? null : `Value '${actual.trim()}' does not equal '${expected.trim()}' in ${path}.`
    }

    return _.isEqual(actual, expected) ? null : `Value '${actual}' does not equal '${expected}' in ${path}.`
}

expect.extend({
    
    async toHaveValidSyntax(template: Template)
    {    
        const error = await (new ValidateTemplate).execute(template.templatePath)

        if(error) {
            return {
                pass: false,
                message: () => `The syntax of the template is invalid.\n\nProblem: ${error.message}`,
            };
        }

        return {
            pass: true,
            message: () => "The syntax of the template is valid.",
        };
    },

    async toFailDueToIncorrectFormInput(
        parsing: Promise<ParsedTemplate>, expectedExceptions: Record<string, string[]> = {}
    )
    {
        let thrownError: ApiError

        try {
            await parsing

            return {
                pass: false,
                message: () => `The template was successfully parsed and did not throw the expected exceptions.`,
            };
        } catch (error) {
            thrownError = error
        }

        if(! (thrownError instanceof ApiError) || thrownError.status !== 422) {
            return {
                pass: false,
                message: () => `Something went wrong.`,
            };
        }

        if(! _.isEqual(thrownError.errors, expectedExceptions)) {
            const prettyActual = JSON.stringify(thrownError.errors, undefined, 2)
            const prettyExpected = JSON.stringify(expectedExceptions, undefined, 2)
            const context = `\n\nActual: ${prettyActual}\n\nExpected: ${prettyExpected}`

            return {
                pass: false,
                message: () => `The template failed parsing but did not throw the expected exceptions. ${context}`,
            };
        }

        return {
            pass: true,
            message: () => `The template failed parsing and did throw the expected exceptions.`,
        };
    },

    async toSucceed(parsing: Promise<ParsedTemplate>)
    {
        try {
            await parsing

            return {
                pass: true,
                message: () => `The template was successfully parsed.`,
            };
        } catch (error) {
            return {
                pass: true,
                message: () => `The template could not be parsed.\n\nProblem: ${JSON.stringify(error?.errors)}`,
            };
        }
    },

    async toMatchParsedTemplate(parsing: Promise<ParsedTemplate>, pathToParsedTemplate: string)
    {
        let actualTemplate

        try {
            actualTemplate = await parsing
        } catch (error) {
            return {
                pass: true,
                message: () => `The template could not be parsed.\n\nProblem: ${JSON.stringify(error?.errors)}`,
            };
        }

        const expectedTemplate = YAML.parse(fs.readFileSync(pathToParsedTemplate).toString())

        const output = assertThatObjectsAreEqual('', actualTemplate, expectedTemplate);

        return {
            pass: output === null,
            message: () => {
                return output
                    ? `The template does not match the expected parsed template.\n\nProblem: ${output}`
                    : `The template matches the expected parsed template.`
            },
        }
    }

});