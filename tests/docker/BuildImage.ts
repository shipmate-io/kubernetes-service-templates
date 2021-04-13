import tmp, { DirResult as Directory } from 'tmp'
// @ts-ignore
import exec from 'await-exec'
import fs from 'fs'
import Docker from 'dockerode'
import mkdirp from 'mkdirp'
import rimraf from 'rimraf'
import tarfs from 'tar-fs'
import { ParsedTemplate, TemplateFiles, Image } from '@/types'

interface ProgressEvent {
    error?: string;
    stream?: string;
}

class BuildImage
{
    docker: Docker

    constructor()
    {
        this.docker = new Docker()
    }

    async execute(code_repository_path: string, template: ParsedTemplate, image: Image): Promise<void>
    {
        const build_directory: Directory = tmp.dirSync()

        try {

            await this.copyCodeRepositoryContentsToBuildFolder(code_repository_path, image, build_directory)

            this.copyImageFilesToBuildFolder(template.files, build_directory)

            const stream: NodeJS.ReadableStream = await this.buildImage(image, build_directory)

            await this.processBuildOutput(stream)

        } finally {
            rimraf.sync(build_directory.name)
        }
    }

    /*
     * Do not copy .git directory and respect .gitignore file.
     */
    async copyCodeRepositoryContentsToBuildFolder(
        code_repository_path: string, image: Image, build_directory: Directory
    ): Promise<void>
    {
        code_repository_path = code_repository_path.replace(/[/]+$/, "")

        await exec(`rsync -azP --delete --exclude='.git' --filter=":- .gitignore" ${code_repository_path}/. ${build_directory.name}/code-repository/`)
    }

    copyImageFilesToBuildFolder(files: TemplateFiles, build_directory: Directory): void
    {
        for (const [path, contents] of Object.entries(files)) {
            const folder_path = path.substring(0, path.lastIndexOf("/"))
            mkdirp.sync(`${build_directory.name}/${folder_path}`)
            fs.writeFileSync(`${build_directory.name}/${path}`, contents)
        }
    }

    async buildImage(image: Image, build_directory: Directory): Promise<NodeJS.ReadableStream>
    {
        const pack = tarfs.pack(build_directory.name)

        return await this.docker.buildImage(pack, {
            dockerfile: image.dockerfile,
            t: image.id,
            buildargs: (image?.arguments || []).reduce((result: Record<string, any>, argument) => {
                result[argument.name] = argument.value
                return result
            }, {})
        })
    }

    async processBuildOutput(stream: NodeJS.ReadableStream): Promise<void>
    {
        await new Promise((resolve, reject) => {

            let progess = ''
            this.docker.modem.followProgress(stream, onFinished, onProgress);

            function onFinished(err: Error|string, output: any) {
                if (err) {
                    reject(err)
                }
                resolve(output)
            }

            function onProgress(event: ProgressEvent) {
                if (event.error) {
                    reject(`An error occurred during the build of the Dockerfile: \n\n ${progess} \n\n ${event.error}`)
                }
                if(event.stream) {
                    progess += event.stream
                    // console.log(event.stream)
                }
            }

        })
    }
}

export default BuildImage