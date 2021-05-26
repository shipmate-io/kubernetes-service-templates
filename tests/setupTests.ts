import ValidateTemplate from './templates/ValidateTemplate'
import { Template } from 'tests'

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

});