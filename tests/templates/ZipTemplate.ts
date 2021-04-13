// @ts-ignore
import exec from 'await-exec'
import path from 'path'
import tmp, { DirResult as Directory } from 'tmp'
const escape = require('escape-string-regexp')

tmp.setGracefulCleanup()

class ZipTemplate 
{
    directory: Directory

    constructor()
    {
        this.directory = tmp.dirSync()
    }

    async execute(template_path: string): Promise<Directory>
    {
        await this.copyLatestVersionToDirectory(template_path)
        await this.copyTaggedVersionsToDirectory(template_path)
        await this.zipContentsOfDirectory()
        return this.directory
    }

    async copyLatestVersionToDirectory(template_path: string): Promise<void>
    {
        await exec(`cd ${this.directory.name} && rsync -a ${template_path}/template latest`);
    }

    async copyTaggedVersionsToDirectory(template_path: string): Promise<void>
    {
        const repository_path = path.resolve(template_path, '../../')
        const template_name = path.basename(template_path)
        const tags: string[] = await this.getTags(repository_path, template_name)

        for(const tag of tags) {

            const version = tag.replace(`${template_name}-`, '')
            const escaped_template_path = escape(`${this.directory.name}/${version}/templates/${template_name}`)
            
            await exec(`git clone --depth 1 --branch ${tag} ${repository_path} ${this.directory.name}/${version}`)
            await exec(`find ${this.directory.name}/${version} -mindepth 1 ! -regex '^${escaped_template_path}.*' -delete`)
            await exec(`mv ${this.directory.name}/${version}/templates/${template_name}/* ${this.directory.name}/${version}`)
            await exec(`rm -r ${this.directory.name}/${version}/templates`)
            
        }
    }

    async getTags(repository_path: string, template_name: string): Promise<string[]>
    {
        const output = await exec(`git -C ${repository_path} tag | cat`)

        if(output.stderr) {
            throw output.stderr
        }

        const tags = output.stdout.split("\n").filter((item: string) => {

            return new RegExp(`^${template_name}-\\d+\\.\\d+\\.\\d+$`).test(item)

        })

        return tags
    }

    async zipContentsOfDirectory(): Promise<void>
    {
        await exec(`cd ${this.directory.name} && zip -r template.zip .`);
    }
}

export default ZipTemplate