import Docker from 'dockerode'
import { DaemonSet, StatelessSet } from '@/types'

class DeleteContainer
{
    docker: Docker;

    constructor()
    {
        this.docker = new Docker()
    }

    async execute(resource: StatelessSet|DaemonSet)
    {
        const container = resource.containers[0]
        const dockerContainers: Docker.ContainerInfo[] = await this.docker.listContainers({ all: true })

        const containerExists: boolean = dockerContainers.flatMap(container => container.Names).includes(`/${container.id}`)

        if(! containerExists) return

        const dockerContainer: Docker.Container = this.docker.getContainer(container.id)

        if((await dockerContainer.inspect()).State.Running) {
            await dockerContainer.stop()
        }

        await dockerContainer.remove()
    }
}

export default DeleteContainer