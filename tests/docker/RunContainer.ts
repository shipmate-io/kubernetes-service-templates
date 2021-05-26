import Docker from 'dockerode'
import { DirResult as Directory } from 'tmp'
import { DaemonSet, Entrypoint, StatelessSet } from '@/types'

type PortBindings = Record<string, Object>

class RunContainer
{
    docker: Docker

    constructor()
    {
        this.docker = new Docker()
    }

    async execute(directory: Directory, resource: StatelessSet|DaemonSet, entrypoints: Entrypoint[])
    {
        const container = resource.containers[0]
        const dockerContainers = await this.docker.listContainers()
        const containerExists = dockerContainers.flatMap(container => container.Names).includes(container.id)

        if(containerExists) return

        const image = container.image
        const command = container.command
        const environment = container.environment || []
        const volumeMounts = container.volume_mounts || []
        const configFileMounts = container.config_file_mounts || []

        const binds: string[] = []

        for(const volumeMount of volumeMounts) {
            binds.push(`${volumeMount.volume}:${volumeMount.mount_path}`)
        }

        for(const configFileMount of configFileMounts) {
            binds.push(`${directory.name}/${configFileMount.config_file}:${configFileMount.mount_path}`)
        }

        const portBindings: PortBindings = {}

        entrypoints
            .filter(entrypoint => entrypoint.target.id === resource.id)
            .forEach(entrypoint => portBindings[`${entrypoint.port}/tcp`] = [ { HostPort: `${entrypoint.host_port}` } ])

        const config: Docker.ContainerCreateOptions = {
            name: container.id,
            Tty: true,
            Env: environment.map(environmentVariable => `${environmentVariable.name}=${environmentVariable.value}`),
            Image: image,
            HostConfig: {
                NetworkMode: 'smoothy',
                Binds: binds,
                PortBindings: portBindings
            }
        }

        if(command) {
            config.Cmd = command
        }
        
        const dockerContainer: Docker.Container = await this.docker.createContainer(config)

        await dockerContainer.start()
    }
}

export default RunContainer