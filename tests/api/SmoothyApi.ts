import axios from 'axios'
import FormData from 'form-data'
import ApiError from '@/api/ApiError'
import { ParsedTemplate, ImportedTemplate, Variables } from '@/types'

export default class SmoothyApi {

    host = process.env.SMOOTHY_API_HOST ? process.env.SMOOTHY_API_HOST : "https://api.smoothy.cloud"

    async validateTemplate(form: FormData): Promise<void>
    {
        try {
            await axios.post(`${this.host}/v1/service-templates/local/validate`, form, {
                headers: {
                    ...form.getHeaders()
                }
            })
        } catch (error) {
            throw new ApiError(error.response)
        }
    }

    async importTemplate(form: FormData): Promise<ImportedTemplate>
    {
        try {
            const response = await axios.post(`${this.host}/v1/service-templates/local/import`, form, {
                headers: {
                    ...form.getHeaders()
                }
            })

            return response.data.data
        } catch (error) {
            throw new ApiError(error.response)
        }
    }

    async parseTemplate(
        application_slug: string, service_name: string, template: ParsedTemplate, deployment_type: string, 
        variables: Variables, environment: Variables
    ): Promise<ParsedTemplate>
    {
        try {
            const response = await axios.post(`${this.host}/v1/service-templates/local/parse`, {
                template, 
                deployment_type,
                application_slug, 
                service_name, 
                variables,
                environment_variables: environment,
            })

            return response.data.data
        } catch (error) {
            throw new ApiError(error.response)
        }
    }

}