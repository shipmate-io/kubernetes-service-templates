import UninstallTemplate from './actions/UninstallTemplate'
import { Entrypoint, ParsedTemplate, StatelessSet } from '@/types'

export default class Service
{
    parsedTemplate: ParsedTemplate

    constructor(parsedTemplate: ParsedTemplate)
    {
        this.parsedTemplate = parsedTemplate
    }
    
    getStatelessSet(name: string): StatelessSet|null
    {
        for(const resource of this.parsedTemplate.template.deployment) {
            if(resource.type !== 'stateless_set') continue
            if(resource.name === name) return resource
        }

        return null
    }

    getEntrypoint(name: string): Entrypoint|null
    {
        for(const resource of this.parsedTemplate.template.deployment) {
            if(resource.type !== 'entrypoint') continue
            if(resource.name === name) return resource
        }

        return null
    }

    async uninstall(): Promise<void>
    {
        return await (new UninstallTemplate).execute(this.parsedTemplate)
    }
}